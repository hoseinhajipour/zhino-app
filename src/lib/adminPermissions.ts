import type { UserRole } from '../types';

export type AdminTabId =
  | 'overview'
  | 'appointments'
  | 'personnel'
  | 'pages'
  | 'articles'
  | 'faqs'
  | 'settings';

export interface AdminNavItem {
  id: AdminTabId;
  label: string;
  icon: string;
}

const ALL_NAV: AdminNavItem[] = [
  { id: 'overview', label: 'نمای کلی', icon: 'dashboard' },
  { id: 'appointments', label: 'نوبت‌ها', icon: 'calendar_month' },
  { id: 'personnel', label: 'پرسنل و خدمات', icon: 'groups' },
  { id: 'pages', label: 'مدیریت صفحه‌ها', icon: 'web' },
  { id: 'articles', label: 'مقالات', icon: 'article' },
  { id: 'faqs', label: 'سوالات متداول', icon: 'help' },
  { id: 'settings', label: 'تنظیمات', icon: 'settings' },
];

const TABS_BY_ROLE: Record<'admin' | 'doctor' | 'operator', AdminTabId[]> = {
  admin: ['overview', 'appointments', 'personnel', 'pages', 'articles', 'faqs', 'settings'],
  operator: ['overview', 'appointments', 'personnel', 'faqs'],
  doctor: ['overview', 'appointments', 'articles', 'faqs'],
};

export function getRoleLabel(role: UserRole | string): string {
  if (role === 'admin') return 'مدیر سیستم';
  if (role === 'doctor') return 'پزشک / درمانگر';
  if (role === 'operator') return 'اپراتور / پذیرش';
  return 'مراجعه‌کننده';
}

export function getStaffRole(role?: UserRole | string | null): 'admin' | 'doctor' | 'operator' {
  if (role === 'admin' || role === 'doctor' || role === 'operator') return role;
  return 'admin';
}

export function getAllowedTabs(role?: UserRole | string | null): AdminNavItem[] {
  const r = getStaffRole(role);
  const allowed = TABS_BY_ROLE[r];
  return ALL_NAV.filter((item) => allowed.includes(item.id));
}

export function canManagePersonnel(role?: UserRole | string | null): boolean {
  return getStaffRole(role) === 'admin';
}

export function canViewServicesOnly(role?: UserRole | string | null): boolean {
  return getStaffRole(role) === 'operator';
}

export function canAccessPersonnelTab(role?: UserRole | string | null): boolean {
  const r = getStaffRole(role);
  return r === 'admin' || r === 'operator';
}

export function canManageArticles(role?: UserRole | string | null): boolean {
  const r = getStaffRole(role);
  return r === 'admin' || r === 'doctor';
}

export function canManageAllArticles(role?: UserRole | string | null): boolean {
  return getStaffRole(role) === 'admin';
}

export function canManageSettings(role?: UserRole | string | null): boolean {
  return getStaffRole(role) === 'admin';
}

export function canEditAllAppointments(role?: UserRole | string | null): boolean {
  const r = getStaffRole(role);
  return r === 'admin' || r === 'operator';
}

export function canDeleteAppointments(role?: UserRole | string | null): boolean {
  const r = getStaffRole(role);
  return r === 'admin' || r === 'operator';
}

export function canManageDoctors(role?: UserRole | string | null): boolean {
  return getStaffRole(role) === 'admin';
}

export function canEditServicePages(role?: UserRole | string | null): boolean {
  return getStaffRole(role) === 'admin';
}

export function canEditSitePages(role?: UserRole | string | null): boolean {
  return getStaffRole(role) === 'admin';
}

export function canDeleteServices(role?: UserRole | string | null): boolean {
  return getStaffRole(role) === 'admin';
}

export function canApproveFaqs(role?: UserRole | string | null): boolean {
  const r = getStaffRole(role);
  return r === 'admin' || r === 'operator';
}
