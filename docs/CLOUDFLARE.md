# Cloudflare free tier — what Detak Detik can use

Researched June 2026 against live Cloudflare docs. All of this coexists under
one free account. The binding constraints to watch: **100k Worker
requests/day** (shared by Pages Functions + Aksara proxy + cron), **1k KV
writes/day**, **10k Workers AI neurons/day**.

## The catalog (free limits)

| Product | Free limits |
|---|---|
| **Pages** | 500 builds/mo · static asset requests free & unlimited · Functions billed as Workers |
| **Workers** | 100k req/day · 10 ms CPU/invocation (wall-time waiting on fetch is free) · 5 cron triggers · 50 subrequests/req |
| **Workers AI** | 10k neurons/day ≈ $0.11/day of inference ≈ 40–50k output tokens on a 70B-class model. Catalog includes `gemma-sea-lion-v4-27b-it` (tuned for Indonesian), gpt-oss-120b, Whisper v3-turbo, FLUX.2, embeddings from $0.012/M tokens |
| **KV** | 100k reads/day · **1k writes/day** · 1 GB |
| **D1 (SQLite)** | 5M rows read/day · 100k rows written/day · 5 GB · over-limit errors, never bills |
| **R2** | 10 GB · 1M class A + 10M class B ops/mo · zero egress |
| **Durable Objects** | free via SQLite-backed DOs: 100k req/day, 5 GB |
| **Queues** | free since Feb 2026: 10k ops/day, 24 h retention |
| **Vectorize** | 30M queried dims/mo · 5M stored dims (≈13k vectors @384-dim) |
| **Turnstile** | free, unlimited challenges, invisible mode |
| **Web Analytics** | free, cookieless, ~10% sampling, 30-day retention |
| **AI Gateway** | free: caching, rate limiting, analytics, 100k logs; supports custom OpenAI-compatible providers (NIM works) |
| **Browser Rendering** | 10 min/day headless browser |
| **Images** | 5k unique transformations/mo |
| **Email Routing** | free, unlimited forwarding + Email Workers |
| **AI Search (ex-AutoRAG)** | free during open beta — managed RAG |
| Stream | no free tier — skip |

## Priority queue for this paper

1. **Turnstile on the Aksara/NIM proxy** *(half a day)* — the NIM key is the
   most abusable asset. Invisible widget → token → `siteverify` in the Worker
   before proxying. Pairs with the existing per-IP KV bucket.
2. **Workers AI as Aksara's third lane** *(1 day)* — NIM primary → NIM
   fallback → `env.AI.run('@cf/aisingapore/gemma-sea-lion-v4-27b-it')`.
   Free, never bills, officially supports Indonesian.
3. **AI Gateway in front of NIM** *(hours)* — free response caching for the
   shared-edition pattern (many readers replay the same tour questions),
   plus a second abuse throttle and analytics. Zero markup.
4. **Web Analytics** *(minutes)* — cookieless, no reader profiles: the only
   analytics compatible with iron law #6. One toggle on the Pages project.
5. **D1 for the edition archive** *(1–2 days)* — "menyimpan ingatan" needs a
   ledger: every `edisi.json`, the Janji table, Hukum rows. 5 GB free is
   years of editions. Raw documents (permits, share cards) → R2.
6. **Vectorize + embeddings for semantic search** *(2–3 days)* — embed each
   edition's items (bge-m3 / qwen3-embedding), let Aksara cite by retrieval.
   5M stored dims is the ceiling — plan a rolling window. AI Search (free
   beta) is the near-zero-code alternative.
7. **Situational:** Browser Rendering for per-edition share-card PNGs (10
   min/day covers two pressings) · Queues if the newsroom DAG moves off
   GitHub Actions · Email Routing for `koreksi@`.

Note on the existing worker: the hourly cron + KV refresh fits the 1k
writes/day cap only if each run writes a handful of consolidated keys —
write one JSON blob per lane per run, not one key per feed.
