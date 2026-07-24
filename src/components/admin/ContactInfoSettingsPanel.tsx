import React, { useEffect, useState } from 'react';
import type { ClinicContactInfo, ConsultFabSettings } from '../../types';
import {
  DEFAULT_CONTACT_INFO,
  DEFAULT_FAB_SETTINGS,
  FAB_ICON_PRESETS,
  mergeContactInfo,
  mergeFabSettings,
  newAddressItem,
  newPhoneItem,
} from '../../lib/contactInfo';

interface ContactInfoSettingsPanelProps {
  value: ClinicContactInfo;
  onChange: (next: ClinicContactInfo) => void;
  onSave: () => Promise<void> | void;
  saving?: boolean;
  saveMsg?: { type: 'success' | 'error'; msg: string } | null;
}

const field =
  'w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30';

export const ContactInfoSettingsPanel: React.FC<ContactInfoSettingsPanelProps> = ({
  value,
  onChange,
  onSave,
  saving,
  saveMsg,
}) => {
  const [draft, setDraft] = useState<ClinicContactInfo>(() =>
    mergeContactInfo(value || DEFAULT_CONTACT_INFO)
  );

  useEffect(() => {
    setDraft(mergeContactInfo(value || DEFAULT_CONTACT_INFO));
  }, [value]);

  const fab = mergeFabSettings(draft.fab);

  const patch = (partial: Partial<ClinicContactInfo>) => {
    const next = { ...draft, ...partial };
    setDraft(next);
    onChange(next);
  };

  const patchFab = (partial: Partial<ConsultFabSettings>) => {
    patch({ fab: mergeFabSettings({ ...fab, ...partial }) });
  };

  const updatePhone = (id: string, key: 'label' | 'number' | 'telHref', val: string) => {
    patch({
      phones: draft.phones.map((p) => (p.id === id ? { ...p, [key]: val } : p)),
    });
  };

  const updateAddress = (
    id: string,
    key: 'title' | 'text' | 'lat' | 'lng',
    val: string
  ) => {
    patch({
      addresses: draft.addresses.map((a) => {
        if (a.id !== id) return a;
        if (key === 'lat' || key === 'lng') {
          const n = val.trim() === '' ? undefined : Number(val);
          return { ...a, [key]: Number.isFinite(n as number) ? n : undefined };
        }
        return { ...a, [key]: val };
      }),
    });
  };

  return (
    <div className="space-y-6">
      {saveMsg && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            saveMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span className="material-symbols-outlined">
            {saveMsg.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{saveMsg.msg}</span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 md:p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-base text-slate-900 dark:text-white">تلفن‌ها</h3>
            <p className="text-xs text-slate-500 mt-1">می‌توانید چند شماره اضافه یا حذف کنید</p>
          </div>
          <button
            type="button"
            onClick={() => patch({ phones: [...draft.phones, newPhoneItem()] })}
            className="px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-colors"
          >
            + افزودن تلفن
          </button>
        </div>
        <div className="space-y-3">
          {draft.phones.map((phone, idx) => (
            <div
              key={phone.id}
              className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800"
            >
              <div className="md:col-span-3">
                <label className="text-[11px] font-bold text-slate-500 mb-1 block">برچسب</label>
                <input
                  className={field}
                  value={phone.label}
                  onChange={(e) => updatePhone(phone.id, 'label', e.target.value)}
                  placeholder={`تلفن ${idx + 1}`}
                />
              </div>
              <div className="md:col-span-4">
                <label className="text-[11px] font-bold text-slate-500 mb-1 block">شماره نمایشی</label>
                <input
                  className={field}
                  dir="ltr"
                  value={phone.number}
                  onChange={(e) => updatePhone(phone.id, 'number', e.target.value)}
                  placeholder="۰۲۱-۸۸۷۷۶۶۵۵"
                />
              </div>
              <div className="md:col-span-4">
                <label className="text-[11px] font-bold text-slate-500 mb-1 block">لینک tel (ارقام)</label>
                <input
                  className={field}
                  dir="ltr"
                  value={phone.telHref || ''}
                  onChange={(e) => updatePhone(phone.id, 'telHref', e.target.value)}
                  placeholder="02188776655"
                />
              </div>
              <div className="md:col-span-1 flex items-end">
                <button
                  type="button"
                  disabled={draft.phones.length <= 1}
                  onClick={() =>
                    patch({ phones: draft.phones.filter((p) => p.id !== phone.id) })
                  }
                  className="w-full h-[42px] rounded-xl bg-rose-50 text-rose-600 disabled:opacity-40 hover:bg-rose-600 hover:text-white transition-colors"
                  title="حذف"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 md:p-6 space-y-4 shadow-sm">
        <div>
          <h3 className="font-black text-base text-slate-900 dark:text-white">پیام‌رسان‌ها و ایمیل</h3>
          <p className="text-xs text-slate-500 mt-1">
            شماره واتساپ با کد کشور؛ برای اینستاگرام/تلگرام/بله/ایتا/روبیکا آیدی یا لینک کامل
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(
            [
              ['whatsapp', 'واتساپ', '+98912...'],
              ['email', 'ایمیل', 'info@example.com'],
              ['telegram', 'تلگرام', '@username یا https://t.me/...'],
              ['instagram', 'اینستاگرام', '@username یا https://instagram.com/...'],
              ['bale', 'بله', '@username یا https://ble.ir/...'],
              ['eitaa', 'ایتا', '@username یا https://eitaa.com/...'],
              ['rubika', 'روبیکا', '@username یا https://rubika.ir/...'],
            ] as const
          ).map(([key, label, placeholder]) => (
            <div key={key}>
              <label className="text-[11px] font-bold text-slate-500 mb-1 block">{label}</label>
              <input
                className={field}
                dir="ltr"
                value={draft[key]}
                onChange={(e) => patch({ [key]: e.target.value })}
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 md:p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-base text-slate-900 dark:text-white">آدرس‌ها و موقعیت</h3>
            <p className="text-xs text-slate-500 mt-1">متن آدرس به‌همراه مختصات گوگل‌مپ (اختیاری)</p>
          </div>
          <button
            type="button"
            onClick={() => patch({ addresses: [...draft.addresses, newAddressItem()] })}
            className="px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-white transition-colors"
          >
            + افزودن آدرس
          </button>
        </div>
        <div className="space-y-3">
          {draft.addresses.map((addr) => (
            <div
              key={addr.id}
              className="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                <div className="md:col-span-4">
                  <label className="text-[11px] font-bold text-slate-500 mb-1 block">عنوان</label>
                  <input
                    className={field}
                    value={addr.title}
                    onChange={(e) => updateAddress(addr.id, 'title', e.target.value)}
                    placeholder="دفتر مرکزی"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="text-[11px] font-bold text-slate-500 mb-1 block">عرض جغرافیایی</label>
                  <input
                    className={field}
                    dir="ltr"
                    value={addr.lat ?? ''}
                    onChange={(e) => updateAddress(addr.id, 'lat', e.target.value)}
                    placeholder="35.7575"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="text-[11px] font-bold text-slate-500 mb-1 block">طول جغرافیایی</label>
                  <input
                    className={field}
                    dir="ltr"
                    value={addr.lng ?? ''}
                    onChange={(e) => updateAddress(addr.id, 'lng', e.target.value)}
                    placeholder="51.41"
                  />
                </div>
                <div className="md:col-span-2 flex items-end">
                  <button
                    type="button"
                    disabled={draft.addresses.length <= 1}
                    onClick={() =>
                      patch({ addresses: draft.addresses.filter((a) => a.id !== addr.id) })
                    }
                    className="w-full h-[42px] rounded-xl bg-rose-50 text-rose-600 disabled:opacity-40 hover:bg-rose-600 hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 mb-1 block">متن آدرس</label>
                <textarea
                  className={`${field} min-h-[72px]`}
                  value={addr.text}
                  onChange={(e) => updateAddress(addr.id, 'text', e.target.value)}
                  placeholder="تهران، ..."
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 md:p-6 space-y-4 shadow-sm">
        <div>
          <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">smart_button</span>
            تنظیمات دکمه شناور مشاوره
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            ظاهر، موقعیت و انیمیشن دکمه تماس شناور در فرانت سایت
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm font-bold">
          <input
            type="checkbox"
            checked={fab.enabled}
            onChange={(e) => patchFab({ enabled: e.target.checked })}
          />
          نمایش دکمه شناور در سایت
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-slate-500">تراز صفحه</span>
            <select
              className={field}
              value={fab.position}
              onChange={(e) =>
                patchFab({ position: e.target.value === 'left' ? 'left' : 'right' })
              }
            >
              <option value="right">گوشه پایین راست</option>
              <option value="left">گوشه پایین چپ</option>
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-slate-500">انیمیشن ورود</span>
            <select
              className={field}
              value={fab.entryAnimation}
              onChange={(e) =>
                patchFab({
                  entryAnimation: e.target.value as ConsultFabSettings['entryAnimation'],
                })
              }
            >
              <option value="fadeUp">محو + بالا آمدن</option>
              <option value="scale">بزرگ‌شدن (Scale)</option>
              <option value="bounce">پرش (Bounce)</option>
              <option value="slide">ورود از کنار</option>
              <option value="none">بدون انیمیشن</option>
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-slate-500">رنگ دکمه</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(fab.color) ? fab.color : DEFAULT_FAB_SETTINGS.color}
                onChange={(e) => patchFab({ color: e.target.value })}
                className="w-12 h-11 rounded-xl border border-slate-200 cursor-pointer bg-transparent"
              />
              <input
                className={field}
                dir="ltr"
                value={fab.color}
                onChange={(e) => patchFab({ color: e.target.value })}
                placeholder="#b5106a"
              />
            </div>
          </label>

          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-slate-500">متن کناری (مثلاً مشاوره)</span>
            <input
              className={field}
              value={fab.label}
              onChange={(e) => patchFab({ label: e.target.value })}
              placeholder="مشاوره"
            />
          </label>
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-500 block">آیکون دکمه</span>
          <div className="flex flex-wrap gap-2">
            {FAB_ICON_PRESETS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => patchFab({ icon })}
                title={icon}
                className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-colors ${
                  fab.icon === icon
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:border-primary/40'
                }`}
              >
                <span className="material-symbols-outlined text-xl">{icon}</span>
              </button>
            ))}
          </div>
          <input
            className={field}
            dir="ltr"
            value={fab.icon}
            onChange={(e) => patchFab({ icon: e.target.value.trim() })}
            placeholder="support_agent"
          />
          <p className="text-[10px] text-slate-500">
            نام آیکون Material Symbols — یا از نمونه‌های بالا انتخاب کنید
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm font-bold">
            <input
              type="checkbox"
              checked={fab.showLabel}
              onChange={(e) => patchFab({ showLabel: e.target.checked })}
            />
            نمایش متن کناری کنار دکمه
          </label>
          <label className="flex items-center gap-2 text-sm font-bold">
            <input
              type="checkbox"
              checked={fab.pulse}
              onChange={(e) => patchFab({ pulse: e.target.checked })}
            />
            پالس / نقطه چشمک‌زن
          </label>
        </div>

        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-950/50">
          <p className="text-[11px] font-bold text-slate-500 mb-3">پیش‌نمایش</p>
          <div
            className={`flex items-center gap-2.5 ${
              fab.position === 'left' ? 'justify-start flex-row' : 'justify-end flex-row-reverse'
            }`}
          >
            <div
              className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white"
              style={{ backgroundColor: fab.color }}
            >
              <span className="material-symbols-outlined text-2xl">{fab.icon || 'support_agent'}</span>
            </div>
            {fab.showLabel && fab.label && (
              <span
                className="text-white text-xs font-extrabold px-3.5 py-2.5 rounded-full shadow"
                style={{ backgroundColor: fab.color }}
              >
                {fab.label}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={saving}
          onClick={() => onSave()}
          className="px-6 py-3 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary-container disabled:opacity-60 transition-all flex items-center gap-2"
        >
          {saving ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="material-symbols-outlined text-lg">save</span>
          )}
          ذخیره اطلاعات تماس
        </button>
      </div>
    </div>
  );
};
