# PLAN_LOG — ground-truth state + next steps

> A living plan log. Unlike `docs/CLAUDE.md` (the constitution, time-locked to
> mid-June 2026) and `docs/ROADMAP.md` (kept for history), this file tracks the
> **actual built state** read off the code, and the **next concrete moves**.
> The codebase is ground truth; where the older docs disagree, the code wins.
> **STANDING RULE — keep this alive.** This is the single source of truth for the
> current built state + active plans. Every session: update the Status table (§3),
> the §4.5 workstream checklist, and the changelog as work lands; if anything here
> is stale, fix it first. Keep `DATA_SOURCES.md` (new endpoints + recency),
> `CLAUDE.md` §4, and `AGENTS.md` current alongside it.
>
> Last full read: 2026-06-26. **2026-06-27:** local env now live (Node 22 via
> tarball, pnpm 9 via corepack, deps installed); **migrated to Astro 7** (build
> 2m27s → ~50s; `.node-version` pins CF Pages to Node 22; both deploys green);
> map-layer expansion + Act I/III revamp underway (see §4.5). Verify: `pnpm check`
> + `pnpm build`.

---

## 1. How it actually flows (three cooperating halves)

**A. The page** — static Astro 6 + Svelte 5, one three-act broadsheet at
`src/pages/index.astro` (~1450 lines) hydrating ~40 islands.
- **Act I · Dinas** (khaki): masthead + clockwork second-ring, KILAS ticker, the
  morning lead (`#ku-judul`), the four-desk **rubrik** magazine front,
  `CuacaPagi`, `NasionalPagi`, `PasarPagi`, `Gelombang`, the **PetaKabar**
  MapLibre map + **LensaWilayah** morphing region panel, `SensusDiri`.
- **Act II · Mesin** (black): the Angka Edisi odometer, `PapanAngka`,
  `SembilanPuluh`, the five branches (`CabangBand` + `SkorCabang` each, with
  `KabinetWaffle` / `PabrikUU` / `GradienKeadilan` / Aparat / `OtsusGrafik`+Struk),
  "Yang Tidak Dihitung", Janji, then GERAK II themes — Pasar (`RepublikOligarki`,
  `FloatKonsentrasi`, `JciVsPeers`, `RupiahIHSG`), Lingkungan (`ObituariHutan`,
  `PetaPiksel`×2, `JanjiCair`, `SisaAlam`), Rumah Tangga (`MbgKorban`, `DuaGaris`),
  Layar Ganda, Dunia board + `GarisStart`, arsip teaser.
- **Act III · Atlas** (aged cream): `RimbaHidup`, then Nusantara (`WajahNusantara`,
  `Bahasa718`, `GaleriNusantara`, `AlmanakSains`, `GunungApi`, `PetaRupa`), the
  Ruang Main games (`TebakDaerah`, `BenarSalah`, `TuguRakyat`), colophon.
- Registers are scoped by `[data-register]` (`src/styles/tokens.css`). One
  GSAP/Lenis engine in `src/scripts/choreo.ts` drives all motion; it exposes
  `window.setAngkaEdisi(nilai, label)` (choreo.ts ~L283) for live re-rolls.
- Shared-state stores islands subscribe to: `lensa.ts` (region), `denominasi.ts`
  (unit re-pricing), `edition.ts` (live edition via `onEdisi`).
- Command bus: `src/lib/commands/catalog.ts` (Zod verbs) + `dispatcher.ts`
  (`on`/`dispatch`, every state → URL). Verbs present: `fly_to, set_lens,
  set_scope, set_layer, set_basemap, denominate, set_lensa, map_label,
  map_choropleth, lapor_lokasi, highlight, sorot, scroll_to, open_temuan, say`.

**B. The Worker** (`worker/src/index.ts`, stateless/amnesiac, KV-cached):
- `/ticker` — Lane A RSS pass-through, hourly cron, 6 independent outlets
  (Tempo, BBC Indonesia, Project Multatuli, Jubi, KBR, Mongabay).
- `/geo/{udara|kebakaran|gunungapi|pesawat}` — proxies WAQI / NASA FIRMS /
  MAGMA ESDM / adsb.lol to GeoJSON. (BMKG quakes, USGS, PetaBencana, AISStream
  are direct client fetches in `PetaKabar.svelte`.)
- `/ask` — turnstile → rate-limit → KV cache → NIM (qwen3.5 → nemotron) →
  Workers AI (gemma-sea-lion). Retrieval/RAG NOT wired.
- `/tour` — one model call, verbs validated against the catalog, invalid dropped.
- `/edisi` — GET serves the live edition from KV; POST (guarded by `EDISI_TOKEN`)
  is how the newsroom publishes. No rebuild to publish.
- `/pasar` — USD/IDR (Frankfurter) + IHSG/Brent (Yahoo chart), 15-min cache.

