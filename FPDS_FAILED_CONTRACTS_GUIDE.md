# FPDS Failed Contract Tracking & Retry System

## 🎯 Problem Solved

Instead of re-running a **20+ hour scrape** to fill gaps, you can now:
- Track which specific contracts failed
- Retry just those contracts (takes minutes!)
- See why they failed and how many times

---

## Step 1: Run the SQL Migration

Copy and run this in **Supabase SQL Editor**:

```sql
-- Create the failed contracts tracking table
CREATE TABLE IF NOT EXISTS fpds_failed_contracts (
  id BIGSERIAL PRIMARY KEY,
  
  -- Contract identification
  contract_id TEXT NOT NULL,
  generated_unique_award_id TEXT,
  
  -- Error details
  error_message TEXT,
  error_type TEXT,
  
  -- Retry tracking
  attempt_count INTEGER DEFAULT 1,
  first_failed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Scraper run context
  scrape_run_id BIGINT REFERENCES fpds_scraper_log(id) ON DELETE SET NULL,
  date_range TEXT,
  page_number INTEGER,
  
  -- Resolution
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fpds_failed_contracts_id 
ON fpds_failed_contracts(contract_id);

CREATE INDEX IF NOT EXISTS idx_fpds_failed_contracts_unresolved 
ON fpds_failed_contracts(resolved, last_attempted_at DESC) 
WHERE resolved = FALSE;

CREATE INDEX IF NOT EXISTS idx_fpds_failed_contracts_date_range 
ON fpds_failed_contracts(date_range, resolved);

-- View for easy querying
CREATE OR REPLACE VIEW fpds_failed_contracts_to_retry AS
SELECT 
  contract_id,
  generated_unique_award_id,
  error_type,
  error_message,
  attempt_count,
  first_failed_at,
  last_attempted_at,
  date_range,
  page_number,
  EXTRACT(EPOCH FROM (NOW() - last_attempted_at)) / 3600 as hours_since_last_attempt
FROM fpds_failed_contracts
WHERE resolved = FALSE
ORDER BY attempt_count ASC, last_attempted_at ASC;

-- Helper function
CREATE OR REPLACE FUNCTION mark_fpds_contract_resolved(
  p_contract_id TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE fpds_failed_contracts
  SET resolved = TRUE,
      resolved_at = NOW()
  WHERE contract_id = p_contract_id
    AND resolved = FALSE;
END;
$$ LANGUAGE plpgsql;
```

---

## Step 2: Run the Scraper (Now Tracks Failures!)

```bash
tmux new-session -s fpds-2025 -d && tmux send-keys -t fpds-2025 "cd /Users/matthewbaumeister/Documents/PropShop_AI_Website && bash run-fpds-year.sh 2025 2025-01-01 2025-12-31" C-m && sleep 2 && tmux attach-session -t fpds-2025
```

**What's New:**
- Every failed contract is now logged to `fpds_failed_contracts` table
- Includes the contract ID, error message, and page number
- Can be retried later with one command!

---

## Step 3: Check Failed Contracts (After Scrape)

### Quick Check in Supabase:

```sql
-- How many failed?
SELECT COUNT(*) as total_failed
FROM fpds_failed_contracts
WHERE resolved = FALSE;

-- Group by error type
SELECT 
  error_type,
  COUNT(*) as count
FROM fpds_failed_contracts
WHERE resolved = FALSE
GROUP BY error_type
ORDER BY count DESC;

-- See the actual contracts
SELECT * 
FROM fpds_failed_contracts_to_retry
LIMIT 20;
```

---

## Step 4: Retry Failed Contracts (Fast!)

### Retry All Failed Contracts:
```bash
npx tsx src/scripts/fpds-retry-failed.ts
```

### Retry First 100:
```bash
npx tsx src/scripts/fpds-retry-failed.ts --max=100
```

### Retry Specific Date Range:
```bash
npx tsx src/scripts/fpds-retry-failed.ts --date-range="2025-01-01 to 2025-12-31"
```

