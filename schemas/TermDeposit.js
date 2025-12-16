const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Term Deposit Account Schema
 * Stores data from /pfm/api/v2/term-deposit/user-linked-accounts
 */
const TermDepositAccountSchema = new Schema({
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
  accountName: { type: String },
  accountType: { type: String, default: 'TERM_DEPOSIT' },
  
  // FIP Details
  fipId: { type: String },
  fipName: { type: String },
  
  // FD Details
  depositAmount: { type: Number },
  currentValue: { type: Number },
  maturityAmount: { type: Number },
  maturityDate: { type: Date },
  interestRate: { type: Number },
  tenureDays: { type: Number },
  tenureMonths: { type: Number },
  tenureYears: { type: Number },
  
  // Data Status
  dataFetched: { type: Boolean, default: false },
  lastFetchDateTime: { type: Date },
  
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
 * Term Deposit Transaction Schema
 * Stores data from /pfm/api/v2/term-deposit/user-account-statement
 */
const TermDepositTransactionSchema = new Schema({
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
  amount: { type: Number, required: true },
  narration: { type: String },
  type: {
    type: String,
    enum: ['CREDIT', 'DEBIT']
  },
  mode: { type: String },
  balance: { type: Number },
  transactionDateTime: { type: Date, index: true },
  valueDate: { type: Date },
  reference: { type: String },
  
  // Metadata
  createdAt: { type: Date, default: Date.now }
});

// Compound index
TermDepositTransactionSchema.index({ accountId: 1, transactionDateTime: -1 });

const TermDepositAccount = mongoose.model('TermDepositAccount', TermDepositAccountSchema);
const TermDepositTransaction = mongoose.model('TermDepositTransaction', TermDepositTransactionSchema);

module.exports = {
  TermDepositAccount,
  TermDepositTransaction
};

