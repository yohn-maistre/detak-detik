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

// what to watch today — an editorial rundown (curated; newsroom-fed later)
export const AGENDA = [
  { jam: '10.00', teks: 'Rapat paripurna DPR: pembahasan dua RUU prioritas', tag: 'LEGISLATIF' },
  { jam: '11.00', teks: 'BPS rilis data neraca perdagangan bulanan', tag: 'EKONOMI' },
  { jam: '13.30', teks: 'Sidang putusan tindak pidana korupsi di PN Jakarta Pusat', tag: 'HUKUM' },
  { jam: '14.00', teks: 'Konferensi pers BMKG: prakiraan musim dan kualitas udara', tag: 'LINGKUNGAN' },
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
  sub: 'APBN 2026 · per warga negara',
  baris: [
    { k: 'Belanja K/L (kementerian)', v: '36,2%' },
    { k: 'Transfer ke daerah & desa', v: '29,7%' },
    { k: 'Bunga utang', v: '14,4%' },
    { k: 'Subsidi & kompensasi', v: '11,7%' },
    { k: 'Lainnya', v: '8,0%' },
  ],
  total: [
    { k: 'TOTAL BELANJA', v: 'Rp 3.842 T' },
    { k: 'Per warga negara', v: 'Rp 13,5 jt' },
  ],
  roast: '“Bunga utang setahun: Rp 552 T, melampaui anggaran kesehatan.”',
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
  kiri: { angka: 'Rp 552 T', label: 'bunga utang yang dibayar negara tahun ini', chip: 'apbn 2026 · kemenkeu' },
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

/** Lensa Daerah: national default + all 38 provinces. Stats are sample
    (contoh), shaped for the BPS WebAPI + DJPK pipe. 'nasional' is the
    aggregate every reader sees first; a reader (or Aksara) searches for a
    province to compare. `pulau` groups the search; `tpt` is open
    unemployment. A future weekend lowers this to kabupaten (see
    docs/DATA_SOURCES.md). */
export const DAERAH = [
  { kode: 'nasional', nama: 'Indonesia', pulau: 'Nasional', penduduk: '284,4 jt', ump: 'Rp 3,1 jt', miskin: '8,25%', dokter: '0,76', ipm: '74,4', pegawai: '35%', tpt: '4,68%', fakta: 'Rerata nasional. Cari provinsi untuk melihat di mana ia berdiri.' },

  { kode: '11', nama: 'Aceh', pulau: 'Sumatra', penduduk: '5,5 jt', ump: 'Rp 3,7 jt', miskin: '14,23%', dokter: '0,80', ipm: '74,7', pegawai: '41%', tpt: '5,75%', fakta: 'Dana Otsus ± Rp 3,7 T (2026); kemiskinan tertinggi di Sumatra.' },
  { kode: '12', nama: 'Sumatera Utara', pulau: 'Sumatra', penduduk: '15,4 jt', ump: 'Rp 2,99 jt', miskin: '8,15%', dokter: '0,62', ipm: '73,0', pegawai: '33%', tpt: '5,60%', fakta: 'Provinsi terpadat di luar Jawa; gerbang ekonomi Sumatra.' },
  { kode: '13', nama: 'Sumatera Barat', pulau: 'Sumatra', penduduk: '5,7 jt', ump: 'Rp 2,99 jt', miskin: '5,90%', dokter: '0,70', ipm: '74,2', pegawai: '36%', tpt: '5,90%', fakta: 'IPM di atas rerata nasional, kemiskinan di bawahnya.' },
  { kode: '14', nama: 'Riau', pulau: 'Sumatra', penduduk: '6,7 jt', ump: 'Rp 3,51 jt', miskin: '6,68%', dokter: '0,55', ipm: '74,6', pegawai: '30%', tpt: '4,30%', fakta: 'Sawit dan migas: pendapatan tinggi, layanan masih timpang.' },
  { kode: '15', nama: 'Jambi', pulau: 'Sumatra', penduduk: '3,7 jt', ump: 'Rp 3,30 jt', miskin: '7,58%', dokter: '0,45', ipm: '73,0', pegawai: '34%', tpt: '4,50%', fakta: 'Rasio dokter di bawah rerata nasional.' },
  { kode: '16', nama: 'Sumatera Selatan', pulau: 'Sumatra', penduduk: '8,8 jt', ump: 'Rp 3,68 jt', miskin: '10,80%', dokter: '0,40', ipm: '71,4', pegawai: '33%', tpt: '4,30%', fakta: 'Kemiskinan dua digit; rasio dokter terendah di Sumatra.' },
  { kode: '17', nama: 'Bengkulu', pulau: 'Sumatra', penduduk: '2,1 jt', ump: 'Rp 2,67 jt', miskin: '14,04%', dokter: '0,55', ipm: '72,5', pegawai: '38%', tpt: '3,40%', fakta: 'Kemiskinan dua digit meski penduduk paling sedikit di Sumatra.' },
  { kode: '18', nama: 'Lampung', pulau: 'Sumatra', penduduk: '9,4 jt', ump: 'Rp 2,71 jt', miskin: '10,69%', dokter: '0,38', ipm: '71,4', pegawai: '32%', tpt: '4,20%', fakta: 'Rasio dokter terendah di Sumatra: 0,38 per 1.000 jiwa.' },
  { kode: '19', nama: 'Kep. Bangka Belitung', pulau: 'Sumatra', penduduk: '1,5 jt', ump: 'Rp 3,84 jt', miskin: '4,52%', dokter: '0,50', ipm: '73,0', pegawai: '35%', tpt: '4,60%', fakta: 'UMP termasuk tertinggi; bekas lumbung timah.' },
  { kode: '21', nama: 'Kepulauan Riau', pulau: 'Sumatra', penduduk: '2,2 jt', ump: 'Rp 3,62 jt', miskin: '5,37%', dokter: '0,85', ipm: '76,5', pegawai: '28%', tpt: '6,90%', fakta: 'IPM tinggi, tetapi pengangguran terbuka termasuk tertinggi.' },

  { kode: '31', nama: 'DKI Jakarta', pulau: 'Jawa', penduduk: '10,6 jt', ump: 'Rp 5,73 jt', miskin: '4,40%', dokter: '2,53', ipm: '83,0', pegawai: '28%', tpt: '6,00%', fakta: 'Rasio dokter (2,53/1.000) dan UMP tertinggi di Indonesia.' },
  { kode: '32', nama: 'Jawa Barat', pulau: 'Jawa', penduduk: '49,9 jt', ump: 'Rp 2,19 jt', miskin: '7,46%', dokter: '0,55', ipm: '74,2', pegawai: '34%', tpt: '7,40%', fakta: 'Provinsi terpadat; pengangguran terbuka tertinggi nasional.' },
  { kode: '33', nama: 'Jawa Tengah', pulau: 'Jawa', penduduk: '38,3 jt', ump: 'Rp 2,17 jt', miskin: '10,77%', dokter: '0,50', ipm: '73,4', pegawai: '33%', tpt: '4,80%', fakta: 'UMP terendah nasional berdampingan dengan kemiskinan dua digit.' },
  { kode: '34', nama: 'DI Yogyakarta', pulau: 'Jawa', penduduk: '3,7 jt', ump: 'Rp 2,32 jt', miskin: '11,04%', dokter: '1,50', ipm: '81,1', pegawai: '30%', tpt: '3,40%', fakta: 'IPM tertinggi kedua, tetapi kemiskinan di atas rerata nasional.' },
  { kode: '35', nama: 'Jawa Timur', pulau: 'Jawa', penduduk: '41,8 jt', ump: 'Rp 2,40 jt', miskin: '9,79%', dokter: '0,58', ipm: '74,6', pegawai: '32%', tpt: '4,20%', fakta: 'Penduduk terbesar kedua; UMP di bawah rerata nasional.' },
  { kode: '36', nama: 'Banten', pulau: 'Jawa', penduduk: '12,3 jt', ump: 'Rp 2,91 jt', miskin: '5,96%', dokter: '0,48', ipm: '74,0', pegawai: '31%', tpt: '7,90%', fakta: 'Pengangguran terbuka tertinggi nasional: 7,90%.' },

  { kode: '51', nama: 'Bali', pulau: 'Bali & Nusa Tenggara', penduduk: '4,4 jt', ump: 'Rp 2,96 jt', miskin: '3,72%', dokter: '1,10', ipm: '78,0', pegawai: '30%', tpt: '2,70%', fakta: 'Kemiskinan terendah (3,72%) dan pengangguran terendah nasional.' },
  { kode: '52', nama: 'Nusa Tenggara Barat', pulau: 'Bali & Nusa Tenggara', penduduk: '5,6 jt', ump: 'Rp 2,60 jt', miskin: '12,91%', dokter: '0,42', ipm: '71,0', pegawai: '35%', tpt: '3,00%', fakta: 'Kemiskinan dua digit; pengangguran rendah, upah rendah.' },
  { kode: '53', nama: 'Nusa Tenggara Timur', pulau: 'Bali & Nusa Tenggara', penduduk: '5,6 jt', ump: 'Rp 2,33 jt', miskin: '19,48%', dokter: '0,30', ipm: '66,3', pegawai: '40%', tpt: '3,20%', fakta: 'IPM dan rasio dokter terendah di luar Papua.' },

  { kode: '61', nama: 'Kalimantan Barat', pulau: 'Kalimantan', penduduk: '5,6 jt', ump: 'Rp 2,88 jt', miskin: '6,71%', dokter: '0,40', ipm: '70,5', pegawai: '34%', tpt: '4,80%', fakta: 'IPM di bawah rerata nasional; rasio dokter rendah.' },
  { kode: '62', nama: 'Kalimantan Tengah', pulau: 'Kalimantan', penduduk: '2,8 jt', ump: 'Rp 3,51 jt', miskin: '5,11%', dokter: '0,45', ipm: '73,5', pegawai: '36%', tpt: '4,00%', fakta: 'Lokasi food estate PSN di lahan eks-gambut.' },
  { kode: '63', nama: 'Kalimantan Selatan', pulau: 'Kalimantan', penduduk: '4,2 jt', ump: 'Rp 3,50 jt', miskin: '4,52%', dokter: '0,50', ipm: '73,0', pegawai: '33%', tpt: '4,50%', fakta: 'Kemiskinan rendah; ekonomi batu bara.' },
  { kode: '64', nama: 'Kalimantan Timur', pulau: 'Kalimantan', penduduk: '4,0 jt', ump: 'Rp 3,58 jt', miskin: '6,11%', dokter: '0,70', ipm: '78,2', pegawai: '29%', tpt: '5,30%', fakta: 'Lokasi IKN; IPM tinggi dari tambang dan migas.' },
  { kode: '65', nama: 'Kalimantan Utara', pulau: 'Kalimantan', penduduk: '0,74 jt', ump: 'Rp 3,58 jt', miskin: '6,80%', dokter: '0,55', ipm: '73,5', pegawai: '35%', tpt: '4,90%', fakta: 'Provinsi termuda dan berpenduduk paling sedikit.' },

  { kode: '71', nama: 'Sulawesi Utara', pulau: 'Sulawesi', penduduk: '2,7 jt', ump: 'Rp 3,55 jt', miskin: '7,38%', dokter: '0,80', ipm: '75,7', pegawai: '32%', tpt: '5,50%', fakta: 'IPM dan rasio dokter di atas rerata nasional.' },
  { kode: '72', nama: 'Sulawesi Tengah', pulau: 'Sulawesi', penduduk: '3,1 jt', ump: 'Rp 2,91 jt', miskin: '12,33%', dokter: '0,50', ipm: '72,0', pegawai: '36%', tpt: '3,20%', fakta: 'Pusat smelter nikel Morowali: pertumbuhan tinggi, kemiskinan tinggi.' },
  { kode: '73', nama: 'Sulawesi Selatan', pulau: 'Sulawesi', penduduk: '9,4 jt', ump: 'Rp 3,66 jt', miskin: '8,70%', dokter: '0,70', ipm: '73,5', pegawai: '36%', tpt: '4,30%', fakta: 'Gerbang timur; lumbung pangan dengan ketimpangan layanan.' },
  { kode: '74', nama: 'Sulawesi Tenggara', pulau: 'Sulawesi', penduduk: '2,8 jt', ump: 'Rp 3,07 jt', miskin: '11,40%', dokter: '0,55', ipm: '72,5', pegawai: '37%', tpt: '3,20%', fakta: 'Tambang nikel meluas; kemiskinan dua digit.' },
  { kode: '75', nama: 'Gorontalo', pulau: 'Sulawesi', penduduk: '1,2 jt', ump: 'Rp 3,22 jt', miskin: '15,00%', dokter: '0,55', ipm: '70,5', pegawai: '38%', tpt: '3,80%', fakta: 'Kemiskinan tertinggi di Sulawesi: 15,00%.' },
  { kode: '76', nama: 'Sulawesi Barat', pulau: 'Sulawesi', penduduk: '1,5 jt', ump: 'Rp 3,03 jt', miskin: '11,20%', dokter: '0,40', ipm: '67,5', pegawai: '38%', tpt: '2,90%', fakta: 'IPM terendah di Sulawesi; pengangguran terendah.' },

  { kode: '81', nama: 'Maluku', pulau: 'Maluku & Papua', penduduk: '1,9 jt', ump: 'Rp 3,40 jt', miskin: '16,00%', dokter: '0,55', ipm: '71,0', pegawai: '42%', tpt: '6,00%', fakta: 'Belanja pegawai tinggi; pengangguran di atas rerata.' },
  { kode: '82', nama: 'Maluku Utara', pulau: 'Maluku & Papua', penduduk: '1,4 jt', ump: 'Rp 3,45 jt', miskin: '6,38%', dokter: '0,50', ipm: '70,0', pegawai: '40%', tpt: '4,50%', fakta: 'Pusat nikel Halmahera (Weda Bay); kemiskinan relatif rendah.' },
  { kode: '91', nama: 'Papua Barat', pulau: 'Maluku & Papua', penduduk: '0,56 jt', ump: 'Rp 3,61 jt', miskin: '21,00%', dokter: '0,45', ipm: '66,5', pegawai: '44%', tpt: '5,30%', fakta: 'Kemiskinan di atas 20% meski UMP tinggi.' },
  { kode: '92', nama: 'Papua Barat Daya', pulau: 'Maluku & Papua', penduduk: '0,6 jt', ump: 'Rp 3,61 jt', miskin: '18,50%', dokter: '0,40', ipm: '65,0', pegawai: '44%', tpt: '5,50%', fakta: 'Pintu masuk Raja Ampat; provinsi baru sejak 2022.' },
  { kode: '94', nama: 'Papua', pulau: 'Maluku & Papua', penduduk: '1,0 jt', ump: 'Rp 4,00 jt', miskin: '17,30%', dokter: '0,30', ipm: '63,0', pegawai: '45%', tpt: '3,50%', fakta: 'UMP tinggi berdampingan dengan IPM jauh di bawah nasional.' },
  { kode: '95', nama: 'Papua Selatan', pulau: 'Maluku & Papua', penduduk: '0,53 jt', ump: 'Rp 4,00 jt', miskin: '17,00%', dokter: '0,25', ipm: '61,0', pegawai: '46%', tpt: '3,00%', fakta: 'Lokasi food estate Merauke; provinsi baru sejak 2022.' },
  { kode: '96', nama: 'Papua Tengah', pulau: 'Maluku & Papua', penduduk: '1,3 jt', ump: 'Rp 4,00 jt', miskin: '21,50%', dokter: '0,20', ipm: '58,0', pegawai: '48%', tpt: '3,80%', fakta: 'Mencakup Mimika dan Nabire: tambang besar, kemiskinan tinggi.' },
  { kode: '97', nama: 'Papua Pegunungan', pulau: 'Maluku & Papua', penduduk: '1,5 jt', ump: 'Rp 4,00 jt', miskin: '30,03%', dokter: '0,10', ipm: '49,0', pegawai: '52%', tpt: '3,50%', fakta: 'Kemiskinan tertinggi (30%) dan rasio dokter terendah nasional.' },
];

/** Province centroids (lon, lat) for the clickable map markers and fly-to.
    Approximate; the only purpose is to place a dot and recentre the map. */
export const PROV_GEO: Record<string, [number, number]> = {
  '11': [96.9, 4.7], '12': [99.0, 2.6], '13': [100.6, -0.7], '14': [101.7, 0.5],
  '15': [102.9, -1.6], '16': [104.0, -3.2], '17': [102.3, -3.6], '18': [105.2, -4.8],
  '19': [106.9, -2.7], '21': [104.5, 0.9], '31': [106.83, -6.2], '32': [107.6, -6.9],
  '33': [110.0, -7.3], '34': [110.4, -7.9], '35': [112.7, -7.8], '36': [106.1, -6.4],
  '51': [115.2, -8.4], '52': [117.4, -8.7], '53': [121.1, -8.7], '61': [111.5, 0.0],
  '62': [113.4, -1.7], '63': [115.3, -3.1], '64': [116.5, 0.5], '65': [116.9, 3.1],
  '71': [124.8, 0.8], '72': [121.4, -1.4], '73': [119.9, -3.7], '74': [122.2, -4.1],
  '75': [122.4, 0.7], '76': [119.2, -2.0], '81': [129.5, -3.5], '82': [127.9, 1.0],
  '91': [132.3, -1.3], '92': [131.3, -1.0], '94': [139.0, -4.2], '95': [139.7, -7.4],
  '96': [136.3, -3.9], '97': [139.0, -4.0],
};
