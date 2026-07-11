# Endpoint cookbook — Lingkungan & Ekstraksi refocus (deforestation + land-conflict displacement)

Scout run 2026-07-03 (agent, all probes curl-verified live from the dev
device). Feeds NORTH-STAR §13.17 A.6 / wave 8b: the ALAM rebuild ingests
from these; the newsroom re-polls on the cadences below (continuous, not
one-time). Ranked by usability.

---

## 1. GFW Data API — precomputed ADM1/ADM2 stats via keyless `download/csv` — **USABLE** ⭐

The `/query` route is key-walled, but `/download/{csv|json}` on the
**precomputed GADM zonal-stats tables** is keyless, supports full SQL
(`WHERE`, `GROUP BY`, `SUM`, `ORDER BY`), and — new finding, contradicts
the older repo note — **sends `access-control-allow-origin: *`**
(browser-direct possible; follows a 307 redirect, keep `-L`).

**Gotcha:** `SELECT *` with a `WHERE` times out (>25 s). **Always project
columns** — then responses return in 2–7 s.

### 1a. Annual tree-cover loss per kabupaten, inside/outside concessions

```
GET https://data-api.globalforestwatch.org/dataset/gadm__tcl__adm2_change/latest/download/csv?sql=...
```

- Auth: none. CORS: `*`. Format: CSV (RFC-4180).
- Key columns: `iso, adm1, adm2` (GADM integer codes — map via
  `gadm_administrative_boundaries`), `umd_tree_cover_loss__year`
  (2001–**2024**), `umd_tree_cover_density_2000__threshold` (filter
  `=30`), `umd_tree_cover_loss__ha`, plus boolean context flags:
  `is__gfw_oil_palm`, `is__gfw_wood_fiber`, `is__gfw_managed_forests`
  (logging), `is__idn_forest_moratorium`, `is__gfw_peatlands`,
  `is__umd_regional_primary_forest_2001`,
  `is__landmark_indigenous_and_community_lands` (useful for the agrarian
  angle).
- Verified aggregation (Aceh, adm1=1, adm2=1, threshold 30):

```csv
"umd_tree_cover_loss__year","is__gfw_oil_palm","loss_ha"
2024,False,760.43926684206646741
2024,True,490.80353199812334501
2023,False,711.61955962491818121
2023,True,407.28384302459344270
```

- Cadence: annual (Hansen update, ~Feb–Apr; table versions `v20260424`,
  `latest` resolves). Province-level twin: `gadm__tcl__adm1_change`.
  Also `*_summary` tables (static extent baselines).
- License: underlying `umd_tree_cover_loss` metadata says **CC BY 4.0**;
  attribution "Hansen/UMD/Google/USGS/NASA, via Global Forest Watch".
  The aggregate table's own license field is empty. **Iron-law caveat:**
  the `is__gfw_oil_palm`/`wood_fiber`/`managed_forests` flags derive
  from the IDN-carved-out concession polygons — as booleans inside
  Hansen-derived aggregates this is what GFW's own public dashboard
  serves, but editorial should review once; the loss figures themselves
  are cleanly CC BY.

### 1b. Integrated deforestation alerts (GLAD-L + GLAD-S2 + RADD) per kabupaten, near-real-time

```
GET https://data-api.globalforestwatch.org/dataset/gadm__integrated_alerts__adm2_daily_alerts/latest/download/csv?sql=...
```

- Columns: `iso, adm1, adm2, gfw_integrated_alerts__date,
  gfw_integrated_alerts__confidence, alert__count, alert_area__ha,
  whrc_aboveground_co2_emissions__Mg` + `is__gfw_peatlands`,
  `is__landmark_indigenous_and_community_lands`,
  `wdpa_protected_areas__iucn_cat`.
- Verified (IDN, high confidence, ~7 s):

```csv
"gfw_integrated_alerts__date","n","ha"
"2026-06-29",98,1.1944
"2026-06-26",1648,20.2786
```

- Cadence: daily — dataset versions `v20260702`, `v20260703`
  (same-day). GLAD-only twins exist (`gadm__glad__adm2_weekly_alerts`).
- Verdict: USABLE (keyless, CORS, current to 4 days ago). Alert dates
  run ~2010-day retention; treat the most recent 1–2 weeks as
  provisional (confidence upgrades).

### 1c. `/query/json` route + raw rasters — KEY-GATED

