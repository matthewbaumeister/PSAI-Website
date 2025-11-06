#!/usr/bin/env python3
"""
============================================
Senate HTML Parser
============================================

Parses Senate eFiling HTML pages to extract stock trades.

Features:
- BeautifulSoup4-based HTML parsing
- Table extraction from Senate PTR pages
- Ticker extraction with regex
- Date normalization
- Transaction type normalization

Senate HTML Structure:
- Tables contain trade data
- Columns: Asset, Transaction Type, Date, Amount
- Multiple tables possible per page
============================================
"""

import re
import sys
from typing import List, Dict, Optional
from datetime import datetime
from bs4 import BeautifulSoup

class SenateHTMLParser:
    """Parse Senate eFiling HTML pages for stock trades"""
    
    # Regex patterns for ticker extraction
    TICKER_PATTERNS = [
        r'\(([A-Z]{1,5})\)',                    # (MSFT)
        r'\s-\s([A-Z]{1,5})\s',                 # - MSFT 
        r'\s-\s([A-Z]{1,5})$',                  # - MSFT at end
        r'^([A-Z]{2,5})\s',                     # MSFT at start
        r'\[([A-Z]{1,5})\]',                    # [MSFT]
        r'\b([A-Z]{2,5})\b',                    # MSFT standalone
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
        r'[Oo]ver.*?\$50,000,000': 'Over $50,000,000',
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
        self.tables_parsed = 0
    
    def parse_html(self, html_content: str, url: str = "") -> List[Dict]:
        """
        Main parsing function
        
        Args:
            html_content: Raw HTML content from Senate page
            url: Source URL for reference
            
        Returns:
            List of parsed trades
        """
        trades = []
        
        if not html_content:
            print(f"  Empty HTML content", file=sys.stderr)
            return trades
        
        try:
            print(f"  Parsing HTML ({len(html_content)} bytes)", file=sys.stderr)
            
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Find all tables that might contain transaction data
            tables = soup.find_all('table')
            
            print(f"  Found {len(tables)} table(s)", file=sys.stderr)
            
            for table_idx, table in enumerate(tables):
                self.tables_parsed += 1
                
                # Check if this table contains transaction data
                if self._is_transaction_table(table):
                    print(f"    Table {table_idx + 1}: Transaction table detected", file=sys.stderr)
                    table_trades = self._parse_transaction_table(table, table_idx)
                    trades.extend(table_trades)
                else:
                    print(f"    Table {table_idx + 1}: Skipped (not a transaction table)", file=sys.stderr)
            
            self.trades_found = len(trades)
            print(f"  Extracted {len(trades)} trade(s)", file=sys.stderr)
            
        except Exception as e:
            print(f"  Error parsing HTML: {str(e)}", file=sys.stderr)
            self.errors += 1
        
        return trades
    
    def _is_transaction_table(self, table) -> bool:
        """
        Check if table contains transaction data
        
        Args:
            table: BeautifulSoup table element
            
        Returns:
            True if table appears to contain transactions
        """
        # Look for transaction-related headers
        table_text = table.get_text().lower()
        
        # Common indicators of transaction tables
        indicators = [
            'asset',
            'transaction',
            'type',
            'date',
            'amount',
            'ticker',
            'security',
            'stock',
        ]
        
        # Must have at least 2 indicators
        matches = sum(1 for indicator in indicators if indicator in table_text)
        return matches >= 2
    
    def _parse_transaction_table(self, table, table_idx: int) -> List[Dict]:
        """
        Parse a transaction table
        
        Args:
            table: BeautifulSoup table element
            table_idx: Index of table on page
            
        Returns:
            List of parsed trades
        """
        trades = []
        
        try:
            # Find all rows
            rows = table.find_all('tr')
            
            if len(rows) < 2:  # Need header + at least one data row
                return trades
            
            # Find header row
            header_idx = self._find_header_row(rows)
            if header_idx is None:
                print(f"      Warning: No header found in table {table_idx + 1}", file=sys.stderr)
                return trades
            
            # Extract headers
            header_row = rows[header_idx]
            headers = [th.get_text().strip().lower() for th in header_row.find_all(['th', 'td'])]
            
            # Find column indices
            asset_col = self._find_column(headers, ['asset name', 'asset', 'description', 'security', 'stock'])
            ticker_col = self._find_column(headers, ['ticker', 'symbol'])
            type_col = self._find_column_exact(headers, ['type'])  # Must be exact "type", not "transaction"
            date_col = self._find_column(headers, ['transaction date', 'date', 'trans date'])
            amount_col = self._find_column(headers, ['amount', 'value', 'cap gains'])
            
            if asset_col is None:
                print(f"      Warning: No asset column found in table {table_idx + 1}", file=sys.stderr)
                return trades
            
            print(f"      Columns: asset={asset_col}, ticker={ticker_col}, type={type_col}, date={date_col}, amount={amount_col}", file=sys.stderr)
            
            # Parse data rows
            for row_idx, row in enumerate(rows[header_idx + 1:], start=header_idx + 2):
                cells = row.find_all(['td', 'th'])
                
                if not cells or len(cells) < 2:
                    continue
                
                trade = self._extract_trade_from_row(cells, asset_col, ticker_col, type_col, date_col, amount_col)
                
                if trade:
                    trade['table_idx'] = table_idx
                    trade['row_idx'] = row_idx
                    trades.append(trade)
            
            if trades:
                print(f"      Extracted {len(trades)} trade(s) from table {table_idx + 1}", file=sys.stderr)
        
        except Exception as e:
            print(f"      Error parsing table {table_idx + 1}: {str(e)}", file=sys.stderr)
            self.errors += 1
        
        return trades
    
    def _extract_trade_from_row(self, cells: List, asset_col: int, ticker_col: Optional[int],
                                 type_col: Optional[int], date_col: Optional[int], 
                                 amount_col: Optional[int]) -> Optional[Dict]:
        """Extract trade data from table row"""
        try:
            # Asset description (required)
            if asset_col >= len(cells):
                return None
            
            asset = cells[asset_col].get_text().strip()
            
            # Clean HTML artifacts
            asset = asset.replace('\xa0', ' ').replace('\n', ' ').replace('\r', ' ')
            asset = ' '.join(asset.split())  # Normalize whitespace
            
            if not asset or len(asset) < 3 or asset.lower() in ['none', 'n/a', 'na', '--']:
                return None
            
            # Get ticker from dedicated column if available, otherwise extract from asset
            ticker = None
            if ticker_col is not None and ticker_col < len(cells):
                ticker_text = cells[ticker_col].get_text().strip().upper()
                if ticker_text and ticker_text not in ['--', 'N/A', 'NONE', '']:
                    ticker = ticker_text
            
            # Fallback: try to extract from asset description
            if not ticker:
                ticker = self._extract_ticker(asset)
            
            # Transaction type
            txn_type = 'unknown'
            if type_col is not None and type_col < len(cells):
                txn_type_raw = cells[type_col].get_text().strip()
                txn_type = self._normalize_transaction_type(txn_type_raw)
            
            # Date
            transaction_date = None
            if date_col is not None and date_col < len(cells):
                date_str = cells[date_col].get_text().strip()
                transaction_date = self._parse_date(date_str)
            
            # Amount
            amount_range = 'Not disclosed'
            if amount_col is not None and amount_col < len(cells):
                amount_str = cells[amount_col].get_text().strip()
                amount_range = self._normalize_amount(amount_str)
            
            return {
                'asset_description': asset,
                'ticker': ticker,
                'transaction_type': txn_type,
                'transaction_date': transaction_date,
                'amount_range': amount_range,
            }
        
        except Exception as e:
            print(f"        Warning: Error parsing row: {str(e)}", file=sys.stderr)
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
                # Validate ticker (1-5 uppercase letters)
                if re.match(r'^[A-Z]{1,5}$', ticker):
                    # Filter out common false positives
                    if ticker not in ['INC', 'LLC', 'CORP', 'LTD', 'CO', 'THE', 'AND', 'FOR', 'ETF', 'LP']:
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
        if not text or text.lower() in ['none', 'n/a', 'na', '', '--']:
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
        if not date_str or date_str.lower() in ['none', 'n/a', 'na', '', '--']:
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
            '%m/%d/%Y %H:%M:%S %p',  # Senate sometimes includes time
        ]
        
        for fmt in formats:
            try:
                dt = datetime.strptime(date_str, fmt)
                return dt.strftime('%Y-%m-%d')
            except ValueError:
                continue
        
        return None
    
    def _find_header_row(self, rows: List) -> Optional[int]:
        """Find the header row in table"""
        for idx, row in enumerate(rows[:5]):  # Check first 5 rows
            row_text = row.get_text().lower()
            # Look for key header words
            if any(keyword in row_text for keyword in ['asset', 'transaction', 'description', 'security', 'type']):
                return idx
        return None
    
    def _find_column(self, headers: List[str], keywords: List[str]) -> Optional[int]:
        """Find column index by keywords"""
        for idx, header in enumerate(headers):
            if any(keyword in header for keyword in keywords):
                return idx
        return None
    
    def _find_column_exact(self, headers: List[str], keywords: List[str]) -> Optional[int]:
        """Find column index by exact match (for ambiguous headers like 'type')"""
        for idx, header in enumerate(headers):
            if header in keywords:
                return idx
        return None
    
    def print_stats(self):
        """Print parsing statistics"""
        print(f"\n📊 HTML Parser Stats:", file=sys.stderr)
        print(f"  Tables parsed: {self.tables_parsed}", file=sys.stderr)
        print(f"  Trades found: {self.trades_found}", file=sys.stderr)
        print(f"  Errors: {self.errors}", file=sys.stderr)


