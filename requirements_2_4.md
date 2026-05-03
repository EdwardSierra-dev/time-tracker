# 🔐 Email Domain Restriction – Rhiscom Only

You are a senior full-stack engineer.

Enforce that only corporate Rhiscom emails can be used as user accounts.

---

# 🎯 Allowed Domains

- rhiscom.cl
- rhiscom.com

---

# 🧠 Architecture Context

- Users are created via Supabase Auth (Dashboard or Admin tools)
- The application does NOT handle user creation directly

---

# 🔒 1. Backend Enforcement (MANDATORY)

Enforce restriction at the database/auth layer to prevent bypass.

## Option A (Recommended): Check constraint via profiles sync

When creating/updating profiles:

- Validate email domain:

Pseudo logic:

domain = email.split("@")[1]

if domain not in ["rhiscom.cl", "rhiscom.com"]:
    reject operation

---

## Option B (If using Supabase Auth hooks or edge functions)

- Intercept user creation
- Reject emails not matching allowed domains

---

# 🖥️ 2. Frontend Validation (UX)

Wherever email is displayed or input (if any admin UI exists):

- Validate domain before submission

## Error Message

Display below input:

"Solo se permiten correos corporativos de Rhiscom (rhiscom.cl o rhiscom.com)"

---

# 🧪 Validation Rules

- Email must:
  - Be valid format
  - Belong to allowed domains

---

# ⚠️ Important Constraints

- Do NOT rely only on frontend validation
- Must be enforced server-side or database-level
- Prevent manual insertion of invalid emails

---

# 🎯 Expected Outcome

- Only Rhiscom emails exist in the system
- Invalid domains are rejected consistently
- System integrity is preserved