import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Article, ClinicContactInfo, Doctor, FAQItem, PageScreen, ServiceBlock, ServiceItem } from '../../../types';
import { fetchArticleCategories } from '../../../lib/dbService';
import { readResponsiveCols, resolveColsForWidth, resolveContainerColumnCount } from '../../../lib/responsiveGrid';
import {
  DEFAULT_CONTACT_INFO,
  getMapEmbedSrc,
  getMapHref,
  getTelHref,
  listContactChannels,
  mergeContactInfo,
} from '../../../lib/contactInfo';
import { CHANNEL_ACCENT, ContactChannelIcon } from '../../ContactChannelIcon';
import { ResponsiveGrid } from '../ResponsiveGrid';
import { useBuilderDevicePreview } from '../BuilderDevicePreviewContext';
import { containerWidthStyle, DEFAULT_CONTENT_MAX_WIDTH } from '../../../lib/contentWidth';
import {
  cssBorderStyle,
  dividerSpacingClass,
  dividerTextSizeClass,
  dividerTextWeightClass,
  DIVIDER_TEXT_COLOR_CLASS,
  resolveDividerColor,
  resolveDividerThickness,
  resolveDividerWidth,
  type DividerContentMode,
  type DividerContentPlacement,
  type DividerEndCap,
  type DividerLineStyle,
  type DividerWidthMode,
} from '../../../lib/dividerLine';
import { resolveSpacerSides, clampSpacerPx } from '../../../lib/spacerBlock';
import {
  clampRadius,
  imageAspectClass,
  resolveImageWidth,
} from '../../../lib/imageMediaBlock';
import { ImageLightbox, type LightboxItem } from '../../media/ImageLightbox';

export interface BlockRenderContext {
  serviceId?: string;
  allServices?: ServiceItem[];
  doctors?: Doctor[];
  articles?: Article[];
  faqs?: FAQItem[];
  contact?: ClinicContactInfo | null;
  bookingEnabled?: boolean;
  onOpenBooking?: (doctorId?: string, serviceId?: string) => void;
  onOpenDoctorModal?: (doctorId: string) => void;
  onOpenGuide?: () => void;
  onNavigate?: (screen: PageScreen) => void;
  onSelectOtherService?: (id: string) => void;
  onSelectArticle?: (article: Article) => void;
  interactive?: boolean;
}

function str(v: unknown, fallback = '') {
  return typeof v === 'string' ? v : fallback;
}

function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

