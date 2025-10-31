# FPDS Daily Scraping Schedule

## 🎯 For 1-24 Hour Time Windows

If you can only run scrapes for 1-24 hours at a time, here's how to break it into **manageable daily chunks**.

---

## ⏱️ Time Estimates Per Year

| Contracts | Time | Fits in 24 hours? |
|-----------|------|-------------------|
| **10,000** | 1.5 hours | ✅ Easy |
| **25,000** | 3.5 hours | ✅ Easy |
| **50,000** | 7 hours | ✅ Yes |
| **75,000** | 10.5 hours | ✅ Yes |
| **100,000** | 14 hours | ✅ Yes (tight) |
| **125,000** | 17.5 hours | ⚠️ Close |
| **150,000** | 21 hours | ⚠️ Very tight |
| **175,000+** | 24+ hours | ❌ Won't fit |

**Recommendation:** **Max 100,000 contracts per 24-hour window** to stay safe.

---

## 📅 Strategy 1: One Year Per Day (RECOMMENDED)

Scrape **one year at a time**, each as a separate 24-hour run.

### Example Schedule

**Day 1: 2024** (most recent)
```bash
npx tsx src/scripts/fpds-full-load-by-year.ts --year=2024 --max=50000
```
⏱️ ~7 hours

**Day 2: 2023**
```bash
npx tsx src/scripts/fpds-full-load-by-year.ts --year=2023 --max=50000
```
⏱️ ~7 hours

**Day 3: 2022**
```bash
npx tsx src/scripts/fpds-full-load-by-year.ts --year=2022 --max=50000
```
⏱️ ~7 hours

**...and so on**

---

## 📅 Strategy 2: Two Years Per Day

If you have 24-hour windows, do **two years** per day:

**Day 1: 2024 + 2023**
```bash
# Morning: Start 2024
npx tsx src/scripts/fpds-full-load-by-year.ts --year=2024 --max=50000
# ~7 hours later, start 2023
npx tsx src/scripts/fpds-full-load-by-year.ts --year=2023 --max=50000
```
⏱️ ~14 hours total

**Day 2: 2022 + 2021**
```bash
npx tsx src/scripts/fpds-full-load-by-year.ts --year=2022 --max=50000
npx tsx src/scripts/fpds-full-load-by-year.ts --year=2021 --max=50000
```
⏱️ ~14 hours total

---

## 📅 Strategy 3: Maximize Each 24-Hour Window

Push it to **100K contracts per day** (one year):

```bash
npx tsx src/scripts/fpds-full-load-by-year.ts --year=2024 --max=100000
```
⏱️ ~14 hours

**Timeline for 25 years:**
- At 100K per year: **~13-15 days** (one year per day)
- At 50K per year: **~13-15 days** (two years per day)

---

## 🗓️ Complete 25-Year Plan (50K per year)

### Week 1: Recent Years (2020-2024)
| Day | Years | Command | Time |
|-----|-------|---------|------|
| Mon | 2024 | `--year=2024 --max=50000` | 7h |
| Tue | 2023 | `--year=2023 --max=50000` | 7h |
| Wed | 2022 | `--year=2022 --max=50000` | 7h |
| Thu | 2021 | `--year=2021 --max=50000` | 7h |
| Fri | 2020 | `--year=2020 --max=50000` | 7h |

**Result:** 250K contracts, most recent 5 years

### Week 2: Obama Era Part 1 (2015-2019)
| Day | Years | Command | Time |
|-----|-------|---------|------|
| Mon | 2019 | `--year=2019 --max=50000` | 7h |
| Tue | 2018 | `--year=2018 --max=50000` | 7h |
| Wed | 2017 | `--year=2017 --max=50000` | 7h |
| Thu | 2016 | `--year=2016 --max=50000` | 7h |
| Fri | 2015 | `--year=2015 --max=50000` | 7h |

**Result:** 500K contracts total, 10 years complete

### Week 3: Obama Era Part 2 (2010-2014)
| Day | Years | Command | Time |
|-----|-------|---------|------|
| Mon | 2014 | `--year=2014 --max=50000` | 7h |
| Tue | 2013 | `--year=2013 --max=50000` | 7h |
| Wed | 2012 | `--year=2012 --max=50000` | 7h |
| Thu | 2011 | `--year=2011 --max=50000` | 7h |
| Fri | 2010 | `--year=2010 --max=50000` | 7h |

**Result:** 750K contracts total, 15 years complete

