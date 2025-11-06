-- ============================================================
-- ManTech Data Quality Check
-- ============================================================
-- Comprehensive data quality and richness report

SELECT 
  'Total Projects' as metric,
  COUNT(*)::text as value,
  '100%' as percentage
FROM mantech_projects

UNION ALL

SELECT 
  'With Published Date',
  COUNT(*)::text,
  ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM mantech_projects), 0), 1)::text || '%'
FROM mantech_projects 
WHERE published_date IS NOT NULL

UNION ALL

SELECT 
  'With DOD Component',
  COUNT(*)::text,
  ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM mantech_projects), 0), 1)::text || '%'
FROM mantech_projects 
WHERE mantech_component IS NOT NULL 
  AND mantech_component != 'News'

UNION ALL

SELECT 
  'With Companies',
  COUNT(*)::text,
  ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM mantech_projects), 0), 1)::text || '%'
FROM mantech_projects 
WHERE companies_involved IS NOT NULL 
  AND array_length(companies_involved, 1) > 0

UNION ALL

SELECT 
  'With Weapon Systems',
  COUNT(*)::text,
  ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM mantech_projects), 0), 1)::text || '%'
FROM mantech_projects 
WHERE weapon_systems IS NOT NULL 
  AND array_length(weapon_systems, 1) > 0

UNION ALL

SELECT 
  'With States',
  COUNT(*)::text,
  ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM mantech_projects), 0), 1)::text || '%'
FROM mantech_projects 
WHERE states IS NOT NULL 
  AND array_length(states, 1) > 0

UNION ALL

SELECT 
  'With Technology Focus',
  COUNT(*)::text,
  ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM mantech_projects), 0), 1)::text || '%'
FROM mantech_projects 
WHERE technology_focus IS NOT NULL 
  AND array_length(technology_focus, 1) > 0

UNION ALL

SELECT 
  'With Manufacturing Processes',
  COUNT(*)::text,
  ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM mantech_projects), 0), 1)::text || '%'
FROM mantech_projects 
WHERE manufacturing_processes IS NOT NULL 
  AND array_length(manufacturing_processes, 1) > 0

UNION ALL

SELECT 
  'With Fiscal Year',
  COUNT(*)::text,
  ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM mantech_projects), 0), 1)::text || '%'
FROM mantech_projects 
WHERE fiscal_year IS NOT NULL

UNION ALL

SELECT 
  'With Funding Amount',
  COUNT(*)::text,
  ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM mantech_projects), 0), 1)::text || '%'
FROM mantech_projects 
WHERE funding_amount IS NOT NULL

UNION ALL

SELECT 
  'SBIR Linked',
  COUNT(*)::text,
  ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM mantech_projects), 0), 1)::text || '%'
FROM mantech_projects 
WHERE sbir_linked = TRUE

UNION ALL

SELECT 
  'With Academic Partners',
  COUNT(*)::text,
  ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM mantech_projects), 0), 1)::text || '%'
FROM mantech_projects 
WHERE academic_partners IS NOT NULL 
  AND array_length(academic_partners, 1) > 0

UNION ALL

SELECT 
  'With MII Partners',
  COUNT(*)::text,
  ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM mantech_projects), 0), 1)::text || '%'
FROM mantech_projects 
WHERE manufacturing_innovation_institutes IS NOT NULL 
  AND array_length(manufacturing_innovation_institutes, 1) > 0

UNION ALL

SELECT 
  'Avg Confidence Score',
  ROUND(AVG(parsing_confidence) * 100, 1)::text || '%',
  '---'
FROM mantech_projects

UNION ALL

SELECT 
  'High Confidence (>70%)',
  COUNT(*)::text,
  ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM mantech_projects), 0), 1)::text || '%'
FROM mantech_projects 
WHERE parsing_confidence > 0.70

UNION ALL

SELECT 
  'Medium Confidence (50-70%)',
  COUNT(*)::text,
  ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM mantech_projects), 0), 1)::text || '%'
FROM mantech_projects 
WHERE parsing_confidence >= 0.50 AND parsing_confidence <= 0.70

UNION ALL

SELECT 
  'Low Confidence (<50%)',
  COUNT(*)::text,
  ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM mantech_projects), 0), 1)::text || '%'
FROM mantech_projects 
WHERE parsing_confidence < 0.50;


-- ============================================================
-- Component Breakdown
-- ============================================================

SELECT 
  '---' as separator,
  '---' as value,
  '---' as percentage
  
UNION ALL

SELECT 
  'DOD COMPONENT BREAKDOWN' as separator,
  '---' as value,
  '---' as percentage

UNION ALL

SELECT 
  mantech_component,
  COUNT(*)::text as value,
  ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM mantech_projects), 0), 1)::text || '%'
FROM mantech_projects
GROUP BY mantech_component
ORDER BY COUNT(*) DESC;


-- ============================================================
-- Date Range
-- ============================================================

SELECT 
  '---' as metric,
  '---' as value,
  '---' as percentage
  
UNION ALL

SELECT 
  'DATE RANGE' as metric,
  '---' as value,
  '---' as percentage

UNION ALL

SELECT 
  'Oldest Article',
  TO_CHAR(MIN(published_date), 'YYYY-MM-DD'),
  '---'
FROM mantech_projects
WHERE published_date IS NOT NULL

UNION ALL

SELECT 
  'Newest Article',
  TO_CHAR(MAX(published_date), 'YYYY-MM-DD'),
  '---'
FROM mantech_projects
WHERE published_date IS NOT NULL

UNION ALL

SELECT 
  'Date Range (Days)',
  (MAX(published_date) - MIN(published_date))::text,
  '---'
FROM mantech_projects
WHERE published_date IS NOT NULL;


-- ============================================================
-- Top Companies
-- ============================================================

SELECT 
  '---' as metric,
  '---' as value,
  '---' as percentage
  
UNION ALL

SELECT 
  'TOP 10 COMPANIES' as metric,
  '---' as value,
  '---' as percentage

UNION ALL

SELECT 
  company,
  COUNT(*)::text as mentions,
  '---'
FROM mantech_projects,
LATERAL unnest(companies_involved) AS company
GROUP BY company
ORDER BY COUNT(*) DESC
LIMIT 10;

