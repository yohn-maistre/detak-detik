# PRD-00_CHASSIS.md — Lembaran

> The build. How the docs above become a running static site on free infrastructure.
> Repo layout, the Actions topology, the Worker spec, the deploy, the degrade ladder,
> the lazy-load boundaries. Read alongside all four constitutional docs (`CLAUDE`,
> `DATA_CONTRACTS`, `COMMAND_CATALOG`, `NEWSROOM`, `LEMBARAN_DESIGN`).

---

## 1. The stack

- **Shell:** Astro (static output). Cloudflare acquired Astro in Jan 2026; we host on
  Cloudflare Pages, so the framework alignment is deliberate. Every page renders to
  static HTML at build time; interactivity is opt-in per island.
- **Islands:** Svelte 5 (compile-time, lean bundles). The map, feed, terminal, and
  game panels are islands. Dossiers and briefings are zero-JS static pages.
- **Map:** vanilla MapLibre GL + deck.gl in one fat island. PMTiles range-streamed.
- **Motion:** GSAP (full free plugin suite) for orchestrated motion; native CSS
  scroll-driven animation for ambient. (See `LEMBARAN_DESIGN` section 5.)
- **Agent toolbelt (client-side):** DuckDB-WASM over Parquet, graphology for graph
  walks, Pagefind for search. Lazy-loaded.
- **Proxy + cron:** one Cloudflare Worker (NIM proxy, KV cache, rate limit, RSS
  ticker cron).
- **ETL:** GitHub Actions with DuckDB. Unlimited minutes on a public repo.
- **Hosting:** Cloudflare Pages (unlimited bandwidth free, the right failure mode for
  a viral spike). Build output stays portable as insurance.

Component libraries: headless primitives only (Bits UI / Melt UI for dialogs,
popovers, tabs, purely for accessibility plumbing). Own every pixel of skin via
Tailwind v4 tokens implementing `LEMBARAN_DESIGN`. No animated component kits (they
all read as the same AI-startup landing page).

---

## 2. Repo layout

```
/
  CLAUDE.md, DATA_CONTRACTS.md, ...        # the docs ride in the repo
  /src
    /pages            # Astro routes: index, /dossier/[kode], /temuan/[id], /edisi/[n], /tur/[id]
    /islands          # Svelte: Map, Feed, Terminal, GamePanel, Sheet
    /lib
      /commands       # the dispatcher + Zod catalog (COMMAND_CATALOG)
      /tools          # sql_query, graph_walk, search_corpus, sebandingkan (client)
      /memory         # IndexedDB JSONL session, compaction, export/import
      /sharecard      # canvas-to-PNG template system
    /styles           # Tailwind tokens (Lembaran)
  /newsroom           # the nightly pipeline (plain TS; Mastra-later)
    /desks            # one per lens
    /gate             # fact resolver (programmatic)
    /lawyer           # Redaktur Hukum
    /editor, /layout, /puzzle, /opinion
    /lib              # thin NIM client, Zod schemas
  /etl                # scrapers + DuckDB transforms, per source
  /worker             # Cloudflare Worker (proxy, cache, ticker cron)
  /.github/workflows  # the Actions topology (section 3)
  /relay              # optional Pi relay scripts for geo-blocked sources
```

Artifacts (Parquet, PMTiles, edisi.json archive) are written by ETL/newsroom and
pushed to R2 (fat) or committed (small manifests). Never bloat the Pages bundle.

---

## 3. Actions topology

- **`etl-nightly.yml`** (cron, before each edition): per-source scrape -> DuckDB
  transform -> Parquet + PMTiles -> R2, with signed manifests (`DATA_CONTRACTS`
  section 2). Sources are independent jobs so one dead portal does not fail the run.
- **`newsroom.yml`** (cron, 04.30 and 16.30 WIB, ahead of the editions): runs the
  pipeline (`NEWSROOM`), emits `edisi.json`, publishes the newsroom log, triggers a
  Pages deploy.
