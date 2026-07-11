# Civic data sources — extraction, forest, regency/province stats (verified 2026-06-27)

Three parallel data-scout agents probed these endpoints **live** (curl, real HTTP
status / content-type / CORS observed). The headline wins are open, tokenless,
CORS-enabled ArcGIS GeoJSON for **mining & energy** (ESDM) and **peatland** (BIG),
key-free GeoJSON downloads for **forest concessions** (GFW), and a free-key path to
**per-kabupaten statistics** (BPS). Independently re-verified the load-bearing claims.

> Iron law: every URL below was hit and responded as noted. Where an agent
> over-claimed (GFW mining download), it's flagged. Re-probe before wiring.

---

## 1 · Extraction & energy — ESDM Geoportal (OPEN, no token, CORS, WGS84 GeoJSON)

`geoportal.esdm.go.id` runs open ArcGIS instances `/gis1 /gis3 /gis5` (note: `/gis2`
is down, `/arcgis/` and MOMI `momi.minerba.esdm.go.id` are **token-walled** — use the
gis1 mirror). CORS reflects `https://detak-detik.pages.dev` → **browser-direct**, no
worker needed (worker still nice for caching). All paginate at `maxRecordCount=2000`
(use `resultOffset`/`resultRecordCount`); dates are epoch-ms.

| Layer | Endpoint (`…/query?where=1=1&outFields=*&f=geojson`) | Count | Geom | Key fields |
|---|---|---|---|---|
| **Mining concessions (IUP/WIUP)** ⭐ | `gis1/rest/services/Join_WIUP_vs_IPPKH/MapServer/0` | **4,797** (1,235 coal · 534 nickel · +Cu/Au/Sn/bauxite) | Polygon | `komoditas`, `nama_usaha` (company), `kegiatan` (OPERASI PRODUKSI/EKSPLORASI), `luas_sk` (ha), `cnc` (Clean&Clear), `nama_prov`/`nama_kab`, `tgl_berlak`/`tgl_akhir` |
| WIUP ∩ forest | `gis1/rest/services/Overlay_WIUP_vs_Kawasan_Hutan/MapServer/0` | 10,474 | Polygon | mines inside protected forest (Mar 2026) |
| **Oil & gas blocks** ⭐ | `gis3/rest/services/DMEW/Wilayah_Kerja_Migas_Konvensional/MapServer/0` | 215 | Polygon | `namobj`, `oprblk` (operator), `status`, `effdat`/`expdat` |
| Non-conventional migas | `gis3/.../DMEW/Wilayah_Kerja_Migas_Non_Konvensional/MapServer/0` | 9 | Polygon | shale/CBM |
| **Power-plant fleet** ⭐ | `gis5/rest/services/Sebaran_Pembangkit_Listrik/MapServer/0` | **3,588** (290 PLTU coal) | Point | `namobj`, `daya` (MW), `jnspls` (PLTU/PLTGU/PLTP/PLTA — filter coal by `jnspls='PLTU'`), `thnopr`, `statmlk` |
| Geothermal WKP | `gis5/.../Wilayah_Kerja_Panas_Bumi/MapServer/0` | 63 | Polygon | `nama`, `luas`, `tahap_wil` |
| Offshore platforms | `gis3/.../DMBS/Anjungan_Migas/MapServer/0` | 675 | Point | |
| Pipelines / refineries / LNG-LPG | `gis3/.../DMBS/Pipa_*`, `DMOO/Kilang_*` | — | Line/Point | downstream |

