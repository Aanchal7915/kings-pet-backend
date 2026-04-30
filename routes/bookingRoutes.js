const express = require('express');
const router = express.Router();
const {
    createOrder,
    verifyPayment,
    getAdminBookings,
    updateBookingStatus,
    markRemainingReceived,
    rescheduleBooking,
    getMyBookings,
} = require('../controllers/bookingController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/create-order', createOrder);
router.post('/verify-payment', verifyPayment);
router.get('/my', protect, getMyBookings);

router.get('/admin', protect, adminOnly, getAdminBookings);
router.patch('/admin/:id/status', protect, adminOnly, updateBookingStatus);
router.patch('/admin/:id/mark-remaining-received', protect, adminOnly, markRemainingReceived);
router.patch('/admin/:id/reschedule', protect, adminOnly, rescheduleBooking);

module.exports = router;
