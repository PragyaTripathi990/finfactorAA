-- =====================================================================
-- FINFACTOR ACCOUNT AGGREGATOR - COMPREHENSIVE DATABASE SCHEMA
-- =====================================================================
-- Version: 1.0.0
-- Date: 2024-12-18
-- Description: Complete PostgreSQL schema for WealthScape PFM API
-- 
-- This schema is organized into 3 layers:
--   LAYER A: Flow & Control (TSP, AA Gateway, Users, Consents)
--   LAYER B: Canonical Financial Data (Accounts, Transactions, Holders)
--   LAYER C: Financial State & Holdings (Deposits, MF, Equity, ETF, NPS)
-- =====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- LAYER A: FLOW & CONTROL
-- =====================================================================

-- ---------------------------------------------------------------------
-- TSP Providers (e.g., FINFACTOR)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tsp_providers (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(100) NOT NULL,          -- e.g., FINFACTOR
    environment         VARCHAR(20) NOT NULL,           -- SANDBOX / PROD
    base_url            TEXT NOT NULL,
    is_active           BOOLEAN DEFAULT true,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT uq_tsp_name_env UNIQUE (name, environment)
);

-- ---------------------------------------------------------------------
-- AA Gateways (e.g., FINVU)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS aa_gateways (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(100) NOT NULL,          -- e.g., FINVU
    environment         VARCHAR(20) NOT NULL,           -- SANDBOX / PROD
    gateway_base_url    TEXT NOT NULL,
    is_active           BOOLEAN DEFAULT true,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT uq_aa_name_env UNIQUE (name, environment)
);

