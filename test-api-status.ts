/**
 * Quick test to check if USASpending.gov API is responding
 */

async function testAPI() {
  console.log('\n🧪 Testing USASpending.gov API...\n');
  
  const startTime = Date.now();
  
  try {
    const response = await fetch('https://api.usaspending.gov/api/v2/search/spending_by_award/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filters: {
          time_period: [
            { start_date: '2025-01-01', end_date: '2025-01-31' }
          ],
          award_type_codes: ['A', 'B', 'C', 'D']
        },
        fields: ['Award ID', 'Recipient Name', 'Award Amount'],
        limit: 1,
        page: 1
      })
    });
    
    const elapsed = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API IS ONLINE!\n');
      console.log(`Status: ${response.status}`);
      console.log(`Response Time: ${elapsed}ms`);
      console.log(`Results Found: ${data.results?.length || 0}`);
      console.log(`Total: ${data.page_metadata?.total || 'unknown'}\n`);
      console.log('🎯 Ready to scrape!\n');
    } else {
      const errorData = await response.json();
      console.log('⚠️ API RESPONDED BUT WITH ERROR\n');
      console.log(`Status: ${response.status}`);
      console.log(`Response Time: ${elapsed}ms`);
      console.log(`Message: ${response.statusText}`);
      console.log(`Details: ${JSON.stringify(errorData, null, 2)}\n`);
      
      if (response.status === 422) {
        console.log('💡 422 = Request format issue (but API is ONLINE!)');
        console.log('   This means the scraper should work.\n');
      } else {
        console.log('Try again in a few minutes...\n');
      }
    }
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    console.log('❌ API IS DOWN\n');
    console.log(`Error: ${error.message}`);
    console.log(`Response Time: ${elapsed}ms`);
    console.log(`Cause: ${error.cause?.code || 'Network failure'}\n`);
    console.log('💡 This is normal - government APIs are unstable.');
    console.log('   Wait 5-10 minutes and try again.\n');
  }
}

testAPI();

