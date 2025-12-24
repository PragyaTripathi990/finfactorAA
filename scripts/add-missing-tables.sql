-- =====================================================
-- ADD MISSING TABLES: brokers & fi_mf_holdings
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. BROKERS TABLE (Master list of brokers)
CREATE TABLE IF NOT EXISTS brokers (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broker_id               VARCHAR(100) UNIQUE NOT NULL,
    broker_name             VARCHAR(255) NOT NULL,
    code                    VARCHAR(50),
    enable                  VARCHAR(10) DEFAULT 'true',
    entity_icon_uri         TEXT,
    entity_logo_uri         TEXT,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brokers_name ON brokers(broker_name);

-- 2. FI_MF_HOLDINGS TABLE (Mutual Fund Holdings)
CREATE TABLE IF NOT EXISTS fi_mf_holdings (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    
    -- Holding details
    folio_number            VARCHAR(100),
    scheme_name             VARCHAR(500) NOT NULL,
    scheme_code             VARCHAR(100),
    isin                    VARCHAR(20),
    amc_name                VARCHAR(255),
    fund_type               VARCHAR(100),
    
    -- Values
    units                   DECIMAL(18, 6) DEFAULT 0,
    nav                     DECIMAL(18, 4) DEFAULT 0,
    current_value           DECIMAL(18, 2) DEFAULT 0,
    invested_value          DECIMAL(18, 2) DEFAULT 0,
    returns_absolute        DECIMAL(18, 2) DEFAULT 0,
    returns_percent         DECIMAL(10, 4) DEFAULT 0,
    
    -- Source
    fip_name                VARCHAR(255),
    last_fetch_time         TIMESTAMPTZ,
    
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mf_holdings_user ON fi_mf_holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_mf_holdings_scheme ON fi_mf_holdings(scheme_name);

-- =====================================================
-- VERIFY TABLES CREATED
-- =====================================================
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('brokers', 'fi_mf_holdings');
