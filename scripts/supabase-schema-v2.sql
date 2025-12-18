-- ============================================
-- Supabase Database Schema V2 - Layered Architecture
-- Based on provided schema design
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- LAYER A — FLOW & CONTROL
-- ============================================

-- TSP Providers (e.g., FINFACTOR)
DROP TABLE IF EXISTS tsp_providers CASCADE;
CREATE TABLE tsp_providers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    environment VARCHAR(20) NOT NULL CHECK (environment IN ('SANDBOX', 'PROD')),
    base_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(name, environment)
);

CREATE INDEX idx_tsp_providers_name_env ON tsp_providers(name, environment);

-- AA Gateways (e.g., FINVU)
DROP TABLE IF EXISTS aa_gateways CASCADE;
CREATE TABLE aa_gateways (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    environment VARCHAR(20) NOT NULL CHECK (environment IN ('SANDBOX', 'PROD')),
    gateway_base_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(name, environment)
);

CREATE INDEX idx_aa_gateways_name_env ON aa_gateways(name, environment);

-- Core Users
DROP TABLE IF EXISTS app_users CASCADE;
CREATE TABLE app_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(phone),
    UNIQUE(email)
);

CREATE INDEX idx_app_users_phone ON app_users(phone);
CREATE INDEX idx_app_users_email ON app_users(email);

-- App Integration Apps (App credentials to TSP)
DROP TABLE IF EXISTS app_integration_apps CASCADE;
CREATE TABLE app_integration_apps (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tsp_id UUID REFERENCES tsp_providers(id) ON DELETE CASCADE,
    app_name VARCHAR(100) NOT NULL,
    tsp_user_id VARCHAR(255) NOT NULL,
    credential_ref TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(tsp_id, app_name),
    UNIQUE(tsp_id, tsp_user_id)
);

CREATE INDEX idx_app_integration_apps_tsp ON app_integration_apps(tsp_id);

-- TSP Auth Tokens
DROP TABLE IF EXISTS tsp_auth_tokens CASCADE;
CREATE TABLE tsp_auth_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    app_id UUID REFERENCES app_integration_apps(id) ON DELETE CASCADE,
    token_type VARCHAR(30) DEFAULT 'BEARER',
    access_token TEXT,
    token_hash VARCHAR(100),
    issued_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'REVOKED', 'FAILED')),
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(token_hash)
);

CREATE INDEX idx_tsp_auth_tokens_app ON tsp_auth_tokens(app_id, created_at);
CREATE INDEX idx_tsp_auth_tokens_status ON tsp_auth_tokens(status, expires_at);

-- TSP API Calls (Audit log)
DROP TABLE IF EXISTS tsp_api_calls CASCADE;
CREATE TABLE tsp_api_calls (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tsp_id UUID REFERENCES tsp_providers(id) ON DELETE SET NULL,
    app_id UUID REFERENCES app_integration_apps(id) ON DELETE SET NULL,
    token_id UUID REFERENCES tsp_auth_tokens(id) ON DELETE SET NULL,
    user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
    request_tag VARCHAR(50),
    http_method VARCHAR(10),
    endpoint TEXT,
    request_id VARCHAR(150),
    status_code INT,
    request_payload JSONB,
    response_payload JSONB,
    error_code VARCHAR(100),
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(request_id)
);

CREATE INDEX idx_tsp_api_calls_tsp ON tsp_api_calls(tsp_id, started_at);
CREATE INDEX idx_tsp_api_calls_app ON tsp_api_calls(app_id, started_at);
CREATE INDEX idx_tsp_api_calls_user ON tsp_api_calls(user_id, started_at);

