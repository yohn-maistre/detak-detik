// Vendor Indonesia's mining concessions (IUP/WIUP) to a simplified static asset
// for the map's "TAMBANG" transparency layer.
//
// Source: Kementerian ESDM, Ditjen Minerba — ESDM Geoportal open ArcGIS service
//   geoportal.esdm.go.id/gis1/.../Join_WIUP_vs_IPPKH/MapServer/0
//   (open, no token, CORS-enabled, WGS84). 4,797 permit polygons nationally.
//
// Why vendor (not live-fetch): 4,797 polygons is heavy for low-end phones to pull
// every load; a generalised static asset is CDN-cached and light. We thin geometry
// server-side (maxAllowableOffset) and keep only the transparency-relevant fields:
// commodity, company, activity, area, province/regency, Clean-&-Clear status.
//
// Run: node scripts/build-tambang.mjs

import { writeFileSync } from 'node:fs';

const BASE =
  'https://geoportal.esdm.go.id/gis1/rest/services/Join_WIUP_vs_IPPKH/MapServer/0/query';
const OUT = new URL('../public/data/idn-tambang.geojson', import.meta.url);
const FIELDS = ['komoditas', 'nama_usaha', 'kegiatan', 'luas_sk', 'nama_prov', 'nama_kab', 'cnc'];

// commodity → coarse group, so the map can colour by a handful of buckets
const GROUP = (k) => {
  const s = String(k ?? '').toUpperCase();
  if (s.includes('BATUBARA')) return 'batubara';
  if (/NIKEL|NICKEL/.test(s)) return 'nikel';
  if (/EMAS|GOLD|PERAK/.test(s)) return 'emas';
  if (/TEMBAGA|COPPER/.test(s)) return 'tembaga';
  if (/BAUKSIT|TIMAH|MANGAN|BIJIH BESI|PASIR BESI|SENG|TIMBAL/.test(s)) return 'logam';
  return 'lain';
};

async function page(offset) {
  const u = `${BASE}?where=1%3D1&outFields=${FIELDS.join(',')}&returnGeometry=true` +
    `&maxAllowableOffset=0.005&geometryPrecision=3&outSR=4326&f=geojson` +
    `&resultOffset=${offset}&resultRecordCount=2000`;
  const r = await fetch(u, { headers: { Accept: 'application/geo+json' }, signal: AbortSignal.timeout(60000) });
  if (!r.ok) throw new Error(`ESDM ${r.status} @offset ${offset}`);
  const d = await r.json();
  return d.features ?? [];
}

const feats = [];
for (let off = 0; off < 8000; off += 2000) {
  const got = await page(off);
  if (!got.length) break;
  feats.push(...got);
  console.log(`  fetched ${got.length} @offset ${off} (total ${feats.length})`);
  if (got.length < 2000) break;
}

// keep props lean + add the colour group; round area
const out = feats
  .filter((f) => f.geometry && f.geometry.coordinates?.length)
  .map((f) => {
    const p = f.properties ?? {};
    return {
      type: 'Feature',
      geometry: f.geometry,
      properties: {
        komoditas: p.komoditas ?? '', grup: GROUP(p.komoditas),
        usaha: p.nama_usaha ?? '', kegiatan: p.kegiatan ?? '',
        luas: Math.round(Number(p.luas_sk) || 0), prov: p.nama_prov ?? '',
        kab: p.nama_kab ?? '', cnc: p.cnc ?? '',
      },
    };
  });

writeFileSync(OUT, JSON.stringify({ type: 'FeatureCollection', features: out }));
const byGroup = out.reduce((m, f) => ((m[f.properties.grup] = (m[f.properties.grup] || 0) + 1), m), {});
console.log(`wrote ${out.length} concessions → public/data/idn-tambang.geojson`);
console.log('  by group:', JSON.stringify(byGroup));
