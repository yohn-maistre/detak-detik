// Vendor Indonesia's largest NON-POWER industrial CO₂ emitters to a static asset
// for the map's "EMISI CO₂" transparency layer.
//
// Source: Climate TRACE v6 — independent, satellite-derived emissions inventory.
//   api.climatetrace.org/v6/assets?countries=IDN&sectors=<sector>
//   (open, no key, CC-BY). Coordinates live in Centroid.Geometry [lon,lat] (SRID 4326).
//
// Why NON-power: the power sector's top emitters ARE the coal plants already shown by
// the GEM "PLTU BATU BARA" layer (Suralaya, Paiton…). Keeping power made the CO₂ dots
// land exactly on the coal dots — same story twice. Excluding power lets this layer
// surface the OTHER heavy industry: steel, cement, mineral extraction, oil & gas ops.
//
// Why vendor (not live-fetch): the old client did a 4-way Promise.all on every load —
// flaky on low-end phones. A static, CDN-cached file is light and deterministic.
//
// Run: node scripts/build-emisi.mjs

import { writeFileSync } from 'node:fs';

const OUT = new URL('../public/data/idn-emisi.geojson', import.meta.url);
// Climate TRACE industrial sectors, power deliberately omitted (see header).
const SECTORS = ['manufacturing', 'mineral-extraction', 'fossil-fuel-operations'];
const TOP = 200; // keep the heaviest emitters; the long tail is noise on a national map

const sektorLabel = {
  manufacturing: 'manufacturing',
  'mineral-extraction': 'mineral-extraction',
  'fossil-fuel-operations': 'fossil-fuel-operations',
};

// Climate TRACE field-aggregate names arrive like "Indonesia_Central Sumatra_Conventional
// onshore" — strip the country prefix and turn underscores into readable separators.
const cleanName = (n) =>
  String(n ?? 'aset').replace(/^Indonesia[_ ]+/i, '').replace(/_+/g, ' · ').trim() || 'aset';

async function fetchSector(sector) {
  const u = `https://api.climatetrace.org/v6/assets?countries=IDN&sectors=${sector}&limit=2000`;
  const r = await fetch(u, { signal: AbortSignal.timeout(60000) });
  if (!r.ok) throw new Error(`Climate TRACE ${r.status} for ${sector}`);
  const d = await r.json();
  return (d.assets ?? []).map((a) => {
    const g = a.Centroid?.Geometry ?? [];
    // prefer the 100-yr CO₂-equivalent summary; fall back to the first with a quantity
    const summaries = a.EmissionsSummary ?? [];
    const es = summaries.find((s) => /co2e_100yr/i.test(String(s.Gas ?? ''))) ?? summaries[0] ?? {};
    return {
      lon: Number(g[0]),
      lat: Number(g[1]),
      co2: (Number(es.EmissionsQuantity) || 0) / 1e6, // tonnes → million tonnes/yr
      kapasitas: Number(es.Capacity) || 0,
      nama: cleanName(a.Name),
      jenis: a.AssetType ?? a.Sector ?? '',
      sektor: sektorLabel[sector] ?? sector,
      pemilik: a.Owners?.[0]?.CompanyName ?? '',
    };
  });
}

async function main() {
  const batches = await Promise.allSettled(SECTORS.map(fetchSector));
  const rows = [];
  batches.forEach((b, i) => {
    if (b.status === 'fulfilled') {
      console.log(`  ${SECTORS[i]}: ${b.value.length} assets`);
      rows.push(...b.value);
    } else {
      console.warn(`  ${SECTORS[i]}: FAILED — ${b.reason}`);
    }
  });

  const pts = rows
    .filter((p) => Number.isFinite(p.lon) && Number.isFinite(p.lat) && p.co2 > 0)
    .sort((a, b) => b.co2 - a.co2)
    .slice(0, TOP);

  const fc = {
    type: 'FeatureCollection',
    features: pts.map((p) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
      properties: {
        co2: Math.round(p.co2 * 100) / 100,
        kapasitas: Math.round(p.kapasitas),
        nama: p.nama,
        jenis: p.jenis,
        sektor: p.sektor,
        pemilik: p.pemilik,
      },
    })),
  };

  writeFileSync(OUT, JSON.stringify(fc));
  const top5 = pts.slice(0, 5).map((p) => `${p.nama} (${p.co2.toFixed(1)}Mt, ${p.sektor})`);
  console.log(`\nWrote ${fc.features.length} emitters → public/data/idn-emisi.geojson`);
  console.log('Top 5:', top5.join('; '));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
