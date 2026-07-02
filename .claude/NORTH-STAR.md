# NORTH STAR, detak-detik: direction + ground truth + roadmap

> Written 2026-07-02 after a full ground-truth pass: recon script, three research
> agents (codebase map, Cloudflare free tier, Indonesian open data, all findings
> cited or probed live), all 16 screenshots reviewed, and the living docs read
> (`docs/CLAUDE.md`, `PLAN_LOG.md`, `DATA_SOURCES.md`, `PERSPEKTIF.md`,
> `detak-detik-briefing.md`, the two revamp briefs, the Act III research note).
> Coverage note: every island, worker route, desk, and workflow was inventoried;
> long files (`PetaKabar.svelte`, `choreo.ts`) were mapped, not read line-by-line.
> This doc consolidates direction. It does not repeat what `docs/CLAUDE.md`
> already legislates (iron laws, registers, conventions): those stand. Where this
> doc and older docs disagree, this doc wins; `PLAN_LOG.md` remains the
> session-by-session build log.

---

## 0. The verdict in one paragraph

The paper's identity is already excellent and must not be reinvented: a
typography-led state gazette, three registers, satire only in the data, receipts
everywhere. What is missing is (1) the loop: the multi-agent newsroom writes
ranked, fact-gated findings twice a day and the page renders only one headline
and one number (`src/scripts/pagi-live.ts`, PLAN_LOG §2); (2) an Act I worthy of
the masthead: the RSS desks are static, sparse, and redundant with the ticker;
(3) Act II and III run almost entirely on `(data contoh)`; (4) coherence debt:
no type scale (`base.css:41` styles h1/h2/h3 identically), inconsistent section
numbering, seam voids, four charts that render seeded fake series. The plan:
close the loop, rebuild Act I around a clustered, ownership-labelled newsstand,
turn Act II into a regime-agnostic accountability engine anchored on
constitutional mandates, unify Act III into one plate system with a reviewed
content backlog, and run a dedicated polish pass. All of it fits free infra
(verified quotas in §8).

---

## 1. Ground truth (2026-07-02)

### 1.1 Three cooperating halves

- **Page**: Astro 7 + Svelte 5, one 1,451-line `src/pages/index.astro`, ~40
  islands, three `[data-register]` acts, GSAP/Lenis choreography
  (`src/scripts/choreo.ts`), Zod command bus (`src/lib/commands/`), two stores
  (`lensa.ts`, `lensa-kab.ts`) plus `edition.ts` live overrides.
- **Worker** (`worker/src/index.ts`, stateless, KV only): `/ticker` (Lane A RSS,
  hourly cron), `/geo/*` proxies, `/ask` (Turnstile, rate limit, NIM chain,
  Workers AI fallback, no retrieval yet), `/tour`, `/edisi` GET/POST, `/pasar`.
  No D1, no DO, no Queues bound today (`worker/wrangler.toml`).
- **Newsroom** (`newsroom/`, Python, GitHub Actions 2x daily, gated by
  `NEWSROOM_ENABLED`): 7 desks, deterministic detect + LLM narrate
  (NIM, Groq, OpenRouter, Gemini fallback chain in `llm.py`), the fact gate
  (`gate.py`: cited ids must exist, numbers must match rows within 0.5%), lawyer
  pass, editor, publish to KV. All desk corpora are seeds; only `sources/pulse.py`
  fetches live. The MA scraper is a stub (`sources/hukum.py:40-51`).

### 1.2 Live vs contoh census

Live today: ticker RSS (6 outlets), BMKG quakes, PetaBencana floods, weather
(Open-Meteo), `/pasar` (USD/IDR + IHSG + Brent), AISStream ships, Mandum satwa,
bundled evidence layers (tambang, konsesi, batubara, emisi, sppg), Wikipedia
portraits, Commons/GBIF gallery. Everything else, roughly 25 of 40 islands, is
static contoh, including every Act II figure.

