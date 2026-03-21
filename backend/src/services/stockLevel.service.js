const Batch = require('../models/Batch');
const Medicine = require('../models/Medicine');

function getStockStatus(currentStock, medicine) {
  const lo = medicine.lowStockThreshold || 10;
  const hi = medicine.highStockThreshold || 500;
  if (currentStock === 0) return { status: 'out_of_stock', color: 'red', label: 'Out of stock' };
  if (currentStock < lo * 0.5) return { status: 'critical', color: 'red', label: 'Critical' };
  if (currentStock < lo) return { status: 'low', color: 'amber', label: 'Low stock' };
  if (currentStock > hi * 2) return { status: 'overstock', color: 'purple', label: 'Overstock' };
  if (currentStock > hi) return { status: 'high', color: 'blue', label: 'High stock' };
  return { status: 'normal', color: 'green', label: 'Normal' };
}

async function getMedicineWithStock(medicineId) {
  const medicine = await Medicine.findById(medicineId);
  if (!medicine) return null;

  const batches = await Batch.find({
    medicineId,
    status: 'active',
    quantity: { $gt: 0 },
  }).sort({ expiryDate: 1 });

  const currentStock = batches.reduce((sum, b) => sum + b.quantity, 0);
  const nearestExpiry = batches.length > 0 ? batches[0].expiryDate : null;
  const stockStatus = getStockStatus(currentStock, medicine);

  return {
    ...medicine.toObject(),
    currentStock,
    nearestExpiry,
    stockStatus,
    activeBatches: batches,
  };
}

async function getAllMedicinesWithStock(pharmacyId, filters = {}) {
  const query = { pharmacyId, isActive: true };

  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { genericName: { $regex: filters.search, $options: 'i' } },
    ];
  }
  if (filters.category) {
    query.category = filters.category;
  }

  const medicines = await Medicine.find(query).sort({ name: 1 });

  const results = await Promise.all(
    medicines.map(async (med) => {
      const batches = await Batch.find({
        medicineId: med._id,
        status: 'active',
        quantity: { $gt: 0 },
      }).sort({ expiryDate: 1 });

      const currentStock = batches.reduce((sum, b) => sum + b.quantity, 0);
      const nearestExpiry = batches.length > 0 ? batches[0].expiryDate : null;
      const stockStatus = getStockStatus(currentStock, med);

      return {
        ...med.toObject(),
        currentStock,
        nearestExpiry,
        stockStatus,
      };
    })
  );

  // Filter by stockStatus if specified
  if (filters.stockStatus) {
    return results.filter(r => {
      if (filters.stockStatus === 'low') return ['low', 'critical', 'out_of_stock'].includes(r.stockStatus.status);
      if (filters.stockStatus === 'overstock') return ['overstock', 'high'].includes(r.stockStatus.status);
      return r.stockStatus.status === filters.stockStatus;
    });
  }

  return results;
}

module.exports = { getStockStatus, getMedicineWithStock, getAllMedicinesWithStock };
