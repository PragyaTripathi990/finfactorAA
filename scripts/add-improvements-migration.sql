-- =====================================================================
-- MIGRATION: Add Improvements to Existing Schema
-- =====================================================================
-- Run this AFTER deploying comprehensive-schema.sql
-- This adds missing fields and indexes from IMPROVED_SCHEMA
-- =====================================================================

-- =====================================================================
-- 1. ADD MISSING FIELDS TO EXISTING TABLES
-- =====================================================================

-- App Users: Add subscription fields
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ;

-- FI Accounts: Add fip_id_str (string version of FIP ID)
ALTER TABLE fi_accounts 
ADD COLUMN IF NOT EXISTS fip_id_str VARCHAR(100);

-- FI Transactions: Add missing fields
ALTER TABLE fi_transactions 
ADD COLUMN IF NOT EXISTS transaction_timestamp TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_balance NUMERIC(18,2),
ADD COLUMN IF NOT EXISTS sub_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS merchant_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS merchant_category VARCHAR(100);

-- FI Deposit Summaries: Add missing fields
ALTER TABLE fi_deposit_summaries 
ADD COLUMN IF NOT EXISTS available_balance NUMERIC(18,2),
ADD COLUMN IF NOT EXISTS last_fetch_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ifsc_code VARCHAR(20);

-- AA Fetch Payloads: Ensure raw_payload exists (CRITICAL)
ALTER TABLE aa_fetch_payloads 
ADD COLUMN IF NOT EXISTS raw_payload JSONB;

-- User Financial Snapshots: Add missing value fields
ALTER TABLE user_financial_snapshots 
ADD COLUMN IF NOT EXISTS total_net_worth NUMERIC(18,2),
ADD COLUMN IF NOT EXISTS deposits_value NUMERIC(18,2),
ADD COLUMN IF NOT EXISTS term_deposits_value NUMERIC(18,2),
ADD COLUMN IF NOT EXISTS recurring_deposits_value NUMERIC(18,2),
ADD COLUMN IF NOT EXISTS mutual_funds_value NUMERIC(18,2),
ADD COLUMN IF NOT EXISTS equities_value NUMERIC(18,2),
ADD COLUMN IF NOT EXISTS etf_value NUMERIC(18,2),
ADD COLUMN IF NOT EXISTS nps_value NUMERIC(18,2),
ADD COLUMN IF NOT EXISTS total_accounts INTEGER,
ADD COLUMN IF NOT EXISTS last_fetch_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS snapshot_at TIMESTAMPTZ;

-- FI NPS Holdings: Add missing fields
ALTER TABLE fi_nps_holdings 
ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES app_users(id),
ADD COLUMN IF NOT EXISTS pran VARCHAR(20),
ADD COLUMN IF NOT EXISTS scheme_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS scheme_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS pfm_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS tier1_value NUMERIC(18,2),
ADD COLUMN IF NOT EXISTS tier2_value NUMERIC(18,2),
ADD COLUMN IF NOT EXISTS fip_name VARCHAR(255);

-- =====================================================================
-- 2. ADD MISSING INDEXES
-- =====================================================================

-- FI Accounts indexes
CREATE INDEX IF NOT EXISTS idx_fi_accounts_fi_data_id ON fi_accounts(fi_data_id);
CREATE INDEX IF NOT EXISTS idx_fi_accounts_account_ref ON fi_accounts(account_ref_number);
CREATE INDEX IF NOT EXISTS idx_fi_accounts_ref_hash ON fi_accounts(account_ref_hash);

-- FI Transactions indexes
CREATE INDEX IF NOT EXISTS idx_fi_transactions_account_time ON fi_transactions(account_id, transaction_timestamp);
CREATE INDEX IF NOT EXISTS idx_fi_transactions_account_txn_time ON fi_transactions(account_id, txn_timestamp);

-- FIPs indexes
CREATE INDEX IF NOT EXISTS idx_fips_fip_id ON fips(fip_id);

-- Brokers indexes
CREATE INDEX IF NOT EXISTS idx_brokers_broker_id ON brokers(broker_id);

-- AA Fetch Payloads indexes
CREATE INDEX IF NOT EXISTS idx_aa_fetch_payloads_run_role ON aa_fetch_payloads(fetch_run_id, payload_role);
CREATE INDEX IF NOT EXISTS idx_aa_fetch_payloads_fip ON aa_fetch_payloads(fip_id, fi_type);

-- =====================================================================
-- 3. VERIFY MIGRATION
-- =====================================================================

-- Check if all new columns exist
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND (
    (table_name = 'app_users' AND column_name IN ('subscription_status', 'subscription_start_date', 'subscription_end_date'))
    OR (table_name = 'fi_accounts' AND column_name = 'fip_id_str')
    OR (table_name = 'fi_transactions' AND column_name IN ('transaction_timestamp', 'current_balance', 'sub_category'))
    OR (table_name = 'fi_deposit_summaries' AND column_name IN ('available_balance', 'last_fetch_time', 'ifsc_code'))
    OR (table_name = 'aa_fetch_payloads' AND column_name = 'raw_payload')
)
ORDER BY table_name, column_name;

-- Expected: Should show all new columns

