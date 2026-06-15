# Detak Detik

**A daily civic-transparency newspaper for Indonesia, built from public data,
designed to awwwards standard, and narrated by an agent that can only say what it
can cite.**

Detak Detik ("the heartbeat of the second") presents Indonesian public data —
budgets, courts, prices, deforestation, procurement, regional statistics,
markets — as a single, living, scrollable broadsheet. It is meant to refresh
twice a day from a multi-agent newsroom, run entirely on free infrastructure, and
store nothing about its readers on any server. The map is the front page; the
prose is formal and academic; the argument is carried by the data, never by the
copy.

> Status: pre-launch. Every figure on the page is currently sample data, marked
> `(data contoh)` in the UI, until the newsroom pipeline replaces it with cited
> rows. The visual system, interaction model, and component library are the focus
> of the current build.

---

## What it is

A static site that reads as a three-act newspaper:

- **Act I — Pagi ("Keadaan"):** neutral national statistics you can compare
  yourself against. A live MapLibre map of Indonesia (earthquakes, fire, air,
  floods, volcanoes), a clickable province lens, morning prices, food-price waves,
  the republic's vital signs, and a "census of one" mirror toy.
- **Act II — Malam ("Yang tak ingin dilihat"):** automated editorial through
  creative data visualisation. The five branches of power each open their own
  chapter (executive, legislative, judiciary, security forces, regions), followed
  by general themes: environment and extraction, the household economy and
  markets, and how the republic looks from the outside.
- **Act III — Nusantara ("Yang tetap tinggal"):** the uplifting close. The day's
  public-domain painting and endemic species, science wonders, and a generative
  "living understory" canvas.

**Aksara**, a terminal pill in the bottom-left, drives the whole page through the
same validated command vocabulary as every click: open it and type `tur`. The
long-term goal is for Aksara to retrieve over the paper's cited corpus and render
data, maps, and charts on demand, with every figure tied to a source.

---

## Architecture

Detak Detik is a static Astro site with Svelte 5 islands, fronted by one
stateless Cloudflare Worker. Nothing about a reader is stored server-side.

```
Browser (Cloudflare Pages, static)
  Astro shell + Svelte islands + GSAP/Lenis motion + MapLibre GL
  one command bus (Zod-validated verbs); every click, tour, and the agent
  speak the same vocabulary, and every state is a URL
        |  POST /ask, /tour, /geo, GET /ticker
        v
Cloudflare Worker (stateless, amnesiac)
  NVIDIA NIM proxy (primary) -> Workers AI fallback, KV cache, Turnstile gate,
  map-feed proxy (/geo), RSS ticker cron; a runtime fact-gate enforces citations
        ^
        |  edisi.json (data + auto-written summaries), refreshed twice daily
Multi-agent newsroom (GitHub Actions, cron)
  per-beat desks -> fact gate -> lawyer pass -> editor -> layout manifest
```

The newspaper's "editions" are really twice-daily refreshes of a long-running
data organism: charts extend and count every day, and the synthesising sentences
are rewritten from new data through the fact gate, so nothing goes stale like an
article.

### Tech stack

| Layer | Choice |
|-------|--------|
| Shell | Astro 6 (static output) |
| Islands | Svelte 5 (runes) |
| Styling | Tailwind 4, a three-register OKLCH token system (`@theme inline`) |
| Motion | GSAP 3.15 + ScrollTrigger, Lenis smooth scroll, rough-notation, canvas 2D |
| Map | MapLibre GL 5 over OpenFreeMap (keyless vector tiles) + Esri imagery + RainViewer |
| Charts | d3-scale/shape/array; a constrained Vega-Lite-style spec for agent-rendered charts |
| Validation | Zod (the command catalog) |
| Backend | Cloudflare Worker + KV; NVIDIA NIM, Workers AI fallback |
| Automation | GitHub Actions (twice-daily newsroom + nightly ETL) |
| Fonts | Fraunces (display serif), Archivo (sans), Geist Mono, Instrument Serif |

---

## Project structure

```
src/
  pages/            index.astro (the three acts), perspektif/[slug], arsip, sumber
  islands/          Svelte components (the map, the region lens, every chart)
  lib/
    commands/       catalog.ts (Zod verbs) + dispatcher.ts (the command bus)
    data/           edisi.ts (sample data; migrating to edisi.json)
    lensa.ts, denominasi.ts, motion.ts, motion-kit.ts, seed.ts, engrave.ts
  scripts/choreo.ts the scroll choreography, reveals, stamps, Aksara speech
  styles/tokens.css the three registers (Dinas / Mesin / Atlas)
worker/             the stateless Cloudflare Worker (NIM proxy, /geo, ticker)
newsroom/           the multi-agent ETL pipeline (in progress)
docs/               the constitution, design system, data contracts, roadmap
public/data/        bundled GeoJSON + edisi.json
```

`docs/CLAUDE.md` is the master document: the constitution, the design standard,
the current state, the technical decisions, and the live roadmap. Read it first.

---

## Development

```bash
pnpm install
pnpm dev      # http://localhost:4321
pnpm build    # static output in dist/
pnpm check    # astro check (type + template diagnostics; target 0 errors)
```

## Deployment

- **Pages:** deploy `dist/` to Cloudflare Pages. Set the build variable
  `PUBLIC_AKSARA_URL` to the deployed Worker URL so the agent can reach `/ask`.
- **Worker** (`worker/`): `wrangler deploy`, then set secrets:
  - `NIM_API_KEY` (NVIDIA NIM, prefix `nvapi-`) — the agent's primary model lane.
  - optional: `TURNSTILE_SECRET` (bot gate), `WAQI_TOKEN` + `FIRMS_MAP_KEY` (the
    `/geo` map-feed proxy).
  - bindings: `CACHE` (KV) and `AI` (Workers AI fallback).

---

## The iron laws

1. **Citation or silence.** No row, no claim; a mismatched number is dropped.
2. **Two lanes, never crossed.** External news is verbatim RSS pass-through no
   model touches; our journalism is derived only from primary structured data
   through a deterministic fact gate.
3. **Documents speak, nobody accuses.** The permit, the award, the filing, side
   by side, with neutral connective language. The reader draws the conclusion.
4. **One command vocabulary.** Clicks, tours, toggles, and the agent speak the
   same validated verbs. Every state is a URL.
5. **Shared edition by default.** Two readers the same morning see the same page.
6. **Local-first, no surveillance.** Reader memory lives in the browser; the
   Worker is amnesiac.

---

*Semua angka pada halaman saat ini adalah data contoh sampai pipa data
menggantikannya.*
