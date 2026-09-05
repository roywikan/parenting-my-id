import React, { useMemo } from 'react';
import { Search, CheckCircle2, AlertTriangle, XCircle, Sparkles, Sliders, ShieldCheck } from 'lucide-react';

interface SeoAuditWidgetProps {
  title: string;
  metaTitle: string;
  setMetaTitle: (val: string) => void;
  metaDesc: string;
  setMetaDesc: (val: string) => void;
  markdown: string;
  featuredImage: string;
  tags: string;
  onAutoOptimizeMeta: () => void;
}

export default function SeoAuditWidget({
  title,
  metaTitle,
  setMetaTitle,
  metaDesc,
  setMetaDesc,
  markdown,
  featuredImage,
  tags,
  onAutoOptimizeMeta,
}: SeoAuditWidgetProps) {

  const audit = useMemo(() => {
    const cleanTitle = (metaTitle || title || '').trim();
    const titleLength = cleanTitle.length;

    const cleanDesc = (metaDesc || '').trim();
    const descLength = cleanDesc.length;

    const plainText = (markdown || '').replace(/<[^>]+>/g, '').replace(/[#*`_~]/g, ' ');
    const words = plainText.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    const h2Count = (markdown.match(/^##\s+/gm) || []).length;
    const h3Count = (markdown.match(/^###\s+/gm) || []).length;

    const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);

    // Checks & Scores
    const checks = [
      {
        id: 'title_length',
        label: 'Panjang Judul SEO (Meta Title)',
        desc: titleLength >= 30 && titleLength <= 65
          ? `Sangat Baik (${titleLength} karakter, optimal 30-65)`
          : titleLength < 30
          ? `Terlalu Pendek (${titleLength} karakter, disarankan >= 30)`
          : `Terlalu Panjang (${titleLength} karakter, bisa terpotong di SERP)`,
        passed: titleLength >= 30 && titleLength <= 65,
        warning: titleLength > 65 || (titleLength >= 15 && titleLength < 30),
        weight: 15,
      },
      {
        id: 'meta_desc',
        label: 'Meta Deskripsi Snippet Search',
        desc: descLength >= 120 && descLength <= 165
          ? `Sangat Baik (${descLength} karakter, optimal 120-165)`
          : descLength === 0
          ? 'Kosong (Belum diisi)'
          : descLength < 120
          ? `Sedikit Pendek (${descLength} karakter, disarankan 120-165)`
          : `Terlalu Panjang (${descLength} karakter, melebihi batas snippet)`,
        passed: descLength >= 120 && descLength <= 165,
        warning: descLength > 0 && (descLength < 120 || descLength > 165),
        weight: 20,
      },
      {
        id: 'content_depth',
        label: 'Kedalaman Isi Artikel (Jumlah Kata)',
        desc: wordCount >= 300
          ? `Memenuhi Standar SEO Google (${wordCount} kata)`
          : wordCount >= 150
          ? `Cukup Baik (${wordCount} kata, disarankan >= 300 kata untuk peringkat tinggi)`
          : `Terlalu Tipis (${wordCount} kata, berisiko Thin Content)`,
        passed: wordCount >= 300,
        warning: wordCount >= 150 && wordCount < 300,
        weight: 20,
      },
      {
        id: 'subheadings',
        label: 'Struktur Heading & Sub-Judul (H2 / H3)',
        desc: (h2Count + h3Count) >= 2
          ? `Terstruktur Baik (${h2Count} H2, ${h3Count} H3)`
          : (h2Count + h3Count) === 1
          ? 'Perlu ditambah (Disarankan minimal 2 Sub-Heading H2)'
          : 'Belum ada Sub-Heading (Gunakan ## atau ###)',
        passed: (h2Count + h3Count) >= 2,
        warning: (h2Count + h3Count) === 1,
        weight: 15,
      },
      {
        id: 'featured_image',
        label: 'Gambar Utama & Visual OG Image',
        desc: featuredImage
          ? 'Gambar Utama Tersedia & Siap untuk Rich Visual Snippet'
          : 'Belum ada Gambar Utama (Disarankan unggah gambar)',
        passed: Boolean(featuredImage),
        warning: false,
        weight: 15,
      },
      {
        id: 'tags_keywords',
        label: 'Topik Utama / Tag Artikel',
        desc: tagList.length >= 2
          ? `Terdaftar ${tagList.length} Topik Tag`
          : tagList.length === 1
          ? 'Hanya 1 Tag (Disarankan minimal 2-4 tag)'
          : 'Belum ada Tag Topik Utama',
        passed: tagList.length >= 2,
        warning: tagList.length === 1,
        weight: 15,
      },
    ];

    let totalScore = 0;
    checks.forEach((c) => {
      if (c.passed) {
        totalScore += c.weight;
      } else if (c.warning) {
        totalScore += Math.floor(c.weight * 0.5);
      }
    });

    return { checks, score: Math.min(100, totalScore), wordCount, titleLength, descLength };
  }, [title, metaTitle, metaDesc, markdown, featuredImage, tags]);

  const scoreColor = audit.score >= 80 ? 'emerald' : audit.score >= 50 ? 'amber' : 'rose';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <span>Auditor SEO In-Page Real-Time</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                Auto Analysis
              </span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Analisis otomatis struktur meta, keterbacaan, dan kelengkapan SEO Google Search
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAutoOptimizeMeta}
          className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
          title="Isi Meta Title & Meta Description secara otomatis berbasis konten"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Optimasikan Meta SEO Otomatis</span>
        </button>
      </div>

      {/* Score Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
        <div className="flex items-center gap-3 sm:col-span-2">
          <div className="relative flex items-center justify-center w-14 h-14 shrink-0">
            <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-200 dark:text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={scoreColor === 'emerald' ? 'text-emerald-500' : scoreColor === 'amber' ? 'text-amber-500' : 'text-rose-500'}
                strokeDasharray={`${audit.score}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute font-black text-sm text-slate-900 dark:text-white">
              {audit.score}%
            </span>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Skor SEO Artikel</div>
            <div className={`text-sm font-extrabold ${scoreColor === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : scoreColor === 'amber' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {audit.score >= 80 ? 'Sangat Siap Peringkat Tinggi' : audit.score >= 50 ? 'Cukup Baik (Perlu Penyempurnaan)' : 'Perlu Perbaikan Metadata'}
            </div>
          </div>
        </div>

        <div className="text-center sm:border-l border-slate-200 dark:border-slate-800 pl-2">
          <div className="text-xs font-semibold text-slate-500">Jumlah Kata</div>
          <div className="text-base font-black text-slate-900 dark:text-white">{audit.wordCount} Kata</div>
        </div>

        <div className="text-center sm:border-l border-slate-200 dark:border-slate-800 pl-2">
          <div className="text-xs font-semibold text-slate-500">Estimasi Keterbacaan</div>
          <div className="text-base font-black text-slate-900 dark:text-white">
            {Math.max(1, Math.ceil(audit.wordCount / 200))} Menit
          </div>
        </div>
      </div>

      {/* Checklist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {audit.checks.map((item) => (
          <div
            key={item.id}
            className={`p-3 rounded-xl border flex items-start gap-2.5 transition-colors ${
              item.passed
                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-950 dark:text-emerald-200'
                : item.warning
                ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-950 dark:text-amber-200'
                : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-950 dark:text-rose-200'
            }`}
          >
            {item.passed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : item.warning ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            )}

            <div className="min-w-0 flex-1">
              <div className="text-xs font-extrabold flex items-center justify-between">
                <span>{item.label}</span>
              </div>
              <p className="text-[11px] opacity-80 mt-0.5 leading-snug">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
