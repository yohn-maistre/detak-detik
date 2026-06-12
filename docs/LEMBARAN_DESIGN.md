# LEMBARAN_DESIGN.md — Lembaran

> The look. The single input that most determines whether Claude Code produces
> something mindblowing or merely competent. The aesthetic is a state gazette brought
> alive by a world-class art director: neo-renaissance editorial, Indonesian-official,
> Daily-Prophet energy where the photographs move. Slate-white and pastel-coffee and
> cream, heavy on typography, alive with restrained motion. Read alongside
> `COMMAND_CATALOG.md` (what motion choreographs) and `DATA_CONTRACTS.md` (what fills
> the sections).

---

## 0. The thesis

Everyone can ship motion now, so almost nobody ships a point of view. The
differentiation is the point of view: a paper that looks unmistakably from here. The
aesthetic argument and the credibility argument are the same argument. Official-
document furniture is the ornament system, and it doubles as a trust signal.

Restraint reads as expensive. Decisive, never bouncy.

---

## 1. Tokens

### Color (OKLCH, with `light-dark()`)

- **Paper:** warm slate-white / cream field. The default light surface.
- **Ink:** near-black, the text and hairlines.
- **Merah-saga:** one ceremonial accent, a deep official-seal red (not an alarm red).
  Used sparingly: the lead rule, verified-data stamps, the Angka Edisi accent.
- **Kopi:** pastel-coffee mid-tones for secondary surfaces and the quiet map base.
- **Dark mode** inverts to ink-field with paper text, for the map-heavy modes.

No glassmorphism by default. `backdrop-filter` is GPU-expensive on low-end Android;
demote blur to an enhancement layer behind a capability check. Paper-and-ink does not
need blur to look expensive.

### Type

- **Display:** Fraunces (variable). Big, tight, confident. Carries the headlines, the
  Angka Edisi, the section nameplates. Animate weight/optical-size via the variable
  axes in CSS.
- **UI / body:** a quiet grotesk. Calm, legible, gets out of the way.
- **Numbers: tabular lining figures, always.** This site is made of numbers; they
  must align like ledger entries. Non-negotiable.
- **Mono:** for the ASCII comic, the agent terminal, and nomor-surat IDs.

### Spacing and rule

Generous margins. Hairline rules between sections, drawn (not static) on reveal. Drop
caps on the Tajuk and long reads. Agate type for the corner furniture.

---

## 2. The four surfaces

1. **Peta (base layer).** Full-viewport MapLibre + deck.gl, always present, never the
   boss. The stage. Idle state has a slow ambient drift (the "breathing"). Boots into
   one curated view (the edition), never a blank GIS everything-machine. One primary
   layer at a time plus the quiet base; deeper layers are progressive disclosure behind
   a layers drawer.
2. **Masthead (top).** Gazette nameplate left (serif logotype, "Edisi #41", date,
   "dicetak 05.00 WIB", newspaper-folio style). Section tabs center (rubrik, not app
   nav). Tanya bar right (understated, secretly the most powerful object on the page).
3. **The Sheet (workhorse).** One component, two postures. On phones: a bottom sheet
   with three snap heights (peek / half / full) hosting whatever is in context (feed,
   dossier, case panel, struk, game). On desktop: docks as a ~420px right pane with a
   slim left feed rail. Phones are the primary citizen; desktop is the adaptation.
4. **Aksara (bottom-left pill).** Collapsed: a small terminal pill with a blinking
   cursor that occasionally surfaces a one-line provocation tied to context. Tapped:
   expands into the terminal. Shares a brain with the Tanya bar.

---

## 3. The five modes (each a URL)

- **Jelajah** (default): map + feed, doomscroll-friendly.
- **Baca:** sheet at full height, long-form reading (dossiers, briefings, argument
  maps), map dimmed to wallpaper.
- **Tanya:** the Perplexity moment. Invoking search dims and slow-blurs the map, the
  answer streams in a centered serif column with inline citation chips, artifacts
  materialize in the sheet as the agent emits commands, next-hop chips follow. Every
  answer gets a permalink.
- **Tur:** cinematic takeover. Chrome retreats, narration captions in the lower third
  like subtitles, progress dots, skippable, ends on a share-card.
- **Main:** a minigame panel takes the sheet at full height.

### First visit

Masthead types in (one beat, SplitText, restrained). Map settles showing today's
changes. Angka Edisi ticks up (odometer). Aksara whispers one opening-tour offer. No
modal, no cookie-banner energy. The site just starts being interesting.

---

## 4. The section system (newspaper rubrik)

Fixed chrome, fixed section map, daily content. Familiarity builds the habit; novelty
rewards it. Each section declares its rhythm in its footer
(`Data diperbarui: ...`).

