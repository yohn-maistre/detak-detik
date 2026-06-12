/**
 * DETAK DETIK · the one stateless Worker (law 6: amnesiac by design).
 *
 * /ask    : rate-limit -> KV cache -> NVIDIA NIM (OpenAI-compatible) -> SSE
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
 */

export interface Env {
  NIM_API_KEY: string;
  CACHE: KVNamespace;
  MODEL_PRIMARY?: string;
  MODEL_FALLBACK?: string;
}

const NIM_BASE = 'https://integrate.api.nvidia.com/v1';
const DEFAULT_PRIMARY = 'qwen/qwen3.5-397b-a17b';
const DEFAULT_FALLBACK = 'nvidia/nemotron-3-ultra-550b-a55b';

const RSS_FEEDS: { src: string; url: string }[] = [
  { src: 'ANTARA', url: 'https://www.antaranews.com/rss/terkini.xml' },
  { src: 'TEMPO', url: 'https://rss.tempo.co/nasional' },
  { src: 'BBC INDONESIA', url: 'https://feeds.bbci.co.uk/indonesia/rss.xml' },
  { src: 'MONGABAY', url: 'https://news.mongabay.com/feed/?lang=id' },
];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    const url = new URL(req.url);
    try {
      if (url.pathname === '/ticker') return ticker(env);
      if (url.pathname === '/ask' && req.method === 'POST') return ask(req, env, ctx);
      if (url.pathname === '/tour' && req.method === 'POST') return tour(req, env);
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
  if (await limited(req, env)) {
    return json({ galat: 'Aksara lagi istirahat. Coba lagi sebentar.', degrade: 'rate_limit' }, 429);
  }

  const body = (await req.json()) as { messages: unknown[]; tools?: unknown[] };
  const cacheKey = `ask:${await sha256(JSON.stringify(body.messages))}`;

  const cached = await env.CACHE.get(cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: { 'Content-Type': 'application/json', 'X-Detak-Cache': 'hit', ...CORS },
    });
  }

  const upstream = await nim(env, env.MODEL_PRIMARY ?? DEFAULT_PRIMARY, body)
    .catch(() => nim(env, env.MODEL_FALLBACK ?? DEFAULT_FALLBACK, body));

  const text = await upstream.text();
  if (upstream.ok) {
    ctx.waitUntil(env.CACHE.put(cacheKey, text, { expirationTtl: 60 * 60 * 24 * 7 }));
  }
  return new Response(text, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json', 'X-Detak-Cache': 'miss', ...CORS },
  });
}

async function nim(env: Env, model: string, body: { messages: unknown[]; tools?: unknown[] }): Promise<Response> {
  const res = await fetch(`${NIM_BASE}/chat/completions`, {
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
  if (await limited(req, env)) return json({ galat: 'rate limit' }, 429);
  const { topik, konteks } = (await req.json()) as { topik: string; konteks?: string };

  const res = await nim(env, env.MODEL_PRIMARY ?? DEFAULT_PRIMARY, {
    messages: [
      { role: 'system', content: TOUR_SYSTEM },
      { role: 'user', content: `Topik: ${topik}\nKonteks (baris bercatatan): ${konteks ?? '-'}` },
    ],
  });
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = data.choices?.[0]?.message?.content ?? '';

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

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
