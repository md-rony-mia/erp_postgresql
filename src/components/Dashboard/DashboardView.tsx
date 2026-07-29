import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Invoice,
  Product,
  Customer,
  Supplier,
  BankAccount,
  LoanAccount,
  Employee,
  PurchaseOrder,
  Transaction,
  Attendance,
  Branch,
} from '../../types';
import {
  DateRangeType,
  calculateRevenueMetrics,
  calculateGrossProfitMargin,
  calculateInventoryTurnover,
  calculateCashPosition,
  calculateCustomerMetrics,
  getRevenueTrendData,
  getSalesByCategoryData,
  getARvsAPData,
  getInventoryHealthData,
  getAlertsData,
} from '../../lib/dashboardCalculations';
import { fetchExecutiveDashboardData, clearDashboardCache } from '../../lib/firestoreQueries';
import { isProductVisibleInBranch } from '../../lib/branchUtils';

import { KPICard } from './KPICard';
import { RevenueChart } from './RevenueChart';
import { SalesByCategory } from './SalesByCategory';
import { ARvsAPChart } from './ARvsAPChart';
import { InventoryHealth } from './InventoryHealth';
import { AlertsList } from './AlertsList';

import {
  DollarSign,
  TrendingUp,
  Boxes,
  Landmark,
  Users,
  RefreshCw,
  Printer,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  Filter,
} from 'lucide-react';

export interface MainDashboardViewProps {
  invoices?: Invoice[];
  products?: Product[];
  customers?: Customer[];
  suppliers?: Supplier[];
  bankAccounts?: BankAccount[];
  loanAccounts?: LoanAccount[];
  employees?: Employee[];
  purchaseOrders?: PurchaseOrder[];
  transactions?: Transaction[];
  attendances?: Attendance[];
  onTabChange: (tab: string, subTab?: string) => void;
  currentBranchId?: string;
  branches?: Branch[];
}

