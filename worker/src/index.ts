/**
 * DETAK DETIK · the one stateless Worker (law 6: amnesiac by design).
 *
 * /ask    : turnstile -> rate-limit -> KV cache -> NIM -> Workers AI -> JSON
 * /tour   : single tour-generation call, validated against the command catalog
 * /ticker : Lane A RSS headlines from KV (written by the hourly cron)
 * cron    : fetch RSS pass-through (verbatim headline + source + link only,
 *           no model ever touches Lane A)
 *
 * NIM facts (verified June 2026):
 *   base   https://integrate.api.nvidia.com/v1 · key prefix nvapi- · 40 RPM free
 *   agentic models: qwen/qwen3.5-397b-a17b, nvidia/nemotron-3-ultra-550b-a55b
 *   batch narration: deepseek-ai/deepseek-v4-flash (streaming tool calls flaky,
 *   fine for non-streamed newsroom work)
 *
 * Cloudflare free-tier wiring (see docs/CLOUDFLARE.md):
 *   Turnstile  : enabled the moment TURNSTILE_SECRET is set; the client sends
 *                its token in the CF-Turnstile-Token header.
 *   Workers AI : third lane behind both NIM models — 10k neurons/day, free,
 *                gemma-sea-lion is officially tuned for Indonesian.
 *   AI Gateway : point NIM_BASE_URL at a gateway /compat URL for free
 *                response caching + analytics; no code change needed.
 */

export interface Env {
  NIM_API_KEY?: string;
  TURNSTILE_SECRET?: string;
  FIRMS_MAP_KEY?: string;
  WAQI_TOKEN?: string;
  EDISI_TOKEN?: string;
  OPENSKY_CLIENT_ID?: string;
  OPENSKY_CLIENT_SECRET?: string;
  MAGMA_TOKEN?: string;
  CACHE: KVNamespace;
  AI?: { run: (model: string, options: Record<string, unknown>) => Promise<{ response?: string }> };
  MODEL_PRIMARY?: string;
  MODEL_FALLBACK?: string;
  MODEL_LOCAL?: string;
  NIM_BASE_URL?: string;
}

const DEFAULT_NIM_BASE = 'https://integrate.api.nvidia.com/v1';
const DEFAULT_PRIMARY = 'qwen/qwen3.5-397b-a17b';
const DEFAULT_FALLBACK = 'nvidia/nemotron-3-ultra-550b-a55b';
const DEFAULT_LOCAL = '@cf/aisingapore/gemma-sea-lion-v4-27b-it';

const RSS_FEEDS: { src: string; url: string }[] = [
  // independent / non-state outlets only — ANTARA (state agency) dropped on purpose
  { src: 'TEMPO', url: 'https://rss.tempo.co/nasional' },
  { src: 'BBC INDONESIA', url: 'https://feeds.bbci.co.uk/indonesia/rss.xml' },
  { src: 'PROJECT MULTATULI', url: 'https://projectmultatuli.org/feed/' },
  { src: 'JUBI', url: 'https://jubi.id/feed/' },
  { src: 'KBR', url: 'https://kbr.id/feed' },
  { src: 'MONGABAY', url: 'https://news.mongabay.com/feed/?lang=id' },
];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, CF-Turnstile-Token',
};

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    const url = new URL(req.url);
    try {
      if (url.pathname === '/ticker') return ticker(env);
      if (url.pathname.startsWith('/geo/')) return geo(url.pathname.slice(5), env, ctx);
      if (url.pathname === '/ask' && req.method === 'POST') return ask(req, env, ctx);
      if (url.pathname === '/tour' && req.method === 'POST') return tour(req, env);
      if (url.pathname === '/edisi' && req.method === 'GET') return edisiGet(env);
      if (url.pathname === '/edisi' && req.method === 'POST') return edisiPost(req, env);
      if (url.pathname === '/pasar') return pasar(env, ctx);
      return json({ galat: 'rute tidak dikenal' }, 404);
    } catch (e) {
      return json({ galat: String(e) }, 500);
    }
  },

  async scheduled(_evt: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(refreshTicker(env));
  },
} satisfies ExportedHandler<Env>;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

/* ---------- /edisi : the live edition payload ----------
   GET serves the current edition JSON from KV (the site reads this at runtime
   and falls back to its baked-in contoh when empty — no rebuild to publish).
   POST is how the newsroom writes a new edition; guarded by EDISI_TOKEN so
   only the pipeline can publish. The worker stays stateless and amnesiac. */

