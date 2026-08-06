/**
 * OPTIONAL extra routes for custom reports.
 *
 * Primary persistence already works via existing generic API:
 *   GET/POST/DELETE  /api/data/custom_reports
 *
 * Mount these only if you want dedicated endpoints:
 *   import { customReportRouter } from './customReportRoutes.ts';
 *   apiRouter.use(customReportRouter);
 *
 * PDF is intentionally client-side (Print → Save as PDF) so we do not
 * conflict with the jsreport engine at /jsreport.
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { listCollection, getDocument, upsertDocument } from './dataStore.ts';
// NOTE: When copying into the repo, fix the import path to:
//   import { listCollection, getDocument, upsertDocument } from './dataStore.ts';
// relative to src/server/

export const customReportRouter = Router();

function ah(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/** List all custom report definitions */
customReportRouter.get(
  '/custom-reports',
  ah(async (_req, res) => {
    const items = await listCollection('custom_reports');
    res.json({ items });
  })
);

/** Get one definition */
customReportRouter.get(
  '/custom-reports/:id',
  ah(async (req, res) => {
    const item = await getDocument('custom_reports', req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json({ item });
  })
);

/** Upsert definition */
customReportRouter.post(
  '/custom-reports',
  ah(async (req, res) => {
    const body = req.body || {};
    const id = body.id ? String(body.id) : `creport_${Date.now()}`;
    const saved = await upsertDocument('custom_reports', id, {
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    });
    res.json({ item: saved });
  })
);

/**
 * Generate HTML preview server-side (optional).
 * Body: { reportId, parameters?, data? }
 * If data is omitted, loads from report's dataSource.collection.
 */
customReportRouter.post(
  '/custom-reports/generate',
  ah(async (req, res) => {
    const { reportId, parameters = {}, data: bodyData } = req.body || {};
    if (!reportId) return res.status(400).json({ error: 'reportId required' });

    const item = await getDocument('custom_reports', reportId);
    if (!item) return res.status(404).json({ error: 'Report not found' });

    const reportDef = item as any;
    let data = Array.isArray(bodyData) ? bodyData : null;

    if (!data && reportDef.dataSource?.type === 'collection' && reportDef.dataSource.collection) {
      data = await listCollection(reportDef.dataSource.collection);
    }
    if (!data) data = [];

    // Dynamic import path when integrated:
    // const { CustomReportGenerator } = await import('../engine/CustomReportGenerator.ts');
    // For now return structured payload; client can render with CustomReportGenerator.
    res.json({
      reportDef,
      data,
      parameters,
      note: 'Use CustomReportGenerator on client or import engine here after files are copied.',
    });
  })
);
