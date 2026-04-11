const Slot = require('../models/Slot');

const toMinutes = (time) => {
    const [hours, minutes] = String(time || '').split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
    return hours * 60 + minutes;
};

const toHHMM = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const parseDateRange = (fromDate, toDate, singleDate) => {
    if (singleDate) {
        const start = new Date(singleDate);
        const end = new Date(singleDate);
        end.setDate(end.getDate() + 1);
        return { start, end };
    }
    if (!fromDate && !toDate) return null;

    const start = fromDate ? new Date(fromDate) : new Date('1970-01-01');
    const endBase = toDate ? new Date(toDate) : new Date('2999-12-31');
    const end = new Date(endBase);
    end.setDate(end.getDate() + 1);
    return { start, end };
};

// Get available slots for booking form
exports.getAvailableSlots = async (req, res) => {
    try {
        const { date, fromDate, toDate, serviceId } = req.query;
        const query = {
            isBlocked: false,
            $expr: { $lt: ['$bookedCount', '$capacity'] },
        };

        const range = parseDateRange(fromDate, toDate, date);
        if (range) query.date = { $gte: range.start, $lt: range.end };

        if (serviceId) {
            query.$or = [{ service: serviceId }, { service: null }];
        }

        const slots = await Slot.find(query)
            .populate('service', 'name')
            .sort({ date: 1, startTime: 1 });

        res.status(200).json({ success: true, data: slots });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get slots for admin list
exports.getSlots = async (req, res) => {
    try {
        const { fromDate, toDate, serviceId, includeBlocked } = req.query;
        const query = {};

        const range = parseDateRange(fromDate, toDate);
        if (range) query.date = { $gte: range.start, $lt: range.end };

        if (serviceId) query.service = serviceId;
        if (includeBlocked !== 'true') query.isBlocked = false;

        const slots = await Slot.find(query)
            .populate('service', 'name')
            .sort({ date: 1, startTime: 1 });

        res.status(200).json({ success: true, data: slots });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Generate slots by date and time range
exports.generateSlots = async (req, res) => {
    try {
        const {
            fromDate,
            toDate,
            startTime,
            endTime,
            intervalMinutes = 30,
            capacity = 1,
            serviceId,
        } = req.body;

        if (!fromDate || !toDate || !startTime || !endTime) {
            return res.status(400).json({ success: false, error: 'Missing required slot generation fields' });
        }

        const startMinutes = toMinutes(startTime);
        const endMinutes = toMinutes(endTime);
        const step = Number(intervalMinutes);
        const slotCapacity = Number(capacity);

        if (!startMinutes && startMinutes !== 0) {
            return res.status(400).json({ success: false, error: 'Invalid start time format' });
        }
        if (!endMinutes && endMinutes !== 0) {
            return res.status(400).json({ success: false, error: 'Invalid end time format' });
        }
        if (endMinutes <= startMinutes) {
            return res.status(400).json({ success: false, error: 'End time must be after start time' });
        }
        if (!Number.isFinite(step) || step < 5) {
            return res.status(400).json({ success: false, error: 'Interval must be at least 5 minutes' });
        }
        if (!Number.isFinite(slotCapacity) || slotCapacity < 1) {
            return res.status(400).json({ success: false, error: 'Capacity must be at least 1' });
        }

        const startDate = new Date(fromDate);
        const endDate = new Date(toDate);
        if (endDate < startDate) {
            return res.status(400).json({ success: false, error: 'To date must be on/after from date' });
        }

        const operations = [];
        const cursor = new Date(startDate);
        while (cursor <= endDate) {
            const slotDate = new Date(cursor);

            for (let current = startMinutes; current + step <= endMinutes; current += step) {
                const slotStart = toHHMM(current);
                const slotEnd = toHHMM(current + step);

                operations.push({
                    updateOne: {
                        filter: {
                            date: slotDate,
                            startTime: slotStart,
                            endTime: slotEnd,
                            service: serviceId || null,
                        },
                        update: {
                            $setOnInsert: {
                                date: slotDate,
                                startTime: slotStart,
                                endTime: slotEnd,
                                capacity: slotCapacity,
                                bookedCount: 0,
                                isBlocked: false,
                                service: serviceId || null,
                            },
                        },
                        upsert: true,
                    },
                });
            }

            cursor.setDate(cursor.getDate() + 1);
        }

        let created = 0;
        if (operations.length > 0) {
            const result = await Slot.bulkWrite(operations, { ordered: false });
            created = Number(result.upsertedCount || 0);
        }

        res.status(200).json({ success: true, created });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Create slot (admin only)
exports.createSlot = async (req, res) => {
    try {
        const { date, startTime, endTime, capacity, serviceId } = req.body;

        const startMinutes = toMinutes(startTime);
        const endMinutes = toMinutes(endTime);
        if ((startMinutes || startMinutes === 0) && (endMinutes || endMinutes === 0) && endMinutes <= startMinutes) {
            return res.status(400).json({ success: false, error: 'End time must be after start time' });
        }

        const slot = await Slot.create({
            date,
            startTime,
            endTime,
            capacity: Number(capacity) || 1,
            service: serviceId || null,
            bookedCount: 0,
            isBlocked: false,
        });

        res.status(201).json({ success: true, data: slot });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.toggleSlotBlock = async (req, res) => {
    try {
        const { isBlocked } = req.body;
        const slot = await Slot.findByIdAndUpdate(
            req.params.id,
            { isBlocked: Boolean(isBlocked) },
            { new: true, runValidators: true }
        );
        if (!slot) return res.status(404).json({ success: false, error: 'Slot not found' });
        res.status(200).json({ success: true, data: slot });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Update slot (admin only)
exports.updateSlot = async (req, res) => {
    try {
        const slot = await Slot.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!slot) return res.status(404).json({ success: false, error: 'Slot not found' });
        res.status(200).json({ success: true, data: slot });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Delete slot (admin only)
exports.deleteSlot = async (req, res) => {
    try {
        const slot = await Slot.findById(req.params.id);
        if (!slot) return res.status(404).json({ success: false, error: 'Slot not found' });
        if (Number(slot.bookedCount) > 0) {
            return res.status(400).json({ success: false, error: 'Cannot delete slot with bookings' });
        }
        await slot.deleteOne();
        res.status(200).json({ success: true, message: 'Slot deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
