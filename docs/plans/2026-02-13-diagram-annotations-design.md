# Diagram Panel: Title + Dynamic SOP Callouts

**Date:** 2026-02-13
**Status:** Approved

## Problem

The React Flow diagram panel (left side of How It Works page) shows the system architecture but has no title, no descriptive text, and no connection to the compliance SOP it replaces. It's a naked diagram with no narrative.

## Solution

Add a **title node** and **dynamic annotation nodes** inside the React Flow canvas. Annotations change based on `activeChapter`, tying each chapter to the SOP process the portal streamlines. Tone is respectful evolution: the SOP built the process, the portal automates it. No dashes in callout text. No use of the word "enforcement."

## Title Node

Pinned at top of diagram (above Buyer Portal / Admin Portal row).

- **Title:** "System Architecture"
- **Subtitle:** "How each piece streamlines the compliance workflow"
- Styled differently from system nodes: no border, no background, just text
- `font-heading` (Bitter) for title, `font-sans` (Inter) italic for subtitle
- Always visible, never dims

## Section Header

A persistent subtitle below the title that changes with `activeChapter`:

- **Title:** "How It Actually Works"
- **Subtitle:** "How each piece fits together"

## System Node Descriptions (always visible, per node)

These are static descriptions that live below each system node's subtitle. They provide context for what each piece does:

| Node | Description |
|------|-------------|
| Admin Portal | Where we pull reports, review compliance status, and send batch mail |
| Buyer Portal | Buyers get a secure link, upload documents, and confirm occupancy |
| Vercel API | Routes requests between the portals, FileMaker, and email. All business logic lives here |
| FileMaker | The master record. The portal reads from it and writes back to it |
| Neon Database | Local cache so pages load fast between syncs |
| Compliance Engine | Calculates milestones from the close date and updates levels automatically |
| Resend Email | Write and send emails from compliance@thelandbank.org without leaving the portal |

## Dynamic Annotation Nodes (change per chapter)

2 annotations per chapter, positioned near their target node. Fade in/out with opacity transition on chapter change. Framing: "this used to require X, now it happens here."

| Chapter | Node | Callout |
|---------|------|---------|
| What This System Does | `admin` | Compliance reports used to start with an Excel export. Now they're always live. |
| What This System Does | `resend` | Mail merge across Word and Outlook → one click batch send |
| What's Inside | `api` | One system handles what used to take FileMaker reports, Excel sorting, and Word templates |
| What's Inside | `neon` | Property data stays current. No more saving spreadsheets to the K: drive |
| The Tech Behind It | `filemaker` | Still the master record. The portal reads from it and writes back. |
| The Tech Behind It | `api` | Runs the logic that used to live in Excel formulas and Word merge fields |
| How Data Moves | `resend` | Emails go out from compliance@. No more saving Outlook PDFs to property folders |
| How Data Moves | `buyer` | Buyers submit directly through a secure link. No phone tag or paper forms |
| How Data Stays Safe | `compliance` | Levels update automatically. No split screen FM updates after each send |
| How Data Stays Safe | `api` | Every action is logged. No manual field entry per record |
| What Stays in Sync | `filemaker` | Same FM layouts, same data. The portal handles the back and forth |
| What Stays in Sync | `neon` | Portal keeps its own copy so pages load fast between syncs |

## Annotation Node Styling

- No background, no shadow
- `border-l-2 border-dashed` left accent in `accent/30`
- Text: `text-[10px]` Inter, `text-muted`, italic
- Positioned near target node with x/y offset to avoid edge overlap
- Fade: `opacity-0 → opacity-100` over 300ms

## Layout Changes

- Title node at approximately `y: -80` above current top row
- `fitView` padding may need slight increase (0.08 → 0.12) to accommodate title
- Node descriptions replace the current `subtitle` field in BASE_NODES
- Annotation positions: offset ~120px to left or right of target node

## Content Rules

- No dashes in callout text (use periods or arrows)
- Never use the word "enforcement" (use "levels" or rephrase)
- Tone: respectful evolution of the SOP, not criticism
- The SOP author will view this page

## Files to Modify

- `src/components/howItWorks/SystemMap.jsx` — add title node, annotation nodes, chapter→annotation mapping
- `src/components/howItWorks/SystemNode.jsx` — add longer description text below subtitle
- `src/components/howItWorks/AnnotationNode.jsx` — new component for annotation node type
- `src/components/howItWorks/TitleNode.jsx` — new component for title node type
