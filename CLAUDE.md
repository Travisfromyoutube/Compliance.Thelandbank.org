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
| Email System | Done | Template rendering, batch send via `/api/email`, Resend integration (mock fallback) |
| Communication Log | Done | Per-property tracking, batch approval workflow |
| Milestones Page | Done | Upcoming milestones computed from compliance rules |
| Template Manager | Done | CRUD for email templates with variant system |
| Enforcement Tracker | Done | Enforcement level visualization and tracking |
| Action Queue | Done | Grouped by action type, mail merge workflow, email preview |
| Compliance Map | Done | Leaflet map with enforcement-colored markers, program filter |
| Audit Trail | Done | Expandable property timelines, chronological event history |
| Reports Page | Done | Data aggregation and compliance reporting |
| Settings Page | Done | Application settings and configuration |
| ComplianceOverview | Done | Buyer-facing compliance timeline + expandable formal policy |
| Database (Neon) | Done | 9 models (+ Note), seed script, API endpoints connected |
| Design System | Done | Custom tokens, reusable UI components, civic editorial aesthetic |
| FileMaker Integration | In progress | Field map (50+ confirmed, 10 TBD), sync/push API, FM Bridge page, parcel ID normalizer, buyer status fields, physical details, FM metadata, availability color coding. Awaiting real credentials |
| Vercel Blob Uploads | Done | File uploads via `put()`, fallback to base64 data URLs |
| Cron Job | Done | Hourly compliance check (8AM-6PM ET, Mon-Fri) |
| Edge Middleware | Done | API route protection via `ADMIN_API_KEY` (prototype mode: open) |
| Analytics | Done | `@vercel/analytics` + `@vercel/speed-insights` wired in `main.jsx` |
| Code Splitting | Done | React.lazy() — 13 lazy-loaded routes, vendor chunks separated |
| UX Optimizations | Done | 23 tasks: mobile progress bar, smart photo slots, keyboard shortcuts (Alt+key), Start Here card, Save Indicator toast, page titles, empty states, thread view, quick-actions, send-all, font consolidation |
| Authentication | In progress | Clerk JWT auth in middleware + Layout; API endpoints have inline auth gates; prototype mode still works when no keys set |
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
- Helpers: `logCommunication()`, `batchLogCommunications()` (async — calls `/api/email` then logs locally), `updateField()`, `getProperty()`
- Computed: `pendingSubmissions` (count of properties with unreviewed buyer submissions) — available via `useProperties()` hook

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
| `api/submissions.js` | GET, POST | Buyer submissions: admin list + buyer intake |
| `api/communications.js` | GET, POST | Communication log CRUD |
| `api/templates.js` | GET, POST, PUT | Email template management |
| `api/email.js` | POST | Send single/batch email (Resend or mock) |
| `api/export.js` | GET | FileMaker-compatible JSON export |
| `api/filemaker.js` | GET, POST | FM operations: `?action=status\|sync\|push` |
| `api/tokens.js` | GET, POST, DELETE | `?action=verify` (buyer), CRUD (admin). Consolidated from access-tokens + verify-token |
| `api/upload.js` | POST | Vercel Blob file uploads via `put()` |
| `api/cron/compliance-check.js` | GET | Hourly compliance check (8AM-6PM ET, Mon-Fri) |
| `api/notes.js` | GET, POST | Property notes/activity log CRUD |

### Database (Prisma + Neon PostgreSQL)

