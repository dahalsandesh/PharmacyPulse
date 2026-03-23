const Notification = require('../models/Notification');
const Medicine = require('../models/Medicine');
const Batch = require('../models/Batch');
const { getStockStatus } = require('./stockLevel.service');
const dayjs = require('dayjs');

/**
 * Checks if a medicine has crossed low stock threshold and creates a notification if so.
 * Also checks for nearing expiry of batches.
 */
async function checkAndCreateAlerts(pharmacyId, medicineId, session = null) {
  try {
    // 1. Check Low Stock for the Medicine
    const med = await Medicine.findOne({ _id: medicineId, pharmacyId }).session(session);
    if (!med || !med.isActive) return;

    const batches = await Batch.find({
      medicineId,
      pharmacyId,
      status: 'active',
      quantity: { $gt: 0 }
    }).session(session);

    const currentStock = batches.reduce((sum, b) => sum + b.quantity, 0);
    const status = getStockStatus(currentStock, med);

    if (['out_of_stock', 'critical', 'low'].includes(status.status)) {
      // Check for existing unread notification
      const existingNotif = await Notification.findOne({
        pharmacyId,
        type: 'low_stock',
        referenceId: medicineId,
        isRead: false
      }).session(session);

      if (!existingNotif) {
        await Notification.create([{
          pharmacyId,
          type: 'low_stock',
          title: `Low Stock: ${med.name}`,
          message: `Stock level for ${med.name} is now ${currentStock} ${med.unit}. Threshold is ${med.lowStockThreshold || 10}.`,
          referenceId: medicineId
        }], { session });
      }
    }

    // 2. Check for nearing expiry (immediate alert if just added or after sale)
    // Usually expiry doesn't change after a sale, but if we just added a batch, we might want to check.
    for (const batch of batches) {
      const daysToExpiry = dayjs(batch.expiryDate).diff(dayjs(), 'day');
      if (daysToExpiry <= 30) {
        const type = daysToExpiry < 0 ? 'expired' : 'expiring';
        const existingExpiryNotif = await Notification.findOne({
          pharmacyId,
          type,
          referenceId: batch._id,
          isRead: false
        }).session(session);

        if (!existingExpiryNotif) {
          await Notification.create([{
            pharmacyId,
            type,
            title: daysToExpiry < 0 ? `Expired: ${med.name}` : `Expiring Soon: ${med.name}`,
            message: daysToExpiry < 0 
              ? `Batch ${batch.batchNumber} has expired.` 
              : `Batch ${batch.batchNumber} expires in ${daysToExpiry} days.`,
            referenceId: batch._id
          }], { session });
        }
      }
    }
  } catch (err) {
    console.error('Error in checkAndCreateAlerts:', err.message);
    // We don't want to crash the main transaction if alerting fails
  }
}

module.exports = { checkAndCreateAlerts };
