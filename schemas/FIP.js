const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * FIP (Financial Information Provider) Schema
 * Stores data from /pfm/api/v2/fips
 */
const FIPSchema = new Schema({
  fipId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  fipName: {
    type: String,
    required: true
  },
  
  // FI Types supported
  fiTypes: [{
    type: String,
    enum: ['DEPOSIT', 'TERM_DEPOSIT', 'RECURRING_DEPOSIT', 'EQUITIES', 'MUTUAL_FUNDS', 'NPS', 'ETF', 'INSURANCE', 'PPF', 'EPF', 'CREDIT_CARD']
  }],
  
  // Status
  enabled: { type: Boolean, default: true },
  
  // Logo
  logoUrl: { type: String },
  
  // Additional Details
  bankType: { type: String }, // BANK, NBFC, DEPOSITORY, etc.
  category: { type: String },
  
  // Contact
  website: { type: String },
  supportEmail: { type: String },
  supportPhone: { type: String },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Text index for search
FIPSchema.index({ fipName: 'text' });

module.exports = mongoose.model('FIP', FIPSchema);

