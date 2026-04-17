# Performance Intelligence System

A modular, browser-based assessment, classification, and coaching decision engine for fitness professionals. No frameworks, no build step, no server required.

## What it does

Given a client's profile, testing data, movement constraints, and diagnostics, the system:

1. **Classifies** them into the correct training / rehab pathway
2. **Identifies** primary limiters ranked by priority
3. **Summarises** diagnostic device data (ForceDecks, NordBord, ForceFrame, SmartSpeed, DynaMo, VBT)
4. **Produces** ranked programming priorities specific to the pathway
5. **Generates** a structured 2-phase training / rehab plan
6. **Defines** measurable targets and KPIs
7. **Exports** a professional PDF report via the browser print flow

## Supported pathways

**General Population**
- Return to ADLs
- Return to Work / Occupation
- Return to Light Recreational Activity
- Return to Fitness

**Athlete / Sport**
- Return to Participation
- Return to Sport
- Return to Performance

**Shared Rehab / Performance Phases**
- Initial / Clinical Rehab
- Functional Reconditioning
- Strength / Capacity Development
- Performance Reintegration

## Run locally

No build step. No dependencies. No installation required.

```bash
# Option A — Python (built into macOS and most Linux)
python3 -m http.server 8080

# Option B — Node
npx serve .

# Option C — VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

Then open **http://localhost:8080** in your browser.

> Do not open `index.html` directly via `file://` — browsers block script loading from the filesystem for security reasons.

## How to use

1. **Client Profile tab** — Enter name, age, weight, client type, goals, and injury history. Client type drives pathway classification.
2. **Performance Metrics tab** — Enter 1RM values and conditioning data. Relative strength ratios update live as you type.
3. **Movement Quality tab** — Document mobility restrictions, stability deficits, coordination, pain, and balance findings. Be specific — vague entries reduce report quality.
4. **Diagnostics tab** — Enter data from ForceDecks, NordBord, ForceFrame, SmartSpeed, DynaMo, or VBT where available. All fields are optional.
5. Click **Generate Report** — the system classifies the client, processes diagnostics, builds a 2-phase plan, and renders the full report.
6. Click **Save** to persist the client to localStorage.
7. Click **Export PDF** on the Report tab → browser print dialog → Save as PDF.

## File structure

```
├── index.html                 # Full UI: tabs, forms, diagnostics cards
├── styles.css                 # Professional styling + print stylesheet
├── app.js                     # App controller — tabs, save/load, report orchestration
└── modules/
    ├── storage.js             # localStorage CRUD wrapper
    ├── client.js              # Client data model + form serialisation
    ├── classification.js      # Pathway classification and limiter identification engine
    ├── diagnostics.js         # Device data processing — flags asymmetries and weak links
    ├── planning.js            # 2-phase plan generator
    └── report.js              # Report builder and HTML renderer
```

## Architecture

All modules are plain JavaScript objects loaded via `<script>` tags — no ES modules, no bundler, no build step. `app.js` is the orchestrator that calls each module in sequence:

```
Client.fromForm()
  → Classification.classify(client)
  → Diagnostics.process(client)
  → Planning.generate(client, classification)
  → Report.generate(...) → Report.render(...)
```

All data is stored in `localStorage` under a `pis_` key prefix. To swap the storage backend (IndexedDB, REST API, Supabase), replace `modules/storage.js` — nothing else changes.

## Classification logic

Pathway assignment is based on:
- **Client type** — general population, youth, rehab, occupational, or athlete sub-type
- **Goals** — keyword matching against goal text
- **Pain status** — any active pain routes to Initial / Clinical Rehab phase
- **Relative strength** — squat, bench, and deadlift as multiples of bodyweight
- **Conditioning** — VO2 max or mile time bands
- **Movement quality** — documented restrictions and deficits
- **Diagnostic data** — asymmetry flags from ForceDecks, NordBord, ForceFrame

## PDF export

1. Generate a report on the Report tab
2. Click **Export PDF**
3. In the browser print dialog, set destination to **Save as PDF**
4. The print stylesheet hides all app chrome and formats the report for A4

## Data privacy

All data is stored locally in your browser's `localStorage`. Nothing is transmitted to any server. Clearing site data in browser settings will remove all saved clients.

## License

See [LICENSE](LICENSE).
