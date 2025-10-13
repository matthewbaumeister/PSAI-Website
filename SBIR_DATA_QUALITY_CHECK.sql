-- SBIR Data Quality Diagnostic Script
-- Run this to identify data quality issues before cleanup

-- 1. Check for NULL or empty critical fields
SELECT 
    'Missing topic_number' as issue,
    COUNT(*) as count
FROM sbir_final 
WHERE topic_number IS NULL OR topic_number = '';

SELECT 
    'Missing title' as issue,
    COUNT(*) as count
FROM sbir_final 
WHERE title IS NULL OR title = '';

SELECT 
    'Missing description' as issue,
    COUNT(*) as count
FROM sbir_final 
WHERE description IS NULL OR description = '';

-- 2. Check for invalid topic_number patterns
SELECT 
    'Invalid topic_number format' as issue,
    COUNT(*) as count,
    ARRAY_AGG(topic_number) FILTER (WHERE topic_number IS NOT NULL) as examples
FROM sbir_final 
WHERE topic_number IS NOT NULL 
  AND topic_number != ''
  AND topic_number !~ '^[A-Z0-9]{2,}-[0-9]{2,}-[A-Z0-9-]+$'  -- Expected pattern: AF-25-001, NAVY-24-123, etc
LIMIT 10;

-- 3. Check for duplicate entries
SELECT 
    'Duplicate topic_number + cycle' as issue,
    COUNT(*) as count
FROM (
    SELECT topic_number, cycle_name, COUNT(*) as dup_count
    FROM sbir_final
    WHERE topic_number IS NOT NULL AND topic_number != ''
    GROUP BY topic_number, cycle_name
    HAVING COUNT(*) > 1
) duplicates;

-- 4. Check date consistency (open_date should be before close_date)
SELECT 
    'Invalid date ranges (open >= close)' as issue,
    COUNT(*) as count
FROM sbir_final
WHERE open_date IS NOT NULL 
  AND close_date IS NOT NULL
  AND open_date_ts >= close_date_ts;

-- 5. Check for invalid status values
SELECT 
    'Status distribution' as category,
    status,
    COUNT(*) as count
FROM sbir_final
GROUP BY status
ORDER BY count DESC;

-- 6. Check for suspiciously short or long text fields
SELECT 
    'Suspiciously short titles (<10 chars)' as issue,
    COUNT(*) as count,
    ARRAY_AGG(title) FILTER (WHERE LENGTH(title) < 10) as examples
FROM sbir_final
WHERE title IS NOT NULL AND LENGTH(title) < 10
LIMIT 5;

SELECT 
    'Suspiciously short descriptions (<50 chars)' as issue,
    COUNT(*) as count
FROM sbir_final
WHERE description IS NOT NULL AND LENGTH(description) < 50;

-- 7. Check for invalid component values
SELECT 
    'Component distribution' as category,
    component,
    COUNT(*) as count
FROM sbir_final
GROUP BY component
ORDER BY count DESC;

-- 8. Check for records with mismatched timestamps
SELECT 
    'Mismatched open_date and open_date_ts' as issue,
    COUNT(*) as count
FROM sbir_final
WHERE open_date IS NOT NULL 
  AND open_date_ts IS NOT NULL
  AND open_date != LEFT(open_date_ts::text, 10);  -- Compare date parts

-- 9. Sample of potentially corrupted records
SELECT 
    'Sample corrupted records' as category,
    topic_number,
    title,
    status,
    open_date,
    close_date,
    component
FROM sbir_final
WHERE (
    topic_number IS NULL OR topic_number = '' OR
    title IS NULL OR title = '' OR LENGTH(title) < 10 OR
    description IS NULL OR description = '' OR
    status NOT IN ('Open', 'Pre-Release', 'Closed', 'Active')
)
LIMIT 20;

-- 10. Check for records with missing critical metadata
SELECT 
    'Missing critical metadata' as issue,
    COUNT(*) as count
FROM sbir_final
WHERE component IS NULL 
   OR program_type IS NULL
   OR status IS NULL;

-- 11. Summary statistics
SELECT 
    'Total records' as metric,
    COUNT(*) as value
FROM sbir_final
UNION ALL
SELECT 
    'Valid records (has topic_number, title, description)',
    COUNT(*)
FROM sbir_final
WHERE topic_number IS NOT NULL AND topic_number != ''
  AND title IS NOT NULL AND title != ''
  AND description IS NOT NULL AND description != ''
UNION ALL
SELECT 
    'Records with dates',
    COUNT(*)
FROM sbir_final
WHERE open_date IS NOT NULL AND close_date IS NOT NULL
UNION ALL
SELECT 
    'Records with all timestamps',
    COUNT(*)
FROM sbir_final
WHERE open_date_ts IS NOT NULL AND close_date_ts IS NOT NULL;

