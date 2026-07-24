import React from 'react';
import type { Article, ClinicContactInfo, Doctor, FAQItem, PageScreen, ServiceItem, SitePage } from '../types';
import { useAppNavigation } from '../context/AppContext';
import { SitePageView } from '../components/page-builder/SitePageView';

interface ContactPageProps {
  onNavigate?: (screen: PageScreen) => void;
  onOpenBooking?: () => void;
  onSelectArticle?: (article: Article) => void;
  services?: ServiceItem[];
  doctors?: Doctor[];
  articles?: Article[];
  faqs?: FAQItem[];
  contact?: ClinicContactInfo | null;
  sitePage?: SitePage | null;
  bookingEnabled?: boolean;
}

export const ContactPage: React.FC<ContactPageProps> = (props) => {
  const { openBooking: onOpenBooking, navigateTo: onNavigate } = useAppNavigation(props);

  return (
    <SitePageView
      pageId="contact"
      page={props.sitePage}
      services={props.services}
      doctors={props.doctors}
      articles={props.articles}
      faqs={props.faqs}
      contact={props.contact}
      bookingEnabled={props.bookingEnabled}
      onOpenBooking={onOpenBooking}
      onNavigate={onNavigate}
      onSelectArticle={props.onSelectArticle}
    />
  );
};
