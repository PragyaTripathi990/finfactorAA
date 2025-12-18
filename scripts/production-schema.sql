-- =====================================================
-- PRODUCTION SCHEMA v1.0
-- =====================================================
-- 
-- Based on Supervisor's DBML with API-compatible columns
-- 
-- LAYER A: Flow & Control + RAW DATA storage
--   - tsp_api_calls.response_payload → Raw API response
--   - aa_fetch_payloads.raw_payload → Raw JSON archive
--
-- LAYER B: Canonical Data (parsed from Layer A)
--   - fi_accounts, fi_transactions, fi_account_holders_pii
--
-- LAYER C: Financial State (derived from Layer B)
--   - Summaries, Holdings
--
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- DROP EXISTING TABLES (reverse dependency order)
-- =====================================================

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
DROP TABLE IF EXISTS fi_transactions CASCADE;
DROP TABLE IF EXISTS fi_account_holders_pii CASCADE;
DROP TABLE IF EXISTS fi_accounts CASCADE;
DROP TABLE IF EXISTS brokers CASCADE;
DROP TABLE IF EXISTS fips CASCADE;
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

-- TSP Providers (e.g., FINFACTOR)
CREATE TABLE tsp_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,           -- e.g., FINFACTOR
  environment VARCHAR(20) NOT NULL DEFAULT 'SANDBOX',  -- SANDBOX / PROD
  base_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, environment)
);

-- AA Gateways (e.g., FINVU)
CREATE TABLE aa_gateways (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,           -- e.g., FINVU
  environment VARCHAR(20) NOT NULL DEFAULT 'SANDBOX',
  gateway_base_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, environment)
);

-- App Users
CREATE TABLE app_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20),
  email VARCHAR(255),
  -- Added for API compatibility
  unique_identifier VARCHAR(50) UNIQUE,  -- Mobile number used with TSP
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_app_users_phone ON app_users(phone);
CREATE INDEX idx_app_users_email ON app_users(email);

-- App Integration Apps
CREATE TABLE app_integration_apps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tsp_id UUID REFERENCES tsp_providers(id),
  app_name VARCHAR(100) NOT NULL,       -- e.g., HIJLI_PFM
  tsp_user_id VARCHAR(255),             -- e.g., pfm@dhanaprayoga
  credential_ref TEXT,                  -- pointer to vault/env
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_app_integration_tsp_app ON app_integration_apps(tsp_id, app_name);

-- TSP Auth Tokens
CREATE TABLE tsp_auth_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id UUID REFERENCES app_integration_apps(id),
  token_type VARCHAR(30) DEFAULT 'BEARER',
  access_token TEXT,                    -- store encrypted
  token_hash VARCHAR(100),              -- sha256 for indexing
  issued_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'ACTIVE',  -- ACTIVE / EXPIRED / REVOKED / FAILED
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tsp_auth_tokens_app ON tsp_auth_tokens(app_id, created_at);
CREATE INDEX idx_tsp_auth_tokens_status ON tsp_auth_tokens(status, expires_at);
CREATE UNIQUE INDEX idx_tsp_auth_tokens_hash ON tsp_auth_tokens(token_hash) WHERE token_hash IS NOT NULL;

-- TSP API Calls (AUDIT LOG + RAW DATA STORAGE)
CREATE TABLE tsp_api_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tsp_id UUID REFERENCES tsp_providers(id),
  app_id UUID REFERENCES app_integration_apps(id),
  token_id UUID REFERENCES tsp_auth_tokens(id),
  user_id UUID REFERENCES app_users(id),  -- null for app-level calls
  request_tag VARCHAR(50),                -- LOGIN / LINKED_ACCOUNTS / TRANSACTIONS etc.
  http_method VARCHAR(10),
  endpoint TEXT,
  request_id VARCHAR(150),                -- idempotency key
  status_code INT,
  request_payload JSONB,                  -- Full request body
  response_payload JSONB,                 -- ★ RAW API RESPONSE stored here!
  error_code VARCHAR(100),
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_tsp_api_calls_tsp ON tsp_api_calls(tsp_id, started_at);
CREATE INDEX idx_tsp_api_calls_user ON tsp_api_calls(user_id, started_at);
CREATE UNIQUE INDEX idx_tsp_api_calls_request ON tsp_api_calls(request_id) WHERE request_id IS NOT NULL;

