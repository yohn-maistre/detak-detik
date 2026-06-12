# CLAUDE.md — Lembaran

> Read this first, every session. It is the index and the constitution. Everything
> else is downstream of the laws stated here.

---

## Status of these docs

**These are working drafts and design references, not a finished spec.**
Everything here is the current best thinking and should be treated as a
foundation to build on, argue with, and improve. Claude Code reading this:
treat the schemas, architectures, design tokens, and editorial rules as
strong starting points, not locked contracts. If a better approach appears
mid-build, raise it. The spirit of each decision matters more than the
letter. This project is explicitly open for expansion, redesign, new lenses,
new mechanics, new data sources, new visual ideas, and new framings. The
docs will evolve as the build does.

The same applies to the design spec HTML file, referenced below. It is a
living demo of the current design candidates, not the final implementation.
New themes, refinements, and motion experiments should be added freely.

---

## Publication name: TBD

Two strong candidates, both in consideration:

**Detak Detik** ("heartbeat of the second" / the ticking clock): rhythmic,
kinetic, onomatopoeic. Connects to the twice-daily print rhythm and the
accountability-over-time soul of the paper. Also the name of an existing
Abstraksi product concept (civic municipal intelligence dashboard), and
this publication may become its backbone, which resolves rather than
complicates the overlap. DETAK DETIK in Archivo 800 is a strong masthead.

**Mercusuar** ("lighthouse"): permanent, geographically rooted, visible in
the dark, serves everyone. A lighthouse on the eastern edge of the
archipelago has the right understated political weight. Beautiful in
Fraunces light weight for the Atlas register.

Other candidates explored: Telisik (probe/scrutinize), Tilik (observe from
above), Ukir (engrave), Terang (illuminate), Rinci (detailed), Rekam
(record). All documented in the brainstorm history. "Lembaran" remains the
codename for the project until a name is decided; do not use it in any
public-facing copy.

---

## What this is

[NAME TBD] is a daily civic newspaper for Indonesia, printed twice a day by
an automated newsroom, served as a static site, and narrated by an agent
that can only say what it can cite. The map is the front-page photograph.
The sections are the rubrik of a broadsheet. The whole thing runs on free
infrastructure and stores nothing about its readers on any server we control.

It aggregates and synthesizes Indonesian public data (courts, budgets, prices,
deforestation, official promises, public-domain art) into a thing that is
beautiful, interactive, shareable, and trustworthy. It is a publication, not a
report: it prints on a schedule and it keeps a memory.

## The spine and the soul

- **Spine (what the reader feels):** today's edition is out. One paper, twice a
  day, with a masthead and sections and a print time. The newspaper format is the
  device that makes courts, budgets, art, and games cohere on one surface.
- **Soul (what gives it weight):** the paper keeps score. It remembers what was
  promised and checks it against what happened. State is a poster, change is a
  habit, kept-or-broken promises are the moat.

## The iron laws

These are non-negotiable. Every doc, desk, and component obeys them.

1. **Citation or silence.** The agent and the newsroom never assert anything they
   cannot cite to a row in the corpus. No citation, no claim. A claim whose cited
   number does not match the row is dropped, not softened.

2. **Two lanes, never crossed.** Lane A (external news) is RSS pass-through:
   verbatim headline, source, timestamp, link out, no model ever touches it. Lane B
   (our journalism) is derived only from primary structured data, narrated through
   the fact gate. A weaker model is a throughput problem, never a truth problem,
   because lies cannot pass a resolver that checks claims against rows.

3. **Documents speak, nobody accuses.** We show the permit, the award, the filing,
   side by side, with neutral connective language. The reader draws the conclusion.
   We never characterize intent, never allege a crime. Headlines state documented
   facts with a source attached.

4. **One command vocabulary.** The app is a state machine with a single command
   language. Location toggle, user clicks, lens tabs, tours, and the agent are five
   speakers of the same vocabulary. The agent has no special powers; it is one more
   speaker. Every state is a URL.

5. **Shared edition by default.** The shared edition (front page, lead, today's
   games, charts, art) is identical for everyone and is the social driver.
   Personalization (Lokal centering, streaks, memory, Cermin inputs) is a quiet
   client-side lens on top, never a replacement. Two readers the same morning see
   the same headline and the same puzzle.

6. **Local-first, no surveillance.** Reader memory lives in the browser as JSONL.
   The Worker is stateless and amnesiac. A tool that monitors corruption must not
   monitor its readers. Export and import of memory is a visible feature.

## The doc map

