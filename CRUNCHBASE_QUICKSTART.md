# Crunchbase Integration - Quick Start Guide

## TL;DR - What You Need to Know

### What is Crunchbase?
Crunchbase is a platform that provides comprehensive data on companies, including:
- Funding rounds and investors
- Leadership team information
- Acquisitions and exits
- Company descriptions and industries
- Employee counts and growth metrics

### How Does it Work?
- **API-Based** (NOT web scraping)
- You make **real-time API calls** to get current company data
- Historical data (funding rounds, etc.) is included in each API response
- You **cache results** in your database and refresh periodically
- Rate-limited based on subscription tier

### How Will It Help PropShop AI?

**Current State**: You have contract winners' names, but no context about the company.

**With Crunchbase**: You'll see:
- "This $2M SBIR winner just raised $50M Series B from Andreessen Horowitz"
- "This contractor has In-Q-Tel (CIA's VC firm) as an investor"
- "This company was acquired by Lockheed Martin for $200M"
- Complete company profiles with technology focus, leadership, and growth trajectory

**Value for Users**:
- **Competitive intelligence**: Track which well-funded startups are entering gov contracting
- **Partnership opportunities**: Find companies at similar stage/tech focus for teaming
- **Due diligence**: Verify company legitimacy and financial health
- **Market trends**: Analyze correlation between VC funding and government contracts

## Immediate Next Steps

### Step 1: Get Pricing from Crunchbase (This Week)

**Action**: Contact Crunchbase Sales
- Email: sales@crunchbase.com
- Subject: "API Access for Government Contracting Intelligence Platform"

**What to Say**:
```
Hi Crunchbase Team,

We're building PropShop AI, a government contracting intelligence platform 
that aggregates SBIR/STTR opportunities, federal contracts (FPDS), and SAM.gov 
data for our users.

We want to enrich our company/contractor data with Crunchbase information 
(funding rounds, leadership, investors, etc.) to provide better due diligence 
and competitive intelligence to our users.

Use Case:
- ~10,000 unique companies in our database
- Need to enrich top 1,000 companies initially
- Ongoing enrichment for ~500 new companies/month
- Quarterly refresh for active companies

Estimated Usage:
- Initial: 2,000 API calls (1,000 companies x 2 calls each)
- Ongoing: ~1,000 calls/month for new companies
- Refresh: ~2,000 calls/quarter for updates

Could you provide:
1. Pricing for Enterprise API access
2. Rate limits and features at each tier
3. Recommended tier for our use case
4. Contract terms and setup timeline

Looking forward to hearing from you!
```

**Expected Timeline**: 1-2 weeks for quote and contract negotiation

**Budget**: Plan for $5,000-$10,000/month subscription + setup

### Step 2: Set Up Database (Now - While Waiting for API Access)

**Run the migration**:

```bash
# Connect to your Supabase database
# Option 1: Via Supabase Dashboard
# - Go to SQL Editor
# - Copy contents of: supabase/migrations/create_crunchbase_integration.sql
# - Run the migration

# Option 2: Via CLI (if you have Supabase CLI)
supabase db push
```

**What this creates**:
- 6 new tables for Crunchbase data
- Foreign keys linking to your existing tables (fpds_company_stats, sam_gov_opportunities, etc.)
- Indexes for fast queries
- Views for common analytics

### Step 3: Prepare Your Environment (1 Hour)

Once you have the API key from Crunchbase:

**Add to `.env.local`**:
```bash
CRUNCHBASE_API_KEY=your_api_key_here
CRUNCHBASE_API_BASE_URL=https://api.crunchbase.com/api/v4
CRUNCHBASE_RATE_LIMIT_PER_MINUTE=200
```

### Step 4: Identify Top Companies to Enrich (1 Day)

**SQL Query to Find Top 1,000 Companies**:

```sql
-- Top companies by total contract value
INSERT INTO crunchbase_enrichment_queue (company_name, vendor_uei, vendor_duns, source_table, priority, priority_reason)
SELECT 
  company_name,
  vendor_uei,
  vendor_duns,
  'fpds_company_stats' as source_table,
  CASE 
    WHEN total_value > 10000000 THEN 10
    WHEN total_value > 1000000 THEN 8
    WHEN total_value > 100000 THEN 6
    ELSE 5
  END as priority,
  CONCAT('Total contract value: $', ROUND(total_value::numeric, 0)) as priority_reason
FROM fpds_company_stats
WHERE company_name IS NOT NULL
  AND total_contracts > 0
  AND NOT EXISTS (
    SELECT 1 FROM crunchbase_companies cc 
    WHERE cc.company_name = fpds_company_stats.company_name
  )
ORDER BY total_value DESC
LIMIT 1000;
```

**Expected Result**: Queue populated with 1,000 companies ready for enrichment

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2) - WHILE WAITING FOR API ACCESS

**Goal**: Set up database and prepare infrastructure

Tasks:
- [x] Database migration completed
- [x] TypeScript types created
- [ ] Create placeholder API client with mock data
- [ ] Build queue management UI (admin dashboard)
- [ ] Design company profile page layout

