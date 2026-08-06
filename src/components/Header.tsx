import { useEffect, useState } from 'react';
import { ChevronDown, Calendar, Clock, LogOut, Building, Check, Sliders, Search, CheckCircle2, X } from 'lucide-react';
import { AppSettings, Branch } from '../types';

interface HeaderProps {
  currentTab: string;
  currentSubTab: string;
  onTabChange: (tab: string, subTab?: string) => void;
  settings?: AppSettings;
  isVisualEditMode?: boolean;
  onToggleVisualEditMode?: () => void;
  currentUser?: any;
  onLogout?: () => void;
  branches?: Branch[];
  currentBranchId?: string;
  onBranchSelect?: (branchId: string) => void;
}

export default function Header({
  currentTab,
  currentSubTab,
  onTabChange,
  isVisualEditMode = false,
  onToggleVisualEditMode,
  currentUser,
  onLogout,
  branches = [],
  currentBranchId = 'all',
  onBranchSelect,
}: HeaderProps) {
  const [time, setTime] = useState(new Date());
  const [isBranchMenuOpen, setIsBranchMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [branchToast, setBranchToast] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeBranch = branches.find((b) => b.id === currentBranchId);
  const isAllBranches = currentBranchId === 'all';

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleBranchClick = (branchId: string, branchName: string, branchCode?: string) => {
    if (onBranchSelect) {
      onBranchSelect(branchId);
    }
    setIsBranchMenuOpen(false);

    if (branchId === 'all') {
      setBranchToast({
        title: '🌐 সকল শাখা (একত্রিত ভিউ)',
        message: 'সকল শাখার কনসোলিডেটেড রিপোর্ট ও ওভারভিউ ফিল্টার সক্রিয় করা হয়েছে।',
      });
    } else {
      setBranchToast({
        title: `🏢 শাখা পরিবর্তন: ${branchName}`,
        message: `সফলভাবে "${branchName}" (${branchCode || 'BR'}) শাখায় স্যুইচ করা হয়েছে। সকল ডাটা ও স্টক এখন এই শাখা অনুযায়ী ফিল্টার হবে।`,
      });
    }

    setTimeout(() => {
      setBranchToast(null);
    }, 4500);
  };

  const filteredBranches = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.branchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.managerName && b.managerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getTabLabel = (tab: string) => {
    const labels: Record<string, string> = {
      dashboard: 'Dashboard',
      inventory: 'Inventory',
      purchase: 'Purchase',
      sales: 'Sales',
      banking: 'Banking',
      accounting: 'Accounting',
      loan: 'Loan',
      reports: 'Reports',
      gridReport: 'Grid Report',
      rdlReport: 'Report Designer',
      settings: 'Settings',
      employee: 'Employee',
      salary: 'Salary',
      crm: 'CRM',
      projects: 'Projects',
      manufacturing: 'Manufacturing',
      service: 'Service & RMA',
      documents: 'Document Center',
      workflow: 'Workflow Approval',
      ai: 'AI Assistant',
      integration: 'System Integration',
    };
    return labels[tab] || tab;
  };

  const getSubTabLabel = (subTab: string) => {
    return subTab
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <header className="h-16 glass-header px-6 flex items-center justify-between shrink-0 select-none z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      {/* Breadcrumb / Section indicator */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-extrabold text-slate-800 font-display tracking-tight uppercase">
          {getTabLabel(currentTab)}
        </span>
        {currentSubTab && (
          <>
            <span className="text-slate-300 text-xs font-semibold">/</span>
            <span className="text-[10px] font-black text-brand-orange bg-brand-orange/10 border border-brand-orange/15 px-2.5 py-0.5 rounded-full font-sans tracking-wide uppercase">
              {getSubTabLabel(currentSubTab)}
            </span>
          </>
        )}
      </div>

      {/* Right side items */}
      <div className="flex items-center gap-4">
        {/* Live clock and date */}
        <div className="hidden md:flex items-center gap-3 text-xs font-mono text-slate-500 bg-white/60 border border-slate-200/50 rounded-xl px-3 py-1.5 shadow-xs">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-brand-orange" />
            <span>{formatDate(time)}</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-brand-orange" />
            <span className="font-semibold text-slate-700">{formatTime(time)}</span>
          </div>
        </div>

        {/* Store branch switcher dropdown */}
        <div className="flex items-center gap-2">
          {onToggleVisualEditMode && (
            <button
              onClick={onToggleVisualEditMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all border cursor-pointer ${
                isVisualEditMode
                  ? 'bg-brand-orange hover:bg-brand-orange-hover text-white border-brand-orange shadow-md shadow-brand-orange/20 animate-pulse'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
              title="Toggle Drag & Drop Page/Form Customizer"
            >
              <span>🛠️</span>
              <span>{isVisualEditMode ? 'Visual Customizer Active' : 'Customize Layout'}</span>
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setIsBranchMenuOpen(!isBranchMenuOpen)}
              className="flex items-center gap-2 border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-1.5 bg-white/90 text-xs font-semibold text-slate-700 transition-all cursor-pointer shadow-xs hover:bg-slate-50"
            >
              <div className={`h-2 w-2 rounded-full ${isAllBranches ? 'bg-indigo-600' : 'bg-emerald-500'} animate-pulse`}></div>
              <span className="truncate max-w-[200px]">
                {isAllBranches
                  ? '🌐 সকল শাখা (একত্রিত ভিউ)'
                  : `${activeBranch?.branchCode || 'BR'} — ${activeBranch?.name || 'শাখা'}`}
              </span>
              <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isBranchMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isBranchMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsBranchMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-2 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="p-2 border-b border-slate-100 mb-1 flex items-center justify-between">
                    <div>
                      <p className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider">শাখা নির্বাচন করুন ({branches.length} টি শাখা)</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">অ্যাক্টিভ শাখা অনুযায়ী ডাটা ও স্টক ফিল্টার হবে</p>
                    </div>
                  </div>

                  {/* Branch Search Input */}
                  {branches.length > 3 && (
                    <div className="px-1 pb-1.5">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="শাখা খুঁজুন (নাম বা কোড)..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                        />
                      </div>
                    </div>
                  )}

                  {/* All Branches option */}
                  <button
                    onClick={() => handleBranchClick('all', 'সকল শাখা (একত্রিত ভিউ)')}
                    className={`flex items-center justify-between w-full text-left p-2.5 rounded-xl transition-all font-bold ${
                      isAllBranches
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-indigo-600" />
                      <div>
                        <span className="block text-xs font-bold">সকল শাখা (একত্রিত ভিউ)</span>
                        <span className="block text-[9px] text-slate-400 font-normal">হেড অফিস কনসোলিডেটেড ডাটা</span>
                      </div>
                    </div>
                    {isAllBranches && <Check className="h-4 w-4 text-indigo-600" />}
                  </button>

                  <div className="border-t border-slate-100 my-1"></div>

                  {/* Individual Branches List */}
                  <div className="max-h-64 overflow-y-auto space-y-1 custom-scrollbar">
                    {filteredBranches.length === 0 ? (
                      <div className="p-3 text-center text-slate-400 text-xs font-medium">
                        কোনো শাখা পাওয়া যায়নি
                      </div>
                    ) : (
                      filteredBranches.map((b) => {
                        const isSelected = currentBranchId === b.id;
                        return (
                          <button
                            key={b.id}
                            onClick={() => handleBranchClick(b.id, b.name, b.branchCode)}
                            className={`flex items-center justify-between w-full text-left p-2.5 rounded-xl transition-all ${
                              isSelected
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-bold shadow-xs'
                                : 'text-slate-700 hover:bg-slate-100 font-semibold'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="px-1.5 py-0.5 bg-slate-100 font-mono text-[9px] font-bold text-slate-600 rounded shrink-0">
                                {b.branchCode}
                              </span>
                              <div className="truncate">
                                <span className="truncate text-xs block font-bold">{b.name}</span>
                                {b.isMainBranch && (
                                  <span className="text-[9px] text-amber-600 font-semibold block">★ প্রধান শাখা</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {b.status === 'Inactive' && (
                                <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 text-[9px] font-bold rounded">
                                  নিষ্ক্রিয়
                                </span>
                              )}
                              {isSelected && <Check className="h-4 w-4 text-emerald-600" />}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-1 mt-1">
                    <button
                      onClick={() => {
                        onTabChange('settings', 'branches');
                        setIsBranchMenuOpen(false);
                      }}
                      className="flex items-center justify-center gap-2 w-full text-center p-2 rounded-xl text-indigo-600 hover:bg-indigo-50 font-bold text-[11px] transition-colors"
                    >
                      <Sliders className="h-3.5 w-3.5" />
                      <span>শাখা সেটিংস ও ম্যানেজমেন্ট (+ নতুন যোগ করুন)</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* User profile with initials avatar */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="flex flex-col text-right hidden sm:flex">
            <span className="text-xs font-black text-slate-800 tracking-tight">{currentUser?.name || 'Rony Mia'}</span>
            <span className="text-[9px] font-black text-brand-orange bg-brand-orange/10 border border-brand-orange/15 px-1.5 py-0.5 rounded uppercase mt-0.5 tracking-wider self-end">{currentUser?.role || 'Admin'}</span>
          </div>
          <div className="relative group">
            <button className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-orange to-amber-500 text-white font-black text-xs flex items-center justify-center cursor-pointer shadow-md shadow-brand-orange/10 uppercase transition-transform hover:scale-105 active:scale-95 duration-150">
              {currentUser?.avatar || (currentUser?.name ? currentUser.name[0] : 'RM')}
            </button>
            {/* Quick dropdown menu on hover / click */}
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200/80 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 p-1">
              <div className="p-3 border-b border-slate-100 text-xs text-left">
                <p className="font-extrabold text-slate-800">{currentUser?.name || 'Rony Mia'}</p>
                <p className="text-slate-400 font-mono mt-0.5 text-[10px] truncate">{currentUser?.email || 'ronymia2022@gmail.com'}</p>
              </div>
              <div className="p-1 space-y-0.5">
                <button
                  onClick={() => onTabChange('settings', 'system_settings')}
                  className="w-full text-left px-3 py-2 text-xs text-slate-600 hover:bg-brand-orange/10 hover:text-brand-orange rounded-lg transition-colors font-semibold cursor-pointer"
                >
                  System Settings
                </button>
                <button
                  onClick={() => onTabChange('employee', 'employees_list')}
                  className="w-full text-left px-3 py-2 text-xs text-slate-600 hover:bg-brand-orange/10 hover:text-brand-orange rounded-lg transition-colors font-semibold cursor-pointer"
                >
                  My Profile
                </button>
                <div className="border-t border-slate-100 my-1 mx-2"></div>
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-2 text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-bold cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout Session</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Branch switch notification toast banner */}
      {branchToast && (
        <div className="fixed top-20 right-6 z-50 max-w-md bg-slate-900/95 text-white border border-emerald-500/50 rounded-2xl p-4 shadow-2xl flex items-start gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0 pr-1">
            <h5 className="font-bold text-xs text-emerald-400 font-display flex items-center gap-1.5">
              <span>{branchToast.title}</span>
            </h5>
            <p className="text-[11px] text-slate-200 mt-1 leading-relaxed">
              {branchToast.message}
            </p>
          </div>
          <button
            onClick={() => setBranchToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="বন্ধ করুন"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </header>
  );
}
