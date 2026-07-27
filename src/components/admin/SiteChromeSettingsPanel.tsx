import React, { useState } from 'react';
import type { SiteChromeSettings, SiteContainerMode, SiteNavItem } from '../../types';
import { MediaField } from '../media/MediaField';
import {
  BUILTIN_NAV_TARGETS,
  getSiteFontOption,
  newNavItem,
  SITE_FONT_OPTIONS,
} from '../../lib/siteChromeDefaults';

type ChromeTab = 'identity' | 'header' | 'menu' | 'footer';

const CONTAINER_MODE_OPTIONS: { value: SiteContainerMode; label: string; hint: string }[] = [
  { value: '1200', label: '1200', hint: '۱۲۰۰ پیکسل' },
  { value: '1400', label: '1400', hint: '۱۴۰۰ پیکسل' },
  { value: 'full', label: 'تمام عرض', hint: 'بدون محدودیت عرض' },
  { value: 'custom', label: 'اختصاصی', hint: 'عرض دلخواه' },
];

interface SiteChromeSettingsPanelProps {
  value: SiteChromeSettings;
  onChange: (next: SiteChromeSettings) => void;
  onSave: () => Promise<void>;
  saving?: boolean;
}

const fieldClass =
  'w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs outline-none focus:ring-2 focus:ring-primary';

function TextField({
  label,
  value,
  onChange,
  multiline,
  dir,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  dir?: 'ltr' | 'rtl';
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-bold text-on-surface-variant">{label}</span>
      {multiline ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={fieldClass}
          dir={dir}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={fieldClass}
          dir={dir}
        />
      )}
    </label>
  );
}

function ColorField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const safe = /^#[0-9A-Fa-f]{6}$/.test(value) ? value : '#000000';
  return (
    <label className="block space-y-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest/60 p-3">
      <span className="text-[11px] font-bold text-on-surface block">{label}</span>
      {hint && <span className="text-[10px] text-on-surface-variant block -mt-0.5">{hint}</span>}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={safe}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-outline-variant/40 cursor-pointer shrink-0 bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={fieldClass}
          dir="ltr"
          placeholder="#000000"
        />
        <span
          className="w-8 h-8 rounded-lg border border-outline-variant/30 shrink-0 shadow-inner"
          style={{ backgroundColor: safe }}
          aria-hidden
        />
      </div>
    </label>
  );
}

