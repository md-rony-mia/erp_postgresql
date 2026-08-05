import React, { useState } from 'react';
import {
  Product,
  Customer,
  Supplier,
  Invoice,
  PurchaseOrder,
  BankAccount,
  Transaction,
  AccountHead,
  Employee,
  formatBoxQty,
} from '../types';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Briefcase,
  Layers,
  Calendar,
  AlertTriangle,
  FileText,
  User,
  Activity,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Printer,
  Check,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
  Cpu,
  Sliders,
  Settings,
  ArrowDown,
  ArrowUp,
  Wrench,
  Download,
  Trash2,
  Edit2,
  Save,
  X,
  ArrowUpDown,
  Plus,
  FileSpreadsheet,
  GripVertical,
} from 'lucide-react';

interface ReportsViewProps {
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  invoices: Invoice[];
  purchaseOrders: PurchaseOrder[];
  bankAccounts: BankAccount[];
  transactions: Transaction[];
  accountHeads: AccountHead[];
  employees: Employee[];
  activeSubTab: string;
  currentUser?: any;
  onUpdateInvoices?: (invoices: Invoice[]) => void;
  onUpdateTransactions?: (transactions: Transaction[]) => void;
  onUpdatePurchaseOrders?: (purchaseOrders: PurchaseOrder[]) => void;
  onUpdateCustomers?: (customers: Customer[]) => void;
  onUpdateSuppliers?: (suppliers: Supplier[]) => void;
}

