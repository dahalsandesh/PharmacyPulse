const express = require('express');
const router = express.Router();
const Batch = require('../models/Batch');
const Medicine = require('../models/Medicine');
const Supplier = require('../models/Supplier');
const { authenticate, checkSubscription } = require('../middleware/auth');

router.use(authenticate, checkSubscription);

// GET /api/stock/history — Recent purchases globally
router.get('/history', async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const total = await Batch.countDocuments({ pharmacyId: req.user.pharmacyId });
    const batches = await Batch.find({ pharmacyId: req.user.pharmacyId })
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('medicineId', 'name genericName unit')
      .populate('supplierId', 'name');

    res.json({
      success: true,
      data: batches,
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

// POST /api/stock — Add new batch
router.post('/', async (req, res, next) => {
  try {
    const pharmacyId = req.user.pharmacyId;
    const { medicineId, supplierId, batchNumber, expiryDate, purchaseDate,
      purchasePrice, sellingPrice, initialQuantity, quantity, notes } = req.body;

    const finalQuantity = initialQuantity || quantity;

    if (finalQuantity === undefined || finalQuantity === null) {
      return res.status(400).json({ success: false, message: 'Quantity is required' });
    }

    // Verify medicine belongs to pharmacy
    const medicine = await Medicine.findOne({ _id: medicineId, pharmacyId });
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    // Handle expiry date — MM/YYYY format
    let parsedExpiry = expiryDate;
    if (typeof expiryDate === 'string' && expiryDate.includes('/')) {
      const [month, year] = expiryDate.split('/');
      const dayjs = require('dayjs');
      parsedExpiry = dayjs(`${year}-${month}-01`).endOf('month').toDate();
    }

    const batch = await Batch.create({
      pharmacyId,
      medicineId,
      supplierId,
      batchNumber: batchNumber.toUpperCase(),
      expiryDate: parsedExpiry,
      purchaseDate: purchaseDate || new Date(),
      purchasePrice,
      sellingPrice: sellingPrice || medicine.sellingPrice, // Fallback to medicine's current price
      initialQuantity: finalQuantity,
      quantity: finalQuantity,
      notes,
    });

    res.status(201).json({ success: true, data: batch });
  } catch (err) {
    next(err);
  }
});

// GET /api/stock/:medicineId — All batches for a medicine
router.get('/:medicineId', async (req, res, next) => {
  try {
    const batches = await Batch.find({
      medicineId: req.params.medicineId,
      pharmacyId: req.user.pharmacyId,
    })
      .populate('supplierId', 'name')
      .sort({ expiryDate: 1 });

    res.json({ success: true, data: batches });
  } catch (err) {
    next(err);
  }
});

// GET /api/stock/batch/:batchId — Single batch detail
router.get('/batch/:batchId', async (req, res, next) => {
  try {
    const batch = await Batch.findOne({
      _id: req.params.batchId,
      pharmacyId: req.user.pharmacyId,
    })
      .populate('medicineId', 'name genericName unit')
      .populate('supplierId', 'name');

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    res.json({ success: true, data: batch });
  } catch (err) {
    next(err);
  }
});

// PUT /api/stock/batch/:batchId — Update batch
router.put('/batch/:batchId', async (req, res, next) => {
  try {
    const batch = await Batch.findOneAndUpdate(
      { _id: req.params.batchId, pharmacyId: req.user.pharmacyId },
      { $set: req.body },
      { new: true }
    );
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    res.json({ success: true, data: batch });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/stock/batch/:batchId — Delete batch
router.delete('/batch/:batchId', async (req, res, next) => {
  try {
    const batch = await Batch.findOneAndDelete({ _id: req.params.batchId, pharmacyId: req.user.pharmacyId });
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    res.json({ success: true, message: 'Batch deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