function NavItemsEditor({
  items,
  onChange,
  allowChildren,
}: {
  items: SiteNavItem[];
  onChange: (items: SiteNavItem[]) => void;
  allowChildren?: boolean;
}) {
  const update = (index: number, patch: Partial<SiteNavItem>) => {
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };

  const move = (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [row] = next.splice(index, 1);
    next.splice(to, 0, row);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div
          key={item.id}
          className="p-3 rounded-2xl border border-outline-variant/30 bg-surface-container-low/50 space-y-2"
        >
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-[11px] font-bold">
              <input
                type="checkbox"
                checked={item.visible !== false}
                onChange={(e) => update(idx, { visible: e.target.checked })}
              />
              نمایش
            </label>
            <div className="flex gap-1">
              <button type="button" className="p-1 rounded hover:bg-white" onClick={() => move(idx, -1)}>
                <span className="material-symbols-outlined text-sm">arrow_upward</span>
              </button>
              <button type="button" className="p-1 rounded hover:bg-white" onClick={() => move(idx, 1)}>
                <span className="material-symbols-outlined text-sm">arrow_downward</span>
              </button>
              <button
                type="button"
                className="p-1 rounded text-rose-600 hover:bg-rose-50"
                onClick={() => onChange(items.filter((_, i) => i !== idx))}
              >
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <TextField label="برچسب" value={item.label} onChange={(v) => update(idx, { label: v })} />
            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-on-surface-variant">مقصد</span>
              <select
                value={
                  BUILTIN_NAV_TARGETS.some((t) => t.value === item.target) ? item.target : '__custom__'
                }
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    update(idx, { target: item.target.startsWith('/') ? item.target : '/p/' });
                  } else {
                    update(idx, { target: e.target.value });
                  }
                }}
                className={fieldClass}
              >
                {BUILTIN_NAV_TARGETS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
                <option value="__custom__">مسیر سفارشی / لینک</option>
              </select>
            </label>
          </div>
          {!BUILTIN_NAV_TARGETS.some((t) => t.value === item.target) && (
            <TextField
              label="مسیر یا URL (مثل /p/tariffs)"
              value={item.target}
              onChange={(v) => update(idx, { target: v })}
              dir="ltr"
            />
          )}
          {allowChildren && (
            <>
              <label className="flex items-center gap-2 text-[11px] font-bold">
                <input
                  type="checkbox"
                  checked={!!item.hasDropdown}
                  onChange={(e) =>
                    update(idx, {
                      hasDropdown: e.target.checked,
                      children: e.target.checked
                        ? item.children?.length
                          ? item.children
                          : [newNavItem({ label: 'زیرمنو', target: 'services', icon: 'grid_view' })]
                        : undefined,
                    })
                  }
                />
                دارای زیرمنو (دراپ‌داون)
              </label>
              {item.hasDropdown && (
                <div className="pr-3 border-r-2 border-primary/30 space-y-2">
                  <p className="text-[10px] font-black text-primary">زیرمنوها</p>
                  <NavItemsEditor
                    items={item.children || []}
                    onChange={(children) => update(idx, { children })}
                  />
                  <button
                    type="button"
                    className="text-[11px] font-bold text-primary"
                    onClick={() =>
                      update(idx, {
                        children: [...(item.children || []), newNavItem({ icon: 'circle' })],
                      })
                    }
                  >
                    + افزودن زیرمنو
                  </button>
                </div>
              )}
            </>
          )}
          {item.children === undefined && !allowChildren && (
            <TextField
              label="آیکون (Material Symbol)"
              value={item.icon || ''}
              onChange={(v) => update(idx, { icon: v })}
              dir="ltr"
            />
          )}
          {item.hasDropdown &&
            (item.children || []).some(Boolean) &&
            allowChildren &&
            null}
          {!item.hasDropdown && allowChildren && (
            <TextField
              label="آیکون (اختیاری)"
              value={item.icon || ''}
              onChange={(v) => update(idx, { icon: v })}
              dir="ltr"
            />
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, newNavItem()])}
        className="w-full py-2.5 rounded-xl border border-dashed border-primary/40 text-primary text-xs font-bold"
      >
        + افزودن آیتم منو
      </button>
    </div>
  );
}

