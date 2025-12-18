-- ============================================
-- Supabase Database Schema for WealthScape APIs
-- Based on Official Finfactor/Finvu API Documentation
-- Run this in Supabase SQL Editor to create tables
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE TABLES
-- ============================================

-- ============================================
-- 1. USERS TABLE
-- Stores user subscription and profile data
-- API: /pfm/api/v2/user-subscriptions, /pfm/api/v2/user-details
-- ============================================
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    unique_identifier VARCHAR(50) UNIQUE NOT NULL,
    mobile_number VARCHAR(15),
    pan VARCHAR(10),
    email VARCHAR(255),
    
    -- Subscription Details
    subscription_status VARCHAR(10) DEFAULT 'NO' CHECK (subscription_status IN ('YES', 'NO')),
    subscription_start DATE,
    subscription_end DATE,
    
    -- Computed Portfolio Summary (aggregated from fi_data_summary)
    total_portfolio_value DECIMAL(18, 2) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_synced_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_unique_identifier ON users(unique_identifier);
CREATE INDEX idx_users_mobile ON users(mobile_number);
CREATE INDEX idx_users_pan ON users(pan);

-- ============================================
-- 2. FI DATA SUMMARY TABLE
-- Stores per-FI-type summary for each user
-- Represents the fiDatas object from /pfm/api/v2/user-details
-- ============================================
DROP TABLE IF EXISTS fi_data_summary CASCADE;
CREATE TABLE fi_data_summary (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    unique_identifier VARCHAR(50) NOT NULL REFERENCES users(unique_identifier) ON DELETE CASCADE,
    
    -- FI Type (DEPOSIT, TERM_DEPOSIT, RECURRING_DEPOSIT, EQUITIES, MUTUAL_FUNDS, NPS, ETF)
    fi_type VARCHAR(30) NOT NULL,
    
    -- Summary Counts
    total_fi_data INTEGER DEFAULT 0,
    total_fi_data_to_be_fetched INTEGER DEFAULT 0,
    last_fetch_date TIMESTAMP WITH TIME ZONE,
    
    -- Values
    current_balance DECIMAL(18, 2),  -- For DEPOSIT type
    current_value DECIMAL(18, 2),
    cost_value DECIMAL(18, 2),
    
    -- Counts
    total_holdings INTEGER DEFAULT 0,
    total_brokers INTEGER DEFAULT 0,
    
    -- Data Source Details (JSON array)
    data_source_details JSONB DEFAULT '[]'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(unique_identifier, fi_type)
);

CREATE INDEX idx_fi_summary_user ON fi_data_summary(unique_identifier);
CREATE INDEX idx_fi_summary_type ON fi_data_summary(fi_type);

