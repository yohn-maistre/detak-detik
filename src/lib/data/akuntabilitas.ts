/**
 * Akuntabilitas: the accountability scoreboard behind each branch of power.
 * The point is a recurring, sourced reading of how each branch performs — not
 * how we frame it. Every figure carries its source and is sample (contoh)
 * until the newsroom wires the public feed; the shape is built to swap to live.
 *
 * Sources (curated, to be confirmed/refreshed by the newsroom desk):
 * - Eksekutif: Setpres/Kemensetneg via APBN (perjalanan dinas), peraturan.go.id
 *   (Perpres/PP), Jakarta Post (Danantara), Indikator/LSI (approval).
 * - Legislatif: dpr.go.id (Prolegnas), kompilasi redaksi (kehadiran), KPK (LHKPN).
 * - Yudikatif: KPK/Kejagung (pemulihan aset), MA/SIPP (clearance), Komisi Yudisial.
 * - Aparat: APBN (anggaran), KontraS/Imparsial (kekerasan, jabatan sipil).
 * - Daerah: DJPK Kemenkeu (PAD vs transfer, belanja pegawai), BPK (opini).
 */

export type Nada = 'buruk' | 'baik' | 'datar';

/** `live` on a tile replaces the "(data contoh)" tail with a real provenance
 *  tag — tiles flip one by one as their wiring lands, never all at once.
 *  Dumbbell points position on a 0–100 ruler; `teks` overrides the printed
 *  value and `maks` relabels the ruler's right end when v is a share. */
export type SkorTile =
  | { tipe: 'stat'; besar: string; label: string; sumber: string; nada?: Nada; sub?: string; live?: string }
  | { tipe: 'waffle'; isi: number; dari: number; label: string; sumber: string; nada?: Nada; live?: string }
  | { tipe: 'funnel'; langkah: { k: string; v: string; w: number }[]; label: string; sumber: string; live?: string }
  | { tipe: 'dumbbell'; a: { k: string; v: number; teks?: string }; b: { k: string; v: number; teks?: string }; satuan: string; maks?: string; label: string; sumber: string; live?: string };

/* ── Aparat: the documented record, one owner ─────────────────────────────
   Moved here from edisi.ts so the chapter band's 602, the funnel mouth, and
   the rincian rows in index.astro all derive from the same object. */
// figures follow the vital card's own receipts (Kemhan 187,1 tempo/antara ·
// Polri 145,6 angka RAPBN) so the parts sum EXACTLY to the vital's Rp 332,7 T
export const APARAT_ANGGARAN = [
  { k: 'TNI / Kemhan', v: 'Rp 187,1 T', t: 187.1 },
  { k: 'Polri', v: 'Rp 145,6 T', t: 145.6 },
];
export const APARAT_KEKERASAN = {
  jumlah: 602,
  tembak: 411,
  tewas: 10,
  periode: 'Jul 2024 – Jun 2025',
  sumber: 'kontras',
  impunitas:
    'Kasus terhadap perwira umumnya berakhir di sidang etik (demosi atau pemberhentian), bukan pidana. Dalam kematian Affan Kurniawan (rantis Brimob, 28 Agu 2025), perwira disanksi etik; warga sipil yang ditangkap diadili pidana.',
  perwiraSipil: 2569,
};
/** share of incidents ending in ethics tribunals rather than criminal court */
export const ETIK_PCT = 88;

const APARAT_TOTAL = APARAT_ANGGARAN.reduce((s, a) => s + a.t, 0);

export interface Skor {
  ringkas: string;
  tiles: SkorTile[];
}

