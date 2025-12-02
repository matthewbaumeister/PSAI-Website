"""
Historical Scraper Orchestrator

Processes companies from the queue and orchestrates LinkedIn and website scraping.
"""

import asyncio
import time
from typing import Dict, List, Optional
from loguru import logger
from datetime import datetime

from linkedin_scraper import LinkedInScraper
from website_scraper import WebsiteScraper
from database import ScraperDatabase
from config import (
    BATCH_SIZE,
    MAX_COMPANIES_PER_DAY,
    MAX_RETRIES
)


class HistoricalScraper:
    """Orchestrates historical company scraping"""
    
    def __init__(self):
        self.db = ScraperDatabase()
        self.linkedin_scraper = None
        self.website_scraper = WebsiteScraper()
        self.run_id = None
        
        # Stats
        self.stats = {
            'companies_scraped': 0,
            'companies_successful': 0,
            'companies_failed': 0,
            'companies_skipped': 0,
            'linkedin_profiles_created': 0,
            'employees_discovered': 0,
            'employees_created': 0,
            'websites_scraped': 0,
        }
    
    async def run(
        self,
        batch_size: int = BATCH_SIZE,
        max_per_day: int = MAX_COMPANIES_PER_DAY,
        run_type: str = 'historical'
    ):
        """
        Run historical scraper
        
        Args:
            batch_size: Number of companies to process per batch
            max_per_day: Maximum companies to scrape per day
            run_type: Type of run ('historical', 'daily', 'manual')
        """
        logger.info("=== Starting Historical Scraper ===")
        logger.info(f"Max per day: {max_per_day}, Batch size: {batch_size}")
        
        # Initialize LinkedIn scraper
        self.linkedin_scraper = LinkedInScraper()
        await self.linkedin_scraper.init_browser(headless=True)
        
        # Create run log
        self.run_id = self.db.create_run_log(
            run_type=run_type,
            scrape_type='full',
            triggered_by='script'
        )
        
        start_time = time.time()
        
        try:
            total_scraped = 0
            
            while total_scraped < max_per_day:
                # Get next batch
                queue_items = self.db.get_next_batch(batch_size=batch_size)
                
                if not queue_items:
                    logger.info("Queue empty - no more companies to scrape")
                    break
                
                logger.info(f"\n=== Processing batch of {len(queue_items)} companies ===")
                
                # Process batch
                for item in queue_items:
                    await self.process_company(item)
                    total_scraped += 1
                    
                    # Update run log periodically
                    if total_scraped % 10 == 0:
                        self.db.update_run_log(self.run_id, self.stats)
                    
                    # Check if reached limit
                    if total_scraped >= max_per_day:
                        logger.info(f"Reached daily limit ({max_per_day})")
                        break
                
                logger.info(f"Batch complete. Total scraped: {total_scraped}/{max_per_day}")
            
            # Calculate duration
            duration = int(time.time() - start_time)
            self.stats['duration_seconds'] = duration
            
            # Complete run log
            self.db.complete_run_log(self.run_id, self.stats)
            
            logger.info("\n=== Historical Scraper Complete ===")
            logger.info(f"Total companies: {total_scraped}")
            logger.info(f"Successful: {self.stats['companies_successful']}")
            logger.info(f"Failed: {self.stats['companies_failed']}")
            logger.info(f"LinkedIn profiles: {self.stats['linkedin_profiles_created']}")
            logger.info(f"Employees found: {self.stats['employees_discovered']}")
            logger.info(f"Websites scraped: {self.stats['websites_scraped']}")
            logger.info(f"Duration: {duration} seconds")
            
        except KeyboardInterrupt:
            logger.warning("Scraper interrupted by user")
            self.db.update_run_log(self.run_id, {'status': 'paused', **self.stats})
        except Exception as e:
            logger.error(f"Fatal error in scraper: {e}")
            self.db.update_run_log(self.run_id, {
                'status': 'failed',
                'errors': [str(e)],
                **self.stats
            })
        finally:
            await self.linkedin_scraper.close()
    
    async def process_company(self, queue_item: Dict):
        """
        Process a single company
        
        Args:
            queue_item: Queue item dict from database
        """
        company_id = queue_item['company_intelligence_id']
        company_name = queue_item['company_name']
        queue_id = queue_item['id']
        
        logger.info(f"\n--- Processing: {company_name} (Priority: {queue_item['priority']}) ---")
        
        # Mark as in progress
        self.db.mark_queue_item_in_progress(queue_id)
        
        results = {
            'linkedin_scraped': False,
            'linkedin_employees_scraped': False,
            'website_scraped': False,
            'employees_found': 0,
            'linkedin_profile_id': None,
            'website_data_id': None,
        }
        
        success = False
        error_message = None
        
        try:
            # Scrape LinkedIn (if URL provided)
            if queue_item.get('linkedin_url'):
                linkedin_result = await self._scrape_linkedin(
                    queue_item['linkedin_url'],
                    company_id,
                    company_name
                )
                
                if linkedin_result:
                    results.update(linkedin_result)
                    success = True
            
            # Scrape Website (if URL provided)
            if queue_item.get('website_url'):
                website_result = self._scrape_website(
                    queue_item['website_url'],
                    company_id,
                    company_name
                )
                
                if website_result:
                    results['website_scraped'] = True
                    results['website_data_id'] = website_result
                    success = True
            
            # Update stats
            self.stats['companies_scraped'] += 1
            if success:
                self.stats['companies_successful'] += 1
            else:
                self.stats['companies_skipped'] += 1
            
            # Mark as completed
            self.db.mark_queue_item_completed(queue_id, results)
            
            status = []
            if results['linkedin_scraped']:
                status.append(f"LinkedIn ✓")
            if results['linkedin_employees_scraped']:
                status.append(f"{results['employees_found']} employees ✓")
            if results['website_scraped']:
                status.append(f"Website ✓")
            
            logger.info(f"✓ {company_name}: {', '.join(status) if status else 'Skipped'}")
            
        except Exception as e:
            error_message = str(e)
            logger.error(f"✗ {company_name}: {error_message}")
            
            # Mark as failed
            self.db.mark_queue_item_failed(
                queue_id,
                error_message,
                queue_item.get('attempt_count', 0)
            )
            
            self.stats['companies_failed'] += 1
    
    async def _scrape_linkedin(
        self,
        linkedin_url: str,
        company_id: int,
        company_name: str
    ) -> Optional[Dict]:
        """Scrape LinkedIn company and employees"""
        result = {
            'linkedin_scraped': False,
            'linkedin_employees_scraped': False,
            'employees_found': 0,
            'linkedin_profile_id': None
        }
        
        try:
            # Scrape company profile
            profile_data = await self.linkedin_scraper.scrape_company_profile(linkedin_url)
            
            if not profile_data:
                logger.warning(f"Failed to scrape LinkedIn profile: {linkedin_url}")
                return None
            
            # Add company intelligence ID
            profile_data['company_intelligence_id'] = company_id
            profile_data['company_name'] = company_name
            profile_data['vendor_uei'] = None  # TODO: Get from company record
            profile_data['vendor_duns'] = None
            
            # Save to database
            profile_id = self.db.save_linkedin_profile(profile_data)
            
            if profile_id:
                result['linkedin_scraped'] = True
                result['linkedin_profile_id'] = profile_id
                self.stats['linkedin_profiles_created'] += 1
                
                # Scrape employees (limited for historical)
                employees = await self.linkedin_scraper.scrape_employees(
                    linkedin_url,
                    max_employees=50  # Limit for historical scrape
                )
                
                if employees:
                    # Enrich employee data
                    enriched_employees = []
                    for emp in employees:
                        enriched_emp = {
                            'company_intelligence_id': company_id,
                            'linkedin_profile_id': profile_id,
                            'company_name': company_name,
                            'full_name': emp.get('full_name'),
                            'current_title': emp.get('current_title'),
                            'linkedin_url': emp.get('linkedin_url'),
                            'is_current_employee': True,
                        }
                        enriched_employees.append(enriched_emp)
                    
                    # Save employees
                    saved_count = self.db.save_employees(enriched_employees)
                    
                    result['linkedin_employees_scraped'] = True
                    result['employees_found'] = len(employees)
                    self.stats['employees_discovered'] += len(employees)
                    self.stats['employees_created'] += saved_count
                
                return result
            
        except Exception as e:
            logger.error(f"Error scraping LinkedIn for {company_name}: {e}")
        
        return None
    
    def _scrape_website(
        self,
        website_url: str,
        company_id: int,
        company_name: str
    ) -> Optional[int]:
        """Scrape company website"""
        try:
            # Scrape website
            website_data = self.website_scraper.scrape_company_website(website_url)
            
            if not website_data:
                logger.warning(f"Failed to scrape website: {website_url}")
                return None
            
            # Add company intelligence ID
            website_data['company_intelligence_id'] = company_id
            website_data['company_name'] = company_name
            
            # Save to database
            record_id = self.db.save_website_data(website_data)
            
            if record_id:
                self.stats['websites_scraped'] += 1
                return record_id
            
        except Exception as e:
            logger.error(f"Error scraping website for {company_name}: {e}")
        
        return None


async def main():
    """Run historical scraper"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Historical Company Public Info Scraper')
    parser.add_argument('--batch-size', type=int, default=BATCH_SIZE, help='Number of companies per batch')
    parser.add_argument('--max-per-day', type=int, default=MAX_COMPANIES_PER_DAY, help='Max companies per day')
    parser.add_argument('--test-mode', action='store_true', help='Run in test mode')
    
    args = parser.parse_args()
    
    logger.info(f"Starting scraper with batch_size={args.batch_size}, max_per_day={args.max_per_day}")
    
    scraper = HistoricalScraper()
    await scraper.run(
        batch_size=args.batch_size,
        max_per_day=args.max_per_day,
        run_type='historical'
    )


if __name__ == '__main__':
    asyncio.run(main())

