import React, { useState } from 'react';
import type { ReportParameter } from '../../../types/customReport.types';
import { Plus, Trash2 } from 'lucide-react';

interface ParameterPanelProps {
  parameters: ReportParameter[];
  onChange: (params: ReportParameter[]) => void;
  className?: string;
}

export const ParameterPanel: React.FC<ParameterPanelProps> = ({
  parameters,
  onChange,
  className = '',
}) => {
  const [open, setOpen] = useState(false);

  const add = () => {
    onChange([
      ...parameters,
      {
        name: `param_${parameters.length + 1}`,
        label: `Parameter ${parameters.length + 1}`,
        type: 'string',
        required: false,
      },
    ]);
  };

  const update = (index: number, patch: Partial<ReportParameter>) => {
    const next = [...parameters];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const remove = (index: number) => {
    onChange(parameters.filter((_, i) => i !== index));
  };

  return (
    <div className={`border-t border-slate-200 bg-white ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-50"
      >
        Parameters ({parameters.length})
        <span>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="max-h-40 space-y-2 overflow-y-auto px-3 pb-3">
          {parameters.map((param, i) => (
            <div key={i} className="flex items-start gap-1 rounded border border-slate-100 p-2">
              <div className="flex-1 space-y-1">
                <input
                  value={param.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                  placeholder="name"
                  className="w-full rounded border border-slate-200 px-1.5 py-0.5 text-[11px]"
                />
                <input
                  value={param.label}
                  onChange={(e) => update(i, { label: e.target.value })}
                  placeholder="label"
                  className="w-full rounded border border-slate-200 px-1.5 py-0.5 text-[11px]"
                />
                <select
                  value={param.type}
                  onChange={(e) =>
                    update(i, { type: e.target.value as ReportParameter['type'] })
                  }
                  className="w-full rounded border border-slate-200 px-1.5 py-0.5 text-[11px]"
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="boolean">Boolean</option>
                </select>
              </div>
              <button type="button" onClick={() => remove(i)} className="text-red-500 p-1">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={add}
            className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:underline"
          >
            <Plus className="h-3.5 w-3.5" /> Add parameter
          </button>
        </div>
      )}
    </div>
  );
};
