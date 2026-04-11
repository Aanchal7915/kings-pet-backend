const express = require('express');
const { getSummary } = require('../controllers/analyticsController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/summary', protect, adminOnly, getSummary);

module.exports = router;
