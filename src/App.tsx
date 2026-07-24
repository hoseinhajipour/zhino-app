import { useState, useEffect, lazy, Suspense } from 'react';
import { PageScreen, Doctor, ServiceItem, Appointment, Article, UserProfile, FAQItem, ClinicSettings, SitePage } from './types';
import {
  DOCTORS as DEFAULT_DOCTORS,
  MAIN_SERVICES as DEFAULT_SERVICES,
  INITIAL_APPOINTMENTS,
  INITIAL_ARTICLES,
  DEFAULT_FAQS,
} from './data/clinicData';
import {
  subscribeAppointments,
  subscribeDoctors,
  subscribeServices,
  subscribeArticles,
  subscribeFaqs,
  subscribeClinicSettings,
  subscribeSitePages,
  DEFAULT_CLINIC_SETTINGS,
  saveFaq,
  saveUserProfile,
} from './lib/dbService';
import { applySiteTheme, isPageScreenTarget, mergeSiteChrome } from './lib/siteChromeDefaults';
import { fetchInstallStatus } from './lib/installApi';

import { SEOHead } from './components/SEOHead';
import { AppProvider, AppContextType } from './context/AppContext';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ConsultFloatingButton } from './components/ConsultFloatingButton';
import { AppointmentModal } from './components/AppointmentModal';
import { DoctorProfileModal } from './components/DoctorProfileModal';
import { FreeGuideModal } from './components/FreeGuideModal';
import { AuthModal } from './components/AuthModal';
import { SiteTranslateProvider } from './components/SiteTranslateProvider';
import { InstallerWizardPage } from './pages/InstallerWizardPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { mergeContactInfo } from './lib/contactInfo';
import { mergeSiteModules } from './lib/siteModules';

