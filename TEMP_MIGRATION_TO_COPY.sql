-- ============================================
-- Congressional Stock Trades Integration
-- ============================================
-- 
-- Tracks stock trades by members of Congress
-- Data source: Official House & Senate disclosures
-- Covers: 2012-present (electronic filing era)
-- 
-- Key use cases:
--   - Correlate trades with DoD contract awards
--   - Identify defense stock purchases by committee members
--   - Track trading patterns before major announcements
-- 
-- ============================================

-- Main trades table
CREATE TABLE IF NOT EXISTS congressional_stock_trades (
    id BIGSERIAL PRIMARY KEY,
    
    -- Member information
    member_name VARCHAR(255) NOT NULL,
    chamber VARCHAR(10) NOT NULL CHECK (chamber IN ('House', 'Senate')),
    
    -- Transaction details
    transaction_date DATE NOT NULL,
    disclosure_date DATE NOT NULL,
    ticker VARCHAR(20),  -- NULL if not a publicly traded stock
    asset_description TEXT NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('purchase', 'sale', 'exchange', 'unknown')),
    amount_range VARCHAR(100),  -- e.g., '$15,001 - $50,000'
    
    -- Source
    filing_url TEXT,
    scraped_at TIMESTAMP DEFAULT NOW(),
    
    -- Analysis fields (populated by correlation queries)
    related_defense_contractors TEXT[],  -- Array of contractor names
    potential_conflicts BOOLEAN DEFAULT FALSE,
    
    -- Prevent duplicates
    UNIQUE(member_name, transaction_date, ticker, transaction_type)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_congress_trades_member 
    ON congressional_stock_trades(member_name);

