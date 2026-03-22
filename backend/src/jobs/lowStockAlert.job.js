const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

const Batch = require('../models/Batch');
const Medicine = require('../models/Medicine');
const DailyReport = require('../models/DailyReport');
const Pharmacy = require('../models/Pharmacy');
const Notification = require('../models/Notification');
const { getStockStatus } = require('../services/stockLevel.service');

async function lowStockAlertJob() {
  console.log('[CRON] Running low stock alert job...');
  try {
    const today = dayjs().tz('Asia/Kathmandu').startOf('day').toDate();
    const pharmacies = await Pharmacy.find({ isActive: true });

    for (const pharmacy of pharmacies) {
      const medicines = await Medicine.find({ pharmacyId: pharmacy._id, isActive: true });
      let lowCount = 0;

      for (const med of medicines) {
        const totalStock = await Batch.aggregate([
          { $match: { medicineId: med._id, status: 'active', quantity: { $gt: 0 } } },
          { $group: { _id: null, total: { $sum: '$quantity' } } },
        ]);

        const currentStock = totalStock.length > 0 ? totalStock[0].total : 0;
        const status = getStockStatus(currentStock, med);

        // Check for existing unread notification for this medicine
        if (['out_of_stock', 'critical', 'low'].includes(status.status)) {
          lowCount++;

          const existingNotif = await Notification.findOne({
            pharmacyId: pharmacy._id,
            type: 'low_stock',
            referenceId: med._id,
            isRead: false
          });

          if (!existingNotif) {
            await Notification.create({
              pharmacyId: pharmacy._id,
              type: 'low_stock',
              title: `Low Stock Alert: ${med.name}`,
              message: `The stock for ${med.name} is currently ${currentStock} ${med.unit}s (Status: ${status.label}). Please restock.`,
              referenceId: med._id
            });
          }
        }
      }

      await DailyReport.findOneAndUpdate(
        { pharmacyId: pharmacy._id, reportDate: today },
        { lowStockAlerts: lowCount },
        { upsert: true }
      );
    }

    console.log('[CRON] Low stock alert job completed');
  } catch (err) {
    console.error('[CRON] Low stock alert job failed:', err.message);
  }
}

module.exports = lowStockAlertJob;
