# Detak Detik — Briefing & Rework Proposal
*Prepared for pivot session, July 2026. Incorporates infra numbers, expanded pipeline design, and refined feasibility assessment.*

---

## 0. Editorial commitments — formalized

The six editorial commitments, restated as implementable policy rather than manifesto:

1. **Every claim links to a primary source, or it does not publish.** *(Setiap klaim ditautkan ke sumber primer, atau tidak diterbitkan.)*
2. **Data and opinion run in separate columns, never merged into one narrative.** *(Data dan opini ditampilkan pada kolom terpisah, tidak digabungkan dalam satu narasi.)*
3. **The newsroom presents documents; claims about individual conduct require editorial review before publishing.** *(Redaksi menyajikan dokumen; klaim atas tindakan individu memerlukan tinjauan editorial sebelum terbit.)*
4. **Every edition passes one verification step before automated publishing runs.** *(Setiap edisi melewati satu proses verifikasi sebelum publikasi otomatis berjalan.)*
5. **Core content is accessible without an account, login, or payment.** *(Konten inti dapat diakses tanpa akun, login, atau pembayaran.)*
6. **User data is processed locally on-device; no third-party tracking.** *(Data pengguna diproses secara lokal di perangkat; tidak ada pelacakan pihak ketiga.)*

Rules 3 and 4 are procedural — they become code (a `needs_human_review` flag and a verification gate), not just editorial posture.

---

## 1. Current site

**Detak Detik**: auto-published civic newspaper, 3-act vertical scroll. Astro 6 + Svelte 5 on Cloudflare Pages/Workers. MapLibre for maps. Python Workers + PydanticAI agent for on-page Q&A. GitHub-deployed, static-first ("dicetak otomatis").

- **Act 1 (light theme):** live ticker (population/budget), market indices, food prices, province map with click-to-compare ("Lensa Wilayah"), self-census mirror tool, BMKG earthquake feed.
- **Act 2 (dark theme):** 5 branches of power scorecard — Eksekutif, Legislatif, Yudikatif, Aparat, Daerah — plus cross-cutting themes (Pasar & Ekonomi, Lingkungan & Ekstraksi, Rumah Tangga). Signature formats: "Yang Tidak Dihitung" (explicit data-gap register) and "Layar Ganda" (juxtaposed uncommented statistics).
- **Act 3 (cream theme):** Nusantara showcase — indigenous groups, flora/fauna, historical art, endangered languages, plus participatory features (data-verified trivia, shared pixel canvas). Currently the least coherent act.

Most Act 2/3 numbers are `(data contoh)` placeholders. Live data is connected for the map, ticker, and Wikipedia lookups.

---

## 2. Infrastructure reality check — verified free-tier numbers, July 2026

### Cloudflare Workers Free Plan

| Resource | Free allowance | Verified |
|---|---|---|
| Workers requests | 100,000/day, 10ms CPU time/invocation | ✓ (docs) |
| Subrequests per invocation | 50 external fetches + 1,000 CF-service calls | ✓ (docs) |
| KV | 1 GB storage, 100K reads/day, **1,000 writes/day** | ✓ (docs — this is the bottleneck) |
| D1 | 5 GB storage, 5M rows read/day, 100K rows written/day | ✓ (docs) |
| R2 | 10 GB storage, 1M Class A ops/month, 10M Class B ops/month, **no egress fees** | ✓ (docs) |
| Durable Objects | 100K requests/day, SQLite-backed, free plan since April 2025 | ✓ (changelog 2025-04-07) |
| Queues | 10K operations/day | ✓ (docs) |
| Vectorize | 30M queried dimensions/month, 5M stored | ✓ (docs) |
| Browser Rendering | **10 minutes/day, 3 concurrent browsers** (free); $0.09/browser-hour beyond that | ✓ (changelog 2025-07-28) |
| Cron Triggers, WebSockets, Workers AI (embeddings) | included | ✓ (docs) |
| Agents SDK | available on free plan | ✓ (paired with Durable Objects) |

**Pipeline implications — refined:**

