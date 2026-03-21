const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

const Batch = require('../models/Batch');
const Medicine = require('../models/Medicine');
const { getStockStatus } = require('./stockLevel.service');

async function getExpiringBatches(pharmacyId, days = 90) {
  const today = dayjs().tz('Asia/Kathmandu').startOf('day').toDate();
  const futureDate = dayjs().tz('Asia/Kathmandu').add(days, 'day').toDate();

  const batches = await Batch.find({
    pharmacyId,
    status: 'active',
    quantity: { $gt: 0 },
    expiryDate: { $lte: futureDate },
  })
    .populate('medicineId', 'name genericName unit')
    .sort({ expiryDate: 1 });

  return batches.map(b => {
    const daysLeft = dayjs(b.expiryDate).diff(dayjs(today), 'day');
    let expiryStatus;
    if (daysLeft < 0) expiryStatus = { status: 'expired', label: 'Expired', color: 'red', urgent: true };
    else if (daysLeft <= 30) expiryStatus = { status: 'expiring_30', label: `${daysLeft}d`, color: 'red', urgent: true };
    else if (daysLeft <= 60) expiryStatus = { status: 'expiring_60', label: `${daysLeft}d`, color: 'amber', urgent: false };
    else if (daysLeft <= 90) expiryStatus = { status: 'expiring_90', label: `${daysLeft}d`, color: 'yellow', urgent: false };
    else expiryStatus = { status: 'safe', label: 'Safe', color: 'green', urgent: false };

    return {
      ...b.toObject(),
      daysLeft,
      expiryStatus,
    };
  });
}

async function getLowStockMedicines(pharmacyId) {
  const medicines = await Medicine.find({ pharmacyId, isActive: true });
  const results = [];

  for (const med of medicines) {
    const totalStock = await Batch.aggregate([
      { $match: { medicineId: med._id, status: 'active', quantity: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ]);

    const currentStock = totalStock.length > 0 ? totalStock[0].total : 0;
    const status = getStockStatus(currentStock, med);

    if (['out_of_stock', 'critical', 'low'].includes(status.status)) {
      results.push({
        ...med.toObject(),
        currentStock,
        stockStatus: status,
      });
    }
  }

  return results.sort((a, b) => a.currentStock - b.currentStock);
}

module.exports = { getExpiringBatches, getLowStockMedicines };
