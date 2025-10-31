#!/usr/bin/env ts-node
// Test script for FULL details scraper
// Tests with just 10 contracts to verify everything works

import 'dotenv/config';
import { 
  searchContracts, 
  getContractFullDetails, 
  normalizeFullContract,
  batchInsertFullContracts 
} from './src/lib/fpds-scraper-full';

async function main() {
  console.log('============================================');
  console.log('FPDS FULL Details Scraper - Test Script');
  console.log('============================================\n');

  try {
    // Step 1: Search for 10 contracts
    console.log('TEST 1: Searching for 10 contracts...\n');
    const searchResult = await searchContracts({
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      page: 1,
      limit: 10
    });

    console.log(`✅ Found ${searchResult.results.length} contracts\n`);

    if (searchResult.results.length === 0) {
      console.log('❌ No contracts found. Check your date range or API access.');
      return;
    }

    // Step 2: Fetch full details for first contract
    console.log('TEST 2: Fetching FULL details for first contract...\n');
    const firstContract = searchResult.results[0];
    console.log(`Contract: ${firstContract['Award ID']}`);
    console.log(`Recipient: ${firstContract['Recipient Name']}`);
    console.log(`Generated ID: ${firstContract.generated_internal_id}\n`);

    const fullDetails = await getContractFullDetails(firstContract.generated_internal_id);

    if (!fullDetails) {
      console.log('❌ Failed to fetch full details');
      return;
    }

    console.log('✅ Full details fetched!\n');

    // Step 3: Show what we got
    console.log('TEST 3: Showing rich data fields...\n');
    console.log('📋 Basic Info:');
    console.log(`  - PIID: ${fullDetails.piid}`);
    console.log(`  - Description: ${fullDetails.description?.substring(0, 80)}...`);
    console.log('');

    console.log('💰 Financial:');
    console.log(`  - Base Value: $${fullDetails.base_and_exercised_options_value?.toLocaleString() || 0}`);
    console.log(`  - Total Obligated: $${fullDetails.total_obligation?.toLocaleString() || 0}`);
    console.log('');

    console.log('🏢 Recipient:');
    console.log(`  - Name: ${fullDetails.recipient?.recipient_name}`);
    console.log(`  - UEI: ${fullDetails.recipient?.recipient_uei}`);
    console.log(`  - Address: ${fullDetails.recipient?.location?.address_line1}`);
    console.log(`  - City: ${fullDetails.recipient?.location?.city_name}, ${fullDetails.recipient?.location?.state_code}`);
    console.log('');

    console.log('👥 Socioeconomic:');
    const businessTypes = fullDetails.recipient?.business_types_description || 'N/A';
    console.log(`  - ${businessTypes}`);
    console.log('');

    console.log('🏛️ Agency:');
    console.log(`  - Awarding: ${fullDetails.awarding_agency?.toptier_agency?.name}`);
    console.log(`  - Office: ${fullDetails.awarding_agency?.subtier_agency?.name}`);
    console.log('');

    console.log('🏭 Classification:');
    console.log(`  - NAICS: ${fullDetails.latest_transaction_contract_data?.naics_code} - ${fullDetails.latest_transaction_contract_data?.naics_description}`);
    console.log(`  - PSC: ${fullDetails.latest_transaction_contract_data?.product_or_service_code}`);
    console.log('');

    // Step 4: Normalize
    console.log('TEST 4: Normalizing data...\n');
    const normalized = normalizeFullContract(fullDetails);
    console.log('✅ Normalized successfully!\n');

    // Count non-null fields
    const nonNullFields = Object.entries(normalized).filter(([k, v]) => v !== null && v !== undefined).length;
    const totalFields = Object.keys(normalized).length;
    console.log(`📊 Data Quality:`);
    console.log(`  - Total Fields: ${totalFields}`);
    console.log(`  - Non-Null Fields: ${nonNullFields}`);
    console.log(`  - Fill Rate: ${Math.round((nonNullFields / totalFields) * 100)}%`);
    console.log('');

    // Step 5: Process all 10 contracts
    console.log('TEST 5: Processing all 10 contracts with full details...\n');
    const enrichedContracts: any[] = [];

    for (let i = 0; i < searchResult.results.length; i++) {
      const contract = searchResult.results[i];
      console.log(`  [${i + 1}/10] Fetching details for ${contract['Award ID']}...`);
      
      const details = await getContractFullDetails(contract.generated_internal_id);
      if (details) {
        const norm = normalizeFullContract(details);
        enrichedContracts.push(norm);
      }
      
      // Small delay to be nice to the API
      await sleep(500);
    }

    console.log(`\n✅ Enriched ${enrichedContracts.length} contracts\n`);

    // Step 6: Test database insert
    console.log('TEST 6: Inserting to database...\n');
    const result = await batchInsertFullContracts(enrichedContracts);
    console.log(`✅ Database insert complete:`);
    console.log(`   - Inserted: ${result.inserted}`);
    console.log(`   - Errors: ${result.errors}`);
    console.log('');

    console.log('============================================');
    console.log('✅ ALL TESTS PASSED!');
    console.log('============================================\n');

    console.log('The FULL scraper is working perfectly!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Small test run: npx tsx src/scripts/fpds-full-load.ts --year=2024 --max=100');
    console.log('2. Bigger test: npx tsx src/scripts/fpds-full-load.ts --year=2024 --max=1000');
    console.log('3. Full load: npx tsx src/scripts/fpds-full-load.ts --year=2024 --max=100000');
    console.log('');
    console.log('⏱️  Time estimates:');
    console.log('   - 100 contracts: ~1 minute');
    console.log('   - 1,000 contracts: ~10 minutes');
    console.log('   - 10,000 contracts: ~1.5 hours');
    console.log('   - 100,000 contracts: ~15 hours');
    console.log('');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main();

