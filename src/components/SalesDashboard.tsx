import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Download,
  ChevronDown,
  TrendingUp,
  FileText,
  DollarSign,
  ShoppingCart,
  UserPlus,
  Users,
  Smartphone,
  Laptop,
  Headphones,
  ShoppingBag,
  Cpu,
  ArrowUpRight,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Globe,
  Trash2,
  Check,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Invoice, Product, Customer } from '../types';

interface SalesDashboardProps {
  products: Product[];
  customers: Customer[];
  invoices: Invoice[];
  onTabChange: (tab: string, subTab?: string) => void;
}

// Custom high-contrast theme matching the screenshot
const COLORS = {
  obsidian: '#0a0b0d',
  cardBg: '#111318',
  cardBorder: '#1f242e',
  accentOrange: '#f97316',
  accentTeal: '#0ea5e9',
  accentPurple: '#a855f7',
  accentGreen: '#10b981',
  beigeMuted: '#d7d2c9',
  textLight: '#f3f4f6',
  textMuted: '#9ca3af',
};

export default function SalesDashboard({
  products,
  customers,
  invoices,
  onTabChange,
}: SalesDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'1D' | '7D' | '1M' | '1Y'>('1Y');
  const [selectedRegionYear, setSelectedRegionYear] = useState('2026');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [dateRange, setDateRange] = useState('01 Jan 26 to 20 Jan 26');

  // Helper for currency format
  const formatCurrency = (val: number) => {
    return '৳' + val.toLocaleString('bn-BD', { minimumFractionDigits: 0 });
  };

  // ----------------------------------------------------
  // DYNAMIC STATS DERIVATION WITH NO REPO FALLBACKS ON CLEAN
  // ----------------------------------------------------
  const dynamicRevenue = invoices
    .filter((inv) => inv.isPaid)
    .reduce((sum, inv) => sum + inv.total, 0);

  // Fallbacks matched to screenshot if data is empty
  const displayRevenue = dynamicRevenue > 0 ? (dynamicRevenue / 1000).toFixed(1) + 'K' : '0.0K';
  const displayOpenInvoices = invoices.filter((i) => !i.isPaid).length;
  const displayOpenOrders = invoices.filter((i) => !i.isPaid).length;
  const displayNewCustomers = customers.length;

  // ----------------------------------------------------
  // REVENUE TRENDS CHART DATA (MONTHLY)
  // ----------------------------------------------------
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyRevenueData = months.map((month, idx) => {
    const rev = invoices
      .filter((inv) => {
        const d = new Date(inv.date);
        return d.getMonth() === idx;
      })
      .reduce((sum, inv) => sum + inv.total, 0);
    return { month, Revenue: rev };
  });

  // ----------------------------------------------------
  // DYNAMIC TOP CUSTOMERS
  // ----------------------------------------------------
  const customerSpent: Record<string, number> = {};
  invoices.forEach((inv) => {
    customerSpent[inv.customerId] = (customerSpent[inv.customerId] || 0) + inv.total;
  });
  const topCustomers = [...customers]
    .map((cust) => ({
      name: cust.name,
      id: cust.id,
      spent: customerSpent[cust.id] || 0,
    }))
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5);

  const topSellingProducts = [...products]
    .map((prod) => {
      let salesCount = 0;
      invoices.forEach((inv) => {
        inv.items?.forEach((item) => {
          if (item.productId === prod.id) {
            salesCount += item.quantity;
          }
        });
      });
      return {
        name: prod.name,
        price: prod.price,
        stockStatus: prod.stock > 0 ? 'In Stock' : 'Out of Stock',
        salesCount,
        iconType: prod.category?.toLowerCase().includes('phone') ? 'phone' : prod.category?.toLowerCase().includes('laptop') ? 'laptop' : 'other'
      };
    })
    .sort((a, b) => b.salesCount - a.salesCount)
    .slice(0, 5);

  const recentTransactions = [...invoices]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map((inv) => ({
      name: inv.customerName,
      id: inv.invoiceNo,
      status: inv.isPaid ? 'Paid' : 'Pending',
      amount: inv.total,
      date: new Date(inv.date).toLocaleDateString('bn-BD', { day: '2-digit', month: 'short', year: 'numeric' }),
    }));

  const recentSalesActivity = [...invoices]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map((inv) => ({
      id: inv.invoiceNo,
      type: 'Invoice',
      customer: inv.customerName,
      amount: inv.total,
      date: new Date(inv.date).toLocaleDateString('bn-BD', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: inv.isPaid ? 'Paid' : 'Pending',
    }));

  // Generates a stable initials avatar (e.g. "Rahim Uddin" -> "RU") instead of a random
  // stock photo -- there's no real per-customer photo stored anywhere in the system.
  const initialsOf = (name: string) =>
    (name || '').trim().split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  // Helper for dynamic product icon render
  const renderProductIcon = (type: string) => {
    switch (type) {
      case 'phone':
        return <Smartphone className="h-4 w-4 text-sky-400" />;
      case 'laptop':
        return <Laptop className="h-4 w-4 text-emerald-400" />;
      case 'headphones':
        return <Headphones className="h-4 w-4 text-orange-400" />;
      case 'bag':
        return <ShoppingBag className="h-4 w-4 text-purple-400" />;
      default:
        return <Cpu className="h-4 w-4 text-rose-400" />;
    }
  };

  return (
    <div className="bg-[#0c0d12] text-[#f3f4f6] min-h-screen p-6 space-y-6 font-sans">
      {/* ----------------------------------------------------
          TOP HEADER: Title + Control Widgets
          ---------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800/60 pb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black font-display tracking-tight text-white flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-brand-orange animate-pulse" />
            বিক্রয় ড্যাশবোর্ড <span className="text-slate-500 font-normal font-sans text-lg">/ Sales Dashboard</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            রিয়েল-টাইম বিক্রয় ট্রেন্ডস, পারফরম্যান্স এবং অ্যাক্টিভিটি ট্র্যাকিং হাব
          </p>
        </div>

        {/* Header Right Action Items */}
        <div className="flex flex-wrap items-center gap-3">

          {/* Date Picker Button */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 bg-[#161922] border border-slate-800 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold hover:border-slate-700 transition-all cursor-pointer"
            >
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>{dateRange}</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>
            {showDatePicker && (
              <div className="absolute right-0 mt-2 w-64 bg-[#111318] border border-slate-800 rounded-xl p-3 z-50 shadow-2xl space-y-2">
                <p className="text-xs font-bold text-slate-400">তারিখ রেঞ্জ নির্বাচন করুন</p>
                <div className="space-y-1">
                  {['01 Jan 26 to 20 Jan 26', 'Last 7 Days', 'Last 30 Days', 'This Quarter', 'This Year'].map((range) => (
                    <button
                      key={range}
                      onClick={() => {
                        setDateRange(range);
                        setShowDatePicker(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded text-xs text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Export Button */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 bg-[#161922] border border-slate-800 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold hover:border-slate-700 transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-slate-400" />
              <span>Export</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-[#111318] border border-slate-800 rounded-xl p-1 z-50 shadow-2xl">
                <button
                  onClick={() => {
                    alert('Exporting sales report to PDF...');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Export as PDF
                </button>
                <button
                  onClick={() => {
                    alert('Exporting sales spreadsheet to Excel...');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Export to Excel (XLSX)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------
          ROW 1: Revenue Trends & Sales by Region
          ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card: Revenue Trends */}
        <div className="lg:col-span-8 bg-[#111318] border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-black font-display text-white">Revenue Trends</h2>
              <p className="text-xs text-slate-500">মাসিক আয় এবং লাভ বিবরণী</p>
            </div>
            {/* Filter Pills */}
            <div className="flex bg-[#1a1d26] p-1 rounded-lg border border-slate-800">
              {(['1D', '7D', '1M', '1Y'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPeriod(p)}
                  className={`px-3 py-1 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${
                    selectedPeriod === p ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Recharts Bar Chart */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenueData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                <XAxis
                  dataKey="month"
                  stroke="#475569"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="#475569"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val / 1000}K`}
                  dx={-5}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#1a1d26] border border-slate-800 p-3 rounded-lg shadow-xl">
                          <p className="text-[10px] text-slate-500 font-extrabold uppercase">
                            {payload[0].payload.month} Revenue
                          </p>
                          <p className="text-sm font-black text-white mt-1">
                            {formatCurrency(payload[0].value as number)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="Revenue" radius={[4, 4, 0, 0]}>
                  {monthlyRevenueData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.month === 'Jun' ? '#f97316' : '#d7d2c9'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Card: Sales by Region */}
        <div className="lg:col-span-4 bg-[#111318] border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-base font-black font-display text-white">Sales by Region</h2>
              <p className="text-xs text-slate-500">ভৌগোলিক বিক্রয় বিভাজন</p>
            </div>
            {/* Year Selector */}
            <select
              value={selectedRegionYear}
              onChange={(e) => setSelectedRegionYear(e.target.value)}
              className="bg-[#161922] border border-slate-800 text-slate-300 px-3 py-1 rounded-xl text-[10px] font-bold focus:outline-none cursor-pointer"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>

          {/* Simplified Gorgeous Styled Vector World Map SVG */}
          <div className="flex-1 flex items-center justify-center py-4 relative">
            <svg
              className="w-full h-32 text-slate-800"
              viewBox="0 0 1000 450"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* North America */}
              <path
                d="M100 80 Q140 100 200 120 T300 150 Q280 200 240 220 T150 180 Z"
                fill="#2c2d3c"
                className="hover:fill-purple-950 transition-colors"
              />
              {/* South America */}
              <path
                d="M250 250 Q280 300 320 380 T260 420 Q220 350 210 280 Z"
                fill="#242533"
                className="hover:fill-purple-950 transition-colors"
              />
              {/* Europe & Africa */}
              <path
                d="M450 80 Q520 70 580 120 T540 200 Q480 150 450 80 Z"
                fill="#2f3142"
                className="hover:fill-purple-950 transition-colors"
              />
              <path
                d="M480 220 Q560 210 610 260 T580 380 Q520 400 460 300 Z"
                fill="#22232e"
                className="hover:fill-purple-950 transition-colors"
              />
              {/* Asia */}
              <path
                d="M580 80 Q700 50 850 100 T800 280 Q700 250 580 220 Z"
                fill="#37394d"
                className="hover:fill-purple-950 transition-colors"
              />
              {/* Australia */}
              <path
                d="M780 320 Q840 330 880 380 T800 410 Q760 380 780 320 Z"
                fill="#282a39"
                className="hover:fill-purple-950 transition-colors"
              />

              {/* Glowing Landmark Dot in Dhaka (representing South Asia) */}
              <g className="animate-pulse">
                <circle cx="700" cy="160" r="12" fill="#a855f7" fillOpacity="0.3" />
                <circle cx="700" cy="160" r="6" fill="#c084fc" />
              </g>

              {/* Glowing Landmark Dot in US */}
              <g className="animate-pulse">
                <circle cx="200" cy="140" r="10" fill="#a855f7" fillOpacity="0.2" />
                <circle cx="200" cy="140" r="5" fill="#c084fc" />
              </g>

              {/* Glowing Landmark Dot in Europe */}
              <g className="animate-pulse">
                <circle cx="530" cy="110" r="10" fill="#a855f7" fillOpacity="0.2" />
                <circle cx="530" cy="110" r="5" fill="#c084fc" />
              </g>
            </svg>
          </div>

          {/* Bottom Custom Indicator */}
          <div className="bg-[#161922] border border-slate-800/80 rounded-xl p-3">
            <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1.5">
              <span className="text-[#0ea5e9]">৳{(dynamicRevenue).toLocaleString()} <span className="text-slate-500 font-medium">total revenue</span></span>
              <span className="text-slate-500">Goal: ৳5,00,000</span>
            </div>
            {/* Teal Progress Bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-[#0ea5e9] h-full rounded-full" style={{ width: `${Math.min(100, dynamicRevenue > 0 ? (dynamicRevenue / 500000) * 100 : 0)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------
          KPI METRIC CARDS ROW
          ---------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Revenue */}
        <div className="bg-[#111318] border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Revenue</p>
            <h3 className="text-2xl font-black font-display text-white mt-1">৳{displayRevenue}</h3>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-[#10b981]" />
          </div>
        </div>

        {/* KPI 2: Open Invoices */}
        <div className="bg-[#111318] border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Open Invoices</p>
            <h3 className="text-2xl font-black font-display text-white mt-1">{displayOpenInvoices}</h3>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#f97316]/10 border border-[#f97316]/20 flex items-center justify-center">
            <FileText className="h-5 w-5 text-[#f97316]" />
          </div>
        </div>

        {/* KPI 3: Open Orders */}
        <div className="bg-[#111318] border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Open Orders</p>
            <h3 className="text-2xl font-black font-display text-white mt-1">{displayOpenOrders}</h3>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 flex items-center justify-center">
            <ShoppingCart className="h-5 w-5 text-[#0ea5e9]" />
          </div>
        </div>

        {/* KPI 4: New Customers */}
        <div className="bg-[#111318] border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">New Customers</p>
            <h3 className="text-2xl font-black font-display text-white mt-1">{displayNewCustomers}</h3>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#a855f7]/10 border border-[#a855f7]/20 flex items-center justify-center">
            <UserPlus className="h-5 w-5 text-[#a855f7]" />
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------
          ROW 3: Top Customers, Top Selling Products, Recent Transactions
          ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Top Customers */}
        <div className="bg-[#111318] border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black font-display text-white">Top Customers</h2>
            <button
              onClick={() => onTabChange('sales', 'customers')}
              className="text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-4">
            {topCustomers.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                কোনো কাস্টমার ডেটা নেই (No customer data available)
              </div>
            ) : (
              topCustomers.map((cust, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px] font-black text-slate-300 shrink-0">
                      {initialsOf(cust.name)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{cust.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{cust.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-white font-mono">৳{cust.spent.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Spent</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card 2: Top Selling Products */}
        <div className="bg-[#111318] border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black font-display text-white">Top Selling Products</h2>
            <button
              onClick={() => onTabChange('inventory', 'products')}
              className="text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-4">
            {topSellingProducts.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                কোনো প্রোডাক্ট ডেটা নেই (No product data available)
              </div>
            ) : (
              topSellingProducts.map((prod, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-slate-800/80 border border-slate-700/50 rounded-xl flex items-center justify-center">
                      {renderProductIcon(prod.iconType)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{prod.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] text-slate-500 font-mono">৳{prod.price.toLocaleString()}</p>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ${
                            prod.stockStatus === 'In Stock'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {prod.stockStatus === 'In Stock' ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-white font-mono">{prod.salesCount.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Sales</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card 3: Recent Transactions */}
        <div className="bg-[#111318] border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black font-display text-white">Recent Transactions</h2>
            <button
              onClick={() => onTabChange('sales', 'invoices')}
              className="text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-4">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                কোনো লেনদেনের ডেটা নেই (No transactions available)
              </div>
            ) : (
              recentTransactions.map((tx, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px] font-black text-slate-300 shrink-0">
                      {initialsOf(tx.name)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{tx.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-[10px] text-slate-500 font-mono">{tx.id}</p>
                        <span
                          className={`text-[8px] px-1.5 py-0.2 rounded font-extrabold uppercase ${
                            tx.status === 'Paid'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : tx.status === 'Pending'
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-white font-mono">৳{tx.amount.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{tx.date}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------
          ROW 4: Recent Sales Activity Table
          ---------------------------------------------------- */}
      <div className="bg-[#111318] border border-slate-800/80 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-black font-display text-white">Recent Sales Activity</h2>
            <p className="text-xs text-slate-500">সাম্প্রতিক সমাপ্ত সেলস অর্ডার এবং কোটেশন বিবরণ</p>
          </div>
          <button
            onClick={() => onTabChange('sales', 'pos')}
            className="text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 font-bold">
                <th className="py-3 px-4 font-extrabold uppercase tracking-wider text-[10px]">ID</th>
                <th className="py-3 px-4 font-extrabold uppercase tracking-wider text-[10px]">Type</th>
                <th className="py-3 px-4 font-extrabold uppercase tracking-wider text-[10px]">Customer</th>
                <th className="py-3 px-4 font-extrabold uppercase tracking-wider text-[10px]">Amount</th>
                <th className="py-3 px-4 font-extrabold uppercase tracking-wider text-[10px]">Date</th>
                <th className="py-3 px-4 font-extrabold uppercase tracking-wider text-[10px]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {recentSalesActivity.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    কোনো অ্যাক্টিভিটি ডেটা নেই (No activity data available)
                  </td>
                </tr>
              ) : (
                recentSalesActivity.map((activity) => (
                  <tr key={activity.id} className="hover:bg-slate-800/10 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-slate-300">{activity.id}</td>
                    <td className="py-4 px-4 text-slate-400 font-medium">{activity.type}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-6 w-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] font-black text-slate-300 shrink-0">
                          {initialsOf(activity.customer)}
                        </div>
                        <span className="font-bold text-white">{activity.customer}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono font-black text-white">৳{activity.amount.toLocaleString()}</td>
                    <td className="py-4 px-4 text-slate-500 font-semibold">{activity.date}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`text-[9px] font-black tracking-wider uppercase px-2.5 py-1 rounded-md ${
                          activity.status === 'Paid'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : activity.status === 'Pending'
                            ? 'bg-amber-500/10 text-amber-400'
                            : activity.status === 'Issued'
                            ? 'bg-sky-500/10 text-sky-400'
                            : 'bg-purple-500/10 text-purple-400'
                        }`}
                      >
                        {activity.status}
                      </span>
                    </td>
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
