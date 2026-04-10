const express = require('express');
const router = express.Router();
const { 
    getDoctors, 
    getDoctorsAdmin,
    getDoctorById, 
    createDoctor, 
    updateDoctor, 
    deleteDoctor 
} = require('../controllers/doctorController');
const { protect } = require('../middleware/auth');

router.get('/', getDoctors);
router.get('/admin', protect, getDoctorsAdmin);
router.get('/:id', getDoctorById);
router.post('/', protect, createDoctor);
router.put('/:id', protect, updateDoctor);
router.delete('/:id', protect, deleteDoctor);

module.exports = router;
