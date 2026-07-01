// Vendor SPPG (Satuan Pelayanan Pemenuhan Gizi — the kitchen units of the Makan
// Bergizi Gratis / MBG free-meal program) to a static asset for the map.
//
// Source: sismonbgn.com — a third-party public monitor that embeds the full unit
//   list inline as `var rawData = [ {id_sppg, status_pengajuan, alamat, latitude,
//   longitude}, … ]`. Keyless, but NO CORS (data is inline HTML, not an API), so a
//   browser cannot read it directly → we fetch + parse at build time and vendor.
//
// HONESTY (Iron Law #1): this is a dated SNAPSHOT and mostly NOT operating — at
//   capture ~28 of ~5,600 are "Beroperasi", the rest are "Penentuan KA SPPG"
//   (earliest stage) or "Belum Beroperasi". The layer must label these as
//   terdaftar/diajukan (registered/proposed), never as an operating census.
//   Official BGN sources (operasional-sppg, gina.bgn.go.id) are WAF/login-walled.
//
// Run: node scripts/build-sppg.mjs

import { writeFileSync } from 'node:fs';

const SRC = 'https://sismonbgn.com/';
const OUT = new URL('../public/data/idn-sppg.geojson', import.meta.url);
const UA = 'Mozilla/5.0 (Linux; Android 12; SM-A125F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36';

// Extract the JSON array that follows `var rawData =` with a string-aware bracket
// scan (alamat fields can contain stray brackets/quotes, so a naive regex is unsafe).
function extractRawData(html) {
  const anchor = html.indexOf('var rawData');
  if (anchor < 0) throw new Error('var rawData not found');
  const start = html.indexOf('[', anchor);
  if (start < 0) throw new Error('array start not found');
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
    } else if (c === '"') inStr = true;
    else if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) return html.slice(start, i + 1); }
  }
  throw new Error('array end not found');
}

const round5 = (n) => Math.round(n * 1e5) / 1e5;

async function main() {
  const res = await fetch(SRC, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`sismonbgn ${res.status}`);
  const html = await res.text();
  const rows = JSON.parse(extractRawData(html));

  const status = {};
  const feats = [];
  for (const r of rows) {
    const lon = round5(Number(r.longitude));
    const lat = round5(Number(r.latitude));
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
    // clip to the archipelago bbox — a few rows carry 0,0 or junk coords
    if (lon < 94 || lon > 142 || lat < -12 || lat > 7) continue;
    const st = String(r.status_pengajuan ?? '').trim();
    status[st] = (status[st] ?? 0) + 1;
    feats.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lon, lat] },
      properties: { id: String(r.id_sppg ?? ''), status: st, alamat: String(r.alamat ?? '').replace(/\s+/g, ' ').trim() },
    });
  }

  const fc = { type: 'FeatureCollection', features: feats };
  writeFileSync(OUT, JSON.stringify(fc));
  console.log(`Wrote ${feats.length} SPPG → public/data/idn-sppg.geojson`);
  console.log('Status breakdown:', status);
}

main().catch((e) => { console.error(e); process.exit(1); });
