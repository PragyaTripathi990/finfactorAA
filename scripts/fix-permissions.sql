-- =====================================================
-- Fix Supabase Permissions for Seeding
-- =====================================================
-- 
-- This script:
-- 1. Disables RLS (Row Level Security) on seed tables
-- 2. Grants permissions to service role
-- 
-- Run this in Supabase SQL Editor AFTER running final-schema-v2.sql
-- =====================================================

-- Disable RLS on all tables (for seeding purposes)
-- You can enable RLS later with proper policies

ALTER TABLE tsp_providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE aa_gateways DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_integration_apps DISABLE ROW LEVEL SECURITY;
ALTER TABLE tsp_auth_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE tsp_api_calls DISABLE ROW LEVEL SECURITY;
ALTER TABLE aa_consent_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE aa_redirect_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE aa_consents DISABLE ROW LEVEL SECURITY;
ALTER TABLE aa_consent_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE aa_data_fetch_runs DISABLE ROW LEVEL SECURITY;
ALTER TABLE aa_fetch_payloads DISABLE ROW LEVEL SECURITY;
ALTER TABLE fips DISABLE ROW LEVEL SECURITY;
ALTER TABLE brokers DISABLE ROW LEVEL SECURITY;
ALTER TABLE fi_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE fi_account_holders_pii DISABLE ROW LEVEL SECURITY;
ALTER TABLE fi_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE fi_deposit_summaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE fi_term_deposit_summaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE fi_recurring_deposit_summaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE fi_mutual_fund_summaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE fi_mutual_fund_holdings DISABLE ROW LEVEL SECURITY;
ALTER TABLE fi_mutual_fund_txn_details DISABLE ROW LEVEL SECURITY;
ALTER TABLE fi_equity_summaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE fi_equity_holdings DISABLE ROW LEVEL SECURITY;
ALTER TABLE fi_equity_txn_details DISABLE ROW LEVEL SECURITY;
ALTER TABLE fi_etf_holdings DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_financial_snapshots DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to authenticated users (for service role)
-- This ensures the service role key can insert/update/delete

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Also grant to anon (if needed for public access later)
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Verify permissions
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'tsp_providers', 'aa_gateways', 'app_users', 
  'fi_accounts', 'fi_transactions'
)
ORDER BY tablename;

