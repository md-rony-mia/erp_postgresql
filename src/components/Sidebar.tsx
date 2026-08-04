import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { navEngine, NavigationItem, NavigationGroup, LiveBadgeKey } from '../lib/navigationEngine';

interface SidebarProps {
  currentTab: string;
  currentSubTab: string;
  onTabChange: (tab: string, subTab?: string) => void;
}

export default function Sidebar({ currentTab, currentSubTab, onTabChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const [activeLanguage, setActiveLanguage] = useState(navEngine.getLanguage());
  const [groups, setGroups] = useState<NavigationGroup[]>([]);
  const [items, setItems] = useState<NavigationItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [pinned, setPinned] = useState<string[]>([]);
  const [recents, setRecents] = useState<string[]>([]);

  const [lowStockCount, setLowStockCount] = useState(0);
  const [invoicesCount, setInvoicesCount] = useState(0);

  const syncWithEngine = () => {
    setGroups(navEngine.getGroups());
    setItems(navEngine.getItems());
    setFavorites(navEngine.getFavorites());
    setPinned(navEngine.getPinned());
    setRecents(navEngine.getRecents());
    setActiveLanguage(navEngine.getLanguage());

    const storedLowStockCount = localStorage.getItem('nexova_low_stock_count');
    const storedInvoicesCount = localStorage.getItem('nexova_invoices_count');
    if (storedLowStockCount !== null) {
      setLowStockCount(Number(storedLowStockCount));
    }
    if (storedInvoicesCount !== null) {
      setInvoicesCount(Number(storedInvoicesCount));
    }
  };

  useEffect(() => {
    syncWithEngine();
    const interval = setInterval(syncWithEngine, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const activeItem = navEngine.getItems().find(
      (item) => item.tab === currentTab && item.subTab === currentSubTab
    );
    if (activeItem) {
      setExpandedGroups((prev) => {
        // Only change if the current active group isn't already the only one expanded
        if (prev[activeItem.groupId]) return prev;
        const newState: Record<string, boolean> = {};
        newState[activeItem.groupId] = true;
        return newState;
      });
    }
  }, [currentTab, currentSubTab]);

  const handleLanguageToggle = () => {
    const nextLang = activeLanguage === 'en' ? 'bn' : 'en';
    navEngine.setLanguage(nextLang);
    setActiveLanguage(nextLang);
  };

  const t = (item: NavigationItem): string => {
    if (activeLanguage === 'bn' && item.translations && item.translations.bn) {
      return item.translations.bn;
    }
    return item.label;
  };

  const getTranslatedGroupLabel = (group: NavigationGroup): string => {
    if (activeLanguage === 'bn') {
      const bnMap: Record<string, string> = {
        'Dashboard': 'ড্যাশবোর্ড',
        'Sales': 'বিক্রয় মডিউল',
        'Purchase': 'ক্রয় মডিউল',
        'Inventory': 'ইনভেন্টরি',
        'Accounting': 'হিসাববিজ্ঞান',
        'CRM': 'গ্রাহক সম্পর্ক (CRM)',
        'HRM': 'কর্মী ব্যবস্থাপনা (HRM)',
        'Projects': 'প্রকল্পসমূহ',
        'Assets': 'সম্পদ ও লিজ',
        'Manufacturing': 'উৎপাদন মডিউল',
        'Reports': 'প্রতিবেদনসমূহ',
        'Administration': 'প্রশাসন',
        'Settings': 'সেটিংস',
      };
      return bnMap[group.label] || group.label;
    }
    return group.label;
  };

  const renderIcon = (iconName: string | undefined, className: string = "h-4 w-4") => {
    if (!iconName) return <Icons.Activity className={className} />;
    const IconComponent = (Icons as any)[iconName];
    if (IconComponent) {
      return <IconComponent className={className} />;
    }
    return <Icons.Boxes className={className} />;
  };

  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroups((prev) => {
      const isCurrentlyExpanded = !!prev[groupId];
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        newState[key] = false;
      });
      newState[groupId] = !isCurrentlyExpanded;
      return newState;
    });
  };

  const handleItemClick = (item: NavigationItem) => {
    navEngine.addRecent(item.id);
    setRecents(navEngine.getRecents());
    onTabChange(item.tab, item.subTab);
  };

  const handlePinToggle = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    navEngine.togglePinned(itemId);
    setPinned(navEngine.getPinned());
  };

  const handleFavoriteToggle = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    navEngine.toggleFavorite(itemId);
    setFavorites(navEngine.getFavorites());
  };

  const getBadgeValue = (key: string | undefined) => {
    if (!key) return null;
    return navEngine.getLiveBadgeValue(key as LiveBadgeKey, {
      lowStockCount,
      invoicesCount,
    });
  };

  const searchResults = searchQuery ? navEngine.fuzzySearch(searchQuery) : [];

  return (
    <aside
      className={`sidebar-mesh text-slate-300 flex flex-col h-screen select-none border-r border-slate-900 shrink-0 transition-all duration-300 relative ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand logo header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-900/85">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-orange to-amber-500 flex items-center justify-center shadow-lg active-glow-orange">
              <span className="font-display font-extrabold text-white text-lg tracking-wider">N</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-white text-md tracking-tight leading-none">NEXOVA</span>
              <span className="text-[9px] text-brand-orange font-bold tracking-wider mt-0.5 uppercase">ERP Suite</span>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-orange to-amber-500 flex items-center justify-center mx-auto shadow-lg active-glow-orange">
            <span className="font-display font-extrabold text-white text-md tracking-wider">N</span>
          </div>
        )}

        {/* Collapse and Language Controls */}
        {!isCollapsed && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleLanguageToggle}
              className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-900/80 text-brand-orange border border-slate-800/40 hover:bg-slate-800/80 hover:text-white transition-all cursor-pointer"
              title="Toggle Language (EN / BN)"
            >
              {activeLanguage === 'en' ? 'BN' : 'EN'}
            </button>
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 rounded bg-slate-900/40 text-slate-500 hover:text-white hover:bg-slate-800/50 cursor-pointer"
              title="Collapse Sidebar"
            >
              <Icons.ChevronLeft className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="absolute -right-3 top-5 z-50 h-6 w-6 rounded-full bg-brand-orange text-white flex items-center justify-center shadow-md border border-brand-orange hover:bg-brand-orange-hover active:scale-95 transition-all cursor-pointer"
          >
            <Icons.ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Sidebar search */}
      {!isCollapsed && (
        <div className="p-3">
          <div className="relative">
            <Icons.Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder={activeLanguage === 'bn' ? 'মেনু খুঁজুন...' : 'Search menu...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/60 text-xs text-slate-200 pl-8 pr-4 py-2 rounded-md border border-slate-800 focus:outline-none focus:border-brand-orange/80 focus:ring-1 focus:ring-brand-orange/20 transition-all placeholder-slate-600 font-medium"
            />
          </div>
        </div>
      )}

      {/* Dynamic Navigation Content scroll */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-6 space-y-1.5 mt-2">
        {/* FUZZY SEARCH RESULTS AREA */}
        {!isCollapsed && searchQuery && (
          <div className="space-y-1 border-b border-slate-900/60 pb-3 mb-3">
            <div className="px-2 text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-1 flex items-center gap-1.5">
              <Icons.Search className="h-3 w-3" />
              <span>Search Results ({searchResults.length})</span>
            </div>
            {searchResults.length === 0 ? (
              <div className="text-[10px] text-slate-600 font-semibold px-2 py-1 bg-slate-950/20 rounded">
                No items found
              </div>
            ) : (
              searchResults.map((item) => {
                const isSelected = currentTab === item.tab && currentSubTab === item.subTab;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                      isSelected ? 'bg-brand-orange text-white shadow-md active-glow-orange' : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {renderIcon(item.icon, "h-3.5 w-3.5")}
                      <span className="truncate max-w-[140px]">{t(item)}</span>
                    </div>
                    <span className="text-[9px] font-bold text-brand-orange capitalize bg-slate-950/60 px-1 rounded">
                      {item.groupId}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* QUICK ACCESS HUB: Favorites, Recent, Pinned */}
        {!isCollapsed && !searchQuery && (
          <div className="space-y-2 mb-3 bg-slate-950/40 p-2 rounded-xl border border-slate-900/60">
            {/* Pinned actions shortcut */}
            {pinned.length > 0 && (
              <div className="space-y-1">
                <div className="px-1 text-[9px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1">
                  <Icons.Pin className="h-2.5 w-2.5 text-brand-orange fill-brand-orange" />
                  <span>Pinned Actions</span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {pinned.map((pId) => {
                    const found = items.find(i => i.id === pId);
                    if (!found) return null;
                    const isSelected = currentTab === found.tab && currentSubTab === found.subTab;
                    return (
                      <button
                        key={pId}
                        onClick={() => handleItemClick(found)}
                        className={`text-left px-2 py-1.5 rounded-lg text-[10px] font-bold truncate flex items-center gap-1.5 transition-all ${
                          isSelected ? 'bg-brand-orange/20 text-brand-orange border border-brand-orange/30' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                        }`}
                        title={t(found)}
                      >
                        {renderIcon(found.icon, "h-3 w-3 shrink-0")}
                        <span className="truncate">{t(found)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Favorites shortcuts */}
            {favorites.length > 0 && (
              <div className="space-y-1">
                <div className="px-1 text-[9px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1">
                  <Icons.Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400" />
                  <span>Favorites</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {favorites.map((fId) => {
                    const found = items.find(i => i.id === fId);
                    if (!found) return null;
                    const isSelected = currentTab === found.tab && currentSubTab === found.subTab;
                    return (
                      <button
                        key={fId}
                        onClick={() => handleItemClick(found)}
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 transition-all border ${
                          isSelected ? 'bg-brand-orange border-brand-orange text-white font-black' : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        {renderIcon(found.icon, "h-2.5 w-2.5")}
                        <span className="truncate max-w-[70px]">{t(found)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Pages */}
            {recents.length > 0 && (
              <div className="space-y-1">
                <div className="px-1 text-[9px] font-bold text-slate-500 tracking-wider uppercase flex items-center gap-1">
                  <Icons.Clock className="h-2.5 w-2.5" />
                  <span>Recent Views</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  {recents.slice(0, 3).map((rId) => {
                    const found = items.find(i => i.id === rId);
                    if (!found) return null;
                    return (
                      <button
                        key={rId}
                        onClick={() => handleItemClick(found)}
                        className="w-full text-left px-1.5 py-1 rounded text-[10px] text-slate-500 hover:text-white hover:bg-slate-900/50 truncate flex items-center gap-1.5 font-medium"
                      >
                        <span className="w-1 h-1 rounded-full bg-brand-orange"></span>
                        <span className="truncate">{t(found)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* METADATA-DRIVEN GROUPED SIDEBAR NAVIGATION */}
        {groups.map((group) => {
          const groupItems = items.filter((item) => item.groupId === group.id);
          if (groupItems.length === 0) return null;

          const hasSelectedChild = groupItems.some(
            (item) => currentTab === item.tab && currentSubTab === item.subTab
          );
          const isExpanded = !!expandedGroups[group.id] || searchQuery !== '';

          if (isCollapsed) {
            return (
              <div key={group.id} className="relative group/mini flex justify-center py-1">
                <button
                  className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
                    hasSelectedChild
                      ? 'bg-brand-orange text-white shadow-md active-glow-orange'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                  title={getTranslatedGroupLabel(group)}
                >
                  {renderIcon(group.icon, "h-5 w-5")}
                </button>

                {/* Hover floating submenu for compact view */}
                <div className="absolute left-14 top-0 z-50 w-52 bg-brand-slate rounded-xl border border-slate-900 shadow-2xl p-2 hidden group-hover/mini:block animate-fade-in">
                  <div className="px-2.5 py-1 mb-1 border-b border-slate-900 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider font-display">
                      {getTranslatedGroupLabel(group)}
                    </span>
                  </div>
                  <div className="space-y-0.5 max-h-72 overflow-y-auto custom-scrollbar">
                    {groupItems.map((item) => {
                      const isChildSelected = currentTab === item.tab && currentSubTab === item.subTab;
                      const badgeValue = getBadgeValue(item.badgeKey);

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleItemClick(item)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                            isChildSelected
                              ? 'bg-brand-orange text-white font-bold'
                              : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {renderIcon(item.icon, "h-3.5 w-3.5")}
                            <span>{t(item)}</span>
                          </div>
                          {badgeValue !== null && (
                            <span className="text-[8px] bg-brand-orange text-white font-extrabold px-1.5 py-0.5 rounded-full scale-90">
                              {badgeValue}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          }

          // Full Standard Sidebar rendering
          return (
            <div key={group.id} className="space-y-0.5 border-b border-slate-900/40 pb-1">
              {/* Category header */}
              <button
                onClick={() => toggleGroupExpand(group.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all group cursor-pointer ${
                  hasSelectedChild
                    ? 'bg-slate-900/60 text-white border-l-2 border-brand-orange pl-2.5'
                    : 'text-slate-400 hover:bg-slate-900/40 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {renderIcon(group.icon, "h-[15px] w-[15px] text-slate-500 group-hover:text-brand-orange")}
                  <span className="tracking-wide uppercase text-[9px] font-display font-semibold">{getTranslatedGroupLabel(group)}</span>
                </div>
                <div>
                  {isExpanded ? (
                    <Icons.ChevronDown className="h-3.5 w-3.5 text-slate-600" />
                  ) : (
                    <Icons.ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                  )}
                </div>
              </button>

              {/* Child items */}
              {isExpanded && (
                <div className="pl-4.5 pr-1 py-0.5 space-y-0.5 border-l border-slate-900 ml-4.5">
                  {groupItems.map((item) => {
                    const isItemSelected = currentTab === item.tab && currentSubTab === item.subTab;
                    const badgeValue = getBadgeValue(item.badgeKey);
                    const isFav = favorites.includes(item.id);
                    const isPin = pinned.includes(item.id);

                    return (
                      <div
                        key={item.id}
                        className={`group/item flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer relative ${
                          isItemSelected
                            ? 'bg-slate-900 text-white font-bold border-r-2 border-brand-orange shadow-inner'
                            : 'text-slate-400 hover:bg-slate-900/30 hover:text-white'
                        }`}
                        onClick={() => handleItemClick(item)}
                      >
                        <div className="flex items-center gap-2 max-w-[130px] truncate">
                          {renderIcon(item.icon, "h-3.5 w-3.5 shrink-0")}
                          <span className="truncate">{t(item)}</span>
                        </div>

                        {/* Interactive badges, pin and star buttons (show on hover) */}
                        <div className="flex items-center gap-1.5 z-10">
                          {badgeValue !== null && (
                            <span className="text-[9px] bg-brand-orange text-white font-black px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">
                              {badgeValue}
                            </span>
                          )}

                          {/* Pin Toggle Button */}
                          <button
                            onClick={(e) => handlePinToggle(e, item.id)}
                            className={`opacity-0 group-hover/item:opacity-100 p-0.5 hover:bg-slate-800 rounded text-[9px] transition-all cursor-pointer ${
                              isPin ? 'opacity-100 text-brand-orange' : 'text-slate-600'
                            }`}
                            title={isPin ? "Unpin action" : "Pin action"}
                          >
                            <Icons.Pin className={`h-3 w-3 ${isPin ? 'fill-brand-orange' : ''}`} />
                          </button>

                          {/* Star Toggle Button */}
                          <button
                            onClick={(e) => handleFavoriteToggle(e, item.id)}
                            className={`opacity-0 group-hover/item:opacity-100 p-0.5 hover:bg-slate-800 rounded text-[9px] transition-all cursor-pointer ${
                              isFav ? 'opacity-100 text-amber-400' : 'text-slate-600'
                            }`}
                            title={isFav ? "Remove Favorite" : "Add Favorite"}
                          >
                            <Icons.Star className={`h-3 w-3 ${isFav ? 'fill-amber-400' : ''}`} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Dynamic footer */}
      <div className="p-3.5 border-t border-slate-900/80 bg-slate-950/40 text-center flex flex-col items-center">
        {!isCollapsed ? (
          <>
            <span className="text-[9px] text-slate-500 font-bold tracking-wider uppercase font-mono">NEXOVA NAV ENGINE v2.0</span>
            <span className="text-[9px] text-slate-400 font-semibold mt-0.5">
              Role: <span className="text-brand-orange">Administrator</span>
            </span>
          </>
        ) : (
          <span title="NEXOVA NAV ENGINE v2.0"><Icons.Cpu className="h-4 w-4 text-slate-600" /></span>
        )}
      </div>
    </aside>
  );
}
