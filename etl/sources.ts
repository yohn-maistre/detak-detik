/**
 * The SOURCES ledger as code. Statuses verified by web research, June 2026.
 * Fragility drives mirror policy: the value of our signed copy rises as the
 * original rots. Most .go.id portals 403 non-browser UAs: fetch with honest
 * but realistic headers, low rates, and keep the last good mirror.
 */

export type Lane = 'A' | 'B' | 'C';

export interface Source {
  id: string;
  apa: string;
  akses: string;
  irama: string;
  fragilitas: 'rendah' | 'sedang' | 'tinggi';
  lane: Lane;
  catatan?: string;
}

export const SOURCES: Source[] = [
  {
    id: 'cod_ab',
    apa: 'Batas administrasi adm0-adm2 + pcode',
    akses: 'https://data.humdata.org/dataset/cod-ab-idn (CKAN API; 403 untuk bot UA, pakai hdx-python-api atau UA jujur)',
    irama: 'tahunan',
    fragilitas: 'rendah',
    lane: 'B',
  },
  {
    id: 'bps_webapi',
    apa: 'IPM, kemiskinan, populasi per kabupaten',
    akses: 'https://webapi.bps.go.id/v1/api/list/... (daftar gratis, token instan)',
    irama: 'tahunan',
    fragilitas: 'sedang',
    lane: 'B',
  },
  {
    id: 'putusan_ma',
    apa: 'Direktori Putusan MA (10 jt+ putusan)',
    akses: 'scrape putusan3.mahkamahagung.go.id (WAF; header browser + throttle). Bootstrap: korpus indo-law (22.630 putusan, GitHub ir-nlp-csui) + koleksi HF Azzindani',
    irama: 'harian',
    fragilitas: 'tinggi',
    lane: 'B',
    catatan: 'mungkin perlu relay IP residensial',
  },
  {
    id: 'djpk_apbd',
    apa: 'APBD anggaran + realisasi per pemda',
    akses: 'https://djpk.kemenkeu.go.id/portal/data/apbd (Excel; data hingga Jun 2026, 545 pemda)',
    irama: 'bulanan (realisasi)',
    fragilitas: 'sedang',
    lane: 'B',
  },
  {
    id: 'gfw_alerts',
    apa: 'Peringatan deforestasi terpadu (GLAD/RADD/DIST)',
    akses: 'https://data-api.globalforestwatch.org/dataset/gfw_integrated_alerts/latest/query (API key gratis, header x-api-key)',
    irama: 'harian',
    fragilitas: 'rendah',
    lane: 'B',
  },
  {
    id: 'pihps',
    apa: 'Harga pangan harian per kab/kota',
    akses: 'hargapangan.id (endpoint internal, rapuh) ATAU webapi.badanpangan.go.id (resmi, approval manual Pusdatin)',
    irama: 'harian',
    fragilitas: 'sedang',
    lane: 'B',
  },
  {
    id: 'bmkg',
    apa: 'Gempa terkini',
    akses: 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json (terbuka, atribusi wajib)',
    irama: 'real-time',
    fragilitas: 'rendah',
    lane: 'B',
  },
  {
    id: 'gdelt',
    apa: 'Volume perhatian media per topik',
    akses: 'DOC 2.0 API sourcecountry:indonesia (gratis, tanpa auth)',
    irama: 'harian',
    fragilitas: 'rendah',
    lane: 'B',
  },
  {
    id: 'football_data',
    apa: 'Skor Piala Dunia 2026 (Selama 90 Menit)',
    akses: 'https://api.football-data.org/v4/competitions/WC/matches (free tier, X-Auth-Token, 10 req/mnt)',
    irama: 'per pertandingan',
    fragilitas: 'rendah',
    lane: 'B',
  },
  {
    id: 'rijks',
    apa: 'Seni domain publik (Arsip)',
    akses: 'https://data.rijksmuseum.nl (OAI-PMH/Search, TANPA key; API lama mati Jan 2026)',
    irama: 'statis, dirotasi',
    fragilitas: 'rendah',
    lane: 'B',
  },
  {
    id: 'wikimedia',
    apa: 'Seni & foto arsip domain publik',
    akses: 'Commons API (UA deskriptif wajib; limit anonim makin ketat 2026)',
    irama: 'statis, dirotasi',
    fragilitas: 'rendah',
    lane: 'B',
  },
  {
    id: 'hrm',
    apa: 'Angka pengungsi internal Papua',
    akses: 'laporan Human Rights Monitor, dibaca manusia, masuk antrean staging',
    irama: '~bulanan',
    fragilitas: 'sedang',
    lane: 'C',
    catatan: 'staging gate permanen: tidak pernah auto-publish',
  },
  {
    id: 'rss_lane_a',
    apa: 'Berita Kilat (judul verbatim + tautan keluar)',
    akses: 'RSS Antara/Tempo/BBC Indonesia/Mongabay via cron Worker',
    irama: 'per jam',
    fragilitas: 'rendah',
    lane: 'A',
    catatan: 'tidak ada model yang menyentuh lajur ini, pernah',
  },
];
