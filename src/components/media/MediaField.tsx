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
  /** Smaller preview — useful for logo/favicon side-by-side */
  compact?: boolean;
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
  compact = false,
}) => {
  const [open, setOpen] = useState(false);
  const isVideo =
    accept === 'video' || (Boolean(value) && /\.(mp4|webm|ogg|mov)(\?|$)/i.test(value));
  const isAudio =
    accept === 'audio' ||
    (Boolean(value) && /\.(mp3|wav|m4a|aac|flac|oga|opus)(\?|$)/i.test(value));
  const previewBox = compact
    ? `relative ${isAudio ? 'min-h-[88px]' : aspectClass[aspect]} w-full max-w-[120px] mx-auto rounded-xl overflow-hidden border border-outline-variant/40 shadow-sm bg-surface-container group`
    : `relative ${isAudio ? 'min-h-[96px]' : aspectClass[aspect]} w-full rounded-2xl overflow-hidden border border-outline-variant/40 shadow-sm bg-surface-container group`;

  return (
    <div className={`space-y-2 text-right ${compact ? 'text-[11px]' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <label className={`block font-bold text-on-surface ${compact ? 'text-[11px]' : 'text-xs'}`}>
          {label}
          {required ? ' *' : ''}
        </label>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-[11px] font-bold text-teal-700 hover:underline flex items-center gap-1 shrink-0"
        >
          <span className="material-symbols-outlined text-sm">photo_library</span>
          <span className={compact ? 'hidden sm:inline' : ''}>کتابخانه</span>
        </button>
      </div>

      {value ? (
        <div className={previewBox}>
          {isAudio ? (
            <div className="w-full h-full flex flex-col items-stretch justify-center gap-2 p-3 bg-surface-container-low">
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-primary">audio_file</span>
                <span className="text-[10px] font-bold truncate" dir="ltr">
                  {value.split('/').pop()}
                </span>
              </div>
              <audio src={value} controls className="w-full h-8" />
            </div>
          ) : isVideo ? (
            <video src={value} className="w-full h-full object-cover" controls />
          ) : (
            <img src={value} alt={label} className="w-full h-full object-contain bg-white" />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 backdrop-blur-[2px]">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="bg-white text-slate-800 hover:bg-slate-100 text-[10px] font-bold px-2 py-1.5 rounded-lg shadow flex items-center gap-0.5"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="bg-rose-600 text-white hover:bg-rose-700 text-[10px] font-bold px-2 py-1.5 rounded-lg shadow flex items-center gap-0.5"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`w-full border-2 border-dashed border-teal-400/40 hover:border-teal-600 bg-teal-50/40 hover:bg-teal-50 rounded-xl transition-all flex flex-col items-center justify-center gap-1 text-teal-700 ${
            compact ? 'p-4 min-h-[100px]' : 'p-6 rounded-2xl gap-2'
          }`}
        >
          <span className={`material-symbols-outlined ${compact ? 'text-2xl' : 'text-3xl'}`}>
            {accept === 'audio' ? 'library_music' : 'add_photo_alternate'}
          </span>
          <span className={`font-extrabold ${compact ? 'text-[10px]' : 'text-xs'}`}>
            {accept === 'audio' ? 'انتخاب فایل صوتی' : 'انتخاب رسانه'}
          </span>
          {helperText && <span className="text-[10px] text-on-surface-variant">{helperText}</span>}
        </button>
      )}

      <div className={`flex items-center gap-2 ${compact ? 'flex-col items-stretch' : ''}`}>
        {!compact && (
          <span className="text-[11px] font-bold text-on-surface-variant shrink-0">یا لینک مستقیم:</span>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={compact ? 'لینک...' : 'https://... یا /uploads/...'}
          dir="ltr"
          className="flex-1 p-2 rounded-xl border border-outline-variant/40 bg-surface-container-low font-mono text-[11px]"
        />
      </div>

      <MediaPicker
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(url) => {
          onChange(url);
          setOpen(false);
        }}
        accept={accept}
        title={label}
      />
    </div>
  );
};
