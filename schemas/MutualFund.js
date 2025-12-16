const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Mutual Fund Folio Schema (embedded)
 */
const FolioSchema = new Schema({
  fipId: { type: String },
  fiDataId: { type: String },
  maskedAccNumber: { type: String },
  accountRefNumber: { type: String },
  folioNo: { type: String },
  currentValue: { type: Number },
  closingUnits: { type: Number },
  lienUnits: { type: Number },
  lockingUnits: { type: Number },
  nav: { type: Number },
  navDate: { type: Date },
  lastFetchTime: { type: Date },
  prevDetails: {
    percentageChange: { type: Number },
    priceChange: { type: Number },
    lastFetchTime: { type: Date },
    holdingIsin: { type: String },
    totalUnits: { type: Number },
    currentValue: { type: Number }
  }
}, { _id: false });

/**
 * Mutual Fund Holding Schema
 * Stores data from /pfm/api/v2/mutual-fund/user-linked-accounts/holding-folio
 */
const MutualFundHoldingSchema = new Schema({
  uniqueIdentifier: {
    type: String,
    required: true,
    index: true
  },
  isin: {
    type: String,
    required: true,
    index: true
  },
  
  // Scheme Details
  amc: { type: String },
  amcName: { type: String },
  registrar: { type: String },
  schemeCode: { type: String },
  schemaOption: { type: String }, // GROWTH, IDCW
  schemaTypes: { type: String }, // EQUITY, DEBT, HYBRID
  schemaCategory: { type: String }, // Large Cap, Mid Cap, etc.
  isinDescription: { type: String },
  ucc: { type: String },
  amfiCode: { type: String },
  
  // Holdings Details
  closingUnits: { type: Number },
  lienUnits: { type: Number },
  lockingUnits: { type: Number },
  
  // NAV Details
  nav: { type: Number },
  avgNav: { type: Number },
  navDate: { type: Date },
  
  // Values
  currentValue: { type: Number },
  costValue: { type: Number },
  
  // Performance
  prevDetails: {
    percentageChange: { type: Number },
    priceChange: { type: Number },
    lastFetchTime: { type: Date },
    holdingIsin: { type: String },
    totalUnits: { type: Number },
    currentValue: { type: Number }
  },
  
  // Folios
  folios: [FolioSchema],
  
  // Metadata
  lastFetchTime: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound index
MutualFundHoldingSchema.index({ uniqueIdentifier: 1, isin: 1 }, { unique: true });

/**
 * Mutual Fund Transaction Schema
 * Stores data from /pfm/api/v2/mutual-fund/user-account-statement
 */
const MutualFundTransactionSchema = new Schema({
  uniqueIdentifier: {
    type: String,
    required: true,
    index: true
  },
  accountId: { type: String, index: true },
  txnId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Scheme Details
  isin: { type: String, index: true },
  isinDescription: { type: String },
  amc: { type: String },
  amfiCode: { type: String },
  registrar: { type: String },
  folioNo: { type: String },
  
  // Transaction Details
  transactionDateTime: { type: Date, index: true },
  type: { type: String }, // PURCHASE, REDEMPTION, SWITCH_IN, SWITCH_OUT, DIVIDEND
  mode: { type: String }, // SIP, LUMPSUM, etc.
  narration: { type: String },
  
  // Units & Amount
  units: { type: Number },
  amount: { type: Number },
  nav: { type: Number },
  navDate: { type: Date },
  
  // Tax Details
  sttTax: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  totalTax: { type: Number, default: 0 },
  stampDuty: { type: Number, default: 0 },
  txnCharge: { type: Number, default: 0 },
  
  // Lock-in
  lockInDays: { type: String },
  lockInFlag: { type: String },
  
  // Data Source
  dataSource: { type: String }, // AA, MFC
  
  // Metadata
  createdAt: { type: Date, default: Date.now }
});

// Compound index
MutualFundTransactionSchema.index({ uniqueIdentifier: 1, transactionDateTime: -1 });
MutualFundTransactionSchema.index({ isin: 1, transactionDateTime: -1 });

/**
 * Mutual Fund Insights Schema
 * Stores data from /pfm/api/v2/mutual-fund/insights
 */
const MutualFundInsightsSchema = new Schema({
  uniqueIdentifier: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Overall Summary
  pan: { type: String },
  mobile: { type: String },
  totalHoldings: { type: Number },
  currentValue: { type: Number },
  investedValue: { type: Number },
  absoluteReturn: { type: Number },
  absoluteReturnPercentage: { type: Number },
  xirr: { type: Number },
  dailyReturns: { type: Number },
  dailyReturnsPercent: { type: Number },
  
  // Distributions
  categoryDistribution: [{
    category: { type: String },
    totalFunds: { type: Number },
    totalCurrentValue: { type: Number },
    percentage: { type: Number }
  }],
  subCategoryDistribution: [{
    subCategory: { type: String },
    totalFunds: { type: Number },
    totalCurrentValue: { type: Number },
    percentage: { type: Number }
  }],
  marketCapDistribution: [{
    marketCap: { type: String },
    totalFunds: { type: Number },
    totalCurrentValue: { type: Number },
    percentage: { type: Number }
  }],
  amcDistribution: [{
    amc: { type: String },
    totalFunds: { type: Number },
    totalCurrentValue: { type: Number },
    percentage: { type: Number }
  }],
  sectorDistribution: [{
    sector: { type: String },
    totalFunds: { type: Number },
    totalCurrentValue: { type: Number },
    percentage: { type: Number }
  }],
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

/**
 * MFC Consent Schema
 * Stores data from /pfm/api/v2/mutual-fund/mfc/consent-request
 */
const MFCConsentSchema = new Schema({
  uniqueIdentifier: {
    type: String,
    required: true,
    index: true
  },
  pan: { type: String, required: true },
  clientReferenceId: { type: String, required: true, unique: true },
  clientRefNo: { type: String },
  
  // Status
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'],
    default: 'PENDING'
  },
  otpSentAt: { type: Date },
  approvedAt: { type: Date },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const MutualFundHolding = mongoose.model('MutualFundHolding', MutualFundHoldingSchema);
const MutualFundTransaction = mongoose.model('MutualFundTransaction', MutualFundTransactionSchema);
const MutualFundInsights = mongoose.model('MutualFundInsights', MutualFundInsightsSchema);
const MFCConsent = mongoose.model('MFCConsent', MFCConsentSchema);

module.exports = {
  MutualFundHolding,
  MutualFundTransaction,
  MutualFundInsights,
  MFCConsent
};

