import React, { useMemo } from 'react';
import { CustomReportGenerator } from '../../../engine/CustomReportGenerator';
import type { CustomReportDefinition } from '../../../types/customReport.types';

interface PreviewPaneProps {
  reportDef: CustomReportDefinition;
  sampleData?: Record<string, unknown>[];
}

const DEFAULT_SAMPLE: Record<string, unknown>[] = [
  {
    invoiceNo: 'INV-001',
    customerName: 'Sample Customer',
    date: '2026-08-01',
    total: 15000,
  },
  {
    invoiceNo: 'INV-002',
    customerName: 'Demo Traders',
    date: '2026-08-02',
    total: 8500.5,
  },
];

export const PreviewPane: React.FC<PreviewPaneProps> = ({
  reportDef,
  sampleData = DEFAULT_SAMPLE,
}) => {
  const html = useMemo(() => {
    try {
      const gen = new CustomReportGenerator(reportDef, sampleData, {});
      return gen.generate();
    } catch (e) {
      return `<pre>Preview error: ${e instanceof Error ? e.message : String(e)}</pre>`;
    }
  }, [reportDef, sampleData]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <div className="bg-slate-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b">
        Live Preview (sample data)
      </div>
      <iframe
        title="Report preview"
        srcDoc={html}
        className="w-full min-h-[480px] border-0 bg-white"
        sandbox="allow-same-origin"
      />
    </div>
  );
};
