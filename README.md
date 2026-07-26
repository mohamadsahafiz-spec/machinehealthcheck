# EO Technics Dashboard — a4.6 Refactored Codebase

## Integration & Final Wiring

This archive contains the fully refactored dashboard codebase with all inline section logic extracted into dedicated ES modules under `src/sections/`.

### What changed in a4.6

1. **Section Modularization**
   - Every major feature area now lives in its own file under `src/sections/`:
     - `machine-sequence.js` — Machine sequence rendering & updates
     - `renderers.js` — Core dashboard renderers (KPIs, cards, timeline, alerts, params, spare parts, budget, terms, insights)
     - `calendar.js` — Calendar modal
     - `laser-params.js` — Laser parameter edit modal
     - `spare-parts.js` — Spare parts edit modal
     - `laser-power.js` — Laser power monitor
     - `laser-profile.js` — Laser profile monitor
     - `via-images.js` — Via image comparison
     - `beam-profile.js` — Beam profile monitor + machine detail modal
     - `focus-optimization.js` — Focus optimization & laser defocus
     - `power-offset.js` — Power offset monitoring
     - `report-generator.js` — Enhanced report generator (state, charts, localStorage, preview, print)
     - `edit-panel.js` — Dashboard edit panel
     - `accessibility.js` — Export/import wiring

2. **Clean Import Graph**
   - `app.js` is now purely an orchestrator: it imports all sections, composes `renderAll()`, registers it with `src/core/lifecycle.js`, and wires event listeners.
   - No orphaned global references — every function references `appState` via `import { appState } from '../state/store.js'`.
   - Cross-section render calls (e.g. `saveLaserParams` → `renderParams`) are resolved via explicit ES-module imports.

3. **Lifecycle Module**
   - `src/core/lifecycle.js` provides `registerRenderAll()` / `triggerRenderAll()` so section modules can request a global refresh without circular dependencies.

4. **Window Exposure**
   - `app.js` explicitly attaches all section exports to `window` so legacy HTML `onclick="..."` handlers continue to work, but the functions themselves are no longer global definitions — they are properly exported from modules.

### Directory Structure

```
├── index.html
├── src/
│   ├── app.js                 # Orchestrator: imports, renderAll, init, events
│   ├── state/
│   │   ├── store.js           # Central state (appState, getState, setState)
│   │   └── persist.js         # Image upload / IndexedDB helpers
│   ├── core/
│   │   ├── dates.js           # Date parsing & formatting utilities
│   │   ├── schedule.js        # Visit schedule builder
│   │   ├── health.js          # Contract & fleet health calculators
│   │   └── lifecycle.js       # renderAll registration / trigger
│   ├── ui/
│   │   ├── modal-system.js    # openModalA11y / closeModalA11y
│   │   ├── sidebar.js         # scrollToSection / toggleMobileSidebar
│   │   ├── charts.js          # Chart.js wrappers
│   │   └── change-log-modal.js# Change-log UI helpers
│   └── sections/
│       ├── machine-sequence.js
│       ├── renderers.js
│       ├── calendar.js
│       ├── laser-params.js
│       ├── spare-parts.js
│       ├── laser-power.js
│       ├── laser-profile.js
│       ├── via-images.js
│       ├── beam-profile.js
│       ├── focus-optimization.js
│       ├── power-offset.js
│       ├── report-generator.js
│       ├── edit-panel.js
│       ├── accessibility.js
│       └── operations/
│           └── export-import.js
```

### Running the App

Open `index.html` in any modern browser. The app loads `src/app.js` as an ES module. A local static server (e.g. `npx serve` or `python -m http.server`) is recommended so module imports resolve correctly.
