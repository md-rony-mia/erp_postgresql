import React, { useState, useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';
import {
  Grid,
  Minimize2,
  Maximize2,
  X,
  Clock,
  Search,
  ChevronUp,
  Layout,
  Power,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useWindowManager } from '../context/WindowManagerContext';
import { navEngine } from '../lib/navigationEngine';

interface TaskbarProps {
  currentUser?: any;
}

export default function Taskbar({ currentUser }: TaskbarProps) {
  const {
    windows,
    activeWindowId,
    toggleWindow,
    closeWindow,
    minimizeAll,
    restoreAll,
    openWindow,
    closeAll,
  } = useWindowManager();

  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [launcherSearch, setLauncherSearch] = useState('');
  const [timeString, setTimeString] = useState('');
  const [dateString, setDateString] = useState('');

  const launcherRef = useRef<HTMLDivElement>(null);

  // Live clock updates
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('bn-BD', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
      setDateString(
        now.toLocaleDateString('bn-BD', {
          month: 'short',
          day: 'numeric',
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  // Close launcher on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (launcherRef.current && !launcherRef.current.contains(event.target as Node)) {
        setIsLauncherOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderIcon = (iconName: string | undefined, className = 'h-3.5 w-3.5') => {
    const IconComp = (Icons as any)[iconName || 'Window'] || Icons.Layout;
    return <IconComp className={className} />;
  };

  // Filter launcher items based on search query
  const navigationItems = navEngine.getItems().filter((i) => i.enabled);
  const filteredLauncherItems = navigationItems.filter((item) => {
    const query = launcherSearch.toLowerCase();
    const bnTitle = item.translations?.bn || '';
    return (
      item.label.toLowerCase().includes(query) ||
      bnTitle.toLowerCase().includes(query) ||
      item.tab.toLowerCase().includes(query)
    );
  });

  const handleSelectModule = (tab: string, subTab: string = '', title?: string, iconName?: string) => {
    openWindow(tab, subTab, title, iconName);
    setIsLauncherOpen(false);
    setLauncherSearch('');
  };

  return (
    <>
      {/* APP LAUNCHER / START MENU POPOVER */}
      {isLauncherOpen && (
        <div
          ref={launcherRef}
          className="fixed bottom-14 left-3 z-[9990] w-80 sm:w-96 bg-slate-900 border-2 border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200 text-slate-100 backdrop-blur-xl"
        >
          {/* Launcher Header */}
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-black text-white text-xs shadow-md">
                NX
              </div>
              <div>
                <h3 className="font-bold text-xs text-white font-display">নেক্সোভা ইআরপি লঞ্চার</h3>
                <p className="text-[10px] text-slate-400">Nexova ERP System Window OS</p>
              </div>
            </div>
            <button
              onClick={() => setIsLauncherOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Search Box */}
          <div className="p-3 bg-slate-900/90 border-b border-slate-800">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="মডিউল বা রিপোর্ট খুঁজুন..."
                value={launcherSearch}
                onChange={(e) => setLauncherSearch(e.target.value)}
                autoFocus
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Module Grid List */}
          <div className="max-h-72 overflow-y-auto p-2 grid grid-cols-2 gap-1.5 no-scrollbar">
            {filteredLauncherItems.slice(0, 16).map((item) => {
              const bnTitle = item.translations?.bn || item.label;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectModule(item.tab, item.subTab, bnTitle, item.icon)}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-left transition-all border border-slate-800/60 hover:border-indigo-500/50 group cursor-pointer"
                >
                  <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-indigo-600 text-indigo-400 group-hover:text-white transition-colors shrink-0">
                    {renderIcon(item.icon, 'h-4 w-4')}
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-[11px] text-slate-200 group-hover:text-white truncate">
                      {bnTitle}
                    </div>
                    <div className="text-[9px] text-slate-400 capitalize truncate">
                      {item.groupId}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick System Action Footer */}
          <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <button
                onClick={closeAll}
                className="px-2.5 py-1 bg-slate-800 hover:bg-rose-900/50 hover:text-rose-300 text-slate-300 rounded-lg text-[10px] font-bold transition-colors border border-slate-700/50"
              >
                সব বন্ধ করুন (Close All)
              </button>
            </div>
            <span className="text-[10px] text-slate-500">Nexova OS v3.2</span>
          </div>
        </div>
      )}

      {/* PERSISTENT TASKBAR DOCK AT BOTTOM */}
      <nav className="fixed bottom-0 left-0 right-0 z-[8900] h-12 bg-slate-950/95 border-t border-slate-800 text-slate-100 flex items-center px-2 sm:px-3 justify-between shadow-2xl backdrop-blur-md select-none">
        {/* Left Section: Start Launcher & Show Desktop */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Start / Launcher Button */}
          <button
            onClick={() => setIsLauncherOpen(!isLauncherOpen)}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
              isLauncherOpen
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-slate-200 hover:text-white'
            }`}
            title="নেক্সোভা ইআরপি স্টার্ট মেনু"
          >
            <div className="h-4 w-4 rounded bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center font-black text-[9px] text-slate-950">
              N
            </div>
            <span className="hidden sm:inline font-display text-[11px] tracking-wide">
              Nexova OS
            </span>
            <ChevronUp className={`h-3 w-3 text-slate-400 transition-transform ${isLauncherOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Minimize All / Show Desktop Toggle */}
          <button
            onClick={minimizeAll}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
            title="সব উইন্ডো মিনিমাইজ করুন (Show Desktop)"
          >
            <Minimize2 className="h-4 w-4" />
          </button>

          <div className="h-4 w-px bg-slate-800 my-auto mx-0.5"></div>
        </div>

        {/* Middle Section: Taskbar Items Dock */}
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar mx-2 py-1 max-w-4xl">
          {windows.map((win) => {
            const isActive = win.isActive && !win.isMinimized;
            const isMin = win.isMinimized;

            return (
              <div
                key={win.id}
                onClick={() => toggleWindow(win.id)}
                className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border shrink-0 max-w-[170px] sm:max-w-[210px] truncate select-none ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30 font-bold scale-[1.02]'
                    : isMin
                    ? 'bg-slate-900/90 hover:bg-slate-800/90 text-slate-400 hover:text-slate-200 border-amber-500/50'
                    : 'bg-slate-900/70 hover:bg-slate-800/80 text-slate-300 border-slate-800'
                }`}
                title={`${win.title} ${isMin ? '(মিনিমাইজড)' : '(সক্রিয়)'}`}
              >
                {/* Active or Minimized Status Dot */}
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isActive
                      ? 'bg-emerald-300 animate-pulse'
                      : isMin
                      ? 'bg-amber-400/80'
                      : 'bg-slate-500'
                  }`}
                />

                {/* Window Icon */}
                <span className="shrink-0 text-slate-300 group-hover:text-white">
                  {renderIcon(win.iconName, 'h-3.5 w-3.5')}
                </span>

                {/* Window Title */}
                <span className="truncate text-[11px] leading-none tracking-tight">
                  {win.title}
                </span>

                {/* Taskbar Item Quick Close (X) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeWindow(win.id);
                  }}
                  className="ml-auto p-0.5 rounded hover:bg-rose-500/80 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title="বন্ধ করুন"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Right Section: System Clock & Window Count */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Active Window Count Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-mono">
            <Layers className="h-3 w-3 text-indigo-400" />
            <span>{windows.length} উইন্ডো</span>
          </div>

          {/* System Time & Date */}
          {/* <div className="flex flex-col items-end px-2 py-0.5 bg-slate-900/90 border border-slate-800 rounded-xl text-right">
            <span className="text-[11px] font-bold text-slate-200 leading-none font-mono">
              {timeString || '00:00'}
            </span>
            <span className="text-[9px] text-slate-400 leading-none mt-0.5 font-mono">
              {dateString}
            </span>
          </div> */}
        </div>
      </nav>
    </>
  );
}
