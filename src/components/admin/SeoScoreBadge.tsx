import React from 'react';
import type { SeoAnalysisResult } from '../../lib/seoAnalyzer';

interface SeoScoreBadgeProps {
  score: number;
  /** Show as three-digit e.g. 085 */
  padded?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function gradeFromScore(score: number): SeoAnalysisResult['grade'] {
  if (score >= 80) return 'good';
  if (score >= 50) return 'ok';
  return 'bad';
}

const GRADE_STYLES: Record<
  SeoAnalysisResult['grade'],
  { ring: string; bg: string; text: string; label: string }
> = {
  good: {
    ring: 'ring-emerald-500/40',
    bg: 'bg-emerald-500',
    text: 'text-white',
    label: 'خوب',
  },
  ok: {
    ring: 'ring-amber-500/40',
    bg: 'bg-amber-500',
    text: 'text-white',
    label: 'متوسط',
  },
  bad: {
    ring: 'ring-rose-500/40',
    bg: 'bg-rose-500',
    text: 'text-white',
    label: 'ضعیف',
  },
};

export const SeoScoreBadge: React.FC<SeoScoreBadgeProps> = ({
  score,
  padded = true,
  size = 'md',
  className = '',
}) => {
  const safe = Math.min(100, Math.max(0, Math.round(score)));
  const grade = gradeFromScore(safe);
  const styles = GRADE_STYLES[grade];
  const label = padded ? String(safe).padStart(3, '0') : String(safe);

  const sizeCls =
    size === 'lg'
      ? 'w-14 h-14 text-sm'
      : size === 'sm'
        ? 'w-9 h-9 text-[10px]'
        : 'w-11 h-11 text-xs';

  return (
    <span
      className={`inline-flex ${sizeCls} items-center justify-center rounded-full font-black tabular-nums shadow-sm ring-2 ${styles.ring} ${styles.bg} ${styles.text} ${className}`}
      title={`امتیاز سئو: ${safe}/100 · ${styles.label}`}
      aria-label={`امتیاز سئو ${safe} از ۱۰۰`}
    >
      {label}
    </span>
  );
};

interface SeoScoreGaugeProps {
  result: SeoAnalysisResult;
}

export const SeoScoreGauge: React.FC<SeoScoreGaugeProps> = ({ result }) => {
  const styles = GRADE_STYLES[result.grade];
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (result.score / 100) * circumference;

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-[88px] h-[88px] shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-200 dark:text-slate-700" />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={
              result.grade === 'good'
                ? 'text-emerald-500'
                : result.grade === 'ok'
                  ? 'text-amber-500'
                  : 'text-rose-500'
            }
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-black tabular-nums text-on-surface leading-none">
            {result.scoreLabel}
          </span>
          <span className="text-[9px] font-bold text-on-surface-variant mt-0.5">/ ۱۰۰</span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-black text-on-surface">امتیاز سئو</p>
        <p
          className={`text-xs font-bold mt-0.5 ${
            result.grade === 'good'
              ? 'text-emerald-700'
              : result.grade === 'ok'
                ? 'text-amber-700'
                : 'text-rose-700'
          }`}
        >
          {styles.label}
        </p>
        <p className="text-[10px] text-on-surface-variant mt-1 leading-relaxed">
          مشابه Rank Math — ساختار، متا و کلمهٔ کلیدی کانونی را بررسی می‌کند.
        </p>
      </div>
    </div>
  );
};
