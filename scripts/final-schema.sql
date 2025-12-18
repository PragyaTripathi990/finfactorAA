-- =====================================================
-- FINAL SCHEMA - Based on Supervisor's DBML + API Fields
-- =====================================================
-- 
-- LAYERS:
-- A: Flow & Control (Audit, Tokens, Consents)
-- B: Canonical Financial Data (Accounts, Transactions)
-- C: Financial State & Holdings (Summaries, Holdings)
--
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- LAYER A — FLOW & CONTROL
-- =====================================================

-- Table 1: TSP Providers (e.g., FINFACTOR)
CREATE TABLE IF NOT EXISTS tsp_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  environment VARCHAR(20) NOT NULL DEFAULT 'SANDBOX', -- SANDBOX / PROD
  base_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, environment)
);

-- Table 2: AA Gateways (e.g., FINVU)
CREATE TABLE IF NOT EXISTS aa_gateways (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  environment VARCHAR(20) NOT NULL DEFAULT 'SANDBOX',
  gateway_base_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, environment)
);

-- Table 3: App Users (Core user table)
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20),
  email VARCHAR(255),
  unique_identifier VARCHAR(50), -- The mobile/identifier used with TSP
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(phone),
  UNIQUE(email),
  UNIQUE(unique_identifier)
);

CREATE INDEX IF NOT EXISTS idx_app_users_phone ON app_users(phone);
CREATE INDEX IF NOT EXISTS idx_app_users_unique_identifier ON app_users(unique_identifier);

-- Table 4: App Integration Apps
CREATE TABLE IF NOT EXISTS app_integration_apps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tsp_id UUID REFERENCES tsp_providers(id),
  app_name VARCHAR(100) NOT NULL,
  tsp_user_id VARCHAR(255), -- e.g., pfm@dhanaprayoga.co
  credential_ref TEXT, -- Reference to vault/env
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tsp_id, app_name),
  UNIQUE(tsp_id, tsp_user_id)
);

-- Table 5: TSP Auth Tokens
CREATE TABLE IF NOT EXISTS tsp_auth_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id UUID REFERENCES app_integration_apps(id),
  token_type VARCHAR(30) DEFAULT 'BEARER',
  access_token TEXT, -- Store encrypted if possible
  token_hash VARCHAR(100), -- SHA256 for indexing
  issued_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE / EXPIRED / REVOKED / FAILED
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(token_hash)
);

CREATE INDEX IF NOT EXISTS idx_tsp_auth_tokens_app_created ON tsp_auth_tokens(app_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tsp_auth_tokens_status_expires ON tsp_auth_tokens(status, expires_at);

-- Table 6: TSP API Calls (AUDIT LOG - stores RAW DATA)
CREATE TABLE IF NOT EXISTS tsp_api_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tsp_id UUID REFERENCES tsp_providers(id),
  app_id UUID REFERENCES app_integration_apps(id),
  token_id UUID REFERENCES tsp_auth_tokens(id),
  user_id UUID REFERENCES app_users(id),
  request_tag VARCHAR(50), -- LOGIN / LINKED_ACCOUNTS / TRANSACTIONS etc.
  http_method VARCHAR(10),
  endpoint TEXT,
  request_id VARCHAR(150), -- Idempotency/correlation key
  status_code INT,
  request_payload JSONB,
  response_payload JSONB, -- RAW API RESPONSE stored here!
  error_code VARCHAR(100),
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(request_id)
);

CREATE INDEX IF NOT EXISTS idx_tsp_api_calls_tsp_started ON tsp_api_calls(tsp_id, started_at);
CREATE INDEX IF NOT EXISTS idx_tsp_api_calls_app_started ON tsp_api_calls(app_id, started_at);
CREATE INDEX IF NOT EXISTS idx_tsp_api_calls_user_started ON tsp_api_calls(user_id, started_at);

-- Table 7: AA Consent Requests
CREATE TABLE IF NOT EXISTS aa_consent_requests (
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(request_id)
);

