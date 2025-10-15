-- Add ALL missing columns to sbir_final table
-- Based on the complete field list from sbir-column-mapper.ts
-- Run this in Supabase SQL Editor

-- Core identification fields
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS topic_number TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS topic_id TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS short_title TEXT;

-- Component and program info
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS component TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS component_full_name TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS command TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS program TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS program_type TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS component_4 TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS component_5 TEXT;

-- Solicitation info
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS title_1 TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS title_2 TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS title_3 TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS solicitation_number TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS cycle_name TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS release_number TEXT;

-- Status fields
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS status_topicstatus TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS topic_status TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS status TEXT;

-- Date fields
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS open_date TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS open_datetime TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS open_date_ts TIMESTAMPTZ;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS close_date TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS close_datetime TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS close_date_ts TIMESTAMPTZ;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS pre_release_start TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS pre_release_end TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS created_date TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS updated_date TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS modified_date TEXT;

-- Q&A fields
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS qanda_start_topicqastartdate TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS qa_start TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS qanda_end_topicqaenddate TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS qanda_status_topicqastatus TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS qanda_status_display_topicqastatusdisplay TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS qanda_open_topicqaopen_boolean TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS total_questions TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS qa_data TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS hasqa_1_if_topicquestioncount_gt_0 TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS published_questions TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS published_questions_1 TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS qa_content TEXT;

-- Technology and keywords
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS technology_areas TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS technology_areas_count TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS primary_technology_area TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS tech_modernization TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS modernization_priorities TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS modernization_priority_count TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS keywords TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS keywords_1 TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS keywords_count TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS primary_keyword TEXT;

-- ITAR
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS itar_controlled TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS security_export TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS requiresitar_1_if_itar_is_yes_else_0 TEXT;

-- Descriptions
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS objective TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS objective_1 TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS objective_word_count TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS description_1 TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS description_word_count TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS description_length TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS description_3 TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS description_4 TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS description_5 TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS description_6 TEXT;

-- xTech detection
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS is_xtech_xtech_keyword_search_duplicate TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS prize_gating TEXT;

-- References
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS references_data TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS reference_docs TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS references_1_data TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS reference_count TEXT;

-- BAA Instruction Files
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS baa_instruction_files TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS baa_files_count TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS has_baa_instructions TEXT;

-- Direct to Phase II
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS is_direct_to_phase_ii TEXT;

-- PDF and instructions
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS topic_pdf_download TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS pdf_link TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS pdf_link_1 TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS solicitation_instructions_download TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS solicitationinstructionsurl_solicitation_download_duplicate TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS has_solicitation_instructions TEXT;

-- TPOC fields
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS tpoc TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS tpoc_1 TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS tpoc_names TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS tpoc_names_1 TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS tpoc_emails TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS tpoc_centers TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS tpoc_count TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS tpoc_2 TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS tpoc_3 TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS tpoc_email_domain TEXT;

-- Additional metadata
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS owner TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS internal_lead TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS selection_criteria TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS historical_awards TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS previous_awards_count TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS success_rate TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS program_1 TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS year TEXT;

-- BAA fields
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS baa_preface_upload_id TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS is_release_preface TEXT;

-- Actions and status flags
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS applicable_actions TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS actions_count TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS is_active TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS is_archived TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS is_draft TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS is_published TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS allow_proposal_submission TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS is_open_for_submission TEXT;

-- Requirements
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS proposal_requirements TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS submission_instructions TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS eligibility_requirements TEXT;

-- Unique identifiers
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS record_id TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS unique_id TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS version TEXT;

-- Last scraped timestamp (CRITICAL)
ALTER TABLE sbir_final ADD COLUMN IF NOT EXISTS last_scraped TIMESTAMPTZ;

-- Refresh Supabase schema cache
NOTIFY pgrst, 'reload schema';

-- Show final column count
SELECT COUNT(*) as total_columns_after_update
FROM information_schema.columns
WHERE table_name = 'sbir_final';

