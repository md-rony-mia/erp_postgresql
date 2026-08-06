import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { navEngine } from '../lib/navigationEngine';

export interface WindowItem {
  id: string; // e.g. 'sales', 'inventory', 'purchase', 'customer-modal'
  title: string; // Title in Bengali or English
  subtitle?: string;
  iconName?: string; // Lucide icon name
  tab: string; // Core tab key
  subTab?: string; // Sub-tab key if applicable
  isMinimized: boolean;
  isActive: boolean;
  type?: 'view' | 'modal' | 'panel';
  openedAt: number;
  customData?: any;
}

interface WindowManagerContextType {
  windows: WindowItem[];
  activeWindowId: string | null;
  openWindow: (tab: string, subTab?: string, title?: string, iconName?: string) => void;
  minimizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  closeWindow: (id: string) => void;
  toggleWindow: (id: string) => void;
  minimizeAll: () => void;
  restoreAll: () => void;
  closeAll: () => void;
  getTabTitleAndIcon: (tab: string, subTab?: string) => { title: string; iconName: string };
}

const WindowManagerContext = createContext<WindowManagerContextType | undefined>(undefined);

export const WindowManagerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [windows, setWindows] = useState<WindowItem[]>([
    {
      id: 'dashboard',
      title: 'নির্বাহী ড্যাশবোর্ড',
      iconName: 'LayoutDashboard',
      tab: 'dashboard',
      subTab: '',
      isMinimized: false,
      isActive: true,
      type: 'view',
      openedAt: Date.now(),
    },
  ]);

  const [activeWindowId, setActiveWindowId] = useState<string | null>('dashboard');

  // Helper to resolve title & icon from navigationEngine
  const getTabTitleAndIcon = (tab: string, subTab: string = '') => {
    const items = navEngine.getItems();
    const groups = navEngine.getGroups();
    const lang = navEngine.getLanguage();

    // Look for exact match
    const item = items.find((i) => i.tab === tab && (subTab ? i.subTab === subTab : true));
    if (item) {
      const title = lang === 'bn' && item.translations?.bn ? item.translations.bn : item.label;
      const iconName = item.icon || 'FileText';
      return { title, iconName };
    }

    // Look for group match
    const group = groups.find((g) => g.id === tab);
    if (group) {
      const title = group.label;
      const iconName = group.icon || 'Folder';
      return { title, iconName };
    }

    // Fallbacks
    const fallbackMap: Record<string, { bn: string; icon: string }> = {
      dashboard: { bn: 'ড্যাশবোর্ড', icon: 'LayoutDashboard' },
      inventory: { bn: 'ইনভেন্টরি ব্যবস্থাপনা', icon: 'Boxes' },
      sales: { bn: 'বিক্রয় মডিউল', icon: 'Store' },
      purchase: { bn: 'ক্রয় মডিউল', icon: 'ShoppingCart' },
      employee: { bn: 'এইচআর ও পেরোল', icon: 'Users' },
      accounting: { bn: 'হিসাববিজ্ঞান মডিউল', icon: 'BookOpen' },
      banking: { bn: 'ব্যাংকিং ও লোন', icon: 'Landmark' },
      loan: { bn: 'ঋণ হিসাব ব্যবস্থাপনা', icon: 'Building' },
      crm: { bn: 'গ্রাহক সম্পর্ক (CRM)', icon: 'Users' },
      projects: { bn: 'প্রকল্পসমূহ (Projects)', icon: 'Calendar' },
      manufacturing: { bn: 'উৎপাদন মডিউল (Production)', icon: 'Wrench' },
      service: { bn: 'সার্ভিস ও হেল্পডেস্ক', icon: 'Headphones' },
      documents: { bn: 'ডকুমেন্ট রিপোজিটরি', icon: 'FolderArchive' },
      workflow: { bn: 'ওয়ার্কফ্লো ইঞ্জিন', icon: 'GitMerge' },
      ai: { bn: 'এআই কোপাইলট (AI Assistant)', icon: 'Sparkles' },
      integration: { bn: 'থার্ড-পার্টি ইন্টিগ্রেশন', icon: 'Cpu' },
      reports: { bn: 'রিপোর্টস ও অ্যানালিটিক্স', icon: 'BarChart3' },
      gridReport: { bn: 'গ্রিড রিপোর্ট বিল্ডার', icon: 'Grid' },
      rdlReport: { bn: 'রিপোর্ট ডিজাইনার', icon: 'FileSpreadsheet' },
      customReportModule: { bn: 'কাস্টম রিপোর্ট ডিজাইনার', icon: 'FileText' },
      settings: { bn: 'সিস্টেম সেটিংস', icon: 'Settings' },
    };

    const fb = fallbackMap[tab] || { bn: tab.toUpperCase(), icon: 'Window' };
    return { title: fb.bn, iconName: fb.icon };
  };

  // Open window or restore if already open
  const openWindow = (tab: string, subTab: string = '', customTitle?: string, customIconName?: string) => {
    const windowId = subTab ? `${tab}-${subTab}` : tab;
    const { title, iconName } = getTabTitleAndIcon(tab, subTab);
    const resolvedTitle = customTitle || title;
    const resolvedIcon = customIconName || iconName;

    setWindows((prev) => {
      const existingIndex = prev.findIndex((w) => w.id === windowId || (w.tab === tab && w.subTab === subTab));
      
      if (existingIndex >= 0) {
        // Bring to front and unminimize
        return prev.map((w, index) => {
          if (index === existingIndex) {
            return {
              ...w,
              isMinimized: false,
              isActive: true,
              title: resolvedTitle,
              iconName: resolvedIcon,
            };
          }
          return { ...w, isActive: false };
        });
      }

      // Add new window
      const newWin: WindowItem = {
        id: windowId,
        title: resolvedTitle,
        iconName: resolvedIcon,
        tab,
        subTab,
        isMinimized: false,
        isActive: true,
        type: 'view',
        openedAt: Date.now(),
      };

      return [...prev.map((w) => ({ ...w, isActive: false })), newWin];
    });

    setActiveWindowId(windowId);
  };

  // Minimize window
  const minimizeWindow = (id: string) => {
    setWindows((prev) => {
      const updated = prev.map((w) => {
        if (w.id === id) {
          return { ...w, isMinimized: true, isActive: false };
        }
        return w;
      });

      // Find another non-minimized window to activate
      const remainingOpen = updated.filter((w) => !w.isMinimized);
      if (remainingOpen.length > 0) {
        // Activate the last opened active window
        const nextActive = remainingOpen[remainingOpen.length - 1];
        return updated.map((w) => (w.id === nextActive.id ? { ...w, isActive: true } : w));
      }

      return updated;
    });

    setWindows((curr) => {
      const activeWin = curr.find((w) => w.isActive && !w.isMinimized);
      setActiveWindowId(activeWin ? activeWin.id : null);
      return curr;
    });
  };

  // Restore window
  const restoreWindow = (id: string) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          return { ...w, isMinimized: false, isActive: true };
        }
        return { ...w, isActive: false };
      })
    );
    setActiveWindowId(id);
  };

  // Close window
  const closeWindow = (id: string) => {
    setWindows((prev) => {
      const filtered = prev.filter((w) => w.id !== id);
      
      // If no windows left after closing, automatically re-open Executive Dashboard window as default
      if (filtered.length === 0) {
        const meta = getTabTitleAndIcon('dashboard', '');
        return [
          {
            id: 'dashboard',
            title: meta.title || 'নির্বাহী ড্যাশবোর্ড',
            iconName: meta.iconName || 'LayoutDashboard',
            tab: 'dashboard',
            subTab: '',
            isMinimized: false,
            isActive: true,
            type: 'view',
            openedAt: Date.now(),
          },
        ];
      }

      // If closing active window, activate remaining unminimized window
      const closingWinWasActive = prev.find((w) => w.id === id)?.isActive;
      if (closingWinWasActive) {
        const remainingOpen = filtered.filter((w) => !w.isMinimized);
        if (remainingOpen.length > 0) {
          const nextActive = remainingOpen[remainingOpen.length - 1];
          return filtered.map((w) => (w.id === nextActive.id ? { ...w, isActive: true } : w));
        } else {
          // If all remaining windows are minimized, keep them minimized so Desktop shows Executive Dashboard
          return filtered.map((w) => ({ ...w, isActive: false }));
        }
      }

      return filtered;
    });

    setWindows((curr) => {
      const activeWin = curr.find((w) => w.isActive && !w.isMinimized);
      setActiveWindowId(activeWin ? activeWin.id : 'dashboard');
      return curr;
    });
  };

  // Toggle window minimize/restore
  const toggleWindow = (id: string) => {
    const target = windows.find((w) => w.id === id);
    if (!target) return;

    if (target.isActive && !target.isMinimized) {
      minimizeWindow(id);
    } else {
      restoreWindow(id);
    }
  };

  // Minimize all windows
  const minimizeAll = () => {
    setWindows((prev) => prev.map((w) => ({ ...w, isMinimized: true, isActive: false })));
    setActiveWindowId(null);
  };

  // Restore all windows
  const restoreAll = () => {
    setWindows((prev) =>
      prev.map((w, i) => ({
        ...w,
        isMinimized: false,
        isActive: i === prev.length - 1,
      }))
    );
    if (windows.length > 0) {
      setActiveWindowId(windows[windows.length - 1].id);
    }
  };

  // Close all windows except Dashboard
  const closeAll = () => {
    setWindows((prev) => {
      const dash = prev.find((w) => w.tab === 'dashboard');
      if (dash) {
        return [{ ...dash, isMinimized: false, isActive: true }];
      }
      return [
        {
          id: 'dashboard',
          title: 'নির্বাহী ড্যাশবোর্ড',
          iconName: 'LayoutDashboard',
          tab: 'dashboard',
          subTab: '',
          isMinimized: false,
          isActive: true,
          type: 'view',
          openedAt: Date.now(),
        },
      ];
    });
    setActiveWindowId('dashboard');
  };

  return (
    <WindowManagerContext.Provider
      value={{
        windows,
        activeWindowId,
        openWindow,
        minimizeWindow,
        restoreWindow,
        closeWindow,
        toggleWindow,
        minimizeAll,
        restoreAll,
        closeAll,
        getTabTitleAndIcon,
      }}
    >
      {children}
    </WindowManagerContext.Provider>
  );
};

export const useWindowManager = () => {
  const context = useContext(WindowManagerContext);
  if (!context) {
    throw new Error('useWindowManager must be used within a WindowManagerProvider');
  }
  return context;
};
