#!/usr/bin/env tsx
import 'dotenv/config';
import { scrapeSingleArticle, parseArticleHTML, extractProjectData, fetchArticleHTML } from './src/lib/mantech-scraper';

// Test article URL - one of the recently scraped articles
const TEST_URL = 'https://www.dodmantech.mil/News/Article/4292977/officials-aim-to-field-critical-technologies-rapidly-at-quantity/';

async function testExtraction() {
  console.log('============================================================');
  console.log('DOD ManTech Extraction Test');
  console.log('============================================================');
  console.log(`Testing: ${TEST_URL}`);
  console.log('');
  
  try {
    // Fetch HTML
    console.log('1. Fetching HTML...');
    const html = await fetchArticleHTML(TEST_URL);
    if (!html) {
      console.error('Failed to fetch HTML');
      process.exit(1);
    }
    console.log(`   ✓ Fetched ${html.length} characters`);
    console.log('');
    
    // Parse HTML
    console.log('2. Parsing HTML...');
    const parsed = parseArticleHTML(html, TEST_URL);
    if (!parsed) {
      console.error('Failed to parse HTML');
      process.exit(1);
    }
    console.log(`   ✓ Article ID: ${parsed.articleId}`);
    console.log(`   ✓ Title: ${parsed.articleTitle}`);
    console.log(`   ✓ Published Date: ${parsed.publishedDate || 'NOT EXTRACTED'}`);
    console.log(`   ✓ Content Length: ${parsed.content.length} characters`);
    console.log(`   ✓ Images: ${parsed.imageUrls.length}`);
    console.log(`   ✓ Documents: ${parsed.documentUrls.length}`);
    console.log('');
    
    // Extract project data
    console.log('3. Extracting Project Data...');
    const project = extractProjectData(parsed.content, parsed.articleTitle, 'News');
    
    console.log('\n============================================================');
    console.log('EXTRACTION RESULTS');
    console.log('============================================================');
    
    console.log('\nBASIC INFO:');
    console.log(`  Component: ${project.mantechComponent}`);
    console.log(`  Project Name: ${project.projectName || 'NOT EXTRACTED'}`);
    console.log(`  Transition Stage: ${project.transitionStage || 'NOT EXTRACTED'}`);
    console.log(`  Confidence: ${(project.parsingConfidence * 100).toFixed(1)}%`);
    
    console.log('\nTECHNOLOGY:');
    console.log(`  Tech Focus: ${project.technologyFocus.length > 0 ? project.technologyFocus.join(', ') : 'NONE'}`);
    console.log(`  Tech Tags: ${project.technologyTags.length > 0 ? project.technologyTags.join(', ') : 'NONE'}`);
    console.log(`  Manufacturing Processes: ${project.manufacturingProcesses.length > 0 ? project.manufacturingProcesses.join(', ') : 'NONE'}`);
    console.log(`  TRL: ${project.technologyReadinessLevel || 'NOT EXTRACTED'}`);
    console.log(`  MRL: ${project.manufacturingReadinessLevel || 'NOT EXTRACTED'}`);
    
    console.log('\nCOMPANIES & PARTNERS:');
    console.log(`  Companies: ${project.companiesInvolved.length > 0 ? project.companiesInvolved.join(', ') : 'NONE'}`);
    console.log(`  Prime Contractor: ${project.primeContractor || 'NOT EXTRACTED'}`);
    console.log(`  Academic: ${project.academicPartners.length > 0 ? project.academicPartners.join(', ') : 'NONE'}`);
    console.log(`  MII: ${project.manufacturingInnovationInstitutes.length > 0 ? project.manufacturingInnovationInstitutes.join(', ') : 'NONE'}`);
    
    console.log('\nFUNDING:');
    console.log(`  Amount: ${project.fundingAmount ? `$${project.fundingAmount.toLocaleString()}` : 'NOT EXTRACTED'}`);
    console.log(`  Text: ${project.fundingAmountText || 'NOT EXTRACTED'}`);
    console.log(`  Fiscal Year: ${project.fiscalYear || 'NOT EXTRACTED'}`);
    console.log(`  Cost Savings: ${project.costSavingsEstimated ? `$${project.costSavingsEstimated.toLocaleString()}` : 'NOT EXTRACTED'}`);
    
    console.log('\nWEAPON SYSTEMS & PLATFORMS:');
    console.log(`  Weapon Systems: ${project.weaponSystems.length > 0 ? project.weaponSystems.join(', ') : 'NONE'}`);
    console.log(`  Platforms: ${project.platforms.length > 0 ? project.platforms.join(', ') : 'NONE'}`);
    
    console.log('\nGEOGRAPHIC:');
    console.log(`  Locations: ${project.locations.length > 0 ? project.locations.join(', ') : 'NONE'}`);
    console.log(`  States: ${project.states.length > 0 ? project.states.join(', ') : 'NONE'}`);
    
    console.log('\nSBIR LINKAGE:');
    console.log(`  SBIR Linked: ${project.sbirLinked ? 'YES' : 'NO'}`);
    console.log(`  SBIR Company: ${project.sbirCompanyName || 'NOT EXTRACTED'}`);
    console.log(`  SBIR Topic: ${project.sbirTopicNumber || 'NOT EXTRACTED'}`);
    
    console.log('\nPOINT OF CONTACT:');
    console.log(`  Name: ${project.pocName || 'NOT EXTRACTED'}`);
    console.log(`  Email: ${project.pocEmail || 'NOT EXTRACTED'}`);
    console.log(`  Phone: ${project.pocPhone || 'NOT EXTRACTED'}`);
    
    console.log('\nKEYWORDS & TAGS:');
    console.log(`  Keywords: ${project.keywords.length > 0 ? project.keywords.join(', ') : 'NONE'}`);
    console.log(`  Industry Tags: ${project.industryTags.length > 0 ? project.industryTags.join(', ') : 'NONE'}`);
    
    console.log('\n============================================================');
    console.log('FIRST 500 CHARS OF CONTENT:');
    console.log('============================================================');
    console.log(parsed.content.substring(0, 500));
    console.log('...');
    
    console.log('\n============================================================');
    console.log('Test complete!');
    console.log('============================================================');
    
  } catch (error) {
    console.error('Error during test:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

testExtraction();

