const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Broker Holding Schema (embedded)
 */
const BrokerHoldingSchema = new Schema({
  brokerName: { type: String },
  brokerId: { type: String },
  units: { type: Number },
  lastTradedPrice: { type: Number },
  avgTradedPrice: { type: Number },
  currentValue: { type: Number },
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
 * Equities Holding Schema
 * Stores data from /pfm/api/v2/equities/user-linked-accounts/holding-broker
 */
const EquitiesHoldingSchema = new Schema({
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
  
  // Stock Details
  issuerName: { type: String },
  isinDescription: { type: String },
  symbol: { type: String },
  exchange: { type: String }, // NSE, BSE
  
  // Holdings
  units: { type: Number },
  lastTradedPrice: { type: Number },
  avgTradedPrice: { type: Number },
  currentValue: { type: Number },
  portfolioWeightagePercent: { type: Number },
  
  // Performance
  prevDetails: {
    percentageChange: { type: Number },
    priceChange: { type: Number },
    lastFetchTime: { type: Date },
    holdingIsin: { type: String },
    totalUnits: { type: Number },
    currentValue: { type: Number }
  },
  
  // Broker-wise Holdings
  brokers: [BrokerHoldingSchema],
  
  // Metadata
  lastFetchTime: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound index
EquitiesHoldingSchema.index({ uniqueIdentifier: 1, isin: 1 }, { unique: true });

/**
 * Demat Account Schema
 * Stores data from /pfm/api/v2/equities/user-linked-accounts/demat-holding
 */
const DematAccountSchema = new Schema({
  uniqueIdentifier: {
    type: String,
    required: true,
    index: true
  },
  dematId: {
    type: String,
    required: true,
    unique: true
  },
  fiDataId: { type: String },
  fipId: { type: String },
  maskedAccNumber: { type: String },
  accountRefNumber: { type: String },
  
  // Broker Details
  brokerName: { type: String },
  brokerCode: { type: String },
  
  // Values
  currentValue: { type: Number },
  units: { type: Number },
  lastTradedPrice: { type: Number },
  avgTradedPrice: { type: Number },
  
  // Performance
  prevDetails: {
    percentageChange: { type: Number },
    priceChange: { type: Number },
    lastFetchTime: { type: Date },
    holdingIsin: { type: String },
    totalUnits: { type: Number },
    currentValue: { type: Number }
  },
  
  // Holdings in this Demat
  holdings: [{
    issuerName: { type: String },
    isin: { type: String },
    isinDescription: { type: String },
    units: { type: Number },
    lastTradedPrice: { type: Number },
    avgTradedPrice: { type: Number },
    currentValue: { type: Number },
    portfolioWeightagePercent: { type: Number },
    lastFetchTime: { type: Date }
  }],
  
  // Metadata
  lastFetchTime: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

/**
 * Equities Transaction Schema
 * Stores data from /pfm/api/v2/equities/user-account-statement
 */
const EquitiesTransactionSchema = new Schema({
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
  
  // Stock Details
  isin: { type: String, index: true },
  issuerName: { type: String },
  symbol: { type: String },
  
  // Transaction Details
  transactionDateTime: { type: Date, index: true },
  type: { type: String }, // BUY, SELL
  narration: { type: String },
  units: { type: Number },
  price: { type: Number },
  amount: { type: Number },
  
  // Charges
  brokerage: { type: Number, default: 0 },
  stt: { type: Number, default: 0 },
  exchangeCharges: { type: Number, default: 0 },
  gst: { type: Number, default: 0 },
  stampDuty: { type: Number, default: 0 },
  totalCharges: { type: Number, default: 0 },
  
  // Metadata
  createdAt: { type: Date, default: Date.now }
});

// Compound index
EquitiesTransactionSchema.index({ uniqueIdentifier: 1, transactionDateTime: -1 });
EquitiesTransactionSchema.index({ isin: 1, transactionDateTime: -1 });

const EquitiesHolding = mongoose.model('EquitiesHolding', EquitiesHoldingSchema);
const DematAccount = mongoose.model('DematAccount', DematAccountSchema);
const EquitiesTransaction = mongoose.model('EquitiesTransaction', EquitiesTransactionSchema);

module.exports = {
  EquitiesHolding,
  DematAccount,
  EquitiesTransaction
};

