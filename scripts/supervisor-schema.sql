-- =====================================================
-- SUPERVISOR'S DBML SCHEMA - Converted to PostgreSQL
-- For Supabase Database
-- =====================================================
-- This schema is designed for Account Aggregator (AA) 
-- financial data management with proper normalization
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- LAYER A — FLOW & CONTROL
-- =====================================================

-- TSP (Technology Service Provider) Providers
CREATE TABLE IF NOT EXISTS tsp_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,  -- e.g., FINFACTOR
    environment VARCHAR(20) NOT NULL,  -- SANDBOX / PROD
    base_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, environment)
);

-- AA (Account Aggregator) Gateways
CREATE TABLE IF NOT EXISTS aa_gateways (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,  -- e.g., FINVU
    environment VARCHAR(20) NOT NULL,  -- SANDBOX / PROD
    gateway_base_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, environment)
);

-- =====================================================
-- CORE USER
-- =====================================================

CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20),
    email VARCHAR(255),
    unique_identifier VARCHAR(50),  -- Added for API compatibility
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(phone),
    UNIQUE(email),
    UNIQUE(unique_identifier)
);

-- =====================================================
-- STEP 1 — APP AUTH DETAILS + TOKEN STORAGE
-- =====================================================

-- Integration Apps (your app credentials with TSP)
CREATE TABLE IF NOT EXISTS app_integration_apps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tsp_id UUID REFERENCES tsp_providers(id),
    app_name VARCHAR(100) NOT NULL,  -- e.g., HIJLI_PFM
    tsp_user_id VARCHAR(255),  -- e.g., pfm@dhanaprayoga
    credential_ref TEXT,  -- pointer/name/key in vault/env
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tsp_id, app_name),
    UNIQUE(tsp_id, tsp_user_id)
);

-- TSP Auth Tokens
CREATE TABLE IF NOT EXISTS tsp_auth_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_id UUID REFERENCES app_integration_apps(id),
    token_type VARCHAR(30) DEFAULT 'BEARER',
    access_token TEXT,
    token_hash VARCHAR(100),  -- sha256(access_token)
    issued_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'ACTIVE',  -- ACTIVE / EXPIRED / REVOKED / FAILED
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(token_hash)
);

CREATE INDEX IF NOT EXISTS idx_tsp_auth_tokens_app_created ON tsp_auth_tokens(app_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tsp_auth_tokens_status_expires ON tsp_auth_tokens(status, expires_at);

-- TSP API Calls (audit trail)
CREATE TABLE IF NOT EXISTS tsp_api_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tsp_id UUID REFERENCES tsp_providers(id),
    app_id UUID REFERENCES app_integration_apps(id),
    token_id UUID REFERENCES tsp_auth_tokens(id),
    user_id UUID REFERENCES app_users(id),
    request_tag VARCHAR(50),  -- LOGIN / SUBMIT_CONSENT / LINKED_ACCOUNTS / TXNS etc.
    http_method VARCHAR(10),
    endpoint TEXT,
    request_id VARCHAR(150),  -- idempotency/correlation key
    status_code INT,
    request_payload JSONB,
    response_payload JSONB,
    error_code VARCHAR(100),
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    UNIQUE(request_id)
);

CREATE INDEX IF NOT EXISTS idx_tsp_api_calls_tsp_started ON tsp_api_calls(tsp_id, started_at);
CREATE INDEX IF NOT EXISTS idx_tsp_api_calls_app_started ON tsp_api_calls(app_id, started_at);
CREATE INDEX IF NOT EXISTS idx_tsp_api_calls_user_started ON tsp_api_calls(user_id, started_at);

-- =====================================================
-- STEP 2 — CONSENT REQUEST
-- =====================================================

