-- Fix ticker field length issue
-- Some tickers (especially options) are longer than 20 chars

ALTER TABLE congressional_stock_trades 
ALTER COLUMN ticker TYPE VARCHAR(50);

-- Verify the change
SELECT 
  'Ticker field updated' as status,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'congressional_stock_trades'
  AND column_name = 'ticker';

