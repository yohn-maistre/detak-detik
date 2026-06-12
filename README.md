# DETAK DETIK

**Koran sipil yang dicetak mesin, diperiksa hukum, dan menyimpan ingatan.**

A daily civic newspaper for Indonesia: printed twice a day by an automated
newsroom, served as a static site, narrated by an agent that can only say
what it can cite. The map is the front-page photograph. The whole thing runs
on free infrastructure and stores nothing about its readers on any server.

## The iron laws

1. **Citation or silence.** No row, no claim. A mismatched number is dropped, not softened.
2. **Two lanes, never crossed.** Lane A (external news) is verbatim RSS pass-through no model ever touches. Lane B (our journalism) is derived only from primary structured data through a deterministic fact gate.
3. **Documents speak, nobody accuses.** The permit, the award, the filing, side by side. The reader draws the conclusion.
4. **One command vocabulary.** Clicks, tours, toggles, and the agent all speak the same validated verbs. Every state is a URL.
5. **Shared edition by default.** Two readers the same morning see the same headline and the same puzzle.
6. **Local-first, no surveillance.** Reader memory lives in the browser. The Worker is amnesiac.

## What's here now

The front page is a three-act scroll piece, all sample data marked
`(data contoh)`:

- **Dinas** (khaki, the working day): masthead, ticker, Angka Edisi odometer, temuan cards, the Justice Gradient scatter, the Struk Belanja Negara.
- **Mesin** (black, the 3am press): a Bayer-dithered Nusantara plate that lives as a slow Game of Life (stir it), the Yang Tidak Dihitung silence table, Layar Ganda, the price wave.
- **Atlas Lama** (aged paper, the permanent record): a MapLibre atlas plate over OpenFreeMap, the Janji ledger, Tebak Daerah.

Aksara, the bottom-left terminal, drives the page through the same command
catalog as every click: open it and type `tur`.

## Stack

Astro 6 + Svelte 5 islands · Tailwind 4 (triple-register token system) ·
GSAP 3.15 · MapLibre GL + OpenFreeMap · a stateless Cloudflare Worker
proxying NVIDIA NIM (Qwen 3.5 / Nemotron 3) with KV cache · nightly ETL +
newsroom in GitHub Actions. See `docs/STACK_2026.md` for the verified
research behind every choice, and `docs/` for the full constitution.

```bash
pnpm install
pnpm dev        # http://localhost:4321
pnpm build      # static output in dist/
```

The Worker lives in `worker/` (`wrangler secret put NIM_API_KEY`).
The newsroom DAG lives in `newsroom/`; the SOURCES ledger in `etl/sources.ts`.

## Build order

1. ✅ Chassis: tokens, command bus, the three-act front page, Aksara terminal
2. Hukum lens end to end (scraper → extraction → scatter → share card)
3. The newsroom, minimal (one desk, the fact gate, `edisi.json`)
4. Breadth: Anggaran, Hutan, Janji, the games, Arsip

*Semua angka pada halaman saat ini adalah data contoh.*
