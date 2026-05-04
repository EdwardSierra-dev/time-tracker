# Data Access Layer

All Supabase interactions go through one of three client factories depending on context. This document covers every query, mutation, and auth call in the application.

---

## Client Factories

```ts
// Browser (Client Components, hooks)
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();

// Server (Server Components, service functions)
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient();

// Admin — service_role, bypasses RLS (API routes only)
import { createAdminClient } from "@/lib/supabase/admin";
const admin = createAdminClient();
```

---

## Authentication

### Sign in

```ts
// LoginForm.tsx
const { error } = await supabase.auth.signInWithPassword({ email, password });
```

On success, `@supabase/ssr` writes the session to an HTTP-only cookie. The middleware refreshes it on every subsequent request.

---

### Get current user

```ts
// Server Components / middleware
const { data: { user } } = await supabase.auth.getUser();

// Client Components / hooks
const { data: { user } } = await supabase.auth.getUser();
```

`getUser()` validates the JWT against Supabase on every call — it does not read from a local cache.

---

### Sign out

```ts
// Navbar.tsx
await supabase.auth.signOut();
router.push("/login");
router.refresh();
```

---

### Update password

```ts
// ChangePasswordForm.tsx
const { error } = await supabase.auth.updateUser({ password: newPassword });
```

Requires an active session. Validated client-side: minimum 6 characters, confirmation match.

---

### Create user (admin)

```ts
// POST /api/auth/register
const { data, error } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,          // skips confirmation email
  user_metadata: {
    full_name,
    country: country?.trim().toUpperCase(),
  },
});
```

Uses the service-role admin client. `email_confirm: true` means the user can log in immediately. The `user_metadata` is consumed by the `handle_new_user` database trigger to populate `profiles`.

---

## Profiles

### Get single profile

```ts
// services/profiles.ts → getProfile(userId)
const { data, error } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", userId)
  .single();
```

Returns `Profile | null`. Used in dashboard layout, settings page, and dashboard page to determine role.

---

### Upsert profile (first-login fallback)

```ts
// services/profiles.ts → upsertProfile(userId, email)

// 1. Try to load existing
const { data: existing } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", userId)
  .single();

// 2. Create if missing
const { data: created } = await supabase
  .from("profiles")
  .insert({
    id: userId,
    email,
    full_name: email.split("@")[0],
    role: "ANALYST",
    country: null,
    created_at: new Date().toISOString(),
  })
  .select("*")
  .single();
```

Called from `DashboardLayout` on every page load. The insert only runs if the `handle_new_user` trigger did not fire (e.g. user created via Supabase dashboard without metadata).

---

### Update country

```ts
// services/profiles.ts → updateProfileCountry(userId, country)
const { error } = await supabase
  .from("profiles")
  .update({ country: country.trim().toUpperCase() })
  .eq("id", userId);
```

Also called directly from `CompleteProfileForm`:

```ts
// CompleteProfileForm.tsx
const { error } = await supabase
  .from("profiles")
  .update({ country })
  .eq("id", user.id);
```

---

### Get all analysts

```ts
// services/profiles.ts → getAllAnalysts()
const { data } = await supabase
  .from("profiles")
  .select("id, full_name, role, country, email, created_at")
  .eq("role", "ANALYST")
  .order("full_name");
```

Used in the Lead Dashboard and `FiltersBar` to populate the analyst dropdown.

---

### Get profile in hook

```ts
// hooks/useProfile.ts
const { data } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", user.id)
  .single();
```

---

## Time Entries

### Fetch entries (paginated, with filters)

```ts
// hooks/useTimeEntries.ts
const PAGE_SIZE = 20;
const from = (page - 1) * PAGE_SIZE;
const to = from + PAGE_SIZE - 1;

let query = supabase
  .from("time_entries")
  .select("*, profiles(full_name), projects(name)", { count: "exact" })
  .order("date", { ascending: false })
  .order("created_at", { ascending: false })
  .range(from, to);

if (filters.dateFrom)    query = query.gte("date", filters.dateFrom);
if (filters.dateTo)      query = query.lte("date", filters.dateTo);
if (filters.client)      query = query.eq("client", filters.client);
if (filters.environment) query = query.eq("environment", filters.environment);
if (filters.analystId)   query = query.eq("user_id", filters.analystId);
if (filters.country)     query = query.eq("country", filters.country);
```

Returns `TimeEntry[]` with joined `profiles.full_name` and `projects.name`. The `count: "exact"` option returns the total row count for pagination.

---

### Fetch entries for Lead Dashboard

```ts
// LeadDashboard.tsx
let query = supabase
  .from("time_entries")
  .select("hours, user_id, date, client, environment, description, country, profiles!inner(full_name, country)")
  .gte("date", from)
  .lte("date", to)
  .order("date", { ascending: false });

if (filters.analystId)   query = query.eq("user_id", filters.analystId);
if (filters.client)      query = query.eq("client", filters.client);
if (filters.environment) query = query.eq("environment", filters.environment);
if (filters.country)     query = query.eq("country", filters.country);
```

Uses `profiles!inner(...)` to enforce an inner join — entries without a matching profile are excluded. Month boundaries are computed with `date-fns` `startOfMonth` / `endOfMonth`.

---

