# 📋 SQL Query Guidelines for PropShop AI

## 🎯 Core Principle: ONE QUERY, ONE OUTPUT

**Always combine multiple checks into a single SQL query with unified output.**

---

## ✅ Good Example: Unified Query

```sql
WITH summary AS (
  SELECT 'Contracts' as metric, COUNT(*) as value FROM dod_contract_news
  UNION ALL
  SELECT 'Team Members', COUNT(*) FROM dod_contract_team_members
),
details AS (
  SELECT company_name, team_role FROM dod_contract_team_members
)
SELECT * FROM summary
UNION ALL
SELECT '---', '---'
UNION ALL
SELECT * FROM details;
```

**Result:** One table with all information ✅

---

## ❌ Bad Example: Multiple Queries

```sql
-- Check 1
SELECT COUNT(*) FROM dod_contract_news;

-- Check 2  
SELECT COUNT(*) FROM dod_contract_team_members;

-- Check 3
SELECT * FROM team_details;
```

**Result:** Three separate result tables ❌

---

## 🛠️ Techniques to Combine Queries

### **1. Use UNION ALL**
```sql
SELECT 'Summary' as section, metric, value FROM summary_data
UNION ALL
SELECT 'Details' as section, metric, value FROM detail_data
UNION ALL
SELECT 'Validation' as section, metric, value FROM validation_data;
```

### **2. Use CTEs (WITH clauses)**
```sql
WITH 
  data1 AS (SELECT ...),
  data2 AS (SELECT ...),
  data3 AS (SELECT ...)
SELECT * FROM data1
UNION ALL SELECT * FROM data2
UNION ALL SELECT * FROM data3;
```

### **3. Add Section Headers**
```sql
SELECT 'SUMMARY' as section, metric, value FROM ...
UNION ALL
SELECT '===========' as section, '===========' as metric, '===========' as value
UNION ALL
SELECT 'DETAILS' as section, metric, value FROM ...;
```

### **4. Use JSON for Complex Data**
```sql
SELECT 
  'Complete Report' as report_type,
  json_build_object(
    'summary', (SELECT json_agg(row_to_json(s)) FROM summary s),
    'details', (SELECT json_agg(row_to_json(d)) FROM details d),
    'validation', (SELECT json_agg(row_to_json(v)) FROM validation v)
  ) as data;
```

---

## 📊 Standard Query Structure

```sql
-- =====================================================
-- [QUERY PURPOSE]
-- Single unified output
-- =====================================================

WITH 
  -- Step 1: Gather summary stats
  summary AS (
    SELECT 'Total Records' as metric, COUNT(*)::TEXT as value FROM table1
    UNION ALL
    SELECT 'Active Records', COUNT(*)::TEXT FROM table1 WHERE active = true
  ),
  
  -- Step 2: Gather details
  details AS (
    SELECT 
      'Detail: ' || name as metric,
      status as value
    FROM table1
    LIMIT 10
  ),
  
  -- Step 3: Validation
  validation AS (
    SELECT 
      '✅ System Status' as metric,
      CASE 
        WHEN COUNT(*) > 0 THEN 'Operational'
        ELSE 'No Data'
      END as value
    FROM table1
  )

-- Combine everything
SELECT section, metric, value
FROM (
  SELECT 'SUMMARY' as section, * FROM summary
  UNION ALL
  SELECT 'DETAILS' as section, * FROM details
  UNION ALL
  SELECT 'VALIDATION' as section, * FROM validation
) combined
ORDER BY 
  CASE section
    WHEN 'SUMMARY' THEN 1
    WHEN 'DETAILS' THEN 2
    WHEN 'VALIDATION' THEN 3
  END;
```

---

## 🎯 Benefits

1. ✅ **Single Result Table** - Easy to review in Supabase SQL Editor
2. ✅ **No Multiple Tabs** - All data in one place
3. ✅ **Clear Organization** - Sections separate different data types
4. ✅ **Easy Copy/Paste** - One query to share
5. ✅ **Faster Execution** - Run once instead of multiple times

---

## 📝 Exceptions (When Multiple Queries Are OK)

### **Only use separate queries when:**

1. **Mutation Operations**
   ```sql
   -- Separate: Updates must be distinct from selects
   UPDATE table1 SET field = value;
   SELECT * FROM table1 WHERE updated = true;
   ```

2. **DDL + Verification**
   ```sql
   -- Separate: Schema changes + verification
   CREATE TABLE new_table (...);
   SELECT * FROM information_schema.tables WHERE table_name = 'new_table';
   ```

3. **Performance Issues**
   - If combining queries causes timeout
   - If UNION ALL creates massive result set (>10k rows)

---

## 🚀 Migration Plan

### **Files to Update:**
- ✅ `VERIFY_ALL_IN_ONE.sql` - Already follows this pattern
- ⚠️ `CHECK_TEAM_DATA.sql` - Needs consolidation
- ⚠️ `DIAGNOSE_NOW.sql` - Needs consolidation
- ⚠️ `VERIFY_COMPLETE_TRACKING.sql` - Needs consolidation

### **Going Forward:**
All new SQL queries must follow the **ONE QUERY, ONE OUTPUT** principle.

---

## 📚 Examples in This Project

**Good Examples:**
- `VERIFY_ALL_IN_ONE.sql` - ✅ Perfect unified output
- `QUICK_CHECK.sql` - ✅ Single result table

**To Be Updated:**
- `CHECK_TEAM_DATA.sql` - Multiple SELECT statements
- `FINAL_VALIDATION.sql` - Multiple queries

---

## 💡 Quick Template

```sql
-- =====================================================
-- [YOUR QUERY TITLE]
-- =====================================================

WITH data AS (
  -- Your logic here
  SELECT ...
)
SELECT 
  'Section Name' as section,
  metric,
  value,
  detail1,
  detail2
FROM data
ORDER BY sort_column;
```

---

**Remember: ONE QUERY, ONE TABLE, EASY REVIEW! 🎯**

