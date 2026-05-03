# 🛠️ Refactor – Analyst Registration

You are a senior full-stack engineer.

Completely remove the current analyst registration implementation and replace it with a new database-driven flow (no authentication service, no email dependencies).

---

# ❌ 1. Remove Existing Analyst Registration

## Current Issue
The current analyst registration flow is broken and does not create users correctly.

## Required Action
- Completely REMOVE all existing analyst registration logic

### This includes:
- Any usage of authentication services (e.g., Supabase Auth)
- Email confirmation logic
- External service calls (SMTP, email APIs)
- Related frontend and backend code

### Goal
Ensure no legacy logic interferes with the new implementation.

---

# 🆕 2. New Analyst Registration (Database-Driven)

## Approach
Implement registration as a **direct database insert**, similar to how "entries" are created.

---

## Required Fields

The registration form must include:

- Full Name
- Corporate Email
- Password
- Confirm Password

---

## Validation Rules

- Email:
  - Must be valid format
  - Must belong to:
    - rhiscom.cl
    - rhiscom.com

- Password:
  - Minimum 6 characters

- Confirm Password:
  - Must match Password

---

## Backend Behavior

On form submission:

1. Validate input data
2. Insert a new record into the `users` (or `analysts`) table

### Example Structure

```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "analyst",
  "created_at": "timestamp"
}