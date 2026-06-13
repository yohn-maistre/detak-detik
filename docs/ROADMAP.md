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
