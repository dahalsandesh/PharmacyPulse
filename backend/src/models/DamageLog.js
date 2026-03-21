const mongoose = require('mongoose');
const { Schema } = mongoose;

const damageLogSchema = new Schema({
  pharmacyId: { type: Schema.Types.ObjectId, ref: 'Pharmacy', required: true, index: true },
  batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
  medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
  medicineName: { type: String },
  batchNumber: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  reason: {
    type: String,
    enum: ['expired', 'damaged', 'quality_issue', 'cold_chain_break', 'other'],
    required: true
  },
  logDate: { type: Date, default: Date.now },
  valueWrittenOff: { type: Number, required: true },
  notes: { type: String },
  loggedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('DamageLog', damageLogSchema);
