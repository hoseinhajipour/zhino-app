export type PageScreen = 
  | 'home'
  | 'services'
  | 'service-detail'
  | 'child-therapy'
  | 'adult-therapy'
  | 'marriage-therapy'
  | 'about'
  | 'team'
  | 'contact'
  | 'blog'
  | 'faq'
  | 'shop'
  | 'shop-product'
  | 'cart'
  | 'checkout'
  | 'order-confirmation'
  | 'payment-callback'
  | 'admin'
  | 'user-panel'
  | 'login'
  | 'custom-page'
  | 'not-found';

export type UserRole = 'admin' | 'doctor' | 'operator' | 'patient';

export interface UserProfile {
  id: string;
  name: string;
  mobile: string;
  role: UserRole;
  nationalId?: string;
  email?: string;
  avatar?: string;
  gender?: 'female' | 'male';
  age?: number;
  address?: string;
  emergencyPhone?: string;
  doctorTitle?: string;
  specialty?: string;
  /** Staff login name (admin/doctor/operator) */
  username?: string;
}

/** Stored in DB — never sent to the client. */
export interface UserRecord extends UserProfile {
  passwordHash: string;
}

export interface PatientTransaction {
  id: string;
  appointmentId?: string;
  amount: string;
  date: string;
  description: string;
  status: 'successful' | 'pending' | 'failed';
  trackingCode: string;
  paymentMethod: 'online' | 'card_reader' | 'cash';
}

export interface Doctor {
  id: string;
  name: string;
  title: string;
  degree: string;
  avatar: string;
  bio: string;
  specialties: string[];
  gender: 'female' | 'male';
  active: boolean;
  sessionTypes: ('online' | 'in-person')[];
  experienceYears?: number;
  tags: string[];
  licenseNumber?: string;
  consultationFee?: string;
  workingHours?: string;
  email?: string;
  phone?: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  /** URL-friendly slug for the service page */
  slug?: string;
  /** Short summary shown in cards / listings */
  excerpt?: string;
  /** Featured / cover image */
  image?: string;
  duration?: string;
  format?: string;
  badge?: string;
  bgClass?: string;
  textClass?: string;
  targetScreen?: PageScreen;
  fee?: string;
  active?: boolean;
  pageBuilder?: ServicePageBuilder;
}

export type ServiceBlockType =
  | 'hero'
  | 'pageHero'
  | 'heroHeader'
  | 'highlights'
  | 'symptoms'
  | 'process'
  | 'features'
  | 'doctors'
  | 'testimonials'
  | 'faqs'
  | 'latestFaqs'
  | 'contactInfo'
  | 'cta'
  | 'richText'
  | 'htmlCode'
  | 'otherServices'
  | 'servicesGrid'
  | 'contactCards'
  | 'contactForm'
  | 'articlesGrid'
  | 'imageCarousel'
  | 'videoPlayer'
  | 'container'
  | 'icon'
  | 'iconList'
  | 'button'
  | 'staffCarousel'
  | 'googleMap'
  | 'tabGallery'
  | 'divider'
  | 'spacer'
  | 'singleImage'
  | 'imageGallery'
  | 'verticalImageGallery'
  | 'beforeAfter'
  | 'audioPlayer';

/** Scroll-into-view reveal for page-builder widgets */
export type BlockScrollAnimation = 'fade-in' | 'fade-up' | 'fade-down';

export interface ServiceBlock {
  id: string;
  type: ServiceBlockType;
  props: Record<string, unknown>;
}

export interface ServicePageBuilder {
  version: 1;
  blocks: ServiceBlock[];
}

/** Alias — same block document used for services and site pages. */
export type PageBuilderDoc = ServicePageBuilder;

/** Built-in site shells that ship with defaults. */
export type SitePageId = 'home' | 'about' | 'contact' | 'blog';

