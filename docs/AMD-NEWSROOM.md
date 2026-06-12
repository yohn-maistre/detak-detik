# AMD-NEWSROOM.md — append to NEWSROOM.md

---

## 12. The Sorot Ganda desk

A new desk running alongside the existing five. Its sole job: find the
daily juxtaposition. It never generates opinions; it generates arithmetic.

**The World Cup mode (active while tournament runs):** at the final whistle
of every match, the desk runs this operation:
1. Pull match duration in minutes from open football data API.
2. Multiply the daily GLAD alert rate (30-day rolling average in hectares
   per hour, from `alerts.parquet`) by match duration in hours.
3. Pull current IDP count from `pengungsi.parquet` (most recent approved
   Lane C row).
4. Emit a "Selama 90 Menit" card: "Selama pertandingan [Nama Tim A vs
   Tim B], hari ini: rata-rata ±X hektar tutupan hutan hilang di zona
   PSN Papua Selatan (laju 30 hari, GFW). Y orang tercatat sebagai
   pengungsi internal di Tanah Papua (per [sumber], [tanggal laporan])."
5. Rate conversions go through the Sebandingkan registry as usual.
   No conversions invented per card.
6. The fact gate checks: does X match the 30-day rolling mean? Does Y
   match the most recent approved Lane C row? Any mismatch, drop the card.
7. The Redaktur Hukum pass checks: does any sentence characterize cause,
   allege responsibility, or connect the two facts with anything beyond
   proximity? One word of editorial linkage = kill.

The card is identical for every reader (law 5). It auto-generates; it
never characterizes. The reader draws the conclusion.

**Layar Ganda (permanent, not World Cup specific):** a daily paired counter
on the front page. Left: the day's single biggest headline number (a match
result, a budget announcement, a GDP figure). Right: "Hari ke-X pengungsian
Kabupaten Puncak." Days since first HRM-documented displacement event in
the reference kabupaten. Plain counter. No caption. The editor desk sets
this pair; the Sorot Ganda desk proposes the left side from the temuan feed.

**Indeks Perhatian chart (weekly):** Saturday build, `perhatian.parquet`
smoothed 7-day rolling, topic pairs plotted as a single dual-line chart.
No annotation, no verdict. The lines are the story.

**Pasukan vs Pelayanan (monthly, when data updates):** compare
`pasukan.parquet` figures against puskesmas-per-kapita and
dokter-per-kapita from BPS for the same kabupaten set. Displayed as a
diverging bar: security presence index vs health service index, per region.
Both axes are cited figures. No inference about causation.

**Sawit yang Datang (nightly when new alert data lands in a PSN zone):**
if a new GLAD alert intersects a `psn_konsesi` polygon with
`catatan_hak_adat = true`, the desk flags it as a Hutan temuan with a
PSN layer note. The concession document and the alert appear side by side.
No accusation about who is responsible. Documents speak.

---

## 13. Staging gate integration in the pipeline

The newsroom cron checks `/data/staging/lane-c-queue.jsonl` before running
any desk that consumes Lane C data. Any row with `"approved": false` is
invisible to all desks. The pipeline logs how many approved vs unapproved
rows exist so the published newsroom log is transparent about the queue
state. A large unapproved queue is itself visible in the log, which is the
right kind of accountability.

---

## 14. Extended Redaktur Hukum rubric for conflict-adjacent content

In addition to the existing checks (characterize intent, allege crime,
editorialize), the lawyer pass applies these for anything tagged
`lens: papua` or `lens: kalimantan_selatan`:

- Does the text name an individual as responsible for displacement or
  violence without a court finding? Flag and kill.
- Does any sentence connect a security operation to a specific death
  without sourcing that was already in the cited monitor report? Flag.
- Does the rate conversion imply the state chose to displace people (rather
  than merely noting two facts in proximity)? Flag.
- Does the framing aestheticize the displacement (heroic, tragic, poetic)?
  Flag. Drier is always better here.
- Is there any operational detail (location of displaced, camp coordinates,
  movement routes)? Kill immediately.

The lawyer pass on conflict content is stricter than on financial content.
When in doubt: shorten the words, show the document, or drop it.
