import React, { useEffect, useMemo, useState } from 'react';
import type { ShopOrder, ShopOrderStatus } from '../../types';
import {
  canDownloadDigital,
  formatShopPrice,
  SHOP_ORDER_STATUS_LABELS,
  SHOP_PAYMENT_METHOD_LABELS,
  SHOP_PRODUCT_TYPE_LABELS,
} from '../../lib/shopDefaults';
import { deleteOrder, saveOrder, subscribeOrders } from '../../lib/dbService';

const STATUS_OPTIONS = Object.keys(SHOP_ORDER_STATUS_LABELS) as ShopOrderStatus[];

export const ShopOrdersPanel: React.FC = () => {
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [selected, setSelected] = useState<ShopOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | ShopOrderStatus>('all');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    return subscribeOrders(setOrders);
  }, []);

  const list = useMemo(() => {
    return [...orders]
      .filter((o) => (statusFilter === 'all' ? true : o.status === statusFilter))
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [orders, statusFilter]);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  const updateStatus = async (order: ShopOrder, status: ShopOrderStatus) => {
    setSaving(true);
    try {
      const next: ShopOrder = { ...order, status, updatedAt: new Date().toISOString() };
      await saveOrder(next);
      setSelected(next);
      showMsg('success', 'وضعیت سفارش به‌روز شد');
    } catch (e) {
      console.error(e);
      showMsg('error', 'به‌روزرسانی وضعیت ناموفق بود');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('این سفارش حذف شود؟')) return;
    try {
      await deleteOrder(id);
      if (selected?.id === id) setSelected(null);
      showMsg('success', 'سفارش حذف شد');
    } catch (e) {
      console.error(e);
      showMsg('error', 'حذف ناموفق بود');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {msg && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span className="material-symbols-outlined">
            {msg.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {msg.text}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-on-surface">سفارش‌های فروشگاه</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {orders.length.toLocaleString('fa-IR')} سفارش ثبت‌شده
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | ShopOrderStatus)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
        >
          <option value="all">همه وضعیت‌ها</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {SHOP_ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {list.length === 0 ? (
            <div className="p-10 text-center text-sm text-on-surface-variant">سفارشی نیست.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-surface-container-low text-[11px] text-on-surface-variant">
                  <tr>
                    <th className="px-4 py-3 font-bold">شماره</th>
                    <th className="px-4 py-3 font-bold">مشتری</th>
                    <th className="px-4 py-3 font-bold">مبلغ</th>
                    <th className="px-4 py-3 font-bold">وضعیت</th>
                    <th className="px-4 py-3 font-bold">جزئیات</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((o) => (
                    <tr
                      key={o.id}
                      className={`border-t border-slate-100 dark:border-slate-800 hover:bg-surface-container-low/40 ${
                        selected?.id === o.id ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-bold text-xs" dir="ltr">
                        {o.orderNumber}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="font-bold">{o.customer?.name}</div>
                        <div className="text-on-surface-variant" dir="ltr">
                          {o.customer?.mobile}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-bold">{formatShopPrice(o.total)}</td>
                      <td className="px-4 py-3 text-[10px] font-bold">
                        {SHOP_ORDER_STATUS_LABELS[o.status]}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setSelected(o)}
                          className="text-xs font-bold text-primary hover:underline"
                        >
                          مشاهده
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 min-h-[280px]">
          {!selected ? (
            <div className="h-full flex items-center justify-center text-sm text-on-surface-variant">
              یک سفارش را انتخاب کنید
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black" dir="ltr">
                    {selected.orderNumber}
                  </h3>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    {new Date(selected.createdAt).toLocaleString('fa-IR')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDelete(selected.id)}
                  className="text-rose-600 text-xs font-bold hover:underline"
                >
                  حذف
                </button>
              </div>

              <label className="block space-y-1">
                <span className="text-[11px] font-bold text-on-surface-variant">وضعیت</span>
                <select
                  disabled={saving}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  value={selected.status}
                  onChange={(e) =>
                    void updateStatus(selected, e.target.value as ShopOrderStatus)
                  }
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {SHOP_ORDER_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-2xl bg-surface-container-low/60 p-3 space-y-1 text-xs">
                <p>
                  <span className="font-bold">مشتری:</span> {selected.customer.name}
                </p>
                <p dir="ltr">
                  <span className="font-bold">موبایل:</span> {selected.customer.mobile}
                </p>
                {selected.customer.email && (
                  <p dir="ltr">
                    <span className="font-bold">ایمیل:</span> {selected.customer.email}
                  </p>
                )}
                {selected.customer.address && (
                  <p>
                    <span className="font-bold">آدرس:</span> {selected.customer.address}
                  </p>
                )}
                {selected.customer.notes && (
                  <p>
                    <span className="font-bold">یادداشت:</span> {selected.customer.notes}
                  </p>
                )}
                <p>
                  <span className="font-bold">پرداخت:</span>{' '}
                  {SHOP_PAYMENT_METHOD_LABELS[selected.paymentMethod] || selected.paymentMethod}
                  {selected.paymentStatus ? ` · ${selected.paymentStatus}` : ''}
                  {selected.paymentRefId ? (
                    <span className="font-mono text-[10px] ms-1" dir="ltr">
                      ({selected.paymentRefId})
                    </span>
                  ) : null}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-bold text-on-surface-variant">آیتم‌ها</p>
                {selected.items.map((item, idx) => (
                  <div
                    key={`${item.productId}-${idx}`}
                    className="flex items-start justify-between gap-2 text-xs border border-slate-100 dark:border-slate-800 rounded-xl p-3"
                  >
                    <div>
                      <div className="font-bold">{item.name}</div>
                      <div className="text-on-surface-variant mt-0.5">
                        {SHOP_PRODUCT_TYPE_LABELS[item.type]} · تعداد{' '}
                        {item.qty.toLocaleString('fa-IR')}
                      </div>
                      {item.type === 'digital' &&
                        item.digitalFileUrl &&
                        canDownloadDigital(selected.status) && (
                          <a
                            href={item.digitalFileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary font-bold text-[11px] mt-1 inline-flex items-center gap-0.5"
                          >
                            <span className="material-symbols-outlined text-sm">download</span>
                            دانلود فایل
                          </a>
                        )}
                    </div>
                    <div className="font-bold shrink-0">
                      {formatShopPrice(item.price * item.qty)}
                    </div>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-black pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>جمع</span>
                  <span>{formatShopPrice(selected.total)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
