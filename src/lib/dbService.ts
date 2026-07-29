import { DEFAULT_CONTACT_INFO, mergeContactInfo } from './contactInfo';
import { DEFAULT_FREE_GUIDE, mergeFreeGuide } from './freeGuideDefaults';
import { DEFAULT_SITE_CHROME, mergeSiteChrome } from './siteChromeDefaults';
import { DEFAULT_SITE_MODULES, mergeSiteModules } from './siteModules';
import { DEFAULT_AI_SETTINGS, mergeAiSettings } from './aiSettingsDefaults';
import { DEFAULT_SHOP_SETTINGS, mergeShopSettings } from './shopSettingsDefaults';
import { DEFAULT_MELLAT_SETTINGS, mergeMellatSettings } from './mellatSettingsDefaults';
import { DEFAULT_SITE_SEO, mergeSiteSeo } from './seoSettingsDefaults';
import type {
  Appointment,
  Doctor,
  ServiceItem,
  Article,
  AppointmentStatus,
  ClinicSettings,
  FAQItem,
  SitePage,
  UserProfile,
  ArticleCategory,
  FormDefinition,
  FormSubmission,
  FormAnswerValue,
  ShopProduct,
  ShopProductCategory,
  ShopOrder,
  Workshop,
} from '../types';

export const DEFAULT_CLINIC_SETTINGS: ClinicSettings = {
  bookingEnabled: true,
  maintenanceMode: false,
  maintenanceMessage: '',
  developmentMode: false,
  zarinpal: {
    enabled: true,
    isSandbox: true,
    merchantId: '46083627-5610-42cc-a5dc-730303030303',
    defaultFee: '۸۵۰,۰۰۰',
    callbackUrl: 'https://zhinopsy.com/verify-payment',
  },
  mellat: DEFAULT_MELLAT_SETTINGS,
  kavenegar: {
    enabled: true,
    apiKey: '7856412359876543210987654321098765432109',
    senderNumber: '10008403',
    bookingPattern:
      'مراجع گرامی %patient%، نوبت شما در کلینیک ژینو برای تاریخ %date% ساعت %time% با موفقیت ثبت شد. کد پیگیری: %ref%',
    reminderPattern:
      'یادآوری: نوبت مشاوره شما فردا ساعت %time% در کلینیک ژینو با %doctor% برگزار می‌گردد.',
    cancelPattern: 'مراجع محترم %patient%، نوبت شما برای تاریخ %date% با موفقیت لغو شد.',
  },
  site: DEFAULT_SITE_CHROME,
  contact: DEFAULT_CONTACT_INFO,
  modules: DEFAULT_SITE_MODULES,
  freeGuide: DEFAULT_FREE_GUIDE,
  ai: DEFAULT_AI_SETTINGS,
  shop: DEFAULT_SHOP_SETTINGS,
  seo: DEFAULT_SITE_SEO,
};

export function normalizeClinicSettings(raw?: Partial<ClinicSettings> | null): ClinicSettings {
  const base = DEFAULT_CLINIC_SETTINGS;
  const site = mergeSiteChrome(raw?.site || base.site);
  return {
    bookingEnabled: raw?.bookingEnabled ?? base.bookingEnabled,
    maintenanceMode: raw?.maintenanceMode ?? base.maintenanceMode,
    maintenanceMessage: raw?.maintenanceMessage ?? base.maintenanceMessage ?? '',
    developmentMode: raw?.developmentMode ?? base.developmentMode,
    zarinpal: { ...base.zarinpal, ...(raw?.zarinpal || {}) },
    mellat: mergeMellatSettings(raw?.mellat || base.mellat),
    kavenegar: { ...base.kavenegar, ...(raw?.kavenegar || {}) },
    site,
    contact: mergeContactInfo(raw?.contact || base.contact, site.identity),
    modules: mergeSiteModules(raw?.modules || base.modules),
    freeGuide: mergeFreeGuide(raw?.freeGuide || base.freeGuide),
    ai: mergeAiSettings(raw?.ai || base.ai),
    shop: mergeShopSettings(raw?.shop || base.shop),
    seo: mergeSiteSeo(raw?.seo || base.seo),
  };
}

