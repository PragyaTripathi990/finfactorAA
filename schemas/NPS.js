const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * NPS Account Schema
 * Stores data from /pfm/api/v2/nps/user-linked-accounts
 */
const NPSAccountSchema = new Schema({
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
  
  // FIP Details
  fipId: { type: String },
  fipName: { type: String },
  
  // PRAN Details
  maskedPranId: { type: String },
  holderPranId: { type: String },
  
  // Holder Details
  holderName: { type: String },
  holderDob: { type: Date },
  holderMobile: { type: String },
  holderEmail: { type: String },
  holderPan: { type: String },
  holderAddress: { type: String },
  holderLandline: { type: String },
  holderNominee: { type: String },
  holderCkycCompliance: { type: Boolean, default: false },
  
  // Account Value
  accountCurrentValue: { type: Number, default: 0 },
  
  // Data Status
  dataFetched: { type: Boolean, default: false },
  lastFetchDateTime: { type: Date },
  fiRequestCountOfCurrentMonth: { type: Number, default: 0 },
  
  // Consent Details
  latestConsentPurposeText: { type: String },
  latestConsentExpiryTime: { type: Date },
  consentPurposeVersion: { type: String },
  
  // Raw Data
  fiData: { type: Schema.Types.Mixed },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

/**
 * NPS Summary Schema
 * Stores summary from NPS linked accounts response
 */
const NPSSummarySchema = new Schema({
  uniqueIdentifier: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Summary
  totalFiData: { type: Number, default: 0 },
  totalFiDataToBeFetched: { type: Number, default: 0 },
  currentValue: { type: Number, default: 0 },
  
  // FIP Data
  fipData: [{
    fipId: { type: String },
    fipName: { type: String },
    totalFiData: { type: Number },
    totalFiDataToBeFetched: { type: Number },
    currentValue: { type: Number }
  }],
  
  // Metadata
  lastSyncedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const NPSAccount = mongoose.model('NPSAccount', NPSAccountSchema);
const NPSSummary = mongoose.model('NPSSummary', NPSSummarySchema);

module.exports = {
  NPSAccount,
  NPSSummary
};

