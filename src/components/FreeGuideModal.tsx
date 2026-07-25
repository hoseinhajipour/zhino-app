import React, { useEffect, useMemo, useState } from 'react';
import { Doctor, FreeGuideSettings } from '../types';
import {
  DEFAULT_FREE_GUIDE,
  defaultGuideAnswers,
  enabledGuideFields,
  formatBookLabel,
  mergeFreeGuide,
  resolveGuideSpecialtyKeys,
} from '../lib/freeGuideDefaults';

interface FreeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDoctor: (doctorId: string) => void;
  doctors?: Doctor[];
  config?: FreeGuideSettings | null;
}

export const FreeGuideModal: React.FC<FreeGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectDoctor,
  doctors: doctorsProp,
  config: configProp,
}) => {
  const config = useMemo(() => mergeFreeGuide(configProp || DEFAULT_FREE_GUIDE), [configProp]);
  const fields = useMemo(() => enabledGuideFields(config), [config]);
  const [answers, setAnswers] = useState<Record<string, string>>(() => defaultGuideAnswers(config));
  const [recommendation, setRecommendation] = useState<Doctor | null>(null);

  const doctors = useMemo(
    () => (doctorsProp || []).filter((d) => d.active !== false),
    [doctorsProp]
  );

  useEffect(() => {
    if (!isOpen) return;
    setAnswers(defaultGuideAnswers(config));
    setRecommendation(null);
  }, [isOpen, config]);

  if (!isOpen) return null;

  if (!config.enabled) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-surface-dim w-full max-w-md rounded-3xl shadow-2xl p-6 text-right space-y-4">
          <h3 className="text-lg font-bold">{config.title}</h3>
          <p className="text-sm text-on-surface-variant">
            این راهنما فعلاً غیرفعال است. از بخش نوبت‌دهی می‌توانید دوباره فعالش کنید.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl border border-outline-variant text-sm font-bold"
          >
            بستن
          </button>
        </div>
      </div>
    );
  }

  const pickBySpecialty = (...keys: string[]) => {
    for (const key of keys) {
      const found = doctors.find((d) => (d.specialties || []).includes(key));
      if (found) return found;
    }
    return doctors[0];
  };

  const handleRecommend = (e: React.FormEvent) => {
    e.preventDefault();
    const keys = resolveGuideSpecialtyKeys(config, answers);
    const doc = pickBySpecialty(...keys);
    setRecommendation(doc || null);
  };

  const setAnswer = (fieldId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: optionId }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white dark:bg-surface-dim w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-right">
        <div className="bg-secondary text-white p-6 flex justify-between items-center">
          <div>
            {config.badge ? (
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-medium">
                {config.badge}
              </span>
            ) : null}
            <h3 className="text-xl font-bold mt-1">{config.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!recommendation ? (
            <form onSubmit={handleRecommend} className="space-y-5">
              {config.intro ? (
                <p className="text-sm text-on-surface-variant leading-relaxed">{config.intro}</p>
              ) : null}

              {fields.map((field) => (
                <div key={field.id}>
                  <label className="block text-sm font-bold text-on-surface mb-2">{field.label}</label>
                  {field.type === 'select' ? (
                    <select
                      value={answers[field.id] || field.options[0]?.id || ''}
                      onChange={(e) => setAnswer(field.id, e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-secondary outline-none"
                    >
                      {field.options.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div
                      className={`grid gap-2 text-sm ${
                        field.options.length > 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'
                      }`}
                    >
                      {field.options.map((opt) => {
                        const selected = answers[field.id] === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setAnswer(field.id, opt.id)}
                            className={`p-3 rounded-xl border text-center font-medium transition-all ${
                              selected
                                ? 'border-secondary bg-secondary/10 text-secondary font-bold'
                                : 'border-outline-variant text-on-surface'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-secondary text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-secondary/90 transition-all flex items-center justify-center gap-2"
                >
                  <span>{config.submitLabel}</span>
                  <span className="material-symbols-outlined text-sm">auto_awesome</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center space-y-5 py-2">
              <div className="bg-secondary-container/30 border border-secondary/30 p-4 rounded-2xl">
                {config.resultTitle ? (
                  <span className="text-xs text-secondary font-bold block mb-1">
                    {config.resultTitle}
                  </span>
                ) : null}
                {config.resultHint ? (
                  <p className="text-sm font-medium text-on-surface">{config.resultHint}</p>
                ) : null}
              </div>

              <div className="bg-surface p-6 rounded-2xl border border-primary/20 shadow-md text-right flex flex-col sm:flex-row items-center gap-5">
                <img
                  src={recommendation.avatar}
                  alt={recommendation.name}
                  className="w-24 h-28 rounded-2xl object-cover shadow border-2 border-white"
                />
                <div className="flex-1">
                  {config.resultBadge ? (
                    <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full inline-block mb-1">
                      {config.resultBadge}
                    </span>
                  ) : null}
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
                  {config.changeOptionsLabel}
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
                  <span>{formatBookLabel(config.bookLabelTemplate, recommendation.name)}</span>
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
