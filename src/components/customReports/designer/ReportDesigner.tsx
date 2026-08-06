import React, { useState, useCallback } from 'react';
import { BandList } from './BandList';
import { Toolbox, type ToolboxItemType } from './Toolbox';
import { PropertyPanel } from './PropertyPanel';
import { ParameterPanel } from './ParameterPanel';
import { PreviewPane } from './PreviewPane';
import { useCustomReport } from '../../../hooks/useCustomReport';
import type { ReportComponent } from '../../../types/customReport.types';
import { Save, Eye, Pencil, Plus } from 'lucide-react';

function findComponent(
  reportDef: { bands: Record<string, { components?: ReportComponent[] }> },
  id: string
): ReportComponent | null {
  for (const band of Object.values(reportDef.bands)) {
    const comp = band.components?.find((c) => c.id === id);
    if (comp) return comp;
  }
  return null;
}

interface ReportDesignerProps {
  reportId?: string;
  onBack?: () => void;
}

export const ReportDesigner: React.FC<ReportDesignerProps> = ({ reportId, onBack }) => {
  const {
    reportDef,
    loading,
    error,
    updateBand,
    addComponent,
    updateComponent,
    removeComponent,
    setReportName,
    setReportDef,
    saveReport,
    newReport,
  } = useCustomReport(reportId);

  const [activeBand, setActiveBand] = useState('detail');
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleAddFromToolbox = useCallback(
    (type: ToolboxItemType) => {
      if (!reportDef) return;
      const defaults: Record<ToolboxItemType, Partial<ReportComponent>> = {
        text: {
          type: 'text',
          x: 8,
          y: 4,
          width: 160,
          height: 20,
          properties: { text: 'Label', font: { name: 'Arial', size: 12 } },
        },
        field: {
          type: 'field',
          x: 8,
          y: 4,
          width: 120,
          height: 20,
          properties: {
            fieldName: reportDef.dataSource.fields[0]?.name || 'total',
            font: { name: 'Arial', size: 12 },
            format: 'currency',
          },
        },
        line: {
          type: 'line',
          x: 0,
          y: 10,
          width: 400,
          height: 2,
          properties: { color: '#000000', border: { color: '#000', width: 1, style: 'solid' } },
        },
        box: {
          type: 'box',
          x: 8,
          y: 4,
          width: 100,
          height: 40,
          properties: {
            border: { color: '#94a3b8', width: 1, style: 'solid' },
            backgroundColor: 'transparent',
          },
        },
        image: {
          type: 'image',
          x: 8,
          y: 4,
          width: 80,
          height: 40,
          properties: {},
        },
        chart: {
          type: 'chart',
          x: 8,
          y: 4,
          width: 200,
          height: 120,
          properties: { chartType: 'bar' },
        },
        subReport: {
          type: 'subReport',
          x: 8,
          y: 4,
          width: 200,
          height: 60,
          properties: { subReportId: '' },
        },
      };
      const base = defaults[type];
      addComponent(activeBand, base as Omit<ReportComponent, 'id'>);
    },
    [reportDef, activeBand, addComponent]
  );

  if (!reportDef) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        {loading ? 'Loading…' : 'No report loaded'}
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[520px] flex-col rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              ← Back
            </button>
          )}
          <input
            value={reportDef.name}
            onChange={(e) => setReportName(e.target.value)}
            className="rounded border border-transparent bg-transparent px-1 text-sm font-bold text-slate-800 hover:border-slate-200 focus:border-indigo-400 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              newReport();
              setSelectedComponent(null);
            }}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Plus className="h-3.5 w-3.5" /> New
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            {showPreview ? (
              <>
                <Pencil className="h-3.5 w-3.5" /> Design
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" /> Preview
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => saveReport()}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" /> Save
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 px-3 py-1.5 text-xs text-red-700 border-b border-red-100">
          {error}
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        {!showPreview && (
          <Toolbox
            className="w-44 shrink-0 border-r border-slate-200 bg-white p-3 overflow-y-auto"
            onAdd={handleAddFromToolbox}
          />
        )}

        <div className="flex-1 overflow-auto p-4">
          {showPreview ? (
            <PreviewPane reportDef={reportDef} />
          ) : (
            <BandList
              bands={reportDef.bands}
              activeBand={activeBand}
              onBandSelect={setActiveBand}
              onBandUpdate={updateBand}
              selectedComponent={selectedComponent}
              onComponentSelect={setSelectedComponent}
            />
          )}
        </div>

        {!showPreview && (
          <div className="flex w-64 shrink-0 flex-col border-l border-slate-200 bg-white">
            <PropertyPanel
              className="flex-1 p-3"
              component={
                selectedComponent ? findComponent(reportDef, selectedComponent) : null
              }
              fields={reportDef.dataSource.fields}
              onUpdate={updateComponent}
              onRemove={(id) => {
                removeComponent(id);
                setSelectedComponent(null);
              }}
            />
            <ParameterPanel
              parameters={reportDef.parameters}
              onChange={(parameters) =>
                setReportDef({ ...reportDef, parameters })
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportDesigner;
