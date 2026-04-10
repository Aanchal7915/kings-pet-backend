const Doctor = require('../models/Doctor');

// Get all doctors
exports.getDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find();
        res.status(200).json({
            success: true,
            data: doctors
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get all doctors for admin (includes inactive)
exports.getDoctorsAdmin = async (req, res) => {
    try {
        const doctors = await Doctor.find().sort({ order: 1, createdAt: -1 });
        res.status(200).json({
            success: true,
            data: doctors
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get doctor by ID
exports.getDoctorById = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                error: 'Doctor not found'
            });
        }
        res.status(200).json({
            success: true,
            data: doctor
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Create doctor (admin only)
exports.createDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.create(req.body);
        res.status(201).json({
            success: true,
            data: doctor
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Update doctor (admin only)
exports.updateDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!doctor) {
            return res.status(404).json({
                success: false,
                error: 'Doctor not found'
            });
        }
        res.status(200).json({
            success: true,
            data: doctor
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Delete doctor (admin only)
exports.deleteDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findByIdAndDelete(req.params.id);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                error: 'Doctor not found'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Doctor deleted'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