const POLL_MS = 6000;

/** Attach write token when ZHINO_API_TOKEN is enforced on the server. */
export function writeAuthHeaders(): Record<string, string> {
  const writeToken = import.meta.env.VITE_ZHINO_API_TOKEN || '';
  return writeToken ? { 'X-Zhino-Token': writeToken } : {};
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method || 'GET').toUpperCase();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (method !== 'GET' && method !== 'HEAD') {
    Object.assign(headers, writeAuthHeaders());
  }
  const res = await fetch(path, {
    ...init,
    headers,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let message = text || `Request failed: ${res.status}`;
    try {
      const parsed = JSON.parse(text) as { error?: string };
      if (parsed?.error) message = parsed.error;
    } catch {
      // keep raw text
    }
    throw new Error(message);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

/**
 * One shared poller per resource so App + Admin + panels don't each spin
 * their own setInterval (which made refreshes feel like every 2–3s).
 */
function createSharedPoller<T>(loadFn: () => Promise<T>, label: string) {
  const listeners = new Set<(data: T) => void>();
  let timer: ReturnType<typeof setInterval> | null = null;
  let latest: T | undefined;
  let inFlight = false;

  const emit = (data: T) => {
    latest = data;
    for (const cb of listeners) {
      try {
        cb(data);
      } catch (err) {
        console.error(`${label} listener error:`, err);
      }
    }
  };

  const load = async () => {
    if (inFlight) return;
    inFlight = true;
    try {
      const data = await loadFn();
      emit(data);
    } catch (err) {
      console.error(`${label} fetch error:`, err);
    } finally {
      inFlight = false;
    }
  };

  return {
    subscribe(callback: (data: T) => void): () => void {
      listeners.add(callback);
      if (latest !== undefined) {
        callback(latest);
      }
      if (listeners.size === 1) {
        void load();
        timer = setInterval(() => {
          void load();
        }, POLL_MS);
      }
      return () => {
        listeners.delete(callback);
        if (listeners.size === 0 && timer) {
          clearInterval(timer);
          timer = null;
        }
      };
    },
  };
}

const listPollers = new Map<string, ReturnType<typeof createSharedPoller<unknown[]>>>();

function subscribeList<T>(
  path: string,
  callback: (data: T[]) => void,
  label: string
): () => void {
  let poller = listPollers.get(path) as ReturnType<typeof createSharedPoller<T[]>> | undefined;
  if (!poller) {
    poller = createSharedPoller<T[]>(() => api<T[]>(path), label);
    listPollers.set(path, poller as ReturnType<typeof createSharedPoller<unknown[]>>);
  }
  return poller.subscribe(callback);
}

export async function uploadFile(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  // Do not set Content-Type — browser must add multipart boundary.
  const res = await fetch('/api/uploads', {
    method: 'POST',
    headers: writeAuthHeaders(),
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let message = text || 'Upload failed';
    try {
      const parsed = JSON.parse(text) as { error?: string; message?: string };
      if (parsed?.message || parsed?.error) message = parsed.message || parsed.error || message;
    } catch {
      // keep raw text
    }
    throw new Error(message);
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}

export interface MediaLibraryItem {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
  kind: 'image' | 'video' | 'audio' | 'document' | 'other';
  source: 'uploads' | 'staff';
  uploadedAt: string;
}

export async function fetchMediaLibrary(
  kind: 'all' | 'image' | 'video' | 'audio' | 'document' | 'all-files' = 'all'
): Promise<MediaLibraryItem[]> {
  const qs = kind === 'all' ? '' : `?kind=${kind}`;
  return api<MediaLibraryItem[]>(`/api/uploads${qs}`);
}

export async function deleteMediaFile(filename: string): Promise<void> {
  await api(`/api/uploads/${encodeURIComponent(filename)}`, { method: 'DELETE' });
}

/** Upload any allowed media/document (images, video, audio, PDF, zip, …). */
export async function uploadManagedFile(file: File): Promise<MediaLibraryItem> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/uploads?purpose=document', {
    method: 'POST',
    headers: writeAuthHeaders(),
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let message = text || 'Upload failed';
    try {
      const parsed = JSON.parse(text) as { error?: string; message?: string };
      if (parsed?.message || parsed?.error) message = parsed.message || parsed.error || message;
    } catch {
      // keep raw text
    }
    throw new Error(message);
  }
  return res.json() as Promise<MediaLibraryItem>;
}

export interface SeoVerificationFileInfo {
  filename: string;
  url: string;
  size: number;
  uploadedAt: string;
}

/** Upload Google Search Console HTML verification file to site root. */
export async function uploadGoogleVerificationFile(file: File): Promise<SeoVerificationFileInfo> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/seo/google-verification', {
    method: 'POST',
    headers: writeAuthHeaders(),
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let message = text || 'Upload failed';
    try {
      const parsed = JSON.parse(text) as { error?: string; message?: string };
      if (parsed?.message || parsed?.error) message = parsed.message || parsed.error || message;
    } catch {
      // keep raw text
    }
    throw new Error(message);
  }
  return res.json() as Promise<SeoVerificationFileInfo>;
}

