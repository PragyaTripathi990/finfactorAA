const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Mutual Fund Master Schema
 * Stores data from /pfm/api/v2/mutualfunds (Master list of all mutual funds)
 */
const MutualFundMasterSchema = new Schema({
  // Identifiers
  isin: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  amfiCode: {
    type: String,
    index: true
  },
  schemeCode: { type: String },
  
  // Scheme Details
  schemeName: { type: String, required: true },
  schemeType: { type: String }, // Open-ended, Close-ended
  schemeCategory: { type: String }, // Equity, Debt, Hybrid
  schemeSubCategory: { type: String }, // Large Cap, Mid Cap, etc.
  
  // AMC Details
  amc: { type: String, index: true },
  amcCode: { type: String },
  
  // Registrar
  registrar: { type: String },
  
  // Plan & Option
  planType: { type: String }, // Direct, Regular
  optionType: { type: String }, // Growth, IDCW
  
  // NAV Details
  currentNav: { type: Number },
  navDate: { type: Date },
  
  // Launch Details
  launchDate: { type: Date },
  
  // Fund Details
  fundManager: { type: String },
  aum: { type: Number }, // Assets Under Management
  expenseRatio: { type: Number },
  exitLoad: { type: String },
  lockInPeriod: { type: String },
  minInvestment: { type: Number },
  minSipAmount: { type: Number },
  
  // Risk
  riskLevel: {
    type: String,
    enum: ['LOW', 'MODERATELY_LOW', 'MODERATE', 'MODERATELY_HIGH', 'HIGH', 'VERY_HIGH']
  },
  
  // Returns (CAGR)
  returns1Y: { type: Number },
  returns3Y: { type: Number },
  returns5Y: { type: Number },
  returnsSinceInception: { type: Number },
  
  // Benchmark
  benchmark: { type: String },
  
  // Status
  isActive: { type: Boolean, default: true },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Text index for search
MutualFundMasterSchema.index({ schemeName: 'text', amc: 'text' });

// Compound indexes
MutualFundMasterSchema.index({ amc: 1, schemeCategory: 1 });
MutualFundMasterSchema.index({ schemeCategory: 1, schemeSubCategory: 1 });

module.exports = mongoose.model('MutualFundMaster', MutualFundMasterSchema);