9 models in `prisma/schema.prisma`:
- **Buyer** — firstName, lastName, email, phone, organization, lcForfeit, treasRevert, buyerStatus, topNote
- **Program** — key, label, cadence, schedule JSON, grace days, required uploads/docs
- **Property** — parcel, address, program-specific compliance fields, enforcement level (0-4), status, FM sync fields (soldStatus, gclbOwned, sev, flintAreaName, minimumBid, category, conditions), physical details (beds/baths/sqft/yearBuilt/stories/garage/basement/lot/school), FM metadata (taxCapture, askingPrice, violations, foreclosureStatus, etc.), availability (FM color coding)
- **Submission** — type (progress/final/monthly), form data JSON, status, confirmation ID
- **Document** — filename, mime, category (photo/document/receipt), slot, blob URL
- **Communication** — template, action, channel, body, status, sent/approved timestamps
- **EmailTemplate** — name, program types JSON, variants JSON (per-action subject/body)
- **AccessToken** — token (unique), buyerId, propertyId, expiry, used flag
- **Note** — body, creator, visibility (internal/external), propertyId

### Design System

- **Tailwind tokens** in `tailwind.config.js`: civic green (`accent`), civic blue (`accent-blue`), warm neutrals (`bg`, `surface`, `warm-100/200`), semantic status colors
- **Fonts**: Inter (`font-sans`, `font-mono`), Bitter (`font-heading`). `font-mono` is remapped to Inter (not monospace) — use `tabular-nums` for aligned numeric displays.
- **Reusable UI** in `src/components/ui/`: `Card`, `StatCard`, `StatusPill`, `DataTable`, `AdminPageHeader`, `AppIcon`, `FormField`, `EmptyState`
- **Buyer components** in `src/components/buyer/`: `BuyerHero`, `BuyerSection`, `BuyerProgressSpine`, `ComplianceOverview`, `PhotoSlot`, `DropZone`, `FileListItem`, `AnimatedCheck`, `BuyerConfirmation`, `SaveIndicator`
- **Icon system**: `src/icons/iconMap.js` maps semantic names to Lucide React components; always use `<AppIcon>` wrapper
- **Background**: CSS grid pattern + subtle noise in `src/index.css`

### FileMaker Integration

- **Field map** (`filemakerFieldMap.js`): Single source of truth for Prisma ↔ FM field names. `toFM()` converts portal→FM (skips `TBD_` prefixed fields), `fromFM()` converts FM→portal.
- **TBD_ pattern**: Undiscovered FM field names get `TBD_` prefix; `toFM()` auto-skips them. Run `?action=status&meta=true` with real credentials to discover actual names.
- **FM client** (`filemakerClient.js`): Wraps FM Data API — session token lifecycle, `getRecords`, `findRecords`, `createRecord`, `updateRecord`.
- **Parcel ID normalizer**: `normalizeParcelId()` strips dashes/spaces for consistent matching (FM stores both `4635457003` and `46-35-457-003`).
- **Sync flow**: `GET /api/filemaker?action=sync` pulls FM records → `fromFM()` (with parcel normalization) → Prisma upsert on `parcelId`.
- **Push flow**: `POST /api/filemaker?action=push` reads Prisma record → `toFM()` → FM `createRecord`/`updateRecord`.
- **Buyer portal in FM**: Buyers are related records on the property layout (not a separate layout). Single "Name" field → `splitFMName()` splits to first/last. Includes `lcForfeit`, `treasRevert`, `buyerStatus` fields.

### Domain Concepts

- **Programs**: Featured Homes, Ready4Rehab (R4R), Demolition, VIP — each with different compliance timelines
- **Enforcement Levels**: 0 (Compliant) through 4 (Legal Remedies), tied to days overdue
- **Compliance Statuses**: On Track, Due Soon, Overdue, Completed, In Cure Period, In Default
- **Communication actions**: ATTEMPT_1, ATTEMPT_2, WARNING, DEFAULT_NOTICE — map to email template variants

---

## Key Files

