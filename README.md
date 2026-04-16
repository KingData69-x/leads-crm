# Leads CRM

Shareable CRM for lead tracking. Next.js 16 + Supabase + Tailwind.

## Setup (one-time, ~10 minutes)

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → sign up / log in (free)
2. Click **New project**
3. Pick a name (e.g. "leads-crm"), generate a DB password, choose a region close to you
4. Wait ~1 min for it to provision

### 2. Create the database schema

1. Open **SQL Editor** in the left sidebar
2. Click **New query**
3. Paste the contents of [`supabase/schema.sql`](./supabase/schema.sql)
4. Click **Run**

### 3. Grab your API credentials

**Project Settings → API** and copy:
- **Project URL** (e.g. `https://abcdefg.supabase.co`)
- **anon / public key** (long JWT starting with `eyJ...`)

### 4. Configure local env

Create `.env.local` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

### 5. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then click **Import CSV** and upload the scraper's output.

## Deploy to Vercel (make it shareable)

1. Push this folder to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import your repo
3. Set **Root Directory** to `leads-crm` if it's a subfolder
4. Add the two env vars from step 4
5. **Deploy**

Anyone with the URL can view and update the leads.

## Security note

Default RLS policies allow anyone with the anon key to read + update. Since the anon key ships with the frontend, the deployed URL is effectively public. For stricter control, enable Supabase Auth and gate the RLS policies on `auth.uid()`.

## Features

- Sortable, filterable, searchable table
- Status pipeline: New → Called → Interested → Closed (or Not Interested)
- Per-lead notes (click a row to expand)
- CSV import / export
- Status-count dashboard cards (click to filter)
- Dark UI, responsive
