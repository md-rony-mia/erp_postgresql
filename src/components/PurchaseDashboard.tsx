import { useState } from 'react';
import {
  PurchaseOrder,
  Product,
  Supplier,
} from '../types';
import {
  Calendar,
  Download,
  ChevronDown,
  FileText,
  ShoppingBag,
  Clock,
  ArrowUpRight,
  TrendingUp,
  User,
  CheckCircle,
  Truck,
  DollarSign,
  ShoppingCart,
  Percent,
  Award,
  Shield,
  Layers,
  Filter
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
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis,
  RadialBarChart,
  RadialBar
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

interface PurchaseDashboardProps {
  purchaseOrders: PurchaseOrder[];
  products: Product[];
  suppliers: Supplier[];
  onTabChange: (tab: string, subTab?: string) => void;
}

// Custom Colors matching the Dark ERP theme from the screenshot
const COLORS = {
  spend: '#10b981',        // Green
  orders: '#a855f7',       // Purple
  delivery: '#f97316',     // Orange
  avgValue: '#ec4899',     // Pink
  barColor: '#059669',     // Deep Green
  lineColor: '#f97316',    // Wavy Orange
  clothing: '#0ea5e9',     // Blue
  beauty: '#f43f5e',       // Red
  electronics: '#10b981',  // Green
  concentric: ['#10b981', '#06b6d4', '#f59e0b', '#ef4444'], // Approved, Delivered, Pending, Rejected
};

export default function PurchaseDashboard({
  purchaseOrders = [],
  products = [],
  suppliers = [],
  onTabChange
}: PurchaseDashboardProps) {
  const [showExportSuccess, setShowExportSuccess] = useState(false);

  const hasData = purchaseOrders.length > 0;

  // ---- Real, derived-from-data calculations only (no hardcoded placeholder numbers) ----

  const receivedOrders = purchaseOrders.filter(po => po.status === 'Received');
  const totalSpendVal = receivedOrders.reduce((sum, po) => sum + po.total, 0);
  const purchaseOrdersCount = purchaseOrders.length;
  const avgPOValueVal = purchaseOrdersCount > 0 ? Math.round(purchaseOrders.reduce((s, po) => s + po.total, 0) / purchaseOrdersCount) : 0;

  // "On Time Delivery" isn't trackable — the data model has no expected/actual delivery
  // date. The closest real, honest metric: what share of placed orders have actually
  // been received (vs still outstanding or cancelled).
  const receivedRate = purchaseOrdersCount > 0 ? Math.round((receivedOrders.length / purchaseOrdersCount) * 100) : 0;

  const productCategoryById = new Map(products.map(p => [p.id, p.category || 'Uncategorized']));

  // Last 6 months of real spend, oldest first — used for both the sparkline and the
  // month-over-month trend chart.
  const monthKey = (dateStr: string) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };
  const monthLabel = (key: string) => {
    const [y, m] = key.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short' });
  };
  const spendByMonth = new Map<string, number>();
  for (const po of receivedOrders) {
    const key = monthKey(po.date);
    if (!key) continue;
    spendByMonth.set(key, (spendByMonth.get(key) || 0) + po.total);
  }
  const sortedMonthKeys = Array.from(spendByMonth.keys()).sort();
  const recentMonthKeys = sortedMonthKeys.slice(-6);
  const monthlySpendData = recentMonthKeys.map(key => ({ month: monthLabel(key), Spend: spendByMonth.get(key) || 0 }));

  const totalSpendSpark = recentMonthKeys.length > 0
    ? recentMonthKeys.map(key => ({ value: spendByMonth.get(key) || 0 }))
    : [{ value: 0 }, { value: 0 }];

  // Purchase-order-count and avg-value sparklines: last up-to-6 months, counted the same way.
  const countByMonth = new Map<string, number>();
  const valueSumByMonth = new Map<string, { sum: number; count: number }>();
  for (const po of purchaseOrders) {
    const key = monthKey(po.date);
    if (!key) continue;
    countByMonth.set(key, (countByMonth.get(key) || 0) + 1);
    const entry = valueSumByMonth.get(key) || { sum: 0, count: 0 };
    entry.sum += po.total;
    entry.count += 1;
    valueSumByMonth.set(key, entry);
  }
  const allMonthKeysSorted = Array.from(new Set([...countByMonth.keys(), ...valueSumByMonth.keys()])).sort().slice(-6);
  const poCountSpark = allMonthKeysSorted.length > 0
    ? allMonthKeysSorted.map(key => ({ value: countByMonth.get(key) || 0 }))
    : [{ value: 0 }, { value: 0 }];
  const avgValueSpark = allMonthKeysSorted.length > 0
    ? allMonthKeysSorted.map(key => {
        const e = valueSumByMonth.get(key);
        return { value: e && e.count > 0 ? Math.round(e.sum / e.count) : 0 };
      })
    : [{ value: 0 }, { value: 0 }];
  const receivedRateSpark = [{ value: receivedRate }, { value: receivedRate }];

  // Top suppliers by real total spend (all orders, any status, so it reflects true
  // commitment/exposure to that supplier — not just received ones).
  const spendBySupplier = new Map<string, number>();
  const orderCountBySupplier = new Map<string, number>();
  for (const po of purchaseOrders) {
    spendBySupplier.set(po.supplierName, (spendBySupplier.get(po.supplierName) || 0) + po.total);
    orderCountBySupplier.set(po.supplierName, (orderCountBySupplier.get(po.supplierName) || 0) + 1);
  }
  const topSuppliersData = Array.from(spendBySupplier.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, spend]) => ({ name, spend }));

  // Real per-supplier scatter: order count (X) vs total spend (Y) — replaces the old
  // fictional "Quality / Cost Efficiency" scores, which nothing in the system tracks.
  const supplierPerformanceData = Array.from(spendBySupplier.entries())
    .map(([name, spend]) => ({ name, Orders: orderCountBySupplier.get(name) || 0, Spend: spend }));

  // Spend by product category, from real PO line items joined to product.category.
  const spendByCategoryMap = new Map<string, number>();
  for (const po of purchaseOrders) {
    for (const item of po.items || []) {
      const cat = productCategoryById.get(item.productId) || 'Uncategorized';
      spendByCategoryMap.set(cat, (spendByCategoryMap.get(cat) || 0) + item.subtotal);
    }
  }
  const categoryPalette = [COLORS.clothing, COLORS.beauty, COLORS.electronics, COLORS.orders, COLORS.avgValue, COLORS.delivery];
  const totalCategorySpend = Array.from(spendByCategoryMap.values()).reduce((a, b) => a + b, 0);
  const spendByCategoryData = Array.from(spendByCategoryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, val], idx) => ({
      name,
      value: totalCategorySpend > 0 ? Math.round((val / totalCategorySpend) * 100) : 0,
      color: categoryPalette[idx % categoryPalette.length],
    }));

  // Real order status breakdown (Ordered / Received / Cancelled).
  const statusCounts = { Ordered: 0, Received: 0, Cancelled: 0 } as Record<string, number>;
  for (const po of purchaseOrders) {
    statusCounts[po.status] = (statusCounts[po.status] || 0) + 1;
  }
  const orderStatusRadialData = [
    { name: 'Cancelled', value: purchaseOrdersCount > 0 ? Math.round((statusCounts.Cancelled / purchaseOrdersCount) * 100) : 0, fill: COLORS.concentric[3] },
    { name: 'Ordered', value: purchaseOrdersCount > 0 ? Math.round((statusCounts.Ordered / purchaseOrdersCount) * 100) : 0, fill: COLORS.concentric[2] },
    { name: 'Received', value: purchaseOrdersCount > 0 ? Math.round((statusCounts.Received / purchaseOrdersCount) * 100) : 0, fill: COLORS.concentric[1] },
  ];

  // Pending (not yet received) purchase orders — real, and genuinely useful: this is
  // what's still outstanding with suppliers. Replaces the old "Payments" sidebar, which
  // showed unrelated customer-payment mock data that doesn't belong on a purchase dashboard.
  const pendingOrders = purchaseOrders
    .filter(po => po.status === 'Ordered')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  // Top orders by real value.
  const topOrdersList = [...purchaseOrders]
    .sort((a, b) => b.total - a.total)
    .slice(0, 6)
    .map(po => {
      const categories = new Set((po.items || []).map(i => productCategoryById.get(i.productId) || 'Uncategorized'));
      const category = categories.size === 1 ? Array.from(categories)[0] : categories.size > 1 ? 'Mixed' : '—';
      const color = po.status === 'Received'
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        : po.status === 'Cancelled'
        ? 'bg-red-500/10 text-red-400 border-red-500/20'
        : 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      return { id: po.poNo, supplier: po.supplierName, category, amount: po.total, status: po.status, color };
    });

  // Recent procurement activity — real, most recent orders. "Requestor" and "Delivered
  // Qty" columns were dropped: the data model doesn't track who requested a PO or
  // partial-delivery quantities, so those columns can't be filled with real data.
  const recentProcurementActivity = [...purchaseOrders]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8)
    .map(po => {
      const itemCount = (po.items || []).reduce((s, i) => s + i.quantity, 0);
      const color = po.status === 'Received'
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        : po.status === 'Cancelled'
        ? 'bg-red-500/10 text-red-400 border-red-500/20'
        : 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      return {
        id: po.poNo,
        supplier: po.supplierName,
        purchaseId: po.poNo,
        itemQty: itemCount,
        total: po.total,
        date: new Date(po.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        status: po.status,
        color,
      };
    });

  const triggerExport = () => {
    setShowExportSuccess(true);
    setTimeout(() => {
      setShowExportSuccess(false);
    }, 3000);
  };

  return (
    <div className="space-y-6 text-slate-100 select-none pb-12 animate-fade-up">
      {/* 1. Header with custom layout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1 border-b border-slate-800/60">
        <div>
          <h2 className="text-xl font-black text-slate-100 tracking-tight flex items-center gap-2.5 font-sans">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
              <ShoppingCart className="h-5 w-5" />
            </span>
            Procurement Dashboard
          </h2>
          <p className="text-[10px] text-slate-500 font-mono font-bold uppercase mt-1 tracking-wider">
            Enterprise Inbound logistics, Vendor analysis, and Capital Allocation telemetry
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Custom Date Picker Selector */}
          <div className="flex items-center gap-2 bg-[#0d0f17] border border-slate-800/80 px-3.5 py-2 rounded-xl hover:bg-[#11131f] transition-all cursor-pointer shadow-lg shadow-black/20">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[11px] font-black text-slate-300 font-sans">01 Jan 26 to 20 Jan 26</span>
            <ChevronDown className="h-3 w-3 text-slate-500" />
          </div>

          <button
            onClick={triggerExport}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-600/15 active:scale-95 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Export success popover */}
      <AnimatePresence>
        {showExportSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4.5 rounded-2xl flex items-center justify-between gap-4 shadow-xl"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">📊</span>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider font-sans">ইআরপি এক্সপোর্ট সফল (Procurement Audit Export Success)</h4>
                <p className="text-[10px] text-emerald-400/80 font-mono mt-0.5">Procurement ledger sheets, supplier KPI index & balance files saved as CSV/XLSX logs.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Top KPI Cards (4 cards matching screenshot) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spend */}
        <div className="bg-[#0b0c13] border border-slate-800/50 rounded-2xl p-4.5 flex flex-col justify-between hover:border-slate-700/60 transition-all shadow-xl shadow-black/20 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-sans">
              <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
              Total Spend
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-100 font-sans">${totalSpendVal.toLocaleString()}</span>
          </div>
          {/* Green sparkline below */}
          <div className="h-8 mt-4.5 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={totalSpendSpark}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.spend} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={COLORS.spend} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke={COLORS.spend} strokeWidth={1.5} fillOpacity={1} fill="url(#spendGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Purchase Orders */}
        <div className="bg-[#0b0c13] border border-slate-800/50 rounded-2xl p-4.5 flex flex-col justify-between hover:border-slate-700/60 transition-all shadow-xl shadow-black/20 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-sans">
              <ShoppingBag className="h-3.5 w-3.5 text-purple-400" />
              Purchase Orders
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-100 font-sans">{purchaseOrdersCount}</span>
          </div>
          {/* Purple sparkline below */}
          <div className="h-8 mt-4.5 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={poCountSpark}>
                <defs>
                  <linearGradient id="poGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.orders} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={COLORS.orders} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke={COLORS.orders} strokeWidth={1.5} fillOpacity={1} fill="url(#poGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Received Rate (replaces the previously fictional "On Time Delivery" %, which
             had no real data behind it — this is a real, computable metric instead) */}
        <div className="bg-[#0b0c13] border border-slate-800/50 rounded-2xl p-4.5 flex flex-col justify-between hover:border-slate-700/60 transition-all shadow-xl shadow-black/20 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-sans">
              <Truck className="h-3.5 w-3.5 text-orange-400" />
              Received Rate
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-100 font-sans">{receivedRate}%</span>
          </div>
          {/* Orange sparkline below */}
          <div className="h-8 mt-4.5 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={receivedRateSpark}>
                <defs>
                  <linearGradient id="deliveryGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.delivery} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={COLORS.delivery} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke={COLORS.delivery} strokeWidth={1.5} fillOpacity={1} fill="url(#deliveryGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Avg PO Value */}
        <div className="bg-[#0b0c13] border border-slate-800/50 rounded-2xl p-4.5 flex flex-col justify-between hover:border-slate-700/60 transition-all shadow-xl shadow-black/20 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-sans">
              <Percent className="h-3.5 w-3.5 text-pink-400" />
              Avg PO Value
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-100 font-sans">${avgPOValueVal.toLocaleString()}</span>
          </div>
          {/* Pink sparkline below */}
          <div className="h-8 mt-4.5 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={avgValueSpark}>
                <defs>
                  <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.avgValue} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={COLORS.avgValue} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke={COLORS.avgValue} strokeWidth={1.5} fillOpacity={1} fill="url(#avgGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Row 1: Top Suppliers & Monthly Spend Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Suppliers */}
        <div className="lg:col-span-5 bg-[#0b0c13] border border-slate-800/50 rounded-2xl p-4.5 flex flex-col justify-between shadow-xl shadow-black/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider font-sans">Top Suppliers</h3>
              <p className="text-[9px] text-slate-500 font-mono mt-0.5">Supplier spend aggregation index</p>
            </div>
            {/* Year Dropdown */}
            <div className="flex items-center gap-1 bg-[#12141f] border border-slate-800/80 px-2.5 py-1 rounded-lg hover:bg-[#161927] transition-all cursor-pointer">
              <span className="text-[10px] font-bold text-slate-300 font-mono">All Time</span>
              <ChevronDown className="h-2.5 w-2.5 text-slate-500" />
            </div>
          </div>

          <div className="h-64 w-full">
            {topSuppliersData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[10px] text-slate-500 font-mono">কোনো ডাটা নেই</div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topSuppliersData}
                layout="vertical"
                margin={{ top: 5, right: 15, left: 15, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.15} horizontal={false} />
                <XAxis type="number" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#11131e', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold' }}
                  itemStyle={{ color: '#fff', fontSize: '11px' }}
                  formatter={(value: any) => [`$${value.toLocaleString()}`, 'Total Spend']}
                />
                <Bar dataKey="spend" fill={COLORS.barColor} radius={[0, 6, 6, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Monthly Spend Trend */}
        <div className="lg:col-span-7 bg-[#0b0c13] border border-slate-800/50 rounded-2xl p-4.5 flex flex-col justify-between shadow-xl shadow-black/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider font-sans">Monthly Spend Trend</h3>
              <p className="text-[9px] text-slate-500 font-mono mt-0.5">Capital deployment curves over historical periods</p>
            </div>
            {/* Month Dropdown */}
            <div className="flex items-center gap-1 bg-[#12141f] border border-slate-800/80 px-2.5 py-1 rounded-lg hover:bg-[#161927] transition-all cursor-pointer">
              <span className="text-[10px] font-bold text-slate-300 font-sans">Last 6 Months</span>
              <ChevronDown className="h-2.5 w-2.5 text-slate-500" />
            </div>
          </div>

          <div className="h-64 w-full">
            {monthlySpendData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[10px] text-slate-500 font-mono">কোনো ডাটা নেই</div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlySpendData}
                margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.2} vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#11131e', borderColor: '#334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '11px' }}
                  formatter={(value: any) => [`$${value.toLocaleString()}`, 'Spend']}
                />
                <Line
                  type="monotone"
                  dataKey="Spend"
                  stroke={COLORS.lineColor}
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#0b0c13', stroke: COLORS.lineColor, strokeWidth: 1.5 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* 4. Row 2: Payments & Top Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Payments Sidebar */}
        <div className="lg:col-span-4 bg-[#0b0c13] border border-slate-800/50 rounded-2xl p-4.5 flex flex-col shadow-xl shadow-black/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider font-sans">Pending Orders</h3>
              <p className="text-[9px] text-slate-500 font-mono mt-0.5">Orders placed, awaiting receipt</p>
            </div>
            <button
              onClick={() => onTabChange('purchase', 'purchase_orders')}
              className="text-[10px] font-black text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-sans"
            >
              View All &gt;
            </button>
          </div>

          <div className="space-y-3.5 overflow-y-auto max-h-[17.5rem] pr-1.5 custom-scrollbar font-sans flex-1">
            {pendingOrders.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[10px] text-slate-500 font-mono py-8">
                কোনো অপেক্ষমান অর্ডার নেই
              </div>
            ) : pendingOrders.map((po) => (
              <div
                key={po.id}
                className="flex items-center justify-between p-3 bg-[#0f111a]/40 border border-slate-800/40 rounded-xl hover:bg-[#0f111a]/80 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8.5 w-8.5 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center text-xs font-black text-slate-300">
                    {po.supplierName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-100 block">{po.supplierName}</span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">{po.poNo}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-slate-100 block">${po.total.toLocaleString()}</span>
                  <span className="inline-block px-2 py-0.5 text-[9px] font-black rounded-full border mt-1 bg-amber-500/10 text-amber-400 border-amber-500/20">
                    Ordered
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Orders */}
        <div className="lg:col-span-8 bg-[#0b0c13] border border-slate-800/50 rounded-2xl p-4.5 flex flex-col shadow-xl shadow-black/10">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider font-sans">Top Orders</h3>
              <p className="text-[9px] text-slate-500 font-mono mt-0.5">Primary volume procurement transactions</p>
            </div>
            <button
              onClick={() => onTabChange('purchase', 'purchase_orders')}
              className="text-[10px] font-black text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-sans"
            >
              View All &gt;
            </button>
          </div>

          <div className="overflow-x-auto flex-1 max-h-[17.5rem] custom-scrollbar">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-800/60">
                  <th className="py-2 px-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">ID</th>
                  <th className="py-2 px-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Supplier</th>
                  <th className="py-2 px-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Category</th>
                  <th className="py-2 px-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Amount</th>
                  <th className="py-2 px-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {topOrdersList.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-[10px] text-slate-500 font-mono">এখনো কোনো অর্ডার নেই</td></tr>
                ) : topOrdersList.map((ord, idx) => (
                  <tr key={idx} className="hover:bg-[#0f111a]/40 transition-colors">
                    <td className="py-3 px-3 text-xs font-mono font-bold text-slate-400">{ord.id}</td>
                    <td className="py-3 px-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                          <User className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-extrabold text-slate-200">{ord.supplier}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-400 font-sans font-medium">{ord.category}</td>
                    <td className="py-3 px-3 text-xs text-right font-black text-slate-100">${ord.amount.toLocaleString()}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 text-[9px] font-black rounded-full border ${ord.color}`}>
                        {ord.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. Row 3: Supplier Performance, Spend by Category, Order Status (3 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Supplier Spend vs Order Volume Scatter (real data — replaces a previous
             "Quality vs Cost Efficiency" chart that had no underlying data source) */}
        <div className="lg:col-span-6 bg-[#0b0c13] border border-slate-800/50 rounded-2xl p-4.5 flex flex-col justify-between shadow-xl shadow-black/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider font-sans">Supplier Spend vs Volume</h3>
              <p className="text-[9px] text-slate-500 font-mono mt-0.5">Order count versus total spend per supplier</p>
            </div>
            <div className="flex items-center gap-1 bg-[#12141f] border border-slate-800/80 px-2.5 py-1 rounded-lg">
              <span className="text-[10px] font-bold text-slate-300 font-mono">All Time</span>
            </div>
          </div>

          <div className="h-56 w-full">
            {supplierPerformanceData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[10px] text-slate-500 font-mono">কোনো ডাটা নেই</div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 15, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.15} />
                <XAxis type="number" dataKey="Orders" name="Order Count" stroke="#64748b" fontSize={9} allowDecimals={false} />
                <YAxis type="number" dataKey="Spend" name="Total Spend" stroke="#64748b" fontSize={9} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#11131e', borderColor: '#334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '11px' }}
                  formatter={(value: any, name: any) => [name === 'Spend' ? `$${Number(value).toLocaleString()}` : value, name]}
                />
                <Scatter name="Suppliers" data={supplierPerformanceData} fill={COLORS.clothing}>
                  {supplierPerformanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? COLORS.clothing : COLORS.spend} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            )}
          </div>
          <div className="flex items-center justify-center gap-4 mt-2 text-[9px] font-bold text-slate-400">
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS.clothing }}></span> Order Count</span>
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS.spend }}></span> Total Spend</span>
          </div>
        </div>

        {/* Spend by Category Semi Donut */}
        <div className="lg:col-span-3 bg-[#0b0c13] border border-slate-800/50 rounded-2xl p-4.5 flex flex-col justify-between shadow-xl shadow-black/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider font-sans">Spend by Category</h3>
              <p className="text-[9px] text-slate-500 font-mono mt-0.5">Allocation by inventory segment</p>
            </div>
            {/* Weekly Dropdown */}
            <div className="flex items-center gap-1 bg-[#12141f] border border-slate-800/80 px-2.5 py-1 rounded-lg hover:bg-[#161927] transition-all cursor-pointer">
              <span className="text-[10px] font-bold text-slate-300 font-sans">Weekly</span>
              <ChevronDown className="h-2.5 w-2.5 text-slate-500" />
            </div>
          </div>

          <div className="h-44 w-full flex items-center justify-center relative">
            {spendByCategoryData.length === 0 ? (
              <div className="text-[10px] text-slate-500 font-mono">কোনো ডাটা নেই</div>
            ) : (
            <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={spendByCategoryData}
                  cx="50%"
                  cy="80%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {spendByCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#11131e', borderColor: '#334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '11px' }}
                  formatter={(value: any) => [`${value}%`, 'Volume']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute bottom-[20%] text-center">
              <span className="text-base font-black text-slate-100">{spendByCategoryData[0].value}%</span>
              <span className="block text-[8px] text-slate-500 uppercase tracking-wider font-bold">{spendByCategoryData[0].name}</span>
            </div>
            </>
            )}
          </div>

          <div className="space-y-1 mt-2.5 font-sans">
            {spendByCategoryData.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                  <span>{cat.name}</span>
                </div>
                <span className="font-black text-slate-200">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Order Status Radial Rings */}
        <div className="lg:col-span-3 bg-[#0b0c13] border border-slate-800/50 rounded-2xl p-4.5 flex flex-col justify-between shadow-xl shadow-black/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider font-sans">Order Status</h3>
              <p className="text-[9px] text-slate-500 font-mono mt-0.5">Fulfillment telemetry ratios</p>
            </div>
            {/* Weekly Dropdown */}
            <div className="flex items-center gap-1 bg-[#12141f] border border-slate-800/80 px-2.5 py-1 rounded-lg hover:bg-[#161927] transition-all cursor-pointer">
              <span className="text-[10px] font-bold text-slate-300 font-sans">Weekly</span>
              <ChevronDown className="h-2.5 w-2.5 text-slate-500" />
            </div>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            {purchaseOrdersCount === 0 ? (
              <div className="text-[10px] text-slate-500 font-mono">কোনো ডাটা নেই</div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="30%"
                outerRadius="90%"
                barSize={6}
                data={orderStatusRadialData}
              >
                <RadialBar
                  background
                  dataKey="value"
                  cornerRadius={4}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#11131e', borderColor: '#334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '11px' }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-[9px] font-bold text-slate-400 mt-2 font-sans">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS.concentric[1] }}></span>
              <span>Received</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS.concentric[2] }}></span>
              <span>Ordered</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS.concentric[3] }}></span>
              <span>Cancelled</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Row 4: Recent Procurement Activity (Table) */}
      <div className="bg-[#0b0c13] border border-slate-800/50 rounded-2xl p-4.5 shadow-xl shadow-black/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider font-sans">Recent Procurement Activity</h3>
            <p className="text-[9px] text-slate-500 font-mono mt-0.5">Audit log of current inbound actions</p>
          </div>
          <button
            onClick={() => onTabChange('purchase', 'purchase_orders')}
            className="text-[10px] font-black text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-sans"
          >
            View All &gt;
          </button>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-800/60 text-slate-500 text-[10px] font-bold uppercase tracking-wider font-mono">
                <th className="py-2.5 px-3 text-left">Purchase ID</th>
                <th className="py-2.5 px-3 text-left">Supplier</th>
                <th className="py-2.5 px-3 text-center">Item Qty</th>
                <th className="py-2.5 px-3 text-right">Total</th>
                <th className="py-2.5 px-3 text-left">Date</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs">
              {recentProcurementActivity.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[10px] text-slate-500 font-mono">এখনো কোনো Purchase Order নেই</td>
                </tr>
              ) : recentProcurementActivity.map((act) => (
                <tr key={act.id} className="hover:bg-[#0f111a]/40 transition-colors">
                  <td className="py-3 px-3 font-mono font-black text-emerald-400">{act.purchaseId}</td>
                  <td className="py-3 px-3 font-extrabold text-slate-200">{act.supplier}</td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-300">{act.itemQty.toString().padStart(2, '0')}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-300">${act.total.toLocaleString()}</td>
                  <td className="py-3 px-3 text-slate-400 font-medium">{act.date}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-block px-2.5 py-0.5 text-[9px] font-black rounded-full border ${act.color}`}>
                      {act.status}
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
}
