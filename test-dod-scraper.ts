import 'dotenv/config';

// Test DoD contract news scraping
// Defense.gov blocks simple requests, so we need proper headers

async function testDoDScraping() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  DoD Contract News - Test Scraper         ║');
  console.log('╚════════════════════════════════════════════╝\n');

  // Test URL - replace with actual contract announcement
  const testUrl = 'https://www.defense.gov/News/Releases/Release/Article/3981590/';

  console.log(`Testing URL: ${testUrl}\n`);

  try {
    // Use fetch with proper browser headers
    const response = await fetch(testUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      }
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.log('❌ Failed to fetch page');
      console.log('This site may require:');
      console.log('  1. More sophisticated headers');
      console.log('  2. Headless browser (Puppeteer/Playwright)');
      console.log('  3. Proxy/VPN');
      console.log('  4. Rate limiting (slower requests)');
      return;
    }

    const html = await response.text();
    console.log(`✅ Success! Fetched ${html.length} characters\n`);

    // Try to find article title
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (titleMatch) {
      console.log(`Title: ${titleMatch[1]}\n`);
    }

    // Try to find article content
    const contentMatch = html.match(/<div[^>]*class="[^"]*body[^"]*"[^>]*>(.*?)<\/div>/is);
    if (contentMatch) {
      console.log(`Found article body section`);
      console.log(`Length: ${contentMatch[1].length} characters\n`);
    }

    // Save to file for inspection
    const fs = await import('fs');
    fs.writeFileSync('dod-test-output.html', html);
    console.log('✅ Saved full HTML to: dod-test-output.html');
    console.log('   Open this file to inspect the structure\n');

    console.log('Next steps:');
    console.log('1. Open dod-test-output.html in browser');
    console.log('2. Inspect HTML structure');
    console.log('3. Find selectors for:');
    console.log('   - Article title');
    console.log('   - Published date');
    console.log('   - Contract paragraphs');
    console.log('4. Update parser accordingly');

  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\nTroubleshooting:');
    console.log('1. Check internet connection');
    console.log('2. Try different URL');
    console.log('3. May need Puppeteer for JavaScript-heavy sites');
  }
}

// Run the test
testDoDScraping()
  .then(() => {
    console.log('\n✅ Test complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

