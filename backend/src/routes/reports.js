const express = require('express');
const router = express.Router();
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

const Sale = require('../models/Sale');
const SaleItem = require('../models/SaleItem');
const Batch = require('../models/Batch');
const Medicine = require('../models/Medicine');
const DailyReport = require('../models/DailyReport');
const DamageLog = require('../models/DamageLog');
const { authenticate, checkSubscription } = require('../middleware/auth');
const { getExpiringBatches, getLowStockMedicines } = require('../services/alert.service');

router.use(authenticate, checkSubscription);

// GET /api/reports/dashboard
router.get('/dashboard', async (req, res, next) => {
  try {
    const pharmacyId = req.user.pharmacyId;
    const today = dayjs().tz('Asia/Kathmandu').startOf('day').toDate();
    const tomorrow = dayjs().tz('Asia/Kathmandu').add(1, 'day').startOf('day').toDate();

    // Today's sales
    const todaySales = await Sale.find({
      pharmacyId,
      saleDate: { $gte: today, $lt: tomorrow },
      isVoided: false,
    }).sort({ saleDate: -1 });

    const todayRevenue = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);
    const todayDiscount = todaySales.reduce((sum, s) => sum + s.discount, 0);

    // COGS for today
    const todaySaleIds = todaySales.map(s => s._id);
    const todaySaleItems = await SaleItem.find({ saleId: { $in: todaySaleIds } });
    const todayCOGS = todaySaleItems.reduce((sum, i) => sum + i.purchasePriceSnapshot * i.quantity, 0);
    const todayItemsSold = todaySaleItems.reduce((sum, i) => sum + i.quantity, 0);
    const todayProfit = todayRevenue - todayCOGS;

    // Yesterday's revenue for comparison
    const yesterday = dayjs().tz('Asia/Kathmandu').subtract(1, 'day').startOf('day').toDate();
    const yesterdaySales = await Sale.find({
      pharmacyId,
      saleDate: { $gte: yesterday, $lt: today },
      isVoided: false,
    });
    const yesterdayRevenue = yesterdaySales.reduce((sum, s) => sum + s.totalAmount, 0);
    const revenueChange = yesterdayRevenue > 0
      ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100)
      : 0;

    // Today's damage
    const todayDamage = await DamageLog.find({
      pharmacyId,
      logDate: { $gte: today, $lt: tomorrow },
    });
    const damageValue = todayDamage.reduce((sum, d) => sum + d.valueWrittenOff, 0);

    // Alerts
    const expiringBatches = await getExpiringBatches(pharmacyId, 90);
    const lowStockMedicines = await getLowStockMedicines(pharmacyId);

    const expiryCounts = {
      expired: expiringBatches.filter(b => b.expiryStatus.status === 'expired').length,
      days30: expiringBatches.filter(b => b.expiryStatus.status === 'expiring_30').length,
      days60: expiringBatches.filter(b => b.expiryStatus.status === 'expiring_60').length,
      days90: expiringBatches.filter(b => b.expiryStatus.status === 'expiring_90').length,
    };

    // Recent 5 sales
    const recentSales = await Sale.find({
      pharmacyId,
      isVoided: false,
    })
      .sort({ saleDate: -1 })
      .limit(5)
      .populate('soldBy', 'name');

    const recentSalesWithItems = await Promise.all(
      recentSales.map(async (sale) => {
        const items = await SaleItem.find({ saleId: sale._id });
        return {
          ...sale.toObject(),
          itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
          itemNames: items.map(i => i.medicineName).join(', '),
        };
      })
    );

    // Stock health overview
    const allMedicines = await Medicine.find({ pharmacyId, isActive: true });
    const stockHealth = { normal: 0, low: 0, critical: 0, out_of_stock: 0, high: 0, overstock: 0 };

    for (const med of allMedicines) {
      const totalStock = await Batch.aggregate([
        { $match: { medicineId: med._id, status: 'active', quantity: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$quantity' } } },
      ]);
      const currentStock = totalStock.length > 0 ? totalStock[0].total : 0;
      const lo = med.lowStockThreshold || 10;
      const hi = med.highStockThreshold || 500;

      if (currentStock === 0) stockHealth.out_of_stock++;
      else if (currentStock < lo * 0.5) stockHealth.critical++;
      else if (currentStock < lo) stockHealth.low++;
      else if (currentStock > hi * 2) stockHealth.overstock++;
      else if (currentStock > hi) stockHealth.high++;
      else stockHealth.normal++;
    }

    res.json({
      success: true,
      data: {
        today: {
          revenue: todayRevenue,
          profit: todayProfit,
          cogs: todayCOGS,
          itemsSold: todayItemsSold,
          salesCount: todaySales.length,
          discount: todayDiscount,
          damageValue,
          damageBatches: todayDamage.length,
          revenueChange,
        },
        alerts: {
          expiry: expiryCounts,
          lowStock: lowStockMedicines.length,
          expiringBatches: expiringBatches.slice(0, 10),
          lowStockMedicines: lowStockMedicines.slice(0, 10),
        },
        stockHealth,
        recentSales: recentSalesWithItems,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/daily
router.get('/daily', async (req, res, next) => {
  try {
    const pharmacyId = req.user.pharmacyId;
    const date = req.query.date
      ? dayjs(req.query.date).tz('Asia/Kathmandu').startOf('day').toDate()
      : dayjs().tz('Asia/Kathmandu').startOf('day').toDate();

    const report = await DailyReport.findOne({ pharmacyId, reportDate: date });

    if (!report) {
      return res.json({
        success: true,
        data: {
          reportDate: date,
          totalSales: 0, totalRevenue: 0, totalCOGS: 0,
          grossProfit: 0, itemsSold: 0, discountsGiven: 0,
          damageWriteOffs: 0, expiryAlerts: 0, lowStockAlerts: 0,
        },
      });
    }

    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/profit-loss
router.get('/profit-loss', async (req, res, next) => {
  try {
    const pharmacyId = req.user.pharmacyId;
    const from = req.query.from
      ? new Date(req.query.from)
      : dayjs().tz('Asia/Kathmandu').subtract(30, 'day').startOf('day').toDate();
    const to = req.query.to
      ? new Date(req.query.to)
      : dayjs().tz('Asia/Kathmandu').endOf('day').toDate();

    const reports = await DailyReport.find({
      pharmacyId,
      reportDate: { $gte: from, $lte: to },
    }).sort({ reportDate: 1 });

    const summary = {
      totalRevenue: reports.reduce((s, r) => s + r.totalRevenue, 0),
      totalCOGS: reports.reduce((s, r) => s + r.totalCOGS, 0),
      grossProfit: reports.reduce((s, r) => s + r.grossProfit, 0),
      totalSales: reports.reduce((s, r) => s + r.totalSales, 0),
      itemsSold: reports.reduce((s, r) => s + r.itemsSold, 0),
      discountsGiven: reports.reduce((s, r) => s + r.discountsGiven, 0),
      damageWriteOffs: reports.reduce((s, r) => s + r.damageWriteOffs, 0),
      dailyBreakdown: reports.map(r => ({
        date: r.reportDate,
        revenue: r.totalRevenue,
        cogs: r.totalCOGS,
        profit: r.grossProfit,
        sales: r.totalSales,
      })),
    };

    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/stock-value
router.get('/stock-value', async (req, res, next) => {
  try {
    const pharmacyId = req.user.pharmacyId;

    const result = await Batch.aggregate([
      { $match: { pharmacyId: pharmacyId, status: 'active', quantity: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          totalPurchaseValue: { $sum: { $multiply: ['$quantity', '$purchasePrice'] } },
          totalSellingValue: { $sum: { $multiply: ['$quantity', '$sellingPrice'] } },
          totalUnits: { $sum: '$quantity' },
          batchCount: { $sum: 1 },
        },
      },
    ]);

    const data = result.length > 0
      ? result[0]
      : { totalPurchaseValue: 0, totalSellingValue: 0, totalUnits: 0, batchCount: 0 };

    res.json({
      success: true,
      data: {
        ...data,
        potentialProfit: data.totalSellingValue - data.totalPurchaseValue,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/damage-summary
router.get('/damage-summary', async (req, res, next) => {
  try {
    const pharmacyId = req.user.pharmacyId;
    const from = req.query.from
      ? new Date(req.query.from)
      : dayjs().tz('Asia/Kathmandu').subtract(30, 'day').startOf('day').toDate();
    const to = req.query.to
      ? new Date(req.query.to)
      : dayjs().tz('Asia/Kathmandu').endOf('day').toDate();

    const logs = await DamageLog.find({
      pharmacyId,
      logDate: { $gte: from, $lte: to },
    }).sort({ logDate: -1 });

    const totalValue = logs.reduce((s, l) => s + l.valueWrittenOff, 0);
    const totalQty = logs.reduce((s, l) => s + l.quantity, 0);

    const byReason = logs.reduce((acc, l) => {
      acc[l.reason] = (acc[l.reason] || 0) + l.valueWrittenOff;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        totalValue,
        totalQuantity: totalQty,
        logCount: logs.length,
        byReason,
        logs,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
