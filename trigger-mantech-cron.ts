#!/usr/bin/env tsx
/**
 * Manual trigger for ManTech Daily Scraper
 * 
 * This will trigger the ManTech cron job manually to test it
 * You should receive an email notification upon completion
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local first, then .env
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

async function triggerManTechCron() {
  console.log('============================================================');
  console.log('ManTech Cron Job - Manual Trigger');
  console.log('============================================================\n');
  
  // Get URL from command line arg or environment
  let VERCEL_URL = process.argv[2] || process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL;
  const CRON_SECRET = process.env.CRON_SECRET;
  
  if (!VERCEL_URL) {
    console.error('Error: VERCEL_URL not provided');
    console.log('\nUsage:');
    console.log('  npm run trigger:mantech YOUR_VERCEL_URL');
    console.log('  Example: npm run trigger:mantech propshop-ai.vercel.app');
    console.log('\nOr set in .env.local:');
    console.log('  NEXT_PUBLIC_VERCEL_URL=propshop-ai.vercel.app');
    process.exit(1);
  }
  
  if (!CRON_SECRET) {
    console.error('Error: CRON_SECRET not found in environment variables');
    console.log('\nPlease set CRON_SECRET in your .env.local file');
    process.exit(1);
  }
  
  // Clean up URL (remove protocol if provided)
  VERCEL_URL = VERCEL_URL.replace(/^https?:\/\//, '');
  
  // Construct the full URL
  const protocol = VERCEL_URL.includes('localhost') ? 'http' : 'https';
  const url = `${protocol}://${VERCEL_URL}/api/cron/scrape-mantech`;
  
  console.log(`Triggering: ${url}`);
  console.log(`Using CRON_SECRET: ${CRON_SECRET.substring(0, 5)}...`);
  console.log('');
  
  try {
    console.log('Sending request...\n');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    console.log('============================================================');
    console.log('RESPONSE');
    console.log('============================================================');
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('');
    
    if (response.ok) {
      console.log('✓ SUCCESS!\n');
      console.log('Response Data:');
      console.log(JSON.stringify(data, null, 2));
      console.log('');
      console.log('You should receive an email notification shortly!');
      console.log('');
      
      if (data.stats) {
        console.log('Stats:');
        console.log(`  - Articles Found: ${data.stats.articles_found}`);
        console.log(`  - Articles Skipped: ${data.stats.articles_skipped}`);
        console.log(`  - Projects Saved: ${data.stats.projects_saved}`);
        console.log(`  - New Projects: ${data.stats.new_projects}`);
        console.log(`  - Total Projects: ${data.stats.total_projects}`);
        console.log(`  - Duration: ${data.duration_seconds}s`);
      }
    } else {
      console.log('✗ FAILED\n');
      console.log('Error:');
      console.log(JSON.stringify(data, null, 2));
    }
    
  } catch (error: any) {
    console.error('============================================================');
    console.error('ERROR');
    console.error('============================================================');
    console.error(error.message);
    console.error('');
    console.error('Make sure:');
    console.error('  1. Your app is deployed to Vercel');
    console.error('  2. VERCEL_URL is correct');
    console.error('  3. CRON_SECRET matches what is set in Vercel');
    process.exit(1);
  }
  
  console.log('============================================================');
}

triggerManTechCron();

