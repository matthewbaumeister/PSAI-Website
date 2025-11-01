/**
 * Debug script to see EXACTLY what the API returns
 * This will fetch ONE contract and dump the full raw response
 */

import 'dotenv/config';

const SAM_API_KEY = process.env.SAM_GOV_API_KEY;
const SEARCH_URL = 'https://api.usaspending.gov/api/v2/search/spending_by_award';
const DETAILS_URL = 'https://api.usaspending.gov/api/v2/awards';

async function debugAPIResponse() {
  console.log('\n🔍 Fetching ONE 2025 contract to see raw API response...\n');

  // Step 1: Search for contracts
  const searchResponse = await fetch(SEARCH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filters: {
        time_period: [
          { start_date: '2025-01-01', end_date: '2025-10-31' }
        ],
        award_type_codes: ['A', 'B', 'C', 'D']
      },
      fields: ['Award ID', 'Recipient Name', 'generated_unique_award_id'],
      limit: 1,
      page: 1
    })
  });

  const searchData = await searchResponse.json();
  const firstContract = searchData.results[0];
  
  console.log('📋 Search Result (basic data):');
  console.log(JSON.stringify(firstContract, null, 2));
  console.log('\n' + '='.repeat(80) + '\n');

  // Step 2: Fetch FULL details
  const awardId = firstContract.generated_unique_award_id || firstContract.generated_internal_id;
  console.log(`🔍 Fetching FULL details for: ${awardId}\n`);

  const detailsResponse = await fetch(`${DETAILS_URL}/${awardId}/`, {
    headers: {
      'X-Api-Key': SAM_API_KEY || '',
      'Content-Type': 'application/json'
    }
  });

  const fullData = await detailsResponse.json();
  
  console.log('📦 FULL API RESPONSE:');
  console.log(JSON.stringify(fullData, null, 2));
  
  console.log('\n' + '='.repeat(80));
  console.log('\n🔍 KEY FIELDS TO CHECK:\n');
  
  // Check specific fields we care about
  const checks = {
    'fiscal_year': fullData.fiscal_year,
    'period_of_performance': fullData.period_of_performance,
    'naics_code': fullData.latest_transaction_contract_data?.naics_code,
    'naics_description': fullData.latest_transaction_contract_data?.naics_description,
    'action_date': fullData.period_of_performance?.action_date,
    'start_date': fullData.period_of_performance?.period_of_performance_start_date,
    'current_end_date': fullData.period_of_performance?.period_of_performance_current_end_date,
  };
  
  for (const [key, value] of Object.entries(checks)) {
    console.log(`${key}: ${value === undefined ? '❌ UNDEFINED' : value === null ? '⚠️  NULL' : `✅ ${JSON.stringify(value)}`}`);
  }
}

debugAPIResponse().catch(console.error);