-- AA Consent Requests
DROP TABLE IF EXISTS aa_consent_requests CASCADE;
CREATE TABLE aa_consent_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    tsp_id UUID REFERENCES tsp_providers(id) ON DELETE CASCADE,
    aa_gateway_id UUID REFERENCES aa_gateways(id) ON DELETE CASCADE,
    unique_identifier VARCHAR(50),
    aa_cust_id VARCHAR(120),
    template_name VARCHAR(100),
    user_session_id VARCHAR(150),
    redirect_url TEXT,
    encrypted_request TEXT,
    consent_handle VARCHAR(150),
    consent_url TEXT,
    request_id VARCHAR(150),
    status VARCHAR(40) DEFAULT 'CREATED' CHECK (status IN ('CREATED', 'URL_ISSUED', 'REDIRECTED', 'CALLBACK_RECEIVED', 'FAILED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(request_id)
);

CREATE INDEX idx_aa_consent_requests_user ON aa_consent_requests(user_id, created_at);
CREATE INDEX idx_aa_consent_requests_tsp ON aa_consent_requests(tsp_id, created_at);
CREATE INDEX idx_aa_consent_requests_gateway ON aa_consent_requests(aa_gateway_id, created_at);
CREATE INDEX idx_aa_consent_requests_handle ON aa_consent_requests(consent_handle);
CREATE INDEX idx_aa_consent_requests_session ON aa_consent_requests(user_session_id);

-- AA Redirect Events
DROP TABLE IF EXISTS aa_redirect_events CASCADE;
CREATE TABLE aa_redirect_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    consent_request_id UUID REFERENCES aa_consent_requests(id) ON DELETE CASCADE,
    event_type VARCHAR(30) CHECK (event_type IN ('REDIRECT_OUT', 'CALLBACK_IN')),
    redirect_state VARCHAR(200),
    callback_status VARCHAR(30),
    callback_params JSONB,
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_aa_redirect_events_consent ON aa_redirect_events(consent_request_id, occurred_at);
CREATE INDEX idx_aa_redirect_events_state ON aa_redirect_events(redirect_state);

-- AA Consents (Normalized)
DROP TABLE IF EXISTS aa_consents CASCADE;
CREATE TABLE aa_consents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    tsp_id UUID REFERENCES tsp_providers(id) ON DELETE CASCADE,
    aa_gateway_id UUID REFERENCES aa_gateways(id) ON DELETE CASCADE,
    consent_request_id UUID REFERENCES aa_consent_requests(id) ON DELETE SET NULL,
    consent_handle VARCHAR(150) NOT NULL,
    template_name VARCHAR(100),
    fi_types TEXT[] DEFAULT '{}',
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'REJECTED', 'REVOKED', 'EXPIRED', 'FAILED')),
    status_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    activated_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    expired_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(consent_handle)
);

CREATE INDEX idx_aa_consents_user ON aa_consents(user_id, created_at);
CREATE INDEX idx_aa_consents_status ON aa_consents(status, updated_at);

-- AA Consent Events
DROP TABLE IF EXISTS aa_consent_events CASCADE;
CREATE TABLE aa_consent_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    consent_id UUID REFERENCES aa_consents(id) ON DELETE CASCADE,
    event_type VARCHAR(30),
    raw_payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_aa_consent_events_consent ON aa_consent_events(consent_id, created_at);
CREATE INDEX idx_aa_consent_events_type ON aa_consent_events(event_type, created_at);

-- AA Data Fetch Runs
DROP TABLE IF EXISTS aa_data_fetch_runs CASCADE;
CREATE TABLE aa_data_fetch_runs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    tsp_id UUID REFERENCES tsp_providers(id) ON DELETE CASCADE,
    consent_id UUID REFERENCES aa_consents(id) ON DELETE SET NULL,
    consent_handle VARCHAR(150),
    fetch_type VARCHAR(60),
    endpoint TEXT,
    request_id VARCHAR(150),
    status VARCHAR(30) DEFAULT 'INITIATED' CHECK (status IN ('INITIATED', 'FETCHED', 'PARSED', 'FAILED')),
    error_code VARCHAR(100),
    error_message TEXT,
    requested_at TIMESTAMP WITH TIME ZONE,
    fetched_at TIMESTAMP WITH TIME ZONE,
    parsed_at TIMESTAMP WITH TIME ZONE,
    records_count INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(request_id)
);

