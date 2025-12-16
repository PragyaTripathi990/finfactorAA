/**
 * Finfactor API MongoDB Schemas
 * Export all schemas for easy importing
 */

const UserSchema = require('./User');
const SubscriptionSchema = require('./Subscription');
const TermDepositSchema = require('./TermDeposit');
const RecurringDepositSchema = require('./RecurringDeposit');
const MutualFundSchema = require('./MutualFund');
const ETFSchema = require('./ETF');
const EquitiesSchema = require('./Equities');
const DepositSchema = require('./Deposit');
const NPSSchema = require('./NPS');
const ConsentSchema = require('./Consent');
const FIPSchema = require('./FIP');
const BrokerSchema = require('./Broker');
const TransactionSchema = require('./Transaction');

module.exports = {
  UserSchema,
  SubscriptionSchema,
  TermDepositSchema,
  RecurringDepositSchema,
  MutualFundSchema,
  ETFSchema,
  EquitiesSchema,
  DepositSchema,
  NPSSchema,
  ConsentSchema,
  FIPSchema,
  BrokerSchema,
  TransactionSchema,
};

