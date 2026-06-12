# AMD-LENSES-PAPUA.md — append to PRD-LENSES.md

> The Papua lens brief plus seven new socket fills. Each fills the
> four-socket interface (map skin, feed source, sheet panel, dossier
> section). Some are lenses; some are panels that ride inside existing
> lenses. All are powered by Lane B or Lane C per their schema.

---

## Lens 5: Papua (the attributed monitoring lens)

The lens where Lane B and Lane C work together. Structurally identical
to other lenses but with the staging gate in the pipeline and the
distinct Lane C chip style throughout.

- **Sources:** `pengungsi.parquet` (Lane C staged), `psn_konsesi.parquet`
  (Lane B), `pasukan.parquet` (Lane C staged), `alerts.parquet` in the
  PSN-intersection mode, `perhatian.parquet` (GDELT, Lane B).
- **Map skin:** quiet choropleth showing data availability per kabupaten
  (Indeks Keheningan derived layer), with PSN concession polygons as a
  toggleable overlay (documents shown as chips, no accusation). Active
  GLAD alerts in PSN zones bloom as embers exactly as the Hutan lens.
- **Feed source:** new `dalam_konsesi` alerts, new staging-approved Lane C
  IDP updates, new Janji failures in Papua kabupaten. Each carries full
  source attribution in the card header.
- **Sheet panel:** the Indeks Keheningan view (see below) as the signature
  artifact. The table that makes the silence loud.
- **Dossier section:** a region's full statistical ledger including the
  explicit empty rows, plus the Lane C figures in a separately styled block
  with source chips.
- **Legal posture:** Lane C rendering rules (EDITORIAL AMD section 9) apply
  to every pixel of this lens. The lawyer pass runs twice for this lens:
  once by the desk, once by the Redaktur Hukum with the extended conflict
  rubric (NEWSROOM AMD section 14).

---

## New panel: Yang Tidak Dihitung (rides inside the Papua lens)

The flagship quiet piece. The single most powerful thing the paper can say.

- **What it is:** a table, rendered in Dinas ledger style, of every
  official statistic published for a given kabupaten: ASN count, APBD,
  puskesmas count, livestock, harvest area. Every row has its official
  number and its BPS/DJPK source chip. One row at the bottom:
  "Warga mengungsi akibat konflik: —" with the cell styled in a faint
  red and a note: *data resmi tidak tersedia*. Then, indented below it,
  the Lane C figure from `pengungsi.parquet` with its chip.
- **Feed source:** built at build time per kabupaten. Runs for every
  kabupaten in the Papua lens, not just conflict zones. Completeness
  is the comparison.
- **Share card:** the table itself, as a Dinas-register card. The absence
  row is visible and legible at card size. No caption.
- **Legal posture:** the state's own non-publication is documented fact.
  No allegation about why the row is empty.

---

## New panel: Layar Ganda / Selama 90 Menit

Two modes, one component. Permanent front-page fixture during World Cup;
permanent sidebar counter year-round.

**Layar Ganda (permanent):** a paired counter on the front page.
Left panel: today's biggest cited number from the edition (match result,
GDP, budget headline). Right panel: "Hari ke-[N] pengungsian Puncak."
N is days since the first HRM-documented displacement event in Kabupaten
Puncak (anchor date from the staging data). No caption, no connector.
The white space between the two panels is the editorial.

**Selama 90 Menit (World Cup mode):** auto-generated at final whistle per
match. Arithmetic only:
  - Match duration in minutes from open football API (football-data.org,
    free tier, no auth).
  - GFW 30-day rolling hourly average × (minutes ÷ 60) = estimated
    hectares during match.
  - Most recent approved IDP count from `pengungsi.parquet`.
  - Two sentences, two source chips, one share card.

The fact gate checks all arithmetic. The lawyer pass strips any word that
implies causation. The card is identical for every reader.

---

## New section: Indeks Perhatian

- **Sources:** `perhatian.parquet` (GDELT + RSS volume, daily). Keyword
  taxonomy committed to the repo; human-editable, not LLM-generated.
- **Map skin:** none. Lives in the Ekonomi/front page as a panel.
- **Feed source:** if the 7-day rolling ratio of any paired topic set
  crosses a threshold (e.g. World Cup coverage exceeds Papua coverage by
  10× on a given day), the Sorot Ganda desk emits a temuan.
- **Sheet panel:** dual-line chart, 30-day rolling, two topics per view.
  One line per topic, no fills, no annotations. The lines are the story.
  Replay button. Share card as the raw chart.
