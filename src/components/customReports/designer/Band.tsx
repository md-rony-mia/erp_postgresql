import React from 'react';
import { ComponentBox } from './ComponentBox';
import type { ReportComponent } from '../../../types/customReport.types';

interface BandProps {
  id: string;
  label: string;
  height: number;
  components: ReportComponent[];
  isActive: boolean;
  onSelect: () => void;
  onUpdate: (data: { height: number }) => void;
  selectedComponent: string | null;
  onComponentSelect: (id: string | null) => void;
}

export const Band: React.FC<BandProps> = ({
  label,
  height,
  components,
  isActive,
  onSelect,
  onUpdate,
  selectedComponent,
  onComponentSelect,
}) => {
  return (
    <div
      className={`relative rounded border-2 bg-white transition-all ${
        isActive ? 'border-indigo-500 shadow-sm' : 'border-slate-200'
      }`}
      style={{ minHeight: Math.max(height, 28) }}
      onClick={() => onSelect()}
    >
      <div className="absolute -top-2.5 left-2 bg-white px-1.5 text-[10px] font-semibold text-slate-500">
        {label} · {height}px
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-1.5 cursor-row-resize bg-slate-100 hover:bg-indigo-400 rounded-b"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const startY = e.clientY;
          const startHeight = height;
          const onMouseMove = (ev: MouseEvent) => {
            const newHeight = Math.max(20, startHeight + (ev.clientY - startY));
            onUpdate({ height: newHeight });
          };
          const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
          };
          document.addEventListener('mousemove', onMouseMove);
          document.addEventListener('mouseup', onMouseUp);
        }}
      />

      <div className="relative p-2" style={{ minHeight: height }}>
        {components.map((comp) => (
          <ComponentBox
            key={comp.id}
            {...comp}
            isSelected={selectedComponent === comp.id}
            onSelect={() => onComponentSelect(comp.id)}
          />
        ))}
        {isActive && components.length === 0 && (
          <div className="flex h-full min-h-[24px] items-center justify-center border border-dashed border-indigo-200 rounded text-[11px] text-slate-400">
            Active band — add components from toolbox
          </div>
        )}
      </div>
    </div>
  );
};
