# Detak Detik — the consolidated roadmap

One narrative, one tracker. Updated June 13, 2026. This supersedes the
scattered plans in PERSPEKTIF / LAYOUT_V3 / DATA_SOURCES (those stay as
reference); this file is the single source of truth for what's done, what's
next, and the through-line that ties it together.

## The through-line (why it all hangs together)

Detak Detik is **the daily case file on the Indonesian state** — executive,
legislative, judicial, regional — audited against its own promises and its
own documents. The reader follows one grammar end to end:

> **[LABEL] → [DATA VIZ] → [KUITANSI]**

- **Act I · PAGI (Dinas):** what *is*. Macro, neutral, no jabs — the map,
  the markets, the national indices. Numbered paragraphs (§1, §2, §3).
- **Act II · MALAM (Mesin):** what's *wrong*. Every wrongdoing rendered as
  a sharp, formal, perspective-shifting chart. Numbered exhibits (BUKTI №).
  This is the centerpiece. The justice gradient is the template; everything
  here earns its place by making a reader go "oh."
- **Act III · ARSIP (Atlas):** what *remains*. History, peoples, nature,
  the long memory, the games, and the finale painting (Danau Tigi, 38
  provinces). Appendices (LAMPIRAN A/B/C).

Tone law: **the satire lives in the data juxtaposition, never the wording.**
Formal Indonesian throughout. Every number carries its receipt; CONTOH vs
LANGSUNG status is always printed, never hidden.

National-first, regional-on-demand: the default edition is nationwide and
about this regime. Papua (and any region) appears woven through everything,
and surfaces in depth when a reader — or Aksara — asks for it. No reader is
geolocated; the masthead coordinate is the edition dateline, not the user.

## DONE (shipped to main)

- Three-act chassis, scoped registers, pinned split-flap seams w/ title cards
- Act I: living map (Peta Kabar, BMKG quakes live, atlas/satelit/cuaca),
  Pasar Pagi macro+resource ticker w/ good-bad colour, Harga Pangan 7-staple
  chart w/ normal band, Indeks Pagi, three-zone clock
- Act II: Angka Edisi + nasi-bungkus lever (scoped to the loss), Yang Tidak
  Dihitung (national absent rows), Temuan, Gradien Keadilan, Struk, Papan
  Angka counter wall, Obituari Hutan, Layar Ganda, Arsip teaser
- Act III: Ingatan hero (Wikipedia on-this-day live + curated deck), Dunia
  Memandang world-rank tiles, Tebak Daerah / Benar Salah / Sensus Diri games
- Archive: /perspektif/[slug] (Dua Garis, Garis Start, Pabrik UU), /arsip,
  /sumber (receipts drawer)
- Aksara terminal (dark), tanya verb wired to worker; command catalog +
  fly_to/scroll_to/say/set_layer/set_basemap/denominate
- Cloudflare Pages + Worker CI; Turnstile + Workers AI fallback scaffolded
- Fidgets: stempel, ink-blot (fixed), masthead ripple, struk tear, tarik fajar

## NEXT — Act II grievance arsenal (the centerpiece build)

Verified data ready (see research notes below). Build as /perspektif pages
+ rotating front-page exhibits. Priority order:

1. **90 menit** — the football-match anchor. In 90 min Indonesia loses
   ≈ Rp 57 miliar to corruption and recovers ≈ Rp 2,7 miliar (ICW 2024:
   Rp 330,9 T lost, 4,84% recovered). Replaces the World Cup score. Form:
   a 90-min clock that fills with loss, a thin sliver recovered. [VERIFIED]
2. **Gradien Harta (LHKPN)** — declared wealth vs legitimate career earnings;
   elhkpn.kpk.go.id searchable. Anchor: richest minister Rp 5,44 T = 2,6× the
   president. Form: scatter + reference line. [VERIFIED searchable]
3. **Pabrik Undang-Undang v2** — days draft→gazette; UU Polri 20 days vs RUU
   Perampasan Aset ~17 yr. (shipped v1; deepen) [VERIFIED]
4. **MBG: anggaran naik, anak turun** — Rp 268 T budget vs 33.000+ poisoned;
   BGN arrests Jun 3 2026. Form: slope + calendar-heatmap of incidents.
