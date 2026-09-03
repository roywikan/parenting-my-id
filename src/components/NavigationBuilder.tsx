import React, { useState } from 'react';
import { NavLink } from '../types';
import { Plus, Trash2, ArrowUp, ArrowDown, Code, LayoutGrid, RotateCcw, Link as LinkIcon, ExternalLink, Compass } from 'lucide-react';

interface PresetOption {
  label: string;
  url: string;
}

interface NavigationBuilderProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  links: NavLink[];
  onChange: (links: NavLink[]) => void;
  defaultPresets?: PresetOption[];
  onResetToDefault?: () => void;
}

export const PRESET_NAV_ITEMS: PresetOption[] = [
  { label: 'Beranda', url: '/' },
  { label: 'Pola Asuh', url: '/kategori/pola-asuh' },
  { label: 'Tumbuh Kembang', url: '/kategori/tumbuh-kembang' },
  { label: 'Kesehatan & Gizi', url: '/kategori/kesehatan-gizi' },
  { label: 'Balita', url: '/balita' },
  { label: 'Kebijakan Privasi', url: '/privacy' },
  { label: 'Tentang Kami', url: '/about' },
  { label: 'Hubungi Kami', url: '/contact' },
  { label: 'Disclaimer', url: '/disclaimer' },
  { label: 'Syarat & Ketentuan', url: '/terms' },
  { label: 'Sitemap XML', url: '/sitemap.xml' },
  { label: 'RSS Feed', url: '/feed.xml' },
];

export default function NavigationBuilder({
  title,
  description,
  icon,
  links = [],
  onChange,
  defaultPresets = PRESET_NAV_ITEMS,
  onResetToDefault,
}: NavigationBuilderProps) {
  const [showJsonMode, setShowJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState(JSON.stringify(links, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Sync json string if links change outside
  const handleVisualChange = (newLinks: NavLink[]) => {
    onChange(newLinks);
    setJsonText(JSON.stringify(newLinks, null, 2));
    setJsonError(null);
  };

  const handleAddItem = (item?: { label: string; url: string }) => {
    const newItem: NavLink = item || { label: 'Menu Baru', url: '/' };
    handleVisualChange([...links, newItem]);
  };

  const handleUpdateItem = (index: number, field: 'label' | 'url', value: string) => {
    const updated = [...links];
    updated[index] = { ...updated[index], [field]: value };
    handleVisualChange(updated);
  };

  const handleDeleteItem = (index: number) => {
    const updated = links.filter((_, i) => i !== index);
    handleVisualChange(updated);
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === links.length - 1)
    ) {
      return;
    }
    const updated = [...links];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    handleVisualChange(updated);
  };

  const handleJsonTextChange = (text: string) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        setJsonError(null);
        onChange(parsed);
      } else {
        setJsonError('JSON harus berupa Array format [{"label": "...", "url": "..."}]');
      }
    } catch (err: any) {
      setJsonError('Format JSON belum valid: ' + err.message);
    }
  };

  const getUrlBadge = (url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">EXTERNAL</span>;
    }
    if (url.startsWith('/kategori/')) {
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">KATEGORI</span>;
    }
    if (url.endsWith('.xml')) {
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">FEED/XML</span>;
    }
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">HALAMAN</span>;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
            {icon || <Compass className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{title}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {links.length} Menu
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onResetToDefault && (
            <button
              type="button"
              onClick={onResetToDefault}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 flex items-center gap-1 transition-colors"
              title="Kembalikan ke susunan menu bawaan"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setJsonText(JSON.stringify(links, null, 2));
              setShowJsonMode(!showJsonMode);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              showJsonMode
                ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {showJsonMode ? <LayoutGrid className="w-3.5 h-3.5" /> : <Code className="w-3.5 h-3.5" />}
            <span>{showJsonMode ? 'Mode Visual Editor' : 'Mode JSON Lanjutan'}</span>
          </button>
        </div>
      </div>

      {/* QUICK PRESET BUTTONS */}
      {!showJsonMode && (
        <div className="space-y-1.5 bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
            ⚡ Tambah Instan dari Preset Populer (Sekali Klik):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {defaultPresets.map((preset, idx) => {
              const alreadyExists = links.some((l) => l.url === preset.url);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddItem(preset)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    alreadyExists
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-default opacity-80'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-300'
                  }`}
                >
                  <Plus className="w-3 h-3" />
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* MODE JSON LANJUTAN */}
      {showJsonMode ? (
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Edit Kode JSON Langsung (Otomatis Tersinkronkan dengan Mode Visual):
          </label>
          <textarea
            value={jsonText}
            onChange={(e) => handleJsonTextChange(e.target.value)}
            rows={8}
            className={`w-full p-3 rounded-xl font-mono text-xs border focus:ring-2 focus:outline-none ${
              jsonError
                ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 focus:ring-rose-500'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-rose-500'
            }`}
          />
          {jsonError && (
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
              ⚠️ {jsonError}
            </p>
          )}
        </div>
      ) : (
        /* MODE VISUAL EDITOR */
        <div className="space-y-2.5">
          {links.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <p className="text-xs text-slate-500 font-medium mb-3">Belum ada item menu yang dibuat.</p>
              <button
                type="button"
                onClick={() => handleAddItem({ label: 'Menu Utama', url: '/' })}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-sm hover:bg-rose-700 inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Menu Pertama</span>
              </button>
            </div>
          ) : (
            links.map((link, idx) => (
              <div
                key={idx}
                className="group flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:border-rose-200 dark:hover:border-slate-700 transition-all"
              >
                {/* REORDER & BADGE */}
                <div className="flex items-center gap-1.5 self-start sm:self-center">
                  <span className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-800 text-[11px] font-extrabold text-slate-600 dark:text-slate-300 flex items-center justify-center">
                    {idx + 1}
                  </span>

                  <div className="flex flex-row sm:flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => handleMoveItem(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Geser ke atas"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveItem(idx, 'down')}
                      disabled={idx === links.length - 1}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Geser ke bawah"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* LABEL INPUT */}
                <div className="flex-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 sm:hidden">
                    Nama Menu
                  </label>
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => handleUpdateItem(idx, 'label', e.target.value)}
                    placeholder="Nama Menu (misal: Balita)"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                {/* URL INPUT */}
                <div className="flex-[1.5] relative">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 sm:hidden">
                    Tautan / URL
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={link.url}
                      onChange={(e) => handleUpdateItem(idx, 'url', e.target.value)}
                      placeholder="URL (misal: /balita atau https://...)"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                    <div className="hidden md:block shrink-0">{getUrlBadge(link.url)}</div>
                  </div>
                </div>

                {/* DELETE BUTTON */}
                <div className="flex items-center justify-end self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(idx)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                    title="Hapus menu ini"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}

          {/* ADD CUSTOM ITEM BUTTON */}
          <div className="pt-2 flex justify-between items-center">
            <button
              type="button"
              onClick={() => handleAddItem()}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-rose-600 dark:hover:bg-rose-700 text-xs font-bold shadow-sm hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Item Menu Baru</span>
            </button>
            <span className="text-[11px] font-medium text-slate-400">
              {links.length} item dikonfigurasi
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
