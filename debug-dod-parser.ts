import 'dotenv/config';
import { fetchArticleHTML, closeBrowser } from './src/lib/dod-news-scraper';
import * as cheerio from 'cheerio';

async function main() {
  console.log('Fetching article...');
  
  const url = 'https://www.defense.gov/News/Contracts/Contract/Article/4319114/';
  const html = await fetchArticleHTML(url);
  
  if (!html) {
    console.log('Failed to fetch');
    return;
  }
  
  const $ = cheerio.load(html);
  const paragraphs = $('.body p, .article-body p, .content p, .inside p, .ntext p');
  
  console.log(`\nFound ${paragraphs.length} total <p> tags\n`);
  
  let contractCount = 0;
  
  paragraphs.each((i, elem) => {
    const text = $(elem).text().trim();
    
    if (text.length < 100) {
      return; // Skip short
    }
    
    const hasCompanyLocation = /[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s+[A-Z][a-z]+/.test(text);
    const hasDollarAmount = /\$[\d,]+|million|billion/.test(text);
    const hasContractKeywords = /\b(contract|awarded|being awarded|modification|procurement|delivery)\b/i.test(text);
    const hasContractNumber = /[A-Z]\d{5}[A-Z0-9-]+/.test(text);
    
    const indicators = [hasCompanyLocation, hasDollarAmount, hasContractKeywords, hasContractNumber];
    const indicatorCount = indicators.filter(Boolean).length;
    
    const passed = indicatorCount >= 3;
    
    if (passed) contractCount++;
    
    console.log(`━━━ Paragraph ${i + 1} ━━━`);
    console.log(`Length: ${text.length} chars`);
    console.log(`Indicators: ${indicatorCount}/4`);
    console.log(`  Company/Location: ${hasCompanyLocation ? '✅' : '❌'}`);
    console.log(`  Dollar Amount: ${hasDollarAmount ? '✅' : '❌'}`);
    console.log(`  Contract Keywords: ${hasContractKeywords ? '✅' : '❌'}`);
    console.log(`  Contract Number: ${hasContractNumber ? '✅' : '❌'}`);
    console.log(`Result: ${passed ? '✅ PASS' : '❌ SKIP'}`);
    console.log(`Preview: ${text.substring(0, 150)}...\n`);
  });
  
  console.log(`\n📊 Summary: ${contractCount} contracts found out of ${paragraphs.length} paragraphs\n`);
  
  await closeBrowser();
}

main();