CREATE TABLE IF NOT EXISTS aa_consent_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES app_users(id),
    tsp_id UUID REFERENCES tsp_providers(id),
    aa_gateway_id UUID REFERENCES aa_gateways(id),
    unique_identifier VARCHAR(50),  -- e.g., mobile
    aa_cust_id VARCHAR(120),  -- e.g., 8956...@finvu
    template_name VARCHAR(100),  -- BANK_STATEMENT_PERIODIC
    user_session_id VARCHAR(150),
    redirect_url TEXT,
    encrypted_request TEXT,
    consent_handle VARCHAR(150),
    consent_url TEXT,
    request_id VARCHAR(150),
    status VARCHAR(40) DEFAULT 'CREATED',  -- CREATED / URL_ISSUED / REDIRECTED / CALLBACK_RECEIVED / FAILED
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(request_id)
);

CREATE INDEX IF NOT EXISTS idx_aa_consent_requests_user ON aa_consent_requests(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_aa_consent_requests_consent_handle ON aa_consent_requests(consent_handle);

-- =====================================================
-- STEP 3 — REDIRECT + CALLBACK EVENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS aa_redirect_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consent_request_id UUID REFERENCES aa_consent_requests(id),
    event_type VARCHAR(30),  -- REDIRECT_OUT / CALLBACK_IN
    redirect_state VARCHAR(200),
    callback_status VARCHAR(30),  -- success/failure
    callback_params JSONB,
    occurred_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aa_redirect_events_consent ON aa_redirect_events(consent_request_id, occurred_at);

-- =====================================================
-- NORMALIZED CONSENT (state machine)
-- =====================================================

CREATE TABLE IF NOT EXISTS aa_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES app_users(id),
    tsp_id UUID REFERENCES tsp_providers(id),
    aa_gateway_id UUID REFERENCES aa_gateways(id),
    consent_request_id UUID REFERENCES aa_consent_requests(id),
    consent_handle VARCHAR(150),
    template_name VARCHAR(100),
    fi_types TEXT[],
    status VARCHAR(30) DEFAULT 'PENDING',  -- PENDING / ACTIVE / REJECTED / REVOKED / EXPIRED / FAILED
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

CREATE TABLE IF NOT EXISTS aa_consent_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consent_id UUID REFERENCES aa_consents(id),
    event_type VARCHAR(30),  -- CREATED / APPROVED / REJECTED / REVOKED / EXPIRED / FAILED
    raw_payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aa_consent_events_consent ON aa_consent_events(consent_id, created_at);

-- =====================================================
-- STEP 4 — DATA FETCH RUNS + RAW PAYLOADS
-- =====================================================

CREATE TABLE IF NOT EXISTS aa_data_fetch_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES app_users(id),
    tsp_id UUID REFERENCES tsp_providers(id),
    consent_id UUID REFERENCES aa_consents(id),
    consent_handle VARCHAR(150),
    fetch_type VARCHAR(60),  -- LINKED_ACCOUNTS / BALANCES / TRANSACTIONS / STATEMENT / HOLDINGS / SUMMARY
    endpoint TEXT,
    request_id VARCHAR(150),
    status VARCHAR(30) DEFAULT 'INITIATED',  -- INITIATED / FETCHED / PARSED / FAILED
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

CREATE TABLE IF NOT EXISTS aa_fetch_payloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
    payload_role VARCHAR(20),  -- REQUEST / RESPONSE
    content_format VARCHAR(20),  -- JSON / TEXT
    storage_ref TEXT,  -- S3/GCS path
    hash_sha256 VARCHAR(80),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aa_fetch_payloads_run ON aa_fetch_payloads(fetch_run_id, created_at);

-- =====================================================
-- FIP REGISTRY (BANK/RTA/BROKER etc.)
-- =====================================================

CREATE TABLE IF NOT EXISTS fips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fip_code VARCHAR(120),
    name VARCHAR(255),
    type VARCHAR(50),  -- BANK / RTA / BROKER / NBFC / etc.
    environment VARCHAR(20),  -- SANDBOX / PROD
    is_active BOOLEAN DEFAULT true,
    -- Additional fields from API
    fip_id VARCHAR(100),
    product_types TEXT[],
    aa_identifier TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(fip_code)
);

CREATE INDEX IF NOT EXISTS idx_fips_name ON fips(name);
CREATE INDEX IF NOT EXISTS idx_fips_type ON fips(type);

-- =====================================================
-- LAYER B — CANONICAL FINANCIAL DATA
-- =====================================================

