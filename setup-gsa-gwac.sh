#!/bin/bash

# ============================================
# GSA/GWAC Data Collection Setup Script
# ============================================
# This script helps set up the GSA Schedule and GWAC data collection system
#
# Usage: ./setup-gsa-gwac.sh

set -e  # Exit on error

echo "============================================"
echo "GSA/GWAC Data Collection Setup"
echo "============================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# Step 1: Check prerequisites
# ============================================
echo -e "${BLUE}Step 1: Checking prerequisites...${NC}"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python 3 found: $(python3 --version)${NC}"

# Check pip
if ! command -v pip3 &> /dev/null; then
    echo -e "${RED}Error: pip3 is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ pip3 found${NC}"

# Check database connection
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${YELLOW}⚠ Warning: Supabase credentials not set in environment${NC}"
    echo "  Set these before running the importer:"
    echo "  export NEXT_PUBLIC_SUPABASE_URL='...'"
    echo "  export SUPABASE_SERVICE_ROLE_KEY='...'"
fi

echo ""

# ============================================
# Step 2: Create directories
# ============================================
echo -e "${BLUE}Step 2: Creating data directories...${NC}"

mkdir -p data/gsa_schedules
mkdir -p data/gwac_holders

echo -e "${GREEN}✓ Created data/gsa_schedules/${NC}"
echo -e "${GREEN}✓ Created data/gwac_holders/${NC}"
echo ""

# ============================================
# Step 3: Install Python dependencies
# ============================================
echo -e "${BLUE}Step 3: Installing Python dependencies...${NC}"
echo ""

if [ -f "requirements.txt" ]; then
    echo "Installing from requirements.txt..."
    pip3 install -r requirements.txt
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠ requirements.txt not found, installing manually...${NC}"
    pip3 install pandas openpyxl pdfplumber requests beautifulsoup4 supabase lxml
    echo -e "${GREEN}✓ Dependencies installed${NC}"
fi

echo ""

# ============================================
# Step 4: Database setup
# ============================================
echo -e "${BLUE}Step 4: Database setup${NC}"
echo ""
echo "Next, you need to create the database tables."
echo "Options:"
echo "  1. Via Supabase CLI: supabase db push"
echo "  2. Via psql: psql \$DATABASE_URL -f supabase/migrations/create_gsa_gwac_tables.sql"
echo "  3. Via Supabase Dashboard: Copy/paste SQL from migration file"
echo ""

read -p "Have you already created the database tables? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}Please create the database tables before proceeding.${NC}"
    echo "Migration file: supabase/migrations/create_gsa_gwac_tables.sql"
    echo ""
    read -p "Press Enter when ready to continue..."
fi

echo ""

# ============================================
# Step 5: GSA Schedule data collection
# ============================================
echo -e "${BLUE}Step 5: GSA Schedule data collection${NC}"
echo ""
echo "GSA eLibrary provides contractor lists by Special Item Number (SIN)."
echo ""
echo "Recommended SINs to start with (IT & Professional Services):"
echo "  • 54151S - IT Professional Services"
echo "  • 541519ICAM - Identity, Credentialing, and Access Management"
echo "  • 541330 - Engineering Services"
echo "  • 541611 - Management and Financial Consulting"
echo "  • 541715 - Research and Development"
echo ""
echo "Manual download process:"
echo "  1. Visit: https://www.gsaelibrary.gsa.gov"
echo "  2. Search for a SIN code (e.g., '54151S')"
echo "  3. On the SIN details page, click 'Download Contractors (Excel)'"
echo "  4. Save file as: GSA_MAS_[SIN]_[DATE].xlsx"
echo "  5. Move file to: data/gsa_schedules/"
echo "  6. Repeat for each SIN"
echo ""

read -p "Open GSA eLibrary in browser? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open "https://www.gsaelibrary.gsa.gov" 2>/dev/null || xdg-open "https://www.gsaelibrary.gsa.gov" 2>/dev/null || echo "Please visit: https://www.gsaelibrary.gsa.gov"
fi

echo ""
echo -e "${YELLOW}Action required:${NC} Download GSA Schedule Excel files"
echo "Place them in: data/gsa_schedules/"
echo ""
read -p "Press Enter when you've downloaded GSA files (or Skip to continue)..."

