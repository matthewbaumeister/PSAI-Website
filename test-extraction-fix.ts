/**
 * Quick test to verify the extraction logic works
 */

import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

async function testExtraction(url: string, expectedCount: number) {
  console.log(`\nTesting: ${url}`);
  console.log(`Expected: ~${expectedCount} companies`);
  console.log('='.repeat(60));
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const html = await page.content();
  await browser.close();
  
  const $ = cheerio.load(html);
  
  // Use the extraction logic
  const getSubmissionStatus = (text: string): 'Winner' | 'Finalist' | 'Semi-Finalist' | null => {
    const lowerText = text.toLowerCase().replace(/[\s-]/g, '');
    
    if (lowerText.includes('semifinalist')) return 'Semi-Finalist';
    if (lowerText.includes('winner')) return 'Winner';
    if (lowerText.includes('finalist')) return 'Finalist';
    
    return null;
  };
  
  const cardsFound: Array<{status: string, companyName: string}> = [];
  
  // Find all cards with winner/finalist classes
  const winnerCards = $('[class*="winner"]').toArray();
  const finalistCards = $('[class*="finalist"]').toArray();
  const allCards = [...winnerCards, ...finalistCards];
  
  console.log(`Found ${allCards.length} potential cards (${winnerCards.length} winner, ${finalistCards.length} finalist)`);
  
  for (const card of allCards) {
    const $card = $(card);
    
    // Look for the participant-type badge
    const badge = $card.find('.participant-type').first();
    if (badge.length === 0) continue;
    
    const badgeText = badge.text().trim();
    const status = getSubmissionStatus(badgeText);
    if (!status) continue;
    
    // Find the company name heading (usually H3)
    const heading = $card.find('h1, h2, h3, h4, h5, h6').first();
    if (heading.length === 0) continue;
    
    const companyName = heading.text().trim();
    
    // Filter noise
    const isNoise = 
      companyName.length < 3 || companyName.length > 200 ||
      /^(description|eligibility|schedule|prize|phase|navigation|about|contact|submit)/i.test(companyName) ||
      /^\d+$/.test(companyName) ||
      /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(companyName) ||
      /\d{1,2},?\s+\d{4}/.test(companyName) ||
      /^up to/i.test(companyName) ||
      /^\$[\d,]+/i.test(companyName);
    
    if (!isNoise) {
      cardsFound.push({ status, companyName });
    }
  }
  
  // Deduplicate
  const seen = new Set();
  const unique = cardsFound.filter(c => {
    const key = c.companyName.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  console.log(`\n✅ Extracted ${unique.length} unique companies`);
  
  // Count by status
  const winners = unique.filter(c => c.status === 'Winner').length;
  const finalists = unique.filter(c => c.status === 'Finalist').length;
  const semifinalists = unique.filter(c => c.status === 'Semi-Finalist').length;
  
  console.log(`   - Winners: ${winners}`);
  console.log(`   - Finalists: ${finalists}`);
  console.log(`   - Semi-Finalists: ${semifinalists}`);
  
  if (unique.length >= expectedCount * 0.9) {
    console.log(`\n🎉 SUCCESS! Found ${unique.length}/${expectedCount} companies (${Math.round(unique.length/expectedCount*100)}%)`);
  } else {
    console.log(`\n⚠️  PARTIAL: Found ${unique.length}/${expectedCount} companies (${Math.round(unique.length/expectedCount*100)}%)`);
  }
  
  // Show first 10
  console.log('\nFirst 10 companies:');
  unique.slice(0, 10).forEach((c, i) => {
    console.log(`  ${i+1}. [${c.status}] ${c.companyName}`);
  });
  
  return unique.length;
}

async function main() {
  const tests = [
    { url: 'https://xtech.army.mil/competition/xtechsearch-9/', expected: 60 },
    { url: 'https://xtech.army.mil/competition/xtechenergy-resiliency/', expected: 50 },
    { url: 'https://xtech.army.mil/competition/xtechsoldier-fire-control/', expected: 4 }
  ];
  
  let totalFound = 0;
  let totalExpected = 0;
  
  for (const test of tests) {
    const found = await testExtraction(test.url, test.expected);
    totalFound += found;
    totalExpected += test.expected;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`OVERALL: ${totalFound}/${totalExpected} companies (${Math.round(totalFound/totalExpected*100)}%)`);
  console.log('='.repeat(60));
}

main().catch(console.error);

