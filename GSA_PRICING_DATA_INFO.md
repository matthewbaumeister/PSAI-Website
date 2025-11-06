# GSA MAS Pricing Information

## Yes, Price Data IS Available!

The GSA eLibrary contractor Excel files **often contain pricing information**, but it varies by SIN type.

## What Pricing Data You'll Get

### Professional Services SINs (Most Common)
Files typically include **labor category pricing**:

**Typical Columns:**
- Labor Category (e.g., "Senior Software Engineer", "Project Manager Level III")
- Hourly Rate (e.g., $125.00/hour)
- Annual Rate (when applicable)
- Education Level
- Years of Experience Required
- Security Clearance Level

**Example from IT Professional Services (54151S):**
```
Labor Category                    | Hourly Rate | Education    | Experience
----------------------------------|-------------|--------------|------------
Senior Software Developer         | $145.50     | Bachelor's   | 7+ years
Project Manager III               | $165.00     | Bachelor's   | 10+ years
Cybersecurity Analyst II          | $125.75     | Bachelor's   | 5+ years
Business Analyst                  | $95.00      | Bachelor's   | 3+ years
```

### Product/Equipment SINs
Files may include:
- Product descriptions
- GSA Advantage pricing
- Volume discounts
- Delivery terms

### Consulting Services
- Service descriptions
- Rate structures
- Engagement types
- Pricing models (hourly, daily, project-based)

## Which SINs Have the Best Pricing Data?

**High-value SINs with detailed pricing:**

1. **IT Professional Services (54151S)** - Comprehensive labor categories with hourly rates
2. **Engineering Services (541330)** - Engineering labor categories and rates
3. **Management Consulting (541611)** - Consulting rates by expertise level
4. **R&D Services (541715)** - Research staff hourly rates
5. **Cybersecurity (541519ICAM)** - Security professional rates
6. **Training Services (611430)** - Per-student and instructor rates

## Data Structure in Excel Files

Most GSA contractor Excel files have **multiple sheets**:

**Sheet 1: Contractor Information**
- Company name, contact info
- Contract number, dates
- DUNS/UEI/CAGE
- Business certifications

**Sheet 2: Labor Categories/Pricing** (when available)
- Service/labor category names
- Hourly or annual rates
- Qualifications required
- Additional pricing notes

**Sheet 3: Service Descriptions** (sometimes)
- Detailed service offerings
- Capabilities
- Past performance areas

## Example: Real GSA File Contents

A typical IT Services contractor file might contain:

```
Company: Acme Technologies Inc.
Contract: GS-35F-12345H
DUNS: 123456789
Contract Period: 10/01/2020 - 09/30/2025

LABOR CATEGORIES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Labor Category                      Rate/Hr   Education    Exp
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Program Manager                     $185.00   Master's     12+
Senior Systems Engineer             $155.00   Bachelor's   10+
Systems Engineer                    $125.00   Bachelor's   7+
Software Developer III              $140.00   Bachelor's   8+
Software Developer II               $110.00   Bachelor's   5+
Junior Developer                    $85.00    Bachelor's   2+
Quality Assurance Analyst           $95.00    Bachelor's   4+
Technical Writer                    $75.00    Bachelor's   3+
Help Desk Technician Level II       $65.00    Associate's  3+
```

## How Our Parser Captures This

The updated `gsa-schedule-scraper.py` automatically extracts:

```python
# Pricing fields captured:
{
  "labor_category": "Senior Software Developer",
  "hourly_rate": 145.50,
  "yearly_rate": null,
  "description": "Develops enterprise software solutions",
  "education_required": "Bachelor's Degree",
  "experience_required": "7+ years",
  "security_clearance": "Secret"
}
```

**Plus ALL other columns** in the `additional_data` field, so nothing is missed!

## Important Notes

### ✓ What You WILL Get:
- Labor category pricing (for service-based SINs)
- Hourly/annual rates per position
- Qualification requirements
- Service descriptions
- Product pricing (for equipment SINs)

### ✗ What You WON'T Get:
- Actual contract award amounts (those come from FPDS)
- Negotiated discounts (those are contract-specific)
- Real-world pricing (GSA rates are ceiling prices)
- Historical pricing trends (only current rates)

## Using the Pricing Data

### After Import, You Can Query:

```sql
-- Find contractors with specific labor categories and rates
SELECT 
  company_name,
  contract_number,
  website,
  additional_data->>'labor_category' as role,
  additional_data->>'hourly_rate' as rate
FROM gsa_schedule_holders
WHERE sin_codes @> ARRAY['54151S']
  AND additional_data->>'labor_category' ILIKE '%Senior Software%'
ORDER BY (additional_data->>'hourly_rate')::numeric;

-- Average rates by SIN
SELECT 
  unnest(sin_codes) as sin,
  AVG((additional_data->>'hourly_rate')::numeric) as avg_rate,
  COUNT(*) as labor_categories
FROM gsa_schedule_holders
WHERE additional_data->>'hourly_rate' IS NOT NULL
GROUP BY sin
ORDER BY avg_rate DESC;

-- Find companies with competitive pricing
SELECT 
  company_name,
  contract_number,
  company_state,
  additional_data->>'hourly_rate' as rate
FROM gsa_schedule_holders
WHERE sin_codes @> ARRAY['54151S']
  AND (additional_data->>'hourly_rate')::numeric < 100
  AND small_business = true;
```

## Real-World Use Cases

1. **Market Research**: See what competitors charge for similar services
2. **Budgeting**: Estimate project costs based on GSA ceiling prices
3. **Vendor Selection**: Find contractors with specific skills at target rates
4. **Competitive Analysis**: Compare your rates to market
5. **Teaming**: Find partners with complementary pricing

## Bottom Line

**Yes, you get extensive pricing data!** The Excel files from GSA eLibrary contain:
- Detailed labor category pricing for services
- Product pricing for equipment
- Rate structures by experience/education
- All captured automatically by the parser

The pricing data is one of the most valuable parts of this dataset!

