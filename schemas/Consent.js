const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Account Consent Schema
 * Stores data from /pfm/api/v2/account-consents-latest
 * Latest consent information per account
 */
const AccountConsentSchema = new Schema({
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
  
  // Consent Details
  consentId: { type: String },
  consentHandle: { type: String },
  consentStatus: {
    type: String,
    enum: ['PENDING', 'ACTIVE', 'PAUSED', 'REVOKED', 'EXPIRED', 'READY'],
    default: 'PENDING'
  },
  
  // FIP Info
  fipId: { type: String },
  
  // FI Types covered
  fiTypes: [{ type: String }],
  
  // Consent Period
  consentStart: { type: Date },
  consentExpiry: { type: Date },
  
  // Fetch Configuration
  fetchType: { type: String },  // PERIODIC, ONETIME
  frequencyUnit: { type: String },  // HOUR, DAY, WEEK, MONTH, YEAR
  frequencyValue: { type: Number },
  
  // Data Retention
  dataLifeUnit: { type: String },
  dataLifeValue: { type: Number },
  
  // Purpose
  purposeCode: { type: String },
  purposeText: { type: String },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound unique index
AccountConsentSchema.index({ uniqueIdentifier: 1, accountId: 1, consentId: 1 }, { unique: true });

/**
 * Consent Request Schema
 * Stores data from /pfm/api/v1/submit-consent-request and /pfm/api/v2/submit-consent-request-plus
 */
const ConsentRequestSchema = new Schema({
  uniqueIdentifier: {
    type: String,
    required: true,
    index: true
  },
  
  // Request Info
  aaCustId: { type: String },  // e.g., "8956545791@finvu"
  templateName: { type: String },  // e.g., "BANK_STATEMENT_PERIODIC"
  userSessionId: { type: String },
  redirectUrl: { type: String },
  
  // Response
  consentUrl: { type: String },  // URL to redirect user for consent approval
  
  // Status
  status: { type: String, default: 'INITIATED' },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

/**
 * FI Request Schema
 * Stores data from /pfm/api/v2/firequest-user and /pfm/api/v2/firequest-account
 */
const FIRequestSchema = new Schema({
  uniqueIdentifier: {
    type: String,
    required: true,
    index: true
  },
  accountId: { type: String, index: true },  // Optional, for account-level requests
  
  // Request Details
  requestId: { type: String },
  requestType: { type: String },  // USER, ACCOUNT
  
  // Status
  status: { type: String },
  
  // Request/Response Data
  requestData: { type: Schema.Types.Mixed },
  responseData: { type: Schema.Types.Mixed },
  
  // Timestamps
  requestedAt: { type: Date },
  completedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

/**
 * Account Delink History Schema
 * Stores data from /pfm/api/v2/user-account-delink
 */
const AccountDelinkHistorySchema = new Schema({
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
  
  // Status
  success: { type: Boolean, default: false },
  message: { type: String },
  
  // Timestamps
  delinkedAt: { type: Date, default: Date.now }
});

// Legacy Consent Schema (kept for backward compatibility)
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

const AccountConsent = mongoose.model('AccountConsent', AccountConsentSchema);
const ConsentRequest = mongoose.model('ConsentRequest', ConsentRequestSchema);
const FIRequest = mongoose.model('FIRequest', FIRequestSchema);
const AccountDelinkHistory = mongoose.model('AccountDelinkHistory', AccountDelinkHistorySchema);
const Consent = mongoose.model('Consent', ConsentSchema);

module.exports = {
  AccountConsent,
  ConsentRequest,
  FIRequest,
  AccountDelinkHistory,
  Consent  // Legacy
};
