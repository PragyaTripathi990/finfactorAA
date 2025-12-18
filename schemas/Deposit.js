const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Deposit Account Schema (Extended Details)
 * Stores extended deposit account details
 * Links to LinkedAccount via fiDataId
 * Based on /pfm/api/v2/deposit/user-linked-accounts
 */
const DepositAccountSchema = new Schema({
  uniqueIdentifier: {
    type: String,
    required: true,
    index: true
  },
  fiDataId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Account Details
  currentBalance: { type: Number, default: 0 },
  availableBalance: { type: Number },
  accountStatus: { type: String },
  
  // Bank Details
  ifscCode: { type: String },
  micrCode: { type: String },
  branch: { type: String },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

/**
 * Deposit Transaction Schema
 * Stores data from /pfm/api/v2/deposit/user-account-statement
 */
const DepositTransactionSchema = new Schema({
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
  txnId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Transaction Details
  amount: { type: Number, required: true },
  narration: { type: String },
  type: {
    type: String,
    enum: ['CREDIT', 'DEBIT']
  },
  mode: { type: String }, // UPI, NEFT, RTGS, IMPS, ATM, CASH, etc.
  balance: { type: Number },
  transactionDateTime: { type: Date, index: true },
  valueDate: { type: Date },
  reference: { type: String },
  
  // Additional Details
  transactionId: { type: String },
  chequeNo: { type: String },
  category: { type: String }, // For expense categorization
  
  // Metadata
  createdAt: { type: Date, default: Date.now }
});

// Compound indexes
DepositTransactionSchema.index({ accountId: 1, transactionDateTime: -1 });
DepositTransactionSchema.index({ uniqueIdentifier: 1, transactionDateTime: -1 });

/**
 * Deposit Insights Schema
 * Stores data from /pfm/api/v2/deposit/insights
 */
const DepositInsightsSchema = new Schema({
  uniqueIdentifier: {
    type: String,
    required: true,
    index: true
  },
  accountIds: [{ type: String }],
  fromDate: { type: Date },
  toDate: { type: Date },
  frequency: {
    type: String,
    enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']
  },
  
  // Insights Data (complex nested structure from API)
  insightsData: { type: Schema.Types.Mixed },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound index
DepositInsightsSchema.index({ uniqueIdentifier: 1, fromDate: 1, toDate: 1 });

const DepositAccount = mongoose.model('DepositAccount', DepositAccountSchema);
const DepositTransaction = mongoose.model('DepositTransaction', DepositTransactionSchema);
const DepositInsights = mongoose.model('DepositInsights', DepositInsightsSchema);

module.exports = {
  DepositAccount,
  DepositTransaction,
  DepositInsights
};
