#!/usr/bin/env tsx
/**
 * Simple Test: Rebuild Company Stats & Check Quality
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function test() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   Company Stats Test                   ║');
  console.log('╚════════════════════════════════════════╝\n');

  // Check FPDS contracts
  const { count: contracts } = await supabase
    .from('fpds_contracts')
    .select('*', { count: 'exact', head: true });
  
  console.log(`✓ FPDS Contracts: ${contracts}`);

  // Check sample values
  const { data: sample } = await supabase
    .from('fpds_contracts')
    .select('vendor_name, base_and_exercised_options_value, dollars_obligated')
    .not('vendor_name', 'is', null)
    .limit(3);
  
  console.log('\nSample contract values:');
  sample?.forEach(c => {
    console.log(`  ${c.vendor_name.substring(0, 30)}: $${c.base_and_exercised_options_value || 0}`);
  });

  // Check company stats
  const { count: companies } = await supabase
    .from('fpds_company_stats')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\n✓ Company Stats: ${companies || 0} companies`);

  if (!companies || companies === 0) {
    console.log('\n⚠️  Company stats is empty!');
    console.log('Run this SQL in Supabase Dashboard:');
    console.log('   REBUILD_COMPANIES_SIMPLE.sql\n');
    return;
  }

  // Check quality
  const { count: withUEI } = await supabase
    .from('fpds_company_stats')
    .select('*', { count: 'exact', head: true })
    .not('vendor_uei', 'is', null)
    .neq('vendor_uei', '');

  const { count: withValues } = await supabase
    .from('fpds_company_stats')
    .select('*', { count: 'exact', head: true })
    .gt('total_value', 0);

  console.log(`  With UEI: ${withUEI} (${Math.round(withUEI! / companies * 100)}%)`);
  console.log(`  With values >$0: ${withValues} (${Math.round(withValues! / companies * 100)}%)`);

  // Top 10 companies
  const { data: top } = await supabase
    .from('fpds_company_stats')
    .select('company_name, total_value, total_contracts, vendor_uei')
    .order('total_value', { ascending: false })
    .limit(10);

  console.log('\nTop 10 companies:');
  top?.forEach((c, i) => {
    const val = Number(c.total_value) || 0;
    const valStr = val > 0 ? `$${(val / 1_000_000).toFixed(1)}M` : '$0';
    const uei = c.vendor_uei ? '✓' : '✗';
    console.log(`  ${i+1}. ${c.company_name.substring(0, 35).padEnd(37)} ${valStr.padStart(12)} [${uei}]`);
  });

  // Recommendation
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const valuesPct = Math.round(withValues! / companies * 100);
  
  if (withUEI! > 100 && valuesPct > 20) {
    console.log('✅ READY! Run: npm run enrich-companies -- 10');
  } else if (withUEI! > 0) {
    console.log('⚠️  Can test, but data may be limited');
    console.log('   Run: npm run enrich-companies -- 10');
  } else {
    console.log('❌ Need to run REBUILD_COMPANIES_SIMPLE.sql first');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

test().then(() => process.exit(0)).catch(console.error);

