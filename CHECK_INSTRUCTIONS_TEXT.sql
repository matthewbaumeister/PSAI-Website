-- Check if plain text instructions are saved in database
SELECT 
  topic_number,
  title,
  status,
  LENGTH(instructions_plain_text) as text_length,
  LEFT(instructions_plain_text, 500) as text_preview,
  instructions_generated_at,
  consolidated_instructions_url,
  CASE 
    WHEN instructions_plain_text IS NULL THEN 'No text'
    WHEN LENGTH(instructions_plain_text) < 1000 THEN 'Very short'
    WHEN LENGTH(instructions_plain_text) < 50000 THEN 'Short'
    WHEN LENGTH(instructions_plain_text) < 150000 THEN 'Medium'
    ELSE 'Full length'
  END as content_status
FROM sbir_final
WHERE topic_number = 'A254-P039';

-- Count all opportunities with instructions
SELECT 
  COUNT(*) as total_opportunities,
  COUNT(instructions_plain_text) as has_plain_text,
  COUNT(consolidated_instructions_url) as has_pdf_url,
  AVG(LENGTH(instructions_plain_text)) as avg_text_length,
  MAX(LENGTH(instructions_plain_text)) as max_text_length
FROM sbir_final
WHERE status IN ('Open', 'Prerelease', 'Active');

