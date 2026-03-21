const mongoose = require('mongoose');
const { Schema } = mongoose;

const catalogSchema = new Schema({
  pharmacyId: { type: Schema.Types.ObjectId, ref: 'Pharmacy', required: true, index: true },
  type: { 
    type: String, 
    enum: ['category', 'type', 'manufacturer', 'unit'], 
    required: true 
  },
  name: { type: String, required: true, trim: true },
  image: { type: String, trim: true }, // URL or logo link
  description: { type: String, trim: true },
}, { timestamps: true });

// Ensure unique name per type per pharmacy
catalogSchema.index({ pharmacyId: 1, type: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Catalog', catalogSchema);
