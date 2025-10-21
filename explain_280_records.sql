-- ========================================
-- EXPLAIN WHERE YOUR 280 RECORDS COME FROM
-- ========================================

-- 1. Records inside vs outside April-Current date range
SELECT 
  CASE 
    WHEN topic_end_date >= '2025-04-01' AND topic_end_date <= '2025-10-31' 
      THEN 'Inside April-Oct 2025'
    WHEN topic_end_date < '2025-04-01' 
      THEN 'Before April 2025'
    WHEN topic_end_date > '2025-10-31' 
      THEN 'After October 2025'
    ELSE 'Missing end date'
  END as date_category,
  COUNT(*) as records
FROM sbir_final
GROUP BY date_category
ORDER BY 
  CASE date_category
    WHEN 'Inside April-Oct 2025' THEN 1
    WHEN 'After October 2025' THEN 2
    WHEN 'Before April 2025' THEN 3
    ELSE 4
  END;

-- 2. Show topics that exist in multiple cycles
SELECT 
  topic_number,
  COUNT(*) as num_records,
  STRING_AGG(cycle_name, ', ' ORDER BY cycle_name) as all_cycles
FROM sbir_final
WHERE topic_number IS NOT NULL
GROUP BY topic_number
HAVING COUNT(*) > 1
ORDER BY num_records DESC
LIMIT 10;

-- 3. Count unique topic numbers vs total records
SELECT 
  COUNT(*) as total_records,
  COUNT(DISTINCT topic_number) as unique_topics,
  COUNT(*) - COUNT(DISTINCT topic_number) as multi_cycle_records
FROM sbir_final;

-- 4. When were records last scraped?
SELECT 
  CASE 
    WHEN DATE(last_scraped) = CURRENT_DATE THEN 'Today'
    WHEN DATE(last_scraped) = CURRENT_DATE - 1 THEN 'Yesterday'
    WHEN last_scraped IS NULL THEN 'Never scraped'
    ELSE 'Older'
  END as when_scraped,
  COUNT(*) as records
FROM sbir_final
GROUP BY when_scraped
ORDER BY 
  CASE when_scraped
    WHEN 'Today' THEN 1
    WHEN 'Yesterday' THEN 2
    WHEN 'Older' THEN 3
    ELSE 4
  END;

-- 5. Show some example records to understand the data
SELECT 
  topic_number,
  cycle_name,
  status,
  topic_start_date,
  topic_end_date,
  DATE(last_scraped) as scraped_on
FROM sbir_final
ORDER BY last_scraped DESC NULLS LAST
LIMIT 20;

