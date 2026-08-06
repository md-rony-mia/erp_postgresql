import { useState, useEffect, useCallback } from 'react';
import {
  CustomReportDefinition,
  createEmptyReport,
  ReportComponent,
} from '../types/customReport.types';

const COLLECTION = 'custom_reports';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('nexova_token') || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Loads / saves band-based custom reports via existing /api/data/:collection API.
 */
export function useCustomReport(reportId?: string) {
  const [reportDef, setReportDef] = useState<CustomReportDefinition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [list, setList] = useState<CustomReportDefinition[]>([]);

  const loadList = useCallback(async () => {
    try {
      const res = await fetch(`/api/data/${COLLECTION}`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to list reports');
      const data = await res.json();
      setList((data.items || []) as CustomReportDefinition[]);
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const loadReport = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/data/${COLLECTION}/${id}`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Report not found');
      const data = await res.json();
      const item = data.item as CustomReportDefinition;
      setReportDef(item);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
    if (reportId) {
      loadReport(reportId);
    } else {
      setReportDef(createEmptyReport());
    }
  }, [reportId, loadList, loadReport]);

  const updateBand = useCallback((bandName: string, data: Partial<{ height: number; components: ReportComponent[] }>) => {
    setReportDef((prev) => {
      if (!prev) return prev;
      const band = prev.bands[bandName as keyof typeof prev.bands];
      if (!band) return prev;
      return {
        ...prev,
        bands: {
          ...prev.bands,
          [bandName]: { ...band, ...data },
        },
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const addComponent = useCallback((bandName: string, component: Omit<ReportComponent, 'id'>) => {
    setReportDef((prev) => {
      if (!prev) return prev;
      const band = prev.bands[bandName as keyof typeof prev.bands];
      if (!band) return prev;
      const newComp: ReportComponent = {
        ...component,
        id: `comp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      };
      return {
        ...prev,
        bands: {
          ...prev.bands,
          [bandName]: {
            ...band,
            components: [...(band.components || []), newComp],
          },
        },
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const updateComponent = useCallback((componentId: string, patch: Partial<ReportComponent>) => {
    setReportDef((prev) => {
      if (!prev) return prev;
      const newBands = { ...prev.bands };
      for (const key of Object.keys(newBands) as (keyof typeof newBands)[]) {
        const band = newBands[key];
        if (!band?.components) continue;
        const idx = band.components.findIndex((c) => c.id === componentId);
        if (idx !== -1) {
          const components = [...band.components];
          components[idx] = {
            ...components[idx],
            ...patch,
            properties: {
              ...components[idx].properties,
              ...(patch.properties || {}),
            },
          };
          newBands[key] = { ...band, components };
          break;
        }
      }
      return { ...prev, bands: newBands, updatedAt: new Date().toISOString() };
    });
  }, []);

  const removeComponent = useCallback((componentId: string) => {
    setReportDef((prev) => {
      if (!prev) return prev;
      const newBands = { ...prev.bands };
      for (const key of Object.keys(newBands) as (keyof typeof newBands)[]) {
        const band = newBands[key];
        if (!band?.components) continue;
        newBands[key] = {
          ...band,
          components: band.components.filter((c) => c.id !== componentId),
        };
      }
      return { ...prev, bands: newBands, updatedAt: new Date().toISOString() };
    });
  }, []);

  const setReportName = useCallback((name: string) => {
    setReportDef((prev) => (prev ? { ...prev, name } : prev));
  }, []);

  const setDataSource = useCallback((dataSource: CustomReportDefinition['dataSource']) => {
    setReportDef((prev) => (prev ? { ...prev, dataSource } : prev));
  }, []);

  const saveReport = useCallback(async () => {
    if (!reportDef) return;
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...reportDef,
        id: reportDef.id,
        updatedAt: new Date().toISOString(),
      };
      const res = await fetch(`/api/data/${COLLECTION}/doc`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save report');
      const data = await res.json();
      setReportDef(data.item as CustomReportDefinition);
      await loadList();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  }, [reportDef, loadList]);

  const newReport = useCallback(() => {
    setReportDef(createEmptyReport());
  }, []);

  return {
    reportDef,
    setReportDef,
    list,
    loading,
    error,
    updateBand,
    addComponent,
    updateComponent,
    removeComponent,
    setReportName,
    setDataSource,
    saveReport,
    loadReport,
    loadList,
    newReport,
  };
}
