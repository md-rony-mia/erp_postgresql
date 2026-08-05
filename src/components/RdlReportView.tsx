import React, { useState, useEffect } from 'react';
import { seedCollectionIfEmpty, syncCollectionToFirestore } from '../lib/dataClient';
import {
  Product,
  Invoice,
  Customer,
  Supplier,
  Transaction,
} from '../types';
import {
  FileText,
  Plus,
  Trash2,
  Printer,
  ChevronDown,
  Play,
  Save,
  Type,
  Table,
  BarChart,
  Layout,
  Sliders,
  Maximize,
  Briefcase,
  Layers,
  Edit2,
  Code,
  GripVertical,
  FileCheck,
  Check,
  X,
  Palette,
} from 'lucide-react';

interface RdlReportViewProps {
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  invoices: Invoice[];
  transactions: Transaction[];
  isVisualEditMode?: boolean;
  currentSubTab?: string;
}

interface RdlElement {
  id: string;
  type: 'textbox' | 'table' | 'chart' | 'divider' | 'image';
  content: string; // Dynamic formula/expression (e.g. "=Sum(Fields!price.Value * Fields!stock.Value)") or plain text
  style: {
    fontSize: string;
    fontWeight: string;
    textAlign: 'left' | 'center' | 'right';
    color: string;
    bgColor: string;
    padding: string;
    borderWidth: string;
    borderColor: string;
    borderRadius: string;
  };
  tableConfig?: {
    dataset: 'products' | 'invoices' | 'customers' | 'suppliers' | 'transactions';
    columns: string[];
    showFooter: boolean;
  };
  chartConfig?: {
    dataset: 'products' | 'invoices' | 'transactions';
    type: 'bar' | 'line';
    xKey: string;
    yKey: string;
  };
}

interface RdlTemplate {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  pageSize: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  margins: { top: number; bottom: number; left: number; right: number };
  elements: RdlElement[];
}

