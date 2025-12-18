-- =====================================================
-- FINAL SCHEMA v2 - Fixed ordering and dependencies
-- =====================================================
-- 
-- Run this in Supabase SQL Editor
-- This version handles existing tables properly
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- DROP EXISTING TABLES (in reverse dependency order)
-- Comment out if you want to keep existing data
-- =====================================================

-- Layer C (depends on Layer B)
DROP TABLE IF EXISTS user_financial_snapshots CASCADE;
DROP TABLE IF EXISTS fi_etf_holdings CASCADE;
DROP TABLE IF EXISTS fi_equity_txn_details CASCADE;
DROP TABLE IF EXISTS fi_equity_holdings CASCADE;
DROP TABLE IF EXISTS fi_equity_summaries CASCADE;
DROP TABLE IF EXISTS fi_mutual_fund_txn_details CASCADE;
DROP TABLE IF EXISTS fi_mutual_fund_holdings CASCADE;
DROP TABLE IF EXISTS fi_mutual_fund_summaries CASCADE;
DROP TABLE IF EXISTS fi_recurring_deposit_summaries CASCADE;
DROP TABLE IF EXISTS fi_term_deposit_summaries CASCADE;
DROP TABLE IF EXISTS fi_deposit_summaries CASCADE;

-- Layer B (depends on Layer A)
DROP TABLE IF EXISTS fi_transactions CASCADE;
DROP TABLE IF EXISTS fi_account_holders_pii CASCADE;
DROP TABLE IF EXISTS fi_accounts CASCADE;
DROP TABLE IF EXISTS brokers CASCADE;
DROP TABLE IF EXISTS fips CASCADE;

-- Layer A
DROP TABLE IF EXISTS aa_fetch_payloads CASCADE;
DROP TABLE IF EXISTS aa_data_fetch_runs CASCADE;
DROP TABLE IF EXISTS aa_consent_events CASCADE;
DROP TABLE IF EXISTS aa_consents CASCADE;
DROP TABLE IF EXISTS aa_redirect_events CASCADE;
DROP TABLE IF EXISTS aa_consent_requests CASCADE;
DROP TABLE IF EXISTS tsp_api_calls CASCADE;
DROP TABLE IF EXISTS tsp_auth_tokens CASCADE;
DROP TABLE IF EXISTS app_integration_apps CASCADE;
DROP TABLE IF EXISTS app_users CASCADE;
DROP TABLE IF EXISTS aa_gateways CASCADE;
DROP TABLE IF EXISTS tsp_providers CASCADE;

-- =====================================================
-- LAYER A — FLOW & CONTROL
-- =====================================================

-- Table 1: TSP Providers (e.g., FINFACTOR)
CREATE TABLE tsp_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  environment VARCHAR(20) NOT NULL DEFAULT 'SANDBOX',
  base_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, environment)
);

-- Table 2: AA Gateways (e.g., FINVU)
CREATE TABLE aa_gateways (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  environment VARCHAR(20) NOT NULL DEFAULT 'SANDBOX',
  gateway_base_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, environment)
);

-- Table 3: App Users
CREATE TABLE app_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20),
  email VARCHAR(255),
  unique_identifier VARCHAR(50) UNIQUE,  -- Regular unique constraint for ON CONFLICT
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_app_users_phone ON app_users(phone);
CREATE INDEX idx_app_users_email ON app_users(email);
CREATE INDEX idx_app_users_unique_identifier ON app_users(unique_identifier);

-- Table 4: App Integration Apps
CREATE TABLE app_integration_apps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tsp_id UUID REFERENCES tsp_providers(id),
  app_name VARCHAR(100) NOT NULL,
  tsp_user_id VARCHAR(255),
  credential_ref TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_app_integration_tsp_app ON app_integration_apps(tsp_id, app_name);

-- Table 5: TSP Auth Tokens
CREATE TABLE tsp_auth_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id UUID REFERENCES app_integration_apps(id),
  token_type VARCHAR(30) DEFAULT 'BEARER',
  access_token TEXT,
  token_hash VARCHAR(100),
  issued_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tsp_auth_tokens_app ON tsp_auth_tokens(app_id, created_at);
CREATE INDEX idx_tsp_auth_tokens_status ON tsp_auth_tokens(status, expires_at);
CREATE UNIQUE INDEX idx_tsp_auth_tokens_hash ON tsp_auth_tokens(token_hash) WHERE token_hash IS NOT NULL;

