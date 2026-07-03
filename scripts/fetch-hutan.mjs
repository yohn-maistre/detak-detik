#!/usr/bin/env node
/**
 * Harvest: deforestation series from the GFW Data API (keyless download
 * route, CORS *). Hansen/UMD annual tree-cover loss for Indonesia,
 * national + per province + the inside-concession split, plus the
 * near-real-time integrated-alerts pulse. Writes public/data/hutan.json;
 * the site imports it like apbd.json (client stays dumb).
 *
 * Endpoints verified 2026-07-03 (docs/research/2026-07-03-alam-endpoint-
 * cookbook.md). Threshold: canopy density 30% (GFW dashboard default).
 *
 * ADMIN MAPPING (AUTHORITATIVE, pulled 2026-07-03 from the API's own
 * gadm_administrative_boundaries table, adm_level=1): 34 gids. GADM
 * retired gid 15 when Kalimantan Timur split — Kaltim is now IDN.34 and
 * Kalimantan Utara IDN.35 (own row, no merge needed). The four 2022
 * Papua provinces do NOT exist in this vintage: they read inside Papua
 * (23) / Papua Barat (22) — the `gabung` table resolves modern kodes.
 * NOTE the non-alphabetical quirk: IDN.18 = Maluku UTARA, IDN.19 =
 * Maluku (do not "fix" this — it is what the boundaries table says).
 *
 * ALERT PULSE CAVEAT: integrated alerts are UPGRADED to high confidence
 * as follow-up imagery confirms, so the most recent weeks are
 * systematically undercounted (June days read 30–1.600 while April days
 * read >1 jt). The pulse window therefore ends 30 days before harvest;
 * printing the raw tail would fake a collapse.
 *
 * Run: node scripts/fetch-hutan.mjs
 */
import { writeFileSync } from 'node:fs';

const API = 'https://data-api.globalforestwatch.org/dataset';
const TCL = `${API}/gadm__tcl__adm1_change/latest/download/csv`;
const ALERT = `${API}/gadm__integrated_alerts__adm2_daily_alerts/latest/download/csv`;

// GFW adm1 (gadm_administrative_boundaries, gid_1 numeric part) →
// our 2-digit Kemendagri kode + display name.
const PROV = {
  1: ['11', 'Aceh'], 2: ['51', 'Bali'], 3: ['19', 'Kep. Bangka Belitung'],
  4: ['36', 'Banten'], 5: ['17', 'Bengkulu'], 6: ['75', 'Gorontalo'],
  7: ['31', 'DKI Jakarta'], 8: ['15', 'Jambi'], 9: ['32', 'Jawa Barat'],
  10: ['33', 'Jawa Tengah'], 11: ['35', 'Jawa Timur'], 12: ['61', 'Kalimantan Barat'],
  13: ['63', 'Kalimantan Selatan'], 14: ['62', 'Kalimantan Tengah'],
  16: ['21', 'Kep. Riau'], 17: ['18', 'Lampung'],
  18: ['82', 'Maluku Utara'], 19: ['81', 'Maluku'], 20: ['52', 'Nusa Tenggara Barat'],
  21: ['53', 'Nusa Tenggara Timur'], 22: ['92', 'Papua Barat'], 23: ['91', 'Papua'],
  24: ['14', 'Riau'], 25: ['76', 'Sulawesi Barat'], 26: ['73', 'Sulawesi Selatan'],
  27: ['72', 'Sulawesi Tengah'], 28: ['74', 'Sulawesi Tenggara'],
  29: ['71', 'Sulawesi Utara'], 30: ['13', 'Sumatera Barat'],
  31: ['16', 'Sumatera Selatan'], 32: ['12', 'Sumatera Utara'], 33: ['34', 'DI Yogyakarta'],
  34: ['64', 'Kalimantan Timur'], 35: ['65', 'Kalimantan Utara'],
};
// modern kode → the GADM-vintage kode its figures live inside (printed as a caveat)
const GABUNG = { 93: '91', 94: '91', 95: '91', 96: '92' };

const T = 30; // canopy threshold %

