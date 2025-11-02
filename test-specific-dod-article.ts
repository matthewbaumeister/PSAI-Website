import 'dotenv/config';
import { fetchArticleHTML, parseArticleHTML, closeBrowser } from './src/lib/dod-news-scraper';
import fs from 'fs/promises';

async function main() {
  console.log(`
╔════════════════════════════════════════════╗
║  DoD Specific Article Analysis            ║
╚════════════════════════════════════════════╝
`);

  const testUrl = 'https://www.defense.gov/News/Contracts/Contract/Article/4319114/';
  
  console.log(`Fetching: ${testUrl}\n`);
  
  try {
    // Fetch the HTML
    const html = await fetchArticleHTML(testUrl);
    
    if (!html) {
      console.log('❌ Failed to fetch page');
      return;
    }
    
    console.log(`✅ Fetched ${(html.length / 1024).toFixed(1)} KB of HTML\n`);
    
    // Save raw HTML for inspection
    await fs.writeFile('dod-article-4319114.html', html);
    console.log(`💾 Saved raw HTML to: dod-article-4319114.html\n`);
    
    // Parse the article
    const parsed = parseArticleHTML(html, testUrl);
    
    if (!parsed) {
      console.log('❌ Failed to parse article');
      return;
    }
    
    console.log(`📄 Article Title: ${parsed.articleTitle}`);
    console.log(`📅 Published: ${parsed.publishedDate.toISOString().split('T')[0]}`);
    console.log(`🔢 Article ID: ${parsed.articleId}`);
    console.log(`📝 Contract Paragraphs Found: ${parsed.contractParagraphs.length}\n`);
    
    if (parsed.contractParagraphs.length > 0) {
      console.log(`╔════════════════════════════════════════════╗`);
      console.log(`║  CONTRACT PARAGRAPHS (First 3)            ║`);
      console.log(`╚════════════════════════════════════════════╝\n`);
      
      parsed.contractParagraphs.slice(0, 3).forEach((para, i) => {
        console.log(`━━━ Contract ${i + 1} ━━━`);
        console.log(para.substring(0, 300) + (para.length > 300 ? '...' : ''));
        console.log(`\nLength: ${para.length} characters\n`);
      });
      
      console.log(`\n💡 Total contracts found: ${parsed.contractParagraphs.length}`);
      console.log(`📊 Avg paragraph length: ${Math.round(parsed.contractParagraphs.reduce((sum, p) => sum + p.length, 0) / parsed.contractParagraphs.length)} chars\n`);
    } else {
      console.log(`⚠️  No contract paragraphs found!`);
      console.log(`   This means our parsing logic needs adjustment.\n`);
      
      // Save full text for debugging
      const cheerio = await import('cheerio');
      const $ = cheerio.load(html);
      const bodyText = $('body').text();
      
      console.log(`📄 Page contains ${bodyText.length} characters of text`);
      console.log(`🔍 Checking if it contains contract keywords...`);
      
      const hasContract = /contract/i.test(bodyText);
      const hasAmount = /\$\d+/i.test(bodyText);
      const hasLocation = /[A-Z][a-z]+,\s+[A-Z]{2}/i.test(bodyText);
      
      console.log(`   Has "contract": ${hasContract ? '✅' : '❌'}`);
      console.log(`   Has dollar amounts: ${hasAmount ? '✅' : '❌'}`);
      console.log(`   Has "City, ST" pattern: ${hasLocation ? '✅' : '❌'}\n`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await closeBrowser();
    console.log('🔒 Browser closed');
  }
}

main();

