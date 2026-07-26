import type {
  ShopOrder,
  ShopOrderCustomer,
  ShopOrderItem,
  ShopPaymentMethod,
  ShopProduct,
  ShopProductKind,
  ShopProductStatus,
  ShopProductType,
  ShopProductVariation,
} from '../types';

export function slugifyProductName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\u0600-\u06FFa-z0-9-]/gi, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return base || `product-${Date.now()}`;
}

export function createBlankVariation(
  partial?: Partial<ShopProductVariation>
): ShopProductVariation {
  return {
    id: partial?.id || `var-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: partial?.name || 'ویژگی جدید',
    price: partial?.price ?? 0,
    description: partial?.description || '',
    imageUrl: partial?.imageUrl || '',
    stock: partial?.stock === undefined ? null : partial.stock,
    digitalFileUrl: partial?.digitalFileUrl || '',
  };
}

export function createBlankProduct(partial?: Partial<ShopProduct>): ShopProduct {
  const now = new Date().toISOString();
  const name = partial?.name || 'محصول جدید';
  const kind: ShopProductKind = partial?.kind || 'simple';
  return {
    id: partial?.id || `prod-${Date.now()}`,
    name,
    slug: partial?.slug || slugifyProductName(name),
    description: partial?.description || '',
    price: partial?.price ?? 0,
    type: partial?.type || 'physical',
    kind,
    status: partial?.status || 'draft',
    stock: partial?.stock === undefined ? null : partial.stock,
    imageUrl: partial?.imageUrl || '',
    galleryUrls: Array.isArray(partial?.galleryUrls)
      ? partial!.galleryUrls!.filter(Boolean)
      : [],
    digitalFileUrl: partial?.digitalFileUrl || '',
    weightGrams: partial?.weightGrams,
    category: partial?.category || '',
    categoryId: partial?.categoryId || '',
    variations:
      kind === 'variable'
        ? Array.isArray(partial?.variations)
          ? partial!.variations!
          : [createBlankVariation({ name: 'پیش‌فرض', price: partial?.price ?? 0 })]
        : Array.isArray(partial?.variations)
          ? partial!.variations!
          : [],
    createdAt: partial?.createdAt || now,
    updatedAt: partial?.updatedAt || now,
  };
}

export function isVariableProduct(product: Pick<ShopProduct, 'kind' | 'variations'>): boolean {
  return product.kind === 'variable' && (product.variations?.length || 0) > 0;
}

export function getProductVariations(product: ShopProduct): ShopProductVariation[] {
  if (!isVariableProduct(product)) return [];
  return product.variations || [];
}

export function findVariation(
  product: ShopProduct,
  variationId?: string | null
): ShopProductVariation | null {
  if (!variationId) return null;
  return getProductVariations(product).find((v) => v.id === variationId) || null;
}

/** Effective unit price for a product (+ optional variation) */
export function getEffectivePrice(product: ShopProduct, variationId?: string | null): number {
  const v = findVariation(product, variationId);
  if (v) return v.price;
  if (isVariableProduct(product)) {
    const prices = getProductVariations(product).map((x) => x.price);
    return prices.length ? Math.min(...prices) : product.price;
  }
  return product.price;
}

export function getEffectiveStock(
  product: ShopProduct,
  variationId?: string | null
): number | null {
  const v = findVariation(product, variationId);
  if (v && v.stock !== undefined) return v.stock;
  return product.stock;
}

export function getEffectiveDigitalUrl(
  product: ShopProduct,
  variationId?: string | null
): string | undefined {
  const v = findVariation(product, variationId);
  if (v?.digitalFileUrl) return v.digitalFileUrl;
  return product.digitalFileUrl;
}

/** Main image + gallery, deduped (main first). Optional variation image prepended. */
export function getProductImages(
  product: Pick<ShopProduct, 'imageUrl' | 'galleryUrls'>,
  variation?: Pick<ShopProductVariation, 'imageUrl'> | null
): string[] {
  const urls: string[] = [];
  const push = (u?: string) => {
    const v = (u || '').trim();
    if (v && !urls.includes(v)) urls.push(v);
  };
  push(variation?.imageUrl);
  push(product.imageUrl);
  for (const u of product.galleryUrls || []) push(u);
  return urls;
}

/** Thumbnail for lists / cart */
export function getProductThumb(
  product: Pick<ShopProduct, 'imageUrl' | 'galleryUrls'>,
  variation?: Pick<ShopProductVariation, 'imageUrl'> | null
): string {
  return getProductImages(product, variation)[0] || '';
}

export function formatPriceRange(product: ShopProduct): string {
  if (!isVariableProduct(product)) return formatShopPrice(product.price);
  const prices = getProductVariations(product).map((v) => v.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return formatShopPrice(min);
  return `از ${formatShopPrice(min)}`;
}

export const SHOP_PRODUCT_TYPE_LABELS: Record<ShopProductType, string> = {
  physical: 'فیزیکی',
  digital: 'دیجیتال',
};

export const SHOP_PRODUCT_KIND_LABELS: Record<ShopProductKind, string> = {
  simple: 'ساده',
  variable: 'متغیر (دارای ویژگی)',
};

export const SHOP_PRODUCT_STATUS_LABELS: Record<ShopProductStatus, string> = {
  draft: 'پیش‌نویس',
  published: 'منتشر شده',
};

export const SHOP_ORDER_STATUS_LABELS: Record<ShopOrder['status'], string> = {
  pending: 'در انتظار پرداخت',
  paid: 'پرداخت‌شده',
  processing: 'در حال آماده‌سازی',
  shipped: 'ارسال‌شده',
  completed: 'تکمیل‌شده',
  cancelled: 'لغو شده',
};

export const SHOP_PAYMENT_METHOD_LABELS: Record<ShopPaymentMethod, string> = {
  zarinpal: 'درگاه زرین‌پال',
  mellat: 'درگاه بانک ملت',
  bank_transfer: 'کارت‌به‌کارت / واریز',
  cod: 'پرداخت در محل',
  manual: 'پرداخت دستی / بعداً',
};

export function formatShopPrice(amount: number): string {
  const n = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `${n.toLocaleString('fa-IR')} تومان`;
}

export function generateOrderNumber(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `ZH-${n}`;
}

export function buildShopOrder(input: {
  items: ShopOrderItem[];
  customer: ShopOrderCustomer;
  paymentMethod: ShopPaymentMethod;
}): ShopOrder {
  const now = new Date().toISOString();
  const subtotal = input.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  return {
    id: `order-${Date.now()}`,
    orderNumber: generateOrderNumber(),
    status: 'pending',
    paymentMethod: input.paymentMethod,
    paymentStatus:
      input.paymentMethod === 'zarinpal' || input.paymentMethod === 'mellat'
        ? 'awaiting'
        : 'unpaid',
    customer: input.customer,
    items: input.items,
    subtotal,
    total: subtotal,
    createdAt: now,
    updatedAt: now,
  };
}

export function canDownloadDigital(status: ShopOrder['status']): boolean {
  return status === 'paid' || status === 'completed';
}

/** True if string looks like HTML (for rich description rendering) */
export function isRichHtml(text?: string): boolean {
  if (!text) return false;
  return /<\/?[a-z][\s\S]*>/i.test(text);
}
