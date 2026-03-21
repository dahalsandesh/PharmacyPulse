const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const { authenticate, checkSubscription } = require('../middleware/auth');

router.use(authenticate, checkSubscription);

// GET /api/suppliers
router.get('/', async (req, res, next) => {
  try {
    const pharmacyId = req.user.pharmacyId;
    const suppliers = await Supplier.find({ pharmacyId }).sort({ name: 1 });
    res.json({ success: true, data: suppliers });
  } catch (err) {
    next(err);
  }
});

// POST /api/suppliers
router.post('/', async (req, res, next) => {
  try {
    const pharmacyId = req.user.pharmacyId;
    const supplier = await Supplier.create({ ...req.body, pharmacyId });
    res.status(201).json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
});

// PUT /api/suppliers/:id
router.put('/:id', async (req, res, next) => {
  try {
    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, pharmacyId: req.user.pharmacyId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    res.json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
