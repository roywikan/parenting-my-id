import React, { useState } from 'react';
import { Post, SiteConfig } from '../../types';
import { Award, BookOpen, Calendar, CheckCircle2, MessageCircle, Sparkles, Star, ArrowRight, ShieldCheck, Mail } from 'lucide-react';
import HeroPerformanceBox from '../HeroPerformanceBox';
import { optimizeUnsplashUrl, getOptimizedAvatarUrl } from '../../lib/imageUtils';

interface LayoutProps {
  posts: Post[];
  onSelectPost: (slug: string) => void;
  siteConfig?: SiteConfig;
}

export default function PersonalBrandingHomeLayout({ posts, onSelectPost, siteConfig }: LayoutProps) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookedSuccess, setBookedSuccess] = useState(false);
  const [bookingData, setBookingData] = useState({ name: '', phone: '', topic: 'Konsultasi Nutrisi & GTM' });

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setBookedSuccess(true);
    setTimeout(() => {
      setBookedSuccess(false);
      setBookingOpen(false);
    }, 2500);
  };

  return (
    <div className="space-y-12">
      {/* PERSONAL HERO SPOTLIGHT */}
      <section className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* PROFILE IMAGE WITH BADGES */}
          <div className="lg:col-span-5 relative text-center">
            <div className="relative inline-block">
              <img
                src={siteConfig?.doctor_avatar_url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&h=600&fit=crop&q=80'}
                alt={siteConfig?.doctor_name || 'Pakar Parenting'}
                className="w-64 h-64 sm:w-80 sm:h-80 rounded-3xl object-cover shadow-2xl border-4 border-rose-500/80 mx-auto"
              />
              <div className="absolute -bottom-4 -right-2 bg-rose-600 text-white px-4 py-2 rounded-2xl shadow-xl flex items-center gap-1.5 text-xs font-black">
                <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
                <span>{siteConfig?.doctor_experience_years || '15+ Tahun Pengalaman'}</span>
              </div>
            </div>
          </div>

          {/* PROFILE BIO & CREDENTIALS */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{siteConfig?.doctor_badge_text || 'Dokter Spesialis Anak & Konsultan Pengasuhan'}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              {siteConfig?.doctor_name || 'dr. Siti Rahma, Sp.A(K), M.Kes'}
            </h1>

            <div className="text-sm font-bold text-rose-600 dark:text-rose-400">
              {siteConfig?.doctor_title || 'Dokter Spesialis Anak & Konsultan Nutrisi Pediatrik'}
            </div>

            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
              {siteConfig?.doctor_bio || 'Membantu ratusan ribu orang tua muda di Indonesia menavigasi fase emas tumbuh kembang buah hati dengan pendekatan medis berbasis bukti, empati, dan komunikasi tanpa bentakan.'}
            </p>

            {/* CREDENTIAL PILLS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                <div className="text-xl font-black text-rose-600">50.000+</div>
                <div className="text-[10px] font-bold text-slate-500">Pasien & Klien</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                <div className="text-xl font-black text-rose-600">4 Buku</div>
                <div className="text-[10px] font-bold text-slate-500">National Best Seller</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center col-span-2 sm:col-span-1">
                <div className="text-xl font-black text-rose-600">300+</div>
                <div className="text-[10px] font-bold text-slate-500">Keynote Speaker</div>
              </div>
            </div>

            {/* ACTION BUTTONS & PERFORMANCE METRICS */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setBookingOpen(true)}
                className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-xl shadow-rose-600/30 transition-all hover:scale-105 inline-flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Jadwalkan Konsultasi / Sesi Privat</span>
              </button>
              <a
                href="#koleksi-artikel"
                className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all"
              >
                Baca Panduan Resmi
              </a>
            </div>

            {/* PERFORMANCE METRICS BOX */}
            <div className="pt-2">
              <HeroPerformanceBox
                siteConfig={siteConfig}
                containerClassName="gap-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl shadow-sm text-center"
                valueClassName="text-xl font-black text-rose-600 dark:text-rose-400"
                labelClassName="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES & PROGRAMS */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">
            Layanan & Program Eksklusif
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Program Pendampingan Keluarga
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Konsultasi 1-on-1 Nutrisi & GTM',
              desc: 'Penyusunan menu MPASI individual sesuai kurva pertumbuhan dan riwayat alergi balita.',
              icon: MessageCircle,
              price: 'Mulai Rp 350.000 / Sesi',
            },
            {
              title: 'Masterclass Webinar Eksklusif',
              desc: 'Lokakarya online intensif membahas manajemen emosi balita, sleep training, dan stimulasi bicara.',
              icon: Award,
              price: 'Akses Rekaman Seumur Hidup',
            },
            {
              title: 'Corporate & School Workshops',
              desc: 'Pelatihan komprehensif parenting untuk institusi pendidikan, korporasi, dan lembaga kesehatan.',
              icon: ShieldCheck,
              price: 'Paket In-House Training',
            },
          ].map((srv, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                  <srv.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{srv.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{srv.desc}</p>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{srv.price}</span>
                <button
                  onClick={() => setBookingOpen(true)}
                  className="text-xs font-black text-slate-900 dark:text-white hover:text-rose-600 transition-colors"
                >
                  Pilih →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ARTICLES WRITTEN BY THE EXPERT */}
      <section id="koleksi-artikel" className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-rose-500" />
            <span>Koleksi Tulisan & Panduan Edukasi Resmi</span>
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

      {/* BOOKING MODAL */}
      {bookingOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Jadwalkan Sesi Konsultasi Privat
              </h3>
              <button
                onClick={() => setBookingOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {bookedSuccess ? (
              <div className="p-6 text-center space-y-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-300">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-emerald-800 dark:text-emerald-200">Jadwal Terkirim!</h4>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Tim asisten dr. Siti Rahma akan segera menghubungi WhatsApp Anda untuk konfirmasi waktu.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBooking} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Topik Konsultasi
                  </label>
                  <select
                    value={bookingData.topic}
                    onChange={(e) => setBookingData({ ...bookingData, topic: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Konsultasi Nutrisi & GTM">Konsultasi Nutrisi & GTM (Gerakan Tutup Mulut)</option>
                    <option value="Evaluasi Tumbuh Kembang & Speech Delay">Evaluasi Tumbuh Kembang & Speech Delay</option>
                    <option value="Konseling Manajemen Emosi & Tantrum">Konseling Manajemen Emosi & Tantrum</option>
                    <option value="Undangan Pembicara / Seminar">Undangan Pembicara / Seminar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Orang Tua / Institusi
                  </label>
                  <input
                    type="text"
                    required
                    value={bookingData.name}
                    onChange={(e) => setBookingData({ ...bookingData, name: e.target.value })}
                    placeholder="Contoh: Bunda Nadia & Ayah Dimas"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor WhatsApp
                  </label>
                  <input
                    type="tel"
                    required
                    value={bookingData.phone}
                    onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
                    placeholder="081234567890"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg transition-all"
                  >
                    Kirim Permintaan Jadwal
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
