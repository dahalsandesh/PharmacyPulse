const mongoose = require('mongoose');
const { Schema } = mongoose;

const pharmacySchema = new Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, lowercase: true, trim: true },
  ownerName: { type: String, trim: true },
  subscription: {
    plan: { type: String, enum: ['free', 'basic', 'premium'], default: 'free' },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  lastExpiryCheck: { type: Date },
  lastLowStockCheck: { type: Date },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Pharmacy', pharmacySchema);
