-- ============================================================================
-- GET SBIR_FINAL TABLE SCHEMA
-- Shows exact column names, data types, and constraints
-- Use this to match CSV format exactly
-- ============================================================================

-- Option 1: Get column details with data types
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'sbir_final'
ORDER BY ordinal_position;

-- Option 2: Get a sample record to see actual data format
SELECT * FROM sbir_final LIMIT 1;

-- Option 3: Get all column names only (for CSV header)
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'sbir_final'
ORDER BY ordinal_position;

-- Option 4: Get data types summary
SELECT 
    data_type,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'sbir_final'
GROUP BY data_type
ORDER BY column_count DESC;

-- ============================================================================
-- EXPECTED DATA TYPES FOR CSV IMPORT
-- ============================================================================

/*
KEY FIELDS (Must have for composite key):
- topic_number: TEXT (e.g., "N251-001")
- cycle_name: TEXT (e.g., "25.1", "DOD_SBIR_25_1")

TEXT FIELDS:
- title, description, objective, etc.: TEXT
- All string data can be TEXT

BOOLEAN FIELDS:
- itar_controlled: BOOLEAN (true/false)
- is_xtech: BOOLEAN (true/false)
- qa_content_fetched: BOOLEAN (true/false)
- qa_window_active: BOOLEAN (true/false)
- show_tpoc: BOOLEAN (true/false)
- is_direct_to_phase_ii: BOOLEAN (true/false)
- is_release_preface: BOOLEAN (true/false)

INTEGER FIELDS:
- days_until_close: INTEGER
- days_since_open: INTEGER
- duration_days: INTEGER
- pre_release_duration: INTEGER
- topic_question_count: INTEGER
- no_of_published_questions: INTEGER
- qa_response_rate_percentage: INTEGER
- days_until_qa_close: INTEGER
- technology_areas_count: INTEGER
- modernization_priority_count: INTEGER
- keywords_count: INTEGER
- objective_word_count: INTEGER
- description_word_count: INTEGER
- description_length: INTEGER
- reference_count: INTEGER
- tpoc_count: INTEGER

DATE FIELDS (format: MM/DD/YYYY):
- open_date: TEXT (e.g., "01/15/2025")
- close_date: TEXT (e.g., "03/31/2025")
- pre_release_date: TEXT
- pre_release_date_close: TEXT
- created_date: TEXT
- updated_date: TEXT
- modified_date: TEXT
- qa_close_date: TEXT

TIMESTAMP FIELDS (format: ISO 8601):
- open_datetime: TIMESTAMPTZ (e.g., "2025-01-15T00:00:00-05:00")
- close_datetime: TIMESTAMPTZ (e.g., "2025-03-31T23:59:59-04:00")
- last_scraped: TIMESTAMPTZ (e.g., "2025-10-27T15:59:17-04:00")
- last_activity_date: TIMESTAMPTZ
- qa_last_updated: TIMESTAMPTZ

NULL VALUES:
- Empty strings in CSV become NULL
- Leave blank if no data
*/

-- ============================================================================
-- CSV FORMAT EXAMPLE
-- ============================================================================

/*
topic_number,cycle_name,title,component,status,open_date,close_date,itar_controlled,...
N251-001,25.1,Advanced Sensor Technology,NAVY,Open,01/15/2025,03/31/2025,false,...
AF251-002,25.1,AI-Powered Systems,AIRFORCE,Closed,02/01/2025,04/30/2025,true,...

NOTES:
1. Header row must match column names EXACTLY (case-sensitive)
2. Boolean: use "true" or "false" (lowercase)
3. Dates: MM/DD/YYYY format for date columns
4. Timestamps: ISO 8601 format (YYYY-MM-DDTHH:MM:SS±HH:MM)
5. NULL: leave blank or use empty string
6. Escape commas in text with quotes: "Technology, Advanced"
7. Escape quotes with double quotes: "She said ""hello"""
*/

