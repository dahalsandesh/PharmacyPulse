const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Pharmacy = require('../models/Pharmacy');

// Verify JWT and attach user to request
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    next(err);
  }
};

// Check if user has required role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }
    next();
  };
};

// Check if user's pharmacy has an active subscription
const checkSubscription = async (req, res, next) => {
  try {
    // Superadmin bypasses subscription check
    if (req.user.role === 'superadmin') return next();

    if (!req.user.pharmacyId) {
      return res.status(403).json({
        success: false,
        message: 'No pharmacy assigned to this user',
      });
    }

    const pharmacy = await Pharmacy.findById(req.user.pharmacyId);
    if (!pharmacy) {
      return res.status(404).json({ success: false, message: 'Pharmacy not found' });
    }

    if (!pharmacy.isActive || !pharmacy.subscription.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Pharmacy subscription is inactive. Contact administrator.',
      });
    }

    // Check subscription end date if set
    if (pharmacy.subscription.endDate && new Date(pharmacy.subscription.endDate) < new Date()) {
      return res.status(403).json({
        success: false,
        message: 'Pharmacy subscription has expired. Contact administrator.',
      });
    }

    req.pharmacy = pharmacy;
    next();
  } catch (err) {
    next(err);
  }
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

module.exports = { authenticate, authorize, checkSubscription, generateToken };
