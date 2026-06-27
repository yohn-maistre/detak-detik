# Repository Guidelines

## Project Structure & Module Organization

Detak Detik is a static Astro site with Svelte islands, a Cloudflare Worker, and a Python newsroom pipeline.

- `src/pages/` contains Astro routes; `src/pages/index.astro` is the main three-act paper.
- `src/islands/` contains hydrated Svelte components such as `Aksara.svelte`, `PetaKabar.svelte`, and data visualizations.
- `src/lib/` holds shared TypeScript modules: command bus, data fallbacks, motion, charts, and edition loading.
- `src/styles/` defines global base styles and token registers.
- `worker/` contains the stateless Cloudflare Worker for `/ask`, `/tour`, `/edisi`, `/ticker`, `/geo`, and market endpoints.
- `newsroom/` contains the Python batch newsroom: sources, desks, fact gate, lawyer pass, editor, publisher, and seed data.
- `public/data/` holds browser-served static data assets.
- `docs/` is required context; start with `docs/CLAUDE.md` and `docs/PLAN_LOG.md` (the live built-state and next steps), then `docs/NEWSROOM.md`, `docs/COMMAND_CATALOG.md`, and `docs/DATA_CONTRACTS.md`.
- **Keep the living docs current every session** (a standing rule): `docs/PLAN_LOG.md` (built state + active plans + changelog) is the source of truth; also keep `docs/DATA_SOURCES.md` (endpoints + recency), `docs/CLAUDE.md` §4, and this file in sync as work lands.

## Build, Test, and Development Commands

- `pnpm install` installs frontend dependencies.
- `pnpm dev` starts Astro locally at `http://localhost:4321`.
- `pnpm check` runs Astro/Svelte/TypeScript diagnostics.
- `pnpm build` creates the static production build in `dist/`.
- `cd worker && wrangler deploy` deploys the Worker.
- `pip install -r newsroom/requirements.txt` installs newsroom dependencies.
- `python3 -m newsroom.main` runs a local newsroom dry-run; without `AKSARA_URL` and `EDISI_TOKEN`, it logs but does not publish.

## Coding Style & Naming Conventions

Use TypeScript for frontend logic and Python 3.11+ for the newsroom. Follow existing style: two-space indentation in Svelte/Astro/TS, four-space indentation in Python, descriptive Indonesian domain names for UI concepts, and concise comments only where logic is non-obvious. Svelte islands use PascalCase filenames; shared TS modules use lowercase or kebab-style names. Route and data names should match existing Indonesian vocabulary.

## Testing Guidelines

There is no dedicated unit test suite yet. Treat `pnpm check`, `pnpm build`, and a newsroom dry-run as the minimum verification. For UI work, start `pnpm dev` and inspect affected responsive states. For Worker or newsroom changes, verify degraded behavior when secrets or live sources are absent.

## Commit & Pull Request Guidelines

Git history uses short, imperative, scoped subjects, often with a colon, for example `Map: clickable hazards...` or `Act I magazine front...`. Keep commits focused. Pull requests should include a clear summary, affected areas, verification commands, screenshots for visible UI changes, and any required Cloudflare or GitHub secret/variable changes.

## Security & Configuration Tips

Never commit secrets. Runtime configuration uses Cloudflare/Actions variables and secrets such as `PUBLIC_AKSARA_URL`, `AKSARA_URL`, `EDISI_TOKEN`, `NIM_API_KEY`, `WAQI_TOKEN`, and `FIRMS_MAP_KEY`. The Worker is designed to be stateless; do not add server-side reader tracking.