`.../latest/query/json?sql=...` → `403 Request is missing valid API
key`. Free key via MyGFW account (globalforestwatch.org sign-up →
`POST /auth/apikey`; docs at `data-api.globalforestwatch.org/#tag/
Authentication`). Only needed if we outgrow the download route.

### Hansen/UMD direct: no per-country CSV/JSON exists

`storage.googleapis.com/earthenginepartners-hansen/GFC-2024-v1.12/
lossyear.txt` → 200 (raster granule lists only). The GFW `gadm__tcl__*`
tables above ARE the machine-readable Hansen summaries.

---

## 2. IDMC — GIDD annual displacement + IDU event stream — **USABLE (free-key)**

Base `https://helix-tools-api.idmcdb.org/external-api/`. Requires
`client_id` — keyless gives `403 Client is not registered`. The
client_id embedded in IDMC's own public site (`IDMCWSHSOLO009`) works
today; **register our own** (needs-from-Yose №9) before production.
**No CORS** → poll server-side/Worker/Actions.

### 2a. GIDD annual (conflict + disaster, new + stock)

```
GET .../gidd/displacements/?iso3__in=IDN&start_year=2022&end_year=2024&client_id={ID}
```

```json
{"count":3,"results":[{"iso3":"IDN","year":2022,
"conflict_new_displacement":7565,"conflict_total_displacement":32518,
"disaster_new_displacement":307985},
{"year":2023,"conflict_new_displacement":3720,
"conflict_total_displacement":48242}]}
```

- Cadence: annual (GRID release, ~May). License: free non-commercial
  with attribution "IDMC (GRID)". This is the clean, official "people
  displaced by conflict" series (2024: 14.296 new conflict
  displacements IDN).

### 2b. IDU displacement events, rolling 180 days

```
GET .../idus/last-180-days/?client_id={ID}   (302 → timestamped S3 JSON, gzip ~660 KB / 7,9 MB raw)
```

- Regenerated **hourly** (S3 path carries the timestamp). Fetch with
  `curl -L --compressed`, filter `iso3=="IDN"` client-side (136 IDN
  events in the current window; fields: `displacement_type`
  (Conflict/Disaster), `figure`, `displacement_date`, `locations_name`,
  lat/lon, `sources`, `source_url`). Sample:
  `{"country":"Indonesia","displacement_type":"Disaster","figure":205,
  "displacement_date":"2026-07-01","locations_name":"Bula, Maluku",
  "sources":"BNPB"}`.
- Verdict: USABLE (conflict-type IDN events sparse; treat as event
  ticker, GIDD as the annual figure of record).

---

## 3. KLHK geoportal ArcGIS REST — official deforestation polygons — **PARTIAL**

`https://geoportal.menlhk.go.id/server/rest/services/` — keyless, but
**incomplete TLS chain** (curl needs `-k` or a patched CA bundle) and
**no CORS** → server-side only.

- **New finding:** the `Time_Series` folder holds the full official
  vintage series `DEF_2003_2006 … DEF_2023_2024` and `PL_1990…`
  (penutupan lahan), and unlike SIGAP these have
  `capabilities: Map,Query,Data` — vector query works:
  `Time_Series/DEF_2023_2024/MapServer/0/query?where=1=1&
  returnCountOnly=true&f=json` → `{"count":23994}` polygons.
- **But** attributes are empty shells (`DEF="DEF"`, `NAMAOBJ="-"`, no
  area/province field) → NOT a stats endpoint; usable as (a) the
  official deforestation-footprint **map overlay** (page geometry with
  `resultOffset`, `maxAllowableOffset` generalization,
  `maxRecordCount=1000`) and (b) a **vintage watcher**: poll the folder
  listing `Time_Series?f=json` yearly for `DEF_2024_2025` appearing.
- SIGAP_Interaktif thematic services (Kawasan_Hutan,
  Deforestasi_2021_2022, Penutupan_Lahan_20xx…) remain **Map-only**
  (raster `/export` PNG, no query) — unchanged from the repo note.
- License: government open data (cite KLHK/SIGAP).

---

## 4. MapBiomas Indonesia ("Landy") — kabupaten land-cover statistics — **USABLE (static snapshot)**

`mapbiomas.nusantara.earth` → redirects to `https://landy.mapbiomas.id/`
(Laravel/Livewire, no JSON API). The stats page exposes stable XLSX:

- `https://landy.mapbiomas.id/storage/files/statistics_lulc_indonesia_col4-1 (1) (1).xlsx`
  — Collection 4.1 LULC statistics, 21,9 MB, Last-Modified 2026-04-10.
