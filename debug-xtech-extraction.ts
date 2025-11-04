/**
 * Debug script to understand xTech competition HTML structure
 * Focus on xTechSearch 9 which should have ~60 companies
 */

import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

async function debugXTechPage(url: string, name: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`DEBUGGING: ${name}`);
  console.log(`URL: ${url}`);
  console.log('='.repeat(80));
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const html = await page.content();
  await browser.close();
  
  const $ = cheerio.load(html);
  
  // Save HTML for manual inspection
  fs.writeFileSync(`debug-${name.replace(/\s+/g, '-')}.html`, html);
  console.log(`✅ Saved HTML to debug-${name.replace(/\s+/g, '-')}.html`);
  
  // ANALYSIS 1: Find ALL occurrences of badge keywords
  console.log('\n--- BADGE KEYWORD SEARCH ---');
  const badgeKeywords = ['winner', 'finalist', 'semi-finalist', 'semifinalist'];
  
  badgeKeywords.forEach(keyword => {
    const elements = $('*').filter(function() {
      const text = $(this).text().toLowerCase();
      const ownText = $(this).clone().children().remove().end().text().toLowerCase();
      return ownText.includes(keyword) && ownText.length < 50;
    });
    
    console.log(`\n"${keyword}": Found ${elements.length} elements`);
    elements.slice(0, 5).each((i, el) => {
      const $el = $(el);
      console.log(`  [${$el.prop('tagName')}] "${$el.text().trim().substring(0, 60)}"`);
      console.log(`    Classes: ${$el.attr('class') || 'none'}`);
    });
  });
  
  // ANALYSIS 2: Find company name patterns
  console.log('\n\n--- COMPANY NAME HEADING SEARCH ---');
  const headings = $('h1, h2, h3, h4, h5, h6').toArray();
  console.log(`Total headings: ${headings.length}`);
  
  // Look for headings that might be company names
  const companyLikeHeadings = headings.filter(h => {
    const text = $(h).text().trim();
    return (
      text.length > 3 && 
      text.length < 100 &&
      !/^(description|eligibility|schedule|prize|phase|about|contact|navigation|winners?|finalists?)/i.test(text) &&
      !/^\d+$/.test(text) &&
      !/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(text)
    );
  });
  
  console.log(`Company-like headings: ${companyLikeHeadings.length}`);
  console.log('\nFirst 20 company-like headings:');
  companyLikeHeadings.slice(0, 20).forEach((h, i) => {
    const $h = $(h);
    const text = $h.text().trim();
    const parent = $h.parent();
    const parentText = parent.text().toLowerCase();
    const hasBadge = parentText.includes('winner') || parentText.includes('finalist');
    console.log(`  ${i+1}. [${$h.prop('tagName')}] "${text}" ${hasBadge ? '🏆' : ''}`);
    if (hasBadge) {
      console.log(`      Parent: <${parent.prop('tagName')} class="${parent.attr('class')}">`);
    }
  });
  
  // ANALYSIS 3: Card structure analysis
  console.log('\n\n--- CARD CONTAINER SEARCH ---');
  const potentialCardSelectors = [
    '.wpb_wrapper',
    '.et_pb_module',
    '.vc_column_container',
    '.wpb_column',
    'article',
    '[class*="card"]',
    '[class*="company"]',
    '[class*="winner"]',
    '[class*="finalist"]'
  ];
  
  potentialCardSelectors.forEach(selector => {
    const cards = $(selector);
    if (cards.length > 0) {
      console.log(`\n"${selector}": ${cards.length} elements`);
      
      // Check if any contain both heading and badge
      let withHeadingAndBadge = 0;
      cards.slice(0, 10).each((i, card) => {
        const $card = $(card);
        const hasHeading = $card.find('h1, h2, h3, h4, h5, h6').length > 0;
        const text = $card.text().toLowerCase();
        const hasBadge = text.includes('winner') || text.includes('finalist');
        
        if (hasHeading && hasBadge && text.length < 500) {
          withHeadingAndBadge++;
          if (i < 3) {
            const heading = $card.find('h1, h2, h3, h4, h5, h6').first().text().trim();
            console.log(`    Card ${i+1}: "${heading.substring(0, 50)}"`);
          }
        }
      });
      
      if (withHeadingAndBadge > 0) {
        console.log(`    ⭐ ${withHeadingAndBadge} cards have BOTH heading + badge!`);
      }
    }
  });
  
  // ANALYSIS 4: Look for structured lists
  console.log('\n\n--- LIST STRUCTURE SEARCH ---');
  const lists = $('ul, ol');
  console.log(`Total lists: ${lists.length}`);
  
  lists.each((i, list) => {
    const $list = $(list);
    const items = $list.children('li');
    if (items.length > 5 && items.length < 100) {
      const text = $list.parent().text().toLowerCase();
      if (text.includes('winner') || text.includes('finalist')) {
        console.log(`\nList with ${items.length} items near badge text:`);
        items.slice(0, 5).each((j, item) => {
          console.log(`  - "${$(item).text().trim().substring(0, 60)}"`);
        });
      }
    }
  });
}

async function main() {
  const testCases = [
    {
      url: 'https://xtech.army.mil/competition/xtechsearch-9/',
      name: 'xTechSearch 9',
      expected: '~60 companies (winners + finalists + semi-finalists)'
    },
    {
      url: 'https://xtech.army.mil/competition/xtechenergy-resiliency/',
      name: 'xTech Energy Resiliency',
      expected: '~50 companies'
    },
    {
      url: 'https://xtech.army.mil/competition/xtechsoldier-fire-control/',
      name: 'xTech Soldier Fire Control',
      expected: '~4 companies (1 winner + 3 finalists)'
    }
  ];
  
  for (const test of testCases) {
    console.log(`\n\n${'#'.repeat(80)}`);
    console.log(`TEST CASE: ${test.name}`);
    console.log(`Expected: ${test.expected}`);
    console.log('#'.repeat(80));
    await debugXTechPage(test.url, test.name);
    console.log('\n' + '='.repeat(80));
    console.log('Waiting 2 seconds before next test...');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n\n✅ DEBUG ANALYSIS COMPLETE!');
  console.log('\nNext steps:');
  console.log('1. Review the output above');
  console.log('2. Open the debug-*.html files to inspect structure');
  console.log('3. Update extraction logic based on findings');
}

main().catch(console.error);

