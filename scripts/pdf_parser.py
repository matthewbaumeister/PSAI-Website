#!/usr/bin/env python3
"""
============================================
PDF Table Parser
============================================

Parses congressional PTR PDFs to extract stock trades.

Features:
- Table extraction using pdfplumber
- Multiple format support
- Ticker extraction with regex
- Date normalization
- Transaction type normalization

Phase 2 of PDF Parser Implementation
============================================
"""

import pdfplumber
import re
import sys
from typing import List, Dict, Optional
from datetime import datetime
from pathlib import Path

class PTRParser:
    """Parse Periodic Transaction Reports (PTRs)"""
    
    # Regex patterns for ticker extraction
    TICKER_PATTERNS = [
        r'\(([A-Z]{1,5})\)',                    # (MSFT)
        r'\s-\s([A-Z]{1,5})\s',                 # - MSFT 
        r'\s-\s([A-Z]{1,5})$',                  # - MSFT at end
        r'^([A-Z]{2,5})\s',                     # MSFT at start
        r'\[([A-Z]{1,5})\]',                    # [MSFT]
    ]
    
    # Amount range patterns and normalizations
    AMOUNT_PATTERNS = {
        r'\$1,001.*?\$15,000': '$1,001 - $15,000',
        r'\$15,001.*?\$50,000': '$15,001 - $50,000',
        r'\$50,001.*?\$100,000': '$50,001 - $100,000',
        r'\$100,001.*?\$250,000': '$100,001 - $250,000',
        r'\$250,001.*?\$500,000': '$250,001 - $500,000',
        r'\$500,001.*?\$1,000,000': '$500,001 - $1,000,000',
        r'[Oo]ver.*?\$1,000,000': 'Over $1,000,000',
        r'[Oo]ver.*?\$5,000,000': 'Over $5,000,000',
    }
    
    # Transaction type mappings
    TRANSACTION_TYPES = {
        'purchase': ['purchase', 'buy', 'p', 'purchased'],
        'sale': ['sale', 'sell', 's', 'sold', 'sale (full)', 'sale (partial)', 'sale(full)', 'sale(partial)'],
        'exchange': ['exchange', 'ex', 'exchanged'],
    }
    
    def __init__(self):
        """Initialize parser"""
        self.trades_found = 0
        self.errors = 0
        self.pages_parsed = 0
    
    def parse_pdf(self, pdf_path: str) -> List[Dict]:
        """
        Main parsing function
        
        Args:
            pdf_path: Path to PDF file
            
        Returns:
            List of parsed trades
        """
        trades = []
        pdf_path = Path(pdf_path)
        
        if not pdf_path.exists():
            print(f"  ❌ PDF not found: {pdf_path}", file=sys.stderr)
            return trades
        
        try:
            print(f"  📖 Parsing PDF: {pdf_path.name}", file=sys.stderr)
            
            with pdfplumber.open(pdf_path) as pdf:
                print(f"  📄 Pages: {len(pdf.pages)}", file=sys.stderr)
                
                for page_num, page in enumerate(pdf.pages, 1):
                    self.pages_parsed += 1
                    
                    # Extract tables
                    tables = page.extract_tables()
                    
                    if tables:
                        print(f"    Page {page_num}: {len(tables)} table(s) found", file=sys.stderr)
                        
                        for table_idx, table in enumerate(tables):
                            if table and len(table) > 1:  # Has header + data
                                page_trades = self._parse_table(table, page_num, table_idx)
                                trades.extend(page_trades)
                    
                    # Fallback: try text extraction if no tables
                    if not tables:
                        print(f"    Page {page_num}: No tables, trying text extraction", file=sys.stderr)
                        text = page.extract_text()
                        if text:
                            page_trades = self._parse_text(text, page_num)
                            trades.extend(page_trades)
            
            self.trades_found = len(trades)
            print(f"  ✅ Extracted {len(trades)} trade(s)", file=sys.stderr)
            
        except Exception as e:
            print(f"  ❌ Error parsing PDF: {str(e)}", file=sys.stderr)
            self.errors += 1
        
        return trades
    
    def _parse_table(self, table: List[List[str]], page_num: int, table_idx: int) -> List[Dict]:
        """
        Parse structured table data
        
        Args:
            table: 2D list of table cells
            page_num: Page number
            table_idx: Table index on page
            
        Returns:
            List of parsed trades
        """
        trades = []
        
        if not table or len(table) < 2:
            return trades
        
        # Find header row
        header_idx = self._find_header_row(table)
        if header_idx is None:
            print(f"      ⚠️  Table {table_idx + 1}: No header found", file=sys.stderr)
            return trades
        
        headers = [str(h).lower().strip() if h else '' for h in table[header_idx]]
        
        # Find column indices
        asset_col = self._find_column(headers, ['asset', 'description', 'security'])
        type_col = self._find_column(headers, ['type', 'transaction'])
        date_col = self._find_column(headers, ['date', 'trans date', 'transaction date'])
        amount_col = self._find_column(headers, ['amount', 'value', 'cap gains'])
        
        if asset_col is None:
            print(f"      ⚠️  Table {table_idx + 1}: No asset column found", file=sys.stderr)
            return trades
        
        print(f"      Columns: asset={asset_col}, type={type_col}, date={date_col}, amount={amount_col}", file=sys.stderr)
        
        # Parse data rows
        for row_idx, row in enumerate(table[header_idx + 1:], start=header_idx + 2):
            if not row or self._is_empty_row(row):
                continue
            
            trade = self._extract_trade_from_row(row, asset_col, type_col, date_col, amount_col)
            
            if trade:
                trade['page_num'] = page_num
                trade['table_idx'] = table_idx
                trade['row_idx'] = row_idx
                trades.append(trade)
        
        if trades:
            print(f"      ✅ Table {table_idx + 1}: Extracted {len(trades)} trade(s)", file=sys.stderr)
        
        return trades
    
    def _extract_trade_from_row(self, row: List, asset_col: int, type_col: Optional[int], 
                                 date_col: Optional[int], amount_col: Optional[int]) -> Optional[Dict]:
        """Extract trade data from a table row"""
        try:
            # Asset description (required)
            asset = str(row[asset_col]) if asset_col < len(row) else ''
            asset = asset.strip()
            
            # Clean Unicode escape sequences and null characters
            asset = asset.replace('\x00', '').replace('\u0000', '')
            asset = ''.join(char for char in asset if ord(char) >= 32 or char == '\n')
            
            if not asset or len(asset) < 3 or asset.lower() in ['none', 'n/a', 'na']:
                return None
            
            # Extract ticker
            ticker = self._extract_ticker(asset)
            
            # Transaction type
            txn_type = 'unknown'
            if type_col is not None and type_col < len(row):
                txn_type_raw = str(row[type_col]).strip()
                txn_type = self._normalize_transaction_type(txn_type_raw)
            
            # Date
            transaction_date = None
            if date_col is not None and date_col < len(row):
                date_str = str(row[date_col]).strip()
                transaction_date = self._parse_date(date_str)
            
            # Amount
            amount_range = 'Not disclosed'
            if amount_col is not None and amount_col < len(row):
                amount_str = str(row[amount_col]).strip()
                amount_range = self._normalize_amount(amount_str)
            
            return {
                'asset_description': asset,
                'ticker': ticker,
                'transaction_type': txn_type,
                'transaction_date': transaction_date,
                'amount_range': amount_range,
            }
        
        except Exception as e:
            print(f"        ⚠️  Error parsing row: {str(e)}", file=sys.stderr)
            self.errors += 1
            return None
    
    def _extract_ticker(self, text: str) -> Optional[str]:
        """Extract stock ticker from text using regex patterns"""
        if not text:
            return None
        
        for pattern in self.TICKER_PATTERNS:
            match = re.search(pattern, text)
            if match:
                ticker = match.group(1).upper().strip()
                # Validate ticker (2-5 uppercase letters)
                if re.match(r'^[A-Z]{2,5}$', ticker):
                    # Filter out common false positives
                    if ticker not in ['INC', 'LLC', 'CORP', 'LTD', 'CO', 'THE', 'AND', 'FOR']:
                        return ticker
        
        return None
    
    def _normalize_transaction_type(self, text: str) -> str:
        """Normalize transaction type to standard values"""
        if not text:
            return 'unknown'
        
        text_lower = text.lower().strip()
        
        for normalized, variations in self.TRANSACTION_TYPES.items():
            if any(var in text_lower for var in variations):
                return normalized
        
        return 'unknown'
    
    def _normalize_amount(self, text: str) -> str:
        """Normalize amount range to standard format"""
        if not text or text.lower() in ['none', 'n/a', 'na', '']:
            return 'Not disclosed'
        
        text = text.strip()
        
        # Try pattern matching
        for pattern, normalized in self.AMOUNT_PATTERNS.items():
            if re.search(pattern, text, re.IGNORECASE):
                return normalized
        
        # Return as-is if no pattern matches
        return text
    
    def _parse_date(self, date_str: str) -> Optional[str]:
        """Parse date string to ISO format (YYYY-MM-DD)"""
        if not date_str or date_str.lower() in ['none', 'n/a', 'na', '']:
            return None
        
        date_str = date_str.strip()
        
        # Try common formats
        formats = [
            '%m/%d/%Y',
            '%m/%d/%y',
            '%Y-%m-%d',
            '%d-%m-%Y',
            '%m-%d-%Y',
            '%b %d, %Y',
            '%B %d, %Y',
        ]
        
        for fmt in formats:
            try:
                dt = datetime.strptime(date_str, fmt)
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
            # Look for key header words
            if any(keyword in row_text for keyword in ['asset', 'transaction', 'description', 'security']):
                return idx
        return None
    
    def _find_column(self, headers: List[str], keywords: List[str]) -> Optional[int]:
        """Find column index by keywords"""
        for idx, header in enumerate(headers):
            if any(keyword in header for keyword in keywords):
                return idx
        return None
    
    def _is_empty_row(self, row: List[str]) -> bool:
        """Check if row is empty or just whitespace"""
        if not row:
            return True
        return all(not cell or str(cell).strip() in ['', 'None', 'none'] for cell in row)
    
    def _parse_text(self, text: str, page_num: int) -> List[Dict]:
        """
        Fallback: parse unstructured text
        
        This is for PDFs that don't have proper tables.
        Uses pattern matching to find trades in free text.
        """
        # TODO: Implement text-based parsing
        # For now, return empty list
        return []
    
    def print_stats(self):
        """Print parsing statistics"""
        print(f"\n📊 Parsing Stats:", file=sys.stderr)
        print(f"  Pages parsed: {self.pages_parsed}", file=sys.stderr)
        print(f"  Trades found: {self.trades_found}", file=sys.stderr)
        print(f"  Errors: {self.errors}", file=sys.stderr)


