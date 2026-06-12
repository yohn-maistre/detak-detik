# AMD-DATA.md — append to DATA_CONTRACTS.md

---

## 11. Lane C source schemas

### 11.1 `pengungsi.parquet`

IDP figures from named monitors. Low-frequency, human-published, manually
staged before ingestion. Never auto-scraped; the pipeline reads the approved
entries in `/data/staging/lane-c-queue.jsonl`.

| field | type | notes |
|-------|------|-------|
| `kode` | string | region FK (kabupaten level) |
| `periode_mulai` | date | start of measurement period |
| `periode_akhir` | date | end of measurement period |
| `jumlah_min` | int | lower bound (use when only one figure: min = max) |
| `jumlah_max` | int | upper bound |
| `sumber_id` | string | FK to SOURCES ledger (Lane C entry) |
| `metode` | string | brief description of monitor's methodology |
| `url_laporan` | string | direct URL to the source report |
| `catatan` | string | any monitor caveats or update context |
| `disetujui_oleh` | string | the human who approved the staging entry |
| `disetujui_pada` | timestamp | approval timestamp |

Conflicting figures for the same period from different monitors are
stored as separate rows, not collapsed. The UI shows them side by side.

### 11.2 `psn_konsesi.parquet`

PSN project registry and concession boundaries for Papua Selatan / Merauke
and KalSel. Sources: Perpres PSN lists (static, quarterly), ESDM MODI (for
mining), BPN/ATR data releases, JATAM shapefile releases, Auriga open data.

| field | type | notes |
|-------|------|-------|
| `konsesi_id` | string | stable identifier |
| `nama` | string | project name |
| `jenis` | enum | `food_estate`, `sawit`, `tambang`, `infrastruktur`, `bioenergi` |
| `luas_ha` | float | hectares from permit |
| `kode` | string | region FK |
| `lat`, `lon` | float | centroid |
| `geom_ref` | string | path to GeoJSON artifact on R2 |
| `tgl_izin` | date | permit date |
| `status` | enum | `aktif`, `proses`, `ditangguhkan` |
| `sumber_id` | string | FK to SOURCES |
| `catatan_hak_adat` | bool | flag: overlaps any documented adat claim |

### 11.3 `pasukan.parquet`

Security force deployment figures from named researchers and reports.
Same Lane C pipeline as `pengungsi`. Low-frequency, staged.

| field | type | notes |
|-------|------|-------|
| `kode` | string | region FK |
| `tahun` | int | |
| `jumlah_min` | int | |
| `jumlah_max` | int | |
| `jenis` | enum | `tni`, `polri`, `gabungan` |
| `sumber_id` | string | FK |
| `url_laporan` | string | |

### 11.4 `perhatian.parquet`

Media-attention share from GDELT and our own RSS volume counts. Daily.

| field | type | notes |
|-------|------|-------|
| `tanggal` | date | |
| `topik` | string | topic label (e.g. "pengungsi_papua", "piala_dunia") |
| `volume_gdelt` | int | GDELT event count for topic x date |
| `volume_rss` | int | headline count from our Lane A feed matching topic keywords |
| `share_pct` | float | topic's share of that day's total indexed coverage |

### 11.5 `keheningan.parquet` (derived, not ingested)

Per kabupaten, per metric: does official data exist? Same machinery as
`ketersediaan.parquet` but with an explicit `konteks` column flagging
the high-stakes absences (conflict kabupaten with no IDP row).

Extension to existing `ketersediaan.parquet`:

| field | type | notes |
|-------|------|-------|
| `kode` | string | |
| `metric_ref` | string | |
| `ada` | bool | |
| `terakhir_ada` | date | |
| `konteks` | string | optional editorial flag: "zona_konflik", "psn_aktif", etc. |

---

## 12. Updated SOURCES ledger additions

| source_id | what | access | cadence | fragility | pi-relay | lane |
|-----------|------|--------|---------|-----------|----------|------|
| `hrm` | Human Rights Monitor IDP reports | web fetch, reviewed | ~monthly | medium | no | C |
| `dewan_gereja_papua` | Dewan Gereja Papua press releases | RSS + web | irregular | medium | no | C |
| `jubi` | Jubi.id original reporting | RSS Lane A + staging for Lane C claims | daily / irregular | low | no | A+C |
| `suara_papua` | Suara Papua | RSS Lane A | daily | low | no | A |
| `yayasan_pusaka` | Yayasan Pusaka Bentala Rakyat reports | web | irregular | medium | no | C |
| `amnesty_id` | Amnesty International Indonesia | RSS + web | irregular | low | no | C |
| `perpres_psn` | PSN registry from Perpres | doc fetch | quarterly | low | no | B |
| `jatam` | JATAM concession shapefiles | download | semi-annual | medium | no | B |
| `gdelt` | GDELT event database | API (free) | daily | low | no | B |
| `mongabay_id` | Mongabay Indonesia | RSS Lane A | daily | low | no | A |

---

## 13. Cadence and acquisition for new sources

**Lane C sources (HRM, Dewan Gereja, Pusaka, Amnesty):** the pipeline sends
a nightly HEAD request to each known report URL and checks for changes.
When a new document appears, the Hutan/Papua desk flags it in the staging
queue. A human reads the report, manually enters the relevant rows into the
staging JSONL with a cited page/paragraph reference, and approves. The
pipeline then picks it up on the next build. Never automated past the flag.

**PSN/Perpres registry:** fetched quarterly by the ETL cron. Static
document parsing (pdfplumber or similar). Outputs to `psn_konsesi.parquet`.
Concession shapefiles from JATAM/Auriga are fetched when new versions
publish and committed to R2.

**GDELT:** free daily CSV download. The ETL filters for topic keywords
(Papua, PSN, Merauke, Puncak, piala dunia, etc.) and aggregates into
`perhatian.parquet`. One Actions job, a few MB per day.

**Pasukan figures:** sourced from named academic or advocacy reports as they
publish, same staging flow as IDP figures. No automated source for this.

**The Pi relay:** Lane C documents (heavy PDFs from HRM, Pusaka) that are
behind Cloudflare or geo-restricted go through the Pi if needed. But most
Lane C sources publish openly; this is rarely needed here.
