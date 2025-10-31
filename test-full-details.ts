// Quick test to show full contract details from USASpending.gov
import 'dotenv/config';

async function fetchFullContractDetails() {
  console.log('Fetching FULL contract details from USASpending.gov...\n');

  // First, search for ANY recent contract
  const searchResponse = await fetch('https://api.usaspending.gov/api/v2/search/spending_by_award/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filters: {
        time_period: [{ start_date: '2024-01-01', end_date: '2024-12-31' }],
        award_type_codes: ['A', 'B', 'C', 'D']
      },
      fields: ['Award ID', 'Recipient Name', 'Award Amount', 'generated_internal_id'],
      limit: 5
    })
  });

  const searchData = await searchResponse.json();
  
  if (!searchData.results || searchData.results.length === 0) {
    console.error('No contracts found in search. API might be down or filters too restrictive.');
    return;
  }
  
  const contract = searchData.results[0];

  console.log('═══════════════════════════════════════════');
  console.log('BASIC DATA (from search endpoint):');
  console.log('═══════════════════════════════════════════');
  console.log(`Award ID: ${contract['Award ID']}`);
  console.log(`Recipient: ${contract['Recipient Name']}`);
  console.log(`Amount: $${contract['Award Amount']?.toLocaleString()}`);
  console.log(`Generated ID: ${contract.generated_internal_id}\n`);

  // Now fetch FULL details
  console.log('Fetching FULL DETAILS...\n');
  
  const detailsResponse = await fetch(
    `https://api.usaspending.gov/api/v2/awards/${contract.generated_internal_id}/`
  );

  const fullData = await detailsResponse.json();

  console.log('═══════════════════════════════════════════');
  console.log('FULL CONTRACT DETAILS:');
  console.log('═══════════════════════════════════════════\n');

  console.log('📋 BASIC INFO:');
  console.log(`  Award ID: ${fullData.piid || 'N/A'}`);
  console.log(`  Description: ${fullData.description || 'N/A'}`);
  console.log(`  Type: ${fullData.type_description || 'N/A'}`);
  console.log('');

  console.log('💰 FINANCIAL:');
  console.log(`  Base Value: $${fullData.base_and_exercised_options_value?.toLocaleString() || 0}`);
  console.log(`  All Options Value: $${fullData.base_and_all_options_value?.toLocaleString() || 0}`);
  console.log(`  Total Obligated: $${fullData.total_obligation?.toLocaleString() || 0}`);
  console.log('');

  console.log('🏢 RECIPIENT:');
  console.log(`  Name: ${fullData.recipient?.recipient_name || 'N/A'}`);
  console.log(`  UEI: ${fullData.recipient?.recipient_uei || 'N/A'}`);
  console.log(`  DUNS: ${fullData.recipient?.recipient_duns || 'N/A'}`);
  console.log(`  Address: ${fullData.recipient?.location?.address_line1 || 'N/A'}`);
  console.log(`  City: ${fullData.recipient?.location?.city_name || 'N/A'}`);
  console.log(`  State: ${fullData.recipient?.location?.state_code || 'N/A'}`);
  console.log(`  Zip: ${fullData.recipient?.location?.zip5 || 'N/A'}`);
  console.log(`  Country: ${fullData.recipient?.location?.country_name || 'N/A'}`);
  console.log('');

  console.log('👥 SOCIOECONOMIC:');
  console.log(`  Small Business: ${fullData.recipient?.business_types_description?.includes('small business') ? 'Yes' : 'No'}`);
  console.log(`  Woman-Owned: ${fullData.recipient?.business_types_description?.includes('woman') ? 'Yes' : 'No'}`);
  console.log(`  Veteran-Owned: ${fullData.recipient?.business_types_description?.includes('veteran') ? 'Yes' : 'No'}`);
  console.log(`  HUBZone: ${fullData.recipient?.business_types_description?.includes('hubzone') ? 'Yes' : 'No'}`);
  console.log(`  8(a): ${fullData.recipient?.business_types_description?.includes('8(a)') ? 'Yes' : 'No'}`);
  console.log(`  All Types: ${fullData.recipient?.business_types_description || 'N/A'}`);
  console.log('');

  console.log('🏛️ AGENCY:');
  console.log(`  Awarding Agency: ${fullData.awarding_agency?.toptier_agency?.name || 'N/A'}`);
  console.log(`  Sub-Agency: ${fullData.awarding_agency?.subtier_agency?.name || 'N/A'}`);
  console.log(`  Office: ${fullData.awarding_agency?.office_agency_name || 'N/A'}`);
  console.log(`  Funding Agency: ${fullData.funding_agency?.toptier_agency?.name || 'N/A'}`);
  console.log('');

  console.log('📅 DATES:');
  console.log(`  Signed: ${fullData.period_of_performance?.period_of_performance_start_date || 'N/A'}`);
  console.log(`  Start: ${fullData.period_of_performance?.period_of_performance_current_end_date || 'N/A'}`);
  console.log(`  Current End: ${fullData.period_of_performance?.last_modified_date || 'N/A'}`);
  console.log(`  Potential End: ${fullData.period_of_performance?.potential_end_date || 'N/A'}`);
  console.log('');

  console.log('🏭 CLASSIFICATION:');
  console.log(`  NAICS Code: ${fullData.latest_transaction_contract_data?.naics_code || 'N/A'}`);
  console.log(`  NAICS Description: ${fullData.latest_transaction_contract_data?.naics_description || 'N/A'}`);
  console.log(`  PSC Code: ${fullData.latest_transaction_contract_data?.product_or_service_code || 'N/A'}`);
  console.log(`  PSC Description: ${fullData.latest_transaction_contract_data?.product_or_service_code_description || 'N/A'}`);
  console.log('');

  console.log('📍 PLACE OF PERFORMANCE:');
  console.log(`  City: ${fullData.place_of_performance?.city_name || 'N/A'}`);
  console.log(`  State: ${fullData.place_of_performance?.state_code || 'N/A'}`);
  console.log(`  Zip: ${fullData.place_of_performance?.zip5 || 'N/A'}`);
  console.log(`  Country: ${fullData.place_of_performance?.country_name || 'N/A'}`);
  console.log(`  Congressional District: ${fullData.place_of_performance?.congressional_code || 'N/A'}`);
  console.log('');

  console.log('🏆 COMPETITION:');
  console.log(`  Extent Competed: ${fullData.latest_transaction_contract_data?.extent_competed || 'N/A'}`);
  console.log(`  Set-Aside Type: ${fullData.latest_transaction_contract_data?.type_of_set_aside || 'N/A'}`);
  console.log(`  Number of Offers: ${fullData.latest_transaction_contract_data?.number_of_offers_received || 'N/A'}`);
  console.log(`  Solicitation: ${fullData.latest_transaction_contract_data?.solicitation_identifier || 'N/A'}`);
  console.log('');

  console.log('📝 CONTRACT DETAILS:');
  console.log(`  Type: ${fullData.latest_transaction_contract_data?.contract_award_type || 'N/A'}`);
  console.log(`  Pricing: ${fullData.latest_transaction_contract_data?.type_of_contract_pricing || 'N/A'}`);
  console.log(`  IDV Type: ${fullData.latest_transaction_contract_data?.idv_type_description || 'N/A'}`);
  console.log(`  Multiple IDV: ${fullData.latest_transaction_contract_data?.multiple_or_single_award_idv || 'N/A'}`);
  console.log('');

  console.log('═══════════════════════════════════════════');
  console.log('COMPARISON:');
  console.log('═══════════════════════════════════════════');
  console.log('Search Endpoint (current):    ~15 fields, LOTS of nulls');
  console.log('Details Endpoint (full):      ~100+ fields, MUCH richer!');
  console.log('');
  console.log('Trade-off:');
  console.log('- Search: FAST (100K contracts in 2-4 hours)');
  console.log('- Details: SLOW (100K contracts in 20-40 hours)');
  console.log('');
  console.log('Recommendation: Hybrid approach');
  console.log('1. Fast search to get all contracts (2-4 hours)');
  console.log('2. Fetch details only for important ones:');
  console.log('   - Contracts > $1M');
  console.log('   - Specific agencies (DOD, NASA)');
  console.log('   - Target NAICS codes');
  console.log('   - Small businesses');
  console.log('');
}

fetchFullContractDetails().catch(console.error);