-- Table 6: TSP API Calls (AUDIT LOG)
CREATE TABLE tsp_api_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tsp_id UUID REFERENCES tsp_providers(id),
  app_id UUID REFERENCES app_integration_apps(id),
  token_id UUID REFERENCES tsp_auth_tokens(id),
  user_id UUID REFERENCES app_users(id),
  request_tag VARCHAR(50),
  http_method VARCHAR(10),
  endpoint TEXT,
  request_id VARCHAR(150),
  status_code INT,
  request_payload JSONB,
  response_payload JSONB,
  error_code VARCHAR(100),
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_tsp_api_calls_tsp ON tsp_api_calls(tsp_id, started_at);
CREATE INDEX idx_tsp_api_calls_user ON tsp_api_calls(user_id, started_at);
CREATE UNIQUE INDEX idx_tsp_api_calls_request ON tsp_api_calls(request_id) WHERE request_id IS NOT NULL;

-- Table 7: AA Consent Requests
CREATE TABLE aa_consent_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES app_users(id),
  tsp_id UUID REFERENCES tsp_providers(id),
  aa_gateway_id UUID REFERENCES aa_gateways(id),
  unique_identifier VARCHAR(50),
  aa_cust_id VARCHAR(120),
  template_name VARCHAR(100),
  user_session_id VARCHAR(150),
  redirect_url TEXT,
  encrypted_request TEXT,
  consent_handle VARCHAR(150),
  consent_url TEXT,
  request_id VARCHAR(150),
  status VARCHAR(40) DEFAULT 'CREATED',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_aa_consent_requests_user ON aa_consent_requests(user_id, created_at);
CREATE INDEX idx_aa_consent_requests_handle ON aa_consent_requests(consent_handle);

-- Table 8: AA Redirect Events
CREATE TABLE aa_redirect_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consent_request_id UUID REFERENCES aa_consent_requests(id),
  event_type VARCHAR(30),
  redirect_state VARCHAR(200),
  callback_status VARCHAR(30),
  callback_params JSONB,
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_aa_redirect_events_request ON aa_redirect_events(consent_request_id, occurred_at);

-- Table 9: AA Consents
CREATE TABLE aa_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES app_users(id),
  tsp_id UUID REFERENCES tsp_providers(id),
  aa_gateway_id UUID REFERENCES aa_gateways(id),
  consent_request_id UUID REFERENCES aa_consent_requests(id),
  consent_handle VARCHAR(150),
  template_name VARCHAR(100),
  fi_types TEXT[],
  status VARCHAR(30) DEFAULT 'PENDING',
  status_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_aa_consents_user ON aa_consents(user_id, created_at);
CREATE INDEX idx_aa_consents_status ON aa_consents(status, updated_at);
CREATE UNIQUE INDEX idx_aa_consents_handle ON aa_consents(consent_handle) WHERE consent_handle IS NOT NULL;

-- Table 10: AA Consent Events
CREATE TABLE aa_consent_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consent_id UUID REFERENCES aa_consents(id),
  event_type VARCHAR(30),
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_aa_consent_events_consent ON aa_consent_events(consent_id, created_at);

-- Table 11: AA Data Fetch Runs
CREATE TABLE aa_data_fetch_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES app_users(id),
  tsp_id UUID REFERENCES tsp_providers(id),
  consent_id UUID REFERENCES aa_consents(id),
  consent_handle VARCHAR(150),
  fetch_type VARCHAR(60),
  endpoint TEXT,
  request_id VARCHAR(150),
  status VARCHAR(30) DEFAULT 'INITIATED',
  error_code VARCHAR(100),
  error_message TEXT,
  requested_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ,
  parsed_at TIMESTAMPTZ,
  records_count INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_aa_data_fetch_runs_user ON aa_data_fetch_runs(user_id, requested_at);
CREATE INDEX idx_aa_data_fetch_runs_consent ON aa_data_fetch_runs(consent_id, requested_at);

-- Table 12: AA Fetch Payloads (RAW DATA)
CREATE TABLE aa_fetch_payloads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
  payload_role VARCHAR(20),
  content_format VARCHAR(20) DEFAULT 'JSON',
  raw_payload JSONB,
  storage_ref TEXT,
  hash_sha256 VARCHAR(80),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_aa_fetch_payloads_run ON aa_fetch_payloads(fetch_run_id, created_at);
CREATE INDEX idx_aa_fetch_payloads_hash ON aa_fetch_payloads(hash_sha256);

-- =====================================================
-- FIP & BROKER REGISTRY (Create BEFORE fi_accounts)
-- =====================================================

