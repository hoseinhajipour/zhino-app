import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MediaField } from '../components/media/MediaField';
import {
  Appointment,
  Doctor,
  ServiceItem,
  Article,
  AppointmentStatus,
  ClinicSettings,
  UserProfile,
  FAQItem,
  FaqStatus,
  SitePage,
  SitePageId,
  ArticleCategory,
} from '../types';
import {
  addAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  saveDoctor,
  deleteDoctor,
  saveService,
  deleteService,
  saveArticle,
  deleteArticle,
  saveFaq,
  deleteFaq,
  subscribeClinicSettings,
  saveClinicSettings,
  DEFAULT_CLINIC_SETTINGS,
  subscribeArticleCategories,
  saveArticleCategory,
  deleteArticleCategory,
  saveSitePage,
  deleteSitePage,
} from '../lib/dbService';
import { FAQ_CATEGORIES } from '../data/clinicData';
import { ServicePageBuilder } from '../components/page-builder/ServicePageBuilder';
import { SitePageBuilder } from '../components/page-builder/SitePageBuilder';
import { ArticleEditorPage } from '../components/page-builder/ArticleEditorPage';
import { SiteChromeSettingsPanel } from '../components/admin/SiteChromeSettingsPanel';
import { ContactInfoSettingsPanel } from '../components/admin/ContactInfoSettingsPanel';
import { ModulesSettingsPanel } from '../components/admin/ModulesSettingsPanel';
import { FreeGuideSettingsPanel } from '../components/admin/FreeGuideSettingsPanel';
import { FormsAdminPanel } from '../components/admin/FormsAdminPanel';
import { SystemStatusPanel } from '../components/admin/SystemStatusPanel';
import { UsersManagementPanel } from '../components/admin/UsersManagementPanel';
import { ImportExportPanel } from '../components/admin/ImportExportPanel';
import { mergeSiteChrome } from '../lib/siteChromeDefaults';
import {
  identityPatchFromContact,
  mergeContactInfo,
} from '../lib/contactInfo';
import { isAppointmentsModuleEnabled, isSeoOptimizerModuleEnabled, mergeSiteModules } from '../lib/siteModules';
import { analyzeArticleSeo, analyzePageSeo } from '../lib/seoAnalyzer';
import { SeoScoreBadge } from '../components/admin/SeoScoreBadge';
import { mergeFreeGuide } from '../lib/freeGuideDefaults';
import type {
  ClinicContactInfo,
  FreeGuideSettings,
  SiteChromeSettings,
  SiteModulesSettings,
} from '../types';
import { createBlankArticle } from '../lib/articleDefaults';
import {
  createBlankSitePage,
  createDefaultSitePage,
  getSitePagePath,
  isSystemSitePage,
  RESERVED_PAGE_SLUGS,
  SITE_PAGE_META,
  slugifyPageTitle,
  SYSTEM_SITE_PAGE_IDS,
} from '../lib/sitePageDefaults';
import { AdminShell } from '../components/admin/AdminShell';
import { AdminIntent, consumeAdminIntent } from '../lib/adminIntent';
import {
  AdminTabId,
  canAccessPersonnelTab,
  canApproveFaqs,
  canManageFormDefinitions,
  canManageFormSubmissions,
  canDeleteAppointments,
  canDeleteServices,
  canEditAllAppointments,
  canEditServicePages,
  canEditSitePages,
  canManageAllArticles,
  canManageArticles,
  canManageDoctors,
  canManagePersonnel,
  canManageModules,
  canManageSettings,
  canManageTools,
  canManageUsers,
  canViewSystemStatus,
  canViewServicesOnly,
  getAllowedNav,
  getAllowedTabs,
  getRoleLabel,
} from '../lib/adminPermissions';

interface AdminDashboardPageProps {
  currentUser?: UserProfile | null;
  appointments: Appointment[];
  onUpdateAppointments: (updated: Appointment[]) => void;

  doctors: Doctor[];
  onUpdateDoctors: (updated: Doctor[]) => void;

  services: ServiceItem[];
  onUpdateServices: (updated: ServiceItem[]) => void;

  articles: Article[];
  onUpdateArticles: (updated: Article[]) => void;

  faqs?: FAQItem[];
  onUpdateFaqs?: (updated: FAQItem[]) => void;

  sitePages?: SitePage[];
  onUpdateSitePages?: (updated: SitePage[]) => void;

  onLogout?: () => void;
}

