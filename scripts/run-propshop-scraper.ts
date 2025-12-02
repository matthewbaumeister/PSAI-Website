#!/usr/bin/env ts-node

/**
 * CLI runner for PropShop.ai Government Contract Scraper
 */

import { runFullContractScraper } from '../src/lib/propshop-gov-contract-scraper';

const daysBack = parseInt(process.argv[2]) || 30;

console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║           PROPSHOP.AI - GOV CONTRACT SCRAPER                      ║
║                                                                   ║
║  The ultimate government contract news scraper                    ║
║  Extracts EVERY detail, leaves NO data behind                     ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝

Configuration:
  Days back: ${daysBack}
  Target: defense.gov contract news
  Destination: opportunity_master table

Starting in 3 seconds...
`);

setTimeout(() => {
  runFullContractScraper(daysBack)
    .then(() => {
      console.log('\n✅ Scraping completed successfully!\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Scraping failed:', error);
      process.exit(1);
    });
}, 3000);

