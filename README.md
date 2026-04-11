# AI Fitness Coaching Platform

A lightweight, zero-dependency MVP that helps a fitness coach manage clients,
track performance, and generate structured audit reports — all running
entirely in the browser.

## Features

1. **Client Management** — Create, edit, and delete client profiles
   (demographics, goals, injuries, baseline metrics). Data is persisted to
   `localStorage`, so nothing leaves the device.
2. **Performance Dashboard** — Track strength, conditioning, and body
   composition metrics over time. Displays KPI cards with trend deltas and
   inline SVG line charts (no Chart.js).
3. **Audit Report Generator** — Produces a rule-based audit that classifies
   every tracked dimension against published reference standards and the
   client's own trend data, then derives goal- and injury-aware
   recommendations. Deterministic — every line comes from an explicit rule.
4. **PDF Export** — Exports the audit via the browser's native print flow
   with a dedicated print stylesheet.

## Run locally

No build step. No dependencies. Pick either option:

```bash
# Option A — Python
python3 -m http.server 8080

# Option B — Node
npx serve .
```

Then open <http://localhost:8080>. Opening `index.html` directly via `file://`
will fail because the app uses native ES modules (which require `http://`).

Click **Load Sample** in the header to drop in a demo client with four
months of performance data and try every feature immediately.

## File structure

```
├── index.html          # Layout: tabs, forms, cards
├── styles.css          # Minimal professional styling + print stylesheet
├── app.js              # UI controller (tabs, forms, dashboard, PDF)
└── modules/
    ├── storage.js      # localStorage wrapper (all persistence in one place)
    ├── client.js       # Pure functions for creating/mutating clients
    └── report.js       # Deterministic rule-based audit generator
```

### How each part works

- **`storage.js`** — Wraps `localStorage` behind an `all / get / upsert /
  remove / clear` API. Swap this file for a REST client or IndexedDB
  implementation and the rest of the app keeps working unchanged.
- **`client.js`** — Pure functions (`newClient`, `updateClient`,
  `addMetric`, `removeMetric`). No DOM, no storage — trivially unit-testable
  and reusable on a backend.
- **`report.js`** — `generateAudit(client)` returns a structured object with
  `strengths`, `weaknesses`, and `recommendations`. Classification uses
  bodyweight strength ratios, VO₂ max bands, BMI categories, body fat trend,
  resting HR, plus a keyword rule engine that aligns recommendations to the
  client's stated goals. `renderAuditHTML(audit)` turns the object into
  HTML shared by the on-screen view and the PDF export.
- **`app.js`** — The UI controller. Handles tab switching, form wiring,
  dashboard rendering (inline SVG line charts, zero dependencies), and the
  generate-then-print flow for the PDF.
- **`styles.css`** — Minimal palette with one teal accent, CSS grid layout,
  plus a `@media print` block that hides every non-report element so
  `window.print()` yields a clean, paginated PDF.

## Export a PDF

1. Open the **Reports** tab.
2. Pick a client and click **Generate**.
3. Click **Export PDF** → the browser print dialog appears.
4. Choose **Save as PDF** as the destination.

The print stylesheet strips the app chrome and formats the audit for A4.

## Next steps for scaling

- **Backend & database** — Replace `storage.js` with a REST client that
  talks to a Node/Express + Postgres (or Supabase / Firestore) backend. The
  rest of the app already calls through that single interface, so nothing
  else changes.
- **Authentication** — Add a coach login (email + magic link or OAuth).
  Scope every query by `coachId` so a coach only sees their own clients.
- **Multi-coach & clients as users** — Let clients log in and see their own
  dashboards. Add a role column and row-level security.
- **Richer analytics** — Swap the inline SVG charts for a charting library
  (Chart.js, uPlot) once requirements grow; add percentile comparisons
  against population norms.
- **AI-assisted audits** — Keep the rule engine as a deterministic
  baseline, then layer an LLM call that takes the structured audit as
  context and generates plain-language coaching notes. Always ground the
  LLM output in the deterministic findings to avoid hallucinations.
- **Native PDF generation** — Move to a server-side renderer (e.g.
  Puppeteer or a library like `pdfkit`) so reports can be emailed or
  archived without the user clicking Print.
- **Testing** — The pure modules (`client.js`, `report.js`) are trivial to
  unit-test with Vitest/Jest; add snapshot tests on `generateAudit` to lock
  down the rule engine.

## License

See [LICENSE](LICENSE).
