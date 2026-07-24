import React, { useMemo, useState } from 'react';
import type { PageScreen, SiteChromeSettings } from '../types';
import { DEFAULT_SITE_CHROME, isPageScreenTarget, mergeSiteChrome } from '../lib/siteChromeDefaults';

interface FooterProps {
  onNavigate: (screen: PageScreen) => void;
  onNavigateTarget?: (target: string) => void;
  onOpenBooking: () => void;
  bookingEnabled?: boolean;
  siteChrome?: SiteChromeSettings | null;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onNavigateTarget,
  onOpenBooking,
  bookingEnabled = true,
  siteChrome,
}) => {
  const chrome = useMemo(() => mergeSiteChrome(siteChrome || DEFAULT_SITE_CHROME), [siteChrome]);
  const { identity, footer } = chrome;
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const go = (target: string) => {
    if (onNavigateTarget) onNavigateTarget(target);
    else if (isPageScreenTarget(target)) onNavigate(target);
  };

  const quickLinks = footer.quickLinks.filter((l) => l.visible !== false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setEmail('');
    }
  };

  return (
    <footer className="w-full bg-surface-container-low dark:bg-surface-dim border-t border-outline-variant/30 pt-16 pb-8 text-right text-on-surface">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <img
            src={identity.logoUrl}
            alt={identity.siteName}
            className="h-12 w-auto object-contain cursor-pointer"
            onClick={() => go('home')}
          />
          <p className="text-sm text-on-surface-variant leading-relaxed">{footer.aboutText}</p>
          <div className="flex gap-3 pt-2">
            {footer.showWhatsapp && (
              <a
                href={`https://wa.me/${identity.whatsappNumber.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-surface-container-high hover:bg-primary hover:text-white text-secondary flex items-center justify-center transition-colors"
                title="واتس‌اپ"
              >
                <span className="material-symbols-outlined text-xl">chat</span>
              </a>
            )}
            {footer.showPhoneIcon && (
              <a
                href={`tel:${identity.phoneClean}`}
                className="w-9 h-9 rounded-full bg-surface-container-high hover:bg-primary hover:text-white text-secondary flex items-center justify-center transition-colors"
                title="تماس تلفنی"
              >
                <span className="material-symbols-outlined text-xl">call</span>
              </a>
            )}
            {footer.showMapIcon && (
              <button
                onClick={() => go('contact')}
                className="w-9 h-9 rounded-full bg-surface-container-high hover:bg-primary hover:text-white text-secondary flex items-center justify-center transition-colors"
                title="آدرس و نقشه"
              >
                <span className="material-symbols-outlined text-xl">location_on</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-bold text-sm text-primary">دسترسی سریع</h4>
          <ul className="space-y-2 text-sm text-on-surface-variant">
            {quickLinks.map((link) => (
              <li key={link.id}>
                <button onClick={() => go(link.target)} className="hover:text-primary transition-colors">
                  {link.label}
                </button>
              </li>
            ))}
            {footer.showAdminLink && (
              <li>
                <button
                  onClick={() => go('admin')}
                  className="text-primary font-bold hover:underline transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                  داشبورد ادمین
                </button>
              </li>
            )}
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="font-bold text-sm text-primary">تماس با کلینیک</h4>
          <div className="space-y-2 text-sm text-on-surface-variant leading-relaxed">
            <p className="flex items-start gap-2">
              <span className="material-symbols-outlined text-primary text-base mt-1">location_on</span>
              <span>{identity.address}</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base shrink-0">call</span>
              <span>تلفن:</span>
              <span dir="ltr" className="inline-flex items-center gap-1.5 font-bold text-on-surface">
                <span>{identity.phone1}</span>
                {identity.phone2 && (
                  <>
                    <span>—</span>
                    <span>{identity.phone2}</span>
                  </>
                )}
              </span>
            </p>
            <p className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">schedule</span>
              <span>ساعات کاری: {footer.hoursText}</span>
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {footer.showNewsletter ? (
            <>
              <h4 className="font-bold text-sm text-primary">{footer.newsletterTitle}</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">{footer.newsletterSubtitle}</p>
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ایمیل شما"
                    dir="ltr"
                    className="w-full bg-white dark:bg-surface-container border border-outline-variant/40 rounded-xl px-3 py-2 text-xs text-left outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    className="bg-primary text-white p-2 rounded-xl hover:bg-primary-container transition-colors shrink-0"
                  >
                    <span className="material-symbols-outlined text-base">send</span>
                  </button>
                </div>
                {subscribed && (
                  <p className="text-xs font-bold text-secondary">ایمیل شما با موفقیت ثبت شد.</p>
                )}
              </form>
            </>
          ) : (
            <h4 className="font-bold text-sm text-primary">{identity.siteName}</h4>
          )}

          <div className="pt-2">
            <button
              onClick={onOpenBooking}
              className="w-full bg-secondary text-white font-bold py-2.5 rounded-xl text-xs shadow hover:bg-secondary/90 transition-all flex items-center justify-center gap-1"
            >
              <span>{bookingEnabled ? 'رزرو سریع آنلاین وقت' : 'رزرو نوبت (تلفنی و حضوری)'}</span>
              <span className="material-symbols-outlined text-sm">calendar_month</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 md:px-6 mt-12 pt-6 border-t border-outline-variant/30 text-center text-xs text-on-surface-variant">
        {footer.copyrightText}
      </div>
    </footer>
  );
};
