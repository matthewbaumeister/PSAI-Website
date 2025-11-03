#!/usr/bin/env node
/**
 * ============================================
 * SAM.gov Opportunities Scraper - Runner Script
 * ============================================
 * 
 * Scrapes contract opportunities from SAM.gov and links them to FPDS contracts
 * 
 * Usage:
 *   npx tsx scrape-sam-gov-opportunities.ts                    # Last 30 days
 *   npx tsx scrape-sam-gov-opportunities.ts --days=90          # Last 90 days
 *   npx tsx scrape-sam-gov-opportunities.ts --from=2024-01-01 --to=2024-12-31
 * 
 * ============================================
 */

// Load environment variables FIRST
import * as dotenv from 'dotenv';
dotenv.config();

import { scrapeSAMGovOpportunities } from './src/lib/sam-gov-opportunities-scraper';

// ============================================
// Parse Command Line Arguments
// ============================================

function parseArgs() {
  const args = process.argv.slice(2);
  
  let days: number | null = null;
  let postedFrom: string | null = null;
  let postedTo: string | null = null;
  
  for (const arg of args) {
    if (arg.startsWith('--days=')) {
      days = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--from=')) {
      postedFrom = arg.split('=')[1];
    } else if (arg.startsWith('--to=')) {
      postedTo = arg.split('=')[1];
    }
  }
  
  // Calculate dates
  if (days) {
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(toDate.getDate() - days);
    
    postedFrom = fromDate.toISOString().split('T')[0];
    postedTo = toDate.toISOString().split('T')[0];
  } else if (!postedFrom || !postedTo) {
    // Default: Last 30 days
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(toDate.getDate() - 30);
    
    postedFrom = fromDate.toISOString().split('T')[0];
    postedTo = toDate.toISOString().split('T')[0];
  }
  
  return { postedFrom, postedTo };
}

// ============================================
// Environment Validation
// ============================================

function validateEnvironment() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SAM_GOV_API_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\nMake sure .env file exists with all required variables.');
    process.exit(1);
  }
}

// ============================================
// Main Function
// ============================================

async function main() {
  validateEnvironment();
  
  const { postedFrom, postedTo } = parseArgs();
  
  console.log(`
╔════════════════════════════════════════════╗
║   SAM.gov Opportunities Scraper           ║
╚════════════════════════════════════════════╝

📅 Date Range: ${postedFrom} → ${postedTo}
🔑 API Key: ${process.env.SAM_GOV_API_KEY?.substring(0, 15)}...
🗄️  Database: ${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('.')[0]}

Starting in 3 seconds...
  `);
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  try {
    await scrapeSAMGovOpportunities({
      postedFrom: postedFrom!,
      postedTo: postedTo!,
      limit: 100,
      includeAwards: true
    });
    
    console.log('\n✅ SAM.gov scraping completed successfully!\n');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ SAM.gov scraping failed:', error);
    process.exit(1);
  }
}

main();

