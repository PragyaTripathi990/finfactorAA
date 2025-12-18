const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * ETF Holding Schema
 * Stores data from /pfm/api/v2/etf/user-linked-accounts
 * Similar structure to equities but for ETFs
 */
const ETFHoldingSchema = new Schema({
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
  
  // ETF Details
  issuerName: { type: String },
  isinDescription: { type: String },
  
  // Holdings
  units: { type: Number },
  lastTradedPrice: { type: Number },
  avgTradedPrice: { type: Number },
  currentValue: { type: Number },
  
  // NAV
  nav: { type: Number },
  navDate: { type: Date },
  
  // Portfolio Weight
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
  
  // Broker-wise breakdown
  brokers: [{
    brokerName: { type: String },
    brokerId: { type: String },
    units: { type: Number },
    lastTradedPrice: { type: Number },
    currentValue: { type: Number }
  }],
  
  // Metadata
  lastFetchTime: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound unique index
ETFHoldingSchema.index({ uniqueIdentifier: 1, isin: 1 }, { unique: true });

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
  
  // Returns Summary
  returnsSummary: {
    dailyReturns: { type: Number },
    dailyReturnsPercentage: { type: Number }
  },
  
  // Demat-wise Distribution (complex nested structure)
  dematWiseDistribution: { type: Schema.Types.Mixed },
  
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
  units: { type: Number },
  type: { type: String }, // BUY, SELL
  narration: { type: String },
  nav: { type: Number },
  
  // Metadata
  createdAt: { type: Date, default: Date.now }
});

// Compound indexes
ETFTransactionSchema.index({ uniqueIdentifier: 1, transactionDateTime: -1 });
ETFTransactionSchema.index({ isin: 1, transactionDateTime: -1 });

const ETFHolding = mongoose.model('ETFHolding', ETFHoldingSchema);
const ETFInsights = mongoose.model('ETFInsights', ETFInsightsSchema);
const ETFTransaction = mongoose.model('ETFTransaction', ETFTransactionSchema);

module.exports = {
  ETFHolding,
  ETFInsights,
  ETFTransaction
};
