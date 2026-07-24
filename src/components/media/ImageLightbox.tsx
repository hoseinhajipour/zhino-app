import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export type LightboxItem = {
  src: string;
  alt?: string;
  caption?: string;
  subtitle?: string;
};

interface ImageLightboxProps {
  items: LightboxItem[];
  index: number;
  open: boolean;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  items,
  index,
  open,
  onClose,
  onIndexChange,
}) => {
  const safeIndex = items.length ? ((index % items.length) + items.length) % items.length : 0;
  const current = items[safeIndex];
  const multi = items.length > 1;

  const go = useCallback(
    (delta: number) => {
      if (!items.length) return;
      onIndexChange((((safeIndex + delta) % items.length) + items.length) % items.length);
    },
    [items.length, onIndexChange, safeIndex]
  );

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(-1); // RTL: right = previous visual
      if (e.key === 'ArrowLeft') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, go]);

  if (!open || !current?.src || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="بزرگ‌نمایی تصویر"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/85 backdrop-blur-sm cursor-zoom-out"
        aria-label="بستن"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-5xl max-h-[92vh] flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 shrink-0">
          <p className="text-white/80 text-xs font-bold" dir="ltr">
            {multi ? `${safeIndex + 1} / ${items.length}` : ''}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="بستن"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="relative flex-1 min-h-0 flex items-center justify-center">
          {multi && (
            <>
              <button
                type="button"
                aria-label="قبلی"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                className="absolute right-0 sm:-right-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/95 text-on-surface shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
              >
                <span className="material-symbols-outlined text-2xl">chevron_right</span>
              </button>
              <button
                type="button"
                aria-label="بعدی"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                className="absolute left-0 sm:-left-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/95 text-on-surface shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
              >
                <span className="material-symbols-outlined text-2xl">chevron_left</span>
              </button>
            </>
          )}

          <img
            src={current.src}
            alt={current.alt || current.caption || 'تصویر'}
            className="max-h-[75vh] max-w-full w-auto object-contain rounded-xl shadow-2xl select-none"
            draggable={false}
          />
        </div>

        {(current.caption || current.subtitle) && (
          <div className="text-center space-y-1 px-2 shrink-0">
            {current.caption && (
              <p className="text-white text-sm sm:text-base font-bold">{current.caption}</p>
            )}
            {current.subtitle && (
              <p className="text-white/70 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto">
                {current.subtitle}
              </p>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
