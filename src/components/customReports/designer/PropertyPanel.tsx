import React from 'react';
import type { ReportComponent, Field } from '../../../types/customReport.types';

interface PropertyPanelProps {
  component: ReportComponent | null;
  fields: Field[];
  onUpdate: (id: string, patch: Partial<ReportComponent>) => void;
  onRemove: (id: string) => void;
  className?: string;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  component,
  fields,
  onUpdate,
  onRemove,
  className = '',
}) => {
  if (!component) {
    return (
      <div className={className}>
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          Properties
        </h3>
        <p className="text-xs text-slate-400">Select a component to edit its properties.</p>
      </div>
    );
  }

  const p = component.properties;

  const setProp = (key: string, value: unknown) => {
    onUpdate(component.id, {
      properties: { ...p, [key]: value },
    });
  };

  return (
    <div className={`space-y-3 overflow-y-auto ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Properties · {component.type}
        </h3>
        <button
          type="button"
          onClick={() => onRemove(component.id)}
          className="text-[10px] font-medium text-red-600 hover:underline"
        >
          Delete
        </button>
      </div>

      <label className="block text-[11px] text-slate-600">
        Position X
        <input
          type="number"
          value={component.x}
          onChange={(e) => onUpdate(component.id, { x: Number(e.target.value) })}
          className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-xs"
        />
      </label>
      <label className="block text-[11px] text-slate-600">
        Position Y
        <input
          type="number"
          value={component.y}
          onChange={(e) => onUpdate(component.id, { y: Number(e.target.value) })}
          className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-xs"
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block text-[11px] text-slate-600">
          Width
          <input
            type="number"
            value={component.width}
            onChange={(e) => onUpdate(component.id, { width: Number(e.target.value) })}
            className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-xs"
          />
        </label>
        <label className="block text-[11px] text-slate-600">
          Height
          <input
            type="number"
            value={component.height}
            onChange={(e) => onUpdate(component.id, { height: Number(e.target.value) })}
            className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-xs"
          />
        </label>
      </div>

      {component.type === 'text' && (
        <label className="block text-[11px] text-slate-600">
          Text
          <textarea
            value={p.text || ''}
            onChange={(e) => setProp('text', e.target.value)}
            rows={2}
            className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-xs"
          />
        </label>
      )}

      {component.type === 'field' && (
        <>
          <label className="block text-[11px] text-slate-600">
            Field
            <select
              value={p.fieldName || ''}
              onChange={(e) => setProp('fieldName', e.target.value)}
              className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-xs"
            >
              <option value="">— select —</option>
              {fields.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[11px] text-slate-600">
            Format
            <select
              value={p.format || ''}
              onChange={(e) => setProp('format', e.target.value)}
              className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-xs"
            >
              <option value="">Default</option>
              <option value="currency">Currency (৳)</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
            </select>
          </label>
        </>
      )}

      <label className="block text-[11px] text-slate-600">
        Font size
        <input
          type="number"
          value={p.font?.size || 12}
          onChange={(e) =>
            setProp('font', { name: p.font?.name || 'Arial', size: Number(e.target.value), bold: p.font?.bold, italic: p.font?.italic })
          }
          className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-xs"
        />
      </label>

      <div className="flex gap-3">
        <label className="flex items-center gap-1 text-[11px] text-slate-600">
          <input
            type="checkbox"
            checked={!!p.font?.bold}
            onChange={(e) =>
              setProp('font', {
                name: p.font?.name || 'Arial',
                size: p.font?.size || 12,
                bold: e.target.checked,
                italic: p.font?.italic,
              })
            }
          />
          Bold
        </label>
        <label className="flex items-center gap-1 text-[11px] text-slate-600">
          <input
            type="checkbox"
            checked={!!p.font?.italic}
            onChange={(e) =>
              setProp('font', {
                name: p.font?.name || 'Arial',
                size: p.font?.size || 12,
                bold: p.font?.bold,
                italic: e.target.checked,
              })
            }
          />
          Italic
        </label>
      </div>

      <label className="block text-[11px] text-slate-600">
        Text color
        <input
          type="color"
          value={p.color || '#1e293b'}
          onChange={(e) => setProp('color', e.target.value)}
          className="mt-0.5 h-8 w-full rounded border border-slate-200"
        />
      </label>

      <label className="block text-[11px] text-slate-600">
        Align
        <select
          value={p.alignment || 'left'}
          onChange={(e) => setProp('alignment', e.target.value)}
          className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-xs"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </label>
    </div>
  );
};
