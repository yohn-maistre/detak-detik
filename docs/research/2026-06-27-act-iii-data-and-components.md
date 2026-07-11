# Act III "Atlas" — sourced data + component ideas

> Research note generated **2026-06-27** by a background research agent (live web
> access; every endpoint hit/verified, status flagged per source). Status:
> **pre-implementation**. Act III already pulls GBIF, Wikimedia Commons, Wikipedia
> REST with deterministic daily rotation + engraved fallbacks (`GaleriNusantara.svelte`,
> `WajahNusantara.svelte`, `AlmanakSains.svelte`, `Bahasa718.svelte`, `SisaAlam.svelte`).

## Lane note

Per `docs/CLAUDE.md` §9, outbound fetches are blocked in the build sandbox, so each
source is either a **client-side fetch with engraved fallback** (the established Act III
pattern) or **fetched at newsroom build time** (GitHub Actions has network) and baked into
`edisi.json`. Keyless + CORS-open APIs → client path; keyed APIs → newsroom lane.

## 1. Biodiversity & species (Galeri Nusantara "Hayati", Sisa di Alam Liar)

- **GBIF Occurrence Search** — VERIFIED, keyless, CORS-open. `https://api.gbif.org/v1/occurrence/search?country=ID&mediaType=StillImage&limit=20` (+ `&license=CC0_1_0&license=CC_BY_4_0`). `results[].media[]` carries `identifier`, `license`, `rightsHolder`, `creator`; many records are CC BY-NC — keep the license filter. Embeds `iucnRedListCategory`. Powers the daily Hayati plate with real IUCN status.
- **GBIF IUCN category** — VERIFIED, keyless. `https://api.gbif.org/v1/species/{usageKey}/iucnRedListCategory` → `{category, code, scientificName}`. Note: the generic species/search does NOT populate threat status — use this path or read it off the occurrence record. Powers the status line + extinction theme.
- **IUCN Red List API v4** — VERIFIED exists, **free token** (`https://api.iucnredlist.org/users/sign_up`; v3 retired ~Mar 2025). Base `https://api.iucnredlist.org/api/v4`. Population trend, threats, country lists. Newsroom lane (key in Secrets) → bake into `edisi.json`.

## 2. Cultural heritage & endangered languages

- **Wikidata SPARQL** — VERIFIED, keyless, CORS-open, **CC0**. `https://query.wikidata.org/sparql?format=json&query=...`. Verified: UNESCO World Heritage (`P1435=Q9259`) in Indonesia (`P17=Q252`) → Lorentz NP, Komodo, Sumatra Rainforest, Ujung Kulon, Sawahlunto. Same shape for ICH, languages, batik, coordinates, P18 images. Powers an "Almanak Pusaka" rotation + a heritage map layer.
- **UNESCO ICH Indonesia** — VERIFIED list (16 elements): Wayang (2008), Kris (2008), Batik (2009), Batik training (2009), Angklung (2010), Saman (2011), Noken (2012, Urgent), 3 Balinese dances (2015), Pinisi (2017), Pencak silat (2019), Pantun (2020), Gamelan (2021), Jamu (2023), Kolintang (2024), Kebaya (2024), Reog Ponorogo (2024, Urgent). Access via Wikidata or `https://ich.unesco.org/en/state/indonesia-ID`. Powers a "Pusaka Takbenda" almanac strip.
- **Glottolog (AES endangerment status)** — VERIFIED exists; **bulk CLDF/RDF, no JSON REST**. Per-languoid RDF at `https://glottolog.org/resource/languoid/id/{glottocode}` (Accept: text/turtle); clean path = CLDF on Zenodo / `glottolog-cldf` on GitHub. License: **CC BY 4.0**. Upgrades `Bahasa718.svelte` from contoh to a real corpus of 700+ Indonesian languages colored by true AES status. Build-time bake.
- **Wikidata language status** — supplementary; endangerment (P1191) + speaker counts, keyless via SPARQL (CC0).

## 3. Almanak (astronomy, calendar, on-this-day)

