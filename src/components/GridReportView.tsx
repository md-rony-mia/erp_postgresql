import React, { useState, useEffect } from 'react';
import { seedCollectionIfEmpty, syncCollectionToFirestore } from '../lib/dataClient';
import {
  Product,
  Invoice,
  Customer,
  Supplier,
  Transaction,
  formatBoxQty,
} from '../types';
import {
  Grid,
  Columns,
  ListFilter,
  Plus,
  Save,
  Trash2,
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
  Search,
  Eye,
  Settings,
  Edit2,
  Check,
  X,
  RefreshCw,
  PlusCircle,
  FileSpreadsheet,
  AlertCircle,
  ArrowUpDown,
} from 'lucide-react';

interface GridReportViewProps {
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  invoices: Invoice[];
  transactions: Transaction[];
  onUpdateProducts: (products: Product[]) => void;
  onUpdateInvoices: (invoices: Invoice[]) => void;
  onUpdateCustomers: (customers: Customer[]) => void;
  onUpdateSuppliers: (suppliers: Supplier[]) => void;
  onUpdateTransactions: (transactions: Transaction[]) => void;
  isVisualEditMode?: boolean;
  currentSubTab?: string;
}

interface SavedGridLayout {
  id: string;
  name: string;
  dataset: 'products' | 'invoices' | 'customers' | 'suppliers' | 'transactions';
  columns: string[];
  groupColumn: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  aggregates: Record<string, 'sum' | 'avg' | 'count' | 'none'>;
  highlightRules: {
    column: string;
    condition: 'less' | 'greater' | 'equals';
    value: string;
    bgColor: string;
    textColor: string;
  }[];
}

