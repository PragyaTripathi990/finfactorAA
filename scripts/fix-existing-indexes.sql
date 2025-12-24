-- =====================================================================
-- Fix Existing Indexes - Run this BEFORE comprehensive-schema.sql
-- =====================================================================
-- This drops indexes that might already exist
-- Run this in Supabase SQL Editor first, then run comprehensive-schema.sql
-- =====================================================================

-- Drop indexes that might already exist
DROP INDEX IF EXISTS idx_app_users_unique_id;
DROP INDEX IF EXISTS idx_tsp_auth_tokens_integration;
DROP INDEX IF EXISTS idx_tsp_auth_tokens_expires;
DROP INDEX IF EXISTS idx_tsp_api_calls_user;
DROP INDEX IF EXISTS idx_tsp_api_calls_endpoint;
DROP INDEX IF EXISTS idx_tsp_api_calls_called_at;
DROP INDEX IF EXISTS idx_aa_consent_requests_user;
DROP INDEX IF EXISTS idx_aa_consent_requests_handle;
DROP INDEX IF EXISTS idx_aa_redirect_events_request;
DROP INDEX IF EXISTS idx_aa_consents_request;
DROP INDEX IF EXISTS idx_aa_consents_status;
DROP INDEX IF EXISTS idx_aa_consents_expiry;
DROP INDEX IF EXISTS idx_aa_consent_events_consent;
DROP INDEX IF EXISTS idx_aa_data_fetch_runs_consent;
DROP INDEX IF EXISTS idx_aa_fetch_payloads_run;
DROP INDEX IF EXISTS idx_fips_fip_id;
DROP INDEX IF EXISTS idx_fi_accounts_user;
DROP INDEX IF EXISTS idx_fi_accounts_fip;
DROP INDEX IF EXISTS idx_fi_accounts_fi_data_id;

-- Drop all indexes (if you want to start completely fresh)
-- Uncomment below if you want to drop ALL indexes:
/*
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname NOT LIKE 'pg_%'
    ) 
    LOOP
        EXECUTE 'DROP INDEX IF EXISTS ' || quote_ident(r.indexname) || ' CASCADE';
    END LOOP;
END $$;
*/

SELECT 'Indexes dropped. Now run comprehensive-schema.sql' as message;



