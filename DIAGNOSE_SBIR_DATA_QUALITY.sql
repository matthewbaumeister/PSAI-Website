-- Diagnostic script to analyze data quality in sbir_final table
-- Run this in Supabase SQL Editor and share the results

-- ============================================================
-- PART 1: Sample Record with ALL Fields
-- ============================================================
-- This shows what data is actually populated for ONE record
SELECT *
FROM sbir_final
WHERE topic_number IS NOT NULL
LIMIT 1;

-- ============================================================
-- PART 2: Column Population Analysis
-- ============================================================
-- Shows which columns have data vs which are empty
SELECT 
    column_name,
    data_type,
    CASE 
        WHEN column_name = 'id' THEN 'SKIP'
        ELSE 'CHECK'
    END as check_status
FROM information_schema.columns
WHERE table_name = 'sbir_final'
ORDER BY column_name;

-- ============================================================
-- PART 3: Key Fields Population Count
-- ============================================================
-- Shows how many records have data in important fields
SELECT
    COUNT(*) as total_records,
    COUNT(topic_number) as has_topic_number,
    COUNT(title) as has_title,
    COUNT(component) as has_component,
    COUNT(status) as has_status,
    COUNT(open_date) as has_open_date,
    COUNT(close_date) as has_close_date,
    
    -- Technology & Keywords
    COUNT(technology_areas) as has_technology_areas,
    COUNT(keywords) as has_keywords,
    COUNT(modernization_priorities) as has_modernization_priorities,
    
    -- TPOC
    COUNT(tpoc_names) as has_tpoc_names,
    COUNT(tpoc_emails) as has_tpoc_emails,
    COUNT(tpoc_centers) as has_tpoc_centers,
    
    -- Descriptions
    COUNT(objective) as has_objective,
    COUNT(description) as has_description,
    COUNT(description_3) as has_phase_i_desc,
    COUNT(description_4) as has_phase_ii_desc,
    COUNT(description_5) as has_phase_iii_desc,
    
    -- Q&A
    COUNT(qa_content) as has_qa_content,
    COUNT(total_questions) as has_total_questions,
    COUNT(published_questions) as has_published_questions,
    
    -- References & Files
    COUNT(references_data) as has_references,
    COUNT(baa_instruction_files) as has_baa_files,
    
    -- ITAR & Security
    COUNT(itar_controlled) as has_itar_info,
    
    -- PDF Links
    COUNT(pdf_link) as has_pdf_link,
    COUNT(solicitation_instructions_download) as has_solicitation_instructions,
    
    -- xTech
    COUNT(prize_gating) as has_xtech_info,
    
    -- Timestamps
    COUNT(last_scraped) as has_last_scraped
FROM sbir_final;

-- ============================================================
-- PART 4: Sample of Key Data Points (First 3 Records)
-- ============================================================
-- Shows actual data from the most important fields
SELECT
    topic_number,
    title,
    component,
    status,
    open_date,
    close_date,
    technology_areas,
    keywords,
    modernization_priorities,
    tpoc_names,
    objective,
    CASE WHEN description IS NOT NULL THEN LEFT(description, 100) || '...' ELSE NULL END as description_preview,
    qa_content IS NOT NULL as has_qa,
    itar_controlled,
    prize_gating,
    last_scraped
FROM sbir_final
WHERE topic_number IS NOT NULL
ORDER BY last_scraped DESC
LIMIT 3;

-- ============================================================
-- PART 5: Empty/Null Column Detection
-- ============================================================
-- Identifies which columns are completely empty across all records
-- Note: This will show columns that need data

SELECT 
    'technology_areas' as field_name,
    COUNT(*) as total_records,
    COUNT(technology_areas) as populated_count,
    COUNT(*) - COUNT(technology_areas) as null_count,
    ROUND(100.0 * COUNT(technology_areas) / NULLIF(COUNT(*), 0), 1) as population_percentage
FROM sbir_final
UNION ALL
SELECT 
    'keywords',
    COUNT(*),
    COUNT(keywords),
    COUNT(*) - COUNT(keywords),
    ROUND(100.0 * COUNT(keywords) / NULLIF(COUNT(*), 0), 1)
