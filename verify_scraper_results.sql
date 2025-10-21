-- Verify scraper results and check for duplicates

-- 1. Total records in database
SELECT 
  COUNT(*) as total_records
FROM sbir_final;

-- 2. Count by status
SELECT 
  status,
  COUNT(*) as count
FROM sbir_final
GROUP BY status
ORDER BY count DESC;

-- 3. Check for topics that appear in multiple cycles (this is normal)
SELECT 
  topic_number,
  COUNT(DISTINCT cycle_name) as num_cycles,
  array_agg(DISTINCT cycle_name) as cycles
FROM sbir_final
WHERE topic_number IS NOT NULL
GROUP BY topic_number
HAVING COUNT(DISTINCT cycle_name) > 1
ORDER BY num_cycles DESC
LIMIT 20;

-- 4. See when records were last scraped
SELECT 
  DATE(last_scraped) as scrape_date,
  COUNT(*) as records_scraped
FROM sbir_final
WHERE last_scraped IS NOT NULL
GROUP BY DATE(last_scraped)
ORDER BY scrape_date DESC;

-- 5. Records from today's scrapes (manual + historical)
SELECT 
  status,
  COUNT(*) as count,
  MIN(topic_start_date) as earliest_start,
  MAX(topic_end_date) as latest_end
FROM sbir_final
WHERE DATE(last_scraped) = CURRENT_DATE
GROUP BY status
ORDER BY count DESC;

-- 6. Check specific April-October 2025 range
SELECT 
  COUNT(*) as april_oct_2025_records,
  COUNT(DISTINCT topic_number) as unique_topics
FROM sbir_final
WHERE topic_end_date >= '2025-04-01' 
  AND topic_end_date <= '2025-10-31';

