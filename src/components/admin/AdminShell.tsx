import React, { useState } from 'react';
import type { UserProfile } from '../../types';
import {
  AdminNavEntry,
  AdminTabId,
  getRoleLabel,
  isAdminNavGroup,
} from '../../lib/adminPermissions';

interface AdminShellProps {
  currentUser?: UserProfile | null;
  navItems: AdminNavEntry[];
  activeTab: AdminTabId;
  onTabChange: (tab: AdminTabId) => void;
  onLogout?: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const AdminShell: React.FC<AdminShellProps> = ({
  currentUser,
  navItems,
  activeTab,
  onTabChange,
  onLogout,
  title,
  subtitle,
  children,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    navItems.forEach((entry) => {
      if (isAdminNavGroup(entry) && entry.children.some((c) => c.id === activeTab)) {
        init[entry.id] = true;
      }
    });
    return init;
  });
  const role = currentUser?.role || 'admin';

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const SidebarContent = (
    <>
      <div className="px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">local_hospital</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black truncate">پنل مدیریت ژینو</p>
            <p className="text-[10px] text-slate-400 font-bold">{getRoleLabel(role)}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((entry) => {
          if (isAdminNavGroup(entry)) {
            const childActive = entry.children.some((c) => c.id === activeTab);
            const open = openGroups[entry.id] ?? childActive;
            return (
              <div key={entry.id} className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => toggleGroup(entry.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    childActive
                      ? 'bg-white/10 text-white'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{entry.icon}</span>
                  <span className="flex-1 text-right">{entry.label}</span>
                  <span className="material-symbols-outlined text-base opacity-70">
                    {open ? 'expand_more' : 'chevron_left'}
                  </span>
                </button>
                {open && (
                  <div className="pr-3 space-y-0.5 border-r border-white/10 mr-4">
                    {entry.children.map((item) => {
                      const active = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            onTabChange(item.id);
                            setMobileOpen(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${
                            active
                              ? 'bg-teal-500 text-white shadow-lg shadow-teal-900/30'
                              : 'text-slate-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span className="material-symbols-outlined text-base">{item.icon}</span>
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const active = activeTab === entry.id;
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => {
                onTabChange(entry.id);
                setMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                active
                  ? 'bg-teal-500 text-white shadow-lg shadow-teal-900/30'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{entry.icon}</span>
              <span>{entry.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-2">
        {currentUser && (
          <div className="px-3 py-2 rounded-xl bg-white/5 text-[11px]">
            <p className="font-black text-white truncate">{currentUser.name}</p>
            <p className="text-slate-400 mt-0.5">{getRoleLabel(currentUser.role)}</p>
          </div>
        )}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 text-xs font-bold"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            <span>خروج از پنل</span>
          </button>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-right" dir="rtl">
      <div className="flex min-h-screen">
        <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-slate-900 text-white sticky top-0 h-screen">
          {SidebarContent}
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-[180] lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
            <aside className="absolute top-0 right-0 h-full w-[280px] bg-slate-900 text-white flex flex-col shadow-2xl">
              {SidebarContent}
            </aside>
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col min-h-screen">
          <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                onClick={() => setMobileOpen(true)}
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
              <div className="min-w-0">
                <h1 className="text-base md:text-lg font-black text-slate-900 dark:text-white truncate">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
};