# Test function
if __name__ == "__main__":
    print("Testing Senate HTML Parser...\n", file=sys.stderr)
    
    # Sample HTML table for testing
    test_html = """
    <html>
    <body>
        <table>
            <tr>
                <th>Asset</th>
                <th>Transaction Type</th>
                <th>Transaction Date</th>
                <th>Amount</th>
            </tr>
            <tr>
                <td>Microsoft Corporation (MSFT) - Common Stock</td>
                <td>Purchase</td>
                <td>08/15/2024</td>
                <td>$15,001 - $50,000</td>
            </tr>
            <tr>
                <td>Apple Inc (AAPL)</td>
                <td>Sale</td>
                <td>08/20/2024</td>
                <td>$50,001 - $100,000</td>
            </tr>
        </table>
    </body>
    </html>
    """
    
    parser = SenateHTMLParser()
    trades = parser.parse_html(test_html)
    
    print(f"\n{'='*60}", file=sys.stderr)
    print(f"Results:", file=sys.stderr)
    print(f"{'='*60}", file=sys.stderr)
    
    if trades:
        print(f"\nFound {len(trades)} trades:\n", file=sys.stderr)
        for i, trade in enumerate(trades, 1):
            print(f"{i}. {trade['asset_description']}", file=sys.stderr)
            print(f"   Ticker: {trade['ticker'] or 'N/A'}", file=sys.stderr)
            print(f"   Type: {trade['transaction_type']}", file=sys.stderr)
            print(f"   Date: {trade['transaction_date'] or 'N/A'}", file=sys.stderr)
            print(f"   Amount: {trade['amount_range']}", file=sys.stderr)
            print("", file=sys.stderr)
    else:
        print("\nNo trades found", file=sys.stderr)
    
    parser.print_stats()

