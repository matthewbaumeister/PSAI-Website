-- Verify the columns were added successfully
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'sbir_final' 
AND column_name IN (
  'consolidated_instructions_url',
  'instructions_plain_text',
  'instructions_generated_at',
  'instructions_volume_structure',
  'instructions_checklist'
)
ORDER BY column_name;

