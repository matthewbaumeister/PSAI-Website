-- DSIP Smart Search Database Schema
-- This schema stores all DSIP opportunities and search functionality

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Main DSIP opportunities table
CREATE TABLE dsip_opportunities (
    id BIGSERIAL PRIMARY KEY,
    topic_number VARCHAR(100),
    topic_id BIGINT,
    title TEXT,
    short_title VARCHAR(255),
    component VARCHAR(100),
    component_full_name TEXT,
    command_name VARCHAR(100),
    program VARCHAR(100),
    program_type VARCHAR(100),
    solicitation_title TEXT,
    solicitation_number VARCHAR(100),
    cycle_name VARCHAR(100),
    release_number VARCHAR(100),
    solicitation_phase VARCHAR(100),
    status VARCHAR(100),
    topic_status VARCHAR(100),
    proposal_window_status VARCHAR(100),
    days_until_close INTEGER,
    days_since_open INTEGER,
    urgency_level VARCHAR(100),
    open_date DATE,
    close_date DATE,
    open_datetime TIMESTAMP,
    close_datetime TIMESTAMP,
    duration_days INTEGER,
    pre_release_start DATE,
    pre_release_end DATE,
    pre_release_duration INTEGER,
    created_date DATE,
    updated_date DATE,
    modified_date DATE,
    last_activity_date DATE,
    qanda_start DATE,
    qanda_end DATE,
    qanda_tpoc_start DATE,
    qanda_tpoc_end DATE,
    qanda_status VARCHAR(100),
    qanda_status_display VARCHAR(100),
    qanda_open BOOLEAN,
    qanda_window_active BOOLEAN,
    days_until_qanda_close INTEGER,
    total_questions INTEGER,
    published_questions INTEGER,
    unpublished_questions INTEGER,
    qanda_response_rate DECIMAL(5,2),
    has_qa BOOLEAN,
    qa_data TEXT,
    qanda_content TEXT,
    qanda_last_updated DATE,
    technology_areas TEXT[],
    technology_areas_count INTEGER,
    primary_technology_area VARCHAR(255),
    tech_modernization_details TEXT,
    modernization_priorities TEXT[],
    modernization_priority_count INTEGER,
    keywords TEXT[],
    keywords_count INTEGER,
    primary_keyword VARCHAR(255),
    itar_controlled VARCHAR(10),
    requires_itar BOOLEAN,
    security_export VARCHAR(100),
    security_clearance_required TEXT,
    objective TEXT,
    objective_word_count INTEGER,
    key_requirements TEXT,
    description TEXT,
    description_word_count INTEGER,
    description_length INTEGER,
    has_technical_details BOOLEAN,
    is_xtech BOOLEAN,
    is_xtech_analysis BOOLEAN,
    prize_gating VARCHAR(10),
    competition_type VARCHAR(100),
    phase_i_description TEXT,
    phase_ii_description TEXT,
    phase_iii_dual_use TEXT,
    has_commercial_potential BOOLEAN,
    references_data TEXT[],
    reference_docs TEXT,
    reference_count INTEGER,
    has_references BOOLEAN,
    phase VARCHAR(100),
    phases_available TEXT,
    phase_types TEXT[],
    phase_count INTEGER,
    is_direct_to_phase_ii BOOLEAN,
    phase_funding_text TEXT,
    funding_max_text TEXT,
    award_amount_phase_i DECIMAL(15,2),
    award_amount_phase_ii DECIMAL(15,2),
    award_duration_phase_i INTEGER,
    award_duration_phase_ii INTEGER,
    total_potential_award DECIMAL(15,2),
    funding_type VARCHAR(100),
    topic_pdf_download TEXT,
    pdf_link TEXT,
    solicitation_instructions_download TEXT,
    solicitation_instructions_url TEXT,
    component_instructions_download TEXT,
    component_instructions_url TEXT,
    has_pdf BOOLEAN,
    has_solicitation_instructions BOOLEAN,
    has_component_instructions BOOLEAN,
    solicitation_instructions_version VARCHAR(255),
    component_instructions_version VARCHAR(255),
    tpoc_topic_managers TEXT,
    tpoc_names TEXT[],
    tpoc_emails TEXT[],
    tpoc_centers TEXT[],
    tpoc_count INTEGER,
    has_tpoc BOOLEAN,
    show_tpoc BOOLEAN,
    tpoc_email_domain VARCHAR(255),
    owner VARCHAR(255),
    internal_lead VARCHAR(255),
    sponsor_component VARCHAR(255),
    evaluation_weights TEXT,
    selection_criteria TEXT,
    has_evaluation_criteria BOOLEAN,
    historical_awards TEXT,
    previous_awards_count INTEGER,
    success_rate DECIMAL(5,2),
    competition_level VARCHAR(100),
    year INTEGER,
    solicitation_year INTEGER,
    program_year INTEGER,
    fiscal_year INTEGER,
    quarter INTEGER,
    baa_preface_upload_id VARCHAR(255),
    baa_preface_title TEXT,
    is_release_preface BOOLEAN,
    baa_instruction_files TEXT[],
    baa_files_count INTEGER,
    has_baa_instructions BOOLEAN,
    applicable_actions TEXT[],
    actions_count INTEGER,
    is_active BOOLEAN,
    is_archived BOOLEAN,
    is_draft BOOLEAN,
    is_published BOOLEAN,
    allow_proposal_submission BOOLEAN,
    is_open_for_submission BOOLEAN,
    proposal_requirements TEXT,
    submission_instructions TEXT,
    eligibility_requirements TEXT,
    has_special_requirements BOOLEAN,
    information_quality INTEGER,
    data_completeness_score DECIMAL(5,2),
    last_scraped TIMESTAMP,
    search_tags TEXT[],
    category_tags TEXT[],
    priority_score INTEGER,
    relevance_score INTEGER,
    record_id VARCHAR(100),
    unique_id VARCHAR(255),
    tracking_number VARCHAR(255),
    version INTEGER,
    imported_at TIMESTAMP DEFAULT NOW(),
    
    -- Additional fields for enhanced functionality
    search_vector tsvector,
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better search performance
CREATE INDEX idx_dsip_opportunities_status ON dsip_opportunities(status);
CREATE INDEX idx_dsip_opportunities_component ON dsip_opportunities(component);
CREATE INDEX idx_dsip_opportunities_program ON dsip_opportunities(program);
CREATE INDEX idx_dsip_opportunities_phase ON dsip_opportunities(phase);
CREATE INDEX idx_dsip_opportunities_open_date ON dsip_opportunities(open_date);
CREATE INDEX idx_dsip_opportunities_close_date ON dsip_opportunities(close_date);
CREATE INDEX idx_dsip_opportunities_is_active ON dsip_opportunities(is_active);
CREATE INDEX idx_dsip_opportunities_is_open_for_submission ON dsip_opportunities(is_open_for_submission);
CREATE INDEX idx_dsip_opportunities_technology_areas ON dsip_opportunities USING GIN(technology_areas);
CREATE INDEX idx_dsip_opportunities_keywords ON dsip_opportunities USING GIN(keywords);
CREATE INDEX idx_dsip_opportunities_search_tags ON dsip_opportunities USING GIN(search_tags);
CREATE INDEX idx_dsip_opportunities_category_tags ON dsip_opportunities USING GIN(category_tags);

-- Full-text search index
CREATE INDEX idx_dsip_opportunities_search_vector ON dsip_opportunities USING GIN(search_vector);

-- Create a function to update the search vector
CREATE OR REPLACE FUNCTION update_dsip_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.objective, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.key_requirements, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.keywords, ' '), '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.technology_areas, ' '), '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.component_full_name, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.command_name, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search vector
CREATE TRIGGER dsip_search_vector_update
    BEFORE INSERT OR UPDATE ON dsip_opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_dsip_search_vector();

