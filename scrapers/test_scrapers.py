"""
Test Script for Company Enrichment Scrapers

Tests LinkedIn and website scrapers on sample companies
to validate functionality before running at scale.
"""

import asyncio
from loguru import logger
from linkedin_scraper import LinkedInScraper
from website_scraper import WebsiteScraper


# Test companies (major defense contractors with public data)
TEST_COMPANIES = [
    {
        'name': 'Lockheed Martin',
        'linkedin': 'https://www.linkedin.com/company/lockheed-martin/',
        'website': 'https://www.lockheedmartin.com'
    },
    {
        'name': 'Raytheon Technologies',
        'linkedin': 'https://www.linkedin.com/company/raytheon/',
        'website': 'https://www.rtx.com'
    },
    {
        'name': 'Northrop Grumman',
        'linkedin': 'https://www.linkedin.com/company/northrop-grumman-corporation/',
        'website': 'https://www.northropgrumman.com'
    },
    {
        'name': 'General Dynamics',
        'linkedin': 'https://www.linkedin.com/company/general-dynamics/',
        'website': 'https://www.gd.com'
    },
    {
        'name': 'Boeing',
        'linkedin': 'https://www.linkedin.com/company/boeing/',
        'website': 'https://www.boeing.com'
    }
]


async def test_linkedin_scraper():
    """Test LinkedIn scraper on sample companies"""
    logger.info("=== Testing LinkedIn Scraper ===\n")
    
    scraper = LinkedInScraper()
    await scraper.init_browser(headless=False)  # Use headless=True for production
    
    results = []
    
    try:
        for company in TEST_COMPANIES[:2]:  # Test first 2 companies
            logger.info(f"Testing: {company['name']}")
            
            # Scrape company profile
            profile_data = await scraper.scrape_company_profile(company['linkedin'])
            
            if profile_data:
                logger.info(f"✓ Company Profile Scraped:")
                logger.info(f"  - Name: {profile_data.get('company_name')}")
                logger.info(f"  - Industry: {profile_data.get('industry')}")
                logger.info(f"  - Size: {profile_data.get('company_size')}")
                logger.info(f"  - Followers: {profile_data.get('follower_count')}")
                logger.info(f"  - Headquarters: {profile_data.get('headquarters')}")
                
                # Scrape employees (limited for testing)
                employees = await scraper.scrape_employees(
                    company['linkedin'], 
                    max_employees=10
                )
                
                if employees:
                    logger.info(f"✓ Found {len(employees)} employees:")
                    for emp in employees[:5]:
                        logger.info(f"  - {emp['full_name']}: {emp['current_title']}")
                
                results.append({
                    'company': company['name'],
                    'profile': profile_data,
                    'employees': employees,
                    'success': True
                })
            else:
                logger.error(f"✗ Failed to scrape {company['name']}")
                results.append({
                    'company': company['name'],
                    'success': False
                })
            
            logger.info("")  # Blank line
    
    finally:
        await scraper.close()
    
    # Summary
    logger.info("=== LinkedIn Scraper Test Summary ===")
    successful = sum(1 for r in results if r['success'])
    logger.info(f"Successful: {successful}/{len(results)}")
    
    return results


def test_website_scraper():
    """Test website scraper on sample companies"""
    logger.info("\n=== Testing Website Scraper ===\n")
    
    scraper = WebsiteScraper()
    results = []
    
    for company in TEST_COMPANIES[:3]:  # Test first 3 companies
        logger.info(f"Testing: {company['name']}")
        
        # Scrape website
        website_data = scraper.scrape_company_website(company['website'])
        
        if website_data:
            logger.info(f"✓ Website Scraped:")
            logger.info(f"  - Leadership: {len(website_data.get('leadership_team', []))} members")
            logger.info(f"  - Emails: {len(website_data.get('discovered_emails', []))}")
            logger.info(f"  - Email Pattern: {website_data.get('email_pattern')}")
            logger.info(f"  - Certifications: {website_data.get('certifications')}")
            logger.info(f"  - Social Links: {list(website_data.get('social_links', {}).keys())}")
            logger.info(f"  - Richness Score: {website_data.get('content_richness_score')}/100")
            
            if website_data.get('leadership_team'):
                logger.info(f"  - Top Leaders:")
                for leader in website_data['leadership_team'][:3]:
                    logger.info(f"    - {leader.get('name')}: {leader.get('title')}")
            
            results.append({
                'company': company['name'],
                'website_data': website_data,
                'success': True
            })
        else:
            logger.error(f"✗ Failed to scrape {company['name']}")
            results.append({
                'company': company['name'],
                'success': False
            })
        
        logger.info("")  # Blank line
    
    # Summary
    logger.info("=== Website Scraper Test Summary ===")
    successful = sum(1 for r in results if r['success'])
    logger.info(f"Successful: {successful}/{len(results)}")
    
    return results