**C. The newsroom** (`newsroom/`, Python, run by `.github/workflows/newsroom.yml`
twice daily at 21:32 & 09:32 UTC, gated by the `NEWSROOM_ENABLED` repo Variable):
- `main.py` orchestrates: gather every desk's corpus → desks fan out in parallel
  → deterministic **fact-gate** (`gate.periksa`: every cited id exists + every
  number ≥100 matches its row within ±0.5%) → **lawyer pass** (`redaktur_hukum`:
  neutralise or kill, citations may not be lost) → **editor** (`assemble`: rank by
  skor, pick lead, set Angka Edisi) → **publish** (`POST /edisi`) → JSONL log.
- 7 desks: `hukum, harga, anggaran, hutan, janji, papua, data_hilang` (the last is
  a meta-beat that reports dark feeds). Shared engine: `desk.narrate()` — detection
  is always deterministic, the model only sharpens phrasing; with no model key the
  deterministic candidate stands. Model lane: Pydantic AI + LiteLLM `FallbackModel`
  (NIM → Groq → OpenRouter → Gemini), `ModelRetry` = retry-with-the-gate's-reason.
- **All desk corpora are SEEDED** from `newsroom/data/*.json`; each source file has
  a `# seam:` comment where the live fetch lands. Only `sources/pulse.py`
  live-fetches today (USGS quakes, Frankfurter USD/IDR, the worker ticker).

**Runtime enhancement:** `src/scripts/pagi-live.ts` fetches `/ticker` + `/edisi`
after load and patches the SSR DOM in place; anything dark keeps the baked-in
`(data contoh)`. First paint and offline always work.

---

## 2. Published edition shape vs. what the page consumes (the core gap)

The newsroom publishes a **rich** `Edisi` (`newsroom/models.py`, `editor.py:assemble`):

```
{ edisi, terbit, sesi,
  angka_edisi: { nilai, prefix, label, cited_ids },
  lead: <temuan_id>,
  temuan: [ { lens, headline, body }, ... ],   // ALL survivors, ranked by skor
  ticker: [ { src, teks, url }, ... ],
  dek?, tajuk? }
```

But `pagi-live.ts` consumes only a **thin slice**:
- `#ku-judul` ← `temuan[0].headline` (lead only)
- `#ku-dek` ← `dek`
- the Act II odometer ← `angka_edisi` via `window.setAngkaEdisi`
- `#ag-list` ← `agenda` — **dead wire**: `editor.assemble` never emits `agenda`
- ticker + `#rp-list` ← `/ticker`

Everything else on the page is **static** `(data contoh)`:
- The Act I **rubrik** four desks iterate the static `TEMUAN` import
  (`src/lib/data/edisi.ts`), not the live `temuan[]` (index.astro:96-97).
- Every Act II `bab` renders static `edisi.ts` constants (`TEMUAN`, `STRUK`,
  `KEHENINGAN`, `JANJI`, `APARAT`, `EKONOMI`).
- `NasionalPagi` subscribes to `onEdisi` for `makro`, but the newsroom emits no
  `makro` → it always falls back to contoh.

**So the multi-agent journalism — the whole thesis — is written, gated, and
published, but never reaches the page beyond one headline + one number.**
Note the orphaned `.temuan-*` CSS at index.astro:1225-1253 (a removed standalone
"Temuan" grid): a ready-made home for a live findings surface.

---

## 3. Roadmap status (vs. CLAUDE.md §6)

| # | Item | Status | Notes |
|---|------|--------|-------|
| A | Immediate fixes (masthead reframe, countdown, header tone) | **Mostly done** | infobox now "PEMBARUAN 2× SEHARI", curl is "PEMBARUAN BERIKUTNYA" countdown, no-tracking demoted to folio/footer. Verify crosshair/breathe removal — neither appears present in current `choreo.ts`/`PetaKabar.svelte`. |
| B | One morphing region component + clickable polygons | **Done** | `LensaWilayah.svelte` (subscribes `onLensa`, morphs national↔province) is live under the map; map is clickable. |
| C | SIRUP `/pengadaan` explorer | **Not started** | No page, no desk, no source. |
| D | Markets & economy package | **Substantially built** | `FloatKonsentrasi`, `JciVsPeers`, `RupiahIHSG`, `RepublikOligarki`, `KabinetWaffle`, `OtsusGrafik`, `MbgKorban` all present (all contoh data). `chart-kit.ts` is still small. |
| E | Multi-agent newsroom | **Backbone + 7 desks shipped** | CI cron wired + gated. All sources seeded; live-fetch seams open. Output under-consumed by the page (see §2). |
| F | Aksara chart-renderer (`render_chart`/`show_table`) + RAG | **Not started** | Verbs not in the catalog; `/ask` has no retrieval. Aksara today emits `say, highlight, scroll_to, fly_to, set_lensa, lapor_lokasi, sorot` + free-text `tanya`. |

---

## 4. Recommended next steps (priority order)

### #1 — Close the newsroom → page loop (highest leverage, mostly wiring)
The newsroom already produces ranked `temuan` with bodies; surface them live.
- Add a **live "Temuan Redaksi" surface** that renders `live.temuan[]` as cards.
  The orphaned `.temuan-*` CSS (index.astro:1225-1253) is a natural fit; place it
  in Act II (e.g. under the Angka Edisi or as a GERAK opener), SSR'd from the
  static `TEMUAN` and **upgraded by `onEdisi`** like the other live spots.