export async function deleteGoogleVerificationFile(filename?: string): Promise<void> {
  const qs = filename ? `?filename=${encodeURIComponent(filename)}` : '';
  await api(`/api/seo/google-verification${qs}`, { method: 'DELETE' });
}

export async function fetchGoogleVerificationFile(): Promise<SeoVerificationFileInfo | null> {
  try {
    return await api<SeoVerificationFileInfo | null>('/api/seo/google-verification');
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------
// APPOINTMENTS
// ---------------------------------------------------------------------
export function subscribeAppointments(callback: (data: Appointment[]) => void) {
  return subscribeList<Appointment>('/api/appointments', callback, 'Appointments');
}

export async function addAppointment(app: Appointment) {
  await api('/api/appointments', { method: 'POST', body: JSON.stringify(app) });
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  await api(`/api/appointments/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function deleteAppointment(id: string) {
  await api(`/api/appointments/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------
// DOCTORS
// ---------------------------------------------------------------------
export function subscribeDoctors(callback: (data: Doctor[]) => void) {
  return subscribeList<Doctor>('/api/doctors', callback, 'Doctors');
}

export async function saveDoctor(doctor: Doctor) {
  await api(`/api/doctors/${encodeURIComponent(doctor.id)}`, {
    method: 'PUT',
    body: JSON.stringify(doctor),
  });
}

export async function deleteDoctor(id: string) {
  await api(`/api/doctors/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------
// SERVICES
// ---------------------------------------------------------------------
export function subscribeServices(callback: (data: ServiceItem[]) => void) {
  return subscribeList<ServiceItem>('/api/services', callback, 'Services');
}

export async function saveService(service: ServiceItem) {
  await api(`/api/services/${encodeURIComponent(service.id)}`, {
    method: 'PUT',
    body: JSON.stringify(service),
  });
}

export async function deleteService(id: string) {
  await api(`/api/services/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------
// SITE PAGES (home / about / contact / blog shells)
// ---------------------------------------------------------------------
export function subscribeSitePages(callback: (data: SitePage[]) => void) {
  return subscribeList<SitePage>('/api/pages', callback, 'Pages');
}

export async function fetchSitePage(id: string): Promise<SitePage | null> {
  try {
    return await api<SitePage>(`/api/pages/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}

export async function saveSitePage(page: SitePage) {
  await api(`/api/pages/${encodeURIComponent(page.id)}`, {
    method: 'PUT',
    body: JSON.stringify(page),
  });
}

export async function deleteSitePage(id: string) {
  await api(`/api/pages/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------
// ARTICLES
// ---------------------------------------------------------------------
export function subscribeArticles(callback: (data: Article[]) => void) {
  return subscribeList<Article>('/api/articles', callback, 'Articles');
}

export async function fetchArticles(category?: string): Promise<Article[]> {
  const qs = category ? `?category=${encodeURIComponent(category)}` : '';
  return api<Article[]>(`/api/articles${qs}`);
}

export async function fetchArticleCategories(): Promise<ArticleCategory[]> {
  try {
    return await api<ArticleCategory[]>('/api/article-categories');
  } catch {
    return api<ArticleCategory[]>('/api/articles/categories');
  }
}

export function subscribeArticleCategories(callback: (data: ArticleCategory[]) => void) {
  return subscribeList<ArticleCategory>('/api/article-categories', callback, 'ArticleCategories');
}

export async function saveArticleCategory(category: ArticleCategory) {
  await api(`/api/article-categories/${encodeURIComponent(category.id)}`, {
    method: 'PUT',
    body: JSON.stringify(category),
  });
}

export async function deleteArticleCategory(id: string) {
  await api(`/api/article-categories/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function saveArticle(article: Article) {
  await api(`/api/articles/${encodeURIComponent(article.id)}`, {
    method: 'PUT',
    body: JSON.stringify(article),
  });
}

export async function deleteArticle(id: string) {
  await api(`/api/articles/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------
// CLINIC SETTINGS
// ---------------------------------------------------------------------
const settingsPoller = createSharedPoller<ClinicSettings>(async () => {
  const data = await api<ClinicSettings>('/api/settings');
  return normalizeClinicSettings(data);
}, 'Settings');

export function subscribeClinicSettings(callback: (settings: ClinicSettings) => void) {
  return settingsPoller.subscribe(callback);
}

export async function saveClinicSettings(settings: ClinicSettings) {
  await api('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(normalizeClinicSettings(settings)),
  });
}

// ---------------------------------------------------------------------
// FAQS
// ---------------------------------------------------------------------
export function subscribeFaqs(callback: (data: FAQItem[]) => void) {
  return subscribeList<FAQItem>('/api/faqs', callback, 'FAQs');
}

export async function saveFaq(faq: FAQItem) {
  await api(`/api/faqs/${encodeURIComponent(faq.id)}`, {
    method: 'PUT',
    body: JSON.stringify(faq),
  });
}

export async function deleteFaq(id: string) {
  await api(`/api/faqs/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------
// FORMS
// ---------------------------------------------------------------------
export function subscribeForms(callback: (data: FormDefinition[]) => void) {
  return subscribeList<FormDefinition>('/api/forms', callback, 'Forms');
}

export async function fetchForm(id: string): Promise<FormDefinition | null> {
  try {
    return await api<FormDefinition>(`/api/forms/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}

export async function saveForm(form: FormDefinition) {
  await api(`/api/forms/${encodeURIComponent(form.id)}`, {
    method: 'PUT',
    body: JSON.stringify(form),
  });
}

export async function deleteForm(id: string) {
  await api(`/api/forms/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export function subscribeFormSubmissions(callback: (data: FormSubmission[]) => void) {
  return subscribeList<FormSubmission>('/api/form-submissions', callback, 'FormSubmissions');
}

export async function saveFormSubmission(submission: FormSubmission) {
  await api(`/api/form-submissions/${encodeURIComponent(submission.id)}`, {
    method: 'PUT',
    body: JSON.stringify(submission),
  });
}

export async function deleteFormSubmission(id: string) {
  await api(`/api/form-submissions/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function submitForm(
  formId: string,
  payload: {
    answers: Record<string, FormAnswerValue>;
    pageId?: string;
    pageSlug?: string;
  }
): Promise<{ ok: boolean; id: string; message: string }> {
  return api(`/api/forms/${encodeURIComponent(formId)}/submit`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------
// USERS
// ---------------------------------------------------------------------
export async function loginUser(input: {
  mobile?: string;
  username?: string;
  password: string;
  role?: string;
}): Promise<UserProfile> {
  return api<UserProfile>('/api/users/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function registerUser(input: {
  name: string;
  mobile: string;
  password: string;
  role?: string;
  username?: string;
  nationalId?: string;
  email?: string;
  doctorTitle?: string;
  specialty?: string;
  gender?: 'female' | 'male';
  age?: number;
  address?: string;
  emergencyPhone?: string;
}): Promise<UserProfile> {
  return api<UserProfile>('/api/users/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function saveUserProfile(
  user: UserProfile & { password?: string }
): Promise<UserProfile> {
  return api<UserProfile>(`/api/users/${encodeURIComponent(user.id)}`, {
    method: 'PUT',
    body: JSON.stringify(user),
  });
}

export async function deleteUser(id: string): Promise<void> {
  await api(`/api/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function fetchUsers(): Promise<UserProfile[]> {
  return api<UserProfile[]>('/api/users');
}

// ---------------------------------------------------------------------
// SHOP — PRODUCTS
// ---------------------------------------------------------------------
export function subscribeProducts(callback: (data: ShopProduct[]) => void) {
  return subscribeList<ShopProduct>('/api/products', callback, 'Products');
}

export async function saveProduct(product: ShopProduct) {
  await api(`/api/products/${encodeURIComponent(product.id)}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  });
}

export async function deleteProduct(id: string) {
  await api(`/api/products/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------
// SHOP — PRODUCT CATEGORIES
// ---------------------------------------------------------------------
export function subscribeProductCategories(callback: (data: ShopProductCategory[]) => void) {
  return subscribeList<ShopProductCategory>(
    '/api/product-categories',
    callback,
    'ProductCategories'
  );
}

export async function saveProductCategory(category: ShopProductCategory) {
  await api(`/api/product-categories/${encodeURIComponent(category.id)}`, {
    method: 'PUT',
    body: JSON.stringify(category),
  });
}

export async function deleteProductCategory(id: string) {
  await api(`/api/product-categories/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------
// WORKSHOPS
// ---------------------------------------------------------------------
export function subscribeWorkshops(callback: (data: Workshop[]) => void) {
  return subscribeList<Workshop>('/api/workshops', callback, 'Workshops');
}

export async function saveWorkshop(workshop: Workshop) {
  await api(`/api/workshops/${encodeURIComponent(workshop.id)}`, {
    method: 'PUT',
    body: JSON.stringify(workshop),
  });
}

export async function deleteWorkshop(id: string) {
  await api(`/api/workshops/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------
// SHOP — ORDERS
// ---------------------------------------------------------------------
export function subscribeOrders(callback: (data: ShopOrder[]) => void) {
  return subscribeList<ShopOrder>('/api/orders', callback, 'Orders');
}

export async function saveOrder(order: ShopOrder) {
  await api(`/api/orders/${encodeURIComponent(order.id)}`, {
    method: 'PUT',
    body: JSON.stringify(order),
  });
}

export async function createOrder(order: ShopOrder) {
  return api<ShopOrder>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  });
}

export async function deleteOrder(id: string) {
  await api(`/api/orders/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export type ShopPaymentStartResult =
  | { ok: true; gateway: 'zarinpal'; paymentUrl: string; authority: string; orderId: string }
  | {
      ok: true;
      gateway: 'mellat';
      type: 'mellat_form';
      gatewayUrl: string;
      refId: string;
      orderId: string;
    };

export async function startShopPayment(input: {
  order: ShopOrder;
  gateway: 'zarinpal' | 'mellat';
  returnBaseUrl?: string;
}): Promise<ShopPaymentStartResult> {
  return api<ShopPaymentStartResult>('/api/shop/payment/start', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function verifyZarinpalShopPayment(input: {
  orderId: string;
  authority: string;
  status?: string;
}): Promise<{ ok: boolean; order?: ShopOrder; refId?: string; error?: string; alreadyPaid?: boolean }> {
  return api('/api/shop/payment/verify/zarinpal', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function fetchShopOrder(id: string): Promise<ShopOrder | null> {
  try {
    return await api<ShopOrder>(`/api/shop/payment/order/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}

/** Redirect browser to Mellat startpay via auto-submitted form */
export function redirectToMellatGateway(gatewayUrl: string, refId: string) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = gatewayUrl;
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'RefId';
  input.value = refId;
  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
}

export async function uploadShopDocument(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append('file', file);
  const headers = writeAuthHeaders();
  const res = await fetch('/api/uploads?purpose=shop', {
    method: 'POST',
    headers,
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Upload failed');
  }
  return res.json();
}

