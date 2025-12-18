const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * FI Data Summary Schema - Embedded in User
 * Represents the fiDatas object from /pfm/api/v2/user-details
 */
const FIDataSummarySchema = new Schema({
  totalFiData: { type: Number, default: 0 },
  totalFiDataToBeFetched: { type: Number, default: 0 },
  lastFetchDate: { type: Date },
  currentBalance: { type: Number },  // For DEPOSIT type
  currentValue: { type: Number },
  costValue: { type: Number },
  totalHoldings: { type: Number, default: 0 },
  totalBrokers: { type: Number, default: 0 },
  dataSourceDetails: [{
    dataResourceType: { type: String }, // AA, MFC, etc.
    lastFetchDate: { type: Date }
  }]
}, { _id: false });

/**
 * User Schema
 * Stores user details from /pfm/api/v2/user-subscriptions and /pfm/api/v2/user-details
 * Based on Official WealthScape API Documentation
 */
const UserSchema = new Schema({
  uniqueIdentifier: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  mobileNumber: { type: String, index: true },
  pan: { type: String, index: true },
  email: { type: String },
  
  // Subscription Details (from /pfm/api/v2/user-subscriptions)
  subscriptionStatus: {
    type: String,
    enum: ['YES', 'NO'],
    default: 'NO'
  },
  subscriptionStart: { type: Date },  // subscriptionStartDate
  subscriptionEnd: { type: Date },    // subscriptionEndDate
  
  // Financial Data Summary (from /pfm/api/v2/user-details - fiDatas object)
  fiDatas: {
    DEPOSIT: FIDataSummarySchema,
    TERM_DEPOSIT: FIDataSummarySchema,
    RECURRING_DEPOSIT: FIDataSummarySchema,
    EQUITIES: FIDataSummarySchema,
    MUTUAL_FUNDS: FIDataSummarySchema,
    NPS: FIDataSummarySchema,
    ETF: FIDataSummarySchema
  },
  
  // Total Portfolio Value (computed from fiDatas)
  totalPortfolioValue: { type: Number, default: 0 },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastSyncedAt: { type: Date }
});

// Update timestamps
UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Calculate total portfolio value from fiDatas
UserSchema.methods.calculateTotalValue = function() {
  let total = 0;
  if (this.fiDatas) {
    if (this.fiDatas.DEPOSIT?.currentBalance) total += this.fiDatas.DEPOSIT.currentBalance;
    if (this.fiDatas.TERM_DEPOSIT?.currentValue) total += this.fiDatas.TERM_DEPOSIT.currentValue;
    if (this.fiDatas.RECURRING_DEPOSIT?.currentValue) total += this.fiDatas.RECURRING_DEPOSIT.currentValue;
    if (this.fiDatas.EQUITIES?.currentValue) total += this.fiDatas.EQUITIES.currentValue;
    if (this.fiDatas.MUTUAL_FUNDS?.currentValue) total += this.fiDatas.MUTUAL_FUNDS.currentValue;
    if (this.fiDatas.NPS?.currentValue) total += this.fiDatas.NPS.currentValue;
    if (this.fiDatas.ETF?.currentValue) total += this.fiDatas.ETF.currentValue;
  }
  this.totalPortfolioValue = total;
  return total;
};

module.exports = mongoose.model('User', UserSchema);
