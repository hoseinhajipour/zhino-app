import type { ShopPaymentMethod, ShopSettings } from '../types';

export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  storeName: 'فروشگاه ژینو',
  storeDescription: 'محصولات فیزیکی و دیجیتال کلینیک — افزودن به سبد و ثبت سفارش.',
  currencyLabel: 'تومان',
  showPrices: true,
  paymentMethods: {
    bank_transfer: true,
    cod: true,
    manual: true,
    zarinpal: false,
    mellat: false,
  },
  bankTransferInstructions:
    'پس از ثبت سفارش، مبلغ را به شماره کارت اعلام‌شده واریز کنید و فیش را برای پشتیبانی ارسال نمایید.',
  shippingNote: 'هزینه ارسال برای محصولات فیزیکی پس از ثبت سفارش اعلام می‌شود.',
  emptyCartMessage: 'سبد خرید شما خالی است.',
  orderSuccessMessage:
    'سفارش شما ثبت شد. پس از تأیید پرداخت، وضعیت سفارش به‌روز می‌شود و لینک دانلود محصولات دیجیتال در دسترس قرار می‌گیرد.',
  requireAddressForPhysical: true,
  minOrderAmount: 0,
};

export function mergeShopSettings(raw?: Partial<ShopSettings> | null): ShopSettings {
  const base = DEFAULT_SHOP_SETTINGS;
  const pm = raw?.paymentMethods;
  return {
    storeName: String(raw?.storeName ?? base.storeName).trim() || base.storeName,
    storeDescription: String(raw?.storeDescription ?? base.storeDescription),
    currencyLabel: String(raw?.currencyLabel ?? base.currencyLabel).trim() || base.currencyLabel,
    showPrices: raw?.showPrices !== false,
    paymentMethods: {
      bank_transfer: pm?.bank_transfer !== false,
      cod: pm?.cod !== false,
      manual: pm?.manual !== false,
      zarinpal: pm?.zarinpal === true,
      mellat: pm?.mellat === true,
    },
    bankTransferInstructions: String(
      raw?.bankTransferInstructions ?? base.bankTransferInstructions
    ),
    shippingNote: String(raw?.shippingNote ?? base.shippingNote),
    emptyCartMessage: String(raw?.emptyCartMessage ?? base.emptyCartMessage),
    orderSuccessMessage: String(raw?.orderSuccessMessage ?? base.orderSuccessMessage),
    requireAddressForPhysical: raw?.requireAddressForPhysical !== false,
    minOrderAmount: Math.max(0, Number(raw?.minOrderAmount) || 0),
  };
}

/** Enabled payment methods in a stable order */
export function enabledShopPaymentMethods(settings: ShopSettings): ShopPaymentMethod[] {
  const order: ShopPaymentMethod[] = [
    'zarinpal',
    'mellat',
    'bank_transfer',
    'cod',
    'manual',
  ];
  return order.filter((m) => settings.paymentMethods[m]);
}

export function isOnlineShopPayment(method: ShopPaymentMethod): boolean {
  return method === 'zarinpal' || method === 'mellat';
}

export function slugifyShopCategoryName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\u0600-\u06FFa-z0-9-]/gi, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return base || `cat-${Date.now()}`;
}
