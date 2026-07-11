# AMD-DESIGN.md — append to LEMBARAN_DESIGN.md

---

## 8. The triple-register system: Dinas, Mesin, and Atlas

Three registers. One paper. Each has a specific job and they coexist on the
same page, not as competing themes but as different voices within one
publication. The masthead is always Dinas. Everything else is context-driven.

**Dinas (the working daily skin):**
Used for: front page, news sections (Hukum, Anggaran, Hutan, Sorot Ganda),
temuan cards, the ticker, the terminal, badges, all "this happened today"
content. Character: specification document, field dossier, operational
order. Khaki-sand field, service-orange accent, heavy Archivo, mono metadata
everywhere, registration-mark corner furniture. Urgent, utilitarian, zero
nostalgia. The paper's default face.

**Mesin (the dark gravitas mode):**
Used for: the map in dark mode, the Selama 90 Menit card, the Justice
Gradient in its full weight, lead temuan where the numbers are enormous,
the Yang Tidak Dihitung silence table, any content that should feel like
a machine that never stops printing. Character: black field, huge light
serif (Fraunces 340), near-ink white paper, one pale gold accent, the
dithered-archipelago ornament built row by row. Slow, weighty, inevitable.
The paper's 3am voice. Mesin is the natural dark mode of the whole system:
when a reader switches to dark on their phone, they get Mesin, not an
inverted Dinas.

**Atlas Lama (the archive and long-form skin):**
Used for: Arsip (the daily art/archive plate), Edisi Minggu long reads,
Peta Lama overlay, Janji ledger, Opini argument maps, anything that should
feel true in fifty years. Character: 19th-century atlas plate, engraved,
slow, durable. Aged-paper field, sage-coastline and madder-route accents,
Fraunces in its leanest weight, Fig. captions, engraved hatching.

**How the three coexist:**
The masthead and chrome are always Dinas. A Mesin-register card embedded in
the Hukum feed renders in dark. An Arsip plate in any section renders in
Atlas. The three registers are token sets applied at the component level,
not page-level switches. This means a single viewport can carry all three
simultaneously, and the contrast between them is intentional: the daily
urgency (Dinas), the weight of the moment (Mesin), and the permanent record
(Atlas) live in the same paper, as they always did in good print journalism.

**Mesin in the Dinas context:** the coordinate stamp and serial number carry
over from Dinas into Mesin. The dithered-archipelago ornament is data-seeded
(yesterday's alert grid). The gold accent (`--accent2`) is used sparingly for
the one number that matters most on the card.

**Implementation note for Claude Code:** the three registers are three token
sets (CSS custom properties scoped to `[data-register="dinas"]`,
`[data-register="mesin"]`, `[data-register="atlas"]`). The root default is
`dinas`. Dark-mode media query switches root to `mesin`. Individual components
can declare their own register via the data attribute. Build the token system
this way from day one; retrofitting it is painful.

---

## 9. No flags, no state symbols: the coordinate stamp

No national, regional, or independence flags appear anywhere in the system,
in any direction. This is a non-negotiable design law.

The replacement for all flag-slot furniture is the **coordinate stamp:**
the WGS84 lat/long block of the day's lead temuan or the current map
center, rendered in Dinas spec-sheet style:

```
LS 4°05'   BT 136°53'
KABUPATEN MIMIKA · PAPUA TENGAH
```

This reads as a field document, keeps the paper's eyes pointed at actual
ground, and carries no political symbolism. It is also more honest: this
publication is about specific coordinates, not a flag.

The Lembaran seal (section 7 of the original doc) replaces all registration-
mark decorative roundels. It is a pure typographic/geometric mark, no
symbology, no heraldry.

---

## 10. Motion Doctrine v2: three layers

### Layer 1: Entrance (type performs once, then stands still)

Display headlines only. Mask-wipe per glyph (clip-path from bottom),
18–28ms stagger per character, whole reveal under 900ms. Never looped,
never re-triggered on scroll. When the headline is done performing it
becomes a static object.

The rule: **a headline is a message, not a performer.** If a user reads
it three times, it should read the same three times, not dance for them.

`prefers-reduced-motion`: instant text, no transition.

GSAP SplitText + a custom clip-path reveal. Fraunces variable weight
can tick from 200 to the display weight during the reveal, one more
motion axis that costs nothing.

### Layer 2: Ambient (plates move, the page breathes)

The Daily Prophet layer. Everything generative lives in designated
figure slots. Rules:

- Maximum two live ambient plates per viewport at one time.
- Seamless loop period: 8–30 seconds. No visible restart.
- Paused via IntersectionObserver when offscreen.
- The ornament canvases (section 4 of original doc) are the primary slots.

**Data-seeded ambient plates:** this is the doctrine upgrade. Generic
cellular automata are wallpaper. Ours are journalism.

The masthead's background generative layer is seeded from yesterday's
alert grid, mapped to a binary grid where active GLAD cells are alive
cells. The Game-of-Life step runs at a slow tick (one generation per
3–5 seconds), starting from real data and evolving into abstraction.
When the data updates at the Pagi edition, the seed resets.

The Dinas ornament canvas's scan-line sweep paces across today's affected
coordinates, not a random position. The Atlas ornament canvas draws
coastlines from the day's Hutan lens focal region, not a generic map.

Even the wallpaper is journalism. This costs no extra data (the seeding
grids are tiny derived artifacts the newsroom writes at build time); it
costs only the design intent.

For Songket Piksel (if used in future Arsip plates): the pixel grid is
seeded from the PSN concession boundary raster for that day's Arsip
region, so the textile ornament is literally a map of the land.

### Layer 3: Responsive (existing register, unchanged)

Hovers, stamps, chart build-ins, sediment scatter, wave-draw, odometer.
As specified in the original doc.

---

## 11. Dinas-specific furniture (replaces the flag slot)

In addition to the coordinate stamp (section 9):

- **Registration corner marks:** thin L-brackets at the four corners of
  fixed-chrome containers. CSS only, no images. Scale with the container.
- **Serial number:** every temuan and every tour gets a formatted serial
  (e.g. `LMB/HKM/041/2026`). Rendered in 10px mono in the folio line.
- **TERUJI LAPANGAN badge:** the stamp that replaces the verification seal
  for Dinas-register content. Filled service-orange, stamped in on reveal.
  Never used for Lane C content (Lane C gets its own distinct chip style,
  see EDITORIAL_GUIDELINES AMD section 9).
- **Service-stripe separator:** a single 2px service-orange horizontal rule
  between the masthead folio and the Berita Kilat ticker.
- No halftone flag silhouette of any territory. The dithered-island motif
  (Mesin register only) is abstract geography, not a symbol.

---

## 12. Atlas Lama-specific furniture

- **Fig. captions:** every Atlas plate carries a caption in italic
  Instrument Serif: "Fig. X. · [plain description], [year if historical]."
- **Engraved hatching:** a faint 45-degree hatching overlay on all Atlas
  background fields (CSS repeating-linear-gradient, ~8px pitch, 6% opacity).
  Adds the parchment depth without a texture image.
- **Route lines:** the madder dashed line is the Atlas equivalent of the
  Dinas serial-number annotation. Use it to trace the geographic path of a
  story in the Peta Lama overlay.
- **Compass rose:** rendered in Arsip plates only, SVG, thin strokes,
  no fill, strictly navigational, no decorative heraldry.
