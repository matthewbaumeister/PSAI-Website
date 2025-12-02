/**
 * ============================================
 * TEST SCRAPER - Direct to opportunity_master
 * ============================================
 * Test script to scrape 10 most recent DOD contract news articles
 * and save directly to opportunity_master table
 * ============================================
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { 
  getBrowser, 
  closeBrowser, 
  fetchArticleHTML, 
  parseArticleHTML,
  extractContractData,
  splitMultipleAwardContract
} from './src/lib/dod-news-scraper';
import { saveContractToOpportunityMaster } from './src/lib/dod-news-scraper-direct-to-master';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://www.defense.gov';
const CONTRACTS_URL = `${BASE_URL}/News/Contracts/`;

/**
 * Parse date from DoD article title
 */
function parseDateFromTitle(title: string): Date | null {
  const match = title.match(/Contracts\s+For\s+([A-Za-z]+)\s+(\d+),?\s+(\d{4})/i);
  if (!match) return null;
  
  const [, monthStr, day, year] = match;
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                      'july', 'august', 'september', 'october', 'november', 'december'];
  const month = monthNames.indexOf(monthStr.toLowerCase());
  
  if (month === -1) return null;
  
  return new Date(parseInt(year), month, parseInt(day));
}

/**
 * Find recent contract news articles
 */
async function findRecentArticles(limit: number = 10): Promise<Array<{
  id: number;
  url: string;
  title: string;
  publishedDate: Date;
}>> {
  console.log(`\n🔍 Finding ${limit} most recent contract news articles...\n`);
  
  const articles: Array<{ id: number; url: string; title: string; publishedDate: Date }> = [];
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    // Load first page of contracts
    await page.goto(CONTRACTS_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const html = await page.content();
    const $ = cheerio.load(html);
    
    let articleIdCounter = 1000000;
    
    $('.river-list .item').each((_, element) => {
      if (articles.length >= limit) return false; // Stop when we have enough
      
      const $item = $(element);
      const title = $item.find('.river-title a').text().trim();
      const relativeUrl = $item.find('.river-title a').attr('href');
      
      if (!title.toLowerCase().includes('contracts for') || !relativeUrl) {
        return;
      }
      
      const articleDate = parseDateFromTitle(title);
      if (!articleDate) return;
      
      articles.push({
        id: articleIdCounter++,
        url: BASE_URL + relativeUrl,
        title: title,
        publishedDate: articleDate
      });
    });
    
    console.log(`✅ Found ${articles.length} articles\n`);
    
  } finally {
    await page.close();
  }
  
  return articles;
}

/**
 * Main test function
 */
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  TEST SCRAPER - Direct to opportunity_master');
  console.log('='.repeat(60) + '\n');
  
  try {
    // Find recent articles
    const articles = await findRecentArticles(10);
    
    if (articles.length === 0) {
      console.log('❌ No articles found. Exiting.');
      return;
    }
    
    let totalContracts = 0;
    let totalSaved = 0;
    
    // Process each article
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`📰 Article ${i + 1}/${articles.length}`);
      console.log(`   Title: ${article.title}`);
      console.log(`   Date: ${article.publishedDate.toISOString().split('T')[0]}`);
      console.log(`   URL: ${article.url}`);
      console.log(`${'─'.repeat(60)}\n`);
      
      try {
        // Fetch HTML
        const html = await fetchArticleHTML(article.url);
        if (!html) {
          console.log('❌ Failed to fetch HTML\n');
          continue;
        }
        
        // Parse HTML
        const parsed = parseArticleHTML(html, article.url);
        if (!parsed) {
          console.log('❌ Failed to parse HTML\n');
          continue;
        }
        
        console.log(`   📄 Found ${parsed.contractParagraphs.length} contract paragraphs\n`);
        
        let sequenceNum = 1;
        
        // Extract and save each contract
        for (const paragraphData of parsed.contractParagraphs) {
          // Split multiple award contracts
          const individualParagraphs = splitMultipleAwardContract(paragraphData.text);
          
          for (const individualParagraph of individualParagraphs) {
            const contract = extractContractData(individualParagraph, paragraphData.serviceBranch);
            if (contract) {
              totalContracts++;
              
              // Generate fallback contract number if needed
              if (!contract.contractNumber || contract.contractNumber.length < 10) {
                contract.contractNumber = `${article.id}-SEQ-${String(sequenceNum).padStart(3, '0')}`;
              }
              sequenceNum++;
              
              // Save to opportunity_master
              const success = await saveContractToOpportunityMaster(
                contract,
                article.id,
                article.url,
                article.title,
                article.publishedDate
              );
              
              if (success) {
                totalSaved++;
              }
              
              console.log(''); // Blank line between contracts
            }
          }
        }
        
        // Small delay between articles
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error: any) {
        console.error(`❌ Error processing article: ${error.message}\n`);
      }
    }
    
    // Close browser
    await closeBrowser();
    
    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('  SUMMARY');
    console.log('='.repeat(60));
    console.log(`  Articles processed: ${articles.length}`);
    console.log(`  Contracts found: ${totalContracts}`);
    console.log(`  Contracts saved: ${totalSaved}`);
    console.log(`  Success rate: ${totalContracts > 0 ? Math.round(totalSaved / totalContracts * 100) : 0}%`);
    console.log('='.repeat(60) + '\n');
    
    console.log('✅ Test complete! Check opportunity_master table in Supabase.\n');
    
  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
  } finally {
    await closeBrowser();
  }
}

// Run the test
main();

