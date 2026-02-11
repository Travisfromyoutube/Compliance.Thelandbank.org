# GCLBA Compliance Portal

Compliance management system for the Genesee County Land Bank Authority (Flint, MI). Tracks property buyers across four programs (Featured Homes, Ready4Rehab, Demolition, VIP) through graduated enforcement levels (0-4), milestone schedules, and automated communications.

**Repo:** https://github.com/Travisfromyoutube/Compliance.Thelandbank.org.git
**Live:** https://compliance-thelandbank-org.vercel.app
**Version:** 1.1.0 (prototype, no auth)

Tech Stack: React, Vite, Tailwind CSS, Prisma, PostgreSQL, Vercel

---

## Current Status

| Area | Status | Notes |
|------|--------|-------|
| Admin Dashboard | Done | Michigan Civic Editorial redesign complete |
| Properties CRUD | Done | List, detail view, inline field editing |
| Compliance Engine | Done | Deterministic schedule from close date + enforcement levels |
| Buyer Submission | Done | Standalone `/submit` page with photo/doc uploads |
| Email System | Done | Template rendering, batch send, Resend integration (mock fallback) |
| Communication Log | Done | Per-property tracking, batch approval workflow |
| Milestones Page | Done | Upcoming milestones computed from compliance rules |
| Template Manager | Done | CRUD for email templates with variant system |
| Enforcement Tracker | Done | Enforcement level visualization and tracking |
| Action Queue | Done | Grouped by action type, mail merge workflow, email preview |
| Compliance Map | Done | Leaflet map with enforcement-colored markers, program filter |
| Audit Trail | Done | Expandable property timelines, chronological event history |
| Reports Page | Scaffold | Page exists, needs data aggregation |
| Settings Page | Scaffold | Page exists, placeholder content |
| Database (Neon) | Done | 7 models, seed script, API endpoints connected |
| Design System | Done | Custom tokens, reusable UI components, civic editorial aesthetic |
| Authentication | Not started | No auth — entire app is open |
| Tests | Not started | No test framework configured |

---

## Architecture

### Two-Surface App

1. **Admin portal** (`/`, `/properties`, `/compliance`, etc.) — wrapped in `Layout.jsx` with sidebar nav
2. **Buyer portal** (`/submit`) — standalone page, no sidebar, editorial design

> Note: `src/App.jsx` is the **old** prototype buyer form (pre-redesign). It is not used in routing. `src/main.jsx` is the real entry point.

### State Management

`PropertyContext.jsx` uses `useReducer` as the central state store:
- Initializes from `allProperties` in `mockData.js` (10 hand-curated + 30 generated), then attempts API fetch on mount
- All mutations dispatch locally AND fire-and-forget PATCH to `/api/properties/:id`
- Actions: `SET_PROPERTIES`, `ADD_COMMUNICATION`, `UPDATE_PROPERTY_FIELD`, `BATCH_UPDATE_PROPERTIES`
- Helpers: `logCommunication()`, `batchLogCommunications()`, `updateField()`, `getProperty()`

### Compliance Engine

Deterministic and rule-based:
- `src/config/complianceRules.js` — per-program schedule (days from close), grace periods, required uploads/docs
- `src/lib/computeDueNow.js` — walks the schedule, checks completed actions, returns `isDueNow`, `daysOverdue`, `currentAction`, `nextAction`
- `src/utils/milestones.js` — dashboard stats, overdue calculations

### API Layer (Vercel Serverless)

All endpoints in `api/` directory, consumed via `/api/*` rewrite in `vercel.json`:

| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `api/properties.js` | GET | List properties with buyer info, filterable |
| `api/properties/[id].js` | GET, PATCH | Single property read/update |
| `api/compliance.js` | GET | Compliance timing for all/single property |
| `api/submissions.js` | POST | Buyer submission intake |
| `api/communications.js` | GET, POST | Communication log CRUD |
| `api/templates.js` | GET, POST, PUT | Email template management |
| `api/email.js` | POST | Send single/batch email (Resend or mock) |
| `api/export.js` | GET | FileMaker-compatible JSON export |

### Database (Prisma + Neon PostgreSQL)

7 models in `prisma/schema.prisma`:
- **Buyer** — name, email, phone, organization
- **Program** — key, label, cadence, schedule JSON, grace days, required uploads/docs
- **Property** — parcel, address, program-specific compliance fields, enforcement level (0-4), status
- **Submission** — type (progress/final/monthly), form data JSON, status, confirmation ID
- **Document** — filename, mime, category (photo/document/receipt), slot, blob URL
- **Communication** — template, action, channel, body, status, sent/approved timestamps
- **EmailTemplate** — name, program types JSON, variants JSON (per-action subject/body)

### Design System

- **Tailwind tokens** in `tailwind.config.js`: civic green (`accent`), civic blue (`accent-blue`), warm neutrals (`bg`, `surface`, `warm-100/200`), semantic status colors
- **Fonts**: Inter (`font-sans`), Bitter (`font-heading`), Source Serif 4 (`font-display`), Courier Prime (`font-mono`)
- **Reusable UI** in `src/components/ui/`: `Card`, `StatCard`, `StatusPill`, `DataTable`, `AdminPageHeader`, `AppIcon`, `FormField`
- **Buyer components** in `src/components/buyer/`: `BuyerHero`, `BuyerSection`, `BuyerProgressSpine`, `PhotoSlot`, `DropZone`, `FileListItem`, `AnimatedCheck`, `BuyerConfirmation`
- **Icon system**: `src/icons/iconMap.js` maps semantic names to Lucide React components; always use `<AppIcon>` wrapper
- **Background**: CSS grid pattern + subtle noise in `src/index.css`