### 1.3 The one structural gap

The newsroom publishes rich `temuan[]` with bodies; the page consumes one
headline, one dek, one number. The four Act I desk rails render a static import
(`index.astro:76-97`), `#ag-list` has no producer and in fact no element (only a
CSS rule at `index.astro:1007`), and `NasionalPagi` subscribes to a `makro` no
desk emits. Close this before building anything new: it is the difference
between a newsroom harness and a static mock.

### 1.4 Top defects (ranked, from the code audit)

1. Fabricated time-series presented as charts: `Gelombang`, `JciVsPeers`,
   `RupiahIHSG`, `PetaPiksel` synthesize data via `lib/seed.ts`, visually
   indistinguishable from live feeds. For this paper that is a credibility
   defect, not a placeholder. Rule going forward: **a chart renders real rows or
   it renders an engraved placeholder plate; no seeded series, ever.**
2. No typographic scale: `base.css:41` puts h1/h2/h3 in one rule; sections mix
   `h2.bab-judul` and `h3.bab-subjudul` as siblings (`index.astro:387,575`).
3. Dead wiring: `#ag-list`/`AGENDA`/`HARGA` exports unused; `open_temuan` verb
   with no handler; duplicate `CABANG` in `edisi.ts:204` vs `cabang.ts:28`
   (only `cabang.ts` is consumed); `PetaAtlas.svelte` referenced nowhere.
4. Single env-var liveness gate: unset `PUBLIC_AKSARA_URL` silently reverts the
   whole live layer to contoh.
5. Seam voids: large empty black bands between acts (screenshots 03, 14).
6. Ledger drift: `sumber.astro` behind the shipped layers; `etl/sources.ts`
   lists ANTARA while the worker dropped it; `tokens.css:5-8` claims scroll
   lerps root tokens while `index.astro:882` says acts are static.
7. Heavy toggle payloads: `idn-tambang` 1.98 MB, `idn-sppg` 1.5 MB fetched on
   layer toggle on phones.
8. `docs/CLAUDE.md` §5 states "Vectorize 5M vectors free": wrong, it is 5M
   stored dimensions, about 4,880 vectors at 1024-dim (§8).

---

## 2. Thesis, unchanged; one law amended

Everything in `docs/CLAUDE.md` §1-3 stands: citation or silence, documents
speak, shared edition, local-first, the three registers, awwwards or nothing.

**Amendment (Lane C, formalized).** Iron law 2 keeps Lane A (external news) as
verbatim pass-through and Lane B (our journalism) as gated derivation from
primary data. Act I's newsstand introduces machine synthesis over Lane A items.
This is Lane C and it obeys three rules:

1. **Labelled**: every synthesized text carries the mono chip `SARI · LANE C`
   (sari: the extract). Neutral cluster headlines are Lane C. Verbatim source
   headlines are always shown beneath, untouched, linked (Lane A preserved
   inside the same surface).
2. **Grounded**: the summarizer receives only the collected item texts, must
   cite item ids per sentence, and must return `insufficient_source_evidence`
   rather than pad. The existing fact-gate pattern (`gate.py`) extends to it:
   any number in a Lane C sentence must appear in a cited source item.
