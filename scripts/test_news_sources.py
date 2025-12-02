#!/usr/bin/env python3
"""
Test News Sources - Find Working Endpoints
"""

import requests

print("Testing DoD News Sources...")
print("="*70)

sources = [
    ("Defense.gov Contracts", "https://www.defense.gov/News/Contracts/"),
    ("Defense.gov News RSS", "https://www.defense.gov/DesktopModules/ArticleCS/RSS.ashx?ContentType=1&Site=945"),
    ("Army News RSS", "https://www.army.mil/rss/"),
    ("Army News Main", "https://www.army.mil/news/"),
    ("Navy News", "https://www.navy.mil/Press-Office/News-Stories/"),
    ("Air Force News", "https://www.af.mil/News/"),
    ("DVIDS Search", "https://www.dvidshub.net/search/?q=&filter%5Btype%5D=news&sort=date"),
    ("DVIDS Main", "https://www.dvidshub.net/"),
]

for name, url in sources:
    try:
        response = requests.get(url, timeout=10)
        status = "✅ WORKING" if response.status_code == 200 else f"❌ {response.status_code}"
        print(f"{name:30} {status:20} {url}")
    except Exception as e:
        print(f"{name:30} ❌ ERROR         {str(e)[:40]}")

print("="*70)
print("\nTesting Defense.gov recent contracts...")
try:
    response = requests.get("https://www.defense.gov/News/Contracts/", timeout=10)
    if response.status_code == 200:
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(response.text, 'html.parser')
        # Find recent contract articles
        links = soup.find_all('a', href=lambda x: x and '/Contract/Article/' in x)
        print(f"Found {len(links)} contract article links")
        if links:
            print("Sample URLs:")
            for link in links[:3]:
                print(f"  {link.get('href')}")
except Exception as e:
    print(f"Error: {e}")

