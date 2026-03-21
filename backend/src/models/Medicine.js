const mongoose = require('mongoose');
const { Schema } = mongoose;

const medicineSchema = new Schema({
  pharmacyId: { type: Schema.Types.ObjectId, ref: 'Pharmacy', required: true, index: true },
  name: { type: String, required: true, trim: true },
  genericName: { type: String, trim: true },
  category: {
    type: String,
    enum: ['antibiotic', 'antacid', 'analgesic', 'vitamin', 'ors', 'antihypertensive',
      'antidiabetic', 'antifungal', 'antiparasitic', 'other'],
    default: 'other'
  },
  manufacturer: { type: String },
  unit: {
    type: String,
    enum: ['tablet', 'capsule', 'ml', 'mg', 'sachet', 'strip', 'bottle', 'vial'],
    default: 'tablet'
  },
  lowStockThreshold: { type: Number, required: true, default: 10 },
  highStockThreshold: { type: Number, default: 500 },
  isActive: { type: Boolean, default: true },
  notes: { type: String },
}, { timestamps: true });

medicineSchema.index({ pharmacyId: 1, name: 'text', genericName: 'text' });

module.exports = mongoose.model('Medicine', medicineSchema);
