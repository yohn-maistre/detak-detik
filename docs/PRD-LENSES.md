# PRD-LENSES.md — Lembaran

> The launch lenses, each as a four-socket plug into the chassis (`DATA_CONTRACTS`
> section 6): map skin, feed source, sheet panel, dossier section. Each brief is
> deliberately thin. Hukum is the wave-maker and gets built first end to end. Janji is
> the soul. Read alongside `DATA_CONTRACTS` (schemas), `NEWSROOM` (the desks), and
> `EDITORIAL_GUIDELINES` (legal posture in practice).

---

## Lens 1: Hukum (Justice Gradient) — build this first

The wave-maker. Highest indignation-per-byte, fully defensible data (the judiciary's
own published rulings), and the GenAI usage is the impressive kind: structured
extraction at scale over horrible government PDFs, not a chatbot. The meme already
lives in every Indonesian head (nenek pencuri kakao vs koruptor triliunan); nobody has
plotted the national curve from the court's own documents.

- **Source:** `putusan_ma` (Direktori Putusan MA). Scrape with a politeness policy
  (rate-limited, cached, respectful). CF-block risk; may need the Pi relay.
- **Corpus scope v1:** `korupsi` + `pencurian`, bounded sample (low thousands), enough
  to draw the curve honestly.
- **Extraction schema:** `putusan.parquet` (`DATA_CONTRACTS` 4.1). Build-time LLM
  structured extraction with `extract_confidence`; low-confidence rows flagged for
  human spot-check sampling. The two forced decisions (binding instance in the
  banding/kasasi chain; bebas/onslag at `vonis_bulan = 0`) are in the schema.
- **Map skin:** regions tinted by sentencing pattern, but the signature motion is on
  the scatter, not the map. New finals fall in like sediment, the day's additions glow.
- **Feed source:** a `vonis_bulan` more than 3 sigma below the fitted curve for its
  `kerugian` bucket becomes a temuan. New finals since last edition.
- **Sheet panel:** the log-scale scatter (X = `kerugian`, Y = `vonis_bulan`). Tap a dot
  -> case panel quoting only the `ruling_excerpt` (law 3). Plus the **Garis Vonis**
  game: guess the sentence before the real dot drops, scored on the miss.
- **Dossier section:** cases from this region's pengadilan.
- **Legal posture:** verbatim-from-document only. The case panel quotes the ruling; it
  never characterizes. The scatter shows what the courts decided; the reader feels the
  gradient.
- **Bonus toy (free, reuses the dataset):** Kalkulator Vonis. Input a hypothetical
  `kerugian`, get the estimated sentence from the fitted curve of real rulings, beside
  what stealing a phone gets. Pure client-side math, devastating share-card.
- **Definition of done:** Saturday = scraper + extraction pipeline in Actions. Sunday =
  the scatter, the case panel, the share-card. This proves the whole stack end to end.

---

## Lens 2: Anggaran (Struk Belanja Negara)

The single most shareable object on the site. Especially resonant on public-spending
composition. Enter your kabupaten, get a literal cash-register receipt of your APBD.

- **Source:** `djpk_apbd` (DJPK APBD / realisasi). Quarterly, so the cron is lazy.
  Geo-block risk; likely needs the Pi relay.
- **Mapping spec:** `apbd.parquet` (`DATA_CONTRACTS` 4.2). The editorial roll-up (which
  sub-accounts fold into `belanja_pegawai` etc.) is documented in `EDITORIAL`, not
  invented per build.
- **Map skin:** regions shaded by `belanja_pegawai / total` ratio (the quiet base), but
  the section's star is the receipt, not the map.
- **Feed source:** `belanja_pegawai / total > 0.70`; largest per-capita outliers.
- **Sheet panel:** the thermal-receipt render. Perforated edge, tabular figures, the
  composition as line items, IG-story export sizing. One dry roast line at the bottom
  like a fortune, generated once per region per data refresh at build time (514 calls a
  quarter, basically free).
- **Dossier section:** the region's receipt + per-capita percentile vs national.
- **Adjacent build:** the transfer-daerah Sankey (`transfer.parquet`) as the Ekonomi
  animated centerpiece (center -> province -> kabupaten money flow), and the harga wave
  (`harga.parquet`) propagating across the map.
- **Definition of done:** region picker, receipt render, export. Sankey and harga wave
  are follow-on weekends in the same section.

---

## Lens 3: Hutan (Obituari Hutan)

Grim, beautiful, self-publishing. Every day the section auto-generates a death notice
for yesterday's forest loss. It keeps producing share-cards forever without anyone
touching it.

- **Source:** `gfw_alerts` (GFW integrated alerts API, GLAD/RADD). Daily, reliable
  (international, no relay needed). The cleanest pipeline of the three.
- **Per-event spec:** `alerts.parquet` (`DATA_CONTRACTS` 4.4). Region derived by
  point-in-polygon at build time. `hektar` with the `lapangan_bola` conversion from the
  `EDITORIAL` registry.
- **Map skin:** alerts bloom and fade as embers (the signature motion).
- **Feed source:** new alerts where `dalam_konsesi = true`; largest `hektar` of the day.
- **Sheet panel:** the obituary card. Before/after satellite tiles, hectares in
  football-field units, concession overlap shown as side-by-side documents with zero
  connective accusation (law 3). A two-line elegy generated at build time (tone guide in
  `EDITORIAL`, with a bahasa-daerah flourish where apt).
- **Dossier section:** the region's forest-loss history and any concession overlaps as
  documents.
- **Out of scope for the weekend:** auto-posting bots. Those need a moderation decision
  we will not rush.
- **Definition of done:** daily alert ingestion, the obituary card with before/after
  tiles, the daily auto-generated page + share-card.

---

## Lens 4: Janji (the promise ledger) — the soul

Not a launch-week lens in build order (it needs a little corpus of filed promises
first), but it is the spine's soul and gets first-class schema treatment now so it is
never bolted on. The thing Nemesis structurally cannot do: a publication with a memory
that keeps score.

- **Sources:** promises are primary documents (RPJMD targets, APBD allocation goals,
  SDG national targets via `sdg_target` with attached figures, official dated
  pernyataan). Outcomes are measured numbers from other lens tables.
- **Schema:** `janji.parquet` + `realisasi` linkage (`DATA_CONTRACTS` 4.5). Grading is a
  build-time join of `metric_ref` to the measured value vs `target_nilai` /
  `target_tanggal`. Status: `tercapai`, `tidak_tercapai`, `berjalan`,
  `data_tidak_tersedia` (the last feeds Data Hilang, never hidden).
- **Map skin:** regions colored by promise-keeping rate (quiet), with the grade stamp as
  the signature motion.
- **Feed source:** any promise whose deadline passed since last edition, newly graded
  `tidak_tercapai`.
- **Sheet panel:** the filed target beside the measured outcome, the grade stamped in,
  both cited. Documents speak; nobody accuses.
- **Dossier section:** the region's full promise scorecard.
- **Legal posture:** the promise is the government's own filed document; the outcome is
  the official measured number. We state both and grade arithmetically. We never impute
  motive for a broken promise.

---

## Shared notes across all lenses

- Every lens fills all four sockets or it is not done.
- Detection is deterministic SQL; the model only narrates cited rows (`NEWSROOM` 2).
- Each lens declares its refresh cadence honestly in its section footer.
- Each lens contributes a share-card family (`LEMBARAN_DESIGN` 6).
- Legal posture is the same everywhere: documents speak, nobody accuses (law 3). When
  in doubt, show the document and shorten the words.
