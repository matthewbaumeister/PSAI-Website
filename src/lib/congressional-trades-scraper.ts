/**
 * ============================================
 * Congressional Stock Trades Scraper
 * ============================================
 * 
 * Integrates with Python scraper to fetch congressional stock trades
 * from official government sources (house.gov & senate.gov)
 * 
 * Two modes:
 *   - HISTORICAL: One-time backfill from 2012-present
 *   - DAILY: Daily updates of current year only
 * 
 * Data captured:
 *   - Member name and chamber
 *   - Transaction details (date, type, amount range)
 *   - Stock ticker and description
 *   - Filing URLs for verification
 * 
 * ============================================
 */

import 'dotenv/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { spawn } from 'child_process';

// ============================================
// Types
// ============================================

interface CongressionalTrade {
  member_name: string;
  chamber: 'House' | 'Senate';
  transaction_date: string;
  disclosure_date: string;
  ticker: string | null;
  asset_description: string;
  transaction_type: 'purchase' | 'sale' | 'exchange' | 'unknown';
  amount_range: string;
  filing_url: string;
}

interface ScraperStats {
  total_trades: number;
  new_trades: number;
  updated_trades: number;
  errors: number;
  start_time: Date;
  end_time: Date;
  duration_seconds: number;
}

// ============================================
// Main Scraper Class
// ============================================

