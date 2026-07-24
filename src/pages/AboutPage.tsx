import React from 'react';
import type { Doctor, PageScreen, ServiceItem, SitePage } from '../types';
import { useAppNavigation } from '../context/AppContext';
import { SitePageView } from '../components/page-builder/SitePageView';

interface AboutPageProps {
  onNavigate?: (screen: PageScreen) => void;
  onOpenBooking?: () => void;
  services?: ServiceItem[];
  doctors?: Doctor[];
  sitePage?: SitePage | null;
  bookingEnabled?: boolean;
}

export const AboutPage: React.FC<AboutPageProps> = (props) => {
  const { navigateTo: onNavigate, openBooking: onOpenBooking } = useAppNavigation(props);

  return (
    <SitePageView
      pageId="about"
      page={props.sitePage}
      services={props.services}
      doctors={props.doctors}
      bookingEnabled={props.bookingEnabled}
      onOpenBooking={onOpenBooking}
      onNavigate={onNavigate}
    />
  );
};
