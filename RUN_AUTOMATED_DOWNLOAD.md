# Automated GSA eLibrary Download - Ready!

## What I Just Created

An automated Playwright scraper that will:
- ✅ Open GSA eLibrary in a browser automatically
- ✅ Search for each SIN
- ✅ Click download buttons
- ✅ Save files with proper names
- ✅ Download 10 SINs in about 10-15 minutes

**No more manual clicking!**

## How to Run It

### From the setup script (easiest):

Just press **Enter** to skip manual downloads, and when the script finishes, run:

```bash
python3 scripts/gsa-elibrary-auto-download.py
```

### Or run directly now:

```bash
python3 scripts/gsa-elibrary-auto-download.py
```

## What Will Happen

1. Script asks for confirmation
2. Browser window opens (you'll see it working)
3. For each SIN (10 total):
   - Opens GSA eLibrary
   - Searches for SIN
   - Clicks download
   - Saves Excel file
   - Shows progress
4. Closes browser automatically
5. Shows summary of what downloaded

## SINs It Will Download

The script will automatically download these 10 high-value SINs:

1. **54151S** - IT Professional Services
2. **541519ICAM** - Identity, Credentialing, and Access Management
3. **541330** - Engineering Services
4. **541611** - Management and Financial Consulting
5. **541715** - Research and Development
6. **541380** - Testing Laboratories and Services
7. **611430** - Professional and Management Development Training
8. **541990** - All Other Professional, Scientific, and Technical Services
9. **561320** - Temporary Help Services
10. **541613** - Marketing Consulting Services

Each file will be saved as: `data/gsa_schedules/GSA_MAS_[SIN]_[DATE].xlsx`

## Estimated Time

- **Per SIN**: 1-2 minutes
- **Total**: 10-15 minutes
- **vs Manual**: Would take 2-3 hours!

## What You'll See

```
[1/10] Processing SIN: 54151S - IT Professional Services
----------------------------------------------------------------------
Navigating to GSA eLibrary for SIN 54151S...
Searching for SIN: 54151S
Looking for download link...
Starting download to: data/gsa_schedules/GSA_MAS_54151S_20241105.xlsx
Download completed: data/gsa_schedules/GSA_MAS_54151S_20241105.xlsx
File saved successfully: 245.3 KB
✓ Successfully downloaded 54151S

[2/10] Processing SIN: 541519ICAM - Identity, Credentialing...
...
```

## After It Finishes

The script will automatically tell you to run:

```bash
python3 scripts/gsa-schedule-scraper.py
```

This parses the Excel files and creates JSON for import.

## Troubleshooting

**If browser doesn't open:**
```bash
python3 -m playwright install chromium
```

**If download fails:**
- GSA eLibrary might be slow (it's a government site)
- Script will retry automatically
- Failed SINs will be listed in summary

**If you want to add more SINs:**
Edit `scripts/gsa-elibrary-auto-download.py` and add to `self.target_sins` list.

## Run It Now!

In your terminal, just run:

```bash
python3 scripts/gsa-elibrary-auto-download.py
```

Sit back and watch it work! The browser will show you progress as it goes.

**This will save you 2-3 hours of manual clicking!**

