-- =====================================================
-- FIX ALL UNIQUE CONSTRAINTS
-- =====================================================
-- Run this in Supabase SQL Editor

-- Fix fi_accounts (account_ref_hash unique constraint)
CREATE UNIQUE INDEX IF NOT EXISTS idx_fi_accounts_hash 
ON fi_accounts(account_ref_hash) 
WHERE account_ref_hash IS NOT NULL;

-- Fix fi_deposit_summaries (account_id unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_fi_deposit_summaries_account_unique 
ON fi_deposit_summaries(account_id);

-- Fix fi_term_deposit_summaries (account_id unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_fi_term_deposit_summaries_account_unique 
ON fi_term_deposit_summaries(account_id);

-- Fix fi_recurring_deposit_summaries (account_id unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_fi_recurring_deposit_summaries_account_unique 
ON fi_recurring_deposit_summaries(account_id);

-- Fix fi_mutual_fund_summaries (account_id unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_fi_mutual_fund_summaries_account_unique 
ON fi_mutual_fund_summaries(account_id);

-- Fix fi_equity_summaries (account_id unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_fi_equity_summaries_account_unique 
ON fi_equity_summaries(account_id);

-- Fix fi_transactions (account_id, dedupe_hash unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_fi_transactions_dedupe 
ON fi_transactions(account_id, dedupe_hash) 
WHERE dedupe_hash IS NOT NULL;

-- Fix fi_mutual_fund_holdings (account_id, holding_hash unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_fi_mutual_fund_holdings_hash 
ON fi_mutual_fund_holdings(account_id, holding_hash) 
WHERE holding_hash IS NOT NULL;

-- Fix fi_equity_holdings (account_id, holding_hash unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_fi_equity_holdings_hash 
ON fi_equity_holdings(account_id, holding_hash) 
WHERE holding_hash IS NOT NULL;

-- Fix fi_etf_holdings (account_id, holding_hash unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_fi_etf_holdings_hash 
ON fi_etf_holdings(account_id, holding_hash) 
WHERE holding_hash IS NOT NULL;

-- Verify indexes created
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes 
WHERE schemaname = 'public' 
AND (
  indexname LIKE '%_hash' 
  OR indexname LIKE '%_unique'
  OR indexname LIKE '%_dedupe'
)
ORDER BY tablename;

