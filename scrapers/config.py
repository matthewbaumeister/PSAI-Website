"""
Configuration for company enrichment scrapers
"""
import os
from dotenv import load_dotenv

load_dotenv()

# Supabase credentials
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

# Rate limiting (requests per second)
LINKEDIN_RATE_LIMIT = 0.2  # 1 request per 5 seconds
WEBSITE_RATE_LIMIT = 1.0   # 1 request per second

# Retry configuration
MAX_RETRIES = 3
BACKOFF_FACTOR = 2

# LinkedIn scraping
LINKEDIN_MAX_EMPLOYEES_PER_COMPANY = 100  # For historical scrape
LINKEDIN_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

# Website scraping
WEBSITE_MAX_DEPTH = 3
WEBSITE_TIMEOUT = 30  # seconds
WEBSITE_MAX_PAGES_PER_SITE = 10

# Batch processing
BATCH_SIZE = 10
MAX_COMPANIES_PER_DAY = 200  # Historical scraper daily limit

# Proxy configuration (optional)
USE_PROXY = os.getenv('USE_PROXY', 'false').lower() == 'true'
PROXY_URL = os.getenv('PROXY_URL')  # Format: http://user:pass@proxy:port

# Logging
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
LOG_FILE = 'logs/scraper.log'


