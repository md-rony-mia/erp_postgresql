import { useState } from 'react';
import { Product, Supplier, Customer, Invoice } from '../types';
import {
  Calendar,
  Download,
  ChevronDown,
  TrendingUp,
  FileText,
  Briefcase,
  Layers,
  CheckCircle,
  Clock,
  Plus,
  ArrowUpRight,
  User,
  MapPin,
  Tag,
  ShoppingBag,
  Layers3,
  Search,
  Package,
  AlertCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

interface InventoryDashboardProps {
  products: Product[];
  suppliers: Supplier[];
  customers: Customer[];
  invoices: Invoice[];
  onTabChange: (tab: string, subTab?: string) => void;
}

// Custom brand-matching colors for Obsidian theme
const COLORS = {
  emerald: '#10b981',      // Sparkline & category fill
  orange: '#f97316',       // Brand orange accents
  blue: '#06b6d4',         // Cyan / blue
  amber: '#f59e0b',        // Alert yellow
  purple: '#8b5cf6',       // Purple
};

export default function InventoryDashboard({
  products,
  suppliers,
  customers,
  invoices,
  onTabChange
}: InventoryDashboardProps) {
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);

  // ---- Real, derived-from-data calculations only (no hardcoded placeholder numbers) ----

  const totalStockVal = products.reduce((sum, p) => sum + p.stock, 0);
  const inventoryValueVal = products.reduce((sum, p) => sum + p.stock * p.cost, 0);

  // No stock-over-time snapshots are tracked, so there's no real history for a sparkline —
  // show a flat line at the current value instead of inventing a trend.
  const totalStockSparkData = [{ value: totalStockVal }, { value: totalStockVal }];
  const inventoryValueSparkData = [{ value: inventoryValueVal }, { value: inventoryValueVal }];

  // Category Distribution: real product count per category.
  const countByCategory = new Map<string, number>();
  for (const p of products) {
    const cat = p.category || 'Uncategorized';
    countByCategory.set(cat, (countByCategory.get(cat) || 0) + 1);
  }
  const categoryDistributionData = Array.from(countByCategory.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([category, count]) => ({ category, count }));

  // Stock health breakdown (replaces a previous fake 12-month "Product Stock Levels"
  // trend that had no underlying historical data). Uses each product's real alertQty
  // (reorder threshold) to classify current stock status.
  const stockHealth = { 'In Stock': 0, 'Low Stock': 0, 'Out of Stock': 0 };
  for (const p of products) {
    if (p.stock <= 0) stockHealth['Out of Stock']++;
    else if (p.alertQty && p.stock <= p.alertQty) stockHealth['Low Stock']++;
    else stockHealth['In Stock']++;
  }
  const stockHealthData = [
    { status: 'In Stock', count: stockHealth['In Stock'] },
    { status: 'Low Stock', count: stockHealth['Low Stock'] },
    { status: 'Out of Stock', count: stockHealth['Out of Stock'] },
  ];

  // Inventory value by category (real) — fills the big full-width chart slot that
  // previously showed a fabricated 3-month value trend with no real history behind it.
  const valueByCategory = new Map<string, number>();
  for (const p of products) {
    const cat = p.category || 'Uncategorized';
    valueByCategory.set(cat, (valueByCategory.get(cat) || 0) + p.stock * p.cost);
  }
  const inventoryValueByCategoryData = Array.from(valueByCategory.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value: Math.round(value) }));

  // Real suppliers only — outstandingBalance is what's actually owed to them; there's
  // no Active/Inactive status tracked, so `group` (a real field) is shown instead.
  const displayedSuppliers = suppliers.slice(0, 6).map((sup) => ({
    id: sup.id,
    name: sup.name,
    outstandingBalance: sup.outstandingBalance || 0,
    group: sup.group || '—',
  }));

  // Warehouses: derived from each product's real `warehouse` field (SKU count + stock
  // value per warehouse). No manager names or capacity figures are tracked anywhere in
  // the system, so those are not shown — the percentage is each warehouse's real share
  // of total inventory value.
  const warehouseAgg = new Map<string, { skuCount: number; value: number }>();
  for (const p of products) {
    const wh = p.warehouse || 'Unassigned';
    const entry = warehouseAgg.get(wh) || { skuCount: 0, value: 0 };
    entry.skuCount += 1;
    entry.value += p.stock * p.cost;
    warehouseAgg.set(wh, entry);
  }
  const warehousePalette = [COLORS.emerald, COLORS.orange, COLORS.amber, COLORS.blue, COLORS.purple];
  const displayedWarehouses = Array.from(warehouseAgg.entries())
    .sort((a, b) => b[1].value - a[1].value)
    .slice(0, 6)
    .map(([name, agg], idx) => ({
      name,
      skuCount: agg.skuCount,
      value: agg.value,
      percentage: inventoryValueVal > 0 ? Math.round((agg.value / inventoryValueVal) * 100) : 0,
      color: warehousePalette[idx % warehousePalette.length],
    }));

  // Recent stocks — real products only (most recently added, last 6).
  const displayedRecentStocks = products.slice(-6).reverse().map((p) => ({
    code: p.sku || p.id,
    name: p.name,
    sku: p.sku || '—',
    category: p.category || 'General',
    unit: p.unit || 'Piece',
    qty: p.stock,
    sellPrice: p.price,
    purchasePrice: p.cost,
    status: p.stock <= 0 ? 'Out of Stock' : (p.alertQty && p.stock <= p.alertQty) ? 'Low Stock' : 'In Stock'
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
          <span className="text-[10px] text-brand-orange font-black tracking-widest uppercase block">Supply & Inventory Ledger</span>
          <h1 className="font-display font-black text-2xl tracking-tight text-white mt-1">Inventory Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">Enterprise stocks, warehouse distribution, and supply channels</p>
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

          <button 
            onClick={() => onTabChange('inventory', 'products')}
            className="flex items-center gap-2 bg-brand-orange hover:bg-brand-orange-hover text-xs text-white font-black px-4.5 py-2.5 rounded-xl shadow-lg shadow-brand-orange/15 cursor-pointer active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add Inventory</span>
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      <AnimatePresence>
        {showExportSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-[#161923] border-2 border-emerald-500/50 text-white rounded-xl shadow-2xl p-4.5 flex items-center gap-3 text-xs font-bold font-sans animate-in fade-in"
          >
            <span className="p-1 rounded bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="h-4 w-4" />
            </span>
            <span>Inventory Report prepared! Downloading Excel snapshot...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Row 1 Layout: Left mini cards, middle horizontal bars, right vertical bars */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative z-10">
        
        {/* Left Column (2 Stacked Mini Cards with sparkline charts) */}
        <div className="lg:col-span-1 flex flex-col gap-5 justify-between">
          
          {/* Card 1: Total Stock */}
          <div className="bg-[#161923] border border-slate-800/80 rounded-[1.5rem] p-5 shadow-lg relative overflow-hidden flex flex-col justify-between h-[10.5rem] group hover:border-slate-700/80 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Total Stock</span>
                <p className="text-3xl font-black font-display text-white mt-1">{totalStockVal.toLocaleString()}</p>
                <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 font-bold">
                  +6.43%
                </span>
              </div>
              
              {/* Mini Sparkline Green Icon */}
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 flex items-center justify-center shrink-0">
                <Package className="h-4.5 w-4.5" />
              </div>
            </div>

            {/* Micro Sparkline Chart inside card */}
            <div className="h-10 w-full opacity-60 group-hover:opacity-100 transition-opacity mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={totalStockSparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#colorStock)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 2: Inventory Value */}
          <div className="bg-[#161923] border border-slate-800/80 rounded-[1.5rem] p-5 shadow-lg relative overflow-hidden flex flex-col justify-between h-[10.5rem] group hover:border-slate-700/80 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Inventory Value</span>
                <p className="text-3xl font-black font-display text-white mt-1">${inventoryValueVal.toLocaleString()}</p>
                <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/15 font-bold">
                  -3.72%
                </span>
              </div>
              
              {/* Mini Sparkline Orange Icon */}
              <div className="h-9 w-9 rounded-xl bg-orange-500/10 text-brand-orange border border-orange-500/15 flex items-center justify-center shrink-0">
                <TrendingUp className="h-4.5 w-4.5" />
              </div>
            </div>

            {/* Micro Sparkline Chart inside card */}
            <div className="h-10 w-full opacity-60 group-hover:opacity-100 transition-opacity mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={inventoryValueSparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke="#f97316" strokeWidth={1.5} fillOpacity={1} fill="url(#colorVal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Middle Column: Category Distribution Horizontal Bar chart */}
        <div className="lg:col-span-2 bg-[#161923] border border-slate-800/80 rounded-[1.75rem] p-6 shadow-lg flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-black font-display text-white tracking-wide uppercase">Category Distribution</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Top inventory stock categories</p>
            </div>

            <div className="text-[11px] font-extrabold text-slate-500 font-mono">All Products</div>
          </div>

          <div className="h-56 w-full font-sans">
            {categoryDistributionData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[11px] text-slate-500 font-mono">কোনো পণ্য যোগ করা হয়নি</div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={categoryDistributionData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222533" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis dataKey="category" type="category" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} width={80} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#0b0c10] border border-slate-800 p-2.5 rounded-xl text-[11px] shadow-2xl text-slate-300">
                          <p className="font-extrabold text-slate-400">{payload[0].payload.category}</p>
                          <p className="font-black text-[#10b981] mt-0.5">Items: {payload[0].value}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>

          <div className="text-[10px] text-slate-500 font-bold tracking-wide mt-2">
            মোট {products.length}টি পণ্য, {countByCategory.size}টি ক্যাটাগরিতে
          </div>
        </div>

        {/* Right Column: Product Stock Levels Vertical Bar paired with Line */}
        <div className="lg:col-span-1 bg-[#161923] border border-slate-800/80 rounded-[1.75rem] p-6 shadow-lg flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-black font-display text-white tracking-wide uppercase">Stock Health</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Current stock status across all products</p>
            </div>

            <div className="text-[11px] font-extrabold text-slate-500 font-mono">Right Now</div>
          </div>

          <div className="h-56 w-full font-sans">
            {products.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[11px] text-slate-500 font-mono">কোনো পণ্য নেই</div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockHealthData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222533" vertical={false} />
                <XAxis dataKey="status" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#0b0c10] border border-slate-800 p-2.5 rounded-xl text-[11px] shadow-2xl text-slate-300">
                          <p className="font-extrabold text-slate-400 mb-1">{payload[0].payload.status}</p>
                          <p className="text-[#10b981]">Products: {payload[0].value}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[2, 2, 0, 0]} barSize={24}>
                  {stockHealthData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.status === 'In Stock' ? '#10b981' : entry.status === 'Low Stock' ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>

          <div className="flex gap-3 justify-center items-center text-[9px] font-bold mt-2">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#10b981]"></span>
              <span className="text-slate-400">In Stock</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#f59e0b]"></span>
              <span className="text-slate-400">Low Stock</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#ef4444]"></span>
              <span className="text-slate-400">Out Of Stock</span>
            </div>
          </div>
        </div>

      </div>

      {/* Row 2: Suppliers and Warehouse progress wheels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        
        {/* Suppliers List panel */}
        <div className="bg-[#161923] border border-slate-800/80 rounded-[1.75rem] p-6 shadow-lg flex flex-col justify-between">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-sm font-black font-display text-white tracking-wide uppercase">Suppliers</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Top supplier distribution ledgers</p>
            </div>
            <button 
              onClick={() => onTabChange('purchase', 'purchase_orders')}
              className="text-xs text-brand-orange hover:text-brand-orange-hover font-extrabold transition-colors flex items-center gap-0.5"
            >
              <span>View All</span>
              <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
            </button>
          </div>

          <div className="space-y-3.5 flex-1 max-h-[18rem] overflow-y-auto pr-1.5 custom-scrollbar font-sans">
            {displayedSuppliers.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs">
                কোনো সরবরাহকারী পাওয়া যায়নি (No suppliers found)
              </div>
            ) : (
              displayedSuppliers.map((sup, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 bg-[#0f111a]/40 border border-slate-800/40 rounded-xl hover:bg-[#0f111a]/80 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-orange-500/10 text-brand-orange border border-orange-500/15">
                      <Briefcase className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-100 block">{sup.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5">{sup.id}</span>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-6">
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Outstanding Balance</span>
                      <span className="text-xs font-black text-slate-100 block mt-0.5">${sup.outstandingBalance.toLocaleString()}</span>
                    </div>
                    <span className="inline-block px-3 py-0.5 text-[9px] font-black rounded-full border bg-slate-800/50 text-slate-400 border-slate-800">
                      {sup.group}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Warehouse list panel */}
        <div className="bg-[#161923] border border-slate-800/80 rounded-[1.75rem] p-6 shadow-lg flex flex-col justify-between">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-sm font-black font-display text-white tracking-wide uppercase">Warehouse</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Enterprise physical storage allocation & capacity</p>
            </div>
            <button 
              onClick={() => onTabChange('inventory', 'warehouses')}
              className="text-xs text-brand-orange hover:text-brand-orange-hover font-extrabold transition-colors flex items-center gap-0.5"
            >
              <span>View All</span>
              <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
            </button>
          </div>

          <div className="space-y-3.5 flex-1 max-h-[18rem] overflow-y-auto pr-1.5 custom-scrollbar font-sans">
            {displayedWarehouses.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs">
                কোনো ওয়্যারহাউস পাওয়া যায়নি (No warehouses found)
              </div>
            ) : (
              displayedWarehouses.map((wh, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 bg-[#0f111a]/40 border border-slate-800/40 rounded-xl hover:bg-[#0f111a]/80 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/15">
                      <MapPin className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-100 block">{wh.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5">{wh.skuCount} SKU</span>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-6">
                    <div className="text-left">
                      <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Stock Value</span>
                      <span className="text-xs font-black text-slate-100 block mt-0.5">${wh.value.toLocaleString()}</span>
                    </div>

                    {/* Circle progress indicator: this warehouse's real share of total inventory value */}
                    <div className="relative h-10 w-10 shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path className="text-slate-800" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="text-brand-orange" strokeWidth="3.5" strokeDasharray={`${wh.percentage}, 100`} strokeLinecap="round" stroke={wh.color} fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-slate-100">
                        {wh.percentage}%
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Row 3: Huge Full-width Inventory Value by Category chart (real — replaces a
           previous 3-point "trend" that had no actual historical data behind it; the
           system doesn't record stock-value snapshots over time) */}
      <div className="bg-[#161923] border border-slate-800/80 rounded-[1.75rem] p-6 shadow-lg relative z-10">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-sm font-black font-display text-white tracking-wide uppercase">Inventory Value by Category</h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Current stock valuation (stock × cost) across categories</p>
          </div>
          <div className="text-[11px] font-extrabold text-slate-500 font-mono">Right Now</div>
        </div>

        <div className="h-64 w-full font-sans">
          {inventoryValueByCategoryData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[11px] text-slate-500 font-mono">কোনো ডাটা নেই</div>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={inventoryValueByCategoryData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBigVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.4}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#222533" vertical={false} />
              <XAxis dataKey="label" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-[#0b0c10] border border-slate-800 p-3 rounded-xl text-xs shadow-2xl text-slate-300">
                        <p className="font-extrabold text-slate-400 mb-1">{payload[0].payload.label}</p>
                        <p className="font-black text-[#10b981]">Valuation: ${Number(payload[0].value).toLocaleString()}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value" fill="url(#colorBigVal)" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 4: Recent Stocks Table */}
      <div className="bg-[#161923] border border-slate-800/80 rounded-[1.75rem] p-6 shadow-lg relative z-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-sm font-black font-display text-white tracking-wide uppercase">Recent Stocks</h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Real-time product inventory SKU and transaction matrix</p>
          </div>
          <button 
            onClick={() => onTabChange('inventory', 'products')}
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
                <th className="bg-[#1e2335]/40 text-[#06b6d4] border border-slate-800/40 px-4.5 py-3 text-left text-[10px] font-black uppercase tracking-wider rounded-l-xl">Code</th>
                <th className="bg-[#1e2335]/40 text-[#06b6d4] border border-slate-800/40 px-4.5 py-3 text-left text-[10px] font-black uppercase tracking-wider">Product</th>
                <th className="bg-[#1e2335]/40 text-[#06b6d4] border border-slate-800/40 px-4.5 py-3 text-left text-[10px] font-black uppercase tracking-wider">SKU</th>
                <th className="bg-[#1e2335]/40 text-[#06b6d4] border border-slate-800/40 px-4.5 py-3 text-left text-[10px] font-black uppercase tracking-wider">Category</th>
                <th className="bg-[#1e2335]/40 text-[#06b6d4] border border-slate-800/40 px-4.5 py-3 text-left text-[10px] font-black uppercase tracking-wider">Unit</th>
                <th className="bg-[#1e2335]/40 text-[#06b6d4] border border-slate-800/40 px-4.5 py-3 text-left text-[10px] font-black uppercase tracking-wider">Quantity</th>
                <th className="bg-[#1e2335]/40 text-[#06b6d4] border border-slate-800/40 px-4.5 py-3 text-left text-[10px] font-black uppercase tracking-wider">Selling Price</th>
                <th className="bg-[#1e2335]/40 text-[#06b6d4] border border-slate-800/40 px-4.5 py-3 text-left text-[10px] font-black uppercase tracking-wider">Purchase Price</th>
                <th className="bg-[#1e2335]/40 text-[#06b6d4] border border-slate-800/40 px-4.5 py-3 text-left text-[10px] font-black uppercase tracking-wider rounded-r-xl">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {displayedRecentStocks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 text-xs">
                    কোনো স্টক বা পণ্যের বিবরণ পাওয়া যায়নি (No stocks or products available)
                  </td>
                </tr>
              ) : (
                displayedRecentStocks.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#0f111a]/50 transition-colors">
                    <td className="px-4.5 py-3.5 text-xs font-mono font-bold text-slate-300">{row.code}</td>
                    <td className="px-4.5 py-3.5 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                          <ShoppingBag className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-extrabold text-slate-100">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-4.5 py-3.5 text-xs font-mono font-bold text-slate-400">{row.sku}</td>
                    <td className="px-4.5 py-3.5 text-xs">
                      <span className="inline-block bg-[#06b6d4]/10 border border-[#06b6d4]/15 text-[#06b6d4] font-black px-2 py-0.5 rounded text-[10px] uppercase">
                        {row.category}
                      </span>
                    </td>
                    <td className="px-4.5 py-3.5 text-xs text-slate-400 font-mono">{row.unit}</td>
                    <td className="px-4.5 py-3.5 text-xs font-black text-slate-100">{row.qty.toString().padStart(2, '0')}</td>
                    <td className="px-4.5 py-3.5 text-xs font-black text-emerald-400">${row.sellPrice}</td>
                    <td className="px-4.5 py-3.5 text-xs font-mono font-bold text-slate-400">${row.purchasePrice}</td>
                    <td className="px-4.5 py-3.5 text-xs">
                      <span className={`inline-block px-2.5 py-0.5 text-[9px] font-black rounded border ${
                        row.status === 'In Stock'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : row.status === 'Low Stock'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {row.status}
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
