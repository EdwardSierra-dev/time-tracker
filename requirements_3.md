You are a senior full-stack engineer.

We need to refine and correct several features in a production-ready time tracking application to improve usability, data consistency, and role-based behavior.

---

## ANALYST USER

### Entries Module

1. Default Data Scope
- The entries list must NOT display full historical data by default.
- It should only show entries from the last 7 days.
- Users can access older data using the existing date range filter.

2. Pagination
- Implement pagination in the entries list.
- Allowed page size: between 10 and 50 entries.

3. Date Validation
- The system must NOT allow selecting or submitting future dates.

4. Remove Project Field
- Remove the "project" field from:
  - Time entry form
  - Filters
- There is no business logic requiring this field.

5. Filters Update
- Replace "project" filter with "client" filter.
- Add a new filter:
  - Environment (based on entry.environment)

---

### Dashboard Module

1. Remove Unused Section
- Remove the UI block containing:
  - Title: "Progreso de horas"
  - Text: "No hay límites configurados para tu país (COLOMBIA)."

2. Display User Country
- Replace the removed block with a centered label showing:
  - The user's country (e.g., "COLOMBIA")

3. Hours Progress Display
- Update all hour indicators to include progress vs limit.

Format:
- Today: "5h / 8h"
- Week: "30h / 45h"
- Month: "120h / 180h"

- Limits must be dynamically retrieved from the `hour_limits` table based on the user's country.

---

## LEAD USER

### Entries Module

- The LEAD entries view must ONLY display the LEAD's own entries.
- It must NOT include analysts' entries.
- Analysts' data should only be visible in the dashboard.

---

### Dashboard Module

1. Data Export
- LEAD users must be able to export dashboard data.
- Export must respect active filters:
  - date range
  - analyst
  - country
  - client
- Preferred format: CSV or Excel

2. Missing Fields Fix
- The dashboard currently does not show all entry fields.
- Include the following fields in the dataset:
  - client
  - environment
  - description

---

## GLOBAL REQUIREMENTS

### Data Normalization

- All text fields must be stored in UPPERCASE to ensure consistency and avoid duplicates.

Examples:
- "Argentina", "ARGENTINA", "argentina" → must be stored as "ARGENTINA"

Applies to:
- country
- client
- environment
- task (if applicable)

- Ensure filtering and querying also operate using uppercase values.

---

## IMPORTANT

- Avoid frontend-only fixes for business logic; enforce rules at the backend level where appropriate.
- Ensure consistency between UI, database, and filters.
- Validate all changes against both roles (ANALYST and LEAD).