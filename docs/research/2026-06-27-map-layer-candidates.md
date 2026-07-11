# New live-data map-layer candidates

> Research note generated **2026-06-27** by a background research agent (live web
> access, grounded in `MAP_STAGE.md`, `DATA_SOURCES.md`, `worker/src/index.ts`,
> `PetaKabar.svelte`). Status: **pre-implementation** — endpoints verified as noted;
> "verify-before-trust" where flagged. Folds into `MAP_STAGE.md` / `DATA_SOURCES.md`
> as layers ship. All picks honor the iron laws (citation-or-silence, documents-speak,
> free-tier, no-surveillance).

## Already wired (out of scope, reference)

Basemaps/plates: OpenFreeMap vector (Dinas), Esri World Imagery (Satelit), NASA GIBS
MODIS Terra true-color + RainViewer radar (Cuaca), NASA GIBS VIIRS Black Marble
night-lights (Malam), OSM transportation roads toggle. Vector/admin: ADM1 province
polygons (`public/data/idn-prov.geojson`, BPS-coded) + DAERAH choropleths. Hazard/live:
BMKG+USGS quakes, PVMBG/MAGMA volcanoes, WAQI air, PetaBencana floods, FIRMS fire,
adsb.lol aircraft, AISStream ships, Open-Meteo forecast/air/archive (click report).

## Candidates (ranked value-to-effort)

