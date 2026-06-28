// Build public/data/idn-wilayah.json — the BPS/Kemendagri join table that lets
// the map attach real statistics (capital, population, area) to every one of our
// 515 kabupaten/kota geojson features.
//
// Source: cahyadsn/wilayah (https://github.com/cahyadsn/wilayah),
//   db/wilayah_level_1_2.sql — official wilayah administratif per
//   Kepmendagri No 300.2.2-2138 Tahun 2025. That file carries, for every
//   province (level 1, 2-digit `kode`) and kabupaten/kota (level 2, `NN.NN`):
//   nama, ibukota (capital), lat, lng, luas (km²), penduduk (population).
//   Authoritative, citable, MIT-licensed. The ~23 MB heft is a `path` polygon
//   column we don't need — we stream the INSERT rows and grab only the first
//   nine scalar columns, never the geometry.
//
// CREATE TABLE column order (verified against the live file before parsing):
//   kode, nama, ibukota, lat, lng, elv, tz, luas, penduduk, path, status
//
// Why static: administrative codes + capitals are slow-moving reference data, so
// shipping them removes a runtime dependency. We emit ONE row per OUR geojson
// kab, joined by normalized (name, prov), so the table is guaranteed 1:1 with
// the map — the app can key statistics off `kode` with no fuzzy matching at run.
//
// Run: node scripts/build-wilayah.mjs

import { readFileSync, writeFileSync } from 'node:fs';

const SRC =
  'https://raw.githubusercontent.com/cahyadsn/wilayah/master/db/wilayah_level_1_2.sql';
const GEOJSON = new URL('../public/data/idn-kab.geojson', import.meta.url);
const OUT = new URL('../public/data/idn-wilayah.json', import.meta.url);

// Normalized name for joining: drop administrative prefixes, normalize the
// kep./kepulauan abbreviation, strip non-letters, lowercase.
// "Kabupaten Aceh Selatan" -> "acehselatan";
// "Kota Adm. Jakarta Barat" / "Kota Administrasi Jakarta Barat" -> "jakartabarat".
const normName = (s) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/\bkabupaten\b/g, '')
    .replace(/\bkota\b/g, '')
    .replace(/\bkab\.?\b/g, '')
    .replace(/\badm(?:inistrasi)?\.?\b/g, '') // "Adm." / "Administrasi"
    .replace(/\bkep\.?\b/g, 'kepulauan') // "Kep." -> "kepulauan"
    .replace(/[^a-z]/g, '');

// Hand-fixed aliases for names cahyadsn spells differently / our geojson got
// wrong. Keyed by OUR normalized name -> the cahyadsn normalized name.
const ALIAS = {
  padangsidempuan: 'padangsidimpuan', // ours vs cahyadsn spelling
  ogankomeringilir: 'ogankomering', // cahyadsn truncates the name (16.02)
};

// A "kota" (city) is signalled by a leading "Kota " token, not just the word
// appearing anywhere — "Lima Puluh Kota" is a *kabupaten* whose name contains
// "Kota". Apply to OUR geojson names (cahyadsn we key off the code suffix).
const isKotaName = (s) => /^kota\b/i.test(String(s ?? '').trim());

const num = (s) => {
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};
const round = (n, p) =>
  n === undefined ? undefined : Math.round(n * 10 ** p) / 10 ** p;

// --- 1. Fetch + stream-parse the cahyadsn SQL -------------------------------
const res = await fetch(SRC, { headers: { Accept: 'text/plain' } });
if (!res.ok) throw new Error(`cahyadsn wilayah ${res.status}`);
const sql = await res.text();

// Every VALUES row sits on its own line starting with ('<kode>',... . We capture
// the nine scalar columns up to (but not into) the `path` longtext, which is the
// next quoted '[[[...]]]' blob. Strings are single-quoted; numbers are bare.
// kode, nama, ibukota are quoted; lat,lng,elv,tz,luas,penduduk are numeric.
const ROW =
  /^\('([^']*)','([^']*)','([^']*)',\s*(-?[\d.]+|NULL),\s*(-?[\d.]+|NULL),\s*(-?[\d.]+|NULL),\s*(-?[\d.]+|NULL),\s*([\d.]+|NULL),\s*([\d.]+|NULL),/;

// Index cahyadsn rows two ways: prov-scoped (the precise join) and by name
// alone (a national fallback for kab whose PROVINCE code changed between our
// older geojson and Kepmendagri 2025 — chiefly the 2022 Papua six-province
// split, where e.g. our geojson puts Merauke in prov 95 but cahyadsn at 93.01).
const byKey = new Map(); // `${prov}|${norm}` -> record
const byName = new Map(); // `${norm}` -> record (null if ambiguous)
let level1 = 0;
let level2 = 0;

