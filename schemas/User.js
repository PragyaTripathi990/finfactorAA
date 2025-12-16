const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * FI Data Schema - Embedded in User
 */
const FIDataSchema = new Schema({
  totalFiData: { type: Number, default: 0 },
  totalFiDataToBeFetched: { type: Number, default: 0 },
  lastFetchDate: { type: Date },
  currentBalance: { type: Number },
  currentValue: { type: Number },
  costValue: { type: Number },
  totalHoldings: { type: Number },
  totalBrokers: { type: Number },
  dataSourceDetails: [{
    dataResourceType: { type: String }, // AA, MFC, etc.
    lastFetchDate: { type: Date }
  }]
}, { _id: false });

/**
 * User Schema
 * Stores user details from /pfm/api/v2/user-details
 */
const UserSchema = new Schema({
  uniqueIdentifier: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  mobileNumber: { type: String },
  pan: { type: String },
  email: { type: String },
  
  // Subscription Details
  subscriptionStatus: {
    type: String,
    enum: ['YES', 'NO'],
    default: 'NO'
  },
  subscriptionStartDate: { type: Date },
  subscriptionEndDate: { type: Date },
  
  // Financial Data Summary
  fiDatas: {
    DEPOSIT: FIDataSchema,
    TERM_DEPOSIT: FIDataSchema,
    RECURRING_DEPOSIT: FIDataSchema,
    EQUITIES: FIDataSchema,
    MUTUAL_FUNDS: FIDataSchema,
    NPS: FIDataSchema,
    ETF: FIDataSchema
  },
  
  // Total Portfolio Value
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

// Calculate total portfolio value
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

