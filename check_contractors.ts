import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';

async function main() {
  const dotenv = require('dotenv');
  dotenv.config({ path: path.join(process.cwd(), '.env.local') });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('defense_contractors_tickers')
    .select('*')
    .order('ticker');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`\nDefense Contractors Loaded: ${data.length}\n`);
    data.forEach(c => {
      console.log(`${c.ticker.padEnd(6)} ${c.company_name.padEnd(40)} ${c.sector}`);
    });
  }
}

main();
