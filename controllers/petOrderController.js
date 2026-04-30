const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Razorpay = require('razorpay');
const PetOrder = require('../models/PetOrder');
const PetFood = require('../models/PetFood');
const PetListing = require('../models/PetListing');

const getRazorpay = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const computeAmounts = (item, orderType, quantityRaw) => {
  const qty = orderType === 'pet' ? 1 : Math.max(1, Number(quantityRaw || 1));
  const unitPrice = Number(item.price || 0);
  const totalPrice = unitPrice * qty;
  const advancePerUnit = Number(item.bookingAmount || 0);
  const advanceAmount = advancePerUnit > 0
    ? Math.min(advancePerUnit * qty, totalPrice)
    : totalPrice;
  return { qty, unitPrice, totalPrice, advanceAmount };
};

const fetchOrderItem = async (orderType, itemId) => {
  if (orderType === 'food') {
    const item = await PetFood.findById(itemId);
    if (!item || !item.isActive) return { error: 'Pet food not found', status: 404 };
    return { item, refModel: 'PetFood' };
  }
  const item = await PetListing.findById(itemId);
  if (!item || !item.isActive || !item.isAvailable) return { error: 'Pet not available', status: 404 };
  return { item, refModel: 'PetListing' };
};

const tryGetUserIdFromToken = (req) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded?.id || null;
  } catch (_) {
    return null;
  }
};

const validateCustomer = (customer = {}) => {
  if (!customer.name || !String(customer.name).trim()) return 'Name is required';
  if (!/^\d{10}$/.test(String(customer.phone || '').trim())) return 'Phone must be 10 digits';
  return '';
};

const nextOrderId = async (orderType) => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const prefix = orderType === 'food' ? 'FD' : 'PT';
  const id = `${prefix}-${yyyy}${mm}${dd}`;

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const count = await PetOrder.countDocuments({
    orderType,
    createdAt: { $gte: start, $lte: end },
  });
  return `${id}-${String(count + 1).padStart(3, '0')}`;
};

exports.createRazorpayOrder = async (req, res) => {
  try {
    const { orderType, itemId, quantity = 1 } = req.body;
    if (!['food', 'pet'].includes(orderType)) {
      return res.status(400).json({ success: false, error: 'Invalid orderType' });
    }
    if (!itemId) {
      return res.status(400).json({ success: false, error: 'itemId is required' });
    }

    const fetched = await fetchOrderItem(orderType, itemId);
    if (fetched.error) return res.status(fetched.status).json({ success: false, error: fetched.error });

    const { item } = fetched;
    const { qty, totalPrice, advanceAmount } = computeAmounts(item, orderType, quantity);

    const order = await getRazorpay().orders.create({
      amount: Math.round(advanceAmount * 100),
      currency: 'INR',
      receipt: `pt_${Date.now()}`,
    });

    return res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        quantity: qty,
        totalPrice,
        advanceAmount,
        remainingAmount: Math.max(totalPrice - advanceAmount, 0),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const {
      orderType,
      itemId,
      quantity = 1,
      customer = {},
      message = '',
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!['food', 'pet'].includes(orderType)) {
      return res.status(400).json({ success: false, error: 'Invalid orderType' });
    }
    if (!itemId) {
      return res.status(400).json({ success: false, error: 'itemId is required' });
    }
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Missing payment verification fields' });
    }
    const customerError = validateCustomer(customer);
    if (customerError) {
      return res.status(400).json({ success: false, error: customerError });
    }

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Invalid payment signature' });
    }

    const fetched = await fetchOrderItem(orderType, itemId);
    if (fetched.error) return res.status(fetched.status).json({ success: false, error: fetched.error });

    const { item, refModel } = fetched;
    const { qty, unitPrice, totalPrice, advanceAmount } = computeAmounts(item, orderType, quantity);

    const userId = tryGetUserIdFromToken(req);

    const order = await PetOrder.create({
      orderId: await nextOrderId(orderType),
      orderType,
      userId: userId || null,
      customer: {
        name: String(customer.name).trim(),
        phone: String(customer.phone).trim(),
        email: String(customer.email || '').trim(),
        address: String(customer.address || '').trim(),
        city: String(customer.city || '').trim(),
      },
      item: {
        ref: item._id,
        refModel,
        name: item.name,
        image: item.image || '',
        petType: item.petType || '',
        breed: item.breed || '',
      },
      quantity: qty,
      unitPrice,
      totalPrice,
      bookingAmount: advanceAmount,
      remainingAmount: Math.max(totalPrice - advanceAmount, 0),
      message: String(message || '').trim(),
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      paymentStatus: advanceAmount >= totalPrice ? 'fully_paid' : 'advance_paid',
      status: 'confirmed',
      statusHistory: [
        {
          status: 'confirmed',
          changedAt: new Date(),
          changedBy: 'customer',
          note: 'Payment received via Razorpay',
        },
      ],
    });

    return res.status(201).json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAdminOrders = async (req, res) => {
  try {
    const { status, orderType, search } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (orderType && orderType !== 'all') query.orderType = orderType;

    if (search) {
      const safe = String(search).trim();
      query.$or = [
        { orderId: { $regex: safe, $options: 'i' } },
        { 'customer.name': { $regex: safe, $options: 'i' } },
        { 'customer.phone': { $regex: safe, $options: 'i' } },
        { 'item.name': { $regex: safe, $options: 'i' } },
      ];
    }

    const orders = await PetOrder.find(query).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const ALLOWED_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'completed', 'rejected', 'rejected_refunded', 'cancelled', 'cancelled_refunded'],
  in_progress: ['completed', 'cancelled', 'cancelled_refunded'],
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, note = '' } = req.body;
    const order = await PetOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    const allowed = ALLOWED_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot change status from ${order.status} to ${status}`,
      });
    }

    order.status = status;
    order.adminNote = String(note || '').trim();
    order.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: 'admin',
      note: order.adminNote,
    });

    if (order.orderType === 'pet' && status === 'completed') {
      await PetListing.findByIdAndUpdate(order.item.ref, { isAvailable: false });
    }

    if (status === 'cancelled_refunded' || status === 'rejected_refunded') {
      order.paymentStatus = 'refunded';
    }

    await order.save();
    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.markRemainingReceived = async (req, res) => {
  try {
    const order = await PetOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    order.paymentStatus = 'fully_paid';
    order.remainingAmount = 0;
    order.statusHistory.push({
      status: order.status,
      changedAt: new Date(),
      changedBy: 'admin',
      note: 'Remaining payment marked as received by admin',
    });

    await order.save();
    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await PetOrder.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await PetOrder.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    return res.status(200).json({ success: true, data: {} });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