async function edisiGet(env: Env): Promise<Response> {
  const cur = await env.CACHE.get('edisi:current');
  if (!cur) return new Response(null, { status: 204, headers: CORS });
  return new Response(cur, {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=120', ...CORS },
  });
}

/* ---------- /pasar : the morning market quotes ----------
   USD/IDR keyless via Frankfurter; indices/commodities via the Yahoo chart
   endpoint server-side (browser-like UA), cached 15 min. Any leg that fails
   is simply omitted; the client keeps its contoh for that instrument.
   Alongside the spot quotes, `seri` carries 6 months of daily closes
   (USD/IDR, IHSG, peer indices) in its own 6-hour KV key, so the cheap
   15-min spot cache never pays for five Yahoo range calls. */

type Spot = { pada: string; data: Record<string, { val: number; spark?: number[] }> };
type SeriPasar = { tanggal: string[]; usdidr: number[]; jkse: number[]; peers: Record<string, number[]> };

async function pasar(env: Env, ctx: ExecutionContext): Promise<Response> {
  const [spot, seri] = await Promise.all([pasarSpot(env, ctx), pasarSeri(env, ctx)]);
  const body: Spot & { seri?: SeriPasar } = seri ? { ...spot, seri } : spot;
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', ...CORS },
  });
}

async function pasarSpot(env: Env, ctx: ExecutionContext): Promise<Spot> {
  const hit = await env.CACHE.get('pasar:v1');
  if (hit) {
    try { return JSON.parse(hit) as Spot; } catch { /* stale shape, rebuild below */ }
  }
  const out: Record<string, { val: number; spark?: number[] }> = {};
  try {
    const r = await fetch('https://api.frankfurter.dev/v1/latest?base=USD&symbols=IDR', { signal: AbortSignal.timeout(6000) });
    const d = (await r.json()) as { rates?: { IDR?: number } };
    if (d.rates?.IDR) out.usd = { val: Math.round(d.rates.IDR) };
  } catch { /* keep contoh */ }
  const yh: Record<string, string> = { ihsg: '^JKSE', brent: 'BZ=F' };
  for (const [k, sym] of Object.entries(yh)) {
    try {
      const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=1mo&interval=1d`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DetakDetik/1.0)' },
        signal: AbortSignal.timeout(6000),
      });
      const d = (await r.json()) as { chart?: { result?: { indicators?: { quote?: { close?: (number | null)[] }[] } }[] } };
      const closes = (d.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? []).filter((x): x is number => typeof x === 'number');
      if (closes.length) out[k] = { val: closes[closes.length - 1]!, spark: closes.slice(-12) };
    } catch { /* keep contoh */ }
  }
  const spot: Spot = { pada: new Date().toISOString(), data: out };
  ctx.waitUntil(env.CACHE.put('pasar:v1', JSON.stringify(spot), { expirationTtl: 900 }));
  return spot;
}

/* Six months of daily closes, aligned on the dates where BOTH USD/IDR and
   ^JKSE traded. Peer indices ride along when they answer; different holiday
   calendars are bridged by carrying the last close forward, and a peer that
   covers less than 60% of the window is dropped rather than faked. Failures
   are negative-cached for 10 min so a dark Yahoo is not hammered per request. */

const SERI_KEY = 'pasar:seri:v1';
const SERI_PEERS = ['^KLSE', '^STI', 'PSEI.PS'];
const bulat2 = (n: number) => Math.round(n * 100) / 100;

async function yahooHarian(sym: string): Promise<Map<string, number> | null> {
  try {
    const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=6mo&interval=1d`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DetakDetik/1.0)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    const d = (await r.json()) as { chart?: { result?: { timestamp?: number[]; indicators?: { quote?: { close?: (number | null)[] }[] } }[] } };
    const res = d.chart?.result?.[0];
    const ts = res?.timestamp ?? [];
    const closes = res?.indicators?.quote?.[0]?.close ?? [];
    const n = Math.min(ts.length, closes.length);
    const peta = new Map<string, number>();
    for (let i = 0; i < n; i++) {
      const c = closes[i];
      const t = ts[i];
      if (typeof c === 'number' && Number.isFinite(c) && typeof t === 'number') {
        peta.set(new Date(t * 1000).toISOString().slice(0, 10), c);
      }
    }
    return peta.size >= 20 ? peta : null;
  } catch { return null; }
}

