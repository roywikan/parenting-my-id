import React, { useState, useRef, useMemo, useEffect } from 'react';
import { marked } from 'marked';
import { applyAutoLinks, calculateReadTime } from '../lib/autolink';
import { AutoLink } from '../types';
import { 
  Bold, Italic, Strikethrough, Heading1, Heading2, Heading3, 
  List, ListOrdered, CheckSquare, Quote, Code, Table, Minus, 
  Link as LinkIcon, Image as ImageIcon, Upload, Eye, Edit3, Columns, 
  Undo, Redo, Sparkles, CheckCircle2, RefreshCw, X, Copy, Check, FileText
} from 'lucide-react';

interface RichPostEditorProps {
  title: string;
  setTitle: (val: string) => void;
  slug: string;
  setSlug: (val: string) => void;
  category: string;
  setCategory: (val: string) => void;
  markdown: string;
  setMarkdown: (val: string) => void;
  excerpt: string;
  setExcerpt: (val: string) => void;
  featuredImage: string;
  setFeaturedImage: (val: string) => void;
  metaTitle: string;
  setMetaTitle: (val: string) => void;
  metaDesc: string;
  setMetaDesc: (val: string) => void;
  tags: string;
  setTags: (val: string) => void;
  autoSaveStatus: 'saved' | 'saving' | 'dirty';
  isAiLoading: boolean;
  onAiGenerateMeta: () => void;
  onPublishSubmit: (status: 'draft' | 'published') => void;
  uploadingImage: boolean;
  onImageUpload: (file: File) => Promise<string | null>;
  autolinks: AutoLink[];
}

