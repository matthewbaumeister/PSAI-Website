"""
Database helper functions for scraper operations
"""

from typing import List, Dict, Optional
from supabase import create_client, Client
from loguru import logger
from config import SUPABASE_URL, SUPABASE_KEY


class ScraperDatabase:
    """Database operations for scrapers"""
    
    def __init__(self):
        self.client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Queue Operations
    
    def get_next_batch(self, batch_size: int = 10, scrape_type: str = 'full') -> List[Dict]:
        """
        Get next batch of companies to scrape from queue
        
        Args:
            batch_size: Number of items to fetch
            scrape_type: Type of scrape ('full', 'linkedin_only', 'website_only')
            
        Returns:
            List of queue items
        """
        try:
            response = self.client.table('company_public_info_scraper_queue') \
                .select('*') \
                .eq('status', 'pending') \
                .order('priority', desc=True) \
                .order('created_at', desc=False) \
                .limit(batch_size) \
                .execute()
            
            return response.data
            
        except Exception as e:
            logger.error(f"Error fetching queue batch: {e}")
            return []
    
    def mark_queue_item_in_progress(self, queue_id: int):
        """Mark queue item as in progress"""
        try:
            self.client.table('company_public_info_scraper_queue') \
                .update({'status': 'in_progress', 'started_at': 'now()'}) \
                .eq('id', queue_id) \
                .execute()
        except Exception as e:
            logger.error(f"Error marking queue item {queue_id} as in progress: {e}")
    
    def mark_queue_item_completed(
        self, 
        queue_id: int, 
        results: Dict
    ):
        """Mark queue item as completed with results"""
        try:
            update_data = {
                'status': 'completed',
                'completed_at': 'now()',
                **results
            }
            
            self.client.table('company_public_info_scraper_queue') \
                .update(update_data) \
                .eq('id', queue_id) \
                .execute()
                
            logger.debug(f"Marked queue item {queue_id} as completed")
            
        except Exception as e:
            logger.error(f"Error marking queue item {queue_id} as completed: {e}")
    
    def mark_queue_item_failed(
        self, 
        queue_id: int, 
        error_message: str,
        attempt_count: int
    ):
        """Mark queue item as failed"""
        try:
            self.client.table('company_public_info_scraper_queue') \
                .update({
                    'status': 'failed',
                    'last_error': error_message,
                    'attempt_count': attempt_count + 1,
                    'last_attempted_at': 'now()'
                }) \
                .eq('id', queue_id) \
                .execute()
                
            logger.warning(f"Marked queue item {queue_id} as failed: {error_message}")
            
        except Exception as e:
            logger.error(f"Error marking queue item {queue_id} as failed: {e}")
    
    # LinkedIn Profile Operations
    
    def save_linkedin_profile(self, profile_data: Dict) -> Optional[int]:
        """
        Save LinkedIn profile to database
        
        Args:
            profile_data: Profile data dict
            
        Returns:
            Profile ID or None if failed
        """
        try:
            response = self.client.table('company_linkedin_profiles') \
                .insert(profile_data) \
                .execute()
            
            if response.data:
                profile_id = response.data[0]['id']
                logger.info(f"Saved LinkedIn profile: {profile_data.get('company_name')} (ID: {profile_id})")
                return profile_id
            
        except Exception as e:
            logger.error(f"Error saving LinkedIn profile: {e}")
        
        return None
    
    def save_employees(self, employees: List[Dict]) -> int:
        """
        Bulk save employees
        
        Args:
            employees: List of employee dicts
            
        Returns:
            Number of employees saved
        """
        if not employees:
            return 0
        
        try:
            # Insert in batches of 100
            batch_size = 100
            total_saved = 0
            
            for i in range(0, len(employees), batch_size):
                batch = employees[i:i+batch_size]
                
                response = self.client.table('company_employees') \
                    .insert(batch) \
                    .execute()
                
                if response.data:
                    total_saved += len(response.data)
            
            logger.info(f"Saved {total_saved} employees")
            return total_saved
            
        except Exception as e:
            logger.error(f"Error saving employees: {e}")
            return 0
    
    # Website Data Operations
    
    def save_website_data(self, website_data: Dict) -> Optional[int]:
        """
        Save website scraping data
        
        Args:
            website_data: Website data dict
            
        Returns:
            Record ID or None if failed
        """
        try:
            response = self.client.table('company_website_data') \
                .insert(website_data) \
                .execute()
            
            if response.data:
                record_id = response.data[0]['id']
                logger.info(f"Saved website data: {website_data.get('company_name')} (ID: {record_id})")
                return record_id
            
        except Exception as e:
            logger.error(f"Error saving website data: {e}")
        
        return None
    
    # Run Log Operations
    
    def create_run_log(self, run_type: str, scrape_type: str, triggered_by: str = 'manual') -> int:
        """
        Create a new scraper run log
        
        Args:
            run_type: Type of run ('historical', 'daily', 'manual')
            scrape_type: Type of scrape ('full', 'linkedin_only', 'website_only')
            triggered_by: Who/what triggered the run
            
        Returns:
            Run log ID
        """
        try:
            response = self.client.table('company_public_info_scraper_run_log') \
                .insert({
                    'run_type': run_type,
                    'scrape_type': scrape_type,
                    'triggered_by': triggered_by,
                    'status': 'running'
                }) \
                .execute()
            
            if response.data:
                run_id = response.data[0]['id']
                logger.info(f"Created run log: {run_type}/{scrape_type} (ID: {run_id})")
                return run_id
            
        except Exception as e:
            logger.error(f"Error creating run log: {e}")
        
        return 0
    
    def update_run_log(self, run_id: int, updates: Dict):
        """Update run log with stats"""
        try:
            self.client.table('company_public_info_scraper_run_log') \
                .update(updates) \
                .eq('id', run_id) \
                .execute()
        except Exception as e:
            logger.error(f"Error updating run log {run_id}: {e}")
    
    def complete_run_log(self, run_id: int, stats: Dict):
        """Mark run as completed with final stats"""
        try:
            update_data = {
                'status': 'completed',
                'completed_at': 'now()',
                **stats
            }
            
            self.client.table('company_public_info_scraper_run_log') \
                .update(update_data) \
                .eq('id', run_id) \
                .execute()
            
            logger.info(f"Completed run log {run_id}")
            
        except Exception as e:
            logger.error(f"Error completing run log {run_id}: {e}")
    
    # Queue Building
    
    def get_all_companies_for_queue(self) -> List[Dict]:
        """
        Get all companies that need to be scraped
        
        Returns:
            List of companies with basic info
        """
        try:
            # Get from company_intelligence table
            response = self.client.table('company_intelligence') \
                .select('id, company_name, website, linkedin_url, vendor_uei, vendor_duns') \
                .execute()
            
            companies = response.data
            logger.info(f"Fetched {len(companies)} companies from database")
            
            return companies
            
        except Exception as e:
            logger.error(f"Error fetching companies: {e}")
            return []
    
    def get_company_stats(self, company_id: int) -> Optional[Dict]:
        """
        Get company contract statistics for prioritization
        
        Args:
            company_id: Company intelligence ID
            
        Returns:
            Dict with stats or None
        """
        try:
            response = self.client.table('fpds_company_stats') \
                .select('*') \
                .eq('company_intelligence_id', company_id) \
                .execute()
            
            if response.data:
                return response.data[0]
            
        except Exception as e:
            logger.error(f"Error fetching company stats for {company_id}: {e}")
        
        return None
    
    def bulk_insert_queue(self, queue_items: List[Dict]) -> int:
        """
        Bulk insert queue items
        
        Args:
            queue_items: List of queue item dicts
            
        Returns:
            Number of items inserted
        """
        try:
            # Insert in batches of 1000
            batch_size = 1000
            total_inserted = 0
            
            for i in range(0, len(queue_items), batch_size):
                batch = queue_items[i:i+batch_size]
                
                response = self.client.table('company_public_info_scraper_queue') \
                    .insert(batch) \
                    .execute()
                
                if response.data:
                    total_inserted += len(response.data)
                    logger.info(f"Inserted batch {i//batch_size + 1}: {len(response.data)} items")
            
            logger.info(f"Total queue items inserted: {total_inserted}")
            return total_inserted
            
        except Exception as e:
            logger.error(f"Error bulk inserting queue items: {e}")
            return 0
    
    def check_if_already_scraped(self, company_id: int) -> Dict:
        """
        Check if company has been scraped recently
        
        Args:
            company_id: Company intelligence ID
            
        Returns:
            Dict with scrape status
        """
        status = {
            'linkedin_scraped': False,
            'website_scraped': False,
            'days_since_scrape': None
        }
        
        try:
            # Check LinkedIn profile
            linkedin_response = self.client.table('company_linkedin_profiles') \
                .select('last_scraped') \
                .eq('company_intelligence_id', company_id) \
                .execute()
            
            if linkedin_response.data:
                status['linkedin_scraped'] = True
            
            # Check website data
            website_response = self.client.table('company_website_data') \
                .select('last_scraped') \
                .eq('company_intelligence_id', company_id) \
                .execute()
            
            if website_response.data:
                status['website_scraped'] = True
            
        except Exception as e:
            logger.error(f"Error checking scrape status for company {company_id}: {e}")
        
        return status

