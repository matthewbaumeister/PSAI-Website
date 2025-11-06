#!/usr/bin/env node
/**
 * GitHub Actions Runner: SBIR/STTR Opportunities Daily Scraper
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { mapToSupabaseColumns } from '../src/lib/sbir-column-mapper-clean';
import { smartUpsertTopics } from '../src/lib/smart-upsert-logic';
import { InstructionDocumentService } from '../src/lib/instruction-document-service';
import { sendCronSuccessEmail, sendCronFailureEmail } from '../src/lib/cron-notifications';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const startTime = Date.now();
  const dateStr = new Date().toISOString().split('T')[0];
  
  const { data: logEntry } = await supabase
    .from('sbir_scraper_log')
    .insert({
      scrape_type: 'daily',
      date_range: 'Active opportunities',
      status: 'running',
      started_at: new Date().toISOString()
    })
    .select()
    .single();

  try {
    console.log('[GitHub Actions] Starting SBIR/STTR daily scraper...');
    
    const { count: countBefore } = await supabase
      .from('sbir_final')
      .select('*', { count: 'exact', head: true });
    
    // Fetch active SBIR opportunities from DSIP API
    const response = await fetch(
      'https://www.sbir.gov/api/solicitations.json?keyword=&company=&agency=&branch=&program=&phase=&ri=&state=&keyword_type=all&solicitation_year=&solicitation_status=Open',
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (!response.ok) {
      throw new Error(`DSIP API returned ${response.status}`);
    }
    
    const data = await response.json();
    const rawTopics = data || [];
    
    console.log(`[GitHub Actions] Found ${rawTopics.length} active SBIR opportunities`);
    
    // Map to Supabase schema
    const mappedTopics = rawTopics.map((topic: any) => mapToSupabaseColumns(topic));
    
    // Smart upsert
    const { inserted, updated, skipped, errors } = await smartUpsertTopics(mappedTopics);
    
    // Process instruction documents
    const instructionService = new InstructionDocumentService();
    await instructionService.processQueuedDocuments(25);
    
    const { count: countAfter } = await supabase
      .from('sbir_final')
      .select('*', { count: 'exact', head: true });
    
    const duration = Math.floor((Date.now() - startTime) / 1000);
    
    if (logEntry) {
      await supabase
        .from('sbir_scraper_log')
        .update({
          status: 'completed',
          duration_seconds: duration,
          records_found: rawTopics.length,
          records_inserted: inserted,
          records_updated: updated,
          records_errors: errors.length
        })
        .eq('id', logEntry.id);
    }
    
    await sendCronSuccessEmail({
      jobName: 'DSIP Opportunities',
      success: true,
      date: dateStr,
      duration,
      stats: {
        active_topics_found: rawTopics.length,
        new_topics: inserted,
        updated_topics: updated,
        skipped: skipped,
        errors: errors.length,
        total_in_db: countAfter || 0
      }
    });
    
    console.log('[GitHub Actions] ✅ SBIR scraper completed successfully');
    process.exit(0);
    
  } catch (error: any) {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    console.error('[GitHub Actions] ❌ SBIR scraper failed:', error);
    
    if (logEntry) {
      await supabase
        .from('sbir_scraper_log')
        .update({
          status: 'failed',
          duration_seconds: duration,
          error_message: error.message || 'Unknown error'
        })
        .eq('id', logEntry.id);
    }
    
    await sendCronFailureEmail({
      jobName: 'DSIP Opportunities',
      success: false,
      date: dateStr,
      duration,
      error: error.message || 'Unknown error'
    });
    
    process.exit(1);
  }
}

main();