### 1. geoBoundaries Indonesia ADM2 (kabupaten polygons) — VERIFIED
- Shows: ~514 kabupaten/kota borders; unlocks district-level choropleth drill-down.
- Endpoint: `https://www.geoboundaries.org/api/current/gbOpen/IDN/ADM2/` → `simplifiedGeometryGeoJSON`.
- Auth: keyless. Format: GeoJSON (simplified). License: **ODbL 1.0** (attribute "geoBoundaries / OpenStreetMap contributors"; share-alike — flag for editor). Cadence: static/versioned.
- Access: bundle in `public/data/` (don't hot-fetch GitHub raw). Needs the BPS↔Kemendagri code bridge (zakiego) already referenced in docs. Lowest-risk high-value structural add.

### 2. Open-Meteo Flood API (GloFAS river discharge) — VERIFIED
- Shows: river-discharge / flood-forecast at any coordinate; new line in Laporan Lokasi.
- Endpoint: `https://flood-api.open-meteo.com/v1/flood?latitude={lat}&longitude={lon}&daily=river_discharge,river_discharge_max,river_discharge_mean`
- Auth: keyless. Format: JSON (point). License: CC-BY 4.0 (Copernicus EMS / GloFAS v4). Cadence: daily, forecast ~210 days. Access: **browser-direct (CORS `*`)**. Reuses the wired Open-Meteo pattern. Very low effort.

### 3. WDPA / Protected Planet — protected areas — VERIFIED
- Shows: taman nasional + marine protected-area polygons; neutral counter-layer under concessions/deforestation.
- Endpoints: keyless ArcGIS MapServer `https://data-gis.unep-wcmc.org/server/rest/services/ProtectedSites/The_World_Database_of_Protected_Areas/MapServer` (`WDPA_poly_latest`, supports `f=geojson`, max 2000/query); official API `https://api.protectedplanet.net/v3/protected_areas?token={KEY}` (free key).
- Auth: MapServer keyless; API free-key. Format: raster tiles or GeoJSON. License: WDPA — attribution mandatory ("UNEP-WCMC and IUCN"); **no redistribution of raw DB** (display + cite OK). Cadence: monthly. Access: keyless MapServer for display; verify CORS or route via worker.

### 4. NASA GIBS — IMERG precipitation rate (rainfall plate) — VERIFIED pattern
- Shows: near-real-time rainfall over the archipelago; a true rainfall layer (RainViewer is weak over Indonesia).
- Endpoint: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/IMERG_Precipitation_Rate/default/{date}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png` (`{y}` before `{x}`, like the existing GIBS plates).
- Auth: keyless. Format: raster tiles (transparent overlay). License: NASA EOSDIS GIBS (credit "NASA EOSDIS GIBS / GPM IMERG"). Cadence: ~30 min (IMERG Early, ~5h latency). Access: browser-direct, **drop-in**. Confirm exact TileMatrixSet/level from WMTSCapabilities.xml before locking.

### 5. Global Forest Watch — integrated deforestation alerts (GLAD/RADD) — VERIFIED service
- Shows: near-real-time forest-loss alerts; headline environmental layer for the hutan beat.
- Endpoint: display tiles `https://tiles.globalforestwatch.org/{dataset}/{version}/{implementation}/{z}/{x}/{y}.png` (dataset `gfw_integrated_alerts`); analysis via Data API `https://data-api.globalforestwatch.org/dataset/gfw_integrated_alerts/latest/query` (free key).
- Auth: display tiles keyless; Data API free key. Format: raster XYZ/WMTS + JSON. License: CC-BY 4.0 ("Global Forest Watch / Hansen-UMD / WUR (RADD)"). Cadence: ~daily-weekly. **Gotcha:** exact live integrated-alerts XYZ template + date/confidence params returned 403 on direct fetch — needs one live probe. Medium effort, very high value.

### 6. Global Energy Monitor — Global Coal Plant Tracker — VERIFIED dataset
- Shows: every coal unit ≥30 MW in Indonesia with status/capacity/lat-lon; centrepiece for JETP-vs-coal. (GEM also has oil/gas, LNG, nickel, steel trackers — same model.)
- Access: no REST API; form download `https://globalenergymonitor.org/projects/global-coal-plant-tracker/download-data/` (Excel/CSV) or KAPSARC mirror `https://datasource.kapsarc.org/explore/dataset/global-coal-plant-tracker/`.
- Auth: keyless (form/KAPSARC export). Format: CSV/XLSX → convert to GeoJSON once, bundle. License: CC-BY 4.0 ("Global Energy Monitor"). Cadence: bi-annual (Jan & Jul). Low technical effort, high signal.

### 7. WorldPop population density (100 m) — VERIFIED live ImageServer
- Shows: population-density raster; context plate ("who is under this hazard").
- Endpoint: `https://worldpop.arcgis.com/arcgis/rest/services/WorldPop_Population_Density_100m/ImageServer` (exportImage / cached tiles); static GeoTIFF `https://hub.worldpop.org/geodata/summary?id=6376`.
- Auth: keyless. Format: ArcGIS ImageServer / GeoTIFF. License: CC-BY 4.0 ("WorldPop, University of Southampton"). Cadence: annual (latest 2020). **Gotcha:** F32 ImageServer needs a renderingRule/color-ramp; medium effort.

### 8. Kontur Population (H3 hexagons) — VERIFIED, lighter pop alternative
- Shows: population density as H3 hexagons (GHSL + Meta HRSL + MS Buildings); on-brand for PetaPiksel grammar.
- Endpoint: HDX `https://data.humdata.org/dataset/kontur-population-dataset-3km` (3km, 169 MB global) or 22km (6 MB global). Clip Indonesia once.
- Auth: keyless. Format: GeoJSON/GPKG hexagons. License: CC-BY 4.0 ("Kontur"). **Gotcha:** 400m file = 6.6 GB (avoid); 3km practical clip, 22km bundle-safe. Medium effort.

### 9. Open-Meteo Marine API (waves / sea state) — VERIFIED
- Shows: wave height/period/direction at any coastal coordinate; maritime line for Laporan Lokasi.
- Endpoint: `https://marine-api.open-meteo.com/v1/marine?latitude={lat}&longitude={lon}&hourly=wave_height,wave_direction,wave_period`
- Auth: keyless. Format: JSON (point). License: CC-BY 4.0. Cadence: hourly. Access: **browser-direct (CORS `*`)**. Low effort.

### 10. healthsites.io — health facilities (OSM-derived) — VERIFIED
- Shows: hospitals/clinics/puskesmas points; closes the deferred "nearest services" idea.
- Endpoint: `https://healthsites.io/api/v3/facilities/?api-key={KEY}&country=Indonesia&output=geojson&page={n}` (paged) + bulk country download.
- Auth: free key. Format: GeoJSON. License: **ODbL** ("Healthsites.io / OpenStreetMap contributors"). Access: prefer one-time bulk download bundled static; cluster a large point set. Medium effort.

### 11. BNPB DIBI / Geoportal — disaster events — PARTIAL (verify endpoint)
- Shows: official disaster events (banjir, longsor, puting beliung) per region; landslide currently absent from the map; authoritative state baseline.
- Endpoint: Geoportal `https://gis.bnpb.go.id/` (ArcGIS) + Satu Data `https://data.bnpb.go.id/` (CKAN); DATA_SOURCES.md notes `dibi.bnpb.go.id` returns stable GeoJSON.
- Auth: keyless. Format: GeoJSON / ArcGIS REST / CKAN. License: Indonesian public-sector ("BNPB"). Access: **needs worker proxy** (`.go.id` 403s datacenter IPs; CORS unlikely). **Gotcha:** stable JSON endpoint URL unconfirmed — needs a worker-side probe. Landslide coverage is the unique payoff.

## Could-not-fully-confirm (flagged)

- GFW `gfw_integrated_alerts` live XYZ tile template (#5) — service exists, tree-cover WMTS confirmed, integrated-alerts path 403'd on direct fetch.
- GIBS `IMERG_Precipitation_Rate` exact TileMatrixSet/level (#4) — confirm from WMTSCapabilities.xml.
- BNPB DIBI stable GeoJSON URL (#11).

## Suggested build order

- Tier 1 (drop-in, keyless, low effort): **#2 Open-Meteo Flood, #4 GIBS IMERG rainfall, #9 Open-Meteo Marine** — reuse existing patterns.
- Tier 2 (high value, moderate): **#1 geoBoundaries ADM2, #3 WDPA, #5 GFW deforestation, #6 GEM coal.**
- Tier 3 (context/TODO-closers): **#7 WorldPop or #8 Kontur, #10 healthsites, #11 BNPB DIBI.**

Concession/mining layers (Nusantara Atlas / Auriga) investigated but **omitted** — concession geodata not clearly openly licensed for redistribution; link out, don't host.

## Sources

GFW Data API https://data-api.globalforestwatch.org/ · GFW integrated alerts
https://www.globalforestwatch.org/help/map/additional-materials/integrated-deforestation-alerts/ ·
Protected Planet API https://api.protectedplanet.net/documentation · WDPA ArcGIS
https://data-gis.unep-wcmc.org/server/rest/services/ProtectedSites/The_World_Database_of_Protected_Areas/MapServer ·
GCPT download https://globalenergymonitor.org/projects/global-coal-plant-tracker/download-data/ ·
geoBoundaries https://www.geoboundaries.org/api.html · WorldPop ImageServer
https://worldpop.arcgis.com/arcgis/rest/services/WorldPop_Population_Density_100m/ImageServer ·
Open-Meteo Flood https://open-meteo.com/en/docs/flood-api · Kontur HDX
https://data.humdata.org/dataset/kontur-population-dataset · healthsites
https://healthsites.io/api/docs/ · GIBS IMERG https://gpm.nasa.gov/data/imerg · BNPB
https://gis.bnpb.go.id/