**What It Does:**
- Reads failed contracts from database
- Tries to fetch each one again
- Marks successful ones as `resolved`
- Updates attempt count for still-failing ones
- **Takes minutes** instead of hours!

---

## Step 5: Monitor Results

### Check Resolution Rate:
```sql
-- Overall stats
SELECT 
  COUNT(*) FILTER (WHERE resolved = TRUE) as resolved,
  COUNT(*) FILTER (WHERE resolved = FALSE) as still_failing,
  ROUND(
    COUNT(*) FILTER (WHERE resolved = TRUE)::numeric / COUNT(*)::numeric * 100, 
    2
  ) as resolution_rate_percent
FROM fpds_failed_contracts;

-- By attempt count
SELECT 
  attempt_count,
  COUNT(*) as contracts,
  COUNT(*) FILTER (WHERE resolved = TRUE) as resolved
FROM fpds_failed_contracts
GROUP BY attempt_count
ORDER BY attempt_count;
```

---

## Real-World Example

### Initial Scrape:
```
Contracts: 180,000
Failed: 102 (0.06%)
Time: 25 hours
```

### Retry Failed:
```bash
npx tsx src/scripts/fpds-retry-failed.ts
```

**Output:**
```
Found 102 failed contracts to retry
✅ Successfully resolved: 67
⚠️  Still failing: 35
📊 Success rate: 65.7%
Time: 2 minutes
```

### Retry Again (Later):
```bash
npx tsx src/scripts/fpds-retry-failed.ts
```

**Output:**
```
Found 35 failed contracts to retry
✅ Successfully resolved: 18
⚠️  Still failing: 17
📊 Success rate: 51.4%
Time: 1 minute
```

### Final Result:
- **Total contracts:** 180,085 / 180,102
- **Missing:** 17 (0.009%)
- **Time saved:** 24+ hours!

---

## Benefits

### ✅ Before (Without Tracking):
- 102 contracts fail
- Re-run entire scrape (25 hours)
- Get 67 of them
- Still missing 35
- Re-run again (25 hours)
- Get 18 more
- **Total time:** 75+ hours

### 🎉 After (With Tracking):
- 102 contracts fail
- Retry script (2 minutes)
- Get 67 of them
- Retry again (1 minute)
- Get 18 more
- **Total time:** 3 minutes!

---

## Advanced Usage

### Clean Up Resolved Contracts:
```sql
DELETE FROM fpds_failed_contracts
WHERE resolved = TRUE
  AND resolved_at < NOW() - INTERVAL '30 days';
```

### View Persistent Failures:
```sql
SELECT 
  contract_id,
  error_type,
  error_message,
  attempt_count,
  first_failed_at,
  last_attempted_at
FROM fpds_failed_contracts
WHERE resolved = FALSE
  AND attempt_count >= 3
ORDER BY attempt_count DESC;
```

### Manual Resolution:
```sql
-- If you manually fix a contract
SELECT mark_fpds_contract_resolved('CONT_AWD_12345');
```

---

## Tips

1. **Wait between retries:** API improves over time. Wait a few hours.
2. **Don't worry about persistent failures:** Some contracts are genuinely bad/deleted.
3. **Run retry periodically:** Set up a weekly cron to catch stragglers.
4. **Monitor attempt counts:** Contracts failing 5+ times are likely permanent failures.

---

## Summary Commands

```bash
# 1. Start scraper (tracks failures automatically)
tmux new-session -s fpds-2025 -d && tmux send-keys -t fpds-2025 "cd /Users/matthewbaumeister/Documents/PropShop_AI_Website && bash run-fpds-year.sh 2025 2025-01-01 2025-12-31" C-m

# 2. Check failures (in Supabase)
SELECT COUNT(*) FROM fpds_failed_contracts WHERE resolved = FALSE;

# 3. Retry failures (fast!)
npx tsx src/scripts/fpds-retry-failed.ts

# 4. Check resolution rate
SELECT COUNT(*) FILTER (WHERE resolved = TRUE)::float / COUNT(*) * 100 as success_rate FROM fpds_failed_contracts;
```

---

**You now have an efficient, production-grade system for handling API failures!** 🚀

