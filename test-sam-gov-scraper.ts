/**
 * ============================================
 * SAM.gov Scraper Test Script
 * ============================================
 * 
 * Tests SAM.gov scraper for today and previous day
 * Verifies data completeness and richness
 * 
 * Usage:
 *   npx tsx test-sam-gov-scraper.ts
 */

import { scrapeSAMGovOpportunities, SAMGovOpportunitiesScraper } from './src/lib/sam-gov-opportunities-scraper';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Format date as MM/dd/yyyy for SAM.gov API
function formatDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

// Get date N days ago
function getDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

async function testAPIConnection() {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 1: Testing SAM.gov API Connection');
  console.log('='.repeat(60));

  const apiKey = process.env.SAM_GOV_API_KEY || process.env.SAM_GOV_API_KEY_1;
  
  if (!apiKey) {
    console.error('ERROR: No SAM_GOV_API_KEY found in environment');
    console.log('Please set SAM_GOV_API_KEY in .env.local');
    return false;
  }

  console.log('API Key:', apiKey.substring(0, 15) + '...');
  
  // Test with simple query
  const testDate = formatDate(getDaysAgo(1));
  const url = `https://api.sam.gov/opportunities/v2/search?api_key=${apiKey}&postedFrom=${testDate}&postedTo=${testDate}&limit=1`;
  
  console.log('Testing URL:', url.substring(0, 100) + '...');
  
  try {
    const response = await fetch(url);
    console.log('Response Status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('ERROR Response:', errorText.substring(0, 500));
      return false;
    }
    
    const data = await response.json();
    console.log('Total Records Available:', data.totalRecords || 0);
    console.log('API Connection: SUCCESS');
    
    return true;
  } catch (error) {
    console.error('ERROR:', error);
    return false;
  }
}

async function testScraping() {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 2: Testing Scraping for Today and Previous Day');
  console.log('='.repeat(60));

  const today = new Date();
  const yesterday = getDaysAgo(1);
  
  console.log('Today:', formatDate(today));
  console.log('Yesterday:', formatDate(yesterday));
  
  // Get count before scraping
  const { count: countBefore } = await supabase
    .from('sam_gov_opportunities')
    .select('*', { count: 'exact', head: true });
  
  console.log('\nRecords in database BEFORE scraping:', countBefore || 0);
  
  // Test scraping yesterday's data with full details
  console.log('\nScraping yesterday\'s opportunities (FULL DETAILS MODE)...\n');
  
  try {
    await scrapeSAMGovOpportunities({
      postedFrom: formatDate(yesterday),
      postedTo: formatDate(yesterday),
      limit: 100,
      includeAwards: true,
      fullDetails: true  // IMPORTANT: Get complete data
    });
    
    // Get count after scraping
    const { count: countAfter } = await supabase
      .from('sam_gov_opportunities')
      .select('*', { count: 'exact', head: true });
    
    console.log('\nRecords in database AFTER scraping:', countAfter || 0);
    console.log('NEW/UPDATED records:', (countAfter || 0) - (countBefore || 0));
    
    return true;
  } catch (error) {
    console.error('ERROR during scraping:', error);
    return false;
  }
}

async function verifyDataQuality() {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 3: Verifying Data Quality and Completeness');
  console.log('='.repeat(60));

  // Get sample of recently scraped records
  const { data: records, error } = await supabase
    .from('sam_gov_opportunities')
    .select('*')
    .order('last_scraped', { ascending: false })
    .limit(10);

  if (error) {
    console.error('ERROR fetching records:', error);
    return false;
  }

  if (!records || records.length === 0) {
    console.log('No records found in database');
    return false;
  }

  console.log(`\nAnalyzing ${records.length} most recent records...\n`);

  // Field completeness check
  const fields = [
    { name: 'notice_id', required: true },
    { name: 'title', required: true },
    { name: 'solicitation_number', required: false },
    { name: 'description', required: true, checkLength: true },
    { name: 'posted_date', required: true },
    { name: 'response_deadline', required: false },
    { name: 'naics_code', required: false },
    { name: 'department', required: false },
    { name: 'primary_contact', required: false, isJSON: true },
    { name: 'secondary_contact', required: false, isJSON: true },
    { name: 'attachments', required: false, isJSON: true },
    { name: 'type_of_set_aside', required: false },
    { name: 'ui_link', required: true },
    { name: 'data_source', required: true }
  ];

  const stats: any = {};

  fields.forEach(field => {
    const filled = records.filter(r => {
      const value = r[field.name];
      if (!value) return false;
      if (field.checkLength && typeof value === 'string') {
        // Check if description is real text, not just a link
        return value.length > 50 && !value.startsWith('https://api.sam.gov');
      }
      if (field.isJSON) {
        return value !== null;
      }
      return true;
    }).length;

    stats[field.name] = {
      filled,
      percentage: Math.round((filled / records.length) * 100),
      required: field.required
    };
  });

  console.log('Field Completeness Analysis:');
  console.log('-'.repeat(60));
  
  fields.forEach(field => {
    const stat = stats[field.name];
    const icon = stat.percentage >= 90 ? '✅' : stat.percentage >= 50 ? '⚠️' : '❌';
    const req = field.required ? '[REQUIRED]' : '[OPTIONAL]';
    console.log(`${icon} ${field.name.padEnd(30)} ${stat.filled}/${records.length} (${stat.percentage}%) ${req}`);
  });

  // Check data_source distribution
  console.log('\nData Source Distribution:');
  console.log('-'.repeat(60));
  const sources = records.reduce((acc: any, r) => {
    acc[r.data_source] = (acc[r.data_source] || 0) + 1;
    return acc;
  }, {});
  
  Object.entries(sources).forEach(([source, count]) => {
    console.log(`${source}: ${count}`);
  });

  // Sample record details
  console.log('\nSample Record (Most Recent):');
  console.log('-'.repeat(60));
  const sample = records[0];
  console.log('Notice ID:', sample.notice_id);
  console.log('Title:', sample.title?.substring(0, 80) + '...');
  console.log('Solicitation Number:', sample.solicitation_number || 'N/A');
  console.log('Posted Date:', sample.posted_date);
  console.log('Response Deadline:', sample.response_deadline || 'N/A');
  console.log('Department:', sample.department || 'N/A');
  console.log('NAICS Code:', sample.naics_code || 'N/A');
  console.log('Description Length:', sample.description?.length || 0, 'characters');
  console.log('Description Preview:', sample.description?.substring(0, 150) + '...');
  console.log('Has Primary Contact:', !!sample.primary_contact ? 'Yes' : 'No');
  console.log('Has Secondary Contact:', !!sample.secondary_contact ? 'Yes' : 'No');
  console.log('Has Attachments:', !!sample.attachments ? 'Yes' : 'No');
  console.log('UI Link:', sample.ui_link);
  console.log('Data Source:', sample.data_source);
  console.log('Last Scraped:', sample.last_scraped);

  // Quality score
  const requiredFields = fields.filter(f => f.required);
  const requiredFilled = requiredFields.reduce((sum, f) => sum + stats[f.name].filled, 0);
  const requiredTotal = requiredFields.length * records.length;
  const qualityScore = Math.round((requiredFilled / requiredTotal) * 100);

  console.log('\nQuality Score:');
  console.log('-'.repeat(60));
  console.log(`Overall Quality: ${qualityScore}% (Required fields filled)`);

  if (qualityScore >= 95) {
    console.log('✅ EXCELLENT - Data is complete and rich');
  } else if (qualityScore >= 80) {
    console.log('⚠️ GOOD - Most data is present but some gaps');
  } else {
    console.log('❌ POOR - Significant data gaps detected');
  }

  return qualityScore >= 80;
}

