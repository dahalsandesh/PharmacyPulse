const mongoose = require('mongoose');
const { Schema } = mongoose;

const saleItemSchema = new Schema({
  saleId: { type: Schema.Types.ObjectId, ref: 'Sale', required: true, index: true },
  batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
  medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
  // Denormalized at time of sale — intentional, for receipt permanence
  medicineName: { type: String },
  batchNumber: { type: String },
  expiryDate: { type: Date },
  purchasePriceSnapshot: { type: Number },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  lineTotal: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('SaleItem', saleItemSchema);
