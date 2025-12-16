const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Unified Transaction Schema
 * Stores transactions from all asset types for unified querying
 */
const TransactionSchema = new Schema({
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
  
  // Asset Type
  assetType: {
    type: String,
    required: true,
    enum: ['DEPOSIT', 'TERM_DEPOSIT', 'RECURRING_DEPOSIT', 'EQUITIES', 'MUTUAL_FUNDS', 'ETF', 'NPS'],
    index: true
  },
  
  // Common Fields
  transactionDateTime: {
    type: Date,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['CREDIT', 'DEBIT', 'BUY', 'SELL', 'PURCHASE', 'REDEMPTION', 'SWITCH_IN', 'SWITCH_OUT', 'DIVIDEND', 'INTEREST']
  },
  amount: { type: Number, required: true },
  narration: { type: String },
  mode: { type: String },
  reference: { type: String },
  
  // Balance (for deposits)
  balance: { type: Number },
  
  // Units & NAV (for MF, ETF, Equities)
  units: { type: Number },
  nav: { type: Number },
  price: { type: Number },
  
  // ISIN (for securities)
  isin: { type: String, index: true },
  isinDescription: { type: String },
  
  // Folio (for MF)
  folioNo: { type: String },
  
  // Broker
  brokerId: { type: String },
  brokerName: { type: String },
  
  // FIP
  fipId: { type: String },
  fipName: { type: String },
  
  // Taxes & Charges
  tax: { type: Number, default: 0 },
  stampDuty: { type: Number, default: 0 },
  charges: { type: Number, default: 0 },
  totalCharges: { type: Number, default: 0 },
  
  // Data Source
  dataSource: { type: String }, // AA, MFC, etc.
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  rawData: { type: Schema.Types.Mixed } // Store original API response
});

// Compound indexes for efficient querying
TransactionSchema.index({ uniqueIdentifier: 1, transactionDateTime: -1 });
TransactionSchema.index({ uniqueIdentifier: 1, assetType: 1, transactionDateTime: -1 });
TransactionSchema.index({ accountId: 1, transactionDateTime: -1 });
TransactionSchema.index({ isin: 1, transactionDateTime: -1 });

// Virtual for net amount (positive for credit, negative for debit)
TransactionSchema.virtual('netAmount').get(function() {
  if (['CREDIT', 'BUY', 'PURCHASE', 'SWITCH_IN', 'DIVIDEND', 'INTEREST'].includes(this.type)) {
    return this.amount;
  }
  return -this.amount;
});

// Static method to get transactions by date range
TransactionSchema.statics.getByDateRange = function(uniqueIdentifier, startDate, endDate, assetType = null) {
  const query = {
    uniqueIdentifier,
    transactionDateTime: { $gte: startDate, $lte: endDate }
  };
  if (assetType) query.assetType = assetType;
  return this.find(query).sort({ transactionDateTime: -1 });
};

// Static method to get summary
TransactionSchema.statics.getSummary = async function(uniqueIdentifier, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        uniqueIdentifier,
        transactionDateTime: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$assetType',
        totalTransactions: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' }
      }
    }
  ]);
};

module.exports = mongoose.model('Transaction', TransactionSchema);

