import React, { createContext, useContext } from 'react';
import { PageScreen, UserProfile } from '../types';

export interface AppContextType {
  currentScreen: PageScreen;
  navigateTo: (screen: PageScreen, serviceId?: string) => void;
  openBooking: (doctorId?: string, serviceId?: string) => void;
  openDoctorProfile: (doctorId: string) => void;
  openGuideModal: () => void;
  openAuthModal: () => void;
  bookingEnabled: boolean;
  selectedServiceId: string;
  selectService: (serviceId: string) => void;
  currentUser: UserProfile | null;
}

const AppContext = createContext<AppContextType | null>(null);

export interface AppProviderProps {
  value: AppContextType;
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ value, children }) => {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

/**
 * Custom hook providing navigation and booking actions with fallback to props.
 * This simplifies page component signatures and reduces prop-drilling.
 */
export const useAppNavigation = (overrides?: {
  onNavigate?: (screen: PageScreen) => void;
  onOpenBooking?: (doctorId?: string, serviceId?: string) => void;
  onOpenDoctorModal?: (doctorId: string) => void;
  onOpenGuide?: () => void;
  onSelectService?: (serviceId: string) => void;
  bookingEnabled?: boolean;
}) => {
  const context = useContext(AppContext);

  return {
    currentScreen: context?.currentScreen ?? 'home',
    navigateTo: overrides?.onNavigate ?? context?.navigateTo ?? (() => {}),
    openBooking: overrides?.onOpenBooking ?? context?.openBooking ?? (() => {}),
    openDoctorProfile: overrides?.onOpenDoctorModal ?? context?.openDoctorProfile ?? (() => {}),
    openGuideModal: overrides?.onOpenGuide ?? context?.openGuideModal ?? (() => {}),
    openAuthModal: context?.openAuthModal ?? (() => {}),
    bookingEnabled: overrides?.bookingEnabled ?? context?.bookingEnabled ?? true,
    selectedServiceId: context?.selectedServiceId ?? 'adult-individual',
    selectService: overrides?.onSelectService ?? context?.selectService ?? (() => {}),
    currentUser: context?.currentUser ?? null,
  };
};
