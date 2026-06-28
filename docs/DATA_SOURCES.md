# Public data sources — verified June 2026

Field-checked availability for candidate daily metrics. Verdicts: TRIVIAL
(free JSON, no/instant key) · EASY (free key or stable structure) · SCRAPE
(public HTML, doable) · HARD (manual/PDF assembly) · DEAD (gone).

**Cross-cutting gotcha:** many .go.id sites block datacenter IPs — run the
fetches from the Cloudflare Worker cron (edge IPs fare better) and treat
every dark source as a Data Hilang note, never a crash. Stable exceptions:
BMKG, data.go.id CKAN, DJPK.

> **TWO source ledgers — keep BOTH in sync.** This file is the *internal*
> catalog. **`src/pages/sumber.astro`** is the *public* "receipts drawer"
> readers see (the `SUMBER` array: nama/url/dipakai/metode + a
> **LANGSUNG/CONTOH/SEGERA** status). Every time a source is added or flips
> CONTOH→LANGSUNG, update `sumber.astro` too — a stale status there mislabels
> the paper's own honesty. It is currently **behind** (missing ESDM mining,
> GVP volcanoes, cross-sector Climate TRACE, OpenSky, AISStream, GEM coal,
> cahyadsn wilayah; some CONTOH rows are now live). Full 2026-06-28 hunt
> (health/OSM, BIG SatuPeta 368-layer inventory, independent RSS roster,
> proxies) → `docs/research/2026-06-28-data-and-rss-sources.md`.

## Wired & live (2026-06-27) — keep this list current

New map / click-report sources wired this session. Browser-direct unless noted;
each layer carries its source + license per the iron laws.

- **Open-Meteo Flood** (GloFAS river discharge) — `flood-api.open-meteo.com/v1/flood`, keyless, CC-BY. Click-report (river only where modelled).
- **Open-Meteo Marine** (wave height/period/direction) — `marine-api.open-meteo.com/v1/marine`, keyless, CC-BY. Click-report (coastal).
- **Climate TRACE v6** (asset-level CO₂e) — `api.climatetrace.org/v6/assets?countries=IDN&sectors=power`, keyless, CC-BY. v5.8.0, data through Apr 2026. "EMISI CO₂" layer (sized by tonnage). NOTE: it is **v6**, not v7; assets carry `bbox` (centroid) + `EmissionsSummary[0].EmissionsQuantity`.
- **NASA GIBS IMERG** (rainfall) — `gibs.earthdata.nasa.gov/wmts/epsg3857/best/IMERG_Precipitation_Rate/default/{date}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`, keyless. ~3-day lag (request a past date). "HUJAN" overlay.
- **BIG Rupabumi** (`geoservices.big.go.id/rbi`) — authoritative One-Map, **browser-direct** (CORS reflects origin), `f=geojson`. Used: province polygons (`BATAS_WILAYAH` layer 12), kabupaten (`Administrasi_AR_KabKota_50K`), province boundary lines (layer 8). **GOTCHA:** the BPS code fields (`KDPBPS`/`KDBBPS`) come back **blank** → join by NAME (`WADMPR`/`WADMKK`). Replaced the inaccurate bundled province polygons + powers the kabupaten drill-down.
- **GEM Global Coal Plant Tracker** (PLTU fleet + pipeline) — vendored from `raw.githubusercontent.com/GreenInfo-Network/coal-tracker-client` (CC-BY, Jan 2026 release). 111 IDN plants aggregated from 502 unit-rows, by status (beroperasi/konstruksi/rencana), `public/data/idn-batubara.geojson` (28KB). "PLTU BATU BARA" layer, sized by MW. Vendored not hot-linked; re-vendor on GEM's ~biannual (Jan/Jul) release. Complements Climate TRACE (emissions-now vs. build-pipeline).
- **Smithsonian GVP volcanoes** (registry) — `webservices.volcano.si.edu/geoserver/GVP-VOTW/ows` WFS, `CQL_FILTER=Country='Indonesia'`, GeoJSON. **101 Holocene volcanoes** with authoritative summit lat/lon + elevation + primary type + last-eruption year. Vendored to `public/data/gunungapi-id.json` (10KB) via `scripts/build-gunungapi.mjs` (regenerable). Summits are static so they ship bundled; only today's **alert level** is live.
- **MAGMA ESDM / PVMBG** (alert levels) — `magma.esdm.go.id/api/v1/magma-var`, **token-gated** (`Authorization: Bearer`). Worker `/geo/gunungapi` uses `env.MAGMA_TOKEN` if set, **content-type-guarded** (the public `/v1/gunung-api/*` URLs return HTML 200 / 404 — never JSON, so they silently failed before). Levels merge onto the GVP registry **by name**; without a token the UI honestly shows "registri GVP · status menyusul".
- **NASA FIRMS** (fire/hotspots) — `firms.modaps.eosdis.nasa.gov/api/area/csv/{key}/VIIRS_NOAA20_NRT/{bbox}/1`, worker `/geo/kebakaran`. **True VIIRS lat/lon** per pixel (~310 hotspots live, verified) — NOT centroids. Empty in the wet season → layer shows NIHIL honestly. "TITIK API" layer sized by FRP.
- **ESDM Geoportal — mining concessions (IUP/WIUP)** — `geoportal.esdm.go.id/gis1/.../Join_WIUP_vs_IPPKH/MapServer/0`, open + CORS, WGS84. **4,797 permit polygons** (company, commodity, activity, area, Clean-&-Clear). Vendored generalised to `public/data/idn-tambang.geojson` (1.9 MB) via `scripts/build-tambang.mjs`. "TAMBANG · IUP" layer coloured by commodity group.
- **cahyadsn/wilayah (Kemendagri 2025)** — `raw.githubusercontent.com/cahyadsn/wilayah/.../db/wilayah_level_1_2.sql`, keyless. The authoritative `nama→code` join + ibukota/penduduk/luas/lat-lon for all **514** kab. Vendored to `public/data/idn-wilayah.json` (72 KB) via `scripts/build-wilayah.mjs`; powers the kabupaten dossier (expand-in-place).
- **Climate TRACE v6 (CO₂ emitters)** — `api.climatetrace.org/v6/assets?countries=IDN&sectors={power|manufacturing|mineral-extraction|fossil-fuel-operations}`, keyless, CORS `*`, CC-BY. Top 250 by tonnage across 4 sectors (steel/mines/migas, not just coal). **GOTCHA:** v6 moved coords **`bbox` → `Centroid.Geometry`** (the old `bbox` read silently fell back to contoh). Browser-direct.

