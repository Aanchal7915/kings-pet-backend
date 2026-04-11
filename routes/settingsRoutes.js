const express = require('express');
const { getAdvanceAmount, updateAdvanceAmount } = require('../controllers/settingsController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/advance-amount', getAdvanceAmount);
router.put('/advance-amount', protect, adminOnly, updateAdvanceAmount);

module.exports = router;
