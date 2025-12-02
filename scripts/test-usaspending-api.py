#!/usr/bin/env python3
"""Test USAspending.gov API connectivity"""

import requests
import json

print("Testing USAspending.gov API...")
print()

# Test 1: Simple API call
url = "https://api.usaspending.gov/api/v2/search/spending_by_award/"

headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Content-Type': 'application/json'
}

payload = {
    "filters": {
        "award_type_codes": ["IDV_B"],
        "award_ids": ["GS00Q17GWD2003"],  # Alliant 2
        "time_period": [{
            "start_date": "2024-01-01",
            "end_date": "2024-12-31",
            "date_type": "action_date"
        }]
    },
    "fields": ["Award ID", "Recipient Name", "Award Amount"],
    "page": 1,
    "limit": 10
}

print(f"URL: {url}")
print(f"Payload: {json.dumps(payload, indent=2)}")
print()

try:
    response = requests.post(url, json=payload, headers=headers, timeout=30)
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print()
    
    if response.ok:
        data = response.json()
        print("SUCCESS!")
        print(f"Results count: {len(data.get('results', []))}")
        if data.get('results'):
            print("\nFirst result:")
            print(json.dumps(data['results'][0], indent=2))
    else:
        print(f"ERROR: {response.status_code}")
        print(response.text)
        
except Exception as e:
    print(f"Exception: {type(e).__name__}: {e}")