function sejajarkan(peta: Map<string, number> | null, tanggal: string[]): number[] | null {
  if (!peta || !tanggal.length) return null;
  let cocok = 0;
  for (const t of tanggal) if (peta.has(t)) cocok++;
  if (cocok < Math.ceil(tanggal.length * 0.6)) return null;
  const kunci = [...peta.keys()].sort();
  let akhir = peta.get(kunci[0]!)!;
  const out: number[] = [];
  for (const t of tanggal) {
    const v = peta.get(t);
    if (v != null) akhir = v;
    out.push(bulat2(akhir));
  }
  return out;
}

async function pasarSeri(env: Env, ctx: ExecutionContext): Promise<SeriPasar | null> {
  try {
    const hit = await env.CACHE.get(SERI_KEY);
    if (hit) {
      const parsed = JSON.parse(hit) as Partial<SeriPasar>;
      if (Array.isArray(parsed.tanggal) && parsed.tanggal.length && Array.isArray(parsed.usdidr) && Array.isArray(parsed.jkse)) {
        return parsed as SeriPasar;
      }
      return null; // negative-cache hit
    }
    const gagal = () => {
      ctx.waitUntil(env.CACHE.put(SERI_KEY, JSON.stringify({ galat: true }), { expirationTtl: 600 }));
      return null;
    };
    const [usd, jkse] = await Promise.all([yahooHarian('IDR=X'), yahooHarian('^JKSE')]);
    if (!usd || !jkse) return gagal();
    const tanggal = [...usd.keys()].filter((t) => jkse.has(t)).sort();
    if (tanggal.length < 20) return gagal();
    const seri: SeriPasar = {
      tanggal,
      usdidr: tanggal.map((t) => bulat2(usd.get(t)!)),
      jkse: tanggal.map((t) => bulat2(jkse.get(t)!)),
      peers: {},
    };
    const peerMaps = await Promise.all(SERI_PEERS.map((s) => yahooHarian(s)));
    SERI_PEERS.forEach((sym, i) => {
      const isi = sejajarkan(peerMaps[i] ?? null, tanggal);
      if (isi) seri.peers[sym] = isi;
    });
    ctx.waitUntil(env.CACHE.put(SERI_KEY, JSON.stringify(seri), { expirationTtl: 21600 }));
    return seri;
  } catch { return null; }
}

async function edisiPost(req: Request, env: Env): Promise<Response> {
  if (!env.EDISI_TOKEN || req.headers.get('Authorization') !== `Bearer ${env.EDISI_TOKEN}`) {
    return json({ galat: 'tidak berwenang' }, 401);
  }
  const teks = await req.text();
  let parsed: { edisi?: number };
  try { parsed = JSON.parse(teks) as { edisi?: number }; } catch { return json({ galat: 'json tidak valid' }, 400); }
  await env.CACHE.put('edisi:current', teks);
  if (typeof parsed.edisi === 'number') await env.CACHE.put(`edisi:${parsed.edisi}`, teks);
  return json({ ok: true, edisi: parsed.edisi ?? null });
}

/* ---------- turnstile: the bot gate in front of the model lanes ----------
   Off until TURNSTILE_SECRET exists, so dev and CI never need a token.
   Once armed, every /ask and /tour must carry a fresh widget token. */

async function turnstileOk(req: Request, env: Env): Promise<boolean> {
  if (!env.TURNSTILE_SECRET) return true;
  const token = req.headers.get('CF-Turnstile-Token');
  if (!token) return false;
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: env.TURNSTILE_SECRET,
      response: token,
      remoteip: req.headers.get('CF-Connecting-IP') ?? undefined,
    }),
  });
  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}

/* ---------- rate limit: a polite per-IP token bucket in KV ---------- */

async function limited(req: Request, env: Env): Promise<boolean> {
  const ip = req.headers.get('CF-Connecting-IP') ?? 'anon';
  const key = `rl:${ip}:${Math.floor(Date.now() / 60_000)}`;
  const n = Number((await env.CACHE.get(key)) ?? '0');
  if (n >= 6) return true;
  await env.CACHE.put(key, String(n + 1), { expirationTtl: 120 });
  return false;
}

