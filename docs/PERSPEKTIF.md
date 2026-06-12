# Perspektif — the chart backlog

Synthesis of the June 2026 research sweep (five verified domain reports) into
buildable perspective-shifting pieces. Each entry: the juxtaposition, the
"oh" moment, the data pipeline, feasibility, and which act it lives in.
Companion docs: DATA_SOURCES.md (daily feeds), CLOUDFLARE.md (infra).

House rule applies to every piece: formal wording, satire lives in the data,
every number carries its chip, Lane C clearly marked, dark sources become
Data Hilang notes.

---

## Tier 1 — flagship structural pieces (hand-built datasets, refreshed per term)

### 1. Pabrik Undang-Undang *(Mesin)*
Scatter: days-from-draft-to-passage × substance (pages / people affected)
per law. Anchors verified: **UU Polri — 20 days** (initiative May 20 2026 →
passed June 9 2026); UU TNI — weeks (Mar 2025); **RUU Perampasan Aset —
stalled 10+ years**. The Gradien Keadilan grammar, applied to lawmaking.
Data: dpr.go.id + openparliament.id timelines, ~50 laws hand-compiled.
Feasibility: EASY (manual), automation HARD.

### 2. Gradien Harta *(Mesin)*
Scatter: maximum legitimate career earnings (years in office × published
salary regs) × declared LHKPN wealth. Anchors: Prabowo Rp 2.07 T declared;
richest minister Rp 5.44 T (2.6× the president). Footnote dataset: LHKPN
compliance by branch — legislature worst at 82.21% vs judiciary 99.99%.
Data: elhkpn.kpk.go.id (public, no API — headless scrape), salary regs
PP 75/2000 etc. Feasibility: SCRAPE. Pure Lane A self-declared documents.

### 3. Siapa Memiliki Dapur / the MBG suite *(Dinas + Atlas)*
a. **Kepemilikan**: ownership chart of ~30.000 SPPG kitchens — Polri 1.376,
   TNI 452, ICW: 1 in 3 partner yayasan politically affiliated; of 24 names
   in the June 2026 Kejagung case, majority legislators.
b. **Kecepatan vs Keselamatan**: beneficiary ramp (55 jt → 63 jt) against
   the poisoning curve (JPPI: 10.482 Oct 2025 → 37.270 May 2026) — coverage
   +15% while victims tripled.
c. **Rp 335 T untuk makan, Rp 14 T untuk atap**: MBG 2026 budget vs school
   revitalization budget (cut from Rp 16.97 T while the target rose; 1.2 jt
   damaged classrooms; 4 roof collapses May–June 2026 alone).
d. **Piring vs Dapur**: Rp 8–10 rb of ingredients per Rp 15 rb portion
   (BGN's own correction), priced against panel-harga per province.
Data: BGN releases, JPPI/FSGI tallies, mbgwatch.org + lapormbg.com (civic
trackers), ICW yayasan dataset, e-katalog/LPSE procurement records.
Feasibility: EASY (tallies are published) + SCRAPE (procurement).

### 4. Efisiensi vs Struktur Baru *(Dinas)*
Diverging bar: claimed Rp 300 T austerity savings against what the new
structures cost — MBG Rp 268 T, KDMP's Rp 34,57 T raid on Dana Desa (with
Rp 85,96 T projected bad loans), cabinet premium ~Rp 1,95 T/5yr (109
officials, largest since 1966), ~Rp 1 T presidential travel (51 trips/19
months), Whoosh's Rp 79 T debt landing on APBN. The cuts hit BMKG (−50%)
and PU (−Rp 12,7 T); the pet programs went untouched.
Data: Inpres 1/2025 (peraturan.bpk.go.id), CELIOS/FITRA costings, APBN KiTa.
Feasibility: EASY (all published figures).

### 5. Penggaris Tiga Negara — press freedom *(Mesin)*
Three rulers, one timeline 2019–2026: RSF rank in freefall (108→129,
inverted axis), AJI violence cases rising (43→91; 21 of 31 physical attacks
by police), and the state's own Dewan Pers index flat at "cukup bebas"
(69.44). Annotations: Tempo pig-head terror (unresolved), Aug 2025 TikTok
Live blackout. Atlas layer: Dewan Pers per-province index
(data.dewanpers.or.id) + Access Now shutdown incidents.
Data: RSF tables PDF / World Bank Data360 mirror, advokasi.aji.or.id
(scrapeable by URL params), data.dewanpers.or.id. Feasibility: EASY.

