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
- **Climate TRACE v6** (asset-level CO₂e) — keyless, CC-BY. See the canonical CO₂ entry below: it is now **non-power + vendored static**. v6 carries coords in **`Centroid.Geometry`** (not `bbox`) + `EmissionsSummary[0].EmissionsQuantity`.
- **NASA GIBS IMERG** (rainfall) — `gibs.earthdata.nasa.gov/wmts/epsg3857/best/IMERG_Precipitation_Rate/default/{date}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`, keyless. ~3-day lag (request a past date). "HUJAN" overlay.
- **Crossref REST — research metadata (DARI JURNAL, 2026-07-13)** — `api.crossref.org/works`, keyless, open CORS, open metadata (`mailto=` politeness param). Two tiers: (1) **the judged stash** — each newsroom run `newsroom/ilmu.py` pulls the month's `query.bibliographic=indonesia` batch (rows=40, recall not precision), the model keeps only work truly ABOUT Indonesia and writes one plain-Indonesian line why (Lane C, deterministic gate: bounded, link-free, index-must-exist), merged by DOI into `newsroom/data/atlas/jurnal.json` (12 deep, retires after ~28 editions; committed by the Actions job → baked at deploy); (2) **live fallback** in `AlmanakSains.svelte` when the stash is empty (client fetch, keyword regex). **GOTCHA:** publishers file garbage future dates (2150…) that `sort=published&order=desc` floats to the top → filter `thn <= year+1`. Titles verbatim (Lane A); every row links to its DOI.
- **BIG Rupabumi** (`geoservices.big.go.id/rbi`) — authoritative One-Map, **browser-direct** (CORS reflects origin), `f=geojson`. Used: province polygons (`BATAS_WILAYAH` layer 12), kabupaten (`Administrasi_AR_KabKota_50K`), province boundary lines (layer 8). **GOTCHA:** the BPS code fields (`KDPBPS`/`KDBBPS`) come back **blank** → join by NAME (`WADMPR`/`WADMKK`). Replaced the inaccurate bundled province polygons + powers the kabupaten drill-down.
- **GEM Global Coal Plant Tracker** (PLTU fleet + pipeline) — vendored from `raw.githubusercontent.com/GreenInfo-Network/coal-tracker-client` (CC-BY, Jan 2026 release). 111 IDN plants aggregated from 502 unit-rows, by status (beroperasi/konstruksi/rencana), `public/data/idn-batubara.geojson` (28KB). "PLTU BATU BARA" layer, sized by MW. Vendored not hot-linked; re-vendor on GEM's ~biannual (Jan/Jul) release. Complements Climate TRACE (emissions-now vs. build-pipeline).
- **Smithsonian GVP volcanoes** (registry) — `webservices.volcano.si.edu/geoserver/GVP-VOTW/ows` WFS, `CQL_FILTER=Country='Indonesia'`, GeoJSON. **101 Holocene volcanoes** with authoritative summit lat/lon + elevation + primary type + last-eruption year. Vendored to `public/data/gunungapi-id.json` (10KB) via `scripts/build-gunungapi.mjs` (regenerable). Summits are static so they ship bundled; only today's **alert level** is live.
- **MAGMA ESDM / PVMBG** (alert levels) — `magma.esdm.go.id/api/v1/magma-var`, **token-gated** (`Authorization: Bearer`). Worker `/geo/gunungapi` uses `env.MAGMA_TOKEN` if set, **content-type-guarded** (the public `/v1/gunung-api/*` URLs return HTML 200 / 404 — never JSON, so they silently failed before). Levels merge onto the GVP registry **by name**; without a token the UI honestly shows "registri GVP · status menyusul".
- **NASA FIRMS** (fire/hotspots) — `firms.modaps.eosdis.nasa.gov/api/area/csv/{key}/VIIRS_NOAA20_NRT/{bbox}/1`, worker `/geo/kebakaran`. **True VIIRS lat/lon** per pixel (~310 hotspots live, verified) — NOT centroids. Empty in the wet season → layer shows NIHIL honestly. "TITIK API" layer sized by FRP.
- **ESDM Geoportal — mining concessions (IUP/WIUP)** — `geoportal.esdm.go.id/gis1/.../Join_WIUP_vs_IPPKH/MapServer/0`, open + CORS, WGS84. **4,797 permit polygons** (company, commodity, activity, area, Clean-&-Clear). Vendored generalised to `public/data/idn-tambang.geojson` (1.9 MB) via `scripts/build-tambang.mjs`. "TAMBANG · IUP" layer coloured by commodity group.
- **cahyadsn/wilayah (Kemendagri 2025)** — `raw.githubusercontent.com/cahyadsn/wilayah/.../db/wilayah_level_1_2.sql`, keyless. The authoritative `nama→code` join + ibukota/penduduk/luas/lat-lon for all **514** kab. Vendored to `public/data/idn-wilayah.json` (72 KB) via `scripts/build-wilayah.mjs`; powers the kabupaten dossier (expand-in-place).
- **Climate TRACE v6 (CO₂ emitters · NON-power)** — `api.climatetrace.org/v6/assets?countries=IDN&sectors={manufacturing|mineral-extraction|fossil-fuel-operations}`, keyless, CORS `*`, CC-BY. **Power deliberately excluded** — the power sector's top emitters ARE the coal plants already in the `batubara` layer, so including them made the CO₂ dots land on the coal dots (the "same 3 PLTU" complaint). Now surfaces the OTHER heavy industry: steel/cement (Dexin Steel Morowali), mineral extraction, oil & gas ops (Bintuni LNG, conventional onshore). **Top 200 by tonnage vendored** to `public/data/idn-emisi.geojson` via `scripts/build-emisi.mjs` (the old 4-way live `Promise.all` was flaky on phones). **GOTCHA:** v6 coords live in **`Centroid.Geometry` [lon,lat]** (the stale `bbox` read silently fell back to contoh). "EMISI CO₂ · INDUSTRI" layer.
- **Mandum Rimba — threatened-species ranges** — `www.mandumrimba.org/data/species-distribution.geojson`, keyless, **CORS `*`**, ~227 KB. **151 IUCN-classified range polygons** (mammalia/aves/reptilia/amphibia), each with `species: [[name, IUCN-code], …]` + a `date` span — compiled by the open observatory Mandum Rimba from GBIF + IUCN Red List + ESA WorldCover (license: derivative CC-BY family; credit Mandum + GBIF/IUCN). **Browser-direct** (no re-host of their IUCN-derived data), lazy-loaded on first toggle, contoh fallback. "SATWA TERANCAM" layer. **MapLibre gotcha:** the `species` array is stringified on click-read → `JSON.parse` defensively. Their `/sumber-data` page is a vetted upstream manifest (see research note G).
- **Daftar Merah Nusantara — endemic-species registry** — hand-curated fact-desk ledger, bundled at `newsroom/data/atlas/satwa.json` (**30 species** endemic or near-endemic to Indonesia, spanning the IUCN risk ladder: CR 15 / EN 7 / VU 5 / NT 2 / LC 1, across 5 taxa and 7 island regions). Per row: Indonesian + scientific name, taxonomic class, IUCN category (`status`/`statusUrut`), population trend, endemism (`endemik`, `sebaran`), a sourced population figure or `null` (citation-or-silence: no unsourced number), a threats list, a short cited `ringkas`, plus `wikipedia` (id.wikipedia article, the fetchable per-row citation, verbatim-derived summary) and `gambar` (verified Wikimedia Commons file). **Authority:** IUCN Red List (categories, named per row as `iucn.otoritas`) corroborated by the cited id.wikipedia article, which states the category inline for most entries; assessment notes (e.g. Komodo VU→EN 2021, Trulek jawa Extinct 1994→CR) in `iucn.catatan`. IUCN's own species pages block bots (403), so status is cited to the fetchable Wikipedia article + named IUCN authority (same house standard as `SisaAlam` / the Mandum layer), never a fabricated assessment URL. Images are verified Commons URLs; license/attribution left to live enrichment (like `WajahNusantara`) rather than hardcoded unverified. Rebuildable by hand; not yet wired to a page component (when wired, add a `sumber.astro` row).
- **Setkab RSS — the executive activity record (AGENDA ISTANA, wave 9c 2026-07-05)** — `setkab.go.id/feed/` (+ `?paged=2,3`), keyless, **full-text** `content:encoded` (~6,5k chars incl. complete speech transcripts). Transcript titles carry a fixed grammar (venue, kota, `Provinsi X`, event date) parsed DETERMINISTICALLY (regex + word tables, no model) by `newsroom/sources/agenda.py` → accumulating archive `newsroom/data/agenda_istana.json` (merge by URL, prune 600, every row cites its post). **TLS gotcha:** incomplete chain server-side → verified fetch first, host-scoped unverified fallback documented in the module. Refreshed 2×/day by the **stdlib-only `agenda.yml` cron** (runs even while `NEWSROOM_ENABLED=false`) AND by the newsroom when it wakes; data commits drop `[skip ci]` so fresh rows bake into the deploy. `presidenri.go.id` = Cloudflare 403 (dead for datacenter). Feeds: AgendaIstana island, SKOR eksekutif live tile, LAYAR GANDA kiri.
- **Wikidata SPARQL — partai enrichment (wave 9g 2026-07-05)** — `query.wikidata.org`, keyless, CC0. Current governors (position P279 `Q132050` + P17 `Q252`, no end date, start ≥ 2025) → `newsroom/data/partai_gubernur.json` via `scripts/fetch-partai.mjs`; coverage printed honestly (6/38 at first harvest), multi-P102 counted as "afiliasi ganda", never guessed. **DPR member entities are NOT current-term-reliable** (only 13 rows carry a 2024+ start qualifier — probed) → kursi DPR live in the curated `newsroom/data/partai_registry.json` (KPU 2024 allocation, receipts, Yose-review flagged); registry aliases also drive the kliping desk's deterministic partai tagger (`Kliping.partai`). `kspservices.big.go.id/satupeta/rest/services/PUBLIK/PERIZINAN_DAN_PERTANAHAN/MapServer/{id}/query`, keyless, **CORS (reflects origin)**, WGS84 (`outSR=4326`), **server-side generalization** `maxAllowableOffset=0.005&geometryPrecision=3` (like `build-tambang.mjs`). Vendored to `public/data/idn-konsesi.geojson` (~1,040 polys, 0.8 MB) via `scripts/build-konsesi.mjs`: **logging** IUPHHK-HA (layer 1, 255) + **HTI** IUPHHK-HT (layer 2, 292) nationwide; **sawit** = per-kabupaten Izin Usaha (sublayers 51-57) + Izin Lokasi (28-49), ~493, **partial coverage**. Source = KPK Stranas-PK perizinan dataset (Ministry of Environment & Forestry). **GOTCHAS:** rings arrive as `[lng,lat,0,null]` (strip Z/M); `maxRecordCount=1000` (page on length<1000); 3 schemas (forestry `namobj`/`lssk`/epoch-ms; sawit-usaha `nama_prsh`/`luas_ha`/text-date; sawit-lokasi `nmr_sk_il`/`luas_sk_il` Indonesian-number-string) → normalize. **Why not GFW:** its oil-palm/wood-fiber/logging are "CC BY 4.0 **excluding Indonesia**" — the IDN slice is carved out; this open government original is the clean substitute (research note H). "KONSESI · HTI/HA/SAWIT" layer, coloured by `jenis`, pairs with TAMBANG.
- **SPPG · Makan Bergizi Gratis kitchens** — `sismonbgn.com` (third-party monitor; **no CORS**, data inline as `var rawData`). **Vendored** to `public/data/idn-sppg.geojson` (~5,598 pts, 1.5 MB) via `scripts/build-sppg.mjs` (string-aware bracket parse of `rawData`; clips junk coords; rounds to 5 dp). Fields: `id`, `status`, `alamat`. **SPPG-dot** circle layer coloured by status. **HONESTY (Iron Law #1):** dated snapshot, mostly NOT operating — **~28 "Beroperasi" of ~5,598** (2,799 "Penentuan KA SPPG", 2,771 "Belum Beroperasi"); labelled *terdaftar/diajukan*, legend prints `28 OPERASI / 5.598`, never an operating census. Official BGN (`operasional-sppg`, `gina.bgn.go.id`) WAF/login-walled. Re-vendor to refresh.

**Verified candidates — extraction · forest · regency/province stats (2026-06-27):**
a full probed catalog lives in `docs/research/2026-06-27-civic-data-sources.md`.
Headlines (all live-tested): ESDM Geoportal `gis1` mining concessions (4,797 polygons,
open + CORS, browser-direct), ESDM power fleet (3,588) & oil-gas blocks (215); BIG
SatuPeta peatland (open + CORS); GFW concession downloads (key-free CSV w/ geometry);
BPS WebAPI (free email key, **kabupaten** granularity, WAF-guarded); `cahyadsn/wilayah`
(keyless `nama→code` join for all 515 kab); Wikidata SPARQL (keyless ibukota/pop/area).

**Verified candidates — round 2 (2026-06-28, see research note G):**
- **SPPG / Makan Bergizi Gratis kitchens** — `sismonbgn.com` (third-party Leaflet monitor), **~5,600 points** inline as `var rawData=[…]` (`id_sppg`, `status_pengajuan`, `alamat`, `latitude`, `longitude`) + per-province totals at `/statistik`. Keyless but **NO CORS** → thin **worker-proxy** to fetch+parse→GeoJSON. Official BGN (`operasional-sppg`, `gina.bgn.go.id`) is WAF/login-walled + coordinate-less. **HONESTY CAVEAT:** early-2025 snapshot (~28 "Beroperasi" vs BGN's ~26k claim) → label **terdaftar/diajukan**, dated, NOT a live operating census.
- **Mandum Rimba `/sumber-data` shopping list** (fetch from PRIMARY, not via Mandum): **GFW concessions** sawit/HTI/logging (CC-BY 4.0, GFW Open Data Portal — the prize for a clean concession polygon set); **Maus et al. 2022 mining footprints** (CC-BY 4.0, PANGAEA `doi.org/10.1594/PANGAEA.942325`, vendor clipped IDN); GADM 4.1 admin (**non-commercial** — watch-out). Mandum's own export API is no-CORS + half-empty; only the species geojson (wired above) is hostable directly.

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

- **PANTAU NEGARA lanes (wave 10, 2026-07-05)** — `newsroom/pantau.py` core + `pantau.yml` cron (stdlib, keyless, 2×/day). **lembaran**: peraturan.bpk.go.id per-jenis newest-first (jenis 8 UU · 9 Perpu · 10 PP · 11 Perpres · 12 Keppres · 13 Inpres; Details page carries Tanggal Penetapan/Pengundangan; budget 40 detail-fetches/run, current-year backfill converges) → `uu_lembaran.json`. **suara**: 7 verbatim Lane A channels — emedia.dpr.go.id/rss.xml (full-text, intraday, THE side door), kemhan.go.id/feed, tniad.mil.id/feed, gerindra.id/feed, pks.id/rss, kontras.org/feed, antikorupsi.org/rss.xml → `suara_negara.json` (per-lane prune 60). **agenda** now also pulls wapresri.go.id/feed (aktor WAPRES). Parked: MA berita (jdih.mahkamahagung.go.id HTML), MK putusan PDFs (peraturan.go.id/putusan), Perda (jenis=18), ISB LKPP (free key, needs-Yose). Full probe cookbooks: docs/research/2026-07-05-pantau-*.md (LOCAL ONLY — docs/ gitignored).
