import React, { useState } from 'react';
import { ReportDesigner } from './designer/ReportDesigner';
import { CustomReportViewer } from './viewer/CustomReportViewer';
import { useCustomReport } from '../../hooks/useCustomReport';
import { FileText, Pencil, Play, Plus, Trash2, Loader2 } from 'lucide-react';

/**
 * Standalone hub for Crystal-style custom reports.
 * Mount this from Sidebar / App when tab = 'custom-reports' (or open as a window).
 * Does NOT replace existing ReportsView or jsreport.
 */
export default function CustomReportsHub() {
  const { list, loading, loadList, loadReport } = useCustomReport();
  const [mode, setMode] = useState<'list' | 'design' | 'run'>('list');
  const [activeId, setActiveId] = useState<string | undefined>(undefined);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this custom report definition?')) return;
    const token = localStorage.getItem('nexova_token') || localStorage.getItem('token');
    await fetch(`/api/data/custom_reports/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    loadList();
  };

  if (mode === 'design') {
    return (
      <ReportDesigner
        reportId={activeId}
        onBack={() => {
          setMode('list');
          setActiveId(undefined);
          loadList();
        }}
      />
    );
  }

  if (mode === 'run' && activeId) {
    return (
      <CustomReportViewer
        reportId={activeId}
        onClose={() => {
          setMode('list');
          setActiveId(undefined);
        }}
      />
    );
  }

  return (
    <div className="space-y-4 p-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-600" />
            Custom Report Designer
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Band-based designer (Crystal Reports style). Separate from jsreport Studio at{' '}
            <code className="text-indigo-600">/jsreport</code>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setActiveId(undefined);
            setMode('design');
          }}
          className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-3.5 w-3.5" /> New Report
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Data source</th>
              <th className="px-4 py-2.5">Updated</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && list.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                  Loading…
                </td>
              </tr>
            )}
            {!loading && list.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  No custom reports yet. Create one to get started.
                </td>
              </tr>
            )}
            {list.map((r) => (
              <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                <td className="px-4 py-2.5 font-medium text-slate-800">{r.name}</td>
                <td className="px-4 py-2.5 text-slate-500">
                  {r.dataSource?.collection || r.dataSource?.type || '—'}
                </td>
                <td className="px-4 py-2.5 text-slate-400">
                  {r.updatedAt
                    ? new Date(r.updatedAt).toLocaleString()
                    : '—'}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      title="Run"
                      onClick={() => {
                        setActiveId(r.id);
                        setMode('run');
                      }}
                      className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50"
                    >
                      <Play className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Design"
                      onClick={() => {
                        setActiveId(r.id);
                        setMode('design');
                        loadReport(r.id);
                      }}
                      className="rounded p-1.5 text-indigo-600 hover:bg-indigo-50"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Delete"
                      onClick={() => handleDelete(r.id)}
                      className="rounded p-1.5 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
