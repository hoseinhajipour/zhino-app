import React, { useState } from 'react';
import { DOCTORS, FAQS_MARRIAGE } from '../data/clinicData';
import { PageScreen } from '../types';
import { useAppNavigation } from '../context/AppContext';

interface MarriageTherapyPageProps {
  onNavigate?: (screen: PageScreen) => void;
  onOpenBooking?: () => void;
  onOpenDoctorModal?: (doctorId: string) => void;
  bookingEnabled?: boolean;
}

export const MarriageTherapyPage: React.FC<MarriageTherapyPageProps> = (props) => {
  const {
    navigateTo: onNavigate,
    openBooking: onOpenBooking,
    openDoctorProfile: onOpenDoctorModal,
    bookingEnabled,
  } = useAppNavigation(props);
  const [openFaqId, setOpenFaqId] = useState<string | null>(FAQS_MARRIAGE[0].id);

  const familyDoctors = DOCTORS.filter((d) => d.specialties.includes('family'));

  return (
    <div className="space-y-20 pb-16 text-right max-w-[1200px] mx-auto px-4 md:px-6">
      {/* Hero Section */}
      <section className="bg-secondary-container/20 p-8 md:p-12 rounded-[40px] border border-secondary/20 grid grid-cols-1 md:grid-cols-2 items-center gap-10">
        <div className="space-y-5">
          <span className="bg-secondary-container text-on-secondary-container text-xs font-bold px-4 py-1.5 rounded-full inline-block">
            دپارتمان تخصصی ازدواج و خانواده
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-secondary leading-tight">
            پیوندتان را با عشق و آگاهی مستحکم کنید.
          </h1>
          <p className="text-base text-on-surface-variant leading-relaxed">
            ازدواج موفق اتفاقی نیست، بلکه متکی بر آگاهی، شناخت عمیق سنخیت‌های شخصیتی و یادگیری مهارت‌های ارتباطی است. ما در این مسیر گام به گام همراه شما هستیم.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={onOpenBooking}
              className="bg-secondary text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg hover:bg-secondary/90 transition-all flex items-center gap-2"
            >
              <span>{bookingEnabled ? 'رزرو جلسه زوج‌درمانی / ازدواج' : 'رزرو زوج‌درمانی (تلفنی/حضوری)'}</span>
              <span className="material-symbols-outlined text-sm">favorite</span>
            </button>
            <button
              onClick={() => onNavigate('team')}
              className="border border-secondary text-secondary font-bold px-6 py-3.5 rounded-2xl hover:bg-secondary/10 transition-all text-sm"
            >
              مشاهده مشاوران زناشویی
            </button>
          </div>
        </div>

        <div className="rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] border-4 border-white">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeSLgnKpImcpOx-GjmdRz2jCdvrXg6C6uHwVHr4M_Ou_BFEaJZX5Gwe5l20NVDRIXkXKXZpMigdwIEZN0gOgr5afflN1SUkWS89CUBs3BkGq1U56b7gWlcn6j2Z5hK97D84ix0u2m-rPBD6rDEAn4M7qTn7DfoqpluLJyEJ7xZV75b53RPCHOKzoQOYqS8XiPWkR_OLqqjJKsDM5ko7z5lo3OE4NsDZ4KZsxeFDqOjdbAN3MaPjgryoF3pPubvy6xqyD2bKNCvSEk"
            alt="مشاوره پیش از ازدواج و زوج درمانی"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* 3 Pillars */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-secondary">ارکان اصلی خدمات خانواده و ازدواج</h2>
          <p className="text-sm text-on-surface-variant">سه محور کلیدی برای تضمین سلامت و پایداری روابط عاطفی</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-7 rounded-3xl border border-outline-variant/30 shadow-soft space-y-3">
            <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">chat</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface">ارتباط موثر و شفاف</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              آموزش تکنیک‌های گوش دادن فعال، ابراز همدردی و انتقال محترمانه نیازها بدون ایجاد گارد و سوءتفاهم.
            </p>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-outline-variant/30 shadow-soft space-y-3">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">handshake</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface">حل تعارضات و اختلافات</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              مدیریت خشم، عبور از بحران خیانت یا سردی عاطفی و تبدیل اختلافات به فرصتی برای صمیمیت بیشتر.
            </p>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-outline-variant/30 shadow-soft space-y-3">
            <div className="w-12 h-12 bg-tertiary/10 text-tertiary rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">verified_user</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface">پیشگیری آگاهانه پیش از ازدواج</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              ارزیابی سنخیت‌های شخصیتی، خط قرمزها، بررسی ارزش‌ها و آمادگی روانی طرفین با تست‌های استاندارد.
            </p>
          </div>
        </div>
      </section>

      {/* Process Bento Grid */}
      <section className="bg-surface-container p-8 md:p-12 rounded-[40px] space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-on-surface">مراحل فرآیند زوج‌درمانی در ژینو</h2>
          <p className="text-sm text-on-surface-variant">نقشه راه گام به گام از اولین جلسه تا تثبیت تغییرات</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-outline-variant/30 space-y-2">
            <span className="text-xs font-bold bg-secondary/10 text-secondary px-3 py-1 rounded-full">گام اول</span>
            <h3 className="text-base font-bold text-on-surface">ارزیابی اولیه‌ و تست‌ها</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              اجرای آزمون‌های زوجین و تحلیل اولیه الگوهای تعاملی.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-outline-variant/30 space-y-2">
            <span className="text-xs font-bold bg-secondary/10 text-secondary px-3 py-1 rounded-full">گام دوم</span>
            <h3 className="text-base font-bold text-on-surface">کشف تله‌ها و ریشه‌ها</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              شناسایی طرحواره‌ها و سبک‌های دلبستگی که روابط را کدر می‌کنند.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-outline-variant/30 space-y-2">
            <span className="text-xs font-bold bg-secondary/10 text-secondary px-3 py-1 rounded-full">گام سوم</span>
            <h3 className="text-base font-bold text-on-surface">تمرین‌های عملی ارتباطی</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              تمرین گفتگو بر اساس پروتکل گاتمن و بهبود صمیمیت در خانه.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-outline-variant/30 space-y-2">
            <span className="text-xs font-bold bg-secondary/10 text-secondary px-3 py-1 rounded-full">گام چهارم</span>
            <h3 className="text-base font-bold text-on-surface">تثبیت و پایش دوره‌ای</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              ارزیابی پایدار شدن تغییرات و جلسات فالوآپ ۶ ماهه.
            </p>
          </div>
        </div>
      </section>

      {/* Marriage Therapists */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-secondary">متخصصین دپارتمان ازدواج و خانواده</h2>
          <p className="text-sm text-on-surface-variant">درمانگران مجرب زوج‌درمانی و مشاوره پیش از ازدواج</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {familyDoctors.map((doc) => (
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
                  <p className="text-xs text-secondary font-bold">{doc.title}</p>
                  <p className="text-xs text-on-surface-variant mt-1">{doc.degree}</p>
                </div>
              </div>

              <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3 bg-surface-container-low p-3 rounded-xl">
                {doc.bio}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => onOpenDoctorModal(doc.id)}
                  className="flex-1 py-2.5 rounded-xl border border-secondary text-secondary font-bold text-xs hover:bg-secondary/5"
                >
                  پروفایل
                </button>
                {bookingEnabled && (
                  <button
                    onClick={onOpenBooking}
                    className="flex-1 bg-secondary text-white font-bold text-xs py-2.5 rounded-xl hover:bg-secondary/90 shadow"
                  >
                    رزرو نوبت
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Marriage FAQ Accordion */}
      <section className="bg-white dark:bg-surface-dim p-8 md:p-12 rounded-[40px] border border-outline-variant/30 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-secondary">سوالات متداول مشاوره ازدواج و زوجین</h2>
          <p className="text-sm text-on-surface-variant">پاسخ تخصصی به پرسش‌های شما درباره زوج‌درمانی</p>
        </div>

        <div className="space-y-4 max-w-3xl mx-auto pt-4">
          {FAQS_MARRIAGE.map((faq) => {
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
                  <span className="material-symbols-outlined text-secondary text-xl">
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
