const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Pharmacy = require('../models/Pharmacy');
const { authenticate, authorize } = require('../middleware/auth');

// All admin routes require superadmin
router.use(authenticate, authorize('superadmin'));

// ============ PHARMACIES ============

// GET /api/admin/pharmacies
router.get('/pharmacies', async (req, res, next) => {
  try {
    const pharmacies = await Pharmacy.find().sort({ createdAt: -1 });

    // Get user count per pharmacy
    const results = await Promise.all(
      pharmacies.map(async (p) => {
        const userCount = await User.countDocuments({ pharmacyId: p._id });
        return { ...p.toObject(), userCount };
      })
    );

    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/pharmacies
router.post('/pharmacies', async (req, res, next) => {
  try {
    const { name, address, phone, email, ownerName, subscription } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Pharmacy name is required' });
    }

    const pharmacy = await Pharmacy.create({
      name,
      address,
      phone,
      email,
      ownerName,
      subscription: subscription || { plan: 'free', isActive: true },
    });

    res.status(201).json({ success: true, data: pharmacy });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/pharmacies/:id
router.put('/pharmacies/:id', async (req, res, next) => {
  try {
    const { name, address, phone, email, ownerName, subscription, isActive } = req.body;

    const pharmacy = await Pharmacy.findById(req.params.id);
    if (!pharmacy) {
      return res.status(404).json({ success: false, message: 'Pharmacy not found' });
    }

    if (name !== undefined) pharmacy.name = name;
    if (address !== undefined) pharmacy.address = address;
    if (phone !== undefined) pharmacy.phone = phone;
    if (email !== undefined) pharmacy.email = email;
    if (ownerName !== undefined) pharmacy.ownerName = ownerName;
    if (isActive !== undefined) pharmacy.isActive = isActive;

    if (subscription) {
      if (subscription.plan !== undefined) pharmacy.subscription.plan = subscription.plan;
      if (subscription.startDate !== undefined) pharmacy.subscription.startDate = subscription.startDate;
      if (subscription.endDate !== undefined) pharmacy.subscription.endDate = subscription.endDate;
      if (subscription.isActive !== undefined) pharmacy.subscription.isActive = subscription.isActive;
    }

    await pharmacy.save();
    res.json({ success: true, data: pharmacy });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/pharmacies/:id
router.get('/pharmacies/:id', async (req, res, next) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id);
    if (!pharmacy) {
      return res.status(404).json({ success: false, message: 'Pharmacy not found' });
    }
    const users = await User.find({ pharmacyId: pharmacy._id }).select('-password');
    res.json({ success: true, data: { ...pharmacy.toObject(), users } });
  } catch (err) {
    next(err);
  }
});

// ============ USERS ============

// GET /api/admin/users
router.get('/users', async (req, res, next) => {
  try {
    const query = {};
    if (req.query.pharmacyId) query.pharmacyId = req.query.pharmacyId;
    if (req.query.role) query.role = req.query.role;

    const users = await User.find(query)
      .populate('pharmacyId', 'name')
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/users
router.post('/users', async (req, res, next) => {
  try {
    const { name, email, password, role, pharmacyId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password required' });
    }

    if (role !== 'superadmin' && !pharmacyId) {
      return res.status(400).json({ success: false, message: 'Pharmacy ID required for non-superadmin users' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'staff',
      pharmacyId: role === 'superadmin' ? null : pharmacyId,
    });

    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/users/:id
router.put('/users/:id', async (req, res, next) => {
  try {
    const { name, email, role, pharmacyId, isActive, password } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email.toLowerCase();
    if (role !== undefined) user.role = role;
    if (pharmacyId !== undefined) user.pharmacyId = pharmacyId;
    if (isActive !== undefined) user.isActive = isActive;
    if (password) user.password = password;

    await user.save();
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
