/**
 * PARTAI enrichment: current governors per party from Wikidata (CC0) →
 * newsroom/data/partai_gubernur.json (wave 9g, PARTAI & KEPENTINGAN v1).
 *
 * Query: holders of positions that are P279 (subclass of) governor Q132050
 * in Indonesia Q252, statement has NO end date and a start date >= 2025-01-01
 * (the serentak inauguration wave) — strictness beats coverage: rows without
 * a start qualifier are EXCLUDED rather than guessed, and the output prints
 * its own coverage honestly ("terdata n dari 38"). A person whose P102
 * carries multiple parties is counted under "afiliasi ganda tercatat",
 * never resolved by guesswork (Wikidata P102 without qualifiers is history,
 * not current membership).
 *
 * Party labels match registry rows via nama/singkat/alias phrases; unmatched
 * parties (e.g. partai lokal Aceh) keep their label under `lainnya`.
 *
 * Run: node scripts/fetch-partai.mjs   (re-runnable; vendored snapshot,
 * committed to git — refresh after pilkada/pelantikan news)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REG = JSON.parse(readFileSync(join(ROOT, 'newsroom/data/partai_registry.json'), 'utf-8'));
const OUT = join(ROOT, 'newsroom/data/partai_gubernur.json');
const UA = 'detak-detik/1.0 (koran sipil; github.com/yohn-maistre/detak-detik)';

const QUERY = `
SELECT ?p ?pLabel ?posLabel ?partyLabel ?mulai WHERE {
  ?pos wdt:P279 wd:Q132050 ; wdt:P17 wd:Q252 .
  ?p p:P39 ?st . ?st ps:P39 ?pos .
  FILTER NOT EXISTS { ?st pq:P582 ?akhir }
  ?st pq:P580 ?mulai .
  FILTER(?mulai >= "2025-01-01T00:00:00Z"^^xsd:dateTime)
  OPTIONAL { ?p wdt:P102 ?party }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "id,en" }
}`;

const url = 'https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(QUERY);
const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json' } });
if (!res.ok) throw new Error(`SPARQL ${res.status}`);
const rows = (await res.json()).results.bindings;

// group statement rows by person+position (multi-P102 → several rows)
const orang = new Map();
for (const b of rows) {
  const k = `${b.p.value}|${b.posLabel.value}`;
  const o = orang.get(k) ?? {
    nama: b.pLabel.value,
    posisi: b.posLabel.value,
    mulai: b.mulai.value.slice(0, 10),
    partai: new Set(),
  };
  if (b.partyLabel?.value) o.partai.add(b.partyLabel.value);
  orang.set(k, o);
}

// match a Wikidata party label to a registry id via nama/singkat/alias
const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N} ]+/gu, ' ').replace(/\s+/g, ' ').trim();
const matchers = REG.partai.map((p) => ({
  id: p.id,
  frasa: [p.nama, p.singkat, ...(p.alias ?? [])].map(norm),
}));
function cocok(label) {
  const l = ` ${norm(label)} `;
  for (const m of matchers) {
    if (m.frasa.some((f) => f && l.includes(` ${f} `))) return m.id;
  }
  return null;
}

const gubernur = [];
const perPartai = {};
const lainnya = {};
let ganda = 0;
let tanpa = 0;
for (const o of [...orang.values()].sort((a, b) => a.posisi.localeCompare(b.posisi))) {
  const parties = [...o.partai];
  const row = { nama: o.nama, posisi: o.posisi, mulai: o.mulai, partai: parties };
  gubernur.push(row);
  if (parties.length === 0) { tanpa += 1; continue; }
  if (parties.length > 1) { ganda += 1; continue; } // documented ambiguity, never resolved by guess
  const id = cocok(parties[0]);
  if (id) perPartai[id] = (perPartai[id] ?? 0) + 1;
  else lainnya[parties[0]] = (lainnya[parties[0]] ?? 0) + 1;
}

const payload = {
  _catatan:
    'Gubernur menjabat per partai — Wikidata (CC0), kueri: jabatan subclass gubernur di Indonesia, ' +
    'tanpa tanggal akhir, mulai >= 2025-01-01. Cakupan TIDAK lengkap; halaman mencetak "terdata n dari 38". ' +
    'P102 ganda dihitung sebagai afiliasi ganda, tidak pernah ditebak. Snapshot vendored; ' +
    'segarkan dengan `node scripts/fetch-partai.mjs`.',
  _sumber: ['https://query.wikidata.org/ (CC0)'],
  diambil: new Date().toISOString().slice(0, 19) + 'Z',
  terdata: gubernur.length,
  dari: 38,
  per_partai: perPartai,
  lainnya,
  afiliasi_ganda: ganda,
  tanpa_partai_terdata: tanpa,
  gubernur,
};
writeFileSync(OUT, JSON.stringify(payload, null, 1) + '\n', 'utf-8');
console.log(`gubernur terdata: ${gubernur.length}/38 · per partai:`, perPartai, '· lainnya:', lainnya, `· ganda: ${ganda} · tanpa: ${tanpa}`);