**Verified candidates — extraction · forest · regency/province stats (2026-06-27):**
a full probed catalog lives in `docs/research/2026-06-27-civic-data-sources.md`.
Headlines (all live-tested): ESDM Geoportal `gis1` mining concessions (4,797 polygons,
open + CORS, browser-direct), ESDM power fleet (3,588) & oil-gas blocks (215); BIG
SatuPeta peatland (open + CORS); GFW concession downloads (key-free CSV w/ geometry);
BPS WebAPI (free email key, **kabupaten** granularity, WAF-guarded); `cahyadsn/wilayah`
(keyless `nama→code` join for all 515 kab); Wikidata SPARQL (keyless ibukota/pop/area).

Researched, reassessed — NOT wiring as-is (see PLAN_LOG §4.5 for the why):
SPPG/MBG kitchens (BGN FeatureServer empty on probe → needs worker proxy); BIG health
(`BANGUNANDANFASUM` is fragmented per-sheet, incomplete national → pivot to OSM Overpass);
BNPB (`dibi.bnpb.go.id` is now a Superset dashboard, `gis.bnpb.go.id` down → PetaBencana
already covers live hazards); WDPA (license forbids redistribution + non-commercial → prefer
open GFW/OSM); GFW deforestation (free API, still a candidate).

## TRIVIAL — wire these first

| Metric | Endpoint | Auth | Cadence |
|---|---|---|---|
| Gempa (BMKG) | `data.bmkg.go.id/DataMKG/TEWS/autogempa.json` (+ `gempaterkini.json`) | none, sebut sumber | real-time |
| BTC/ETH dalam Rp | `api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=idr` | none | ~1 min |
| Kurs USD/IDR | `open.er-api.com/v6/latest/USD` · `api.frankfurter.app/latest?from=USD&to=IDR` · resmi: JISDOR SOAP `bi.go.id/biwebservice/wskursbi.asmx` | none | harian |
| Kualitas udara | `api.waqi.info/feed/jakarta/?token=…` (token gratis, email saja) | free token | per jam |
| IHSG | `query1.finance.yahoo.com/v8/finance/chart/%5EJKSE` (IDX sendiri di balik Cloudflare) | none | harian |

