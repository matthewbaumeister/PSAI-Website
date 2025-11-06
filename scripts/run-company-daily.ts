#!/usr/bin/env node
/**
 * GitHub Actions Runner: Company Intelligence Daily Update
 * 
 * Runs after all contract scrapers complete:
 * 1. Rebuilds fpds_company_stats from latest contract data
 * 2. Enriches new companies with SAM.gov + SEC data
 * 3. Refreshes stale public company data (Mondays only)
 */

import 'dotenv/config';
import { dailyCompanyUpdate } from '../cron/daily-company-update';
import { sendCronSuccessEmail, sendCronFailureEmail } from '../src/lib/cron-notifications';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const startTime = Date.now();
  const dateStr = new Date().toISOString().split('T')[0];
  
  try {
    console.log('[GitHub Actions] Starting Company Intelligence daily update...');
    console.log('[GitHub Actions] This runs AFTER all contract scrapers complete');
    console.log('');
    
    // Get counts before
    const { count: companiesBefore } = await supabase
      .from('fpds_company_stats')
      .select('*', { count: 'exact', head: true });
    
    const { count: enrichedBefore } = await supabase
      .from('company_intelligence')
      .select('*', { count: 'exact', head: true });
    
    const { count: publicBefore } = await supabase
      .from('company_intelligence')
      .select('*', { count: 'exact', head: true })
      .eq('is_public_company', true);
    
    console.log(`[GitHub Actions] Current counts:`);
    console.log(`[GitHub Actions]   Company Stats: ${companiesBefore || 0}`);
    console.log(`[GitHub Actions]   Enriched: ${enrichedBefore || 0}`);
    console.log(`[GitHub Actions]   Public: ${publicBefore || 0}`);
    console.log('');
    
    // Run the daily update
    await dailyCompanyUpdate();
    
    // Get counts after
    const { count: companiesAfter } = await supabase
      .from('fpds_company_stats')
      .select('*', { count: 'exact', head: true });
    
    const { count: enrichedAfter } = await supabase
      .from('company_intelligence')
      .select('*', { count: 'exact', head: true });
    
    const { count: publicAfter } = await supabase
      .from('company_intelligence')
      .select('*', { count: 'exact', head: true })
      .eq('is_public_company', true);
    
    const duration = Math.floor((Date.now() - startTime) / 1000);
    const newCompanies = (companiesAfter || 0) - (companiesBefore || 0);
    const newEnriched = (enrichedAfter || 0) - (enrichedBefore || 0);
    const newPublic = (publicAfter || 0) - (publicBefore || 0);
    
    await sendCronSuccessEmail({
      jobName: 'Company Intelligence (Daily)',
      success: true,
      date: dateStr,
      duration,
      stats: {
        new_companies: newCompanies,
        new_enriched: newEnriched,
        new_public: newPublic,
        total_companies: companiesAfter || 0,
        total_enriched: enrichedAfter || 0,
        total_public: publicAfter || 0,
        enrichment_rate: companiesAfter ? ((enrichedAfter || 0) / companiesAfter * 100).toFixed(1) : 0
      }
    });
    
    console.log('[GitHub Actions] ✅ Company Intelligence daily update completed successfully');
    process.exit(0);
    
  } catch (error: any) {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    console.error('[GitHub Actions] ❌ Company Intelligence daily update failed:', error);
    
    await sendCronFailureEmail({
      jobName: 'Company Intelligence (Daily)',
      success: false,
      date: dateStr,
      duration,
      error: error.message || 'Unknown error'
    });
    
    process.exit(1);
  }
}

main();

