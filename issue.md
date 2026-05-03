# 🛠️ Fix Issue – Leader Dashboard Countries Filter

You are a senior full-stack engineer.

Fix the countries dropdown in the Leader dashboard so that it displays all available countries correctly.

---

# 🐞 Current Issue

- The countries filter dropdown in the Leader dashboard is incomplete
- Not all countries are displayed
- Other filters (environment, client) work correctly

---

# ✅ Expected Behavior

- The countries dropdown MUST display ALL available countries
- The list must be consistent with system configuration
- No missing or duplicated values

---

# 🔧 Data Source (Choose ONE correct approach)

## Option A (Quick Fix – Use existing table)

- Fetch countries from "hours_limits" table:

supabase.from("hours_limits").select("country")

### Requirements

- Ensure unique values (use DISTINCT or deduplicate in code)
- Filter out null or empty values
- Sort alphabetically (optional but recommended)

---

## Option B (Recommended – Better Design)

If improving without breaking existing functionality:

- Create or use a normalized "countries" table
- Fetch countries from that table instead

### Requirements

- Keep compatibility with existing `hours_limits`
- Do NOT break current filters or queries

---

# 🧪 Implementation Requirements

- The dropdown must:
  - Load all countries on component mount
  - Not depend on other filters
  - Update correctly when data changes

- Ensure:
  - No hardcoded country values
  - No partial datasets
  - No caching issues returning stale data

---

# 🧹 Data Handling

- Remove duplicates
- Ignore null/undefined values
- Trim strings if necessary

---

# 🎯 Expected Outcome

- Leader dashboard shows complete list of countries
- Filter behaves consistently with other filters
- Data source is reliable and maintainable