export interface SitePage {
  /** System id (`home`…) or custom id (`page-…`). */
  id: string;
  slug: string;
  title: string;
  pageBuilder: PageBuilderDoc;
  /** When true (or id is a known SitePageId), page cannot be deleted. */
  isSystem?: boolean;
  status?: 'published' | 'draft';
  /** Featured / OG image */
  coverImage?: string;
  /** Short summary for listings / SEO */
  excerpt?: string;
  /** SEO optimizer fields (when seoOptimizer module is on) */
  seo?: ContentSeoSettings;
  /**
   * Page shell width:
   * - contained: centered content (max 1400px)
   * - full: edge-to-edge (widgets control their own width)
   */
  layoutWidth?: 'contained' | 'full';
  updatedAt?: string;
}

export type FaqStatus = 'approved' | 'pending' | 'rejected';

export interface FAQItem {
  id: string;
  question: string;
  answer?: string;
  category?: string; // e.g. 'adult', 'child', 'marriage', 'neurofeed', 'online', 'general'
  serviceTitle?: string;
  askedBy?: string;
  userPhone?: string;
  date?: string;
  status?: FaqStatus;
  responderName?: string;
  likesCount?: number;
}

export interface AppointmentFormData {
  serviceId: string;
  doctorId: string;
  date: string;
  timeSlot: string;
  sessionType: 'in-person' | 'online';
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  notes?: string;
}

export interface BookingConfirmation {
  bookingId: string;
  doctorName: string;
  serviceTitle: string;
  date: string;
  timeSlot: string;
  sessionType: string;
  patientName: string;
  patientPhone: string;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  bookingRef: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  doctorId: string;
  doctorName: string;
  serviceId: string;
  serviceTitle: string;
  date: string;
  timeSlot: string;
  sessionType: 'in-person' | 'online';
  status: AppointmentStatus;
  createdAt: string;
  notes?: string;
  fee?: string;
}

export type ArticleStatus = 'published' | 'draft' | 'archived';

export interface ArticleCategory {
  id: string;
  name: string;
  slug: string;
  sortOrder?: number;
  active?: boolean;
}

export interface ZarinpalSettings {
  enabled: boolean;
  isSandbox: boolean;
  merchantId: string;
  defaultFee: string;
  callbackUrl: string;
}

/** Behpardakht (Bank Mellat) IPG credentials */
export interface MellatSettings {
  enabled: boolean;
  terminalId: string;
  username: string;
  password: string;
  /** Optional override; default is site /api/shop/payment/callback/mellat */
  callbackUrl?: string;
}

export interface KavenegarSettings {
  enabled: boolean;
  apiKey: string;
  senderNumber: string;
  bookingPattern: string;
  reminderPattern: string;
  cancelPattern: string;
  /** Optional SMS text for new form submissions; supports %form% and %summary% */
  formNotifyPattern?: string;
}

/** Field types for the central form builder */
export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'tel'
  | 'number'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'checkboxGroup'
  | 'date'
  | 'description';

export interface FormFieldOption {
  id: string;
  label: string;
}

export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  /** For select / radio / checkboxGroup */
  options?: FormFieldOption[];
}

