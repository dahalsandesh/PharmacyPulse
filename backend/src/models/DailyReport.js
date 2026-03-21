const mongoose = require('mongoose');
const { Schema } = mongoose;

const dailyReportSchema = new Schema({
  pharmacyId: { type: Schema.Types.ObjectId, ref: 'Pharmacy', required: true, index: true },
  reportDate: { type: Date, required: true, index: true },
  totalSales: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  totalCOGS: { type: Number, default: 0 },
  grossProfit: { type: Number, default: 0 },
  itemsSold: { type: Number, default: 0 },
  discountsGiven: { type: Number, default: 0 },
  damageWriteOffs: { type: Number, default: 0 },
  expiryAlerts: { type: Number, default: 0 },
  lowStockAlerts: { type: Number, default: 0 },
  isLocked: { type: Boolean, default: false },
}, { timestamps: true });

dailyReportSchema.index({ pharmacyId: 1, reportDate: 1 }, { unique: true });

module.exports = mongoose.model('DailyReport', dailyReportSchema);