/* ---------- /ask ---------- */

async function ask(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (!(await turnstileOk(req, env))) {
    return json({ galat: 'Verifikasi Turnstile gagal. Muat ulang halaman.', degrade: 'turnstile' }, 403);
  }
  if (await limited(req, env)) {
    return json({ galat: 'Aksara sedang beristirahat. Coba lagi sebentar.', degrade: 'rate_limit' }, 429);
  }

  const body = (await req.json()) as { messages: unknown[]; tools?: unknown[] };
  const cacheKey = `ask:${await sha256(JSON.stringify(body.messages))}`;

  const cached = await env.CACHE.get(cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: { 'Content-Type': 'application/json', 'X-Detak-Cache': 'hit', ...CORS },
    });
  }

  // lanes 1 + 2: NIM primary then fallback (skipped entirely without a key)
  let upstream: Response | null = null;
  if (env.NIM_API_KEY) {
    upstream = await nim(env, env.MODEL_PRIMARY ?? DEFAULT_PRIMARY, body)
      .catch(() => nim(env, env.MODEL_FALLBACK ?? DEFAULT_FALLBACK, body))
      .catch(() => null);
  }

  if (upstream?.ok) {
    const text = await upstream.text();
    ctx.waitUntil(env.CACHE.put(cacheKey, text, { expirationTtl: 60 * 60 * 24 * 7 }));
    return new Response(text, {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-Detak-Cache': 'miss', 'X-Detak-Lane': 'nim', ...CORS },
    });
  }

  // lane 3: Workers AI — free, local to the edge, fluent in Indonesian
  if (env.AI) {
    try {
      const out = await env.AI.run(env.MODEL_LOCAL ?? DEFAULT_LOCAL, {
        messages: body.messages,
        max_tokens: 1024,
        temperature: 0.2,
      });
      const shaped = JSON.stringify({
        id: `dd-${Date.now()}`,
        object: 'chat.completion',
        model: env.MODEL_LOCAL ?? DEFAULT_LOCAL,
        choices: [{
          index: 0,
          message: { role: 'assistant', content: out.response ?? '' },
          finish_reason: 'stop',
        }],
      });
      ctx.waitUntil(env.CACHE.put(cacheKey, shaped, { expirationTtl: 60 * 60 * 24 * 7 }));
      return new Response(shaped, {
        headers: { 'Content-Type': 'application/json', 'X-Detak-Cache': 'miss', 'X-Detak-Lane': 'workers-ai', ...CORS },
      });
    } catch {
      // fall through to whatever NIM said, or the 503 below
    }
  }

  if (upstream) {
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json', 'X-Detak-Cache': 'miss', 'X-Detak-Lane': 'nim', ...CORS },
    });
  }
  return json({ galat: 'Semua lajur model sedang gelap. Edisi tetap terbaca tanpa Aksara.' }, 503);
}

