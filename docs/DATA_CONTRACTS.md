# DATA_CONTRACTS.md — Lembaran

> The rows come first. Everything else is downstream of what the rows look like.
> This doc is the constitution of the data layer: the canonical key, the schemas,
> the graph, the provenance model, the sources, and the daily manifest. Read
> alongside `CLAUDE.md` (the laws) and `COMMAND_CATALOG.md` (how the agent queries
> all of this).

---

## 0. Principles

- **These datasets are heavy to collect, light to serve.** Raw scrapes are bulky;
  refined artifacts are megabytes. The whole architecture rides on that asymmetry:
  collect and refine at build time, serve tiny static artifacts.
- **Build time vs serve time.** DuckDB in GitHub Actions transforms raw data into
  Parquet. DuckDB-WASM in the browser queries that Parquet over HTTP range requests.
  No database server exists anywhere.
- **Every number carries its receipt.** Provenance is not a column you add later. It
  is part of the row from the moment of ingestion.

---

## 1. The canonical key: the region table

Every Indonesian civic dataset joins on one foreign key: **kode wilayah**
(Kemendagri / BPS region codes). This table is the spine of the entire join graph.
Get it right before anything else.

### Source of truth

- Primary: HDX COD-AB (BPS-sourced administrative boundaries, adm0 through adm4,
  with pcodes, reviewed for accuracy Oct 2024).
- Geometry: `dmxsan/indonesia-admin-boundaries` (processed GeoJSON from official BIG
  shapefiles) for national/province/district levels. GADM and OSM extracts as
  fallback only.
- Tiles: dissolve and convert to PMTiles at build time. One static `.pmtiles` file
  per admin level, range-streamed by MapLibre. Never ship raw GeoJSON to the client.

### Schema: `regions.parquet`

| field | type | notes |
|-------|------|-------|
| `kode` | string | canonical region code, the join key everywhere |
| `level` | int | 0 national, 1 provinsi, 2 kabupaten/kota, 3 kecamatan, 4 desa/kel |
| `name` | string | official name |
| `parent_kode` | string | parent region code, null for level 0 |
| `pcode` | string | HDX pcode, for cross-referencing humanitarian datasets |
| `lat`, `lon` | float | centroid, for `fly_to` and label placement |
| `bbox` | float[4] | bounding box, for map framing |
| `pop` | int | population (BPS), for per-capita denominators |

> v1 scope: levels 0 through 2 (national, provinsi, kabupaten/kota). 514-ish
> kabupaten/kota is the unit of the dossiers and most lenses. Go deeper only when a
> lens needs it.

---

## 2. The provenance model

Every ingested record, in every table, carries these columns. No exceptions.

| field | type | notes |
|-------|------|-------|
| `source_id` | string | FK into the SOURCES ledger (section 7) |
| `source_url` | string | exact URL the record came from |
| `retrieved_at` | timestamp | when the pipeline fetched it (UTC) |
| `content_hash` | string | sha256 of the raw record as fetched |

### Signed dataset manifests

Each nightly build emits a `manifest.json` per dataset: the list of artifact files,
their hashes, the build timestamp, and the run ID. The manifest is signed (this is
the HSM-attestation pattern pointed at public data). Readers, journalists, and rival
tools can verify that an artifact is the one the pipeline produced and was not
altered downstream. The signed, hash-chained corpus is itself a product: when a
government portal rots (see section 7 fragility ratings), our mirror is the durable
copy, and its provenance is verifiable.

---

## 3. Artifact conventions

| artifact kind | format | lives in | served how |
|---------------|--------|----------|------------|
| Structured tables | Parquet | R2 (or Releases) | DuckDB-WASM range requests |
| Geometry | PMTiles | R2 | MapLibre native range streaming |
| Small daily manifests | JSON | repo / Pages | fetched whole |
| Full-text index | Pagefind | Pages | fragment lazy-load per query |
| Graph | Parquet (nodes, edges) | R2 | loaded into graphology client-side, or walked with DuckDB CTEs |
| Embeddings (tier 2 search) | Parquet (quantized) | R2 | brute-force cosine in WASM over Pagefind candidates |
| Share-card assets | PNG/SVG templates | Pages | canvas-rendered client-side |

Rule: anything a casual reader does not need on first paint goes behind a lazy-load
boundary. DuckDB-WASM (several MB) loads only when the terminal is first used.

---

## 4. Per-lens table schemas

Each lens contributes one or more tables. All carry the provenance columns from
section 2 implicitly (omitted below for brevity).