-- AA Consent Requests
CREATE TABLE aa_consent_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES app_users(id),
  tsp_id UUID REFERENCES tsp_providers(id),
  aa_gateway_id UUID REFERENCES aa_gateways(id),
  unique_identifier VARCHAR(50),          -- e.g., mobile
  aa_cust_id VARCHAR(120),                -- e.g., 8956...@finvu
  template_name VARCHAR(100),             -- BANK_STATEMENT_PERIODIC
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
CREATE UNIQUE INDEX idx_aa_consent_requests_request ON aa_consent_requests(request_id) WHERE request_id IS NOT NULL;

-- AA Redirect Events
CREATE TABLE aa_redirect_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consent_request_id UUID REFERENCES aa_consent_requests(id),
  event_type VARCHAR(30),                 -- REDIRECT_OUT / CALLBACK_IN
  redirect_state VARCHAR(200),
  callback_status VARCHAR(30),
  callback_params JSONB,
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_aa_redirect_events_request ON aa_redirect_events(consent_request_id, occurred_at);

-- AA Consents (Normalized state machine)
CREATE TABLE aa_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES app_users(id),
  tsp_id UUID REFERENCES tsp_providers(id),
  aa_gateway_id UUID REFERENCES aa_gateways(id),
  consent_request_id UUID REFERENCES aa_consent_requests(id),
  consent_handle VARCHAR(150),
  template_name VARCHAR(100),
  fi_types TEXT[],
  status VARCHAR(30) DEFAULT 'PENDING',   -- PENDING / ACTIVE / REJECTED / REVOKED / EXPIRED / FAILED
  status_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_aa_consents_user ON aa_consents(user_id, created_at);
CREATE UNIQUE INDEX idx_aa_consents_handle ON aa_consents(consent_handle) WHERE consent_handle IS NOT NULL;
CREATE INDEX idx_aa_consents_status ON aa_consents(status, updated_at);

-- AA Consent Events
CREATE TABLE aa_consent_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consent_id UUID REFERENCES aa_consents(id),
  event_type VARCHAR(30),
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_aa_consent_events_consent ON aa_consent_events(consent_id, created_at);

-- AA Data Fetch Runs
CREATE TABLE aa_data_fetch_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES app_users(id),
  tsp_id UUID REFERENCES tsp_providers(id),
  consent_id UUID REFERENCES aa_consents(id),
  consent_handle VARCHAR(150),
  fetch_type VARCHAR(60),                 -- LINKED_ACCOUNTS / TRANSACTIONS / HOLDINGS / INSIGHTS etc.
  endpoint TEXT,
  request_id VARCHAR(150),
  status VARCHAR(30) DEFAULT 'INITIATED', -- INITIATED / FETCHED / PARSED / FAILED
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
CREATE INDEX idx_aa_data_fetch_runs_type ON aa_data_fetch_runs(fetch_type, requested_at);
CREATE UNIQUE INDEX idx_aa_data_fetch_runs_request ON aa_data_fetch_runs(request_id) WHERE request_id IS NOT NULL;

-- AA Fetch Payloads (★ RAW JSON ARCHIVE - Layer 1/2 raw data dump)
CREATE TABLE aa_fetch_payloads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
  payload_role VARCHAR(20),               -- REQUEST / RESPONSE
  content_format VARCHAR(20) DEFAULT 'JSON',
  raw_payload JSONB,                      -- ★ INLINE RAW JSON stored here!
  storage_ref TEXT,                       -- S3/GCS path for large payloads
  hash_sha256 VARCHAR(80),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_aa_fetch_payloads_run ON aa_fetch_payloads(fetch_run_id, created_at);
