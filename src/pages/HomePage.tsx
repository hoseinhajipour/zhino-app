import React from 'react';
import type { Doctor, PageScreen, ServiceItem } from '../types';
import { useAppNavigation } from '../context/AppContext';
import { SitePageView } from '../components/page-builder/SitePageView';

interface HomePageProps {
  onNavigate?: (screen: PageScreen) => void;
  onOpenBooking?: () => void;
  onOpenDoctorModal?: (doctorId: string) => void;
  onOpenGuide?: () => void;
  onSelectService?: (serviceId: string) => void;
  bookingEnabled?: boolean;
  services?: ServiceItem[];
  doctors?: Doctor[];
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
      bookingEnabled={bookingEnabled}
      onOpenBooking={onOpenBooking}
      onOpenDoctorModal={onOpenDoctorModal}
      onOpenGuide={onOpenGuide}
      onNavigate={onNavigate}
      onSelectService={onSelectService}
      className="space-y-16 pb-16 text-right max-w-[1200px] mx-auto px-4 md:px-6"
    />
  );
};
