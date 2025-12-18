const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Linked Account Schema - Base schema for all linked accounts
 * Used across all FI types: DEPOSIT, TERM_DEPOSIT, RECURRING_DEPOSIT, EQUITIES, MUTUAL_FUNDS, NPS, ETF
 * Based on /pfm/api/v2/*/user-linked-accounts endpoints
 */
const LinkedAccountSchema = new Schema({
  uniqueIdentifier: {
    type: String,
    required: true,
    index: true
  },
  fiDataId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  accountRefNumber: { type: String },
  maskedAccNumber: { type: String },
  accountName: { type: String },
  accountType: {
    type: String,
    enum: ['DEPOSIT', 'TERM_DEPOSIT', 'RECURRING_DEPOSIT', 'EQUITIES', 'MUTUAL_FUNDS', 'NPS', 'ETF'],
    required: true,
    index: true
  },
  
  // FIP Details
  fipId: { type: String, index: true },
  fipName: { type: String },
  
  // Data Status
  dataFetched: { type: Boolean, default: false },
  lastFetchDateTime: { type: Date },
  fiRequestCountOfCurrentMonth: { type: Number, default: 0 },
  
  // Consent Details (from latest consent)
  latestConsentPurposeText: { type: String },
  latestConsentExpiryTime: { type: Date },
  consentPurposeVersion: { type: String },
  
  // Raw FI Data (flexible storage - stores complete fiData object from API)
  fiData: { type: Schema.Types.Mixed },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound indexes
LinkedAccountSchema.index({ uniqueIdentifier: 1, accountType: 1 });
LinkedAccountSchema.index({ fipId: 1, accountType: 1 });
LinkedAccountSchema.index({ uniqueIdentifier: 1, dataFetched: 1 });

// Update timestamps
LinkedAccountSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('LinkedAccount', LinkedAccountSchema);
