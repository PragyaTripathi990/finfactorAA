-- =====================================================================
-- SAFE SCHEMA - Handles existing objects gracefully
-- =====================================================================
-- This version uses IF NOT EXISTS for all objects
-- Run this if you get "already exists" errors
-- =====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing indexes if they exist (optional - comment out if you want to keep them)
-- Uncomment the lines below if you want to recreate indexes
/*
DO $$ 
BEGIN
    DROP INDEX IF EXISTS idx_app_users_unique_id;
    DROP INDEX IF EXISTS idx_tsp_auth_tokens_integration;
    -- Add more DROP statements as needed
END $$;
*/

-- Now run the comprehensive-schema.sql
-- It will use IF NOT EXISTS for all CREATE statements

-- OR: If you want to start fresh, run this first:
/*
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all tables in reverse dependency order
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename) 
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;
*/



