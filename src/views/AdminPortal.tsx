import { useState, useEffect, useRef } from 'react';
import { Post, AutoLink, User } from '../types';
import { 
  ShieldCheck, FileText, Link as LinkIcon, Plus, Trash2, Edit3, Save, 
  Upload, Eye, Sparkles, CheckCircle2, RefreshCw, Bold, Italic, Heading2, 
  Heading3, List, ListOrdered, Quote, Image as ImageIcon, Code, UserCheck, 
  ExternalLink, Search, Zap, AlertCircle
} from 'lucide-react';
import { generateSlug } from '../lib/autolink';

interface AdminPortalProps {
  currentUser: User | null;
  onLogin: (email: string, pass: string) => Promise<boolean>;
  posts: Post[];
  autolinks: AutoLink[];
  onSavePost: (postData: Partial<Post>) => Promise<Post | void>;
  onDeletePost: (id: number) => Promise<void>;
  onAddAutolink: (link: Partial<AutoLink>) => Promise<void>;
  onDeleteAutolink: (id: number) => Promise<void>;
}

export default function AdminPortal({
  currentUser,
  onLogin,
  posts,
  autolinks,
  onSavePost,
  onDeletePost,
  onAddAutolink,
  onDeleteAutolink,
}: AdminPortalProps) {
  // Login form state
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Admin tabs: 'posts' | 'editor' | 'autolinks' | 'sitemap' | 'users'
  const [activeTab, setActiveTab] = useState<'posts' | 'editor' | 'autolinks' | 'sitemap' | 'users'>('posts');

  // Editor State
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorSlug, setEditorSlug] = useState('');
  const [editorCategory, setEditorCategory] = useState('Pola Asuh');
  const [editorMarkdown, setEditorMarkdown] = useState('');
  const [editorExcerpt, setEditorExcerpt] = useState('');
  const [editorImage, setEditorImage] = useState('');
  const [editorStatus, setEditorStatus] = useState<'draft' | 'published'>('draft');
  const [editorMetaTitle, setEditorMetaTitle] = useState('');
  const [editorMetaDesc, setEditorMetaDesc] = useState('');
  const [editorTags, setEditorTags] = useState('parenting, anak, keluarga');

  // Auto-Save Draft Status Indicator
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'dirty'>('saved');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [editorMode, setEditorMode] = useState<'visual' | 'markdown'>('markdown');
  const [uploadingImage, setUploadingImage] = useState(false);

  // New Autolink Form State
  const [newKeyword, setNewKeyword] = useState('');
  const [newTargetUrl, setNewTargetUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Auto-Save Draft Debounce Timer
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    const success = await onLogin(emailInput, passwordInput);
    setIsLoggingIn(false);
    if (!success) {
      setLoginError('Email atau password tidak terdaftar.');
    }
  };

  // 1-Click Quick Login Credentials helper
  const handleQuickLogin = async (role: 'admin' | 'writer') => {
    if (role === 'admin') {
      setEmailInput('admin@parenting.my.id');
      setPasswordInput('admin123');
      await onLogin('admin@parenting.my.id', 'admin123');
    } else {
      setEmailInput('penulis@parenting.my.id');
      setPasswordInput('writer123');
      await onLogin('penulis@parenting.my.id', 'writer123');
    }
  };

  // Open Post in Editor
  const handleEditPost = (post: Post) => {
    setEditingPostId(post.id);
    setEditorTitle(post.title);
    setEditorSlug(post.slug);
    setEditorCategory(post.category);
    setEditorMarkdown(post.contentMarkdown);
    setEditorExcerpt(post.excerpt);
    setEditorImage(post.featuredImage);
    setEditorStatus(post.status);
    setEditorMetaTitle(post.metaTitle || `${post.title} | Parenting.my.id`);
    setEditorMetaDesc(post.metaDescription || post.excerpt);
    setEditorTags(post.tags || 'parenting, anak');
    setActiveTab('editor');
    setAutoSaveStatus('saved');
  };

  // Create New Blank Post
  const handleCreateNewPost = () => {
    setEditingPostId(null);
    setEditorTitle('');
    setEditorSlug('');
    setEditorCategory('Pola Asuh');
    setEditorMarkdown('## Judul Bagian Baru\n\nTulis isi konten artikel parenting Anda di sini...');
    setEditorExcerpt('');
    setEditorImage('https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=1200&q=80');
    setEditorStatus('draft');
    setEditorMetaTitle('');
    setEditorMetaDesc('');
    setEditorTags('parenting, anak, keluarga');
    setActiveTab('editor');
    setAutoSaveStatus('saved');
  };

  // Auto-Save Draft Trigger (Runs when content or title changes)
  useEffect(() => {
    if (activeTab !== 'editor' || !editorTitle) return;

    setAutoSaveStatus('dirty');

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setTimeout(async () => {
      setAutoSaveStatus('saving');
      const saved = await onSavePost({
        id: editingPostId || undefined,
        title: editorTitle,
        slug: editorSlug || generateSlug(editorTitle),
        category: editorCategory,
        contentMarkdown: editorMarkdown,
        excerpt: editorExcerpt || editorMarkdown.slice(0, 150) + '...',
        featuredImage: editorImage,
        status: 'draft', // Auto-save keeps it as draft until explicitly published
        metaTitle: editorMetaTitle,
        metaDescription: editorMetaDesc,
        tags: editorTags,
        authorId: currentUser?.id || 1,
      });

      if (saved && !editingPostId) {
        setEditingPostId(saved.id);
      }
      setAutoSaveStatus('saved');
    }, 3000); // Save automatically 3s after typing pause

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [editorTitle, editorMarkdown, editorExcerpt, editorCategory, editorImage]);

  // Insert Markdown formatting toolbar
  const insertToolbar = (prefix: string, suffix: string = '') => {
    setEditorMarkdown((prev) => `${prev}\n${prefix}Teks Ditambahkan${suffix}`);
  };

  // GitHub REST API Image Upload Handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Content = reader.result as string;
      try {
        const res = await fetch('/api/upload-github', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            base64Content,
          }),
        });
        const data = await res.json();
        if (data.url) {
          setEditorImage(data.url);
          setEditorMarkdown((prev) => `${prev}\n\n![${file.name}](${data.url})`);
        }
      } catch (err) {
        console.error('Image upload failed', err);
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // AI Gemini Meta Generator
  const handleAiGenerateMeta = async () => {
    if (!editorTitle) return;
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/generate-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editorTitle,
          content: editorMarkdown,
        }),
      });
      const data = await res.json();
      if (data.metaTitle) setEditorMetaTitle(data.metaTitle);
      if (data.metaDescription) setEditorMetaDesc(data.metaDescription);
      if (data.excerpt) setEditorExcerpt(data.excerpt);
      if (data.tags) setEditorTags(data.tags);
    } catch (err) {
      console.error('AI generation error', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Save / Publish Post Form Submit
  const handlePublishSubmit = async (status: 'draft' | 'published') => {
    if (!editorTitle || !editorMarkdown) return;

    await onSavePost({
      id: editingPostId || undefined,
      title: editorTitle,
      slug: editorSlug || generateSlug(editorTitle),
      category: editorCategory,
      contentMarkdown: editorMarkdown,
      excerpt: editorExcerpt || editorMarkdown.slice(0, 150) + '...',
      featuredImage: editorImage,
      status: status,
      metaTitle: editorMetaTitle || `${editorTitle} | Parenting.my.id`,
      metaDescription: editorMetaDesc || editorExcerpt,
      tags: editorTags,
      authorId: currentUser?.id || 1,
    });

    setActiveTab('posts');
  };

  // Submit New Autolink
  const handleAddAutolinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword || !newTargetUrl) return;
    await onAddAutolink({
      keyword: newKeyword,
      targetUrl: newTargetUrl,
      description: newDescription,
    });
    setNewKeyword('');
    setNewTargetUrl('');
    setNewDescription('');
  };

  // -------------------------------------------------------------
  // RENDER LOGIN SCREEN IF NOT AUTHENTICATED
  // -------------------------------------------------------------
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-rose-500/25">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Portal Admin Parenting.my.id
            </h2>
            <p className="text-xs text-slate-500">
              Sistem Login HTTP-Only Session Cloudflare D1
            </p>
          </div>

          {/* QUICK DEMO LOGIN BUTTONS */}
          <div className="bg-rose-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-rose-100 dark:border-slate-700 space-y-2">
            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wide block text-center">
              ⚡ Test Login 1-Klik Kredensial:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="py-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-700 text-xs font-bold text-rose-600 hover:bg-rose-600 hover:text-white transition-colors shadow-2xs"
              >
                1. Account Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('writer')}
                className="py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-800 hover:text-white transition-colors shadow-2xs"
              >
                2. Account Writer
              </button>
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email Terdaftar
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
                placeholder="admin@parenting.my.id"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {loginError && (
              <p className="text-xs text-rose-600 font-medium text-center bg-rose-50 p-2 rounded-lg">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isLoggingIn ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
              <span>Masuk Portal CMS</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER ADMIN DASHBOARD WORKSPACE
  // -------------------------------------------------------------
  return (
    <div className="space-y-8 pb-16">
      
      {/* HEADER STATUS BAR */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-12 h-12 rounded-2xl object-cover border-2 border-rose-500 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {currentUser.name}
              </h2>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                currentUser.role === 'admin' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
              }`}>
                {currentUser.role}
              </span>
            </div>
            <p className="text-xs text-slate-500">{currentUser.email} • Cloudflare D1 Connected</p>
          </div>
        </div>

        <button
          onClick={handleCreateNewPost}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Tulis Artikel Parenting Baru</span>
        </button>
      </div>

      {/* DASHBOARD NAVIGATION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'posts'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Kelola Artikel ({posts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('editor')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'editor'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>Rich WYSIWYG Editor</span>
        </button>

        <button
          onClick={() => setActiveTab('autolinks')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'autolinks'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <LinkIcon className="w-4 h-4" />
          <span>Auto-Linking Engine ({autolinks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sitemap')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'sitemap'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>SEO & Sitemap Inspector</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: MANAGE POSTS LIST */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'posts' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Daftar Artikel di Cloudflare D1 Database
            </h3>
            <span className="text-xs text-slate-500">
              Total {posts.length} Artikel
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Judul Artikel</th>
                  <th className="p-4">Kategori</th>
                  <th className="p-4">Penulis</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Pembaca</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                      {post.title}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded bg-rose-50 text-rose-600 font-semibold text-[10px]">
                        {post.category}
                      </span>
                    </td>
                    <td className="p-4">{post.authorName || 'Dr. Ratna Sari'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        post.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono">{post.views}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleEditPost(post)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-600 font-bold"
                      >
                        Edit
                      </button>
                      {(currentUser.role === 'admin' || post.authorId === currentUser.id) && (
                        <button
                          onClick={() => onDeletePost(post.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white font-bold"
                        >
                          Hapus
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: RICH WYSIWYG & MARKDOWN EDITOR */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'editor' && (
        <div className="space-y-6">
          
          {/* AUTO-SAVE STATUS HEADER */}
          <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-2xl shadow-md">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                WYSIWYG Editor Status:
              </span>
              {autoSaveStatus === 'saved' && (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Draf Tersimpan Otomatis ke Cloudflare D1
                </span>
              )}
              {autoSaveStatus === 'saving' && (
                <span className="inline-flex items-center gap-1.5 text-xs text-amber-300 font-medium animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Menyimpan draf ke Cloudflare D1...
                </span>
              )}
              {autoSaveStatus === 'dirty' && (
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-300">
                  Perubahan belum tersimpan...
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePublishSubmit('draft')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700"
              >
                Simpan Draf
              </button>
              <button
                type="button"
                onClick={() => handlePublishSubmit('published')}
                className="px-4 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-md"
              >
                Publikasikan Artikel 🚀
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* MAIN EDITOR FORM (LEFT 8 COLS) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                
                {/* ARTICLE TITLE */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Judul Artikel Parenting
                  </label>
                  <input
                    type="text"
                    value={editorTitle}
                    onChange={(e) => setEditorTitle(e.target.value)}
                    placeholder="Contoh: 5 Tips Mengatasi Tantrum Balita Tanpa Marah..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
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
                      value={editorSlug}
                      onChange={(e) => setEditorSlug(e.target.value)}
                      placeholder="tips-mengatasi-tantrum-balita"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Kategori Artikel
                    </label>
                    <select
                      value={editorCategory}
                      onChange={(e) => setEditorCategory(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
                    >
                      <option value="Pola Asuh">Pola Asuh</option>
                      <option value="Tumbuh Kembang">Tumbuh Kembang</option>
                      <option value="Kesehatan & Gizi">Kesehatan & Gizi</option>
                      <option value="Psikologi Ibu">Psikologi Ibu</option>
                    </select>
                  </div>
                </div>

                {/* RICH EDITOR TOOLBAR */}
                <div className="border-t border-b border-slate-200 dark:border-slate-800 py-2 flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/40 px-3 rounded-xl">
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => insertToolbar('**', '**')}
                      className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                      title="Bold (**teks**)"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertToolbar('*', '*')}
                      className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                      title="Italic (*teks*)"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertToolbar('## ')}
                      className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                      title="Subjudul (H2)"
                    >
                      <Heading2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertToolbar('### ')}
                      className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                      title="Subjudul (H3)"
                    >
                      <Heading3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertToolbar('> ')}
                      className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                      title="Kutipan (Blockquote)"
                    >
                      <Quote className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertToolbar('- ')}
                      className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                      title="Bullet List"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>

                  {/* IMAGE UPLOAD VIA GITHUB API */}
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 text-xs font-bold inline-flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingImage ? 'Mengunggah...' : 'Upload Gambar ke GitHub'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* MARKDOWN CONTENT TEXTAREA */}
                <div>
                  <textarea
                    rows={16}
                    value={editorMarkdown}
                    onChange={(e) => setEditorMarkdown(e.target.value)}
                    placeholder="Tulis artikel parenting dalam bahasa Indonesia di sini..."
                    className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 font-mono text-sm leading-relaxed text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* SIDEBAR METADATA & AI ASSISTANT (RIGHT 4 COLS) */}
            <div className="lg:col-span-4 space-y-4">
              
              {/* GEMINI AI ASSISTANT BOX */}
              <div className="bg-gradient-to-br from-rose-500 to-pink-600 text-white rounded-3xl p-6 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                    Parenting AI Assistant
                  </span>
                </div>
                <p className="text-xs text-rose-100">
                  Otomatis hasilkan Meta Title, Meta Description, & Tag SEO menggunakan Gemini AI.
                </p>
                <button
                  type="button"
                  onClick={handleAiGenerateMeta}
                  disabled={isAiLoading || !editorTitle}
                  className="w-full py-2.5 rounded-xl bg-white text-rose-600 font-bold text-xs shadow-sm hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
                >
                  {isAiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-rose-600" />}
                  <span>Generate SEO Meta dengan AI</span>
                </button>
              </div>

              {/* METADATA & FEATURED IMAGE */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Meta SEO & Gambar Sampul
                </h4>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    URL Gambar Sampul (Featured Image)
                  </label>
                  <input
                    type="text"
                    value={editorImage}
                    onChange={(e) => setEditorImage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono"
                  />
                  {editorImage && (
                    <img
                      src={editorImage}
                      alt="Preview"
                      className="mt-2 w-full h-32 object-cover rounded-xl border"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Meta Title SEO
                  </label>
                  <input
                    type="text"
                    value={editorMetaTitle}
                    onChange={(e) => setEditorMetaTitle(e.target.value)}
                    placeholder="Judul SEO..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Meta Description SEO
                  </label>
                  <textarea
                    rows={3}
                    value={editorMetaDesc}
                    onChange={(e) => setEditorMetaDesc(e.target.value)}
                    placeholder="Ringkasan SEO..."
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Tags (Dipisahkan koma)
                  </label>
                  <input
                    type="text"
                    value={editorTags}
                    onChange={(e) => setEditorTags(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: AUTO-LINKING ENGINE MANAGER */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'autolinks' && (
        <div className="space-y-6">
          <div className="bg-rose-50 dark:bg-slate-800/60 p-6 rounded-3xl border border-rose-100 dark:border-slate-700 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-rose-600" />
              <span>Auto-Linking Engine On-Page (SEO Automation)</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Sistem ini secara otomatis memindai seluruh kata dalam artikel dan mengubah kata kunci terdaftar menjadi internal link menuju artikel pilihan Anda tanpa perlu mengedit artikel satu per satu.
            </p>
          </div>

          {/* ADD NEW AUTOLINK FORM */}
          <form onSubmit={handleAddAutolinkSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
              + Tambah Kata Kunci Autolink Baru
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Kata Kunci / Keyword
                </label>
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="Misal: 'stunting'"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Target Internal URL
                </label>
                <input
                  type="text"
                  value={newTargetUrl}
                  onChange={(e) => setNewTargetUrl(e.target.value)}
                  placeholder="/baca/mengenal-bahaya-stunting"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Keterangan Tooltip
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Panduan gizi stunting anak"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow-md transition-all"
            >
              Simpan Kata Kunci Autolink
            </button>
          </form>

          {/* AUTOLINKS TABLE */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Kata Kunci (Keyword)</th>
                  <th className="p-4">Target URL Artikel</th>
                  <th className="p-4">Deskripsi Tooltip</th>
                  <th className="p-4">Total Klik</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {autolinks.map((link) => (
                  <tr key={link.id} className="hover:bg-slate-50/80">
                    <td className="p-4 font-bold text-rose-600">#{link.keyword}</td>
                    <td className="p-4 font-mono text-[11px]">{link.targetUrl}</td>
                    <td className="p-4 text-slate-500">{link.description || '-'}</td>
                    <td className="p-4 font-bold text-emerald-600">{link.clickCount} kali</td>
                    <td className="p-4 text-right">
                      {currentUser.role === 'admin' && (
                        <button
                          onClick={() => onDeleteAutolink(link.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white font-bold"
                        >
                          Hapus
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: SEO & SITEMAP INSPECTOR */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'sitemap' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>Inspector Dynamic Sitemap & RSS Feed</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noreferrer"
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-rose-400 transition-all flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">📄 Live /sitemap.xml</div>
                  <div className="text-xs text-slate-500">Otomatis diindeks oleh Google Search Console</div>
                </div>
                <ExternalLink className="w-4 h-4 text-rose-500" />
              </a>

              <a
                href="/feed.xml"
                target="_blank"
                rel="noreferrer"
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-rose-400 transition-all flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">📡 Live /feed.xml</div>
                  <div className="text-xs text-slate-500">RSS Feed XML standar untuk sindikasi konten</div>
                </div>
                <ExternalLink className="w-4 h-4 text-amber-500" />
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
