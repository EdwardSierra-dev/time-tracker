# Architecture

## System Overview

TimeTracker is a Next.js 15 App Router application. There is no separate backend — all server-side logic runs inside Next.js Server Components, Server Actions, and API Routes. Supabase provides the database (PostgreSQL), authentication, and row-level security.

```
Browser
  │
  ├── Client Components  ──► Supabase JS client (anon key, cookie session)
  │
  └── Server Components  ──► Supabase SSR client (anon key, cookie session)
        │
        └── API Routes   ──► Supabase Admin client (service_role key)
                                    │
                                    └── Supabase (PostgreSQL + Auth)
```

---

## Route Structure

```
/                          → redirects to /dashboard
/login                     → public
/register                  → public (admin API creates user)
/complete-profile          → authenticated, no country yet
/dashboard                 → role-branched (LEAD / ANALYST)
/entries                   → analyst's own entries + new entry form
/settings                  → password change; hour limits (LEAD only)
```

All routes under `/(dashboard)` share a layout that enforces authentication and profile completeness before rendering.

---

## Authentication Design

Supabase Auth is the single source of truth for identity. The app never stores passwords.

### Login flow

1. `LoginForm` calls `supabase.auth.signInWithPassword({ email, password })` from the browser client.
2. `@supabase/ssr` writes the session to an HTTP-only cookie.
3. Next.js middleware (`lib/supabase/middleware.ts`) refreshes the session on every request and enforces route protection.
4. On success, the router pushes to `/dashboard`.

### Session handling

`middleware.ts` runs on every non-static request. It calls `supabase.auth.getUser()` to validate the session and applies redirect rules:

| Condition | Action |
|---|---|
| No session, accessing protected route | Redirect to `/login` |
| Active session, accessing `/login` or `/register` | Redirect to `/dashboard` |
| Active session, no country on profile | Redirect to `/complete-profile` |

### Supabase client variants

| Client | File | Key used | Used in |
|---|---|---|---|
| Browser client | `lib/supabase/client.ts` | `ANON_KEY` | Client Components, hooks |
| Server client | `lib/supabase/server.ts` | `ANON_KEY` | Server Components, services |
| Admin client | `lib/supabase/admin.ts` | `SERVICE_ROLE_KEY` | API Routes only |
| Middleware client | `lib/supabase/middleware.ts` | `ANON_KEY` | `middleware.ts` |

The admin client bypasses RLS. It is only instantiated inside API routes and never sent to the browser.

---

## Data Model

### `profiles`

Extends `auth.users`. Created automatically by the `handle_new_user` trigger on every new auth user.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | FK → `auth.users.id`, PK |
| `full_name` | TEXT | From `user_metadata` at signup |
| `role` | `user_role` enum | `ANALYST` (default) or `LEAD` |
| `country` | TEXT | Nullable; required before dashboard access |
| `username` | TEXT | Unique, added in migration 05 |
| `email` | TEXT | Stored for display; sourced from `auth.users` |
| `created_at` | TIMESTAMPTZ | Set at insert |

### `time_entries`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID | FK → `profiles.id` |
| `project_id` | UUID | FK → `projects.id`, nullable |
| `date` | DATE | No future dates allowed |
| `hours` | NUMERIC(5,2) | `> 0` and `<= 24`; daily total capped at 24 |
| `country` | TEXT | Analyst's country at time of entry |
| `client` | TEXT | Uppercase, from `CLIENTS` constant |
| `environment` | TEXT | Uppercase, from `ENVIRONMENTS` constant |
| `task` | TEXT | Uppercase, from `TASKS` constant |
| `description` | TEXT | Free text |
| `created_at` | TIMESTAMPTZ | |

### `hour_limits`

Single source of truth for valid countries and their hour caps.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `country` | TEXT | UNIQUE |
| `daily_limit` | NUMERIC(5,2) | Default 8 |
| `weekly_limit` | NUMERIC(5,2) | Default 40 |
| `monthly_limit` | NUMERIC(5,2) | Default 160 |

### `projects`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `name` | TEXT | UNIQUE |