export default function RdlReportView({
  products,
  customers,
  suppliers,
  invoices,
  transactions,
  isVisualEditMode = false,
  currentSubTab = 'report_manager',
}: RdlReportViewProps) {
  // Pre-loaded templates matching famous business layouts
  const initialTemplates: RdlTemplate[] = [
    {
      id: 'rdl_t1',
      name: 'Corporate Inventory Valuation Balance Sheet',
      category: 'Accounting Reports',
      subcategory: 'Auditing & Assets',
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 15, bottom: 15, left: 15, right: 15 },
      elements: [
        {
          id: 'e1',
          type: 'textbox',
          content: 'M/S MADANI TRADERS AUDITING FIRM',
          style: { fontSize: 'text-lg', fontWeight: 'font-black', textAlign: 'center', color: '#1e3a8a', bgColor: '#f8fafc', padding: 'p-3', borderWidth: 'border-b-2', borderColor: '#cbd5e1', borderRadius: 'rounded-none' },
        },
        {
          id: 'e2',
          type: 'textbox',
          content: 'Unified Valuation Report on Product Catalogs & Vault Asset Equilibrium',
          style: { fontSize: 'text-xs', fontWeight: 'font-semibold', textAlign: 'center', color: '#64748b', bgColor: 'transparent', padding: 'p-1', borderWidth: 'border-none', borderColor: '', borderRadius: 'rounded-none' },
        },
        {
          id: 'e3',
          type: 'textbox',
          content: 'Run Time: =Now()',
          style: { fontSize: 'text-[10px]', fontWeight: 'font-bold', textAlign: 'right', color: '#4f46e5', bgColor: 'transparent', padding: 'p-0', borderWidth: 'border-none', borderColor: '', borderRadius: 'rounded-none' },
        },
        {
          id: 'e4',
          type: 'textbox',
          content: 'Total Catalog SKUs: =Count(Fields!id.Value) items | Total Stock Balance: =Sum(Fields!stock.Value) physical units',
          style: { fontSize: 'text-xs', fontWeight: 'font-bold', textAlign: 'left', color: '#0f172a', bgColor: '#eff6ff', padding: 'p-3', borderWidth: 'border', borderColor: '#bfdbfe', borderRadius: 'rounded-lg' },
        },
        {
          id: 'e5',
          type: 'textbox',
          content: 'Estimated Asset Valuation: ="৳" & Sum(Fields!price.Value * Fields!stock.Value) (at wholesale rate)',
          style: { fontSize: 'text-sm', fontWeight: 'font-black', textAlign: 'left', color: '#047857', bgColor: '#ecfdf5', padding: 'p-3', borderWidth: 'border', borderColor: '#a7f3d0', borderRadius: 'rounded-lg' },
        },
        {
          id: 'e6',
          type: 'table',
          content: '',
          style: { fontSize: 'text-xs', fontWeight: 'font-medium', textAlign: 'left', color: '', bgColor: '', padding: '', borderWidth: '', borderColor: '', borderRadius: '' },
          tableConfig: {
            dataset: 'products',
            columns: ['sku', 'name', 'category', 'stock', 'price', 'cost'],
            showFooter: true,
          },
        },
      ],
    },
    {
      id: 'rdl_t2',
      name: 'Dynamic Financial Invoiced Revenue Summary',
      category: 'Sales Reports',
      subcategory: 'Taxation Registers',
      pageSize: 'Letter',
      orientation: 'portrait',
      margins: { top: 10, bottom: 10, left: 10, right: 10 },
      elements: [
        {
          id: 'ea1',
          type: 'textbox',
          content: 'INVOICED REVENUE & ACCUMULATED TAX REPORT',
          style: { fontSize: 'text-xl', fontWeight: 'font-black', textAlign: 'center', color: '#b91c1c', bgColor: '#fef2f2', padding: 'p-4', borderWidth: 'border-2', borderColor: '#fca5a5', borderRadius: 'rounded-xl' },
        },
        {
          id: 'ea2',
          type: 'textbox',
          content: 'Total Bills Count: =Count(Fields!invoiceNo.Value) invoices | Grand Sales Volume: =Sum(Fields!total.Value) BDT',
          style: { fontSize: 'text-xs', fontWeight: 'font-bold', textAlign: 'center', color: '#111827', bgColor: '#f3f4f6', padding: 'p-2', borderWidth: 'border', borderColor: '#e5e7eb', borderRadius: 'rounded-lg' },
        },
        {
          id: 'ea3',
          type: 'textbox',
          content: 'Accumulated Output VAT (Tax): =Sum(Fields!taxAmount.Value) BDT',
          style: { fontSize: 'text-xs', fontWeight: 'font-bold', textAlign: 'left', color: '#b45309', bgColor: '#fffbeb', padding: 'p-2.5', borderWidth: 'border', borderColor: '#fde68a', borderRadius: 'rounded-lg' },
        },
        {
          id: 'ea4',
          type: 'table',
          content: '',
          style: { fontSize: 'text-xs', fontWeight: 'font-medium', textAlign: 'left', color: '', bgColor: '', padding: '', borderWidth: '', borderColor: '', borderRadius: '' },
          tableConfig: {
            dataset: 'invoices',
            columns: ['invoiceNo', 'customerName', 'date', 'paymentMethod', 'taxAmount', 'total'],
            showFooter: true,
          },
        },
      ],
    },
  ];

  // States
  const [templates, setTemplates] = useState<RdlTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const legacy = localStorage.getItem('nexova_rdl_templates');
        let initial = initialTemplates;
        if (legacy) {
          try { initial = JSON.parse(legacy); } catch (e) {}
        }
        const seeded = await seedCollectionIfEmpty('rdlTemplates', initial);
        setTemplates(seeded || []);
        if (legacy) {
          localStorage.removeItem('nexova_rdl_templates');
        }
      } catch (err) {
        // Intentionally silent: background local data migration fallback on component load
        console.error("RDL templates migration failed", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (loading) return;
    syncCollectionToFirestore('rdlTemplates', templates);
  }, [templates, loading]);

  const [activeSubTab, setActiveSubTab] = useState<string>(currentSubTab || 'report_manager');

  useEffect(() => {
    if (currentSubTab) {
      setActiveSubTab(currentSubTab);
    }
  }, [currentSubTab]);

  const [activeTemplateId, setActiveTemplateId] = useState<string>('rdl_t1');
  const [selectedTemplate, setSelectedTemplate] = useState<RdlTemplate>(initialTemplates[0]);

  // Visual Setup Panel States
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [draggedElementId, setDraggedElementId] = useState<string | null>(null);
  const [dragOverElementId, setDragOverElementId] = useState<string | null>(null);
  const [showExprBuilder, setShowExprBuilder] = useState(false);
  const [exprText, setExprText] = useState('');

  // RDL Categories
  const categoriesList = ['Accounting Reports', 'Sales Reports', 'Purchase Reports', 'HR & Employee Staffing'];

  useEffect(() => {
    const current = templates.find((t) => t.id === activeTemplateId);
    if (current) {
      setSelectedTemplate(current);
    }
  }, [activeTemplateId, templates]);

  // Real Expression Parser Engine
  const parseRdlExpression = (expr: string): string => {
    if (!expr.startsWith('=')) return expr; // Static string

    try {
      const formula = expr.substring(1).trim();

      // Formula 1: Now()
      if (formula.toLowerCase() === 'now()') {
        return new Date().toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        });
      }

      // Formula 2: Count(Fields!...)
      const countMatch = formula.match(/count\(fields!(.+?)\.value\)/i);
      if (countMatch) {
        const field = countMatch[1].toLowerCase();
        // Return total records of current dataset, we derive dataset from first element of elements that is a table
        const tableElement = selectedTemplate.elements.find((e) => e.type === 'table');
        const dsKey = tableElement?.tableConfig?.dataset || 'products';

        if (dsKey === 'products') return String(products.length);
        if (dsKey === 'invoices') return String(invoices.length);
        if (dsKey === 'customers') return String(customers.length);
        if (dsKey === 'suppliers') return String(suppliers.length);
        return String(transactions.length);
      }

      // Formula 3: Sum(Fields!price.Value * Fields!stock.Value)
      if (formula.toLowerCase().includes('fields!price.value * fields!stock.value')) {
        const sumVal = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
        return sumVal.toLocaleString();
      }

      // Formula 4: Sum(Fields!cost.Value * Fields!stock.Value)
      if (formula.toLowerCase().includes('fields!cost.value * fields!stock.value')) {
        const sumVal = products.reduce((sum, p) => sum + (p.cost * p.stock), 0);
        return sumVal.toLocaleString();
      }

      // Formula 5: Sum(Fields!...)
      const sumMatch = formula.match(/sum\(fields!(.+?)\.value\)/i);
      if (sumMatch) {
        const fieldName = sumMatch[1];
        const tableElement = selectedTemplate.elements.find((e) => e.type === 'table');
        const dsKey = tableElement?.tableConfig?.dataset || 'products';

        let targetData: any[] = [];
        if (dsKey === 'products') targetData = products;
        else if (dsKey === 'invoices') targetData = invoices;
        else if (dsKey === 'customers') targetData = customers;
        else if (dsKey === 'suppliers') targetData = suppliers;
        else targetData = transactions;

        const sum = targetData.reduce((acc, row) => {
          const val = parseFloat(row[fieldName]);
          return acc + (isNaN(val) ? 0 : val);
        }, 0);

        return sum.toLocaleString();
      }

      // Formula 6: Mixed expression (e.g. "Total valuation: " & Sum(...))
      if (formula.includes('&')) {
        const parts = formula.split('&');
        const parsedParts = parts.map((part) => {
          const trimmedPart = part.trim();
          if (trimmedPart.startsWith('"') && trimmedPart.endsWith('"')) {
            return trimmedPart.slice(1, -1);
          }
          return parseRdlExpression('=' + trimmedPart);
        });
        return parsedParts.join('');
      }

      return `[Expression Error: ${formula}]`;
    } catch (e) {
      return `[Expression Parse Error]`;
    }
  };

  // Dataset rows extractor helper
  const getDatasetRows = (ds: string): any[] => {
    if (ds === 'products') return products;
    if (ds === 'invoices') return invoices;
    if (ds === 'customers') return customers;
    if (ds === 'suppliers') return suppliers;
    return transactions;
  };

  // Element Addition
  const handleAddElement = (type: RdlElement['type']) => {
    const newEl: RdlElement = {
      id: `el_${Date.now()}`,
      type,
      content: type === 'textbox' ? 'Double click to enter custom text or dynamic RDL expressions' : '',
      style: {
        fontSize: 'text-xs',
        fontWeight: 'font-semibold',
        textAlign: 'left',
        color: '#334155',
        bgColor: 'transparent',
        padding: 'p-2',
        borderWidth: 'border-none',
        borderColor: '',
        borderRadius: 'rounded-none',
      },
      tableConfig: type === 'table' ? {
        dataset: 'products',
        columns: ['sku', 'name', 'stock', 'price'],
        showFooter: true,
      } : undefined,
    };

    const updatedElements = [...selectedTemplate.elements, newEl];
    const updatedTemplates = templates.map((t) => {
      if (t.id === activeTemplateId) {
        return { ...t, elements: updatedElements };
      }
      return t;
    });

    setTemplates(updatedTemplates);
    setSelectedElementId(newEl.id);
  };

  // Element Delete
  const handleDeleteElement = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedElements = selectedTemplate.elements.filter((el) => el.id !== id);
    const updatedTemplates = templates.map((t) => {
      if (t.id === activeTemplateId) {
        return { ...t, elements: updatedElements };
      }
      return t;
    });
    setTemplates(updatedTemplates);
    if (selectedElementId === id) setSelectedElementId(null);
  };

  // Element Update
  const handleUpdateElement = (updatedEl: RdlElement) => {
    const updatedElements = selectedTemplate.elements.map((el) => (el.id === updatedEl.id ? updatedEl : el));
    const updatedTemplates = templates.map((t) => {
      if (t.id === activeTemplateId) {
        return { ...t, elements: updatedElements };
      }
      return t;
    });
    setTemplates(updatedTemplates);
  };

  // Reposition an element by dragging it before/onto another element in the page flow.
  const handleReorderElement = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;
    const elements = [...selectedTemplate.elements];
    const fromIndex = elements.findIndex((el) => el.id === draggedId);
    const toIndex = elements.findIndex((el) => el.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;
    const [moved] = elements.splice(fromIndex, 1);
    elements.splice(toIndex, 0, moved);
    const updatedTemplates = templates.map((t) =>
      t.id === activeTemplateId ? { ...t, elements } : t
    );
    setTemplates(updatedTemplates);
  };

  const handleUpdateLayoutConfig = (key: keyof RdlTemplate, value: any) => {
    const updatedTemplates = templates.map((t) => {
      if (t.id === activeTemplateId) {
        return { ...t, [key]: value };
      }
      return t;
    });
    setTemplates(updatedTemplates);
  };

  const handleSaveAsNewTemplate = (name: string) => {
    if (!name.trim()) return;
    const newT: RdlTemplate = {
      ...selectedTemplate,
      id: `rdl_t_${Date.now()}`,
      name,
    };
    const updated = [...templates, newT];
    setTemplates(updated);
    setActiveTemplateId(newT.id);
    alert(`RDL template "${newT.name}" successfully designed and stored!`);
  };

  const activeElement = selectedTemplate.elements.find((el) => el.id === selectedElementId);

  return (
    <div className="space-y-6">
      {/* Visual Customize Banner */}
      {isVisualEditMode && (
        <div className="bg-emerald-500/10 border-2 border-emerald-500/30 p-4 rounded-xl flex items-center gap-3 text-emerald-800 select-none animate-pulse">
          <Palette className="h-5 w-5 text-emerald-600 shrink-0" />
          <div className="text-xs font-semibold">
            🛠️ <span className="font-bold">SSRS RDL Customizer Engine Active</span>: You can directly click any container, alter alignments, change border sizes, or double click the expression code box to write custom SSRS equations dynamically!
          </div>
        </div>
      )}

      {/* RDL Header & template picker */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 font-display">Nexova RDL Report Designer</h2>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">SSRS / Crystal Reports XML Schema Visualizer</p>
          </div>
        </div>

        {/* Template Selector dropdown */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">RDL Document:</span>
          <select
            value={activeTemplateId}
            onChange={(e) => setActiveTemplateId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold focus:outline-none focus:border-indigo-600 cursor-pointer text-slate-700"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                [{t.category}] {t.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              const name = prompt('Enter a name for the new RDL Report Template:');
              if (name) handleSaveAsNewTemplate(name);
            }}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm shadow-indigo-600/10"
          >
            <Plus className="h-4 w-4" /> Save Copy
          </button>
        </div>
      </div>

      {activeSubTab === 'rdl_categories' ? (
        <div className="space-y-6">
          <div className="bg-emerald-950/20 border border-emerald-900/30 p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-emerald-800 font-display">Nexova RDL Report Categories</h2>
              <p className="text-xs text-slate-500 mt-1">Select a reporting category schema to inspect corresponding RDL XML report files.</p>
            </div>
            <div className="bg-emerald-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg">
              {categoriesList.length} Categories Configured
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categoriesList.map((cat) => {
              const catTemplates = templates.filter((t) => t.category === cat);
              return (
                <div key={cat} className="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-5 shadow-xs transition-all space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Palette className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">{cat}</h3>
                      <p className="text-xs text-slate-400">{catTemplates.length} templates registered in XML schema</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    {catTemplates.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No custom templates built yet for this stream.</p>
                    ) : (
                      catTemplates.map((t) => (
                        <div key={t.id} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl hover:bg-slate-100/50 transition-colors">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700">{t.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">Subcategory: {t.subcategory || 'General'} | Size: {t.pageSize}</span>
                          </div>
                          <button
                            onClick={() => {
                              setActiveTemplateId(t.id);
                              setActiveSubTab('report_manager');
                            }}
                            className="px-2.5 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Run Report
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : activeSubTab === 'rdl_subcategories' ? (
        <div className="space-y-6">
          <div className="bg-emerald-950/20 border border-emerald-900/30 p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-emerald-800 font-display">Nexova RDL Report Subcategories</h2>
              <p className="text-xs text-slate-500 mt-1">Drill down into highly specific analytical sub-segments of ERP ledger databases.</p>
            </div>
            <div className="bg-emerald-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg">
              Nested Subcategory Registry
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider">
                    <th className="py-3 px-4 font-bold">Subcategory Name</th>
                    <th className="py-3 px-4 font-bold">Parent Category</th>
                    <th className="py-3 px-4 font-bold">Document Formats</th>
                    <th className="py-3 px-4 font-bold text-right">Quick Run Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                  {templates.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800">
                        ✨ {t.subcategory || 'Auditing & Assets'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-500">
                        {t.category}
                      </td>
                      <td className="py-3 px-4 font-mono text-[10px] text-indigo-600 font-bold uppercase">
                        RDL Schema / {t.pageSize} Size / {t.orientation}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setActiveTemplateId(t.id);
                            setActiveSubTab('report_manager');
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-emerald-600 border border-slate-200 rounded-lg text-[10px] font-black transition-all cursor-pointer"
                        >
                          Execute XML Run
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
          {/* Designer Palette / Controller */}
          {activeSubTab === 'report_manager' && (
            <div className="xl:col-span-1 bg-white border border-slate-200 rounded-xl p-5 space-y-5 shadow-xs">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="h-4 w-4 text-indigo-500" /> Toolbox Palette
            </h3>
            <span className="text-[9px] font-bold text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded uppercase">v1.0.8</span>
          </div>

          {/* Setup Page margins & size */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Document Page Setup</h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <div>
                <label className="block text-[9px] text-slate-400 uppercase">Page Size</label>
                <select
                  value={selectedTemplate.pageSize}
                  onChange={(e) => handleUpdateLayoutConfig('pageSize', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:outline-none cursor-pointer"
                >
                  <option value="A4">A4 (210 x 297mm)</option>
                  <option value="Letter">Letter (8.5 x 11 in)</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] text-slate-400 uppercase">Orientation</label>
                <select
                  value={selectedTemplate.orientation}
                  onChange={(e) => handleUpdateLayoutConfig('orientation', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:outline-none cursor-pointer"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            </div>
          </div>

          {/* Drag or Add RDL elements */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Insert XML Schema Elements</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleAddElement('textbox')}
                className="p-2.5 bg-slate-50 border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/40 text-slate-600 hover:text-indigo-600 rounded-lg text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer"
              >
                <Type className="h-4.5 w-4.5 text-indigo-500" />
                <span>Text / Expression</span>
              </button>
              <button
                onClick={() => handleAddElement('table')}
                className="p-2.5 bg-slate-50 border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/40 text-slate-600 hover:text-emerald-600 rounded-lg text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer"
              >
                <Table className="h-4.5 w-4.5 text-emerald-500" />
                <span>RDL Data Table</span>
              </button>
            </div>
          </div>

          {/* Selected Element Style Editor */}
          {activeElement && (
            <div className="space-y-4 pt-3 border-t border-slate-100 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Format Element</h4>
                <button
                  onClick={() => setSelectedElementId(null)}
                  className="text-slate-400 hover:text-red-500"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Text Expression Editing Codebox */}
              {activeElement.type === 'textbox' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Text / Expression formula</label>
                    <button
                      onClick={() => {
                        setExprText(activeElement.content);
                        setShowExprBuilder(true);
                      }}
                      className="text-[9px] font-black text-indigo-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Code className="h-3 w-3" /> Expression Builder
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={activeElement.content}
                    onChange={(e) => handleUpdateElement({ ...activeElement, content: e.target.value })}
                    className="w-full bg-slate-900 text-green-400 font-mono text-[11px] p-2.5 rounded-lg focus:outline-none"
                    placeholder="Enter plain text or '=Now()'"
                  />
                </div>
              )}

              {/* Table Data Source Configuration */}
              {activeElement.type === 'table' && activeElement.tableConfig && (
                <div className="space-y-3 text-xs font-semibold">
                  <div>
                    <label className="block text-[9px] text-slate-400 uppercase">RDL Query Table Dataset</label>
                    <select
                      value={activeElement.tableConfig.dataset}
                      onChange={(e) => {
                        const ds = e.target.value as any;
                        const columns = ds === 'products' ? ['sku', 'name', 'stock', 'price'] : ds === 'invoices' ? ['invoiceNo', 'customerName', 'total'] : ['name', 'phone', 'outstandingBalance'];
                        handleUpdateElement({
                          ...activeElement,
                          tableConfig: { ...activeElement.tableConfig!, dataset: ds, columns },
                        });
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:outline-none cursor-pointer"
                    >
                      <option value="products">Products Ledger</option>
                      <option value="invoices">Invoices Registry</option>
                      <option value="customers">Customers Database</option>
                      <option value="suppliers">Suppliers Registry</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] text-slate-400 uppercase mb-1">Select Columns</label>
                    <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                      {activeElement.tableConfig.dataset === 'products' && ['sku', 'name', 'category', 'stock', 'price', 'cost'].map((col) => (
                        <label key={col} className="flex items-center gap-1.5 text-[11px] text-slate-600 select-none">
                          <input
                            type="checkbox"
                            checked={activeElement.tableConfig!.columns.includes(col)}
                            onChange={() => {
                              const columns = activeElement.tableConfig!.columns.includes(col)
                                ? activeElement.tableConfig!.columns.filter((c) => c !== col)
                                : [...activeElement.tableConfig!.columns, col];
                              handleUpdateElement({
                                ...activeElement,
                                tableConfig: { ...activeElement.tableConfig!, columns },
                              });
                            }}
                          />
                          <span>{col}</span>
                        </label>
                      ))}
                      {activeElement.tableConfig.dataset === 'invoices' && ['invoiceNo', 'customerName', 'date', 'taxAmount', 'total'].map((col) => (
                        <label key={col} className="flex items-center gap-1.5 text-[11px] text-slate-600 select-none">
                          <input
                            type="checkbox"
                            checked={activeElement.tableConfig!.columns.includes(col)}
                            onChange={() => {
                              const columns = activeElement.tableConfig!.columns.includes(col)
                                ? activeElement.tableConfig!.columns.filter((c) => c !== col)
                                : [...activeElement.tableConfig!.columns, col];
                              handleUpdateElement({
                                ...activeElement,
                                tableConfig: { ...activeElement.tableConfig!, columns },
                              });
                            }}
                          />
                          <span>{col}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Styling controls (padding, alignment, borders) */}
              <div className="space-y-2 pt-1">
                <label className="block text-[9px] text-slate-400 uppercase">Text Formatting alignment</label>
                <div className="grid grid-cols-3 bg-slate-50 border border-slate-200 p-0.5 rounded-lg text-xs font-semibold">
                  <button
                    onClick={() => handleUpdateElement({ ...activeElement, style: { ...activeElement.style, textAlign: 'left' } })}
                    className={`py-1 text-center rounded cursor-pointer ${activeElement.style.textAlign === 'left' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-400'}`}
                  >
                    Left
                  </button>
                  <button
                    onClick={() => handleUpdateElement({ ...activeElement, style: { ...activeElement.style, textAlign: 'center' } })}
                    className={`py-1 text-center rounded cursor-pointer ${activeElement.style.textAlign === 'center' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-400'}`}
                  >
                    Center
                  </button>
                  <button
                    onClick={() => handleUpdateElement({ ...activeElement, style: { ...activeElement.style, textAlign: 'right' } })}
                    className={`py-1 text-center rounded cursor-pointer ${activeElement.style.textAlign === 'right' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-400'}`}
                  >
                    Right
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <div>
                  <label className="block text-[9px] text-slate-400 uppercase">Font size</label>
                  <select
                    value={activeElement.style.fontSize}
                    onChange={(e) => handleUpdateElement({ ...activeElement, style: { ...activeElement.style, fontSize: e.target.value } })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:outline-none cursor-pointer"
                  >
                    <option value="text-[10px]">Tiny</option>
                    <option value="text-xs">Normal</option>
                    <option value="text-sm">Medium</option>
                    <option value="text-base">Large</option>
                    <option value="text-lg">Header 3</option>
                    <option value="text-xl">Header 2</option>
                    <option value="text-2xl">Title 1</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 uppercase">Font Weight</label>
                  <select
                    value={activeElement.style.fontWeight}
                    onChange={(e) => handleUpdateElement({ ...activeElement, style: { ...activeElement.style, fontWeight: e.target.value } })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:outline-none cursor-pointer"
                  >
                    <option value="font-normal">Regular</option>
                    <option value="font-semibold">Semibold</option>
                    <option value="font-bold">Bold</option>
                    <option value="font-black">Black Thick</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <div>
                  <label className="block text-[9px] text-slate-400 uppercase">Text Color</label>
                  <input
                    type="color"
                    value={activeElement.style.color || '#334155'}
                    onChange={(e) => handleUpdateElement({ ...activeElement, style: { ...activeElement.style, color: e.target.value } })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg h-8 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 uppercase">Background Color</label>
                  <input
                    type="color"
                    value={activeElement.style.bgColor === 'transparent' ? '#ffffff' : activeElement.style.bgColor}
                    onChange={(e) => handleUpdateElement({ ...activeElement, style: { ...activeElement.style, bgColor: e.target.value } })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg h-8 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <div>
                  <label className="block text-[9px] text-slate-400 uppercase">Padding (Scale)</label>
                  <select
                    value={activeElement.style.padding}
                    onChange={(e) => handleUpdateElement({ ...activeElement, style: { ...activeElement.style, padding: e.target.value } })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:outline-none cursor-pointer text-slate-700"
                  >
                    <option value="p-0">No Padding</option>
                    <option value="p-1">Compact</option>
                    <option value="p-2.5">Standard</option>
                    <option value="p-4">Generous</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 uppercase">Border Width</label>
                  <select
                    value={activeElement.style.borderWidth}
                    onChange={(e) => handleUpdateElement({ ...activeElement, style: { ...activeElement.style, borderWidth: e.target.value } })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:outline-none cursor-pointer text-slate-700"
                  >
                    <option value="border-none">No Border</option>
                    <option value="border">Full Border</option>
                    <option value="border-b">Bottom Border</option>
                    <option value="border-b-2">Thick Bottom</option>
                  </select>
                </div>
              </div>

              <button
                onClick={(e) => handleDeleteElement(activeElement.id, e)}
                className="w-full py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-black transition-colors uppercase flex items-center justify-center gap-1 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" /> Delete RDL Element
              </button>
            </div>
          )}
        </div>
        )}

        {/* Live physical paper preview RDL layout canvas */}
        <div className={`${activeSubTab === 'report_manager' ? 'xl:col-span-3' : 'xl:col-span-4'} space-y-4`}>
          {/* Paper actions bar */}
          <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono text-slate-400">RDL Schema: [{selectedTemplate.pageSize} Paper | {selectedTemplate.orientation.toUpperCase()}]</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Printer className="h-4 w-4" /> Trigger Print View
              </button>
            </div>
          </div>

          {/* Paper sheet itself */}
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-6 flex justify-center overflow-x-auto">
            <div
              id="rdl-printable-sheet"
              className={`bg-white shadow-xl border border-slate-300 font-sans p-10 text-slate-800 relative transition-all ${
                selectedTemplate.pageSize === 'A4'
                  ? selectedTemplate.orientation === 'portrait' ? 'w-[794px] min-h-[1123px]' : 'w-[1123px] min-h-[794px]'
                  : selectedTemplate.orientation === 'portrait' ? 'w-[816px] min-h-[1056px]' : 'w-[1056px] min-h-[816px]'
              }`}
              style={{
                paddingTop: `${selectedTemplate.margins.top}mm`,
                paddingBottom: `${selectedTemplate.margins.bottom}mm`,
                paddingLeft: `${selectedTemplate.margins.left}mm`,
                paddingRight: `${selectedTemplate.margins.right}mm`,
              }}
            >
              {/* Dynamic schema list */}
              <div className="space-y-5">
                {selectedTemplate.elements.map((el) => {
                  const isSelected = selectedElementId === el.id;
                  const isDragging = draggedElementId === el.id;
                  const isDropTarget = dragOverElementId === el.id && draggedElementId !== el.id;

                  return (
                    <div
                      key={el.id}
                      draggable={true}
                      onClick={() => setSelectedElementId(el.id)}
                      onDragStart={(e) => {
                        setDraggedElementId(el.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragEnd={() => {
                        setDraggedElementId(null);
                        setDragOverElementId(null);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (draggedElementId && draggedElementId !== el.id) setDragOverElementId(el.id);
                      }}
                      onDragLeave={() => setDragOverElementId((prev) => (prev === el.id ? null : prev))}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedElementId) handleReorderElement(draggedElementId, el.id);
                        setDraggedElementId(null);
                        setDragOverElementId(null);
                      }}
                      className={`relative transition-all cursor-grab active:cursor-grabbing ${
                        isSelected
                          ? 'ring-2 ring-indigo-500 ring-offset-2'
                          : 'hover:outline-dashed hover:outline-1 hover:outline-indigo-300'
                      } ${isDragging ? 'opacity-30' : ''} ${isDropTarget ? 'border-t-2 border-indigo-500' : ''}`}
                    >
                      {/* Interactive edit handles */}
                      {isSelected && (
                        <span className="absolute -top-4 left-0 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow-sm z-30">
                          {el.type}
                        </span>
                      )}
                      <span
                        className="absolute -top-4 right-0 text-slate-400 hover:text-indigo-500 z-30 cursor-grab active:cursor-grabbing"
                        title="Drag to reposition"
                      >
                        <GripVertical className="h-3.5 w-3.5" />
                      </span>

                      {/* TextBox Render */}
                      {el.type === 'textbox' && (
                        <div
                          className={`font-semibold ${el.style.fontSize} ${el.style.fontWeight} ${el.style.padding} ${el.style.borderWidth} ${el.style.borderRadius}`}
                          style={{
                            textAlign: el.style.textAlign,
                            color: el.style.color,
                            backgroundColor: el.style.bgColor,
                            borderWidth: el.style.borderWidth !== 'border-none' ? '1px' : '0px',
                            borderBottomWidth: el.style.borderWidth === 'border-b' ? '1px' : el.style.borderWidth === 'border-b-2' ? '2px' : '',
                            borderColor: el.style.borderColor || '#e2e8f0',
                          }}
                        >
                          {parseRdlExpression(el.content)}
                        </div>
                      )}

                      {/* RDL Data Table Render */}
                      {el.type === 'table' && el.tableConfig && (
                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                {el.tableConfig.columns.map((col) => (
                                  <th key={col} className="py-2 px-3 font-bold uppercase">{col}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-700 text-[11px]">
                              {getDatasetRows(el.tableConfig.dataset).slice(0, 10).map((row: any) => (
                                <tr key={row.id} className="hover:bg-slate-50">
                                  {el.tableConfig!.columns.map((col) => {
                                    let val = row[col];
                                    if (typeof val === 'boolean') val = val ? 'Paid' : 'Unpaid';
                                    if (['price', 'cost', 'total', 'taxAmount', 'outstandingBalance'].includes(col) && typeof val === 'number') {
                                      val = `৳${val.toLocaleString()}`;
                                    }
                                    return <td key={col} className="py-2 px-3">{val}</td>;
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Physical page footer simulation */}
              <div className="absolute bottom-10 left-10 right-10 flex items-center justify-between text-[9px] text-slate-400 font-mono border-t border-slate-100 pt-3">
                <span>RDL System Report Definition Schema (Nexova ERP Solution)</span>
                <span>Page 1 of 1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* RDL Expression Builder Modal */}
      {showExprBuilder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Code className="h-5 w-5 text-indigo-500" /> SSRS Expression Builder
              </h3>
              <button
                onClick={() => setShowExprBuilder(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Standard RDL Reference Syntaxes:</span>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 max-h-48 overflow-y-auto custom-scrollbar">
                <button
                  onClick={() => setExprText('=Now()')}
                  className="p-2 bg-white border border-slate-200 hover:border-indigo-200 hover:text-indigo-600 rounded text-left transition-colors cursor-pointer"
                >
                  <p className="font-mono text-indigo-600 font-bold">=Now()</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Calculates current date & time</p>
                </button>
                <button
                  onClick={() => setExprText('=Count(Fields!id.Value)')}
                  className="p-2 bg-white border border-slate-200 hover:border-indigo-200 hover:text-indigo-600 rounded text-left transition-colors cursor-pointer"
                >
                  <p className="font-mono text-indigo-600 font-bold">=Count(Fields!id.Value)</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Counts active dataset records</p>
                </button>
                <button
                  onClick={() => setExprText('=Sum(Fields!price.Value * Fields!stock.Value)')}
                  className="p-2 bg-white border border-slate-200 hover:border-indigo-200 hover:text-indigo-600 rounded text-left transition-colors cursor-pointer"
                >
                  <p className="font-mono text-indigo-600 font-bold">=Sum(Fields!price.Value * Fields!stock.Value)</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Calculates total catalog valuation</p>
                </button>
                <button
                  onClick={() => setExprText('=Sum(Fields!total.Value)')}
                  className="p-2 bg-white border border-slate-200 hover:border-indigo-200 hover:text-indigo-600 rounded text-left transition-colors cursor-pointer"
                >
                  <p className="font-mono text-indigo-600 font-bold">=Sum(Fields!total.Value)</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Sums Grand Total of all Invoices</p>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Write Expression Schema</label>
              <input
                type="text"
                value={exprText}
                onChange={(e) => setExprText(e.target.value)}
                className="w-full bg-slate-900 text-green-400 font-mono text-xs p-3 rounded-lg focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowExprBuilder(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (activeElement) {
                    handleUpdateElement({ ...activeElement, content: exprText });
                  }
                  setShowExprBuilder(false);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-600/10"
              >
                Apply Expression
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
