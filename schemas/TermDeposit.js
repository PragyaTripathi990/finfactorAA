const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Term Deposit Schema
 * Stores data from /pfm/api/v2/term-deposit/user-linked-accounts
 * Links to LinkedAccount via fiDataId
 */
const TermDepositSchema = new Schema({
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
  
  // Deposit Details
  depositType: { type: String },  // FIXED_DEPOSIT, TAX_SAVER_FD, etc.
  principalAmount: { type: Number },
  maturityAmount: { type: Number },
  currentValue: { type: Number },
  
  // Interest
  interestRate: { type: Number },
  interestPayoutFrequency: { type: String },  // MONTHLY, QUARTERLY, ON_MATURITY
  
  // Tenure
  tenureMonths: { type: Number },
  openingDate: { type: Date },
  maturityDate: { type: Date },
  
  // Status
  accountStatus: { type: String },
  
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
TermDepositTransactionSchema.index({ accountId: 1, transactionDateTime: -1 });

const TermDeposit = mongoose.model('TermDeposit', TermDepositSchema);
const TermDepositTransaction = mongoose.model('TermDepositTransaction', TermDepositTransactionSchema);

module.exports = {
  TermDeposit,
  TermDepositTransaction
};
