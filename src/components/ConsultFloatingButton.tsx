import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ClinicContactInfo } from '../types';
import {
  DEFAULT_CONTACT_INFO,
  getMapHref,
  listContactChannels,
  mergeContactInfo,
  mergeFabSettings,
  type ContactChannel,
} from '../lib/contactInfo';
import { CHANNEL_ACCENT, ContactChannelIcon } from './ContactChannelIcon';

interface ConsultFloatingButtonProps {
  contact?: ClinicContactInfo | null;
}

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace('#', '').trim();
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return `rgba(181, 16, 106, ${alpha})`;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const ConsultFloatingButton: React.FC<ConsultFloatingButtonProps> = ({ contact }) => {
  const [open, setOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const resolved = useMemo(
    () => mergeContactInfo(contact || DEFAULT_CONTACT_INFO),
    [contact]
  );
  const fab = useMemo(() => mergeFabSettings(resolved.fab), [resolved.fab]);

  const channels = useMemo(() => {
    const list = listContactChannels(resolved);
    const phones = list.filter((c) => c.id === 'phone');
    const rest = list.filter((c) => c.id !== 'phone');
    const phoneItems: ContactChannel[] =
      phones.length <= 1
        ? phones.map((p) => ({ ...p, label: 'تماس تلفنی' }))
        : phones;
    const addr = resolved.addresses[0];
    const mapHref = addr ? getMapHref(addr) : '';
    const withMap =
      mapHref && !rest.some((c) => c.id === 'map')
        ? [...phoneItems, ...rest, { id: 'map' as const, label: 'موقعیت روی نقشه', href: mapHref, external: true }]
        : [...phoneItems, ...rest];
    return withMap;
  }, [resolved]);

  useEffect(() => {
    if (fab.entryAnimation === 'none') {
      setEntered(true);
      return;
    }
    setEntered(false);
    const t = window.setTimeout(() => setEntered(true), 60);
    return () => window.clearTimeout(t);
  }, [fab.entryAnimation, fab.position]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!fab.enabled || !channels.length) return null;

  const isLeft = fab.position === 'left';
  const stack = [...channels].reverse();
  const showSideLabel = fab.showLabel && Boolean(fab.label.trim()) && !open;
  const animClass = `consult-fab-anim-${fab.entryAnimation}`;

  return (
    <div
      ref={rootRef}
      className={`fixed bottom-6 z-50 consult-fab-root ${animClass} ${
        isLeft ? 'left-6 consult-fab-root--left' : 'right-6 consult-fab-root--right'
      } ${entered ? 'consult-fab-root--in' : ''}`}
    >
      <div className={`flex items-center gap-2.5 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className="relative w-14 h-14 shrink-0">
          <div
            className={`absolute bottom-full mb-3 flex flex-col gap-2.5 pointer-events-none ${
              isLeft ? 'left-0 items-start' : 'right-0 items-end'
            } ${open ? 'pointer-events-auto' : ''}`}
            aria-hidden={!open}
          >
            {stack.map((ch, idx) => {
              const delay = open ? `${idx * 45}ms` : `${(stack.length - 1 - idx) * 30}ms`;
              return (
                <a
                  key={`${ch.id}-${ch.href}-${idx}`}
                  href={ch.href}
                  target={ch.external ? '_blank' : undefined}
                  rel={ch.external ? 'noopener noreferrer' : undefined}
                  onClick={() => setOpen(false)}
                  className={`consult-fab-item group relative w-11 h-11 shrink-0 ${
                    open ? 'consult-fab-item--open' : ''
                  }`}
                  style={{ transitionDelay: delay }}
                  title={ch.label}
                >
                  <span className="consult-fab-channel-label">{ch.label}</span>
                  <span
                    className={`absolute inset-0 rounded-full shadow-lg flex items-center justify-center ${CHANNEL_ACCENT[ch.id]}`}
                  >
                    <ContactChannelIcon id={ch.id} size={20} />
                  </span>
                </a>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={`absolute inset-0 rounded-full shadow-xl flex items-center justify-center text-white ring-4 transition-all duration-300 active:scale-95 ${
              open ? 'rotate-90' : ''
            }`}
            style={
              open
                ? {
                    backgroundColor: '#1e293b',
                    boxShadow: `0 0 0 4px rgba(30, 41, 59, 0.2)`,
                  }
                : {
                    backgroundColor: fab.color,
                    boxShadow: `0 12px 28px ${hexToRgba(fab.color, 0.35)}, 0 0 0 4px ${hexToRgba(fab.color, 0.2)}`,
                  }
            }
            aria-label={fab.label || 'مشاوره و راه‌های تماس'}
            aria-expanded={open}
          >
            {fab.pulse && !open && (
              <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: fab.color }}
                />
                <span
                  className="relative inline-flex rounded-full h-3 w-3 bg-white"
                />
              </span>
            )}
            <span className="material-symbols-outlined text-2xl leading-none">
              {open ? 'close' : fab.icon || 'support_agent'}
            </span>
          </button>
        </div>

        {showSideLabel && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="consult-fab-side-label shadow-lg"
            style={{
              backgroundColor: fab.color,
              boxShadow: `0 8px 20px ${hexToRgba(fab.color, 0.3)}`,
            }}
          >
            {fab.label}
          </button>
        )}
      </div>
    </div>
  );
};
