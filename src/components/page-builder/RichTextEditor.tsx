import React, { useEffect, useState } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Image from '@tiptap/extension-image';
import { MediaPicker } from '../media/MediaPicker';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  compact?: boolean;
  allowSource?: boolean;
}

interface ToolbarButtonProps {
  icon: string;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

const VIDEO_EXT = /\.(mp4|webm|ogg|mov)(\?|$)/i;

const Video = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
      controls: { default: true },
    };
  },
  parseHTML() {
    return [{ tag: 'video[src]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'video',
      mergeAttributes(HTMLAttributes, {
        controls: 'true',
        class: 'rich-text-video',
      }),
    ];
  },
  addCommands() {
    return {
      setVideo:
        (options: { src: string }) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { src: options.src, controls: true },
          }),
    };
  },
});

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    video: {
      setVideo: (options: { src: string }) => ReturnType;
    };
  }
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon,
  label,
  active,
  disabled,
  onClick,
}) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    aria-pressed={active}
    disabled={disabled}
    onMouseDown={(event) => event.preventDefault()}
    onClick={onClick}
    className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-1.5 transition-colors disabled:opacity-30 ${
      active
        ? 'bg-primary text-white'
        : 'text-slate-600 hover:bg-primary/10 hover:text-primary dark:text-slate-300'
    }`}
  >
    <span className="material-symbols-outlined text-[18px]">{icon}</span>
  </button>
);

function setLink(editor: Editor) {
  const current = editor.getAttributes('link').href as string | undefined;
  const href = window.prompt('آدرس لینک را وارد کنید:', current || 'https://');
  if (href === null) return;
  if (!href.trim()) {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }
  editor.chain().focus().extendMarkRange('link').setLink({ href: href.trim() }).run();
}

function insertMedia(editor: Editor, url: string) {
  const src = url.trim();
  if (!src) return;
  if (VIDEO_EXT.test(src)) {
    editor.chain().focus().setVideo({ src }).run();
    return;
  }
  editor.chain().focus().setImage({ src }).run();
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  compact = false,
  allowSource = false,
}) => {
  const [sourceMode, setSourceMode] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: 'https',
        },
      }),
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: 'rich-text-image',
        },
      }),
      Video,
    ],
    content: value || '<p></p>',
    editorProps: {
      attributes: {
        class: `rich-text-content outline-none ${compact ? 'min-h-[140px]' : 'min-h-[220px]'}`,
        dir: 'rtl',
      },
    },
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML()),
  });

  useEffect(() => {
    if (!editor || sourceMode || editor.getHTML() === value) return;
    editor.commands.setContent(value || '<p></p>', { emitUpdate: false });
  }, [editor, sourceMode, value]);

  if (!editor) return null;

  const button = (
    icon: string,
    label: string,
    action: () => void,
    active = false,
    disabled = false
  ) => (
    <ToolbarButton
      key={label}
      icon={icon}
      label={label}
      active={active}
      disabled={disabled}
      onClick={action}
    />
  );

  return (
    <div
      className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-white dark:bg-slate-900"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex flex-wrap items-center gap-1 border-b border-outline-variant/30 bg-slate-50 p-2 dark:bg-slate-800">
        {!sourceMode && (
          <>
            {button('format_bold', 'پررنگ', () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
            {button('format_italic', 'مورب', () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
            {button('format_underlined', 'زیرخط', () => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'))}
            {button('strikethrough_s', 'خط‌خورده', () => editor.chain().focus().toggleStrike().run(), editor.isActive('strike'))}
            <span className="mx-0.5 h-6 w-px bg-outline-variant/40" />
            {button('title', 'عنوان بزرگ', () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }))}
            {button('format_h3', 'عنوان کوچک', () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }))}
            {button('notes', 'پاراگراف', () => editor.chain().focus().setParagraph().run(), editor.isActive('paragraph'))}
            <span className="mx-0.5 h-6 w-px bg-outline-variant/40" />
            {button('format_list_bulleted', 'فهرست نقطه‌ای', () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
            {button('format_list_numbered', 'فهرست شماره‌دار', () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}
            {button('format_quote', 'نقل‌قول', () => editor.chain().focus().toggleBlockquote().run(), editor.isActive('blockquote'))}
            <span className="mx-0.5 h-6 w-px bg-outline-variant/40" />
            {button('format_align_right', 'راست‌چین', () => editor.chain().focus().setTextAlign('right').run(), editor.isActive({ textAlign: 'right' }))}
            {button('format_align_center', 'وسط‌چین', () => editor.chain().focus().setTextAlign('center').run(), editor.isActive({ textAlign: 'center' }))}
            {button('format_align_left', 'چپ‌چین', () => editor.chain().focus().setTextAlign('left').run(), editor.isActive({ textAlign: 'left' }))}
            {button('link', 'افزودن لینک', () => setLink(editor), editor.isActive('link'))}
            {button('link_off', 'حذف لینک', () => editor.chain().focus().unsetLink().run(), false, !editor.isActive('link'))}
            {button('add_photo_alternate', 'درج رسانه', () => setMediaOpen(true), editor.isActive('image') || editor.isActive('video'))}
            <label
              className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-600 hover:bg-primary/10 hover:text-primary dark:text-slate-300"
              title="رنگ متن"
            >
              <span className="material-symbols-outlined text-[18px]">format_color_text</span>
              <input
                type="color"
                value={String(editor.getAttributes('textStyle').color || '#191c1d')}
                onChange={(event) => editor.chain().focus().setColor(event.target.value).run()}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label="رنگ متن"
              />
            </label>
            {button('format_color_reset', 'حذف رنگ', () => editor.chain().focus().unsetColor().run())}
            <span className="mx-0.5 h-6 w-px bg-outline-variant/40" />
            {button('undo', 'بازگردانی', () => editor.chain().focus().undo().run(), false, !editor.can().undo())}
            {button('redo', 'انجام دوباره', () => editor.chain().focus().redo().run(), false, !editor.can().redo())}
          </>
        )}
        {allowSource && (
          <button
            type="button"
            onClick={() => setSourceMode((current) => !current)}
            className={`mr-auto rounded-lg px-2.5 py-1.5 text-[10px] font-black ${
              sourceMode ? 'bg-primary text-white' : 'text-slate-600 hover:bg-primary/10 dark:text-slate-300'
            }`}
          >
            {sourceMode ? 'ویرایش دیداری' : 'HTML'}
          </button>
        )}
      </div>

      {sourceMode ? (
        <textarea
          rows={compact ? 8 : 12}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          dir="ltr"
          spellCheck={false}
          className="w-full resize-y bg-transparent p-4 font-mono text-xs leading-6 outline-none"
        />
      ) : (
        <EditorContent editor={editor} className={compact ? 'p-4' : 'p-5'} />
      )}

      <MediaPicker
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        accept="all"
        title="درج رسانه در متن"
        onSelect={(url) => {
          insertMedia(editor, url);
          setMediaOpen(false);
        }}
      />
    </div>
  );
};
