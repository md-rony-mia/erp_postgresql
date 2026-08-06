// jsreport-* packages ship no TypeScript types. These are used only as opaque
// extension factories passed to jsreport-core's `.use()`, so `any` is sufficient here.
declare module 'jsreport-core';
declare module 'jsreport-express';
declare module 'jsreport-handlebars';
declare module 'jsreport-fs-store';
declare module 'jsreport-chrome-pdf';
declare module 'jsreport-html-to-xlsx';
declare module 'jsreport-studio';
