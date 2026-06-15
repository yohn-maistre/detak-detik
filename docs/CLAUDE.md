# CLAUDE.md — the master document

> Read this first, every session. It is the constitution, the design standard,
> the current state, the technical decisions, and the live roadmap, in one place.
> It supersedes the older docs where they disagree; the rest of `docs/` is
> reference for deeper detail. The page itself is the deliverable, and it is
> already substantially built — this document tells future-you where things are
> and where we are going.

---

## 1. What this is, and what we want it to be

**Detak Detik** ("the heartbeat of the second") is a daily civic-transparency
newspaper for Indonesia, built from public data. One paper, refreshed twice a
day, with a masthead, a map for a front page, and sections that read like a
broadsheet. It aggregates Indonesian public data — budgets, courts, prices,
deforestation, procurement, regional statistics, markets, biodiversity — into
something beautiful, interactive, shareable, and trustworthy.

The deeper ambition: the whole page is a **human-readable visual harness for a
multi-agent newsroom**. A pipeline of agents gathers and verifies public data
twice a day and writes the synthesising sentences; the page renders it as a
living broadsheet; and **Aksara**, the on-page agent, lets a reader interrogate
the same cited corpus and have data, maps, and charts surfaced on demand, every
figure tied to a source. The paper keeps score over time: charts count every
day, promises are checked against outcomes, nothing goes stale like an article.

The motivation is plain: motion and dashboards are cheap now, so almost nobody
ships a point of view. Ours is a paper that looks unmistakably from here, whose
credibility and its aesthetics are the same argument, and whose every sharp
claim is a documented fact with a receipt attached. **The jabs come through the
data, never the copy.** Tone everywhere is formal, editorial, academic.

## 2. The iron laws (the constitution)

Non-negotiable. Every doc, desk, and component obeys them.

1. **Citation or silence.** Nothing is asserted that cannot be cited to a row. A
   claim whose cited number does not match the row is dropped, not softened.
2. **Two lanes, never crossed.** Lane A (external news) is verbatim RSS
   pass-through no model ever touches. Lane B (our journalism) is derived only
   from primary structured data through a deterministic fact gate.
3. **Documents speak, nobody accuses.** We show the permit, the award, the
   filing, side by side, with neutral connective language. We never characterise
   intent or allege a crime. (Concretely: SIRUP procurement is presented as
   "price vs category median," never as "waste/absurd.")
4. **One command vocabulary.** Clicks, lens toggles, tours, and the agent are
   speakers of one validated verb set. The agent has no special powers. Every
   state is a URL.
5. **Shared edition by default.** The shared page is identical for everyone;
   personalisation (the chosen lens, the census toy) is a quiet client-side
   layer, never a replacement.
6. **Local-first, no surveillance.** Reader memory lives in the browser; the
   Worker is stateless and amnesiac. No geolocation. A tool that monitors power
   must not monitor its readers.

## 3. The design standard (awwwards or nothing)

This is a typography-led, neo-renaissance editorial gazette that is alive with
restrained, purposeful motion. The bar is awwwards Site of the Day.

- **No default boxes.** A bordered card is a last resort, not the grid unit.
  Full-width typographic bands, ruled rows, bespoke layouts.
- **Typography leads.** Fraunces (variable serif) for hero numbers and titles;
  the "one big number + small functional satellites" pattern; Geist Mono for
  furniture, labels, receipts; tabular lining figures always.
- **Variety of register.** Hand-drawn (rough-notation), typed (mono tickers),
  animated (count-ups, self-drawing lines), and still — deliberately mixed, well
  spaced, deliberately coloured.
- **Motion everywhere, to feel living, but disciplined.** One engine (GSAP +
  canvas 2D). Two motion classes: *data micro-motion* on the figures (count-ups,
  self-drawing charts, marker springs) and *always-alive ambient* (at least one
  perpetual element per act: the masthead clockwork second-ring, the KILAS
  heartbeat, the Act II 90-minute clock, the Act III living "Rimba Hidup"
  canvas). One signature motion per piece, on the data itself. Animate transforms
  and opacity only; never layout. Honor `prefers-reduced-motion` (instant states,
  paused canvases). Pause off-screen. Test on a budget Android.
- **Three registers, one paper** (`src/styles/tokens.css`, scoped by
  `[data-register]`): **Dinas** (khaki, the working day, Act I), **Mesin** (black,
  the night press, Act II), **Atlas** (aged cream, the permanent record, Act III).
  A single viewport can carry all three.
- **Official-document ornament:** perforated receipts, stamps and seals on
  verified data, nomor-surat ids, drawn hairlines, agate corners.