### 4.1 Hukum: `putusan.parquet`

The Justice Gradient corpus. Extracted from Direktori Putusan MA at build time by
the Hukum desk (LLM structured extraction over messy ruling PDFs, with a fact-gate
pass).

| field | type | notes |
|-------|------|-------|
| `perkara_id` | string | MA case identifier |
| `kategori` | enum | `korupsi`, `pencurian`, ... (v1: korupsi + pencurian) |
| `kerugian` | int | rupiah loss to state, null if n/a (the scatter X axis) |
| `vonis_bulan` | int | sentence in months (the scatter Y axis) |
| `vonis_jenis` | enum | `penjara`, `bebas`, `onslag`, `denda_saja` |
| `pasal` | string[] | charged articles |
| `pengadilan` | string | court name |
| `kode` | string | region of the pengadilan (FK to regions) |
| `tanggal` | date | ruling date |
| `tingkat` | enum | `pn`, `banding`, `kasasi` (which instance) |
| `extract_confidence` | float | 0..1, low-confidence rows flagged for spot-check |
| `ruling_excerpt` | string | short verbatim quote for the case panel (law 3) |

Two decisions this schema forces, documented here so the desk is deterministic:

- **The banding/kasasi chain.** The "sentence" that counts is the final
  binding instance available (kasasi if present, else banding, else PN). Store all
  instances but mark the binding one with `is_final = true`. The scatter plots only
  finals.
- **Bebas / onslag.** Acquittals plot at `vonis_bulan = 0` with `vonis_jenis`
  preserved, so the curve honestly shows the floor.

### 4.2 Anggaran: `apbd.parquet`

| field | type | notes |
|-------|------|-------|
| `kode` | string | region (FK) |
| `tahun` | int | budget year |
| `total` | int | total APBD |
| `belanja_pegawai` | int | personnel spend (the headline line of the struk) |
| `belanja_modal` | int | capital spend (infrastructure proxy) |
| `belanja_barang_jasa` | int | goods and services |
| `belanja_lainnya` | int | the remainder |
| `per_kapita` | int | total / pop, computed at build time |

Editorial roll-up choices (which sub-accounts fold into each line) are documented in
`EDITORIAL_GUIDELINES.md`, not invented per build.

### 4.3 Transfer daerah: `transfer.parquet`

Feeds the Ekonomi Sankey. Center-to-region fiscal flows (DJPK).

| field | type | notes |
|-------|------|-------|
| `kode` | string | receiving region (FK) |
| `tahun` | int | year |
| `dau` | int | dana alokasi umum |
| `dak` | int | dana alokasi khusus |
| `dbh` | int | dana bagi hasil |

### 4.4 Hutan: `alerts.parquet`

Daily. GFW integrated deforestation alerts (GLAD/RADD).

| field | type | notes |
|-------|------|-------|
| `alert_id` | string | GFW alert id |
| `kode` | string | region (FK), derived by point-in-polygon at build time |
| `tanggal` | date | alert date |
| `hektar` | float | area; `lapangan_bola` conversion computed in `EDITORIAL` registry |
| `lat`, `lon` | float | for the map embers and before/after tiles |
| `dalam_konsesi` | bool | overlaps a known concession boundary (shown as side-by-side documents, never as accusation) |
| `konsesi_ref` | string | concession permit reference, if overlapping |

### 4.5 Janji: `janji.parquet` and `realisasi` linkage

The promise ledger. First-class citizen. A promise is a primary document (RPJMD
target, APBD allocation goal, SDG national target with attached figure, official
dated pernyataan). The outcome is a measured number from another table.

`janji.parquet`:

| field | type | notes |
|-------|------|-------|
| `janji_id` | string | stable id |
| `kode` | string | region or `ID` for national (FK) |
| `teks` | string | the promise, verbatim or close paraphrase |
| `target_nilai` | float | the promised figure |
| `target_satuan` | string | unit (%, rupiah, count) |
| `target_tanggal` | date | deadline |
| `sumber_dok` | string | the primary document it came from |
| `metric_ref` | string | which metric/table measures the outcome |

Grading is computed at build time by joining `metric_ref` to the live measured value
and comparing against `target_nilai` / `target_tanggal`. Status enum:
`tercapai`, `tidak_tercapai`, `berjalan`, `data_tidak_tersedia`. The last status is
not a gap to hide; it feeds the Data Hilang beat (section 4.7).

### 4.6 Harga: `harga.parquet`

