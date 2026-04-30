const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  createRazorpayOrder,
  createOrder,
  getAdminOrders,
  updateOrderStatus,
  markRemainingReceived,
  deleteOrder,
  getMyOrders,
} = require('../controllers/petOrderController');

router.post('/create-razorpay-order', createRazorpayOrder);
router.post('/', createOrder);
router.get('/my', protect, getMyOrders);

router.get('/admin', protect, adminOnly, getAdminOrders);
router.patch('/admin/:id/status', protect, adminOnly, updateOrderStatus);
router.patch('/admin/:id/mark-remaining-received', protect, adminOnly, markRemainingReceived);
router.delete('/admin/:id', protect, adminOnly, deleteOrder);

module.exports = router;
