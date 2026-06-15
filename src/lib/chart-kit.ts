/**
 * chart-kit: the small shared vocabulary the Pasar & Ekonomi charts draw on,
 * so the package reads as one hand. Engrave palette, id-ID number formatting,
 * and a couple of pure SVG-path helpers. Components own their own scales; this
 * is just the glue, and the later render target for Aksara's chart verb.
 */

export const idr = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
export const fmtNum = (n: number, d = 1) =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits: d, minimumFractionDigits: d }).format(n);
/** signed percent in id-ID form, e.g. -31,0% */
export const fmtPct = (n: number, d = 1) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${fmtNum(Math.abs(n), d)}%`;

/** warm dither ramp, paper → ember (shared with the map choropleth + PetaPiksel) */
export const EMBER: [number, number, number][] = [
  [232, 220, 187], [205, 154, 78], [205, 120, 40], [228, 74, 6], [150, 28, 10],
];
export function ramp(t: number, stops = EMBER): string {
  const p = Math.max(0, Math.min(1, t)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(p));
  const f = p - i, a = stops[i]!, b = stops[i + 1]!;
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * f)},${Math.round(a[1] + (b[1] - a[1]) * f)},${Math.round(a[2] + (b[2] - a[2]) * f)})`;
}

/** an SVG path string from already-projected points */
export const pathD = (pts: [number, number][]): string =>
  pts.map(([x, y], i) => `${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');

/** rebase a series so its first value is 100 (index comparison) */
export const rebase100 = (vals: number[]): number[] => vals.map((v) => (v / vals[0]!) * 100);