- Make the **Act I rubrik fill from live `temuan[]`** (not the static import) when
  an edition is present, keeping the contoh as fallback (index.astro:88-97 + a
  small `onEdisi` enhancer in `pagi-live.ts`).
- Drive the Act II `bab` deks from live lead/temuan where a `bab` maps to a lens
  (hukum, daerah, anggaran, hutan, janji, papua), instead of `TEMUAN[n].headline`.
- **Fix the dead `agenda` wire**: either have `editor.assemble` emit an `agenda`
  (and add it to the `Edisi` model) or remove the `#ag-list` rendering in
  `pagi-live.ts`. Same call for `makro` in `NasionalPagi` (emit it or stop
  subscribing). Pick one direction; don't leave half-wires.
- Verify end to end: `python -m newsroom.main` (dry-run, no secrets) prints an
  edition; POST a sample to a local worker; confirm the page upgrades.

*Tradeoff:* less visibly "new" than C or F, but it's what makes the paper a
newsroom harness instead of a static mock. Do this first.

### #2 — Turn one seeded desk fully live (prove the seam)
Pick the desk with the cleanest public source and replace its seed with a real
fetch, keeping the seed as fallback. `harga` (Panel Harga Badan Pangan) or
`hukum` (MA Direktori Putusan) are the documented starts. This validates the
gather → gate → publish path on real data and de-risks the rest.

### #3 — Then choose the marquee direction
- **C · SIRUP `/pengadaan`** — self-contained, clear spec (a searchable
  procurement page from the Nemesis/INAPROC dump; neutral "price vs category
  median"; strictly documents-speak). Cleanest greenfield bite; also a natural
  8th newsroom desk.
- **F · Aksara chart-renderer + RAG** — the headline ambition, largest/riskiest:
  add `render_chart` (constrained Vega-Lite-style spec, code supplies the numbers
  from cited rows) + `show_table` to the catalog, wire the panel under the map,
  then `/ask` retrieval over the corpus with the runtime fact-gate. Multi-session.

---

## 4.5 Active workstream — 2026-06-27 session (pick-up-able)

Three parallel tracks; each item is a discrete bite anyone can take.

### Track 1 · Map data expansion (`PetaKabar.svelte` + `worker/src/index.ts`)
Pattern for a new point layer: add to `LAYER_CONTOH` + `LAYERS` + `layerOn`/`layerLive`
+ an `iconData` shape + a fetch in `muatLapisan` + a `dossier` case (browser-direct
where CORS allows, else a `/geo/{id}` worker route). Verified endpoints/licenses in
`docs/research/2026-06-27-map-layer-candidates.md` + `...-2026-06-27` ArcGIS notes.
- [x] **Open-Meteo flood + marine** in the click-report (`LaporanLokasi.svelte`). DONE.
- [x] **Climate TRACE CO₂ emitters** (`karbon`; v6/assets, browser-direct, CC-BY,
  sized by Mt/yr). DONE. *Future:* cached `/geo/karbon` worker route to respect the
  beta API; add sectors (oil-and-gas, coal-mining, cement).
- [x] **BIG BATASWILAYAH → `public/data/idn-prov.geojson`** — DONE (commit 13a0e98).
  Province polygons swapped for BIG's authoritative One-Map boundaries (BATAS_WILAYAH
  layer 12), grouped by name → joined on the existing 2-digit BPS `kode` (all 38 match,
  the 6 Papua provinces now correctly placed). Hand-rolled Douglas-Peucker + tiny-island
  filter → 156K, no new dep. Generator kept at `gen-prov.js` (re-runnable).
- [x] **Kabupaten (ADM2) drill-down** — DONE (commit 58c9a5d). `idn-kab.geojson` (515
  kabupaten, BIG KabKota joined to the province `kode` **by NAME** — BIG's code fields come
  back blank) + `idn-prov-lines.geojson` (1334 dissolved province-boundary segments, BIG
  layer 8). PetaKabar: dropped `provinsi-line`; added thin `kab-line`, bold `prov-line`, and
  a transparent clickable `kab-fill` → click a kab and its name pops + its province becomes
  the lensa. Choropleth/selection unchanged. (Future: kab-level metrics need a WADMKK→4-digit
  -BPS table. Generators `gen-kab.js`/`gen-lines.js`/`gen-prov.js` live in session scratch.)
- [ ] **SPPG / MBG kitchens** (`Hosted/SPPGJuli2025/FeatureServer/0`, BGN, ~9,407
  units @ 2025-09). FeatureServer query came back empty on probe (token/CORS?) → needs
  a worker-side probe; likely a `/geo/sppg` proxy + clustering. Ties to Act II MBG.
- [x] **GEM coal — PLTU fleet + pipeline** — DONE (this session). Global Energy Monitor
  Global Coal Plant Tracker (Jan 2026 release, CC-BY), vendored to `public/data/idn-batubara.geojson`
  (28KB): 502 IDN unit-rows aggregated to **111 plants** by status (96 beroperasi / 12
  konstruksi / 3 rencana), sized by MW. Layer `batubara`. Complements the Climate TRACE CO₂
  layer (emissions-now vs. build-pipeline). Source `raw.githubusercontent.com/GreenInfo-Network/
  coal-tracker-client` (CORS `*`); vendored, not hot-linked. Re-vendor on GEM's ~biannual
  (Jan/Jul) release. Generator `gen-coal.js` in session scratch.
