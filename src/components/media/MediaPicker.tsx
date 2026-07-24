import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  deleteMediaFile,
  fetchMediaLibrary,
  MediaLibraryItem,
  uploadFile,
} from '../../lib/dbService';

export type MediaAccept = 'image' | 'video' | 'all';

interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  accept?: MediaAccept;
  title?: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const MediaPicker: React.FC<MediaPickerProps> = ({
  open,
  onClose,
  onSelect,
  accept = 'image',
  title = 'کتابخانه رسانه',
}) => {
  const [tab, setTab] = useState<'library' | 'upload'>('library');
  const [items, setItems] = useState<MediaLibraryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadLibrary = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchMediaLibrary(accept === 'video' ? 'video' : accept === 'all' ? 'all' : 'image');
      setItems(data);
    } catch {
      setError('خطا در بارگذاری کتابخانه رسانه');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setTab('library');
    setSelectedUrl(null);
    setSearch('');
    void loadLibrary();
  }, [open, accept]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.filename.toLowerCase().includes(q) ||
        item.url.toLowerCase().includes(q) ||
        item.source.includes(q)
    );
  }, [items, search]);

  if (!open) return null;

  const acceptAttr =
    accept === 'image' ? 'image/*' : accept === 'video' ? 'video/*' : 'image/*,video/*';

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError('');
    try {
      let lastUrl = '';
      for (const file of Array.from(files)) {
        if (accept === 'image' && !file.type.startsWith('image/')) {
          throw new Error('فقط تصویر مجاز است');
        }
        if (accept === 'video' && !file.type.startsWith('video/')) {
          throw new Error('فقط ویدیو مجاز است');
        }
        if (file.size > 50 * 1024 * 1024) {
          throw new Error('حجم فایل نباید بیشتر از ۵۰ مگابایت باشد');
        }
        lastUrl = await uploadFile(file);
      }
      await loadLibrary();
      setTab('library');
      if (lastUrl) setSelectedUrl(lastUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا در آپلود');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (item: MediaLibraryItem) => {
    if (item.source !== 'uploads') {
      alert('فایل‌های پوشه پرسنل فقط از طریق فایل‌سیستم قابل حذف هستند.');
      return;
    }
    if (!window.confirm(`حذف «${item.filename}»؟`)) return;
    try {
      await deleteMediaFile(item.filename);
      if (selectedUrl === item.url) setSelectedUrl(null);
      await loadLibrary();
    } catch {
      alert('حذف فایل ناموفق بود');
    }
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm" dir="rtl">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-teal-600">photo_library</span>
            <h2 className="text-sm font-black text-slate-900 dark:text-white truncate">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </header>

        <div className="flex items-center gap-2 px-4 sm:px-5 py-3 border-b border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setTab('library')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold ${
              tab === 'library' ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
            }`}
          >
            کتابخانه رسانه
          </button>
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold ${
              tab === 'upload' ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
            }`}
          >
            آپلود جدید
          </button>
          {tab === 'library' && (
            <div className="flex-1 relative max-w-xs mr-auto">
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                search
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="جستجوی فایل..."
                className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
              />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 min-h-[360px]">
          {error && (
            <div className="mb-3 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
              {error}
            </div>
          )}

          {tab === 'upload' ? (
            <div
              className="h-full min-h-[320px] border-2 border-dashed border-teal-300 rounded-3xl bg-teal-50/50 dark:bg-teal-950/20 flex flex-col items-center justify-center gap-3 p-8 text-center cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void handleUpload(e.dataTransfer.files);
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptAttr}
                multiple
                className="hidden"
                onChange={(e) => void handleUpload(e.target.files)}
              />
              {uploading ? (
                <span className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-5xl text-teal-600">cloud_upload</span>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                    فایل را بکشید و رها کنید یا کلیک کنید
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {accept === 'video'
                      ? 'ویدیو تا ۵۰ مگابایت'
                      : accept === 'all'
                        ? 'تصویر یا ویدیو تا ۵۰ مگابایت'
                        : 'تصویر تا ۵۰ مگابایت'}
                  </p>
                </>
              )}
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-64 text-xs text-slate-500 gap-2">
              <span className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
              در حال بارگذاری...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
              <span className="material-symbols-outlined text-4xl">folder_off</span>
              <p className="text-xs font-bold">رسانه‌ای یافت نشد</p>
              <button
                type="button"
                onClick={() => setTab('upload')}
                className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold"
              >
                آپلود اولین فایل
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filtered.map((item) => {
                const selected = selectedUrl === item.url;
                return (
                  <div
                    key={`${item.source}-${item.filename}`}
                    className={`group relative rounded-2xl overflow-hidden border-2 bg-slate-50 dark:bg-slate-800 cursor-pointer transition-all ${
                      selected ? 'border-teal-600 shadow-lg' : 'border-transparent hover:border-teal-300'
                    }`}
                    onClick={() => setSelectedUrl(item.url)}
                    onDoubleClick={() => {
                      onSelect(item.url);
                      onClose();
                    }}
                  >
                    <div className="aspect-square bg-slate-200 dark:bg-slate-700">
                      {item.kind === 'image' ? (
                        <img src={item.url} alt={item.filename} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-1">
                          <span className="material-symbols-outlined text-3xl">movie</span>
                          <span className="text-[10px] font-bold px-2 truncate max-w-full">{item.filename}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-2 space-y-0.5">
                      <p className="text-[10px] font-bold truncate text-slate-800 dark:text-slate-100">
                        {item.filename}
                      </p>
                      <p className="text-[9px] text-slate-500 flex justify-between gap-1">
                        <span>{formatSize(item.size)}</span>
                        <span>{item.source === 'staff' ? 'پرسنل' : 'آپلود'}</span>
                      </p>
                    </div>
                    {selected && (
                      <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center shadow">
                        <span className="material-symbols-outlined text-sm">check</span>
                      </span>
                    )}
                    {item.source === 'uploads' && (
                      <button
                        type="button"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDelete(item);
                        }}
                        title="حذف"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50">
          <p className="text-[11px] text-slate-500 font-bold">
            {filtered.length} فایل · دابل‌کلیک برای انتخاب سریع
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
            >
              انصراف
            </button>
            <button
              type="button"
              disabled={!selectedUrl}
              onClick={() => {
                if (!selectedUrl) return;
                onSelect(selectedUrl);
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-teal-600 disabled:opacity-40 text-white text-xs font-black"
            >
              انتخاب رسانه
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