for (const line of sql.split('\n')) {
  if (line.charCodeAt(0) !== 0x28 /* '(' */) continue;
  const m = ROW.exec(line);
  if (!m) continue;
  const [, rawKode, nama, ibukota, lat, lng, , , luas, penduduk] = m;
  const kode = rawKode.replace(/\./g, '');
  if (kode.length === 2) {
    level1++;
    continue; // province — provides nothing we join on, skip
  }
  if (kode.length !== 4) continue; // only level-2 kab/kota (NN.NN -> 4 digits)
  level2++;
  const rec = {
    kode,
    nama,
    prov: kode.slice(0, 2),
    ibukota: ibukota || undefined,
    pop: num(penduduk),
    luas: round(num(luas), 1),
    lat: round(num(lat), 4),
    lon: round(num(lng), 4),
  };
  // Distinguish the regency from the city that share a name within one province
  // (e.g. Kabupaten Bogor 32.01 vs Kota Bogor 32.71). cahyadsn marks a kota with
  // a `.7x` code suffix; our geojson marks it with a "Kota" prefix.
  const isKota = kode[2] === '7' ? 1 : 0;
  const nn = normName(nama);
  byKey.set(`${rec.prov}|${isKota}|${nn}`, rec);
  // National fallback keyed by kota-vs-kabupaten + name, for kab whose province
  // code changed (the 2022 Papua split): e.g. Jayapura regency vs Kota Jayapura.
  const nk = `${isKota}|${nn}`;
  byName.set(nk, byName.has(nk) ? null : rec); // null marks an ambiguous name
}

console.log(
  `parsed cahyadsn: ${level1} provinces, ${level2} kab/kota (level-2) rows`,
);

// --- 2. Read OUR 515 geojson features (the join driver) ----------------------
const fc = JSON.parse(readFileSync(GEOJSON, 'utf8'));
const ours = (fc.features ?? []).map((f) => ({
  nama: f.properties?.nama,
  prov: String(f.properties?.prov ?? ''),
}));

// --- 3. Join: one output row per OUR kab, matched by (prov, normalized name) --
const rows = [];
const unmatched = [];
for (const k of ours) {
  const nn0 = normName(k.nama);
  const nn = ALIAS[nn0] ?? nn0;
  const isKota = isKotaName(k.nama) ? 1 : 0;
  // 1) precise (prov, kota, name) match; 2) national (kota, name) fallback,
  // for kab whose PROVINCE code changed (the 2022 Papua six-province split).
  const rec =
    byKey.get(`${k.prov}|${isKota}|${nn}`) ??
    byName.get(`${isKota}|${nn}`) ??
    undefined;
  if (rec) {
    // Keep OUR display name (matches the map), enrich with cahyadsn data + code.
    const out = { kode: rec.kode, nama: k.nama, prov: k.prov };
    if (rec.ibukota) out.ibukota = rec.ibukota;
    if (rec.pop !== undefined) out.pop = rec.pop;
    if (rec.luas !== undefined) out.luas = rec.luas;
    if (rec.lat !== undefined) out.lat = rec.lat;
    if (rec.lon !== undefined) out.lon = rec.lon;
    rows.push(out);
  } else {
    unmatched.push(`${k.nama} (prov ${k.prov})`);
    rows.push({ kode: null, nama: k.nama, prov: k.prov }); // keep 1:1 with map
  }
}

// Stable order: by prov then kode (nulls last within prov).
rows.sort(
  (a, b) =>
    a.prov.localeCompare(b.prov) ||
    String(a.kode ?? '~').localeCompare(String(b.kode ?? '~')),
);

// --- 4. Write compact (one object per line, like build-gunungapi.mjs) --------
writeFileSync(OUT, JSON.stringify(rows, null, 0).replace(/},/g, '},\n') + '\n');

const matched = rows.length - unmatched.length;
console.log(`wrote ${rows.length} rows → public/data/idn-wilayah.json`);
console.log(`  matched ${matched}/${ours.length} of our kab to a cahyadsn code`);
if (unmatched.length) {
  console.log(`  UNMATCHED (${unmatched.length}) — need hand-fixing:`);
  for (const u of unmatched) console.log(`    - ${u}`);
} else {
  console.log('  all kab matched — clean 1:1 join');
}
console.log('  sample rows:');
for (const r of rows.slice(0, 3)) console.log(`    ${JSON.stringify(r)}`);
