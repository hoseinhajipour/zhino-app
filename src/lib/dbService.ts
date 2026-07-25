import {
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
} from '../types';
import { DEFAULT_CONTACT_INFO, mergeContactInfo } from './contactInfo';
import { DEFAULT_FREE_GUIDE, mergeFreeGuide } from './freeGuideDefaults';
import { DEFAULT_SITE_CHROME, mergeSiteChrome } from './siteChromeDefaults';
import { DEFAULT_SITE_MODULES, mergeSiteModules } from './siteModules';

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
    callbackUrl: 'https://zhinoclinic.ir/verify-payment',
  },
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
    kavenegar: { ...base.kavenegar, ...(raw?.kavenegar || {}) },
    site,
    contact: mergeContactInfo(raw?.contact || base.contact, site.identity),
    modules: mergeSiteModules(raw?.modules || base.modules),
    freeGuide: mergeFreeGuide(raw?.freeGuide || base.freeGuide),
  };
}

const POLL_MS = 6000;

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
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

function subscribeList<T>(
  path: string,
  callback: (data: T[]) => void,
  label: string
): () => void {
  let cancelled = false;

  const load = async () => {
    try {
      const data = await api<T[]>(path);
      if (!cancelled) callback(data);
    } catch (err) {
      console.error(`${label} fetch error:`, err);
    }
  };

  void load();
  const timer = setInterval(load, POLL_MS);
  return () => {
    cancelled = true;
    clearInterval(timer);
  };
}

export async function uploadFile(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/uploads', { method: 'POST', body: form });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Upload failed');
  }
  const data = (await res.json()) as { url: string };
  return data.url;
}

export interface MediaLibraryItem {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
  kind: 'image' | 'video' | 'other';
  source: 'uploads' | 'staff';
  uploadedAt: string;
}

export async function fetchMediaLibrary(kind: 'all' | 'image' | 'video' = 'all'): Promise<MediaLibraryItem[]> {
  const qs = kind === 'all' ? '' : `?kind=${kind}`;
  return api<MediaLibraryItem[]>(`/api/uploads${qs}`);
}

export async function deleteMediaFile(filename: string): Promise<void> {
  await api(`/api/uploads/${encodeURIComponent(filename)}`, { method: 'DELETE' });
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
export function subscribeClinicSettings(callback: (settings: ClinicSettings) => void) {
  let cancelled = false;

  const load = async () => {
    try {
      const data = await api<ClinicSettings>('/api/settings');
      if (!cancelled) callback(normalizeClinicSettings(data));
    } catch (err) {
      console.error('Settings fetch error:', err);
      if (!cancelled) callback(DEFAULT_CLINIC_SETTINGS);
    }
  };

  void load();
  const timer = setInterval(load, POLL_MS);
  return () => {
    cancelled = true;
    clearInterval(timer);
  };
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