- **KV's 1,000 writes/day is a hard trap for ingestion.** Use D1 for write-heavy paths: article records, story clusters, FAQ submissions, rotation state. Reserve KV for rarely-written config and cache values (e.g., curated DID allowlist, ownership tags, cron state).
- **R2 is the provenance layer.** No egress fees means raw HTML/markdown snapshots can be stored permanently and served back without cost — this anchors rule 1 mechanically.
- **Durable Objects are the Jetstream bridge.** A persistent WebSocket connection doesn't fit Workers' request-scoped model. A DO holds the hibernating WebSocket, wakes on message, buffers, and flushes to D1 on a schedule. SQLite-backed DOs are free-tier eligible since April 2025. This is the idiomatic Cloudflare-native pattern, not a workaround.
- **Browser Rendering is the expensive fallback, not the default.** 10 minutes/day + 3 concurrent browsers on free tier. Most Indonesian news sources (Kompas, Tempo, CNN Indonesia, dpr.go.id, putusan MA, government portals) are server-rendered HTML — plain `fetch()` + a Readability-style extractor covers the large majority at zero marginal cost. Reserve Browser Rendering for JS-heavy SPAs that fail plain extraction. At $0.09/hour beyond free, treat it as the cost-isolated exception path.
- **Vectorize + Workers AI embeddings are the clustering engine.** Embed title+snippet, store in Vectorize, nearest-neighbor match against rolling window. 30M queried dimensions/month is generous for a bi-daily batch.

### Scraping: skip Firecrawl, use plain fetch + Readability extractor

**Firecrawl free tier: 500 lifetime credits (not renewing).** Self-hosting requires Postgres + Redis + Docker — doesn't run on Workers. Would need a separate VPS, defeating the $0 infra goal.