// Lazy-loaded page components for optimal code-splitting & performance
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const ServicesPage = lazy(() => import('./pages/ServicesPage').then((m) => ({ default: m.ServicesPage })));
const ChildTherapyPage = lazy(() => import('./pages/ChildTherapyPage').then((m) => ({ default: m.ChildTherapyPage })));
const AdultTherapyPage = lazy(() => import('./pages/AdultTherapyPage').then((m) => ({ default: m.AdultTherapyPage })));
const MarriageTherapyPage = lazy(() => import('./pages/MarriageTherapyPage').then((m) => ({ default: m.MarriageTherapyPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const TeamPage = lazy(() => import('./pages/TeamPage').then((m) => ({ default: m.TeamPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const BlogPage = lazy(() => import('./pages/BlogPage').then((m) => ({ default: m.BlogPage })));
const FaqPage = lazy(() => import('./pages/FaqPage').then((m) => ({ default: m.FaqPage })));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage })));
const ServiceDetailPage = lazy(() => import('./pages/ServiceDetailPage').then((m) => ({ default: m.ServiceDetailPage })));
const UserDashboardPage = lazy(() => import('./pages/UserDashboardPage').then((m) => ({ default: m.UserDashboardPage })));

const CustomSitePage = lazy(() =>
  import('./pages/CustomSitePage').then((m) => ({ default: m.CustomSitePage }))
);

const PageLoadingFallback = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-4 text-center animate-fade-in">
    <div className="relative w-12 h-12 flex items-center justify-center">
      <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      <span className="material-symbols-outlined text-primary text-xl">psychology</span>
    </div>
    <p className="text-xs font-bold text-on-surface-variant">در حال بارگذاری اطلاعات صفحه...</p>
  </div>
);

const getScreenFromPath = (pathname: string): PageScreen => {
  const clean = pathname.replace(/^\/+/, '').toLowerCase();
  if (clean === 'admin') return 'admin';
  if (clean === 'user-panel') return 'user-panel';
  if (clean === 'services') return 'services';
  if (clean.startsWith('service/')) return 'service-detail';
  if (clean === 'child-therapy') return 'child-therapy';
  if (clean === 'adult-therapy') return 'adult-therapy';
  if (clean === 'marriage-therapy') return 'marriage-therapy';
  if (clean === 'about') return 'about';
  if (clean === 'team') return 'team';
  if (clean === 'contact') return 'contact';
  if (clean === 'blog' || clean.startsWith('blog/')) return 'blog';
  if (clean === 'faq') return 'faq';
  if (clean.startsWith('p/')) return 'custom-page';
  return 'home';
};

const getCustomPageSlugFromPath = (pathname: string): string | null => {
  const clean = pathname.replace(/^\/+/, '');
  if (!clean.toLowerCase().startsWith('p/')) return null;
  const parts = clean.split('/').filter(Boolean);
  if (parts.length < 2) return null;
  try {
    return decodeURIComponent(parts[1]);
  } catch {
    return parts[1];
  }
};

const getInitialServiceFromPath = (pathname: string): string => {
  const clean = pathname.replace(/^\/+/, '').toLowerCase();
  if (clean.startsWith('service/')) {
    const parts = clean.split('/');
    if (parts[1]) return parts[1];
  }
  return 'adult-individual';
};

const getArticleSlugFromPath = (pathname: string): string | null => {
  const clean = pathname.replace(/^\/+/, '');
  if (!clean.toLowerCase().startsWith('blog/')) return null;
  const parts = clean.split('/').filter(Boolean);
  if (parts.length < 2) return null;
  try {
    return decodeURIComponent(parts[1]);
  } catch {
    return parts[1];
  }
};

export function App() {
  const [installCheck, setInstallCheck] = useState<'loading' | 'needed' | 'ready'>('loading');

  useEffect(() => {
    let cancelled = false;
    fetchInstallStatus()
      .then((status) => {
        if (cancelled) return;
        setInstallCheck(status.needsInstall ? 'needed' : 'ready');
      })
      .catch(() => {
        // API unreachable — still show installer so user can configure
        if (!cancelled) setInstallCheck('needed');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [currentScreen, setCurrentScreen] = useState<PageScreen>(() =>
    getScreenFromPath(window.location.pathname)
  );

  // Current logged in user (patient, doctor, or operator)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('zhino_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved user', e);
      }
    }
    if (sessionStorage.getItem('zhino_admin_logged_in') === 'true') {
      return {
        id: 'admin-01',
        name: 'مدیر کلینیک ژینو',
        mobile: '09120000000',
        role: 'admin',
        doctorTitle: 'مدیر سیستم',
      };
    }
    return null;
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('zhino_current_user', JSON.stringify(user));
    if (user.role === 'patient') {
      handleNavigate('user-panel');
    } else {
      handleNavigate('admin');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('zhino_current_user');
    sessionStorage.removeItem('zhino_admin_logged_in');
    handleNavigate('home');
  };

  const handleUpdateUserProfile = async (updatedUser: UserProfile) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('zhino_current_user', JSON.stringify(updatedUser));
    try {
      const saved = await saveUserProfile(updatedUser);
      setCurrentUser(saved);
      localStorage.setItem('zhino_current_user', JSON.stringify(saved));
    } catch (err) {
      console.error('Failed to persist user profile', err);
    }
  };

  const [selectedServiceId, setSelectedServiceId] = useState<string>(() =>
    getInitialServiceFromPath(window.location.pathname)
  );
  const [selectedArticleSlug, setSelectedArticleSlug] = useState<string | null>(() =>
    getArticleSlugFromPath(window.location.pathname)
  );
  const [selectedCustomPageSlug, setSelectedCustomPageSlug] = useState<string | null>(() =>
    getCustomPageSlugFromPath(window.location.pathname)
  );

  // Sync state with URL popstate
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const scr = getScreenFromPath(path);
      setCurrentScreen(scr);
      if (scr === 'service-detail') {
        setSelectedServiceId(getInitialServiceFromPath(path));
      }
      if (scr === 'blog') {
        setSelectedArticleSlug(getArticleSlugFromPath(path));
      } else {
        setSelectedArticleSlug(null);
      }
      if (scr === 'custom-page') {
        setSelectedCustomPageSlug(getCustomPageSlugFromPath(path));
      } else {
        setSelectedCustomPageSlug(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Theme state (Dark Mode / Light Mode)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved !== null) {
      return saved === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleToggleTheme = () => {
    setDarkMode((prev) => !prev);
  };

  // Datasets synchronized with MySQL via API
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [doctors, setDoctors] = useState<Doctor[]>(DEFAULT_DOCTORS);
  const [services, setServices] = useState<ServiceItem[]>(DEFAULT_SERVICES);
  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
  const [faqs, setFaqs] = useState<FAQItem[]>(DEFAULT_FAQS);
  const [settings, setSettings] = useState<ClinicSettings>(DEFAULT_CLINIC_SETTINGS);
  const [sitePages, setSitePages] = useState<SitePage[]>([]);

  // API polling subscriptions (only after install is ready)
  useEffect(() => {
    if (installCheck !== 'ready') return;

    const unsubApp = subscribeAppointments((data) => {
      if (data) setAppointments(data);
    });

    const unsubDoc = subscribeDoctors((data) => {
      if (data && data.length > 0) setDoctors(data);
    });

    const unsubServ = subscribeServices((data) => {
      if (data && data.length > 0) setServices(data);
    });

    const unsubArt = subscribeArticles((data) => {
      if (data && data.length > 0) setArticles(data);
    });

    const unsubFaq = subscribeFaqs((data) => {
      if (data && data.length > 0) setFaqs(data);
    });

    const unsubSettings = subscribeClinicSettings((data) => {
      if (data) setSettings(data);
    });

    const unsubPages = subscribeSitePages((data) => {
      if (data) setSitePages(data);
    });

    return () => {
      unsubApp();
      unsubDoc();
      unsubServ();
      unsubArt();
      unsubFaq();
      unsubSettings();
      unsubPages();
    };
  }, [installCheck]);

  const getSitePage = (id: string) => sitePages.find((p) => p.id === id) || null;

  // Modals state
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [preselectedDoctorId, setPreselectedDoctorId] = useState<string | undefined>(undefined);
  const [preselectedServiceId, setPreselectedServiceId] = useState<string | undefined>(undefined);

  const [activeProfileDoctor, setActiveProfileDoctor] = useState<Doctor | null>(null);
  const [guideModalOpen, setGuideModalOpen] = useState(false);

  const handleOpenBooking = (docId?: string, servId?: string) => {
    setPreselectedDoctorId(docId);
    setPreselectedServiceId(servId);
    setBookingModalOpen(true);
  };

  const handleOpenDoctorProfile = (doctorId: string) => {
    const doc = doctors.find((d) => d.id === doctorId) || null;
    setActiveProfileDoctor(doc);
  };

  const handleNavigate = (screen: PageScreen) => {
    if (screen === 'custom-page') return;
    setCurrentScreen(screen);
    setSelectedArticleSlug(null);
    setSelectedCustomPageSlug(null);
    const path = screen === 'home' ? '/' : `/${screen}`;
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateTarget = (target: string) => {
    const t = target.trim();
    if (!t) return;
    if (t.startsWith('http://') || t.startsWith('https://')) {
      window.open(t, '_blank', 'noopener,noreferrer');
      return;
    }
    if (t.startsWith('/p/') || t.startsWith('p/')) {
      const slug = t.replace(/^\/?p\//, '');
      setSelectedCustomPageSlug(slug);
      setSelectedArticleSlug(null);
      setCurrentScreen('custom-page');
      const path = `/p/${encodeURIComponent(slug)}`;
      if (window.location.pathname !== path) window.history.pushState({}, '', path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (isPageScreenTarget(t)) {
      handleNavigate(t);
      return;
    }
    const path = t.startsWith('/') ? t : `/${t}`;
    if (window.location.pathname !== path) window.history.pushState({}, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const siteChrome = mergeSiteChrome(settings.site);
  const contactInfo = mergeContactInfo(settings.contact, siteChrome.identity);
  const siteModules = mergeSiteModules(settings.modules);

  useEffect(() => {
    applySiteTheme(siteChrome.identity);
  }, [siteChrome.identity]);

  const handleSelectService = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setCurrentScreen('service-detail');
    const path = `/service/${serviceId}`;
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectArticle = (article: Article) => {
    const slug = article.slug || article.id;
    setSelectedArticleSlug(slug);
    setCurrentScreen('blog');
    const path = `/blog/${encodeURIComponent(slug)}`;
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToBlog = () => {
    setSelectedArticleSlug(null);
    setCurrentScreen('blog');
    if (window.location.pathname !== '/blog') {
      window.history.pushState({}, '', '/blog');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddAppointment = (newApp: Appointment) => {
    setAppointments((prev) => [newApp, ...prev]);
  };

  const handleSubmitQuestion = async (newFaqData: Omit<FAQItem, 'id' | 'date' | 'status' | 'likesCount'>) => {
    const newFaq: FAQItem = {
      ...newFaqData,
      id: 'faq-' + Date.now(),
      date: new Date().toLocaleDateString('fa-IR'),
      status: 'pending',
      likesCount: 0,
    };
    setFaqs((prev) => [newFaq, ...prev]);
    await saveFaq(newFaq);
  };

  const handleLikeFaq = async (faqId: string) => {
    const faq = faqs.find((f) => f.id === faqId);
    if (!faq) return;
    const updated: FAQItem = {
      ...faq,
      likesCount: (faq.likesCount || 0) + 1,
    };
    setFaqs((prev) => prev.map((f) => (f.id === faqId ? updated : f)));
    await saveFaq(updated);
  };

  const appContextValue: AppContextType = {
    currentScreen,
    navigateTo: handleNavigate,
    openBooking: handleOpenBooking,
    openDoctorProfile: handleOpenDoctorProfile,
    openGuideModal: () => setGuideModalOpen(true),
    openAuthModal: () => setAuthModalOpen(true),
    bookingEnabled: settings.bookingEnabled,
    selectedServiceId,
    selectService: handleSelectService,
    currentUser,
  };

  const isAdminSurface =
    currentScreen === 'admin' ||
    (currentScreen === 'user-panel' && !!currentUser && currentUser.role !== 'patient');

  /** Public maintenance: guests blocked; logged-in users + admin login bypass */
  const showMaintenance =
    !!settings.maintenanceMode &&
    !currentUser &&
    currentScreen !== 'admin' &&
    installCheck === 'ready';

  if (installCheck === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background text-on-surface font-vazir">
        <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-xs font-bold text-on-surface-variant">در حال بررسی وضعیت نصب...</p>
      </div>
    );
  }

  if (installCheck === 'needed') {
    return (
      <InstallerWizardPage
        onComplete={() => {
          setInstallCheck('ready');
          window.location.assign('/');
        }}
      />
    );
  }

  if (showMaintenance) {
    return (
      <>
        <SEOHead currentScreen="home" maintenance />
        <MaintenancePage
          identity={siteChrome.identity}
          message={settings.maintenanceMessage}
          onStaffLogin={() => handleNavigate('admin')}
        />
      </>
    );
  }

  return (
    <AppProvider value={appContextValue}>
      <SiteTranslateProvider modules={siteModules} disabled={isAdminSurface}>
      <div className="min-h-screen flex flex-col bg-background text-on-surface font-vazir antialiased selection:bg-primary selection:text-white">
      {/* Dynamic SEO Head Manager */}
      <SEOHead
        currentScreen={currentScreen}
        extraTitle={
          currentScreen === 'blog' && selectedArticleSlug
            ? articles.find((a) => a.slug === selectedArticleSlug || a.id === selectedArticleSlug)?.title
            : currentScreen === 'custom-page' && selectedCustomPageSlug
              ? sitePages.find(
                  (p) =>
                    p.slug === selectedCustomPageSlug ||
                    p.slug === `/p/${selectedCustomPageSlug}` ||
                    p.id === selectedCustomPageSlug
                )?.title
              : undefined
        }
        description={
          currentScreen === 'blog' && selectedArticleSlug
            ? articles.find((a) => a.slug === selectedArticleSlug || a.id === selectedArticleSlug)?.summary
            : undefined
        }
      />

      {/* Sticky Header — hidden on admin dashboard */}
      {!isAdminSurface && (
        <Header
          currentScreen={currentScreen}
          currentUser={currentUser}
          onNavigate={handleNavigate}
          onNavigateTarget={handleNavigateTarget}
          onOpenBooking={() => handleOpenBooking()}
          onOpenAuthModal={() => setAuthModalOpen(true)}
          onLogout={handleLogout}
          bookingEnabled={settings.bookingEnabled}
          darkMode={darkMode}
          onToggleTheme={handleToggleTheme}
          siteChrome={siteChrome}
          contact={contactInfo}
        />
      )}

      {/* Main Content Area */}
      <main className={`flex-1 ${isAdminSurface ? 'pt-0' : 'pt-6'}`}>
        <Suspense fallback={<PageLoadingFallback />}>
          {currentScreen === 'home' && (
            <HomePage
              onNavigate={handleNavigate}
              onOpenBooking={() => handleOpenBooking()}
              onOpenDoctorModal={handleOpenDoctorProfile}
              onOpenGuide={() => setGuideModalOpen(true)}
              onSelectService={handleSelectService}
              onSelectArticle={handleSelectArticle}
              bookingEnabled={settings.bookingEnabled}
              services={services}
              doctors={doctors}
              articles={articles}
              faqs={faqs}
              contact={contactInfo}
              sitePage={getSitePage('home')}
            />
          )}

          {currentScreen === 'services' && (
            <ServicesPage
              onNavigate={handleNavigate}
              onOpenBooking={(docId, servId) => handleOpenBooking(docId, servId)}
              onSelectService={handleSelectService}
              bookingEnabled={settings.bookingEnabled}
            />
          )}

          {currentScreen === 'service-detail' && (
            <ServiceDetailPage
              serviceId={selectedServiceId}
              allServices={services}
              doctors={doctors}
              faqs={faqs}
              contact={contactInfo}
              onNavigate={handleNavigate}
              onOpenBooking={(docId, servId) => handleOpenBooking(docId, servId)}
              onOpenDoctorModal={handleOpenDoctorProfile}
              onSelectOtherService={handleSelectService}
              bookingEnabled={settings.bookingEnabled}
            />
          )}

          {currentScreen === 'child-therapy' && (
            <ChildTherapyPage
              onNavigate={handleNavigate}
              onOpenBooking={() => handleOpenBooking(undefined, 'child-play-therapy')}
              onOpenDoctorModal={handleOpenDoctorProfile}
              bookingEnabled={settings.bookingEnabled}
            />
          )}

          {currentScreen === 'adult-therapy' && (
            <AdultTherapyPage
              onNavigate={handleNavigate}
              onOpenBooking={() => handleOpenBooking(undefined, 'adult-individual')}
              onOpenDoctorModal={handleOpenDoctorProfile}
              bookingEnabled={settings.bookingEnabled}
            />
          )}

          {currentScreen === 'marriage-therapy' && (
            <MarriageTherapyPage
              onNavigate={handleNavigate}
              onOpenBooking={() => handleOpenBooking(undefined, 'couples-marriage')}
              onOpenDoctorModal={handleOpenDoctorProfile}
              bookingEnabled={settings.bookingEnabled}
            />
          )}

          {currentScreen === 'about' && (
            <AboutPage
              onNavigate={handleNavigate}
              onOpenBooking={() => handleOpenBooking()}
              onSelectArticle={handleSelectArticle}
              services={services}
              doctors={doctors}
              articles={articles}
              faqs={faqs}
              contact={contactInfo}
              sitePage={getSitePage('about')}
              bookingEnabled={settings.bookingEnabled}
            />
          )}

          {currentScreen === 'team' && (
            <TeamPage
              onNavigate={handleNavigate}
              onOpenBooking={() => handleOpenBooking()}
              onOpenDoctorModal={handleOpenDoctorProfile}
              onOpenGuide={() => setGuideModalOpen(true)}
              bookingEnabled={settings.bookingEnabled}
            />
          )}

          {currentScreen === 'contact' && (
            <ContactPage
              onNavigate={handleNavigate}
              onOpenBooking={() => handleOpenBooking()}
              onSelectArticle={handleSelectArticle}
              services={services}
              doctors={doctors}
              articles={articles}
              faqs={faqs}
              contact={contactInfo}
              sitePage={getSitePage('contact')}
              bookingEnabled={settings.bookingEnabled}
            />
          )}

          {currentScreen === 'blog' && (
            <BlogPage
              articles={articles}
              faqs={faqs}
              contact={contactInfo}
              onOpenBooking={() => handleOpenBooking()}
              selectedArticleSlug={selectedArticleSlug}
              onSelectArticle={handleSelectArticle}
              onBackToBlog={handleBackToBlog}
              services={services}
              doctors={doctors}
              sitePage={getSitePage('blog')}
              bookingEnabled={settings.bookingEnabled}
              onNavigate={handleNavigate}
            />
          )}

          {currentScreen === 'custom-page' && (() => {
            const page = sitePages.find(
              (p) =>
                p.slug === selectedCustomPageSlug ||
                p.slug === `/p/${selectedCustomPageSlug}` ||
                p.id === selectedCustomPageSlug
            );
            if (!page || page.status === 'draft') {
              return (
                <div className="max-w-lg mx-auto py-24 px-4 text-center space-y-3">
                  <span className="material-symbols-outlined text-5xl text-on-surface-variant">search_off</span>
                  <h1 className="text-xl font-black text-on-surface">صفحه پیدا نشد</h1>
                  <p className="text-sm text-on-surface-variant">
                    این آدرس مربوط به صفحه‌ای منتشرشده در سایت نیست.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleNavigate('home')}
                    className="mt-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold"
                  >
                    بازگشت به خانه
                  </button>
                </div>
              );
            }
            return (
              <CustomSitePage
                page={page}
                services={services}
                doctors={doctors}
                articles={articles}
                faqs={faqs}
                contact={contactInfo}
                bookingEnabled={settings.bookingEnabled}
                onOpenBooking={() => handleOpenBooking()}
                onOpenDoctorModal={handleOpenDoctorProfile}
                onNavigate={handleNavigate}
                onSelectService={handleSelectService}
                onSelectArticle={handleSelectArticle}
              />
            );
          })()}

          {currentScreen === 'faq' && (
            <FaqPage
              faqs={faqs}
              onSubmitQuestion={handleSubmitQuestion}
              onNavigate={handleNavigate}
              onLikeFaq={handleLikeFaq}
            />
          )}

          {currentScreen === 'user-panel' && (
            currentUser ? (
              currentUser.role === 'patient' ? (
                <UserDashboardPage
                  currentUser={currentUser}
                  appointments={appointments}
                  onUpdateAppointments={setAppointments}
                  onUpdateUserProfile={handleUpdateUserProfile}
                  onOpenBooking={() => handleOpenBooking()}
                  onLogout={handleLogout}
                />
              ) : (
                <AdminDashboardPage
                  currentUser={currentUser}
                  appointments={appointments}
                  onUpdateAppointments={setAppointments}
                  doctors={doctors}
                  onUpdateDoctors={setDoctors}
                  services={services}
                  onUpdateServices={setServices}
                  articles={articles}
                  onUpdateArticles={setArticles}
                  faqs={faqs}
                  onUpdateFaqs={setFaqs}
                  sitePages={sitePages}
                  onUpdateSitePages={setSitePages}
                  onLogout={handleLogout}
                />
              )
            ) : (
              <div className="max-w-md mx-auto my-12 text-center p-8 bg-surface-container-low rounded-3xl border border-outline-variant/30 space-y-4">
                <span className="material-symbols-outlined text-5xl text-primary">lock</span>
                <h2 className="font-bold text-lg">ورود به پنل مراجعه‌کنندگان</h2>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  جهت پیگیری نوبت‌ها، مشاهده تراکنش‌ها و بروزرسانی پرونده شخصی، وارد حساب شوید.
                </p>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow hover:bg-primary-container transition-all"
                >
                  ورود / عضویت
                </button>
              </div>
            )
          )}

          {currentScreen === 'admin' && (
            currentUser && currentUser.role !== 'patient' ? (
              <AdminDashboardPage
                currentUser={currentUser}
                appointments={appointments}
                onUpdateAppointments={setAppointments}
                doctors={doctors}
                onUpdateDoctors={setDoctors}
                services={services}
                onUpdateServices={setServices}
                articles={articles}
                onUpdateArticles={setArticles}
                faqs={faqs}
                onUpdateFaqs={setFaqs}
                sitePages={sitePages}
                onUpdateSitePages={setSitePages}
                onLogout={handleLogout}
              />
            ) : (
              <AdminLoginPage
                onLoginSuccess={(user) => {
                  handleLoginSuccess(user);
                }}
                onGoHome={() => handleNavigate('home')}
              />
            )
          )}
        </Suspense>
      </main>

      {/* Footer — hidden on admin dashboard */}
      {!isAdminSurface && (
        <Footer
          onNavigate={handleNavigate}
          onNavigateTarget={handleNavigateTarget}
          onOpenBooking={() => handleOpenBooking()}
          bookingEnabled={settings.bookingEnabled}
          siteChrome={siteChrome}
          contact={contactInfo}
        />
      )}

      {/* Floating consult / contact channels */}
      {!isAdminSurface && <ConsultFloatingButton contact={contactInfo} />}

      {/* Interactive Modals */}
      <AppointmentModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        preselectedDoctorId={preselectedDoctorId}
        preselectedServiceId={preselectedServiceId}
        onAddAppointment={handleAddAppointment}
        bookingEnabled={settings.bookingEnabled}
        onNavigate={handleNavigate}
        contact={contactInfo}
      />

      <DoctorProfileModal
        doctor={activeProfileDoctor}
        onClose={() => setActiveProfileDoctor(null)}
        onBook={(docId) => handleOpenBooking(docId)}
        bookingEnabled={settings.bookingEnabled}
      />

      <FreeGuideModal
        isOpen={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
        onSelectDoctor={(docId) => handleOpenBooking(docId)}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
      </SiteTranslateProvider>
    </AppProvider>
  );
}

export default App;
