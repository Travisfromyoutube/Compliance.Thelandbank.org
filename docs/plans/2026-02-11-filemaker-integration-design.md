# FileMaker Integration Design

**Date:** 2026-02-11
**Status:** Implementation complete, field mapping partially confirmed
**Context:** Lucille James (DB Admin) requested that the compliance portal integrate with, rather than compete against, the existing FileMaker system.

## Strategic Position

"FileMaker is the brain. The portal is the face."

The compliance portal is NOT a competing database. It is a web frontend for FileMaker that does two things FM can't do well:

1. **Buyer self-service** — Modern web form for photo/document submissions on any device
2. **Compliance visibility** — Real-time dashboard that computes what's overdue and what action is next

FileMaker remains the system of record. The portal reads from it and writes back to it.

## Architecture

```
FileMaker (on-prem)  <──>  Cloudflare Tunnel  <──>  Vercel Serverless API
                                                         │
                                                         ├── Neon PostgreSQL (sync cache)
                                                         ├── Admin Dashboard (React)
                                                         └── Buyer Portal (/submit)
```

### Sync Strategy

| Direction | Trigger | Data |
|-----------|---------|------|
| FM → Portal | Cron (15 min) or manual sync | Property records, buyer info, dates |
| Portal → FM | On buyer submission | Submission + documents |
| Portal → FM | On communication send | Communication log entry |
| Portal → FM | On admin field edit | Single field PATCH |

FM wins all conflicts. The portal's Neon database is a read cache.

## GCLBA FileMaker Database

### Primary Layout: `PARC - Form`
- **30,061 records** in the property database
- Tabs: Sales, Maint., Planning, Finance, Pix/Docs, Map/GIS, Inspections, Reports 2
- Buyers are stored as a **portal (related records)** on the property layout

### Confirmed Field Names (from screenshots)

| FM Field | Portal Mapping | Notes |
|----------|---------------|-------|
| `Parc ID` | `parcelId` | Primary identifier (e.g. "4635457003") |
| `Address` | `address` | Full address with city/state/zip |
| `Sales Disposition` | `programType` | Checkbox group: Featured, R4R, VIP, Demo, etc. |
| `Date Sold` | `dateSold` | In buyer portal section |
| `Sold Auction` | `offerType` | e.g. "LBA - NO Min" |
| `Purchase Cat` | `purchaseType` | Purchase category |
| `Status` | `status` | In buyer portal section |
| `Foreclosure Year` | `foreclosureYear` | Year field |
| `Property Class` | `propertyClass` | e.g. "Resi / 401 / Residential With Structure" |
| `Sold Status` | `soldStatus` | Radio: L, LC, P, Y |
| `GCLB Owned` | `gclbOwned` | Yes/No |
| `Flint Area Name` | `flintAreaName` | Neighborhood name |
| `Minimum Bid` | `minimumBid` | Dollar amount |
| `Category` | `category` | e.g. "Demo - Removed Sold" |
| `SEV` | `sev` | State Equalized Value |
| `Name` | `firstName`/`lastName` | Combined buyer name (auto-split) |
| `Organization` | `organization` | Buyer organization |

### Sales Disposition → Program Type Mapping

FM uses checkboxes; portal uses single programType:
- `Featured` / `FH adj VL` → `FeaturedHomes`
- `R4R` / `R4R adj VL` → `Ready4Rehab`
- `Demo` → `Demolition`
- `VIP` → `VIP`

### TBD Fields (need Lucille's confirmation)

All compliance-specific fields (rehab deadlines, enforcement levels, insurance, bond, LISC) are marked `TBD_*` in the field map. They likely live on the Sales, Maint., Planning, Finance, or Inspections tabs. Run `GET /api/filemaker?action=status&meta=true` with real credentials to auto-discover.

## Implementation

### Files Created
- `src/lib/filemakerClient.js` — FM Data API client (token management, CRUD, container uploads)
- `src/config/filemakerFieldMap.js` — Prisma ↔ FM field name mapping with converters, TBD markers
- `api/filemaker.js` — Consolidated sync/push/status endpoint (Vercel function limit)
- `src/pages/FileMakerBridge.jsx` — Integration dashboard page

### Files Modified
- `api/submissions.js` — Fire-and-forget FM push after Neon save
- `.env.example` — FM_* environment variables
- `src/main.jsx` — /bridge route
- `src/components/Layout.jsx` — Integration nav section + live FM status widget
- `src/components/buyer/PhotoSlot.jsx` — Upload error messaging, 10MB check, mobile fix
- `src/components/buyer/DropZone.jsx` — Upload error messaging, 10MB check
- `src/components/buyer/BuyerConfirmation.jsx` — Copy button for confirmation ID
- `src/pages/BuyerSubmission.jsx` — sessionStorage form persistence

### Environment Variables
```
FM_SERVER_URL=          # FileMaker Server URL or Cloudflare Tunnel URL
FM_DATABASE=            # FM database name
FM_USERNAME=            # Data API account
FM_PASSWORD=            # Data API password
FM_LAYOUT_PROPERTIES=   # Default: "PARC - Form"
FM_LAYOUT_BUYERS=       # Default: "PARC - Form" (buyers are portal on property)
FM_LAYOUT_SUBMISSIONS=  # Default: "BuyerSubmissions" (needs creation by Lucille)
FM_LAYOUT_COMMUNICATIONS= # Default: "CommunicationLog" (needs creation by Lucille)
```

## Buyer Portal Polish
- Upload error messaging (was silent fallback, now shows warning)
- Client-side 10MB file size validation
- Mobile remove button visibility fix
- Confirmation ID copy button
- Form state persistence via sessionStorage

## Connectivity Requirement

GCLBA's FileMaker is on-premise. Recommended: Cloudflare Tunnel (`cloudflared`) installed on a machine on the same network. Creates a secure outbound-only tunnel — no ports opened, no public IP needed.

## Next Steps
1. ~~Get FM Server credentials and layout field names from Lucille~~ (partial — screenshots received)
2. Install cloudflared on GCLBA network
3. ~~Update field map with actual FM field names~~ (done for visible fields)
4. **Get credentials + run `?meta=true` to discover remaining TBD field names**
5. **Ask Lucille about buyer email field and compliance tab fields**
6. Test sync with real data
7. Deploy to Vercel with FM_* env vars

## Questions for Lucille
1. What layout/tab contains the compliance tracking fields (rehab deadlines, enforcement levels)?
2. Is buyer email stored in FM? What's the field name?
3. Does the `Sales` tab have insurance and occupancy tracking fields?
4. Is there a separate Communications or Activity Log layout, or should we create one?
5. What FM Data API account/layout access should we configure?
6. Can we get `cloudflared` installed on a machine on the GCLBA network?
