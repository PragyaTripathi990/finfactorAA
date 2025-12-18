-- =====================================================
-- MANUAL SCHEMA TESTING QUERIES
-- =====================================================
-- Run these queries in Supabase SQL Editor to test
-- what data is in your database vs what should be there
-- =====================================================

-- =====================================================
-- 1. CHECK IF ALL TABLES EXIST
-- =====================================================

SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            'tsp_providers', 'aa_gateways', 'app_users', 'app_integration_apps',
            'tsp_auth_tokens', 'tsp_api_calls', 'aa_consent_requests',
            'aa_redirect_events', 'aa_consents', 'aa_consent_events',
            'aa_data_fetch_runs', 'aa_fetch_payloads', 'fips',
            'fi_accounts', 'fi_account_holders_pii', 'fi_transactions',
            'fi_deposit_summaries', 'fi_recurring_deposit_summaries',
            'fi_term_deposit_summaries', 'fi_mutual_fund_summaries',
            'fi_mutual_fund_holdings', 'fi_mutual_fund_txn_details',
            'fi_equity_summaries', 'fi_equity_holdings', 'fi_equity_txn_details',
            'user_financial_snapshots'
        ) THEN '✅ Expected'
        ELSE '⚠️ Extra Table'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =====================================================
-- 2. CHECK COLUMN COUNT PER TABLE
-- =====================================================

SELECT 
    table_name,
    COUNT(*) as column_count,
    CASE 
        WHEN table_name = 'tsp_providers' AND COUNT(*) = 8 THEN '✅ Expected (8)'
        WHEN table_name = 'aa_gateways' AND COUNT(*) = 8 THEN '✅ Expected (8)'
        WHEN table_name = 'app_users' AND COUNT(*) = 6 THEN '⚠️ Expected 5, got 6 (unique_identifier added)'
        WHEN table_name = 'fi_accounts' AND COUNT(*) >= 16 THEN '⚠️ Expected 16, got ' || COUNT(*) || ' (extra fields added)'
        ELSE 'Check manually'
    END as status
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;

-- =====================================================
-- 3. CHECK FOR EXTRA COLUMNS (Not in Original DBML)
-- =====================================================

-- Check app_users for extra columns
SELECT 
    'app_users' as table_name,
    column_name,
    data_type,
    CASE 
        WHEN column_name = 'unique_identifier' THEN '⚠️ EXTRA - Added for API compatibility'
        ELSE '✅ Original'
    END as status
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'app_users'
ORDER BY column_name;

-- Check fi_accounts for extra columns
SELECT 
    'fi_accounts' as table_name,
    column_name,
    data_type,
    CASE 
        WHEN column_name IN ('account_ref_number', 'link_ref_number', 'link_status', 'consent_id_list', 'fip_name') 
            THEN '⚠️ EXTRA - Added from API'
        ELSE '✅ Original'
    END as status
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'fi_accounts'
ORDER BY column_name;

-- Check fips for extra columns
SELECT 
    'fips' as table_name,
    column_name,
    data_type,
    CASE 
        WHEN column_name IN ('fip_id', 'product_types', 'aa_identifier') 
            THEN '⚠️ EXTRA - Added from API'
        ELSE '✅ Original'
    END as status
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'fips'
ORDER BY column_name;

-- =====================================================
-- 4. CHECK DATA POPULATION STATUS
-- =====================================================

SELECT 
    'tsp_providers' as table_name,
    COUNT(*) as record_count,
    CASE WHEN COUNT(*) > 0 THEN '✅ Has Data' ELSE '❌ Empty' END as status
FROM tsp_providers
UNION ALL
SELECT 
    'aa_gateways',
    COUNT(*),
    CASE WHEN COUNT(*) > 0 THEN '✅ Has Data' ELSE '❌ Empty' END
FROM aa_gateways
UNION ALL
SELECT 
    'app_users',
    COUNT(*),
    CASE WHEN COUNT(*) > 0 THEN '✅ Has Data' ELSE '❌ Empty' END
FROM app_users
UNION ALL
SELECT 
    'fips',
    COUNT(*),
    CASE WHEN COUNT(*) > 0 THEN '✅ Has Data' ELSE '❌ Empty' END
FROM fips
UNION ALL
SELECT 
    'fi_accounts',
    COUNT(*),
    CASE WHEN COUNT(*) > 0 THEN '✅ Has Data' ELSE '❌ Empty' END
FROM fi_accounts
UNION ALL
SELECT 
    'fi_transactions',
    COUNT(*),
    CASE WHEN COUNT(*) > 0 THEN '✅ Has Data' ELSE '❌ Empty' END
FROM fi_transactions
UNION ALL
SELECT 
    'fi_mutual_fund_holdings',
    COUNT(*),
    CASE WHEN COUNT(*) > 0 THEN '✅ Has Data' ELSE '❌ Empty' END
