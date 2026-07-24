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
  | 'admin'
  | 'user-panel'
  | 'custom-page';

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
  | 'cta'
  | 'richText'
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
  | 'tabGallery';

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

export interface KavenegarSettings {
  enabled: boolean;
  apiKey: string;
  senderNumber: string;
  bookingPattern: string;
  reminderPattern: string;
  cancelPattern: string;
}

export interface SiteIdentitySettings {
  siteName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
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

export interface SiteChromeSettings {
  identity: SiteIdentitySettings;
  header: SiteHeaderSettings;
  menu: SiteMenuSettings;
  footer: SiteFooterSettings;
}

export interface ClinicSettings {
  bookingEnabled?: boolean;
  zarinpal: ZarinpalSettings;
  kavenegar: KavenegarSettings;
  /** Branding, header, menus, footer — editable in admin settings */
  site?: SiteChromeSettings;
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
}