- [ ] **BIG health points** — REASSESSED: BIG `BANGUNANDANFASUM` is fragmented per-sheet
  25K tiles with **incomplete national coverage** (only some provinces) → a layer would
  mislead ("no sheet" reads as "no hospital"). Pivot to **OSM Overpass** (amenity=hospital/
  clinic, ODbL, complete) — first probe returned 406 (UA/format); retry from the worker or
  with a plain UA, or defer.
- [ ] **BNPB disaster** — REASSESSED: `gis.bnpb.go.id` ArcGIS is down ("Application Error");
  `dibi.bnpb.go.id` is now a **Superset BI dashboard** (no clean GeoJSON API). Live
  multi-hazard events are already covered by **PetaBencana** (the `banjir` layer fetches all
  report types). BNPB DIBI history suits a chart, not a live map layer → defer.
- [ ] **WDPA protected areas** — REASSESSED, likely DROP: UNEP-WCMC license **forbids
  redistribution** + no commercial use without written permission (display-only allowed), and
  the IDN download is 34–64MB shapefile (needs heavy simplify). Conflicts with the open-data
  ethos + device limits. For a conservation/forest layer, prefer an **open** source: GFW
  deforestation (free API, CC-BY) or OSM `boundary=protected_area`.
- [x] **IMERG rainfall** overlay — DONE (commit 1fc14a2). Toggleable GIBS raster (legend),
  `GoogleMapsCompatible_Level6`, ~3-day-lag date; better over Indonesia than the radar.
- [~] **Planes (pesawat)** — adsb.lol throttles our CF/datacenter proxy to ~1-2 planes *and*
  has no CORS (dead client-side too). Rewired to **OpenSky** `/states/all?bbox` (one whole-Indonesia
  call, ~33 aircraft) in the worker; needs `OPENSKY_CLIENT_ID`/`SECRET` (free OAuth2 client) — anon
  is per-IP and dead from the shared CF IP. adsb.lol grid kept as no-creds fallback. **ACTION:
  add the OpenSky secrets in GitHub → planes go live whole-archipelago.**
- [x] **Vessels (kapal)** — AISStream WS now **auto-reconnects** (4s backoff); was freezing on any
  drop. Key is `PUBLIC_` (shared in the bundle, free-tier connection caps) — known limitation.
- [x] **Dot-accuracy diagnostics** — DONE (commit 913a09a).
  - **Volcanoes:** registry rebuilt from **Smithsonian GVP** (Holocene Indonesia, WFS) →
    **101 accurate summits** (was 83), with elevation / type / last-eruption baked in
    (`scripts/build-gunungapi.mjs`, regenerable). Dossier now shows mdpl + tipe + letusan
    terakhir. The "~5" was the pre-deploy contoh; `allow-overlap:true` means none declutter.
  - **MAGMA levels** were never live: the worker's two URLs return **HTML 200 / 404** (not JSON),
    so `r.json()` threw silently. The real API (`/api/v1/magma-var`) is **token-gated**. Worker now
    (a) only parses when `content-type` is JSON, (b) uses `Bearer env.MAGMA_TOKEN` if present.
    **Optional ACTION:** add `MAGMA_TOKEN` secret → alert levels go live (merged by name; coords
    stay from the registry). Until then levels honestly read "registri GVP · status menyusul".
  - **Fire:** already true VIIRS lat/lon — live `/geo/kebakaran` = ~310 hotspots at real coords;
    province-centroid dots were the labelled `contoh` (pre-load / thrown-fetch only). Verified honest.
- [ ] **Pivots (open replacements, picked 2026-06-27)**: OSM Overpass hospitals (health), GFW
  deforestation (conservation, replaces WDPA), upgrade the PetaBencana `banjir` layer to honest
  multi-hazard (flood/quake/fire/wind/haze).
- [ ] Later: WorldPop/Kontur. **Big creative open-data brainstorm pending** — a data-scout agent
  (cap ≤5 sub-agents) for synthesizeable civic data: heatmaps, governance/branch-of-power indices,
  justice gradient (vonis over time — note `GradienKeadilan` exists), PISA, sanitation, energy,
  internet, culture proxies (Spotify/film), history. Parse into map-layer vs act-viz buckets.

### Track 2 · Act I revamp — brief: `docs/research/act1-revamp-brief.md`
Act I reads scattered/amateurish; the four RSS desks feel redundant + may be unwired.
Diagnose, re-spine the layout, resolve the news-desk taxonomy + wiring, dedup.
Read-only design pass first, then implement.

### Track 3 · Act III magazine revamp — brief: `docs/research/act3-revamp-brief.md`
Complete redesign into a signposted magazine (like Act II): peoples/indigenous tribes
(real Wikipedia writing, not a paragraph), art, musical genres, history, biodiversity.
Build on `docs/research/2026-06-27-act-iii-data-and-components.md`.

