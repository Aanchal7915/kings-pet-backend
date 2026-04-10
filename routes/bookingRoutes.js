const express = require('express');
const router = express.Router();
const { 
    createBooking, 
    getBookings, 
    getBookingById, 
    updateBooking, 
    deleteBooking 
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.post('/', createBooking);
router.get('/', getBookings);
router.get('/:id', getBookingById);
router.put('/:id', protect, updateBooking);
router.delete('/:id', protect, deleteBooking);

module.exports = router;