CREATE INDEX IF NOT EXISTS idx_aa_consent_requests_user ON aa_consent_requests(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_aa_consent_requests_consent_handle ON aa_consent_requests(consent_handle);

-- Table 8: AA Redirect Events
CREATE TABLE IF NOT EXISTS aa_redirect_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consent_request_id UUID REFERENCES aa_consent_requests(id),
  event_type VARCHAR(30), -- REDIRECT_OUT / CALLBACK_IN
  redirect_state VARCHAR(200),
  callback_status VARCHAR(30),
  callback_params JSONB,
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aa_redirect_events_request ON aa_redirect_events(consent_request_id, occurred_at);

-- Table 9: AA Consents (Normalized consent state)
CREATE TABLE IF NOT EXISTS aa_consents (
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(consent_handle)
);

CREATE INDEX IF NOT EXISTS idx_aa_consents_user ON aa_consents(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_aa_consents_status ON aa_consents(status, updated_at);

-- Table 10: AA Consent Events
CREATE TABLE IF NOT EXISTS aa_consent_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consent_id UUID REFERENCES aa_consents(id),
  event_type VARCHAR(30),
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aa_consent_events_consent ON aa_consent_events(consent_id, created_at);

-- Table 11: AA Data Fetch Runs
CREATE TABLE IF NOT EXISTS aa_data_fetch_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES app_users(id),
  tsp_id UUID REFERENCES tsp_providers(id),
  consent_id UUID REFERENCES aa_consents(id),
  consent_handle VARCHAR(150),
  fetch_type VARCHAR(60), -- LINKED_ACCOUNTS / TRANSACTIONS / HOLDINGS etc.
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(request_id)
);

CREATE INDEX IF NOT EXISTS idx_aa_data_fetch_runs_user ON aa_data_fetch_runs(user_id, requested_at);
CREATE INDEX IF NOT EXISTS idx_aa_data_fetch_runs_consent ON aa_data_fetch_runs(consent_id, requested_at);
CREATE INDEX IF NOT EXISTS idx_aa_data_fetch_runs_type ON aa_data_fetch_runs(fetch_type, requested_at);

-- Table 12: AA Fetch Payloads (RAW DATA archive)
CREATE TABLE IF NOT EXISTS aa_fetch_payloads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
  payload_role VARCHAR(20), -- REQUEST / RESPONSE
  content_format VARCHAR(20) DEFAULT 'JSON',
  raw_payload JSONB, -- Store inline for smaller payloads
  storage_ref TEXT, -- S3/GCS path for large payloads
  hash_sha256 VARCHAR(80),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aa_fetch_payloads_run ON aa_fetch_payloads(fetch_run_id, created_at);
CREATE INDEX IF NOT EXISTS idx_aa_fetch_payloads_hash ON aa_fetch_payloads(hash_sha256);

-- =====================================================
-- FIP REGISTRY
-- =====================================================

-- Table 13: FIPs (Banks, RTAs, Brokers)
CREATE TABLE IF NOT EXISTS fips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fip_code VARCHAR(120) UNIQUE, -- fipId from API
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50), -- BANK / RTA / BROKER / NBFC
  environment VARCHAR(20) DEFAULT 'SANDBOX',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fips_name ON fips(name);
CREATE INDEX IF NOT EXISTS idx_fips_type ON fips(type);

-- Table 14: Brokers (for Equities/ETF)
CREATE TABLE IF NOT EXISTS brokers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broker_code VARCHAR(100) UNIQUE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'EQUITY', -- EQUITY / COMMODITY
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brokers_name ON brokers(name);

-- =====================================================
-- LAYER B — CANONICAL FINANCIAL DATA
-- =====================================================

-- Table 15: FI Accounts (ALL account types)
CREATE TABLE IF NOT EXISTS fi_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES app_users(id),
  consent_id UUID REFERENCES aa_consents(id),
  fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
  fip_id UUID REFERENCES fips(id),
  
  -- Account identification
  fi_type VARCHAR(50) NOT NULL, -- DEPOSIT / TERM_DEPOSIT / RECURRING_DEPOSIT / MUTUAL_FUNDS / EQUITIES / ETF
  fip_account_type VARCHAR(50), -- SAVINGS / CURRENT / OD / CC
  fip_account_sub_type VARCHAR(50),
  
  -- Reference numbers (from API)
  account_ref_number VARCHAR(255), -- accountRefNumber - used for API calls
  link_ref_number VARCHAR(255), -- linkRefNumber
  aa_linked_ref VARCHAR(255), -- alias for link_ref_number
  masked_acc_no VARCHAR(255), -- maskedAccNumber
  
  -- FIP info
  fip_name VARCHAR(255), -- fipName
  fip_id_external VARCHAR(150), -- fipId from API
  provider_name VARCHAR(255), -- fallback provider name
  
  -- Status
  link_status VARCHAR(50), -- LINKED / UNLINKED
  consent_id_list TEXT[], -- Array of consent IDs
  
  -- Metadata
  version VARCHAR(50),
  account_ref_hash VARCHAR(100), -- SHA256 for dedup
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(account_ref_hash)
);

