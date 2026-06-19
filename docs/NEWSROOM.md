# NEWSROOM.md — Lembaran

> The nightly multi-agent pipeline, framed as a newsroom with desks. Runs in GitHub
> Actions, free, twice a day. Produces one artifact: `edisi.json`. The browser merely
> renders it. Read alongside `DATA_CONTRACTS.md` (`edisi.json` schema, the tables the
> desks read) and `EDITORIAL_GUIDELINES.md` (the rules the lawyer enforces).

---

## 0. Framework choice (settled: Python + Pydantic AI + LiteLLM)

The newsroom is **Python**, in the `newsroom/` package, run as a headless batch in
GitHub Actions. Two libraries carry it:

- **Pydantic AI** for typed agents. Each desk is an `Agent(output_type=Temuan)`; the
  deterministic fact-gate runs as an `@output_validator` that raises
  `ModelRetry(reason)` on a bad number, so the model re-drafts with that exact reason.
  Retry-with-feedback (loop 2) is native, not hand-rolled.
- **LiteLLM** as the unified, OpenAI-shaped gateway across providers. The model is a
  Pydantic AI `FallbackModel` over `OpenAIChatModel`s routed through `LiteLLMProvider`:
  NIM (main) -> Groq -> OpenRouter -> Gemini, all free tiers, advancing on API error.

Detection stays deterministic (the rules below); the model only narrates. The whole
run is a bounded twice-daily batch of a few model calls, inside free tier.

**Why not Mastra** (the prior "upgrade path"): assessed June 2026 and rejected for
this job. Its only schema-failure modes are `strict`/`warn`/`fallback`, with no
retry-with-feedback equivalent to `ModelRetry`, so the fact-gate loop would be
hand-built; and its real value (server, Studio, workflows) targets a running service,
not a short headless cron. **Why not Cloudflare for the job:** a free Worker caps CPU
at ~10 ms/invocation, too little for a multi-call LLM batch; the Worker stays the
*serving* layer only and the Python job POSTs the edition to it. **Why GitHub
Actions:** full Python runtime, 6-hour ceiling, ~2,000 free private minutes/mo (we use
~300), first-class secrets. Cron is scheduled off the hour to dodge GitHub's jitter.

pi is the wrong shape here (it is an interactive TUI harness; this is unattended
batch CI), but we already stole its best idea, JSONL event logs, for both reader
memory and the published newsroom logs below.

---

## 1. The pipeline

```
fresh data (per source cadence)
   -> desks (one per lens, parallel)        : draft temuan
   -> fact gate (deterministic, not an agent): kill unbacked claims
   -> Redaktur Hukum (lawyer agent)         : kill/rewrite anything that alleges
   -> editor                                : rank, pick lead, write headlines
   -> layout desk                           : author the opening camera move
   -> puzzle desk                           : generate + self-validate games
   -> opinion desk                          : update argument maps
   -> emit edisi.json + publish newsroom log
```

Every model call in this pipeline is build-time. Runtime model calls are only Tanya
Negara, the one tour-generation call, and (v2) Adu Argumen. So the entire newsroom is
a bounded nightly batch of maybe a few dozen calls, inside free tier forever, even on
DeepSeek v4 / Qwen 3.5.

---

## 2. The desks (reporter agents)

One per lens. Each scans its fresh rows for stories.

**Critical division of labor: detection is deterministic, narration is the model's
only job.** The anomaly *detection* is SQL first (cheap, reproducible, no vibes). The
LLM narrates what the rules surfaced, as structured output, every claim carrying the
row ids it came from. The model fills a template from rows; it does not compose
freely. This is the regime where mid-tier models perform near-frontier, and it is why
a weaker model is a throughput problem, never a truth problem.

Starter anomaly rules (deterministic SQL, expand over time):

- **Hukum:** a `vonis_bulan` more than 3 sigma below the fitted curve for its
  `kerugian` bucket. New finals published since last edition.
- **Anggaran:** `belanja_pegawai / total > 0.70`. Largest per-capita outliers.
- **Hutan:** new alerts where `dalam_konsesi = true`. Largest `hektar` of the day.
- **Janji:** any promise whose `target_tanggal` passed since last edition, newly
  graded `tidak_tercapai`.
- **Harga:** `delta_pct` above threshold propagating across adjacent regions.
- **Data Hilang:** a metric that flipped from `ada` to absent.

Each surfaced row becomes a draft `temuan` with a proposed headline and body, both
annotated with `cited_ids`.

---

## 3. The fact gate (programmatic, not an agent)

A resolver, not a model. For every draft temuan:

