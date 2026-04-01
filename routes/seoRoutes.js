const express = require('express');
const router = express.Router();
const { getAllSEO, updateSectionSEO, initializeDefaultSEO } = require('../controllers/seoController');
const { protect } = require('../middleware/authMiddleware'); // Assuming you have auth middleware

router.get('/', getAllSEO);
router.post('/update', protect, updateSectionSEO);
router.post('/init', protect, initializeDefaultSEO);

module.exports = router;