async function nim(env: Env, model: string, body: { messages: unknown[]; tools?: unknown[] }): Promise<Response> {
  const res = await fetch(`${env.NIM_BASE_URL ?? DEFAULT_NIM_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.NIM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: body.messages,
      tools: body.tools,
      temperature: 0.2,
      max_tokens: 1024,
      stream: false,
    }),
  });
  if (!res.ok && res.status >= 500) throw new Error(`NIM ${res.status}`);
  return res;
}

/* ---------- /tour: one call, validated before it ever replays ---------- */

const TOUR_SYSTEM = `Kamu adalah perancang tur DETAK DETIK. Balas HANYA JSON valid
dengan skema: {"tour_id":string,"judul":string,"asal":"generated",
"langkah":[{"cmd":"fly_to|scroll_to|set_lens|highlight|say","params":object,
"narasi":string,"tahan_ms":number}]}. Verba di luar daftar itu dilarang.
Narasi hanya menyebut fakta yang ada pada konteks yang diberikan.`;

async function tour(req: Request, env: Env): Promise<Response> {
  if (!(await turnstileOk(req, env))) return json({ galat: 'verifikasi turnstile gagal' }, 403);
  if (await limited(req, env)) return json({ galat: 'rate limit' }, 429);
  const { topik, konteks } = (await req.json()) as { topik: string; konteks?: string };

  const messages = [
    { role: 'system', content: TOUR_SYSTEM },
    { role: 'user', content: `Topik: ${topik}\nKonteks (baris bercatatan): ${konteks ?? '-'}` },
  ];

  let raw = '';
  if (env.NIM_API_KEY) {
    const res = await nim(env, env.MODEL_PRIMARY ?? DEFAULT_PRIMARY, { messages });
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    raw = data.choices?.[0]?.message?.content ?? '';
  } else if (env.AI) {
    const out = await env.AI.run(env.MODEL_LOCAL ?? DEFAULT_LOCAL, { messages, max_tokens: 1024, temperature: 0.2 });
    raw = out.response ?? '';
  }

  // the gate: parse, validate verbs, drop anything else. invalid = not executed.
  const ALLOWED = new Set(['fly_to', 'scroll_to', 'set_lens', 'highlight', 'say']);
  try {
    const parsed = JSON.parse(raw.replace(/^```json?\s*|\s*```$/g, ''));
    parsed.langkah = (parsed.langkah ?? []).filter(
      (s: { cmd?: string }) => typeof s.cmd === 'string' && ALLOWED.has(s.cmd),
    );
    if (!parsed.langkah.length) throw new Error('tur kosong setelah validasi');
    return json(parsed);
  } catch {
    return json({ galat: 'skrip tur tidak lolos validasi katalog' }, 422);
  }
}

/* ---------- ticker: Lane A, pass-through only ---------- */

async function ticker(env: Env): Promise<Response> {
  let cached = await env.CACHE.get('ticker:v1');
  if (!cached) {
    // empty KV (e.g. just deployed, before the first hourly cron tick) —
    // populate now so the headlines are live immediately, not after an hour.
    await refreshTicker(env);
    cached = await env.CACHE.get('ticker:v1');
  }
  return new Response(cached ?? '[]', {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', ...CORS },
  });
}

async function refreshTicker(env: Env): Promise<void> {
  type Item = { src: string; teks: string; url: string; pada: string };
  const byFeed: Item[][] = [];
  for (const feed of RSS_FEEDS) {
    const got: Item[] = [];
    try {
      const res = await fetch(feed.url, {
        headers: {
          // a realistic browser UA — these outlets' WAF/CDN 403s datacenter agents
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
          'Accept-Language': 'id,en;q=0.8',
        },
        signal: AbortSignal.timeout(8000),
      });
      const xml = await res.text();
      for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
        const item = m[1] ?? '';
        const title = item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1];
        const link = item.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/)?.[1];
        const date = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1];
        if (title && link) got.push({ src: feed.src, teks: title.trim(), url: link.trim(), pada: date ?? '' });
        if (got.length >= 4) break;
      }
    } catch {
      // a dark source is a Data Hilang note, never a crash
    }
    if (got.length) byFeed.push(got);
  }
  // round-robin across feeds so the ticker + Ringkas Pagi show a mix of outlets,
  // not five in a row from whichever feed loaded first
  const items: Item[] = [];
  for (let i = 0; i < 4; i++) for (const feed of byFeed) if (feed[i]) items.push(feed[i]!);
  await env.CACHE.put('ticker:v1', JSON.stringify(items), { expirationTtl: 7200 });
}

/* ---------- /geo: map layer proxy (keyless out, cached, CORS) ----------
   Browsers cannot reach FIRMS/WAQI/MAGMA directly (keys + CORS); the Worker
   fetches server-side, normalises to GeoJSON points, and caches 5 min to
   respect upstream rate limits. PetaBencana stays a direct client fetch. */

const IDN_BBOX = '95,-11,141,6'; // west,south,east,north

function geojson(features: unknown[]): Response {
  return new Response(JSON.stringify({ type: 'FeatureCollection', features }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', ...CORS },
  });
}
const feat = (lon: number, lat: number, props: Record<string, unknown>) => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [lon, lat] },
  properties: props,
});

/* Planes: OpenSky returns the whole Indonesia bbox in ONE call (no 250 NM grid).
   Its CORS is origin-locked, so it runs here, not in the browser. Anonymous
   credits are per-IP (our shared CF IP burns them fast), so a free OpenSky API
   client (OAuth2 client_credentials) makes it reliable; the token is cached. */
async function openSkyToken(env: Env): Promise<string | null> {
  if (!env.OPENSKY_CLIENT_ID || !env.OPENSKY_CLIENT_SECRET) return null;
  const hit = await env.CACHE.get('osky:tok');
  if (hit) return hit;
  try {
    const r = await fetch('https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${encodeURIComponent(env.OPENSKY_CLIENT_ID)}&client_secret=${encodeURIComponent(env.OPENSKY_CLIENT_SECRET)}`,
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    const d = (await r.json()) as { access_token?: string; expires_in?: number };
    if (!d.access_token) return null;
    await env.CACHE.put('osky:tok', d.access_token, { expirationTtl: Math.max(60, (d.expires_in ?? 1800) - 120) });
    return d.access_token;
  } catch { return null; }
}
async function planesOpenSky(env: Env): Promise<unknown[]> {
  const token = await openSkyToken(env);
  if (!token) return []; // anonymous is per-IP and dead from our shared CF IP — skip to fallback
  const headers: Record<string, string> = { Accept: 'application/json', Authorization: `Bearer ${token}` };
  try {
    const r = await fetch('https://opensky-network.org/api/states/all?lamin=-11&lomin=95&lamax=6&lomax=141', { headers, signal: AbortSignal.timeout(9000) });
    if (!r.ok) return [];
    const d = (await r.json()) as { states?: (string | number | boolean | null)[][] };
    return (d.states ?? [])
      .filter((a) => a[5] != null && a[6] != null && a[8] !== true)
      .map((a) => feat(Number(a[5]), Number(a[6]), {
        hex: String(a[0] ?? ''),
        flight: String(a[1] ?? '').trim(),
        track: Math.round(Number(a[10]) || 0),
        alt: Math.round((Number(a[7]) || 0) * 3.281),   // metres -> feet
        gs: Math.round((Number(a[9]) || 0) * 1.944),     // m/s -> knots
      }));
  } catch { return []; }
}
async function planesAdsbGrid(): Promise<unknown[]> {
  // adsb.lol caps the radius at 250 NM, so a grid is needed; it also throttles
  // our datacenter IP hard (often ~1 plane) — only the no-OpenSky-creds fallback.
  const circles: [number, number][] = [
    [5.4, 96], [2, 99], [-1, 101], [-4, 104.5], [-6.3, 106.8], [-8, 112.5],
    [-8.8, 118], [-9.3, 123.5], [0.8, 109.5], [1.8, 117], [-2.6, 115], [-2, 121],
    [1.6, 125], [-4.5, 122.5], [-3, 129.5], [-1.5, 134], [-4, 138], [-7, 140],
  ];
  const seen = new Set<string>();
  const planes: unknown[] = [];
  for (let i = 0; i < circles.length; i += 5) {
    const results = await Promise.allSettled(
      circles.slice(i, i + 5).map(([lat, lon]) =>
        fetch(`https://api.adsb.lol/v2/lat/${lat}/lon/${lon}/dist/250`, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(7000),
        }).then((r) => (r.ok ? r.json() : { ac: [] })) as Promise<{ ac?: Record<string, unknown>[] }>,
      ),
    );
    for (const res of results) {
      if (res.status !== 'fulfilled') continue;
      for (const a of res.value.ac ?? []) {
        const hex = String(a.hex ?? '');
        if (!hex || seen.has(hex)) continue;
        const lo = Number(a.lon), la = Number(a.lat);
        if (!Number.isFinite(lo) || !Number.isFinite(la)) continue;
        seen.add(hex);
        planes.push(feat(lo, la, {
          hex, track: Number(a.track ?? a.true_heading ?? 0) || 0,
          flight: String(a.flight ?? '').trim(), alt: Number(a.alt_baro ?? 0) || 0,
          gs: Number(a.gs ?? 0) || 0, squawk: String(a.squawk ?? '').trim(),
          kategori: String(a.category ?? '').trim(),
        }));
      }
    }
  }
  return planes;
}

