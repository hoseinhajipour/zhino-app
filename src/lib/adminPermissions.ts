import type { UserRole } from '../types';

export type AdminTabId =
  | 'overview'
  | 'appointments'
  | 'personnel'
  | 'users'
  | 'pages'
  | 'articles'
  | 'faqs'
  | 'forms'
  | 'products'
  | 'orders'
  | 'shop-settings'
  | 'files'
  | 'contact'
  | 'modules'
  | 'system'
  | 'settings'
  | 'tools-io';

export interface AdminNavItem {
  id: AdminTabId;
  label: string;
  icon: string;
}

export interface AdminNavGroup {
  id: string;
  label: string;
  icon: string;
  children: AdminNavItem[];
}

export type AdminNavEntry = AdminNavItem | AdminNavGroup;

export function isAdminNavGroup(entry: AdminNavEntry): entry is AdminNavGroup {
  return Array.isArray((entry as AdminNavGroup).children);
}

const ALL_NAV: AdminNavEntry[] = [
  { id: 'overview', label: 'نمای کلی', icon: 'dashboard' },
  { id: 'appointments', label: 'نوبت‌ها', icon: 'calendar_month' },
  { id: 'personnel', label: 'پرسنل و خدمات', icon: 'groups' },
  { id: 'users', label: 'مدیریت کاربران', icon: 'manage_accounts' },
  { id: 'pages', label: 'مدیریت صفحه‌ها', icon: 'web' },
  { id: 'articles', label: 'مقالات', icon: 'article' },
  { id: 'faqs', label: 'سوالات متداول', icon: 'help' },
  { id: 'forms', label: 'فرم‌ها', icon: 'dynamic_form' },
  { id: 'products', label: 'محصولات', icon: 'inventory_2' },
  { id: 'orders', label: 'سفارش‌ها', icon: 'receipt_long' },
  { id: 'shop-settings', label: 'تنظیمات فروشگاه', icon: 'storefront' },
  { id: 'files', label: 'مدیریت فایل‌ها', icon: 'folder_open' },
  { id: 'contact', label: 'اطلاعات تماس', icon: 'contact_phone' },
  { id: 'modules', label: 'ماژول‌ها', icon: 'extension' },
  { id: 'system', label: 'وضعیت سیستم', icon: 'monitor_heart' },
  {
    id: 'tools',
    label: 'ابزارها',
    icon: 'handyman',
    children: [{ id: 'tools-io', label: 'درونریزی و برونریزی', icon: 'import_export' }],
  },
  { id: 'settings', label: 'تنظیمات', icon: 'settings' },
];

const TABS_BY_ROLE: Record<'admin' | 'doctor' | 'operator', AdminTabId[]> = {
  admin: [
    'overview',
    'appointments',
    'personnel',
    'users',
    'pages',
    'articles',
    'faqs',
    'forms',
    'products',
    'orders',
    'shop-settings',
    'files',
    'contact',
    'modules',
    'system',
    'tools-io',
    'settings',
  ],
  operator: ['overview', 'appointments', 'personnel', 'faqs', 'forms'],
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

/** Flat list of leaf tabs (for permission checks). */
export function getAllowedTabs(
  role?: UserRole | string | null,
  options?: {
    appointmentsModuleEnabled?: boolean;
    shopModuleEnabled?: boolean;
    fileManagerModuleEnabled?: boolean;
  }
): AdminNavItem[] {
  return flattenNav(getAllowedNav(role, options));
}

/** Sidebar structure including groups like «ابزارها». */
export function getAllowedNav(
  role?: UserRole | string | null,
  options?: {
    appointmentsModuleEnabled?: boolean;
    shopModuleEnabled?: boolean;
    fileManagerModuleEnabled?: boolean;
  }
): AdminNavEntry[] {
  const r = getStaffRole(role);
  const allowed = TABS_BY_ROLE[r];
  const appointmentsOn = options?.appointmentsModuleEnabled !== false;
  const shopOn = options?.shopModuleEnabled === true;
  const filesOn = options?.fileManagerModuleEnabled === true;

  const out: AdminNavEntry[] = [];
  for (const entry of ALL_NAV) {
    if (isAdminNavGroup(entry)) {
      const children = entry.children.filter((c) => {
        if (!allowed.includes(c.id)) return false;
        if (c.id === 'appointments' && !appointmentsOn) return false;
        if ((c.id === 'products' || c.id === 'orders' || c.id === 'shop-settings') && !shopOn)
          return false;
        if (c.id === 'files' && !filesOn) return false;
        return true;
      });
      if (children.length) out.push({ ...entry, children });
      continue;
    }
    if (!allowed.includes(entry.id)) continue;
    if (entry.id === 'appointments' && !appointmentsOn) continue;
    if ((entry.id === 'products' || entry.id === 'orders' || entry.id === 'shop-settings') && !shopOn)
      continue;
    if (entry.id === 'files' && !filesOn) continue;
    out.push(entry);
  }
  return out;
}

export function flattenNav(entries: AdminNavEntry[]): AdminNavItem[] {
  const items: AdminNavItem[] = [];
  for (const e of entries) {
    if (isAdminNavGroup(e)) items.push(...e.children);
    else items.push(e);
  }
  return items;
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

export function canManageUsers(role?: UserRole | string | null): boolean {
  return getStaffRole(role) === 'admin';
}

export function canManageModules(role?: UserRole | string | null): boolean {
  return getStaffRole(role) === 'admin';
}

export function canViewSystemStatus(role?: UserRole | string | null): boolean {
  return getStaffRole(role) === 'admin';
}

export function canManageTools(role?: UserRole | string | null): boolean {
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

export function canManageFormDefinitions(role?: UserRole | string | null): boolean {
  return getStaffRole(role) === 'admin';
}

export function canManageFormSubmissions(role?: UserRole | string | null): boolean {
  const r = getStaffRole(role);
  return r === 'admin' || r === 'operator';
}
