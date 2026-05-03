You are a senior full-stack engineer.

Refactor the user management system to use Supabase Auth exclusively.

## Core Requirements

1. REMOVE all in-app user registration logic:
- Delete registration forms
- Delete any API endpoints that create users manually
- Remove password handling from the application

2. Use Supabase Auth as the ONLY source of truth for users:
- Users are created manually in Supabase Dashboard (Authentication → Users)
- Do NOT create users via database inserts

3. Implement login using Supabase:

Use:
supabase.auth.signInWithPassword({
  email,
  password
})

4. Implement profile synchronization:

After successful login:

- Check if a profile exists in the "profiles" table using auth.user.id
- If NOT:
  - Create a new profile with:
    - id = auth.user.id
    - email
    - role = "analyst" (default)
    - created_at

- If YES:
  - Load existing profile

5. Ensure database structure:

profiles table must include:
- id (uuid, primary key, same as auth.user.id)
- email
- full_name (optional)
- role (analyst | leader)
- country (optional)
- created_at

6. Remove all email sending logic:
- No welcome emails
- No confirmation flows

7. Ensure no infinite loading:
- All async calls must resolve
- Proper error handling

## Expected Result

- Admin creates users in Supabase dashboard
- Users log in via Supabase Auth
- Profiles are auto-created on first login
- No password handling inside the app
- Clean and stable authentication flow

-----------------

Fixes

You are a senior full-stack engineer.

Fix the Settings page behavior regarding password management.

## Requirements

1. RESTORE the password change functionality in the Settings page.

2. The application MUST NOT manage passwords manually or store them in the database.

3. Implement password change using Supabase Auth:

Use:

supabase.auth.updateUser({

  password: newPassword

})

4. The password change form must:

- Be visible to authenticated users

- Validate minimum password length (6 characters)

- Confirm password match

5. On success:

- Show success message

- Do NOT reload the page unnecessarily

6. On error:

- Show clear error message

7. Ensure:

- No password is stored in custom tables

- No external email services are used

## Expected Behavior

- Users can change their password from Settings

- Password is updated securely via Supabase

- No regression in authentication flow