# PLAN_LOG — ground-truth state + next steps

> A living plan log. Unlike `docs/CLAUDE.md` (the constitution, time-locked to
> mid-June 2026) and `docs/ROADMAP.md` (kept for history), this file tracks the
> **actual built state** read off the code, and the **next concrete moves**.
> The codebase is ground truth; where the older docs disagree, the code wins.
> Update the "Status" table and "Next steps" as work lands. Append to the
> changelog at the bottom each session.
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
- [ ] **BIG BATASWILAYAH → replace `public/data/idn-prov.geojson`** (PRIORITY: our
  bundled province polygons are inaccurate, esp. Papua). BIG = authoritative One-Map,
  confirmed browser-direct (`geoservices.big.go.id/rbi`, CORS reflects origin). Also
  unlocks accurate **kabupaten (ADM2)** drill-down. Supersedes the geoBoundaries plan.
- [ ] **SPPG / MBG kitchens** (`Hosted/SPPGJuli2025/FeatureServer/0`, BGN, ~9,407
  units @ 2025-09). FeatureServer query came back empty on probe (token/CORS?) → needs
  a worker-side probe; likely a `/geo/sppg` proxy + clustering. Ties to Act II MBG.
- [ ] **BIG health points** (layer 732, browser-direct GeoJSON) — supersedes
  healthsites.io. Paginate (`exceededTransferLimit`, 1000/page).
- [ ] **IMERG rainfall** raster overlay (NASA GIBS, drop-in like the CUACA radar).
- [ ] Later: WDPA protected areas, GFW deforestation alerts, GEM coal, WorldPop/Kontur.

### Track 2 · Act I revamp — brief: `docs/research/act1-revamp-brief.md`
Act I reads scattered/amateurish; the four RSS desks feel redundant + may be unwired.
Diagnose, re-spine the layout, resolve the news-desk taxonomy + wiring, dedup.
Read-only design pass first, then implement.

### Track 3 · Act III magazine revamp — brief: `docs/research/act3-revamp-brief.md`
Complete redesign into a signposted magazine (like Act II): peoples/indigenous tribes
(real Wikipedia writing, not a paragraph), art, musical genres, history, biodiversity.
Build on `docs/research/2026-06-27-act-iii-data-and-components.md`.

### Doc upkeep (standing)
Keep this file, `DATA_SOURCES.md` (new endpoints + recency), and `CLAUDE.md` §4
current as each item lands.

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

- **2026-06-26** — First full ground-truth read (every file touched). Documented
  the three-half flow, the newsroom→page consumption gap (§2), the roadmap status
  table (§3), and the prioritized next steps (§4). No code changed.
- **2026-06-27** — Stood up the local env (Node 22 tarball, pnpm 9 corepack, deps).
  **Migrated Astro 6 → 7** (Rust compiler + Vite 8/Rolldown; build 2m27s → ~50s;
  `.node-version` 22.23.1 pins CF Pages; both deploys green). Shipped two map
  features: **Open-Meteo flood + marine** in the click-report, and the **Climate
  TRACE CO₂ emitters** layer. Added research notes under `docs/research/` (map
  candidates, Act III data, Astro 7, + Act I/III revamp briefs). Backlog → §4.5.
