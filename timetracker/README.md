# TimeTracker

Internal time tracking system for Rhiscom. Analysts log hours against clients, environments, and tasks. Leads monitor all activity across countries, filter by any dimension, and export reports to Excel.

---

## Features

### Time Entry Management
- Log hours per day with client, environment, task, project, country, and description
- 24-hour daily cap enforced on both client and server
- Edit and delete entries within the current calendar week
- Paginated entry list with date-range, client, and environment filters

### Analyst Dashboard
- Circular progress charts for daily, weekly, and monthly hours
- Limits sourced from the `hour_limits` table for the analyst's assigned country

### Lead Dashboard
- Global view of all analysts' entries for any month
- Filter by analyst, country, client, and environment simultaneously
- Summary cards: active analysts, entry count, total hours
- One-click XLSX export of the current filtered view

### Role-Based Behavior
| Feature | ANALYST | LEAD |
|---|---|---|
| View own entries | ✅ | ✅ |
| View all entries | ❌ | ✅ (dashboard only) |
| Edit/delete entries | Current week only | ❌ |
| Manage hour limits | ❌ | ✅ |
| View audit log | ❌ | ✅ |

### Profile & Settings
- Country selection on first login (required before accessing the app)
- Password change via Supabase Auth
- Hour limits management per country (LEAD only)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database & Auth | Supabase (PostgreSQL + Supabase Auth) |
| Supabase client | `@supabase/ssr` (cookie-based sessions) |
| Styling | Tailwind CSS |
| Date utilities | `date-fns` |
| Excel export | `xlsx` (SheetJS) |

---

## Setup

### 1. Install dependencies

```bash
cd timetracker
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |

### 3. Database setup

Run the SQL migrations in order against your Supabase project (SQL Editor or CLI):

```
supabase/01_schema.sql
supabase/02_rls.sql
supabase/03_seed.sql
supabase/04_uppercase_normalization.sql
supabase/05_audit_logs_and_username.sql
supabase/07_country_nullable.sql
supabase/08_hour_limits_public_read.sql
supabase/09_time_entries_country.sql
supabase/10_email_domain_restriction.sql
```

### 4. Run locally

```bash
npm run dev
```

App runs at `http://localhost:3000`. Root redirects to `/dashboard`.

---

## Key Design Decisions

**No in-app user creation by default.**
Users are provisioned via the Supabase Auth dashboard or the `/register` route (which uses the admin API with `email_confirm: true`). This keeps user lifecycle management outside the application.

**Email domain restriction.**
Only `@rhiscom.cl` and `@rhiscom.com` addresses are accepted. Enforced at three layers: frontend form validation, API route, and a database trigger on the `profiles` table.

**Profiles are separate from `auth.users`.**
The `profiles` table extends Supabase's `auth.users` with `full_name`, `role`, and `country`. A database trigger (`handle_new_user`) creates the profile automatically on signup. `upsertProfile` in the dashboard layout acts as a fallback for users created without metadata.

**Country is sourced from `hour_limits`.**
The `hour_limits` table is the single source of truth for valid countries. All country dropdowns across the app query this table — no hardcoded country lists.

**Sessions are cookie-based.**
`@supabase/ssr` handles session cookies via Next.js middleware, keeping the session alive across server and client components without manual token management.