Daily. PIHPS / Bapanas food prices. Feeds the Ekonomi price wave.

| field | type | notes |
|-------|------|-------|
| `kode` | string | region (FK) |
| `tanggal` | date | |
| `komoditas` | enum | `cabai`, `beras`, `minyak_goreng`, ... |
| `harga` | int | rupiah per unit |
| `delta_pct` | float | day-over-day change, for the wave intensity |

### 4.7 Data Hilang: derived, not ingested

No new source. A build-time pass over every table that records, per region per
metric, whether the expected row exists. Emits `ketersediaan.parquet`:
`kode`, `metric_ref`, `ada` (bool), `terakhir_ada` (date). Absence is the story.

### 4.8 Arsip: `arsip.parquet`

Public-domain art and colonial-archive photography. Pre-1900 works and
out-of-copyright archive material only (life + 70; Raden Saleh yes, Affandi no, see
`EDITORIAL_GUIDELINES`). Sources: Rijksmuseum API, Wikimedia Commons.

| field | type | notes |
|-------|------|-------|
| `art_id` | string | |
| `judul` | string | title |
| `pembuat` | string | maker, may be "tidak diketahui" |
| `tahun` | string | year or range |
| `kode` | string | geo-tagged region the work depicts (FK), if determinable |
| `img_url` | string | image URL (public domain) |
| `tersimpan_di` | string | where the physical work sits today (the quiet caption) |

### 4.9 The cross-cutting tables

`temuan.parquet` (the findings feed, produced by the newsroom):

| field | type | notes |
|-------|------|-------|
| `temuan_id` | string | stable id, permalink slug |
| `edisi` | int | which edition surfaced it |
| `lens` | enum | which section |
| `kode` | string | region (FK) |
| `headline` | string | cited fact, obeys law 3 |
| `body` | string | narration, every claim cites row ids |
| `cited_ids` | string[] | the exact rows backing every claim (fact-gate verified) |
| `skor` | float | newsworthiness rank, decides the lead |
| `signature_viz` | enum | which artifact renders it (scatter, struk, ember, sankey, ...) |

---

## 5. The graph ontology

Steal LightRAG's idea (LLM extracts entity-relation graph at index time, retrieval
walks it at query time), skip its runtime. Two Parquet files. The country's civic
graph is tens of thousands of nodes, trivial to load into graphology client-side or
walk with recursive CTEs in DuckDB-WASM.

`nodes.parquet`: `node_id`, `type`, `label`, `kode` (if geo).
Node types: `pejabat`, `instansi`, `perusahaan`, `konsesi`, `wilayah`, `perkara`,
`tender`, `janji`.

`edges.parquet`: `src`, `dst`, `rel`, plus provenance columns.
Edge types: `menjabat_di`, `memenangkan`, `berlokasi_di`, `melibatkan`,
`overlap_wilayah`, `dialokasikan_ke`, `berjanji`.

