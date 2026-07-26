import React from 'react';
import { MediaField } from '../media/MediaField';

const fieldClass =
  'w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-low text-xs outline-none focus:border-primary';

function TextInput({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-bold text-on-surface-variant">{label}</span>
      {multiline ? (
        <textarea
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={fieldClass}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={fieldClass}
        />
      )}
    </label>
  );
}

type AudioTrack = {
  url?: string;
  title?: string;
  artist?: string;
  coverImage?: string;
};

function updateTrack(tracks: AudioTrack[], index: number, patch: Partial<AudioTrack>): AudioTrack[] {
  return tracks.map((item, i) => (i === index ? { ...item, ...patch } : item));
}

export function AudioPlayerBlockSettings({
  props,
  onChange,
}: {
  props: Record<string, unknown>;
  onChange: (props: Record<string, unknown>) => void;
}) {
  const set = (key: string, value: unknown) => onChange({ ...props, [key]: value });
  const mode = String(props.mode || 'single') === 'playlist' ? 'playlist' : 'single';
  const tracks = (Array.isArray(props.tracks) ? props.tracks : []) as AudioTrack[];

  return (
    <div className="space-y-4">
      <TextInput label="عنوان بخش" value={String(props.title || '')} onChange={(v) => set('title', v)} />
      <TextInput
        label="زیرعنوان"
        value={String(props.subtitle || '')}
        onChange={(v) => set('subtitle', v)}
        multiline
      />

      <label className="block space-y-1">
        <span className="text-[11px] font-bold text-on-surface-variant">حالت پخش</span>
        <select
          value={mode}
          onChange={(e) => set('mode', e.target.value)}
          className={fieldClass}
        >
          <option value="single">تک‌آهنگ</option>
          <option value="playlist">پلی‌لیست</option>
        </select>
      </label>

      {mode === 'single' ? (
        <div className="space-y-3 p-3 rounded-xl border border-outline-variant/20 bg-surface-container-low/40">
          <p className="text-[11px] font-black text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-base">music_note</span>
            قطعه صوتی
          </p>
          <MediaField
            label="فایل صدا"
            value={String(props.audioUrl || '')}
            onChange={(v) => set('audioUrl', v)}
            accept="audio"
            helperText="MP3، WAV، M4A و…"
          />
          <TextInput
            label="عنوان قطعه"
            value={String(props.trackTitle || '')}
            onChange={(v) => set('trackTitle', v)}
          />
          <TextInput
            label="هنرمند / گوینده"
            value={String(props.artist || '')}
            onChange={(v) => set('artist', v)}
          />
          <MediaField
            label="کاور (اختیاری)"
            value={String(props.coverImage || '')}
            onChange={(v) => set('coverImage', v)}
            accept="image"
            aspect="square"
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-base">queue_music</span>
              فهرست پخش ({tracks.length})
            </p>
            <button
              type="button"
              className="text-[11px] font-bold text-primary"
              onClick={() =>
                set('tracks', [
                  ...tracks,
                  { url: '', title: `قطعه ${tracks.length + 1}`, artist: '', coverImage: '' },
                ])
              }
            >
              + افزودن قطعه
            </button>
          </div>

          {tracks.map((track, idx) => (
            <div
              key={idx}
              className="space-y-2 p-3 rounded-xl border border-outline-variant/20 bg-surface-container-low/40"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-black text-on-surface">قطعه {idx + 1}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    className="w-7 h-7 rounded-lg border border-outline-variant/30 disabled:opacity-30 flex items-center justify-center"
                    onClick={() => {
                      if (idx === 0) return;
                      const next = [...tracks];
                      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                      set('tracks', next);
                    }}
                    title="بالا"
                  >
                    <span className="material-symbols-outlined text-sm">arrow_upward</span>
                  </button>
                  <button
                    type="button"
                    disabled={idx >= tracks.length - 1}
                    className="w-7 h-7 rounded-lg border border-outline-variant/30 disabled:opacity-30 flex items-center justify-center"
                    onClick={() => {
                      if (idx >= tracks.length - 1) return;
                      const next = [...tracks];
                      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                      set('tracks', next);
                    }}
                    title="پایین"
                  >
                    <span className="material-symbols-outlined text-sm">arrow_downward</span>
                  </button>
                  <button
                    type="button"
                    className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center"
                    onClick={() => set('tracks', tracks.filter((_, i) => i !== idx))}
                    title="حذف"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>

              <MediaField
                label="فایل صدا"
                value={String(track.url || '')}
                onChange={(v) => set('tracks', updateTrack(tracks, idx, { url: v }))}
                accept="audio"
              />
              <TextInput
                label="عنوان"
                value={String(track.title || '')}
                onChange={(v) => set('tracks', updateTrack(tracks, idx, { title: v }))}
              />
              <TextInput
                label="هنرمند / گوینده"
                value={String(track.artist || '')}
                onChange={(v) => set('tracks', updateTrack(tracks, idx, { artist: v }))}
              />
              <MediaField
                label="کاور"
                value={String(track.coverImage || '')}
                onChange={(v) => set('tracks', updateTrack(tracks, idx, { coverImage: v }))}
                accept="image"
                aspect="square"
                compact
              />
            </div>
          ))}

          {!tracks.length && (
            <p className="text-[11px] text-on-surface-variant text-center py-4 border border-dashed border-outline-variant/40 rounded-xl">
              هنوز قطعه‌ای اضافه نشده است.
            </p>
          )}
        </div>
      )}

      <div className="space-y-2 p-3 rounded-xl border border-outline-variant/20 bg-surface-container-low/40">
        <p className="text-[11px] font-black text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-base">tune</span>
          نمایش و پخش
        </p>

        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">سبک نمایش</span>
          <select
            value={String(props.layout || 'card')}
            onChange={(e) => set('layout', e.target.value)}
            className={fieldClass}
          >
            <option value="card">کارت کامل</option>
            <option value="minimal">مینیمال</option>
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">
            گردی گوشه ({Number(props.borderRadius) || 20}px)
          </span>
          <input
            type="range"
            min={0}
            max={40}
            value={Number(props.borderRadius) ?? 20}
            onChange={(e) => set('borderRadius', Number(e.target.value))}
            className="w-full"
          />
        </label>

        <label className="flex items-center gap-2 text-xs font-bold">
          <input
            type="checkbox"
            checked={props.showCover !== false}
            onChange={(e) => set('showCover', e.target.checked)}
          />
          نمایش کاور
        </label>

        {mode === 'playlist' && (
          <label className="flex items-center gap-2 text-xs font-bold">
            <input
              type="checkbox"
              checked={props.showPlaylist !== false}
              onChange={(e) => set('showPlaylist', e.target.checked)}
            />
            نمایش فهرست پخش
          </label>
        )}

        <label className="flex items-center gap-2 text-xs font-bold">
          <input
            type="checkbox"
            checked={props.autoplay === true}
            onChange={(e) => set('autoplay', e.target.checked)}
          />
          پخش خودکار
        </label>

        <label className="flex items-center gap-2 text-xs font-bold">
          <input
            type="checkbox"
            checked={props.loop === true}
            onChange={(e) => set('loop', e.target.checked)}
          />
          {mode === 'playlist' ? 'تکرار پلی‌لیست' : 'تکرار قطعه'}
        </label>
      </div>
    </div>
  );
}
