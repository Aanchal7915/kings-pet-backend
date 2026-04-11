const crypto = require('crypto');
const Razorpay = require('razorpay');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Slot = require('../models/Slot');
const Setting = require('../models/Setting');

const getRazorpay = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PET_TYPES = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Other'];

const toDateRange = (from, to) => {
  const start = from ? new Date(from) : new Date('1970-01-01');
  const end = to ? new Date(to) : new Date();
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const getAdvanceAmount = async (service) => {
  const variantAdvance = (service?.variants || [])
    .map((variant) => Number(variant.bookingAmount || 0))
    .find((amount) => amount > 0);

  if (variantAdvance) {
    return variantAdvance;
  }

  if (service.useCustomAdvance) {
    return Number(service.customAdvanceAmount || 0);
  }
  const setting = await Setting.findOne({ key: 'advancePaymentAmount' });
  return Number(setting?.value || 0);
};

const getVariant = (service, variantName) => {
  return (service.variants || []).find(
    (v) => v.variantName === variantName && v.isActive !== false
  );
};

const validateCustomer = (customer = {}) => {
  if (!customer.name || !String(customer.name).trim()) return 'Customer name is required';
  if (!/^\d{10}$/.test(String(customer.phone || '').trim())) return 'Phone must be 10 digits';
  if (!customer.petName || !String(customer.petName).trim()) return 'Pet name is required';
  if (!PET_TYPES.includes(customer.petType)) return 'Pet type is invalid';
  return '';
};

const nextBookingId = async () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const prefix = `BK-${yyyy}${mm}${dd}`;

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const count = await Booking.countDocuments({ createdAt: { $gte: start, $lte: end } });
  return `${prefix}-${String(count + 1).padStart(3, '0')}`;
};

