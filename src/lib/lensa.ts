/**
 * Lensa Daerah: one switch, national by default. Set a region and the
 * components that opt in re-render for that kabupaten/provinsi. Nothing is
 * geolocated; the reader (or Aksara) chooses. Stored in memory only.
 */
import { DAERAH } from './data/edisi';

export type Daerah = (typeof DAERAH)[number];

let current = 'nasional';
const subs = new Set<(kode: string) => void>();

export function getLensa(): string {
  return current;
}
export function getDaerah(kode = current): Daerah {
  return DAERAH.find((d) => d.kode === kode) ?? DAERAH[0]!;
}
export function setLensa(kode: string): void {
  if (!DAERAH.some((d) => d.kode === kode) || kode === current) return;
  current = kode;
  subs.forEach((fn) => fn(kode));
}
export function onLensa(fn: (kode: string) => void): () => void {
  subs.add(fn);
  return () => subs.delete(fn);
}