Full detail: `docs/LEMBARAN_DESIGN.md`, `docs/AMD-DESIGN.md`,
`docs/design-candidates-v2.html`.

## 4. Current state (what is built, mid-June 2026)

The three-act front page is built and deployed (Cloudflare Pages), all sample
data marked `(data contoh)`. Highlights of the current session's work:

- **Act I:** the live MapLibre map (`PetaKabar.svelte`) with five real,
  toggleable, color-coded layers (provinces-clickable, quakes, volcanoes, air,
  floods, fire) wired to a Worker `/geo` proxy with contoh fallbacks; a clickable
  province layer driving the **lensa** store; the **Lensa Daerah** region lens
  (`KartuWilayah.svelte`, 38 provinces + search + comparative spread); a region
  **dossier** (`RegionDossier.svelte`) beneath the map; **Pasar Pagi**, the
  data-dense **Harga Pangan** wave (`Gelombang.svelte`), the vital-signs
  **Indeks Pagi**, and **Sensus Diri**. The masthead has a ticking clockwork
  second-ring.
- **Act II:** the five branches each open their own chapter via `CabangBand`
  (executive→Kuasa, legislative→Pabrik UU, judiciary→Hukum, Aparat,
  regions→Ekonomi), led by a slim "Lima Cabang" index; the Angka Edisi odometer
  and the 90-minute corruption clock; **Lingkungan & Ekstraksi** (forest pixel
  heatmap, air-quality calendar, JETP-vs-coal, species extinction); **Negara &
  Rumah Tangga** (rupiah/IHSG worst-in-world, MBG casualties); **Dunia** (the
  world scoreboard + the Vietnam comparison); the silence table; the promise
  ledger.
- **Act III:** Galeri Nusantara (daily painting + species), Ingatan, Almanak,
  and **Rimba Hidup** — a deterministic boids flock that synchronises into
  murmuration waves (the bee-shimmer, order out of chaos).
- **Aksara** (`Aksara.svelte`): the terminal pill; register-aware (inverts to
  follow the act); speaks `tanya / lensa / fly_to / scroll_to / sorot / set_layer
  / tur`; the opening tour points at sections by scrolling. The `/ask` Worker
  lane (NIM → Workers AI) exists; retrieval (RAG) is not yet wired.

Known issues queued for the next pass are listed in the roadmap below.

## 5. Technical decisions (settled)

- **Command bus** (`src/lib/commands/catalog.ts` + `dispatcher.ts`): one Zod-
  validated verb set; `on(cmd, fn)` / `dispatch(cmd)`; tours validated the same
  way. Stores that components subscribe to: `lensa.ts` (region) and
  `denominasi.ts` (unit re-pricing). New verbs planned: `open_region`,
  `map_label`, `map_choropleth`, `render_chart`, `show_table`.
- **Agent-rendered charts:** the agent emits a **constrained Vega-Lite-style JSON
  spec** (encodings only, enums, `additionalProperties:false`), validated through
  the Zod bus; **our code supplies the numbers from cited rows** (the viz
  fact-gate; Doc2Chart principle: model picks the shape, never the values).
  Observable Plot is rejected (JS-accessor specs are not JSON-validatable).
- **Citations are a property of code, not the prompt:** a runtime fact-gate in
  the Worker strips any cited id not in the retrieved set and drops any number
  that mismatches its row. Build this before trusting "receipts."
- **Cloudflare free tier** (verified June 2026): Workers AI `bge-m3` embeddings
  are effectively free at our corpus scale; Vectorize 5M vectors free; D1 5M
  reads/day; **generation is the scarce budget**, so keep NIM primary and
  Workers AI as fallback. The default RAG design keeps the Worker stateless
  (client-side Parquet + graphology), with a Vectorize + D1 edge variant
  available. See `docs/CLOUDFLARE.md`, `docs/STACK_2026.md`.
- **SIRUP procurement:** live API is the INAPROC gateway (`data.inaproc.id`,
  JWT). The Nemesis pre-classified dump (`github.com/assai-id/nemesis`, on Azure
  Blob) is a starting corpus; license CC BY-NC-SA (attribution + ShareAlike);
  pagu is plan-ceiling data, stamp "data per <tanggal>"; present strictly neutral.
- **Region data:** BPS WebAPI is the backbone (province + kabupaten via one
  `domain` code, free key); Satu Data and JDIH-BPK for breadth. A future
  kabupaten drill-down needs the BPS↔Kemendagri code bridge (`docs/DATA_SOURCES.md`).