export interface FormDefinition {
  id: string;
  name: string;
  description?: string;
  submitLabel?: string;
  successMessage?: string;
  fields: FormField[];
  /** Notification destination (logged until SMTP is wired) */
  notifyEmail?: string;
  /** Operator mobile for Kavenegar SMS */
  notifySms?: string;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type FormSubmissionStatus = 'new' | 'read' | 'archived';

export type FormAnswerValue = string | string[] | boolean;

export interface FormSubmission {
  id: string;
  formId: string;
  formName: string;
  answers: Record<string, FormAnswerValue>;
  status: FormSubmissionStatus;
  createdAt: string;
  pageId?: string;
  pageSlug?: string;
  notify?: {
    emailLogged?: boolean;
    smsSent?: boolean;
    smsError?: string;
  };
}

export interface SiteIdentitySettings {
  siteName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  /** CTA / button surfaces */
  buttonColor: string;
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  /** Font id from SITE_FONT_OPTIONS (e.g. vazirmatn) */
  fontFamily: string;
  phone1: string;
  phone2: string;
  phoneClean: string;
  address: string;
  email: string;
  whatsappNumber: string;
  instagram: string;
  telegram: string;
}

export interface SiteHeaderSettings {
  showPhone: boolean;
  showAuthButton: boolean;
  showThemeToggle: boolean;
  showSearchIcon: boolean;
  showBookingButton: boolean;
  bookingButtonLabel: string;
  sticky: boolean;
}

export interface SiteNavItem {
  id: string;
  label: string;
  /** PageScreen id یا مسیر /p/... یا لینک خارجی */
  target: string;
  visible: boolean;
  icon?: string;
  hasDropdown?: boolean;
  children?: SiteNavItem[];
}

export interface SiteMenuSettings {
  mainItems: SiteNavItem[];
  servicesDropdownTitle: string;
}

export interface SiteFooterSettings {
  aboutText: string;
  showNewsletter: boolean;
  newsletterTitle: string;
  newsletterSubtitle: string;
  copyrightText: string;
  hoursText: string;
  showAdminLink: boolean;
  quickLinks: SiteNavItem[];
  showWhatsapp: boolean;
  showPhoneIcon: boolean;
  showMapIcon: boolean;
}

/** Default content container width for header, footer, and site pages */
export type SiteContainerMode = '1200' | '1400' | 'full' | 'custom';

export interface SiteLayoutSettings {
  /** Preset or custom max width for the site chrome + page shells */
  containerMode: SiteContainerMode;
  /** Used when containerMode === 'custom' (px) */
  customMaxWidth: number;
}

export interface SiteChromeSettings {
  identity: SiteIdentitySettings;
  header: SiteHeaderSettings;
  menu: SiteMenuSettings;
  footer: SiteFooterSettings;
  layout: SiteLayoutSettings;
}

/** Option inside a free-guide form field */
export interface FreeGuideOption {
  id: string;
  label: string;
}

export type FreeGuideFieldType = 'buttons' | 'select';

/** Question shown in the therapist-matcher modal */
export interface FreeGuideField {
  id: string;
  label: string;
  type: FreeGuideFieldType;
  options: FreeGuideOption[];
  enabled: boolean;
}

/** Rule: when all conditions match, try these doctor specialty keys */
export interface FreeGuideMatchRule {
  id: string;
  label: string;
  conditions: { fieldId: string; optionId: string }[];
  specialtyKeys: string[];
}

/** Configurable «مشاوره رایگان انتخاب درمانگر» form */
export interface FreeGuideSettings {
  enabled: boolean;
  badge: string;
  title: string;
  intro: string;
  submitLabel: string;
  resultBadge: string;
  resultTitle: string;
  resultHint: string;
  changeOptionsLabel: string;
  /** Use {name} for the doctor's short/display name */
  bookLabelTemplate: string;
  fields: FreeGuideField[];
  matchRules: FreeGuideMatchRule[];
  fallbackSpecialtyKeys: string[];
}

/** OpenAI-compatible AI gateway used by the project (GapGPT, OpenAI, custom) */
export type AiProviderId = 'gapgpt' | 'openai' | 'custom';

export interface AiSettings {
  /** Master switch — when off, AI features should not call the provider */
  enabled: boolean;
  provider: AiProviderId;
  apiKey: string;
  /** e.g. https://api.gapgpt.app/v1 */
  baseUrl: string;
  /** Default chat model id, e.g. gpt-4o */
  defaultModel: string;
}

export interface ClinicSettings {
  bookingEnabled?: boolean;
  /** When true, public visitors see maintenance page; logged-in users bypass */
  maintenanceMode?: boolean;
  /** Optional custom message on the maintenance page */
  maintenanceMessage?: string;
  /** When true, login screens show demo credentials and quick-login shortcuts */
  developmentMode?: boolean;
  zarinpal: ZarinpalSettings;
  /** Bank Mellat (Behpardakht) — used by shop online checkout */
  mellat?: MellatSettings;
  kavenegar: KavenegarSettings;
  /** Branding, header, menus, footer — editable in admin settings */
  site?: SiteChromeSettings;
  /** Managed contact channels (phones, socials, addresses) */
  contact?: ClinicContactInfo;
  /** Feature modules (admin-only); e.g. auto-translate */
  modules?: SiteModulesSettings;
  /** Shop catalog / checkout options (when modules.shop is enabled) */
  shop?: ShopSettings;
  /** Therapist selector / free guide form (admin-editable) */
  freeGuide?: FreeGuideSettings;
  /** AI provider connection (GapGPT / OpenAI-compatible) */
  ai?: AiSettings;
}

/** Catalog entry for site language switcher */
export interface TranslateLanguageOption {
  code: string;
  label: string;
  nativeLabel: string;
  dir: 'rtl' | 'ltr';
  flag?: string;
}

export interface AutoTranslateModuleSettings {
  /** Master switch — when off, no switcher / no Google Translate */
  enabled: boolean;
  /** Original content language (usually fa) */
  sourceLanguage: string;
  /** First language on load if no stored preference */
  defaultLanguage: string;
  /** Language codes shown in header switcher */
  languages: string[];
  showFlags?: boolean;
}

/** Simple on/off feature module */
export interface FeatureModuleSettings {
  enabled: boolean;
}

export interface SiteModulesSettings {
  autoTranslate: AutoTranslateModuleSettings;
  /** Online booking + admin appointments tab */
  appointments: FeatureModuleSettings;
  /** Rank Math–style SEO score & focus keyword for pages/articles */
  seoOptimizer: FeatureModuleSettings;
  /** Product catalog, cart, checkout, and admin shop tabs */
  shop: FeatureModuleSettings;
  /** Admin file manager — list / upload / download / delete server files */
  fileManager: FeatureModuleSettings;
}

/** Shop product kind */
export type ShopProductType = 'physical' | 'digital';
/** Simple product vs variable (with attributes/variations) */
export type ShopProductKind = 'simple' | 'variable';
export type ShopProductStatus = 'draft' | 'published';
export type ShopOrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'completed'
  | 'cancelled';
export type ShopPaymentMethod =
  | 'bank_transfer'
  | 'cod'
  | 'manual'
  | 'zarinpal'
  | 'mellat';

export type ShopPaymentStatus = 'unpaid' | 'awaiting' | 'paid' | 'failed';

/** One selectable attribute/variation on a variable product */
export interface ShopProductVariation {
  id: string;
  /** Attribute label shown to customer (e.g. سایز L) */
  name: string;
  /** Price in toman for this variation */
  price: number;
  /** Rich HTML description for this variation */
  description?: string;
  imageUrl?: string;
  /** null = unlimited; ignored if undefined → fall back to product stock */
  stock?: number | null;
  digitalFileUrl?: string;
}

/** Product category for the shop catalog */
export interface ShopProductCategory {
  id: string;
  name: string;
  slug: string;
  sortOrder?: number;
  active?: boolean;
}

/** Shop storefront & checkout settings (stored in clinic_settings.shop) */
export interface ShopSettings {
  storeName: string;
  storeDescription: string;
  currencyLabel: string;
  showPrices: boolean;
  /** Enabled payment methods on checkout */
  paymentMethods: {
    bank_transfer: boolean;
    cod: boolean;
    manual: boolean;
    zarinpal: boolean;
    mellat: boolean;
  };
  /** Shown when bank_transfer is selected */
  bankTransferInstructions: string;
  /** Note under shipping / physical products */
  shippingNote: string;
  emptyCartMessage: string;
  orderSuccessMessage: string;
  requireAddressForPhysical: boolean;
  /** 0 = no minimum */
  minOrderAmount: number;
}

export interface ShopProduct {
  id: string;
  name: string;
  slug: string;
  /** Rich HTML product description */
  description: string;
  /** Display name (synced from ShopProductCategory.name) */
  category?: string;
  categoryId?: string;
  /** Base / starting price (toman). For variable products = display from-price */
  price: number;
  type: ShopProductType;
  /** Default simple for legacy products */
  kind?: ShopProductKind;
  status: ShopProductStatus;
  /** null = unlimited */
  stock: number | null;
  /** Featured / main product image */
  imageUrl?: string;
  /** Extra gallery images (excluding or in addition to imageUrl) */
  galleryUrls?: string[];
  /** Download URL for digital simple products */
  digitalFileUrl?: string;
  /** Optional display weight for physical products */
  weightGrams?: number;
  /** Variations when kind === 'variable' */
  variations?: ShopProductVariation[];
  createdAt: string;
  updatedAt: string;
}

export interface ShopOrderItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  type: ShopProductType;
  digitalFileUrl?: string;
  variationId?: string;
  variationName?: string;
}

