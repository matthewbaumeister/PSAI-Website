# Company Intelligence: Crunchbase vs Free Sources

## Quick Comparison

| Feature | Crunchbase | FREE Sources (SAM + SEC + OpenCorporates) |
|---------|-----------|-------------------------------------------|
| **Annual Cost** | $60,000-$120,000 | **$0** |
| **Public Companies** | Good | **Excellent** (SEC filings are superior) |
| **Private Companies** | Excellent | Basic (SAM.gov data) |
| **Funding Rounds** | Yes | No |
| **Investors** | Yes | Only for public (SEC) |
| **Financials** | Estimates | **Actual audited** (public companies) |
| **Employee Count** | Estimates | **Exact** (from SEC for public) |
| **Business Description** | Yes | **Better** (from 10-K filings) |
| **Government Revenue %** | No | **Yes** (from SEC for public) |
| **Contact Info** | Limited | **Excellent** (SAM.gov) |
| **Small Business Status** | No | **Yes** (SAM.gov certified) |
| **Setup Time** | 2-3 weeks | 1-2 weeks |
| **Coverage** | All companies | 100% of federal contractors |

## Who Gets What Data?

### For PUBLIC DoD Contractors (e.g., Lockheed, Raytheon, SAIC)

**Crunchbase Gives You**:
- Company description
- Recent news
- Funding history (if applicable)
- Employee estimate: ±20% accuracy
- Revenue estimate: ±30% accuracy
- Leadership team (basic)

**FREE Sources Give You**:
- **Exact revenue** from 10-K (legally required, audited)
- **Exact employee count** from 10-K
- **Government revenue percentage** (how much of their business is gov contracts)
- **Detailed business description** (full 10-K Item 1)
- **Risk factors** (Item 1A)
- **Management discussion** (MD&A)
- **Financial statements** (balance sheet, income statement, cash flow)
- **All SAM.gov data** (business structure, certifications, contact)
- **Stock price, market cap, P/E ratio** (Yahoo Finance)

**Winner for Public Companies**: FREE Sources (way better data, $0 cost)

---

### For PRIVATE Small Businesses (e.g., SBIR winners, small contractors)

**Crunchbase Gives You**:
- Company description
- Funding rounds (Series A, B, C, etc.)
- Investor list (VCs, angels)
- Valuation estimates
- Employee count estimate
- Recent acquisitions

**FREE Sources Give You**:
- **Complete SAM.gov registration** (legal name, address, contact, NAICS)
- **Small business certifications** (8(a), WOSB, VOSB, HUBZone)
- **Incorporation date** (OpenCorporates)
- **Company status** (Active, Dissolved)
- **Business structure** (LLC, Corp, etc.)
- **Contract history** (from FPDS - you already have this)
- Employee estimate: From SAM.gov if provided
- Revenue estimate: From SAM.gov if provided

**Winner for Private Companies**: Crunchbase (but only if VC-backed)