- Each id in `cited_ids` must exist in the corpus. Missing -> drop the temuan.
- Each number quoted in `headline` and `body` must match the cited row exactly.
  Mismatch -> drop.
- Every factual sentence must carry at least one backing id. Unbacked sentence ->
  strip it; if that guts the temuan, drop it.

No appeal, no softening. Hallucination is filtered, not argued with. This gate is the
reason the publication can run on a cheap model: lies structurally cannot pass a
resolver that checks claims against rows.

---

## 4. Redaktur Hukum (the lawyer agent)

A second model pass over survivors, reviewing against `EDITORIAL_GUIDELINES.md`:

- Does any sentence characterize intent, allege a crime, or editorialize beyond the
  documents? Flag -> rewrite to neutral connective language or kill.
- Does any headline imply causation the data does not show? Flag -> rewrite.
- Documents-speak-nobody-accuses (law 3): the output shows the permit, the award, the
  filing side by side; the reader draws the conclusion.

An adversarial check between two model calls costs pennies of free tier and is the
difference between a newsroom and a content cannon. This desk is the seatbelt for the
whole project's legal and institutional safety (the founder is courting a gubernur
audiensi, Diskominfo onboarding, and BRIN credibility in parallel; one reckless
headline can torch that stack).

---

## 5. The editor

Ranks survivors by `skor`, picks the lead, writes headlines under the headline rules
(documented fact + source, never intent), fills the `angka_edisi` (the day's single
most striking cited number), and assembles the Tajuk editorial from the day's
threads, every line cited.

---

## 6. The layout desk (editorial map control)

Authors the day's **opening camera move**: a 10 to 15 second micro-tour
(`asal: "newsroom"` in the tour format) introducing the lead story. Where the map
flies, what highlights, what the lower-third says. So the newsroom controls the map
*editorially, nightly, at build time*, and every reader's first 15 seconds were
directed by the editor. Runtime map control via the command bus stays for
conversations; this is the broadcast version.

---

## 7. The puzzle desk

Generates the day's games, then validates its own output. Generation-validation loop
on every creative artifact.

- **Tebak Daerah:** pick a region, assemble progressive data clues from real rows,
  confirm the clues uniquely identify it (no ambiguity) before shipping. The answer is
  a known region, so validation is trivial. Identical for every reader.
- **Kuis Harian:** five questions from the corpus, each answer checkable against a
  row. Regenerate any ambiguous question.
- **Komik (ASCII):** the model writes a 3-panel script (caption + which stock element
  from a hand-made kit) from the lead temuan. The art is deliberately crude as a style
  choice, so a rough render reads as satire, not breakage. The humor lives in the
  caption and the juxtaposition with real data, never in pixel-perfect art. Pure
  free-generated ASCII is a fallback only.

If a puzzle fails validation, regenerate. A mediocre puzzle is worse than none.

---

## 8. The opinion desk

Updates argument maps on active polemics, sourced from primary documents only
(risalah DPR, naskah akademik, dissenting opinions in putusan, official ministry
statements). Never from news (that would cross into Lane A, which no model touches).
Each claim pinned to who actually said it, with source ids. This desk is lower
priority; defer if bandwidth is tight.

---

## 9. Publish the newsroom log

The banger no publication does. Every edition's deliberation is written as JSONL and
linked from the paper ("Bagaimana edisi ini disusun"): what each desk drafted, what
the fact gate killed, what the lawyer flagged, what the editor chose. The rejected
stories live in the morgue, visible.

For a transparency project the medium becomes the message: every editorial decision is
auditable. For the technical audience it is a working exhibit of verifiable
multi-agent content generation. The log format is the same JSONL line-type family as
reader sessions and tour scripts.

---

## 10. Schedule

Two Actions runs a day, exactly like newspapers ran morning and evening editions.

- **Edisi Pagi:** 05.00 WIB.
- **Edisi Petang:** 17.00 WIB.

Between editions, the live-ish layer breathes: a separate Cloudflare Worker cron
fetches RSS (Lane A) hourly into KV for the Berita Kilat ticker, and real-time
sources (gempa) can update their own small artifact without a full rebuild. The paper
prints twice; the ticker is fresher.

---

## 11. Honest failure modes to design around

- **A source is down at build time** (28% of gov portals have dead DNS, plus
  geo-blocks). The desk for that lens runs on the last good mirror and the section
  footer notes the data age. A dark source becomes a Data Hilang story, not a crash.
- **The model emits garbage.** The fact gate and the lawyer catch it. Worst case a
  duller edition, never a false one.
- **A desk produces nothing newsworthy.** The section runs a rotation spotlight from
  its slow data instead of a fake daily delta.
