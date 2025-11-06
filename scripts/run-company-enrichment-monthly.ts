#!/usr/bin/env node
/**
 * GitHub Actions Runner: Company Intelligence Monthly Enrichment
 * 
 * Enriches ALL companies with FREE data sources:
 * 1. SAM.gov Entity Management API (company details, certs, POCs)
 * 2. SEC EDGAR (public company filings, financials)
 * 
 * This is a LARGE batch enrichment that processes thousands of companies.
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { batchEnrichFromFPDS } from '../src/lib/company-intelligence/sam-entity-enrichment';
import { batchEnrichPublicCompanies } from '../src/lib/company-intelligence/sec-edgar-enrichment';
import { sendCronSuccessEmail, sendCronFailureEmail } from '../src/lib/cron-notifications';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function rebuildCompanyStats() {
  console.log('[GitHub Actions] Rebuilding company stats from FPDS contracts...');
  
  // Truncate and rebuild fpds_company_stats
  await supabase.from('fpds_company_stats').delete().neq('id', 0);
  
  await supabase.rpc('rebuild_fpds_company_stats');
  
  console.log('[GitHub Actions] Company stats rebuilt');
}

async function getEnrichmentStats() {
  const { count: totalCompanies } = await supabase
    .from('fpds_company_stats')
    .select('*', { count: 'exact', head: true });

  const { count: enrichedCompanies } = await supabase
    .from('fpds_company_stats')
    .select('*', { count: 'exact', head: true })
    .eq('intelligence_enriched', true);

  const { count: publicCompanies } = await supabase
    .from('company_intelligence')
    .select('*', { count: 'exact', head: true })
    .eq('is_public_company', true);

  return {
    totalCompanies: totalCompanies || 0,
    enrichedCompanies: enrichedCompanies || 0,
    publicCompanies: publicCompanies || 0,
    percentEnriched: totalCompanies ? (((enrichedCompanies || 0) / totalCompanies) * 100).toFixed(1) : 0,
  };
}

async function main() {
  const startTime = Date.now();
  const dateStr = new Date().toISOString().split('T')[0];
  
  const { data: logEntry } = await supabase
    .from('company_enrichment_log')
    .insert({
      enrichment_type: 'monthly_full',
      status: 'running',
      started_at: new Date().toISOString()
    })
    .select()
    .single();

  try {
    console.log('[GitHub Actions] ========================================');
    console.log('[GitHub Actions] Company Intelligence Monthly Enrichment');
    console.log('[GitHub Actions] ========================================');
    console.log('');
    
    // Get initial stats
    const statsBefore = await getEnrichmentStats();
    console.log('[GitHub Actions] Initial Stats:');
    console.log(`[GitHub Actions]   Total Companies: ${statsBefore.totalCompanies.toLocaleString()}`);
    console.log(`[GitHub Actions]   Enriched: ${statsBefore.enrichedCompanies.toLocaleString()} (${statsBefore.percentEnriched}%)`);
    console.log(`[GitHub Actions]   Public Companies: ${statsBefore.publicCompanies.toLocaleString()}`);
    console.log('');
    
    // Step 1: Rebuild company stats from latest FPDS data
    console.log('[GitHub Actions] ========================================');
    console.log('[GitHub Actions] STEP 1: Rebuild Company Stats');
    console.log('[GitHub Actions] ========================================');
    await rebuildCompanyStats();
    console.log('');
    
    // Step 2: SAM.gov Entity Enrichment (batch size: 2000)
    console.log('[GitHub Actions] ========================================');
    console.log('[GitHub Actions] STEP 2: SAM.gov Entity Enrichment');
    console.log('[GitHub Actions] ========================================');
    console.log('[GitHub Actions] Enriching up to 2,000 companies with SAM.gov data...');
    console.log('');
    
    await batchEnrichFromFPDS(2000);
    console.log('');
    console.log('[GitHub Actions] SAM.gov enrichment complete');
    console.log('');
    
    // Step 3: SEC EDGAR Enrichment (batch size: 500, rate limited)
    console.log('[GitHub Actions] ========================================');
    console.log('[GitHub Actions] STEP 3: SEC EDGAR Enrichment');
    console.log('[GitHub Actions] ========================================');
    console.log('[GitHub Actions] Enriching public companies with SEC filings...');
    console.log('');
    
    await batchEnrichPublicCompanies(500);
    console.log('');
    console.log('[GitHub Actions] SEC enrichment complete');
    console.log('');
    
    // Get final stats
    const statsAfter = await getEnrichmentStats();
    const newlyEnriched = statsAfter.enrichedCompanies - statsBefore.enrichedCompanies;
    const newPublic = statsAfter.publicCompanies - statsBefore.publicCompanies;
    
    console.log('[GitHub Actions] ========================================');
    console.log('[GitHub Actions] Final Results');
    console.log('[GitHub Actions] ========================================');
    console.log(`[GitHub Actions]   Total Companies: ${statsAfter.totalCompanies.toLocaleString()}`);
    console.log(`[GitHub Actions]   Enriched: ${statsAfter.enrichedCompanies.toLocaleString()} (${statsAfter.percentEnriched}%)`);
    console.log(`[GitHub Actions]   Newly Enriched: ${newlyEnriched.toLocaleString()}`);
    console.log(`[GitHub Actions]   Public Companies: ${statsAfter.publicCompanies.toLocaleString()} (+${newPublic} new)`);
    console.log('');
    
    const duration = Math.floor((Date.now() - startTime) / 1000);
    
    if (logEntry) {
      await supabase
        .from('company_enrichment_log')
        .update({
          status: 'completed',
          duration_seconds: duration,
          companies_processed: newlyEnriched,
          companies_enriched: newlyEnriched,
          public_companies_found: newPublic
        })
        .eq('id', logEntry.id);
    }
    
    await sendCronSuccessEmail({
      jobName: 'Company Intelligence Enrichment (Monthly)',
      success: true,
      date: dateStr,
      duration,
      stats: {
        total_companies: statsAfter.totalCompanies,
        companies_enriched_total: statsAfter.enrichedCompanies,
        newly_enriched: newlyEnriched,
        public_companies: statsAfter.publicCompanies,
        new_public_companies: newPublic,
        percent_enriched: statsAfter.percentEnriched + '%',
        duration_minutes: Math.floor(duration / 60)
      }
    });
    
    console.log('[GitHub Actions] ✅ Company enrichment completed successfully');
    process.exit(0);
    
  } catch (error: any) {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    console.error('[GitHub Actions] ❌ Company enrichment failed:', error);
    
    if (logEntry) {
      await supabase
        .from('company_enrichment_log')
        .update({
          status: 'failed',
          duration_seconds: duration,
          error_message: error.message || 'Unknown error'
        })
        .eq('id', logEntry.id);
    }
    
    await sendCronFailureEmail({
      jobName: 'Company Intelligence Enrichment (Monthly)',
      success: false,
      date: dateStr,
      duration,
      error: error.message || 'Unknown error'
    });
    
    process.exit(1);
  }
}

main();