exports.createOrder = async (req, res) => {
  try {
    const { serviceId, variantName, slotId } = req.body;
    if (!serviceId || !variantName || !slotId) {
      return res.status(400).json({ success: false, error: 'serviceId, variantName and slotId are required' });
    }

    const [service, slot] = await Promise.all([
      Service.findById(serviceId),
      Slot.findById(slotId),
    ]);

    if (!service || service.isActive === false) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    if (!slot || slot.isBlocked || Number(slot.bookedCount) >= Number(slot.capacity)) {
      return res.status(409).json({ success: false, error: 'Selected slot is not available' });
    }

    const variant = getVariant(service, variantName);
    if (!variant) {
      return res.status(400).json({ success: false, error: 'Selected variant is not available' });
    }

    const fullPrice = Number(variant.price || 0);
    const advanceAmount = Math.min(Number(variant.bookingAmount || (await getAdvanceAmount(service)) || 0), fullPrice);

    const order = await getRazorpay().orders.create({
      amount: Math.round(advanceAmount * 100),
      currency: 'INR',
      receipt: `bk_${Date.now()}`,
    });

    return res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        fullPrice,
        advanceAmount,
        remainingAmount: Math.max(fullPrice - advanceAmount, 0),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      serviceId,
      variantName,
      slotId,
      customer,
    } = req.body;

    const missing = [
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      serviceId,
      variantName,
      slotId,
    ].some((v) => !v);

    if (missing) {
      return res.status(400).json({ success: false, error: 'Missing payment verification fields' });
    }

    const customerError = validateCustomer(customer);
    if (customerError) {
      return res.status(400).json({ success: false, error: customerError });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Invalid payment' });
    }

    const [service, slot] = await Promise.all([
      Service.findById(serviceId),
      Slot.findById(slotId),
    ]);

    if (!service || service.isActive === false) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    const variant = getVariant(service, variantName);
    if (!variant) {
      return res.status(400).json({ success: false, error: 'Selected variant is not available' });
    }

    const fullPrice = Number(variant.price || 0);
    const advanceAmount = Math.min(Number(variant.bookingAmount || (await getAdvanceAmount(service)) || 0), fullPrice);

    const reservedSlot = await Slot.findOneAndUpdate(
      {
        _id: slotId,
        isBlocked: false,
        $expr: { $lt: ['$bookedCount', '$capacity'] },
      },
      { $inc: { bookedCount: 1 } },
      { new: true }
    );

    if (!reservedSlot) {
      return res.status(409).json({ success: false, error: 'Selected slot is no longer available' });
    }

    const booking = await Booking.create({
      bookingId: await nextBookingId(),
      customer: {
        name: String(customer.name).trim(),
        phone: String(customer.phone).trim(),
        petName: String(customer.petName).trim(),
        petType: String(customer.petType).trim(),
        petBreed: String(customer.petBreed || '').trim(),
      },
      service: {
        ref: service._id,
        name: service.name,
      },
      variant: {
        name: variant.variantName,
        fullPrice,
      },
      slot: reservedSlot._id,
      advancePaid: advanceAmount,
      remainingAmount: Math.max(fullPrice - advanceAmount, 0),
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      paymentStatus: 'advance_paid',
      bookingStatus: 'confirmed',
      statusHistory: [
        { status: 'confirmed', changedAt: new Date(), changedBy: 'admin', note: 'Advance paid online' },
      ],
    });

    const populated = await Booking.findById(booking._id).populate('slot').populate('service.ref', 'name slug');

    return res.status(201).json({ success: true, data: populated });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAdminBookings = async (req, res) => {
  try {
    const { status, from, to, search } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.bookingStatus = status;
    }

    if (from || to) {
      const { start, end } = toDateRange(from, to);
      query.createdAt = { $gte: start, $lte: end };
    }

    if (search) {
      const safe = String(search).trim();
      query.$or = [
        { bookingId: { $regex: safe, $options: 'i' } },
        { 'customer.name': { $regex: safe, $options: 'i' } },
        { 'customer.phone': { $regex: safe, $options: 'i' } },
      ];
    }

    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .populate('slot', 'date startTime endTime capacity bookedCount isBlocked')
      .populate('service.ref', 'name slug');

    return res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const ALLOWED_TRANSITIONS = {
  confirmed: ['completed', 'rejected', 'cancelled', 'rejected_refunded', 'cancelled_refunded'],
  cancelled: ['cancelled_refunded'],
  rejected: ['rejected_refunded'],
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { status, note = '' } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const allowed = ALLOWED_TRANSITIONS[booking.bookingStatus] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, error: `Cannot change status from ${booking.bookingStatus} to ${status}` });
    }

    booking.bookingStatus = status;
    if (status === 'cancelled_refunded' || status === 'rejected_refunded') {
      booking.paymentStatus = 'refunded';
    }

    booking.adminNote = String(note || '').trim();
    booking.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: 'admin',
      note: booking.adminNote,
    });

    await booking.save();

    const updated = await Booking.findById(booking._id)
      .populate('slot', 'date startTime endTime capacity bookedCount isBlocked')
      .populate('service.ref', 'name slug');

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.markRemainingReceived = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    booking.paymentStatus = 'fully_paid';
    booking.adminNote = String(req.body?.note || booking.adminNote || '').trim();
    await booking.save();

    return res.status(200).json({ success: true, data: booking });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.rescheduleBooking = async (req, res) => {
  try {
    const { newSlotId, note = '' } = req.body;
    if (!newSlotId) {
      return res.status(400).json({ success: false, error: 'newSlotId is required' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const newSlot = await Slot.findOneAndUpdate(
      {
        _id: newSlotId,
        isBlocked: false,
        $expr: { $lt: ['$bookedCount', '$capacity'] },
      },
      { $inc: { bookedCount: 1 } },
      { new: true }
    );

    if (!newSlot) {
      return res.status(409).json({ success: false, error: 'New slot is not available' });
    }

    const oldSlotId = booking.slot;
    await Slot.findByIdAndUpdate(oldSlotId, { $inc: { bookedCount: -1 } });

    booking.slot = newSlot._id;
    booking.rescheduleHistory.push({
      fromSlot: oldSlotId,
      toSlot: newSlot._id,
      at: new Date(),
      note: String(note).trim(),
    });
    await booking.save();

    const updated = await Booking.findById(booking._id)
      .populate('slot', 'date startTime endTime capacity bookedCount isBlocked')
      .populate('service.ref', 'name slug');

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