CREATE INDEX idx_aa_fetch_runs_user ON aa_data_fetch_runs(user_id, requested_at);
CREATE INDEX idx_aa_fetch_runs_consent ON aa_data_fetch_runs(consent_id, requested_at);
CREATE INDEX idx_aa_fetch_runs_type ON aa_data_fetch_runs(fetch_type, requested_at);
CREATE INDEX idx_aa_fetch_runs_status ON aa_data_fetch_runs(status, updated_at);

-- AA Fetch Payloads
DROP TABLE IF EXISTS aa_fetch_payloads CASCADE;
CREATE TABLE aa_fetch_payloads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    fetch_run_id UUID REFERENCES aa_data_fetch_runs(id) ON DELETE CASCADE,
    payload_role VARCHAR(20) CHECK (payload_role IN ('REQUEST', 'RESPONSE')),
    content_format VARCHAR(20) DEFAULT 'JSON',
    storage_ref TEXT,
    hash_sha256 VARCHAR(80),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_aa_fetch_payloads_run ON aa_fetch_payloads(fetch_run_id, created_at);
CREATE INDEX idx_aa_fetch_payloads_hash ON aa_fetch_payloads(hash_sha256);

-- FIP Registry
DROP TABLE IF EXISTS fips CASCADE;
CREATE TABLE fips (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    fip_code VARCHAR(120) UNIQUE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    environment VARCHAR(20) CHECK (environment IN ('SANDBOX', 'PROD')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_fips_name ON fips(name);
CREATE INDEX idx_fips_type ON fips(type);
CREATE INDEX idx_fips_environment ON fips(environment);

-- ============================================
-- LAYER B — CANONICAL FINANCIAL DATA
-- ============================================

-- FI Accounts
DROP TABLE IF EXISTS fi_accounts CASCADE;
CREATE TABLE fi_accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    consent_id UUID REFERENCES aa_consents(id) ON DELETE SET NULL,
    fetch_run_id UUID REFERENCES aa_data_fetch_runs(id) ON DELETE SET NULL,
    fip_id UUID REFERENCES fips(id) ON DELETE SET NULL,
    fi_type VARCHAR(50) NOT NULL,
    fip_account_type VARCHAR(50),
    fip_account_sub_type VARCHAR(50),
    aa_linked_ref VARCHAR(255),
    masked_acc_no VARCHAR(255),
    provider_name VARCHAR(255),
    version VARCHAR(50),
    account_ref_hash VARCHAR(100),
    last_seen_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(account_ref_hash)
);

CREATE INDEX idx_fi_accounts_user ON fi_accounts(user_id, created_at);
CREATE INDEX idx_fi_accounts_consent ON fi_accounts(consent_id);
CREATE INDEX idx_fi_accounts_fetch_run ON fi_accounts(fetch_run_id);
CREATE INDEX idx_fi_accounts_fip ON fi_accounts(fip_id, fi_type);

-- FI Account Holders PII
DROP TABLE IF EXISTS fi_account_holders_pii CASCADE;
CREATE TABLE fi_account_holders_pii (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    account_id UUID REFERENCES fi_accounts(id) ON DELETE CASCADE,
    holders_type VARCHAR(50) CHECK (holders_type IN ('SINGLE', 'JOINT')),
    name VARCHAR(255),
    dob DATE,
    mobile VARCHAR(50),
    email VARCHAR(255),
    pan VARCHAR(20),
    address TEXT,
    ckyc_registered BOOLEAN DEFAULT FALSE,
    kyc_compliance VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_fi_account_holders_account ON fi_account_holders_pii(account_id);
CREATE INDEX idx_fi_account_holders_pan ON fi_account_holders_pii(pan);
CREATE INDEX idx_fi_account_holders_mobile ON fi_account_holders_pii(mobile);

-- FI Transactions
DROP TABLE IF EXISTS fi_transactions CASCADE;
CREATE TABLE fi_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    account_id UUID REFERENCES fi_accounts(id) ON DELETE CASCADE,
    fetch_run_id UUID REFERENCES aa_data_fetch_runs(id) ON DELETE SET NULL,
    txn_id VARCHAR(255),
    txn_type VARCHAR(50),
    mode VARCHAR(50),
    amount NUMERIC(18,2),
    balance NUMERIC(18,2),
    txn_timestamp TIMESTAMP WITH TIME ZONE,
    value_date DATE,
    narration TEXT,
    reference VARCHAR(255),
    dedupe_hash VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(account_id, dedupe_hash)
);

CREATE INDEX idx_fi_transactions_account ON fi_transactions(account_id, txn_timestamp);
CREATE INDEX idx_fi_transactions_fetch_run ON fi_transactions(fetch_run_id);
CREATE INDEX idx_fi_transactions_txn_id ON fi_transactions(txn_id);

-- ============================================
-- LAYER C — FINANCIAL STATE & HOLDINGS
-- ============================================

-- FI Deposit Summaries
DROP TABLE IF EXISTS fi_deposit_summaries CASCADE;
CREATE TABLE fi_deposit_summaries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    account_id UUID REFERENCES fi_accounts(id) ON DELETE CASCADE,
    fetch_run_id UUID REFERENCES aa_data_fetch_runs(id) ON DELETE SET NULL,
    current_balance NUMERIC(18,2),
    currency VARCHAR(10) DEFAULT 'INR',
    balance_datetime TIMESTAMP WITH TIME ZONE,
    account_type VARCHAR(50),
    account_sub_type VARCHAR(50),
    branch VARCHAR(255),
    ifsc VARCHAR(20),
    micr_code VARCHAR(20),
    opening_date DATE,
    status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_fi_deposit_summaries_account ON fi_deposit_summaries(account_id);
CREATE INDEX idx_fi_deposit_summaries_balance_datetime ON fi_deposit_summaries(balance_datetime);

-- FI Recurring Deposit Summaries
DROP TABLE IF EXISTS fi_recurring_deposit_summaries CASCADE;
CREATE TABLE fi_recurring_deposit_summaries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    account_id UUID REFERENCES fi_accounts(id) ON DELETE CASCADE,
    fetch_run_id UUID REFERENCES aa_data_fetch_runs(id) ON DELETE SET NULL,
    current_balance NUMERIC(18,2),
    maturity_amount NUMERIC(18,2),
    maturity_date DATE,
    interest_rate NUMERIC(9,4),
    recurring_amount NUMERIC(18,2),
    tenure_months INT,
    recurring_day INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_fi_rd_summaries_account ON fi_recurring_deposit_summaries(account_id);
CREATE INDEX idx_fi_rd_summaries_maturity ON fi_recurring_deposit_summaries(maturity_date);

-- FI Term Deposit Summaries
DROP TABLE IF EXISTS fi_term_deposit_summaries CASCADE;
CREATE TABLE fi_term_deposit_summaries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    account_id UUID REFERENCES fi_accounts(id) ON DELETE CASCADE,
    fetch_run_id UUID REFERENCES aa_data_fetch_runs(id) ON DELETE SET NULL,
    principal_amount NUMERIC(18,2),
    current_balance NUMERIC(18,2),
    maturity_amount NUMERIC(18,2),
    maturity_date DATE,
    interest_rate NUMERIC(9,4),
    interest_payout VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_fi_td_summaries_account ON fi_term_deposit_summaries(account_id);
CREATE INDEX idx_fi_td_summaries_maturity ON fi_term_deposit_summaries(maturity_date);

-- FI Mutual Fund Summaries
DROP TABLE IF EXISTS fi_mutual_fund_summaries CASCADE;
CREATE TABLE fi_mutual_fund_summaries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    account_id UUID REFERENCES fi_accounts(id) ON DELETE CASCADE,
    fetch_run_id UUID REFERENCES aa_data_fetch_runs(id) ON DELETE SET NULL,
    cost_value NUMERIC(18,2),
    current_value NUMERIC(18,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_fi_mf_summaries_account ON fi_mutual_fund_summaries(account_id);

-- FI Mutual Fund Holdings
DROP TABLE IF EXISTS fi_mutual_fund_holdings CASCADE;
CREATE TABLE fi_mutual_fund_holdings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    account_id UUID REFERENCES fi_accounts(id) ON DELETE CASCADE,
    fetch_run_id UUID REFERENCES aa_data_fetch_runs(id) ON DELETE SET NULL,
    amc VARCHAR(255),
    scheme_name VARCHAR(255),
    scheme_code VARCHAR(100),
    scheme_plan VARCHAR(50),
    scheme_option VARCHAR(50),
    isin VARCHAR(50),
    folio_no VARCHAR(255),
    units NUMERIC(24,8),
    nav NUMERIC(18,8),
    nav_date DATE,
    current_value NUMERIC(18,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_fi_mf_holdings_account ON fi_mutual_fund_holdings(account_id);
CREATE INDEX idx_fi_mf_holdings_isin ON fi_mutual_fund_holdings(isin);
CREATE INDEX idx_fi_mf_holdings_folio ON fi_mutual_fund_holdings(folio_no);

-- FI Mutual Fund Transaction Details
DROP TABLE IF EXISTS fi_mutual_fund_txn_details CASCADE;
CREATE TABLE fi_mutual_fund_txn_details (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    transaction_id UUID REFERENCES fi_transactions(id) ON DELETE CASCADE,
    isin VARCHAR(50),
    scheme_name VARCHAR(255),
    amc VARCHAR(255),
    folio_no VARCHAR(255),
    nav NUMERIC(18,8),
    nav_date DATE,
    units NUMERIC(24,8),
    lockin_flag BOOLEAN DEFAULT FALSE,
    lockin_days INT,
    
    UNIQUE(transaction_id)
);

CREATE INDEX idx_fi_mf_txn_details_isin ON fi_mutual_fund_txn_details(isin);
CREATE INDEX idx_fi_mf_txn_details_folio ON fi_mutual_fund_txn_details(folio_no);

-- FI Equity Summaries
DROP TABLE IF EXISTS fi_equity_summaries CASCADE;
CREATE TABLE fi_equity_summaries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    account_id UUID REFERENCES fi_accounts(id) ON DELETE CASCADE,
    fetch_run_id UUID REFERENCES aa_data_fetch_runs(id) ON DELETE SET NULL,
    current_value NUMERIC(18,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_fi_equity_summaries_account ON fi_equity_summaries(account_id);

-- FI Equity Holdings
DROP TABLE IF EXISTS fi_equity_holdings CASCADE;
CREATE TABLE fi_equity_holdings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    account_id UUID REFERENCES fi_accounts(id) ON DELETE CASCADE,
    fetch_run_id UUID REFERENCES aa_data_fetch_runs(id) ON DELETE SET NULL,
    issuer_name VARCHAR(255),
    isin VARCHAR(50),
    isin_desc TEXT,
    units NUMERIC(24,8),
    last_price NUMERIC(18,4),
    current_value NUMERIC(18,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_fi_equity_holdings_account ON fi_equity_holdings(account_id);
CREATE INDEX idx_fi_equity_holdings_isin ON fi_equity_holdings(isin);

-- FI Equity Transaction Details
DROP TABLE IF EXISTS fi_equity_txn_details CASCADE;
CREATE TABLE fi_equity_txn_details (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    transaction_id UUID REFERENCES fi_transactions(id) ON DELETE CASCADE,
    order_id VARCHAR(100),
    exchange VARCHAR(50),
    isin VARCHAR(50),
    company_name VARCHAR(255),
    rate NUMERIC(18,4),
    units NUMERIC(24,8),
    
    UNIQUE(transaction_id)
);

CREATE INDEX idx_fi_equity_txn_details_order ON fi_equity_txn_details(order_id);
CREATE INDEX idx_fi_equity_txn_details_isin ON fi_equity_txn_details(isin);

-- User Financial Snapshots
DROP TABLE IF EXISTS user_financial_snapshots CASCADE;
CREATE TABLE user_financial_snapshots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    consent_id UUID REFERENCES aa_consents(id) ON DELETE SET NULL,
    snapshot_type VARCHAR(50),
    snapshot JSONB,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_snapshots_user ON user_financial_snapshots(user_id, generated_at);
CREATE INDEX idx_user_snapshots_type ON user_financial_snapshots(snapshot_type, generated_at);

-- ============================================
-- DONE! Schema created successfully
-- ============================================

SELECT 'WealthScape Schema V2 created successfully!' as status;

