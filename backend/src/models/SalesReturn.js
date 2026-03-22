const mongoose = require('mongoose');
const { Schema } = mongoose;

const salesReturnSchema = new Schema({
  pharmacyId: { type: Schema.Types.ObjectId, ref: 'Pharmacy', required: true, index: true },
  saleId: { type: Schema.Types.ObjectId, ref: 'Sale', required: true, index: true },
  returnDate: { type: Date, default: Date.now },
  items: [{
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
    medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
    quantity: { type: Number, required: true, min: 1 },
    refundAmount: { type: Number, required: true, min: 0 } // unitPrice * quantity
  }],
  totalRefund: { type: Number, required: true },
  reason: { type: String, required: true },
  processedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('SalesReturn', salesReturnSchema);
