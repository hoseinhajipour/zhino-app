import React, { useState } from 'react';
import { MediaAccept, MediaPicker } from './MediaPicker';

interface MediaFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: MediaAccept;
  aspect?: 'video' | 'square' | 'portrait';
  helperText?: string;
  required?: boolean;
}

const aspectClass = {
  video: 'aspect-video',
  square: 'aspect-square',
  portrait: 'aspect-[3/4]',
};

export const MediaField: React.FC<MediaFieldProps> = ({
  label,
  value,
  onChange,
  accept = 'image',
  aspect = 'video',
  helperText,
  required,
}) => {
  const [open, setOpen] = useState(false);
  const isVideo = accept === 'video' || (value && /\.(mp4|webm|ogg|mov)(\?|$)/i.test(value));

  return (
    <div className="space-y-2 text-right">
      <div className="flex items-center justify-between gap-2">
        <label className="block font-bold text-xs text-on-surface">
          {label}
          {required ? ' *' : ''}
        </label>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-[11px] font-bold text-teal-700 hover:underline flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">photo_library</span>
          <span>کتابخانه رسانه</span>
        </button>
      </div>

      {value ? (
        <div
          className={`relative ${aspectClass[aspect]} w-full rounded-2xl overflow-hidden border border-outline-variant/40 shadow-sm bg-surface-container group`}
        >
          {isVideo ? (
            <video src={value} className="w-full h-full object-cover" controls />
          ) : (
            <img src={value} alt={label} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="bg-white text-slate-800 hover:bg-slate-100 text-xs font-bold px-3 py-2 rounded-xl shadow flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              <span>تغییر</span>
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="bg-rose-600 text-white hover:bg-rose-700 text-xs font-bold px-3 py-2 rounded-xl shadow flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
              <span>حذف</span>
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full p-6 border-2 border-dashed border-teal-400/40 hover:border-teal-600 bg-teal-50/40 hover:bg-teal-50 rounded-2xl transition-all flex flex-col items-center justify-center gap-2 text-teal-700"
        >
          <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
          <span className="font-extrabold text-xs">انتخاب یا آپلود رسانه</span>
          {helperText && <span className="text-[10px] text-on-surface-variant">{helperText}</span>}
        </button>
      )}

      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold text-on-surface-variant shrink-0">یا لینک مستقیم:</span>
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://... یا /uploads/..."
          dir="ltr"
          className="flex-1 p-2 rounded-xl border border-outline-variant/40 bg-surface-container-low font-mono text-xs"
        />
      </div>

      <MediaPicker
        open={open}
        onClose={() => setOpen(false)}
        onSelect={onChange}
        accept={accept}
        title={label}
      />
    </div>
  );
};