Multi-hop questions ("perusahaan mana yang menang tender di wilayah yang konsesinya
overlap wilayah adat") become two-hop graph walks in the browser in milliseconds. A
knowledge graph with zero graph database.

---

## 6. The lens socket interface

Every lens is a four-socket plug into the chassis. This is the contract that makes
each new lens a weekend instead of a project. A lens MUST provide:

1. **Map skin.** How it re-paints the single shared map (a tint, a point set, an
   ember layer, a wave). One primary layer at a time (see the map law in DESIGN).
2. **Feed source.** A rule that turns its rows into `temuan` cards (an outlier
   query, a daily delta).
3. **Sheet panel.** The signature artifact rendered in the bottom sheet / side pane
   (the scatter, the struk, the obituary card, the sankey).
4. **Dossier section.** What this lens contributes to a region's auto-generated
   profile page.

A lens that fills these four sockets works everywhere automatically: map, feed,
dossiers, tours, share-cards. Launch lenses: Hukum, Anggaran, Hutan. Janji and the
Cermin games plug the same sockets (games skip the map skin).

---

## 7. The SOURCES ledger

Every source, its access method, cadence, fragility, and whether it needs the Pi
relay (an Indonesian residential IP that fetches geo-blocked sources on cron and
pushes raw artifacts to the repo, where Actions takes over). Fragility informed by
`suryast/indonesia-gov-apis`: roughly 28% of government portals have dead DNS, plus
geo-blocks and Cloudflare bot protection, with no public status page. Our signed
mirror is the durable copy.

| source_id | what | access | cadence | fragility | pi-relay |
|-----------|------|--------|---------|-----------|----------|
| `cod_ab` | region boundaries | HDX download | annual | low (intl) | no |
| `big_geo` | geometry | GitHub repo | annual | low | no |
| `putusan_ma` | court rulings | scrape Direktori Putusan | daily volume | high (CF-block risk) | maybe |
| `djpk_apbd` | APBD | portal / file | quarterly | medium (geo-block risk) | likely |
| `djpk_transfer` | transfer daerah | portal / file | annual | medium | likely |
| `bps_api` | IPM, poverty, literacy | WebAPI BPS (token) | annual | medium | no |
| `pihps` | food prices | PIHPS/Bapanas API | daily | medium | maybe |
| `gfw_alerts` | deforestation | GFW integrated alerts API | daily | low (intl) | no |
| `bmkg` | gempa | BMKG API | real-time | low | no |
| `lhkpn` | asset declarations | e-LHKPN (KPK) | annual | high | maybe |
| `sdg_target` | SDG national targets | Bappenas dashboard | annual | medium | no |
| `kpu_dana` | campaign finance | KPU | seasonal | medium | maybe |
| `rijks` | public-domain art | Rijksmuseum API | static (rotate) | low (intl) | no |
| `wikimedia` | public-domain art | Commons API | static (rotate) | low (intl) | no |
| `rss_*` | external news (Lane A) | publisher RSS | hourly | low | no |

Each source's fragility drives a mirror policy: high-fragility sources get the most
aggressive archival, because the value of our copy rises as the original rots.

---

## 8. Refresh cadence (honest)

Sections declare their own rhythm. The paper is daily because enough of it genuinely
is. Each section footer states `Data diperbarui: <cadence>`.

- **Daily / live:** Hukum (putusan stream), Hutan (alerts), Harga, gempa, Berita
  Kilat ticker, Tajuk, the games, Arsip rotation.
- **Weekly rotation:** Sankey deep-dives, Opini argument maps.
- **Quarterly / annual, surfaced by rotation not fake freshness:** Anggaran struk,
  Janji grades, Sensus, SDG indicators. These get a daily *spotlight*
  ("Sorotan hari ini: struk Kabupaten Nabire"), never a pretended update.

---

## 9. `edisi.json`: the day's paper as a manifest

The newsroom's single output. The browser renders the paper by reading this. One per
edition, archived in the repo forever (back issues).

```json
{
  "edisi": 41,
  "terbit": "2026-06-11T05:00:00+07:00",
  "sesi": "pagi",
  "angka_edisi": { "nilai": 4200000000, "label": "...", "cited_ids": ["..."] },
  "lead": "temuan_id",
  "temuan": ["temuan_id", "..."],
  "tajuk": { "teks": "...", "cited_ids": ["..."] },
  "ticker": "kv://liputan-cache",
  "permainan": {
    "tebak_daerah": { "jawaban_kode": "...", "clues": ["..."] },
    "kuis": [ { "q": "...", "a": "...", "cited_ids": ["..."] } ],
    "komik": { "panels": ["..."], "caption": ["..."], "cited_ids": ["..."] }
  },
  "arsip": "art_id",
  "kamera_pembuka": "tour://script-id",
  "log": "url-to-published-newsroom-jsonl"
}
```

Notes:
- `permainan` is identical for every reader (law 5). Streaks and scores stay
  client-side.
- `kamera_pembuka` is the nightly opening tour script the layout desk authored (see
  `NEWSROOM.md` and the tour format in `COMMAND_CATALOG.md`).
- `log` links the published newsroom deliberation JSONL for this edition: what the
  desks drafted, what the fact gate killed, what the lawyer flagged. The newsroom is
  itself transparent.

---

## 10. The shared / personal data boundary (law 5, made concrete)

| layer | scope | stored where |
|-------|-------|--------------|
| `edisi.json` and all artifacts it references | shared, identical for all | static CDN |
| daily games (answer, quiz, comic) | shared, identical for all | in `edisi.json` |
| Lokal/Nasional centering | personal | client state (+ coarse CF geo, no prompt) |
| "what changed since last visit" | personal | client diff of editions |
| game streaks and scores | personal | IndexedDB |
| agent session memory | personal | IndexedDB JSONL, exportable |
| Cermin inputs (income, birth year) | personal, never transmitted | client only, used to render a card |

The shared layer is the default and the spine. Personalization is a thin lens. Never
let a personal layer replace a shared one: two readers the same morning must see the
same headline and the same puzzle, because the shared edition is the conversation.
