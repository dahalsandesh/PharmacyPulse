const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

const Batch = require('../models/Batch');
const Medicine = require('../models/Medicine');
const DailyReport = require('../models/DailyReport');
const Pharmacy = require('../models/Pharmacy');
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

        if (['out_of_stock', 'critical', 'low'].includes(status.status)) {
          lowCount++;
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