### `audit_logs`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `timestamp` | TIMESTAMPTZ | |
| `user_id` | UUID | FK → `profiles.id` |
| `action_type` | TEXT | e.g. `UPDATE_LIMITS` |
| `description` | TEXT | Human-readable summary |
| `metadata` | JSONB | Structured payload |

---

## Data Relationships

```
auth.users
    │ (trigger: handle_new_user)
    ▼
profiles ──────────────────────────────► hour_limits
    │  profiles.country = hour_limits.country
    │
    └──► time_entries
              │
              └──► projects
```

- `profiles.country` is a soft reference to `hour_limits.country` (no FK constraint — intentional, allows country to be set before a limit exists).
- `time_entries.country` stores the analyst's country at the time of entry, independent of any later profile changes.

---

## Profile Sync Strategy

The `handle_new_user` PostgreSQL trigger fires `AFTER INSERT ON auth.users` and creates a `profiles` row using `raw_user_meta_data`. This covers the normal registration path.

For users created via the Supabase dashboard (without metadata), the dashboard layout calls `upsertProfile(userId, email)` on every page load:

```
DashboardLayout
  └── upsertProfile(userId, email)
        ├── SELECT profile WHERE id = userId
        ├── If found → return existing profile
        └── If not found → INSERT with defaults (role=ANALYST, country=null)
```

After upsert, if `profile.country` is null, the user is redirected to `/complete-profile` before accessing any dashboard page.

---

## State Management

There is no global state store (no Redux, Zustand, or Context). Data flows through:

**Server Components** — fetch data at render time using the SSR Supabase client. Used for initial page loads (`DashboardPage`, `SettingsPage`, `AnalystDashboard`).

**Custom hooks** — `useTimeEntries` and `useProfile` use `useEffect` + `useState` to fetch from the browser Supabase client. `useTimeEntries` rebuilds its query whenever filter or page dependencies change via `useCallback`.

**Local component state** — `LeadDashboard` manages its own filter state and fetches directly via the browser client. `HourLimitsClient` maintains an optimistic local copy of limits and updates it after a successful upsert.

**`router.refresh()`** — used after mutations (login, profile update) to invalidate the Next.js server component cache and re-run server-side data fetches.

---

## Error Handling

**API routes** return structured JSON errors:
```json
{ "error": "Human-readable message in Spanish" }
```
HTTP 400 for validation/business errors, 500 for unexpected failures. All 500s are logged to the server console with context.

**Service functions** return `null` or `{ error: string | null }` — never throw. Callers check the return value.

**Client components** maintain an `error: string | null` state. Errors are displayed inline in a red `bg-red-50` box. The error is cleared on the next submission attempt.

**Audit log failures** are non-fatal. `writeAuditLog` catches its own errors and logs to console without interrupting the main operation.

**Daily hour cap** is checked in two places: `TimeEntryForm` (client-side, before the Supabase call) and `createTimeEntry` service (server-side). The client check excludes the entry being edited to avoid false positives.

---

## Security

**Row Level Security (RLS)** is enabled on all tables. Key policies:

| Table | ANALYST | LEAD |
|---|---|---|
| `profiles` | SELECT own | SELECT all |
| `profiles` | UPDATE own | — |
| `time_entries` | SELECT/INSERT/UPDATE/DELETE own | SELECT all |
| `hour_limits` | SELECT | SELECT + INSERT + UPDATE + DELETE |
| `audit_logs` | — | SELECT |

**Email domain restriction** is enforced at three layers:
1. `RegisterForm` — client-side, immediate UX feedback
2. `POST /api/auth/register` — server-side, cannot be bypassed by the client
3. `enforce_email_domain_on_profile` trigger — database-level, blocks even direct Supabase dashboard inserts

**Service role key** is only used in API routes (`/api/auth/register`, `/api/admin/audit-log`, `services/auditLog.ts`). It is never referenced in any client-side file.

**No direct client inserts to `audit_logs`** — the RLS policy has no INSERT rule for authenticated users. All audit writes go through the service-role client in the API route.

**Password storage** — Supabase Auth handles all password hashing. The application never reads or stores passwords.