- **Dossier section:** per kabupaten or topic: "Berapa kali nama ini muncul
  dalam 30 hari terakhir." Useful for region dossiers.
- **Legal posture:** fully Lane B. GDELT is publicly available tabulated
  event data. No media company is accused of anything; the chart shows
  aggregate volume, not individual editorial choices.

---

## New panel: Pasukan vs Pelayanan

- **Sources:** `pasukan.parquet` (Lane C monthly), BPS
  dokter/puskesmas-per-kapita (Lane B annual), `regions.parquet`.
- **Map skin:** rides the Papua lens. Diverging choropleth: one axis
  is security-presence index, other axis is health-service index. Color
  encodes the ratio, not an absolute value.
- **Feed source:** when `pasukan.parquet` updates, the desk runs a
  fresh comparison and emits a temuan if any kabupaten's ratio changes
  significantly.
- **Sheet panel:** a diverging bar chart, one bar per kabupaten, sorted
  by the ratio. Every figure carries its source chip. The chart title
  states both metrics by name; no characterization of what the comparison
  means.
- **Legal posture:** the paper measures two things and shows them on the
  same axis. It never says one causes the other. Both axes are sourced.

---

## New section: Indeks Keheningan

The quietest and most politically undeniable piece on the whole site.

- **Source:** `keheningan.parquet` (derived from the existing Data Hilang
  machinery, plus the `konteks` flag for conflict kabupaten).
- **Map skin:** a choropleth of data opacity: how many of the standard
  BPS metrics actually exist per kabupaten. Dark = opaque, light = visible.
  The conflict zones appear as dark patches not because we labeled them
  but because the data simply isn't there.
- **Feed source:** any kabupaten that flips from "most metrics present"
  to "most metrics absent" across two consecutive BPS release cycles is
  a temuan.
- **Sheet panel:** a ranked list of kabupaten by opacity score, with the
  bottom 10 (least measured by official statistics) highlighted. Each
  entry shows which metrics are missing. No allegation about why.
- **Share card:** the map, with a single caption: "Kabupaten paling gelap
  secara statistik, per [year] BPS."
- **Legal posture:** the cleanest piece in the system. Absence of a row
  in BPS is a fact, not an opinion.

---

## New lens socket: Sawit yang Datang (Hutan lens extension)

- **Sources:** `alerts.parquet` + `psn_konsesi.parquet` (intersection
  computed at build time).
- **Extends** the Hutan lens: when a new alert lands inside a PSN
  concession polygon where `catatan_hak_adat = true`, the Hutan desk
  generates an extended Obituari card that includes the concession
  document as a side-by-side panel.
- **The Scrubber:** a time scrubber on the Sawit yang Datang sheet panel
  shows cumulative PSN-zone alerts from 2024 to now, advancing week by
  week. The concession boundary stays fixed; the embers accumulate. This
  is the film's thesis rendered as a receipt.
- **Legal posture:** the concession document and the alert appear as two
  separate cited documents placed in proximity. No text claims a causal
  link; the visual proximity is the design's job, and it is honest because
  both documents are real.

---

## New panel: Harga Sembako Pengungsian

Low-cost, high-resonance. The market records what the state doesn't.

- **Source:** `harga.parquet` filtered to kabupaten that are
  displacement-receiving towns (Sinak, Nabire, etc., per the kabupaten
  list in `pengungsi.parquet`'s coverage). Compared to the national
  average and the nearest non-affected kabupaten.
- **Map skin:** rides the Hutan or Papua lens. A small overlay showing
  the price delta for beras and sembako in these towns vs the baseline.
- **Feed source:** when a displacement-receiving town's price spikes more
  than 2 sigma above its own 30-day average, the Sorot Ganda desk emits
  a card.
- **Sheet panel:** a compact comparison strip: displacement town vs
  national, 30-day trend, one line each.
- **Legal posture:** price data from PIHPS is Lane B. The paper observes
  that prices are high in certain towns; it draws no conclusion about
  why. The reader has the context from the rest of the paper.

---

## KalSel slot note

All Papua socket fills above have a KalSel variant using the same schemas
but filtered to the relevant kabupaten (Barito Timur, Tanah Laut, etc.)
and the relevant PSN type (sawit, coal). The lane-C monitoring sources for
KalSel are Mongabay Indonesia and Walhi Kalsel. The Sorot Ganda desk runs
the same juxtaposition logic. No separate lens brief needed; it's a
filter on the same machinery.
