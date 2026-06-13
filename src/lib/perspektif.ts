/**
 * The perspective archive registry: every piece is a permalink; the front
 * page only ever carries the edition's rotating selection. One sentence
 * per piece — if the juxtaposition needs two, it isn't ready.
 */
export interface Piece {
  slug: string;
  judul: string;
  satuKalimat: string;
  bentuk: string;
  sumber: string[];
}

export const PIECES: Piece[] = [
  {
    slug: 'republik-oligarki',
    judul: 'Republik Oligarki',
    satuKalimat: 'Rumah tangga terkaya menerima 50× lipat subsidi BBM dari yang termiskin — dari anggaran yang sama.',
    bentuk: 'Batang · wafel · asimetri',
    sumber: ['bank dunia · iep jun 2026', 'fwi/auriga 2025', 'celios 2026', 'pp 20/2026 · esdm'],
  },
  {
    slug: 'dua-garis-kemiskinan',
    judul: 'Dua Garis Kemiskinan',
    satuKalimat: 'Penduduk yang sama, dua definisi: 8,25% miskin menurut garis BPS — 68,3% menurut garis Bank Dunia.',
    bentuk: 'Plat titik · dua ambang',
    sumber: ['bps · sep 2025', 'bank dunia · $8,30/hari (ppp 2021)'],
  },
  {
    slug: 'garis-start-sama',
    judul: 'Garis Start Sama, Lomba Berbeda',
    satuKalimat: 'Tahun 2000 Indonesia dan Vietnam berdiri sejajar; hari ini buruh Vietnam dibayar ±70% lebih tinggi.',
    bentuk: 'Empat panel kecil · 2000–2025',
    sumber: ['world bank', 'oecd pisa 2022', 'bps · gso'],
  },
  {
    slug: 'pabrik-undang-undang',
    judul: 'Pabrik Undang-Undang',
    satuKalimat: 'Revisi UU Polri sah dalam 20 hari; RUU Perampasan Aset menunggu lebih dari tiga belas tahun.',
    bentuk: 'Batang waktu · skala log',
    sumber: ['dpr.go.id', 'kompilasi redaksi · verifikasi berlanjut'],
  },
];
