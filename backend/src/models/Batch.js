const mongoose = require('mongoose');
const { Schema } = mongoose;

const batchSchema = new Schema({
  pharmacyId: { type: Schema.Types.ObjectId, ref: 'Pharmacy', required: true, index: true },
  medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true, index: true },
  supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
  batchNumber: { type: String, trim: true },
  expiryDate: { type: Date, required: true, index: true },
  purchaseDate: { type: Date, default: Date.now },
  purchasePrice: { type: Number, required: true, min: 0 },
  sellingPrice: { type: Number, min: 0 }, // Deprecated in favor of Medicine.sellingPrice, but kept for historical/override
  initialQuantity: { type: Number, required: true, min: 1 },
  quantity: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['active', 'depleted', 'expired', 'damaged'],
    default: 'active',
    index: true
  },
  notes: { type: String },
}, { timestamps: true });

// Compound index for FIFO queries
batchSchema.index({ pharmacyId: 1, medicineId: 1, status: 1, expiryDate: 1 });

module.exports = mongoose.model('Batch', batchSchema);
