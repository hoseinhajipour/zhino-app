import React, { useState } from 'react';
import { MAIN_SERVICES } from '../data/clinicData';
import { PageScreen } from '../types';
import { useAppNavigation } from '../context/AppContext';
import { SITE_CONTAINER_CLASS } from '../lib/contentWidth';

interface ServicesPageProps {
  onNavigate?: (screen: PageScreen) => void;
  onOpenBooking?: (doctorId?: string, serviceId?: string) => void;
  onSelectService?: (serviceId: string) => void;
  bookingEnabled?: boolean;
}

export const ServicesPage: React.FC<ServicesPageProps> = (props) => {
  const {
    navigateTo: onNavigate,
    openBooking: onOpenBooking,
    selectService: onSelectService,
    bookingEnabled,
  } = useAppNavigation(props);
  const [filter, setFilter] = useState<'all' | 'individual' | 'family' | 'assessment'>('all');

  const filteredServices = MAIN_SERVICES.filter((s) => {
    if (filter === 'individual') return s.id.includes('adult') || s.id.includes('coaching');
    if (filter === 'family') return s.id.includes('couples') || s.id.includes('child') || s.id.includes('family');
    if (filter === 'assessment') return s.id.includes('assessment') || s.id.includes('academic');
    return true;
  });

  return (
    <div className={`space-y-16 pb-16 text-right ${SITE_CONTAINER_CLASS}`}>
      {/* Hero Banner */}
      <section className="bg-surface-container-low p-8 md:p-12 rounded-[36px] border border-outline-variant/30 text-center space-y-4">
        <span className="bg-primary/10 text-primary text-xs font-bold px-4 py-1.5 rounded-full inline-block">
          خدمات جامع روانشناختی ژینو
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-primary">
          خدمات تخصصی مشاوره و روان‌درمانی
        </h1>
        <p className="text-base text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
          ارائه راهکارهای کاملاً تخصصی متناسب با نیازهای منحصربه‌فرد شما و خانواده‌تان. تمامی خدمات با بالاترین استانداردهای علمی برگزار می‌گردد.
        </p>

        {/* Filter Pills */}
        <div className="flex flex-wrap justify-center gap-2 pt-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            همه خدمات ({MAIN_SERVICES.length})
          </button>
          <button
            onClick={() => setFilter('individual')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
              filter === 'individual'
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            فردی و توسعه شخصیتی
          </button>
          <button
            onClick={() => setFilter('family')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
              filter === 'family'
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            کودک، خانواده و ازدواج
          </button>
          <button
            onClick={() => setFilter('assessment')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
              filter === 'assessment'
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            تست‌ها و ارزیابی تحصیلی
          </button>
        </div>
      </section>

      {/* Services Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((serv) => (
          <div
            key={serv.id}
            className="bg-white dark:bg-surface-dim rounded-3xl p-7 shadow-soft border border-outline-variant/30 flex flex-col justify-between hover:shadow-xl transition-all group"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-3xl">{serv.icon}</span>
                </div>
                {serv.badge && (
                  <span className="text-xs bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-bold">
                    {serv.badge}
                  </span>
                )}
              </div>

              <h3 className="text-2xl font-bold text-on-surface group-hover:text-primary transition-colors">
                {serv.title}
              </h3>

              <p className="text-sm text-on-surface-variant leading-relaxed">
                {serv.description}
              </p>

              {(serv.duration || serv.format) && (
                <div className="flex flex-wrap gap-2 text-xs text-on-surface-variant pt-2">
                  {serv.duration && (
                    <span className="bg-surface-container px-2.5 py-1 rounded-md flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {serv.duration}
                    </span>
                  )}
                  {serv.format && (
                    <span className="bg-surface-container px-2.5 py-1 rounded-md flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">tune</span>
                      {serv.format}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="pt-6 mt-6 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => onSelectService(serv.id)}
                className="text-xs font-extrabold text-primary flex items-center gap-1 hover:underline group-hover:translate-x-0.5 transition-all"
              >
                <span>مشاهده لندینگ اختصاصی</span>
                <span className="material-symbols-outlined text-sm">arrow_back</span>
              </button>

              {bookingEnabled && (
                <button
                  onClick={() => onOpenBooking(undefined, serv.id)}
                  className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl shadow hover:bg-primary-container transition-colors"
                >
                  ثبت نوبت
                </button>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Featured Service Spotlight: Personal Development & Coaching */}
      <section className="bg-tertiary-fixed text-on-tertiary-fixed p-8 md:p-12 rounded-[36px] shadow-lg flex flex-col md:flex-row items-center gap-8">
        <div className="w-full md:w-1/3 text-center">
          <div className="w-24 h-24 bg-white/40 backdrop-blur rounded-3xl flex items-center justify-center mx-auto text-tertiary mb-4 shadow-sm">
            <span className="material-symbols-outlined text-5xl">workspace_premium</span>
          </div>
          <span className="bg-tertiary/20 text-tertiary text-xs font-bold px-3 py-1 rounded-full">
            برنامه ویژه کوچینگ
          </span>
        </div>

        <div className="w-full md:w-2/3 space-y-4">
          <h3 className="text-2xl font-bold text-on-tertiary-fixed">
            دوره تخصصی توسعه فردی و مدیریت استرس کاری
          </h3>
          <p className="text-sm leading-relaxed opacity-90">
            شامل ۵ جلسه اختصاصی به همراه ارزیابی‌های تیپ شخصیتی MBTI و NEO، برنامه‌ریزی اهداف، رفع موانع ذهنی و بهبود عزت‌نفس تحت نظر ارشدترین کوچ‌های کلینیک.
          </p>
          {bookingEnabled && (
            <div className="pt-2">
              <button
                onClick={onOpenBooking}
                className="bg-tertiary text-white font-bold px-8 py-3 rounded-xl shadow hover:bg-tertiary/90 transition-all text-sm flex items-center gap-2"
              >
                <span>رزرو جلسه معارفه و ارزیابی اولیه</span>
                <span className="material-symbols-outlined text-sm">calendar_month</span>
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