CREATE INDEX idx_aa_fetch_payloads_hash ON aa_fetch_payloads(hash_sha256);

-- =====================================================
-- FIP & BROKER REGISTRY
-- =====================================================

-- FIPs (Banks, RTAs, NBFCs)
CREATE TABLE fips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fip_code VARCHAR(120),                  -- fipId from API
  name VARCHAR(255) NOT NULL,             -- fipName from API
  type VARCHAR(50),                       -- BANK / RTA / BROKER / NBFC
  environment VARCHAR(20) DEFAULT 'SANDBOX',
  -- Added for API compatibility
  fi_types TEXT[],                        -- fiTypes array from API
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_fips_code ON fips(fip_code) WHERE fip_code IS NOT NULL;
CREATE INDEX idx_fips_name ON fips(name);
CREATE INDEX idx_fips_type ON fips(type);

-- Brokers (for Equities/ETF)
CREATE TABLE brokers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broker_code VARCHAR(100),               -- brokerId from API
  name VARCHAR(255) NOT NULL,             -- brokerName from API
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

-- FI Accounts (ALL account types unified)
CREATE TABLE fi_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES app_users(id),
  consent_id UUID REFERENCES aa_consents(id),
  fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
  fip_id UUID REFERENCES fips(id),
  
  fi_type VARCHAR(50) NOT NULL,           -- DEPOSIT / TERM_DEPOSIT / RECURRING_DEPOSIT / MUTUAL_FUNDS / EQUITIES / ETF
  fip_account_type VARCHAR(50),           -- accType: SAVINGS / CURRENT / OD / CC
  fip_account_sub_type VARCHAR(50),       -- accSubType
  
  aa_linked_ref VARCHAR(255),             -- linkRefNumber from API
  masked_acc_no VARCHAR(255),             -- maskedAccNumber from API
  provider_name VARCHAR(255),             -- fipName (fallback)
  
  -- ★ Added for API compatibility (not in original DBML)
  account_ref_number VARCHAR(255),        -- accountRefNumber from API (used for API calls)
  link_ref_number VARCHAR(255),           -- linkRefNumber from API
  fip_name VARCHAR(255),                  -- fipName from API
  fip_id_external VARCHAR(150),           -- fipId from API
  link_status VARCHAR(50),                -- linkStatus: LINKED / UNLINKED
  consent_id_list TEXT[],                 -- consentIdList array from API
  
  version VARCHAR(50),
  account_ref_hash VARCHAR(100),          -- sha256 for dedup
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fi_accounts_user ON fi_accounts(user_id, created_at);
CREATE INDEX idx_fi_accounts_consent ON fi_accounts(consent_id);
CREATE INDEX idx_fi_accounts_fip_type ON fi_accounts(fip_id, fi_type);
CREATE INDEX idx_fi_accounts_fi_type ON fi_accounts(fi_type);
CREATE INDEX idx_fi_accounts_account_ref ON fi_accounts(account_ref_number);
CREATE UNIQUE INDEX idx_fi_accounts_hash ON fi_accounts(account_ref_hash) WHERE account_ref_hash IS NOT NULL;

