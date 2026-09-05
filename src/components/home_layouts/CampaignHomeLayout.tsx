import React, { useState } from 'react';
import { Post, SiteConfig } from '../../types';
import { Heart, Target, Users, ArrowRight, CheckCircle2, ShieldCheck, Share2, Sparkles, MessageCircle, AlertCircle } from 'lucide-react';
import HeroPerformanceBox from '../HeroPerformanceBox';
import { optimizeUnsplashUrl } from '../../lib/imageUtils';

interface LayoutProps {
  posts: Post[];
  onSelectPost: (slug: string) => void;
  siteConfig?: SiteConfig;
}

export default function CampaignHomeLayout({ posts, onSelectPost, siteConfig }: LayoutProps) {
  const [selectedAmount, setSelectedAmount] = useState<number>(100000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [supporterName, setSupporterName] = useState<string>('');
  const [supporterMsg, setSupporterMsg] = useState<string>('');
  const [isDonated, setIsDonated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'donasi' | 'petisi'>('donasi');
  const [petitionSigned, setPetitionSigned] = useState<boolean>(false);

  const rawTarget = siteConfig?.campaign_target_amount ? parseInt(siteConfig.campaign_target_amount.replace(/\D/g, ''), 10) : 500000000;
  const rawCurrent = siteConfig?.campaign_current_amount ? parseInt(siteConfig.campaign_current_amount.replace(/\D/g, ''), 10) : 388500000;
  const targetAmount = isNaN(rawTarget) || rawTarget <= 0 ? 500000000 : rawTarget;
  const currentAmount = isNaN(rawCurrent) ? 388500000 : rawCurrent;
  const percentage = Math.min(100, Math.round((currentAmount / targetAmount) * 100));

  const handleSupport = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'donasi') {
      setIsDonated(true);
      setTimeout(() => setIsDonated(false), 3500);
    } else {
      setPetitionSigned(true);
      setTimeout(() => setPetitionSigned(false), 3500);
    }
  };

  return (
    <div className="space-y-12">
      {/* CAMPAIGN HERO BANNER */}
      <section className="rounded-3xl bg-gradient-to-br from-rose-900 via-rose-800 to-amber-900 text-white p-8 sm:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute -bottom-10 -right-10 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-black text-amber-200 border border-white/20">
              <Heart className="w-3.5 h-3.5 fill-current text-rose-400" />
              <span>{siteConfig?.campaign_badge_text || 'Aksi Sosial Nasional'}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              {siteConfig?.campaign_title || 'Gerakan 1.000 Hari Pertama: Wujudkan Generasi Bebas Stunting'}
            </h1>

            <p className="text-rose-100 text-sm sm:text-base leading-relaxed">
              {siteConfig?.campaign_subtitle || 'Setiap anak Indonesia berhak mendapatkan nutrisi optimal dan kasih sayang sejak hari pertama kehidupan. Bersama, kita distribusikan paket gizi tinggi protein hewani dan pendampingan dokter posyandu ke pelosok negeri.'}
            </p>

            {/* PROGRESS METRICS */}
            <div className="p-6 rounded-2xl bg-black/25 backdrop-blur-md border border-white/10 space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-xs font-semibold text-rose-200 uppercase tracking-wider">Terkumpul</div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-300">
                    Rp {currentAmount.toLocaleString('id-ID')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-rose-200 uppercase tracking-wider">Target</div>
                  <div className="text-base sm:text-lg font-bold text-white">
                    Rp {targetAmount.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              {/* PROGRESS BAR */}
              <div className="w-full h-3.5 bg-white/20 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-colors duration-1000 shadow-sm"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-rose-100 font-semibold">
                <span>{percentage}% Tercapai</span>
                <span>{siteConfig?.campaign_donor_count || '1.428'} Donatur & Relawan</span>
                <span>Aktif Berjalan</span>
              </div>
            </div>

            {/* PERFORMANCE METRICS BOX */}
            <HeroPerformanceBox siteConfig={siteConfig} />
          </div>

          {/* INTERACTIVE DONATION / PETITION BOX */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex border-b border-slate-200 dark:border-slate-800 pb-3">
              <button
                onClick={() => setActiveTab('donasi')}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition-colors ${
                  activeTab === 'donasi'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Donasi Gizi
              </button>
              <button
                onClick={() => setActiveTab('petisi')}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition-colors ${
                  activeTab === 'petisi'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Tandatangani Petisi
              </button>
            </div>

            {isDonated || petitionSigned ? (
              <div className="p-6 text-center space-y-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-300">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-emerald-800 dark:text-emerald-200">
                  {activeTab === 'donasi' ? 'Terima Kasih atas Donasi Anda!' : 'Petisi Berhasil Ditandatangani!'}
                </h4>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Dukungan Anda sangat berarti bagi kelangsungan hidup anak-anak generasi penerus bangsa.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSupport} className="space-y-4">
                {activeTab === 'donasi' ? (
                  <>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Pilih Nominal Bantuan:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[25000, 50000, 100000, 250000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            setSelectedAmount(amt);
                            setCustomAmount('');
                          }}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                            selectedAmount === amt && !customAmount
                              ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          Rp {amt.toLocaleString('id-ID')}
                        </button>
                      ))}
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Atau nominal lainnya (Rp)..."
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </>
                ) : (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-800 dark:text-rose-200 space-y-1">
                    <div className="font-bold">Tuntutan Petisi:</div>
                    <p className="text-[11px] leading-relaxed">
                      "Mendorong alokasi anggaran protein hewani dan pemeriksaan gratis ibu hamil di seluruh Puskesmas pelosok Indonesia."
                    </p>
                  </div>
                )}

                <div>
                  <input
                    type="text"
                    required
                    placeholder="Nama Lengkap / Anonim"
                    value={supporterName}
                    onChange={(e) => setSupporterName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <textarea
                    rows={2}
                    placeholder="Pesan Semangat untuk Anak & Bunda (Opsional)"
                    value={supporterMsg}
                    onChange={(e) => setSupporterMsg(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-xl shadow-rose-600/30 transition-colors flex items-center justify-center gap-2"
                >
                  <Heart className="w-4 h-4 fill-current" />
                  <span>{activeTab === 'donasi' ? 'Salurkan Bantuan Sekarang' : 'Tandatangani Petisi Sekarang'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 4 ACTION PILLARS */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">
            Pilar Realisasi Aksi
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Bagaimana Setiap Kontribusi Anda Berdampak
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Paket MPASI Telur & Ikan',
              desc: 'Penyaluran mingguan pangan kaya zat besi dan DHA untuk balita rawan stunting.',
              icon: Target,
            },
            {
              title: 'Edukasi Bidan & Kader',
              desc: 'Pelatihan pengukuran tinggi badan presisi & konseling gizi bagi kader Posyandu desa.',
              icon: Users,
            },
            {
              title: 'Pemeriksaan USG Gratis',
              desc: 'Fasilitas skrining kesehatan ibu hamil risiko tinggi di daerah terpencil.',
              icon: ShieldCheck,
            },
            {
              title: 'Advokasi Kebijakan Publik',
              desc: 'Mendorong regulasi perlindungan ruang menyusui dan cuti melahirkan yang memadai.',
              icon: Sparkles,
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs hover:shadow-md transition-colors"
            >
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                <item.icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">{item.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CAMPAIGN ARTICLES & FIELD REPORTS */}
      <section className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-rose-500" />
            <span>Kabar Lapangan & Panduan Edukasi Gerakan</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.slice(0, 3).map((post) => (
            <article
              key={post.id}
              onClick={() => onSelectPost(post.slug)}
              className="cursor-pointer group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-colors space-y-3"
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
