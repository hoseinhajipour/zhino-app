import React, { useEffect, useState } from 'react';
import type {
  Article,
  ClinicContactInfo,
  Doctor,
  FAQItem,
  PageScreen,
  ServiceItem,
  Workshop,
} from '../types';
import { BlockRenderer } from '../components/page-builder/BlockRenderer';
import { pageShellClassName, SITE_CONTAINER_CLASS } from '../lib/contentWidth';
import { getWorkshopPageBuilder } from '../lib/workshopDefaults';

interface WorkshopDetailPageProps {
  workshop: Workshop;
  services?: ServiceItem[];
  doctors?: Doctor[];
  articles?: Article[];
  faqs?: FAQItem[];
  contact?: ClinicContactInfo | null;
  bookingEnabled?: boolean;
  onNavigate?: (screen: PageScreen) => void;
  onOpenBooking?: () => void;
  onOpenDoctorModal?: (doctorId: string) => void;
  onBackToList?: () => void;
}

export const WorkshopDetailPage: React.FC<WorkshopDetailPageProps> = ({
  workshop,
  services = [],
  doctors = [],
  articles = [],
  faqs = [],
  contact = null,
  bookingEnabled = true,
  onNavigate,
  onOpenBooking,
  onOpenDoctorModal,
  onBackToList,
}) => {
  const builder = getWorkshopPageBuilder(workshop);

  return (
    <div className={`pb-16 space-y-6 ${SITE_CONTAINER_CLASS}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => (onBackToList ? onBackToList() : onNavigate?.('workshops'))}
          className="text-xs font-bold text-secondary hover:underline inline-flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
          بازگشت به فهرست کارگاه‌ها
        </button>
      </div>

      <div className={pageShellClassName('contained')}>
        <BlockRenderer
          blocks={builder.blocks}
          ctx={{
            allServices: services,
            doctors,
            articles,
            faqs,
            contact,
            bookingEnabled,
            onOpenBooking,
            onOpenDoctorModal,
            onNavigate,
          }}
        />
      </div>
    </div>
  );
};

interface WorkshopDetailLoaderProps extends Omit<WorkshopDetailPageProps, 'workshop'> {
  workshopIdOrSlug: string;
}

export const WorkshopDetailLoader: React.FC<WorkshopDetailLoaderProps> = ({
  workshopIdOrSlug,
  ...rest
}) => {
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    (async () => {
      try {
        const res = await fetch('/api/workshops');
        const list: Workshop[] = res.ok ? await res.json() : [];
        const found =
          list.find((w) => w.id === workshopIdOrSlug || w.slug === workshopIdOrSlug) || null;
        if (!cancelled) {
          setWorkshop(found && found.active !== false ? found : null);
          setError(!found || found.active === false);
        }
      } catch {
        if (!cancelled) {
          setWorkshop(null);
          setError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workshopIdOrSlug]);

  if (loading) {
    return (
      <div className={`py-20 text-center text-sm text-on-surface-variant ${SITE_CONTAINER_CLASS}`}>
        در حال بارگذاری کارگاه…
      </div>
    );
  }

  if (error || !workshop) {
    return (
      <div className={`py-20 text-center space-y-3 ${SITE_CONTAINER_CLASS}`}>
        <h1 className="text-xl font-extrabold text-on-surface">کارگاه یافت نشد</h1>
        <button
          type="button"
          onClick={() => {
            if (rest.onBackToList) rest.onBackToList();
            else rest.onNavigate?.('workshops');
          }}
          className="text-sm font-bold text-primary hover:underline"
        >
          بازگشت به فهرست کارگاه‌ها
        </button>
      </div>
    );
  }

  return <WorkshopDetailPage workshop={workshop} {...rest} />;
};
