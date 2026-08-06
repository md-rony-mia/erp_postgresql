import React from 'react';
import type { ReportComponent } from '../../../types/customReport.types';

interface ComponentBoxProps extends ReportComponent {
  isSelected: boolean;
  onSelect: () => void;
}

export const ComponentBox: React.FC<ComponentBoxProps> = ({
  type,
  x,
  y,
  width,
  height,
  properties,
  isSelected,
  onSelect,
}) => {
  const label =
    type === 'text'
      ? properties.text || 'Text'
      : type === 'field'
        ? `{${properties.fieldName || 'field'}}`
        : type.toUpperCase();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect();
      }}
      className={`absolute cursor-pointer overflow-hidden rounded border text-[11px] leading-tight px-1 ${
        isSelected
          ? 'border-indigo-500 ring-2 ring-indigo-300 bg-indigo-50/80 z-10'
          : 'border-slate-300 bg-white/90 hover:border-slate-400'
      }`}
      style={{
        left: x,
        top: y,
        width,
        height,
        color: properties.color || '#1e293b',
        backgroundColor: properties.backgroundColor || undefined,
        fontFamily: properties.font?.name || 'Arial',
        fontSize: properties.font?.size || 12,
        fontWeight: properties.font?.bold ? 'bold' : 'normal',
        fontStyle: properties.font?.italic ? 'italic' : 'normal',
        textAlign: properties.alignment || 'left',
      }}
    >
      {label}
    </div>
  );
};
