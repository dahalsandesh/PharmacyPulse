const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const SaleItem = require('../models/SaleItem');
const { authenticate, checkSubscription } = require('../middleware/auth');
const { processSale, voidSale } = require('../services/fifo.service');

router.use(authenticate, checkSubscription);

// POST /api/sales — Record sale with FIFO
router.post('/', async (req, res, next) => {
  try {
    const pharmacyId = req.user.pharmacyId;
    const { items, paymentMethod, discount, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one item required' });
    }

    const result = await processSale(pharmacyId, items, paymentMethod, discount || 0, req.user._id, notes);

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err.message.includes('Insufficient stock')) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
});

// GET /api/sales — List with date filter
router.get('/', async (req, res, next) => {
  try {
    const pharmacyId = req.user.pharmacyId;
    const { from, to, page = 1, limit = 20 } = req.query;

    const query = { pharmacyId };
    if (from || to) {
      query.saleDate = {};
      if (from) query.saleDate.$gte = new Date(from);
      if (to) query.saleDate.$lte = new Date(to);
    }

    const total = await Sale.countDocuments(query);
    const sales = await Sale.find(query)
      .sort({ saleDate: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('soldBy', 'name');

    // Get item count for each sale
    const salesWithItems = await Promise.all(
      sales.map(async (sale) => {
        const items = await SaleItem.find({ saleId: sale._id });
        const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
        return {
          ...sale.toObject(),
          itemCount,
          itemNames: items.map(i => i.medicineName).join(', '),
        };
      })
    );

    res.json({
      success: true,
      data: salesWithItems,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/sales/:id — Sale detail with items
router.get('/:id', async (req, res, next) => {
  try {
    const sale = await Sale.findOne({
      _id: req.params.id,
      pharmacyId: req.user.pharmacyId,
    }).populate('soldBy', 'name');

    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    const items = await SaleItem.find({ saleId: sale._id });

    res.json({ success: true, data: { ...sale.toObject(), items } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/sales/:id — Void sale
router.delete('/:id', async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Void reason is required' });
    }

    const sale = await voidSale(req.params.id, reason, req.user.pharmacyId);
    res.json({ success: true, data: sale, message: 'Sale voided and stock restored' });
  } catch (err) {
    if (err.message.includes('not found') || err.message.includes('already voided')) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
});

module.exports = router;
