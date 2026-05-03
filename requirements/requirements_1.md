You are a senior full-stack engineer.

Build a production-ready web application for time tracking (timesheets) with role-based access control and scalable architecture.

## Tech Stack
- Frontend: Next.js (App Router)
- Backend: Supabase (PostgreSQL + Auth + API)
- Styling: Tailwind CSS
- State management: React hooks

---

## Roles & Permissions

There are two roles:
- LEAD
- ANALYST

### Role Capabilities

LEAD:
- Can view all analysts' time entries
- Can filter by:
  - date range
  - project
  - client
  - analyst
- Can configure hour limits (daily, weekly, monthly) per country

ANALYST:
- Can only see and manage their own entries
- Can filter by:
  - date range
  - project
- Can view progress bars:
  - daily hours vs limit
  - weekly hours vs limit
  - monthly hours vs limit

---

## Database Schema

Use Supabase PostgreSQL.

### Profiles Table (extends auth.users)
- id (uuid, PK, references auth.users)
- full_name (text)
- role (enum: 'LEAD', 'ANALYST')
- country (text)

### Projects
- id (uuid, PK)
- name (text)

### TimeEntries
- id (uuid, PK)
- user_id (uuid, FK → Profiles.id)
- project_id (uuid, FK → Projects.id)
- date (date)
- hours (numeric, allow decimals)
- client (text)
- environment (text)
- task (text)
- description (text)
- created_at (timestamp)

### HourLimits
- id (uuid, PK)
- country (text)
- daily_limit (numeric)
- weekly_limit (numeric)
- monthly_limit (numeric)

---

## Functional Requirements

### 1. Dashboard

LEAD:
- Global overview of all analysts
- Filters:
  - date range
  - project
  - client
  - analyst

ANALYST:
- Personal dashboard only
- Show 3 progress bars:
  - Daily hours vs limit
  - Weekly hours vs limit
  - Monthly hours vs limit
- Limits are based on user's country (HourLimits table)

---

### 2. Time Entry Form

Fields:
- Date (default today)
- Analyst (auto-filled from logged user)
- Project (select)
- Client
- Environment
- Task
- Hours (decimal input, allow float)
- Description

Validation:
- Hours required
- Max 24 hours per day per user
- Prevent exceeding daily logical limit (optional warning, not hard block)

---

### 3. Entries List

Columns:
- Analyst
- Project
- Client
- Date
- Hours
- Description

Features:
- Filter by date range
- Sort by newest first

---

### 4. Edit & Delete Rules

- Users can edit/delete ONLY their entries
- Only allowed within the current week (based on entry date)

---

### 5. Authorization (CRITICAL)

Implement Supabase Row Level Security (RLS):

- ANALYST:
  - Can SELECT/INSERT/UPDATE/DELETE only their own records

- LEAD:
  - Can SELECT all records
  - Cannot modify others' entries

---

## UI/UX

- Clean and minimal design
- Fully responsive
- Tailwind CSS
- Include:
  - loading states
  - empty states
  - error handling

---

## Project Structure

- app/
- components/
- lib/
- services/
- hooks/

Use reusable components and clean architecture.

---

## Supabase Setup

Provide:

1. SQL scripts for:
   - tables
   - enums
   - relationships

2. RLS policies (very important)

3. Seed example data

4. Environment variables setup

---

## Deliverables

- Full working code
- Step-by-step setup instructions
- .env.example
- SQL scripts
- How to run locally

---

## Important Constraints

- Code must be clean, scalable, and maintainable
- Do NOT overengineer
- Follow best practices
- Use server components where appropriate
- Optimize queries for performance

---

## Final Step

After generating the project, review everything and:

- Fix bugs
- Improve structure
- Validate security (RLS must be correct)
- Ensure no data leaks between users