CREATE INDEX IF NOT EXISTS idx_fi_accounts_user ON fi_accounts(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_fi_accounts_consent ON fi_accounts(consent_id);
CREATE INDEX IF NOT EXISTS idx_fi_accounts_fip_type ON fi_accounts(fip_id, fi_type);
CREATE INDEX IF NOT EXISTS idx_fi_accounts_fi_type ON fi_accounts(fi_type);
CREATE INDEX IF NOT EXISTS idx_fi_accounts_account_ref ON fi_accounts(account_ref_number);

-- Table 16: FI Account Holders PII
CREATE TABLE IF NOT EXISTS fi_account_holders_pii (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES fi_accounts(id) ON DELETE CASCADE,
  holders_type VARCHAR(50), -- SINGLE / JOINT
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

CREATE INDEX IF NOT EXISTS idx_fi_account_holders_account ON fi_account_holders_pii(account_id);
CREATE INDEX IF NOT EXISTS idx_fi_account_holders_pan ON fi_account_holders_pii(pan);
CREATE INDEX IF NOT EXISTS idx_fi_account_holders_mobile ON fi_account_holders_pii(mobile);

-- Table 17: FI Transactions
CREATE TABLE IF NOT EXISTS fi_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES fi_accounts(id) ON DELETE CASCADE,
  fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
  
  -- Transaction details
  txn_id VARCHAR(255),
  txn_type VARCHAR(50), -- DEBIT / CREDIT / BUY / SELL
  mode VARCHAR(50), -- UPI / NEFT / IMPS / INTEREST / OTHERS
  amount NUMERIC(18,2),
  balance NUMERIC(18,2), -- Balance after transaction
  txn_timestamp TIMESTAMPTZ,
  value_date DATE,
  narration TEXT,
  reference VARCHAR(255),
  
  -- Categorization (from insights or computed)
  category VARCHAR(100),
  sub_category VARCHAR(100),
  merchant_name VARCHAR(255),
  merchant_category VARCHAR(100),
  
  -- Deduplication
  dedupe_hash VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(account_id, dedupe_hash)
);

CREATE INDEX IF NOT EXISTS idx_fi_transactions_account_time ON fi_transactions(account_id, txn_timestamp);
CREATE INDEX IF NOT EXISTS idx_fi_transactions_fetch ON fi_transactions(fetch_run_id);
CREATE INDEX IF NOT EXISTS idx_fi_transactions_txn_id ON fi_transactions(txn_id);
CREATE INDEX IF NOT EXISTS idx_fi_transactions_type ON fi_transactions(txn_type);
CREATE INDEX IF NOT EXISTS idx_fi_transactions_category ON fi_transactions(category);

-- =====================================================
-- LAYER C — FINANCIAL STATE & HOLDINGS
-- =====================================================

-- Table 18: Deposit Summaries (CASA accounts)
CREATE TABLE IF NOT EXISTS fi_deposit_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES fi_accounts(id) ON DELETE CASCADE,
  fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
  
  -- Balance info
  current_balance NUMERIC(18,2),
  available_balance NUMERIC(18,2),
  pending_balance NUMERIC(18,2),
  currency VARCHAR(10) DEFAULT 'INR',
  balance_datetime TIMESTAMPTZ,
  
  -- Credit limits (for OD/CC)
  available_credit_limit NUMERIC(18,2),
  drawing_limit NUMERIC(18,2),
  
  -- Account info
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

CREATE INDEX IF NOT EXISTS idx_fi_deposit_summaries_account ON fi_deposit_summaries(account_id);
CREATE INDEX IF NOT EXISTS idx_fi_deposit_summaries_balance_time ON fi_deposit_summaries(balance_datetime);

-- Table 19: Term Deposit Summaries (FD)
CREATE TABLE IF NOT EXISTS fi_term_deposit_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES fi_accounts(id) ON DELETE CASCADE,
  fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
  
  principal_amount NUMERIC(18,2),
  current_balance NUMERIC(18,2),
  maturity_amount NUMERIC(18,2),
  maturity_date DATE,
  interest_rate NUMERIC(9,4),
  interest_payout VARCHAR(50), -- MONTHLY / QUARTERLY / MATURITY
  tenure_months INT,
  tenure_days INT,
  opening_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fi_term_deposit_summaries_account ON fi_term_deposit_summaries(account_id);
CREATE INDEX IF NOT EXISTS idx_fi_term_deposit_summaries_maturity ON fi_term_deposit_summaries(maturity_date);

-- Table 20: Recurring Deposit Summaries (RD)
CREATE TABLE IF NOT EXISTS fi_recurring_deposit_summaries (
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

CREATE INDEX IF NOT EXISTS idx_fi_recurring_deposit_summaries_account ON fi_recurring_deposit_summaries(account_id);
CREATE INDEX IF NOT EXISTS idx_fi_recurring_deposit_summaries_maturity ON fi_recurring_deposit_summaries(maturity_date);

-- Table 21: Mutual Fund Summaries
CREATE TABLE IF NOT EXISTS fi_mutual_fund_summaries (
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

CREATE INDEX IF NOT EXISTS idx_fi_mutual_fund_summaries_account ON fi_mutual_fund_summaries(account_id);

-- Table 22: Mutual Fund Holdings
CREATE TABLE IF NOT EXISTS fi_mutual_fund_holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES fi_accounts(id) ON DELETE CASCADE,
  fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
  
  -- Fund details
  amc VARCHAR(255),
  scheme_name VARCHAR(255),
  scheme_code VARCHAR(100),
  scheme_plan VARCHAR(50), -- DIRECT / REGULAR
  scheme_option VARCHAR(50), -- GROWTH / DIVIDEND
  scheme_category VARCHAR(100),
  scheme_type VARCHAR(100),
  isin VARCHAR(50),
  
  -- Holding details
  folio_no VARCHAR(255),
  units NUMERIC(24,8),
  nav NUMERIC(18,8),
  nav_date DATE,
  cost_value NUMERIC(18,2),
  current_value NUMERIC(18,2),
  
  -- Returns
  returns_absolute NUMERIC(18,2),
  returns_percentage NUMERIC(9,4),
  
  -- Dedup
  holding_hash VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(account_id, holding_hash)
);

CREATE INDEX IF NOT EXISTS idx_fi_mutual_fund_holdings_account ON fi_mutual_fund_holdings(account_id);
CREATE INDEX IF NOT EXISTS idx_fi_mutual_fund_holdings_isin ON fi_mutual_fund_holdings(isin);
CREATE INDEX IF NOT EXISTS idx_fi_mutual_fund_holdings_folio ON fi_mutual_fund_holdings(folio_no);

-- Table 23: Mutual Fund Transaction Details
CREATE TABLE IF NOT EXISTS fi_mutual_fund_txn_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES fi_transactions(id) ON DELETE CASCADE UNIQUE,
  
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

CREATE INDEX IF NOT EXISTS idx_fi_mutual_fund_txn_details_isin ON fi_mutual_fund_txn_details(isin);
CREATE INDEX IF NOT EXISTS idx_fi_mutual_fund_txn_details_folio ON fi_mutual_fund_txn_details(folio_no);

-- Table 24: Equity Summaries
CREATE TABLE IF NOT EXISTS fi_equity_summaries (
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

CREATE INDEX IF NOT EXISTS idx_fi_equity_summaries_account ON fi_equity_summaries(account_id);

-- Table 25: Equity Holdings
CREATE TABLE IF NOT EXISTS fi_equity_holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES fi_accounts(id) ON DELETE CASCADE,
  fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
  broker_id UUID REFERENCES brokers(id),
  
  -- Stock details
  issuer_name VARCHAR(255),
  isin VARCHAR(50),
  isin_desc TEXT,
  
  -- Holding details
  units NUMERIC(24,8),
  avg_buy_price NUMERIC(18,4),
  last_price NUMERIC(18,4),
  current_value NUMERIC(18,2),
  cost_value NUMERIC(18,2),
  
  -- Broker info
  broker_name VARCHAR(255),
  demat_id VARCHAR(100),
  
  -- Returns
  returns_absolute NUMERIC(18,2),
  returns_percentage NUMERIC(9,4),
  portfolio_weight_percent NUMERIC(9,4),
  
  -- Dedup
  holding_hash VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(account_id, holding_hash)
);

CREATE INDEX IF NOT EXISTS idx_fi_equity_holdings_account ON fi_equity_holdings(account_id);
CREATE INDEX IF NOT EXISTS idx_fi_equity_holdings_isin ON fi_equity_holdings(isin);
CREATE INDEX IF NOT EXISTS idx_fi_equity_holdings_broker ON fi_equity_holdings(broker_id);

-- Table 26: Equity Transaction Details
CREATE TABLE IF NOT EXISTS fi_equity_txn_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES fi_transactions(id) ON DELETE CASCADE UNIQUE,
  
  order_id VARCHAR(100),
  exchange VARCHAR(50), -- NSE / BSE
  isin VARCHAR(50),
  company_name VARCHAR(255),
  rate NUMERIC(18,4),
  units NUMERIC(24,8)
);

CREATE INDEX IF NOT EXISTS idx_fi_equity_txn_details_order ON fi_equity_txn_details(order_id);
CREATE INDEX IF NOT EXISTS idx_fi_equity_txn_details_isin ON fi_equity_txn_details(isin);

-- Table 27: ETF Holdings
CREATE TABLE IF NOT EXISTS fi_etf_holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES fi_accounts(id) ON DELETE CASCADE,
  fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
  broker_id UUID REFERENCES brokers(id),
  
  -- ETF details
  scheme_name VARCHAR(255),
  isin VARCHAR(50),
  
  -- Holding details
  units NUMERIC(24,8),
  nav NUMERIC(18,8),
  nav_date DATE,
  current_value NUMERIC(18,2),
  
  -- Broker info
  broker_name VARCHAR(255),
  demat_id VARCHAR(100),
  
  -- Dedup
  holding_hash VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(account_id, holding_hash)
);

