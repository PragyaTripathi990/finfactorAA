-- =====================================================
-- Add Unique Constraints for Summary Tables
-- =====================================================
-- 
-- Run this AFTER running final-schema-v2.sql
-- This fixes the onConflict errors in seed script
-- =====================================================

-- Add unique constraints so upsert works properly
CREATE UNIQUE INDEX IF NOT EXISTS idx_fi_deposit_summaries_account_unique ON fi_deposit_summaries(account_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_fi_term_deposit_summaries_account_unique ON fi_term_deposit_summaries(account_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_fi_recurring_deposit_summaries_account_unique ON fi_recurring_deposit_summaries(account_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_fi_mutual_fund_summaries_account_unique ON fi_mutual_fund_summaries(account_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_fi_equity_summaries_account_unique ON fi_equity_summaries(account_id);

-- Verify
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE '%_account_unique'
ORDER BY tablename;

