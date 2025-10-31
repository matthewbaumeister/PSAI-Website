#!/usr/bin/env ts-node
// ============================================
// SBIR Awards Scraper - Test Script
// ============================================
// 
// This script tests the awards scraper with a small dataset
// Run: npx ts-node test-awards-scraper.ts
//

import { 
  fetchAwardsFromAPI, 
  normalizeAward, 
  batchInsertAwards,
  scrapeAgencyYear,
  getScraperStats
} from './src/lib/sbir-awards-scraper';

async function main() {
  console.log('============================================');
  console.log('SBIR Awards Scraper - Test Script');
  console.log('============================================\n');
  
  try {
    // ============================================
    // TEST 1: Fetch 10 awards from API
    // ============================================
    console.log('TEST 1: Fetching 10 DOD awards from 2024...\n');
    
    const rawAwards = await fetchAwardsFromAPI('DOD', 2024, { rows: 10 });
    
    console.log(`✅ Fetched ${rawAwards.length} awards\n`);
    
    if (rawAwards.length > 0) {
      console.log('Sample Award:');
      console.log('-------------');
      console.log(`Company: ${rawAwards[0].firm || 'N/A'}`);
      console.log(`Title: ${rawAwards[0].award_title || 'N/A'}`);
      console.log(`Amount: ${rawAwards[0].award_amount || 'N/A'}`);
      console.log(`Phase: ${rawAwards[0].phase || 'N/A'}`);
      console.log(`Year: ${rawAwards[0].award_year || 'N/A'}`);
      console.log(`Topic: ${rawAwards[0].topic_code || 'N/A'}\n`);
    }
    
    // ============================================
    // TEST 2: Normalize data
    // ============================================
    console.log('TEST 2: Normalizing award data...\n');
    
    const normalizedAwards = rawAwards.map(normalizeAward);
    
    console.log(`✅ Normalized ${normalizedAwards.length} awards\n`);
    
    if (normalizedAwards.length > 0) {
      console.log('Sample Normalized Award:');
      console.log('------------------------');
      console.log(JSON.stringify(normalizedAwards[0], null, 2));
      console.log('');
    }
    
    // ============================================
    // TEST 3: Insert to database
    // ============================================
    console.log('TEST 3: Inserting to database...\n');
    
    const result = await batchInsertAwards(normalizedAwards);
    
    console.log(`✅ Database insert complete:`);
    console.log(`   - Inserted: ${result.inserted}`);
    console.log(`   - Errors: ${result.errors}\n`);
    
    // ============================================
    // TEST 4: Get statistics
    // ============================================
    console.log('TEST 4: Getting scraper statistics...\n');
    
    const stats = await getScraperStats();
    
    console.log(`✅ Current database stats:`);
    console.log(`   - Total Awards: ${stats.totalAwards}`);
    console.log(`   - Total Companies: ${stats.totalCompanies}`);
    console.log(`   - Recent Runs: ${stats.recentRuns?.length || 0}\n`);
    
    // ============================================
    // SUCCESS
    // ============================================
    console.log('============================================');
    console.log('✅ ALL TESTS PASSED!');
    console.log('============================================\n');
    
    console.log('Next Steps:');
    console.log('1. Run a full year scrape: scrapeAgencyYear("DOD", 2024)');
    console.log('2. Run bulk historical scrape for multiple years');
    console.log('3. Create API endpoints to serve this data');
    console.log('4. Add UI components to display awards\n');
    
  } catch (error) {
    console.error('❌ ERROR:', error);
    process.exit(1);
  }
}

// Run the test
main();

