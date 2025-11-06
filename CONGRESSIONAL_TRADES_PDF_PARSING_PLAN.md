# Congressional Trades PDF Parser - Implementation Plan

## 🎯 Goal
Parse PTR (Periodic Transaction Report) PDFs directly from House/Senate to extract stock trades.

## 📋 Architecture Overview

```
Official Gov Source → CapitolGains (get PDF URLs) → Download PDFs → Parse PDFs → Extract Trades → Store in DB
```

## 🔧 Technical Stack

### PDF Processing Libraries
```python
pdfplumber      # Primary - best for structured tables
PyPDF2          # Backup for text extraction
pytesseract     # OCR for scanned PDFs (fallback)
tabula-py       # Alternative table extraction
```

### Pattern Matching
```python
re              # Regex for ticker extraction
pandas          # Data structuring
dateutil        # Date parsing
```

## 📊 PDF Format Analysis

### House PTR Format
**Sections to Parse:**
1. **Part I: Transactions** (main section)
   - Asset description (company name + ticker in parentheses)
   - Transaction type (Purchase/Sale/Exchange)
   - Transaction date
   - Notification date
   - Amount (range like "$15,001 - $50,000")

2. **Part II: Non-Public Positions** (skip)
3. **Part III: Agreement** (skip)

**Example Text:**
```
Asset                                    Type      Date       Amount
Microsoft Corporation Common Stock (MSFT) Purchase  01/15/2024 $15,001 - $50,000
Apple Inc. (AAPL)                        Sale      01/20/2024 $50,001 - $100,000
```

### Senate eFiling Format
Similar but slightly different layout:
- More standardized (newer system)
- Usually better formatted
- Cleaner table structure

### Common Patterns
```
Ticker Patterns:
- In parentheses: "Microsoft (MSFT)"
- After dash: "Microsoft - MSFT"
- Standalone: just "MSFT" in asset column

Date Patterns:
- MM/DD/YYYY
- M/D/YYYY
- Various formats need normalization

Amount Patterns:
- "$15,001 - $50,000"
- "$1,001-$15,000"
- "Over $1,000,000"
- "N/A" or "Not disclosed"

Transaction Types:
- "Purchase", "P", "Buy"
- "Sale", "S", "Sell", "Sale (Full)", "Sale (Partial)"
- "Exchange"
```

## 🏗️ Implementation Steps

### Phase 1: PDF Download Module (30 min)
```python
# pdf_downloader.py

import requests
import os
from pathlib import Path

class PDFDownloader:
    def __init__(self, cache_dir='./pdf_cache'):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
    
    def download_pdf(self, url, filename):
        """Download PDF and cache locally"""
        cache_path = self.cache_dir / filename
        
        if cache_path.exists():
            return cache_path
        
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        with open(cache_path, 'wb') as f:
            f.write(response.content)
        
        return cache_path
```