export default function RichPostEditor({
  title,
  setTitle,
  slug,
  setSlug,
  category,
  setCategory,
  markdown,
  setMarkdown,
  excerpt,
  setExcerpt,
  featuredImage,
  setFeaturedImage,
  metaTitle,
  setMetaTitle,
  metaDesc,
  setMetaDesc,
  tags,
  setTags,
  autoSaveStatus,
  isAiLoading,
  onAiGenerateMeta,
  onPublishSubmit,
  uploadingImage,
  onImageUpload,
  autolinks,
}: RichPostEditorProps) {
  // Editor view modes: 'write' | 'split' | 'preview'
  const [viewMode, setViewMode] = useState<'write' | 'split' | 'preview'>('split');
  
  // Textarea Ref
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Modals state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');

  // Undo / Redo History Stack
  const historyRef = useRef<string[]>([markdown]);
  const historyIndexRef = useRef<number>(0);

  // Update undo stack
  const updateMarkdownWithHistory = (newVal: string) => {
    setMarkdown(newVal);
    // Push to history stack if different
    if (historyRef.current[historyIndexRef.current] !== newVal) {
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
      historyRef.current.push(newVal);
      historyIndexRef.current = historyRef.current.length - 1;
    }
  };

  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      setMarkdown(historyRef.current[historyIndexRef.current]);
    }
  };

  const handleRedo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      setMarkdown(historyRef.current[historyIndexRef.current]);
    }
  };

  // Selection-aware formatting wrapper
  const applyFormatting = (prefix: string, suffix: string = '', defaultText: string = 'Teks Baru') => {
    if (!textareaRef.current) {
      const updated = `${markdown}\n${prefix}${defaultText}${suffix}`;
      updateMarkdownWithHistory(updated);
      return;
    }

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    let insertContent = '';
    let cursorStart = start;
    let cursorEnd = end;

    if (selectedText.length > 0) {
      insertContent = `${prefix}${selectedText}${suffix}`;
      cursorStart = start + prefix.length;
      cursorEnd = cursorStart + selectedText.length;
    } else {
      insertContent = `${prefix}${defaultText}${suffix}`;
      cursorStart = start + prefix.length;
      cursorEnd = cursorStart + defaultText.length;
    }

    const fullText = textarea.value.substring(0, start) + insertContent + textarea.value.substring(end);
    updateMarkdownWithHistory(fullText);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(cursorStart, cursorEnd);
      }
    }, 10);
  };

  // Clean formatting from selected text
  const cleanFormatting = () => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    if (!selectedText) return;

    // Strip common markdown characters
    const cleaned = selectedText.replace(/[\*\_~`#>-]/g, '').trim();
    const fullText = textarea.value.substring(0, start) + cleaned + textarea.value.substring(end);
    updateMarkdownWithHistory(fullText);
  };

  // Insert Link Action
  const handleInsertLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl) return;
    const textToUse = linkText.trim() || 'Link Artikel';
    const formatted = `[${textToUse}](${linkUrl.trim()})`;
    
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const fullText = textarea.value.substring(0, start) + formatted + textarea.value.substring(end);
      updateMarkdownWithHistory(fullText);
    } else {
      updateMarkdownWithHistory(`${markdown}\n${formatted}`);
    }

    setShowLinkModal(false);
    setLinkText('');
    setLinkUrl('');
  };

  // Insert Image Action
  const handleInsertImage = (url: string, altText: string) => {
    if (!url) return;
    const formatted = `\n\n![${altText || 'Gambar Artikel'}](${url})\n\n`;
    
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const fullText = textarea.value.substring(0, start) + formatted + textarea.value.substring(end);
      updateMarkdownWithHistory(fullText);
    } else {
      updateMarkdownWithHistory(`${markdown}${formatted}`);
    }

    setShowImageModal(false);
    setImageUrl('');
    setImageAlt('');
  };

  // Upload image file handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadedUrl = await onImageUpload(file);
    if (uploadedUrl) {
      handleInsertImage(uploadedUrl, file.name);
    }
  };

  // Insert Table
  const insertTable = () => {
    const tableTemplate = `\n\n| Judul Kolom 1 | Judul Kolom 2 | Judul Kolom 3 |\n| --- | --- | --- |\n| Isi Baris 1 | Detail A | Catatan 1 |\n| Isi Baris 2 | Detail B | Catatan 2 |\n\n`;
    applyFormatting('', '', tableTemplate);
  };

  // HTML Preview Renderer with Auto-Links
  const parsedPreviewHtml = useMemo(() => {
    if (!markdown) return '';
    let rawHtml = marked.parse(markdown, { async: false }) as string;

    // Inject id attributes into <h2> and <h3> tags for TOC
    rawHtml = rawHtml.replace(/<(h[23])>(.*?)<\/\1>/gi, (match, tag, content) => {
      const cleanText = content.replace(/<[^>]+>/g, '').trim();
      if (!cleanText || cleanText.length > 120) return match;
      const id = cleanText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return `<${tag} id="${id}" class="scroll-mt-24">${content}</${tag}>`;
    });

    return applyAutoLinks(rawHtml, autolinks);
  }, [markdown, autolinks]);

  // Article Real-time Statistics
  const stats = useMemo(() => {
    const text = markdown.trim();
    if (!text) return { words: 0, chars: 0, readTime: 1, paragraphs: 0 };
    const words = text.split(/\s+/).filter(Boolean).length;
    const chars = text.length;
    const paragraphs = text.split(/\n\s*\n/).filter(Boolean).length;
    const readTime = calculateReadTime(text);
    return { words, chars, readTime, paragraphs };
  }, [markdown]);

  return (
    <div className="space-y-6">
      
      {/* ------------------------------------------------------------- */}
      {/* EDITOR CONTROL BAR & STATUS */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 text-white p-4 rounded-3xl shadow-md border border-slate-800">
        
        {/* VIEW MODE TOGGLE */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-2xl border border-slate-700">
          <button
            type="button"
            onClick={() => setViewMode('write')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'write' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Tulis</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'split' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Bagi Layar</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'preview' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Pratinjau</span>
          </button>
        </div>

        {/* AUTO-SAVE STATUS INDICATOR */}
        <div className="hidden sm:flex items-center gap-2">
          {autoSaveStatus === 'saved' && (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/80 px-3 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" /> Draf Tersimpan di Cloudflare D1
            </span>
          )}
          {autoSaveStatus === 'saving' && (
            <span className="inline-flex items-center gap-1.5 text-xs text-amber-300 font-semibold bg-amber-950/60 border border-amber-800/80 px-3 py-1 rounded-full animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Menyimpan draf...
            </span>
          )}
          {autoSaveStatus === 'dirty' && (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 px-3 py-1">
              Perubahan belum disimpan...
            </span>
          )}
        </div>

        {/* SAVE & PUBLISH ACTION BUTTONS */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPublishSubmit('draft')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700 transition-colors border border-slate-700"
          >
            Simpan Draf
          </button>
          <button
            type="button"
            onClick={() => onPublishSubmit('published')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white text-xs font-bold hover:from-rose-500 hover:to-pink-500 shadow-md transition-all"
          >
            Publikasikan Artikel 🚀
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MAIN CONTENT EDITOR SECTION */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* EDITOR AREA (8 COLS) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
            
            {/* TITLE FIELD */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Judul Artikel Parenting
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Panduan Lengkap Pola Asuh Demokratis Anak..."
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-lg font-extrabold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all placeholder:font-normal placeholder:text-slate-400"
              />
            </div>

            {/* SLUG & CATEGORY */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="panduan-pola-asuh-demokratis"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kategori Artikel
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="Pola Asuh">Pola Asuh</option>
                  <option value="Tumbuh Kembang">Tumbuh Kembang</option>
                  <option value="Kesehatan & Gizi">Kesehatan & Gizi</option>
                  <option value="Psikologi Ibu">Psikologi Ibu</option>
                </select>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* PROFESSIONAL WYSIWYG MARKDOWN TOOLBAR */}
            {/* ------------------------------------------------------------- */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-2 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-1 border-b border-slate-200 dark:border-slate-700 pb-2">
                
                {/* TEXT FORMATTING GROUP */}
                <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => applyFormatting('**', '**', 'teks tebal')}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                    title="Cetak Tebal / Bold (**teks**)"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormatting('*', '*', 'teks miring')}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                    title="Cetak Miring / Italic (*teks*)"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormatting('~~', '~~', 'teks dicoret')}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                    title="Coret / Strikethrough (~~teks~~)"
                  >
                    <Strikethrough className="w-4 h-4" />
                  </button>
                </div>

                {/* HEADINGS GROUP */}
                <div className="flex items-center gap-0.5 px-2 border-r border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => applyFormatting('# ', '', 'Judul Utama (H1)')}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors text-xs font-extrabold"
                    title="Judul Utama (H1)"
                  >
                    <Heading1 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormatting('## ', '', 'Subjudul Bagian (H2)')}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors text-xs font-bold"
                    title="Subjudul Bagian (H2)"
                  >
                    <Heading2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormatting('### ', '', 'Subjudul Kecil (H3)')}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors text-xs font-bold"
                    title="Subjudul Kecil (H3)"
                  >
                    <Heading3 className="w-4 h-4" />
                  </button>
                </div>

                {/* LISTS GROUP */}
                <div className="flex items-center gap-0.5 px-2 border-r border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => applyFormatting('- ', '', 'Poin item')}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                    title="Daftar Poin / Bullet List (-)"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormatting('1. ', '', 'Langkah pertama')}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                    title="Daftar Angka / Numbered List (1.)"
                  >
                    <ListOrdered className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormatting('- [ ] ', '', 'Tugas selesai')}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                    title="Checklist (- [ ])"
                  >
                    <CheckSquare className="w-4 h-4" />
                  </button>
                </div>

                {/* BLOCKS & STRUCTURE GROUP */}
                <div className="flex items-center gap-0.5 px-2 border-r border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => applyFormatting('> ', '', 'Kutipan mutiara parenting')}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                    title="Kutipan / Blockquote (>)"
                  >
                    <Quote className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormatting('```\n', '\n```', 'kode_atau_skrip')}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                    title="Blok Kode (```)"
                  >
                    <Code className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={insertTable}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                    title="Sisipkan Tabel Markdown"
                  >
                    <Table className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormatting('\n\n---\n\n', '')}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                    title="Garis Pemisah Horizontal (---)"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>

                {/* MEDIA & LINK GROUP */}
                <div className="flex items-center gap-1 pl-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (textareaRef.current) {
                        const start = textareaRef.current.selectionStart;
                        const end = textareaRef.current.selectionEnd;
                        setLinkText(textareaRef.current.value.substring(start, end));
                      }
                      setShowLinkModal(true);
                    }}
                    className="px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 font-bold text-xs hover:bg-rose-100 transition-colors flex items-center gap-1"
                    title="Sisipkan Hyperlink Tautan"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Tautan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowImageModal(true)}
                    className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-100 transition-colors flex items-center gap-1"
                    title="Sisipkan / Upload Gambar Artikel"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Gambar</span>
                  </button>
                </div>

                {/* HISTORY UNDO/REDO & CLEAR */}
                <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-2">
                  <button
                    type="button"
                    onClick={handleUndo}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                    title="Undo (Urungkan)"
                  >
                    <Undo className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRedo}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                    title="Redo (Ulangi)"
                  >
                    <Redo className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={cleanFormatting}
                    className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-rose-600 rounded"
                    title="Bersihkan Format pada Teks Terpilih"
                  >
                    Bersihkan
                  </button>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* EDITOR VIEWPORTS (WRITE / SPLIT / PREVIEW) */}
            {/* ------------------------------------------------------------- */}
            <div className="min-h-[420px]">
              
              {/* WRITE MODE */}
              {viewMode === 'write' && (
                <div>
                  <textarea
                    ref={textareaRef}
                    rows={18}
                    value={markdown}
                    onChange={(e) => updateMarkdownWithHistory(e.target.value)}
                    placeholder="Tulis artikel parenting lengkap dengan format markdown di sini..."
                    className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 font-mono text-sm leading-relaxed text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              )}

              {/* SPLIT VIEW MODE (EDITOR LEFT, PREVIEW RIGHT) */}
              {viewMode === 'split' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Editor Markdown
                    </div>
                    <textarea
                      ref={textareaRef}
                      rows={18}
                      value={markdown}
                      onChange={(e) => updateMarkdownWithHistory(e.target.value)}
                      placeholder="Tulis konten artikel di sini..."
                      className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 font-mono text-xs leading-relaxed text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600 mb-1 flex items-center justify-between">
                      <span>Pratinjau Hasil Real-Time (Live)</span>
                      <span className="text-[9px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                        Auto-Links Active
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 max-h-[440px] overflow-y-auto prose prose-rose dark:prose-invert prose-xs text-slate-800 dark:text-slate-200">
                      <div dangerouslySetInnerHTML={{ __html: parsedPreviewHtml || '<p class="text-slate-400 italic">Pratinjau artikel akan muncul di sini saat Anda mengetik...</p>' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* FULL PREVIEW MODE */}
              {viewMode === 'preview' && (
                <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
                  <div className="border-b pb-4">
                    <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 font-bold text-xs">
                      {category}
                    </span>
                    <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
                      {title || 'Judul Artikel'}
                    </h1>
                    {excerpt && (
                      <p className="text-slate-600 italic border-l-4 border-rose-500 pl-3 py-1 mt-2 text-sm">
                        "{excerpt}"
                      </p>
                    )}
                  </div>

                  {featuredImage && (
                    <img
                      src={featuredImage}
                      alt={title}
                      className="w-full max-h-80 object-cover rounded-2xl"
                    />
                  )}

                  <div
                    className="prose prose-rose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: parsedPreviewHtml }}
                  />
                </div>
              )}
            </div>

            {/* ------------------------------------------------------------- */}
            {/* CONTENT EDITOR STATS BAR */}
            {/* ------------------------------------------------------------- */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-4">
                <span>📝 <strong>{stats.words}</strong> Kata</span>
                <span>•</span>
                <span>🔤 <strong>{stats.chars}</strong> Karakter</span>
                <span>•</span>
                <span>📄 <strong>{stats.paragraphs}</strong> Paragraf</span>
              </div>
              <div>
                ⏱️ Estimasi Waktu Baca: <strong className="text-rose-600">{stats.readTime} Menit</strong>
              </div>
            </div>

          </div>
        </div>

        {/* SIDEBAR METADATA & GEMINI AI (4 COLS) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* AI GEMINI ASSISTANT CARD */}
          <div className="bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-3xl p-6 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                Parenting AI Assistant
              </span>
            </div>
            <p className="text-xs text-rose-100 leading-relaxed">
              Otomatis buatkan Meta Title, Meta Description, Ringkasan, & Tag SEO menggunakan Gemini AI.
            </p>
            <button
              type="button"
              onClick={onAiGenerateMeta}
              disabled={isAiLoading || !title}
              className="w-full py-2.5 rounded-xl bg-white text-rose-600 font-bold text-xs shadow-sm hover:bg-rose-50 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isAiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-rose-600" />}
              <span>Generate SEO Meta dengan AI</span>
            </button>
          </div>

          {/* METADATA & EXCERPT CARD */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Meta SEO & Gambar Sampul
            </h4>

            {/* FEATURED IMAGE */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                URL Gambar Sampul (Featured Image)
              </label>
              <input
                type="text"
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono"
              />
              {featuredImage && (
                <img
                  src={featuredImage}
                  alt="Preview"
                  className="mt-2 w-full h-32 object-cover rounded-xl border border-slate-200 dark:border-slate-800"
                />
              )}
            </div>

            {/* EXCERPT */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Ringkasan Artikel (Excerpt)
              </label>
              <textarea
                rows={3}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Ringkasan singkat artikel untuk kartu di halaman depan..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs leading-relaxed"
              />
            </div>

            {/* META TITLE */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Meta Title SEO
              </label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Judul khusus untuk Google Search..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
              />
            </div>

            {/* META DESC */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Meta Description SEO
              </label>
              <textarea
                rows={2}
                value={metaDesc}
                onChange={(e) => setMetaDesc(e.target.value)}
                placeholder="Deskripsi pencarian Google..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
              />
            </div>

            {/* TAGS */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Kata Kunci / Tag (Pisahkan dengan koma)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="pola asuh, balita, gizi anak"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
              />
            </div>

          </div>

        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL INSERT LINK */}
      {/* ------------------------------------------------------------- */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-rose-600" />
                <span>Sisipkan Tautan Hyperlink</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInsertLink} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Teks Tautan (Anchor Text)
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Contoh: Baca panduan pola asuh balita"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  URL Tujuan (Link)
                </label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://parenting.my.id/baca/..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700"
                >
                  Sisipkan Tautan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL INSERT IMAGE */}
      {/* ------------------------------------------------------------- */}
      {showImageModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <span>Sisipkan Gambar Artikel</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* TAB MODE SWITCHER */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setImageTab('upload')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  imageTab === 'upload' ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Upload ke GitHub
              </button>
              <button
                type="button"
                onClick={() => setImageTab('url')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  imageTab === 'url' ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                URL Gambar Direct
              </button>
            </div>

            {imageTab === 'upload' ? (
              <div className="space-y-4 py-2">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Upload file gambar langsung ke repositori GitHub `roywikan/parenting-my-id` melalui REST API.
                </p>
                <label className="cursor-pointer block border-2 border-dashed border-rose-300 dark:border-rose-900 rounded-2xl p-6 text-center hover:bg-rose-50/50 transition-colors">
                  <Upload className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                  <span className="text-xs font-bold text-rose-600 block">
                    {uploadingImage ? 'Mengunggah ke GitHub...' : 'Pilih File Gambar dari Komputer'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Format PNG, JPG, WebP (Max 5MB)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleInsertImage(imageUrl, imageAlt);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    URL Gambar
                  </label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Deskripsi / Alt Text
                  </label>
                  <input
                    type="text"
                    value={imageAlt}
                    onChange={(e) => setImageAlt(e.target.value)}
                    placeholder="Contoh: Ilustrasi balita bermain sensory play"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                {imageUrl && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">Pratinjau Gambar:</span>
                    <img src={imageUrl} alt="Preview" className="w-full h-32 object-cover rounded-xl border" />
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowImageModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700"
                  >
                    Sisipkan Gambar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
