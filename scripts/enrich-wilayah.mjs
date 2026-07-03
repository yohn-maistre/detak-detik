/**
 * Enrich public/data/idn-wilayah.json with the sig.bps.go.id keyless crosswalk:
 * Kemendagri dotted code (`dagri`) + postal code (`pos`) per kabupaten.
 *
 * Sources (keyless, verified 2026-07-03):
 *   https://sig.bps.go.id/rest-bridging/getwilayah?level=kabupaten&parent={prov}
 *   https://sig.bps.go.id/rest-bridging-pos/getwilayah?level=kabupaten&parent={prov}
 *
 * CAVEAT: sig still serves the PRE-pemekaran 34-province scheme (old Papua
 * codes), while our registry is the new 38-province canon — so the join is
 * kode-first with a NAME fallback (norm on nama_bps) for the Papua six.
 * Rows that join nowhere keep their old fields untouched; misses are listed.
 *
 * Run: node scripts/enrich-wilayah.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SIG = 'https://sig.bps.go.id';
const SLEEP = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s ?? '').toLowerCase()
  .replace(/\bkepulauan\b|\bkep\.?\b/g, 'kep')
  .replace(/\badm(inistrasi)?\.?\b/g, '')
  .replace(/[^a-z0-9]/g, '');

async function ambil(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (r.ok) return await r.json();
    } catch { /* retry */ }
    await SLEEP(600 * (i + 1));
  }
  return null;
}

// sig's own province list (old 34-scheme parents to iterate)
const provs = await ambil(`${SIG}/rest-drop-down/getwilayah?level=provinsi&parent=0`);
if (!Array.isArray(provs) || !provs.length) throw new Error('sig province list unreachable');

const byKode = new Map();  // kode_bps -> { dagri, pos, nama }
const byNama = new Map();  // norm(nama_bps) -> same (fallback for renumbered Papua)
for (const p of provs) {
  const [bridge, pos] = await Promise.all([
    ambil(`${SIG}/rest-bridging/getwilayah?level=kabupaten&parent=${p.kode}`),
    ambil(`${SIG}/rest-bridging-pos/getwilayah?level=kabupaten&parent=${p.kode}`),
  ]);
  const posIdx = new Map((pos ?? []).map((r) => [r.kode_bps, r.kode_pos]));
  for (const r of bridge ?? []) {
    const row = { dagri: r.kode_dagri, pos: posIdx.get(r.kode_bps) ?? null, nama: r.nama_bps };
    byKode.set(r.kode_bps, row);
    const key = norm(r.nama_bps);
    // a name that repeats nationally is ambiguous — poison the fallback key
    byNama.set(key, byNama.has(key) ? null : row);
  }
  console.error(`prov ${p.kode} ${p.nama}: ${bridge?.length ?? 0} kab`);
  await SLEEP(150);
}

const path = join(ROOT, 'public/data/idn-wilayah.json');
const wilayah = JSON.parse(readFileSync(path, 'utf8'));
let kena = 0;
const luput = [];
for (const w of wilayah) {
  const hit = byKode.get(w.kode) ?? byNama.get(norm(w.nama)) ?? null;
  if (hit) { w.dagri = hit.dagri; if (hit.pos) w.pos = hit.pos; kena++; }
  else luput.push(`${w.kode} ${w.nama}`);
}
writeFileSync(path, JSON.stringify(wilayah));
console.error(`\nenriched ${kena}/${wilayah.length} rows (dagri + pos where sig has one)`);
if (luput.length) console.error(`no crosswalk match: ${luput.join(' | ')}`);
