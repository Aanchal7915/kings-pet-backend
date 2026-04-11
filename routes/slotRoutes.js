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
const { protect, adminOnly } = require('../middleware/auth');

router.get('/available', getAvailableSlots);
router.get('/', protect, adminOnly, getSlots);
router.post('/generate', protect, adminOnly, generateSlots);
router.post('/', protect, adminOnly, createSlot);
router.put('/:id/block', protect, adminOnly, toggleSlotBlock);
router.put('/:id', protect, adminOnly, updateSlot);
router.delete('/:id', protect, adminOnly, deleteSlot);

module.exports = router;
