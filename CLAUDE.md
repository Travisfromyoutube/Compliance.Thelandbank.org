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

**Serverless API:** `api/submit.js` is a Vercel serverless function handling `POST /api/submit`. It currently runs in demo mode (logs and returns success). FileMaker Data API integration is the planned backend but is not yet implemented (marked TODO).

**Form submission flow:** The form collects buyer info + three categories of file uploads (progress photos, documentation, receipts/invoices). On submit, data is serialized to a JSON structure client-side and displayed as a confirmation. Files are not actually uploaded to a server — only metadata (name, size, type) is captured. A "Download JSON" button lets users export the submission payload.

**File upload handling:** Three separate drag-and-drop zones share common `handleDrag`/`handleDrop`/`handleFiles` functions, differentiated by a `fileType` string (`'progress'`, `'financial'`, `'receipts'`). Image files get `URL.createObjectURL` previews; non-images show a generic icon.

## Code Conventions

- `.jsx` extension for all React files
- Tailwind utility classes for all styling (no custom CSS)
- ES Modules throughout (`"type": "module"` in package.json)
- CORS enabled with wildcard origin on the API endpoint
- Client-side form validation with inline error display
