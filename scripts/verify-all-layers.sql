-- =====================================================================
-- VERIFICATION QUERIES - Check All Layers Are Filled
-- =====================================================================
-- Run these queries after data ingestion to verify all layers
-- =====================================================================

-- =====================================================================
-- 1. CHECK SCHEMA DEPLOYMENT
-- =====================================================================

SELECT 
    'Schema Check' as check_type,
    COUNT(*) as total_tables,
    COUNT(CASE WHEN table_name LIKE 'tsp_%' OR table_name LIKE 'aa_%' OR table_name LIKE 'app_%' OR table_name LIKE 'mfc_%' THEN 1 END) as layer_a_tables,
    COUNT(CASE WHEN table_name LIKE 'fi_account%' OR table_name LIKE 'fi_transaction%' OR table_name = 'fips' OR table_name = 'brokers' THEN 1 END) as layer_b_tables,
    COUNT(CASE WHEN table_name LIKE 'fi_%_summaries' OR table_name LIKE 'fi_%_holdings' OR table_name LIKE 'user_financial_snapshots' OR table_name LIKE 'fi_%_insights' THEN 1 END) as layer_c_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- =====================================================================
-- 2. CHECK LAYER A (Raw Payloads)
-- =====================================================================

SELECT 
    'Layer A: Raw Payloads' as layer,
    COUNT(*) as total_payloads,
    COUNT(DISTINCT fetch_run_id) as unique_fetch_runs,
    COUNT(DISTINCT fi_type) as fi_types_covered,
    MIN(created_at) as first_payload,
    MAX(created_at) as latest_payload
FROM aa_fetch_payloads;

-- Check if raw_payload has data
SELECT 
    'Layer A: Raw Payload Content' as check_type,
    COUNT(*) as payloads_with_data,
    COUNT(CASE WHEN raw_payload IS NOT NULL THEN 1 END) as payloads_not_null,
    COUNT(CASE WHEN jsonb_typeof(raw_payload) = 'object' THEN 1 END) as valid_json_objects
FROM aa_fetch_payloads;

-- =====================================================================
-- 3. CHECK LAYER B (Canonical Data)
-- =====================================================================

SELECT 
    'Layer B: Accounts' as table_name,
    COUNT(*) as record_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT fi_type) as fi_types,
    COUNT(DISTINCT fip_id) as unique_fips
FROM fi_accounts
UNION ALL
SELECT 
    'Layer B: Transactions',
    COUNT(*),
    COUNT(DISTINCT account_id),
    NULL,
    NULL
FROM fi_transactions
UNION ALL
SELECT 
    'Layer B: Account Holders',
    COUNT(*),
    COUNT(DISTINCT account_id),
    NULL,
    NULL
FROM fi_account_holders_pii
UNION ALL
SELECT 
    'Layer B: FIPs',
    COUNT(*),
    NULL,
    NULL,
    NULL
FROM fips
UNION ALL
SELECT 
    'Layer B: Brokers',
    COUNT(*),
    NULL,
    NULL,
    NULL
FROM brokers;

-- =====================================================================
-- 4. CHECK LAYER C (Summaries)
-- =====================================================================

SELECT 
    'Layer C: Deposit Summaries' as table_name,
    COUNT(*) as record_count,
    COUNT(DISTINCT account_id) as unique_accounts,
    SUM(current_balance) as total_balance
FROM fi_deposit_summaries
UNION ALL
SELECT 
    'Layer C: Term Deposit Summaries',
    COUNT(*),
    COUNT(DISTINCT account_id),
    SUM(current_balance)
FROM fi_term_deposit_summaries
UNION ALL
SELECT 
    'Layer C: Recurring Deposit Summaries',
    COUNT(*),
    COUNT(DISTINCT account_id),
    SUM(current_balance)
FROM fi_recurring_deposit_summaries
UNION ALL
SELECT 
    'Layer C: MF Summaries',
    COUNT(*),
    COUNT(DISTINCT account_id),
    SUM(current_value)
FROM fi_mutual_fund_summaries
UNION ALL
SELECT 
    'Layer C: Equity Summaries',
    COUNT(*),
    COUNT(DISTINCT account_id),
    SUM(current_value)
FROM fi_equity_summaries;

-- =====================================================================
-- 5. CHECK LAYER C (Holdings)
-- =====================================================================

SELECT 
    'Layer C: MF Holdings' as table_name,
    COUNT(*) as record_count,
    COUNT(DISTINCT account_id) as unique_accounts,
    SUM(current_value) as total_value