CREATE TABLE IF NOT EXISTS fi_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES app_users(id),
    consent_id UUID REFERENCES aa_consents(id),
    fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
    fip_id UUID REFERENCES fips(id),
    fi_type VARCHAR(50),  -- DEPOSIT / TERM_DEPOSIT / MUTUAL_FUNDS / EQUITIES etc.
    fip_account_type VARCHAR(50),  -- SAVINGS / CURRENT / OD / CC etc.
    fip_account_sub_type VARCHAR(50),
    aa_linked_ref VARCHAR(255),  -- linkedAccRef
    masked_acc_no VARCHAR(255),
    provider_name VARCHAR(255),
    version VARCHAR(50),
    account_ref_hash VARCHAR(100),  -- sha256(user + fip + linkedRef/masked + fi_type)
    -- Additional fields from API
    account_ref_number VARCHAR(255),
    link_ref_number VARCHAR(255),
    link_status VARCHAR(50),
    consent_id_list TEXT[],
    fip_name VARCHAR(255),
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(account_ref_hash)
);

CREATE INDEX IF NOT EXISTS idx_fi_accounts_user ON fi_accounts(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_fi_accounts_fip_type ON fi_accounts(fip_id, fi_type);

CREATE TABLE IF NOT EXISTS fi_account_holders_pii (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES fi_accounts(id),
    holders_type VARCHAR(50),  -- SINGLE / JOINT
    name VARCHAR(255),
    dob DATE,
    mobile VARCHAR(50),
    email VARCHAR(255),
    pan VARCHAR(20),
    address TEXT,
    ckyc_registered BOOLEAN,
    kyc_compliance VARCHAR(50),  -- COMPLETED / PENDING / UNKNOWN
    -- Additional fields from API
    nominee VARCHAR(50),  -- REGISTERED / NOT_REGISTERED
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fi_account_holders_account ON fi_account_holders_pii(account_id);
CREATE INDEX IF NOT EXISTS idx_fi_account_holders_pan ON fi_account_holders_pii(pan);

CREATE TABLE IF NOT EXISTS fi_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES fi_accounts(id),
    fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
    txn_id VARCHAR(255),
    txn_type VARCHAR(50),  -- DEBIT / CREDIT / BUY / SELL etc.
    mode VARCHAR(50),  -- UPI / NEFT / IMPS / INTEREST etc.
    amount NUMERIC(18,2),
    balance NUMERIC(18,2),
    txn_timestamp TIMESTAMPTZ,
    value_date DATE,
    narration TEXT,
    reference VARCHAR(255),
    dedupe_hash VARCHAR(100),  -- sha256(account + amount + ts + narration + reference)
    -- Additional fields from API
    category VARCHAR(100),
    sub_category VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(account_id, dedupe_hash)
);

CREATE INDEX IF NOT EXISTS idx_fi_transactions_account ON fi_transactions(account_id, txn_timestamp);
CREATE INDEX IF NOT EXISTS idx_fi_transactions_fetch ON fi_transactions(fetch_run_id);

-- =====================================================
-- LAYER C — FINANCIAL STATE & HOLDINGS
-- =====================================================

-- CASA/DEPOSIT SUMMARY
CREATE TABLE IF NOT EXISTS fi_deposit_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES fi_accounts(id),
    fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
    current_balance NUMERIC(18,2),
    currency VARCHAR(10) DEFAULT 'INR',
    balance_datetime TIMESTAMPTZ,
    account_type VARCHAR(50),
    account_sub_type VARCHAR(50),
    branch VARCHAR(255),
    ifsc VARCHAR(20),
    micr_code VARCHAR(20),
    opening_date DATE,
    status VARCHAR(50),
    -- Additional fields from API
    pending_balance NUMERIC(18,2),
    available_credit_limit NUMERIC(18,2),
    drawing_limit NUMERIC(18,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fi_deposit_summaries_account ON fi_deposit_summaries(account_id);

-- RD SUMMARY
CREATE TABLE IF NOT EXISTS fi_recurring_deposit_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES fi_accounts(id),
    fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
    current_balance NUMERIC(18,2),
    maturity_amount NUMERIC(18,2),
    maturity_date DATE,
    interest_rate NUMERIC(9,4),
    recurring_amount NUMERIC(18,2),
    tenure_months INT,
    recurring_day INT,
    -- Additional fields from API
    principal_amount NUMERIC(18,2),
    opening_date DATE,
    current_value NUMERIC(18,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fi_rd_summaries_account ON fi_recurring_deposit_summaries(account_id);

-- FD/TD SUMMARY
CREATE TABLE IF NOT EXISTS fi_term_deposit_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES fi_accounts(id),
    fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
    principal_amount NUMERIC(18,2),
    current_balance NUMERIC(18,2),
    maturity_amount NUMERIC(18,2),
    maturity_date DATE,
    interest_rate NUMERIC(9,4),
    interest_payout VARCHAR(50),
    -- Additional fields from API
    opening_date DATE,
    tenure_days INT,
    tenure_months INT,
    current_value NUMERIC(18,2),
    compounding_frequency VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fi_td_summaries_account ON fi_term_deposit_summaries(account_id);

-- MF SUMMARY
CREATE TABLE IF NOT EXISTS fi_mutual_fund_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES fi_accounts(id),
    fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
    cost_value NUMERIC(18,2),
    current_value NUMERIC(18,2),
    -- Additional fields from API
    total_investment NUMERIC(18,2),
    total_units NUMERIC(24,8),
    total_pnl NUMERIC(18,2),
    total_pnl_percent NUMERIC(9,4),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fi_mf_summaries_account ON fi_mutual_fund_summaries(account_id);

-- MF HOLDINGS
CREATE TABLE IF NOT EXISTS fi_mutual_fund_holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES fi_accounts(id),
    fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
    amc VARCHAR(255),
    scheme_name VARCHAR(255),
    scheme_code VARCHAR(100),
    scheme_plan VARCHAR(50),  -- DIRECT / REGULAR
    scheme_option VARCHAR(50),  -- GROWTH / DIVIDEND
    isin VARCHAR(50),
    folio_no VARCHAR(255),
    units NUMERIC(24,8),
    nav NUMERIC(18,8),
    nav_date DATE,
    current_value NUMERIC(18,2),
    -- Additional fields from API
    cost_value NUMERIC(18,2),
    pnl NUMERIC(18,2),
    pnl_percent NUMERIC(9,4),
    scheme_category VARCHAR(100),
    scheme_type VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fi_mf_holdings_account ON fi_mutual_fund_holdings(account_id);
CREATE INDEX IF NOT EXISTS idx_fi_mf_holdings_isin ON fi_mutual_fund_holdings(isin);
CREATE INDEX IF NOT EXISTS idx_fi_mf_holdings_folio ON fi_mutual_fund_holdings(folio_no);

-- MF TXN DETAILS (1:1 with fi_transactions)
CREATE TABLE IF NOT EXISTS fi_mutual_fund_txn_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES fi_transactions(id) UNIQUE,
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

CREATE INDEX IF NOT EXISTS idx_fi_mf_txn_isin ON fi_mutual_fund_txn_details(isin);

-- EQUITY SUMMARY
CREATE TABLE IF NOT EXISTS fi_equity_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES fi_accounts(id),
    fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
    current_value NUMERIC(18,2),
    -- Additional fields from API
    total_investment NUMERIC(18,2),
    total_pnl NUMERIC(18,2),
    total_pnl_percent NUMERIC(9,4),
    total_holdings INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fi_equity_summaries_account ON fi_equity_summaries(account_id);

-- EQUITY HOLDINGS
CREATE TABLE IF NOT EXISTS fi_equity_holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES fi_accounts(id),
    fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
    issuer_name VARCHAR(255),
    isin VARCHAR(50),
    isin_desc TEXT,
    units NUMERIC(24,8),
    last_price NUMERIC(18,4),
    current_value NUMERIC(18,2),
    -- Additional fields from API
    symbol VARCHAR(50),
    exchange VARCHAR(50),
    avg_cost_price NUMERIC(18,4),
    cost_value NUMERIC(18,2),
    pnl NUMERIC(18,2),
    pnl_percent NUMERIC(9,4),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fi_equity_holdings_account ON fi_equity_holdings(account_id);
CREATE INDEX IF NOT EXISTS idx_fi_equity_holdings_isin ON fi_equity_holdings(isin);

-- EQUITY TXN DETAILS (1:1 with fi_transactions)
CREATE TABLE IF NOT EXISTS fi_equity_txn_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES fi_transactions(id) UNIQUE,
    order_id VARCHAR(100),
    exchange VARCHAR(50),
    isin VARCHAR(50),
    company_name VARCHAR(255),
    rate NUMERIC(18,4),
    units NUMERIC(24,8)
);

CREATE INDEX IF NOT EXISTS idx_fi_equity_txn_order ON fi_equity_txn_details(order_id);
CREATE INDEX IF NOT EXISTS idx_fi_equity_txn_isin ON fi_equity_txn_details(isin);

-- ETF HOLDINGS (similar to equities)
CREATE TABLE IF NOT EXISTS fi_etf_holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES fi_accounts(id),
    fetch_run_id UUID REFERENCES aa_data_fetch_runs(id),
    etf_name VARCHAR(255),
    isin VARCHAR(50),
    symbol VARCHAR(50),
    units NUMERIC(24,8),
    nav NUMERIC(18,8),
    nav_date DATE,
    current_value NUMERIC(18,2),
    cost_value NUMERIC(18,2),
    pnl NUMERIC(18,2),
    pnl_percent NUMERIC(9,4),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fi_etf_holdings_account ON fi_etf_holdings(account_id);
CREATE INDEX IF NOT EXISTS idx_fi_etf_holdings_isin ON fi_etf_holdings(isin);

-- =====================================================
-- BROKERS REGISTRY
-- =====================================================

CREATE TABLE IF NOT EXISTS brokers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broker_id VARCHAR(100),
    name VARCHAR(255),
    type VARCHAR(50),  -- EQUITY / MF / BOTH
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(broker_id)
);

CREATE INDEX IF NOT EXISTS idx_brokers_name ON brokers(name);

-- =====================================================
-- OPTIONAL: FAST DASHBOARD SNAPSHOTS
-- =====================================================

CREATE TABLE IF NOT EXISTS user_financial_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES app_users(id),
    consent_id UUID REFERENCES aa_consents(id),
    snapshot_type VARCHAR(50),  -- NETWORTH / CASHFLOW / BALANCES_SUMMARY / INSIGHTS
    snapshot JSONB,  -- Stores raw insights data
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_snapshots_user ON user_financial_snapshots(user_id, generated_at);
CREATE INDEX IF NOT EXISTS idx_user_snapshots_type ON user_financial_snapshots(snapshot_type, generated_at);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
            CREATE TRIGGER update_%I_updated_at
                BEFORE UPDATE ON %I
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SEED INITIAL DATA
-- =====================================================

-- Insert default TSP provider (Finfactor)
INSERT INTO tsp_providers (name, environment, base_url, is_active)
VALUES ('FINFACTOR', 'SANDBOX', 'https://apisetu.finvu.in', true)
ON CONFLICT (name, environment) DO NOTHING;

-- Insert default AA gateway (Finvu)
INSERT INTO aa_gateways (name, environment, gateway_base_url, is_active)
VALUES ('FINVU', 'SANDBOX', 'https://apisetu.finvu.in', true)
ON CONFLICT (name, environment) DO NOTHING;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE tsp_providers IS 'Technology Service Providers like Finfactor';
COMMENT ON TABLE aa_gateways IS 'Account Aggregator gateways like Finvu';
COMMENT ON TABLE app_users IS 'End users identified by phone/email';
COMMENT ON TABLE fips IS 'Financial Information Providers (banks, RTAs, brokers)';
COMMENT ON TABLE fi_accounts IS 'Linked financial accounts from AA';
COMMENT ON TABLE fi_transactions IS 'Financial transactions from accounts';
COMMENT ON TABLE user_financial_snapshots IS 'Cached insights/analytics for quick dashboard access';

