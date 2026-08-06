import React from 'react';
import { Band } from './Band';
import type { Bands, ReportComponent } from '../../../types/customReport.types';

interface BandListProps {
  bands: Bands;
  activeBand: string;
  onBandSelect: (band: string) => void;
  onBandUpdate: (band: string, data: { height: number }) => void;
  selectedComponent: string | null;
  onComponentSelect: (id: string | null) => void;
}

const BAND_ORDER = [
  'reportHeader',
  'pageHeader',
  'groupHeader',
  'detail',
  'groupFooter',
  'pageFooter',
  'reportFooter',
] as const;

const BAND_LABELS: Record<string, string> = {
  reportHeader: 'Report Header',
  pageHeader: 'Page Header',
  groupHeader: 'Group Header',
  detail: 'Detail',
  groupFooter: 'Group Footer',
  pageFooter: 'Page Footer',
  reportFooter: 'Report Footer',
};

export const BandList: React.FC<BandListProps> = ({
  bands,
  activeBand,
  onBandSelect,
  onBandUpdate,
  selectedComponent,
  onComponentSelect,
}) => {
  return (
    <div className="space-y-3">
      {BAND_ORDER.map((bandKey) => {
        const band = bands[bandKey as keyof Bands];
        if (!band) return null;
        return (
          <Band
            key={bandKey}
            id={bandKey}
            label={BAND_LABELS[bandKey]}
            height={band.height}
            components={(band.components || []) as ReportComponent[]}
            isActive={activeBand === bandKey}
            onSelect={() => onBandSelect(bandKey)}
            onUpdate={(data) => onBandUpdate(bandKey, data)}
            selectedComponent={selectedComponent}
            onComponentSelect={onComponentSelect}
          />
        );
      })}
    </div>
  );
};