-- ============================================
-- 3. FIPS TABLE (Financial Information Providers)
-- Master list of FIPs
-- API: /pfm/api/v2/fips
-- ============================================
DROP TABLE IF EXISTS fips CASCADE;
CREATE TABLE fips (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    fip_id VARCHAR(100) UNIQUE NOT NULL,
    fip_name VARCHAR(255) NOT NULL,
    
    -- Supported FI Types
    fi_types TEXT[] DEFAULT '{}',
    
    -- Status
    enabled BOOLEAN DEFAULT TRUE,
    
    -- Branding
    logo_url TEXT,
    
    -- Classification
    bank_type VARCHAR(50),
    category VARCHAR(100),
    
    -- Contact
    website VARCHAR(255),
    support_email VARCHAR(255),
    support_phone VARCHAR(50),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_fips_fip_id ON fips(fip_id);

-- ============================================
-- 4. BROKERS TABLE
-- Master list of brokers
-- API: /pfm/api/v2/brokers
-- ============================================
DROP TABLE IF EXISTS brokers CASCADE;
CREATE TABLE brokers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    broker_id VARCHAR(100) UNIQUE NOT NULL,
    broker_name VARCHAR(255) NOT NULL,
    broker_code VARCHAR(20),
    
    -- Status
    enabled BOOLEAN DEFAULT TRUE,
    
    -- Branding
    logo_url TEXT,
    
    -- Classification
    broker_type VARCHAR(50) CHECK (broker_type IN ('FULL_SERVICE', 'DISCOUNT', 'DEPOSITORY')),
    
    -- Supported Assets
    supported_assets TEXT[] DEFAULT '{}',
    
    -- Registration
    sebi_reg_no VARCHAR(50),
    
    -- Exchange Memberships
    exchanges TEXT[] DEFAULT '{}',
    
    -- Contact
    website VARCHAR(255),
    support_email VARCHAR(255),
    support_phone VARCHAR(50),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_brokers_broker_id ON brokers(broker_id);

-- ============================================
-- LINKED ACCOUNTS - Base structure for all account types
-- ============================================

-- ============================================
-- 5. LINKED ACCOUNTS TABLE (Generic)
-- Stores linked account information from any FIP
-- Used for all FI types: DEPOSIT, TERM_DEPOSIT, RECURRING_DEPOSIT, EQUITIES, MUTUAL_FUNDS, NPS, ETF
-- ============================================
DROP TABLE IF EXISTS linked_accounts CASCADE;
CREATE TABLE linked_accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    unique_identifier VARCHAR(50) NOT NULL REFERENCES users(unique_identifier) ON DELETE CASCADE,
    
    -- Account Identifiers
    fi_data_id VARCHAR(100) UNIQUE NOT NULL,
    account_ref_number VARCHAR(100),
    masked_acc_number VARCHAR(50),
    account_name VARCHAR(255),
    
    -- Account Classification
    account_type VARCHAR(50) NOT NULL, -- DEPOSIT, TERM_DEPOSIT, RECURRING_DEPOSIT, EQUITIES, MUTUAL_FUNDS, NPS, ETF
    
    -- FIP Information
    fip_id VARCHAR(100),
    fip_name VARCHAR(255),
    
    -- Data Status
    data_fetched BOOLEAN DEFAULT FALSE,
    last_fetch_datetime TIMESTAMP WITH TIME ZONE,
    fi_request_count_current_month INTEGER DEFAULT 0,
    
    -- Consent Information
    latest_consent_purpose_text TEXT,
    latest_consent_expiry_time TIMESTAMP WITH TIME ZONE,
    consent_purpose_version VARCHAR(20),
    
    -- Raw FI Data (JSON - stores the complete fiData object)
    fi_data JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_linked_accounts_user ON linked_accounts(unique_identifier);
CREATE INDEX idx_linked_accounts_type ON linked_accounts(account_type);
CREATE INDEX idx_linked_accounts_fip ON linked_accounts(fip_id);
CREATE INDEX idx_linked_accounts_fi_data_id ON linked_accounts(fi_data_id);

-- ============================================
-- DEPOSIT MODULE
-- API: /pfm/api/v2/deposit/*
-- ============================================

-- ============================================
-- 6. DEPOSIT ACCOUNTS TABLE
-- Extended details for DEPOSIT type accounts
-- ============================================
DROP TABLE IF EXISTS deposit_accounts CASCADE;
CREATE TABLE deposit_accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    linked_account_id UUID REFERENCES linked_accounts(id) ON DELETE CASCADE,
    unique_identifier VARCHAR(50) NOT NULL,
    fi_data_id VARCHAR(100) UNIQUE NOT NULL,
    
    -- Account Details
    current_balance DECIMAL(18, 2) DEFAULT 0,
    available_balance DECIMAL(18, 2),
    account_status VARCHAR(20),
    
    -- Bank Details
    ifsc_code VARCHAR(15),
    micr_code VARCHAR(15),
    branch VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_deposit_accounts_user ON deposit_accounts(unique_identifier);

-- ============================================
-- 7. DEPOSIT TRANSACTIONS TABLE
-- API: /pfm/api/v2/deposit/user-account-statement
-- ============================================
DROP TABLE IF EXISTS deposit_transactions CASCADE;
CREATE TABLE deposit_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    unique_identifier VARCHAR(50) NOT NULL,
    account_id VARCHAR(100) NOT NULL,  -- fi_data_id
    
    -- Transaction Identifiers
    txn_id VARCHAR(100) UNIQUE NOT NULL,
    
    -- Transaction Details
    amount DECIMAL(18, 2) NOT NULL,
    narration TEXT,
    type VARCHAR(10) CHECK (type IN ('CREDIT', 'DEBIT')),
    mode VARCHAR(30),  -- UPI, NEFT, RTGS, IMPS, ATM, CASH, etc.
    balance DECIMAL(18, 2),
    
    -- Dates
    transaction_datetime TIMESTAMP WITH TIME ZONE,
    value_date DATE,
    
    -- Reference
    reference VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_deposit_txn_user ON deposit_transactions(unique_identifier);
CREATE INDEX idx_deposit_txn_account ON deposit_transactions(account_id);
CREATE INDEX idx_deposit_txn_date ON deposit_transactions(transaction_datetime DESC);

-- ============================================
-- 8. DEPOSIT INSIGHTS TABLE
-- API: /pfm/api/v2/deposit/insights
-- ============================================
DROP TABLE IF EXISTS deposit_insights CASCADE;
CREATE TABLE deposit_insights (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    unique_identifier VARCHAR(50) NOT NULL,
    
    -- Query Parameters
    account_ids TEXT[] DEFAULT '{}',
    from_date DATE,
    to_date DATE,
    frequency VARCHAR(20) CHECK (frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY')),
    
    -- Insights Data (JSON - complex nested structure)
    insights_data JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_deposit_insights_user ON deposit_insights(unique_identifier);

-- ============================================
-- TERM DEPOSIT MODULE
-- API: /pfm/api/v2/term-deposit/*
-- ============================================

-- ============================================
-- 9. TERM DEPOSITS TABLE
-- ============================================
DROP TABLE IF EXISTS term_deposits CASCADE;
CREATE TABLE term_deposits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    linked_account_id UUID REFERENCES linked_accounts(id) ON DELETE CASCADE,
    unique_identifier VARCHAR(50) NOT NULL,
    fi_data_id VARCHAR(100) UNIQUE NOT NULL,
    
    -- FIP Info
    fip_id VARCHAR(100),
    fip_name VARCHAR(255),
    
    -- Deposit Details
    deposit_type VARCHAR(50),  -- FIXED_DEPOSIT, TAX_SAVER_FD, etc.
    principal_amount DECIMAL(18, 2),
    maturity_amount DECIMAL(18, 2),
    current_value DECIMAL(18, 2),
    
    -- Interest
    interest_rate DECIMAL(6, 3),
    interest_payout_frequency VARCHAR(30),  -- MONTHLY, QUARTERLY, ON_MATURITY
    
    -- Tenure
    tenure_months INTEGER,
    opening_date DATE,
    maturity_date DATE,
    
    -- Status
    account_status VARCHAR(20),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_term_deposits_user ON term_deposits(unique_identifier);

-- ============================================
-- 10. TERM DEPOSIT TRANSACTIONS TABLE
-- API: /pfm/api/v2/term-deposit/user-account-statement
-- ============================================
DROP TABLE IF EXISTS term_deposit_transactions CASCADE;
CREATE TABLE term_deposit_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    unique_identifier VARCHAR(50) NOT NULL,
    account_id VARCHAR(100) NOT NULL,
    
    txn_id VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(18, 2) NOT NULL,
    narration TEXT,
    type VARCHAR(20),
    mode VARCHAR(30),
    balance DECIMAL(18, 2),
    transaction_datetime TIMESTAMP WITH TIME ZONE,
    value_date DATE,
    reference VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_td_txn_user ON term_deposit_transactions(unique_identifier);
CREATE INDEX idx_td_txn_account ON term_deposit_transactions(account_id);

-- ============================================
-- RECURRING DEPOSIT MODULE
-- API: /pfm/api/v2/recurring-deposit/*
-- ============================================

-- ============================================
-- 11. RECURRING DEPOSITS TABLE
-- ============================================
DROP TABLE IF EXISTS recurring_deposits CASCADE;
CREATE TABLE recurring_deposits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    linked_account_id UUID REFERENCES linked_accounts(id) ON DELETE CASCADE,
    unique_identifier VARCHAR(50) NOT NULL,
    fi_data_id VARCHAR(100) UNIQUE NOT NULL,
    
    -- FIP Info
    fip_id VARCHAR(100),
    fip_name VARCHAR(255),
    
    -- RD Details
    monthly_deposit DECIMAL(18, 2),
    interest_rate DECIMAL(6, 3),
    tenure_months INTEGER,
    
    -- Dates
    opening_date DATE,
    maturity_date DATE,
    
    -- Values
    total_deposits DECIMAL(18, 2),
    maturity_amount DECIMAL(18, 2),
    current_value DECIMAL(18, 2),
    
    -- Installments
    installments_paid INTEGER DEFAULT 0,
    total_installments INTEGER,
    
    -- Status
    account_status VARCHAR(20),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_recurring_deposits_user ON recurring_deposits(unique_identifier);

-- ============================================
-- 12. RECURRING DEPOSIT TRANSACTIONS TABLE
-- API: /pfm/api/v2/recurring-deposit/user-account-statement
-- ============================================
DROP TABLE IF EXISTS recurring_deposit_transactions CASCADE;
CREATE TABLE recurring_deposit_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    unique_identifier VARCHAR(50) NOT NULL,
    account_id VARCHAR(100) NOT NULL,
    
    txn_id VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(18, 2) NOT NULL,
    narration TEXT,
    type VARCHAR(20),
    mode VARCHAR(30),
    balance DECIMAL(18, 2),
    transaction_datetime TIMESTAMP WITH TIME ZONE,
    value_date DATE,
    reference VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rd_txn_user ON recurring_deposit_transactions(unique_identifier);
CREATE INDEX idx_rd_txn_account ON recurring_deposit_transactions(account_id);

-- ============================================
-- MUTUAL FUND MODULE
-- API: /pfm/api/v2/mutual-fund/*
-- ============================================

-- ============================================
-- 13. MUTUAL FUND HOLDINGS TABLE
-- API: /pfm/api/v2/mutual-fund/user-linked-accounts/holding-folio
-- Stores ISIN-level aggregated holdings
-- ============================================
DROP TABLE IF EXISTS mutual_fund_holdings CASCADE;
CREATE TABLE mutual_fund_holdings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    unique_identifier VARCHAR(50) NOT NULL,
    
    -- Scheme Identifiers
    isin VARCHAR(20) NOT NULL,
    amfi_code VARCHAR(20),
    scheme_code VARCHAR(50),
    ucc VARCHAR(30),
    
    -- AMC Info
    amc VARCHAR(255),
    registrar VARCHAR(50),  -- CAMS, KFINTECH, etc.
    
    -- Scheme Classification
    schema_option VARCHAR(30),    -- GROWTH, IDCW, etc.
    schema_types VARCHAR(50),     -- EQUITY, DEBT, HYBRID, etc.
    schema_category VARCHAR(100), -- Large Cap, Mid Cap, Flexi Cap, etc.
    isin_description TEXT,
    
    -- Holdings
    closing_units DECIMAL(18, 6) DEFAULT 0,
    lien_units DECIMAL(18, 6) DEFAULT 0,
    locking_units DECIMAL(18, 6) DEFAULT 0,
    
    -- NAV
    nav DECIMAL(15, 4),
    avg_nav DECIMAL(15, 4),
    nav_date DATE,
    
    -- Values
    current_value DECIMAL(18, 2),
    cost_value DECIMAL(18, 2),
    
    -- Previous Day Details (for daily change tracking)
    prev_details JSONB DEFAULT '{}'::jsonb,
    -- Structure: { percentageChange, priceChange, lastFetchTime, holdingIsin, totalUnits, currentValue }
    
    -- Folios (JSON array of folio-level details)
    folios JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{ fipId, fiDataId, maskedAccNumber, accountRefNumber, currentValue, folioNo, closingUnits, lienUnits, nav, navDate, lockingUnits, lastFetchTime, prevDetails }]
    
    -- Timestamps
    last_fetch_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(unique_identifier, isin)
);

CREATE INDEX idx_mf_holdings_user ON mutual_fund_holdings(unique_identifier);
CREATE INDEX idx_mf_holdings_isin ON mutual_fund_holdings(isin);
CREATE INDEX idx_mf_holdings_amc ON mutual_fund_holdings(amc);

-- ============================================
-- 14. MUTUAL FUND TRANSACTIONS TABLE
-- API: /pfm/api/v2/mutual-fund/user-account-statement
-- ============================================
DROP TABLE IF EXISTS mutual_fund_transactions CASCADE;
CREATE TABLE mutual_fund_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    unique_identifier VARCHAR(50) NOT NULL,
    
    -- Account Reference
    account_id VARCHAR(100),  -- fi_data_id
    
    -- Transaction Identifier
    txn_id VARCHAR(100) UNIQUE NOT NULL,
    
    -- Scheme Info
    isin VARCHAR(20),
    isin_description TEXT,
    amc VARCHAR(255),
    amfi_code VARCHAR(20),
    registrar VARCHAR(50),
    folio_no VARCHAR(50),
    
    -- Transaction Details
    transaction_datetime TIMESTAMP WITH TIME ZONE,
    type VARCHAR(30),  -- PURCHASE, REDEMPTION, SWITCH_IN, SWITCH_OUT, DIVIDEND, etc.
    mode VARCHAR(30),  -- SIP, LUMPSUM, etc.
    narration TEXT,
    
    -- Units & Amount
    units DECIMAL(18, 6),
    amount DECIMAL(18, 2),
    nav DECIMAL(15, 4),
    nav_date DATE,
    
    -- Taxes & Charges
    stt_tax DECIMAL(12, 2) DEFAULT 0,
    tax DECIMAL(12, 2) DEFAULT 0,
    total_tax DECIMAL(12, 2) DEFAULT 0,
    stamp_duty DECIMAL(12, 2) DEFAULT 0,
    txn_charge DECIMAL(12, 2) DEFAULT 0,
    
    -- Lock-in
    lock_in_days VARCHAR(20),
    lock_in_flag VARCHAR(10),
    
    -- Data Source
    data_source VARCHAR(20),  -- AA, MFC
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_mf_txn_user ON mutual_fund_transactions(unique_identifier);
CREATE INDEX idx_mf_txn_isin ON mutual_fund_transactions(isin);
CREATE INDEX idx_mf_txn_date ON mutual_fund_transactions(transaction_datetime DESC);
CREATE INDEX idx_mf_txn_folio ON mutual_fund_transactions(folio_no);

-- ============================================
-- 15. MUTUAL FUND INSIGHTS TABLE
-- API: /pfm/api/v2/mutual-fund/insights
-- ============================================
DROP TABLE IF EXISTS mutual_fund_insights CASCADE;
CREATE TABLE mutual_fund_insights (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    unique_identifier VARCHAR(50) UNIQUE NOT NULL,
    
    -- Overall Summary
    pan VARCHAR(10),
    mobile VARCHAR(15),
    total_holdings INTEGER DEFAULT 0,
    current_value DECIMAL(18, 2) DEFAULT 0,
    invested_value DECIMAL(18, 2) DEFAULT 0,
    absolute_return DECIMAL(18, 2) DEFAULT 0,
    absolute_return_percentage DECIMAL(10, 4) DEFAULT 0,
    xirr DECIMAL(10, 4) DEFAULT 0,
    daily_returns DECIMAL(18, 2) DEFAULT 0,
    daily_returns_percent DECIMAL(10, 4) DEFAULT 0,
    
    -- Distribution Data (JSON arrays)
    category_distribution JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{ category, totalFunds, totalCurrentValue, percentage }]
    
    sub_category_distribution JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{ subCategory, totalFunds, totalCurrentValue, percentage }]
    
    market_cap_distribution JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{ marketCap, totalFunds, totalCurrentValue, percentage }]
    
    amc_distribution JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{ amc, totalFunds, totalCurrentValue, percentage }]
    
    sector_distribution JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{ sector, totalFunds, totalCurrentValue, percentage }]
    
    -- Detailed Holdings with per-folio insights
    holdings_insights JSONB DEFAULT '[]'::jsonb,
    -- Complex structure from API
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_mf_insights_user ON mutual_fund_insights(unique_identifier);

-- ============================================
-- 16. MUTUAL FUND ANALYSIS TABLE
-- API: /pfm/api/v2/mutual-fund/analysis
-- ============================================
DROP TABLE IF EXISTS mutual_fund_analysis CASCADE;
CREATE TABLE mutual_fund_analysis (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    unique_identifier VARCHAR(50) NOT NULL,
    
    -- FIP Level (if applicable)
    fip_id VARCHAR(100),
    fip_name VARCHAR(255),
    
    -- Summary
    total_fi_data INTEGER DEFAULT 0,
    total_fi_data_to_be_fetched INTEGER DEFAULT 0,
    current_value DECIMAL(18, 2) DEFAULT 0,
    cost_value DECIMAL(18, 2) DEFAULT 0,
    total_holdings INTEGER DEFAULT 0,
    
    -- Category Breakdown
    scheme_category JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{ schemeCategory, currentValue, totalHoldings }]
    
    -- Type Breakdown
    scheme_type JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{ schemeTypes, currentValue, totalHoldings }]
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(unique_identifier, fip_id)
);

CREATE INDEX idx_mf_analysis_user ON mutual_fund_analysis(unique_identifier);

-- ============================================
-- 17. MFC CONSENT TABLE
-- API: /pfm/api/v2/mutual-fund/mfc/consent-request, consent-approve
-- ============================================
DROP TABLE IF EXISTS mfc_consents CASCADE;
CREATE TABLE mfc_consents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    unique_identifier VARCHAR(50) NOT NULL,
    pan VARCHAR(10) NOT NULL,
    
    -- Reference IDs
    client_reference_id VARCHAR(100) UNIQUE NOT NULL,
    client_ref_no VARCHAR(100),
    
    -- Status
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED')),
    
    -- OTP Flow
    otp_sent_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_mfc_consent_user ON mfc_consents(unique_identifier);

-- ============================================
-- EQUITIES MODULE
-- API: /pfm/api/v2/equities/*
-- ============================================

-- ============================================
-- 18. EQUITIES HOLDINGS TABLE (Aggregated by ISIN)
-- API: /pfm/api/v2/equities/user-linked-accounts/holding-broker
-- ============================================
DROP TABLE IF EXISTS equities_holdings CASCADE;
CREATE TABLE equities_holdings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    unique_identifier VARCHAR(50) NOT NULL,
    
    -- Stock Identifiers
    isin VARCHAR(20) NOT NULL,
    issuer_name VARCHAR(255),
    isin_description VARCHAR(50),  -- Symbol/Ticker
    
    -- Holdings
    units DECIMAL(18, 6) DEFAULT 0,
    last_traded_price DECIMAL(15, 4),
    avg_traded_price DECIMAL(15, 4),
    current_value DECIMAL(18, 2),
    
    -- Portfolio Weight
    portfolio_weightage_percent DECIMAL(8, 4),
    
    -- Previous Day Details
    prev_details JSONB DEFAULT '{}'::jsonb,
    -- Structure: { percentageChange, priceChange, lastFetchTime, holdingIsin, totalUnits, currentValue }
    
    -- Broker-wise breakdown
    brokers JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{ brokerName, brokerId, units, lastTradedPrice, avgTradedPrice, currentValue, lastFetchTime, prevDetails }]
    
    -- Timestamps
    last_fetch_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(unique_identifier, isin)
);

CREATE INDEX idx_equities_holdings_user ON equities_holdings(unique_identifier);
CREATE INDEX idx_equities_holdings_isin ON equities_holdings(isin);

-- ============================================
-- 19. EQUITIES DEMAT ACCOUNTS TABLE
-- API: /pfm/api/v2/equities/user-linked-accounts/demat-holding
-- ============================================
DROP TABLE IF EXISTS equities_demat_accounts CASCADE;
CREATE TABLE equities_demat_accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    unique_identifier VARCHAR(50) NOT NULL,
    
    -- Demat Identifiers
    demat_id VARCHAR(100) NOT NULL,
    fi_data_id VARCHAR(100),
    fip_id VARCHAR(100),
    masked_acc_number VARCHAR(50),
    account_ref_number VARCHAR(100),
    
    -- Broker Info
    broker_name VARCHAR(255),
    broker_code VARCHAR(50),
    
    -- Aggregated Values
    units DECIMAL(18, 6) DEFAULT 0,
    last_traded_price DECIMAL(15, 4),
    avg_traded_price DECIMAL(15, 4),
    current_value DECIMAL(18, 2),
    
    -- Previous Day Details
    prev_details JSONB DEFAULT '{}'::jsonb,
    
    -- Holdings in this Demat
    holdings JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{ issuerName, isin, isinDescription, units, lastTradedPrice, avgTradedPrice, lastFetchTime, currentValue, prevDetails, portfolioWeightagePercent }]
    
    -- Timestamps
    last_fetch_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(unique_identifier, demat_id)
);

CREATE INDEX idx_equities_demat_user ON equities_demat_accounts(unique_identifier);

-- ============================================
-- 20. EQUITIES TRANSACTIONS TABLE
-- API: /pfm/api/v2/equities/user-account-statement
-- ============================================
DROP TABLE IF EXISTS equities_transactions CASCADE;
CREATE TABLE equities_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    unique_identifier VARCHAR(50) NOT NULL,
    account_id VARCHAR(100),  -- fi_data_id
    broker_id VARCHAR(100),
    
    txn_id VARCHAR(100) UNIQUE NOT NULL,
    
    -- Stock Info
    isin VARCHAR(20),
    isin_description VARCHAR(50),
    
    -- Transaction Details
    transaction_datetime TIMESTAMP WITH TIME ZONE,
    units DECIMAL(18, 6),
    type VARCHAR(20),  -- BUY, SELL, etc.
    narration TEXT,
    nav DECIMAL(15, 4),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_equities_txn_user ON equities_transactions(unique_identifier);
CREATE INDEX idx_equities_txn_isin ON equities_transactions(isin);
CREATE INDEX idx_equities_txn_date ON equities_transactions(transaction_datetime DESC);

-- ============================================
-- ETF MODULE
-- API: /pfm/api/v2/etf/*
-- ============================================

-- ============================================
-- 21. ETF HOLDINGS TABLE
-- API: /pfm/api/v2/etf/user-linked-accounts
-- Similar structure to equities but for ETFs
-- ============================================
DROP TABLE IF EXISTS etf_holdings CASCADE;
CREATE TABLE etf_holdings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    unique_identifier VARCHAR(50) NOT NULL,
    
    -- ETF Identifiers
    isin VARCHAR(20) NOT NULL,
    issuer_name VARCHAR(255),
    isin_description VARCHAR(50),
    
    -- Holdings
    units DECIMAL(18, 6) DEFAULT 0,
    last_traded_price DECIMAL(15, 4),
    avg_traded_price DECIMAL(15, 4),
    current_value DECIMAL(18, 2),
    
    -- NAV
    nav DECIMAL(15, 4),
    nav_date DATE,
    
    -- Portfolio Weight
    portfolio_weightage_percent DECIMAL(8, 4),
    
    -- Previous Day Details
    prev_details JSONB DEFAULT '{}'::jsonb,
    
    -- Broker-wise breakdown
    brokers JSONB DEFAULT '[]'::jsonb,
    
    -- Timestamps
    last_fetch_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(unique_identifier, isin)
);

CREATE INDEX idx_etf_holdings_user ON etf_holdings(unique_identifier);
CREATE INDEX idx_etf_holdings_isin ON etf_holdings(isin);

-- ============================================
-- 22. ETF INSIGHTS TABLE
-- API: /pfm/api/v2/etf/insights
-- ============================================
DROP TABLE IF EXISTS etf_insights CASCADE;
CREATE TABLE etf_insights (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    unique_identifier VARCHAR(50) UNIQUE NOT NULL,
    
    -- Summary
    current_value DECIMAL(18, 2) DEFAULT 0,
    total_holdings INTEGER DEFAULT 0,
    total_demats INTEGER DEFAULT 0,
    
    -- Returns Summary
    returns_summary JSONB DEFAULT '{}'::jsonb,
    -- Structure: { dailyReturns, dailyReturnsPercentage }
    
    -- Demat-wise Distribution
    demat_wise_distribution JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{ dematId, brokerName, brokerCode, totalHoldings, currentValue, dematValuePercentage, returnsSummary, holdingsInsights }]
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_etf_insights_user ON etf_insights(unique_identifier);

-- ============================================
-- 23. ETF TRANSACTIONS TABLE
-- API: /pfm/api/v2/etf/user-account-statement
-- ============================================
DROP TABLE IF EXISTS etf_transactions CASCADE;
CREATE TABLE etf_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    unique_identifier VARCHAR(50) NOT NULL,
    account_id VARCHAR(100),
    broker_id VARCHAR(100),
    
    txn_id VARCHAR(100) UNIQUE NOT NULL,
    
    -- ETF Info
    isin VARCHAR(20),
    isin_description VARCHAR(50),
    
    -- Transaction Details
    transaction_datetime TIMESTAMP WITH TIME ZONE,
    units DECIMAL(18, 6),
    type VARCHAR(20),
    narration TEXT,
    nav DECIMAL(15, 4),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_etf_txn_user ON etf_transactions(unique_identifier);
CREATE INDEX idx_etf_txn_isin ON etf_transactions(isin);
CREATE INDEX idx_etf_txn_date ON etf_transactions(transaction_datetime DESC);

-- ============================================
-- COMBINED EQUITIES + ETF
-- API: /pfm/api/v2/equities-and-etfs/*
-- ============================================

-- ============================================
-- 24. EQUITIES_ETF COMBINED DEMAT HOLDINGS TABLE
-- API: /pfm/api/v2/equities-and-etfs/user-linked-accounts/demat-holding
-- ============================================
DROP TABLE IF EXISTS equities_etf_demat_holdings CASCADE;
CREATE TABLE equities_etf_demat_holdings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    unique_identifier VARCHAR(50) NOT NULL,
    
    -- Demat Info
    demat_id VARCHAR(100) NOT NULL,
    broker_name VARCHAR(255),
    broker_code VARCHAR(50),
    
    -- Aggregated Values
    current_value DECIMAL(18, 2),
    
    -- Equity Holdings
    equity_holdings JSONB DEFAULT '[]'::jsonb,
    
    -- ETF Holdings
    etf_holdings JSONB DEFAULT '[]'::jsonb,
    
    -- Timestamps
    last_fetch_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(unique_identifier, demat_id)
);

CREATE INDEX idx_eq_etf_demat_user ON equities_etf_demat_holdings(unique_identifier);

-- ============================================
-- NPS MODULE
-- API: /pfm/api/v2/nps/*
-- ============================================

-- ============================================
-- 25. NPS ACCOUNTS TABLE
-- API: /pfm/api/v2/nps/user-linked-accounts
-- ============================================
DROP TABLE IF EXISTS nps_accounts CASCADE;
CREATE TABLE nps_accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    linked_account_id UUID REFERENCES linked_accounts(id) ON DELETE CASCADE,
    unique_identifier VARCHAR(50) NOT NULL,
    fi_data_id VARCHAR(100) UNIQUE NOT NULL,
    
    -- FIP Info
    fip_id VARCHAR(100),
    fip_name VARCHAR(255),
    
    -- PRAN Details
    masked_pran_id VARCHAR(30),
    holder_pran_id VARCHAR(20),
    
    -- Holder Details
    holder_name VARCHAR(255),
    holder_dob DATE,
    holder_mobile VARCHAR(15),
    holder_email VARCHAR(255),
    holder_pan VARCHAR(10),
    holder_address TEXT,
    holder_landline VARCHAR(20),
    holder_nominee VARCHAR(255),
    holder_ckyc_compliance BOOLEAN DEFAULT FALSE,
    
    -- Account Value
    account_current_value DECIMAL(18, 2) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_nps_accounts_user ON nps_accounts(unique_identifier);

-- ============================================
-- CONSENT MODULE
-- API: /pfm/api/v2/account-consents-latest
-- ============================================

-- ============================================
-- 26. ACCOUNT CONSENTS TABLE
-- ============================================
DROP TABLE IF EXISTS account_consents CASCADE;
CREATE TABLE account_consents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    unique_identifier VARCHAR(50) NOT NULL,
    account_id VARCHAR(100) NOT NULL,  -- fi_data_id
    
    -- Consent Details
    consent_id VARCHAR(100),
    consent_handle VARCHAR(100),
    consent_status VARCHAR(30) CHECK (consent_status IN ('PENDING', 'ACTIVE', 'PAUSED', 'REVOKED', 'EXPIRED', 'READY')),
    
    -- FIP Info
    fip_id VARCHAR(100),
    
    -- FI Types covered
    fi_types TEXT[] DEFAULT '{}',
    
    -- Consent Period
    consent_start TIMESTAMP WITH TIME ZONE,
    consent_expiry TIMESTAMP WITH TIME ZONE,
    
    -- Fetch Configuration
    fetch_type VARCHAR(30),  -- PERIODIC, ONETIME
    frequency_unit VARCHAR(20),  -- HOUR, DAY, WEEK, MONTH, YEAR
    frequency_value INTEGER,
    
    -- Data Retention
    data_life_unit VARCHAR(20),
    data_life_value INTEGER,
    
    -- Purpose
    purpose_code VARCHAR(100),
    purpose_text TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(unique_identifier, account_id, consent_id)
);

CREATE INDEX idx_consents_user ON account_consents(unique_identifier);
CREATE INDEX idx_consents_account ON account_consents(account_id);
CREATE INDEX idx_consents_status ON account_consents(consent_status);

-- ============================================
-- FI REQUEST MODULE
-- API: /pfm/api/v2/firequest-user, /pfm/api/v2/firequest-account
-- ============================================

-- ============================================
-- 27. FI REQUESTS TABLE
-- ============================================
DROP TABLE IF EXISTS fi_requests CASCADE;
CREATE TABLE fi_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    unique_identifier VARCHAR(50) NOT NULL,
    account_id VARCHAR(100),  -- fi_data_id (optional, for account-level requests)
    
    -- Request Details
    request_id VARCHAR(100),
    request_type VARCHAR(30),  -- USER, ACCOUNT
    
    -- Status
    status VARCHAR(30),
    
    -- Request/Response Data
    request_data JSONB,
    response_data JSONB,
    
    -- Timestamps
    requested_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_fi_requests_user ON fi_requests(unique_identifier);
CREATE INDEX idx_fi_requests_account ON fi_requests(account_id);

-- ============================================
-- CONSENT REQUEST MODULE
-- API: /pfm/api/v1/submit-consent-request, /pfm/api/v2/submit-consent-request-plus
-- ============================================

-- ============================================
-- 28. CONSENT REQUESTS TABLE
-- ============================================
DROP TABLE IF EXISTS consent_requests CASCADE;
CREATE TABLE consent_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    unique_identifier VARCHAR(50) NOT NULL,
    
    -- Request Info
    aa_cust_id VARCHAR(100),  -- e.g., "8956545791@finvu"
    template_name VARCHAR(100),  -- e.g., "BANK_STATEMENT_PERIODIC"
    user_session_id VARCHAR(100),
    redirect_url TEXT,
    
    -- Response
    consent_url TEXT,  -- URL to redirect user for consent approval
    
    -- Status
    status VARCHAR(30) DEFAULT 'INITIATED',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_consent_requests_user ON consent_requests(unique_identifier);

-- ============================================
-- ACCOUNT DELINK
-- API: /pfm/api/v2/user-account-delink
-- ============================================

-- ============================================
-- 29. ACCOUNT DELINK HISTORY TABLE
-- ============================================
DROP TABLE IF EXISTS account_delink_history CASCADE;
CREATE TABLE account_delink_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    unique_identifier VARCHAR(50) NOT NULL,
    account_id VARCHAR(100) NOT NULL,
    
    -- Status
    success BOOLEAN DEFAULT FALSE,
    message TEXT,
    
    -- Timestamps
    delinked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_delink_history_user ON account_delink_history(unique_identifier);

-- ============================================
-- HELPER VIEWS
-- ============================================

-- ============================================
-- View: User Portfolio Summary
-- Aggregates all FI data for a user
-- ============================================
CREATE OR REPLACE VIEW user_portfolio_summary AS
SELECT 
    u.unique_identifier,
    u.mobile_number,
    u.pan,
    u.subscription_status,
    COALESCE(SUM(CASE WHEN fds.fi_type = 'DEPOSIT' THEN fds.current_balance ELSE 0 END), 0) as deposit_balance,
    COALESCE(SUM(CASE WHEN fds.fi_type = 'TERM_DEPOSIT' THEN fds.current_value ELSE 0 END), 0) as term_deposit_value,
    COALESCE(SUM(CASE WHEN fds.fi_type = 'RECURRING_DEPOSIT' THEN fds.current_value ELSE 0 END), 0) as rd_value,
    COALESCE(SUM(CASE WHEN fds.fi_type = 'MUTUAL_FUNDS' THEN fds.current_value ELSE 0 END), 0) as mf_value,
    COALESCE(SUM(CASE WHEN fds.fi_type = 'EQUITIES' THEN fds.current_value ELSE 0 END), 0) as equities_value,
    COALESCE(SUM(CASE WHEN fds.fi_type = 'ETF' THEN fds.current_value ELSE 0 END), 0) as etf_value,
    COALESCE(SUM(CASE WHEN fds.fi_type = 'NPS' THEN fds.current_value ELSE 0 END), 0) as nps_value,
    COALESCE(SUM(fds.current_value), 0) + COALESCE(SUM(CASE WHEN fds.fi_type = 'DEPOSIT' THEN fds.current_balance ELSE 0 END), 0) as total_portfolio_value
FROM users u
LEFT JOIN fi_data_summary fds ON u.unique_identifier = fds.unique_identifier
GROUP BY u.unique_identifier, u.mobile_number, u.pan, u.subscription_status;

-- ============================================
-- DONE! Schema created successfully
-- ============================================

SELECT 'WealthScape API Schema created successfully!' as status;