## EASY

| Metric | Endpoint | Notes |
|---|---|---|
| Inflasi/CPI + UMP | `webapi.bps.go.id/v1/api/…` | free key; bot-protection dari IP datacenter dilaporkan |
| Panel harga pangan | `api-panelhargav2.badanpangan.go.id/api/front/…` | unofficial frontend API — **sinyal harian terbaik**, bisa berubah |
| Deforestasi | `data-api.globalforestwatch.org` (GLAD/integrated, per wilayah admin) | free key |
| Emas Antam | scrape `logammulia.com/id/harga-emas-hari-ini` (09.30 WIB, Sen–Sab) | wrapper komunitas ada |
| Katalog + bencana | CKAN `data.go.id/api/3/action/package_search` · **BNPB `dibi.bnpb.go.id`** (GeoJSON stabil) | none |

## SCRAPE

- **BBM**: `mypertamina.id/fuels-harga` — tabel per provinsi, ganti ~tanggal 1.
- **Tarif PLN**: `web.pln.co.id/...tariff-adjustment` — kuartalan.
- **Agenda presiden**: `setkab.go.id/category/berita/` (WordPress → RSS +
  `wp-json/wp/v2/posts`) — tidak ada feed agenda terstruktur; ekstraksi
  lokasi/perjalanan dari berita harian (NLP, fuzzy tapi feasible).
- **Putusan MA**: `putusan3.mahkamahagung.go.id` — korpus raksasa, ribuan
  putusan/hari, tapi server kronis lambat; paginasi pelan-pelan.
- **Dana Desa**: `djpk.kemenkeu.go.id/portal/data/tkdd` + dashboard SIKD —
  alokasi per desa (tahunan), file Excel/PDF.
- **Jumlah kementerian lintas rezim**: Wikipedia API + setkab — teknisnya
  trivial, tapi dataset statis sekali-jadi (pas untuk grafik sejarah).
- **Gaji DPR**: PP 75/2000, Keppres 59/2003, S-520/MK.02/2015 (PDF di
  peraturan.bpk.go.id) — riset sekali, jadi explainer abadi.

## HARD / DEAD

- **RUU per tahun + lama draf→sah**: dpr.go.id tanpa API; Prolegnas = PDF
  BPHN. HARD sebagai otomasi, EASY sebagai grafik historis rakitan tangan
  (DPR 2019–2024 mengesahkan 225 UU — Kompas).
- **APBN**: `data.anggaran.kemenkeu.go.id` & `data.treasury.kemenkeu.go.id`
  **DNS mati**; APBN KiTa = PDF bulanan. Mining PDF saja.
- **Anggaran operasional presiden**: hanya lampiran DIPA/RKA-KL tahunan (PDF).

## Delapan feed harian terbaik (urutan pemasangan)

1. BMKG gempa · 2. USD/IDR · 3. CoinGecko · 4. WAQI udara ·
5. Panel Harga Pangan · 6. IHSG ^JKSE · 7. Emas Antam · 8. BNPB bencana

Pengisi irama lambat: BBM (bulanan), tarif PLN (kuartalan), CPI BPS
(bulanan), berita Setkab (harian, butuh ekstraksi).

---

## Lensa kabupaten (riset kelayakan, Jun 2026)

Lensa Daerah kini menampung 38 provinsi (data contoh). Langkah berikutnya
adalah turun ke 514 kabupaten/kota. Temuan agen riset:

**BPS WebAPI** memilih wilayah lewat parameter `domain` (2 digit provinsi
atau 4 digit kabupaten/kota). Butuh kunci gratis. Untuk satu metrik di 514
kabupaten, lebih praktis melooping 38 domain provinsi (tiap domain memuat
kabupatennya sebagai baris `vervar`) ketimbang 514 domain.

**Jebakan kode wilayah:** kode BPS (Wilkerstat) berbeda dari kode
Kemendagri. API BPS memakai kode BPS, sedangkan batas/GeoJSON dan APBD
sering memakai kode Kemendagri. Wajib pakai tabel jembatan: SIG BPS
"bridging-kode" (sig.bps.go.id/bridging-kode) atau repo `zakiego/
Kode-Wilayah-Administrasi-Indonesia-Relasi-BPS-Kemendagri`.

