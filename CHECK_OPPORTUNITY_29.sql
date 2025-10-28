-- Check if opportunity 29 has instruction URLs
SELECT 
  id,
  topic_number,
  title,
  status,
  component_instructions_download,
  solicitation_instructions_download,
  consolidated_instructions_url,
  LENGTH(instructions_plain_text) as plain_text_length,
  jsonb_array_length(instructions_volume_structure) as volume_count,
  jsonb_array_length(instructions_checklist) as checklist_count
FROM sbir_final
WHERE id = 29;

