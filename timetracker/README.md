# TimeTracker

Aplicación de gestión de horas (timesheets) con control de acceso por roles, construida con Next.js 15, Supabase y Tailwind CSS.

---

## Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Estilos**: Tailwind CSS
- **Fechas**: date-fns

---

## Roles

| Rol      | Capacidades |
|----------|-------------|
| LEAD     | Ver todas las entradas, filtrar por analista/cliente/proyecto/fecha, configurar límites de horas por país |
| ANALYST  | Ver y gestionar solo sus propias entradas, ver barras de progreso diario/semanal/mensual |

---

## Setup paso a paso

### 1. Clonar e instalar dependencias

```bash
cd timetracker
npm install
```

### 2. Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) y crear un nuevo proyecto.
2. Copiar la **Project URL** y la **anon public key** desde *Settings → API*.

### 3. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Editar `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key   # Settings → API → service_role
```

### 4. Ejecutar scripts SQL en Supabase

En el **SQL Editor** de Supabase, ejecutar en orden:

1. `supabase/01_schema.sql` — Tablas, enums y trigger de auto-perfil
2. `supabase/02_rls.sql` — Políticas de Row Level Security
3. `supabase/03_seed.sql` — Proyectos y límites de horas de ejemplo

### 5. Crear usuarios de prueba

En Supabase → **Authentication → Users → Add user**, crear:

| Email | Password | Metadata (JSON) |
|-------|----------|-----------------|
| lead@example.com | password123 | `{"full_name":"Laura Gómez","role":"LEAD","country":"Argentina"}` |
| ana@example.com | password123 | `{"full_name":"Ana Martínez","role":"ANALYST","country":"Argentina"}` |
| carlos@example.com | password123 | `{"full_name":"Carlos Ruiz","role":"ANALYST","country":"Colombia"}` |

> El trigger `on_auth_user_created` crea automáticamente el perfil en la tabla `profiles`.

### 6. Correr localmente

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

---

## Estructura del proyecto

```
timetracker/
├── app/
│   ├── (auth)/login/          # Página de login
│   └── (dashboard)/
│       ├── layout.tsx          # Layout con Navbar (server component)
│       ├── dashboard/          # Dashboard (LEAD global / ANALYST personal)
│       ├── entries/            # Lista y gestión de entradas
│       └── settings/           # Configuración de límites (solo LEAD)
├── components/
│   ├── ui/                     # Button, Input, Select, Card, Modal, etc.
│   ├── Navbar.tsx
│   ├── TimeEntryForm.tsx
│   ├── TimeEntriesTable.tsx
│   ├── FiltersBar.tsx
│   └── ProgressBar.tsx
├── hooks/
│   ├── useProfile.ts
│   └── useTimeEntries.ts
├── lib/
│   ├── types.ts
│   └── supabase/
│       ├── client.ts           # Browser client
│       ├── server.ts           # Server component client
│       └── middleware.ts       # Session refresh
├── services/                   # Lógica de acceso a datos (server-side)
│   ├── profiles.ts
│   ├── projects.ts
│   ├── timeEntries.ts
│   └── hourLimits.ts
├── supabase/
│   ├── 01_schema.sql
│   ├── 02_rls.sql
│   └── 03_seed.sql
├── middleware.ts               # Auth guard global
└── .env.example
```

---

## Seguridad (RLS)

Las políticas de Row Level Security garantizan que:

- **ANALYST** solo puede SELECT/INSERT/UPDATE/DELETE sus propias entradas.
- **LEAD** puede SELECT todas las entradas, pero NO puede modificar las de otros.
- Los límites de horas y proyectos solo pueden ser gestionados por LEADs.
- No hay forma de bypassear estas reglas desde el cliente.

---

## Reglas de negocio

- Máximo 24 horas por día por usuario (validado en cliente y en DB con CHECK constraint).
- Edición/eliminación de entradas solo permitida dentro de la semana actual.
- Los límites de progreso se calculan según el país del analista.
