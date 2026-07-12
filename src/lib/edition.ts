/**
 * edition: the runtime data layer. The site is built static with the
 * `(data contoh)` constants in src/lib/data/* as the offline fallback; at
 * runtime this fetches the live edition the newsroom published to the worker
 * (KV via GET /edisi) and hands it to whoever subscribes. Empty/unreachable →
 * subscribers keep their baked-in defaults, so the page is never broken and
 * the newsroom can publish by writing KV with no rebuild.
 */

export interface LiveTemuan { lens?: string; headline?: string; body?: string; temuan_id?: string }
export interface LiveTicker { src: string; teks: string; url?: string }
export interface LiveAgenda { jam: string; teks: string; tag?: string }
export interface LiveMakro { label: string; nilai: string; pre?: string; acuan?: string; chip?: string; nada?: string }
export interface LiveKlipingItem { judul: string; url?: string; media: string; grup?: string; independen?: boolean; ringkas?: string }
export interface LiveButir { teks: string; media?: string }
export interface LiveKliping {
  id?: string;
  utama: LiveKlipingItem;
  liputan?: LiveKlipingItem[];
  n_media?: number;
  n_grup?: number;
  skor?: number;
  titik_buta?: boolean;
  meja?: string;
  /** Lane C machine overview, fact-gated in the newsroom; absent = silence */
  sari?: string;
  /** gated key points, each crediting the clip that supports it */
  butir?: LiveButir[];
  /** any clip comes from an official state source (the RESMI marker) */
  resmi?: boolean;
  /** Lane A law mentions extracted from the cluster's verbatim headlines (§ row) */
  hukum?: string[];
  /** parties named in the cluster's verbatim headlines (registry alias match) */
  partai?: string[];
}
export interface LiveKlipingMeta { judul?: number; klaster?: number; gelap?: number; disusun?: string }
/** deep writeup (Act 3 pipeline): Lane C prose, fact-gated in the newsroom,
 *  labeled machine-written on the page; viz entries are raw specs validated
 *  client-side by lib/viz/spec.parseVizSpec — unparsable figures never draw */
export interface LiveTulisan {
  id: string;
  judul: string;
  teks: string;
  lane?: 'C';
  cited_ids?: string[];
  viz?: unknown[];
}
/** buku besar row: promise (Lane A, sourced) beside its measured figure;
 *  status recomputed mechanically by the janji desk each edition */
/** INGATAN REDAKSI (§13.16): the edition's memory block, computed
 *  mechanically from committed arsip records — BARU / BERKEMBANG / BERLALU
 *  story lines + plain-text meter deltas and promise status changes.
 *  Deterministic; every line traces to a published edition. */
export interface LiveIngatanCerita {
  status: 'BARU' | 'BERKEMBANG' | 'BERLALU';
  judul: string;
  sejak?: string;
  n_edisi?: number;
  terakhir?: string;
}
export interface LiveIngatan {
  jendela: number;
  cerita: LiveIngatanCerita[];
  angka?: string[];
  janji_berubah?: string[];
}
export interface LiveJanji {
  id?: string;
  teks: string;
  sumber: string;
  sumber_url?: string;
  target: string;
  target_angka?: number;
  tenggat?: string;
  arah?: 'naik' | 'turun';
  realisasi: string;
  realisasi_angka?: number;
  realisasi_sumber?: string;
  realisasi_tanggal?: string;
  status?: 'TERCAPAI' | 'BERJALAN' | 'TIDAK TERCAPAI' | 'DATA TIDAK TERSEDIA';
}
export interface LiveEdisi {
  edisi?: number;
  terbit?: string;
  sesi?: 'pagi' | 'petang';
  angka_edisi?: { nilai: number; prefix?: string; label: string; cited_ids?: string[] };
  lead?: string;
  dek?: string;
  ticker?: LiveTicker[];
  temuan?: LiveTemuan[];
  agenda?: LiveAgenda[];
  makro?: LiveMakro[];
  kliping?: LiveKliping[];
  kliping_meta?: LiveKlipingMeta;
  janji?: LiveJanji[];
  tulisan?: LiveTulisan[];
  ingatan?: LiveIngatan;
  harga?: number[];
  tajuk?: { teks: string; cited_ids?: string[] };
}

import BAKED_JSON from './data/edisi-baked.json';

const AKSARA_URL = (import.meta.env.PUBLIC_AKSARA_URL as string | undefined)?.replace(/\/$/, '');
const SIMPANAN = 'dd:edisi:v1';

/** the edition BAKED at deploy time (deploy.yml snapshots /edisi before the
 *  build): first paint is the real paper even when the worker host is
 *  unreachable from the reader's route; null in local/keyless builds */
export const BAKED = BAKED_JSON as unknown as LiveEdisi | null;

type Sub = (e: LiveEdisi | null) => void;
let live: LiveEdisi | null = BAKED;
const subs = new Set<Sub>();
let started = false;

/** Last edition snapshot from localStorage: the front paints instantly on a
 *  return visit, then the network copy replaces it (stale-while-revalidate).
 *  Local-first, device-only, and safe to lose. */
function ambilSimpanan(): LiveEdisi | null {
  try {
    const raw = localStorage.getItem(SIMPANAN);
    return raw ? (JSON.parse(raw) as LiveEdisi) : null;
  } catch { return null; }
}

async function load(): Promise<void> {
  if (!AKSARA_URL) return;
  try {
    const res = await fetch(`${AKSARA_URL}/edisi`, { signal: AbortSignal.timeout(6000) });
    if (res.status === 200) {
      live = (await res.json()) as LiveEdisi;
      subs.forEach((fn) => fn(live));
      try { localStorage.setItem(SIMPANAN, JSON.stringify(live)); } catch { /* full/blocked: fine */ }
    }
  } catch { /* the baked-in contoh (or the snapshot) stays; the chip says so */ }
}

/** Subscribe to the live edition. Fires immediately with the current value
 *  (the baked edition, upgraded by a NEWER stored snapshot if one exists,
 *  until the network answers), then again live. */
export function onEdisi(fn: Sub): () => void {
  if (!started && typeof localStorage !== 'undefined') {
    const simpanan = ambilSimpanan();
    if (simpanan && (!live || (simpanan.terbit ?? '') > (live.terbit ?? ''))) live = simpanan;
  }
  subs.add(fn);
  fn(live);
  if (!started) { started = true; void load(); }
  return () => subs.delete(fn);
}

export const getEdisi = (): LiveEdisi | null => live;

/** The live RSS headlines (worker /ticker, hourly cron). Null when unset/unreachable
 *  so callers keep their baked-in TICKER. */
export async function fetchTicker(): Promise<LiveTicker[] | null> {
  if (!AKSARA_URL) return null;
  try {
    const res = await fetch(`${AKSARA_URL}/ticker`, { signal: AbortSignal.timeout(6000) });
    if (res.status !== 200) return null;
    const d: unknown = await res.json();
    const arr = Array.isArray(d) ? d : (d as { items?: unknown[] }).items;
    if (!Array.isArray(arr) || !arr.length) return null;
    return arr
      .map((x) => x as Record<string, unknown>)
      .filter((x) => typeof x.teks === 'string')
      .map((x) => ({ src: String(x.src ?? ''), teks: String(x.teks), url: typeof x.url === 'string' ? x.url : undefined }));
  } catch { return null; }
}
