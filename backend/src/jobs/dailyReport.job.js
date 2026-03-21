const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

const DailyReport = require('../models/DailyReport');
const Pharmacy = require('../models/Pharmacy');

async function dailyReportJob() {
  console.log('[CRON] Running daily report lock job...');
  try {
    const today = dayjs().tz('Asia/Kathmandu').startOf('day').toDate();
    const pharmacies = await Pharmacy.find({ isActive: true });

    for (const pharmacy of pharmacies) {
      await DailyReport.findOneAndUpdate(
        { pharmacyId: pharmacy._id, reportDate: today },
        { isLocked: true },
        { upsert: true }
      );
    }

    console.log('[CRON] Daily report lock job completed');
  } catch (err) {
    console.error('[CRON] Daily report lock job failed:', err.message);
  }
}

module.exports = dailyReportJob;
