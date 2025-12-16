const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Consent Schema
 * Stores consent data from various consent APIs
 */
const ConsentSchema = new Schema({
  uniqueIdentifier: {
    type: String,
    required: true,
    index: true
  },
  accountId: {
    type: String,
    index: true
  },
  
  // Consent Details
  consentHandle: { type: String, unique: true, sparse: true },
  consentId: { type: String },
  consentStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'REVOKED', 'EXPIRED', 'PAUSED'],
    default: 'PENDING'
  },
  
  // Template
  templateName: { type: String },
  templateVersion: { type: String },
  
  // Purpose
  purposeText: { type: String },
  purposeCode: { type: String },
  
  // FIP Details
  fipId: { type: String },
  fipName: { type: String },
  
  // AA Customer
  aaCustId: { type: String },
  
  // Dates
  consentStart: { type: Date },
  consentExpiry: { type: Date },
  createdAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
  revokedAt: { type: Date },
  
  // Data Fetch Details
  dataLifeUnit: { type: String },
  dataLifeValue: { type: Number },
  fetchType: { type: String }, // ONETIME, PERIODIC
  frequency: { type: String },
  
  // FI Types
  fiTypes: [{ type: String }],
  
  // Redirect
  redirectUrl: { type: String },
  
  // Session
  userSessionId: { type: String },
  
  // Metadata
  updatedAt: { type: Date, default: Date.now }
});

// Compound indexes
ConsentSchema.index({ uniqueIdentifier: 1, consentStatus: 1 });
ConsentSchema.index({ uniqueIdentifier: 1, accountId: 1 });

// Update timestamps
ConsentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Check if consent is active
ConsentSchema.methods.isActive = function() {
  const now = new Date();
  return this.consentStatus === 'APPROVED' && 
         this.consentExpiry > now;
};

/**
 * Account Consent Latest Schema
 * Stores data from /pfm/api/v2/account-consents-latest
 */
const AccountConsentLatestSchema = new Schema({
  uniqueIdentifier: {
    type: String,
    required: true,
    index: true
  },
  accountId: {
    type: String,
    required: true,
    index: true
  },
  
  // Latest Consent Details
  latestConsentPurposeText: { type: String },
  latestConsentExpiryTime: { type: Date },
  consentPurposeVersion: { type: String },
  consentStatus: { type: String },
  
  // Consent History
  consentHistory: [{
    consentId: { type: String },
    purposeText: { type: String },
    status: { type: String },
    createdAt: { type: Date },
    expiryTime: { type: Date }
  }],
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound unique index
AccountConsentLatestSchema.index({ uniqueIdentifier: 1, accountId: 1 }, { unique: true });

const Consent = mongoose.model('Consent', ConsentSchema);
const AccountConsentLatest = mongoose.model('AccountConsentLatest', AccountConsentLatestSchema);

module.exports = {
  Consent,
  AccountConsentLatest
};

