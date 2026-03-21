const mongoose = require('mongoose');
const { Schema } = mongoose;

const medicineSchema = new Schema({
  pharmacyId: { type: Schema.Types.ObjectId, ref: 'Pharmacy', required: true, index: true },
  name: { type: String, required: true, trim: true },
  genericName: { type: String, trim: true },
  category: {
    type: String,
    default: 'other',
    trim: true
  },
  type: {
    type: String,
    default: 'tablet',
    trim: true
  },
  manufacturer: { type: String, trim: true },
  image: { type: String, trim: true },
  unit: {
    type: String,
    default: 'tablet',
    trim: true
  },
  packSize: { type: Number, default: 1 },
  sellingPrice: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, required: true, default: 10 },
  highStockThreshold: { type: Number, default: 500 },
  isActive: { type: Boolean, default: true },
  notes: { type: String },
}, { timestamps: true });

medicineSchema.index({ pharmacyId: 1, name: 'text', genericName: 'text' });

module.exports = mongoose.model('Medicine', medicineSchema);
