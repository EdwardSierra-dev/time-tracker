# Time Tracking System – Refined Requirements

You are a senior full-stack engineer.

Enhance and correct the following features in a production-ready time tracking application.  
Focus on **clarity, consistency, and deterministic behavior**. Avoid assumptions.

---

# 👤 Roles

The system has two roles:
- **Leader**
- **Analyst**

All behaviors must be role-based.

---

# 🧩 1. Leader Dashboard Improvements

## Current Issue
The leader dashboard displays incomplete data for each analyst record.

## Required Changes
For each time entry displayed in the Leader dashboard, include the following fields:

- Analyst name
- Country
- Hours logged
- **Client (NEW – required)**
- **Environment (NEW – required)**

## Notes
- Ensure these fields come from the same data source as the entry (no hardcoded values).
- If `client` or `environment` is null, display `"N/A"`.

---

# 📊 2. Analyst Dashboard – Progress Visualization

## Current Issue
The UI uses static cards without meaningful progress representation.

## Required Changes
Replace cards with **circular progress charts**.

## Metrics to Display

### Daily
- Show total logged hours vs expected hours (e.g., 5 / 8)
- Display circular chart with percentage: percentage = (logged_hours / expected_hours) * 100

- Example:
  - 5 / 8 → 62%

### Weekly
- Same logic applied to weekly expected hours

### Monthly
- Same logic applied to monthly expected hours

## Requirements
- Charts must be visually consistent across all periods
- Percentage must be rounded to nearest integer
- Handle division by zero (expected_hours = 0 → show 0%)

---

# 🆕 3. User Registration

## Required Fields
- Email
- Full Name
- Username
- Password
- Confirm Password

## Validation Rules
- Email must be valid format
- Username must be unique
- Password:
  - Minimum 6 characters
  - Must include at least:
    - 1 letter
    - 1 number

## Behavior
- Reject submission if passwords do not match
- Return clear validation errors

---

# 📧 4. Welcome Email

After successful registration:

- Send email to user
- Subject: `"Welcome to the platform"`
- Body must include:
  - User’s name
  - Thank you message

## Example

Hello {name},
Welcome to the platform. Thank you for registering.


---

# 🔐 5. Password Reset

## Requirement
Implement a **simple password reset flow WITHOUT token-based validation**

## Flow
- User provides email
- System allows password reset directly

## ⚠️ Notes
- This is intentionally simplified
- Must include:
  - Logging of the action
  - Validation that the email exists
- Do NOT expose this endpoint publicly without restriction

---

# 📜 6. Logging System (Audit Logs)

## Scope
Log only **configuration changes performed by Leaders**, plus password changes.

## Events to Log

1. Leader creates an analyst
2. Leader updates hour limits
3. Any user changes their password

---

## Log Structure

Each log must include:

- `id`
- `timestamp`
- `user_id` (who performed the action)
- `action_type`  
  (e.g., CREATE_ANALYST, UPDATE_LIMITS, CHANGE_PASSWORD)
- `description` (human-readable)
- `metadata` (JSON with extra details)

---

## Example Log

```json
{
  "action_type": "CREATE_ANALYST",
  "description": "Leader created analyst John Doe",
  "metadata": {
    "analyst_id": "123",
    "analyst_name": "John Doe"
  }
}