- `.../Statistics MB Indonesia Col2_Kabupaten_ID_Rev.xlsx` —
  kabupaten-level, 25,4 MB.
- Cadence: per collection (~annual). License: MapBiomas publishes CC BY
  4.0 (confirm on the data-policy page); consortium includes Auriga
  (already on the independent-source roster). Use a Last-Modified HEAD
  check, snapshot once per collection — too big to poll.

---

## 5. data.go.id (Satu Data) — CKAN is gone — **PARTIAL / SCRAPE**

- `data.go.id/api/3/action/package_search` → Next.js HTML (no CKAN).
  `katalog.data.go.id` → DNS dead. `POST /api/dataset` is a broken
  request form (500), not search. BLOCKED as an API (SSR HTML of
  `/dataset?q=…` parseable if desperate).
- **Federated provincial CKANs still work keyless**, e.g.
  `https://data.kalbarprov.go.id/api/3/action/package_search?q=deforestasi&rows=1`
  → `{"success": true, "result": {"count": 1}}` (dishut Kalbar dataset).
  Opportunistic per-province, not a national feed. A promising Jatim
  endpoint (`opendata.jatimprov.go.id/api/bigdata/...` — KLHK
  deforestasi netto inside/outside kawasan hutan) is dead (empty data /
  500 on download).

---

## 6. Conflict/agrarian civil-society + state sources — mostly **BLOCKED** to bots

| Source | Probe | Verdict |
|---|---|---|
| **KPA** (Catahu konflik agraria) | `kpa.or.id` → Cloudflare managed challenge (403, even mobile UA) | BLOCKED — annual PDF anyway; manual browser snapshot each January (needs-from-Yose №10) |
| **Komnas HAM** | `data.komnasham.go.id` → DNS dead; `www.komnasham.go.id` → 403 WAF | BLOCKED — annual-report PDFs via manual snapshot (№10) |
| **WALHI** | not WordPress; `/feed`, `/rss` → 500 | BLOCKED (no machine endpoint) |
| **AMAN** | `https://aman.or.id/feed` → 200 Atom, updated 2026-07-03 | USABLE as publication-notification feed (narrative, not data) |
| **BPS webapi** | Perimeter WAF block before key validation (matches repo note); `sig.bps.go.id/rest-bridging` keyless but crosswalk-only, no forestry tables | BLOCKED from this host class — BPS "Angka Deforestasi" tables = manual xlsx path (needs-from-Yose №8) |
| ACLED | `api.acleddata.com` → DNS dead (API relocated, registration-gated) | not pursued |

---

## Recommended ingest plan (the newsroom's rotation)

1. **Weekly — deforestation pulse (lead metric):** GFW
   `gadm__integrated_alerts__adm2_daily_alerts` `download/csv`, SQL
   `WHERE iso='IDN' AND gfw_integrated_alerts__confidence='high' GROUP
   BY adm1, gfw_integrated_alerts__date` (last 90 days) → per-province
   alert counts + `alert_area__ha`; optional second GROUP BY on
   `is__gfw_peatlands` / `is__landmark_indigenous_and_community_lands`.
   Keyless, CORS `*`, ~7 s. Attribution: "Hansen/UMD, GLAD, WUR (RADD)
   via Global Forest Watch, CC BY".
2. **Annual (~April, on new Hansen vintage) — loss series of record:**
   GFW `gadm__tcl__adm1_change` (+`adm2_change` for lens kabupaten)
   `WHERE iso='IDN' AND umd_tree_cover_density_2000__threshold=30 GROUP
   BY umd_tree_cover_loss__year, is__gfw_oil_palm` (repeat per flag) →
   2001–2024 loss, inside/outside concession types. Trigger: watch the
   dataset `versions` array for a new entry.
3. **Annual (~May GRID) + weekly ticker — displacement:** IDMC GIDD
   `displacements/?iso3__in=IDN` for the conflict/disaster figures of
   record; optionally the hourly IDU 180-day dump (gzip, filter IDN)
   for the event ticker. Register own client_id (№9); poll from
   Worker/Actions (no CORS).
4. **Yearly watcher — official counterpoint:** KLHK `Time_Series?f=json`
   folder listing for a new `DEF_YYYY_YYYY` service → pull polygons as
   the official-KLHK overlay next to GFW figures (state baseline vs
   independent monitor); pair with the manual January KPA Catahu
   snapshot (№10) for the agrarian-conflict count — the only
   structured-ish annual number for evictions/land conflicts.