async function csv(base, sql, coba = 3) {
  const url = `${base}?sql=${encodeURIComponent(sql)}`;
  for (let i = 0; i < coba; i++) {
    try {
      const r = await fetch(url, { redirect: 'follow' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const teks = await r.text();
      // CRLF line ends: strip \r or the last column's KEY becomes "ha\r"
      const [head, ...baris] = teks.trim().split('\n').map((l) => l.replace(/\r$/, ''));
      const kolom = head.split(',').map((k) => k.replaceAll('"', ''));
      return baris.filter(Boolean).map((b) => {
        const v = b.split(',').map((x) => x.replaceAll('"', ''));
        return Object.fromEntries(kolom.map((k, j) => [k, v[j]]));
      });
    } catch (e) {
      if (i === coba - 1) throw e;
      console.error(`  ulang (${e.message}) …`);
      await new Promise((s) => setTimeout(s, 4000 * (i + 1)));
    }
  }
}

const bulat = (x) => Math.round(Number(x));

console.error('1/4 nasional per tahun …');
const nas = await csv(TCL, `SELECT umd_tree_cover_loss__year AS thn, SUM(umd_tree_cover_loss__ha) AS ha FROM data WHERE iso='IDN' AND umd_tree_cover_density_2000__threshold=${T} GROUP BY umd_tree_cover_loss__year ORDER BY thn`);

console.error('2/4 pecahan konsesi per tahun …');
const kombo = await csv(TCL, `SELECT umd_tree_cover_loss__year AS thn, is__gfw_oil_palm AS sawit, is__gfw_wood_fiber AS kayu, is__gfw_managed_forests AS tebang, SUM(umd_tree_cover_loss__ha) AS ha FROM data WHERE iso='IDN' AND umd_tree_cover_density_2000__threshold=${T} GROUP BY umd_tree_cover_loss__year, is__gfw_oil_palm, is__gfw_wood_fiber, is__gfw_managed_forests`);
const konsesiThn = {};
for (const k of kombo) {
  const dalam = k.sawit === 'True' || k.kayu === 'True' || k.tebang === 'True';
  if (dalam) konsesiThn[k.thn] = (konsesiThn[k.thn] ?? 0) + Number(k.ha);
}

console.error('3/4 per provinsi per tahun …');
const perProv = await csv(TCL, `SELECT adm1, umd_tree_cover_loss__year AS thn, SUM(umd_tree_cover_loss__ha) AS ha FROM data WHERE iso='IDN' AND umd_tree_cover_density_2000__threshold=${T} GROUP BY adm1, umd_tree_cover_loss__year ORDER BY adm1, thn`);

console.error('4/4 denyut peringatan (keyakinan tinggi; ekor 30 hari dibuang) …');
let pulse = [];
try {
  const alert = await csv(ALERT, `SELECT gfw_integrated_alerts__date AS tgl, SUM(alert__count) AS n, SUM(alert_area__ha) AS ha FROM data WHERE iso='IDN' AND gfw_integrated_alerts__confidence='high' GROUP BY gfw_integrated_alerts__date ORDER BY tgl DESC LIMIT 130`);
  // recent alerts have not finished their confidence upgrades yet: drop the
  // provisional 30-day tail, keep the 90 confirmed days before it
  const batasTgl = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  pulse = alert
    .filter((a) => a.tgl <= batasTgl)
    .slice(0, 90)
    .map((a) => ({ tgl: a.tgl, n: Number(a.n), ha: Math.round(Number(a.ha) * 10) / 10 }))
    .reverse();
} catch (e) {
  console.error(`  denyut gagal (${e.message}) — lanjut tanpa pulse`);
}

const nasional = nas
  .filter((r) => Number(r.thn) >= 2001)
  .map((r) => ({ thn: Number(r.thn), ha: bulat(r.ha), konsesiHa: bulat(konsesiThn[r.thn] ?? 0) }))
  .sort((a, b) => a.thn - b.thn);

const prov = {};
for (const r of perProv) {
  const p = PROV[Number(r.adm1)];
  if (!p || Number(r.thn) < 2001) continue;
  const [kode, nama] = p;
  (prov[kode] ??= { nama, seri: [] }).seri.push({ thn: Number(r.thn), ha: bulat(r.ha) });
}
for (const k of Object.keys(prov)) prov[k].seri.sort((a, b) => a.thn - b.thn);

const out = {
  sumber: 'Hansen/UMD via Global Forest Watch',
  atribusi: 'Hansen/UMD/Google/USGS/NASA · Global Forest Watch · CC BY 4.0',
  metode: `kehilangan tutupan pohon, kerapatan tajuk ≥${T}%; konsesi = sawit/serat kayu/tebangan (bendera GFW)`,
  batas: 'batas provinsi GADM pra-2012: Kaltara terbaca dalam Kaltim; provinsi pemekaran Papua 2022 terbaca dalam Papua / Papua Barat',
  diambil: new Date().toISOString().slice(0, 10),
  gabung: GABUNG,
  nasional,
  prov,
  pulse,
};

writeFileSync(new URL('../public/data/hutan.json', import.meta.url), JSON.stringify(out));
const akhir = nasional.at(-1);
console.error(`OK → public/data/hutan.json · ${nasional.length} thn nasional · ${Object.keys(prov).length} prov · ${pulse.length} hari pulse`);
console.error(`   ${akhir.thn}: ${akhir.ha.toLocaleString('id-ID')} ha (${Math.round((akhir.konsesiHa / akhir.ha) * 100)}% dalam konsesi)`);
