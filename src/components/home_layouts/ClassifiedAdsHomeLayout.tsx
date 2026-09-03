import React, { useState, useMemo } from 'react';
import { Post, SiteConfig } from '../../types';
import { Search, PlusCircle, CheckCircle2, Newspaper, Tag, Phone, MapPin, Eye } from 'lucide-react';
import HeroPerformanceBox from '../HeroPerformanceBox';

interface LayoutProps {
  posts: Post[];
  onSelectPost: (slug: string) => void;
  siteConfig?: SiteConfig;
}

export default function ClassifiedAdsHomeLayout({ posts, onSelectPost, siteConfig }: LayoutProps) {
  const [adSearch, setAdSearch] = useState('');
  const [selectedSection, setSelectedSection] = useState('SEMUA');
  const [postAdOpen, setPostAdOpen] = useState(false);
  const [adPostedSuccess, setAdPostedSuccess] = useState(false);
  const [newAd, setNewAd] = useState({ title: '', category: 'PERLENGKAPAN BAYI', content: '', phone: '', city: 'Jakarta' });

  const classifiedSections = [
    'SEMUA',
    'PERLENGKAPAN BAYI',
    'JASA & PENGASUH',
    'KESEHATAN & TERAPI',
    'KURSUS & BIMBEL',
    'ANEKA BUKU',
  ];

  const mockClassifieds = [
    {
      id: 1,
      section: 'PERLENGKAPAN BAYI',
      headline: 'DJUAL CEPAT STROLLER CABIN SIZE',
      text: 'Kondisi 95% mulus, jarang pakai, warna navy, lipat 1 tombol, komplit dus buku. BU Rp 850rb nego tipis.',
      phone: '0812-8877-6655',
      city: 'JAKARTA SELATAN',
      date: '30 AGUSTUS',
    },
    {
      id: 2,
      section: 'PERLENGKAPAN BAYI',
      headline: 'BABY BOX KAYU JATI ASLI + MATRAS',
      text: 'Kokoh antik, cat non-toxic waterbased aman bayi, include kelambu & roda kunci. Siap antar wilayah Jabodetabek.',
      phone: '0813-1122-3344',
      city: 'BANDUNG',
      date: '29 AGUSTUS',
    },
    {
      id: 3,
      section: 'JASA & PENGASUH',
      headline: 'TERSEDIA SUSTER BAYI / GOVERNESS BERSERTIFIKAT',
      text: 'Pengalaman 8 thn, menguasai stimulasi sensorik, sabar, jujur, telaten, bebas penyakit & vaksin lengkap.',
      phone: '0857-4433-2211',
      city: 'SURABAYA',
      date: '31 AGUSTUS',
    },
    {
      id: 4,
      section: 'KESEHATAN & TERAPI',
      headline: 'KLINIK PIJAT BAYI & FISIOTERAPI TUMBUH KEMBANG',
      text: 'Melayani terapi telat jalan/bicara (speech delay), pijat batuk pilek, homecare & konsultasi dokter spesialis.',
      phone: '0811-9988-7766',
      city: 'YOGYAKARTA',
      date: '28 AGUSTUS',
    },
    {
      id: 5,
      section: 'KURSUS & BIMBEL',
      headline: 'LES BACA TULIS HITUNG (CALISTUNG) BALITA FUN METHOD',
      text: 'Metode fonik & visual flashcard tanpa paksaan. 1 guru 3 murid, ruangan full AC & playground bermain.',
      phone: '0815-6677-8899',
      city: 'SEMARANG',
      date: '27 AGUSTUS',
    },
    {
      id: 6,
      section: 'ANEKA BUKU',
      headline: 'PAKET LENGKAP BUKU ENSIKLOPEDIA ANAK PINTAR',
      text: '12 Jilid hard cover bergambar warna, kertas art paper lux, cocok usia 2-10 thn. Harga obral cuci gudang.',
      phone: '0818-0011-2233',
      city: 'MEDAN',
      date: '30 AGUSTUS',
    },
  ];

  const filteredAds = useMemo(() => {
    return mockClassifieds.filter((item) => {
      const matchSearch =
        item.headline.toLowerCase().includes(adSearch.toLowerCase()) ||
        item.text.toLowerCase().includes(adSearch.toLowerCase()) ||
        item.city.toLowerCase().includes(adSearch.toLowerCase());
      const matchSection = selectedSection === 'SEMUA' || item.section === selectedSection;
      return matchSearch && matchSection;
    });
  }, [mockClassifieds, adSearch, selectedSection]);

  const handlePostAd = (e: React.FormEvent) => {
    e.preventDefault();
    setAdPostedSuccess(true);
    setTimeout(() => {
      setAdPostedSuccess(false);
      setPostAdOpen(false);
    }, 2500);
  };

  return (
    <div className="space-y-8 font-serif bg-[#fbf7ee] dark:bg-[#181715] text-[#221f1c] dark:text-[#eae4d5] p-4 sm:p-8 rounded-3xl border-4 border-double border-[#3c362e] dark:border-[#5c5448] shadow-2xl transition-colors">
      {/* VINTAGE NEWSPAPER MASTHEAD */}
      <header className="text-center border-b-4 border-double border-[#3c362e] dark:border-[#5c5448] pb-6 space-y-2">
        <div className="flex justify-between items-center text-[11px] font-sans font-bold uppercase tracking-widest border-b border-[#3c362e]/40 dark:border-[#5c5448]/60 pb-1 text-[#554e44] dark:text-[#b0a797]">
          <span>NOMOR PENERBITAN: {siteConfig?.classified_edition || '1988/2026'}</span>
          <span>• EDISI CETAK MINGGUAN KELUARGA BAHAGIA •</span>
          <span>{siteConfig?.classified_price_tag || 'HARGA ECERAN RP 500,-'}</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-[#1c1813] dark:text-[#f2ebe0] py-2 font-serif scale-y-110">
          {siteConfig?.classified_masthead_title || 'WARNA-WARTO PARENTING'}
        </h1>

        <div className="flex flex-col sm:flex-row items-center justify-between text-xs font-sans font-semibold border-t border-b border-[#3c362e]/60 dark:border-[#5c5448] py-1.5 px-2">
          <span>{siteConfig?.classified_masthead_subtitle || 'LEMBARAN IKLAN BARIS, PENGUMUMAN & WARTA KELUARGA'}</span>
          <span>SENIN - MINGGU • TERBIT SETIAP HARI</span>
          <span>REDAKSI & TATA USAHA TELP. {siteConfig?.classified_phone || '(021) 7654321'}</span>
        </div>

        {/* PERFORMANCE METRICS BOX */}
        <div className="pt-2 max-w-xl mx-auto">
          <HeroPerformanceBox
            siteConfig={siteConfig}
            containerClassName="font-sans gap-3 bg-[#f2ebd9] dark:bg-[#25221d] border-2 border-[#3c362e] dark:border-[#5c5448] p-3 rounded-xl text-center"
            valueClassName="text-xl font-black text-[#8b1e1e] dark:text-[#f87171]"
            labelClassName="text-[10px] text-[#4a4339] dark:text-[#b8ad9c] font-bold uppercase tracking-wider"
          />
        </div>
      </header>

      {/* CONTROLS BAR: SEARCH, SECTIONS & PASANG IKLAN */}
      <div className="font-sans flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b-2 border-[#3c362e]/30 dark:border-[#5c5448]/50 pb-4">
        {/* SEARCH BOX */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={adSearch}
            onChange={(e) => setAdSearch(e.target.value)}
            placeholder="Cari kata kunci iklan (misal: stroller, suster, calistung)..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white dark:bg-black/30 border border-[#3c362e]/40 dark:border-[#5c5448] text-xs font-semibold focus:ring-1 focus:ring-[#3c362e]"
          />
        </div>

        {/* SECTION FILTER BUTTONS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {classifiedSections.map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedSection(sec)}
              className={`px-3 py-1 rounded text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedSection === sec
                  ? 'bg-[#2b251f] text-[#fbf7ee] dark:bg-[#e4ddcc] dark:text-[#181715] shadow-xs'
                  : 'bg-black/5 dark:bg-white/5 border border-[#3c362e]/30 dark:border-[#5c5448] hover:bg-black/10'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>

        {/* PASANG IKLAN BUTTON */}
        <button
          onClick={() => setPostAdOpen(true)}
          className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-black text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Pasang Iklan Baris</span>
        </button>
      </div>

      {/* CLASSIFIED ADS MULTI-COLUMN GRID */}
      <section className="space-y-4">
        <div className="text-center font-sans">
          <span className="text-xs font-black uppercase tracking-widest border-b-2 border-black dark:border-white pb-0.5">
            DOKUMEN IKLAN BARIS TERVERIFIKASI ({filteredAds.length} IKLAN TAYANG)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAds.map((ad) => (
            <div
              key={ad.id}
              className="p-4 bg-white/70 dark:bg-black/25 border-2 border-[#3c362e]/40 dark:border-[#5c5448]/60 rounded-xl space-y-2 hover:bg-white dark:hover:bg-black/40 transition-colors shadow-2xs"
            >
              <div className="flex items-center justify-between font-sans text-[10px] font-black uppercase text-rose-800 dark:text-rose-400 border-b border-[#3c362e]/20 dark:border-[#5c5448]/30 pb-1">
                <span>[{ad.section}]</span>
                <span className="text-slate-600 dark:text-slate-400">{ad.city}</span>
              </div>

              <h3 className="font-sans font-black text-xs uppercase tracking-wide text-black dark:text-white leading-snug">
                {ad.headline}
              </h3>

              <p className="text-xs leading-relaxed font-serif text-[#2f2a24] dark:text-[#d6cebf]">
                {ad.text}
              </p>

              <div className="pt-2 border-t border-dashed border-[#3c362e]/30 dark:border-[#5c5448]/40 flex items-center justify-between font-sans text-[11px] font-bold">
                <span className="flex items-center gap-1 text-slate-800 dark:text-slate-200">
                  <Phone className="w-3 h-3 text-rose-700" />
                  <span>HUB: {ad.phone}</span>
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">{ad.date}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* VINTAGE EDITORIAL REPORT & ARTICLES SECTION */}
      <section className="pt-6 border-t-4 border-double border-[#3c362e] dark:border-[#5c5448] space-y-4">
        <div className="flex items-center justify-between font-sans border-b border-black/30 dark:border-white/30 pb-2">
          <h2 className="text-base font-black uppercase tracking-wider flex items-center gap-2">
            <Newspaper className="w-5 h-5" />
            <span>KABAR UTAMA & TULISAN REDAKSI PARENTING</span>
          </h2>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
            KLIK JUDUL ARTIKEL UNTUK MEMBACA SEPENUHNYA
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.slice(0, 3).map((post) => (
            <article
              key={post.id}
              onClick={() => onSelectPost(post.slug)}
              className="cursor-pointer group p-4 bg-white/60 dark:bg-black/20 border border-[#3c362e]/40 dark:border-[#5c5448]/60 rounded-xl space-y-3 hover:bg-white dark:hover:bg-black/40 transition-colors"
            >
              <div className="font-sans flex items-center justify-between text-[10px] font-bold text-slate-600 dark:text-slate-400 border-b border-dashed pb-1">
                <span className="uppercase text-rose-800 dark:text-rose-400 font-black">
                  KOLOM {post.category}
                </span>
                <span>{post.readTimeMinutes} MENIT BACA</span>
              </div>

              <h3 className="font-serif font-bold text-base text-black dark:text-white group-hover:text-rose-700 dark:group-hover:text-rose-400 transition-colors leading-snug line-clamp-2">
                {post.title}
              </h3>

              <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 line-clamp-3 font-serif">
                {post.excerpt}
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 font-sans text-xs font-bold text-rose-800 dark:text-rose-300">
                <span className="truncate min-w-0 flex-1">Oleh: {post.authorName}</span>
                <span className="group-hover:translate-x-1 transition-transform shrink-0 whitespace-nowrap">Baca Warta →</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* MODAL PASANG IKLAN */}
      {postAdOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="bg-[#fbf7ee] dark:bg-[#1a1917] text-[#221f1c] dark:text-[#eae4d5] border-4 border-double border-[#3c362e] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b-2 border-black/20 pb-2">
              <h3 className="text-base font-black uppercase tracking-wider">
                Formulir Pemasangan Iklan Baris
              </h3>
              <button
                onClick={() => setPostAdOpen(false)}
                className="text-slate-500 hover:text-black dark:hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            {adPostedSuccess ? (
              <div className="p-6 text-center space-y-2 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl border border-emerald-500">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-black text-emerald-900 dark:text-emerald-200">
                  Iklan Berhasil Didaftarkan!
                </h4>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                  Iklan baris Anda akan dimuat pada edisi berikutnya setelah melewati proses kurasi tim redaksi.
                </p>
              </div>
            ) : (
              <form onSubmit={handlePostAd} className="space-y-3">
                <div>
                  <label className="block text-xs font-black uppercase mb-1">Kategori Kolom</label>
                  <select
                    value={newAd.category}
                    onChange={(e) => setNewAd({ ...newAd, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black/40 border border-[#3c362e] text-xs font-semibold"
                  >
                    <option value="PERLENGKAPAN BAYI">PERLENGKAPAN BAYI</option>
                    <option value="JASA & PENGASUH">JASA & PENGASUH</option>
                    <option value="KESEHATAN & TERAPI">KESEHATAN & TERAPI</option>
                    <option value="KURSUS & BIMBEL">KURSUS & BIMBEL</option>
                    <option value="ANEKA BUKU">ANEKA BUKU</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase mb-1">Judul / Headline Iklan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: DIJUAL STROLLER BAYI MULUS"
                    value={newAd.title}
                    onChange={(e) => setNewAd({ ...newAd, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black/40 border border-[#3c362e] text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase mb-1">Isi Teks Singkat Iklan</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Kondisi barang / jenis jasa, keunggulan, harga, dll..."
                    value={newAd.content}
                    onChange={(e) => setNewAd({ ...newAd, content: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black/40 border border-[#3c362e] text-xs font-semibold font-serif"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black uppercase mb-1">Nomor Telepon/WA</label>
                    <input
                      type="tel"
                      required
                      placeholder="0812-xxxx-xxxx"
                      value={newAd.phone}
                      onChange={(e) => setNewAd({ ...newAd, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black/40 border border-[#3c362e] text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase mb-1">Kota Asal</label>
                    <input
                      type="text"
                      required
                      placeholder="Jakarta"
                      value={newAd.city}
                      onChange={(e) => setNewAd({ ...newAd, city: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black/40 border border-[#3c362e] text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-lg bg-[#2b251f] hover:bg-black text-[#fbf7ee] font-black text-xs uppercase tracking-wider shadow-sm transition-all"
                  >
                    Kirim & Tayangkan Iklan Baris
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
