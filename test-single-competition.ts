/**
 * Test scraper on a single competition to verify all data is extracted correctly
 */
import 'dotenv/config';
import { ArmyXTechScraper } from './src/lib/army-xtech-scraper';

async function testSingleCompetition() {
  console.log('🧪 Testing single competition scrape...\n');
  
  const scraper = new ArmyXTechScraper();
  
  // Test URL - xTechSearch 9 (has finalists)
  const testUrl = 'https://xtech.army.mil/competition/xtechsearch-9/';
  
  console.log(`Testing: ${testUrl}\n`);
  console.log('=' .repeat(60));
  
  try {
    // @ts-ignore - Access private method for testing
    const html = await scraper.fetchHTML(testUrl);
    
    const cheerio = await import('cheerio');
    const $ = cheerio.load(html);
    
    // @ts-ignore - Access private method
    const details = await scraper.fetchCompetitionDetails(testUrl, 'Closed');
    
    console.log('\n📊 COMPETITION DETAILS:');
    console.log('=' .repeat(60));
    console.log(`Title: ${details.opportunity_title || 'MISSING'}`);
    console.log(`Description Length: ${details.description?.length || 0} chars`);
    console.log(`Total Prize Pool: $${details.total_prize_pool || 'MISSING'}`);
    console.log(`Status: ${details.status || 'MISSING'}`);
    console.log(`Competition Phase: ${details.competition_phase || 'MISSING'}`);
    console.log(`Open Date: ${details.open_date || 'MISSING'}`);
    console.log(`Close Date: ${details.close_date || 'MISSING'}`);
    console.log(`Award Date: ${details.award_date || 'MISSING'}`);
    console.log(`Submission Deadline: ${details.submission_deadline || 'MISSING'}`);
    console.log(`Eligibility Length: ${details.eligibility_requirements?.length || 0} chars`);
    console.log(`Phases Found: ${details.evaluation_stages?.length || 0}`);
    console.log(`Current Phase: ${details.current_phase_number || 'N/A'}/${details.total_phases || 'N/A'}`);
    console.log(`Phase Progress: ${details.phase_progress_percentage || 'N/A'}%`);
    
    console.log('\n🏆 WINNERS/FINALISTS:');
    console.log('=' .repeat(60));
    
    if (details.winners && details.winners.length > 0) {
      const statusCounts: Record<string, number> = {};
      details.winners.forEach((w: any) => {
        const status = w.submission_status || 'Unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      
      console.log(`Total Submissions: ${details.winners.length}`);
      console.log(`\nBreakdown by Status:`);
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
      });
      
      console.log(`\nFirst 5 Submissions:`);
      details.winners.slice(0, 5).forEach((w: any, idx: number) => {
        console.log(`  ${idx + 1}. [${w.submission_status || 'Unknown'}] ${w.company_name}`);
        if (w.description) {
          console.log(`     Description: ${w.description.substring(0, 80)}...`);
        }
      });
    } else {
      console.log('⚠️  NO WINNERS/FINALISTS FOUND');
    }
    
    console.log('\n✅ DATA QUALITY CHECK:');
    console.log('=' .repeat(60));
    
    const checks = {
      'Has Title': !!details.opportunity_title,
      'Has Description (>100 chars)': (details.description?.length || 0) > 100,
      'Has Prize Pool': !!details.total_prize_pool,
      'Has Open Date': !!details.open_date,
      'Has Close Date': !!details.close_date,
      'Has Eligibility': !!details.eligibility_requirements,
      'Has Phases': (details.evaluation_stages?.length || 0) > 0,
      'Has Phase Tracking': !!details.current_phase_number && !!details.total_phases,
      'Has Submissions': (details.winners?.length || 0) > 0,
      'Has Finalists': details.winners?.some((w: any) => w.submission_status === 'Finalist'),
      'Has Winners': details.winners?.some((w: any) => w.submission_status === 'Winner'),
    };
    
    Object.entries(checks).forEach(([check, passed]) => {
      const icon = passed ? '✅' : '❌';
      console.log(`${icon} ${check}`);
    });
    
    const passedChecks = Object.values(checks).filter(v => v).length;
    const totalChecks = Object.keys(checks).length;
    
    console.log(`\n📈 Score: ${passedChecks}/${totalChecks} checks passed`);
    
    if (passedChecks === totalChecks) {
      console.log('\n🎉 ALL CHECKS PASSED! Scraper is working correctly!');
    } else if (passedChecks >= totalChecks * 0.8) {
      console.log('\n⚠️  Most checks passed, but some data is missing');
    } else {
      console.log('\n❌ SCRAPER NEEDS FIXES - Too much data missing');
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error);
    process.exit(1);
  }
}

testSingleCompetition();

