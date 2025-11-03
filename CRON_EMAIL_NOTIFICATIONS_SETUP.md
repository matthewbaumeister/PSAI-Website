# Cron Job Email Notifications Setup

Get beautiful email notifications every time your cron jobs run!

---

## What You'll Get

Every time a cron job runs, you'll receive an **automatic email** with:

### ✅ Success Emails
- Job name and date
- Duration
- Statistics (contracts scraped, opportunities found, etc.)
- Beautiful formatted HTML email

### ❌ Failure Emails
- Error details
- Duration
- Helpful troubleshooting tips
- Special handling for rate limits

### Example Success Email

```
✅ Cron Job Successful

SAM.gov Opportunities Scraper

Date: 11/02/2025
Duration: 45s
Status: ✓ Success

📊 Statistics:
- Total Opportunities: 523
- New Opportunities: 127
- Mode: full-details
- Includes: descriptions, attachments, contacts

💡 Tip: Check your Supabase database to view the newly scraped data.
```

---

## Setup Steps

### 1. Add Your Email to Vercel

In your Vercel project:

1. Go to **Settings** → **Environment Variables**
2. Add new variable:
   - **Key:** `CRON_NOTIFICATION_EMAIL`
   - **Value:** Your email address (e.g., `matt@propshop.ai`)
   - **Environment:** Production, Preview, Development

### 2. Add to Local `.env` (Optional)

For local testing:

```bash
echo "CRON_NOTIFICATION_EMAIL=your-email@example.com" >> .env
```

### 3. Verify SendGrid is Configured

Make sure you already have these in Vercel:
- `SENDGRID_API_KEY`
- `SENDGRID_FROM_EMAIL`

(You should already have this set up from your existing SendGrid configuration)

### 4. Deploy

```bash
git push origin main
```

That's it! You'll now get emails for every cron job execution.

---

## Email Schedule

You'll receive **3 emails per day**:

| Time (UTC) | Time (EST) | Job | What You'll See |
|------------|-----------|-----|----------------|
| 3:00 AM | 11:00 PM (prev) | FPDS | Contracts scraped count |
| 4:00 AM | 12:00 AM | DoD News | Articles & contracts found |
| 6:00 AM | 2:00 AM | SAM.gov | Opportunities with full details |

---

## Email Types

### Success Email (Green)

```
Subject: ✅ SAM.gov Opportunities Scraper Completed Successfully - 11/02/2025

Beautiful formatted email with:
- Job name and status
- Date and duration
- Statistics (opportunities, contracts, etc.)
- Tips and next steps
```

### Rate Limit Email (Orange/Warning)

```
Subject: ⚠️ SAM.gov Opportunities Scraper Rate Limited - 11/02/2025

Informative email explaining:
- Rate limit exceeded (expected, not an error)
- Quota resets at midnight UTC
- Cron will retry tomorrow automatically
- No action needed
```

### Failure Email (Red)

```
Subject: ❌ SAM.gov Opportunities Scraper Failed - 11/02/2025

Detailed error email with:
- Error message and stack trace
- Duration before failure
- Action required notice
- Link to Vercel logs
```

---

## Test Email Notifications

### Manual Test (Local)

```bash
# Set your email in .env
echo "CRON_NOTIFICATION_EMAIL=your-email@example.com" >> .env

# Run a cron job manually
curl http://localhost:3000/api/cron/scrape-sam-gov \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Manual Test (Production)

```bash
# Trigger cron manually
curl https://your-app.vercel.app/api/cron/scrape-sam-gov \
  -H "Authorization: Bearer your-cron-secret"

