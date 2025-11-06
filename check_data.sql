-- Check what contractor data you have
SELECT 'fpds_contracts' as table_name, COUNT(*) as count FROM fpds_contracts
UNION ALL
SELECT 'fpds_company_stats', COUNT(*) FROM fpds_company_stats
UNION ALL
SELECT 'sam_gov_opportunities', COUNT(*) FROM sam_gov_opportunities
UNION ALL
SELECT 'army_innovation_submissions', COUNT(*) FROM army_innovation_submissions;
