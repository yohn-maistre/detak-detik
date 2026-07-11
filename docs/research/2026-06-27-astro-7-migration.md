# Astro 6 → 7 migration assessment

> Research note generated **2026-06-27** by a background research agent (live web
> access, grounded in the repo). Status: **DONE** — migration landed this session on
> branch `claude/astro-7-migration` (build 2m27s → 50s, `pnpm check` 0 errors,
> MapLibre/pmtiles bundle clean under Rolldown). Kept as the rationale + checklist.
> Canonical stack doc: `STACK_2026.md`.

## Recommendation (executed)

Migrate now (low risk), on a branch, after the local toolchain is on Node 22.
Astro 7 is a near-drop-in for this stack: every breaking change of consequence
(markdown processor, `astro:db`, View Transitions internals, `src/fetch.ts`,
advanced routing) targets features this project does not use. The payoff is real
and free — meaningfully faster builds via the Rust compiler + Vite 8/Rolldown —
and all three integrations (`@astrojs/svelte`, `@tailwindcss/vite`,
`@astrojs/check`) already ship Astro-7-compatible versions. Hard precondition:
**Node >=22.12.0** (we run 22.23.1; CF Pages pinned via `.node-version`).

## What's new + performance

- **Builds 15–61% faster overall**, some sites >2× faster. Astro's published
  benchmarks: astro.build (308 pages) 62.70s → 24.24s (~2.6×); docs.astro.build
  (6,313 pages) 114.54s → 73.53s; developers.cloudflare.com (8,431 pages) 386.89s
  → 261.94s. Source: https://astro.build/blog/astro-7/  (Our own result: 2m27s → 50s.)
- **`.astro` compiler rewritten in Rust** (was Go; previously `experimental.rustCompiler`).
- **Vite 8 + Rolldown** (Rust bundler replacing esbuild+Rollup), ~10–30× faster than
  Rollup while keeping the Rollup/Vite plugin API. https://vite.dev/blog/announcing-vite8
- **Queued/streaming rendering default + stable, ~2.4× faster** on expression-dense
  pages (relevant: `index.astro` is expression-heavy).
- **Sätteri** replaces remark/rehype as default markdown processor — does not affect
  us (no markdown/MDX in `src`).
- Route caching stabilized + experimental CDN cache providers; AI-agent dev features.

## Breaking changes that affect us

Almost none touch this codebase. The two to check:

1. **`compressHTML` default → `'jsx'`** (inter-element whitespace stripped React-style).
   Config does not set it, so the new default applies. Risk surface = 7 `.astro`
   files. Mitigation: eyeball rendered pages; insert `{" "}` where a visible space
   between adjacent inline elements is intended, or set `compressHTML: true` to revert.
2. **Rust compiler is stricter about invalid HTML** (unclosed non-void tags error).
   Scan of all 7 `.astro` files found only valid self-closing tags (`<link/>`,
   `<line/>` in SVG). No action expected.

Not applicable (verified absent): Sätteri/remark-rehype, `@astrojs/db`, View
Transitions internals (`createAnimationScope`), `src/fetch.ts`, advanced-routing
default, Container API entrypoint move, removed `astro db/login/...` CLI commands.

## Integration compatibility (as migrated)

| Integration | Action | Notes |
|---|---|---|
| `astro` ^6.4.6 → **^7.0.3** | bumped | `engines.node >=22.12.0`; bundles `vite ^8`. |
| `@astrojs/svelte` ^8.1.2 → **^9.0.0** | bumped | peers `astro ^7`, `svelte ^5.43.6`, `@sveltejs/vite-plugin-svelte ^7`, `vite ^8`. "No user action necessary." |
| `svelte` ^5.56.3 | kept | satisfies svelte peer. |
| `@tailwindcss/vite` ^4.3.0 → **^4.3.1** | bumped | vite peer `^5\|^6\|^7\|^8`. |
| `tailwindcss` ^4.3.0 | kept | CSS-first v4 via the Vite plugin. |
| `@astrojs/check` ^0.9.9 | kept | already latest; accepts TS 6. |
| `typescript` ^6.0.3 | kept | accepted by svelte integration peer. |
| `maplibre-gl`, `pmtiles`, `d3-*`, `gsap`, `lenis`, `rough-notation`, `zod`, fontsource | kept | bundled by Rolldown; **smoke-tested clean at build**. |
| Cloudflare Pages (static, no adapter) | + `.node-version` | static prerender unchanged; pinned Node 22 so the live build does not fail like local Astro-6-on-Node-20 did. |

## Remaining verify-before-trust

- **Visual whitespace** from `compressHTML: 'jsx'` — needs an eyeball at 390px +
  1280px on the touched sections (mono labels/tickers, receipt furniture). Build is
  green but this is a render-time concern, not a build error.
- **Rolldown runtime** of `maplibre-gl`/`pmtiles` — bundles without error; still worth
  a live map smoke-test in the deployed preview (workers/WASM paths).

## Sources

- Astro 7.0: https://astro.build/blog/astro-7/ · upgrade guide: https://docs.astro.build/en/guides/upgrade-to/v7/
- `astro@7.0.3` engines.node + vite: https://registry.npmjs.org/astro/latest
- `@astrojs/svelte@9.0.0` peers/deps: https://registry.npmjs.org/@astrojs/svelte/latest
- `@tailwindcss/vite@4.3.1` (vite ^8): https://registry.npmjs.org/@tailwindcss/vite/latest
- Vite 8 / Rolldown: https://vite.dev/blog/announcing-vite8
- Astro on Cloudflare Pages (static): https://docs.astro.build/en/guides/deploy/cloudflare/
