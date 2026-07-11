# STACK_2026.md — research findings, June 2026

> What seven web-research passes verified before the first commit.
> Supersedes version assumptions in the older docs where they differ.

## Frontend

| Piece | Verdict |
|---|---|
| Astro **6.4.6** | Node 22 minimum. Cloudflare acquired Astro Jan 2026. `<ViewTransitions/>` removed; native `@view-transition` CSS is the light path for a static site. |
| Svelte **5.56** + @astrojs/svelte 8 | Runes everywhere. Islands `client:visible`, props serializable. |
| Tailwind **4.3** | CSS-first. Token scoping via `@theme inline` referencing raw custom properties so `[data-register]` overrides cascade (the triple-register system depends on this). |
| GSAP **3.15** | 100% free incl. ScrollTrigger/SplitText/MorphSVG/Flip since the Webflow acquisition (Apr 2025). |
| CSS scroll-driven animations | Chrome 115+, Safari 26+. **Firefox still flagged** (June 2026). Therefore: GSAP ScrollTrigger scrub drives the register morph; `animation-timeline` is ambient garnish behind `@supports`. `@property` is Baseline, color tokens interpolate. |
| MapLibre **5.24** + pmtiles 4.4 | OpenFreeMap (`tiles.openfreemap.org`) is free, keyless, unlimited; custom atlas style over the OpenMapTiles schema. Self-hosted PMTiles on R2 is the fallback. `flyTo` respects reduced motion natively. |
| DuckDB-WASM | **Pin 1.32.0**: the npm `latest` tag currently points at a dev build. ~9-10 MB gz, lazy-load on terminal intent only. Pages hosts serve range requests fine; >25 MiB artifacts go to R2. |
| Pagefind **1.5** | Big April 2026 overhaul (new web-component UI, better ranking). Use new docs, not old tutorials. |

## NVIDIA NIM (free tier)

- Base `https://integrate.api.nvidia.com/v1`, OpenAI-compatible. Key prefix `nvapi-`, header `Authorization: Bearer`.
- **40 RPM** per key default (200 by application). ~1.000 inference credits on signup, 5.000 on request.
- Model IDs (confirmed): `qwen/qwen3.5-397b-a17b`, `qwen/qwen3.5-122b-a10b`,
  `deepseek-ai/deepseek-v4-pro`, `deepseek-ai/deepseek-v4-flash`,
  `nvidia/nemotron-3-ultra-550b-a55b`, `nvidia/nemotron-3-super-120b-a12b`.
- Gotchas: DeepSeek v4 reasoning needs `chat_template_kwargs: {thinking: true}` or it hangs;
  streaming tool calls on DeepSeek v4 via NIM are broken in agent loops →
  **Qwen 3.5 / Nemotron 3 for the runtime agent, DeepSeek for batch newsroom narration.**
- Structured output: prefer `nvext.guided_json` over `response_format`.
- Worker holds the key; KV caches answers; per-IP token bucket keeps one reader from draining 40 RPM.

## Data sources (all verified alive)

| Source | Access | Note |
|---|---|---|
| HDX COD-AB IDN | CKAN API / download | adm2 = 522 kab/kota with pcodes; 403s bot UAs |
| BPS WebAPI | free token, instant | `/v1/api/list/model/data/domain/{D}/var/{V}/key/{K}` |
| Direktori Putusan MA | scrape w/ browser headers | bootstrap from indo-law corpus (22.630 putusan) + HF Azzindani collection |
| DJPK APBD | Excel downloads | current through 8 Jun 2026, 545 pemda |
| GFW Data API | free API key | `gfw_integrated_alerts` SQL queries; tile big AOIs |
| Bapanas WebAPI | manual approval | PIHPS internal JSON as fragile fallback |
| BMKG | open JSON | attribution required |
| GDELT | DOC 2.0 API free | `sourcecountry:indonesia` |
| football-data.org | free tier | WC2026 covered, 10 req/min, scores delayed |
| Rijksmuseum | **new** data.rijksmuseum.nl | old key API dead since Jan 2026, new one keyless |
| Wikimedia Commons | descriptive UA | anonymous limits tightening through 2026 |

Cross-cutting: nearly every `.go.id` portal (and HDX) 403s generic clients.
Honest-but-realistic headers, low rates, mirror-on-fetch.

## Type and design decisions

- Fraunces Variable (SOFT/WONK axes) + Archivo Variable + Instrument Serif + **Geist Mono** (IBM Plex Mono retired). All OFL.
- The 2025-26 editorial wave: serif revival, mono as the "data voice", Bayer dithering as the defining texture, registration-mark "micrographics" furniture, anti-AI-gloss grain.
- Seeded generative ornaments: cyrb128 → splitmix32, so every plate is reproducible from the edition seed (the wallpaper is journalism).
- Perf gates: max two live ambient plates per viewport, IO-pause offscreen canvases, DPR cap 1.75, transforms/opacity only, full `prefers-reduced-motion` degradation.
