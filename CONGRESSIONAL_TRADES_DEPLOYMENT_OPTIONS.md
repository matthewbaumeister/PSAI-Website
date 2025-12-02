# Congressional Trades Deployment - All Options

## ✅ **Your Existing Setup (Working!)**

You already have **7 daily scrapers** running on **Vercel Cron**:

```
11:30 AM - Congress.gov bills/actions
12:00 PM - FPDS contracts  
12:15 PM - DOD news
12:30 PM - SAM.gov
12:45 PM - SBIR
 1:00 PM - Army Innovation
 1:15 PM - ManTech
```

**These send you daily emails!** ✉️

---

## 🆕 **Congressional Trades (Monthly on 15th)**

**Problem:** Takes 10-20 minutes (too long for Vercel's 60 sec limit)

**Solution:** 3 deployment options below ⬇️

---

## 🎯 **Option 1: Vercel → GitHub Actions (RECOMMENDED)**

**How it works:**
1. Vercel cron runs monthly (lightweight trigger)
2. Triggers GitHub Action (heavy lifting)
3. GitHub Action scrapes & updates database
4. You get same email notifications

**Setup:**

### 1. Add GitHub Secrets
In your GitHub repo → Settings → Secrets:
```
NEXT_PUBLIC_SUPABASE_URL = your_supabase_url
SUPABASE_SERVICE_ROLE_KEY = your_service_key
```

### 2. Add to `.env.local` (for Vercel)
```bash
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_REPO=your-username/PropShop_AI_Website
```

### 3. Deploy
```bash
git add .
git commit -m "Add congressional trades monthly cron"
git push
```

**That's it!** ✅

**Schedule:**
- **Vercel** triggers on 15th at 2 PM
- **GitHub** runs the actual scraper
- **Duration:** 10-20 minutes
- **Emails:** Automatic (via GitHub Actions)

**Pros:**
- ✅ Same experience as other scrapers
- ✅ No timeout limits
- ✅ Automatic emails
- ✅ Logs in GitHub
- ✅ Mac doesn't need to be on

**Cons:**
- ⚠️ Requires GitHub repo setup

---

## 📍 **Option 2: Local Cron (Simple)**

**How it works:**
- Runs from your Mac monthly via cron
- Mac must be on at 2 AM on 15th

**Setup:**

```bash
crontab -e
```

Add:
```bash
# Congressional Trades - Monthly on 15th at 2 AM
0 2 15 * * cd /Users/matthewbaumeister/Documents/PropShop_AI_Website && ./scripts/scrape_congress_trades_monthly.sh
```

**Pros:**
- ✅ Super simple
- ✅ No GitHub needed
- ✅ You're testing this now!

**Cons:**
- ❌ Mac must be on
- ❌ No automatic emails (unless you add)
- ❌ Manual monitoring

---

## 🔄 **Option 3: Manual Monthly Run**

**How it works:**
- Get Vercel reminder email monthly
- Manually run: `npm run scrape:congress-trades:monthly`

**Setup:**
- Already done! Vercel will send monthly reminder
- Just run the command when you get the email

**Pros:**
- ✅ Full control
- ✅ No automation needed
- ✅ Can run anytime

**Cons:**
- ❌ Manual work
- ❌ Easy to forget

---

## 📊 **Comparison**

| Feature | Vercel → GitHub | Local Cron | Manual |
|---------|----------------|------------|--------|
| Automatic | ✅ | ✅ | ❌ |
| Emails | ✅ | ⚠️ Manual | ⚠️ Manual |
| Mac must be on | ❌ | ✅ | ✅ |
| Setup complexity | Medium | Easy | None |
| **Recommended?** | **⭐ YES** | If no GitHub | Backup |

---

## 🎯 **My Recommendation**

**Use Option 1 (Vercel → GitHub Actions)** because:

1. ✅ **Consistent** with your other 7 scrapers
2. ✅ **Automatic** emails like others
3. ✅ **No manual work** needed
4. ✅ **No timeout issues**
5. ✅ **Professional** setup

---

## 🚀 **Quick Start (Option 1)**

After your current test succeeds:

```bash
# 1. Add GitHub secrets (in GitHub web UI)

# 2. Add to .env.local:
echo "GITHUB_TOKEN=ghp_your_token_here" >> .env.local
echo "GITHUB_REPO=your-username/PropShop_AI_Website" >> .env.local

# 3. Deploy
git add .
git commit -m "Add congressional trades monthly scraper"
git push

# 4. Done! Will run on 15th of every month
```

**Verify it's set up:**
```bash
# Check Vercel cron (after deployment)
# Visit: https://vercel.com/your-project/settings/crons

# Check GitHub Action
# Visit: https://github.com/your-repo/actions
```

---

## 📝 **Current Status**

✅ **Test running now** (local test)  
✅ **Vercel cron endpoint** created  
✅ **GitHub Action** created  
⏳ **Waiting for test to complete**  
⏳ **Then deploy Option 1**

---

## 💡 **What Happens on 15th of Month**

With Option 1:

1. **2:00 PM** - Vercel cron wakes up
2. **2:00:05 PM** - Vercel triggers GitHub Action
3. **2:00:10 PM** - GitHub starts scraping
4. **2:15:00 PM** - Scraping completes (~10-20 min)
5. **2:15:05 PM** - Database updated with new trades
6. **2:15:10 PM** - Email sent to you ✉️

**Same experience as your 7 daily scrapers!** 🎉

---

## 🔧 **Files Created**

1. `vercel.json` - Added monthly cron trigger
2. `src/app/api/cron/congressional-trades-monthly/route.ts` - Vercel endpoint
3. `.github/workflows/congress-trades-monthly.yml` - GitHub Action
4. `scripts/scrape_congress_trades_monthly.sh` - Scraper script

**Everything is ready to deploy after your test!**


