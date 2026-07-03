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
 *  tag — tiles flip one by one as their wiring lands, never all at once */
export type SkorTile =
  | { tipe: 'stat'; besar: string; label: string; sumber: string; nada?: Nada; sub?: string; live?: string }
  | { tipe: 'waffle'; isi: number; dari: number; label: string; sumber: string; nada?: Nada; live?: string }
  | { tipe: 'funnel'; langkah: { k: string; v: string; w: number }[]; label: string; sumber: string; live?: string }
  | { tipe: 'dumbbell'; a: { k: string; v: number }; b: { k: string; v: number }; satuan: string; label: string; sumber: string; live?: string };

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
      { tipe: 'stat', besar: '0', label: 'Laporan keuangan Danantara terbit', sumber: 'jakarta post', nada: 'buruk', sub: 'sejak peluncuran 24 feb 2025 · penghitung hari: Papan Angka' },
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
      { tipe: 'waffle', isi: 13, dari: 100, label: 'Kerugian korupsi yang kembali ke kas negara', sumber: 'kpk · kejagung', nada: 'buruk' },
      { tipe: 'stat', besar: '61%', label: 'Perkara selesai tepat waktu (clearance)', sumber: 'ma · sipp', nada: 'datar' },
      { tipe: 'stat', besar: '9', label: 'Hakim ditindak Komisi Yudisial tahun ini', sumber: 'komisi yudisial', nada: 'datar' },
    ],
  },
  aparat: {
    ringkas: 'Anggaran, insiden kekerasan, dan penyelesaiannya.',
    tiles: [
      { tipe: 'funnel', label: 'Dari insiden ke vonis', sumber: 'kontras · imparsial', langkah: [
        { k: 'Insiden kekerasan', v: '602', w: 100 },
        { k: 'Berakhir di sidang etik', v: '88%', w: 88 },
        { k: 'Masuk proses pidana', v: '9%', w: 9 },
        { k: 'Vonis bersalah', v: '3%', w: 3 },
      ] },
      { tipe: 'stat', besar: 'Rp 332 T', label: 'Anggaran Polri + TNI 2026', sumber: 'apbn', nada: 'buruk' },
      { tipe: 'stat', besar: '2.569', label: 'Perwira aktif menduduki jabatan sipil', sumber: 'imparsial', nada: 'buruk' },
    ],
  },
  daerah: {
    ringkas: 'Kemandirian fiskal dan kualitas laporan keuangan.',
    tiles: [
      { tipe: 'dumbbell', label: 'Sumber pendapatan daerah, rata-rata', sumber: 'djpk kemenkeu', satuan: '%', a: { k: 'PAD sendiri', v: 15 }, b: { k: 'Transfer pusat', v: 65 } },
      { tipe: 'stat', besar: '21 / 38', label: 'Provinsi beropini WTP dari BPK', sumber: 'bpk', nada: 'datar' },
      // real figure from our own DJPK harvest (scripts/fetch-apbd.mjs):
      // median pegawaiPct across all 546 reporting pemda, 2024 realisasi
      { tipe: 'stat', besar: '37%', label: 'Belanja pegawai dari APBD (median 546 pemda)', sumber: 'djpk kemenkeu', nada: 'buruk', live: 'realisasi 2024' },
    ],
  },
};
