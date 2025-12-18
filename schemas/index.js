/**
 * Finfactor API MongoDB Schemas
 * Based on Official WealthScape API Documentation
 * Export all schemas for easy importing
 */

const UserSchema = require('./User');
const LinkedAccountSchema = require('./LinkedAccount');
const DepositSchema = require('./Deposit');
const TermDepositSchema = require('./TermDeposit');
const RecurringDepositSchema = require('./RecurringDeposit');
const MutualFundSchema = require('./MutualFund');
const ETFSchema = require('./ETF');
const EquitiesSchema = require('./Equities');
const NPSSchema = require('./NPS');
const ConsentSchema = require('./Consent');
const FIPSchema = require('./FIP');
const BrokerSchema = require('./Broker');
const TransactionSchema = require('./Transaction');
const SubscriptionSchema = require('./Subscription');
const FIRequestSchema = require('./FIRequest');

module.exports = {
  // Core Schemas
  UserSchema,
  LinkedAccountSchema,
  
  // Deposit Module
  DepositSchema,
  DepositAccount: DepositSchema.DepositAccount,
  DepositTransaction: DepositSchema.DepositTransaction,
  DepositInsights: DepositSchema.DepositInsights,
  
  // Term Deposit Module
  TermDepositSchema,
  TermDeposit: TermDepositSchema.TermDeposit,
  TermDepositTransaction: TermDepositSchema.TermDepositTransaction,
  
  // Recurring Deposit Module
  RecurringDepositSchema,
  RecurringDeposit: RecurringDepositSchema.RecurringDeposit,
  RecurringDepositTransaction: RecurringDepositSchema.RecurringDepositTransaction,
  
  // Mutual Fund Module
  MutualFundSchema,
  MutualFundHolding: MutualFundSchema.MutualFundHolding,
  MutualFundTransaction: MutualFundSchema.MutualFundTransaction,
  MutualFundInsights: MutualFundSchema.MutualFundInsights,
  MutualFundAnalysis: MutualFundSchema.MutualFundAnalysis,
  MFCConsent: MutualFundSchema.MFCConsent,
  
  // Equities Module
  EquitiesSchema,
  EquitiesHolding: EquitiesSchema.EquitiesHolding,
  EquitiesDematAccount: EquitiesSchema.EquitiesDematAccount,
  EquitiesTransaction: EquitiesSchema.EquitiesTransaction,
  
  // ETF Module
  ETFSchema,
  ETFHolding: ETFSchema.ETFHolding,
  ETFInsights: ETFSchema.ETFInsights,
  ETFTransaction: ETFSchema.ETFTransaction,
  
  // NPS Module
  NPSSchema,
  NPSAccount: NPSSchema.NPSAccount,
  NPSSummary: NPSSchema.NPSSummary,
  
  // Consent Module
  ConsentSchema,
  AccountConsent: ConsentSchema.AccountConsent,
  ConsentRequest: ConsentSchema.ConsentRequest,
  FIRequest: ConsentSchema.FIRequest,
  AccountDelinkHistory: ConsentSchema.AccountDelinkHistory,
  Consent: ConsentSchema.Consent,  // Legacy
  
  // Master Data
  FIPSchema,
  BrokerSchema,
  
  // Other
  TransactionSchema,
  SubscriptionSchema,
  FIRequestSchema
};
