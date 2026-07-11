# Brief: Act I revamp + critique (read-only research/design task)

> Paste this to a fresh agent. It is **read-only**: assess, research, and propose —
> do NOT modify code, install, or build. Deliver a plan; implementation happens
> later, coordinated with in-progress map work.

## Role
You are an editorial + product designer auditing **Act I** of *detak-detik*, an
Indonesian civic-transparency newspaper. The owner feels Act I is "all over the
place and amateurish," and the RSS news desks "aren't wired and feel redundant."
Diagnose honestly and propose a tighter, more authoritative Act I.

## Ground yourself (read, do not change)
- `docs/CLAUDE.md` (esp. §1–3 the vision + iron laws + design standard; §6 roadmap)
- `docs/LEMBARAN_DESIGN.md`, `docs/AMD-DESIGN.md` (the look: registers, type, motion)
- `src/pages/index.astro` (how Act I is assembled + the news-desk section)
- The Act I islands in `src/islands/`: `PetaKabar.svelte` (the map),
  `LensaWilayah.svelte` (region lens), `Gelombang.svelte` (Harga Pangan),
  `PasarPagi`/`SensusDiri` and the four news desks (Nasional/Daerah/Alam/Dunia,
  added in the latest commit "Act I magazine front")
- `worker/src/index.ts` (the `/ticker` RSS lane: TEMPO, BBC Indonesia, Project
  Multatuli, Jubi, KBR, Mongabay) and `src/lib/` ticker/edition wiring
- `docs/EDITORIAL_GUIDELINES.md` (voice, the never-publish list)

## The iron laws to respect
Citation or silence; two lanes never crossed (Lane A = verbatim RSS pass-through,
Lane B = our data journalism); documents speak / nobody accuses; one command
vocabulary; shared edition by default; local-first / no surveillance. No em dashes,
no contrast-marketing, formal editorial tone.

## What to investigate
1. **The news desks.** Are Nasional/Daerah/Alam/Dunia actually fed by the RSS lane,
   or static? Trace `/ticker` → the front. Why do they feel redundant (overlap with
   the ticker? with each other? with Ringkas Pagi?). Should there be 4 desks, fewer,
   or a different cut (by outlet? by beat? a single curated front)? How does a
   verbatim-RSS desk earn its space next to the data journalism?
2. **Coherence + hierarchy.** Map Act I's current top-to-bottom flow. Where does it
   feel "amateurish" — competing focal points, boxy cards, weak typographic
   hierarchy, no clear reading order? Propose a single spine (what is the hero, what
   are satellites) consistent with the "one big number + small satellites" pattern.
3. **Redundancy.** List every Act I element and flag overlaps (e.g. ticker vs desks
   vs map labels; Lensa vs Sensus). Recommend merges/cuts.
4. **The map's role.** PetaKabar is the front page's centrepiece and is gaining
   layers (CO₂ emitters, SPPG kitchens, BIG health, rainfall). How should the news
   desks relate to the map — independent, or cross-linked (a headline that flies the
   map to a place)?

## Deliverable (structured markdown)
- **Diagnosis**: the 3–5 concrete reasons Act I reads as scattered/amateurish, each
  cited to a file/section.
- **Target structure**: a proposed Act I outline (ordered sections, the hero, the
  spine), with the news-desk decision resolved (count, feed, dedup) and a one-line
  rationale each.
- **RSS desk plan**: exactly how the 6 feeds should surface — desk taxonomy, wiring
  to `/ticker`, dedup against the ticker, and the Lane A purity guarantee.
- **Cut list / merge list**: what to remove or fold together.
- **Component-by-component notes**: keep / rework / cut, with why.
- **Open questions** for the owner.
Keep it specific and on-brand. Cite files. Do not write code.
