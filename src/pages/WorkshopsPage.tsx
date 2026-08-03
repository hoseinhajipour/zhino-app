import React, { useEffect, useMemo, useState } from 'react';
import type {
  Article,
  ClinicContactInfo,
  Doctor,
  FAQItem,
  PageScreen,
  ServiceItem,
  Workshop,
} from '../types';
import { SITE_CONTAINER_CLASS } from '../lib/contentWidth';
import { useAppNavigation } from '../context/AppContext';
import { getWorkshopPath } from '../lib/workshopDefaults';
import { WorkshopDetailLoader } from './WorkshopDetailPage';

interface WorkshopsPageProps {
  onNavigate?: (screen: PageScreen) => void;
  selectedWorkshopSlug?: string | null;
  onSelectWorkshop?: (workshop: Workshop) => void;
  onBackToWorkshops?: () => void;
  services?: ServiceItem[];
  doctors?: Doctor[];
  articles?: Article[];
  faqs?: FAQItem[];
  contact?: ClinicContactInfo | null;
  bookingEnabled?: boolean;
  onOpenBooking?: () => void;
  onOpenDoctorModal?: (doctorId: string) => void;
}

async function fetchWorkshops(): Promise<Workshop[]> {
  try {
    const res = await fetch('/api/workshops');
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export const WorkshopsPage: React.FC<WorkshopsPageProps> = (props) => {
  const { navigateTo } = useAppNavigation(props);
  const {
    selectedWorkshopSlug,
    onSelectWorkshop,
    onBackToWorkshops,
    services,
    doctors,
    articles,
    faqs,
    contact,
    bookingEnabled,
    onOpenBooking,
    onOpenDoctorModal,
  } = props;
  const [items, setItems] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await fetchWorkshops();
      if (!cancelled) {
        setItems(list);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const active = useMemo(
    () =>
      [...items]
        .filter((w) => w.active !== false)
        .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999)),
    [items]
  );

  if (selectedWorkshopSlug) {
    return (
      <WorkshopDetailLoader
        workshopIdOrSlug={selectedWorkshopSlug}
        services={services}
        doctors={doctors}
        articles={articles}
        faqs={faqs}
        contact={contact}
        bookingEnabled={bookingEnabled}
        onNavigate={props.onNavigate}
        onOpenBooking={onOpenBooking}
        onOpenDoctorModal={onOpenDoctorModal}
        onBackToList={onBackToWorkshops}
      />
    );
  }

  return (
    <div className={`space-y-12 pb-16 text-right ${SITE_CONTAINER_CLASS}`}>
      <section className="bg-surface-container-low p-8 md:p-12 rounded-[40px] border border-outline-variant/30 text-center space-y-4">
        <span className="bg-primary/10 text-primary text-xs font-bold px-4 py-1.5 rounded-full inline-block">
          کارگاه‌های آموزشی
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-primary">کارگاه‌های کلینیک ژینو</h1>
        <p className="text-base text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
          پوستر کارگاه‌ها را ببینید و برای ثبت‌نام با شماره تماس اعلام‌شده هماهنگ کنید.
        </p>
        {contact?.phones?.[0]?.number && (
          <a
            href={
              contact.phones[0].telHref
                ? `tel:${contact.phones[0].telHref.replace(/\D/g, '')}`
                : undefined
            }
            className="inline-flex items-center gap-2 bg-primary text-white font-bold text-sm px-5 py-2.5 rounded-xl"
          >
            <span className="material-symbols-outlined text-base">call</span>
            ثبت‌نام کارگاه: {contact.phones[0].number}
          </a>
        )}
      </section>

      {loading ? (
        <div className="text-center text-sm text-on-surface-variant py-16">در حال بارگذاری کارگاه‌ها…</div>
      ) : active.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-low rounded-3xl border border-dashed border-outline-variant space-y-3">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant">event</span>
          <h2 className="text-lg font-bold text-on-surface">کارگاه فعالی برای نمایش وجود ندارد</h2>
          <p className="text-xs text-on-surface-variant">
            به‌زودی کارگاه‌های جدید اینجا منتشر می‌شود.
          </p>
          <button
            type="button"
            onClick={() => navigateTo('contact')}
            className="inline-flex items-center gap-2 bg-primary text-white font-bold text-xs px-5 py-2.5 rounded-xl"
          >
            تماس با کلینیک
          </button>
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {active.map((w) => {
            const regPhone = (w.registrationPhone || '').trim();
            const regTel =
              (w.registrationPhoneClean || '').replace(/\D/g, '') ||
              regPhone.replace(/\D/g, '') ||
              (contact?.phones?.[0]?.telHref || '').replace(/\D/g, '');
            const regLabel = regPhone || contact?.phones?.[0]?.number || '';
            return (
              <article
                key={w.id}
                className="bg-white dark:bg-surface-dim rounded-3xl overflow-hidden border border-outline-variant/30 shadow-soft flex flex-col"
              >
                <button
                  type="button"
                  onClick={() => onSelectWorkshop?.(w)}
                  className="text-right w-full group flex-1 flex flex-col"
                >
                  {w.posterUrl ? (
                    <img
                      src={w.posterUrl}
                      alt={w.title}
                      className="w-full aspect-[4/5] object-cover bg-surface-container group-hover:opacity-95 transition-opacity"
                    />
                  ) : (
                    <div className="w-full aspect-[4/5] bg-surface-container-low flex items-center justify-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-6xl">image</span>
                    </div>
                  )}
                  <div className="p-6 space-y-3 flex-1 flex flex-col">
                    <h2 className="text-xl font-extrabold text-on-surface group-hover:text-primary transition-colors">
                      {w.title}
                    </h2>
                    {w.description && (
                      <p className="text-sm text-on-surface-variant leading-relaxed flex-1">{w.description}</p>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                      مشاهده جزئیات کارگاه
                      <span className="material-symbols-outlined text-sm">arrow_back</span>
                    </span>
                    <span className="sr-only">{getWorkshopPath(w)}</span>
                  </div>
                </button>
                {regLabel && (
                  <div className="px-6 pb-6">
                    <a
                      href={regTel ? `tel:${regTel}` : undefined}
                      className="w-full inline-flex items-center justify-center gap-2 border border-primary text-primary font-bold text-xs py-2.5 rounded-xl hover:bg-primary/5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">call</span>
                      ثبت‌نام: {regLabel}
                    </a>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
};