### Track 4 · Carried-over technical wirings (doc audit 2026-06-27)
A read-only audit (docs ↔ code) surfaced wires that exist on one side but not the other.
Recorded so they're not lost; **paper/editorial direction is deliberately NOT in scope here**
(we deliberate that separately). Triage before building:
- **Newsroom → page loop is half-open (highest leverage).** `src/lib/edition.ts` accepts
  `agenda`, `makro`, `harga` and the front-end consumes them (`pagi-live.ts` `#ag-list`,
  `NasionalPagi.svelte` `e.makro`), but the newsroom `Edisi` model (`newsroom/models.py`) never
  emits them and `editor.assemble` never populates them → those surfaces always fall back to
  contoh. Closing this (add fields + populate) would make Act I feel like a live newsroom.
- **Live rubrik feed unwired.** `index.astro` desks render static `TEMUAN`/`TICKER` from
  `edisi.ts`, never the published edition's live `temuan[]`. Orphaned `.temuan-*` CSS confirms a
  ready slot. Needs an `onEdisi` upgrade hook.
- **Dead/declared-only command verbs.** `open_temuan` defined in `catalog.ts` with no handler;
  `render_chart` / `show_table` documented (CLAUDE §5/§6 F) but absent from the catalog. The tour
  system in `worker/src/index.ts` only whitelists `fly_to|scroll_to|set_lens|highlight|say` —
  narrower than the 18-verb catalog, so valid verbs get dropped from generated tours.
- **Map source pivots still open:** `/geo/sppg` (BGN MBG kitchens) never added; OSM Overpass
  hospitals (health) + GFW deforestation pivots not implemented; `banjir` still single-hazard.
- **Stale doc phrasing:** CLAUDE §4 / MAP_STAGE say "five layers" — there are now **8**
  (`LAYERS` in `PetaKabar.svelte`). Roadmap A/B immediate-fixes verified done; can be marked off.

### Doc upkeep (standing)
Keep this file, `DATA_SOURCES.md` (new endpoints + recency), and `CLAUDE.md` §4
current as each item lands. **Also keep the PUBLIC source ledger
`src/pages/sumber.astro` in sync** — it shows readers each source's
LANGSUNG/CONTOH/SEGERA status; a wired layer or a CONTOH→LANGSUNG flip must be
reflected there (it is currently behind the shipped map layers). Two ledgers:
internal `DATA_SOURCES.md` + public `sumber.astro`.

---

## 5. Smaller loose ends (tracked so we stop forgetting)

- **Dead `agenda` wiring** in `pagi-live.ts` (no producer). See §4 #1.
- **`makro` mismatch**: `NasionalPagi` + `edition.ts` `LiveEdisi` expect `makro`/
  `harga`; the newsroom emits neither.
- **`open_temuan` verb** exists in the catalog with no handler/surface — pairs
  naturally with the live Temuan surface in §4 #1.
- **`TuguRakyat` is local-only** (localStorage `dd-tugu-v1`); the shared
  Durable-Object canvas is still "menyusul". Weigh the abuse vector before
  shipping shared state (fixed palette + slow cadence already in place).
- **Verify roadmap-A micro-fixes** actually gone (crosshair readout, map breathe
  drift) — they appear absent but were never explicitly confirmed removed.
- **`chart-kit.ts` is still minimal** (idr/fmt/ramp/pathD/rebase100); the
  Bloomberg-standard expansion (slope, dumbbell, beeswarm, waffle, candlestick…)
  is unstarted.
- **Live data only renders in the sandbox as contoh by design** (outbound fetch
  blocked) — expected, not a bug.

---

## 6. Verification ritual (per CLAUDE.md §9)

1. `pnpm install` (not yet done in this clone), then `pnpm check` (0 errors) +
   `pnpm build` (clean).
2. For newsroom changes: `python -m newsroom.main` dry-run (logs, no publish
   without `AKSARA_URL` + `EDISI_TOKEN`).
3. For UI: `pnpm dev`, inspect touched sections at 390px + 1280px; honor
   reduced-motion. No em dashes anywhere; formal Indonesian; `(data contoh)` vs
   `langsung` status always printed, never hidden.

---

## 7. Doc reliability map (for future reads)

- **Ground truth / still operational:** `EDITORIAL_GUIDELINES.md` + `AMD-EDITORIAL.md`
  (two-lane + Lane C law), `COMMAND_CATALOG.md` (verb specs), `DATA_CONTRACTS.md` +
  `AMD-DATA.md` (row schemas, provenance), `NEWSROOM.md` + `AMD-NEWSROOM.md`
  (pipeline), `MAP_STAGE.md` (verified map sources), `PRD-00_CHASSIS.md` (Actions
  topology), `PRD-LENSES.md` (four-socket pattern), `AMD-DESIGN.md` +
  `LEMBARAN_DESIGN.md` (registers + motion), `tokens.css` (design tokens).
