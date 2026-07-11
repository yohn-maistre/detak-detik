# detak-detik — start here (amnesia-reader entry, kept current)

Daily civic-transparency newspaper for Indonesia built from public data.
Astro 7 + Svelte 5 front, Python multi-agent newsroom, GitHub Actions crons,
GitHub Pages deploy. Bilingual convention: Indonesian domain language in
UI/code names, English infra.

## Read in this order, every session

1. **`.claude/NORTH-STAR.md`** — the constitution: doctrine (§13), the
   regime-agnostic metric table (§4), **needs-from-Yose ledger (§10)**, and
   the **session log (§14, newest first)** — the last entry is always the
   current state of the seat.
2. **`docs/CLAUDE.md`** — the master working doc (design standard, settled
   technical decisions, ops learnings §11). `docs/PLAN_LOG.md` = build
   history; `docs/DATA_SOURCES.md` = every source with endpoint + license +
   cadence; `docs/research/` = probe cookbooks (verified endpoints, blocked
   hosts — read before re-probing ANYTHING).

## Iron laws (details in NORTH-STAR §13.1)

- **Citation-or-silence**: no number without a source receipt in the same
  surface. Absence is content — print what we don't know, labeled.
- **Satu fakta satu pemilik**: every number has exactly one owning
  module/JSON; other surfaces derive.
- **Lane A / Lane B**: official text verbatim (never rewritten) vs
  fact-gated newsroom writing. Documents speak; nobody accuses.
- **Regime-agnostic**: schemas describe the OFFICE, never the officeholder.
- **Window honesty**: time labels never claim more history than the archive
  holds; staleness >14d prints as absence.
- Wiring a new source = same-wave update of `src/pages/sumber.astro` +
  `docs/DATA_SOURCES.md` (the public receipts pages).

## The machine (as of 2026-07-11)

- **PANTAU NEGARA** (`newsroom/pantau.py` + `newsroom/sources/{agenda,
  lembaran,suara}.py`): stdlib-only, keyless, deterministic (no LLM) lanes —
  official publication → slim cited archive in `newsroom/data/` →
  build-time JSON imports in islands. Cron: `.github/workflows/pantau.yml`
  (2× daily), commits data → deploy bakes fresh rows. Per-lane exception
  isolation; dark source = keep archive, report `gelap` (+ `galat`).
- **Newsroom edition pipeline** (`newsroom/main.py`): needs LLM keys, cron
  `newsroom.yml`; `NEWSROOM_ENABLED` gates it. Corpus rows from the pantau
  archives feed it when live.
- Front page: Act 1 newsstand → **Act 2 the aggregator** (HARI INI DI
  NEGARA front desk, per-branch chapters: records + suara + vitals,
  PartaiPapan) → Act 3 permanent record.

## Ops (hard-won; more in docs/CLAUDE.md §11)

- **Verify ritual per wave**: `pnpm build` (the ONLY sufficient check —
  `astro check`/`pnpm check` miss Svelte and can OOM small hosts) → grep
  `dist/` for strings proving each change landed → commit terse one-liner →
  push → `gh run watch --exit-status`. Never claim deployed before green.
- Crons commit to main: **`git pull --rebase origin main` before pushing.**
- Python: repo deps live on CI, not necessarily locally — test with
  `python3 -m py_compile` + exec'd source slices with stubbed models.
  Local full harvest: `python3 -m newsroom.pantau` (stdlib, safe).
- Host reachability differs by vantage: peraturan.bpk.go.id (lembaran) is
  DARK from GitHub runners but alive from Indonesian/residential routes;
  emedia.dpr.go.id sometimes the reverse. A `gelap` lane keeps its archive;
  check the run log's `Panen semua lajur` JSON before assuming breakage.
- Known-blocked hosts (don't re-probe): dpr.go.id main, mahkamahagung
  putusan3/www, mkri.id, acch.kpk.go.id, presidenri.go.id, kejaksaan.go.id,
  ky.go.id, hukumonline. Side doors are in docs/research/2026-07-05-*.md.
- Probe politeness: UA `detak-detik/1.0 (koran sipil; josejr2498@gmail.com;
  github.com/yohn-maistre/detak-detik)`, ≥2s per host, verified TLS first
  with documented unverified fallback for broken go.id chains.
- `docs/screenshots/` is Yose's local dropzone (gitignored) — he steers by
  screenshot; read them carefully, they are the real spec.
