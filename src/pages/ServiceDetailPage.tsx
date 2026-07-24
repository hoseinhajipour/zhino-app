import React from 'react';
import type { ClinicContactInfo, Doctor, FAQItem, PageScreen, ServiceItem } from '../types';
import { useAppNavigation } from '../context/AppContext';
import { getPageBuilderForService } from '../lib/landingToBlocks';
import { BlockRenderer } from '../components/page-builder/BlockRenderer';

interface ServiceDetailPageProps {
  serviceId?: string;
  allServices?: ServiceItem[];
  doctors?: Doctor[];
  faqs?: FAQItem[];
  contact?: ClinicContactInfo | null;
  onNavigate?: (screen: PageScreen) => void;
  onOpenBooking?: (doctorId?: string, serviceId?: string) => void;
  onOpenDoctorModal?: (doctorId: string) => void;
  onSelectOtherService?: (id: string) => void;
  bookingEnabled?: boolean;
}

export const ServiceDetailPage: React.FC<ServiceDetailPageProps> = (props) => {
  const {
    navigateTo: onNavigate,
    openBooking: onOpenBooking,
    openDoctorProfile: onOpenDoctorModal,
    selectService: onSelectOtherService,
    bookingEnabled,
    selectedServiceId: contextServiceId,
  } = useAppNavigation({
    onNavigate: props.onNavigate,
    onOpenBooking: props.onOpenBooking,
    onOpenDoctorModal: props.onOpenDoctorModal,
    onSelectService: props.onSelectOtherService,
    bookingEnabled: props.bookingEnabled,
  });

  const {
    serviceId = contextServiceId,
    allServices = [],
    doctors = [],
    faqs = [],
    contact = null,
  } = props;
  const service = allServices.find((s) => s.id === serviceId) || {
    id: serviceId,
    title: 'خدمت تخصصی مشاوره',
    description: 'خدمات تخصصی روانشناسی کلینیک ژینو',
    icon: 'psychology',
  };

  const pageBuilder = getPageBuilderForService(service);
  const heroTitle =
    (pageBuilder.blocks.find((b) => b.type === 'hero')?.props.title as string) || service.title;

  return (
    <div className="space-y-16 pb-20 text-right max-w-[1240px] mx-auto px-4 md:px-6">
      <nav className="flex items-center justify-between py-2 text-xs text-on-surface-variant border-b border-outline-variant/20">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="hover:text-primary transition-colors font-medium"
          >
            صفحه اصلی
          </button>
          <span>/</span>
          <button
            type="button"
            onClick={() => onNavigate('services')}
            className="hover:text-primary transition-colors font-medium"
          >
            خدمات کلینیک
          </button>
          <span>/</span>
          <span className="font-bold text-primary">{heroTitle}</span>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('services')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold transition-all shadow-sm"
        >
          <span>بازگشت به فهرست خدمات</span>
          <span className="material-symbols-outlined text-sm">arrow_back</span>
        </button>
      </nav>

      <BlockRenderer
        blocks={pageBuilder.blocks}
        ctx={{
          serviceId,
          allServices,
          doctors,
          faqs,
          contact,
          bookingEnabled,
          onOpenBooking,
          onOpenDoctorModal,
          onNavigate: (screen) => onNavigate(screen),
          onSelectOtherService,
        }}
      />
    </div>
  );
};