**Why Do This Now**: 
- You can build everything except actual API calls
- Test the UI/UX with mock data
- Be ready to go live as soon as API key arrives

### Phase 2: API Integration (Weeks 3-4) - AFTER API KEY RECEIVED

**Goal**: Connect to Crunchbase API and start enriching

Files to Create:
```
src/lib/crunchbase/
  ├── api-client.ts              # Main API wrapper
  ├── rate-limiter.ts            # Rate limit management
  ├── company-matcher.ts         # Fuzzy matching logic
  ├── enrichment-queue.ts        # Queue processor
  └── index.ts                   # Exports
```

**Start Small**: 
- Test with 10 companies first
- Verify data quality
- Refine matching algorithm
- Then scale to 1,000 companies

### Phase 3: Automation (Weeks 5-6)

**Goal**: Automated enrichment for new companies

Create cron job:
```typescript
// cron/process-crunchbase-queue.ts
// Runs daily at 2 AM
export async function handler() {
  const queue = await getEnrichmentQueue({ status: 'pending', limit: 100 });
  
  for (const item of queue) {
    await enrichCompany(item);
  }
}
```

Set up in Vercel/your hosting:
```
0 2 * * * node cron/process-crunchbase-queue.js
```

### Phase 4: User Interface (Weeks 7-8)

**Goal**: Display Crunchbase data to users

**Enhanced Company Profile Page**:
```tsx
// app/companies/[id]/page.tsx
<CompanyProfile>
  <CompanyBasicInfo />
  
  {crunchbaseData && (
    <>
      <FundingTimeline rounds={crunchbaseData.funding_rounds} />
      <LeadershipTeam people={crunchbaseData.key_people} />
      <InvestorList investors={crunchbaseData.investors} />
      <CompanyMetrics 
        founded={crunchbaseData.founded_date}
        employees={crunchbaseData.employee_count}
        valuation={crunchbaseData.valuation}
      />
    </>
  )}
  
  <CrunchbaseAttribution />
</CompanyProfile>
```

**Key UI Components**:
- Funding timeline visualization (Chart.js or Recharts)
- Leadership cards with LinkedIn links
- Investor badges (highlight strategic investors like In-Q-Tel)
- Company description and tech focus

## Cost Management Strategy

### Optimize API Usage

**Smart Prioritization**:
```typescript
// Only enrich high-value targets
function shouldEnrich(company: Company): boolean {
  return (
    company.totalContracts > 5 ||
    company.totalContractValue > 500000 ||
    company.mostRecentContract > thirtyDaysAgo() ||
    company.isSBIRWinner ||
    company.isXtechParticipant
  );
}
```

