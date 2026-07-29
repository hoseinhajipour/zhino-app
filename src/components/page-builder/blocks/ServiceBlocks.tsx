import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  Article,
  ClinicContactInfo,
  Doctor,
  FAQItem,
  FormAnswerValue,
  FormDefinition,
  FormField,
  PageScreen,
  ServiceBlock,
  ServiceItem,
} from '../../../types';
import { fetchArticleCategories, fetchForm, submitForm } from '../../../lib/dbService';
import { DEFAULT_CONTACT_FORM_ID } from '../../../lib/formDefaults';
import {
  readResponsiveCols,
  resolveColsForWidth,
  resolveColumnsDirection,
  resolveContainerColumnCount,
  resolveContainerMargin,
  resolveContainerPadding,
  type ColCount,
} from '../../../lib/responsiveGrid';
import {
  normalizeContainerColumn,
  resolveColumnBoxStyle,
  resolveColumnTrack,
  type ContainerColumn,
} from '../../../lib/containerColumn';
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
import { ScrollReveal } from '../ScrollReveal';
import { useBuilderDevicePreview } from '../BuilderDevicePreviewContext';
import { useDeviceBand } from '../useDeviceBand';
import { getBlockScrollAnimation } from '../../../lib/blockScrollAnimation';
import { containerWidthStyle, DEFAULT_CONTENT_MAX_WIDTH } from '../../../lib/contentWidth';
import {
  itemTitleSizeClass,
  resolveTitleFontStyle,
  sectionTitleSizeClass,
} from '../../../lib/blockTitleTypography';
import {
  formatHeroStatNumber,
  heroHasCustomVerticalPadding,
  heroHexToRgba,
  normalizeHeroPatternStyle,
  parseHeroStatValue,
  resolveHeroDevice,
  resolveHeroOuterStyle,
} from '../../../lib/heroHeaderLayout';
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

const RichTextEditor = React.lazy(() =>
  import('../RichTextEditor').then((module) => ({ default: module.RichTextEditor }))
);

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
  /** Site page context for form submissions */
  pageId?: string;
  pageSlug?: string;
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
  const titleFont = resolveTitleFontStyle(props.titleFontFamily);
  const itemTitleFont = resolveTitleFontStyle(props.itemTitleFontFamily);
  return (
    <section className="space-y-8 bg-surface-container-lowest p-8 md:p-12 rounded-[36px] border border-outline-variant/20 shadow-xs">
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <span className="text-xs font-bold text-primary bg-primary/10 px-3.5 py-1 rounded-full">
          مخاطبان و نشانه‌های نیاز
        </span>
        <h2
          className={`font-black text-primary ${sectionTitleSizeClass(props.titleSize)}`}
          style={titleFont}
        >
          {str(props.title)}
        </h2>
        <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed">{str(props.subtitle)}</p>
      </div>
      <ResponsiveGrid
        columnsMobile={props.columnsMobile}
        columnsTablet={props.columnsTablet}
        columnsDesktop={props.columnsDesktop}
        fallbacks={{ mobile: 1, tablet: 2, desktop: 3 }}
        className="gap-4 sm:gap-6"
      >
        {items.map((item, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-surface-dim p-6 rounded-3xl border border-outline-variant/30 shadow-soft space-y-3 hover:border-primary/50 hover:shadow-md transition-all group min-w-0"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-2xl">{item.icon}</span>
            </div>
            <h3
              className={`font-extrabold text-on-surface group-hover:text-primary transition-colors ${itemTitleSizeClass(props.itemTitleSize, 'md')}`}
              style={itemTitleFont}
            >
              {item.title}
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed text-justify">{item.desc}</p>
          </div>
        ))}
      </ResponsiveGrid>
    </section>
  );
};

export const ProcessBlock: React.FC<{ props: Record<string, unknown> }> = ({ props }) => {
  const steps = arr<{ number: string; title: string; desc: string }>(props.steps);
  const titleFont = resolveTitleFontStyle(props.titleFontFamily);
  const itemTitleFont = resolveTitleFontStyle(props.itemTitleFontFamily);
  return (
    <section className="space-y-8">
      <div className="text-center space-y-2">
        <span className="text-xs font-bold text-primary bg-primary/10 px-3.5 py-1 rounded-full">
          {str(props.eyebrow, 'فرآیند دریافت خدمت')}
        </span>
        <h2
          className={`font-black text-primary ${sectionTitleSizeClass(props.titleSize)}`}
          style={titleFont}
        >
          {str(props.title)}
        </h2>
      </div>
      <ResponsiveGrid
        columnsMobile={props.columnsMobile}
        columnsTablet={props.columnsTablet}
        columnsDesktop={props.columnsDesktop}
        fallbacks={{ mobile: 1, tablet: 2, desktop: 4 }}
        className="gap-4 sm:gap-6 relative"
      >
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-surface-dim p-6 rounded-3xl border border-outline-variant/30 shadow-soft relative flex flex-col justify-between space-y-4 min-w-0"
          >
            <div className="flex items-center justify-between">
              <span className="text-3xl font-black text-primary/30">{step.number}</span>
              <span className="w-3 h-3 rounded-full bg-primary/20" />
            </div>
            <div className="space-y-2">
              <h3
                className={`font-bold text-on-surface ${itemTitleSizeClass(props.itemTitleSize, 'md')}`}
                style={itemTitleFont}
              >
                {step.title}
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed text-justify">{step.desc}</p>
            </div>
          </div>
        ))}
      </ResponsiveGrid>
    </section>
  );
};

