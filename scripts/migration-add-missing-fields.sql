-- ============================================
-- Migration: Add Missing Fields from API Responses
-- Based on missing fields report from seed script
-- ============================================

-- ============================================
-- 1. FIPS TABLE - Add missing fields
-- ============================================
ALTER TABLE fips 
ADD COLUMN IF NOT EXISTS code VARCHAR(120),
ADD COLUMN IF NOT EXISTS enable BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS entity_icon_uri TEXT,
ADD COLUMN IF NOT EXISTS entity_logo_uri TEXT,
ADD COLUMN IF NOT EXISTS entity_logo_with_name_uri TEXT,
ADD COLUMN IF NOT EXISTS fi_types TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS otp_length INT;

-- Update existing records: if enable is NULL, set to is_active
UPDATE fips SET enable = is_active WHERE enable IS NULL;

-- ============================================
-- 2. FI_ACCOUNTS TABLE - Add account details
-- ============================================
ALTER TABLE fi_accounts
ADD COLUMN IF NOT EXISTS account_branch VARCHAR(255),
ADD COLUMN IF NOT EXISTS account_currency VARCHAR(10) DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS account_current_balance NUMERIC(18,2),
ADD COLUMN IF NOT EXISTS account_current_od_limit NUMERIC(18,2),
ADD COLUMN IF NOT EXISTS account_drawing_limit NUMERIC(18,2),
ADD COLUMN IF NOT EXISTS account_exchange_rate NUMERIC(18,6),
ADD COLUMN IF NOT EXISTS account_facility VARCHAR(100),
ADD COLUMN IF NOT EXISTS account_ifsc_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS account_micr_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS account_opening_date DATE,
ADD COLUMN IF NOT EXISTS account_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS fi_request_count_current_month INT DEFAULT 0;

-- ============================================
-- 3. FI_ACCOUNT_HOLDERS_PII TABLE - Add missing fields
-- ============================================
ALTER TABLE fi_account_holders_pii
ADD COLUMN IF NOT EXISTS holder_landline VARCHAR(20),
ADD COLUMN IF NOT EXISTS holder_nominee VARCHAR(255),
ADD COLUMN IF NOT EXISTS holder_type VARCHAR(50);

-- ============================================
-- 4. FI_DEPOSIT_SUMMARIES TABLE - Already has most fields
-- But let's ensure we have all account details
-- ============================================
-- Most fields already exist, but let's add any missing ones
ALTER TABLE fi_deposit_summaries
ADD COLUMN IF NOT EXISTS account_current_od_limit NUMERIC(18,2),
ADD COLUMN IF NOT EXISTS account_drawing_limit NUMERIC(18,2),
ADD COLUMN IF NOT EXISTS account_exchange_rate NUMERIC(18,6),
ADD COLUMN IF NOT EXISTS account_facility VARCHAR(100);

-- ============================================
-- 5. FI_RECURRING_DEPOSIT_SUMMARIES TABLE - Add missing fields
-- ============================================
ALTER TABLE fi_recurring_deposit_summaries
ADD COLUMN IF NOT EXISTS account_branch VARCHAR(255),
ADD COLUMN IF NOT EXISTS account_compounding_frequency VARCHAR(50),
ADD COLUMN IF NOT EXISTS account_description TEXT,
ADD COLUMN IF NOT EXISTS account_ifsc_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS account_interest_computation VARCHAR(50),
ADD COLUMN IF NOT EXISTS account_interest_on_maturity NUMERIC(18,2),
ADD COLUMN IF NOT EXISTS account_interest_payout VARCHAR(50),
ADD COLUMN IF NOT EXISTS account_interest_periodic_payout_amount NUMERIC(18,2),
ADD COLUMN IF NOT EXISTS account_principal_amount NUMERIC(18,2),
ADD COLUMN IF NOT EXISTS account_recurring_deposit_day INT,
ADD COLUMN IF NOT EXISTS account_tenure_days INT,
ADD COLUMN IF NOT EXISTS account_tenure_years INT,
ADD COLUMN IF NOT EXISTS account_term_type VARCHAR(50);

-- ============================================
-- 6. FI_MUTUAL_FUND_HOLDINGS TABLE - Add prevDetails
-- ============================================
ALTER TABLE fi_mutual_fund_holdings
ADD COLUMN IF NOT EXISTS prev_details JSONB DEFAULT '{}'::jsonb;

-- ============================================
-- 7. FI_EQUITY_HOLDINGS TABLE - Add missing fields
-- ============================================
ALTER TABLE fi_equity_holdings
ADD COLUMN IF NOT EXISTS bse_symbol VARCHAR(50),
ADD COLUMN IF NOT EXISTS nse_symbol VARCHAR(50),
ADD COLUMN IF NOT EXISTS market_cap_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS prev_details JSONB DEFAULT '{}'::jsonb;

-- ============================================
-- 8. Add indexes for new fields
-- ============================================
CREATE INDEX IF NOT EXISTS idx_fips_code ON fips(code);
CREATE INDEX IF NOT EXISTS idx_fi_accounts_status ON fi_accounts(account_status);
CREATE INDEX IF NOT EXISTS idx_fi_accounts_ifsc ON fi_accounts(account_ifsc_code);
CREATE INDEX IF NOT EXISTS idx_fi_equity_holdings_bse_symbol ON fi_equity_holdings(bse_symbol);
CREATE INDEX IF NOT EXISTS idx_fi_equity_holdings_nse_symbol ON fi_equity_holdings(nse_symbol);

-- ============================================
-- DONE! Migration completed
-- ============================================

SELECT 'Migration: Missing fields added successfully!' as status;

