const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

const Batch = require('../models/Batch');
const DailyReport = require('../models/DailyReport');
const Pharmacy = require('../models/Pharmacy');

async function expiryAlertJob() {
  console.log('[CRON] Running expiry alert job...');
  try {
    const today = dayjs().tz('Asia/Kathmandu').startOf('day').toDate();
    const in30days = dayjs().tz('Asia/Kathmandu').add(30, 'day').toDate();

    // Flag newly expired batches
    const expiredResult = await Batch.updateMany(
      { status: 'active', expiryDate: { $lt: today } },
      { $set: { status: 'expired' } }
    );
    console.log(`[CRON] Marked ${expiredResult.modifiedCount} batches as expired`);

    // Update daily reports for each pharmacy
    const pharmacies = await Pharmacy.find({ isActive: true });
    for (const pharmacy of pharmacies) {
      const expiringSoon = await Batch.countDocuments({
        pharmacyId: pharmacy._id,
        status: 'active',
        expiryDate: { $gte: today, $lte: in30days },
      });

      await DailyReport.findOneAndUpdate(
        { pharmacyId: pharmacy._id, reportDate: today },
        { expiryAlerts: expiringSoon },
        { upsert: true }
      );
    }

    console.log('[CRON] Expiry alert job completed');
  } catch (err) {
    console.error('[CRON] Expiry alert job failed:', err.message);
  }
}

module.exports = expiryAlertJob;
