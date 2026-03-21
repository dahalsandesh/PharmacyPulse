const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

const DailyReport = require('../models/DailyReport');

async function getTodayDate(pharmacyId) {
  return dayjs().tz('Asia/Kathmandu').startOf('day').toDate();
}

async function updateTodayReport(pharmacyId, updates, session = null) {
  const today = await getTodayDate();
  const updateOps = {};

  if (updates.revenue !== undefined) {
    updateOps.$inc = updateOps.$inc || {};
    updateOps.$inc.totalRevenue = updates.revenue;
  }
  if (updates.cogs !== undefined) {
    updateOps.$inc = updateOps.$inc || {};
    updateOps.$inc.totalCOGS = updates.cogs;
    updateOps.$inc.grossProfit = (updates.revenue || 0) - updates.cogs;
  }
  if (updates.units !== undefined) {
    updateOps.$inc = updateOps.$inc || {};
    updateOps.$inc.itemsSold = updates.units;
  }
  if (updates.discount !== undefined) {
    updateOps.$inc = updateOps.$inc || {};
    updateOps.$inc.discountsGiven = updates.discount;
  }
  if (updates.sales !== undefined) {
    updateOps.$inc = updateOps.$inc || {};
    updateOps.$inc.totalSales = updates.sales;
  }
  if (updates.damageWriteOff !== undefined) {
    updateOps.$inc = updateOps.$inc || {};
    updateOps.$inc.damageWriteOffs = updates.damageWriteOff;
  }

  const opts = { upsert: true, new: true };
  if (session) opts.session = session;

  return DailyReport.findOneAndUpdate(
    { pharmacyId, reportDate: today },
    updateOps,
    opts
  );
}

module.exports = { updateTodayReport, getTodayDate };