CREATE INDEX IF NOT EXISTS idx_fi_etf_holdings_account ON fi_etf_holdings(account_id);
CREATE INDEX IF NOT EXISTS idx_fi_etf_holdings_isin ON fi_etf_holdings(isin);

-- =====================================================
-- DASHBOARD & SNAPSHOTS
-- =====================================================

-- Table 28: User Financial Snapshots (JSONB for insights)
CREATE TABLE IF NOT EXISTS user_financial_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES app_users(id),
  consent_id UUID REFERENCES aa_consents(id),
  snapshot_type VARCHAR(50), -- NETWORTH / CASHFLOW / DEPOSIT_INSIGHTS / MF_INSIGHTS / EQUITY_INSIGHTS
  fi_type VARCHAR(50), -- Which FI type this snapshot is for
  snapshot JSONB, -- Full insights response
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_snapshots_user ON user_financial_snapshots(user_id, generated_at);
CREATE INDEX IF NOT EXISTS idx_user_snapshots_type ON user_financial_snapshots(snapshot_type, generated_at);
CREATE INDEX IF NOT EXISTS idx_user_snapshots_fi_type ON user_financial_snapshots(fi_type);

-- =====================================================
-- SEED INITIAL CONFIGURATION DATA
-- =====================================================

-- Insert TSP Provider (FINFACTOR)
INSERT INTO tsp_providers (name, environment, base_url, is_active)
VALUES ('FINFACTOR', 'SANDBOX', 'https://pqapi.finfactor.in', true)
ON CONFLICT (name, environment) DO NOTHING;

