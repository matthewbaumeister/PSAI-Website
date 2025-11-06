#!/usr/bin/env node
/**
 * GitHub Actions Runner: Congressional Trades Monthly Scraper (House + Senate)
 * 
 * Scrapes BOTH chambers for current + previous year:
 * - House: PDF parsing from clerk.house.gov
 * - Senate: HTML parsing from efdsearch.senate.gov
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
  
  const currentYear = new Date().getFullYear();
  const prevYear = currentYear - 1;
  
  const { data: logEntry } = await supabase
    .from('congressional_trades_scraper_log')
    .insert({
      scrape_type: 'monthly',
      start_year: prevYear,
      end_year: currentYear,
      status: 'running',
      started_at: new Date().toISOString()
    })
    .select()
    .single();

  try {
    console.log('[GitHub Actions] Starting Congressional Trades monthly scraper...');
    console.log('[GitHub Actions] Scraping BOTH House and Senate');
    console.log(`[GitHub Actions] Years: ${prevYear} - ${currentYear}`);
    console.log('');
    
    const { count: countBefore } = await supabase
      .from('congressional_stock_trades')
      .select('*', { count: 'exact', head: true });
    
    const { count: houseBefore } = await supabase
      .from('congressional_stock_trades')
      .select('*', { count: 'exact', head: true })
      .eq('chamber', 'House');
    
    const { count: senateBefore } = await supabase
      .from('congressional_stock_trades')
      .select('*', { count: 'exact', head: true })
      .eq('chamber', 'Senate');
    
    console.log(`[GitHub Actions] Current database counts:`);
    console.log(`[GitHub Actions]   Total: ${countBefore || 0}`);
    console.log(`[GitHub Actions]   House: ${houseBefore || 0}`);
    console.log(`[GitHub Actions]   Senate: ${senateBefore || 0}`);
    console.log('');
    
    // Run the Python scraper
    const result = await runCommand('python3', [
      'scripts/scrape_congress_trades.py',
      prevYear.toString(),
      currentYear.toString(),
      'monthly'
    ]);
    
    if (result.code !== 0) {
      throw new Error(`Python scraper exited with code ${result.code}:\n${result.stderr}`);
    }
    
    const { count: countAfter } = await supabase
      .from('congressional_stock_trades')
      .select('*', { count: 'exact', head: true });
    
    const { count: houseAfter } = await supabase
      .from('congressional_stock_trades')
      .select('*', { count: 'exact', head: true })
      .eq('chamber', 'House');
    
    const { count: senateAfter } = await supabase
      .from('congressional_stock_trades')
      .select('*', { count: 'exact', head: true })
      .eq('chamber', 'Senate');
    
    // Get stats
    const { data: stats } = await supabase
      .rpc('get_congressional_trades_stats')
      .single();
    
    const duration = Math.floor((Date.now() - startTime) / 1000);
    const newTrades = (countAfter || 0) - (countBefore || 0);
    const newHouse = (houseAfter || 0) - (houseBefore || 0);
    const newSenate = (senateAfter || 0) - (senateBefore || 0);
    
    if (logEntry) {
      await supabase
        .from('congressional_trades_scraper_log')
        .update({
          status: 'completed',
          duration_seconds: duration,
          total_trades_found: newTrades > 0 ? newTrades : 0,
          new_trades_inserted: newTrades > 0 ? newTrades : 0
        })
        .eq('id', logEntry.id);
    }
    
    await sendCronSuccessEmail({
      jobName: 'Congressional Stock Trades (House + Senate)',
      success: true,
      date: dateStr,
      duration,
      stats: {
        years_scraped: `${prevYear}-${currentYear}`,
        new_trades_total: newTrades,
        new_house_trades: newHouse,
        new_senate_trades: newSenate,
        total_trades_in_db: countAfter || 0,
        house_trades: houseAfter || 0,
        senate_trades: senateAfter || 0,
        total_members: stats?.total_members || 0,
        defense_trades: stats?.defense_trades || 0
      }
    });
    
    console.log('[GitHub Actions] ✅ Congressional trades scraper completed successfully');
    process.exit(0);
    
  } catch (error: any) {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    console.error('[GitHub Actions] ❌ Congressional trades scraper failed:', error);
    
    if (logEntry) {
      await supabase
        .from('congressional_trades_scraper_log')
        .update({
          status: 'failed',
          duration_seconds: duration,
          error_message: error.message || 'Unknown error'
        })
        .eq('id', logEntry.id);
    }
    
    await sendCronFailureEmail({
      jobName: 'Congressional Stock Trades (House + Senate)',
      success: false,
      date: dateStr,
      duration,
      error: error.message || 'Unknown error'
    });
    
    process.exit(1);
  }
}

main();

