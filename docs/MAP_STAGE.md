# MAP_STAGE.md — the map as a main stage

> Turning `PetaKabar.svelte` from a front-page map into an interrogable instrument:
> many free, live, precise layers over Indonesia. All sources verified June 2026
> (official docs; sandbox blocked live curl, so do one browser `fetch()` per host
> before locking architecture). Free-tier only; keyless where possible.

## Current state (already built, do not rebuild)
- **ADM1 province polygons** from `public/data/idn-prov.geojson` (denyherianto 38-prov,
  CC-BY, patched by `scripts/patch-prov-geojson.mjs`: all 6 Papua provinces, codes
  joined to `DAERAH` on `kode`). Fill + outline + selected highlight + label.
- **Choropleth** (`buildChoro`, `map_choropleth` verb): miskin, ipm, dokter, ump,
  pegawai, tpt — colored from `DAERAH` rows. Hover feature-state, bbox framing, click
  to set the `lensa`.
- **Hazard layers with real lat/lon**: BMKG/USGS quakes (live, keyless/proxy),
  volcanoes/air/fire/floods (each a `(data contoh)` sample with accurate coords + a
  live path). PetaBencana floods fetched browser-direct.
- Basemaps: OpenFreeMap (dinas), Esri imagery (satelit), RainViewer radar (cuaca).

So the perceived "dots dead-center of provinces" is **hazard layers showing the sparse
contoh fallback** because the live feeds below are not wired, not a geometry bug.

## The verified free-data catalog

### Browser-direct, keyless (drop into MapLibre, no backend)
| Source | Endpoint | Format | Notes |
|---|---|---|---|
| USGS quakes | `earthquake.usgs.gov/earthquakes/feed/v1.0/summary/{level}_{period}.geojson` | GeoJSON | precise pts, CORS `*` |
| PetaBencana | `data.petabencana.id/reports?admin=ID-JK&disaster=flood&timeperiod=86400` | GeoJSON | pts + `/floods` polygons; CC-BY |
| NASA GIBS | `gibs.earthdata.nasa.gov/wmts/epsg3857/best/{LAYER}/default/{date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg` | tiles | truecolor MODIS/VIIRS; haze/ash; `{y}` before `{x}` |
| Open-Meteo | `api.open-meteo.com/v1/forecast?...` + `air-quality-api.open-meteo.com/v1/air-quality?...` | JSON | per-coord, CORS `*`, CC-BY; powers click-report |
| AISStream (ships) | `wss://stream.aisstream.io/v0/stream` | WS JSON | free key in first msg; browser WS bypasses CORS; bbox `[[-11,95],[6,141]]` |
| RainViewer | `api.rainviewer.com/public/weather-maps.json` → tiles | tiles | already wired; weak ID coverage |

### Need the worker `/geo` proxy (hide key / add CORS / normalize to `[lon,lat]`)
| Source | Endpoint | Auth | Notes |
|---|---|---|---|
| MAGMA volcanoes | `magma.esdm.go.id/v1/gunung-api/tingkat-aktivitas`, `/v1/vona` | mostly open (403s bots) | ~127 volcanoes, precise summits + activity level + VONA aviation color |
| NASA FIRMS fire | `firms.modaps.eosdis.nasa.gov/api/area/csv/{KEY}/VIIRS_SNPP_NRT/95,-11,141,6/1` | free instant MAP_KEY | CSV→GeoJSON; 375m pixels; ~5000/10min |
| BMKG quakes | `data.bmkg.go.id/DataMKG/TEWS/{autogempa,gempaterkini,gempadirasakan}.json` | keyless, no CORS | coords are `"lat,lon"` STRING — swap to `[lon,lat]` |
| adsb.lol planes | `api.adsb.lol/v2/lat/{lat}/lon/{lon}/dist/{nm}` (≤250NM circles, grid+dedupe by `hex`) | keyless | ~1s; fallback airplanes.live/adsb.fi; OpenSky needs OAuth2 now |
| WAQI air | `api.waqi.info/map/bounds/?latlng=-11,95,6,141&token={T}` | free token | CORS ok but proxy to hide token; per-station attribution mandatory |

### Per-province choropleth data (pre-bake to static JSON keyed by BPS code)
- **BPS WebAPI** `webapi.bps.go.id/v1/api/` (free key; `domain` param = BPS code:
  `0000` national / 2-digit prov / 4-digit kab): poverty, IPM, TPT, PDRB, electrification.
- **GFW** tree-cover-loss per admin (the standout layer): bundle the IDN province/district
  CSVs from `globalforestwatch.org/dashboards/country/IDN/` (Hansen v1.13, CC-BY).
- Population: HDX **COD-PS-IDN** CSV. Health/education: BPS counts; healthsites.io points.
- **Code bridge (critical):** BPS (`3218`) vs Kemendagri (`32.18`) differ. Canonical key =
  BPS; reconcile via `github.com/zakiego/Kode-Wilayah-...-Relasi-BPS-Kemendagri`. Our
  `idn-prov.geojson` already uses the app's `kode` scheme matched to `DAERAH`.

## Phased plan
1. **DONE — province polygons + choropleth.** (Optional: add more BPS metrics, ADM2 drill-down via ardian28 MIT set, lazy-loaded.)
2. **Hazards live + precise** (the real fix for "imprecise dots"): extend worker `/geo` to
   pull MAGMA volcanoes (full ~127, precise), FIRMS fire, BMKG quakes; add USGS direct.
   Bundle a fuller volcano list only from an authoritative source (MAGMA/Smithsonian GVP),
   never hand-typed coords. Set `FIRMS_MAP_KEY` + `WAQI_TOKEN` worker secrets.
3. **Moving objects**: adsb.lol planes (worker-proxied, grid of ≤250NM circles, ~1s,
   dedupe by `hex`, animate) + AISStream ships (direct browser WebSocket, Indonesia bbox).
   The "wow" trio = planes + ships + live volcanoes.
4. **Click-anywhere location report** (the settl. vision): click any point → panel with
   Open-Meteo climate normals + a wind rose + the month×hour thermal matrix, OSM Overpass
   nearest services (hospital/school/market), WAQI air + hazard-risk synthesis; Aksara narrates.

## Architecture
One Cloudflare Worker `/geo/{layer}` fronts the proxy-required sources (MAGMA, FIRMS, BMKG,
adsb.lol, WAQI): fetch server-side, cache ~60s in KV, normalize to GeoJSON `[lon,lat]`, add
CORS. Everything else fetches browser-direct. Attribution block must credit BMKG, PVMBG/ESDM,
NASA FIRMS/GIBS, USGS, PetaBencana, Open-Meteo, GFW/Hansen, OSM, RainViewer per their licenses.