5. **Siding-with-oligarchs gradient** — UMKM tax burden ↑ vs migas/minerba
   royalty relief ↓ (PENDING oligarch research agent). Form: diverging lines.
6. **APBD: pegawai vs pembangunan** — Permendagri caps (≤30% pegawai, ≥40%
   modal); name regions that breach. data.go.id machine-readable. [VERIFIED]
7. **Kemiskinan antarprovinsi** — Papua Pegunungan 30,03% vs Bali 3,72% (8×).
   Form: ranked diverging bar / choropleth on the map. [VERIFIED]
8. **BPJS klaim creep** — 104,7→111,9% across 2023-26, crossing break-even.
   Form: bump/line. [VERIFIED]
9. **DPR tunjangan vs upah** — Rp 50 jt housing allowance = 16× avg wage.
   Form: waffle. [VERIFIED]
10. **Kabinet gemuk** — 109 officials, +Rp 389 bn/yr vs Jokowi. Form: bars
    across regimes. [VERIFIED]

Per-branch tracker pages (executive / legislatif / yudikatif / daerah) that
collect the relevant exhibits + a "janji vs realisasi" ledger each.

## NEXT — new viz templates (the "beautiful like that" ask)

Inspiration: topdown.ai pixel-heatmaps & ridgelines, sumi-nagashi ink.

- **PIKSEL HARIAN** — "setiap hari sejak …, satu piksel." A heatmap where
  each day is one pixel, years labelled down the side, colour = value.
  Insanely reusable: daily deforestation, daily AQI, daily rupiah, daily
  corruption-cases. Build ONE `<PetaPiksel>` component, feed any daily
  series. This is the highest-leverage new component.
- **RIDGELINE / JOYPLOT** — glowing stacked ridges. Karhutla by province by
  month; or sentence-length distribution by loss-bracket. Dark-act native.
- **STREAM GRAPH** — JETP renewables vs captive-coal capacity over time.
- **SANKEY** — DPR business affiliations → sectors → flagship programs; or
  campaign donors → policy beneficiaries.
- **INK FLUID (collaborative)** — see below.

## NEXT — collaborative / return-loop mechanics

- **Tugu Rakyat (r/place-style canvas)** — a shared low-res civic canvas;
  one cell per visitor per N minutes, no account, colours limited to the
  paper palette. Cooldown stored in a cookie/localStorage; the shared state
  in a Durable Object or KV (free tier). The communal artifact people return
  to — and a living "this is us" beside the painting finale. Moderation:
  fixed palette + slow cadence + a profanity-safe grid (no free text). MUST
  weigh abuse vector before shipping; start read-only mock, then DO-backed.
- **Kolam Tinta (sumi-nagashi)** — three.js stable-fluids ink pool as a calm
  meditative fidget in Act III; optionally seeded by the edition. Pure local,
  no backend. Lower priority than Tugu Rakyat but gorgeous.

## NEXT — Act I & III glow-up (they read thin vs Act II)

Act II earns its richness from hierarchy + annotation + the engraved dither.
Bring that energy up/down-stream:

- **Act I:** a real lead story / headline treatment above the map (display
  type, a one-line dek, the day's single most important number framed like
  a front page), not just the masthead → map jump. Tighten Pasar/Indeks
  spacing (done partly). Consider a thin "national mood" strip.
- **Act III:** the engraved plate retired into Ingatan — good — but the act
  still needs visual variety. Add the species/portrait imagery (Wikipedia
  media-list w/ painting fallback), a Hari Ini timeline rail, and the
  ridgeline/almanac plates so it's not all framed cards. The painting
  finale will anchor it.

## OUTSTANDING (smaller, tracked so we stop forgetting)

- Kartu Wilayah: click a province on the map → dossier slides under the
  plate (pop., UMP, doctor ratio, APBD ratio, IPM). Province GeoJSON baked.
