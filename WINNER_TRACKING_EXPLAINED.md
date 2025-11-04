# How Winners/Finalists Are Linked to Competitions

## Database Structure

### Tables
1. **`army_innovation_opportunities`** - The competitions (44 rows)
   - Contains: title, dates, prize pool, phases, etc.

2. **`army_innovation_submissions`** - The participants (720+ rows)
   - Contains: company_name, submission_status ('Winner' or 'Finalist')
   - **`opportunity_id`** - Links to the competition they participated in

### Linkage
Each winner/finalist has an `opportunity_id` that references the competition:

```sql
army_innovation_submissions.opportunity_id → army_innovation_opportunities.id
```

## How to Query

### See Winners with Competition Titles
```sql
SELECT 
  s.company_name,
  s.submission_status,
  s.award_amount as individual_award,
  o.opportunity_title as competition_won,
  o.total_prize_pool,
  o.competition_year,
  o.status
FROM army_innovation_submissions s
JOIN army_innovation_opportunities o ON s.opportunity_id = o.id
WHERE s.submission_status = 'Winner'
ORDER BY o.opportunity_title, s.company_name;
```

### After Running ADD_WINNER_VIEW.sql
You can use the convenient views:

```sql
-- All winners with full competition details
SELECT * FROM army_innovation_winners_with_details;

-- All finalists with full competition details
SELECT * FROM army_innovation_finalists_with_details;

-- Specific competition winners
SELECT company_name, competition_title, competition_total_prize
FROM army_innovation_winners_with_details
WHERE competition_title LIKE '%xTechSearch 8%';
```

## What Data Is Tracked

### Per Winner/Finalist
- ✅ Company name
- ✅ Company location (if available)
- ✅ Submission status ('Winner' or 'Finalist')
- ✅ Phase (which phase they won/were finalist in)
- ✅ Individual award_amount (if stated on page - RARE)
- ✅ Description/abstract (if available)

### Per Competition (via JOIN)
- ✅ Competition title (e.g., "xTechSearch 8")
- ✅ Competition year
- ✅ Total prize pool for the competition
- ✅ Max award amount
- ✅ Number of total awards
- ✅ Competition dates (open, close, award)
- ✅ Competition status (Open/Closed)
- ✅ Competition URL
- ✅ All phases
- ✅ Description and eligibility

## Important Notes

### Individual Award Amounts
Most XTECH competitions don't publish individual award amounts per company. They only show:
- Total prize pool (e.g., $3.2M)
- Max award (e.g., $350K each)
- Number of awards (e.g., 5 winners)

So `award_amount` in submissions table will be NULL for most winners unless the page specifically states "Company X won $250,000".

### How to Estimate Individual Awards
```sql
SELECT 
  company_name,
  competition_title,
  award_amount as stated_award,
  -- If no individual amount, estimate from competition max
  COALESCE(
    award_amount,
    max_award_amount
  ) as estimated_award
FROM army_innovation_winners_with_details;
```

## Example Data

### Winner Record
```
company_name: "Aegis Power Systems"
opportunity_id: 4 
submission_status: "Winner"
award_amount: NULL (not stated on page)
```

### Linked Competition (opportunity_id: 4)
```
id: 4
opportunity_title: "xTechEnergy Resiliency"
total_prize_pool: $12,000
max_award_amount: $10,000
number_of_awards: 25
```

### Joined Result
```
Company: Aegis Power Systems
Won: xTechEnergy Resiliency
Total Pool: $12,000
Max Award: $10,000
Estimated Award: $10,000 (from max_award_amount)
```

## Steps to Re-Scrape Without Dates

1. **Clear bad data:**
```sql
DELETE FROM army_innovation_submissions;
```

2. **Re-scrape (now with improved date filtering):**
```bash
npm run scrape:army-innovation:historical
```

3. **Add views for easy querying:**
```sql
-- Run contents of ADD_WINNER_VIEW.sql
```

4. **Query winners:**
```sql
SELECT * FROM army_innovation_winners_with_details 
ORDER BY competition_title, company_name;
```

All winners/finalists will be properly linked to their competitions via `opportunity_id`!