-- User saved searches table
CREATE TABLE dsip_saved_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    search_criteria JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User favorite opportunities table
CREATE TABLE dsip_user_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    opportunity_id BIGINT REFERENCES dsip_opportunities(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, opportunity_id)
);

-- Search analytics table
CREATE TABLE dsip_search_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    search_query TEXT,
    search_filters JSONB,
    results_count INTEGER,
    search_duration_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Scraping logs table
CREATE TABLE dsip_scraping_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status VARCHAR(50) NOT NULL,
    records_processed INTEGER DEFAULT 0,
    new_records_found INTEGER DEFAULT 0,
    updated_records INTEGER DEFAULT 0,
    errors TEXT[],
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    duration_seconds INTEGER
);

-- Create indexes for user tables
CREATE INDEX idx_dsip_saved_searches_user_id ON dsip_saved_searches(user_id);
CREATE INDEX idx_dsip_user_favorites_user_id ON dsip_user_favorites(user_id);
CREATE INDEX idx_dsip_user_favorites_opportunity_id ON dsip_user_favorites(opportunity_id);
CREATE INDEX idx_dsip_search_analytics_user_id ON dsip_search_analytics(user_id);
CREATE INDEX idx_dsip_search_analytics_created_at ON dsip_search_analytics(created_at);

-- Enable Row Level Security
ALTER TABLE dsip_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE dsip_saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE dsip_user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE dsip_search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE dsip_scraping_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dsip_opportunities (public read access)
CREATE POLICY "Public read access to DSIP opportunities" ON dsip_opportunities
    FOR SELECT USING (true);

-- RLS Policies for user-specific tables
CREATE POLICY "Users can manage their own saved searches" ON dsip_saved_searches
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own favorites" ON dsip_user_favorites
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own search analytics" ON dsip_search_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create search analytics" ON dsip_search_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for scraping logs (admin only)
CREATE POLICY "Admin access to scraping logs" ON dsip_scraping_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'isAdmin' = 'true'
        )
    );