- Map layers: GUNUNG (MAGMA ESDM), BENCANA (BNPB), HUTAN (GFW), UDARA (WAQI)
- News pins on the map that fade over 7 days (geocoded RSS)
- Kuitansi popover: every ⊙ chip opens source + URL + retrieval + formula
- Hari Ini dalam Sejarah rail (Wikimedia feed) — partially in Ingatan
- Worker data pipes: replace CONTOH rows (BPS, panel harga, MA, ICW)
- Opt-in "daerah pantauan" (local-only) region personalization
- Painting finale: layered parallax cutouts (awaiting images, magenta chroma)
- Aksara new verbs: highlight (rough-notation), chart_focus, compare, denominate
- /sumber kept in sync as pipes land

## DATA STATUS

LANGSUNG: BMKG quakes, USD/IDR, rain radar, map tiles, Wikipedia on-this-day.
CONTOH: all macro prints, counters, perspective pieces (real published
figures, transcribed, formulas printed). SEGERA: MA rulings, panel harga,
ICW datasets, LHKPN scrape, Aksara NIM lane (two GitHub secrets away).

## RESEARCH ON FILE (for the data desk)

- Regime grievance map + per-branch failures + 90-min anchor: see chat
  research June 13 (top-10 complaints, ICW recovery 4,84%, MBG, Danantara,
  cabinet, BPJS creep, APBD ratios, poverty spread, dynasty seats).
- Oligarchy angle (UMKM tax vs migas royalty, land concentration, 50-richest,
  Danantara, cronies): PENDING agent — fold in when it lands.

---

# STRUCTURE v4 — the agreed narrative (June 13, decisions locked)

Spine: **a day in the life of a republic.** Three acts; the satire lives
ONLY in Act II's data juxtapositions; Acts I and III speak plainly.
Decisions: Act II uses BOTH a thematic-chapter narrative AND a branch-of-
power scoreboard. Perspective pieces: latest inline + archive strip.
Regional relevance: national default + opt-in Lensa Daerah. Act III is
renamed (proposal: NUSANTARA) and turned UPLIFTING/EDUCATIONAL — world
stats on top, culture/nature/history below. Games + Tugu Rakyat move to a
separate room near the footer, divided by a rule. Citations become links.
Aksara stays pinned; its tours must be rewritten for the new layout.

## ACT I — PAGI · "Keadaan hari ini" (national, neutral)
Masthead + KILAS wire · §1 Peta Kabar (national dashboard, layers, Aksara-
driven; remove regional fly-tos, restore compass) · §2 Pasar Pagi · §3
Indeks Pagi · §4 Harga Pangan. One scroll = where the republic stands today.

## ACT II — MALAM · "Yang tak ingin dilihat" (the investigation)
TWO interlocking structures:

A) THEMATIC BABS (narrative deep-dives; findings folded in, no standalone
   "Temuan"):
   - Angka Edisi — the day's most damning number (kerugian + nasi lever)
   - Bab · Kuasa & Harta — Republik Oligarki (inline) · Danantara (AUM,
     no-report counter, the 2026 export "gate") · BUMN projects & losses ·
     50-richest · APBN where-the-money-goes
   - Bab · Wakil — DPR/DPD: bills sprint-vs-stall, allowances, attendance,
     dynasty seats
   - Bab · Hukum & Vonis — Gradien Keadilan · 90-menit corruption clock ·
     KPK recovery rate · LHKPN gradient
   - Bab · Aparat — Polri/TNI: officers in civilian posts, budget,
     impunity (how cases get dropped), notable unpunished cases
   - Bab · Daerah & Otsus — APBD pegawai-vs-pembangunan · Dana Otsus Aceh &
     Papua (allocation vs outcome) · the Lensa Daerah lives here
   - Bab · Yang Tidak Dihitung — NATIONAL absences (cross-cutting)
   - Bab · Janji — promises tracker, MOVED here from the atlas
   - Arsip Perspektif — latest piece full inline + compact archive strip

B) PEMANTAU CABANG KEKUASAAN (the scoreboard): a compact reference grid —
   EKSEKUTIF / LEGISLATIF / YUDIKATIF / APARAT / DAERAH — each card a
   one-line explainer of what the branch IS (incl. bodies like Badan
   Pengarah Papua) + 2–3 live metrics + link to its tracker. Themes are the
   deep-dives; this is the at-a-glance version.

