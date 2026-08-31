import React, { useState } from 'react';
import { Post, SiteConfig } from '../../types';
import { Building2, ShieldCheck, Users2, BarChart3, ArrowRight, CheckCircle2, Mail, Phone, Globe, BookOpen } from 'lucide-react';
import { optimizeUnsplashUrl } from '../../lib/imageUtils';

interface LayoutProps {
  posts: Post[];
  onSelectPost: (slug: string) => void;
  siteConfig?: SiteConfig;
}

export default function CorporateHomeLayout({ posts, onSelectPost, siteConfig }: LayoutProps) {
  const [b2bSent, setB2bSent] = useState(false);
  const [b2bForm, setB2bForm] = useState({ company: '', picName: '', email: '', phone: '', service: 'Corporate Daycare & Parenting Benefit' });

  const handleB2bSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setB2bSent(true);
    setTimeout(() => setB2bSent(false), 3000);
  };

  return (
    <div className="space-y-12">
      {/* CORPORATE HERO BANNER */}
      <section className="p-8 sm:p-12 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-rose-300 text-xs font-black uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5" />
              <span>{siteConfig?.corporate_badge_text || 'Solusi Korporasi & Institusi Edukasi'}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              {siteConfig?.corporate_title || 'Meningkatkan Produktivitas Karyawan Melalui Dukungan Pengasuhan Terpercaya'}
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              {siteConfig?.corporate_subtitle || 'Kami bermitra dengan perusahaan terdepan untuk menyediakan program Employee Assistance Parenting (EAP), konsultasi daycare in-house, dan lokakarya kesehatan anak bagi karyawan.'}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href={siteConfig?.corporate_whatsapp ? `https://wa.me/${siteConfig.corporate_whatsapp}?text=Halo%20kami%20ingin%20konsultasi%20program%20parenting%20korporasi` : '#hubungi-b2b'}
                target={siteConfig?.corporate_whatsapp ? '_blank' : '_self'}
                rel="noreferrer"
                className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-xl shadow-rose-600/30 transition-all hover:scale-105 inline-flex items-center gap-2"
              >
                <span>Konsultasi Kebutuhan Perusahaan</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#solusi-bisnis"
                className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all"
              >
                Jelajahi Layanan
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
              <div className="text-3xl font-black text-rose-400">{siteConfig?.corporate_stat1_val || '98.4%'}</div>
              <div className="text-xs font-bold text-slate-200">{siteConfig?.corporate_stat1_lbl || 'Kepuasan Klien B2B'}</div>
              <p className="text-[10px] text-slate-400">Berdasarkan survey tahunan terhadap 50+ mitra korporasi.</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
              <div className="text-3xl font-black text-emerald-400">{siteConfig?.corporate_stat2_val || '45%'}</div>
              <div className="text-xs font-bold text-slate-200">{siteConfig?.corporate_stat2_lbl || 'Penurunan Absenteeism'}</div>
              <p className="text-[10px] text-slate-400">Karyawan lebih tenang dengan anak yang terfasilitasi.</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2 col-span-2">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-rose-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-200">Sertifikasi Standar Medis & Psikologi</div>
                  <div className="text-[10px] text-slate-400">Seluruh materi dirancang oleh dokter spesialis anak berlisensi.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE BUSINESS SOLUTIONS */}
      <section id="solusi-bisnis" className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">
            Pilar Solusi B2B
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Layanan Terintegrasi untuk Perusahaan
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Corporate Daycare & Nursery Setup',
              desc: 'Perancangan ruang penitipan anak kantor yang higienis, aman, dan berstandar regulasi pemerintah.',
              icon: Building2,
            },
            {
              title: 'Employee Parenting Assistance (EAP)',
              desc: 'Saluran hotline tele-konseling psikologi anak dan dokter spesialis 24/7 bagi staf perusahaan.',
              icon: Users2,
            },
            {
              title: 'Custom In-House Wellness Workshops',
              desc: 'Seminar bulanan interaktif membahas work-life integration, gizi balita, dan pendidikan dini.',
              icon: BarChart3,
            },
          ].map((sol, idx) => (
            <div
              key={idx}
              className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                <sol.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{sol.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{sol.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* B2B INQUIRY FORM */}
      <section id="hubungi-b2b" className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        <div className="max-w-2xl mx-auto text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Konsultasikan Kebutuhan Parenting Perusahaan Anda
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Tim konsultan korporasi kami siap merancang proposal dan demo layanan terbaik.
          </p>
        </div>

        {b2bSent ? (
          <div className="p-8 text-center space-y-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-300 max-w-md mx-auto">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-emerald-800 dark:text-emerald-200">Permintaan Terkirim!</h4>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              Account Manager kami akan menghubungi perusahaan Anda dalam 1x24 jam kerja.
            </p>
          </div>
        ) : (
          <form onSubmit={handleB2bSubmit} className="max-w-xl mx-auto space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Perusahaan / Institusi
                </label>
                <input
                  type="text"
                  required
                  value={b2bForm.company}
                  onChange={(e) => setB2bForm({ ...b2bForm, company: e.target.value })}
                  placeholder="PT Maju Bersama Sejahtera"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama PIC / HRD
                </label>
                <input
                  type="text"
                  required
                  value={b2bForm.picName}
                  onChange={(e) => setB2bForm({ ...b2bForm, picName: e.target.value })}
                  placeholder="Ibu Sarah (HR Manager)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Perusahaan
                </label>
                <input
                  type="email"
                  required
                  value={b2bForm.email}
                  onChange={(e) => setB2bForm({ ...b2bForm, email: e.target.value })}
                  placeholder="sarah@perusahaan.co.id"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor Telepon / WhatsApp
                </label>
                <input
                  type="tel"
                  required
                  value={b2bForm.phone}
                  onChange={(e) => setB2bForm({ ...b2bForm, phone: e.target.value })}
                  placeholder="021-5551234 / 0812..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-xl shadow-rose-600/30 transition-all"
              >
                Kirim Permintaan Proposal Korporasi
              </button>
            </div>
          </form>
        )}
      </section>

      {/* CORPORATE INSIGHTS & ARTICLES */}
      <section className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-rose-500" />
            <span>Corporate Insights & Riset Manajemen Keluarga</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.slice(0, 3).map((post) => (
            <article
              key={post.id}
              onClick={() => onSelectPost(post.slug)}
              className="cursor-pointer group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all space-y-3"
            >
              <div className="aspect-[16/9] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={optimizeUnsplashUrl(post.featuredImage, 400, 50)}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <span className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400">
                {post.category}
              </span>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 group-hover:text-rose-600 transition-colors">
                {post.title}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-2">{post.excerpt}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