- **Forward backlog worth keeping:** `PERSPEKTIF.md` (Tier 1-3 chart queue, mostly
  verified-feasible), `AMD-LENSES-PAPUA.md` (7 Papua socket fills), `DATA_SOURCES.md`
  (feasibility ratings + the BPS↔Kemendagri code-bridge trap), `STACK_2026.md`
  (version pins + NIM gotchas), `CLOUDFLARE.md` (free-tier budget).
- **Time-locked / historical:** `CLAUDE.md` §4 (current state) & §6 (roadmap) —
  superseded by this file; §2-3 (laws, design) & §7 (doc map) still good.
  `ROADMAP.md`, `AMENDMENTS.md`, much of `LAYOUT_V3.md`. `NOT_NOW.md` keeps the
  conflict-content red lines (still doctrine).

---

## 8. Changelog

- **2026-07-02 (cont. 2) — KLIPING v1 + tone sweep + first shader.** The
  Ground-News-style newsstand backbone is LIVE-CAPABLE and fully deterministic
  (zero LLM, zero new keys): newsroom/data/media_roster.json (14 outlets,
  ownership documented; Kompas RSS dead, covered via Tribunnews; VIVA dead),
  sources/kliping.py (stdlib fetch + Jaccard/union-find clustering, skor =
  n_grup*2 + n_media, titik_buta when >= 2 media share 1 owner), Kliping models
  + editor cap 12, Lane A pass-through (skips fact-gate: verbatim headlines
  only). First live test: 495 items, 32 clusters, 9 blindspots, ALL sample
  blindspots = Detik + CNN Indonesia (both CT Corp): the ownership axis works.
  Frontend: RakKabar.svelte (lead cluster + liputan rows + independen squares
  + TITIK BUTA stamp, renders only when kliping[] present, client:idle) +
  LiveKliping types in edition.ts. Formal-tone sweep landed across
  lib/data + perspektif + 20 islands (dramatic fragments -> measured
  sentences; struk roast + Lane A + nameplates untouched). Paper Shaders
  installed (@paper-design/shaders, lazy-imported): VeilMesin gold Bayer
  dither behind Angka Edisi, rAF stops offscreen, static under reduced
  motion; AWAITING YOSE'S VISUAL VERDICT (tune u_pxSize/alpha/speed or kill).
  Next: trigger newsroom -> kliping publishes; then desks-as-shelves dedupe,
  Lembar Kliping story sheet, Lane C summaries (labelled) on top of v1.

- **2026-07-02 (cont.) — restructure pass (Act II regrouped, Act III reordered).**
  Temuan Redaksi board redesigned lead-plus-rows (was a cramped 3-col wall).
  DitherNusantara cut from the Act II opener (void-maker). Bab Rumah Tangga
  dissolved: MbgKorban into the new TEMA · JANJI & PROGRAM (folio 08, absorbs
  the old Janji jeda), DuaGaris into Ekonomi. Hening DEMOTED from chapter to a
  quiet closing register at the act end (eyebrow + ledger, scribbles kept);
  direction: absences print in place per chapter (Danantara tile now spans 2
  cells; rokok tile removed as triplicate of map+heatmap air). Chapter-header
  anatomy unified flush-left (folio = quiet top-right furniture, tajuk on
  --fs-5, dek 14-16px): fixes the pushed-right kicker + oversized dek.
  RimbaHidup moved to close Act III; SukuLokasi rebuilt on new shared
  lib/atlas-dots.ts (accurate raster, home province inked, seal rings; blob
  circles gone). Island fixes: WajahNusantara empty frame -> engraved
  PLAT PENGGANTI fallback; Bahasa718 resting 0 -> real total at first paint;
  JanjiCair invisible fill root-caused (classList.add invisible to Svelte CSS
  pruning) -> class: directives. Aksara anchors updated. Paper Shaders
  (@paper-design/shaders, vanilla ShaderMount) verified viable, deliberately
  NOT shipped blind (no browser on host): integrate next session with Yose
  reviewing screenshots per spot. Standing note: tone sweep to formal register
  pending (agent pass); bespoke-per-data forms over templates is doctrine.

- **2026-07-02 — NORTH STAR + beta pass (pushed direct to main; docs/ now
  gitignored local-only, full history in `backup/main-2026-07-02`).** Direction
  doc landed at `.claude/NORTH-STAR.md` (ground truth, Lane C amendment, roadmap
  P0-P4; read it first). Then P0 SELARAS executed: **newsroom loop CLOSED**
  (pagi-live renders ranked `temuan[]` into the new Act II Temuan Redaksi board
  + live rubrik rails; dead `agenda` wire removed; angka chip flips to
  langsung); **type scale** tokens (`--fs--1..6`) + h1-h4 hierarchy + h2/h3
  sibling fix + § renumber (1-5, no dupes); seams 56svh→38svh; kolofon HUKUM
  BESI → formal pedoman + new `/pedoman` page; **sumber.astro rebuilt** (52
  anchored rows, :target highlight, chip deep-links via Paper.astro, statuses
  corrected: OpenSky SEGERA, Bapanas 401→SEGERA); **PetaAtlas reborn** as
  accurate clickable dot-atlas from idn-prov.geojson (Act III opener, set_lensa
  on tap, engraved fallback); **worker /pasar + seri** (6mo daily USD/IDR, JKSE,
  KLSE/STI/PSEI peers, KV 6h) wired LIVE into RupiahIHSG + JciVsPeers;
  Gelombang + PetaPiksel contoh states made unmistakable (watermark + honest
  chip); Ruang Main games de-boxed (ruled typographic restyle, logic intact);
  Aksara tour de-hardcoded from #41. Build clean (8 pages). Flue VERIFIED REAL
  (withastro/flue, CF Agents SDK harness): candidate for newsroom v2/Aksara,
  not a v1 rewrite. Corrections vs old docs: Vectorize free = 5M DIMENSIONS
  (~4.9k vectors); RAG plan = CF AI Search over R2.

