import React, { useEffect, useMemo, useState } from 'react';
import type { Workshop } from '../../types';
import { MediaField } from '../media/MediaField';
import { deleteWorkshop, saveWorkshop, subscribeWorkshops } from '../../lib/dbService';
import { CLINIC_INFO } from '../../data/clinicData';
import { digitsOnly } from '../../lib/contactInfo';

const fieldCls =
  'w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30';

function blankWorkshop(): Workshop {
  return {
    id: `workshop-${Date.now().toString(36)}`,
    title: '',
    description: '',
    posterUrl: '',
    registrationPhone: CLINIC_INFO.phone1,
    registrationPhoneClean: CLINIC_INFO.phoneClean,
    active: true,
    sortOrder: 1,
  };
}

export const WorkshopsAdminPanel: React.FC = () => {
  const [items, setItems] = useState<Workshop[]>([]);
  const [editing, setEditing] = useState<Workshop | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => subscribeWorkshops(setItems), []);

  const sorted = useMemo(
    () =>
      [...items].sort(
        (a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999) || a.title.localeCompare(b.title, 'fa')
      ),
    [items]
  );

  const openNew = () => {
    const nextOrder = sorted.length
      ? Math.max(...sorted.map((w) => w.sortOrder ?? 0)) + 1
      : 1;
    setEditing({ ...blankWorkshop(), sortOrder: nextOrder });
    setMsg(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const title = editing.title.trim();
    if (!title) {
      setMsg({ type: 'error', text: 'عنوان کارگاه الزامی است.' });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const phone = (editing.registrationPhone || '').trim();
      const payload: Workshop = {
        ...editing,
        title,
        description: (editing.description || '').trim(),
        posterUrl: (editing.posterUrl || '').trim(),
        registrationPhone: phone,
        registrationPhoneClean: digitsOnly(phone) || editing.registrationPhoneClean || '',
        active: editing.active !== false,
        sortOrder: Number(editing.sortOrder) || 0,
      };
      await saveWorkshop(payload);
      setEditing(null);
      setMsg({ type: 'success', text: 'کارگاه ذخیره شد.' });
    } catch (err) {
      setMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'خطا در ذخیره کارگاه',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('این کارگاه حذف شود؟')) return;
    try {
      await deleteWorkshop(id);
      if (editing?.id === id) setEditing(null);
      setMsg({ type: 'success', text: 'کارگاه حذف شد.' });
    } catch (err) {
      setMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'خطا در حذف کارگاه',
      });
    }
  };

  const toggleActive = async (w: Workshop) => {
    try {
      await saveWorkshop({ ...w, active: w.active === false });
    } catch (err) {
      setMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'خطا در تغییر وضعیت',
      });
    }
  };

  return (
    <div className="space-y-5">
      {msg && (
        <div
          className={`p-3 rounded-2xl border text-xs font-bold ${
            msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-on-surface">مدیریت کارگاه‌ها</h2>
          <p className="text-[11px] text-on-surface-variant mt-0.5">
            پوستر، توضیح و شماره تماس ثبت‌نام — نمایش در صفحه عمومی `/workshops`
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="px-4 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-base">add</span>
          کارگاه جدید
        </button>
      </div>

      {editing && (
        <form
          onSubmit={handleSave}
          className="bg-white dark:bg-surface-dim rounded-3xl border border-outline-variant/30 shadow-soft p-5 space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-black text-primary">
              {items.some((w) => w.id === editing.id) ? 'ویرایش کارگاه' : 'کارگاه جدید'}
            </h3>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="text-xs font-bold text-on-surface-variant hover:text-primary"
            >
              انصراف
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold mb-1">عنوان *</label>
              <input
                className={fieldCls}
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                placeholder="مثلاً کارگاه والدگری در عصر دیجیتال"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold mb-1">توضیحات</label>
              <textarea
                className={fieldCls}
                rows={3}
                value={editing.description || ''}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                placeholder="متن کوتاه برای ثبت‌نام و معرفی کارگاه"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">شماره تماس ثبت‌نام</label>
              <input
                className={fieldCls}
                dir="ltr"
                value={editing.registrationPhone || ''}
                onChange={(e) => setEditing({ ...editing, registrationPhone: e.target.value })}
                placeholder={CLINIC_INFO.phone1}
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">ترتیب نمایش</label>
              <input
                type="number"
                className={fieldCls}
                value={editing.sortOrder ?? 1}
                onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="md:col-span-2">
              <MediaField
                label="پوستر کارگاه"
                value={editing.posterUrl || ''}
                onChange={(url) => setEditing({ ...editing, posterUrl: url })}
                accept="image"
                aspect="portrait"
                helperText="تصویر پوستر از کتابخانه رسانه یا آپلود جدید"
              />
            </div>
            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={editing.active !== false}
                onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                className="w-4 h-4 accent-primary rounded"
              />
              نمایش در سایت (فعال)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="px-4 py-2.5 border border-outline-variant rounded-xl text-xs font-bold"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold disabled:opacity-50"
            >
              {saving ? 'در حال ذخیره…' : 'ذخیره کارگاه'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sorted.length === 0 && !editing && (
          <div className="col-span-full text-center py-12 rounded-3xl border border-dashed border-outline-variant bg-surface-container-low">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">event</span>
            <p className="text-sm font-bold mt-2">هنوز کارگاهی ثبت نشده است</p>
            <p className="text-xs text-on-surface-variant mt-1">با دکمه «کارگاه جدید» شروع کنید</p>
          </div>
        )}
        {sorted.map((w) => (
          <article
            key={w.id}
            className="bg-white dark:bg-surface-dim rounded-3xl border border-outline-variant/30 overflow-hidden shadow-soft flex flex-col"
          >
            {w.posterUrl ? (
              <img src={w.posterUrl} alt={w.title} className="w-full aspect-[4/5] object-cover" />
            ) : (
              <div className="w-full aspect-[4/5] bg-surface-container-low flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-5xl">image</span>
              </div>
            )}
            <div className="p-4 space-y-2 flex-1 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-black text-on-surface">{w.title}</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    w.active !== false
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {w.active !== false ? 'فعال' : 'غیرفعال'}
                </span>
              </div>
              {w.description && (
                <p className="text-[11px] text-on-surface-variant line-clamp-2 flex-1">{w.description}</p>
              )}
              <p className="text-[11px] font-bold text-secondary" dir="ltr">
                {w.registrationPhone || '—'}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(w);
                    setMsg(null);
                  }}
                  className="flex-1 py-2 rounded-xl border border-primary text-primary text-[11px] font-bold"
                >
                  ویرایش
                </button>
                <button
                  type="button"
                  onClick={() => void toggleActive(w)}
                  className="px-3 py-2 rounded-xl border border-outline-variant text-[11px] font-bold"
                >
                  {w.active !== false ? 'غیرفعال' : 'فعال'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(w.id)}
                  className="px-3 py-2 rounded-xl border border-rose-200 text-rose-600 text-[11px] font-bold"
                >
                  حذف
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
