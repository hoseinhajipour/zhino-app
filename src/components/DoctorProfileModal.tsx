import React from 'react';
import { Doctor } from '../types';

interface DoctorProfileModalProps {
  doctor: Doctor | null;
  onClose: () => void;
  onBook: (doctorId: string) => void;
  bookingEnabled?: boolean;
}

export const DoctorProfileModal: React.FC<DoctorProfileModalProps> = ({
  doctor,
  onClose,
  onBook,
  bookingEnabled = true,
}) => {
  if (!doctor) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white dark:bg-surface-dim w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Image / Hero */}
        <div className="relative bg-primary/10 p-6 flex flex-col sm:flex-row items-center gap-6 border-b border-outline-variant/30 text-right">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white shadow flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"
            aria-label="بستن"
          >
            <span className="material-symbols-outlined">close</span>
          </button>

          <img
            src={doctor.avatar}
            alt={doctor.name}
            className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover shadow-lg border-2 border-white"
          />

          <div className="flex-1">
            <span className="inline-block bg-tertiary-fixed text-on-tertiary-fixed-variant px-3 py-0.5 rounded-full text-xs font-bold mb-1">
              {doctor.degree}
            </span>
            <h3 className="text-2xl font-bold text-on-surface mb-1">{doctor.name}</h3>
            <p className="text-primary font-medium text-sm mb-3">{doctor.title}</p>
            
            <div className="flex flex-wrap gap-1.5">
              {doctor.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-surface-container text-on-surface-variant text-xs px-2.5 py-0.5 rounded-md"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bio & Details */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-right">
          <div>
            <h4 className="text-sm font-bold text-secondary mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">badge</span>
              درباره متخصص:
            </h4>
            <p className="text-sm text-on-surface-variant leading-relaxed bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30">
              {doctor.bio}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-surface rounded-xl border border-outline-variant/30">
              <span className="text-on-surface-variant block mb-1">سابقه فعالیت بالینی:</span>
              <span className="font-bold text-sm text-on-surface">{doctor.experienceYears || 10}+ سال تجربه</span>
            </div>
            <div className="p-3 bg-surface rounded-xl border border-outline-variant/30">
              <span className="text-on-surface-variant block mb-1">شیوه برگزاری جلسات:</span>
              <span className="font-bold text-sm text-secondary">
                {doctor.sessionTypes.includes('online') ? 'حضوری و آنلاین' : 'صرفاً حضوری'}
              </span>
            </div>
          </div>

          <div className="bg-secondary-container/20 p-4 rounded-2xl border border-secondary/20 text-xs space-y-2">
            <div className="font-bold text-secondary text-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-base">verified</span>
              دارای پروانه رسمی از سازمان نظام روانشناسی
            </div>
            <p className="text-on-surface-variant">
              نوبت‌های این متخصص در کلینیک ژینو شامل جلسات مشاوره تخصصی، ارزیابی اولیه و پیگیری دوره‌ای درمان می‌باشد.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-4 bg-surface-container-low border-t border-outline-variant/30 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant font-medium text-sm hover:bg-surface-container"
          >
            انصراف
          </button>
          <button
            onClick={() => {
              onClose();
              onBook(doctor.id);
            }}
            className="bg-primary text-white font-bold px-6 py-2.5 rounded-xl shadow-lg hover:bg-primary-container transition-transform active:scale-95 text-xs sm:text-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">calendar_month</span>
            <span>
              {bookingEnabled
                ? `رزرو مستقیم نوبت با ${doctor.name}`
                : `رزرو نوبت با ${doctor.name} (تلفنی/حضوری)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
