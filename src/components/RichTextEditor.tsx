import React, { useState, useRef } from 'react';
import { MediaField } from './media/MediaField';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'متن مقاله را اینجا بنویسید...',
}) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [showImageModal, setShowImageModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Image modal state
  const [imageUrl, setImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');

  // Video modal state
  const [videoUrl, setVideoUrl] = useState('');
  const [videoCaption, setVideoCaption] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Insert markdown/HTML tags around selection or at cursor position
  const insertFormatting = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const replacement = `${prefix}${selectedText || 'متن نمونه'}${suffix}`;

    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selectedText.length || 8)
      );
    }, 50);
  };

  const insertLineStart = (linePrefix: string) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Find start of current line
    const lastNewline = value.lastIndexOf('\n', start - 1);
    const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;

    const newValue =
      value.substring(0, lineStart) + linePrefix + value.substring(lineStart);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + linePrefix.length, end + linePrefix.length);
    }, 50);
  };

  // Image/video file upload handlers removed — MediaField / MediaPicker is used instead.

  const handleConfirmAddImage = () => {
    if (!imageUrl) return;
    const captionText = imageCaption ? `\n<figcaption class="text-center text-xs text-slate-500 mt-1">${imageCaption}</figcaption>` : '';
    const imgTag = `\n<figure class="my-6">\n  <img src="${imageUrl}" alt="${imageCaption || 'تصویر مقاله'}" class="w-full max-h-[480px] object-cover rounded-2xl shadow-md border border-slate-200 dark:border-slate-700" />${captionText}\n</figure>\n`;

    insertAtCursor(imgTag);
    setImageUrl('');
    setImageCaption('');
    setShowImageModal(false);
  };

  const handleConfirmAddVideo = () => {
    if (!videoUrl) return;
    const captionText = videoCaption ? `\n<p class="text-center text-xs text-slate-500 mt-1">${videoCaption}</p>` : '';
    let videoTag = '';

    if (videoUrl.includes('aparat.com') || videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      // Embed URL
      videoTag = `\n<div class="my-6 aspect-video w-full rounded-2xl overflow-hidden shadow-md border border-slate-200">\n  <iframe src="${videoUrl}" allowfullscreen class="w-full h-full border-0"></iframe>\n</div>${captionText}\n`;
    } else {
      // Direct MP4 or Base64 Video
      videoTag = `\n<div class="my-6 space-y-1">\n  <video src="${videoUrl}" controls class="w-full rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 max-h-[480px]"></video>${captionText}\n</div>\n`;
    }

    insertAtCursor(videoTag);
    setVideoUrl('');
    setVideoCaption('');
    setShowVideoModal(false);
  };

  const insertAtCursor = (textToInsert: string) => {
    if (!textareaRef.current) {
      onChange(value + textToInsert);
      return;
    }
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.substring(0, start) + textToInsert + value.substring(end);
    onChange(newValue);
  };

  // Render HTML / Markdown preview safely
  const renderPreviewContent = (contentStr: string) => {
    if (!contentStr.trim()) {
      return (
        <div className="text-center text-slate-400 py-12 text-xs">
          هنوز متنی برای پیش‌نمایش وارد نشده است.
        </div>
      );
    }

    const lines = contentStr.split('\n');
    const elements: React.ReactNode[] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) {
        elements.push(<div key={`empty-${index}`} className="h-2" />);
        return;
      }

      // Check if line contains inline HTML like <img> or <video> or <figure> or <iframe>
      if (trimmed.startsWith('<') && (trimmed.includes('<img') || trimmed.includes('<video') || trimmed.includes('<figure') || trimmed.includes('<iframe'))) {
        elements.push(
          <div
            key={index}
            dangerouslySetInnerHTML={{ __html: trimmed }}
            className="my-3 overflow-hidden"
          />
        );
      } else if (trimmed.startsWith('# ')) {
        elements.push(
          <h1 key={index} className="text-2xl font-extrabold text-primary my-4 border-b pb-2">
            {trimmed.replace('# ', '')}
          </h1>
        );
      } else if (trimmed.startsWith('## ')) {
        elements.push(
          <h2 key={index} className="text-xl font-bold text-slate-800 dark:text-slate-100 my-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
            {trimmed.replace('## ', '')}
          </h2>
        );
      } else if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={index} className="text-base font-bold text-slate-700 dark:text-slate-200 my-2">
            {trimmed.replace('### ', '')}
          </h3>
        );
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        elements.push(
          <li key={index} className="mr-6 list-disc text-slate-700 dark:text-slate-300 my-1 text-xs">
            {trimmed.replace(/^[-*]\s+/, '')}
          </li>
        );
      } else if (trimmed.startsWith('> ')) {
        elements.push(
          <blockquote key={index} className="my-3 p-3 bg-primary/5 border-r-4 border-primary rounded-l-xl italic text-xs font-semibold text-slate-700">
            {trimmed.replace('> ', '')}
          </blockquote>
        );
      } else {
        // Parse bold, italic, u, mark, etc. if html tags exist
        if (trimmed.includes('<') && trimmed.includes('>')) {
          elements.push(
            <p
              key={index}
              dangerouslySetInnerHTML={{ __html: trimmed }}
              className="my-1.5 text-slate-700 dark:text-slate-300 text-xs leading-relaxed text-justify"
            />
          );
        } else {
          elements.push(
            <p key={index} className="my-1.5 text-slate-700 dark:text-slate-300 text-xs leading-relaxed text-justify">
              {trimmed}
            </p>
          );
        }
      }
    });

    return elements;
  };

  return (
    <div className="border border-outline-variant/40 rounded-2xl bg-white dark:bg-surface-dim overflow-hidden shadow-sm space-y-0 text-right">
      {/* ----------------------------------------------------------------------- */}
      {/* EDITOR TOP BAR & TOOLBAR */}
      {/* ----------------------------------------------------------------------- */}
      <div className="bg-surface-container-low border-b border-outline-variant/30 p-2.5 flex flex-wrap items-center justify-between gap-2">
        {/* Mode Switcher */}
        <div className="flex bg-surface-container p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'editor'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-sm">edit_note</span>
            <span>ویرایشگر متنی</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'preview'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-sm">visibility</span>
            <span>پیش‌نمایش زنده</span>
          </button>
        </div>

        {/* Formatting Buttons (Visible only in editor mode) */}
        {activeTab === 'editor' && (
          <div className="flex flex-wrap items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {/* Headings */}
            <div className="flex border-l border-outline-variant/30 pl-1 ml-1 gap-0.5">
              <button
                type="button"
                onClick={() => insertLineStart('# ')}
                title="تیتر اصلی (H1)"
                className="px-2 py-1 bg-surface-container hover:bg-surface-container-high rounded text-xs font-black text-on-surface"
              >
                H1
              </button>
              <button
                type="button"
                onClick={() => insertLineStart('## ')}
                title="تیتر فرعی (H2)"
                className="px-2 py-1 bg-surface-container hover:bg-surface-container-high rounded text-xs font-bold text-on-surface"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => insertLineStart('### ')}
                title="تیتر کوچک (H3)"
                className="px-2 py-1 bg-surface-container hover:bg-surface-container-high rounded text-xs font-semibold text-on-surface"
              >
                H3
              </button>
            </div>

            {/* Styling */}
            <div className="flex border-l border-outline-variant/30 pl-1 ml-1 gap-0.5">
              <button
                type="button"
                onClick={() => insertFormatting('<b>', '</b>')}
                title="برجسته (Bold)"
                className="p-1.5 hover:bg-surface-container-high rounded text-on-surface font-black"
              >
                <span className="material-symbols-outlined text-base">format_bold</span>
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('<i>', '</i>')}
                title="مورب (Italic)"
                className="p-1.5 hover:bg-surface-container-high rounded text-on-surface"
              >
                <span className="material-symbols-outlined text-base">format_italic</span>
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('<u>', '</u>')}
                title="خط زیرین (Underline)"
                className="p-1.5 hover:bg-surface-container-high rounded text-on-surface"
              >
                <span className="material-symbols-outlined text-base">format_underlined</span>
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('<mark class="bg-amber-200 px-1 rounded">', '</mark>')}
                title="هایلایت"
                className="p-1.5 hover:bg-surface-container-high rounded text-amber-700 font-bold"
              >
                <span className="material-symbols-outlined text-base">border_color</span>
              </button>
            </div>

            {/* Lists & Quote */}
            <div className="flex border-l border-outline-variant/30 pl-1 ml-1 gap-0.5">
              <button
                type="button"
                onClick={() => insertLineStart('- ')}
                title="لیست بالت‌دار"
                className="p-1.5 hover:bg-surface-container-high rounded text-on-surface"
              >
                <span className="material-symbols-outlined text-base">format_list_bulleted</span>
              </button>
              <button
                type="button"
                onClick={() => insertLineStart('1. ')}
                title="لیست شماره‌دار"
                className="p-1.5 hover:bg-surface-container-high rounded text-on-surface"
              >
                <span className="material-symbols-outlined text-base">format_list_numbered</span>
              </button>
              <button
                type="button"
                onClick={() => insertLineStart('> ')}
                title="نقل قول"
                className="p-1.5 hover:bg-surface-container-high rounded text-on-surface"
              >
                <span className="material-symbols-outlined text-base">format_quote</span>
              </button>
            </div>

            {/* Media Upload Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowImageModal(true)}
                className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 font-bold rounded-lg text-xs transition-all flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-base">add_photo_alternate</span>
                <span>افزودن تصویر</span>
              </button>

              <button
                type="button"
                onClick={() => setShowVideoModal(true)}
                className="px-3 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-800 font-bold rounded-lg text-xs transition-all flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-base">video_call</span>
                <span>افزودن ویدیو</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------------- */}
      {/* EDITOR / PREVIEW BODY */}
      {/* ----------------------------------------------------------------------- */}
      {activeTab === 'editor' ? (
        <textarea
          ref={textareaRef}
          rows={12}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-4 text-xs font-mono text-on-surface bg-transparent border-0 focus:ring-0 outline-none leading-relaxed resize-y min-h-[250px]"
          dir="rtl"
        ></textarea>
      ) : (
        <div className="p-6 min-h-[280px] max-h-[500px] overflow-y-auto space-y-2 bg-surface-container-lowest text-xs">
          {renderPreviewContent(value)}
        </div>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* MODAL: ADD IMAGE */}
      {/* ----------------------------------------------------------------------- */}
      {showImageModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-surface-dim w-full max-w-md rounded-3xl shadow-2xl p-6 text-right space-y-4 border border-outline-variant/30">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-lg">image</span>
                <span>درج تصویر در متن مقاله</span>
              </h3>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <MediaField
                label="تصویر مقاله"
                value={imageUrl}
                onChange={setImageUrl}
                accept="image"
                aspect="video"
                helperText="از کتابخانه رسانه انتخاب یا آپلود کنید"
              />

              <div>
                <label className="block font-bold mb-1">توضیح زیر عکس (Caption):</label>
                <input
                  type="text"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  placeholder="مثال: کلینیک روانشناسی و اتاق مشاوره فردی"
                  className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowImageModal(false)}
                  className="flex-1 py-2.5 rounded-xl border font-bold hover:bg-surface-container transition-all"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAddImage}
                  disabled={!imageUrl}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow transition-all disabled:opacity-50"
                >
                  درج در مقاله
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------------- */}
      {/* MODAL: ADD VIDEO */}
      {/* ----------------------------------------------------------------------- */}
      {showVideoModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-surface-dim w-full max-w-md rounded-3xl shadow-2xl p-6 text-right space-y-4 border border-outline-variant/30">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm text-sky-800 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-lg">movie</span>
                <span>درج ویدیو در متن مقاله</span>
              </h3>
              <button
                onClick={() => setShowVideoModal(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <MediaField
                label="ویدیو مقاله"
                value={videoUrl}
                onChange={setVideoUrl}
                accept="video"
                aspect="video"
                helperText="از کتابخانه انتخاب کنید یا لینک آپارات/یوتیوب وارد کنید"
              />

              <div>
                <label className="block font-bold mb-1">توضیح کوتاه ویدیو:</label>
                <input
                  type="text"
                  value={videoCaption}
                  onChange={(e) => setVideoCaption(e.target.value)}
                  placeholder="ویدیو آموزش تمرینات تنفس عمیق"
                  className="w-full p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowVideoModal(false)}
                  className="flex-1 py-2.5 rounded-xl border font-bold hover:bg-surface-container transition-all"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAddVideo}
                  disabled={!videoUrl}
                  className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow transition-all disabled:opacity-50"
                >
                  درج در مقاله
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