-- Table 13: FIPs (Banks, RTAs)
CREATE TABLE fips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fip_code VARCHAR(120),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  environment VARCHAR(20) DEFAULT 'SANDBOX',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_fips_code ON fips(fip_code) WHERE fip_code IS NOT NULL;
CREATE INDEX idx_fips_name ON fips(name);
CREATE INDEX idx_fips_type ON fips(type);

-- Table 14: Brokers (for Equities/ETF) - MUST be before fi_equity_holdings
CREATE TABLE brokers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broker_code VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'EQUITY',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_brokers_code ON brokers(broker_code) WHERE broker_code IS NOT NULL;
CREATE INDEX idx_brokers_name ON brokers(name);

-- =====================================================
-- LAYER B — CANONICAL FINANCIAL DATA
-- =====================================================

-- Table 15: FI Accounts (ALL account types)
CREATE TABLE fi_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES app_users(id),
  consent_id UUID REFERENCES aa_consents(id),
  fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
  fip_id UUID REFERENCES fips(id),
  
  fi_type VARCHAR(50) NOT NULL,
  fip_account_type VARCHAR(50),
  fip_account_sub_type VARCHAR(50),
  
  account_ref_number VARCHAR(255),
  link_ref_number VARCHAR(255),
  aa_linked_ref VARCHAR(255),
  masked_acc_no VARCHAR(255),
  
  fip_name VARCHAR(255),
  fip_id_external VARCHAR(150),
  provider_name VARCHAR(255),
  
  link_status VARCHAR(50),
  consent_id_list TEXT[],
  
  version VARCHAR(50),
  account_ref_hash VARCHAR(100),
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fi_accounts_user ON fi_accounts(user_id, created_at);
CREATE INDEX idx_fi_accounts_fi_type ON fi_accounts(fi_type);
CREATE INDEX idx_fi_accounts_account_ref ON fi_accounts(account_ref_number);
CREATE UNIQUE INDEX idx_fi_accounts_hash ON fi_accounts(account_ref_hash) WHERE account_ref_hash IS NOT NULL;