### 6. Garis Start Sama, Lomba Berbeda — Indonesia vs Vietnam *(Atlas)*
Small multiples since 2000: manufacturing %GDP (32%→17,4% vs Vietnam rising
~25%), FDI %GDP (~2% vs 4,2–4,8%), PISA math (366 vs 469 ≈ five school
years), average monthly wage (**Vietnamese workers now earn ~70% more**).
The wage panel is the gut-punch. Pre-build now; refresh Sept 8 2026 when
PISA 2025 lands. Data: World Bank API, OECD PISA, BPS/ILOSTAT — all free
CSV. Feasibility: TRIVIAL.

### 7. Dua Garis Kemiskinan *(Mesin)*
One population, two definitions: BPS 8,25% poor vs World Bank $8.30/day
68,3%. Render as the dither plate: the same dots, two thresholds, the
chart asks which Indonesia you mean. Companion: middle class 57,3 jt
(2019) → 46,7 jt (2025) while GDP prints a 13-year-best 5,61%.
Data: BPS press releases, World Bank MPO. Feasibility: TRIVIAL.

### 8. Indonesia Melawan Arus — deforestation *(Atlas)*
Tropics-wide primary forest loss −36% in 2025; Indonesia +14% (296.000 ha,
4th globally) — with the state-driven slice annotated (Merauke food estate
>22.272 ha in 18 months; karhutla Jan–Apr 2026 +1.779% YoY). The driver is
no longer palm oil companies; it is flagship state projects.
Data: GFW/UMD downloads, Nusantara Atlas, SiPongi
(sipongi.gakkum.kehutanan.go.id). Feasibility: EASY.

### 9. Musim Dingin Siapa? — startup winter *(Mesin)*
Two lines 2020–2026: VC funding US$9,4 B → US$0,3 B (−97%, eFishery
annotated at the cliff) vs cumulative digital-economy tax climbing to
Rp 52 T and GMV US$99 B. The winter killed the investors' economy, not the
digital economy. Data: DealStreetAsia summaries, DJP releases.
Feasibility: EASY.

### 10. Jarak Istana *(Atlas)*
Presidential travel from Setkab posts (WordPress JSON) → destinations,
km, trip count (51 in 19 months), est. cost with open methodology chip —
against the austerity Inpres. Routes fly on the atlas via the command bus.
Counter-number shown in the same frame: BKPM's claimed Rp 2.430 T
commitments vs realized investment (BKPM quarterly).
Feasibility: SCRAPE + NLP (fuzzy, label as estimasi terbuka).

## Tier 2 — daily counters (wire after Tier 1 anchors exist)

- **Kurs Pagi**: USD/IDR · emas Antam · BTC · IHSG, re-denominated in
  bungkus nasi / porsi MBG / hari UMP (the toggle is the fidget).
- **Sehari Bernapas**: city AQI → cigarettes equivalent (WAQI hourly).
- **Gempa semalam**: BMKG JSON → atlas markers.
- **Sembako vs UMP**: basket % of daily minimum wage (panel harga).
- **Hektar per Jam**: GFW alerts as living ticker.
- **PHK meter**: Kemnaker Satudata monthly (88.519 in 2025; 23.470
  Jan–Mei 2026) with the KSPI counter-count as Lane C.
- **Antrean BPJS**: deficit clock (~Rp 2 T/bulan, Menkes Mei 2026).
- **Atap Sekolah**: news-compiled roof-collapse ledger — no official
  tracker exists; the absence is the story.

## Sentiment / attention stack (all free, verified June 2026)

X/Twitter API: dead for zero budget (no free tier since Feb 2026). Instead:
1. **GDELT DOC 2.0** (`timelinetone`, `timelinevol`,
   `sourcecountry:indonesia`) — news tone over time, no key, back to 2017.
2. **YouTube Data API** comments on news channels (10k units/day free)
   classified with free IndoBERT sentiment models (HuggingFace, CPU-able;
   could run as Workers AI alternative).
3. **Google Trends** (manual CSV now; alpha API applied-for) — demand side.
4. Own RSS corpus (already collected hourly by the worker) for the
   **attention-gap chart**: Yang Dicari vs Yang Diberitakan vs Yang
   Diumumkan (Setkab topics).
Print under every sentiment chart: each source measures a different
population; show side-by-side, never blended.

## Standing caveats

- Most .go.id and NGO sites 403 datacenter IPs — fetch from the Worker
  cron, retest before building pipelines, treat dark sources as Data
  Hilang notes.
- Reconcile before charting: MBG 2026 budget (Rp 268 T vs 335 T headline),
  2025 MBG spend (71 T vs 85,27 T), TNI civilian-post counts (2.569
  Imparsial vs 4.472 PBHI — different methodologies).
- Danantara has published no financial reports as of May 2026 — that row
  stays empty with its chip until it doesn't. Ketiadaan itu juga dokumen.
