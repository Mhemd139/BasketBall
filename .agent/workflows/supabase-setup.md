---
description: Set up Supabase database schema and configuration
---

# Basketball Manager - Supabase Setup Workflow

This workflow guides you through setting up the Supabase backend for the Basketball Manager application.

## Prerequisites

1. Create a Supabase account at https://supabase.com (if you don't have one)
2. Create a new Supabase project or use an existing one

## Get Supabase Credentials

3. Navigate to your Supabase project dashboard
4. Go to **Project Settings** → **API**
5. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

## Configure Environment Variables

6. Open `.env.local` in your project
7. Replace the placeholder values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-actual-key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

## Create Database Schema

8. In Supabase dashboard, go to **SQL Editor**
9. Create a new query
10. Copy and paste the complete schema from `Tasks.md` (lines 329-582)
    - This includes all tables: trainers, halls, events, classes, trainees, attendance
    - Row Level Security (RLS) policies
    - Helper functions for authorization
    - Initial seed data (3 halls)

11. Execute the SQL query

## Verify Database Setup

12. Go to **Table Editor** in Supabase dashboard
13. Verify these tables exist:
    - `trainers`
    - `halls`
    - `events`
    - `classes`
    - `trainees`
    - `attendance`

14. Check that the `halls` table has 3 rows (seed data):
    - Hall A (القاعة الأولى / אולם 1)
    - Hall B (القاعة الثانية / אולם 2)
    - Hall C (القاعة الثالثة / אולם 3)

## Set Up Authentication

15. Go to **Authentication** → **Providers** in Supabase
16. Enable desired auth methods:
    - Email (recommended for initial setup)
    - Phone (optional - for SMS OTP)
    - Magic Link (optional)

## Create Admin User

17. Go to **Authentication** → **Users**
18. Click **Add user** → **Create new user**
19. Enter admin credentials (for head trainer Samy):
    - Email: admin@basketball.local (or preferred email)
    - Password: (secure password)
    - Auto Confirm User: ✓ (checked)

20. After creating the user, click on the user to edit
21. Go to **User Metadata** → **Raw user meta data**
22. Add the following JSON to `app_metadata`:
    ```json
    {
      "role": "admin"
    }
    ```

23. Copy the user's UUID (you'll need this for the next step)

## Link Admin User to Trainers Table

24. Go back to **SQL Editor**
25. Insert the admin trainer record:
    ```sql
    INSERT INTO public.trainers (name_ar, name_he, name_en, phone, role, auth_user_id)
    VALUES (
      'سامي',
      'סמי',
      'Samy',
      '+972-XXX-XXXX',  -- Replace with actual phone
      'admin',
      'USER_UUID_HERE'  -- Replace with the UUID from step 23
    );
    ```

## Generate TypeScript Types

26. Install Supabase CLI (if not already installed):
    ```bash
    npm install -g supabase
    ```

27. Login to Supabase:
    ```bash
    supabase login
    ```

28. Generate TypeScript types:
    ```bash
    supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/types.ts
    ```
    - Replace `YOUR_PROJECT_ID` with your project ID (found in project settings)

## Test Connection

29. Restart your development server:
    ```bash
    npm run dev
    ```

30. The app should now connect to Supabase without errors

## Verify RLS Policies

31. In Supabase dashboard, go to **Authentication** → **Policies**
32. Verify that RLS is enabled for all tables
33. Check that policies exist for:
    - Trainers (admin can manage, users can view themselves)
    - Halls (all can view, admin can manage)
    - Events (all can view, admin + assigned trainer can manage)
    - Classes (all can view, admin can manage)
    - Trainees (all can view, admin + class trainer can manage)
    - Attendance (all can view, trainers can mark for their events)

## Next Steps

After Supabase setup is complete:
- Test authentication by logging in with the admin user
- Verify that the 3 halls are visible in the app
- Start building the Hall Management UI (Phase 2.1)
- Create sub-trainer accounts as needed

## Troubleshooting

**Connection errors:**
- Verify `.env.local` has correct URL and key
- Check that Supabase project is active (not paused)
- Ensure anon key has correct permissions

**RLS policy errors:**
- Verify helper functions `private.is_admin()` and `private.current_trainer_id()` exist
- Check that policies are enabled on all tables
- Ensure admin user has `app_metadata.role = 'admin'`

**Type generation fails:**
- Ensure Supabase CLI is installed globally
- Verify you're logged in: `supabase login`
- Check project ID is correct