-- FI Account Holders PII
CREATE TABLE fi_account_holders_pii (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES fi_accounts(id) ON DELETE CASCADE,
  holders_type VARCHAR(50),               -- SINGLE / JOINT
  name VARCHAR(255),                      -- Profile.Holders.Holder[].name
  dob DATE,                               -- Profile.Holders.Holder[].dob
  mobile VARCHAR(50),                     -- Profile.Holders.Holder[].mobile
  email VARCHAR(255),                     -- Profile.Holders.Holder[].email
  pan VARCHAR(20),                        -- Profile.Holders.Holder[].pan
  address TEXT,                           -- Profile.Holders.Holder[].address
  ckyc_registered BOOLEAN,
  kyc_compliance VARCHAR(50),
  -- ★ Added for API compatibility
  nominee VARCHAR(255),                   -- Profile.Holders.Holder[].nominee
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fi_account_holders_account ON fi_account_holders_pii(account_id);
CREATE INDEX idx_fi_account_holders_pan ON fi_account_holders_pii(pan);
CREATE INDEX idx_fi_account_holders_mobile ON fi_account_holders_pii(mobile);

-- FI Transactions
CREATE TABLE fi_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES fi_accounts(id) ON DELETE CASCADE,
  fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
  
  txn_id VARCHAR(255),                    -- txnId from API
  txn_type VARCHAR(50),                   -- type: DEBIT / CREDIT / BUY / SELL
  mode VARCHAR(50),                       -- mode: UPI / NEFT / IMPS / INTEREST / OTHERS
  amount NUMERIC(18,2),                   -- amount
  balance NUMERIC(18,2),                  -- currentBalance after txn
  txn_timestamp TIMESTAMPTZ,              -- transactionTimestamp
  value_date DATE,                        -- valueDate
  narration TEXT,                         -- narration
  reference VARCHAR(255),                 -- reference
  
  -- ★ Added for API compatibility (insights categorization)
  category VARCHAR(100),                  -- category from insights
  sub_category VARCHAR(100),              -- subCategory
  merchant_name VARCHAR(255),             -- merchantName
  merchant_category VARCHAR(100),         -- merchantCategory
  
  dedupe_hash VARCHAR(100),               -- sha256 for dedup
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fi_transactions_account ON fi_transactions(account_id, txn_timestamp);
CREATE INDEX idx_fi_transactions_fetch ON fi_transactions(fetch_run_id);
CREATE INDEX idx_fi_transactions_txn_id ON fi_transactions(txn_id);
CREATE INDEX idx_fi_transactions_type ON fi_transactions(txn_type);
CREATE INDEX idx_fi_transactions_category ON fi_transactions(category);
CREATE UNIQUE INDEX idx_fi_transactions_dedupe ON fi_transactions(account_id, dedupe_hash) WHERE dedupe_hash IS NOT NULL;

-- =====================================================
-- LAYER C — FINANCIAL STATE & HOLDINGS
-- (Derived from Layer B, with summary data from APIs)
-- =====================================================

-- DEPOSIT (CASA) Summaries
CREATE TABLE fi_deposit_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES fi_accounts(id) ON DELETE CASCADE,
  fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
  
  current_balance NUMERIC(18,2),          -- Summary.currentBalance
  currency VARCHAR(10) DEFAULT 'INR',     -- Summary.currency
  balance_datetime TIMESTAMPTZ,           -- Summary.balanceDateTime
  account_type VARCHAR(50),               -- Profile.accType
  account_sub_type VARCHAR(50),           -- Profile.accSubType
  branch VARCHAR(255),                    -- Profile.branch
  ifsc VARCHAR(20),                       -- Profile.ifsc
  micr_code VARCHAR(20),                  -- Profile.micrCode
  opening_date DATE,                      -- Profile.openingDate
  status VARCHAR(50),                     -- Profile.status
  
  -- ★ Added for API compatibility (OD/CC accounts)
  available_balance NUMERIC(18,2),        -- Summary.availableBalance
  pending_balance NUMERIC(18,2),          -- Summary.pendingBalance
  available_credit_limit NUMERIC(18,2),   -- Summary.availableCreditLimit
  drawing_limit NUMERIC(18,2),            -- Summary.drawingLimit
  facility_type VARCHAR(50),              -- Profile.facilityType
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fi_deposit_summaries_account ON fi_deposit_summaries(account_id);
CREATE UNIQUE INDEX idx_fi_deposit_summaries_account_unique ON fi_deposit_summaries(account_id);
CREATE INDEX idx_fi_deposit_summaries_balance ON fi_deposit_summaries(balance_datetime);

-- RECURRING DEPOSIT Summaries
CREATE TABLE fi_recurring_deposit_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES fi_accounts(id) ON DELETE CASCADE,
  fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
  
  current_balance NUMERIC(18,2),          -- currentValue
  maturity_amount NUMERIC(18,2),          -- maturityAmount
  maturity_date DATE,                     -- maturityDate
  interest_rate NUMERIC(9,4),             -- interestRate
  recurring_amount NUMERIC(18,2),         -- recurringAmount
  tenure_months INT,                      -- tenureMonths
  recurring_day INT,                      -- recurringDay
  
  -- ★ Added for API compatibility
  installments_paid INT,                  -- installmentsPaid
  installments_remaining INT,             -- installmentsRemaining
  opening_date DATE,                      -- openingDate
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fi_recurring_deposit_summaries_account ON fi_recurring_deposit_summaries(account_id);
CREATE UNIQUE INDEX idx_fi_recurring_deposit_summaries_account_unique ON fi_recurring_deposit_summaries(account_id);
CREATE INDEX idx_fi_recurring_deposit_summaries_maturity ON fi_recurring_deposit_summaries(maturity_date);

-- TERM DEPOSIT (FD) Summaries
CREATE TABLE fi_term_deposit_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES fi_accounts(id) ON DELETE CASCADE,
  fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
  
  principal_amount NUMERIC(18,2),         -- principalAmount
  current_balance NUMERIC(18,2),          -- currentValue
  maturity_amount NUMERIC(18,2),          -- maturityAmount
  maturity_date DATE,                     -- maturityDate
  interest_rate NUMERIC(9,4),             -- interestRate
  interest_payout VARCHAR(50),            -- interestPayout: MONTHLY / QUARTERLY / MATURITY
  
  -- ★ Added for API compatibility
  tenure_months INT,                      -- tenureMonths
  tenure_days INT,                        -- tenureDays
  opening_date DATE,                      -- openingDate
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fi_term_deposit_summaries_account ON fi_term_deposit_summaries(account_id);
CREATE UNIQUE INDEX idx_fi_term_deposit_summaries_account_unique ON fi_term_deposit_summaries(account_id);
CREATE INDEX idx_fi_term_deposit_summaries_maturity ON fi_term_deposit_summaries(maturity_date);

-- MUTUAL FUND Summaries
CREATE TABLE fi_mutual_fund_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES fi_accounts(id) ON DELETE CASCADE,
  fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
  
  cost_value NUMERIC(18,2),               -- costValue
  current_value NUMERIC(18,2),            -- currentValue
  
  -- ★ Added for API compatibility
  total_holdings INT,                     -- totalHoldings
  total_folios INT,                       -- totalFolios
  returns_absolute NUMERIC(18,2),         -- returnsAbsolute
  returns_percentage NUMERIC(9,4),        -- returnsPercentage
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fi_mutual_fund_summaries_account ON fi_mutual_fund_summaries(account_id);
CREATE UNIQUE INDEX idx_fi_mutual_fund_summaries_account_unique ON fi_mutual_fund_summaries(account_id);

-- MUTUAL FUND Holdings
CREATE TABLE fi_mutual_fund_holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES fi_accounts(id) ON DELETE CASCADE,
  fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
  
  amc VARCHAR(255),                       -- amc
  scheme_name VARCHAR(255),               -- schemeName / isinDescription
  scheme_code VARCHAR(100),               -- schemeCode
  scheme_plan VARCHAR(50),                -- schemePlan: DIRECT / REGULAR
  scheme_option VARCHAR(50),              -- schemeOption: GROWTH / DIVIDEND
  isin VARCHAR(50),                       -- isin
  folio_no VARCHAR(255),                  -- folioNo
  
  units NUMERIC(24,8),                    -- closingUnits
  nav NUMERIC(18,8),                      -- nav
  nav_date DATE,                          -- navDate
  current_value NUMERIC(18,2),            -- currentValue
  
  -- ★ Added for API compatibility
  scheme_category VARCHAR(100),           -- schemeCategory: Large Cap, Mid Cap, etc.
  scheme_type VARCHAR(100),               -- schemeType: EQUITY / DEBT / HYBRID
  cost_value NUMERIC(18,2),               -- costValue
  returns_absolute NUMERIC(18,2),         -- returnsAbsolute
  returns_percentage NUMERIC(9,4),        -- returnsPercentage
  holding_hash VARCHAR(100),              -- sha256 for dedup
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fi_mutual_fund_holdings_account ON fi_mutual_fund_holdings(account_id);
CREATE INDEX idx_fi_mutual_fund_holdings_isin ON fi_mutual_fund_holdings(isin);
CREATE INDEX idx_fi_mutual_fund_holdings_folio ON fi_mutual_fund_holdings(folio_no);
CREATE UNIQUE INDEX idx_fi_mutual_fund_holdings_hash ON fi_mutual_fund_holdings(account_id, holding_hash) WHERE holding_hash IS NOT NULL;

-- MUTUAL FUND Transaction Details (1:1 with fi_transactions)
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
CREATE INDEX idx_fi_mutual_fund_txn_details_folio ON fi_mutual_fund_txn_details(folio_no);

-- EQUITY Summaries
CREATE TABLE fi_equity_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES fi_accounts(id) ON DELETE CASCADE,
  fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
  
  current_value NUMERIC(18,2),            -- currentValue
  
  -- ★ Added for API compatibility
  cost_value NUMERIC(18,2),               -- costValue
  total_holdings INT,                     -- totalHoldings
  total_demats INT,                       -- totalDemats
  returns_absolute NUMERIC(18,2),         -- returnsAbsolute
  returns_percentage NUMERIC(9,4),        -- returnsPercentage
  daily_returns NUMERIC(18,2),            -- dailyReturns
  daily_returns_percentage NUMERIC(9,4),  -- dailyReturnsPercentage
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fi_equity_summaries_account ON fi_equity_summaries(account_id);
CREATE UNIQUE INDEX idx_fi_equity_summaries_account_unique ON fi_equity_summaries(account_id);

-- EQUITY Holdings
CREATE TABLE fi_equity_holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES fi_accounts(id) ON DELETE CASCADE,
  fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
  broker_id UUID REFERENCES brokers(id),
  
  issuer_name VARCHAR(255),               -- issuerName
  isin VARCHAR(50),                       -- isin
  isin_desc TEXT,                         -- isinDescription
  
  units NUMERIC(24,8),                    -- units
  last_price NUMERIC(18,4),               -- lastTradedPrice
  current_value NUMERIC(18,2),            -- currentValue
  
  -- ★ Added for API compatibility
  avg_buy_price NUMERIC(18,4),            -- avgBuyPrice
  cost_value NUMERIC(18,2),               -- costValue
  broker_name VARCHAR(255),               -- brokerName
  demat_id VARCHAR(100),                  -- dematId
  returns_absolute NUMERIC(18,2),         -- returnsAbsolute
  returns_percentage NUMERIC(9,4),        -- returnsPercentage
  portfolio_weight_percent NUMERIC(9,4),  -- portfolioWeightPercent
  holding_hash VARCHAR(100),              -- sha256 for dedup
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fi_equity_holdings_account ON fi_equity_holdings(account_id);
CREATE INDEX idx_fi_equity_holdings_isin ON fi_equity_holdings(isin);
CREATE INDEX idx_fi_equity_holdings_broker ON fi_equity_holdings(broker_id);
CREATE UNIQUE INDEX idx_fi_equity_holdings_hash ON fi_equity_holdings(account_id, holding_hash) WHERE holding_hash IS NOT NULL;

-- EQUITY Transaction Details (1:1 with fi_transactions)
CREATE TABLE fi_equity_txn_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES fi_transactions(id) ON DELETE CASCADE,
  
  order_id VARCHAR(100),
  exchange VARCHAR(50),                   -- NSE / BSE
  isin VARCHAR(50),
  company_name VARCHAR(255),
  rate NUMERIC(18,4),
  units NUMERIC(24,8)
);