-- ---------------------------------------------------------------------
-- App Users (Core user table)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_users (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unique_identifier       VARCHAR(50) UNIQUE NOT NULL,    -- Mobile number (API identifier)
    phone                   VARCHAR(20) UNIQUE,
    email                   VARCHAR(255) UNIQUE,
    
    -- Subscription fields from API
    subscription_status         VARCHAR(50),                -- ACTIVE, INACTIVE, etc.
    subscription_start_date     TIMESTAMPTZ,
    subscription_end_date       TIMESTAMPTZ,
    
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_app_users_unique_id ON app_users(unique_identifier);

-- ---------------------------------------------------------------------
-- App Integration Apps (Your app's credentials to TSP)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_integration_apps (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tsp_id              UUID NOT NULL REFERENCES tsp_providers(id),
    aa_gateway_id       UUID REFERENCES aa_gateways(id),
    tsp_user_id         VARCHAR(100) NOT NULL,          -- Your app's user ID at TSP
    tsp_secret          TEXT,                           -- Encrypted secret
    app_name            VARCHAR(100),
    is_active           BOOLEAN DEFAULT true,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT uq_tsp_user UNIQUE (tsp_id, tsp_user_id)
);

-- ---------------------------------------------------------------------
-- TSP Auth Tokens
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tsp_auth_tokens (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_app_id  UUID NOT NULL REFERENCES app_integration_apps(id),
    access_token        TEXT NOT NULL,
    refresh_token       TEXT,
    token_type          VARCHAR(50) DEFAULT 'Bearer',
    expires_at          TIMESTAMPTZ NOT NULL,
    issued_at           TIMESTAMPTZ DEFAULT NOW(),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tsp_auth_tokens_integration ON tsp_auth_tokens(integration_app_id);
CREATE INDEX idx_tsp_auth_tokens_expires ON tsp_auth_tokens(expires_at);

-- ---------------------------------------------------------------------
-- TSP API Calls (Audit log + raw responses)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tsp_api_calls (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id            UUID REFERENCES tsp_auth_tokens(id),
    user_id             UUID REFERENCES app_users(id),
    endpoint            TEXT NOT NULL,
    method              VARCHAR(10) NOT NULL,           -- GET, POST, etc.
    request_payload     JSONB,
    response_payload    JSONB,                          -- Raw API response
    http_status         INTEGER,
    error_message       TEXT,
    latency_ms          INTEGER,
    called_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tsp_api_calls_user ON tsp_api_calls(user_id);
CREATE INDEX idx_tsp_api_calls_endpoint ON tsp_api_calls(endpoint);
CREATE INDEX idx_tsp_api_calls_called_at ON tsp_api_calls(called_at);

-- ---------------------------------------------------------------------
-- AA Consent Requests
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS aa_consent_requests (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL REFERENCES app_users(id),
    aa_gateway_id           UUID NOT NULL REFERENCES aa_gateways(id),
    integration_app_id      UUID NOT NULL REFERENCES app_integration_apps(id),
    
    -- Request identifiers
    consent_handle          VARCHAR(100) UNIQUE,
    
    -- Request details from API
    template_name           VARCHAR(100),               -- e.g., BANK_STATEMENT_PERIODIC
    aa_cust_id              VARCHAR(100),               -- e.g., 8956545791@finvu
    user_session_id         VARCHAR(255),
    redirect_url            TEXT,
    
    -- Encrypted fields from API response
    encrypted_request       TEXT,
    encrypted_fiu_id        TEXT,
    
    -- Optional customer identifiers
    pan                     VARCHAR(20),
    dob                     DATE,
    
    -- FIP filter
    fip_filter              JSONB,                      -- Array of FIP IDs to filter
    
    -- Status
    status                  VARCHAR(50) DEFAULT 'PENDING',  -- PENDING, APPROVED, REJECTED, EXPIRED
    
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_aa_consent_requests_user ON aa_consent_requests(user_id);
CREATE INDEX idx_aa_consent_requests_handle ON aa_consent_requests(consent_handle);

-- ---------------------------------------------------------------------
-- AA Redirect Events (Tracking user journey in consent flow)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS aa_redirect_events (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consent_request_id  UUID NOT NULL REFERENCES aa_consent_requests(id),
    event_type          VARCHAR(50) NOT NULL,           -- REDIRECT_INITIATED, CALLBACK_RECEIVED, etc.
    event_data          JSONB,
    event_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_aa_redirect_events_request ON aa_redirect_events(consent_request_id);

-- ---------------------------------------------------------------------
-- AA Consents (Active consents)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS aa_consents (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consent_request_id      UUID UNIQUE NOT NULL REFERENCES aa_consent_requests(id),
    consent_id              VARCHAR(100) UNIQUE,        -- Consent ID from AA
    
    -- Consent lifecycle
    consent_start           TIMESTAMPTZ NOT NULL,
    consent_expiry          TIMESTAMPTZ NOT NULL,
    consent_mode            VARCHAR(50),                -- VIEW, STORE, QUERY, STREAM
    fetch_type              VARCHAR(50),                -- ONETIME, PERIODIC
    
    -- Consent types and FI types
    consent_types           JSONB,                      -- Array: ["TRANSACTIONS", "PROFILE", "SUMMARY"]
    fi_types                JSONB,                      -- Array: ["DEPOSIT", "MUTUAL_FUNDS", etc.]
    
    -- Data consumer
    data_consumer_id        VARCHAR(100),
    data_consumer_type      VARCHAR(50),
    
    -- Purpose
    purpose_code            VARCHAR(50),
    purpose_ref_uri         TEXT,
    purpose_text            TEXT,
    purpose_category        VARCHAR(100),
    
    -- FI Data Range
    fi_data_range_from      TIMESTAMPTZ,
    fi_data_range_to        TIMESTAMPTZ,
    
    -- Data Life
    data_life_unit          VARCHAR(20),                -- DAY, MONTH, YEAR, INF
    data_life_value         INTEGER,
    
    -- Frequency
    frequency_unit          VARCHAR(20),                -- HOUR, DAY, MONTH, YEAR
    frequency_value         INTEGER,
    
    -- Data Filter
    data_filter             JSONB,                      -- Array of filter conditions
    
    -- Status
    status                  VARCHAR(50) DEFAULT 'ACTIVE',   -- ACTIVE, PAUSED, REVOKED, EXPIRED
    
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_aa_consents_request ON aa_consents(consent_request_id);
CREATE INDEX idx_aa_consents_status ON aa_consents(status);
CREATE INDEX idx_aa_consents_expiry ON aa_consents(consent_expiry);

-- ---------------------------------------------------------------------
-- AA Consent Events
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS aa_consent_events (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consent_id          UUID NOT NULL REFERENCES aa_consents(id),
    event_type          VARCHAR(50) NOT NULL,           -- CREATED, APPROVED, REJECTED, REVOKED, PAUSED, EXPIRED
    event_data          JSONB,
    event_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_aa_consent_events_consent ON aa_consent_events(consent_id);

-- ---------------------------------------------------------------------
-- AA Data Fetch Runs
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS aa_data_fetch_runs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consent_id          UUID NOT NULL REFERENCES aa_consents(id),
    session_id          VARCHAR(100),
    fetch_type          VARCHAR(50),                    -- SCHEDULED, MANUAL
    status              VARCHAR(50) DEFAULT 'INITIATED', -- INITIATED, IN_PROGRESS, COMPLETED, FAILED
    started_at          TIMESTAMPTZ DEFAULT NOW(),
    completed_at        TIMESTAMPTZ,
    error_message       TEXT,
    accounts_fetched    INTEGER DEFAULT 0,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_aa_data_fetch_runs_consent ON aa_data_fetch_runs(consent_id);

-- ---------------------------------------------------------------------
-- AA Fetch Payloads (Raw fetched data)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS aa_fetch_payloads (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fetch_run_id        UUID NOT NULL REFERENCES aa_data_fetch_runs(id),
    fip_id              VARCHAR(100) NOT NULL,
    account_ref_number  VARCHAR(100),
    fi_type             VARCHAR(50),                    -- DEPOSIT, MUTUAL_FUNDS, etc.
    raw_payload         JSONB NOT NULL,
    decrypted_at        TIMESTAMPTZ,
    processed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_aa_fetch_payloads_run ON aa_fetch_payloads(fetch_run_id);


-- =====================================================================
-- LAYER B: CANONICAL FINANCIAL DATA
-- =====================================================================

-- ---------------------------------------------------------------------
-- FIPs (Financial Information Providers)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fips (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fip_id                  VARCHAR(100) UNIQUE NOT NULL,   -- FIP identifier from AA
    fip_name                VARCHAR(255) NOT NULL,
    code                    VARCHAR(50),                    -- Short code
    enable                  VARCHAR(10) DEFAULT 'true',     -- Enable status
    
    -- FI Types supported
    fi_types                JSONB,                          -- Array: ["DEPOSIT", "MUTUAL_FUNDS", etc.]
    
    -- Entity branding URIs
    entity_icon_uri         TEXT,
    entity_logo_uri         TEXT,
    entity_logo_with_name_uri TEXT,
    
    -- OTP settings
    otp_length              INTEGER,
    
    is_active               BOOLEAN DEFAULT true,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fips_fip_id ON fips(fip_id);

-- ---------------------------------------------------------------------
-- FI Accounts (Linked financial accounts)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fi_accounts (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                     UUID NOT NULL REFERENCES app_users(id),
    fip_id                      UUID REFERENCES fips(id),
    consent_id                  UUID REFERENCES aa_consents(id),
    
    -- API identifiers
    fi_data_id                  VARCHAR(100) UNIQUE,        -- Unique ID from API
    account_ref_number          VARCHAR(100),               -- Account reference number
    masked_acc_number           VARCHAR(100),
    account_type                VARCHAR(50) NOT NULL,       -- SAVINGS, CURRENT, TERM_DEPOSIT, etc.
    fi_type                     VARCHAR(50) NOT NULL,       -- DEPOSIT, MUTUAL_FUNDS, EQUITIES, etc.
    
    -- Account details
    account_name                VARCHAR(255),
    account_currency            VARCHAR(10) DEFAULT 'INR',
    account_facility            VARCHAR(50),                -- OD, CC, etc.
    account_status              VARCHAR(50),                -- ACTIVE, INACTIVE, DORMANT
    account_description         TEXT,
    
    -- Limits
    account_current_od_limit    DECIMAL(18, 2),
    account_drawing_limit       DECIMAL(18, 2),
    
    -- Fetch status
    data_fetched                BOOLEAN DEFAULT false,
    last_fetch_date_time        TIMESTAMPTZ,
    fi_request_count_of_month   INTEGER DEFAULT 0,
    
    -- Consent info
    latest_consent_purpose_text     TEXT,
    latest_consent_expiry_time      TIMESTAMPTZ,
    consent_purpose_version         VARCHAR(50),
    
    -- FIP details (denormalized for quick access)
    fip_id_str                  VARCHAR(100),               -- FIP ID string
    fip_name                    VARCHAR(255),
    
    -- Status
    is_active                   BOOLEAN DEFAULT true,
    linked_at                   TIMESTAMPTZ DEFAULT NOW(),
    delinked_at                 TIMESTAMPTZ,
    
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fi_accounts_user ON fi_accounts(user_id);
CREATE INDEX idx_fi_accounts_fip ON fi_accounts(fip_id);
CREATE INDEX idx_fi_accounts_fi_data_id ON fi_accounts(fi_data_id);
CREATE INDEX idx_fi_accounts_type ON fi_accounts(fi_type);

-- ---------------------------------------------------------------------
-- FI Account Holders PII
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fi_account_holders_pii (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id          UUID NOT NULL REFERENCES fi_accounts(id),
    
    -- Holder details
    holder_name         VARCHAR(255),
    holder_type         VARCHAR(50),                    -- PRIMARY, JOINT, NOMINEE
    holder_pan          VARCHAR(20),
    holder_email        VARCHAR(255),
    holder_mobile       VARCHAR(20),
    holder_landline     VARCHAR(30),
    holder_dob          DATE,
    
    -- Address
    holder_address      JSONB,                          -- Full address object
    
    -- KYC
    holder_ckycCompliance   BOOLEAN,
    holder_nominee          VARCHAR(255),               -- Nominee name
    holder_rank             INTEGER,                    -- Holder rank (1=primary)
    holder_authType         VARCHAR(50),                -- OTP, BIOMETRIC, etc.
    
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fi_holders_account ON fi_account_holders_pii(account_id);

-- ---------------------------------------------------------------------
-- FI Transactions (Generic transaction table)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fi_transactions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id              UUID NOT NULL REFERENCES fi_accounts(id),
    
    -- Transaction identifiers
    txn_id                  VARCHAR(100),               -- Transaction ID from FIP
    reference_number        VARCHAR(100),
    
    -- Transaction details
    txn_type                VARCHAR(50) NOT NULL,       -- CREDIT, DEBIT, REVERSAL
    mode                    VARCHAR(50),                -- UPI, NEFT, IMPS, CASH, etc.
    amount                  DECIMAL(18, 2) NOT NULL,
    currency                VARCHAR(10) DEFAULT 'INR',
    
    -- Balance
    current_balance         DECIMAL(18, 2),
    balance_after           DECIMAL(18, 2),
    
    -- Timestamps
    transaction_timestamp   TIMESTAMPTZ NOT NULL,
    value_date              DATE,
    
    -- Narration
    narration               TEXT,
    
    -- Categorization (for insights)
    category                VARCHAR(100),               -- FOOD, TRANSPORT, SALARY, etc.
    sub_category            VARCHAR(100),
    
    -- Raw data
    raw_data                JSONB,
    
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fi_transactions_account ON fi_transactions(account_id);
CREATE INDEX idx_fi_transactions_timestamp ON fi_transactions(transaction_timestamp);
CREATE INDEX idx_fi_transactions_type ON fi_transactions(txn_type);
CREATE INDEX idx_fi_transactions_category ON fi_transactions(category);

-- ---------------------------------------------------------------------
-- FI Mutual Fund Transaction Details (1:1 extension)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fi_mutual_fund_txn_details (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id      UUID UNIQUE NOT NULL REFERENCES fi_transactions(id),
    
    -- MF specific fields
    amc                 VARCHAR(255),
    folio_no            VARCHAR(50),
    scheme_code         VARCHAR(50),
    isin                VARCHAR(20),
    units               DECIMAL(18, 6),
    nav                 DECIMAL(18, 4),
    nav_date            DATE,
    order_date          DATE,
    execution_date      DATE,
    
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- FI Equity Transaction Details (1:1 extension)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fi_equity_txn_details (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id      UUID UNIQUE NOT NULL REFERENCES fi_transactions(id),
    
    -- Equity specific fields
    broker_id           VARCHAR(100),
    broker_name         VARCHAR(255),
    isin                VARCHAR(20),
    isin_description    TEXT,
    symbol              VARCHAR(20),
    exchange            VARCHAR(20),                    -- NSE, BSE
    units               DECIMAL(18, 6),
    price               DECIMAL(18, 4),
    trade_date          DATE,
    settlement_date     DATE,
    
    created_at          TIMESTAMPTZ DEFAULT NOW()
);


-- =====================================================================
-- LAYER C: FINANCIAL STATE & HOLDINGS
-- =====================================================================

-- ---------------------------------------------------------------------
-- FI Deposit Summaries (Savings/Current accounts)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fi_deposit_summaries (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id              UUID UNIQUE NOT NULL REFERENCES fi_accounts(id),
    
    -- Balance
    current_balance         DECIMAL(18, 2),
    available_balance       DECIMAL(18, 2),
    current_value           DECIMAL(18, 2),
    
    -- Interest
    interest_rate           DECIMAL(8, 4),
    interest_computed_till_date DECIMAL(18, 2),
    interest_payout_frequency   VARCHAR(50),            -- MONTHLY, QUARTERLY, etc.
    interest_computation        VARCHAR(50),            -- SIMPLE, COMPOUND
    compounding_frequency       VARCHAR(50),            -- DAILY, MONTHLY, etc.
    
    -- Dates
    opening_date            DATE,
    maturity_date           DATE,
    
    -- Other
    maturity_amount         DECIMAL(18, 2),
    branch                  VARCHAR(255),
    ifsc_code               VARCHAR(20),
    nomination_registered   BOOLEAN,
    account_description     TEXT,
    
    -- Snapshot timestamp
    as_of_date              TIMESTAMPTZ,
    last_fetch_time         TIMESTAMPTZ,
    
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- FI Term Deposit Summaries
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fi_term_deposit_summaries (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id              UUID UNIQUE NOT NULL REFERENCES fi_accounts(id),
    
    -- Principal and tenure
    principal_amount        DECIMAL(18, 2) NOT NULL,
    current_value           DECIMAL(18, 2),
    maturity_amount         DECIMAL(18, 2),
    
    -- Tenure
    tenure_days             INTEGER,
    tenure_months           INTEGER,
    tenure_years            INTEGER,
    
    -- Interest
    interest_rate           DECIMAL(8, 4),
    interest_type           VARCHAR(20),                -- FIXED, FLOATING
    interest_payout_frequency VARCHAR(50),
    interest_computation    VARCHAR(50),
    compounding_frequency   VARCHAR(50),
    interest_accrued        DECIMAL(18, 2),
    
    -- Dates
    opening_date            DATE NOT NULL,
    maturity_date           DATE NOT NULL,
    
    -- Other
    branch                  VARCHAR(255),
    ifsc_code               VARCHAR(20),
    nomination_registered   BOOLEAN,
    auto_renewal            BOOLEAN DEFAULT false,
    
    -- Snapshot
    as_of_date              TIMESTAMPTZ,
    last_fetch_time         TIMESTAMPTZ,
    
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- FI Recurring Deposit Summaries
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fi_recurring_deposit_summaries (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id                  UUID UNIQUE NOT NULL REFERENCES fi_accounts(id),
    
    -- Installment details
    monthly_installment         DECIMAL(18, 2) NOT NULL,
    installments_paid           INTEGER DEFAULT 0,
    installments_remaining      INTEGER,
    missed_installments         INTEGER DEFAULT 0,
    total_installments          INTEGER,
    
    -- Balances
    deposit_amount              DECIMAL(18, 2),
    current_value               DECIMAL(18, 2),
    maturity_amount             DECIMAL(18, 2),
    
    -- Interest
    interest_rate               DECIMAL(8, 4),
    interest_accrued            DECIMAL(18, 2),
    interest_payout_frequency   VARCHAR(50),
    
    -- Tenure
    tenure_months               INTEGER,
    
    -- Dates
    opening_date                DATE NOT NULL,
    maturity_date               DATE NOT NULL,
    next_installment_date       DATE,
    
    -- Other
    branch                      VARCHAR(255),
    ifsc_code                   VARCHAR(20),
    nomination_registered       BOOLEAN,
    
    -- Snapshot
    as_of_date                  TIMESTAMPTZ,
    last_fetch_time             TIMESTAMPTZ,
    
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- FI Mutual Fund Summaries
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fi_mutual_fund_summaries (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id              UUID UNIQUE NOT NULL REFERENCES fi_accounts(id),
    
    -- Portfolio totals
    total_current_value     DECIMAL(18, 2),
    total_cost_value        DECIMAL(18, 2),
    total_holdings          INTEGER DEFAULT 0,
    total_fi_data           INTEGER DEFAULT 0,
    total_fi_data_to_fetch  INTEGER DEFAULT 0,
    
    -- Previous period comparison
    prev_percentage_change  DECIMAL(10, 4),
    prev_price_change       DECIMAL(18, 2),
    prev_last_fetch_time    TIMESTAMPTZ,
    prev_current_value      DECIMAL(18, 2),
    
    -- Snapshot
    as_of_date              TIMESTAMPTZ,
    last_fetch_time         TIMESTAMPTZ,
    
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- FI Mutual Fund Holdings
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fi_mutual_fund_holdings (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    summary_id                  UUID NOT NULL REFERENCES fi_mutual_fund_summaries(id),
    account_id                  UUID NOT NULL REFERENCES fi_accounts(id),
    
    -- Scheme identification
    amc                         VARCHAR(255),
    registrar                   VARCHAR(255),           -- CAMS, KARVY, etc.
    scheme_code                 VARCHAR(50),
    scheme_option               VARCHAR(50),            -- GROWTH, DIVIDEND, etc.
    scheme_types                VARCHAR(100),           -- EQUITY, DEBT, HYBRID
    scheme_category             VARCHAR(100),           -- LARGE_CAP, MID_CAP, etc.
    isin                        VARCHAR(20),
    isin_description            TEXT,
    ucc                         VARCHAR(50),            -- Unique Client Code
    amfi_code                   VARCHAR(50),
    
    -- Holdings
    closing_units               DECIMAL(18, 6),
    lien_units                  DECIMAL(18, 6) DEFAULT 0,
    locking_units               DECIMAL(18, 6) DEFAULT 0,
    
    -- NAV
    nav                         DECIMAL(18, 4),
    avg_nav                     DECIMAL(18, 4),         -- Average purchase NAV
    nav_date                    DATE,
    
    -- Values
    current_value               DECIMAL(18, 2),
    cost_value                  DECIMAL(18, 2),
    
    -- Portfolio metrics
    portfolio_weightage_percent DECIMAL(8, 4),
    
    -- Previous period comparison
    prev_percentage_change      DECIMAL(10, 4),
    prev_price_change           DECIMAL(18, 2),
    prev_current_value          DECIMAL(18, 2),
    prev_total_units            DECIMAL(18, 6),
    prev_last_fetch_time        TIMESTAMPTZ,
    
    -- Snapshot
    last_fetch_time             TIMESTAMPTZ,
    
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mf_holdings_summary ON fi_mutual_fund_holdings(summary_id);
CREATE INDEX idx_mf_holdings_account ON fi_mutual_fund_holdings(account_id);
CREATE INDEX idx_mf_holdings_isin ON fi_mutual_fund_holdings(isin);

-- ---------------------------------------------------------------------
-- FI Mutual Fund Folios (Per-FIP breakdown of holdings)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fi_mutual_fund_folios (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    holding_id              UUID NOT NULL REFERENCES fi_mutual_fund_holdings(id),
    
    -- FIP/Account reference
    fip_id                  VARCHAR(100),
    fi_data_id              VARCHAR(100),
    masked_acc_number       VARCHAR(100),
    account_ref_number      VARCHAR(100),
    folio_no                VARCHAR(50),
    
    -- Holdings in this folio
    closing_units           DECIMAL(18, 6),
    lien_units              DECIMAL(18, 6) DEFAULT 0,
    locking_units           DECIMAL(18, 6) DEFAULT 0,
    
    -- NAV
    nav                     DECIMAL(18, 4),
    nav_date                DATE,
    
    -- Value
    current_value           DECIMAL(18, 2),
    
    -- Previous period comparison
    prev_details            JSONB,                      -- {percentageChange, priceChange, etc.}
    
    -- Snapshot
    last_fetch_time         TIMESTAMPTZ,
    
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mf_folios_holding ON fi_mutual_fund_folios(holding_id);
CREATE INDEX idx_mf_folios_folio_no ON fi_mutual_fund_folios(folio_no);

-- ---------------------------------------------------------------------
-- FI Equity Summaries
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fi_equity_summaries (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id              UUID UNIQUE NOT NULL REFERENCES fi_accounts(id),
    
    -- Portfolio totals
    total_current_value     DECIMAL(18, 2),
    total_cost_value        DECIMAL(18, 2),
    total_demat             INTEGER DEFAULT 0,
    total_fi_data           INTEGER DEFAULT 0,
    total_fi_data_to_fetch  INTEGER DEFAULT 0,
    
    -- Previous period comparison
    prev_details            JSONB,                      -- {percentageChange, priceChange, etc.}
    
    -- Snapshot
    as_of_date              TIMESTAMPTZ,
    last_fetch_time         TIMESTAMPTZ,
    
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- FI Equity Demats (Demat accounts)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fi_equity_demats (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    summary_id              UUID NOT NULL REFERENCES fi_equity_summaries(id),
    
    -- Demat identification
    demat_id                VARCHAR(100),
    broker_name             VARCHAR(255),
    fi_data_id              VARCHAR(100),
    fip_id                  VARCHAR(100),
    masked_acc_number       VARCHAR(100),
    account_ref_number      VARCHAR(100),
    
    -- Totals for this demat
    units                   DECIMAL(18, 6),
    last_traded_price       DECIMAL(18, 4),
    avg_traded_price        DECIMAL(18, 4),
    current_value           DECIMAL(18, 2),
    
    -- Previous period comparison
    prev_details            JSONB,
    
    -- Snapshot
    last_fetch_time         TIMESTAMPTZ,
    
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_equity_demats_summary ON fi_equity_demats(summary_id);

-- ---------------------------------------------------------------------
-- FI Equity Holdings
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fi_equity_holdings (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    summary_id                  UUID NOT NULL REFERENCES fi_equity_summaries(id),
    demat_id                    UUID REFERENCES fi_equity_demats(id),
    
    -- Stock identification
    issuer_name                 VARCHAR(255),
    isin                        VARCHAR(20),
    isin_description            TEXT,
    symbol                      VARCHAR(20),
    exchange                    VARCHAR(20),            -- NSE, BSE
    
    -- Holdings
    units                       DECIMAL(18, 6),
    last_traded_price           DECIMAL(18, 4),
    avg_traded_price            DECIMAL(18, 4),
    
    -- Values
    current_value               DECIMAL(18, 2),
    cost_value                  DECIMAL(18, 2),
    
    -- Portfolio metrics
    portfolio_weightage_percent DECIMAL(8, 4),
    
    -- Previous period comparison
    prev_details                JSONB,
    
    -- Snapshot
    last_fetch_time             TIMESTAMPTZ,
    
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_equity_holdings_summary ON fi_equity_holdings(summary_id);
CREATE INDEX idx_equity_holdings_demat ON fi_equity_holdings(demat_id);
CREATE INDEX idx_equity_holdings_isin ON fi_equity_holdings(isin);

-- ---------------------------------------------------------------------
-- FI Equity Brokers (Broker-wise breakdown of holdings)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fi_equity_brokers (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    holding_id              UUID NOT NULL REFERENCES fi_equity_holdings(id),
    
    -- Broker details
    broker_id               VARCHAR(100),
    broker_name             VARCHAR(255),
    
    -- Holdings at this broker
    units                   DECIMAL(18, 6),
    last_traded_price       DECIMAL(18, 4),
    avg_traded_price        DECIMAL(18, 4),
    current_value           DECIMAL(18, 2),
    
    -- Previous period comparison
    prev_details            JSONB,
    
    -- Snapshot
    last_fetch_time         TIMESTAMPTZ,
    
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_equity_brokers_holding ON fi_equity_brokers(holding_id);

-- ---------------------------------------------------------------------
-- FI ETF Summaries
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fi_etf_summaries (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id              UUID UNIQUE NOT NULL REFERENCES fi_accounts(id),
    
    -- Portfolio totals
    total_current_value     DECIMAL(18, 2),
    total_cost_value        DECIMAL(18, 2),
    total_holdings          INTEGER DEFAULT 0,
    total_fi_data           INTEGER DEFAULT 0,
    total_fi_data_to_fetch  INTEGER DEFAULT 0,
    
    -- Previous period comparison
    prev_details            JSONB,
    
    -- Snapshot
    as_of_date              TIMESTAMPTZ,
    last_fetch_time         TIMESTAMPTZ,
    
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- FI ETF Holdings
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fi_etf_holdings (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    summary_id                  UUID NOT NULL REFERENCES fi_etf_summaries(id),
    
    -- ETF identification
    isin                        VARCHAR(20),
    isin_description            TEXT,
    symbol                      VARCHAR(20),
    exchange                    VARCHAR(20),
    
    -- Holdings
    units                       DECIMAL(18, 6),
    nav                         DECIMAL(18, 4),
    
    -- Values
    current_value               DECIMAL(18, 2),
    cost_value                  DECIMAL(18, 2),
    
    -- Portfolio metrics
    portfolio_weightage_percent DECIMAL(8, 4),
    
    -- Previous period comparison
    prev_details                JSONB,
    
    -- Snapshot
    last_fetch_time             TIMESTAMPTZ,
    
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_etf_holdings_summary ON fi_etf_holdings(summary_id);
CREATE INDEX idx_etf_holdings_isin ON fi_etf_holdings(isin);

-- ---------------------------------------------------------------------
-- FI NPS Summaries (National Pension System)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fi_nps_summaries (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id              UUID UNIQUE NOT NULL REFERENCES fi_accounts(id),
    
    -- PRAN details
    pran                    VARCHAR(20),                -- Permanent Retirement Account Number
    tier_type               VARCHAR(10),                -- TIER_I, TIER_II
    
    -- Scheme details
    scheme_name             VARCHAR(255),
    scheme_nav              DECIMAL(18, 4),
    nav_date                DATE,
    
    -- Holdings
    units                   DECIMAL(18, 6),
    current_value           DECIMAL(18, 2),
    
    -- Contributions
    employee_contribution   DECIMAL(18, 2),
    employer_contribution   DECIMAL(18, 2),
    voluntary_contribution  DECIMAL(18, 2),
    total_contribution      DECIMAL(18, 2),
    
    -- Previous period comparison
    prev_details            JSONB,
    
    -- Snapshot
    as_of_date              TIMESTAMPTZ,
    last_fetch_time         TIMESTAMPTZ,
    
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- FI NPS Holdings (Asset class breakdown)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fi_nps_holdings (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    summary_id                  UUID NOT NULL REFERENCES fi_nps_summaries(id),
    
    -- Asset class
    asset_class                 VARCHAR(50),            -- E (Equity), C (Corporate), G (Govt), A (Alternate)
    asset_class_name            VARCHAR(100),
    
    -- Allocation
    percentage_allocation       DECIMAL(8, 4),
    
    -- Holdings
    units                       DECIMAL(18, 6),
    nav                         DECIMAL(18, 4),
    current_value               DECIMAL(18, 2),
    
    -- Previous period comparison
    prev_details                JSONB,
    
    -- Snapshot
    last_fetch_time             TIMESTAMPTZ,
    
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nps_holdings_summary ON fi_nps_holdings(summary_id);

-- ---------------------------------------------------------------------
-- FI Deposit Insights (Analytics for deposit accounts)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fi_deposit_insights (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL REFERENCES app_users(id),
    
    -- Period
    period_from             DATE NOT NULL,
    period_to               DATE NOT NULL,
    frequency               VARCHAR(20),                -- DAILY, WEEKLY, MONTHLY
    
    -- Account filter (null = all accounts)
    account_ids             JSONB,                      -- Array of account IDs
    
    -- Balance insights
    balance_avg             DECIMAL(18, 2),
    balance_min             DECIMAL(18, 2),
    balance_max             DECIMAL(18, 2),
    balance_start_of_period DECIMAL(18, 2),
    balance_end_of_period   DECIMAL(18, 2),
    balance_value_change    DECIMAL(18, 2),
    balance_percent_change  DECIMAL(10, 4),
    has_full_period_data    BOOLEAN DEFAULT true,
    
    -- Snapshot
    generated_at            TIMESTAMPTZ DEFAULT NOW(),
    
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deposit_insights_user ON fi_deposit_insights(user_id);
CREATE INDEX idx_deposit_insights_period ON fi_deposit_insights(period_from, period_to);

-- ---------------------------------------------------------------------
-- FI Deposit Insights Flow (Incoming/Outgoing breakdown)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fi_deposit_insights_flow (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    insight_id              UUID NOT NULL REFERENCES fi_deposit_insights(id),
    
    -- Flow direction
    flow_direction          VARCHAR(20) NOT NULL,       -- INCOMING, OUTGOING
    
    -- Totals
    total_amount            DECIMAL(18, 2),
    
    -- Mode split (UPI, NEFT, etc.)
    mode_split              JSONB,                      -- [{type, value, txnCount, valueChange, percentChange}]
    
    -- Category split (SALARY, FOOD, etc.)
    category_split          JSONB,                      -- [{type, value, txnCount, valueChange, percentChange}]
    
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deposit_flow_insight ON fi_deposit_insights_flow(insight_id);

-- ---------------------------------------------------------------------
-- FI Mutual Fund Insights
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fi_mutual_fund_insights (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL REFERENCES app_users(id),
    
    -- Period
    period_from             DATE NOT NULL,
    period_to               DATE NOT NULL,
    frequency               VARCHAR(20),
    
    -- Account filter
    account_ids             JSONB,
    
    -- Portfolio metrics
    total_investment        DECIMAL(18, 2),
    current_value           DECIMAL(18, 2),
    absolute_returns        DECIMAL(18, 2),
    percentage_returns      DECIMAL(10, 4),
    xirr                    DECIMAL(10, 4),
    
    -- Category breakdown
    category_split          JSONB,                      -- [{category, value, percentage}]
    
    -- Risk metrics
    risk_score              DECIMAL(5, 2),
    
    -- Snapshot
    generated_at            TIMESTAMPTZ DEFAULT NOW(),
    
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mf_insights_user ON fi_mutual_fund_insights(user_id);

-- ---------------------------------------------------------------------
-- User Financial Snapshots (Fast UI - Portfolio Overview)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_financial_snapshots (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL REFERENCES app_users(id),
    consent_id              UUID REFERENCES aa_consents(id),
    
    -- Total portfolio value
    total_net_worth         DECIMAL(18, 2),
    
    -- Breakdown by asset class
    deposits_value          DECIMAL(18, 2),
    term_deposits_value     DECIMAL(18, 2),
    recurring_deposits_value DECIMAL(18, 2),
    mutual_funds_value      DECIMAL(18, 2),
    equities_value          DECIMAL(18, 2),
    etf_value               DECIMAL(18, 2),
    nps_value               DECIMAL(18, 2),
    
    -- Account counts
    total_accounts          INTEGER DEFAULT 0,
    deposits_count          INTEGER DEFAULT 0,
    term_deposits_count     INTEGER DEFAULT 0,
    recurring_deposits_count INTEGER DEFAULT 0,
    mutual_funds_count      INTEGER DEFAULT 0,
    equities_count          INTEGER DEFAULT 0,
    etf_count               INTEGER DEFAULT 0,
    nps_count               INTEGER DEFAULT 0,
    
    -- Previous period comparison
    prev_total_net_worth    DECIMAL(18, 2),
    net_worth_change        DECIMAL(18, 2),
    net_worth_change_pct    DECIMAL(10, 4),
    
    -- Data freshness
    last_fetch_date         TIMESTAMPTZ,
    data_sources            JSONB,                      -- [{dataResourceType, lastFetchDate}]
    
    -- Snapshot timestamp
    snapshot_at             TIMESTAMPTZ DEFAULT NOW(),
    
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_snapshots_user ON user_financial_snapshots(user_id);
CREATE INDEX idx_user_snapshots_snapshot_at ON user_financial_snapshots(snapshot_at);


-- =====================================================================
-- HELPER FUNCTIONS
-- =====================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_tsp_providers_updated_at
    BEFORE UPDATE ON tsp_providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_aa_gateways_updated_at
    BEFORE UPDATE ON aa_gateways
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_users_updated_at
    BEFORE UPDATE ON app_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_integration_apps_updated_at
    BEFORE UPDATE ON app_integration_apps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_aa_consent_requests_updated_at
    BEFORE UPDATE ON aa_consent_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_aa_consents_updated_at
    BEFORE UPDATE ON aa_consents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fips_updated_at
    BEFORE UPDATE ON fips
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fi_accounts_updated_at
    BEFORE UPDATE ON fi_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fi_account_holders_pii_updated_at
    BEFORE UPDATE ON fi_account_holders_pii
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fi_deposit_summaries_updated_at
    BEFORE UPDATE ON fi_deposit_summaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fi_term_deposit_summaries_updated_at
    BEFORE UPDATE ON fi_term_deposit_summaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fi_recurring_deposit_summaries_updated_at
    BEFORE UPDATE ON fi_recurring_deposit_summaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fi_mutual_fund_summaries_updated_at
    BEFORE UPDATE ON fi_mutual_fund_summaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fi_mutual_fund_holdings_updated_at
    BEFORE UPDATE ON fi_mutual_fund_holdings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fi_mutual_fund_folios_updated_at
    BEFORE UPDATE ON fi_mutual_fund_folios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fi_equity_summaries_updated_at
    BEFORE UPDATE ON fi_equity_summaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fi_equity_demats_updated_at
    BEFORE UPDATE ON fi_equity_demats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fi_equity_holdings_updated_at
    BEFORE UPDATE ON fi_equity_holdings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fi_equity_brokers_updated_at
    BEFORE UPDATE ON fi_equity_brokers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fi_etf_summaries_updated_at
    BEFORE UPDATE ON fi_etf_summaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fi_etf_holdings_updated_at
    BEFORE UPDATE ON fi_etf_holdings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fi_nps_summaries_updated_at
    BEFORE UPDATE ON fi_nps_summaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fi_nps_holdings_updated_at
    BEFORE UPDATE ON fi_nps_holdings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =====================================================================
-- SCHEMA SUMMARY
-- =====================================================================
-- 
-- LAYER A - Flow & Control (11 tables):
--   - tsp_providers
--   - aa_gateways
--   - app_users
--   - app_integration_apps
--   - tsp_auth_tokens
--   - tsp_api_calls
--   - aa_consent_requests
--   - aa_redirect_events
--   - aa_consents
--   - aa_consent_events
--   - aa_data_fetch_runs
--   - aa_fetch_payloads
--
-- LAYER B - Canonical Financial Data (5 tables):
--   - fips
--   - fi_accounts
--   - fi_account_holders_pii
--   - fi_transactions
--   - fi_mutual_fund_txn_details
--   - fi_equity_txn_details
--
-- LAYER C - Financial State & Holdings (20 tables):
--   - fi_deposit_summaries
--   - fi_term_deposit_summaries
--   - fi_recurring_deposit_summaries
--   - fi_mutual_fund_summaries
--   - fi_mutual_fund_holdings
--   - fi_mutual_fund_folios
--   - fi_equity_summaries
--   - fi_equity_demats
--   - fi_equity_holdings
--   - fi_equity_brokers
--   - fi_etf_summaries
--   - fi_etf_holdings
--   - fi_nps_summaries
--   - fi_nps_holdings
--   - fi_deposit_insights
--   - fi_deposit_insights_flow
--   - fi_mutual_fund_insights
--   - user_financial_snapshots
--
-- TOTAL: 38 tables
-- =====================================================================

