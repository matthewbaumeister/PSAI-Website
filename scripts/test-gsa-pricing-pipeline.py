#!/usr/bin/env python3
"""
Test GSA Pricing Pipeline
Tests the complete download -> parse -> import pipeline with a small sample
"""

import os
import sys
import logging
from pathlib import Path
from supabase import create_client

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def test_database_connection():
    """Test if we can connect to Supabase"""
    logger.info("Testing database connection...")
    try:
        supabase = create_client(
            os.getenv('NEXT_PUBLIC_SUPABASE_URL'),
            os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        )
        result = supabase.table('gsa_schedule_holders').select('id').limit(1).execute()
        logger.info("✓ Database connection successful")
        return True
    except Exception as e:
        logger.error(f"✗ Database connection failed: {e}")
        return False


def test_tables_exist():
    """Test if pricing tables exist"""
    logger.info("Testing if pricing tables exist...")
    supabase = create_client(
        os.getenv('NEXT_PUBLIC_SUPABASE_URL'),
        os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    )
    
    tables = ['gsa_price_lists', 'gsa_labor_categories', 'gsa_pricing_scraper_log']
    all_exist = True
    
    for table in tables:
        try:
            result = supabase.table(table).select('id').limit(1).execute()
            logger.info(f"  ✓ {table} exists")
        except Exception as e:
            logger.error(f"  ✗ {table} does not exist: {e}")
            all_exist = False
    
    return all_exist


def test_download_single():
    """Test downloading a single price list"""
    logger.info("Testing download of single price list...")
    
    try:
        # Import the downloader
        import importlib.util
        spec = importlib.util.spec_from_file_location("gsa_pricing_downloader", 
            Path(__file__).parent / "gsa-pricing-downloader.py")
        downloader_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(downloader_module)
        GSAPricingDownloader = downloader_module.GSAPricingDownloader
        
        downloader = GSAPricingDownloader()
        
        # Get one contractor with a price list URL
        contractors = downloader.extract_price_list_urls()
        if not contractors:
            logger.error("  ✗ No contractors with price list URLs found")
            return False
        
        contractor = contractors[0]
        logger.info(f"  Testing with: {contractor['company_name']}")
        logger.info(f"  Contract: {contractor['contract_number']}")
        
        # Create price list record
        price_list_id = downloader._create_price_list_record(contractor)
        if price_list_id is None:
            logger.info("  ✓ Already downloaded, using existing record")
            return True
        
        # Download the file
        success = downloader.download_price_list(contractor, price_list_id)
        
        if success:
            logger.info("  ✓ Download successful")
            return True
        else:
            logger.error("  ✗ Download failed")
            return False
    
    except Exception as e:
        logger.error(f"  ✗ Download test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_parse_single():
    """Test parsing a single price list"""
    logger.info("Testing parsing of downloaded price list...")
    
    try:
        # Import the parser
        import importlib.util
        spec = importlib.util.spec_from_file_location("gsa_pricing_parser", 
            Path(__file__).parent / "gsa-pricing-parser.py")
        parser_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(parser_module)
        GSAPricingParser = parser_module.GSAPricingParser
        
        parser = GSAPricingParser()
        
        # Get first downloaded file
        excel_files = list(parser.download_dir.glob("*_pricelist.xlsx"))
        if not excel_files:
            logger.error("  ✗ No downloaded files found")
            return False
        
        file_path = excel_files[0]
        contract_number = file_path.stem.replace('_pricelist', '')
        
        logger.info(f"  Testing with: {contract_number}")
        
        # Parse the file
        labor_categories = parser.parse_excel_file(file_path, contract_number)
        
        if labor_categories:
            logger.info(f"  ✓ Parsing successful - found {len(labor_categories)} labor categories")
            
            # Show sample
            if len(labor_categories) > 0:
                sample = labor_categories[0]
                logger.info(f"  Sample: {sample['labor_category']}")
                logger.info(f"    Rate: ${sample['hourly_rate']}/hr")
            
            return True
        else:
            logger.error("  ✗ No labor categories found")
            return False
    
    except Exception as e:
        logger.error(f"  ✗ Parse test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_import_single():
    """Test importing parsed data"""
    logger.info("Testing import of parsed data...")
    
    try:
        # Import the importer
        import importlib.util
        spec = importlib.util.spec_from_file_location("gsa_pricing_importer", 
            Path(__file__).parent / "gsa-pricing-importer.py")
        importer_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(importer_module)
        GSAPricingImporter = importer_module.GSAPricingImporter
        
        importer = GSAPricingImporter()
        
        # Get first parsed file
        json_files = list(importer.parsed_dir.glob("*_parsed.json"))
        if not json_files:
            logger.error("  ✗ No parsed files found")
            return False
        
        file_path = json_files[0]
        contract_number = file_path.stem.replace('_parsed', '')
        
        logger.info(f"  Testing with: {contract_number}")
        
        # Import the file
        file_stats = importer.import_parsed_file(file_path)
        
        logger.info(f"  Inserted: {file_stats['inserted']}")
        logger.info(f"  Updated: {file_stats['updated']}")
        logger.info(f"  Errors: {file_stats['errors']}")
        
        if file_stats['inserted'] > 0 or file_stats['updated'] > 0:
            logger.info("  ✓ Import successful")
            return True
        else:
            logger.error("  ✗ No records imported")
            return False
    
    except Exception as e:
        logger.error(f"  ✗ Import test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests"""
    print("\n" + "=" * 70)
    print("GSA PRICING PIPELINE TEST")
    print("=" * 70)
    print()
    
    tests = [
        ("Database Connection", test_database_connection),
        ("Tables Exist", test_tables_exist),
        ("Download Single", test_download_single),
        ("Parse Single", test_parse_single),
        ("Import Single", test_import_single)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n{test_name}")
        print("-" * 70)
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            logger.error(f"Test failed with exception: {e}")
            results.append((test_name, False))
        print()
    
    # Summary
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    
    passed = 0
    failed = 0
    
    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status} - {test_name}")
        if result:
            passed += 1
        else:
            failed += 1
    
    print()
    print(f"Passed: {passed}/{len(results)}")
    print(f"Failed: {failed}/{len(results)}")
    
    if failed == 0:
        print("\n✓ All tests passed! Ready for production run.")
    else:
        print("\n✗ Some tests failed. Please fix issues before running full pipeline.")
    
    print()


if __name__ == "__main__":
    main()

