import React from 'react';
import type { Article, Doctor, PageScreen, ServiceItem, SitePage } from '../types';
import { SitePageView } from '../components/page-builder/SitePageView';

interface CustomSitePageProps {
  page: SitePage;
  services?: ServiceItem[];
  doctors?: Doctor[];
  articles?: Article[];
  bookingEnabled?: boolean;
  onOpenBooking?: () => void;
  onOpenDoctorModal?: (doctorId: string) => void;
  onNavigate?: (screen: PageScreen) => void;
  onSelectService?: (id: string) => void;
  onSelectArticle?: (article: Article) => void;
}

/** Public renderer for admin-created custom pages (`/p/:slug`). */
export const CustomSitePage: React.FC<CustomSitePageProps> = ({
  page,
  services,
  doctors,
  articles,
  bookingEnabled,
  onOpenBooking,
  onOpenDoctorModal,
  onNavigate,
  onSelectService,
  onSelectArticle,
}) => (
  <SitePageView
    pageId={page.id}
    page={page}
    services={services}
    doctors={doctors}
    articles={articles}
    bookingEnabled={bookingEnabled}
    onOpenBooking={onOpenBooking}
    onOpenDoctorModal={onOpenDoctorModal}
    onNavigate={onNavigate}
    onSelectService={onSelectService}
    onSelectArticle={onSelectArticle}
  />
);