async function geo(id: string, env: Env, ctx: ExecutionContext): Promise<Response> {
  const cacheKey = `geo:${id}`;
  const ttl = id === 'pesawat' ? 30 : 300;
  const cached = await env.CACHE.get(cacheKey);
  if (cached) return new Response(cached, { headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${ttl}`, ...CORS } });

  let features: unknown[] = [];
  try {
    if (id === 'udara' && env.WAQI_TOKEN) {
      const r = await fetch(`https://api.waqi.info/map/bounds/?latlng=-11,95,6,141&token=${env.WAQI_TOKEN}`);
      const d = (await r.json()) as { data?: { lat: number; lon: number; aqi: string; station?: { name?: string } }[] };
      features = (d.data ?? [])
        .filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lon) && s.aqi !== '-')
        .map((s) => feat(s.lon, s.lat, { aqi: Number(s.aqi), nama: s.station?.name ?? '' }));
    } else if (id === 'kebakaran' && env.FIRMS_MAP_KEY) {
      const r = await fetch(`https://firms.modaps.eosdis.nasa.gov/api/area/csv/${env.FIRMS_MAP_KEY}/VIIRS_NOAA20_NRT/${IDN_BBOX}/1`);
      const csv = await r.text();
      const rows = csv.trim().split('\n');
      const head = (rows.shift() ?? '').split(',');
      const iLat = head.indexOf('latitude'), iLon = head.indexOf('longitude'), iFrp = head.indexOf('frp');
      features = rows
        .map((line) => line.split(','))
        .filter((c) => c.length > Math.max(iLat, iLon, iFrp))
        .map((c) => feat(Number(c[iLon]), Number(c[iLat]), { frp: Number(c[iFrp]) || 10 }))
        .filter((f) => Number.isFinite((f.geometry.coordinates as number[])[0]));
    } else if (id === 'gunungapi') {
      // Today's PVMBG alert levels by volcano name (I Normal .. IV Awas). The client
      // already bundles every summit coordinate (public/data/gunungapi-id.json, from
      // Smithsonian GVP) and merges these levels onto it by name — so we only need
      // name + level here. MAGMA's JSON API is token-gated: without MAGMA_TOKEN we
      // return [] and the client shows the registry honestly as "DAFTAR · status
      // menyusul" rather than faking a calm Normal everywhere.
      const LEVELS: Record<string, number> = { normal: 1, waspada: 2, siaga: 3, awas: 4 };
      const pick = (o: Record<string, unknown>, keys: string[]): unknown => {
        for (const k of keys) if (o[k] != null) return o[k];
        return undefined;
      };
      if (env.MAGMA_TOKEN) {
        const r = await fetch('https://magma.esdm.go.id/api/v1/magma-var', {
          headers: { Accept: 'application/json', Authorization: `Bearer ${env.MAGMA_TOKEN}` },
          signal: AbortSignal.timeout(9000),
        });
        // Guard: an expired token or maintenance page answers 200 text/html. Parsing
        // that as JSON is exactly the silent failure that left levels dead before — so
        // only proceed when the body is genuinely JSON.
        const isJson = (r.headers.get('content-type') ?? '').includes('json');
        if (r.ok && isJson) {
          const d = (await r.json()) as unknown;
          const arr = Array.isArray(d)
            ? d
            : Array.isArray((d as { data?: unknown[] }).data) ? (d as { data: unknown[] }).data : [];
          features = (arr as Record<string, unknown>[])
            .map((v) => {
              const lon = Number(pick(v, ['longitude', 'lon', 'bujur', 'lng']));
              const lat = Number(pick(v, ['latitude', 'lat', 'lintang']));
              const lvl = pick(v, ['level', 'tingkat', 'tingkat_aktivitas', 'status', 'var_level']);
              const level = typeof lvl === 'number' ? lvl : LEVELS[String(lvl).toLowerCase()] ?? 1;
              const nama = String(pick(v, ['name', 'nama', 'gunung', 'ga_name', 'volcano_name']) ?? '');
              // levels merge by name on the client; coords are best-effort (0,0 if absent)
              return feat(Number.isFinite(lon) ? lon : 0, Number.isFinite(lat) ? lat : 0, { level, nama });
            })
            .filter((f) => String((f.properties as { nama?: string }).nama ?? '').length > 0);
        }
      }
    } else if (id === 'pesawat') {
      // one OpenSky bbox call covers the whole archipelago; adsb.lol grid is the
      // fallback when OpenSky has no creds / is down (it throttles our IP to ~1).
      features = await planesOpenSky(env);
      if (!features.length) features = await planesAdsbGrid();
    }
  } catch {
    features = [];
  }

  const out = JSON.stringify({ type: 'FeatureCollection', features });
  if (features.length) ctx.waitUntil(env.CACHE.put(cacheKey, out, { expirationTtl: ttl }));
  return new Response(out, { headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${ttl}`, ...CORS } });
}

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
