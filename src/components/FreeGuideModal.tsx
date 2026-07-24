import React, { useState } from 'react';
import { DOCTORS } from '../data/clinicData';
import { Doctor } from '../types';

interface FreeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDoctor: (doctorId: string) => void;
}

export const FreeGuideModal: React.FC<FreeGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectDoctor,
}) => {
  const [ageGroup, setAgeGroup] = useState<'child' | 'teen' | 'adult' | 'couple'>('adult');
  const [mainConcern, setMainConcern] = useState<string>('anxiety');
  const [format, setFormat] = useState<'in-person' | 'online'>('in-person');
  const [recommendation, setRecommendation] = useState<Doctor | null>(null);

  if (!isOpen) return null;

  const handleRecommend = (e: React.FormEvent) => {
    e.preventDefault();
    let doc: Doctor | undefined;
    if (ageGroup === 'child' || ageGroup === 'teen') {
      doc = DOCTORS.find((d) => d.specialties.includes('child')) || DOCTORS[2];
    } else if (ageGroup === 'couple') {
      doc = DOCTORS.find((d) => d.specialties.includes('family')) || DOCTORS[1];
    } else if (mainConcern === 'career') {
      doc = DOCTORS.find((d) => d.specialties.includes('career')) || DOCTORS[6];
    } else if (mainConcern === 'assessment') {
      doc = DOCTORS.find((d) => d.specialties.includes('assessment')) || DOCTORS[3];
    } else {
      doc = DOCTORS.find((d) => d.specialties.includes('cbt')) || DOCTORS[0];
    }
    setRecommendation(doc);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white dark:bg-surface-dim w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-right">
        {/* Header */}
        <div className="bg-secondary text-white p-6 flex justify-between items-center">
          <div>
            <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-medium">راهنمای هوشمند</span>
            <h3 className="text-xl font-bold mt-1">مشاوره رایگان انتخاب درمانگر</h3>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!recommendation ? (
            <form onSubmit={handleRecommend} className="space-y-5">
              <p className="text-sm text-on-surface-variant leading-relaxed">
                با پاسخ به چند سوال کوتاه زیر، مناسب‌ترین درمانگر کلینیک ژینو بر اساس دغدغه و شرایط شما پیشنهاد خواهد شد.
              </p>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">۱. مراجعه‌کننده اصلی چه کسی است؟</label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => setAgeGroup('adult')}
                    className={`p-3 rounded-xl border text-center font-medium transition-all ${
                      ageGroup === 'adult'
                        ? 'border-secondary bg-secondary/10 text-secondary font-bold'
                        : 'border-outline-variant text-on-surface'
                    }`}
                  >
                    بزرگسال (خودم یا دیگران)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgeGroup('couple')}
                    className={`p-3 rounded-xl border text-center font-medium transition-all ${
                      ageGroup === 'couple'
                        ? 'border-secondary bg-secondary/10 text-secondary font-bold'
                        : 'border-outline-variant text-on-surface'
                    }`}
                  >
                    زوج یا همسران
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgeGroup('child')}
                    className={`p-3 rounded-xl border text-center font-medium transition-all ${
                      ageGroup === 'child'
                        ? 'border-secondary bg-secondary/10 text-secondary font-bold'
                        : 'border-outline-variant text-on-surface'
                    }`}
                  >
                    کودک (۳ تا ۱۲ سال)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgeGroup('teen')}
                    className={`p-3 rounded-xl border text-center font-medium transition-all ${
                      ageGroup === 'teen'
                        ? 'border-secondary bg-secondary/10 text-secondary font-bold'
                        : 'border-outline-variant text-on-surface'
                    }`}
                  >
                    نوجوان (۱۳ تا ۱۸ سال)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">۲. موضوع یا دغدغه اصلی چیست؟</label>
                <select
                  value={mainConcern}
                  onChange={(e) => setMainConcern(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-secondary outline-none"
                >
                  <option value="anxiety">اضطراب، استرس یا وسواس</option>
                  <option value="depression">افسردگی و افت انگیزه</option>
                  <option value="marriage">روابط عاطفی و مشاوره ازدواج</option>
                  <option value="child-behavior">مشکلات رفتاری کودک / بازی‌درمانی</option>
                  <option value="career">هدایت تحصیلی، شغلی و کوچینگ</option>
                  <option value="assessment">تست هوش و ارزیابی شخصیت</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">۳. ترجیح شما برای شیوه جلسه:</label>
                <div className="flex gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => setFormat('in-person')}
                    className={`flex-1 p-3 rounded-xl border text-center transition-all ${
                      format === 'in-person'
                        ? 'border-secondary bg-secondary/10 text-secondary font-bold'
                        : 'border-outline-variant text-on-surface'
                    }`}
                  >
                    حضوری در کلینیک
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat('online')}
                    className={`flex-1 p-3 rounded-xl border text-center transition-all ${
                      format === 'online'
                        ? 'border-secondary bg-secondary/10 text-secondary font-bold'
                        : 'border-outline-variant text-on-surface'
                    }`}
                  >
                    آنلاین تصویری
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-secondary text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-secondary/90 transition-all flex items-center justify-center gap-2"
                >
                  <span>نمایش درمانگر پیشنهادی</span>
                  <span className="material-symbols-outlined text-sm">auto_awesome</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center space-y-5 py-2">
              <div className="bg-secondary-container/30 border border-secondary/30 p-4 rounded-2xl">
                <span className="text-xs text-secondary font-bold block mb-1">نتیجه آنالیز هوشمند:</span>
                <p className="text-sm font-medium text-on-surface">
                  بر اساس گزینه‌های انتخابی شما، درمانگر زیر بیشترین تطابق تخصصی را دارد.
                </p>
              </div>

              <div className="bg-surface p-6 rounded-2xl border border-primary/20 shadow-md text-right flex flex-col sm:flex-row items-center gap-5">
                <img
                  src={recommendation.avatar}
                  alt={recommendation.name}
                  className="w-24 h-28 rounded-2xl object-cover shadow border-2 border-white"
                />
                <div className="flex-1">
                  <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full inline-block mb-1">
                    پیشنهاد کلینیک ژینو
                  </span>
                  <h4 className="text-xl font-bold text-on-surface">{recommendation.name}</h4>
                  <p className="text-xs text-secondary font-medium mb-2">{recommendation.title}</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                    {recommendation.bio}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRecommendation(null)}
                  className="flex-1 py-3 rounded-xl border border-outline-variant text-on-surface-variant text-sm font-medium hover:bg-surface-container"
                >
                  تغییر گزینه‌ها
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const docId = recommendation.id;
                    onClose();
                    onSelectDoctor(docId);
                  }}
                  className="flex-1 bg-primary text-white font-bold py-3 rounded-xl shadow-lg hover:bg-primary-container text-sm flex items-center justify-center gap-1"
                >
                  <span>رزرو نوبت با {recommendation.name.split(' ')[1] || recommendation.name}</span>
                  <span className="material-symbols-outlined text-sm">calendar_month</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
