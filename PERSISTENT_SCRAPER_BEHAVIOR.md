# Persistent Scraper Behavior - Never Skip Pages!

## ✅ **NEW BEHAVIOR (What You Wanted):**

### **Core Rule:**
**Never skip a page. Only move to next day when we find the natural end (page with <100 contracts).**

---

## 📊 **How It Works Now:**

### **Example Scenario:**

```
Day: 2025-10-29

Page 1:  ❌ Fail → Cool 30s → Retry
Page 1:  ❌ Fail → Cool 1min → Retry
Page 1:  ❌ Fail → Cool 2min → Retry
Page 1:  ❌ Fail → Cool 4min → Retry
Page 1:  ✅ SUCCESS! → 100 contracts

Page 2:  ✅ SUCCESS! → 100 contracts

Page 3:  ❌ Fail → Cool 30s → Retry
Page 3:  ✅ SUCCESS! → 100 contracts

...keep going...

Page 11: ✅ SUCCESS! → 71 contracts ← FOUND END!

Result: Day complete! All data captured.
```

---

## 🔄 **Retry Strategy:**

### **Exponential Backoff:**

| Attempt | Cooldown | Cumulative Time |
|---------|----------|-----------------|
| 1 | 0s | 0s |
| 2 | 30s | 30s |
| 3 | 1min | 1m 30s |
| 4 | 2min | 3m 30s |
| 5 | 4min | 7m 30s |
| 6+ | 5min (max) | Adds 5min per attempt |
| 20 (final) | 5min | ~80 minutes total |

**Rationale:** 
- Start fast (30s) for quick API hiccups
- Scale up for sustained API issues
- Cap at 5min to avoid infinite waits
- 20 attempts = ~80 minutes per page (very persistent!)

---

## 🎯 **When Does It Move to Next Day?**

### **Only 2 Scenarios:**

1. **Natural End (GOOD):**
   ```
   Page 11: Found 71 contracts (< 100)
   → ✅ Day complete! Move to previous day.
   ```

2. **Complete API Failure (RARE):**
   ```
   Page 5: Failed 20 times over 80 minutes
   → ⚠️  API completely down. Move to previous day.
   ```

---

## 💾 **What About Individual Contract Failures?**

### **They're tracked separately:**

```
Page 5: 100 contracts found
  - 95 contracts: ✅ Downloaded successfully
  - 3 contracts: ❌ 500 errors
  - 2 contracts: ❌ Timeouts

Result:
✅ Page succeeds (95 contracts saved)
⚠️ 5 failures logged to fpds_failed_contracts
💾 Move to next page
```

**These individual failures are retried later with:**
- `fpds-retry-failed.ts` script
- Or manually via SQL queries

---

## 🚨 **What Changed From Before:**

### **OLD Behavior (BAD):**
```
Page 1 fails 3x → Skip to Page 2 ❌
Page 2 fails 3x → Skip to Page 3 ❌
Page 3 fails 3x → Give up, next day ❌

Result: Lost ~300 contracts per day!
```

### **NEW Behavior (GOOD):**
```
Page 1 fails → Retry with backoff (up to 20x)
Page 1 succeeds → Move to Page 2
Page 2 fails → Retry with backoff (up to 20x)
Page 2 succeeds → Move to Page 3
...
Page 11 has 71 contracts → Day complete!

Result: Captured ALL data for the day!
```

---

## 📈 **Expected Outcomes:**

### **Scenario 1: API is flaky (common)**
```
Some pages fail once or twice, then succeed
→ ✅ All data captured
→ ⏱️ Takes slightly longer (extra cooldowns)
→ 💾 100% data coverage
```

### **Scenario 2: API has sustained issues**
```
Pages take 5-10 retries each
→ ✅ Still captures data eventually
→ ⏱️ Takes much longer
→ 💾 Still 100% data coverage
```

### **Scenario 3: API is completely down**
```
Page fails all 20 attempts (80 minutes)
→ ⚠️ Gives up on that day
→ ⏱️ Moves to next day
→ 📋 Failed page logged for later retry
```

---

## 🔍 **Monitoring:**

### **Watch for these patterns:**

**GOOD:**
```
[2025-10-29:P5] ✅ SUCCESS → 100 contracts
[2025-10-29:P6] ❌ Fail → Retry
[2025-10-29:P6] ✅ SUCCESS → 100 contracts
[2025-10-29:P7] ✅ SUCCESS → 71 contracts ← END
```

**ACCEPTABLE:**
```
[2025-10-29:P3] ❌ Fail → Cool 30s → Retry
[2025-10-29:P3] ❌ Fail → Cool 1min → Retry
[2025-10-29:P3] ✅ SUCCESS → 100 contracts
```

**BAD (Rare):**
```
[2025-10-29:P1] ❌ Attempt 18/20
[2025-10-29:P1] ❌ Attempt 19/20
[2025-10-29:P1] ❌ Attempt 20/20
[2025-10-29:P1] ❌ Page failed after 20 attempts
→ API is completely down, try again later
```

---

## 🎯 **Benefits:**

| Feature | OLD | NEW |
|---------|-----|-----|
| **Skip pages?** | ❌ Yes (after 3 fails) | ✅ No! Retry up to 20x |
| **Exponential backoff?** | ❌ No (fixed 30s) | ✅ Yes (30s → 5min) |
| **Natural end detection?** | ❌ No | ✅ Yes (<100 contracts) |
| **Data loss?** | ❌ High | ✅ Minimal |
| **Resilience?** | ⚠️ Low | ✅ Very High |

---

## 🔄 **When to Restart:**

The new code is already deployed. To use it:

### **Option 1: Let Current Scraper Finish**
- It will complete its current run with old logic
- Next restart will use new logic

### **Option 2: Restart Now**
```bash
# In tmux
Ctrl+C

# Restart with new logic
./run-fpds-page-level.sh

# Detach
Ctrl+b then d
```

---

## 📋 **Summary:**

✅ **Never skips pages** - Retries up to 20x with exponential backoff  
✅ **Finds natural end** - Only moves to next day when page has <100 contracts  
✅ **Persistent** - Waits up to 80 minutes per page if needed  
✅ **Smart cooldowns** - 30s → 1min → 2min → 4min → 5min (max)  
✅ **Tracks failures** - Individual contract errors logged separately  

**Bottom Line:** The scraper will now fight much harder to get complete data before giving up! 🚀