-- Table 16: FI Account Holders PII
CREATE TABLE fi_account_holders_pii (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES fi_accounts(id) ON DELETE CASCADE,
  holders_type VARCHAR(50),
  name VARCHAR(255),
  dob DATE,
  mobile VARCHAR(50),
  email VARCHAR(255),
  pan VARCHAR(20),
  address TEXT,
  ckyc_registered BOOLEAN,
  kyc_compliance VARCHAR(50),
  nominee VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fi_account_holders_account ON fi_account_holders_pii(account_id);
CREATE INDEX idx_fi_account_holders_pan ON fi_account_holders_pii(pan);

-- Table 17: FI Transactions
CREATE TABLE fi_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES fi_accounts(id) ON DELETE CASCADE,
  fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
  
  txn_id VARCHAR(255),
  txn_type VARCHAR(50),
  mode VARCHAR(50),
  amount NUMERIC(18,2),
  balance NUMERIC(18,2),
  txn_timestamp TIMESTAMPTZ,
  value_date DATE,
  narration TEXT,
  reference VARCHAR(255),
  
  category VARCHAR(100),
  sub_category VARCHAR(100),
  merchant_name VARCHAR(255),
  merchant_category VARCHAR(100),
  
  dedupe_hash VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fi_transactions_account ON fi_transactions(account_id, txn_timestamp);
CREATE INDEX idx_fi_transactions_type ON fi_transactions(txn_type);
CREATE INDEX idx_fi_transactions_category ON fi_transactions(category);
CREATE UNIQUE INDEX idx_fi_transactions_dedupe ON fi_transactions(account_id, dedupe_hash) WHERE dedupe_hash IS NOT NULL;

-- =====================================================
-- LAYER C — FINANCIAL STATE & HOLDINGS
-- =====================================================

-- Table 18: Deposit Summaries
CREATE TABLE fi_deposit_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES fi_accounts(id) ON DELETE CASCADE,
  fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
  
  current_balance NUMERIC(18,2),
  available_balance NUMERIC(18,2),
  pending_balance NUMERIC(18,2),
  currency VARCHAR(10) DEFAULT 'INR',
  balance_datetime TIMESTAMPTZ,
  
  available_credit_limit NUMERIC(18,2),
  drawing_limit NUMERIC(18,2),
  
  account_type VARCHAR(50),
  account_sub_type VARCHAR(50),
  facility_type VARCHAR(50),
  branch VARCHAR(255),
  ifsc VARCHAR(20),
  micr_code VARCHAR(20),
  opening_date DATE,
  status VARCHAR(50),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fi_deposit_summaries_account ON fi_deposit_summaries(account_id);
CREATE UNIQUE INDEX idx_fi_deposit_summaries_account_unique ON fi_deposit_summaries(account_id);

-- Table 19: Term Deposit Summaries
CREATE TABLE fi_term_deposit_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES fi_accounts(id) ON DELETE CASCADE,
  fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
  
  principal_amount NUMERIC(18,2),
  current_balance NUMERIC(18,2),
  maturity_amount NUMERIC(18,2),
  maturity_date DATE,
  interest_rate NUMERIC(9,4),
  interest_payout VARCHAR(50),
  tenure_months INT,
  tenure_days INT,
  opening_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fi_term_deposit_summaries_account ON fi_term_deposit_summaries(account_id);
CREATE UNIQUE INDEX idx_fi_term_deposit_summaries_account_unique ON fi_term_deposit_summaries(account_id);

-- Table 20: Recurring Deposit Summaries
CREATE TABLE fi_recurring_deposit_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES fi_accounts(id) ON DELETE CASCADE,
  fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
  
  current_balance NUMERIC(18,2),
  maturity_amount NUMERIC(18,2),
  maturity_date DATE,
  interest_rate NUMERIC(9,4),
  recurring_amount NUMERIC(18,2),
  tenure_months INT,
  recurring_day INT,
  installments_paid INT,
  installments_remaining INT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fi_recurring_deposit_summaries_account ON fi_recurring_deposit_summaries(account_id);
CREATE UNIQUE INDEX idx_fi_recurring_deposit_summaries_account_unique ON fi_recurring_deposit_summaries(account_id);

-- Table 21: Mutual Fund Summaries
CREATE TABLE fi_mutual_fund_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES fi_accounts(id) ON DELETE CASCADE,
  fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
  
  cost_value NUMERIC(18,2),
  current_value NUMERIC(18,2),
  total_holdings INT,
  total_folios INT,
  returns_absolute NUMERIC(18,2),
  returns_percentage NUMERIC(9,4),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fi_mutual_fund_summaries_account ON fi_mutual_fund_summaries(account_id);
CREATE UNIQUE INDEX idx_fi_mutual_fund_summaries_account_unique ON fi_mutual_fund_summaries(account_id);

-- Table 22: Mutual Fund Holdings
CREATE TABLE fi_mutual_fund_holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES fi_accounts(id) ON DELETE CASCADE,
  fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
  
  amc VARCHAR(255),
  scheme_name VARCHAR(255),
  scheme_code VARCHAR(100),
  scheme_plan VARCHAR(50),
  scheme_option VARCHAR(50),
  scheme_category VARCHAR(100),
  scheme_type VARCHAR(100),
  isin VARCHAR(50),
  
  folio_no VARCHAR(255),
  units NUMERIC(24,8),
  nav NUMERIC(18,8),
  nav_date DATE,
  cost_value NUMERIC(18,2),
  current_value NUMERIC(18,2),
  
  returns_absolute NUMERIC(18,2),
  returns_percentage NUMERIC(9,4),
  
  holding_hash VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fi_mutual_fund_holdings_account ON fi_mutual_fund_holdings(account_id);
CREATE INDEX idx_fi_mutual_fund_holdings_isin ON fi_mutual_fund_holdings(isin);
CREATE UNIQUE INDEX idx_fi_mutual_fund_holdings_hash ON fi_mutual_fund_holdings(account_id, holding_hash) WHERE holding_hash IS NOT NULL;

-- Table 23: Mutual Fund Transaction Details
CREATE TABLE fi_mutual_fund_txn_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES fi_transactions(id) ON DELETE CASCADE,
  
  isin VARCHAR(50),
  scheme_name VARCHAR(255),
  amc VARCHAR(255),
  folio_no VARCHAR(255),
  nav NUMERIC(18,8),
  nav_date DATE,
  units NUMERIC(24,8),
  lockin_flag BOOLEAN,
  lockin_days INT
);

CREATE UNIQUE INDEX idx_fi_mutual_fund_txn_details_txn ON fi_mutual_fund_txn_details(transaction_id);
CREATE INDEX idx_fi_mutual_fund_txn_details_isin ON fi_mutual_fund_txn_details(isin);

