/**
 * DJPK APBD ingest → public/data/apbd.json (§13.12, the accountability engine's fuel).
 *
 * Sources (all keyless, verified 2026-07-03):
 *   - https://djpk.kemenkeu.go.id/portal/pemda/{prov}/{tahun}   pemda enumeration
 *     (DJPK's OWN 2-digit province scheme 01–38, NOT BPS codes)
 *   - https://djpk.kemenkeu.go.id/portal/csv_apbd?...           per-pemda budget tree
 *     (SpreadsheetML XML despite the name; Akun|Anggaran|Realisasi|Persentase)
 *
 * Joins DJPK pemda NAMES to the site's own registries (DAERAH provinces in
 * src/lib/data/edisi.ts + the 514-kab public/data/idn-wilayah.json) — the BPS
 * SIG bridging API was tried and rejected: it still speaks the pre-pemekaran
 * Papua scheme (parent=95/96 empty). Population pre-joins from idn-wilayah,
 * and the output carries FINISHED metrics (pegawai%, modal%, per-kapita,
 * ranks) so the client ships no arithmetic. Unmatched pemda are reported on
 * stderr and dropped — never guessed.
 *
 * Run: node scripts/fetch-apbd.mjs [tahun] [periode]   (default 2024 12)
 * Re-run monthly-ish; the output is a vendored snapshot, committed to git.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TAHUN = process.argv[2] ?? '2024';
const PERIODE = process.argv[3] ?? '12';
const DJPK = 'https://djpk.kemenkeu.go.id/portal';
const SLEEP = (ms) => new Promise((r) => setTimeout(r, ms));

async function ambil(url, coba = 3) {
  for (let i = 0; i < coba; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (res.ok) return await res.text();
      if (res.status >= 400 && res.status < 500) return null; // no point retrying
    } catch { /* retry */ }
    await SLEEP(800 * (i + 1));
  }
  return null;
}

/** SpreadsheetML → [[cell,…],…] (the format is flat enough for a regex pass) */
function bacaXls(xml) {
  const rows = [];
  for (const r of xml.matchAll(/<Row[^>]*>([\s\S]*?)<\/Row>/g)) {
    const cells = [...r[1].matchAll(/<Data[^>]*>([\s\S]*?)<\/Data>/g)].map((c) =>
      c[1].replace(/<[^>]+>/g, '').trim());
    if (cells.length) rows.push(cells);
  }
  return rows;
}

/** the four accounts we file; first occurrence wins (the tree repeats level-2 rows) */
const AKUN = { 'Pendapatan Daerah': 'd', 'Belanja Daerah': 'b', 'Belanja Pegawai': 'p', 'Belanja Modal': 'm' };
function bacaApbd(xml) {
  const out = {};
  for (const cells of bacaXls(xml)) {
    const key = AKUN[cells[0]];
    if (!key || out[key] !== undefined) continue;
    const angg = Number(cells[1]), real = Number(cells[2]);
    if (!Number.isFinite(real)) continue;
    out[key] = Math.round(real);
    out[key + 'A'] = Number.isFinite(angg) ? Math.round(angg) : null;
  }
  return out.b !== undefined ? out : null;
}

/** name normalization for the DJPK → site-registry join. Kota keeps its prefix
 *  (Kab. Bandung ≠ Kota Bandung); kab prefixes drop; known abbreviations expand
 *  the same way on both sides; spaces/punctuation die so Fak Fak = Fakfak. */
const norm = (s) => String(s ?? '').toLowerCase()
  .replace(/^provinsi\s+/, '')
  .replace(/^kab(upaten)?\.?\s*/, '')
  .replace(/\bdaerah istimewa\b/, 'di')
  .replace(/\bkepulauan\b|\bkep\.?\b/g, 'kep')
  .replace(/\bpeg\.?\b/g, 'pegunungan')
  .replace(/\badm(inistrasi)?\.?\b/g, '')
  .replace(/[^a-z0-9]/g, '');
/* DJPK still prints pre-rename and abbreviated names (verified against the
   2024 gagal log); map them onto the canon. Kota Pontianak is unaffected —
   its kota prefix survives norm, only the renamed KAB collides. */
const GANTI = new Map([
  ['bangkabelitung', 'kepbangkabelitung'],   // Provinsi Kep. Bangka Belitung
  ['tobasamosir', 'toba'],                   // renamed 2020
  ['pontianak', 'mempawah'],                 // kab renamed 2014
  ['sangihe', 'kepsangihe'],                 // Kepulauan Sangihe
  ['pangkajenekep', 'pangkajenedankep'],     // Pangkajene Dan Kepulauan
  ['malukutenggarabarat', 'keptanimbar'],    // renamed 2019
  ['okutimur', 'ogankomeringulutimur'],
  ['okuselatan', 'ogankomeringuluselatan'],
]);
const normDjpk = (s) => { const n = norm(s); return GANTI.get(n) ?? n; };

// ── 1. our own registries — the join targets (site canon, BPS new scheme) ──
const wilayah = JSON.parse(readFileSync(join(ROOT, 'public/data/idn-wilayah.json'), 'utf8'));
const popKab = new Map(wilayah.map((w) => [w.kode, w.pop]));
const popProv = new Map();
for (const w of wilayah) popProv.set(w.prov, (popProv.get(w.prov) ?? 0) + (w.pop ?? 0));
const kabIdx = new Map(); // `${provKode}|${norm(nama)}` -> kode (4-digit)
for (const w of wilayah) kabIdx.set(`${w.prov}|${norm(w.nama)}`, w.kode);
const namaProv = new Map(); // norm(province name) -> BPS 2-digit
const edisiTs = readFileSync(join(ROOT, 'src/lib/data/edisi.ts'), 'utf8');
for (const m of edisiTs.matchAll(/kode:\s*'(\d{2})',\s*nama:\s*'([^']+)'/g)) namaProv.set(norm(m[2]), m[1]);
console.error(`registries: ${namaProv.size} provinces, ${kabIdx.size} kab/kota`);

