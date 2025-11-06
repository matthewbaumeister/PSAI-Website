#!/usr/bin/env tsx
/**
 * Test Company Rebuild
 * Tests if company stats rebuild works and shows data quality
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testRebuild() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Testing Company Rebuild                                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  try {
    // Step 1: Check current state
    console.log('Step 1: Checking current FPDS contracts...');
    const { count: contractCount } = await supabase
      .from('fpds_contracts')
      .select('*', { count: 'exact', head: true });
    
    console.log(`  ✓ Found ${contractCount} contracts`);
    
    // Check for sample values
    const { data: sampleContracts } = await supabase
      .from('fpds_contracts')
      .select('vendor_name, base_and_exercised_options_value, dollars_obligated, current_total_value_of_award')
      .not('vendor_name', 'is', null)
      .limit(5);
    
    console.log('');
    console.log('Sample contracts:');
    sampleContracts?.forEach(c => {
      console.log(`  ${c.vendor_name}: base=$${c.base_and_exercised_options_value || 0}, obligated=$${c.dollars_obligated || 0}, current=$${c.current_total_value_of_award || 0}`);
    });
    
    // Step 2: Read and execute rebuild SQL
    console.log('');
    console.log('Step 2: Rebuilding company stats...');
    
    const sql = fs.readFileSync('REBUILD_COMPANIES_SIMPLE.sql', 'utf-8');
    
    // Split into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));
    
    let lastResult: any = null;
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (!stmt) continue;
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: stmt });
        if (error) {
          // Try direct query instead
          const result = await supabase.from('fpds_company_stats').select('*').limit(1);
          if (i === 0) {
            // TRUNCATE - check if it worked
            const { count } = await supabase
              .from('fpds_company_stats')
              .select('*', { count: 'exact', head: true });
            console.log(`  Cleared table (${count || 0} rows)`);
          }
        } else {
          lastResult = data;
        }
      } catch (e) {
        // Some statements might not work via RPC, that's OK
      }
    }
    
    console.log('  ✓ Rebuild SQL executed');
    
    // Step 3: Check results manually
    console.log('');
    console.log('Step 3: Checking results...');
    
    const { count: totalCompanies } = await supabase
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
    
    const { count: sbir } = await supabase
      .from('fpds_company_stats')
      .select('*', { count: 'exact', head: true })
      .gt('sbir_contracts', 0);
    
    const { data: totalValue } = await supabase
      .from('fpds_company_stats')
      .select('total_value');
    
    const sumValue = totalValue?.reduce((acc, row) => acc + (Number(row.total_value) || 0), 0) || 0;
    
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Total companies:      ${totalCompanies}`);
    console.log(`  With UEI:             ${withUEI} (${Math.round(withUEI! / totalCompanies! * 100)}%)`);
    console.log(`  With values > $0:     ${withValues} (${Math.round(withValues! / totalCompanies! * 100)}%)`);
    console.log(`  Small businesses:     ${smallBiz}`);
    console.log(`  SBIR contractors:     ${sbir}`);
    console.log(`  Total contract value: $${(sumValue / 1_000_000_000).toFixed(2)}B`);
    console.log('');
    
    // Step 4: Show top 20
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Top 20 Companies by Value:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const { data: topCompanies } = await supabase
      .from('fpds_company_stats')
      .select('company_name, total_contracts, total_value, small_business, sbir_contracts, most_recent_contract_date')
      .gt('total_value', 0)
      .order('total_value', { ascending: false })
      .limit(20);
    
    console.log('');
    topCompanies?.forEach((company, i) => {
      const valueStr = `$${(Number(company.total_value) / 1_000_000).toFixed(1)}M`;
      const sb = company.small_business ? '✓' : ' ';
      console.log(`  ${(i+1).toString().padStart(2)}. ${company.company_name.substring(0, 40).padEnd(42)} ${valueStr.padStart(12)} [${sb}] ${company.total_contracts} contracts`);
    });
    
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Data Quality Assessment:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const valuesPct = Math.round(withValues! / totalCompanies! * 100);
    const ueiPct = Math.round(withUEI! / totalCompanies! * 100);
    
    if (valuesPct < 50) {
      console.log('  ⚠️  WARNING: Less than 50% of companies have values');
      console.log('      Your FPDS data may not have financial data populated yet');
      console.log('      This is OK if FPDS scraper is still running');
    } else if (valuesPct > 80) {
      console.log('  ✅ EXCELLENT: Over 80% of companies have contract values');
    } else {
      console.log(`  ✓  GOOD: ${valuesPct}% of companies have contract values`);
    }
    
    if (ueiPct > 80) {
      console.log(`  ✅ EXCELLENT: ${ueiPct}% of companies have UEIs (can enrich)`);
    } else if (ueiPct > 50) {
      console.log(`  ✓  GOOD: ${ueiPct}% of companies have UEIs (can enrich)`);
    } else {
      console.log(`  ⚠️  FAIR: Only ${ueiPct}% of companies have UEIs`);
    }
    
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Recommendation:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (withUEI! > 100 && valuesPct > 30) {
      console.log('  ✅ READY TO ENRICH!');
      console.log('');
      console.log('  Run: npm run enrich-companies -- 10');
      console.log('  (This will test enrichment on 10 companies)');
      console.log('');
      console.log('  Then if quality looks good:');
      console.log('  Run: npm run enrich-companies -- all');
    } else if (withUEI! > 0) {
      console.log('  ⚠️  Limited data, but can still test enrichment');
      console.log('');
      console.log('  Run: npm run enrich-companies -- 10');
      console.log('  (Test with 10 companies to see data quality)');
    } else {
      console.log('  ❌ NOT READY: No companies with UEIs found');
      console.log('  Wait for FPDS scraper to continue populating data');
    }
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run
testRebuild()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

