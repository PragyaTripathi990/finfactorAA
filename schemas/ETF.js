const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * ETF Holding Insight Schema (embedded)
 */
const ETFHoldingInsightSchema = new Schema({
  schemeName: { type: String },
  isin: { type: String },
  currentValue: { type: Number },
  totalUnits: { type: Number },
  currentNAV: { type: Number },
  currentNAVDate: { type: Date },
  returnsSummary: {
    dailyReturns: { type: Number },
    dailyReturnsPercentage: { type: Number }
  }
}, { _id: false });

/**
 * ETF Demat Distribution Schema (embedded)
 */
const DematDistributionSchema = new Schema({
  dematId: { type: String },
  brokerName: { type: String },
  brokerCode: { type: String },
  totalHoldings: { type: Number },
  currentValue: { type: Number },
  dematValuePercentage: { type: Number },
  returnsSummary: {
    dailyReturns: { type: Number },
    dailyReturnsPercentage: { type: Number }
  },
  holdingsInsights: [ETFHoldingInsightSchema]
}, { _id: false });

/**
 * ETF Account Schema
 * Stores data from /pfm/api/v2/etf/user-linked-accounts
 */
const ETFAccountSchema = new Schema({
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
  maskedAccNumber: { type: String },
  accountType: { type: String, default: 'ETF' },
  
  // FIP Details
  fipId: { type: String },
  fipName: { type: String },
  
  // Data Status
  dataFetched: { type: Boolean, default: false },
  lastFetchDateTime: { type: Date },
  
  // Consent Details
  latestConsentPurposeText: { type: String },
  latestConsentExpiryTime: { type: Date },
  consentPurposeVersion: { type: String },
  
  // Values
  currentValue: { type: Number, default: 0 },
  
  // Raw Data
  fiData: { type: Schema.Types.Mixed },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

/**
 * ETF Insights Schema
 * Stores data from /pfm/api/v2/etf/insights
 */
const ETFInsightsSchema = new Schema({
  uniqueIdentifier: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Summary
  currentValue: { type: Number },
  totalHoldings: { type: Number },
  totalDemats: { type: Number },
  
  // Returns
  returnsSummary: {
    dailyReturns: { type: Number },
    dailyReturnsPercentage: { type: Number }
  },
  
  // Demat-wise Distribution
  dematWiseDistribution: [DematDistributionSchema],
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

/**
 * ETF Transaction Schema
 * Stores data from /pfm/api/v2/etf/user-account-statement
 */
const ETFTransactionSchema = new Schema({
  uniqueIdentifier: {
    type: String,
    required: true,
    index: true
  },
  accountId: { type: String, index: true },
  brokerId: { type: String },
  txnId: {
    type: String,
    required: true,
    unique: true
  },
  
  // ETF Details
  isin: { type: String, index: true },
  isinDescription: { type: String },
  
  // Transaction Details
  transactionDateTime: { type: Date, index: true },
  type: { type: String }, // BUY, SELL
  narration: { type: String },
  units: { type: Number },
  nav: { type: Number },
  
  // Metadata
  createdAt: { type: Date, default: Date.now }
});

// Compound index
ETFTransactionSchema.index({ uniqueIdentifier: 1, transactionDateTime: -1 });

const ETFAccount = mongoose.model('ETFAccount', ETFAccountSchema);
const ETFInsights = mongoose.model('ETFInsights', ETFInsightsSchema);
const ETFTransaction = mongoose.model('ETFTransaction', ETFTransactionSchema);

module.exports = {
  ETFAccount,
  ETFInsights,
  ETFTransaction
};