| Doc | Owns |
|-----|------|
| `CLAUDE.md` | This index. The laws, the build order, the stack in one line. |
| `DATA_CONTRACTS.md` | The rows. Region table, schemas, graph ontology, provenance, SOURCES ledger, `edisi.json`, the lens socket interface, shared/personal boundary. |
| `COMMAND_CATALOG.md` | The app's nervous system. Every command verb (UI + data tools), Zod schemas, tour-script format, session JSONL line types, the event envelope. |
| `NEWSROOM.md` | The nightly multi-agent pipeline. Desks, the fact gate, the lawyer pass, the editor, the layout/camera desk, the puzzle desk, log publication, the Pagi/Petang schedule. |
| `LEMBARAN_DESIGN.md` | The look. Tokens, type, the four surfaces, the five modes, the section system, signature motions, the Angka Edisi, low-end-Android and reduced-motion rules, share-card templates. |
| `PRD-00_CHASSIS.md` | The build. Repo layout, Astro + Svelte islands, Actions topology, Worker spec (proxy, cache, rate limit, ticker cron + KV), Pages deploy, degrade ladder, lazy-load boundaries, the RSS lane. |
| `PRD-LENSES.md` | The three launch lenses (Hukum, Anggaran, Hutan) plus Janji. Sources, extraction schema, socket fills, signature motion, legal posture, weekend definition-of-done each. |
| `EDITORIAL_GUIDELINES.md` | The voice and the seatbelt. Headline rules, two-lane doctrine in practice, the Sebandingkan unit registry, Arsip caption rules, the Ralat process, the never-publish list. |
| `NOT_NOW.md` | The graveyard. Cut ideas, one line each, so we do not relitigate them at 4am. |

## Build order

1. **Chassis skeleton.** Empty Astro shell on Pages, MapLibre island booting into a
   curated default view, region table loaded, Lokal/Nasional toggle, the command
   dispatcher with two or three verbs wired. Definition of done: the map flies when
   you type a command into a debug box.
2. **One lens deep: Hukum (Justice Gradient).** The scatter, the case panel, the
   extraction pipeline in Actions, the share-card. This is the wave-maker; it proves
   the whole stack end to end.
3. **The newsroom, minimal.** One desk, the fact gate, the editor, `edisi.json`,
   the front page rendering from the manifest. Pagi edition only at first.
4. **Breadth.** Anggaran and Hutan lenses, Janji ledger, the agent terminal with
   DuckDB-WASM tools, then the games and Cermin and Arsip.

Resist building month six before month one is real. Scope discipline is law 0.

## Design spec reference

`/mnt/user-data/outputs/lembaran-design-candidates-v2.html` is the living
design spec: 10 switchable themes with palette swatches, type specimens,
animated charts (Justice Gradient scatter, price wave), ornament canvases,
and the struk. Open it in a browser before writing any CSS. It is the
reference implementation of the design tokens, not the final skin. Add
new themes, tweak tokens, experiment freely.

The three active design registers (Dinas, Mesin, Atlas) are documented in
`AMD-DESIGN.md` section 8. The HTML file contains all three as switchable
themes. Claude Code: build the token system so all three can coexist on the
same page rather than being mutually exclusive.

---

## The stack in one line

Astro shell + Svelte 5 islands, MapLibre GL + deck.gl, GSAP (full free plugin
suite) for tours and morphs with native CSS scroll-driven animation for ambient
motion, DuckDB-WASM + graphology + Pagefind as the agent's local toolbelt over
Parquet artifacts, a stateless Cloudflare Worker proxying NIM (DeepSeek v4 / Qwen
3.5) with KV cache and the RSS ticker cron, nightly ETL in GitHub Actions with
DuckDB, all on Cloudflare Pages. Build output stays portable as insurance.

## Conventions for the build

- No em dashes anywhere, in code comments, copy, or docs. Use commas, colons, or
  parentheses.
- No contrast-marketing phrasing ("not X, this is Y" / "bukan X, tapi Y").
- Name specific components, not bucket terms ("PostgreSQL with pgvector", not
  "polyglot persistence").
- Animate transforms and opacity only. Honor `prefers-reduced-motion`. Test on a
  budget Android before shipping any motion to everyone.
- Every fat artifact (PMTiles, Parquet, the putusan corpus) goes to Releases or R2,
  never into the Pages bundle. Keep the deployed bundle light.

## What this is not

Not a magnum opus. Not a real-time intelligence platform. Not a corruption-accusation
machine. It is a fun, beautiful, trustworthy daily paper that happens to be built
from public data and happens to keep its receipts. Keep it fun.
