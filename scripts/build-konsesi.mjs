// Vendor Indonesia's forest & plantation CONCESSION polygons to a static asset,
// from the government original (KLHK / Ministry of Environment & Forestry) served
// openly through BIG SatuPeta PUBLIC. Companion to the mining layer (build-tambang.mjs).
//
// Why here, not GFW: the GFW oil-palm/wood-fiber/logging datasets are licensed
//   "CC BY 4.0 EXCLUDING Indonesia" — the IDN features are carved out of the open
//   grant. BIG SatuPeta serves the same government source under Kebijakan Satu Peta
//   (open), keyless + CORS, and generalizes server-side (no heavy local processing).
//
// Source: https://kspservices.big.go.id/satupeta/rest/services/PUBLIK/{SERVICE}/MapServer/{id}
//   f=geojson, outSR=4326, maxAllowableOffset=0.005 + geometryPrecision=3 (server-side
//   generalization), maxRecordCount=1000. License: Kebijakan Satu Peta / Satu Data.
//
// Coverage honesty (Iron Law #1): LOGGING (IUPHHK-HA, 255) + HTI (IUPHHK-HT, 292) are
//   nationwide + attributed. SAWIT has no nationwide attributed layer in the open
//   services — only per-kabupaten Izin Usaha sublayers (~493, select provinces), so the
//   sawit layer is PARTIAL coverage and must be labelled as such.
//
// Run: node scripts/build-konsesi.mjs

import { writeFileSync } from 'node:fs';

const BASE = 'https://kspservices.big.go.id/satupeta/rest/services/PUBLIK';
const OUT = new URL('../public/data/idn-konsesi.geojson', import.meta.url);

// jenis-tagged sources. sawit is per-kabupaten only (no nationwide attributed layer
// in the open services) — the Izin Usaha (business permit) + Izin Lokasi (siting
// permit) leaf sublayers, tagged precisely by `izin` so a siting permit is never
// presented as an operating concession.
const SOURCES = [
  { service: 'PERIZINAN_DAN_PERTANAHAN', id: 1, jenis: 'logging' }, // IUPHHKHA (nationwide)
  { service: 'PERIZINAN_DAN_PERTANAHAN', id: 2, jenis: 'hti' },     // IUPHHKHTI (nationwide)
  ...[51, 52, 53, 54, 55, 56, 57].map((id) => ({ service: 'PERIZINAN_DAN_PERTANAHAN', id, jenis: 'sawit', izin: 'usaha' })),
  ...Array.from({ length: 22 }, (_, i) => 28 + i).map((id) => ({ service: 'PERIZINAN_DAN_PERTANAHAN', id, jenis: 'sawit', izin: 'lokasi' })),
];

// BIG injects Z (and M) into rings → coords arrive as [lng, lat, 0, null]. Strip to [lng, lat].
function stripZM(c) {
  return typeof c[0] === 'number' ? [c[0], c[1]] : c.map(stripZM);
}

// three schemas (forestry / sawit izin-usaha / sawit izin-lokasi), three date formats,
// blank fields are whitespace not empty → trim-then-fallback everywhere.
const clean = (s) => { const t = String(s ?? '').replace(/\s+/g, ' ').trim(); return t && t !== '-' ? t : ''; };
// Indonesian number string "11.768,1989 Ha" → 11768.1989
const parseLuasStr = (s) => {
  const m = String(s ?? '').replace(/[^\d.,]/g, '');
  if (!m) return 0;
  const n = Number(m.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};
// year from epoch-ms (forestry) OR a text date "31 Oktober 2016" (sawit)
const yearOf = (v) => {
  if (v == null || v === '') return 0;
  const num = Number(v);
  if (Number.isFinite(num) && num > 1e11) return new Date(num).getFullYear();
  const m = String(v).match(/(19|20)\d{2}/);
  return m ? Number(m[0]) : 0;
};
function normProps(p, src) {
  const nama = clean(p.nama_prsh) || clean(p.namobj) || clean(p.nama);
  const luasNum = Number(p.luas_ha ?? p.lssk ?? 0) || 0;
  const luas = Math.round(luasNum || parseLuasStr(p.luas_sk_iu ?? p.luas_sk_il ?? p.luas_sk));
  const sk = clean(p.no_sk) || clean(p.nmr_sk_iup) || clean(p.nmr_sk_il);
  const grup = clean(p.grp_usaha);
  const status = clean(p.status);
  const tahun = yearOf(p.tgl_sk ?? p.tgl_sk_iup ?? p.tgl_sk_il);
  return {
    jenis: src.jenis,
    ...(nama ? { nama } : {}),
    ...(luas ? { luas } : {}),
    ...(src.izin ? { izin: src.izin } : {}),
    ...(status ? { status } : {}),
    ...(sk ? { sk } : {}),
    ...(grup ? { grup } : {}),
    ...(tahun > 1980 && tahun < 2035 ? { tahun } : {}),
  };
}

async function fetchLayer(src) {
  const feats = [];
  let off = 0;
  for (;;) {
    const url = `${BASE}/${src.service}/MapServer/${src.id}/query?where=1%3D1&outFields=*`
      + `&maxAllowableOffset=0.005&geometryPrecision=3&outSR=4326`
      + `&resultOffset=${off}&resultRecordCount=1000&f=geojson`;
    let d;
    try {
      const r = await fetch(url, { headers: { Accept: 'application/geo+json' }, signal: AbortSignal.timeout(60000) });
      if (!r.ok) { console.warn(`  ${src.service}/${src.id} (${src.jenis}): HTTP ${r.status} — skip`); break; }
      d = await r.json();
    } catch (e) { console.warn(`  ${src.service}/${src.id} (${src.jenis}): ${e.message} — skip`); break; }
    const fs = d.features ?? [];
    for (const f of fs) {
      if (!f.geometry?.coordinates) continue;
      feats.push({
        type: 'Feature',
        geometry: { type: f.geometry.type, coordinates: stripZM(f.geometry.coordinates) },
        properties: normProps(f.properties ?? {}, src),
      });
    }
    if (fs.length < 1000) break;
    off += 1000;
    await new Promise((r) => setTimeout(r, 250)); // polite throttle
  }
  return feats;
}

async function main() {
  const all = [];
  const tally = {};
  for (const src of SOURCES) {
    const fs = await fetchLayer(src);
    if (fs.length) { all.push(...fs); tally[src.jenis] = (tally[src.jenis] ?? 0) + fs.length; }
    await new Promise((r) => setTimeout(r, 250));
  }
  const fc = { type: 'FeatureCollection', features: all };
  writeFileSync(OUT, JSON.stringify(fc));
  console.log(`\nWrote ${all.length} concessions → public/data/idn-konsesi.geojson`);
  console.log('By jenis:', tally);
}

main().catch((e) => { console.error(e); process.exit(1); });
