const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Subscription Schema
 * Stores user subscription data from /pfm/api/v2/user-subscriptions
 */
const SubscriptionSchema = new Schema({
  uniqueIdentifier: {
    type: String,
    required: true,
    index: true
  },
  mobileNumber: {
    type: String,
    required: true
  },
  subscriptionStatus: {
    type: String,
    enum: ['YES', 'NO'],
    required: true
  },
  subscriptionStart: {
    type: Date,
    required: true
  },
  subscriptionEnd: {
    type: Date,
    required: true
  },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound index for unique subscription per user
SubscriptionSchema.index({ uniqueIdentifier: 1, mobileNumber: 1 }, { unique: true });

// Update timestamps
SubscriptionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Check if subscription is active
SubscriptionSchema.methods.isActive = function() {
  const now = new Date();
  return this.subscriptionStatus === 'YES' && 
         this.subscriptionStart <= now && 
         this.subscriptionEnd >= now;
};

module.exports = mongoose.model('Subscription', SubscriptionSchema);

