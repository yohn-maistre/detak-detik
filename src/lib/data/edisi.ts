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
  absen: { k: 'Warga mengungsi akibat konflik', v: '—', catatan: 'data resmi tidak tersedia' },
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

export const TEBAK = {
  jawaban: 'MERAUKE',
  pilihan: ['MIMIKA', 'MERAUKE', 'NABIRE', 'PUNCAK', 'JAYAPURA', 'SORONG'],
  clues: [
    'APBD 2026 per kapita: Rp 14,2 jt (data contoh)',
    'Kabupaten paling timur sekaligus paling selatan Indonesia',
    'Zona food estate PSN dengan luas izin terbesar di Papua Selatan',
  ],
};
