# Layout v3 — the one-stop portal

The restructure: three acts get clean mandates, the map becomes the
headline, and the front page stops trying to carry everything — it carries
the *edition*, and the archive carries the rest.

## Information architecture (the load-bearing decision)

The front page = today's edition: the map, the daily counter wall, and a
ROTATING selection of 3–4 perspective pieces chosen at press time. Every
piece also exists as its own permalink page (`/perspektif/[slug]`, Astro
content collections), with `/arsip` as the index. The paper picks daily;
the portal remembers everything. Without this split, twenty charts on one
page bury each other.

## ACT I — DINAS · "Angka Hari Ini" (pure data, zero editorializing)

1. Masthead + folio + ticker (as is).
2. **PETA KABAR — the map moves up, restyled per register.** Same MapLibre,
   new Dinas skin: khaki paper land, ink hairline coasts, service-orange
   markers (style JSON is ours — one constant swap). It becomes the front
   photo of the newspaper, carrying live layers with toggle chips:
   - GEMPA — BMKG 24h (bubble size = magnitude)
   - UDARA — WAQI city dots colored by AQI
   - HUTAN — GFW alert clusters
   - BENCANA — BNPB events
   - GUNUNG — MAGMA ESDM volcano alert levels (the volcano status board
     is itself a daily artifact: Indonesia has the most active volcanoes
     on earth)
   The atlas-plate version stays in Act III as the *historical* map.
3. Angka Edisi (scrubbable, as is).
4. **PASAR PAGI** — sparkline strip: USD/IDR · emas · BTC · IHSG · BBM ·
   cabai, with the re-denomination toggle (Rp → bungkus nasi → porsi MBG →
   hari UMP) that re-renders every number on the page.
5. **The counter wall** — bento grid of small cards, each a different
   micro-form: Sembako vs UMP (bullet gauge), Sehari Bernapas (cigarette
   pictogram), PHK meter (isotype row), BPJS deficit clock (countdown),
   Hektar per Jam (ticker), Antrean MA putusan (odometer).
6. Temuan Hari Ini (3 columns, as is) + Tebak Daerah moves here (the
   light game belongs in daylight).

## ACT II — MESIN · "Yang Perlu Dilihat" (the perspective-shifting pieces)

The dark act carries the day's *featured* structural pieces plus its
permanent fixtures. Rotation pool with assigned chart forms — the goal is
the full vocabulary of forms, each chosen because it argues the point:

| Piece | Form |
|---|---|
| Pabrik Undang-Undang | dot-strip / Gantt — each law a bar from draft to passage; UU Polri's 20-day bar next to Perampasan Aset's 10-year void |
| Gradien Harta (LHKPN) | scatter + reference line (the Gradien grammar) |
| MBG: kepemilikan dapur | treemap (Polri / TNI / yayasan terafiliasi / lainnya) |
| MBG: kecepatan vs keselamatan | dual line + annotated divergence |
| MBG: Rp 335 T vs Rp 14 T | proportional waffle — every square = Rp 1 T |
| Keracunan MBG | calendar heatmap (incidents per day) |
| Efisiensi vs Struktur Baru | diverging bars |
| Penggaris Tiga Negara (pers) | three-line timeline, inverted rank axis |
| Dua Garis Kemiskinan | the dither plate itself — same dots, two thresholds |
| Musim Dingin Siapa? | dual-axis lines, eFishery annotated |
| Jejaring (DPR bisnis → sektor → program) | Sankey / constellation network |
| Energy: JETP vs captive coal | stream graph (the "waves") of capacity additions |
| Karhutla | ridgeline waves — burned area by province by month |
| Gaji per Detik | two live counters, Layar Ganda pattern |
| Yang Tidak Dihitung + Benar atau Salah | stay (fixtures) |

## ACT III — ATLAS LAMA · "Ingatan" (history, world, the long view)

1. **Peta Atlas** stays as the engraved historical plate (Janji markers,
   Jarak Istana routes, doctor-ratio choropleth, Dewan Pers per-province).
2. **HARI INI DALAM SEJARAH** — no scraper needed: the official Wikimedia
   Feed API serves it as JSON, free, daily:
   `api.wikimedia.org/feed/v1/wikipedia/id/onthisday/all/{MM}/{DD}`
   plus `/featured/{YYYY}/{MM}/{DD}` for featured article + picture of the
   day. The worker cron caches it at press time. Render as a timeline rail
   in Instrument Serif — Fig.-numbered, like plates in an old atlas.
3. **ALAM HARI INI** — Wikipedia POTD when it's Indonesian nature, else a
   rotating species plate (GBIF/iNaturalist APIs, free) — engraving-style
   frame, "Fig. 3".
4. **NUSANTARA PROFIL** — rotating indigenous people/region profile,
   curated list + Wikipedia REST extracts (one per edition).
5. **TETANGGA & DUNIA** — the comparative corner, bump charts and slope
   charts: Indonesia vs Vietnam four-panel; passport rank (Henley);
   complexity rank; happiness rank; plus the niche leaderboards below.
6. Janji ledger (stays — it IS the long memory).
7. **The painting footer** — 38 provinces deliberating, layered parallax
   cutouts overflowing up into the page (see IMAGE PROMPTS below).