### Phase 2: PDF Parser Core (2 hours)
```python
# pdf_parser.py

import pdfplumber
import re
from typing import List, Dict, Optional
from datetime import datetime

class PTRParser:
    """Parse Periodic Transaction Reports"""
    
    # Regex patterns
    TICKER_PATTERNS = [
        r'\(([A-Z]{1,5})\)',           # (MSFT)
        r'\s-\s([A-Z]{1,5})\s',        # - MSFT 
        r'^([A-Z]{2,5})$',             # MSFT alone
    ]
    
    AMOUNT_PATTERNS = {
        r'\$1,001\s*-\s*\$15,000': '$1,001 - $15,000',
        r'\$15,001\s*-\s*\$50,000': '$15,001 - $50,000',
        r'\$50,001\s*-\s*\$100,000': '$50,001 - $100,000',
        r'\$100,001\s*-\s*\$250,000': '$100,001 - $250,000',
        r'\$250,001\s*-\s*\$500,000': '$250,001 - $500,000',
        r'\$500,001\s*-\s*\$1,000,000': '$500,001 - $1,000,000',
        r'[Oo]ver\s*\$1,000,000': 'Over $1,000,000',
    }
    
    TRANSACTION_TYPES = {
        'purchase': ['purchase', 'buy', 'p'],
        'sale': ['sale', 'sell', 's', 'sale (full)', 'sale (partial)'],
        'exchange': ['exchange', 'ex'],
    }
    
    def parse_pdf(self, pdf_path: str) -> List[Dict]:
        """Main parsing function"""
        trades = []
        
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                # Extract tables
                tables = page.extract_tables()
                
                for table in tables:
                    trades.extend(self._parse_table(table))
                
                # Fallback: extract text if no tables
                if not tables:
                    text = page.extract_text()
                    trades.extend(self._parse_text(text))
        
        return trades
    
    def _parse_table(self, table: List[List[str]]) -> List[Dict]:
        """Parse structured table data"""
        trades = []
        
        # Find header row
        header_idx = self._find_header_row(table)
        if header_idx is None:
            return trades
        
        headers = [h.lower() if h else '' for h in table[header_idx]]
        
        # Find column indices
        asset_col = self._find_column(headers, ['asset', 'description'])
        type_col = self._find_column(headers, ['type', 'transaction'])
        date_col = self._find_column(headers, ['date', 'trans date'])
        amount_col = self._find_column(headers, ['amount', 'value'])
        
        # Parse data rows
        for row in table[header_idx + 1:]:
            if not row or len(row) < 2:
                continue
            
            # Skip empty or header-like rows
            if self._is_empty_row(row):
                continue
            
            trade = self._extract_trade_from_row(
                row, asset_col, type_col, date_col, amount_col
            )
            
            if trade:
                trades.append(trade)
        
        return trades
    
    def _extract_trade_from_row(self, row, asset_col, type_col, date_col, amount_col) -> Optional[Dict]:
        """Extract trade data from a table row"""
        try:
            # Asset description
            asset = row[asset_col] if asset_col < len(row) else ''
            if not asset or len(asset) < 3:
                return None
            
            # Extract ticker
            ticker = self._extract_ticker(asset)
            
            # Transaction type
            txn_type = row[type_col] if type_col < len(row) else ''
            normalized_type = self._normalize_transaction_type(txn_type)
            
            # Date
            date_str = row[date_col] if date_col < len(row) else ''
            transaction_date = self._parse_date(date_str)
            
            # Amount
            amount_str = row[amount_col] if amount_col < len(row) else ''
            amount_range = self._normalize_amount(amount_str)
            
            return {
                'asset_description': asset.strip(),
                'ticker': ticker,
                'transaction_type': normalized_type,
                'transaction_date': transaction_date,
                'amount_range': amount_range,
            }
        
        except Exception as e:
            print(f"Error parsing row: {e}")
            return None
    
    def _extract_ticker(self, text: str) -> Optional[str]:
        """Extract stock ticker from text"""
        for pattern in self.TICKER_PATTERNS:
            match = re.search(pattern, text)
            if match:
                ticker = match.group(1)
                # Validate ticker (2-5 uppercase letters)
                if re.match(r'^[A-Z]{2,5}$', ticker):
                    return ticker
        return None
    
    def _normalize_transaction_type(self, text: str) -> str:
        """Normalize transaction type"""
        text_lower = text.lower().strip()
        
        for normalized, variations in self.TRANSACTION_TYPES.items():
            if any(var in text_lower for var in variations):
                return normalized
        
        return 'unknown'
    
    def _normalize_amount(self, text: str) -> str:
        """Normalize amount range"""
        if not text:
            return 'Not disclosed'
        
        text = text.strip()
        
        for pattern, normalized in self.AMOUNT_PATTERNS.items():
            if re.search(pattern, text, re.IGNORECASE):
                return normalized
        
        return text
    
    def _parse_date(self, date_str: str) -> Optional[str]:
        """Parse date string to ISO format"""
        if not date_str:
            return None
        
        # Try common formats
        formats = [
            '%m/%d/%Y',
            '%m/%d/%y',
            '%Y-%m-%d',
            '%d-%m-%Y',
        ]
        
        for fmt in formats:
            try:
                dt = datetime.strptime(date_str.strip(), fmt)
                return dt.strftime('%Y-%m-%d')
            except ValueError:
                continue
        
        return None
    
    def _find_header_row(self, table: List[List[str]]) -> Optional[int]:
        """Find the header row in table"""
        for idx, row in enumerate(table[:5]):  # Check first 5 rows
            if not row:
                continue
            row_text = ' '.join([str(cell).lower() for cell in row if cell])
            if 'asset' in row_text or 'transaction' in row_text:
                return idx
        return None
    
    def _find_column(self, headers: List[str], keywords: List[str]) -> int:
        """Find column index by keywords"""
        for idx, header in enumerate(headers):
            if any(keyword in header for keyword in keywords):
                return idx
        return 0
    
    def _is_empty_row(self, row: List[str]) -> bool:
        """Check if row is empty or just whitespace"""
        return all(not cell or cell.strip() == '' for cell in row)
    
    def _parse_text(self, text: str) -> List[Dict]:
        """Fallback: parse unstructured text"""
        # TODO: Implement text-based parsing
        # This is for PDFs that don't have tables
        return []
```

### Phase 3: OCR Fallback (1 hour)
```python
# ocr_parser.py

import pytesseract
from PIL import Image
import pdf2image

class OCRParser:
    """Fallback parser for scanned PDFs"""
    
    def parse_scanned_pdf(self, pdf_path: str) -> str:
        """Convert PDF to images and OCR"""
        images = pdf2image.convert_from_path(pdf_path)
        
        full_text = ""
        for image in images:
            text = pytesseract.image_to_string(image)
            full_text += text + "\n"
        
        return full_text
```