export const MainDashboardView: React.FC<MainDashboardViewProps> = ({
  invoices: propInvoices = [],
  products: propProducts = [],
  customers: propCustomers = [],
  suppliers: propSuppliers = [],
  bankAccounts: propBankAccounts = [],
  loanAccounts: propLoanAccounts = [],
  employees: propEmployees = [],
  purchaseOrders: propPurchaseOrders = [],
  transactions: propTransactions = [],
  attendances: propAttendances = [],
  onTabChange,
  currentBranchId = 'all',
  branches = [],
}) => {
  // Date range filter state
  const [dateRange, setDateRange] = useState<DateRangeType>('ytd');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  // Loading & error states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Firestore data override state (if fetched from remote)
  const [remoteData, setRemoteData] = useState<{
    invoices: Invoice[];
    products: Product[];
    customers: Customer[];
    suppliers: Supplier[];
    bankAccounts: BankAccount[];
    loanAccounts: LoanAccount[];
    employees: Employee[];
    purchaseOrders: PurchaseOrder[];
  } | null>(null);

  // Load from Firestore
  const loadFirestoreData = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setFetchError(null);
    try {
      if (forceRefresh) clearDashboardCache();
      const data = await fetchExecutiveDashboardData(forceRefresh);
      if (data) {
        setRemoteData({
          invoices: data.invoices,
          products: data.products,
          customers: data.customers,
          suppliers: data.suppliers,
          bankAccounts: data.bankAccounts,
          loanAccounts: data.loanAccounts,
          employees: data.employees,
          purchaseOrders: data.purchaseOrders,
        });
      }
    } catch (err: any) {
      console.warn('Unable to load executive data from Firestore, falling back to local state:', err);
      setFetchError(err.message || 'Firestore connection issue. Using active local cache.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFirestoreData();
  }, [loadFirestoreData]);

  // Combine state arrays (prioritize remote Firestore if available, otherwise use props)
  const rawInvoices = remoteData?.invoices?.length ? remoteData.invoices : propInvoices;
  const rawProducts = remoteData?.products?.length ? remoteData.products : propProducts;
  const rawCustomers = remoteData?.customers?.length ? remoteData.customers : propCustomers;
  const rawSuppliers = remoteData?.suppliers?.length ? remoteData.suppliers : propSuppliers;
  const rawBankAccounts = remoteData?.bankAccounts?.length ? remoteData.bankAccounts : propBankAccounts;
  const rawLoanAccounts = remoteData?.loanAccounts?.length ? remoteData.loanAccounts : propLoanAccounts;
  const rawEmployees = remoteData?.employees?.length ? remoteData.employees : propEmployees;
  const rawPurchaseOrders = remoteData?.purchaseOrders?.length ? remoteData.purchaseOrders : propPurchaseOrders;

  // Filter by active branch if single branch selected
  const invoices = useMemo(() => {
    if (!currentBranchId || currentBranchId === 'all') return rawInvoices;
    return rawInvoices.filter((inv) => inv.branchId === currentBranchId || (!inv.branchId && currentBranchId === 'main_hq'));
  }, [rawInvoices, currentBranchId]);

  const purchaseOrders = useMemo(() => {
    if (!currentBranchId || currentBranchId === 'all') return rawPurchaseOrders;
    return rawPurchaseOrders.filter((po) => po.branchId === currentBranchId || (!po.branchId && currentBranchId === 'main_hq'));
  }, [rawPurchaseOrders, currentBranchId]);

  const products = useMemo(() => {
    return rawProducts.filter((p) => isProductVisibleInBranch(p, currentBranchId, branches));
  }, [rawProducts, currentBranchId, branches]);
  const customers = rawCustomers;
  const suppliers = rawSuppliers;
  const bankAccounts = rawBankAccounts;
  const loanAccounts = rawLoanAccounts;
  const employees = rawEmployees;

  // Memoized KPI calculations
  const revenueMetrics = useMemo(
    () => calculateRevenueMetrics(invoices, dateRange),
    [invoices, dateRange]
  );

  const marginMetrics = useMemo(
    () => calculateGrossProfitMargin(invoices, products, dateRange),
    [invoices, products, dateRange]
  );

  const turnoverMetrics = useMemo(
    () => calculateInventoryTurnover(invoices, products),
    [invoices, products]
  );

  const cashMetrics = useMemo(
    () => calculateCashPosition(bankAccounts),
    [bankAccounts]
  );

  const customerMetrics = useMemo(
    () => calculateCustomerMetrics(customers, invoices),
    [customers, invoices]
  );

  // Chart data sets
  const revenueTrendData = useMemo(
    () => getRevenueTrendData(invoices, dateRange),
    [invoices, dateRange]
  );

  const salesByCategoryData = useMemo(
    () => getSalesByCategoryData(invoices, products),
    [invoices, products]
  );

  const arVsApData = useMemo(
    () => getARvsAPData(customers, suppliers, invoices),
    [customers, suppliers, invoices]
  );

  const inventoryHealthData = useMemo(
    () => getInventoryHealthData(products),
    [products]
  );

  const alertsData = useMemo(
    () => getAlertsData(products, customers, suppliers, loanAccounts, employees),
    [products, customers, suppliers, loanAccounts, employees]
  );

  // Print / Export PDF Handler
  const handlePrintDashboard = () => {
    window.print();
  };

  // Check if dataset is empty
  const isEmptyData = invoices.length === 0 && products.length === 0;

  return (
    <div className="space-y-8 animate-fade-up print:p-0 print:space-y-4">
      {/* Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <TrendingUp className="h-6 w-6" />
            </span>
            <h1 className="text-xl lg:text-2xl font-black text-white font-display tracking-tight uppercase">
              Executive Decision Dashboard
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Real-time financial KPI monitors, aging matrix, cash velocity & predictive intelligence
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-2xl p-1 text-xs">
            <Calendar className="h-4 w-4 text-slate-400 ml-2.5 mr-1" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRangeType)}
              className="bg-transparent text-slate-200 font-bold px-2 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="today" className="bg-slate-900 text-white">Today</option>
              <option value="this_week" className="bg-slate-900 text-white">This Week</option>
              <option value="this_month" className="bg-slate-900 text-white">This Month</option>
              <option value="ytd" className="bg-slate-900 text-white">Year-to-Date (YTD)</option>
              <option value="last_12_months" className="bg-slate-900 text-white">Last 12 Months</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => loadFirestoreData(true)}
            disabled={isLoading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-2xl border border-slate-700 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Refresh Data from Firestore"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Export / Print Button */}
          <button
            onClick={handlePrintDashboard}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* Error / Warning Banner */}
      {fetchError && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs text-amber-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
            <span>{fetchError}</span>
          </div>
          <button
            onClick={() => loadFirestoreData(true)}
            className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Empty Data Placeholder State */}
      {isEmptyData && !isLoading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
            <FileSpreadsheet className="h-8 w-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-slate-100">No Enterprise Records Available</h3>
            <p className="text-xs text-slate-400">
              Your Firestore database collections appear to be empty. Register invoices, products, or customers to populate real-time C-suite metrics.
            </p>
          </div>
          <button
            onClick={() => onTabChange('sales', 'invoices')}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl transition-all shadow-lg cursor-pointer"
          >
            Create First Invoice
          </button>
        </div>
      ) : (
        <>
          {/* TOP SECTION: 5 KEY METRICS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <KPICard
              title="Total Revenue"
              value={`৳${revenueMetrics.totalFilteredRevenue.toLocaleString()}`}
              subtitle={`YTD: ৳${revenueMetrics.totalRevenueYTD.toLocaleString()}`}
              changePercent={revenueMetrics.changePercent}
              icon={<DollarSign className="h-5 w-5" />}
              badgeColor="emerald"
              onClick={() => onTabChange('sales', 'invoices')}
              isLoading={isLoading}
            />

            <KPICard
              title="Gross Profit Margin"
              value={`${marginMetrics.marginPercent}%`}
              subtitle={`Profit: ৳${marginMetrics.grossProfit.toLocaleString()}`}
              changePercent={marginMetrics.changePercent}
              icon={<TrendingUp className="h-5 w-5" />}
              badgeColor="indigo"
              onClick={() => onTabChange('reports', 'profit_loss')}
              isLoading={isLoading}
            />

            <KPICard
              title="Inventory Turnover"
              value={`${turnoverMetrics.turnoverRatio}x`}
              subtitle={`Value: ৳${turnoverMetrics.totalInventoryValue.toLocaleString()}`}
              changePercent={turnoverMetrics.changePercent}
              icon={<Boxes className="h-5 w-5" />}
              badgeColor="amber"
              onClick={() => onTabChange('inventory', 'products')}
              isLoading={isLoading}
            />

            <KPICard
              title="Cash Position"
              value={`৳${cashMetrics.totalCash.toLocaleString()}`}
              subtitle={`${cashMetrics.liquidAccounts} Liquid Accounts`}
              changePercent={cashMetrics.changePercent}
              icon={<Landmark className="h-5 w-5" />}
              badgeColor="cyan"
              onClick={() => onTabChange('banking', 'bank_accounts')}
              isLoading={isLoading}
            />

            <KPICard
              title="Customer Count"
              value={customerMetrics.totalCustomers}
              subtitle={`${customerMetrics.activeCustomersCount} Active Buyers`}
              changePercent={customerMetrics.changePercent}
              icon={<Users className="h-5 w-5" />}
              badgeColor="emerald"
              onClick={() => onTabChange('sales', 'customers')}
              isLoading={isLoading}
            />
          </div>

          {/* BRANCH PERFORMANCE MATRIX */}
          {branches.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 font-display">
                    <span className="text-indigo-400">🏛️</span>
                    <span>শাখাভিত্তিক পারফরম্যান্স ও স্টক ওভারভিউ (Branch Performance Matrix)</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    ব্যবসায়ের প্রতিটি শাখার একক বিক্রয়, পারচেজ ও ইনভентরি মোড লাইভ স্ট্যাটাস
                  </p>
                </div>
                <button
                  onClick={() => onTabChange('settings', 'branches')}
                  className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 underline shrink-0 cursor-pointer"
                >
                  শাখা কনফিগারেশন দেখুন →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {branches.map((b) => {
                  const branchSales = rawInvoices
                    .filter((inv) => inv.branchId === b.id || (!inv.branchId && b.isMainBranch))
                    .reduce((sum, inv) => sum + inv.total, 0);

                  const branchPOs = rawPurchaseOrders
                    .filter((po) => po.branchId === b.id || (!po.branchId && b.isMainBranch))
                    .reduce((sum, po) => sum + po.total, 0);

                  return (
                    <div
                      key={b.id}
                      className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 space-y-3 relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{b.name}</span>
                            {b.isMainBranch && (
                              <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-[9px] font-bold">
                                Main
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">কোড: {b.branchCode}</span>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          b.stockMode === 'shared' ? 'bg-blue-500/20 text-blue-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {b.stockMode === 'shared' ? 'শেয়ার্ড স্টক' : ' পৃথক স্টক'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/60 text-xs font-semibold">
                        <div className="bg-slate-900/60 p-2.5 rounded-lg">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">মোট বিক্রি (Sales)</span>
                          <span className="text-sm font-bold text-emerald-400 mt-1 block">৳{branchSales.toLocaleString()}</span>
                        </div>
                        <div className="bg-slate-900/60 p-2.5 rounded-lg">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">মোট ক্রয় (Purchase)</span>
                          <span className="text-sm font-bold text-indigo-400 mt-1 block">৳{branchPOs.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MIDDLE SECTION: CHARTS & TRENDS (2x2 GRID) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueChart data={revenueTrendData} isLoading={isLoading} />
            <SalesByCategory data={salesByCategoryData} isLoading={isLoading} />
            <ARvsAPChart data={arVsApData} isLoading={isLoading} />
            <InventoryHealth data={inventoryHealthData} isLoading={isLoading} />
          </div>

          {/* BOTTOM SECTION: ALERTS & ACTIONABLE ITEMS */}
          <AlertsList alerts={alertsData} onNavigate={onTabChange} isLoading={isLoading} />
        </>
      )}
    </div>
  );
};
