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

### 3.5 REVISION 2026-07-02 (post RakKabar v1, agreed with Yose)

The v1 newsstand shipped and validated the mechanic; Act I now carries FOUR
news surfaces (Kabar Utama, Ringkas Pagi, Rak Kabar, four rubrik desks), some
printing the same stories twice. The consolidation:

1. **One news surface: HALAMAN MUKA.** The Rak absorbs everything above it.
   Top slot = TEMUAN UTAMA (Lane B, the paper's own lead + dek + receipt),
   a rule, then the Rak lead cluster and ranked rows (Lane A). Kabar Utama
   as a standalone block dies; Ringkas Pagi dies (the ticker and the Rak
   carry the wire); the four rubrik desks die as a section and return as
   FILTER CHIPS on the Rak (NASIONAL / DAERAH / ALAM / DUNIA), fed by a
   deterministic keyword classifier (`meja` field on each cluster).
2. **Digg translations, gazette-ified** (from Yose's reference shots):
   the pipeline transparency strip under the Rak head
   (`495 JUDUL · 32 KLIPING · DISUSUN 16.33 WIB`, real numbers from the
   desk); rank numerals on rows (ghost-num); `tumbuh` arrows once edition
   memory lands; TODAY/7-DAYS tabs deferred until the kliping archive
   exists. Story page sub-angle chips (Digg's USAGE WATCH / OPEN QUESTION)
   become Lembar Kliping's labeled sections when Lane C lands.
3. **Weather integrates into the map block** (Yose: standalone strip is
   unaligned and useless): CuacaPagi becomes a slim ruled row inside the
   §PETA KABAR header, sharing its grid; the standalone section dies.
4. **Sensus Diri moves to Ruang Main** (mirror toy, not morning news).
5. **Act I section spine after the cut**: masthead + KILAS, HALAMAN MUKA
   (temuan utama + rak), §1 ANGKA PAGI (Negara Hari Ini + Pasar Pagi as one
   ruled band), §2 HARGA PANGAN, §3 PETA KABAR (with weather + lapor).
   Lensa Wilayah leaves for Act II Daerah (see 4.3); big NasionalPagi
   figures print abbreviated (Rp 10.329 T), never wrapped raw integers.
6. **Redundancy law (site-wide, from the audit):** one number, one owner.
   A chapter's hero stat prints once at scale (CabangBand); every other
   component in the chapter must show a DIFFERENT cut or structure, never
   restate the anchor. Documented duplicates to kill: KabinetWaffle's big
   109 (waffle + legend stay), the KontraS box's big 602 (text stays),
   RupiahIHSG's IHSG side panel (JciVsPeers owns that story), PapanAngka's
   sembako card (Gelombang's basket owns it), cabang.ts Danantara caption
   (the waffle clock + wall card own it, two instances max with distinct
   jobs).
7. **Lensa Wilayah**: v1 move into Act II Daerah as planned. v2 concept,
   logged for later: KARTOTEK, a card-catalog drawer (state-archive
   metaphor): each province an index card pulled from a drawer, national
   comparison spine always visible, kabupaten as a second drawer. Bespoke
   form, fits the document-ornament kit.
8. **Act III redesign (escalated to THIS wave, Yose 2026-07-02): the
   magazine.** Act III adopts Act II's signposted chapter grammar in the
   Atlas register: LAMPIRAN I MANUSIA / LAMPIRAN II HAYATI & RUPA /
   LAMPIRAN III TANAH, each with the unified bab-kepala anatomy (kicker,
   Fraunces tajuk on the scale, formal dek). Writeups get feature
   typography: drop caps, a measured two-column body where width allows,
   fig-italic provenance lines, plates on a consistent grid. Data viz per
   chapter earns its place like Act II exhibits (the language barcode, the
   volcano triangles, the extinction ledger). Content pipelines (reviewed
   Manusia backlog, Daftar Merah, sky almanac, Peta Bahasa yang Memudar,
   region rotation) remain the following wave; this wave ships the chrome,
   typography, and layout so the act reads as a magazine, not a stack of
   cards.
9. **Flue migration (Yose: the chosen direction).** A concise migration
   assessment lives in section 12 (agent-researched): what maps from the
   Python newsroom to Flue, the phased path that never breaks the
   twice-daily print, and the go/no-go signal. Aksara's interactive lane
   is the natural first Flue surface; the batch newsroom follows only
   after a pilot desk proves the fact-gate equivalent.

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
6. Rotate `NIM_API_KEY` (or add GROQ/OPENROUTER/GEMINI keys) — SARI and
   model phrasing lanes are dead until then (see §14 wave-3 addendum).
7. Make a free pasal.id account and file its API token as a repo secret
   (`PASAL_API_TOKEN`) — unlocks legal search for Aksara + the pasal.id
   MCP server (§13.11). The public law pages stay linkable without it.
8. **BPS indicator snapshots (manual browser download — scripts cannot):**
   every BPS surface carrying numbers is Cloudflare-challenged, so grab
   these xlsx from bps.go.id in a normal browser and drop them in
   `newsroom/data/bps/` (any filename): (a) IPM per kabupaten/kota
   (latest), (b) persentase penduduk miskin per kabupaten/kota,
   (c) TPT per provinsi, (d) PDRB per kapita per kabupaten. A convert
   script will join them to the registry on the 4-digit BPS code and
   feed the map choropleth + Lensa Wilayah. Quarterly/annual refresh.

## 11. Open questions (parked, not blockers)

- Bluesky DID roster size/curation and whether to publish it (transparency).
- Corroboration threshold start value (2 source types proposed, calibrate).
- Whether Act II exhibits rotate per edition or accumulate into archive pages.
- The traveling map's perf reality on budget Android (prototype behind a flag).

## 12. Flue migration assessment (agent-researched, verified 2026-07-02)

Flue (github.com/withastro/flue, Apache-2.0): the Astro team's TS agent
framework: defineAgent/defineTool/defineWorkflow on the Pi harness
("Project Think", the read-act-observe-correct loop), runtime-agnostic
across Node, Cloudflare, GitHub Actions. On Cloudflare each agent is a
Durable Object with fibers (checkpoint/resume) and a SQLite-backed FS.

### Mapping (newsroom -> Flue)

| today | Flue equivalent |
|---|---|
| desk detector (deterministic) | plain TS step in a defineWorkflow |
| narrate() (Pydantic AI typed output) | session.prompt with a Valibot result schema |
| gate.periksa + ModelRetry(reason) | v.rawCheck in the schema; auto-retry, ResultUnavailableError -> deterministic fallback. CAVEAT: whether the check message feeds back verbatim is undocumented; spike first, worst case a 5-line manual loop |
| lawyer / editor | second gated prompt step / pure TS step |
| publish (POST /edisi) | defineTool or fetch; direct KV binding on Workers |
| llm.py FallbackModel chain | openai-compatible registerProvider for NIM/Groq; NO fallback primitive, hand-roll try/catch |
| main.py on Actions cron | npx flue run <workflow> --target node, JSON to stdout |
| worker /ask /tour | a durable Flue agent per conversation, typed tools over /edisi + corpus |

### Adds / loses

Adds: stateful live Aksara (DO-backed, streams state and tool calls to the
page), one language across worker + newsroom (gate.py was ported FROM
factGate.ts originally), markdown skills (the pedoman as a loadable
skill), durable batch resume. Loses/risks: 1.0.0-beta.9 with ~2
releases/week and admitted breaking changes (pin exact versions); the
proven retry-with-feedback semantics; LiteLLM's fallback+auth
normalization; no @flue/svelte yet (React only; use raw @flue/sdk);
Dynamic-Workers sandboxing is paid, keep it off; the Python sources/
scraping stack does not port and should not.

### Phased path (the print never breaks)

1. NOW: Aksara lane as a new Flue app beside the worker (additive; free
   tier holds: DOs free on SQLite, 10 ms CPU fine for I/O-bound calls).
   Old /ask stays until parity.
2. One pilot desk (harga) as a Flue workflow inside the same Actions cron
   via npx flue run, consumed behind a flag; compare gate pass-rates over
   ~10 editions. Print stays 100% Python.
3. The batch, only after Flue 1.0 stable AND the pilot wins.

Verdict: GO now on phase 1 only; NO-GO on migrating the batch today.
Re-assess at 1.0 stable; pin 1.0.0-beta.x exactly wherever adopted.

## 13. THE GRAND REDESIGN — every component, one doctrine (planned 2026-07-02)

This section consolidates and supersedes the per-act sketches in §3.5 and the
hardening list in §7 wherever they conflict. It exists because the NEGARA HARI
INI gauge board set the quality bar: Yose's verdict was "this is what we want
with the others as well." So: what made it work, codified, then applied to
every component from masthead to kolofon.

### 13.1 The doctrine (why the gauge board worked)

1. **Form = the data's own logic.** A reading-against-target is a gauge. An
   absence is an unpaid ledger row. A composition is a waffle. A gap is a
   bracket with a distance label. A flow is a funnel. Ask "what is the claim?"
   — never "which template is free." If two components share a form, their
   data must share a logic.
2. **The finding is drawn, not adjectived.** Needle outside the band; bracket
   reading −2,4 PP; scribble circling a zero. The reader concludes. No
   dramatic copy, ever (tone law).
3. **Ink on paper, not boxes.** Hairline rules and vertical rhythm carry
   structure. `border` + `background: var(--card)` is reserved for true
   *artifacts* — things that are physically objects in the newspaper fiction
   (struk, infobox, meter plates, museum labels, the torn lembar). Everything
   else is open ledger. Current offenders (grep 2026-07-02): PapanAngka,
   aparat cols, GarisStart, parts of PetaKabar chrome.
4. **Three voices of type.** Display/Fraunces = the voice of record (values,
   titles). Body = reading voice. Geist Mono = the apparatus (labels, scales,
   receipts, legends) at exactly three sizes (see 13.6). Data numerals always
   tabular, always id-ID.
5. **One motion per instrument, and the motion enacts the measurement.**
   Needle sweeps, bar draws, stamp slams, counter ticks. IO threshold 0.3;
   reduced-motion = the resolved state, never a blank.
6. **Receipts compose the picture.** The ⊙ chip is placed like a plate mark
   (bottom edge, aligned), not appended as an afterthought.
7. **Register is mood.** Dinas khaki = the morning ledger. Mesin black = the
   instrument room (plates, meters, gold/madder ink). Atlas cream = engraved
   plates and magazine serif. A component moved across registers must be
   re-tuned, not just re-tokened.

### 13.2 Act I — HALAMAN MUKA becomes one feed (decision)

Yose asked: drop TEMUAN UTAMA, open with the Rak, Digg-like. **Yes — with one
amendment: the paper keeps its voice by leading the feed, not by owning a
separate block.**

- Kill the standalone `pagi` section (headline + receipt rail — wave 2's rail
  was a patch on a redundant block; Yose confirmed).
- **The feed** is the front page: masthead → ticker → EDISI feed.
  - Entry №1 = the paper's own lead finding, typeset broadsheet-large inside
    the feed, tagged `DARI MEJA REDAKSI`, madder inkbar, receipt chips inline
    under the dek, stamp. Distinct voice, same surface. (ids ku-judul/ku-dek/
    ku-chips/ku-stamp/ku-serial/ku-src move here; pagi-live unchanged.)
  - Entries №2… = kliping clusters, Digg-grammar rows: ghost rank numeral,
    headline (opens Lembar), meta line in mono (N MEDIA · N GRUP + ownership
    squares + meja tag + TITIK BUTA stamp when earned). Generous row height,
    hairline separators, no boxes.
  - **Cut the lead cluster's inline liputan list from the feed** — that is
    the duplication Yose flagged (headline row already shows sources via
    squares; the full coverage list belongs to the Lembar).
  - Meja filter chips + transparency strip ride the feed header (exists).
- Below the feed, Act I keeps only: PASAR (see 13.4), PETA KABAR (+cuaca).

### 13.3 Lembar Kliping v2 — from sheet to dossier (the Digg move)

The v1 tear-off sheet ships the mechanic; v2 makes it a full page. Anatomy,
top to bottom (every layer gated by the lanes):

1. **KEPALA** — meja tag, meta counts, ownership squares, stamps.
2. **JUDUL** — the lead outlet's verbatim headline (Lane A), credited.
3. **SARI** *(new, newsroom)* — 2–3 sentence machine overview of the cluster,
   labeled `SARI · LANE C`, fact-gated against the clips.
4. **BUTIR** *(new, newsroom)* — 3–5 key points; each butir must cite ≥1 clip
   by outlet (inline mono credit). Fails the gate → the butir is dropped, the
   section prints shorter. Silence over invention.
5. **SUARA** *(new, phased)* — the POV layer.
   - v2a (RSS-only): contrasting *verbatim headlines/ledes* grouped by
     ownership group — "how each group tells it," which is our thesis and
     needs zero synthesis.
   - v2b (article fetch): named-expert quotes extracted from article bodies,
     Lane A verbatim + attributed. Requires the newsroom to fetch article
     HTML for top clusters (respect robots, cache, budget) — separate task.
6. **LIPUTAN** — the full outlet list with ownership labels (exists in v1).
7. **KAKI** — legend + link to /sumber#kliping methodology row.

Mechanics: grow the takeover to near-fullscreen (keep the torn edge — it's
the signature), add `#/kliping/{id}` hash routing so back-button and sharing
work, scroll-lock + focus trap (v1 has lock + Escape). Newsroom: harvest RSS
`description` fields now (many feeds carry ledes — free content); add
`sari`/`butir` to `Kliping` model for top ~6 clusters, generated Lane C with
the standard gate, size-guarded before KV publish.

### 13.4 Per-component prescriptions (top of page → footer)

**ACT I · DINAS**
- `masthead/infobox/folio` — keep; the infobox is a legitimate artifact.
  Tighten mobile folio wrap. (small)
- `ticker` — keep. (none)
- `RakKabar → EdisiFeed` — 13.2. (large)
- `PasarPagi` — good bones (rows, not boxes). Refine: values to Fraunces 340
  via --fs tokens (now default-font bold), verdict aligned to a fixed column,
  hairline *vertical* rules between the 3 columns, labels to the mono scale.
  Merge header with Gelombang into one **PASAR** section: macro row
  (PasarPagi) then kitchen-table movement (Gelombang), one inkbar, two
  eyebrows. De-box `gelombang-blok` (kill `.card`, rule-top instead). (medium)
- `CuacaPagi + PetaKabar` — cuaca is the map's header instrument: same width
  as the map frame, hairline join, city temps as margin annotations in mono.
  PetaKabar chrome (1,937 lines, its own world): dedicated sub-wave — legend,
  layer chips, dossier typography to the apparatus spec. (medium + sub-wave)

**ACT II · MESIN**
- `angka-blok` — keep the ceremony. Align sparkbar baseline to the odometer
  baseline; sparkbars label their axis (14 HARI) in the mono scale. (small)
- `NasionalPagi` — shipped wave 2; the reference. Add fmtRp abbreviation so
  the spending counter never wraps on 360px (see 13.6). (small)
- `PapanAngka` — **dissolve into the instrument panel.** Its four counters
  join BUKTI №2 as a second meter bank: BPJS/day + hutan/day as plated
  meters; PHK as a labeled micro bar-strip; Danantara days-without-report as
  the absence meter — full-width row, madder, scribble-circled numeral
  (data-annotate exists). Kills a boxed section, consolidates every ticking
  state meter in one place, and puts the absence where the measurement
  should be (hening doctrine). (large)
- `TemuanRedaksi board` — keep; unify ghost-num style with feed rank
  numerals (one .ghost-num spec). (small)
- `SembilanPuluh` — audit against doctrine in-wave. (small)
- `CabangBand` — strong. Unify its micro-viz vocabulary with the gauge
  language: gantt tracks get ruler ticks, range gets a needle. (medium)
- `SkorCabang` — strong. Add axis honesty (min/max mono labels on funnel and
  dumbbell), align ⊙ to tile bottom, drop "(data contoh)" when live wiring
  lands. (small)
- `KabinetWaffle` — keep form; dossier-on-hover typography to spec. (small)
- `GradienKeadilan` — bespoke and right; add the outlier scribble annotation
  + axis labels to the mono scale. (small)
- `aparat-grid` — de-box both columns: anggaran as open ledger rows;
  kekerasan as big stat + annotated sentence (exists). Resolve the 602
  duplicate (KontraS box vs hening) — one number, one owner. (medium)
- `janji-list` — keep 3-up articles + stamps; add a target-vs-terukur mini
  dumbbell per janji (same vocabulary as SkorCabang) so the grade is drawn.
  (medium)
- `MbgKorban / DuaGaris / JanjiCair / SisaAlam / PetaPiksel` — chrome audit:
  one axis style, mono scale, de-box, ⊙ placement. (small each)
- `ekonomi movement` (RupiahIHSG, JciVsPeers, FloatKonsentrasi,
  RepublikOligarki, GarisStart) — **chart chrome unification**: one axis
  spec, one watermark spec (DATA CONTOH), one live/contoh chip, Fraunces
  end-labels, consistent PAD geometry. GarisStart loses its card. (medium)
- `dunia-board / layar-ganda / hening / struk` — keep. Hening is beloved
  (scribbles, brutalist); struk stays boxed — it is an artifact. (none)

**ACT III · ATLAS → the magazine**
- Plate system: every Act III figure becomes a numbered plate — `PLAT I …`
  caption convention (mono, letterspaced, under the figure), one frame spec.
  PetaAtlas is PLAT I. (medium)
- `WajahNusantara` — the magazine feature: drop cap, measured 2-col prose on
  wide screens, pull-quote, longer text (Wikipedia lead section via REST,
  Lane A quoted + linked; curated fallback stays), photo as plate with
  engraved-caption + credit; SukuLokasi inset gets coordinates in the
  caption (`5°30'S 138°30'E`). (large)
- `Bahasa718` — companion plate beside Wajah. (small)
- `GaleriNusantara` — museum label grammar: title / year / medium /
  collection in mono microtype under the plate. (small)
- `AlmanakSains` — set as an almanac table (ruled, mono). (small)
- `GunungApi + PetaRupa` — twin plates, shared frame + caption spec. (small)
- `RimbaHidup` — keep as the closing understory. (none)
- `ruang-main` — puzzle-corner furniture: one ruled column header (TEKA-TEKI
  HARIAN), games share a mono header + hand-drawn accent, no boxes. (medium)
- `TuguRakyat` — keep. (none)
- `kolofon` — tighten agate leading; add the press mark (a small engraved
  ⊙-in-gear glyph as the machine's signature). (small)
- `Aksara` — instrument-styling pass parked until worker features settle.

### 13.5 What this kills (redundancy law, continued)

- The standalone TEMUAN UTAMA block (absorbed as feed entry №1).
- The lead cluster's inline liputan in the feed (lives in the Lembar).
- PapanAngka as a section (meters merge into BUKTI №2).
- The `.card` box on gelombang-blok, aparat cols, GarisStart.
- The KontraS-box 602 duplicate.

### 13.6 Design-system hardening v2 (the token sweep)

- **Type**: only 1/42 islands uses the --fs scale (audit 2026-07-02). Sweep
  all islands to --fs--1…--fs-6; add --fs-7 for act titles if needed. Mono
  apparatus locks to three sizes: --label-s (8.5px/.14em), --label-m
  (10px/.14em), --label-l (11px/.18em).
- **Space**: --sp-1…--sp-6 (4/8/14/22/34/56) replaces ad-hoc margins.
- **Rules**: --rule-act (2px solid), --rule-block (1px solid), --rule-soft
  (1px dashed). No other border styles outside artifacts.
- **Numbers**: `lib/format.ts` — fmtRp abbreviation (Rp 10,3 T / 24,1 M /
  329 rb) with the full figure in `title=`; adopt in every counter so no
  numeral ever wraps (NasionalPagi spending counter is the known offender).
- **Chips/stamps**: one chip anatomy (⊙ source · state), one stamp anatomy;
  audit strays.
- **Motion**: IO threshold 0.3; duration tiers 0.4/0.7/1.4s; stagger ≤130ms;
  reduced-motion renders the resolved state. Document in tokens.css header.
- **Shaders**: the veil pattern (lazy import, IO speed-gate, masked aura,
  never boxed) is the approved recipe. Candidate spots, pending veil verdict:
  seam slats during the flip, the fajar dawn canvas, atlas paper grain.

### 13.8 Wave-5 revision (Yose review of waves 3–4, 2026-07-02)

**Decisions**
- **Map moves to the top of Act I**: feed → PETA KABAR (+cuaca) → PASAR.
  The country the news happens in, right under the news.
- **One label for the Act II opening instrument**: BUKTI №1/№2 dies (it read
  as "this is proof of…"). The odometer + vitals + meter bank open Act II as
  one block titled **PAPAN ANGKA**; then GERAK I (branches, each with its
  functions + own scoreboard), then the themes. Descriptive, not forensic.
- **PasarPagi restyles to the meter-plate family** (borders + corner
  crosshairs, the Act II bank's grammar) — one instrument family, two
  registers.
- **ObituariHutan closes Act II** (Yose: "perfect for closing act 2") —
  moved out of the lingkungan chapter to after hening; real-data wiring
  queued (GFW alerts or Auriga annual, worker-proxied).
- **Udara dedupe (perception)**: the map owns *today's* air; the pixel
  calendar owns the *history* and its title must say so.

**Map: dossier decoupling (planned, own sub-wave)**
- The map's own dossier (Act I) carries geographic + live data at province
  AND kabupaten level in place (weather, quakes, alerts, population,
  ibukota, IPM) — no forced scroll to Act II.
- **LensaWilayah v2 = the accountability lens** (Act II · Daerah): per
  province/kabupaten metrics that fit the engine — belanja pegawai ratio,
  belanja modal, APBD per kapita (DJPK csv_apbd, keyless, top quick win),
  poverty/IPM (BPS once the key lands). The KARTOTEK card-catalog concept
  applies here. Map click still files into it via the bus, but as a quiet
  option, not a teleport.
- **idn-kab.geojson is corrupt** (vertex-soup rings around Kutai
  Kartanegara + repeated features; see docs/screenshots/peta-kabar-*).
  Fix: deterministic ring-repair script (dedupe consecutive points, drop
  degenerate/spanning rings, verify 514 features) — delegated to an agent;
  PetaKabar code untouched.

**Feed lead art (Yose idea, staged)**
- v1 (ships now): `VeilMuka` — Paper Shaders dither field behind the №01
  lead, pooled into the right whitespace via mask; params seeded
  deterministically from the lead headline hash (scale/px/speed within
  tasteful bounds) so every edition prints a different plate, zero cost.
- v2 (planned): the newsroom emits a tiny bounded "seni" spec (enum shape/
  density/motion, validated like the chart specs — model picks the mood,
  code clamps the values). Pure decoration, no gate needed, labeled nothing.

**Kliping clustering over-merge** (Icha/Tifa case): the ≥3-shared-tokens
rule now needs a Jaccard floor, and hyper-generic news tokens (kasus,
dugaan, diduga, terkait, video, viral…) join the stopword list. BUTIR/LEDE
are automated verbatim extraction (not manual); SARI waits only on a live
LLM key.

**Act II structure pass (top→bottom target order)**: PAPAN ANGKA → TEMUAN
REDAKSI → SembilanPuluh → GERAK I (5 cabang, each: band → skor → sheet) →
GERAK II themes (Pasar/Ekonomi → Bumi → Janji → Layar Ganda → Dunia) →
hening (closing register) → ObituariHutan (the act's last note) → arsip.
Remaining known items: struk rotates its region per edition (DJPK), SkorCabang
"(data contoh)" flips as sources wire, CabangBand ruler-tick unification
(wave 6).

### 13.9 The Peta wave + Act II/III deepening (planned 2026-07-03, Yose review 3)

**A. Map geometry, the real fix (diagnosed).** The wave-5a cleaner fixed
ring sanity (dupes, slivers, unclosed) but not topology: a fresh scan finds
**17 features with self-intersecting "bowtie" rings** (Kutai Kartanegara 3,
Halmahera Utara 3, Kaimana 2, Konawe Utara 2, Tanggamus 2, + 12 more) —
MapLibre's tessellator sprays exactly the spike-triangles in the
screenshots. Fix path, in order:
1. Extend clean-kab-geojson.mjs with an untangle pass: find crossing
   segment pairs per ring, split at crossings into simple sub-rings, keep
   sub-rings with >= 4 points and sane area. Gate: re-run the
   self-intersection scan, require 0; feature count stays 514.
2. If untangling drops real geometry: re-source ADM2 (geoBoundaries IDN
   simplified), re-key to `${prov}|${nama}`, own Douglas-Peucker to
   ~350 KB. (Download; check disk first per standing rule.)
3. Styling regardless (Yose direction, agreed): kab lines go **faint +
   dashed** (dasharray [1,2], opacity ramp 0.10→0.25, width 0.4→0.8);
   province lines stay solid, slightly fainter than today; the selected
   kabupaten alone carries a solid madder outline. No MapLibre built-in
   borders exist, but OpenFreeMap tiles carry an admin `boundary` layer —
   the fallback for visual lines if our polygons stay ugly (fills stay
   ours for hit-testing).

**B. Map interaction: tiered selection + the dossier v2.**
- Tier 1, province: click highlights the province, dossier shows province
  vitals (penduduk, IPM, kemiskinan, APBD, live-layer counts) with
  receipts.
- Tier 2, kabupaten: click inside a selected province (or any click past a
  zoom threshold) highlights **only the kabupaten** (tint + solid line);
  the province drops to a hairline halo. Dossier header becomes
  PROV ▸ KAB breadcrumb: kabupaten rows (ibukota, penduduk, luas,
  kepadatan, APBD per kapita when DJPK lands) with the province row
  **collapsed underneath** — tapping it expands province context in place
  (the switching-expansion mechanic Yose described). Esc / × steps back
  one tier.
- **Decouple from Lensa Wilayah**: the dossier is self-sufficient; "buka
  di Lensa Wilayah →" becomes a quiet secondary link (no auto-scroll).
- Legend on mobile: max-height min(48dvh, 340px), scrollable, masked fade
  edges (it currently overflows the viewport).

**C. Lensa Wilayah v2 = the accountability lens (Act II · Daerah).**
Its own metrics, distinct from the map dossier: DJPK csv_apbd (keyless)
per province AND kabupaten — belanja pegawai %, belanja modal %, APBD per
kapita, each with rank /38 or /514 and the national line; BPS (key
pending) adds IPM/kemiskinan/PDRB. KARTOTEK card-catalog form. The
**struk artifact couples to the lens**: region selected → the struk
reprints that region's budget composition (receipts change with the
search, Yose's ask); national when idle. SkorCabang daerah tiles same.

**D. Rak loads slow (diagnosed + plan).** The kliping data is already
KV-cached (published 2×/day; nothing is fetched from RSS at page load) —
the delay is client-side: `client:idle` hydration + the /edisi fetch +
no reserved space (CLS shift). Fix: EdisiFeed → `client:load`;
`<link rel="preload" as="fetch">` for /edisi; **localStorage snapshot**
of the last edition in edition.ts (instant paint, stale-while-
revalidate); skeleton rows + min-height so nothing shifts. Keep the
2×/day editorial rhythm (a 15-minute re-cluster would burn Actions
minutes to reshuffle headlines nobody asked for; the ticker already
refreshes hourly for immediacy).

**E. Denominations (Angka Edisi).** NASI BUNGKUS retires. New set:
RUPIAH · LITER PERTAMAX (Rp 12.400/L, mypertamina) · PORSI MBG · HARI
UPAH MINIMUM · **PELUNCURAN STARSHIP** (± US$100 jt/peluncuran, SpaceX
2024 statements, × kurs — the scale-shock comparator, labeled ±).

**F. Act II deepening (exploratory, brainstormed).**
- Theme order becomes: PASAR → JANJI → DUNIA → **BUMI last** (thin today;
  closing theme flows into hening → ObituariHutan → the seam into Act
  III's nature — the record ends where the permanent record begins).
- **Janji comprehensive**: ledger grows 3 → ~10 curated promises across
  the regime's stated targets (8% growth, 3 jt rumah, swasembada pangan,
  IKN, hilirisasi, MBG coverage, kemiskinan ekstrem 0%, stunting, energi,
  tax ratio), each sumber + target + terukur + stamp + dumbbell; the
  janji desk refreshes them. Laws/programs velocity stays in LEGISLATIF
  (PabrikUU owns it).
- **Viz variety law**: no form repeats within one act unless the data is
  the same shape AND adjacent. Concretely: hutan keeps the pixel
  calendar (unique), udara switches to a **horizon/ridgeline of kemarau
  seasons** (same data, different honest form).
- New theme candidate (propose to Yose): **INFORMASI** — press freedom
  rank (RSF), internet shutdowns (SAFEnet), UU ITE prosecutions. Fits
  the civic thesis; sources are citable.
- Branch chapters get the regime-agnostic framing line: fungsi
  konstitusional vs praktik terukur, one sentence per bab-dek.
- Bug list from screenshots: JanjiCair JETP bar labels collide; janji
  stamps overlap long titles on mobile (stamp moves inline-end or the
  title gets padding-right).

**G. The modular viz kit (the newsroom's instrument shelf).**
`src/lib/viz/` registry: each form is a Svelte component + a Zod schema
(type enum + encodings + cited row ids). The newsroom emits `viz_spec[]`;
the client renders only from rows it can cite (Doc2Chart: the model
picks the shape, never the values). Phase 1 registers the existing forms
(pixel-calendar, dumbbell, gauge, waffle, funnel, sparkbar, ridgeline);
Act III consumes the same registry so both acts stay "living."

**H. Act III as a living act (like Act II).** Rotating slots with real
depth: MANUSIA (Wajah feature + Bahasa) · HAYATI (species profile with
IUCN status + range inset) · RUPA & BUDAYA (art plate + book/film/music
of the day via Wikidata) · SEJARAH (on-this-day with primary source) ·
ILMU & LANGIT (almanak + sky events) · TANAH (gunung + Wallace). Longer
writeups (Wikipedia lead sections, Lane A quoted + linked), one bespoke
viz per slot where the data earns it, newsroom-curated rotation later.

**I. Yose review 3 addenda (locked 2026-07-03).**
- Theme order final: **JANJI → EKONOMI (Pasar) → DUNIA → SUMBER DAYA
  ALAM** (the alam/ekstraksi theme renames to Sumber Daya Alam), then
  hening → ObituariHutan → seam. INFORMASI theme approved, queued wave 7.
- **Meja expansion (Act I coverage)**: the clusters should cover the
  whole civic surface. Two new desks now: **EKONOMI** (rupiah, ihsg,
  saham, bank, pajak, ekspor, investasi, tarif…) and **TEKNO** (ai,
  kecerdasan buatan, digital, siber, startup, satelit, data center,
  internet…), classified deterministically like the others; law /
  education / official-program news folds into NASIONAL keywords until
  volume proves a desk. Chip row becomes horizontally scrollable with
  fade edges on mobile (7 chips).
- **RESMI tag**: clusters containing a clip from a state/official source
  (ANTARA, Setkab, kementerian releases) print a quiet RESMI marker —
  the government's own words, labeled as such. (Roster gains
  `resmi: true` on state sources.)
- **Roster expansion round 2 (agent)**: verticals — tech/AI (DetikInet,
  CNBC tech, Katadata tekno, Dailysocial…), energy (Katadata energi,
  Dunia-Energi…), law (Hukumonline…), education, agriculture/
  conservation (beyond Mongabay/Betahita), geopolitics, and official
  feeds (Setkab, DPR, kementerian). Section feeds of rostered outlets
  are allowed as separate entries (nama = section brand, same grup);
  scoring stays honest because n_grup drives skor.

**Sequencing from here**: 5b map geometry untangle + line styling +
legend + the two screenshot bugs + rak loading (today) → 5c tiered
selection + dossier v2 + lensa decouple (today) → 6 denominations +
janji expansion + theme reorder + udara ridgeline + meja desks (next) →
7 viz kit + lens-coupled receipts + Act III living + INFORMASI (next).

### 13.10 Lemari ide — the crazy shelf (Claude's brainstorm, curated 2026-07-03)

Beyond Yose's asks; each thesis-pure and free-infra feasible. Phase tags:
[6]/[7] = existing waves, [8] = the wave after.

1. **Kartu edisi (share card)** [6] — one tap renders a beautiful PNG
   broadsheet snapshot (masthead, lead, angka edisi, top clusters) via
   canvas, sized for WhatsApp/IG stories. WhatsApp IS Indonesian
   distribution; this is the growth mechanic. Zero backend.
2. **Arsip edisi + permalink** [6] — worker keeps `edisi:{n}` history in
   KV (tiny), `/edisi/85` renders it client-side. The "paper that keeps
   score" finally has a spine. Unlocks 3–5.
3. **YANG BERUBAH strip** [7] — the edition diffs itself against the
   previous one: "kurs +0,4% · 1 janji berubah status · 5 klaster baru ·
   2 cerita senyap". Pure computation, prints under the masthead. The
   paper telling you what moved.
4. **Cerita berlanjut / coverage decay** [7] — cluster fingerprints
   matched across editions: persistent stories get "HARI KE-3 · 14 JUDUL
   KUMULATIF"; stories the press dropped get "SENYAP SETELAH 2 HARI".
   What the press stops covering is itself civic data — nobody in
   Indonesia shows this.
5. **Papan titik buta** [7] — blindspot behavior over time, per
   ownership group: which group is systematically alone on which desks.
   The ownership thesis, longitudinal.
6. **SIDANG HARI INI** [7] — court calendar strip for major corruption
   trials (MA/KPK schedules): the machine watches the courtroom door.
7. **Tangga skala** [6] — the angka edisi placed on a log ladder between
   citable rungs (gaji menteri setahun … APBD kabupaten … anggaran MBG):
   instant scale context beyond the denominator buttons.
8. **TANYA EDISI INI** [7] — three newsroom-generated, gated questions
   under the lead that Aksara can answer from the cited corpus; teaches
   readers the agent exists.
9. **Cetak & simpan** [6] — a real @media print stylesheet: the paper
   prints as an actual broadsheet, and "Simpan edisi" = PDF. A newspaper
   that prints beautifully is the most detak-detik flex possible.
10. **PWA-lite** [8] — manifest + service worker caching the last
    edition: the paper you keep in your pocket, offline. Local-first
    made literal.
11. **HARI INI DALAM SEJARAH** [7, Act III] — daily archival plate from
    public-domain scans (Perpusnas/KITLV/Delpher), primary source
    linked. History with receipts.
12. **Segel edisi** [8] — a tiny generative press seal in the masthead
    derived from edition number + lead hash (VeilMuka's grammar at
    stamp scale): every edition visually fingerprinted.

### 13.11 LAPIS HUKUM — the legal layer (planned 2026-07-03, research in flight)

Yose found pasal.id and asked where legal data fits ("for the sources, or
for Aksara"). The answer is bigger than either: **law is the state's own
receipt**. A civic paper that prints "the regime promised X" is good; one
that prints the pasal that *obligates* X, verbatim, with its
berlaku/diubah/dicabut status, is untouchable.

**Scout findings (all curl-verified 2026-07-03):**
- **pasal.id** — independent free platform by Ilham Firdausi Putra, born
  at the Claude Code Hackathon (Feb 2026). 100k+ regulations, pasal/ayat-
  structured, status + amendment relationships, Akoma Ntoso FRBR URIs.
  Public pages keyless (`pasal.id/peraturan/uu/uu-no-13-tahun-2003`, each
  citing peraturan.go.id back); **REST API + MCP server
  (`mcp.pasal.id/mcp`) free but token-gated** (free account, rate limits
  60/min search). ToS explicitly permits programmatic access within
  limits; forbids wholesale DB redistribution. → NEEDS-FROM-YOSE: a free
  pasal.id account + API token unlocks search-by-Aksara + the MCP.
- **peraturan.bpk.go.id** — keyless, server-rendered, the richest status
  source: full "Diubah dengan / Mencabut / Mengubah" chains AND uji
  materi (MK amar + putusan PDFs) per law. HTML parse, no API.
- **peraturan.go.id** — canonical anchor + official PDFs; sitemap-driven,
  search endpoint broken (500). **jdihn.go.id/api/search** — keyless JSON
  (872k docs) but noisy federation, weak status data.
- **Dead ends from this host**: MA putusan3 (Cloudflare challenge), all
  DPR properties incl. sileg (Akamai 403/timeout) — RUU-in-progress
  tracking has no reachable source yet; needs a proxy or manual capture.
- **Citation pattern**: pasal.id for readable structured text, BPK/
  peraturan.go.id as the official anchor — cite both on legal receipts.

**Foundation (build first):** a legal registry — curated, vendored JSON
(`src/lib/data/hukum.ts`): the ~20 laws the paper actually cites (UU ITE,
UU TNI, UU Polri, UU Minerba, UU IKN, UU Cipta Kerja, UU BUMN/Danantara,
UU KPK, KUHP baru, UU PDP…), each with: identity (№/year), judul, status
chain (diubah/dicabut-by, verbatim from the official source), the 2–4
pasal the paper quotes (text verbatim + source URL), and tanggal
diundangkan. Hand-verified once, cheap forever; a live API upgrades it
later without changing consumers. Lane A by construction.

**Mechanics, ranked by leverage:**
1. **DASAR HUKUM chips** [9] — receipts that rest on a law (janji rows,
   aparat structure, Danantara, INFORMASI theme) gain a `§ UU 1/2025 ·
   PSL 3` chip → small tear-off lembar: pasal text verbatim, status line
   ("berlaku · diubah oleh UU 19/2016"), official link. The legal quote
   IS the receipt.
2. **Kliping ↔ law joins** [8] — deterministic regex in the newsroom
   (`UU\s+№?\d+/\d{4}`, "RUU X", "Perppu") stamps clusters that mention
   a law; the lembar dossier gains a MENYEBUT row linking into the
   registry. Zero LLM, pure Lane A.
3. **Aksara speaks law** [8] — new bus verb `buka_pasal { uu, pasal }`
   (Zod-validated like everything): Aksara answers "apa dasar hukumnya?"
   by *opening the actual pasal*, never paraphrasing it. The agent stays
   one more speaker.
4. **PABRIK UNDANG-UNDANG live** [7] — the existing perspektif becomes a
   living instrument if DPR/BPK data verifies: RUU pipeline counts,
   status board (prolegnas → sidang → diundangkan), days-in-chamber.
   The law factory measured like the loss odometer.
5. **Rantai perubahan** [6] — a law's amendment chain drawn as a
   paper-trail timeline (UU 11/2008 → UU 19/2016 → …), viz-variety law
   satisfied; pairs with the INFORMASI theme (UU ITE's own family tree
   next to its prosecution counts).
6. **SIDANG HARI INI** [§13.10 item, now upgradeable] — MA putusan
   metadata if the scout verifies access: today's verdict count as a
   quiet meter, notable putusan linked.

**pasal.id itself**: treat as a *reader convenience link target* (nice
deep-links into consolidated law text) unless the scout finds a public
API + permissive terms; the registry's canonical sources stay official
(BPK/BPHN). Never scrape a private product.

### 13.12 DJPK / APBD — the accountability engine's fuel (research in flight)

Design regardless of endpoint details (scout verifying):
- **Ingest**: `scripts/fetch-apbd.mjs`, run manually/CI-monthly — never
  at page load. Output: one vendored JSON keyed by Kemendagri kode
  (`{ kode, tahun, pendapatan, belanja, pegawai, modal }` × 38 prov +
  514 kab), joined to idn-wilayah pop for per-kapita. Small, static,
  versioned — the idn-wilayah.json pattern.
- **Metrics** (each with rank /38 or /514 + the national line):
  belanja pegawai % (payroll share — the "government that pays itself"
  number), belanja modal % (what actually gets built), APBD per kapita.
- **LensaWilayah v2 = KARTOTEK**: card-catalog form; search stays; the
  province card files these three metrics as drawn rows (rank ticks on
  a national ruler, not adjectives); kab tier appears when the map
  drills (set_lensa_kab already carries the join key).
- **Struk coupling**: region selected → the struk artifact reprints that
  region's budget composition; national when idle (Yose's ask, §13.9-C).
- If DJPK is CSV-only + no CORS: fetch in the script, not the worker —
  the data is yearly, the worker stays stateless.

### 13.13 THE ENDGAME ARC (Yose, 2026-07-03 — "writing this down before we forget")

The order of the remaining epoch, in Yose's own priorities:
1. **Act 2 swept top-to-bottom, then Act 3 completely redesigned** — be
   thorough; pick up small cheap wins stumbled upon along the way
   ("Midas' hands" rule: every file touched leaves shinier).
2. **Sources must be easy to add** — one registry, one shape, drop a
   feed in and the newsroom picks it up (media_roster.json is the seed;
   the same pattern should hold for data sources: registry + fetch
   script + vendored JSON, like apbd.json / enrich-wilayah).
3. **Modular + reusable everything** — file structure organized for
   reuse; the dataviz becomes a kit agents can drive: `src/lib/viz/`
   registry, one Zod `viz_spec` per form, newsroom emits specs and the
   site renders them (§13.9's modular viz law, now a pillar).
4. **Aksara × Flue** — after Act 3's redesign, wire Aksara through the
   Flue framework (§12 assessment). The agent stays one speaker on the
   Zod bus; Flue is the runtime, not a new power.
5. **The final form: detak-detik as an AGENT HARNESS, perhaps a CLI** —
   the newspaper's pipeline (sources → lanes → gates → composed page)
   generalized so agents can be pointed at it. Explicitly LAST.

**Autonomy contract (scaffolded 2026-07-03; Yose: "everything autonomous
even when you're not at the helm"):**
- `src/lib/viz/spec.ts` — the Zod viz kit: stat/bars/dumbbell/waffle/
  garis, `sumber` REQUIRED on every form (an uncited figure cannot be
  drawn); parse-or-nothing. New forms land schema-first, never ad hoc.
- `VizPapan.svelte` — renders any validated spec in SkorCabang's tile
  grammar; machine figures are chrome-identical to hand-built ones.
- `newsroom/models.VizSpec` (loose mirror; the site's Zod is binding)
  + `Tulisan` (deep-writeup slot: Lane C prose, fact-gated like temuan,
  cited_ids, viz list) + `Edisi.tulisan` / `LiveTulisan` payload slots.
  The desk that FILLS tulisan ships with the Act 3 wave — agents already
  have a stable shape to write against.
- Existing agent-writable slots: kliping SARI/BUTIR (gated), janji
  realisasi refresh (designed, dormant), temuan desks. The Digg-grammar
  news desk (EdisiFeed lembar) is the template: every future surface =
  slot + gate + registry, so new writers plug in without new plumbing.

### 13.14 ACT III BLUEPRINT v2 — "MAJALAH NUSANTARA" (2026-07-03, merges §5 + Yose's nat-geo dump; supersedes v1)

**Register**: Nat Geo × the engraved scientific atlas the site already
speaks. Act I is fast, Act II measured, Act III reads SLOW — a magazine
with a feature well, a plate wall, margin notes, an emotional closer.
Everything below obeys three laws at once: law 5 (calendar rotation,
same for every reader), citation-or-silence (every plate sourced),
autonomy-by-schema (registry + gate + slot — agents write rows, never
markup; Yose reviews backlog batches, rotation serves only reviewed rows).

**THE MACHINE — one template, nine pipelines (from §5.1, extended):**
generalize `AlmanakSains` into THE plate template (Atlas frame, `PLAT
№/HARI KE-n` caption, engraved fallback, source chip) and feed it from
per-pipeline REGISTRIES (`newsroom/data/atlas/*.json`, one row = one
reviewed plate; a fetch/refresh script per pipeline, apbd.json pattern):
1. **MANUSIA** — the FEATURE: rotating indigenous-group profile with
   substantial writing (reviewed backlog, start 20; id.wikipedia REST +
   Wikidata + WBTb budaya-data.kemdikbud.go.id 1.941 entries). Magazine
   form: drop cap, 2-col measured prose, verbatim pull-quote (Lane A),
   portrait plate w/ license credit, coordinate inset. **Cultural
   heritage rides the group** (Yose): the profile carries its carving/
   weave/dance/rite entries as sidebars, tag-joined from the registry.
2. **HAYATI** — Daftar Merah Nusantara (~30 endemics, live IUCN codes,
   re-sorts by extinction risk) + the day's species showcase writeup.
   Living images only (GBIF/iNaturalist CC0/CC-BY), never taxidermy.
3. **RUPA** — the day's painting EXPLAINED: Tropenmuseum (51.504 files)/
   KITLV/Rijksmuseum; museum + Wikipedia description as Lane A text,
   Lane C elaboration slot once lanes live; colonial provenance line as
   quiet context ("kini disimpan di …").
4. **BUNYI** — traditional music + instruments: Wikipedia/Wikidata +
   MusicBrainz metadata, PD audio via Commons/IA when license-clean;
   metadata only, no lyrics.
5. **INGATAN** — HARI INI DALAM SEJARAH: Wikidata SPARQL filtered to
   Indonesia (id on-this-day feed 404s, verified) + en-feed fallback +
   curated deck; every event dated + sourced.
6. **TANAH & LANGIT** — geography/science: sky almanac (sunrise, moon
   phase, true terminator — keyless), geology/expedition notes.
   **GunungApi RETIRED as standalone** (Yose's instinct confirmed: the
   MAP owns live volcano truth via MAGMA; one owner). Its 127-count
   fact becomes a Tanah plate line + a BUKA DI PETA chip dispatching
   set_layer+scroll_to. PetaRupa/Wallace stays as a plate.
7. **BAHASA** — Peta Bahasa yang Memudar: Glottolog CLDF (CC-BY) baked
   at build, each languoid a mark at its coordinates colored by real
   AES status, endangered marks decaying first on the Game-of-Life
   tick. THE ACT'S EMOTIONAL CENTER; Bahasa718's daily "air" word rides
   inside it.
8. **LAYAR & PUSTAKA** (new, Yose) — classic Indonesian film (Wikidata
   metadata; posters rarely PD → text plates), prose/novel plates
   (pre-PD openings verbatim; else Wikipedia lead), sculpture/monument
   entries (Commons). One registry, three row-types.
9. **ILMU** — Indonesian science writeups: computed almanac plates
   (the current voice) + discovery notes (BRIN/eijkman history etc. via
   Wikipedia Lane A) + TULISAN deep essays (§13.13 slot renders here,
   DISUSUN MESIN label, VizPapan figures inline).

**THE DAILY HAND** (new): not all nine pipelines print daily — the
calendar deals a HAND of ~5 plates per edition (deterministic, law 5).
Variety without bloat; a pipeline with a thin registry simply surfaces
less often (graceful, iterable).

**PULAU RAKSASA weighting** (Yose: Papua + Kalimantan, "if iterable"):
registry rows carry `pulau` tags; rotation guarantees a Papua-or-
Kalimantan row surfaces at a set cadence (~every 3rd hand). Weighting,
not a hardcoded section — dies gracefully when content is thin. ITERABLE ✓.

**REGION ROTATION** (§5.3, the awwwards move): PetaAtlas stays PLAT I;
clicking a region — or arriving with the lensa already set from Acts
I/II — rotates the whole act's plates to that region when reviewed
content exists (its people, species, heritage, events), national hand
otherwise. One store (lensa.ts) already carries the region.

**EKSPEDISI** (new, monthly): a tag threads one entry from EVERY
pipeline into a composed issue-feature ("Ekspedisi Mahakam": the
river's peoples + species + paintings + events + music). Agents
assemble it from registries by tag — the first fully machine-composed
magazine section.

**Layout** (top to bottom): PetaAtlas frontispiece → MANUSIA feature
well (full magazine spread + heritage sidebars) → THE PLATE WALL (the
daily hand, 2-col, mixed pipelines, one plate grammar) → ILMU/TANAH
margin column → Peta Bahasa yang Memudar (emotional closer) →
RimbaHidup (murmuration, unchanged) → Ruang Main (padding fixed
2026-07-03; content untouched this wave).

**Sequencing:** 8a plate template + regrouping + GunungApi retirement →
8b MANUSIA feature v2 + backlog registry + heritage ties → 8c HAYATI
Daftar Merah + RUPA provenance plates → 8d BUNYI + INGATAN + LAYAR &
PUSTAKA registries → 8e BAHASA memudar + sky almanac → 8f daily hand +
region rotation + PULAU RAKSASA + EKSPEDISI → 8g TULISAN renderer +
inaugural essay + act token sweep. Yose reviews content batches between
sub-waves; each ends build → deploy → screenshots.

### 13.15 ACT II POLISH ROUND 2 (Yose 2026-07-03 — AFTER Act 3 completes)

Banked verbatim, with first-take seeds to expand when we arrive:
1. **SembilanPuluh ("90") — "useless now"**: audit → likely retire or
   repurpose its slot. Seed: its countdown grammar could become the
   TENGGAT strip — nearest janji deadlines counting down (the ledger
   already knows them). One instrument, real data, no new form.
2. **Branches of power = "numbers sprinkled" → ONE bespoke scorecard**:
   healthy-vs-sick drawn by JUXTAPOSITION, not adjectives. Seeds per
   branch (pick per §13.1: form = the data's own logic):
   - shared grammar: every branch metric gets a **KISARAN SEHAT band**
     (the harga-cabai wajar treatment / speedometer red zone): a shaded
     normal zone + the needle where the branch sits + a faint
     10-year-ago tick for historical drift. One drawing, three honesty
     layers (now / normal / then).
   - eksekutif: kabinet size vs post-1966 median band; perpres rate.
   - legislatif: RUU throughput vs Prolegnas target band; the log-ruler
     stays (durations); kehadiran vs quorum line.
   - yudikatif: asset recovery % vs regional peers band; clearance rate.
   - aparat: criminal-vs-ethics funnel against a "rule of law" line
     (peer democracies); anggaran share vs 10yr median.
   - daerah: pegawai% national line ALREADY REAL (djpk) — extend with
     WTP opinion share trend. The scorecard reads like a doctor's chart:
     five vitals, each with its normal range printed.
3. **Riwayat Udara Jakarta — Jakarta-centric, "useless for everyone
   else"**: retire from Act 2. Seed: air quality is already a MAP layer
   (udara); if a chapter needs it, BUKA DI PETA chip. The slot goes to
   the new ALAM focus (below).
4. **JanjiCair (JETP) → folds into the janji LEDGER** as a registry row
   (target: US$21,6 M committed; terukur: disbursed; the dumbbell +
   DATA TIDAK TERSEDIA machinery already handles it). Kill the
   standalone dramatic card — tone law.
5. **ALAM refocus — deforestation + displaced people** (Yose: flora/
   fauna belongs to Act 3): Act 2's SDA chapter becomes extraction
   accountability: hutan loss (GFW/Hansen keyless tiles or annual
   stats), sawit/tambang concession overlap with adat territory
   (WRI/AMAN sources to verify), **displaced-communities counter with
   named receipts** (citation-heavy — needs a careful source scout:
   Komnas HAM, AMAN, WALHI annual reports), obituari hutan already
   closes the act. Flora/fauna showcases migrate to Act 3 HAYATI where
   they now live. NEEDS a verification scout before building — the
   displacement numbers are the most sensitive figures in the paper.

### 13.16 INGATAN REDAKSI — the 7-day memory (architected 2026-07-03, builds after Acts 2+3 close)

Yose's ask: agents should remember the past week, "kinda like a diff".
The answer that fits our laws: **memory = published artifacts, diffed** —
never embeddings, never a store the reader can't audit.

1. **ARSIP (the store)**: every published edition ALSO lands in the repo —
   the Actions run commits `arsip/edisi-{n}.json` after POST /edisi. The
   paper's own history becomes its memory: versioned, diffable, citable,
   free. Keep the last 14 hot (7 days × 2 editions); prune older to
   monthly snapshots. (This also unlocks lemari-ide arsip permalinks.)
2. **THE DIFF (`newsroom/memory.py`)**: each run loads the window and
   computes one structured INGATAN artifact:
   - `cerita`: today's kliping clusters fingerprint-matched against the
     window (the _serumpun token machinery, reused) → BARU / BERLANJUT
     (with first-seen date + n editions covered) / MATI (coverage decay:
     stories that vanished — itself a finding).
   - `angka`: deltas on angka_edisi, pasar, and any janji status change
     (the ledger self-audit log feeds straight in).
   - Compact block rides the edisi payload (`Edisi.ingatan`).
3. **CONSUMERS**: SARI + tulisan writers receive ingatan as context
   ("this continues Tuesday's story — say so"); Aksara answers "apa yang
   berubah minggu ini" from it; the READER-facing face is the YANG
   BERUBAH strip (lemari ide №3) — same artifact, three audiences.
4. **Laws hold**: deterministic (same window → same diff), every memory
   line traces to a published edition (citation-or-silence), local-first
   untouched. Memory the reader can open and check.

### 13.7 Sequencing (each wave ends: build → deploy → Yose screenshots)

- **Wave 3 · The front feed**: 13.2 + Lembar v2 shell (SARI/BUTIR slots
  render when the edition carries them) + newsroom: RSS description harvest,
  sari/butir generation behind the gate, edisi payload + size guard.
- **Wave 4 · The instrument room**: PapanAngka merge, aparat de-box, janji
  dumbbells, chart chrome unification, CabangBand/SkorCabang polish, 602.
- **Wave 5 · The magazine**: plate system, Wajah feature template, museum
  labels, almanac, twin plates, puzzle corner, kolofon, press mark.
- **Wave 6 · The sweep**: 13.6 tokens across 42 islands, format util,
  motion audit, PetaKabar chrome sub-wave, shader spots 2–3, SUARA v2b.

## 14. Session log (running, newest first)

### 2026-07-03 · wave 7 (open) — janji: from 3 cards to the continuous ledger
- **Yose's standing requirement (applies to EVERY data surface)**: never
  one-time research — the newsroom continuously re-checks. Dataviz
  components + machine summaries must be built as slots agents write
  into. DeepSeek v4 pro assumed capable as the engine — the LiteLLM
  fallback chain takes it as pure config (NIM or OpenRouter slot).
- **Continuous-audit scaffold shipped**: `newsroom/data/janji_registry
  .json` is the single source of truth — index.astro imports it at
  build AND the janji desk (sources/janji.muat_buku_janji) loads it
  every edition, recomputes each status mechanically (tenggat × angka ×
  arah floor/ceiling), logs self-corrections, publishes rows into the
  edisi payload (Edisi.janji / LiveJanji), and feeds every registry
  figure into the citation corpus so temuan can quote the ledger.
  The realisasi REFRESH hook is designed + documented in the desk,
  dormant until a model lane has a live key.
- **Buku besar form recut**: 3-up cards → numbered ruled ledger rows
  (№ ghost · promise+source · target/terukur dumbbell · stamp), stamp
  ink now follows the track's verdict (missed = madder — was wrongly
  accent2; met = calm ink; absent = dashed). Fact-desk agent out
  verifying the ~10-promise roster with receipts.

### 2026-07-03 · wave 6c — gerak I gauge pass + BPS verdict + crosswalk
- **CabangBand speaks the gauge language**: the legislatif gantt now sits
  on a LABELED LOG RULER (10→10.000 hari; 20 hari vs 13 tahun drawn
  honestly — the old 4% width was a visual compromise), scale declared
  "SKALA LOG · HARI KALENDER"; the daerah range carries the national
  needle (NASIONAL 8,6% inside the Bali↔Papua Peg. span); prop bars get
  0–100 rulers. SkorCabang: min/max mono labels on funnel ("100% = 602")
  and dumbbell, ⊙ pinned to tile bottom (flex+auto margin), per-tile
  `live` tag — the daerah pegawai tile now prints the REAL median from
  our own harvest (35% contoh → 37% · djpk realisasi 2024).
  KabinetWaffle cells carry hover filings; GradienKeadilan's outlier
  ring became the hand-drawn scribble (deterministic wobble, madder).
- **BPS scout verdict (all curl-verified)**: sig.bps.go.id is a keyless
  REST family — crosswalks BPS↔Kemendagri↔POSTAL, period snapshots,
  and code lineage 1961→2025 (pemekaran archaeology, future mechanic).
  But NO keyless indicator endpoint exists: www/regional/api hosts are
  Cloudflare/WAF-shut and the one keyless thematic backend is dead
  (500). Indicators therefore = manual browser xlsx snapshots
  (needs-from-Yose №8), joined on the 4-digit BPS code.
- **Crosswalk shipped**: scripts/enrich-wilayah.mjs merged dagri + pos
  codes into idn-wilayah.json (511/514; Dumai + both Sorongs miss on
  sig's side — left absent, never guessed). Map dossier tier-2 gains a
  KODE row (Kemendagri dotted + POS). sig serves the OLD 34-province
  scheme, so Papua joins by name fallback with ambiguity poisoning.

### 2026-07-03 · wave 6b — the accountability engine gets fuel (DJPK) + § stamps
- **KARTOTEK APBD shipped**: `scripts/fetch-apbd.mjs` harvests DJPK's
  keyless csv_apbd portal (2024 realisasi, ~552 pemda, throttled) and
  joins DJPK names to OUR registries (DAERAH provinces + idn-wilayah
  kabs; the BPS bridging API was rejected — still on the pre-pemekaran
  Papua scheme). Output `public/data/apbd.json` carries FINISHED metrics:
  belanja pegawai %, belanja modal %, belanja per kapita, each ranked
  /38 (prov) and /~500 (kab). LensaWilayah files them as a corner-marked
  plate whose rows reuse the spread's ld-* grammar (rank chip, national
  print, TERBURUK→TERBAIK ruler with the mark drawn from rank; per-kapita
  carries no verdict — capacity, not virtue). Kab tier shows on drill;
  static pegawai estimate yields to the real number; source chip flips to
  `djpk 2024 realisasi`. Unjoined pemda are dropped and logged, never
  guessed. DKI correctly files as 1 pemda (kota adm have no own APBD).
- **§ stamp shipped (LAPIS HUKUM mechanic 2)**: deterministic law-mention
  extraction in the newsroom — numbered regex (UU/RUU/Perppu/Perpres/PP
  n/yyyy) + curated named aliases (title-case-safe; "PP Muhammadiyah"
  and "Permen" traps tested, 16/16). Kliping gains `hukum[]`; lembar
  prints MENYEBUT · § UU …; feed meta gets a quiet § chip.
- **Legal + fiscal scouts returned** (findings in §13.11): pasal.id has a
  free token-gated API + MCP; peraturan.bpk.go.id is the status-chain
  goldmine; DPR/MA unreachable from this host. DJPK verified end-to-end.
- **Deferred**: struk↔lens coupling (struk is static APBN server HTML —
  islandizing it is its own pass), legal registry content (needs
  hand-verified pasal texts), pasal.id token (needs-from-Yose №7).

### 2026-07-03 · wave 6 — dossier v2 (the tiered filing) + quick wins
- **Map dossier v2 shipped** (§13.9-B done): the card is now two-tier.
  Tier 1 unchanged (province face). Tier 2 = the regency filing:
  PROV ▸ crumb (province name clickable, steps back), Fraunces regency
  name, ledger rows (ibu kota / penduduk №rank / luas / kepadatan №rank,
  dotted leaders), a hairline **share-of-province bar**, and the
  province row **collapsed underneath** — expands in place (Yose's
  switching-expansion mechanic), re-collapses on each new filing.
  Footer: quiet "Kemendagri 2025" source + dotted-underline
  "buka di Lensa Wilayah ↓" (decoupled: dossier is self-sufficient,
  the trip down is opt-in).
- **Tier gate on kab clicks**: first click from afar selects the
  province only; a click inside the selected province (or any click at
  zoom ≥ 6.5) drills to the regency. **Esc steps back one tier**
  (info card → regency → province → national; defers to the kliping
  lembar while it scroll-locks). × and the crumb do the same.
- **Store coherence fix**: lensa-kab now self-clears when the province
  lens moves away (the "see lensa.ts" comment was aspirational — nothing
  actually cleared it; LensaWilayah could show a stale regency from the
  previous province). The map's onLensaKab subscription is the single
  authority for the kab-sel outline + a **province-halo drop**
  (sel-fill 0.12 → 0.05 at tier 2, so the regency alone reads selected).
  Failed name-joins now file a minimal payload (name-only card) instead
  of silently doing nothing.
- **Dark plates get their province lines back**: the OFM admin_level-4
  `boundary` tiles (the same ones the DINAS plate uses) are baked into
  the SATELIT/CUACA/MALAM styles, re-inked paper-white — dashed, opacity
  0.55/0.5/0.35 (quietest on Black Marble so the city lamps star). The
  kab stitch also reads stronger over imagery (opacity ramp ~2× on dark
  modes). Our own province polygons still never draw lines.
- Earlier same day (`8f18392`): denominations nasi → **liter Pertamax**
  + **peluncuran Starship** (1 decimal below ten), theme order
  **janji → ekonomi → dunia → sumber daya alam** (folios renumbered,
  SDA rename, gerak II dek).
- Next in wave 6: LensaWilayah v2 (DJPK + struk coupling), janji
  expansion, udara ridgeline, INFORMASI theme, lemari ide §13.10.

### 2026-07-03 · wave 5 CLOSED (5a+5b+5c-map) — compact point
- **The spike saga, resolved in three acts**: (1) kab file untangled
  (self-crossings + pinch vertices, gate in cleaner, 514 intact);
  (2) real culprit found — idn-prov.geojson is a fragmented tessellation
  (Kaltim = 77 sliver parts), so prov-line + selection outline were
  DELETED (no line may ever draw those polygons; visible province lines
  = native OFM batas-prov tiles); (3) my prov "cleaning" broke fills
  (Papua Selatan 20%) → file restored for labels/bbox ONLY, and **all
  province surfaces (wash/hover/selection/choropleth) now draw from the
  clean kab polygons keyed by `prov`** — accurate borders, fills align
  with kab lines, choropleth keyed ['get','prov'], hover = filter layer.
- **Tier-2 selection shipped**: clicked kabupaten gets a solid madder
  outline (kab-sel, filter prov+nama), province stays a tint. Kab lines
  dashed faint; legend scrolls on mobile.
- Also in wave 5: rak instant-load (localStorage snapshot + client:load
  + skeleton), JETP caption line, janji stamp reserve, meja
  EKONOMI/TEKNO, RESMI marker, roster → 54, VeilMuka, PAPAN ANGKA label,
  obituari closer, cluster tune (Icha/Tifa), map to top of Act I.
- **Moved to post-compact (5d/6)**: dossier v2 (PROV ▸ KAB breadcrumb +
  in-place expansion, more data rows), satellite/malam province lines
  (tile-based), kab-line strength on dark modes, LensaWilayah v2
  (DJPK metrics + struk coupling), denominations, janji expansion,
  theme reorder + SDA rename, udara ridgeline, lemari ide §13.10.



### 2026-07-02 · wave 5a — front reorder, plates, seeded art, map repair
- Act I order is now feed → PETA KABAR → PASAR. Act II opens as PAPAN
  ANGKA (BUKTI № labels dropped). PasarPagi wears the meter-plate grammar.
  ObituariHutan closes Act II (real-data wiring still queued). Udara
  calendar retitled "Riwayat Udara Jakarta" (map owns today).
- VeilMuka shipped: dither plate behind the №01 lead, params seeded from
  the lead headline hash (shape/scale/px/speed bounded; 1-in-4 madder).
  v2 = newsroom "seni" spec, planned §13.8.
- Kliping over-merge fixed: _JACCARD_LANTAI 0.16 on the shared-token rule
  + generic-news stopwords. Verified live: Icha and Tifa are separate,
  clean clusters. Datacenter run: 56 klaster.
- idn-kab.geojson repaired (agent + hand-verified): dupes/slivers/vertex
  soup dropped, 514 features intact, 0 unclosed rings; the 4 remaining
  >1° segments are the real PNG border at 141°E (Merauke, Boven Digoel,
  Keerom, Peg. Bintang). Cleaner: scripts/clean-kab-geojson.mjs
  (idempotent). If any artifact survives on device, next step is the OFM
  tile boundary layer (admin_level 5/6) for the visual lines.
- Still open from Yose review: map dossier decoupling + LensaWilayah v2
  accountability lens (§13.8 sub-wave), obituari + struk real data, SARI
  waiting on the NIM key.

### 2026-07-02 · wave 4 — instrument room + roster expansion
- Papan Angka dissolved into BUKTI №2 as a meter bank (BPJS/day, hutan/day,
  PHK bar strip, Danantara days-without-report as a full-width madder
  absence meter). Aparat de-boxed to open ledgers; 602 now single-owner
  (CabangBand signature figure; the column holds only the breakdown). Janji
  gets target-tick vs measured-dot tracks (missing realisasi = hatched
  track). PASAR unified (PasarPagi "PASAR" + Fraunces values + gauge-family
  hairlines; Gelombang de-boxed under it, duplicate title dropped).
  GarisStart de-boxed. Tone sweep per Yose: JUDUL VERBATIM, POIN UTAMA ·
  KUTIPAN VERBATIM, RINGKASAN · DISUSUN MESIN, JUDUL PER GRUP KEPEMILIKAN,
  KUMPULAN SUMBER; eyebrows descriptive not poetic.
- Media roster 14 → 36 (agent-researched, feeds curl-verified from device):
  +16 working feeds (ANTARA, Liputan6, Merdeka, Kumparan, Okezone, CNBC
  Indonesia, Republika, JPNN, Katadata, VOI, Alinea, The Conversation ID,
  Konde, Betahita, Floresa, Suara Papua), +6 majors recorded feedless
  (Suara.com, Tirto, IDN Times, Bisnis.com, BeritaSatu, Narasi). 31 distinct
  ownership groups. Datacenter-IP risk flagged: kumparan lapi endpoint,
  Merdeka (Akamai/gzip), Okezone+Republika UA-sensitive.
- **Ownership calls for Yose to double-check** (agent's flags): Kumparan
  82% GDP Venture (reported, unconfirmed close); Katadata marked
  independen:false (VC-backed, no Djarum link found); Suara.com
  independen:false (listed Tbk, judgment call); JPNN deliberately not
  clustered under Jawa Pos Group; Betahita–Auriga tie informal; Tirto
  ownership undisclosed since 2021.

### 2026-07-02 · wave 3 addendum — LLM lane is DEAD (needs Yose)
- Every sari call fails `ModelAPIError: Connection error` on the only
  configured lane (NIM). So the temuan desks have been publishing their
  deterministic drafts all along (no ditulis_ulang events) — degradation
  worked as designed, but no machine phrasing anywhere until fixed.
- **Fix from Yose**: check/replace `NIM_API_KEY` (or the default model
  `deepseek-ai/deepseek-v4-pro` may be retired — override via
  `MODEL_PRIMARY`), and/or add `GROQ_API_KEY` / `OPENROUTER_API_KEY` /
  `GEMINI_API_KEY` repo secrets so the fallback chain has members.
  Once any lane is live, SARI prints automatically on the next edition.

### 2026-07-02 · wave 3 — the front feed
- **EdisiFeed** replaces RakKabar + the standalone TEMUAN UTAMA block: one
  surface; №01 = the paper's lead (SSR contoh via prop, live via onEdisi —
  the island owns its lead updates; pagi-live must never touch its DOM, that
  was a hydration-revert race), №02… = Digg-grammar cluster rows (rank left,
  squares + counts + meja in the meta line, inline liputan cut).
- **Lembar v2 dossier**: LEDE (verbatim, credited) → SARI (Lane C slot) →
  BUTIR (credited key points) → SUARA (client-derived: one verbatim headline
  per ownership group — zero synthesis) → full LIPUTAN → methodology link.
  Hash routing `#/kliping/{id}`; deep links open once the edition loads.
- **Newsroom**: RSS descriptions harvested (`ringkas`, 280-char, markup
  stripped; published on utama only); BUTIR deterministic (first sentence
  per outlet's lede, group-diverse, deduped via _serumpun, ≥2 or absent);
  `sari.py` — Lane C overview for top 6 clusters, deterministic acceptance
  (bounded, link-free, every number token must appear in the evidence);
  LiveTemuan now carries temuan_id for the feed's live receipt chip.
  Live dry-run: 493 judul → 33 klaster; butir extraction verified.
- pagi-live slimmed to ticker + temuan board + angka.

### 2026-07-02 · grand redesign planned (§13)
- Yose review of wave 2: gauge board = the bar ("this is what we want with
  the others"); lembar nice but lead-row source list duplicates it; TEMUAN
  UTAMA still redundant → open with the Rak as a Digg-like feed; wants a
  hands-on, thorough, component-by-component redesign plan before touching
  anything else. §13 written: doctrine, feed decision, Lembar v2 dossier
  (SARI/BUTIR/SUARA + newsroom pipeline), per-component prescriptions,
  kill list, token sweep, waves 3–6. Implementation starts wave 3 on his go.

### 2026-07-02 · wave 2 (`5279a8f`)
- NEGARA HARI INI moved Act I → Act II as **BUKTI №2** (after the loss
  odometer). NasionalPagi rebuilt as a bespoke **instrument panel**: two
  live counters as plated meters (mono tabular, corner-crosshair plates)
  + four macro vitals as SVG tick-ruler gauges — needle at the value,
  BI's inflation corridor as a shaded band, the 8% growth pledge as a
  dashed line with a distance bracket ("JARAK KE JANJI · −2,4 PP").
  Scales keyed by label prefix; unmatched live vitals degrade to plain
  plates (never a wrong needle).
- TEMUAN UTAMA is now a broadsheet lead: headline 1.6fr left, **receipt
  rail** right (chips ⊙, stamp, serial, source flag; ids ku-chips/
  ku-stamp/ku-serial/ku-src). pagi-live swaps rail content when live so
  contoh receipts never sit beside a live claim.
- **Lembar Kliping v1**: Rak headlines open a fixed tear-off sheet
  (torn clip-path top, slide-up, Escape/backdrop close, scroll lock)
  with the full coverage list + ownership labels; only outlet rows link
  out. Fixes "linking directly". No route needed — clusters are
  live-data only, so the sheet rides RakKabar state.
- VeilMesin: canvas now full-bleed (100vw) with an elliptical mask that
  dies at 72% of a 52vw radius — aura, not box.
- Dedup: second LensaWilayah mount removed (crash artifact).
  `.bab-lembar` given a rhythm rule (it had none — the messy padding).
  Act I § numbers dropped (numbering is Act II's language). Dead CSS
  purged: rubrik/rp-*/ag-*/pagi-util/pagi-ringkas/dunia-tiles/
  sensus-blok/hukum-blok/sect-title(-mesin)/mesin-duo/nusantara-grid/
  arsip-strip/arsip-grid/hening-sub (~120 lines).
- Await Yose review: gauge board legibility on phone, veil intensity,
  lead/rail balance, sheet feel. Next wave candidates: Act III magazine
  typography pipeline, KARTOTEK lensa v2, shader spots 2–3.
