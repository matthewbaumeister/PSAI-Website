# Phase 1: Database Setup Guide

## 🚀 **Quick Start**

1. **Copy the SQL file** (`PHASE1_DATABASE_SETUP.sql`) content
2. **Go to your Supabase dashboard** → SQL Editor
3. **Paste and run** the entire SQL script
4. **Verify setup** with the verification queries at the bottom

## 📋 **Prerequisites**

- [ ] Supabase project created
- [ ] Access to Supabase dashboard
- [ ] Service role key available
- [ ] Environment variables configured

## 🔧 **Step-by-Step Setup**

### **Step 1: Access Supabase Dashboard**
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your PropShop AI project
3. Navigate to **SQL Editor** in the left sidebar

### **Step 2: Run Database Setup Script**
1. Click **"New query"** in the SQL Editor
2. Copy the entire content from `PHASE1_DATABASE_SETUP.sql`
3. Paste it into the query editor
4. Click **"Run"** to execute the script

### **Step 3: Verify Setup**
After running the script, you should see:
- ✅ **6 tables created** (users, user_sessions, email_verifications, password_resets, admin_invitations, user_settings)
- ✅ **8 indexes created** for performance
- ✅ **20+ RLS policies** for security
- ✅ **Default admin user** created (admin@propshop.ai)

### **Step 4: Check RLS Policies**
Run this query to verify RLS is enabled:
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('users', 'user_sessions', 'email_verifications', 'password_resets', 'admin_invitations', 'user_settings');
```

All tables should show `rowsecurity = true`.

### **Step 5: Verify Admin User**
Run this query to check the default admin:
```sql
SELECT id, email, first_name, last_name, is_admin, email_verified_at 
FROM users 
WHERE email = 'admin@propshop.ai';
```

## 🔐 **Security Features Implemented**

### **Row Level Security (RLS)**
- Users can only see their own data
- Admins can see all users
- Sessions are isolated by user
- Settings are user-specific

### **Data Protection**
- Passwords are hashed (bcrypt)
- JWT tokens for sessions
- 30-minute session timeout
- Secure token generation

### **Access Control**
- Service role for API operations
- Authenticated user permissions
- Admin-only routes protected
- Invitation-based admin system

## 📊 **Database Schema Overview**

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `users` | User accounts | Email, password, profile, admin status |
| `user_sessions` | Active sessions | JWT tokens, expiration, activity tracking |
| `email_verifications` | Email verification | Tokens, expiration, verification status |
| `password_resets` | Password recovery | Secure tokens, expiration tracking |
| `admin_invitations` | Admin management | Invitation system, role assignment |
| `user_settings` | User preferences | Key-value settings, customization |

## 🚨 **Troubleshooting**

### **Common Issues**

#### **1. RLS Policy Errors**
If you see RLS policy errors:
```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

-- Re-enable RLS if needed
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

#### **2. Permission Denied**
If you get permission errors:
```sql
-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, UPDATE ON users TO authenticated;
```

#### **3. Extension Not Found**
If UUID extension is missing:
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### **Verification Queries**

#### **Check All Tables Exist**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'user_sessions', 'email_verifications', 'password_resets', 'admin_invitations', 'user_settings');
```

#### **Check RLS Status**
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('users', 'user_sessions', 'email_verifications', 'password_resets', 'admin_invitations', 'user_settings');
```

#### **Check Admin User**
```sql
SELECT id, email, first_name, last_name, is_admin, email_verified_at 
FROM users 
WHERE email = 'admin@propshop.ai';
```

#### **Check Indexes**
```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('users', 'user_sessions', 'email_verifications', 'password_resets', 'admin_invitations', 'user_settings');
```

## 🔄 **Next Steps**

After successful database setup:

1. **Update environment variables** with your Supabase credentials
2. **Test database connection** from your Next.js app
3. **Begin building authentication API** endpoints
4. **Create authentication pages** for login/signup
5. **Implement JWT token system** for sessions

## 📞 **Support**

If you encounter issues:

1. **Check Supabase logs** in the dashboard
2. **Verify SQL syntax** in the query editor
3. **Review RLS policies** for permission issues
4. **Check environment variables** are correctly set

---

**🎯 Database setup is the foundation for Phase 1. Once complete, you'll have a secure, scalable authentication system ready for development!**
