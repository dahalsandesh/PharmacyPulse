const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const SalesReturn = require('../models/SalesReturn');
const PurchaseReturn = require('../models/PurchaseReturn');
const SaleItem = require('../models/SaleItem');
const Batch = require('../models/Batch');
const { authenticate, checkSubscription } = require('../middleware/auth');
const { updateTodayReport } = require('../services/dailyReport.service');

router.use(authenticate, checkSubscription);

// POST /api/returns/sales
router.post('/sales', async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const pharmacyId = req.user.pharmacyId;
    const { saleId, items, reason } = req.body;
    // items: [{ saleItemId, quantity }]

    if (!items || items.length === 0) {
      throw new Error('No items to return');
    }

    let totalRefund = 0;
    const returnItems = [];
    let totalCOGSAssessed = 0;

    for (const item of items) {
      const saleItem = await SaleItem.findOne({ _id: item.saleItemId, saleId }).session(session);
      if (!saleItem) throw new Error(`Sale item not found: ${item.saleItemId}`);
      if (item.quantity > saleItem.quantity) {
        throw new Error(`Cannot return more than sold for ${saleItem.medicineName}`);
      }

      const refundAmount = saleItem.unitPrice * item.quantity;
      totalRefund += refundAmount;
      totalCOGSAssessed += saleItem.purchasePriceSnapshot * item.quantity;

      // Restore stock to batch
      const batch = await Batch.findById(saleItem.batchId).session(session);
      if (batch) {
        batch.quantity += item.quantity;
        if (batch.status === 'depleted') batch.status = 'active';
        await batch.save({ session });
      }

      // We might want to reduce the quantity on the original SaleItem conceptually,
      // but usually we leave the original sale intact and just record the return.
      // For simplicity, we just record the return. In a full system we'd track returnedQty on SaleItem.

      returnItems.push({
        batchId: saleItem.batchId,
        medicineId: saleItem.medicineId,
        quantity: item.quantity,
        refundAmount
      });
    }

    const salesReturn = await SalesReturn.create([{
      pharmacyId,
      saleId,
      items: returnItems,
      totalRefund,
      reason,
      processedBy: req.user._id
    }], { session });

    // Update daily report (deduct revenue and COGS, as this is a return)
    const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0);
    await updateTodayReport(pharmacyId, {
      revenue: -totalRefund,
      cogs: -totalCOGSAssessed,
      units: -totalUnits,
      // not decrementing sales count as it's a separate transaction type
    }, session);

    await session.commitTransaction();
    res.status(201).json({ success: true, data: salesReturn[0] });
  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
});

// GET /api/returns/sales
router.get('/sales', async (req, res, next) => {
  try {
    const returns = await SalesReturn.find({ pharmacyId: req.user.pharmacyId })
      .sort({ returnDate: -1 })
      .populate('saleId', 'invoiceNumber')
      .populate('processedBy', 'name')
      .populate('items.medicineId', 'name genericName');
    res.json({ success: true, data: returns });
  } catch (err) {
    next(err);
  }
});

// POST /api/returns/purchases
router.post('/purchases', async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const pharmacyId = req.user.pharmacyId;
    const { batchId, quantity, reason } = req.body;

    const batch = await Batch.findOne({ _id: batchId, pharmacyId }).session(session);
    if (!batch) throw new Error('Batch not found');
    if (batch.quantity < quantity) throw new Error('Return quantity exceeds current batch stock');

    const refundAmount = batch.purchasePrice * quantity;

    batch.quantity -= quantity;
    if (batch.quantity === 0) batch.status = 'depleted';
    await batch.save({ session });

    const purchaseReturn = await PurchaseReturn.create([{
      pharmacyId,
      batchId,
      medicineId: batch.medicineId,
      supplierId: batch.supplierId,
      quantity,
      refundAmount,
      reason,
      processedBy: req.user._id
    }], { session });

    await session.commitTransaction();
    res.status(201).json({ success: true, data: purchaseReturn[0] });
  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
});

// GET /api/returns/purchases
router.get('/purchases', async (req, res, next) => {
  try {
    const returns = await PurchaseReturn.find({ pharmacyId: req.user.pharmacyId })
      .sort({ returnDate: -1 })
      .populate('batchId', 'batchNumber')
      .populate('medicineId', 'name genericName')
      .populate('supplierId', 'name')
      .populate('processedBy', 'name');
    res.json({ success: true, data: returns });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/returns/sales/:id
router.delete('/sales/:id', async (req, res, next) => {
  try {
    const ret = await SalesReturn.findOneAndDelete({ _id: req.params.id, pharmacyId: req.user.pharmacyId });
    if (!ret) return res.status(404).json({ success: false, message: 'Return not found' });
    res.json({ success: true, message: 'Return deleted' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/returns/purchases/:id
router.delete('/purchases/:id', async (req, res, next) => {
  try {
    const ret = await PurchaseReturn.findOneAndDelete({ _id: req.params.id, pharmacyId: req.user.pharmacyId });
    if (!ret) return res.status(404).json({ success: false, message: 'Return not found' });
    res.json({ success: true, message: 'Return deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
