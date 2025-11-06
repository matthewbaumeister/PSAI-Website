#!/usr/bin/env python3
"""
============================================
PDF Downloader Module
============================================

Downloads and caches congressional disclosure PDFs.

Features:
- Local caching (don't re-download)
- Timeout handling
- Retry logic
- Progress tracking

Phase 1 of PDF Parser Implementation
============================================
"""

import requests
import os
import sys
from pathlib import Path
from typing import Optional
import hashlib
import time

class PDFDownloader:
    """Download and cache PDF files"""
    
    def __init__(self, cache_dir: str = './pdf_cache'):
        """
        Initialize downloader with cache directory
        
        Args:
            cache_dir: Directory to store downloaded PDFs
        """
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        # Stats
        self.downloaded = 0
        self.cached = 0
        self.failed = 0
    
    def download_pdf(self, url: str, filename: Optional[str] = None, retry: int = 3) -> Optional[Path]:
        """
        Download PDF from URL with caching
        
        Args:
            url: PDF URL to download
            filename: Optional custom filename (auto-generated if None)
            retry: Number of retry attempts
            
        Returns:
            Path to downloaded PDF, or None if failed
        """
        # Generate filename from URL if not provided
        if filename is None:
            filename = self._url_to_filename(url)
        
        cache_path = self.cache_dir / filename
        
        # Check cache first
        if cache_path.exists():
            file_size = cache_path.stat().st_size
            if file_size > 0:  # Valid file
                self.cached += 1
                print(f"  📄 Cached: {filename} ({file_size:,} bytes)", file=sys.stderr)
                return cache_path
        
        # Download with retry
        for attempt in range(retry):
            try:
                print(f"  ⬇️  Downloading: {filename} (attempt {attempt + 1}/{retry})", file=sys.stderr)
                
                response = requests.get(
                    url,
                    timeout=30,
                    headers={
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                    }
                )
                response.raise_for_status()
                
                # Verify it's actually a PDF
                content_type = response.headers.get('content-type', '')
                if 'pdf' not in content_type.lower() and not url.endswith('.pdf'):
                    print(f"  ⚠️  Warning: Not a PDF? Content-Type: {content_type}", file=sys.stderr)
                
                # Write to cache
                with open(cache_path, 'wb') as f:
                    f.write(response.content)
                
                file_size = len(response.content)
                print(f"  ✅ Downloaded: {filename} ({file_size:,} bytes)", file=sys.stderr)
                
                self.downloaded += 1
                return cache_path
                
            except requests.exceptions.Timeout:
                print(f"  ⏱️  Timeout on attempt {attempt + 1}", file=sys.stderr)
                if attempt < retry - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                    
            except requests.exceptions.RequestException as e:
                print(f"  ❌ Error on attempt {attempt + 1}: {str(e)}", file=sys.stderr)
                if attempt < retry - 1:
                    time.sleep(2 ** attempt)
            
            except Exception as e:
                print(f"  ❌ Unexpected error: {str(e)}", file=sys.stderr)
                break
        
        # All retries failed
        self.failed += 1
        print(f"  ❌ Failed to download: {filename}", file=sys.stderr)
        return None
    
    def _url_to_filename(self, url: str) -> str:
        """
        Convert URL to safe filename
        
        Args:
            url: URL to convert
            
        Returns:
            Safe filename
        """
        # Try to get filename from URL
        url_parts = url.split('/')
        if url_parts[-1].endswith('.pdf'):
            # Use original filename
            return url_parts[-1]
        
        # Generate filename from URL hash
        url_hash = hashlib.md5(url.encode()).hexdigest()[:8]
        return f"disclosure_{url_hash}.pdf"
    
    def print_stats(self):
        """Print download statistics"""
        total = self.downloaded + self.cached + self.failed
        print(f"\n📊 Download Stats:", file=sys.stderr)
        print(f"  Total processed: {total}", file=sys.stderr)
        print(f"  Downloaded: {self.downloaded}", file=sys.stderr)
        print(f"  Cached: {self.cached}", file=sys.stderr)
        print(f"  Failed: {self.failed}", file=sys.stderr)
        if total > 0:
            success_rate = ((self.downloaded + self.cached) / total) * 100
            print(f"  Success rate: {success_rate:.1f}%", file=sys.stderr)
    
    def clear_cache(self):
        """Clear all cached PDFs"""
        import shutil
        if self.cache_dir.exists():
            shutil.rmtree(self.cache_dir)
            self.cache_dir.mkdir(parents=True, exist_ok=True)
            print(f"✅ Cache cleared: {self.cache_dir}", file=sys.stderr)


# Test function
if __name__ == "__main__":
    print("Testing PDF Downloader...\n", file=sys.stderr)
    
    downloader = PDFDownloader()
    
    # Test with a real PTR PDF from Pelosi
    test_url = "https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/2024/20024542.pdf"
    
    print(f"Test URL: {test_url}\n", file=sys.stderr)
    
    # Download
    pdf_path = downloader.download_pdf(test_url)
    
    if pdf_path:
        print(f"\n✅ Success! PDF saved to: {pdf_path}", file=sys.stderr)
        print(f"File size: {pdf_path.stat().st_size:,} bytes", file=sys.stderr)
        
        # Try downloading again (should use cache)
        print(f"\nTesting cache...", file=sys.stderr)
        pdf_path2 = downloader.download_pdf(test_url)
        
        if pdf_path2:
            print(f"✅ Cache working!", file=sys.stderr)
    else:
        print(f"\n❌ Download failed", file=sys.stderr)
    
    downloader.print_stats()

