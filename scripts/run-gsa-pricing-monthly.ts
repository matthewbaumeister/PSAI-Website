#!/usr/bin/env node
/**
 * GitHub Actions Runner: GSA Pricing Data Collection Monthly
 * 
 * Downloads, parses, and imports GSA price list data:
 * - Step 1: Download ~3,000 price list Excel files
 * - Step 2: Parse labor categories and rates
 * - Step 3: Import to Supabase
 */

import 'dotenv/config';
import { spawn } from 'child_process';
import { sendCronSuccessEmail, sendCronFailureEmail } from '../src/lib/cron-notifications';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runCommand(command: string, args: string[], input?: string): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const proc = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    
    // Send input if provided
    if (input) {
      proc.stdin.write(input);
      proc.stdin.end();
    }
    
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
  
  try {
    console.log('[GitHub Actions] Starting GSA Pricing monthly collection...');
    console.log('[GitHub Actions] This is a LONG-RUNNING job (2-4 hours)');
    console.log('');
    
    // Get counts before
    const { count: priceListsBefore } = await supabase
      .from('gsa_price_lists')
      .select('*', { count: 'exact', head: true });
    
    const { count: laborCategoriesBefore } = await supabase
      .from('gsa_labor_categories')
      .select('*', { count: 'exact', head: true });
    
    console.log(`[GitHub Actions] Current database counts:`);
    console.log(`[GitHub Actions]   Price Lists: ${priceListsBefore || 0}`);
    console.log(`[GitHub Actions]   Labor Categories: ${laborCategoriesBefore || 0}`);
    console.log('');
    
    // Step 1: Download (use 'n' for full mode in GitHub Actions)
    console.log('[GitHub Actions] STEP 1/3: Downloading price lists...');
    const downloadResult = await runCommand('python3', [
      'scripts/gsa-pricing-downloader.py'
    ], 'n\n');
    
    if (downloadResult.code !== 0) {
      throw new Error(`Download failed with code ${downloadResult.code}:\n${downloadResult.stderr}`);
    }
    
    // Step 2: Parse
    console.log('[GitHub Actions] STEP 2/3: Parsing price lists...');
    const parseResult = await runCommand('python3', [
      'scripts/gsa-pricing-parser.py'
    ], 'n\n');
    
    if (parseResult.code !== 0) {
      throw new Error(`Parse failed with code ${parseResult.code}:\n${parseResult.stderr}`);
    }
    
    // Step 3: Import
    console.log('[GitHub Actions] STEP 3/3: Importing to database...');
    const importResult = await runCommand('python3', [
      'scripts/gsa-pricing-importer.py'
    ], 'y\n');
    
    if (importResult.code !== 0) {
      throw new Error(`Import failed with code ${importResult.code}:\n${importResult.stderr}`);
    }
    
    // Get counts after
    const { count: priceListsAfter } = await supabase
      .from('gsa_price_lists')
      .select('*', { count: 'exact', head: true });
    
    const { count: laborCategoriesAfter } = await supabase
      .from('gsa_labor_categories')
      .select('*', { count: 'exact', head: true });
    
    // Get pricing stats
    const { data: stats } = await supabase
      .rpc('get_gsa_pricing_stats')
      .single();
    
    const duration = Math.floor((Date.now() - startTime) / 1000);
    const newPriceLists = (priceListsAfter || 0) - (priceListsBefore || 0);
    const newLaborCategories = (laborCategoriesAfter || 0) - (laborCategoriesBefore || 0);
    
    await sendCronSuccessEmail({
      jobName: 'GSA Pricing Data Collection',
      success: true,
      date: dateStr,
      duration,
      stats: {
        new_price_lists: newPriceLists,
        new_labor_categories: newLaborCategories,
        total_price_lists: priceListsAfter || 0,
        total_labor_categories: laborCategoriesAfter || 0,
        contractors_with_pricing: (stats as any)?.contractors_with_pricing || 0,
        avg_hourly_rate: (stats as any)?.avg_hourly_rate || 0,
        min_hourly_rate: (stats as any)?.min_hourly_rate || 0,
        max_hourly_rate: (stats as any)?.max_hourly_rate || 0
      }
    });
    
    console.log('[GitHub Actions] ✅ GSA Pricing collection completed successfully');
    process.exit(0);
    
  } catch (error: any) {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    console.error('[GitHub Actions] ❌ GSA Pricing collection failed:', error);
    
    await sendCronFailureEmail({
      jobName: 'GSA Pricing Data Collection',
      success: false,
      date: dateStr,
      duration,
      error: error.message || 'Unknown error'
    });
    
    process.exit(1);
  }
}

main();


