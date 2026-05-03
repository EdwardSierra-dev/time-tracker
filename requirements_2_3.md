You are a senior full-stack engineer.

Implement country selection based on the "hours_limits" table.

## Requirements

1. Country source:

- Countries MUST be retrieved from "hours_limits" table
- Do NOT hardcode country values

2. Fetch countries:

- Query:
  supabase.from("hours_limits").select("country")

- Ensure unique values (no duplicates)

3. Profile structure:

- Profiles table must include:
  country (string) OR country_id (if using FK)

4. Profile creation:

After login:

- If profile does not exist:
  Insert:

{
  id: auth.user.id,
  email: auth.user.email,
  role: "analyst",
  country: null,
  created_at: now()
}

---

## 5. Complete Profile Flow

If profile.country is null:

- Redirect user to "Complete Profile" page

---

## 6. Country Selection UI

- Display dropdown with countries from "hours_limits"
- User must select one country

---

## 7. Save Selection

- Update profile with selected country

---

## Constraints

- Do NOT hardcode countries
- Do NOT use external services
- Ensure no duplicate country values
- Ensure proper error handling

---

## Expected Result

- Countries come from hours_limits
- Users select valid country
- Profiles store country correctly
- System aligns with hours configuration