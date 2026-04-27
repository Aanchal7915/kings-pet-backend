const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  createOrder,
  getAdminOrders,
  updateOrderStatus,
  deleteOrder,
} = require('../controllers/petOrderController');

router.post('/', createOrder);

router.get('/admin', protect, adminOnly, getAdminOrders);
router.patch('/admin/:id/status', protect, adminOnly, updateOrderStatus);
router.delete('/admin/:id', protect, adminOnly, deleteOrder);

module.exports = router;
