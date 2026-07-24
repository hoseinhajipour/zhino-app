import React from 'react';
import type { Article, ClinicContactInfo, Doctor, FAQItem, PageScreen, ServiceItem } from '../types';
import { useAppNavigation } from '../context/AppContext';
import { SitePageView } from '../components/page-builder/SitePageView';

interface HomePageProps {
  onNavigate?: (screen: PageScreen) => void;
  onOpenBooking?: () => void;
  onOpenDoctorModal?: (doctorId: string) => void;
  onOpenGuide?: () => void;
  onSelectService?: (serviceId: string) => void;
  onSelectArticle?: (article: Article) => void;
  bookingEnabled?: boolean;
  services?: ServiceItem[];
  doctors?: Doctor[];
  articles?: Article[];
  faqs?: FAQItem[];
  contact?: ClinicContactInfo | null;
  sitePage?: import('../types').SitePage | null;
}

export const HomePage: React.FC<HomePageProps> = (props) => {
  const {
    navigateTo: onNavigate,
    openBooking: onOpenBooking,
    openDoctorProfile: onOpenDoctorModal,
    openGuideModal: onOpenGuide,
    selectService: onSelectService,
    bookingEnabled,
  } = useAppNavigation(props);

  return (
    <SitePageView
      pageId="home"
      page={props.sitePage}
      services={props.services}
      doctors={props.doctors}
      articles={props.articles}
      faqs={props.faqs}
      contact={props.contact}
      bookingEnabled={bookingEnabled}
      onOpenBooking={onOpenBooking}
      onOpenDoctorModal={onOpenDoctorModal}
      onOpenGuide={onOpenGuide}
      onNavigate={onNavigate}
      onSelectService={onSelectService}
      onSelectArticle={props.onSelectArticle}
    />
  );
};
