require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cron = require('node-cron');

const errorHandler = require('./middleware/errorHandler');
const expiryAlertJob = require('./jobs/expiryAlert.job');
const lowStockAlertJob = require('./jobs/lowStockAlert.job');
const dailyReportJob = require('./jobs/dailyReport.job');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:5174'].filter(Boolean),
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/medicines', require('./routes/medicines'));
app.use('/api/stock', require('./routes/stock'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/damage', require('./routes/damage'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/suppliers', require('./routes/suppliers'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'PharmacyPulse API is running', timestamp: new Date() });
});

// Error handler
app.use(errorHandler);

// Cron jobs (Asia/Kathmandu timezone)
cron.schedule('0 7 * * *', expiryAlertJob, { timezone: 'Asia/Kathmandu' });
cron.schedule('0 */6 * * *', lowStockAlertJob, { timezone: 'Asia/Kathmandu' });
cron.schedule('59 23 * * *', dailyReportJob, { timezone: 'Asia/Kathmandu' });

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    app.listen(PORT, () => {
      console.log(`🚀 PharmacyPulse API running on port ${PORT}`);
      console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;
