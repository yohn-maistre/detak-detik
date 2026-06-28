# Data + RSS source hunt — health, Satu Peta, independent news, proxies (verified 2026-06-28)

Three read-only scout agents probed these live (curl/WebFetch; real HTTP status, content-type, CORS).
This extends `docs/research/2026-06-27-civic-data-sources.md` (extraction/ESDM, forest/BIG/GFW, BPS).

> **Two source ledgers must both stay in sync when we wire anything** (see end of file):
> the internal `docs/DATA_SOURCES.md` **and the public page `src/pages/sumber.astro`** (the
> reader-facing "receipts drawer" with LANGSUNG/CONTOH/SEGERA status). An out-of-date `sumber.astro`
> mislabels the paper's own honesty.

## A · Independent news RSS (Lane A — verbatim, never model-touched)
Center-to-center-left / editorial / independent. **No state-owned** (Antara/RRI excluded). Verified
returning valid XML:

| Outlet | Feed | Beat | Lang |
|---|---|---|---|
| BBC News Indonesia | `bbc.com/indonesia/index.xml` | politik/dunia | id |
| CNN Indonesia | `cnnindonesia.com/rss` | breaking | id |
| Mongabay Indonesia | `mongabay.co.id/feed` | lingkungan (investigasi) | id |
| Mongabay Global | `news.mongabay.com/feed` | lingkungan dunia | en |
| Katadata | `katadata.co.id/rss` | ekonomi/data | id |
| The Conversation ID | `theconversation.com/id/articles.atom` | akademik/opini | id |
| Konde.co | `konde.co/feed` | gender/keadilan | id |
| Magdalene | `magdalene.co/feed` | budaya/perempuan | id |
| Suara Papua | `suarapapua.com/feed` | Papua/adat | id |
| Floresa | `floresa.co/feed` | NTT/daerah | id |
| The Guardian (World) | `theguardian.com/world/rss` | dunia (investigasi) | en |
| NASA | `nasa.gov/feed` | sains/iklim | en |

**Retry via the worker with a realistic browser UA** (403 from datacenter IP / UA block, Yose wants
these): **Tempo, Tirto.id, Jubi.id, Kompas, Project Multatuli, KBR, Remotivi, Narasi**. Also probe:
BenarNews, Tempo English, Katadata Green, National Geographic.

**Grouping taxonomy = by BEAT** (recommended over by-outlet, for the front-page newsstand): Politik &
Hukum · Lingkungan & Konservasi · Ekonomi & Data · Budaya, Gender & Sosial · Daerah & Otonomi ·
Akademik & Opini · Sains & Dunia.

## B · Health / kesehatan
- **OSM Overpass** — `gall.openstreetmap.de/api/interpreter` (POST, CORS `*`, ODbL). `amenity~hospital|clinic` + `puskesmas`. ~250+ nodes, sparse + Java-heavy → label honestly "data OSM, cakupan bervariasi". Rate-limited (2 slots), 60s timeout, use bbox. **The wireable option.**
- Fallback: **Healthsites.io v2** (`healthsites.io/api/v2/facilities?country=ID`, CC-BY); v3 needs a token.
- **Not viable:** BIG `BANGUNANDANFASUM` (agency-incomplete), Kemenkes SatuSehat / SISDMK / Satu Data Kesehatan (datacenter-IP blocked, token/FHIR-walled).

## C · BIG Satu Peta — the big untapped layer inventory
`kspservices.big.go.id/satupeta/rest/services/PUBLIK/{service}/MapServer/{id}/query?f=geojson` —
**open, CORS (reflects origin), WGS84**, paginate `resultRecordCount=2000`. **7 services / 368 layers:**
- `BATAS_WILAYAH` (22) — admin + maritime boundaries
- `KEHUTANAN` (15) — forest zones, permits, erosion
- `PERENCANAAN_RUANG` (173) — spatial planning, KSN
- `PERIZINAN_DAN_PERTANAHAN` (61) — mining/forestry permits by province
- `SUMBER_DAYA_ALAM_DAN_LINGKUNGAN` (61) — **gambut/peatland (layer 6 = 146 polys)**, land cover, geology, hazards (volcano/quake/tsunami/landslide/flood)
- `KAWASAN_KHUSUS_DAN_TRANSMIGRASI` (8) — SEZ, transmigrasi, industry, slums, vital sites
- `SARANA_PRASARANA` (48) — ports, airports, railways, power, roads, water, waste, markets, fuel, warehouses, irrigation

## D · ESDM geoportal (re-confirm: I verified mining 4,797 + CORS earlier; one scout saw a transient 404)
Open, CORS, WGS84 GeoJSON: mining `gis1/Join_WIUP_vs_IPPKH/MapServer/0` (4,797), oil-gas
`gis3/DMEW/Wilayah_Kerja_Migas_Konvensional/MapServer/0` (215), power `gis5/Sebaran_Pembangkit_Listrik/MapServer/0`
(3,588). `gis2`/MOMI/`/arcgis/` token-walled. GFW concessions via `/download/csv` (key-free, worker).

