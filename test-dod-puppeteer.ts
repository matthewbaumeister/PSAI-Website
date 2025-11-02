import 'dotenv/config';
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

async function testDodPuppeteer() {
  console.log(`
╔════════════════════════════════════════════╗
║  DoD Contract News - Puppeteer Test       ║
╚════════════════════════════════════════════╝
`);

  const articleUrl = 'https://www.defense.gov/News/Releases/Release/Article/3981590/';
  const outputFilePath = path.join(process.cwd(), 'dod-puppeteer-output.html');

  console.log(`Testing URL: ${articleUrl}`);
  console.log(`Output will be saved to: ${outputFilePath}\n`);

  let browser;
  
  try {
    console.log('🚀 Launching headless browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });

    console.log('✅ Browser launched');
    
    const page = await browser.newPage();
    
    // Set realistic viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('🔍 Navigating to article...');
    
    // Navigate with timeout
    const response = await page.goto(articleUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    const status = response?.status();
    console.log(`\nStatus: ${status} ${response?.statusText()}`);

    if (status === 200) {
      console.log('✅ SUCCESS! Page loaded successfully\n');
      
      // Get the HTML content
      const html = await page.content();
      
      // Save to file
      await fs.writeFile(outputFilePath, html);
      console.log(`✅ Saved HTML to: ${outputFilePath}`);
      console.log(`   HTML size: ${(html.length / 1024).toFixed(1)} KB\n`);
      
      // Extract some basic info to verify it's real content
      const title = await page.title();
      console.log(`📄 Page Title: ${title}`);
      
      // Check if it contains contract-related content
      const bodyText = await page.evaluate(() => document.body.innerText);
      const hasContractKeywords = /contract|award|million|billion/i.test(bodyText);
      
      if (hasContractKeywords) {
        console.log('✅ Page contains contract-related keywords');
      } else {
        console.log('⚠️  Warning: Page may not contain contract content');
      }
      
      console.log('\n✅ Puppeteer test SUCCESSFUL!');
      console.log('   → We can proceed with building the full scraper\n');
      
    } else {
      console.log(`❌ Failed to load page. Status: ${status}`);
      console.log('   → Defense.gov may have additional protections\n');
    }

  } catch (error) {
    console.error('❌ Error during test:', error);
    console.error('\nThis could mean:');
    console.error('  1. Network connectivity issue');
    console.error('  2. Site requires additional authentication');
    console.error('  3. Puppeteer installation issue\n');
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔒 Browser closed');
    }
  }
}

testDodPuppeteer();

