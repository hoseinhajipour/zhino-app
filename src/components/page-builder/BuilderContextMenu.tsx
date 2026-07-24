import React, { useEffect, useRef } from 'react';

export type ContextMenuAction =
  | 'copy'
  | 'delete'
  | 'copyStyle'
  | 'paste'
  | 'pasteStyle'
  | 'deleteAll'
  | 'copyAll';

export interface BuilderContextMenuState {
  x: number;
  y: number;
  /** Block under cursor; null when right-clicking empty canvas */
  targetId: string | null;
}

interface BuilderContextMenuProps {
  menu: BuilderContextMenuState;
  hasTarget: boolean;
  canPaste: boolean;
  canPasteStyle: boolean;
  canCopyAll: boolean;
  canDeleteAll: boolean;
  onAction: (action: ContextMenuAction) => void;
  onClose: () => void;
}

const Item: React.FC<{
  icon: string;
  label: string;
  disabled?: boolean;
  danger?: boolean;
  shortcut?: string;
  onClick: () => void;
}> = ({ icon, label, disabled, danger, shortcut, onClick }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={`w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold text-right rounded-lg transition-colors disabled:opacity-35 disabled:cursor-not-allowed ${
      danger
        ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
    }`}
  >
    <span className="material-symbols-outlined text-base shrink-0">{icon}</span>
    <span className="flex-1">{label}</span>
    {shortcut && <span className="text-[9px] font-mono text-slate-400">{shortcut}</span>}
  </button>
);

export const BuilderContextMenu: React.FC<BuilderContextMenuProps> = ({
  menu,
  hasTarget,
  canPaste,
  canPasteStyle,
  canCopyAll,
  canDeleteAll,
  onAction,
  onClose,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onDown);
    };
  }, [onClose]);

  // Keep menu inside viewport
  const pad = 8;
  const approxW = 220;
  const approxH = 320;
  const left = Math.min(menu.x, window.innerWidth - approxW - pad);
  const top = Math.min(menu.y, window.innerHeight - approxH - pad);

  return (
    <div
      ref={ref}
      role="menu"
      className="fixed z-[400] w-[220px] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-900/20 p-1.5 animate-fade-in"
      style={{ left: Math.max(pad, left), top: Math.max(pad, top) }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <p className="px-2.5 py-1.5 text-[9px] font-black text-slate-400 tracking-wide">عملیات ویجت</p>
      <Item
        icon="content_copy"
        label="کپی کردن"
        disabled={!hasTarget}
        onClick={() => onAction('copy')}
      />
      <Item
        icon="content_paste"
        label="جای‌گذاری (Paste)"
        disabled={!canPaste}
        onClick={() => onAction('paste')}
      />
      <Item
        icon="delete"
        label="حذف کردن"
        disabled={!hasTarget}
        danger
        onClick={() => onAction('delete')}
      />

      <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

      <Item
        icon="palette"
        label="کپی کردن استایل"
        disabled={!hasTarget}
        onClick={() => onAction('copyStyle')}
      />
      <Item
        icon="format_paint"
        label="جای‌گذاری فقط استایل"
        disabled={!canPasteStyle}
        onClick={() => onAction('pasteStyle')}
      />

      <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

      <Item
        icon="select_all"
        label="کپی همه ویجت‌ها"
        disabled={!canCopyAll}
        onClick={() => onAction('copyAll')}
      />
      <Item
        icon="delete_sweep"
        label="حذف همه ویجت‌ها"
        disabled={!canDeleteAll}
        danger
        onClick={() => onAction('deleteAll')}
      />
    </div>
  );
};
