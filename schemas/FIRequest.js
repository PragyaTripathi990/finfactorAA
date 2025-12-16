const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * FI Request Schema
 * Stores data from /pfm/api/v2/firequest-user and /pfm/api/v2/firequest-account
 */
const FIRequestSchema = new Schema({
  uniqueIdentifier: {
    type: String,
    required: true,
    index: true
  },
  accountId: {
    type: String,
    sparse: true,
    index: true
  },
  
  // Request Type
  requestType: {
    type: String,
    enum: ['USER', 'ACCOUNT'],
    required: true
  },
  
  // Request Details
  requestId: { type: String },
  sessionId: { type: String },
  
  // Status
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'EXPIRED'],
    default: 'PENDING'
  },
  
  // FIP Details
  fipId: { type: String },
  fipName: { type: String },
  
  // FI Types Requested
  fiTypes: [{ type: String }],
  
  // Consent Reference
  consentId: { type: String },
  consentHandle: { type: String },
  
  // Timestamps
  requestedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  expiresAt: { type: Date },
  
  // Response Data
  responseData: { type: Schema.Types.Mixed },
  errorMessage: { type: String },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound indexes
FIRequestSchema.index({ uniqueIdentifier: 1, requestType: 1 });
FIRequestSchema.index({ uniqueIdentifier: 1, accountId: 1 });

// Update timestamps
FIRequestSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('FIRequest', FIRequestSchema);