export default function GridReportView({
  products,
  customers,
  suppliers,
  invoices,
  transactions,
  onUpdateProducts,
  onUpdateInvoices,
  onUpdateCustomers,
  onUpdateSuppliers,
  onUpdateTransactions,
  isVisualEditMode = false,
  currentSubTab = 'all_grid_reports',
}: GridReportViewProps) {
  // Datasets mapping
  const datasets = {
    products: {
      label: 'Products Ledger',
      data: products,
      allColumns: [
        { key: 'sku', label: 'SKU / Code', type: 'string' },
        { key: 'name', label: 'Product Name', type: 'string' },
        { key: 'category', label: 'Category', type: 'string' },
        { key: 'warehouse', label: 'Warehouse Location', type: 'string' },
        { key: 'unit', label: 'Unit', type: 'string' },
        { key: 'cost', label: 'Cost Price (৳)', type: 'number' },
        { key: 'price', label: 'Sale Price (৳)', type: 'number' },
        { key: 'stock', label: 'Current Stock', type: 'number' },
        { key: 'alertQty', label: 'Alert Threshold', type: 'number' },
      ],
      updateHandler: (rowId: string, key: string, val: any) => {
        const updated = products.map((p) => {
          if (p.id === rowId) {
            let parsedVal = val;
            if (['cost', 'price', 'stock', 'alertQty'].includes(key)) {
              parsedVal = parseFloat(val) || 0;
            }
            return { ...p, [key]: parsedVal };
          }
          return p;
        });
        onUpdateProducts(updated);
      },
    },
    invoices: {
      label: 'Sales Invoices Register',
      data: invoices,
      allColumns: [
        { key: 'invoiceNo', label: 'Invoice No', type: 'string' },
        { key: 'customerName', label: 'Customer Name', type: 'string' },
        { key: 'date', label: 'Date', type: 'string' },
        { key: 'paymentMethod', label: 'Payment Method', type: 'string' },
        { key: 'subtotal', label: 'Subtotal (৳)', type: 'number' },
        { key: 'taxAmount', label: 'VAT / Tax (৳)', type: 'number' },
        { key: 'discount', label: 'Discount (৳)', type: 'number' },
        { key: 'total', label: 'Grand Total (৳)', type: 'number' },
        { key: 'isPaid', label: 'Paid Status', type: 'boolean' },
      ],
      updateHandler: (rowId: string, key: string, val: any) => {
        const updated = invoices.map((inv) => {
          if (inv.id === rowId) {
            let parsedVal = val;
            if (['subtotal', 'taxAmount', 'discount', 'total'].includes(key)) {
              parsedVal = parseFloat(val) || 0;
            } else if (key === 'isPaid') {
              parsedVal = val === 'true' || val === true;
            }
            return { ...inv, [key]: parsedVal };
          }
          return inv;
        });
        onUpdateInvoices(updated);
      },
    },
    customers: {
      label: 'Customers Database',
      data: customers,
      allColumns: [
        { key: 'name', label: 'Customer Name', type: 'string' },
        { key: 'phone', label: 'Phone Number', type: 'string' },
        { key: 'email', label: 'Email Address', type: 'string' },
        { key: 'group', label: 'Customer Group', type: 'string' },
        { key: 'outstandingBalance', label: 'Outstanding Balance (৳)', type: 'number' },
      ],
      updateHandler: (rowId: string, key: string, val: any) => {
        const updated = customers.map((c) => {
          if (c.id === rowId) {
            let parsedVal = val;
            if (key === 'outstandingBalance') {
              parsedVal = parseFloat(val) || 0;
            }
            return { ...c, [key]: parsedVal };
          }
          return c;
        });
        onUpdateCustomers(updated);
      },
    },
    suppliers: {
      label: 'Suppliers Registry',
      data: suppliers,
      allColumns: [
        { key: 'name', label: 'Supplier Name', type: 'string' },
        { key: 'companyName', label: 'Company / Brand', type: 'string' },
        { key: 'phone', label: 'Phone', type: 'string' },
        { key: 'email', label: 'Email Address', type: 'string' },
        { key: 'group', label: 'Supplier Group', type: 'string' },
        { key: 'outstandingBalance', label: 'Outstanding Balance (৳)', type: 'number' },
      ],
      updateHandler: (rowId: string, key: string, val: any) => {
        const updated = suppliers.map((s) => {
          if (s.id === rowId) {
            let parsedVal = val;
            if (key === 'outstandingBalance') {
              parsedVal = parseFloat(val) || 0;
            }
            return { ...s, [key]: parsedVal };
          }
          return s;
        });
        onUpdateSuppliers(updated);
      },
    },
    transactions: {
      label: 'Financial Day Book Ledger',
      data: transactions,
      allColumns: [
        { key: 'date', label: 'Transaction Date', type: 'string' },
        { key: 'referenceNo', label: 'Reference No', type: 'string' },
        { key: 'category', label: 'Account Category', type: 'string' },
        { key: 'description', label: 'Narrative Detail', type: 'string' },
        { key: 'type', label: 'Type (Deposit/Withdrawal)', type: 'string' },
        { key: 'amount', label: 'Amount (৳)', type: 'number' },
      ],
      updateHandler: (rowId: string, key: string, val: any) => {
        const updated = transactions.map((t) => {
          if (t.id === rowId) {
            let parsedVal = val;
            if (key === 'amount') {
              parsedVal = parseFloat(val) || 0;
            }
            return { ...t, [key]: parsedVal };
          }
          return t;
        });
        onUpdateTransactions(updated);
      },
    },
  };

  // Demo layouts list preseeded
  const defaultLayouts: SavedGridLayout[] = [
    {
      id: 'l1',
      name: 'High Value Sales Invoices',
      dataset: 'invoices',
      columns: ['invoiceNo', 'customerName', 'date', 'paymentMethod', 'total', 'isPaid'],
      groupColumn: 'isPaid',
      sortBy: 'total',
      sortOrder: 'desc',
      aggregates: { total: 'sum', invoiceNo: 'count' },
      highlightRules: [
        { column: 'total', condition: 'greater', value: '15000', bgColor: 'bg-emerald-50 text-emerald-800 font-black', textColor: 'text-emerald-700' },
      ],
    },
    {
      id: 'l2',
      name: 'Safety Restock Alert Sheet',
      dataset: 'products',
      columns: ['sku', 'name', 'category', 'stock', 'alertQty', 'price'],
      groupColumn: 'category',
      sortBy: 'stock',
      sortOrder: 'asc',
      aggregates: { stock: 'sum' },
      highlightRules: [
        { column: 'stock', condition: 'less', value: '5', bgColor: 'bg-rose-50 text-rose-800 border-rose-200', textColor: 'text-rose-600' },
      ],
    },
  ];

  // System States
  const [savedLayouts, setSavedLayouts] = useState<SavedGridLayout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const legacy = localStorage.getItem('nexova_custom_grids');
        let initial = defaultLayouts;
        if (legacy) {
          try { initial = JSON.parse(legacy); } catch (e) {}
        }
        const seeded = await seedCollectionIfEmpty('gridReports', initial);
        setSavedLayouts(seeded || []);
        if (legacy) {
          localStorage.removeItem('nexova_custom_grids');
        }
      } catch (err) {
        console.error("Grid reports migration failed", err);
        alert("গ্রিড রিপোর্টস ডাটা মাইগ্রেশন করতে ব্যর্থ হয়েছে। অনুগ্রহ করে পৃষ্ঠাটি রিফ্রেশ করুন। (Grid reports schema migration failed. Please refresh the page.)");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (loading) return;
    syncCollectionToFirestore('gridReports', savedLayouts);
  }, [savedLayouts, loading]);

  const [activeLayoutId, setActiveLayoutId] = useState<string>('l1');
  const [selectedDataset, setSelectedDataset] = useState<keyof typeof datasets>('invoices');
  const [columnsSelection, setColumnsSelection] = useState<string[]>(['invoiceNo', 'customerName', 'date', 'paymentMethod', 'total', 'isPaid']);
  const [groupingColumn, setGroupingColumn] = useState<string>('isPaid');
  const [sortingColumn, setSortingColumn] = useState<string>('total');
  const [sortingOrder, setSortingOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedAggregates, setSelectedAggregates] = useState<Record<string, 'sum' | 'avg' | 'count' | 'none'>>({ total: 'sum', invoiceNo: 'count' });
  const [highlightRules, setHighlightRules] = useState<SavedGridLayout['highlightRules']>([
    { column: 'total', condition: 'greater', value: '15000', bgColor: 'bg-emerald-50 text-emerald-800 font-bold', textColor: 'text-emerald-700' },
  ]);

  // Designer Dialog & Controls toggles
  const [activeSubTab, setActiveSubTab] = useState<string>(currentSubTab || 'all_grid_reports');
  const [showConfigPanel, setShowConfigPanel] = useState(true);

  useEffect(() => {
    if (currentSubTab) {
      setActiveSubTab(currentSubTab);
      if (currentSubTab === 'create_grid_report') {
        setShowConfigPanel(true);
      } else if (currentSubTab === 'all_grid_reports') {
        setShowConfigPanel(false);
      }
    }
  }, [currentSubTab]);

  const [newLayoutName, setNewLayoutName] = useState('');
  const [searchText, setSearchText] = useState('');
  const [gridDensity, setGridDensity] = useState<'compact' | 'standard' | 'comfortable'>('standard');

  // Inline Cell Editing State
  const [editingCell, setEditingCell] = useState<{ rowId: string; colKey: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  // Rules creation utility
  const [newRuleCol, setNewRuleCol] = useState('');
  const [newRuleCond, setNewRuleCond] = useState<'less' | 'greater' | 'equals'>('less');
  const [newRuleVal, setNewRuleVal] = useState('');
  const [newRuleBg, setNewRuleBg] = useState('bg-rose-50 text-rose-800 border-rose-200');

  const handleDatasetChange = (ds: keyof typeof datasets) => {
    setSelectedDataset(ds);
    const cols = datasets[ds].allColumns.slice(0, 5).map((c) => c.key);
    setColumnsSelection(cols);
    setGroupingColumn('');
    setSortingColumn(cols[0] || '');
    setSortingOrder('desc');
    setSelectedAggregates({});
    setHighlightRules([]);
    setActiveLayoutId('');
  };

  const handleApplyLayout = (layout: SavedGridLayout) => {
    setActiveLayoutId(layout.id);
    setSelectedDataset(layout.dataset);
    setColumnsSelection(layout.columns);
    setGroupingColumn(layout.groupColumn);
    setSortingColumn(layout.sortBy);
    setSortingOrder(layout.sortOrder);
    setSelectedAggregates(layout.aggregates || {});
    setHighlightRules(layout.highlightRules || []);
  };

  const handleSaveCurrentLayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLayoutName.trim()) return;

    const newLayout: SavedGridLayout = {
      id: `grid_${Date.now()}`,
      name: newLayoutName,
      dataset: selectedDataset,
      columns: columnsSelection,
      groupColumn: groupingColumn,
      sortBy: sortingColumn,
      sortOrder: sortingOrder,
      aggregates: selectedAggregates,
      highlightRules: highlightRules,
    };

    const updated = [...savedLayouts, newLayout];
    setSavedLayouts(updated);
    setActiveLayoutId(newLayout.id);
    setNewLayoutName('');
    alert(`Grid layout "${newLayout.name}" successfully designed and stored!`);
  };

  const handleDeleteLayout = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this custom Designed Grid Report?')) {
      const updated = savedLayouts.filter((l) => l.id !== id);
      setSavedLayouts(updated);
      if (activeLayoutId === id) {
        setActiveLayoutId('');
      }
    }
  };

  const handleAddRule = () => {
    if (!newRuleCol || !newRuleVal) return;
    const newRule = {
      column: newRuleCol,
      condition: newRuleCond,
      value: newRuleVal,
      bgColor: newRuleBg,
      textColor: newRuleBg.includes('rose') ? 'text-rose-700' : newRuleBg.includes('emerald') ? 'text-emerald-700' : 'text-indigo-700',
    };
    setHighlightRules([...highlightRules, newRule]);
    setNewRuleCol('');
    setNewRuleVal('');
  };

  const handleRemoveRule = (index: number) => {
    setHighlightRules(highlightRules.filter((_, idx) => idx !== index));
  };

  // Process data based on query constraints
  const currentDatasetConfig = datasets[selectedDataset];
  const originalRows = currentDatasetConfig.data;

  // 1. Filter by search query
  let processedRows = originalRows.filter((row: any) => {
    if (!searchText) return true;
    return Object.keys(row).some((key) => {
      const val = row[key];
      if (val === undefined || val === null) return false;
      return String(val).toLowerCase().includes(searchText.toLowerCase());
    });
  });

  // 2. Sort records
  processedRows = [...processedRows].sort((a: any, b: any) => {
    let valA = a[sortingColumn];
    let valB = b[sortingColumn];

    if (valA === undefined) return 1;
    if (valB === undefined) return -1;

    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortingOrder === 'asc' ? valA - valB : valB - valA;
    }
    const strA = String(valA).toLowerCase();
    const strB = String(valB).toLowerCase();
    return sortingOrder === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
  });

  // Grouping rows helper
  const groupData = () => {
    if (!groupingColumn || !columnsSelection.includes(groupingColumn)) {
      return { 'All Records': processedRows };
    }

    const groups: Record<string, any[]> = {};
    processedRows.forEach((row: any) => {
      const groupVal = row[groupingColumn];
      const key = groupVal === undefined || groupVal === null ? 'N/A' : String(groupVal === true ? 'PAID / ACTIVE' : groupVal === false ? 'UNPAID / INACTIVE' : groupVal);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(row);
    });

    return groups;
  };

  const dataGroups = groupData();

  // Highlight check function
  const getCellHighlightClass = (colKey: string, val: any) => {
    const matchedRule = highlightRules.find((r) => r.column === colKey);
    if (!matchedRule) return '';

    const numVal = parseFloat(val);
    const numRuleVal = parseFloat(matchedRule.value);

    let isMatched = false;
    if (!isNaN(numVal) && !isNaN(numRuleVal)) {
      if (matchedRule.condition === 'less') isMatched = numVal < numRuleVal;
      else if (matchedRule.condition === 'greater') isMatched = numVal > numRuleVal;
      else if (matchedRule.condition === 'equals') isMatched = numVal === numRuleVal;
    } else {
      const strVal = String(val).toLowerCase();
      const strRuleVal = String(matchedRule.value).toLowerCase();
      if (matchedRule.condition === 'equals') isMatched = strVal === strRuleVal;
    }

    return isMatched ? `${matchedRule.bgColor} px-2 py-0.5 rounded font-bold` : '';
  };

  // Aggregate Calculator
  const calculateAggregate = (rows: any[], colKey: string) => {
    const type = selectedAggregates[colKey];
    if (!type || type === 'none') return '';

    const numCols = currentDatasetConfig.allColumns.find((c) => c.key === colKey)?.type === 'number';

    if (type === 'count') {
      return `Count: ${rows.length}`;
    }

    if (!numCols) return '';

    const validNumbers = rows
      .map((r) => parseFloat(r[colKey]))
      .filter((v) => !isNaN(v));

    if (validNumbers.length === 0) return '';

    if (type === 'sum') {
      const sum = validNumbers.reduce((a, b) => a + b, 0);
      return `Sum: ৳${sum.toLocaleString()}`;
    }

    if (type === 'avg') {
      const sum = validNumbers.reduce((a, b) => a + b, 0);
      const avg = sum / validNumbers.length;
      return `Avg: ৳${avg.toLocaleString(undefined, { maximumFractionDigits: 1 })}`;
    }

    return '';
  };

  // Inline Cell Save
  const saveCellEdit = (rowId: string, colKey: string) => {
    currentDatasetConfig.updateHandler(rowId, colKey, editingValue);
    setEditingCell(null);
  };

  const handleExportCSV = () => {
    const headers = columnsSelection.map((colKey) => {
      return currentDatasetConfig.allColumns.find((c) => c.key === colKey)?.label || colKey;
    });

    const csvRows = [headers.join(',')];

    Object.keys(dataGroups).forEach((groupName) => {
      dataGroups[groupName].forEach((row: any) => {
        const values = columnsSelection.map((colKey) => {
          let val = row[colKey];
          if (typeof val === 'boolean') val = val ? 'Yes' : 'No';
          val = String(val).replace(/"/g, '""');
          return `"${val}"`;
        });
        csvRows.push(values.join(','));
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedDataset}_custom_grid_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Visual Customize Banner */}
      {isVisualEditMode && (
        <div className="bg-amber-500/10 border-2 border-amber-500/30 p-4 rounded-xl flex items-center gap-3 text-amber-800 select-none animate-pulse">
          <Settings className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="text-xs font-semibold">
            🛠️ <span className="font-bold">ERP Grid Customization Mode Active</span>: You can directly edit cell values, rename layout categories, sort by dragging, or setup instant aggregations to tailor NetSuite-grade reports easily!
          </div>
        </div>
      )}

      {activeSubTab === 'grid_categories' ? (
        <div className="space-y-6">
          <div className="bg-emerald-950/20 border border-emerald-900/30 p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-emerald-800 font-display">Nexova Grid Report Catalog</h2>
              <p className="text-xs text-slate-500 mt-1">Browse and load ledger entries categorized by business operational streams.</p>
            </div>
            <div className="bg-emerald-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg">
              5 Data Sources Connected
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Products Ledger Card */}
            <div className="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Grid className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Products & Inventory Ledger</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Physical inventory quantities, cost values, and shelf alerts</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 grid grid-cols-2 gap-2 text-center text-xs font-semibold">
                  <div>
                    <span className="block text-[9px] uppercase text-slate-400 font-bold">Total SKUs</span>
                    <span className="text-slate-700 font-bold">{products.length} Items</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase text-slate-400 font-bold">Total Value</span>
                    <span className="text-emerald-600 font-bold">৳{products.reduce((acc, p) => acc + (p.price * p.stock), 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedDataset('products');
                  setActiveSubTab('all_grid_reports');
                  setColumnsSelection(datasets.products.allColumns.map(c => c.key));
                }}
                className="mt-5 w-full py-2 bg-slate-50 hover:bg-emerald-600 hover:text-white text-slate-700 border border-slate-200 hover:border-emerald-500 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Launch Grid
              </button>
            </div>

            {/* Sales Invoices Register Card */}
            <div className="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Sales Invoices Register</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Sales volume, VAT collections, discount summaries and payment status</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 grid grid-cols-2 gap-2 text-center text-xs font-semibold">
                  <div>
                    <span className="block text-[9px] uppercase text-slate-400 font-bold">Total Bills</span>
                    <span className="text-slate-700 font-bold">{invoices.length} Invoices</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase text-slate-400 font-bold">Total Revenue</span>
                    <span className="text-emerald-600 font-bold">৳{invoices.reduce((acc, inv) => acc + inv.total, 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedDataset('invoices');
                  setActiveSubTab('all_grid_reports');
                  setColumnsSelection(datasets.invoices.allColumns.map(c => c.key));
                }}
                className="mt-5 w-full py-2 bg-slate-50 hover:bg-emerald-600 hover:text-white text-slate-700 border border-slate-200 hover:border-emerald-500 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Launch Grid
              </button>
            </div>

            {/* Customers Database Card */}
            <div className="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Customers Ledger</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Customer demographic clusters and outstanding credit balances</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 grid grid-cols-2 gap-2 text-center text-xs font-semibold">
                  <div>
                    <span className="block text-[9px] uppercase text-slate-400 font-bold">Client Count</span>
                    <span className="text-slate-700 font-bold">{customers.length} Profiles</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase text-slate-400 font-bold">Total Receivable</span>
                    <span className="text-rose-600 font-bold">৳{customers.reduce((acc, c) => acc + c.outstandingBalance, 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedDataset('customers');
                  setActiveSubTab('all_grid_reports');
                  setColumnsSelection(datasets.customers.allColumns.map(c => c.key));
                }}
                className="mt-5 w-full py-2 bg-slate-50 hover:bg-emerald-600 hover:text-white text-slate-700 border border-slate-200 hover:border-emerald-500 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Launch Grid
              </button>
            </div>

            {/* Suppliers Registry Card */}
            <div className="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Download className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Suppliers Registry</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Procurement sources, supplier company links and trade payables</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 grid grid-cols-2 gap-2 text-center text-xs font-semibold">
                  <div>
                    <span className="block text-[9px] uppercase text-slate-400 font-bold">Suppliers</span>
                    <span className="text-slate-700 font-bold">{suppliers.length} Partners</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase text-slate-400 font-bold">Total Payable</span>
                    <span className="text-amber-600 font-bold">৳{suppliers.reduce((acc, s) => acc + s.outstandingBalance, 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedDataset('suppliers');
                  setActiveSubTab('all_grid_reports');
                  setColumnsSelection(datasets.suppliers.allColumns.map(c => c.key));
                }}
                className="mt-5 w-full py-2 bg-slate-50 hover:bg-emerald-600 hover:text-white text-slate-700 border border-slate-200 hover:border-emerald-500 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Launch Grid
              </button>
            </div>

            {/* Financial Day Book Card */}
            <div className="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Day Book Ledger</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Real-time narrative entries of receipts and banking withdrawals</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 grid grid-cols-2 gap-2 text-center text-xs font-semibold">
                  <div>
                    <span className="block text-[9px] uppercase text-slate-400 font-bold">Transactions</span>
                    <span className="text-slate-700 font-bold">{transactions.length} Logs</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase text-slate-400 font-bold">Net Volume</span>
                    <span className="text-emerald-600 font-bold">৳{transactions.reduce((acc, t) => acc + (t.type.toLowerCase() === 'deposit' ? t.amount : -t.amount), 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedDataset('transactions');
                  setActiveSubTab('all_grid_reports');
                  setColumnsSelection(datasets.transactions.allColumns.map(c => c.key));
                }}
                className="mt-5 w-full py-2 bg-slate-50 hover:bg-emerald-600 hover:text-white text-slate-700 border border-slate-200 hover:border-emerald-500 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Launch Grid
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Grid selector / saved layouts toolbar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Grid className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800 font-display">Nexova Grid Report Engine</h2>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Custom Analytical Tabular Designer</p>
              </div>
            </div>

        {/* Saved Layouts List */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Stored Grids:</span>
          {savedLayouts.map((l) => (
            <button
              key={l.id}
              onClick={() => handleApplyLayout(l)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer border ${
                activeLayoutId === l.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/10'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>{l.name}</span>
              {l.id !== 'l1' && l.id !== 'l2' && (
                <Trash2
                  className="h-3 w-3 hover:text-red-300"
                  onClick={(e) => handleDeleteLayout(l.id, e)}
                />
              )}
            </button>
          ))}
          <button
            onClick={() => {
              setActiveLayoutId('');
              setColumnsSelection(currentDatasetConfig.allColumns.map(c => c.key));
            }}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 text-indigo-600 border border-slate-200 hover:border-indigo-100 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
          >
            <PlusCircle className="h-3.5 w-3.5" /> New Design
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        {/* Dynamic Column / Configuration Builder */}
        {showConfigPanel && (
          <div className="xl:col-span-1 bg-white border border-slate-200 rounded-xl p-5 space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Columns className="h-4 w-4 text-indigo-500" /> Grid Settings Designer
              </h3>
              <button
                onClick={() => setShowConfigPanel(false)}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded hover:bg-slate-50 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Step 1: Select Dataset */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">1. Base Transactional Dataset</label>
              <select
                value={selectedDataset}
                onChange={(e) => handleDatasetChange(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-indigo-600 cursor-pointer text-slate-700"
              >
                {Object.keys(datasets).map((key) => (
                  <option key={key} value={key}>
                    {datasets[key as keyof typeof datasets].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Toggle Columns */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">2. Selected Columns ({columnsSelection.length})</label>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                {currentDatasetConfig.allColumns.map((col) => {
                  const isChecked = columnsSelection.includes(col.key);
                  return (
                    <label key={col.key} className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            if (columnsSelection.length > 1) {
                              setColumnsSelection(columnsSelection.filter((k) => k !== col.key));
                            }
                          } else {
                            setColumnsSelection([...columnsSelection, col.key]);
                          }
                        }}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{col.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Sorting and Grouping */}
            <div className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">3. Group Rows By (Pivot)</label>
                <select
                  value={groupingColumn}
                  onChange={(e) => setGroupingColumn(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-indigo-600 cursor-pointer text-slate-600"
                >
                  <option value="">-- No Grouping (Flat Table) --</option>
                  {columnsSelection.map((colKey) => {
                    const col = currentDatasetConfig.allColumns.find((c) => c.key === colKey);
                    return col ? (
                      <option key={colKey} value={colKey}>
                        {col.label}
                      </option>
                    ) : null;
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order Column</label>
                  <select
                    value={sortingColumn}
                    onChange={(e) => setSortingColumn(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-indigo-600 cursor-pointer text-slate-600"
                  >
                    {columnsSelection.map((colKey) => {
                      const col = currentDatasetConfig.allColumns.find((c) => c.key === colKey);
                      return col ? (
                        <option key={colKey} value={colKey}>
                          {col.label}
                        </option>
                      ) : null;
                    })}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sort Direction</label>
                  <select
                    value={sortingOrder}
                    onChange={(e) => setSortingOrder(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-indigo-600 cursor-pointer text-slate-600"
                  >
                    <option value="asc">Ascending (A-Z)</option>
                    <option value="desc">Descending (Z-A)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Step 4: Aggregates Footer */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">4. Row Footers / Column Aggregates</label>
              <div className="space-y-1.5 p-3 bg-slate-50 rounded-lg border border-slate-200 max-h-36 overflow-y-auto custom-scrollbar">
                {columnsSelection.map((colKey) => {
                  const col = currentDatasetConfig.allColumns.find((c) => c.key === colKey);
                  if (!col) return null;
                  const currentAg = selectedAggregates[colKey] || 'none';
                  return (
                    <div key={colKey} className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-600 truncate mr-2">{col.label}</span>
                      <select
                        value={currentAg}
                        onChange={(e) => setSelectedAggregates({ ...selectedAggregates, [colKey]: e.target.value as any })}
                        className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] text-indigo-600 font-bold focus:outline-none cursor-pointer"
                      >
                        <option value="none">None</option>
                        <option value="count">Count</option>
                        {col.type === 'number' && <option value="sum">Sum (৳)</option>}
                        {col.type === 'number' && <option value="avg">Avg (৳)</option>}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 5: Highlight Conditional Formatting */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">5. Cell Conditional Highlights</label>
              <div className="space-y-1.5">
                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={newRuleCol}
                    onChange={(e) => setNewRuleCol(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded p-1.5 text-[10px] focus:outline-none cursor-pointer text-slate-600"
                  >
                    <option value="">-- Select Col --</option>
                    {columnsSelection.map((colKey) => {
                      const col = currentDatasetConfig.allColumns.find((c) => c.key === colKey);
                      return col ? <option key={colKey} value={colKey}>{col.label}</option> : null;
                    })}
                  </select>
                  <select
                    value={newRuleCond}
                    onChange={(e) => setNewRuleCond(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 rounded p-1.5 text-[10px] focus:outline-none cursor-pointer text-slate-600"
                  >
                    <option value="less">is Less Than (&lt;)</option>
                    <option value="greater">is Greater Than (&gt;)</option>
                    <option value="equals">Equals (==)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    placeholder="Val, e.g. 10"
                    value={newRuleVal}
                    onChange={(e) => setNewRuleVal(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded p-1 text-[10px] focus:outline-none"
                  />
                  <select
                    value={newRuleBg}
                    onChange={(e) => setNewRuleBg(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded p-1.5 text-[10px] focus:outline-none cursor-pointer text-slate-600"
                  >
                    <option value="bg-rose-50 text-rose-800 border-rose-200">Soft Red Alert</option>
                    <option value="bg-emerald-50 text-emerald-800 border-emerald-200">Soft Emerald</option>
                    <option value="bg-amber-50 text-amber-800 border-amber-200">Soft Amber</option>
                    <option value="bg-indigo-50 text-indigo-800 border-indigo-200">Soft Blue</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleAddRule}
                  className="w-full py-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-600 rounded text-[10px] font-black uppercase transition-colors"
                >
                  Apply Formatting Rule
                </button>
              </div>

              {highlightRules.length > 0 && (
                <div className="space-y-1 pt-1.5">
                  {highlightRules.map((rule, idx) => {
                    const colLabel = currentDatasetConfig.allColumns.find((c) => c.key === rule.column)?.label || rule.column;
                    return (
                      <div key={`${rule.column}_${rule.condition}_${rule.value}`} className="flex items-center justify-between p-1 px-2 bg-slate-50 rounded text-[9px] border border-slate-100 font-mono text-slate-500">
                        <span className="truncate">{colLabel} {rule.condition === 'less' ? '<' : rule.condition === 'greater' ? '>' : '='} {rule.value}</span>
                        <button onClick={() => handleRemoveRule(idx)} className="text-red-500 hover:text-red-700">✕</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Save Configuration form */}
            <form onSubmit={handleSaveCurrentLayout} className="pt-4 border-t border-slate-100 space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Save Stored Grid Template</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="e.g. Inflow Register 2026"
                  value={newLayoutName}
                  onChange={(e) => setNewLayoutName(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded p-2 text-xs focus:outline-none flex-1 font-semibold"
                />
                <button
                  type="submit"
                  className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer"
                  title="Save Layout Template"
                >
                  <Save className="h-4.5 w-4.5" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Dynamic Interactive Report Viewport */}
        <div className={`bg-white border border-slate-200 rounded-xl p-6 shadow-xs ${showConfigPanel ? 'xl:col-span-3' : 'xl:col-span-4'}`}>
          {/* Grid control bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              {!showConfigPanel && (
                <button
                  onClick={() => setShowConfigPanel(true)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer mr-2"
                >
                  <Settings className="h-4 w-4" /> Design Grid
                </button>
              )}
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Quick search records..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-indigo-600 w-full md:w-64"
                />
              </div>
            </div>

            {/* Density & Printing controls */}
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  onClick={() => setGridDensity('compact')}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md cursor-pointer transition-all ${gridDensity === 'compact' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Compact
                </button>
                <button
                  onClick={() => setGridDensity('standard')}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md cursor-pointer transition-all ${gridDensity === 'standard' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Standard
                </button>
                <button
                  onClick={() => setGridDensity('comfortable')}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md cursor-pointer transition-all ${gridDensity === 'comfortable' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Spacious
                </button>
              </div>

              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer text-slate-600"
              >
                <FileSpreadsheet className="h-4 w-4" /> Export CSV
              </button>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer text-slate-600"
              >
                <Printer className="h-4 w-4" /> Print Ledger
              </button>
            </div>
          </div>

          {/* Double-click instruction banner */}
          <div className="pt-3 pb-1 flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <AlertCircle className="h-3.5 w-3.5 text-indigo-500" />
            <span>Double click cell values to update real-time database values directly inside the report.</span>
          </div>

          {/* Main ERP table viewer */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl mt-3">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {columnsSelection.map((colKey) => {
                    const col = currentDatasetConfig.allColumns.find((c) => c.key === colKey);
                    return (
                      <th key={colKey} className="py-2.5 px-4">
                        <div
                          className="flex items-center gap-1.5 cursor-pointer hover:text-indigo-600 select-none"
                          onClick={() => {
                            if (sortingColumn === colKey) {
                              setSortingOrder(sortingOrder === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSortingColumn(colKey);
                              setSortingOrder('desc');
                            }
                          }}
                        >
                          <span>{col?.label || colKey}</span>
                          {sortingColumn === colKey && (
                            <ArrowUpDown className="h-3 w-3 text-indigo-500" />
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                {Object.keys(dataGroups).map((groupName) => {
                  const rows = dataGroups[groupName];
                  return (
                    <React.Fragment key={groupName}>
                      {/* Pivot Group Header */}
                      {groupingColumn && (
                        <tr className="bg-slate-50/70 border-y border-slate-200">
                          <td
                            colSpan={columnsSelection.length}
                            className="py-2 px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest bg-slate-100/50"
                          >
                            📁 {groupName} ({rows.length} records)
                          </td>
                        </tr>
                      )}

                      {/* Group Rows */}
                      {rows.map((row: any) => (
                        <tr
                          key={row.id}
                          className="hover:bg-indigo-50/10 transition-colors group"
                        >
                          {columnsSelection.map((colKey) => {
                            const isCellEditing = editingCell?.rowId === row.id && editingCell?.colKey === colKey;
                            const cellValue = row[colKey];
                            const highlightClass = getCellHighlightClass(colKey, cellValue);

                            // Format helpers
                            let renderedValue = cellValue;
                            if (typeof cellValue === 'boolean') {
                              renderedValue = cellValue ? (
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded text-[9px] font-bold">YES / PAID</span>
                              ) : (
                                <span className="bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded text-[9px] font-bold">NO / DUE</span>
                              );
                            } else if (['cost', 'price', 'total', 'subtotal', 'amount', 'outstandingBalance'].includes(colKey) && typeof cellValue === 'number') {
                              renderedValue = `৳${cellValue.toLocaleString()}`;
                            } else if (colKey === 'stock' && typeof cellValue === 'number' && row.pcsPerBox) {
                              renderedValue = `${cellValue} ${row.unit || 'Pcs'} (${formatBoxQty(cellValue, row.pcsPerBox)})`;
                            }

                            return (
                              <td
                                key={colKey}
                                className={`px-4 border-r border-slate-50/50 font-medium relative ${
                                  gridDensity === 'compact' ? 'py-1.5' : gridDensity === 'comfortable' ? 'py-4' : 'py-3'
                                }`}
                                onDoubleClick={() => {
                                  setEditingCell({ rowId: row.id, colKey });
                                  setEditingValue(String(cellValue));
                                }}
                              >
                                {isCellEditing ? (
                                  <div className="flex items-center gap-1 bg-white border border-indigo-500 rounded p-0.5 shadow-sm z-20 relative max-w-[150px]">
                                    {typeof cellValue === 'boolean' ? (
                                      <select
                                        value={editingValue}
                                        onChange={(e) => setEditingValue(e.target.value)}
                                        className="w-full text-xs font-bold text-slate-700 focus:outline-none bg-transparent cursor-pointer"
                                        autoFocus
                                      >
                                        <option value="true">YES</option>
                                        <option value="false">NO</option>
                                      </select>
                                    ) : (
                                      <input
                                        type="text"
                                        value={editingValue}
                                        onChange={(e) => setEditingValue(e.target.value)}
                                        className="w-full text-xs font-bold text-slate-700 focus:outline-none bg-transparent"
                                        autoFocus
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') saveCellEdit(row.id, colKey);
                                          if (e.key === 'Escape') setEditingCell(null);
                                        }}
                                      />
                                    )}
                                    <button
                                      onClick={() => saveCellEdit(row.id, colKey)}
                                      className="p-0.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded cursor-pointer"
                                    >
                                      <Check className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() => setEditingCell(null)}
                                      className="p-0.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded cursor-pointer"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between">
                                    <span className={highlightClass}>
                                      {renderedValue}
                                    </span>
                                    <Edit2 className="h-3 w-3 text-slate-300 group-hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}

                      {/* Subtotal calculation row */}
                      {columnsSelection.some((colKey) => selectedAggregates[colKey] && selectedAggregates[colKey] !== 'none') && (
                        <tr className="bg-slate-50/50 font-semibold border-y border-slate-200">
                          {columnsSelection.map((colKey) => {
                            const aggregateText = calculateAggregate(rows, colKey);
                            return (
                              <td key={colKey} className="py-2.5 px-4 font-bold text-indigo-700 text-[10px] uppercase font-mono">
                                {aggregateText}
                              </td>
                            );
                          })}
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )}
</div>
  );
}
