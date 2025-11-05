#!/usr/bin/env tsx
import 'dotenv/config';
import { scrapeSingleArticle } from './src/lib/mantech-scraper';

// Test article URL
const TEST_URL = 'https://www.dodmantech.mil/News/Article/4292977/officials-aim-to-field-critical-technologies-rapidly-at-quantity/';

async function testSaveToDatabase() {
  console.log('============================================================');
  console.log('DOD ManTech - Test Save to Database');
  console.log('============================================================');
  console.log(`Testing: ${TEST_URL}`);
  console.log('');
  
  try {
    const result = await scrapeSingleArticle(TEST_URL, 'News');
    
    if (result.success && result.projectSaved) {
      console.log('\n✓ Successfully scraped and saved to database!');
      console.log('\nNow check the database with this SQL:');
      console.log('SELECT');
      console.log('  article_id,');
      console.log('  article_title,');
      console.log('  published_date,');
      console.log('  mantech_component,');
      console.log('  transition_stage,');
      console.log('  technology_focus,');
      console.log('  companies_involved,');
      console.log('  weapon_systems,');
      console.log('  states,');
      console.log('  parsing_confidence');
      console.log('FROM mantech_projects');
      console.log('WHERE article_id = 4292977;');
    } else {
      console.log('\n✗ Failed to save to database');
    }
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

testSaveToDatabase();

