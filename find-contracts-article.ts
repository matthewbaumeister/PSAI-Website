import 'dotenv/config';
import { findContractNewsArticles, closeBrowser } from './src/lib/dod-news-scraper';

async function main() {
  console.log(`
╔════════════════════════════════════════════╗
║  Find DoD Contracts Articles              ║
╚════════════════════════════════════════════╝
`);

  try {
    const startDate = new Date('2024-01-01');
    const endDate = new Date();
    
    const articles = await findContractNewsArticles(startDate, endDate);
    
    console.log(`\n✅ Found ${articles.length} contract articles\n`);
    
    if (articles.length > 0) {
      console.log(`📄 Latest articles:`);
      articles.slice(0, 10).forEach((url, i) => {
        console.log(`   ${i + 1}. ${url}`);
      });
      
      console.log(`\n💡 Use one of these URLs to test the scraper!\n`);
    } else {
      console.log(`⚠️  No "Contracts For" articles found.`);
      console.log(`   This means the HTML structure changed or search failed.\n`);
    }
    
  } catch (error) {
    console.error('❌ Error finding articles:', error);
  } finally {
    await closeBrowser();
    console.log('🔒 Browser closed');
  }
}

main();