### Domain Concepts

- **Programs**: Featured Homes, Ready4Rehab (R4R), Demolition, VIP — each with different compliance timelines
- **Enforcement Levels**: 0 (Compliant) through 4 (Legal Remedies), tied to days overdue
- **Compliance Statuses**: On Track, Due Soon, Overdue, Completed, In Cure Period, In Default
- **Communication actions**: ATTEMPT_1, ATTEMPT_2, WARNING, DEFAULT_NOTICE — map to email template variants

---

## Key Files

| File | Purpose |
|------|---------|
| `src/main.jsx` | Route definitions, provider wrapping |
| `src/context/PropertyContext.jsx` | Central state store + API sync |
| `src/config/complianceRules.js` | Per-program enforcement schedules |
| `src/lib/computeDueNow.js` | Deterministic compliance timing calculator |
| `src/lib/templateRenderer.js` | Email template variable interpolation |
| `src/lib/programTypeMapper.js` | Display name / rule key mapping |
| `src/lib/db.js` | Prisma client singleton (serverless-safe) |
| `src/lib/emailSender.js` | Resend integration with mock fallback |
| `src/data/mockData.js` | Seed data + enum exports (PROGRAM_TYPES, ENFORCEMENT_LEVELS, COMPLIANCE_STATUSES) |
| `src/data/mockDataGenerator.js` | Seeded PRNG generator for 30+ demo properties with realistic data |
| `src/data/emailTemplates.js` | DEFAULT_TEMPLATES, ACTION_LABELS for compliance email actions |
| `src/pages/ActionQueue.jsx` | SOP-killer: grouped compliance actions with mail merge |
| `src/pages/ComplianceMap.jsx` | Leaflet map with enforcement-level markers and popups |
| `src/pages/AuditTrail.jsx` | Per-property timeline with communications and milestones |
| `src/components/Layout.jsx` | Admin shell — sidebar nav + outlet |
| `src/icons/iconMap.js` | Semantic icon registry (Lucide) |
| `tailwind.config.js` | Design tokens (colors, fonts, animations) |
| `prisma/schema.prisma` | Database schema (7 models) |
| `DESIGN-SPEC.md` | Visual direction spec (civic editorial) |
| `docs/feature-spec.md` | 28-feature roadmap across 6 pillars |

---

## Conventions

- **Icons**: Import from `src/icons/iconMap.js`, render via `<AppIcon>`. Never import Lucide directly in pages.
- **Styling**: Use Tailwind design tokens (`text-accent`, `bg-surface`, `border-border`). Avoid arbitrary hex values.
- **State updates**: Dispatch to PropertyContext reducer, then fire-and-forget API patch. Local state is source of truth during session.
- **API responses**: Flatten Prisma includes to match the shape PropertyContext expects (buyerName as single string, dates as ISO strings).
- **Program types**: Use display names in UI/mockData, rule keys in compliance engine. Convert with `toRuleKey()` / `toDisplayName()`.
- **Fonts**: Headings use `font-heading` (Bitter), stats/dates/IDs use `font-mono` (Courier Prime), body uses `font-sans` (Inter).
- **Vite cache**: After changing major dependency versions, clear `node_modules/.vite` and restart dev server.
- **Mock data**: `allProperties` merges hand-curated (10) + generated (30) properties. Import from `src/data/mockData.js`.

---

## Recent Decisions

| Decision | Why |
|----------|-----|
| Mock data as initial state with API overlay | Allows offline development and instant load; API enhances but is not required |
| Fire-and-forget API patches | Keeps UI snappy; local state is authoritative during a session |
| Resend with mock fallback | Email works in production, degrades gracefully without API key |
| Deterministic compliance schedule from close date | Single source of truth for when actions are due; no manual date entry needed |
| Prisma + Neon serverless | Free tier suits prototype; pgbouncer pooling for serverless compatibility |
| Separate buyer portal route (`/submit`) | Different audience, different aesthetic; no admin sidebar needed |
| Michigan Civic Editorial design language | Professional civic tech aesthetic; warm neutrals, serif headings, matte surfaces |
| react-leaflet pinned to v4.2.1 | v5 requires React 19 context API; crashes on React 18 with "render2 is not a function" |
| Seeded PRNG mock data generator | 30 generated + 10 hand-curated = 40 properties; deterministic so data is stable across refreshes |
| Action Queue as SOP-killer centerpiece | Groups properties by compliance action, one-click mail merge replaces 6-tool manual workflow |

---

## Development Commands

```bash
npm run dev          # Start Vite dev server (localhost:5173, frontend only)
npm run build        # prisma generate && vite build
npm run preview      # Preview production build locally
npm run db:push      # Push schema changes to Neon
npm run db:seed      # Seed database with initial data
npm run db:studio    # Open Prisma Studio GUI
```

**Environment**: Copy `.env.example` to `.env` and fill in Neon connection strings. `RESEND_API_KEY` is optional (mock mode without it).

**Local API development**: Use `vercel dev` (Vercel CLI) to run serverless functions locally alongside Vite.

---

## Next Steps

1. **Authentication** — Add role-based auth (staff vs. buyer) before any public deployment beyond prototype
2. **Tests** — Set up Vitest, start with compliance engine unit tests (`computeComplianceTiming`)
3. **Reports page** — Wire up data aggregation for the monthly compliance dashboard
4. **File storage** — Integrate Vercel Blob or S3 for actual document/photo uploads (currently metadata-only)
5. **Feature roadmap** — See `docs/feature-spec.md` for the full 28-feature, 6-pillar plan
