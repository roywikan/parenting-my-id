import { useState } from 'react';
import { Post, SiteConfig } from '../../types';
import { ShoppingBag, Star, CheckCircle2, ShieldCheck, Zap, ArrowRight, HelpCircle, ChevronDown, BookOpen, Gift, Truck } from 'lucide-react';
import { optimizeUnsplashUrl } from '../../lib/imageUtils';

interface LayoutProps {
  posts: Post[];
  onSelectPost: (slug: string) => void;
  siteConfig?: SiteConfig;
}

export default function ProductLandingHomeLayout({ posts, onSelectPost, siteConfig }: LayoutProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [orderedSuccess, setOrderedSuccess] = useState(false);
  const [orderForm, setOrderForm] = useState({ name: '', phone: '', address: '', package: 'Paket Komplit Master (Paling Laris)' });

  const faqs = [
    {
      q: 'Apakah buku panduan & resep ini cocok untuk bayi yang baru mulai MPASI (6 bulan)?',
      a: 'Sangat cocok! Paket ini dilengkapi tahapan pengenalan tekstur dari bubur saring (6 bulan), bubur lumat (8 bulan), finger food (9 bulan), hingga makanan keluarga (12+ bulan).',
    },
    {
      q: 'Bagaimana cara mengakses grup konsultasi tanya jawab bersama dokter?',
      a: 'Setelah transaksi terverifikasi, Anda akan langsung mendapatkan tautan undangan otomatis ke grup VIP Telegram & WhatsApp eksklusif yang diasuh langsung oleh tim dokter spesialis anak.',
    },
    {
      q: 'Apakah flashcard dan buku fisik dikirim ke seluruh wilayah Indonesia?',
      a: 'Ya, pengiriman menjangkau seluruh nusantara dengan kemasan tahan air dan garansi ganti baru jika rusak dalam perjalanan.',
    },
  ];

  const handleOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderedSuccess(true);
    setTimeout(() => {
      setOrderedSuccess(false);
      setCheckoutModalOpen(false);
    }, 2500);
  };

  return (
    <div className="space-y-12">
      {/* PRODUCT HERO */}
      <section className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-rose-600 via-pink-600 to-rose-700 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black text-rose-100 border border-white/20">
              <Gift className="w-3.5 h-3.5 text-amber-300" />
              <span>{siteConfig?.product_badge_text || 'Edisi Spesial Panduan Pengasuhan Emas 2026'}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              {siteConfig?.product_title || 'Paket Komplit MPASI & Stimulasi Anak Anti-GTM'}
            </h1>

            <p className="text-rose-100 text-sm sm:text-base leading-relaxed">
              {siteConfig?.product_subtitle || 'Solusi tuntas mengatasi Gerakan Tutup Mulut, memastikan asupan zat besi tercukupi, dan menstimulasi kecerdasan motorik balita sejak hari pertama.'}
            </p>

            <div className="flex items-center gap-3">
              <div className="flex text-amber-300">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="text-xs font-bold text-white">4.9 / 5.0 dari 3.400+ Ayah & Bunda</span>
            </div>

            {/* PRICING BADGE */}
            <div className="flex items-baseline gap-3 pt-2">
              <span className="text-3xl sm:text-4xl font-black text-white">{siteConfig?.product_price || 'Rp 189.000'}</span>
              <span className="text-sm sm:text-base text-rose-200 line-through">{siteConfig?.product_original_price || 'Rp 299.000'}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-rose-950 text-xs font-black">
                {siteConfig?.product_discount_tag || 'HEMAT 37%'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              {siteConfig?.product_whatsapp ? (
                <a
                  href={`https://wa.me/${siteConfig.product_whatsapp}?text=Halo%20saya%20ingin%20pesan%20paket%20MPASI%20anak`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-7 py-3.5 rounded-2xl bg-white hover:bg-rose-50 text-rose-900 font-black text-xs shadow-xl transition-all hover:scale-105 inline-flex items-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{siteConfig?.product_cta_text || 'Pesan Sekarang & Dapatkan Bonus'}</span>
                </a>
              ) : (
                <button
                  onClick={() => setCheckoutModalOpen(true)}
                  className="px-7 py-3.5 rounded-2xl bg-white hover:bg-rose-50 text-rose-900 font-black text-xs shadow-xl transition-all hover:scale-105 inline-flex items-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{siteConfig?.product_cta_text || 'Pesan Sekarang & Dapatkan Bonus'}</span>
                </button>
              )}
              <span className="text-xs text-rose-100 flex items-center gap-1.5 font-semibold">
                <Truck className="w-4 h-4 text-emerald-300" />
                Gratis Ongkir Seluruh Indonesia
              </span>
            </div>
          </div>

          <div className="lg:col-span-5 relative text-center">
            <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white/30 bg-white/10 backdrop-blur-md p-4">
              <img
                src="https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&h=450&fit=crop&q=80"
                alt="Product Mockup"
                className="w-full h-64 sm:h-72 rounded-2xl object-cover"
              />
              <div className="pt-3 text-center text-xs font-bold text-white">
                📦 1x Buku Fisik + 3x E-Book + 1 Set Flashcard + VIP Consultation
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE BENEFITS */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">
            Kelebihan Produk
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Mengapa Ribuan Ibu Memilih Paket Ini?
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: '100+ Resep Padat Zat Besi & DHA',
              desc: 'Variasi olahan telur, hati ayam, ikan kembung, dan daging sapi yang disukai balita tanpa ribet.',
            },
            {
              title: 'Disusun Bersama Dokter Spesialis Anak',
              desc: 'Seluruh takaran kalori, makronutrien, dan mikronutrien telah diverifikasi berstandar WHO & IDAI.',
            },
            {
              title: 'Metode Step-by-Step Mengatasi GTM',
              desc: 'Trik psikologi responsif feeding saat anak menolak makan, tumbuh gigi, atau sedang pilek.',
            },
            {
              title: 'Buku Cetak Tahan Air & Minyak',
              desc: 'Kertas laminasi khusus yang aman dibawa saat memasak di dapur tanpa khawatir kotor.',
            },
            {
              title: 'Flashcard Stimulasi Sensorik & Kognitif',
              desc: 'Media bermain visual untuk melatih fokus visual dan pengenalan kosakata pertama bayi.',
            },
            {
              title: 'Grup Pendampingan WhatsApp Seumur Hidup',
              desc: 'Bebas bertanya dan konsultasi seputar kendala makan anak kapan saja bersama fasilitator.',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">{item.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING TIERS */}
      <section className="space-y-6 pt-4">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">
            Paket Pembelian
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Pilih Paket Sesuai Kebutuhan Buah Hati
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: 'Paket Digital (E-Book Saja)',
              price: 'Rp 99.000',
              badge: 'Hemat Budget',
              features: ['Akses PDF 3 E-Book Resep Lengkap', 'Tabel Jadwal Menu 30 Hari', 'Video Tutorial Memasak MPASI'],
            },
            {
              name: 'Paket Komplit Master (Paling Laris)',
              price: 'Rp 199.000',
              badge: 'Pilihan Terfavorit',
              highlight: true,
              features: ['Buku Fisik Hardcover Tahan Air', '3 E-Book Resep Digital', '1 Set Flashcard Stimulasi Bayi', 'Grup Diskusi WhatsApp Dokter', 'Free Ongkir se-Indonesia'],
            },
            {
              name: 'Paket VIP Exclusive + Konsultasi Privat',
              price: 'Rp 399.000',
              badge: 'All-In-One',
              features: ['Seluruh Isi Paket Komplit Master', 'Sesi Konsultasi Privat 1-on-1 bersama Dokter', 'Analisis Menu Khusus Anak Alergi', 'Prioritas Pengiriman Kilat'],
            },
          ].map((pkg, idx) => (
            <div
              key={idx}
              className={`p-6 sm:p-8 rounded-3xl border flex flex-col justify-between transition-all ${
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
                  <h3 className="text-lg font-bold">{pkg.name}</h3>
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
                    setOrderForm((prev) => ({ ...prev, package: pkg.name }));
                    setCheckoutModalOpen(true);
                  }}
                  className={`w-full py-3 rounded-2xl font-black text-xs transition-all shadow-md ${
                    pkg.highlight
                      ? 'bg-white text-rose-900 hover:bg-rose-50'
                      : 'bg-rose-600 hover:bg-rose-500 text-white'
                  }`}
                >
                  Pilih Paket Ini
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-2">
            <HelpCircle className="w-5 h-5 text-rose-500" />
            <span>Pertanyaan yang Sering Diajukan (FAQ)</span>
          </h2>
        </div>

        <div className="space-y-3 max-w-2xl mx-auto">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 dark:text-white"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === idx && (
                <div className="p-4 pt-0 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* RELATED ARTICLES */}
      <section className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-rose-500" />
            <span>Panduan & Tips Seputar MPASI & Nutrisi</span>
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

      {/* CHECKOUT MODAL */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Formulir Pemesanan Paket
              </h3>
              <button
                onClick={() => setCheckoutModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {orderedSuccess ? (
              <div className="p-6 text-center space-y-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-300">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-emerald-800 dark:text-emerald-200">Pesanan Diterima!</h4>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Rincian pembayaran dan nomor resi pengiriman telah dikirimkan ke WhatsApp Anda.
                </p>
              </div>
            ) : (
              <form onSubmit={handleOrder} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Pilihan Paket
                  </label>
                  <input
                    type="text"
                    value={orderForm.package}
                    disabled
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Penerima (Ayah / Bunda)
                  </label>
                  <input
                    type="text"
                    required
                    value={orderForm.name}
                    onChange={(e) => setOrderForm({ ...orderForm, name: e.target.value })}
                    placeholder="Bunda Maya"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor WhatsApp Aktif
                  </label>
                  <input
                    type="tel"
                    required
                    value={orderForm.phone}
                    onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
                    placeholder="081234567890"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Alamat Lengkap Pengiriman
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={orderForm.address}
                    onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                    placeholder="Jl. Mawar No. 12, RT 02/05, Kel. Sukamaju, Kec. Cilodong, Kota Depok, Jawa Barat 16415"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg transition-all"
                  >
                    Konfirmasi Pembelian (Bayar di Tempat / Transfer)
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
