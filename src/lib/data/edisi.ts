/**
 * EDISI CONTOH #41. Every number on the front page is sample data for the
 * visual build, marked "data contoh" in the UI. The real pipeline replaces
 * this module with artifacts from the newsroom (see /newsroom, /etl).
 * Shapes follow docs/DATA_CONTRACTS.md.
 */

export const EDISI = {
  nomor: 41,
  tanggal: 'Kamis, 11 Juni 2026',
  sesi: 'pagi' as const,
  dicetak: '05.00 WIB',
  serial: 'DD/EDI/041/VI/2026',
  koordinat: { label: "LS 4°05′ · BT 136°53′", wilayah: 'KABUPATEN MIMIKA · PAPUA TENGAH' },
  terbitEpoch: Date.UTC(2026, 5, 10, 22, 0, 0), // 05.00 WIB in UTC
};

export const ANGKA_EDISI = {
  nilai: 4_218_530_114,
  prefix: 'Rp',
  label: 'Total kerugian negara dalam vonis korupsi yang diputus bulan ini.',
  chips: ['putusan_ma · 84 baris', 'edisi #41'],
};

export const TICKER = [
  { src: 'BMKG', teks: 'Gempa M4,8 tercatat 38 km tenggara Halmahera Barat, 03.12 WIT' },
  { src: 'ANTARA', teks: 'DPR jadwalkan rapat paripurna pembahasan RUU hari ini' },
  { src: 'TEMPO', teks: 'Harga cabai rawit di Manado naik 41% dalam sepekan' },
  { src: 'BBC INDONESIA', teks: 'Laporan baru soroti tata kelola tambang nikel' },
  { src: 'GFW', teks: '214 peringatan deforestasi terdeteksi kemarin' },
  { src: 'JUBI', teks: 'Gereja laporkan kondisi layanan kesehatan di pegunungan tengah' },
];

export const TEMUAN = [
  {
    id: 'tmn-041-01',
    serial: 'DD/HKM/041/2026',
    lens: 'HUKUM',
    headline: 'Vonis 14 bulan untuk kerugian Rp 4,2 miliar diputus kemarin di PN Jayapura',
    body: 'Putusan kasasi menetapkan vonis 3 sigma di bawah kurva tren nasional untuk kerugian pada kelas yang sama.',
    chips: ['putusan_ma · #2241', 'kurva 2.184 putusan'],
    stamp: 'TERUJI LAPANGAN',
  },
  {
    id: 'tmn-041-02',
    serial: 'DD/HTN/041/2026',
    lens: 'HUTAN',
    headline: '214 peringatan deforestasi kemarin; 31 di dalam batas konsesi tercatat',
    body: 'Peringatan GLAD/RADD terbaru beririsan dengan poligon konsesi PSN. Dokumen izin dan peringatan tampil berdampingan.',
    chips: ['gfw_alerts · 11 Jun', 'psn_konsesi · MRK-07'],
    stamp: 'TERUJI LAPANGAN',
  },
  {
    id: 'tmn-041-03',
    serial: 'DD/AGR/041/2026',
    lens: 'ANGGARAN',
    headline: 'Belanja pegawai 58,2% dari APBD Kabupaten Nabire 2026',
    body: 'Rasio belanja pegawai terhadap total APBD melampaui ambang 0,50; belanja modal tercatat 11,4%.',
    chips: ['djpk_apbd · 2026'],
    stamp: 'TERUJI LAPANGAN',
  },
];

