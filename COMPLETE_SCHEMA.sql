-- =====================================================================
-- COMPLETE DATABASE SCHEMA - ACCOUNT AGGREGATOR PLATFORM
-- =====================================================================
-- Total Tables: 51 (MFC consent requests removed)
-- Layer A: 21 | Layer B: 14 | Layer C: 16
-- =====================================================================
-- Version: 2.0.0
-- Date: 2025-01-XX
-- Description: Complete PostgreSQL schema for Account Aggregator integration
-- 
-- This schema is organized into 3 layers:
--   LAYER A: Flow & Control (TSP, AA Gateway, Users, Consents, Raw Payloads)
--   LAYER B: Canonical Financial Data (Accounts, Transactions, Holders)
--   LAYER C: Financial State & Holdings (Summaries, Holdings, Insights)
-- =====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- LAYER A: FLOW & CONTROL (22 TABLES)
-- =====================================================================

-- ---------------------------------------------------------------------
-- A1: INFRASTRUCTURE & PROVIDER MANAGEMENT
-- ---------------------------------------------------------------------

-- TSP Providers
CREATE TABLE IF NOT EXISTS tsp_providers (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(100) NOT NULL,
    environment         VARCHAR(20) NOT NULL,
    base_url            TEXT NOT NULL,
    api_version         VARCHAR(20),
    rate_limit_per_minute INTEGER DEFAULT 60,
    rate_limit_per_hour INTEGER DEFAULT 1000,
    timeout_seconds    INTEGER DEFAULT 30,
    retry_config        JSONB,
    is_active           BOOLEAN DEFAULT true,
    metadata            JSONB,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_tsp_name_env UNIQUE (name, environment)
);

CREATE INDEX IF NOT EXISTS idx_tsp_providers_active 
ON tsp_providers(is_active, environment);

-- AA Gateways
CREATE TABLE IF NOT EXISTS aa_gateways (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(100) NOT NULL,
    environment         VARCHAR(20) NOT NULL,
    gateway_base_url    TEXT NOT NULL,
    api_version         VARCHAR(20),
    supported_fi_types  TEXT[],
    rate_limit_per_minute INTEGER DEFAULT 60,
    timeout_seconds    INTEGER DEFAULT 30,
    is_active           BOOLEAN DEFAULT true,
    metadata            JSONB,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_aa_name_env UNIQUE (name, environment)
);

CREATE INDEX IF NOT EXISTS idx_aa_gateways_active 
ON aa_gateways(is_active, environment);

