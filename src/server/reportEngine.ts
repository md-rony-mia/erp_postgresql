import express, { type Express } from 'express';
// jsreport packages are CommonJS-only; import as default and call as factory functions.
import jsreportCore from 'jsreport-core';
import jsreportExpress from 'jsreport-express';
import jsreportHandlebars from 'jsreport-handlebars';
import jsreportFsStore from 'jsreport-fs-store';
import jsreportChromePdf from 'jsreport-chrome-pdf';
import jsreportHtmlToXlsx from 'jsreport-html-to-xlsx';
import jsreportStudio from 'jsreport-studio';
import jsreportTemplates from 'jsreport-templates';
import path from 'path';

/**
 * Nexova ERP report engine (replaces the old print-only RDL builder).
 *
 * Runs jsreport-core as an isolated sub-app mounted at /jsreport, so its internal
 * routes (/api/report, /api/version, /odata, ...) never collide with our own /api
 * router in src/server/routes.ts.
 *
 * IMPORTANT: jsreport-express calls old-style Express route patterns (app.options('*', ...))
 * that break under Express 5 / path-to-regexp 8.x. This only works because this project
 * pins "express": "4.21.2" (bundled path-to-regexp 0.1.x). Do not upgrade the top-level
 * express dependency to 5.x without re-testing this module.
 *
 * Template storage: jsreport-fs-store keeps report definitions as files under
 * <rootDirectory>/data/jsreport. That folder is NOT the Postgres `documents` table used
 * elsewhere in this app — it's jsreport's own store. Mount a persistent volume at that
 * path in production (Render/Railway/VPS), or migrate to a custom Postgres store
 * provider later if you need templates to live alongside the rest of the app data.
 */

let reporterInitPromise: Promise<any> | null = null;

export function createReportEngineApp(): { app: Express; ready: Promise<any> } {
  const jsreportApp = express();

  const reporter = jsreportCore({
    rootDirectory: path.join(process.cwd(), 'data', 'jsreport'),
    // jsreport-core normally infers this from Node's legacy `module.parent`, which is
    // always undefined under ESM (this project runs on tsx/ESM, not CommonJS `require`).
    // Without this explicit value jsreport-core throws at construction time.
    parentModuleDirectory: process.cwd(),
    discover: false,
    // jsreport-studio hardcodes its HTML page to reference assets at an absolute path
    // (e.g. "/studio/assets/client.<hash>.js"). Since this whole reporter is mounted
    // under /jsreport in server.ts, without appPath those asset requests land on
    // "/studio/assets/..." at the ERP app root, which the SPA's catch-all route
    // (app.get('*', ...) in server.ts) answers with index.html instead of the real
    // JS/CSS — so Studio silently fails to boot and the browser tab ends up running
    // the main ERP React app (landing on the default Executive Dashboard route).
    // appPath tells jsreport-express/jsreport-studio to prefix generated asset URLs
    // with /jsreport/ so they resolve correctly. Do NOT also set mountOnAppPath —
    // that would make jsreport-express mount itself under /jsreport a second time,
    // double-prefixing routes, since we already mount jsreportApp at /jsreport
    // ourselves via app.use("/jsreport", reportEngineApp) in server.ts.
    appPath: '/jsreport/',
    extensions: {
      express: { app: jsreportApp, start: false },
    },
  });

  reporter.use(jsreportExpress());
  reporter.use(jsreportTemplates());
  reporter.use(jsreportHandlebars());
  reporter.use(jsreportFsStore());
  reporter.use(jsreportChromePdf());
  reporter.use(jsreportHtmlToXlsx());
  reporter.use(jsreportStudio());

  const ready: Promise<any> = reporter.init().catch((err: unknown) => {
    console.error('jsreport failed to initialize — report engine will be unavailable:', err);
    throw err;
  });
  reporterInitPromise = ready;

  return { app: jsreportApp, ready };
}

export function getReportEngineReady(): Promise<any> {
  if (!reporterInitPromise) {
    throw new Error('createReportEngineApp() must be called before getReportEngineReady()');
  }
  return reporterInitPromise;
}
