#!/usr/bin/env python3
"""
GSA eLibrary Automated Downloader
Discovers and downloads ALL GSA MAS SIN contractor lists automatically
"""

import os
import sys
import time
import re
from pathlib import Path
from datetime import datetime
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class GSAeLibraryDownloader:
    """Automated downloader for GSA eLibrary contractor lists"""
    
    def __init__(self, output_dir: str = "data/gsa_schedules"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.target_sins = []  # Will be discovered automatically
    
    def discover_all_sins(self, page):
        """Discover all SIN codes from GSA MAS schedule page"""
        logger.info("Discovering all SINs from GSA MAS schedule...")
        
        # Navigate to MAS schedule summary
        schedule_url = "https://www.gsaelibrary.gsa.gov/ElibMain/scheduleSummary.do?scheduleNumber=MAS"
        page.goto(schedule_url, timeout=60000)
        page.wait_for_load_state('networkidle')
        time.sleep(2)
        
        # Extract all SIN links from the page
        sins = []
        
        try:
            # Find all links that point to SIN detail pages
            sin_links = page.locator('a[href*="sinDetails.do"]').all()
            
            logger.info(f"Found {len(sin_links)} potential SIN links")
            
            for link in sin_links:
                try:
                    href = link.get_attribute('href')
                    text = link.inner_text().strip()
                    
                    # Extract SIN code from URL
                    match = re.search(r'specialItemNumber=([^&]+)', href)
                    if match:
                        sin_code = match.group(1)
                        
                        # Clean up the name
                        sin_name = text if text else "Unknown"
                        
                        # Avoid duplicates
                        if sin_code and not any(s[0] == sin_code for s in sins):
                            sins.append((sin_code, sin_name))
                            
                except Exception as e:
                    continue
            
            logger.info(f"Discovered {len(sins)} unique SINs")
            
        except Exception as e:
            logger.error(f"Error discovering SINs: {e}")
            return []
        
        return sins
    
    def download_all_sins(self):
        """Download contractor lists for all discovered SINs"""
        print("=" * 70)
        print("GSA eLibrary Automated Full Downloader")
        print("=" * 70)
        print()
        print("This will discover ALL SINs on GSA MAS schedule and download them.")
        print("This may take several hours depending on the number of SINs.")
        print("The browser will open automatically. Please don't close it.")
        print()
        
        results = {
            'success': [],
            'failed': [],
            'skipped': [],
            'no_download': []
        }
        
        with sync_playwright() as p:
            # Launch browser in headless mode (no GUI needed)
            logger.info("Launching browser in headless mode...")
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                accept_downloads=True,
                viewport={'width': 1920, 'height': 1080}
            )
            page = context.new_page()
            
            # Discover all SINs
            print("Step 1: Discovering all SINs...")
            print("-" * 70)
            self.target_sins = self.discover_all_sins(page)
            
            if not self.target_sins:
                print("ERROR: Could not discover any SINs!")
                browser.close()
                return results
            
            print(f"\nFound {len(self.target_sins)} SINs to process")
            print()
            print("Step 2: Downloading contractor lists...")
            print("=" * 70)
            
            # Process each SIN
            for i, (sin_code, sin_name) in enumerate(self.target_sins, 1):
                print()
                print(f"[{i}/{len(self.target_sins)}] Processing SIN: {sin_code}")
                print(f"    Name: {sin_name}")
                print("-" * 70)
                
                try:
                    result = self._download_sin(page, context, sin_code, sin_name)
                    
                    if result == "success":
                        results['success'].append(sin_code)
                        print(f"    Status: Downloaded")
                    elif result == "no_download":
                        results['no_download'].append(sin_code)
                        print(f"    Status: No download available")
                    else:
                        results['skipped'].append(sin_code)
                        print(f"    Status: Skipped")
                    
                    # Brief pause between downloads
                    time.sleep(2)
                    
                except Exception as e:
                    results['failed'].append(sin_code)
                    logger.error(f"    Status: Failed - {e}")
                    continue
            
            # Close browser
            browser.close()
        
        # Summary
        self._print_summary(results)
        
        return results
    
    def _download_sin(self, page, context, sin_code: str, sin_name: str) -> str:
        """Download contractor list for a specific SIN
        
        Returns:
            "success": Successfully downloaded
            "no_download": No download link available (not all SINs have downloadable lists)
            "failed": Download failed
        """
        
        try:
            # Direct URL to SIN page
            direct_url = f"https://www.gsaelibrary.gsa.gov/ElibMain/sinDetails.do?scheduleNumber=MAS&specialItemNumber={sin_code}&executeQuery=YES"
            logger.info(f"Navigating to SIN page: {sin_code}")
            page.goto(direct_url, timeout=45000)
            page.wait_for_load_state('networkidle')
            time.sleep(1)
            
            # Look for download link
            logger.info("Looking for download link...")
            
            # First, check if there's a "Download Contractors" link that goes to downloadInfo page
            download_info_link = None
            try:
                elements = page.locator('a:has-text("Download Contractors")').all()
                for element in elements:
                    if element.is_visible(timeout=2000):
                        href = element.get_attribute('href')
                        if href and 'downloadInfo' in href:
                            download_info_link = href
                            logger.info(f"Found downloadInfo link: {href[:100]}")
                            break
            except:
                pass
            
            # If we found a downloadInfo link, navigate to it first
            if download_info_link:
                if download_info_link.startswith('/'):
                    info_url = f"https://www.gsaelibrary.gsa.gov{download_info_link}"
                elif download_info_link.startswith('http'):
                    info_url = download_info_link
                else:
                    info_url = f"https://www.gsaelibrary.gsa.gov/ElibMain/{download_info_link}"
                
                logger.info(f"Navigating to download info page...")
                page.goto(info_url, timeout=30000)
                page.wait_for_load_state('networkidle')
                time.sleep(1)
            
            # Now look for the actual .XLS or .CSV download link
            download_selectors = [
                'a:has-text(".XLS File")',
                'a:has-text("XLS File")',
                'a:has-text(".CSV File")',
                'a:has-text("CSV File")',
                'a[href*="downloadContractorFile"]',
                'a[href*="download"][href*=".xls"]',
            ]
            
            download_link = None
            download_href = None
            
            for selector in download_selectors:
                try:
                    elements = page.locator(selector).all()
                    for element in elements:
                        if element.is_visible(timeout=2000):
                            download_link = element
                            download_href = element.get_attribute('href')
                            logger.info(f"Found actual download link with selector: {selector}")
                            if download_href:
                                logger.info(f"  Download href: {download_href[:100]}")
                            break
                    if download_link:
                        break
                except:
                    continue
            
            if not download_link:
                logger.info(f"No download link found for SIN {sin_code} (this is normal for some SINs)")
                return "no_download"
            
            # Set up download handler
            output_file = self.output_dir / f"GSA_MAS_{sin_code}_{datetime.now().strftime('%Y%m%d')}.xlsx"
            
            logger.info(f"Starting download...")
            
            # Method 1: Try expect_download with shorter timeout
            try:
                with page.expect_download(timeout=30000) as download_info:
                    download_link.click()
                
                download = download_info.value
                download.save_as(output_file)
                
                # Verify file exists and has content
                if output_file.exists() and output_file.stat().st_size > 0:
                    file_size = output_file.stat().st_size / 1024  # KB
                    logger.info(f"Downloaded successfully: {file_size:.1f} KB")
                    return "success"
                else:
                    logger.error(f"Download failed or file is empty")
                    return "failed"
                    
            except PlaywrightTimeout:
                logger.warning(f"Download timeout on click, trying direct navigation...")
                
                # Method 2: If click doesn't work, try navigating to the href directly
                if download_href:
                    try:
                        # Handle relative URLs
                        if download_href.startswith('/'):
                            download_url = f"https://www.gsaelibrary.gsa.gov{download_href}"
                        elif download_href.startswith('http'):
                            download_url = download_href
                        else:
                            download_url = f"https://www.gsaelibrary.gsa.gov/ElibMain/{download_href}"
                        
                        logger.info(f"Trying direct URL: {download_url[:100]}")
                        
                        with page.expect_download(timeout=30000) as download_info:
                            page.goto(download_url)
                        
                        download = download_info.value
                        download.save_as(output_file)
                        
                        if output_file.exists() and output_file.stat().st_size > 0:
                            file_size = output_file.stat().st_size / 1024
                            logger.info(f"Downloaded successfully via direct URL: {file_size:.1f} KB")
                            return "success"
                    except:
                        pass
                
                logger.warning(f"Could not download {sin_code} - may not have downloadable data")
                return "no_download"
                
        except PlaywrightTimeout as e:
            logger.error(f"Page timeout for {sin_code}: {e}")
            return "failed"
        except Exception as e:
            logger.error(f"Error downloading {sin_code}: {e}")
            return "failed"
    
    def _print_summary(self, results: dict):
        """Print download summary"""
        print()
        print("=" * 70)
        print("DOWNLOAD SUMMARY")
        print("=" * 70)
        print()
        
        total = sum(len(v) for v in results.values())
        
        print(f"Total SINs processed: {total}")
        print()
        print(f"  Downloaded successfully: {len(results['success'])} SINs")
        print(f"  No download available:   {len(results['no_download'])} SINs")
        print(f"  Failed:                  {len(results['failed'])} SINs")
        print(f"  Skipped:                 {len(results['skipped'])} SINs")
        print()
        
        if results['success']:
            print("Successfully Downloaded SINs:")
            print("-" * 70)
            for sin in results['success'][:20]:  # Show first 20
                print(f"  {sin}")
            if len(results['success']) > 20:
                print(f"  ... and {len(results['success']) - 20} more")
            print()
        
        if results['no_download']:
            print(f"SINs Without Download Option: {len(results['no_download'])}")
            print("(These SINs exist but don't have downloadable contractor lists)")
            print()
        
        if results['failed']:
            print("Failed SINs (may need retry):")
            print("-" * 70)
            for sin in results['failed']:
                print(f"  {sin}")
            print()
        
        print(f"Files saved to: {self.output_dir}")
        print()
        
        if len(results['success']) > 0:
            print("=" * 70)
            print("NEXT STEPS:")
            print("=" * 70)
            print()
            print("1. Parse the downloaded Excel files:")
            print("   python3 scripts/gsa-schedule-scraper.py")
            print()
            print("2. Import into database:")
            print("   python3 scripts/import-gsa-gwac-data.py")
            print()
            print("The Excel files contain:")
            print("  - Company names and contact information")
            print("  - Contract numbers and expiration dates")
            print("  - Price lists and labor categories")
            print("  - Service descriptions and capabilities")
            print("  - DUNS/UEI numbers")
            print()
        
        print()


def main():
    """Main execution"""
    print()
    print("=" * 70)
    print("GSA MAS COMPREHENSIVE DATA DOWNLOADER")
    print("=" * 70)
    print()
    print("This script will:")
    print("  1. Discover ALL SINs on the GSA MAS schedule")
    print("  2. Download contractor Excel files for each SIN")
    print("  3. Save files containing:")
    print("     - Company names and contact info")
    print("     - Contract numbers and dates")
    print("     - Price lists per labor category/service")
    print("     - DUNS/UEI numbers")
    print("     - Service descriptions and capabilities")
    print()
    print("IMPORTANT:")
    print("  - This may take 2-4 hours to complete (hundreds of SINs)")
    print("  - A browser window will open (don't close it)")
    print("  - Not all SINs have downloadable lists (this is normal)")
    print("  - The script will handle timeouts and continue automatically")
    print()
    print("=" * 70)
    print()
    
    response = input("Continue with automated download? (y/n): ")
    if response.lower() != 'y':
        print("Cancelled.")
        sys.exit(0)
    
    print()
    
    downloader = GSAeLibraryDownloader()
    results = downloader.download_all_sins()
    
    # Exit code based on results
    if len(results['success']) > 0:
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()

