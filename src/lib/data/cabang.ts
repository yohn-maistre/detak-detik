/**
 * The five branches, as chapter-opener bands. Each band is the signature
 * figure that leads its chapter (Eksekutif -> Kuasa, Legislatif -> Pabrik UU,
 * Yudikatif -> Hukum, Aparat, Daerah -> Ekonomi). Rendered one-per-chapter by
 * CabangBand.svelte; the slim index strip at the top of Act II maps the same
 * list. Figures are June 2026 sample data, marked contoh in the UI.
 */
export type CabangViz =
  | { type: 'dots'; n: number }
  | { type: 'gantt'; rows: { k: string; w: string; label: string; macet?: boolean }[] }
  | { type: 'prop'; w: string; cls: 'kembali' | 'etik' }
  | { type: 'range'; lo: string; hi: string };

export interface Cabang {
  slug: string;
  no: string;
  nama: string;
  anchor: string;
  ringkas: string; // one line for the index strip
  apa: string; // the institutional explainer
  big?: string;
  bigAccent?: boolean;
  cap?: string;
  side?: string;
  viz: CabangViz;
}

export const CABANG: Cabang[] = [
  {
    slug: 'eksekutif',
    no: '01',
    nama: 'Eksekutif',
    anchor: 'kuasa',
    ringkas: 'Presiden dan kabinet terbesar sejak 1966.',
    apa: 'Presiden, 48 menteri, 56 wakil menteri, dan badan seperti Danantara dan Badan Pengarah Papua.',
    big: '109',
    cap: 'pejabat kabinet, terbanyak sejak 1966',
    side: 'DANANTARA: 0 LAPORAN KEUANGAN TERBIT',
    viz: { type: 'dots', n: 109 },
  },
  {
    slug: 'legislatif',
    no: '02',
    nama: 'Legislatif',
    anchor: 'pabrik',
    ringkas: 'Undang-undang yang melaju, dan yang menunggu.',
    apa: 'DPR 580 kursi dan DPD: menyusun undang-undang dan anggaran negara.',
    cap: 'Yang memperkuat kuasa lolos dalam hitungan hari; yang merampas hasil korupsi menunggu belasan tahun, belum disahkan.',
    viz: {
      type: 'gantt',
      rows: [
        { k: 'Revisi UU Polri', w: '4%', label: '20 hari' },
        { k: 'RUU Perampasan Aset', w: '100%', label: '13+ tahun', macet: true },
      ],
    },
  },
  {
    slug: 'yudikatif',
    no: '03',
    nama: 'Yudikatif',
    anchor: 'hukum',
    ringkas: 'Berapa kerugian korupsi yang akhirnya kembali.',
    apa: 'Mahkamah Agung, Mahkamah Konstitusi, dan KPK: menafsir hukum dan mengadili.',
    big: '13%',
    cap: 'dari kerugian korupsi yang akhirnya kembali ke kas negara',
    side: '87% TIDAK PERNAH KEMBALI',
    viz: { type: 'prop', w: '13%', cls: 'kembali' },
  },
  {
    slug: 'aparat',
    no: '04',
    nama: 'Aparat',
    anchor: 'aparat',
    ringkas: 'Anggaran terbesar, pertanggungjawaban paling jarang.',
    apa: 'Polri dan TNI: alat paksa negara, dengan anggaran terbesar di APBN.',
    big: '602',
    bigAccent: true,
    cap: 'insiden kekerasan polisi setahun, 10 di antaranya berujung kematian',
    side: 'SEBAGIAN BESAR BERAKHIR DI SIDANG ETIK, BUKAN PIDANA',
    viz: { type: 'prop', w: '88%', cls: 'etik' },
  },
  {
    slug: 'daerah',
    no: '05',
    nama: 'Daerah',
    anchor: 'ekonomi',
    ringkas: 'Jarak peluang lahir miskin antarprovinsi.',
    apa: '38 provinsi, ratusan pemda, plus otonomi khusus Aceh dan Papua.',
    big: '8×',
    cap: 'selisih peluang lahir miskin antara provinsi terendah dan tertinggi',
    viz: { type: 'range', lo: 'BALI 3,7%', hi: 'PAPUA PEG. 30,0%' },
  },
];

export const getCabang = (slug: string): Cabang => CABANG.find((c) => c.slug === slug) ?? CABANG[0]!;
