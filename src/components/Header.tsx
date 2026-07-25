import React, { useMemo, useState } from 'react';
import type { ClinicContactInfo, PageScreen, SiteChromeSettings, UserProfile } from '../types';
import { DEFAULT_SITE_CHROME, isPageScreenTarget, mergeSiteChrome } from '../lib/siteChromeDefaults';
import { DEFAULT_CONTACT_INFO, getTelHref, mergeContactInfo } from '../lib/contactInfo';
import { LanguageSwitcher } from './LanguageSwitcher';

interface HeaderProps {
  currentScreen: PageScreen;
  currentUser: UserProfile | null;
  onNavigate: (screen: PageScreen) => void;
  /** Navigate to PageScreen یا مسیر سفارشی (/p/…) */
  onNavigateTarget?: (target: string) => void;
  onOpenBooking: () => void;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  bookingEnabled?: boolean;
  darkMode?: boolean;
  onToggleTheme?: () => void;
  siteChrome?: SiteChromeSettings | null;
  contact?: ClinicContactInfo | null;
  /** Sticky offset, so the header parks below the admin toolbar when it is shown. */
  stickyTopClass?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  currentUser,
  onNavigate,
  onNavigateTarget,
  onOpenBooking,
  onOpenAuthModal,
  onLogout,
  bookingEnabled = true,
  darkMode = false,
  onToggleTheme,
  siteChrome,
  contact,
  stickyTopClass = 'top-0',
}) => {
  const chrome = useMemo(() => mergeSiteChrome(siteChrome || DEFAULT_SITE_CHROME), [siteChrome]);
  const { identity, header, menu } = chrome;
  const contactInfo = useMemo(
    () => mergeContactInfo(contact || DEFAULT_CONTACT_INFO, identity),
    [contact, identity]
  );
  const primaryPhone = contactInfo.phones[0];
  const primaryTel = primaryPhone ? getTelHref(primaryPhone) : '';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [openMobileDropdown, setOpenMobileDropdown] = useState<string | null>(null);

  const mainNavLinks = menu.mainItems.filter((i) => i.visible !== false);

  const go = (target: string) => {
    if (onNavigateTarget) onNavigateTarget(target);
    else if (isPageScreenTarget(target)) onNavigate(target);
    setMobileMenuOpen(false);
    setServicesDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isTargetActive = (target: string, children?: { target: string }[]) => {
    if (children?.length) {
      return children.some((c) => c.target === currentScreen) || target === currentScreen;
    }
    return target === currentScreen;
  };

  const getRoleLabel = (role: string) => {
    if (role === 'admin') return 'مدیر سیستم';
    if (role === 'doctor') return 'پزشک / درمانگر';
    if (role === 'operator') return 'اپراتور / پذیرش';
    return 'مراجعه‌کننده';
  };

  const stickyClass = header.sticky !== false ? `sticky ${stickyTopClass}` : 'relative';

  return (
    <>
      <header
        className={`${stickyClass} z-50 bg-surface/90 dark:bg-surface-container-highest/90 backdrop-blur-md shadow-[0px_4px_20px_rgba(0,0,0,0.05)] h-20 transition-all duration-300`}
      >
        <nav className="flex justify-between items-center w-full h-full px-4 md:px-6 max-w-[1200px] mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors"
              aria-label="منوی موبایل"
            >
              <span className="material-symbols-outlined text-3xl">menu</span>
            </button>

            <button
              onClick={() => go('home')}
              className="flex items-center gap-2 group text-right cursor-pointer"
            >
              <img
                src={identity.logoUrl}
                alt={identity.siteName}
                className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-5 xl:gap-6 text-sm font-medium">
            {mainNavLinks.map((link) => {
              if (link.hasDropdown && link.children?.length) {
                const children = link.children.filter((c) => c.visible !== false);
                const active = isTargetActive(link.target, children);
                return (
                  <div
                    key={link.id}
                    className="relative group py-6"
                    onMouseEnter={() => setServicesDropdownOpen(true)}
                    onMouseLeave={() => setServicesDropdownOpen(false)}
                  >
                    <button
                      onClick={() => go(link.target)}
                      className={`flex items-center gap-1 transition-all py-1.5 whitespace-nowrap ${
                        active
                          ? 'text-primary font-bold border-b-2 border-primary'
                          : 'text-on-surface-variant hover:text-primary'
                      }`}
                    >
                      <span>{link.label}</span>
                      <span className="material-symbols-outlined text-base transition-transform group-hover:rotate-180">
                        keyboard_arrow_down
                      </span>
                    </button>

                    <div
                      className={`absolute top-full right-0 w-60 bg-white dark:bg-surface-dim border border-outline-variant/30 rounded-2xl shadow-2xl p-2 space-y-1 transition-all duration-200 z-50 text-right ${
                        servicesDropdownOpen
                          ? 'opacity-100 visible translate-y-0'
                          : 'opacity-0 invisible -translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0'
                      }`}
                    >
                      <div className="px-3 py-1.5 text-[11px] font-bold text-on-surface-variant/70 border-b border-outline-variant/20 mb-1">
                        {menu.servicesDropdownTitle}
                      </div>
                      {children.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => go(sub.target)}
                          className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                            currentScreen === sub.target
                              ? 'bg-primary/10 text-primary'
                              : 'text-on-surface hover:bg-surface-container-low hover:text-primary'
                          }`}
                        >
                          {sub.icon && (
                            <span className="material-symbols-outlined text-lg text-primary shrink-0">
                              {sub.icon}
                            </span>
                          )}
                          <span>{sub.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              }

              const active = isTargetActive(link.target);
              return (
                <button
                  key={link.id}
                  onClick={() => go(link.target)}
                  className={`py-1.5 transition-all relative whitespace-nowrap ${
                    active
                      ? 'text-primary font-bold border-b-2 border-primary'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {header.showPhone && primaryPhone?.number && (
              <a
                href={primaryTel || '#'}
                className="hidden xl:flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-primary px-2"
                dir="ltr"
              >
                <span className="material-symbols-outlined text-base text-primary">call</span>
                {primaryPhone.number}
              </a>
            )}

            <LanguageSwitcher variant="header" />

            {header.showThemeToggle && onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="hidden lg:flex p-2.5 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant/30 transition-all active:scale-95 items-center justify-center relative group"
                title={darkMode ? 'تغییر به پوسته روشن (روز)' : 'تغییر به پوسته تاریک (شب)'}
              >
                <span className="material-symbols-outlined text-xl transition-transform duration-300 group-hover:rotate-45 text-amber-500 dark:text-sky-300">
                  {darkMode ? 'light_mode' : 'dark_mode'}
                </span>
              </button>
            )}

            {header.showAuthButton &&
              (!currentUser ? (
                <button
                  onClick={onOpenAuthModal}
                  className="px-4 py-2.5 rounded-full font-bold text-xs bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <span className="material-symbols-outlined text-base">login</span>
                  <span>ورود / عضویت</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => go(currentUser.role === 'patient' ? 'user-panel' : 'admin')}
                    className={`px-3.5 py-2 rounded-full font-bold text-xs transition-all flex items-center gap-2 border ${
                      (currentUser.role === 'patient' && currentScreen === 'user-panel') ||
                      (currentUser.role !== 'patient' && currentScreen === 'admin')
                        ? 'bg-primary text-white border-primary shadow-md'
                        : 'bg-surface-container-low text-on-surface border-outline-variant/30 hover:bg-surface-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {currentUser.role === 'patient' ? 'person' : 'admin_panel_settings'}
                    </span>
                    <div className="text-right hidden sm:block">
                      <span className="block text-xs font-bold leading-none">{currentUser.name}</span>
                      <span className="text-[10px] opacity-80 font-normal block leading-tight">
                        {getRoleLabel(currentUser.role)}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={onLogout}
                    className="p-2 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">logout</span>
                  </button>
                </div>
              ))}

            {header.showBookingButton && (
              <button
                onClick={onOpenBooking}
                className="bg-primary text-white hover:bg-primary-container px-4 sm:px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">calendar_month</span>
                <span className="hidden sm:inline">{header.bookingButtonLabel || 'رزرو نوبت'}</span>
                <span className="sm:hidden">رزرو</span>
              </button>
            )}
          </div>
        </nav>
      </header>

      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-xs"
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-[290px] max-w-[85vw] bg-white dark:bg-surface-dim z-[90] shadow-2xl flex flex-col transition-transform duration-300 ease-out text-right ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-outline-variant/30 flex justify-between items-center">
          <img src={identity.logoUrl} alt={identity.siteName} className="h-9 w-auto object-contain" />
          <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-on-surface-variant">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-2">
          {mainNavLinks.map((link) => {
            if (link.hasDropdown && link.children?.length) {
              const children = link.children.filter((c) => c.visible !== false);
              const open = openMobileDropdown === link.id;
              return (
                <div key={link.id} className="space-y-1">
                  <button
                    onClick={() => setOpenMobileDropdown(open ? null : link.id)}
                    className="w-full text-right px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-between text-on-surface-variant hover:bg-surface-container"
                  >
                    <span>{link.label}</span>
                    <span
                      className={`material-symbols-outlined text-base transition-transform ${open ? 'rotate-180' : ''}`}
                    >
                      keyboard_arrow_down
                    </span>
                  </button>
                  {open && (
                    <div className="pr-4 space-y-1 border-r-2 border-primary/20 mr-4">
                      {children.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => go(sub.target)}
                          className="w-full text-right px-3 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 text-on-surface-variant hover:text-primary"
                        >
                          {sub.icon && (
                            <span className="material-symbols-outlined text-base text-primary">
                              {sub.icon}
                            </span>
                          )}
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <button
                key={link.id}
                onClick={() => go(link.target)}
                className={`w-full text-right px-4 py-3 rounded-xl text-sm font-bold ${
                  isTargetActive(link.target)
                    ? 'bg-primary/10 text-primary'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </div>

        <div className="p-5 border-t border-outline-variant/30 space-y-3 bg-surface-container-low">
          <LanguageSwitcher variant="mobile" />
          {header.showThemeToggle && onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-container border border-outline-variant/30 text-xs font-bold"
            >
              <span>پوسته {darkMode ? 'تاریک' : 'روشن'}</span>
              <span className="material-symbols-outlined text-amber-500 dark:text-sky-300">
                {darkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
          )}
          {header.showBookingButton && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking();
              }}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">calendar_month</span>
              {header.bookingButtonLabel || (bookingEnabled ? 'رزرو نوبت' : 'رزرو نوبت')}
            </button>
          )}
          {header.showPhone && primaryPhone?.number && (
            <div className="text-center text-xs text-on-surface-variant pt-1">
              تلفن:{' '}
              <a href={primaryTel || '#'} dir="ltr" className="font-bold text-primary">
                {primaryPhone.number}
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
