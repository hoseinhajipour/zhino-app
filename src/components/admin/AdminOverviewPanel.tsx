import React, { useEffect, useMemo, useState } from 'react';
import type {
  Appointment,
  AppointmentStatus,
  Article,
  Doctor,
  FAQItem,
  FormSubmission,
  ServiceItem,
  ShopOrder,
  SitePage,
  UserProfile,
  UserRole,
} from '../../types';
import {
  fetchUsers,
  subscribeFormSubmissions,
  subscribeOrders,
} from '../../lib/dbService';
import { formatShopPrice, SHOP_ORDER_STATUS_LABELS } from '../../lib/shopDefaults';
import type { AdminNavItem, AdminTabId } from '../../lib/adminPermissions';
import {
  canEditSitePages,
  canManageArticles,
  canManageFormSubmissions,
  canManagePersonnel,
  canManageSettings,
  canManageUsers,
  canViewSystemStatus,
  getRoleLabel,
} from '../../lib/adminPermissions';

type OverviewProps = {
  currentUser?: UserProfile | null;
  appointments: Appointment[];
  doctors: Doctor[];
  services: ServiceItem[];
  articles: Article[];
  faqs: FAQItem[];
  sitePages: SitePage[];
  allowedTabs: AdminNavItem[];
  shopModuleEnabled: boolean;
  appointmentsModuleEnabled: boolean;
  bookingEnabled: boolean;
  maintenanceMode: boolean;
  developmentMode: boolean;
  onNavigate: (tab: AdminTabId) => void;
};

type StatCard = {
  key: string;
  label: string;
  value: number | string;
  hint?: string;
  icon: string;
  tone: 'slate' | 'amber' | 'teal' | 'blue' | 'rose' | 'violet';
  onClick?: () => void;
};

type AttentionItem = {
  key: string;
  title: string;
  detail: string;
  count: number;
  icon: string;
  tone: 'amber' | 'rose' | 'teal' | 'violet' | 'blue';
  tab: AdminTabId;
};

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: 'در انتظار تأیید',
  confirmed: 'تأیید شده',
  completed: 'انجام‌شده',
  cancelled: 'لغو شده',
};

const STATUS_TONE: Record<AppointmentStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  confirmed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  cancelled: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200',
};

const TONE_CARD: Record<StatCard['tone'], string> = {
  slate: 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  teal: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300',
  blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
  rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
  violet: 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300',
};

const TONE_VALUE: Record<StatCard['tone'], string> = {
  slate: 'text-slate-900 dark:text-white',
  amber: 'text-amber-700 dark:text-amber-300',
  teal: 'text-teal-700 dark:text-teal-300',
  blue: 'text-blue-700 dark:text-blue-300',
  rose: 'text-rose-700 dark:text-rose-300',
  violet: 'text-violet-700 dark:text-violet-300',
};

const ATTENTION_TONE: Record<AttentionItem['tone'], string> = {
  amber: 'border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/30',
  rose: 'border-rose-200 bg-rose-50/70 dark:border-rose-900 dark:bg-rose-950/30',
  teal: 'border-teal-200 bg-teal-50/70 dark:border-teal-900 dark:bg-teal-950/30',
  violet: 'border-violet-200 bg-violet-50/70 dark:border-violet-900 dark:bg-violet-950/30',
  blue: 'border-blue-200 bg-blue-50/70 dark:border-blue-900 dark:bg-blue-950/30',
};

