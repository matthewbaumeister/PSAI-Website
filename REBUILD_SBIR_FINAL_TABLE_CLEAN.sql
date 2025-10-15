-- ===========================================================
-- CLEAN REBUILD: sbir_final table with modern schema
-- Only columns that are actually used by the scraper
-- Proper data types (INTEGER, BOOLEAN, TIMESTAMPTZ, etc.)
-- ===========================================================

-- Drop old table (backup first if needed!)
DROP TABLE IF EXISTS sbir_final CASCADE;

-- Create new clean table
CREATE TABLE sbir_final (
    id BIGSERIAL PRIMARY KEY,
    
    -- ========================================
    -- CORE IDENTIFICATION
    -- ========================================
    topic_number TEXT NOT NULL,
    topic_id TEXT NOT NULL,
    title TEXT NOT NULL,
    short_title TEXT,
    record_id TEXT,
    unique_id TEXT,
    
    -- ========================================
    -- COMPONENT & PROGRAM
    -- ========================================
    component TEXT,
    component_full_name TEXT,
    command TEXT,
    program TEXT,
    program_type TEXT,
    
    -- ========================================
    -- SOLICITATION INFO
    -- ========================================
    solicitation_title TEXT,
    solicitation_number TEXT,
    cycle_name TEXT,
    release_number TEXT,
    solicitation_phase TEXT,
    
    -- ========================================
    -- STATUS
    -- ========================================
    status TEXT,
    proposal_window_status TEXT,
    urgency_level TEXT,
    
    -- ========================================
    -- DATES (with proper types!)
    -- ========================================
    open_date TEXT,
    close_date TEXT,
    open_date_ts TIMESTAMPTZ,
    close_date_ts TIMESTAMPTZ,
    pre_release_start TEXT,
    pre_release_end TEXT,
    created_date TEXT,
    updated_date TEXT,
    modified_date TEXT,
    last_activity_date TIMESTAMPTZ,
    last_scraped TIMESTAMPTZ DEFAULT NOW(),
    
    -- Date calculations (integers)
    days_until_close INTEGER,
    days_since_open INTEGER,
    duration_days INTEGER,
    pre_release_duration INTEGER,
    
    -- ========================================
    -- Q&A INFORMATION
    -- ========================================
    qa_start TEXT,
    qa_end TEXT,
    qa_status TEXT,
    qa_open BOOLEAN,
    qa_window_active BOOLEAN,
    total_questions INTEGER,
    published_questions INTEGER,
    qa_response_rate_percentage INTEGER,
    days_until_qa_close INTEGER,
    qa_content TEXT,
    qa_content_fetched BOOLEAN DEFAULT FALSE,
    qa_last_updated TIMESTAMPTZ,
    
    -- ========================================
    -- TECHNOLOGY & KEYWORDS
    -- ========================================
    technology_areas TEXT,
    technology_areas_count INTEGER,
    primary_technology_area TEXT,
    modernization_priorities TEXT,
    modernization_priority_count INTEGER,
    keywords TEXT,
    keywords_count INTEGER,
    primary_keyword TEXT,
    
    -- ========================================
    -- SECURITY & COMPLIANCE
    -- ========================================
    itar_controlled BOOLEAN DEFAULT FALSE,
    security_export TEXT,
    
    -- ========================================
    -- DESCRIPTIONS (with proper organization)
    -- ========================================
    objective TEXT,
    objective_word_count INTEGER,
    
    description TEXT,
    description_word_count INTEGER,
    description_length INTEGER,
    
    description_consolidated TEXT, -- All descriptions combined for search
    
    phase_i_description TEXT,
    phase_ii_description TEXT,
    phase_iii_description TEXT,
    
    -- ========================================
    -- xTECH & COMPETITION
    -- ========================================
    is_xtech BOOLEAN DEFAULT FALSE,
    prize_gating BOOLEAN DEFAULT FALSE,
    competition_type TEXT,
    
    -- ========================================
    -- REFERENCES & DOCUMENTS
    -- ========================================
    reference_docs TEXT,
    reference_count INTEGER,
    baa_instruction_files TEXT,
    
    -- ========================================
    -- PHASE INFORMATION
    -- ========================================
    phases_available TEXT,
    is_direct_to_phase_ii BOOLEAN DEFAULT FALSE,
    
    -- ========================================
    -- FUNDING (estimated amounts)
    -- ========================================
    award_amount_phase_i DECIMAL(15,2),
    award_amount_phase_ii DECIMAL(15,2),
    award_duration_phase_i INTEGER,
    award_duration_phase_ii INTEGER,
    funding_max_text TEXT,
    total_potential_award DECIMAL(15,2),
    
    -- ========================================
    -- PDF & DOWNLOADS
    -- ========================================
    topic_pdf_download TEXT,
    pdf_link TEXT,
    solicitation_instructions_download TEXT,
    component_instructions_download TEXT,
    solicitation_instructions_version TEXT,
    component_instructions_version TEXT,
    
    -- ========================================
    -- TPOC (Technical Point of Contact)
    -- ========================================
    tpoc_names TEXT,
    tpoc_emails TEXT,
    tpoc_centers TEXT,
    tpoc_count INTEGER,
    tpoc_email_domain TEXT,
    show_tpoc BOOLEAN DEFAULT FALSE,
    
    -- ========================================
    -- ADDITIONAL METADATA
    -- ========================================
    owner TEXT,
    internal_lead TEXT,
    sponsor_component TEXT,
    selection_criteria TEXT,
    proposal_requirements TEXT,
    submission_instructions TEXT,
    eligibility_requirements TEXT,
    historical_awards TEXT,
    previous_awards_count INTEGER,
    success_rate DECIMAL(5,2),
    
    -- ========================================
    -- ACTIONS & FLAGS
    -- ========================================
    applicable_actions TEXT,
    is_active BOOLEAN,
    is_archived BOOLEAN,
    is_draft BOOLEAN,
    is_published BOOLEAN,
    allow_proposal_submission BOOLEAN,
    
    -- ========================================
    -- METADATA
    -- ========================================
    year INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- ========================================
    -- CONSTRAINTS
    -- ========================================
    CONSTRAINT unique_topic_cycle UNIQUE (topic_number, cycle_name)
);