/** Justice Gradient sample: kerugian (Rp, log x) vs vonis (bulan, y). */
export const PUTUSAN: { kerugian: number; vonis: number; jenis: 'korupsi' | 'pencurian'; id: string }[] = [
  { kerugian: 1.2e6, vonis: 14, jenis: 'pencurian', id: 'p-001' },
  { kerugian: 4.5e5, vonis: 8, jenis: 'pencurian', id: 'p-002' },
  { kerugian: 2.4e6, vonis: 18, jenis: 'pencurian', id: 'p-003' },
  { kerugian: 8.0e5, vonis: 10, jenis: 'pencurian', id: 'p-004' },
  { kerugian: 3.1e6, vonis: 20, jenis: 'pencurian', id: 'p-005' },
  { kerugian: 6.2e5, vonis: 7, jenis: 'pencurian', id: 'p-006' },
  { kerugian: 1.8e6, vonis: 16, jenis: 'pencurian', id: 'p-007' },
  { kerugian: 9.4e5, vonis: 12, jenis: 'pencurian', id: 'p-008' },
  { kerugian: 4.2e9, vonis: 14, jenis: 'korupsi', id: 'k-2241' },
  { kerugian: 1.1e10, vonis: 30, jenis: 'korupsi', id: 'k-1874' },
  { kerugian: 6.8e8, vonis: 12, jenis: 'korupsi', id: 'k-2017' },
  { kerugian: 2.3e9, vonis: 18, jenis: 'korupsi', id: 'k-1992' },
  { kerugian: 5.5e10, vonis: 48, jenis: 'korupsi', id: 'k-1741' },
  { kerugian: 8.9e9, vonis: 24, jenis: 'korupsi', id: 'k-2103' },
  { kerugian: 3.4e8, vonis: 10, jenis: 'korupsi', id: 'k-2199' },
  { kerugian: 1.9e9, vonis: 15, jenis: 'korupsi', id: 'k-2056' },
  { kerugian: 7.2e9, vonis: 20, jenis: 'korupsi', id: 'k-1888' },
  { kerugian: 2.8e10, vonis: 36, jenis: 'korupsi', id: 'k-1799' },
  { kerugian: 4.6e8, vonis: 9, jenis: 'korupsi', id: 'k-2244' },
  { kerugian: 1.4e9, vonis: 13, jenis: 'korupsi', id: 'k-2230' },
];

export const STRUK = {
  judul: 'STRUK BELANJA NEGARA',
  sub: 'Kab. Nabire · APBD 2026 · per kapita',
  baris: [
    { k: 'Belanja pegawai', v: '58,2%' },
    { k: 'Barang & jasa', v: '24,1%' },
    { k: 'Belanja modal', v: '11,4%' },
    { k: 'Lainnya', v: '6,3%' },
  ],
  total: [
    { k: 'TOTAL APBD', v: 'Rp 1,82 T' },
    { k: 'Per kapita', v: 'Rp 10,4 jt' },
  ],
  roast: '“Jalan kabupaten: 3,1%. Sabar ya, ban depan.”',
  stamp: 'TERVERIFIKASI · EDISI 41',
};

/** Yang Tidak Dihitung: the silence table (Lane B rows + the absent row + Lane C). */
export const KEHENINGAN = {
  wilayah: 'Kabupaten Puncak · Papua Tengah',
  baris: [
    { k: 'Aparatur sipil negara', v: '2.731', sumber: 'BPS 2025' },
    { k: 'APBD 2026', v: 'Rp 1,12 T', sumber: 'DJPK' },
    { k: 'Puskesmas', v: '9', sumber: 'BPS 2025' },
    { k: 'Luas panen umbi-umbian', v: '3.412 ha', sumber: 'BPS 2025' },
    { k: 'Ternak babi', v: '38.420', sumber: 'BPS 2025' },
  ],
  absen: [
    { k: 'Warga mengungsi akibat konflik (sorotan edisi: Papua Tengah)', v: '—', catatan: 'data resmi tidak tersedia' },
    { k: 'Femisida (pembunuhan perempuan karena gendernya), nasional', v: '—', catatan: 'tidak ada penghitungan resmi; pihak ketiga menghitung dari pemberitaan' },
    { k: 'Publikasi akademisi di jurnal predator, nasional', v: '—', catatan: 'tidak ada audit resmi yang terbit' },
    { k: 'Kematian dalam tahanan, nasional', v: '—', catatan: 'tidak ada rekapitulasi resmi tahunan yang terbuka' },
    { k: 'Aktivis 1997–1998 yang masih hilang: status pencarian resmi', v: '—', catatan: '13 nama tercatat; pembaruan resmi tidak terbit' },
  ],
  laneC: { teks: '107.039 jiwa tercatat mengungsi di Tanah Papua', chip: 'HRM · Mar 2026' },
};