**License:** Satu Data / Satu Peta open framework (free, attribute "Ditjen Minerba /
ESDM"). No explicit CC string — cite the directorate.

**Re-verified here:** IUP count `=4797`, coal `=1235`, CORS header present for our
origin, sample props real (`BANGUN PERSADA JAMBI ENERGI · OPERASI PRODUKSI · 700 ha · JAMBI · CNC-3`).

---

## 2 · Forest & land use

### 2a · BIG SatuPeta — peatland + land cover (OPEN vector + CORS) ⭐
`kspservices.big.go.id/satupeta/rest/services/PUBLIK/SUMBER_DAYA_ALAM_DAN_LINGKUNGAN/MapServer/{n}/query?where=1=1&outFields=*&f=geojson`
- Layers: `6` Lahan Gambut (peatland, **146** polygons, re-verified), `0` Penutup Lahan (land cover), `37` Kesatuan Hidrologis Gambut, `48` Fungsi Ekosistem Gambut.
- 200 · `application/geo+json` · **CORS reflects our origin** (browser-direct). `maxRecordCount=1000`, paginate; thin big polygons with `maxAllowableOffset`. Fields lowercase ID (`namobj`, `wadmpu`=prov).

### 2b · GFW concessions — oil-palm / pulpwood / logging (KEY-FREE via download) ⭐
`data-api.globalforestwatch.org/dataset/{ds}/latest/download/csv?sql=SELECT name,group_comp,type,gfw_geojson FROM data` (follow `-L`; `/query` route is key-walled, `/download/csv` is **not**).
- Datasets: `gfw_oil_palm`, `idn_wood_fiber` (Indonesia pulpwood — re-verified, returns real MultiPolygon: *PT Adindo Hutani Lestari / APRIL / HT*), `gfw_logging`, `rspo_oil_palm`, `gfw_plantations`.
- `gfw_geojson` column = stringified MultiPolygon EPSG:4326 (re-parse). Fetch via **Worker** (CloudFront, no CORS). License per-dataset (often CC-BY; check `metadata.license`).
- ⚠️ **Over-claim caught:** `gfw_mining_concessions` is **403 "not available for download"** — use ESDM IUP (§1) for mining instead.

### 2c · GFW deforestation alerts + tree-cover-loss (FREE MyGFW key)
- Pre-aggregated by Indonesian admin: `gadm__integrated_alerts__adm2_daily_alerts` (**adm2 = kabupaten**), `gadm__glad__adm2_daily_alerts`, `umd_tree_cover_loss`.
- `/query?sql=SELECT iso,SUM(alert__count) FROM data WHERE iso='IDN' GROUP BY iso` → needs `x-api-key`. Free account → `POST /auth/token` → `POST /auth/apikey`. **Register one key, store as Worker secret.** Always aggregate server-side (daily tables are huge).

### 2d · KLHK SIGAP — kawasan hutan / deforestasi / gambut (RASTER only)
`geoportal.menlhk.go.id/server/rest/services/SIGAP_Interaktif/{svc}/MapServer/export?bbox=…&format=png&f=image` (200 image/png). Vector `/query` is disabled (`capabilities:Map`), FeatureServer is token-walled. **Use as a raster overlay** (via Worker — incomplete TLS chain, no CORS). Services: `Kawasan_Hutan`, `Deforestasi_2021_2022`, `Fungsi_Ekosistem_Gambut`, `Arahan_Pemanfaaatan_PBPH`.

---

## 3 · Province & kabupaten statistics (the dossier data — currently MOCKED)

The dossier reads a hardcoded `DAERAH` table in `src/lib/data/edisi.ts`. To make it
live + add a kabupaten dossier:

### Join key (solve first): `cahyadsn/wilayah` (Kepmendagri 2025) ⭐ keyless
`raw.githubusercontent.com/cahyadsn/wilayah/master/db/wilayah.sql` (re-verified 200, 2.9 MB).
- Authoritative `nama→4-digit BPS code` bridge for all **515** kab/kota (our geojson is the new 38-province / 515-kab scheme — use this, NOT the older 492-row emsifa list).
- `db/wilayah_level_1_2.sql` adds **ibukota, lat/lng, area, population** per prov+kab (23 MB w/ geometry — parse columns at ETL). Mirror: `yonatanyl/KODE-WILAYAH-KEPMENDAGRI-2025` (CSV).

### BPS WebAPI — `webapi.bps.go.id` ⭐ primary (FREE email key)
`…/v1/api/list/model/data/lang/ind/domain/{KODE}/var/{VAR}/key/{KEY}/`
- **Kabupaten granularity YES.** `domain` = BPS kode wilayah: nation `0000`, province `{kk}00`, kabupaten `{kkkk}`. Region lists: `?type=kabbyprov&prov=73`. Indicators per domain via `?model=var&subject=26` (IPM, P0 poverty, mean-years-schooling, PDRB).
- CORS `*` (browser-callable). **⚠️ WAF gotcha (re-verified):** non/low-quality UA → "LTM WAF Block" HTML; needs a **full realistic browser UA**, and **datacenter/CI/Worker IPs may be blocked** → prefer fetching where a real browser UA + non-flagged IP applies, or test from CI early. Key stays server-side.
- Response: `datacontent` keyed by concatenated `vervar+var+turvar+th+turth`; `vervar`=region, `th`=year (`124`≈2024).

### Wikidata SPARQL — `query.wikidata.org/sparql` keyless top-up
- **438** Indonesian regencies (`wdt:P31 wd:Q3191695`), CORS `*`, CC0 (re-verified count=438).
- Reliable: **capital (P36), population (P1082), area (P2046)**. HDI (P1081) sparse — don't rely. Join by name (fuzzy); good for ibukota + area BPS doesn't expose cleanly.

### Dropped
- **`data.go.id`** — no longer CKAN (404 / DNS NXDOMAIN / 500 on the Spring API). Not a usable public API right now. Skip.
- **World Bank v2** — national only (no IDN subnational in the country API). Baseline number only.

---

## Recommended wiring order

**Map layers (new "transparency" surfaces):**
1. **Mining concessions** (ESDM IUP, browser-direct) — colour by `komoditas`, the real win; pairs with WIUP∩forest.
2. **Rework CO₂/energy** — replace the 3-asset CO₂ layer with the **full ESDM power fleet** (3,588; `jnspls='PLTU'` = coal), de-duping the karbon↔batubara overlap. Keep Climate TRACE only if we want emission *tonnage* sizing.
3. **Oil & gas blocks** (ESDM, one fetch, 215).
4. **Forest:** peatland (BIG, browser-direct) + oil-palm/pulpwood/logging concessions (GFW download via Worker). Deforestation alerts (GFW key) later.

**Dossier data (replace mocks):**
1. Build the `nama→code` bridge from `cahyadsn/wilayah` (one ETL artifact).
2. BPS WebAPI (free key) → province + kabupaten IPM/poverty/PDRB/population. Pre-fetch to static JSON in ETL (mind the WAF/IP gotcha).
3. Wikidata (keyless) → ibukota + area top-up.

**Keys to register (Yose, both free):** BPS WebAPI (email-only, instant) · GFW MyGFW (for deforestation alerts; optional, later). Everything else keyless.