## E · Insightful proxies (mostly harder — defer most)
Wireable: ESDM power fleet, GFW concessions, BIG peatland, BPS WebAPI (free email key; **WAF blocks
datacenter IPs + low-quality UA**), World Bank (CORS `*`, national only → SEA peer comparisons).
**Device/internet ownership** (BPS SUSENAS/PODES → digital-divide choropleth; needs key) is the best
"quirky" pick. Harder (PDF/WAF/scrape): APJII internet, Dapodik schools, Spotify Charts (HTML widget,
CSV ~403), filmindonesia (403), Kemenag religion, WHO tobacco. `data.go.id` CKAN is dead (Next.js).

## F · Recurring gotchas
- **WAF / datacenter-IP blocks** hit BPS, Kemenkes, Dapodik, PUPR, KKP, BNPB portals — need a real
  browser UA and often a non-flagged IP. The worker (also datacenter) may still be blocked → prefer
  vendoring at build time or accept browser-direct where CORS allows.
- **No-CORS but open**: GFW (CloudFront) → worker proxy. **Open + CORS**: ESDM, BIG SatuPeta, Climate
  TRACE, Overpass → browser-direct.
- `data.go.id` and several ministry CKANs are deprecated/migrated — don't wire.

---

## Keeping the two source ledgers in sync (STANDING RULE)
Whenever a data source is added, changed, or flips CONTOH→LANGSUNG:
1. **`src/pages/sumber.astro`** — the PUBLIC receipts drawer (`SUMBER` array: nama/url/dipakai/metode/status).
   Readers see the LANGSUNG/CONTOH/SEGERA labels; keep them truthful. **Currently behind** — missing the
   shipped layers (ESDM mining/tambang, GVP volcanoes, Climate TRACE CO₂ cross-sector, OpenSky planes,
   AISStream ships, GEM coal, cahyadsn wilayah) and several CONTOH rows are now live. Bring it current
   as part of Phase 0/3.
2. **`docs/DATA_SOURCES.md`** — the internal catalog (endpoints, licenses, gotchas).
3. This research note + `docs/PLAN_LOG.md` changelog.

---

## G · Mandum Rimba + SPPG (scout round 2, verified 2026-06-28)

### Mandum Rimba — `mandumrimba.org`
Independent non-profit **deforestation & environmental-accountability observatory** for Indonesia
(Next.js/Vercel, id/en; AGPL-3.0; Aceh-origin — "mandum rimba" ≈ "all the wilderness"; contact
Threads `@r.rasyidi`). Repo **not yet public** ("tautan repositori akan muncul begitu siap"), so we
can't read their build — but their **`/sumber-data` page is a vetted primary-source manifest** we can
shop from.
- **★ WIRE NOW (clean, browser-direct):** `https://www.mandumrimba.org/data/species-distribution.geojson`
  — keyless, **CORS `*`**, **227 KB**, **151 polygons** of IUCN-classified threatened-species ranges
  (classes aves/mammalia/reptilia/amphibia; each feature carries `[species, IUCN-code]` lists + a date
  range). Drop-in MapLibre `geojson` source, **no proxy**. Credit Mandum Rimba + GBIF/IUCN/ESA.
- **Shopping list from `/sumber-data` (fetch from the PRIMARY source, not via Mandum):**
  - **GFW concessions** — sawit (1,855) / HTI-pulp (295) / logging (259), **CC BY 4.0**, Greenpeace-
    derived via GFW Open Data Portal / ArcGIS Hub. *The prize: a clean keyless concessions polygon set.*
  - **Maus et al. 2022 global mining footprints** — **CC BY 4.0**, PANGAEA `doi.org/10.1594/PANGAEA.942325`,
    static redistributable download → vendor a clipped IDN subset.
  - GADM 4.1 admin boundaries — **non-commercial** license (watch-out; we already have BIG boundaries).
  - Walled / skip browser-direct: WDPA Protected Planet (registration), KLHK PIPPIB/MOMI, IUCN polygon
    ranges, GFW near-real-time alerts (keyed/tiled).
- **Their export API** `api.mandumrimba.org/v1/export?dataset={alerts|disasters|forest-loss}` — **no CORS**;
  `alerts`/`forest-loss` return empty placeholders; `disasters` is a real 3.5 MB BNPB/DesInventar CSV but
  go upstream to **UNDRR DesInventar** (`desinventar.net/.../idn`) instead. `species/concessions/mining`
  are NOT exposed via the API (400) — only the static species geojson above is hostable by us directly.

### SPPG — Makan Bergizi Gratis kitchens (Badan Gizi Nasional)
**SPPG = Satuan Pelayanan Pemenuhan Gizi**, the kitchen units of the MBG free-meal program.
- **WIRE via thin worker-proxy:** `sismonbgn.com` — a third-party Leaflet monitor embedding **~5,600 SPPG
  points** as an inline `var rawData=[…]` array (`id_sppg`, `status_pengajuan`, full `alamat`,
  `latitude`, `longitude`) + a per-province totals array at `/statistik`. **Keyless but NO CORS** (data
  is inline HTML, not an API) → worker fetches the page, parses `rawData`, emits GeoJSON.
- Official **BGN** sources (`operasional-sppg`, `gina.bgn.go.id`) are **WAF/login-walled and coordinate-less**.
- **HONESTY CAVEAT (Iron Law #1):** it's an **early-2025 snapshot** — only ~28 marked "Beroperasi" vs
  BGN's current ~26k claim. Label these **terdaftar/diajukan (registered/proposed)**, dated, NOT a live
  operating census. A transparency paper must not imply 5,600 operating kitchens.
