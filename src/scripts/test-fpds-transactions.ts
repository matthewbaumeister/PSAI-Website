#!/usr/bin/env node
/**
 * Test FPDS Transactions API
 * 
 * This script tests the USASpending API to see how many
 * contract TRANSACTIONS (not just awards) are available per day
 */

import 'dotenv/config';

const USA_SPENDING_API = 'https://api.usaspending.gov/api/v2';

async function testTransactionsAPI() {
  console.log('====================================');
  console.log('FPDS Transactions API Test');
  console.log('====================================\n');

  // Test yesterday's data
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];

  console.log(`Testing date: ${dateStr}\n`);

  // Test 1: Awards endpoint (current method)
  console.log('1. AWARDS ENDPOINT (current method):');
  console.log('   Query: /search/spending_by_award/');
  
  try {
    const awardsResponse = await fetch(`${USA_SPENDING_API}/search/spending_by_award/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filters: {
          time_period: [{
            start_date: dateStr,
            end_date: dateStr
          }],
          award_type_codes: ['A', 'B', 'C', 'D']
        },
        fields: ['Award ID', 'generated_internal_id'],
        limit: 1,
        page: 1
      })
    });

    if (awardsResponse.ok) {
      const awardsData = await awardsResponse.json();
      const awardsTotal = awardsData.page_metadata?.total || 0;
      console.log(`   Result: ${awardsTotal} unique contract AWARDS\n`);
    } else {
      console.log(`   Error: ${awardsResponse.status} ${awardsResponse.statusText}\n`);
    }
  } catch (error) {
    console.log(`   Error: ${error}\n`);
  }

  // Test 2: Transactions endpoint (new method)
  console.log('2. TRANSACTIONS ENDPOINT (proposed method):');
  console.log('   Query: /search/spending_by_transaction/');
  
  try {
    const transactionsResponse = await fetch(`${USA_SPENDING_API}/search/spending_by_transaction/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filters: {
          time_period: [{
            start_date: dateStr,
            end_date: dateStr
          }],
          award_type_codes: ['A', 'B', 'C', 'D']
        },
        fields: [
          'Award ID',
          'generated_internal_id',
          'modification_number',
          'action_date',
          'action_type'
        ],
        limit: 1,
        page: 1
      })
    });

    if (transactionsResponse.ok) {
      const transactionsData = await transactionsResponse.json();
      const transactionsTotal = transactionsData.page_metadata?.total || 0;
      console.log(`   Result: ${transactionsTotal} contract TRANSACTIONS (includes mods)\n`);
    } else {
      console.log(`   Error: ${transactionsResponse.status} ${transactionsResponse.statusText}\n`);
    }
  } catch (error) {
    console.log(`   Error: ${error}\n`);
  }

  // Test 3: Sample some transactions to see what we get
  console.log('3. SAMPLE TRANSACTIONS:');
  
  try {
    const sampleResponse = await fetch(`${USA_SPENDING_API}/search/spending_by_transaction/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filters: {
          time_period: [{
            start_date: dateStr,
            end_date: dateStr
          }],
          award_type_codes: ['A', 'B', 'C', 'D']
        },
        fields: [
          'Award ID',
          'Recipient Name',
          'Award Amount',
          'modification_number',
          'action_date',
          'action_type',
          'action_type_description'
        ],
        limit: 5,
        page: 1
      })
    });

    if (sampleResponse.ok) {
      const sampleData = await sampleResponse.json();
      console.log(`   Found ${sampleData.results?.length || 0} sample transactions:\n`);
      
      sampleData.results?.forEach((tx: any, i: number) => {
        console.log(`   ${i + 1}. ${tx['Award ID']}`);
        console.log(`      Recipient: ${tx['Recipient Name']}`);
        console.log(`      Amount: $${tx['Award Amount']?.toLocaleString()}`);
        console.log(`      Mod #: ${tx.modification_number || '0'}`);
        console.log(`      Action: ${tx.action_type_description || tx.action_type}`);
        console.log(`      Date: ${tx.action_date}`);
        console.log('');
      });
    }
  } catch (error) {
    console.log(`   Error: ${error}\n`);
  }

  console.log('====================================');
  console.log('TEST COMPLETE');
  console.log('====================================');
}

testTransactionsAPI().catch(console.error);

