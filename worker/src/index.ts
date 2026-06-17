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
  { src: 'ANTARA', url: 'https://www.antaranews.com/rss/terkini.xml' },
  { src: 'TEMPO', url: 'https://rss.tempo.co/nasional' },
  { src: 'BBC INDONESIA', url: 'https://feeds.bbci.co.uk/indonesia/rss.xml' },
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
   is simply omitted; the client keeps its contoh for that instrument. */

async function pasar(env: Env, ctx: ExecutionContext): Promise<Response> {
  const hit = await env.CACHE.get('pasar:v1');
  if (hit) {
    return new Response(hit, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', ...CORS } });
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
  const payload = JSON.stringify({ pada: new Date().toISOString(), data: out });
  ctx.waitUntil(env.CACHE.put('pasar:v1', payload, { expirationTtl: 900 }));
  return new Response(payload, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', ...CORS } });
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
  const cached = await env.CACHE.get('ticker:v1');
  return new Response(cached ?? '[]', {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', ...CORS },
  });
}

async function refreshTicker(env: Env): Promise<void> {
  const items: { src: string; teks: string; url: string; pada: string }[] = [];
  for (const feed of RSS_FEEDS) {
    try {
      const res = await fetch(feed.url, { headers: { 'User-Agent': 'DetakDetik/0.1 (+https://github.com/yohn-maistre/detak-detik)' } });
      const xml = await res.text();
      for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
        const item = m[1] ?? '';
        const title = item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1];
        const link = item.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/)?.[1];
        const date = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1];
        if (title && link) items.push({ src: feed.src, teks: title.trim(), url: link.trim(), pada: date ?? '' });
        if (items.filter((i) => i.src === feed.src).length >= 5) break;
      }
    } catch {
      // a dark source is a Data Hilang note, never a crash
    }
  }
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

async function geo(id: string, env: Env, ctx: ExecutionContext): Promise<Response> {
  const cacheKey = `geo:${id}`;
  const cached = await env.CACHE.get(cacheKey);
  if (cached) return new Response(cached, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', ...CORS } });

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
      // MAGMA exposes no clean GeoJSON; best-effort, empty keeps the client contoh
      const r = await fetch('https://magma.esdm.go.id/api/v1/magma-var-latest', { headers: { Accept: 'application/json' } });
      if (r.ok) {
        const d = (await r.json()) as { data?: { longitude?: number; latitude?: number; level?: number; name?: string }[] };
        features = (d.data ?? [])
          .filter((v) => Number.isFinite(v.longitude) && Number.isFinite(v.latitude))
          .map((v) => feat(v.longitude!, v.latitude!, { level: v.level ?? 1, nama: v.name ?? '' }));
      }
    }
  } catch {
    features = [];
  }

  const out = JSON.stringify({ type: 'FeatureCollection', features });
  if (features.length) ctx.waitUntil(env.CACHE.put(cacheKey, out, { expirationTtl: 300 }));
  return new Response(out, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', ...CORS } });
}

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
