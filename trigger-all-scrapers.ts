/**
 * Manual Scraper Trigger Script
 * 
 * Triggers all cron jobs manually to populate scraper_log tables
 */

import { config } from 'dotenv';

// Load .env.local explicitly
config({ path: '.env.local' });

const CRON_SECRET = process.env.CRON_SECRET;
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.prop-shop.ai';

if (!CRON_SECRET) {
  console.error('❌ CRON_SECRET not found in environment');
  process.exit(1);
}

interface Scraper {
  name: string;
  path: string;
}

const scrapers: Scraper[] = [
  { name: 'Army Innovation (XTECH)', path: '/api/army-innovation/test-cron' },
  { name: 'SAM.gov Opportunities', path: '/api/cron/scrape-sam-gov' },
  { name: 'FPDS Contracts', path: '/api/cron/scrape-fpds' },
  { name: 'Congress.gov Bills', path: '/api/cron/scrape-congress-gov' },
  { name: 'DoD Contract News', path: '/api/cron/scrape-dod-news' },
  { name: 'SBIR/STTR Awards', path: '/api/cron/sbir-scraper' }
];

async function triggerScraper(scraper: Scraper): Promise<void> {
  console.log(`\n🚀 Triggering: ${scraper.name}...`);
  
  try {
    const response = await fetch(`${BASE_URL}${scraper.path}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${scraper.name} - Success!`);
      console.log(`   Response:`, JSON.stringify(data, null, 2).substring(0, 200) + '...');
    } else {
      const errorText = await response.text();
      console.error(`❌ ${scraper.name} - Failed (${response.status})`);
      console.error(`   Error:`, errorText.substring(0, 200));
    }
  } catch (error: any) {
    console.error(`❌ ${scraper.name} - Exception:`, error.message);
  }
  
  // Wait 2 seconds between scrapers to avoid overwhelming the server
  await new Promise(resolve => setTimeout(resolve, 2000));
}

async function triggerAll() {
  console.log('===============================================');
  console.log('  Manual Scraper Trigger');
  console.log('===============================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Scrapers to trigger: ${scrapers.length}`);
  console.log('===============================================');
  
  for (const scraper of scrapers) {
    await triggerScraper(scraper);
  }
  
  console.log('\n===============================================');
  console.log('✅ All scrapers triggered!');
  console.log('===============================================');
  console.log('\nNext steps:');
  console.log('1. Wait 1-2 minutes for scrapers to complete');
  console.log('2. Refresh your admin dashboard at /admin/scrapers');
  console.log('3. Check your email for completion notifications');
}

triggerAll().catch(console.error);