**Recommended approach:** For each RSS/source URL, Worker fetches the page, runs a Readability-style extractor (Mozilla's `readability` ported to JS, or a minimal regex-based version), stores raw HTML to R2 (provenance) and clean markdown to D1 (for clustering/display). Two Workers: one fetcher, one extractor, chained via Queues or sequential `fetch()` within CPU limits.

### LLM: NVIDIA NIM + DeepSeek V4 — confirmed feasible

| Parameter | Value | Source |
|---|---|---|
| Free tier credits | ~1,000 base, up to 5,000 via request | Community-confirmed |
| Rate limit | **40 requests/minute** per model | Forum posts + NIM docs |
| Models available | DeepSeek V4 Pro, DeepSeek V4 Flash | build.nvidia.com |
| Endpoint | OpenAI-compatible | Standard NIM pattern |
| Requests for increase | Multiple forum threads (→200 RPM) — not guaranteed | Observed |

**Budgeting for a bi-daily pipeline (every 12h):**
- Ingestion: 1 fetch Worker per source (runs within CPU limit, no LLM)
- Clustering: Workers AI embeddings (not NIM — this is CF's own free tier)
- Agent calls (NIM): 4 distinct LLM tasks, each processing the top N story clusters
  - Summarizer (V4 Pro): 1 call per story, 20 stories → 20 calls
  - Voices extraction (V4 Flash): 1 call per story → 20 calls
  - FAQ clustering + answering (V4 Flash): batch call for top 5 clusters → 1 call
  - Editorial gate (V4 Pro): flagged stories only, ~2-3 calls
  - **Total: ~44 calls per run, spread over 20 minutes = ~2.2 RPM average — well under 40 RPM cap**

**Actual constraint is the credit pool, not RPM.** Monitor credit burn in week one. Use V4 Flash for cheap/high-volume tasks (voice extraction, initial FAQ clustering) and V4 Pro for the one call needing reasoning quality (grounded summary). If pool depletes, batch more aggressively (summarize 5 stories per call instead of 1).

### Guardrails: PydanticAI, not a separate framework

"Flue (headless Pi)" could not be verified as an existing framework. The actual need is **structured output validation**: every agent call returns a Pydantic model with required fields including `needs_human_review: bool` and `insufficient_source_evidence: bool`. The model must set these explicitly rather than silently proceeding past gaps. PydanticAI already provides this. No separate framework required — just disciplined schema design.

---

## 3. Act 1 rework — "Ground Truth" (newsroom pipeline)

### What Ground News does — and the Indonesian adaptation

Ground News clusters articles by event, tags publishers (not articles) with bias/factuality ratings from three independent monitoring orgs (AllSides, Ad Fontes, Media Bias/Fact Check), and produces a "Blindspot" feed for stories covered asymmetrically. They rate outlets, not individual articles — fact-checking every article in real time is intractable.

**Indonesia doesn't have an AllSides-equivalent**, and left/right is not the operative axis. The operative axis is **media ownership concentration**. Indonesia's media landscape is dominated by a handful of conglomerates:

| Ownership group | Key outlets | Political ties |
|---|---|---|
| **Kompas Gramedia** | Kompas (daily), Kompas TV, Sonora radio, Tribun Network | Historically independent; largest by circulation |
| **MNC Group (Hary Tanoesoedibjo)** | RCTI, MNCTV, GTV, iNews, Koran Sindo, Sindonews.com | Tanoe founded Perindo Party; platforms previously aligned with NasDem, Hanura |
| **CT Corp / Trans Media (Chairul Tanjung)** | Trans TV, Trans7, Detik.com, CNN Indonesia (license) | Business-aligned, no formal party role |
| **Media Group (Surya Paloh)** | Metro TV, Media Indonesia, Lampung Post | Paloh founded NasDem Party |
| **Viva / Bakrie Group (Aburizal Bakrie)** | TVOne, ANTV, VIVAnews | Bakrie was Golkar Party chairman (2009–2014); editorial intervention documented |
| **Jawa Pos Group (Dahlan Iskan)** | Jawa Pos, Radar network, dailies across 28 regions | Historically less politicized; regional footprint |
| **Tempo Media Group** | Tempo (magazine), Tempo.co | Independent; historically critical; smaller scale |

**This is the differentiation for Indonesia:** tag each RSS source by ownership group. When coverage of a story is dominated by outlets under one conglomerate, that's the blindspot signal — a documented ownership fact, not a subjective bias call (stays inside rule 3). The same families appearing in both the wealth-concentration data (Act 2) and the outlet-ownership tags (Act 1) creates a novel synthesis nobody else is producing for Indonesia specifically.

### Ingestion pipeline

1. **GDELT DOC 2.0 API** (free, REST): 3-month rolling window, 65 languages including Indonesian via machine translation, theme/tone/volume metadata. Query every 2-4h for `sourcecountry:ID` over the last window. Returns article list with URL, domain, tone, themes.

2. **Bluesky Jetstream** via Durable Object (free, WebSocket): Connect to `wss://jetstream2.us-east.bsky.network/subscribe?wantedCollections=app.bsky.feed.post`. Filter client-side by `lang=id` and a curated DID allowlist (Indonesian journalists, academics, CSOs, institutional accounts). DO buffers messages in SQLite, flushes batched posts to D1 every N minutes. No authentication required — Jetstream is a public endpoint.

3. **RSS from curated sources:** Kompas Opini, Tempo Kolom, Katadata Analisis, The Conversation Indonesia, CSIS, INDEF, BI/OJK releases, BPS releases — fetched by Worker cron, parsed, stored to R2 (raw) + D1 (extracted text + metadata).

4. **YouTube Data API** (free quota: 10,000 units/day): Metadata-only for tracked commentary channels (not transcripts — copyright). Detect new uploads, store title/description/ID for reference. Full transcript extraction is post-copyright; metadata referencing avoids this.

### Clustering and scoring

5. **Embedding:** Workers AI text-embeddings model (free) — embed title + first 200 chars. Store in Vectorize.

6. **Cluster assignment:** nearest-neighbor match against rolling 72h window in Vectorize. Existing story → append to cluster. New story → spawn cluster. D1 tracks cluster lineage (articles added, time window, source count).

7. **Surfacing score — corroboration, not virality:** A story surfaces when independently confirmed across **2+ distinct source types** within the window (e.g., GDELT theme spike + N curated Bluesky posts + 1 named op-ed). This is harder to game than an engagement counter, computed entirely from free sources, and aligns with rule 1 (every surfaced story has multi-source provenance by definition).

### Agent layer (NIM/DeepSeek via PydanticAI)

8. **Summarizer** (V4 Pro, 1 call/story): Grounded, word-capped writeup paraphrasing from source set. Returns `insufficient_source_evidence: bool`. Must decline rather than invent when sources are thin. Output is the headline + 2-3 sentence summary on the story page.

9. **Voices** (V4 Flash, 1 call/story): Extracts attributed excerpts from named bylines and curated Bluesky DIDs. Tags each by category (economist, legal scholar, activist, party-affiliated) where determinable from the maintained roster. **No anonymous platform comments** — the FAQ mechanic (below) is the "voice of the people" channel, structured as questions not assertions.

10. **FAQ engine** (V4 Flash, batched): Reader-submitted questions stored in D1. Embed questions weekly (Workers AI), cluster with Vectorize, select top 5 clusters by frequency. Each cluster gets one grounded answer citing the source set. Agent must output `"tidak cukup informasi dari sumber untuk menjawab"` when sources don't cover the question — **the refusal is a feature**, not a failure. FAQ answers update bi-daily alongside the main edition.

11. **Editorial gate** (V4 Pro, flagged stories only): `needs_human_review` trips for any claim naming a private individual with an accusation. Queued for manual sign-off instead of auto-publishing. This is rules 3 and 4 implemented as a code path — the agent flags, a human clears.

### On "comments from people"

**Recommendation: cut or scope tightly.** Raw platform comments are unattributed, unmoderated, and break rule 3 if summarized as fact. They're also the highest-risk surface for coordinated brigading. The FAQ mechanic achieves the "voice of the people" outcome — structured as questions, curated by clustering frequency, answered against sources — without inheriting comment-section risk. If a crowd-sentiment signal is truly desired, scope it to a moderated space with a track record (e.g., specific subreddit with karma floor), label it explicitly as unverified sentiment, and never blend it into the grounded summary.

### Story page layout

1. **Headline + 2-3 sentence grounded summary**
2. **Corroboration bar** — source types confirmed, updated with each edition
3. **Voices** — named, attributed, short excerpts, tagged by category
4. **FAQ** — top reader questions with grounded answers or `"tidak cukup informasi"`
5. **Sources** — full list of outlets covering the story + their actual headlines, each tagged by ownership group. This is the Ground News-style footer localized to Indonesia's media-ownership axis.

### Open design decisions

| Question | Recommendation |
|---|---|
| Curation of Bluesky DID list | Start with 30-50 DIDs (journalists, academics, CSOs). Review quarterly. Publish the list publicly (transparency = trust). |
| Corroboration threshold | Start at 2+ source types. Calibrate after 2 weeks of real data. |
| Ingestion schedule | Every 3h (8 runs/day). Balances freshness against credit burn. |
| Ingestion runs as | Cloudflare Cron Triggers for Workers + GitHub Actions for static rebuild. Jetstream DO must live on CF regardless (persistent WebSocket). |
| Editorial cell | Initially: review queue cleared by you personally. v2: trusted second reader. The `needs_human_review` flag gates volume — most stories auto-publish; only accusation-level claims queue. |
| Media ownership roster | Build now. ~7 groups, static metadata, reusable across Act 1 (source footer) and Act 2 (oligarchy material). |

---

## 4. Act 2 expansion — accountability engine, mapped

### Data-to-visualization map per branch

| Branch | New/extended metrics | Data source | Visualization |
|---|---|---|---|
| **01 Eksekutif** | Regulatory follow-through rate (% of laws with required PP/Perpres issued within statutory deadline); Danantara-style body reporting cadence | peraturan.go.id × UU passage dates; agency disclosure pages | Existing kabinet grid + implementing-regulation tracker (on-time / late / missing) |
| **02 Legislatif** | Per-commission (Komisi I–XI) Prolegnas completion; stretch: per-member issue focus from committee assignments + RDPU participation | dpr.go.id (scrape); Formappi/IPC/PSHK methodology on fresh data | Existing Prolegnas log-scale chart, faceted by commission |
| **03 Yudikatif** | Clearance rate by court level; Komisi Yudisial sanction outcomes vs. complaints filed | putusan3.mahkamahagung.go.id (corruption verdicts only — see §5 caveat); Komisi Yudisial reports | Existing "Gradien Keadilan" scatter, extended with court-level facet |
| **04 Aparat** | LPSK/Ombudsman complaint resolution rate, if published | Kontras, Imparsial (already used); LPSK/Ombudsman annual reports | Existing incident-to-sanction funnel |
| **05 Daerah** | PAD self-financing ratio per province; WTP/WDP/TMP audit opinion status (currently 21/38 WTP shown) | djpk.kemenkeu.go.id; BPK IHPS | **Use Act 1's MapLibre + province-click infrastructure.** Click province → full Daerah scorecard against national baseline. Same interaction pattern readers already know from "Lensa Wilayah." |

### Provenance ledger

Every scored claim carries: source URL, R2 snapshot timestamp, extraction method, confidence flag. This makes Act 2 re-derivable rather than merely cited.

### Political ties graph (v2 / stretch)

LHKPN wealth deltas × Ditjen AHU company officer records × LPSE procurement winners. Overlay on the Daerah map: procurement-winner concentration per province, on the same MapLibre layer as accountability scores. Real, valuable, deferred to v2 because of data integration complexity.

---

## 5. Judicial OCR — scope clarification

Regex-extracting loss-amount and sentence-length from corruption verdicts (`putusan3.mahkamahagung.go.id`) is a heuristic extraction over a patterned document type — not a structured data feed. **Limitation:** verdicts across different PN branches do not format the "amar putusan" identically. Expect real time on the format-variation problem. Keep the confidence-flag discipline. Do not expand this pattern beyond corruption verdicts for v1; every additional case category multiplies the format-variation cost.

---

## 6. Act 3 rework — "Nusantara," unified

### Diagnosis

The current Act 3 reads as fragmented because each content type has a bespoke layout. The fix is a unified template across types + a rotation mechanism + a review-before-rotation safety rule.

### Entity types and verified sources

| Type | Sources | Feasibility notes |
|---|---|---|
| **Indigenous/ethnic groups** | Wikidata (structured index only) + Warisan Budaya Takbenda (Kemendikbud, 1,728+ registered entries across 5 domains: rituals, performing arts, oral tradition, nature knowledge, crafts) | **WBTb has no public API.** Directory is browsable at Kemendikbud's culture portal — scraping required. Confirm per-entry page structure before committing the pipeline. Wikidata is index-only; auto-generated text about living communities risks flattening into stereotype. Actual writeups must be grounded in WBTb entries and named academic/cultural sources per group. |
| **Flora & fauna** | GBIF (already integrated) + IUCN Red List (already cited) | Rotate by province/ecoregion. Low risk, structured data. |
| **Historical figures/events** | Wikidata SPARQL (structured facts) + Wikimedia Commons (public-domain images — already the pattern for the Diponegoro plate) | Structured. Images are license-filterable. |
| **Visual art** | Wikimedia Commons, digitized National Gallery collections (where available) | Public domain images. Text from museum metadata/catalogs. |
| **Music/musicians** | MusicBrainz API (free, structured: artist, releases, genre tags) + Wikidata | **No lyric reproduction** — metadata and biography only (same copyright discipline as entire site). |
| **Film** | Wikidata + TMDb API (free tier, Indonesian film metadata) | Metadata only — no stills or clips without license. |
| **Writers/literature** | Wikidata + Perpustakaan Nasional catalog references | Structured bibliography. Avoid reproducing copyrighted excerpts. |

### Rotation mechanism

D1 table: `entity_id`, `type`, `last_shown_date`, `times_shown`. Cron selects weighted-least-recently-shown entity per category for the bi-daily refresh. Each edition: N entities rotated in, N entities rotated out, maintaining visual freshness without editorial churn.

### Safety rule: batch-generate, review, rotate

Act 2's numbers are statistical and self-correcting if wrong. Act 3 represents real living communities and named public figures — a different risk profile. **Recommendation:** batch-generate a backlog of profiles (e.g., 20 indigenous groups, 30 flora/fauna, 20 historical figures) using structured data ingestion + **one** LLM-assisted draft per profile. Human-review the entire backlog once. Then rotate from the reviewed backlog on the bi-daily schedule — which profile is featured changes constantly, but unreviewed text about an indigenous community does not auto-regenerate indefinitely. This satisfies rule 4 (one verification step) without making every cycle a manual bottleneck.

### Visual unification

Standardize on one "Almanak" card template. The existing prototype shows the right instinct ("III Tanah," "Almanak - Plat hari ke-195"). Apply that single taxonomy-header format across all seven entity types — one template, seven data pipelines feeding it, instead of seven bespoke layouts.

---

## 7. Architecture summary — end-to-end on Cloudflare free tier

```
┌─────────────────────────────────────────────────────────┐
│                   CLOUDFLARE WORKERS                      │
│                                                           │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐              │
│  │ RSS/HTML │  │ GDELT DOC │  │ Jetstream│              │
│  │ Fetcher  │  │ Poller    │  │ DO       │              │
│  │ (cron)   │  │ (cron 3h) │  │(WebSocket│              │
│  └────┬─────┘  └─────┬─────┘  └────┬─────┘              │
│       ▼               ▼             ▼                    │
│  ┌──────────────────────────────────────┐               │
│  │              R2 (provenance)         │               │
│  │     raw HTML/markdown snapshots      │               │
│  └──────────────────────────────────────┘               │
│       ▼                                                  │
│  ┌─────────────────────────┐                            │
│  │         D1 (SQL)         │                            │
│  │  articles, clusters,     │                            │
│  │  entities, rotation      │                            │
│  └────────┬────────────────┘                            │
│           ▼                                              │
│  ┌─────────────────────────┐                            │
│  │  Workers AI embed       │                            │
│  │  → Vectorize clusters   │                            │
│  └────────┬────────────────┘                            │
│           ▼                                              │
│  ┌─────────────────────────────────┐                    │
│  │     NIM API (external)           │                    │
│  │  DeepSeek V4 Pro / Flash        │                    │
│  │  Summarizer, Voices, FAQ, Gate  │                    │
│  └────────┬────────────────────────┘                    │
│           ▼                                              │
│  ┌─────────────────────┐                                │
│  │  generate static     │                                │
│  │  → Cloudflare Pages  │                                │
│  └─────────────────────┘                                │
└─────────────────────────────────────────────────────────┘
```

All components fit within the free tier with the budgeting described. The only cost risk is NIM credit pool depletion — monitor in week one; if it burns faster than expected, increase batching (multi-story LLM calls) before considering paid options.

---

## 8. Implementation phases

| Phase | Scope | Key deliverable |
|---|---|---|
| **Phase 1** | Media ownership roster, WBTb access pattern confirmed, 30-50 Bluesky DID list curated, corroboration threshold calibrated against real data | Ready-to-code data dependencies |
| **Phase 2** | Act 1 pipeline: RSS fetcher, GDELT poller, Jetstream DO, R2→D1 storage, Workers AI clustering, Vectorize | Story clusters surfacing in D1 |
| **Phase 3** | Agent layer: Summarizer, Voices, FAQ engine, Editorial gate (PydanticAI + NIM) | Full story pages with corroboration bar, voices, FAQ, ownership-tagged sources |
| **Phase 4** | Act 2 live data: scrape peraturan.go.id, dpr.go.id, putusan MA, djpk.kemenkeu | Replace `(data contoh)` with real numbers across all 5 branches |
| **Phase 5** | Act 3 backlog: batch-generate indigenous/music/history profiles, human-review once, build rotation engine | Unified Almanak template with rotating content |
| **Phase 6** | Political ties graph (v2 stretch), MapLibre overlay, FAQ real-time (WebSocket instead of batched) | Deferred enhancements |

---

## 9. Open questions

1. **Curated Bluesky DID list** — starting size: 30-50. Curation process: you + 1-2 trusted readers? Publish list publicly?
2. **Corroboration threshold** — start at 2+ source types. Calibrate against real data after 2 weeks. Adjustable without redeploy (KV config value).
3. **WBTb directory** — confirm per-entry page structure exists before committing Act 3 indigenous pipeline. If only category index, alternative: manual curation of 30-50 groups with published academic sources.
4. **Editorial cell** — you personally clearing the `needs_human_review` queue, or a second reader? Volume projection: ~2-3 flagged stories per edition max (only accusation-level claims trip the gate).
5. **FAQ real-time vs. batched** — Phase 3 batches FAQ weekly. Phase 6 could upgrade to near-real-time via WebSocket if usage warrants — but batched is simpler, cheaper, and editorially safer for launch.
6. **NIM credit monitoring** — track credits consumed per edition run from day 1. If burn rate exceeds projection, reduce per-story LLM granularity (summarize 5 stories per call instead of 1, use V4 Flash more, V4 Pro less).