- **Wikipedia "On This Day" REST** — VERIFIED (en works; **id 404s**). `https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/{MM}/{DD}`. For Indonesia-only events, query Wikidata SPARQL (events `P585` matching today's MM-DD, `P17=Q252`, Indonesian labels, CC0). Keyless, CORS-open. Powers "Hari Ini dalam Sejarah Nusantara."
- **Sunrise-Sunset.org** — VERIFIED keyless; now includes moon phase/illumination/moonrise-set (added Apr 4 2026). `https://api.sunrise-sunset.org/json?lat=-6.2&lng=106.8&formatted=0`. Powers an Almanak "langit hari ini" margin (the `KOTA_METEOR` list already exists in `AlmanakSains.svelte`).
- **Indonesian public holidays** — VERIFIED keyless: Nager.Date `https://date.nager.at/api/v3/PublicHolidays/2026/ID` (national, clean JSON, CORS-open); community APIs (Tanggal Merah `upset.dev/tanggalmerah`, `api-hari-libur.vercel.app`) add cuti bersama (verify license).
- **Tides (Indonesia)** — FLAG: **no keyless option found.** NOAA is US-only; StormGlass/WorldTides need a free key + caps. Options: (a) skip live tides; (b) compute harmonic tide locally from published constituents for one named port (deterministic, citeable, on-brand); (c) keyed StormGlass in the newsroom lane → bake daily high/low for one port.

## 4. Ingatan / memory (public-domain art & imagery)

- **Wikimedia Commons API** — VERIFIED in use, keyless, CORS-open. `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=categorymembers&gcmtitle=...&prop=imageinfo&iiprop=url|extmetadata`. New Nusantara-memory categories to add: `Category:Tropenmuseum`, `Category:Collectie Tropenmuseum`, `Category:KITLV`, `Category:Photographs of the Dutch East Indies`, `Category:Maps of the Dutch East Indies`, `Category:Indonesian National Revolution` (KITLV/Tropenmuseum donated, largely PD — a deep citeable well).
- **Rijksmuseum Data Services** — VERIFIED; **free key**. `https://www.rijksmuseum.nl/en/api` (linked-data at `https://data.rijksmuseum.nl/`). VOC/Dutch-East-Indies material, hi-res, CC BY / PD. Newsroom-lane bake. Powers an "Ingatan: arsip kolonial" rotation.
- **NMVW/Wereldmuseum** — direct API unverified; reach their PD images via Commons (above) instead.
- **Indonesian Wikipedia REST summary** — VERIFIED in use (`/api/rest_v1/page/summary/{title}`), keyless, CC BY-SA. Keep for `WajahNusantara.svelte`.

## Three concrete new Act III components

### 1 — "Daftar Merah Nusantara" (the Red List ledger)
- Data: GBIF occurrence (1) + GBIF IUCN category, both keyless, over ~30 Indonesian endemics (badak, harimau, orangutan, anoa, babirusa, maleo, cendrawasih, komodo, tarsius…). Each row = live IUCN code + a CC0/CC-BY photo.
- Signature motion: generalize `SisaAlam.svelte`'s dot-field; each species a ledger row whose status code (CR/EN/VU/NT/LC) is an engraved stamp, dot-count animates in; the list **re-sorts by extinction risk** on data load (a single transform reorder), most-threatened rising to the top in front of the reader.
- Why it's the permanent record: turns "extinction" into a cited, dated, countable ledger — citation-or-silence satisfied by a real IUCN code per row.

### 2 — "Almanak Langit & Pusaka" (sky-and-heritage margin)
- Data: Sunrise-Sunset.org (keyless, now with moon phase) for a rotating city + Wikidata SPARQL (CC0) for one UNESCO/ICH element of the day + Nager.Date for next holiday.
- Signature motion: a thin engraved horizon strip — a **moon drawn at its true current phase** (canvas 2D terminator from the illumination fraction), sunrise/sunset as agate satellites, heritage element named beneath. The lit fraction eases to today's value on load; otherwise still (Atlas register).
- Why: grounds the paper in the actual sky over the archipelago today, computed from published astronomy (same "computed not asked" ethos as `AlmanakSains.svelte`), paired with the slow inventory of inscribed heritage.

### 3 — "Peta Bahasa yang Memudar" (fading-languages plate)
- Data: Glottolog CLDF (CC BY, baked at build time) — every Indonesian languoid with AES status + coordinate; live word-glosses keep the existing `KATA_AIR` rotation.
- Signature motion: reimagine `Bahasa718.svelte` as a **dithered map plate** (reuse `DitherNusantara.svelte` / `nusantara.ts` field engine) — each language a mark at its real location, colored by true AES status; on the slow Game-of-Life tick, endangered/extinct marks **decay first**, so the map thins where languages die. Touch stirs them briefly before decay resumes.
- Why: makes "a lost word carries a way of seeing the world" a sourced, mappable fact — the Act III murmuration/decay motion language repurposed to show cultural loss.

## Verification summary

| Source | Status | Keyless? |
|---|---|---|
| GBIF occurrence (+embedded IUCN) | hit live | yes |
| GBIF `/iucnRedListCategory` | hit live | yes |
| IUCN Red List API v4 | exists | free key |
| Wikidata SPARQL (heritage/lang/events) | hit live | yes (CC0) |
| UNESCO ICH Indonesia list | confirmed | via Wikidata/HTML |
| Glottolog (AES status) | exists | yes, CLDF/RDF bulk (no JSON REST) |
| Wikipedia onthisday (en) | hit live | yes |
| Wikipedia onthisday (id) | **404, unsupported** | — |
| Sunrise-Sunset.org (+moon, Apr 2026) | confirmed | yes |
| Nager.Date holidays /ID | hit live | yes |
| Tides (Indonesia) | **no keyless option** | needs key |
| Wikimedia Commons API | in use | yes |
| Rijksmuseum API | exists | free key |
| NMVW/Tropenmuseum direct API | unverified — use via Commons | — |

Files this would touch: `GaleriNusantara.svelte`, `SisaAlam.svelte`, `Bahasa718.svelte`,
`AlmanakSains.svelte`, `DitherNusantara.svelte`, `PetaAtlas.svelte`, and `newsroom/` for the
keyed bakes (IUCN v4, Rijksmuseum, Glottolog CLDF).
