const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

const Pharmacy = require('../models/Pharmacy');
const DailyReport = require('../models/DailyReport');
const Batch = require('../models/Batch');
const Medicine = require('../models/Medicine');
const Notification = require('../models/Notification');
const { getStockStatus } = require('./stockLevel.service');

/**
 * Triggers background-like jobs "on demand" for Vercel environments.
 */
async function runLazyJobs(pharmacyId) {
  try {
    const today = dayjs().tz('Asia/Kathmandu').startOf('day').toDate();
    const pharmacy = await Pharmacy.findById(pharmacyId);
    if (!pharmacy) return;

    // 1. Check/Create Today's Daily Report
    const existingReport = await DailyReport.findOne({ pharmacyId, reportDate: today });
    if (!existingReport) {
      await DailyReport.create({ pharmacyId, reportDate: today });
      console.log(`[LAZY] Created daily report for ${pharmacyId} on ${today}`);
    }

    // 2. Check Expiry Alerts (Every 24 hours)
    const now = new Date();
    const oneDayAgo = dayjs().subtract(24, 'hour').toDate();
    if (!pharmacy.lastExpiryCheck || pharmacy.lastExpiryCheck < oneDayAgo) {
      console.log(`[LAZY] Running expiry check for ${pharmacyId}`);
      await runExpiryCheck(pharmacyId);
      pharmacy.lastExpiryCheck = now;
      await pharmacy.save();
    }

    // 3. Check Low Stock Alerts (Every 6 hours)
    const sixHoursAgo = dayjs().subtract(6, 'hour').toDate();
    if (!pharmacy.lastLowStockCheck || pharmacy.lastLowStockCheck < sixHoursAgo) {
      console.log(`[LAZY] Running low stock check for ${pharmacyId}`);
      await runLowStockCheck(pharmacyId);
      pharmacy.lastLowStockCheck = now;
      await pharmacy.save();
    }

  } catch (err) {
    console.error('[LAZY] Job trigger failed:', err.message);
  }
}

async function runExpiryCheck(pharmacyId) {
  const today = dayjs().tz('Asia/Kathmandu').startOf('day').toDate();
  const in30days = dayjs().tz('Asia/Kathmandu').add(30, 'day').toDate();

  const expiringBatches = await Batch.find({
    pharmacyId,
    status: 'active',
    expiryDate: { $lte: in30days }
  }).populate('medicineId');

  for (const batch of expiringBatches) {
    const isExpired = dayjs(batch.expiryDate).isBefore(dayjs(today));
    if (isExpired && batch.status !== 'expired') {
       batch.status = 'expired';
       await batch.save();
    }

    const type = isExpired ? 'expired' : 'expiring';
    const existing = await Notification.findOne({ pharmacyId, type, referenceId: batch._id, isRead: false });
    if (!existing) {
       await Notification.create({
         pharmacyId,
         type,
         title: isExpired ? `Medicine Expired: ${batch.medicineId?.name}` : `Expiring Soon: ${batch.medicineId?.name}`,
         message: isExpired ? `Batch ${batch.batchNumber} has expired.` : `Batch ${batch.batchNumber} expires on ${dayjs(batch.expiryDate).format('YYYY-MM-DD')}.`,
         referenceId: batch._id
       });
    }
  }
}

async function runLowStockCheck(pharmacyId) {
  const medicines = await Medicine.find({ pharmacyId, isActive: true });
  for (const med of medicines) {
    const totalStock = await Batch.aggregate([
      { $match: { medicineId: med._id, status: 'active', quantity: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);
    const currentStock = totalStock.length > 0 ? totalStock[0].total : 0;
    const status = getStockStatus(currentStock, med);

    if (['out_of_stock', 'critical', 'low'].includes(status.status)) {
      const existing = await Notification.findOne({ pharmacyId, type: 'low_stock', referenceId: med._id, isRead: false });
      if (!existing) {
        await Notification.create({
          pharmacyId,
          type: 'low_stock',
          title: `Low Stock: ${med.name}`,
          message: `Current stock: ${currentStock} ${med.unit}.`,
          referenceId: med._id
        });
      }
    }
  }
}

module.exports = { runLazyJobs };