function todayJalali(): string {
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function formatLongFaDate(): string {
  return new Intl.DateTimeFormat('fa-IR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());
}

function canAccessTab(tabs: AdminNavItem[], id: AdminTabId): boolean {
  return tabs.some((t) => t.id === id);
}

export const AdminOverviewPanel: React.FC<OverviewProps> = ({
  currentUser,
  appointments,
  doctors,
  services,
  articles,
  faqs,
  sitePages,
  allowedTabs,
  shopModuleEnabled,
  appointmentsModuleEnabled,
  bookingEnabled,
  maintenanceMode,
  developmentMode,
  onNavigate,
}) => {
  const role = currentUser?.role as UserRole | undefined;
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [systemHealth, setSystemHealth] = useState<{
    level: string;
    label: string;
    score: number;
  } | null>(null);

  const showShop = shopModuleEnabled && canAccessTab(allowedTabs, 'orders');
  const showForms = canManageFormSubmissions(role) && canAccessTab(allowedTabs, 'forms');
  const showUsers = canManageUsers(role);
  const showSystem = canViewSystemStatus(role);

  useEffect(() => {
    if (!showShop) return;
    return subscribeOrders(setOrders);
  }, [showShop]);

  useEffect(() => {
    if (!showForms) return;
    return subscribeFormSubmissions(setSubmissions);
  }, [showForms]);

  useEffect(() => {
    if (!showUsers) return;
    let cancelled = false;
    fetchUsers()
      .then((list) => {
        if (!cancelled) setUsersCount(list.length);
      })
      .catch(() => {
        if (!cancelled) setUsersCount(null);
      });
    return () => {
      cancelled = true;
    };
  }, [showUsers]);

  useEffect(() => {
    if (!showSystem) return;
    let cancelled = false;
    fetch('/api/system/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.health) return;
        setSystemHealth({
          level: data.health.level,
          label: data.health.label,
          score: data.health.score,
        });
      })
      .catch(() => {
        if (!cancelled) setSystemHealth(null);
      });
    return () => {
      cancelled = true;
    };
  }, [showSystem]);

  const today = useMemo(() => todayJalali(), []);
  const longDate = useMemo(() => formatLongFaDate(), []);

  const metrics = useMemo(() => {
    const pending = appointments.filter((a) => a.status === 'pending').length;
    const confirmed = appointments.filter((a) => a.status === 'confirmed').length;
    const completed = appointments.filter((a) => a.status === 'completed').length;
    const cancelled = appointments.filter((a) => a.status === 'cancelled').length;
    const todayApps = appointments.filter((a) => a.date === today).length;
    const activeDoctors = doctors.filter((d) => d.active).length;
    const activeServices = services.filter((s) => s.active !== false).length;
    const publishedArticles = articles.filter((a) => a.status === 'published').length;
    const draftArticles = articles.filter((a) => a.status === 'draft').length;
    const publishedPages = sitePages.filter((p) => p.status === 'published').length;
    const draftPages = sitePages.filter((p) => p.status === 'draft').length;
    const pendingFaqs = faqs.filter((f) => f.status === 'pending').length;
    const approvedFaqs = faqs.filter((f) => f.status === 'approved').length;
    const newSubs = submissions.filter((s) => s.status === 'new').length;
    const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'paid').length;
    const processingOrders = orders.filter(
      (o) => o.status === 'processing' || o.status === 'shipped'
    ).length;
    const orderRevenue = orders
      .filter((o) => o.status !== 'cancelled' && o.status !== 'pending')
      .reduce((sum, o) => sum + (o.total || 0), 0);

    return {
      pending,
      confirmed,
      completed,
      cancelled,
      todayApps,
      activeDoctors,
      activeServices,
      publishedArticles,
      draftArticles,
      publishedPages,
      draftPages,
      pendingFaqs,
      approvedFaqs,
      newSubs,
      pendingOrders,
      processingOrders,
      orderRevenue,
      totalApps: appointments.length,
    };
  }, [appointments, doctors, services, articles, sitePages, faqs, submissions, orders, today]);

  const recentAppointments = useMemo(() => {
    const rank: Record<AppointmentStatus, number> = {
      pending: 0,
      confirmed: 1,
      completed: 2,
      cancelled: 3,
    };
    return [...appointments]
      .sort((a, b) => {
        const byStatus = rank[a.status] - rank[b.status];
        if (byStatus !== 0) return byStatus;
        return (b.date || '').localeCompare(a.date || '', 'fa');
      })
      .slice(0, 8);
  }, [appointments]);

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
        .slice(0, 5),
    [orders]
  );

  const attentionItems = useMemo(() => {
    const items: AttentionItem[] = [];
    if (maintenanceMode && canManageSettings(role)) {
      items.push({
        key: 'maintenance',
        title: 'حالت تعمیر فعال است',
        detail: 'سایت برای عموم در دسترس نیست — از تنظیمات خاموش کنید',
        count: 1,
        icon: 'construction',
        tone: 'rose',
        tab: 'settings',
      });
    }
    if (appointmentsModuleEnabled && metrics.pending > 0 && canAccessTab(allowedTabs, 'appointments')) {
      items.push({
        key: 'pending-apps',
        title: 'نوبت در انتظار تأیید',
        detail: 'نیاز به بررسی و تأیید اپراتور یا مدیر',
        count: metrics.pending,
        icon: 'pending_actions',
        tone: 'amber',
        tab: 'appointments',
      });
    }
    if (metrics.pendingFaqs > 0 && canAccessTab(allowedTabs, 'faqs')) {
      items.push({
        key: 'pending-faqs',
        title: 'پرسش بدون پاسخ',
        detail: 'سوالات مراجعین منتظر پاسخ یا تأیید هستند',
        count: metrics.pendingFaqs,
        icon: 'help',
        tone: 'violet',
        tab: 'faqs',
      });
    }
    if (showForms && metrics.newSubs > 0) {
      items.push({
        key: 'new-forms',
        title: 'ارسال فرم جدید',
        detail: 'فرم‌های خوانده‌نشده در صف بررسی',
        count: metrics.newSubs,
        icon: 'inbox',
        tone: 'blue',
        tab: 'forms',
      });
    }
    if (showShop && metrics.pendingOrders > 0) {
      items.push({
        key: 'pending-orders',
        title: 'سفارش نیازمند پیگیری',
        detail: 'سفارش‌های در انتظار پرداخت یا پرداخت‌شده',
        count: metrics.pendingOrders,
        icon: 'receipt_long',
        tone: 'teal',
        tab: 'orders',
      });
    }
    if (canEditSitePages(role) && metrics.draftPages > 0) {
      items.push({
        key: 'draft-pages',
        title: 'صفحه پیش‌نویس',
        detail: 'صفحات آماده‌نشده برای انتشار',
        count: metrics.draftPages,
        icon: 'draft',
        tone: 'blue',
        tab: 'pages',
      });
    }
    if (canManageArticles(role) && metrics.draftArticles > 0 && canAccessTab(allowedTabs, 'articles')) {
      items.push({
        key: 'draft-articles',
        title: 'مقاله پیش‌نویس',
        detail: 'محتوای مجله در انتظار انتشار',
        count: metrics.draftArticles,
        icon: 'edit_note',
        tone: 'violet',
        tab: 'articles',
      });
    }
    if (appointmentsModuleEnabled && !bookingEnabled && canManageSettings(role)) {
      items.push({
        key: 'booking-off',
        title: 'رزرو آنلاین غیرفعال',
        detail: 'مراجعین فعلاً نمی‌توانند نوبت ثبت کنند',
        count: 1,
        icon: 'event_busy',
        tone: 'rose',
        tab: 'appointments',
      });
    }
    return items;
  }, [
    maintenanceMode,
    role,
    appointmentsModuleEnabled,
    metrics,
    allowedTabs,
    showForms,
    showShop,
    bookingEnabled,
  ]);

  const statCards = useMemo(() => {
    const cards: StatCard[] = [];
    if (appointmentsModuleEnabled && canAccessTab(allowedTabs, 'appointments')) {
      cards.push(
        {
          key: 'total',
          label: 'کل نوبت‌ها',
          value: metrics.totalApps,
          hint: 'بر اساس دسترسی شما',
          icon: 'calendar_month',
          tone: 'slate',
          onClick: () => onNavigate('appointments'),
        },
        {
          key: 'pending',
          label: 'در انتظار تأیید',
          value: metrics.pending,
          hint: metrics.pending ? 'نیاز به اقدام' : 'صف خالی است',
          icon: 'hourglass_top',
          tone: 'amber',
          onClick: () => onNavigate('appointments'),
        },
        {
          key: 'today',
          label: 'نوبت‌های امروز',
          value: metrics.todayApps,
          hint: today,
          icon: 'today',
          tone: 'teal',
          onClick: () => onNavigate('appointments'),
        },
        {
          key: 'confirmed',
          label: 'تأیید‌شده',
          value: metrics.confirmed,
          hint: `${metrics.completed} انجام‌شده`,
          icon: 'event_available',
          tone: 'blue',
          onClick: () => onNavigate('appointments'),
        }
      );
    }

    if (canAccessTab(allowedTabs, 'faqs')) {
      cards.push({
        key: 'faqs',
        label: 'پرسش‌های باز',
        value: metrics.pendingFaqs,
        hint: `${metrics.approvedFaqs} تأییدشده`,
        icon: 'help',
        tone: 'violet',
        onClick: () => onNavigate('faqs'),
      });
    }

    if (canManageArticles(role) && canAccessTab(allowedTabs, 'articles')) {
      cards.push({
        key: 'articles',
        label: 'مقالات منتشرشده',
        value: metrics.publishedArticles,
        hint: metrics.draftArticles ? `${metrics.draftArticles} پیش‌نویس` : 'بدون پیش‌نویس',
        icon: 'article',
        tone: 'teal',
        onClick: () => onNavigate('articles'),
      });
    } else if (canManagePersonnel(role) || canAccessTab(allowedTabs, 'personnel')) {
      cards.push({
        key: 'doctors',
        label: 'درمانگران فعال',
        value: metrics.activeDoctors,
        hint: `${metrics.activeServices} خدمت فعال`,
        icon: 'groups',
        tone: 'teal',
        onClick: () => onNavigate('personnel'),
      });
    }

    if (showForms) {
      cards.push({
        key: 'forms',
        label: 'فرم‌های جدید',
        value: metrics.newSubs,
        hint: 'خوانده‌نشده',
        icon: 'dynamic_form',
        tone: 'blue',
        onClick: () => onNavigate('forms'),
      });
    }

    if (showShop) {
      cards.push({
        key: 'orders',
        label: 'سفارش‌های فعال',
        value: metrics.pendingOrders + metrics.processingOrders,
        hint: formatShopPrice(metrics.orderRevenue),
        icon: 'shopping_bag',
        tone: 'amber',
        onClick: () => onNavigate('orders'),
      });
    }

    return cards.slice(0, 8);
  }, [
    appointmentsModuleEnabled,
    allowedTabs,
    metrics,
    today,
    role,
    showForms,
    showShop,
    onNavigate,
  ]);

  const quickActions = useMemo(() => {
    const actions: { id: string; label: string; icon: string; tab: AdminTabId; primary?: boolean }[] =
      [];
    if (appointmentsModuleEnabled && canAccessTab(allowedTabs, 'appointments')) {
      actions.push({
        id: 'apps',
        label: 'مدیریت نوبت‌ها',
        icon: 'calendar_month',
        tab: 'appointments',
        primary: true,
      });
    }
    if (canAccessTab(allowedTabs, 'faqs')) {
      actions.push({ id: 'faqs', label: 'پاسخ به پرسش‌ها', icon: 'forum', tab: 'faqs' });
    }
    if (showForms) {
      actions.push({ id: 'forms', label: 'بررسی فرم‌ها', icon: 'inbox', tab: 'forms' });
    }
    if (showShop) {
      actions.push({ id: 'orders', label: 'سفارش‌ها', icon: 'receipt_long', tab: 'orders' });
    }
    if (canEditSitePages(role)) {
      actions.push({ id: 'pages', label: 'صفحه‌ها', icon: 'web', tab: 'pages' });
    }
    if (canManageArticles(role) && canAccessTab(allowedTabs, 'articles')) {
      actions.push({ id: 'articles', label: 'مقالات', icon: 'edit_note', tab: 'articles' });
    }
    if (canManageSettings(role)) {
      actions.push({ id: 'settings', label: 'تنظیمات سایت', icon: 'tune', tab: 'settings' });
    }
    if (showSystem) {
      actions.push({ id: 'system', label: 'وضعیت سیستم', icon: 'monitor_heart', tab: 'system' });
    }
    return actions.slice(0, 8);
  }, [appointmentsModuleEnabled, allowedTabs, showForms, showShop, role, showSystem]);

  const healthChipClass =
    systemHealth?.level === 'healthy'
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
      : systemHealth?.level === 'warning'
        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
        : systemHealth?.level === 'critical'
          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome / status strip */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold text-slate-500 mb-1">{longDate}</p>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              سلام {currentUser?.name || 'مدیر'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              خلاصه وضعیت کلینیک بر اساس نقش «{getRoleLabel(role || 'admin')}» — آمار و صف‌های نیازمند اقدام
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {maintenanceMode && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200">
                <span className="material-symbols-outlined text-sm">construction</span>
                حالت تعمیر
              </span>
            )}
            {developmentMode && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200">
                <span className="material-symbols-outlined text-sm">code</span>
                حالت توسعه
              </span>
            )}
            {appointmentsModuleEnabled && (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  bookingEnabled
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {bookingEnabled ? 'event_available' : 'event_busy'}
                </span>
                {bookingEnabled ? 'رزرو فعال' : 'رزرو غیرفعال'}
              </span>
            )}
            {shopModuleEnabled && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200">
                <span className="material-symbols-outlined text-sm">storefront</span>
                فروشگاه فعال
              </span>
            )}
            {systemHealth && (
              <button
                type="button"
                onClick={() => onNavigate('system')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${healthChipClass}`}
              >
                <span className="material-symbols-outlined text-sm">monitor_heart</span>
                {systemHealth.label} · {systemHealth.score}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {statCards.map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={card.onClick}
            className="text-right bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-teal-300 dark:hover:border-teal-700 transition-colors group"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold text-slate-500">{card.label}</p>
                <p className={`text-2xl font-black mt-1 tabular-nums ${TONE_VALUE[card.tone]}`}>
                  {typeof card.value === 'number' ? card.value.toLocaleString('fa-IR') : card.value}
                </p>
                {card.hint && (
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">{card.hint}</p>
                )}
              </div>
              <span
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${TONE_CARD[card.tone]} group-hover:scale-105 transition-transform`}
              >
                <span className="material-symbols-outlined text-[20px]">{card.icon}</span>
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Attention + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600 text-lg">priority_high</span>
              نیازمند اقدام
            </h3>
            {attentionItems.length > 0 && (
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 px-2 py-0.5 rounded-full">
                {attentionItems.length.toLocaleString('fa-IR')} مورد
              </span>
            )}
          </div>
          {attentionItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 p-6 text-center">
              <span className="material-symbols-outlined text-emerald-600 text-3xl">verified</span>
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200 mt-2">
                صف اقدام خالی است
              </p>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-300/70 mt-1">
                نوبت، پرسش، فرم یا سفارش معوقی برای پیگیری فوری وجود ندارد.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {attentionItems.map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => onNavigate(item.tab)}
                    className={`w-full flex items-center gap-3 rounded-xl border p-3 text-right transition-colors hover:shadow-sm ${ATTENTION_TONE[item.tone]}`}
                  >
                    <span className="w-10 h-10 rounded-xl bg-white/80 dark:bg-slate-900/60 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-lg">{item.icon}</span>
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-900 dark:text-white">{item.title}</p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                        {item.detail}
                      </p>
                    </div>
                    <span className="text-lg font-black tabular-nums text-slate-900 dark:text-white">
                      {item.count.toLocaleString('fa-IR')}
                    </span>
                    <span className="material-symbols-outlined text-slate-400 text-base">chevron_left</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-teal-900 text-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-black mb-1">اقدام سریع</h3>
          <p className="text-[11px] text-white/60 mb-4 leading-relaxed">
            میانبر به بخش‌های پرکاربرد بر اساس دسترسی نقش شما
          </p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => onNavigate(action.tab)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-bold transition-colors ${
                  action.primary
                    ? 'bg-teal-500 hover:bg-teal-400 text-white'
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                <span className="material-symbols-outlined text-base">{action.icon}</span>
                <span className="truncate">{action.label}</span>
              </button>
            ))}
          </div>
          {(showUsers || canManagePersonnel(role)) && (
            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-3 text-[11px]">
              {canManagePersonnel(role) && (
                <div>
                  <p className="text-white/50 font-bold">درمانگر فعال</p>
                  <p className="text-base font-black mt-0.5 tabular-nums">
                    {metrics.activeDoctors.toLocaleString('fa-IR')}
                  </p>
                </div>
              )}
              {showUsers && (
                <div>
                  <p className="text-white/50 font-bold">کاربران سیستم</p>
                  <p className="text-base font-black mt-0.5 tabular-nums">
                    {usersCount == null ? '—' : usersCount.toLocaleString('fa-IR')}
                  </p>
                </div>
              )}
              {canEditSitePages(role) && (
                <div>
                  <p className="text-white/50 font-bold">صفحات منتشرشده</p>
                  <p className="text-base font-black mt-0.5 tabular-nums">
                    {metrics.publishedPages.toLocaleString('fa-IR')}
                  </p>
                </div>
              )}
              {canManagePersonnel(role) && (
                <div>
                  <p className="text-white/50 font-bold">خدمات فعال</p>
                  <p className="text-base font-black mt-0.5 tabular-nums">
                    {metrics.activeServices.toLocaleString('fa-IR')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {appointmentsModuleEnabled && canAccessTab(allowedTabs, 'appointments') && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-600 text-lg">event_note</span>
                نوبت‌های اخیر
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('appointments')}
                className="text-[11px] font-bold text-teal-700 hover:text-teal-600"
              >
                مشاهده همه
              </button>
            </div>
            {recentAppointments.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">نوبتی برای نمایش وجود ندارد.</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentAppointments.map((app) => (
                  <li key={app.id} className="py-3 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {app.patientName}
                        </p>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_TONE[app.status]}`}
                        >
                          {STATUS_LABEL[app.status]}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 truncate">
                        {app.doctorName} · {app.serviceTitle}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {app.date} · ساعت {app.timeSlot} ·{' '}
                        {app.sessionType === 'in-person' ? 'حضوری' : 'آنلاین'}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0" dir="ltr">
                      {app.bookingRef}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {showShop ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-600 text-lg">shopping_cart</span>
                سفارش‌های اخیر
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('orders')}
                className="text-[11px] font-bold text-teal-700 hover:text-teal-600"
              >
                مشاهده همه
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
                <p className="text-[10px] font-bold text-slate-500">کل سفارش</p>
                <p className="text-sm font-black tabular-nums mt-0.5">
                  {orders.length.toLocaleString('fa-IR')}
                </p>
              </div>
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3">
                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300">نیازمند پیگیری</p>
                <p className="text-sm font-black tabular-nums mt-0.5 text-amber-800 dark:text-amber-200">
                  {metrics.pendingOrders.toLocaleString('fa-IR')}
                </p>
              </div>
              <div className="rounded-xl bg-teal-50 dark:bg-teal-950/30 p-3">
                <p className="text-[10px] font-bold text-teal-700 dark:text-teal-300">درآمد ثبت‌شده</p>
                <p className="text-[11px] font-black mt-0.5 text-teal-800 dark:text-teal-200 leading-snug">
                  {formatShopPrice(metrics.orderRevenue)}
                </p>
              </div>
            </div>
            {recentOrders.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">سفارشی ثبت نشده است.</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentOrders.map((order) => (
                  <li key={order.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {order.customer.name}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5" dir="ltr">
                        {order.orderNumber}
                      </p>
                    </div>
                    <div className="text-left shrink-0">
                      <p className="text-[11px] font-bold tabular-nums">{formatShopPrice(order.total)}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {SHOP_ORDER_STATUS_LABELS[order.status] || order.status}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-teal-600 text-lg">insights</span>
              خلاصه محتوا و عملیات
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {canManageArticles(role) && canAccessTab(allowedTabs, 'articles') && (
                <>
                  <SnapshotTile
                    label="مقالات منتشرشده"
                    value={metrics.publishedArticles}
                    icon="article"
                    onClick={() => onNavigate('articles')}
                  />
                  <SnapshotTile
                    label="پیش‌نویس مقاله"
                    value={metrics.draftArticles}
                    icon="draft"
                    onClick={() => onNavigate('articles')}
                  />
                </>
              )}
              {canEditSitePages(role) && (
                <>
                  <SnapshotTile
                    label="صفحات منتشرشده"
                    value={metrics.publishedPages}
                    icon="web"
                    onClick={() => onNavigate('pages')}
                  />
                  <SnapshotTile
                    label="صفحه پیش‌نویس"
                    value={metrics.draftPages}
                    icon="note_add"
                    onClick={() => onNavigate('pages')}
                  />
                </>
              )}
              {canAccessTab(allowedTabs, 'faqs') && (
                <>
                  <SnapshotTile
                    label="پرسش تأییدشده"
                    value={metrics.approvedFaqs}
                    icon="verified"
                    onClick={() => onNavigate('faqs')}
                  />
                  <SnapshotTile
                    label="پرسش باز"
                    value={metrics.pendingFaqs}
                    icon="pending"
                    onClick={() => onNavigate('faqs')}
                  />
                </>
              )}
              {(canManagePersonnel(role) || canAccessTab(allowedTabs, 'personnel')) && (
                <>
                  <SnapshotTile
                    label="درمانگر فعال"
                    value={metrics.activeDoctors}
                    icon="medical_services"
                    onClick={() => onNavigate('personnel')}
                  />
                  <SnapshotTile
                    label="خدمت فعال"
                    value={metrics.activeServices}
                    icon="spa"
                    onClick={() => onNavigate('personnel')}
                  />
                </>
              )}
              {showForms && (
                <SnapshotTile
                  label="فرم خوانده‌نشده"
                  value={metrics.newSubs}
                  icon="mark_email_unread"
                  onClick={() => onNavigate('forms')}
                />
              )}
              {appointmentsModuleEnabled && (
                <SnapshotTile
                  label="نوبت لغوشده"
                  value={metrics.cancelled}
                  icon="event_busy"
                  onClick={() => onNavigate('appointments')}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function SnapshotTile({
  label,
  value,
  icon,
  onClick,
}: {
  label: string;
  value: number;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 p-3 text-right hover:border-teal-300 dark:hover:border-teal-700 transition-colors"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="material-symbols-outlined text-slate-400 text-lg">{icon}</span>
        <span className="text-lg font-black tabular-nums text-slate-900 dark:text-white">
          {value.toLocaleString('fa-IR')}
        </span>
      </div>
      <p className="text-[11px] font-bold text-slate-500 mt-1">{label}</p>
    </button>
  );
}
