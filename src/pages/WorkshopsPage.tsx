import React, { useEffect, useMemo, useState } from 'react';
import type { PageScreen, Workshop } from '../types';
import { CLINIC_INFO } from '../data/clinicData';
import { SITE_CONTAINER_CLASS } from '../lib/contentWidth';
import { useAppNavigation } from '../context/AppContext';

interface WorkshopsPageProps {
  onNavigate?: (screen: PageScreen) => void;
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

  return (
    <div className={`space-y-12 pb-16 text-right ${SITE_CONTAINER_CLASS}`}>
      <section className="bg-surface-container-low p-8 md:p-12 rounded-[40px] border border-outline-variant/30 text-center space-y-4">
        <span className="bg-primary/10 text-primary text-xs font-bold px-4 py-1.5 rounded-full inline-block">
          کارگاه‌های آموزشی
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-primary">ثبت‌نام کارگاه‌های کلینیک ژینو</h1>
        <p className="text-base text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
          پوستر کارگاه‌های پیش‌رو را ببینید و برای ثبت‌نام با شماره اعلام‌شده تماس بگیرید.
        </p>
        <button
          type="button"
          onClick={() => navigateTo('contact')}
          className="text-xs font-bold text-secondary hover:underline"
        >
          بازگشت به راه‌های ارتباطی
        </button>
      </section>

      {loading ? (
        <div className="text-center text-sm text-on-surface-variant py-16">در حال بارگذاری کارگاه‌ها…</div>
      ) : active.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-low rounded-3xl border border-dashed border-outline-variant space-y-3">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant">event</span>
          <h2 className="text-lg font-bold text-on-surface">کارگاه فعالی برای نمایش وجود ندارد</h2>
          <p className="text-xs text-on-surface-variant">
            به‌زودی پوستر کارگاه‌های جدید اینجا منتشر می‌شود. برای اطلاعات بیشتر با پشتیبانی تماس بگیرید.
          </p>
          <a
            href={`tel:${CLINIC_INFO.phoneClean}`}
            className="inline-flex items-center gap-2 bg-primary text-white font-bold text-xs px-5 py-2.5 rounded-xl"
          >
            <span className="material-symbols-outlined text-sm">call</span>
            تماس برای ثبت‌نام ({CLINIC_INFO.phone1})
          </a>
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {active.map((w) => {
            const phone = w.registrationPhoneClean || CLINIC_INFO.phoneClean;
            const phoneLabel = w.registrationPhone || CLINIC_INFO.phone1;
            return (
              <article
                key={w.id}
                className="bg-white dark:bg-surface-dim rounded-3xl overflow-hidden border border-outline-variant/30 shadow-soft flex flex-col"
              >
                {w.posterUrl ? (
                  <img src={w.posterUrl} alt={w.title} className="w-full aspect-[4/5] object-cover bg-surface-container" />
                ) : (
                  <div className="w-full aspect-[4/5] bg-surface-container-low flex items-center justify-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-6xl">image</span>
                  </div>
                )}
                <div className="p-6 space-y-3 flex-1 flex flex-col">
                  <h2 className="text-xl font-extrabold text-on-surface">{w.title}</h2>
                  {w.description && (
                    <p className="text-sm text-on-surface-variant leading-relaxed flex-1">{w.description}</p>
                  )}
                  <a
                    href={`tel:${phone}`}
                    className="mt-2 inline-flex items-center justify-center gap-2 bg-primary text-white font-bold text-sm px-4 py-3 rounded-2xl hover:bg-primary-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">call</span>
                    ثبت‌نام: {phoneLabel}
                  </a>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
};
