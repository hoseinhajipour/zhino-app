import React, { useState, useEffect } from 'react';
import { Article } from '../types';
import { BlockRenderer } from '../components/page-builder/BlockRenderer';

interface ArticleDetailPageProps {
  article: Article;
  allArticles: Article[];
  onBack: () => void;
  onSelectArticle: (article: Article) => void;
  onOpenBooking: () => void;
}

export const ArticleDetailPage: React.FC<ArticleDetailPageProps> = ({
  article,
  allArticles,
  onBack,
  onSelectArticle,
  onOpenBooking,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [feedback, setFeedback] = useState<'useful' | 'not-useful' | null>(null);
  const [likeCount, setLikeCount] = useState(24);

  // Scroll to top when article changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setFeedback(null);
  }, [article.id]);

  // Find related articles (same category or excluding current)
  const relatedArticles = allArticles
    .filter((a) => a.id !== article.id && a.status === 'published')
    .filter((a) => a.category === article.category || true)
    .slice(0, 3);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleFeedback = (type: 'useful' | 'not-useful') => {
    if (feedback === type) return;
    if (type === 'useful') {
      setLikeCount((prev) => prev + 1);
    } else if (feedback === 'useful') {
      setLikeCount((prev) => prev - 1);
    }
    setFeedback(type);
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'large':
        return 'text-base leading-relaxed';
      case 'xlarge':
        return 'text-lg leading-loose';
      default:
        return 'text-sm leading-relaxed';
    }
  };

  // Helper function to render content with markdown-like headings, lists and paragraphs
  const renderFormattedContent = (contentStr: string) => {
    const lines = contentStr.split('\n');
    const elements: React.ReactNode[] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) {
        elements.push(<div key={`empty-${index}`} className="h-3" />);
        return;
      }

      // Check if line starts with or contains HTML elements (images, videos, figures, iframe)
      if (
        trimmed.startsWith('<') &&
        (trimmed.includes('<img') ||
          trimmed.includes('<video') ||
          trimmed.includes('<figure') ||
          trimmed.includes('<iframe') ||
          trimmed.includes('<div'))
      ) {
        elements.push(
          <div
            key={index}
            dangerouslySetInnerHTML={{ __html: trimmed }}
            className="my-4 overflow-hidden rounded-2xl"
          />
        );
      } else if (trimmed.startsWith('# ')) {
        elements.push(
          <h1 key={index} className="text-2xl md:text-3xl font-extrabold text-primary mt-6 mb-3 border-b border-outline-variant/30 pb-2">
            {trimmed.replace('# ', '')}
          </h1>
        );
      } else if (trimmed.startsWith('## ')) {
        elements.push(
          <h2 key={index} className="text-xl md:text-2xl font-bold text-on-surface mt-6 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
            {trimmed.replace('## ', '')}
          </h2>
        );
      } else if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={index} className="text-lg font-bold text-secondary mt-5 mb-2">
            {trimmed.replace('### ', '')}
          </h3>
        );
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        elements.push(
          <li key={index} className="mr-6 list-disc text-on-surface-variant my-1.5 font-medium">
            {trimmed.replace(/^[-*]\s+/, '')}
          </li>
        );
      } else if (trimmed.startsWith('> ')) {
        elements.push(
          <blockquote key={index} className="my-4 p-4 bg-primary/5 border-r-4 border-primary rounded-l-2xl italic text-on-surface font-semibold text-xs md:text-sm">
            {trimmed.replace('> ', '')}
          </blockquote>
        );
      } else {
        if (trimmed.includes('<') && trimmed.includes('>')) {
          elements.push(
            <p
              key={index}
              dangerouslySetInnerHTML={{ __html: trimmed }}
              className="text-on-surface/90 my-2 text-justify leading-relaxed"
            />
          );
        } else {
          elements.push(
            <p key={index} className="text-on-surface/90 my-2 text-justify leading-relaxed">
              {trimmed}
            </p>
          );
        }
      }
    });

    return elements;
  };

  return (
    <div className="max-w-[1000px] mx-auto px-4 md:px-6 py-6 space-y-10 text-right animate-fade-in dir-rtl">
      {/* ------------------------------------------------------------------------- */}
      {/* 1. TOP BREADCRUMBS & NAVIGATION BAR */}
      {/* ------------------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-surface-dim p-4 rounded-2xl border border-outline-variant/30 shadow-soft text-xs">
        <nav className="flex items-center gap-2 text-on-surface-variant overflow-x-auto">
          <button
            onClick={onBack}
            className="hover:text-primary transition-colors flex items-center gap-1 font-bold shrink-0"
          >
            <span className="material-symbols-outlined text-sm">home</span>
            <span>مجله تخصصی</span>
          </button>
          <span className="text-outline">/</span>
          <span className="text-primary font-semibold shrink-0">{article.category}</span>
          <span className="text-outline">/</span>
          <span className="text-on-surface truncate max-w-[200px] sm:max-w-[300px]" title={article.title}>
            {article.title}
          </span>
        </nav>

        <button
          onClick={onBack}
          className="bg-surface-container-low hover:bg-surface-container text-primary border border-primary/20 font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0"
        >
          <span className="material-symbols-outlined text-base">arrow_forward</span>
          <span>بازگشت به همه مقالات</span>
        </button>
      </div>

      {/* ------------------------------------------------------------------------- */}
      {/* 2. MAIN ARTICLE CARD */}
      {/* ------------------------------------------------------------------------- */}
      <article className="bg-white dark:bg-surface-dim rounded-[36px] border border-outline-variant/30 shadow-sm overflow-hidden p-6 md:p-10 space-y-8">
        {/* Header Badges & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="bg-primary/10 text-primary text-xs font-extrabold px-3.5 py-1.5 rounded-full border border-primary/20">
              {article.category}
            </span>
            <span className="text-xs text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-base">schedule</span>
              زمان مطالعه: {article.readTime}
            </span>
            <span className="text-xs text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-base">visibility</span>
              {article.views + 1} بازدید
            </span>
          </div>

          {/* Social Share & Utility Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              title="ذخیره مقاله"
              className={`p-2.5 rounded-xl border transition-all flex items-center gap-1 text-xs font-bold ${
                isBookmarked
                  ? 'bg-amber-50 text-amber-600 border-amber-300'
                  : 'bg-surface-container-low text-on-surface-variant border-outline-variant/40 hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {isBookmarked ? 'bookmark_added' : 'bookmark'}
              </span>
              <span className="hidden sm:inline">{isBookmarked ? 'ذخیره شده' : 'نشان کردن'}</span>
            </button>

            <button
              onClick={handleCopyLink}
              title="کپی لینک مقاله"
              className="p-2.5 bg-surface-container-low hover:bg-surface-container text-on-surface-variant border border-outline-variant/40 rounded-xl transition-all flex items-center gap-1 text-xs font-bold"
            >
              <span className="material-symbols-outlined text-base">
                {copiedLink ? 'check_circle' : 'share'}
              </span>
              <span className="hidden sm:inline">{copiedLink ? 'لینک کپی شد' : 'اشتراک‌گذاری'}</span>
            </button>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-4xl font-extrabold text-on-surface leading-tight md:leading-snug">
          {article.title}
        </h1>

        {/* Author Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20">
          <div className="flex items-center gap-3">
            {article.authorAvatar ? (
              <img
                src={article.authorAvatar}
                alt={article.authorName}
                className="w-12 h-12 rounded-full object-cover border-2 border-primary/20 shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                {article.authorName.charAt(0)}
              </div>
            )}
            <div>
              <div className="font-bold text-on-surface text-sm">{article.authorName}</div>
              <div className="text-xs text-on-surface-variant mt-0.5">
                نویسنده و متخصص کلینیک روانشناسی ژینو • تاریخ انتشار: {article.publishedAt}
              </div>
            </div>
          </div>

          <button
            onClick={onOpenBooking}
            className="text-xs font-bold bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1 shadow-sm shrink-0"
          >
            <span className="material-symbols-outlined text-base">calendar_month</span>
            <span>دریافت مشاوره از نویسنده</span>
          </button>
        </div>

        {/* Article Summary Box */}
        {article.summary && (
          <div className="bg-primary/5 p-5 md:p-6 rounded-2xl border-r-4 border-primary space-y-2">
            <span className="text-xs font-bold text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-base">auto_awesome</span>
              خلاصه مقاله
            </span>
            <p className="text-xs md:text-sm text-on-surface font-medium leading-relaxed">
              {article.summary}
            </p>
          </div>
        )}

        {/* Featured Cover Image */}
        <div className="aspect-video w-full rounded-3xl overflow-hidden border border-outline-variant/30 shadow-md relative bg-surface-container">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Reading Controls (Font Size Adjuster) */}
        <div className="flex items-center justify-between bg-surface-container-low px-4 py-2.5 rounded-xl border border-outline-variant/20 text-xs">
          <span className="font-bold text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-base">format_size</span>
            تنظیم اندازه متن:
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFontSize('normal')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                fontSize === 'normal'
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-surface text-on-surface hover:bg-surface-container'
              }`}
            >
              عادی
            </button>
            <button
              onClick={() => setFontSize('large')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                fontSize === 'large'
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-surface text-on-surface hover:bg-surface-container'
              }`}
            >
              بزرگ
            </button>
            <button
              onClick={() => setFontSize('xlarge')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                fontSize === 'xlarge'
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-surface text-on-surface hover:bg-surface-container'
              }`}
            >
              خیلی بزرگ
            </button>
          </div>
        </div>

        {/* Main Article Content */}
        {article.pageBuilder?.blocks?.length ? (
          <div className={getFontSizeClass()}>
            <BlockRenderer
              blocks={article.pageBuilder.blocks}
              ctx={{
                articles: allArticles,
                bookingEnabled: true,
                onOpenBooking,
                onSelectArticle,
                onNavigate: () => undefined,
                onOpenDoctorModal: () => undefined,
                onSelectOtherService: () => undefined,
              }}
            />
          </div>
        ) : (
          <div className={`prose dark:prose-invert max-w-none text-on-surface ${getFontSizeClass()}`}>
            {renderFormattedContent(article.content)}
          </div>
        )}

        {/* Article Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="pt-6 border-t border-outline-variant/20 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-base">tag</span>
              برچسب‌های مقاله:
            </span>
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-medium px-3.5 py-1.5 rounded-xl border border-outline-variant/30 transition-all cursor-default"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Article Helpful Feedback */}
        <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/30 text-center space-y-4">
          <h4 className="font-bold text-sm text-on-surface">آیا این مقاله برای شما مفید بود؟</h4>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => handleFeedback('useful')}
              className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm ${
                feedback === 'useful'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-surface text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              <span className="material-symbols-outlined text-lg">thumb_up</span>
              <span>بله، مفید بود ({likeCount})</span>
            </button>

            <button
              onClick={() => handleFeedback('not-useful')}
              className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm ${
                feedback === 'not-useful'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white dark:bg-surface text-rose-700 border border-rose-200 hover:bg-rose-50'
              }`}
            >
              <span className="material-symbols-outlined text-lg">thumb_down</span>
              <span>نیاز به بهبود دارد</span>
            </button>
          </div>
          {feedback && (
            <p className="text-[11px] text-emerald-800 font-bold animate-fade-in">
              از بازخورد ارزشمند شما سپاسگزاریم!
            </p>
          )}
        </div>
      </article>

      {/* ------------------------------------------------------------------------- */}
      {/* 3. CONSULTATION CALL TO ACTION BANNER */}
      {/* ------------------------------------------------------------------------- */}
      <section className="bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 p-8 rounded-[36px] border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2 text-center md:text-right">
          <div className="flex items-center gap-2 justify-center md:justify-start text-primary font-extrabold text-xs">
            <span className="material-symbols-outlined text-lg">psychology</span>
            <span>مشاوره تخصصی روانشناسی کلینیک ژینو</span>
          </div>
          <h3 className="text-lg md:text-xl font-extrabold text-on-surface">
            نیاز به گفتگو با متخصص یا مشاوره حضوری/آنلاین دارید؟
          </h3>
          <p className="text-xs text-on-surface-variant max-w-xl leading-relaxed">
            کادر درمانگران و روانشناسان مجرب کلینیک ژینو آماده ارائه مشاوره در حیطه‌های فردی، زوج، کودک و خانواده هستند.
          </p>
        </div>

        <button
          onClick={onOpenBooking}
          className="bg-primary hover:bg-primary/90 text-white font-extrabold px-8 py-3.5 rounded-2xl shadow-md transition-all flex items-center gap-2 text-xs shrink-0"
        >
          <span className="material-symbols-outlined text-lg">edit_calendar</span>
          <span>رزرو وقت مشاوره فوری</span>
        </button>
      </section>

      {/* ------------------------------------------------------------------------- */}
      {/* 4. RELATED ARTICLES SECTION */}
      {/* ------------------------------------------------------------------------- */}
      {relatedArticles.length > 0 && (
        <section className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
            <h3 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">auto_stories</span>
              <span>سایر مقالات پیشنهاد شده</span>
            </h3>

            <button
              onClick={onBack}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>مشاهده همه</span>
              <span className="material-symbols-outlined text-sm">arrow_back</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map((rel) => (
              <div
                key={rel.id}
                onClick={() => onSelectArticle(rel)}
                className="bg-white dark:bg-surface-dim rounded-2xl border border-outline-variant/30 shadow-soft overflow-hidden hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between p-4 space-y-3"
              >
                <div className="space-y-3">
                  <div className="aspect-video rounded-xl overflow-hidden relative bg-surface-container">
                    <img
                      src={rel.coverImage}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 right-2 bg-primary/90 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      {rel.category}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs text-on-surface group-hover:text-primary transition-colors leading-snug line-clamp-2">
                    {rel.title}
                  </h4>

                  <p className="text-[11px] text-on-surface-variant line-clamp-2 leading-relaxed">
                    {rel.summary}
                  </p>
                </div>

                <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-on-surface-variant">
                  <span>زمان مطالعه: {rel.readTime}</span>
                  <span className="text-primary font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                    <span>مطالعه</span>
                    <span className="material-symbols-outlined text-xs">arrow_back</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
