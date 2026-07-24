import React from 'react';
import type { Doctor, PageScreen, ServiceItem, SitePage } from '../types';
import { useAppNavigation } from '../context/AppContext';
import { SitePageView } from '../components/page-builder/SitePageView';

interface ContactPageProps {
  onNavigate?: (screen: PageScreen) => void;
  onOpenBooking?: () => void;
  services?: ServiceItem[];
  doctors?: Doctor[];
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
      bookingEnabled={props.bookingEnabled}
      onOpenBooking={onOpenBooking}
      onNavigate={onNavigate}
    />
  );
};
