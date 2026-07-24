import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { UserProfile, UserRole } from '../../types';
import {
  deleteUser,
  fetchUsers,
  registerUser,
  saveUserProfile,
} from '../../lib/dbService';
import { getRoleLabel } from '../../lib/adminPermissions';

interface UsersManagementPanelProps {
  currentUserId?: string | null;
}

type RoleFilter = 'all' | UserRole;

type UserFormState = {
  name: string;
  mobile: string;
  username: string;
  password: string;
  role: UserRole;
  email: string;
  nationalId: string;
  doctorTitle: string;
  specialty: string;
};

const EMPTY_FORM: UserFormState = {
  name: '',
  mobile: '',
  username: '',
  password: '',
  role: 'patient',
  email: '',
  nationalId: '',
  doctorTitle: '',
  specialty: '',
};

const ROLE_OPTIONS: { value: UserRole; label: string; hint: string }[] = [
  { value: 'admin', label: 'مدیر سیستم', hint: 'دسترسی کامل به داشبورد' },
  { value: 'operator', label: 'اپراتور / پذیرش', hint: 'نوبت‌ها و پذیرش' },
  { value: 'doctor', label: 'پزشک / درمانگر', hint: 'نوبت‌ها و مقالات' },
  { value: 'patient', label: 'کاربر معمولی (مراجع)', hint: 'پنل کاربری سایت' },
];