## ACT III — NUSANTARA · plain, uplifting, educational (rename pending)
Reordered: world stats TOP, culture/nature BOTTOM.
   - Dunia Memandang — how Indonesia is doing now (ranks, SDG, happiness,
     biodiversity) — a mix of proud and sobering, plainly stated
   - Ingatan — today in history (Wikimedia feed)
   - Rupa Nusantara — a daily PUBLIC-DOMAIN colonial-era painting + a
     Wikipedia-sourced sentence of context
   - Hayati — rotating endemic flora & fauna (GBIF/IUCN, license-clean image)
   - Manusia — rotating indigenous-peoples profile (with provenance)
   - Almanak — scientific wonders/facts
No accountability here. Uplifting close.

## RUANG MAIN — separate, near the footer, divided by a rule
Tebak Daerah · Benar Salah · Sensus Diri · **Tugu Rakyat (r/place clone)**.
Visibly separate from Act III ("this is play, not record").

## FINALE — the painting (Danau Tigi, 38 provinces) — awaiting images.

## CROSS-CUTTING (carry from v3 plan)
- Transitions: drop the fullscreen pin → short non-pinned ribbon flip,
  contiguous flaps, bottom flap matches next act (no bleed), tiny kicker
- Aksara terminal text: dark-on-dark bug — set terminal colours explicitly
- Aksara pill stays pinned; add page bottom padding so it never covers content
- Aksara TOURS: rewrite for the new layout (map is at top now) + national framing
- Citations: every ⊙ chip becomes a link (to /sumber row or external source)
- Map: restore compass, remove Papua fly-to buttons, Aksara/region drive fly-to
- Tarik fajar: remove the touch-drag (fights browser refresh) → button/easter-egg
- Harga Pangan: fix right gap + bottom spacing
- Loader: once-per-session, instant on internal nav

## RESEARCH IN FLIGHT (June 13)
- Agent A — accountability open data per branch (APBN, ministries, Danantara
  + export gate, BUMN, Polri/TNI impunity, Otsus Aceh/Papua, APBD, courts)
- Agent B — cultural/educational open data (PD colonial paintings + license,
  GBIF/IUCN species, indigenous peoples, science facts, world stats, history)

---

# DATA SOURCES VERIFIED, ACT III (cultural/educational, agent B)

License-clean, mostly keyless. Build the closing act on these:
1. Wikimedia Commons (daily lukisan): commons.wikimedia.org/w/api.php, no key;
   generator=categorymembers + iiprop=extmetadata returns image + Artist +
   Description + Year + License in one call. Filter to PD/CC0/CC-BY. Seed cats
   (smoke-test exact titles): Mooi Indie, Raden Saleh, Paintings of the Dutch
   East Indies. Deterministic rotation by day-of-year mod count.
2. GBIF (endemic species plate): api.gbif.org/v1/occurrence/search?country=ID
   &mediaType=StillImage&license=CC0_1_0|CC_BY_4_0, no key; re-check per-record
   license field. Vernacular via /species/{key}/vernacularNames?language=ind.
3. Wikipedia REST summary (blurbs): {lang}.wikipedia.org/api/rest_v1/page/
   summary/{title}, id+en, no key.
4. World Bank WDI (how Indonesia is doing): api.worldbank.org/v2/country/idn/
   indicator/{CODE}?format=json, no key. Mix proud + sobering.
5. Smithsonian GVP WFS (volcano wonder): webservices.volcano.si.edu/geoserver/
   GVP-VOTW/wfs, no key, GeoJSON. 101 Holocene volcanoes.
6. iNaturalist (premium photos): api.inaturalist.org/v1/observations?place_id=
   {ID}&photo_license=cc0,cc-by, no key.
7. IUCN Red List v4 (status line): api.iucnredlist.org/api/v4, free token.
8. On-this-day: id support NOT confirmed. CHECK id.wikipedia.org/api/rest_v1/
   feed/onthisday/events/MM/DD; fall back to en feed filtered for Indonesia.
   NOTE: shipped Ingatan uses id feed, so it is probably on its curated
   fallback now; fix in the Act III rebuild.
