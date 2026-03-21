const express = require('express');
const router = express.Router();
const Batch = require('../models/Batch');
const DamageLog = require('../models/DamageLog');
const Medicine = require('../models/Medicine');
const { authenticate, checkSubscription } = require('../middleware/auth');
const { updateTodayReport } = require('../services/dailyReport.service');

router.use(authenticate, checkSubscription);

// POST /api/damage — Write off stock
router.post('/', async (req, res, next) => {
  try {
    const pharmacyId = req.user.pharmacyId;
    const { batchId, quantity, reason, notes } = req.body;

    if (!batchId || !quantity || !reason) {
      return res.status(400).json({ success: false, message: 'batchId, quantity, and reason are required' });
    }

    const batch = await Batch.findOne({ _id: batchId, pharmacyId });
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    if (batch.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${batch.quantity} units available in this batch`,
      });
    }

    const medicine = await Medicine.findById(batch.medicineId);
    const valueWrittenOff = quantity * batch.purchasePrice;

    // Update batch
    batch.quantity -= quantity;
    if (batch.quantity === 0) batch.status = 'damaged';
    await batch.save();

    // Create damage log
    const damageLog = await DamageLog.create({
      pharmacyId,
      batchId,
      medicineId: batch.medicineId,
      medicineName: medicine ? medicine.name : 'Unknown',
      batchNumber: batch.batchNumber,
      quantity,
      reason,
      valueWrittenOff,
      notes,
      loggedBy: req.user._id,
    });

    // Update daily report
    await updateTodayReport(pharmacyId, { damageWriteOff: valueWrittenOff });

    res.status(201).json({ success: true, data: damageLog });
  } catch (err) {
    next(err);
  }
});

// GET /api/damage — Damage log
router.get('/', async (req, res, next) => {
  try {
    const pharmacyId = req.user.pharmacyId;
    const { from, to, medicineId, page = 1, limit = 20 } = req.query;

    const query = { pharmacyId };
    if (from || to) {
      query.logDate = {};
      if (from) query.logDate.$gte = new Date(from);
      if (to) query.logDate.$lte = new Date(to);
    }
    if (medicineId) query.medicineId = medicineId;

    const total = await DamageLog.countDocuments(query);
    const logs = await DamageLog.find(query)
      .populate('loggedBy', 'name')
      .sort({ logDate: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: logs,
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

module.exports = router;
