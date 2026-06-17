/**
 * edition: the runtime data layer. The site is built static with the
 * `(data contoh)` constants in src/lib/data/* as the offline fallback; at
 * runtime this fetches the live edition the newsroom published to the worker
 * (KV via GET /edisi) and hands it to whoever subscribes. Empty/unreachable →
 * subscribers keep their baked-in defaults, so the page is never broken and
 * the newsroom can publish by writing KV with no rebuild.
 */

export interface LiveTemuan { lens?: string; headline?: string; body?: string }
export interface LiveEdisi {
  edisi?: number;
  terbit?: string;
  sesi?: 'pagi' | 'petang';
  angka_edisi?: { nilai: number; label: string; cited_ids?: string[] };
  lead?: string;
  ticker?: { src: string; teks: string; url?: string }[];
  temuan?: LiveTemuan[];
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