CREATE UNIQUE INDEX idx_fi_equity_txn_details_txn ON fi_equity_txn_details(transaction_id);
CREATE INDEX idx_fi_equity_txn_details_order ON fi_equity_txn_details(order_id);
CREATE INDEX idx_fi_equity_txn_details_isin ON fi_equity_txn_details(isin);

-- ETF Holdings
CREATE TABLE fi_etf_holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES fi_accounts(id) ON DELETE CASCADE,
  fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
  broker_id UUID REFERENCES brokers(id),
  
  scheme_name VARCHAR(255),               -- schemeName
  isin VARCHAR(50),                       -- isin
  
  units NUMERIC(24,8),                    -- totalUnits
  nav NUMERIC(18,8),                      -- currentNAV
  nav_date DATE,                          -- currentNAVDate
  current_value NUMERIC(18,2),            -- currentValue
  
  -- ★ Added for API compatibility
  broker_name VARCHAR(255),               -- brokerName
  demat_id VARCHAR(100),                  -- dematId
  returns_absolute NUMERIC(18,2),         -- dailyReturns
  returns_percentage NUMERIC(9,4),        -- dailyReturnsPercentage
  holding_hash VARCHAR(100),              -- sha256 for dedup
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fi_etf_holdings_account ON fi_etf_holdings(account_id);
CREATE INDEX idx_fi_etf_holdings_isin ON fi_etf_holdings(isin);
CREATE UNIQUE INDEX idx_fi_etf_holdings_hash ON fi_etf_holdings(account_id, holding_hash) WHERE holding_hash IS NOT NULL;

