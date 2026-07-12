/**
 * The five branches, as chapter-opener bands. Each band is the signature
 * figure that leads its chapter (Eksekutif -> Kuasa, Legislatif -> Pabrik UU,
 * Yudikatif -> Hukum, Aparat, Daerah -> Ekonomi). Rendered one-per-chapter by
 * CabangBand.svelte; the slim index strip at the top of Act II maps the same
 * list.
 *
 * SATU FAKTA SATU PEMILIK (wave 9a): every figure here DERIVES from its
 * owner — kabinet.json (composition), vital_cabang.json (sourced vitals),
 * akuntabilitas.ts (aparat record), edisi.ts DAERAH (province table) — so
 * the band can never contradict the instruments below it. Remaining sample
 * figures stay marked contoh in the UI.
 */
import { KABINET } from './kabinet';
import VITAL from '../../../newsroom/data/vital_cabang.json';
import { APARAT_KEKERASAN, ETIK_PCT } from './akuntabilitas';
import { DAERAH } from './edisi';

export type CabangViz =
  // the band prints only the anchor figure; the chapter's instruments draw
  | { type: 'none' }
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
  /** the band's printed receipt — with the kartu vital retired (2026-07-12,
   *  Yose's call: one fact family, one surface) the signature figure carries
   *  its own source line; citation-or-silence */
  sumber?: string;
  viz: CabangViz;
}

/* ── derivations from the owners ── */

const vital = (id: string) => VITAL.find((v) => v.id === id);

/** yudikatif: recovery share, owned by the kartu vital (ICW 2024) */
const KEMBALI = vital('yudikatif-recovery')?.nilai ?? 0;
const kembaliStr = KEMBALI.toLocaleString('id-ID', { maximumFractionDigits: 2 });
const hilangStr = Math.round(100 - KEMBALI).toLocaleString('id-ID');

/** RUU Perampasan Aset: both ageing surfaces (this gantt + PabrikUU) count
 *  from this one date, so they can never drift apart again. Early-2013 =
 *  the government draft completed and handed over (naskah PPATK 2008/2012);
 *  data contoh, verifikasi berlanjut — the chip below says so. */
export const PERAMPASAN_ASET_DIAJUKAN = Date.UTC(2013, 0, 1);
export const hariPerampasanAset = () =>
  Math.max(1, Math.floor((Date.now() - PERAMPASAN_ASET_DIAJUKAN) / 86400000));
const hariPA = hariPerampasanAset();
const tahunPA = Math.floor(hariPA / 365);