| File | Purpose |
|------|---------|
| `src/main.jsx` | Route definitions, code splitting (React.lazy), Analytics + SpeedInsights |
| `src/context/PropertyContext.jsx` | Central state store + API sync |
| `src/config/complianceRules.js` | Per-program enforcement schedules |
| `src/lib/computeDueNow.js` | Deterministic compliance timing calculator |
| `src/lib/templateRenderer.js` | Email template variable interpolation |
| `src/lib/programTypeMapper.js` | Display name / rule key mapping |
| `src/lib/db.js` | Prisma client singleton (serverless-safe) |
| `src/lib/emailSender.js` | Resend integration with mock fallback |
| `src/data/mockData.js` | Seed data + enum exports (PROGRAM_TYPES, ENFORCEMENT_LEVELS, COMPLIANCE_STATUSES) |
| `src/data/mockDataGenerator.js` | Seeded PRNG generator for 30+ demo properties with realistic data |
| `src/data/programPolicies.js` | Single source of truth for GCLBA program policies, enforcement levels, eligibility |
| `src/data/emailTemplates.js` | DEFAULT_TEMPLATES, ACTION_LABELS for compliance email actions |
| `src/pages/ActionQueue.jsx` | SOP-killer: grouped compliance actions with mail merge |
| `src/pages/ComplianceMap.jsx` | Leaflet map with enforcement-level markers and popups |
| `src/pages/AuditTrail.jsx` | Per-property timeline with communications and milestones |
| `src/components/buyer/ComplianceOverview.jsx` | Buyer-facing compliance timeline + expandable policy accordion |
| `src/components/buyer/SaveIndicator.jsx` | Floating "Progress saved" toast for buyer form |
| `src/components/ui/EmptyState.jsx` | Reusable empty state with icon, title, subtitle, optional CTA |
| `src/hooks/usePageTitle.js` | `usePageTitle(title)` hook — sets document title per page (used by 14 pages) |
| `src/components/Layout.jsx` | Admin shell — sidebar nav, keyboard shortcuts (Alt+key), badge system |
| `public/gclba-logo.png` | Official GCLBA logo (transparent PNG) |
| `src/icons/iconMap.js` | Semantic icon registry (Lucide) |
| `tailwind.config.js` | Design tokens (colors, fonts, animations) |
| `prisma/schema.prisma` | Database schema (9 models) |
| `DESIGN-SPEC.md` | Visual direction spec (civic editorial) |
| `src/config/filemakerFieldMap.js` | FM ↔ Portal field mapping, `toFM()`/`fromFM()` converters, TBD_ pattern |
| `src/lib/filemakerClient.js` | FM Data API client (session tokens, CRUD, layout metadata) |
| `src/pages/FileMakerBridge.jsx` | FM integration dashboard — architecture explainer, system health bar, tech stack, sync controls |
| `docs/plans/2026-02-11-filemaker-integration-design.md` | FM architecture decisions and field mapping reference |
| `docs/FM-PORTAL-TASKS.md` | FM ↔ Portal compatibility fix tasks (from SOP screenshots) |
| `api/notes.js` | Property notes/activity log CRUD endpoint |
| `docs/feature-spec.md` | 28-feature roadmap across 6 pillars |
| `api/upload.js` | Vercel Blob file upload endpoint (`put()` pattern) |
| `api/cron/compliance-check.js` | Hourly compliance monitoring cron job |
| `middleware.js` | Edge Middleware — API route auth gating |
| `src/lib/uploadFile.js` | Browser-side upload helper (plain `fetch()` to `/api/upload`) |
| `vite.config.js` | Build config with manual chunks (vendor-react, vendor-map) |

---

## Conventions

