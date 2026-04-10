const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Slot = require('../models/Slot');

const toDateOnly = (value) => {
    const date = new Date(value);
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
};

// Create a new booking
exports.createBooking = async (req, res) => {
    try {
        let payload = req.body;

        // Support simple booking payload from frontend form
        if (req.body.customerName && req.body.phone && req.body.serviceId) {
            const service = await Service.findById(req.body.serviceId);
            if (!service) {
                return res.status(404).json({ success: false, error: 'Selected service not found' });
            }

            const selectedVariant = service.variants?.[0];
            if (!selectedVariant) {
                return res.status(400).json({ success: false, error: 'Selected service has no active variant' });
            }

            const preferred = req.body.preferredDate ? toDateOnly(req.body.preferredDate) : toDateOnly(new Date());
            const nextDay = new Date(preferred);
            nextDay.setDate(nextDay.getDate() + 1);

            const slot = await Slot.findOne({
                date: { $gte: preferred, $lt: nextDay },
                isBlocked: false,
                $expr: { $lt: ['$bookedCount', '$capacity'] },
                $or: [{ service: service._id }, { service: null }],
            }).sort({ startTime: 1 });

            if (!slot) {
                return res.status(400).json({
                    success: false,
                    error: 'No slots available for the selected date. Please pick another date.',
                });
            }

            payload = {
                customer: {
                    name: String(req.body.customerName || '').trim(),
                    phone: String(req.body.phone || '').trim(),
                    email: String(req.body.email || '').trim(),
                },
                pet: {
                    name: String(req.body.petName || '').trim(),
                    type: String(req.body.petType || '').trim(),
                    breed: '',
                },
                service: service._id,
                variant: {
                    name: selectedVariant.variantName,
                    price: Number(selectedVariant.price || 0),
                    bookingAmount: Number(selectedVariant.bookingAmount || 0),
                },
                slot: slot._id,
                statusHistory: [{ status: 'pending', note: String(req.body.notes || 'Booking created via quick form').trim() }],
            };
        }

        const booking = await Booking.create(payload);

        // Increase booked count after booking creation
        if (booking?.slot) {
            await Slot.findByIdAndUpdate(booking.slot, { $inc: { bookedCount: 1 } });
        }

        res.status(201).json({
            success: true,
            data: booking
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Get all bookings
exports.getBookings = async (req, res) => {
    try {
        const bookings = await Booking.find();
        res.status(200).json({
            success: true,
            data: bookings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get booking by ID
exports.getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({
                success: false,
                error: 'Booking not found'
            });
        }
        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Update booking
exports.updateBooking = async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!booking) {
            return res.status(404).json({
                success: false,
                error: 'Booking not found'
            });
        }
        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Delete booking
exports.deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findByIdAndDelete(req.params.id);
        if (!booking) {
            return res.status(404).json({
                success: false,
                error: 'Booking not found'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Booking deleted'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
