const mongoose = require('mongoose');
const Batch = require('../models/Batch');
const Sale = require('../models/Sale');
const SaleItem = require('../models/SaleItem');
const { updateTodayReport } = require('./dailyReport.service');
const { checkAndCreateAlerts } = require('./notification.service');

async function processSale(pharmacyId, items, paymentMethod = 'cash', discount = 0, soldBy = null, notes = '') {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const saleItems = [];

    for (const item of items) {
      let remaining = item.quantity;

      // FIFO: get active batches sorted oldest expiry first
      const batches = await Batch.find({
        pharmacyId,
        medicineId: item.medicineId,
        status: 'active',
        quantity: { $gt: 0 },
      })
        .sort({ expiryDate: 1 })
        .session(session);

      const totalStock = batches.reduce((sum, b) => sum + b.quantity, 0);
      if (totalStock < remaining) {
        throw new Error(`Insufficient stock: only ${totalStock} units available for ${item.medicineName}`);
      }

      for (const batch of batches) {
        if (remaining <= 0) break;
        const deduct = Math.min(batch.quantity, remaining);
        batch.quantity -= deduct;
        if (batch.quantity === 0) batch.status = 'depleted';
        await batch.save({ session });

        saleItems.push({
          batchId: batch._id,
          medicineId: item.medicineId,
          medicineName: item.medicineName,
          batchNumber: batch.batchNumber,
          expiryDate: batch.expiryDate,
          purchasePriceSnapshot: batch.purchasePrice,
          quantity: deduct,
          unitPrice: item.unitPrice || batch.sellingPrice,
          discount: 0,
          lineTotal: deduct * (item.unitPrice || batch.sellingPrice),
        });
        remaining -= deduct;
      }
    }

    const totalAmount = saleItems.reduce((s, i) => s + i.lineTotal, 0) - discount;
    const invoiceNumber = `INV-${Date.now()}`;

    const [sale] = await Sale.create([{
      pharmacyId,
      invoiceNumber,
      totalAmount,
      discount,
      paymentMethod,
      notes,
      soldBy,
    }], { session });

    const itemsWithId = saleItems.map(i => ({ ...i, saleId: sale._id }));
    await SaleItem.insertMany(itemsWithId, { session });

    // Update today's DailyReport
    const totalCOGS = saleItems.reduce((s, i) => s + i.purchasePriceSnapshot * i.quantity, 0);
    const totalUnits = saleItems.reduce((s, i) => s + i.quantity, 0);
    await updateTodayReport(pharmacyId, {
      revenue: totalAmount,
      cogs: totalCOGS,
      units: totalUnits,
      discount,
      sales: 1,
    }, session);

    // Trigger real-time alerts for each item sold
    for (const item of items) {
       await checkAndCreateAlerts(pharmacyId, item.medicineId, session);
    }

    await session.commitTransaction();
    return { sale, saleItems: itemsWithId };

  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

async function voidSale(saleId, reason, pharmacyId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const sale = await Sale.findOne({ _id: saleId, pharmacyId }).session(session);
    if (!sale) throw new Error('Sale not found');
    if (sale.isVoided) throw new Error('Sale already voided');

    const items = await SaleItem.find({ saleId }).session(session);

    for (const item of items) {
      const batch = await Batch.findById(item.batchId).session(session);
      if (batch) {
        batch.quantity += item.quantity;
        if (batch.status === 'depleted') batch.status = 'active';
        await batch.save({ session });
      }
    }

    sale.isVoided = true;
    sale.voidReason = reason;
    await sale.save({ session });

    // Reverse DailyReport totals
    const totalCOGS = items.reduce((s, i) => s + i.purchasePriceSnapshot * i.quantity, 0);
    const totalUnits = items.reduce((s, i) => s + i.quantity, 0);
    await updateTodayReport(pharmacyId, {
      revenue: -sale.totalAmount,
      cogs: -totalCOGS,
      units: -totalUnits,
      sales: -1,
    }, session);

    await session.commitTransaction();
    return sale;

  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

module.exports = { processSale, voidSale };
