/**
 * The five branches, as chapter-opener bands. Each band is the signature
 * figure that leads its chapter (Eksekutif -> Kuasa, Legislatif -> Pabrik UU,
 * Yudikatif -> Hukum, Aparat, Daerah -> Ekonomi). Rendered one-per-chapter by
 * CabangBand.svelte; the slim index strip at the top of Act II maps the same
 * list. Figures are June 2026 sample data, marked contoh in the UI.
 */
export type CabangViz =
  | { type: 'dots'; n: number }
  | {
      // durations on a LABELED LOG RULER (the honest way to draw 20 days next
      // to 13 years on one track — a linear scale makes the fast bar a lie)
      type: 'gantt';
      skala: { ticks: { v: number; label: string }[]; catatan: string };
      rows: { k: string; hari: number; label: string; macet?: boolean }[];
    }
  | { type: 'prop'; w: string; cls: 'kembali' | 'etik' }
  | {
      type: 'range';
      lo: string;
      hi: string;
      // the national needle: where the whole country sits inside the span
      jarum?: { min: number; max: number; nilai: number; label: string };
    };

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
    viz: { type: 'dots', n: 109 },
  },
  {
    slug: 'legislatif',
    no: '02',
    nama: 'Legislatif',
    anchor: 'pabrik',
    ringkas: 'Rentang waktu pengesahan undang-undang.',
    apa: 'DPR 580 kursi dan DPD: menyusun undang-undang dan anggaran negara.',
    cap: 'Revisi UU Polri disahkan dalam 20 hari; RUU Perampasan Aset belum disahkan setelah lebih dari 13 tahun.',
    viz: {
      type: 'gantt',
      skala: {
        ticks: [
          { v: 10, label: '10 HARI' },
          { v: 100, label: '100' },
          { v: 1000, label: '1.000' },
          { v: 10000, label: '10.000' },
        ],
        catatan: 'SKALA LOG · HARI KALENDER',
      },
      rows: [
        { k: 'Revisi UU Polri', hari: 20, label: '20 hari' },
        { k: 'RUU Perampasan Aset', hari: 4750, label: '13+ tahun', macet: true },
      ],
    },
  },
  {
    slug: 'yudikatif',
    no: '03',
    nama: 'Yudikatif',
    anchor: 'hukum',
    ringkas: 'Porsi kerugian korupsi yang kembali ke kas negara.',
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
    ringkas: 'Anggaran terbesar di APBN; sebagian besar insiden berakhir di sidang etik.',
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
    anchor: 'daerah',
    ringkas: 'Jarak peluang lahir miskin antarprovinsi.',
    apa: '38 provinsi, ratusan pemda, plus otonomi khusus Aceh dan Papua.',
    big: '8×',
    cap: 'selisih peluang lahir miskin antara provinsi terendah dan tertinggi',
    viz: {
      type: 'range',
      lo: 'BALI 3,7%',
      hi: 'PAPUA PEG. 30,0%',
      jarum: { min: 3.7, max: 30.0, nilai: 8.57, label: 'NASIONAL 8,6%' },
    },
  },
];

export const getCabang = (slug: string): Cabang => CABANG.find((c) => c.slug === slug) ?? CABANG[0]!;