3. **Bounded**: Lane C never characterizes intent, never rates outlets
   "biased", and never mentions an individual with an accusation without
   tripping `needs_human_review` (the briefing's rule 3/4, now code).

Source labels are ownership facts, not bias ratings: the 7-conglomerate roster
(Kompas Gramedia, MNC, CT Corp, Media Group, Bakrie/Viva, Jawa Pos, Tempo) is a
static curated dataset with receipts. RSF's Media Ownership Monitor never
covered Indonesia (probed 2026-07-02), so this roster is the differentiator and
it double-feeds Act II's oligarchy material.

---

## 3. Act I · PAGI: the newsstand that sets its own type

Role: what is. The morning read. Hero changes from the map to the news itself.

### 3.1 Ordered structure

1. Masthead + clockwork + KILAS ticker (unchanged; ticker stays pure Lane A).
2. **RAK KABAR** (new hero): the clustered front page (§3.2).
3. **ANGKA PAGI** strip: `NasionalPagi` numbers + `PasarPagi` + `CuacaPagi`
   consolidated into one ruled band (three components, one grid, one heading).
4. **PETA KABAR**: the live map as the front-page photograph (§6), with
   `LaporanLokasi` click report. `LensaWilayah` moves out (§4.3).
5. **HARGA PANGAN** (`Gelombang`) once the NFA feed is live; until then the
   engraved placeholder state, per §1.4 rule 1.
6. `SensusDiri` moves to Ruang Main (it is a mirror toy, not morning news).

### 3.2 RAK KABAR: the self-composing front

Twice a day the pipeline (§8.2) delivers ranked story clusters. The board is a
broadsheet front whose typographic hierarchy is computed from the data:

- **Lead** (1): Fraunces headline sized by corroboration score, one-line dek
  (Lane C), and the agate annotation that explains the layout itself:
  `MENGAPA UTAMA: 9 media · 4 grup kepemilikan · 3 jenis sumber`. The paper
  showing its editorial arithmetic is the signature move; transparency becomes
  the aesthetic.
- **Secondary** (2-3): smaller headlines, same anatomy.
- **Rak** (the shelf): compact ruled rows for the remaining clusters, grouped
  under the existing four desks (Nasional, Daerah, Alam, Dunia): the desks stop
  being redundant RSS buckets and become shelves of clustered stories. Ticker =
  raw wire (verbatim); Rak = clustered stories (Lane C headline + Lane A
  sources). No overlap remains.
- **Corroboration bar** per story: a segmented mono bar, one segment per source
  type present (media RSS, GDELT signal, expert feed), each labelled. Form:
  ordered categorical, not a gauge.
- **TITIK BUTA stamp**: clusters where all coverage sits inside one ownership
  group get the official-stamp motif (ornament kit) + the group's name. The
  Indonesian blindspot is ownership concentration, stamped as a documented fact.
- **Naik daun**: no carousel. Clusters gaining sources between editions carry a
  small climbing-arrow glyph + `+n sumber sejak edisi pagi`. Movement is shown
  as a printed delta, in keeping with a paper, not a feed.

### 3.3 LEMBAR KLIPING: the story sheet

Click a story: the card tears off (reuse the struk perforation + `strukTear`
motion vocabulary in `choreo.ts:491`) and unfolds into a full-viewport clipping
sheet, one CSS 3D fold, crossfade under reduced motion. Every sheet is a URL
(`/kabar/[slug]`, iron law 4). Anatomy, top to bottom:

1. Lane C headline + dek + `SARI · LANE C` chip + corroboration bar.
2. **SUARA**: attributed expert excerpts from the curated roster (The
   Conversation ID and Project Multatuli ship full-text RSS, probed 200;
   Bluesky DID roster later). Named people only, tagged by field.
3. **LIPUTAN**: every outlet covering the cluster: its verbatim headline, its
   ownership-group tag, timestamp, link. This is the Ground News footer
   localized to ownership.
4. **TANYA**: reader FAQ (batched, clustered, grounded answers;
   `tidak cukup informasi dari sumber` is a first-class answer).
5. Receipt footer: R2 snapshot ids, retrieval time, `dicetak otomatis` colophon.

### 3.4 What Act I loses

The four-desk static rails (superseded by the Rak), `IndeksPagi`-era leftovers,
`LensaWilayah` (to Act II), `SensusDiri` (to Ruang Main). One hero, satellites,
one scroll spine: the act should read top-to-bottom with no competing focal
points.

---

## 4. Act II · MALAM: the accountability engine

Role: what is wrong, and against what standard. The register (Mesin) and the
two-gear structure (Lima Cabang, then Keadaan Negeri themes) already work; the
upgrade is standards, live data, region, and party.

### 4.1 MANDAT: functions before failures

Each branch chapter opens with a certified-excerpt block: the constitutional
mandate, quoted and linked (UUD 1945 via a one-time Wikisource ETL; articles:
eksekutif Pasal 4, legislatif Pasal 20/20A, yudikatif Pasal 24, aparat Pasal 30,
daerah Pasal 18). Set as an official document: hairline frame, stempel,
article number as nomor-surat. Below it, the chapter's metrics are framed as
FUNGSI (what the constitution assigns) vs FAKTA (what the record shows). The
same metric definitions survive any regime: they are rates and ratios,
recomputed each edition, so the engine outlives this cabinet and scores the
next one identically.

### 4.2 Regime-agnostic metric set (function → proxy → source → form)

| Cabang | Fungsi (cited) | Proxy metrics | Source (verified) | Form |
|---|---|---|---|---|
| Eksekutif | menjalankan UU, Pasal 4 | % UU with implementing PP/Perpres on time; audit opinions; budget realization vs target | JDIH BPK (`peraturan.bpk.go.id`, datacenter-reachable) + rekapitulasi counts; BPK IHPS; APBN portal (geo-blocked, vendor via proxy/manual) | follow-through tracker (on-time/late/missing ledger rows); WTP share dumbbell |
| Legislatif | membentuk UU, Pasal 20 | prolegnas completion; days draft-to-gazette distribution; sitting attendance; LHKPN compliance | DPR site (browser-context scrape), JDIH dates, existing `PabrikUU` grammar | log-scale duration bars (exists, deepen); distribution strip |
| Yudikatif | kekuasaan kehakiman, Pasal 24 | clearance rate; sentence-vs-loss gradient; % recovered | MA putusan (browser-context; corruption verdicts only), KPK/ICW recovery | `GradienKeadilan` scatter (exists), recovery waffle |
| Aparat | keamanan, Pasal 30 | incidents → criminal court vs ethics-only funnel; officers in civilian posts | KontraS/Imparsial annuals (RSS + PDF extraction, fact-gated) | funnel (exists in `SkorCabang`) |
| Daerah | otonomi, Pasal 18 | PAD self-financing; belanja pegawai vs modal vs Permendagri caps; audit opinions per pemda | **DJPK `csv_apbd` (keyless, kab-level, probed 200)**; BPS WebAPI | scatter 38 prov + breach ledger; the Lensa (§4.3) |

Every FAKTA row keeps the independent-vs-state doctrine from
`DATA_SOURCES.md`: independent monitors frame, state sources baseline.

### 4.3 LENSA DAERAH (moved here, deepened)

`LensaWilayah` is already a pure store consumer (`lensa.ts`, `lensa-kab.ts`), so
the move is cheap. It becomes the Daerah chapter's instrument: search or pick a
province, drill to kabupaten, and read a dossier: penduduk/IPM/kemiskinan/TPT
(BPS WebAPI, key registered, build-time vendored), PAD ratio + belanja pegawai
(DJPK, keyless), audit opinion (BPK), corruption case counts (ACCH,
browser-context), dominant parties by 2024 results (KPU sirekap artifacts).
A small inline SVG locator map (drawn from the bundled `idn-prov.geojson`) shows
where you are; the big map is not duplicated. In-map, clicking a region still
files into the lens: the map scrolls the reader down to the chapter (the bus
already carries `set_lensa`/`set_lensa_kab`).

### 4.4 PARTAI & KEPENTINGAN (new, v1 honest)

MyMP-for-parties, built only from documented facts: per party, seats and fraksi
size (Wikidata: 2,871 DPR member entities with P102 affiliation, CC0), cabinet
posts, governorships, media-ownership ties (the roster), audited campaign
finance (KPU Sikadeka PDFs, LLM-extracted, fact-gated), and case counts
involving cadres (ICW/ACCH). Form: one ruled card per party, waffle of seats,
ledger of receipts. v2 (deferred): member-level pages, LHKPN deltas, procurement
ties (the briefing's graph). No inference, no "interest scores": documents only.

### 4.5 Newsroom memory

Every published edition is already an artifact; keep the last N in R2/repo and
give desks the previous edition as context, so Lane B copy states deltas
(`turun 0,3 poin sejak edisi 12 Juni`) with both editions cited. This is cheap
(JSON diff) and makes the paper feel alive without new infra.

### 4.6 Exhibits cadence

`PERSPEKTIF.md` stays the backlog. Rhythm: each phase lands 1-2 Tier 1 pieces
(Pabrik UU v2 and Gradien Harta first: both anchor branch chapters). The
cohesiveness rule stands: one-sentence juxtaposition or it ships as archive.

---

## 5. Act III · NUSANTARA: the permanent record

Role: what remains. The catharsis. Uplifting, plainly stated, license-clean.

### 5.1 One plate system

Adopt the briefing's diagnosis: the act reads fragmented because every content
type has a bespoke layout. Build **one Almanak plate template** (Atlas register:
frame, plate number `PLAT HARI KE-186`, engraved fallback, source chip) and feed
it seven pipelines: Manusia, Rupa (art), Bunyi (music), Ingatan (history),
Hayati (species), Tanah (geography/volcano), Bahasa. `AlmanakSains` already has
the right skeleton; generalize it rather than invent.

### 5.2 Chapters and sources (all verified)

- **Manusia**: rotating peoples profile with substantial writing. Safety rule
  (adopted): batch-generate a reviewed backlog (start: 20 profiles), Yose
  reviews once, rotation only serves reviewed profiles. Sources: id.wikipedia
  REST + Wikidata + WBTb entries (portal moved to `budaya-data.kemdikbud.go.id`,
  1,941+ entries, probe from browser first). Image logic per `PERSPEKTIF.md`:
  Commons photo or the labelled painting fallback; never an identifiable person
  without clear license.
- **Rupa**: daily painting (Commons categories: Tropenmuseum 51,504 files,
  KITLV; Rijksmuseum free key). Colonial-era imagery gets a provenance line
  (where it sits today) as quiet context.
- **Bunyi**: genre plates (gamelan, keroncong, dangdut, sasando...) from
  Wikipedia/Wikidata + MusicBrainz metadata; PD audio via Commons/Internet
  Archive when license-clean. Metadata only, no lyrics.
- **Ingatan**: on-this-day. id feed 404s (verified), so: Wikidata SPARQL events
  filtered to Indonesia + en feed fallback, curated deck retained.
- **Hayati**: the **Daftar Merah Nusantara** ledger (speced in the Act III
  research note): ~30 endemics, live IUCN codes, re-sorts by extinction risk on
  load. Image rule: living animals (GBIF/iNaturalist CC0/CC-BY), no taxidermy
  (the current Cendrawasih museum specimen reads wrong for a celebration act).
- **Tanah**: keep `GunungApi` triangles + the Wallace spread; add the sky
  almanac (sunrise/moon-phase strip, keyless, true terminator drawing).
- **Bahasa**: upgrade `Bahasa718` into **Peta Bahasa yang Memudar**: Glottolog
  CLDF (CC-BY) baked at build, each languoid a mark at its coordinates colored
  by real AES status, endangered marks decaying first on the Game-of-Life tick.
  The act's emotional center.

### 5.3 The atlas plate + region rotation

Revive the dead `PetaAtlas.svelte` (engraved canvas plate, already written,
referenced nowhere) as the act opener: a still, hatched archipelago with pins
(volcanoes, heritage sites, language points, peoples). Clicking a region, or
arriving with a lensa already set from Acts I/II, rotates the act's plates to
that region (its people, its species, its heritage entry) when reviewed content
exists, national rotation otherwise. One store (`lensa.ts`) already carries the
region; Act III just starts listening.

### 5.4 Ruang Main

Stays separate below the rule, gains `SensusDiri`. `TuguRakyat`: keep
local-first; the DO-backed shared canvas is now free-tier feasible (verified)
but ships only after an abuse review; palette + cooldown already exist.

---

## 6. The map, settled

**V1 (now): the map stays in Act I** as the front-page photograph. Reasons: its
live layers are news (quakes, fire, flood, air, rain, planes, ships); Act I
keeps a single WebGL instance; Act III's register wants stillness, which the
revived engraved `PetaAtlas` provides at near-zero cost. Changes:

- Default-on = the news set. Evidence layers (tambang, konsesi, batubara,
  emisi, sppg) default off and are reached from Act II: each relevant chapter
  gets a `BUKA DI PETA` chip that dispatches the existing bus verbs
  (`set_layer` + `scroll_to`), so the map serves Act II without moving.
- Heavy layers lazy-load on toggle with a size hint (`1,9 MB`) printed by the
  toggle: honesty about payloads on phones.
- **V2 (the awwwards stretch, deliberately deferred): the traveling map.** One
  MapLibre instance whose container Flip-glides between an Act I socket and an
  Act III socket, swapping basemap + layer preset + register costume mid-glide.
  Spectacular, but it must not gate anything above; build it when V1 is stable.

---

## 7. Design system hardening (the coherence pass)

1. **Type scale**: define `--fs--1..--fs-6` (modular, one ratio) in
   `tokens.css`; components consume tokens; kill per-component ad-hoc clamps.
   Fix h2/h3 sibling misuse; one heading level per hierarchy level.
2. **Numbering grammar, one system**: Act I `§n` (fix the duplicated §4),
   Act II `GERAK I/II` + `BAB 01..` + exhibits `BUKTI №n`, Act III `LAMPIRAN` +
   `PLAT`. Every section header same anatomy: kicker (mono), title (display),
   dek (fig). Left-aligned is fine; identical construction is the point.
3. **Chart palette per register**: extend each register with a 4-step
   categorical set + a sequential ramp (EMBER generalizes), validated with the
   dataviz palette validator against all three surfaces (`#d6cbac`, `#100f0d`,
   `#ece2cb`); engraved hatching is the built-in CVD/texture fallback. House
   rules: one axis always, no dual-axis, direct labels over legends when ≤4
   series, numbers in tabular mono, every chart carries its chip.
4. **Seams**: fixed-height ribbon flips only; no viewport-tall voids. The world
   dots plate either becomes a real Dunia exhibit or goes.
5. **Placeholder doctrine**: the engraved plate + `CONTOH` chip is the only
   placeholder; delete the seeded-series pathway entirely.
6. **Share cards**: one canvas template per family (temuan, struk, kliping,
   obituari, wordle) + OG images per permalink; WhatsApp is the distribution.
7. **Motion budget** (unchanged law, now enforced): max two live ambient
   canvases per viewport, IO-pause offscreen, transforms/opacity only, full
   reduced-motion paths. The `ScrollTrigger.refresh()` band-aids get replaced
   by explicit island-height reservations (CSS `min-height` per island socket)
   so late hydration stops moving the page.

---

## 8. Infra: free-tier architecture (quotas verified 2026-07-02)

### 8.1 The numbers that matter

- Workers: 100k req/day, 10 ms CPU (I/O wait is free), 5 crons.
- KV: 1,000 writes/day (the trap), 100k reads/day. D1: 5M row-reads/day, 5 GB.
- **Vectorize free = 5M stored dimensions total, about 4,880 vectors at
  1024-dim bge-m3. Not a RAG store. (Corrects `docs/CLAUDE.md` §5.)**
- Workers AI: 10k neurons/day, roughly 9.3M bge-m3 embedding tokens/day,
  callable over REST from GitHub Actions (account-level allowance).
- **AI Search (AutoRAG rebrand): free open beta, 20k queries/mo, 100k files per
  instance, managed chunking + hybrid retrieval over R2. The RAG unlock.**
- R2: 10 GB + free egress (the provenance layer). Pages: 500 builds/mo, so
  fast data never rides a rebuild (KV `/edisi` already avoids this).
- DO now free (SQLite backend): enables Jetstream + Tugu later.

### 8.2 Pipeline (static-first, verdict: keep and extend)

GitHub Actions stays the brain; Cloudflare stays the edge cache + receipts.

```
GH Actions (2x daily, Python newsroom)
  desk KLIPING (new): RSS roster + GDELT -> normalize
    -> embed (Workers AI REST, bge-m3) -> cluster in-process
    -> corroboration score (source types x ownership groups)
    -> Lane C summarizer + SUARA extraction + FAQ (LLM chain, cited)
    -> editorial gate (needs_human_review queue)
  desks 1..7 (existing) + memory diff vs previous edition
  -> fact gate -> lawyer -> editor -> POST /edisi (KV)
  -> provenance snapshots + edition archive -> R2
Worker: /edisi /ticker /pasar /geo /ask(+AI Search retrieval later) /tour
Page: SSR contoh -> pagi-live.ts upgrades from /edisi + /ticker
```

D1 enters only when an interactive query feature ships (kliping archive search,
Lensa lookups). A tiny Vectorize index (cluster centroids, hundreds of vectors)
is optional for between-edition cluster assignment; it fits the free cap.

### 8.3 RAG (last, per the standing roadmap)

Corpus to R2 (UUD via Wikisource one-time ETL, JDIH BPK law metadata, published
editions, DATA_SOURCES rows, putusan subset) -> AI Search instance -> `/ask`
retrieval -> runtime fact-gate (strip uncited ids, drop mismatched numbers) ->
`{jawaban, cited_ids}` + bus commands. Keep raw chunks archived so we can
re-index elsewhere if beta pricing lands (30-day notice promised).

### 8.4 Ledger corrections to write back into `DATA_SOURCES.md`

- Panel Harga `api-panelhargav2` now 401s: register `webapi.badanpangan.go.id`
  (manual approval, start now). Until then Gelombang shows the placeholder.
- Frankfurter moved: `api.frankfurter.dev/v1/latest`.
- APBN portal alive at `data-apbn.kemenkeu.go.id/be/api/data-series` but
  geo-blocked to Indonesian IPs (Actions runners will 403 too): vendor manually
  or via an ID-egress proxy.
- putusan3, mkri.id, dpr.go.id, acch.kpk.go.id now Cloudflare-challenge
  datacenter IPs: scraping needs browser context (CF Browser Rendering free
  10 min/day, or local). hukumonline: paywalled, no public API; JDIH BPK is the
  corpus instead.
- WBTb count now 1,941+ (was 1,728); portal moved to budaya-data.kemdikbud.
- `indonesia-civic-stack` (PyPI, MIT): maintained KPU/LHKPN/BPS/JDIH/APBN
  scrapers + MCP tools. Candidate dependency for the newsroom, check footprint
  and pin before adopting (house install rule).

### 8.5 Quick wins, ranked

1. DJPK `csv_apbd` (keyless, kab-level fiscal) -> Lensa + Daerah metrics.
2. BPS WebAPI key -> poverty/IPM/TPT, 514 kab, build-time vendored.
3. BMKG kelurahan forecast (`api.bmkg.go.id/publik/prakiraan-cuaca?adm4=`,
   keyless, joins `idn-wilayah.json`) -> CuacaPagi + LaporanLokasi upgrade.
4. Wikidata DPR members SPARQL -> party tracker skeleton.
5. JDIH BPK scrape -> implementing-regulation follow-through metric.
6. Web API NFA registration (do now; approval lag) -> Harga Pangan live.
7. Commons Tropenmuseum harvest -> Rupa backlog.
8. The Conversation ID + Project Multatuli full-text feeds -> SUARA lane.
9. KPU sirekap artifacts (browser/CI fetch) -> Lensa parties + tracker.
10. OpenSky secrets + BPS key + MAGMA token (already-scaffolded lanes go live).

---

## 9. Roadmap

Phases ship in order; each is releasable. Parallel agent fan-out noted per
phase (cap 5, prefer read-only or disjoint-file agents on this host).

- **P0 · SELARAS (coherence + truth pass, 1-2 sessions).**
  Close the newsroom loop (render `temuan[]`: the orphaned `.temuan-*` CSS at
  `index.astro:1225` is the slot; fix or remove `agenda`/`makro` wires). Type
  scale + numbering grammar + section-header anatomy. Kill seeded series
  (placeholder plates until feeds land). Delete dead exports/verbs, resolve
  the duplicate `CABANG`, wire or park `PetaAtlas` (park: it revives in P3).
  Seam fixes. Sync `sumber.astro` + `DATA_SOURCES.md` corrections (§8.4).
  Register keys (NFA, BPS; add OpenSky secrets). *Fan-out friendly: the small
  visual polish (padding, alignment, artifacts) runs as parallel agents on
  disjoint components after the type scale lands, so they polish against the
  new tokens, not the old chaos.*
- **P1 · KLIPING (Act I newsstand, 2-3 sessions).**
  Ownership roster dataset + meja kliping desk (fetch, embed, cluster, score)
  -> `RakKabar` board + `LembarKliping` sheet + `/kabar/[slug]` + TITIK BUTA +
  SUARA + share cards. Editorial gate queue (a simple flagged-list Yose clears).
  Desks-as-shelves refactor; ticker untouched.
- **P2 · MANDAT (Act II engine, 2-3 sessions).**
  UUD ETL + MANDAT headers. DJPK + BPS wiring (Lensa Daerah move + kab dossier).
  Regime-agnostic metric rows per branch (start where data is keyless). Partai
  v1. Newsroom memory deltas. Land Pabrik UU v2 + Gradien Harta from the
  PERSPEKTIF Tier 1 queue.
- **P3 · ATLAS (Act III, 2 sessions).**
  Plate template + chapter consolidation. Manusia reviewed backlog (batch,
  review once, rotate). Daftar Merah + sky almanac + Peta Bahasa yang Memudar.
  PetaAtlas revival + region rotation. Living-image rule.
- **P4 · AKSARA + RAG (last, multi-session).**
  `render_chart`/`show_table` verbs (constrained spec, code supplies numbers),
  AI Search corpus + `/ask` retrieval + runtime fact-gate, tours rewritten for
  the new layout.
- **Continuous**: one PERSPEKTIF exhibit per phase; ledgers kept in sync (both
  `DATA_SOURCES.md` and `sumber.astro`); every phase ends with the
  build-screenshot-verify ritual at 390px and 1280px.
- **Stretch (post-P4)**: the traveling map (§6 V2), Tugu Rakyat shared canvas
  (DO), Bluesky Jetstream ingestion, D1 kliping archive search, member-level
  party pages.

## 10. Needs from Yose (unblockers, all small)

1. Register the BPS WebAPI key and the Web API NFA account (both free; NFA has
   manual approval lag).
2. Add `OPENSKY_CLIENT_ID/SECRET` GitHub secrets (planes go live).
3. Decide the Lane C label word (`SARI` proposed) and approve the amendment §2.
4. Review cadence for the Manusia backlog and the kliping flag queue (you are
   the editorial cell v1).
5. Approve `indonesia-civic-stack` adoption after the footprint check.

## 11. Open questions (parked, not blockers)

- Bluesky DID roster size/curation and whether to publish it (transparency).
- Corroboration threshold start value (2 source types proposed, calibrate).
- Whether Act II exhibits rotate per edition or accumulate into archive pages.
- The traveling map's perf reality on budget Android (prototype behind a flag).