async def test_full_pipeline():
    """Test full scraping pipeline end-to-end"""
    logger.info("\n=== Testing Full Pipeline ===\n")
    
    test_company = TEST_COMPANIES[0]  # Lockheed Martin
    
    # Test LinkedIn
    linkedin_scraper = LinkedInScraper()
    await linkedin_scraper.init_browser(headless=False)
    
    logger.info(f"Testing full pipeline for: {test_company['name']}")
    
    try:
        # LinkedIn scraping
        logger.info("\n1. Scraping LinkedIn...")
        linkedin_data = await linkedin_scraper.scrape_company_profile(test_company['linkedin'])
        
        if linkedin_data:
            logger.info(f"✓ LinkedIn profile: {linkedin_data.get('company_name')}")
            
            employees = await linkedin_scraper.scrape_employees(test_company['linkedin'], max_employees=20)
            logger.info(f"✓ Employees: {len(employees)}")
        else:
            logger.error("✗ LinkedIn scraping failed")
        
        # Website scraping
        logger.info("\n2. Scraping Website...")
        website_scraper = WebsiteScraper()
        website_data = website_scraper.scrape_company_website(test_company['website'])
        
        if website_data:
            logger.info(f"✓ Website scraped")
            logger.info(f"  - Leadership: {len(website_data.get('leadership_team', []))}")
            logger.info(f"  - Emails: {len(website_data.get('discovered_emails', []))}")
        else:
            logger.error("✗ Website scraping failed")
        
        # Data quality check
        logger.info("\n3. Data Quality Check:")
        
        quality_checks = {
            'LinkedIn profile': linkedin_data is not None,
            'Company size data': linkedin_data.get('company_size') is not None if linkedin_data else False,
            'Employee data': len(employees) > 0 if employees else False,
            'Website data': website_data is not None,
            'Leadership data': len(website_data.get('leadership_team', [])) > 0 if website_data else False,
            'Email discovery': len(website_data.get('discovered_emails', [])) > 0 if website_data else False,
        }
        
        passed = sum(quality_checks.values())
        total = len(quality_checks)
        
        for check, result in quality_checks.items():
            logger.info(f"  {'✓' if result else '✗'} {check}")
        
        logger.info(f"\nQuality Score: {passed}/{total} ({passed/total*100:.0f}%)")
        
        if passed >= total * 0.7:
            logger.info("✓ Pipeline test PASSED")
            return True
        else:
            logger.error("✗ Pipeline test FAILED - Quality too low")
            return False
    
    finally:
        await linkedin_scraper.close()


async def run_all_tests():
    """Run all scraper tests"""
    logger.info("=================================================")
    logger.info("    Company Enrichment Scraper Test Suite")
    logger.info("=================================================\n")
    
    # Test LinkedIn scraper
    linkedin_results = await test_linkedin_scraper()
    
    # Test website scraper
    website_results = test_website_scraper()
    
    # Test full pipeline
    pipeline_success = await test_full_pipeline()
    
    # Final summary
    logger.info("\n=================================================")
    logger.info("                  Final Summary")
    logger.info("=================================================")
    
    linkedin_success = sum(1 for r in linkedin_results if r['success'])
    website_success = sum(1 for r in website_results if r['success'])
    
    logger.info(f"LinkedIn Tests: {linkedin_success}/{len(linkedin_results)} passed")
    logger.info(f"Website Tests: {website_success}/{len(website_results)} passed")
    logger.info(f"Pipeline Test: {'PASSED' if pipeline_success else 'FAILED'}")
    
    total_passed = linkedin_success + website_success + (1 if pipeline_success else 0)
    total_tests = len(linkedin_results) + len(website_results) + 1
    
    logger.info(f"\nOverall: {total_passed}/{total_tests} tests passed ({total_passed/total_tests*100:.0f}%)")
    
    if total_passed >= total_tests * 0.7:
        logger.info("\n✓ Test suite PASSED - Ready for production!")
        logger.info("\nNext steps:")
        logger.info("1. Run: python build_queue.py")
        logger.info("2. Run: python historical_scraper.py 10")
        logger.info("3. Monitor results in database")
        logger.info("4. Scale up to full production")
    else:
        logger.error("\n✗ Test suite FAILED - Fix issues before production")
        logger.info("\nRecommendations:")
        logger.info("1. Check network connectivity")
        logger.info("2. Verify website/LinkedIn URLs")
        logger.info("3. Review error logs")
        logger.info("4. Test with different companies")


if __name__ == '__main__':
    # Configure logger for testing
    logger.remove()
    logger.add(
        lambda msg: print(msg, end=''),
        format="<level>{message}</level>",
        level="INFO",
        colorize=True
    )
    
    # Run tests
    asyncio.run(run_all_tests())