// ── 3. DJPK enumeration + per-pemda budgets ──
const baris = [];       // output rows
const gagal = [];       // honest failure list (names, never guessed)
const ulang = [];       // transient fetch failures, retried once after the sweep
for (let dp = 1; dp <= 38; dp++) {
  const dd = String(dp).padStart(2, '0');
  const enumT = await ambil(`${DJPK}/pemda/${dd}/${TAHUN}`);
  if (!enumT) { console.error(`  ! enumeration failed for DJPK prov ${dd}`); continue; }
  let daftar;
  try { daftar = JSON.parse(enumT); } catch { console.error(`  ! bad JSON for prov ${dd}`); continue; }

  // pemda 00 is the province government itself — its name anchors the whole
  // province to our BPS kode; every kab join is then scoped inside it
  const provKode = namaProv.get(normDjpk(daftar['00'] ?? '')) ?? null;
  if (!provKode) {
    console.error(`  ! province unjoined: ${daftar['00']}`);
    gagal.push(...Object.entries(daftar).filter(([k]) => k !== '--').map(([, n]) => n));
    continue;
  }

  const tugas = Object.entries(daftar).filter(([k]) => k !== '--');
  for (const [pemda, nama] of tugas) {
    const t = await ambil(`${DJPK}/csv_apbd?type=apbd&periode=${PERIODE}&tahun=${TAHUN}&provinsi=${dd}&pemda=${pemda}`);
    const akun = t && bacaApbd(t);
    if (!akun) { ulang.push({ dd, pemda, nama, provKode }); continue; }
    const kode = pemda === '00' ? provKode : (kabIdx.get(`${provKode}|${normDjpk(nama)}`) ?? null);
    if (!kode) { gagal.push(nama); continue; }
    const pop = pemda === '00' ? popProv.get(kode) : popKab.get(kode);
    baris.push({ kode, nama, ...akun, pop: pop ?? null });
    await SLEEP(120);
  }
  console.error(`prov ${dd} → ${daftar['00']} [${provKode}]: ${tugas.length} pemda → total ${baris.length}`);
}

// ── 3b. retry pass: gov infra drops requests in bursts; one calmer second
//        sweep recovers them (a name that failed to JOIN is not retried) ──
if (ulang.length) {
  console.error(`retry pass: ${ulang.length} transient failures …`);
  for (const u of ulang) {
    await SLEEP(600);
    const t = await ambil(`${DJPK}/csv_apbd?type=apbd&periode=${PERIODE}&tahun=${TAHUN}&provinsi=${u.dd}&pemda=${u.pemda}`, 4);
    const akun = t && bacaApbd(t);
    if (!akun) { gagal.push(u.nama); continue; }
    const kode = u.pemda === '00' ? u.provKode : (kabIdx.get(`${u.provKode}|${normDjpk(u.nama)}`) ?? null);
    if (!kode) { gagal.push(u.nama); continue; }
    const pop = u.pemda === '00' ? popProv.get(kode) : popKab.get(kode);
    baris.push({ kode, nama: u.nama, ...akun, pop: pop ?? null });
  }
}

// ── 4. finished metrics + ranks (province tier /38, kab tier /514) ──
const metrik = (r) => ({
  pegawaiPct: r.b ? +(100 * r.p / r.b).toFixed(1) : null,
  modalPct: r.b ? +(100 * r.m / r.b).toFixed(1) : null,
  perKapita: r.pop ? Math.round(r.b / r.pop) : null,
});
for (const r of baris) Object.assign(r, metrik(r));
const tier = { prov: baris.filter((r) => r.kode.length === 2), kab: baris.filter((r) => r.kode.length === 4) };
for (const rows of Object.values(tier)) {
  for (const key of ['pegawaiPct', 'modalPct', 'perKapita']) {
    const urut = rows.filter((r) => r[key] != null).sort((a, b) => b[key] - a[key]);
    urut.forEach((r, i) => { r[`rank_${key}`] = i + 1; });
  }
}
// the national line: aggregate of everything reported (weighted, not an average of %)
const agg = (rows, k) => rows.reduce((s, r) => s + (r[k] ?? 0), 0);
const nas = {
  pegawaiPct: +(100 * agg(baris, 'p') / agg(baris, 'b')).toFixed(1),
  modalPct: +(100 * agg(baris, 'm') / agg(baris, 'b')).toFixed(1),
  perKapita: Math.round(agg(tier.kab, 'b') / agg(tier.kab, 'pop')),
};

const out = {
  sumber: 'DJPK Kemenkeu · portal data APBD (realisasi)', tahun: Number(TAHUN), periode: Number(PERIODE),
  diambil: new Date().toISOString().slice(0, 10),
  nasional: nas, nProv: tier.prov.length, nKab: tier.kab.length,
  baris,
};
writeFileSync(join(ROOT, 'public/data/apbd.json'), JSON.stringify(out));
console.error(`\nwrote public/data/apbd.json — ${tier.prov.length} prov + ${tier.kab.length} kab/kota, tahun ${TAHUN} p${PERIODE}`);
if (gagal.length) console.error(`unjoined/failed (dropped, never guessed): ${gagal.join(' | ')}`);