**Master kode wilayah:** `cahyadsn/wilayah` (Kepmendagri 300.2.2-2430/2025).

**GeoJSON kabupaten:** geoBoundaries IDN ADM2 simplified (CC BY 4.0, ~beberapa
MB, 522 fitur — rekonsiliasi ke 514 lewat kode), atau `cahyadsn/
wilayah_boundaries` bila ingin kode yang langsung cocok dengan master.

**Tidak ada satu tabel kabupaten gabungan.** Rakit per metrik. Peringkat
kelayakan (paling mudah dulu):

1. Penduduk · BPS WebAPI + Dukcapil/Satu Data · TRIVIAL
2. Kemiskinan (P0) · BPS WebAPI, 514 lengkap, tahunan · MUDAH
3. IPM · BPS WebAPI, 514 lengkap, tahunan · MUDAH
4. Capaian pendidikan · Rapor Pendidikan (Excel) · MUDAH/SCRAPE
5. APBD & rasio belanja pegawai · DJPK SIKD (djpk.kemenkeu.go.id) · SCRAPE
6. UMK · 38 SK gubernur · SCRAPE
7. Pengangguran terbuka (TPT) · BPS Sakernas (Agustus, caveat) · SCRAPE
8. Stunting · SKI/SSGI (PDF, kadang) · SCRAPE/HARD

Tunda: Gini ratio (cakupan kabupaten tak lengkap) dan rasio dokter
(SISDMK, hanya PDF/portal). Sandbox memblokir sebagian fetch primer;
verifikasi ukuran GeoJSON dan teks dokumentasi WebAPI sebelum implementasi.

---

## Lampiran R4 — Sumber independen (riset, Jun 2026)

Prinsip redaksi: **jangan biarkan negara sekaligus *menghasilkan* dan
*menarasikan* angka.** Sumber negara (BPS, BMKG, DJPK, BPK, KPK, MA) dipakai
sebagai *baseline*, tapi framing dirutekan lewat pemantau independen. Outlet
milik negara (ANTARA) tidak dipakai sebagai suara utama.

### Berita (ticker + Ringkas Pagi) — set RSS yang dipakai
ANTARA (kantor berita negara) DICORET. Set independen:
- Tempo `https://rss.tempo.co/nasional` (+/politik,/ekonomi) — investigatif, IFCN
- BBC News Indonesia `https://feeds.bbci.co.uk/indonesia/rss.xml`
- Project Multatuli `https://projectmultatuli.org/feed/` — kepentingan publik, CC
- Jubi `https://jubi.id/feed/` — suara independen Papua
- KBR `https://kbr.id/feed` — kantor berita radio independen
- Mongabay Indonesia `https://news.mongabay.com/feed/?lang=id` — lingkungan
Opsional: The Conversation ID (CC, Atom `/id/articles.atom`), Tirto (lewat RSS-bridge),
Katadata (ekonomi), Narasi. Kompas/CNN dipakai untuk keluasan TAPI ditandai
konglomerasi. Catatan worker: kirim User-Agent mirip-peramban (situs mem-403 agen
datacenter); probe tiap /feed/ + /wp-json/ sekali dari worker.

### Data independen per kanal (lapisan cek-silang)
| Kanal | Independen (utama) | Baseline negara (dicek-silang) |
|---|---|---|
| hukum/korupsi | ICW (tren penindakan), TII (CPI, tahunan) | KPK, MA |
| anggaran/fiskal | CELIOS, INDEF | BPS (key), DJPK, BPK |
| hutan/lingkungan | GFW/WRI (API, key), Auriga (STADI), Walhi, Greenpeace ID | KLHK |
| aparat/HAM | KontraS, YLBHI, LBH Jakarta, Imparsial, Lokataru | pernyataan resmi |
| daerah | jejaring LBH, Jubi (Papua) | DJPK, BPS daerah |
| harga/ekonomi | CELIOS, INDEF, Katadata (databoks) | BPS (CPI) |
| tambang/energi | JATAM, Trend Asia | ESDM |
| bencana | — | BMKG (keyless; quakes/cuaca) |

API sejati (sisanya RSS/wp-json atau scrape PDF): **BMKG** (keyless), **BPS WebAPI**
(key gratis), **GFW Data API** (key gratis). Angka NGO umumnya di dalam PDF naratif:
RSS untuk notifikasi → ekstraksi angka (LLM/manual) → fact-gate.
