const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Linked Account Schema - Base schema for all linked accounts
 * Used across Term Deposit, RD, MF, ETF, Equities, Deposit
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
    unique: true
  },
  accountRefNumber: { type: String },
  accountType: {
    type: String,
    enum: ['DEPOSIT', 'TERM_DEPOSIT', 'RECURRING_DEPOSIT', 'EQUITIES', 'MUTUAL_FUNDS', 'NPS', 'ETF'],
    required: true,
    index: true
  },
  maskedAccNumber: { type: String },
  accountName: { type: String },
  
  // FIP Details
  fipId: { type: String, index: true },
  fipName: { type: String },
  
  // Data Status
  dataFetched: { type: Boolean, default: false },
  lastFetchDateTime: { type: Date },
  fiRequestCountOfCurrentMonth: { type: Number, default: 0 },
  
  // Consent Details
  latestConsentPurposeText: { type: String },
  latestConsentExpiryTime: { type: Date },
  consentPurposeVersion: { type: String },
  
  // Value Details
  currentValue: { type: Number, default: 0 },
  currentBalance: { type: Number, default: 0 },
  
  // Raw FI Data (flexible storage)
  fiData: { type: Schema.Types.Mixed },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

// Compound indexes
LinkedAccountSchema.index({ uniqueIdentifier: 1, accountType: 1 });
LinkedAccountSchema.index({ fipId: 1, accountType: 1 });

// Update timestamps
LinkedAccountSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('LinkedAccount', LinkedAccountSchema);

