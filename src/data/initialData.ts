import { Post, AutoLink, User } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 1,
    email: 'admin@parenting.my.id',
    name: 'Dr. Ratna Sari, M.Psi',
    title: 'Spesialis Psikologi Anak & Praktisi Parenting',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=60&q=60&fm=webp',
    bio: 'Psikolog anak & praktisi parenting terkemuka di Indonesia dengan pengalaman klinis 12+ tahun dalam pendampingan tumbuh kembang emosi anak.',
    socialInstagram: 'https://instagram.com/ratnasari.mpsi',
    socialLinkedin: 'https://linkedin.com/in/ratnasari-mpsi',
    socialWebsite: 'https://parenting.my.id',
  },
  {
    id: 2,
    email: 'penulis@parenting.my.id',
    name: 'Ahmad Zulkarnain, S.Ked',
    title: 'Edukator Kesehatan Anak & Spesialis Gizi Balita',
    role: 'writer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=60&q=60&fm=webp',
    bio: 'Pemerhati gizi anak, fasilitator pencegahan stunting nasional, serta edukator kesehatan balita.',
    socialInstagram: 'https://instagram.com/ahmad.zk',
    socialLinkedin: 'https://linkedin.com/in/ahmad-zulkarnain',
  },
  {
    id: 3,
    email: 'siti.aminah@parenting.my.id',
    name: 'Siti Aminah, S.Gz',
    title: 'Ahli Gizi Ibu & Anak (Certified Nutritionist)',
    role: 'writer',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=60&q=60&fm=webp',
    bio: 'Praktisi MPASI sehat, penyusun panduan gizi 1000 HPK, dan konselor laktasi bersertifikasi.',
    socialInstagram: 'https://instagram.com/sitiaminah.sgz',
    socialWebsite: 'https://parenting.my.id',
  },
];

export const INITIAL_AUTOLINKS: AutoLink[] = [
  { id: 1, keyword: 'pola asuh', targetUrl: '/baca/panduan-lengkap-pola-asuh-demokratis-anak-masa-kini', description: 'Panduan utama strategi pola asuh positif.', clickCount: 42 },
  { id: 2, keyword: 'balita', targetUrl: '/baca/5-aktivitas-sensory-play-seru-untuk-melatih-motorik-balita', description: 'Edukasi dan rekomendasi aktivitas balita.', clickCount: 29 },
  { id: 3, keyword: 'stunting', targetUrl: '/baca/mengenal-bahaya-stunting-dan-cara-pencegahannya-sejak-1000-hpk', description: 'Pencegahan stunting dan nutrisi emas anak.', clickCount: 61 },
  { id: 4, keyword: 'asi eksklusif', targetUrl: '/baca/mengenal-bahaya-stunting-dan-cara-pencegahannya-sejak-1000-hpk', description: 'Pentingnya gizi dan ASI eksklusif.', clickCount: 18 },
  { id: 5, keyword: 'sensory play', targetUrl: '/baca/5-aktivitas-sensory-play-seru-untuk-melatih-motorik-balita', description: 'Aktivitas stimulasi sensori anak usia dini.', clickCount: 35 },
  { id: 6, keyword: 'gizi anak', targetUrl: '/baca/mengenal-bahaya-stunting-dan-cara-pencegahannya-sejak-1000-hpk', description: 'Nutrisi seimbang untuk tumbuh kembang optimal.', clickCount: 50 },
];