export const FeaturesBlock: React.FC<{ props: Record<string, unknown> }> = ({ props }) => {
  const items = arr<{ icon: string; title: string; desc: string }>(props.items);
  const titleFont = resolveTitleFontStyle(props.titleFontFamily);
  const itemTitleFont = resolveTitleFontStyle(props.itemTitleFontFamily);
  return (
    <section className="bg-surface-container-low p-8 md:p-12 rounded-[36px] border border-outline-variant/30 space-y-8">
      <div className="text-center space-y-2">
        <h2
          className={`font-black text-primary ${sectionTitleSizeClass(props.titleSize)}`}
          style={titleFont}
        >
          {str(props.title)}
        </h2>
      </div>
      <ResponsiveGrid
        columnsMobile={props.columnsMobile}
        columnsTablet={props.columnsTablet}
        columnsDesktop={props.columnsDesktop}
        fallbacks={{ mobile: 1, tablet: 2, desktop: 4 }}
        className="gap-4 sm:gap-6"
      >
        {items.map((feat, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-surface-dim p-6 rounded-2xl border border-outline-variant/30 shadow-xs space-y-3 min-w-0"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">{feat.icon}</span>
            </div>
            <h3
              className={`font-bold text-on-surface ${itemTitleSizeClass(props.itemTitleSize, 'sm')}`}
              style={itemTitleFont}
            >
              {feat.title}
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">{feat.desc}</p>
          </div>
        ))}
      </ResponsiveGrid>
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
              {ctx.bookingEnabled && doc.bookable !== false && doc.role !== 'management' && (
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
  const titleFont = resolveTitleFontStyle(props.titleFontFamily);
  const itemTitleFont = resolveTitleFontStyle(props.itemTitleFontFamily);
  return (
    <section className="bg-surface-container-lowest p-8 md:p-12 rounded-[36px] border border-outline-variant/20 space-y-6">
      <div className="text-center space-y-2">
        <h2
          className={`font-black text-primary ${sectionTitleSizeClass(props.titleSize)}`}
          style={titleFont}
        >
          {str(props.title)}
        </h2>
        <p className="text-xs text-on-surface-variant">{str(props.subtitle)}</p>
      </div>
      <ResponsiveGrid
        columnsMobile={props.columnsMobile}
        columnsTablet={props.columnsTablet}
        columnsDesktop={props.columnsDesktop}
        fallbacks={{ mobile: 1, tablet: 2, desktop: 2 }}
        className="gap-4 sm:gap-6"
      >
        {items.map((test, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-surface-dim p-6 rounded-3xl border border-outline-variant/30 shadow-soft space-y-3 min-w-0"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h3
                  className={`font-extrabold text-on-surface truncate ${itemTitleSizeClass(props.itemTitleSize, 'sm')}`}
                  style={itemTitleFont}
                >
                  {test.name}
                </h3>
                <p className="text-[11px] text-primary truncate">{test.role}</p>
              </div>
              <div className="flex text-amber-500 shrink-0">
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
      </ResponsiveGrid>
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

export const RichTextBlock: React.FC<{
  props: Record<string, unknown>;
  editable?: boolean;
  onHtmlChange?: (html: string) => void;
}> = ({ props, editable, onHtmlChange }) => {
  const html = str(props.html, '<p></p>');

  if (editable && onHtmlChange) {
    return (
      <section className="rounded-3xl border border-outline-variant/30 bg-white p-3 text-right dark:bg-surface-dim">
        <React.Suspense
          fallback={<div className="min-h-[260px] animate-pulse rounded-2xl bg-surface-container-low" />}
        >
          <RichTextEditor value={html} onChange={onHtmlChange} />
        </React.Suspense>
      </section>
    );
  }

  return (
    <section
      className="rich-text-content max-w-none rounded-3xl border border-outline-variant/30 bg-white p-8 text-right dark:bg-surface-dim"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

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

const HeroStatCountValue: React.FC<{
  value: string;
  active: boolean;
  className?: string;
  durationMs?: number;
}> = ({ value, active, className, durationMs = 900 }) => {
  const parsed = useMemo(() => parseHeroStatValue(value), [value]);
  const [display, setDisplay] = useState(() =>
    parsed.target == null
      ? value
      : `${parsed.prefix}${formatHeroStatNumber(0, parsed.decimals, parsed.usePersian)}${parsed.suffix}`
  );

  useEffect(() => {
    if (!active || parsed.target == null) {
      setDisplay(value);
      return;
    }

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setDisplay(value);
      return;
    }

    let raf = 0;
    const start = performance.now();
    const from = 0;
    const to = parsed.target;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + (to - from) * eased;
      setDisplay(
        `${parsed.prefix}${formatHeroStatNumber(current, parsed.decimals, parsed.usePersian)}${parsed.suffix}`
      );
      if (t < 1) raf = requestAnimationFrame(tick);
      else
        setDisplay(
          `${parsed.prefix}${formatHeroStatNumber(to, parsed.decimals, parsed.usePersian)}${parsed.suffix}`
        );
    };
    setDisplay(
      `${parsed.prefix}${formatHeroStatNumber(0, parsed.decimals, parsed.usePersian)}${parsed.suffix}`
    );
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, durationMs, parsed, value]);

  return <span className={className}>{display}</span>;
};

const HeroStatsStrip: React.FC<{
  stats: HeroHeaderStat[];
  accentSoft: string;
  isCompact: boolean;
  animate: boolean;
}> = ({ stats, accentSoft, isCompact, animate }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(!animate);
  const [revealed, setRevealed] = useState(() => (!animate ? stats.length : 0));

  useEffect(() => {
    if (!animate) {
      setVisible(true);
      setRevealed(stats.length);
      return;
    }

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setVisible(true);
      setRevealed(stats.length);
      return;
    }

    setVisible(false);
    setRevealed(0);
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -6% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [animate, stats.length]);

  useEffect(() => {
    if (!animate || !visible) return;
    if (revealed >= stats.length) return;
    const staggerMs = 140;
    const t = window.setTimeout(() => setRevealed((n) => Math.min(stats.length, n + 1)), staggerMs);
    return () => window.clearTimeout(t);
  }, [animate, visible, revealed, stats.length]);

  return (
    <div
      ref={ref}
      className={`mt-5 ${
        isCompact
          ? 'flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-0.5 px-0.5'
          : 'grid grid-cols-3 gap-4 mt-14'
      }`}
      style={isCompact ? { WebkitOverflowScrolling: 'touch' } : undefined}
    >
      {stats.map((stat, i) => {
        const shown = !animate || i < revealed;
        return (
          <div
            key={i}
            className={`hero-stat-card flex items-center bg-white dark:bg-surface-dim border border-outline-variant/25 shadow-soft ${
              isCompact
                ? 'gap-2 rounded-xl p-2.5 shrink-0 min-w-[148px]'
                : 'gap-3 rounded-2xl p-4'
            } ${animate ? (shown ? 'hero-stat-card--in' : 'hero-stat-card--pending') : ''}`}
          >
            <span
              className={`${accentSoft} flex items-center justify-center shrink-0 ${
                isCompact ? 'w-8 h-8 rounded-lg' : 'w-11 h-11 rounded-xl'
              }`}
            >
              <span className={`material-symbols-outlined ${isCompact ? 'text-lg' : 'text-2xl'}`}>
                {str(stat.icon, 'analytics')}
              </span>
            </span>
            <div className="min-w-0">
              <p className={`font-black text-on-surface leading-none ${isCompact ? 'text-sm' : 'text-lg'}`}>
                {animate ? (
                  <HeroStatCountValue value={str(stat.value)} active={shown} />
                ) : (
                  str(stat.value)
                )}
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
        );
      })}
    </div>
  );
};

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
  const statsAnimate = props.statsAnimate === true;
  const showRating = props.showRatingBadge !== false;
  const showFloating = props.showFloatingBadge !== false;
  const showDots = props.showCarouselDots !== false;
  const showArrows = props.showCarouselArrows !== false;

  /** Compact = stacked mobile/tablet layout (also respects page-builder device toolbar). */
  const previewDevice = useBuilderDevicePreview();
  const [isCompact, setIsCompact] = useState(true);
  const [viewportW, setViewportW] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );

  useEffect(() => {
    if (previewDevice === 'mobile' || previewDevice === 'tablet') {
      setIsCompact(true);
      return;
    }
    if (previewDevice === 'desktop') {
      setIsCompact(false);
      return;
    }
    const apply = () => {
      setViewportW(window.innerWidth);
      setIsCompact(window.innerWidth < 1024);
    };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, [previewDevice]);

  const heroDevice = resolveHeroDevice(previewDevice, viewportW);
  const outerStyle = resolveHeroOuterStyle(props, heroDevice);
  const useCustomPad = heroHasCustomVerticalPadding(props);
  const bgMode = str(props.background, 'none');
  const bgImage = str(props.backgroundImage);
  const overlay = Math.max(0, Math.min(80, Number(props.backgroundOverlay ?? 35)));
  const patternStyle = normalizeHeroPatternStyle(props.patternStyle);
  const patternAnimate = props.patternAnimate !== false;
  const patternOpacity = Math.max(0.03, Math.min(0.35, Number(props.patternOpacity ?? 0.1)));
  const patternSize = Math.max(8, Math.min(48, Number(props.patternSize) || 16));
  const patternLine = str(props.patternColor, '#b5106a');
  const patternSpeed = Math.max(12, Math.min(60, Number(props.patternSpeed) || 28));
  const hatchLine = heroHexToRgba(patternLine, patternOpacity);
  const hatchGap = patternSize;
  const hatchSoft = patternStyle === 'soft' ? Math.max(2, Math.round(patternSize * 0.35)) : 1;
  const dotRadius = Math.max(1.2, Math.min(4.5, patternSize * 0.12));
  const dotCell = Math.max(14, patternSize * 1.35);
  const diagonalBg = `repeating-linear-gradient(
    -45deg,
    transparent 0,
    transparent ${hatchGap - hatchSoft}px,
    ${hatchLine} ${hatchGap - hatchSoft}px,
    ${hatchLine} ${hatchGap}px
  )`;
  const crossBg = `repeating-linear-gradient(
    45deg,
    transparent 0,
    transparent ${hatchGap - hatchSoft}px,
    ${hatchLine} ${hatchGap - hatchSoft}px,
    ${hatchLine} ${hatchGap}px
  )`;
  const softBg = `repeating-linear-gradient(
    115deg,
    transparent 0,
    transparent ${hatchGap * 1.4}px,
    ${heroHexToRgba(patternLine, patternOpacity * 0.55)} ${hatchGap * 1.4}px,
    ${heroHexToRgba(patternLine, patternOpacity * 0.55)} ${hatchGap * 1.4 + hatchSoft * 2}px
  )`;
  const dotsBg = `radial-gradient(circle, ${heroHexToRgba(patternLine, patternOpacity * 0.7)} ${dotRadius}px, transparent ${dotRadius + 0.6}px)`;
  const hasBgLayer = (bgMode === 'image' && !!bgImage) || bgMode === 'pattern';

  const patternLayerBg =
    patternStyle === 'soft' ? softBg : patternStyle === 'dots' ? dotsBg : diagonalBg;

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
    <div className="relative w-full min-w-0">
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
    <section
      className={`relative w-full min-w-0 overflow-x-clip ${useCustomPad ? '' : padClass}`}
      style={outerStyle}
      data-hero-compact={isCompact ? '1' : '0'}
    >
      {bgMode === 'image' && bgImage && (
        <>
          <img
            src={bgImage}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundColor: `rgba(0,0,0,${overlay / 100})` }}
          />
        </>
      )}
      {bgMode === 'pattern' && (
        <div
          className={`hero-hatch-pattern ${patternAnimate ? 'hero-hatch-pattern--animate' : ''} ${
            patternStyle === 'cross' || patternStyle === 'dots' ? 'hero-hatch-pattern--cross' : ''
          }`}
          aria-hidden
          style={
            {
              '--hero-hatch-speed': `${patternSpeed}s`,
              '--hero-hatch-shift': `${hatchGap * 1.75}px`,
            } as React.CSSProperties
          }
        >
          <div
            className="hero-hatch-pattern__layer"
            style={{
              backgroundImage: patternLayerBg,
              ...(patternStyle === 'dots'
                ? {
                    backgroundSize: `${dotCell}px ${dotCell}px`,
                    backgroundPosition: '0 0',
                  }
                : {}),
            }}
          />
          {patternStyle === 'cross' && (
            <div
              className="hero-hatch-pattern__layer hero-hatch-pattern__layer--b"
              style={{ backgroundImage: crossBg }}
            />
          )}
          {patternStyle === 'dots' && (
            <div
              className="hero-hatch-pattern__layer hero-hatch-pattern__layer--b"
              style={{
                backgroundImage: `radial-gradient(circle, ${heroHexToRgba(patternLine, patternOpacity * 0.35)} ${Math.max(0.8, dotRadius * 0.7)}px, transparent ${dotRadius}px)`,
                backgroundSize: `${dotCell}px ${dotCell}px`,
                backgroundPosition: `${dotCell / 2}px ${dotCell / 2}px`,
              }}
            />
          )}
        </div>
      )}
      <div className={hasBgLayer ? 'relative z-10' : undefined}>
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
        <HeroStatsStrip
          stats={stats}
          accentSoft={accent.soft}
          isCompact={isCompact}
          animate={statsAnimate}
        />
      )}
      </div>
    </section>
  );
};

function aparatEmbedSrc(hash: string) {
  return `https://www.aparat.com/video/video/embed/videohash/${hash}/vt/frame`;
}

/** Accepts a direct URL, page URL, or pasted Aparat/YouTube embed HTML. */
function toVideoEmbed(url: string): { kind: 'iframe' | 'file'; src: string } | null {
  const raw = url.trim();
  if (!raw) return null;

  // Paste of full <iframe ...> embed markup (Aparat / YouTube)
  const iframeSrc = raw.match(/<iframe[^>]*\ssrc\s*=\s*["']([^"']+)["']/i)?.[1]?.trim();
  const candidate = iframeSrc || raw;

  // Aparat script embed: <script src="https://www.aparat.com/embed/HASH?...">
  const aparatScript = candidate.match(/aparat\.com\/embed\/([A-Za-z0-9_-]+)/i);
  if (aparatScript?.[1]) return { kind: 'iframe', src: aparatEmbedSrc(aparatScript[1]) };

  // Aparat iframe / share URL with videohash
  const aparatHash = candidate.match(
    /aparat\.com\/video\/video\/embed\/videohash\/([A-Za-z0-9_-]+)/i
  );
  if (aparatHash?.[1]) return { kind: 'iframe', src: aparatEmbedSrc(aparatHash[1]) };

  const yt =
    candidate.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{6,})/) ||
    candidate.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/);
  if (yt?.[1]) return { kind: 'iframe', src: `https://www.youtube.com/embed/${yt[1]}` };

  const aparat = candidate.match(/aparat\.com\/v\/([A-Za-z0-9_-]+)/i);
  if (aparat?.[1]) return { kind: 'iframe', src: aparatEmbedSrc(aparat[1]) };

  if (
    /\.(mp4|webm|ogg)(\?|$)/i.test(candidate) ||
    candidate.startsWith('/uploads/') ||
    candidate.startsWith('blob:')
  ) {
    return { kind: 'file', src: candidate };
  }

  if (
    candidate.includes('youtube.com/embed/') ||
    candidate.includes('aparat.com/video/video/embed')
  ) {
    return { kind: 'iframe', src: candidate };
  }

  // Generic iframe src from pasted HTML (non-Aparat providers)
  if (iframeSrc) return { kind: 'iframe', src: iframeSrc };

  return { kind: 'file', src: candidate };
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
  const sourceType = str(props.sourceType, 'upload');
  const videoUrl = str(props.videoUrl);
  const poster = str(props.posterImage);
  const embed = toVideoEmbed(videoUrl);
  const aspect = str(props.aspect, 'video');
  const aspectClass =
    aspect === 'square' ? 'aspect-square' : aspect === 'wide' ? 'aspect-[21/9]' : 'aspect-video';
  const controls = props.controls !== false;
  const autoplay = props.autoplay === true;
  const muted = props.muted !== false;
  const hasPoster = Boolean(poster);
  const [started, setStarted] = useState(() => autoplay || !hasPoster);
  const videoRef = useRef<HTMLVideoElement>(null);
  const emptyHint =
    sourceType === 'aparatEmbed'
      ? 'کد امبد آپارات را در تنظیمات بچسبانید'
      : sourceType === 'embed'
        ? 'لینک یوتیوب یا آپارات را وارد کنید'
        : 'آدرس ویدئو را در تنظیمات وارد کنید';

  useEffect(() => {
    setStarted(autoplay || !hasPoster);
  }, [autoplay, hasPoster, videoUrl, poster]);

  useEffect(() => {
    if (!started || embed?.kind !== 'file') return;
    const el = videoRef.current;
    if (!el) return;
    void el.play().catch(() => undefined);
  }, [started, embed?.kind, embed?.src]);

  const iframeSrc = (() => {
    if (!embed || embed.kind !== 'iframe') return '';
    const base = embed.src;
    const wantsAutoplay = autoplay || (hasPoster && started);
    if (!wantsAutoplay) return base;
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}autoplay=1&mute=1`;
  })();

  const showPosterOverlay = Boolean(embed && hasPoster && !started);

  return (
    <section className="space-y-3">
      {title && <h2 className="text-xl font-black text-on-surface text-center">{title}</h2>}
      <div className={`relative w-full ${aspectClass} rounded-[28px] overflow-hidden border border-outline-variant/30 bg-slate-900 shadow-soft`}>
        {!embed ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/70 text-sm">
            <span className="material-symbols-outlined text-4xl">smart_display</span>
            <span>{emptyHint}</span>
          </div>
        ) : (
          <>
            {started &&
              (embed.kind === 'iframe' ? (
                <iframe
                  src={iframeSrc}
                  title={title || 'ویدئو'}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover"
                  src={embed.src}
                  controls={controls}
                  autoPlay
                  muted={muted || autoplay}
                  playsInline
                />
              ))}

            {showPosterOverlay && (
              <button
                type="button"
                aria-label="پخش ویدئو"
                onClick={() => setStarted(true)}
                className="absolute inset-0 group cursor-pointer border-0 p-0 text-start"
              >
                <img
                  src={poster}
                  alt={title || 'کاور ویدئو'}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-black/10" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="relative flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24">
                    <span
                      aria-hidden
                      className="video-play-shockwave absolute inset-0 rounded-full border-2 border-white/50"
                    />
                    <span
                      aria-hidden
                      className="video-play-shockwave video-play-shockwave-delay absolute inset-0 rounded-full border-2 border-white/35"
                    />
                    <span className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-primary shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-transform duration-300 group-hover:scale-110 sm:h-20 sm:w-20">
                      <span className="material-symbols-outlined text-[40px] sm:text-[48px] ms-0.5">
                        play_arrow
                      </span>
                    </span>
                  </span>
                </span>
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
};

type AudioTrackItem = {
  url?: string;
  title?: string;
  artist?: string;
  coverImage?: string;
};

function formatAudioTime(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const AudioPlayerBlock: React.FC<{ props: Record<string, unknown> }> = ({ props }) => {
  const mode = str(props.mode, 'single') === 'playlist' ? 'playlist' : 'single';
  const title = str(props.title);
  const sectionSubtitle = str(props.subtitle);
  const showCover = props.showCover !== false;
  const showPlaylist = props.showPlaylist !== false;
  const autoplay = props.autoplay === true;
  const loop = props.loop === true;
  const layout = str(props.layout, 'card') === 'minimal' ? 'minimal' : 'card';
  const radius = clampRadius(props.borderRadius ?? 20);

  const tracks = useMemo(() => {
    if (mode === 'playlist') {
      return arr<AudioTrackItem>(props.tracks)
        .map((t, i) => ({
          url: str(t.url),
          title: str(t.title) || `قطعه ${i + 1}`,
          artist: str(t.artist),
          coverImage: str(t.coverImage),
        }))
        .filter((t) => t.url);
    }
    const url = str(props.audioUrl);
    if (!url) return [];
    return [
      {
        url,
        title: str(props.trackTitle) || 'قطعه صوتی',
        artist: str(props.artist),
        coverImage: str(props.coverImage),
      },
    ];
  }, [
    mode,
    props.tracks,
    props.audioUrl,
    props.trackTitle,
    props.artist,
    props.coverImage,
  ]);

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const pendingPlayRef = useRef(false);
  const current = tracks[Math.min(index, Math.max(0, tracks.length - 1))];
  const trackKey = tracks.map((t) => t.url).join('|');

  useEffect(() => {
    setIndex(0);
    setCurrentTime(0);
    setDuration(0);
    setPlaying(false);
    pendingPlayRef.current = autoplay;
    // Reset only when the track list / mode changes — use latest autoplay at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [mode, trackKey]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !current?.url) return;
    el.load();
    setCurrentTime(0);
    const shouldPlay = pendingPlayRef.current;
    pendingPlayRef.current = false;
    if (shouldPlay) {
      void el
        .play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    } else {
      setPlaying(false);
    }
  }, [current?.url]);

  const playPause = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      void el
        .play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    } else {
      el.pause();
      setPlaying(false);
    }
  };

  const seek = (ratio: number) => {
    const el = audioRef.current;
    if (!el || !duration) return;
    el.currentTime = Math.min(duration, Math.max(0, ratio * duration));
  };

  const goTo = (next: number) => {
    if (!tracks.length) return;
    const wrapped = ((next % tracks.length) + tracks.length) % tracks.length;
    if (wrapped === index) {
      const el = audioRef.current;
      if (el) {
        el.currentTime = 0;
        void el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      }
      return;
    }
    pendingPlayRef.current = true;
    setIndex(wrapped);
  };

  if (!tracks.length) {
    return (
      <section className="rounded-2xl border border-dashed border-outline-variant/40 py-12 text-center text-sm text-on-surface-variant">
        فایل صوتی انتخاب نشده است.
      </section>
    );
  }

  const cover = showCover ? current?.coverImage : '';
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

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

      <audio
        ref={audioRef}
        src={current.url}
        preload="metadata"
        loop={mode === 'single' && loop}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          if (mode === 'playlist') {
            if (index < tracks.length - 1) goTo(index + 1);
            else if (loop) goTo(0);
            else setPlaying(false);
          } else if (!loop) {
            setPlaying(false);
          }
        }}
      />

      <div
        className={`w-full max-w-2xl mx-auto border border-outline-variant/25 bg-white dark:bg-surface-dim overflow-hidden ${
          layout === 'card' ? 'shadow-soft' : ''
        }`}
        style={{ borderRadius: radius }}
      >
        <div className={`flex gap-4 ${layout === 'minimal' ? 'p-3.5 items-center' : 'p-4 md:p-5 items-stretch'}`}>
          {showCover && (
            <div
              className={`shrink-0 overflow-hidden bg-surface-container-low flex items-center justify-center ${
                layout === 'minimal' ? 'w-14 h-14 rounded-xl' : 'w-24 h-24 md:w-28 md:h-28 rounded-2xl'
              }`}
            >
              {cover ? (
                <img src={cover} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-3xl text-primary/70">album</span>
              )}
            </div>
          )}

          <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
            <div className="min-w-0">
              <p className="text-sm md:text-base font-black text-on-surface truncate">
                {current.title}
              </p>
              {current.artist && (
                <p className="text-[11px] md:text-xs text-on-surface-variant truncate mt-0.5">
                  {current.artist}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <input
                type="range"
                min={0}
                max={1000}
                value={Math.round(progress * 10)}
                onChange={(e) => seek(Number(e.target.value) / 1000)}
                className="w-full accent-primary h-1.5 cursor-pointer"
                aria-label="پیشرفت پخش"
              />
              <div className="flex justify-between text-[10px] font-bold text-on-surface-variant tabular-nums" dir="ltr">
                <span>{formatAudioTime(currentTime)}</span>
                <span>{formatAudioTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {mode === 'playlist' && (
                <button
                  type="button"
                  onClick={() => goTo(index - 1)}
                  className="w-9 h-9 rounded-full border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container-low"
                  aria-label="قبلی"
                >
                  <span className="material-symbols-outlined text-lg">skip_previous</span>
                </button>
              )}
              <button
                type="button"
                onClick={playPause}
                className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:brightness-105"
                aria-label={playing ? 'توقف' : 'پخش'}
              >
                <span className="material-symbols-outlined text-2xl">
                  {playing ? 'pause' : 'play_arrow'}
                </span>
              </button>
              {mode === 'playlist' && (
                <button
                  type="button"
                  onClick={() => goTo(index + 1)}
                  className="w-9 h-9 rounded-full border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container-low"
                  aria-label="بعدی"
                >
                  <span className="material-symbols-outlined text-lg">skip_next</span>
                </button>
              )}
              {mode === 'playlist' && (
                <span className="mr-auto text-[10px] font-bold text-on-surface-variant">
                  {index + 1} / {tracks.length}
                </span>
              )}
            </div>
          </div>
        </div>

        {mode === 'playlist' && showPlaylist && tracks.length > 1 && (
          <ul className="border-t border-outline-variant/20 max-h-64 overflow-y-auto divide-y divide-outline-variant/15">
            {tracks.map((track, i) => {
              const active = i === index;
              return (
                <li key={`${track.url}-${i}`}>
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-right transition-colors ${
                      active
                        ? 'bg-primary/8 text-primary'
                        : 'hover:bg-surface-container-low text-on-surface'
                    }`}
                  >
                    <span className="w-6 text-[11px] font-black text-on-surface-variant tabular-nums">
                      {active && playing ? (
                        <span className="material-symbols-outlined text-base text-primary">equalizer</span>
                      ) : (
                        i + 1
                      )}
                    </span>
                    {showCover && (
                      <span className="w-9 h-9 rounded-lg overflow-hidden bg-surface-container shrink-0 flex items-center justify-center">
                        {track.coverImage ? (
                          <img src={track.coverImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-base text-on-surface-variant">
                            music_note
                          </span>
                        )}
                      </span>
                    )}
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-bold truncate">{track.title}</span>
                      {track.artist && (
                        <span className="block text-[10px] text-on-surface-variant truncate">
                          {track.artist}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
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

type VerticalGalleryItem = {
  image?: string;
  alt?: string;
  caption?: string;
};

export const VerticalImageGalleryBlock: React.FC<{ props: Record<string, unknown> }> = ({
  props,
}) => {
  const items = arr<VerticalGalleryItem>(props.items).filter((it) => str(it.image));
  const title = str(props.title);
  const sectionSubtitle = str(props.subtitle);
  const radius = clampRadius(props.borderRadius ?? 20);
  const shadow = props.shadow !== false;
  const clickBehavior = str(props.clickBehavior, 'lightbox');
  const columnAnimate = props.columnAnimate !== false;
  // Seconds for one full loop of a column's image set (slower = larger).
  const loopSeconds = Math.min(60, Math.max(8, Number(props.animateSpeed) || 28));
  const maxHeight = Math.min(900, Math.max(280, Number(props.maxHeight) || 560));
  const gap = str(props.gap, 'md');
  const gapPx = gap === 'sm' ? 8 : gap === 'lg' ? 20 : 14;
  const band = useDeviceBand();
  const cols = readResponsiveCols(
    props.columnsMobile,
    props.columnsTablet,
    props.columnsDesktop,
    { mobile: 1, tablet: 2, desktop: 2 }
  );
  const columnCount = band === 'mobile' ? cols.mobile : band === 'tablet' ? cols.tablet : cols.desktop;

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const lightboxItems: LightboxItem[] = items.map((it) => ({
    src: str(it.image),
    alt: str(it.alt) || str(it.caption),
    caption: str(it.caption),
  }));

  if (!items.length) {
    return (
      <section className="rounded-2xl border border-dashed border-outline-variant/40 py-12 text-center text-sm text-on-surface-variant">
        هنوز تصویری برای گالری عمودی تعریف نشده است.
      </section>
    );
  }

  // Round-robin into columns so adjacent columns can scroll opposite directions.
  const columns: Array<Array<{ item: VerticalGalleryItem; globalIndex: number }>> = Array.from(
    { length: columnCount },
    () => []
  );
  items.forEach((item, idx) => {
    columns[idx % columnCount].push({ item, globalIndex: idx });
  });

  const renderTile = (item: VerticalGalleryItem, globalIndex: number) => {
    const src = str(item.image);
    const cap = str(item.caption);
    const alt = str(item.alt) || cap || `تصویر ${globalIndex + 1}`;

    const tile = (
      <div
        className={`relative overflow-hidden bg-surface-container group ${
          shadow ? 'shadow-soft border border-outline-variant/20' : ''
        } ${clickBehavior === 'lightbox' ? 'cursor-zoom-in' : ''}`}
        style={{ borderRadius: radius }}
      >
        <img
          src={src}
          alt={alt}
          className={`w-full h-auto block transition-transform duration-500 ${
            clickBehavior === 'lightbox' ? 'group-hover:scale-[1.03]' : ''
          }`}
          loading="lazy"
          draggable={false}
        />
        {cap && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent px-3 py-2.5 pt-8 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-white text-xs font-bold line-clamp-2">{cap}</p>
          </div>
        )}
        {clickBehavior === 'lightbox' && (
          <span className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <span className="material-symbols-outlined text-base">zoom_in</span>
          </span>
        )}
      </div>
    );

    if (clickBehavior === 'lightbox') {
      return (
        <button
          type="button"
          className="block w-full text-right"
          onClick={() => {
            setLightboxIndex(globalIndex);
            setLightboxOpen(true);
          }}
        >
          {tile}
        </button>
      );
    }
    return tile;
  };

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

      <div
        className={`vertical-column-gallery flex items-start ${
          columnAnimate ? 'vertical-column-gallery--loop' : ''
        }`}
        style={{
          gap: gapPx,
          ...(columnAnimate ? { height: maxHeight } : {}),
        }}
      >
        {columns.map((column, colIdx) => {
          if (!column.length) return null;

          if (!columnAnimate) {
            return (
              <div
                key={colIdx}
                className="vertical-column-gallery__col flex-1 min-w-0 flex flex-col"
                style={{ gap: gapPx }}
              >
                {column.map(({ item, globalIndex }) => (
                  <figure key={`${str(item.image)}-${globalIndex}`} className="min-w-0">
                    {renderTile(item, globalIndex)}
                  </figure>
                ))}
              </div>
            );
          }

          // Build one loop unit (repeat short columns), then duplicate it once
          // so translateY(-50%) lands on an identical frame.
          const unitCopies = Math.max(1, Math.ceil(3 / column.length));
          const unit = Array.from({ length: unitCopies }, () => column).flat();
          const loopItems = [...unit, ...unit];
          const goesUp = colIdx % 2 === 0;

          return (
            <div key={colIdx} className="vertical-column-gallery__viewport flex-1 min-w-0">
              <div
                className={`vertical-column-gallery__track ${goesUp ? 'is-up' : 'is-down'}`}
                style={
                  {
                    ['--vg-duration' as string]: `${loopSeconds}s`,
                  } as React.CSSProperties
                }
              >
                {loopItems.map(({ item, globalIndex }, i) => (
                  <figure
                    key={`c${colIdx}-${i}-${str(item.image)}-${globalIndex}`}
                    className="min-w-0 shrink-0"
                    style={{ marginBottom: gapPx }}
                    aria-hidden={i >= unit.length ? true : undefined}
                  >
                    {renderTile(item, globalIndex)}
                  </figure>
                ))}
              </div>
            </div>
          );
        })}
      </div>

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

export const BeforeAfterBlock: React.FC<{ props: Record<string, unknown> }> = ({ props }) => {
  const beforeImage = str(props.beforeImage);
  const afterImage = str(props.afterImage);
  const title = str(props.title);
  const sectionSubtitle = str(props.subtitle);
  const caption = str(props.caption);
  const beforeLabel = str(props.beforeLabel, 'قبل');
  const afterLabel = str(props.afterLabel, 'بعد');
  const beforeAlt = str(props.beforeAlt) || beforeLabel || 'قبل';
  const afterAlt = str(props.afterAlt) || afterLabel || 'بعد';
  const showLabels = props.showLabels !== false;
  const orientation = str(props.orientation, 'horizontal') === 'vertical' ? 'vertical' : 'horizontal';
  const widthMode = str(props.widthMode, 'full');
  const aspectRaw = str(props.aspect, 'video');
  const aspect = aspectRaw === 'auto' || aspectRaw === 'original' ? 'video' : aspectRaw;
  const objectFit = str(props.objectFit, 'cover') === 'contain' ? 'object-contain' : 'object-cover';
  const radius = clampRadius(props.borderRadius);
  const align = str(props.align, 'center');
  const shadow = props.shadow !== false;
  const initial = Math.min(90, Math.max(10, Number(props.initialPosition) || 50));

  const [position, setPosition] = useState(initial);
  const [dragging, setDragging] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPosition(initial);
  }, [initial, beforeImage, afterImage]);

  const updateFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const el = frameRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      let next: number;
      if (orientation === 'vertical') {
        next = ((clientY - rect.top) / rect.height) * 100;
      } else {
        next = ((clientX - rect.left) / rect.width) * 100;
      }
      setPosition(Math.min(95, Math.max(5, next)));
    },
    [orientation]
  );

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => updateFromClient(e.clientX, e.clientY);
    const onUp = () => setDragging(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragging, updateFromClient]);

  const justify =
    align === 'start' ? 'justify-start' : align === 'end' ? 'justify-end' : 'justify-center';
  const width = resolveImageWidth(
    widthMode,
    Number(props.widthPercent) || 100,
    Number(props.widthPx) || 800
  );
  const aspectCls = imageAspectClass(aspect) || 'aspect-video';

  if (!beforeImage && !afterImage) {
    return (
      <section className="rounded-2xl border border-dashed border-outline-variant/40 py-12 text-center text-sm text-on-surface-variant">
        تصاویر قبل و بعد انتخاب نشده‌اند.
      </section>
    );
  }

  const clipStyle: React.CSSProperties =
    orientation === 'vertical'
      ? { clipPath: `inset(0 0 ${100 - position}% 0)` }
      : { clipPath: `inset(0 ${100 - position}% 0 0)` };

  const handleStyle: React.CSSProperties =
    orientation === 'vertical'
      ? { top: `${position}%`, left: 0, right: 0, transform: 'translateY(-50%)' }
      : { left: `${position}%`, top: 0, bottom: 0, transform: 'translateX(-50%)' };

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

      <div className={`w-full min-w-0 flex ${justify}`}>
        <figure className="min-w-0 space-y-2" style={{ width, maxWidth: '100%' }} dir="ltr">
          <div
            ref={frameRef}
            className={`relative overflow-hidden select-none touch-none bg-surface-container ${aspectCls} ${
              shadow ? 'shadow-soft border border-outline-variant/25' : ''
            } ${dragging ? 'cursor-grabbing' : 'cursor-col-resize'}`}
            style={{ borderRadius: radius }}
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              e.preventDefault();
              setDragging(true);
              updateFromClient(e.clientX, e.clientY);
            }}
            role="slider"
            aria-valuemin={5}
            aria-valuemax={95}
            aria-valuenow={Math.round(position)}
            aria-label="مقایسه تصویر قبل و بعد"
            tabIndex={0}
            onKeyDown={(e) => {
              const step = e.shiftKey ? 10 : 3;
              if (orientation === 'vertical') {
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setPosition((p) => Math.max(5, p - step));
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setPosition((p) => Math.min(95, p + step));
                }
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                setPosition((p) => Math.max(5, p - step));
              } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                setPosition((p) => Math.min(95, p + step));
              }
            }}
          >
            {afterImage ? (
              <img
                src={afterImage}
                alt={afterAlt}
                className={`absolute inset-0 w-full h-full ${objectFit} pointer-events-none`}
                draggable={false}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-on-surface-variant bg-surface-container-low">
                تصویر بعد موجود نیست
              </div>
            )}

            {beforeImage ? (
              <div className="absolute inset-0" style={clipStyle}>
                <img
                  src={beforeImage}
                  alt={beforeAlt}
                  className={`absolute inset-0 w-full h-full ${objectFit} pointer-events-none`}
                  draggable={false}
                />
              </div>
            ) : null}

            {showLabels && (
              <>
                {beforeLabel && (
                  <span
                    className={`absolute z-[2] px-2.5 py-1 rounded-lg bg-black/55 text-white text-[10px] md:text-xs font-bold backdrop-blur-sm pointer-events-none ${
                      orientation === 'vertical' ? 'top-3 right-3' : 'top-3 left-3'
                    }`}
                  >
                    {beforeLabel}
                  </span>
                )}
                {afterLabel && (
                  <span
                    className={`absolute z-[2] px-2.5 py-1 rounded-lg bg-black/55 text-white text-[10px] md:text-xs font-bold backdrop-blur-sm pointer-events-none ${
                      orientation === 'vertical' ? 'bottom-3 right-3' : 'top-3 right-3'
                    }`}
                  >
                    {afterLabel}
                  </span>
                )}
              </>
            )}

            <div
              className={`absolute z-[3] pointer-events-none ${
                orientation === 'vertical' ? 'h-0.5 bg-white/90' : 'w-0.5 bg-white/90'
              }`}
              style={handleStyle}
            >
              <span
                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white text-on-surface shadow-md border border-black/10 flex items-center justify-center ${
                  dragging ? 'scale-105' : ''
                }`}
              >
                <span className="material-symbols-outlined text-lg">
                  {orientation === 'vertical' ? 'swap_vert' : 'swap_horiz'}
                </span>
              </span>
            </div>
          </div>

          {caption && (
            <figcaption className="text-xs text-on-surface-variant leading-relaxed px-0.5 text-center" dir="rtl">
              {caption}
            </figcaption>
          )}
        </figure>
      </div>
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

export const ContainerBlock: React.FC<{
  props: Record<string, unknown>;
  blockId?: string;
  ctx: BlockRenderContext;
  previewMode?: boolean;
  selectedBlockId?: string | null;
  selectedColumnId?: string | null;
  onSelectBlock?: (id: string) => void;
  onSelectColumn?: (containerId: string, columnId: string) => void;
  onContextMenuBlock?: (e: React.MouseEvent, blockId: string) => void;
  onUpdateBlockProps?: (id: string, props: Record<string, unknown>) => void;
  onMoveNestedBlock?: (
    containerId: string,
    fromCol: number,
    fromIndex: number,
    toCol: number,
    toIndex: number
  ) => void;
}> = ({
  props,
  blockId,
  ctx,
  previewMode,
  selectedBlockId,
  selectedColumnId,
  onSelectBlock,
  onSelectColumn,
  onContextMenuBlock,
  onUpdateBlockProps,
  onMoveNestedBlock,
}) => {
  const columnCount = resolveContainerColumnCount(props);
  const gap = str(props.gap, 'md');
  const background = str(props.background, 'none');
  const deviceBand = useDeviceBand();
  const previewDevice = useBuilderDevicePreview();
  const { mobile, tablet, desktop } = readResponsiveCols(
    props.columnsMobile,
    props.columnsTablet,
    props.columnsDesktop ?? props.columnCount,
    { mobile: 1, tablet: Math.min(2, columnCount), desktop: columnCount }
  );
  const displayCols: ColCount =
    previewDevice === 'mobile'
      ? mobile
      : previewDevice === 'tablet'
        ? tablet
        : previewDevice === 'desktop'
          ? desktop
          : typeof window !== 'undefined'
            ? resolveColsForWidth(window.innerWidth, mobile, tablet, desktop)
            : desktop;

  let columns = arr<unknown>(props.columns).map((raw, i) => normalizeContainerColumn(raw, i));
  if (columns.length < columnCount) {
    columns = [
      ...columns,
      ...Array.from({ length: columnCount - columns.length }, (_, i) =>
        normalizeContainerColumn({}, columns.length + i)
      ),
    ];
  }
  columns = columns.slice(0, columnCount);

  const gapClass = gap === 'sm' ? 'gap-3' : gap === 'lg' ? 'gap-6 sm:gap-8' : 'gap-4 sm:gap-5';

  const { padX, padY } = resolveContainerPadding(props, deviceBand);
  const { marginTop, marginBottom } = resolveContainerMargin(props, deviceBand);
  const radiusRaw = Number(props.borderRadius);
  const borderRadius = Number.isFinite(radiusRaw)
    ? Math.max(0, Math.min(64, Math.round(radiusRaw)))
    : 28;

  const shadowValue =
    props.shadow !== undefined && props.shadow !== null
      ? String(props.shadow)
      : background === 'white'
        ? 'md'
        : 'none';
  const shadowKey =
    props.shadow === true ? 'md' : props.shadow === false ? 'none' : shadowValue;
  const shadowClass =
    shadowKey === 'sm'
      ? 'shadow-sm'
      : shadowKey === 'md'
        ? 'shadow-soft'
        : shadowKey === 'lg'
          ? 'shadow-xl'
          : '';

  const bgColor = str(props.backgroundColor, '#f1f5f9');
  const bgImage = str(props.backgroundImage);
  const overlay = Math.max(0, Math.min(80, Number(props.backgroundOverlay ?? 40)));

  const bgClass =
    background === 'soft'
      ? 'bg-surface-container-low border border-outline-variant/30'
      : background === 'white'
        ? 'bg-white dark:bg-surface-dim border border-outline-variant/30'
        : '';

  const widthMode = str(props.widthMode, 'contained');
  const maxWidthRaw = Number(props.maxWidth);
  const maxWidth =
    Number.isFinite(maxWidthRaw) && maxWidthRaw > 0 ? maxWidthRaw : DEFAULT_CONTENT_MAX_WIDTH;
  const widthStyle = containerWidthStyle(widthMode, maxWidth);
  const canDragNested = Boolean(previewMode && blockId && onMoveNestedBlock);

  const hasCustomWidths = columns.some((c) => (c.widthMode || 'auto') !== 'auto');
  const columnsDirection = resolveColumnsDirection(props, deviceBand);
  const isVerticalDirection =
    columnsDirection === 'column' || columnsDirection === 'column-reverse';
  const templateColumns =
    !isVerticalDirection && hasCustomWidths && displayCols >= columns.length
      ? columns.map((c) => resolveColumnTrack(c)).join(' ')
      : undefined;

  const sectionStyle: React.CSSProperties = {
    ...widthStyle,
    borderRadius,
    paddingInline: padX,
    paddingBlock: padY,
    marginTop: marginTop || undefined,
    marginBottom: marginBottom || undefined,
    ...(background === 'color' ? { backgroundColor: bgColor } : {}),
  };

  const grid = (
    <ResponsiveGrid
      columnsMobile={props.columnsMobile}
      columnsTablet={props.columnsTablet}
      columnsDesktop={props.columnsDesktop ?? props.columnCount}
      fallbacks={{ mobile: 1, tablet: Math.min(2, columnCount), desktop: columnCount }}
      className={gapClass}
      templateColumns={templateColumns}
      direction={columnsDirection}
    >
      {columns.map((col, colIdx) => {
        const colBlocks = col.blocks || [];
        const colSelected = Boolean(
          previewMode && selectedColumnId && selectedColumnId === col.id
        );
        const colBoxStyle = resolveColumnBoxStyle(col);
        const hasColBg = Boolean((col.backgroundColor || '').trim());

        return (
          <div
            key={col.id || colIdx}
            dir="rtl"
            className={`min-w-0 flex flex-col gap-4 ${
              isVerticalDirection ? 'w-full shrink-0' : 'h-full'
            } ${
              previewMode
                ? `rounded-2xl border border-dashed p-0.5 min-h-[80px] cursor-pointer transition-all ${
                    colSelected
                      ? 'border-teal-500 bg-teal-50/40 ring-2 ring-teal-500/40'
                      : 'border-primary/25 hover:border-teal-400/60'
                  }`
                : ''
            } ${hasColBg || (col.borderRadius || 0) > 0 ? 'overflow-hidden' : ''}`}
            style={colBoxStyle}
            onClick={(e) => {
              if (!previewMode || !blockId || !onSelectColumn) return;
              e.stopPropagation();
              onSelectColumn(blockId, col.id);
            }}
            onDragOver={(e) => {
              if (!canDragNested) return;
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              if (!canDragNested || !blockId || !onMoveNestedBlock) return;
              const raw = e.dataTransfer.getData('application/x-zhino-nested');
              if (!raw) return;
              e.preventDefault();
              e.stopPropagation();
              try {
                const payload = JSON.parse(raw) as {
                  containerId: string;
                  columnIndex: number;
                  blockIndex: number;
                };
                if (payload.containerId !== blockId) return;
                onMoveNestedBlock(
                  blockId,
                  payload.columnIndex,
                  payload.blockIndex,
                  colIdx,
                  colBlocks.length
                );
              } catch {
                /* ignore */
              }
            }}
          >
            {previewMode && (
              <p className="text-[10px] font-bold text-primary/70 shrink-0 px-1 pt-1">
                ستون {colIdx + 1}
                {colBlocks.length > 0 ? ` · ${colBlocks.length} ویجت` : ''}
                {(col.widthMode || 'auto') !== 'auto'
                  ? ` · ${col.widthValue}${col.widthMode === 'percent' ? '%' : col.widthMode}`
                  : ''}
              </p>
            )}
            {colBlocks.map((child, childIndex) => {
              const selected = previewMode && selectedBlockId === child.id;
              const childAnim = getBlockScrollAnimation(child.props);
              const childContent = renderServiceBlock(child, ctx, {
                previewMode,
                selectedBlockId,
                onSelectBlock,
                onContextMenuBlock,
                onUpdateBlockProps,
              });
              return (
                <div
                  key={child.id}
                  draggable={canDragNested}
                  onDragStart={(e) => {
                    if (!canDragNested || !blockId) return;
                    e.stopPropagation();
                    e.dataTransfer.setData(
                      'application/x-zhino-nested',
                      JSON.stringify({
                        containerId: blockId,
                        columnIndex: colIdx,
                        blockIndex: childIndex,
                      })
                    );
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(e) => {
                    if (!canDragNested) return;
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    if (!canDragNested || !blockId || !onMoveNestedBlock) return;
                    const raw = e.dataTransfer.getData('application/x-zhino-nested');
                    if (!raw) return;
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                      const payload = JSON.parse(raw) as {
                        containerId: string;
                        columnIndex: number;
                        blockIndex: number;
                      };
                      if (payload.containerId !== blockId) return;
                      onMoveNestedBlock(
                        blockId,
                        payload.columnIndex,
                        payload.blockIndex,
                        colIdx,
                        childIndex
                      );
                    } catch {
                      /* ignore */
                    }
                  }}
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
                      ? `relative w-full rounded-2xl transition-all cursor-pointer ${
                          selected
                            ? 'ring-2 ring-teal-500 ring-offset-2'
                            : 'hover:ring-1 hover:ring-teal-400/50'
                        } ${canDragNested ? 'cursor-grab active:cursor-grabbing' : ''} ${
                          col.alignH === 'stretch' ? '' : 'max-w-full'
                        }`
                      : col.alignH === 'stretch'
                        ? 'w-full'
                        : 'max-w-full'
                  }
                >
                  {canDragNested && (
                    <div className="absolute -top-2 left-2 z-10 flex items-center gap-0.5 rounded-full bg-white/95 dark:bg-surface-dim border border-outline-variant/30 shadow px-1.5 py-0.5 pointer-events-none">
                      <span className="material-symbols-outlined text-sm text-outline-variant">
                        drag_indicator
                      </span>
                    </div>
                  )}
                  {previewMode ? (
                    childContent
                  ) : (
                    <ScrollReveal enabled={childAnim.enabled} type={childAnim.type}>
                      {childContent}
                    </ScrollReveal>
                  )}
                </div>
              );
            })}
            {!colBlocks.length && previewMode && (
              <p className="text-[11px] text-on-surface-variant text-center py-6">
                خالی — انتخاب کنید تا تنظیمات ستون را ببینید
              </p>
            )}
          </div>
        );
      })}
    </ResponsiveGrid>
  );

  return (
    <section
      className={`relative ${
        background === 'image' || borderRadius > 0 ? 'overflow-hidden' : ''
      } ${bgClass} ${shadowClass}`}
      style={sectionStyle}
    >
      {background === 'image' && bgImage && (
        <>
          <img
            src={bgImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            aria-hidden
          />
          {overlay > 0 && (
            <div
              className="absolute inset-0 bg-slate-950 pointer-events-none"
              style={{ opacity: overlay / 100 }}
              aria-hidden
            />
          )}
        </>
      )}
      <div className={background === 'image' && bgImage ? 'relative z-10' : undefined}>{grid}</div>
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

type ContactCardItem = {
  icon?: string;
  title?: string;
  body?: string;
  note?: string;
  link?: string;
  linkLabel?: string;
  accent?: string;
  dir?: string;
};

const CONTACT_CARD_ACCENT: Record<string, { soft: string; text: string; ring: string; hover: string }> = {
  primary: {
    soft: 'bg-primary/10 text-primary',
    text: 'text-primary',
    ring: 'group-hover:border-primary/40 group-hover:shadow-primary/10',
    hover: 'group-hover:bg-primary group-hover:text-white',
  },
  secondary: {
    soft: 'bg-secondary/10 text-secondary',
    text: 'text-secondary',
    ring: 'group-hover:border-secondary/40 group-hover:shadow-secondary/10',
    hover: 'group-hover:bg-secondary group-hover:text-white',
  },
  tertiary: {
    soft: 'bg-tertiary/10 text-tertiary',
    text: 'text-tertiary',
    ring: 'group-hover:border-tertiary/40 group-hover:shadow-tertiary/10',
    hover: 'group-hover:bg-tertiary group-hover:text-white',
  },
  emerald: {
    soft: 'bg-emerald-500/10 text-emerald-700',
    text: 'text-emerald-700',
    ring: 'group-hover:border-emerald-500/40 group-hover:shadow-emerald-500/10',
    hover: 'group-hover:bg-emerald-600 group-hover:text-white',
  },
  rose: {
    soft: 'bg-rose-500/10 text-rose-600',
    text: 'text-rose-600',
    ring: 'group-hover:border-rose-500/40 group-hover:shadow-rose-500/10',
    hover: 'group-hover:bg-rose-600 group-hover:text-white',
  },
  amber: {
    soft: 'bg-amber-500/10 text-amber-700',
    text: 'text-amber-700',
    ring: 'group-hover:border-amber-500/40 group-hover:shadow-amber-500/10',
    hover: 'group-hover:bg-amber-600 group-hover:text-white',
  },
};

const CONTACT_CARD_ACCENT_CYCLE = ['primary', 'secondary', 'tertiary', 'emerald', 'rose', 'amber'] as const;

function legacyContactCardItems(props: Record<string, unknown>): ContactCardItem[] {
  const phoneLines = [str(props.phone1), str(props.phone2)].filter(Boolean).join('\n');
  return [
    {
      icon: 'location_on',
      title: 'آدرس حضوری',
      body: str(props.address),
      note: str(props.addressNote),
      accent: 'primary',
      dir: 'rtl',
    },
    {
      icon: 'call',
      title: 'شماره‌های تلفن',
      body: phoneLines,
      note: str(props.hours),
      accent: 'secondary',
      dir: 'ltr',
    },
    {
      icon: 'mail',
      title: 'ایمیل',
      body: str(props.email, 'info@zhinoclinic.ir'),
      note: 'پاسخ‌گویی در ساعات اداری',
      accent: 'tertiary',
      dir: 'ltr',
    },
  ];
}

function resolveContactCardItems(props: Record<string, unknown>): ContactCardItem[] {
  const raw = arr<ContactCardItem>(props.items);
  if (raw.length > 0) return raw;
  if (props.address || props.phone1 || props.email) return legacyContactCardItems(props);
  return [];
}

export const ContactCardsBlock: React.FC<{ props: Record<string, unknown> }> = ({ props }) => {
  const items = resolveContactCardItems(props);
  const filled = props.iconFilled !== false;

  if (!items.length) {
    return (
      <section className="rounded-3xl border border-dashed border-outline-variant/40 p-8 text-center text-sm text-on-surface-variant">
        هنوز کارتی اضافه نشده است.
      </section>
    );
  }

  return (
    <section className="space-y-6 w-full min-w-0">
      {(str(props.title) || str(props.subtitle)) && (
        <div className="space-y-2 text-right">
          {str(props.title) && (
            <h2 className="text-2xl md:text-3xl font-black text-on-surface">{str(props.title)}</h2>
          )}
          {str(props.subtitle) && (
            <p className="text-sm text-on-surface-variant max-w-2xl leading-relaxed">
              {str(props.subtitle)}
            </p>
          )}
        </div>
      )}

      <ResponsiveGrid
        columnsMobile={props.columnsMobile}
        columnsTablet={props.columnsTablet}
        columnsDesktop={props.columnsDesktop}
        fallbacks={{ mobile: 1, tablet: 2, desktop: 3 }}
        className="gap-4 sm:gap-6"
      >
        {items.map((item, idx) => {
          const accentKey =
            str(item.accent) || CONTACT_CARD_ACCENT_CYCLE[idx % CONTACT_CARD_ACCENT_CYCLE.length];
          const accent = CONTACT_CARD_ACCENT[accentKey] || CONTACT_CARD_ACCENT.primary;
          const icon = str(item.icon, 'contact_mail');
          const title = str(item.title, 'کارت تماس');
          const body = str(item.body);
          const note = str(item.note);
          const link = str(item.link);
          const linkLabel = str(item.linkLabel, 'مشاهده');
          const dir = str(item.dir, 'auto') as 'rtl' | 'ltr' | 'auto';
          const lines = body
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);
          const isExternal = /^https?:\/\//i.test(link);

          const cardInner = (
            <>
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-300 ${accent.soft} ${accent.hover}`}
                >
                  <span
                    className="material-symbols-outlined text-[26px] leading-none"
                    style={{
                      fontVariationSettings: filled
                        ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 40"
                        : undefined,
                    }}
                  >
                    {icon}
                  </span>
                </div>
                {link && (
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${accent.soft}`}
                  >
                    <span className="material-symbols-outlined text-base">arrow_outward</span>
                  </span>
                )}
              </div>

              <div className="space-y-2.5 flex-1">
                <h3 className="text-lg font-black text-on-surface leading-snug">{title}</h3>
                {lines.length > 0 && (
                  <div
                    className="space-y-1 text-sm font-bold text-on-surface leading-relaxed"
                    dir={dir === 'auto' ? undefined : dir}
                  >
                    {lines.map((line, lineIdx) => (
                      <p key={lineIdx} className="break-words">
                        {line}
                      </p>
                    ))}
                  </div>
                )}
                {note && (
                  <p className={`text-xs font-extrabold pt-1 ${accent.text}`}>{note}</p>
                )}
              </div>

              {link && (
                <span className={`inline-flex items-center gap-1 text-xs font-extrabold mt-auto ${accent.text}`}>
                  {linkLabel}
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </span>
              )}
            </>
          );

          const cardClass = `group relative flex flex-col gap-4 bg-white dark:bg-surface-dim p-6 sm:p-7 rounded-[28px] border border-outline-variant/30 shadow-soft min-w-0 h-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${accent.ring}`;

          if (link) {
            return (
              <a
                key={idx}
                href={link}
                {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className={`${cardClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40`}
              >
                {cardInner}
              </a>
            );
          }

          return (
            <div key={idx} className={cardClass}>
              {cardInner}
            </div>
          );
        })}
      </ResponsiveGrid>
    </section>
  );
};

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

export const ContactFormBlock: React.FC<{
  props: Record<string, unknown>;
  ctx?: BlockRenderContext;
}> = ({ props, ctx }) => {
  const formId = str(props.formId, DEFAULT_CONTACT_FORM_ID);
  const [form, setForm] = useState<FormDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, FormAnswerValue>>({});
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    void fetchForm(formId).then((data) => {
      if (cancelled) return;
      if (!data || data.enabled === false) {
        setForm(null);
        setLoadError('فرم در دسترس نیست.');
      } else {
        setForm(data);
        const initial: Record<string, FormAnswerValue> = {};
        for (const field of data.fields || []) {
          if (field.type === 'description') continue;
          if (field.type === 'checkbox') initial[field.id] = false;
          else if (field.type === 'checkboxGroup') initial[field.id] = [];
          else if (field.type === 'select' || field.type === 'radio') {
            initial[field.id] = field.options?.[0]?.id || '';
          } else {
            initial[field.id] = '';
          }
        }
        setAnswers(initial);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [formId]);

  const setAnswer = (fieldId: string, value: FormAnswerValue) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  const toggleCheckboxGroup = (fieldId: string, optionId: string) => {
    setAnswers((prev) => {
      const current = Array.isArray(prev[fieldId]) ? (prev[fieldId] as string[]) : [];
      const next = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      return { ...prev, [fieldId]: next };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    for (const field of form.fields || []) {
      if (field.type === 'description' || !field.required) continue;
      const value = answers[field.id];
      const empty =
        value == null ||
        (typeof value === 'boolean' && !value) ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === 'string' && !value.trim());
      if (empty) {
        alert(`لطفاً فیلد «${field.label}» را تکمیل کنید.`);
        return;
      }
    }

    setIsSending(true);
    try {
      const result = await submitForm(form.id, {
        answers,
        pageId: ctx?.pageId,
        pageSlug: ctx?.pageSlug,
      });
      setSuccessMessage(result.message || form.successMessage || 'پیام شما با موفقیت ثبت شد.');
      setSentSuccess(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'ارسال فرم ناموفق بود.');
    } finally {
      setIsSending(false);
    }
  };

  const inputClass =
    'w-full p-3 rounded-xl border border-outline-variant/40 bg-surface-container-low';

  const renderField = (field: FormField) => {
    if (field.type === 'description') {
      return (
        <div
          key={field.id}
          className="p-3 rounded-xl bg-surface-container-low/60 text-on-surface-variant text-xs leading-relaxed"
        >
          <p className="font-bold text-on-surface mb-1">{field.label}</p>
          {field.helpText ? <p>{field.helpText}</p> : null}
        </div>
      );
    }

    const label = (
      <span className="font-bold">
        {field.label}
        {field.required ? ' *' : ''}
      </span>
    );

    const help = field.helpText ? (
      <span className="text-[10px] text-on-surface-variant">{field.helpText}</span>
    ) : null;

    if (field.type === 'textarea') {
      return (
        <label key={field.id} className="block space-y-1">
          {label}
          <textarea
            rows={4}
            value={String(answers[field.id] ?? '')}
            placeholder={field.placeholder || ''}
            onChange={(e) => setAnswer(field.id, e.target.value)}
            className={inputClass}
          />
          {help}
        </label>
      );
    }

    if (field.type === 'select') {
      return (
        <label key={field.id} className="block space-y-1">
          {label}
          <select
            value={String(answers[field.id] ?? '')}
            onChange={(e) => setAnswer(field.id, e.target.value)}
            className={inputClass}
          >
            {(field.options || []).map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          {help}
        </label>
      );
    }

    if (field.type === 'radio') {
      return (
        <fieldset key={field.id} className="space-y-2">
          <legend className="font-bold">
            {field.label}
            {field.required ? ' *' : ''}
          </legend>
          <div className="space-y-1.5">
            {(field.options || []).map((opt) => (
              <label key={opt.id} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={field.id}
                  checked={answers[field.id] === opt.id}
                  onChange={() => setAnswer(field.id, opt.id)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
          {help}
        </fieldset>
      );
    }

    if (field.type === 'checkbox') {
      return (
        <label key={field.id} className="flex items-start gap-2">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={!!answers[field.id]}
            onChange={(e) => setAnswer(field.id, e.target.checked)}
          />
          <span>
            <span className="font-bold">
              {field.label}
              {field.required ? ' *' : ''}
            </span>
            {help}
          </span>
        </label>
      );
    }

    if (field.type === 'checkboxGroup') {
      const selected = Array.isArray(answers[field.id]) ? (answers[field.id] as string[]) : [];
      return (
        <fieldset key={field.id} className="space-y-2">
          <legend className="font-bold">
            {field.label}
            {field.required ? ' *' : ''}
          </legend>
          <div className="space-y-1.5">
            {(field.options || []).map((opt) => (
              <label key={opt.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected.includes(opt.id)}
                  onChange={() => toggleCheckboxGroup(field.id, opt.id)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
          {help}
        </fieldset>
      );
    }

    const inputType =
      field.type === 'email'
        ? 'email'
        : field.type === 'tel'
          ? 'tel'
          : field.type === 'number'
            ? 'number'
            : field.type === 'date'
              ? 'date'
              : 'text';

    return (
      <label key={field.id} className="block space-y-1">
        {label}
        <input
          type={inputType}
          value={String(answers[field.id] ?? '')}
          placeholder={field.placeholder || ''}
          dir={field.type === 'tel' || field.type === 'email' ? 'ltr' : undefined}
          onChange={(e) => setAnswer(field.id, e.target.value)}
          className={`${inputClass}${
            field.type === 'tel' || field.type === 'email' ? ' text-left' : ''
          }`}
        />
        {help}
      </label>
    );
  };

  const title = str(props.title) || form?.name || 'ارسال پیام';
  const subtitle = str(props.subtitle) || form?.description || '';

  return (
    <section className="bg-white dark:bg-surface-dim p-8 md:p-10 rounded-[36px] border border-outline-variant/30 shadow-soft space-y-5 max-w-3xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black text-primary">{title}</h2>
        {subtitle ? <p className="text-xs text-on-surface-variant">{subtitle}</p> : null}
      </div>
      {loading ? (
        <p className="text-center text-xs text-on-surface-variant py-6">در حال بارگذاری فرم…</p>
      ) : loadError || !form ? (
        <p className="text-center text-xs text-rose-700 py-6">{loadError || 'فرم یافت نشد.'}</p>
      ) : sentSuccess ? (
        <div className="p-6 rounded-2xl bg-emerald-50 text-emerald-800 text-sm font-bold text-center space-y-2">
          <span className="material-symbols-outlined text-3xl">check_circle</span>
          <p>{successMessage}</p>
          <button
            type="button"
            className="underline text-xs"
            onClick={() => {
              setSentSuccess(false);
              const initial: Record<string, FormAnswerValue> = {};
              for (const field of form.fields || []) {
                if (field.type === 'description') continue;
                if (field.type === 'checkbox') initial[field.id] = false;
                else if (field.type === 'checkboxGroup') initial[field.id] = [];
                else if (field.type === 'select' || field.type === 'radio') {
                  initial[field.id] = field.options?.[0]?.id || '';
                } else {
                  initial[field.id] = '';
                }
              }
              setAnswers(initial);
            }}
          >
            ارسال پیام دیگر
          </button>
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 text-right text-xs">
          {(form.fields || []).map((field) => renderField(field))}
          <button
            type="submit"
            disabled={isSending}
            className="w-full py-3.5 rounded-2xl bg-primary text-white font-black disabled:opacity-60"
          >
            {isSending ? 'در حال ارسال...' : form.submitLabel || 'ارسال'}
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
    selectedColumnId?: string | null;
    onSelectBlock?: (id: string) => void;
    onSelectColumn?: (containerId: string, columnId: string) => void;
    onContextMenuBlock?: (e: React.MouseEvent, blockId: string) => void;
    onUpdateBlockProps?: (id: string, props: Record<string, unknown>) => void;
    onMoveNestedBlock?: (
      containerId: string,
      fromCol: number,
      fromIndex: number,
      toCol: number,
      toIndex: number
    ) => void;
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
      return <ContactFormBlock props={block.props} ctx={ctx} />;
    case 'articlesGrid':
      return <ArticlesGridBlock props={block.props} ctx={ctx} />;
    case 'cta':
      return <CtaBlock props={block.props} ctx={ctx} />;
    case 'richText':
      return (
        <RichTextBlock
          props={block.props}
          editable={options?.previewMode && options.selectedBlockId === block.id}
          onHtmlChange={
            options?.onUpdateBlockProps
              ? (html) => options.onUpdateBlockProps?.(block.id, { ...block.props, html })
              : undefined
          }
        />
      );
    case 'htmlCode':
      return <HtmlCodeBlock props={block.props} />;
    case 'imageCarousel':
      return <ImageCarouselBlock props={block.props} />;
    case 'videoPlayer':
      return <VideoPlayerBlock props={block.props} />;
    case 'audioPlayer':
      return <AudioPlayerBlock props={block.props} />;
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
    case 'verticalImageGallery':
      return <VerticalImageGalleryBlock props={block.props} />;
    case 'beforeAfter':
      return <BeforeAfterBlock props={block.props} />;
    case 'googleMap':
      return <GoogleMapBlock props={block.props} />;
    case 'tabGallery':
      return <TabGalleryBlock props={block.props} />;
    case 'container':
      return (
        <ContainerBlock
          props={block.props}
          blockId={block.id}
          ctx={ctx}
          previewMode={options?.previewMode}
          selectedBlockId={options?.selectedBlockId}
          selectedColumnId={options?.selectedColumnId}
          onSelectBlock={options?.onSelectBlock}
          onSelectColumn={options?.onSelectColumn}
          onContextMenuBlock={options?.onContextMenuBlock}
          onUpdateBlockProps={options?.onUpdateBlockProps}
          onMoveNestedBlock={options?.onMoveNestedBlock}
        />
      );
    default:
      return null;
  }
}