export interface ShopOrderCustomer {
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface ShopOrder {
  id: string;
  orderNumber: string;
  status: ShopOrderStatus;
  paymentMethod: ShopPaymentMethod;
  /** Online gateway payment lifecycle */
  paymentStatus?: ShopPaymentStatus;
  paymentAuthority?: string;
  paymentRefId?: string;
  /** Numeric order id for Mellat bpPayRequest */
  mellatOrderId?: number;
  customer: ShopOrderCustomer;
  items: ShopOrderItem[];
  subtotal: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShopCartItem {
  productId: string;
  /** Required when adding a variable product */
  variationId?: string;
  qty: number;
}

/** Per-content SEO fields (articles & site pages) */
export interface ContentSeoSettings {
  /** Primary focus keyword / phrase */
  focusKeyword?: string;
  /** Override document title (falls back to content title) */
  seoTitle?: string;
  /** Override meta description (falls back to summary/excerpt) */
  seoDescription?: string;
  /** Cached 0–100 score from last analysis / save */
  score?: number;
}

export interface ContactPhoneItem {
  id: string;
  label: string;
  number: string;
  /** Digits for tel: link; falls back to stripped `number` */
  telHref?: string;
}

export interface ContactAddressItem {
  id: string;
  title: string;
  text: string;
  lat?: number;
  lng?: number;
}

export type ConsultFabPosition = 'right' | 'left';
export type ConsultFabEntryAnimation = 'fadeUp' | 'scale' | 'bounce' | 'slide' | 'none';

/** Floating consult button appearance (admin-configurable). */
export interface ConsultFabSettings {
  enabled: boolean;
  position: ConsultFabPosition;
  color: string;
  icon: string;
  label: string;
  showLabel: boolean;
  entryAnimation: ConsultFabEntryAnimation;
  pulse: boolean;
}

export interface ClinicContactInfo {
  phones: ContactPhoneItem[];
  whatsapp: string;
  email: string;
  telegram: string;
  instagram: string;
  bale: string;
  eitaa: string;
  rubika: string;
  youtube: string;
  linkedin: string;
  /** X (formerly Twitter) */
  x: string;
  addresses: ContactAddressItem[];
  fab?: ConsultFabSettings;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  /** Display name (synced from ArticleCategory.name) */
  category: string;
  /** FK to article_categories.id */
  categoryId?: string;
  summary: string;
  content: string;
  coverImage: string;
  publishedAt: string;
  readTime: string;
  views: number;
  status: ArticleStatus;
  tags: string[];
  /** Block-based article body (preferred). Legacy `content` used as fallback. */
  pageBuilder?: PageBuilderDoc;
  /** SEO optimizer fields (when seoOptimizer module is on) */
  seo?: ContentSeoSettings;
}
