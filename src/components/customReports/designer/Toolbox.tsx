import React from 'react';
import { Type, Database, Minus, Square, Image, BarChart3, FileStack } from 'lucide-react';

export type ToolboxItemType =
  | 'text'
  | 'field'
  | 'line'
  | 'box'
  | 'image'
  | 'chart'
  | 'subReport';

const ITEMS: { type: ToolboxItemType; label: string; icon: React.ReactNode }[] = [
  { type: 'text', label: 'Text Label', icon: <Type className="h-4 w-4" /> },
  { type: 'field', label: 'Data Field', icon: <Database className="h-4 w-4" /> },
  { type: 'line', label: 'Line', icon: <Minus className="h-4 w-4" /> },
  { type: 'box', label: 'Box', icon: <Square className="h-4 w-4" /> },
  { type: 'image', label: 'Image', icon: <Image className="h-4 w-4" /> },
  { type: 'chart', label: 'Chart', icon: <BarChart3 className="h-4 w-4" /> },
  { type: 'subReport', label: 'Sub Report', icon: <FileStack className="h-4 w-4" /> },
];

interface ToolboxProps {
  className?: string;
  onAdd: (type: ToolboxItemType) => void;
}

export const Toolbox: React.FC<ToolboxProps> = ({ className = '', onAdd }) => {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
        Toolbox
      </h3>
      {ITEMS.map((item) => (
        <button
          key={item.type}
          type="button"
          onClick={() => onAdd(item.type)}
          className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-xs font-medium text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
        >
          <span className="text-slate-500">{item.icon}</span>
          {item.label}
        </button>
      ))}
      <p className="mt-3 text-[10px] text-slate-400 leading-relaxed">
        Click an item to place it on the active band. Select a component to edit properties on the right.
      </p>
    </div>
  );
};
