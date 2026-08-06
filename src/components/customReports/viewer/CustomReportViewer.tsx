import React, { useEffect, useState, useMemo } from 'react';
import { CustomReportGenerator } from '../../../engine/CustomReportGenerator';
import { CustomExcelExporter } from '../../../engine/CustomExcelExporter';
import type { CustomReportDefinition, ReportParameter } from '../../../types/customReport.types';
import { Download, FileSpreadsheet, Printer, Loader2 } from 'lucide-react';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('nexova_token') || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface CustomReportViewerProps {
  reportId: string;
  /** Optional in-memory rows; otherwise loads from dataSource.collection */
  dataOverride?: Record<string, unknown>[];
  onClose?: () => void;
}

export const CustomReportViewer: React.FC<CustomReportViewerProps> = ({
  reportId,
  dataOverride,
  onClose,
}) => {
  const [reportDef, setReportDef] = useState<CustomReportDefinition | null>(null);
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [parameters, setParameters] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/data/custom_reports/${reportId}`, {
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error('Report definition not found');
        const json = await res.json();
        const def = json.item as CustomReportDefinition;
        if (cancelled) return;
        setReportDef(def);

        const defaults: Record<string, unknown> = {};
        (def.parameters || []).forEach((p: ReportParameter) => {
          if (p.defaultValue !== undefined) defaults[p.name] = p.defaultValue;
        });
        setParameters(defaults);

        if (dataOverride) {
          setData(dataOverride);
        } else if (def.dataSource.type === 'collection' && def.dataSource.collection) {
          const dres = await fetch(`/api/data/${def.dataSource.collection}`, {
            headers: authHeaders(),
          });
          if (dres.ok) {
            const djson = await dres.json();
            if (!cancelled) setData((djson.items || []) as Record<string, unknown>[]);
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Load failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reportId, dataOverride]);

  const html = useMemo(() => {
    if (!reportDef) return '';
    try {
      return new CustomReportGenerator(reportDef, data, parameters).generate();
    } catch (e) {
      return `<pre>${e instanceof Error ? e.message : String(e)}</pre>`;
    }
  }, [reportDef, data, parameters]);

  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  const handleExcel = () => {
    if (!reportDef) return;
    CustomExcelExporter.download(reportDef, data);
  };

  const handleHtmlDownload = () => {
    if (!reportDef) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportDef.name}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading report…
      </div>
    );
  }

  if (error || !reportDef) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error || 'Report not found'}
        {onClose && (
          <button type="button" onClick={onClose} className="ml-3 underline">
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-800">{reportDef.name}</h2>
          <p className="text-[11px] text-slate-500">
            {data.length} rows · source: {reportDef.dataSource.collection || reportDef.dataSource.type}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50"
          >
            <Printer className="h-3.5 w-3.5" /> Print / PDF
          </button>
          <button
            type="button"
            onClick={handleExcel}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
          </button>
          <button
            type="button"
            onClick={handleHtmlDownload}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" /> HTML
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-100"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {(reportDef.parameters || []).length > 0 && (
        <div className="flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-white p-3">
          {reportDef.parameters.map((param) => (
            <label key={param.name} className="text-[11px] text-slate-600">
              {param.label}
              <input
                type={param.type === 'date' ? 'date' : param.type === 'number' ? 'number' : 'text'}
                value={String(parameters[param.name] ?? '')}
                onChange={(e) =>
                  setParameters((prev) => ({
                    ...prev,
                    [param.name]:
                      param.type === 'number' ? Number(e.target.value) : e.target.value,
                  }))
                }
                className="mt-0.5 block rounded border border-slate-200 px-2 py-1 text-xs"
              />
            </label>
          ))}
        </div>
      )}

      <iframe
        title="Report output"
        srcDoc={html}
        className="min-h-[520px] w-full rounded-lg border border-slate-200 bg-white"
        sandbox="allow-same-origin"
      />
    </div>
  );
};

export default CustomReportViewer;
