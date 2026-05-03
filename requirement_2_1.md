You are a senior full-stack engineer.

Implement a clean and reliable user registration flow using Supabase Auth, aligned with best practices and existing architecture.

## Core Architecture Rules

- Supabase Auth is the ONLY system that manages users and passwords
- The application MUST NOT store or manage passwords manually
- Additional user data must be stored in a "profiles" table

---

## 1. User Registration (Frontend + Auth)

Implement a registration form with:

- Full Name
- Email
- Password
- Confirm Password

### Validation Rules

- Email must be valid format
- Password minimum 6 characters
- Password and confirm password must match

---

## 2. Registration Logic

Use Supabase Auth:

supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: fullName
    }
  }
})

### Important

- Email confirmation MUST be disabled in Supabase settings
- Do NOT implement any email sending logic
- Do NOT call external services

---

## 3. Profile Creation

After successful signUp:

- Get the created user (auth.user)

- Insert into "profiles" table:

{
  id: auth.user.id,
  email: auth.user.email,
  full_name: fullName,
  role: "analyst",
  created_at: now()
}

### Requirements

- Ensure no duplicate profile is created
- Handle race conditions (check before insert)

---

## 4. UX Behavior

On success:

- Stop loading state
- Show modal:
  "Te has registrado exitosamente"

On error:

- Stop loading state
- Show clear error message

---

## 5. Loading & Stability

- No infinite loading allowed
- All async calls must resolve or fail
- Proper try/catch handling

---

## 6. Security Rules

- Never store password in custom tables
- Never expose sensitive data
- Always rely on Supabase Auth

---

## 7. Integration with Existing System

- Ensure compatibility with login flow
- Ensure profiles table structure is respected
- Do not break existing sessions or authentication

---

## Expected Result

- Users can register from the app
- Users are created in Supabase Auth
- Profiles are created correctly
- No email dependency
- No infinite loading
- Clean and stable flow