// One-time, idempotent patch for public/data/idn-prov.geojson.
//
// Source: denyherianto/indonesia-geojson-topojson-maps-with-38-provinces
//   (GeoJSON/indonesia-38-provinces.geojson, CC-BY 4.0).
// Two problems it fixes, so the map can join cleanly to DAERAH in edisi.ts:
//   1. Every free 38-province set ships the six Papua provinces with
//      collided/non-standard codes (four share "91", two share "92").
//   2. The raw features carry KODE_PROV but not the `kode`/`nama` props the
//      map layers (PetaKabar) and the DAERAH rows join on.
//
// Non-Papua codes (11..82) already match DAERAH, so we trust KODE_PROV there
// and override Papua by province name. Run: node scripts/patch-prov-geojson.mjs

import { readFileSync, writeFileSync } from 'node:fs';

const FILE = new URL('../public/data/idn-prov.geojson', import.meta.url);

// Papua province name -> the code DAERAH uses (NOT canonical BPS; the app's own scheme).
const PAPUA = {
  'Papua Barat': '91',
  'Papua Barat Daya': '92',
  'Papua': '94',
  'Papua Selatan': '95',
  'Papua Tengah': '96',
  'Papua Pegunungan': '97',
};

// The 38 codes DAERAH defines; the patched set must match this exactly.
const EXPECTED = new Set([
  '11','12','13','14','15','16','17','18','19','21','31','32','33','34','35','36',
  '51','52','53','61','62','63','64','65','71','72','73','74','75','76','81','82',
  '91','92','94','95','96','97',
]);

const gj = JSON.parse(readFileSync(FILE, 'utf8'));
const seen = new Set();

for (const f of gj.features) {
  const nama = f.properties.PROVINSI;
  const kode = PAPUA[nama] ?? String(f.properties.KODE_PROV);
  if (seen.has(kode)) throw new Error(`duplicate code ${kode} (${nama})`);
  seen.add(kode);
  // lean, join-ready properties; keep a numeric feature id for feature-state
  f.id = Number(kode);
  f.properties = { kode, nama };
}

const missing = [...EXPECTED].filter((c) => !seen.has(c));
const extra = [...seen].filter((c) => !EXPECTED.has(c));
if (missing.length || extra.length) {
  throw new Error(`code set mismatch — missing: ${missing} · extra: ${extra}`);
}

writeFileSync(FILE, JSON.stringify(gj));
console.log(`patched ${gj.features.length} provinces · all codes unique and matched to DAERAH`);
