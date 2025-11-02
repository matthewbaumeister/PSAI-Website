# DoD Contract News - Quality Scoring & Outlier Detection

## Overview

The DoD contract news scraper implements **smart quality scoring** that:
- **Tracks ALL data** - Nothing is discarded
- **Flags outliers** for manual review
- **Scores quality** (0-100) based on completeness
- **Normalizes data** for professional analysis
- **Maintains audit trail** of all reviews

---

## Quality Scoring System

### Score Breakdown (0-100 points)

| Category | Max Points | Details |
|----------|-----------|---------|
| **Vendor Information** | 30 | Company name (10), City (10), State (10) |
| **Contract Information** | 30 | Contract number (15), Award amount (15) |
| **Service Branch** | 10 | Navy, Air Force, Army, etc. |
| **Parsing Confidence** | 10 | NLP extraction accuracy |
| **Base Score** | 50 | Starting point for all contracts |

### Quality Tiers

- **90-100**: Excellent - Complete data, ready for analysis
- **80-89**: Good - Minor missing fields
- **70-79**: Fair - Some missing information
- **60-69**: Low - Multiple missing fields
- **0-59**: Poor - Auto-flagged for review

---

## Outlier Detection

### Types of Outliers

#### 1. **Extreme High Value**
- **Trigger**: Award amount > 99th percentile
- **Action**: Flagged for review
- **Reason**: "Award amount in top 1% - verify accuracy"
- **Example**: $10B+ contracts

#### 2. **Suspiciously Low**
- **Trigger**: Amount < $10,000 for major contractors
- **Major Contractors**: Lockheed Martin, Boeing, Raytheon, Northrop Grumman, General Dynamics
- **Action**: Flagged for review
- **Reason**: "Low amount for major contractor - verify unit"
- **Example**: $5,000 Lockheed Martin contract (likely missing "million")

#### 3. **Missing Critical Info**
- **Trigger**: Missing vendor location + amount > median
- **Action**: Flagged for review
- **Reason**: "Missing vendor location - manual lookup needed"

---

## Review Workflow

### Auto-Flagging Rules

Contracts are **automatically flagged** for review if:
1. Quality score < 60
2. Extreme high value (>99th percentile)
3. Suspiciously low for major contractor
4. Missing vendor location for high-value contracts

### Review Process

```sql
-- View all contracts needing review
SELECT * FROM dod_contracts_needing_review;

-- Mark a contract as reviewed
SELECT mark_dod_contract_reviewed(
  'N00024-25-D-0150',  -- contract_number
  'john.doe',           -- reviewed_by
  'Verified amount is correct' -- optional notes
);
```

### Review Reasons

Each flagged contract includes an array of reasons:
```json
[
  "Award amount in top 1% - verify accuracy",
  "Low quality score - missing key fields"
]
```

---

## Views for Analysis

### 1. High-Quality Contracts
```sql
SELECT * FROM dod_contracts_high_quality;
```
- Score >= 80
- No review needed
- Ready for analysis

### 2. Contracts Needing Review
```sql
SELECT * FROM dod_contracts_needing_review;
```
- Sorted by outlier status
- Includes review reasons
- Shows quality scores

### 3. Outliers by Type
```sql
SELECT * FROM dod_outliers_by_type;
```
- Groups outliers by detection type
- Shows counts and amount statistics
- Average quality scores

### 4. Quality Distribution
```sql
SELECT * FROM dod_quality_distribution;
```
- Contract counts by quality tier
- Average award amounts
- Review counts

---

## Quality Fields Reference

