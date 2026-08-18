import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react';
import { NodeViewWrapper } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Node } from '@tiptap/core';
import imageCompression from 'browser-image-compression';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Heading1, Heading2, Heading3,
  ImagePlus, Quote, Code, Undo2, Redo2, Minus, Trash2, Upload,
  AlignStartVertical, PanelLeft, PanelRight, Loader2
} from 'lucide-react';

const MAX_FILE_SIZE_MB = 4.5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const COMPRESS_TARGET_SIZE_MB = 1;

function postProcessImageHTML(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('p').forEach(p => {
    const wrap = p.querySelector('div[data-image-wrap]');
    if (wrap && p.childNodes.length === 1) {
      p.replaceWith(wrap);
    }
  });
  return doc.body.innerHTML;
}

async function compressImage(file: File): Promise<File> {
  if (file.size <= MAX_FILE_SIZE_BYTES) return file;
  const compressed = await imageCompression(file, {
    maxSizeMB: COMPRESS_TARGET_SIZE_MB,
    maxWidthOrHeight: 2048,
    useWebWorker: true,
  });
  return new File([compressed], file.name, { type: compressed.type });
}

function ImageNodeView({ node, updateAttributes, deleteNode }: {
  node: any;
  updateAttributes: (attrs: Record<string, any>) => void;
  deleteNode: () => void;
}) {
  const [width, setWidth] = useState(node.attrs.width || '100%');
  const [imgError, setImgError] = useState(false);
  const widthRef = useRef(node.attrs.width || '100%');
  const imgRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const rafId = useRef(0);

  const position = (node.attrs.position || 'center') as 'left' | 'center' | 'right';

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startX.current = e.clientX;
    startWidth.current = imgRef.current?.offsetWidth || 300;

    const handleMove = (ev: MouseEvent) => {
      const diff = ev.clientX - startX.current;
      const parentW = imgRef.current?.parentElement?.offsetWidth || 600;
      const newWidthPx = Math.max(80, Math.min(parentW, startWidth.current + diff));
      const pct = Math.round((newWidthPx / parentW) * 100);
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        widthRef.current = `${pct}%`;
        setWidth(widthRef.current);
      });
    };

    const handleUp = () => {
      cancelAnimationFrame(rafId.current);
      updateAttributes({ width: widthRef.current });
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  const setPosition = (pos: 'left' | 'center' | 'right') => {
    if (pos === 'center') {
      updateAttributes({ position: 'center', width: '100%' });
      setWidth('100%');
      widthRef.current = '100%';
    } else {
      const newWidth = width === '100%' ? '40%' : width;
      updateAttributes({ position: pos, width: newWidth });
    }
  };

  const floatClass = position === 'left'
    ? 'float-left mr-4 mb-3'
    : position === 'right'
    ? 'float-right ml-4 mb-3'
    : 'clear-both';

  const widthStyle = position === 'center' ? { width: '100%' } : { width };

  const PosBtn = ({ pos, icon: Icon, label }: { pos: 'left' | 'center' | 'right'; icon: any; label: string }) => (
    <button
      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setPosition(pos); }}
      title={label}
      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold transition-colors cursor-pointer ${
        position === pos
          ? 'bg-teal-500/30 text-teal-300 border border-teal-500/50'
          : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
      }`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </button>
  );

  return (
    <NodeViewWrapper className={`group ${position !== 'center' ? '' : 'my-3'}`}>
      <div
        ref={imgRef}
        className={`relative rounded-xl overflow-hidden border border-slate-700/50 bg-slate-900/50 ${floatClass}`}
        style={widthStyle}
      >
        <div className="flex items-center gap-1 px-2 py-1 bg-slate-800/90 border-b border-slate-700/50">
          <PosBtn pos="center" icon={AlignStartVertical} label="Above" />
          <PosBtn pos="left" icon={PanelLeft} label="Float left" />
          <PosBtn pos="right" icon={PanelRight} label="Float right" />
          <div className="flex-1" />
          <button
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); deleteNode(); }}
            className="p-0.5 hover:bg-rose-500/20 rounded cursor-pointer"
            title="Delete image"
          >
            <Trash2 className="w-3 h-3 text-rose-400" />
          </button>
        </div>
        {node.attrs.src ? (
          imgError ? (
            <div className="flex items-center gap-2 px-3 py-4 bg-slate-800/50 text-rose-400 text-xs">
              <span>Image failed to load</span>
              <button
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); deleteNode(); }}
                className="text-[9px] underline hover:text-rose-300 cursor-pointer"
              >
                Remove
              </button>
            </div>
          ) : (
            <img
              src={node.attrs.src}
              alt={node.attrs.alt || ''}
              className="w-full h-auto block"
              draggable={false}
              onError={() => setImgError(true)}
            />
          )
        ) : (
          <div className="flex items-center gap-2 px-3 py-4 bg-slate-800/50 text-slate-500 text-xs">
            No image source
          </div>
        )}
        <div
          onMouseDown={handleResizeStart}
          className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize bg-teal-500/60 rounded-tl-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          title="Drag to resize"
        >
          <svg className="w-3 h-3 text-white" viewBox="0 0 12 12"><path d="M11 1L1 11M11 5L5 11M11 9L9 11" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
        </div>
      </div>
    </NodeViewWrapper>
  );
}

const DraggableImage = Node.create({
  name: 'image',
  group: 'block',
  draggable: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: { default: '100%' },
      position: { default: 'center' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-image-wrap]',
        getAttrs: (el) => {
          if (typeof el === 'string') return false;
          const img = el.querySelector('img');
          if (!img) return false;
          const pos = el.getAttribute('data-position') || 'center';
          return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt'),
            title: img.getAttribute('title'),
            width: el.getAttribute('data-width') || '100%',
            position: pos,
          };
        },
      },
      {
        tag: 'figure',
        getAttrs: (el) => {
          if (typeof el === 'string') return false;
          const img = el.querySelector('img');
          if (!img) return false;
          const style = el.getAttribute('style') || '';
          const wMatch = style.match(/width:\s*([^;]+)/);
          const fMatch = style.match(/float:\s*(left|right)/);
          return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt'),
            title: img.getAttribute('title'),
            width: wMatch ? wMatch[1].trim() : '100%',
            position: fMatch ? fMatch[1] : 'center',
          };
        },
      },
      { tag: 'img[src]' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { position, width, src, alt, title } = HTMLAttributes;
    const imgAttrs: Record<string, any> = { src, alt, title, style: 'max-width:100%;height:auto;display:block' };
    const wrapperStyle: string[] = [];
    if (width && width !== '100%') wrapperStyle.push(`width:${width}`);
    if (position === 'left') {
      wrapperStyle.push('float:left', 'margin:0 1em 1em 0');
    } else if (position === 'right') {
      wrapperStyle.push('float:right', 'margin:0 0 1em 1em');
    }
    return ['div', { 'data-image-wrap': '', 'data-position': position, 'data-width': width, style: wrapperStyle.join(';') || undefined }, ['img', imgAttrs]];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  uploadImage?: (file: File) => Promise<string | null>;
  minHeight?: string;
}

export default function RichTextEditor({ content, onChange, placeholder, uploadImage, minHeight = '200px' }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<any>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const processAndUpload = useCallback(async (file: File) => {
    if (!uploadImage || !editorRef.current) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      const processed = file.size > MAX_FILE_SIZE_BYTES ? await compressImage(file) : file;
      const url = await uploadImage(processed);
      if (url) {
        editorRef.current.chain().focus().insertContent({ type: 'image', attrs: { src: url, width: '100%' } }).run();
      } else {
        setUploadError('Upload returned no URL');
      }
    } catch (err: any) {
      console.error('Image upload failed:', err);
      setUploadError(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [uploadImage]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        dropcursor: { color: '#14b8a6', width: 2 },
      }),
      DraggableImage.configure({
        inline: false,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Start writing...',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(postProcessImageHTML(editor.getHTML()));
    },
    editorProps: {
      attributes: {
        style: `min-height: ${minHeight}; padding: 1rem; outline: none;`,
        class: 'prose prose-invert prose-sm max-w-none focus:outline-none',
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
              event.preventDefault();
              processAndUpload(file);
              return true;
            }
          }
        }
        return false;
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (!files) return false;
        for (const file of files) {
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            processAndUpload(file);
            return true;
          }
        }
        return false;
      },
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content]);

  const handleImageUpload = () => {
    if (!uploadImage || !fileInputRef.current) return;
    fileInputRef.current.click();
  };

  const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processAndUpload(file);
    e.target.value = '';
  };

  const addImageFromUrl = () => {
    const url = window.prompt('Enter image URL:');
    if (url && editor) {
      editor.chain().focus().insertContent({ type: 'image', attrs: { src: url, width: '100%' } }).run();
    }
  };

  if (!editor) return null;

  const ToolBtn = ({ onClick, active, disabled, children, title }: any) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
        active ? 'bg-teal-500/20 text-teal-300' : 'text-slate-400 hover:text-white hover:bg-slate-800'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );

  const Divider = () => <div className="w-px h-5 bg-slate-700 mx-0.5" />;

  return (
    <div className="bg-[#0B111E] border border-slate-700/80 rounded-xl overflow-hidden focus-within:border-teal-400/50 transition-all">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-800 bg-slate-900/50 flex-wrap">
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
          <Bold className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
          <Italic className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
          <UnderlineIcon className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
          <Strikethrough className="w-3.5 h-3.5" />
        </ToolBtn>

        <Divider />

        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
          <Heading1 className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <Heading2 className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
          <Heading3 className="w-3.5 h-3.5" />
        </ToolBtn>

        <Divider />

        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
          <List className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List">
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote">
          <Quote className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">
          <Code className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
          <Minus className="w-3.5 h-3.5" />
        </ToolBtn>

        <Divider />

        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left">
          <AlignLeft className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center">
          <AlignCenter className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right">
          <AlignRight className="w-3.5 h-3.5" />
        </ToolBtn>

        <Divider />

        <ToolBtn onClick={addImageFromUrl} title="Insert Image from URL">
          <ImagePlus className="w-3.5 h-3.5" />
        </ToolBtn>
        {uploadImage && (
          <ToolBtn onClick={handleImageUpload} disabled={uploading} title="Upload Image from Computer">
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          </ToolBtn>
        )}

        <div className="flex-1" />

        <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
          <Undo2 className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
          <Redo2 className="w-3.5 h-3.5" />
        </ToolBtn>
      </div>

      {uploadError && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border-b border-rose-500/20 text-rose-400 text-[10px]">
          <span>{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="ml-auto hover:text-rose-300 cursor-pointer">&times;</button>
        </div>
      )}

      {/* Editor */}
      <EditorContent editor={editor} className="text-xs text-white" />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={onFileSelect}
        className="hidden"
      />
    </div>
  );
}