export const SKOR: Record<string, Skor> = {
  eksekutif: {
    ringkas: 'Belanja, regulasi, dan keterbukaan laporan.',
    tiles: [
      { tipe: 'stat', besar: 'Rp 1,2 T', label: 'Belanja perjalanan dinas kepresidenan 2026', sumber: 'setpres · apbn', nada: 'buruk', sub: 'naik dari ±Rp 0,9 T (2025)' },
      { tipe: 'stat', besar: '247', label: 'Perpres & PP diterbitkan tahun ini', sumber: 'peraturan.go.id', nada: 'datar' },
      // Danantara "0" retired: KabinetWaffle's clock owns that absence.
      // Slot reserved for the live agenda tile (wave 9d): acara resmi
      // presiden bulan ini · setkab.go.id.
    ],
  },
  legislatif: {
    ringkas: 'Produk legislasi, kehadiran, dan kepatuhan lapor harta.',
    tiles: [
      { tipe: 'waffle', isi: 7, dari: 47, label: 'RUU disahkan dari target Prolegnas 2026, tahun berjalan (kartu vital di atas membaca tahun penuh terakhir)', sumber: 'dpr.go.id', nada: 'buruk' },
      { tipe: 'stat', besar: '62%', label: 'Kehadiran rata-rata rapat paripurna', sumber: 'kompilasi redaksi', nada: 'buruk' },
      { tipe: 'stat', besar: '84%', label: 'Anggota patuh lapor LHKPN', sumber: 'kpk', nada: 'datar' },
    ],
  },
  yudikatif: {
    ringkas: 'Pemulihan aset dan penyelesaian perkara.',
    tiles: [
      // recovery waffle retired: it restated (and contradicted, 13 vs 4,84)
      // the kartu vital's own reading one scroll up — the vital band owns it.
      // Slot reserved for the putusan-count tile (wave 9e, hukum_putusan).
      { tipe: 'stat', besar: '61%', label: 'Perkara selesai tepat waktu (clearance)', sumber: 'ma · sipp', nada: 'datar' },
      { tipe: 'stat', besar: '9', label: 'Hakim ditindak Komisi Yudisial tahun ini', sumber: 'komisi yudisial', nada: 'datar' },
    ],
  },
  aparat: {
    ringkas: 'Anggaran, insiden kekerasan, dan penyelesaiannya.',
    tiles: [
      { tipe: 'funnel', label: 'Dari insiden ke vonis', sumber: 'kontras · imparsial', langkah: [
        { k: 'Insiden kekerasan', v: String(APARAT_KEKERASAN.jumlah), w: 100 },
        { k: 'Berakhir di sidang etik', v: `${ETIK_PCT}%`, w: ETIK_PCT },
        { k: 'Masuk proses pidana', v: '9%', w: 9 },
        { k: 'Vonis bersalah', v: '3%', w: 3 },
      ] },
      // "Rp 332 T" stat retired (vital band owns the combined figure) — the
      // SPLIT is the cut this board alone carries, drawn as shares of it:
      {
        tipe: 'dumbbell',
        label: 'Anggaran 2026: dua pos terbesar APBN, dibagi dua institusi',
        sumber: 'apbn 2026',
        satuan: '%',
        maks: `100% = Rp ${APARAT_TOTAL.toLocaleString('id-ID', { maximumFractionDigits: 1 })} T`,
        a: { k: APARAT_ANGGARAN[0]!.k, v: Math.round((APARAT_ANGGARAN[0]!.t / APARAT_TOTAL) * 100), teks: APARAT_ANGGARAN[0]!.v },
        b: { k: APARAT_ANGGARAN[1]!.k, v: Math.round((APARAT_ANGGARAN[1]!.t / APARAT_TOTAL) * 100), teks: APARAT_ANGGARAN[1]!.v },
      },
      // perwira-sipil 2.569 retired here: the aparat-col rincian row in
      // index.astro is its single print (annotated underline).
    ],
  },
  daerah: {
    ringkas: 'Kemandirian fiskal dan kualitas laporan keuangan.',
    tiles: [
      { tipe: 'dumbbell', label: 'Sumber pendapatan daerah, rata-rata', sumber: 'djpk kemenkeu', satuan: '%', a: { k: 'PAD sendiri', v: 15 }, b: { k: 'Transfer pusat', v: 65 } },
      { tipe: 'stat', besar: '21 / 38', label: 'Provinsi beropini WTP dari BPK', sumber: 'bpk', nada: 'datar' },
      // 37% pegawai tile retired: KasDaerah's strip (real DJPK harvest) and
      // the kartu vital own that reading — this board keeps the other cuts.
    ],
  },
};
