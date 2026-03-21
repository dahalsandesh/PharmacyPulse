const express = require('express');
const router = express.Router();
const Medicine = require('../models/Medicine');
const { authenticate, checkSubscription } = require('../middleware/auth');
const { getAllMedicinesWithStock, getMedicineWithStock } = require('../services/stockLevel.service');
const { getExpiringBatches, getLowStockMedicines } = require('../services/alert.service');

router.use(authenticate, checkSubscription);

// GET /api/medicines
router.get('/', async (req, res, next) => {
  try {
    const pharmacyId = req.user.pharmacyId;
    const { search, category, stockStatus, page = 1, limit = 50 } = req.query;

    const results = await getAllMedicinesWithStock(pharmacyId, {
      search,
      category,
      stockStatus,
    });

    // Pagination
    const start = (parseInt(page) - 1) * parseInt(limit);
    const paginated = results.slice(start, start + parseInt(limit));

    res.json({
      success: true,
      data: paginated,
      pagination: {
        total: results.length,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(results.length / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/medicines
router.post('/', async (req, res, next) => {
  try {
    const pharmacyId = req.user.pharmacyId;
    const medicine = await Medicine.create({ ...req.body, pharmacyId });
    res.status(201).json({ success: true, data: medicine });
  } catch (err) {
    next(err);
  }
});

// GET /api/medicines/expiring
router.get('/expiring', async (req, res, next) => {
  try {
    const pharmacyId = req.user.pharmacyId;
    const days = parseInt(req.query.days) || 90;
    const batches = await getExpiringBatches(pharmacyId, days);
    res.json({ success: true, data: batches });
  } catch (err) {
    next(err);
  }
});

// GET /api/medicines/low-stock
router.get('/low-stock', async (req, res, next) => {
  try {
    const pharmacyId = req.user.pharmacyId;
    const medicines = await getLowStockMedicines(pharmacyId);
    res.json({ success: true, data: medicines });
  } catch (err) {
    next(err);
  }
});

// GET /api/medicines/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await getMedicineWithStock(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// PUT /api/medicines/:id
router.put('/:id', async (req, res, next) => {
  try {
    const medicine = await Medicine.findOneAndUpdate(
      { _id: req.params.id, pharmacyId: req.user.pharmacyId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }
    res.json({ success: true, data: medicine });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
