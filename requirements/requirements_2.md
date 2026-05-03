You are a senior full-stack engineer.

We need to enhance existing features in a production-ready time tracking web application to improve user experience, data consistency, and role-based functionality.

---

## Roles & Permissions

### LEAD
- Must be able to create ANALYST users from the application.
- Required fields when creating a user:
  - full_name
  - email
  - country
- The system must:
  - Create the user in Supabase Auth (admin API)
  - Create the corresponding profile with role = 'ANALYST'

---

## Bug Fixes

### LEAD Dashboard (CRITICAL ISSUE)

- The global dashboard is NOT displaying analysts' data correctly.
- Fix data retrieval so that:
  - All analysts' time entries are visible to LEAD users
  - Data must be filterable by:
    - Month
    - Analyst
    - Country
- The dashboard MUST:
  - Display aggregated results
  - Show total sum of hours based on applied filters

---

## Time Entry Form Enhancements

Replace free-text inputs with controlled dropdowns (select inputs).

### 1. Client Field (REQUIRED)
Must be a dropdown with EXACT values:

- Rhiscom
- Carrefour
- Costco
- Liverpool
- Olimpica
- Palacio de Hierro
- Grupo
- Éxito
- Walmart CAM
- Walmart MX

---

### 2. Task Field (REQUIRED)
Must be a dropdown with EXACT values:

- Reunión
- Pruebas versión ATN
- Mantenimiento Preventivo
- Capacitación
- Consultoría GK
- Consultoría RHQA
- Configuración
- Regresión
- Automatización
- Adecuación
- Curso
- Administrativa
- Hardware
- Firmware
- Soporte
- Documentación
- Continuidad
- Software
- Implementación ATN
- Coordinación
- Seguimiento
- No Disponible

---

### 3. Environment Field (REQUIRED)
Must be a dropdown with EXACT values:

- Ambiente POS BAE
- Ambiente SCO SC
- Ambiente POS SC
- Ambiente POS Sam's
- Ambiente SCO Sam's
- Ambiente EPH
- Ambiente Linux QA1
- Ambiente Linux QA2
- Ambiente 4690 QA2
- Ambiente 4690 QA1
- Ambiente 4690 PP
- Ambiente Suburbia QA
- Ambiente Suburbia PP
- Ambiente Guatemala
- Ambiente Costa Rica
- Ambiente Nicaragua
- Ambiente Honduras
- Ambiente Salvador
- Ambiente SCO Olímpica
- Ambiente GUI Olimpica
- Ambiente ATN 1
- Ambiente ATN 2
- Ambiente Visor Costco
- Ambiente Carrefour
- Ambiente Toshiba

---

## Validation Rules

- All dropdown fields must be REQUIRED
- No free-text allowed for:
  - client
  - task
  - environment
- Ensure consistent values in database (no variations or typos)

---

## UX Requirements

- Use select inputs with search capability (for large lists)
- Show validation errors clearly
- Maintain clean and minimal UI

---

## Important

- Fix the dashboard issue FIRST (data visibility for LEAD)
- Ensure RLS policies allow LEAD to read all data
- Ensure ANALYST users still only access their own data
- Avoid hardcoding logic in frontend if it belongs to backend

---

## Final Step

After implementation:
- Test with multiple users (LEAD + ANALYST)
- Validate filters and aggregations
- Ensure no data leakage between users