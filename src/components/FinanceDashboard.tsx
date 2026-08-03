import { useState } from 'react';
import {
  Invoice,
  Product,
  Supplier,
  Customer,
  Transaction,
  BankAccount,
} from '../types';
import {
  Calendar,
  Download,
  ChevronDown,
  ArrowUpRight,
  TrendingUp,
  FileText,
  DollarSign,
  Briefcase,
  Layers,
  ArrowUpLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  HelpCircle,
  PiggyBank,
  PieChart as PieIcon,
  Calculator
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

interface FinanceDashboardProps {
  invoices: Invoice[];
  products: Product[];
  suppliers: Supplier[];
  customers: Customer[];
  transactions?: Transaction[];
  bankAccounts?: BankAccount[];
  onTabChange: (tab: string, subTab?: string) => void;
}

// Custom Colors matching the Dark ERP theme
const COLORS = {
  revenue: '#10b981',      // Emerald Green
  expense: '#f97316',      // Brand Orange
  sales: '#06b6d4',        // Teal Blue
  recurring: '#f59e0b',    // Amber Yellow
  serviceFees: '#8b5cf6',  // Purple
  paid: '#10b981',
  unpaid: '#f59e0b',
  categoryPalette: ['#f97316', '#a855f7', '#10b981', '#06b6d4', '#ec4899', '#f59e0b'],
};

export default function FinanceDashboard({
  invoices,
  products,
  suppliers,
  customers,
  transactions = [],
  bankAccounts = [],
  onTabChange
}: FinanceDashboardProps) {
  const [showExportSuccess, setShowExportSuccess] = useState(false);

  // ---- Real, derived-from-data calculations only (no hardcoded placeholder numbers) ----

  const productCostById = new Map(products.map(p => [p.id, p.cost]));

  const paidInvoices = invoices.filter(inv => inv.isPaid);
  const unpaidInvoices = invoices.filter(inv => !inv.isPaid);
  const totalInvoicedVal = invoices.reduce((sum, inv) => sum + inv.total, 0);

  const totalRevenueVal = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalExpensesVal = transactions
    .filter(t => t.type === 'Expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const pendingInvoicesCount = unpaidInvoices.length;
  const netProfitVal = totalRevenueVal - totalExpensesVal;
  // "Budget Utilization" had no real budget/target data anywhere in the system — replaced
  // with a real, genuinely useful metric: how much of what's been invoiced has actually
  // been collected in cash.
  const collectionRateVal = totalInvoicedVal > 0 ? Math.round((totalRevenueVal / totalInvoicedVal) * 100) : 0;

  const monthKey = (dateStr: string) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };
  const monthLabel = (key: string) => {
    const [y, m] = key.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short' });
  };

  // Real gross margin for an invoice: (price - product cost) x quantity, summed across
  // its line items, joined against real product cost data.
  const invoiceMargin = (inv: Invoice) => {
    return (inv.items || []).reduce((sum, item) => {
      const cost = productCostById.get(item.productId) ?? 0;
      return sum + (item.price - cost) * item.quantity;
    }, 0);
  };

  const revenueByMonth = new Map<string, number>();
  const marginByMonth = new Map<string, number>();
  for (const inv of paidInvoices) {
    const key = monthKey(inv.date);
    if (!key) continue;
    revenueByMonth.set(key, (revenueByMonth.get(key) || 0) + inv.total);
    marginByMonth.set(key, (marginByMonth.get(key) || 0) + invoiceMargin(inv));
  }
  const expenseByMonth = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== 'Expense') continue;
    const key = monthKey(t.date);
    if (!key) continue;
    expenseByMonth.set(key, (expenseByMonth.get(key) || 0) + t.amount);
  }

  const allMonthKeys = Array.from(new Set([...revenueByMonth.keys(), ...expenseByMonth.keys()])).sort().slice(-6);
  const revenueVsExpenseData = allMonthKeys.map(key => ({
    month: monthLabel(key),
    Revenue: revenueByMonth.get(key) || 0,
    Expense: expenseByMonth.get(key) || 0,
  }));

  const profitMarginVsSalesData = allMonthKeys.map(key => {
    const sales = revenueByMonth.get(key) || 0;
    const margin = marginByMonth.get(key) || 0;
    return { month: monthLabel(key), Sales: sales, Margin: sales > 0 ? Math.round((margin / sales) * 1000) / 10 : 0 };
  });

  // Revenue donut: real Paid vs Unpaid split of total invoiced amount (replaces a
  // previous "Sales / Recurring / Service Fees" breakdown — the app doesn't track
  // separate revenue streams like that anywhere).
  const unpaidTotal = unpaidInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const revenueDonutData = [
    { name: 'Paid', value: totalRevenueVal, color: COLORS.paid },
    { name: 'Unpaid', value: unpaidTotal, color: COLORS.unpaid },
  ].filter(d => d.value > 0);

  // Expenses donut: real breakdown by each transaction's actual category.
  const expenseByCategory = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== 'Expense') continue;
    expenseByCategory.set(t.category, (expenseByCategory.get(t.category) || 0) + t.amount);
  }
  const expensesDonutData = Array.from(expenseByCategory.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value], idx) => ({
      name,
      value,
      percentage: totalExpensesVal > 0 ? Math.round((value / totalExpensesVal) * 100) : 0,
      color: COLORS.categoryPalette[idx % COLORS.categoryPalette.length],
    }));

  const displayedRecentInvoices = invoices.slice(-6).reverse().map((inv) => ({
    id: inv.id,
    invoiceNo: inv.invoiceNo,
    customerName: inv.customerName,
    total: inv.total,
    status: inv.isPaid ? 'Paid' : 'Unpaid'
  }));

  // Recent Payments = real outgoing "Expense" transactions, most recent first. "Invoice
  // ID" and "Method" columns were dropped: Transaction doesn't reference an invoice or
  // record a payment method, so those can't be filled with real data.
  const bankNameById = new Map(bankAccounts.map(b => [b.id, `${b.bankName} - ${b.accountNumber}`]));
  const paymentsData = [...transactions]
    .filter(t => t.type === 'Expense')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8)
    .map(t => ({
      id: t.id,
      date: new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      category: t.category,
      desc: t.description,
      amount: t.amount,
      bank: bankNameById.get(t.accountId) || t.accountId || '—',
    }));

  const triggerExport = () => {
    setShowExportSuccess(true);
    setTimeout(() => {
      setShowExportSuccess(false);
    }, 3000);
  };

  return (
    <div className="p-8 rounded-[2rem] bg-[#0f111a] text-slate-100 border border-slate-900 shadow-2xl relative overflow-hidden font-sans space-y-8 animate-fade-up">
      {/* Decorative ambient background mesh blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-orange/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/60 pb-6 relative z-10">
        <div>
          <span className="text-[10px] text-brand-orange font-black tracking-widest uppercase block">Finance Ledger Analytics</span>
          <h1 className="font-display font-black text-2xl tracking-tight text-white mt-1">Finance Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">Enterprise financial positions, automated logs, and ledger margins</p>
        </div>

        {/* Action button cluster matching screenshot */}
        <div className="flex items-center gap-3 shrink-0">
          <button className="flex items-center gap-2 bg-[#161923] hover:bg-slate-800 text-xs text-slate-200 font-bold px-4 py-2.5 rounded-xl border border-slate-800/80 cursor-pointer shadow-sm transition-all">
            <Calendar className="h-4 w-4 text-brand-orange" />
            <span>01 Jan 26 to 20 Jan 26</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-500 ml-1" />
          </button>

          <button 
            onClick={triggerExport}
            className="flex items-center gap-2 bg-[#161923] hover:bg-slate-800 text-xs text-slate-200 font-bold px-4 py-2.5 rounded-xl border border-slate-800/80 cursor-pointer shadow-sm transition-all"
          >
            <Download className="h-4 w-4 text-brand-orange" />
            <span>Export</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-500 ml-1" />
          </button>
        </div>
      </div>

      {/* Alert toast for export success */}
      <AnimatePresence>
        {showExportSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-[#161923] border-2 border-emerald-500/50 text-white rounded-xl shadow-2xl p-4.5 flex items-center gap-3 text-xs font-bold font-sans"
          >
            <span className="p-1 rounded bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="h-4 w-4" />
            </span>
            <span>Financial Report prepared! Downloading Excel snapshot...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Row 1: Revenue vs Expense Chart & Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* Revenue vs Expense Chart */}
        <div className="lg:col-span-2 bg-[#161923] border border-slate-800/80 rounded-[1.75rem] p-6 shadow-lg flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-black font-display text-white tracking-wide uppercase">Revenue vs Expense</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Automated Monthly operating inflows vs outflows</p>
            </div>
            
            <div className="text-[11px] font-extrabold text-slate-500 font-mono">Last 6 Months</div>
          </div>

          <div className="h-72 w-full font-sans">
            {revenueVsExpenseData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[11px] text-slate-500 font-mono">কোনো ডাটা নেই</div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueVsExpenseData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222533" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#0b0c10] border border-slate-800 p-3 rounded-xl text-xs shadow-2xl">
                          <p className="font-extrabold text-slate-400 mb-1.5">{payload[0].payload.month}</p>
                          <div className="space-y-1 font-medium">
                            <p className="text-[#10b981]">Revenue: ${payload[0].value?.toLocaleString()}</p>
                            <p className="text-[#f97316]">Expense: ${payload[1].value?.toLocaleString()}</p>
                            <p className="text-white font-extrabold border-t border-slate-800/80 pt-1 mt-1">
                              Net: ${(payload[0].value as number - (payload[1].value as number))?.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="Revenue" fill={COLORS.revenue} radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="Expense" fill={COLORS.expense} radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>

          {/* Chart Custom Legend */}
          <div className="flex gap-4 justify-center items-center mt-4 border-t border-slate-800/30 pt-3 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#10b981]"></span>
              <span className="text-slate-300">Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#f97316]"></span>
              <span className="text-slate-300">Expense</span>
            </div>
          </div>
        </div>

        {/* Recent Invoices Card */}
        <div className="bg-[#161923] border border-slate-800/80 rounded-[1.75rem] p-6 shadow-lg flex flex-col justify-between">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-sm font-black font-display text-white tracking-wide uppercase">Recent Invoices</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Latest sales client registers</p>
            </div>
            <button 
              onClick={() => onTabChange('sales', 'invoices')}
              className="text-xs text-brand-orange hover:text-brand-orange-hover font-extrabold transition-colors flex items-center gap-0.5"
            >
              <span>View All</span>
              <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
            </button>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto max-h-[17.5rem] pr-1.5 custom-scrollbar font-sans">
            {displayedRecentInvoices.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs">
                কোনো ইনভয়েস পাওয়া যায়নি (No invoices found)
              </div>
            ) : (
              displayedRecentInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 bg-[#0f111a]/40 border border-slate-800/40 rounded-xl hover:bg-[#0f111a]/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-orange-500/10 text-brand-orange border border-orange-500/15">
                      <FileText className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-100 block">{inv.customerName}</span>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5">{inv.invoiceNo}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-slate-100 block">${inv.total.toLocaleString()}</span>
                    <span className={`inline-block px-2.5 py-0.5 text-[9px] font-black rounded-full border mt-1 ${
                      inv.status === 'Paid' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : inv.status === 'Overdue'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row 2: 5 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 relative z-10">
        {/* KPI 1: Total Revenue */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-[#161923] border border-slate-800/80 rounded-2xl p-5 shadow-md flex justify-between items-center group relative overflow-hidden"
        >
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-orange-500/2 blur-[40px] rounded-full pointer-events-none"></div>
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Total Revenue</span>
            <p className="text-2xl font-black font-display text-white mt-1.5">${totalRevenueVal.toLocaleString()}</p>
          </div>

          {/* Circle Chart Widget Icon on right */}
          <div className="h-11 w-11 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/15 shrink-0 ml-3">
            <svg className="w-7 h-7 transform -rotate-90" viewBox="0 0 36 36">
              <path className="text-slate-800" strokeWidth="2.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-brand-orange" strokeWidth="3" strokeDasharray="75, 100" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" />
            </svg>
          </div>
        </motion.div>

        {/* KPI 2: Total Expenses */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-[#161923] border border-slate-800/80 rounded-2xl p-5 shadow-md flex justify-between items-center group relative overflow-hidden"
        >
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-blue-500/2 blur-[40px] rounded-full pointer-events-none"></div>
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Total Expenses</span>
            <p className="text-2xl font-black font-display text-white mt-1.5">${totalExpensesVal.toLocaleString()}</p>
          </div>

          {/* Calculator Icon on right */}
          <div className="h-11 w-11 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/15 flex items-center justify-center shrink-0 ml-3">
            <Calculator className="h-5 w-5" />
          </div>
        </motion.div>

        {/* KPI 3: Pending Invoices */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-[#161923] border border-slate-800/80 rounded-2xl p-5 shadow-md flex justify-between items-center group relative overflow-hidden"
        >
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-pink-500/2 blur-[40px] rounded-full pointer-events-none"></div>
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Pending Invoices</span>
            <p className="text-2xl font-black font-display text-white mt-1.5">{pendingInvoicesCount}</p>
          </div>

          {/* Pink Document Icon on right */}
          <div className="h-11 w-11 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/15 flex items-center justify-center shrink-0 ml-3">
            <Briefcase className="h-5 w-5" />
          </div>
        </motion.div>

        {/* KPI 4: Collection Rate (replaces "Budget Utilization" — no budget/target data
             exists anywhere in the system; this is a real, computable metric instead) */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-[#161923] border border-slate-800/80 rounded-2xl p-5 shadow-md flex justify-between items-center group relative overflow-hidden"
        >
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-purple-500/2 blur-[40px] rounded-full pointer-events-none"></div>
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Collection Rate</span>
            <p className="text-2xl font-black font-display text-white mt-1.5">{collectionRateVal}%</p>
          </div>

          {/* Violet Bar Chart Icon on right */}
          <div className="h-11 w-11 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/15 flex items-center justify-center shrink-0 ml-3">
            <Layers className="h-5 w-5" />
          </div>
        </motion.div>

        {/* KPI 5: Net Profit / Loss */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-[#161923] border border-slate-800/80 rounded-2xl p-5 shadow-md flex justify-between items-center group relative overflow-hidden"
        >
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-500/2 blur-[40px] rounded-full pointer-events-none"></div>
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Net Profit / Loss</span>
            <p className="text-2xl font-black font-display text-[#10b981] mt-1.5">${netProfitVal.toLocaleString()}</p>
          </div>

          {/* Green Trending Up Arrow Icon on right */}
          <div className="h-11 w-11 rounded-full bg-emerald-500/10 text-[#10b981] border border-emerald-500/15 flex items-center justify-center shrink-0 ml-3">
            <TrendingUp className="h-5 w-5" />
          </div>
        </motion.div>
      </div>

      {/* Row 3: 3 Detailed Sub-Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* Sub-Chart 1: Revenue Collection Breakdown (real Paid vs Unpaid — replaces a
             previous fake "Sales / Recurring / Service Fees" split with no real backing) */}
        <div className="bg-[#161923] border border-slate-800/80 rounded-[1.75rem] p-6 shadow-lg flex flex-col justify-between">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-sm font-black font-display text-white tracking-wide uppercase">Revenue Collection</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Paid vs unpaid share of total invoiced amount</p>
            </div>
          </div>

          {/* Donut Chart with central achievement value */}
          <div className="h-52 w-full flex items-center justify-center relative font-sans">
            {revenueDonutData.length === 0 ? (
              <div className="text-[11px] text-slate-500 font-mono">কোনো ডাটা নেই</div>
            ) : (
            <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {revenueDonutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0b0c10', borderColor: '#334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '11px' }}
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Absolute Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-white font-display">{collectionRateVal}%</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Collected</span>
            </div>
            </>
            )}
          </div>

          {/* Segments custom legends at bottom */}
          <div className="flex gap-4 justify-center items-center mt-4 border-t border-slate-800/30 pt-3 text-[10px] font-bold">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#10b981]"></span>
              <span className="text-slate-400">Paid (${totalRevenueVal.toLocaleString()})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#f59e0b]"></span>
              <span className="text-slate-400">Unpaid (${unpaidTotal.toLocaleString()})</span>
            </div>
          </div>
        </div>

        {/* Sub-Chart 2: Profit Margin vs Sales */}
        <div className="bg-[#161923] border border-slate-800/80 rounded-[1.75rem] p-6 shadow-lg flex flex-col justify-between">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-sm font-black font-display text-white tracking-wide uppercase">Profit Margin vs Sales</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Operating yield percentages vs cash totals</p>
            </div>
            
            <div className="text-[11px] font-extrabold text-slate-500 font-mono">Last 6 Months</div>
          </div>

          <div className="h-52 w-full font-sans">
            {profitMarginVsSalesData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[11px] text-slate-500 font-mono">কোনো ডাটা নেই</div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={profitMarginVsSalesData.slice(-6)} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222533" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#0b0c10] border border-slate-800 p-3 rounded-xl text-xs shadow-2xl">
                          <p className="font-extrabold text-slate-400 mb-1">{payload[0].payload.month}</p>
                          <div className="space-y-1">
                            <p className="text-[#f97316]">Margin: {payload[0].value}%</p>
                            <p className="text-[#10b981]">Sales: ${payload[1].value?.toLocaleString()}</p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="Margin" stroke="#f97316" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="Sales" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
            )}
          </div>

          {/* Line Legend */}
          <div className="flex gap-4 justify-center items-center mt-4 border-t border-slate-800/30 pt-3 text-[10px] font-bold">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#f97316]"></span>
              <span className="text-slate-400">Profit Margin</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#10b981]"></span>
              <span className="text-slate-400">Sales</span>
            </div>
          </div>
        </div>

        {/* Sub-Chart 3: Expenses Breakdowns */}
        <div className="bg-[#161923] border border-slate-800/80 rounded-[1.75rem] p-6 shadow-lg flex flex-col justify-between">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-sm font-black font-display text-white tracking-wide uppercase">Expenses</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Operating overhead divisions</p>
            </div>
            
            <div className="text-[11px] font-extrabold text-slate-500 font-mono">All Time</div>
          </div>

          <div className="h-52 w-full flex items-center justify-center relative font-sans">
            {expensesDonutData.length === 0 ? (
              <div className="text-[11px] text-slate-500 font-mono">কোনো খরচ রেকর্ড নেই</div>
            ) : (
            <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expensesDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {expensesDonutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0b0c10', borderColor: '#334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '11px' }}
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Absolute Label — top real expense category */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-black text-white font-display">{expensesDonutData[0].percentage}%</span>
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{expensesDonutData[0].name}</span>
            </div>
            </>
            )}
          </div>

          {/* Grid display legends — real transaction categories */}
          {expensesDonutData.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-4 border-t border-slate-800/30 pt-3 text-[10px] font-bold text-center">
              {expensesDonutData.map((cat, idx) => (
                <div key={idx} className="p-1 rounded border flex flex-col items-center" style={{ backgroundColor: `${cat.color}0d`, borderColor: `${cat.color}20` }}>
                  <span style={{ color: cat.color }} className="truncate w-full">{cat.name}</span>
                  <span className="text-white mt-0.5">{cat.percentage}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 4: Recent Payments Table */}
      <div className="bg-[#161923] border border-slate-800/80 rounded-[1.75rem] p-6 shadow-lg relative z-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-sm font-black font-display text-white tracking-wide uppercase">Recent Payments</h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Most recent recorded expense transactions</p>
          </div>
          <button 
            onClick={() => onTabChange('accounting', 'journal_entries')}
            className="text-xs text-brand-orange hover:text-brand-orange-hover font-extrabold transition-colors flex items-center gap-0.5"
          >
            <span>View All</span>
            <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
          </button>
        </div>

        {/* Responsive Table Grid */}
        <div className="overflow-x-auto custom-scrollbar font-sans">
          <table className="w-full min-w-[1000px] border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80">
                <th className="bg-[#1e2335]/40 text-[#06b6d4] border border-slate-800/40 px-4.5 py-3 text-left text-[10px] font-black uppercase tracking-wider rounded-l-xl">Payment ID</th>
                <th className="bg-[#1e2335]/40 text-[#06b6d4] border border-slate-800/40 px-4.5 py-3 text-left text-[10px] font-black uppercase tracking-wider">Date</th>
                <th className="bg-[#1e2335]/40 text-[#06b6d4] border border-slate-800/40 px-4.5 py-3 text-left text-[10px] font-black uppercase tracking-wider">Category</th>
                <th className="bg-[#1e2335]/40 text-[#06b6d4] border border-slate-800/40 px-4.5 py-3 text-left text-[10px] font-black uppercase tracking-wider">Description</th>
                <th className="bg-[#1e2335]/40 text-[#06b6d4] border border-slate-800/40 px-4.5 py-3 text-left text-[10px] font-black uppercase tracking-wider">Amount</th>
                <th className="bg-[#1e2335]/40 text-[#06b6d4] border border-slate-800/40 px-4.5 py-3 text-left text-[10px] font-black uppercase tracking-wider rounded-r-xl">Bank & Account</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {paymentsData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                    কোনো পেমেন্ট বিবরণ পাওয়া যায়নি (No payment logs available)
                  </td>
                </tr>
              ) : (
                paymentsData.map((row) => (
                  <tr key={row.id} className="hover:bg-[#0f111a]/50 transition-colors">
                    <td className="px-4.5 py-3.5 text-xs font-mono font-bold text-slate-300">{row.id}</td>
                    <td className="px-4.5 py-3.5 text-xs text-slate-400 font-medium">{row.date}</td>
                    <td className="px-4.5 py-3.5 text-xs">
                      <span className="inline-block bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 font-bold px-2.5 py-1 rounded-md">
                        {row.category}
                      </span>
                    </td>
                    <td className="px-4.5 py-3.5 text-xs text-slate-300 font-medium">{row.desc}</td>
                    <td className="px-4.5 py-3.5 text-xs font-black text-emerald-400">${row.amount.toLocaleString()}</td>
                    <td className="px-4.5 py-3.5 text-xs font-mono font-bold text-[#3b82f6]">{row.bank}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
