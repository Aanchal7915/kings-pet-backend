const express = require('express');
const { register, login, resetPasswordDirect } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgotpassword', resetPasswordDirect);

module.exports = router;
