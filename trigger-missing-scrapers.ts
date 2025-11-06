/**
 * Trigger DoD and Congress scrapers
 * (The ones showing NEVER-RUN or stuck on RUNNING)
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

const CRON_SECRET = process.env.CRON_SECRET;
const BASE_URL = 'https://www.prop-shop.ai';

async function triggerScraper(name: string, path: string) {
  console.log(`\n🚀 Triggering: ${name}...`);
  
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log(`✅ ${name} - Success!`);
    } else {
      console.error(`❌ ${name} - Failed (${response.status})`);
    }
  } catch (error: any) {
    console.error(`❌ ${name} - Exception:`, error.message);
  }
}

async function main() {
  console.log('===============================================');
  console.log('  Triggering Missing Scrapers');
  console.log('===============================================\n');
  
  await triggerScraper('DoD Contract News', '/api/cron/scrape-dod-news');
  await new Promise(r => setTimeout(r, 3000));
  
  await triggerScraper('Congress.gov Bills', '/api/cron/scrape-congress-gov');
  
  console.log('\n===============================================');
  console.log('✅ Done! Refresh /admin/scrapers in 1-2 min');
  console.log('===============================================');
}

main().catch(console.error);

