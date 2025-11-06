#!/usr/bin/env python3
"""
Upload congressional trades to Supabase incrementally
"""

import os
import sys
import json
from typing import List, Dict, Any
from datetime import datetime

try:
    from supabase import create_client, Client
    from dotenv import load_dotenv
except ImportError:
    print("ERROR: Missing dependencies", file=sys.stderr)
    print("Run: pip install supabase python-dotenv", file=sys.stderr)
    sys.exit(1)

# Load environment variables
load_dotenv('.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Missing Supabase credentials", file=sys.stderr)
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def clean_trade(trade: Dict[str, Any]) -> Dict[str, Any]:
    """Clean trade data before upload"""
    # Remove null bytes and control characters
    if 'asset_description' in trade:
        trade['asset_description'] = (
            trade['asset_description']
            .replace('\x00', '')
            .replace('\u0000', '')
            .strip()
        )
        # Remove control characters
        trade['asset_description'] = ''.join(
            char for char in trade['asset_description'] 
            if ord(char) >= 32 or char == '\n'
        )
    
    # Ensure required fields
    if not trade.get('disclosure_date'):
        trade['disclosure_date'] = trade.get('transaction_date', '2020-01-01')
    if not trade.get('transaction_date'):
        trade['transaction_date'] = trade.get('disclosure_date', '2020-01-01')
    
    return trade

def upload_batch(trades: List[Dict[str, Any]]) -> Dict[str, int]:
    """Upload a batch of trades to Supabase"""
    stats = {'inserted': 0, 'updated': 0, 'errors': 0, 'skipped': 0}
    
    for trade in trades:
        try:
            # Clean the trade
            clean = clean_trade(trade)
            
            # Skip junk rows
            if len(clean.get('asset_description', '')) < 5:
                stats['skipped'] += 1
                continue
            
            if clean.get('asset_description', '').startswith('F S:'):
                stats['skipped'] += 1
                continue
            
            # Try to insert
            result = supabase.table('congressional_stock_trades').insert({
                'member_name': clean['member_name'],
                'chamber': clean['chamber'],
                'transaction_date': clean['transaction_date'],
                'disclosure_date': clean['disclosure_date'],
                'ticker': clean.get('ticker'),
                'asset_description': clean['asset_description'],
                'transaction_type': clean['transaction_type'],
                'amount_range': clean.get('amount_range', 'Not disclosed'),
                'filing_url': clean.get('filing_url', ''),
                'scraped_at': datetime.now().isoformat()
            }).execute()
            
            stats['inserted'] += 1
            
        except Exception as e:
            error_msg = str(e)
            # Check if duplicate (23505 = unique violation)
            if '23505' in error_msg or 'duplicate' in error_msg.lower():
                stats['updated'] += 1
            else:
                print(f"Error uploading trade: {error_msg[:100]}", file=sys.stderr)
                stats['errors'] += 1
    
    return stats

if __name__ == "__main__":
    # Read trades from stdin
    trades_json = sys.stdin.read()
    trades = json.loads(trades_json)
    
    print(f"Uploading {len(trades)} trades...", file=sys.stderr)
    
    # Upload in batches
    batch_size = 50
    total_stats = {'inserted': 0, 'updated': 0, 'errors': 0, 'skipped': 0}
    
    for i in range(0, len(trades), batch_size):
        batch = trades[i:i+batch_size]
        batch_stats = upload_batch(batch)
        
        for key in total_stats:
            total_stats[key] += batch_stats[key]
        
        print(f"  Batch {i//batch_size + 1}: +{batch_stats['inserted']} inserted, "
              f"{batch_stats['updated']} duplicates, {batch_stats['errors']} errors", 
              file=sys.stderr)
    
    print(f"\n✅ Upload complete!", file=sys.stderr)
    print(f"  Inserted: {total_stats['inserted']}", file=sys.stderr)
    print(f"  Updated: {total_stats['updated']}", file=sys.stderr)
    print(f"  Skipped: {total_stats['skipped']}", file=sys.stderr)
    print(f"  Errors: {total_stats['errors']}", file=sys.stderr)