-- Table 24: Equity Summaries
CREATE TABLE fi_equity_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES fi_accounts(id) ON DELETE CASCADE,
  fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
  
  current_value NUMERIC(18,2),
  cost_value NUMERIC(18,2),
  total_holdings INT,
  total_demats INT,
  returns_absolute NUMERIC(18,2),
  returns_percentage NUMERIC(9,4),
  daily_returns NUMERIC(18,2),
  daily_returns_percentage NUMERIC(9,4),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fi_equity_summaries_account ON fi_equity_summaries(account_id);
CREATE UNIQUE INDEX idx_fi_equity_summaries_account_unique ON fi_equity_summaries(account_id);

-- Table 25: Equity Holdings (broker_id references brokers table created earlier)
CREATE TABLE fi_equity_holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES fi_accounts(id) ON DELETE CASCADE,
  fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
  broker_id UUID REFERENCES brokers(id),
  
  issuer_name VARCHAR(255),
  isin VARCHAR(50),
  isin_desc TEXT,
  
  units NUMERIC(24,8),
  avg_buy_price NUMERIC(18,4),
  last_price NUMERIC(18,4),
  current_value NUMERIC(18,2),
  cost_value NUMERIC(18,2),
  
  broker_name VARCHAR(255),
  demat_id VARCHAR(100),
  
  returns_absolute NUMERIC(18,2),
  returns_percentage NUMERIC(9,4),
  portfolio_weight_percent NUMERIC(9,4),
  
  holding_hash VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fi_equity_holdings_account ON fi_equity_holdings(account_id);
CREATE INDEX idx_fi_equity_holdings_isin ON fi_equity_holdings(isin);
CREATE INDEX idx_fi_equity_holdings_broker ON fi_equity_holdings(broker_id);
CREATE UNIQUE INDEX idx_fi_equity_holdings_hash ON fi_equity_holdings(account_id, holding_hash) WHERE holding_hash IS NOT NULL;

-- Table 26: Equity Transaction Details
CREATE TABLE fi_equity_txn_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES fi_transactions(id) ON DELETE CASCADE,
  
  order_id VARCHAR(100),
  exchange VARCHAR(50),
  isin VARCHAR(50),
  company_name VARCHAR(255),
  rate NUMERIC(18,4),
  units NUMERIC(24,8)
);

CREATE UNIQUE INDEX idx_fi_equity_txn_details_txn ON fi_equity_txn_details(transaction_id);
CREATE INDEX idx_fi_equity_txn_details_isin ON fi_equity_txn_details(isin);

-- Table 27: ETF Holdings
CREATE TABLE fi_etf_holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES fi_accounts(id) ON DELETE CASCADE,
  fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
  broker_id UUID REFERENCES brokers(id),
  
  scheme_name VARCHAR(255),
  isin VARCHAR(50),
  
  units NUMERIC(24,8),
  nav NUMERIC(18,8),
  nav_date DATE,
  current_value NUMERIC(18,2),
  
  broker_name VARCHAR(255),
  demat_id VARCHAR(100),
  
  holding_hash VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fi_etf_holdings_account ON fi_etf_holdings(account_id);
CREATE INDEX idx_fi_etf_holdings_isin ON fi_etf_holdings(isin);
CREATE UNIQUE INDEX idx_fi_etf_holdings_hash ON fi_etf_holdings(account_id, holding_hash) WHERE holding_hash IS NOT NULL;

-- Table 28: User Financial Snapshots
CREATE TABLE user_financial_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES app_users(id),
  consent_id UUID REFERENCES aa_consents(id),
  snapshot_type VARCHAR(50),
  fi_type VARCHAR(50),
  snapshot JSONB,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_snapshots_user ON user_financial_snapshots(user_id, generated_at);
CREATE INDEX idx_user_snapshots_type ON user_financial_snapshots(snapshot_type, generated_at);

-- =====================================================
-- SEED INITIAL CONFIGURATION
-- =====================================================

INSERT INTO tsp_providers (name, environment, base_url, is_active)
VALUES ('FINFACTOR', 'SANDBOX', 'https://pqapi.finfactor.in', true);

INSERT INTO aa_gateways (name, environment, gateway_base_url, is_active)
VALUES ('FINVU', 'SANDBOX', 'https://webvwdev.finvu.in', true);

INSERT INTO app_integration_apps (tsp_id, app_name, tsp_user_id, credential_ref, is_active)
SELECT 
  (SELECT id FROM tsp_providers WHERE name = 'FINFACTOR'),
  'HIJLI_PFM',
  'pfm@dhanaprayoga.co',
  'env:FINFACTOR_PASSWORD',
  true;

-- =====================================================
-- VERIFY TABLES CREATED
-- =====================================================

SELECT 'Tables created: ' || COUNT(*)::text 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

