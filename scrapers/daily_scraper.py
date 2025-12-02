"""
Daily Incremental Scraper

Runs daily to:
1. Scrape newly added companies
2. Refresh stale companies (not updated in 90+ days)
3. Update employee data

Designed to run as a GitHub Action
"""

import asyncio
from datetime import datetime, timedelta
from loguru import logger
from historical_scraper import HistoricalScraper
from database import ScraperDatabase


class DailyScraper(HistoricalScraper):
    """Daily incremental scraper (extends historical scraper)"""
    
    def __init__(self):
        super().__init__()
    
    async def run_daily(self, max_companies: int = 100):
        """
        Run daily incremental scraper
        
        Args:
            max_companies: Max companies to scrape per day
        """
        logger.info("=== Daily Incremental Scraper ===")
        
        # Priority 1: New companies added in last 24 hours
        new_companies_count = self._queue_new_companies()
        logger.info(f"Queued {new_companies_count} new companies")
        
        # Priority 2: Stale companies (not scraped in 90+ days)
        stale_count = self._queue_stale_companies(limit=50)
        logger.info(f"Queued {stale_count} stale companies for refresh")
        
        # Run scraper with daily settings
        await self.run(
            batch_size=10,
            max_per_day=max_companies,
            run_type='daily'
        )
        
        logger.info("Daily scraper complete!")
    
    def _queue_new_companies(self) -> int:
        """
        Queue newly added companies (added in last 24 hours)
        
        Returns:
            Number of companies queued
        """
        try:
            # Get companies added in last 24 hours
            yesterday = datetime.now() - timedelta(days=1)
            
            response = self.db.client.table('company_intelligence') \
                .select('id, company_name, website') \
                .gte('created_at', yesterday.isoformat()) \
                .execute()
            
            new_companies = response.data
            
            if not new_companies:
                return 0
            
            # Build queue items
            queue_items = []
            for company in new_companies:
                queue_items.append({
                    'company_intelligence_id': company['id'],
                    'company_name': company['company_name'],
                    'website_url': company.get('website'),
                    'linkedin_url': None,  # TODO: Get LinkedIn URL
                    'scrape_type': 'full',
                    'priority': 9,  # High priority for new companies
                    'priority_reason': 'Newly added company',
                    'status': 'pending'
                })
            
            # Insert into queue
            if queue_items:
                inserted = self.db.bulk_insert_queue(queue_items)
                return inserted
            
        except Exception as e:
            logger.error(f"Error queuing new companies: {e}")
        
        return 0
    
    def _queue_stale_companies(self, limit: int = 50) -> int:
        """
        Queue companies that haven't been scraped in 90+ days
        
        Args:
            limit: Max number of stale companies to queue
            
        Returns:
            Number of companies queued
        """
        try:
            # Get companies with stale LinkedIn data
            ninety_days_ago = datetime.now() - timedelta(days=90)
            
            response = self.db.client.table('company_linkedin_profiles') \
                .select('company_intelligence_id, company_name') \
                .lte('last_scraped', ninety_days_ago.isoformat()) \
                .limit(limit) \
                .execute()
            
            stale_companies = response.data
            
            if not stale_companies:
                return 0
            
            # Build queue items
            queue_items = []
            for company in stale_companies:
                queue_items.append({
                    'company_intelligence_id': company['company_intelligence_id'],
                    'company_name': company['company_name'],
                    'website_url': None,  # Will be fetched from company_intelligence
                    'linkedin_url': None,
                    'scrape_type': 'refresh',
                    'priority': 6,
                    'priority_reason': 'Stale data (>90 days)',
                    'status': 'pending'
                })
            
            # Insert into queue
            if queue_items:
                inserted = self.db.bulk_insert_queue(queue_items)
                return inserted
            
        except Exception as e:
            logger.error(f"Error queuing stale companies: {e}")
        
        return 0


async def main():
    """Run daily scraper"""
    scraper = DailyScraper()
    await scraper.run_daily(max_companies=100)


if __name__ == '__main__':
    asyncio.run(main())