type AdminTab = AdminTabId;

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  currentUser,
  appointments,
  onUpdateAppointments,
  doctors,
  onUpdateDoctors,
  services,
  onUpdateServices,
  articles,
  onUpdateArticles,
  faqs = [],
  onUpdateFaqs,
  sitePages = [],
  onUpdateSitePages,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  /** Pending action requested by the public-site admin toolbar. */
  const [pendingIntent, setPendingIntent] = useState<AdminIntent | null>(() => consumeAdminIntent());

  // --- APPOINTMENT FILTERS & ACTIONS ---
  const [appSearch, setAppSearch] = useState('');
  const [appointmentsSubTab, setAppointmentsSubTab] = useState<'list' | 'settings' | 'guide'>('list');
  const [appStatusFilter, setAppStatusFilter] = useState<string>('all');
  const [showAddAppModal, setShowAddAppModal] = useState(false);
  const [editingApp, setEditingApp] = useState<Appointment | null>(null);

  // Custom Delete Appointment Confirmation
  const [appToDelete, setAppToDelete] = useState<Appointment | null>(null);
  const [isDeletingApp, setIsDeletingApp] = useState(false);

  // --- CLINIC SETTINGS STATE (ZARINPAL & KAVENEGAR) ---
  const [settings, setSettings] = useState<ClinicSettings>(DEFAULT_CLINIC_SETTINGS);
  const [siteChromeDraft, setSiteChromeDraft] = useState<SiteChromeSettings>(() =>
    mergeSiteChrome(DEFAULT_CLINIC_SETTINGS.site)
  );
  const siteChromeDraftRevisionRef = useRef(0);
  const siteChromeSyncBlockedRef = useRef(false);
  const [contactDraft, setContactDraft] = useState<ClinicContactInfo>(() =>
    mergeContactInfo(DEFAULT_CLINIC_SETTINGS.contact)
  );
  const [modulesDraft, setModulesDraft] = useState<SiteModulesSettings>(() =>
    mergeSiteModules(DEFAULT_CLINIC_SETTINGS.modules)
  );
  const [freeGuideDraft, setFreeGuideDraft] = useState<FreeGuideSettings>(() =>
    mergeFreeGuide(DEFAULT_CLINIC_SETTINGS.freeGuide)
  );

  const navOptions = { appointmentsModuleEnabled: isAppointmentsModuleEnabled(modulesDraft) };
  const seoOptimizerEnabled = isSeoOptimizerModuleEnabled(modulesDraft);
  const allowedNav = getAllowedNav(currentUser?.role, navOptions);
  const allowedTabs = getAllowedTabs(currentUser?.role, navOptions);

  useEffect(() => {
    const allowed = getAllowedTabs(currentUser?.role, {
      appointmentsModuleEnabled: isAppointmentsModuleEnabled(modulesDraft),
    }).map((t) => t.id);
    if (!allowed.includes(activeTab)) {
      setActiveTab(allowed[0] || 'overview');
    }
    if (canViewServicesOnly(currentUser?.role)) {
      setPersonnelSubTab('services');
    }
  }, [currentUser?.role, activeTab, modulesDraft]);

  const [savingSiteChrome, setSavingSiteChrome] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [savingModules, setSavingModules] = useState(false);
  const [savingFreeGuide, setSavingFreeGuide] = useState(false);
  const [settingsSaveMsg, setSettingsSaveMsg] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [savingMaintenance, setSavingMaintenance] = useState(false);
  const [developmentMode, setDevelopmentMode] = useState(false);
  const [savingDevelopment, setSavingDevelopment] = useState(false);
  const [isTestingGateway, setIsTestingGateway] = useState(false);
  const [testGatewayResult, setTestGatewayResult] = useState<string | null>(null);

  const [testSmsPhone, setTestSmsPhone] = useState('');
  const [isSendingTestSms, setIsSendingTestSms] = useState(false);
  const [testSmsResult, setTestSmsResult] = useState<string | null>(null);

  // Reservation Settings State
  const [resBookingEnabled, setResBookingEnabled] = useState(true);

  // --- ARTICLE CATEGORIES (must be declared before subscribe/handlers) ---
  const [articleCategories, setArticleCategories] = useState<ArticleCategory[]>([]);
  const [articleCategoriesLoaded, setArticleCategoriesLoaded] = useState(false);
  const [articlesSubTab, setArticlesSubTab] = useState<'list' | 'categories'>('list');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySlug, setNewCategorySlug] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ArticleCategory | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatSlug, setEditCatSlug] = useState('');
  const [editCatOrder, setEditCatOrder] = useState(0);
  const [editCatActive, setEditCatActive] = useState(true);

  // Zarinpal Form State
  const [zpEnabled, setZpEnabled] = useState(true);
  const [zpIsSandbox, setZpIsSandbox] = useState(true);
  const [zpMerchantId, setZpMerchantId] = useState('');
  const [zpDefaultFee, setZpDefaultFee] = useState('');
  const [zpCallbackUrl, setZpCallbackUrl] = useState('');

  // Kavenegar Form State
  const [kvEnabled, setKvEnabled] = useState(true);
  const [kvApiKey, setKvApiKey] = useState('');
  const [kvSenderNumber, setKvSenderNumber] = useState('');
  const [kvBookingPattern, setKvBookingPattern] = useState('');
  const [kvReminderPattern, setKvReminderPattern] = useState('');
  const [kvCancelPattern, setKvCancelPattern] = useState('');

  // Subscribe to settings from API
  useEffect(() => {
    const unsub = subscribeClinicSettings((st) => {
      if (st) {
        setSettings(st);
        if (!siteChromeSyncBlockedRef.current) {
          setSiteChromeDraft(mergeSiteChrome(st.site));
        }
        setContactDraft(mergeContactInfo(st.contact, st.site?.identity));
        setModulesDraft(mergeSiteModules(st.modules));
        setFreeGuideDraft(mergeFreeGuide(st.freeGuide));
        setMaintenanceMode(!!st.maintenanceMode);
        setMaintenanceMessage(st.maintenanceMessage || '');
        setDevelopmentMode(!!st.developmentMode);
        setResBookingEnabled(st.bookingEnabled ?? true);
        setZpEnabled(st.zarinpal.enabled);
        setZpIsSandbox(st.zarinpal.isSandbox);
        setZpMerchantId(st.zarinpal.merchantId);
        setZpDefaultFee(st.zarinpal.defaultFee);
        setZpCallbackUrl(st.zarinpal.callbackUrl);

        setKvEnabled(st.kavenegar.enabled);
        setKvApiKey(st.kavenegar.apiKey);
        setKvSenderNumber(st.kavenegar.senderNumber);
        setKvBookingPattern(st.kavenegar.bookingPattern);
        setKvReminderPattern(st.kavenegar.reminderPattern);
        setKvCancelPattern(st.kavenegar.cancelPattern);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribeArticleCategories((list) => {
      const sorted = [...list].sort(
        (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.name.localeCompare(b.name, 'fa')
      );
      setArticleCategories(sorted);
      setArticleCategoriesLoaded(true);
    });
    return () => unsub();
  }, []);

  const slugifyCategoryName = (name: string) =>
    name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\u0600-\u06FFa-z0-9-]/gi, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || `cat-${Date.now()}`;

  const activeArticleCategories = useMemo(
    () => articleCategories.filter((c) => c.active !== false),
    [articleCategories]
  );

  const categoryArticleCount = (cat: ArticleCategory) =>
    articles.filter((a) => a.categoryId === cat.id || a.category === cat.name).length;

  const handleAddArticleCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    if (articleCategories.some((c) => c.name === name)) {
      alert('این دسته‌بندی از قبل وجود دارد.');
      return;
    }
    setSavingCategory(true);
    try {
      const slug = (newCategorySlug.trim() || slugifyCategoryName(name)).replace(/^\/+|\/+$/g, '');
      const id = `acat-${slugifyCategoryName(slug || name)}`;
      const cat: ArticleCategory = {
        id,
        name,
        slug: slug || slugifyCategoryName(name),
        sortOrder: articleCategories.length + 1,
        active: true,
      };
      await saveArticleCategory(cat);
      setArticleCategories((prev) =>
        [...prev, cat].sort(
          (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.name.localeCompare(b.name, 'fa')
        )
      );
      setNewCategoryName('');
      setNewCategorySlug('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطا در ذخیره دسته‌بندی');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleOpenEditCategory = (cat: ArticleCategory) => {
    setEditingCategory(cat);
    setEditCatName(cat.name);
    setEditCatSlug(cat.slug || '');
    setEditCatOrder(cat.sortOrder ?? 0);
    setEditCatActive(cat.active !== false);
  };

  const handleSaveEditCategory = async () => {
    if (!editingCategory) return;
    const name = editCatName.trim();
    if (!name) {
      alert('نام دسته الزامی است.');
      return;
    }
    if (articleCategories.some((c) => c.id !== editingCategory.id && c.name === name)) {
      alert('دسته‌بندی دیگری با این نام وجود دارد.');
      return;
    }
    setSavingCategory(true);
    try {
      const updated: ArticleCategory = {
        ...editingCategory,
        name,
        slug: (editCatSlug.trim() || slugifyCategoryName(name)).replace(/^\/+|\/+$/g, ''),
        sortOrder: Number(editCatOrder) || 0,
        active: editCatActive,
      };
      await saveArticleCategory(updated);

      // Keep article.category display name in sync when renamed
      if (editingCategory.name !== name) {
        const touched = articles.filter(
          (a) => a.categoryId === editingCategory.id || a.category === editingCategory.name
        );
        for (const art of touched) {
          const next = { ...art, category: name, categoryId: updated.id };
          await saveArticle(next);
        }
        if (touched.length) {
          onUpdateArticles(
            articles.map((a) =>
              a.categoryId === editingCategory.id || a.category === editingCategory.name
                ? { ...a, category: name, categoryId: updated.id }
                : a
            )
          );
        }
      }

      setArticleCategories((prev) =>
        prev
          .map((c) => (c.id === updated.id ? updated : c))
          .sort(
            (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.name.localeCompare(b.name, 'fa')
          )
      );
      setEditingCategory(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطا در ویرایش دسته‌بندی');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteArticleCategory = async (cat: ArticleCategory) => {
    const used = categoryArticleCount(cat);
    if (used > 0) {
      alert(`این دسته روی ${used} مقاله استفاده شده و قابل حذف نیست. ابتدا مقالات را به دسته دیگری منتقل کنید.`);
      return;
    }
    if (!window.confirm(`حذف دسته «${cat.name}»؟`)) return;
    try {
      await deleteArticleCategory(cat.id);
      setArticleCategories((prev) => prev.filter((c) => c.id !== cat.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حذف ناموفق بود');
    }
  };

  const handleToggleCategoryActive = async (cat: ArticleCategory) => {
    const updated: ArticleCategory = { ...cat, active: cat.active === false };
    await saveArticleCategory(updated);
    setArticleCategories((prev) => prev.map((c) => (c.id === cat.id ? updated : c)));
  };

  const handleMoveCategory = async (cat: ArticleCategory, direction: -1 | 1) => {
    const sorted = [...articleCategories].sort(
      (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.name.localeCompare(b.name, 'fa')
    );
    const idx = sorted.findIndex((c) => c.id === cat.id);
    const swapIdx = idx + direction;
    if (idx < 0 || swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swapIdx];
    const aOrder = a.sortOrder ?? idx + 1;
    const bOrder = b.sortOrder ?? swapIdx + 1;
    const nextA = { ...a, sortOrder: bOrder };
    const nextB = { ...b, sortOrder: aOrder };
    await Promise.all([saveArticleCategory(nextA), saveArticleCategory(nextB)]);
    setArticleCategories((prev) =>
      prev
        .map((c) => (c.id === nextA.id ? nextA : c.id === nextB.id ? nextB : c))
        .sort(
          (x, y) => (x.sortOrder || 0) - (y.sortOrder || 0) || x.name.localeCompare(y.name, 'fa')
        )
    );
  };

  // New Appointment Form State
  const [newAppPatientName, setNewAppPatientName] = useState('');
  const [newAppPatientPhone, setNewAppPatientPhone] = useState('');
  const [newAppDoctorId, setNewAppDoctorId] = useState(doctors[0]?.id || '');
  const [newAppServiceId, setNewAppServiceId] = useState(services[0]?.id || '');
  const [newAppDate, setNewAppDate] = useState('1403/05/05');
  const [newAppTime, setNewAppTime] = useState('16:00');
  const [newAppType, setNewAppType] = useState<'in-person' | 'online'>('in-person');
  const [newAppNotes, setNewAppNotes] = useState('');

  // --- DOCTOR & SERVICE FILTERS & MODALS ---
  const [personnelSubTab, setPersonnelSubTab] = useState<'doctors' | 'services'>('doctors');

  // Doctor Search & Filters
  const [docSearch, setDocSearch] = useState('');
  const [docStatusFilter, setDocStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [docSpecialtyFilter, setDocSpecialtyFilter] = useState<string>('all');

  // Doctor Delete Modal
  const [docToDelete, setDocToDelete] = useState<Doctor | null>(null);
  const [isDeletingDoc, setIsDeletingDoc] = useState(false);

  // Doctor Form Modal State
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [docName, setDocName] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [docDegree, setDocDegree] = useState('');
  const [docLicenseNumber, setDocLicenseNumber] = useState('');
  const [docConsultationFee, setDocConsultationFee] = useState('');
  const [docWorkingHours, setDocWorkingHours] = useState('');
  const [docPhone, setDocPhone] = useState('');
  const [docEmail, setDocEmail] = useState('');
  const [docAvatar, setDocAvatar] = useState('');
  const [docBio, setDocBio] = useState('');
  const [docGender, setDocGender] = useState<'female' | 'male'>('female');
  const [docActive, setDocActive] = useState(true);
  const [docExperience, setDocExperience] = useState(10);
  const [docTags, setDocTags] = useState('');
  const [docSpecialties, setDocSpecialties] = useState<string[]>(['individual', 'cbt']);
  const [docSessionTypes, setDocSessionTypes] = useState<('online' | 'in-person')[]>(['in-person', 'online']);

  // Service Search & Delete Modal
  const [servSearch, setServSearch] = useState('');
  const [serviceToDelete, setServiceToDelete] = useState<ServiceItem | null>(null);
  const [isDeletingService, setIsDeletingService] = useState(false);

  // Service Modal State
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [pageBuilderService, setPageBuilderService] = useState<ServiceItem | null>(null);
  const [pageBuilderSitePage, setPageBuilderSitePage] = useState<SitePage | null>(null);
  const [showCreatePageModal, setShowCreatePageModal] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');
  const [savingPageMeta, setSavingPageMeta] = useState(false);
  const [editingPageMeta, setEditingPageMeta] = useState<SitePage | null>(null);
  const [editPageTitle, setEditPageTitle] = useState('');
  const [editPageSlug, setEditPageSlug] = useState('');
  const [editPageStatus, setEditPageStatus] = useState<'published' | 'draft'>('published');
  const [editPageCover, setEditPageCover] = useState('');
  const [editPageExcerpt, setEditPageExcerpt] = useState('');
  const [editPageLayoutWidth, setEditPageLayoutWidth] = useState<'contained' | 'full'>('contained');
  const [pageSearch, setPageSearch] = useState('');
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [servTitle, setServTitle] = useState('');
  const [servDesc, setServDesc] = useState('');
  const [servIcon, setServIcon] = useState('psychology');
  const [servDuration, setServDuration] = useState('۴۵ دقیقه');
  const [servFee, setServFee] = useState('۸۵۰,۰۰۰ تومان');
  const [servBadge, setServBadge] = useState('');
  const [servActive, setServActive] = useState(true);
  const [servTargetScreen, setServTargetScreen] = useState<string>('');

  // --- ARTICLE FILTERS & EDITOR ---
  const [artSearch, setArtSearch] = useState('');
  const [artStatusFilter, setArtStatusFilter] = useState<string>('all');
  const [articleEditor, setArticleEditor] = useState<Article | null>(null);
  const [articleEditorIsNew, setArticleEditorIsNew] = useState(false);

  // --- FAQ MANAGEMENT STATE & HANDLERS ---
  const [faqSearch, setFaqSearch] = useState('');
  const [faqStatusFilter, setFaqStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [faqCatFilter, setFaqCatFilter] = useState<string>('all');
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);
  const [faqAnswerText, setFaqAnswerText] = useState('');
  const [faqResponder, setFaqResponder] = useState(currentUser?.name || 'دکتر مرجانه دیهیمی');

  const pendingFaqsCount = faqs.filter((f) => f.status === 'pending').length;

  const handleOpenFaqAnswer = (item: FAQItem) => {
    setEditingFaq(item);
    setFaqAnswerText(item.answer || '');
    setFaqResponder(item.responderName || currentUser?.name || 'دکتر مرجانه دیهیمی');
  };

  const handleSaveFaqAnswer = async (statusOverride?: FaqStatus) => {
    if (!editingFaq) return;
    const newStatus = statusOverride || editingFaq.status;
    const updatedObj: FAQItem = {
      ...editingFaq,
      answer: faqAnswerText,
      responderName: faqResponder,
      status: newStatus,
    };

    const newFaqs = faqs.map((f) => (f.id === editingFaq.id ? updatedObj : f));
    if (onUpdateFaqs) onUpdateFaqs(newFaqs);
    await saveFaq(updatedObj);
    setEditingFaq(null);
  };

  const handleDeleteFaqItem = async (id: string) => {
    if (window.confirm('آیا از حذف این پرسش اطمینان دارید؟')) {
      const newFaqs = faqs.filter((f) => f.id !== id);
      if (onUpdateFaqs) onUpdateFaqs(newFaqs);
      await deleteFaq(id);
      if (editingFaq?.id === id) setEditingFaq(null);
    }
  };

  const filteredFaqs = faqs.filter((f) => {
    const matchesStatus = faqStatusFilter === 'all' || f.status === faqStatusFilter;
    const matchesCat = faqCatFilter === 'all' || f.category === faqCatFilter;
    const searchLower = faqSearch.trim().toLowerCase();
    const matchesSearch =
      !searchLower ||
      f.question.toLowerCase().includes(searchLower) ||
      f.askedBy.toLowerCase().includes(searchLower) ||
      (f.answer && f.answer.toLowerCase().includes(searchLower));
    return matchesStatus && matchesCat && matchesSearch;
  });

  // -------------------------------------------------------------
  // APPOINTMENT HANDLERS
  // -------------------------------------------------------------
  const handleStatusChange = async (id: string, newStatus: AppointmentStatus) => {
    const updated = appointments.map((a) =>
      a.id === id ? { ...a, status: newStatus } : a
    );
    onUpdateAppointments(updated);
    await updateAppointmentStatus(id, newStatus);
  };

  const handleConfirmDeleteAppointment = async () => {
    if (!appToDelete) return;
    setIsDeletingApp(true);
    try {
      const id = appToDelete.id;
      onUpdateAppointments(appointments.filter((a) => a.id !== id));
      await deleteAppointment(id);
      if (editingApp?.id === id) {
        setEditingApp(null);
      }
      setAppToDelete(null);
    } catch (err) {
      console.error('Error deleting appointment:', err);
    } finally {
      setIsDeletingApp(false);
    }
  };

  const handleSaveReservationSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaveMsg(null);
    const updated: ClinicSettings = {
      ...settings,
      bookingEnabled: resBookingEnabled,
      site: siteChromeDraft,
    };
    try {
      await saveClinicSettings(updated);
      setSettings(updated);
      setSettingsSaveMsg({
        type: 'success',
        msg: 'تنظیمات رزرو نوبت با موفقیت بروزرسانی و ذخیره شد.',
      });
      setTimeout(() => setSettingsSaveMsg(null), 4000);
    } catch (err) {
      setSettingsSaveMsg({
        type: 'error',
        msg: 'خطا در ذخیره‌سازی تنظیمات رزرو نوبت.',
      });
    }
  };

  const handleSaveSiteChrome = async () => {
    setSavingSiteChrome(true);
    setSettingsSaveMsg(null);
    const savedRevision = siteChromeDraftRevisionRef.current;
    const updated: ClinicSettings = {
      ...settings,
      site: siteChromeDraft,
    };
    try {
      await saveClinicSettings(updated);
      setSettings(updated);
      setSettingsSaveMsg({
        type: 'success',
        msg: 'تنظیمات ظاهر سایت (هدر، منو، فوتر و هویت) ذخیره شد.',
      });
      window.setTimeout(() => {
        if (siteChromeDraftRevisionRef.current === savedRevision) {
          siteChromeSyncBlockedRef.current = false;
        }
      }, 7000);
      setTimeout(() => setSettingsSaveMsg(null), 4000);
    } catch {
      setSettingsSaveMsg({ type: 'error', msg: 'خطا در ذخیره ظاهر سایت' });
    } finally {
      setSavingSiteChrome(false);
    }
  };

  const handleSaveContactInfo = async () => {
    setSavingContact(true);
    setSettingsSaveMsg(null);
    const contact = mergeContactInfo(contactDraft);
    const patchedIdentity = {
      ...siteChromeDraft.identity,
      ...identityPatchFromContact(contact),
    };
    const site = {
      ...siteChromeDraft,
      identity: patchedIdentity,
    };
    const updated: ClinicSettings = {
      ...settings,
      contact,
      site,
    };
    try {
      await saveClinicSettings(updated);
      setSettings(updated);
      setSiteChromeDraft(site);
      setContactDraft(contact);
      setSettingsSaveMsg({
        type: 'success',
        msg: 'اطلاعات تماس ذخیره شد و فوتر/ویجت‌ها به‌روز می‌شوند.',
      });
      setTimeout(() => setSettingsSaveMsg(null), 4000);
    } catch {
      setSettingsSaveMsg({ type: 'error', msg: 'خطا در ذخیره اطلاعات تماس' });
    } finally {
      setSavingContact(false);
    }
  };

  const handleSaveModules = async () => {
    setSavingModules(true);
    setSettingsSaveMsg(null);
    const modules = mergeSiteModules(modulesDraft);
    const updated: ClinicSettings = {
      ...settings,
      modules,
    };
    try {
      await saveClinicSettings(updated);
      setSettings(updated);
      setModulesDraft(modules);
      setSettingsSaveMsg({
        type: 'success',
        msg: 'تنظیمات ماژول‌ها ذخیره شد.',
      });
      setTimeout(() => setSettingsSaveMsg(null), 4000);
    } catch {
      setSettingsSaveMsg({ type: 'error', msg: 'خطا در ذخیره ماژول‌ها' });
    } finally {
      setSavingModules(false);
    }
  };

  const handleSaveFreeGuide = async () => {
    setSavingFreeGuide(true);
    setSettingsSaveMsg(null);
    const freeGuide = mergeFreeGuide(freeGuideDraft);
    const updated: ClinicSettings = {
      ...settings,
      freeGuide,
    };
    try {
      await saveClinicSettings(updated);
      setSettings(updated);
      setFreeGuideDraft(freeGuide);
      setSettingsSaveMsg({
        type: 'success',
        msg: 'فرم انتخاب درمانگر ذخیره شد.',
      });
      setTimeout(() => setSettingsSaveMsg(null), 4000);
    } catch {
      setSettingsSaveMsg({ type: 'error', msg: 'خطا در ذخیره فرم انتخاب درمانگر' });
    } finally {
      setSavingFreeGuide(false);
    }
  };

  const handleSaveMaintenance = async () => {
    setSavingMaintenance(true);
    setSettingsSaveMsg(null);
    const updated: ClinicSettings = {
      ...settings,
      maintenanceMode,
      maintenanceMessage: maintenanceMessage.trim(),
    };
    try {
      await saveClinicSettings(updated);
      setSettings(updated);
      setSettingsSaveMsg({
        type: 'success',
        msg: maintenanceMode
          ? 'حالت تعمیر فعال شد — بازدیدکنندگان عمومی صفحه تعمیر را می‌بینند.'
          : 'حالت تعمیر خاموش شد — سایت برای همه در دسترس است.',
      });
      setTimeout(() => setSettingsSaveMsg(null), 4000);
    } catch {
      setSettingsSaveMsg({ type: 'error', msg: 'خطا در ذخیره حالت تعمیر' });
    } finally {
      setSavingMaintenance(false);
    }
  };

  const handleSaveDevelopment = async () => {
    setSavingDevelopment(true);
    setSettingsSaveMsg(null);
    const updated: ClinicSettings = {
      ...settings,
      developmentMode,
    };
    try {
      await saveClinicSettings(updated);
      setSettings(updated);
      setSettingsSaveMsg({
        type: 'success',
        msg: developmentMode
          ? 'حالت توسعه فعال شد — پیشنهاد ورود سریع و حساب‌های دمو در صفحات لاگین نمایش داده می‌شود.'
          : 'حالت توسعه خاموش شد — پیشنهادهای ورود دمو دیگر نمایش داده نمی‌شوند.',
      });
      setTimeout(() => setSettingsSaveMsg(null), 4000);
    } catch {
      setSettingsSaveMsg({ type: 'error', msg: 'خطا در ذخیره حالت توسعه' });
    } finally {
      setSavingDevelopment(false);
    }
  };

  const handleSaveZarinpalSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaveMsg(null);
    const updated: ClinicSettings = {
      ...settings,
      zarinpal: {
        enabled: zpEnabled,
        isSandbox: zpIsSandbox,
        merchantId: zpMerchantId,
        defaultFee: zpDefaultFee,
        callbackUrl: zpCallbackUrl,
      },
    };
    try {
      await saveClinicSettings(updated);
      setSettingsSaveMsg({ type: 'success', msg: 'تنظیمات درگاه زرین‌پال با موفقیت در دیتابیس ابری ذخیره گردید.' });
      setTimeout(() => setSettingsSaveMsg(null), 4000);
    } catch (err) {
      setSettingsSaveMsg({ type: 'error', msg: 'خطا در ثبت تنظیمات زرین‌پال' });
    }
  };

  const handleTestZarinpalConnection = () => {
    setTestGatewayResult(null);
    setIsTestingGateway(true);
    setTimeout(() => {
      setIsTestingGateway(false);
      if (!zpMerchantId || zpMerchantId.trim().length < 10) {
        setTestGatewayResult('خطا: کد مرچنت زرین‌پال نامعتبر یا کوتاه‌تر از حد مجاز است.');
      } else {
        setTestGatewayResult(
          zpIsSandbox
            ? 'تست اتصال زرین‌پال (حالت آزمایشی Sandbox): ارتباط با وب‌سرویس زرین‌پال برقرار شد (کد 100 - آمادگی ارجاع به درگاه تست).'
            : 'تست اتصال زرین‌پال (حالت واقعی Live): مرچنت کد معتبر بوده و آمادگی پذیرش تراکنش‌های آنلاین را دارد (کد 100).'
        );
      }
    }, 1000);
  };

  const handleSaveKavenegarSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaveMsg(null);
    const updated: ClinicSettings = {
      ...settings,
      kavenegar: {
        enabled: kvEnabled,
        apiKey: kvApiKey,
        senderNumber: kvSenderNumber,
        bookingPattern: kvBookingPattern,
        reminderPattern: kvReminderPattern,
        cancelPattern: kvCancelPattern,
      },
    };
    try {
      await saveClinicSettings(updated);
      setSettingsSaveMsg({ type: 'success', msg: 'تنظیمات پنل پیامکی کاوه‌نگار با موفقیت ذخیره گردید.' });
      setTimeout(() => setSettingsSaveMsg(null), 4000);
    } catch (err) {
      setSettingsSaveMsg({ type: 'error', msg: 'خطا در ذخیره تنظیمات کاوه‌نگار' });
    }
  };

  const handleSendTestSms = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testSmsPhone.trim()) return;
    setTestSmsResult(null);
    setIsSendingTestSms(true);
    setTimeout(() => {
      setIsSendingTestSms(false);
      setTestSmsResult(
        `پیامک تست با موفقیت از خط ${kvSenderNumber || '10008403'} به شماره ${testSmsPhone} ارسال گردید (شناسه پیامک: ${Math.floor(
          10000000 + Math.random() * 90000000
        )}).`
      );
      setTestSmsPhone('');
    }, 1200);
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    const docItem = doctors.find((d) => d.id === newAppDoctorId) || doctors[0];
    const servItem = services.find((s) => s.id === newAppServiceId) || services[0];

    const newApp: Appointment = {
      id: 'app-' + Date.now(),
      bookingRef: 'ZH-' + Math.floor(100000 + Math.random() * 900000),
      patientName: newAppPatientName,
      patientPhone: newAppPatientPhone,
      doctorId: docItem ? docItem.id : '',
      doctorName: docItem ? docItem.name : 'درمانگر کلینیک',
      serviceId: servItem ? servItem.id : '',
      serviceTitle: servItem ? servItem.title : 'مشاوره',
      date: newAppDate,
      timeSlot: newAppTime,
      sessionType: newAppType,
      status: 'confirmed',
      createdAt: 'امروز',
      notes: newAppNotes,
      fee: '۸۵۰,۰۰۰ تومان',
    };

    onUpdateAppointments([newApp, ...appointments]);
    setShowAddAppModal(false);
    setNewAppPatientName('');
    setNewAppPatientPhone('');
    setNewAppNotes('');
    await addAppointment(newApp);
  };

  const scopedAppointments = !canEditAllAppointments(currentUser?.role)
    ? appointments.filter(
        (app) =>
          app.doctorId === currentUser?.id ||
          (currentUser?.name ? app.doctorName.includes(currentUser.name.replace(/^دکتر\s*/, '')) : false)
      )
    : appointments;

  const filteredAppointments = scopedAppointments.filter((app) => {
    const matchesStatus = appStatusFilter === 'all' || app.status === appStatusFilter;
    const matchesSearch =
      app.patientName.includes(appSearch) ||
      app.patientPhone.includes(appSearch) ||
      app.bookingRef.includes(appSearch) ||
      app.doctorName.includes(appSearch);
    return matchesStatus && matchesSearch;
  });

  // -------------------------------------------------------------
  // DOCTOR HANDLERS & FILTERS
  // -------------------------------------------------------------
  const handleOpenDoctorModal = (docItem?: Doctor) => {
    if (docItem) {
      setEditingDoctor(docItem);
      setDocName(docItem.name || '');
      setDocTitle(docItem.title || '');
      setDocDegree(docItem.degree || '');
      setDocLicenseNumber(docItem.licenseNumber || '');
      setDocConsultationFee(docItem.consultationFee || '۸۵۰,۰۰۰ تومان');
      setDocWorkingHours(docItem.workingHours || 'شنبه تا چهارشنبه (۱۶ الی ۲۰)');
      setDocPhone(docItem.phone || '');
      setDocEmail(docItem.email || '');
      setDocAvatar(docItem.avatar || '');
      setDocBio(docItem.bio || '');
      setDocGender(docItem.gender || 'female');
      setDocActive(docItem.active ?? true);
      setDocExperience(docItem.experienceYears || 10);
      setDocTags(docItem.tags ? docItem.tags.join(', ') : '');
      setDocSpecialties(docItem.specialties || ['individual']);
      setDocSessionTypes(docItem.sessionTypes || ['in-person', 'online']);
    } else {
      setEditingDoctor(null);
      setDocName('');
      setDocTitle('روانشناس و درمانگر ارشد');
      setDocDegree('کارشناسی ارشد روانشناسی بالینی');
      setDocLicenseNumber('۲۴۵' + Math.floor(100 + Math.random() * 900) + '-ن');
      setDocConsultationFee('۸۵۰,۰۰۰ تومان');
      setDocWorkingHours('روزهای زوج (۱۶ تا ۲۰)');
      setDocPhone('09120000000');
      setDocEmail('');
      setDocAvatar('https://lh3.googleusercontent.com/aida-public/AB6AXuAbmnpUV7pewskFBXgvo4uhvgtCLMA5T74nCGo_UAEo4zdv1HyXH81HTCWaJpl9nyH0FKpk7A4nrYXAtvHAXsKPqbqJk19PhX199mCp_yKNEBxbxSy_LtlVgUBsS5DoRtoFOJmLQaxaT_A-gZxPJhU4hSvMP2URUtByBT0rWyKMDPilhTN-s0WeypgoysKjA5kaHLI8AfdMZkAkRxrH9q-Mppw6KBMBbn-0BLijol0AMSlgzEyNm-F2xNrpUWqoa-pY8GB9u-KOG3k');
      setDocBio('');
      setDocGender('female');
      setDocActive(true);
      setDocExperience(8);
      setDocTags('مشاوره فردی, CBT, اضطراب');
      setDocSpecialties(['individual', 'cbt']);
      setDocSessionTypes(['in-person', 'online']);
    }
    setShowDoctorModal(true);
  };

  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    const tagArray = docTags.split(',').map((t) => t.trim()).filter(Boolean);

    if (editingDoctor) {
      const docObj: Doctor = {
        ...editingDoctor,
        name: docName,
        title: docTitle,
        degree: docDegree,
        licenseNumber: docLicenseNumber,
        consultationFee: docConsultationFee,
        workingHours: docWorkingHours,
        phone: docPhone,
        email: docEmail,
        avatar: docAvatar,
        bio: docBio,
        gender: docGender,
        active: docActive,
        experienceYears: docExperience,
        tags: tagArray,
        specialties: docSpecialties,
        sessionTypes: docSessionTypes,
      };
      const updated = doctors.map((d) => (d.id === editingDoctor.id ? docObj : d));
      onUpdateDoctors(updated);
      await saveDoctor(docObj);
    } else {
      const newDoc: Doctor = {
        id: 'dr-' + Date.now(),
        name: docName,
        title: docTitle,
        degree: docDegree,
        licenseNumber: docLicenseNumber,
        consultationFee: docConsultationFee,
        workingHours: docWorkingHours,
        phone: docPhone,
        email: docEmail,
        avatar: docAvatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbmnpUV7pewskFBXgvo4uhvgtCLMA5T74nCGo_UAEo4zdv1HyXH81HTCWaJpl9nyH0FKpk7A4nrYXAtvHAXsKPqbqJk19PhX199mCp_yKNEBxbxSy_LtlVgUBsS5DoRtoFOJmLQaxaT_A-gZxPJhU4hSvMP2URUtByBT0rWyKMDPilhTN-s0WeypgoysKjA5kaHLI8AfdMZkAkRxrH9q-Mppw6KBMBbn-0BLijol0AMSlgzEyNm-F2xNrpUWqoa-pY8GB9u-KOG3k',
        bio: docBio,
        specialties: docSpecialties.length ? docSpecialties : ['individual', 'cbt'],
        gender: docGender,
        active: docActive,
        sessionTypes: docSessionTypes.length ? docSessionTypes : ['in-person', 'online'],
        experienceYears: docExperience,
        tags: tagArray.length ? tagArray : ['مشاوره فردی'],
      };
      onUpdateDoctors([newDoc, ...doctors]);
      await saveDoctor(newDoc);
    }
    setShowDoctorModal(false);
  };

  const handleToggleDoctorActive = async (id: string) => {
    const target = doctors.find((d) => d.id === id);
    if (target) {
      const updatedDoc = { ...target, active: !target.active };
      onUpdateDoctors(doctors.map((d) => (d.id === id ? updatedDoc : d)));
      await saveDoctor(updatedDoc);
    }
  };

  const handleConfirmDeleteDoctor = async () => {
    if (!docToDelete) return;
    setIsDeletingDoc(true);
    try {
      const id = docToDelete.id;
      onUpdateDoctors(doctors.filter((d) => d.id !== id));
      await deleteDoctor(id);
      setDocToDelete(null);
    } catch (err) {
      console.error('Error deleting doctor:', err);
    } finally {
      setIsDeletingDoc(false);
    }
  };

  const filteredDoctors = doctors.filter((doc) => {
    const matchesStatus =
      docStatusFilter === 'all' ||
      (docStatusFilter === 'active' && doc.active) ||
      (docStatusFilter === 'inactive' && !doc.active);
    const matchesSpecialty =
      docSpecialtyFilter === 'all' ||
      (doc.specialties && doc.specialties.includes(docSpecialtyFilter));
    const searchLower = docSearch.trim().toLowerCase();
    const matchesSearch =
      !searchLower ||
      doc.name.toLowerCase().includes(searchLower) ||
      doc.title.toLowerCase().includes(searchLower) ||
      (doc.licenseNumber && doc.licenseNumber.toLowerCase().includes(searchLower)) ||
      (doc.tags && doc.tags.some((t) => t.toLowerCase().includes(searchLower)));

    return matchesStatus && matchesSpecialty && matchesSearch;
  });

  // -------------------------------------------------------------
  // SERVICE HANDLERS & FILTERS
  // -------------------------------------------------------------
  const handleOpenServiceModal = (serv?: ServiceItem) => {
    if (serv) {
      setEditingService(serv);
      setServTitle(serv.title || '');
      setServDesc(serv.description || '');
      setServIcon(serv.icon || 'psychology');
      setServDuration(serv.duration || '۴۵ دقیقه');
      setServFee(serv.fee || '۸۵۰,۰۰۰ تومان');
      setServBadge(serv.badge || '');
      setServActive(serv.active ?? true);
      setServTargetScreen(serv.targetScreen || '');
    } else {
      setEditingService(null);
      setServTitle('');
      setServDesc('');
      setServIcon('psychology');
      setServDuration('۴۵ دقیقه');
      setServFee('۸۵۰,۰۰۰ تومان');
      setServBadge('');
      setServActive(true);
      setServTargetScreen('');
    }
    setShowServiceModal(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingService) {
      const servObj: ServiceItem = {
        ...editingService,
        title: servTitle,
        description: servDesc,
        icon: servIcon,
        duration: servDuration,
        fee: servFee,
        badge: servBadge || undefined,
        active: servActive,
        targetScreen: servTargetScreen ? (servTargetScreen as any) : undefined,
      };
      onUpdateServices(services.map((s) => (s.id === editingService.id ? servObj : s)));
      await saveService(servObj);
    } else {
      const newServ: ServiceItem = {
        id: 'serv-' + Date.now(),
        title: servTitle,
        description: servDesc,
        icon: servIcon,
        duration: servDuration,
        fee: servFee,
        badge: servBadge || undefined,
        active: servActive,
        bgClass: 'bg-surface-container-low',
        targetScreen: servTargetScreen ? (servTargetScreen as any) : undefined,
      };
      onUpdateServices([...services, newServ]);
      await saveService(newServ);
    }
    setShowServiceModal(false);
  };

  const handleConfirmDeleteService = async () => {
    if (!serviceToDelete) return;
    setIsDeletingService(true);
    try {
      const id = serviceToDelete.id;
      onUpdateServices(services.filter((s) => s.id !== id));
      await deleteService(id);
      setServiceToDelete(null);
    } catch (err) {
      console.error('Error deleting service:', err);
    } finally {
      setIsDeletingService(false);
    }
  };

  const filteredServices = services.filter((serv) => {
    const searchLower = servSearch.trim().toLowerCase();
    return (
      !searchLower ||
      serv.title.toLowerCase().includes(searchLower) ||
      serv.description.toLowerCase().includes(searchLower)
    );
  });

  // -------------------------------------------------------------
  // SITE PAGE MANAGEMENT
  // -------------------------------------------------------------
  const managedSitePages = useMemo(() => {
    const byId = new Map<string, SitePage>();
    for (const id of SYSTEM_SITE_PAGE_IDS) {
      byId.set(id, sitePages.find((p) => p.id === id) || createDefaultSitePage(id));
    }
    for (const p of sitePages) {
      if (!byId.has(p.id)) byId.set(p.id, p);
    }
    return Array.from(byId.values()).sort((a, b) => {
      const aSys = isSystemSitePage(a) ? 0 : 1;
      const bSys = isSystemSitePage(b) ? 0 : 1;
      if (aSys !== bSys) return aSys - bSys;
      return a.title.localeCompare(b.title, 'fa');
    });
  }, [sitePages]);

  const filteredManagedPages = useMemo(() => {
    const q = pageSearch.trim().toLowerCase();
    if (!q) return managedSitePages;
    return managedSitePages.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
    );
  }, [managedSitePages, pageSearch]);

  const validatePageSlug = (slug: string, excludeId?: string): string | null => {
    const clean = slug.replace(/^\/+/, '').replace(/^p\//, '').trim().toLowerCase();
    if (!clean) return 'نامک صفحه الزامی است.';
    if (RESERVED_PAGE_SLUGS.has(clean)) return 'این نامک رزرو شده و قابل استفاده نیست.';
    const clash = sitePages.find(
      (p) =>
        p.id !== excludeId &&
        (p.slug.replace(/^\/+/, '').replace(/^p\//, '').toLowerCase() === clean ||
          p.id.toLowerCase() === clean)
    );
    if (clash) return 'صفحه دیگری با این نامک وجود دارد.';
    return null;
  };

  const handleCreateSitePage = async () => {
    const title = newPageTitle.trim();
    if (!title) {
      alert('عنوان صفحه الزامی است.');
      return;
    }
    let slug = (newPageSlug.trim() || slugifyPageTitle(title))
      .replace(/^\/+/, '')
      .replace(/^p\//, '');
    if (!slug) {
      slug = `page-${Date.now().toString(36)}`;
    }
    const slugErr = validatePageSlug(slug);
    if (slugErr) {
      alert(slugErr);
      return;
    }
    setSavingPageMeta(true);
    try {
      const page = createBlankSitePage({ title, slug });
      await saveSitePage(page);
      const next = [...sitePages.filter((p) => p.id !== page.id), page];
      onUpdateSitePages?.(next);
      setShowCreatePageModal(false);
      setNewPageTitle('');
      setNewPageSlug('');
      // Open page builder immediately after create
      setPageBuilderSitePage(page);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'خطا در ایجاد صفحه');
    } finally {
      setSavingPageMeta(false);
    }
  };

  const handleOpenEditPageMeta = (page: SitePage) => {
    setEditingPageMeta(page);
    setEditPageTitle(page.title);
    setEditPageSlug(
      isSystemSitePage(page)
        ? page.slug
        : page.slug.replace(/^\/+/, '').replace(/^p\//, '')
    );
    setEditPageStatus(page.status === 'draft' ? 'draft' : 'published');
    setEditPageCover(page.coverImage || '');
    setEditPageExcerpt(page.excerpt || '');
    setEditPageLayoutWidth(page.layoutWidth === 'full' ? 'full' : 'contained');
  };

  const handleSavePageMeta = async () => {
    if (!editingPageMeta) return;
    const title = editPageTitle.trim();
    if (!title) {
      alert('عنوان صفحه الزامی است.');
      return;
    }
    let slug = editingPageMeta.slug;
    if (!isSystemSitePage(editingPageMeta)) {
      slug = editPageSlug.replace(/^\/+/, '').replace(/^p\//, '');
      const slugErr = validatePageSlug(slug, editingPageMeta.id);
      if (slugErr) {
        alert(slugErr);
        return;
      }
    }
    setSavingPageMeta(true);
    try {
      const updated: SitePage = {
        ...editingPageMeta,
        title,
        slug,
        coverImage: editPageCover.trim(),
        excerpt: editPageExcerpt.trim(),
        layoutWidth: editPageLayoutWidth,
        status: isSystemSitePage(editingPageMeta) ? 'published' : editPageStatus,
        updatedAt: new Date().toISOString(),
      };
      await saveSitePage(updated);
      const next = sitePages.some((p) => p.id === updated.id)
        ? sitePages.map((p) => (p.id === updated.id ? updated : p))
        : [...sitePages, updated];
      onUpdateSitePages?.(next);
      setEditingPageMeta(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطا در ذخیره مشخصات صفحه');
    } finally {
      setSavingPageMeta(false);
    }
  };

  const handleDeleteSitePage = async (page: SitePage) => {
    if (isSystemSitePage(page)) {
      alert('صفحات اصلی سایت قابل حذف نیستند.');
      return;
    }
    if (!window.confirm(`حذف صفحه «${page.title}»؟ این عمل قابل بازگشت نیست.`)) return;
    try {
      await deleteSitePage(page.id);
      onUpdateSitePages?.(sitePages.filter((p) => p.id !== page.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حذف صفحه ناموفق بود');
    }
  };

  // -------------------------------------------------------------
  // ARTICLE HANDLERS
  // -------------------------------------------------------------
  const handleOpenArticleEditor = (art?: Article) => {
    if (art) {
      setArticleEditor(art);
      setArticleEditorIsNew(false);
    } else {
      setArticleEditor(createBlankArticle(doctors, articleCategories));
      setArticleEditorIsNew(true);
    }
  };

  // Resolve the toolbar request once the referenced entity is available.
  useEffect(() => {
    if (!pendingIntent) return;
    const role = currentUser?.role;
    const allowedTabIds = getAllowedTabs(role, {
      appointmentsModuleEnabled: isAppointmentsModuleEnabled(modulesDraft),
    }).map((t) => t.id);
    const goTab = (tab: AdminTab) => {
      if (allowedTabIds.includes(tab)) setActiveTab(tab);
    };

    switch (pendingIntent.kind) {
      case 'tab':
        goTab(pendingIntent.tab);
        break;

      case 'new-page':
        if (!canEditSitePages(role)) break;
        goTab('pages');
        setShowCreatePageModal(true);
        break;

      case 'new-article': {
        if (!canManageArticles(role)) break;
        if (!articleCategoriesLoaded) return;
        goTab('articles');
        handleOpenArticleEditor();
        break;
      }

      case 'edit-page': {
        if (!canEditSitePages(role)) break;
        const page = managedSitePages.find((p) => p.id === pendingIntent.pageId);
        if (!page) return;
        goTab('pages');
        setPageBuilderSitePage(page);
        break;
      }

      case 'edit-service': {
        if (!canEditServicePages(role)) break;
        const service = services.find((s) => s.id === pendingIntent.serviceId);
        if (!service) return;
        goTab('personnel');
        setPersonnelSubTab('services');
        setPageBuilderService(service);
        break;
      }

      case 'edit-article': {
        if (!canManageArticles(role)) break;
        if (!articleCategoriesLoaded) return;
        const article = articles.find((a) => a.id === pendingIntent.articleId);
        if (!article) return;
        goTab('articles');
        handleOpenArticleEditor(article);
        break;
      }
    }

    setPendingIntent(null);
  }, [
    pendingIntent,
    currentUser?.role,
    modulesDraft,
    managedSitePages,
    services,
    articles,
    articleCategoriesLoaded,
  ]);

  const handleDeleteArticle = async (id: string) => {
    if (window.confirm('آیا از حذف این مقاله اطمینان دارید؟')) {
      onUpdateArticles(articles.filter((a) => a.id !== id));
      await deleteArticle(id);
    }
  };

  const scopedArticles = canManageAllArticles(currentUser?.role)
    ? articles
    : articles.filter((a) => a.authorId === currentUser?.id);

  const filteredArticles = scopedArticles.filter((art) => {
    const matchesStatus = artStatusFilter === 'all' || art.status === artStatusFilter;
    const matchesSearch =
      art.title.includes(artSearch) ||
      art.authorName.includes(artSearch) ||
      art.category.includes(artSearch);
    return matchesStatus && matchesSearch;
  });

  // Calculate Metrics
  const pendingCount = scopedAppointments.filter((a) => a.status === 'pending').length;
  const confirmedCount = scopedAppointments.filter((a) => a.status === 'confirmed').length;
  const completedCount = scopedAppointments.filter((a) => a.status === 'completed').length;
  const activeDoctorsCount = doctors.filter((d) => d.active).length;
  const publishedArticlesCount = scopedArticles.filter((a) => a.status === 'published').length;

  const tabTitles: Record<AdminTab, { title: string; subtitle: string }> = {
    overview: {
      title: 'نمای کلی داشبورد',
      subtitle: `خوش آمدید ${currentUser?.name || ''} — ${getRoleLabel(currentUser?.role || 'admin')}`,
    },
    appointments: {
      title:
        appointmentsSubTab === 'settings'
          ? 'تنظیمات نوبت‌دهی'
          : appointmentsSubTab === 'guide'
            ? 'فرم انتخاب درمانگر'
            : 'مدیریت نوبت‌ها',
      subtitle:
        appointmentsSubTab === 'settings'
          ? 'رزرو آنلاین، درگاه پرداخت و پیامک تأیید نوبت'
          : appointmentsSubTab === 'guide'
            ? 'ویرایش سوال‌ها و قوانین پیشنهاد درمانگر در راهنمای هوشمند'
            : 'پیگیری، تأیید و ثبت نوبت‌های کلینیک',
    },
    personnel: { title: 'پرسنل و خدمات', subtitle: 'مدیریت کادر درمان و صفحات خدمات' },
    users: {
      title: 'مدیریت کاربران',
      subtitle: 'لیست کاربران، نقش‌ها و ایجاد حساب جدید',
    },
    pages: {
      title: 'مدیریت صفحه‌ها',
      subtitle: 'ویرایش صفحات موجود یا ساخت صفحه جدید با صفحه‌ساز',
    },
    articles: { title: 'مقالات و بلاگ', subtitle: 'تولید و انتشار محتوای مجله کلینیک' },
    faqs: { title: 'سوالات متداول', subtitle: 'پاسخ‌گویی و تأیید پرسش‌های مراجعین' },
    forms: {
      title: 'فرم‌ها',
      subtitle: 'تعریف فرم‌های سایت و مشاهده ارسال‌های ثبت‌شده',
    },
    contact: {
      title: 'اطلاعات تماس',
      subtitle: 'تلفن‌ها، پیام‌رسان‌ها، ایمیل و آدرس‌های کلینیک',
    },
    modules: {
      title: 'ماژول‌ها',
      subtitle: 'قابلیت‌های اختیاری سایت — ترجمه خودکار و ماژول‌های بعدی',
    },
    system: {
      title: 'وضعیت سیستم',
      subtitle: 'سلامت سرور، منابع سخت‌افزاری، نسخه نرم‌افزار و به‌روزرسانی',
    },
    'tools-io': {
      title: 'درونریزی و برونریزی',
      subtitle: 'پشتیبان JSON ژینو و درون‌ریزی از وردپرس با انتقال رسانه به هاست',
    },
    settings: { title: 'تنظیمات کلینیک', subtitle: 'هویت برند، هدر، منو و فوتر سایت' },
  };

  return (
    <AdminShell
      currentUser={currentUser}
      navItems={allowedNav}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={onLogout}
      title={tabTitles[activeTab].title}
      subtitle={tabTitles[activeTab].subtitle}
    >
      <div className="space-y-6 pb-16">
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <p className="text-[11px] font-bold text-slate-500">نوبت‌های قابل مشاهده</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{scopedAppointments.length}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <p className="text-[11px] font-bold text-slate-500">در انتظار تأیید</p>
              <p className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <p className="text-[11px] font-bold text-slate-500">تأیید شده</p>
              <p className="text-2xl font-black text-teal-600 mt-1">{confirmedCount}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <p className="text-[11px] font-bold text-slate-500">
                {canManageArticles(currentUser?.role) ? 'مقالات منتشرشده' : 'درمانگران فعال'}
              </p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {canManageArticles(currentUser?.role) ? publishedArticlesCount : activeDoctorsCount}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3">دسترسی‌های نقش شما</h3>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                {allowedTabs.map((item) => (
                  <li key={item.id} className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-teal-600 text-base">{item.icon}</span>
                    <span className="font-bold">{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-slate-900 to-teal-900 text-white rounded-2xl p-5">
              <h3 className="text-sm font-black mb-2">اقدام سریع</h3>
              <p className="text-xs text-white/70 mb-4 leading-relaxed">
                از منوی کناری بخش موردنظر را انتخاب کنید. آمار بالا بر اساس نقش شما فیلتر شده است.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('appointments')}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold"
                >
                  مشاهده نوبت‌ها ({pendingCount} در انتظار)
                </button>
                {canManageSettings(currentUser?.role) && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('settings')}
                    className="px-3 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-xs font-bold"
                  >
                    تنظیمات کلینیک
                  </button>
                )}
              </div>
              <p className="text-[11px] text-white/50 mt-4">نوبت‌های تکمیل‌شده: {completedCount}</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: APPOINTMENTS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'appointments' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1.5 bg-white dark:bg-surface-dim p-1 rounded-2xl border border-outline-variant/30 shadow-soft">
              <button
                type="button"
                onClick={() => setAppointmentsSubTab('list')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                  appointmentsSubTab === 'list'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined text-base">event_note</span>
                فهرست نوبت‌ها
                <span className="text-[10px] opacity-80">({scopedAppointments.length})</span>
              </button>
              {canManageSettings(currentUser?.role) && (
                <button
                  type="button"
                  onClick={() => setAppointmentsSubTab('settings')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                    appointmentsSubTab === 'settings'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">tune</span>
                  تنظیمات نوبت‌دهی
                </button>
              )}
              {canManageSettings(currentUser?.role) && (
                <button
                  type="button"
                  onClick={() => setAppointmentsSubTab('guide')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                    appointmentsSubTab === 'guide'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">psychology</span>
                  فرم انتخاب درمانگر
                </button>
              )}
            </div>
          </div>

          {appointmentsSubTab === 'guide' && canManageSettings(currentUser?.role) && (
            <div className="animate-fade-in">
              <FreeGuideSettingsPanel
                value={freeGuideDraft}
                onChange={setFreeGuideDraft}
                onSave={handleSaveFreeGuide}
                saving={savingFreeGuide}
                saveMsg={settingsSaveMsg}
              />
            </div>
          )}

          {appointmentsSubTab === 'settings' && canManageSettings(currentUser?.role) && (
            <div className="space-y-4">
              {settingsSaveMsg && (
                <div
                  className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                    settingsSaveMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {settingsSaveMsg.type === 'success' ? 'check_circle' : 'error'}
                  </span>
                  <span>{settingsSaveMsg.msg}</span>
                </div>
              )}

              <div className="bg-white dark:bg-surface-dim p-6 md:p-8 rounded-[32px] shadow-sm border border-outline-variant/30 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-outline-variant/20">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-2xl">calendar_month</span>
                    </div>
                    <div>
                      <h2 className="font-extrabold text-lg text-on-surface">تنظیمات نوبت‌دهی</h2>
                      <p className="text-xs text-on-surface-variant">
                        مدیریت نمایش گزینه رزرو نوبت و دکمه‌های ثبت نوبت آنلاین در تمام صفحات سایت
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-3 py-1 rounded-full self-start sm:self-auto ${
                      resBookingEnabled
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {resBookingEnabled ? 'رزرو نوبت فعال' : 'رزرو نوبت غیرفعال'}
                  </span>
                </div>

                <form onSubmit={handleSaveReservationSettings} className="space-y-5 text-xs">
                  <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer font-extrabold text-sm text-on-surface">
                      <input
                        type="checkbox"
                        checked={resBookingEnabled}
                        onChange={(e) => setResBookingEnabled(e.target.checked)}
                        className="w-5 h-5 accent-primary rounded cursor-pointer"
                      />
                      <span>فعال‌سازی رزرو آنلاین نوبت</span>
                    </label>
                    <p className="text-xs text-on-surface-variant leading-relaxed pr-8">
                      در صورت فعال بودن، دکمه‌های دریافت نوبت آنلاین در صفحات سایت نمایش داده می‌شوند. با
                      غیرفعال کردن، این گزینه‌ها مخفی می‌شوند و فقط ثبت دستی از پنل ادمین ممکن است.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest space-y-1">
                    <p className="text-[11px] font-bold text-on-surface-variant">وضعیت فعلی</p>
                    <p className="text-sm font-black text-on-surface">
                      {resBookingEnabled ? 'رزرو آنلاین روشن است' : 'رزرو آنلاین خاموش است'}
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-primary hover:bg-primary-container text-white font-bold rounded-xl shadow transition-all flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">save</span>
                      <span>ذخیره تنظیمات نوبت‌دهی</span>
                    </button>
                  </div>
                </form>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ------------------------------------------------------------- */}
            {/* CARD 1: ZARINPAL SETTINGS */}
            {/* ------------------------------------------------------------- */}
            <div className="bg-white dark:bg-surface-dim p-6 md:p-8 rounded-[32px] shadow-sm border border-outline-variant/30 space-y-6">
              <div className="flex items-center justify-between border-b pb-4 border-outline-variant/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">payments</span>
                  </div>
                  <div>
                    <h2 className="font-extrabold text-lg text-on-surface">
                      درگاه پرداخت زرین‌پال (ZarinPal)
                    </h2>
                    <p className="text-xs text-on-surface-variant">
                      تنظیمات پرداخت آنلاین هزینه مشاوره
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                      zpEnabled
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {zpEnabled ? 'فعال' : 'غیرفعال'}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSaveZarinpalSettings} className="space-y-5 text-xs">
                {/* Enable / Sandbox Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface-container-low p-4 rounded-2xl">
                  <label className="flex items-center justify-between cursor-pointer font-bold">
                    <span>وضعیت درگاه:</span>
                    <input
                      type="checkbox"
                      checked={zpEnabled}
                      onChange={(e) => setZpEnabled(e.target.checked)}
                      className="w-5 h-5 accent-primary rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer font-bold">
                    <span>حالت آزمایشی (Sandbox):</span>
                    <input
                      type="checkbox"
                      checked={zpIsSandbox}
                      onChange={(e) => setZpIsSandbox(e.target.checked)}
                      className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
                    />
                  </label>
                </div>

                {/* Merchant ID */}
                <div>
                  <label className="block font-bold mb-1.5 text-on-surface">
                    مرچنت کد زرین‌پال (Merchant ID) *
                  </label>
                  <input
                    type="text"
                    required
                    value={zpMerchantId}
                    onChange={(e) => setZpMerchantId(e.target.value)}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    dir="ltr"
                    className="w-full p-3 rounded-2xl border border-outline-variant/40 bg-surface-container-low font-mono text-xs focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="text-[10px] text-on-surface-variant mt-1 block">
                    کد اختصاصی درگاه زرین‌پال دریافت شده از پنل پذیرندگان زرین‌پال
                  </span>
                </div>

                {/* Default Fee */}
                <div>
                  <label className="block font-bold mb-1.5 text-on-surface">
                    مبلغ ثابت رزرو نوبت (تومان)
                  </label>
                  <input
                    type="text"
                    value={zpDefaultFee}
                    onChange={(e) => setZpDefaultFee(e.target.value)}
                    placeholder="۸۵۰,۰۰۰"
                    className="w-full p-3 rounded-2xl border border-outline-variant/40 bg-surface-container-low text-xs"
                  />
                </div>

                {/* Callback URL */}
                <div>
                  <label className="block font-bold mb-1.5 text-on-surface">
                    آدرس بازگشت از درگاه (Callback URL)
                  </label>
                  <input
                    type="url"
                    value={zpCallbackUrl}
                    onChange={(e) => setZpCallbackUrl(e.target.value)}
                    placeholder="https://zhinoclinic.ir/verify-payment"
                    dir="ltr"
                    className="w-full p-3 rounded-2xl border border-outline-variant/40 bg-surface-container-low font-mono text-xs"
                  />
                </div>

                {/* Test Connection Button & Result */}
                <div className="pt-2 border-t border-outline-variant/20 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleTestZarinpalConnection}
                      disabled={isTestingGateway}
                      className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 font-bold rounded-xl transition-all flex items-center gap-2"
                    >
                      {isTestingGateway ? (
                        <span className="w-4 h-4 border-2 border-amber-800 border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <span className="material-symbols-outlined text-base">sensors</span>
                      )}
                      <span>تست اتصال به زرین‌پال</span>
                    </button>

                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow hover:bg-primary/90 transition-all flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">save</span>
                      <span>ذخیره تنظیمات زرین‌پال</span>
                    </button>
                  </div>

                  {testGatewayResult && (
                    <div
                      className={`p-3 rounded-xl border text-[11px] leading-relaxed ${
                        testGatewayResult.startsWith('خطا')
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {testGatewayResult}
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* CARD 2: KAVENEGAR SMS SETTINGS */}
            {/* ------------------------------------------------------------- */}
            <div className="bg-white dark:bg-surface-dim p-6 md:p-8 rounded-[32px] shadow-sm border border-outline-variant/30 space-y-6">
              <div className="flex items-center justify-between border-b pb-4 border-outline-variant/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-sky-500/10 text-sky-600 rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">sms</span>
                  </div>
                  <div>
                    <h2 className="font-extrabold text-lg text-on-surface">
                      پنل پیامکی کاوه‌نگار (Kavenegar)
                    </h2>
                    <p className="text-xs text-on-surface-variant">
                      تنظیمات ارسال پیامک‌های تایید، یادآوری و لغو
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                    kvEnabled
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {kvEnabled ? 'فعال' : 'غیرفعال'}
                </span>
              </div>

              <form onSubmit={handleSaveKavenegarSettings} className="space-y-5 text-xs">
                {/* Status Toggle */}
                <div className="bg-surface-container-low p-4 rounded-2xl">
                  <label className="flex items-center justify-between cursor-pointer font-bold">
                    <span>ارسال هوشمند پیامک به مراجعین:</span>
                    <input
                      type="checkbox"
                      checked={kvEnabled}
                      onChange={(e) => setKvEnabled(e.target.checked)}
                      className="w-5 h-5 accent-sky-600 rounded cursor-pointer"
                    />
                  </label>
                </div>

                {/* API Key */}
                <div>
                  <label className="block font-bold mb-1.5 text-on-surface">
                    کلید اختصاصی API کاوه‌نگار (API Key) *
                  </label>
                  <input
                    type="text"
                    required
                    value={kvApiKey}
                    onChange={(e) => setKvApiKey(e.target.value)}
                    placeholder="7856412359876543210..."
                    dir="ltr"
                    className="w-full p-3 rounded-2xl border border-outline-variant/40 bg-surface-container-low font-mono text-xs focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>

                {/* Sender Number */}
                <div>
                  <label className="block font-bold mb-1.5 text-on-surface">
                    شماره خط ارسال‌کننده (Sender Line)
                  </label>
                  <input
                    type="text"
                    value={kvSenderNumber}
                    onChange={(e) => setKvSenderNumber(e.target.value)}
                    placeholder="10008403"
                    dir="ltr"
                    className="w-full p-3 rounded-2xl border border-outline-variant/40 bg-surface-container-low font-mono text-xs"
                  />
                </div>

                {/* Patterns */}
                <div className="space-y-3">
                  <label className="block font-bold text-on-surface">
                    الگوی پیامک تایید نوبت جدید
                  </label>
                  <textarea
                    rows={2}
                    value={kvBookingPattern}
                    onChange={(e) => setKvBookingPattern(e.target.value)}
                    className="w-full p-3 rounded-2xl border border-outline-variant/40 bg-surface-container-low text-xs leading-relaxed"
                  ></textarea>

                  <label className="block font-bold text-on-surface">
                    الگوی پیامک یادآوری نوبت
                  </label>
                  <textarea
                    rows={2}
                    value={kvReminderPattern}
                    onChange={(e) => setKvReminderPattern(e.target.value)}
                    className="w-full p-3 rounded-2xl border border-outline-variant/40 bg-surface-container-low text-xs leading-relaxed"
                  ></textarea>
                </div>

                {/* Action Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">save</span>
                    <span>ذخیره تنظیمات پیامک</span>
                  </button>
                </div>
              </form>

              {/* Test SMS Widget */}
              <div className="border-t border-outline-variant/20 pt-4 space-y-3">
                <h3 className="font-bold text-xs text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sky-600 text-base">send</span>
                  <span>ارسال پیامک آزمایشی</span>
                </h3>

                <form onSubmit={handleSendTestSms} className="flex gap-2">
                  <input
                    type="tel"
                    required
                    value={testSmsPhone}
                    onChange={(e) => setTestSmsPhone(e.target.value)}
                    placeholder="شماره همراه (مثال: 09121112233)"
                    dir="ltr"
                    className="flex-1 p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs"
                  />
                  <button
                    type="submit"
                    disabled={isSendingTestSms}
                    className="px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold rounded-xl transition-all text-xs flex items-center gap-1 shrink-0"
                  >
                    {isSendingTestSms ? (
                      <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <span>ارسال تست</span>
                    )}
                  </button>
                </form>

                {testSmsResult && (
                  <div className="p-3 bg-sky-50 text-sky-900 border border-sky-200 rounded-xl text-[11px] leading-relaxed">
                    {testSmsResult}
                  </div>
                )}
              </div>
            </div>
              </div>
            </div>
          )}

          {appointmentsSubTab === 'list' && (
        <div className="space-y-6">
          {/* Controls Header */}
          <div className="bg-white dark:bg-surface-dim p-5 rounded-3xl border border-outline-variant/30 shadow-soft flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Status Filter */}
              <div className="flex gap-1.5 bg-surface-container-low p-1 rounded-xl">
                <button
                  onClick={() => setAppStatusFilter('all')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    appStatusFilter === 'all'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  همه ({scopedAppointments.length})
                </button>
                <button
                  onClick={() => setAppStatusFilter('pending')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    appStatusFilter === 'pending'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  در انتظار ({pendingCount})
                </button>
                <button
                  onClick={() => setAppStatusFilter('confirmed')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    appStatusFilter === 'confirmed'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  تایید شده ({confirmedCount})
                </button>
                <button
                  onClick={() => setAppStatusFilter('completed')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    appStatusFilter === 'completed'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  انجام شد
                </button>
                <button
                  onClick={() => setAppStatusFilter('cancelled')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    appStatusFilter === 'cancelled'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  لغو شده
                </button>
              </div>
            </div>

            {/* Search Box & New Appointment Button */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <input
                  type="text"
                  value={appSearch}
                  onChange={(e) => setAppSearch(e.target.value)}
                  placeholder="جستجو مراجع، تلفن، کد پیگیری..."
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl pr-9 pl-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none"
                />
                <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-on-surface-variant text-base">
                  search
                </span>
              </div>

              {canEditAllAppointments(currentUser?.role) && (
              <button
                onClick={() => setShowAddAppModal(true)}
                className="bg-primary text-white font-bold px-4 py-2 rounded-xl text-xs shadow hover:bg-primary-container transition-all flex items-center gap-1.5 shrink-0"
              >
                <span className="material-symbols-outlined text-base">add</span>
                <span>ثبت نوبت دستی</span>
              </button>
              )}
            </div>
          </div>

          {/* Appointments Table */}
          <div className="bg-white dark:bg-surface-dim rounded-3xl border border-outline-variant/30 shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-surface-container-low text-on-surface-variant font-bold border-b border-outline-variant/30">
                  <tr>
                    <th className="p-4">کد پیگیری</th>
                    <th className="p-4">نام مراجع & شماره همراه</th>
                    <th className="p-4">درمانگر</th>
                    <th className="p-4">نوع خدمت</th>
                    <th className="p-4">تاریخ & زمان</th>
                    <th className="p-4">شیوه</th>
                    <th className="p-4">وضعیت</th>
                    <th className="p-4 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {filteredAppointments.length > 0 ? (
                    filteredAppointments.map((app) => {
                      return (
                        <tr key={app.id} className="hover:bg-surface-container-lowest/50 transition-colors">
                          <td className="p-4 font-mono font-bold text-primary" dir="ltr">
                            {app.bookingRef}
                          </td>

                          <td className="p-4">
                            <div className="font-bold text-on-surface text-sm">{app.patientName}</div>
                            <div className="text-on-surface-variant font-mono" dir="ltr">
                              {app.patientPhone}
                            </div>
                          </td>

                          <td className="p-4 font-medium text-on-surface">{app.doctorName}</td>

                          <td className="p-4 text-on-surface-variant">{app.serviceTitle}</td>

                          <td className="p-4">
                            <div className="font-bold">{app.date}</div>
                            <div className="text-on-surface-variant">ساعت {app.timeSlot}</div>
                          </td>

                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                                app.sessionType === 'in-person'
                                  ? 'bg-secondary/10 text-secondary'
                                  : 'bg-tertiary/10 text-tertiary'
                              }`}
                            >
                              {app.sessionType === 'in-person' ? 'حضوری' : 'آنلاین'}
                            </span>
                          </td>

                          <td className="p-4">
                            {app.status === 'confirmed' && (
                              <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 px-3 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                تایید شده
                              </span>
                            )}
                            {app.status === 'pending' && (
                              <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 px-3 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                در انتظار تایید
                              </span>
                            )}
                            {app.status === 'completed' && (
                              <span className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                انجام شد
                              </span>
                            )}
                            {app.status === 'cancelled' && (
                              <span className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 px-3 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                لغو شده
                              </span>
                            )}
                          </td>

                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Status Change Controls */}
                              {app.status === 'pending' && (
                                <button
                                  onClick={() => handleStatusChange(app.id, 'confirmed')}
                                  title="تایید نوبت"
                                  className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors"
                                >
                                  <span className="material-symbols-outlined text-base">check</span>
                                </button>
                              )}
                              {app.status === 'confirmed' && (
                                <button
                                  onClick={() => handleStatusChange(app.id, 'completed')}
                                  title="علامت‌گذاری به عنوان انجام‌شده"
                                  className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-colors"
                                >
                                  <span className="material-symbols-outlined text-base">task_alt</span>
                                </button>
                              )}
                              {app.status !== 'cancelled' && (
                                <button
                                  onClick={() => handleStatusChange(app.id, 'cancelled')}
                                  title="لغو نوبت"
                                  className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-colors"
                                >
                                  <span className="material-symbols-outlined text-base">block</span>
                                </button>
                              )}

                              <button
                                onClick={() => setEditingApp(app)}
                                title="مشاهده جزئیات / یادداشت"
                                className="p-1.5 bg-surface-container hover:bg-surface-container-high rounded-lg text-on-surface transition-colors"
                              >
                                <span className="material-symbols-outlined text-base">visibility</span>
                              </button>

                              {canDeleteAppointments(currentUser?.role) && (
                              <button
                                onClick={() => setAppToDelete(app)}
                                title="حذف نوبت"
                                className="p-1.5 bg-surface-container text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-colors"
                              >
                                <span className="material-symbols-outlined text-base">delete</span>
                              </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-on-surface-variant">
                        هیچ نوبتی با این مشخصات یافت نشد.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PERSONNEL & SERVICES MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'personnel' && canAccessPersonnelTab(currentUser?.role) && (
        <div className="space-y-6">
          {/* Sub-toggle header */}
          <div className="flex justify-between items-center bg-white dark:bg-surface-dim p-4 rounded-3xl border border-outline-variant/30 shadow-soft">
            <div className="flex gap-2 bg-surface-container-low p-1 rounded-2xl">
              {canManageDoctors(currentUser?.role) && (
              <button
                onClick={() => setPersonnelSubTab('doctors')}
                className={`px-5 py-2 text-xs font-bold rounded-xl transition-all ${
                  personnelSubTab === 'doctors'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                کادر درمانگر و روانشناسان ({doctors.length})
              </button>
              )}
              <button
                onClick={() => setPersonnelSubTab('services')}
                className={`px-5 py-2 text-xs font-bold rounded-xl transition-all ${
                  personnelSubTab === 'services'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                خدمات درمانی کلینیک ({services.length})
              </button>
            </div>

            {personnelSubTab === 'doctors' && canManageDoctors(currentUser?.role) ? (
              <button
                onClick={() => handleOpenDoctorModal()}
                className="bg-primary text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow hover:bg-primary-container transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">add</span>
                <span>افزودن درمانگر جدید</span>
              </button>
            ) : canManagePersonnel(currentUser?.role) ? (
              <button
                onClick={() => handleOpenServiceModal()}
                className="bg-primary text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow hover:bg-primary-container transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">add</span>
                <span>افزودن خدمت جدید</span>
              </button>
            ) : (
              <span className="text-[11px] font-bold text-on-surface-variant bg-surface-container-low px-3 py-2 rounded-xl">
                فقط مشاهده خدمات
              </span>
            )}
          </div>

          {/* DOCTORS SUB-TAB */}
          {personnelSubTab === 'doctors' && canManageDoctors(currentUser?.role) && (
            <div className="space-y-6">
              {/* Doctor Filters & Search */}
              <div className="bg-white dark:bg-surface-dim p-4 rounded-3xl border border-outline-variant/30 shadow-soft flex flex-wrap gap-3 items-center justify-between text-xs">
                <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                  {/* Search Bar */}
                  <div className="relative flex-1 min-w-[200px]">
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                      search
                    </span>
                    <input
                      type="text"
                      value={docSearch}
                      onChange={(e) => setDocSearch(e.target.value)}
                      placeholder="جستجوی نام درمانگر، شماره نظام، برچسب..."
                      className="w-full pr-9 pl-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-low text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>

                  {/* Specialty Filter */}
                  <select
                    value={docSpecialtyFilter}
                    onChange={(e) => setDocSpecialtyFilter(e.target.value)}
                    className="p-2 rounded-xl border border-outline-variant/30 bg-surface-container-low font-medium outline-none"
                  >
                    <option value="all">همه تخصص‌ها</option>
                    <option value="individual">مشاوره فردی</option>
                    <option value="family">خانواده و ازدواج</option>
                    <option value="child">کودک و نوجوان</option>
                    <option value="assessment">ارزیابی و سنجش</option>
                    <option value="cbt">شناختی-رفتاری (CBT)</option>
                  </select>

                  {/* Status Filter */}
                  <select
                    value={docStatusFilter}
                    onChange={(e) => setDocStatusFilter(e.target.value as any)}
                    className="p-2 rounded-xl border border-outline-variant/30 bg-surface-container-low font-medium outline-none"
                  >
                    <option value="all">همه وضعیت‌ها</option>
                    <option value="active">فقط فعال‌ها</option>
                    <option value="inactive">فقط غیرفعال‌ها</option>
                  </select>
                </div>

                <div className="text-on-surface-variant font-bold text-[11px] bg-surface-container-low px-3 py-1.5 rounded-xl">
                  نمایش {filteredDoctors.length} از {doctors.length} درمانگر
                </div>
              </div>

              {/* Doctors Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDoctors.map((doc) => (
                  <div
                    key={doc.id}
                    className={`bg-white dark:bg-surface-dim p-6 rounded-3xl border transition-all shadow-soft space-y-4 flex flex-col justify-between ${
                      doc.active
                        ? 'border-outline-variant/30 hover:shadow-md'
                        : 'border-rose-200 bg-rose-50/20 opacity-75'
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Doctor Header */}
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <img
                            src={doc.avatar}
                            alt={doc.name}
                            className="w-16 h-16 rounded-2xl object-cover shadow border border-outline-variant/20"
                          />
                          <span
                            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-surface-dim ${
                              doc.active ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                            title={doc.active ? 'فعال جهت اخذ نوبت' : 'غیرفعال'}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h3 className="font-bold text-on-surface text-base truncate">{doc.name}</h3>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                                doc.active
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {doc.active ? 'فعال' : 'غیرفعال'}
                            </span>
                          </div>
                          <p className="text-xs text-primary font-bold mt-0.5 truncate">{doc.title}</p>
                          <p className="text-[11px] text-on-surface-variant truncate">{doc.degree}</p>
                          {doc.licenseNumber && (
                            <p className="text-[10px] text-secondary font-semibold mt-1 bg-secondary/10 px-2 py-0.5 rounded-md inline-block">
                              کد نظام: {doc.licenseNumber}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Fee & Working Hours Pill */}
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-surface-container-low p-2 rounded-xl flex items-center gap-1.5 text-on-surface">
                          <span className="material-symbols-outlined text-base text-primary">payments</span>
                          <div>
                            <span className="block text-[9px] text-on-surface-variant">تعرفه جلسه</span>
                            <span className="font-bold text-xs">{doc.consultationFee || '۸۵۰,۰۰۰ تومان'}</span>
                          </div>
                        </div>
                        <div className="bg-surface-container-low p-2 rounded-xl flex items-center gap-1.5 text-on-surface">
                          <span className="material-symbols-outlined text-base text-primary">schedule</span>
                          <div>
                            <span className="block text-[9px] text-on-surface-variant">زمان حضور</span>
                            <span className="font-bold text-[10px] truncate block">{doc.workingHours || 'روزهای زوج'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2 bg-surface-container-low/50 p-3 rounded-xl border border-outline-variant/10">
                        {doc.bio || 'توضیحاتی ثبت نشده است.'}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {doc.tags && doc.tags.length > 0 ? (
                          doc.tags.map((tag) => (
                            <span
                              key={tag}
                              className="bg-primary/5 text-primary border border-primary/10 px-2 py-0.5 rounded-md text-[10px] font-medium"
                            >
                              #{tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-on-surface-variant italic">بدون برچسب</span>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleToggleDoctorActive(doc.id)}
                        className="text-xs text-on-surface-variant hover:text-primary font-bold flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-base text-primary">
                          {doc.active ? 'toggle_on' : 'toggle_off'}
                        </span>
                        <span>{doc.active ? 'غیرفعال‌سازی' : 'فعال‌سازی'}</span>
                      </button>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenDoctorModal(doc)}
                          className="px-3 py-1.5 bg-primary/10 text-primary font-bold rounded-xl text-xs hover:bg-primary hover:text-white transition-all flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                          <span>ویرایش</span>
                        </button>
                        <button
                          onClick={() => setDocToDelete(doc)}
                          className="px-3 py-1.5 bg-rose-50 text-rose-600 font-bold rounded-xl text-xs hover:bg-rose-600 hover:text-white transition-all flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                          <span>حذف</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredDoctors.length === 0 && (
                  <div className="col-span-full bg-white dark:bg-surface-dim p-10 rounded-3xl text-center border border-dashed border-outline-variant/40 space-y-3">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant">search_off</span>
                    <p className="text-sm font-bold text-on-surface">هیچ درمانگری با فیلترهای انتخاب‌شده یافت نشد.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SERVICES SUB-TAB */}
          {personnelSubTab === 'services' && (
            <div className="space-y-6">
              {/* Service Search */}
              <div className="bg-white dark:bg-surface-dim p-4 rounded-3xl border border-outline-variant/30 shadow-soft flex items-center justify-between text-xs">
                <div className="relative flex-1 max-w-md">
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                    search
                  </span>
                  <input
                    type="text"
                    value={servSearch}
                    onChange={(e) => setServSearch(e.target.value)}
                    placeholder="جستجوی نام یا توضیحات خدمت..."
                    className="w-full pr-9 pl-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-low text-xs outline-none"
                  />
                </div>
                <div className="text-on-surface-variant font-bold text-[11px] bg-surface-container-low px-3 py-1.5 rounded-xl">
                  {filteredServices.length} خدمت فعال
                </div>
              </div>

              {/* Services Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredServices.map((serv) => (
                  <div
                    key={serv.id}
                    className="bg-white dark:bg-surface-dim p-6 rounded-3xl border border-outline-variant/30 shadow-soft space-y-4 flex flex-col justify-between hover:shadow-md transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                          <span className="material-symbols-outlined text-3xl">{serv.icon}</span>
                        </div>
                        {serv.badge && (
                          <span className="bg-secondary/10 text-secondary text-[11px] font-bold px-2.5 py-1 rounded-full">
                            {serv.badge}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-lg text-on-surface">{serv.title}</h3>
                      <p className="text-xs text-on-surface-variant leading-relaxed">{serv.description}</p>

                      <div className="flex items-center justify-between pt-2 text-xs font-bold border-t border-outline-variant/10">
                        <span className="text-primary flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">schedule</span>
                          {serv.duration || '۴۵ دقیقه'}
                        </span>
                        <span className="text-on-surface bg-surface-container-low px-2.5 py-1 rounded-lg">
                          {serv.fee || '۸۵۰,۰۰۰ تومان'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-outline-variant/20 flex flex-wrap justify-end gap-2">
                      {canEditServicePages(currentUser?.role) && (
                      <button
                        onClick={() => setPageBuilderService(serv)}
                        className="px-4 py-2 bg-emerald-50 text-emerald-700 font-bold rounded-xl text-xs hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">dashboard_customize</span>
                        <span>ویرایش صفحه</span>
                      </button>
                      )}
                      {canManagePersonnel(currentUser?.role) && (
                      <button
                        onClick={() => handleOpenServiceModal(serv)}
                        className="px-4 py-2 bg-primary/10 text-primary font-bold rounded-xl text-xs hover:bg-primary hover:text-white transition-all flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                        <span>ویرایش</span>
                      </button>
                      )}
                      {canDeleteServices(currentUser?.role) && (
                      <button
                        onClick={() => setServiceToDelete(serv)}
                        className="px-4 py-2 bg-rose-50 text-rose-600 font-bold rounded-xl text-xs hover:bg-rose-600 hover:text-white transition-all flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                        <span>حذف</span>
                      </button>
                      )}
                    </div>
                  </div>
                ))}

                {filteredServices.length === 0 && (
                  <div className="col-span-full bg-white dark:bg-surface-dim p-10 rounded-3xl text-center border border-dashed border-outline-variant/40">
                    <p className="text-sm font-bold text-on-surface">هیچ خدمتی پیدا نشد.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BLOG & ARTICLES MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'pages' && canEditSitePages(currentUser?.role) && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-surface-dim rounded-3xl border border-outline-variant/30 shadow-soft p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">web</span>
                مدیریت صفحه‌ها
              </h2>
              <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed max-w-xl">
                صفحات اصلی (خانه، درباره ما، تماس، مقالات) و صفحات سفارشی را با صفحه‌ساز ویرایش کنید یا صفحه جدید بسازید.
                آدرس صفحات سفارشی به‌صورت <span className="font-mono" dir="ltr">/p/نامک</span> در دسترس است.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setNewPageTitle('');
                setNewPageSlug('');
                setShowCreatePageModal(true);
              }}
              className="bg-primary text-white font-bold px-5 py-3 rounded-xl text-xs shadow-lg shadow-primary/25 hover:bg-primary-container transition-all flex items-center gap-1.5 shrink-0"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              ایجاد صفحه جدید
            </button>
          </div>

          <div className="relative max-w-md">
            <input
              type="text"
              value={pageSearch}
              onChange={(e) => setPageSearch(e.target.value)}
              placeholder="جستجوی عنوان یا نامک صفحه..."
              className="w-full bg-white dark:bg-surface-dim border border-outline-variant/40 rounded-xl pr-9 pl-3 py-2.5 text-xs focus:ring-2 focus:ring-primary outline-none"
            />
            <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-on-surface-variant text-base">
              search
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Quick-create card */}
            <button
              type="button"
              onClick={() => {
                setNewPageTitle('');
                setNewPageSlug('');
                setShowCreatePageModal(true);
              }}
              className="min-h-[220px] rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary transition-all p-5 flex flex-col items-center justify-center gap-3 text-primary"
            >
              <span className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">note_add</span>
              </span>
              <span className="text-sm font-black">ایجاد صفحه جدید</span>
              <span className="text-[11px] text-on-surface-variant font-bold text-center max-w-[200px]">
                صفحه سفارشی بسازید و با صفحه‌ساز طراحی کنید
              </span>
            </button>

            {filteredManagedPages.map((page) => {
              const system = isSystemSitePage(page);
              const meta = system && page.id in SITE_PAGE_META ? SITE_PAGE_META[page.id as SitePageId] : null;
              const path = getSitePagePath(page);
              const blockCount = page.pageBuilder?.blocks?.length || 0;
              const icon = meta?.icon || 'description';
              return (
                <div
                  key={page.id}
                  className="bg-white dark:bg-surface-dim rounded-2xl border border-outline-variant/30 overflow-hidden shadow-soft flex flex-col"
                >
                  {page.coverImage ? (
                    <div className="aspect-[16/7] bg-surface-container-low overflow-hidden">
                      <img
                        src={page.coverImage}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : null}
                  <div className="p-5 flex flex-col gap-4 flex-1">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined">{icon}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-sm text-on-surface">{page.title}</h3>
                        {seoOptimizerEnabled && (
                          <SeoScoreBadge
                            score={analyzePageSeo(page).score}
                            size="sm"
                          />
                        )}
                        {system ? (
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">
                            اصلی
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-lg">
                            سفارشی
                          </span>
                        )}
                        {!system && page.status === 'draft' && (
                          <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg">
                            پیش‌نویس
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-on-surface-variant font-mono mt-0.5 truncate" dir="ltr">
                        {path}
                      </p>
                      {page.excerpt ? (
                        <p className="text-[11px] text-on-surface-variant mt-1 line-clamp-2 leading-relaxed">
                          {page.excerpt}
                        </p>
                      ) : (
                        <p className="text-[11px] text-on-surface-variant mt-1">{blockCount} بلوک</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-auto">
                    <button
                      type="button"
                      onClick={() => setPageBuilderSitePage(page)}
                      className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-container flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-base">edit_note</span>
                      ویرایش با صفحه‌ساز
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditPageMeta(page)}
                        className="flex-1 py-2 rounded-xl border border-outline-variant/40 text-xs font-bold hover:bg-surface-container-low"
                      >
                        مشخصات
                      </button>
                      <a
                        href={path === '/' ? '/' : path}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2 rounded-xl border border-outline-variant/40 text-xs font-bold hover:bg-surface-container-low text-center"
                      >
                        مشاهده
                      </a>
                      {!system && (
                        <button
                          type="button"
                          onClick={() => void handleDeleteSitePage(page)}
                          className="px-3 py-2 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-600 hover:text-white"
                          title="حذف"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredManagedPages.length === 0 && (
            <div className="text-center py-12 text-sm text-on-surface-variant bg-white dark:bg-surface-dim rounded-3xl border border-outline-variant/30">
              صفحه‌ای با این جستجو پیدا نشد.
            </div>
          )}
        </div>
      )}

      {activeTab === 'articles' && canManageArticles(currentUser?.role) && (
        <div className="space-y-6">
          {/* Articles / Categories sub-tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1.5 bg-white dark:bg-surface-dim p-1 rounded-2xl border border-outline-variant/30 shadow-soft">
              <button
                type="button"
                onClick={() => setArticlesSubTab('list')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                  articlesSubTab === 'list'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined text-base">article</span>
                مقالات
              </button>
              {canManageAllArticles(currentUser?.role) && (
                <button
                  type="button"
                  onClick={() => setArticlesSubTab('categories')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                    articlesSubTab === 'categories'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">category</span>
                  مدیریت دسته‌بندی
                  <span className="text-[10px] opacity-80">({articleCategories.length})</span>
                </button>
              )}
            </div>
            {articlesSubTab === 'list' && (
              <button
                type="button"
                onClick={() => handleOpenArticleEditor()}
                className="bg-primary text-white font-bold px-4 py-2 rounded-xl text-xs shadow hover:bg-primary-container transition-all flex items-center gap-1.5 shrink-0"
              >
                <span className="material-symbols-outlined text-base">add</span>
                <span>ایجاد مقاله جدید</span>
              </button>
            )}
          </div>

          {articlesSubTab === 'categories' && canManageAllArticles(currentUser?.role) && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-surface-dim rounded-3xl border border-outline-variant/30 shadow-soft p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-black text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">add_circle</span>
                    افزودن دسته‌بندی جدید
                  </h3>
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    دسته‌ها در فرم ایجاد/ویرایش مقاله و فیلتر صفحه بلاگ استفاده می‌شوند.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                  <label className="block space-y-1">
                    <span className="text-[11px] font-bold text-on-surface-variant">نام دسته *</span>
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => {
                        const v = e.target.value;
                        setNewCategoryName(v);
                        if (!newCategorySlug || newCategorySlug === slugifyCategoryName(newCategoryName)) {
                          setNewCategorySlug(slugifyCategoryName(v));
                        }
                      }}
                      placeholder="مثال: سلامت روان و اضطراب"
                      className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[11px] font-bold text-on-surface-variant">نامک (Slug)</span>
                    <input
                      type="text"
                      value={newCategorySlug}
                      onChange={(e) =>
                        setNewCategorySlug(
                          e.target.value
                            .trim()
                            .toLowerCase()
                            .replace(/\s+/g, '-')
                            .replace(/[^\u0600-\u06FFa-z0-9-]/gi, '')
                        )
                      }
                      dir="ltr"
                      placeholder="mental-health"
                      className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs font-mono text-left"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={savingCategory || !newCategoryName.trim()}
                    onClick={() => void handleAddArticleCategory()}
                    className="px-5 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">save</span>
                    {savingCategory ? 'ذخیره...' : 'افزودن دسته'}
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-surface-dim rounded-3xl border border-outline-variant/30 shadow-soft overflow-hidden">
                <div className="px-5 py-3 border-b border-outline-variant/20 flex items-center justify-between">
                  <h3 className="text-sm font-black text-on-surface">فهرست دسته‌بندی‌ها</h3>
                  <span className="text-[11px] text-on-surface-variant font-bold">
                    {articleCategories.length} مورد
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-surface-container-low text-on-surface-variant">
                      <tr>
                        <th className="p-3 font-bold">ترتیب</th>
                        <th className="p-3 font-bold">نام</th>
                        <th className="p-3 font-bold">Slug</th>
                        <th className="p-3 font-bold">مقالات</th>
                        <th className="p-3 font-bold">وضعیت</th>
                        <th className="p-3 font-bold">عملیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {articleCategories.map((cat, idx) => (
                        <tr key={cat.id} className="border-t border-outline-variant/15 hover:bg-surface-container-low/40">
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                className="p-1 rounded-lg hover:bg-surface-container disabled:opacity-30"
                                disabled={idx === 0}
                                onClick={() => void handleMoveCategory(cat, -1)}
                                title="بالا"
                              >
                                <span className="material-symbols-outlined text-sm">arrow_upward</span>
                              </button>
                              <span className="font-mono text-[11px] w-6 text-center">{cat.sortOrder ?? idx + 1}</span>
                              <button
                                type="button"
                                className="p-1 rounded-lg hover:bg-surface-container disabled:opacity-30"
                                disabled={idx === articleCategories.length - 1}
                                onClick={() => void handleMoveCategory(cat, 1)}
                                title="پایین"
                              >
                                <span className="material-symbols-outlined text-sm">arrow_downward</span>
                              </button>
                            </div>
                          </td>
                          <td className="p-3 font-bold text-on-surface">
                            <button
                              type="button"
                              onClick={() => handleOpenEditCategory(cat)}
                              className="hover:text-primary hover:underline text-right"
                              title="ویرایش دسته‌بندی"
                            >
                              {cat.name}
                            </button>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-on-surface-variant" dir="ltr">
                            {cat.slug}
                          </td>
                          <td className="p-3">
                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-lg font-bold">
                              {categoryArticleCount(cat)}
                            </span>
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => void handleToggleCategoryActive(cat)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                                cat.active !== false
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {cat.active !== false ? 'فعال' : 'غیرفعال'}
                            </button>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditCategory(cat)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white text-[11px] font-bold transition-colors"
                                title="ویرایش دسته‌بندی"
                              >
                                <span className="material-symbols-outlined text-sm">edit</span>
                                ویرایش
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteArticleCategory(cat)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 text-rose-600 text-[11px] font-bold"
                                title="حذف"
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                                حذف
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {articleCategories.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-on-surface-variant">
                            هنوز دسته‌بندی‌ای ثبت نشده است.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {articlesSubTab === 'list' && (
            <>
          {/* Controls Bar */}
          <div className="bg-white dark:bg-surface-dim p-5 rounded-3xl border border-outline-variant/30 shadow-soft flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex gap-1.5 bg-surface-container-low p-1 rounded-xl">
                <button
                  onClick={() => setArtStatusFilter('all')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    artStatusFilter === 'all'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-on-surface-variant'
                  }`}
                >
                  همه ({scopedArticles.length})
                </button>
                <button
                  onClick={() => setArtStatusFilter('published')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    artStatusFilter === 'published'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-on-surface-variant'
                  }`}
                >
                  منتشر شده
                </button>
                <button
                  onClick={() => setArtStatusFilter('draft')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    artStatusFilter === 'draft'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-on-surface-variant'
                  }`}
                >
                  پیش‌نویس
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <input
                  type="text"
                  value={artSearch}
                  onChange={(e) => setArtSearch(e.target.value)}
                  placeholder="جستجوی عنوان مقاله یا نویسنده..."
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl pr-9 pl-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none"
                />
                <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-on-surface-variant text-base">
                  search
                </span>
              </div>
            </div>
          </div>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((art) => (
              <div
                key={art.id}
                className="bg-white dark:bg-surface-dim rounded-3xl border border-outline-variant/30 shadow-soft overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-video relative overflow-hidden bg-surface-container">
                    <img
                      src={art.coverImage}
                      alt={art.title}
                      className="w-full h-full object-cover"
                    />
                    <span
                      className={`absolute top-3 right-3 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow ${
                        art.status === 'published'
                          ? 'bg-emerald-600'
                          : art.status === 'draft'
                          ? 'bg-amber-500'
                          : 'bg-slate-500'
                      }`}
                    >
                      {art.status === 'published' ? 'منتشر شده' : 'پیش‌نویس'}
                    </span>
                    {seoOptimizerEnabled && (
                      <span className="absolute top-3 left-3">
                        <SeoScoreBadge score={analyzeArticleSeo(art).score} size="sm" />
                      </span>
                    )}
                  </div>

                  <div className="p-5 space-y-3">
                    <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full inline-block">
                      {art.category}
                    </span>
                    <h3 className="font-bold text-base text-on-surface leading-snug line-clamp-2">
                      {art.title}
                    </h3>
                    <p className="text-xs text-on-surface-variant line-clamp-2">{art.summary}</p>
                    
                    <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-2 border-t border-outline-variant/20">
                      <span>نویسنده: {art.authorName}</span>
                      <span>{art.views} بازدید</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 flex gap-2">
                  <button
                    onClick={() => handleOpenArticleEditor(art)}
                    className="flex-1 py-2 bg-surface-container text-primary font-bold rounded-xl text-xs hover:bg-primary/10"
                  >
                    ویرایش
                  </button>
                  <button
                    onClick={() => handleDeleteArticle(art.id)}
                    className="py-2 px-3 bg-rose-50 text-rose-600 font-bold rounded-xl text-xs hover:bg-rose-600 hover:text-white transition-colors"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3.5: FAQ MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'faqs' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-surface-dim p-6 rounded-3xl border border-outline-variant/30 shadow-xs">
            <div>
              <h2 className="text-xl font-extrabold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">quiz</span>
                <span>مدیریت سوالات متداول و پرسش‌وپاسخ مراجعین</span>
              </h2>
              <p className="text-xs text-on-surface-variant mt-1">
                پاسخ‌دهی، ویرایش، تایید و انتشار سوالات مطرح‌شده توسط مراجعین کلینیک
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="bg-amber-500/10 text-amber-800 font-bold px-3 py-1.5 rounded-full">
                {pendingFaqsCount} سوال در انتظار پاسخ
              </span>
              <span className="bg-emerald-500/10 text-emerald-800 font-bold px-3 py-1.5 rounded-full">
                {faqs.filter((f) => f.status === 'approved').length} سوال تایید و منتشر شده
              </span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white dark:bg-surface-dim p-4 rounded-2xl border border-outline-variant/30 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-on-surface">وضعیت:</span>
              <div className="flex bg-surface-container-low p-1 rounded-xl">
                {[
                  { id: 'all', title: 'همه' },
                  { id: 'pending', title: 'در انتظار پاسخ' },
                  { id: 'approved', title: 'تایید و منتشر شده' },
                  { id: 'rejected', title: 'رد شده' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setFaqStatusFilter(st.id as any)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      faqStatusFilter === st.id
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    {st.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-on-surface">دسته خدمت:</span>
              <select
                value={faqCatFilter}
                onChange={(e) => setFaqCatFilter(e.target.value)}
                className="px-3 py-1.5 bg-surface-container-low border border-outline-variant/30 rounded-xl font-bold focus:outline-none focus:border-primary"
              >
                {FAQ_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <span className="material-symbols-outlined absolute right-3 top-2.5 text-on-surface-variant text-base">
                search
              </span>
              <input
                type="text"
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                placeholder="جستجو در سوالات..."
                className="w-full pr-9 pl-3 py-1.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* List of FAQs */}
          <div className="space-y-4">
            {filteredFaqs.length === 0 ? (
              <div className="p-10 text-center bg-white dark:bg-surface-dim rounded-3xl border border-outline-variant/30 text-xs text-on-surface-variant">
                هیچ سوالی با فیلترهای انتخابی یافت نشد.
              </div>
            ) : (
              filteredFaqs.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-surface-dim p-5 md:p-6 rounded-3xl border border-outline-variant/30 shadow-xs space-y-4 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-outline-variant/20">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-on-surface text-sm">{item.askedBy}</span>
                      {item.userPhone && (
                        <span className="bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-md font-mono text-[11px]">
                          {item.userPhone}
                        </span>
                      )}
                      <span className="text-on-surface-variant/40">•</span>
                      <span className="bg-primary/10 text-primary font-bold px-2.5 py-0.5 rounded-md text-[11px]">
                        {item.serviceTitle || 'خدمات عمومی'}
                      </span>
                      <span className="text-on-surface-variant/40">•</span>
                      <span className="text-on-surface-variant">{item.date}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold px-3 py-0.5 rounded-full text-[11px] ${
                          item.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.status === 'approved'
                          ? 'منتشرشده در سایت'
                          : item.status === 'pending'
                          ? 'در انتظار پاسخ'
                          : 'رد شده'}
                      </span>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="p-4 rounded-2xl bg-surface-container-low font-bold text-on-surface leading-relaxed text-sm">
                    {item.question}
                  </div>

                  {/* Answer Section */}
                  {item.answer && editingFaq?.id !== item.id && (
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-1">
                      <div className="flex items-center justify-between text-primary font-bold text-xs">
                        <span>پاسخ ثبت‌شده ({item.responderName || 'پزشک کلینیک'}):</span>
                      </div>
                      <p className="text-on-surface leading-relaxed whitespace-pre-line">
                        {item.answer}
                      </p>
                    </div>
                  )}

                  {/* Editing Form */}
                  {editingFaq?.id === item.id ? (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                      <div className="font-bold text-amber-900 dark:text-amber-200">
                        پاسخ‌دهی و ویرایش پاسخ پزشک:
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-on-surface">نام پاسخ‌دهنده (پزشک/مشاور):</label>
                        <input
                          type="text"
                          value={faqResponder}
                          onChange={(e) => setFaqResponder(e.target.value)}
                          className="w-full p-2 bg-white dark:bg-surface border border-outline-variant/40 rounded-xl text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-on-surface">متن پاسخ تخصصی:</label>
                        <textarea
                          rows={4}
                          value={faqAnswerText}
                          onChange={(e) => setFaqAnswerText(e.target.value)}
                          placeholder="پاسخ کامل و راهنمایی پزشکی مراجع را وارد کنید..."
                          className="w-full p-3 bg-white dark:bg-surface border border-outline-variant/40 rounded-xl text-xs leading-relaxed"
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                        <button
                          onClick={() => setEditingFaq(null)}
                          className="px-4 py-2 bg-surface-container text-on-surface font-bold rounded-xl"
                        >
                          انصراف
                        </button>
                        <button
                          onClick={() => handleSaveFaqAnswer(canApproveFaqs(currentUser?.role) ? 'approved' : 'pending')}
                          className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow hover:bg-emerald-700 flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">check</span>
                          <span>
                            {canApproveFaqs(currentUser?.role)
                              ? 'تایید و انتشار در سایت'
                              : 'ثبت پاسخ (نیاز به تأیید اپراتور/مدیر)'}
                          </span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenFaqAnswer(item)}
                          className="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-container transition-all flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                          <span>{item.answer ? 'ویرایش پاسخ' : 'پاسخ‌دهی و انتشار'}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteFaqItem(item.id)}
                          className="px-3 py-2 bg-rose-50 text-rose-600 font-bold rounded-xl hover:bg-rose-600 hover:text-white transition-colors"
                        >
                          حذف سوال
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: FORMS */}
      {/* ========================================================================= */}
      {activeTab === 'forms' &&
        (canManageFormDefinitions(currentUser?.role) ||
          canManageFormSubmissions(currentUser?.role)) && (
          <FormsAdminPanel role={currentUser?.role} />
        )}

      {/* ========================================================================= */}
      {/* TAB: CONTACT INFO */}
      {/* ========================================================================= */}
      {activeTab === 'contact' && canManageSettings(currentUser?.role) && (
        <div className="space-y-6 animate-fade-in">
          <ContactInfoSettingsPanel
            value={contactDraft}
            onChange={setContactDraft}
            onSave={handleSaveContactInfo}
            saving={savingContact}
            saveMsg={settingsSaveMsg}
          />
        </div>
      )}

      {activeTab === 'modules' && canManageModules(currentUser?.role) && (
        <div className="space-y-6 animate-fade-in">
          <ModulesSettingsPanel
            value={modulesDraft}
            onChange={setModulesDraft}
            onSave={handleSaveModules}
            saving={savingModules}
            saveMsg={settingsSaveMsg}
          />
        </div>
      )}

      {activeTab === 'system' && canViewSystemStatus(currentUser?.role) && (
        <div className="space-y-6 animate-fade-in">
          <SystemStatusPanel />
        </div>
      )}

      {activeTab === 'tools-io' && canManageTools(currentUser?.role) && (
        <div className="space-y-6 animate-fade-in">
          <ImportExportPanel />
        </div>
      )}

      {activeTab === 'users' && canManageUsers(currentUser?.role) && (
        <div className="space-y-6 animate-fade-in">
          <UsersManagementPanel currentUserId={currentUser?.id} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SYSTEM SETTINGS (SITE CHROME) */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && canManageSettings(currentUser?.role) && (
        <div className="space-y-8 animate-fade-in">
          {/* Notification Alert */}
          {settingsSaveMsg && (
            <div
              className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                settingsSaveMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              <span className="material-symbols-outlined">
                {settingsSaveMsg.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <span>{settingsSaveMsg.msg}</span>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                    maintenanceMode
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  <span className="material-symbols-outlined">construction</span>
                </div>
                <div>
                  <h2 className="text-sm font-black text-on-surface">حالت تعمیر (Maintenance)</h2>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    بستن موقت سایت برای بازدیدکنندگان و موتورهای جستجو
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={savingMaintenance}
                onClick={() => void handleSaveMaintenance()}
                className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">save</span>
                {savingMaintenance ? 'در حال ذخیره…' : 'ذخیره'}
              </button>
            </div>
            <div className="p-5 space-y-4">
              <label
                className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                  maintenanceMode
                    ? 'border-amber-300 bg-amber-50/80 dark:bg-amber-950/20'
                    : 'border-outline-variant/40 bg-surface-container-low/40'
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-1 rounded border-outline-variant"
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-on-surface">فعال‌سازی Maintenance Mode</p>
                  <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                    کاربران عادی صفحه «در دست تعمیر» را می‌بینند. موتورهای جستجو با{' '}
                    <code className="text-[10px] bg-white/80 px-1 rounded" dir="ltr">
                      noindex
                    </code>{' '}
                    و مسدودسازی در robots از ایندکس شدن جلوگیری می‌شود. کاربران لاگین‌شده (ادمین،
                    اپراتور، پزشک و مراجع) همچنان به سایت دسترسی دارند.
                  </p>
                </div>
                <span
                  className={`shrink-0 text-[10px] font-black px-2.5 py-1 rounded-full ${
                    maintenanceMode
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {maintenanceMode ? 'فعال' : 'غیرفعال'}
                </span>
              </label>

              <label className="block space-y-1.5">
                <span className="text-[11px] font-bold text-on-surface-variant">
                  پیام صفحه تعمیر (اختیاری)
                </span>
                <textarea
                  rows={3}
                  value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  placeholder="سایت موقتاً در دست به‌روزرسانی است. از صبوری شما متشکریم…"
                  className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs outline-none focus:ring-2 focus:ring-primary/30"
                />
              </label>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                    developmentMode
                      ? 'bg-sky-100 text-sky-700'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  <span className="material-symbols-outlined">code</span>
                </div>
                <div>
                  <h2 className="text-sm font-black text-on-surface">حالت توسعه (Development)</h2>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    نمایش ورود سریع آزمایشی و اطلاعات حساب‌های دمو در صفحات لاگین
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={savingDevelopment}
                onClick={() => void handleSaveDevelopment()}
                className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">save</span>
                {savingDevelopment ? 'در حال ذخیره…' : 'ذخیره'}
              </button>
            </div>
            <div className="p-5">
              <label
                className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                  developmentMode
                    ? 'border-sky-300 bg-sky-50/80 dark:bg-sky-950/20'
                    : 'border-outline-variant/40 bg-surface-container-low/40'
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-1 rounded border-outline-variant"
                  checked={developmentMode}
                  onChange={(e) => setDevelopmentMode(e.target.checked)}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-on-surface">فعال‌سازی حالت توسعه</p>
                  <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                    اگر فعال باشد، در صفحات ورود پیشنهاد «ورود سریع»، حساب دموی مراجع و نام کاربری/رمز
                    ادمین آزمایشی نمایش داده می‌شود. در محیط واقعی این گزینه را خاموش نگه دارید.
                  </p>
                </div>
                <span
                  className={`shrink-0 text-[10px] font-black px-2.5 py-1 rounded-full ${
                    developmentMode
                      ? 'bg-sky-200 text-sky-900'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                  }`}
                >
                  {developmentMode ? 'فعال' : 'غیرفعال'}
                </span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="lg:col-span-2">
              <SiteChromeSettingsPanel
                value={siteChromeDraft}
                onChange={(next) => {
                  siteChromeDraftRevisionRef.current += 1;
                  siteChromeSyncBlockedRef.current = true;
                  setSiteChromeDraft(next);
                }}
                onSave={handleSaveSiteChrome}
                saving={savingSiteChrome}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MANUAL APPOINTMENT CREATION */}
      {/* ========================================================================= */}
      {showAddAppModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-dim w-full max-w-lg rounded-3xl shadow-2xl p-6 text-right space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg text-primary">ثبت نوبت جدید توسط ادمین</h3>
              <button
                onClick={() => setShowAddAppModal(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">نام و نام خانوادگی مراجع *</label>
                <input
                  type="text"
                  required
                  value={newAppPatientName}
                  onChange={(e) => setNewAppPatientName(e.target.value)}
                  placeholder="مثال: مریم احمدی"
                  className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">شماره همراه مراجع *</label>
                <input
                  type="tel"
                  required
                  value={newAppPatientPhone}
                  onChange={(e) => setNewAppPatientPhone(e.target.value)}
                  placeholder="0912..."
                  dir="ltr"
                  className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">انتخاب درمانگر</label>
                  <select
                    value={newAppDoctorId}
                    onChange={(e) => setNewAppDoctorId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low font-bold"
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">نوع خدمت</label>
                  <select
                    value={newAppServiceId}
                    onChange={(e) => setNewAppServiceId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low font-bold"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">تاریخ (شمسی)</label>
                  <input
                    type="text"
                    value={newAppDate}
                    onChange={(e) => setNewAppDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-center"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">ساعت جلسه</label>
                  <input
                    type="text"
                    value={newAppTime}
                    onChange={(e) => setNewAppTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">شیوه برگزاری</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="appType"
                      checked={newAppType === 'in-person'}
                      onChange={() => setNewAppType('in-person')}
                    />
                    <span>حضوری</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="appType"
                      checked={newAppType === 'online'}
                      onChange={() => setNewAppType('online')}
                    />
                    <span>آنلاین تصویری</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">یادداشت اداری / موضوع</label>
                <textarea
                  rows={2}
                  value={newAppNotes}
                  onChange={(e) => setNewAppNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddAppModal(false)}
                  className="px-4 py-2 border rounded-xl"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-white font-bold rounded-xl shadow"
                >
                  ثبت نوبت
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW / EDIT APPOINTMENT DETAILS */}
      {/* ========================================================================= */}
      {editingApp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-dim w-full max-w-md rounded-3xl shadow-2xl p-6 text-right space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg text-primary">جزئیات کامل نوبت</h3>
              <button
                onClick={() => setEditingApp(null)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between bg-surface-container-low p-3 rounded-xl">
                <span>کد پیگیری:</span>
                <span className="font-bold text-primary" dir="ltr">{editingApp.bookingRef}</span>
              </div>
              <div className="flex justify-between">
                <span>مراجع:</span>
                <span className="font-bold">{editingApp.patientName} ({editingApp.patientPhone})</span>
              </div>
              <div className="flex justify-between">
                <span>درمانگر:</span>
                <span className="font-bold">{editingApp.doctorName}</span>
              </div>
              <div className="flex justify-between">
                <span>خدمت:</span>
                <span className="font-bold">{editingApp.serviceTitle}</span>
              </div>
              <div className="flex justify-between">
                <span>زمان:</span>
                <span className="font-bold">{editingApp.date} ساعت {editingApp.timeSlot}</span>
              </div>
              <div className="flex justify-between">
                <span>مبلغ نوبت:</span>
                <span className="font-bold">{editingApp.fee}</span>
              </div>

              {editingApp.notes && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900">
                  <div className="font-bold mb-1">یادداشت بیمار / ادمین:</div>
                  <p>{editingApp.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                onClick={() => setAppToDelete(editingApp)}
                className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-base">delete</span>
                <span>حذف این نوبت</span>
              </button>
              <button
                onClick={() => setEditingApp(null)}
                className="bg-primary text-white font-bold px-6 py-2 rounded-xl text-xs"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE DOCTOR CONFIRMATION */}
      {/* ========================================================================= */}
      {docToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-surface-dim w-full max-w-md rounded-3xl shadow-2xl p-6 text-right space-y-5 border border-rose-100">
            <div className="flex items-center gap-3 text-rose-600 border-b border-rose-100 pb-3">
              <span className="material-symbols-outlined text-3xl">warning</span>
              <h3 className="font-bold text-lg">حذف دائم درمانگر</h3>
            </div>

            <div className="flex items-center gap-4 bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
              <img
                src={docToDelete.avatar}
                alt={docToDelete.name}
                className="w-14 h-14 rounded-2xl object-cover shadow border border-white"
              />
              <div>
                <h4 className="font-bold text-on-surface text-sm">{docToDelete.name}</h4>
                <p className="text-xs text-primary font-medium">{docToDelete.title}</p>
                <p className="text-[11px] text-on-surface-variant">{docToDelete.degree}</p>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              آیا از حذف کامل و دائم این متخصص از سیستم اطمینان دارید؟ اطلاعات این درمانگر دیگر در رزرو نوبت یا لیست پزشکان کلینیک نمایش داده نخواهد شد.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeletingDoc}
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 border border-outline-variant/40 rounded-xl font-bold text-xs hover:bg-surface-container"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={isDeletingDoc}
                onClick={handleConfirmDeleteDoctor}
                className="px-6 py-2 bg-rose-600 text-white font-bold rounded-xl text-xs shadow hover:bg-rose-700 transition-all flex items-center gap-1.5"
              >
                {isDeletingDoc ? (
                  <span>در حال حذف...</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">delete_forever</span>
                    <span>تایید و حذف دائم</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE SERVICE CONFIRMATION */}
      {/* ========================================================================= */}
      {serviceToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-surface-dim w-full max-w-md rounded-3xl shadow-2xl p-6 text-right space-y-5 border border-rose-100">
            <div className="flex items-center gap-3 text-rose-600 border-b border-rose-100 pb-3">
              <span className="material-symbols-outlined text-3xl">warning</span>
              <h3 className="font-bold text-lg">حذف خدمت درمانی</h3>
            </div>

            <div className="flex items-center gap-4 bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">{serviceToDelete.icon}</span>
              </div>
              <div>
                <h4 className="font-bold text-on-surface text-sm">{serviceToDelete.title}</h4>
                <p className="text-xs text-on-surface-variant line-clamp-1">{serviceToDelete.description}</p>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              آیا از حذف این خدمت درمانی اطمینان دارید؟
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeletingService}
                onClick={() => setServiceToDelete(null)}
                className="px-4 py-2 border border-outline-variant/40 rounded-xl font-bold text-xs hover:bg-surface-container"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={isDeletingService}
                onClick={handleConfirmDeleteService}
                className="px-6 py-2 bg-rose-600 text-white font-bold rounded-xl text-xs shadow hover:bg-rose-700 transition-all flex items-center gap-1.5"
              >
                {isDeletingService ? (
                  <span>در حال حذف...</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">delete_forever</span>
                    <span>تایید و حذف</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT DOCTOR */}
      {/* ========================================================================= */}
      {showDoctorModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-surface-dim w-full max-w-2xl rounded-3xl shadow-2xl p-6 text-right space-y-4 max-h-[90vh] overflow-y-auto border border-outline-variant/30">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-2xl">medical_information</span>
                <h3 className="font-bold text-lg">
                  {editingDoctor ? 'ویرایش تخصصی مشخصات درمانگر' : 'افزودن درمانگر و روانشناس جدید'}
                </h3>
              </div>
              <button
                onClick={() => setShowDoctorModal(false)}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveDoctor} className="space-y-4 text-xs">
              {/* Row 1: Name & Gender */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block font-bold mb-1 text-on-surface">نام و نام خانوادگی کامل *</label>
                  <input
                    type="text"
                    required
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    placeholder="مثال: دکتر مریم شریفی"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-on-surface">جنسیت</label>
                  <select
                    value={docGender}
                    onChange={(e) => setDocGender(e.target.value as 'female' | 'male')}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs outline-none"
                  >
                    <option value="female">خانم</option>
                    <option value="male">آقا</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Title & Degree */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-on-surface">عنوان شغلی *</label>
                  <input
                    type="text"
                    required
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="مثال: روانشناس و درمانگر ارشد"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-on-surface">مدرک تحصیلی *</label>
                  <input
                    type="text"
                    required
                    value={docDegree}
                    onChange={(e) => setDocDegree(e.target.value)}
                    placeholder="مثال: دکتری روانشناسی بالینی"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Row 3: License Number & Experience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-on-surface">شماره نظام پزشکی / روانشناسی</label>
                  <input
                    type="text"
                    value={docLicenseNumber}
                    onChange={(e) => setDocLicenseNumber(e.target.value)}
                    placeholder="مثال: نظام روانشناسی: ۲۴۵۸۱-ن"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-on-surface">سنوات تجربه (سال)</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={docExperience}
                    onChange={(e) => setDocExperience(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs outline-none"
                  />
                </div>
              </div>

              {/* Row 4: Fee & Working Hours */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-on-surface">هزینه هر جلسه مشاوره</label>
                  <input
                    type="text"
                    value={docConsultationFee}
                    onChange={(e) => setDocConsultationFee(e.target.value)}
                    placeholder="مثال: ۸۵۰,۰۰۰ تومان"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-on-surface">روزها و ساعات حضور در کلینیک</label>
                  <input
                    type="text"
                    value={docWorkingHours}
                    onChange={(e) => setDocWorkingHours(e.target.value)}
                    placeholder="مثال: شنبه تا چهارشنبه (۱۶ الی ۲۰)"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs outline-none"
                  />
                </div>
              </div>

              {/* Row 5: Phone & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-on-surface">شماره تماس مستقیم (اداری)</label>
                  <input
                    type="text"
                    value={docPhone}
                    onChange={(e) => setDocPhone(e.target.value)}
                    placeholder="09120000000"
                    dir="ltr"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs outline-none text-left"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-on-surface">پست الکترونیک</label>
                  <input
                    type="email"
                    value={docEmail}
                    onChange={(e) => setDocEmail(e.target.value)}
                    placeholder="doctor@example.com"
                    dir="ltr"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs outline-none text-left"
                  />
                </div>
              </div>

              {/* Row 6: Avatar Image with Live Preview */}
              <div className="bg-surface-container-low p-3 rounded-2xl border border-outline-variant/30">
                <MediaField
                  label="تصویر پروفایل پرسنل"
                  value={docAvatar}
                  onChange={setDocAvatar}
                  accept="image"
                  aspect="square"
                  helperText="از کتابخانه رسانه یا پوشه پرسنل انتخاب کنید"
                />
              </div>

              {/* Specialties Checkboxes */}
              <div>
                <label className="block font-bold mb-1.5 text-on-surface">دپارتمان‌های تخصصی مرتبط:</label>
                <div className="flex flex-wrap gap-3 bg-surface-container-low p-3 rounded-2xl border border-outline-variant/20">
                  {[
                    { id: 'individual', label: 'مشاوره فردی' },
                    { id: 'family', label: 'خانواده و ازدواج' },
                    { id: 'child', label: 'کودک و نوجوان' },
                    { id: 'assessment', label: 'ارزیابی و سنجش' },
                    { id: 'cbt', label: 'درمان شناختی-رفتاری (CBT)' },
                  ].map((sp) => (
                    <label key={sp.id} className="flex items-center gap-1.5 cursor-pointer font-medium text-xs">
                      <input
                        type="checkbox"
                        checked={docSpecialties.includes(sp.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDocSpecialties([...docSpecialties, sp.id]);
                          } else {
                            setDocSpecialties(docSpecialties.filter((s) => s !== sp.id));
                          }
                        }}
                        className="w-4 h-4 accent-primary rounded"
                      />
                      <span>{sp.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tags Input */}
              <div>
                <label className="block font-bold mb-1 text-on-surface">برچسب‌های تخصصی (با کاما جدا کنید)</label>
                <input
                  type="text"
                  value={docTags}
                  onChange={(e) => setDocTags(e.target.value)}
                  placeholder="مشاوره فردی, CBT, اضطراب, وسواس, افسردگی"
                  className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs outline-none"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block font-bold mb-1 text-on-surface">بیوگرافی، رزومه و سوابق تخصصی *</label>
                <textarea
                  rows={3}
                  required
                  value={docBio}
                  onChange={(e) => setDocBio(e.target.value)}
                  placeholder="توضیحات و سوابق علمی، دانشگاهی و سابقه درمانگری..."
                  className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs outline-none"
                ></textarea>
              </div>

              {/* Active Toggle */}
              <div className="flex justify-between items-center bg-surface-container-low p-3 rounded-2xl border border-outline-variant/20">
                <div>
                  <span className="font-bold text-on-surface block">وضعیت فعالیت در سیستم</span>
                  <span className="text-[10px] text-on-surface-variant block">در صورت فعال بودن، در رزرو نوبت آنلاین نمایش داده می‌شود.</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={docActive}
                    onChange={(e) => setDocActive(e.target.checked)}
                    className="w-4 h-4 accent-primary rounded"
                  />
                  <span className={docActive ? 'text-emerald-700' : 'text-rose-700'}>
                    {docActive ? 'فعال' : 'غیرفعال'}
                  </span>
                </label>
              </div>

              {/* Form Buttons */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDoctorModal(false)}
                  className="px-5 py-2.5 border border-outline-variant/40 rounded-xl font-bold hover:bg-surface-container"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow hover:bg-primary-container transition-all"
                >
                  ذخیره اطلاعات درمانگر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT SERVICE */}
      {/* ========================================================================= */}
      {showServiceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-surface-dim w-full max-w-lg rounded-3xl shadow-2xl p-6 text-right space-y-4 max-h-[90vh] overflow-y-auto border border-outline-variant/30">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-2xl">medical_services</span>
                <h3 className="font-bold text-lg">
                  {editingService ? 'ویرایش خدمت درمانی' : 'افزودن خدمت درمانی جدید'}
                </h3>
              </div>
              <button
                onClick={() => setShowServiceModal(false)}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1 text-on-surface">عنوان خدمت درمانی *</label>
                <input
                  type="text"
                  required
                  value={servTitle}
                  onChange={(e) => setServTitle(e.target.value)}
                  placeholder="مثال: روان‌درمانی فردی بزرگسال"
                  className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs outline-none"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-on-surface">توضیحات جامع خدمت *</label>
                <textarea
                  rows={3}
                  required
                  value={servDesc}
                  onChange={(e) => setServDesc(e.target.value)}
                  placeholder="توضیح متنی درباره این خدمت، مخاطبان و شیوه برگزاری..."
                  className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs outline-none"
                ></textarea>
              </div>

              {/* Icon Selection */}
              <div>
                <label className="block font-bold mb-1 text-on-surface">آیکون خدمت (Material Symbol)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={servIcon}
                    onChange={(e) => setServIcon(e.target.value)}
                    placeholder="psychology"
                    className="flex-1 p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs outline-none"
                  />
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">{servIcon || 'psychology'}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'psychology',
                    'family_restroom',
                    'child_care',
                    'groups',
                    'quiz',
                    'medical_services',
                    'spa',
                    'self_improvement',
                  ].map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setServIcon(ic)}
                      className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 ${
                        servIcon === ic ? 'bg-primary text-white border-primary' : 'bg-surface-container hover:bg-surface-container-high'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">{ic}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration & Fee */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-on-surface">مدت زمان جلسه</label>
                  <input
                    type="text"
                    value={servDuration}
                    onChange={(e) => setServDuration(e.target.value)}
                    placeholder="۴۵ دقیقه"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-on-surface">هزینه خدمت</label>
                  <input
                    type="text"
                    value={servFee}
                    onChange={(e) => setServFee(e.target.value)}
                    placeholder="۸۵۰,۰۰۰ تومان"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs outline-none"
                  />
                </div>
              </div>

              {/* Badge & Target Screen */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-on-surface">بج ویژه (اختیاری)</label>
                  <input
                    type="text"
                    value={servBadge}
                    onChange={(e) => setServBadge(e.target.value)}
                    placeholder="تخصصی / پرطرفدار"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-on-surface">لندینگ پیج مرتبط</label>
                  <select
                    value={servTargetScreen}
                    onChange={(e) => setServTargetScreen(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs outline-none"
                  >
                    <option value="">صفحه خدمت عمومی</option>
                    <option value="adult-therapy">لندینگ روان‌درمانی بزرگسالان</option>
                    <option value="child-therapy">لندینگ مشاوره کودک و نوجوان</option>
                    <option value="marriage-therapy">لندینگ زوج‌درمانی و خانواده</option>
                    <option value="psychometry">لندینگ روان‌سنجی و تست‌ها</option>
                    <option value="cbt-therapy">لندینگ درمان شناخت‌رفتاری</option>
                  </select>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="px-4 py-2 border border-outline-variant/40 rounded-xl font-bold hover:bg-surface-container"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-white font-bold rounded-xl shadow hover:bg-primary-container transition-all"
                >
                  ذخیره خدمت درمانی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT ARTICLE CATEGORY */}
      {/* ========================================================================= */}
      {editingCategory &&
        createPortal(
          <div
            className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-category-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) setEditingCategory(null);
            }}
          >
            <div className="bg-white dark:bg-surface-dim w-full max-w-md rounded-3xl shadow-2xl p-6 text-right space-y-4 border border-outline-variant/30">
              <div className="flex justify-between items-center border-b pb-3">
                <h3
                  id="edit-category-title"
                  className="font-extrabold text-base text-on-surface flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-primary">edit</span>
                  ویرایش دسته‌بندی
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              <label className="block space-y-1">
                <span className="text-[11px] font-bold text-on-surface-variant">نام دسته *</span>
                <input
                  type="text"
                  autoFocus
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void handleSaveEditCategory();
                    }
                  }}
                  className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-sm"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-[11px] font-bold text-on-surface-variant">نامک (Slug)</span>
                <input
                  type="text"
                  dir="ltr"
                  value={editCatSlug}
                  onChange={(e) =>
                    setEditCatSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/[^\u0600-\u06FFa-z0-9-]/gi, '')
                    )
                  }
                  className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-sm font-mono text-left"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-[11px] font-bold text-on-surface-variant">ترتیب نمایش</span>
                <input
                  type="number"
                  value={editCatOrder}
                  onChange={(e) => setEditCatOrder(Number(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-sm"
                />
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={editCatActive}
                  onChange={(e) => setEditCatActive(e.target.checked)}
                  className="rounded border-outline-variant"
                />
                <span className="text-xs font-bold text-on-surface">فعال (نمایش در فرم مقاله و بلاگ)</span>
              </label>

              <p className="text-[10px] text-on-surface-variant leading-relaxed">
                با تغییر نام دسته، نام روی مقالاتی که به این دسته وصل هستند هم به‌روز می‌شود.
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="flex-1 py-2.5 rounded-xl border border-outline-variant/40 font-bold text-xs"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  disabled={savingCategory || !editCatName.trim()}
                  onClick={() => void handleSaveEditCategory()}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold text-xs disabled:opacity-50"
                >
                  {savingCategory ? 'ذخیره...' : 'ذخیره تغییرات'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE APPOINTMENT CONFIRMATION */}
      {/* ========================================================================= */}
      {appToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-surface-dim w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center space-y-4 border border-rose-200">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">delete_forever</span>
            </div>
            <h3 className="font-extrabold text-lg text-on-surface">تایید حذف نوبت</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              آیا از حذف نوبت مراجع <span className="font-bold text-on-surface">{appToDelete.patientName}</span> با کد پیگیری <span className="font-bold text-primary dir-ltr inline-block">{appToDelete.bookingRef}</span> اطمینان دارید؟
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setAppToDelete(null)}
                disabled={isDeletingApp}
                className="flex-1 py-2.5 rounded-xl border border-outline-variant/40 font-bold text-xs hover:bg-surface-container transition-all"
              >
                انصراف
              </button>
              <button
                onClick={handleConfirmDeleteAppointment}
                disabled={isDeletingApp}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-1"
              >
                {isDeletingApp ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">delete</span>
                    <span>حذف نهایی</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreatePageModal &&
        canEditSitePages(currentUser?.role) &&
        createPortal(
          <div
            className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-page-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowCreatePageModal(false);
            }}
          >
            <div className="bg-white dark:bg-surface-dim w-full max-w-md rounded-3xl shadow-2xl p-6 text-right space-y-4 border border-outline-variant/30">
              <div className="flex justify-between items-center border-b pb-3">
                <h3
                  id="create-page-title"
                  className="font-extrabold text-base text-on-surface flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-primary">note_add</span>
                  ایجاد صفحه جدید
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCreatePageModal(false)}
                  className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                پس از ایجاد، صفحه‌ساز باز می‌شود تا محتوا را طراحی کنید. آدرس عمومی صفحه به‌صورت{' '}
                <span className="font-mono" dir="ltr">
                  /p/{newPageSlug || '...'}
                </span>{' '}
                خواهد بود.
              </p>
              <label className="block space-y-1">
                <span className="text-[11px] font-bold text-on-surface-variant">عنوان صفحه *</span>
                <input
                  type="text"
                  autoFocus
                  value={newPageTitle}
                  onChange={(e) => {
                    const v = e.target.value;
                    setNewPageTitle(v);
                    if (!newPageSlug || newPageSlug === slugifyPageTitle(newPageTitle)) {
                      setNewPageSlug(slugifyPageTitle(v));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newPageTitle.trim()) {
                      e.preventDefault();
                      void handleCreateSitePage();
                    }
                  }}
                  placeholder="مثال: تعرفه‌ها"
                  className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-sm"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-bold text-on-surface-variant">نامک (Slug)</span>
                <div className="flex items-center gap-2" dir="ltr">
                  <span className="text-[11px] font-bold text-on-surface-variant shrink-0">/p/</span>
                  <input
                    type="text"
                    value={newPageSlug}
                    onChange={(e) =>
                      setNewPageSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/\s+/g, '-')
                          .replace(/[^\u0600-\u06FFa-z0-9-]/gi, '')
                      )
                    }
                    placeholder="tariffs"
                    className="flex-1 p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-sm font-mono text-left"
                  />
                </div>
              </label>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreatePageModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-outline-variant/40 font-bold text-xs"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  disabled={savingPageMeta || !newPageTitle.trim()}
                  onClick={() => void handleCreateSitePage()}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold text-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">dashboard_customize</span>
                  {savingPageMeta ? 'در حال ایجاد...' : 'ایجاد و باز کردن صفحه‌ساز'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {editingPageMeta && canEditSitePages(currentUser?.role) && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-surface-dim w-full max-w-md rounded-3xl shadow-2xl p-6 text-right space-y-4 border border-outline-variant/30 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-base text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">tune</span>
                مشخصات صفحه
              </h3>
              <button
                type="button"
                onClick={() => setEditingPageMeta(null)}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-on-surface-variant">عنوان *</span>
              <input
                type="text"
                value={editPageTitle}
                onChange={(e) => setEditPageTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-sm"
              />
            </label>
            <MediaField
              label="تصویر شاخص"
              value={editPageCover}
              onChange={setEditPageCover}
              accept="image"
              aspect="video"
            />
            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-on-surface-variant">آدرس</span>
              {isSystemSitePage(editingPageMeta) ? (
                <p className="p-2.5 rounded-xl bg-surface-container-low text-sm font-mono" dir="ltr">
                  {editingPageMeta.slug}
                </p>
              ) : (
                <div className="flex items-center gap-2" dir="ltr">
                  <span className="text-[11px] font-bold text-on-surface-variant shrink-0">/p/</span>
                  <input
                    type="text"
                    value={editPageSlug}
                    onChange={(e) =>
                      setEditPageSlug(
                        e.target.value
                          .trim()
                          .toLowerCase()
                          .replace(/\s+/g, '-')
                          .replace(/[^\u0600-\u06FFa-z0-9-]/gi, '')
                      )
                    }
                    className="flex-1 p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-sm font-mono text-left"
                  />
                </div>
              )}
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-on-surface-variant">چکیده</span>
              <textarea
                rows={3}
                value={editPageExcerpt}
                onChange={(e) => setEditPageExcerpt(e.target.value)}
                placeholder="خلاصه کوتاه صفحه..."
                className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-sm leading-relaxed"
              />
            </label>
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-on-surface-variant block">عرض قالب صفحه</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditPageLayoutWidth('contained')}
                  className={`text-right rounded-xl border p-2.5 text-[11px] font-black transition-all ${
                    editPageLayoutWidth === 'contained'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-outline-variant/40 text-on-surface-variant'
                  }`}
                >
                  کانتینری (۱۴۰۰px)
                </button>
                <button
                  type="button"
                  onClick={() => setEditPageLayoutWidth('full')}
                  className={`text-right rounded-xl border p-2.5 text-[11px] font-black transition-all ${
                    editPageLayoutWidth === 'full'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-outline-variant/40 text-on-surface-variant'
                  }`}
                >
                  تمام‌عرض
                </button>
              </div>
            </div>
            {!isSystemSitePage(editingPageMeta) && (
              <label className="block space-y-1">
                <span className="text-[11px] font-bold text-on-surface-variant">وضعیت انتشار</span>
                <select
                  value={editPageStatus}
                  onChange={(e) => setEditPageStatus(e.target.value as 'published' | 'draft')}
                  className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-sm font-bold"
                >
                  <option value="published">منتشر شده</option>
                  <option value="draft">پیش‌نویس</option>
                </select>
              </label>
            )}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingPageMeta(null)}
                className="flex-1 py-2.5 rounded-xl border border-outline-variant/40 font-bold text-xs"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={savingPageMeta || !editPageTitle.trim()}
                onClick={() => void handleSavePageMeta()}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold text-xs disabled:opacity-50"
              >
                {savingPageMeta ? 'ذخیره...' : 'ذخیره'}
              </button>
            </div>
          </div>
        </div>
      )}

      {articleEditor && canManageArticles(currentUser?.role) && (
        <ArticleEditorPage
          article={articleEditor}
          isNew={articleEditorIsNew}
          doctors={doctors}
          categories={articleCategories}
          allServices={services}
          articles={articles}
          faqs={faqs}
          contact={settings.contact}
          seoOptimizerEnabled={seoOptimizerEnabled}
          onClose={() => {
            setArticleEditor(null);
            setArticleEditorIsNew(false);
          }}
          onSaved={(updated) => {
            const exists = articles.some((a) => a.id === updated.id);
            onUpdateArticles(
              exists
                ? articles.map((a) => (a.id === updated.id ? updated : a))
                : [updated, ...articles]
            );
            setArticleEditor(updated);
            setArticleEditorIsNew(false);
          }}
        />
      )}

      {pageBuilderService && canEditServicePages(currentUser?.role) && (
        <ServicePageBuilder
          service={pageBuilderService}
          allServices={services}
          doctors={doctors}
          faqs={faqs}
          contact={settings.contact}
          onClose={() => setPageBuilderService(null)}
          onSaved={(updated) => {
            onUpdateServices(services.map((s) => (s.id === updated.id ? updated : s)));
            setPageBuilderService(updated);
          }}
        />
      )}
      {pageBuilderSitePage && canEditSitePages(currentUser?.role) && (
        <SitePageBuilder
          page={pageBuilderSitePage}
          allServices={services}
          doctors={doctors}
          articles={articles}
          faqs={faqs}
          contact={settings.contact}
          existingPages={sitePages}
          seoOptimizerEnabled={seoOptimizerEnabled}
          onClose={() => setPageBuilderSitePage(null)}
          onSaved={(updated) => {
            const next = sitePages.some((p) => p.id === updated.id)
              ? sitePages.map((p) => (p.id === updated.id ? updated : p))
              : [...sitePages, updated];
            onUpdateSitePages?.(next);
            setPageBuilderSitePage(updated);
          }}
        />
      )}
      </div>
    </AdminShell>
  );
};