**Caching Strategy**:
- Cache all Crunchbase responses in your database
- Refresh quarterly for active companies
- Refresh annually for inactive companies
- Manual refresh on user request (if they're a premium user)

**Estimated Costs**:
| Scenario | API Calls/Month | Cost/Month |
|----------|-----------------|------------|
| **Initial Setup** | 2,000 (one-time) | Included in subscription |
| **Steady State** | 1,000-2,000 | Included in subscription |
| **With Quarterly Refresh** | 2,000-4,000 | Included in subscription |

## Data Quality & Matching

### Matching Challenges

**Problem**: Company names in government contracts don't always match Crunchbase
- Government: "ANDURIL INDUSTRIES INC"
- Crunchbase: "Anduril Industries"

**Solution**: Multi-step matching algorithm

```typescript
async function matchCompany(name: string): Promise<Match> {
  // 1. Exact match
  let results = await crunchbase.search(name);
  if (results.length === 1) return results[0];
  
  // 2. Normalized match (remove Inc, LLC, etc.)
  const normalized = normalizeName(name);
  results = await crunchbase.search(normalized);
  if (results.length === 1) return results[0];
  
  // 3. Fuzzy match with location verification
  results = await crunchbase.search(name, { fuzzy: true });
  const locationMatch = results.find(r => 
    r.city === companyCity && r.state === companyState
  );
  if (locationMatch) return locationMatch;
  
  // 4. Manual review needed
  return { status: 'needs_review', candidates: results };
}
```

### Quality Assurance

**Track Match Confidence**:
- 1.0 = Perfect match (exact name + domain match)
- 0.9 = Very confident (fuzzy name + location match)
- 0.8 = Confident (fuzzy name match only)
- 0.7 = Low confidence (needs manual review)
- 0.0 = No match found

**Manual Review Queue**:
- Companies with confidence < 0.8 go to admin review
- You or your team can verify/approve matches
- Build simple admin UI for this

## Compliance & Legal

### Crunchbase Attribution Requirements

**REQUIRED on every page showing Crunchbase data**:

```tsx
<div className="crunchbase-attribution">
  Data provided by{' '}
  <a 
    href="https://www.crunchbase.com" 
    target="_blank" 
    rel="noopener"
  >
    Crunchbase
  </a>
</div>
```

**Styling Example**:
```css
.crunchbase-attribution {
  font-size: 12px;
  color: #666;
  margin-top: 16px;
  padding: 8px;
  border-top: 1px solid #e0e0e0;
}

.crunchbase-attribution a {
  color: #0066cc;
  text-decoration: none;
}

.crunchbase-attribution a:hover {
  text-decoration: underline;
}
```

### What You CAN Do
- Use Crunchbase data in your internal application
- Show data to authenticated users
- Combine with your proprietary data (contracts, etc.)
- Cache data in your database

### What You CANNOT Do
- Redistribute Crunchbase data via API to third parties
- Build a competing database/directory
- Scrape the Crunchbase website
- Remove or hide attribution

## Success Metrics

### Track These KPIs

**Enrichment Coverage**:
- Target: 80% of top 1,000 companies enriched in first 3 months
- Track: `SELECT COUNT(*) FROM fpds_company_stats WHERE crunchbase_enriched = true`

**Match Accuracy**:
- Target: 95%+ correct matches
- Manual audit: Review 100 random matches monthly

**Data Quality**:
- Target: Average quality score > 70/100
- Track: `SELECT AVG(data_quality_score) FROM crunchbase_companies`

**User Engagement**:
- Track: Time spent on company profile pages (before vs after Crunchbase)
- Track: % of users viewing Crunchbase data sections
- Survey: User satisfaction with company intelligence features

**API Efficiency**:
- Target: < 3% failed API calls
- Target: < 2 API calls per company (search + fetch)
- Alert: Daily API usage approaching subscription limit

## Troubleshooting

### Common Issues

**Issue**: "Rate limit exceeded"
**Solution**: 
- Check daily usage: `SELECT COUNT(*) FROM crunchbase_api_usage WHERE DATE(called_at) = CURRENT_DATE`
- Slow down queue processor
- Increase time between batches

**Issue**: "Can't find company in Crunchbase"
**Solution**:
- Try different search terms (remove "Inc", "LLC")
- Search by domain instead of name
- Some small businesses may not be in Crunchbase (that's OK)
- Focus on VC-backed companies and larger contractors

**Issue**: "Wrong company matched"
**Solution**:
- Improve matching algorithm
- Add location verification
- Lower auto-match confidence threshold
- Increase manual review queue

**Issue**: "API costs too high"
**Solution**:
- Reduce refresh frequency
- Focus on high-value companies only
- Implement smarter caching
- Negotiate better pricing tier with Crunchbase

## Timeline Summary

| Week | Milestone | Status |
|------|-----------|--------|
| 1 | Contact Crunchbase Sales | TODO |
| 1 | Run database migration | READY |
| 2 | Receive API key & contract | Waiting on Crunchbase |
| 3 | Build API client | Ready to start |
| 4 | Test with 10 companies | Ready to start |
| 5 | Enrich top 1,000 companies | Ready to start |
| 6 | Build admin dashboard | Ready to start |
| 7-8 | Add to company profile pages | Ready to start |
| 9 | Launch to users | Ready to start |
| 10+ | Automation & optimization | Ongoing |

## ROI Analysis

### Investment
- **Subscription**: $5,000-$10,000/month
- **Development**: ~80 hours (2 weeks full-time)
- **Total Year 1**: $60,000-$120,000 + dev time

### Return
- **Competitive Advantage**: Unique feature no competitor offers
- **User Engagement**: 30-50% increase in time on site (estimated)
- **Premium Tier**: Enable $99-$299/month pricing (vs $49 basic)
- **User Acquisition**: Better conversion from free to paid (unique data = stickiness)

**Break-Even**: Need ~50-100 paid users at premium tier

## Next Actions (Priority Order)

1. **Today**: Contact Crunchbase sales for pricing quote
2. **Today**: Run database migration in staging environment
3. **This Week**: Design company profile page mockups
4. **This Week**: Build admin dashboard for monitoring queue
5. **Next Week**: Create API client with mock data (to test UI)
6. **After API Key**: Connect real API and test with 10 companies
7. **After Validation**: Scale to 1,000 companies
8. **After Enrichment**: Launch feature to users

## Questions?

**Technical Questions**:
- Database schema: See `supabase/migrations/create_crunchbase_integration.sql`
- Type definitions: See `src/types/crunchbase.ts`
- Full plan: See `CRUNCHBASE_INTEGRATION_PLAN.md`

**Business Questions**:
- Expected cost: $60K-$120K/year
- Expected value: Unique competitive advantage + premium pricing
- Timeline to launch: 8-10 weeks (including waiting for API access)

## Resources

- **Crunchbase API Docs**: https://data.crunchbase.com/docs
- **Crunchbase API Swagger**: https://app.swaggerhub.com/apis/Crunchbase/crunchbase-enterprise_api
- **Attribution Requirements**: https://data.crunchbase.com/docs/using-the-api
- **Sales Contact**: sales@crunchbase.com

---

**Ready to get started?** Contact Crunchbase sales today and run the database migration!

