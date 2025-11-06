#!/usr/bin/env node
/**
 * GitHub Actions Runner: Army xTech/Innovation Daily Scraper
 */

import 'dotenv/config';
import ArmyXTechScraper from '../src/lib/army-xtech-scraper';
import { sendCronSuccessEmail, sendCronFailureEmail } from '../src/lib/cron-notifications';

async function main() {
  const startTime = Date.now();
  const dateStr = new Date().toISOString().split('T')[0];

  try {
    console.log('[GitHub Actions] Starting Army Innovation daily scraper...');
    
    const xtechScraper = new ArmyXTechScraper();
    const xtechStats = await xtechScraper.scrapeActive();

    const duration = Math.floor((Date.now() - startTime) / 1000);

    await sendCronSuccessEmail({
      jobName: 'Army XTECH Innovation Tracker',
      success: true,
      date: dateStr,
      duration,
      stats: {
        active_competitions_found: xtechStats.competitionsFound,
        competitions_processed: xtechStats.competitionsProcessed,
        new_competitions: xtechStats.competitionsInserted,
        updated_competitions: xtechStats.competitionsUpdated,
        new_winners: xtechStats.winnersFound,
        new_finalists: xtechStats.finalistsFound,
        errors: xtechStats.errors
      }
    });
    
    console.log('[GitHub Actions] ✅ Army Innovation scraper completed successfully');
    process.exit(0);
    
  } catch (error: any) {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    console.error('[GitHub Actions] ❌ Army Innovation scraper failed:', error);
    
    await sendCronFailureEmail({
      jobName: 'Army XTECH Innovation Tracker',
      success: false,
      date: dateStr,
      duration,
      error: error.message || 'Unknown error'
    });
    
    process.exit(1);
  }
}

main();