-- =====================================================
-- DASHBOARD SNAPSHOTS (for fast queries)
-- =====================================================

-- User Financial Snapshots (stores full insights responses)
CREATE TABLE user_financial_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES app_users(id),
  consent_id UUID REFERENCES aa_consents(id),
  snapshot_type VARCHAR(50),              -- NETWORTH / CASHFLOW / DEPOSIT_INSIGHTS / MF_INSIGHTS / EQUITY_INSIGHTS
  fi_type VARCHAR(50),                    -- Which FI type this snapshot is for
  snapshot JSONB,                         -- ★ Full insights response as JSONB
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_snapshots_user ON user_financial_snapshots(user_id, generated_at);
CREATE INDEX idx_user_snapshots_type ON user_financial_snapshots(snapshot_type, generated_at);
CREATE INDEX idx_user_snapshots_fi_type ON user_financial_snapshots(fi_type);

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
-- SUMMARY
-- =====================================================
-- 
-- Total: 29 Tables
-- 
-- LAYER A (Audit + RAW DATA):
--   tsp_providers, aa_gateways, app_users, app_integration_apps,
--   tsp_auth_tokens, tsp_api_calls*, aa_consent_requests,
--   aa_redirect_events, aa_consents, aa_consent_events,
--   aa_data_fetch_runs, aa_fetch_payloads*
--   
--   *Raw JSON stored in: tsp_api_calls.response_payload, aa_fetch_payloads.raw_payload
--
-- LAYER B (Canonical - parsed from Layer A):
--   fips, brokers, fi_accounts, fi_account_holders_pii, fi_transactions
--
-- LAYER C (Derived - from Layer B + API summaries):
--   fi_deposit_summaries, fi_term_deposit_summaries, fi_recurring_deposit_summaries,
--   fi_mutual_fund_summaries, fi_mutual_fund_holdings, fi_mutual_fund_txn_details,
--   fi_equity_summaries, fi_equity_holdings, fi_equity_txn_details,
--   fi_etf_holdings, user_financial_snapshots
--
-- =====================================================

-- Verify
SELECT 'Schema created with ' || COUNT(*)::text || ' tables' as result
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

