# propshop.ai - Quick Start Guide

**For: Billow LLC (dba prop-shop.ai)**

## What Was Built

A minimal, modern application for searching government contracting opportunities and managing a CRM pipeline.

### Core Features

1. **Minimal Landing Page** (`/`)
   - Clean entry point with search input
   - Two action buttons: Search opportunities & Open CRM

2. **Search & Chat** (`/app/search`)
   - 3-column layout: filters | chat + results | detail
   - Text search with agency/vehicle/status filters
   - Mock AI chat for asking questions about opportunities
   - 20 realistic mock government contracting opportunities

3. **CRM Pipeline** (`/app/crm`)
   - Kanban board with 7 stages: Inbox → Qualified → Pursuing → Proposal → Submitted → Won → Lost
   - Drag & drop opportunities between stages
   - Persistent storage (localStorage)
   - Detailed opportunity view panel

---

## Running the Application

```bash
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

Open http://localhost:3000

---

## Testing the App

### 1. Landing Page
- Visit http://localhost:3000
- You'll see the minimal entry page
- Type a query like "AI" or "cybersecurity" and press Enter
- Or click "Search opportunities" or "Open CRM pipeline"

### 2. Search & Chat
- Enter queries like:
  - "AI" or "machine learning"
  - "cybersecurity" or "cloud"
  - "Navy" or "Army"
  - "software development"
- Use filters on the left to narrow results
- Click any opportunity card to see details on the right
- Click "Add to CRM" to add it to your pipeline
- Use the chat to ask questions

### 3. CRM Pipeline
- Navigate to the CRM tab (or `/app/crm`)
- See opportunities you've added in the Inbox column
- Drag & drop cards between columns
- Click any card to see full details
- Add notes and save them

---

## File Structure

```
src/
├── types/
│   └── opportunity.ts              # TypeScript types
├── mock/
│   ├── opportunities.ts            # 20 sample opportunities
│   └── api.ts                      # Mock search & chat functions
├── contexts/
│   └── CrmContext.tsx              # Global CRM state (localStorage)
├── components/
│   └── OpportunityDetailPanel.tsx  # Shared detail view
└── app/
    ├── page.tsx                    # New minimal landing page
    └── app/
        ├── layout.tsx              # App shell (navbar + tabs)
        ├── search/
        │   └── page.tsx            # Search & Chat page
        └── crm/
            └── page.tsx            # CRM Kanban board
```

---

## Data Layer (Current State)

**Everything is currently mock data:**
- 20 realistic government contracting opportunities
- Mock search that filters by text, agency, vehicle, status
- Mock chat that generates contextual responses
- CRM state persisted to browser localStorage (no backend yet)

**No Supabase integration yet** - That's Phase 2.

---

## Next Steps (Phase 2)

When you're ready to integrate with real data:

1. **Backup Current Supabase** (if needed)
   ```bash
   npm run backup:supabase
   ```
   See `SUPABASE_RESET_GUIDE.md` for full instructions

2. **Create New Schema**
   - Run the SQL in `SUPABASE_RESET_GUIDE.md` step 6
   - Creates `opportunities`, `user_opportunities`, `chat_sessions`, etc.

3. **Connect to Real Data**
   - Replace mock API functions with real Supabase queries
   - Implement actual chat backend (OpenAI/Claude + RAG)
   - Add authentication guards for `/app` routes

4. **Wire Up Your Scrapers**
   - Connect your existing scrapers to populate `opportunities` table
   - ETL pipeline to transform scraped data into opportunity format

---

## Supabase Backup & Reset

**Before resetting Supabase:**

1. **Backup your data:**
   ```bash
   npm run backup:supabase
   ```
   
   This creates `backups/backup_YYYY-MM-DD/` with JSON exports of all tables.

2. **Follow the guide:**
   See `SUPABASE_RESET_GUIDE.md` for complete instructions on:
   - Backing up via CLI (SQL dump)
   - Resetting the database
   - Creating the new propshop.ai schema
   - Restoring if needed

---

## Environment Variables

Make sure you have `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Design Principles

The new propshop.ai design follows:
- **Minimal aesthetic** - Lots of whitespace, clean typography
- **No heavy animations** - Subtle transitions only
- **Dark theme** - #0B1220 background, blue (#2D5BFF) and green (#9AF23A) accents
- **Professional** - Focused on the data and workflow, not marketing

---

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 + inline styles for precise control
- **Backend:** Supabase (PostgreSQL)
- **State:** React Context API + localStorage
- **UI:** Custom components (no heavy UI library)

---

## Old "Make Ready" Pages

All the old pages are still there and functional:
- `/blog`, `/about`, `/admin`, `/dashboard`, etc.
- The header and footer from the old site are preserved
- Nothing was deleted, only new routes added

You can clean those up later or keep them if needed.

---

## Legal Entity

This project is for:
- **Legal Entity:** Billow LLC
- **DBA:** prop-shop.ai
- Prop-shop.ai is not a separate legal entity

Make sure billing, contracts, and legal docs reference **Billow LLC**.

---

## Questions or Issues?

The development server should be running at http://localhost:3000

If you encounter any issues:
1. Check the browser console for errors
2. Verify environment variables are set
3. Make sure `npm install` completed successfully
4. Try restarting the dev server

---

## Ready to Test?

Visit: http://localhost:3000

Try these flows:
1. Home → Enter "AI" → See results
2. Click an opportunity → View details → Add to CRM
3. Navigate to CRM tab → See your opportunity in Inbox
4. Drag it to "Qualified" → Click to view → Add notes
5. Go back to Search → Try filters → Ask chat questions

Enjoy building propshop.ai!

