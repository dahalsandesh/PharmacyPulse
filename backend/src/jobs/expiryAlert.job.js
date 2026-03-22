const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

const Batch = require('../models/Batch');
const DailyReport = require('../models/DailyReport');
const Pharmacy = require('../models/Pharmacy');
const Notification = require('../models/Notification');

async function expiryAlertJob() {
  console.log('[CRON] Running expiry alert job...');
  try {
    const today = dayjs().tz('Asia/Kathmandu').startOf('day').toDate();
    const in30days = dayjs().tz('Asia/Kathmandu').add(30, 'day').toDate();

    // Find and flag newly expired batches
    const newlyExpiredBatches = await Batch.find({ status: 'active', expiryDate: { $lt: today } }).populate('medicineId');
    for (const batch of newlyExpiredBatches) {
      batch.status = 'expired';
      await batch.save();
      
      await Notification.create({
        pharmacyId: batch.pharmacyId,
        type: 'expired',
        title: `Medicine Expired: ${batch.medicineId?.name}`,
        message: `Batch ${batch.batchNumber} of ${batch.medicineId?.name} has expired. Please remove it from stock.`,
        referenceId: batch._id
      });
    }
    console.log(`[CRON] Marked ${newlyExpiredBatches.length} batches as expired`);

    // Update daily reports for each pharmacy and create expiring soon notifications
    const pharmacies = await Pharmacy.find({ isActive: true });
    for (const pharmacy of pharmacies) {
      const expiringSoonBatches = await Batch.find({
        pharmacyId: pharmacy._id,
        status: 'active',
        expiryDate: { $gte: today, $lte: in30days },
      }).populate('medicineId');

      for (const batch of expiringSoonBatches) {
        const existingNotif = await Notification.findOne({
          pharmacyId: pharmacy._id,
          type: 'expiring',
          referenceId: batch._id,
          isRead: false
        });

        if (!existingNotif) {
          await Notification.create({
            pharmacyId: pharmacy._id,
            type: 'expiring',
            title: `Expiring Soon: ${batch.medicineId?.name}`,
            message: `Batch ${batch.batchNumber} of ${batch.medicineId?.name} will expire on ${dayjs(batch.expiryDate).format('YYYY-MM-DD')}.`,
            referenceId: batch._id
          });
        }
      }

      await DailyReport.findOneAndUpdate(
        { pharmacyId: pharmacy._id, reportDate: today },
        { expiryAlerts: expiringSoonBatches.length },
        { upsert: true }
      );
    }

    console.log('[CRON] Expiry alert job completed');
  } catch (err) {
    console.error('[CRON] Expiry alert job failed:', err.message);
  }
}

module.exports = expiryAlertJob;
