const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Broker Holding Schema (embedded)
 * Used in EquitiesHolding brokers array
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
 * Equities Holding Schema (Aggregated by ISIN)
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
  
  // Previous Day Details
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

// Compound unique index
EquitiesHoldingSchema.index({ uniqueIdentifier: 1, isin: 1 }, { unique: true });

/**
 * Equities Demat Account Schema
 * Stores data from /pfm/api/v2/equities/user-linked-accounts/demat-holding
 */
const EquitiesDematAccountSchema = new Schema({
  uniqueIdentifier: {
    type: String,
    required: true,
    index: true
  },
  dematId: {
    type: String,
    required: true,
    index: true
  },
  fiDataId: { type: String },
  fipId: { type: String },
  maskedAccNumber: { type: String },
  accountRefNumber: { type: String },
  
  // Broker Details
  brokerName: { type: String },
  brokerCode: { type: String },
  
  // Aggregated Values
  units: { type: Number },
  lastTradedPrice: { type: Number },
  avgTradedPrice: { type: Number },
  currentValue: { type: Number },
  
  // Previous Day Details
  prevDetails: {
    percentageChange: { type: Number },
    priceChange: { type: Number },
    lastFetchTime: { type: Date },
    holdingIsin: { type: String },
    totalUnits: { type: Number },
    currentValue: { type: Number }
  },
  
  // Holdings in this Demat (complex nested structure)
  holdings: { type: Schema.Types.Mixed },
  
  // Metadata
  lastFetchTime: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound unique index
EquitiesDematAccountSchema.index({ uniqueIdentifier: 1, dematId: 1 }, { unique: true });

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
  isinDescription: { type: String },
  
  // Transaction Details
  transactionDateTime: { type: Date, index: true },
  units: { type: Number },
  type: { type: String }, // BUY, SELL
  narration: { type: String },
  nav: { type: Number },
  
  // Metadata
  createdAt: { type: Date, default: Date.now }
});

// Compound indexes
EquitiesTransactionSchema.index({ uniqueIdentifier: 1, transactionDateTime: -1 });
EquitiesTransactionSchema.index({ isin: 1, transactionDateTime: -1 });

const EquitiesHolding = mongoose.model('EquitiesHolding', EquitiesHoldingSchema);
const EquitiesDematAccount = mongoose.model('EquitiesDematAccount', EquitiesDematAccountSchema);
const EquitiesTransaction = mongoose.model('EquitiesTransaction', EquitiesTransactionSchema);

module.exports = {
  EquitiesHolding,
  EquitiesDematAccount,
  EquitiesTransaction
};