export const HeroBlock: React.FC<{ props: Record<string, unknown>; ctx: BlockRenderContext }> = ({
  props,
  ctx,
}) => (
  <section className="bg-surface-container-low p-8 md:p-12 rounded-[40px] border border-outline-variant/30 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative overflow-hidden">
    <div className="lg:col-span-7 space-y-6 z-10">
      <div className="flex flex-wrap items-center gap-2">
        <span className="bg-primary/10 text-primary text-xs font-extrabold px-4 py-1.5 rounded-full inline-block shadow-sm">
          {str(props.badge)}
        </span>
        <span className="bg-emerald-500/10 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">thumb_up</span>
          <span>{str(props.satisfactionRate)}</span>
        </span>
      </div>
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-primary leading-tight">
        {str(props.title)}
      </h1>
      <p className="text-sm md:text-base text-on-surface-variant leading-relaxed text-justify">
        {str(props.subtitle)}
      </p>
      <div className="flex flex-wrap gap-3 text-xs font-bold text-on-surface pt-2">
        <div className="bg-white dark:bg-surface-dim px-3.5 py-2 rounded-xl shadow-xs border border-outline-variant/30 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">schedule</span>
          <span>مدت جلسه: {str(props.duration)}</span>
        </div>
        <div className="bg-white dark:bg-surface-dim px-3.5 py-2 rounded-xl shadow-xs border border-outline-variant/30 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">tune</span>
          <span>برگزاری: {str(props.format)}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 pt-3">
        <button
          type="button"
          onClick={() => ctx.onOpenBooking?.(undefined, ctx.serviceId)}
          className="bg-primary hover:bg-primary-container text-white font-extrabold px-8 py-4 rounded-2xl shadow-lg transition-all flex items-center gap-2 text-sm group"
        >
          <span className="material-symbols-outlined text-lg">calendar_month</span>
          <span>{ctx.bookingEnabled ? 'رزرو آنلاین نوبت این خدمت' : 'رزرو نوبت (تلفنی و حضوری)'}</span>
        </button>
        <a
          href="tel:02188776655"
          className="border border-outline-variant text-on-surface font-bold px-6 py-4 rounded-2xl hover:bg-surface-container transition-all text-sm flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg text-primary">call</span>
          <span>مشاوره تلفنی سریع (۰۲۱-۸۸۷۷۶۶۵۵)</span>
        </a>
      </div>
      {str(props.sessionFeeNote) && (
        <p className="text-[11px] text-on-surface-variant/80 flex items-center gap-1 font-medium pt-1">
          <span className="material-symbols-outlined text-sm text-emerald-600">verified</span>
          <span>{str(props.sessionFeeNote)}</span>
        </p>
      )}
    </div>
    <div className="lg:col-span-5 relative">
      <div className="rounded-[32px] overflow-hidden shadow-2xl aspect-[4/3] border-4 border-white dark:border-surface-dim relative group">
        <img
          src={str(props.heroImage)}
          alt={str(props.title)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute bottom-4 right-4 left-4 bg-white/90 dark:bg-surface-dim/90 backdrop-blur p-3.5 rounded-2xl border border-white/50 text-xs shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-extrabold text-on-surface">مشاوران آماده پذیرش نوبت‌های جدید هستند</span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export const HighlightsBlock: React.FC<{ props: Record<string, unknown> }> = ({ props }) => {
  const items = arr<{ icon: string; label: string; value: string }>(props.items);
  return (
    <section className="w-full min-w-0">
      <ResponsiveGrid
        columnsMobile={props.columnsMobile}
        columnsTablet={props.columnsTablet}
        columnsDesktop={props.columnsDesktop}
        fallbacks={{ mobile: 1, tablet: 2, desktop: 4 }}
        className="gap-3 sm:gap-4"
      >
        {items.map((item, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-surface-dim p-4 sm:p-5 rounded-2xl border border-outline-variant/30 shadow-soft flex items-center gap-3 min-w-0"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl sm:text-2xl">{item.icon}</span>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-on-surface-variant font-bold block truncate">{item.label}</span>
              <span className="text-sm font-black text-on-surface block mt-0.5 truncate">{item.value}</span>
            </div>
          </div>
        ))}
      </ResponsiveGrid>
    </section>
  );
};

export const SymptomsBlock: React.FC<{ props: Record<string, unknown> }> = ({ props }) => {
  const items = arr<{ icon: string; title: string; desc: string }>(props.items);
  return (
    <section className="space-y-8 bg-surface-container-lowest p-8 md:p-12 rounded-[36px] border border-outline-variant/20 shadow-xs">
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <span className="text-xs font-bold text-primary bg-primary/10 px-3.5 py-1 rounded-full">
          مخاطبان و نشانه‌های نیاز
        </span>
        <h2 className="text-2xl md:text-3xl font-black text-primary">{str(props.title)}</h2>
        <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed">{str(props.subtitle)}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-surface-dim p-6 rounded-3xl border border-outline-variant/30 shadow-soft space-y-3 hover:border-primary/50 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-2xl">{item.icon}</span>
            </div>
            <h3 className="text-base font-extrabold text-on-surface group-hover:text-primary transition-colors">
              {item.title}
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed text-justify">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export const ProcessBlock: React.FC<{ props: Record<string, unknown> }> = ({ props }) => {
  const steps = arr<{ number: string; title: string; desc: string }>(props.steps);
  return (
    <section className="space-y-8">
      <div className="text-center space-y-2">
        <span className="text-xs font-bold text-primary bg-primary/10 px-3.5 py-1 rounded-full">
          {str(props.eyebrow, 'فرآیند دریافت خدمت')}
        </span>
        <h2 className="text-2xl md:text-3xl font-black text-primary">{str(props.title)}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-surface-dim p-6 rounded-3xl border border-outline-variant/30 shadow-soft relative flex flex-col justify-between space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-3xl font-black text-primary/30">{step.number}</span>
              <span className="w-3 h-3 rounded-full bg-primary/20" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-on-surface">{step.title}</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed text-justify">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export const FeaturesBlock: React.FC<{ props: Record<string, unknown> }> = ({ props }) => {
  const items = arr<{ icon: string; title: string; desc: string }>(props.items);
  return (
    <section className="bg-surface-container-low p-8 md:p-12 rounded-[36px] border border-outline-variant/30 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-black text-primary">{str(props.title)}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((feat, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-surface-dim p-6 rounded-2xl border border-outline-variant/30 shadow-xs space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">{feat.icon}</span>
            </div>
            <h3 className="text-sm font-bold text-on-surface">{feat.title}</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">{feat.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export const DoctorsBlock: React.FC<{ props: Record<string, unknown>; ctx: BlockRenderContext }> = ({
  props,
  ctx,
}) => {
  const filter = arr<string>(props.specialtiesFilter);
  const maxCount = typeof props.maxCount === 'number' ? props.maxCount : 3;
  const doctors = (ctx.doctors || []).filter((doc) => {
    if (!filter.length) return true;
    return doc.specialties.some((s) => filter.includes(s));
  });

  return (
    <section className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b pb-4">
        <div>
          <span className="text-xs font-bold text-primary bg-primary/10 px-3.5 py-1 rounded-full">تیم متخصصین</span>
          <h2 className="text-2xl md:text-3xl font-black text-primary mt-2">{str(props.title)}</h2>
          <p className="text-xs text-on-surface-variant mt-1">{str(props.subtitle)}</p>
        </div>
        <button
          type="button"
          onClick={() => ctx.onNavigate?.('team')}
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1 shrink-0"
        >
          <span>مشاهده اعضای کامل کادر درمان</span>
          <span className="material-symbols-outlined text-sm">arrow_back</span>
        </button>
      </div>
      <ResponsiveGrid
        columnsMobile={props.columnsMobile}
        columnsTablet={props.columnsTablet}
        columnsDesktop={props.columnsDesktop}
        fallbacks={{ mobile: 1, tablet: 2, desktop: 3 }}
        className="gap-4 sm:gap-6"
      >
        {doctors.slice(0, maxCount).map((doc) => (
          <div
            key={doc.id}
            className="bg-white dark:bg-surface-dim p-5 sm:p-6 rounded-3xl border border-outline-variant/30 shadow-soft flex flex-col justify-between hover:shadow-md transition-all space-y-4 min-w-0"
          >
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <img
                src={doc.avatar}
                alt={doc.name}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-primary/20 shrink-0"
              />
              <div className="space-y-1 min-w-0">
                <h3 className="text-base font-extrabold text-on-surface truncate">{doc.name}</h3>
                <p className="text-xs text-primary font-bold truncate">{doc.title}</p>
                <p className="text-[11px] text-on-surface-variant truncate">{doc.degree}</p>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3 text-justify">{doc.bio}</p>
            <div className="flex flex-wrap gap-1.5 pt-2">
              {doc.tags.map((tag, i) => (
                <span
                  key={i}
                  className="bg-surface-container text-[10px] font-bold text-on-surface-variant px-2.5 py-1 rounded-lg"
                >
                  #{tag}
                </span>
              ))}
            </div>
            <div className="pt-3 border-t flex flex-col sm:flex-row gap-2">
              {ctx.onOpenDoctorModal && (
                <button
                  type="button"
                  onClick={() => ctx.onOpenDoctorModal?.(doc.id)}
                  className="flex-1 py-2 rounded-xl border border-outline-variant text-xs font-bold hover:bg-surface-container transition-all"
                >
                  مشاهده رزومه
                </button>
              )}
              {ctx.bookingEnabled && (
                <button
                  type="button"
                  onClick={() => ctx.onOpenBooking?.(doc.id, ctx.serviceId)}
                  className="flex-1 py-2 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold transition-all shadow-sm"
                >
                  رزرو نوبت
                </button>
              )}
            </div>
          </div>
        ))}
        {doctors.length === 0 && (
          <p className="col-span-full text-center text-xs text-on-surface-variant py-8">
            متخصصی با فیلتر فعلی یافت نشد.
          </p>
        )}
      </ResponsiveGrid>
    </section>
  );
};

const STAFF_TAG_COLORS = [
  'bg-rose-100 text-rose-700',
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
  'bg-amber-100 text-amber-800',
  'bg-emerald-100 text-emerald-800',
  'bg-fuchsia-100 text-fuchsia-700',
];

function bookingLabelForDoctor(doc: Doctor, fallback: string): string {
  const online = doc.sessionTypes.includes('online');
  const inPerson = doc.sessionTypes.includes('in-person');
  if (online && inPerson) return fallback;
  if (online) return `${fallback} (آنلاین)`;
  if (inPerson) return `${fallback} (تلفنی)`;
  return fallback;
}

export const StaffCarouselBlock: React.FC<{
  props: Record<string, unknown>;
  ctx: BlockRenderContext;
}> = ({ props, ctx }) => {
  const filter = arr<string>(props.specialtiesFilter);
  const maxCount = typeof props.maxCount === 'number' ? props.maxCount : 0;
  const onlyActive = props.onlyActive !== false;
  const showViewAll = props.showViewAll !== false;
  const showArrows = props.showArrows !== false;
  const showDots = props.showDots !== false;
  const autoplay = props.autoplay === true;
  const intervalMs = typeof props.intervalMs === 'number' ? props.intervalMs : 5000;
  const bookingLabel = str(props.bookingLabel, 'رزرو نوبت');
  const profileLabel = str(props.profileLabel, 'پروفایل درمانگر');

  const allDoctors = (ctx.doctors || []).filter((doc) => {
    if (onlyActive && !doc.active) return false;
    if (!filter.length) return true;
    return doc.specialties.some((s) => filter.includes(s));
  });
  const doctors = maxCount > 0 ? allDoctors.slice(0, maxCount) : allDoctors;

  const previewDevice = useBuilderDevicePreview();
  const { mobile, tablet, desktop } = readResponsiveCols(
    props.columnsMobile,
    props.columnsTablet,
    props.columnsDesktop,
    { mobile: 1, tablet: 2, desktop: 4 }
  );
  const [visible, setVisible] = useState(desktop);
  const [page, setPage] = useState(0);
  const [dragPx, setDragPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    lastX: 0,
    moved: false,
  });

  useEffect(() => {
    if (previewDevice === 'mobile') {
      setVisible(mobile);
      return;
    }
    if (previewDevice === 'tablet') {
      setVisible(tablet);
      return;
    }
    if (previewDevice === 'desktop') {
      setVisible(desktop);
      return;
    }
    const apply = () => setVisible(resolveColsForWidth(window.innerWidth, mobile, tablet, desktop));
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, [previewDevice, mobile, tablet, desktop]);

  const maxPage = Math.max(0, doctors.length - visible);

  useEffect(() => {
    setPage((p) => Math.min(p, maxPage));
  }, [maxPage, visible, doctors.length]);

  useEffect(() => {
    if (!autoplay || doctors.length <= visible || isDragging) return;
    const t = window.setInterval(() => {
      setPage((p) => (p >= maxPage ? 0 : p + 1));
    }, Math.max(2500, intervalMs));
    return () => window.clearInterval(t);
  }, [autoplay, intervalMs, doctors.length, visible, maxPage, isDragging]);

  const go = useCallback(
    (dir: -1 | 1) => {
      setPage((p) => Math.min(maxPage, Math.max(0, p + dir)));
    },
    [maxPage]
  );

  const endDrag = useCallback(
    (clientX: number) => {
      const d = dragRef.current;
      if (!d.active) return;
      d.active = false;
      setIsDragging(false);

      const dx = clientX - d.startX;
      const width = viewportRef.current?.offsetWidth || 320;
      const threshold = Math.max(48, width * 0.14);

      // Finger/mouse moved right (+dx) → show previous page (RTL carousel)
      // Moved left (−dx) → show next page
      if (dx > threshold) {
        setPage((p) => Math.max(0, p - 1));
      } else if (dx < -threshold) {
        setPage((p) => Math.min(maxPage, p + 1));
      }
      setDragPx(0);

      // Keep moved flag briefly so click handlers can ignore accidental taps after drag
      window.setTimeout(() => {
        d.moved = false;
      }, 80);
    },
    [maxPage]
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (maxPage <= 0) return;
    // Ignore non-primary mouse buttons
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      lastX: e.clientX,
      moved: false,
    };
    setIsDragging(true);
    setDragPx(0);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d.active || d.pointerId !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    d.lastX = e.clientX;
    if (Math.abs(dx) > 6) d.moved = true;
    // Rubber-band at edges
    let visual = dx;
    if ((page <= 0 && dx > 0) || (page >= maxPage && dx < 0)) {
      visual = dx * 0.35;
    }
    setDragPx(visual);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current.pointerId !== e.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    endDrag(e.clientX);
  };

  const onPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current.pointerId !== e.pointerId) return;
    dragRef.current.active = false;
    setIsDragging(false);
    setDragPx(0);
    dragRef.current.moved = false;
  };

  const guardClick = (e: React.MouseEvent | React.PointerEvent) => {
    if (dragRef.current.moved) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const badgeText = str(props.badge, 'کادر درمانی و روانشناسان کلینیک ژینو');
  const badgeWithCount = doctors.length
    ? `${badgeText} (${doctors.length} درمانگر)`
    : badgeText;

  if (!doctors.length) {
    return (
      <section className="rounded-[28px] border border-dashed border-outline-variant/40 py-14 text-center text-sm text-on-surface-variant">
        پرسنلی برای نمایش در کروسل یافت نشد.
      </section>
    );
  }

  const gapPx = 20;
  const cardBasis = `calc((100% - ${(visible - 1) * gapPx}px) / ${visible})`;
  // In RTL flex, moving to next cards = positive translateX
  const pageOffset = `calc(${page} * (${cardBasis} + ${gapPx}px))`;
  const transform =
    dragPx !== 0
      ? `translateX(calc(${pageOffset} + ${dragPx}px))`
      : `translateX(${pageOffset})`;

  return (
    <section className="space-y-6 md:space-y-8 w-full min-w-0">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <span className="inline-flex text-[11px] font-bold text-emerald-800 bg-emerald-100 px-3.5 py-1 rounded-full">
            {badgeWithCount}
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-on-surface">{str(props.title)}</h2>
          {str(props.subtitle) && (
            <p className="text-sm text-on-surface-variant max-w-xl leading-relaxed">
              {str(props.subtitle)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 self-start lg:self-auto">
          {showViewAll && (
            <button
              type="button"
              onClick={() => ctx.onNavigate?.('team')}
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-primary bg-primary/10 hover:bg-primary/15 px-4 py-2.5 rounded-full transition-colors"
            >
              <span>{str(props.viewAllLabel, 'مشاهده همه')}</span>
              <span className="material-symbols-outlined text-sm">arrow_back</span>
            </button>
          )}
          {showArrows && doctors.length > visible && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="قبلی"
                onClick={() => go(-1)}
                disabled={page <= 0}
                className="w-10 h-10 rounded-full border border-outline-variant/40 bg-white dark:bg-surface-dim text-on-surface shadow-sm flex items-center justify-center disabled:opacity-35 hover:border-primary/40 transition-colors"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
              <button
                type="button"
                aria-label="بعدی"
                onClick={() => go(1)}
                disabled={page >= maxPage}
                className="w-10 h-10 rounded-full border border-outline-variant/40 bg-white dark:bg-surface-dim text-on-surface shadow-sm flex items-center justify-center disabled:opacity-35 hover:border-primary/40 transition-colors"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        ref={viewportRef}
        className={`overflow-hidden touch-pan-y select-none ${
          maxPage > 0 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : ''
        }`}
        style={{ touchAction: maxPage > 0 ? 'pan-y' : undefined }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        role="region"
        aria-roledescription="carousel"
        aria-label={str(props.title, 'کروسل متخصصین')}
      >
        <div
          className={`flex ${isDragging ? '' : 'transition-transform duration-500 ease-out'}`}
          style={{
            gap: gapPx,
            transform,
            willChange: 'transform',
          }}
        >
          {doctors.map((doc) => (
            <article
              key={doc.id}
              className="min-w-0 bg-white dark:bg-surface-dim rounded-[28px] border border-outline-variant/25 shadow-soft overflow-hidden flex flex-col"
              style={{ flex: `0 0 ${cardBasis}`, maxWidth: cardBasis }}
            >
              <div className="relative aspect-[4/5] bg-surface-container overflow-hidden pointer-events-none">
                <img
                  src={doc.avatar}
                  alt={doc.name}
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-cover object-top"
                />
                {doc.active && (
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    آماده نوبت‌دهی
                  </span>
                )}
                {typeof doc.experienceYears === 'number' && doc.experienceYears > 0 && (
                  <span className="absolute bottom-3 left-3 bg-black/55 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                    {doc.experienceYears} سال سابقه
                  </span>
                )}
              </div>

              <div className="p-4 sm:p-5 flex flex-col flex-1 gap-3">
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-black text-on-surface leading-snug">
                    {doc.name}
                  </h3>
                  <p className="text-xs font-bold text-primary">{doc.title}</p>
                </div>
                <p className="text-[11px] sm:text-xs text-on-surface-variant leading-relaxed line-clamp-3">
                  {doc.bio}
                </p>
                {!!doc.tags?.length && (
                  <div className="flex flex-wrap gap-1.5">
                    {doc.tags.slice(0, 4).map((tag, i) => (
                      <span
                        key={`${doc.id}-${tag}`}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          STAFF_TAG_COLORS[i % STAFF_TAG_COLORS.length]
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-auto pt-1 flex gap-2" onClickCapture={guardClick}>
                  {ctx.bookingEnabled !== false && (
                    <button
                      type="button"
                      onClick={() => ctx.onOpenBooking?.(doc.id, ctx.serviceId)}
                      className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-white text-[11px] font-extrabold transition-colors shadow-sm"
                    >
                      {bookingLabelForDoctor(doc, bookingLabel)}
                    </button>
                  )}
                  {ctx.onOpenDoctorModal && (
                    <button
                      type="button"
                      onClick={() => ctx.onOpenDoctorModal?.(doc.id)}
                      className="flex-1 py-2.5 rounded-xl border border-primary text-primary text-[11px] font-extrabold hover:bg-primary/5 transition-colors"
                    >
                      {profileLabel}
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {showDots && maxPage > 0 && (
        <div className="flex justify-center items-center gap-1.5 pt-1">
          {Array.from({ length: maxPage + 1 }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`اسلاید ${i + 1}`}
              onClick={() => setPage(i)}
              className={`h-2 rounded-full transition-all ${
                i === page ? 'w-6 bg-primary' : 'w-2 bg-outline-variant/50 hover:bg-outline-variant'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export const TestimonialsBlock: React.FC<{ props: Record<string, unknown> }> = ({ props }) => {
  const items = arr<{ name: string; role: string; comment: string; rating: number }>(props.items);
  if (!items.length) return null;
  return (
    <section className="bg-surface-container-lowest p-8 md:p-12 rounded-[36px] border border-outline-variant/20 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black text-primary">{str(props.title)}</h2>
        <p className="text-xs text-on-surface-variant">{str(props.subtitle)}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((test, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-surface-dim p-6 rounded-3xl border border-outline-variant/30 shadow-soft space-y-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-on-surface">{test.name}</h3>
                <p className="text-[11px] text-primary">{test.role}</p>
              </div>
              <div className="flex text-amber-500">
                {[...Array(test.rating || 5)].map((_, i) => (
                  <span key={i} className="material-symbols-outlined text-sm">
                    star
                  </span>
                ))}
              </div>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed text-justify italic">
              &quot;{test.comment}&quot;
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export const FaqsBlock: React.FC<{ props: Record<string, unknown> }> = ({ props }) => {
  const items = arr<{ question: string; answer: string }>(props.items);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  if (!items.length) return null;
  return (
    <section className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black text-primary">{str(props.title)}</h2>
        <p className="text-xs text-on-surface-variant">{str(props.subtitle)}</p>
      </div>
      <div className="space-y-3">
        {items.map((faq, idx) => {
          const isOpen = openFaqIndex === idx;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-surface-dim rounded-2xl border border-outline-variant/30 overflow-hidden shadow-xs transition-all"
            >
              <button
                type="button"
                onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                className="w-full p-4 text-right flex items-center justify-between gap-3 font-bold text-xs md:text-sm text-on-surface hover:text-primary transition-colors"
              >
                <span>{faq.question}</span>
                <span className="material-symbols-outlined text-lg text-primary shrink-0">
                  {isOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-1 text-xs text-on-surface-variant leading-relaxed border-t border-outline-variant/10 text-justify">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

function isPublishedFaq(faq: FAQItem): boolean {
  return !faq.status || faq.status === 'approved';
}

function faqSortKey(faq: FAQItem): number {
  if (!faq.date) return 0;
  const t = Date.parse(faq.date);
  return Number.isFinite(t) ? t : 0;
}

const FAQ_CATEGORY_LABELS: Record<string, string> = {
  adult: 'بزرگسال',
  child: 'کودک و نوجوان',
  marriage: 'زوج و خانواده',
  neurofeed: 'نوروفیدبک',
  online: 'آنلاین',
  general: 'عمومی',
};

export const LatestFaqsBlock: React.FC<{
  props: Record<string, unknown>;
  ctx: BlockRenderContext;
}> = ({ props, ctx }) => {
  const maxCount = Math.min(20, Math.max(1, Number(props.maxCount) || 6));
  const filter = arr<string>(props.categoryFilter).map((c) => c.trim()).filter(Boolean);
  const showCategory = props.showCategory !== false;
  const showLikes = props.showLikes !== false;
  const showViewAll = props.showViewAll !== false;
  const openFirst = props.openFirst !== false;
  const accentStyle = str(props.accentStyle, 'soft');
  const [openId, setOpenId] = useState<string | null>(null);

  const items = (ctx.faqs || [])
    .filter(isPublishedFaq)
    .filter((faq) => {
      if (!filter.length) return true;
      return filter.includes(String(faq.category || ''));
    })
    .slice()
    .sort((a, b) => faqSortKey(b) - faqSortKey(a))
    .slice(0, maxCount);

  useEffect(() => {
    if (!openFirst || !items.length) {
      setOpenId(null);
      return;
    }
    setOpenId(items[0].id);
  }, [openFirst, items.map((i) => i.id).join(',')]);

  const cardClass =
    accentStyle === 'bordered'
      ? 'bg-white dark:bg-surface-dim border-2 border-primary/20 shadow-sm'
      : 'bg-white dark:bg-surface-dim border border-outline-variant/25 shadow-soft';

  return (
    <section className="space-y-6 md:space-y-8 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2 text-right min-w-0">
          {str(props.badge) && (
            <span className="inline-flex text-[11px] font-bold text-primary bg-primary/10 px-3.5 py-1 rounded-full">
              {str(props.badge)}
            </span>
          )}
          <h2 className="text-2xl md:text-3xl font-black text-on-surface">{str(props.title)}</h2>
          {str(props.subtitle) && (
            <p className="text-sm text-on-surface-variant max-w-xl leading-relaxed">
              {str(props.subtitle)}
            </p>
          )}
        </div>
        {showViewAll && (
          <button
            type="button"
            onClick={() => ctx.onNavigate?.('faq')}
            className="inline-flex items-center gap-1.5 self-start sm:self-auto shrink-0 text-xs font-extrabold text-primary bg-primary/10 hover:bg-primary/15 px-4 py-2.5 rounded-full transition-colors"
          >
            <span>{str(props.viewAllLabel, 'مشاهده همه سوالات')}</span>
            <span className="material-symbols-outlined text-sm">arrow_back</span>
          </button>
        )}
      </div>

      {!items.length ? (
        <div className="rounded-[28px] border border-dashed border-outline-variant/40 py-14 text-center space-y-2">
          <span className="material-symbols-outlined text-3xl text-on-surface-variant/50">quiz</span>
          <p className="text-sm text-on-surface-variant">هنوز سوال تأییدشده‌ای برای نمایش وجود ندارد.</p>
        </div>
      ) : (
        <div className="space-y-3 max-w-3xl mx-auto w-full">
          {items.map((faq, idx) => {
            const isOpen = openId === faq.id;
            const catLabel =
              FAQ_CATEGORY_LABELS[String(faq.category || '')] || faq.serviceTitle || faq.category;
            return (
              <div
                key={faq.id}
                className={`${cardClass} rounded-[22px] overflow-hidden transition-all duration-300 ${
                  isOpen ? 'ring-1 ring-primary/25' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                  className="w-full p-4 sm:p-5 text-right flex items-start gap-3 group"
                  aria-expanded={isOpen}
                >
                  <span
                    className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black shrink-0 transition-colors ${
                      isOpen
                        ? 'bg-primary text-white'
                        : 'bg-primary/10 text-primary group-hover:bg-primary/15'
                    }`}
                  >
                    {String(idx + 1).padStart(2, '۰')}
                  </span>
                  <div className="flex-1 min-w-0 space-y-2">
                    <p className="text-sm sm:text-[15px] font-extrabold text-on-surface leading-snug group-hover:text-primary transition-colors">
                      {faq.question}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {showCategory && catLabel && (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant">
                          {catLabel}
                        </span>
                      )}
                      {showLikes && typeof faq.likesCount === 'number' && faq.likesCount > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-on-surface-variant">
                          <span className="material-symbols-outlined text-sm text-rose-400">favorite</span>
                          {faq.likesCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`material-symbols-outlined text-xl text-primary shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  >
                    expand_more
                  </span>
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 mr-11 space-y-2 border-t border-outline-variant/10">
                      <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed text-justify pt-3">
                        {faq.answer || 'پاسخی ثبت نشده است.'}
                      </p>
                      {faq.responderName && (
                        <p className="text-[10px] font-bold text-primary/80">
                          پاسخ‌دهنده: {faq.responderName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export const OtherServicesBlock: React.FC<{ props: Record<string, unknown>; ctx: BlockRenderContext }> = ({
  props,
  ctx,
}) => {
  if (!ctx.allServices?.length) return null;
  return (
    <section className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/30 space-y-4">
      <h3 className="font-extrabold text-sm text-primary text-center">{str(props.title)}</h3>
      <div className="flex flex-wrap justify-center gap-2">
        {ctx.allServices.map((serv) => (
          <button
            key={serv.id}
            type="button"
            onClick={() => {
              if (ctx.onSelectOtherService) ctx.onSelectOtherService(serv.id);
              else ctx.onNavigate?.('services');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              serv.id === ctx.serviceId
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white text-on-surface-variant hover:bg-surface-container hover:text-on-surface border border-outline-variant/30'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{serv.icon}</span>
            <span>{serv.title}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

export const CtaBlock: React.FC<{ props: Record<string, unknown>; ctx: BlockRenderContext }> = ({
  props,
  ctx,
}) => (
  <section className="bg-primary text-white p-8 md:p-12 rounded-[40px] shadow-xl text-center space-y-5 relative overflow-hidden">
    <span className="bg-white/20 text-white text-xs font-bold px-4 py-1.5 rounded-full inline-block backdrop-blur">
      {str(props.badge)}
    </span>
    <h2 className="text-2xl md:text-3xl font-black leading-tight">{str(props.title)}</h2>
    <p className="text-xs md:text-sm text-white/90 max-w-xl mx-auto leading-relaxed">{str(props.subtitle)}</p>
    <div className="pt-2 flex flex-wrap justify-center gap-4">
      <button
        type="button"
        onClick={() => ctx.onOpenBooking?.(undefined, ctx.serviceId)}
        className="bg-white text-primary hover:bg-slate-100 font-black px-8 py-4 rounded-2xl shadow-lg transition-all text-sm flex items-center gap-2"
      >
        <span>{ctx.bookingEnabled ? 'شروع رزرو نوبت آنلاین' : 'رزرو نوبت (تلفنی/حضوری)'}</span>
        <span className="material-symbols-outlined text-sm">calendar_month</span>
      </button>
      <a
        href={str(props.phoneHref, 'tel:02188776655')}
        className="border-2 border-white/40 text-white font-bold px-6 py-4 rounded-2xl hover:bg-white/10 transition-all text-sm flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-sm">call</span>
        <span>{str(props.phoneLabel)}</span>
      </a>
    </div>
  </section>
);

export const RichTextBlock: React.FC<{ props: Record<string, unknown> }> = ({ props }) => (
  <section
    className="prose prose-sm max-w-none bg-white dark:bg-surface-dim p-8 rounded-3xl border border-outline-variant/30 text-right"
    dangerouslySetInnerHTML={{ __html: str(props.html, '<p></p>') }}
  />
);

export const HtmlCodeBlock: React.FC<{ props: Record<string, unknown> }> = ({ props }) => {
  const html = str(props.html);
  const padded = props.padded !== false;
  const maxWidth = str(props.maxWidth, 'full');
  const widthClass =
    maxWidth === 'sm'
      ? 'max-w-xl mx-auto'
      : maxWidth === 'md'
        ? 'max-w-3xl mx-auto'
        : maxWidth === 'lg'
          ? 'max-w-5xl mx-auto'
          : 'w-full';

  if (!html.trim()) {
    return (
      <section className="rounded-[28px] border border-dashed border-outline-variant/40 py-10 text-center text-sm text-on-surface-variant">
        هنوز کد HTML وارد نشده است.
      </section>
    );
  }

  return (
    <section
      className={`html-code-block w-full min-w-0 overflow-x-auto ${widthClass} ${
        padded
          ? 'bg-white dark:bg-surface-dim p-4 md:p-6 rounded-3xl border border-outline-variant/30'
          : ''
      }`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export const PageHeroBlock: React.FC<{ props: Record<string, unknown>; ctx: BlockRenderContext }> = ({
  props,
  ctx,
}) => {
  const showBooking = props.showBooking !== false;
  const secondaryLabel = str(props.secondaryCtaLabel);
  const secondaryScreen = str(props.secondaryCtaScreen, 'services') as PageScreen;
  const image = str(props.heroImage);
  const imageMode = str(props.imageMode, image ? 'side' : 'none'); // none | side | background
  const overlayOpacity = typeof props.overlayOpacity === 'number' ? props.overlayOpacity : 45;

  const ctaRow = (showBooking || secondaryLabel) && (
    <div className="flex flex-wrap justify-center gap-3 pt-2">
      {showBooking && (
        <button
          type="button"
          onClick={() => ctx.onOpenBooking?.()}
          className="bg-primary hover:bg-primary-container text-white font-bold px-7 py-3.5 rounded-2xl text-sm shadow-lg"
        >
          {str(props.primaryCtaLabel, 'رزرو نوبت')}
        </button>
      )}
      {secondaryLabel && (
        <button
          type="button"
          onClick={() => ctx.onNavigate?.(secondaryScreen)}
          className="border border-outline-variant bg-white/90 dark:bg-surface-dim text-on-surface font-bold px-7 py-3.5 rounded-2xl text-sm"
        >
          {secondaryLabel}
        </button>
      )}
    </div>
  );

  const textBlock = (
    <div className="space-y-4 relative z-10">
      {str(props.badge) && (
        <span className="bg-primary/10 text-primary text-xs font-bold px-4 py-1.5 rounded-full inline-block">
          {str(props.badge)}
        </span>
      )}
      <h1 className="text-3xl md:text-5xl font-extrabold text-primary leading-tight">{str(props.title)}</h1>
      <p className="text-base text-on-surface-variant max-w-2xl mx-auto leading-relaxed">{str(props.subtitle)}</p>
      {ctaRow}
    </div>
  );

  if (imageMode === 'background' && image) {
    return (
      <section className="relative overflow-hidden rounded-[40px] min-h-[320px] md:min-h-[420px] flex items-center justify-center text-center p-8 md:p-14">
        <img
          src={image}
          alt={str(props.imageAlt, str(props.title))}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0 bg-slate-950"
          style={{ opacity: Math.min(90, Math.max(10, overlayOpacity)) / 100 }}
        />
        <div className="relative z-10 text-white [&_h1]:text-white [&_p]:text-white/85 [&_span]:bg-white/15 [&_span]:text-white">
          {textBlock}
        </div>
      </section>
    );
  }

  if (imageMode === 'side' && image) {
    return (
      <section className="bg-surface-container-low p-6 md:p-10 rounded-[40px] border border-outline-variant/30 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center overflow-hidden">
        <div className="lg:col-span-6 text-center lg:text-right space-y-4">{textBlock}</div>
        <div className="lg:col-span-6">
          <div className="rounded-[28px] overflow-hidden shadow-xl aspect-[4/3] border-4 border-white dark:border-surface-dim">
            <img
              src={image}
              alt={str(props.imageAlt, str(props.title))}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-surface-container-low p-8 md:p-14 rounded-[40px] border border-outline-variant/30 text-center space-y-4">
      {textBlock}
    </section>
  );
};

type HeroHeaderSlide = {
  image?: string;
  badge?: string;
  title?: string;
  description?: string;
  rating?: string;
  floatingBadge?: string;
  floatingIcon?: string;
};

type HeroHeaderDept = { icon?: string; label?: string; link?: string };
type HeroHeaderStat = { icon?: string; value?: string; label?: string };

const HERO_ACCENT: Record<string, { text: string; soft: string; border: string; gradient: string }> = {
  primary: {
    text: 'text-primary',
    soft: 'bg-primary/10 text-primary',
    border: 'border-primary',
    gradient: 'from-primary to-fuchsia-500',
  },
  rose: {
    text: 'text-rose-600',
    soft: 'bg-rose-500/10 text-rose-600',
    border: 'border-rose-500',
    gradient: 'from-rose-500 to-fuchsia-500',
  },
  fuchsia: {
    text: 'text-fuchsia-600',
    soft: 'bg-fuchsia-500/10 text-fuchsia-600',
    border: 'border-fuchsia-500',
    gradient: 'from-fuchsia-500 to-violet-500',
  },
  violet: {
    text: 'text-violet-600',
    soft: 'bg-violet-500/10 text-violet-600',
    border: 'border-violet-500',
    gradient: 'from-violet-500 to-fuchsia-500',
  },
  emerald: {
    text: 'text-emerald-700',
    soft: 'bg-emerald-500/10 text-emerald-700',
    border: 'border-emerald-600',
    gradient: 'from-emerald-500 to-teal-500',
  },
};

function renderHighlightedTitle(title: string, highlight: string, accentGradient: string, sizeClass: string) {
  if (!highlight || !title.includes(highlight)) {
    return <span className={sizeClass}>{title}</span>;
  }
  const parts = title.split(highlight);
  return (
    <span className={sizeClass}>
      {parts[0]}
      <span className={`bg-gradient-to-l ${accentGradient} bg-clip-text text-transparent`}>
        {highlight}
      </span>
      {parts.slice(1).join(highlight)}
    </span>
  );
}

export const HeroHeaderBlock: React.FC<{
  props: Record<string, unknown>;
  ctx: BlockRenderContext;
}> = ({ props, ctx }) => {
  const slides = arr<HeroHeaderSlide>(props.slides).filter((s) => str(s.image));
  const departments = arr<HeroHeaderDept>(props.departments);
  const stats = arr<HeroHeaderStat>(props.stats);
  const [slideIdx, setSlideIdx] = useState(0);
  const autoplay = props.carouselAutoplay !== false;
  const intervalMs = typeof props.carouselIntervalMs === 'number' ? props.carouselIntervalMs : 5000;
  const showCarousel = props.showCarousel !== false;
  const accent = HERO_ACCENT[str(props.accentColor, 'primary')] || HERO_ACCENT.primary;
  const mediaSide = str(props.mediaSide, 'start');
  const contentAlign = str(props.contentAlign, 'start');
  const titleSize = str(props.titleSize, 'lg');
  const padding = str(props.sectionPadding, 'md');
  const mediaRadius = Math.min(48, Math.max(12, Number(props.mediaRadius) || 32));
  const showStatus = props.showStatus !== false;
  const showCta = props.showCta !== false;
  const showDepartments = props.showDepartments !== false;
  const showStats = props.showStats !== false;
  const showRating = props.showRatingBadge !== false;
  const showFloating = props.showFloatingBadge !== false;
  const showDots = props.showCarouselDots !== false;
  const showArrows = props.showCarouselArrows !== false;

  /** Compact = stacked mobile/tablet layout (also respects page-builder device toolbar). */
  const previewDevice = useBuilderDevicePreview();
  const [isCompact, setIsCompact] = useState(true);

  useEffect(() => {
    if (previewDevice === 'mobile' || previewDevice === 'tablet') {
      setIsCompact(true);
      return;
    }
    if (previewDevice === 'desktop') {
      setIsCompact(false);
      return;
    }
    const apply = () => setIsCompact(window.innerWidth < 1024);
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, [previewDevice]);

  useEffect(() => {
    if (!autoplay || slides.length < 2) return;
    const t = window.setInterval(
      () => setSlideIdx((i) => (i + 1) % slides.length),
      Math.max(2500, intervalMs)
    );
    return () => window.clearInterval(t);
  }, [autoplay, intervalMs, slides.length]);

  useEffect(() => {
    if (slideIdx >= slides.length) setSlideIdx(0);
  }, [slides.length, slideIdx]);

  const titleSizeClass = isCompact
    ? titleSize === 'md'
      ? 'text-[1.15rem] leading-snug'
      : titleSize === 'xl'
        ? 'text-[1.35rem] leading-snug'
        : 'text-[1.25rem] leading-snug'
    : titleSize === 'md'
      ? 'text-3xl md:text-4xl tracking-tight leading-[1.25]'
      : titleSize === 'xl'
        ? 'text-4xl md:text-6xl tracking-tight leading-[1.2]'
        : 'text-4xl md:text-5xl tracking-tight leading-[1.25]';

  const padClass = isCompact
    ? padding === 'sm'
      ? 'py-3'
      : padding === 'lg'
        ? 'py-5'
        : 'py-4'
    : padding === 'sm'
      ? 'py-8'
      : padding === 'lg'
        ? 'py-20'
        : 'py-14';

  const alignClass =
    contentAlign === 'center' ? 'items-center text-center' : 'items-stretch text-right';

  const handleCta = () => {
    const action = str(props.ctaAction, 'booking');
    if (action === 'guide') {
      if (ctx.onOpenGuide) ctx.onOpenGuide();
      else ctx.onNavigate?.('team');
      return;
    }
    if (action === 'booking') {
      ctx.onOpenBooking?.(undefined, ctx.serviceId);
      return;
    }
    if (action === 'navigate') {
      ctx.onNavigate?.(str(props.ctaLink, 'services') as PageScreen);
    }
  };

  const ctaVariant = str(props.ctaVariant, 'outline');
  const ctaClass =
    ctaVariant === 'solid'
      ? `bg-primary text-white hover:bg-primary-container shadow-lg`
      : ctaVariant === 'soft'
        ? `${accent.soft} hover:opacity-90`
        : `bg-white dark:bg-surface-dim border-2 ${accent.border} ${accent.text} hover:bg-primary/5`;

  const current = slides[Math.min(slideIdx, Math.max(0, slides.length - 1))];
  const radius = isCompact ? Math.min(mediaRadius, 20) : mediaRadius;

  const mediaColumn = showCarousel && current && (
    <div className={`relative w-full min-w-0 ${isCompact ? '' : 'max-w-xl'}`}>
      <div
        className="relative overflow-hidden border border-outline-variant/20 bg-surface-container shadow-lg"
        style={{ borderRadius: radius }}
      >
        <div
          className={`relative w-full ${isCompact ? 'aspect-[16/11]' : 'aspect-[4/3]'}`}
        >
          {slides.map((slide, i) => (
            <img
              key={i}
              src={str(slide.image)}
              alt={str(slide.title, `اسلاید ${i + 1}`)}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                i === slideIdx ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
          {showRating && str(current.rating) && (
            <div
              className={`absolute top-2.5 right-2.5 bg-white/95 dark:bg-surface-dim backdrop-blur rounded-full shadow flex items-center gap-1 font-extrabold text-on-surface ${
                isCompact ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1.5 text-xs top-4 right-4'
              }`}
            >
              <span className="material-symbols-outlined text-amber-500 text-sm leading-none">star</span>
              <span>{str(current.rating)}</span>
            </div>
          )}
          {(str(current.badge) || str(current.title)) && (
            <div
              className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent ${
                isCompact ? 'px-3 py-3 pt-10 space-y-0.5' : 'p-5 pt-16 space-y-1.5'
              }`}
            >
              {str(current.badge) && (
                <span
                  className={`inline-flex font-bold text-white rounded-full bg-gradient-to-l ${accent.gradient} ${
                    isCompact ? 'text-[9px] px-2 py-0.5' : 'text-[10px] px-2.5 py-1'
                  }`}
                >
                  {str(current.badge)}
                </span>
              )}
              {str(current.title) && (
                <h3
                  className={`text-white font-black leading-snug line-clamp-2 ${
                    isCompact ? 'text-[11px]' : 'text-base'
                  }`}
                >
                  {str(current.title)}
                </h3>
              )}
              {!isCompact && str(current.description) && (
                <p className="text-white/80 text-xs leading-relaxed line-clamp-2">
                  {str(current.description)}
                </p>
              )}
            </div>
          )}
        </div>
        {showArrows && slides.length > 1 && (
          <>
            <button
              type="button"
              aria-label="قبلی"
              onClick={() => setSlideIdx((i) => (i - 1 + slides.length) % slides.length)}
              className={`absolute top-1/2 right-1.5 -translate-y-1/2 rounded-full bg-white/90 text-on-surface shadow flex items-center justify-center ${
                isCompact ? 'w-7 h-7' : 'w-9 h-9 right-2'
              }`}
            >
              <span className={`material-symbols-outlined ${isCompact ? 'text-base' : 'text-xl'}`}>
                chevron_right
              </span>
            </button>
            <button
              type="button"
              aria-label="بعدی"
              onClick={() => setSlideIdx((i) => (i + 1) % slides.length)}
              className={`absolute top-1/2 left-1.5 -translate-y-1/2 rounded-full bg-white/90 text-on-surface shadow flex items-center justify-center ${
                isCompact ? 'w-7 h-7' : 'w-9 h-9 left-2'
              }`}
            >
              <span className={`material-symbols-outlined ${isCompact ? 'text-base' : 'text-xl'}`}>
                chevron_left
              </span>
            </button>
          </>
        )}
      </div>

      {showFloating && str(current.floatingBadge) && !isCompact && (
        <div className="absolute -bottom-3 left-4 bg-white dark:bg-surface-dim border border-outline-variant/30 shadow-lg rounded-2xl px-3 py-2.5 flex items-center gap-2 z-10">
          <span className={`w-9 h-9 rounded-xl ${accent.soft} flex items-center justify-center`}>
            <span className="material-symbols-outlined text-xl">
              {str(current.floatingIcon, 'calendar_month')}
            </span>
          </span>
          <span className="text-[11px] font-extrabold text-on-surface whitespace-nowrap">
            {str(current.floatingBadge)}
          </span>
        </div>
      )}

      {showDots && slides.length > 1 && (
        <div className={`flex justify-center gap-1.5 ${isCompact ? 'mt-3' : 'mt-5'}`}>
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`اسلاید ${i + 1}`}
              onClick={() => setSlideIdx(i)}
              className={`rounded-full transition-all ${
                isCompact ? 'h-1.5' : 'h-2'
              } ${i === slideIdx ? (isCompact ? 'w-4 bg-primary' : 'w-6 bg-primary') : 'w-1.5 bg-outline-variant/50'}`}
            />
          ))}
        </div>
      )}

      {/* Mobile floating as inline chip under slider */}
      {showFloating && str(current.floatingBadge) && isCompact && (
        <div className="mt-2.5 inline-flex max-w-full items-center gap-1.5 rounded-full bg-white dark:bg-surface-dim border border-outline-variant/30 shadow-sm px-2.5 py-1.5">
          <span className={`w-6 h-6 rounded-full ${accent.soft} flex items-center justify-center shrink-0`}>
            <span className="material-symbols-outlined text-sm">
              {str(current.floatingIcon, 'calendar_month')}
            </span>
          </span>
          <span className="text-[10px] font-extrabold text-on-surface truncate">
            {str(current.floatingBadge)}
          </span>
        </div>
      )}
    </div>
  );

  const contentColumn = (
    <div
      className={`flex flex-col min-w-0 w-full ${alignClass} ${
        isCompact ? 'gap-2.5' : 'gap-6'
      }`}
    >
      {(str(props.badge) || (showStatus && str(props.statusText))) && (
        <div
          className={`inline-flex flex-wrap items-center gap-1.5 bg-white/95 dark:bg-surface-dim border border-outline-variant/25 shadow-sm rounded-full ${
            isCompact ? 'px-2 py-1' : 'px-3 py-1.5 gap-2'
          } ${contentAlign === 'center' ? 'mx-auto' : ''}`}
        >
          {str(props.badge) && (
            <span
              className={`font-bold text-on-surface leading-none ${
                isCompact ? 'text-[10px]' : 'text-xs'
              }`}
            >
              {str(props.badge)}
            </span>
          )}
          {showStatus && str(props.statusText) && (
            <span
              className={`inline-flex items-center gap-1 font-extrabold text-emerald-700 bg-emerald-50 rounded-full ${
                isCompact ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2.5 py-1'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {str(props.statusText)}
            </span>
          )}
        </div>
      )}

      <h1 className={`font-black text-on-surface ${titleSizeClass}`}>
        {renderHighlightedTitle(
          str(props.title),
          str(props.titleHighlight),
          accent.gradient,
          ''
        )}
      </h1>

      {str(props.subtitle) && (
        <p
          className={`text-on-surface-variant max-w-xl ${
            isCompact
              ? 'text-[11.5px] leading-6 opacity-90'
              : 'text-base leading-relaxed'
          } ${contentAlign === 'center' ? 'mx-auto' : ''}`}
        >
          {str(props.subtitle)}
        </p>
      )}

      {showCta && str(props.ctaLabel) && (
        (() => {
          const action = str(props.ctaAction, 'booking');
          const link = str(props.ctaLink).trim();
          const inner = (
            <>
              <span
                className={`rounded-full ${accent.soft} flex items-center justify-center shrink-0 ${
                  isCompact ? 'w-7 h-7' : 'w-10 h-10'
                }`}
              >
                <span
                  className={`material-symbols-outlined ${isCompact ? 'text-base' : 'text-xl'}`}
                >
                  {str(props.ctaIcon, 'psychology')}
                </span>
              </span>
              <span className={isCompact ? 'truncate' : ''}>{str(props.ctaLabel)}</span>
            </>
          );
          const cls = `inline-flex items-center justify-center font-extrabold rounded-full transition-all ${ctaClass} ${
            isCompact
              ? 'gap-2 text-[11px] px-3.5 py-2.5 w-full'
              : 'gap-3 text-sm px-5 py-3 w-auto'
          }`;
          if (action === 'link' && link) {
            const external = /^https?:\/\//i.test(link);
            return (
              <a
                href={link}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className={cls}
              >
                {inner}
              </a>
            );
          }
          return (
            <button type="button" onClick={handleCta} className={cls}>
              {inner}
            </button>
          );
        })()
      )}

      {showDepartments && departments.length > 0 && (
        <div className={`w-full ${isCompact ? 'space-y-1.5' : 'space-y-3'} ${contentAlign === 'center' ? 'items-center' : ''}`}>
          {str(props.departmentsTitle) && (
            <p
              className={`font-bold text-on-surface-variant ${
                isCompact ? 'text-[10px]' : 'text-xs'
              }`}
            >
              {str(props.departmentsTitle)}
            </p>
          )}
          <div
            className={`flex gap-1.5 ${
              isCompact
                ? 'overflow-x-auto pb-0.5 scrollbar-none -mx-0.5 px-0.5'
                : `flex-wrap ${contentAlign === 'center' ? 'justify-center' : 'justify-start'}`
            }`}
            style={isCompact ? { WebkitOverflowScrolling: 'touch' } : undefined}
          >
            {departments.map((dep, i) => {
              const label = str(dep.label);
              if (!label) return null;
              const chip = (
                <span
                  className={`inline-flex items-center gap-1 bg-white dark:bg-surface-dim border border-outline-variant/30 text-on-surface font-bold rounded-full shadow-sm shrink-0 ${
                    isCompact ? 'text-[10px] px-2 py-1' : 'text-[11px] px-3 py-2 gap-1.5'
                  }`}
                >
                  <span className={`material-symbols-outlined ${accent.text} ${isCompact ? 'text-sm' : 'text-base'}`}>
                    {str(dep.icon, 'circle')}
                  </span>
                  {label}
                </span>
              );
              const depLink = str(dep.link).trim();
              if (depLink) {
                return (
                  <a key={i} href={depLink} className="inline-flex shrink-0">
                    {chip}
                  </a>
                );
              }
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => ctx.onNavigate?.('services')}
                  className="inline-flex shrink-0"
                >
                  {chip}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <section className={`w-full min-w-0 overflow-x-clip ${padClass}`} data-hero-compact={isCompact ? '1' : '0'}>
      {isCompact ? (
        <div className="flex flex-col gap-4 w-full">
          {mediaColumn}
          {contentColumn}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-12 items-center w-full">
          {mediaSide === 'end' ? (
            <>
              {contentColumn}
              {mediaColumn}
            </>
          ) : (
            <>
              {mediaColumn}
              {contentColumn}
            </>
          )}
        </div>
      )}

      {showStats && stats.length > 0 && (
        <div
          className={`mt-5 ${
            isCompact
              ? 'flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-0.5 px-0.5'
              : 'grid grid-cols-3 gap-4 mt-14'
          }`}
          style={isCompact ? { WebkitOverflowScrolling: 'touch' } : undefined}
        >
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`flex items-center bg-white dark:bg-surface-dim border border-outline-variant/25 shadow-soft ${
                isCompact
                  ? 'gap-2 rounded-xl p-2.5 shrink-0 min-w-[148px]'
                  : 'gap-3 rounded-2xl p-4'
              }`}
            >
              <span
                className={`${accent.soft} flex items-center justify-center shrink-0 ${
                  isCompact ? 'w-8 h-8 rounded-lg' : 'w-11 h-11 rounded-xl'
                }`}
              >
                <span className={`material-symbols-outlined ${isCompact ? 'text-lg' : 'text-2xl'}`}>
                  {str(stat.icon, 'analytics')}
                </span>
              </span>
              <div className="min-w-0">
                <p className={`font-black text-on-surface leading-none ${isCompact ? 'text-sm' : 'text-lg'}`}>
                  {str(stat.value)}
                </p>
                <p
                  className={`text-on-surface-variant font-bold mt-0.5 ${
                    isCompact ? 'text-[9px]' : 'text-[11px] mt-1'
                  }`}
                >
                  {str(stat.label)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

function toVideoEmbed(url: string): { kind: 'iframe' | 'file'; src: string } | null {
  const raw = url.trim();
  if (!raw) return null;
  const yt =
    raw.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{6,})/) ||
    raw.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/);
  if (yt?.[1]) return { kind: 'iframe', src: `https://www.youtube.com/embed/${yt[1]}` };
  const aparat = raw.match(/aparat\.com\/v\/([A-Za-z0-9_-]+)/i);
  if (aparat?.[1]) return { kind: 'iframe', src: `https://www.aparat.com/video/video/embed/videohash/${aparat[1]}/vt/frame` };
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(raw) || raw.startsWith('/uploads/') || raw.startsWith('blob:')) {
    return { kind: 'file', src: raw };
  }
  if (raw.includes('youtube.com/embed/') || raw.includes('aparat.com/video/video/embed')) {
    return { kind: 'iframe', src: raw };
  }
  return { kind: 'file', src: raw };
}

export const ImageCarouselBlock: React.FC<{ props: Record<string, unknown> }> = ({ props }) => {
  const slides = arr<{ image: string; caption?: string }>(props.slides).filter((s) => s.image);
  const [index, setIndex] = useState(0);
  const autoplay = props.autoplay !== false;
  const intervalMs = typeof props.intervalMs === 'number' ? props.intervalMs : 4500;
  const showDots = props.showDots !== false;
  const showArrows = props.showArrows !== false;
  const aspect = str(props.aspect, 'video'); // video | wide | square

  useEffect(() => {
    if (!autoplay || slides.length < 2) return;
    const t = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), Math.max(2000, intervalMs));
    return () => window.clearInterval(t);
  }, [autoplay, intervalMs, slides.length]);

  if (!slides.length) {
    return (
      <section className="rounded-3xl border border-dashed border-outline-variant/40 py-16 text-center text-sm text-on-surface-variant">
        هنوز اسلایدی برای کروسل تعریف نشده است.
      </section>
    );
  }

  const aspectClass =
    aspect === 'square' ? 'aspect-square' : aspect === 'wide' ? 'aspect-[21/9]' : 'aspect-video';
  const current = slides[Math.min(index, slides.length - 1)];

  return (
    <section className="relative rounded-[28px] overflow-hidden border border-outline-variant/30 shadow-soft bg-black/5">
      <div className={`relative w-full ${aspectClass}`}>
        <img
          src={current.image}
          alt={current.caption || `اسلاید ${index + 1}`}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
        />
        {current.caption && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-5 pt-12">
            <p className="text-white text-sm font-bold">{current.caption}</p>
          </div>
        )}
      </div>
      {showArrows && slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="قبلی"
            onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
            className="absolute top-1/2 right-3 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-on-surface shadow flex items-center justify-center"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
          <button
            type="button"
            aria-label="بعدی"
            onClick={() => setIndex((i) => (i + 1) % slides.length)}
            className="absolute top-1/2 left-3 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-on-surface shadow flex items-center justify-center"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
        </>
      )}
      {showDots && slides.length > 1 && (
        <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`اسلاید ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export const VideoPlayerBlock: React.FC<{ props: Record<string, unknown> }> = ({ props }) => {
  const title = str(props.title);
  const videoUrl = str(props.videoUrl);
  const poster = str(props.posterImage);
  const embed = toVideoEmbed(videoUrl);
  const aspect = str(props.aspect, 'video');
  const aspectClass =
    aspect === 'square' ? 'aspect-square' : aspect === 'wide' ? 'aspect-[21/9]' : 'aspect-video';
  const controls = props.controls !== false;
  const autoplay = props.autoplay === true;
  const muted = props.muted !== false;

  return (
    <section className="space-y-3">
      {title && <h2 className="text-xl font-black text-on-surface text-center">{title}</h2>}
      <div className={`relative w-full ${aspectClass} rounded-[28px] overflow-hidden border border-outline-variant/30 bg-slate-900 shadow-soft`}>
        {!embed ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/70 text-sm">
            <span className="material-symbols-outlined text-4xl">smart_display</span>
            <span>آدرس ویدئو را در تنظیمات وارد کنید</span>
          </div>
        ) : embed.kind === 'iframe' ? (
          <iframe
            src={`${embed.src}${autoplay ? (embed.src.includes('?') ? '&' : '?') + 'autoplay=1&mute=1' : ''}`}
            title={title || 'ویدئو'}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src={embed.src}
            poster={poster || undefined}
            controls={controls}
            autoPlay={autoplay}
            muted={muted || autoplay}
            playsInline
          />
        )}
      </div>
    </section>
  );
};

function DividerLineSegment({
  color,
  thickness,
  lineStyle,
  fadeEnds,
  vertical,
}: {
  color: string;
  thickness: number;
  lineStyle: DividerLineStyle;
  fadeEnds: boolean;
  vertical?: boolean;
}) {
  const soft = lineStyle === 'soft' || fadeEnds;
  if (soft) {
    const axis = vertical ? 'to bottom' : 'to left';
    return (
      <div
        className="flex-1 min-w-0 min-h-0 self-stretch"
        style={{
          [vertical ? 'width' : 'height']: thickness,
          [vertical ? 'minHeight' : 'minWidth']: 8,
          background: `linear-gradient(${axis}, transparent 0%, ${color} 22%, ${color} 78%, transparent 100%)`,
          borderRadius: thickness,
        }}
        aria-hidden
      />
    );
  }

  const borderSide = vertical ? 'borderLeft' : 'borderTop';
  // Double needs enough thickness to render both strokes
  const effective =
    lineStyle === 'double' ? Math.max(thickness, 3) : thickness;

  return (
    <div
      className="flex-1 min-w-0 min-h-0 self-stretch"
      style={{
        [vertical ? 'minHeight' : 'minWidth']: 8,
        height: vertical ? undefined : 0,
        width: vertical ? 0 : undefined,
        [borderSide]: `${effective}px ${cssBorderStyle(lineStyle)} ${color}`,
      }}
      aria-hidden
    />
  );
}

function DividerEndCapNode({
  cap,
  color,
  thickness,
}: {
  cap: DividerEndCap;
  color: string;
  thickness: number;
}) {
  if (cap === 'none') return null;
  const size = Math.max(6, thickness + 4);
  if (cap === 'dot') {
    return (
      <span
        className="shrink-0 rounded-full"
        style={{ width: size, height: size, background: color }}
        aria-hidden
      />
    );
  }
  if (cap === 'bar') {
    return (
      <span
        className="shrink-0 rounded-sm"
        style={{
          width: Math.max(3, Math.round(thickness * 0.7)),
          height: Math.max(10, thickness * 3),
          background: color,
        }}
        aria-hidden
      />
    );
  }
  // diamond
  return (
    <span
      className="shrink-0 rotate-45"
      style={{ width: size * 0.7, height: size * 0.7, background: color }}
      aria-hidden
    />
  );
}

export const DividerBlock: React.FC<{ props: Record<string, unknown> }> = ({ props }) => {
  const widthMode = str(props.widthMode, 'full') as DividerWidthMode;
  const thickness = resolveDividerThickness(props.thickness);
  const lineStyle = str(props.lineStyle, 'solid') as DividerLineStyle;
  const colorKey = str(props.color, 'outline');
  const color = resolveDividerColor(colorKey, str(props.customColor));
  const align = str(props.align, 'center');
  const orientation = str(props.orientation, 'horizontal');
  const spacing = str(props.spacing, 'md');
  const contentMode = str(props.contentMode, 'none') as DividerContentMode;
  const text = str(props.text);
  const icon = str(props.icon, 'auto_awesome');
  const iconFilled = props.iconFilled === true;
  const iconSize = Math.min(48, Math.max(12, Number(props.iconSize) || 18));
  const placement = str(props.contentPlacement, 'center') as DividerContentPlacement;
  const contentGap = Math.min(48, Math.max(4, Number(props.contentGap) || 12));
  const textSize = str(props.textSize, 'sm');
  const textWeight = str(props.textWeight, 'bold');
  const textColorKey = str(props.textColor, 'muted');
  const textCustom = str(props.textCustomColor);
  const labelSurface = str(props.labelSurface, 'auto');
  const fadeEnds = props.fadeEnds === true;
  const endCap = str(props.endCap, 'none') as DividerEndCap;
  const vertical = orientation === 'vertical';

  const showIcon = contentMode === 'icon' || contentMode === 'iconText';
  const showText = (contentMode === 'text' || contentMode === 'iconText') && Boolean(text);
  const hasContent = showIcon || showText;

  const width = resolveDividerWidth(
    widthMode,
    Number(props.widthPercent) || 100,
    Number(props.widthPx) || 280
  );

  const justify =
    align === 'start' ? 'justify-start' : align === 'end' ? 'justify-end' : 'justify-center';

  const textClass = [
    dividerTextSizeClass(textSize),
    dividerTextWeightClass(textWeight),
    textColorKey === 'custom' ? '' : DIVIDER_TEXT_COLOR_CLASS[textColorKey] || DIVIDER_TEXT_COLOR_CLASS.muted,
  ]
    .filter(Boolean)
    .join(' ');

  const surfaceClass =
    labelSurface === 'transparent'
      ? 'bg-transparent'
      : labelSurface === 'white'
        ? 'bg-white dark:bg-surface-dim'
        : 'bg-background';

  const label = hasContent ? (
    <span
      className={`inline-flex items-center shrink-0 max-w-full ${surfaceClass} ${
        placement === 'center' || placement === 'start' || placement === 'end'
          ? 'px-2.5 py-0.5 rounded-full'
          : ''
      }`}
      style={{ gap: Math.max(4, Math.round(contentGap / 2)) }}
    >
      {showIcon && (
        <span
          className="material-symbols-outlined leading-none"
          style={{
            fontSize: iconSize,
            color: textColorKey === 'custom' && textCustom ? textCustom : color,
            fontVariationSettings: iconFilled
              ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
              : undefined,
          }}
        >
          {icon}
        </span>
      )}
      {showText && (
        <span
          className={`${textClass} truncate`}
          style={textColorKey === 'custom' && textCustom ? { color: textCustom } : undefined}
        >
          {text}
        </span>
      )}
    </span>
  ) : null;

  const buildInline = (mode: 'none' | 'start' | 'center' | 'end') => (
    <div
      className={`flex items-center w-full min-w-0 ${vertical ? 'flex-col h-full' : 'flex-row'}`}
      style={{ gap: mode === 'none' ? 0 : contentGap }}
    >
      <DividerEndCapNode cap={endCap} color={color} thickness={thickness} />
      {mode === 'start' && label}
      {(mode === 'none' || mode === 'center' || mode === 'end') && (
        <DividerLineSegment
          color={color}
          thickness={thickness}
          lineStyle={lineStyle}
          fadeEnds={fadeEnds}
          vertical={vertical}
        />
      )}
      {mode === 'center' && label}
      {(mode === 'center' || mode === 'start') && (
        <DividerLineSegment
          color={color}
          thickness={thickness}
          lineStyle={lineStyle}
          fadeEnds={fadeEnds}
          vertical={vertical}
        />
      )}
      {mode === 'end' && label}
      <DividerEndCapNode cap={endCap} color={color} thickness={thickness} />
    </div>
  );

  let body: React.ReactNode;
  if (!hasContent) {
    body = buildInline('none');
  } else if (placement === 'above') {
    body = (
      <div
        className={`flex flex-col w-full ${
          align === 'start' ? 'items-start' : align === 'end' ? 'items-end' : 'items-center'
        }`}
        style={{ gap: contentGap }}
      >
        {label}
        {buildInline('none')}
      </div>
    );
  } else if (placement === 'below') {
    body = (
      <div
        className={`flex flex-col w-full ${
          align === 'start' ? 'items-start' : align === 'end' ? 'items-end' : 'items-center'
        }`}
        style={{ gap: contentGap }}
      >
        {buildInline('none')}
        {label}
      </div>
    );
  } else {
    body = buildInline(placement);
  }

  return (
    <section
      className={`w-full min-w-0 flex ${justify} ${dividerSpacingClass(spacing)}`}
      role="separator"
      aria-orientation={vertical ? 'vertical' : 'horizontal'}
      aria-label={showText ? text : 'جداکننده'}
    >
      <div
        className={vertical ? 'flex flex-col items-center' : 'w-full'}
        style={
          vertical
            ? { height: widthMode === 'full' ? 160 : width, width: 'auto' }
            : { width, maxWidth: '100%' }
        }
      >
        {body}
      </div>
    </section>
  );
};

export const SpacerBlock: React.FC<{
  props: Record<string, unknown>;
  previewMode?: boolean;
}> = ({ props, previewMode }) => {
  const showGuide = props.showGuide !== false;
  const responsive = props.responsive === true;
  const previewDevice = useBuilderDevicePreview();
  const [viewportBand, setViewportBand] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    if (previewDevice === 'mobile') {
      setViewportBand('mobile');
      return;
    }
    if (previewDevice === 'tablet') {
      setViewportBand('tablet');
      return;
    }
    if (previewDevice === 'desktop') {
      setViewportBand('desktop');
      return;
    }
    const apply = () => {
      const w = window.innerWidth;
      if (w < 768) setViewportBand('mobile');
      else if (w < 1024) setViewportBand('tablet');
      else setViewportBand('desktop');
    };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, [previewDevice]);

  let top: number;
  let bottom: number;

  if (responsive) {
    const key =
      viewportBand === 'mobile'
        ? 'heightMobile'
        : viewportBand === 'tablet'
          ? 'heightTablet'
          : 'heightDesktop';
    const sides = resolveSpacerSides(props);
    const fallback = Math.round((sides.top + sides.bottom) / 2) || 32;
    const side = clampSpacerPx(Number(props[key]) > 0 ? Number(props[key]) : fallback);
    top = side;
    bottom = side;
  } else {
    const sides = resolveSpacerSides(props);
    top = sides.top;
    bottom = sides.bottom;
  }

  const total = top + bottom;
  const inBuilder = Boolean(previewMode);

  return (
    <div
      className={`w-full min-w-0 box-border ${
        inBuilder && showGuide
          ? 'relative border border-dashed border-primary/35 bg-primary/[0.04] rounded-lg'
          : ''
      }`}
      style={{ paddingTop: top, paddingBottom: bottom }}
      aria-hidden={!inBuilder}
      role={inBuilder ? 'presentation' : undefined}
      data-spacer={`${top}+${bottom}`}
    >
      {inBuilder && showGuide && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary/80 bg-background/90 px-2 py-0.5 rounded-full border border-primary/20">
            <span className="material-symbols-outlined text-sm">space_bar</span>
            فاصله {total}px
          </span>
        </div>
      )}
    </div>
  );
};

type GalleryImageItem = {
  image?: string;
  alt?: string;
  caption?: string;
  subtitle?: string;
  linkUrl?: string;
};

export const SingleImageBlock: React.FC<{ props: Record<string, unknown> }> = ({ props }) => {
  const image = str(props.image);
  const alt = str(props.alt) || str(props.caption) || 'تصویر';
  const caption = str(props.caption);
  const subtitle = str(props.subtitle);
  const widthMode = str(props.widthMode, 'full');
  const aspect = str(props.aspect, 'auto');
  const objectFit = str(props.objectFit, 'cover') === 'contain' ? 'object-contain' : 'object-cover';
  const radius = clampRadius(props.borderRadius);
  const align = str(props.align, 'center');
  const shadow = props.shadow !== false;
  const captionPosition = str(props.captionPosition, 'below');
  const clickBehavior = str(props.clickBehavior, 'lightbox');
  const linkUrl = str(props.linkUrl).trim();
  const openInNewTab = props.openInNewTab !== false;
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const justify =
    align === 'start' ? 'justify-start' : align === 'end' ? 'justify-end' : 'justify-center';
  const width = resolveImageWidth(
    widthMode,
    Number(props.widthPercent) || 100,
    Number(props.widthPx) || 640
  );
  const aspectCls = imageAspectClass(aspect);
  const fixedAspect = Boolean(aspectCls) || aspect === 'original';

  if (!image) {
    return (
      <section className="rounded-2xl border border-dashed border-outline-variant/40 py-12 text-center text-sm text-on-surface-variant">
        تصویری انتخاب نشده است.
      </section>
    );
  }

  const openLightbox = () => setLightboxOpen(true);

  const frame = (
    <div
      className={`relative overflow-hidden bg-surface-container ${
        shadow ? 'shadow-soft border border-outline-variant/25' : ''
      } ${fixedAspect && aspectCls ? aspectCls : ''} ${
        clickBehavior !== 'none' ? 'cursor-zoom-in group' : ''
      }`}
      style={{ borderRadius: radius }}
    >
      <img
        src={image}
        alt={alt}
        className={`w-full ${
          fixedAspect && aspectCls
            ? `absolute inset-0 h-full ${objectFit}`
            : aspect === 'original'
              ? 'h-auto object-contain'
              : `h-auto ${objectFit}`
        } transition-transform duration-500 ${
          clickBehavior !== 'none' ? 'group-hover:scale-[1.02]' : ''
        }`}
      />
      {captionPosition === 'overlay' && (caption || subtitle) && (
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-3.5 py-3.5 pt-10 space-y-0.5 pointer-events-none">
          {caption && <p className="text-white text-sm font-bold">{caption}</p>}
          {subtitle && <p className="text-white/80 text-xs leading-relaxed">{subtitle}</p>}
        </div>
      )}
      {clickBehavior === 'lightbox' && (
        <span className="absolute top-2.5 left-2.5 w-8 h-8 rounded-full bg-black/45 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <span className="material-symbols-outlined text-lg">zoom_in</span>
        </span>
      )}
    </div>
  );

  let media: React.ReactNode = frame;
  if (clickBehavior === 'lightbox') {
    media = (
      <button type="button" onClick={openLightbox} className="block w-full text-right">
        {frame}
      </button>
    );
  } else if (clickBehavior === 'link' && linkUrl) {
    const external = /^https?:\/\//i.test(linkUrl);
    media = (
      <a
        href={linkUrl}
        className="block w-full"
        {...(openInNewTab || external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {frame}
      </a>
    );
  }

  return (
    <section className={`w-full min-w-0 flex ${justify}`}>
      <figure className="min-w-0 space-y-2" style={{ width, maxWidth: '100%' }}>
        {media}
        {captionPosition === 'below' && (caption || subtitle) && (
          <figcaption className="space-y-0.5 px-0.5">
            {caption && <p className="text-sm font-bold text-on-surface">{caption}</p>}
            {subtitle && (
              <p className="text-xs text-on-surface-variant leading-relaxed">{subtitle}</p>
            )}
          </figcaption>
        )}
      </figure>
      <ImageLightbox
        open={lightboxOpen}
        index={0}
        items={[{ src: image, alt, caption, subtitle }]}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={() => undefined}
      />
    </section>
  );
};

export const ImageGalleryBlock: React.FC<{ props: Record<string, unknown> }> = ({ props }) => {
  const items = arr<GalleryImageItem>(props.items).filter((it) => str(it.image));
  const title = str(props.title);
  const sectionSubtitle = str(props.subtitle);
  const aspect = str(props.aspect, 'square');
  const objectFit = str(props.objectFit, 'cover') === 'contain' ? 'object-contain' : 'object-cover';
  const radius = clampRadius(props.borderRadius);
  const captionPosition = str(props.captionPosition, 'below');
  const clickBehavior = str(props.clickBehavior, 'lightbox');
  const gap = str(props.gap, 'md');
  const gapClass = gap === 'sm' ? 'gap-2' : gap === 'lg' ? 'gap-5' : 'gap-3.5';
  const aspectCls = imageAspectClass(aspect === 'auto' ? '' : aspect) || (aspect === 'auto' ? '' : 'aspect-square');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const lightboxItems: LightboxItem[] = items.map((it) => ({
    src: str(it.image),
    alt: str(it.alt) || str(it.caption),
    caption: str(it.caption),
    subtitle: str(it.subtitle),
  }));

  if (!items.length) {
    return (
      <section className="rounded-2xl border border-dashed border-outline-variant/40 py-12 text-center text-sm text-on-surface-variant">
        هنوز تصویری برای گالری تعریف نشده است.
      </section>
    );
  }

  return (
    <section className="w-full min-w-0 space-y-5">
      {(title || sectionSubtitle) && (
        <div className="text-center space-y-1.5 max-w-2xl mx-auto">
          {title && <h2 className="text-xl md:text-2xl font-black text-on-surface">{title}</h2>}
          {sectionSubtitle && (
            <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed">
              {sectionSubtitle}
            </p>
          )}
        </div>
      )}

      <ResponsiveGrid
        columnsMobile={props.columnsMobile}
        columnsTablet={props.columnsTablet}
        columnsDesktop={props.columnsDesktop}
        fallbacks={{ mobile: 1, tablet: 2, desktop: 3 }}
        className={gapClass}
      >
        {items.map((item, idx) => {
          const src = str(item.image);
          const cap = str(item.caption);
          const sub = str(item.subtitle);
          const alt = str(item.alt) || cap || `تصویر ${idx + 1}`;
          const itemLink = str(item.linkUrl).trim();

          const tile = (
            <div
              className={`relative overflow-hidden bg-surface-container border border-outline-variant/20 shadow-soft ${
                aspectCls || ''
              } ${clickBehavior !== 'none' ? 'group cursor-zoom-in' : ''}`}
              style={{ borderRadius: radius }}
            >
              <img
                src={src}
                alt={alt}
                className={`${
                  aspectCls ? `absolute inset-0 w-full h-full ${objectFit}` : `w-full h-auto ${objectFit}`
                } transition-transform duration-500 ${
                  clickBehavior !== 'none' ? 'group-hover:scale-[1.03]' : ''
                }`}
              />
              {captionPosition === 'overlay' && (cap || sub) && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-3 py-3 pt-8 space-y-0.5 pointer-events-none">
                  {cap && <p className="text-white text-xs font-bold line-clamp-2">{cap}</p>}
                  {sub && <p className="text-white/75 text-[10px] line-clamp-2">{sub}</p>}
                </div>
              )}
              {clickBehavior === 'lightbox' && (
                <span className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <span className="material-symbols-outlined text-base">zoom_in</span>
                </span>
              )}
            </div>
          );

          let media: React.ReactNode = tile;
          if (clickBehavior === 'lightbox') {
            media = (
              <button
                type="button"
                className="block w-full text-right"
                onClick={() => {
                  setLightboxIndex(idx);
                  setLightboxOpen(true);
                }}
              >
                {tile}
              </button>
            );
          } else if (clickBehavior === 'link' && itemLink) {
            const external = /^https?:\/\//i.test(itemLink);
            media = (
              <a
                href={itemLink}
                className="block w-full"
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {tile}
              </a>
            );
          }

          return (
            <figure key={idx} className="min-w-0 space-y-1.5">
              {media}
              {captionPosition === 'below' && (cap || sub) && (
                <figcaption className="space-y-0.5 px-0.5">
                  {cap && <p className="text-xs font-bold text-on-surface">{cap}</p>}
                  {sub && <p className="text-[11px] text-on-surface-variant leading-relaxed">{sub}</p>}
                </figcaption>
              )}
            </figure>
          );
        })}
      </ResponsiveGrid>

      <ImageLightbox
        open={lightboxOpen}
        index={lightboxIndex}
        items={lightboxItems}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={setLightboxIndex}
      />
    </section>
  );
};

const ICON_COLOR_CLASS: Record<string, string> = {
  primary: 'text-primary',
  onSurface: 'text-on-surface',
  muted: 'text-on-surface-variant',
  emerald: 'text-emerald-600',
  rose: 'text-rose-500',
  amber: 'text-amber-600',
};

export const IconBlock: React.FC<{ props: Record<string, unknown> }> = ({ props }) => {
  const icon = str(props.icon, 'psychology');
  const label = str(props.label);
  const size = Math.min(160, Math.max(16, Number(props.size) || 48));
  const color = str(props.color, 'primary');
  const align = str(props.align, 'center');
  const filled = props.filled === true;
  const linkTarget = str(props.linkTarget);
  const colorClass = ICON_COLOR_CLASS[color] || ICON_COLOR_CLASS.primary;
  const alignClass =
    align === 'start' ? 'items-start text-right' : align === 'end' ? 'items-end text-left' : 'items-center text-center';

  const content = (
    <>
      <span
        className={`material-symbols-outlined ${colorClass} leading-none`}
        style={{
          fontSize: size,
          fontVariationSettings: filled ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48" : undefined,
        }}
      >
        {icon}
      </span>
      {label && <span className="text-sm font-bold text-on-surface">{label}</span>}
    </>
  );

  if (linkTarget) {
    const isExternal = /^https?:\/\//i.test(linkTarget);
    return (
      <section className={`flex flex-col gap-2 ${alignClass}`}>
        <a
          href={linkTarget}
          {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className={`inline-flex flex-col gap-2 ${alignClass} hover:opacity-80 transition-opacity`}
        >
          {content}
        </a>
      </section>
    );
  }

  return <section className={`flex flex-col gap-2 ${alignClass}`}>{content}</section>;
};

type IconListItem = { icon?: string; text?: string; link?: string };

export const IconListBlock: React.FC<{ props: Record<string, unknown> }> = ({ props }) => {
  const items = arr<IconListItem>(props.items);
  const iconSize = Math.min(64, Math.max(16, Number(props.iconSize) || 28));
  const color = str(props.color, 'primary');
  const filled = props.filled === true;
  const gap = str(props.gap, 'md');
  const colorClass = ICON_COLOR_CLASS[color] || ICON_COLOR_CLASS.primary;
  const gapClass = gap === 'sm' ? 'gap-2.5' : gap === 'lg' ? 'gap-5' : 'gap-3.5';

  if (!items.length) {
    return (
      <section className="rounded-2xl border border-dashed border-outline-variant/40 p-6 text-center text-xs text-on-surface-variant">
        آیتمی برای لیست آیکون تعریف نشده است.
      </section>
    );
  }

  return (
    <section className={`flex flex-col ${gapClass}`}>
      {items.map((item, idx) => {
        const icon = str(item.icon, 'check_circle');
        const text = str(item.text);
        const link = str(item.link).trim();
        const row = (
          <>
            <span
              className={`material-symbols-outlined ${colorClass} shrink-0 leading-none`}
              style={{
                fontSize: iconSize,
                fontVariationSettings: filled
                  ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48"
                  : undefined,
              }}
              aria-hidden
            >
              {icon}
            </span>
            {text && (
              <span className="flex-1 min-w-0 text-sm md:text-[15px] font-medium text-on-surface leading-relaxed">
                {text}
              </span>
            )}
          </>
        );

        const rowClass =
          'flex items-start gap-3 w-full text-right transition-opacity';

        if (link) {
          const isExternal = /^https?:\/\//i.test(link);
          return (
            <a
              key={idx}
              href={link}
              {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className={`${rowClass} hover:opacity-80`}
            >
              {row}
            </a>
          );
        }

        return (
          <div key={idx} className={rowClass}>
            {row}
          </div>
        );
      })}
    </section>
  );
};

const BUTTON_COLOR_SOLID: Record<string, string> = {
  primary: 'bg-primary hover:bg-primary-container text-white shadow-lg shadow-primary/20',
  secondary: 'bg-secondary hover:opacity-90 text-white shadow-lg shadow-secondary/20',
  emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20',
  rose: 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20',
  amber: 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20',
  slate: 'bg-slate-800 hover:bg-slate-900 text-white shadow-lg shadow-slate-800/20',
};

const BUTTON_COLOR_OUTLINE: Record<string, string> = {
  primary: 'border-2 border-primary text-primary hover:bg-primary/10',
  secondary: 'border-2 border-secondary text-secondary hover:bg-secondary/10',
  emerald: 'border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50',
  rose: 'border-2 border-rose-500 text-rose-600 hover:bg-rose-50',
  amber: 'border-2 border-amber-500 text-amber-700 hover:bg-amber-50',
  slate: 'border-2 border-slate-500 text-slate-700 hover:bg-slate-50',
};

const BUTTON_COLOR_SOFT: Record<string, string> = {
  primary: 'bg-primary/10 text-primary hover:bg-primary/15',
  secondary: 'bg-secondary/10 text-secondary hover:bg-secondary/15',
  emerald: 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15',
  rose: 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/15',
  amber: 'bg-amber-500/10 text-amber-700 hover:bg-amber-500/15',
  slate: 'bg-slate-500/10 text-slate-700 hover:bg-slate-500/15',
};

export const ButtonBlock: React.FC<{
  props: Record<string, unknown>;
  ctx: BlockRenderContext;
}> = ({ props, ctx }) => {
  const label = str(props.label, 'دکمه');
  const icon = str(props.icon, 'arrow_back');
  const showIcon = props.showIcon !== false && Boolean(icon);
  const iconPosition = str(props.iconPosition, 'start');
  const color = str(props.color, 'primary');
  const variant = str(props.variant, 'solid');
  const size = str(props.size, 'md');
  const align = str(props.align, 'center');
  const fullWidth = props.fullWidth === true;
  const action = str(props.action, 'link');
  const link = str(props.link).trim();

  const sizeClass =
    size === 'sm'
      ? 'text-xs px-4 py-2 rounded-xl gap-1.5'
      : size === 'lg'
        ? 'text-base px-8 py-4 rounded-2xl gap-2.5'
        : 'text-sm px-6 py-3 rounded-2xl gap-2';

  const iconSizeClass = size === 'sm' ? 'text-[16px]' : size === 'lg' ? 'text-[22px]' : 'text-[18px]';

  const colorMap =
    variant === 'outline'
      ? BUTTON_COLOR_OUTLINE
      : variant === 'soft'
        ? BUTTON_COLOR_SOFT
        : BUTTON_COLOR_SOLID;
  const colorClass = colorMap[color] || colorMap.primary;

  const alignClass =
    align === 'start' ? 'justify-start' : align === 'end' ? 'justify-end' : 'justify-center';

  const btnClass = `inline-flex items-center justify-center font-extrabold transition-all ${sizeClass} ${colorClass} ${
    fullWidth ? 'w-full' : ''
  }`;

  const iconEl = showIcon ? (
    <span className={`material-symbols-outlined ${iconSizeClass} leading-none`}>{icon}</span>
  ) : null;

  const content = (
    <>
      {iconPosition !== 'end' && iconEl}
      <span>{label}</span>
      {iconPosition === 'end' && iconEl}
    </>
  );

  const handleBooking = (e: React.MouseEvent) => {
    e.preventDefault();
    ctx.onOpenBooking?.(undefined, ctx.serviceId);
  };

  let control: React.ReactNode;
  if (action === 'booking') {
    control = (
      <button type="button" onClick={handleBooking} className={btnClass}>
        {content}
      </button>
    );
  } else if (action === 'link' && link) {
    const isExternal = /^https?:\/\//i.test(link);
    control = (
      <a
        href={link}
        {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className={btnClass}
      >
        {content}
      </a>
    );
  } else {
    control = (
      <button type="button" className={btnClass}>
        {content}
      </button>
    );
  }

  return (
    <section className={`flex w-full ${alignClass}`}>
      {fullWidth ? <div className="w-full">{control}</div> : control}
    </section>
  );
};

function buildGoogleMapEmbedSrc(props: Record<string, unknown>): string | null {
  const mode = str(props.mode, 'coords');
  const zoom = Math.min(21, Math.max(1, Number(props.zoom) || 15));
  if (mode === 'address') {
    const address = str(props.address).trim();
    if (!address) return null;
    return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=${zoom}&output=embed`;
  }
  const lat = Number(props.lat);
  const lng = Number(props.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
}

export const GoogleMapBlock: React.FC<{ props: Record<string, unknown> }> = ({ props }) => {
  const src = buildGoogleMapEmbedSrc(props);
  const height = Math.min(800, Math.max(160, Number(props.height) || 360));
  const radius = Math.min(48, Math.max(0, Number(props.borderRadius) || 24));
  const title =
    str(props.mode, 'coords') === 'address'
      ? str(props.address, 'نقشه')
      : `موقعیت ${Number(props.lat)}, ${Number(props.lng)}`;

  return (
    <section className="w-full overflow-hidden border border-outline-variant/30 shadow-soft bg-surface-container-low" style={{ borderRadius: radius }}>
      {src ? (
        <iframe
          title={title}
          src={src}
          width="100%"
          height={height}
          style={{ border: 0, display: 'block' }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      ) : (
        <div
          className="flex flex-col items-center justify-center gap-2 text-on-surface-variant text-sm"
          style={{ height }}
        >
          <span className="material-symbols-outlined text-4xl text-primary/50">map</span>
          <span>مختصات یا آدرس را در تنظیمات وارد کنید</span>
        </div>
      )}
    </section>
  );
};

type TabGalleryItem = {
  id?: string;
  title: string;
  description: string;
  thumbnail: string;
  image: string;
};

export const TabGalleryBlock: React.FC<{ props: Record<string, unknown> }> = ({ props }) => {
  const items = arr<TabGalleryItem>(props.items);
  const [active, setActive] = useState(0);
  const safeIndex = items.length ? Math.min(active, items.length - 1) : 0;
  const current = items[safeIndex];
  const badge = str(props.badge);
  const title = str(props.title);
  const subtitle = str(props.subtitle);
  const tabHint = str(props.tabHint, 'کلیک برای نمایش');

  useEffect(() => {
    if (active >= items.length && items.length > 0) setActive(0);
  }, [active, items.length]);

  if (!items.length) {
    return (
      <section className="rounded-[32px] bg-surface-container-low border border-outline-variant/30 p-10 text-center text-sm text-on-surface-variant">
        آیتمی برای تب گالری تعریف نشده است.
      </section>
    );
  }

  return (
    <section className="rounded-[36px] bg-surface-container-low/80 border border-outline-variant/20 p-6 md:p-10 space-y-8">
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        {badge && (
          <span className="inline-flex bg-primary/10 text-primary text-xs font-extrabold px-4 py-1.5 rounded-full">
            {badge}
          </span>
        )}
        {title && <h2 className="text-2xl md:text-3xl font-black text-primary leading-snug">{title}</h2>}
        {subtitle && (
          <p className="text-sm md:text-base text-on-surface-variant leading-relaxed">{subtitle}</p>
        )}
      </div>

      {/* Visual order: tabs left, stage right (matches design) */}
      <div className="flex flex-col lg:flex-row gap-5 lg:gap-6" dir="ltr">
        <div className="lg:w-[300px] xl:w-[320px] shrink-0 space-y-3" dir="rtl">
          {items.map((item, idx) => {
            const isActive = idx === safeIndex;
            return (
              <button
                key={item.id || `${item.title}-${idx}`}
                type="button"
                onClick={() => setActive(idx)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl text-right transition-all duration-300 ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                    : 'bg-white dark:bg-surface-dim text-on-surface shadow-sm border border-outline-variant/20 hover:border-primary/30'
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-xl overflow-hidden shrink-0 ${
                    isActive ? 'ring-2 ring-white/40' : 'ring-1 ring-outline-variant/30'
                  }`}
                >
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-surface-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-surface-variant">image</span>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-black truncate ${isActive ? 'text-white' : 'text-on-surface'}`}>
                    {item.title || `آیتم ${idx + 1}`}
                  </p>
                  <p className={`text-[11px] mt-0.5 ${isActive ? 'text-white/80' : 'text-on-surface-variant'}`}>
                    {tabHint}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex-1 min-w-0">
          <div className="relative aspect-[4/3] md:aspect-[16/11] rounded-[28px] overflow-hidden shadow-soft bg-surface-container">
            {current?.image ? (
              <img
                key={current.image + safeIndex}
                src={current.image}
                alt={current.title}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-5xl">image</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 p-5 md:p-7 text-white" dir="rtl">
              <h3 className="text-xl md:text-2xl font-black mb-2">{current?.title}</h3>
              {current?.description && (
                <p className="text-xs md:text-sm text-white/90 leading-relaxed max-w-xl">
                  {current.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

type ContainerColumn = { id: string; blocks: ServiceBlock[] };

export const ContainerBlock: React.FC<{
  props: Record<string, unknown>;
  ctx: BlockRenderContext;
  previewMode?: boolean;
  selectedBlockId?: string | null;
  onSelectBlock?: (id: string) => void;
  onContextMenuBlock?: (e: React.MouseEvent, blockId: string) => void;
}> = ({ props, ctx, previewMode, selectedBlockId, onSelectBlock, onContextMenuBlock }) => {
  const columnCount = resolveContainerColumnCount(props);
  const gap = str(props.gap, 'md');
  const padding = str(props.padding, 'md');
  const background = str(props.background, 'none');
  let columns = arr<ContainerColumn>(props.columns);
  if (columns.length < columnCount) {
    columns = [
      ...columns,
      ...Array.from({ length: columnCount - columns.length }, () => ({
        id: `col-${Math.random().toString(36).slice(2, 8)}`,
        blocks: [] as ServiceBlock[],
      })),
    ];
  }
  columns = columns.slice(0, columnCount);

  const gapClass = gap === 'sm' ? 'gap-3' : gap === 'lg' ? 'gap-6 sm:gap-8' : 'gap-4 sm:gap-5';
  const padClass =
    padding === 'none' ? 'p-0' : padding === 'sm' ? 'p-2 sm:p-3' : padding === 'lg' ? 'p-5 sm:p-8' : 'p-3 sm:p-5';
  const bgClass =
    background === 'soft'
      ? 'bg-surface-container-low border border-outline-variant/30'
      : background === 'white'
        ? 'bg-white dark:bg-surface-dim border border-outline-variant/30 shadow-soft'
        : '';

  const widthMode = str(props.widthMode, 'contained');
  const maxWidthRaw = Number(props.maxWidth);
  const maxWidth =
    Number.isFinite(maxWidthRaw) && maxWidthRaw > 0 ? maxWidthRaw : DEFAULT_CONTENT_MAX_WIDTH;
  const widthStyle = containerWidthStyle(widthMode, maxWidth);

  return (
    <section className={`rounded-[28px] ${padClass} ${bgClass}`} style={widthStyle}>
      <ResponsiveGrid
        columnsMobile={props.columnsMobile}
        columnsTablet={props.columnsTablet}
        columnsDesktop={props.columnsDesktop ?? props.columnCount}
        fallbacks={{ mobile: 1, tablet: Math.min(2, columnCount), desktop: columnCount }}
        className={gapClass}
      >
        {columns.map((col, colIdx) => (
          <div
            key={col.id || colIdx}
            className={`min-w-0 space-y-4 ${
              previewMode ? 'rounded-2xl border border-dashed border-primary/25 p-3 min-h-[80px]' : ''
            }`}
          >
            {previewMode && (
              <p className="text-[10px] font-bold text-primary/70">ستون {colIdx + 1}</p>
            )}
            {(col.blocks || []).map((child) => {
              const selected = previewMode && selectedBlockId === child.id;
              return (
                <div
                  key={child.id}
                  onClick={(e) => {
                    if (!previewMode || !onSelectBlock) return;
                    e.stopPropagation();
                    onSelectBlock(child.id);
                  }}
                  onContextMenu={(e) => {
                    if (!previewMode || !onContextMenuBlock) return;
                    e.preventDefault();
                    e.stopPropagation();
                    onContextMenuBlock(e, child.id);
                  }}
                  className={
                    previewMode
                      ? `relative rounded-2xl transition-all cursor-pointer ${
                          selected
                            ? 'ring-2 ring-teal-500 ring-offset-2'
                            : 'hover:ring-1 hover:ring-teal-400/50'
                        }`
                      : undefined
                  }
                >
                  {renderServiceBlock(child, ctx)}
                </div>
              );
            })}
            {!(col.blocks || []).length && previewMode && (
              <p className="text-[11px] text-on-surface-variant text-center py-6">خالی — از تنظیمات بلوک اضافه کنید</p>
            )}
          </div>
        ))}
      </ResponsiveGrid>
    </section>
  );
};

export const ServicesGridBlock: React.FC<{ props: Record<string, unknown>; ctx: BlockRenderContext }> = ({
  props,
  ctx,
}) => {
  const services = ctx.allServices || [];
  return (
    <section className="space-y-6 sm:space-y-8 max-w-[1200px] mx-auto w-full min-w-0">
      <div className="text-center space-y-2 px-1">
        <h2 className="text-2xl md:text-3xl font-black text-primary">{str(props.title)}</h2>
        {str(props.subtitle) && (
          <p className="text-sm text-on-surface-variant">{str(props.subtitle)}</p>
        )}
      </div>
      <ResponsiveGrid
        columnsMobile={props.columnsMobile}
        columnsTablet={props.columnsTablet}
        columnsDesktop={props.columnsDesktop}
        fallbacks={{ mobile: 1, tablet: 2, desktop: 3 }}
        className="gap-4 sm:gap-5"
      >
        {services.map((serv) => (
          <button
            key={serv.id}
            type="button"
            onClick={() => {
              if (ctx.onSelectOtherService) ctx.onSelectOtherService(serv.id);
              else ctx.onNavigate?.('services');
            }}
            className="text-right bg-white dark:bg-surface-dim p-5 sm:p-6 rounded-3xl border border-outline-variant/30 shadow-soft hover:border-primary/40 hover:shadow-md transition-all space-y-3 min-w-0"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">{serv.icon}</span>
            </div>
            <h3 className="text-base font-extrabold text-on-surface">{serv.title}</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3">{serv.description}</p>
            {(serv.duration || serv.fee) && (
              <div className="flex flex-wrap gap-2 pt-1 text-[10px] font-bold text-primary">
                {serv.duration && <span className="bg-primary/10 px-2 py-1 rounded-lg">{serv.duration}</span>}
                {serv.fee && <span className="bg-emerald-500/10 text-emerald-800 px-2 py-1 rounded-lg">{serv.fee}</span>}
              </div>
            )}
          </button>
        ))}
        {!services.length && (
          <p className="col-span-full text-center text-xs text-on-surface-variant py-8">خدمتی ثبت نشده است.</p>
        )}
      </ResponsiveGrid>
    </section>
  );
};

export const ContactCardsBlock: React.FC<{ props: Record<string, unknown> }> = ({ props }) => (
  <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div className="bg-white dark:bg-surface-dim p-7 rounded-3xl border border-outline-variant/30 shadow-soft space-y-3">
      <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
        <span className="material-symbols-outlined text-3xl">location_on</span>
      </div>
      <h3 className="text-xl font-bold text-on-surface">آدرس حضوری</h3>
      <p className="text-xs text-on-surface-variant leading-relaxed">{str(props.address)}</p>
      {str(props.addressNote) && (
        <div className="text-xs text-primary font-bold pt-2">{str(props.addressNote)}</div>
      )}
    </div>
    <div className="bg-white dark:bg-surface-dim p-7 rounded-3xl border border-outline-variant/30 shadow-soft space-y-3">
      <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center">
        <span className="material-symbols-outlined text-3xl">call</span>
      </div>
      <h3 className="text-xl font-bold text-on-surface">شماره‌های تلفن</h3>
      <div className="text-sm font-bold text-on-surface space-y-1" dir="ltr">
        <p>{str(props.phone1)}</p>
        {str(props.phone2) && <p>{str(props.phone2)}</p>}
      </div>
      {str(props.hours) && <p className="text-xs text-on-surface-variant pt-1">{str(props.hours)}</p>}
    </div>
    <div className="bg-white dark:bg-surface-dim p-7 rounded-3xl border border-outline-variant/30 shadow-soft space-y-3">
      <div className="w-12 h-12 bg-tertiary/10 text-tertiary rounded-2xl flex items-center justify-center">
        <span className="material-symbols-outlined text-3xl">mail</span>
      </div>
      <h3 className="text-xl font-bold text-on-surface">ایمیل</h3>
      <p className="text-sm font-bold text-on-surface" dir="ltr">
        {str(props.email, 'info@zhinoclinic.ir')}
      </p>
      <p className="text-xs text-on-surface-variant">پاسخ‌گویی در ساعات اداری</p>
    </div>
  </section>
);

export const ContactInfoBlock: React.FC<{
  props: Record<string, unknown>;
  ctx: BlockRenderContext;
}> = ({ props, ctx }) => {
  const contact = mergeContactInfo(ctx.contact || DEFAULT_CONTACT_INFO);
  const channels = listContactChannels(contact);
  const showPhones = props.showPhones !== false;
  const showSocials = props.showSocials !== false;
  const showAddresses = props.showAddresses !== false;
  const showMap = props.showMap !== false;
  const layout = str(props.layout, 'cards');

  const socials = channels.filter((c) => c.id !== 'phone');
  const phones = contact.phones.filter((p) => p.number.trim());

  return (
    <section className="space-y-6 md:space-y-8 w-full min-w-0">
      <div className="space-y-2 text-right">
        {str(props.badge) && (
          <span className="inline-flex text-[11px] font-bold text-primary bg-primary/10 px-3.5 py-1 rounded-full">
            {str(props.badge)}
          </span>
        )}
        {str(props.title) && (
          <h2 className="text-2xl md:text-3xl font-black text-on-surface">{str(props.title)}</h2>
        )}
        {str(props.subtitle) && (
          <p className="text-sm text-on-surface-variant max-w-2xl leading-relaxed">
            {str(props.subtitle)}
          </p>
        )}
      </div>

      {showSocials && socials.length > 0 && (
        <div className="flex flex-wrap gap-2.5 justify-start">
          {socials.map((ch, idx) => (
            <a
              key={`${ch.id}-${idx}`}
              href={ch.href}
              target={ch.external ? '_blank' : undefined}
              rel={ch.external ? 'noopener noreferrer' : undefined}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold shadow-sm transition-transform hover:scale-[1.02] ${CHANNEL_ACCENT[ch.id]}`}
            >
              <ContactChannelIcon id={ch.id} size={18} />
              <span>{ch.label}</span>
            </a>
          ))}
        </div>
      )}

      <div
        className={
          layout === 'stacked'
            ? 'space-y-4'
            : 'grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6'
        }
      >
        {showPhones && phones.length > 0 && (
          <div className="bg-white dark:bg-surface-dim rounded-[28px] border border-outline-variant/30 p-6 space-y-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">call</span>
              </div>
              <h3 className="font-black text-on-surface">تلفن‌های تماس</h3>
            </div>
            <ul className="space-y-2.5">
              {phones.map((phone) => {
                const href = getTelHref(phone);
                return (
                  <li key={phone.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-on-surface-variant font-bold">{phone.label || 'تلفن'}</span>
                    {href ? (
                      <a href={href} className="font-black text-on-surface hover:text-primary" dir="ltr">
                        {phone.number}
                      </a>
                    ) : (
                      <span className="font-black" dir="ltr">
                        {phone.number}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {showAddresses &&
          contact.addresses.map((addr) => {
            const embed = showMap ? getMapEmbedSrc(addr) : null;
            const mapHref = getMapHref(addr);
            return (
              <div
                key={addr.id}
                className="bg-white dark:bg-surface-dim rounded-[28px] border border-outline-variant/30 overflow-hidden shadow-soft"
              >
                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-2xl">location_on</span>
                    </div>
                    <h3 className="font-black text-on-surface">{addr.title || 'آدرس'}</h3>
                  </div>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{addr.text}</p>
                  {mapHref && (
                    <a
                      href={mapHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-extrabold text-primary hover:underline"
                    >
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                      مشاهده در گوگل‌مپ
                    </a>
                  )}
                </div>
                {embed && (
                  <div className="aspect-[16/10] bg-surface-container-low border-t border-outline-variant/20">
                    <iframe
                      title={addr.title || 'نقشه'}
                      src={embed}
                      className="w-full h-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {!phones.length && !contact.addresses.length && !socials.length && (
        <div className="rounded-[28px] border border-dashed border-outline-variant/40 py-12 text-center text-sm text-on-surface-variant">
          هنوز اطلاعات تماسی در پنل ادمین ثبت نشده است.
        </div>
      )}
    </section>
  );
};

export const ContactFormBlock: React.FC<{ props: Record<string, unknown> }> = ({ props }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('مشاوره عمومی');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !message) {
      alert('لطفاً تمامی فیلدهای ضروری را تکمیل فرمایید.');
      return;
    }
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setSentSuccess(true);
      setName('');
      setPhone('');
      setMessage('');
    }, 1200);
  };

  return (
    <section className="bg-white dark:bg-surface-dim p-8 md:p-10 rounded-[36px] border border-outline-variant/30 shadow-soft space-y-5 max-w-3xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black text-primary">{str(props.title, 'ارسال پیام')}</h2>
        <p className="text-xs text-on-surface-variant">{str(props.subtitle)}</p>
      </div>
      {sentSuccess ? (
        <div className="p-6 rounded-2xl bg-emerald-50 text-emerald-800 text-sm font-bold text-center space-y-2">
          <span className="material-symbols-outlined text-3xl">check_circle</span>
          <p>پیام شما با موفقیت ثبت شد.</p>
          <button type="button" className="underline text-xs" onClick={() => setSentSuccess(false)}>
            ارسال پیام دیگر
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-right text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1">
              <span className="font-bold">نام *</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 rounded-xl border border-outline-variant/40 bg-surface-container-low"
              />
            </label>
            <label className="block space-y-1">
              <span className="font-bold">موبایل *</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                dir="ltr"
                className="w-full p-3 rounded-xl border border-outline-variant/40 bg-surface-container-low text-left"
              />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="font-bold">موضوع</span>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-3 rounded-xl border border-outline-variant/40 bg-surface-container-low"
            >
              <option>مشاوره عمومی</option>
              <option>رزرو نوبت</option>
              <option>همکاری</option>
              <option>سایر</option>
            </select>
          </label>
          <label className="block space-y-1">
            <span className="font-bold">پیام *</span>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 rounded-xl border border-outline-variant/40 bg-surface-container-low"
            />
          </label>
          <button
            type="submit"
            disabled={isSending}
            className="w-full py-3.5 rounded-2xl bg-primary text-white font-black disabled:opacity-60"
          >
            {isSending ? 'در حال ارسال...' : 'ارسال پیام'}
          </button>
        </form>
      )}
    </section>
  );
};

export const ArticlesGridBlock: React.FC<{ props: Record<string, unknown>; ctx: BlockRenderContext }> = ({
  props,
  ctx,
}) => {
  const defaultCategory = str(props.categoryFilter).trim();
  const titleQuery = str(props.titleQuery).trim();
  const sortBy = str(props.sortBy, 'newest');
  const layout = str(props.layout, 'grid');
  const maxCount = Math.max(0, Number(props.maxCount) || 0);
  const showPagination = props.showPagination === true;
  const pageSize = Math.max(1, maxCount || 6);
  const showSearch = props.showSearch === true;
  const showCategories = props.showCategories === true;
  const showExcerpt = props.showExcerpt !== false;
  const showCategoryBadge = props.showCategoryBadge !== false;

  const [selectedCategory, setSelectedCategory] = useState(defaultCategory || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    setSelectedCategory(defaultCategory || 'all');
  }, [defaultCategory]);

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, searchQuery, titleQuery, sortBy, maxCount, showPagination, ctx.articles]);

  const published = (ctx.articles || []).filter((a) => a.status === 'published');

  useEffect(() => {
    fetchArticleCategories()
      .then((list) => {
        const normalized = (Array.isArray(list) ? list : [])
          .map((item) => {
            if (typeof item === 'string') return { id: item, name: item };
            const name = String((item as { name?: string }).name || '').trim();
            if (!name) return null;
            return { id: String((item as { id?: string }).id || name), name };
          })
          .filter(Boolean) as Array<{ id: string; name: string }>;
        setCategories(
          normalized.length
            ? normalized
            : Array.from(new Set(published.map((a) => a.category).filter(Boolean))).map((name) => ({
                id: name,
                name,
              }))
        );
      })
      .catch(() => {
        setCategories(
          Array.from(new Set(published.map((a) => a.category).filter(Boolean))).map((name) => ({
            id: name,
            name,
          }))
        );
      });
  }, [ctx.articles]);

  const articleDateKey = (art: Article) => {
    const raw = art.publishedAt || '';
    const t = Date.parse(raw);
    return Number.isFinite(t) ? t : 0;
  };

  const filtered = published
    .filter((art) => {
      const catKey = selectedCategory === 'all' ? '' : selectedCategory;
      const matchesCat =
        !catKey ||
        art.category === catKey ||
        art.categoryId === catKey ||
        art.categoryId === categories.find((c) => c.name === catKey)?.id;
      const fixedTitle = titleQuery;
      const matchesFixedTitle = !fixedTitle || art.title.includes(fixedTitle);
      const q = searchQuery.trim();
      const matchesSearch =
        !q ||
        art.title.includes(q) ||
        (art.summary || '').includes(q) ||
        (art.tags || []).some((t) => t.includes(q));
      return matchesCat && matchesFixedTitle && matchesSearch;
    })
    .slice()
    .sort((a, b) => {
      if (sortBy === 'oldest') return articleDateKey(a) - articleDateKey(b);
      if (sortBy === 'title_asc') return a.title.localeCompare(b.title, 'fa');
      if (sortBy === 'title_desc') return b.title.localeCompare(a.title, 'fa');
      if (sortBy === 'views') return (b.views || 0) - (a.views || 0);
      // newest (default)
      const da = articleDateKey(a);
      const db = articleDateKey(b);
      if (db !== da) return db - da;
      return 0;
    });

  const total = filtered.length;
  const totalPages = showPagination ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const currentPage = Math.min(page, totalPages);
  const visible = showPagination
    ? filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : maxCount > 0
      ? filtered.slice(0, maxCount)
      : filtered;

  const renderCard = (art: Article) => {
    if (layout === 'list') {
      return (
        <article
          key={art.id}
          onClick={() => ctx.onSelectArticle?.(art)}
          className="bg-white dark:bg-surface-dim rounded-3xl overflow-hidden shadow-soft border border-outline-variant/30 flex flex-col sm:flex-row group hover:shadow-xl transition-all cursor-pointer"
        >
          <div className="sm:w-48 md:w-56 shrink-0 aspect-video sm:aspect-auto sm:min-h-[140px] relative overflow-hidden bg-surface-container">
            <img
              src={art.coverImage}
              alt={art.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="p-5 flex flex-col justify-between gap-3 flex-1 min-w-0">
            <div className="space-y-2">
              {showCategoryBadge && art.category && (
                <span className="inline-flex text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                  {art.category}
                </span>
              )}
              <h3 className="text-base md:text-lg font-bold text-on-surface group-hover:text-primary transition-colors leading-snug">
                {art.title}
              </h3>
              {showExcerpt && (
                <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">{art.summary}</p>
              )}
            </div>
            <div className="text-xs font-bold text-primary flex items-center gap-1">
              <span>ادامه مطلب</span>
              <span className="material-symbols-outlined text-sm">arrow_back</span>
            </div>
          </div>
        </article>
      );
    }

    const compact = layout === 'compact';
    return (
      <article
        key={art.id}
        onClick={() => ctx.onSelectArticle?.(art)}
        className={`bg-white dark:bg-surface-dim rounded-3xl overflow-hidden shadow-soft border border-outline-variant/30 flex flex-col justify-between group hover:shadow-xl transition-all cursor-pointer ${
          compact ? 'rounded-2xl' : ''
        }`}
      >
        <div>
          <div className={`relative overflow-hidden bg-surface-container ${compact ? 'aspect-[16/10]' : 'aspect-video'}`}>
            <img
              src={art.coverImage}
              alt={art.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {showCategoryBadge && art.category && (
              <span className="absolute top-3 right-3 bg-primary text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md">
                {art.category}
              </span>
            )}
          </div>
          <div className={`space-y-2 ${compact ? 'p-4' : 'p-6 space-y-3'}`}>
            <h3
              className={`font-bold text-on-surface group-hover:text-primary transition-colors leading-snug ${
                compact ? 'text-sm line-clamp-2' : 'text-lg'
              }`}
            >
              {art.title}
            </h3>
            {showExcerpt && !compact && (
              <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3">{art.summary}</p>
            )}
          </div>
        </div>
        <div className={`text-xs font-bold text-primary flex items-center gap-1 ${compact ? 'px-4 pb-4' : 'px-6 pb-5'}`}>
          <span>ادامه مطلب</span>
          <span className="material-symbols-outlined text-sm">arrow_back</span>
        </div>
      </article>
    );
  };

  return (
    <section className="space-y-6 md:space-y-8 w-full min-w-0">
      {(str(props.title) || str(props.subtitle)) && (
        <div className="text-center space-y-2">
          {str(props.title) && (
            <h2 className="text-2xl md:text-3xl font-black text-primary">{str(props.title)}</h2>
          )}
          {str(props.subtitle) && (
            <p className="text-sm text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
              {str(props.subtitle)}
            </p>
          )}
        </div>
      )}

      {(showSearch || showCategories) && (
        <div className="bg-white dark:bg-surface-dim p-5 md:p-6 rounded-3xl border border-outline-variant/30 shadow-soft space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {showCategories && (
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                  }`}
                >
                  همه ({published.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedCategory === cat.name || selectedCategory === cat.id
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
            {showSearch && (
              <div className="relative w-full md:w-72">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجوی مقاله..."
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl pr-10 pl-4 py-2.5 text-xs focus:ring-2 focus:ring-primary outline-none"
                />
                <span className="material-symbols-outlined absolute right-3 top-2.5 text-on-surface-variant text-lg">
                  search
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {layout === 'list' ? (
        <div className="space-y-4">{visible.map(renderCard)}</div>
      ) : (
        <ResponsiveGrid
          columnsMobile={Number(props.columnsMobile) || 1}
          columnsTablet={Number(props.columnsTablet) || 2}
          columnsDesktop={Number(props.columnsDesktop) || 3}
          className="gap-6 md:gap-8"
        >
          {visible.map(renderCard)}
        </ResponsiveGrid>
      )}

      {!visible.length && (
        <p className="text-center text-sm text-on-surface-variant py-12">مقاله‌ای یافت نشد.</p>
      )}

      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-2 rounded-xl border border-outline-variant/40 text-xs font-bold disabled:opacity-40 hover:bg-surface-container-low"
          >
            قبلی
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPage(n)}
              className={`w-9 h-9 rounded-xl text-xs font-black transition-colors ${
                n === currentPage
                  ? 'bg-primary text-white shadow'
                  : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
              }`}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-2 rounded-xl border border-outline-variant/40 text-xs font-bold disabled:opacity-40 hover:bg-surface-container-low"
          >
            بعدی
          </button>
        </div>
      )}
    </section>
  );
};

export function renderServiceBlock(
  block: ServiceBlock,
  ctx: BlockRenderContext,
  options?: {
    previewMode?: boolean;
    selectedBlockId?: string | null;
    onSelectBlock?: (id: string) => void;
    onContextMenuBlock?: (e: React.MouseEvent, blockId: string) => void;
  }
) {
  switch (block.type) {
    case 'hero':
      return <HeroBlock props={block.props} ctx={ctx} />;
    case 'pageHero':
      return <PageHeroBlock props={block.props} ctx={ctx} />;
    case 'heroHeader':
      return <HeroHeaderBlock props={block.props} ctx={ctx} />;
    case 'highlights':
      return <HighlightsBlock props={block.props} />;
    case 'symptoms':
      return <SymptomsBlock props={block.props} />;
    case 'process':
      return <ProcessBlock props={block.props} />;
    case 'features':
      return <FeaturesBlock props={block.props} />;
    case 'doctors':
      return <DoctorsBlock props={block.props} ctx={ctx} />;
    case 'staffCarousel':
      return <StaffCarouselBlock props={block.props} ctx={ctx} />;
    case 'testimonials':
      return <TestimonialsBlock props={block.props} />;
    case 'faqs':
      return <FaqsBlock props={block.props} />;
    case 'latestFaqs':
      return <LatestFaqsBlock props={block.props} ctx={ctx} />;
    case 'otherServices':
      return <OtherServicesBlock props={block.props} ctx={ctx} />;
    case 'servicesGrid':
      return <ServicesGridBlock props={block.props} ctx={ctx} />;
    case 'contactCards':
      return <ContactCardsBlock props={block.props} />;
    case 'contactInfo':
      return <ContactInfoBlock props={block.props} ctx={ctx} />;
    case 'contactForm':
      return <ContactFormBlock props={block.props} />;
    case 'articlesGrid':
      return <ArticlesGridBlock props={block.props} ctx={ctx} />;
    case 'cta':
      return <CtaBlock props={block.props} ctx={ctx} />;
    case 'richText':
      return <RichTextBlock props={block.props} />;
    case 'htmlCode':
      return <HtmlCodeBlock props={block.props} />;
    case 'imageCarousel':
      return <ImageCarouselBlock props={block.props} />;
    case 'videoPlayer':
      return <VideoPlayerBlock props={block.props} />;
    case 'icon':
      return <IconBlock props={block.props} />;
    case 'iconList':
      return <IconListBlock props={block.props} />;
    case 'button':
      return <ButtonBlock props={block.props} ctx={ctx} />;
    case 'divider':
      return <DividerBlock props={block.props} />;
    case 'spacer':
      return <SpacerBlock props={block.props} previewMode={options?.previewMode} />;
    case 'singleImage':
      return <SingleImageBlock props={block.props} />;
    case 'imageGallery':
      return <ImageGalleryBlock props={block.props} />;
    case 'googleMap':
      return <GoogleMapBlock props={block.props} />;
    case 'tabGallery':
      return <TabGalleryBlock props={block.props} />;
    case 'container':
      return (
        <ContainerBlock
          props={block.props}
          ctx={ctx}
          previewMode={options?.previewMode}
          selectedBlockId={options?.selectedBlockId}
          onSelectBlock={options?.onSelectBlock}
          onContextMenuBlock={options?.onContextMenuBlock}
        />
      );
    default:
      return null;
  }
}