export const LAYAR_GANDA = {
  kiri: { angka: '3–1', label: 'Skor pembuka Piala Dunia 2026, semalam', chip: 'football-data.org' },
  kanan: { angka: 'Hari ke-1.892', label: 'pengungsian Kabupaten Puncak', chip: 'HRM · Mar 2026' },
};

/** Harga wave sample: cabai rawit, 30 hari, indexed. */
export const HARGA: number[] = [
  62, 61, 63, 64, 62, 65, 67, 66, 69, 72, 71, 74, 78, 77, 81, 84, 82, 86, 90, 88,
  93, 97, 95, 99, 104, 102, 107, 111, 108, 114,
];

export const JANJI = [
  {
    teks: 'Angka kemiskinan ekstrem 0% pada 2026',
    sumber: 'RPJMN 2020–2024 · Perpres 59/2021',
    target: '0% · des 2026',
    realisasi: '0,83% · mar 2026 (BPS)',
    status: 'BERJALAN' as const,
  },
  {
    teks: 'Rasio elektrifikasi Papua 100% pada 2025',
    sumber: 'RUPTL PLN 2021–2030',
    target: '100% · des 2025',
    realisasi: '94,8% · des 2025 (ESDM)',
    status: 'TIDAK TERCAPAI' as const,
  },
  {
    teks: 'Rehabilitasi hutan 230.000 ha per tahun',
    sumber: 'Renstra KLHK 2020–2024',
    target: '230.000 ha · 2025',
    realisasi: 'data tidak tersedia',
    status: 'DATA HILANG' as const,
  },
];

/** Real centroids; the only non-contoh table (regions are regions). */
export const REGIONS = [
  { kode: '9412', nama: 'Kab. Mimika', lat: -4.543, lon: 136.565, zoom: 8 },
  { kode: '9532', nama: 'Kab. Puncak', lat: -3.85, lon: 137.44, zoom: 8.4 },
  { kode: '9301', nama: 'Kab. Merauke', lat: -7.65, lon: 139.7, zoom: 7.6 },
  { kode: '9404', nama: 'Kab. Nabire', lat: -3.54, lon: 135.55, zoom: 8.4 },
  { kode: '8271', nama: 'Kota Ternate', lat: 0.79, lon: 127.36, zoom: 9 },
  { kode: '6203', nama: 'Kab. Kapuas', lat: -2.0, lon: 114.38, zoom: 7.8 },
];

/** Putusan per hari, 14 hari terakhir — sparkbar pendamping Angka Edisi. */
export const PUTUSAN_HARIAN = [3, 5, 2, 7, 4, 6, 9, 5, 8, 6, 11, 7, 6, 5];