FROM fi_mutual_fund_holdings
UNION ALL
SELECT 
    'Layer C: Equity Holdings',
    COUNT(*),
    COUNT(DISTINCT account_id),
    SUM(current_value)
FROM fi_equity_holdings
UNION ALL
SELECT 
    'Layer C: ETF Holdings',
    COUNT(*),
    COUNT(DISTINCT account_id),
    SUM(current_value)
FROM fi_etf_holdings
UNION ALL
SELECT 
    'Layer C: NPS Holdings',
    COUNT(*),
    COUNT(DISTINCT user_id),
    SUM(current_value)
FROM fi_nps_holdings;

-- =====================================================================
-- 6. COMPLETE LAYER STATUS SUMMARY
-- =====================================================================

WITH layer_a AS (
    SELECT COUNT(*) as count FROM aa_fetch_payloads
),
layer_b AS (
    SELECT 
        (SELECT COUNT(*) FROM fi_accounts) +
        (SELECT COUNT(*) FROM fi_transactions) +
        (SELECT COUNT(*) FROM fi_account_holders_pii) +
        (SELECT COUNT(*) FROM fips) +
        (SELECT COUNT(*) FROM brokers) as count
),
layer_c AS (
    SELECT 
        (SELECT COUNT(*) FROM fi_deposit_summaries) +
        (SELECT COUNT(*) FROM fi_term_deposit_summaries) +
        (SELECT COUNT(*) FROM fi_recurring_deposit_summaries) +
        (SELECT COUNT(*) FROM fi_mutual_fund_summaries) +
        (SELECT COUNT(*) FROM fi_equity_summaries) +
        (SELECT COUNT(*) FROM fi_mutual_fund_holdings) +
        (SELECT COUNT(*) FROM fi_equity_holdings) +
        (SELECT COUNT(*) FROM fi_etf_holdings) +
        (SELECT COUNT(*) FROM fi_nps_holdings) +
        COALESCE((SELECT COUNT(*) FROM user_financial_snapshots), 0) as count
)
SELECT 
    'Layer A (Raw Payloads)' as layer,
    la.count as record_count,
    CASE 
        WHEN la.count > 0 THEN '✅ Filled' 
        ELSE '❌ Empty - No raw payloads stored' 
    END as status,
    'Stores complete API responses' as description
FROM layer_a la
UNION ALL
SELECT 
    'Layer B (Canonical Data)',
    lb.count,
    CASE 
        WHEN lb.count > 0 THEN '✅ Filled' 
        ELSE '❌ Empty - No accounts/transactions stored' 
    END,
    'Stores normalized financial facts'
FROM layer_b lb
UNION ALL
SELECT 
    'Layer C (Derived Data)',
    lc.count,
    CASE 
        WHEN lc.count > 0 THEN '✅ Filled' 
        ELSE '❌ Empty - No summaries/holdings computed' 
    END,
    'Stores computed summaries and holdings'
FROM layer_c lc;

-- =====================================================================
-- 7. DATA FLOW VERIFICATION
-- =====================================================================

-- Check if fetch runs exist
SELECT 
    'Fetch Runs' as check_type,
    COUNT(*) as total_runs,
    COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
    COUNT(CASE WHEN status = 'INITIATED' THEN 1 END) as initiated,
    COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed
FROM aa_data_fetch_runs;

-- Check data linkage
SELECT 
    'Data Linkage' as check_type,
    (SELECT COUNT(*) FROM aa_data_fetch_runs) as fetch_runs,
    (SELECT COUNT(*) FROM aa_fetch_payloads) as raw_payloads,
    (SELECT COUNT(*) FROM fi_accounts WHERE fetch_run_id IS NOT NULL) as accounts_linked,
    (SELECT COUNT(*) FROM fi_transactions WHERE fetch_run_id IS NOT NULL) as transactions_linked
;

-- =====================================================================
-- 8. SAMPLE DATA CHECK
-- =====================================================================

-- Sample raw payload
SELECT 
    'Sample Raw Payload' as check_type,
    id,
    fetch_run_id,
    fi_type,
    jsonb_typeof(raw_payload) as payload_type,
    created_at
FROM aa_fetch_payloads
ORDER BY created_at DESC
LIMIT 1;

-- Sample account
SELECT 
    'Sample Account' as check_type,
    id,
    account_ref_number,
    fi_type,
    fip_name,
    created_at
FROM fi_accounts
ORDER BY created_at DESC
LIMIT 1;

-- Sample summary
SELECT 
    'Sample Summary' as check_type,
    id,
    account_id,
    current_balance,
    created_at
FROM fi_deposit_summaries
ORDER BY created_at DESC
LIMIT 1;

