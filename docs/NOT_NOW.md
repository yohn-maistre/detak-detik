# NOT_NOW.md — Lembaran

> The graveyard. Cut and deferred ideas, one line each, so we do not relitigate them at
> 4am. Being here is not a rejection of the idea, it is a rejection of the timing. Scope
> discipline is law 0.

---

## Cut from v1 on doctrine grounds (they fight the iron laws)

- **Simulasi Menteri Keuangan.** Its core mechanic is the LLM narrating consequences of
  budget choices, which is unverifiable generated vibes and directly violates
  citation-or-silence. Cannot coexist with a fact-gated publication without poisoning
  its credibility. Returns later, if ever, as a clearly-fenced game, never as
  journalism.
- **Adu Argumen (runtime debate).** A jailbreak surface and a token furnace on free
  tier, attached to the most legally sensitive content type. v2 at the earliest, behind
  a clear "synthesized advocate, not a person" badge.
- **Dua Sisi sourced from news.** Argument maps that read journalism cross into Lane A,
  which no model may touch. The surviving version (Opini) draws from primary documents
  only and is lower priority.

## Demoted, not cut

- **TTS Negara (crossword) -> Kuis Harian.** Indonesian crossword generation +
  validation is fiddlier than it looked, and a mediocre crossword is worse than none. A
  five-question self-validating daily quiz is the same ritual at one-tenth the build.
- **The comic -> ASCII, crude-on-purpose.** Image generation twice daily is slow,
  off-tier, and fails in the embarrassing way (mangled faces, gibberish text). ASCII
  with a hand-made stock kit, humor in the caption, crudeness as deliberate style. Pure
  free-generated ASCII is a fallback only.
- **Duel Daerah.** Stays, but as a card in Cermin, not a headline feature. Same dossier
  data, one versus-UI.

## Deferred (good, needs a dependency we do not have yet)

- **ETNOS federation (Surat Pembaca).** Needs the federation wiring and a moderation
  posture. v1 ships stable ids + clean JSON per temuan so this is a later weekend, not a
  rewrite. The schema decision costs nothing now.
- **Kartu Receh (collectible data cards).** Charming, pure retention sugar, zero civic
  weight. Month three if ever.
- **Ramalan Bintang Daerah (horoscope parody).** Funny once, ages in a week. An
  afternoon's garnish when the core is stable, not a v1 line item.
- **Auto-posting bots (Obituari Hutan and others).** Needs a moderation decision we will
  not rush. The site generates the cards; a human or a later system posts them.
- **Embeddable widgets / web-components.** High-value distribution primitive, but it is a
  hardening pass after the core renders. One export format, journalists become
  distribution nodes. Soon, not first.
- **Election mode (pilkada / KPU live layer).** Seasonal. Build when an election is the
  story.
- **Peta Lama deep georeferencing.** The opacity-slider overlay ships with Arsip; full
  georeferenced historical-map alignment (David Rumsey / Leiden) is a later flourish.

## Capability notes parked for later

- **Tier-2 embedding search.** Pagefind covers v1. Add precomputed quantized embeddings
  in Parquet only when lexical search starts visibly missing.
- **LanceDB.** Lovely, earns a place at build time at most. Our serving sizes do not
  justify it; structured SQL + graph walks + Pagefind cover ~90% of real questions.
- **Mastra.** The newsroom starts as plain TS. Migrate the DAG into Mastra only when
  desks, retries, and eval suites make orchestration pain real.
- **Fallback model pool.** Single NIM provider for v1. Rotate a pool behind the same
  Worker only if free tier buckles under load.

---

## The standing rule

The next move is never idea N+1. It is building one lens end to end and seeing whether
the thing is real before designing month six. Anything in this file can come back once
there is something to attach it to. Keep it fun.

---

## Added in v2 (Papua/World Cup brainstorm session)

- **Pembubaran-nobar tracker.** Real, important, and the single hottest
  object in the current news cycle with direct security-force involvement.
  Human-reporter territory under press protections. Link the coverage in
  Lane A; do not build the tracker under Lembaran.
- **Named individual responsibility claims in conflict coverage.** Lane C
  carries monitor figures, not criminal allegations against named actors.
  That is courts and human rights bodies, not a robot newsroom.
- **Camp coordinates or movement routes in displacement content.** Never.
  Operational details harm the people they describe.
- **Adu Argumen sourced from conflict coverage.** Already in NOT_NOW;
  doubly so for conflict-adjacent content. A model debating Papua policy
  against a reader is not this paper's job.
- **Automated Lane C publishing (no human review).** The staging gate is
  permanent, not a v1 compromise. Even a fast automated pipeline should
  not publish conflict figures without a human glance.
- **World Cup scoreboard framing for IDP counts.** The Selama 90 Menit
  card is arithmetic, not a scoreboard. Any design that wraps IDP numbers
  in match-result graphics is not this paper's register.