- **Halaman Depan:** the map as lead photo (shows what changed), the Angka Edisi (one
  enormous Fraunces number, odometer tick, merah-saga accent), the lead headline.
- **Tajuk:** the daily editorial (Pagi Indonesia). Drop cap. Cited.
- **Hukum:** the Justice Gradient scatter, case panels (verbatim ruling excerpt only),
  the Garis Vonis game.
- **Ekonomi:** the Struk Belanja Negara (thermal-receipt render, IG-story export), the
  transfer-daerah Sankey (the animated centerpiece), the harga wave.
- **Lingkungan:** Obituari Hutan, alerts as embers, before/after tiles, concession
  overlay as side-by-side documents.
- **Janji:** the promise ledger. Filed target next to measured outcome, graded, both
  cited.
- **Data Hilang:** the availability beat. Absence as story.
- **Opini:** argument maps (primary documents only).
- **Arsip:** the daily public-domain artwork / colonial-archive photo, geo-tagged,
  captioned with where it physically sits today. The Peta Lama opacity slider bleeds
  1900 through the modern map.
- **Cermin:** the mirror toys (Sensus Diri, your-life-in-data, personal tax receipt).
  Enter a number, see yourself, share the card.
- **Permainan:** Tebak Daerah (the civic Wordle, shareable green-grey grid), Kuis
  Harian, the ASCII comic.
- **Surat Pembaca:** the ETNOS federation layer (letters as federated threads). v1
  ships stable ids and clean JSON per temuan so this is a later weekend, not a rewrite.
- **Agate furniture:** corner boxes (cuaca, kurs, sembako, kata daerah).
- **Arsip edisi + Ralat:** back issues (every edition in the repo) and a transparent
  corrections log.

---

## 5. Signature motions (this is where it earns "mindblowing")

Choropleths are the beige of civic tech. Ban the static fill as a default. Each lens
gets ONE signature motion, and the rule is: **motion where the data itself moves,
stillness everywhere else.**

- **Hukum:** new putusan fall onto the scatter daily like sediment; the day's
  additions glow, then settle.
- **Ekonomi:** harga propagates across the map as a visible wave; the Sankey ribbons
  thicken on hover.
- **Lingkungan:** alerts bloom and fade like embers.
- **Janji:** a grade stamps in (the seal motif), kept in merah-saga or struck through.
- **Front page:** the Angka Edisi odometer tick is the lead motion. A broadsheet leads
  with a headline; ours are numerical.

Motion register: ink-spread underlines on hover, hairlines that draw themselves in,
GSAP Flip for card-to-detail expansions and lens switches, a slow parallax breath on
the map. SplitText reveals on headlines. View Transitions (Astro-native) for page and
lens morphs.

### The division of motion labor

- **Native CSS scroll-driven animation** (`animation-timeline: scroll()`/`view()`)
  for ambient reveals and scroll-linked motion. It runs on the compositor thread, so
  it stays smooth on a Galaxy A12 where JS scroll handlers would chug.
- **GSAP** (full free plugin suite: ScrollTrigger, SplitText, Flip, MorphSVG) reserved
  for orchestrated work: tour choreography, the signature motions, headline reveals.
- One motion engine for the orchestrated layer, one easing vocabulary, consistent
  feel.

### Hard motion rules

- Animate transforms and opacity only. Never animate layout properties.
- Honor `prefers-reduced-motion`: replace motion with instant state changes.
- Test on a budget Android before shipping any motion to everyone.

---

## 6. Share-cards (the screenshot is the product)

Every view that matters generates a share-card: a canvas-rendered PNG sized for IG
story and WhatsApp. One template system all features consume (the shared share-card
generator from `PRD-00`). Proper OG-image generation on every permalink so links
unfurl beautifully in WhatsApp, because Indonesian virality is WhatsApp virality.

Card families:
- **The personal number** (Cermin, Antrean Haji, Utang): the reader's own number as
  the headline. The strongest pattern in the space; design it to feel like a verdict.
- **The struk:** thermal-receipt aesthetic, perforated edge, the roast line at the
  bottom like a fortune.
- **The Wordle grid:** green-grey squares for Tebak Daerah. The whole viral mechanic.
- **The temuan:** masthead + headline + the signature viz + a citation footer.
- **The obituary:** the forest death notice, grim and beautiful.

Every card carries the masthead and a permalink, so the screenshot always points home.

---

## 7. The official-document ornament kit

The furniture that sells the gazette fiction and buys credibility at the same time:
perforation edges on the struk, stamp and seal motifs on verified data, nomor-surat
IDs on every temuan, faint guilloche or batik-derived line patterns where a
renaissance site would put engravings, provenance chips styled as little cap stempel.
Drop caps, hairline rules, agate corners. Build a small reusable kit; do not hand-art
each instance.
