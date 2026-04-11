const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return req.headers['x-auth-token'] || null;
};

const protect = (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change-me');
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid token' });
  }
};

const adminOnly = async (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
  }

  if (req.user.role === 'admin') {
    return next();
  }

  try {
    const user = await User.findById(req.user.id).select('role');
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
    }

    req.user.role = user.role;
    return next();
  } catch (_error) {
    return res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
  }
};

module.exports = { protect, adminOnly };
