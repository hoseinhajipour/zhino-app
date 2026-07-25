import React, { useEffect, useRef, useState } from 'react';
import type { UserProfile } from '../types';
import type { AdminIntent } from '../lib/adminIntent';
import { getRoleLabel } from '../lib/adminPermissions';

/** Contextual «ویرایش» action for the page/post currently shown to the visitor. */
export interface AdminEditTarget {
  label: string;
  icon: string;
  intent: AdminIntent;
}

interface AdminToolbarProps {
  currentUser: UserProfile | null;
  editTarget?: AdminEditTarget | null;
  /** Stores the intent and moves to the admin dashboard. */
  onOpenAdmin: (intent: AdminIntent) => void;
  onLogout: () => void;
}

interface MenuAction {
  label: string;
  icon: string;
  onClick: () => void;
  danger?: boolean;
}

type MenuId = 'add' | 'account';

const barButtonClass =
  'h-full flex items-center gap-1.5 px-2 sm:px-3 hover:bg-white/10 transition-colors whitespace-nowrap';

export const AdminToolbar: React.FC<AdminToolbarProps> = ({
  currentUser,
  editTarget,
  onOpenAdmin,
  onLogout,
}) => {
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenu) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpenMenu(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openMenu]);

  if (!currentUser || currentUser.role !== 'admin') return null;

  const go = (intent: AdminIntent) => {
    setOpenMenu(null);
    onOpenAdmin(intent);
  };

  const renderMenu = (
    id: MenuId,
    align: 'start' | 'end',
    actions: MenuAction[],
    header?: React.ReactNode
  ) => {
    if (openMenu !== id) return null;
    return (
      <div
        className={`absolute top-full ${align === 'start' ? 'start-0' : 'end-0'} min-w-[200px] rounded-b-2xl border border-t-0 border-white/10 bg-slate-900 shadow-2xl overflow-hidden`}
        role="menu"
      >
        {header}
        <div className="py-1.5">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              role="menuitem"
              onClick={action.onClick}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-[11px] font-bold text-right transition-colors ${
                action.danger
                  ? 'text-rose-300 hover:bg-rose-500/15'
                  : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-base">{action.icon}</span>
              <span className="flex-1">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const toggleMenu = (id: MenuId) => setOpenMenu((prev) => (prev === id ? null : id));

  return (
    <div
      ref={rootRef}
      className="notranslate sticky top-0 z-[70] h-10 bg-slate-900 text-white shadow-md print:hidden"
      translate="no"
      dir="rtl"
    >
      <div className="h-full max-w-[1200px] mx-auto px-1 sm:px-4 flex items-center justify-between text-[11px] font-bold">
        <div className="flex items-center h-full min-w-0">
          <button
            type="button"
            onClick={() => go({ kind: 'tab', tab: 'overview' })}
            className={barButtonClass}
            title="داشبورد مدیریت"
          >
            <span className="material-symbols-outlined text-lg text-teal-300">dashboard</span>
            <span className="hidden sm:inline">داشبورد مدیریت</span>
          </button>

          {editTarget && (
            <button
              type="button"
              onClick={() => go(editTarget.intent)}
              className={barButtonClass}
              title={editTarget.label}
            >
              <span className="material-symbols-outlined text-lg text-amber-300">{editTarget.icon}</span>
              <span className="hidden sm:inline truncate">{editTarget.label}</span>
            </button>
          )}

          <div className="relative h-full">
            <button
              type="button"
              onClick={() => toggleMenu('add')}
              className={barButtonClass}
              title="افزودن سریع"
              aria-haspopup="menu"
              aria-expanded={openMenu === 'add'}
            >
              <span className="material-symbols-outlined text-lg text-emerald-300">add_circle</span>
              <span className="hidden sm:inline">افزودن سریع</span>
              <span className="material-symbols-outlined text-sm opacity-60">
                {openMenu === 'add' ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {renderMenu('add', 'start', [
              { label: 'صفحه جدید', icon: 'web', onClick: () => go({ kind: 'new-page' }) },
              { label: 'نوشته جدید', icon: 'post_add', onClick: () => go({ kind: 'new-article' }) },
            ])}
          </div>
        </div>

        <div className="flex items-center h-full min-w-0">
          <button
            type="button"
            onClick={() => go({ kind: 'tab', tab: 'settings' })}
            className={barButtonClass}
            title="تنظیمات سایت"
          >
            <span className="material-symbols-outlined text-lg text-sky-300">settings</span>
            <span className="hidden sm:inline">تنظیمات</span>
          </button>

          <div className="relative h-full">
            <button
              type="button"
              onClick={() => toggleMenu('account')}
              className={barButtonClass}
              title="حساب کاربری"
              aria-haspopup="menu"
              aria-expanded={openMenu === 'account'}
            >
              <span className="material-symbols-outlined text-lg text-primary-fixed">account_circle</span>
              <span className="hidden sm:inline max-w-[140px] truncate">{currentUser.name}</span>
              <span className="material-symbols-outlined text-sm opacity-60">
                {openMenu === 'account' ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {renderMenu(
              'account',
              'end',
              [
                {
                  label: 'داشبورد مدیریت',
                  icon: 'dashboard',
                  onClick: () => go({ kind: 'tab', tab: 'overview' }),
                },
                {
                  label: 'مدیریت کاربران',
                  icon: 'manage_accounts',
                  onClick: () => go({ kind: 'tab', tab: 'users' }),
                },
                {
                  label: 'خروج از حساب',
                  icon: 'logout',
                  danger: true,
                  onClick: () => {
                    setOpenMenu(null);
                    onLogout();
                  },
                },
              ],
              <div className="px-3 py-2.5 bg-white/5 border-b border-white/10">
                <p className="text-xs font-black truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{getRoleLabel(currentUser.role)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
