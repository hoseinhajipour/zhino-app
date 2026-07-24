import React, { useMemo, useState } from 'react';
import { Doctor, PageScreen } from '../types';
import { useAppNavigation } from '../context/AppContext';

const SPECIALTY_LABELS: Record<string, string> = {
  individual: 'مشاوره فردی',
  family: 'خانواده و ازدواج',
  child: 'کودک و نوجوان',
  assessment: 'ارزیابی و سنجش',
  cbt: 'درمان شناختی-رفتاری (CBT)',
  career: 'تحصیلی و شغلی',
};

interface TeamPageProps {
  doctors?: Doctor[];
  onNavigate?: (screen: PageScreen) => void;
  onOpenBooking?: (doctorId?: string, serviceId?: string) => void;
  onOpenDoctorModal?: (doctorId: string) => void;
  onOpenGuide?: () => void;
  bookingEnabled?: boolean;
}

export const TeamPage: React.FC<TeamPageProps> = (props) => {
  const {
    openBooking: onOpenBooking,
    openDoctorProfile: onOpenDoctorModal,
    openGuideModal: onOpenGuide,
    bookingEnabled,
  } = useAppNavigation(props);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');

  const activeDoctors = useMemo(
    () => (props.doctors || []).filter((doc) => doc.active !== false),
    [props.doctors]
  );

  const specialtyOptions = useMemo(() => {
    const ids = new Set<string>();
    activeDoctors.forEach((doc) => {
      (doc.specialties || []).forEach((s) => ids.add(s));
    });
    return Array.from(ids).sort((a, b) =>
      (SPECIALTY_LABELS[a] || a).localeCompare(SPECIALTY_LABELS[b] || b, 'fa')
    );
  }, [activeDoctors]);

  const filteredDoctors = activeDoctors.filter((doc) => {
    const q = searchQuery.trim();
    const matchesSearch =
      !q ||
      doc.name.includes(q) ||
      doc.title.includes(q) ||
      doc.bio.includes(q) ||
      (doc.tags || []).some((t) => t.includes(q)) ||
      (doc.specialties || []).some((s) => (SPECIALTY_LABELS[s] || s).includes(q));

    const matchesSpecialty =
      selectedSpecialty === 'all' || (doc.specialties || []).includes(selectedSpecialty);

    const matchesGender = selectedGender === 'all' || doc.gender === selectedGender;

    const matchesFormat =
      selectedFormat === 'all' ||
      (selectedFormat === 'online' && (doc.sessionTypes || []).includes('online')) ||
      (selectedFormat === 'in-person' && (doc.sessionTypes || []).includes('in-person'));

    return matchesSearch && matchesSpecialty && matchesGender && matchesFormat;
  });

  return (
    <div className="space-y-12 pb-16 text-right max-w-[1200px] mx-auto px-4 md:px-6">
      <section className="bg-surface-container-low p-8 md:p-12 rounded-[40px] border border-outline-variant/30 text-center space-y-4">
        <span className="bg-primary/10 text-primary text-xs font-bold px-4 py-1.5 rounded-full inline-block">
          دیرکتوری تخصصی کادر درمان
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-primary">
          درمانگران و مشاوران کلینیک ژینو
        </h1>
        <p className="text-base text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
          با کادر متخصصین روانشناسی، مشاوران ازدواج و ارزیابان بالینی ما آشنا شوید و درمانگر متناسب با
          دغدغه خود را انتخاب کنید.
        </p>

        <div className="pt-2">
          <button
            type="button"
            onClick={onOpenGuide}
            className="bg-secondary text-white font-bold px-6 py-2.5 rounded-full text-xs shadow hover:bg-secondary/90 transition-all inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            <span>نیاز به راهنمایی هوشمند در انتخاب درمانگر دارید؟</span>
          </button>
        </div>
      </section>

      <section className="bg-white dark:bg-surface-dim p-6 rounded-3xl border border-outline-variant/30 shadow-soft space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی نام یا حوزه درمانی..."
              className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl pr-10 pl-4 py-2.5 text-xs focus:ring-2 focus:ring-primary outline-none"
            />
            <span className="material-symbols-outlined absolute right-3 top-2.5 text-on-surface-variant text-lg">
              search
            </span>
          </div>

          <div>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-primary outline-none text-on-surface"
            >
              <option value="all">همه حوزه‌های تخصصی</option>
              {specialtyOptions.map((id) => (
                <option key={id} value={id}>
                  {SPECIALTY_LABELS[id] || id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-primary outline-none text-on-surface"
            >
              <option value="all">جنسیت درمانگر (همه)</option>
              <option value="female">خانم</option>
              <option value="male">آقا</option>
            </select>
          </div>

          <div>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-primary outline-none text-on-surface"
            >
              <option value="all">شیوه برگزاری (همه)</option>
              <option value="in-person">حضوری در کلینیک</option>
              <option value="online">مشاوره آنلاین تصویری</option>
            </select>
          </div>
        </div>

        {(searchQuery ||
          selectedSpecialty !== 'all' ||
          selectedGender !== 'all' ||
          selectedFormat !== 'all') && (
          <div className="flex justify-between items-center text-xs text-on-surface-variant pt-2 border-t border-outline-variant/20">
            <span>
              تعداد نتایج یافت شده: <strong className="text-primary">{filteredDoctors.length}</strong>{' '}
              متخصص
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedSpecialty('all');
                setSelectedGender('all');
                setSelectedFormat('all');
              }}
              className="text-primary font-bold hover:underline"
            >
              پاکسازی فیلترها
            </button>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredDoctors.length > 0 ? (
          filteredDoctors.map((doc: Doctor) => (
            <div
              key={doc.id}
              className="bg-white dark:bg-surface-dim rounded-3xl overflow-hidden shadow-soft border border-outline-variant/30 flex flex-col justify-between hover:shadow-xl transition-all group"
            >
              <div>
                <div className="aspect-[4/5] relative overflow-hidden bg-surface-container">
                  <img
                    src={doc.avatar}
                    alt={doc.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-4 right-4 bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold shadow-xs">
                    {(doc.sessionTypes || []).includes('online') ? 'حضوری و آنلاین' : 'حضوری'}
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  <h3 className="text-xl font-bold text-on-surface">{doc.name}</h3>
                  <p className="text-xs text-primary font-bold">{doc.title}</p>
                  <p className="text-xs text-on-surface-variant">{doc.degree}</p>

                  <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2 bg-surface-container-low p-3 rounded-xl">
                    {doc.bio}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(doc.tags || []).map((tag) => (
                      <span
                        key={tag}
                        className="bg-tertiary-fixed text-on-tertiary-fixed-variant px-2.5 py-0.5 rounded-lg text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0 flex gap-2">
                <button
                  type="button"
                  onClick={() => onOpenDoctorModal(doc.id)}
                  className="flex-1 py-2.5 rounded-xl border border-primary text-primary font-bold text-xs hover:bg-primary/5 transition-colors"
                >
                  پروفایل کامل
                </button>
                {bookingEnabled && (
                  <button
                    type="button"
                    onClick={() => onOpenBooking(doc.id)}
                    className="flex-1 bg-primary text-white font-bold text-xs py-2.5 rounded-xl hover:bg-primary-container transition-colors shadow"
                  >
                    رزرو نوبت
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-surface-container-low rounded-3xl border border-dashed border-outline-variant">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-2">
              search_off
            </span>
            <h3 className="text-lg font-bold text-on-surface">
              {activeDoctors.length === 0
                ? 'هنوز پرسنلی برای نمایش فعال نشده است.'
                : 'متخصصی با مشخصات انتخابی یافت نشد.'}
            </h3>
            <p className="text-xs text-on-surface-variant mt-1">
              {activeDoctors.length === 0
                ? 'از بخش پرسنل در پنل مدیریت، درمانگران را تعریف و فعال کنید.'
                : 'لطفاً فیلترهای جستجو را پاک کنید یا عبارت دیگری وارد نمائید.'}
            </p>
          </div>
        )}
      </section>
    </div>
  );
};