FROM sbir_final
UNION ALL
SELECT 
    'modernization_priorities',
    COUNT(*),
    COUNT(modernization_priorities),
    COUNT(*) - COUNT(modernization_priorities),
    ROUND(100.0 * COUNT(modernization_priorities) / NULLIF(COUNT(*), 0), 1)
FROM sbir_final
UNION ALL
SELECT 
    'tpoc_names',
    COUNT(*),
    COUNT(tpoc_names),
    COUNT(*) - COUNT(tpoc_names),
    ROUND(100.0 * COUNT(tpoc_names) / NULLIF(COUNT(*), 0), 1)
FROM sbir_final
UNION ALL
SELECT 
    'tpoc_emails',
    COUNT(*),
    COUNT(tpoc_emails),
    COUNT(*) - COUNT(tpoc_emails),
    ROUND(100.0 * COUNT(tpoc_emails) / NULLIF(COUNT(*), 0), 1)
FROM sbir_final
UNION ALL
SELECT 
    'objective',
    COUNT(*),
    COUNT(objective),
    COUNT(*) - COUNT(objective),
    ROUND(100.0 * COUNT(objective) / NULLIF(COUNT(*), 0), 1)
FROM sbir_final
UNION ALL
SELECT 
    'description',
    COUNT(*),
    COUNT(description),
    COUNT(*) - COUNT(description),
    ROUND(100.0 * COUNT(description) / NULLIF(COUNT(*), 0), 1)
FROM sbir_final
UNION ALL
SELECT 
    'qa_content',
    COUNT(*),
    COUNT(qa_content),
    COUNT(*) - COUNT(qa_content),
    ROUND(100.0 * COUNT(qa_content) / NULLIF(COUNT(*), 0), 1)
FROM sbir_final
UNION ALL
SELECT 
    'references_data',
    COUNT(*),
    COUNT(references_data),
    COUNT(*) - COUNT(references_data),
    ROUND(100.0 * COUNT(references_data) / NULLIF(COUNT(*), 0), 1)
FROM sbir_final
UNION ALL
SELECT 
    'baa_instruction_files',
    COUNT(*),
    COUNT(baa_instruction_files),
    COUNT(*) - COUNT(baa_instruction_files),
    ROUND(100.0 * COUNT(baa_instruction_files) / NULLIF(COUNT(*), 0), 1)
FROM sbir_final
UNION ALL
SELECT 
    'itar_controlled',
    COUNT(*),
    COUNT(itar_controlled),
    COUNT(*) - COUNT(itar_controlled),
    ROUND(100.0 * COUNT(itar_controlled) / NULLIF(COUNT(*), 0), 1)
FROM sbir_final
ORDER BY population_percentage ASC;

-- ============================================================
-- PART 6: Data Consistency Issues
-- ============================================================
-- Identifies records with suspicious or inconsistent data

-- Records missing critical fields
SELECT 
    'Missing Title' as issue_type,
    COUNT(*) as affected_records
FROM sbir_final
WHERE title IS NULL OR title = ''
UNION ALL
SELECT 
    'Missing Component',
    COUNT(*)
FROM sbir_final
WHERE component IS NULL OR component = ''
UNION ALL
SELECT 
    'Missing Status',
    COUNT(*)
FROM sbir_final
WHERE status IS NULL OR status = ''
UNION ALL
SELECT 
    'Missing Dates',
    COUNT(*)
FROM sbir_final
WHERE open_date IS NULL OR close_date IS NULL
UNION ALL
SELECT 
    'No Technology Areas',
    COUNT(*)
FROM sbir_final
WHERE technology_areas IS NULL OR technology_areas = ''
UNION ALL
SELECT 
    'No Keywords',
    COUNT(*)
FROM sbir_final
WHERE keywords IS NULL OR keywords = ''
UNION ALL
SELECT 
    'No Description',
    COUNT(*)
FROM sbir_final
WHERE description IS NULL OR description = ''
UNION ALL
SELECT 
    'No TPOC',
    COUNT(*)
FROM sbir_final
WHERE tpoc_names IS NULL OR tpoc_names = '';

