import React, { useState } from 'react';
import { FAQItem, PageScreen } from '../types';
import { FAQ_CATEGORIES } from '../data/clinicData';

interface FaqPageProps {
  faqs: FAQItem[];
  onSubmitQuestion: (newFaq: Omit<FAQItem, 'id' | 'date' | 'status' | 'likesCount'>) => void;
  onNavigate: (screen: PageScreen) => void;
  onLikeFaq?: (faqId: string) => void;
}

export const FaqPage: React.FC<FaqPageProps> = ({
  faqs,
  onSubmitQuestion,
  onNavigate,
  onLikeFaq,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  // Form state
  const [askedBy, setAskedBy] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [category, setCategory] = useState('adult');
  const [questionText, setQuestionText] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Filter approved questions for public display
  const approvedFaqs = faqs.filter((item) => item.status === 'approved');

  const filteredFaqs = approvedFaqs.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.answer && item.answer.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.serviceTitle && item.serviceTitle.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() || !askedBy.trim()) return;

    const catObj = FAQ_CATEGORIES.find((c) => c.id === category);

    onSubmitQuestion({
      question: questionText.trim(),
      askedBy: askedBy.trim(),
      userPhone: userPhone.trim(),
      category: category,
      serviceTitle: catObj?.serviceTitle || 'خدمات عمومی کلینیک',
    });

    setQuestionText('');
    setAskedBy('');
    setUserPhone('');
    setSubmittedSuccess(true);
    setTimeout(() => setSubmittedSuccess(false), 8000);
  };

  const toggleAccordion = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-8 md:py-12 text-right space-y-10">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-br from-primary/10 via-surface-container-low to-primary/5 rounded-3xl p-6 md:p-10 border border-outline-variant/30 space-y-4 text-center md:text-right relative overflow-hidden">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
            <span className="material-symbols-outlined text-base">quiz</span>
            <span>مرکز پرسش و پاسخ روانشناسی ژینو</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-on-surface leading-snug">
            سوالات متداول و مشاوره تخصصی
          </h1>
          <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed">
            پاسخ جامع پزشکان و متخصصان کلینیک به رایج‌ترین دغدغه‌های مراجعین در زمینه‌های مشاوره فردی، کودک، زوج‌درمانی و نوروفیدبک.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xl mt-4">
          <span className="material-symbols-outlined absolute right-4 top-3.5 text-on-surface-variant text-xl">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در سوالات و پاسخ‌های تخصصی..."
            className="w-full pl-4 pr-12 py-3 bg-white dark:bg-surface-dim border border-outline-variant/40 rounded-2xl text-xs md:text-sm focus:outline-none focus:border-primary shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-3 text-xs text-on-surface-variant hover:text-primary"
            >
              پاک کردن
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Sidebar Categories + Questions & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar: Service Categories */}
        <aside className="lg:col-span-4 bg-white dark:bg-surface-dim p-5 md:p-6 rounded-3xl border border-outline-variant/30 shadow-xs space-y-4 sticky top-24">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
            <h2 className="font-bold text-sm text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">category</span>
              <span>دسته‌بندی خدمات</span>
            </h2>
            <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {approvedFaqs.length} سوال تاییدشده
            </span>
          </div>

          <div className="space-y-1">
            {FAQ_CATEGORIES.map((cat) => {
              const count =
                cat.id === 'all'
                  ? approvedFaqs.length
                  : approvedFaqs.filter((f) => f.category === cat.id).length;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-right px-3.5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-primary text-white shadow-md'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-lg">{cat.icon}</span>
                    <span>{cat.title}</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Contact Box */}
          <div className="mt-6 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-2 text-center">
            <span className="material-symbols-outlined text-3xl text-primary">support_agent</span>
            <p className="text-xs font-bold text-on-surface">پاسخ سوالتان را پیدا نکردید؟</p>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              فرم زیر را پر کنید یا مستقیماً با کارشناسان نوبت‌دهی کلینیک تماس بگیرید.
            </p>
            <button
              onClick={() => onNavigate('contact')}
              className="mt-2 w-full bg-primary/10 text-primary py-2 rounded-xl text-xs font-bold hover:bg-primary hover:text-white transition-colors"
            >
              ارتباط مستقیم تلفنی
            </button>
          </div>
        </aside>

        {/* Content Area: Accordion List + Submission Form */}
        <main className="lg:col-span-8 space-y-10">
          {/* Section 1: Questions Accordion */}
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20">
              <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">forum</span>
                <span>
                  {selectedCategory === 'all'
                    ? 'همه سوالات متداول'
                    : FAQ_CATEGORIES.find((c) => c.id === selectedCategory)?.title}
                </span>
              </h2>
              <span className="text-xs text-on-surface-variant">
                نمایش {filteredFaqs.length} مورد
              </span>
            </div>

            {filteredFaqs.length === 0 ? (
              <div className="p-8 text-center bg-surface-container-low rounded-3xl border border-outline-variant/30 space-y-3">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/50">
                  search_off
                </span>
                <p className="text-xs font-bold text-on-surface">سؤالی در این دسته‌بندی یافت نشد.</p>
                <p className="text-[11px] text-on-surface-variant">
                  می‌توانید اولین نفری باشید که در این زمینه از پزشکان ما سوال می‌پرسد!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFaqs.map((faq) => {
                  const isOpen = openFaqId === faq.id;
                  return (
                    <div
                      key={faq.id}
                      className={`bg-white dark:bg-surface-dim rounded-2xl border transition-all duration-200 overflow-hidden ${
                        isOpen
                          ? 'border-primary shadow-md ring-1 ring-primary/20'
                          : 'border-outline-variant/30 hover:border-primary/50 shadow-xs'
                      }`}
                    >
                      {/* Accordion Header */}
                      <button
                        onClick={() => toggleAccordion(faq.id)}
                        className="w-full p-4 md:p-5 text-right flex items-start justify-between gap-4 focus:outline-none"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="bg-primary/10 text-primary font-bold px-2.5 py-0.5 rounded-md">
                              {faq.serviceTitle || 'خدمات کلینیک'}
                            </span>
                            <span className="text-on-surface-variant/70">توسط {faq.askedBy}</span>
                            <span className="text-on-surface-variant/40">•</span>
                            <span className="text-on-surface-variant/70">{faq.date}</span>
                          </div>
                          <h3 className="text-sm md:text-base font-bold text-on-surface leading-snug">
                            {faq.question}
                          </h3>
                        </div>

                        <div className="mt-1">
                          <span
                            className={`material-symbols-outlined text-xl text-primary transition-transform duration-300 ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          >
                            keyboard_arrow_down
                          </span>
                        </div>
                      </button>

                      {/* Accordion Body / Answer */}
                      {isOpen && (
                        <div className="px-4 pb-5 md:px-5 border-t border-outline-variant/15 pt-4 bg-surface-container-low/40 space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                              <span className="material-symbols-outlined text-base">medical_services</span>
                            </div>
                            <div className="space-y-1 flex-1">
                              <p className="text-xs font-bold text-primary">
                                پاسخ تخصصی {faq.responderName || 'کادر درمان کلینیک ژینو'}:
                              </p>
                              <p className="text-xs md:text-sm text-on-surface leading-relaxed whitespace-pre-line">
                                {faq.answer || 'پاسخ این سوال پس از بررسی توسط پزشک در سامانه قرار خواهد گرفت.'}
                              </p>
                            </div>
                          </div>

                          {/* Footer Actions / Likes */}
                          <div className="flex items-center justify-between pt-3 border-t border-outline-variant/10 text-[11px] text-on-surface-variant">
                            <span className="flex items-center gap-1 text-emerald-600 font-bold">
                              <span className="material-symbols-outlined text-sm">verified</span>
                              تایید شده توسط مراجع پزشکی کلینیک
                            </span>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onLikeFaq) onLikeFaq(faq.id);
                              }}
                              className="flex items-center gap-1.5 bg-white dark:bg-surface border border-outline-variant/30 hover:border-primary px-3 py-1 rounded-xl text-xs font-bold hover:text-primary transition-colors shadow-2xs"
                            >
                              <span className="material-symbols-outlined text-sm text-rose-500">
                                thumb_up
                              </span>
                              <span>مفید بود ({faq.likesCount || 0})</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Question Submission Form */}
          <div className="bg-white dark:bg-surface-dim rounded-3xl p-6 md:p-8 border border-outline-variant/30 shadow-md space-y-6">
            <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">edit_note</span>
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-on-surface">ارسال سوال جدید از روانشناس</h2>
                <p className="text-xs text-on-surface-variant">
                  سوال شما به‌صورت محرمانه ثبت شده و پس از پاسخ‌دهی متخصص مربوطه، در سایت قرار می‌گیرد.
                </p>
              </div>
            </div>

            {submittedSuccess ? (
              <div className="p-6 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 rounded-2xl border border-emerald-200 flex items-start gap-3">
                <span className="material-symbols-outlined text-2xl text-emerald-600 shrink-0">
                  check_circle
                </span>
                <div className="space-y-1 text-xs leading-relaxed">
                  <p className="font-bold text-sm">سوال شما با موفقیت ثبت شد!</p>
                  <p>
                    پرسش شما به تیم پزشکی مربوطه ارجاع شد. پس از بررسی و درج پاسخ، پیامک اطلاع‌رسانی برای شما ارسال خواهد شد و پاسخ در همین صفحه قابل مشاهده است.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface">نام یا نام مستعار *</label>
                    <input
                      type="text"
                      required
                      value={askedBy}
                      onChange={(e) => setAskedBy(e.target.value)}
                      placeholder="مثال: مریم، یا ناشناس"
                      className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs focus:outline-none focus:border-primary"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface">
                      شماره موبایل (جهت ارسال پیامک پاسخ)
                    </label>
                    <input
                      type="tel"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      placeholder="09123456789 (اختیاری)"
                      className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs focus:outline-none focus:border-primary text-left dir-ltr"
                    />
                  </div>
                </div>

                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface">
                    موضوع و حوزه تخصصی سوال *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs focus:outline-none focus:border-primary"
                  >
                    {FAQ_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Question Text */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface">متن دقیق سوال شما *</label>
                  <textarea
                    required
                    rows={4}
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="شرح کامل مشکل، سن فرد یا سابقه قبلی خود را بنویسید..."
                    className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs focus:outline-none focus:border-primary leading-relaxed"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="bg-primary text-white font-bold text-xs px-8 py-3 rounded-xl hover:bg-primary-container transition-all shadow-md flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">send</span>
                    <span>ثبت و ارسال به روانشناس</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
