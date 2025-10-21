-- ========================================
-- CHECK FOR ACTUAL DUPLICATES
-- ========================================

-- 1. TRUE DUPLICATES (these should NOT exist due to unique constraint)
-- If this returns any rows, there's a database constraint issue
SELECT 
  topic_number,
  cycle_name,
  COUNT(*) as duplicate_count
FROM sbir_final
WHERE topic_number IS NOT NULL
GROUP BY topic_number, cycle_name
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- 2. Total records breakdown
SELECT 
  COUNT(*) as total_records,
  COUNT(DISTINCT topic_number) as unique_topic_numbers,
  COUNT(DISTINCT cycle_name) as unique_cycles,
  COUNT(DISTINCT CONCAT(topic_number, '||', COALESCE(cycle_name, ''))) as unique_combinations
FROM sbir_final;

-- 3. Topics that appear in MULTIPLE CYCLES (this is NORMAL)
SELECT 
  topic_number,
  COUNT(DISTINCT cycle_name) as num_cycles,
  STRING_AGG(DISTINCT cycle_name, ', ' ORDER BY cycle_name) as cycles,
  STRING_AGG(DISTINCT status, ', ') as statuses
FROM sbir_final
WHERE topic_number IS NOT NULL
GROUP BY topic_number
HAVING COUNT(DISTINCT cycle_name) > 1
ORDER BY num_cycles DESC
LIMIT 20;

-- 4. Records by scrape date (see what was added when)
SELECT 
  DATE(last_scraped) as scrape_date,
  COUNT(*) as records,
  COUNT(DISTINCT topic_number) as unique_topics,
  COUNT(DISTINCT cycle_name) as cycles_affected
FROM sbir_final
WHERE last_scraped IS NOT NULL
GROUP BY DATE(last_scraped)
ORDER BY scrape_date DESC
LIMIT 10;

-- 5. Quick sanity check: 280 records explained
SELECT 
  'Scraped Today' as category,
  COUNT(*) as count
FROM sbir_final
WHERE DATE(last_scraped) = CURRENT_DATE

UNION ALL

SELECT 
  'Scraped Earlier' as category,
  COUNT(*) as count
FROM sbir_final
WHERE DATE(last_scraped) < CURRENT_DATE OR last_scraped IS NULL

UNION ALL

SELECT 
  'TOTAL' as category,
  COUNT(*) as count
FROM sbir_final;

-- 6. Show cycle distribution
SELECT 
  cycle_name,
  COUNT(*) as records,
  MIN(topic_start_date) as earliest_start,
  MAX(topic_end_date) as latest_end
FROM sbir_final
GROUP BY cycle_name
ORDER BY MAX(topic_end_date) DESC NULLS LAST
LIMIT 15;