- **`pages-deploy`:** Cloudflare Pages auto-deploys from the repo on push.
- The **Pi relay** (optional, separate box on an Indonesian residential IP) handles
  geo-blocked sources on its own cron and pushes raw artifacts to the repo, where
  `etl-nightly` picks them up. Not a runtime; a build muscle.

---

## 4. The Worker spec

One stateless Cloudflare Worker. Holds the NIM key (never the client). Free tier
covers it (100k req/day).

Responsibilities:
- **`/ask`:** rate-limit per IP/session -> check KV cache -> on miss, forward to NIM
  with the tool catalog -> stream AG-UI-shaped SSE back. Persist the final answer as a
  cached permalink.
- **`/tour`:** the single `generate_tour` call; validate the returned script against
  the catalog before returning.
- **ticker cron (hourly):** fetch Lane A RSS (Tempo, Antara, BBC Indo, CNN Indonesia),
  cache a small ticker JSON in KV. Pass-through only: verbatim headline, source,
  timestamp, link. No model touches it.

The Worker is amnesiac by design (law 6). No reader profiles, no server-side memory.

---

## 5. The degrade ladder

The site never breaks; it gets more precomputed under load.

1. **Cache hit** (KV): return the stored answer, free.
2. **Deterministic SQL-template answer:** a surprising share of questions are
   structured questions in disguise. Answer them with a template and `sql_query`, no
   model call.
3. **Live model call:** only for genuinely novel free-form questions.
4. **Graceful fallback:** under rate-limit pressure, queue and show "Aksara lagi
   istirahat, ini jawaban tersimpan dari pertanyaan serupa" with the nearest cached
   answer.

If NIM free tier ever buckles, rotate a fallback pool of free providers behind the
same Worker. The architecture barely cares which model answers.

---

## 6. Lazy-load boundaries (keep first paint light)

- **Casual reader** (front page, scrolling dossiers): static HTML + small islands
  (MapLibre, GSAP, Svelte bits). A few hundred KB. Light on 3G.
- **Pay-on-intent:** DuckDB-WASM (several MB) loads only when the terminal is first
  used. PMTiles and Parquet fetch as byte ranges (never whole). Pagefind pulls index
  fragments per query. The JSONL memory ledger is kilobytes.

Reading the paper costs a news-site's weight. Interrogating the nation costs a
one-time game-asset's weight, paid only by readers who ask.

---

## 7. Location (the Lokal/Nasional toggle)

Static-page friendly, privacy-respecting, two tiers:
- **Coarse, silent (default path):** Cloudflare provides visitor region at the edge
  with no permission prompt. Pre-fills the Lokal toggle target.
- **Precise, opt-in:** the browser Geolocation API, only if the reader wants "near
  me" exactness.
- **Manual override:** a region picker always available.

Nothing hits a server we own; nothing is stored. The toggle just emits `set_scope`
(`COMMAND_CATALOG`), the same command an agent or a click would. Default sits on
Nasional (the shared edition, law 5).

---

## 8. Permalinks (every state a URL)

- `/` front page (shared edition)
- `/dossier/[kode]` region profile
- `/temuan/[id]` a finding
- `/edisi/[n]` a back issue
- `/tur/[id]` a tour (precomputed, newsroom, or cached-generated)
- `/tanya/[hash]` a cached answer (also an indexable SEO page)

State that changes the view (lens, scope, layers, selected ids) serializes into query
params so any view is linkable. Virality is mechanically just linkability.

Also generate: per-region and per-lens RSS/Atom feeds (build-time), embeddable
chart web-components (one export format, journalists become distribution nodes), and
OG images per permalink.

---

## 9. Definition of done (chassis skeleton)

The empty shell is "done" when:
- Astro site deploys on Pages with the Lembaran tokens applied.
- The MapLibre island boots into a curated default view from the region table.
- The Lokal/Nasional toggle recenters via `set_scope`.
- The command dispatcher executes `fly_to`, `set_lens`, `set_scope` from a debug input
  (proving the nervous system before any agent exists).
- One back-issue route renders from a hand-written `edisi.json`.

Then build Hukum end to end (the wave-maker) before anything else. Scope discipline is
law 0.
