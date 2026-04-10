const express = require('express');
const router = express.Router();
const { 
    getAvailableSlots,
    getSlots,
    generateSlots,
    createSlot,
    toggleSlotBlock,
    updateSlot,
    deleteSlot
} = require('../controllers/slotController');
const { protect } = require('../middleware/auth');

router.get('/available', getAvailableSlots);
router.get('/', getSlots);
router.post('/generate', protect, generateSlots);
router.post('/', protect, createSlot);
router.put('/:id/block', protect, toggleSlotBlock);
router.put('/:id', protect, updateSlot);
router.delete('/:id', protect, deleteSlot);

module.exports = router;