### Phase 4: Integration (1 hour)
```python
# Updated scrape_congress_trades.py

from pdf_downloader import PDFDownloader
from pdf_parser import PTRParser

def scrape_house_trades(start_year: int, end_year: int) -> List[Dict[str, Any]]:
    trades = []
    members = get_defense_house_members()
    
    downloader = PDFDownloader()
    parser = PTRParser()
    
    with HouseDisclosureScraper() as scraper:
        for member in members:
            rep = Representative(member["name"], state=member["state"], district=member["district"])
            
            for year in range(start_year, end_year + 1):
                # Get PDF URLs
                disclosures_dict = rep.get_disclosures(scraper, year=str(year))
                ptr_list = disclosures_dict.get('trades', [])
                
                # Download and parse each PDF
                for ptr in ptr_list:
                    pdf_url = ptr.get('pdf_url')
                    
                    # Download PDF
                    filename = pdf_url.split('/')[-1]
                    pdf_path = downloader.download_pdf(pdf_url, filename)
                    
                    # Parse PDF
                    parsed_trades = parser.parse_pdf(pdf_path)
                    
                    # Add metadata
                    for trade in parsed_trades:
                        trade['member_name'] = rep.full_name or member['name']
                        trade['chamber'] = 'House'
                        trade['filing_url'] = pdf_url
                        trade['disclosure_date'] = ptr.get('filing_date')
                        trades.append(trade)
    
    return trades
```

## 📊 Testing Strategy

### Test Cases
1. **Standard PTR** - Regular table format
2. **Scanned PDF** - Needs OCR
3. **Multiple pages** - Trades span pages
4. **No trades** - Empty disclosure
5. **Complex assets** - Mutual funds, options
6. **Edge cases** - Partial sales, exchanges

### Test PDFs
Download sample PTRs from:
- Pelosi: https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/2024/20024542.pdf
- Others: Various formats to test

## ⏱️ Timeline

| Phase | Task | Time | Status |
|-------|------|------|--------|
| 1 | PDF Downloader | 30 min | ⏸️ |
| 2 | Table Parser | 2 hours | ⏸️ |
| 3 | Text Parser Fallback | 1 hour | ⏸️ |
| 4 | OCR Integration | 1 hour | ⏸️ |
| 5 | Testing & Debugging | 2 hours | ⏸️ |
| 6 | Senate Parser | 1 hour | ⏸️ |
| 7 | Error Handling | 1 hour | ⏸️ |
| **TOTAL** | | **~9 hours** | |

## 🎯 Accuracy Expectations

- **Well-formatted PDFs**: 95%+ accuracy
- **Scanned PDFs**: 80-90% (depends on OCR quality)
- **Old PDFs** (2012-2015): 70-80% (varied formats)
- **Manual review needed**: ~5-10% of files

## 📦 Dependencies to Add

```txt
pdfplumber>=0.10.0
PyPDF2>=3.0.0
pytesseract>=0.3.10
pdf2image>=1.16.0
Pillow>=10.0.0
tabula-py>=2.8.0
python-dateutil>=2.8.0
```

## 🚀 Quick Start Commands

```bash
# Install dependencies
pip install pdfplumber PyPDF2 pytesseract pdf2image Pillow tabula-py

# Install system dependencies (Mac)
brew install tesseract poppler

# Test with one PDF
python test_pdf_parser.py <pdf_url>

# Run full scraper
npm run scrape:congress-trades:historical
```

## 🔍 Validation

After scraping, validate:
```sql
-- Check ticker extraction rate
SELECT 
    COUNT(*) as total,
    COUNT(ticker) as with_ticker,
    ROUND(100.0 * COUNT(ticker) / COUNT(*), 2) as ticker_pct
FROM congressional_stock_trades;

-- Check date parsing
SELECT COUNT(*) 
FROM congressional_stock_trades 
WHERE transaction_date IS NULL;

-- Check transaction types
SELECT transaction_type, COUNT(*) 
FROM congressional_stock_trades 
GROUP BY transaction_type;
```

## 💡 Optimization Ideas

1. **Caching**: Don't re-download PDFs
2. **Parallel processing**: Parse multiple PDFs simultaneously
3. **Smart retry**: Retry failed PDFs with OCR
4. **Quality scoring**: Flag low-confidence extractions
5. **Manual review queue**: Export problematic PDFs for human review

## 📝 Notes

- Government servers can be slow - add timeouts
- Some PDFs are malformed - need error handling
- Ticker extraction is hardest part - many variations
- Consider building a "known tickers" lookup table
- Some members use trusts/blind trusts (harder to parse)

---

**Ready to build this?** Say "yes" and I'll start implementing phase by phase!