/** Benar atau Salah: pernyataan untuk permainan verifikasi cepat (Mesin). */
export const BENAR_SALAH: { teks: string; benar: boolean; catatan: string; sumber: string }[] = [
  { teks: 'Belanja pegawai Kabupaten Nabire memakan 58,2% dari APBD 2026.', benar: true, catatan: 'Persis seperti di struk: 58,2%, belanja modal hanya 11,4%.', sumber: 'djpk_apbd · 2026' },
  { teks: 'Rasio elektrifikasi Papua sudah menyentuh 100% sejak 2023.', benar: false, catatan: 'Tercatat 94,8% per Desember 2025. Janji 100% tidak tercapai.', sumber: 'esdm · des 2025' },
  { teks: '214 peringatan deforestasi terdeteksi kemarin, 31 di dalam konsesi.', benar: true, catatan: 'Peringatan GLAD/RADD, beririsan dengan poligon konsesi PSN.', sumber: 'gfw_alerts · 11 jun' },
  { teks: 'Harga cabai rawit di Manado turun 41% dalam sepekan terakhir.', benar: false, catatan: 'Terbalik: harganya NAIK 41% dalam sepekan.', sumber: 'panel harga · 11 jun' },
  { teks: 'APBD Kabupaten Puncak tahun 2026 melewati angka satu triliun rupiah.', benar: true, catatan: 'Rp 1,12 T untuk 2.731 aparatur dan 9 puskesmas.', sumber: 'djpk · 2026' },
  { teks: 'Semua kabupaten di Papua Tengah punya data pengungsian resmi.', benar: false, catatan: 'Baris itu kosong di statistik resmi. Ketiadaan juga dokumen.', sumber: 'keheningan · edisi 41' },
];

export const TEBAK = {
  jawaban: 'MERAUKE',
  pilihan: ['MIMIKA', 'MERAUKE', 'NABIRE', 'PUNCAK', 'JAYAPURA', 'SORONG'],
  clues: [
    'APBD 2026 per kapita: Rp 14,2 jt (data contoh)',
    'Kabupaten paling timur sekaligus paling selatan Indonesia',
    'Zona food estate PSN dengan luas izin terbesar di Papua Selatan',
  ],
};

/** Pemantau Cabang Kekuasaan: the at-a-glance scoreboard. Plain explainers
    plus a few verified metrics per branch (June 2026). */
export const CABANG = [
  {
    nama: 'EKSEKUTIF',
    apa: 'Presiden, 48 menteri, 56 wakil menteri, dan badan seperti Danantara serta Badan Pengarah Papua.',
    metrik: [
      { k: 'Kabinet', v: '109 pejabat' },
      { k: 'Belanja negara 2026', v: 'Rp 3.842 T' },
      { k: 'Laporan keuangan Danantara', v: 'belum terbit' },
    ],
    chip: 'kemenkeu · setkab',
  },
  {
    nama: 'LEGISLATIF',
    apa: 'DPR 580 kursi dan DPD: menyusun undang-undang dan anggaran.',
    metrik: [
      { k: 'Kursi DPR', v: '580' },
      { k: 'Prioritas Prolegnas 2026', v: '67 RUU' },
      { k: 'Penghasilan anggota', v: '± Rp 65,6 jt/bln' },
    ],
    chip: 'dpr · setjen',
  },
  {
    nama: 'YUDIKATIF',
    apa: 'Mahkamah Agung, Mahkamah Konstitusi, dan KPK: menafsir hukum dan mengadili.',
    metrik: [
      { k: 'Putusan MA tercatat', v: '> 10 juta' },
      { k: 'Perkara MK 2025', v: '701' },
      { k: 'Kerugian korupsi dipulihkan', v: '± 13%' },
    ],
    chip: 'ma · mk · kpk · icw',
  },
  {
    nama: 'APARAT',
    apa: 'Polri dan TNI: alat paksa negara, di bawah eksekutif.',
    metrik: [
      { k: 'Anggaran 2026', v: '± Rp 333 T' },
      { k: 'Kekerasan polisi (setahun)', v: '602 insiden' },
      { k: 'Perwira aktif di pos sipil', v: '2.569' },
    ],
    chip: 'apbn · kontras · imparsial',
  },
  {
    nama: 'DAERAH',
    apa: '38 provinsi, ratusan pemda, plus otonomi khusus Aceh dan Papua.',
    metrik: [
      { k: 'Dana Otsus 2026', v: '± Rp 13 T' },
      { k: 'Kemiskinan tertinggi', v: 'Papua Peg. 30,0%' },
      { k: 'Kemiskinan terendah', v: 'Bali 3,7%' },
    ],
    chip: 'bps · djpk',
  },
];

