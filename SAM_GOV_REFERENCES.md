# SAM.gov API References

## SAM Functional Data Dictionary

**URL:** https://open.gsa.gov/api/entity-api/v1/SAM%20Functional%20Data%20Dictionary.pdf

**What it covers:**
- Entity registration fields (vendor/company profiles)
- Company info (Legal Business Name, UEI, CAGE Code)
- Socioeconomic flags (Small Business, Woman-Owned, Veteran-Owned, HUBZone, 8(a))
- Financial account info (EFT, banking)
- Points of contact
- Exclusion records (debarred vendors)

**Use cases:**
- Understanding vendor profiles
- Company eligibility verification
- Socioeconomic analysis
- Vendor validation

**When we might use it:**
- Phase 2: Company profile enrichment
- Adding vendor details to contracts
- Validating vendor registration status
- Socioeconomic compliance reporting

---

## SAM.gov Entity API

**Base URL:** https://api.sam.gov/entity-information/v3/entities

**Documentation:** https://open.gsa.gov/api/entity-api/

**API Key:** Stored in `.env.local` as `SAM_GOV_API_KEY`

**Rate Limits:**
- 1,000 requests per day (public tier)
- Contact SAM.gov for higher limits

---

## Related APIs

### USASpending.gov API
- Contract/award data (what we're currently using)
- Base URL: https://api.usaspending.gov/api/v2/
- No API key required
- Unlimited rate (but throttled per IP)

### FPDS (via USASpending)
- Federal Procurement Data System
- Accessed through USASpending.gov API
- 100+ fields per contract
- Historical data back to 2000

---

## Field Mappings

### SAM Dictionary Fields → Our Database

For future company enrichment:

| SAM Field | Our Table | Our Column |
|-----------|-----------|------------|
| Unique Entity Identifier (UEI) | fpds_contracts | vendor_uei |
| Legal Business Name | fpds_contracts | vendor_name |
| CAGE Code | fpds_contracts | vendor_cage_code |
| Small Business | fpds_contracts | small_business |
| Woman Owned | fpds_contracts | woman_owned_small_business |
| Veteran Owned | fpds_contracts | veteran_owned_small_business |
| HUBZone | fpds_contracts | hubzone_small_business |
| 8(a) Program | fpds_contracts | eight_a_program_participant |

---

## Notes

- SAM dictionary updated: June 23, 2023
- PDF is 42 pages
- Contains field definitions, types, lengths
- Includes validation rules and business logic
- Appendix A has complete acronym list

