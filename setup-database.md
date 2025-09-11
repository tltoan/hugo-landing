# 🗄️ Supabase Database Setup Guide

## Phase 1: Database Schema Setup

Follow these steps to set up the Hugo LBO platform database schema in your Supabase project.

### Prerequisites
- Access to your Supabase project dashboard
- The SQL files in the `supabase/migrations/` folder

### Step-by-Step Setup

#### 1. **Access Supabase SQL Editor**
1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **"New query"**

#### 2. **⚠️ CLEANUP EXISTING DATA (Required)**
**🚨 WARNING: This will delete all existing data in your database!**

1. Copy the contents of `supabase/migrations/000_cleanup_existing.sql`
2. Paste into the SQL Editor
3. Click **"Run"** to execute
4. ✅ **Expected Result**: All old tables and data removed, database cleaned

#### 3. **Run Migration 001: Initial Schema**
1. Copy the contents of `supabase/migrations/001_initial_schema.sql`
2. Paste into the SQL Editor
3. Click **"Run"** to execute
4. ✅ **Expected Result**: All tables, types, and indexes created successfully

#### 3. **Run Migration 002: RLS Policies**
1. Copy the contents of `supabase/migrations/002_rls_policies.sql`
2. Paste into a new SQL Editor query
3. Click **"Run"** to execute
4. ✅ **Expected Result**: Row Level Security enabled with proper policies

#### 4. **Run Migration 003: Sample Data**
1. Copy the contents of `supabase/migrations/003_sample_data.sql`
2. Paste into a new SQL Editor query
3. Click **"Run"** to execute
4. ✅ **Expected Result**: Sample LBO scenarios and formula templates inserted

### Verification Steps

#### 1. **Check Tables Created**
Run this query to verify all tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Expected tables:**
- `formula_templates`
- `game_events`
- `game_players`
- `lbo_scenarios`
- `multiplayer_games`
- `profiles`
- `user_progress`
- `user_stats`

#### 2. **Test Sample Data**
```sql
SELECT name, difficulty, time_limit 
FROM public.lbo_scenarios 
ORDER BY difficulty, name;
```

**Expected scenarios:**
- TechCorp LBO (beginner)
- RetailMax Buyout (beginner)
- Manufacturing Giant (intermediate)
- Healthcare Services (intermediate)
- Energy Conglomerate (advanced)

#### 3. **Test Authentication Setup**
```sql
-- Check if the trigger function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';
```

### Authentication Configuration

#### 1. **Enable Email Confirmation (Optional)**
In Supabase Dashboard:
1. Go to **Authentication > Settings**
2. Under **Email Templates**
3. Configure confirmation email template if desired

#### 2. **Configure Auth Settings**
Recommended settings:
- **Site URL**: `http://localhost:3000` (for development)
- **Redirect URLs**: Add your production domain when ready
- **Email Confirmation**: Enable for production

### Test User Creation

After setup, test the system:

1. **Go to your app** (localhost:3000)
2. **Click "Sign Up"**
3. **Use invite code**: `HUGO2024`
4. **Create account**: 
   - Email: `test@hugo.com`
   - Password: `HugoTest123!`
5. **Verify in Supabase**:
   - Check **Authentication > Users** (should show new user)
   - Check **Table Editor > profiles** (should show profile created)
   - Check **Table Editor > user_stats** (should show stats row)

### Real-time Features

The following tables have real-time enabled:
- `multiplayer_games` - For live game updates
- `game_players` - For player join/leave events
- `game_events` - For real-time game actions

### Security Features

✅ **Row Level Security (RLS)** enabled on all tables
✅ **User isolation** - users can only access their own data
✅ **Game access control** - users can only see games they're part of
✅ **Automatic profile creation** on user signup
✅ **Real-time subscriptions** configured for multiplayer

### Troubleshooting

#### Common Issues:

**1. Migration fails with "permission denied"**
- Make sure you're running the queries as the project owner
- Check that you're in the correct Supabase project

**2. "auth.uid() is null" errors**
- This happens when accessing tables without being logged in
- RLS policies require authentication for most operations

**3. Realtime not working**
- Verify realtime is enabled in Project Settings
- Check that tables are added to the publication

#### Getting Help:

If you encounter issues:
1. Check the Supabase logs in the Dashboard
2. Verify all migrations ran successfully
3. Test with a simple query to ensure tables exist
4. Check authentication is working in the app

### Next Steps

After successful database setup:
1. ✅ Test user registration and login
2. ✅ Verify multiplayer game creation works
3. ✅ Test the leaderboard functionality
4. 🔄 Ready for Phase 2: LBO Racing Engine Integration

---

**🎉 Database Setup Complete!**

Your Supabase database is now ready for the Hugo LBO platform with:
- Complete user management system
- Multiplayer game infrastructure
- Real-time capabilities
- Secure data access policies
- Sample LBO scenarios ready for testing