| Field | Type | Description |
|-------|------|-------------|
| `data_quality_score` | INTEGER | 0-100 score based on completeness |
| `quality_flags` | JSONB | Array of quality issues detected |
| `needs_review` | BOOLEAN | TRUE if manual review required |
| `review_reasons` | TEXT[] | Why review is needed |
| `is_outlier` | BOOLEAN | TRUE if statistical outlier |
| `outlier_type` | TEXT | Type of outlier detected |
| `amount_percentile` | NUMERIC | Percentile rank (95, 99) |
| `has_complete_vendor_info` | BOOLEAN | Name, city, state all present |
| `has_complete_contract_info` | BOOLEAN | Number, amount, branch all present |
| `data_normalized_at` | TIMESTAMP | When quality checks ran |
| `reviewed_at` | TIMESTAMP | When manually reviewed |
| `reviewed_by` | TEXT | Who reviewed it |

---

## Example Queries

### Find All $1B+ Contracts
```sql
SELECT 
  vendor_name,
  award_amount_text,
  service_branch,
  data_quality_score,
  is_outlier
FROM dod_contract_news
WHERE award_amount >= 1000000000
ORDER BY award_amount DESC;
```

### Find Incomplete High-Value Contracts
```sql
SELECT 
  contract_number,
  vendor_name,
  award_amount_text,
  data_quality_score,
  review_reasons
FROM dod_contracts_needing_review
WHERE award_amount > 100000000
  AND NOT has_complete_vendor_info;
```

### Quality Summary
```sql
SELECT 
  COUNT(*) as total_contracts,
  AVG(data_quality_score) as avg_quality,
  COUNT(*) FILTER (WHERE needs_review) as flagged_count,
  COUNT(*) FILTER (WHERE is_outlier) as outlier_count,
  COUNT(*) FILTER (WHERE has_complete_vendor_info) as complete_vendor_info,
  COUNT(*) FILTER (WHERE has_complete_contract_info) as complete_contract_info
FROM dod_contract_news;
```

---

## Best Practices

### 1. Review Outliers First
- Start with extreme high values
- Check major contractors with low amounts
- Verify missing critical information

### 2. Batch Reviews
- Filter by service branch
- Group by contractor
- Sort by award amount

### 3. Maintain Audit Trail
- Always use `mark_dod_contract_reviewed()` function
- Include notes on corrections
- Track who reviewed what

### 4. Re-run Quality Checks
```sql
SELECT detect_dod_outliers();
```
- Run after manual data corrections
- Updates percentiles
- Refreshes review flags

---

## Integration with FPDS Data

DoD news contracts can be cross-referenced with FPDS:

```sql
SELECT 
  d.contract_number,
  d.vendor_name as dod_vendor,
  f.recipient_name as fpds_vendor,
  d.award_amount as dod_amount,
  f.total_obligated_amount as fpds_amount,
  d.data_quality_score,
  f.data_quality_score as fpds_score
FROM dod_contract_news d
LEFT JOIN fpds_contracts f 
  ON d.contract_number = f.piid
WHERE d.data_quality_score >= 80;
```

---

## Monitoring Dashboard Queries

### Daily Quality Metrics
```sql
SELECT 
  DATE(published_date) as date,
  COUNT(*) as contracts_scraped,
  AVG(data_quality_score) as avg_quality,
  COUNT(*) FILTER (WHERE needs_review) as flagged
FROM dod_contract_news
WHERE published_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(published_date)
ORDER BY date DESC;
```

### Top Vendors by Quality
```sql
SELECT 
  vendor_name,
  COUNT(*) as contract_count,
  AVG(data_quality_score) as avg_quality,
  SUM(award_amount) as total_value
FROM dod_contract_news
WHERE vendor_name != 'Unknown Vendor'
GROUP BY vendor_name
HAVING COUNT(*) >= 5
ORDER BY avg_quality DESC
LIMIT 20;
```

---

## Philosophy

> **Track everything. Discard nothing. Flag intelligently.**

This system ensures:
- ✅ **Complete Data Capture** - All contracts saved, even imperfect ones
- ✅ **Smart Review** - Only flag what truly needs human attention
- ✅ **Transparent Quality** - Clear scores and reasons
- ✅ **Professional Normalization** - Clean, consistent data
- ✅ **Audit Trail** - Full history of all reviews and corrections