-- Grant permissions
GRANT SELECT ON dsip_opportunities TO authenticated;
GRANT ALL ON dsip_saved_searches TO authenticated;
GRANT ALL ON dsip_user_favorites TO authenticated;
GRANT SELECT, INSERT ON dsip_search_analytics TO authenticated;
GRANT ALL ON dsip_scraping_logs TO authenticated;

-- Create a function to get search statistics
CREATE OR REPLACE FUNCTION get_dsip_search_stats()
RETURNS TABLE(
    total_opportunities BIGINT,
    active_opportunities BIGINT,
    open_opportunities BIGINT,
    prerelease_opportunities BIGINT,
    total_components BIGINT,
    total_programs BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_opportunities,
        COUNT(*) FILTER (WHERE is_active = true)::BIGINT as active_opportunities,
        COUNT(*) FILTER (WHERE is_open_for_submission = true)::BIGINT as open_opportunities,
        COUNT(*) FILTER (WHERE status = 'Prerelease')::BIGINT as prerelease_opportunities,
        COUNT(DISTINCT component)::BIGINT as total_components,
        COUNT(DISTINCT program)::BIGINT as total_programs
    FROM dsip_opportunities;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to search opportunities with filters
CREATE OR REPLACE FUNCTION search_dsip_opportunities(
    search_query TEXT DEFAULT '',
    status_filter TEXT[] DEFAULT NULL,
    component_filter TEXT[] DEFAULT NULL,
    program_filter TEXT[] DEFAULT NULL,
    phase_filter TEXT[] DEFAULT NULL,
    technology_areas_filter TEXT[] DEFAULT NULL,
    keywords_filter TEXT[] DEFAULT NULL,
    itar_filter BOOLEAN DEFAULT NULL,
    is_xtech_filter BOOLEAN DEFAULT NULL,
    min_funding DECIMAL DEFAULT NULL,
    max_funding DECIMAL DEFAULT NULL,
    open_date_from DATE DEFAULT NULL,
    open_date_to DATE DEFAULT NULL,
    close_date_from DATE DEFAULT NULL,
    close_date_to DATE DEFAULT NULL,
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
    id BIGINT,
    title TEXT,
    component VARCHAR(100),
    program VARCHAR(100),
    status VARCHAR(100),
    phase VARCHAR(100),
    open_date DATE,
    close_date DATE,
    total_potential_award DECIMAL(15,2),
    technology_areas TEXT[],
    keywords TEXT[],
    has_qa BOOLEAN,
    is_xtech BOOLEAN,
    requires_itar BOOLEAN,
    search_rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.title,
        o.component,
        o.program,
        o.status,
        o.phase,
        o.open_date,
        o.close_date,
        o.total_potential_award,
        o.technology_areas,
        o.keywords,
        o.has_qa,
        o.is_xtech,
        o.requires_itar,
        ts_rank(o.search_vector, plainto_tsquery('english', search_query)) as search_rank
    FROM dsip_opportunities o
    WHERE 
        (search_query = '' OR o.search_vector @@ plainto_tsquery('english', search_query))
        AND (status_filter IS NULL OR o.status = ANY(status_filter))
        AND (component_filter IS NULL OR o.component = ANY(component_filter))
        AND (program_filter IS NULL OR o.program = ANY(program_filter))
        AND (phase_filter IS NULL OR o.phase = ANY(phase_filter))
        AND (technology_areas_filter IS NULL OR o.technology_areas && technology_areas_filter)
        AND (keywords_filter IS NULL OR o.keywords && keywords_filter)
        AND (itar_filter IS NULL OR o.requires_itar = itar_filter)
        AND (is_xtech_filter IS NULL OR o.is_xtech = is_xtech_filter)
        AND (min_funding IS NULL OR o.total_potential_award >= min_funding)
        AND (max_funding IS NULL OR o.total_potential_award <= max_funding)
        AND (open_date_from IS NULL OR o.open_date >= open_date_from)
        AND (open_date_to IS NULL OR o.open_date <= open_date_to)
        AND (close_date_from IS NULL OR o.close_date >= close_date_from)
        AND (close_date_to IS NULL OR o.close_date <= close_date_to)
    ORDER BY 
        CASE WHEN search_query != '' THEN search_rank ELSE 0 END DESC,
        o.open_date DESC NULLS LAST,
        o.close_date ASC NULLS LAST
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_dsip_search_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION search_dsip_opportunities(TEXT, TEXT[], TEXT[], TEXT[], TEXT[], TEXT[], TEXT[], BOOLEAN, BOOLEAN, DECIMAL, DECIMAL, DATE, DATE, DATE, DATE, INTEGER, INTEGER) TO authenticated;
