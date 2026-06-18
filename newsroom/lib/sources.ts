/**
 * Fresh artifacts for the desks — keyless, public signals each turned into a
 * corpus row (id -> numbers) the fact-gate can check a finding against, plus
 * the RSS headlines for the ticker. Any dark source is simply absent; never a
 * crash (a Data Hilang note, not an error).
 */
import type { CorpusRow } from './schemas';

const IDN = { w: 94.5, s: -11.3, e: 141.2, n: 6.3 };

export interface Sinyal {
  corpus: CorpusRow[];
  headlines: { src: string; teks: string; url: string }[];
}

export async function gatherSignals(aksaraUrl?: string): Promise<Sinyal> {
  const corpus: CorpusRow[] = [];
  let headlines: { src: string; teks: string; url: string }[] = [];

  // USGS quakes, last 24h, clipped to the Indonesian bbox (keyless GeoJSON)
  try {
    const r = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson', { signal: AbortSignal.timeout(8000) });
    const d = (await r.json()) as { features?: { properties?: { mag?: number; place?: string }; geometry?: { coordinates?: number[] } }[] };
    const feats = (d.features ?? []).filter((f) => {
      const c = f.geometry?.coordinates;
      return c && c[0]! >= IDN.w && c[0]! <= IDN.e && c[1]! >= IDN.s && c[1]! <= IDN.n;
    });
    if (feats.length) {
      const biggest = feats.reduce((a, b) => ((b.properties?.mag ?? 0) > (a.properties?.mag ?? 0) ? b : a));
      corpus.push({
        id: 'gempa:harian',
        nilai: { jumlah: feats.length, magnitudo_tertinggi: Math.round((biggest.properties?.mag ?? 0) * 10) / 10 },
      });
    }
  } catch { /* dark source */ }

  // USD/IDR (Frankfurter, keyless + CORS)
  try {
    const r = await fetch('https://api.frankfurter.dev/v1/latest?base=USD&symbols=IDR', { signal: AbortSignal.timeout(8000) });
    const d = (await r.json()) as { rates?: { IDR?: number } };
    if (d.rates?.IDR) corpus.push({ id: 'kurs:usdidr', nilai: { kurs: Math.round(d.rates.IDR) } });
  } catch { /* dark source */ }

  // headlines via the worker /ticker (already RSS-aggregated, keyless)
  if (aksaraUrl) {
    try {
      const r = await fetch(`${aksaraUrl.replace(/\/$/, '')}/ticker`, { signal: AbortSignal.timeout(8000) });
      const d: unknown = await r.json();
      const arr = Array.isArray(d) ? d : [];
      headlines = arr
        .filter((x): x is Record<string, unknown> => Boolean(x) && typeof (x as Record<string, unknown>).teks === 'string')
        .slice(0, 6)
        .map((x) => ({ src: String(x.src ?? ''), teks: String(x.teks), url: String(x.url ?? '') }));
    } catch { /* dark source */ }
  }

  return { corpus, headlines };
}
