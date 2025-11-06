#!/bin/bash
# ============================================
# Military News Scraper - Quick Test Script
# ============================================
# Tests the scraper setup and validates basic functionality
# Run this AFTER setting up database and environment variables
# ============================================

set -e  # Exit on error

echo "============================================"
echo "Military News Scraper - Setup Test"
echo "============================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running from correct directory
if [ ! -f "scripts/military_news_historical_scraper.py" ]; then
    echo -e "${RED}Error: Run this script from the project root directory${NC}"
    echo "Current directory: $(pwd)"
    exit 1
fi

echo -e "${YELLOW}Step 1: Checking environment variables...${NC}"
if [ -z "$SUPABASE_URL" ]; then
    echo -e "${RED}Error: SUPABASE_URL not set${NC}"
    echo "Set with: export SUPABASE_URL='https://your-project.supabase.co'"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo -e "${RED}Error: SUPABASE_SERVICE_KEY not set${NC}"
    echo "Set with: export SUPABASE_SERVICE_KEY='your-service-role-key'"
    exit 1
fi

echo -e "${GREEN}Environment variables OK${NC}"
echo ""

echo -e "${YELLOW}Step 2: Checking Python installation...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: python3 not found${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 --version)
echo -e "${GREEN}Python found: $PYTHON_VERSION${NC}"
echo ""

echo -e "${YELLOW}Step 3: Checking required packages...${NC}"
MISSING_PACKAGES=()

for package in requests beautifulsoup4 supabase; do
    if ! python3 -c "import ${package//-/_}" 2>/dev/null; then
        MISSING_PACKAGES+=($package)
    fi
done

if [ ${#MISSING_PACKAGES[@]} -gt 0 ]; then
    echo -e "${RED}Missing packages: ${MISSING_PACKAGES[*]}${NC}"
    echo "Install with: pip install -r scripts/military_news_requirements.txt"
    exit 1
fi

echo -e "${GREEN}All required packages installed${NC}"
echo ""

echo -e "${YELLOW}Step 4: Testing Supabase connection...${NC}"
python3 << 'EOF'
import os
import sys
try:
    from supabase import create_client
    client = create_client(
        os.environ['SUPABASE_URL'],
        os.environ['SUPABASE_SERVICE_KEY']
    )
    # Try to query tables
    result = client.table('military_news_articles').select('id').limit(1).execute()
    print("Supabase connection successful!")
    sys.exit(0)
except Exception as e:
    print(f"Error connecting to Supabase: {e}")
    print("\nMake sure you've run the migration:")
    print("  supabase/migrations/create_military_news_tables.sql")
    sys.exit(1)
EOF

if [ $? -ne 0 ]; then
    echo -e "${RED}Supabase connection failed${NC}"
    exit 1
fi

echo -e "${GREEN}Supabase connection OK${NC}"
echo ""

echo -e "${YELLOW}Step 5: Testing DVIDS API access...${NC}"
python3 << 'EOF'
import requests
try:
    response = requests.get('https://www.dvidshub.net/api/v2/news', params={'max': 1}, timeout=10)
    if response.status_code == 200:
        data = response.json()
        print(f"DVIDS API accessible - {len(data.get('results', []))} result(s) returned")
    else:
        print(f"Warning: DVIDS API returned status {response.status_code}")
except Exception as e:
    print(f"Warning: Could not access DVIDS API: {e}")
EOF

echo ""

echo -e "${YELLOW}Step 6: Running quick scraper test...${NC}"
echo "Testing with DVIDS API (1 day of data)..."
echo ""

TODAY=$(date +%Y-%m-%d)
python3 scripts/military_news_historical_scraper.py \
    --source dvids \
    --start-date $TODAY \
    --end-date $TODAY \
    --delay 1.0

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}Scraper test completed successfully!${NC}"
else
    echo ""
    echo -e "${RED}Scraper test failed${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 7: Checking database for results...${NC}"
python3 << 'EOF'
import os
from supabase import create_client

client = create_client(
    os.environ['SUPABASE_URL'],
    os.environ['SUPABASE_SERVICE_KEY']
)

# Check article count
result = client.table('military_news_articles').select('id', count='exact').execute()
count = result.count if result.count else 0

print(f"Total articles in database: {count}")

if count > 0:
    # Get latest article
    latest = client.table('military_news_articles')\
        .select('source, title, published_date')\
        .order('created_at', desc=True)\
        .limit(1)\
        .execute()
    
    if latest.data:
        article = latest.data[0]
        print(f"\nLatest article:")
        print(f"  Source: {article['source']}")
        print(f"  Title: {article['title'][:80]}...")
        print(f"  Published: {article['published_date']}")
EOF

echo ""
echo "============================================"
echo -e "${GREEN}Setup Test Complete!${NC}"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Check the test results above"
echo "2. Query database: SELECT COUNT(*) FROM military_news_articles;"
echo "3. Run historical backfill:"
echo "   python3 scripts/military_news_historical_scraper.py --source dvids --start-date 2024-08-01"
echo ""
echo "See MILITARY_NEWS_SCRAPER_README.md for full documentation"
echo ""

