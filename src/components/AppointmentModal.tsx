import React, { useMemo, useState } from 'react';
import { MAIN_SERVICES as DEFAULT_SERVICES } from '../data/clinicData';
import {
  ClinicContactInfo,
  Doctor,
  BookingConfirmation,
  Appointment,
  PageScreen,
  ServiceItem,
} from '../types';
import { addAppointment } from '../lib/dbService';
import {
  DEFAULT_CONTACT_INFO,
  getTelHref,
  getWhatsAppHref,
  mergeContactInfo,
} from '../lib/contactInfo';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedDoctorId?: string;
  preselectedServiceId?: string;
  onAddAppointment?: (app: Appointment) => void;
  bookingEnabled?: boolean;
  onNavigate?: (screen: PageScreen) => void;
  contact?: ClinicContactInfo | null;
  doctors?: Doctor[];
  services?: ServiceItem[];
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  preselectedDoctorId,
  preselectedServiceId,
  onAddAppointment,
  bookingEnabled = true,
  onNavigate,
  contact,
  doctors: doctorsProp,
  services: servicesProp,
}) => {
  const contactInfo = mergeContactInfo(contact || DEFAULT_CONTACT_INFO);
  const phone0 = contactInfo.phones[0];
  const phone1 = contactInfo.phones[1];
  const telHref = phone0 ? getTelHref(phone0) : '';
  const waHref = getWhatsAppHref(contactInfo.whatsapp);
  const addressText = contactInfo.addresses[0]?.text || '';

  const doctors = useMemo(
    () => (doctorsProp || []).filter((d) => d.active !== false),
    [doctorsProp]
  );
  const services = useMemo(
    () =>
      (servicesProp && servicesProp.length > 0 ? servicesProp : DEFAULT_SERVICES).filter(
        (s) => s.active !== false
      ),
    [servicesProp]
  );

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [sessionType, setSessionType] = useState<'in-person' | 'online'>('in-person');
  const [selectedDate, setSelectedDate] = useState<string>('1403/05/01');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('16:00');

  const [patientName, setPatientName] = useState('');

  const [patientPhone, setPatientPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const fallbackDoctor = doctors[0]?.id || '';
    const fallbackService = services[0]?.id || '';
    setSelectedDoctorId(
      preselectedDoctorId && doctors.some((d) => d.id === preselectedDoctorId)
        ? preselectedDoctorId
        : fallbackDoctor
    );
    setSelectedServiceId(
      preselectedServiceId && services.some((s) => s.id === preselectedServiceId)
        ? preselectedServiceId
        : fallbackService
    );
    setStep(1);
    setConfirmation(null);
  }, [isOpen, preselectedDoctorId, preselectedServiceId, doctors, services]);

  if (!isOpen) return null;

  if (bookingEnabled === false) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
        <div className="bg-white dark:bg-surface-dim w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Modal Header */}
          <div className="bg-primary text-white p-6 flex justify-between items-center">
            <div>
              <span className="text-xs bg-amber-400 text-slate-900 font-bold px-3 py-1 rounded-full inline-block">
                رزرو تلفنی و حضوری
              </span>
              <h3 className="text-xl font-bold mt-1.5">راه‌های ارتباطی جهت رزرو نوبت</h3>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
              aria-label="بستن"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 text-right space-y-5">
            {/* Top Notice */}
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-600 text-2xl shrink-0 mt-0.5">info</span>
              <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                <p className="font-bold text-sm mb-1">سامانه رزرو خودکار آنلاین در حال حاضر غیرفعال می‌باشد.</p>
                <p>جهت ثبت و هماهنگی نوبت مشاوره، لطفاً از طریق راه‌های زیر با پشتیبانی کلینیک ژینو تماس بگیرید:</p>
              </div>
            </div>

            {/* Contact Cards */}
            <div className="space-y-3">
              {/* Direct Phone Call */}
              <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl">call</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-on-surface">تماس تلفنی با کلینیک</div>
                    <div dir="ltr" className="text-xs font-black text-primary inline-flex items-center gap-1.5 pt-0.5">
                      {phone0?.number && <span>{phone0.number}</span>}
                      {phone0?.number && phone1?.number && <span>—</span>}
                      {phone1?.number && <span>{phone1.number}</span>}
                    </div>
                  </div>
                </div>
                {telHref && (
                <a
                  href={telHref}
                  className="bg-primary text-white text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 hover:bg-primary-container shadow-xs transition-all shrink-0"
                >
                  <span>تماس فوری</span>
                  <span className="material-symbols-outlined text-sm">phone_enabled</span>
                </a>
                )}
              </div>

              {/* WhatsApp */}
              {waHref && (
              <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl">chat</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-on-surface">چت و رزرو در واتس‌اپ</div>
                    <div className="text-xs text-on-surface-variant pt-0.5">ارسال پیام مستقیم به پشتیبانی</div>
                  </div>
                </div>
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 hover:bg-emerald-700 shadow-xs transition-all shrink-0"
                >
                  <span>ارسال پیام</span>
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </a>
              </div>
              )}

              {/* Address */}
              {addressText && (
              <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-xl">location_on</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-on-surface">آدرس مراجعه حضوری کلینیک</div>
                    <div className="text-xs text-on-surface-variant pt-1 leading-relaxed">
                      {addressText}
                    </div>
                  </div>
                </div>
                {onNavigate && (
                  <div className="pt-1 text-left">
                    <button
                      onClick={() => {
                        onClose();
                        onNavigate('contact');
                      }}
                      className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <span>مشاهده آدرس دقیق و نقشه در صفحه تماس با ما</span>
                      <span className="material-symbols-outlined text-sm">arrow_back</span>
                    </button>
                  </div>
                )}
              </div>
              )}

              {/* Working Hours */}
              <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/20 text-xs text-on-surface-variant flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="material-symbols-outlined text-sm text-primary">schedule</span>
                  <span>ساعات پاسخگویی:</span>
                </div>
                <span className="font-semibold text-on-surface">
                  شنبه تا چهارشنبه ۹ الی ۱۶ | حضوری و آنلاین
                </span>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-surface-container-low border-t border-outline-variant/30 text-center">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-surface border border-outline-variant/40 hover:bg-surface-container text-on-surface text-xs font-bold rounded-xl transition-all"
            >
              بستن
            </button>
          </div>
        </div>
      </div>
    );
  }

  const dates = [
    { label: 'شنبه ۱ مرداد', val: '1403/05/01' },
    { label: 'یکشنبه ۲ مرداد', val: '1403/05/02' },
    { label: 'دوشنبه ۳ مرداد', val: '1403/05/03' },
    { label: 'سه‌شنبه ۴ مرداد', val: '1403/05/04' },
    { label: 'چهارشنبه ۵ مرداد', val: '1403/05/05' },
  ];

  const timeSlots = ['۱۰:۰۰', '۱۱:۳۰', '۱۴:۰۰', '۱۶:۰۰', '۱۷:۳۰', '۱۹:۰۰'];

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId) || doctors[0];
  const selectedService = services.find((s) => s.id === selectedServiceId) || services[0];

  if (!selectedDoctor || !selectedService) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-surface-dim w-full max-w-md rounded-3xl shadow-2xl p-6 text-right space-y-4">
          <h3 className="text-lg font-black text-on-surface">رزرو نوبت در دسترس نیست</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            هنوز درمانگر یا خدمت فعالی در سیستم تعریف نشده است. لطفاً از بخش پرسنل و خدمات در پنل مدیریت
            موارد را فعال کنید.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-primary text-white font-bold py-2.5 rounded-xl"
          >
            بستن
          </button>
        </div>
      </div>
    );
  }

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor || !selectedService) {
      alert('لطفاً درمانگر و خدمت را انتخاب کنید.');
      return;
    }
    if (!patientName.trim() || !patientPhone.trim()) {
      alert('لطفاً نام و شماره همراه خود را وارد کنید.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const refCode = 'ZH-' + Math.floor(100000 + Math.random() * 900000);
      setConfirmation({
        bookingId: refCode,
        doctorName: selectedDoctor.name,
        serviceTitle: selectedService.title,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        sessionType: sessionType === 'in-person' ? 'حضوری در کلینیک' : 'آنلاین تصویری',
        patientName,
        patientPhone,
      });

      const newAppObj: Appointment = {
        id: 'app-' + Date.now(),
        bookingRef: refCode,
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        serviceId: selectedService.id,
        serviceTitle: selectedService.title,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        sessionType,
        status: 'pending',
        createdAt: new Date().toLocaleDateString('fa-IR'),
        notes: notes.trim() ? notes.trim() : '',
        fee: '۸۵۰,۰۰۰ تومان',
      };

      if (onAddAppointment) {
        onAddAppointment(newAppObj);
      }
      addAppointment(newAppObj).catch((err) => console.error('Error saving appointment:', err));

      setStep(4);
    }, 1200);
  };

  const handleReset = () => {
    setStep(1);
    setConfirmation(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white dark:bg-surface-dim w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-primary text-white p-6 flex justify-between items-center">
          <div>
            <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-medium">رزرو آنلاین نوبت</span>
            <h3 className="text-xl font-bold mt-1">کلینیک روانشناسی ژینو</h3>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
            aria-label="بستن"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-surface-container-low px-6 py-3 border-b border-outline-variant/30 flex justify-between items-center text-xs font-medium text-on-surface-variant">
          <span className={step >= 1 ? 'text-primary font-bold' : ''}>۱. خدمت & درمانگر</span>
          <span>←</span>
          <span className={step >= 2 ? 'text-primary font-bold' : ''}>۲. زمان جلسه</span>
          <span>←</span>
          <span className={step >= 3 ? 'text-primary font-bold' : ''}>۳. مشخصات مراجع</span>
          <span>←</span>
          <span className={step === 4 ? 'text-primary font-bold' : ''}>۴. تایید نهایی</span>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-right">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">نوع خدمت مورد نظر:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {services.map((serv) => (
                    <button
                      key={serv.id}
                      type="button"
                      onClick={() => setSelectedServiceId(serv.id)}
                      className={`p-3 rounded-xl border text-right transition-all flex items-center gap-3 ${
                        selectedServiceId === serv.id
                          ? 'border-primary bg-primary/5 text-primary font-bold shadow-sm'
                          : 'border-outline-variant/40 hover:border-primary/50 text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-primary">{serv.icon}</span>
                      <span className="text-sm">{serv.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">انتخاب درمانگر:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto p-1">
                  {doctors.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setSelectedDoctorId(doc.id)}
                      className={`p-3 rounded-xl border text-right transition-all flex items-center gap-3 ${
                        selectedDoctorId === doc.id
                          ? 'border-primary bg-primary/5 text-primary font-bold shadow-sm'
                          : 'border-outline-variant/40 hover:border-primary/50 text-on-surface'
                      }`}
                    >
                      <img
                        src={doc.avatar}
                        alt={doc.name}
                        className="w-11 h-11 rounded-full object-cover border"
                      />
                      <div className="truncate">
                        <div className="text-sm font-bold truncate">{doc.name}</div>
                        <div className="text-xs text-on-surface-variant truncate">{doc.title}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">نوع برگزاری جلسه:</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setSessionType('in-person')}
                    className={`flex-1 py-3 px-4 rounded-xl border text-center font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                      sessionType === 'in-person'
                        ? 'bg-secondary text-white border-secondary shadow-md'
                        : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    <span className="material-symbols-outlined">apartment</span>
                    حضوری در کلینیک (ونك)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSessionType('online')}
                    className={`flex-1 py-3 px-4 rounded-xl border text-center font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                      sessionType === 'online'
                        ? 'bg-tertiary text-white border-tertiary shadow-md'
                        : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    <span className="material-symbols-outlined">videocam</span>
                    مشاوره آنلاین تصویری
                  </button>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="bg-primary text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:bg-primary-container transition-all flex items-center gap-2"
                >
                  مرحله بعد: انتخاب زمان
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-surface-container-low p-4 rounded-2xl flex items-center gap-4">
                <img
                  src={selectedDoctor.avatar}
                  alt={selectedDoctor.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-primary"
                />
                <div>
                  <h4 className="font-bold text-on-surface">{selectedDoctor.name}</h4>
                  <p className="text-xs text-primary font-medium">{selectedDoctor.title}</p>
                  <p className="text-xs text-on-surface-variant">خدمت: {selectedService.title}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">انتخاب تاریخ جلسه:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {dates.map((d) => (
                    <button
                      key={d.val}
                      type="button"
                      onClick={() => setSelectedDate(d.val)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        selectedDate === d.val
                          ? 'border-primary bg-primary text-white font-bold shadow-md'
                          : 'border-outline-variant text-on-surface hover:border-primary/50'
                      }`}
                    >
                      <span className="text-xs block opacity-80">روز</span>
                      <span className="text-sm">{d.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">انتخاب ساعت جلسه:</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={`p-2 rounded-xl border text-center text-sm font-medium transition-all ${
                        selectedTimeSlot === slot
                          ? 'border-secondary bg-secondary text-white font-bold shadow-sm'
                          : 'border-outline-variant text-on-surface hover:border-secondary'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="border border-outline-variant text-on-surface-variant px-6 py-3 rounded-xl hover:bg-surface-container font-medium"
                >
                  بازگشت
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="bg-primary text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:bg-primary-container transition-all flex items-center gap-2"
                >
                  مرحله بعد: ورود مشخصات
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleBook} className="space-y-4">
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl text-xs space-y-1 text-on-surface-variant">
                <div className="font-bold text-primary text-sm mb-1">خلاصه پیش‌فاکتور نوبت:</div>
                <div>درمانگر: <span className="font-bold text-on-surface">{selectedDoctor.name}</span></div>
                <div>خدمت: <span className="font-bold text-on-surface">{selectedService.title}</span></div>
                <div>زمان: <span className="font-bold text-on-surface">{selectedDate} - ساعت {selectedTimeSlot}</span> ({sessionType === 'in-person' ? 'حضوری' : 'آنلاین'})</div>
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-1">نام و نام خانوادگی مراجع *</label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="مثال: مریم محمدی"
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-1">شماره تلفن همراه *</label>
                <input
                  type="tel"
                  required
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="۰۹۱۲۱۲۳۴۵۶۷"
                  dir="ltr"
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm text-left focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-1">توضیحات یا موضوع اصلی مشاوره (اختیاری)</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="خلاصه‌ای از علت مراجعه یا توضیحات خاص..."
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                ></textarea>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="border border-outline-variant text-on-surface-variant px-6 py-3 rounded-xl hover:bg-surface-container font-medium"
                >
                  بازگشت
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary text-white font-bold px-8 py-3.5 rounded-xl shadow-xl hover:bg-primary-container transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>در حال ثبت نوبت...</span>
                  ) : (
                    <>
                      <span>تایید و ثبت نهایی نوبت</span>
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 4 && confirmation && (
            <div className="text-center py-6 space-y-6">
              <div className="w-20 h-20 bg-secondary-container text-secondary rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
                <span className="material-symbols-outlined text-5xl">task_alt</span>
              </div>

              <h3 className="text-2xl font-bold text-secondary">نوبت شما با موفقیت ثبت شد!</h3>

              <div className="bg-surface-container-low p-6 rounded-2xl text-right space-y-3 max-w-md mx-auto border border-secondary/20 shadow-sm">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-xs text-on-surface-variant">کد پیگیری نوبت:</span>
                  <span className="font-extrabold text-primary text-lg" dir="ltr">{confirmation.bookingId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">درمانگر:</span>
                  <span className="font-bold">{confirmation.doctorName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">خدمت:</span>
                  <span className="font-bold">{confirmation.serviceTitle}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">زمان حضور:</span>
                  <span className="font-bold">{confirmation.date} ساعت {confirmation.timeSlot}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">نوع جلسه:</span>
                  <span className="font-bold text-secondary">{confirmation.sessionType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">نام مراجع:</span>
                  <span className="font-bold">{confirmation.patientName}</span>
                </div>
              </div>

              <p className="text-xs text-on-surface-variant max-w-sm mx-auto leading-relaxed">
                پیامک تایید حاوی لینک نقشه کلینیک و جزئیات پرداخت به شماره <span dir="ltr" className="font-bold text-on-surface">{confirmation.patientPhone}</span> ارسال گردید.
              </p>

              <button
                type="button"
                onClick={handleReset}
                className="bg-primary text-white font-bold px-10 py-3 rounded-full shadow-lg hover:bg-primary-container transition-transform active:scale-95"
              >
                متوجه شدم / بستن
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