export class CongressionalTradesScraper {
  private supabase: SupabaseClient;
  private stats: ScraperStats;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials in environment variables');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.stats = this.initStats();
  }

  private initStats(): ScraperStats {
    return {
      total_trades: 0,
      new_trades: 0,
      updated_trades: 0,
      errors: 0,
      start_time: new Date(),
      end_time: new Date(),
      duration_seconds: 0
    };
  }

  /**
   * Initial historical backfill from 2012 to present
   * Run this ONCE to populate historical data
   */
  async scrapeHistoricalTrades(startYear: number = 2012): Promise<void> {
    const currentYear = new Date().getFullYear();
    const logId = await this.startScraperLog('historical', `${startYear}-${currentYear}`);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`CONGRESSIONAL STOCK TRADES: Historical Backfill`);
    console.log(`Years: ${startYear} - ${currentYear}`);
    console.log(`${'='.repeat(60)}\n`);
    
    try {
      this.stats = this.initStats();
      
      const trades = await this.runPythonScraper('historical', startYear, currentYear);
      
      console.log(`\nPython scraper returned ${trades.length} trades`);
      console.log(`Storing in database...\n`);
      
      await this.storeTrades(trades);
      
      this.stats.end_time = new Date();
      this.stats.duration_seconds = Math.floor(
        (this.stats.end_time.getTime() - this.stats.start_time.getTime()) / 1000
      );
      
      await this.endScraperLog(logId, 'completed');
      
      this.printStats('HISTORICAL STOCK TRADES BACKFILL');
      
    } catch (error: any) {
      await this.endScraperLog(logId, 'failed', error.message);
      console.error(`\nHistorical backfill failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Daily incremental update - scrape only current year
   * Run this via cron job daily
   */
  async scrapeDailyUpdates(): Promise<void> {
    const currentYear = new Date().getFullYear();
    const logId = await this.startScraperLog('daily', `${currentYear}`);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`CONGRESSIONAL STOCK TRADES: Daily Update`);
    console.log(`Year: ${currentYear}`);
    console.log(`${'='.repeat(60)}\n`);
    
    try {
      this.stats = this.initStats();
      
      const trades = await this.runPythonScraper('daily', currentYear, currentYear);
      
      console.log(`\nPython scraper returned ${trades.length} trades`);
      console.log(`Storing in database...\n`);
      
      await this.storeTrades(trades);
      
      this.stats.end_time = new Date();
      this.stats.duration_seconds = Math.floor(
        (this.stats.end_time.getTime() - this.stats.start_time.getTime()) / 1000
      );
      
      await this.endScraperLog(logId, 'completed');
      
      this.printStats('DAILY STOCK TRADES UPDATE');
      
    } catch (error: any) {
      await this.endScraperLog(logId, 'failed', error.message);
      console.error(`\nDaily update failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Execute Python scraper script
   */
  private async runPythonScraper(
    mode: 'historical' | 'daily',
    startYear: number,
    endYear: number
  ): Promise<CongressionalTrade[]> {
    console.log(`Launching Python scraper (${mode} mode)...`);
    console.log(`This may take a while...\n`);
    
    return new Promise((resolve, reject) => {
      const args = [
        'scripts/scrape_congress_trades.py',
        '--mode', mode,
        '--start-year', startYear.toString(),
        '--end-year', endYear.toString()
      ];

      const pythonProcess = spawn('python3', args, {
        cwd: process.cwd()
      });

      let dataString = '';
      let errorString = '';

      pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        const message = data.toString();
        errorString += message;
        // Echo Python logging to console
        process.stdout.write(message);
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const trades = JSON.parse(dataString);
            resolve(trades);
          } catch (e: any) {
            reject(new Error(`Failed to parse JSON from Python script: ${e.message}`));
          }
        } else {
          reject(new Error(`Python script exited with code ${code}\n${errorString}`));
        }
      });

      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to start Python script: ${error.message}`));
      });
    });
  }

  /**
   * Store trades in database with upsert logic
   */
  private async storeTrades(trades: CongressionalTrade[]): Promise<void> {
    this.stats.total_trades = trades.length;
    
    if (trades.length === 0) {
      console.log('No trades to store.');
      return;
    }

    // Process in batches to avoid overwhelming the database
    const BATCH_SIZE = 100;
    const batches = [];
    
    for (let i = 0; i < trades.length; i += BATCH_SIZE) {
      batches.push(trades.slice(i, i + BATCH_SIZE));
    }

    console.log(`Processing ${trades.length} trades in ${batches.length} batches...`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      process.stdout.write(`\rBatch ${i + 1}/${batches.length}...`);

      for (const trade of batch) {
        try {
          // Clean the trade data to prevent Unicode errors
          const cleanedTrade = {
            ...trade,
            asset_description: (trade.asset_description || '')
              .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
              .replace(/\\u0000/g, '')
              .trim() || 'Unknown Asset',
            transaction_date: trade.transaction_date || trade.disclosure_date || '2020-01-01',
            disclosure_date: trade.disclosure_date || trade.transaction_date || '2020-01-01',
          };
          
          // Skip obvious junk rows
          if (cleanedTrade.asset_description.length < 5 || 
              cleanedTrade.asset_description.startsWith('F S:')) {
            continue;
          }
          
          // Check if trade already exists
          const { data: existing } = await this.supabase
            .from('congressional_stock_trades')
            .select('id')
            .eq('member_name', cleanedTrade.member_name)
            .eq('transaction_date', cleanedTrade.transaction_date)
            .eq('ticker', cleanedTrade.ticker || '')
            .eq('transaction_type', cleanedTrade.transaction_type)
            .single();

          if (existing) {
            // Update existing
            const { error } = await this.supabase
              .from('congressional_stock_trades')
              .update({
                disclosure_date: cleanedTrade.disclosure_date,
                asset_description: cleanedTrade.asset_description,
                amount_range: cleanedTrade.amount_range,
                filing_url: cleanedTrade.filing_url,
                scraped_at: new Date().toISOString()
              })
              .eq('id', existing.id);

            if (error) {
              console.error(`\nError updating trade: ${error.message}`);
              this.stats.errors++;
            } else {
              this.stats.updated_trades++;
            }
          } else {
            // Insert new
            const { error } = await this.supabase
              .from('congressional_stock_trades')
              .insert({
                member_name: cleanedTrade.member_name,
                chamber: cleanedTrade.chamber,
                transaction_date: cleanedTrade.transaction_date,
                disclosure_date: cleanedTrade.disclosure_date,
                ticker: cleanedTrade.ticker,
                asset_description: cleanedTrade.asset_description,
                transaction_type: cleanedTrade.transaction_type,
                amount_range: cleanedTrade.amount_range,
                filing_url: cleanedTrade.filing_url,
                scraped_at: new Date().toISOString()
              });

            if (error) {
              // Check if it's a duplicate key error (race condition)
              if (error.code !== '23505') {
                console.error(`\nError inserting trade: ${error.message}`);
                this.stats.errors++;
              } else {
                this.stats.updated_trades++;
              }
            } else {
              this.stats.new_trades++;
            }
          }
        } catch (error: any) {
          console.error(`\nError processing trade: ${error.message}`);
          this.stats.errors++;
        }
      }
    }

    console.log(`\n\nStorage complete!`);
  }

  /**
   * Start scraper run log
   */
  private async startScraperLog(scrapeType: string, dateRange: string): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('congressional_trades_scraper_log')
        .insert({
          scrape_type: scrapeType,
          date_range: dateRange,
          status: 'running',
          started_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error(`Failed to create scraper log: ${error}`);
      return 0;
    }
  }

  /**
   * End scraper run log
   */
  private async endScraperLog(
    logId: number, 
    status: 'completed' | 'failed', 
    errorMessage?: string
  ): Promise<void> {
    if (!logId) return;

    try {
      await this.supabase
        .from('congressional_trades_scraper_log')
        .update({
          status,
          error_message: errorMessage,
          records_found: this.stats.total_trades,
          records_inserted: this.stats.new_trades,
          records_updated: this.stats.updated_trades,
          records_errors: this.stats.errors,
          duration_seconds: this.stats.duration_seconds
        })
        .eq('id', logId);
    } catch (error) {
      console.error(`Failed to update scraper log: ${error}`);
    }
  }

  /**
   * Print statistics
   */
  private printStats(mode: string): void {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${mode} COMPLETE`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Total trades processed: ${this.stats.total_trades}`);
    console.log(`New trades inserted:    ${this.stats.new_trades}`);
    console.log(`Trades updated:         ${this.stats.updated_trades}`);
    console.log(`Errors:                 ${this.stats.errors}`);
    console.log(`Duration:               ${this.stats.duration_seconds} seconds`);
    console.log(`${'='.repeat(60)}\n`);
  }
}

// ============================================
// CLI Entry Point
// ============================================

async function main() {
  const mode = process.argv[2] || 'daily';
  
  const scraper = new CongressionalTradesScraper();
  
  try {
    if (mode === 'historical') {
      const startYear = parseInt(process.argv[3]) || 2012;
      await scraper.scrapeHistoricalTrades(startYear);
    } else if (mode === 'daily') {
      await scraper.scrapeDailyUpdates();
    } else {
      console.error(`Unknown mode: ${mode}`);
      console.error(`Usage: tsx src/lib/congressional-trades-scraper.ts [historical|daily] [start_year]`);
      process.exit(1);
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error(`\nFatal error: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

