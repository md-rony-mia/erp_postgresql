import { useState, useEffect } from 'react';
import {
  Invoice,
  Product,
  Supplier,
  Customer,
  PurchaseOrder,
} from '../types';
import FinanceDashboard from './FinanceDashboard';
import InventoryDashboard from './InventoryDashboard';
import SalesDashboard from './SalesDashboard';
import PurchaseDashboard from './PurchaseDashboard';
import * as Icons from 'lucide-react';
import {
  TrendingUp,
  FileText,
  Boxes,
  AlertTriangle,
  ArrowRightLeft,
  ArrowUpRight,
  PlusCircle,
  ShoppingBag,
  UserPlus,
  Eye,
  EyeOff,
  CheckCircle,
  HelpCircle,
  ArrowUp,
  ArrowDown,
  Palette,
  EyeOff as EyeHidden,
  RefreshCw,
  Edit3,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { navEngine, NavigationItem } from '../lib/navigationEngine';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

import { MainDashboardView } from './Dashboard/DashboardView';
import { BankAccount, LoanAccount, Employee, Transaction, Attendance, Branch } from '../types';

interface DashboardViewProps {
  invoices: Invoice[];
  products: Product[];
  suppliers: Supplier[];
  customers: Customer[];
  purchaseOrders?: PurchaseOrder[];
  bankAccounts?: BankAccount[];
  loanAccounts?: LoanAccount[];
  employees?: Employee[];
  transactions?: Transaction[];
  attendances?: Attendance[];
  onTabChange: (tab: string, subTab?: string) => void;
  isVisualEditMode?: boolean;
  activeSubTab?: string;
  currentBranchId?: string;
  branches?: Branch[];
}

// Lightweight custom animated counter for high visual polish
function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState<number>(0);
  
  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setDisplayValue(end);
      return;
    }
    
    const duration = 1000; // ms
    const startTime = performance.now();
    
    function update(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (end - start) * ease);
      setDisplayValue(current);
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    requestAnimationFrame(update);
  }, [value]);

  return <span>{displayValue.toLocaleString()}</span>;
}

