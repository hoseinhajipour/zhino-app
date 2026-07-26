import React, { useEffect, useState } from 'react';
import type { ClinicSettings, MellatSettings, ShopSettings } from '../../types';
import {
  DEFAULT_CLINIC_SETTINGS,
  normalizeClinicSettings,
  saveClinicSettings,
  subscribeClinicSettings,
} from '../../lib/dbService';
import { mergeShopSettings } from '../../lib/shopSettingsDefaults';
import { mergeMellatSettings } from '../../lib/mellatSettingsDefaults';
import { SHOP_PAYMENT_METHOD_LABELS } from '../../lib/shopDefaults';

const fieldCls =
  'w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30';

function Section({
  title,
  icon,
  children,
  hint,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-start gap-2.5 bg-surface-container-low/40">
        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-xl">{icon}</span>
        </div>
        <div>
          <h3 className="text-sm font-black text-on-surface">{title}</h3>
          {hint && <p className="text-[10px] text-on-surface-variant mt-0.5">{hint}</p>}
        </div>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </section>
  );
}

export const ShopSettingsPanel: React.FC = () => {
  const [clinic, setClinic] = useState<ClinicSettings>(DEFAULT_CLINIC_SETTINGS);
  const [draft, setDraft] = useState<ShopSettings>(() =>
    mergeShopSettings(DEFAULT_CLINIC_SETTINGS.shop)
  );
  const [mellatDraft, setMellatDraft] = useState<MellatSettings>(() =>
    mergeMellatSettings(DEFAULT_CLINIC_SETTINGS.mellat)
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    return subscribeClinicSettings((data) => {
      const normalized = normalizeClinicSettings(data);
      setClinic(normalized);
      setDraft(mergeShopSettings(normalized.shop));
      setMellatDraft(mergeMellatSettings(normalized.mellat));
    });
  }, []);

  const patch = (partial: Partial<ShopSettings>) => {
    setDraft((prev) => mergeShopSettings({ ...prev, ...partial }));
  };

  const patchMellat = (partial: Partial<MellatSettings>) => {
    setMellatDraft((prev) => mergeMellatSettings({ ...prev, ...partial }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const next = normalizeClinicSettings({
        ...clinic,
        shop: draft,
        mellat: mellatDraft,
      });
      await saveClinicSettings(next);
      setClinic(next);
      setDraft(mergeShopSettings(next.shop));
      setMellatDraft(mergeMellatSettings(next.mellat));
      setMsg({ type: 'success', text: 'تنظیمات فروشگاه ذخیره شد' });
    } catch {
      setMsg({ type: 'error', text: 'ذخیره تنظیمات ناموفق بود' });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 3500);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      {msg && (
        <div
          className={`p-3 rounded-2xl text-xs font-bold border ${
            msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {msg.text}
        </div>
      )}

      <Section title="هویت فروشگاه" icon="storefront">
        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">نام فروشگاه</span>
          <input
            className={fieldCls}
            value={draft.storeName}
            onChange={(e) => patch({ storeName: e.target.value })}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">توضیح کوتاه</span>
          <textarea
            className={`${fieldCls} min-h-[72px]`}
            value={draft.storeDescription}
            onChange={(e) => patch({ storeDescription: e.target.value })}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">واحد پول (نمایشی)</span>
          <input
            className={fieldCls}
            value={draft.currencyLabel}
            onChange={(e) => patch({ currencyLabel: e.target.value })}
            placeholder="تومان"
          />
        </label>
        <label className="flex items-center gap-2 text-xs font-bold">
          <input
            type="checkbox"
            checked={draft.showPrices}
            onChange={(e) => patch({ showPrices: e.target.checked })}
          />
          نمایش قیمت در فروشگاه
        </label>
      </Section>

      <Section
        title="روش‌های پرداخت"
        icon="payments"
        hint="روش‌های آنلاین فقط وقتی درگاه پیکربندی شده باشد قابل استفاده‌اند."
      >
        {(
          Object.keys(SHOP_PAYMENT_METHOD_LABELS) as Array<keyof ShopSettings['paymentMethods']>
        ).map((key) => (
          <label key={key} className="flex items-center gap-2 text-xs font-bold">
            <input
              type="checkbox"
              checked={!!draft.paymentMethods[key]}
              onChange={(e) =>
                patch({
                  paymentMethods: {
                    ...draft.paymentMethods,
                    [key]: e.target.checked,
                  },
                })
              }
            />
            {SHOP_PAYMENT_METHOD_LABELS[key]}
          </label>
        ))}
        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">
            راهنمای کارت‌به‌کارت / واریز
          </span>
          <textarea
            className={`${fieldCls} min-h-[80px]`}
            value={draft.bankTransferInstructions}
            onChange={(e) => patch({ bankTransferInstructions: e.target.value })}
          />
        </label>
      </Section>

      <Section
        title="درگاه زرین‌پال"
        icon="account_balance"
        hint="از Merchant ID و حالت سندباکس در تنظیمات زرین‌پال (تب نوبت‌دهی) استفاده می‌شود."
      >
        <div className="rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200/60 p-3 text-[11px] text-sky-900 dark:text-sky-200 leading-relaxed space-y-1">
          <p>
            Merchant:{' '}
            <span className="font-mono" dir="ltr">
              {clinic.zarinpal?.merchantId
                ? `${clinic.zarinpal.merchantId.slice(0, 8)}…`
                : 'تعیین نشده'}
            </span>
          </p>
          <p>حالت: {clinic.zarinpal?.isSandbox ? 'سندباکس (تست)' : 'عملیاتی'}</p>
          <p>مبالغ فروشگاه به تومان (currency=IRT) ارسال می‌شوند.</p>
        </div>
      </Section>

      <Section
        title="درگاه بانک ملت (به‌پرداخت)"
        icon="account_balance_wallet"
        hint="Terminal ID، نام کاربری و رمز وب‌سرویس درگاه ملت"
      >
        <label className="flex items-center gap-2 text-xs font-bold">
          <input
            type="checkbox"
            checked={mellatDraft.enabled}
            onChange={(e) => patchMellat({ enabled: e.target.checked })}
          />
          اعتبارنامه‌های ملت ذخیره/فعال باشد
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-on-surface-variant">Terminal ID</span>
            <input
              className={fieldCls}
              dir="ltr"
              value={mellatDraft.terminalId}
              onChange={(e) => patchMellat({ terminalId: e.target.value })}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[11px] font-bold text-on-surface-variant">Username</span>
            <input
              className={fieldCls}
              dir="ltr"
              value={mellatDraft.username}
              onChange={(e) => patchMellat({ username: e.target.value })}
            />
          </label>
          <label className="block space-y-1 sm:col-span-2">
            <span className="text-[11px] font-bold text-on-surface-variant">Password</span>
            <input
              type="password"
              className={fieldCls}
              dir="ltr"
              value={mellatDraft.password}
              onChange={(e) => patchMellat({ password: e.target.value })}
              autoComplete="new-password"
            />
          </label>
          <label className="block space-y-1 sm:col-span-2">
            <span className="text-[11px] font-bold text-on-surface-variant">
              Callback URL (اختیاری)
            </span>
            <input
              className={fieldCls}
              dir="ltr"
              value={mellatDraft.callbackUrl || ''}
              onChange={(e) => patchMellat({ callbackUrl: e.target.value })}
              placeholder="خالی = {site}/api/shop/payment/callback/mellat"
            />
          </label>
        </div>
        <p className="text-[10px] text-on-surface-variant leading-relaxed">
          مبلغ به ریال (تومان × ۱۰) ارسال می‌شود. آدرس callback باید در پنل به‌پرداخت ثبت شده باشد.
        </p>
      </Section>

      <Section title="ارسال و پیام‌ها" icon="local_shipping">
        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">یادداشت ارسال</span>
          <textarea
            className={`${fieldCls} min-h-[64px]`}
            value={draft.shippingNote}
            onChange={(e) => patch({ shippingNote: e.target.value })}
          />
        </label>
        <label className="flex items-center gap-2 text-xs font-bold">
          <input
            type="checkbox"
            checked={draft.requireAddressForPhysical}
            onChange={(e) => patch({ requireAddressForPhysical: e.target.checked })}
          />
          آدرس برای محصولات فیزیکی الزامی باشد
        </label>
        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">
            حداقل مبلغ سفارش ({draft.currencyLabel}) — ۰ یعنی بدون محدودیت
          </span>
          <input
            type="number"
            min={0}
            className={fieldCls}
            dir="ltr"
            value={draft.minOrderAmount}
            onChange={(e) => patch({ minOrderAmount: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">پیام سبد خالی</span>
          <input
            className={fieldCls}
            value={draft.emptyCartMessage}
            onChange={(e) => patch({ emptyCartMessage: e.target.value })}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-[11px] font-bold text-on-surface-variant">پیام موفقیت سفارش</span>
          <textarea
            className={`${fieldCls} min-h-[80px]`}
            value={draft.orderSuccessMessage}
            onChange={(e) => patch({ orderSuccessMessage: e.target.value })}
          />
        </label>
      </Section>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-black disabled:opacity-50 flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-base">save</span>
          {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات فروشگاه'}
        </button>
      </div>
    </div>
  );
};
