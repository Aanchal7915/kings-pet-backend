const PetOrder = require('../models/PetOrder');
const PetFood = require('../models/PetFood');
const PetListing = require('../models/PetListing');

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

exports.createOrder = async (req, res) => {
  try {
    const { orderType, itemId, quantity = 1, customer = {}, message = '' } = req.body;

    if (!['food', 'pet'].includes(orderType)) {
      return res.status(400).json({ success: false, error: 'Invalid orderType' });
    }
    if (!itemId) {
      return res.status(400).json({ success: false, error: 'itemId is required' });
    }
    const customerError = validateCustomer(customer);
    if (customerError) {
      return res.status(400).json({ success: false, error: customerError });
    }

    let item;
    let refModel;
    if (orderType === 'food') {
      item = await PetFood.findById(itemId);
      refModel = 'PetFood';
      if (!item || !item.isActive) {
        return res.status(404).json({ success: false, error: 'Pet food not found' });
      }
    } else {
      item = await PetListing.findById(itemId);
      refModel = 'PetListing';
      if (!item || !item.isActive || !item.isAvailable) {
        return res.status(404).json({ success: false, error: 'Pet not available' });
      }
    }

    const qty = orderType === 'pet' ? 1 : Math.max(1, Number(quantity || 1));
    const unitPrice = Number(item.price || 0);
    const totalPrice = unitPrice * qty;
    const bookingAmount = Math.min(Number(item.bookingAmount || 0) * qty, totalPrice);

    const order = await PetOrder.create({
      orderId: await nextOrderId(orderType),
      orderType,
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
      bookingAmount,
      remainingAmount: Math.max(totalPrice - bookingAmount, 0),
      message: String(message || '').trim(),
      status: 'pending',
      statusHistory: [
        {
          status: 'pending',
          changedAt: new Date(),
          changedBy: 'customer',
          note: 'Order placed',
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
  confirmed: ['in_progress', 'completed', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
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

    await order.save();
    return res.status(200).json({ success: true, data: order });
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
