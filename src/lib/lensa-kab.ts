/**
 * Lensa Wilayah, kabupaten tier: the regency a map click drills into, read
 * inside its province. The map holds the wilayah table, so it computes the
 * payload (the regency's figures + its province aggregates) and sets this; the
 * LensaWilayah panel consumes it and renders the filing. Cleared when the
 * province lens itself changes (see lensa.ts). Memory-only, no geolocation —
 * the reader, a click, or a tour chooses.
 */
export type LensaKab = {
  kode: string;
  nama: string;
  prov: string; // province kode (matches the active lensa)
  ibukota?: string;
  pop?: number;
  luas?: number;
  lat?: number;
  lon?: number;
  // province aggregates, so the panel can show the regency as a share of its whole
  provPop?: number;
  provLuas?: number;
  nKab?: number;
  rankPop?: number; // 1 = most populous regency in the province
  rankPad?: number; // 1 = densest regency in the province
};

let current: LensaKab | null = null;
const subs = new Set<(k: LensaKab | null) => void>();

export function getLensaKab(): LensaKab | null {
  return current;
}
export function setLensaKab(k: LensaKab | null): void {
  current = k;
  subs.forEach((fn) => fn(k));
}
export function onLensaKab(fn: (k: LensaKab | null) => void): () => void {
  subs.add(fn);
  return () => subs.delete(fn);
}