-- FIPs (Financial Information Providers)
CREATE TABLE IF NOT EXISTS fips (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fip_id              VARCHAR(120) UNIQUE NOT NULL,
    fip_name            VARCHAR(255) NOT NULL,
    code                VARCHAR(50),
    type                VARCHAR(50) NOT NULL,
    is_enabled          BOOLEAN DEFAULT true,
    fi_types            JSONB,
    entity_icon_uri     VARCHAR(500),
    entity_logo_uri     VARCHAR(500),
    entity_logo_with_name_uri VARCHAR(500),
    otp_length          INTEGER,
    support_email       VARCHAR(255),
    support_phone        VARCHAR(20),
    environment         VARCHAR(20),
    is_active           BOOLEAN DEFAULT true,
    metadata            JSONB,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fips_fip_id ON fips(fip_id);
CREATE INDEX IF NOT EXISTS idx_fips_type ON fips(type, is_active);
CREATE INDEX IF NOT EXISTS idx_fips_enabled ON fips(is_enabled);
CREATE INDEX IF NOT EXISTS idx_fips_code ON fips(code);

-- Brokers
CREATE TABLE IF NOT EXISTS brokers (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broker_id           VARCHAR(50) UNIQUE NOT NULL,
    broker_name         VARCHAR(100) NOT NULL,
    broker_code         VARCHAR(50),
    logo_url            VARCHAR(500),
    is_active           BOOLEAN DEFAULT true,
    metadata            JSONB,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brokers_broker_id ON brokers(broker_id);
CREATE INDEX IF NOT EXISTS idx_brokers_name ON brokers(broker_name);

-- Mutual Fund Schemes
CREATE TABLE IF NOT EXISTS mutual_fund_schemes (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                INTEGER UNIQUE,
    amc                 VARCHAR(100),
    scheme_name         VARCHAR(255) NOT NULL,
    scheme_structure    VARCHAR(50),
    scheme_type         VARCHAR(50),
    scheme_category     VARCHAR(100),
    scheme_nav_name     VARCHAR(255),
    launch_date         DATE,
    closure_date        DATE,
    isin                VARCHAR(20),
    logo_url            VARCHAR(500),
    is_active           BOOLEAN DEFAULT true,
    metadata            JSONB,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mf_schemes_amc ON mutual_fund_schemes(amc, scheme_name);
CREATE INDEX IF NOT EXISTS idx_mf_schemes_isin ON mutual_fund_schemes(isin);

-- ---------------------------------------------------------------------
-- A2: USER MANAGEMENT & SUBSCRIPTIONS
-- ---------------------------------------------------------------------

-- App Users (NO PII, NO SUBSCRIPTION DATA)
CREATE TABLE IF NOT EXISTS app_users (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unique_identifier   VARCHAR(50) UNIQUE NOT NULL,
    phone               VARCHAR(20),
    email               VARCHAR(255),
    email_verified      BOOLEAN DEFAULT false,
    phone_verified      BOOLEAN DEFAULT false,
    status              VARCHAR(20) DEFAULT 'ACTIVE',
    last_login_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_users_unique_id ON app_users(unique_identifier);
CREATE UNIQUE INDEX IF NOT EXISTS idx_app_users_phone ON app_users(phone) WHERE phone IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_app_users_status ON app_users(status);

-- User Subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES app_users(id),
    subscription_plan   VARCHAR(50) NOT NULL,
    subscription_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    billing_cycle       VARCHAR(20),
    subscription_start  TIMESTAMPTZ NOT NULL,
    subscription_end    TIMESTAMPTZ,
    trial_end_date      TIMESTAMPTZ,
    auto_renew          BOOLEAN DEFAULT true,
    payment_method      VARCHAR(50),
    amount              NUMERIC(10,2),
    currency            VARCHAR(3) DEFAULT 'INR',
    features_enabled    JSONB,
    usage_limits        JSONB,
    metadata            JSONB,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id, subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(subscription_status, subscription_end);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_expiry ON user_subscriptions(subscription_end);

-- Subscription Usage Logs
CREATE TABLE IF NOT EXISTS subscription_usage_logs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id     UUID NOT NULL REFERENCES user_subscriptions(id),
    user_id             UUID NOT NULL REFERENCES app_users(id),
    feature_name        VARCHAR(100) NOT NULL,
    usage_count         INTEGER DEFAULT 1,
    usage_date          DATE NOT NULL DEFAULT CURRENT_DATE,
    metadata            JSONB,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_usage_logs_date ON subscription_usage_logs(subscription_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_logs_feature ON subscription_usage_logs(subscription_id, feature_name, usage_date);

-- ---------------------------------------------------------------------
-- A3: APP AUTHENTICATION & TOKEN MANAGEMENT
-- ---------------------------------------------------------------------

-- App Integration Apps
CREATE TABLE IF NOT EXISTS app_integration_apps (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tsp_id              UUID NOT NULL REFERENCES tsp_providers(id),
    app_name            VARCHAR(100) NOT NULL,
    tsp_user_id         VARCHAR(255) NOT NULL,
    credential_ref        TEXT NOT NULL,
    is_active           BOOLEAN DEFAULT true,
    last_auth_success_at TIMESTAMPTZ,
    last_auth_failure_at TIMESTAMPTZ,
    consecutive_failures INTEGER DEFAULT 0,
    metadata            JSONB,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_app_tsp UNIQUE (tsp_id, app_name),
    CONSTRAINT unique_app_tsp_user UNIQUE (tsp_id, tsp_user_id)
);

CREATE INDEX IF NOT EXISTS idx_app_integration_active ON app_integration_apps(tsp_id, is_active);

-- TSP Auth Tokens
CREATE TABLE IF NOT EXISTS tsp_auth_tokens (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_id              UUID NOT NULL REFERENCES app_integration_apps(id),
    token_type          VARCHAR(30) NOT NULL DEFAULT 'BEARER',
    access_token        TEXT NOT NULL,
    refresh_token       TEXT,
    token_hash          VARCHAR(100) UNIQUE NOT NULL,
    issued_at           TIMESTAMPTZ NOT NULL,
    expires_at          TIMESTAMPTZ NOT NULL,
    expires_in          INTEGER,
    refresh_token_expires_at TIMESTAMPTZ,
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    last_used_at        TIMESTAMPTZ,
    use_count           INTEGER DEFAULT 0,
    metadata            JSONB,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tsp_auth_tokens_app ON tsp_auth_tokens(app_id, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_tsp_auth_tokens_status ON tsp_auth_tokens(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_tsp_auth_tokens_hash ON tsp_auth_tokens(token_hash);

-- TSP Auth Token Rotation History
CREATE TABLE IF NOT EXISTS tsp_auth_token_rotation_history (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_id              UUID NOT NULL REFERENCES app_integration_apps(id),
    old_token_id        UUID,
    new_token_id        UUID REFERENCES tsp_auth_tokens(id),
    rotation_reason     VARCHAR(100),
    rotation_type       VARCHAR(30),
    rotated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_token_rotation_app ON tsp_auth_token_rotation_history(app_id, rotated_at);

-- ---------------------------------------------------------------------
-- A4: API CALL TRACKING & RATE LIMITING
-- ---------------------------------------------------------------------

-- TSP API Calls
CREATE TABLE IF NOT EXISTS tsp_api_calls (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tsp_id              UUID NOT NULL REFERENCES tsp_providers(id),
    app_id              UUID REFERENCES app_integration_apps(id),
    token_id            UUID REFERENCES tsp_auth_tokens(id),
    user_id             UUID REFERENCES app_users(id),
    request_tag         VARCHAR(50) NOT NULL,
    http_method         VARCHAR(10) NOT NULL,
    endpoint            TEXT NOT NULL,
    request_id          VARCHAR(150) UNIQUE NOT NULL,
    status_code         INTEGER,
    request_payload      JSONB,
    response_payload     JSONB,
    response_size_bytes  INTEGER,
    error_code          VARCHAR(100),
    error_message       TEXT,
    retry_count         INTEGER DEFAULT 0,
    started_at          TIMESTAMPTZ NOT NULL,
    completed_at        TIMESTAMPTZ,
    duration_ms         INTEGER
);

CREATE INDEX IF NOT EXISTS idx_tsp_api_calls_tsp ON tsp_api_calls(tsp_id, started_at);
CREATE INDEX IF NOT EXISTS idx_tsp_api_calls_app ON tsp_api_calls(app_id, started_at);
CREATE INDEX IF NOT EXISTS idx_tsp_api_calls_user ON tsp_api_calls(user_id, started_at);
CREATE INDEX IF NOT EXISTS idx_tsp_api_calls_tag ON tsp_api_calls(request_tag, started_at);
CREATE INDEX IF NOT EXISTS idx_tsp_api_calls_status ON tsp_api_calls(status_code, started_at);

-- API Rate Limits
CREATE TABLE IF NOT EXISTS api_rate_limits (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID REFERENCES app_users(id),
    app_id              UUID REFERENCES app_integration_apps(id),
    tsp_id              UUID REFERENCES tsp_providers(id),
    limit_type          VARCHAR(30) NOT NULL,
    endpoint_pattern    VARCHAR(255),
    request_count       INTEGER DEFAULT 0,
    window_start        TIMESTAMPTZ NOT NULL,
    window_end          TIMESTAMPTZ NOT NULL,
    limit_threshold     INTEGER NOT NULL,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_user ON api_rate_limits(user_id, window_end);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_app ON api_rate_limits(app_id, window_end);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_tsp ON api_rate_limits(tsp_id, window_end);

-- ---------------------------------------------------------------------
-- A5: CONSENT MANAGEMENT FLOW
-- ---------------------------------------------------------------------

-- AA Consent Requests
CREATE TABLE IF NOT EXISTS aa_consent_requests (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES app_users(id),
    tsp_id              UUID NOT NULL REFERENCES tsp_providers(id),
    aa_gateway_id       UUID NOT NULL REFERENCES aa_gateways(id),
    unique_identifier   VARCHAR(50) NOT NULL,
    aa_cust_id          VARCHAR(120),
    template_name       VARCHAR(100) NOT NULL,
    user_session_id     VARCHAR(150),
    redirect_url        TEXT,
    encrypted_request   TEXT,
    consent_handle      VARCHAR(150),
    consent_url         TEXT,
    request_id          VARCHAR(150) UNIQUE NOT NULL,
    consent_purpose     TEXT,
    consent_description TEXT,
    request_consent_id  VARCHAR(150),
    date_range_from     TIMESTAMPTZ,
    date_range_to       TIMESTAMPTZ,
    aa_id               VARCHAR(50),
    fetch_type          VARCHAR(20),
    frequency_unit      VARCHAR(20),
    frequency_value     INTEGER,
    data_life_unit      VARCHAR(20),
    data_life_value     INTEGER,
    fi_types            TEXT[],
    status              VARCHAR(40) NOT NULL DEFAULT 'CREATED',
    error_code          VARCHAR(100),
    error_message       TEXT,
    expires_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aa_consent_requests_user ON aa_consent_requests(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_aa_consent_requests_status ON aa_consent_requests(status, created_at);
CREATE INDEX IF NOT EXISTS idx_aa_consent_requests_handle ON aa_consent_requests(consent_handle);

-- AA Redirect Events
CREATE TABLE IF NOT EXISTS aa_redirect_events (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consent_request_id  UUID NOT NULL REFERENCES aa_consent_requests(id),
    event_type          VARCHAR(30) NOT NULL,
    redirect_state      VARCHAR(200),
    callback_status     VARCHAR(30),
    callback_params     JSONB,
    user_agent          TEXT,
    ip_address          INET,
    occurred_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aa_redirect_events_consent ON aa_redirect_events(consent_request_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_aa_redirect_events_type ON aa_redirect_events(event_type, occurred_at);

-- AA Consents
CREATE TABLE IF NOT EXISTS aa_consents (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES app_users(id),
    tsp_id              UUID NOT NULL REFERENCES tsp_providers(id),
    aa_gateway_id       UUID NOT NULL REFERENCES aa_gateways(id),
    consent_request_id  UUID REFERENCES aa_consent_requests(id),
    consent_handle      VARCHAR(150) UNIQUE NOT NULL,
    consent_id          VARCHAR(150),
    template_name       VARCHAR(100),
    consent_mode        VARCHAR(20),
    consent_types       JSONB,
    purpose_code        VARCHAR(20),
    fi_types            TEXT[],
    data_life_unit      VARCHAR(20),
    data_life_value     INTEGER,
    frequency_unit      VARCHAR(20),
    frequency_value     INTEGER,
    data_filter         JSONB,
    consent_start       TIMESTAMPTZ,
    consent_expiry      TIMESTAMPTZ,
    fetch_count         INTEGER DEFAULT 0,
    last_fetch_at       TIMESTAMPTZ,
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    status_reason       TEXT,
    revocation_reason   TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    activated_at        TIMESTAMPTZ,
    revoked_at          TIMESTAMPTZ,
    expired_at          TIMESTAMPTZ,
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aa_consents_user ON aa_consents(user_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_aa_consents_status ON aa_consents(status, consent_expiry);
CREATE INDEX IF NOT EXISTS idx_aa_consents_active ON aa_consents(user_id, status);

-- AA Consent Events
CREATE TABLE IF NOT EXISTS aa_consent_events (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consent_id          UUID NOT NULL REFERENCES aa_consents(id),
    event_type          VARCHAR(30) NOT NULL,
    event_source        VARCHAR(50),
    triggered_by        VARCHAR(50),
    raw_payload         JSONB,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aa_consent_events_consent ON aa_consent_events(consent_id, created_at);
CREATE INDEX IF NOT EXISTS idx_aa_consent_events_type ON aa_consent_events(event_type, created_at);

-- ---------------------------------------------------------------------
-- A6: DATA FETCH OPERATIONS
-- ---------------------------------------------------------------------

-- AA Data Fetch Runs (CRITICAL - Links all data)
CREATE TABLE IF NOT EXISTS aa_data_fetch_runs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES app_users(id),
    tsp_id              UUID NOT NULL REFERENCES tsp_providers(id),
    consent_id          UUID REFERENCES aa_consents(id),
    consent_handle      VARCHAR(150),
    fetch_type          VARCHAR(60) NOT NULL,
    endpoint            TEXT NOT NULL,
    request_id          VARCHAR(150) UNIQUE NOT NULL,
    session_id          VARCHAR(150),
    total_fi_data       INTEGER DEFAULT 0,
    total_fi_data_to_fetch INTEGER,
    fi_data_fetched     INTEGER DEFAULT 0,
    last_fetch_date     TIMESTAMPTZ,
    date_range_from     TIMESTAMPTZ,
    date_range_to       TIMESTAMPTZ,
    status              VARCHAR(30) NOT NULL DEFAULT 'INITIATED',
    error_code          VARCHAR(100),
    error_message       TEXT,
    retry_count         INTEGER DEFAULT 0,
    requested_at        TIMESTAMPTZ NOT NULL,
    fetched_at          TIMESTAMPTZ,
    parsed_at           TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    records_count       INTEGER DEFAULT 0,
    metadata            JSONB,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aa_data_fetch_runs_user ON aa_data_fetch_runs(user_id, requested_at);
CREATE INDEX IF NOT EXISTS idx_aa_data_fetch_runs_consent ON aa_data_fetch_runs(consent_id, requested_at);
CREATE INDEX IF NOT EXISTS idx_aa_data_fetch_runs_status ON aa_data_fetch_runs(status, requested_at);
CREATE INDEX IF NOT EXISTS idx_aa_data_fetch_runs_type ON aa_data_fetch_runs(fetch_type, requested_at);

-- AA Fetch Payloads (CRITICAL - Stores raw JSON)
CREATE TABLE IF NOT EXISTS aa_fetch_payloads (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fetch_run_id        UUID NOT NULL REFERENCES aa_data_fetch_runs(id),
    fip_id              VARCHAR(100),
    account_ref_number  VARCHAR(255),
    fi_type             VARCHAR(50),
    raw_payload         JSONB NOT NULL,
    payload_role        VARCHAR(20),
    content_format      VARCHAR(20),
    storage_ref         TEXT,
    compression_type    VARCHAR(20),
    file_size_bytes     BIGINT,
    hash_sha256         VARCHAR(80),
    encryption_key_ref  VARCHAR(100),
    decrypted_at        TIMESTAMPTZ,
    processed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aa_fetch_payloads_run ON aa_fetch_payloads(fetch_run_id);
CREATE INDEX IF NOT EXISTS idx_aa_fetch_payloads_run_role ON aa_fetch_payloads(fetch_run_id, payload_role);
CREATE INDEX IF NOT EXISTS idx_aa_fetch_payloads_hash ON aa_fetch_payloads(hash_sha256);
CREATE INDEX IF NOT EXISTS idx_aa_fetch_payloads_fip ON aa_fetch_payloads(fip_id, fi_type);

-- =====================================================================
-- LAYER B: CANONICAL FINANCIAL DATA (14 TABLES)
-- =====================================================================

-- FI Accounts
CREATE TABLE IF NOT EXISTS fi_accounts (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES app_users(id),
    consent_id          UUID REFERENCES aa_consents(id),
    fetch_run_id        UUID REFERENCES aa_data_fetch_runs(id),
    fip_id              UUID REFERENCES fips(id),
    fi_data_id          VARCHAR(100) UNIQUE,
    fi_type             VARCHAR(50) NOT NULL,
    account_name        VARCHAR(100),
    masked_acc_no       VARCHAR(255),
    account_ref_number  VARCHAR(255),
    linked_acc_ref      VARCHAR(255),
    fip_account_type    VARCHAR(50),
    fip_account_sub_type VARCHAR(50),
    provider_name       VARCHAR(255),
    fip_id_str          VARCHAR(100),
    fip_name            VARCHAR(255),
    data_fetched        BOOLEAN DEFAULT false,
    last_fetch_datetime TIMESTAMPTZ,
    latest_consent_purpose_text TEXT,
    latest_consent_expiry_time TIMESTAMPTZ,
    consent_purpose_version VARCHAR(20),
    fi_data             JSONB,
    version             VARCHAR(50),
    account_ref_hash    VARCHAR(100) UNIQUE,
    last_seen_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fi_accounts_user ON fi_accounts(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_fi_accounts_consent ON fi_accounts(consent_id);
CREATE INDEX IF NOT EXISTS idx_fi_accounts_fetch_run ON fi_accounts(fetch_run_id);
CREATE INDEX IF NOT EXISTS idx_fi_accounts_fip_type ON fi_accounts(fip_id, fi_type);
CREATE INDEX IF NOT EXISTS idx_fi_accounts_type ON fi_accounts(fi_type);
CREATE INDEX IF NOT EXISTS idx_fi_accounts_fi_data_id ON fi_accounts(fi_data_id);
CREATE INDEX IF NOT EXISTS idx_fi_accounts_account_ref ON fi_accounts(account_ref_number);
CREATE INDEX IF NOT EXISTS idx_fi_accounts_ref_hash ON fi_accounts(account_ref_hash);

-- FI Account Holders PII
CREATE TABLE IF NOT EXISTS fi_account_holders_pii (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id          UUID NOT NULL REFERENCES fi_accounts(id),
    holders_type        VARCHAR(50),
    name                VARCHAR(255),
    dob                 DATE,
    mobile              VARCHAR(50),
    email               VARCHAR(255),
    pan                 VARCHAR(20),
    address             TEXT,
    ckycregno           VARCHAR(50),
    kyc_compliance      VARCHAR(50),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fi_account_holders_account ON fi_account_holders_pii(account_id);
CREATE INDEX IF NOT EXISTS idx_fi_account_holders_pan ON fi_account_holders_pii(pan);
CREATE INDEX IF NOT EXISTS idx_fi_account_holders_mobile ON fi_account_holders_pii(mobile);

-- FI Transactions
CREATE TABLE IF NOT EXISTS fi_transactions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id          UUID NOT NULL REFERENCES fi_accounts(id),
    fetch_run_id        UUID REFERENCES aa_data_fetch_runs(id),
    txn_id              VARCHAR(255),
    txn_type            VARCHAR(50),
    mode                VARCHAR(50),
    amount              NUMERIC(18,2),
    balance             NUMERIC(18,2),
    current_balance     NUMERIC(18,2),
    txn_timestamp       TIMESTAMPTZ,
    transaction_timestamp TIMESTAMPTZ,
    value_date          DATE,
    narration           TEXT,
    reference           VARCHAR(255),
    category            VARCHAR(50),
    sub_category        VARCHAR(50),
    merchant_name      VARCHAR(255),
    merchant_category   VARCHAR(100),
    txn_mode            VARCHAR(50),
    dedupe_hash         VARCHAR(100),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fi_transactions_account_time ON fi_transactions(account_id, transaction_timestamp);
CREATE INDEX IF NOT EXISTS idx_fi_transactions_account_txn_time ON fi_transactions(account_id, txn_timestamp);
CREATE INDEX IF NOT EXISTS idx_fi_transactions_fetch_run ON fi_transactions(fetch_run_id);
CREATE INDEX IF NOT EXISTS idx_fi_transactions_txn_id ON fi_transactions(txn_id);
CREATE UNIQUE INDEX IF NOT EXISTS unique_fi_transaction ON fi_transactions(account_id, dedupe_hash) WHERE dedupe_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fi_transactions_type ON fi_transactions(txn_type);

-- FI MF Transactions
CREATE TABLE IF NOT EXISTS fi_mf_transactions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id          UUID NOT NULL REFERENCES fi_accounts(id),
    fetch_run_id        UUID REFERENCES aa_data_fetch_runs(id),
    txn_id              VARCHAR(255),
    isin                VARCHAR(20),
    isin_description    TEXT,
    amc                 VARCHAR(100),
    amfi_code           VARCHAR(20),
    registrar           VARCHAR(50),
    folio_no            VARCHAR(50),
    nav                 NUMERIC(18,8),
    nav_date            DATE,
    units               NUMERIC(24,8),
    amount              NUMERIC(18,2),
    type                VARCHAR(20),
    mode                VARCHAR(20),
    narration           TEXT,
    lock_in_days        VARCHAR(10),
    lock_in_flag        VARCHAR(5),
    stt_tax             NUMERIC(10,2),
    tax                 NUMERIC(10,2),
    total_tax           NUMERIC(10,2),
    stamp_duty          NUMERIC(10,2),
    txn_charge          NUMERIC(10,2),
    data_source         VARCHAR(20),
    txn_datetime        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fi_mf_transactions_account ON fi_mf_transactions(account_id, txn_datetime);
CREATE INDEX IF NOT EXISTS idx_fi_mf_transactions_isin ON fi_mf_transactions(isin, txn_datetime);
CREATE INDEX IF NOT EXISTS idx_fi_mf_transactions_folio ON fi_mf_transactions(folio_no);

-- FI Equity Transactions
CREATE TABLE IF NOT EXISTS fi_equity_transactions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id          UUID NOT NULL REFERENCES fi_accounts(id),
    broker_id           UUID REFERENCES brokers(id),
    fetch_run_id        UUID REFERENCES aa_data_fetch_runs(id),
    txn_id              VARCHAR(255),
    order_id            VARCHAR(100),
    isin                VARCHAR(20),
    isin_description    TEXT,
    company_name        VARCHAR(255),
    type                VARCHAR(20),
    units               NUMERIC(24,8),
    rate                NUMERIC(18,4),
    equity_category     VARCHAR(50),
    exchange            VARCHAR(20),
    narration           TEXT,
    txn_datetime        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fi_equity_transactions_account ON fi_equity_transactions(account_id, txn_datetime);
CREATE INDEX IF NOT EXISTS idx_fi_equity_transactions_isin ON fi_equity_transactions(isin, txn_datetime);
CREATE INDEX IF NOT EXISTS idx_fi_equity_transactions_order ON fi_equity_transactions(order_id);

-- FI ETF Transactions
CREATE TABLE IF NOT EXISTS fi_etf_transactions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id          UUID NOT NULL REFERENCES fi_accounts(id),
    broker_id           UUID REFERENCES brokers(id),
    fetch_run_id        UUID REFERENCES aa_data_fetch_runs(id),
    txn_id              VARCHAR(255),
    isin                VARCHAR(20),
    isin_description    TEXT,
    type                VARCHAR(20),
    units               NUMERIC(24,8),
    nav                 NUMERIC(18,8),
    narration           TEXT,
    txn_datetime        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fi_etf_transactions_account ON fi_etf_transactions(account_id, txn_datetime);
CREATE INDEX IF NOT EXISTS idx_fi_etf_transactions_isin ON fi_etf_transactions(isin, txn_datetime);

-- =====================================================================
-- LAYER C: FINANCIAL STATE & HOLDINGS (16 TABLES)
-- =====================================================================

-- C1: DEPOSIT SUMMARIES

-- FI Deposit Summaries
CREATE TABLE IF NOT EXISTS fi_deposit_summaries (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id          UUID NOT NULL REFERENCES fi_accounts(id),
    fetch_run_id        UUID REFERENCES aa_data_fetch_runs(id),
    current_balance     NUMERIC(18,2),
    available_balance   NUMERIC(18,2),
    currency            VARCHAR(10),
    balance_datetime    TIMESTAMPTZ,
    last_fetch_time     TIMESTAMPTZ,
    account_type        VARCHAR(50),
    account_sub_type    VARCHAR(50),
    branch              VARCHAR(255),
    ifsc                VARCHAR(20),
    ifsc_code           VARCHAR(20),
    micr_code           VARCHAR(20),
    opening_date        DATE,
    status              VARCHAR(50),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fi_deposit_summaries_account ON fi_deposit_summaries(account_id);
CREATE INDEX IF NOT EXISTS idx_fi_deposit_summaries_datetime ON fi_deposit_summaries(balance_datetime);

-- FI Term Deposit Summaries
CREATE TABLE IF NOT EXISTS fi_term_deposit_summaries (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id          UUID NOT NULL REFERENCES fi_accounts(id),
    fetch_run_id        UUID REFERENCES aa_data_fetch_runs(id),
    principal_amount    NUMERIC(18,2),
    current_balance     NUMERIC(18,2),
    maturity_amount     NUMERIC(18,2),
    maturity_date       DATE,
    interest_rate       NUMERIC(9,4),
    interest_payout     VARCHAR(50),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fi_term_deposit_summaries_account ON fi_term_deposit_summaries(account_id);
CREATE INDEX IF NOT EXISTS idx_fi_term_deposit_summaries_maturity ON fi_term_deposit_summaries(maturity_date);

-- FI Recurring Deposit Summaries
CREATE TABLE IF NOT EXISTS fi_recurring_deposit_summaries (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id          UUID NOT NULL REFERENCES fi_accounts(id),
    fetch_run_id        UUID REFERENCES aa_data_fetch_runs(id),
    current_balance     NUMERIC(18,2),
    maturity_amount     NUMERIC(18,2),
    maturity_date       DATE,
    interest_rate       NUMERIC(9,4),
    recurring_amount    NUMERIC(18,2),
    tenure_months       INTEGER,
    recurring_day       INTEGER,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fi_recurring_deposit_summaries_account ON fi_recurring_deposit_summaries(account_id);
CREATE INDEX IF NOT EXISTS idx_fi_recurring_deposit_summaries_maturity ON fi_recurring_deposit_summaries(maturity_date);

-- C2: MUTUAL FUND DATA

-- FI Mutual Fund Summaries
CREATE TABLE IF NOT EXISTS fi_mutual_fund_summaries (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id          UUID NOT NULL REFERENCES fi_accounts(id),
    fetch_run_id        UUID REFERENCES aa_data_fetch_runs(id),
    cost_value          NUMERIC(18,2),
    current_value       NUMERIC(18,2),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fi_mutual_fund_summaries_account ON fi_mutual_fund_summaries(account_id);

-- FI Mutual Fund Holdings
CREATE TABLE IF NOT EXISTS fi_mutual_fund_holdings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id          UUID NOT NULL REFERENCES fi_accounts(id),
    fetch_run_id        UUID REFERENCES aa_data_fetch_runs(id),
    amc                 VARCHAR(255),
    scheme_name         VARCHAR(255),
    scheme_code         VARCHAR(100),
    scheme_plan         VARCHAR(50),
    scheme_option       VARCHAR(50),
    registrar           VARCHAR(100),
    scheme_types        VARCHAR(50),
    scheme_category     VARCHAR(100),
    isin                VARCHAR(50),
    isin_description    TEXT,
    ucc                 VARCHAR(50),
    amfi_code           VARCHAR(20),
    folio_no            VARCHAR(255),
    closing_units       NUMERIC(24,8),
    lien_units          NUMERIC(24,8),
    locking_units       NUMERIC(24,8),
    units               NUMERIC(24,8),
    nav                 NUMERIC(18,8),
    avg_nav             NUMERIC(18,8),
    nav_date            DATE,
    current_value       NUMERIC(18,2),
    cost_value          NUMERIC(18,2),
    last_fetch_time     TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fi_mutual_fund_holdings_account ON fi_mutual_fund_holdings(account_id);
CREATE INDEX IF NOT EXISTS idx_fi_mutual_fund_holdings_isin ON fi_mutual_fund_holdings(isin);
CREATE INDEX IF NOT EXISTS idx_fi_mutual_fund_holdings_folio ON fi_mutual_fund_holdings(folio_no);

-- FI Mutual Fund Transaction Details
CREATE TABLE IF NOT EXISTS fi_mutual_fund_txn_details (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id      UUID UNIQUE NOT NULL REFERENCES fi_transactions(id),
    isin                VARCHAR(50),
    scheme_name         VARCHAR(255),
    amc                 VARCHAR(255),
    folio_no            VARCHAR(255),
    nav                 NUMERIC(18,8),
    nav_date            DATE,
    units               NUMERIC(24,8),
    lockin_flag         BOOLEAN,
    lockin_days         INTEGER
);

CREATE INDEX IF NOT EXISTS idx_fi_mutual_fund_txn_details_isin ON fi_mutual_fund_txn_details(isin);
CREATE INDEX IF NOT EXISTS idx_fi_mutual_fund_txn_details_folio ON fi_mutual_fund_txn_details(folio_no);

-- FI MF Holding Previous Details
CREATE TABLE IF NOT EXISTS fi_mf_holding_prev_details (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    holding_id          UUID NOT NULL REFERENCES fi_mutual_fund_holdings(id),
    percentage_change   NUMERIC(10,4),
    price_change        NUMERIC(18,4),
    last_fetch_time     TIMESTAMPTZ,
    holding_isin        VARCHAR(20),
    total_units         NUMERIC(24,8),
    current_value       NUMERIC(18,2),
    snapshot_date       DATE,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fi_mf_holding_prev_holding ON fi_mf_holding_prev_details(holding_id, snapshot_date);

-- C3: EQUITY DATA

-- FI Equity Summaries
CREATE TABLE IF NOT EXISTS fi_equity_summaries (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id          UUID NOT NULL REFERENCES fi_accounts(id),
    fetch_run_id        UUID REFERENCES aa_data_fetch_runs(id),
    current_value       NUMERIC(18,2),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fi_equity_summaries_account ON fi_equity_summaries(account_id);

-- FI Equity Holdings
CREATE TABLE IF NOT EXISTS fi_equity_holdings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id          UUID NOT NULL REFERENCES fi_accounts(id),
    broker_id           UUID REFERENCES brokers(id),
    fetch_run_id        UUID REFERENCES aa_data_fetch_runs(id),
    demat_id            VARCHAR(100),
    broker_name         VARCHAR(255),
    issuer_name         VARCHAR(255),
    isin                VARCHAR(50),
    isin_desc           TEXT,
    isin_description    TEXT,
    units               NUMERIC(24,8),
    last_price          NUMERIC(18,4),
    last_traded_price   NUMERIC(18,4),
    avg_traded_price    NUMERIC(18,4),
    current_value       NUMERIC(18,2),
    portfolio_weightage_pct NUMERIC(8,4),
    last_fetch_time     TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fi_equity_holdings_account ON fi_equity_holdings(account_id);
CREATE INDEX IF NOT EXISTS idx_fi_equity_holdings_isin ON fi_equity_holdings(isin);
CREATE INDEX IF NOT EXISTS idx_fi_equity_holdings_demat ON fi_equity_holdings(demat_id);

-- FI Equity Transaction Details
CREATE TABLE IF NOT EXISTS fi_equity_txn_details (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id      UUID UNIQUE NOT NULL REFERENCES fi_transactions(id),
    order_id            VARCHAR(100),
    exchange            VARCHAR(50),
    isin                VARCHAR(50),
    company_name        VARCHAR(255),
    rate                NUMERIC(18,4),
    units               NUMERIC(24,8)
);

CREATE INDEX IF NOT EXISTS idx_fi_equity_txn_details_order ON fi_equity_txn_details(order_id);
CREATE INDEX IF NOT EXISTS idx_fi_equity_txn_details_isin ON fi_equity_txn_details(isin);

-- C4: ETF DATA

-- FI ETF Holdings
CREATE TABLE IF NOT EXISTS fi_etf_holdings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id          UUID NOT NULL REFERENCES fi_accounts(id),
    broker_id           UUID REFERENCES brokers(id),
    fetch_run_id        UUID REFERENCES aa_data_fetch_runs(id),
    demat_id            VARCHAR(100),
    broker_name         VARCHAR(255),
    isin                VARCHAR(50),
    isin_description    TEXT,
    units               NUMERIC(24,8),
    nav                 NUMERIC(18,8),
    current_value       NUMERIC(18,2),
    last_fetch_time     TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fi_etf_holdings_account ON fi_etf_holdings(account_id);
CREATE INDEX IF NOT EXISTS idx_fi_etf_holdings_isin ON fi_etf_holdings(isin);

-- C5: NPS DATA

-- FI NPS Summaries
CREATE TABLE IF NOT EXISTS fi_nps_summaries (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id          UUID UNIQUE NOT NULL REFERENCES fi_accounts(id),
    fetch_run_id        UUID REFERENCES aa_data_fetch_runs(id),
    pran                VARCHAR(20),
    tier_type           VARCHAR(10),
    scheme_name         VARCHAR(255),
    scheme_nav          NUMERIC(18,4),
    nav_date            DATE,
    units               NUMERIC(18,6),
    current_value       NUMERIC(18,2),
    employee_contribution NUMERIC(18,2),
    employer_contribution NUMERIC(18,2),
    voluntary_contribution NUMERIC(18,2),
    total_contribution  NUMERIC(18,2),
    as_of_date          TIMESTAMPTZ,
    last_fetch_time     TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fi_nps_summaries_account ON fi_nps_summaries(account_id);
CREATE INDEX IF NOT EXISTS idx_fi_nps_summaries_pran ON fi_nps_summaries(pran);

-- FI NPS Holdings
CREATE TABLE IF NOT EXISTS fi_nps_holdings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES app_users(id),
    summary_id          UUID REFERENCES fi_nps_summaries(id),
    pran                VARCHAR(20),
    scheme_name         VARCHAR(255),
    scheme_type         VARCHAR(50),
    pfm_name            VARCHAR(255),
    units               NUMERIC(18,6),
    nav                 NUMERIC(18,4),
    current_value       NUMERIC(18,2),
    total_contribution   NUMERIC(18,2),
    tier1_value         NUMERIC(18,2),
    tier2_value         NUMERIC(18,2),
    fip_name            VARCHAR(255),
    last_fetch_time     TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fi_nps_holdings_user ON fi_nps_holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_fi_nps_holdings_summary ON fi_nps_holdings(summary_id);
CREATE INDEX IF NOT EXISTS idx_fi_nps_holdings_pran ON fi_nps_holdings(pran);

-- C6: INSIGHTS & ANALYTICS

-- FI MF Insights
CREATE TABLE IF NOT EXISTS fi_mf_insights (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES app_users(id),
    pan                 VARCHAR(10),
    mobile              VARCHAR(20),
    total_holdings      INTEGER,
    current_value       NUMERIC(18,2),
    invested_value      NUMERIC(18,2),
    absolute_return     NUMERIC(18,2),
    absolute_return_pct NUMERIC(10,4),
    xirr                NUMERIC(10,4),
    daily_returns       NUMERIC(18,2),
    daily_returns_pct   NUMERIC(10,4),
    category_distribution JSONB,
    subcategory_distribution JSONB,
    market_cap_distribution JSONB,
    amc_distribution    JSONB,
    sector_distribution JSONB,
    snapshot_date       DATE,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fi_mf_insights_user ON fi_mf_insights(user_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_fi_mf_insights_pan ON fi_mf_insights(pan, snapshot_date);

-- FI Equity Insights
CREATE TABLE IF NOT EXISTS fi_equity_insights (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES app_users(id),
    current_value       NUMERIC(18,2),
    total_holdings       INTEGER,
    total_demats         INTEGER,
    daily_returns       NUMERIC(18,2),
    daily_returns_pct   NUMERIC(10,4),
    demat_wise_distribution JSONB,
    sector_distribution JSONB,
    market_cap_distribution JSONB,
    snapshot_date       DATE,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fi_equity_insights_user ON fi_equity_insights(user_id, snapshot_date);

-- FI ETF Insights
CREATE TABLE IF NOT EXISTS fi_etf_insights (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES app_users(id),
    current_value       NUMERIC(18,2),
    total_holdings       INTEGER,
    total_demats         INTEGER,
    daily_returns       NUMERIC(18,2),
    daily_returns_pct   NUMERIC(10,4),
    demat_wise_distribution JSONB,
    snapshot_date       DATE,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fi_etf_insights_user ON fi_etf_insights(user_id, snapshot_date);

-- FI Deposit Insights
CREATE TABLE IF NOT EXISTS fi_deposit_insights (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES app_users(id),
    account_ids         UUID[],
    period_from        DATE,
    period_to            DATE,
    frequency           VARCHAR(20),
    balance_data        JSONB,
    outgoing_data       JSONB,
    incoming_data       JSONB,
    snapshot_date       DATE,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fi_deposit_insights_user ON fi_deposit_insights(user_id, snapshot_date);

-- C7: DASHBOARD SNAPSHOTS

-- User Financial Snapshots
CREATE TABLE IF NOT EXISTS user_financial_snapshots (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES app_users(id),
    consent_id          UUID REFERENCES aa_consents(id),
    snapshot_type       VARCHAR(50),
    snapshot            JSONB,
    total_net_worth     NUMERIC(18,2),
    deposits_value      NUMERIC(18,2),
    term_deposits_value NUMERIC(18,2),
    recurring_deposits_value NUMERIC(18,2),
    mutual_funds_value  NUMERIC(18,2),
    equities_value      NUMERIC(18,2),
    etf_value           NUMERIC(18,2),
    nps_value           NUMERIC(18,2),
    total_accounts      INTEGER,
    last_fetch_date     TIMESTAMPTZ,
    generated_at        TIMESTAMPTZ,
    snapshot_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_financial_snapshots_user ON user_financial_snapshots(user_id, generated_at);
CREATE INDEX IF NOT EXISTS idx_user_financial_snapshots_type ON user_financial_snapshots(snapshot_type, generated_at);

-- =====================================================================
-- SCHEMA SUMMARY
-- =====================================================================
-- 
-- LAYER A - Flow & Control (22 tables):
--   - tsp_providers, aa_gateways, fips, brokers, mutual_fund_schemes
--   - app_users, user_subscriptions, subscription_usage_logs
--   - app_integration_apps, tsp_auth_tokens, tsp_auth_token_rotation_history
--   - tsp_api_calls, api_rate_limits
--   - aa_consent_requests, aa_redirect_events, aa_consents, aa_consent_events
--   - aa_data_fetch_runs, aa_fetch_payloads
--
-- LAYER B - Canonical Financial Data (14 tables):
--   - fi_accounts, fi_account_holders_pii
--   - fi_transactions, fi_mf_transactions, fi_equity_transactions, fi_etf_transactions
--   - fips, brokers (also in Layer A)
--
-- LAYER C - Financial State & Holdings (16 tables):
--   - fi_deposit_summaries, fi_term_deposit_summaries, fi_recurring_deposit_summaries
--   - fi_mutual_fund_summaries, fi_mutual_fund_holdings, fi_mutual_fund_txn_details, fi_mf_holding_prev_details
--   - fi_equity_summaries, fi_equity_holdings, fi_equity_txn_details
--   - fi_etf_holdings
--   - fi_nps_summaries, fi_nps_holdings
--   - fi_mf_insights, fi_equity_insights, fi_etf_insights, fi_deposit_insights
--   - user_financial_snapshots
--
-- TOTAL: 52 tables
-- =====================================================================