- **Map:** MapLibre over OpenFreeMap (keyless); the `/geo` Worker proxy
  normalises FIRMS/WAQI/MAGMA/BMKG to GeoJSON; PetaBencana is a direct keyless
  client fetch.

## 6. The roadmap (locked this session)

Sequencing chosen with the user: **fixes + Act I consolidation → SIRUP page →
markets/economy → multi-agent newsroom → Aksara chart renderer → RAG + wire
everything (last).**

### A. Immediate fixes
1. Remove the cursor crosshair coordinate readout (`choreo.ts` `crosshair()` +
   `[data-crosshair]`); keep the map's own center-coordinate chip.
2. Remove the perpetual "earth rotating" map drift (`PetaKabar.svelte`
   `breathe()`); it fights zooming.
3. Fix the mobile map initial view (`fitBounds` to Indonesia, responsive).
4. Reframe the corner countdown: not "Edisi Petang" but "PEMBARUAN BERIKUTNYA" +
   a date and "pembaruan data dua kali sehari." Soften the magazine-edition
   framing in the masthead (keep the identity, drop the stale-issue implication).
5. Header tone: demote "GRATIS · TERBUKA · TANPA PELACAK" to a quiet footer note;
   keep no-tracking, stop selling it.
6. Act III: remove the corny pull-quote ("Yang tetap tinggal setelah kuasa…");
   remove the redundant `IngatanHero` (its Diponegoro painting duplicates Galeri).
7. Footer + README refresh (README now done; footer pending).

### B. Act I as Aksara's playground (the consolidation) — DECISION: one component
- **One morphing region component** (`LensaWilayah.svelte`) replaces
  `RegionDossier` + `KartuWilayah` and absorbs the **Indeks Pagi** national role.
  It shows the national base ("Angka Dasar Nasional") by default and **morphs to
  a province's figures when its region is clicked** (or searched, or asked): the
  national macro set (penduduk, belanja, inflasi, PDB, pengangguran, upah)
  gracefully swaps to the regional set (penduduk, kemiskinan, IPM, dokter, UMP,
  belanja-pegawai, pengangguran), with the comparative position (rank, delta vs
  national) on the same surface. Beautiful hierarchy, no boxes. Retire
  `IndeksPagi.svelte`, `KartuWilayah.svelte`, `RegionDossier.svelte`.
- **Map = clickable whole regions with borders** (ADM1 polygons, fill + outline),
  not dots; national + province borders visible; fix the inaccurate Papua
  placement. Bundle a small, code-joinable ADM1 GeoJSON in `public/data/`
  (geoBoundaries IDN ADM1 or a BPS-code-keyed repo; 38 provinces incl. the 6
  Papua ones). Aksara manipulates the map: toggle layers, show/hide legends, drop
  on-map stat/text labels and choropleths for one-shot questions.

### C. SIRUP explorer (`/pengadaan`) — DECISION: separate page
A dedicated, searchable procurement page (ingested from the Nemesis/INAPROC dump):
each row the documented package (nama, pagu, satker, lokasi, kategori) with a
neutral signal (price vs category median, single-source share) and a link to the
source row. Aksara can search it and surface the most notable packages. Strictly
documents-speak.