- **2026-06-26** — First full ground-truth read (every file touched). Documented
  the three-half flow, the newsroom→page consumption gap (§2), the roadmap status
  table (§3), and the prioritized next steps (§4). No code changed.
- **2026-06-27** — Stood up the local env (Node 22 tarball, pnpm 9 corepack, deps).
  **Migrated Astro 6 → 7** (Rust compiler + Vite 8/Rolldown; build 2m27s → ~50s;
  `.node-version` 22.23.1 pins CF Pages; both deploys green). Shipped two map
  features: **Open-Meteo flood + marine** in the click-report, and the **Climate
  TRACE CO₂ emitters** layer, and **replaced the province polygons with BIG Rupabumi**
  (accurate, BPS-coded, Papua fixed). Added research notes under `docs/research/` (map
  candidates, Act III data, Astro 7, + Act I/III revamp briefs). Backlog → §4.5.
- **2026-06-27 (cont.)** — Shipped the **IMERG rainfall** overlay and the **kabupaten
  (ADM2) drill-down** (BIG KabKota name-joined + BIG layer-8 dissolved lines; thin kab +
  bold province, click a kab → name popup + province lensa). Scrubbed a device-model
  mention from `LEMBARAN_DESIGN.md`. Six new map data surfaces shipped this session.
- **2026-06-27 (cont. 2)** — Shipped **GEM coal** (PLTU fleet + pipeline, CC-BY, 28KB);
  reassessed BIG-health / BNPB / WDPA as unfit (§4.5). Replaced the kab-click **popup with
  zoom-reveal `kab-lab` labels** (atlas-style, map font; the lens click itself was already
  wired). **Live-data reliability**: planes rewired to **OpenSky bbox** (one call, needs
  `OPENSKY_*` creds; adsb.lol fallback — adsb.lol throttles our CF IP + no CORS), **AIS
  auto-reconnect**. Consolidated `AGENTS.md` → `CLAUDE.md` §11 (commands, deploy, conventions,
  map gotchas). Deploys are GH Actions (`deploy.yml` / `worker.yml`, `workflow_dispatch`);
  commits now terse one-liners under `josejr2498@gmail.com`.
- **2026-06-27 (cont. 3)** — **Dot-accuracy pass** (commit 913a09a). Volcano registry rebuilt
  from **Smithsonian GVP** → **101 accurate summits** (was 83) + elevation/type/last-eruption
  (`scripts/build-gunungapi.mjs`); dossier enriched (mdpl, tipe, letusan). Diagnosed why MAGMA
  levels were dead (HTML 200 / 404 → silent `r.json()` throw); worker now **content-type-guards**
  and uses **`Bearer MAGMA_TOKEN`** if set (optional secret → live levels merged by name).
  Confirmed **fire is already true VIIRS lat/lon** (~310 live); centroid dots were labelled contoh.
  `astro check` green (0/0/0). Ran a **read-only doc audit** → carried-over wirings logged as
  Track 4 (newsroom→page loop, dead verbs, source pivots) — not yet built, queued for triage.