### Week 4: Bush Era (2005-2009)
| Day | Years | Command | Time |
|-----|-------|---------|------|
| Mon | 2009 | `--year=2009 --max=50000` | 7h |
| Tue | 2008 | `--year=2008 --max=50000` | 7h |
| Wed | 2007 | `--year=2007 --max=50000` | 7h |
| Thu | 2006 | `--year=2006 --max=50000` | 7h |
| Fri | 2005 | `--year=2005 --max=50000` | 7h |

**Result:** 1M contracts total, 20 years complete

### Week 5: Early 2000s (2000-2004)
| Day | Years | Command | Time |
|-----|-------|---------|------|
| Mon | 2004 | `--year=2004 --max=50000` | 7h |
| Tue | 2003 | `--year=2003 --max=50000` | 7h |
| Wed | 2002 | `--year=2002 --max=50000` | 7h |
| Thu | 2001 | `--year=2001 --max=50000` | 7h |
| Fri | 2000 | `--year=2000 --max=50000` | 7h |

**Result:** 1.25M contracts total, **25 YEARS COMPLETE!** 🎉

---

## 🚀 How to Run Each Day

### Morning (Recommended)
```bash
# Start at beginning of day
npx tsx src/scripts/fpds-full-load-by-year.ts --year=2024 --max=50000

# Let it run (~7 hours)
# Check on it periodically
```

### With tmux (if you need to disconnect)
```bash
# Start session
tmux new -s fpds-2024

# Run scrape
npx tsx src/scripts/fpds-full-load-by-year.ts --year=2024 --max=50000

# Detach: Ctrl+B, then D
# Reattach later: tmux attach -t fpds-2024
```

### Check Progress
```sql
-- In Supabase, check current totals
SELECT 
  fiscal_year,
  COUNT(*) as contracts,
  MAX(last_scraped) as last_updated
FROM fpds_contracts
GROUP BY fiscal_year
ORDER BY fiscal_year DESC;
```

---

## 🎯 Recommended Approach

### Option A: Steady Daily Scrapes (5 weeks)
- ✅ One year per day
- ✅ ~7 hours per day
- ✅ Easy to manage
- ✅ Can pause/resume anytime
- **Timeline:** 25 days (5 weeks at 5 days/week)

### Option B: Aggressive 24-Hour Windows (2 weeks)
- ✅ Two years per day
- ✅ ~14 hours per day
- ⚠️ Tighter schedule
- **Timeline:** 13 days (2.5 weeks)

### Option C: Weekend Warrior
- ✅ 2-3 years per weekend
- ✅ Saturday + Sunday runs
- **Timeline:** 8-10 weekends

---

## 💡 Pro Tips

### 1. Start with Most Recent
Always start with 2024, 2023, 2022 first (most valuable data).

### 2. Check Data Quality After Each Year
```sql
SELECT * FROM fpds_data_quality_summary;
```

### 3. Track Your Progress
Create a simple checklist:
```
✅ 2024 - 50K contracts - Quality: 90
✅ 2023 - 50K contracts - Quality: 89
⬜ 2022 - pending
⬜ 2021 - pending
...
```

### 4. Resume Capability
If a year fails mid-way, just re-run it. The scraper will upsert (update existing, add new).

### 5. Adjust Max Per Year
If you have more/less time:
- **More time (12+ hours):** `--max=75000` or `--max=100000`
- **Less time (4-6 hours):** `--max=25000` or `--max=35000`

---

## 📊 Storage Growth by Week

| Week | Years | Contracts | DB Size | Supabase Cost |
|------|-------|-----------|---------|---------------|
| **1** | 2020-2024 | 250K | ~2.5 GB | Free tier OK |
| **2** | 2015-2019 | 500K | ~5 GB | $25/mo (Pro) |
| **3** | 2010-2014 | 750K | ~7.5 GB | $25/mo |
| **4** | 2005-2009 | 1M | ~10 GB | $26/mo |
| **5** | 2000-2004 | 1.25M | ~12.5 GB | $27/mo |

**Upgrade to Supabase Pro ($25/mo) before Week 2.**

---

## 🎉 Final Timeline

### Conservative (One Year/Day)
- **5 weeks** (25 business days)
- ~7 hours per day
- Easy to manage

### Aggressive (Two Years/Day)
- **2.5 weeks** (13 business days)
- ~14 hours per day
- Tighter schedule

### Weekend Only
- **8-10 weekends**
- 2-3 years per weekend
- Good for busy weeks

---

## 🚀 Start Today!

```bash
# Day 1: Get the most recent year
npx tsx src/scripts/fpds-full-load-by-year.ts --year=2024 --max=50000
```

**Then repeat daily, working backwards through the years!**

You'll have the ultimate federal contract database in 2-5 weeks! 🎉

