#!/usr/bin/env tsx
/**
 * Check which columns in FPDS have data
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkColumns() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   FPDS Column Data Check               ║');
  console.log('╚════════════════════════════════════════╝\n');

  const { data: sample, error } = await supabase
    .from('fpds_contracts')
    .select('*')
    .not('vendor_name', 'is', null)
    .limit(3);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!sample || sample.length === 0) {
    console.log('No contracts found!');
    return;
  }

  console.log('Sample contract (first one):');
  const contract = sample[0];
  
  // Financial columns
  console.log('\nFinancial columns:');
  console.log(`  base_and_exercised_options_value: ${contract.base_and_exercised_options_value}`);
  console.log(`  base_and_all_options_value:       ${contract.base_and_all_options_value}`);
  console.log(`  dollars_obligated:                ${contract.dollars_obligated}`);
  console.log(`  current_total_value_of_award:     ${contract.current_total_value_of_award}`);
  
  // Check if ANY column has values
  console.log('\nChecking all contracts for non-null values...');
  
  const checks = [
    'base_and_exercised_options_value',
    'base_and_all_options_value', 
    'dollars_obligated',
    'current_total_value_of_award'
  ];
  
  for (const col of checks) {
    const { count } = await supabase
      .from('fpds_contracts')
      .select('*', { count: 'exact', head: true })
      .not(col, 'is', null);
    
    const { count: nonZero } = await supabase
      .from('fpds_contracts')
      .select('*', { count: 'exact', head: true })
      .gt(col, 0);
    
    console.log(`  ${col}:`);
    console.log(`    Not null: ${count}`);
    console.log(`    > 0:      ${nonZero}`);
  }
  
  // Show all column names
  console.log('\nAll contract columns:');
  const keys = Object.keys(contract);
  keys.forEach(key => {
    const val = contract[key];
    const hasValue = val !== null && val !== undefined && val !== '';
    console.log(`  ${hasValue ? '✓' : '✗'} ${key}`);
  });
  
  console.log('\n');
}

checkColumns().then(() => process.exit(0)).catch(console.error);

