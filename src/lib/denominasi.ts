/**
 * Denominasi: one switch that re-prices every rupiah figure on the page.
 * Perspective is a unit, not an opinion — the same number reads differently
 * in nasi bungkus. Conversions carry their stated basis as a chip.
 */

export type Denom = 'rp' | 'pertamax' | 'mbg' | 'umphari' | 'starship';

export const DENOMS: Record<Denom, { label: string; per: number; satuan: string; basis: string }> = {
  rp: { label: 'RP', per: 1, satuan: '', basis: 'rupiah apa adanya' },
  pertamax: { label: 'PERTAMAX', per: 12_400, satuan: 'liter Pertamax', basis: 'mypertamina, Rp 12.400/liter' },
  mbg: { label: 'MBG', per: 15_000, satuan: 'porsi MBG', basis: 'pagu resmi Rp 15 rb/porsi' },
  umphari: { label: 'HARI UMP', per: 260_449, satuan: 'hari kerja UMP', basis: 'UMP DKI 2026 / 22 hari kerja' },
  // the scale-shock rung: one Starship launch ± US$100 jt (SpaceX, 2024) × kurs ± Rp 16.500
  starship: { label: 'STARSHIP', per: 1_650_000_000_000, satuan: 'peluncuran Starship', basis: '± US$100 jt/peluncuran × kurs' },
};

let current: Denom = 'rp';
const subs = new Set<(d: Denom) => void>();

export function getDenom(): Denom {
  return current;
}

export function setDenom(d: Denom): void {
  if (d === current) return;
  current = d;
  subs.forEach((fn) => fn(d));
}

export function onDenom(fn: (d: Denom) => void): () => void {
  subs.add(fn);
  return () => subs.delete(fn);
}

const fmtId = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });

/** Format a rupiah amount in the current denomination. */
export function formatUang(rupiah: number, denom: Denom = current): string {
  const d = DENOMS[denom];
  if (denom === 'rp') return `Rp ${fmtId.format(Math.round(rupiah))}`;
  const n = rupiah / d.per;
  // huge denominators (a Starship launch) deserve one decimal below ten
  if (n > 0 && n < 10) return `${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(n)} ${d.satuan}`;
  return `${fmtId.format(Math.round(n))} ${d.satuan}`;
}
