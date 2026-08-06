# Nexova Custom Report Module (Crystal-style)

Band-based report designer that sits **alongside** the existing **jsreport** engine (`/jsreport`).  
It does **not** replace `ReportsView`, `RdlReportView`, or jsreport Studio.

## Features

- Report Header / Page Header / Detail / Group / Footer bands  
- Text, Field, Line, Box components  
- Parameters  
- Formula engine + grouping engine  
- HTML preview & Print → PDF  
- Excel export (uses existing `xlsx`)  
- Definitions stored in Postgres collection: **`custom_reports`** via `/api/data/custom_reports`

## Folder layout (copy into repo root `src/`)

```
src/
├── types/customReport.types.ts
├── hooks/useCustomReport.ts
├── engine/
│   ├── CustomReportGenerator.ts
│   └── CustomExcelExporter.ts
├── components/customReports/
│   ├── CustomReportsHub.tsx          ← main entry UI
│   ├── designer/
│   │   ├── ReportDesigner.tsx
│   │   ├── BandList.tsx
│   │   ├── Band.tsx
│   │   ├── ComponentBox.tsx
│   │   ├── Toolbox.tsx
│   │   ├── PropertyPanel.tsx
│   │   ├── ParameterPanel.tsx
│   │   └── PreviewPane.tsx
│   ├── viewer/
│   │   └── CustomReportViewer.tsx
│   └── shared/
│       ├── FormulaEngine.ts
│       └── GroupingEngine.ts
└── server/customReportRoutes.ts      ← optional
```

## Integration steps (5 minutes)

### 1. Copy files

From this ZIP, copy everything under `src/` into your repo’s `src/` (merge folders).

### 2. Open from App / Sidebar

**Option A – lazy window (recommended)**

In `App.tsx` (near other lazy imports):

```ts
const CustomReportsHub = lazyWithRetry(() => import('./components/customReports/CustomReportsHub'));
```

Render when `currentTab === 'custom-reports'` (same pattern as other modules).

**Option B – link inside existing Reports**

In `ReportsView.tsx` or Sidebar, add a button that sets tab to `custom-reports` or opens a window.

### 3. Navigation

In your navigation / `Sidebar` / `navigationEngine`, add an item:

```ts
{ id: 'custom-reports', label: 'Custom Report Designer', icon: 'FileText' }
```

### 4. Optional API routes

If you want `/api/custom-reports` aliases, in `src/server/routes.ts`:

```ts
import { customReportRouter } from './customReportRoutes.ts';
// after apiRouter is created:
apiRouter.use(customReportRouter);
```

**Not required** — the hub already uses `/api/data/custom_reports`.

### 5. Dependencies

No new packages required for core features:

- `xlsx` — already in `package.json`
- `lucide-react` — already present
- PDF via browser **Print → Save as PDF** (avoids duplicating jsreport Chrome PDF)

Optional later: `@hello-pangea/dnd` if you want full drag-and-drop (Toolbox currently uses click-to-add).

## How it works with jsreport

| System | Path / UI | Purpose |
|--------|-----------|---------|
| **jsreport** | `/jsreport` Studio | Production templates, Chrome PDF, scheduling |
| **Custom bands** | `CustomReportsHub` | Crystal-style visual bands, quick ERP collection reports |

Both can coexist. Use jsreport for complex production PDFs; use this designer for ad-hoc band layouts on `invoices`, `products`, etc.

## Data

Report definitions are normal documents in collection `custom_reports` (same dataStore as other ERP entities). No separate SQL migration is required for the document store pattern used by this project.

## License / ownership

Part of Nexova ERP (`md-rony-mia/erp_postgresql`). Add and commit as a new feature branch.
