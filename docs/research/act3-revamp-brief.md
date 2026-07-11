# Brief: Act III magazine revamp (read-only research/design task)

> Paste this to a fresh agent. It is **read-only**: assess, research, and propose —
> do NOT modify code, install, or build. Deliver a plan + sourced content;
> implementation happens later, coordinated with in-progress map work.

## Role
You are an editorial designer reimagining **Act III** of *detak-detik* (the "Atlas"
register — the permanent record). The owner finds it "random, redundant, disjointed
components put together," and wants a **complete revamp into a magazine** — like
Act II's signposted investigation, but for culture/heritage/memory: art, peoples
(indigenous tribes), musical genres, history pieces, biodiversity — each a real
piece with substantial writing, not a one-paragraph stub.

## Ground yourself (read, do not change)
- `docs/CLAUDE.md` (Act III = "Atlas", aged-cream register; the iron laws)
- `docs/research/2026-06-27-act-iii-data-and-components.md` (already-verified Act III
  data sources + 3 component ideas — build on this, don't redo the source-hunting)
- `docs/LEMBARAN_DESIGN.md`, `docs/PERSPEKTIF.md` (aesthetic + editorial frame)
- The current Act III islands in `src/islands/`: `GaleriNusantara.svelte`,
  `WajahNusantara.svelte`, `Bahasa718.svelte`, `AlmanakSains.svelte`,
  `SisaAlam.svelte`, `DitherNusantara.svelte`, and any Ingatan/Almanak/Rimba pieces
- How Act II is structured (the "Lima Cabang" index + `CabangBand` chapters) in
  `src/pages/index.astro` — the magazine model to emulate

## The vision (from the owner)
A magazine section, signposted like Act II, that pulls living content:
- **Peoples / indigenous tribes** — Wikipedia/Wikidata-sourced profiles with real,
  interesting writing (history, customs, where they live, language status), not one
  paragraph. (Suku Dani, Mentawai, Dayak, Baduy, Toraja, Asmat, Bajau, etc.)
- **Art** — public-domain Nusantara art (Wikimedia Commons / Rijksmuseum / KITLV).
- **Musical genres** — gamelan, dangdut, keroncong, sasando, kolintang… with
  history + a cited note (and, if feasible, an embed/era timeline).
- **History pieces** — "on this day in Nusantara", longer historical reads.
- **Biodiversity / heritage / languages** — fold in the already-verified sources
  (GBIF + IUCN, UNESCO heritage, Glottolog endangered languages, almanac/moon).

## Iron laws to respect
Citation or silence (every claim sourced, attribution shown); documents speak;
formal editorial tone; free-tier, keyless-where-possible data; local-first / no
surveillance; deterministic daily rotation with engraved fallbacks (the existing
Act III pattern); no em dashes, no contrast-marketing.

## What to investigate
1. **Diagnose** the current Act III: which components are redundant/disjointed, what
   the "random" feeling comes from (cite files), and what to keep vs cut.
2. **Design the magazine**: propose a signposted Act III structure mirroring Act II —
   an index + chapters (e.g. Manusia / Rupa / Bunyi / Ingatan / Hayati). For each
   chapter: its purpose, the data/content source (prefer the already-verified ones),
   the one signature visual/motion (in the Atlas register), and how it earns its place.
3. **The tribes piece specifically**: design "Manusia Nusantara" — how to pull
   substantial Wikipedia/Wikidata writing on indigenous peoples (REST summary +
   sections), deterministic rotation, with image (Commons) + language status
   (Glottolog) + region (map link). Give the exact endpoints + a content rotation list.
4. **Music**: identify keyless/citeable sources for Indonesian musical genres
   (Wikipedia/Wikidata; any open audio like Wikimedia/Internet Archive PD).
5. **Reuse, don't reinvent**: map each existing Act III island to keep / fold / cut.

## Deliverable (structured markdown)
- **Diagnosis** of current Act III (cited).
- **Proposed magazine structure**: the index + chapters, each with purpose, source
  (endpoint), signature motion, and a one-line rationale.
- **"Manusia Nusantara" spec**: endpoints, rotation list of peoples, the writing model
  (how to get more than a paragraph, cited), the layout.
- **Music + history + art chapter specs**: sources + the piece each becomes.
- **Keep/fold/cut table** for the existing islands.
- **Open questions** for the owner.
Build on the existing verified sources doc; add only what's new. Cite endpoints +
files. Do not write code.
