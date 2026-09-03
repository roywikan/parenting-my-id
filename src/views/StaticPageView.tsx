import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Info, 
  Mail, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  Send, 
  ExternalLink, 
  Globe, 
  ChevronRight, 
  Lock, 
  Users, 
  BookOpen, 
  Award,
  Clock,
  MapPin,
  MessageSquare
} from 'lucide-react';
import { SiteConfig } from '../types';
import SEOHelper from '../components/SEOHelper';

export type LegalPageSlug = 'privacy' | 'about' | 'contact' | 'disclaimer' | 'terms';

interface StaticPageViewProps {
  initialPage?: LegalPageSlug;
  siteConfig?: SiteConfig;
  onNavigate?: (view: string, param?: string) => void;
}

export default function StaticPageView({
  initialPage = 'privacy',
  siteConfig,
  onNavigate
}: StaticPageViewProps) {
  const [activeTab, setActiveTab] = useState<LegalPageSlug>(initialPage);

  // Sync activeTab if initialPage prop changes
  useEffect(() => {
    setActiveTab(initialPage);
  }, [initialPage]);

  const siteName = siteConfig?.site_name || 'Parenting.my.id';
  const domainName = siteConfig?.site_url || 'parenting.my.id';
  const cleanDomain = domainName.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const siteEmail = `redaksi@${cleanDomain}`;

  // Contact form state
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTabChange = (tab: LegalPageSlug) => {
    setActiveTab(tab);
    if (onNavigate) {
      onNavigate(tab);
    } else {
      window.history.pushState({}, '', `/${tab}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setContactSubmitted(true);
      setContactForm({ name: '', email: '', subject: '', message: '' });
    }, 800);
  };

  // Dynamic titles and metadata per page
  const tabMetadata: Record<LegalPageSlug, { title: string; desc: string; icon: any }> = {
    privacy: {
      title: `Kebijakan Privasi (Privacy Policy) - ${siteName}`,
      desc: `Kebijakan privasi resmi ${siteName}. Informasi penggunaan cookie, DART cookie Google AdSense, pengumpulan data, dan perlindungan hak privasi pengunjung.`,
      icon: Lock,
    },
    about: {
      title: `Tentang Kami (About Us) - ${siteName}`,
      desc: `Profil resmi, visi misi redaksi, dan kredibilitas tim pengelola ${siteName} sebagai portal edukasi pengasuhan anak modern dan kesehatan keluarga.`,
      icon: Info,
    },
    contact: {
      title: `Hubungi Kami (Contact Us) - ${siteName}`,
      desc: `Hubungi tim redaksi ${siteName} untuk pertanyaan, saran, kerjasama media, atau informasi seputar artikel pengasuhan anak.`,
      icon: Mail,
    },
    disclaimer: {
      title: `Penafian (Disclaimer) - ${siteName}`,
      desc: `Penafian dan batasan tanggung jawab medis, hukum, serta penggunaan informasi di portal ${siteName}.`,
      icon: AlertTriangle,
    },
    terms: {
      title: `Syarat & Ketentuan (Terms of Service) - ${siteName}`,
      desc: `Syarat dan ketentuan penggunaan website, perlindungan hak cipta DMCA, serta aturan hak kekayaan intelektual di ${siteName}.`,
      icon: FileText,
    },
  };

  const currentMeta = tabMetadata[activeTab];

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-10 space-y-8">
      {/* Dynamic SEO Meta for current page */}
      <SEOHelper
        title={currentMeta.title}
        description={currentMeta.desc}
        siteName={siteName}
        canonicalUrl={`https://${cleanDomain}/${activeTab}`}
      />

      {/* BREADCRUMB NAV */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        <button 
          onClick={() => onNavigate ? onNavigate('home') : (window.location.href = '/')}
          className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
        >
          Beranda
        </button>
        <ChevronRight className="w-3.5 h-3.5 opacity-60" />
        <span className="text-slate-900 dark:text-slate-200 font-bold capitalize">
          {activeTab === 'privacy' && 'Kebijakan Privasi'}
          {activeTab === 'about' && 'Tentang Kami'}
          {activeTab === 'contact' && 'Hubungi Kami'}
          {activeTab === 'disclaimer' && 'Penafian (Disclaimer)'}
          {activeTab === 'terms' && 'Syarat & Ketentuan'}
        </span>
      </nav>

      {/* HEADER BANNER */}
      <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-rose-950 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30">
            <ShieldCheck className="w-4 h-4 text-rose-400" />
            <span>Dokumen Legalitas & Transparansi Redaksi</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            {activeTab === 'privacy' && 'Kebijakan Privasi (Privacy Policy)'}
            {activeTab === 'about' && `Tentang Kami (About Us) - ${siteName}`}
            {activeTab === 'contact' && 'Hubungi Kami (Contact Us)'}
            {activeTab === 'disclaimer' && 'Penafian & Batasan Tanggung Jawab'}
            {activeTab === 'terms' && 'Syarat & Ketentuan Penggunaan (Terms of Service)'}
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Halaman ini disusun untuk memenuhi standar transparansi informasi, perlindungan data pribadi, dan kepatuhan terhadap Kebijakan Publisher Google AdSense.
          </p>
        </div>
      </div>

      {/* NAVIGATION TABS SWITCHER */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => handleTabChange('privacy')}
          className={`flex-1 min-w-[130px] px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            activeTab === 'privacy'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Kebijakan Privasi</span>
        </button>

        <button
          onClick={() => handleTabChange('about')}
          className={`flex-1 min-w-[130px] px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            activeTab === 'about'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
          }`}
        >
          <Info className="w-4 h-4" />
          <span>Tentang Kami</span>
        </button>

        <button
          onClick={() => handleTabChange('contact')}
          className={`flex-1 min-w-[130px] px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            activeTab === 'contact'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Hubungi Kami</span>
        </button>

        <button
          onClick={() => handleTabChange('disclaimer')}
          className={`flex-1 min-w-[130px] px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            activeTab === 'disclaimer'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Disclaimer</span>
        </button>

        <button
          onClick={() => handleTabChange('terms')}
          className={`flex-1 min-w-[130px] px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            activeTab === 'terms'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Syarat & Ketentuan</span>
        </button>
      </div>

      {/* PAGE CONTENT CONTAINER */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8 text-slate-800 dark:text-slate-200 leading-relaxed text-sm sm:text-base">

        {/* 1. PRIVACY POLICY PAGE */}
        {activeTab === 'privacy' && (
          <article className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-rose-500" />
                <span>Kebijakan Privasi (Privacy Policy)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">Terakhir Diperbarui: September 2026 • Berlaku untuk domain {cleanDomain}</p>
            </div>

            <p>
              Di <strong>{siteName}</strong> (dapat diakses melalui <code>https://{cleanDomain}</code>), privasi pengunjung adalah salah satu prioritas utama kami. Dokumen Kebijakan Privasi ini berisi jenis informasi yang dikumpulkan dan dicatat oleh <strong>{siteName}</strong> serta bagaimana kami menggunakannya secara transparan dan bertanggung jawab.
            </p>

            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-2">
              <h3 className="font-bold text-rose-900 dark:text-rose-200 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-rose-600" />
                <span>Pernyataan Utama Kepatuhan Google AdSense</span>
              </h3>
              <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
                Website ini menggunakan jaringan periklanan pihak ketiga seperti <strong>Google AdSense</strong>. Pengunjung memahami bahwa Google dan mitra periklanannya dapat menempatkan dan membaca cookie di browser Anda untuk menyajikan iklan personalisasi berbasis kunjungan Anda di situs ini maupun situs lainnya di internet.
              </p>
            </div>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">1. Penggunaan Cookie & Teknologi Pelacakan</h3>
              <p>
                <strong>{siteName}</strong> menggunakan 'cookies'. Cookie ini digunakan untuk menyimpan informasi termasuk preferensi pengunjung, dan halaman-halaman di website yang diakses atau dikunjungi pengunjung. Informasi tersebut digunakan untuk mengoptimalkan pengalaman pengguna dengan menyesuaikan konten halaman web kami berdasarkan jenis browser pengunjung dan/atau informasi lainnya.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">2. Google DoubleClick DART Cookie</h3>
              <p>
                Google adalah salah satu vendor pihak ketiga di situs kami. Google juga menggunakan cookie, yang dikenal sebagai cookie DART, untuk menyajikan iklan kepada pengunjung situs kami berdasarkan kunjungan mereka ke <code>https://{cleanDomain}</code> dan situs-situs lain di internet.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                <li>Cookie DART memungkinkan Google dan mitranya menayangkan iklan berdasarkan riwayat penjelajahan.</li>
                <li>Pengunjung dapat memilih untuk menolak penggunaan cookie DART dengan mengunjungi Kebijakan Privasi Jaringan Iklan dan Konten Google di URL berikut: <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-rose-600 dark:text-rose-400 underline inline-flex items-center gap-1 font-semibold">Kebijakan Iklan Google <ExternalLink className="w-3 h-3" /></a></li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">3. Mitra Periklanan Pihak Ketiga (Third-Party Ad Vendors)</h3>
              <p>
                Beberapa pengiklan di situs kami mungkin menggunakan cookie dan web beacon. Mitra periklanan kami meliputi:
              </p>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <p className="font-bold text-slate-900 dark:text-slate-100">• Google AdSense & Google Marketing Platform</p>
                <p className="text-slate-600 dark:text-slate-400">
                  Server iklan atau jaringan iklan pihak ketiga menggunakan teknologi seperti cookie, JavaScript, atau Web Beacon yang digunakan dalam iklan masing-masing dan tautan yang muncul di {siteName}, yang dikirim langsung ke browser pengguna. Mereka secara otomatis menerima alamat IP Anda ketika ini terjadi.
                </p>
              </div>
              <p className="text-xs text-slate-500">
                Harap dicatat bahwa <strong>{siteName}</strong> tidak memiliki akses atau kontrol terhadap cookie yang digunakan oleh pengiklan pihak ketiga tersebut.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">4. Opsi Opt-Out (Pilihan Keluar Periklanan Terarah)</h3>
              <p>
                Anda dapat memilih untuk mematikan cookie melalui opsi browser individu Anda. Untuk mengetahui informasi lebih lanjut tentang manajemen cookie dengan browser web tertentu, informasi tersebut dapat ditemukan di situs web masing-masing browser. Anda juga dapat menonaktifkan iklan terarah melalui portal konsumtif independen:
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <a 
                  href="https://www.aboutads.info/choices/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 inline-flex items-center gap-1.5 transition-all"
                >
                  <span>Digital Advertising Alliance (AboutAds)</span>
                  <ExternalLink className="w-3.5 h-3.5 text-rose-500" />
                </a>
                <a 
                  href="https://www.networkadvertising.org/choices/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 inline-flex items-center gap-1.5 transition-all"
                >
                  <span>Network Advertising Initiative (NAI)</span>
                  <ExternalLink className="w-3.5 h-3.5 text-rose-500" />
                </a>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">5. File Log (Log Files)</h3>
              <p>
                <strong>{siteName}</strong> mengikuti prosedur standar menggunakan file log. File-file ini mencatat pengunjung ketika mereka mengunjungi situs web. Semua perusahaan hosting melakukan ini sebagai bagian dari analisis layanan hosting. Informasi yang dikumpulkan oleh file log meliputi alamat IP, jenis browser, Penyedia Layanan Internet (ISP), tanggal dan stempel waktu, halaman rujukan/keluar, dan mungkin jumlah klik. Informasi ini tidak terhubung dengan informasi apa pun yang dapat diidentifikasi secara pribadi.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">6. Persetujuan Pengunjung</h3>
              <p>
                Dengan menggunakan situs web kami, Anda dengan ini menyetujui Kebijakan Privasi kami dan menyetujui syarat-syaratnya.
              </p>
            </section>
          </article>
        )}

        {/* 2. ABOUT US PAGE */}
        {activeTab === 'about' && (
          <article className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-rose-500" />
                <span>Tentang Kami (About Us)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">Profil Media, Visi Misi Redaksi & Kredibilitas Konten</p>
            </div>

            <p className="text-lg font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
              Selamat datang di <strong>{siteName}</strong> — portal media edukasi digital yang berdedikasi menyajikan panduan pengasuhan anak modern, informasi kesehatan balita, nutrisi keluarga, serta pendampingan psikologi orang tua.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                <BookOpen className="w-6 h-6 text-rose-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Visi Redaksi</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Mewujudkan generasi anak Indonesia yang sehat, cerdas, dan tangguh melalui edukasi berbasis riset yang mudah dipahami setiap keluarga.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                <Award className="w-6 h-6 text-emerald-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Standar E-E-A-T</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Setiap artikel disusun mengacu pada standar *Experience, Expertise, Authoritativeness, and Trustworthiness* untuk mencegah hoaks kesehatan.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                <Users className="w-6 h-6 text-blue-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Komunitas Pengasuh</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Membangun wadah diskusi ramah dan empati bagi para orang tua muda, ibu menyusui, dan praktisi pendidikan usia dini.
                </p>
              </div>
            </div>

            <section className="space-y-3 pt-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Cakupan Topik & Niche Konten Utama</h3>
              <p>
                Artikel di <strong>{siteName}</strong> dikategorikan ke dalam 4 pilar utama yang dikaji secara mendalam:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <span className="font-bold text-rose-600 dark:text-rose-400 block mb-1">1. Pola Asuh (Parenting Style)</span>
                  Metode pengasuhan anak usia dini, komunikasi efektif tanpa bentakan, disiplin positif, dan penanganan tantrum balita.
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <span className="font-bold text-rose-600 dark:text-rose-400 block mb-1">2. Tumbuh Kembang & Sensory Play</span>
                  Milestone perkembangan motorik halus/kasar, stimulasi sensorik anak, serta pemantauan tahap bicara balita.
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <span className="font-bold text-rose-600 dark:text-rose-400 block mb-1">3. Kesehatan & Gizi (MPASI & Stunting)</span>
                  Panduan nutrisi 1.000 Hari Pertama Kehidupan (HPK), pencegahan stunting, menu MPASI bergizi, dan imunitas anak.
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <span className="font-bold text-rose-600 dark:text-rose-400 block mb-1">4. Psikologi Ibu & Keluarga</span>
                  Kesehatan mental ibu (*maternal mental health*), pencegahan *postpartum depression*, dan keharmonisan rumah tangga.
                </div>
              </div>
            </section>

            <section className="space-y-3 pt-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Komitmen Bebas Plagiarisme & Konten Original</h3>
              <p>
                Redaksi <strong>{siteName}</strong> berkomitmen 100% menyajikan konten yang original, ditulis langsung oleh tim penulis berpengalaman, dan ditinjau secara berkala. Kami menolak segala bentuk plagiarisme dan konten otomatisasi tanpa nilai edukasi.
              </p>
            </section>
          </article>
        )}

        {/* 3. CONTACT US PAGE */}
        {activeTab === 'contact' && (
          <article className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-rose-500" />
                <span>Hubungi Kami (Contact Us)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">Layanan Informasi, Kirim Masukan, & Kerjasama Media Redaksi</p>
            </div>

            <p>
              Kami sangat senang mendengar kabar dari pembaca, mitra media, maupun tim evaluasi Google AdSense. Jika Anda memiliki pertanyaan, saran perbaikan artikel, atau tawaran kerjasama, silakan hubungi kami melalui formulir di bawah ini atau email resmi redaksi.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {/* CONTACT INFO SIDEBAR */}
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Email Redaksi</span>
                      <a href={`mailto:${siteEmail}`} className="text-xs font-bold text-slate-900 dark:text-white hover:text-rose-600 transition-colors">
                        {siteEmail}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Waktu Respon</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Maksimal 1 x 24 Jam
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Lokasi Redaksi</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Jakarta, Indonesia
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-xs text-slate-600 dark:text-slate-400 space-y-2">
                  <span className="font-bold text-rose-700 dark:text-rose-300 block flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-rose-500" />
                    <span>Domain Resmi Platform</span>
                  </span>
                  <p>Semua surat menyurat resmi hanya berasal dari subdomain <code>@{cleanDomain}</code>.</p>
                </div>
              </div>

              {/* INTERACTIVE FORM */}
              <div className="md:col-span-2">
                {contactSubmitted ? (
                  <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-center space-y-3">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                    <h3 className="font-bold text-emerald-900 dark:text-emerald-200 text-base">Pesan Anda Berhasil Terkirim!</h3>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300">
                      Terima kasih telah menghubungi redaksi {siteName}. Tim kami akan membalas pesan Anda ke alamat email yang Anda cantumkan dalam waktu kurang dari 24 jam.
                    </p>
                    <button
                      type="button"
                      onClick={() => setContactSubmitted(false)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all"
                    >
                      Kirim Pesan Lain
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap *</label>
                        <input
                          type="text"
                          required
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:ring-2 focus:ring-rose-500"
                          placeholder="Nama Anda"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Alamat Email *</label>
                        <input
                          type="email"
                          required
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:ring-2 focus:ring-rose-500"
                          placeholder="email@anda.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Subjek Pesan</label>
                      <input
                        type="text"
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:ring-2 focus:ring-rose-500"
                        placeholder="Pertanyaan / Pertanyaan Kerjasama / Pertanyaan AdSense"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Isi Pesan *</label>
                      <textarea
                        required
                        rows={5}
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:ring-2 focus:ring-rose-500"
                        placeholder="Tuliskan detail pertanyaan atau masukan Anda di sini..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span>Mengirim Pesan...</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Kirim Pesan ke Redaksi</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </article>
        )}

        {/* 4. DISCLAIMER PAGE */}
        {activeTab === 'disclaimer' && (
          <article className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span>Penafian & Batasan Tanggung Jawab (Disclaimer)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">Sanggahan Resmi Terkait Informasi Medis, Edukasi, dan Tautan Eksternal</p>
            </div>

            <p>
              Apabila Anda memerlukan informasi lebih lanjut atau memiliki pertanyaan tentang penafian situs kami, silakan hubungi kami melalui email di <code>{siteEmail}</code>.
            </p>

            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2">
              <h3 className="font-bold text-amber-900 dark:text-amber-200 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Pernyataan Penting: Bukan Pengganti Nasihat Dokter/Kesehatan</span>
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                Seluruh artikel mengenai kesehatan balita, nutrisi, MPASI, dan psikologi anak di <strong>{siteName}</strong> diterbitkan hanya untuk tujuan informasi umum dan edukasi. Konten di situs ini <strong>TIDAK BISA DUMANFAATKAN SEBAGAI DIAGNOSIS MEDIS</strong> atau pengganti konsultasi langsung dengan dokter spesialis anak (Sp.A) atau tenaga medis profesional.
              </p>
            </div>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">1. Akurasi & Risiko Penggunaan Informasi</h3>
              <p>
                Semua informasi di situs web ini diterbitkan dengan niat baik dan hanya untuk tujuan informasi umum. <strong>{siteName}</strong> tidak memberikan jaminan tentang kelengkapan, keandalan, dan akurasi informasi ini. Tindakan apa pun yang Anda ambil atas informasi yang Anda temukan di situs web ini (<code>https://{cleanDomain}</code>), sepenuhnya merupakan risiko Anda sendiri. <strong>{siteName}</strong> tidak akan bertanggung jawab atas kerugian dan/atau kerusakan sehubungan dengan penggunaan situs web kami.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">2. Tautan Eksternal (External Links Disclaimer)</h3>
              <p>
                Dari situs web kami, Anda dapat mengunjungi situs web lain dengan mengikuti hyperlink ke situs eksternal tersebut. Meskipun kami berusaha hanya menyediakan tautan berkualitas ke situs web yang bermanfaat dan etis, kami tidak memiliki kontrol atas konten dan sifat situs-situs tersebut. Tautan ke situs web lain ini tidak mengisyaratkan rekomendasi untuk semua konten yang ditemukan di situs-situs tersebut. Pemilik situs dan konten dapat berubah tanpa pemberitahuan dan dapat terjadi sebelum kami memiliki kesempatan untuk menghapus tautan yang mungkin telah 'buruk'.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">3. Kebijakan Privasi Situs Lain</h3>
              <p>
                Perlu diperhatikan juga bahwa ketika Anda meninggalkan situs web kami, situs lain mungkin memiliki kebijakan privasi dan ketentuan berbeda yang berada di luar kendali kami. Pastikan untuk memeriksa Kebijakan Privasi situs-situs tersebut serta "Syarat Layanan" mereka sebelum melakukan bisnis apa pun atau mengunggah informasi apa pun.
              </p>
            </section>
          </article>
        )}

        {/* 5. TERMS OF SERVICE PAGE */}
        {activeTab === 'terms' && (
          <article className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-rose-500" />
                <span>Syarat & Ketentuan Penggunaan (Terms of Service)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">Peraturan Penggunaan, Perlindungan Hak Cipta DMCA & Ketentuan Pengunjung</p>
            </div>

            <p>
              Selamat datang di <strong>{siteName}</strong>. Syarat dan ketentuan ini menguraikan aturan dan peraturan untuk penggunaan situs web <strong>{siteName}</strong> yang berlokasi di <code>https://{cleanDomain}</code>.
            </p>

            <p>
              Dengan mengakses situs web ini, kami menganggap Anda menerima syarat dan ketentuan ini. Jangan melanjutkan penggunaan <strong>{siteName}</strong> jika Anda tidak setuju untuk mengambil semua syarat dan ketentuan yang tertera di halaman ini.
            </p>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">1. Perlindungan Hak Cipta & Lisensi Kekayaan Intelektual (DMCA)</h3>
              <p>
                Kecuali dinyatakan lain, <strong>{siteName}</strong> dan/atau pemberi lisensinya memiliki hak kekayaan intelektual atas semua materi di <strong>{siteName}</strong>. Semua hak kekayaan intelektual dilindungi undang-undang. Anda dapat mengakses ini dari <strong>{siteName}</strong> untuk penggunaan pribadi Anda sendiri yang tunduk pada pembatasan yang ditetapkan dalam syarat dan ketentuan ini.
              </p>
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-1.5 text-xs text-rose-900 dark:text-rose-200">
                <span className="font-bold block">Anda Dilarang Keras Untuk:</span>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Menerbitkan ulang materi dari {siteName} tanpa izin tertulis atau tanpa mencantumkan tautan sumber aktif.</li>
                  <li>Menjual, menyewakan, atau mendistribusikan ulang konten dari {siteName} untuk kepentingan komersial.</li>
                  <li>Mengisolasi, melakukan *web scraping*, atau menggandakan teks artikel secara otomatis (*auto-generated content*).</li>
                </ul>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">2. Etika Komentar Pembaca</h3>
              <p>
                Situs web ini menawarkan kesempatan bagi pengguna untuk memposting opini dan informasi di area tertentu. <strong>{siteName}</strong> tidak menyaring, mengedit, atau meninjau Komentar sebelum kemunculannya di situs. Komentar tidak mencerminkan pandangan dan opini {siteName}. {siteName} berhak memantau semua komentar dan menghapus komentar apa pun yang dianggap tidak layak, menyinggung, spam, atau melanggar Syarat dan Ketentuan ini.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">3. Batasan Usia Pengunjung</h3>
              <p>
                Website ini ditujukan untuk kalangan dewasa, orang tua, calon ibu/bapak, serta pengasuh anak. Pengunjung di bawah usia 13 tahun disarankan untuk mengakses website ini di bawah pengawasan orang tua atau wali hukum.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">4. Perubahan Ketentuan</h3>
              <p>
                <strong>{siteName}</strong> berhak untuk merevisi syarat dan ketentuan ini sewaktu-waktu tanpa pemberitahuan sebelumnya. Dengan menggunakan situs web ini secara berkelanjutan, Anda setuju untuk terikat oleh versi terbaru dari Syarat dan Ketentuan Penggunaan ini.
              </p>
            </section>
          </article>
        )}

      </div>
    </div>
  );
}
