import React, { useEffect, useState } from 'react';
import type { Article, ClinicContactInfo, Doctor, FAQItem, PageScreen, ServiceItem, SitePage } from '../../types';
import { fetchSitePage } from '../../lib/dbService';
import {
  createBlankSitePage,
  createDefaultSitePage,
  getDefaultBlocksForPage,
  isSystemSitePageId,
} from '../../lib/sitePageDefaults';
import { BlockRenderer } from './BlockRenderer';
import { pageShellClassName } from '../../lib/contentWidth';

interface SitePageViewProps {
  pageId: string;
  /** Optional live page from parent subscription */
  page?: SitePage | null;
  services?: ServiceItem[];
  doctors?: Doctor[];
  articles?: Article[];
  faqs?: FAQItem[];
  contact?: ClinicContactInfo | null;
  bookingEnabled?: boolean;
  onOpenBooking?: () => void;
  onOpenDoctorModal?: (doctorId: string) => void;
  onOpenGuide?: () => void;
  onNavigate?: (screen: PageScreen) => void;
  onSelectService?: (id: string) => void;
  onSelectArticle?: (article: Article) => void;
  /** Extra classes merged after layout shell (do not set max-width here) */
  className?: string;
}

function fallbackPage(pageId: string): SitePage {
  if (isSystemSitePageId(pageId)) return createDefaultSitePage(pageId);
  return createBlankSitePage({ title: 'صفحه', slug: pageId, id: pageId });
}

export const SitePageView: React.FC<SitePageViewProps> = ({
  pageId,
  page: pageProp,
  services = [],
  doctors = [],
  articles = [],
  faqs = [],
  contact = null,
  bookingEnabled = true,
  onOpenBooking,
  onOpenDoctorModal,
  onOpenGuide,
  onNavigate,
  onSelectService,
  onSelectArticle,
  className = '',
}) => {
  const [page, setPage] = useState<SitePage | null>(pageProp ?? null);
  const [loading, setLoading] = useState(!pageProp);

  useEffect(() => {
    if (pageProp) {
      setPage(pageProp);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchSitePage(pageId)
      .then((data) => {
        if (!cancelled) setPage(data || fallbackPage(pageId));
      })
      .catch(() => {
        if (!cancelled) setPage(fallbackPage(pageId));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pageId, pageProp]);

  if (loading && !page) {
    return (
      <div className="py-24 flex items-center justify-center gap-2 text-xs text-on-surface-variant">
        <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        در حال بارگذاری صفحه...
      </div>
    );
  }

  const resolved = page || fallbackPage(pageId);
  const blocks = getDefaultBlocksForPage(resolved);
  const shell = pageShellClassName(resolved.layoutWidth);

  return (
    <div className={`${shell} ${className}`.trim()}>
      <BlockRenderer
        blocks={blocks}
        ctx={{
          serviceId: pageId,
          allServices: services,
          doctors,
          articles,
          faqs,
          contact,
          bookingEnabled,
          onOpenBooking,
          onOpenDoctorModal,
          onOpenGuide,
          onNavigate,
          onSelectOtherService: onSelectService,
          onSelectArticle,
          pageId: resolved.id,
          pageSlug: resolved.slug,
        }}
      />
    </div>
  );
};
