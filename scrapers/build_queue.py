"""
Build Scraper Queue

Populates the company_public_info_scraper_queue table with prioritized companies
based on contract value, recent activity, and data completeness.
"""

import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from loguru import logger
from database import ScraperDatabase


class QueueBuilder:
    """Builds prioritized scraper queue"""
    
    def __init__(self):
        self.db = ScraperDatabase()
    
    def build_queue(self, force_refresh: bool = False):
        """
        Build the scraper queue with all companies
        
        Args:
            force_refresh: If True, queue even recently scraped companies
        """
        logger.info("Starting queue build...")
        
        # Get all companies
        companies = self.db.get_all_companies_for_queue()
        logger.info(f"Found {len(companies)} total companies")
        
        queue_items = []
        skipped = 0
        
        for company in companies:
            company_id = company['id']
            company_name = company['company_name']
            
            # Check if already scraped recently
            if not force_refresh:
                scrape_status = self.db.check_if_already_scraped(company_id)
                
                # Skip if both LinkedIn and website scraped recently (< 90 days)
                if scrape_status['linkedin_scraped'] and scrape_status['website_scraped']:
                    skipped += 1
                    continue
            
            # Get company stats for prioritization
            stats = self.db.get_company_stats(company_id)
            
            # Calculate priority
            priority, reason = self._calculate_priority(company, stats)
            
            # Determine scrape type
            scrape_type = 'full'  # Default to full
            
            # Build queue item
            queue_item = {
                'company_intelligence_id': company_id,
                'company_name': company_name,
                'website_url': company.get('website'),
                'linkedin_url': self._get_linkedin_url(company),
                'scrape_type': scrape_type,
                'priority': priority,
                'priority_reason': reason,
                'status': 'pending'
            }
            
            queue_items.append(queue_item)
        
        logger.info(f"Built queue with {len(queue_items)} companies (skipped {skipped})")
        
        # Insert into database
        if queue_items:
            inserted = self.db.bulk_insert_queue(queue_items)
            logger.info(f"Successfully inserted {inserted} queue items")
        else:
            logger.warning("No queue items to insert")
        
        return len(queue_items)
    
    def _calculate_priority(self, company: Dict, stats: Optional[Dict]) -> tuple[int, str]:
        """
        Calculate priority score (1-10) and reason
        
        Priority factors:
        - Contract value (high = urgent)
        - Recent activity
        - Data completeness
        - Strategic value
        """
        priority = 5  # Base priority
        reasons = []
        
        if stats:
            # Contract value priority
            total_value = stats.get('total_value', 0)
            
            if total_value > 10_000_000:
                priority = 10
                reasons.append(f"High contract value (${total_value:,.0f})")
            elif total_value > 1_000_000:
                priority = 8
                reasons.append(f"Significant contract value (${total_value:,.0f})")
            elif total_value > 100_000:
                priority = 6
                reasons.append(f"Notable contract value (${total_value:,.0f})")
            
            # Recent activity
            most_recent = stats.get('most_recent_contract_date')
            if most_recent:
                try:
                    if isinstance(most_recent, str):
                        recent_date = datetime.fromisoformat(most_recent.replace('Z', '+00:00'))
                    else:
                        recent_date = most_recent
                    
                    days_ago = (datetime.now(recent_date.tzinfo) - recent_date).days
                    
                    if days_ago < 30:
                        priority += 3
                        reasons.append("Very recent activity")
                    elif days_ago < 180:
                        priority += 2
                        reasons.append("Recent activity")
                except:
                    pass
            
            # Contract count
            total_contracts = stats.get('total_contracts', 0)
            if total_contracts > 50:
                priority += 1
                reasons.append("High contract volume")
            
            # Small business (more trackable)
            if stats.get('small_business'):
                priority += 2
                reasons.append("Small business")
        
        # Check if missing key data
        if not company.get('website'):
            priority -= 1
            reasons.append("No website URL")
        
        # Cap priority at 10
        priority = min(priority, 10)
        
        reason_str = "; ".join(reasons) if reasons else "Standard priority"
        
        return priority, reason_str
    
    def _get_linkedin_url(self, company: Dict) -> Optional[str]:
        """
        Get LinkedIn URL for company
        
        This might require checking company_intelligence table
        or inferring from company name.
        """
        # TODO: Implement LinkedIn URL lookup/inference
        # For now, return None - LinkedIn URLs should be added separately
        return None


def main():
    """Run queue builder"""
    builder = QueueBuilder()
    
    logger.info("=== Company Scraper Queue Builder ===")
    
    # Build queue
    count = builder.build_queue(force_refresh=False)
    
    logger.info(f"✓ Queue built successfully with {count} companies")
    logger.info("Ready to run historical scraper!")


if __name__ == '__main__':
    main()

