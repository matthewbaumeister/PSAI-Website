#!/usr/bin/env tsx
/**
 * Company Intelligence Enrichment - Master Script
 * Enriches companies with FREE data sources:
 * 1. SAM.gov Entity Management API
 * 2. SEC EDGAR (public companies only)
 * 
 * Usage:
 *   npm run enrich-companies          # Enrich 100 companies
 *   npm run enrich-companies -- 500   # Enrich 500 companies
 *   npm run enrich-companies -- all   # Enrich all companies
 */

import 'dotenv/config';
import { batchEnrichFromFPDS } from './src/lib/company-intelligence/sam-entity-enrichment';
import { batchEnrichPublicCompanies } from './src/lib/company-intelligence/sec-edgar-enrichment';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getEnrichmentStats() {
  // Total companies in FPDS
  const { count: totalCompanies } = await supabase
    .from('fpds_company_stats')
    .select('*', { count: 'exact', head: true });

  // Enriched companies
  const { count: enrichedCompanies } = await supabase
    .from('fpds_company_stats')
    .select('*', { count: 'exact', head: true })
    .eq('intelligence_enriched', true);

  // Public companies found
  const { count: publicCompanies } = await supabase
    .from('company_intelligence')
    .select('*', { count: 'exact', head: true })
    .eq('is_public_company', true);

  return {
    totalCompanies: totalCompanies || 0,
    enrichedCompanies: enrichedCompanies || 0,
    publicCompanies: publicCompanies || 0,
    percentEnriched: totalCompanies ? ((enrichedCompanies / totalCompanies) * 100).toFixed(1) : 0,
  };
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   Company Intelligence Enrichment (FREE Data Sources)     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Get command line args
  const args = process.argv.slice(2);
  const batchSize = args[0] === 'all' ? 10000 : parseInt(args[0]) || 100;

  console.log('📊 Current Status:');
  const stats = await getEnrichmentStats();
  console.log(`   Total Companies: ${stats.totalCompanies.toLocaleString()}`);
  console.log(`   Enriched: ${stats.enrichedCompanies.toLocaleString()} (${stats.percentEnriched}%)`);
  console.log(`   Public Companies Found: ${stats.publicCompanies.toLocaleString()}`);
  console.log('');

  // Phase 1: SAM.gov Entity Enrichment
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Phase 1: SAM.gov Entity Enrichment (FREE)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Enriching ${batchSize} companies with SAM.gov Entity data...\n`);

  const startTime = Date.now();
  await batchEnrichFromFPDS(batchSize);
  const samDuration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n✓ SAM.gov enrichment complete in ${samDuration}s\n`);

  // Phase 2: SEC EDGAR Enrichment (Public Companies)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Phase 2: SEC EDGAR Enrichment (Public Companies Only)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Checking for public companies and enriching with SEC filings...\n');

  const secStartTime = Date.now();
  const secBatchSize = Math.min(batchSize, 100); // Limit SEC to 100 at a time (rate limits)
  await batchEnrichPublicCompanies(secBatchSize);
  const secDuration = ((Date.now() - secStartTime) / 1000).toFixed(1);

  console.log(`\n✓ SEC enrichment complete in ${secDuration}s\n`);

  // Final Stats
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Final Results');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const finalStats = await getEnrichmentStats();
  const newlyEnriched = finalStats.enrichedCompanies - stats.enrichedCompanies;
  const newPublic = finalStats.publicCompanies - stats.publicCompanies;

  console.log(`\n📈 New Enrichments:`);
  console.log(`   Companies Enriched: +${newlyEnriched.toLocaleString()}`);
  console.log(`   Public Companies Found: +${newPublic.toLocaleString()}`);
  console.log(`\n📊 Updated Totals:`);
  console.log(`   Total Enriched: ${finalStats.enrichedCompanies.toLocaleString()} (${finalStats.percentEnriched}%)`);
  console.log(`   Public Companies: ${finalStats.publicCompanies.toLocaleString()}`);
  console.log(`\n⏱️  Total Time: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
  console.log(`💰 Total Cost: $0 (FREE data sources!)\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Next Steps:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. Check data quality: SELECT * FROM enrichment_status_summary;');
  console.log('2. View public companies: SELECT * FROM public_companies_summary;');
  console.log('3. Run again to enrich more: npm run enrich-companies');
  console.log('4. Enrich all: npm run enrich-companies -- all');
  console.log('');
}

// Run if executed directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('\n❌ Error:', error);
      process.exit(1);
    });
}

export { main };