# Test function
if __name__ == "__main__":
    print("Testing PDF Parser...\n", file=sys.stderr)
    
    # Test with the downloaded PDF
    pdf_path = "pdf_cache/20024542.pdf"
    
    if not Path(pdf_path).exists():
        print(f"❌ Test PDF not found: {pdf_path}", file=sys.stderr)
        print("Run pdf_downloader.py first!", file=sys.stderr)
        sys.exit(1)
    
    parser = PTRParser()
    trades = parser.parse_pdf(pdf_path)
    
    print(f"\n{'='*60}", file=sys.stderr)
    print(f"Results:", file=sys.stderr)
    print(f"{'='*60}", file=sys.stderr)
    
    if trades:
        print(f"\nFound {len(trades)} trades:\n", file=sys.stderr)
        for i, trade in enumerate(trades[:5], 1):  # Show first 5
            print(f"{i}. {trade['asset_description'][:50]}", file=sys.stderr)
            print(f"   Ticker: {trade['ticker'] or 'N/A'}", file=sys.stderr)
            print(f"   Type: {trade['transaction_type']}", file=sys.stderr)
            print(f"   Date: {trade['transaction_date'] or 'N/A'}", file=sys.stderr)
            print(f"   Amount: {trade['amount_range']}", file=sys.stderr)
            print("", file=sys.stderr)
        
        if len(trades) > 5:
            print(f"... and {len(trades) - 5} more", file=sys.stderr)
    else:
        print("\n❌ No trades found", file=sys.stderr)
    
    parser.print_stats()

