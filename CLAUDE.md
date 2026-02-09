# CLAUDE.md

## Project Overview

**Genesee County Land Bank (GCLB) Compliance Portal** — a single-page React application where property buyers submit compliance documentation (photos, receipts, invoices) for Land Bank programs.

## Tech Stack

- **Frontend:** React 18 + Vite 5
- **Styling:** Tailwind CSS 3 + PostCSS + Autoprefixer
- **Icons:** Lucide React
- **Backend:** Vercel Serverless Functions (`api/submit.js`)
- **Deployment:** Vercel

## Project Structure

```
src/
  App.jsx          # Main compliance portal component (form, uploads, validation)
  main.jsx         # React entry point
  index.css        # Tailwind CSS imports
api/
  submit.js        # Serverless endpoint for form submissions
index.html         # HTML entry point
```

## Commands

```bash
npm run dev        # Start local dev server (Vite with HMR)
npm run build      # Production build to dist/
npm run preview    # Preview production build locally
```

## Key Notes

- No test framework is configured — there are no tests to run.
- No linter or formatter is configured (no ESLint/Prettier).
- The API endpoint (`api/submit.js`) has a TODO for FileMaker API integration — it currently logs submissions and returns success.
- File uploads support drag-and-drop with image preview. Accepted formats: JPG, PNG, HEIC (photos), PDF/CSV/images (docs and receipts).
- Form validation is handled client-side in `App.jsx`.
- The project uses ES modules (`"type": "module"` in package.json).
- Deployment is configured via `vercel.json` with API route rewrites.