### D. Markets & economy package (the Bloomberg standard)
Neutral infographics, under a markets/economy + oligarchy home (final narrative
placement to brainstorm with the user): IHSG/JCI vs EM-SEA peers (normalized YTD,
JCI worst); GDP vs SEA peers over time ("the investor darling"); **free float &
ownership concentration** (the clever centrepiece: tycoon-held share vs the thin
public float vs other exchanges' minimum free-float rules → illiquid,
manipulable, fragile); MSCI investability warning / frontier-downgrade risk; the
10-year bond yield (stress); exports vs imports + trade balance (palm oil #1);
Danantara DHE / under-invoicing. Re-run the two queued research agents (econ data
+ ADM1 GeoJSON / market feeds) when the session limit resets, then build the top
6–8. Expand the house chart kit (`chart-kit.ts`) to many shapes (slope, dumbbell,
beeswarm, waffle, range-band, choropleth, candlestick, small-multiples…).

### E. Daily automation — DECISION: full multi-agent newsroom now
Build the full newsroom in `newsroom/`, run twice daily via GitHub Actions: per-
beat desks (markets, harga, hukum, lingkungan, pengadaan, daerah, dunia) each
fetch + verify + draft; a **fact gate**; a **lawyer pass** (documents-speak); an
**editor**; a **layout/manifest** step writing `public/data/edisi.json`. Model
calls go through the Worker/NIM. Migrate components from `edisi.ts` constants to
reading `edisi.json` (data + auto-written summaries), so each refresh restates
the summaries and extends the counting series. Scaffold the orchestrator + one
desk end to end first, then fan out. See `docs/NEWSROOM.md`.

### F. Aksara chart renderer, then RAG (last)
Wire `render_chart` / `show_table` into the playground (the panel under the map);
then the Worker `/ask` retrieval over the corpus with the runtime fact-gate,
returning `{jawaban, cited_ids}` + page commands, wired to live data + NIM.

## 7. The doc map

| Doc | Owns |
|-----|------|
| **`CLAUDE.md`** (this) | The master: laws, design standard, current state, decisions, roadmap, session log. |
| `LEMBARAN_DESIGN.md`, `AMD-DESIGN.md` | The look: tokens, type, registers, signature motions, share-cards. |
| `COMMAND_CATALOG.md` | The command bus: every verb, Zod schemas, tour format. |
| `DATA_CONTRACTS.md` | The rows: region table, schemas, the graph ontology, the lens socket, edisi.json shape. |
| `NEWSROOM.md`, `AMD-NEWSROOM.md` | The nightly multi-agent pipeline: desks, fact gate, lawyer, editor, schedule. |
| `DATA_SOURCES.md` | Verified public sources, per beat + the kabupaten-feasibility findings. |
| `EDITORIAL_GUIDELINES.md`, `AMD-EDITORIAL.md` | Voice, headline rules, the never-publish list. |
| `CLOUDFLARE.md`, `STACK_2026.md`, `PRD-00_CHASSIS.md` | Infrastructure: Worker, free-tier limits, deploy, secrets. |
| `PERSPEKTIF.md`, `PRD-LENSES.md`, `AMD-LENSES-PAPUA.md` | The lenses and perspektif pieces. |
| `ROADMAP.md` | Superseded by section 6 here; kept for history. |
| `NOT_NOW.md` | The graveyard of cut ideas. |

## 8. Session history (how we got here)

A very long single session took the project from a competent first build to the
current state, in roughly these arcs:

1. **Bug pass + structure:** fixed seam transitions, the denominasi leak, the
   Aksara dark-on-dark text, the loader flash, the compass, prices spacing;
   turned Act II into a signposted investigation and Act III into "Nusantara."
2. **The awwwards redesign:** the Lensa to 38 provinces + search; world stats
   moved to Act II beside the Vietnam comparison; the perspektif pieces surfaced
   into their themes; the struk made national; Sensus moved up; the branch
   framing; data-dense Harga Pangan; the vital-signs Indeks Pagi; the Act III
   magazine reflow; research-backed Lingkungan & Ekstraksi (air, JETP, species)
   and Negara & Rumah Tangga (rupiah/IHSG, MBG).
3. **The agent harness:** branches distributed into their chapters; the terminal
   inverted to follow the pill; the clockwork second-ring + heartbeat; Aksara
   reaching into the page (later simplified to gentle scroll after the boxes read
   crude); four live map legends + the Worker `/geo` proxy; the Act III living
   "Rimba Hidup" canvas; the clickable province map + region dossier.
4. **Consolidation + automation (this final plan):** decided one morphing region
   component, a separate SIRUP page, and the full multi-agent newsroom; added the
   Bloomberg markets standard; reframed the paper as a twice-daily refreshed
   organism, not a magazine of editions.

Pivots worth remembering: we dropped anime.js/three.js for **GSAP-only** (one
engine); we killed Aksara's drawn highlight boxes in favour of **rendering data**
as the way it "points"; SIRUP must stay strictly neutral (no "absurd" verdict).

## 9. Conventions

- No em dashes anywhere (code, copy, docs). Use commas, colons, parentheses.
- No contrast-marketing ("not X, this is Y"). Formal editorial tone throughout.
- Animate transforms/opacity only; honor reduced-motion; test on budget Android.
- Fat artifacts (GeoJSON, Parquet, the corpus) go to `public/data` / Releases /
  R2, never bloat the bundle.
- Verify every change: `pnpm build` clean + `pnpm check` 0 errors; serve `dist/`
  and screenshot the touched sections on mobile (390px) and desktop (1280px).
- Push to branch `claude/news-platform-design-f3rs36` AND `main`.
- The sandbox blocks outbound fetches, so live-data components render contoh /
  engraved fallbacks by design — this is expected, not a bug.

## 10. Where to pick up

Start at section 6 (the roadmap). The next concrete work is **A (immediate
fixes)** and **B (the one morphing region component + clickable province
polygons)**. Re-run the two queued research agents for the markets data and the
ADM1 GeoJSON before building D. The page is real and deployed; build, screenshot,
commit, push.
