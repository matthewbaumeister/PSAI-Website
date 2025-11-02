# Bidirectional Failure Tracking System

## ✅ **How It Works Now**

The page-level scraper has **bidirectional tracking** - it updates the `fpds_failed_contracts` table in BOTH directions:

---

## 📊 **The Complete Flow:**

### **Attempt 1: Initial Fetch**
```
Page 4: 100 contracts found
  Contract A: ✅ Success → inserted into fpds_contracts
  Contract B: ❌ Failed  → inserted into fpds_failed_contracts
  Contract C: ✅ Success → inserted into fpds_contracts
  Contract D: ❌ Failed  → inserted into fpds_failed_contracts
  Contract E: ❌ Failed  → inserted into fpds_failed_contracts
```

**Result:**
- `fpds_contracts`: 97 contracts
- `fpds_failed_contracts`: 3 contracts (B, D, E)

---

### **Attempt 2: Retry (30s cooldown)**
```
Page 4: Re-fetching same 100 contracts
  Contract A: ✅ Success (already in DB, UPSERT updates it)
  Contract B: ✅ Success (API worked this time!)
  Contract C: ✅ Success (already in DB, UPSERT updates it)
  Contract D: ❌ Still failed
  Contract E: ✅ Success (API worked this time!)
```

**Actions:**
1. Insert/Update successful contracts in `fpds_contracts`
2. **Clean up `fpds_failed_contracts`:**
   - Delete Contract B ✅ (now successful)
   - Keep Contract D ❌ (still failing)
   - Delete Contract E ✅ (now successful)

**Result:**
- `fpds_contracts`: 100 contracts (A, B, C, D, E all successful except D which was never inserted)
- `fpds_failed_contracts`: 1 contract (only D remains)

---

### **Attempt 3: Final Retry**
```
Page 4: Last chance for failed contracts
  Contract D: ✅ Success (API finally worked!)
```

**Actions:**
1. Insert Contract D into `fpds_contracts`
2. Delete Contract D from `fpds_failed_contracts`

**Final Result:**
- `fpds_contracts`: 100 contracts (complete!)
- `fpds_failed_contracts`: 0 contracts (all resolved!)

---

## 🎯 **Key Features:**

### **1. Tracks Attempt Count**
```typescript
attempt_count: attempt  // 1, 2, or 3
```

### **2. Auto-Cleanup on Success**
```typescript
// After fetching contracts
if (successfulIds.length > 0) {
  // Delete from failed_contracts table
  await supabase
    .from('fpds_failed_contracts')
    .delete()
    .in('contract_id', successfulIds)
    .eq('date_range', date)
    .eq('page_number', pageNum);
}
```

### **3. Handles Scraper Restarts**
If the scraper crashes and restarts:
- It resumes from the last completed page
- When it re-processes any page, it cleans up old failures that now succeed
- Works across scraper restarts, not just within-run retries

---

## 📊 **What You'll See in Logs:**

### **Attempt 1 (Initial):**
```
[2025-10-31:P4] ✅ Fetched 97/100 details
[2025-10-31:P4] ⚠️  Failed to fetch: 3 contracts (saved to retry log)
[2025-10-31:P4] 💾 New: 2 | Updated: 95 | DB Errors: 0
```

### **Attempt 2 (Retry):**
```
[2025-10-31:P4] 🔄 Retry attempt 2/3
[2025-10-31:P4] ⏸️  Cooling down API for 30s...
[2025-10-31:P4] ✅ Fetched 99/100 details
[2025-10-31:P4] 🧹 Cleaned 2 resolved failures from retry log  ← NEW!
[2025-10-31:P4] ⚠️  Failed to fetch: 1 contracts (saved to retry log)
[2025-10-31:P4] 💾 New: 1 | Updated: 98 | DB Errors: 0
```

### **Attempt 3 (Final Retry):**
```
[2025-10-31:P4] 🔄 Retry attempt 3/3
[2025-10-31:P4] ⏸️  Cooling down API for 30s...
[2025-10-31:P4] ✅ Fetched 100/100 details
[2025-10-31:P4] 🧹 Cleaned 1 resolved failures from retry log  ← NEW!
[2025-10-31:P4] 💾 New: 0 | Updated: 100 | DB Errors: 0
```

---

## 🔍 **Verify It's Working:**

### **Check Failed Contracts Table:**
```sql
-- Should only show contracts that truly failed ALL attempts
SELECT 
  contract_id,
  error_message,
  attempt_count,
  date_range,
  page_number,
  created_at
FROM fpds_failed_contracts
ORDER BY created_at DESC
LIMIT 20;
```

### **Check for Contracts in Both Tables (Should be ZERO):**
```sql
-- This should return EMPTY (no contracts in both tables)
SELECT 
  fc.contract_id,
  fc.date_range,
  fc.page_number,
  fc.created_at as failed_at,
  c.created_at as succeeded_at
FROM fpds_failed_contracts fc
INNER JOIN fpds_contracts c 
  ON fc.contract_id = c.transaction_number
ORDER BY fc.created_at DESC;

-- If this returns rows = cleanup failed (shouldn't happen!)
```

---

## 🎯 **Benefits:**

| Feature | Benefit |
|---------|---------|
| **Bidirectional** | Table stays clean - only shows REAL failures |
| **Accurate counts** | Know exactly how many contracts truly failed |
| **Cross-restart** | Works even if scraper crashes and resumes |
| **Attempt tracking** | See which attempt each failure occurred on |
| **Auto-cleanup** | No manual intervention needed |

---

## 📈 **Final Failed Contracts Table:**

After all retries, `fpds_failed_contracts` will ONLY contain:
- Contracts that failed on **ALL 3 attempts**
- Contracts from pages that were abandoned due to repeated page-level failures

Everything else is automatically cleaned up! ✅

---

## 🔄 **Manual Retry Later:**

If you want to retry the remaining failures:

```bash
# Retry all failed contracts in the log
npx tsx src/scripts/fpds-retry-failed.ts
```

This script will:
1. Read all contracts from `fpds_failed_contracts`
2. Attempt to fetch each one again
3. Update the log with success/failure
4. **Remove successfully fetched contracts from the log** (same cleanup logic!)

---

**Last Updated:** Nov 2, 2025  
**Status:** Fully implemented and deployed