- **2026-06-28 — Transparency-data round (R1+R2).** Three verified data-scout runs →
  `docs/research/2026-06-27-civic-data-sources.md`. Then, **me + one background build-agent on
  disjoint files, verify-green per round** (the agent's host died on idle once but its files
  were already written + verified — no rerun needed):
  - **R1 · Mining concessions** (commit 4c407a5): vendored **4,797 ESDM IUP** permits to
    `public/data/idn-tambang.geojson` (`scripts/build-tambang.mjs`, generalised → 1.9 MB / 274 KB
    gz). "TAMBANG · IUP" polygon layer coloured by commodity (1,235 coal · 534 nickel · …), click →
    company/commodity/status/area/Clean-&-Clear. Browser-direct (ESDM CORS).
  - **R1 · Dossier data** (commit 3f0b00c): `scripts/build-wilayah.mjs` → `idn-wilayah.json`,
    **514 kab** with ibukota/penduduk/luas/lat-lon (cahyadsn Kemendagri 2025, keyless), joined 1:1
    to our geojson. **Fixed a base-data defect**: dropped a corrupt 4-vertex sliver feature
    (`Minahasa Selatan/Bolaang Mongondwo Timur`) → 515→**514** kab (correct national count).
  - **R2 · Kabupaten dossier** (commit f2c3244): **expand-in-place** sub-section on the province
    card — real ibukota/penduduk/luas now (keyless); BPS indicators (IPM/poverty/PDRB) layer on
    once the free key lands.
  - **R2 · CO₂ layer fixed + broadened** (commit e7e4e49): root-caused the "just 3 PLTU" — Climate
    TRACE v6 **moved coords `bbox`→`Centroid.Geometry`**, so the live feed silently fell back to 4
    contoh. Now reads Centroid + pulls **4 sectors** (power/manufacturing/extraction/fossil-ops),
    top 250 by tonnage → steel (Morowali), mines (Grasberg), migas, not just coal. CORS `*`.
  - All four `astro check` 0/0/0, deployed green. **Source-credits strip** added under the map
    earlier (every layer's provider + licence, linked).
  - **Pending:** R3 forest layers (BIG peatland + GFW concessions); BPS free key (Yose) → live
    IPM/poverty/PDRB in both dossiers; optional ESDM power-fleet (3,588) energy-mix layer.
- **2026-06-30 — Phase 0 map finish + Satwa + P0.4.** Resumed after two Termux crashes (recovered
  uncommitted work intact). All `astro check` 0/0/0, deployed green:
  - **P0.1 borders** (9c867f0): province bold (4.6px), kab faint + invisible until z6.2; a later pass
    (19fcd18) cut kab even thinner (Yose: still read reversed at province zoom — density illusion).
  - **P0.2 legend + sources** (9c867f0): legend split PETA DASAR / DATA LANGSUNG; source credits keyed
    to layer toggles → only **active** layers' sources print, inside the white info box.
  - **P0.3 CO₂ non-power** (be96fac): excluded the power sector (= the coal plants, hence the overlap);
    vendored top-200 NON-power emitters (steel/cement/migas) to `idn-emisi.geojson` via
    `scripts/build-emisi.mjs`. + volcano-board hardening (commit registry immediately, seed on basemap
    switch). "EMISI CO₂ · INDUSTRI".
  - **Satwa Terancam** (c85e9a2): **Mandum Rimba** 151 IUCN species-range polygons, browser-direct
    (CORS `*`, keyless, lazy-load + contoh fallback); click → class/count/CR-EN tally/top species.
  - **Public ledger brought current** (4212a8e): `sumber.astro` + `DATA_SOURCES.md` now list all 12
    shipped map layers (was behind); captured Mandum + **SPPG** (`sismonbgn.com`, ~5,600 pts, worker-
    proxy, label *terdaftar* not operating) scouts → research note G.
  - **P0.4 kab → Lensa Wilayah** (1311c66): dense in-map sub-card retired; a clicked regency files into
    the panel below via new `lensa-kab.ts` store + `set_lensa_kab` verb — breadcrumb, official kode +
    coord stamp, and **"bagian dari provinsi" share meters** (penduduk/luas, self-draw) + density/rank,
    all derived from real wilayah data. Map keeps a quiet breadcrumb pointer.
  - **Pending:** P0c open-data give-back; SPPG + GFW concession/PANGAEA mining layers; Phase 1 Temuan
    Redaksi findings board (surface Lane B); OpenSky secrets (Yose) → live planes.
- **2026-07-01 — border root-cause + SPPG + concessions.** All local `astro build` clean, deployed green
  (learned: `astro check` misses `??`/`||` mixing that `astro build` catches — one failed deploy, now run
  build for Svelte edits):
  - **Border bug ROOT-CAUSED** (ead0bea): `idn-prov-lines.geojson` held **kabupaten-level** edges (68 in
    Kalbar alone, empty props) — drawn bold as `prov-line` it made the regency mesh masquerade as the
    province border. Now `prov-line` draws from the 38 real province polygons (`provinsi` source, incl.
    coastlines); `kab-line` = thin even hairline. Deleted the mislabeled file. (Several prior tuning
    passes 9c867f0/19fcd18 didn't fix it because the data itself was wrong.)
  - **SPPG · MBG** (2b943d0): ~5,598 Makan Bergizi Gratis kitchens vendored from `sismonbgn.com`
    (`build-sppg.mjs`, no-CORS parsed at build). Circle layer by status; **honest gap** — only ~28
    "Beroperasi" of ~5,598, legend prints "28 OPERASI / 5.598", labelled terdaftar not operating.
  - **KONSESI** (5c46c94): forest+plantation concessions from the **government original (KLHK) via BIG
    SatuPeta** — chosen over GFW because GFW licenses "CC BY 4.0 **excluding Indonesia**". `build-konsesi.mjs`
    → 1,040 polys (255 logging IUPHHK-HA + 292 HTI nationwide + 493 sawit izin usaha/lokasi, partial),
    server-side generalized. Pairs with TAMBANG. GFW-direct recipe + license blocker captured in research H.
  - **Ledgers** (`sumber.astro` + `DATA_SOURCES.md`) current for SPPG + konsesi.
  - **Pending:** P0c open-data give-back; PANGAEA mining footprints (optional); Phase 1 **Temuan Redaksi**
    findings board (surface Lane B — highest leverage); Phase 2 newsstand; Phase 3 real numbers. OpenSky
    secrets (Yose) → live planes; BPS key → live dossier indicators.
