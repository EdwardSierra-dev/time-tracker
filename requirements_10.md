# 🛠️ Refactor – Analyst Registration via Supabase Only

You are a senior full-stack engineer.

Update the system to remove all in-app user registration functionality.  
User creation must be handled exclusively through Supabase.

---

# ❌ 1. Remove In-App Registration

## Required Actions

- Completely REMOVE:
  - Registration forms (frontend)
  - Registration endpoints (backend)
  - Any logic related to creating users inside the platform

## Scope

This includes:
- Analyst registration forms
- Validation logic for registration
- Any database insert related to user creation from the app

---

# ✅ 2. User Creation via Supabase

## Approach

- Users (analysts) will be created ONLY through:
  - Supabase Dashboard
  - Supabase Auth (external to the app)

## Requirements

- The application must NOT attempt to:
  - Create users
  - Modify passwords
  - Handle registration flows

---

# 🔐 3. Authentication Flow

- The system must rely entirely on Supabase Auth for:
  - Login
  - Session management
  - User identity

---

# 👤 4. User Data Handling

## Behavior

- When a user logs in:
  - Retrieve user data from Supabase (auth user)
  - Map or sync with internal `profiles` or `users` table if needed

## Notes

- If additional fields are required (e.g., country, role):
  - Store them in a separate table (e.g., `profiles`)
  - Link via `user_id`

---

# ⚠️ 5. Restrictions

Do NOT implement:

- Custom registration logic
- Manual password handling
- Direct inserts into users table from frontend
- Email sending from the app

---

# 🎯 Expected Outcome

- No registration UI in the application
- All users are managed externally via Supabase
- Authentication is centralized and secure
- Application logic is simplified and consistent