### Create entry

```ts
// TimeEntryForm.tsx (client-side)
const { error } = await supabase
  .from("time_entries")
  .insert({
    user_id: userId,
    date: form.date,
    hours: parseFloat(form.hours),
    country: form.country.toUpperCase(),
    client: form.client.toUpperCase(),
    environment: form.environment.toUpperCase(),
    task: form.task.toUpperCase(),
    description: form.description,
  });
```

Before inserting, the form checks the daily total:

```ts
const { data: existing } = await supabase
  .from("time_entries")
  .select("hours")
  .eq("user_id", userId)
  .eq("date", form.date)
  .neq("id", entry?.id ?? "");   // exclude current entry when editing

const totalHours = existing.reduce((s, e) => s + Number(e.hours), 0) + hours;
if (totalHours > 24) { /* reject */ }
```

---

### Update entry

```ts
// TimeEntryForm.tsx
const { error } = await supabase
  .from("time_entries")
  .update(payload)
  .eq("id", entry.id);
```

Only allowed for entries within the current calendar week (`isEditableEntry` checks `isWithinInterval` using `date-fns`).

---

### Delete entry

```ts
// TimeEntriesTable.tsx
await supabase.from("time_entries").delete().eq("id", id);
```

RLS ensures users can only delete their own entries.

---

### Hours summary (Analyst Dashboard)

```ts
// services/timeEntries.ts → getHoursSummary(userId, today, weekStart, monthStart)
const { data } = await supabase
  .from("time_entries")
  .select("date, hours")
  .eq("user_id", userId)
  .gte("date", monthStart)
  .lte("date", today);
```

Returns one month of entries. Daily, weekly, and monthly totals are computed in JavaScript by filtering the result set — no aggregation query.

---

## Hour Limits

### Get countries list

```ts
// services/hourLimits.ts → getCountries()
// Uses admin client so it works on unauthenticated pages (register, complete-profile)
const { data } = await supabase
  .from("hour_limits")
  .select("country")
  .order("country");

return [...new Set(data.map((r) => r.country))];
```

This is the single source of truth for all country dropdowns in the app.

---

### Get limit by country

```ts
// services/hourLimits.ts → getHourLimitByCountry(country)
const { data } = await supabase
  .from("hour_limits")
  .select("*")
  .eq("country", country)
  .single();
```

Used by `AnalystDashboard` to render the circular progress limits.

---

### Get all limits

```ts
// services/hourLimits.ts → getAllHourLimits()
const { data } = await supabase
  .from("hour_limits")
  .select("*")
  .order("country");
```

Used by `SettingsPage` to pass initial data to `HourLimitsClient`.

---

### Upsert limit (LEAD only)

```ts
// HourLimitsClient.tsx
const { data, error } = await supabase
  .from("hour_limits")
  .upsert(
    editId ? { id: editId, ...payload } : payload,
    { onConflict: "country" }
  )
  .select()
  .single();
```

`onConflict: "country"` means inserting a duplicate country updates the existing row. After a successful upsert, an audit log entry is written via the API route.

---

## Projects

### Get all projects

```ts
// services/projects.ts → getProjects()
const { data } = await supabase
  .from("projects")
  .select("id, name")
  .order("name");
```

---

## Audit Log

### Write audit log entry

```ts
// POST /api/admin/audit-log  (called from HourLimitsClient)
await fetch("/api/admin/audit-log", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action_type: "UPDATE_LIMITS",
    description: `Leader updated hour limits for ${country}`,
    metadata: { country, daily_limit, weekly_limit, monthly_limit },
  }),
});
```

The API route resolves the caller's identity from the session and writes using the service-role client:

```ts
// services/auditLog.ts → writeAuditLog(entry)
const { error } = await adminClient.from("audit_logs").insert({
  user_id: entry.user_id,
  action_type: entry.action_type,
  description: entry.description,
  metadata: entry.metadata,
});
```

Failures are logged to the server console but do not interrupt the main operation.

---

## Data Flow Summary

```
1. User visits /login
   └── supabase.auth.signInWithPassword()
         └── Session cookie set by @supabase/ssr

2. Middleware runs on every request
   └── supabase.auth.getUser() → validates session
         ├── No session → redirect /login
         └── Session OK → continue

3. DashboardLayout (Server Component)
   └── upsertProfile(userId, email)
         ├── Profile exists + country set → render children
         ├── Profile exists, no country → redirect /complete-profile
         └── No profile → create with defaults → redirect /complete-profile

4. Dashboard renders (role-branched)
   ├── ANALYST → AnalystDashboard
   │     ├── getHoursSummary(userId, today, weekStart, monthStart)
   │     └── getHourLimitByCountry(profile.country)
   └── LEAD → LeadDashboard
         ├── profiles.select().eq("role", "ANALYST")
         ├── hour_limits.select("country")
         └── time_entries.select(...).gte/lte(date range) + filters

5. Analyst logs hours
   └── TimeEntryForm
         ├── Check daily total (time_entries.select("hours").eq(date))
         └── time_entries.insert(payload)

6. Lead updates hour limits
   └── HourLimitsClient
         ├── hour_limits.upsert(payload, { onConflict: "country" })
         └── POST /api/admin/audit-log → audit_logs.insert()
```
