const express = require('express');
const router = express.Router();
const { getAllSEO, updateSectionSEO, initializeDefaultSEO } = require('../controllers/seoController');
const { protect } = require('../middleware/auth');

router.get('/', getAllSEO);
router.post('/update', protect, updateSectionSEO);
router.post('/init', protect, initializeDefaultSEO);

module.exports = router;