# Check if files were downloaded
GSA_FILES=$(ls data/gsa_schedules/*.xlsx 2>/dev/null | wc -l)
if [ "$GSA_FILES" -gt 0 ]; then
    echo -e "${GREEN}✓ Found $GSA_FILES GSA Schedule file(s)${NC}"
else
    echo -e "${YELLOW}⚠ No GSA Schedule files found (you can add them later)${NC}"
fi

echo ""

# ============================================
# Step 6: GWAC holder data collection
# ============================================
echo -e "${BLUE}Step 6: GWAC holder data collection${NC}"
echo ""
echo "Major GWACs to collect:"
echo "  • Alliant 2 (Small Business & Unrestricted)"
echo "  • OASIS (Small Business & Unrestricted)"
echo "  • 8(a) STARS III"
echo "  • Polaris (Small Business & Unrestricted)"
echo "  • NITAAC CIO-SP3 / CIO-SP4"
echo ""
echo "Download process:"
echo "  1. Visit each GWAC website"
echo "  2. Find 'Contract Holders' section"
echo "  3. Download holder list (PDF/Excel) or copy to CSV"
echo "  4. Save as: [gwac_key].csv or [gwac_key].pdf"
echo "     Examples: alliant2_sb.csv, oasis.csv, stars3.csv"
echo "  5. Move to: data/gwac_holders/"
echo ""
echo "GWAC URLs:"
echo "  • Alliant 2: https://www.gsa.gov/technology/technology-purchasing-programs/governmentwide-acquisition-contracts/alliant-2"
echo "  • OASIS: https://www.gsa.gov/technology/technology-purchasing-programs/governmentwide-acquisition-contracts/oasis"
echo "  • 8(a) STARS III: https://www.gsa.gov/technology/technology-purchasing-programs/governmentwide-acquisition-contracts/8a-stars-iii"
echo "  • NITAAC: https://nitaac.nih.gov"
echo ""

read -p "Open GWAC websites in browser? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open "https://www.gsa.gov/technology/technology-purchasing-programs/governmentwide-acquisition-contracts/alliant-2" 2>/dev/null || echo "Alliant 2: https://www.gsa.gov/technology/technology-purchasing-programs/governmentwide-acquisition-contracts/alliant-2"
    open "https://www.gsa.gov/technology/technology-purchasing-programs/governmentwide-acquisition-contracts/oasis" 2>/dev/null || echo "OASIS: https://www.gsa.gov/technology/technology-purchasing-programs/governmentwide-acquisition-contracts/oasis"
    open "https://nitaac.nih.gov" 2>/dev/null || echo "NITAAC: https://nitaac.nih.gov"
fi

echo ""
echo -e "${YELLOW}Action required:${NC} Download GWAC holder lists"
echo "Place them in: data/gwac_holders/"
echo "Format: CSV preferred, PDF also supported"
echo ""
read -p "Press Enter when you've downloaded GWAC files (or Skip to continue)..."

# Check if files were downloaded
GWAC_FILES=$(ls data/gwac_holders/*.{csv,pdf} 2>/dev/null | wc -l)
if [ "$GWAC_FILES" -gt 0 ]; then
    echo -e "${GREEN}✓ Found $GWAC_FILES GWAC file(s)${NC}"
else
    echo -e "${YELLOW}⚠ No GWAC files found (you can add them later)${NC}"
fi

echo ""

# ============================================
# Step 7: Parse and import data
# ============================================
echo -e "${BLUE}Step 7: Parse and import data${NC}"
echo ""

if [ "$GSA_FILES" -gt 0 ] || [ "$GWAC_FILES" -gt 0 ]; then
    echo "Ready to parse and import data."
    echo ""
    read -p "Parse and import now? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        
        # Parse GSA files
        if [ "$GSA_FILES" -gt 0 ]; then
            echo -e "${BLUE}Parsing GSA Schedule files...${NC}"
            python3 scripts/gsa-schedule-scraper.py || echo -e "${YELLOW}⚠ GSA parsing had some issues${NC}"
        fi
        
        # Parse GWAC files
        if [ "$GWAC_FILES" -gt 0 ]; then
            echo -e "${BLUE}Parsing GWAC holder files...${NC}"
            python3 scripts/gwac-scraper.py || echo -e "${YELLOW}⚠ GWAC parsing had some issues${NC}"
        fi
        
        # Import to database
        echo ""
        echo -e "${BLUE}Importing to database...${NC}"
        if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
            python3 scripts/import-gsa-gwac-data.py || echo -e "${YELLOW}⚠ Import had some issues${NC}"
        else
            echo -e "${RED}Error: Supabase credentials not set${NC}"
            echo "Set these environment variables:"
            echo "  export NEXT_PUBLIC_SUPABASE_URL='...'"
            echo "  export SUPABASE_SERVICE_ROLE_KEY='...'"
            echo "Then run: python3 scripts/import-gsa-gwac-data.py"
        fi
    else
        echo ""
        echo "Skipped. You can run these manually later:"
        echo "  python3 scripts/gsa-schedule-scraper.py"
        echo "  python3 scripts/gwac-scraper.py"
        echo "  python3 scripts/import-gsa-gwac-data.py"
    fi
else
    echo -e "${YELLOW}No data files found to parse. Download files first.${NC}"
fi

echo ""

# ============================================
# Step 8: Summary and next steps
# ============================================
echo "============================================"
echo -e "${GREEN}Setup Complete!${NC}"
echo "============================================"
echo ""
echo "What was done:"
echo "  ✓ Created data directories"
echo "  ✓ Installed Python dependencies"
echo "  ✓ Checked database setup"
echo ""

if [ "$GSA_FILES" -gt 0 ] || [ "$GWAC_FILES" -gt 0 ]; then
    echo "Data collected:"
    [ "$GSA_FILES" -gt 0 ] && echo "  • $GSA_FILES GSA Schedule file(s)"
    [ "$GWAC_FILES" -gt 0 ] && echo "  • $GWAC_FILES GWAC file(s)"
    echo ""
fi

echo "Next steps:"
echo ""
echo "1. Review the data guide:"
echo "   cat GSA_GWAC_DATA_GUIDE.md"
echo ""
echo "2. Review the quick start:"
echo "   cat GSA_GWAC_QUICKSTART.md"
echo ""
echo "3. Verify data in database:"
echo "   SELECT COUNT(*) FROM gsa_schedule_holders;"
echo "   SELECT COUNT(*) FROM gwac_holders;"
echo ""
echo "4. Set up monthly updates:"
echo "   • Re-download files"
echo "   • Run: python3 scripts/gsa-schedule-scraper.py"
echo "   • Run: python3 scripts/gwac-scraper.py"
echo "   • Run: python3 scripts/import-gsa-gwac-data.py"
echo ""
echo "5. Integrate with your app:"
echo "   • Link to company profiles"
echo "   • Show contract vehicles on detail pages"
echo "   • Build market intelligence reports"
echo ""

echo "Questions? See GSA_GWAC_DATA_GUIDE.md or GSA_GWAC_QUICKSTART.md"
echo ""