FROM fi_mutual_fund_holdings
UNION ALL
SELECT 
    'fi_equity_holdings',
    COUNT(*),
    CASE WHEN COUNT(*) > 0 THEN '✅ Has Data' ELSE '❌ Empty' END
FROM fi_equity_holdings
ORDER BY table_name;

-- =====================================================
-- 5. CHECK FOR NULL COLUMNS (Unused Fields)
-- =====================================================

-- Check fi_accounts for always-NULL columns
SELECT 
    column_name,
    COUNT(*) as total_rows,
    COUNT(column_name) as non_null_count,
    COUNT(*) - COUNT(column_name) as null_count,
    CASE 
        WHEN COUNT(column_name) = 0 THEN '❌ Always NULL - Consider removing'
        WHEN COUNT(column_name) < COUNT(*) * 0.1 THEN '⚠️ Mostly NULL - Review'
        ELSE '✅ Has Data'
    END as status
FROM (
    SELECT 
        id, user_id, consent_id, fetch_run_id, fip_id, fi_type,
        fip_account_type, fip_account_sub_type, aa_linked_ref,
        masked_acc_no, provider_name, version, account_ref_hash,
        account_ref_number, link_ref_number, link_status,
        consent_id_list, fip_name, last_seen_at
    FROM fi_accounts
    LIMIT 100
) t
CROSS JOIN LATERAL (
    VALUES 
        ('user_id', t.user_id),
        ('consent_id', t.consent_id),
        ('fetch_run_id', t.fetch_run_id),
        ('fip_id', t.fip_id),
        ('fip_account_type', t.fip_account_type),
        ('fip_account_sub_type', t.fip_account_sub_type),
        ('aa_linked_ref', t.aa_linked_ref),
        ('version', t.version),
        ('link_ref_number', t.link_ref_number),
        ('link_status', t.link_status),
        ('consent_id_list', t.consent_id_list)
) AS cols(column_name, column_value)
GROUP BY column_name
ORDER BY null_count DESC;

-- =====================================================
-- 6. CHECK FOREIGN KEY RELATIONSHIPS
-- =====================================================

SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    CASE 
        WHEN tc.table_name IS NOT NULL THEN '✅ Relationship Exists'
        ELSE '❌ Missing'
    END as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- 7. CHECK INDEXES
-- =====================================================

SELECT
    tablename,
    indexname,
    indexdef,
    CASE 
        WHEN indexname LIKE 'idx_%' THEN '✅ Custom Index'
        WHEN indexname LIKE '%_pkey' THEN '✅ Primary Key'
        WHEN indexname LIKE '%_key' THEN '✅ Unique Constraint'
        ELSE '⚠️ Other'
    END as status
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- =====================================================
-- 8. SAMPLE DATA CHECK (Verify Data Quality)
-- =====================================================

-- Check sample fi_accounts data
SELECT 
    'fi_accounts' as table_name,
    fi_type,
    COUNT(*) as count,
    COUNT(DISTINCT fip_id) as unique_fips,
    COUNT(DISTINCT user_id) as unique_users,
    MIN(created_at) as first_record,
    MAX(created_at) as last_record
FROM fi_accounts
GROUP BY fi_type
ORDER BY fi_type;

-- Check sample transactions
SELECT 
    'fi_transactions' as table_name,
    txn_type,
    COUNT(*) as count,
    SUM(amount) as total_amount,
    MIN(txn_timestamp) as first_txn,
    MAX(txn_timestamp) as last_txn
FROM fi_transactions
GROUP BY txn_type
ORDER BY count DESC
LIMIT 10;

-- =====================================================
-- 9. CHECK FOR MISSING REQUIRED FIELDS FROM API
-- =====================================================
-- Compare with SCHEMA_ANALYSIS_REPORT.md

-- Check if we have fields that API sends but schema doesn't have
-- (This is a manual check - compare with the report)

SELECT 
    'Fields API sends but schema missing:' as check_type,
    'See SCHEMA_ANALYSIS_REPORT.md section "API Fields NOT in Schema"' as note;

-- Common missing fields from API:
-- fi_accounts: fiDataId, dataFetched, lastFetchDateTime, fiRequestCountOfCurrentMonth
-- fi_accounts: latestConsentPurposeText, latestConsentExpiryTime, consentPurposeVersion

-- =====================================================
-- 10. COMPARE ORIGINAL DBML vs CURRENT SCHEMA
-- =====================================================

-- Get all columns for a specific table to compare
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'fi_accounts'  -- Change table name as needed
ORDER BY ordinal_position;

-- =====================================================
-- QUICK SUMMARY QUERY
-- =====================================================

SELECT 
    '📊 SCHEMA TEST SUMMARY' as summary,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tables,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public') as total_columns,
    (SELECT COUNT(*) FROM tsp_providers) as tsp_providers_count,
    (SELECT COUNT(*) FROM app_users) as app_users_count,
    (SELECT COUNT(*) FROM fi_accounts) as fi_accounts_count,
    (SELECT COUNT(*) FROM fi_transactions) as fi_transactions_count;

