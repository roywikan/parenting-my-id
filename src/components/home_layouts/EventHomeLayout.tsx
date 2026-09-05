import React, { useState, useEffect } from 'react';
import { Post, SiteConfig } from '../../types';
import { Calendar, MapPin, Clock, Users, Ticket, ArrowRight, Video, CheckCircle2, ShieldCheck, Sparkles, BookOpen } from 'lucide-react';
import HeroPerformanceBox from '../HeroPerformanceBox';
import { optimizeUnsplashUrl, getOptimizedAvatarUrl } from '../../lib/imageUtils';

interface LayoutProps {
  posts: Post[];
  onSelectPost: (slug: string) => void;
  siteConfig?: SiteConfig;
}

export default function EventHomeLayout({ posts, onSelectPost, siteConfig }: LayoutProps) {
  const [activeDay, setActiveDay] = useState<number>(1);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const [regForm, setRegForm] = useState({ name: '', email: '', phone: '', tier: 'VIP Workshop' });

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({ days: 42, hours: 14, minutes: 28, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const eventSpeakers = [
    {
      name: 'dr. Siti Rahma, Sp.A(K)',
      role: 'Spesialis Anak & Konsultan Nutrisi Pediatrik',
      topic: 'Optimalisasi 1000 Hari Pertama & Pencegahan Stunting Dini',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&q=80',
    },
    {
      name: 'Farhan Maulana, M.Psi., Psikolog',
      role: 'Pakar Psikologi Anak & Remaja',
      topic: 'Strategi Mengelola Emosi, Regulasi Diri, & Tantrum Balita',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&q=80',
    },
    {
      name: 'Dr. Anita Wijaya, M.Ed',
      role: 'Konsultan Pendidikan Anak Usia Dini',
      topic: 'Kurikulum Stimulasi Sensori & Literasi Dini di Rumah',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&q=80',
    },
  ];

  const scheduleDays = [
    {
      day: 1,
      title: 'Hari 1: Fondasi Gizi, Imunisasi & Kesehatan Holistik',
      date: 'Jumat, 16 Oktober 2026',
      sessions: [
        { time: '08:30 - 09:00', title: 'Registrasi & Opening Summit Address', speaker: 'Komite Parenting Indonesia' },
        { time: '09:00 - 10:30', title: 'Keynote: Transformasi Pola Asuh Era Digital', speaker: 'dr. Siti Rahma, Sp.A(K)' },
        { time: '10:45 - 12:15', title: 'Masterclass: Menu MPASI Kaya Protein Hewani', speaker: 'Tim Ahli Gizi' },
        { time: '13:30 - 15:30', title: 'Sesi Tanya Jawab & Konsultasi Langsung', speaker: 'Semua Narasumber' },
      ],
    },
    {
      day: 2,
      title: 'Hari 2: Psikologi Perkembangan & Emotional Intelligence',
      date: 'Sabtu, 17 Oktober 2026',
      sessions: [
        { time: '09:00 - 10:30', title: 'Memahami Bahasa Tubuh & Trauma Emosi Balita', speaker: 'Farhan Maulana, M.Psi.' },
        { time: '10:45 - 12:30', title: 'Workshop Interaktif: Komunikasi Tanpa Bentakan', speaker: 'Pakar Parenting' },
        { time: '13:30 - 16:00', title: 'Studi Kasus & Roleplay Pengasuhan Positif', speaker: 'Fasilitator Utama' },
      ],
    },
    {
      day: 3,
      title: 'Hari 3: Literasi Dini, Kreativitas & Komunitas Keluarga',
      date: 'Minggu, 18 Oktober 2026',
      sessions: [
        { time: '09:00 - 11:00', title: 'Metode Fun-Learning di Rumah Tanpa Gadget', speaker: 'Dr. Anita Wijaya, M.Ed' },
        { time: '11:15 - 13:00', title: 'Peluncuran Modul Panduan & E-Sertifikat', speaker: 'Penutupan Acara' },
      ],
    },
  ];

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisteredSuccess(true);
    setTimeout(() => {
      setRegisteredSuccess(false);
      setTicketModalOpen(false);
    }, 2500);
  };

  return (
    <div className="space-y-12">
      {/* EVENT HERO BANNER */}
      <section className="relative rounded-3xl overflow-hidden bg-slate-950 text-white border border-slate-800 shadow-2xl p-8 sm:p-12">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-950/80 via-slate-900/90 to-indigo-950/80 z-0" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-6">
          {/* EVENT BADGE */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3.5 py-1 rounded-full bg-rose-600/90 text-white text-xs font-black tracking-wider uppercase backdrop-blur-md inline-flex items-center gap-1.5 shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{siteConfig?.event_badge_text || 'Summit Nasional Parenting 2026'}</span>
            </span>
            <span className="px-3.5 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-slate-300 text-xs font-semibold inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-rose-400" />
              <span>{siteConfig?.event_date_location?.split('•')[0]?.trim() || '16 - 18 Oktober 2026'}</span>
            </span>
            <span className="px-3.5 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-slate-300 text-xs font-semibold inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>{siteConfig?.event_date_location?.split('•')[1]?.trim() || 'Jakarta Convention Center & Hybrid Live'}</span>
            </span>
          </div>

          {/* MAIN TITLE */}
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            {siteConfig?.event_title || 'Indonesia Parenting Summit 2026: Membangun Fondasi Emas Keluarga Tangguh'}
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl">
            {siteConfig?.event_subtitle || 'Konferensi & lokakarya parenting terbesar di Indonesia. Dapatkan wawasan ilmiah terdepan langsung dari para dokter spesialis anak, psikolog terkemuka, dan pakar edukasi keluarga.'}
          </p>

          {/* COUNTDOWN TIMER */}
          <div className="pt-2">
            <div className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-3">
              WAKTU TERSISA MENUJU ACARA:
            </div>
            <div className="grid grid-cols-4 gap-3 sm:gap-4 max-w-md">
              {[
                { label: 'HARI', val: timeLeft.days },
                { label: 'JAM', val: timeLeft.hours },
                { label: 'MENIT', val: timeLeft.minutes },
                { label: 'DETIK', val: timeLeft.seconds },
              ].map((item, i) => (
                <div key={i} className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3 text-center backdrop-blur-md">
                  <div className="text-2xl sm:text-3xl font-black text-rose-400">
                    {String(item.val).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] sm:text-xs font-bold text-slate-400 mt-0.5">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CALL TO ACTION BUTTONS & PERFORMANCE METRICS */}
          <div className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => setTicketModalOpen(true)}
                className="px-7 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm shadow-xl shadow-rose-600/30 transition-transform hover:scale-105 inline-flex items-center gap-2"
              >
                <Ticket className="w-4 h-4" />
                <span>{siteConfig?.event_cta_text || 'Daftar / Dapatkan Tiket'}</span>
              </button>
              <a
                href="#agenda-sesi"
                className="px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 transition-colors inline-flex items-center gap-2"
              >
                <span>Lihat Susunan Acara</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* PERFORMANCE METRICS BOX */}
            <HeroPerformanceBox siteConfig={siteConfig} />
          </div>
        </div>
      </section>

      {/* SPEAKERS / NARASUMBER UTAMA */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">
            Keynote Speakers & Fasilitator
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Belajar Langsung dari Pakar Terpercaya
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {eventSpeakers.map((sp, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 hover:shadow-lg transition-colors"
            >
              <div className="flex items-center gap-4">
                <img
                  src={sp.avatar}
                  alt={sp.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-rose-500 shrink-0"
                />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{sp.name}</h3>
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">{sp.role}</p>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Topik Bahasan:
                </div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {sp.topic}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SCHEDULE / AGENDA TABS */}
      <section id="agenda-sesi" className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Agenda & Jadwal Konferensi
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Rangkaian 3 hari lokakarya komprehensif bersama pakar keluarga.
            </p>
          </div>

          {/* DAY TABS */}
          <div className="flex items-center gap-2">
            {scheduleDays.map((d) => (
              <button
                key={d.day}
                onClick={() => setActiveDay(d.day)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-colors ${
                  activeDay === d.day
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                Hari {d.day}
              </button>
            ))}
          </div>
        </div>

        {/* ACTIVE DAY SESSIONS */}
        {scheduleDays
          .filter((d) => d.day === activeDay)
          .map((d) => (
            <div key={d.day} className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{d.title}</h3>
                <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold">{d.date}</span>
              </div>

              <div className="space-y-3">
                {d.sessions.map((sess, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="px-3 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-xs font-bold shrink-0">
                        {sess.time}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">{sess.title}</div>
                        <div className="text-xs text-slate-500">{sess.speaker}</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Termasuk Materi & Rekaman
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </section>

      {/* TICKET PACKAGES */}
      <section className="space-y-6 pt-4">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">
            Pilihan Tiket
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Investasi Edukasi Terbaik untuk Buah Hati
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              tier: 'Online Streaming',
              price: 'Rp 149.000',
              badge: 'Akses Virtual',
              features: ['Akses Live 3 Hari via Zoom', 'E-Sertifikat Resmi 16 JP', 'Rekaman Video Selama 30 Hari', 'Modul Ringkasan Digital'],
            },
            {
              tier: 'VIP Offline Pass',
              price: 'Rp 499.000',
              badge: 'Paling Populer',
              highlight: true,
              features: ['Akses Kursi VIP Grand Ballroom', 'Lunch & Coffee Break 3 Hari', 'Tanya Jawab Langsung Pakar', 'Goodie Bag & Buku Panduan Cetak', 'Akses Rekaman Seumur Hidup'],
            },
            {
              tier: 'Couple Parent Pass',
              price: 'Rp 799.000',
              badge: 'Paket Ayah & Bunda',
              features: ['2 Tiket Masuk Offline (Ayah + Bunda)', 'Sesi Konsultasi Private 1-on-1', 'Paket Buku Eksklusif 3 Edisi', 'Grup Mentoring Pasca-Acara'],
            },
          ].map((pkg, idx) => (
            <div
              key={idx}
              className={`p-6 sm:p-8 rounded-3xl border flex flex-col justify-between transition-colors ${
                pkg.highlight
                  ? 'bg-rose-600 text-white border-rose-500 shadow-xl shadow-rose-600/20 ring-2 ring-rose-400'
                  : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 shadow-md'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                    pkg.highlight ? 'bg-white text-rose-700' : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                  }`}>
                    {pkg.badge}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">{pkg.tier}</h3>
                  <div className="text-2xl sm:text-3xl font-black mt-2">{pkg.price}</div>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-current/10">
                  {pkg.features.map((feat, fidx) => (
                    <div key={fidx} className="flex items-center gap-2 text-xs font-medium">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => {
                    setRegForm((prev) => ({ ...prev, tier: pkg.tier }));
                    setTicketModalOpen(true);
                  }}
                  className={`w-full py-3 rounded-2xl font-black text-xs transition-colors shadow-md ${
                    pkg.highlight
                      ? 'bg-white text-rose-900 hover:bg-rose-50'
                      : 'bg-rose-600 hover:bg-rose-500 text-white'
                  }`}
                >
                  Pilih Tiket Ini
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* RELATED EVENT NOTULEN & PAPERS */}
      <section className="space-y-6 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-rose-500" />
            <span>Makalah & Artikel Panduan Pendukung Summit</span>
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

      {/* REGISTRATION MODAL */}
      {ticketModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Formulir Registrasi Summit 2026
              </h3>
              <button
                onClick={() => setTicketModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {registeredSuccess ? (
              <div className="p-6 text-center space-y-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-300">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-emerald-800 dark:text-emerald-200">Registrasi Berhasil!</h4>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  E-tiket dan instruksi kehadiran telah dikirimkan ke email Anda.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori Tiket
                  </label>
                  <input
                    type="text"
                    value={regForm.tier}
                    disabled
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    value={regForm.name}
                    onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                    placeholder="Contoh: dr. Amanda Kusuma"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    required
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    placeholder="amanda@domain.com"
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
                    value={regForm.phone}
                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                    placeholder="081234567890"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg transition-colors"
                  >
                    Konfirmasi & Amankan Kursi
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