-- Insert AA Gateway (FINVU)
INSERT INTO aa_gateways (name, environment, gateway_base_url, is_active)
VALUES ('FINVU', 'SANDBOX', 'https://webvwdev.finvu.in', true)
ON CONFLICT (name, environment) DO NOTHING;

-- Insert App Integration
INSERT INTO app_integration_apps (tsp_id, app_name, tsp_user_id, credential_ref, is_active)
SELECT 
  (SELECT id FROM tsp_providers WHERE name = 'FINFACTOR' AND environment = 'SANDBOX'),
  'HIJLI_PFM',
  'pfm@dhanaprayoga.co',
  'env:FINFACTOR_PASSWORD',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM app_integration_apps WHERE app_name = 'HIJLI_PFM'
);

-- =====================================================
-- SUMMARY
-- =====================================================
-- 
-- Total Tables: 28
-- 
-- Layer A (Audit/Control): 12 tables
--   - tsp_providers, aa_gateways, app_users
--   - app_integration_apps, tsp_auth_tokens, tsp_api_calls
--   - aa_consent_requests, aa_redirect_events, aa_consents, aa_consent_events
--   - aa_data_fetch_runs, aa_fetch_payloads
--
-- Layer B (Canonical Data): 5 tables
--   - fips, brokers, fi_accounts, fi_account_holders_pii, fi_transactions
--
-- Layer C (Holdings/Summaries): 11 tables
--   - fi_deposit_summaries, fi_term_deposit_summaries, fi_recurring_deposit_summaries
--   - fi_mutual_fund_summaries, fi_mutual_fund_holdings, fi_mutual_fund_txn_details
--   - fi_equity_summaries, fi_equity_holdings, fi_equity_txn_details
--   - fi_etf_holdings, user_financial_snapshots
--
-- =====================================================

