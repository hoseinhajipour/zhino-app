import React, { useState } from 'react';
import { DOCTORS, FAQS_CHILD, PLAY_THERAPY_GALLERY } from '../data/clinicData';
import { PageScreen } from '../types';
import { useAppNavigation } from '../context/AppContext';

interface ChildTherapyPageProps {
  onNavigate?: (screen: PageScreen) => void;
  onOpenBooking?: () => void;
  onOpenDoctorModal?: (doctorId: string) => void;
  bookingEnabled?: boolean;
}

export const ChildTherapyPage: React.FC<ChildTherapyPageProps> = (props) => {
  const {
    navigateTo: onNavigate,
    openBooking: onOpenBooking,
    openDoctorProfile: onOpenDoctorModal,
    bookingEnabled,
  } = useAppNavigation(props);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [openFaqId, setOpenFaqId] = useState<string | null>(FAQS_CHILD[0].id);

  const childDoctors = DOCTORS.filter((d) => d.specialties.includes('child'));

  return (
    <div className="space-y-20 pb-16 text-right max-w-[1200px] mx-auto px-4 md:px-6">
      {/* Hero Section */}
      <section className="bg-primary-fixed/40 p-8 md:p-12 rounded-[40px] border border-primary/20 grid grid-cols-1 md:grid-cols-2 items-center gap-10">
        <div className="space-y-5">
          <span className="bg-primary-fixed text-on-primary-fixed text-xs font-bold px-4 py-1.5 rounded-full inline-block">
            دپارتمان تخصصی کودک و نوجوان
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-primary leading-tight">
            دنیای رنگارنگ کودکان، نیاز به شنیدن آگاهانه دارد.
          </h1>
          <p className="text-base text-on-surface-variant leading-relaxed">
            ما در کلینیک ژینو با استفاده از زبان طبیعی کودکان (بازی و هنر) به ارزیابی، تشخیص و درمان چالش‌های رفتاری، هیجانی و ارتباطی آن‌ها می‌پردازیم.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={onOpenBooking}
              className="bg-primary text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg hover:bg-primary-container transition-all flex items-center gap-2"
            >
              <span>{bookingEnabled ? 'رزرو نوبت بازی‌درمانی' : 'رزرو بازی‌درمانی (تلفنی/حضوری)'}</span>
              <span className="material-symbols-outlined text-sm">child_care</span>
            </button>
            <button
              onClick={() => {
                const galleryEl = document.getElementById('playroom-gallery');
                galleryEl?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="border border-primary text-primary font-bold px-6 py-3.5 rounded-2xl hover:bg-primary/5 transition-all text-sm"
            >
              مشاهده فضای اتاق بازی
            </button>
          </div>
        </div>

        <div className="rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] border-4 border-white">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuB9rBmsGg_lPt9kT2RG-tT3hEPePVC-Qua4ywKwEY-OmE7gZN779Yk7xUc1yA7mdrPdZuJW4YQwwfYHlKVCI2qvTlwkQi5cscdAnGBZb68mRM8mozFfK50jaZXRA_3jUT-8ciWU9NS5EBeWA-XAR_WOrgrmckoeButipQGIf4L6yqqrNnRhRDnW9qolF9LIFUD9HFKPQzF3wuxOYqTAYXqNS3ldHSMMc2tLMLL_Qi-eCL_sjXPwQPvWUD1KGeQtWcSVZovWpA4NxoY"
            alt="مشاوره و بازی درمانی کودک"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Bento Grid Approach */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-primary">خدمات تخصصی کودک و نوجوان</h2>
          <p className="text-sm text-on-surface-variant">رویکردهای ۴گانه دپارتمان برای حمایت همه‌جانبه از رشد فرزند شما</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-outline-variant/30 shadow-soft space-y-3">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">sports_esports</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface">بازی‌درمانی (Play Therapy)</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              درمان غیرکلامی اضطراب، ترس، پرخاشگری و اضطراب جدایی در محیط مجهز بازی.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-outline-variant/30 shadow-soft space-y-3">
            <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">diversity_3</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface">مشاوره و راهنمایی والدین</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              آموزش اصول فرزندپروری مثبت، مدیریت رفتارهای ناسازگار و تقویت دلبستگی ایمن.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-outline-variant/30 shadow-soft space-y-3">
            <div className="w-12 h-12 bg-tertiary/10 text-tertiary rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">face_5</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface">مشاوره تخصصی نوجوان</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              مدیریت بحران‌های دوره بلوغ، بحران هویت، استرس کنکور و مهارت‌های ارتباطی.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-outline-variant/30 shadow-soft space-y-3">
            <div className="w-12 h-12 bg-primary-fixed text-on-primary-fixed rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">assignment</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface">تست‌های تشخیصی و هوش</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              سنجش هوش (وکسلر)، تشخیص ADHD، عدم تمرکز و بررسی اختلالات یادگیری.
            </p>
          </div>
        </div>
      </section>

      {/* Play Therapy Room Gallery */}
      <section id="playroom-gallery" className="bg-surface-container-low p-8 md:p-12 rounded-[40px] border border-outline-variant/30 space-y-8">
        <div className="text-center space-y-2">
          <span className="bg-secondary-container text-on-secondary-container text-xs font-bold px-3 py-1 rounded-full">
            تجهیزات استاندارد جهانی
          </span>
          <h2 className="text-3xl font-extrabold text-secondary">اتاق بازی ما؛ جایی برای تولد دوباره</h2>
          <p className="text-sm text-on-surface-variant max-w-xl mx-auto">
            امکانات و فضاهای استاندارد طراحی‌شده طبق پروتکل‌های بین‌المللی روانشناسی کودک
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <div className="lg:col-span-2 rounded-3xl overflow-hidden shadow-xl aspect-video relative bg-white">
            <img
              src={PLAY_THERAPY_GALLERY[activeGalleryIndex].url}
              alt={PLAY_THERAPY_GALLERY[activeGalleryIndex].title}
              className="w-full h-full object-cover transition-all duration-500"
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 text-white">
              <h4 className="text-xl font-bold">{PLAY_THERAPY_GALLERY[activeGalleryIndex].title}</h4>
              <p className="text-xs opacity-90 mt-1">{PLAY_THERAPY_GALLERY[activeGalleryIndex].desc}</p>
            </div>
          </div>

          <div className="space-y-3">
            {PLAY_THERAPY_GALLERY.map((item, idx) => (
              <button
                key={item.title}
                onClick={() => setActiveGalleryIndex(idx)}
                className={`w-full text-right p-4 rounded-2xl border transition-all flex items-center gap-4 ${
                  activeGalleryIndex === idx
                    ? 'bg-secondary text-white border-secondary font-bold shadow-md'
                    : 'bg-white text-on-surface border-outline-variant/30 hover:border-secondary/50'
                }`}
              >
                <img
                  src={item.url}
                  alt={item.title}
                  className="w-12 h-12 rounded-xl object-cover shrink-0 border"
                />
                <div className="truncate">
                  <div className="text-sm font-bold truncate">{item.title}</div>
                  <div className={`text-xs truncate ${activeGalleryIndex === idx ? 'opacity-80' : 'text-on-surface-variant'}`}>
                    کلیک برای نمایش
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Child Specialists */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-primary">روانشناسان دپارتمان کودک و نوجوان</h2>
          <p className="text-sm text-on-surface-variant">متخصصان با سابقه در درمان اختلالات رفتاری و بازی‌درمانی</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {childDoctors.map((doc) => (
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

      {/* Parent FAQ Accordion */}
      <section className="bg-white dark:bg-surface-dim p-8 md:p-12 rounded-[40px] border border-outline-variant/30 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-primary">پرسش‌های متداول والدین</h2>
          <p className="text-sm text-on-surface-variant">پاسخ به ابهامات رایج درباره فرآیند مشاوره و بازی‌درمانی کودکان</p>
        </div>

        <div className="space-y-4 max-w-3xl mx-auto pt-4">
          {FAQS_CHILD.map((faq) => {
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
