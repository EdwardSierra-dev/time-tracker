You are a senior full-stack engineer.

Extend the profile synchronization logic to include the country field.

## Requirements

1. After successful login:

- Get authenticated user using:
  supabase.auth.getUser()

2. Check if profile exists in "profiles" table:

- Match by:
  id = auth.user.id

3. If profile does NOT exist:

- Insert new record:

{
  id: auth.user.id,
  email: auth.user.email,
  role: "analyst",
  country: null,
  created_at: now()
}

4. If profile exists:
- Continue normal flow

---

## 5. Profile Completion

If profile.country is null:

- Redirect user to a "Complete Profile" page

---

## 6. Complete Profile Page

- Show form with:
  - Country (required)

- On submit:
  - Update profiles table:
    set country

---

## Constraints

- Do NOT store passwords in profiles
- Do NOT modify Supabase Auth user structure
- Do NOT use external services

---

## Expected Result

- Profiles are auto-created on first login
- Users must complete their country if missing
- System always has country data for each user