**For non-VC small businesses**: FREE sources are actually better (Crunchbase won't have them anyway)

---

## Your Situation: DoD Contractors

### Breakdown of DoD Contractor Universe

**Public Companies** (~500 total):
- Tier 1 Primes: Lockheed, Raytheon, Boeing, Northrop, General Dynamics (~10)
- Tier 2 Primes: SAIC, Booz Allen, ManTech, Parsons, Leidos (~50)
- Mid-Size Public: Various specialty contractors (~200)
- Small Public: Recently IPO'd defense tech (~240)

**Private Companies** (~50,000+):
- VC-Backed Defense Tech Startups (~1,000) ← Crunchbase shines here
- Small Business Contractors (~30,000) ← Not in Crunchbase
- Medium Private Contractors (~10,000) ← Not in Crunchbase
- Non-profits, Universities, etc. (~9,000) ← Not in Crunchbase

### Coverage Analysis

**FREE Sources Cover**:
- 100% of public companies (500) with EXCELLENT data
- 100% of all contractors (50,000+) with BASIC data
- **Total companies with good data: 500 (1%)**
- **Total companies with some data: 50,000+ (100%)**

**Crunchbase Covers**:
- 100% of public companies (500) with GOOD data
- ~10-20% of VC-backed startups (1,000-2,000) with EXCELLENT data
- 0% of small businesses (<1% maybe have profiles)
- **Total companies with good data: 1,500-2,500 (3-5%)**
- **Total companies with some data: 1,500-2,500 (3-5%)**

---

## Recommended Approach: Hybrid Strategy

### Phase 1: FREE Sources (Start Here - $0)

1. **SAM.gov Entity API** - Enrich ALL 50,000+ companies
   - Legal structure, certifications, contact info
   - Cost: $0
   - Coverage: 100%

2. **SEC EDGAR** - Enrich 500 public companies
   - Full financials, exact employee counts, business descriptions
   - Cost: $0
   - Coverage: 1% (but these are the biggest contractors!)

3. **OpenCorporates** - Add incorporation data for ALL
   - Company age, status, structure
   - Cost: $0 (free tier) or $14/month
   - Coverage: 80%+

**Result**: Excellent data for top contractors, basic data for all others

**Cost**: $0-$168/year

---

### Phase 2: Add Clearbit for High-Value Private Companies (Optional - $1,200/year)

If you want better data for private companies, add Clearbit ($99/month):

**Target**: Top 2,500 private contractors by contract value
- Must have website (Clearbit requires domain)
- Must have >$1M in total contracts
- Focus on VC-backed defense tech, frequent contractors

**What Clearbit Adds**:
- Employee count estimates
- Revenue estimates
- Better descriptions
- Tech stack information

**Cost**: $99-$249/month ($1,188-$2,988/year)

---

### Phase 3: Add Crunchbase ONLY if You Need VC Data (Optional - $60K/year)

**Only get Crunchbase if**:
- Your users care about VC funding (investors, analysts, competitors)
- You need investor intelligence (who funded what company)
- You want to track startups entering defense market
- Budget allows for $5,000-$10,000/month

**Best Use Case**: Market intelligence dashboard tracking VC investment in defense tech

**Not Worth It For**: Basic company profiles, due diligence on contractors

---

## Cost-Benefit Analysis

### Option A: FREE Only ($0/year)

**You Get**:
- Perfect data for 500 public companies (the biggest contractors)
- Basic data for 50,000+ all contractors
- Total coverage: 100% with something, 1% with great data

**You Miss**:
- VC funding information
- Investor lists
- Private company financials
- Recent acquisition news

**Best For**: Users who care about contract history and public company intel

**ROI**: Infinite (free!)

---

### Option B: FREE + Clearbit ($1,200-$3,000/year)

**You Get**:
- Perfect data for 500 public companies
- Good data for 2,500 top private contractors
- Basic data for 47,000+ other contractors
- Total coverage: 100% with something, 6% with great data

**You Miss**:
- VC funding information (still don't have this)
- Investor lists

**Best For**: Users who need company profiles and size estimates

**ROI**: High (only $100-$250/month for significant enhancement)

---

### Option C: FREE + Crunchbase ($60,000-$120,000/year)

**You Get**:
- Perfect data for 500 public companies
- Excellent data for 1,000-2,000 VC-backed companies
- Basic data for 48,000+ other contractors
- VC funding and investor intelligence

**You Miss**:
- Nothing major (best possible data)

**Best For**: VC firms, market researchers, competitive intelligence analysts

**ROI**: Questionable unless you can charge premium prices

---

## My Recommendation

### Start with FREE Sources (Option A)

**Why?**
1. Covers 100% of contractors with something
2. BETTER data than Crunchbase for public companies
3. Public companies = 80%+ of DoD contract dollars
4. $0 cost to test the approach
5. Can always add Clearbit or Crunchbase later

**Implementation**:
1. Week 1: Build SAM.gov enrichment (50,000 companies)
2. Week 2: Add SEC EDGAR parsing (500 public companies)
3. Week 3: Add OpenCorporates (all companies)
4. Week 4: Evaluate results, decide if need more

**Total Time**: 1 month
**Total Cost**: $0

### Upgrade to FREE + Clearbit Later (Option B)

**When?**
- After you validate free sources work
- If users request more detail on private companies
- When you have budget ($100-$250/month)

**Who Benefits**:
- Users analyzing mid-size private contractors
- Due diligence on SBIR winners
- Partnership/teaming research

---

## Example Company Profiles

### Example 1: Lockheed Martin (Public Company)

**FREE Sources Give You**:
```
Company: Lockheed Martin Corporation
Stock: LMT (NYSE)
Market Cap: $126.4 Billion

Financials (from 10-K):
- Revenue: $67.6B (2023)
- Net Income: $6.9B
- Employees: 122,000
- Gov Revenue: ~90% of total

Business Description (from 10-K):
"We are a global security and aerospace company principally 
engaged in research, design, development, manufacture, 
integration and sustainment of advanced technology systems, 
products and services..."

SAM.gov Data:
- UEI: XXXXXXXXXXXX
- CAGE: XXXXX
- Active Registration: Yes
- Primary NAICS: 336411 (Aircraft Manufacturing)

OpenCorporates:
- Incorporated: 1995 (Maryland)
- Type: Corporation
- Status: Active
```

**Crunchbase Gives You**:
```
Company: Lockheed Martin
Employees: 100,000-250,000 (estimate)
Revenue: $50B-$100B (estimate)
Description: "Aerospace and defense company..."
Recent News: [various]
```

**Winner**: FREE sources (exact data vs estimates)

---

### Example 2: Anduril Industries (VC-Backed Private Company)

**FREE Sources Give You**:
```
Company: Anduril Industries Inc
SAM.gov:
- UEI: XXXXXXXXXXXX
- CAGE: XXXXX
- Small Business: No
- Primary NAICS: 541712 (R&D)
- Address: Costa Mesa, CA
- Phone: XXX-XXX-XXXX

OpenCorporates:
- Incorporated: 2017 (Delaware)
- Type: Corporation
- Status: Active
- Age: 7 years

FPDS Contracts:
- Total Contracts: 15
- Total Value: $234.5M
- Recent: $10.5M SBIR Phase II (Jan 2024)
```

**Crunchbase Gives You**:
```
Company: Anduril Industries
Founded: 2017
Total Funding: $2.3 Billion
Last Round: Series E ($1.5B, June 2024)
Valuation: $8.5 Billion
Employees: 1,000+

Investors:
- Founders Fund (Lead)
- Andreessen Horowitz
- In-Q-Tel (CIA's VC)
- General Catalyst
- 8VC

Recent Activity:
- Acquired Area-I (2021)
- Acquired Dive Technologies ($100M, 2022)

Description: "Defense technology company building 
autonomous systems powered by AI..."
```

**Winner**: Crunchbase (much richer data for VC-backed companies)

---

### Example 3: Small SBIR Winner (Private, Not VC-Backed)

**FREE Sources Give You**:
```
Company: Tech Solutions LLC
SAM.gov:
- Small Business: Yes
- Woman-Owned: Yes
- 8(a): No
- HUBZone: No
- Employees: 25 (from SAM optional field)
- Primary NAICS: 541330 (Engineering Services)
- Address: Arlington, VA

OpenCorporates:
- Incorporated: 2015 (Virginia)
- Type: LLC
- Status: Active
- Age: 9 years

FPDS Contracts:
- Total: 12 contracts
- Total Value: $2.3M
- SBIR Phase I: 3 awards
- SBIR Phase II: 1 award
```

**Crunchbase Gives You**:
```
[Company not found in Crunchbase]
```

**Winner**: FREE sources (Crunchbase doesn't have this company)

---

## Decision Matrix

### Use FREE Sources If:
- ✅ Your users primarily care about large public contractors
- ✅ You need contract history + company size
- ✅ Budget is limited (<$2,000/year)
- ✅ You want accurate financial data (not estimates)
- ✅ Small business certifications matter to your users

### Add Clearbit If:
- ✅ You need better data on mid-size private companies
- ✅ Budget allows $100-$250/month
- ✅ Employee counts and revenue estimates add value
- ✅ Tech stack information is interesting to users

### Add Crunchbase If:
- ✅ Budget allows $5,000-$10,000/month
- ✅ Your users are VCs, investors, or market analysts
- ✅ Funding rounds and investor intelligence is critical
- ✅ Tracking defense tech startups is core value prop
- ✅ You can justify premium pricing ($199-$299/month)

---

## My Final Recommendation

### Phase 1 (Now): Implement FREE Sources

**Why**: Best ROI, covers your most important users (public contractors = biggest contracts)

**Timeline**: 3-4 weeks

**Cost**: $0

**Result**: Better than Crunchbase for public companies, basic coverage for all others

### Phase 2 (3 months later): Evaluate Clearbit

**If users request more detail on private companies**, add Clearbit

**Timeline**: 1 week to integrate

**Cost**: $1,200-$3,000/year

**Result**: Significantly better coverage of mid-size contractors

### Phase 3 (6+ months later): Consider Crunchbase

**Only if**:
- You have 500+ paid users willing to pay premium
- VC/investor intelligence becomes core feature
- Budget justifies $60K+ annual spend

**Timeline**: 2-3 weeks to integrate

**Cost**: $60,000-$120,000/year

**Result**: Best possible data, competitive advantage

---

## Files You Have

1. **AFFORDABLE_COMPANY_INTELLIGENCE.md** - Full guide to free sources
2. **create_company_intelligence_free.sql** - Database migration (ready to deploy)
3. **COMPANY_INTELLIGENCE_COMPARISON.md** - This file (comparison & recommendation)

**Ready to start**: Run the SQL migration and I'll help you build the SAM.gov + SEC enrichment scripts!

The free approach will give you 90% of the value for 0% of the cost.