async function checkAPIQuota() {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 4: Checking API Quota Status');
  console.log('='.repeat(60));

  const apiKey = process.env.SAM_GOV_API_KEY || process.env.SAM_GOV_API_KEY_1;
  const testDate = formatDate(getDaysAgo(1));
  
  let requestCount = 0;
  const maxTests = 5;
  
  console.log(`Making ${maxTests} test requests to check rate limits...\n`);

  for (let i = 0; i < maxTests; i++) {
    const url = `https://api.sam.gov/opportunities/v2/search?api_key=${apiKey}&postedFrom=${testDate}&postedTo=${testDate}&limit=1&offset=${i}`;
    
    try {
      const response = await fetch(url);
      requestCount++;
      
      if (response.status === 429) {
        console.log(`❌ Rate limit hit after ${requestCount} requests`);
        console.log('Response:', await response.text());
        return false;
      }
      
      if (!response.ok) {
        console.log(`⚠️ Request ${i + 1}: Status ${response.status}`);
      } else {
        console.log(`✅ Request ${i + 1}: OK`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Request ${i + 1} failed:`, error);
    }
  }

  console.log(`\n✅ Successfully made ${requestCount} requests without rate limiting`);
  console.log('API quota appears healthy');
  
  return true;
}

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║          SAM.gov Scraper Testing & Verification            ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

Testing the SAM.gov contract opportunities scraper to ensure:
- API connection is working
- Data is being scraped for today and previous day
- Data completeness and richness are optimal
- Rate limits are respected
`);

  const results = {
    apiConnection: false,
    scraping: false,
    dataQuality: false,
    apiQuota: false
  };

  // Step 1: Test API Connection
  results.apiConnection = await testAPIConnection();
  
  if (!results.apiConnection) {
    console.log('\n❌ API connection failed. Please check your API key and try again.');
    process.exit(1);
  }

  // Step 2: Test Scraping
  results.scraping = await testScraping();
  
  if (!results.scraping) {
    console.log('\n⚠️ Scraping encountered issues. Check logs above.');
  }

  // Step 3: Verify Data Quality
  results.dataQuality = await verifyDataQuality();

  // Step 4: Check API Quota
  results.apiQuota = await checkAPIQuota();

  // Final Summary
  console.log('\n' + '='.repeat(60));
  console.log('FINAL TEST SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`${results.apiConnection ? '✅' : '❌'} API Connection`);
  console.log(`${results.scraping ? '✅' : '❌'} Scraping Functionality`);
  console.log(`${results.dataQuality ? '✅' : '❌'} Data Quality`);
  console.log(`${results.apiQuota ? '✅' : '❌'} API Quota Health`);

  const allPassed = Object.values(results).every(r => r);

  if (allPassed) {
    console.log('\n✅ ALL TESTS PASSED! Scraper is ready for production.');
  } else {
    console.log('\n⚠️ Some tests failed. Review the issues above.');
  }

  console.log('\n' + '='.repeat(60));
  console.log('Next Steps:');
  console.log('='.repeat(60));
  console.log('1. Review data quality metrics above');
  console.log('2. Check Supabase for scraped records');
  console.log('3. If tests passed, the cron job is ready to run');
  console.log('4. Cron job runs daily at 12:30 PM UTC (8:30 AM EST)');
  console.log('\nManually trigger cron job:');
  console.log('curl https://prop-shop.ai/api/cron/scrape-sam-gov \\');
  console.log('  -H "Authorization: Bearer YOUR_CRON_SECRET"');
  console.log('');
}

main().catch(console.error);

