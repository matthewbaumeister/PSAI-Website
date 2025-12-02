# Deploy Authentication Schema

## Quick Start

Run this SQL in your Supabase SQL Editor to enable authentication features:

```sql
-- File: supabase/auth-schema.sql
```

## What It Creates

### Tables
1. **user_profiles** - Extended user profiles with roles
   - `role`: 'user', 'admin', 'superadmin'
   - Display name, company, job title
   - Login tracking, email preferences
   - Subscription tier (for future)

2. **scraper_configs** - Admin-configurable scrapers
   - Enable/disable scrapers
   - Schedule settings
   - Last run stats

3. **scraper_runs** - Scraper execution log
   - Success/failure tracking
   - Records processed
   - Duration and error logs

4. **admin_audit_log** - Admin action tracking
   - Who did what, when
   - IP address logging

5. **global_emails** - System announcements
   - Draft/schedule/send emails
   - Open/click tracking

### Row Level Security
- Users can only see/edit their own profile
- Admins can see all profiles
- Scraper data is admin-only

### Auto-Features
- Profile auto-created on signup
- Updated_at timestamps
- Scraper config updates on run complete

## Make Yourself Admin

After running the schema, make yourself an admin:

```sql
-- Find your user ID (after you've signed up)
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Make yourself admin
UPDATE user_profiles 
SET role = 'superadmin' 
WHERE id = 'YOUR-USER-ID-HERE';
```

## Access Admin Page

Once you're an admin:
1. Go to `/login` and sign in
2. Navigate to `/admin`
3. You should see the admin dashboard

## What's Next?

1. **Deploy this schema** to Supabase
2. **Sign up** for an account at `/signup`
3. **Make yourself admin** using SQL above
4. **Access** `/admin` to manage scrapers

