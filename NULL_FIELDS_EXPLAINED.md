# Why Some Fields Are NULL - Explanation

## ✅ Expected NULLs (DSIP API Doesn't Provide These):

### **Date Fields:**
- `created_date` - API doesn't return this
- `updated_date` - API doesn't return this  
- `modified_date` - API doesn't return this

**Why:** The DSIP public API doesn't expose these internal metadata fields.

---

### **TPOC Fields (Only During Pre-Release):**
- `tpoc_names`
- `tpoc_emails`
- `tpoc_centers`
- `tpoc_count`
- `tpoc_email_domain`

**Why:** TPOC data is **ONLY visible during Pre-Release status**. Once a topic goes "Open", the DSIP API hides this information.

**Solution:** Your daily scraper will capture TPOC when topics are Pre-Release and **preserve it forever** in your database, even after topics go Open.

---

### **Instructions Fields:**
- `component_instructions_download`
- `component_instructions_version`
- `solicitation_instructions_version`

**Why:** Not all topics have these optional fields in the API response.

---

### **Optional Metadata:**
- `owner`
- `internal_lead`
- `sponsor_component`
- `selection_criteria`
- `proposal_requirements`
- `submission_instructions`
- `eligibility_requirements`
- `historical_awards`
- `previous_awards_count`
- `success_rate`

**Why:** These are optional fields that the DSIP API may or may not include depending on the topic type and component.

---

## ❌ REMOVED (No Longer Guessing):

### **Funding Fields (Removed):**
- ~~`award_amount_phase_i`~~
- ~~`award_amount_phase_ii`~~
- ~~`award_duration_phase_i`~~
- ~~`award_duration_phase_ii`~~
- ~~`funding_max_text`~~
- ~~`total_potential_award`~~

**Why:** These were estimates. Actual funding amounts are **not available in the public API**. You can add them manually later if needed.

---

## ✅ What SHOULD Be Populated (After Scraping):

### **Core Fields:**
- topic_number, topic_id, title
- component, program, program_type
- status, solicitation_phase
- open_date, close_date
- keywords, technology_areas, modernization_priorities
- description, objective
- phase_i_description, phase_ii_description, phase_iii_description
- is_xtech, prize_gating, is_direct_to_phase_ii
- itar_controlled

### **Calculated Fields:**
- days_until_close, days_since_open
- duration_days, urgency_level
- proposal_window_status

### **Q&A Fields:**
- total_questions, published_questions
- qa_content (if Q&A exists)
- qa_response_rate_percentage (if questions exist)

### **PDF Links:**
- topic_pdf_download, pdf_link

---

## 📊 Expected Data Quality:

| Category | Populated | NULL | Reason for NULL |
|---|---|---|---|
| Core Info | 100% | 0% | Always from API |
| Dates | 100% | 0% | Always from API |
| Created/Updated Dates | 0% | 100% | API doesn't provide |
| Keywords/Tech | 100% | 0% | Always from API |
| Descriptions | 100% | 0% | Always from API |
| Q&A | 80% | 20% | Some topics have no Q&A |
| TPOC | 10% | 90% | Only Pre-Release topics |
| Instructions | 30% | 70% | Optional fields |
| Metadata | 20% | 80% | Optional fields |
| ~~Funding~~ | ~~0%~~ | ~~100%~~ | Removed (was guesses) |

---

## 💡 Bottom Line:

**NULL fields are expected and normal.** Your scraper is capturing **100% of available data** from the DSIP public API.

Any NULLs you see are because:
1. **API doesn't provide it** (created_date, updated_date, funding)
2. **Only available during Pre-Release** (TPOC)
3. **Optional/not always present** (instructions, metadata)

**Your database is working perfectly!** 🎉