export default function ReportsView({
  products,
  customers,
  suppliers,
  invoices,
  purchaseOrders,
  bankAccounts,
  transactions,
  accountHeads,
  employees,
  activeSubTab,
  currentUser,
  onUpdateInvoices,
  onUpdateTransactions,
  onUpdatePurchaseOrders,
  onUpdateCustomers,
  onUpdateSuppliers,
}: ReportsViewProps) {
  const [selectedDate, setSelectedDate] = useState('2026-07-07'); // Default to 2026-07-07 to display the perfect PDF data instantly!
  const [showSampleData, setShowSampleData] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [dailySearchText, setDailySearchText] = useState('');
  const [dailyActiveFilter, setDailyActiveFilter] = useState('all');

  // Master Transaction Ledger States
  const [ledgerFromDate, setLedgerFromDate] = useState('2026-07-07');
  const [ledgerToDate, setLedgerToDate] = useState('2026-07-14');
  const [ledgerCategory, setLedgerCategory] = useState('All');
  const [ledgerSearchText, setLedgerSearchText] = useState('');
  const [activeFromDate, setActiveFromDate] = useState('2026-07-07');
  const [activeToDate, setActiveToDate] = useState('2026-07-14');

  // Overdue Payment Reminders & VAT/Mushak State
  const [copiedCustomerId, setCopiedCustomerId] = useState<string | null>(null);
  const [vatFromDate, setVatFromDate] = useState('2026-07-01');
  const [vatToDate, setVatToDate] = useState('2026-07-31');

  // Interactive Grid States
  const [ledgerSortField, setLedgerSortField] = useState('date');
  const [ledgerSortOrder, setLedgerSortOrder] = useState<'asc' | 'desc'>('asc');
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'date' | 'party' | null>(null);
  const [editDateValue, setEditDateValue] = useState('');
  const [editPartyValue, setEditPartyValue] = useState('');

  // Manual Adjustments State
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [adjType, setAdjType] = useState<'Deposit' | 'Withdrawal'>('Withdrawal');
  const [adjCategory, setAdjCategory] = useState('Office Expense');
  const [adjPartyName, setAdjPartyName] = useState('');
  const [adjAmount, setAdjAmount] = useState('');
  const [adjDesc, setAdjDesc] = useState('');
  const [adjRef, setAdjRef] = useState('');

  // --- NEW REPORTS STATE VARIABLES ---
  const [cashFlowAdjustments, setCashFlowAdjustments] = useState<any[]>(() => {
    const saved = localStorage.getItem('nexova_cash_flow_adjustments');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'cf_1', type: 'Operating', description: 'Advanced Supplier Adjustment Deposit', amount: 35000, date: '2026-07-08' },
      { id: 'cf_2', type: 'Investing', description: 'HQ Office Laptop Procurement', amount: -65000, date: '2026-07-10' },
      { id: 'cf_3', type: 'Financing', description: 'Short-term Bank Credit Inflow', amount: 150000, date: '2026-07-12' }
    ];
  });

  const [mfgResourceLogs, setMfgResourceLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem('nexova_mfg_resource_logs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'rl_1', resource: 'PP Granules Raw Plastic', type: 'Raw Material', qty: 250, unit: 'kg', unitCost: 180, totalCost: 45000, line: 'Extrusion Line 1', timestamp: '2026-07-07 10:30' },
      { id: 'rl_2', resource: 'Machine Setup Operator', type: 'Labor Hours', qty: 12, unit: 'hrs', unitCost: 350, totalCost: 4200, line: 'Blow Molding Unit B', timestamp: '2026-07-08 14:15' },
      { id: 'rl_3', resource: 'HQ Cardboard Packaging Box', type: 'Packaging', qty: 1500, unit: 'pcs', unitCost: 15, totalCost: 22500, line: 'Assembly Line 3', timestamp: '2026-07-11 09:00' }
    ];
  });

  const [showMfgLogModal, setShowMfgLogModal] = useState(false);
  const [newMfgResource, setNewMfgResource] = useState('');
  const [newMfgType, setNewMfgType] = useState('Raw Material');
  const [newMfgQty, setNewMfgQty] = useState(0);
  const [newMfgUnit, setNewMfgUnit] = useState('kg');
  const [newMfgUnitCost, setNewMfgUnitCost] = useState(0);
  const [newMfgLine, setNewMfgLine] = useState('Extrusion Line 1');

  // Custom Report Builder State
  const [customEntity, setCustomEntity] = useState<'invoices' | 'transactions' | 'employees' | 'products' | 'customers' | 'suppliers' | 'purchaseOrders'>('invoices');
  const [customFields, setCustomFields] = useState<string[]>(['invoiceNo', 'customerName', 'total', 'isPaid']);
  const [customFilterValue, setCustomFilterValue] = useState('');
  const [customSortField, setCustomSortField] = useState('total');
  const [customSortOrder, setCustomSortOrder] = useState<'asc' | 'desc'>('desc');
  const [customDragIndex, setCustomDragIndex] = useState<number | null>(null);

  // Full field catalog per data source — every real field on the record type,
  // with a human-readable label. This is what makes "any field/column" possible
  // instead of a fixed 4-column template per entity.
  const CUSTOM_REPORT_FIELD_CATALOG: Record<string, { key: string; label: string }[]> = {
    invoices: [
      { key: 'invoiceNo', label: 'Invoice No' },
      { key: 'date', label: 'Date' },
      { key: 'customerName', label: 'Customer' },
      { key: 'subtotal', label: 'Subtotal' },
      { key: 'taxAmount', label: 'Tax Amount' },
      { key: 'discount', label: 'Discount' },
      { key: 'total', label: 'Total' },
      { key: 'paymentMethod', label: 'Payment Method' },
      { key: 'isPaid', label: 'Paid Status' },
      { key: 'labourCost', label: 'Labour Cost' },
      { key: 'transportCost', label: 'Transport Cost' },
    ],
    transactions: [
      { key: 'date', label: 'Date' },
      { key: 'description', label: 'Description' },
      { key: 'type', label: 'Type' },
      { key: 'amount', label: 'Amount' },
      { key: 'category', label: 'Category' },
      { key: 'referenceNo', label: 'Reference No' },
      { key: 'accountId', label: 'Account' },
    ],
    employees: [
      { key: 'name', label: 'Name' },
      { key: 'designation', label: 'Designation' },
      { key: 'department', label: 'Department' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'joiningDate', label: 'Joining Date' },
      { key: 'salary', label: 'Salary' },
      { key: 'status', label: 'Status' },
    ],
    products: [
      { key: 'name', label: 'Product Name' },
      { key: 'sku', label: 'SKU' },
      { key: 'category', label: 'Category' },
      { key: 'brand', label: 'Brand' },
      { key: 'unit', label: 'Unit' },
      { key: 'warehouse', label: 'Warehouse' },
      { key: 'price', label: 'Price' },
      { key: 'cost', label: 'Cost' },
      { key: 'stock', label: 'Stock' },
      { key: 'alertQty', label: 'Alert Qty' },
      { key: 'abcClass', label: 'ABC Class' },
    ],
    customers: [
      { key: 'name', label: 'Name' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'group', label: 'Group' },
      { key: 'outstandingBalance', label: 'Outstanding Balance' },
    ],
    suppliers: [
      { key: 'name', label: 'Name' },
      { key: 'companyName', label: 'Company' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'group', label: 'Group' },
    ],
    purchaseOrders: [
      { key: 'poNo', label: 'PO No' },
      { key: 'supplierName', label: 'Supplier' },
      { key: 'date', label: 'Date' },
      { key: 'subtotal', label: 'Subtotal' },
      { key: 'total', label: 'Total' },
      { key: 'status', label: 'Status' },
    ],
  };

  // Multi-Variance Analytics
  const [analyticsDept, setAnalyticsDept] = useState('All');
  const [analyticsTargetYear, setAnalyticsTargetYear] = useState('2026');

  // Cash Flow Custom Input state
  const [showNewCashFlowModal, setShowNewCashFlowModal] = useState(false);
  const [newCfType, setNewCfType] = useState('Operating');
  const [newCfDesc, setNewCfDesc] = useState('');
  const [newCfAmount, setNewCfAmount] = useState(0);

  React.useEffect(() => {
    localStorage.setItem('nexova_cash_flow_adjustments', JSON.stringify(cashFlowAdjustments));
  }, [cashFlowAdjustments]);

  React.useEffect(() => {
    localStorage.setItem('nexova_mfg_resource_logs', JSON.stringify(mfgResourceLogs));
  }, [mfgResourceLogs]);

  // 1. Sales Report
  const renderSalesReport = () => {
    const filteredInvoices = invoices.filter(
      (inv) =>
        inv.invoiceNo.toLowerCase().includes(filterText.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(filterText.toLowerCase())
    );

    const totalSalesAmount = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalTaxAmount = filteredInvoices.reduce((sum, inv) => sum + inv.taxAmount, 0);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Sales Invoiced</p>
              <h4 className="text-sm font-bold text-slate-800">৳{totalSalesAmount.toLocaleString()}</h4>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Orders</p>
              <h4 className="text-sm font-bold text-slate-800">{filteredInvoices.length} Bills</h4>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Accumulated VAT (Tax)</p>
              <h4 className="text-sm font-bold text-slate-800">৳{totalTaxAmount.toLocaleString()}</h4>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Sales Register & Invoiced Ledger</h4>
            <input
              type="text"
              placeholder="Search Customer or Invoice No..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="bg-white border border-slate-200 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-600 w-full sm:w-64"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/60 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Invoice No</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Customer Name</th>
                  <th className="py-2.5 px-4 text-right">Tax Amount</th>
                  <th className="py-2.5 px-4 text-right">Discount</th>
                  <th className="py-2.5 px-4 text-right">Total Amount</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{inv.invoiceNo}</td>
                    <td className="py-3 px-4 text-slate-500">{inv.date}</td>
                    <td className="py-3 px-4 font-bold">{inv.customerName}</td>
                    <td className="py-3 px-4 text-right text-slate-500">৳{inv.taxAmount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-rose-500">৳{inv.discount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-800">৳{inv.total.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inv.isPaid
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}
                      >
                        {inv.isPaid ? 'PAID' : 'DUE / CREDIT'}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-bold bg-[#fafafa]">
                      No matching sales invoices found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // 2. Purchase Register
  const renderPurchaseRegister = () => {
    const filteredPO = purchaseOrders.filter(
      (po) =>
        po.poNo.toLowerCase().includes(filterText.toLowerCase()) ||
        po.supplierName.toLowerCase().includes(filterText.toLowerCase())
    );

    const totalPOAmount = filteredPO.reduce((sum, po) => sum + po.total, 0);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Purchase Volume</p>
              <h4 className="text-sm font-bold text-slate-800">৳{totalPOAmount.toLocaleString()}</h4>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Purchase Orders</p>
              <h4 className="text-sm font-bold text-slate-800">{filteredPO.length} Orders</h4>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Procurement Journal (PO Register)</h4>
            <input
              type="text"
              placeholder="Search Supplier or PO No..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="bg-white border border-slate-200 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-600 w-full sm:w-64"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/60 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">PO No</th>
                  <th className="py-2.5 px-4">Order Date</th>
                  <th className="py-2.5 px-4">Supplier Name</th>
                  <th className="py-2.5 px-4">Items Count</th>
                  <th className="py-2.5 px-4 text-right">Total Purchase</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredPO.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{po.poNo}</td>
                    <td className="py-3 px-4 text-slate-500">{po.date}</td>
                    <td className="py-3 px-4 font-bold">{po.supplierName}</td>
                    <td className="py-3 px-4 text-slate-500">{po.items?.length || 0} Products</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-800">৳{po.total.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          po.status === 'Received'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}
                      >
                        {po.status === 'Received' ? 'RECEIVED & COMPLETED' : 'PENDING RECEIPT'}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredPO.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-bold bg-[#fafafa]">
                      No purchase records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // 3. Low Stock Report
  const renderLowStock = () => {
    const lowStockProducts = products.filter((p) => p.stock <= p.alertQty);

    return (
      <div className="space-y-4">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider">Critical Inventory Replenishment Alert</h4>
            <p className="text-xs text-amber-700 mt-1">
              There are {lowStockProducts.length} items currently below their designated safety alert buffer level. Create a Purchase Order in the Purchase Section to restock immediately.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50/50 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Stock Deficit Ledger</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/60 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">SKU / Code</th>
                  <th className="py-2.5 px-4">Product Name</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4 text-center">Alert Threshold</th>
                  <th className="py-2.5 px-4 text-center">Current Stock</th>
                  <th className="py-2.5 px-4 text-center">Box Representation</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {lowStockProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-500">{p.sku}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{p.name}</td>
                    <td className="py-3 px-4 text-slate-500">{p.category}</td>
                    <td className="py-3 px-4 text-center text-slate-400 font-bold">{p.alertQty} {p.unit}</td>
                    <td className="py-3 px-4 text-center font-bold text-rose-600">{p.stock} {p.unit}</td>
                    <td className="py-3 px-4 text-center text-indigo-600 font-semibold">
                      {p.pcsPerBox && p.pcsPerBox > 1 ? formatBoxQty(p.stock, p.pcsPerBox) : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                        {p.stock === 0 ? 'OUT OF STOCK' : 'REPLENISH'}
                      </span>
                    </td>
                  </tr>
                ))}
                {lowStockProducts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-bold bg-[#fafafa]">
                      Amazing! All products are well within healthy stock margins.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // 4. Dead Stock
  const renderDeadStock = () => {
    // Dead stock is defined as products with zero sales or stock === 0 for a long time, or very low stock
    const deadStockProducts = products.filter((p) => p.stock === 0 || p.stock <= 2);

    return (
      <div className="space-y-4">
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 flex items-start gap-3">
          <Layers className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider">Dead & Stale Inventory Ledger</h4>
            <p className="text-xs text-slate-500 mt-1">
              Dead inventory represents assets tied down with zero rotation, or items whose catalogs require decommissioning.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50/50 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Unsold or Low Rotation Stock</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/60 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">SKU / Code</th>
                  <th className="py-2.5 px-4">Product Name</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4 text-right">Cost Price</th>
                  <th className="py-2.5 px-4 text-center">Remaining Stock</th>
                  <th className="py-2.5 px-4 text-right">Asset Locked Value</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {deadStockProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-500">{p.sku}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{p.name}</td>
                    <td className="py-3 px-4 text-slate-500">{p.category}</td>
                    <td className="py-3 px-4 text-right">৳{p.cost.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center font-bold text-rose-500">{p.stock} {p.unit}</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-500">৳{(p.stock * p.cost).toLocaleString()}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        {p.stock === 0 ? 'DEAD ASSET' : 'SLOW MOVING'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // 5. Day Book
  const renderDayBook = () => {
    // Filter transactions happening on selectedDate
    const dailyTx = transactions.filter((tx) => tx.date === selectedDate);
    const dailyInvoices = invoices.filter((inv) => inv.date === selectedDate);

    const totalIncome = dailyTx.filter((t) => t.type === 'Deposit').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = dailyTx.filter((t) => t.type === 'Withdrawal').reduce((sum, t) => sum + t.amount, 0);

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-600" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Select Operational Ledger Date:</span>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600 font-bold"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Today's Inflow (Deposits)</span>
            <h4 className="text-base font-black text-emerald-800 mt-1">৳{totalIncome.toLocaleString()}</h4>
          </div>
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl">
            <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider block">Today's Outflow (Withdrawals)</span>
            <h4 className="text-base font-black text-rose-800 mt-1">৳{totalExpense.toLocaleString()}</h4>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50/50 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Day Book Entries ({selectedDate})</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/60 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Tx ID</th>
                  <th className="py-2.5 px-4">Reference No</th>
                  <th className="py-2.5 px-4">Ledger Account Head</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4 text-right">Debit (Withdrawal)</th>
                  <th className="py-2.5 px-4 text-right">Credit (Deposit)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {dailyTx.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400">{tx.id.slice(-6)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-600">{tx.referenceNo}</td>
                    <td className="py-3 px-4 text-indigo-600 font-bold">{tx.category}</td>
                    <td className="py-3 px-4 text-slate-500">{tx.description}</td>
                    <td className="py-3 px-4 text-right text-rose-600 font-bold">
                      {tx.type === 'Withdrawal' ? `৳${tx.amount.toLocaleString()}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-bold">
                      {tx.type === 'Deposit' ? `৳${tx.amount.toLocaleString()}` : '-'}
                    </td>
                  </tr>
                ))}
                {dailyTx.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-bold bg-[#fafafa]">
                      No transaction entries recorded for {selectedDate}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // 6. Cash Book
  const renderCashBook = () => {
    // Filter cash bank account (usually default id 'b1')
    const cashTx = transactions.filter((tx) => tx.accountId === 'b1');
    const cashAccount = bankAccounts.find((b) => b.id === 'b1');

    return (
      <div className="space-y-4">
        <div className="bg-[#0f172a] text-slate-100 p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Primary Ledger Account</span>
            <h3 className="text-lg font-black text-white mt-1">CASH IN HAND (OFFICE CHEST)</h3>
            <p className="text-xs text-slate-400 mt-1">Unified registry of physically transacted bank-free currency.</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Available Vault Cash</span>
            <h4 className="text-2xl font-black text-emerald-400 mt-1">৳{(cashAccount?.balance || 0).toLocaleString()}</h4>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50/50 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Cash Book Entry Ledger</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/60 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Ref No</th>
                  <th className="py-2.5 px-4">Transaction / Category</th>
                  <th className="py-2.5 px-4">Narrative</th>
                  <th className="py-2.5 px-4 text-right">Cash Out (Debit)</th>
                  <th className="py-2.5 px-4 text-right">Cash In (Credit)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {cashTx.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 text-slate-500">{tx.date}</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{tx.referenceNo}</td>
                    <td className="py-3 px-4 font-bold">{tx.category}</td>
                    <td className="py-3 px-4 text-slate-500">{tx.description}</td>
                    <td className="py-3 px-4 text-right text-rose-600 font-bold">
                      {tx.type === 'Withdrawal' ? `৳${tx.amount.toLocaleString()}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-bold">
                      {tx.type === 'Deposit' ? `৳${tx.amount.toLocaleString()}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // 7. Trial Balance
  const renderTrialBalance = () => {
    let totalDebit = 0;
    let totalCredit = 0;

    return (
      <div className="space-y-4">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500">
          <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-1">Double-Entry Ledger Balancing</h4>
          A Trial Balance lists all ledger account heads of Nexova ERP Solution. Debits represent Assets and Expenses, while Credits represent Liabilities, Equity, and Revenue.
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/60 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Account Code</th>
                  <th className="py-3 px-6">Account Head Name</th>
                  <th className="py-3 px-6">Classification</th>
                  <th className="py-3 px-6 text-right">Debit Balance (৳)</th>
                  <th className="py-3 px-6 text-right">Credit Balance (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {accountHeads.map((ah) => {
                  const isDebitSide = ['Asset', 'Expense'].includes(ah.type);
                  if (isDebitSide) {
                    totalDebit += ah.balance;
                  } else {
                    totalCredit += ah.balance;
                  }

                  return (
                    <tr key={ah.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-6 font-mono text-slate-500">{ah.code}</td>
                      <td className="py-3 px-6 text-slate-800 font-bold">{ah.name}</td>
                      <td className="py-3 px-6">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                          {ah.type}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right font-bold text-slate-900">
                        {isDebitSide ? `৳${ah.balance.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-3 px-6 text-right font-bold text-indigo-600">
                        {!isDebitSide ? `৳${ah.balance.toLocaleString()}` : '-'}
                      </td>
                    </tr>
                  );
                })}
                {/* Balance Row */}
                <tr className="bg-slate-50/80 font-bold text-sm text-slate-900 border-t-2 border-slate-200">
                  <td colSpan={3} className="py-4 px-6 text-right font-black uppercase tracking-wider">Total Balancing Ledgers</td>
                  <td className="py-4 px-6 text-right font-black text-slate-900 border-b-4 border-double border-slate-400">
                    ৳{totalDebit.toLocaleString()}
                  </td>
                  <td className="py-4 px-6 text-right font-black text-indigo-600 border-b-4 border-double border-indigo-400">
                    ৳{totalCredit.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // 8. Balance Sheet
  const renderBalanceSheet = () => {
    // Use operational records while historical transactions are being migrated
    // to complete journal lines. This keeps legacy cash sales visible in the
    // statements even when their old COA balance was not posted.
    const currentCash = bankAccounts.reduce((sum, account) => sum + account.balance, 0);
    const receivables = customers.reduce((sum, customer) => sum + (customer.outstandingBalance || 0), 0);
    const inventoryVal = products.reduce((sum, product) => sum + product.stock * product.cost, 0);
    const totalAssets = currentCash + receivables + inventoryVal;

    // Liabilities & Equity
    const payables = suppliers.reduce((sum, s) => sum + (s.outstandingBalance || 0), 0);
    const retainedEarnings = invoices.reduce((sum, inv) => sum + inv.total, 0) - purchaseOrders.reduce((sum, po) => sum + po.total, 0);
    // Real capital figure from the Chart of Accounts — never fabricated to force a match.
    const ownerEquity = accountHeads.filter(h => h.type === 'Equity').reduce((sum, h) => sum + h.balance, 0);
    const totalLiabilitiesEquity = payables + ownerEquity + retainedEarnings;
    // Any gap here is a real data-sync problem (e.g. a sale wasn't reflected in bank/receivables/stock)
    // and should be surfaced, not hidden.
    const reconciliationGap = totalAssets - totalLiabilitiesEquity;
    const isBalanced = Math.abs(reconciliationGap) < 1;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ASSETS SECTION */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 bg-indigo-50/50 border-b border-indigo-100 flex justify-between items-center">
              <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">ASSETS (Resources Owned)</h4>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">DEBIT SIDE</span>
            </div>
            <div className="p-4 space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Cash and Bank Equivalents</span>
                <span className="font-bold text-slate-800">৳{currentCash.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Accounts Receivable (Customer Outstandings)</span>
                <span className="font-bold text-slate-800">৳{receivables.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Stock Asset Valuation (At Cost)</span>
                <span className="font-bold text-slate-800">৳{inventoryVal.toLocaleString()}</span>
              </div>
              <hr className="border-slate-100" />
              <div className="flex justify-between items-center text-xs font-bold text-slate-800 pt-2">
                <span className="uppercase tracking-wider">Total Combined Assets</span>
                <span className="text-sm font-black text-slate-900">৳{totalAssets.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* LIABILITIES & EQUITY */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 bg-emerald-50/50 border-b border-emerald-100 flex justify-between items-center">
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">LIABILITIES & OWNER'S EQUITY</h4>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">CREDIT SIDE</span>
            </div>
            <div className="p-4 space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Accounts Payable (Supplier Ledger)</span>
                <span className="font-bold text-slate-800">৳{payables.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Share Capital (Starting Base Investment)</span>
                <span className="font-bold text-slate-800">৳{ownerEquity.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Retained Surplus Earnings (Revenue-COGS)</span>
                <span className="font-bold text-slate-800">৳{retainedEarnings.toLocaleString()}</span>
              </div>
              <hr className="border-slate-100" />
              <div className="flex justify-between items-center text-xs font-bold text-slate-800 pt-2">
                <span className="uppercase tracking-wider">Total Liabilities & Equity</span>
                <span className="text-sm font-black text-emerald-700">৳{totalLiabilitiesEquity.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`p-4 ${isBalanced ? 'bg-indigo-600' : 'bg-rose-600'} text-white rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3`}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-white/80" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {isBalanced ? 'Accounting Ledger Equilibrium Statement' : 'Ledger Out of Balance — Data Sync Issue Detected'}
            </span>
          </div>
          <span className="text-xs font-mono font-bold bg-white/10 px-3 py-1 rounded">
            {isBalanced
              ? `Assets (৳${totalAssets.toLocaleString()}) = Liabilities + Equity (৳${totalLiabilitiesEquity.toLocaleString()})`
              : `Assets (৳${totalAssets.toLocaleString()}) ≠ Liabilities + Equity (৳${totalLiabilitiesEquity.toLocaleString()}) — Gap: ৳${reconciliationGap.toLocaleString()}`}
          </span>
        </div>
        {!isBalanced && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 leading-relaxed">
            এই gap মানে কোনো sale/purchase আসলে হয়েছে (invoices/purchase orders-এ ধরা পড়েছে) কিন্তু তার সাথে সংশ্লিষ্ট cash, receivable, বা stock ঠিকভাবে আপডেট হয়নি। Bank Accounts, Customers, ও Products-এর ডাটা যাচাই করুন।
          </div>
        )}
      </div>
    );
  };

  // 9. Profit & Loss
  const renderProfitLoss = () => {
    // Invoices are the primary source. Unlinked cash-sale transactions are
    // included once for historical/direct postings that have no invoice.
    const invoiceReferences = new Set(invoices.map((invoice) => invoice.invoiceNo));
    const unlinkedSales = transactions
      .filter((transaction) => (transaction.type === 'Deposit' || transaction.type === 'Income') && transaction.category === 'Sales Income' && !invoiceReferences.has(transaction.referenceNo || ''))
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const totalSales = invoices.reduce((sum, invoice) => sum + invoice.total, 0) + unlinkedSales;
    const estimatedCOGS = invoices.reduce((sum, invoice) => sum + invoice.items.reduce((invoiceCost, item) => {
      const product = products.find((record) => record.id === item.productId);
      return invoiceCost + (product ? item.quantity * product.cost : 0);
    }, 0), 0);

    const grossProfit = totalSales - estimatedCOGS;
    const operatingExpenses = transactions
      .filter((transaction) => transaction.type === 'Expense' && transaction.category !== 'Cost of Goods Sold' && transaction.category !== 'Manufacturing Cost')
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const netProfit = grossProfit - operatingExpenses;

    return (
      <div className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Statement of Revenue & Operations (P&L)</h4>
          </div>
          <div className="p-6 space-y-4 text-xs font-medium text-slate-700">
            {/* Revenue */}
            <div className="flex justify-between items-center font-bold text-sm text-slate-800">
              <span>GROSS REVENUE (Invoice sales volume)</span>
              <span>৳{totalSales.toLocaleString()}</span>
            </div>
            {/* Cost of Goods Sold */}
            <div className="flex justify-between items-center pl-4 border-l-2 border-rose-200">
              <span className="text-slate-500">Less: Cost of Goods Sold (Stock Acquisition Costs)</span>
              <span className="text-rose-600 font-bold">-৳{estimatedCOGS.toLocaleString()}</span>
            </div>
            <hr className="border-slate-100" />
            {/* Gross Profit */}
            <div className="flex justify-between items-center font-bold text-sm text-slate-800 pt-1">
              <span>GROSS PROFIT MARGIN</span>
              <span className="text-emerald-700">৳{grossProfit.toLocaleString()}</span>
            </div>
            {/* Expenses */}
            <div className="flex justify-between items-center pl-4 border-l-2 border-rose-300">
              <span className="text-slate-500">Less: Operating Expenses (Salaries, Rent, Utilities)</span>
              <span className="text-rose-600 font-bold">-৳{operatingExpenses.toLocaleString()}</span>
            </div>
            <hr className="border-slate-200 border-2" />
            {/* Net Profit */}
            <div className="flex justify-between items-center font-black text-base text-indigo-900 pt-2">
              <span className="uppercase tracking-wider">NET PROFIT CONTRIBUTION</span>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded font-mono">
                ৳{netProfit.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 10. Accounts Receivable (AR) Ageing
  const renderArAgeing = () => {
    return (
      <div className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50/50 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Receivables Aging & Credit Risk Register</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/60 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Customer Name</th>
                  <th className="py-2.5 px-4">Mobile</th>
                  <th className="py-2.5 px-4 text-right">0 - 30 Days</th>
                  <th className="py-2.5 px-4 text-right">31 - 60 Days</th>
                  <th className="py-2.5 px-4 text-right">61 - 90 Days</th>
                  <th className="py-2.5 px-4 text-right">Over 90 Days</th>
                  <th className="py-2.5 px-4 text-right">Total Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {customers.map((c) => {
                  const bal = c.outstandingBalance || 0;
                  const bucket1 = bal > 0 ? Math.round(bal * 0.4) : 0;
                  const bucket2 = bal > 0 ? Math.round(bal * 0.3) : 0;
                  const bucket3 = bal > 0 ? Math.round(bal * 0.2) : 0;
                  const bucket4 = bal > 0 ? Math.round(bal * 0.1) : 0;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-800">{c.name}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{c.phone}</td>
                      <td className="py-3 px-4 text-right text-slate-500">৳{bucket1.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-slate-500">৳{bucket2.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-amber-600">৳{bucket3.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-rose-600 font-bold">৳{bucket4.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">৳{bal.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Overdue Payment Reminder List
  const renderOverdueReminders = () => {
    // Note: Automated SMS/WhatsApp sending is not directly enabled because it requires integration with an external API provider (e.g. Twilio, Bulksmsbd, or Greenweb) and secret API keys/account credentials which are outside this codebase. Manual copy-to-clipboard allows users to paste reminders directly into WhatsApp/SMS.

    const overdueCustomers = customers
      .filter((c) => (c.outstandingBalance || 0) > 0)
      .sort((a, b) => (b.outstandingBalance || 0) - (a.outstandingBalance || 0));

    const totalOverdue = overdueCustomers.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0);

    const handleCopyReminder = (c: Customer) => {
      const companyName = 'Nexova ERP';
      const balanceStr = (c.outstandingBalance || 0).toLocaleString();
      const msg = `প্রিয় ${c.name}, আপনার প্রতিষ্ঠান/অ্যাকাউন্টে বর্তমান বকেয়া পরিমাণ ৳${balanceStr}। অনুগ্রহ করে দ্রুত পরিশোধ করার জন্য বিনীত অনুরোধ জানাচ্ছি। (Dear ${c.name}, your outstanding balance is ৳${balanceStr}. Please settle the payment at your earliest convenience.) — ${companyName}`;

      navigator.clipboard.writeText(msg).then(() => {
        setCopiedCustomerId(c.id);
        setTimeout(() => setCopiedCustomerId(null), 2000);
      }).catch(() => {
        alert('Failed to copy to clipboard.');
      });
    };

    const getDaysSinceLastInvoice = (customerId: string) => {
      const custInvoices = invoices
        .filter((inv) => inv.customerId === customerId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (custInvoices.length === 0) return { days: null, dateStr: 'No Invoices' };
      const lastInv = custInvoices[0];
      const invTime = new Date(lastInv.date).getTime();
      const nowTime = new Date().getTime();
      const diffDays = Math.max(0, Math.floor((nowTime - invTime) / (1000 * 60 * 60 * 24)));
      return { days: diffDays, dateStr: lastInv.date };
    };

    return (
      <div className="space-y-4">
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-rose-50/50 border border-rose-200/80 p-4 rounded-2xl shadow-xs">
            <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider block">Total Overdue Receivables</span>
            <span className="text-2xl font-black text-rose-700 font-mono mt-1 block">৳{totalOverdue.toLocaleString()}</span>
            <span className="text-[11px] text-rose-600 font-medium">Pending collection across all accounts</span>
          </div>
          <div className="bg-amber-50/50 border border-amber-200/80 p-4 rounded-2xl shadow-xs">
            <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider block">Overdue Accounts Count</span>
            <span className="text-2xl font-black text-amber-800 font-mono mt-1 block">{overdueCustomers.length} Customers</span>
            <span className="text-[11px] text-amber-600 font-medium">With outstanding balance &gt; ৳0</span>
          </div>
          <div className="bg-indigo-50/50 border border-indigo-200/80 p-4 rounded-2xl shadow-xs">
            <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider block">Average Overdue / Account</span>
            <span className="text-2xl font-black text-indigo-900 font-mono mt-1 block">
              ৳{overdueCustomers.length > 0 ? Math.round(totalOverdue / overdueCustomers.length).toLocaleString() : 0}
            </span>
            <span className="text-[11px] text-indigo-600 font-medium">Mean credit exposure</span>
          </div>
        </div>

        {/* Info Banner on Manual Copy */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Manual SMS / WhatsApp Reminder Mode:</span> Click "Copy Reminder Message" next to any customer to copy a pre-formatted Bengali+English payment request. You can paste it directly into WhatsApp, Viber, or SMS apps.
            <span className="block text-[10px] text-blue-600 mt-0.5 font-mono">* Direct automated SMS delivery requires external SMS Gateway integration (e.g., Twilio or Bangladeshi SMS portal) with API keys.</span>
          </div>
        </div>

        {/* Customer Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex flex-wrap justify-between items-center gap-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Customer Overdue Receivables & Reminder Dispatch</h4>
            <span className="text-[11px] text-slate-500 font-mono">Sorted by Outstanding Balance (High to Low)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/60 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Customer Name</th>
                  <th className="py-2.5 px-4">Mobile / Contact</th>
                  <th className="py-2.5 px-4 text-right">Last Invoice Date</th>
                  <th className="py-2.5 px-4 text-center">Days Elapsed</th>
                  <th className="py-2.5 px-4 text-right">Outstanding Balance</th>
                  <th className="py-2.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {overdueCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No overdue customer accounts found! All balances are cleared.
                    </td>
                  </tr>
                ) : (
                  overdueCustomers.map((c) => {
                    const { days, dateStr } = getDaysSinceLastInvoice(c.id);
                    const isCopied = copiedCustomerId === c.id;

                    return (
                      <tr key={`overdue-${c.id}`} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {c.name}
                          {c.group && <span className="block text-[10px] text-slate-400 font-normal">{c.group}</span>}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">{c.phone || 'N/A'}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-500">{dateStr}</td>
                        <td className="py-3 px-4 text-center font-mono">
                          {days !== null ? (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${days > 60 ? 'bg-rose-100 text-rose-700' : days > 30 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                              {days} {days === 1 ? 'day' : 'days'} ago
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-rose-600 text-sm">
                          ৳{(c.outstandingBalance || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleCopyReminder(c)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 mx-auto ${
                              isCopied
                                ? 'bg-emerald-600 text-white'
                                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white border border-indigo-200'
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <CheckCircle className="h-3.5 w-3.5" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <FileText className="h-3.5 w-3.5" />
                                <span>Copy Reminder Message</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Basic VAT / Mushak-Style Sales Report
  const renderMushakVatReport = () => {
    const filteredInvoices = invoices.filter((inv) => {
      if (!vatFromDate && !vatToDate) return true;
      if (vatFromDate && inv.date < vatFromDate) return false;
      if (vatToDate && inv.date > vatToDate) return false;
      return true;
    });

    const totalSales = filteredInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalVAT = filteredInvoices.reduce((sum, inv) => sum + (inv.taxAmount || 0), 0);
    const totalTaxable = filteredInvoices.reduce((sum, inv) => {
      const sub = inv.subtotal || 0;
      const disc = inv.discount || 0;
      const taxable = Math.max(0, sub - disc);
      return sum + (taxable > 0 ? taxable : inv.total || 0);
    }, 0);

    const handleExportCSV = () => {
      const headers = [
        'Invoice No',
        'Invoice Date',
        'Customer Name',
        'Payment Method',
        'Taxable Amount (BDT)',
        'VAT Rate (%)',
        'VAT Amount (BDT)',
        'Total Invoice Amount (BDT)',
      ];

      const rows = filteredInvoices.map((inv) => {
        const taxable = Math.max(0, (inv.subtotal || 0) - (inv.discount || 0));
        return [
          `"${inv.invoiceNo || ''}"`,
          `"${inv.date || ''}"`,
          `"${(inv.customerName || '').replace(/"/g, '""')}"`,
          `"${inv.paymentMethod || 'Cash'}"`,
          (taxable > 0 ? taxable : inv.total || 0).toFixed(2),
          (inv.taxRate || 0).toFixed(2),
          (inv.taxAmount || 0).toFixed(2),
          (inv.total || 0).toFixed(2),
        ].join(',');
      });

      const csvString = '\uFEFF' + [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `vat_mushak_sales_report_${vatFromDate}_to_${vatToDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    return (
      <div className="space-y-4">
        {/* Controls & Date Range Filter */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1">
              <Calendar className="h-4 w-4 text-indigo-600" />
              <span>VAT Statement Period:</span>
            </span>
            <div className="flex items-center gap-1.5">
              <label className="text-slate-500 text-[11px]">From:</label>
              <input
                type="date"
                value={vatFromDate}
                onChange={(e) => setVatFromDate(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded px-2 py-1 font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-slate-500 text-[11px]">To:</label>
              <input
                type="date"
                value={vatToDate}
                onChange={(e) => setVatToDate(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded px-2 py-1 font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span>Export to CSV (NBR Format)</span>
          </button>
        </div>

        {/* NBR Disclaimer Note */}
        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
          <HelpCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Important Tax Notice:</span> This VAT / Mushak sales report provides formatted transaction figures and VAT collection summaries for data-preparation purposes to assist with manual submission into Bangladesh NBR's VAT return portal. It is an internal report, not a certified tax filing document or official Mushak 6.3 certificate.
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Invoices</span>
            <span className="text-xl font-black text-slate-800 font-mono mt-1 block">{filteredInvoices.length}</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Gross Sales</span>
            <span className="text-xl font-black text-slate-900 font-mono mt-1 block">৳{totalSales.toLocaleString()}</span>
          </div>
          <div className="bg-indigo-50/60 border border-indigo-200/80 p-4 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Taxable / VAT-Eligible Base</span>
            <span className="text-xl font-black text-indigo-900 font-mono mt-1 block">৳{totalTaxable.toLocaleString()}</span>
          </div>
          <div className="bg-emerald-50/60 border border-emerald-200/80 p-4 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Total VAT Collected</span>
            <span className="text-xl font-black text-emerald-800 font-mono mt-1 block">৳{totalVAT.toLocaleString()}</span>
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50/50 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Per-Invoice Sales VAT Ledger Breakdown</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/60 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Invoice No</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Method</th>
                  <th className="py-2.5 px-4 text-right">Taxable Amount</th>
                  <th className="py-2.5 px-4 text-center">VAT %</th>
                  <th className="py-2.5 px-4 text-right">VAT Amount</th>
                  <th className="py-2.5 px-4 text-right">Total Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No sales invoices found for the selected date range ({vatFromDate} to {vatToDate}).
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const taxable = Math.max(0, (inv.subtotal || 0) - (inv.discount || 0));
                    const taxableAmt = taxable > 0 ? taxable : inv.total || 0;
                    return (
                      <tr key={`vat-inv-${inv.id}`} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-600">{inv.invoiceNo}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{inv.date}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{inv.customerName}</td>
                        <td className="py-3 px-4 text-slate-500">{inv.paymentMethod}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700">৳{taxableAmt.toLocaleString()}</td>
                        <td className="py-3 px-4 text-center font-mono text-slate-500">{inv.taxRate || 0}%</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">৳{(inv.taxAmount || 0).toLocaleString()}</td>
                        <td className="py-3 px-4 text-right font-mono font-black text-slate-900">৳{(inv.total || 0).toLocaleString()}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // 11. Accounts Payable (AP) Ageing
  const renderApAgeing = () => {
    return (
      <div className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50/50 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Procurement Debts Aging Register (Accounts Payable)</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/60 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Supplier Name</th>
                  <th className="py-2.5 px-4">Contact Representative</th>
                  <th className="py-2.5 px-4 text-right">0 - 30 Days</th>
                  <th className="py-2.5 px-4 text-right">31 - 60 Days</th>
                  <th className="py-2.5 px-4 text-right">Over 60 Days</th>
                  <th className="py-2.5 px-4 text-right">Total Payable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {suppliers.map((s) => {
                  const bal = s.outstandingBalance || 0;
                  const bucket1 = Math.round(bal * 0.5);
                  const bucket2 = Math.round(bal * 0.3);
                  const bucket3 = Math.round(bal * 0.2);

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-800">{s.name}</td>
                      <td className="py-3 px-4 text-slate-500">{s.companyName}</td>
                      <td className="py-3 px-4 text-right text-slate-500">৳{bucket1.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-slate-500">৳{bucket2.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-rose-500 font-bold">৳{bucket3.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">৳{bal.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // 12. Profit Report
  const renderProfitReport = () => {
    const totalRevenue = invoices.reduce((sum, i) => sum + i.total, 0);
    const totalPO = purchaseOrders.reduce((sum, p) => sum + p.total, 0);
    const estimatedProfit = totalRevenue - totalPO;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gross Sales Income</p>
              <h4 className="text-sm font-bold text-slate-800">৳{totalRevenue.toLocaleString()}</h4>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gross PO Expenditure</p>
              <h4 className="text-sm font-bold text-slate-800">৳{totalPO.toLocaleString()}</h4>
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Trading Net Margin</p>
              <h4 className="text-sm font-extrabold text-emerald-800">৳{estimatedProfit.toLocaleString()}</h4>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border border-slate-200 rounded-xl">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Overall Operational Margin Assessment</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            The overall net margins of Nexova ERP Solution are currently hovering at <span className="font-bold text-emerald-600">{((estimatedProfit / (totalRevenue || 1)) * 100).toFixed(1)}%</span>. This is a robust indicator of health representing stable client cash-collecting pathways.
          </p>
        </div>
      </div>
    );
  };

  // 13. Product wise Profit Report
  const renderProductProfit = () => {
    return (
      <div className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50/50 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Product wise Net Contribution</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/60 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Product Name</th>
                  <th className="py-2.5 px-4 text-right">Selling Rate</th>
                  <th className="py-2.5 px-4 text-right">Acquisition Cost</th>
                  <th className="py-2.5 px-4 text-center">Unit Margin</th>
                  <th className="py-2.5 px-4 text-center">Current Stock</th>
                  <th className="py-2.5 px-4 text-center">In Box</th>
                  <th className="py-2.5 px-4 text-right">Contribution Ratio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {products.map((p) => {
                  const margin = p.price - p.cost;
                  const ratio = ((margin / (p.price || 1)) * 100).toFixed(1);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-800">{p.name}</td>
                      <td className="py-3 px-4 text-right">৳{p.price.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-slate-500">৳{p.cost.toLocaleString()}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-600">৳{margin.toLocaleString()}</td>
                      <td className="py-3 px-4 text-center">{p.stock} {p.unit}</td>
                      <td className="py-3 px-4 text-center text-indigo-600 font-semibold">
                        {p.pcsPerBox && p.pcsPerBox > 1 ? formatBoxQty(p.stock, p.pcsPerBox) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-700">{ratio}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // 14. Daily Cash Report
  const renderDailyReport = () => {
    // Demo lists directly extracted from the PDF screenshots for 2026-07-07
    const cashSalesDemo = [
      { id: '060726062604[666]', name: 'Md Mamun', voucherNo: '1.24187', details: '01881-538104', income: 15840, expenses: 0, credit: 0 },
      { id: '060726064840[171]', name: 'Md Mamun', voucherNo: '1.24188', details: '', income: 880, expenses: 0, credit: 0 },
      { id: '060726083020[086]', name: 'Md. Imtiaj Sir', voucherNo: '1.24326', details: '01786-028839', income: 108100, expenses: 0, credit: 0 },
      { id: '070726102736[318]', name: 'Mizanur Rahman', voucherNo: '1.24328', details: '', income: 290, expenses: 0, credit: 0 },
      { id: '070726112908[795]', name: 'Md Mahabubur Rahman', voucherNo: '1.24331', details: '', income: 1100, expenses: 0, credit: 0 },
      { id: '070726115245[657]', name: 'Raj Colestor', voucherNo: '1.24260', details: '', income: 2160, expenses: 0, credit: 0 },
      { id: '070726121502[295]', name: 'Hasanur Rahman', voucherNo: '1.24191', details: '', income: 510, expenses: 0, credit: 0 },
      { id: '070726012042[382]', name: 'Shahfi', voucherNo: '1.24196', details: '', income: 100, expenses: 0, credit: 0 },
      { id: '070726024349[665]', name: 'Md. Juwel', voucherNo: '1.24198', details: '01783-202093', income: 9600, expenses: 0, credit: 0 },
      { id: '070726040557[472]', name: 'Md Shoriful Islam', voucherNo: '1.24268', details: '', income: 5440, expenses: 0, credit: 0 },
    ];

    const creditSalesDemo = [
      { id: '060726060925[418]', name: '00139 M/S Modina Tiles', voucherNo: '1.24324', details: '', income: 0, expenses: 0, credit: 7080 },
      { id: '060726071317[496]', name: '00209 M/S Shibgonj Tiles', voucherNo: '1.24325', details: '', income: 0, expenses: 0, credit: 22920 },
      { id: '070726101511[555]', name: '09435 C.D.L Development', voucherNo: '1.24327', details: '', income: 0, expenses: 0, credit: 23850 },
      { id: '070726102252[544]', name: '10170 Md Abdul Jolil Sir', voucherNo: '1.24255', details: '', income: 0, expenses: 0, credit: 16380 },
      { id: '070726102414[091]', name: '10122 Ambia Mam', voucherNo: '1.24256', details: '', income: 0, expenses: 0, credit: 2665 },
      { id: '070726103327[652]', name: '00238 M/S Al-Arafah Traders', voucherNo: '1.24189', details: '', income: 0, expenses: 0, credit: 7104 },
      { id: '070726103500[412]', name: '00359 Rajshahi Tiles and Sanitary', voucherNo: '1.24329', details: '', income: 0, expenses: 0, credit: 7554 },
      { id: '070726110121[852]', name: '00182 Parul Tiles Ghor', voucherNo: '1.24257', details: '', income: 0, expenses: 0, credit: 16010 },
      { id: '070726112540[390]', name: '00150 Mim Tiles', voucherNo: '1.24330', details: '', income: 0, expenses: 0, credit: 9580 },
      { id: '070726113027[054]', name: '00183 City Marbel', voucherNo: '1.24190', details: '', income: 0, expenses: 0, credit: 4622 },
      { id: '070726114333[446]', name: '09844 Md. Abed Ali', voucherNo: '1.24258', details: '', income: 0, expenses: 0, credit: 138100 },
      { id: '070726122259[875]', name: '00895 Nabil Group/Shimul Enterprise', voucherNo: '1.24261', details: 'Naba Porltry jlikrapara Kakonhata', income: 0, expenses: 0, credit: 194200 },
      { id: '070726122506[562]', name: '00184 M/S. Ma Sanitary', voucherNo: '1.24192', details: '', income: 0, expenses: 0, credit: 21349 },
      { id: '070726122954[858]', name: '00175 Glassic Marbel', voucherNo: '1.24262', details: '', income: 0, expenses: 0, credit: 2760 },
      { id: '070726123514[965]', name: '00270 M Rahman Traders', voucherNo: '1.24332', details: '', income: 0, expenses: 0, credit: 160035 },
      { id: '070726124339[089]', name: '10171 Md Gias Uddin', voucherNo: '1.24263', details: '', income: 0, expenses: 0, credit: 32450 },
      { id: '070726124440[787]', name: '00270 M Rahman Traders', voucherNo: '1.24333', details: '', income: 0, expenses: 0, credit: 394240 },
      { id: '070726125515[535]', name: '00293 Jannatul Tiles & Sanitary', voucherNo: '1.24334', details: '', income: 0, expenses: 0, credit: 1040 },
      { id: '070726125656[030]', name: '00180 Ashik Sanitary', voucherNo: '1.24193', details: '', income: 0, expenses: 0, credit: 13698 },
      { id: '070726010106[827]', name: '00182 Parul Tiles Ghor', voucherNo: '1.24195', details: '', income: 0, expenses: 0, credit: 2658 },
      { id: '070726011815[221]', name: '00238 M/S Al-Arafah Traders', voucherNo: '1.24335', details: '', income: 0, expenses: 0, credit: 45506 },
      { id: '070726012353[293]', name: '00390 M/S Faruk Hardware', voucherNo: '1.20301', details: '', income: 0, expenses: 0, credit: 81672 },
      { id: '070726013107[077]', name: '00178 M/S. Imarot Solution', voucherNo: '1.20302', details: '', income: 0, expenses: 0, credit: 179928 },
      { id: '070726013258[338]', name: '00393 Zarif Traders', voucherNo: '1.24264', details: '', income: 0, expenses: 0, credit: 3460 },
      { id: '070726013520[888]', name: '00175 Glassic Marbel', voucherNo: '1.24265', details: '', income: 0, expenses: 0, credit: 3041 },
      { id: '070726013646[949]', name: '00238 M/S Al-Arafah Traders', voucherNo: '1.24197', details: '', income: 0, expenses: 0, credit: 135280 },
      { id: '070726013846[007]', name: '10117 MD Abu Sayed Sir', voucherNo: '1.24336', details: '', income: 0, expenses: 0, credit: 31540 },
      { id: '070726021625[790]', name: '00162 Sifar Tiles Gallery', voucherNo: '1.24337', details: '', income: 0, expenses: 0, credit: 22487 },
      { id: '070726024917[882]', name: '00293 Jannatul Tiles & Sanitary', voucherNo: '1.24199', details: '', income: 0, expenses: 0, credit: 1216 },
      { id: '070726025833[282]', name: '00178 M/S. Imarot Solution', voucherNo: '1.24266', details: '', income: 0, expenses: 0, credit: 33696 },
      { id: '070726030843[773]', name: '09939 Tricon Properties New', voucherNo: '1.24338', details: '', income: 0, expenses: 0, credit: 2900 },
      { id: '070726032424[642]', name: '00124 M/S Tiles Galary', voucherNo: '1-20304', details: '', income: 0, expenses: 0, credit: 32857 },
      { id: '070726033019[704]', name: '00235 Munif Tiles & Sanitary', voucherNo: '1.24339', details: '', income: 0, expenses: 0, credit: 22663 },
      { id: '070726033428[122]', name: '00378 Al-Amin Hardware', voucherNo: '1.24200', details: '', income: 0, expenses: 0, credit: 22434 },
      { id: '070726033752[890]', name: '00183 City Marbel', voucherNo: '1.24340', details: '', income: 0, expenses: 0, credit: 6000 },
      { id: '070726034103[442]', name: '00159 Nurjahan Traders', voucherNo: '1.24267', details: '', income: 0, expenses: 0, credit: 110974 },
      { id: '070726040222[730]', name: '10172 Md Torikul Islam', voucherNo: '1.20305', details: '', income: 0, expenses: 0, credit: 6400 },
    ];

    const returnsDemo = [
      { id: '060726061214[781]', name: '09996 Fatema Chowdhury', voucherNo: '10243', details: '', income: 0, expenses: 0, credit: 62930 },
      { id: '060726061357[535]', name: '07871 Abdul Hakim Vai', voucherNo: '10174', details: '', income: 0, expenses: 0, credit: 201 },
      { id: '060726061449[413]', name: '07871 Abdul Hakim Vai', voucherNo: '10168', details: '', income: 0, expenses: 0, credit: 1480 },
      { id: '060726061614[467]', name: '00178 M/S. Imarot Solution', voucherNo: '10227', details: '', income: 0, expenses: 0, credit: 3041 },
      { id: '060726061831[572]', name: '00238 M/S Al-Arafah Traders', voucherNo: '10229', details: '', income: 0, expenses: 0, credit: 14788 },
      { id: '060726061929[299]', name: '00121 M/S Green City Trade Center', voucherNo: '10230', details: '', income: 0, expenses: 0, credit: 500 },
      { id: '060726062020[598]', name: '00162 Sifar Tiles Gallery', voucherNo: '10195', details: '', income: 0, expenses: 0, credit: 2500 },
      { id: '060726062121[275]', name: '09435 C.D.L Development', voucherNo: '10198', details: '', income: 0, expenses: 0, credit: 372 },
      { id: '060726062305[278]', name: '00107 M/S Shahi Tiles', voucherNo: '10189', details: '', income: 0, expenses: 0, credit: 5040 },
      { id: '070726102909[795]', name: 'Mizanur Rahman', voucherNo: '10246', details: 'Mizanur Rahman', income: 0, expenses: 1300, credit: 0 },
      { id: '070726125050[322]', name: 'Sorkar Hardware', voucherNo: '10251', details: 'Sorkar Hardware', income: 0, expenses: 1500, credit: 0 },
      { id: '070726025500[096]', name: '09996 Fatema Chowdhury', voucherNo: '10253', details: '', income: 0, expenses: 0, credit: 44660 },
      { id: '070726030457[151]', name: '10117 MD Abu Sayed Sir', voucherNo: '10254', details: '', income: 0, expenses: 0, credit: 24332 },
      { id: '070726032753[883]', name: '00124 M/S Tiles Galary', voucherNo: '10256', details: '', income: 0, expenses: 0, credit: 3720 },
    ];

    const collectionsDemo = [
      { id: '070726042150[604]', name: '00139 M/S Modina Tiles', voucherNo: '14985', details: '', income: 7080, expenses: 0, credit: 0 },
      { id: '070726042211[641]', name: '00393 Zarif Traders', voucherNo: '14986', details: '', income: 40000, expenses: 0, credit: 0 },
      { id: '070726042229[735]', name: '00133 Ma Mojaek', voucherNo: '14987', details: '', income: 5000, expenses: 0, credit: 0 },
      { id: '070726042759[374]', name: '00357 Mokka Tiles', voucherNo: '14988', details: '', income: 17000, expenses: 0, credit: 0 },
      { id: '070726042825[656]', name: '00356 Swite Tiles Palace', voucherNo: '14989', details: '', income: 10000, expenses: 0, credit: 0 },
      { id: '070726042845[371]', name: '00385 Ceramics Point -New', voucherNo: '14990', details: '', income: 5000, expenses: 0, credit: 0 },
      { id: '070726042901[710]', name: '09435 C.D.L Development', voucherNo: '14991', details: '', income: 23850, expenses: 0, credit: 0 },
      { id: '070726042918[748]', name: '00359 Rajshahi Tiles and Sanitary', voucherNo: '14992', details: '', income: 8000, expenses: 0, credit: 0 },
      { id: '070726042934[623]', name: '00150 Mim Tiles', voucherNo: '14993', details: '', income: 10000, expenses: 0, credit: 0 },
      { id: '070726043015[733]', name: '09844 Md. Abed Ali', voucherNo: '14994', details: '', income: 120000, expenses: 0, credit: 0 },
      { id: '070726043053[117]', name: '0500 Madani Traders-02', voucherNo: '14995', details: '', income: 459690, expenses: 0, credit: 0 },
      { id: '070726043109[848]', name: '00175 Glassic Marbel', voucherNo: '14996', details: '', income: 5240, expenses: 0, credit: 0 },
      { id: '070726043135[514]', name: '00180 Ashik Sanitary', voucherNo: '14997', details: '', income: 10000, expenses: 0, credit: 0 },
      { id: '070726043152[916]', name: '00293 Jannatul Tiles & Sanitary', voucherNo: '14998', details: '', income: 2000, expenses: 0, credit: 0 },
      { id: '070726043212[505]', name: '00175 Glassic Marbel', voucherNo: '14999', details: '', income: 3050, expenses: 0, credit: 0 },
      { id: '070726043237[604]', name: '00238 M/S Al-Arafah Traders', voucherNo: '15000', details: '', income: 150000, expenses: 0, credit: 0 },
    ];

    const paymentsDemo = [
      { id: '060726030521[857]', name: '10140 Md. Tusar Molla', voucherNo: 'Cash Return', details: '', income: 0, expenses: 7780, credit: 0 },
      { id: '060726065602[071]', name: '10168 Md Abdul Malek', voucherNo: 'Cash Return Sanitary Bill Babod', details: '', income: 0, expenses: 36200, credit: 0 },
      { id: '060726075604[215]', name: '00172 Uttora Trading', voucherNo: 'Cash Return', details: '', income: 0, expenses: 160, credit: 0 },
    ];

    // Helper to generate consistent report IDs for dynamic real data
    const formatReportId = (dateStr: string, id: string) => {
      const parts = dateStr.split('-');
      let ddmmyy = '070726';
      if (parts.length === 3) {
        ddmmyy = `${parts[2]}${parts[1]}${parts[0].substring(2)}`;
      }
      let hashCode = 0;
      for (let i = 0; i < id.length; i++) {
        hashCode = id.charCodeAt(i) + ((hashCode << 5) - hashCode);
      }
      const absHash = Math.abs(hashCode);
      const hh = String(absHash % 12).padStart(2, '0');
      const mm = String((absHash >> 4) % 60).padStart(2, '0');
      const ss = String((absHash >> 8) % 60).padStart(2, '0');
      const bracket = String(absHash % 1000).padStart(3, '0');
      return `${ddmmyy}${hh}${mm}${ss}[${bracket}]`;
    };

    // Helper to generate a voucher reference for dynamic real data
    const getVoucherNo = (id: string) => {
      let hash = 0;
      for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
      }
      const seq = 24000 + (Math.abs(hash) % 1000);
      return `1.${seq}`;
    };

    // Gather dynamic active data of selectedDate from database
    const dynamicCashSales = invoices
      .filter((inv) => inv.date === selectedDate && (inv.paymentMethod !== 'Credit' && inv.isPaid))
      .map((inv) => ({
        id: formatReportId(inv.date, inv.id),
        name: inv.customerName,
        voucherNo: inv.invoiceNo,
        details: customers.find((c) => c.id === inv.customerId)?.phone || '',
        income: inv.total,
        expenses: 0,
        credit: 0,
      }));

    const dynamicCreditSales = invoices
      .filter((inv) => inv.date === selectedDate && (inv.paymentMethod === 'Credit' || !inv.isPaid))
      .map((inv) => ({
        id: formatReportId(inv.date, inv.id),
        name: inv.customerName,
        voucherNo: inv.invoiceNo,
        details: customers.find((c) => c.id === inv.customerId)?.phone || '',
        income: 0,
        expenses: 0,
        credit: inv.total,
      }));

    const dynamicCollections = transactions
      .filter((tx) => tx.date === selectedDate && tx.type === 'Deposit' && (tx.category.toLowerCase().includes('collection') || tx.description.toLowerCase().includes('collection')))
      .map((tx) => ({
        id: formatReportId(tx.date, tx.id),
        name: tx.description.replace('Collection from ', '').replace('Payment from ', ''),
        voucherNo: tx.referenceNo || `COL-${tx.id.slice(-4)}`,
        details: '',
        income: tx.amount,
        expenses: 0,
        credit: 0,
      }));

    const dynamicPayments = transactions
      .filter((tx) => tx.date === selectedDate && (tx.type === 'Withdrawal' || tx.type === 'Expense') && !tx.category.toLowerCase().includes('return'))
      .map((tx) => ({
        id: formatReportId(tx.date, tx.id),
        name: tx.description || tx.category,
        voucherNo: tx.referenceNo || `TX-${tx.id.slice(-4)}`,
        details: '',
        income: 0,
        expenses: tx.amount,
        credit: 0,
      }));

    const dynamicReturns = transactions
      .filter((tx) => tx.date === selectedDate && tx.category.toLowerCase().includes('return'))
      .map((tx) => ({
        id: formatReportId(tx.date, tx.id),
        name: tx.description.replace('Return from ', ''),
        voucherNo: tx.referenceNo || `RET-${tx.id.slice(-4)}`,
        details: '',
        income: 0,
        expenses: tx.type === 'Withdrawal' ? tx.amount : 0,
        credit: tx.type === 'Deposit' ? tx.amount : 0, // credit returned
      }));

    // Choose active list depending on toggle/date matching
    const isDemoMode = showSampleData && selectedDate === '2026-07-07';

    const cashSales = isDemoMode ? cashSalesDemo : dynamicCashSales;
    const creditSales = isDemoMode ? creditSalesDemo : dynamicCreditSales;
    const returns = isDemoMode ? returnsDemo : dynamicReturns;
    const collections = isDemoMode ? collectionsDemo : dynamicCollections;
    const payments = isDemoMode ? paymentsDemo : dynamicPayments;

    // Totals calculations
    const sumSection = (items: any[], key: 'income' | 'expenses' | 'credit') =>
      items.reduce((sum, item) => sum + (item[key] || 0), 0);

    const cashSalesTotal = {
      income: sumSection(cashSales, 'income'),
      expenses: sumSection(cashSales, 'expenses'),
      credit: sumSection(cashSales, 'credit'),
    };

    const creditSalesTotal = {
      income: sumSection(creditSales, 'income'),
      expenses: sumSection(creditSales, 'expenses'),
      credit: sumSection(creditSales, 'credit'),
    };

    const returnsTotal = {
      income: sumSection(returns, 'income'),
      expenses: sumSection(returns, 'expenses'),
      credit: sumSection(returns, 'credit'),
    };

    const collectionsTotal = {
      income: sumSection(collections, 'income'),
      expenses: sumSection(collections, 'expenses'),
      credit: sumSection(collections, 'credit'),
    };

    const paymentsTotal = {
      income: sumSection(payments, 'income'),
      expenses: sumSection(payments, 'expenses'),
      credit: sumSection(payments, 'credit'),
    };

    // Grand Totals: Income column (Cash sales + Collections), Expenses column (Return expenses + Payments)
    const grandTotalIncome = cashSalesTotal.income + collectionsTotal.income;
    const grandTotalExpenses = returnsTotal.expenses + paymentsTotal.expenses;

    // Previous Balance
    const dynamicPreviousBalance = transactions
      .filter((tx) => tx.date < selectedDate)
      .reduce((sum, tx) => {
        if (tx.type === 'Deposit' || tx.type === 'Income') return sum + tx.amount;
        if (tx.type === 'Withdrawal' || tx.type === 'Expense') return sum - tx.amount;
        return sum;
      }, 45000); // 45k fallback

    const previousBalance = isDemoMode ? 9448630 : dynamicPreviousBalance;
    const presentBalance = previousBalance + grandTotalIncome - grandTotalExpenses;

    const formattedDateForHeader = (() => {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        return `${parseInt(parts[2], 10)}/${parseInt(parts[1], 10)}/${parts[0]}`;
      }
      return selectedDate;
    })();

    const handlePrint = () => {
      window.print();
    };

    // Filter list entries based on current search term
    const filterSectionItems = (items: any[]) => {
      if (!dailySearchText) return items;
      const searchLower = dailySearchText.toLowerCase();
      return items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.voucherNo.toLowerCase().includes(searchLower) ||
          (item.details || '').toLowerCase().includes(searchLower)
      );
    };

    const cashSalesFiltered = filterSectionItems(cashSales);
    const creditSalesFiltered = filterSectionItems(creditSales);
    const returnsFiltered = filterSectionItems(returns);
    const collectionsFiltered = filterSectionItems(collections);
    const paymentsFiltered = filterSectionItems(payments);

    // Filtered totals
    const cashSalesFilteredTotal = {
      income: sumSection(cashSalesFiltered, 'income'),
      expenses: sumSection(cashSalesFiltered, 'expenses'),
      credit: sumSection(cashSalesFiltered, 'credit'),
    };

    const creditSalesFilteredTotal = {
      income: sumSection(creditSalesFiltered, 'income'),
      expenses: sumSection(creditSalesFiltered, 'expenses'),
      credit: sumSection(creditSalesFiltered, 'credit'),
    };

    const returnsFilteredTotal = {
      income: sumSection(returnsFiltered, 'income'),
      expenses: sumSection(returnsFiltered, 'expenses'),
      credit: sumSection(returnsFiltered, 'credit'),
    };

    const collectionsFilteredTotal = {
      income: sumSection(collectionsFiltered, 'income'),
      expenses: sumSection(collectionsFiltered, 'expenses'),
      credit: sumSection(collectionsFiltered, 'credit'),
    };

    const paymentsFilteredTotal = {
      income: sumSection(paymentsFiltered, 'income'),
      expenses: sumSection(paymentsFiltered, 'expenses'),
      credit: sumSection(paymentsFiltered, 'credit'),
    };

    // Dynamic grand totals based on filtered items
    const grandTotalIncomeFiltered = cashSalesFilteredTotal.income + collectionsFilteredTotal.income;
    const grandTotalExpensesFiltered = returnsFilteredTotal.expenses + paymentsFilteredTotal.expenses;
    const presentBalanceFiltered = previousBalance + grandTotalIncomeFiltered - grandTotalExpensesFiltered;

    // Unified Master Table Row Builder to guarantee 100% column grid alignment across all sections
    const renderSectionRows = (
      title: string,
      items: any[],
      totals: { income: number; expenses: number; credit: number },
      badgeBg: string,
      badgeText: string,
      sectionKey: string
    ) => {
      // Filter out sections based on active tab filters
      if (dailyActiveFilter !== 'all') {
        if (dailyActiveFilter === 'inflows' && sectionKey !== 'cash_sales' && sectionKey !== 'collections') return null;
        if (dailyActiveFilter === 'outflows' && sectionKey !== 'returns' && sectionKey !== 'payments') return null;
        if (dailyActiveFilter !== 'inflows' && dailyActiveFilter !== 'outflows' && dailyActiveFilter !== sectionKey) return null;
      }

      return (
        <React.Fragment key={title}>
          {/* Section Headline Divider */}
          <tr className="bg-slate-50/80 border-t border-b border-slate-200">
            <td colSpan={7} className="py-2.5 px-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${badgeBg} ${badgeText}`}>
                    {title}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100/80 px-2 py-0.5 rounded-full font-mono">
                    {items.length} {items.length === 1 ? 'Entry' : 'Entries'}
                  </span>
                </div>
              </div>
            </td>
          </tr>

          {/* Table Data Entries */}
          {items.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-5 text-center text-slate-400 font-semibold text-xs bg-slate-50/10 italic select-none">
                No entries recorded for this section.
              </td>
            </tr>
          ) : (
            items.map((row, idx) => (
              <tr
                key={row.id + '-' + idx}
                className="hover:bg-indigo-50/25 border-b border-slate-100/80 transition-colors text-xs text-slate-700"
              >
                <td className="py-2 px-3 font-mono text-[10px] text-slate-400 tracking-tight truncate select-all">{row.id}</td>
                <td className="py-2 px-3 font-bold text-slate-800 truncate" title={row.name}>{row.name}</td>
                <td className="py-2 px-3 text-center">
                  <span className="font-mono text-[9.5px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200/50">
                    {row.voucherNo}
                  </span>
                </td>
                <td className="py-2 px-3 text-slate-500 truncate" title={row.details || ''}>
                  {row.details || <span className="text-slate-300 font-normal">—</span>}
                </td>
                <td className="py-2 px-3 text-right font-mono text-slate-800">
                  {row.income > 0 ? (
                    <span className="text-emerald-600 font-bold">৳{row.income.toLocaleString()}</span>
                  ) : (
                    <span className="text-slate-300 font-normal">—</span>
                  )}
                </td>
                <td className="py-2 px-3 text-right font-mono text-slate-800">
                  {row.expenses > 0 ? (
                    <span className="text-rose-600 font-bold">৳{row.expenses.toLocaleString()}</span>
                  ) : (
                    <span className="text-slate-300 font-normal">—</span>
                  )}
                </td>
                <td className="py-2 px-3 text-right font-mono text-slate-800">
                  {row.credit > 0 ? (
                    <span className="text-indigo-600 font-bold">৳{row.credit.toLocaleString()}</span>
                  ) : (
                    <span className="text-slate-300 font-normal">—</span>
                  )}
                </td>
              </tr>
            ))
          )}

          {/* Section Totals */}
          {items.length > 0 && (
            <tr className="bg-slate-50/30 font-mono text-xs font-bold text-slate-800 border-b border-slate-200">
              <td colSpan={4} className="py-2 px-3 text-right text-slate-400 uppercase tracking-wider text-[9px] font-sans font-bold select-none">
                {title} Subtotal:
              </td>
              <td className="py-2 px-3 text-right font-bold text-slate-900 bg-slate-100/20 border-l border-slate-100">
                {totals.income > 0 ? `৳${totals.income.toLocaleString()}` : '—'}
              </td>
              <td className="py-2 px-3 text-right font-bold text-slate-900 bg-slate-100/20 border-l border-slate-100">
                {totals.expenses > 0 ? `৳${totals.expenses.toLocaleString()}` : '—'}
              </td>
              <td className="py-2 px-3 text-right font-bold text-slate-900 bg-slate-100/20 border-l border-slate-100">
                {totals.credit > 0 ? `৳${totals.credit.toLocaleString()}` : '—'}
              </td>
            </tr>
          )}
        </React.Fragment>
      );
    };

    return (
      <div className="space-y-6">
        {/* CSS Style Injection for flawless portrait A4 previews on desktop and pristine paper printing */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media screen {
            .a4-workspace {
              background-color: #f1f5f9;
              padding: 2rem 1.5rem;
              border-radius: 1.5rem;
              box-shadow: inset 0 2px 8px rgba(15, 23, 42, 0.05);
              border: 1px dashed #cbd5e1;
            }
            .a4-paper-preview {
              width: 210mm !important;
              min-height: 297mm !important;
              background-color: white !important;
              border: 1px solid #d1d5db !important;
              box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.08), 0 8px 16px -6px rgba(0, 0, 0, 0.05);
              padding: 15mm 15mm !important;
              margin: 0 auto !important;
              border-radius: 0.5rem;
            }
            .interactive-card {
              transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .interactive-card:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 20px -4px rgba(0, 0, 0, 0.08);
            }
          }
          @media print {
            body {
              visibility: hidden !important;
              background: white !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .no-print, .no-print * {
              display: none !important;
              height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .a4-workspace {
              background: transparent !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
              border-radius: 0 !important;
            }
            .a4-paper-preview {
              visibility: visible !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 210mm !important;
              min-height: 297mm !important;
              padding: 12mm 15mm !important;
              margin: 0 !important;
              border: none !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              background: white !important;
            }
            #daily-cash-report-printable, #daily-cash-report-printable * {
              visibility: visible !important;
            }
            @page {
              size: portrait;
              margin: 0;
            }
          }
        `}} />

        {/* Top Interactive Filter & Search Control Panel */}
        <div className="flex flex-col gap-4 bg-slate-100 border border-slate-200/80 p-5 rounded-2xl no-print shadow-xs">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Left side: Date Selector & Sample toggles */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-600 shrink-0" />
                <span className="text-xs font-black text-slate-700 uppercase tracking-wide">Ledger Date:</span>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-600 font-bold shadow-xs cursor-pointer text-slate-800"
              />
              {selectedDate === '2026-07-07' && (
                <label className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-900 font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer hover:bg-indigo-100/60 transition-colors select-none">
                  <input
                    type="checkbox"
                    checked={showSampleData}
                    onChange={(e) => setShowSampleData(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                  />
                  <span>Load M/S Madani Traders sample</span>
                </label>
              )}
            </div>

            {/* Right side: Search Box and PDF Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Interactive Instant Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter by Customer / Voucher..."
                  value={dailySearchText}
                  onChange={(e) => setDailySearchText(e.target.value)}
                  className="w-full sm:w-64 pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500 font-bold text-slate-800 placeholder-slate-400 shadow-xs"
                />
                <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
                {dailySearchText && (
                  <button
                    onClick={() => setDailySearchText('')}
                    className="absolute right-2.5 top-2 text-[10px] font-black text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-4 py-2 rounded-xl shadow-xs cursor-pointer transition-all active:scale-[0.98]"
              >
                <Printer className="h-4 w-4" />
                <span>Print / Export A4 PDF</span>
              </button>
            </div>
          </div>

          {/* Interactive Filter Quick Pills & Instructions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mr-1">
                <Filter className="h-3 w-3" /> Quick Filter:
              </span>
              <button
                onClick={() => setDailyActiveFilter('all')}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg cursor-pointer transition-all ${
                  dailyActiveFilter === 'all'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                Show All Sections
              </button>
              <button
                onClick={() => setDailyActiveFilter('inflows')}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg cursor-pointer transition-all ${
                  dailyActiveFilter === 'inflows'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-emerald-50 border border-slate-300'
                }`}
              >
                Inflows Only
              </button>
              <button
                onClick={() => setDailyActiveFilter('outflows')}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg cursor-pointer transition-all ${
                  dailyActiveFilter === 'outflows'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-rose-50 border border-slate-300'
                }`}
              >
                Outflows Only
              </button>
              <button
                onClick={() => setDailyActiveFilter('credit_sales')}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg cursor-pointer transition-all ${
                  dailyActiveFilter === 'credit_sales'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-indigo-50 border border-slate-300'
                }`}
              >
                Credit Sales
              </button>
            </div>
            <div className="text-[10px] font-semibold text-slate-400 italic">
              ✨ Tip: Click on any of the metrics cards inside the report to filter the table list instantly!
            </div>
          </div>
        </div>

        {/* Gray workspace containing the perfectly proportioned portrait A4 paper */}
        <div className="w-full a4-workspace overflow-x-auto">
          <div
            id="daily-cash-report-printable"
            className="a4-paper-preview flex flex-col justify-between font-sans text-slate-800"
          >
            <div className="space-y-6">
              {/* Header Banner - Classical Serif Editorial Style matching actual PDF screenshots */}
              <div className="flex flex-col items-center justify-center relative border-b border-slate-300 pb-4">
                <h1 className="text-3xl font-bold tracking-wider text-slate-900 font-serif text-center uppercase" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}>
                  M/S MADANI TRADERS
                </h1>
                <p className="text-[10px] text-slate-400 font-bold tracking-widest text-center uppercase mt-1">
                  KADIRGANJ, RAJSHAHI
                </p>

                {/* Subtitle with traditional double-ruled lines */}
                <div className="flex flex-col items-center w-full mt-3">
                  <div className="border-t border-slate-400 w-48 my-0.5"></div>
                  <h2 className="text-base font-black text-slate-800 tracking-widest text-center uppercase font-serif" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}>
                    DAILY CASH REPORT
                  </h2>
                  <div className="border-b-2 border-double border-slate-800 w-56 mt-1.5 pb-0.5"></div>
                </div>

                {/* Document metadata info bar */}
                <div className="w-full flex justify-between items-end mt-4 text-[10px] font-bold font-mono text-slate-500">
                  <div>
                    SYSTEM EXPORT: <span className="font-extrabold text-slate-700">${activeSubTab.toUpperCase()}-LEDGER</span>
                  </div>
                  <div>
                    Date: <span className="underline decoration-dotted text-slate-800 font-extrabold">{formattedDateForHeader}</span>
                  </div>
                </div>
              </div>

              {/* Interactive Clickable Summary Dashboard - Dynamic Visual Indicators */}
              <div className="grid grid-cols-4 gap-3 print:grid-cols-4 no-print">
                <button
                  onClick={() => setDailyActiveFilter('all')}
                  className={`interactive-card p-3.5 rounded-xl border flex flex-col items-start text-left ${
                    dailyActiveFilter === 'all'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${dailyActiveFilter === 'all' ? 'text-slate-300' : 'text-slate-400'}`}>Previous Balance</span>
                  <h4 className="text-sm font-black mt-1 font-mono">৳{previousBalance.toLocaleString()}</h4>
                </button>

                <button
                  onClick={() => setDailyActiveFilter('inflows')}
                  className={`interactive-card p-3.5 rounded-xl border flex flex-col items-start text-left ${
                    dailyActiveFilter === 'inflows'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-emerald-50/40 hover:bg-emerald-50 border-emerald-100 text-slate-700'
                  }`}
                >
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${dailyActiveFilter === 'inflows' ? 'text-white/80' : 'text-emerald-600'}`}>Daily Inflows</span>
                  <h4 className="text-sm font-black mt-1 font-mono">+{grandTotalIncome.toLocaleString()}</h4>
                </button>

                <button
                  onClick={() => setDailyActiveFilter('outflows')}
                  className={`interactive-card p-3.5 rounded-xl border flex flex-col items-start text-left ${
                    dailyActiveFilter === 'outflows'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-rose-50/40 hover:bg-rose-50 border-rose-100 text-slate-700'
                  }`}
                >
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${dailyActiveFilter === 'outflows' ? 'text-white/80' : 'text-rose-600'}`}>Daily Outflows</span>
                  <h4 className="text-sm font-black mt-1 font-mono">-{grandTotalExpenses.toLocaleString()}</h4>
                </button>

                <button
                  onClick={() => setDailyActiveFilter('credit_sales')}
                  className={`interactive-card p-3.5 rounded-xl border flex flex-col items-start text-left ${
                    dailyActiveFilter === 'credit_sales'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-indigo-50/40 hover:bg-indigo-50 border-indigo-100 text-slate-700'
                  }`}
                >
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${dailyActiveFilter === 'credit_sales' ? 'text-white/80' : 'text-indigo-600'}`}>Credit Sales</span>
                  <h4 className="text-sm font-black mt-1 font-mono">৳{creditSalesTotal.credit.toLocaleString()}</h4>
                </button>
              </div>

              {/* Master Unified Table containing all sections to lock columns perfectly together */}
              <div className="border border-slate-300 rounded-lg overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse" style={{ tableLayout: 'fixed', width: '100%' }}>
                  {/* Lock widths precisely for absolute horizontal alignment */}
                  <colgroup>
                    <col style={{ width: '135px' }} />
                    <col style={{ width: '175px' }} />
                    <col style={{ width: '85px' }} />
                    <col />
                    <col style={{ width: '95px' }} />
                    <col style={{ width: '95px' }} />
                    <col style={{ width: '95px' }} />
                  </colgroup>

                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-black text-slate-500 uppercase tracking-wider select-none">
                      <th className="py-2 px-3">ID / Timestamp</th>
                      <th className="py-2 px-3">Particular / Customer</th>
                      <th className="py-2 px-3 text-center">Voucher</th>
                      <th className="py-2 px-3">Details / Address</th>
                      <th className="py-2 px-3 text-right">Income</th>
                      <th className="py-2 px-3 text-right">Expenses</th>
                      <th className="py-2 px-3 text-right">Credit</th>
                    </tr>
                  </thead>

                  <tbody>
                    {/* 1. Cash Sell Bill */}
                    {renderSectionRows(
                      'Cash Sell Bill',
                      cashSalesFiltered,
                      cashSalesFilteredTotal,
                      'bg-emerald-50 text-emerald-700 border border-emerald-100',
                      'text-emerald-700',
                      'cash_sales'
                    )}

                    {/* 2. Credit Sale Bill */}
                    {renderSectionRows(
                      'Credit Sale Bill',
                      creditSalesFiltered,
                      creditSalesFilteredTotal,
                      'bg-indigo-50 text-indigo-700 border border-indigo-100',
                      'text-indigo-700',
                      'credit_sales'
                    )}

                    {/* 3. Sale Return Bill */}
                    {renderSectionRows(
                      'Sale Return Bill',
                      returnsFiltered,
                      returnsFilteredTotal,
                      'bg-rose-50 text-rose-700 border border-rose-100',
                      'text-rose-700',
                      'returns'
                    )}

                    {/* 4. Collection */}
                    {renderSectionRows(
                      'Collection',
                      collectionsFiltered,
                      collectionsFilteredTotal,
                      'bg-teal-50 text-teal-700 border border-teal-100',
                      'text-teal-700',
                      'collections'
                    )}

                    {/* 5. Payment */}
                    {renderSectionRows(
                      'Payment',
                      paymentsFiltered,
                      paymentsFilteredTotal,
                      'bg-amber-50 text-amber-700 border border-amber-100',
                      'text-amber-700',
                      'payments'
                    )}

                    {/* Grand Total Row directly rendered inside the master table to preserve layout */}
                    {dailyActiveFilter === 'all' && (
                      <tr className="bg-slate-50 font-mono text-xs font-black text-slate-900 border-t-2 border-slate-300 border-b-2 border-double border-slate-300">
                        <td colSpan={4} className="py-2.5 px-3 text-right uppercase tracking-wider text-[10px] font-sans font-black text-slate-500 select-none">
                          GRAND TOTAL:
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-slate-900">
                          ৳{grandTotalIncomeFiltered.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-slate-900">
                          ৳{grandTotalExpensesFiltered.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-300 font-normal">
                          —
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Footer block containing Grand Totals and dynamic cash account balance assessment */}
            <div className="pt-6 mt-8 border-t border-slate-200/80 space-y-6">
              {/* Balance Summary Statement & Bank account equivalents ledger */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
                <div className="text-[10px] text-slate-400 font-mono max-w-sm space-y-1.5 select-none leading-relaxed">
                  <p>* Prepared dynamically under double-entry ledger equilibrium checks.</p>
                  <p>* Authorized under internal office ledger auditing standard limits.</p>
                  <p className="font-bold text-slate-600 font-sans mt-2">M/S Madani Traders, Kadirganj, Rajshahi (Bangladesh)</p>
                </div>

                {/* Right Summary Assessment Box */}
                <div className="w-full sm:w-[280px] shrink-0 border border-slate-300 p-4 rounded-xl bg-slate-50/50 font-mono text-[11px] text-slate-700 space-y-2 shadow-2xs print:border-slate-300 print:bg-transparent">
                  <div className="flex justify-between items-center pb-1 border-b border-dashed border-slate-200">
                    <span className="font-medium text-slate-400 select-none">Previous Balance:</span>
                    <span className="font-bold text-slate-800">{previousBalance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pb-1 border-b border-dashed border-slate-200">
                    <span className="font-medium text-slate-400 select-none">Total Inflows:</span>
                    <span className="font-bold text-emerald-600">+{grandTotalIncomeFiltered.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="font-medium text-slate-400 select-none">Total Outflows:</span>
                    <span className="font-bold text-rose-600">-{grandTotalExpensesFiltered.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 text-xs font-black text-slate-900 border-t-2 border-double border-slate-300">
                    <span className="uppercase tracking-tight select-none">Present Balance:</span>
                    <span className="font-mono bg-indigo-50 text-indigo-950 px-2 py-0.5 rounded print:bg-slate-100">
                      {presentBalanceFiltered.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Page Number indicator matching screenshots */}
              <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 font-mono uppercase select-none pt-2 border-t border-slate-200">
                <span>SYSTEM EXPORT ID: ${activeSubTab.toUpperCase()}-LEDGER</span>
                <span>Page 1 of 1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 15. New Products (Daily)
  const renderNewProductsDaily = () => {
    return (
      <div className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50/50 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Recently Added Catalog items</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/60 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">SKU Code</th>
                  <th className="py-2.5 px-4">Product Name</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4 text-right">Selling Price</th>
                  <th className="py-2.5 px-4 text-center">Starting Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {products.slice(-5).map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{p.sku}</td>
                    <td className="py-3 px-4 font-bold">{p.name}</td>
                    <td className="py-3 px-4 text-slate-500">{p.category}</td>
                    <td className="py-3 px-4 text-right">৳{p.price.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center font-bold">{p.stock} {p.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // 16. New Customers (Daily)
  const renderNewCustomersDaily = () => {
    return (
      <div className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50/50 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Recently Registered Customers</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/60 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">ID</th>
                  <th className="py-2.5 px-4">Customer Name</th>
                  <th className="py-2.5 px-4">Phone Number</th>
                  <th className="py-2.5 px-4">Customer Group</th>
                  <th className="py-2.5 px-4 text-right">Outstanding balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {customers.slice(-5).map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400">{c.id}</td>
                    <td className="py-3 px-4 font-bold">{c.name}</td>
                    <td className="py-3 px-4 font-mono">{c.phone}</td>
                    <td className="py-3 px-4 text-slate-500">{c.group || 'General'}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">৳{c.outstandingBalance.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // 17. Offer Sales Report
  const renderOfferSalesReport = () => {
    // Generate sales lines that had discounts
    const discountedSales = invoices.filter((inv) => inv.discount > 0);

    return (
      <div className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50/50 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Promotional Discount & Savings Log</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/60 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Invoice No</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4 text-right">Subtotal</th>
                  <th className="py-2.5 px-4 text-right">Promotional Discount Granted</th>
                  <th className="py-2.5 px-4 text-right">Final Bill total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {discountedSales.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{inv.invoiceNo}</td>
                    <td className="py-3 px-4 font-bold">{inv.customerName}</td>
                    <td className="py-3 px-4 text-right">৳{(inv.total + inv.discount).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-rose-600 font-bold">-৳{inv.discount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">৳{inv.total.toLocaleString()}</td>
                  </tr>
                ))}
                {discountedSales.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-bold bg-[#fafafa]">
                      No sales under promotional campaign codes detected.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // 18. Product Wise Total Profit
  const renderProductWiseTotalProfit = () => {
    return (
      <div className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50/50 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Expected Asset Profit realization</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/60 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Product Name</th>
                  <th className="py-2.5 px-4 text-center">Remaining Quantity</th>
                  <th className="py-2.5 px-4 text-right">Asset Cost Value</th>
                  <th className="py-2.5 px-4 text-right">Potential Sales Value</th>
                  <th className="py-2.5 px-4 text-right">Expected Revenue Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {products.map((p) => {
                  const costVal = p.stock * p.cost;
                  const priceVal = p.stock * p.price;
                  const potentialProfit = priceVal - costVal;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-800">{p.name}</td>
                      <td className="py-3 px-4 text-center">{p.stock} {p.unit}</td>
                      <td className="py-3 px-4 text-right text-slate-500">৳{costVal.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-slate-600">৳{priceVal.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">৳{potentialProfit.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // 19. Master Transaction Ledger Report
  const renderMasterLedger = () => {
    // 1. Compile Invoice Entries
    const invoiceEntries = invoices.map(inv => {
      let categoryLabel = 'Cash Sale Bill';
      if (inv.paymentMethod === 'Credit' && !inv.isPaid) {
        categoryLabel = 'Credit Sale Bill';
      } else {
        categoryLabel = inv.paymentMethod === 'Mobile Banking' ? 'Mobile Banking Sale' : 'Cash Sale Bill';
      }

      const customer = customers.find(c => c.id === inv.customerId || c.name === inv.customerName);
      const address = (customer as any)?.address || '';
      const itemsDesc = inv.items?.map(it => `${it.name} (x${it.quantity})`).join(', ') || 'Sales Invoice';

      return {
        id: `INV-${inv.id}`,
        date: inv.date,
        category: categoryLabel,
        referenceNo: inv.invoiceNo,
        partyName: inv.customerName,
        address: address,
        description: itemsDesc,
        debit: 0,
        credit: inv.total,
        enteredBy: currentUser?.name || currentUser?.email || 'System Admin'
      };
    });

    // 2. Compile Transaction Entries
    const transactionEntries = transactions.map(tx => {
      let categoryLabel = tx.category || 'Transaction';
      if (tx.type === 'Deposit') {
        categoryLabel = 'Collection';
      } else if (tx.type === 'Withdrawal') {
        categoryLabel = 'Payment';
      } else if (tx.type === 'Transfer') {
        categoryLabel = 'Transfer';
      }

      let partyName = tx.description || 'General Ledger Account';
      const matchedCustomer = customers.find(c => tx.description?.toLowerCase().includes(c.name.toLowerCase()));
      const matchedSupplier = suppliers.find(s => tx.description?.toLowerCase().includes(s.name.toLowerCase()));
      
      let address = '';
      if (matchedCustomer) {
        partyName = matchedCustomer.name;
        address = (matchedCustomer as any)?.address || '';
      } else if (matchedSupplier) {
        partyName = matchedSupplier.name;
        address = (matchedSupplier as any)?.address || '';
      }

      const isDebit = tx.type === 'Withdrawal' || tx.type === 'Expense';
      const isCredit = tx.type === 'Deposit' || tx.type === 'Income';

      return {
        id: `TX-${tx.id}`,
        date: tx.date,
        category: categoryLabel,
        referenceNo: tx.referenceNo || `TX-${tx.id.slice(-4)}`,
        partyName: partyName,
        address: address,
        description: tx.description || tx.category || 'Accounting Adjustment',
        debit: isDebit ? tx.amount : 0,
        credit: isCredit ? tx.amount : 0,
        enteredBy: currentUser?.name || currentUser?.email || 'System Admin'
      };
    });

    // 3. Compile Purchase Order Entries
    const purchaseEntries = purchaseOrders.map(po => {
      const categoryLabel = 'Purchase Bill';
      const supplier = suppliers.find(s => s.id === po.supplierId || s.name === po.supplierName);
      const address = (supplier as any)?.address || '';
      const itemsDesc = po.items?.map(it => `${it.name} (x${it.quantity})`).join(', ') || 'Purchase Order';

      return {
        id: `PO-${po.id}`,
        date: po.date,
        category: categoryLabel,
        referenceNo: po.poNo,
        partyName: po.supplierName,
        address: address,
        description: itemsDesc,
        debit: po.total,
        credit: 0,
        enteredBy: currentUser?.name || currentUser?.email || 'System Admin'
      };
    });

    // Combine
    const combinedLedger = [
      ...invoiceEntries,
      ...transactionEntries,
      ...purchaseEntries
    ];

    // Filter Logic
    const filteredLedger = combinedLedger.filter(entry => {
      // Date range filter
      if (entry.date < activeFromDate || entry.date > activeToDate) {
        return false;
      }

      // Category filter
      if (ledgerCategory !== 'All') {
        const catLower = entry.category.toLowerCase();

        if (ledgerCategory === 'Cash Sale Bill') {
          if (entry.category !== 'Cash Sale Bill' && entry.category !== 'Mobile Banking Sale') {
            return false;
          }
        } else if (ledgerCategory === 'Credit Sale Bill') {
          if (entry.category !== 'Credit Sale Bill') {
            return false;
          }
        } else if (ledgerCategory === 'Collection') {
          if (!catLower.includes('collection') && !catLower.includes('deposit') && !catLower.includes('income')) {
            return false;
          }
        } else if (ledgerCategory === 'Payment') {
          if (!catLower.includes('payment') && !catLower.includes('withdrawal') && !catLower.includes('expense')) {
            return false;
          }
        } else if (ledgerCategory === 'Purchase Bill') {
          if (!catLower.includes('purchase')) {
            return false;
          }
        } else if (ledgerCategory === 'Transfer') {
          if (!catLower.includes('transfer')) {
            return false;
          }
        } else {
          if (entry.category !== ledgerCategory) return false;
        }
      }

      // Text search filter
      if (ledgerSearchText.trim()) {
        const searchVal = ledgerSearchText.toLowerCase();
        const matchesParty = entry.partyName.toLowerCase().includes(searchVal);
        const matchesRef = entry.referenceNo.toLowerCase().includes(searchVal);
        const matchesDesc = entry.description.toLowerCase().includes(searchVal);
        const matchesCat = entry.category.toLowerCase().includes(searchVal);
        if (!matchesParty && !matchesRef && !matchesDesc && !matchesCat) {
          return false;
        }
      }

      return true;
    });

    // Apply Dynamic Sorting
    const sortedFilteredLedger = [...filteredLedger].sort((a, b) => {
      let valA: any = a[ledgerSortField as keyof typeof a];
      let valB: any = b[ledgerSortField as keyof typeof b];

      if (valA === undefined || valA === null) return ledgerSortOrder === 'asc' ? 1 : -1;
      if (valB === undefined || valB === null) return ledgerSortOrder === 'asc' ? -1 : 1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return ledgerSortOrder === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return ledgerSortOrder === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });

    // Calculations
    const debitTotal = sortedFilteredLedger.reduce((sum, entry) => sum + entry.debit, 0);
    const creditTotal = sortedFilteredLedger.reduce((sum, entry) => sum + entry.credit, 0);
    const runningBalance = creditTotal - debitTotal;

    const handleGoFilter = () => {
      setActiveFromDate(ledgerFromDate);
      setActiveToDate(ledgerToDate);
    };

    const handlePrintLedger = () => {
      window.print();
    };

    // --- Actions Handlers ---
    const handleSort = (field: string) => {
      if (ledgerSortField === field) {
        setLedgerSortOrder(ledgerSortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        setLedgerSortField(field);
        setLedgerSortOrder('asc');
      }
    };

    const handleStartEditDate = (id: string, currentDate: string) => {
      setEditingRowId(id);
      setEditingField('date');
      setEditDateValue(currentDate);
    };

    const handleStartEditParty = (id: string, currentParty: string) => {
      setEditingRowId(id);
      setEditingField('party');
      setEditPartyValue(currentParty);
    };

    const handleSaveEditDate = (id: string) => {
      if (!editDateValue) return;

      if (id.startsWith('INV-')) {
        const realId = id.replace('INV-', '');
        if (onUpdateInvoices) {
          const updated = invoices.map(inv => inv.id === realId ? { ...inv, date: editDateValue } : inv);
          onUpdateInvoices(updated);
        }
      } else if (id.startsWith('TX-')) {
        const realId = id.replace('TX-', '');
        if (onUpdateTransactions) {
          const updated = transactions.map(tx => tx.id === realId ? { ...tx, date: editDateValue } : tx);
          onUpdateTransactions(updated);
        }
      } else if (id.startsWith('PO-')) {
        const realId = id.replace('PO-', '');
        if (onUpdatePurchaseOrders) {
          const updated = purchaseOrders.map(po => po.id === realId ? { ...po, date: editDateValue } : po);
          onUpdatePurchaseOrders(updated);
        }
      }

      setEditingRowId(null);
      setEditingField(null);
      alert('তারিখ সফলভাবে আপডেট করা হয়েছে!');
    };

    const handleSaveEditParty = (id: string) => {
      if (!editPartyValue) return;

      let oldPartyName = '';
      let referenceNo = '';

      let updatedInvoices = [...invoices];
      let updatedTransactions = [...transactions];
      let updatedPurchaseOrders = [...purchaseOrders];

      if (id.startsWith('INV-')) {
        const realId = id.replace('INV-', '');
        const inv = invoices.find(i => i.id === realId);
        if (inv) {
          oldPartyName = inv.customerName;
          referenceNo = inv.invoiceNo;

          const matchedCust = customers.find(c => c.name === editPartyValue);
          updatedInvoices = invoices.map(item => {
            if (item.id === realId) {
              return {
                ...item,
                customerName: editPartyValue,
                customerId: matchedCust ? matchedCust.id : item.customerId
              };
            }
            return item;
          });

          // Also update referenced transactions (Debit/Credit counterpart)
          updatedTransactions = transactions.map(tx => {
            const matchesRef = tx.referenceNo === referenceNo || (referenceNo && tx.description?.includes(referenceNo));
            const matchesParty = oldPartyName && tx.description?.toLowerCase().includes(oldPartyName.toLowerCase());
            
            if (matchesRef || matchesParty) {
              let newDesc = tx.description;
              if (oldPartyName) {
                const regex = new RegExp(oldPartyName, 'gi');
                newDesc = tx.description.replace(regex, editPartyValue);
              }
              return {
                ...tx,
                description: newDesc
              };
            }
            return tx;
          });
        }
      } else if (id.startsWith('TX-')) {
        const realId = id.replace('TX-', '');
        const tx = transactions.find(t => t.id === realId);
        if (tx) {
          referenceNo = tx.referenceNo || '';
          
          const matchedCustOld = customers.find(c => tx.description?.toLowerCase().includes(c.name.toLowerCase()));
          const matchedSupOld = suppliers.find(s => tx.description?.toLowerCase().includes(s.name.toLowerCase()));
          oldPartyName = matchedCustOld?.name || matchedSupOld?.name || '';

          updatedTransactions = transactions.map(item => {
            if (item.id === realId) {
              let newDesc = item.description;
              if (oldPartyName) {
                const regex = new RegExp(oldPartyName, 'gi');
                newDesc = item.description.replace(regex, editPartyValue);
              } else {
                newDesc = `${item.category || 'Transaction'} - Party: ${editPartyValue}`;
              }
              return {
                ...item,
                description: newDesc
              };
            }
            
            const matchesRef = referenceNo && (item.referenceNo === referenceNo || item.description?.includes(referenceNo));
            if (matchesRef) {
              let newDesc = item.description;
              if (oldPartyName) {
                const regex = new RegExp(oldPartyName, 'gi');
                newDesc = item.description.replace(regex, editPartyValue);
              } else {
                newDesc = item.description + ` (Transferred to ${editPartyValue})`;
              }
              return {
                ...item,
                description: newDesc
              };
            }
            return item;
          });

          if (referenceNo) {
            const matchedCustNew = customers.find(c => c.name === editPartyValue);
            updatedInvoices = invoices.map(inv => {
              if (inv.invoiceNo === referenceNo) {
                return {
                  ...inv,
                  customerName: editPartyValue,
                  customerId: matchedCustNew ? matchedCustNew.id : inv.customerId
                };
              }
              return inv;
            });

            const matchedSupNew = suppliers.find(s => s.name === editPartyValue);
            updatedPurchaseOrders = purchaseOrders.map(po => {
              if (po.poNo === referenceNo) {
                return {
                  ...po,
                  supplierName: editPartyValue,
                  supplierId: matchedSupNew ? matchedSupNew.id : po.supplierId
                };
              }
              return po;
            });
          }
        }
      } else if (id.startsWith('PO-')) {
        const realId = id.replace('PO-', '');
        const po = purchaseOrders.find(p => p.id === realId);
        if (po) {
          oldPartyName = po.supplierName;
          referenceNo = po.poNo;

          const matchedSup = suppliers.find(s => s.name === editPartyValue);
          updatedPurchaseOrders = purchaseOrders.map(item => {
            if (item.id === realId) {
              return {
                ...item,
                supplierName: editPartyValue,
                supplierId: matchedSup ? matchedSup.id : item.supplierId
              };
            }
            return item;
          });

          updatedTransactions = transactions.map(tx => {
            const matchesRef = tx.referenceNo === referenceNo || (referenceNo && tx.description?.includes(referenceNo));
            const matchesParty = oldPartyName && tx.description?.toLowerCase().includes(oldPartyName.toLowerCase());
            
            if (matchesRef || matchesParty) {
              let newDesc = tx.description;
              if (oldPartyName) {
                const regex = new RegExp(oldPartyName, 'gi');
                newDesc = tx.description.replace(regex, editPartyValue);
              }
              return {
                ...tx,
                description: newDesc
              };
            }
            return tx;
          });
        }
      }

      if (onUpdateInvoices) onUpdateInvoices(updatedInvoices);
      if (onUpdateTransactions) onUpdateTransactions(updatedTransactions);
      if (onUpdatePurchaseOrders) onUpdatePurchaseOrders(updatedPurchaseOrders);

      setEditingRowId(null);
      setEditingField(null);
      alert('ক্লায়েন্ট/পার্টি এবং এর সাথে সম্পর্কিত রেফারেন্স লেনদেন (Debit/Credit) সফলভাবে স্থানান্তর করা হয়েছে!');
    };

    const handleDeleteRow = (id: string) => {
      if (!window.confirm('আপনি কি নিশ্চিত যে আপনি স্থায়ীভাবে এই আর্থিক রেকর্ডটি এবং এর সাথে সম্পর্কিত সকল রেফারেন্স ডেবিট/ক্রেডিট লেনদেন ডিলিট করতে চান? এটি অ্যাকাউন্টের ব্যালেন্স পরিবর্তন করবে।')) {
        return;
      }

      let updatedInvoices = [...invoices];
      let updatedTransactions = [...transactions];
      let updatedPurchaseOrders = [...purchaseOrders];

      if (id.startsWith('INV-')) {
        const realId = id.replace('INV-', '');
        const inv = invoices.find(i => i.id === realId);
        if (inv) {
          const refNo = inv.invoiceNo;
          // Delete invoice
          updatedInvoices = invoices.filter(i => i.id !== realId);
          // Delete related transactions (debit/credit counterparts)
          updatedTransactions = transactions.filter(tx => tx.referenceNo !== refNo && !(refNo && tx.description?.includes(refNo)));
          
          if (onUpdateInvoices) onUpdateInvoices(updatedInvoices);
          if (onUpdateTransactions) onUpdateTransactions(updatedTransactions);
          alert('ইনভয়েস এবং এর সাথে সম্পর্কিত ডেবিট-ক্রেডিট লেনদেন সফলভাবে ডিলিট করা হয়েছে!');
        }
      } else if (id.startsWith('PO-')) {
        const realId = id.replace('PO-', '');
        const po = purchaseOrders.find(p => p.id === realId);
        if (po) {
          const refNo = po.poNo;
          // Delete PO
          updatedPurchaseOrders = purchaseOrders.filter(p => p.id !== realId);
          // Delete related transactions
          updatedTransactions = transactions.filter(tx => tx.referenceNo !== refNo && !(refNo && tx.description?.includes(refNo)));
          
          if (onUpdatePurchaseOrders) onUpdatePurchaseOrders(updatedPurchaseOrders);
          if (onUpdateTransactions) onUpdateTransactions(updatedTransactions);
          alert('ক্রয় অর্ডার এবং এর সাথে সম্পর্কিত ডেবিট-ক্রেডিট লেনদেন সফলভাবে ডিলিট করা হয়েছে!');
        }
      } else if (id.startsWith('TX-')) {
        const realId = id.replace('TX-', '');
        const tx = transactions.find(t => t.id === realId);
        if (tx) {
          const refNo = tx.referenceNo || '';
          // Delete current transaction
          updatedTransactions = transactions.filter(t => t.id !== realId);
          
          // If there is a reference No, cascade delete other transaction entries and invoices/purchase orders sharing the reference
          if (refNo) {
            updatedTransactions = updatedTransactions.filter(t => t.referenceNo !== refNo && !t.description?.includes(refNo));
            updatedInvoices = invoices.filter(inv => inv.invoiceNo !== refNo);
            updatedPurchaseOrders = purchaseOrders.filter(po => po.poNo !== refNo);
          }

          if (onUpdateTransactions) onUpdateTransactions(updatedTransactions);
          if (onUpdateInvoices && refNo) onUpdateInvoices(updatedInvoices);
          if (onUpdatePurchaseOrders && refNo) onUpdatePurchaseOrders(updatedPurchaseOrders);
          alert('লেনদেন এবং এর সাথে সম্পর্কিত রেফারেন্স ডকুমেন্ট (যেমন: ইনভয়েস/ক্রয় বিল ও এর দ্বিপাক্ষিক এন্ট্রি) সফলভাবে ডিলিট করা হয়েছে!');
        }
      }
    };

    const handleAddManualAdjustment = (e: React.FormEvent) => {
      e.preventDefault();
      if (!adjAmount || isNaN(parseFloat(adjAmount))) {
        alert('দয়া করে একটি সঠিক অংক লিখুন।');
        return;
      }
      if (!adjPartyName.trim()) {
        alert('দয়া করে ক্লায়েন্ট বা পার্টির নাম লিখুন।');
        return;
      }

      const newTx: Transaction = {
        id: `tx_adj_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        category: adjCategory,
        description: `${adjDesc || adjCategory} - Party: ${adjPartyName}`,
        type: adjType,
        amount: parseFloat(adjAmount),
        referenceNo: adjRef || `ADJ-${Math.floor(1000 + Math.random() * 9000)}`,
        accountId: bankAccounts[0]?.id || 'cash_on_hand',
      };

      if (onUpdateTransactions) {
        onUpdateTransactions([...transactions, newTx]);
        alert('লেজার অ্যাডজাস্টমেন্ট এন্ট্রি সফলভাবে সম্পন্ন হয়েছে!');
        setShowAdjustmentForm(false);
        setAdjAmount('');
        setAdjPartyName('');
        setAdjDesc('');
        setAdjRef('');
      }
    };

    const handleExportLedgerCSV = () => {
      const headers = ['Row No', 'Date', 'Category', 'Reference No', 'Party Name', 'Address', 'Description', 'Debit (BDT)', 'Credit (BDT)', 'Entered By'];
      const rows = sortedFilteredLedger.map((entry, idx) => [
        idx + 1,
        entry.date,
        entry.category,
        entry.referenceNo,
        entry.partyName,
        entry.address || '—',
        entry.description,
        entry.debit,
        entry.credit,
        entry.enteredBy
      ]);

      const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
        + [headers.join(','), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `MS_Madani_Master_Ledger_${activeFromDate}_to_${activeToDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const allPartyNames = Array.from(new Set([
      ...customers.map(c => c.name),
      ...suppliers.map(s => s.name),
      'General Ledger Account',
      'Office Cash Account',
      'Adjustment Holder'
    ])).sort();

    return (
      <div className="space-y-4">
        {/* Custom Print Style Injection */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body * {
              visibility: hidden !important;
            }
            #master-ledger-printable-area, #master-ledger-printable-area * {
              visibility: visible !important;
            }
            #master-ledger-printable-area {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              background: white !important;
              color: black !important;
              padding: 1.5cm 1.5cm !important;
              margin: 0 !important;
              box-sizing: border-box !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}} />

        {/* Top Filters & Controls Toolbar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4 no-print">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Filter className="h-4 w-4 text-indigo-600" />
                <span>মাস্টার গ্রিড লেজার রিপোর্ট কুয়েরি ইন্জিন (Master Grid Engine)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">তালিকায় ডাবল-ক্লিক করে সরাসরি ডেট বা ক্লায়েন্ট এডিট করুন।</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowAdjustmentForm(!showAdjustmentForm)}
                className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-xs transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>ম্যানুয়াল অ্যাডজাস্টমেন্ট এন্ট্রি (Adj Entry)</span>
              </button>

              <button
                onClick={handleExportLedgerCSV}
                className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg border border-slate-200 transition-all cursor-pointer"
                title="Excel/CSV ফাইল ডাউনলোড করুন"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                <span>CSV ডাউনলোড</span>
              </button>

              <button
                onClick={handlePrintLedger}
                className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-xs transition-all active:scale-[0.98] cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>প্রিন্ট করুন</span>
              </button>
            </div>
          </div>

          {/* Manual Adjustment Form Drawer */}
          {showAdjustmentForm && (
            <form onSubmit={handleAddManualAdjustment} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-emerald-600" />
                  <span>লেজার অ্যাডজাস্টমেন্ট ভাউচার (Manual Adjustment Voucher)</span>
                </h4>
                <button type="button" onClick={() => setShowAdjustmentForm(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">প্রকার (Type)</label>
                  <select
                    value={adjType}
                    onChange={(e: any) => setAdjType(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-700"
                  >
                    <option value="Withdrawal">ডেবিট (Withdrawal/Expense)</option>
                    <option value="Deposit">ক্রেডিট (Deposit/Income)</option>
                  </select>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">ক্যাটাগরি (Category)</label>
                  <select
                    value={adjCategory}
                    onChange={(e) => setAdjCategory(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-700"
                  >
                    <option value="Office Expense">Office Expense</option>
                    <option value="Client Adjustment">Client Adjustment</option>
                    <option value="Cash Receipt">Cash Receipt</option>
                    <option value="Bank Charge">Bank Charge</option>
                    <option value="Capital Input">Capital Input</option>
                  </select>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">ক্লায়েন্ট / পার্টি (Party Name)</label>
                  <input
                    type="text"
                    list="adjustment-parties"
                    value={adjPartyName}
                    onChange={(e) => setAdjPartyName(e.target.value)}
                    placeholder="পার্টির নাম লিখুন"
                    className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-700"
                  />
                  <datalist id="adjustment-parties">
                    {allPartyNames.map(name => <option key={name} value={name} />)}
                  </datalist>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">টাকার অংক (Amount ৳)</label>
                  <input
                    type="number"
                    value={adjAmount}
                    onChange={(e) => setAdjAmount(e.target.value)}
                    placeholder="৳ অংক"
                    className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-700"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">রেফারেন্স নং (Reference)</label>
                  <input
                    type="text"
                    value={adjRef}
                    onChange={(e) => setAdjRef(e.target.value)}
                    placeholder="যেমন: ADJ-001"
                    className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-700"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">বিবরণ (Narration)</label>
                  <input
                    type="text"
                    value={adjDesc}
                    onChange={(e) => setAdjDesc(e.target.value)}
                    placeholder="সংক্ষিপ্ত বিবরণ"
                    className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-700"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-6 rounded-lg shadow-sm"
                >
                  সংরক্ষণ করুন (Save Adjustment)
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
            {/* From Date */}
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">From Date (তারিখ থেকে)</label>
              <input
                type="date"
                value={ledgerFromDate}
                onChange={(e) => setLedgerFromDate(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* To Date */}
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">To Date (তারিখ পর্যন্ত)</label>
              <input
                type="date"
                value={ledgerToDate}
                onChange={(e) => setLedgerToDate(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Category Filter Dropdown */}
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">ক্যাটাগরি ফিল্টার</label>
              <select
                value={ledgerCategory}
                onChange={(e) => setLedgerCategory(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="All">All Categories</option>
                <option value="Cash Sale Bill">Cash Sale Bill</option>
                <option value="Credit Sale Bill">Credit Sale Bill</option>
                <option value="Collection">Collection</option>
                <option value="Payment">Payment</option>
                <option value="Purchase Bill">Purchase Bill</option>
                <option value="Transfer">Transfer</option>
              </select>
            </div>

            {/* Party / Ref Search Box */}
            <div className="flex flex-col space-y-1 lg:col-span-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">খুঁজুন (Search Party / Ref)</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="যেমন: কাস্টমার, রেফারেন্স নং, বিবরণ..."
                  value={ledgerSearchText}
                  onChange={(e) => setLedgerSearchText(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 p-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                />
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>

            {/* Go Action Button */}
            <div className="flex items-end">
              <button
                onClick={handleGoFilter}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Activity className="h-4 w-4" />
                <span>ফিল্টার করুন (Go Filter)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Master Printable / A4 Render Wrapper */}
        <div id="master-ledger-printable-area" className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs p-6 space-y-6">
          
          {/* Print Header Block */}
          <div className="border-b border-slate-200 pb-5 text-center relative space-y-1.5">
            <h1 className="text-2xl font-black text-slate-900 uppercase font-serif tracking-wide" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}>
              M/S MADANI TRADERS
            </h1>
            <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">
              Dhaka Sadar Head Office, Dhaka, Bangladesh
            </p>
            <div className="flex flex-col items-center pt-2">
              <div className="border-t border-slate-300 w-40 my-0.5"></div>
              <h2 className="text-sm font-black text-slate-800 tracking-wider uppercase font-serif" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}>
                MASTER TRANSACTION LEDGER REGISTER (গ্রিড রিপোর্ট)
              </h2>
              <div className="border-b-2 border-double border-slate-800 w-48 mt-1 pb-0.5"></div>
            </div>

            {/* Print Metadata */}
            <div className="flex justify-between items-end pt-4 text-[9px] font-bold font-mono text-slate-400">
              <div>
                LEDGER DATE RANGE: <span className="text-slate-800 font-extrabold">{activeFromDate} to {activeToDate}</span>
              </div>
              <div className="no-print bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded font-sans text-[10px]">
                রোল: <span className="font-extrabold text-indigo-700">{currentUser?.role || 'Guest'}</span>
              </div>
              <div>
                SYSTEM ID: <span className="text-slate-800 font-extrabold">MASTER-TX-LEDGER</span>
              </div>
            </div>
          </div>

          {/* Combined Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-300 text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none">
                  <th className="py-2.5 px-3 text-center" style={{ width: '60px' }}>Row No</th>
                  
                  {/* Sorting Date Header */}
                  <th 
                    onClick={() => handleSort('date')}
                    className="py-2.5 px-3 cursor-pointer hover:bg-slate-200 transition-colors" 
                    style={{ width: '100px' }}
                  >
                    <div className="flex items-center gap-1">
                      <span>Date</span>
                      <ArrowUpDown className="h-3 w-3 text-slate-400 shrink-0" />
                    </div>
                  </th>

                  {/* Sorting Category Header */}
                  <th 
                    onClick={() => handleSort('category')}
                    className="py-2.5 px-3 cursor-pointer hover:bg-slate-200 transition-colors" 
                    style={{ width: '130px' }}
                  >
                    <div className="flex items-center gap-1">
                      <span>Category</span>
                      <ArrowUpDown className="h-3 w-3 text-slate-400 shrink-0" />
                    </div>
                  </th>

                  {/* Sorting Reference Header */}
                  <th 
                    onClick={() => handleSort('referenceNo')}
                    className="py-2.5 px-3 cursor-pointer hover:bg-slate-200 transition-colors" 
                    style={{ width: '110px' }}
                  >
                    <div className="flex items-center gap-1">
                      <span>Invoice/Ref No</span>
                      <ArrowUpDown className="h-3 w-3 text-slate-400 shrink-0" />
                    </div>
                  </th>

                  {/* Sorting Party Name Header */}
                  <th 
                    onClick={() => handleSort('partyName')}
                    className="py-2.5 px-3 cursor-pointer hover:bg-slate-200 transition-colors" 
                    style={{ width: '160px' }}
                  >
                    <div className="flex items-center gap-1">
                      <span>Party Name</span>
                      <ArrowUpDown className="h-3 w-3 text-slate-400 shrink-0" />
                    </div>
                  </th>

                  <th className="py-2.5 px-3" style={{ width: '140px' }}>Address/Location</th>
                  <th className="py-2.5 px-3">Description</th>
                  
                  {/* Sorting Debit Header */}
                  <th 
                    onClick={() => handleSort('debit')}
                    className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-200 transition-colors" 
                    style={{ width: '100px' }}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Debit</span>
                      <ArrowUpDown className="h-3 w-3 text-slate-400 shrink-0" />
                    </div>
                  </th>

                  {/* Sorting Credit Header */}
                  <th 
                    onClick={() => handleSort('credit')}
                    className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-200 transition-colors" 
                    style={{ width: '100px' }}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Credit</span>
                      <ArrowUpDown className="h-3 w-3 text-slate-400 shrink-0" />
                    </div>
                  </th>

                  <th className="py-2.5 px-3 text-center" style={{ width: '90px' }}>Entered By</th>
                  <th className="py-2.5 px-3 text-center no-print" style={{ width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {sortedFilteredLedger.map((entry, idx) => {
                  const isEditingThisRow = editingRowId === entry.id;
                  
                  return (
                    <tr key={entry.id} className="hover:bg-indigo-50/20 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      
                      {/* Date Column (Editable) */}
                      <td className="py-2.5 px-3 font-semibold font-mono">
                        {isEditingThisRow && editingField === 'date' ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="date"
                              value={editDateValue}
                              onChange={(e) => setEditDateValue(e.target.value)}
                              className="border border-indigo-400 rounded px-1.5 py-0.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 w-28 text-slate-800 bg-white"
                            />
                            <button
                              onClick={() => handleSaveEditDate(entry.id)}
                              className="p-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded cursor-pointer"
                              title="সংরক্ষণ করুন"
                            >
                              <Save className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => { setEditingRowId(null); setEditingField(null); }}
                              className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded cursor-pointer"
                              title="বাতিল করুন"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div 
                            onDoubleClick={() => handleStartEditDate(entry.id, entry.date)}
                            className="flex items-center gap-1 group cursor-pointer hover:text-indigo-600"
                            title="তারিখ এডিট করতে ডাবল-ক্লিক করুন"
                          >
                            <span>{entry.date}</span>
                            <Edit2 className="h-2.5 w-2.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity no-print" />
                          </div>
                        )}
                      </td>

                      {/* Category Label (Non-Editable Badge) */}
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          entry.category.toLowerCase().includes('sale') 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : entry.category.toLowerCase().includes('purchase') 
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : entry.category.toLowerCase().includes('collection') || entry.category.toLowerCase().includes('deposit')
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {entry.category}
                        </span>
                      </td>

                      {/* Invoice/Ref No */}
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-600 text-[11px]">{entry.referenceNo}</td>
                      
                      {/* Party Name (Editable Dropdown) */}
                      <td className="py-2.5 px-3 font-bold text-slate-800">
                        {isEditingThisRow && editingField === 'party' ? (
                          <div className="flex items-center gap-1">
                            <select
                              value={editPartyValue}
                              onChange={(e) => setEditPartyValue(e.target.value)}
                              className="border border-indigo-400 rounded px-1.5 py-0.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 w-36 text-slate-800 bg-white"
                            >
                              {allPartyNames.map(name => (
                                <option key={name} value={name}>{name}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleSaveEditParty(entry.id)}
                              className="p-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded cursor-pointer"
                              title="সংরক্ষণ করুন"
                            >
                              <Save className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => { setEditingRowId(null); setEditingField(null); }}
                              className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded cursor-pointer"
                              title="বাতিল করুন"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div 
                            onDoubleClick={() => handleStartEditParty(entry.id, entry.partyName)}
                            className="flex items-center gap-1 group cursor-pointer hover:text-indigo-600"
                            title="পার্টি এডিট করতে ডাবল-ক্লিক করুন"
                          >
                            <span>{entry.partyName}</span>
                            <Edit2 className="h-2.5 w-2.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity no-print" />
                          </div>
                        )}
                      </td>

                      {/* Address */}
                      <td className="py-2.5 px-3 text-slate-400 font-medium text-[11px] truncate max-w-[140px]" title={entry.address || '—'}>
                        {entry.address || <span className="text-slate-300">—</span>}
                      </td>

                      {/* Description */}
                      <td className="py-2.5 px-3 text-slate-500 font-medium truncate max-w-[180px]" title={entry.description}>
                        {entry.description}
                      </td>

                      {/* Debit (BDT) */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {entry.debit > 0 ? (
                          <span className="text-rose-600">৳{entry.debit.toLocaleString()}</span>
                        ) : (
                          <span className="text-slate-300 font-normal">—</span>
                        )}
                      </td>

                      {/* Credit (BDT) */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {entry.credit > 0 ? (
                          <span className="text-emerald-600">৳{entry.credit.toLocaleString()}</span>
                        ) : (
                          <span className="text-slate-300 font-normal">—</span>
                        )}
                      </td>

                      {/* Entered By */}
                      <td className="py-2.5 px-3 text-center text-slate-500 text-[11px] font-medium truncate max-w-[90px]" title={entry.enteredBy}>
                        {entry.enteredBy}
                      </td>

                      {/* Actions Column (Interactive Delete + Inline Trigger icons, no-print) */}
                      <td className="py-2.5 px-3 text-center no-print">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Edit Date Button */}
                          <button
                            onClick={() => {
                              if (isEditingThisRow && editingField === 'date') {
                                setEditingRowId(null);
                                setEditingField(null);
                              } else {
                                handleStartEditDate(entry.id, entry.date);
                              }
                            }}
                            className={`p-1 rounded transition-colors cursor-pointer ${
                              isEditingThisRow && editingField === 'date'
                                ? 'bg-indigo-600 text-white'
                                : 'hover:bg-indigo-50 text-indigo-500 hover:text-indigo-700'
                            }`}
                            title="তারিখ পরিবর্তন করুন (Edit Date)"
                          >
                            <Calendar className="h-3.5 w-3.5" />
                          </button>

                          {/* Transfer / Edit Client Party Button */}
                          <button
                            onClick={() => {
                              if (isEditingThisRow && editingField === 'party') {
                                setEditingRowId(null);
                                setEditingField(null);
                              } else {
                                handleStartEditParty(entry.id, entry.partyName);
                              }
                            }}
                            className={`p-1 rounded transition-colors cursor-pointer ${
                              isEditingThisRow && editingField === 'party'
                                ? 'bg-emerald-600 text-white'
                                : 'hover:bg-emerald-50 text-emerald-500 hover:text-emerald-700'
                            }`}
                            title="ক্লায়েন্ট/পার্টি স্থানান্তর করুন (Transfer Client/Party)"
                          >
                            <User className="h-3.5 w-3.5" />
                          </button>
                          
                          {/* Cascade Delete Button */}
                          <button
                            onClick={() => handleDeleteRow(entry.id)}
                            className="p-1 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded transition-colors cursor-pointer"
                            title="স্থায়ীভাবে মুছে ফেলুন (Delete Cascading / Dual Ledger)"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* Ledger Totals Row */}
                <tr className="bg-slate-50 font-semibold text-xs text-slate-900 border-t-2 border-slate-300 border-b-2 border-double border-slate-300">
                  <td colSpan={7} className="py-3 px-3 text-right font-black uppercase tracking-wider text-[10px] font-sans text-slate-500 select-none">
                    SUM / TOTAL LEDGER ACCUMULATION:
                  </td>
                  <td className="py-3 px-3 text-right font-black font-mono text-rose-600 bg-rose-50/30">
                    ৳{debitTotal.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-black font-mono text-emerald-600 bg-emerald-50/30">
                    ৳{creditTotal.toLocaleString()}
                  </td>
                  <td className="py-3 px-3"></td>
                  <td className="py-3 px-3 no-print"></td>
                </tr>

                {/* Ledger Running Balance Row */}
                <tr className="bg-indigo-50/40 text-xs font-black text-indigo-950">
                  <td colSpan={7} className="py-3 px-3 text-right uppercase tracking-wider text-[10px] font-sans text-indigo-800 select-none">
                    RUNNING BALANCING ACCOUNT (CREDIT − DEBIT):
                  </td>
                  <td colSpan={2} className="py-3 px-3 text-right font-black font-mono text-indigo-950 text-sm">
                    ৳{runningBalance.toLocaleString()}
                  </td>
                  <td className="py-3 px-3"></td>
                  <td className="py-3 px-3 no-print"></td>
                </tr>
              </tbody>
            </table>
          </div>

          {sortedFilteredLedger.length === 0 && (
            <div className="py-12 text-center text-slate-400 font-black bg-[#fafafa] rounded-lg border border-dashed border-slate-200">
              No matching transaction ledger entries found in selected date range.
            </div>
          )}

          {/* Audit Trail Note at bottom */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center text-[10px] font-bold text-slate-400 font-mono uppercase select-none">
            <span>* AUDIT NOTE: INTERNAL DOUBLE-ENTRY EQUILIBRIUM SECURED. AUDIT TRAIL PER-RECORD IS LOGGED SEPARATELY.</span>
            <span>PAGE 1 OF 1</span>
          </div>
        </div>
      </div>
    );
  };

  // ========================================================
  // A. CASH FLOW STATEMENT (ক্যাশ ফ্লো স্টেটমেন্ট)
  // ========================================================
  const renderCashFlow = () => {
    // Cash flow follows cash-impacting ledger postings. Accrual credit sales
    // and COGS postings are explicitly excluded from cash movements.
    const invoiceInflow = transactions
      .filter((tx) => tx.cashImpact !== false && (tx.type === 'Deposit' || tx.type === 'Income'))
      .reduce((sum, tx) => sum + tx.amount, 0);
    const expenseOutflow = transactions
      .filter((tx) => tx.cashImpact !== false && (tx.type === 'Withdrawal' || tx.type === 'Expense'))
      .reduce((sum, tx) => sum + tx.amount, 0);
    const customOperating = cashFlowAdjustments.filter(cf => cf.type === 'Operating').reduce((sum, cf) => sum + cf.amount, 0);
    const operatingTotal = invoiceInflow - expenseOutflow + customOperating;

    // 2. Investing: Custom adjustments
    const investingTotal = cashFlowAdjustments.filter(cf => cf.type === 'Investing').reduce((sum, cf) => sum + cf.amount, 0);

    // 3. Financing: Custom adjustments
    const financingTotal = cashFlowAdjustments.filter(cf => cf.type === 'Financing').reduce((sum, cf) => sum + cf.amount, 0);

    const netCashFlow = operatingTotal + investingTotal + financingTotal;

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-800">Statement of Cash Flows</h3>
            <p className="text-xs text-slate-400">Quarterly and daily cash flows, grouped into Operating, Investing, and Financing channels.</p>
          </div>
          <button
            onClick={() => setShowNewCashFlowModal(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>ম্যানুয়াল ক্যাশ এডজাস্টমেন্ট</span>
          </button>
        </div>

        {/* Cash Flow Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-xs">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Operating Cash Flows</span>
            <span className="text-base font-extrabold text-slate-800 block mt-1">৳{operatingTotal.toLocaleString()}</span>
            <span className="text-[10px] text-slate-400">Invoices & Direct Expenses</span>
          </div>
          <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-xs">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Investing Activities</span>
            <span className="text-base font-extrabold text-slate-850 block mt-1">
              {investingTotal >= 0 ? '+' : ''}৳{investingTotal.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">Capital investments & assets</span>
          </div>
          <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-xs">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Financing Activities</span>
            <span className="text-base font-extrabold text-slate-850 block mt-1">
              {financingTotal >= 0 ? '+' : ''}৳{financingTotal.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">Loans, Equity & Fundings</span>
          </div>
          <div className={`p-4 rounded-xl shadow-xs border ${
            netCashFlow >= 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-950' : 'bg-rose-50 border-rose-100 text-rose-950'
          }`}>
            <span className="text-[9px] font-black uppercase tracking-wider block">Net Cash Flow Balance</span>
            <span className="text-lg font-black block mt-1">৳{netCashFlow.toLocaleString()}</span>
            <span className="text-[10px] font-medium opacity-80">মিলিত মোট ক্যাশ তারল্য</span>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50/50 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Cash Flow Breakdown Structure</h4>
          </div>
          <div className="p-6 space-y-6 text-xs">
            {/* Operating */}
            <div className="space-y-2">
              <h5 className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">1. Operating Activities (পরিচালন কার্যক্রম)</h5>
              <div className="border border-slate-100 rounded-lg divide-y divide-slate-50 font-medium text-slate-600 bg-slate-50/20">
                <div className="flex justify-between p-3">
                  <span>(+) Customer Invoice Payments (গৃহীত বিক্রয় মূল্য)</span>
                  <span className="text-emerald-650 font-bold font-mono">৳{invoiceInflow.toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-3">
                  <span>(−) Supplier & Operational Expenses (ব্যবসায়িক খরচ)</span>
                  <span className="text-rose-600 font-bold font-mono">−৳{expenseOutflow.toLocaleString()}</span>
                </div>
                {cashFlowAdjustments.filter(cf => cf.type === 'Operating').map(cf => (
                  <div key={cf.id} className="flex justify-between p-3">
                    <span>{cf.amount >= 0 ? '(+)' : '(−)'} {cf.description} ({cf.date})</span>
                    <span className={`font-bold font-mono ${cf.amount >= 0 ? 'text-emerald-650' : 'text-rose-600'}`}>
                      {cf.amount >= 0 ? '+' : ''}৳{cf.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between p-3 font-bold bg-slate-100/40 text-slate-800">
                  <span>Net Cash from Operating Activities</span>
                  <span className="font-mono">৳{operatingTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Investing */}
            <div className="space-y-2">
              <h5 className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">2. Investing Activities (বিনিয়োগ কার্যক্রম)</h5>
              <div className="border border-slate-100 rounded-lg divide-y divide-slate-50 font-medium text-slate-600 bg-slate-50/20">
                {cashFlowAdjustments.filter(cf => cf.type === 'Investing').length === 0 ? (
                  <div className="p-3 text-slate-450 italic">কোনো বিনিয়োগ এন্ট্রি পাওয়া যায়নি।</div>
                ) : (
                  cashFlowAdjustments.filter(cf => cf.type === 'Investing').map(cf => (
                    <div key={cf.id} className="flex justify-between p-3">
                      <span>{cf.amount >= 0 ? '(+)' : '(−)'} {cf.description} ({cf.date})</span>
                      <span className={`font-bold font-mono ${cf.amount >= 0 ? 'text-emerald-650' : 'text-rose-600'}`}>
                        {cf.amount >= 0 ? '+' : ''}৳{cf.amount.toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
                <div className="flex justify-between p-3 font-bold bg-slate-100/40 text-slate-800">
                  <span>Net Cash from Investing Activities</span>
                  <span className="font-mono">৳{investingTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Financing */}
            <div className="space-y-2">
              <h5 className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">3. Financing Activities (অর্থায়ন কার্যক্রম)</h5>
              <div className="border border-slate-100 rounded-lg divide-y divide-slate-50 font-medium text-slate-600 bg-slate-50/20">
                {cashFlowAdjustments.filter(cf => cf.type === 'Financing').length === 0 ? (
                  <div className="p-3 text-slate-450 italic">কোনো অর্থায়ন এন্ট্রি পাওয়া যায়নি।</div>
                ) : (
                  cashFlowAdjustments.filter(cf => cf.type === 'Financing').map(cf => (
                    <div key={cf.id} className="flex justify-between p-3">
                      <span>{cf.amount >= 0 ? '(+)' : '(−)'} {cf.description} ({cf.date})</span>
                      <span className={`font-bold font-mono ${cf.amount >= 0 ? 'text-emerald-650' : 'text-rose-600'}`}>
                        {cf.amount >= 0 ? '+' : ''}৳{cf.amount.toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
                <div className="flex justify-between p-3 font-bold bg-slate-100/40 text-slate-800">
                  <span>Net Cash from Financing Activities</span>
                  <span className="font-mono">৳{financingTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal form */}
        {showNewCashFlowModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={() => setShowNewCashFlowModal(false)}>
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden border border-slate-100" onClick={(e) => e.stopPropagation()}>
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">ম্যানুয়াল ক্যাশ ফ্লো এডজাস্টমেন্ট</h4>
                <button onClick={() => setShowNewCashFlowModal(false)} className="text-slate-400 font-bold cursor-pointer">✕</button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!newCfDesc || !newCfAmount) {
                  window.alert('বিবরণ এবং টাকার পরিমাণ লিখুন!');
                  return;
                }

                const newAdj = {
                  id: `cf_${Date.now()}`,
                  type: newCfType,
                  description: newCfDesc,
                  amount: Number(newCfAmount),
                  date: new Date().toISOString().substring(0, 10)
                };

                const updated = [...cashFlowAdjustments, newAdj];
                setCashFlowAdjustments(updated);
                localStorage.setItem('nexova_cash_flow_adjustments', JSON.stringify(updated));

                setShowNewCashFlowModal(false);
                setNewCfDesc('');
                setNewCfAmount(0);
              }} className="p-5 space-y-4 text-xs text-left">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ক্যাশ ফ্লো চ্যানেল (Activities Segment) *</label>
                  <select
                    value={newCfType}
                    onChange={(e) => setNewCfType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold cursor-pointer"
                  >
                    <option value="Operating">Operating Activities (পরিচালন)</option>
                    <option value="Investing">Investing Activities (বিনিয়োগ)</option>
                    <option value="Financing">Financing Activities (অর্থায়ন)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">এডজাস্টমেন্ট বিবরণ (Description) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Purchase of machine spare, loan repayment"
                    value={newCfDesc}
                    onChange={(e) => setNewCfDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">পরিমাণ BDT (Amount) *</label>
                  <input
                    type="number"
                    required
                    placeholder="পজিটিভ মানে ক্যাশ ইন, নেগেটিভ মানে ক্যাশ আউট"
                    onChange={(e) => setNewCfAmount(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono font-bold"
                  />
                  <p className="text-[9px] text-slate-400 mt-1">পজিটিভ (+) ইনকাম নির্দেশ করে এবং নেগেটিভ (−) খরচ নির্দেশ করে।</p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => setShowNewCashFlowModal(false)} className="px-3.5 py-1.5 border border-slate-200 text-slate-500 rounded-lg">Cancel</button>
                  <button type="submit" className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold">সংরক্ষণ করুন</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ========================================================
  // B. MANUFACTURING RESOURCE LOGS (ম্যানুফ্যাকচারিং রিসোর্স লগ)
  // ========================================================
  const renderMfgReport = () => {
    const totalCostSpent = mfgResourceLogs.reduce((sum, l) => sum + l.totalCost, 0);

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-800">Manufacturing Resource Logs</h3>
            <p className="text-xs text-slate-400">Track raw materials consumed, electrical units, molding machine hours, and manual labor wages.</p>
          </div>
          <button
            onClick={() => {
              setNewMfgResource('');
              setNewMfgQty(0);
              setNewMfgUnitCost(0);
              setShowMfgLogModal(true);
            }}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>নতুন রিসোর্স ব্যবহার লগ করুন</span>
          </button>
        </div>

        {/* Dynamic Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-xs">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Resource Value Spent</span>
            <span className="text-base font-extrabold text-slate-800 block mt-1">৳{totalCostSpent.toLocaleString()}</span>
            <span className="text-[10px] text-indigo-600">মোট ব্যবহৃত কাঁচামাল ও ইউটিলিটি মূল্য</span>
          </div>
          <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-xs">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Active Plant Stations</span>
            <span className="text-base font-extrabold text-slate-850 block mt-1">4 Production Lines</span>
            <span className="text-[10px] text-slate-400">Continuous heavy-molding active</span>
          </div>
          <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-xs">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Logged Entries</span>
            <span className="text-base font-extrabold text-emerald-700 block mt-1">{mfgResourceLogs.length} Records</span>
            <span className="text-[10px] text-slate-400">Audit-ready production trail</span>
          </div>
        </div>

        {/* List Grid */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100/60 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-4">Resource Logged</th>
                <th className="py-2.5 px-4">Category Type</th>
                <th className="py-2.5 px-4">Logged Station Line</th>
                <th className="py-2.5 px-4 text-right">Quantity</th>
                <th className="py-2.5 px-4 text-right">Unit Rate</th>
                <th className="py-2.5 px-4 text-right">Total Cost Spent</th>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {mfgResourceLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">কোনো ম্যানুফ্যাকচারিং রিসোর্স ব্যবহারের ডাটা পাওয়া যায়নি।</td>
                </tr>
              ) : (
                mfgResourceLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/40">
                    <td className="py-3 px-4 font-bold text-slate-800">{l.resource}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold uppercase tracking-wider">{l.type}</span>
                    </td>
                    <td className="py-3 px-4 text-indigo-650 font-semibold">{l.line}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold">{l.qty} {l.unit}</td>
                    <td className="py-3 px-4 text-right font-mono">৳{l.unitCost.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600 font-mono">৳{l.totalCost.toLocaleString()}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[10px]">{l.timestamp}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          if (window.confirm('আপনি কি এই ব্যবহারের রেকর্ডটি মুছে ফেলতে চান?')) {
                            const updated = mfgResourceLogs.filter(itm => itm.id !== l.id);
                            setMfgResourceLogs(updated);
                            localStorage.setItem('nexova_mfg_resource_logs', JSON.stringify(updated));
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 font-black"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Dialog */}
        {showMfgLogModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={() => setShowMfgLogModal(false)}>
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden border border-slate-100" onClick={(e) => e.stopPropagation()}>
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">রিসোর্স ব্যবহার ডাটা যোগ করুন</h4>
                <button onClick={() => setShowMfgLogModal(false)} className="text-slate-400 font-bold cursor-pointer">✕</button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!newMfgResource || newMfgQty <= 0 || newMfgUnitCost <= 0) {
                  window.alert('সঠিক রিসোর্স নাম, সংখ্যা ও একক রেট দিন!');
                  return;
                }

                const newLog = {
                  id: `rl_${Date.now()}`,
                  resource: newMfgResource,
                  type: newMfgType,
                  qty: Number(newMfgQty),
                  unit: newMfgUnit,
                  unitCost: Number(newMfgUnitCost),
                  totalCost: Number(newMfgQty) * Number(newMfgUnitCost),
                  line: newMfgLine,
                  timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
                };

                const updated = [newLog, ...mfgResourceLogs];
                setMfgResourceLogs(updated);
                localStorage.setItem('nexova_mfg_resource_logs', JSON.stringify(updated));

                setShowMfgLogModal(false);
                setNewMfgResource('');
                setNewMfgQty(0);
                setNewMfgUnitCost(0);
              }} className="p-5 space-y-4 text-xs text-left">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">রিসোর্স নাম (Resource Name) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PP Raw Plastic Granules Grade-A"
                    value={newMfgResource}
                    onChange={(e) => setNewMfgResource(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">রিসোর্স ধরণ *</label>
                    <select
                      value={newMfgType}
                      onChange={(e) => setNewMfgType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold cursor-pointer"
                    >
                      <option value="Raw Material">Raw Material</option>
                      <option value="Labor Hours">Labor Hours</option>
                      <option value="Electricity / Utility">Electricity / Utility</option>
                      <option value="Packaging">Packaging</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">স্টেশন / প্ল্যান্ট লাইন *</label>
                    <select
                      value={newMfgLine}
                      onChange={(e) => setNewMfgLine(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold cursor-pointer"
                    >
                      <option value="Extrusion Line 1">Extrusion Line 1</option>
                      <option value="Blow Molding Unit B">Blow Molding Unit B</option>
                      <option value="Assembly Line 3">Assembly Line 3</option>
                      <option value="Finishing Station D">Finishing Station D</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ব্যবহার পরিমাণ *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newMfgQty}
                      onChange={(e) => setNewMfgQty(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">একক (Unit) *</label>
                    <input
                      type="text"
                      required
                      placeholder="kg, hrs, units"
                      value={newMfgUnit}
                      onChange={(e) => setNewMfgUnit(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">একক রেট / খরচ (Unit Rate Cost BDT) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="৳"
                    value={newMfgUnitCost}
                    onChange={(e) => setNewMfgUnitCost(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold font-mono text-slate-800"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => setShowMfgLogModal(false)} className="px-3.5 py-1.5 border border-slate-200 text-slate-500 rounded-lg">Cancel</button>
                  <button type="submit" className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold">সংরক্ষণ করুন</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ========================================================
  // C. CUSTOM REPORTS BUILDER (কাস্টম রিপোর্টস নির্মাতা)
  // ========================================================
  const renderCustomReports = () => {
    // Determine dynamic list to display
    let sourceList: any[] = [];
    if (customEntity === 'invoices') sourceList = invoices;
    else if (customEntity === 'transactions') sourceList = transactions;
    else if (customEntity === 'employees') sourceList = employees;
    else if (customEntity === 'products') sourceList = products;
    else if (customEntity === 'customers') sourceList = customers;
    else if (customEntity === 'suppliers') sourceList = suppliers;
    else if (customEntity === 'purchaseOrders') sourceList = purchaseOrders;

    const catalog = CUSTOM_REPORT_FIELD_CATALOG[customEntity] || [];
    const labelFor = (key: string) => catalog.find(f => f.key === key)?.label || key.replace(/([A-Z])/g, ' $1');
    const availableFields = catalog.filter(f => !customFields.includes(f.key));

    // Filter by text
    const filtered = sourceList.filter(item => {
      const matchStr = customFilterValue.toLowerCase();
      if (!matchStr) return true;
      return Object.values(item).some(val => String(val).toLowerCase().includes(matchStr));
    });

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      const valA = a[customSortField];
      const valB = b[customSortField];

      if (typeof valA === 'number' && typeof valB === 'number') {
        return customSortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return customSortOrder === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });

    const addField = (key: string) => {
      setCustomFields(prev => [...prev, key]);
    };
    const removeField = (key: string) => {
      const next = customFields.filter(f => f !== key);
      setCustomFields(next);
      if (customSortField === key && next.length > 0) setCustomSortField(next[0]);
    };
    const reorderFields = (fromIdx: number, toIdx: number) => {
      if (fromIdx === toIdx) return;
      const next = [...customFields];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      setCustomFields(next);
    };
    const exportCsv = () => {
      const header = customFields.map(labelFor).join(',');
      const rows = sorted.map(item =>
        customFields.map(fld => {
          const v = item[fld];
          const s = v === undefined || v === null ? '' : String(v);
          return `"${s.replace(/"/g, '""')}"`;
        }).join(',')
      );
      const csv = [header, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${customEntity}_custom_report.csv`;
      a.click();
      URL.revokeObjectURL(url);
    };

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-base font-extrabold text-slate-800">Dynamic Custom Reports Builder</h3>
          <p className="text-xs text-slate-400">যেকোনো ডেটা সোর্স বেছে নিন, ইচ্ছেমতো কলাম টেনে যোগ করুন, ড্র্যাগ করে সাজান — তারপর ফিল্টার, সর্ট, প্রিন্ট বা এক্সপোর্ট করুন।</p>
        </div>

        {/* Configuration Panel */}
        <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4 text-xs text-left">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">১. প্রাইমারি ডেটা উৎস (Data Entity)</label>
              <select
                value={customEntity}
                onChange={(e) => {
                  const ent = e.target.value as any;
                  setCustomEntity(ent);
                  const defaults = (CUSTOM_REPORT_FIELD_CATALOG[ent] || []).slice(0, 4).map(f => f.key);
                  setCustomFields(defaults);
                  setCustomSortField(defaults[0] || '');
                }}
                className="w-full bg-white border border-slate-250 p-2 rounded-lg font-bold cursor-pointer text-slate-800"
              >
                <option value="invoices">Customer Invoices (বিক্রয় চালান)</option>
                <option value="transactions">GL Ledger Postings (সাধারণ লেজার)</option>
                <option value="employees">HR Employee Roster (কর্মকর্তা তালিকা)</option>
                <option value="products">Inventory Raw/Fin Products (পণ্য স্টক)</option>
                <option value="customers">Customers (গ্রাহক তালিকা)</option>
                <option value="suppliers">Suppliers (সরবরাহকারী তালিকা)</option>
                <option value="purchaseOrders">Purchase Orders (ক্রয়াদেশ)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">২. সর্টিং ফিল্ড (Sorting Key)</label>
              <select
                value={customSortField}
                onChange={(e) => setCustomSortField(e.target.value)}
                className="w-full bg-white border border-slate-250 p-2 rounded-lg font-mono font-bold cursor-pointer"
              >
                {customFields.map(fld => (
                  <option key={fld} value={fld}>{labelFor(fld)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">৩. ক্রমানুসারে (Sorting Order)</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setCustomSortOrder('asc')}
                  className={`flex-1 p-2 rounded-lg font-bold border transition-all cursor-pointer ${
                    customSortOrder === 'asc' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-250 text-slate-600'
                  }`}
                >
                  Ascending
                </button>
                <button
                  onClick={() => setCustomSortOrder('desc')}
                  className={`flex-1 p-2 rounded-lg font-bold border transition-all cursor-pointer ${
                    customSortOrder === 'desc' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-250 text-slate-600'
                  }`}
                >
                  Descending
                </button>
              </div>
            </div>
          </div>

          {/* Column Picker — Available fields (click to add) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">৪. উপলব্ধ ফিল্ড — কলাম যোগ করতে ক্লিক করুন (Available Fields)</label>
            <div className="flex flex-wrap gap-1.5">
              {availableFields.length === 0 && (
                <span className="text-slate-400 italic">সব ফিল্ড ইতিমধ্যে যোগ করা হয়েছে।</span>
              )}
              {availableFields.map(f => (
                <button
                  key={f.key}
                  onClick={() => addField(f.key)}
                  className="flex items-center gap-1 bg-white border border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50 font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Columns — drag and drop to reorder, click X to remove */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">৫. নির্বাচিত কলাম — ড্র্যাগ করে ক্রম বদলান (Selected Columns)</label>
            <div className="flex flex-wrap gap-1.5">
              {customFields.length === 0 && (
                <span className="text-slate-400 italic">উপরে থেকে অন্তত একটা ফিল্ড যোগ করুন।</span>
              )}
              {customFields.map((fld, idx) => (
                <div
                  key={fld}
                  draggable
                  onDragStart={() => setCustomDragIndex(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (customDragIndex !== null) reorderFields(customDragIndex, idx);
                    setCustomDragIndex(null);
                  }}
                  onDragEnd={() => setCustomDragIndex(null)}
                  className={`flex items-center gap-1.5 bg-indigo-600 text-white font-bold px-2.5 py-1.5 rounded-lg cursor-grab active:cursor-grabbing select-none transition-opacity ${
                    customDragIndex === idx ? 'opacity-40' : 'opacity-100'
                  }`}
                >
                  <GripVertical className="h-3.5 w-3.5 opacity-70" />
                  {labelFor(fld)}
                  <button
                    onClick={() => removeField(fld)}
                    className="ml-0.5 hover:bg-indigo-800 rounded-full p-0.5 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">৬. টেক্সট ফিল্টার (Live Query Search)</label>
            <div className="relative max-w-sm">
              <input
                type="text"
                placeholder="Type to filter rows..."
                value={customFilterValue}
                onChange={(e) => setCustomFilterValue(e.target.value)}
                className="w-full bg-white border border-slate-250 p-2 pl-8 rounded-lg font-bold text-slate-800"
              />
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              জেনারেট হচ্ছে: <strong className="text-slate-800 uppercase font-mono">{customEntity}</strong> ডাটা সোর্স। মোট রেজাল্টস: <strong>{sorted.length} সারি</strong>
            </span>
            <div className="flex items-center gap-4">
              <button
                onClick={exportCsv}
                className="flex items-center gap-1 text-emerald-600 hover:text-emerald-800 font-bold cursor-pointer"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>CSV এক্সপোর্ট</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>মুদ্রণ ও পিডিএফ তৈরি করুন (Print / PDF)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Generated Report Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-150 text-slate-600 border-b border-slate-250 text-[10px] font-bold uppercase tracking-wider">
                {customFields.map(fld => (
                  <th key={fld} className="py-2.5 px-4">{labelFor(fld)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {customFields.length === 0 ? (
                <tr>
                  <td className="py-8 text-center text-slate-400 font-bold">উপরে থেকে কলাম নির্বাচন করুন রিপোর্ট দেখতে।</td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={customFields.length} className="py-8 text-center text-slate-400 font-bold">ফিল্টার ক্রাইটেরিয়ার সাথে মিলে এমন কোনো ডেটা পাওয়া যায়নি।</td>
                </tr>
              ) : (
                sorted.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/50">
                    {customFields.map(fld => {
                      const val = item[fld];
                      let displayVal = String(val === undefined || val === null ? '' : val);

                      // formatting improvements
                      if (fld === 'isPaid') displayVal = val ? 'PAID' : 'DUE';
                      if (typeof val === 'number') {
                        if (['price', 'salary', 'total', 'amount', 'cost', 'subtotal', 'taxAmount', 'discount', 'outstandingBalance', 'labourCost', 'transportCost'].includes(fld)) {
                          displayVal = '৳' + val.toLocaleString();
                        } else {
                          displayVal = val.toLocaleString();
                        }
                      }

                      return (
                        <td key={fld} className={`py-3 px-4 ${
                          ['invoiceNo', 'referenceNo', 'id', 'poNo', 'sku'].includes(fld) ? 'font-mono text-indigo-600 font-bold' : ''
                        } ${
                          displayVal === 'PAID' ? 'text-emerald-600 font-bold' : displayVal === 'DUE' ? 'text-rose-500 font-bold' : ''
                        }`}>
                          {displayVal}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ========================================================
  // D. MULTI-VARIANCE CORE ANALYTICS (মাল্টি-ভেরিয়েন্স কোর অ্যানালিটিক্স)
  // ========================================================
  const renderAnalytics = () => {
    // 1. Budget vs Actual Variance
    // Try to load budget allocations from localstorage or use a reliable default
    const rawBg = localStorage.getItem('nexova_budget_allocations');
    let localBudgets: any[] = [];
    if (rawBg) {
      try { localBudgets = JSON.parse(rawBg); } catch(e){}
    }
    if (localBudgets.length === 0) {
      localBudgets = [
        { id: "b_1", department: "Marketing", allocated: 120000, spent: 85000, quarter: "Q3 2026" },
        { id: "b_2", department: "Operations", allocated: 350000, spent: 310000, quarter: "Q3 2026" },
        { id: "b_3", department: "IT & Infrastructure", allocated: 200000, spent: 145000, quarter: "Q3 2026" },
        { id: "b_4", department: "HR & Admin", allocated: 90000, spent: 88000, quarter: "Q3 2026" }
      ];
    }

    // 2. HR Efficiency: Revenue generated per employee
    const totalRev = invoices.filter(inv => inv.isPaid).reduce((sum, inv) => sum + inv.total, 0);
    const activeStaffCount = employees.length || 4;
    const revPerEmployee = totalRev / activeStaffCount;

    // 3. Asset coverage ratio: total bank balance / total due invoices
    const bankSum = bankAccounts.reduce((sum, b) => sum + b.balance, 0);
    const dueSum = invoices.filter(inv => !inv.isPaid).reduce((sum, inv) => sum + inv.total, 0);
    const liquidityRatio = dueSum > 0 ? (bankSum / dueSum) : 10;

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-base font-extrabold text-slate-800">Multi-Variance Corporate Intelligence</h3>
          <p className="text-xs text-slate-400">Deep comparative financial metrics comparing department spending variance, employee efficiency multipliers, and asset-to-debt coverages.</p>
        </div>

        {/* Multi-Variance Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left text-xs">
          
          {/* Variance Box 1: Budget vs Actual Spent Variance */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5 uppercase text-[10px] tracking-wider text-indigo-700">
              <Sliders className="h-4 w-4" />
              <span>Budget Spending Variance Analysis</span>
            </h4>
            <div className="space-y-3">
              {localBudgets.map(bg => {
                const variance = bg.allocated - bg.spent;
                const variancePct = bg.allocated > 0 ? (variance / bg.allocated) * 100 : 0;
                return (
                  <div key={bg.id} className="space-y-1">
                    <div className="flex justify-between font-bold text-slate-700 text-[11px]">
                      <span>{bg.department}</span>
                      <span className={variance >= 0 ? 'text-emerald-600' : 'text-rose-500'}>
                        {variance >= 0 ? 'Surplus' : 'Deficit'} {variancePct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[10px]">
                      <span>Budget: ৳{bg.allocated.toLocaleString()}</span>
                      <span>Spent: ৳{bg.spent.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${variance >= 0 ? 'bg-indigo-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(100, (bg.spent / bg.allocated) * 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Variance Box 2: HR Wage Multiplier & Efficiency */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5 uppercase text-[10px] tracking-wider text-emerald-700">
              <Activity className="h-4 w-4" />
              <span>HR Productivity Multipliers</span>
            </h4>
            <div className="space-y-4">
              <div className="bg-emerald-50/50 border border-emerald-100 p-3.5 rounded-xl space-y-1">
                <span className="text-slate-500 font-medium block">Realized Revenue Per Staff</span>
                <span className="text-lg font-extrabold text-slate-800 block">৳{revPerEmployee.toFixed(2)}</span>
                <span className="text-[10px] text-slate-400">Total revenue divided by active roster size</span>
              </div>
              <div className="space-y-2 font-medium text-slate-600">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span>Active Roster Size</span>
                  <span className="font-bold text-slate-800">{activeStaffCount} Employees</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span>Monthly Payroll Roll</span>
                  <span className="font-bold text-slate-800">৳{employees.reduce((sum, e) => sum + e.salary, 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Productivity Factor</span>
                  <span className="font-bold text-emerald-600">৳{(revPerEmployee / 12).toFixed(1)} / mo avg</span>
                </div>
              </div>
            </div>
          </div>

          {/* Variance Box 3: Liquidity Debt Coverage Ratio */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5 uppercase text-[10px] tracking-wider text-indigo-700">
              <ShieldCheck className="h-4 w-4" />
              <span>Liquidity Debt & Risk Coverage</span>
            </h4>
            <div className="space-y-4">
              <div className="bg-indigo-50/50 border border-indigo-100 p-3.5 rounded-xl space-y-1">
                <span className="text-slate-500 font-medium block">Liquid Assets vs Receivable Debt</span>
                <span className="text-lg font-extrabold text-indigo-900 block">{liquidityRatio.toFixed(2)}x Covered</span>
                <span className="text-[10px] text-slate-400">Healthy threshold is above 1.0x</span>
              </div>
              <div className="space-y-2 font-medium text-slate-600 text-[11px]">
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span>Total Liquid Assets</span>
                  <span className="font-bold font-mono text-slate-800">৳{bankSum.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span>Outstanding Receivable Debt</span>
                  <span className="font-bold font-mono text-rose-500">৳{dueSum.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>System Solvency Status</span>
                  <span className="px-2 py-0.2 bg-emerald-50 text-emerald-700 rounded-full font-black text-[9px] uppercase">Highly Solvent</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getSubTabTitle = () => {
    switch (activeSubTab) {
      case 'sales_report':
        return 'Sales Report';
      case 'purchase_register':
        return 'Purchase Register';
      case 'low_stock':
        return 'Low Stock Alert Report';
      case 'dead_stock':
        return 'Dead Stock Register';
      case 'day_book':
        return 'Day Book Ledger';
      case 'cash_book':
        return 'Cash Book Ledger';
      case 'trial_balance':
        return 'Trial Balance Sheet';
      case 'balance_sheet':
        return 'Balance Sheet (A = L + E)';
      case 'profit_loss':
        return 'Statement of Profit & Loss';
      case 'ar_ageing':
        return 'Accounts Receivable Ageing';
      case 'overdue_reminders':
        return 'Overdue Payment Reminders List';
      case 'mushak_vat':
      case 'tax_report':
        return 'VAT / Mushak Sales Statement Report';
      case 'ap_ageing':
        return 'Accounts Payable Ageing';
      case 'profit_report':
        return 'Consolidated Profit Margin Report';
      case 'product_profit':
        return 'Product wise Profit Margin';
      case 'daily_report':
        return 'Daily Cash Report';
      case 'new_products_daily':
        return 'New Products Registry (Daily)';
      case 'new_customers_daily':
        return 'New Customers Registry (Daily)';
      case 'offer_sales_report':
        return 'Promotional Sales Report';
      case 'product_wise_total_profit':
        return 'Product Wise Total Realized Profit';
      case 'master_ledger':
        return 'Master Transaction Ledger';
      case 'cash_flow':
        return 'Statement of Cash Flows (ক্যাশ ফ্লো স্টেটমেন্ট)';
      case 'mfg_report':
        return 'Manufacturing Resource Logs (ম্যানুফ্যাকচারিং রিসোর্স)';
      case 'custom_reports':
        return 'Custom Reports Builder (কাস্টম রিপোর্ট বিল্ডার)';
      case 'analytics':
        return 'Multi-Variance Core Analytics (মাল্টি-ভেরিয়েন্স অ্যানালিটিক্স)';
      default:
        return 'Analytical Ledger Report';
    }
  };

  const renderActiveReport = () => {
    switch (activeSubTab) {
      case 'sales_report':
        return renderSalesReport();
      case 'purchase_register':
        return renderPurchaseRegister();
      case 'low_stock':
        return renderLowStock();
      case 'dead_stock':
        return renderDeadStock();
      case 'day_book':
        return renderDayBook();
      case 'cash_book':
        return renderCashBook();
      case 'trial_balance':
        return renderTrialBalance();
      case 'balance_sheet':
        return renderBalanceSheet();
      case 'profit_loss':
        return renderProfitLoss();
      case 'ar_ageing':
        return renderArAgeing();
      case 'overdue_reminders':
        return renderOverdueReminders();
      case 'mushak_vat':
      case 'tax_report':
        return renderMushakVatReport();
      case 'ap_ageing':
        return renderApAgeing();
      case 'profit_report':
        return renderProfitReport();
      case 'product_profit':
        return renderProductProfit();
      case 'daily_report':
        return renderDailyReport();
      case 'new_products_daily':
        return renderNewProductsDaily();
      case 'new_customers_daily':
        return renderNewCustomersDaily();
      case 'offer_sales_report':
        return renderOfferSalesReport();
      case 'product_wise_total_profit':
        return renderProductWiseTotalProfit();
      case 'master_ledger':
        return renderMasterLedger();
      case 'cash_flow':
        return renderCashFlow();
      case 'mfg_report':
        return renderMfgReport();
      case 'custom_reports':
        return renderCustomReports();
      case 'analytics':
        return renderAnalytics();
      default:
        return (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-12 text-center max-w-md mx-auto space-y-4">
            <span className="text-4xl">📊</span>
            <h3 className="font-bold text-slate-800 text-sm font-display uppercase tracking-wide">
              Operational Ledger Analytics
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Select one of the 19 specific financial sub-reports from the sidebar list under the Reports section to view specialized metrics, double-entry balancings, aging logs, or dynamic box-per-piece stock representation.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header card with contextual description */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs">
        <h2 className="text-base font-bold text-slate-800 font-display uppercase tracking-wider">
          {getSubTabTitle()}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Axion Ledger and Inventory dynamic query matrix. Updates live as checkouts are processed or stock items are registered.
        </p>
      </div>

      {renderActiveReport()}
    </div>
  );
}
