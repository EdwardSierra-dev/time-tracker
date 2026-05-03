# 🛠️ Fix Issues – Leader & Analyst Features

You are a senior full-stack engineer.

Fix the following issues ensuring correct data representation, role-based behavior, and consistency with existing features.

---

# 👤 Leader

## 1. Restore Password Change in Settings

### Current Issue
The password change functionality for Leaders was removed from the Settings page.

### Required Behavior
- The Settings page for Leaders MUST include:
  - Password change form

### Requirements
- Reintroduce the password change UI for Leaders
- Ensure it uses the same validation rules as Analysts
- Ensure the functionality is fully operational (backend + frontend)

---

## 2. Leader Dashboard – Incorrect Data Aggregation

### Current Issue
- The "Hours" column shows aggregated total hours per analyst
- The "Environment" column shows only one value (e.g., "AMBIENTE EPH")
- This creates misleading data interpretation

### Required Behavior
- The dashboard must display **individual time entries (no aggregation)**

Each row must represent:
- One single entry record

### Required Fields per Row
- Analyst
- Country
- Hours (per entry, NOT summed)
- Client
- Environment
- Date (if available)

---

## 3. Filtering Functionality

### Requirement
The Leader dashboard must support filtering by:

- Analyst
- Country
- Client
- Environment
- Date (if applicable)

### Exclusion
- ❌ Do NOT include "Project" as a filter

### Behavior
- Filters must dynamically update the table
- Multiple filters can be applied simultaneously

---

## 4. Export Functionality

### Current Issue
Export is currently in CSV format.

### Required Changes
- Replace CSV export with **XLSX export**

### Behavior
- Exported file MUST:
  - Reflect the **currently filtered data**
  - Match exactly what is displayed in the dashboard

### Requirements
- File format: `.xlsx`
- Include column headers
- Maintain same structure as UI table

---

# 👤 Analyst

## 1. Missing Environment Field in Entries

### Current Issue
The "Environment" field is not displayed in analyst entries.

### Required Behavior
- The entries table MUST include the "Environment" column

### Requirements
- Field must display correct value per entry
- If value is null, display `"N/A"`
- Must be consistent with Leader view

---

# ⚙️ General Requirements

- Do not break existing functionality
- Ensure consistency between Leader and Analyst views
- Avoid data aggregation unless explicitly required
- Ensure all data comes from persistent storage (no hardcoded values)

---

# 🎯 Expected Outcome

- Leader dashboard shows accurate, non-aggregated data
- Filters allow precise data exploration
- Exported files match filtered results
- Analysts see complete entry information including Environment
- Password change functionality is restored for Leaders