CREATE INDEX IF NOT EXISTS idx_congress_trades_ticker 
    ON congressional_stock_trades(ticker) 
    WHERE ticker IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_congress_trades_date 
    ON congressional_stock_trades(transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_congress_trades_chamber 
    ON congressional_stock_trades(chamber);

CREATE INDEX IF NOT EXISTS idx_congress_trades_type 
    ON congressional_stock_trades(transaction_type);

-- Composite index for correlation queries
CREATE INDEX IF NOT EXISTS idx_congress_trades_ticker_date 
    ON congressional_stock_trades(ticker, transaction_date DESC) 
    WHERE ticker IS NOT NULL;

-- ============================================
-- Congressional Members Reference Table
-- ============================================
-- NOTE: This is optional - not required for basic functionality

-- Drop and recreate to avoid conflicts
DROP TABLE IF EXISTS congressional_members CASCADE;

CREATE TABLE congressional_members (
    id BIGSERIAL PRIMARY KEY,
    member_name VARCHAR(255) UNIQUE NOT NULL,  -- Changed from 'name' to 'member_name'
    chamber VARCHAR(10) CHECK (chamber IN ('House', 'Senate')),
    state VARCHAR(2),
    district VARCHAR(10),  -- For House members
    party VARCHAR(20),
    
    -- Committee assignments (JSON array)
    committees TEXT[],
    
    -- Leadership positions
    is_committee_chair BOOLEAN DEFAULT FALSE,
    committee_chair_of TEXT,
    
    -- Term information
    current_term_start DATE,
    current_term_end DATE,
    
    -- Metadata
    last_updated TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_congress_members_name 
    ON congressional_members(member_name);

CREATE INDEX idx_congress_members_chamber 
    ON congressional_members(chamber);

-- Index for committee searches (GIN for array operations)
CREATE INDEX idx_congress_members_committees 
    ON congressional_members USING GIN(committees);

-- ============================================
-- Defense-Related Stock Tickers
-- ============================================
-- Reference table for major defense contractors

CREATE TABLE IF NOT EXISTS defense_contractors_tickers (
    id BIGSERIAL PRIMARY KEY,
    ticker VARCHAR(20) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    is_prime_contractor BOOLEAN DEFAULT TRUE,
    sector VARCHAR(100),  -- e.g., 'Aerospace', 'Shipbuilding', 'IT Services'
    
    -- Metadata
    added_at TIMESTAMP DEFAULT NOW()
);

-- Populate with major defense contractors
INSERT INTO defense_contractors_tickers (ticker, company_name, is_prime_contractor, sector) VALUES
    ('LMT', 'Lockheed Martin', TRUE, 'Aerospace & Defense'),
    ('RTX', 'Raytheon Technologies', TRUE, 'Aerospace & Defense'),
    ('BA', 'Boeing', TRUE, 'Aerospace & Defense'),
    ('NOC', 'Northrop Grumman', TRUE, 'Aerospace & Defense'),
    ('GD', 'General Dynamics', TRUE, 'Aerospace & Defense'),
    ('LHX', 'L3Harris Technologies', TRUE, 'Aerospace & Defense'),
    ('HII', 'Huntington Ingalls Industries', TRUE, 'Shipbuilding'),
    ('TXT', 'Textron', TRUE, 'Aerospace & Defense'),
    ('LDOS', 'Leidos Holdings', TRUE, 'IT Services & Defense'),
    ('SAIC', 'Science Applications International', TRUE, 'IT Services & Defense'),
    ('CACI', 'CACI International', TRUE, 'IT Services & Defense'),
    ('KTOS', 'Kratos Defense & Security', TRUE, 'Defense Technology'),
    ('PLTR', 'Palantir Technologies', TRUE, 'Defense Software'),
    ('ASTS', 'AST SpaceMobile', FALSE, 'Space Technology'),
    ('RKLB', 'Rocket Lab', FALSE, 'Space Launch'),
    ('SPCE', 'Virgin Galactic', FALSE, 'Space Tourism'),
    ('MSFT', 'Microsoft', FALSE, 'Cloud & Defense IT'),
    ('AMZN', 'Amazon', FALSE, 'Cloud & Defense IT'),
    ('GOOGL', 'Alphabet/Google', FALSE, 'Cloud & Defense IT'),
    ('ORCL', 'Oracle', FALSE, 'Cloud & Defense IT')
ON CONFLICT (ticker) DO NOTHING;

-- ============================================
-- Analysis Views
-- ============================================

-- View: Defense stock trades by committee members
CREATE OR REPLACE VIEW defense_stock_trades AS
SELECT 
    t.id,
    t.member_name,
    t.chamber,
    t.transaction_date,
    t.disclosure_date,
    t.ticker,
    t.asset_description,
    t.transaction_type,
    t.amount_range,
    d.company_name,
    d.sector,
    d.is_prime_contractor,
    t.filing_url,
    -- Days between transaction and disclosure (should be <45 days per STOCK Act)
    (t.disclosure_date - t.transaction_date) as days_to_disclose
FROM congressional_stock_trades t
LEFT JOIN defense_contractors_tickers d ON d.ticker = t.ticker
WHERE t.ticker IN (SELECT ticker FROM defense_contractors_tickers)
ORDER BY t.transaction_date DESC;

-- View: Recent defense trades (last 90 days)
CREATE OR REPLACE VIEW recent_defense_trades AS
SELECT *
FROM defense_stock_trades
WHERE transaction_date >= CURRENT_DATE - INTERVAL '90 days'
ORDER BY transaction_date DESC;

-- View: Suspicious timing (trades before major contract awards)
CREATE OR REPLACE VIEW suspicious_trade_patterns AS
SELECT 
    t.member_name,
    t.chamber,
    t.transaction_date,
    t.ticker,
    t.transaction_type,
    t.amount_range,
    d.company_name,
    COUNT(*) OVER (PARTITION BY t.ticker, t.transaction_date) as concurrent_trades,
    t.filing_url
FROM congressional_stock_trades t
JOIN defense_contractors_tickers d ON d.ticker = t.ticker
WHERE t.transaction_type = 'purchase'
  AND t.transaction_date >= CURRENT_DATE - INTERVAL '1 year'
ORDER BY t.transaction_date DESC, concurrent_trades DESC;

-- ============================================
-- Congressional Stock Trades Scraper Log Table
-- ============================================

CREATE TABLE IF NOT EXISTS congressional_trades_scraper_log (
  id BIGSERIAL PRIMARY KEY,
  scrape_type TEXT NOT NULL, -- 'historical' or 'daily'
  date_range TEXT,
  
  records_found INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_errors INTEGER DEFAULT 0,
  
  status TEXT NOT NULL,
  error_message TEXT,
  
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_seconds INTEGER,
  
  CONSTRAINT congressional_trades_scraper_log_status_check 
    CHECK (status IN ('running', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_congressional_trades_scraper_log_started_at 
ON congressional_trades_scraper_log(started_at DESC);

-- ============================================
-- Summary Stats Function
-- ============================================

CREATE OR REPLACE FUNCTION get_congressional_trades_stats()
RETURNS TABLE (
    total_trades BIGINT,
    total_members BIGINT,
    defense_trades BIGINT,
    house_trades BIGINT,
    senate_trades BIGINT,
    purchases BIGINT,
    sales BIGINT,
    earliest_trade DATE,
    latest_trade DATE,
    avg_days_to_disclose NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_trades,
        COUNT(DISTINCT member_name)::BIGINT as total_members,
        COUNT(*) FILTER (WHERE ticker IN (SELECT ticker FROM defense_contractors_tickers))::BIGINT as defense_trades,
        COUNT(*) FILTER (WHERE chamber = 'House')::BIGINT as house_trades,
        COUNT(*) FILTER (WHERE chamber = 'Senate')::BIGINT as senate_trades,
        COUNT(*) FILTER (WHERE transaction_type = 'purchase')::BIGINT as purchases,
        COUNT(*) FILTER (WHERE transaction_type = 'sale')::BIGINT as sales,
        MIN(transaction_date) as earliest_trade,
        MAX(transaction_date) as latest_trade,
        AVG(disclosure_date - transaction_date)::NUMERIC as avg_days_to_disclose
    FROM congressional_stock_trades;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Correlation Query Examples
-- ============================================

-- Function to find trades before contract awards
-- NOTE: Requires fpds_contracts table to exist
CREATE OR REPLACE FUNCTION find_trades_before_contracts(
    days_before INT DEFAULT 90,
    days_after INT DEFAULT 30
)
RETURNS TABLE (
    member_name VARCHAR,
    transaction_date DATE,
    ticker VARCHAR,
    transaction_type VARCHAR,
    amount_range VARCHAR,
    contract_award_date DATE,
    contractor_name VARCHAR,
    contract_value NUMERIC,
    days_difference INT
) AS $$
BEGIN
    -- Check if fpds_contracts table exists
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' 
               AND table_name = 'fpds_contracts') THEN
        RETURN QUERY
        SELECT 
            t.member_name,
            t.transaction_date,
            t.ticker,
            t.transaction_type,
            t.amount_range,
            c.signed_date as contract_award_date,
            c.vendor_name as contractor_name,
            c.dollarsobligated as contract_value,
            (c.signed_date - t.transaction_date)::INT as days_difference
        FROM congressional_stock_trades t
        JOIN defense_contractors_tickers d ON d.ticker = t.ticker
        JOIN fpds_contracts c ON LOWER(c.vendor_name) LIKE '%' || LOWER(d.company_name) || '%'
        WHERE t.transaction_date >= c.signed_date - INTERVAL '1 day' * days_before
          AND t.transaction_date <= c.signed_date + INTERVAL '1 day' * days_after
          AND c.dollarsobligated > 10000000  -- Contracts over $10M
        ORDER BY t.transaction_date DESC, c.dollarsobligated DESC;
    ELSE
        -- Return empty result if fpds_contracts doesn't exist yet
        RETURN;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Completion Message
-- ============================================

DO $$ 
BEGIN 
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Congressional Trades Schema Created!';
    RAISE NOTICE '============================================';
    RAISE NOTICE ' ';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Install Python dependencies:';
    RAISE NOTICE '   pip install -r requirements.txt';
    RAISE NOTICE '   playwright install';
    RAISE NOTICE ' ';
    RAISE NOTICE '2. Run historical backfill (2012-present):';
    RAISE NOTICE '   npm run scrape:congress-trades:historical';
    RAISE NOTICE ' ';
    RAISE NOTICE '3. Set up daily cron job:';
    RAISE NOTICE '   npm run scrape:congress-trades:daily';
    RAISE NOTICE ' ';
    RAISE NOTICE '4. Check stats:';
    RAISE NOTICE '   SELECT * FROM get_congressional_trades_stats();';
    RAISE NOTICE ' ';
    RAISE NOTICE '============================================';
END $$;