- **Icons**: Import from `src/icons/iconMap.js`, render via `<AppIcon>`. Prefer `iconMap` over direct Lucide imports.
- **Icon enforcement**: If a needed icon isn't in `iconMap.js`, add it there first, then use `ICONS.name`. Some pages import layout-specific Lucide icons directly (e.g., `Search`, `Building2`, `List`, `Layers`) — this is acceptable for one-off UI icons not reused elsewhere.
- **Styling**: Use Tailwind design tokens (`text-accent`, `bg-surface`, `border-border`). Avoid arbitrary hex values.
- **State updates**: Dispatch to PropertyContext reducer, then fire-and-forget API patch. Local state is source of truth during session.
- **API responses**: Flatten Prisma includes to match the shape PropertyContext expects (buyerName as single string, dates as ISO strings).
- **Program types**: Use display names in UI/mockData, rule keys in compliance engine. Convert with `toRuleKey()` / `toDisplayName()`.
- **Fonts**: Headings use `font-heading` (Bitter), stats/dates/IDs use `font-mono` (Inter + `tabular-nums`), body uses `font-sans` (Inter).
- **Vite cache**: After changing major dependency versions, clear `node_modules/.vite` and restart dev server.
- **Mock data**: `allProperties` merges hand-curated (10) + generated (30) properties. Import from `src/data/mockData.js`.
- **DataTable compact prop**: Pass `compact` to DataTable for embedded tables (e.g., Dashboard). Default is spacious (`px-5 py-4`); compact is tighter (`px-4 py-3`).
- **Barrel imports**: UI components use barrel export from `src/components/ui/index.js`. Import as `{ Card, StatusPill, DataTable } from '../components/ui'`.
- **Program type mapping layers**: Form values (`'featured-homes'`) → rule keys (`'FeaturedHomes'`) → display names (`'Featured Homes'`). ComplianceOverview has its own `FORM_TO_RULE_KEY` map; admin pages use `programTypeMapper.js`.
- **Static assets**: Place in `public/` directory. Vite serves them at root URL (e.g., `public/gclba-logo.png` → `/gclba-logo.png`).
- **FM field writes**: Always use `toFM(obj, FIELD_MAP)` to write fields to FileMaker. Never manually check `startsWith('TBD_')` — `toFM()` skips TBD fields automatically.
- **FM buyer fields**: Use `toFM({ email, fullName }, BUYER_FIELD_MAP)` + `Object.assign()` to merge buyer context into submission/communication payloads.
- **useEffect + async + intervals**: When setting up `setInterval` inside an async callback within `useEffect`, always gate on a `mounted` flag to prevent orphaned intervals after unmount.
- **Code splitting**: Dashboard + Properties are eager-loaded; all other pages use `React.lazy()` in `main.jsx`. New pages should be lazy-loaded by default.
- **Vendor chunks**: Vite config separates `vendor-react` and `vendor-map` chunks for long-term browser caching. Add new heavy libraries to `manualChunks` in `vite.config.js`.
- **API cache headers**: GET endpoints set `Cache-Control: s-maxage=N, stale-while-revalidate=M`. Only add to GET handlers, never POST/PUT/DELETE.
- **Blob uploads**: `api/upload.js` uses `put(filename, req, { access: 'public' })` with `bodyParser: false`. Client sends raw file body via `fetch()` (see `src/lib/uploadFile.js`). Falls back to base64.
- **Serverless router pattern**: Related endpoints consolidated into single files with `?action=` routing (filemaker.js, tokens.js) to manage Vercel function count.
- **Vercel env vars**: Use `printf 'value' | vercel env add` — never `echo` (adds trailing newline that breaks header-safe values like CRON_SECRET).
- **Deployment**: `git push origin main` then `npx vercel@50.15.0 --prod`. Vercel Pro uses Turbo Build (30 cores).
- **StatusPill**: Uses `children` for display text, NOT a `label` prop. `<StatusPill variant="info">{text}</StatusPill>` — never `<StatusPill label={text} />`.
- **FormField onChange**: `TextInput`/`SelectInput` call `onChange(value, event)` — first arg is the extracted value, not a DOM event. Use `(value) => fn(value)`, not `(e) => fn(e.target.value)`.
- **FM sync upsert**: Spread full `fromFM()` output with explicit defaults for required fields. Never cherry-pick individual fields — it creates a "field graveyard" where mapped fields don't reach the database. Strip null/undefined keys before upsert to avoid overwriting existing data.
- **Inline auth gates for mixed-access endpoints**: When a consolidated `?action=` router has both public and admin operations, route the public action first, then add an auth check before admin operations. Don't rely on middleware query-param matching.
- **React Flow background**: `.react-flow` div has its own opaque background. To show a custom CSS background on the parent, override with `.parent .react-flow { background: transparent !important; }` in `index.css`.
- **React Flow fitView sizing**: Node bounding box aspect ratio must approximate the container's aspect ratio. A square bounding box in a portrait panel = tiny nodes. Spread y-positions to match panel height-to-width ratio. Use low `padding` (0.08) in `fitViewOptions`.
- **Patch application**: Prefer `git apply --3way` over `git am` — patches often target older commits and strict context matching fails. If `git am` gets stuck, `rm -f .git/*.lock` then `git am --abort`.
- **Smooth hover reveals**: Never conditionally mount (`{show && <el>}`) for animated content — causes layout reflow. Always render the element, toggle with `opacity-0/100` + `max-w-0/max-w-[Npx]` and `transition-all duration-200 ease-out`.

