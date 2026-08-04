import React, { useState, useEffect } from 'react';
import {
  Building,
  TrendingUp,
  Cpu,
  ShieldAlert,
  Sliders
} from 'lucide-react';
import PageStandardsWrapper from './PageStandardsWrapper';
import UniversalCrudEngine from './UniversalCrudEngine';
import { FIXED_ASSETS_CONFIG } from '../metadata/configs';

interface FixedAssetsViewProps {
  activeSubTab?: string;
  currentUser?: {
    name?: string;
    role?: string;
    email?: string;
  };
}

export default function FixedAssetsView({ activeSubTab = 'assets', currentUser }: FixedAssetsViewProps) {
  const [metrics, setMetrics] = useState({
    totalValue: 0,
    totalAssets: 0,
    depreciationThisMonth: 0,
    maintenanceRequired: 0
  });

  const loadMetrics = () => {
    try {
      const raw = localStorage.getItem('nexova_crud_assets');
      const assets = raw ? JSON.parse(raw) : [];

      const totalValue = assets.reduce((sum: number, a: any) => sum + (Number(a.purchasePrice) || 0), 0);
      const totalAssets = assets.length;
      const depreciationThisMonth = Math.floor(totalValue * 0.015);
      const maintenanceRequired = assets.filter((a: any) => a.condition === 'In Maintenance').length;

      setMetrics({
        totalValue,
        totalAssets,
        depreciationThisMonth,
        maintenanceRequired
      });
    } catch (e) {
      // Fallback
    }
  };

  useEffect(() => {
    loadMetrics();
    window.addEventListener('storage', loadMetrics);
    return () => window.removeEventListener('storage', loadMetrics);
  }, []);

  return (
    <PageStandardsWrapper
      title="Corporate Fixed Asset & Capital Ledger"
      subtitle="Govern hardware registries, track physical asset barcodes, calculate formula depreciation values, and capture secure signatures."
      loading={false}
      error={null}
      currentUser={currentUser}
      permissionRoles={['Administrator', 'Manager']}
      breadcrumbs={[
        { label: 'Nexova ERP', onClick: () => {} },
        { label: 'Asset & Capital Ledger', active: true },
      ]}
    >
      <div className="space-y-6">
        {/* ASSET LEDGER METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/60 p-4 rounded-xl shadow-sm space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Governed Assets</div>
            <div className="text-xl font-extrabold text-slate-800">{metrics.totalAssets} Registered</div>
            <div className="text-[11px] text-indigo-500 font-medium">Under active lifecycle audit</div>
          </div>
          <div className="bg-white border border-slate-200/60 p-4 rounded-xl shadow-sm space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Aggregated Net Value</div>
            <div className="text-xl font-extrabold text-slate-800">৳{metrics.totalValue.toLocaleString()} BDT</div>
            <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Formula depreciated value
            </div>
          </div>
          <div className="bg-white border border-slate-200/60 p-4 rounded-xl shadow-sm space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Estimated Depreciation</div>
            <div className="text-xl font-extrabold text-rose-600">৳{metrics.depreciationThisMonth.toLocaleString()} BDT</div>
            <div className="text-[11px] text-rose-500 font-medium">Automated monthly write-offs</div>
          </div>
          <div className="bg-white border border-slate-200/60 p-4 rounded-xl shadow-sm space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Silo Maintenance Issues</div>
            <div className="text-xl font-extrabold text-indigo-600">{metrics.maintenanceRequired} Criticals</div>
            <div className="text-[11px] text-slate-400">Requiring technician service</div>
          </div>
        </div>

        {/* CORE CRUD RENDERER */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4">
          <UniversalCrudEngine
            config={FIXED_ASSETS_CONFIG}
            currentUser={currentUser}
            onDataChange={loadMetrics}
          />
        </div>
      </div>
    </PageStandardsWrapper>
  );
}
