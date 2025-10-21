-- Quick Summary: How many columns fall into each NULL category
-- Run this AFTER running analyze_null_columns.sql to get the detailed breakdown

WITH column_stats AS (
  SELECT 
    'topic_number' AS column_name,
    COUNT(*) FILTER (WHERE topic_number IS NULL) AS null_count,
    COUNT(*) AS total_count
  FROM sbir_final
  
  UNION ALL SELECT 'cycle_name', COUNT(*) FILTER (WHERE cycle_name IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'topic_id', COUNT(*) FILTER (WHERE topic_id IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'title', COUNT(*) FILTER (WHERE title IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'status', COUNT(*) FILTER (WHERE status IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'sponsor_component', COUNT(*) FILTER (WHERE sponsor_component IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'solicitation_branch', COUNT(*) FILTER (WHERE solicitation_branch IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'open_date', COUNT(*) FILTER (WHERE open_date IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'close_date', COUNT(*) FILTER (WHERE close_date IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'open_datetime', COUNT(*) FILTER (WHERE open_datetime IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'close_datetime', COUNT(*) FILTER (WHERE close_datetime IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'pre_release_date', COUNT(*) FILTER (WHERE pre_release_date IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'pre_release_date_close', COUNT(*) FILTER (WHERE pre_release_date_close IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'qa_close_date', COUNT(*) FILTER (WHERE qa_close_date IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'last_activity_date', COUNT(*) FILTER (WHERE last_activity_date IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'last_scraped', COUNT(*) FILTER (WHERE last_scraped IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'description', COUNT(*) FILTER (WHERE description IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'objective', COUNT(*) FILTER (WHERE objective IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'phase_1_description', COUNT(*) FILTER (WHERE phase_1_description IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'phase_2_description', COUNT(*) FILTER (WHERE phase_2_description IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'phase_3_description', COUNT(*) FILTER (WHERE phase_3_description IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'qa_content', COUNT(*) FILTER (WHERE qa_content IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'qa_content_fetched', COUNT(*) FILTER (WHERE qa_content_fetched IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'qa_last_updated', COUNT(*) FILTER (WHERE qa_last_updated IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'topic_question_count', COUNT(*) FILTER (WHERE topic_question_count IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'no_of_published_questions', COUNT(*) FILTER (WHERE no_of_published_questions IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'qa_response_rate_percentage', COUNT(*) FILTER (WHERE qa_response_rate_percentage IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'technology_areas', COUNT(*) FILTER (WHERE technology_areas IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'keywords', COUNT(*) FILTER (WHERE keywords IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'modernization_priorities', COUNT(*) FILTER (WHERE modernization_priorities IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'tpoc_names', COUNT(*) FILTER (WHERE tpoc_names IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'tpoc_emails', COUNT(*) FILTER (WHERE tpoc_emails IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'tpoc_centers', COUNT(*) FILTER (WHERE tpoc_centers IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'tpoc_count', COUNT(*) FILTER (WHERE tpoc_count IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'tpoc_email_domain', COUNT(*) FILTER (WHERE tpoc_email_domain IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'show_tpoc', COUNT(*) FILTER (WHERE show_tpoc IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'topic_pdf_download', COUNT(*) FILTER (WHERE topic_pdf_download IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'pdf_link', COUNT(*) FILTER (WHERE pdf_link IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'solicitation_instructions_download', COUNT(*) FILTER (WHERE solicitation_instructions_download IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'solicitation_instructions_version', COUNT(*) FILTER (WHERE solicitation_instructions_version IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'component_instructions_download', COUNT(*) FILTER (WHERE component_instructions_download IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'component_instructions_version', COUNT(*) FILTER (WHERE component_instructions_version IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'baa_instruction_files', COUNT(*) FILTER (WHERE baa_instruction_files IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'references', COUNT(*) FILTER (WHERE "references" IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'days_since_open', COUNT(*) FILTER (WHERE days_since_open IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'days_until_close', COUNT(*) FILTER (WHERE days_until_close IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'days_until_qa_close', COUNT(*) FILTER (WHERE days_until_qa_close IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'duration_days', COUNT(*) FILTER (WHERE duration_days IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'pre_release_duration', COUNT(*) FILTER (WHERE pre_release_duration IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'urgency_level', COUNT(*) FILTER (WHERE urgency_level IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'proposal_window_status', COUNT(*) FILTER (WHERE proposal_window_status IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'qa_window_active', COUNT(*) FILTER (WHERE qa_window_active IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'solicitation_phase', COUNT(*) FILTER (WHERE solicitation_phase IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'phases_available', COUNT(*) FILTER (WHERE phases_available IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'is_direct_to_phase_ii', COUNT(*) FILTER (WHERE is_direct_to_phase_ii IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'is_xtech', COUNT(*) FILTER (WHERE is_xtech IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'prize_gating', COUNT(*) FILTER (WHERE prize_gating IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'itar_controlled', COUNT(*) FILTER (WHERE itar_controlled IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'scraper_source', COUNT(*) FILTER (WHERE scraper_source IS NULL), COUNT(*) FROM sbir_final
  UNION ALL SELECT 'data_freshness', COUNT(*) FILTER (WHERE data_freshness IS NULL), COUNT(*) FROM sbir_final
)
SELECT 
  COUNT(*) FILTER (WHERE ROUND((null_count::numeric / NULLIF(total_count, 0)) * 100, 2) = 100) AS always_null_columns,
  COUNT(*) FILTER (WHERE ROUND((null_count::numeric / NULLIF(total_count, 0)) * 100, 2) > 95 AND ROUND((null_count::numeric / NULLIF(total_count, 0)) * 100, 2) < 100) AS mostly_null_columns,
  COUNT(*) FILTER (WHERE ROUND((null_count::numeric / NULLIF(total_count, 0)) * 100, 2) > 50 AND ROUND((null_count::numeric / NULLIF(total_count, 0)) * 100, 2) <= 95) AS frequently_null_columns,
  COUNT(*) FILTER (WHERE ROUND((null_count::numeric / NULLIF(total_count, 0)) * 100, 2) > 0 AND ROUND((null_count::numeric / NULLIF(total_count, 0)) * 100, 2) <= 50) AS sometimes_null_columns,
  COUNT(*) FILTER (WHERE ROUND((null_count::numeric / NULLIF(total_count, 0)) * 100, 2) = 0) AS never_null_columns,
  COUNT(*) AS total_columns
FROM column_stats;

