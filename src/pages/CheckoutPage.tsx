import React, { useEffect, useMemo, useState } from 'react';
import type {
  PageScreen,
  ShopCartItem,
  ShopOrder,
  ShopPaymentMethod,
  ShopProduct,
  ShopSettings,
} from '../types';
import { SITE_CONTAINER_CLASS } from '../lib/contentWidth';
import {
  buildShopOrder,
  canDownloadDigital,
  findVariation,
  formatShopPrice,
  getEffectiveDigitalUrl,
  getEffectivePrice,
  SHOP_PAYMENT_METHOD_LABELS,
} from '../lib/shopDefaults';
import {
  createOrder,
  normalizeClinicSettings,
  redirectToMellatGateway,
  startShopPayment,
  subscribeClinicSettings,
  subscribeProducts,
} from '../lib/dbService';
import { clearShopCart, getShopCart, subscribeShopCart } from '../lib/shopCart';
import {
  enabledShopPaymentMethods,
  isOnlineShopPayment,
  mergeShopSettings,
} from '../lib/shopSettingsDefaults';

interface CheckoutPageProps {
  onNavigate: (screen: PageScreen) => void;
  onGoToCart: () => void;
  onGoToShop: () => void;
  /** When set, show confirmation instead of checkout form */
  confirmationOrder?: ShopOrder | null;
  onOrderPlaced: (order: ShopOrder) => void;
}

