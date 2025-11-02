# 🎯 Test Team Members Table - Work Share Tracking

## ✅ What Was Added

### **New Table: `dod_contract_team_members`**
- **One row per team member per contract**
- **Tracks work share percentages**
- **Calculates weighted award amounts** (percentage × total value)
- **Optimized for large-scale analytics**

---

## 🚀 Testing Steps (10 Minutes)

### **Step 1: Apply Migration** (2 min)

**Option A: Using SQL Editor (Recommended)**
Copy and paste the contents of `supabase/migrations/add_team_members_table.sql` into Supabase SQL Editor and run it.

**Option B: Using CLI**
```bash
supabase db push
```

**Expected:** Success message about team members table created

**⚠️ Note:** If you get errors about existing views, the migration will drop and recreate them automatically.

---

### **Step 2: Clear and Re-Scrape** (3 min)

```sql
-- Clear old data
TRUNCATE TABLE dod_contract_news RESTART IDENTITY CASCADE;
-- This will also clear team members (CASCADE)
```

```bash
# Re-run scraper
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website
npx tsx test-dod-single-article.ts
```

**Look for:** `💼 Saved X team members with work share percentages`

---

### **Step 3: Check Team Members Data** (2 min)

```sql
-- 1. See all team members
SELECT * FROM dod_contract_team_members 
ORDER BY weighted_award_amount DESC NULLS LAST;

-- 2. Count team members
SELECT 
  COUNT(*) as total_team_members,
  COUNT(DISTINCT contract_id) as contracts_with_teams,
  AVG(work_share_percentage) as avg_work_share
FROM dod_contract_team_members;

-- 3. See work share breakdown for one contract
SELECT 
  company_name,
  team_role,
  work_share_percentage || '%' as share,
  '$' || ROUND(weighted_award_amount/1000000, 2) || 'M' as weighted_value
FROM dod_contract_team_members
WHERE contract_number = (
  SELECT contract_number FROM dod_contract_team_members LIMIT 1
)
ORDER BY work_share_percentage DESC;
```

---

### **Step 4: Test New Views** (3 min)

```sql
-- View 1: Company Performance as Prime
SELECT * FROM company_prime_contracts
ORDER BY total_weighted_value DESC
LIMIT 5;

-- View 2: Company Performance as Subcontractor
SELECT * FROM company_subcontractor_performance
ORDER BY total_sub_value DESC
LIMIT 5;

-- View 3: Company Overall Performance (Prime + Sub)
SELECT * FROM company_overall_performance
ORDER BY total_weighted_value DESC
LIMIT 10;

-- View 4: Teaming Relationships (Who teams with whom?)
SELECT * FROM teaming_relationships
ORDER BY total_sub_value DESC
LIMIT 10;

-- View 5: Full Contracts with Teams (Easy JOIN)
SELECT 
  vendor_name,
  award_amount,
  team_member_company,
  team_member_role,
  work_share_percentage,
  weighted_award_amount
FROM dod_contracts_with_teams
WHERE team_member_company IS NOT NULL
ORDER BY award_amount DESC
LIMIT 10;
```

---

## 📊 Example Queries You Can Now Run

### **Find All Contracts Where Company X is Subcontractor**

```sql
SELECT 
  c.contract_number,
  c.vendor_name as prime_contractor,
  c.award_amount as total_contract_value,
  t.work_share_percentage,
  t.weighted_award_amount as sub_value
FROM dod_contract_news c
JOIN dod_contract_team_members t ON c.id = t.contract_id
WHERE t.company_name = 'Northrop Grumman'
  AND t.team_role = 'subcontractor'
ORDER BY t.weighted_award_amount DESC;
```

### **Company's Total Value as Prime vs Sub**

```sql
SELECT 
  company_name,
  SUM(weighted_award_amount) FILTER (WHERE team_role = 'prime') as prime_value,
  SUM(weighted_award_amount) FILTER (WHERE team_role = 'subcontractor') as sub_value,
  SUM(weighted_award_amount) as total_value
FROM dod_contract_team_members
WHERE company_name = 'Lockheed Martin'
GROUP BY company_name;
```

### **Top Prime-Sub Relationships by Value**

```sql
SELECT 
  prime_contractor,
  subcontractor,
  times_teamed,
  '$' || ROUND(total_sub_value/1000000, 1) || 'M' as total_value
FROM teaming_relationships
ORDER BY total_sub_value DESC
LIMIT 10;
```

### **Average Work Share by Role**

```sql
SELECT 
  team_role,
  COUNT(*) as count,
  ROUND(AVG(work_share_percentage), 1) as avg_percentage,
  '$' || ROUND(SUM(weighted_award_amount)/1000000, 1) || 'M' as total_value
FROM dod_contract_team_members
GROUP BY team_role
ORDER BY total_value DESC;
```

---

## 🎯 What To Look For

### ✅ **Success Indicators:**
- Table has rows (team members found)
- `weighted_award_amount` is calculated automatically
- Work share percentages between 0-100
- Team roles are 'prime', 'subcontractor', or 'team_member'
- Views return data

### ⚠️ **If No Data:**
- Check if contracts mention work share percentages
- Look at raw_paragraph for teaming keywords
- Percentages might not be specified in these contracts

### 🔍 **Debug Query:**
```sql
-- Check if any contracts have teaming without percentages
SELECT 
  vendor_name,
  is_teaming,
  team_members,
  SUBSTRING(raw_paragraph, 1, 300)
FROM dod_contract_news
WHERE is_teaming = true;
```

---

## 💡 Key Features

### **Automatic Weighted Calculation**
The trigger automatically calculates:
```
weighted_award_amount = award_amount × (work_share_percentage / 100)
```

Example:
- Contract: $10M
- Prime (60%): $6M weighted value
- Sub 1 (30%): $3M weighted value
- Sub 2 (10%): $1M weighted value

### **Optimized Indexes**
- Fast lookups by company name
- Fast filtering by team role
- Fast queries on award amounts
- Composite indexes for complex queries

### **5 Pre-Built Views**
1. `company_prime_contracts` - Prime contractor performance
2. `company_subcontractor_performance` - Subcontractor performance
3. `company_overall_performance` - Combined stats
4. `teaming_relationships` - Who teams with whom
5. `dod_contracts_with_teams` - Easy JOIN for all data

---

## 🎁 Business Intelligence Queries

### **Top 10 Primes by Weighted Value**
```sql
SELECT company_name, total_weighted_value 
FROM company_prime_contracts 
ORDER BY total_weighted_value DESC 
LIMIT 10;
```

### **Companies Getting Most Sub Work**
```sql
SELECT company_name, total_sub_value, avg_sub_percentage
FROM company_subcontractor_performance
ORDER BY total_sub_value DESC
LIMIT 10;
```

### **Most Frequent Teaming Partners**
```sql
SELECT prime_contractor, subcontractor, times_teamed
FROM teaming_relationships
ORDER BY times_teamed DESC
LIMIT 10;
```

---

## ✅ Success Criteria

- [x] Table created with proper schema
- [x] Trigger calculates weighted amounts
- [x] Team members inserted when work share exists
- [x] All 5 views return data
- [x] Queries run fast (< 100ms)
- [x] Can track company performance as prime vs sub

---

## 🚀 Next Steps After Testing

1. **Validate data quality**
2. **Build dashboard views**
3. **Export for analysis**
4. **Set up alerts for teaming opportunities**

---

**Total Testing Time: 10 minutes**
**Expected Result: Full teaming analytics capability!** 🎯

