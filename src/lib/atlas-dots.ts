/**
 * atlas-dots: the accurate dot-archipelago, shared by every plate that needs
 * the real coastline (PetaAtlas, SukuLokasi, future locator stamps). The BIG
 * Rupabumi province polygons are rasterized ONCE per grid size to an offscreen
 * canvas with the province index encoded in the red channel; consumers read a
 * Uint8Array of cells (0 = sea, n = province n-1) and draw dots however their
 * register wants. Loading is memoized per grid size so multiple islands on the
 * same page share one fetch and one rasterization.
 */

export const LON0 = 94.5;
export const LON1 = 141.5;
export const LAT0 = 6.5;
export const LAT1 = -11.5;

export type ProvInfo = { kode: string; nama: string };
export type AtlasGrid = { cols: number; rows: number; cells: Uint8Array; provs: ProvInfo[] };

type GeoFeature = { properties: ProvInfo; geometry: { type: string; coordinates: unknown } };

const cache = new Map<string, Promise<AtlasGrid>>();
let geoCache: Promise<GeoFeature[]> | null = null;

function loadGeo(): Promise<GeoFeature[]> {
  if (!geoCache) {
    geoCache = fetch('/data/idn-prov.geojson', { signal: AbortSignal.timeout(12000) })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<{ features: GeoFeature[] }>;
      })
      .then((gj) => gj.features);
    geoCache.catch(() => { geoCache = null; }); // let a later consumer retry
  }
  return geoCache;
}

function rasterize(features: GeoFeature[], cols: number, rows: number): AtlasGrid {
  const off = document.createElement('canvas');
  off.width = cols;
  off.height = rows;
  const ctx = off.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('ctx');
  features.forEach((f, i) => {
    ctx.fillStyle = `rgb(${i + 1},0,0)`;
    const polys = (f.geometry.type === 'Polygon'
      ? [f.geometry.coordinates]
      : f.geometry.coordinates) as number[][][][];
    ctx.beginPath();
    for (const poly of polys) {
      for (const ring of poly) {
        ring.forEach((pt, k) => {
          const x = ((pt[0]! - LON0) / (LON1 - LON0)) * cols;
          const y = ((LAT0 - pt[1]!) / (LAT0 - LAT1)) * rows;
          if (k === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
      }
    }
    ctx.fill('evenodd');
  });
  const px = ctx.getImageData(0, 0, cols, rows).data;
  const cells = new Uint8Array(cols * rows);
  for (let i = 0; i < cells.length; i++) cells[i] = px[i * 4 + 3]! > 0 ? px[i * 4]! : 0;
  return { cols, rows, cells, provs: features.map((f) => f.properties) };
}

export function loadAtlasGrid(cols = 188, rows = 72): Promise<AtlasGrid> {
  const key = `${cols}x${rows}`;
  let p = cache.get(key);
  if (!p) {
    p = loadGeo().then((features) => rasterize(features, cols, rows));
    p.catch(() => { cache.delete(key); });
    cache.set(key, p);
  }
  return p;
}

/** lon/lat to fractional cell coordinates on a grid. */
export function lonLatToCellF(lon: number, lat: number, cols: number, rows: number): [number, number] {
  return [((lon - LON0) / (LON1 - LON0)) * cols, ((LAT0 - lat) / (LAT0 - LAT1)) * rows];
}