export const SiteChromeSettingsPanel: React.FC<SiteChromeSettingsPanelProps> = ({
  value,
  onChange,
  onSave,
  saving,
}) => {
  const [tab, setTab] = useState<ChromeTab>('identity');
  const identity = value.identity;
  const header = value.header;
  const menu = value.menu;
  const footer = value.footer;
  const layout = value.layout;

  const tabs: { id: ChromeTab; label: string; icon: string }[] = [
    { id: 'identity', label: 'هویت و رنگ‌ها', icon: 'palette' },
    { id: 'header', label: 'هدر', icon: 'web_asset' },
    { id: 'menu', label: 'منوها', icon: 'menu' },
    { id: 'footer', label: 'فوتر', icon: 'vertical_align_bottom' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-5 py-4 md:px-6 md:py-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">brush</span>
          </div>
          <div>
            <h2 className="font-extrabold text-base md:text-lg text-on-surface">ظاهر سایت</h2>
            <p className="text-[11px] md:text-xs text-on-surface-variant mt-0.5">
              برند، رنگ‌ها، عرض کانتینر، منوی ناوبری و محتوای فوتر
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={() => void onSave()}
          className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-base">save</span>
          {saving ? 'ذخیره...' : 'ذخیره ظاهر سایت'}
        </button>
      </div>

      <div className="flex flex-wrap gap-1 p-2.5 md:p-3 border-b border-slate-100 dark:border-slate-800 bg-surface-container-low/50">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3.5 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all ${
              tab === t.id
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-base">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-5 md:p-6 space-y-4 text-xs">
        {tab === 'identity' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                label="نام سایت / برند"
                value={identity.siteName}
                onChange={(v) => onChange({ ...value, identity: { ...identity, siteName: v } })}
              />
              <TextField
                label="شعار کوتاه"
                value={identity.tagline}
                onChange={(v) => onChange({ ...value, identity: { ...identity, tagline: v } })}
              />
            </div>

            <div>
              <p className="text-[11px] font-black text-on-surface mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-primary">image</span>
                لوگو و فاوآیکون
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <MediaField
                  label="لوگو"
                  value={identity.logoUrl}
                  onChange={(v) => onChange({ ...value, identity: { ...identity, logoUrl: v } })}
                  accept="image"
                  aspect="square"
                  compact
                  helperText="هدر و فوتر"
                />
                <MediaField
                  label="فاوآیکون"
                  value={identity.faviconUrl}
                  onChange={(v) => onChange({ ...value, identity: { ...identity, faviconUrl: v } })}
                  accept="image"
                  aspect="square"
                  compact
                  helperText="تب مرورگر"
                />
              </div>
            </div>

            <div>
              <p className="text-[11px] font-black text-on-surface mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-primary">width</span>
                اندازه پیش‌فرض کانتینر سایت
              </p>
              <p className="text-[10px] text-on-surface-variant mb-3 leading-relaxed">
                روی هدر، فوتر و صفحات سایت در فرانت اعمال می‌شود. صفحات صفحه‌ساز با حالت «تمام عرض»
                همچنان تمام‌عرض می‌مانند.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CONTAINER_MODE_OPTIONS.map((opt) => {
                  const selected = (layout?.containerMode || '1200') === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        onChange({
                          ...value,
                          layout: {
                            ...layout,
                            containerMode: opt.value,
                            customMaxWidth: layout?.customMaxWidth || 1600,
                          },
                        })
                      }
                      className={`text-center rounded-xl border px-2 py-3 transition-all ${
                        selected
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-outline-variant/40 bg-surface-container-lowest hover:border-primary/40'
                      }`}
                    >
                      <span className="block text-[12px] font-black text-on-surface">{opt.label}</span>
                      <span className="block text-[10px] text-on-surface-variant mt-0.5">{opt.hint}</span>
                    </button>
                  );
                })}
              </div>
              {layout?.containerMode === 'custom' && (
                <label className="mt-3 block space-y-1 max-w-xs">
                  <span className="text-[11px] font-bold text-on-surface-variant">عرض اختصاصی (پیکسل)</span>
                  <input
                    type="number"
                    min={320}
                    max={3840}
                    step={10}
                    dir="ltr"
                    value={layout.customMaxWidth || 1600}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      onChange({
                        ...value,
                        layout: {
                          ...layout,
                          containerMode: 'custom',
                          customMaxWidth: Number.isFinite(n) ? n : 1600,
                        },
                      });
                    }}
                    className={fieldClass}
                  />
                </label>
              )}
            </div>

            <div>
              <p className="text-[11px] font-black text-on-surface mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-primary">palette</span>
                پالت رنگ سایت
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <ColorField
                  label="رنگ اصلی"
                  hint="برند، لینک‌ها و هایلایت"
                  value={identity.primaryColor}
                  onChange={(v) => {
                    const syncButton =
                      !identity.buttonColor || identity.buttonColor === identity.primaryColor;
                    onChange({
                      ...value,
                      identity: {
                        ...identity,
                        primaryColor: v,
                        ...(syncButton ? { buttonColor: v } : {}),
                      },
                    });
                  }}
                />
                <ColorField
                  label="رنگ ثانویه"
                  hint="بخش‌های مکمل و فوتر"
                  value={identity.secondaryColor}
                  onChange={(v) => onChange({ ...value, identity: { ...identity, secondaryColor: v } })}
                />
                <ColorField
                  label="رنگ دکمه"
                  hint="دکمه‌های CTA و اکشن"
                  value={identity.buttonColor || identity.primaryColor}
                  onChange={(v) => onChange({ ...value, identity: { ...identity, buttonColor: v } })}
                />
                <ColorField
                  label="رنگ پس‌زمینه"
                  hint="پس‌زمینه صفحات"
                  value={identity.backgroundColor || '#f8f9fa'}
                  onChange={(v) => onChange({ ...value, identity: { ...identity, backgroundColor: v } })}
                />
                <ColorField
                  label="رنگ تأکیدی"
                  hint="تگ‌ها و جزئیات بصری"
                  value={identity.accentColor || '#13677b'}
                  onChange={(v) => onChange({ ...value, identity: { ...identity, accentColor: v } })}
                />
                <ColorField
                  label="رنگ متن"
                  hint="متن اصلی بدنه"
                  value={identity.textColor || '#191c1d'}
                  onChange={(v) => onChange({ ...value, identity: { ...identity, textColor: v } })}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-low p-3">
                <span className="text-[10px] font-bold text-on-surface-variant ml-1">پیش‌نمایش:</span>
                <span
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-[11px] font-bold text-white shadow-sm"
                  style={{ backgroundColor: identity.buttonColor || identity.primaryColor }}
                >
                  دکمه نمونه
                </span>
                <span className="text-[11px] font-bold" style={{ color: identity.primaryColor }}>
                  لینک اصلی
                </span>
                <span className="text-[11px]" style={{ color: identity.accentColor || '#13677b' }}>
                  تأکید
                </span>
                <span
                  className="text-[11px] px-2 py-1 rounded-md"
                  style={{
                    backgroundColor: identity.backgroundColor || '#f8f9fa',
                    color: identity.textColor || '#191c1d',
                    border: `1px solid ${identity.secondaryColor}33`,
                  }}
                >
                  متن روی پس‌زمینه
                </span>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-black text-on-surface mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-primary">text_fields</span>
                فونت پیش‌فرض سایت
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SITE_FONT_OPTIONS.map((font) => {
                  const selected = (identity.fontFamily || 'vazirmatn') === font.id;
                  return (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() =>
                        onChange({ ...value, identity: { ...identity, fontFamily: font.id } })
                      }
                      className={`text-right rounded-xl border p-3 transition-all ${
                        selected
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-outline-variant/40 bg-surface-container-lowest hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[11px] font-black text-on-surface">{font.label}</span>
                        {selected && (
                          <span className="material-symbols-outlined text-primary text-base">check_circle</span>
                        )}
                      </div>
                      <p
                        className="text-sm text-on-surface leading-relaxed"
                        style={{ fontFamily: font.stack }}
                      >
                        {font.sample}
                      </p>
                    </button>
                  );
                })}
              </div>
              <p
                className="mt-3 text-sm text-on-surface-variant rounded-xl bg-surface-container-low px-3 py-2 border border-outline-variant/20"
                style={{ fontFamily: getSiteFontOption(identity.fontFamily).stack }}
              >
                نمونهٔ زنده: {identity.siteName || 'نام سایت'} — {identity.tagline || 'شعار کوتاه'}
              </p>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2">
              <p className="text-[11px] font-black text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">contact_phone</span>
                اطلاعات تماس
              </p>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                تلفن‌ها، واتساپ، ایمیل، اینستاگرام، تلگرام، بله، ایتا، روبیکا و آدرس‌ها از تب اختصاصی{' '}
                <strong className="text-on-surface">«اطلاعات تماس»</strong> در منوی داشبورد مدیریت می‌شوند و در کل
                سایت (هدر، فوتر، دکمه مشاوره و ویجت‌ها) استفاده می‌گردند.
              </p>
            </div>
          </div>
        )}

        {tab === 'header' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(
                [
                  { key: 'showPhone' as const, label: 'نمایش شماره تلفن در هدر', icon: 'call' },
                  { key: 'showAuthButton' as const, label: 'نمایش دکمه ورود / عضویت', icon: 'login' },
                  { key: 'showThemeToggle' as const, label: 'نمایش تغییر تم روشن/تیره', icon: 'contrast' },
                  { key: 'showSearchIcon' as const, label: 'نمایش آیکون جستجو', icon: 'search' },
                  { key: 'showBookingButton' as const, label: 'نمایش دکمه رزرو نوبت', icon: 'event' },
                  { key: 'sticky' as const, label: 'هدر چسبان (Sticky)', icon: 'vertical_align_top' },
                ]
              ).map((item) => (
                <label
                  key={item.key}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    header[item.key]
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-outline-variant/30 bg-surface-container-low/40 hover:border-outline-variant'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="rounded border-outline-variant"
                    checked={!!header[item.key]}
                    onChange={(e) =>
                      onChange({ ...value, header: { ...header, [item.key]: e.target.checked } })
                    }
                  />
                  <span className="material-symbols-outlined text-base text-primary">{item.icon}</span>
                  <span className="font-bold text-[11px] text-on-surface">{item.label}</span>
                </label>
              ))}
            </div>
            <TextField
              label="متن دکمه رزرو"
              value={header.bookingButtonLabel}
              onChange={(v) => onChange({ ...value, header: { ...header, bookingButtonLabel: v } })}
            />
          </div>
        )}

        {tab === 'menu' && (
          <div className="space-y-4">
            <TextField
              label="عنوان دراپ‌داون خدمات"
              value={menu.servicesDropdownTitle}
              onChange={(v) => onChange({ ...value, menu: { ...menu, servicesDropdownTitle: v } })}
            />
            <NavItemsEditor
              items={menu.mainItems}
              allowChildren
              onChange={(mainItems) => onChange({ ...value, menu: { ...menu, mainItems } })}
            />
          </div>
        )}

        {tab === 'footer' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                label="متن معرفی فوتر"
                value={footer.aboutText}
                onChange={(v) => onChange({ ...value, footer: { ...footer, aboutText: v } })}
                multiline
              />
              <div className="space-y-4">
                <TextField
                  label="ساعات کاری"
                  value={footer.hoursText}
                  onChange={(v) => onChange({ ...value, footer: { ...footer, hoursText: v } })}
                />
                <TextField
                  label="متن کپی‌رایت"
                  value={footer.copyrightText}
                  onChange={(v) => onChange({ ...value, footer: { ...footer, copyrightText: v } })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {(
                [
                  { key: 'showNewsletter' as const, label: 'نمایش خبرنامه', icon: 'mail' },
                  { key: 'showAdminLink' as const, label: 'لینک داشبورد ادمین', icon: 'admin_panel_settings' },
                  { key: 'showWhatsapp' as const, label: 'آیکون واتساپ', icon: 'chat' },
                  { key: 'showPhoneIcon' as const, label: 'آیکون تماس', icon: 'call' },
                  { key: 'showMapIcon' as const, label: 'آیکون نقشه', icon: 'location_on' },
                ]
              ).map((item) => (
                <label
                  key={item.key}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    footer[item.key]
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-outline-variant/30 bg-surface-container-low/40 hover:border-outline-variant'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="rounded border-outline-variant"
                    checked={!!footer[item.key]}
                    onChange={(e) =>
                      onChange({ ...value, footer: { ...footer, [item.key]: e.target.checked } })
                    }
                  />
                  <span className="material-symbols-outlined text-base text-primary">{item.icon}</span>
                  <span className="font-bold text-[11px] text-on-surface">{item.label}</span>
                </label>
              ))}
            </div>
            {footer.showNewsletter && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-outline-variant/30 bg-surface-container-low/30 p-4">
                <TextField
                  label="عنوان خبرنامه"
                  value={footer.newsletterTitle}
                  onChange={(v) => onChange({ ...value, footer: { ...footer, newsletterTitle: v } })}
                />
                <TextField
                  label="توضیح خبرنامه"
                  value={footer.newsletterSubtitle}
                  onChange={(v) =>
                    onChange({ ...value, footer: { ...footer, newsletterSubtitle: v } })
                  }
                  multiline
                />
              </div>
            )}
            <div>
              <p className="text-[11px] font-black text-on-surface mb-2">لینک‌های دسترسی سریع</p>
              <NavItemsEditor
                items={footer.quickLinks}
                onChange={(quickLinks) => onChange({ ...value, footer: { ...footer, quickLinks } })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
