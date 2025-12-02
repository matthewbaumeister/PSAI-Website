#!/usr/bin/env node
/**
 * GitHub Actions Runner: GSA Schedules Monthly Scraper
 * 
 * This is a LARGE scrape that downloads and parses ALL GSA MAS SIN contractor lists.
 * Can take 2-6 hours depending on number of SINs.
 */

import 'dotenv/config';
import { spawn } from 'child_process';
import { sendCronSuccessEmail, sendCronFailureEmail } from '../src/lib/cron-notifications';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runCommand(command: string, args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const proc = spawn(command, args, { stdio: 'pipe' });
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      process.stdout.write(text);
    });
    
    proc.stderr.on('data', (data) => {
      const text = data.toString();
      stderr += text;
      process.stderr.write(text);
    });
    
    proc.on('close', (code) => {
      resolve({ stdout, stderr, code: code || 0 });
    });
  });
}

async function main() {
  const startTime = Date.now();
  const dateStr = new Date().toISOString().split('T')[0];
  
  const { data: logEntry } = await supabase
    .from('gsa_scraper_log')
    .insert({
      scrape_type: 'monthly_full',
      status: 'running',
      started_at: new Date().toISOString()
    })
    .select()
    .single();

  try {
    console.log('[GitHub Actions] Starting GSA Schedules monthly scraper...');
    console.log('[GitHub Actions] This is a LARGE scrape that downloads ALL GSA MAS SIN contractor lists');
    console.log('[GitHub Actions] Estimated time: 2-6 hours');
    
    const { count: countBefore } = await supabase
      .from('gsa_schedule_contracts')
      .select('*', { count: 'exact', head: true });
    
    // Step 1: Download all Excel files
    console.log('\n[GitHub Actions] ========================================');
    console.log('[GitHub Actions] STEP 1: Downloading Excel files from GSA eLibrary');
    console.log('[GitHub Actions] ========================================\n');
    
    const downloadResult = await runCommand('python3', [
      'scripts/gsa-elibrary-auto-download.py'
    ]);
    
    if (downloadResult.code !== 0) {
      throw new Error(`Download step failed with code ${downloadResult.code}`);
    }
    
    // Extract download stats from output
    const downloadedMatch = downloadResult.stdout.match(/Successfully downloaded:\s*(\d+)/);
    const filesDownloaded = downloadedMatch ? parseInt(downloadedMatch[1]) : 0;
    
    console.log(`[GitHub Actions] Downloaded ${filesDownloaded} Excel files`);
    
    // Step 2: Parse Excel files
    console.log('\n[GitHub Actions] ========================================');
    console.log('[GitHub Actions] STEP 2: Parsing Excel files');
    console.log('[GitHub Actions] ========================================\n');
    
    const parseResult = await runCommand('python3', [
      'scripts/gsa-schedule-scraper.py'
    ]);
    
    if (parseResult.code !== 0) {
      throw new Error(`Parse step failed with code ${parseResult.code}`);
    }
    
    // Extract parse stats from output
    const contractorsMatch = parseResult.stdout.match(/Total contractors parsed:\s*(\d+)/);
    const contractorsParsed = contractorsMatch ? parseInt(contractorsMatch[1]) : 0;
    
    console.log(`[GitHub Actions] Parsed ${contractorsParsed} contractors`);
    
    // Step 3: Upload to Supabase (assuming the parser does this)
    // Or we can add upload logic here if needed
    
    const { count: countAfter } = await supabase
      .from('gsa_schedule_contracts')
      .select('*', { count: 'exact', head: true });
    
    const duration = Math.floor((Date.now() - startTime) / 1000);
    const newContracts = (countAfter || 0) - (countBefore || 0);
    
    if (logEntry) {
      await supabase
        .from('gsa_scraper_log')
        .update({
          status: 'completed',
          duration_seconds: duration,
          files_downloaded: filesDownloaded,
          contractors_parsed: contractorsParsed,
          records_inserted: newContracts > 0 ? newContracts : 0
        })
        .eq('id', logEntry.id);
    }
    
    await sendCronSuccessEmail({
      jobName: 'GSA Schedule Contracts (Full Download)',
      success: true,
      date: dateStr,
      duration,
      stats: {
        files_downloaded: filesDownloaded,
        contractors_parsed: contractorsParsed,
        new_contracts: newContracts,
        total_contracts_in_db: countAfter || 0,
        duration_minutes: Math.floor(duration / 60)
      }
    });
    
    console.log('[GitHub Actions] ✅ GSA schedules scraper completed successfully');
    process.exit(0);
    
  } catch (error: any) {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    console.error('[GitHub Actions] ❌ GSA schedules scraper failed:', error);
    
    if (logEntry) {
      await supabase
        .from('gsa_scraper_log')
        .update({
          status: 'failed',
          duration_seconds: duration,
          error_message: error.message || 'Unknown error'
        })
        .eq('id', logEntry.id);
    }
    
    await sendCronFailureEmail({
      jobName: 'GSA Schedule Contracts (Full Download)',
      success: false,
      date: dateStr,
      duration,
      error: error.message || 'Unknown error'
    });
    
    process.exit(1);
  }
}

main();