/** Aparat: budget against documented violence and the impunity asymmetry. */
export const APARAT = {
  anggaran: [
    { k: 'TNI / Kemhan', v: 'Rp 187,1 T' },
    { k: 'Polri', v: 'Rp 145,7 T' },
  ],
  kekerasan: { jumlah: 602, tembak: 411, tewas: 10, periode: 'Jul 2024 – Jun 2025', sumber: 'kontras' },
  impunitas: 'Kasus terhadap perwira umumnya berakhir di sidang etik (demosi atau pemberhentian), bukan pidana. Dalam kematian Affan Kurniawan (rantis Brimob, 28 Agu 2025), perwira disanksi etik; warga sipil yang ditangkap justru diadili pidana.',
  perwiraSipil: 2569,
};

/** Ekonomi negara: APBN, and Otsus folded in as a plain spend-vs-outcome row. */
export const EKONOMI = {
  apbn: { belanja: 'Rp 3.842 T', defisit: '> 3% PDB (proyeksi)', pajak: 'rasio ± 10%' },
  otsus: {
    teks: 'Sejak 2002 Papua menerima dana otonomi khusus Rp 138,65 triliun; jilid kedua diproyeksikan ± Rp 234 triliun hingga 2041. Sementara itu provinsi-provinsi Papua tetap mencatat kemiskinan tertinggi di Indonesia.',
    chip: 'djpk · bps',
  },
};

/** Lensa Daerah: national default + a handful of regions. Stats are sample
    (contoh), shaped for the BPS WebAPI + DJPK pipe. 'nasional' is the
    aggregate every reader sees first; a reader (or Aksara) can switch. */
export const DAERAH = [
  { kode: 'nasional', nama: 'Indonesia', penduduk: '284,4 jt', ump: 'Rp 3,1 jt', miskin: '8,25%', dokter: '0,76', ipm: '74,4', pegawai: '35%', fakta: 'Rerata nasional. Pilih daerah untuk membandingkan.' },
  { kode: '31', nama: 'DKI Jakarta', penduduk: '10,6 jt', ump: 'Rp 5,73 jt', miskin: '4,40%', dokter: '2,53', ipm: '83,0', pegawai: '28%', fakta: 'Rasio dokter tertinggi di Indonesia: 2,53 per 1.000 jiwa.' },
  { kode: '94', nama: 'Papua Pegunungan', penduduk: '1,4 jt', ump: 'Rp 4,0 jt', miskin: '30,03%', dokter: '~0,10', ipm: '49,0', pegawai: '52%', fakta: 'Kemiskinan tertinggi di Indonesia; rasio dokter nyaris nol.' },
  { kode: '51', nama: 'Bali', penduduk: '4,4 jt', ump: 'Rp 2,9 jt', miskin: '3,72%', dokter: '1,10', ipm: '78,0', pegawai: '30%', fakta: 'Kemiskinan terendah di Indonesia: 3,72%.' },
  { kode: '32', nama: 'Jawa Barat', penduduk: '49,9 jt', ump: 'Rp 2,2 jt', miskin: '7,46%', dokter: '0,55', ipm: '74,2', pegawai: '34%', fakta: 'Provinsi terpadat; PHK terbanyak sepanjang Jan–Mei 2026.' },
  { kode: '73', nama: 'Sulawesi Selatan', penduduk: '9,4 jt', ump: 'Rp 3,6 jt', miskin: '8,70%', dokter: '0,70', ipm: '73,5', pegawai: '36%', fakta: 'Gerbang timur; lumbung pangan dengan ketimpangan layanan.' },
  { kode: '11', nama: 'Aceh', penduduk: '5,5 jt', ump: 'Rp 3,7 jt', miskin: '14,23%', dokter: '0,80', ipm: '74,7', pegawai: '41%', fakta: 'Dana Otsus ± Rp 3,7 T (2026); alokasi khusus menurun bertahap.' },
];
