const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Recurring Deposit Account Schema
 * Stores data from /pfm/api/v2/recurring-deposit/user-linked-accounts
 */
const RecurringDepositAccountSchema = new Schema({
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
  accountType: { type: String, default: 'RECURRING_DEPOSIT' },
  
  // FIP Details
  fipId: { type: String },
  fipName: { type: String },
  
  // RD Details
  monthlyInstallment: { type: Number },
  currentValue: { type: Number },
  maturityAmount: { type: Number },
  maturityDate: { type: Date },
  interestRate: { type: Number },
  tenureMonths: { type: Number },
  installmentsPaid: { type: Number },
  totalInstallments: { type: Number },
  
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
 * Recurring Deposit Transaction Schema
 * Stores data from /pfm/api/v2/recurring-deposit/user-account-statement
 */
const RecurringDepositTransactionSchema = new Schema({
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
RecurringDepositTransactionSchema.index({ accountId: 1, transactionDateTime: -1 });

const RecurringDepositAccount = mongoose.model('RecurringDepositAccount', RecurringDepositAccountSchema);
const RecurringDepositTransaction = mongoose.model('RecurringDepositTransaction', RecurringDepositTransactionSchema);

module.exports = {
  RecurringDepositAccount,
  RecurringDepositTransaction
};