Indigenous peoples: no clean API (curation). BPS Sensus 2010 = 1,331 groups;
rotating list from id.wikipedia "Suku bangsa di Indonesia"; image from a
Commons CC file of dress/architecture (never an identifiable person).
Wonder facts (citable): 2nd-most biodiverse nation; Coral Triangle 76% of
coral species; 718 living languages (2nd after PNG); Wallace Line; Ring of
Fire. Sobering: World Happiness rank ~87 and falling; V-Dem decline.

---

# DATA SOURCES VERIFIED, ACT II (accountability, agent A)

Top buildable branch trackers (ranked feasibility x impact):
1. APBN spend-by-function/ministry: data-apbn.kemenkeu.go.id + APBN KiTa
   (monthly PDF). EASY. Chart: stacked-area "where every rupiah goes" + pct of
   target. Per-K/L ceilings public (Kemhan Rp187,1T; Polri Rp145,7T; OIKN Rp6,26T).
2. Provincial scoreboard (cleanest API in the audit): BPS WebAPI
   webapi.bps.go.id (JSON, free token) for IPM/poverty/Gini + DJPK Portal APBD
   djpk.kemenkeu.go.id/portal/data/apbd (545 pemda). TRIVIAL. Chart: scatter of
   38 provinces, x=APBD/capita, y=poverty, bubble=belanja-pegawai ratio.
3. MK case tracker (rare ready-made judicial dataset): data.go.id MK PUU
   dataset + mkri.id recap. EASY. 2025 = record 701 cases; PUU 263 decided
   (33 granted). Chart: constitutional-review scoreboard.
4. Polri/TNI budget vs police-violence (the Aparat ask): APBN K/L line +
   KontraS annual (kontras.org/laporan). KontraS Jul24-Jun25 = 602 police-
   violence incidents, 411 shootings, 38 torture (10 dead). Imparsial: 2.569
   active officers in civilian posts (2023). Chart: incidents vs how many
   reached criminal court vs ethics-only = the impunity gap. Flagship case:
   Affan Kurniawan (Brimob rantis, 28 Aug 2025) -> officers PTDH/demosi via
   ethics while civilian protesters were criminally prosecuted.
5. BPK/BUMN red-flag: BPK IHPS (semiannual PDF) + IDX filings. IHPS I-2025 =
   Rp69,21T findings, Rp63,57T in BUMN/bodies; Pupuk Indonesia Rp12,59T. ~65
   BUMN (list on data.go.id). Chart: bubble, ROE vs BPK-flag value.
6. KPK "13% problem": state loss adjudicated vs uang pengganti recovered. KPK
   2024 recovery Rp731,55B; ICW est only ~13% of losses recovered 2019-2023.
   SCRAPE. The single most damning anti-corruption metric.

Killer flagship (very high impact, hand-joined): OTSUS "Rp138T, lalu apa?" —
Papua Otsus cumulative Rp138,65T (2002-2021), Jilid II ~Rp234T to 2041, vs
Papua provinces' poverty/IPM (BPS). Flat outcomes against rising spend. 2026
Otsus ~Rp13-14T (Papua ~Rp8,4-9,4T, Aceh ~Rp3,7-4,2T). Aceh share steps down
2%->1%, special allocation widely cited ending ~2027/28 [CHECK].

Danantara export gate [VERIFIED]: PT Danantara Sumberdaya Indonesia (DSI)
became sole "satu pintu" exporter of coal, CPO, ferroalloys from 1 Jun 2026
(announced 20 May 2026), justified by ~US$908B cumulative under-invoicing
1991-2024 and ~US$20B lost on coal. Critics call DSI a "calo ekspor" taking
margins; COO says service fees only. Plan: sole BUYER by 2027. Financials
HARD/DEAD (statutorily opaque) -> track the CONTROVERSY, not the books.
Transparency gaps to surface as gaps: Danantara books, BPP/BP3OKP budget (no
separable pagu found), DPR attendance (scanned PDFs only).

Caveat: most .go.id portals 403'd the sandbox; confirm JSON endpoints from an
unblocked env. Reconcile RAPBN vs enacted UU APBN figures before display.
Start fast with BPS WebAPI + data.go.id MK dataset (lowest risk).
