const mongoose = require('mongoose');
const { Schema } = mongoose;

const saleSchema = new Schema({
  pharmacyId: { type: Schema.Types.ObjectId, ref: 'Pharmacy', required: true, index: true },
  invoiceNumber: { type: String, unique: true, required: true },
  saleDate: { type: Date, default: Date.now, index: true },
  paymentMethod: {
    type: String,
    enum: ['cash', 'esewa', 'khalti', 'card', 'credit'],
    default: 'cash'
  },
  totalAmount: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  notes: { type: String },
  isVoided: { type: Boolean, default: false },
  voidReason: { type: String },
  soldBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);
