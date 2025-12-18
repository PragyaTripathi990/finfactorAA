-- ============================================
-- Quick Test Queries for Manual Testing
-- Copy and paste these in Supabase SQL Editor
-- ============================================

-- ============================================
-- TEST 1: Check if Tables Exist
-- ============================================
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN (
    'tsp_providers',
    'aa_gateways',
    'app_users',
    'fips',
    'fi_accounts',
    'fi_account_holders_pii',
    'fi_deposit_summaries',
    'fi_recurring_deposit_summaries',
    'fi_mutual_fund_holdings',
    'fi_equity_holdings'
  )
ORDER BY table_name;

-- Expected: Should return 10 rows (all tables exist)

-- ============================================
-- TEST 2: Check Record Counts
-- ============================================
SELECT 
  'app_users' as table_name, COUNT(*) as record_count FROM app_users
UNION ALL
SELECT 'fips', COUNT(*) FROM fips
UNION ALL
SELECT 'fi_accounts', COUNT(*) FROM fi_accounts
UNION ALL
SELECT 'fi_account_holders_pii', COUNT(*) FROM fi_account_holders_pii
UNION ALL
SELECT 'fi_deposit_summaries', COUNT(*) FROM fi_deposit_summaries
UNION ALL
SELECT 'fi_recurring_deposit_summaries', COUNT(*) FROM fi_recurring_deposit_summaries
UNION ALL
SELECT 'fi_mutual_fund_holdings', COUNT(*) FROM fi_mutual_fund_holdings
UNION ALL
SELECT 'fi_equity_holdings', COUNT(*) FROM fi_equity_holdings;

-- Expected: Should show record counts (not all 0)

-- ============================================
-- TEST 3: Check if Missing Columns Exist
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'fi_accounts'
  AND column_name IN (
    'account_branch',
    'account_ifsc_code',
    'account_status',
    'account_current_balance',
    'account_currency'
  )
ORDER BY column_name;

-- Expected: Should return 5 rows if migration was run, 0 rows if not

-- ============================================
-- TEST 4: Check NULL Fields in fi_accounts
-- ============================================
SELECT 
  COUNT(*) as total_accounts,
  COUNT(account_branch) as has_branch,
  COUNT(account_ifsc_code) as has_ifsc,
  COUNT(account_status) as has_status,
  COUNT(account_current_balance) as has_balance,
  -- Calculate missing
  COUNT(*) - COUNT(account_branch) as missing_branch,
  COUNT(*) - COUNT(account_ifsc_code) as missing_ifsc,
  COUNT(*) - COUNT(account_status) as missing_status,
  COUNT(*) - COUNT(account_current_balance) as missing_balance
FROM fi_accounts
WHERE fi_type = 'DEPOSIT';

-- Expected: 
-- If migration NOT run: Will error (columns don't exist)
-- If migration run but seed NOT updated: missing_branch = total_accounts (all NULL)
-- If both done: missing_branch should be 0 or low

-- ============================================
-- TEST 5: Check Account Holders
-- ============================================
SELECT 
  COUNT(*) as total_holders,
  COUNT(name) as has_name,
  COUNT(pan) as has_pan,
  COUNT(dob) as has_dob,
  COUNT(mobile) as has_mobile,
  COUNT(email) as has_email
FROM fi_account_holders_pii;

-- Expected: 
-- If no data: total_holders = 0
-- If data exists: has_name, has_pan should be > 0

-- ============================================
-- TEST 6: Check Equity Holdings Symbols
-- ============================================
SELECT 
  COUNT(*) as total_equities,
  COUNT(bse_symbol) as has_bse,
  COUNT(nse_symbol) as has_nse,
  COUNT(market_cap_category) as has_market_cap,
  COUNT(*) - COUNT(bse_symbol) as missing_bse,
  COUNT(*) - COUNT(nse_symbol) as missing_nse
FROM fi_equity_holdings;

-- Expected:
-- If migration NOT run: Will error (columns don't exist)
-- If migration run: Should show counts

-- ============================================
-- TEST 7: Sample Data Check
-- ============================================
-- Check one deposit account
SELECT 
  id,
  masked_acc_no,
  provider_name,
  fi_type,
  account_branch,
  account_ifsc_code,
  account_status,
  account_current_balance
FROM fi_accounts
WHERE fi_type = 'DEPOSIT'
LIMIT 1;

-- Expected: Should return 1 row with data (or NULLs if not populated)

-- ============================================
-- TEST 8: Check RD Details
-- ============================================
SELECT 
  COUNT(*) as total_rd,
  COUNT(interest_rate) as has_interest_rate,
  COUNT(maturity_date) as has_maturity_date,
  COUNT(recurring_amount) as has_recurring_amount,
  COUNT(tenure_months) as has_tenure
FROM fi_recurring_deposit_summaries;

-- Expected: Should show counts (may be 0 if no RD data)

-- ============================================
-- TEST 9: Check MF Holdings
-- ============================================
SELECT 
  COUNT(*) as total_mf,
  COUNT(isin) as has_isin,
  COUNT(units) as has_units,
  COUNT(nav) as has_nav,
  COUNT(current_value) as has_value,
  COUNT(prev_details) as has_prev_details
FROM fi_mutual_fund_holdings;

-- Expected: Should show counts

-- ============================================
-- TEST 10: Complete Account with Holder Info
-- ============================================
SELECT 
  a.id,
  a.masked_acc_no,
  a.provider_name,
  a.account_branch,
  a.account_ifsc_code,
  a.account_status,
  h.name as holder_name,
  h.pan as holder_pan,
  h.dob as holder_dob,
  h.mobile as holder_mobile
FROM fi_accounts a
LEFT JOIN fi_account_holders_pii h ON h.account_id = a.id
WHERE a.fi_type = 'DEPOSIT'
LIMIT 5;

-- Expected: Should show accounts with holder info (if stored)

-- ============================================
-- TEST 11: Check FIPs Data
-- ============================================
SELECT 
  COUNT(*) as total_fips,
  COUNT(fip_code) as has_code,
  COUNT(name) as has_name,
  COUNT(type) as has_type,
  COUNT(fi_types) as has_fi_types
FROM fips
LIMIT 10;

-- Expected: Should show FIPs with data

-- ============================================
-- TEST 12: Error Check - Foreign Keys
-- ============================================
-- Check if all foreign keys are valid
SELECT 
  'fi_accounts' as table_name,
  COUNT(*) as total,
  COUNT(user_id) as has_user_id,
  COUNT(fip_id) as has_fip_id
FROM fi_accounts
WHERE user_id NOT IN (SELECT id FROM app_users)
   OR fip_id NOT IN (SELECT id FROM fips);

-- Expected: Should return 0 rows (no orphaned records)

-- ============================================
-- DONE! Run these tests one by one
-- ============================================

