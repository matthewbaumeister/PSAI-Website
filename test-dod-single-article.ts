import 'dotenv/config';
import { scrapeSingleArticle, closeBrowser } from './src/lib/dod-news-scraper';

async function main() {
  console.log(`
╔════════════════════════════════════════════╗
║  DoD Contract News - Single Article Test  ║
╚════════════════════════════════════════════╝
`);

  // Test with a known contract announcements article
  const testUrl = 'https://www.defense.gov/News/Releases/Release/Article/3981590/';
  
  console.log(`Testing URL: ${testUrl}\n`);
  
  try {
    const result = await scrapeSingleArticle(testUrl);
    
    console.log(`
╔════════════════════════════════════════════╗
║  RESULTS                                   ║
╚════════════════════════════════════════════╝
`);
    
    console.log(`Success: ${result.success ? '✅ YES' : '❌ NO'}`);
    console.log(`Contracts Found: ${result.contractsFound}`);
    console.log(`Contracts Saved: ${result.contractsSaved}`);
    
    if (result.success && result.contractsSaved > 0) {
      console.log(`\n✅ Test PASSED! Contracts were extracted and saved to database.`);
      console.log(`\n📊 Next Step: Check Supabase dod_contract_news table to verify data quality.\n`);
    } else if (result.success && result.contractsFound === 0) {
      console.log(`\n⚠️  No contracts found in article. This may not be a contract announcements article.\n`);
    } else {
      console.log(`\n❌ Test FAILED. Check error messages above.\n`);
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await closeBrowser();
    console.log('🔒 Browser closed');
  }
}

main();