### World/niche metrics shortlist (all free, OWID/World Bank/CC datasets)

- **GitHub Innovation Graph** (github.com/github/innovationgraph, CC) —
  git pushes & developer counts per country per quarter: "Komit Nusantara"
  bump chart; Indonesia is one of the fastest-growing dev populations.
- World Happiness Report — rank + score trend.
- ITU/OWID — internet users %, mobile subscriptions per 100 (Indonesia >1
  SIM per person), social-media hours (top-5 globally — heatmap by hour).
- SDG Tracker (OWID) — Indonesia's 17-goal scoreboard as a radial chart.
- Speedtest Global Index — mobile speed rank in ASEAN (7 of 9).
- The proud-weird ones, perfect for "interesting portal" energy:
  instant-noodle servings (#2 worldwide, WINA data — donut, obviously),
  geothermal potential used vs unused (~40% of world potential, mostly
  idle — empty/filled bar), 700+ living languages (2nd most linguistically
  diverse — treemap by language family), volcano count + eruption history
  (Smithsonian GVP data), nickel = 62% of world output (marimekko of
  global supply), V-Dem democracy index trend.

## Pipeline note (the "scraper agent")

No live scraper agent needed for Act III — Wikimedia/GBIF are clean APIs.
The pattern for everything else stays: worker cron (hourly) for fast feeds
→ KV blobs; newsroom GitHub Action (per edition) for slow/PDF-ish sources
→ committed JSON artifacts. Sentiment stack: parked per decision.

---

## IMAGE PROMPTS — the painting footer (nano banana)

Three generations, three layers. Two practical notes first:

1. **Use MAGENTA (#FF00FF) chroma, not green** — the painting is full of
   foliage and green textiles; green-screen tools would eat the picture.
   Every free background remover handles magenta identically, and AI
   matting tools (remove.bg, Photopea's magic cut) don't need chroma at
   all — magenta is the safety net, not the method.
2. **Generate the backdrop FIRST, then attach it as a reference image**
   for layers 2 and 3 ("match this painting's exact style and lighting")
   — nano banana is good at style-matching an attached image, and that's
   what keeps the three layers feeling like one canvas. 38 *accurate*
   baju adat in one shot exceeds current model fidelity — let layers 2+3
   total ~28 figures, accept representative diversity, and name the most
   recognizable attires explicitly so the iconic ones anchor the scene.

**Shared style block (paste into all three prompts):**
> A classical 19th-century romanticist oil painting in the manner of Raden
> Saleh and the Hudson River School: rich warm chiaroscuro, golden
> late-afternoon light from the upper left, visible impasto brushwork,
> aged varnish glow, muted earth palette of deep greens, warm ochres and
> umber shadows. Museum-quality, epic, serene.

**Layer 1 — backdrop (no chroma; it sits behind everything):**
> [style block] A wide panoramic Papuan highland landscape: the Sudirman
> Range with mist in the valleys and a faint streak of snow on Puncak
> Jaya, dense rainforest slopes, a winding river catching golden light, a
> pair of birds-of-paradise in a distant flowering tree, towering warm
> cumulus clouds. No people anywhere in this painting. Keep the lower
> third of the composition calm and simple — open grassland in soft light
> — because figures will be placed there later. Aspect ratio 21:9.

**Layer 2 — midground crowd (magenta cutout):**
> [style block] Using the attached painting as the exact style and
> lighting reference: a relaxed outdoor gathering of about twenty
> Indonesian men and women of all ages in formal traditional attire (baju
> adat) from across the archipelago — Batak ulos shoulder cloth, Javanese
> beskap with batik, Balinese payas agung, Bugis baju bodo, Minang
> tengkuluk tanduk headdress, Dayak beaded vest with hornbill feathers,
> Maluku and Papuan ceremonial dress, Betawi sadariah — standing and
> seated in small conversing groups, sharing food and drink from woven
> baskets, gesturing warmly in deliberation, full bodies visible, middle
> distance. CRITICAL: paint the subjects isolated on a completely flat,
> solid magenta background (#FF00FF) — no scenery, no ground shadows on
> the background, crisp clean edges around every figure and object, even
> lighting consistent with warm late-afternoon sun from the upper left.

**Layer 3 — foreground overflow (magenta cutout):**
> [style block] Using the attached painting as the exact style and
> lighting reference: six life-size Indonesian figures in traditional
> attire seen from the knees up — an elder in Javanese dress mid-story
> with raised hand, a young Papuan woman in ceremonial dress laughing, a
> Minang woman in tengkuluk pouring tea, a Dayak man leaning on a carved
> staff, two children in Balinese temple dress sharing rambutan — plus,
> entering from the top right corner, one overhanging tropical tree
> branch with dense painted leaves, and tall wild grass with a few
> heliconia flowers entering from the bottom edge. These elements will
> overlap the edge of a page, so give every silhouette a clean, complete
> outline. CRITICAL: completely flat solid magenta background (#FF00FF),
> no cast shadows on the background, crisp edges, same warm light from
> the upper left.

**Build plan for the reveal** (when images are ready): pin the backdrop
with a torn-paper top mask; midground scrubs at 0.6× scroll speed,
foreground at 1.15× and overflows above the section edge so the branch
and figures break into the colophon as the reader arrives — the surprise
is the foreground crossing the fold.
