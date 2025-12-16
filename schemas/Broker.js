const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Broker Schema
 * Stores data from /pfm/api/v2/brokers
 */
const BrokerSchema = new Schema({
  brokerId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  brokerName: {
    type: String,
    required: true
  },
  brokerCode: { type: String },
  
  // Status
  enabled: { type: Boolean, default: true },
  
  // Logo
  logoUrl: { type: String },
  
  // Broker Type
  brokerType: {
    type: String,
    enum: ['FULL_SERVICE', 'DISCOUNT', 'DEPOSITORY']
  },
  
  // Supported Asset Types
  supportedAssets: [{
    type: String,
    enum: ['EQUITIES', 'ETF', 'MUTUAL_FUNDS', 'BONDS', 'COMMODITIES', 'CURRENCY']
  }],
  
  // SEBI Registration
  sebiRegNo: { type: String },
  
  // Exchange Memberships
  exchanges: [{
    type: String,
    enum: ['NSE', 'BSE', 'MCX', 'NCDEX']
  }],
  
  // Contact
  website: { type: String },
  supportEmail: { type: String },
  supportPhone: { type: String },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Text index for search
BrokerSchema.index({ brokerName: 'text' });

module.exports = mongoose.model('Broker', BrokerSchema);

