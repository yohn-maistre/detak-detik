/**
 * Langit: the computed sky — ONE owner (satu fakta satu pemilik). Moon age
 * counts from the 2000-01-06 18:14 UTC reference new moon over the mean
 * synodic month; pure arithmetic, keyless, no ephemeris service. AlmanakSains
 * prints the numbers; RimbaHidup hangs the same moon over its flock. Both
 * import from here so the two moons can never disagree.
 */
export const SYN = 29.530588853;
const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

/** moon age in days since new, [0, SYN) */
export const umurBulan = () =>
  ((((Date.now() - NEW_MOON) / 86_400_000) % SYN) + SYN) % SYN;

export const FASE = [
  'bulan baru', 'sabit muda', 'paruh awal', 'cembung muda', 'purnama',
  'cembung tua', 'paruh akhir', 'sabit tua',
] as const;

/** phase fraction p in [0,1): 0 new → 0.5 full → 1 new */
export const faseP = (umur = umurBulan()) => umur / SYN;

export const namaFase = (p = faseP()) => FASE[Math.floor((p * 8 + 0.5) % 8)]!;

/** illuminated fraction as a percentage, 0 at new, 100 at full */
export const terangBulan = (p = faseP()) =>
  Math.round((1 - Math.cos(p * 2 * Math.PI)) * 50);

/**
 * The drawn moon: the lit region as an SVG path (also valid for Path2D).
 * One half-disc limb arc on the lit side plus the terminator ellipse whose
 * x-semi-axis shrinks with the phase; waxing lights the right limb.
 */
export function jalurTerang(p: number, R: number, C: number): string {
  const waxing = p < 0.5;
  const w = Math.abs(R * Math.cos(2 * Math.PI * p)); // terminator semi-axis
  const gibbous = waxing ? p > 0.25 : p < 0.75;
  const limbSweep = waxing ? 1 : 0;
  const termSweep = gibbous ? (waxing ? 0 : 1) : waxing ? 1 : 0;
  return [
    `M ${C} ${C - R}`,
    `A ${R} ${R} 0 0 ${limbSweep} ${C} ${C + R}`,
    `A ${w.toFixed(2)} ${R} 0 0 ${termSweep} ${C} ${C - R}`,
    'Z',
  ].join(' ');
}
