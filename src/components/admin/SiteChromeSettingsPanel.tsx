import React, { useState } from 'react';
import type { SiteChromeSettings, SiteNavItem } from '../../types';
import { MediaField } from '../media/MediaField';
import { BUILTIN_NAV_TARGETS, newNavItem } from '../../lib/siteChromeDefaults';

type ChromeTab = 'identity' | 'header' | 'menu' | 'footer';

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

  const tabs: { id: ChromeTab; label: string; icon: string }[] = [
    { id: 'identity', label: 'هویت و رنگ‌ها', icon: 'palette' },
    { id: 'header', label: 'هدر', icon: 'web_asset' },
    { id: 'menu', label: 'منوها', icon: 'menu' },
    { id: 'footer', label: 'فوتر', icon: 'vertical_align_bottom' },
  ];

  return (
    <div className="bg-white dark:bg-surface-dim rounded-[32px] border border-outline-variant/30 shadow-sm overflow-hidden lg:col-span-2">
      <div className="p-5 md:p-6 border-b border-outline-variant/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">brush</span>
          </div>
          <div>
            <h2 className="font-extrabold text-lg text-on-surface">ظاهر سایت (هدر، منو، فوتر، هویت)</h2>
            <p className="text-xs text-on-surface-variant">
              برند، رنگ‌ها، منوی ناوبری و محتوای فوتر را از اینجا مدیریت کنید
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={() => void onSave()}
          className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-base">save</span>
          {saving ? 'ذخیره...' : 'ذخیره ظاهر سایت'}
        </button>
      </div>

      <div className="flex flex-wrap gap-1 p-3 border-b border-outline-variant/20 bg-surface-container-low/40">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3.5 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 ${
              tab === t.id ? 'bg-primary text-white shadow' : 'text-on-surface-variant hover:bg-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-5 md:p-6 space-y-4 text-xs">
        {tab === 'identity' && (
          <div className="space-y-4">
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
            <MediaField
              label="لوگو / آیکون برند"
              value={identity.logoUrl}
              onChange={(v) => onChange({ ...value, identity: { ...identity, logoUrl: v } })}
              accept="image"
              aspect="square"
            />
            <MediaField
              label="فاوآیکون"
              value={identity.faviconUrl}
              onChange={(v) => onChange({ ...value, identity: { ...identity, faviconUrl: v } })}
              accept="image"
              aspect="square"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1">
                <span className="text-[11px] font-bold text-on-surface-variant">رنگ اصلی</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={identity.primaryColor}
                    onChange={(e) =>
                      onChange({ ...value, identity: { ...identity, primaryColor: e.target.value } })
                    }
                    className="w-12 h-10 rounded-lg border border-outline-variant/40 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={identity.primaryColor}
                    onChange={(e) =>
                      onChange({ ...value, identity: { ...identity, primaryColor: e.target.value } })
                    }
                    className={fieldClass}
                    dir="ltr"
                  />
                </div>
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-bold text-on-surface-variant">رنگ ثانویه</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={identity.secondaryColor}
                    onChange={(e) =>
                      onChange({ ...value, identity: { ...identity, secondaryColor: e.target.value } })
                    }
                    className="w-12 h-10 rounded-lg border border-outline-variant/40 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={identity.secondaryColor}
                    onChange={(e) =>
                      onChange({ ...value, identity: { ...identity, secondaryColor: e.target.value } })
                    }
                    className={fieldClass}
                    dir="ltr"
                  />
                </div>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                label="تلفن ۱"
                value={identity.phone1}
                onChange={(v) => onChange({ ...value, identity: { ...identity, phone1: v } })}
              />
              <TextField
                label="تلفن ۲"
                value={identity.phone2}
                onChange={(v) => onChange({ ...value, identity: { ...identity, phone2: v } })}
              />
              <TextField
                label="شماره تماس لاتین (tel:)"
                value={identity.phoneClean}
                onChange={(v) => onChange({ ...value, identity: { ...identity, phoneClean: v } })}
                dir="ltr"
              />
              <TextField
                label="واتساپ (+98…)"
                value={identity.whatsappNumber}
                onChange={(v) => onChange({ ...value, identity: { ...identity, whatsappNumber: v } })}
                dir="ltr"
              />
              <TextField
                label="ایمیل"
                value={identity.email}
                onChange={(v) => onChange({ ...value, identity: { ...identity, email: v } })}
                dir="ltr"
              />
              <TextField
                label="اینستاگرام"
                value={identity.instagram}
                onChange={(v) => onChange({ ...value, identity: { ...identity, instagram: v } })}
                dir="ltr"
              />
              <TextField
                label="تلگرام"
                value={identity.telegram}
                onChange={(v) => onChange({ ...value, identity: { ...identity, telegram: v } })}
                dir="ltr"
              />
            </div>
            <TextField
              label="آدرس"
              value={identity.address}
              onChange={(v) => onChange({ ...value, identity: { ...identity, address: v } })}
              multiline
            />
          </div>
        )}

        {tab === 'header' && (
          <div className="space-y-3">
            {(
              [
                ['showPhone', 'نمایش شماره تلفن در هدر'],
                ['showAuthButton', 'نمایش دکمه ورود / عضویت'],
                ['showThemeToggle', 'نمایش تغییر تم روشن/تیره'],
                ['showBookingButton', 'نمایش دکمه رزرو نوبت'],
                ['sticky', 'هدر چسبان (Sticky)'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!header[key]}
                  onChange={(e) =>
                    onChange({ ...value, header: { ...header, [key]: e.target.checked } })
                  }
                />
                {label}
              </label>
            ))}
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
            <TextField
              label="متن معرفی فوتر"
              value={footer.aboutText}
              onChange={(v) => onChange({ ...value, footer: { ...footer, aboutText: v } })}
              multiline
            />
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
            {(
              [
                ['showNewsletter', 'نمایش خبرنامه'],
                ['showAdminLink', 'نمایش لینک داشبورد ادمین'],
                ['showWhatsapp', 'آیکون واتساپ'],
                ['showPhoneIcon', 'آیکون تماس'],
                ['showMapIcon', 'آیکون نقشه'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!footer[key]}
                  onChange={(e) =>
                    onChange({ ...value, footer: { ...footer, [key]: e.target.checked } })
                  }
                />
                {label}
              </label>
            ))}
            {footer.showNewsletter && (
              <>
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
              </>
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