-- ===========================================================
-- INDEXES for Performance
-- ===========================================================

-- Core search indexes
CREATE INDEX idx_sbir_topic_number ON sbir_final(topic_number);
CREATE INDEX idx_sbir_component ON sbir_final(component);
CREATE INDEX idx_sbir_status ON sbir_final(status);
CREATE INDEX idx_sbir_program_type ON sbir_final(program_type);

-- Date indexes for sorting
CREATE INDEX idx_sbir_open_date_ts ON sbir_final(open_date_ts);
CREATE INDEX idx_sbir_close_date_ts ON sbir_final(close_date_ts);
CREATE INDEX idx_sbir_last_scraped ON sbir_final(last_scraped DESC);

-- Full-text search index for title and keywords
CREATE INDEX idx_sbir_title_trgm ON sbir_final USING GIN (title gin_trgm_ops);
CREATE INDEX idx_sbir_keywords_trgm ON sbir_final USING GIN (keywords gin_trgm_ops);

-- Boolean filters
CREATE INDEX idx_sbir_is_xtech ON sbir_final(is_xtech) WHERE is_xtech = TRUE;
CREATE INDEX idx_sbir_itar ON sbir_final(itar_controlled) WHERE itar_controlled = TRUE;

-- Composite index for common queries
CREATE INDEX idx_sbir_component_status ON sbir_final(component, status);

-- ===========================================================
-- Enable Row Level Security (RLS)
-- ===========================================================

ALTER TABLE sbir_final ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access
CREATE POLICY "Allow public read access" 
ON sbir_final FOR SELECT 
USING (true);

-- Policy: Allow authenticated users to insert/update
CREATE POLICY "Allow authenticated insert/update" 
ON sbir_final FOR ALL 
USING (auth.role() = 'authenticated');

-- ===========================================================
-- Refresh Supabase schema cache
-- ===========================================================

NOTIFY pgrst, 'reload schema';

-- ===========================================================
-- Verify Table Structure
-- ===========================================================

SELECT 
    COUNT(*) as total_columns,
    COUNT(CASE WHEN data_type = 'integer' THEN 1 END) as integer_columns,
    COUNT(CASE WHEN data_type = 'boolean' THEN 1 END) as boolean_columns,
    COUNT(CASE WHEN data_type = 'timestamp with time zone' THEN 1 END) as timestamp_columns,
    COUNT(CASE WHEN data_type = 'text' THEN 1 END) as text_columns
FROM information_schema.columns
WHERE table_name = 'sbir_final';

-- List all columns
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'sbir_final'
ORDER BY ordinal_position;