# Check your inbox!
```

---

## Troubleshooting

### Not Receiving Emails

**Check:**
1. Is `CRON_NOTIFICATION_EMAIL` set in Vercel?
2. Is `SENDGRID_API_KEY` valid?
3. Check spam folder
4. Verify SendGrid sender (must be verified domain/email)

**View logs:**
```
Vercel → Your Project → Functions → Filter by `/api/cron/`
```

Look for:
- `✅ Success email sent to...`
- `⚠️ No CRON_NOTIFICATION_EMAIL set...`
- `❌ Failed to send email...`

### Emails Going to Spam

**Solutions:**
1. Add `noreply@propshop.ai` to your contacts
2. Mark first email as "Not Spam"
3. Verify your SendGrid domain
4. Check SendGrid's spam score

### SendGrid Errors

**Common issues:**

```
Error: The from email does not match a verified sender
```
**Fix:** Verify your sender email in SendGrid dashboard

```
Error: API key does not have required permissions
```
**Fix:** Ensure your SendGrid API key has "Mail Send" permission

---

## Customization

### Change Email Address

Update in Vercel:
```
Settings → Environment Variables → CRON_NOTIFICATION_EMAIL
```

No code changes needed!

### Disable Notifications

Remove `CRON_NOTIFICATION_EMAIL` from Vercel environment variables.

The cron jobs will still run, just without email notifications.

### Custom Email Template

Edit `src/lib/cron-notifications.ts`:
- Modify HTML templates
- Change colors, styles
- Add more statistics
- Customize subject lines

---

## Email Content

### SAM.gov Success Email Includes:
- Total opportunities in database
- New opportunities added today
- Mode (full-details or fast)
- What's included (descriptions, attachments, contacts)
- Duration

### FPDS Success Email Includes:
- Total contracts scraped
- New contracts added
- Updated contracts
- Errors (if any)
- Duration

### DoD News Success Email Includes:
- Articles processed
- Total contracts extracted
- New vs updated
- Duration

---

## Advanced: Daily Digest (Optional)

Want ONE email per day with all 3 jobs?

Create a new cron job that runs at 7 AM UTC:

```typescript
// src/app/api/cron/daily-digest/route.ts
import { sendDailyDigestEmail } from '@/lib/cron-notifications';

export async function GET(request: NextRequest) {
  // Fetch results from all 3 jobs
  // Send single digest email
  await sendDailyDigestEmail(results);
}
```

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/daily-digest",
      "schedule": "0 7 * * *"
    }
  ]
}
```

---

## Email Preview

### Success Email

![Success Email](https://via.placeholder.com/600x400/10b981/ffffff?text=Success+Email)

- **Header:** Gradient purple background
- **Body:** White cards on light gray
- **Stats:** Organized list with icons
- **Tip Box:** Blue info box at bottom

### Failure Email

![Failure Email](https://via.placeholder.com/600x400/ef4444/ffffff?text=Failure+Email)

- **Header:** Red gradient background
- **Body:** Error details in red box
- **Action:** Clear next steps
- **Helpful:** Context and troubleshooting

---

## Best Practices

1. **Use a dedicated email**
   - Create `cron-notifications@propshop.ai`
   - Set up email forwarding if needed

2. **Set up email filters**
   - Label as "Cron Jobs"
   - Auto-archive successful runs
   - Only notify on failures

3. **Monitor regularly (first week)**
   - Check all emails
   - Verify statistics look correct
   - Watch for rate limits

4. **Set up mobile notifications**
   - Forward failures to SMS
   - Use email app push notifications
   - Get alerted immediately to issues

---

## Summary

✅ **Automatic notifications** for all 3 cron jobs  
✅ **Beautiful HTML emails** with statistics  
✅ **Smart handling** of rate limits  
✅ **Detailed errors** when something goes wrong  
✅ **Zero maintenance** once configured  

**Add your email to Vercel and you're done!** 🎉

---

## Next Steps

1. Add `CRON_NOTIFICATION_EMAIL` to Vercel
2. Deploy the changes (already pushed)
3. Wait for next cron execution (tomorrow at 3 AM UTC for FPDS)
4. Check your inbox! ✉️

You'll never miss a scraping run again! 📊

