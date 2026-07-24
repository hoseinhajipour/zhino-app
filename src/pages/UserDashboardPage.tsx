import React, { useState } from 'react';
import { Appointment, UserProfile, PatientTransaction } from '../types';

interface UserDashboardPageProps {
  currentUser: UserProfile;
  appointments: Appointment[];
  onUpdateAppointments: (appointments: Appointment[]) => void;
  onUpdateUserProfile: (updatedUser: UserProfile) => void;
  onOpenBooking: () => void;
  onLogout: () => void;
}

export const UserDashboardPage: React.FC<UserDashboardPageProps> = ({
  currentUser,
  appointments,
  onUpdateAppointments,
  onUpdateUserProfile,
  onOpenBooking,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'appointments' | 'transactions' | 'profile'>('appointments');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'completed' | 'cancelled'>('all');

  // Cancel modal
  const [cancelModalApp, setCancelModalApp] = useState<Appointment | null>(null);

  // Profile form state
  const [name, setName] = useState(currentUser.name || '');
  const [mobile, setMobile] = useState(currentUser.mobile || '');
  const [nationalId, setNationalId] = useState(currentUser.nationalId || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [gender, setGender] = useState<'female' | 'male'>(currentUser.gender || 'female');
  const [age, setAge] = useState<number | undefined>(currentUser.age || 28);
  const [address, setAddress] = useState(currentUser.address || '');
  const [emergencyPhone, setEmergencyPhone] = useState(currentUser.emergencyPhone || '');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Receipt Modal
  const [viewReceiptApp, setViewReceiptApp] = useState<Appointment | null>(null);

  // Sample transactions generated for user appointments or general payments
  const [transactions] = useState<PatientTransaction[]>([
    {
      id: 'tx-101',
      appointmentId: 'app-101',
      amount: '۸۵۰,۰۰۰ تومان',
      date: '۱۴۰۳/۰۴/۲۸ - ۱۴:۲۵',
      description: 'پرداخت آنلاین رزرو مشاوره فردی بزرگسال - خانم مرجانه دیهیمی',
      status: 'successful',
      trackingCode: 'ZARIN-8849201',
      paymentMethod: 'online',
    },
    {
      id: 'tx-102',
      appointmentId: 'app-102',
      amount: '۱,۱۰۰,۰۰۰ تومان',
      date: '۱۴۰۳/۰۴/۲۹ - ۰۹:۲۰',
      description: 'پیش‌پرداخت جلسه زوج‌درمانی - خانم مرجان قدیانی',
      status: 'successful',
      trackingCode: 'ZARIN-3910441',
      paymentMethod: 'online',
    },
    {
      id: 'tx-103',
      appointmentId: 'app-103',
      amount: '۹۰۰,۰۰۰ تومان',
      date: '۱۴۰۳/۰۴/۲۵ - ۱۸:۳۵',
      description: 'تسویه حضوری دستگاه کارتخوان - بازی درمانی کودک',
      status: 'successful',
      trackingCode: 'POS-9120938',
      paymentMethod: 'card_reader',
    },
  ]);

  // Filter user's appointments (matching by phone or name, or all if demo)
  const myAppointments = appointments.filter((app) => {
    if (!currentUser.mobile) return true;
    const cleanUserMobile = currentUser.mobile.replace(/\D/g, '');
    const cleanAppMobile = app.patientPhone.replace(/\D/g, '');
    return cleanUserMobile === cleanAppMobile || app.patientName.includes(currentUser.name);
  });

  const filteredAppointments = myAppointments.filter((app) => {
    if (statusFilter === 'all') return true;
    return app.status === statusFilter;
  });

  const handleCancelAppointment = () => {
    if (!cancelModalApp) return;
    const updated = appointments.map((a) =>
      a.id === cancelModalApp.id ? { ...a, status: 'cancelled' as const } : a
    );
    onUpdateAppointments(updated);
    setCancelModalApp(null);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...currentUser,
      name,
      mobile,
      nationalId,
      email,
      gender,
      age,
      address,
      emergencyPhone,
    };
    onUpdateUserProfile(updated);
    setSaveSuccessMsg('مشخصات پروفایل شما با موفقیت به‌روزرسانی گردید.');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 text-right">
      {/* HEADER / WELCOME BANNER */}
      <div className="bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={currentUser.name}
              className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border-2 border-white dark:border-surface-dim shadow-md"
            />
            <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]" title="آنلاین">
              ✓
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-on-surface">
                خوش آمدید، {currentUser.name}
              </h1>
              <span className="px-2.5 py-1 bg-primary/10 text-primary font-bold rounded-lg text-xs">
                مراجعه‌کننده محترم
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1 flex items-center gap-3">
              <span>شماره همراه: <strong dir="ltr" className="text-on-surface">{currentUser.mobile}</strong></span>
              {currentUser.nationalId && (
                <span>کد ملی: <strong className="text-on-surface">{currentUser.nationalId}</strong></span>
              )}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={onOpenBooking}
            className="bg-primary hover:bg-primary-container text-white px-5 py-2.5 rounded-2xl font-bold text-xs shadow-md flex items-center gap-2 transition-all"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            <span>رزرو نوبت جدید</span>
          </button>

          <button
            onClick={onLogout}
            className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            <span>خروج</span>
          </button>
        </div>
      </div>

      {/* DASHBOARD NAVIGATION TABS */}
      <div className="flex border-b border-outline-variant/30 gap-2 sm:gap-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`pb-3 transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'appointments'
              ? 'border-primary text-primary font-black'
              : 'border-transparent text-on-surface-variant hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-lg">calendar_month</span>
          <span>نوبت‌های من ({myAppointments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'transactions'
              ? 'border-primary text-primary font-black'
              : 'border-transparent text-on-surface-variant hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-lg">receipt_long</span>
          <span>تراکنش‌ها و پرداخت‌ها ({transactions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'profile'
              ? 'border-primary text-primary font-black'
              : 'border-transparent text-on-surface-variant hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-lg">manage_accounts</span>
          <span>ویرایش اطلاعات و پروفایل</span>
        </button>
      </div>

      {/* TAB 1: MY APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="space-y-6">
          {/* Status Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container-low p-3 rounded-2xl border border-outline-variant/20">
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
              <span className="text-on-surface-variant ml-2">فیلتر وضعیت:</span>
              {[
                { id: 'all', label: 'همه نوبت‌ها' },
                { id: 'confirmed', label: 'تایید شده' },
                { id: 'pending', label: 'در انتظار تایید' },
                { id: 'completed', label: 'تکمیل شده' },
                { id: 'cancelled', label: 'لغو شده' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    statusFilter === f.id
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-white dark:bg-surface-dim text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <button
              onClick={onOpenBooking}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>درخواست مشاوره جدید</span>
            </button>
          </div>

          {/* List of Appointments */}
          {filteredAppointments.length === 0 ? (
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-3xl">event_busy</span>
              </div>
              <h3 className="font-bold text-lg">نوبتی در این بخش یافت نشد</h3>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                شما هیچ نوبت رزرو شده‌ای با این وضعیت ندارید. می‌توانید در صورت نیاز هم‌اکنون نوبت جدید رزرو کنید.
              </p>
              <button
                onClick={onOpenBooking}
                className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow hover:bg-primary-container transition-all"
              >
                رزرو اولین نوبت
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAppointments.map((app) => {
                const isCancelled = app.status === 'cancelled';
                const isConfirmed = app.status === 'confirmed';
                const isPending = app.status === 'pending';
                const isCompleted = app.status === 'completed';

                return (
                  <div
                    key={app.id}
                    className="bg-white dark:bg-surface-dim border border-outline-variant/30 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all space-y-4 relative overflow-hidden"
                  >
                    {/* Status Top Bar */}
                    <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-lg">confirmation_number</span>
                        <span className="text-xs font-mono font-bold text-on-surface">کد رزرو: {app.bookingRef}</span>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                          isConfirmed
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isPending
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : isCompleted
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {isConfirmed && '✓ تایید شده'}
                        {isPending && '⏳ در انتظار تایید'}
                        {isCompleted && '✓ انجام شد'}
                        {isCancelled && '✕ لغو شده'}
                      </span>
                    </div>

                    {/* Doctor & Service details */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-base text-on-surface">{app.serviceTitle}</h4>
                          <p className="text-xs text-primary font-medium mt-0.5">{app.doctorName}</p>
                        </div>

                        <div className="text-left bg-surface-container-low px-3 py-1.5 rounded-xl border border-outline-variant/20">
                          <span className="text-[11px] text-on-surface-variant block">هزینه جلسه</span>
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{app.fee || '۸۵۰,۰۰۰ تومان'}</span>
                        </div>
                      </div>

                      {/* Date & Time Slot */}
                      <div className="grid grid-cols-2 gap-2 bg-surface-container-low p-2.5 rounded-2xl text-xs font-bold text-on-surface">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-primary text-base">calendar_today</span>
                          <span>تاریخ: {app.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-primary text-base">schedule</span>
                          <span>ساعت: {app.timeSlot}</span>
                        </div>
                      </div>

                      {/* Format Badge */}
                      <div className="flex items-center justify-between text-xs text-on-surface-variant pt-1">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">
                            {app.sessionType === 'online' ? 'video_camera_front' : 'location_on'}
                          </span>
                          <span>نوع جلسه: {app.sessionType === 'online' ? 'مشاوره آنلاین تصویری' : 'مراجعه حضوری به کلینیک'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between">
                      <button
                        onClick={() => setViewReceiptApp(app)}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">description</span>
                        <span>مشاهده فاکتور و رسيد</span>
                      </button>

                      {!isCancelled && !isCompleted && (
                        <button
                          onClick={() => setCancelModalApp(app)}
                          className="text-xs text-rose-600 hover:text-rose-800 font-bold px-3 py-1.5 rounded-xl hover:bg-rose-50 transition-all flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">cancel</span>
                          <span>لغو نوبت</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TRANSACTIONS & PAYMENTS */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          <div className="bg-surface-container-low p-4 rounded-3xl border border-outline-variant/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="font-bold text-base text-on-surface">سوابق تراکنش‌ها و پرداخت‌های آنلاین</h3>
              <p className="text-xs text-on-surface-variant">تمامی رسیدها و شناسه پیگیری درگاه زریـن‌پال به صورت آنلاین ذخیره گردیده‌اند.</p>
            </div>
            <div className="bg-white dark:bg-surface-dim px-4 py-2 rounded-2xl border border-outline-variant/30 text-xs font-bold">
              مجموع پرداخت‌ها: <span className="text-emerald-700">۲,۸۵۰,۰۰۰ تومان</span>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-dim border border-outline-variant/30 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-surface-container-low text-on-surface-variant font-bold border-b border-outline-variant/30">
                  <tr>
                    <th className="p-4">کد پیگیری درگاه</th>
                    <th className="p-4">تاریخ و زمان</th>
                    <th className="p-4">شرح تراکنش</th>
                    <th className="p-4">مبلغ</th>
                    <th className="p-4">روش پرداخت</th>
                    <th className="p-4">وضعیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="p-4 font-mono font-bold text-primary">{tx.trackingCode}</td>
                      <td className="p-4">{tx.date}</td>
                      <td className="p-4 font-medium text-on-surface">{tx.description}</td>
                      <td className="p-4 font-bold text-emerald-700 dark:text-emerald-400">{tx.amount}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface-variant font-bold">
                          {tx.paymentMethod === 'online' ? 'درگاه آنلاین' : 'کارتخوان کلینیک'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                          ✓ موفق
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EDIT PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-surface-dim border border-outline-variant/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
          <div className="border-b border-outline-variant/20 pb-4">
            <h3 className="font-bold text-lg text-on-surface">ویرایش مشخصات پرونده و اطلاعات کاربری</h3>
            <p className="text-xs text-on-surface-variant">اطلاعات شما جهت صدور فاکتور و ثبت در پرونده پزشکی کلینیک استفاده می‌شود.</p>
          </div>

          {saveSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">نام و نام خانوادگی *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">شماره همراه (موبایل) *</label>
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  dir="ltr"
                  className="w-full p-3 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs outline-none text-left focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">کد ملی</label>
                <input
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="0012345678"
                  dir="ltr"
                  className="w-full p-3 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs outline-none text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">پست الکترونیک (ایمیل)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  dir="ltr"
                  className="w-full p-3 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs outline-none text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">جنسیت</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full p-3 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs outline-none"
                >
                  <option value="female">خانم</option>
                  <option value="male">آقا</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">سن</label>
                <input
                  type="number"
                  min={5}
                  max={100}
                  value={age || ''}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full p-3 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">شماره تماس اضطراری</label>
                <input
                  type="tel"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="0912..."
                  dir="ltr"
                  className="w-full p-3 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs outline-none text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">آدرس سکونت</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="شهر، خیابان..."
                  className="w-full p-3 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs outline-none"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="bg-primary text-white hover:bg-primary-container px-8 py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">save</span>
                <span>ذخیره تغییرات مشخصات</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CANCEL APPOINTMENT */}
      {cancelModalApp && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-surface-dim w-full max-w-md rounded-3xl p-6 text-right space-y-4 border border-rose-200 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-600 border-b border-rose-100 pb-3">
              <span className="material-symbols-outlined text-2xl">warning</span>
              <h3 className="font-bold text-base">لغو نوبت مشاوره</h3>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              آیا از لغو نوبت مشاوره خود با <strong>{cancelModalApp.doctorName}</strong> برای تاریخ{' '}
              <strong>{cancelModalApp.date}</strong> ساعت <strong>{cancelModalApp.timeSlot}</strong> اطمینان دارید؟
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelModalApp(null)}
                className="px-4 py-2 border border-outline-variant/40 rounded-xl font-bold text-xs hover:bg-surface-container"
              >
                انصراف
              </button>
              <button
                onClick={handleCancelAppointment}
                className="px-5 py-2 bg-rose-600 text-white font-bold rounded-xl text-xs hover:bg-rose-700 transition-all"
              >
                تایید و لغو نوبت
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RECEIPT VIEW */}
      {viewReceiptApp && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-surface-dim w-full max-w-lg rounded-3xl p-6 text-right space-y-5 border border-outline-variant/30 shadow-2xl">
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-2xl">receipt</span>
                <h3 className="font-bold text-base">رسید رزرو و فاکتور نوبت</h3>
              </div>
              <button
                onClick={() => setViewReceiptApp(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 space-y-3 text-xs">
              <div className="flex justify-between border-b pb-2">
                <span className="text-on-surface-variant">کد پیگیری سیستم:</span>
                <span className="font-mono font-bold text-primary">{viewReceiptApp.bookingRef}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-on-surface-variant">خدمت درمانی:</span>
                <span className="font-bold">{viewReceiptApp.serviceTitle}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-on-surface-variant">متخصص مربوطه:</span>
                <span className="font-bold">{viewReceiptApp.doctorName}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-on-surface-variant">تاریخ و ساعت:</span>
                <span className="font-bold">{viewReceiptApp.date} - ساعت {viewReceiptApp.timeSlot}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-on-surface-variant">نوع جلسه:</span>
                <span className="font-bold">{viewReceiptApp.sessionType === 'online' ? 'مشاوره آنلاین تصویری' : 'حضوری در کلینیک'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-on-surface-variant">مراجع:</span>
                <span className="font-bold">{viewReceiptApp.patientName} ({viewReceiptApp.patientPhone})</span>
              </div>
              <div className="flex justify-between pt-1 text-sm font-bold text-emerald-700">
                <span>مبلغ پرداختی:</span>
                <span>{viewReceiptApp.fee || '۸۵۰,۰۰۰ تومان'}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                <span>چاپ / دانلود PDF فاکتور</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
