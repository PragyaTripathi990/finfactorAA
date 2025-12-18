const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Recurring Deposit Schema
 * Stores data from /pfm/api/v2/recurring-deposit/user-linked-accounts
 * Links to LinkedAccount via fiDataId
 */
const RecurringDepositSchema = new Schema({
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
  
  // FIP Info
  fipId: { type: String },
  fipName: { type: String },
  
  // RD Details
  monthlyDeposit: { type: Number },
  interestRate: { type: Number },
  tenureMonths: { type: Number },
  
  // Dates
  openingDate: { type: Date },
  maturityDate: { type: Date },
  
  // Values
  totalDeposits: { type: Number },
  maturityAmount: { type: Number },
  currentValue: { type: Number },
  
  // Installments
  installmentsPaid: { type: Number, default: 0 },
  totalInstallments: { type: Number },
  
  // Status
  accountStatus: { type: String },
  
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
  type: { type: String },
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

const RecurringDeposit = mongoose.model('RecurringDeposit', RecurringDepositSchema);
const RecurringDepositTransaction = mongoose.model('RecurringDepositTransaction', RecurringDepositTransactionSchema);

module.exports = {
  RecurringDeposit,
  RecurringDepositTransaction
};
