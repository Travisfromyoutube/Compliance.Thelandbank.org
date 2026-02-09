# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Genesee County Land Bank (GCLB) Compliance Portal — a single-page React application where property buyers submit progress photos, financial documentation, and receipts for property rehabilitation programs (Ready4Rehab, Featured Homes, VIP).

## Commands

```sh
npm run dev      # Start Vite dev server
npm run build    # Production build to dist/
npm run preview  # Preview production build locally
```

No test framework, linter, or formatter is configured.

## Architecture

**Single-component SPA:** The entire frontend lives in one React component (`CompliancePortal` in `src/App.jsx`) using hooks (`useState`, `useRef`) for all state management. There is no router, no state library, and no component decomposition.

**Two UI states:** The component renders either the form view or a confirmation view, toggled by the `submitted` boolean. The confirmation view shows a summary and a JSON preview of the structured payload, with options to download the JSON or reset and submit again.

**Serverless API:** `api/submit.js` is a Vercel serverless function handling `POST /api/submit`. It currently runs in demo mode (logs and returns success). FileMaker Data API integration is the planned backend but is not yet implemented (marked TODO). The frontend does not actually call this endpoint yet — submission is handled entirely client-side.

**Form fields:** Required: buyerName, email (validated with regex), propertyAddress, programType (Ready4Rehab | Featured Homes | VIP). Optional: totalSpent (dollar amount), submissionType (defaults to `'progress'`).

**File upload handling:** Three separate drag-and-drop zones share common `handleDrag`/`handleDrop`/`handleFiles` functions, differentiated by a `fileType` string (`'progress'`, `'financial'`, `'receipts'`). Accepted types: images (all zones), PDF and CSV (documentation and receipts zones). Image files get `URL.createObjectURL` previews; non-images show a generic icon. Files are not uploaded to a server — only metadata (name, size, type) is captured in the submission payload.

**Submission payload structure:**
```json
{
  "timestamp": "ISO string",
  "buyer": { "name", "email", "propertyAddress", "programType" },
  "financial": { "totalSpent": number|null, "hasReceipts": boolean },
  "files": {
    "progressPhotos": [{ "name", "size", "type" }],
    "documentation": [{ "name", "size", "type" }],
    "receipts": [{ "name", "size", "type" }]
  },
  "submissionType": "progress"
}
```

**Deployment:** Hosted on Vercel. `vercel.json` rewrites `/api/*` to the serverless functions in `api/`.

## Code Conventions

- `.jsx` extension for all React files
- Tailwind utility classes for all styling (no custom CSS)
- ES Modules throughout (`"type": "module"` in package.json)
- CORS enabled with wildcard origin on the API endpoint
- Client-side form validation with inline error display
