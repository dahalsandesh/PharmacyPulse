const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificationSchema = new Schema({
  pharmacyId: { type: Schema.Types.ObjectId, ref: 'Pharmacy', required: true, index: true },
  type: {
    type: String,
    enum: ['low_stock', 'expiring', 'expired', 'system'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  referenceId: { type: Schema.Types.ObjectId }, // e.g. medicineId or batchId
  isRead: { type: Boolean, default: false, index: true },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