/** daerah: poverty span derives from the SAME table the Lensa reads */
const provinsi = DAERAH.filter((d) => d.kode !== 'nasional').map((d) => ({
  nama: d.nama,
  v: parseFloat(d.miskin.replace('%', '').replace(',', '.')),
}));
const termiskin = provinsi.reduce((a, b) => (b.v > a.v ? b : a));
const terkaya = provinsi.reduce((a, b) => (b.v < a.v ? b : a));
const nasionalMiskin = parseFloat(
  (DAERAH.find((d) => d.kode === 'nasional')?.miskin ?? '0').replace('%', '').replace(',', '.'),
);
const kali = Math.round(termiskin.v / terkaya.v);
const pendekkan = (nama: string) => nama.toUpperCase().replace('PEGUNUNGAN', 'PEG.');
const pct = (v: number) => `${v.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

export const CABANG: Cabang[] = [
  {
    slug: 'eksekutif',
    no: '01',
    nama: 'Eksekutif',
    anchor: 'kuasa',
    ringkas: 'Presiden dan kabinet terbesar sejak 1966.',
    apa: `Presiden, ${KABINET.menteri} menteri, ${KABINET.wamen} wakil menteri, dan badan seperti Danantara dan Badan Pengarah Papua.`,
    big: String(KABINET.total),
    // the retired kartu vital's insight folds into the caption: the like-for-
    // like count (menteri & setingkat, tanpa wamen) against the 2014 cabinet
    cap: `pejabat kabinet, terbanyak sejak 1966 — menteri & pejabat setingkat: ${vital('eksekutif-kabinet')?.nilai ?? 48}, kabinet 2014: ${vital('eksekutif-kabinet')?.dulu?.nilai ?? 34}`,
    sumber: vital('eksekutif-kabinet')?.sumber,
    // one mark per pejabat is KabinetWaffle's job below — the band keeps
    // only the anchor numeral (satu angka satu pemilik)
    viz: { type: 'none' },
  },
  {
    slug: 'legislatif',
    no: '02',
    nama: 'Legislatif',
    anchor: 'pabrik',
    ringkas: 'Rentang waktu pengesahan undang-undang.',
    apa: 'DPR 580 kursi dan DPD: menyusun undang-undang dan anggaran negara.',
    big: `${tahunPA}+ tahun`,
    cap: `RUU Perampasan Aset menunggu pengesahan; Revisi UU Polri selesai dalam 20 hari — dan dari target Prolegnas 52 RUU pada 2025, ${vital('legislatif-throughput')?.nilai ?? 9} disahkan. Rentang selengkapnya digambar Pabrik Undang-Undang di bawah.`,
    sumber: vital('legislatif-throughput')?.sumber,
    // the duration comparison is PabrikUU's chart — the band held a two-row
    // copy of the same bars; it now keeps only the stalled-bill anchor
    viz: { type: 'none' },
  },
  {
    slug: 'yudikatif',
    no: '03',
    nama: 'Yudikatif',
    anchor: 'hukum',
    ringkas: 'Porsi kerugian korupsi yang kembali ke kas negara.',
    apa: 'Mahkamah Agung, Mahkamah Konstitusi, dan KPK: menafsir hukum dan mengadili.',
    big: `${kembaliStr}%`,
    cap: `dari kerugian korupsi dalam vonis 2024 yang kembali ke kas negara — ${vital('yudikatif-recovery')?.catatan ?? ''}`,
    side: `±${hilangStr}% TIDAK PERNAH KEMBALI`,
    sumber: vital('yudikatif-recovery')?.sumber,
    viz: { type: 'prop', w: `${KEMBALI}%`, cls: 'kembali' },
  },
  {
    slug: 'aparat',
    no: '04',
    nama: 'Aparat',
    anchor: 'aparat',
    ringkas: 'Anggaran terbesar di APBN; sebagian besar insiden berakhir di sidang etik.',
    apa: 'Polri dan TNI: alat paksa negara, dengan anggaran terbesar di APBN.',
    big: String(APARAT_KEKERASAN.jumlah),
    bigAccent: true,
    cap: `insiden kekerasan polisi setahun, ${APARAT_KEKERASAN.tewas} di antaranya berujung kematian`,
    side: 'SEBAGIAN BESAR BERAKHIR DI SIDANG ETIK, BUKAN PIDANA',
    sumber: `${APARAT_KEKERASAN.sumber} · imparsial`,
    viz: { type: 'prop', w: `${ETIK_PCT}%`, cls: 'etik' },
  },
  {
    slug: 'daerah',
    no: '05',
    nama: 'Daerah',
    anchor: 'daerah',
    ringkas: 'Jarak peluang lahir miskin antarprovinsi.',
    apa: '38 provinsi, ratusan pemda, plus otonomi khusus Aceh dan Papua.',
    big: `${kali}×`,
    cap: 'selisih peluang lahir miskin antara provinsi terendah dan tertinggi',
    sumber: 'tabel provinsi edisi ini (bps susenas) · (data contoh)',
    viz: {
      type: 'range',
      lo: `${pendekkan(terkaya.nama)} ${pct(terkaya.v)}`,
      hi: `${pendekkan(termiskin.nama)} ${pct(termiskin.v)}`,
      jarum: { min: terkaya.v, max: termiskin.v, nilai: nasionalMiskin, label: `NASIONAL ${pct(nasionalMiskin)}` },
    },
  },
];

export const getCabang = (slug: string): Cabang => CABANG.find((c) => c.slug === slug) ?? CABANG[0]!;
