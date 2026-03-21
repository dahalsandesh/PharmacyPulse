const mongoose = require('mongoose');
const { Schema } = mongoose;

const supplierSchema = new Schema({
  pharmacyId: { type: Schema.Types.ObjectId, ref: 'Pharmacy', required: true, index: true },
  name: { type: String, required: true },
  contactPerson: { type: String },
  phone: { type: String },
  address: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);
