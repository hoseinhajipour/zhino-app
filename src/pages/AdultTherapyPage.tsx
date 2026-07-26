import React, { useState } from 'react';
import { DOCTORS, FAQS_ADULT } from '../data/clinicData';
import { PageScreen } from '../types';
import { useAppNavigation } from '../context/AppContext';
import { SITE_CONTAINER_CLASS } from '../lib/contentWidth';

interface AdultTherapyPageProps {
  onNavigate?: (screen: PageScreen) => void;
  onOpenBooking?: () => void;
  onOpenDoctorModal?: (doctorId: string) => void;
  bookingEnabled?: boolean;
}

export const AdultTherapyPage: React.FC<AdultTherapyPageProps> = (props) => {
  const {
    navigateTo: onNavigate,
    openBooking: onOpenBooking,
    openDoctorProfile: onOpenDoctorModal,
    bookingEnabled,
  } = useAppNavigation(props);
  const [openFaqId, setOpenFaqId] = useState<string | null>(FAQS_ADULT[0].id);

  const adultDoctors = DOCTORS.filter(
    (d) => d.specialties.includes('individual') || d.specialties.includes('cbt')
  );

  return (
    <div className={`space-y-20 pb-16 text-right ${SITE_CONTAINER_CLASS}`}>
      {/* Hero Section */}
      <section className="bg-surface-container-low p-8 md:p-12 rounded-[40px] border border-outline-variant/30 grid grid-cols-1 md:grid-cols-2 items-center gap-10">
        <div className="space-y-5">
          <span className="bg-primary/10 text-primary text-xs font-bold px-4 py-1.5 rounded-full inline-block">
            دپارتمان تخصصی مشاوره فردی بزرگسال
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-primary leading-tight">
            مسیر رهایی از اضطراب و دستیابی به آرامش درونی
          </h1>
          <p className="text-base text-on-surface-variant leading-relaxed">
            زندگی مدرن و فشارهای روزمره ممکن است روان ما را تحت تاثیر قرار دهد. جلسات مشاوره فردی فرصتی امن برای خودشناسی، درمان ریشه‌ای چالش‌ها و بهبود کیفیت زندگی است.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={onOpenBooking}
              className="bg-primary text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg hover:bg-primary-container transition-all flex items-center gap-2"
            >
              <span>{bookingEnabled ? 'رزرو جلسه مشاوره فردی' : 'رزرو مشاوره فردی (تلفنی/حضوری)'}</span>
              <span className="material-symbols-outlined text-sm">calendar_month</span>
            </button>
            <button
              onClick={() => onNavigate('team')}
              className="border border-outline-variant text-on-surface font-bold px-6 py-3.5 rounded-2xl hover:bg-surface-container transition-all text-sm"
            >
              انتخاب درمانگر فردی
            </button>
          </div>
        </div>

        <div className="rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] border-4 border-white">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDe1dXMDn_23JKLDcC4xG7u5z2K-9e7BHx1iv3F0_ob1YhOh2KRT6i-PXvtaDylIthNtv8Db9wWCPhT7yLE3Qv7RQFmwmf2PV-4Wb1KHsNII3cQDWJQy9EKs5e3buxSGu0u4SG6cru9e84OwKkH4A34wIgkAbsI38hfbv3_fr4-k1sQ2ImRGPfgAchK-Wp3P2Ram9pJGlY_Po_lnTaAJQqrRdQeb4mTwMc_f5WTBskLWmXrJFooydAWM6t7rbksIk12MZrah430t5s"
            alt="جلسه مشاوره فردی بزرگسال"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* When do we need therapy? */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-primary">چه زمانی مراجعه به مشاوره فردی مفید است؟</h2>
          <p className="text-sm text-on-surface-variant">محورهای اصلی خدمات مشاوره فردی در کلینیک ژینو</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-7 rounded-3xl border border-outline-variant/30 shadow-soft space-y-3">
            <span className="material-symbols-outlined text-primary text-4xl">psychology</span>
            <h3 className="text-xl font-bold text-on-surface">درمان اضطراب و استرس مزمن</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              مدیریت افکار مزاحم، حملات پانیک، نگرانی‌های آینده و ایجاد تمرکز و آرامش ذهن.
            </p>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-outline-variant/30 shadow-soft space-y-3">
            <span className="material-symbols-outlined text-primary text-4xl">sentiment_dissatisfied</span>
            <h3 className="text-xl font-bold text-on-surface">افسردگی و افت انگیزه</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              بازگرداندن نشاط زندگی، رهایی از بی‌پناهی، بهبود کیفیت خواب و تنظیم هیجانات.
            </p>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-outline-variant/30 shadow-soft space-y-3">
            <span className="material-symbols-outlined text-primary text-4xl">published_with_changes</span>
            <h3 className="text-xl font-bold text-on-surface">درمان وسواس فکری و عملی (OCD)</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              پروتکل تخصصی مواجهه و جلوگیری از پاسخ (ERP) جهت کاهش رفتارهای وسواسی.
            </p>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-outline-variant/30 shadow-soft space-y-3">
            <span className="material-symbols-outlined text-primary text-4xl">heart_broken</span>
            <h3 className="text-xl font-bold text-on-surface">درمان سوگ و شکست‌های عاطفی</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              گذر سالم از فرآیند سوگوارانه، پذیرش فقدان و بازسازی مجدد عزت‌نفس.
            </p>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-outline-variant/30 shadow-soft space-y-3">
            <span className="material-symbols-outlined text-primary text-4xl">diversity_1</span>
            <h3 className="text-xl font-bold text-on-surface">ارتقای عزت‌نفس و خودشناسی</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              شناخت الگوهای نادرست ارتباطی، غلبه بر احساس گناه و جرات‌ورزی در نه گفتن.
            </p>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-outline-variant/30 shadow-soft space-y-3">
            <span className="material-symbols-outlined text-primary text-4xl">moving</span>
            <h3 className="text-xl font-bold text-on-surface">تغییرات بزرگ و بحران‌های زندگی</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              سازگاری با شغل جدید، مهاجرت، طلاق و تصمیم‌گیری‌های حساس حیاتی.
            </p>
          </div>
        </div>
      </section>

      {/* Therapeutic Approaches */}
      <section className="bg-surface-container p-8 md:p-12 rounded-[40px] space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-on-surface">رویکردهای درمانی استاندارد ما</h2>
          <p className="text-sm text-on-surface-variant">انتخاب رویکرد متناسب با شخصیت و نیاز دقیق هر مراجع</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-outline-variant/30 space-y-2">
            <span className="bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded-full text-xs font-bold inline-block">
              CBT
            </span>
            <h3 className="text-lg font-bold text-on-surface">شناختی رفتاری</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              شناسایی و بازسازی خطاهای شناختی و تغییر الگوهای رفتاری ناکارآمد در کوتاه‌مدت.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-outline-variant/30 space-y-2">
            <span className="bg-secondary-fixed text-on-secondary-fixed px-3 py-1 rounded-full text-xs font-bold inline-block">
              ACT
            </span>
            <h3 className="text-lg font-bold text-on-surface">درمان مبتنی بر پذیرش و تعهد</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              افزایش انعطاف‌پذیری روانشناختی، پذیرش احساسات ناخوشایند و اقدام در جهت ارزش‌ها.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-outline-variant/30 space-y-2">
            <span className="bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1 rounded-full text-xs font-bold inline-block">
              طرحواره درمانی
            </span>
            <h3 className="text-lg font-bold text-on-surface">طرحواره‌درمانی عمیق</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              کشف و درمان تله‌های روانی ریشه‌دار از دوران کودکی که روابط عاطفی را تهدید می‌کنند.
            </p>
          </div>
        </div>
      </section>

      {/* Therapists */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-primary">درمانگران دپارتمان فردی</h2>
          <p className="text-sm text-on-surface-variant">جهت شروع فرآیند درمان با متخصصین ما آشنا شوید</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {adultDoctors.slice(0, 6).map((doc) => (
            <div
              key={doc.id}
              className="bg-white dark:bg-surface-dim rounded-3xl overflow-hidden shadow-soft border border-outline-variant/30 p-6 space-y-4"
            >
              <div className="flex items-center gap-4">
                <img
                  src={doc.avatar}
                  alt={doc.name}
                  className="w-20 h-20 rounded-2xl object-cover shadow border"
                />
                <div>
                  <h3 className="font-bold text-lg text-on-surface">{doc.name}</h3>
                  <p className="text-xs text-primary font-bold">{doc.title}</p>
                  <p className="text-xs text-on-surface-variant mt-1">{doc.degree}</p>
                </div>
              </div>

              <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3 bg-surface-container-low p-3 rounded-xl">
                {doc.bio}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => onOpenDoctorModal(doc.id)}
                  className="flex-1 py-2.5 rounded-xl border border-primary text-primary font-bold text-xs hover:bg-primary/5"
                >
                  پروفایل
                </button>
                {bookingEnabled && (
                  <button
                    onClick={onOpenBooking}
                    className="flex-1 bg-primary text-white font-bold text-xs py-2.5 rounded-xl hover:bg-primary-container shadow"
                  >
                    رزرو نوبت
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Adult FAQ Accordion */}
      <section className="bg-white dark:bg-surface-dim p-8 md:p-12 rounded-[40px] border border-outline-variant/30 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-primary">سوالات متداول مشاوره فردی</h2>
          <p className="text-sm text-on-surface-variant">پاسخ شفاف به دغدغه‌های مراجعین جدید</p>
        </div>

        <div className="space-y-4 max-w-3xl mx-auto pt-4">
          {FAQS_ADULT.map((faq) => {
            const isOpen = openFaqId === faq.id;
            return (
              <div
                key={faq.id}
                className="border border-outline-variant/40 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                  className="w-full text-right p-5 bg-surface-container-low hover:bg-surface-container font-bold text-sm text-on-surface flex justify-between items-center gap-4"
                >
                  <span>{faq.question}</span>
                  <span className="material-symbols-outlined text-primary text-xl">
                    {isOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
                {isOpen && (
                  <div className="p-5 bg-white dark:bg-surface-dim text-xs text-on-surface-variant leading-relaxed border-t border-outline-variant/20">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
