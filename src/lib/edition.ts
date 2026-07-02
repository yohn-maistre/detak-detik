/**
 * edition: the runtime data layer. The site is built static with the
 * `(data contoh)` constants in src/lib/data/* as the offline fallback; at
 * runtime this fetches the live edition the newsroom published to the worker
 * (KV via GET /edisi) and hands it to whoever subscribes. Empty/unreachable →
 * subscribers keep their baked-in defaults, so the page is never broken and
 * the newsroom can publish by writing KV with no rebuild.
 */

export interface LiveTemuan { lens?: string; headline?: string; body?: string }
export interface LiveTicker { src: string; teks: string; url?: string }
export interface LiveAgenda { jam: string; teks: string; tag?: string }
export interface LiveMakro { label: string; nilai: string; pre?: string; acuan?: string; chip?: string; nada?: string }
export interface LiveKlipingItem { judul: string; url?: string; media: string; grup?: string; independen?: boolean }
export interface LiveKliping {
  id?: string;
  utama: LiveKlipingItem;
  liputan?: LiveKlipingItem[];
  n_media?: number;
  n_grup?: number;
  skor?: number;
  titik_buta?: boolean;
  meja?: string;
}
export interface LiveKlipingMeta { judul?: number; klaster?: number; gelap?: number; disusun?: string }
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
  harga?: number[];
  tajuk?: { teks: string; cited_ids?: string[] };
}

const AKSARA_URL = (import.meta.env.PUBLIC_AKSARA_URL as string | undefined)?.replace(/\/$/, '');

type Sub = (e: LiveEdisi | null) => void;
let live: LiveEdisi | null = null;
const subs = new Set<Sub>();
let started = false;

async function load(): Promise<void> {
  if (!AKSARA_URL) return;
  try {
    const res = await fetch(`${AKSARA_URL}/edisi`, { signal: AbortSignal.timeout(6000) });
    if (res.status === 200) {
      live = (await res.json()) as LiveEdisi;
      subs.forEach((fn) => fn(live));
    }
  } catch { /* the baked-in contoh stays; the chip says so */ }
}

/** Subscribe to the live edition. Fires immediately with the current value
 *  (null until loaded), then again once the live edition arrives. */
export function onEdisi(fn: Sub): () => void {
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
