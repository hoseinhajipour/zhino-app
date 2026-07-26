import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FAQItem, PageScreen } from '../types';
import { FAQ_CATEGORIES } from '../data/clinicData';
import { SITE_CONTAINER_CLASS } from '../lib/contentWidth';

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
  const [askModalOpen, setAskModalOpen] = useState(false);

  const [askedBy, setAskedBy] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [category, setCategory] = useState('adult');
  const [questionText, setQuestionText] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const selectedTitle =
    selectedCategory === 'all'
      ? 'همه سوالات متداول'
      : FAQ_CATEGORIES.find((c) => c.id === selectedCategory)?.title || 'سوالات';

  useEffect(() => {
    if (!askModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAskModalOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [askModalOpen]);

  const openAskModal = () => {
    setSubmittedSuccess(false);
    if (selectedCategory !== 'all') setCategory(selectedCategory);
    setAskModalOpen(true);
  };

  const closeAskModal = () => {
    setAskModalOpen(false);
    setSubmittedSuccess(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() || !askedBy.trim() || isSubmitting) return;

    const catObj = FAQ_CATEGORIES.find((c) => c.id === category);
    setIsSubmitting(true);
    try {
      onSubmitQuestion({
        question: questionText.trim(),
        askedBy: askedBy.trim(),
        userPhone: userPhone.trim(),
        category,
        serviceTitle: catObj?.serviceTitle || 'خدمات عمومی کلینیک',
      });
      setQuestionText('');
      setAskedBy('');
      setUserPhone('');
      setSubmittedSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAccordion = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  const categoryButtons = FAQ_CATEGORIES.map((cat) => {
    const count =
      cat.id === 'all'
        ? approvedFaqs.length
        : approvedFaqs.filter((f) => f.category === cat.id).length;
    const isSelected = selectedCategory === cat.id;

    return (
      <button
        key={cat.id}
        type="button"
        onClick={() => setSelectedCategory(cat.id)}
        className={`shrink-0 text-right px-3.5 py-2.5 md:py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
          isSelected
            ? 'bg-primary text-white shadow-md'
            : 'bg-white dark:bg-surface-dim text-on-surface-variant border border-outline-variant/30 hover:border-primary/40 hover:text-primary'
        }`}
      >
        <span className="material-symbols-outlined text-lg">{cat.icon}</span>
        <span className="whitespace-nowrap">{cat.title}</span>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
            isSelected ? 'bg-white/20 text-white' : 'bg-surface-container-high text-on-surface-variant'
          }`}
        >
          {count}
        </span>
      </button>
    );
  });

  const askModal =
    askModalOpen &&
    createPortal(
      <div
        className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={closeAskModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="faq-ask-title"
      >
        <div
          className="bg-white dark:bg-surface-dim w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-outline-variant/30 max-h-[92vh] overflow-y-auto text-right"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 z-10 bg-white dark:bg-surface-dim border-b border-outline-variant/20 px-5 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">edit_note</span>
              </div>
              <div className="min-w-0">
                <h2 id="faq-ask-title" className="text-base font-extrabold text-on-surface truncate">
                  ثبت سوال جدید
                </h2>
                <p className="text-[11px] text-on-surface-variant">
                  پاسخ پس از بررسی متخصص در همین صفحه منتشر می‌شود
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeAskModal}
              className="w-9 h-9 rounded-full bg-surface-container-low hover:bg-surface-container flex items-center justify-center shrink-0"
              aria-label="بستن"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          <div className="p-5 space-y-4">
            {submittedSuccess ? (
              <div className="space-y-4">
                <div className="p-5 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 rounded-2xl border border-emerald-200 flex items-start gap-3">
                  <span className="material-symbols-outlined text-2xl text-emerald-600 shrink-0">
                    check_circle
                  </span>
                  <div className="space-y-1 text-xs leading-relaxed">
                    <p className="font-bold text-sm">سوال شما با موفقیت ثبت شد!</p>
                    <p>
                      پرسش به تیم پزشکی ارجاع شد. پس از درج پاسخ، در صورت ثبت موبایل پیامک اطلاع‌رسانی
                      ارسال می‌شود.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeAskModal}
                  className="w-full py-3 rounded-xl bg-primary text-white text-xs font-bold"
                >
                  بستن
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface">شماره موبایل (اختیاری)</label>
                    <input
                      type="tel"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      placeholder="09123456789"
                      dir="ltr"
                      className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs focus:outline-none focus:border-primary text-left"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface">حوزه تخصصی سوال *</label>
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

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface">متن سوال *</label>
                  <textarea
                    required
                    rows={5}
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="شرح کامل مشکل، سن یا سابقه مرتبط را بنویسید..."
                    className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs focus:outline-none focus:border-primary leading-relaxed"
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
                  <button
                    type="button"
                    onClick={closeAskModal}
                    className="flex-1 py-3 rounded-xl border border-outline-variant/40 text-xs font-bold"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-primary text-white font-bold text-xs py-3 rounded-xl hover:bg-primary-container transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-lg">send</span>
                    <span>{isSubmitting ? 'در حال ارسال...' : 'ثبت و ارسال'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>,
      document.body
    );

  return (
    <div className={`${SITE_CONTAINER_CLASS} py-6 md:py-12 text-right space-y-6 md:space-y-10 pb-28 md:pb-12`}>
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/10 via-surface-container-low to-primary/5 rounded-3xl p-5 md:p-10 border border-outline-variant/30 space-y-4 relative overflow-hidden">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
            <span className="material-symbols-outlined text-base">quiz</span>
            <span>مرکز پرسش و پاسخ روانشناسی ژینو</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-4xl font-extrabold text-on-surface leading-snug">
            سوالات متداول و مشاوره تخصصی
          </h1>
          <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed">
            پاسخ جامع پزشکان و متخصصان کلینیک به رایج‌ترین دغدغه‌های مراجعین در زمینه‌های مشاوره فردی،
            کودک، زوج‌درمانی و نوروفیدبک.
          </p>
        </div>

        <div className="relative max-w-xl w-full">
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در سوالات و پاسخ‌ها..."
            className="w-full pl-4 pr-12 py-3 bg-white dark:bg-surface-dim border border-outline-variant/40 rounded-2xl text-xs md:text-sm focus:outline-none focus:border-primary shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-on-surface-variant hover:text-primary"
            >
              پاک کردن
            </button>
          )}
        </div>

        <div className="hidden md:flex">
          <button
            type="button"
            onClick={openAskModal}
            className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-md hover:bg-primary-container transition-colors"
          >
            <span className="material-symbols-outlined text-lg">add_comment</span>
            ثبت سوال جدید
          </button>
        </div>
      </div>

      {/* Mobile categories — horizontal chips, separate from Q list */}
      <div className="lg:hidden space-y-2">
        <div className="flex items-center justify-between gap-2 px-0.5">
          <h2 className="text-xs font-black text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-base">category</span>
            دسته‌بندی
          </h2>
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {approvedFaqs.length} سوال
          </span>
        </div>
        <div className="-mx-4 px-4 overflow-x-auto scrollbar-none">
          <div className="flex gap-2 pb-1 min-w-max">{categoryButtons}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block lg:col-span-4 space-y-4 sticky top-24">
          <div className="bg-white dark:bg-surface-dim p-5 md:p-6 rounded-3xl border border-outline-variant/30 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <h2 className="font-bold text-sm text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">category</span>
                <span>دسته‌بندی خدمات</span>
              </h2>
              <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {approvedFaqs.length} سوال
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
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-right px-3.5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-primary text-white shadow-md'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="material-symbols-outlined text-lg shrink-0">{cat.icon}</span>
                      <span className="truncate">{cat.title}</span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-3 text-center">
            <span className="material-symbols-outlined text-3xl text-primary">support_agent</span>
            <p className="text-xs font-bold text-on-surface">پاسخ سوالتان را پیدا نکردید؟</p>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              سوال خود را ثبت کنید یا با پذیرش کلینیک تماس بگیرید.
            </p>
            <button
              type="button"
              onClick={openAskModal}
              className="w-full bg-primary text-white py-2.5 rounded-xl text-xs font-bold hover:bg-primary-container transition-colors"
            >
              ثبت سوال جدید
            </button>
            <button
              type="button"
              onClick={() => onNavigate('contact')}
              className="w-full bg-primary/10 text-primary py-2 rounded-xl text-xs font-bold hover:bg-primary hover:text-white transition-colors"
            >
              ارتباط مستقیم تلفنی
            </button>
          </div>
        </aside>

        {/* Questions only */}
        <main className="lg:col-span-8 space-y-4 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-outline-variant/20">
            <h2 className="text-base md:text-lg font-extrabold text-on-surface flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-primary shrink-0">forum</span>
              <span className="truncate">{selectedTitle}</span>
            </h2>
            <span className="text-[11px] md:text-xs text-on-surface-variant shrink-0">
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
                می‌توانید اولین نفری باشید که در این زمینه سوال می‌پرسد.
              </p>
              <button
                type="button"
                onClick={openAskModal}
                className="inline-flex items-center gap-1.5 mt-1 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold"
              >
                <span className="material-symbols-outlined text-base">add_comment</span>
                ثبت سوال جدید
              </button>
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
                    <button
                      type="button"
                      onClick={() => toggleAccordion(faq.id)}
                      className="w-full p-4 md:p-5 text-right flex items-start justify-between gap-3 focus:outline-none"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                          <span className="bg-primary/10 text-primary font-bold px-2.5 py-0.5 rounded-md">
                            {faq.serviceTitle || 'خدمات کلینیک'}
                          </span>
                          {faq.askedBy && (
                            <span className="text-on-surface-variant/70">توسط {faq.askedBy}</span>
                          )}
                          {faq.date && (
                            <>
                              <span className="text-on-surface-variant/40 hidden sm:inline">•</span>
                              <span className="text-on-surface-variant/70">{faq.date}</span>
                            </>
                          )}
                        </div>
                        <h3 className="text-sm md:text-base font-bold text-on-surface leading-snug break-words">
                          {faq.question}
                        </h3>
                      </div>
                      <span
                        className={`material-symbols-outlined text-xl text-primary shrink-0 mt-0.5 transition-transform duration-300 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      >
                        keyboard_arrow_down
                      </span>
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-5 md:px-5 border-t border-outline-variant/15 pt-4 bg-surface-container-low/40 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                            <span className="material-symbols-outlined text-base">medical_services</span>
                          </div>
                          <div className="space-y-1 flex-1 min-w-0">
                            <p className="text-xs font-bold text-primary">
                              پاسخ تخصصی {faq.responderName || 'کادر درمان کلینیک ژینو'}:
                            </p>
                            <p className="text-xs md:text-sm text-on-surface leading-relaxed whitespace-pre-line break-words">
                              {faq.answer ||
                                'پاسخ این سوال پس از بررسی توسط پزشک در سامانه قرار خواهد گرفت.'}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-outline-variant/10 text-[11px] text-on-surface-variant">
                          <span className="flex items-center gap-1 text-emerald-600 font-bold">
                            <span className="material-symbols-outlined text-sm">verified</span>
                            تایید شده توسط مراجع پزشکی کلینیک
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onLikeFaq?.(faq.id);
                            }}
                            className="self-start sm:self-auto flex items-center gap-1.5 bg-white dark:bg-surface border border-outline-variant/30 hover:border-primary px-3 py-1.5 rounded-xl text-xs font-bold hover:text-primary transition-colors"
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
        </main>
      </div>

      {/* Mobile sticky ask CTA — leave room for consult FAB on the right */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 p-3 pe-20 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-surface via-surface/95 to-transparent pointer-events-none">
        <button
          type="button"
          onClick={openAskModal}
          className="pointer-events-auto w-full flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-2xl text-sm font-bold shadow-xl shadow-primary/25"
        >
          <span className="material-symbols-outlined">add_comment</span>
          ثبت سوال جدید
        </button>
      </div>

      {askModal}
    </div>
  );
};