function roleBadgeClass(role: UserRole): string {
  if (role === 'admin') return 'bg-violet-100 text-violet-800 border-violet-200';
  if (role === 'operator') return 'bg-sky-100 text-sky-800 border-sky-200';
  if (role === 'doctor') return 'bg-teal-100 text-teal-800 border-teal-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

function needsUsername(role: UserRole) {
  return role !== 'patient';
}

export const UsersManagementPanel: React.FC<UsersManagementPanelProps> = ({
  currentUserId,
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const list = await fetchUsers();
      setUsers(
        [...list].sort((a, b) => {
          const order: Record<UserRole, number> = {
            admin: 0,
            operator: 1,
            doctor: 2,
            patient: 3,
          };
          const d = (order[a.role] ?? 9) - (order[b.role] ?? 9);
          if (d !== 0) return d;
          return a.name.localeCompare(b.name, 'fa');
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت کاربران');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    const base: Record<UserRole | 'all', number> = {
      all: users.length,
      admin: 0,
      operator: 0,
      doctor: 0,
      patient: 0,
    };
    for (const u of users) base[u.role] += 1;
    return base;
  }, [users]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.mobile.includes(q) ||
        (u.username || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      );
    });
  }, [users, search, roleFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalMode('create');
    setMsg(null);
  };

  const openEdit = (user: UserProfile) => {
    setEditing(user);
    setForm({
      name: user.name || '',
      mobile: user.mobile || '',
      username: user.username || '',
      password: '',
      role: user.role,
      email: user.email || '',
      nationalId: user.nationalId || '',
      doctorTitle: user.doctorTitle || '',
      specialty: user.specialty || '',
    });
    setModalMode('edit');
    setMsg(null);
  };

  const patchForm = <K extends keyof UserFormState>(key: K, value: UserFormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      if (!form.name.trim() || !form.mobile.trim()) {
        throw new Error('نام و موبایل الزامی است');
      }
      if (needsUsername(form.role) && !form.username.trim()) {
        throw new Error('برای این نقش، نام کاربری الزامی است');
      }
      if (modalMode === 'create') {
        if (!form.password || form.password.length < 6) {
          throw new Error('رمز عبور باید حداقل ۶ کاراکتر باشد');
        }
        await registerUser({
          name: form.name.trim(),
          mobile: form.mobile.trim(),
          password: form.password,
          role: form.role,
          username: form.username.trim() || undefined,
          email: form.email.trim() || undefined,
          nationalId: form.nationalId.trim() || undefined,
          doctorTitle: form.doctorTitle.trim() || undefined,
          specialty: form.specialty.trim() || undefined,
        });
        setMsg({ type: 'success', text: 'کاربر جدید با موفقیت ایجاد شد.' });
      } else if (editing) {
        await saveUserProfile({
          ...editing,
          name: form.name.trim(),
          mobile: form.mobile.trim(),
          role: form.role,
          username: form.username.trim() || undefined,
          email: form.email.trim() || undefined,
          nationalId: form.nationalId.trim() || undefined,
          doctorTitle: form.doctorTitle.trim() || undefined,
          specialty: form.specialty.trim() || undefined,
          ...(form.password.trim() ? { password: form.password.trim() } : {}),
        });
        setMsg({ type: 'success', text: 'اطلاعات کاربر به‌روزرسانی شد.' });
      }
      setModalMode(null);
      await load();
      setTimeout(() => setMsg(null), 4000);
    } catch (err) {
      setMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'خطا در ذخیره کاربر',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: UserProfile) => {
    if (user.id === currentUserId) {
      setMsg({ type: 'error', text: 'نمی‌توانید حساب خودتان را حذف کنید.' });
      return;
    }
    const ok = window.confirm(
      `آیا از حذف کاربر «${user.name}» (${getRoleLabel(user.role)}) مطمئن هستید؟`
    );
    if (!ok) return;
    setDeletingId(user.id);
    setMsg(null);
    try {
      await deleteUser(user.id);
      setMsg({ type: 'success', text: 'کاربر حذف شد.' });
      await load();
      setTimeout(() => setMsg(null), 4000);
    } catch (err) {
      setMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'خطا در حذف کاربر',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const field =
    'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm outline-none focus:ring-2 focus:ring-primary/30';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-on-surface-variant">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">
          progress_activity
        </span>
        <p className="text-xs font-bold">در حال بارگذاری کاربران…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800 text-sm font-bold space-y-3">
        <p>{error}</p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            void load();
          }}
          className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {msg && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span className="material-symbols-outlined">
            {msg.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{msg.text}</span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">manage_accounts</span>
            </div>
            <div>
              <h2 className="text-sm font-black text-on-surface">مدیریت کاربران</h2>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                {counts.all} کاربر ثبت‌شده در سیستم
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            کاربر جدید
          </button>
        </div>

        <div className="p-4 md:p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['all', 'همه'],
                ['admin', 'ادمین'],
                ['operator', 'اپراتور'],
                ['doctor', 'پزشک'],
                ['patient', 'مراجع'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setRoleFilter(id)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${
                  roleFilter === id
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface-container-low border-outline-variant/40 text-on-surface-variant hover:border-primary/40'
                }`}
              >
                {label} ({counts[id]})
              </button>
            ))}
          </div>

          <div className="relative">
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
              search
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو بر اساس نام، موبایل، نام کاربری یا ایمیل…"
              className={`${field} pr-10`}
            />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
            <table className="w-full text-right text-xs min-w-[720px]">
              <thead className="bg-slate-50 dark:bg-slate-950 text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3 font-bold">کاربر</th>
                  <th className="px-4 py-3 font-bold">نقش</th>
                  <th className="px-4 py-3 font-bold">موبایل</th>
                  <th className="px-4 py-3 font-bold">نام کاربری</th>
                  <th className="px-4 py-3 font-bold">ایمیل</th>
                  <th className="px-4 py-3 font-bold w-36">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-on-surface-variant font-bold">
                      کاربری با این فیلتر یافت نشد.
                    </td>
                  </tr>
                ) : (
                  filtered.map((user) => (
                    <tr
                      key={user.id}
                      className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-950/40"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center overflow-hidden shrink-0">
                            {user.avatar ? (
                              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-lg">person</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-on-surface truncate">{user.name}</p>
                            {user.doctorTitle && (
                              <p className="text-[10px] text-on-surface-variant truncate">
                                {user.doctorTitle}
                              </p>
                            )}
                            {user.id === currentUserId && (
                              <span className="text-[10px] font-bold text-primary">شما</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-black ${roleBadgeClass(user.role)}`}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold" dir="ltr">
                        {user.mobile}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px]" dir="ltr">
                        {user.username || '—'}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant truncate max-w-[160px]" dir="ltr">
                        {user.email || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(user)}
                            className="p-2 rounded-xl hover:bg-primary/10 text-primary"
                            title="ویرایش"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            type="button"
                            disabled={user.id === currentUserId || deletingId === user.id}
                            onClick={() => void handleDelete(user)}
                            className="p-2 rounded-xl hover:bg-rose-50 text-rose-600 disabled:opacity-30"
                            title="حذف"
                          >
                            <span className="material-symbols-outlined text-lg">
                              {deletingId === user.id ? 'progress_activity' : 'delete'}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-900 px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 z-10">
              <h3 className="text-sm font-black text-on-surface">
                {modalMode === 'create' ? 'افزودن کاربر جدید' : 'ویرایش کاربر'}
              </h3>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={(e) => void submit(e)} className="p-5 space-y-4">
              <div>
                <p className="text-[11px] font-bold text-on-surface-variant mb-2">نقش کاربر</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ROLE_OPTIONS.map((opt) => {
                    const active = form.role === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => patchForm('role', opt.value)}
                        className={`text-right rounded-xl border p-3 transition-all ${
                          active
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-outline-variant/40 hover:border-primary/30'
                        }`}
                      >
                        <p className="text-xs font-black text-on-surface">{opt.label}</p>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">{opt.hint}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="block space-y-1">
                <span className="text-[11px] font-bold text-on-surface-variant">نام کامل *</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => patchForm('name', e.target.value)}
                  className={field}
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-[11px] font-bold text-on-surface-variant">موبایل *</span>
                  <input
                    required
                    value={form.mobile}
                    onChange={(e) => patchForm('mobile', e.target.value)}
                    className={field}
                    dir="ltr"
                    placeholder="09xxxxxxxxx"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] font-bold text-on-surface-variant">
                    نام کاربری {needsUsername(form.role) ? '*' : '(اختیاری)'}
                  </span>
                  <input
                    value={form.username}
                    onChange={(e) => patchForm('username', e.target.value)}
                    className={field}
                    dir="ltr"
                    required={needsUsername(form.role)}
                    placeholder={needsUsername(form.role) ? 'برای ورود داشبورد' : 'اختیاری'}
                  />
                </label>
              </div>

              <label className="block space-y-1">
                <span className="text-[11px] font-bold text-on-surface-variant">
                  {modalMode === 'create'
                    ? 'رمز عبور *'
                    : 'رمز عبور جدید (خالی = بدون تغییر)'}
                </span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => patchForm('password', e.target.value)}
                  className={field}
                  dir="ltr"
                  required={modalMode === 'create'}
                  minLength={modalMode === 'create' || form.password ? 6 : undefined}
                  autoComplete="new-password"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-[11px] font-bold text-on-surface-variant">ایمیل</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => patchForm('email', e.target.value)}
                    className={field}
                    dir="ltr"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] font-bold text-on-surface-variant">کد ملی</span>
                  <input
                    value={form.nationalId}
                    onChange={(e) => patchForm('nationalId', e.target.value)}
                    className={field}
                    dir="ltr"
                  />
                </label>
              </div>

              {(form.role === 'doctor' || form.role === 'admin' || form.role === 'operator') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block space-y-1">
                    <span className="text-[11px] font-bold text-on-surface-variant">عنوان شغلی</span>
                    <input
                      value={form.doctorTitle}
                      onChange={(e) => patchForm('doctorTitle', e.target.value)}
                      className={field}
                      placeholder="مثلاً مسئول پذیرش"
                    />
                  </label>
                  {form.role === 'doctor' && (
                    <label className="block space-y-1">
                      <span className="text-[11px] font-bold text-on-surface-variant">تخصص</span>
                      <input
                        value={form.specialty}
                        onChange={(e) => patchForm('specialty', e.target.value)}
                        className={field}
                      />
                    </label>
                  )}
                </div>
              )}

              {msg?.type === 'error' && modalMode && (
                <p className="text-[11px] font-bold text-rose-600">{msg.text}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-outline-variant/40"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">
                    {saving ? 'progress_activity' : 'save'}
                  </span>
                  {saving ? 'در حال ذخیره…' : modalMode === 'create' ? 'ایجاد کاربر' : 'ذخیره تغییرات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
