import React, { useState } from 'react';
import { CLINIC_INFO } from '../data/clinicData';

export const WhatsAppFloatingButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  // Format phone number for WhatsApp wa.me link
  const rawWaNumber = CLINIC_INFO.whatsappNumber || '+989120000000';
  const whatsappNumber = rawWaNumber.replace(/[^0-9]/g, '');

  const handleSendMessage = () => {
    const text = encodeURIComponent(
      message.trim()
        ? `سلام، از طریق وب‌سایت کلینیک ژینو پیام می‌دهم:\n${message}`
        : 'سلام، جهت دریافت اطلاعات و رزرو نوبت مشاوره روانشناسی راهنمایی می‌خواستم.'
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank');
    setIsOpen(false);
    setMessage('');
  };

  const handleQuickChip = (chipText: string) => {
    const text = encodeURIComponent(`سلام، در مورد "${chipText}" راهنمایی می‌خواستم.`);
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* WhatsApp Chat Popover Window */}
      {isOpen && (
        <div className="mb-4 w-80 md:w-96 bg-white dark:bg-surface-dim rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden animate-slide-up text-right">
          {/* Header */}
          <div className="bg-emerald-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
                  ژ
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-emerald-600 rounded-full"></span>
              </div>
              <div>
                <h4 className="font-bold text-sm">پشتیبانی و مشاوره ژینو</h4>
                <p className="text-[11px] text-emerald-100 flex items-center gap-1">
                  <span>پاسخگویی آنلاین در واتس‌اپ</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          {/* Body / Chat Area */}
          <div className="p-4 bg-emerald-50/50 dark:bg-surface-container-low/40 space-y-3 text-xs">
            <div className="bg-white dark:bg-surface p-3 rounded-2xl shadow-xs border border-outline-variant/20 space-y-1 max-w-[85%]">
              <p className="font-bold text-emerald-800 dark:text-emerald-300">
                درود! چطور می‌توانیم راهنماییتان کنیم؟
              </p>
              <p className="text-on-surface-variant text-[11px] leading-relaxed">
                سوال خود در مورد نوبت‌دهی، هزینه‌ها یا خدمات کلینیک را بنویسید تا همکاران ما در واتس‌اپ پاسخ دهند.
              </p>
            </div>

            {/* Quick Chips */}
            <div className="space-y-1.5 pt-1">
              <p className="text-[10px] font-bold text-on-surface-variant">سوالات سریع:</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'رزرو نوبت مشاوره',
                  'هزینه خدمات نوروفیدبک',
                  'شرایط جلسات آنلاین',
                  'آدرس و ساعات کاری',
                ].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleQuickChip(chip)}
                    className="bg-white dark:bg-surface border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-xl text-[11px] font-bold hover:bg-emerald-600 hover:text-white transition-all shadow-2xs"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Input */}
          <div className="p-3 bg-white dark:bg-surface-dim border-t border-outline-variant/20 flex items-center gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="پیام شما در واتس‌اپ..."
              className="flex-1 px-3.5 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleSendMessage}
              className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-xl transition-all shadow flex items-center justify-center shrink-0"
              title="ارسال در واتس‌اپ"
            >
              <span className="material-symbols-outlined text-lg">send</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Trigger Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative group bg-emerald-500 hover:bg-emerald-600 text-white p-3.5 md:p-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center ring-4 ring-emerald-500/20 active:scale-95"
        aria-label="پشتیبانی واتس‌اپ"
      >
        {/* Pulse Effect */}
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400"></span>
        </span>

        {/* Icon / SVG */}
        {isOpen ? (
          <span className="material-symbols-outlined text-2xl">close</span>
        ) : (
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
          </svg>
        )}

        {/* Hover Tooltip */}
        <span className="absolute right-full mr-3 bg-gray-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
          پشتیبانی و مشاوره واتس‌اپ
        </span>
      </button>
    </div>
  );
};