---

## Recent Decisions

| Decision | Why |
|----------|-----|
| Deterministic compliance schedule from close date | Single source of truth for when actions are due; no manual date entry needed |
| react-leaflet pinned to v4.2.1 | v5 requires React 19 context API; crashes on React 18 with "render2 is not a function" |
| Action Queue as SOP-killer centerpiece | Groups properties by compliance action, one-click mail merge replaces 6-tool manual workflow |
| ComplianceOverview reads from COMPLIANCE_RULES | Single source of truth; buyer timeline auto-updates when program type changes; no duplicate rule definitions |
| DataTable shared component upgrade | One file change (headers, zebra, hover, compact prop) cascades to 8+ pages; avoids per-page styling drift |
| Buyer fields always via `toFM()` | Manual TBD_ guard checks are a DRY violation; `toFM()` handles skipping centrally |
| FM polling stops when unconfigured | `Layout.jsx` only starts 5-min interval if `data.configured === true`; saves unnecessary network calls during prototype phase |
| Vercel Blob server-side `put()` over client-upload | Simpler, smaller bundle (no `@vercel/blob/client` in browser), `bodyParser: false` streams directly |
| Serverless router pattern (`?action=`) | Vercel counts each `.js` file as a function; consolidation keeps count manageable |
| React.lazy() for all pages except Dashboard + Properties | 559KB → 234KB initial load (58% reduction); most-visited pages stay eager |
| Edge cache: properties 30s, compliance 5min, templates 1hr | SWR pattern — edge serves stale while revalidating in background |
| Hourly cron (Pro plan) over daily | Staff gets fresher compliance data during business hours |
| `db push` over `migrate dev` for schema changes | Project has no migration history (started with `db push`); `migrate dev` would require full DB reset. Non-destructive column additions only. |
| Font consolidation: 2 fonts only (Inter + Bitter) | Removed Courier Prime and Source Serif 4; `font-mono` remapped to Inter to avoid touching 28+ files |
| Keyboard shortcuts via Alt+key in Layout | Alt+D/M/Q/P/C for top-5 admin pages; skipped when focus is in form inputs |
| FM sync spreads full fromFM() output | Cherry-picking 11 of 50+ fields caused "field graveyard" — new mapped fields never reached DB. Spread + null-strip is future-proof |
| Middleware supports Clerk JWT + ADMIN_API_KEY fallback | Clerk for production auth, ADMIN_API_KEY for API scripts/testing, prototype mode when neither is set |

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

**FileMaker debug**: Visit `/api/filemaker?action=status&meta=true` to see all FM layout fields (requires credentials).

---

## Next Steps

1. **FileMaker credentials** — Get real FM credentials from Lucille; run `?action=status&meta=true` to discover remaining 15 TBD_ field names. Bridge page + normalizer are ready.
2. **Authentication** — Add role-based auth (staff vs. buyer) before any public deployment beyond prototype
3. **Tests** — Set up Vitest, start with compliance engine unit tests (`computeComplianceTiming`)
4. **Feature roadmap** — See `docs/feature-spec.md` for the full 28-feature, 6-pillar plan
