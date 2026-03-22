const mongoose = require('mongoose');
const { Schema } = mongoose;

const purchaseReturnSchema = new Schema({
  pharmacyId: { type: Schema.Types.ObjectId, ref: 'Pharmacy', required: true, index: true },
  batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true, index: true },
  medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
  supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
  returnDate: { type: Date, default: Date.now },
  quantity: { type: Number, required: true, min: 1 },
  refundAmount: { type: Number, required: true, min: 0 },
  reason: { type: String, required: true },
  processedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('PurchaseReturn', purchaseReturnSchema);
