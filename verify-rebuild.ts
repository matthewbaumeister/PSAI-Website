#!/usr/bin/env tsx
/**
 * Verify Company Rebuild Worked
 * Run this AFTER running REBUILD_COMPANIES_FIXED.sql
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verify() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   Company Rebuild Verification                             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Get stats
  const { count: total } = await supabase
    .from('fpds_company_stats')
    .select('*', { count: 'exact', head: true });

  const { count: withUEI } = await supabase
    .from('fpds_company_stats')
    .select('*', { count: 'exact', head: true })
    .not('vendor_uei', 'is', null)
    .neq('vendor_uei', '');

  const { count: withValues } = await supabase
    .from('fpds_company_stats')
    .select('*', { count: 'exact', head: true })
    .gt('total_value', 0);

  const { count: smallBiz } = await supabase
    .from('fpds_company_stats')
    .select('*', { count: 'exact', head: true })
    .eq('small_business', true);

  // Get total value
  const { data: values } = await supabase
    .from('fpds_company_stats')
    .select('total_value');
  
  const totalValue = values?.reduce((sum, row) => sum + (Number(row.total_value) || 0), 0) || 0;

  // Get top 20
  const { data: top20 } = await supabase
    .from('fpds_company_stats')
    .select('company_name, total_contracts, total_value, small_business, vendor_uei')
    .order('total_value', { ascending: false })
    .limit(20);

  console.log('📊 Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Total companies:      ${total}`);
  console.log(`  With UEI:             ${withUEI} (${Math.round(withUEI! / total! * 100)}%)`);
  console.log(`  With values > $0:     ${withValues} (${Math.round(withValues! / total! * 100)}%)`);
  console.log(`  Small businesses:     ${smallBiz}`);
  console.log(`  Total contract value: $${(totalValue / 1_000_000_000).toFixed(2)}B`);
  console.log('');

  console.log('🏆 Top 20 Companies by Contract Value:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  top20?.forEach((company, i) => {
    const value = Number(company.total_value) || 0;
    const valueStr = value > 1_000_000_000 
      ? `$${(value / 1_000_000_000).toFixed(2)}B`
      : `$${(value / 1_000_000).toFixed(1)}M`;
    const sb = company.small_business ? 'SB' : '  ';
    const uei = company.vendor_uei ? '✓' : '✗';
    console.log(`  ${(i+1).toString().padStart(2)}. ${company.company_name.substring(0, 42).padEnd(44)} ${valueStr.padStart(12)} [${uei}] [${sb}]`);
  });

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Data Quality Assessment:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const valuesPct = Math.round(withValues! / total! * 100);
  const ueiPct = Math.round(withUEI! / total! * 100);

  if (valuesPct > 80 && ueiPct > 80) {
    console.log('  ✅ EXCELLENT! Data quality is very good');
    console.log(`     - ${valuesPct}% have contract values`);
    console.log(`     - ${ueiPct}% have UEIs (can be enriched)`);
  } else if (valuesPct > 50 && ueiPct > 50) {
    console.log('  ✓  GOOD! Data quality is acceptable');
    console.log(`     - ${valuesPct}% have contract values`);
    console.log(`     - ${ueiPct}% have UEIs (can be enriched)`);
  } else {
    console.log('  ⚠️  Data quality needs improvement');
    console.log(`     - Only ${valuesPct}% have contract values`);
    console.log(`     - Only ${ueiPct}% have UEIs`);
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Next Steps:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (withUEI! > 100 && valuesPct > 50) {
    console.log('');
    console.log('  1. Test enrichment with 10 companies:');
    console.log('     npm run enrich-companies -- 10');
    console.log('');
    console.log('  2. If quality looks good, enrich all:');
    console.log('     npm run enrich-companies -- all');
    console.log('');
    console.log(`  Estimated time: ${Math.ceil(withUEI! / 100 * 2)} minutes for all ${withUEI} companies`);
  } else {
    console.log('  ⚠️  Not enough companies with UEIs to enrich');
    console.log('     Wait for FPDS scraper to add more data');
  }
  
  console.log('');
}

verify().then(() => process.exit(0)).catch(console.error);

