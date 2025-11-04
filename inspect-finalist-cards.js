// Quick script to inspect finalist card HTML structure
const puppeteer = require('puppeteer');
const fs = require('fs');

async function inspectPage() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Loading xTechSearch 9 page...');
  await page.goto('https://xtech.army.mil/competition/xtechsearch-9/', {
    waitUntil: 'networkidle0',
    timeout: 60000
  });
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const html = await page.content();
  
  // Save full HTML
  fs.writeFileSync('xtech-search-9-full.html', html);
  
  // Extract just the finalist sections
  const finalistSections = await page.evaluate(() => {
    const results = [];
    
    // Try different selectors to find finalist cards
    const selectors = [
      '.finalist',
      '[class*="finalist"]',
      '.wpb_column',
      '.vc_column_container',
      '.et_pb_column'
    ];
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        results.push({
          selector,
          count: elements.length,
          sample: elements[0] ? elements[0].outerHTML.substring(0, 500) : 'none'
        });
      }
    }
    
    return results;
  });
  
  console.log('Finalist card analysis:', JSON.stringify(finalistSections, null, 2));
  fs.writeFileSync('finalist-card-analysis.json', JSON.stringify(finalistSections, null, 2));
  
  await browser.close();
  console.log('✅ Saved HTML to xtech-search-9-full.html');
  console.log('✅ Saved analysis to finalist-card-analysis.json');
}

inspectPage().catch(console.error);