export const INITIAL_POSTS: Post[] = [
  {
    id: 1,
    title: 'Panduan Lengkap Pola Asuh Demokratis untuk Mendidik Anak Tangguh Masa Kini',
    slug: 'panduan-lengkap-pola-asuh-demokratis-anak-masa-kini',
    contentMarkdown: `## Mengapa Pola Asuh Demokratis Sangat Penting?

Memilih **pola asuh** yang tepat merupakan salah satu keputusan terbesar dalam perjalanan menjadi orang tua. Di era digital saat ini, pendekatan yang otoriter sering kali memicu resistensi pada anak, sementara pola asuh permisif bisa membuat anak kehilangan kedisiplinan.

Pola asuh demokratis (*authoritative parenting*) hadir sebagai jalan tengah yang ideal. Metode ini mengombinasikan kehangatan emosional, komunikasi dua arah, serta batasan aturan yang jelas.

---

### Ciri-Ciri Utama Pola Asuh Demokratis:

1. **Mendengarkan Pendapat Anak:** Orang tua bersedia mendengarkan keluh kesah dan sudut pandang si kecil tanpa langsung menghakimi.
2. **Aturan yang Jelas dan Beralasan:** Ketika membuat aturan, orang tua menjelaskan *mengapa* aturan tersebut penting.
3. **Pemberian Apresiasi & Konsekuensi Logis:** Menghargai usaha anak serta menerapkan konsekuensi yang mendidik, bukan hukuman fisik.

---

## Manfaat Utama bagi Tumbuh Kembang Anak

Penelitian psikologi anak menunjukkan bahwa anak yang dibesarkan dengan **pola asuh** demokratis cenderung:

- Memiliki tingkat kecerdasan emosional (EQ) dan percaya diri yang tinggi.
- Lebih mandiri dalam memecahkan masalah sehari-hari.
- Terhindar dari perilaku terisolasi atau kecemasan berlebih di sekolah.

Untuk kelompok usia **balita**, penerapan komunikasi terbuka sangat efektif jika dipadukan dengan aktivitas permainan mendidik seperti **sensory play**. Hal ini membantu perkembangan kecerdasan otak anak secara optimal.

---

> *"Anak-anak tidak membutuhkan orang tua yang sempurna, melainkan orang tua yang hadir, mau mendengarkan, dan konsisten memandu langkah mereka."* — **Dr. Ratna Sari**

---

## Langkah Praktis Memulai Hari Ini

- **Jadwalkan Waktu Bicara 15 Menit:** Luangkan waktu khusus tanpa *gadget* untuk mengobrol dengan anak sebelum tidur.
- **Libatkan dalam Keputusan Kecil:** Biarkan si kecil memilih baju atau menu bekal sekolahnya sendiri.
- **Validasi Emosi:** Saat anak menangis atau marah, katakan *"Ibu tahu kamu kecewa, mari kita tenang dulu lalu cari solusinya bersama."*`,
    excerpt: 'Pola asuh demokratis menggabungkan kasih sayang, aturan yang konsisten, dan komunikasi terbuka. Simak strategi praktis penerapannya di rumah.',
    featuredImage: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=700&q=65&fm=webp',
    category: 'Pola Asuh',
    readTimeMinutes: 6,
    authorId: 1,
    authorName: 'Dr. Ratna Sari, M.Psi',
    authorTitle: 'Spesialis Psikologi Anak & Praktisi Parenting',
    authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=60&q=60&fm=webp',
    authorRole: 'admin',
    authorBio: 'Psikolog anak & praktisi parenting terkemuka di Indonesia dengan pengalaman klinis 12+ tahun.',
    authorSocials: {
      instagram: 'https://instagram.com/ratnasari.mpsi',
      linkedin: 'https://linkedin.com/in/ratnasari-mpsi',
      website: 'https://parenting.my.id'
    },
    coAuthorIds: [2],
    coAuthors: [
      {
        id: 2,
        email: 'penulis@parenting.my.id',
        name: 'Ahmad Zulkarnain, S.Ked',
        title: 'Edukator Kesehatan Anak & Spesialis Gizi Balita',
        role: 'writer',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=60&q=60&fm=webp',
        bio: 'Pemerhati gizi anak, fasilitator pencegahan stunting nasional, serta edukator kesehatan balita.',
        socialInstagram: 'https://instagram.com/ahmad.zk',
        socialLinkedin: 'https://linkedin.com/in/ahmad-zulkarnain'
      }
    ],
    revisions: [
      {
        id: 'rev-101',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        title: 'Panduan Lengkap Pola Asuh Demokratis Anak Masa Kini (Draft Versi 2)',
        contentMarkdown: '## Mengapa Pola Asuh Demokratis Sangat Penting?\n\nDraft revisi sebelumnya mengenai komunikasi terbuka dengan balita...',
        excerpt: 'Draft versi 2 sebelum penyempurnaan kutipan psikolog.',
        updatedByName: 'Dr. Ratna Sari, M.Psi'
      },
      {
        id: 'rev-100',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        title: 'Pola Asuh Demokratis Anak di Era Digital (Draft Awal)',
        contentMarkdown: '## Pengenalan Pola Asuh\n\nVersi awal draft artikel pola asuh demokratis...',
        excerpt: 'Versi perdana konsep pola asuh.',
        updatedByName: 'Ahmad Zulkarnain, S.Ked'
      }
    ],
    status: 'published',
    metaTitle: 'Panduan Lengkap Pola Asuh Demokratis Anak | Parenting.my.id',
    metaDescription: 'Pelajari panduan penerapan pola asuh demokratis untuk membentuk karakter anak yang mandiri, percaya diri, dan berani di era digital.',
    tags: 'pola asuh, psikologi anak, komunikasi keluarga, karakter anak',
    views: 248,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 2,
    title: '5 Aktivitas Sensory Play Seru untuk Melatih Motorik Halus Balita di Rumah',
    slug: '5-aktivitas-sensory-play-seru-untuk-melatih-motorik-balita',
    contentMarkdown: `## Pentingnya Sensory Play untuk Perkembangan Balita

Masa usia dini (1-5 tahun) adalah masa emas (*golden age*) di mana otak berkembang sangat pesat. Salah satu cara terbaik menstimulasi saraf otak adalah melalui **sensory play** atau permainan sensori.

Permainan ini melatih panca indera—penglihatan, pendengaran, perabaan, penciuman, dan perasa—sekaligus memperkuat otot motorik halus yang dibutuhkan **balita** saat belajar menulis kelak.

---

### 5 Ide Sensory Play Sederhana & Murah Meriah:

#### 1. Rice Digging (Beras Warna-Warni)
- **Bahan:** Beras, pewarna makanan alami, dan wadah plastik.
- **Cara Bermain:** Sembunyikan mainan kecil di bawah beras. Minta si kecil mencarinya menggunakan sendok atau tangannya.
- **Manfaat:** Melatih genggaman jari dan pemahaman tekstur.

#### 2. Edible Finger Painting (Cat Aman Dimakan)
- **Bahan:** Yoghurt polos dipadukan dengan pewarna makanan dari buah naga atau kunyit.
- **Manfaat:** Mengembangkan kreativitas tanpa khawatir bahan kimia berbahaya jika tertelan.

#### 3. Water Transfer with Sponge (Pindah Air dengan Spons)
- **Bahan:** Dua mangkuk dan spons cuci piring.
- **Manfaat:** Menguatkan otot telapak tangan dan jari jemari balita.

---

### Kaitan Sensory Play dan Pola Asuh yang Tepat

Saat mendampingi si kecil bermain, beri kebebasan eksplorasi tanpa terlalu takut rumah menjadi kotor. Pendekatan **pola asuh** yang suportif akan meningkatkan rasa ingin tahu dan keberanian anak.

Jika anak sudah menunjukkan tanda-tanda kelelahan, istirahatlah dan pastikan kebutuhan **gizi anak** serta asupan nutrisi hariannya sudah terpenuhi dengan baik.`,
    excerpt: 'Temukan 5 ide permainan sensory play mudah dan hemat bahan untuk mengasah indera serta ketangkasan motorik balita di rumah.',
    featuredImage: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=700&q=65&fm=webp',
    category: 'Tumbuh Kembang',
    readTimeMinutes: 4,
    authorId: 2,
    authorName: 'Ahmad Zulkarnain, S.Ked',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=60&q=60&fm=webp',
    authorRole: 'writer',
    status: 'published',
    metaTitle: '5 Aktivitas Sensory Play Melatih Motorik Balita | Parenting.my.id',
    metaDescription: 'Panduan praktis 5 permainan sensori (sensory play) hemat untuk meningkatkan stimulasi indera dan kekuatan motorik balita di rumah.',
    tags: 'sensory play, balita, motorik halus, permainan edukasi',
    views: 182,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 3,
    title: 'Mengenal Bahaya Stunting dan Cara Pencegahannya Sejak 1000 Hari Pertama Kehidupan',
    slug: 'mengenal-bahaya-stunting-dan-cara-pencegahannya-sejak-1000-hpk',
    contentMarkdown: `## Masalah Stunting di Indonesia: Apa yang Perlu Orang Tua Ketahui?

**Stunting** adalah kondisi gagal tumbuh pada anak balita akibat kekurangan gizi kronis, terutama pada 1000 Hari Pertama Kehidupan (HPK)—dimulai sejak konsepsi di dalam kandungan hingga anak berusia 2 tahun.

Dampak stunting bukan hanya perkara tinggi badan anak yang lebih pendek dari standar, tetapi juga hambatan perkembangan kognitif dan kecerdasan otak yang bersifat permanen.

---

### Tiga Pilar Utama Pencegahan Stunting:

1. **Pemenuhan Nutrisi Ibu Hamil:** Ibu hamil wajib mengonsumsi makanan bergizi seimbang, asam folat, serta zat besi.
2. **Pemberian ASI Eksklusif:** Memberikan **asi eksklusif** selama 6 bulan pertama tanpa tambahan cairan atau makanan lain.
3. **MPASI Bergizi & Protein Hewani:** Memulai MPASI tepat di usia 6 bulan dengan mengutamakan kecukupan protein hewani (telur, ikan, daging ayam/sapi).

---

### Peran Penting Gizi Anak dan Perawatan Harian

Memastikan **gizi anak** terpenuhi secara optimal mensyaratkan edukasi orang tua yang berkelanjutan. Terapkan **pola asuh** makan yang menyenangkan (*feeding rules*) agar anak terhindar dari Gerakan Tutup Mulut (GTM).

Ajak juga **balita** aktif bergerak lewat permainan ringan seperti **sensory play** untuk menjaga daya tahan tubuh dan kebugaran fisiknya.`,
    excerpt: 'Stunting berpengaruh besar pada kecerdasan anak. Pelajari langkah pencegahan stunting melalui pemberian ASI eksklusif dan MPASI tinggi protein.',
    featuredImage: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=700&q=65&fm=webp',
    category: 'Kesehatan & Gizi',
    readTimeMinutes: 7,
    authorId: 1,
    authorName: 'Dr. Ratna Sari, M.Psi',
    authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=60&q=60&fm=webp',
    authorRole: 'admin',
    status: 'published',
    metaTitle: 'Cara Mencegah Stunting pada 1000 HPK Anak | Parenting.my.id',
    metaDescription: 'Edukasi komprehensif pencegahan stunting, manfaat ASI eksklusif, serta pola gizi sehat untuk anak tumbuh optimal.',
    tags: 'stunting, asi eksklusif, gizi anak, MPASI, kesehatan balita',
    views: 310,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];
