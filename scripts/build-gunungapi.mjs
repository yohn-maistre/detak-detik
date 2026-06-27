// Rebuild public/data/gunungapi-id.json — the bundled volcano registry the map
// renders even when MAGMA's (token-gated) live alert feed is unreachable.
//
// Source: Smithsonian Institution, Global Volcanism Program (GVP),
//   Volcanoes of the World (VOTW) Holocene list, via the public WFS:
//   https://webservices.volcano.si.edu/geoserver/GVP-VOTW/ows
//   filtered to Country='Indonesia'. Authoritative summit lat/lon + elevation,
//   primary type, and last-eruption year. Free, citable, the scientific canon.
//
// Why static: summit coordinates don't move, so shipping them removes any
// dependency on a flaky upstream for the *locations*. Only today's ALERT LEVEL
// is live (worker /geo/gunungapi, merged by name) — everything here defaults to
// level 1 (Normal) and is honestly labelled "DAFTAR / status menyusul" in the
// UI until a live level lands. Curated levels in the existing file are preserved.
//
// Run: node scripts/build-gunungapi.mjs

import { readFileSync, writeFileSync } from 'node:fs';

const OUT = new URL('../public/data/gunungapi-id.json', import.meta.url);
const WFS =
  'https://webservices.volcano.si.edu/geoserver/GVP-VOTW/ows' +
  '?service=WFS&version=2.0.0&request=GetFeature' +
  '&typeName=GVP-VOTW:Smithsonian_VOTW_Holocene_Volcanoes' +
  "&outputFormat=application/json&CQL_FILTER=Country='Indonesia'";

// GVP inverts names for sorting ("Telong, Bur ni"); restore natural order.
const deinvert = (s) => {
  const t = String(s ?? '').trim();
  const i = t.indexOf(', ');
  return i === -1 ? t : `${t.slice(i + 2)} ${t.slice(0, i)}`.replace(/\s+/g, ' ').trim();
};
const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z]/g, '');

// preserve any hand-curated levels from the file we're replacing
let curated = new Map();
try {
  const prev = JSON.parse(readFileSync(OUT, 'utf8'));
  for (const v of prev) if (Number(v.level) > 1) curated.set(norm(v.nama), Number(v.level));
} catch { /* first run — fine */ }

const res = await fetch(WFS, { headers: { Accept: 'application/json' } });
if (!res.ok) throw new Error(`GVP WFS ${res.status}`);
const fc = await res.json();

const rows = (fc.features ?? [])
  .map((f) => {
    const p = f.properties ?? {};
    const [lon, lat] = f.geometry?.coordinates ?? [];
    const nama = deinvert(p.Volcano_Name);
    const out = {
      nama,
      lon: Math.round(Number(lon) * 1e4) / 1e4,
      lat: Math.round(Number(lat) * 1e4) / 1e4,
      level: curated.get(norm(nama)) ?? 1,
    };
    if (Number.isFinite(Number(p.Elevation))) out.elev = Math.round(Number(p.Elevation));
    if (p.Primary_Volcano_Type) out.jenis = String(p.Primary_Volcano_Type).trim();
    const letus = Number(p.Last_Eruption_Year);
    if (Number.isFinite(letus)) out.letus = letus;
    return out;
  })
  .filter((v) => Number.isFinite(v.lon) && Number.isFinite(v.lat) && v.nama)
  .sort((a, b) => a.lon - b.lon); // west → east, a pleasing archipelago sweep

writeFileSync(OUT, JSON.stringify(rows, null, 0).replace(/},/g, '},\n') + '\n');
console.log(`wrote ${rows.length} volcanoes → public/data/gunungapi-id.json`);
console.log(`  carried over ${curated.size} curated level(s); ${rows.filter((r) => r.letus >= 2000).length} erupted since 2000`);
