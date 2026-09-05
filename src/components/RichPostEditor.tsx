import React, { useState, useRef, useMemo, useEffect } from 'react';
import { marked } from 'marked';
import { applyAutoLinks, calculateReadTime, preprocessMarkdownLineBreaks, renderResponsiveVideoEmbeds } from '../lib/autolink';
import { sanitizeAndOptimizeImageUrl, sanitizeMarkdownImageUrls } from '../lib/imageUtils';
import { AutoLink, User, PostRevision, UserRole, PostStatus } from '../types';
import SeoAuditWidget from './SeoAuditWidget';
import { 
  Bold, Italic, Strikethrough, Heading1, Heading2, Heading3, 
  List, ListOrdered, CheckSquare, Quote, Code, Table, Minus, 
  Link as LinkIcon, Link2, Image as ImageIcon, Upload, Eye, Edit3, Columns, 
  Undo, Redo, Sparkles, CheckCircle2, RefreshCw, X, Copy, Check, FileText,
  Users, History, RotateCcw, Award, ShieldCheck, Send, AlertTriangle, AlertCircle, ThumbsUp, XCircle, Video
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
  onPublishSubmit: (status: PostStatus, rejectionReason?: string) => void;
  uploadingImage: boolean;
  onImageUpload: (file: File) => Promise<string | null>;
  autolinks: AutoLink[];
  writers?: User[];
  authorId?: number;
  setAuthorId?: (id: number) => void;
  coAuthorIds?: number[];
  setCoAuthorIds?: (ids: number[]) => void;
  revisions?: PostRevision[];
  onRestoreRevision?: (rev: PostRevision) => void;
  userRole?: UserRole;
  currentStatus?: PostStatus;
  rejectionReason?: string;
  currentLoggedInUserId?: number;
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
  writers = [],
  authorId,
  setAuthorId,
  coAuthorIds = [],
  setCoAuthorIds,
  revisions = [],
  onRestoreRevision,
  userRole = 'writer',
  currentStatus = 'draft',
  rejectionReason = '',
  currentLoggedInUserId: currentLoggedInUserIdProp,
}: RichPostEditorProps) {
  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNote, setRejectNote] = useState('');

  // Get currently logged-in user id
  const currentLoggedInUserId = useMemo(() => {
    if (currentLoggedInUserIdProp) return Number(currentLoggedInUserIdProp);
    try {
      const stored = localStorage.getItem('cms_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id) return Number(parsed.id);
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  }, [currentLoggedInUserIdProp]);

  // Editor view modes: 'write' | 'split' | 'preview'
  const [viewMode, setViewMode] = useState<'write' | 'split' | 'preview'>('write');

  // Automatically switch view mode off 'split' on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && viewMode === 'split') {
        setViewMode('write');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);
  
  // Textarea Ref
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Modals state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const [showImageModal, setShowImageModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoPlatform, setVideoPlatform] = useState<'youtube' | 'tiktok' | 'instagram'>('youtube');
  const [videoUrl, setVideoUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageTab, setImageTab] = useState<'upload' | 'unsplash' | 'url'>('upload');
  const [lastUploadedUrl, setLastUploadedUrl] = useState<string>('');
  const [unsplashSearch, setUnsplashSearch] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const UNSPLASH_PRESETS = [
    { label: 'Edukasi & Keluarga', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=65&fm=webp' },
    { label: 'Teknologi & Workspace', url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=65&fm=webp' },
    { label: 'Gaya Hidup & Kesehatan', url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=65&fm=webp' },
    { label: 'Nutrisi & Makanan', url: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=800&q=65&fm=webp' },
    { label: 'Kreatif & Seni', url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=65&fm=webp' },
    { label: 'Komunitas & Tim', url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=800&q=65&fm=webp' },
    { label: 'Sekolah & Pendidikan', url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=65&fm=webp' },
    { label: 'Kesehatan & Medis', url: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=65&fm=webp' },
  ];

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

  // Insert Video Action
  const handleInsertVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl) return;
    const formatted = `\n\n[${videoPlatform}:${videoUrl.trim()}]\n\n`;
    
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const fullText = textarea.value.substring(0, start) + formatted + textarea.value.substring(end);
      updateMarkdownWithHistory(fullText);
    } else {
      updateMarkdownWithHistory(`${markdown}\n${formatted}`);
    }

    setShowVideoModal(false);
    setVideoUrl('');
  };

  // Insert Image Action
  const handleInsertImage = (url: string, altText: string) => {
    if (!url) return;
    const sanitizedUrl = sanitizeAndOptimizeImageUrl(url, 'body');
    const formatted = `\n\n![${altText || 'Gambar Artikel'}](${sanitizedUrl})\n\n`;
    
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

  // Upload image file handler (Cloudinary + WebP + Max 3MB)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side File Size Validation (Max 3MB limit)
    const MAX_SIZE_BYTES = 3 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      alert(`Ukuran file "${file.name}" (${(file.size / (1024 * 1024)).toFixed(2)} MB) melebihi batas 3 MB. Silakan kompres gambar terlebih dahulu agar loading artikel tetap ringan.`);
      return;
    }

    const uploadedUrl = await onImageUpload(file);
    if (uploadedUrl) {
      setLastUploadedUrl(uploadedUrl);
      setImageUrl(uploadedUrl);
      const cleanAlt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setImageAlt(cleanAlt || 'Gambar Artikel');
    }
  };

  // Insert Table
  const insertTable = () => {
    const tableTemplate = `\n\n| Judul Kolom 1 | Judul Kolom 2 | Judul Kolom 3 |\n| --- | --- | --- |\n| Isi Baris 1 | Detail A | Catatan 1 |\n| Isi Baris 2 | Detail B | Catatan 2 |\n\n`;
    applyFormatting('', '', tableTemplate);
  };

  // HTML Preview Renderer with Auto-Links & Lazy Loaded Images
  const parsedPreviewHtml = useMemo(() => {
    if (!markdown) return '';
    const preparedMd = preprocessMarkdownLineBreaks(markdown);
    let rawHtml = marked.parse(preparedMd, { async: false, gfm: true, breaks: true }) as string;

    // Inject loading="lazy" and decoding="async" into <img> tags
    rawHtml = rawHtml.replace(/<img\s+/gi, '<img loading="lazy" decoding="async" ');

    // Render responsive videos
    rawHtml = renderResponsiveVideoEmbeds(rawHtml);

    // Inject id attributes into <h2> and <h3> tags for TOC
    rawHtml = rawHtml.replace(/<(h[23])>(.*?)<\/\1>/gi, (match, tag, content) => {
      const cleanText = content.replace(/<[^>]+>/g, '').trim();
      if (!cleanText || cleanText.length > 120) return match;
      const id = cleanText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return `<${tag} id="${id}" class="scroll-mt-24">${content}</${tag}>`;
    });

    // Custom inline reference parsing: [ref: Name/Details]
    // Example: [ref: Sari et al., Jurnal Gizi Anak, 2026]
    const refs: string[] = [];
    let refIndex = 1;
    rawHtml = rawHtml.replace(/\[ref:\s*([^\]]+)\]/gi, (match, refText) => {
      const currentRefIndex = refIndex++;
      const cleanRefText = refText.trim();
      refs.push(cleanRefText);
      return `<sup><a href="#ref-item-${currentRefIndex}" id="ref-back-${currentRefIndex}" class="text-rose-600 font-extrabold hover:underline" title="${cleanRefText}">[${currentRefIndex}]</a></sup>`;
    });

    if (refs.length > 0) {
      const refListHtml = `
        <div class="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800" id="daftar-referensi">
          <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
            <span class="text-rose-600">📚</span> Referensi Ilmiah & Jurnal
          </h3>
          <ol class="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 list-decimal pl-5">
            ${refs.map((ref, idx) => `
              <li id="ref-item-${idx + 1}" class="pl-1 leading-relaxed">
                <span class="font-medium text-slate-800 dark:text-slate-200">${ref}</span>
                <a href="#ref-back-${idx + 1}" class="text-rose-500 hover:text-rose-700 ml-1.5 font-bold transition-colors" title="Kembali ke teks">↩</a>
              </li>
            `).join('')}
          </ol>
        </div>
      `;
      rawHtml += refListHtml;
    }

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
      <div className={`sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl md:rounded-3xl shadow-xs border transition-colors ${
        userRole === 'writer'
          ? 'bg-[#FAF9F6] dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-[#E5E3DC] dark:border-slate-800'
          : 'bg-slate-900 text-white border-slate-800 shadow-md'
      }`}>
        
        {/* VIEW MODE TOGGLE */}
        <div className={`flex items-center gap-1 p-1 rounded-2xl border ${
          userRole === 'writer'
            ? 'bg-slate-100/80 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
            : 'bg-slate-800 border-slate-700'
        }`}>
          <button
            type="button"
            onClick={() => setViewMode('write')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              viewMode === 'write'
                ? 'bg-rose-600 text-white shadow-xs'
                : userRole === 'writer' ? 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700' : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Tulis</span>
          </button>

          {/* HIDDEN ON MOBILE (SCREEN < MD) TO AVOID UNSUITABLE SPLIT SCREEN */}
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`hidden md:flex px-3 py-1.5 rounded-xl text-xs font-bold transition-colors items-center gap-1.5 ${
              viewMode === 'split'
                ? 'bg-rose-600 text-white shadow-xs'
                : userRole === 'writer' ? 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700' : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Bagi Layar</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              viewMode === 'preview'
                ? 'bg-rose-600 text-white shadow-xs'
                : userRole === 'writer' ? 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700' : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Pratinjau</span>
          </button>
        </div>

        {/* AUTO-SAVE STATUS INDICATOR */}
        <div className="hidden sm:flex items-center gap-2">
          {autoSaveStatus === 'saved' && (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 px-3 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" /> {userRole === 'writer' ? 'Draf Tersimpan' : 'Draf Tersimpan di Cloudflare D1'}
            </span>
          )}
          {autoSaveStatus === 'saving' && (
            <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 font-semibold bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 px-3 py-1 rounded-full animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Menyimpan draf...
            </span>
          )}
          {autoSaveStatus === 'dirty' && (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 px-3 py-1">
              Perubahan belum disimpan...
            </span>
          )}
        </div>

        {/* SAVE & PUBLISH ROLE-BASED ACTION BUTTONS */}
        <div className="flex items-center gap-2">
          {/* Simpan Draf (Soft Slate/Gray) */}
          <button
            type="button"
            onClick={() => onPublishSubmit('draft')}
            className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 text-xs font-bold transition-colors border border-slate-300/80 dark:border-slate-600 flex items-center gap-1.5 shrink-0"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Simpan Draf</span>
          </button>

          {/* Writer Specific Action (Emerald Green) */}
          {userRole === 'writer' && (
            <button
              type="button"
              onClick={() => onPublishSubmit('pending_approval')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kirim untuk Ditinjau 🚀</span>
            </button>
          )}

          {/* Editor & Admin Actions */}
          {(userRole === 'editor' || userRole === 'admin') && (
            <>
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                className="px-3.5 py-2 rounded-xl bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 text-xs font-bold transition-colors border border-rose-800/60 flex items-center gap-1.5 shrink-0"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Tolak / Minta Revisi</span>
              </button>
              <button
                type="button"
                onClick={() => onPublishSubmit('published')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold hover:from-emerald-500 hover:to-teal-500 shadow-md transition-colors flex items-center gap-1.5 shrink-0"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Setujui & Terbitkan ✅</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* REJECTION / WORKFLOW NOTIFICATION BANNER */}
      {currentStatus === 'rejected' && (
        <div className="bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 rounded-2xl p-4 flex items-start gap-3 text-rose-800 dark:text-rose-200 shadow-xs animate-fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-800 dark:text-rose-300">
              Artikel Perlu Revisi / Ditolak oleh Editor
            </h4>
            <p className="text-xs text-rose-700 dark:text-rose-200 leading-relaxed">
              {rejectionReason || 'Silakan tinjau kembali tata bahasa, sumber referensi, atau kelengkapan isi artikel ini sebelum mengajukan ulang.'}
            </p>
          </div>
        </div>
      )}

      {currentStatus === 'pending_approval' && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 flex items-center justify-between text-amber-900 dark:text-amber-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Send className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />
            <div>
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">Menunggu Ditinjau oleh Editor</h4>
              <p className="text-[11px] text-amber-700 dark:text-amber-200/80">
                Artikel ini sudah dikirim dan saat ini berada di antrean moderasi Redaksi.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold uppercase bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/80 px-2.5 py-1 rounded-full">
            Pending Approval
          </span>
        </div>
      )}

      {/* REJECTION REASON MODAL (FOR EDITORS / ADMINS) */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertCircle className="w-5 h-5" />
                <h3 className="text-sm font-bold">Minta Revisi / Tolak Artikel</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Tuliskan catatan revisi atau alasan penolakan secara spesifik agar Penulis dapat memperbaiki artikel ini.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Catatan Revisi / Alasan Penolakan:
              </label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Contoh: Tolak artikel ini. Tambahkan referensi medis dan perbaiki penulisan istilah kesehatan."
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-hidden focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  onPublishSubmit('rejected', rejectNote || 'Perlu perbaikan artikel.');
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md"
              >
                Kirim Catatan Revisi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MAIN CONTENT EDITOR SECTION */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* EDITOR AREA (8 COLS) */}
        <div className="lg:col-span-8 space-y-4">
          <div className={`rounded-3xl p-5 sm:p-7 border transition-colors ${
            userRole === 'writer'
              ? 'bg-[#FAF9F6] dark:bg-slate-900 border-[#E5E3DC] dark:border-slate-800 shadow-xs text-[#2D3748] dark:text-slate-100'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
          } space-y-5`}>
            
            {/* TITLE FIELD */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Judul Artikel
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Panduan Lengkap & Strategi Terbaru..."
                className={`w-full px-4 py-3.5 rounded-2xl border text-lg font-extrabold transition-colors placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                  userRole === 'writer'
                    ? 'bg-[#FAF9F6] dark:bg-slate-900 border-[#E2E0D8] dark:border-slate-800 text-[#2D3748] dark:text-white focus:ring-emerald-500/50'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-rose-500'
                }`}
              />
            </div>

            {/* SLUG & CATEGORY */}
            <div className={`grid grid-cols-1 ${userRole !== 'writer' ? 'sm:grid-cols-2' : ''} gap-4`}>
              {userRole !== 'writer' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="panduan-lengkap-strategi-terbaru"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kategori Artikel
                </label>
                <input
                  type="text"
                  list="category-suggestions"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ketik atau pilih kategori (cth: Berita, Edukasi...)"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 ${
                    userRole === 'writer'
                      ? 'bg-[#FAF9F6] dark:bg-slate-800 border-[#E2E0D8] dark:border-slate-700 text-[#2D3748] dark:text-slate-100 focus:ring-emerald-500/50'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:ring-rose-500'
                  }`}
                />
                <datalist id="category-suggestions">
                  <option value="Berita & Opini" />
                  <option value="Edukasi & Panduan" />
                  <option value="Kesehatan & Gizi" />
                  <option value="Gaya Hidup & Keluarga" />
                  <option value="Teknologi & Informasi" />
                  <option value="Pola Asuh" />
                  <option value="Umum" />
                </datalist>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* PROFESSIONAL WYSIWYG MARKDOWN TOOLBAR */}
            {/* ------------------------------------------------------------- */}
            
            {/* MOBILE FLOATING / TOUCH-FRIENDLY TOOLBAR (< MD) */}
            <div className="md:hidden border border-[#E2E0D8] dark:border-slate-800 rounded-2xl bg-[#F4F2EB] dark:bg-slate-800/80 p-1.5 flex items-center justify-between gap-1 overflow-x-auto shadow-xs">
              <button
                type="button"
                onClick={() => applyFormatting('**', '**', 'teks tebal')}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold shadow-xs active:bg-slate-200 shrink-0"
                title="Cetak Tebal / Bold"
              >
                <Bold className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => applyFormatting('*', '*', 'teks miring')}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold shadow-xs active:bg-slate-200 shrink-0"
                title="Cetak Miring / Italic"
              >
                <Italic className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => applyFormatting('## ', '', 'Subjudul Bagian')}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-extrabold text-sm shadow-xs active:bg-slate-200 shrink-0"
                title="Subjudul H2"
              >
                <Heading2 className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => applyFormatting('- ', '', 'Poin item')}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold shadow-xs active:bg-slate-200 shrink-0"
                title="Daftar Poin"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setShowImageModal(true)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold shadow-xs active:bg-emerald-200 shrink-0"
                title="Sisipkan Gambar"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setShowVideoModal(true)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 font-bold shadow-xs active:bg-purple-200 shrink-0"
                title="Sisipkan Video (YouTube, TikTok, Instagram)"
              >
                <Video className="w-5 h-5" />
              </button>
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
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 font-bold shadow-xs active:bg-rose-200 shrink-0"
                title="Sisipkan Tautan"
              >
                <LinkIcon className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => applyFormatting('[ref: ', ']', 'Sari et al., Jurnal Gizi Anak, 2026')}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold shadow-xs active:bg-amber-200 shrink-0"
                title="Sisipkan Referensi Jurnal Ilmiah (E-E-A-T)"
              >
                <span className="text-base">📚</span>
              </button>
              <button
                type="button"
                onClick={handleUndo}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold shadow-xs active:bg-slate-200 shrink-0"
                title="Undo"
              >
                <Undo className="w-5 h-5" />
              </button>
            </div>

            {/* DESKTOP FULL TOOLBAR (>= MD) */}
            <div className="hidden md:block border border-[#E2E0D8] dark:border-slate-800 rounded-2xl bg-[#F4F2EB] dark:bg-slate-800/60 p-2 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-1 border-b border-[#E2E0D8] dark:border-slate-700 pb-2">
                
                {/* TEXT FORMATTING GROUP */}
                <div className="flex items-center gap-0.5 pr-2 border-r border-[#E2E0D8] dark:border-slate-700">
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
                <div className="flex items-center gap-0.5 px-2 border-r border-[#E2E0D8] dark:border-slate-700">
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
                <div className="flex items-center gap-0.5 px-2 border-r border-[#E2E0D8] dark:border-slate-700">
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
                <div className="flex items-center gap-0.5 px-2 border-r border-[#E2E0D8] dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => applyFormatting('> ', '', 'Kutipan mutiara atau inspirasi')}
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

                  <button
                    type="button"
                    onClick={() => setShowVideoModal(true)}
                    className="px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 font-bold text-xs hover:bg-purple-100 transition-colors flex items-center gap-1"
                    title="Sisipkan Video (YouTube, TikTok, Instagram)"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Video</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyFormatting('[ref: ', ']', 'Sari et al., Jurnal Gizi Anak, 2026')}
                    className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 font-bold text-xs hover:bg-amber-100 transition-colors flex items-center gap-1"
                    title="Sisipkan Referensi Jurnal Ilmiah (E-E-A-T)"
                  >
                    <span>📚</span>
                    <span>Referensi</span>
                  </button>
                </div>

                {/* HISTORY UNDO/REDO & CLEAR */}
                <div className="flex items-center gap-1 border-l border-[#E2E0D8] dark:border-slate-700 pl-2">
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
                    placeholder="Tulis artikel lengkap dengan format markdown di sini..."
                    className={`w-full p-4 sm:p-6 rounded-2xl border font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 ${
                      userRole === 'writer'
                        ? 'bg-[#FAF9F6] dark:bg-slate-900/90 border-[#E2E0D8] dark:border-slate-800 text-[#2D3748] dark:text-slate-100 focus:ring-emerald-500/50'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-rose-500'
                    }`}
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
                      className={`w-full p-4 rounded-2xl border font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 ${
                        userRole === 'writer'
                          ? 'bg-[#FAF9F6] dark:bg-slate-900/90 border-[#E2E0D8] dark:border-slate-800 text-[#2D3748] dark:text-slate-100 focus:ring-emerald-500/50'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-rose-500'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600 mb-1 flex items-center justify-between">
                      <span>Pratinjau Hasil Real-Time (Live)</span>
                      <span className="text-[9px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                        Tautan Otomatis Aktif
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 max-h-[440px] overflow-y-auto article-body max-w-none text-slate-800 dark:text-slate-200">
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
                    className="article-body max-w-none text-slate-800 dark:text-slate-200"
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

            {/* TIPS REFERENSI ILMIAH (E-E-A-T) */}
            <div className="mt-4 p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/60 dark:border-amber-900/30 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
              <span className="text-base shrink-0">💡</span>
              <div className="space-y-1">
                <span className="font-extrabold block text-amber-900 dark:text-amber-100">Tips Referensi Ilmiah (Kredibilitas E-E-A-T):</span>
                <span className="block leading-relaxed">
                  Tulis <code className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 font-mono text-[11px] text-amber-900 dark:text-amber-300 font-bold">[ref: Sari et al., Jurnal Kesehatan Anak, 2026]</code> di akhir kalimat Anda untuk otomatis menyisipkan tautan catatan kaki dan membangun daftar referensi ilmiah yang rapi di akhir artikel secara otomatis.
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* SIDEBAR METADATA & GEMINI AI (4 COLS) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* AI GEMINI ASSISTANT CARD */}
          {userRole !== 'writer' && (
            <div className="bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-3xl p-6 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                  AI Content Assistant
                </span>
              </div>
              <p className="text-xs text-rose-100 leading-relaxed">
                Otomatis buatkan Meta Title, Meta Description, Ringkasan, & Tag SEO menggunakan Gemini AI.
              </p>
              <button
                type="button"
                onClick={onAiGenerateMeta}
                disabled={isAiLoading || !title}
                className="w-full py-2.5 rounded-xl bg-white text-rose-600 font-bold text-xs shadow-sm hover:bg-rose-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isAiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-rose-600" />}
                <span>Generate SEO Meta dengan AI</span>
              </button>
            </div>
          )}

          {/* METADATA & EXCERPT CARD */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {userRole === 'writer' ? 'Ringkasan & Gambar Sampul' : 'Meta SEO & Gambar Sampul'}
            </h4>

            {/* FEATURED IMAGE */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  URL Gambar Sampul (Featured Image)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setImageTab('upload');
                    setShowImageModal(true);
                  }}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900 transition-colors"
                >
                  <Upload className="w-3 h-3" />
                  <span>Upload / Pilih Gambar</span>
                </button>
              </div>
              <input
                type="text"
                value={featuredImage}
                onChange={(e) => setFeaturedImage(sanitizeAndOptimizeImageUrl(e.target.value, 'featured'))}
                onBlur={(e) => setFeaturedImage(sanitizeAndOptimizeImageUrl(e.target.value, 'featured'))}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono"
              />
              {featuredImage && (
                <div className="relative mt-2">
                  <img
                    src={featuredImage}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-xl border border-slate-200 dark:border-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setFeaturedImage('')}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                    title="Hapus gambar sampul"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
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

            {/* META TITLE & META DESC FOR NON-WRITER */}
            {userRole !== 'writer' && (
              <>
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
              </>
            )}

            {/* TAGS */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Topik / Tag (Pisahkan dengan koma)
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

          {/* REAL-TIME AUTO IN-PAGE SEO AUDITOR WIDGET */}
          {userRole !== 'writer' && (
            <SeoAuditWidget
              title={title}
              metaTitle={metaTitle}
              setMetaTitle={setMetaTitle}
              metaDesc={metaDesc}
              setMetaDesc={setMetaDesc}
              markdown={markdown}
              featuredImage={featuredImage}
              tags={tags}
              onAutoOptimizeMeta={() => {
                if (title) {
                  setMetaTitle(`${title} | Parenting.my.id`);
                }
                const plainText = (excerpt || markdown || '').replace(/<[^>]+>/g, '').replace(/[#*`_~]/g, ' ').trim();
                const truncated = plainText.length > 155 ? plainText.substring(0, 155) + '...' : plainText;
                if (truncated) {
                  setMetaDesc(truncated);
                }
              }}
            />
          )}

          {/* MULTI-AUTHOR & CREDENTIALS CARD */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-rose-600" />
              <span>Tim Editorial & Penulis Bersama</span>
            </h4>

            {/* PRIMARY AUTHOR */}
            {setAuthorId && writers.length > 0 && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Penulis Utama (Primary Author)
                </label>
                {userRole === 'writer' ? (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                    {writers.find(w => w.id === authorId)?.name || 'Penulis Aktif'}
                  </div>
                ) : (
                  <select
                    value={authorId || ''}
                    onChange={(e) => setAuthorId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    {writers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} {w.title ? `(${w.title})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* CO-AUTHORS MULTI-SELECT IN COLLAPSIBLE ACCORDION */}
            {setCoAuthorIds && writers.length > 1 && (
              <details className="group pt-2 border-t border-slate-100 dark:border-slate-800">
                <summary className="text-[11px] font-bold text-slate-600 dark:text-slate-400 cursor-pointer flex items-center justify-between hover:text-rose-600 transition-colors">
                  <span>👥 Tambah Penulis Bersama / Co-Author</span>
                  <span className="text-[10px] text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 mt-3">
                  {writers
                    .filter((w) => Number(w.id) !== Number(authorId) && Number(w.id) !== Number(currentLoggedInUserId))
                    .map((w) => {
                      const safeList = Array.isArray(coAuthorIds) ? coAuthorIds : [];
                      const isChecked = safeList.includes(w.id);
                      return (
                        <label
                          key={w.id}
                          className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 font-bold'
                              : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCoAuthorIds([...safeList, w.id]);
                              } else {
                                setCoAuthorIds(safeList.filter((id) => id !== w.id));
                              }
                            }}
                            className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                          />
                          <img
                            src={w.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                            alt={w.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <div className="truncate">
                            <span className="text-xs font-bold block">{w.name}</span>
                            <span className="text-[10px] text-slate-500 block truncate">{w.title || w.role}</span>
                          </div>
                        </label>
                      );
                    })}
                </div>
              </details>
            )}
          </div>

          {/* REVISION HISTORY CARD (HISTORI REVISI MAX 3 VERSI) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <History className="w-4 h-4 text-amber-500" />
                <span>Histori Revisi & Rollback</span>
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold">
                {revisions.length}/3 Versi
              </span>
            </div>

            {revisions.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                Belum ada histori revisi disimpan. Revisi tersimpan otomatis saat artikel diperbarui (maksimal 3 versi terkini).
              </p>
            ) : (
              <div className="space-y-3">
                {revisions.map((rev, idx) => {
                  const dateFormatted = new Date(rev.updatedAt || rev.timestamp).toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  return (
                    <div
                      key={rev.id || idx}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                        <span className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <RotateCcw className="w-3 h-3" /> Versi #{revisions.length - idx} ({dateFormatted})
                        </span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          Oleh {rev.updatedByName}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 line-clamp-1">
                        "{rev.title}"
                      </p>
                      {onRestoreRevision && (
                        <button
                          type="button"
                          onClick={() => onRestoreRevision(rev)}
                          className="w-full py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] shadow-sm transition-colors flex items-center justify-center gap-1.5"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Kembalikan ke Versi Ini (Rollback)</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* BOTTOM ACTION BAR FOR CONVENIENT SAVING / PUBLISHING */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
            Status Artikel:
          </span>
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase ${
            currentStatus === 'published' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
            currentStatus === 'pending_approval' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
            currentStatus === 'rejected' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }`}>
            {currentStatus === 'published' ? 'Terbit ✅' :
             currentStatus === 'pending_approval' ? 'Menunggu Ditinjau ⏳' :
             currentStatus === 'rejected' ? 'Perlu Revisi ❌' : 'Draf 📝'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Simpan Draf */}
          <button
            type="button"
            onClick={() => onPublishSubmit('draft')}
            className="px-4 py-2.5 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 text-xs font-bold transition-colors flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>Simpan Draf</span>
          </button>

          {/* Writer Specific Action */}
          {userRole === 'writer' && (
            <button
              type="button"
              onClick={() => onPublishSubmit('pending_approval')}
              className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Kirim untuk Ditinjau 🚀</span>
            </button>
          )}

          {/* Editor & Admin Actions */}
          {(userRole === 'editor' || userRole === 'admin') && (
            <>
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                className="px-4 py-2.5 rounded-2xl bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 text-xs font-bold border border-rose-800/60 flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                <span>Tolak / Minta Revisi</span>
              </button>

              <button
                type="button"
                onClick={() => onPublishSubmit('published')}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-lg transition-colors flex items-center gap-2"
              >
                <ThumbsUp className="w-4 h-4" />
                <span>Setujui & Terbitkan ✅</span>
              </button>
            </>
          )}
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
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setImageTab('upload')}
                className={`flex-1 py-1.5 rounded-lg transition-colors ${
                  imageTab === 'upload' ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setImageTab('unsplash')}
                className={`flex-1 py-1.5 rounded-lg transition-colors ${
                  imageTab === 'unsplash' ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Galeri Unsplash
              </button>
              <button
                type="button"
                onClick={() => setImageTab('url')}
                className={`flex-1 py-1.5 rounded-lg transition-colors ${
                  imageTab === 'url' ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                URL Direct
              </button>
            </div>

            {/* TAB 1: UPLOAD FILE CLOUDINARY */}
            {imageTab === 'upload' && (
              <div className="space-y-4 py-1">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                  <p className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <span>☁️ Upload Gambar ke Server Cloudinary</span>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-[11px]">
                    <li><b>Format Output:</b> Otomatis dikonversi ke format <b>WebP</b> ultra-ringan.</li>
                    <li><b>Dimensi Maksimal:</b> Selebar layar tablet (<b>1024px</b>) agar ramah seluler.</li>
                    <li><b>Batas Ukuran File:</b> Maksimal <b>3 MB</b> per gambar.</li>
                    <li><b>Lazy Loading:</b> Otomatis diterapkan saat artikel dirender.</li>
                  </ul>
                  <div className="pt-1.5 text-[10px] text-slate-500 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span><b>Keamanan Terjamin:</b> API Secret disimpan aman di Server-Side (`/api/upload-cloudinary`), tidak pernah diekspos ke browser / GitHub.</span>
                  </div>
                </div>

                <label className="cursor-pointer block border-2 border-dashed border-rose-300 dark:border-rose-900 rounded-2xl p-6 text-center hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors">
                  <Upload className="w-8 h-8 text-rose-500 mx-auto mb-2 animate-bounce" />
                  <span className="text-xs font-bold text-rose-600 block">
                    {uploadingImage ? 'Mengunggah & Mengonversi ke WebP...' : 'Pilih File Gambar (PNG, JPG, WebP)'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Maksimal 3 MB • Otomatis Resizing & Optimasi WebP
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>

                {imageUrl && (
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Gambar Berhasil Diunggah (.webp)</span>
                      </span>
                      <span className="text-[10px] bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 px-2 py-0.5 rounded-full font-mono">
                        webp ready
                      </span>
                    </div>

                    <div className="relative group overflow-hidden rounded-xl border border-emerald-200 dark:border-emerald-800 bg-black/5">
                      <img
                        src={imageUrl}
                        alt="Uploaded WebP"
                        className="w-full h-36 object-cover rounded-xl"
                        loading="lazy"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Deskripsi / Alt Text Gambar (SEO Friendly)
                      </label>
                      <input
                        type="text"
                        value={imageAlt}
                        onChange={(e) => setImageAlt(e.target.value)}
                        placeholder="Contoh: Ilustrasi pendukung artikel"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleInsertImage(imageUrl, imageAlt || 'Gambar Artikel')}
                        className="col-span-2 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <ImageIcon className="w-4 h-4" />
                        <span>Sisipkan Langsung ke Body Artikel</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const markdownTag = `![${imageAlt || 'Gambar Artikel'}](${imageUrl})`;
                          navigator.clipboard.writeText(markdownTag);
                          setCopyFeedback('markdown');
                          setTimeout(() => setCopyFeedback(null), 2500);
                        }}
                        className="py-2 px-3 bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copyFeedback === 'markdown' ? '✓ Tersalin!' : 'Salin Markdown'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(imageUrl);
                          setCopyFeedback('url');
                          setTimeout(() => setCopyFeedback(null), 2500);
                        }}
                        className="py-2 px-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>{copyFeedback === 'url' ? '✓ URL Tersalin!' : 'Salin URL WebP'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFeaturedImage(imageUrl);
                          setShowImageModal(false);
                        }}
                        className="col-span-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 mt-1"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Jadikan Gambar Sampul Artikel (Featured Image)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: GALERI UNSPLASH */}
            {imageTab === 'unsplash' && (
              <div className="space-y-3 py-1">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Pilih foto bebas royalti Unsplash atau ketik kata kunci custom:
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={unsplashSearch}
                    onChange={(e) => setUnsplashSearch(e.target.value)}
                    placeholder="Cari kata kunci (cth: baby, mother, toddler)..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                  />
                  {unsplashSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        const searchUrl = `https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=80`;
                        setImageUrl(searchUrl);
                        setImageAlt(unsplashSearch);
                      }}
                      className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold"
                    >
                      Pilih
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 border border-slate-100 dark:border-slate-800 rounded-2xl">
                  {UNSPLASH_PRESETS.map((preset, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setImageUrl(preset.url);
                        setImageAlt(preset.label);
                      }}
                      className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer transition-colors ${
                        imageUrl === preset.url ? 'border-rose-500 ring-2 ring-rose-200' : 'border-transparent hover:border-slate-300'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-20 object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1.5">
                        <span className="text-[10px] font-bold text-white block truncate">{preset.label}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {imageUrl && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl space-y-2">
                    <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 block">Gambar Terpilih: {imageAlt || 'Unsplash Image'}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleInsertImage(imageUrl, imageAlt || 'Gambar Unsplash')}
                        className="flex-1 py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        📌 Sisipkan ke Body
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFeaturedImage(sanitizeAndOptimizeImageUrl(imageUrl, 'featured'));
                          setShowImageModal(false);
                        }}
                        className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        🖼️ Jadikan Sampul
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: URL DIRECT */}
            {imageTab === 'url' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleInsertImage(imageUrl, imageAlt);
                }}
                className="space-y-3"
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
                    <img src={imageUrl} alt="Preview" className="w-full h-28 object-cover rounded-xl border" />
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
                    type="button"
                    onClick={() => {
                      setFeaturedImage(sanitizeAndOptimizeImageUrl(imageUrl, 'featured'));
                      setShowImageModal(false);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-900"
                  >
                    Jadikan Sampul
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

      {/* ------------------------------------------------------------- */}
      {/* MODAL INSERT VIDEO */}
      {/* ------------------------------------------------------------- */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Video className="w-4 h-4 text-purple-600" />
                <span>Sisipkan Video Responsive</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInsertVideo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Platform Video
                </label>
                <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                  {(['youtube', 'tiktok', 'instagram'] as const).map((platform) => (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => setVideoPlatform(platform)}
                      className={`py-1.5 rounded-lg capitalize transition-colors ${
                        videoPlatform === platform
                          ? 'bg-white dark:bg-slate-900 text-purple-600 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Alamat URL Video atau ID Video
                </label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder={
                    videoPlatform === 'youtube'
                      ? 'https://www.youtube.com/watch?v=...'
                      : videoPlatform === 'tiktok'
                      ? 'https://www.tiktok.com/@username/video/...'
                      : 'https://www.instagram.com/p/...'
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono"
                  required
                />
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                  Tempelkan URL video lengkap. Pemutar video akan ditampilkan secara responsif dan ramah seluler.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVideoModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700"
                >
                  Sisipkan Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