const fieldCls =
  'w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30';

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  onNavigate,
  onGoToCart,
  onGoToShop,
  confirmationOrder,
  onOrderPlaced,
}) => {
  const [cart, setCart] = useState<ShopCartItem[]>(() => getShopCart());
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [shopSettings, setShopSettings] = useState<ShopSettings>(() => mergeShopSettings());
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<ShopPaymentMethod>('bank_transfer');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const u1 = subscribeShopCart(setCart);
    const u2 = subscribeProducts(setProducts);
    const u3 = subscribeClinicSettings((data) => {
      const shop = mergeShopSettings(normalizeClinicSettings(data).shop);
      setShopSettings(shop);
      const enabled = enabledShopPaymentMethods(shop);
      setPaymentMethod((prev) => (enabled.includes(prev) ? prev : enabled[0] || 'manual'));
    });
    return () => {
      u1();
      u2();
      u3();
    };
  }, []);

  const paymentOptions = useMemo(
    () => enabledShopPaymentMethods(shopSettings),
    [shopSettings]
  );

  const lines = useMemo(() => {
    return cart
      .map((item) => {
        const product = products.find((p) => p.id === item.productId && p.status === 'published');
        if (!product) return null;
        return { item, product };
      })
      .filter(Boolean) as { item: ShopCartItem; product: ShopProduct }[];
  }, [cart, products]);

  const hasPhysical = lines.some((l) => l.product.type === 'physical');
  const total = lines.reduce(
    (sum, l) => sum + getEffectivePrice(l.product, l.item.variationId) * l.item.qty,
    0
  );

  if (confirmationOrder) {
    const showDownloads = canDownloadDigital(confirmationOrder.status);
    return (
      <div className={`${SITE_CONTAINER_CLASS} pb-16 max-w-xl mx-auto text-center`}>
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-8 space-y-4">
          <span className="material-symbols-outlined text-5xl text-emerald-600">check_circle</span>
          <h1 className="text-xl font-black text-on-surface">سفارش ثبت شد</h1>
          <p className="text-sm text-on-surface-variant">
            شماره سفارش:{' '}
            <span className="font-black text-on-surface" dir="ltr">
              {confirmationOrder.orderNumber}
            </span>
          </p>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {shopSettings.orderSuccessMessage}
          </p>
          {showDownloads &&
            confirmationOrder.items
              .filter((i) => i.type === 'digital' && i.digitalFileUrl)
              .map((i) => (
                <a
                  key={`${i.productId}-${i.variationId || ''}-${i.name}`}
                  href={i.digitalFileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-bold text-primary"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  دانلود {i.name}
                </a>
              ))}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onGoToShop}
              className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl"
            >
              بازگشت به فروشگاه
            </button>
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="px-5 py-2.5 text-xs font-bold text-on-surface-variant border border-outline-variant/40 rounded-xl"
            >
              صفحه اصلی
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !mobile.trim()) {
      setError('نام و موبایل الزامی است');
      return;
    }
    if (hasPhysical && shopSettings.requireAddressForPhysical && !address.trim()) {
      setError('برای محصولات فیزیکی، آدرس ارسال لازم است');
      return;
    }
    if (!lines.length) {
      setError('سبد خرید خالی است');
      return;
    }
    if (shopSettings.minOrderAmount > 0 && total < shopSettings.minOrderAmount) {
      setError(
        `حداقل مبلغ سفارش ${formatShopPrice(shopSettings.minOrderAmount)} ${shopSettings.currencyLabel} است`
      );
      return;
    }
    if (!paymentOptions.length) {
      setError('هیچ روش پرداختی فعال نیست. با پشتیبانی تماس بگیرید.');
      return;
    }
    setSubmitting(true);
    try {
      const order = buildShopOrder({
        paymentMethod,
        customer: {
          name: name.trim(),
          mobile: mobile.trim(),
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          notes: notes.trim() || undefined,
        },
        items: lines.map(({ item, product }) => {
          const variation = findVariation(product, item.variationId);
          const price = getEffectivePrice(product, item.variationId);
          return {
            productId: product.id,
            name: variation ? `${product.name} — ${variation.name}` : product.name,
            price,
            qty: item.qty,
            type: product.type,
            digitalFileUrl: getEffectiveDigitalUrl(product, item.variationId),
            variationId: item.variationId,
            variationName: variation?.name,
          };
        }),
      });

      if (isOnlineShopPayment(paymentMethod)) {
        const result = await startShopPayment({
          order,
          gateway: paymentMethod,
          returnBaseUrl: window.location.origin,
        });
        clearShopCart();
        if (result.gateway === 'zarinpal' && result.paymentUrl) {
          window.location.href = result.paymentUrl;
          return;
        }
        if (result.gateway === 'mellat' && result.refId && result.gatewayUrl) {
          redirectToMellatGateway(result.gatewayUrl, result.refId);
          return;
        }
        throw new Error('پاسخ درگاه نامعتبر بود');
      }

      await createOrder(order);
      clearShopCart();
      onOrderPlaced(order);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : 'ثبت سفارش ناموفق بود. مطمئن شوید ماژول فروشگاه و درگاه فعال است.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!lines.length) {
    return (
      <div className={`${SITE_CONTAINER_CLASS} py-16 text-center`}>
        <p className="text-sm font-bold text-on-surface-variant">{shopSettings.emptyCartMessage}</p>
        <button
          type="button"
          onClick={onGoToShop}
          className="mt-4 text-xs font-bold text-primary hover:underline"
        >
          رفتن به فروشگاه
        </button>
      </div>
    );
  }

  return (
    <div className={`${SITE_CONTAINER_CLASS} pb-16`}>
      <div className="mb-8">
        <button
          type="button"
          onClick={onGoToCart}
          className="text-xs font-bold text-on-surface-variant hover:text-primary flex items-center gap-1 mb-3"
        >
          <span className="material-symbols-outlined text-base">arrow_forward</span>
          بازگشت به سبد
        </button>
        <h1 className="text-2xl font-black text-on-surface">تسویه حساب</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          {paymentOptions.some((m) => isOnlineShopPayment(m))
            ? 'می‌توانید با درگاه بانکی پرداخت کنید یا روش دستی را انتخاب نمایید.'
            : 'سفارش با روش‌های پرداخت دستی ثبت می‌شود.'}
        </p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4 rounded-3xl border border-outline-variant/30 bg-white dark:bg-slate-900 p-5">
          <h2 className="text-sm font-black">اطلاعات تماس و ارسال</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block space-y-1 sm:col-span-1">
              <span className="text-[11px] font-bold text-on-surface-variant">نام و نام خانوادگی *</span>
              <input className={fieldCls} value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-on-surface-variant">موبایل *</span>
              <input
                className={fieldCls}
                dir="ltr"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            </label>
            <label className="block space-y-1 sm:col-span-2">
              <span className="text-[11px] font-bold text-on-surface-variant">ایمیل</span>
              <input
                className={fieldCls}
                dir="ltr"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            {hasPhysical && (
              <label className="block space-y-1 sm:col-span-2">
                <span className="text-[11px] font-bold text-on-surface-variant">
                  آدرس ارسال{shopSettings.requireAddressForPhysical ? ' *' : ''}
                </span>
                <textarea
                  className={`${fieldCls} min-h-[80px]`}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </label>
            )}
            {hasPhysical && shopSettings.shippingNote ? (
              <p className="sm:col-span-2 text-[11px] text-on-surface-variant leading-relaxed">
                {shopSettings.shippingNote}
              </p>
            ) : null}
            <label className="block space-y-1 sm:col-span-2">
              <span className="text-[11px] font-bold text-on-surface-variant">یادداشت سفارش</span>
              <textarea
                className={`${fieldCls} min-h-[60px]`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
          </div>

          <div className="pt-2 space-y-2">
            <p className="text-[11px] font-bold text-on-surface-variant">روش پرداخت</p>
            {paymentOptions.map((m) => (
              <label
                key={m}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold cursor-pointer ${
                  paymentMethod === m
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-outline-variant/40'
                }`}
              >
                <input
                  type="radio"
                  name="pay"
                  checked={paymentMethod === m}
                  onChange={() => setPaymentMethod(m)}
                />
                {SHOP_PAYMENT_METHOD_LABELS[m]}
              </label>
            ))}
            {paymentMethod === 'bank_transfer' && shopSettings.bankTransferInstructions ? (
              <p className="text-[11px] text-on-surface-variant leading-relaxed p-3 rounded-xl bg-surface-container-low">
                {shopSettings.bankTransferInstructions}
              </p>
            ) : null}
          </div>

          {error && (
            <p className="text-xs font-bold text-rose-600 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-outline-variant/30 bg-white dark:bg-slate-900 p-5 h-fit space-y-4">
          <h3 className="text-sm font-black">خلاصه</h3>
          <ul className="space-y-2 text-xs">
            {lines.map(({ item, product }) => {
              const variation = findVariation(product, item.variationId);
              const unit = getEffectivePrice(product, item.variationId);
              return (
                <li
                  key={`${product.id}::${item.variationId || ''}`}
                  className="flex justify-between gap-2"
                >
                  <span className="truncate">
                    {product.name}
                    {variation ? ` — ${variation.name}` : ''} × {item.qty.toLocaleString('fa-IR')}
                  </span>
                  <span className="font-bold shrink-0">
                    {formatShopPrice(unit * item.qty)}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="flex justify-between text-sm font-black border-t border-slate-100 dark:border-slate-800 pt-3">
            <span>جمع</span>
            <span className="text-primary">{formatShopPrice(total)}</span>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-primary text-white text-sm font-bold rounded-xl shadow disabled:opacity-50"
          >
            {submitting
              ? isOnlineShopPayment(paymentMethod)
                ? 'در حال اتصال به درگاه…'
                : 'در حال ثبت…'
              : isOnlineShopPayment(paymentMethod)
                ? 'پرداخت آنلاین'
                : 'ثبت سفارش'}
          </button>
        </div>
      </form>
    </div>
  );
};