// Sparkline component inside individual KPI cards
function MiniSparkline({ color = '#f97316', seed = 1 }) {
  const paths = [
    "M 2 12 Q 12 4, 22 14 T 42 6 T 48 3",
    "M 2 15 Q 12 10, 22 4 T 42 12 T 48 6",
    "M 2 5 Q 12 15, 22 8 T 42 4 T 48 2",
    "M 2 14 Q 12 2, 22 15 T 42 10 T 48 4"
  ];
  const path = paths[seed % paths.length];
  return (
    <svg className="w-12 h-6" viewBox="0 0 50 20">
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function DashboardView({
  invoices,
  products,
  suppliers,
  customers,
  purchaseOrders = [],
  bankAccounts = [],
  loanAccounts = [],
  employees = [],
  transactions = [],
  attendances = [],
  onTabChange,
  isVisualEditMode = false,
  activeSubTab = '',
  currentBranchId = 'all',
  branches = [],
}: DashboardViewProps) {
  // Balance mask state
  const [showValues, setShowValues] = useState(false);

  // Navigation states for extensions
  const [favItems, setFavItems] = useState<string[]>([]);
  const [pinnedItems, setPinnedItems] = useState<string[]>([]);
  const [recentItems, setRecentItems] = useState<string[]>([]);
  const [allNavItems, setAllNavItems] = useState<NavigationItem[]>([]);
  const [selectedFavToAdd, setSelectedFavToAdd] = useState<string>('');
  
  // Search and filter states
  const [favSearchQuery, setFavSearchQuery] = useState<string>('');
  const [pinnedSearchQuery, setPinnedSearchQuery] = useState<string>('');
  
  // Collapsed sections in pinned manager
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const syncExtensions = () => {
    setFavItems(navEngine.getFavorites());
    setPinnedItems(navEngine.getPinned());
    setRecentItems(navEngine.getRecents());
    setAllNavItems(navEngine.getAllItems());
  };

  useEffect(() => {
    syncExtensions();
    const available = navEngine.getAllItems().filter(item => !navEngine.getFavorites().includes(item.id));
    if (available.length > 0) {
      setSelectedFavToAdd(available[0].id);
    }
  }, [activeSubTab]);

  // Layout states customizable by user in Visual Edit Mode
  const [layoutOrder, setLayoutOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('nexova_dashboard_order');
    return saved ? JSON.parse(saved) : ['welcome', 'kpis', 'analytics', 'shortcuts_recent', 'alerts_outstanding'];
  });

  const [hiddenSections, setHiddenSections] = useState<string[]>(() => {
    const saved = localStorage.getItem('nexova_dashboard_hidden');
    return saved ? JSON.parse(saved) : [];
  });

  const [cardThemes, setCardThemes] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('nexova_dashboard_themes');
    return saved ? JSON.parse(saved) : {
      welcome: 'bg-gradient-to-br from-[#0c0d12] via-[#121520] to-[#07080d] border-[#1f2937]/35 text-white',
      today_revenue: 'premium-card text-slate-800',
      analytics_perf: 'premium-card',
      analytics_mix: 'premium-card',
      recent_sales: 'premium-card',
      shortcuts: 'premium-card',
      low_stock: 'premium-card',
      outstanding: 'premium-card'
    };
  });

  const [customTitles, setCustomTitles] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('nexova_dashboard_titles');
    return saved ? JSON.parse(saved) : {
      welcome: "Here's your store at a glance today.",
      today_revenue: "Today's Revenue",
      recent_sales: "Recent Sales",
      shortcuts: "Quick Actions",
      low_stock: "Low Stock Alert",
      outstanding: "Outstanding Payments"
    };
  });

  const [editingTitleKey, setEditingTitleKey] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState<string>('');
  const [isLowStockDrawerOpen, setIsLowStockDrawerOpen] = useState<boolean>(false);
  const [activeLedgerCard, setActiveLedgerCard] = useState<'payable' | 'receivable'>('payable');

  // Save utility helpers
  const saveLayoutOrder = (newOrder: string[]) => {
    setLayoutOrder(newOrder);
    localStorage.setItem('nexova_dashboard_order', JSON.stringify(newOrder));
  };

  const saveHiddenSections = (newHidden: string[]) => {
    setHiddenSections(newHidden);
    localStorage.setItem('nexova_dashboard_hidden', JSON.stringify(newHidden));
  };

  const saveCardThemes = (newThemes: Record<string, string>) => {
    setCardThemes(newThemes);
    localStorage.setItem('nexova_dashboard_themes', JSON.stringify(newThemes));
  };

  const saveCustomTitles = (newTitles: Record<string, string>) => {
    setCustomTitles(newTitles);
    localStorage.setItem('nexova_dashboard_titles', JSON.stringify(newTitles));
  };

  // Re-ordering logic
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...layoutOrder];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx >= 0 && targetIdx < newOrder.length) {
      const temp = newOrder[index];
      newOrder[index] = newOrder[targetIdx];
      newOrder[targetIdx] = temp;
      saveLayoutOrder(newOrder);
    }
  };

  // Color theme cycling with modern premium gradients
  const cycleTheme = (key: string) => {
    const themesList = [
      'premium-card text-slate-800',
      'bg-gradient-to-br from-[#0c0d12] via-[#121520] to-[#07080d] border-slate-800 text-white shadow-xl',
      'bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white border-indigo-800/40 shadow-xl',
      'bg-gradient-to-br from-[#0a1512] via-[#0f241e] to-[#050a08] text-slate-100 border-emerald-950 shadow-xl',
      'bg-slate-50 border-slate-300/80 text-slate-800 shadow-inner',
    ];
    const currentTheme = cardThemes[key] || themesList[0];
    const nextIdx = (themesList.indexOf(currentTheme) + 1) % themesList.length;
    const newThemes = { ...cardThemes, [key]: themesList[nextIdx] };
    saveCardThemes(newThemes);
  };

  // Title edit save
  const saveTitleEdit = (key: string) => {
    const updated = { ...customTitles, [key]: editingTitleValue };
    saveCustomTitles(updated);
    setEditingTitleKey(null);
  };

  // Reset all layout settings
  const resetLayoutToDefaults = () => {
    localStorage.removeItem('nexova_dashboard_order');
    localStorage.removeItem('nexova_dashboard_hidden');
    localStorage.removeItem('nexova_dashboard_themes');
    localStorage.removeItem('nexova_dashboard_titles');
    setLayoutOrder(['welcome', 'kpis', 'analytics', 'shortcuts_recent', 'alerts_outstanding']);
    setHiddenSections([]);
    setCardThemes({
      welcome: 'bg-gradient-to-br from-[#0c0d12] via-[#121520] to-[#07080d] border-[#1f2937]/35 text-white',
      today_revenue: 'premium-card text-slate-800',
      analytics_perf: 'premium-card',
      analytics_mix: 'premium-card',
      recent_sales: 'premium-card',
      shortcuts: 'premium-card',
      low_stock: 'premium-card',
      outstanding: 'premium-card'
    });
    setCustomTitles({
      welcome: "Here's your store at a glance today.",
      today_revenue: "Today's Revenue",
      recent_sales: "Recent Sales",
      shortcuts: "Quick Actions",
      low_stock: "Low Stock Alert",
      outstanding: "Outstanding Payments"
    });
    alert('Dashboard layout successfully restored to enterprise defaults!');
  };

  // Stats derivations
  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.isPaid ? inv.total : 0), 0);
  const totalReceivables = customers.reduce((sum, cust) => sum + cust.outstandingBalance, 0);
  const totalPayables = suppliers.reduce((sum, sup) => sum + sup.outstandingBalance, 0);
  const lowStockItems = products.filter((p) => p.stock <= p.alertQty);
  
  // Custom tooltips state for charts
  const [salesHoverIndex, setSalesHoverIndex] = useState<number | null>(null);

  // 7 days sales data — computed from real invoices, no fabricated fallback values
  const sales7Days = (() => {
    const days: { date: string; sales: number }[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const label = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      const dayTotal = invoices.reduce((sum, inv) => {
        const invD = new Date(inv.date);
        if (
          !isNaN(invD.getTime()) &&
          invD.getFullYear() === d.getFullYear() &&
          invD.getMonth() === d.getMonth() &&
          invD.getDate() === d.getDate()
        ) {
          return sum + (inv.total || 0);
        }
        return sum;
      }, 0);
      days.push({ date: label, sales: dayTotal });
    }
    return days;
  })();

  // Helper to format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 2,
    }).format(val).replace('BDT', '৳');
  };

  const displayVal = (val: number) => {
    if (!showValues) return '৳ ••••••';
    return formatCurrency(val);
  };

  // Controls toolbar component
  const renderControls = (sectionId: string, index: number) => {
    if (!isVisualEditMode) return null;
    return (
      <div className="absolute top-3 right-3 bg-slate-900/95 text-white p-1 rounded-xl flex items-center gap-1.5 z-30 shadow-lg text-[10px] select-none pointer-events-auto border border-slate-800">
        <button
          onClick={() => moveSection(index, 'up')}
          disabled={index === 0}
          className="p-1 hover:bg-slate-800 disabled:opacity-30 rounded-lg cursor-pointer transition-colors"
          title="Move Section Up"
        >
          <ArrowUp className="h-3 w-3" />
        </button>
        <button
          onClick={() => moveSection(index, 'down')}
          disabled={index === layoutOrder.length - 1}
          className="p-1 hover:bg-slate-800 disabled:opacity-30 rounded-lg cursor-pointer transition-colors"
          title="Move Section Down"
        >
          <ArrowDown className="h-3 w-3" />
        </button>
        <button
          onClick={() => cycleTheme(sectionId)}
          className="p-1 hover:bg-slate-800 rounded-lg cursor-pointer text-brand-orange transition-colors"
          title="Cycle Theme Style"
        >
          <Palette className="h-3 w-3" />
        </button>
        <button
          onClick={() => {
            const updated = [...hiddenSections, sectionId];
            saveHiddenSections(updated);
          }}
          className="p-1 hover:bg-slate-800 rounded-lg cursor-pointer text-red-400 transition-colors"
          title="Hide Section"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  };

  const renderDynamicIcon = (iconName: string, className = "h-5 w-5") => {
    const IconComponent = (Icons as any)[iconName || 'Activity'];
    if (IconComponent) {
      return <IconComponent className={className} />;
    }
    return <Icons.Activity className={className} />;
  };

  const getGroupBadgeStyles = (groupId: string) => {
    switch (groupId) {
      case 'dashboard':
        return 'bg-indigo-50 border-indigo-200 text-indigo-700';
      case 'inventory':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'warehouse':
        return 'bg-cyan-50 border-cyan-200 text-cyan-700';
      case 'purchase':
        return 'bg-sky-50 border-sky-200 text-sky-700';
      case 'sales':
        return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      case 'accounting':
        return 'bg-purple-50 border-purple-200 text-purple-700';
      case 'crm':
        return 'bg-rose-50 border-rose-200 text-rose-700';
      case 'hr':
        return 'bg-teal-50 border-teal-200 text-teal-700';
      case 'projects':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'manufacturing':
        return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'service':
        return 'bg-violet-50 border-violet-200 text-violet-700';
      case 'documents':
        return 'bg-slate-50 border-slate-200 text-slate-700';
      case 'workflow':
        return 'bg-pink-50 border-pink-200 text-pink-700';
      case 'reports':
        return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'ai':
        return 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700 animate-pulse';
      case 'integration':
        return 'bg-lime-50 border-lime-200 text-lime-700';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  const renderFavoritesView = () => {
    const favoritesList = allNavItems.filter(item => favItems.includes(item.id));
    const filteredFavs = favoritesList.filter(item => 
      item.label.toLowerCase().includes(favSearchQuery.toLowerCase())
    );
    const availableToFavorite = allNavItems.filter(item => !favItems.includes(item.id));

    const handleAddFavorite = () => {
      const targetId = selectedFavToAdd || (availableToFavorite[0]?.id);
      if (targetId) {
        navEngine.toggleFavorite(targetId);
        syncExtensions();
        const nextAvailable = allNavItems.filter(item => !navEngine.getFavorites().includes(item.id) && item.id !== targetId);
        setSelectedFavToAdd(nextAvailable[0]?.id || '');
      }
    };

    return (
      <div className="space-y-6 animate-fade-up" id="favorites-tab-container">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-brand-orange/10 rounded-lg text-brand-orange">
                <Icons.Star className="h-6 w-6 fill-brand-orange text-brand-orange" />
              </span>
              <h1 className="text-xl font-black text-slate-900 font-display uppercase tracking-tight">Bookmarked Favorites</h1>
            </div>
            <p className="text-xs text-slate-400">
              Your customized operational deck. Keep your most used registers, POS checkout, or stock ledgers handy for instant access.
            </p>
          </div>

          {availableToFavorite.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                value={selectedFavToAdd}
                onChange={(e) => setSelectedFavToAdd(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-orange/20 cursor-pointer"
              >
                {availableToFavorite.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.label} ({item.groupId.toUpperCase()})
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddFavorite}
                className="px-4 py-2 bg-brand-orange hover:bg-brand-orange-hover text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-brand-orange/10 flex items-center gap-1 cursor-pointer"
              >
                <Icons.Plus className="h-3.5 w-3.5" /> Bookmark Page
              </button>
            </div>
          )}
        </div>

        <div className="relative">
          <Icons.Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search within your bookmarked pages..."
            value={favSearchQuery}
            onChange={(e) => setFavSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200/80 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-orange/20"
          />
        </div>

        {filteredFavs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
              <Icons.Star className="h-6 w-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-sm font-bold text-slate-800">No bookmarks matched</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {favoritesList.length === 0 
                  ? "Your favorites deck is currently empty. Use the quick selector at the top-right or browse pages to bookmark."
                  : "Try clearing your search filters to view your bookmarks."}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFavs.map(item => (
              <div
                key={item.id}
                className="premium-card p-5 flex flex-col justify-between group relative"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navEngine.toggleFavorite(item.id);
                    syncExtensions();
                  }}
                  className="absolute top-3 right-3 p-1 rounded-full text-slate-300 hover:text-brand-orange hover:bg-slate-50 transition-colors cursor-pointer"
                  title="Remove Bookmark"
                >
                  <Icons.Star className="h-4 w-4 fill-brand-orange text-brand-orange" />
                </button>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className={`p-2.5 rounded-xl border ${getGroupBadgeStyles(item.groupId)}`}>
                      {renderDynamicIcon(item.icon || 'Activity', 'h-5 w-5')}
                    </span>
                    <div>
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${getGroupBadgeStyles(item.groupId)}`}>
                        {item.groupId}
                      </span>
                      <h3 className="font-bold text-sm text-slate-800 font-display mt-1">
                        {item.label}
                      </h3>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    Instantly load this operational register or screen. Fully integrated with standard workflows and real-time ledger updates.
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-300 font-mono">ID: {item.id}</span>
                  <button
                    onClick={() => onTabChange(item.tab, item.subTab)}
                    className="px-3.5 py-1.5 bg-slate-50 hover:bg-brand-orange hover:text-white text-brand-orange font-bold text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer border border-slate-100"
                  >
                    Launch Page <Icons.ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderRecentsView = () => {
    const recentPages = recentItems
      .map(id => allNavItems.find(item => item.id === id))
      .filter(Boolean) as NavigationItem[];

    const handleClearRecents = () => {
      localStorage.removeItem('nexova_nav_recents');
      syncExtensions();
    };

    return (
      <div className="space-y-6 animate-fade-up" id="recents-tab-container">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-brand-orange/10 rounded-lg text-brand-orange">
                <Icons.Clock className="h-6 w-6" />
              </span>
              <h1 className="text-xl font-black text-slate-900 font-display uppercase tracking-tight">Session Page History</h1>
            </div>
            <p className="text-xs text-slate-400">
              Audit log of screens and registers visited during this session. Tap any line to backtrack instantly.
            </p>
          </div>

          {recentPages.length > 0 && (
            <button
              onClick={handleClearRecents}
              className="px-3.5 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Icons.Trash2 className="h-3.5 w-3.5" /> Clear Navigation History
            </button>
          )}
        </div>

        {recentPages.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
              <Icons.Clock className="h-6 w-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-sm font-bold text-slate-800">No session visits recorded</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                As you traverse different registers, charts, and configuration menus, your session footprints will dynamically register here.
              </p>
            </div>
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-200 pl-6 ml-4 space-y-6">
            {recentPages.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="relative group">
                <span className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-brand-orange bg-white group-hover:bg-brand-orange transition-colors z-10 shadow-xs"></span>
                
                <div className="premium-card p-5 hover:border-brand-orange/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className={`p-2.5 rounded-xl border ${getGroupBadgeStyles(item.groupId)}`}>
                      {renderDynamicIcon(item.icon || 'Activity', 'h-5 w-5')}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-800 font-display">
                          {item.label}
                        </h3>
                        <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${getGroupBadgeStyles(item.groupId)}`}>
                          {item.groupId}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Route: <span className="font-mono text-slate-500">{item.tab} / {item.subTab || 'default'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="text-[10px] text-slate-400 font-semibold bg-slate-50 px-2 py-1 rounded-md">
                      {idx === 0 ? 'Active / Just Now' : `${idx * 2 + 1}m ago`}
                    </span>
                    <button
                      onClick={() => onTabChange(item.tab, item.subTab)}
                      className="px-3.5 py-1.5 bg-brand-orange hover:bg-brand-orange-hover text-white font-bold text-xs rounded-xl shadow-md shadow-brand-orange/10 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      Re-open <Icons.ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderPinnedView = () => {
    const pinnedPages = allNavItems.filter(item => pinnedItems.includes(item.id));
    const filteredPinned = pinnedPages.filter(item => 
      item.label.toLowerCase().includes(pinnedSearchQuery.toLowerCase())
    );

    const itemsByGroup: Record<string, NavigationItem[]> = {};
    allNavItems.forEach(item => {
      if (!itemsByGroup[item.groupId]) {
        itemsByGroup[item.groupId] = [];
      }
      itemsByGroup[item.groupId].push(item);
    });

    const handleTogglePin = (id: string) => {
      navEngine.togglePinned(id);
      syncExtensions();
    };

    return (
      <div className="space-y-8 animate-fade-up" id="pinned-tab-container">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-brand-orange/10 rounded-lg text-brand-orange">
              <Icons.Pin className="h-6 w-6 rotate-45" />
            </span>
            <h1 className="text-xl font-black text-slate-900 font-display uppercase tracking-tight">Pinned Actions Deck</h1>
          </div>
          <p className="text-xs text-slate-400">
            Pin and construct your personalized executive actions deck. Click any card to launch immediately. Toggle pins below to modify this deck.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
            <span>⚡</span> Quick Launch Deck
          </h2>

          {filteredPinned.length === 0 ? (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
              <p className="text-xs text-slate-400 leading-relaxed">
                No active actions pinned to your dashboard. Use the pinboards below to toggle operational pages.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filteredPinned.map(item => (
                <div
                  key={item.id}
                  onClick={() => onTabChange(item.tab, item.subTab)}
                  className="bg-white border border-slate-200/85 hover:border-brand-orange hover:shadow-md rounded-xl p-4 transition-all duration-300 cursor-pointer group flex flex-col justify-between h-28 relative"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePin(item.id);
                    }}
                    className="absolute top-2 right-2 p-1 text-slate-300 hover:text-brand-orange rounded-full hover:bg-slate-50 cursor-pointer"
                    title="Unpin Action"
                  >
                    <Icons.Pin className="h-3.5 w-3.5 rotate-45 text-brand-orange fill-brand-orange" />
                  </button>

                  <span className={`p-1.5 rounded-lg border w-fit ${getGroupBadgeStyles(item.groupId)}`}>
                    {renderDynamicIcon(item.icon || 'Activity', 'h-4 w-4')}
                  </span>

                  <div>
                    <span className="text-[8px] font-extrabold uppercase text-slate-300 block">
                      {item.groupId}
                    </span>
                    <h3 className="font-extrabold text-xs text-slate-800 tracking-tight mt-0.5 group-hover:text-brand-orange transition-colors">
                      {item.label}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
              <span>📌</span> System Pinboard Manager
            </h2>
            
            <div className="relative w-full sm:w-72">
              <Icons.Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter pages to pin..."
                value={pinnedSearchQuery}
                onChange={(e) => setPinnedSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200/80 rounded-xl text-xs focus:outline-none font-sans"
              />
            </div>
          </div>

          <div className="space-y-4">
            {Object.keys(itemsByGroup).map(grpId => {
              const grpItems = itemsByGroup[grpId];
              const filteredGrpItems = grpItems.filter(item => 
                item.label.toLowerCase().includes(pinnedSearchQuery.toLowerCase())
              );

              if (filteredGrpItems.length === 0) return null;

              const isCollapsed = collapsedGroups[grpId];

              return (
                <div key={grpId} className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
                  <div
                    onClick={() => setCollapsedGroups(prev => ({ ...prev, [grpId]: !prev[grpId] }))}
                    className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                        {grpId} Group
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded-full">
                        {filteredGrpItems.length} pages
                      </span>
                    </div>
                    {isCollapsed ? (
                      <Icons.ChevronRight className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Icons.ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>

                  {!isCollapsed && (
                    <div className="divide-y divide-slate-100 px-5">
                      {filteredGrpItems.map(item => {
                        const isPinned = pinnedItems.includes(item.id);
                        return (
                          <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2.5">
                              <span className={`p-1.5 rounded-lg border ${getGroupBadgeStyles(item.groupId)}`}>
                                {renderDynamicIcon(item.icon || 'Activity', 'h-4 w-4')}
                              </span>
                              <div>
                                <h4 className="font-bold text-xs text-slate-700">{item.label}</h4>
                                <span className="text-[9px] text-slate-400 font-mono">/ {item.tab} / {item.subTab || 'default'}</span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleTogglePin(item.id)}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                                isPinned 
                                  ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200'
                              }`}
                            >
                              <Icons.Pin className={`h-3 w-3 ${isPinned ? 'fill-rose-500 rotate-45' : ''}`} />
                              {isPinned ? 'Pinned' : 'Pin Action'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (activeSubTab === 'favorites') {
    return renderFavoritesView();
  }
  if (activeSubTab === 'recent') {
    return renderRecentsView();
  }
  if (activeSubTab === 'pinned') {
    return renderPinnedView();
  }
  if (activeSubTab === 'finance_dash') {
    return (
      <FinanceDashboard
        invoices={invoices}
        products={products}
        suppliers={suppliers}
        customers={customers}
        transactions={transactions}
        onTabChange={onTabChange}
      />
    );
  }
  if (activeSubTab === 'sales_dash') {
    return (
      <SalesDashboard
        products={products}
        customers={customers}
        invoices={invoices}
        onTabChange={onTabChange}
      />
    );
  }
  if (activeSubTab === 'inventory_dash') {
    return (
      <InventoryDashboard
        products={products}
        suppliers={suppliers}
        customers={customers}
        invoices={invoices}
        onTabChange={onTabChange}
      />
    );
  }
  if (activeSubTab === 'purchase_dash') {
    return (
      <PurchaseDashboard
        purchaseOrders={purchaseOrders}
        products={products}
        suppliers={suppliers}
        onTabChange={onTabChange}
      />
    );
  }

  // Default C-Suite Executive Dashboard render
  return (
    <MainDashboardView
      invoices={invoices}
      products={products}
      customers={customers}
      suppliers={suppliers}
      bankAccounts={bankAccounts}
      loanAccounts={loanAccounts}
      employees={employees}
      purchaseOrders={purchaseOrders}
      transactions={transactions}
      attendances={attendances}
      onTabChange={onTabChange}
      currentBranchId={currentBranchId}
      branches={branches}
    />
  );

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Visual Customize Toolbar */}
      {isVisualEditMode && (
        <div className="bg-brand-orange/10 border border-brand-orange/25 p-4.5 rounded-2xl flex items-center justify-between gap-4 text-brand-orange select-none shadow-[0_0_20px_rgba(249,115,22,0.05)]">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <span className="text-base">🔧</span>
            <span><span className="font-black uppercase tracking-wider">Nexova Visual Customizer</span>: Move panels, cycle premium color styles, or double-click headers to rewrite labels to match enterprise flexibility!</span>
          </div>
          <button
            onClick={resetLayoutToDefaults}
            className="px-3.5 py-2 bg-brand-orange text-white hover:bg-brand-orange-hover rounded-xl text-xs font-bold shadow-md shadow-brand-orange/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reset Layout
          </button>
        </div>
      )}

      {/* Render layout items recursively */}
      {layoutOrder.map((sectionId, index) => {
        if (hiddenSections.includes(sectionId)) return null;

        if (sectionId === 'welcome') {
          const completedPct = Math.min(Math.round((totalRevenue / 50000) * 100), 100) || 65;
          return (
            <div key="welcome" className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative group border border-transparent hover:border-brand-orange/15 rounded-[2rem] p-1.5 transition-all duration-300 mb-8">
              {renderControls('welcome', index)}
              
              {/* Asymmetric Welcome Card Left (2/3 width) - Large Radius & Deep Shadow */}
              <div className={`${cardThemes['welcome'] || 'bg-gradient-to-br from-[#0b0c13] via-[#141727] to-[#05060a] border-slate-800/80 text-white'} p-8 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.35)] relative overflow-hidden flex flex-col justify-between min-h-[250px] border lg:col-span-2`}>
                {/* Modern visual/neon gradients */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-brand-orange/10 blur-[120px] rounded-full pointer-events-none transform translate-x-20 -translate-y-20"></div>
                <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-emerald-500/5 blur-[90px] rounded-full pointer-events-none"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.01] to-transparent transform -skew-y-12 pointer-events-none"></div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-orange"></span>
                    </span>
                    <span className="text-[9px] font-black text-brand-orange tracking-widest uppercase">
                      Nexova Enterprise Suite Active
                    </span>
                  </div>
                  
                  {editingTitleKey === 'welcome' ? (
                    <div className="flex items-center gap-2 mt-2 z-50 relative">
                      <input
                        type="text"
                        value={editingTitleValue}
                        onChange={(e) => setEditingTitleValue(e.target.value)}
                        className="bg-slate-800 text-white text-xl font-bold rounded-xl p-2 focus:outline-none border border-slate-700"
                        autoFocus
                      />
                      <button onClick={() => saveTitleEdit('welcome')} className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors cursor-pointer"><Check className="h-4 w-4" /></button>
                      <button onClick={() => setEditingTitleKey(null)} className="p-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors cursor-pointer"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <h1
                      onDoubleClick={() => {
                        if (isVisualEditMode) {
                          setEditingTitleKey('welcome');
                          setEditingTitleValue(customTitles['welcome']);
                        }
                      }}
                      className="text-2xl lg:text-3xl font-black font-display tracking-tight mt-1.5 flex items-center gap-2.5 cursor-pointer text-white/95"
                    >
                      <span>{customTitles['welcome']}</span>
                      {isVisualEditMode && <Edit3 className="h-4.5 w-4.5 text-brand-orange opacity-80" />}
                    </h1>
                  )}
                  <p className="text-xs text-slate-400 mt-2 flex items-center gap-2 font-medium">
                    <span>Wednesday, 15 July 2026</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-800"></span>
                    <span className="text-brand-orange font-semibold">{invoices.length} checkouts recorded today</span>
                  </p>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    {editingTitleKey === 'today_revenue' ? (
                      <div className="flex items-center gap-1 z-50 relative">
                        <input
                          type="text"
                          value={editingTitleValue}
                          onChange={(e) => setEditingTitleValue(e.target.value)}
                          className="bg-slate-800 text-xs font-bold rounded-lg p-1 text-white border border-slate-700"
                        />
                        <button onClick={() => saveTitleEdit('today_revenue')} className="p-1 bg-emerald-500 text-white rounded"><Check className="h-3 w-3" /></button>
                      </div>
                    ) : (
                      <span
                        onDoubleClick={() => {
                          if (isVisualEditMode) {
                            setEditingTitleKey('today_revenue');
                            setEditingTitleValue(customTitles['today_revenue']);
                          }
                        }}
                        className="text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer flex items-center gap-1"
                      >
                        <span>{customTitles['today_revenue']}</span>
                        {isVisualEditMode && <Edit3 className="h-3 w-3 text-slate-400 opacity-40" />}
                      </span>
                    )}
                    <div className="flex items-center gap-3.5 mt-1">
                      <span className="text-3xl lg:text-4xl font-black font-display tracking-tight text-white">
                        {displayVal(totalRevenue)}
                      </span>
                      <button
                        onClick={() => setShowValues(!showValues)}
                        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-brand-orange transition-all cursor-pointer"
                        title={showValues ? 'Hide values' : 'Show values'}
                      >
                        {showValues ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 backdrop-blur-xs">
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Daily Target</p>
                      <p className="text-xs font-bold text-brand-orange mt-1">{completedPct}% Completed</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 backdrop-blur-xs">
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Terminal Ingress</p>
                      <p className="text-xs font-bold text-emerald-400 mt-1">Secure & Online</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Asymmetric Progress Card Right (1/3 width) - Mini Radial Progress */}
              <div className="lg:col-span-1 bg-white border border-slate-200/90 shadow-[0_15px_40px_rgba(0,0,0,0.015)] p-8 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[250px]">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Target Tracker
                  </span>
                  <h3 className="font-extrabold text-sm text-slate-800 font-display mt-0.5">
                    Daily Operating Target
                  </h3>
                </div>

                <div className="flex items-center justify-center py-4 relative">
                  <svg className="w-32 h-32 transform -rotate-90">
                    {/* Background circular track */}
                    <circle cx="64" cy="64" r="48" fill="transparent" stroke="#f1f5f9" strokeWidth="10" />
                    {/* Dynamic percentage track */}
                    <circle
                      cx="64"
                      cy="64"
                      r="48"
                      fill="transparent"
                      stroke="#f97316"
                      strokeWidth="10"
                      strokeDasharray="301.6"
                      strokeDashoffset={301.6 - (301.6 * completedPct) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-slate-900 font-display tracking-tight">{completedPct}%</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Completed</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Target: ৳50,000</span>
                  <span className="font-bold text-brand-orange font-display">
                    {totalRevenue >= 50000 ? 'Achieved!' : `৳${(50000 - totalRevenue).toLocaleString()} Left`}
                  </span>
                </div>
              </div>
            </div>
          );
        }

        if (sectionId === 'kpis') {
          return (
            <div key="kpis" className="relative group border border-transparent hover:border-brand-orange/15 rounded-3xl p-1.5 transition-all duration-300 mb-8">
              {renderControls('kpis', index)}
              
              {/* Horizontal Scrollable Stat Strip replacing 6 cards */}
              <div className="flex gap-4 overflow-x-auto pb-1.5 pt-1 px-1 no-scrollbar scroll-smooth snap-x select-none">
                
                {/* Chip 1: Today's Invoices */}
                <div className="flex-shrink-0 flex items-center gap-4 bg-white border border-slate-200/70 rounded-2xl px-5 py-4 shadow-[0_4px_12px_rgba(0,0,0,0.015)] hover:shadow-lg transition-all duration-500 ease-out min-w-[210px] hover:min-w-[320px] group/chip snap-start cursor-pointer border-l-4 border-l-blue-500 overflow-hidden relative">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-xl bg-blue-50 text-blue-500 border border-blue-100 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div>
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Today's Invoices</span>
                      <p className="text-xl font-black text-slate-800 font-display tracking-tight mt-0.5">
                        <AnimatedNumber value={invoices.length} />
                      </p>
                    </div>
                  </div>
                  
                  {/* Expanded Content with Trend Line */}
                  <div className="w-0 opacity-0 group-hover/chip:w-28 group-hover/chip:opacity-100 transition-all duration-500 ease-out overflow-hidden flex flex-col items-end justify-center pl-3 border-l border-slate-100 ml-auto">
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Weekly Trend</span>
                    <MiniSparkline color="#3b82f6" seed={1} />
                  </div>
                </div>

                {/* Chip 2: Today's Sales */}
                <div className="flex-shrink-0 flex items-center gap-4 bg-white border border-slate-200/70 rounded-2xl px-5 py-4 shadow-[0_4px_12px_rgba(0,0,0,0.015)] hover:shadow-lg transition-all duration-500 ease-out min-w-[210px] hover:min-w-[320px] group/chip snap-start cursor-pointer border-l-4 border-l-emerald-500 overflow-hidden relative">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-500 border border-emerald-100 flex items-center justify-center shrink-0">
                      <TrendingUp className="h-5 w-5" />
                    </span>
                    <div>
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Today's Revenue</span>
                      <p className="text-xl font-black text-slate-800 font-display tracking-tight mt-0.5">
                        {showValues ? <AnimatedNumber value={totalRevenue} /> : <span className="text-sm font-bold text-slate-400">৳ Hidden</span>}
                      </p>
                    </div>
                  </div>
                  
                  {/* Expanded Content with Trend Line */}
                  <div className="w-0 opacity-0 group-hover/chip:w-28 group-hover/chip:opacity-100 transition-all duration-500 ease-out overflow-hidden flex flex-col items-end justify-center pl-3 border-l border-slate-100 ml-auto">
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Weekly Trend</span>
                    <MiniSparkline color="#10b981" seed={2} />
                  </div>
                </div>

                {/* Chip 3: Total Products */}
                <div className="flex-shrink-0 flex items-center gap-4 bg-white border border-slate-200/70 rounded-2xl px-5 py-4 shadow-[0_4px_12px_rgba(0,0,0,0.015)] hover:shadow-lg transition-all duration-500 ease-out min-w-[210px] hover:min-w-[320px] group/chip snap-start cursor-pointer border-l-4 border-l-purple-500 overflow-hidden relative">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-xl bg-purple-50 text-purple-500 border border-purple-100 flex items-center justify-center shrink-0">
                      <Boxes className="h-5 w-5" />
                    </span>
                    <div>
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Total Products</span>
                      <p className="text-xl font-black text-slate-800 font-display tracking-tight mt-0.5">
                        <AnimatedNumber value={products.length} />
                      </p>
                    </div>
                  </div>
                  
                  {/* Expanded Content with Trend Line */}
                  <div className="w-0 opacity-0 group-hover/chip:w-28 group-hover/chip:opacity-100 transition-all duration-500 ease-out overflow-hidden flex flex-col items-end justify-center pl-3 border-l border-slate-100 ml-auto">
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Weekly Trend</span>
                    <MiniSparkline color="#8b5cf6" seed={3} />
                  </div>
                </div>

                {/* Chip 4: Low Stock Alert */}
                <div className="flex-shrink-0 flex items-center gap-4 bg-white border border-slate-200/70 rounded-2xl px-5 py-4 shadow-[0_4px_12px_rgba(0,0,0,0.015)] hover:shadow-lg transition-all duration-500 ease-out min-w-[210px] hover:min-w-[320px] group/chip snap-start cursor-pointer border-l-4 border-l-red-500 overflow-hidden relative">
                  <div className="flex items-center gap-3">
                    <span className={`p-2.5 rounded-xl flex items-center justify-center shrink-0 border ${lowStockItems.length > 0 ? 'bg-rose-50 text-red-500 border-rose-100 animate-pulse' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                      <AlertTriangle className="h-5 w-5" />
                    </span>
                    <div>
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Low Stock Items</span>
                      <p className={`text-xl font-black font-display tracking-tight mt-0.5 ${lowStockItems.length > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                        <AnimatedNumber value={lowStockItems.length} />
                      </p>
                    </div>
                  </div>
                  
                  {/* Expanded Content with Trend Line */}
                  <div className="w-0 opacity-0 group-hover/chip:w-28 group-hover/chip:opacity-100 transition-all duration-500 ease-out overflow-hidden flex flex-col items-end justify-center pl-3 border-l border-slate-100 ml-auto">
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Weekly Trend</span>
                    <MiniSparkline color="#ef4444" seed={4} />
                  </div>
                </div>

                {/* Chip 5: To Collect BDT */}
                <div className="flex-shrink-0 flex items-center gap-4 bg-white border border-slate-200/70 rounded-2xl px-5 py-4 shadow-[0_4px_12px_rgba(0,0,0,0.015)] hover:shadow-lg transition-all duration-500 ease-out min-w-[210px] hover:min-w-[320px] group/chip snap-start cursor-pointer border-l-4 border-l-teal-500 overflow-hidden relative">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-xl bg-teal-50 text-teal-500 border border-teal-100 flex items-center justify-center shrink-0">
                      <ArrowRightLeft className="h-5 w-5" />
                    </span>
                    <div>
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">To Collect BDT</span>
                      <p className="text-xl font-black text-slate-800 font-display tracking-tight mt-0.5">
                        {showValues ? <AnimatedNumber value={totalReceivables} /> : <span className="text-sm font-bold text-slate-400">৳ Hidden</span>}
                      </p>
                    </div>
                  </div>
                  
                  {/* Expanded Content with Trend Line */}
                  <div className="w-0 opacity-0 group-hover/chip:w-28 group-hover/chip:opacity-100 transition-all duration-500 ease-out overflow-hidden flex flex-col items-end justify-center pl-3 border-l border-slate-100 ml-auto">
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Weekly Trend</span>
                    <MiniSparkline color="#14b8a6" seed={5} />
                  </div>
                </div>

                {/* Chip 6: To Pay BDT */}
                <div className="flex-shrink-0 flex items-center gap-4 bg-white border border-slate-200/70 rounded-2xl px-5 py-4 shadow-[0_4px_12px_rgba(0,0,0,0.015)] hover:shadow-lg transition-all duration-500 ease-out min-w-[210px] hover:min-w-[320px] group/chip snap-start cursor-pointer border-l-4 border-l-orange-500 overflow-hidden relative">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-xl bg-orange-50 text-brand-orange border border-orange-100 flex items-center justify-center shrink-0">
                      <ArrowUpRight className="h-5 w-5" />
                    </span>
                    <div>
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">To Pay BDT</span>
                      <p className="text-xl font-black text-slate-800 font-display tracking-tight mt-0.5">
                        {showValues ? <AnimatedNumber value={totalPayables} /> : <span className="text-sm font-bold text-slate-400">৳ Hidden</span>}
                      </p>
                    </div>
                  </div>
                  
                  {/* Expanded Content with Trend Line */}
                  <div className="w-0 opacity-0 group-hover/chip:w-28 group-hover/chip:opacity-100 transition-all duration-500 ease-out overflow-hidden flex flex-col items-end justify-center pl-3 border-l border-slate-100 ml-auto">
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Weekly Trend</span>
                    <MiniSparkline color="#f97316" seed={6} />
                  </div>
                </div>

                {/* Chip 7: Total Customers */}
                <div 
                  onClick={() => onTabChange('sales', 'customers')}
                  className="flex-shrink-0 flex items-center gap-4 bg-white border border-slate-200/70 rounded-2xl px-5 py-4 shadow-[0_4px_12px_rgba(0,0,0,0.015)] hover:shadow-lg transition-all duration-500 ease-out min-w-[210px] hover:min-w-[320px] group/chip snap-start cursor-pointer border-l-4 border-l-indigo-500 overflow-hidden relative"
                >
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-xl bg-indigo-50 text-indigo-500 border border-indigo-100 flex items-center justify-center shrink-0">
                      <Icons.Users className="h-5 w-5" />
                    </span>
                    <div>
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Total Customers</span>
                      <p className="text-xl font-black text-slate-800 font-display tracking-tight mt-0.5">
                        <AnimatedNumber value={customers.length} />
                      </p>
                    </div>
                  </div>
                  
                  {/* Expanded Content with Trend Line */}
                  <div className="w-0 opacity-0 group-hover/chip:w-28 group-hover/chip:opacity-100 transition-all duration-500 ease-out overflow-hidden flex flex-col items-end justify-center pl-3 border-l border-slate-100 ml-auto">
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Growth Rate</span>
                    <MiniSparkline color="#6366f1" seed={7} />
                  </div>
                </div>

                {/* Chip 8: Total Suppliers */}
                <div 
                  onClick={() => onTabChange('purchase', 'suppliers')}
                  className="flex-shrink-0 flex items-center gap-4 bg-white border border-slate-200/70 rounded-2xl px-5 py-4 shadow-[0_4px_12px_rgba(0,0,0,0.015)] hover:shadow-lg transition-all duration-500 ease-out min-w-[210px] hover:min-w-[320px] group/chip snap-start cursor-pointer border-l-4 border-l-cyan-500 overflow-hidden relative"
                >
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-xl bg-cyan-50 text-cyan-500 border border-cyan-100 flex items-center justify-center shrink-0">
                      <Icons.Truck className="h-5 w-5" />
                    </span>
                    <div>
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Total Suppliers</span>
                      <p className="text-xl font-black text-slate-800 font-display tracking-tight mt-0.5">
                        <AnimatedNumber value={suppliers.length} />
                      </p>
                    </div>
                  </div>
                  
                  {/* Expanded Content with Trend Line */}
                  <div className="w-0 opacity-0 group-hover/chip:w-28 group-hover/chip:opacity-100 transition-all duration-500 ease-out overflow-hidden flex flex-col items-end justify-center pl-3 border-l border-slate-100 ml-auto">
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Coverage</span>
                    <MiniSparkline color="#06b6d4" seed={8} />
                  </div>
                </div>
              </div>
            </div>
          );
        }

        if (sectionId === 'analytics') {
          // Asymmetric visual configuration: 2/3 Area Chart + 1/3 Stacked Comparison Bars
          const comparativeData = [
            { name: 'Revenue', value: totalRevenue, fill: '#10b981' },
            { name: 'Receivables', value: totalReceivables, fill: '#14b8a6' },
            { name: 'Payables', value: totalPayables, fill: '#f97316' },
          ];
          
          return (
            <div key="analytics" className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative group border border-transparent hover:border-brand-orange/15 rounded-[2rem] p-1.5 transition-all duration-300 mb-8">
              {renderControls('analytics', index)}
              
              {/* Left Column: Curved Area Chart (2/3 width) */}
              <div className="lg:col-span-2 bg-white border border-slate-200/90 p-7 rounded-3xl shadow-[0_15px_45px_rgba(0,0,0,0.01)] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="text-[9px] text-brand-orange font-black tracking-widest uppercase block">Operational Performance</span>
                    <h3 className="text-base font-black text-slate-800 font-display">Sales Analytics Curve</h3>
                    <p className="text-xs text-slate-400 font-sans font-medium mt-0.5">Checkout Sales Trend Ledger — Last 7 Days</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                    <span className="h-2 w-2 rounded-full bg-brand-orange animate-pulse"></span>
                    <span>Daily Sales (৳)</span>
                  </div>
                </div>

                <div className="w-full h-64 font-sans">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sales7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `৳${(val/1000)}k`} />
                      <RechartsTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-slate-950 text-white p-3.5 rounded-xl border border-slate-800 shadow-2xl text-xs font-sans">
                                <p className="font-extrabold text-slate-400 mb-0.5">{payload[0].payload.date}</p>
                                <p className="text-brand-orange font-black text-sm">৳{payload[0].value?.toLocaleString()}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area type="monotone" dataKey="sales" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Right Column: Comparison Bar Meters (1/3 width) - Pure asymmetric layout */}
              <div className="lg:col-span-1 bg-white border border-slate-200/90 p-7 rounded-3xl shadow-[0_15px_45px_rgba(0,0,0,0.01)] flex flex-col justify-between">
                <div>
                  <span className="text-[9px] text-brand-orange font-black tracking-widest uppercase block">Financial Mix</span>
                  <h3 className="text-base font-black text-slate-800 font-display">Asymmetric Comparison</h3>
                  <p className="text-xs text-slate-400 font-sans font-medium mt-0.5">Asset & Liability Ledger Snapshot</p>
                </div>

                <div className="w-full h-48 mt-4 font-sans">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparativeData} barSize={28}>
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis hide />
                      <RechartsTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-slate-950 text-white p-3 rounded-xl border border-slate-800 shadow-2xl text-xs font-sans">
                                <p className="font-extrabold text-slate-300 mb-0.5">{payload[0].name}</p>
                                <p className="font-black text-emerald-400 text-sm">৳{payload[0].value?.toLocaleString()}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {comparativeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs font-sans">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                      <span className="text-slate-500 font-bold">Total Sales</span>
                    </div>
                    <span className="font-black text-slate-800">৳{totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-teal-500"></span>
                      <span className="text-slate-500 font-bold">Receivables</span>
                    </div>
                    <span className="font-black text-slate-800">৳{totalReceivables.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-brand-orange"></span>
                      <span className="text-slate-500 font-bold">Payables</span>
                    </div>
                    <span className="font-black text-slate-800">৳{totalPayables.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        if (sectionId === 'shortcuts_recent') {
          return (
            <div key="shortcuts_recent" className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative group border border-transparent hover:border-brand-orange/15 rounded-[2rem] p-1.5 transition-all duration-300 mb-8">
              {renderControls('shortcuts_recent', index)}
              
              {/* Asymmetric Left Activity Feed (2/3 width) - Timeline-style with vertical dotted lines */}
              <div className="lg:col-span-2 bg-white border border-slate-200/90 p-7 rounded-3xl shadow-[0_15px_45px_rgba(0,0,0,0.01)] relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <span className="text-[9px] text-brand-orange font-black tracking-widest uppercase block">Live Operational Stream</span>
                      {editingTitleKey === 'recent_sales' ? (
                        <div className="flex items-center gap-1 z-50 relative mt-1">
                          <input
                            type="text"
                            value={editingTitleValue}
                            onChange={(e) => setEditingTitleValue(e.target.value)}
                            className="bg-slate-50 text-xs font-bold rounded-xl p-2 text-slate-700 border border-slate-200"
                          />
                          <button onClick={() => saveTitleEdit('recent_sales')} className="p-1 bg-emerald-500 text-white rounded"><Check className="h-3 w-3" /></button>
                        </div>
                      ) : (
                        <h3
                          onDoubleClick={() => {
                            if (isVisualEditMode) {
                              setEditingTitleKey('recent_sales');
                              setEditingTitleValue(customTitles['recent_sales']);
                            }
                          }}
                          className="text-base font-black text-slate-800 font-display flex items-center gap-2 cursor-pointer"
                        >
                          <span>{customTitles['recent_sales']}</span>
                          {isVisualEditMode && <Edit3 className="h-4 w-4 text-brand-orange opacity-60" />}
                        </h3>
                      )}
                      <p className="text-xs text-slate-400 mt-0.5 font-medium">Real-time chronologic activity pipeline</p>
                    </div>
                    <button
                      onClick={() => onTabChange('sales', 'invoices')}
                      className="px-3.5 py-1.5 bg-brand-orange/10 hover:bg-brand-orange hover:text-white text-brand-orange font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer border border-brand-orange/15"
                    >
                      Launch Register <Icons.ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Vertical connecting line */}
                  <div className="absolute left-[2.85rem] top-28 bottom-10 border-l-2 border-dashed border-slate-100 pointer-events-none"></div>

                  <div className="space-y-6 relative z-10 font-sans">
                    {invoices.slice(-3).reverse().map((inv) => (
                      <div key={inv.id} className="flex items-start gap-4">
                        {/* Pulse dot icon aligned with vertical line */}
                        <div className="flex items-center justify-center w-11 h-11 rounded-full bg-slate-50 border-4 border-white text-brand-orange text-xs font-black shrink-0 shadow-sm relative group/dot">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-brand-orange/15 animate-ping opacity-60 pointer-events-none"></span>
                          <Icons.ShoppingBag className="h-4.5 w-4.5 text-brand-orange" />
                        </div>

                        {/* Timeline box card with distinct visual padding */}
                        <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl p-4.5 flex items-center justify-between flex-1 transition-all hover:scale-[1.005] shadow-[0_4px_12px_rgba(0,0,0,0.005)]">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-slate-900/5 text-slate-700 text-xs font-extrabold flex items-center justify-center border border-slate-100 shadow-inner">
                              {inv.customerName.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-slate-800 text-sm">{inv.customerName}</span>
                                <span className="text-[10px] text-slate-400 font-mono">({inv.invoiceNo})</span>
                              </div>
                              <p className="text-[10px] text-slate-400 font-medium mt-1">Transaction recorded on {inv.date}</p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-black text-sm text-slate-900 block">{formatCurrency(inv.total)}</span>
                            <span
                              className={`inline-block px-2.5 py-0.5 text-[9px] font-black rounded-full border mt-1.5 ${
                                inv.paymentMethod === 'Cash'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border-rose-100'
                              }`}
                            >
                              {inv.paymentMethod}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {invoices.length === 0 && (
                      <div className="text-center py-8 text-slate-400 font-medium leading-relaxed">
                        No sales recorded yet. Start checkouts in POS tab!
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Asymmetric Right Quick Actions: Floating Organic Circular Cluster (1/3 width, NOT a grid) */}
              <div className="lg:col-span-1 bg-[#10121d] border border-slate-900 shadow-[0_15px_40px_rgba(0,0,0,0.35)] rounded-3xl p-7 flex flex-col justify-between text-white min-h-[300px] relative overflow-hidden">
                <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-brand-orange/15 blur-[60px] rounded-full pointer-events-none"></div>
                
                <div>
                  <span className="text-[9px] text-brand-orange font-black tracking-widest uppercase block">Operational Console</span>
                  <h3 className="text-base font-black text-slate-100 font-display mt-0.5">Quick Launcher Cluster</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Hover icons to peek launcher targets</p>
                </div>

                {/* Floating asymmetrical cluster container */}
                <div className="relative h-64 mt-4 w-full">
                  
                  {/* Center Button: POS Checkout (larger with dynamic pulse shadow) */}
                  <div
                    onClick={() => onTabChange('sales', 'pos')}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-18 h-18 z-30 group cursor-pointer"
                  >
                    <div className="relative w-full h-full flex items-center justify-center">
                      <div className="h-18 w-18 rounded-full bg-gradient-to-tr from-brand-orange to-amber-500 hover:scale-110 active:scale-95 transition-all duration-300 shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] flex items-center justify-center border-4 border-[#10121d]">
                        <Icons.ShoppingBag className="h-7 w-7 text-white" />
                      </div>
                      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-950 border border-slate-800 text-[10px] font-black tracking-wider uppercase text-brand-orange px-2.5 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none scale-90 group-hover:scale-100 z-50">
                        POS Checkout
                      </span>
                    </div>
                  </div>

                  {/* Top-Left Orbit: Add Product */}
                  <div
                    onClick={() => onTabChange('inventory', 'products')}
                    className="absolute top-4 left-6 w-12 h-12 z-20 group cursor-pointer"
                  >
                    <div className="relative w-full h-full flex items-center justify-center">
                      <div className="h-12 w-12 rounded-full bg-slate-800/80 hover:bg-brand-orange text-white flex items-center justify-center border border-slate-700 hover:border-brand-orange shadow-lg hover:scale-105 transition-all duration-300">
                        <Icons.Boxes className="h-5 w-5" />
                      </div>
                      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-950 border border-slate-800 text-[9px] font-bold tracking-wide text-slate-200 px-2.5 py-1 rounded-md shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none scale-90 group-hover:scale-100 z-50">
                        Add Product
                      </span>
                    </div>
                  </div>

                  {/* Top-Right Orbit: Add Customer */}
                  <div
                    onClick={() => onTabChange('sales', 'customers')}
                    className="absolute top-4 right-6 w-12 h-12 z-20 group cursor-pointer"
                  >
                    <div className="relative w-full h-full flex items-center justify-center">
                      <div className="h-12 w-12 rounded-full bg-slate-800/80 hover:bg-indigo-600 text-white flex items-center justify-center border border-slate-700 hover:border-indigo-600 shadow-lg hover:scale-105 transition-all duration-300">
                        <Icons.UserPlus className="h-5 w-5" />
                      </div>
                      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-950 border border-slate-800 text-[9px] font-bold tracking-wide text-slate-200 px-2.5 py-1 rounded-md shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none scale-90 group-hover:scale-100 z-50">
                        New Customer
                      </span>
                    </div>
                  </div>

                  {/* Bottom-Left Orbit: Purchase Order */}
                  <div
                    onClick={() => onTabChange('purchase', 'purchase_orders')}
                    className="absolute bottom-4 left-6 w-12 h-12 z-20 group cursor-pointer"
                  >
                    <div className="relative w-full h-full flex items-center justify-center">
                      <div className="h-12 w-12 rounded-full bg-slate-800/80 hover:bg-emerald-600 text-white flex items-center justify-center border border-slate-700 hover:border-emerald-600 shadow-lg hover:scale-105 transition-all duration-300">
                        <Icons.ArrowRightLeft className="h-5 w-5" />
                      </div>
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-950 border border-slate-800 text-[9px] font-bold tracking-wide text-slate-200 px-2.5 py-1 rounded-md shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none scale-90 group-hover:scale-100 z-50">
                        Procure Items
                      </span>
                    </div>
                  </div>

                  {/* Bottom-Right Orbit: Favorites Menu */}
                  <div
                    onClick={() => onTabChange('dashboard', 'favorites')}
                    className="absolute bottom-4 right-6 w-12 h-12 z-20 group cursor-pointer"
                  >
                    <div className="relative w-full h-full flex items-center justify-center">
                      <div className="h-12 w-12 rounded-full bg-slate-800/80 hover:bg-amber-500 text-white flex items-center justify-center border border-slate-700 hover:border-amber-500 shadow-lg hover:scale-105 transition-all duration-300">
                        <Icons.Star className="h-5 w-5" />
                      </div>
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-950 border border-slate-800 text-[9px] font-bold tracking-wide text-slate-200 px-2.5 py-1 rounded-md shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none scale-90 group-hover:scale-100 z-50">
                        Bookmark Menu
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        if (sectionId === 'alerts_outstanding') {
          return (
            <div key="alerts_outstanding" className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative group border border-transparent hover:border-brand-orange/15 rounded-[2rem] p-1.5 transition-all duration-300 mb-8">
              {renderControls('alerts_outstanding', index)}
              
              {/* Asymmetric Left Inventory Alert Zone with horizontal stock ticker (2/3 width) */}
              <div className="lg:col-span-2 bg-white border border-slate-200/90 p-7 rounded-3xl shadow-[0_15px_45px_rgba(0,0,0,0.01)] relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-[9px] text-brand-orange font-black tracking-widest uppercase block">Fulfillment Alerts</span>
                      <h3 className="text-base font-black text-slate-800 font-display mt-0.5">Live Stock Replenishment</h3>
                      <p className="text-xs text-slate-400 font-medium">Critical minimum threshold notifications</p>
                    </div>
                    <button
                      onClick={() => setIsLowStockDrawerOpen(!isLowStockDrawerOpen)}
                      className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-extrabold text-xs rounded-xl transition-all border border-slate-200 flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <span>Procurement Log</span>
                      {isLowStockDrawerOpen ? <Icons.ChevronUp className="h-4 w-4" /> : <Icons.ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Horizontal infinite sliding ticker tape */}
                  <div className="relative py-3 bg-red-50/40 border-y border-red-100/50 rounded-2xl overflow-hidden w-full flex items-center my-4">
                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
                    
                    <div className="flex gap-8 items-center animate-[marquee_25s_linear_infinite] whitespace-nowrap select-none font-sans">
                      {lowStockItems.length === 0 ? (
                        <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs px-4">
                          <CheckCircle className="h-4 w-4 shrink-0" />
                          <span>All products are healthy & fully stocked in primary warehouse terminals!</span>
                        </div>
                      ) : (
                        [...lowStockItems, ...lowStockItems, ...lowStockItems].map((p, idx) => (
                          <div key={`${p.id}-${idx}`} className="inline-flex items-center gap-2.5 bg-white border border-red-100 shadow-[0_4px_10px_rgba(239,68,68,0.03)] px-3.5 py-2 rounded-xl text-xs font-bold shrink-0">
                            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 animate-pulse" />
                            <span className="text-slate-800">{p.name}</span>
                            <span className="text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded font-black uppercase tracking-wider">{p.stock} {p.unit} LEFT</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Collapsible Procurement Drawer */}
                  <div className={`transition-all duration-500 ease-out overflow-hidden ${isLowStockDrawerOpen ? 'max-h-72 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                    <div className="border border-slate-100 bg-slate-50/40 p-4.5 rounded-2xl space-y-3 max-h-60 overflow-y-auto custom-scrollbar font-sans">
                      {lowStockItems.map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-3 bg-white border border-slate-200/60 rounded-xl hover:shadow-xs transition-shadow">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-50 text-red-500">
                              <AlertTriangle className="h-4 w-4" />
                            </div>
                            <div>
                              <span className="text-xs font-extrabold text-slate-800 block">{p.name}</span>
                              <span className="text-[9px] text-slate-400 font-mono mt-0.5">SKU: {p.sku} • {p.warehouse}</span>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-4">
                            <div>
                              <span className="text-[10px] font-black text-red-600 block">
                                {p.stock} {p.unit} Left
                              </span>
                              <span className="text-[9px] text-slate-400 font-bold">Alert Level: {p.alertQty}</span>
                            </div>
                            <button
                              onClick={() => onTabChange('inventory', 'products')}
                              className="px-3 py-1.5 bg-slate-950 hover:bg-brand-orange hover:text-white text-white text-[10px] font-black rounded-lg transition-colors cursor-pointer"
                            >
                              Replenish
                            </button>
                          </div>
                        </div>
                      ))}
                      {lowStockItems.length === 0 && (
                        <div className="text-center py-6 text-slate-400 text-xs font-medium">
                          No active procurement tasks required at this moment.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Asymmetric Right Overlapping 3D Balance Sheet Ledger Card (1/3 width, with interactive state) */}
              <div className="lg:col-span-1 flex flex-col mb-4 lg:mb-0">
                {/* Visual Tab Switcher */}
                <div className="flex items-center justify-between mb-4 px-1">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
                    Double Entry Ledger
                  </span>
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60 shadow-inner">
                    <button
                      onClick={() => setActiveLedgerCard('payable')}
                      className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                        activeLedgerCard === 'payable'
                          ? 'bg-slate-950 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Payable
                    </button>
                    <button
                      onClick={() => setActiveLedgerCard('receivable')}
                      className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                        activeLedgerCard === 'receivable'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Receivable
                    </button>
                  </div>
                </div>

                {/* 3D Dynamic Card Stack */}
                <div className="relative min-h-[380px] select-none">
                  {/* Underlapping/Overlapping Card 1 (Asset: Receivable) */}
                  <div
                    onClick={() => {
                      if (activeLedgerCard !== 'receivable') {
                        setActiveLedgerCard('receivable');
                      }
                    }}
                    className={`absolute inset-x-0 rounded-3xl p-6 shadow-2xl transition-all duration-500 ease-out flex flex-col justify-between ${
                      activeLedgerCard === 'receivable'
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white z-20 scale-100 rotate-0 top-0 bottom-16 opacity-100'
                        : 'bg-gradient-to-br from-emerald-600/90 to-teal-700/90 text-emerald-100 z-10 scale-95 -rotate-3 top-12 bottom-0 cursor-pointer hover:scale-98 hover:-translate-y-1 opacity-95'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-80">
                        Asset Balance {activeLedgerCard !== 'receivable' && '• Click to view'}
                      </span>
                      <Icons.ArrowRight className="h-4.5 w-4.5 opacity-80" />
                    </div>
                    
                    <div className="mt-6">
                      <span className="text-[10px] font-bold uppercase tracking-widest block opacity-75">Receivable Balance</span>
                      <p className="text-3xl font-black font-display tracking-tight text-white mt-1">
                        {displayVal(totalReceivables)}
                      </p>
                      <p className="text-[10px] mt-1 font-semibold leading-relaxed opacity-80">Amount outstanding from customers</p>
                    </div>
                    
                    <button
                      disabled={activeLedgerCard !== 'receivable'}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTabChange('sales', 'customers');
                      }}
                      className={`mt-6 w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/10 ${
                        activeLedgerCard === 'receivable' ? 'cursor-pointer' : 'cursor-default opacity-50'
                      }`}
                    >
                      Customer Directory
                    </button>
                  </div>

                  {/* Underlapping/Overlapping Card 2 (Liability: Payable) */}
                  <div
                    onClick={() => {
                      if (activeLedgerCard !== 'payable') {
                        setActiveLedgerCard('payable');
                      }
                    }}
                    className={`absolute inset-x-0 rounded-3xl p-6 shadow-2xl border transition-all duration-500 ease-out flex flex-col justify-between ${
                      activeLedgerCard === 'payable'
                        ? 'bg-slate-950 border-slate-900 text-white z-20 scale-100 rotate-0 top-0 bottom-16 opacity-100'
                        : 'bg-slate-900 border-slate-850 text-slate-400 z-10 scale-95 rotate-3 top-12 bottom-0 cursor-pointer hover:scale-98 hover:-translate-y-1 opacity-95'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-widest text-brand-orange">
                        Liability Balance {activeLedgerCard !== 'payable' && '• Click to view'}
                      </span>
                      <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/10 flex items-center justify-center shrink-0">
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </div>
                    
                    <div className="mt-6">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Payable Balance</span>
                      <p className="text-3xl font-black font-display tracking-tight text-white mt-1">
                        {displayVal(totalPayables)}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 font-semibold leading-relaxed">Amount due to trade suppliers</p>
                    </div>
                    
                    <button
                      disabled={activeLedgerCard !== 'payable'}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTabChange('purchase', 'purchase_orders');
                      }}
                      className={`mt-6 w-full py-2.5 bg-gradient-to-r from-brand-orange to-amber-500 hover:from-brand-orange-hover hover:to-amber-600 text-white rounded-xl text-xs font-black shadow-lg shadow-brand-orange/20 transition-all ${
                        activeLedgerCard === 'payable' ? 'cursor-pointer' : 'cursor-default opacity-50'
                      }`}
                    >
                      Procurement Register
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        return null;
      })}

      {/* Invisible spacer row */}
      <div className="h-10"></div>
    </div>
  );
}
