# 🧪 AI Instruction Analysis - Quick Test Guide

## ✅ **Status: Ready to Test!**

All code is deployed. You just need to add the OpenAI API key.

---

## 🔑 **Step 1: Get OpenAI API Key (~5 minutes)**

### A. Create Account & Get Key

1. **Go to:** https://platform.openai.com/signup
2. **Sign up** or **log in**
3. **Navigate to API Keys:** https://platform.openai.com/api-keys
4. **Click:** "Create new secret key"
5. **Name:** `PropShop-AI-Production`
6. **Copy the key** (starts with `sk-proj-...`)
   - ⚠️ **Save it now!** You can't see it again

### B. Add Billing (Required)

1. **Go to:** https://platform.openai.com/settings/organization/billing/overview
2. **Add payment method** (credit card)
3. **Set usage limit:** $10/month
4. **Expected cost:** $0.50-2.00/month (very cheap!)

### C. Add to Vercel

1. **Go to:** https://vercel.com/matthewfrancisbaumeister-3291s-projects/psai-website/settings/environment-variables
2. **Click:** "Add New"
3. **Key:** `OPENAI_API_KEY`
4. **Value:** Paste `sk-proj-...`
5. **Environments:** ✅ Production ✅ Preview ✅ Development
6. **Save**

Vercel will auto-redeploy (~2 minutes)

---

## 🧪 **Step 2: Test the Feature**

### Via Live Website (Recommended):

1. **Wait** ~2 minutes for Vercel redeploy
2. **Go to:** https://www.prop-shop.ai/opportunities/A254-P039
3. **Hard refresh:** Cmd+Shift+R
4. **Scroll down** to "AI Instruction Analysis" section
5. **Look for:**
   ```
   ┌─────────────────────────────────────┐
   │ 🧠 AI Instruction Analysis  [BETA]  │
   │ GPT-4o-mini powered compliance...   │
   │                                     │
   │ [Analyze Instructions with AI] →    │
   └─────────────────────────────────────┘
   ```
6. **Click** "Analyze Instructions with AI"
7. **Wait** 10-30 seconds (shows loading spinner)
8. **Results appear!**

### What You Should See:

**Superseding Notes (Yellow section):**
```
⚠️ Component instructions supersede BAA for:
   • Page Limits: 10 pages maximum
     Source: Component §2.1, p.5
```

**Conflicts Detected (Red section):**
```
❌ Conflict: Budget Format
   Component says: "Use SF-1207 form"
   BAA says: "Use standard budget template"
   Resolution: Component supersedes
```

**Compliance Checklist (Blue section):**
```
Volume 2: Technical Proposal
☐ 2.1 Technical Approach: Page limit 10 pages
   Source: Component (§2.1, p.5)
   Priority: Critical
   Note: Supersedes BAA 15-page limit
```

---

## 🐛 **Troubleshooting**

### Problem: "Analysis Failed - Missing credentials"
**Solution:** API key not set. Check Vercel environment variables.

### Problem: "Analysis Failed - Failed to extract text"
**Solution:** PDF URLs might be invalid. Try a different opportunity.

### Problem: "Analysis Failed - OpenAI API error: 401"
**Solution:** API key is invalid. Double-check the key in Vercel.

### Problem: "Analysis Failed - 429 Rate limit"
**Solution:** Too many requests. Wait 1 minute and try again.

### Problem: Button not appearing
**Solution:** 
- Hard refresh (Cmd+Shift+R)
- Check if opportunity is "Open" status
- Check if opportunity has instructions

### Problem: Takes forever (>60 seconds)
**Solution:** 
- Normal time is 10-30 seconds
- Check OpenAI status: https://status.openai.com
- Try again in a few minutes

---

## 📊 **Expected Performance**

| Metric | Expected Value |
|--------|---------------|
| Analysis Time | 10-30 seconds |
| Cost per Analysis | $0.003-0.007 (~half a cent) |
| Success Rate | >95% |
| Requirements Found | 15-50 per opportunity |
| Conflicts Found | 0-10 per opportunity |

---

## ✨ **Features to Test**

### 1. Superseding Detection
- Check if it correctly identifies which document wins
- Look for explicit citations
- Verify explanations make sense

### 2. Conflict Resolution
- See if it finds real disagreements
- Check if resolution is logical
- Verify citations from both docs

### 3. Compliance Checklist
- Count total requirements (should be comprehensive)
- Check priority levels (Critical/Required/Recommended)
- Verify citations are precise
- Look for volume organization

### 4. UI/UX
- Loading state smooth?
- Results collapsible?
- Colors/styling good?
- Mobile responsive?

---

## 🎯 **Test Different Opportunities**

Try these to see variety:

1. **A254-P039** - Army, has instructions
2. **Any Navy opportunity** - Different component style
3. **Any Air Force** - Different format

---

## 📸 **Success Checklist**

- [ ] OpenAI API key obtained
- [ ] Billing added to OpenAI
- [ ] API key added to Vercel
- [ ] Vercel redeployed successfully
- [ ] Button appears on active opportunity
- [ ] Clicking button shows loading state
- [ ] Analysis completes in 10-30 seconds
- [ ] Results display with all sections
- [ ] Superseding notes make sense
- [ ] Checklist is comprehensive
- [ ] Results are collapsible
- [ ] No errors in browser console

---

## 🚀 **Next Steps After Testing**

Once it works:

1. **Test on 3-5 opportunities** - verify quality
2. **Check cost** on OpenAI dashboard
3. **Refine prompts** if needed (I can help)
4. **Integrate into scraper** - auto-analyze new opps
5. **Add batch processing** - backfill existing opps

---

## 💰 **Cost Tracking**

Check your usage:
- **Dashboard:** https://platform.openai.com/usage
- **View by day:** See exact costs
- **Set alerts:** Get notified if over budget

**Expected for testing:**
- 10 test analyses = ~$0.05 (5 cents)
- 100 analyses = ~$0.50 (50 cents)
- 1000 analyses = ~$5.00

**Very affordable!** 🎉

---

## 📞 **Need Help?**

If anything doesn't work:
1. Check error message in UI
2. Check browser console (F12)
3. Check Vercel logs
4. Check OpenAI status page
5. Let me know the exact error!

---

**Ready to test? Add that API key and try it out!** 🚀✨

