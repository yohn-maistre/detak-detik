<script lang="ts">
  /** Diukur dari luar: bursa Jakarta (IHSG) diindeks ke 100, bersama beberapa
      bursa Asia lain. Peers menggambar dulu dan tenang; lalu IHSG terakhir,
      tebal. Saat worker Aksara menjawab, garis-garisnya adalah penutupan
      harian enam bulan (Yahoo, via /pasar `seri`), direbase ke 100; tanpa itu
      deret contoh tetap tampil dengan tera air agar tak tertukar dengan data. */
  import { onMount } from 'svelte';
  import { gsap, reducedMotion, EASE_PRESS, EASE_STAMP } from '../lib/motion';
  import { rngFrom } from '../lib/seed';
  import { pathD, fmtPct, rebase100 } from '../lib/chart-kit';

  type Garis = { nama: string; akhir: number; warna: string; tebal: number; seed: string };
  // rebased to 100 at Jan 2026; endpoints are cited approximations, marked contoh
  const GARIS: Garis[] = [
    { nama: 'Vietnam', akhir: 128, warna: 'var(--muted)', tebal: 1.4, seed: 'vn-2026' },
    { nama: 'Thailand', akhir: 118, warna: 'var(--muted)', tebal: 1.4, seed: 'th-2026' },
    { nama: 'India', akhir: 101, warna: 'var(--muted)', tebal: 1.4, seed: 'in-2026' },
    { nama: 'IHSG', akhir: 69, warna: 'var(--accent)', tebal: 3.2, seed: 'id-2026' },
  ];

  const CONTOH_N = 130;
  function seri(seed: string, akhir: number, goyang: number): number[] {
    const rng = rngFrom(seed);
    const out: number[] = [];
    for (let i = 0; i < CONTOH_N; i++) {
      const t = i / (CONTOH_N - 1);
      const base = 100 + (akhir - 100) * (t * 0.45 + t * t * 0.55);
      out.push(base * (1 + (rng() - 0.5) * 2 * goyang));
    }
    out[0] = 100; out[CONTOH_N - 1] = akhir;
    return out;
  }

  type Live = { tanggal: string[]; jkse: number[]; peers: Record<string, number[]> };
  let live = $state<Live | null>(null);
  const PEER_NAMA: Record<string, string> = { '^KLSE': 'Malaysia', '^STI': 'Singapura', 'PSEI.PS': 'Filipina', '^SET.BK': 'Thailand' };

  const AKSARA_URL = (import.meta.env.PUBLIC_AKSARA_URL as string | undefined)?.replace(/\/$/, '');
  onMount(() => {
    if (!AKSARA_URL) return;
    (async () => {
      try {
        const res = await fetch(`${AKSARA_URL}/pasar`, { signal: AbortSignal.timeout(8000) });
        const d = (await res.json()) as { seri?: { tanggal?: unknown; jkse?: unknown; peers?: unknown } };
        const s = d.seri;
        if (
          s && Array.isArray(s.tanggal) && Array.isArray(s.jkse)
          && s.tanggal.length >= 20
          && s.jkse.length === s.tanggal.length
          && typeof s.jkse[0] === 'number'
        ) {
          const peers: Record<string, number[]> = {};
          const mentah = (s.peers && typeof s.peers === 'object') ? (s.peers as Record<string, unknown>) : {};
          for (const [sym, arr] of Object.entries(mentah)) {
            // only peers with complete, aligned data earn a line
            if (Array.isArray(arr) && arr.length === s.tanggal.length && typeof arr[0] === 'number') {
              peers[sym] = arr as number[];
            }
          }
          live = { tanggal: s.tanggal as string[], jkse: s.jkse as number[], peers };
        }
      } catch { /* contoh stands; the watermark says so */ }
    })();
  });

  type Seri = { nama: string; akhir: number; warna: string; tebal: number; data: number[] };
  const series: Seri[] = $derived.by(() => {
    if (live) {
      const peers: Seri[] = Object.entries(live.peers).slice(0, 3).map(([sym, v]) => {
        const d = rebase100(v);
        const akhir = d[d.length - 1] ?? 100;
        return { nama: PEER_NAMA[sym] ?? sym, akhir, warna: 'var(--muted)', tebal: 1.4, data: d };
      });
      const j = rebase100(live.jkse);
      return [...peers, { nama: 'IHSG', akhir: j[j.length - 1] ?? 100, warna: 'var(--accent)', tebal: 3.2, data: j }];
    }
    return GARIS.map((g) => ({ nama: g.nama, akhir: g.akhir, warna: g.warna, tebal: g.tebal, data: seri(g.seed, g.akhir, 0.01) }));
  });
  const peers = $derived(series.filter((s) => s.nama !== 'IHSG'));
  const ihsg = $derived(series[series.length - 1]!);
  const N = $derived(ihsg.data.length);

  const W = 560, H = 250, PAD = { l: 18, r: 96, t: 18, b: 26 };
  const lo = $derived.by(() => {
    if (!live) return 60;
    let v = 100;
    for (const s of series) for (const x of s.data) if (x < v) v = x;
    return v - 4;
  });
  const hi = $derived.by(() => {
    if (!live) return 134;
    let v = 100;
    for (const s of series) for (const x of s.data) if (x > v) v = x;
    return v + 4;
  });
  const px = $derived((i: number) => PAD.l + (i / (N - 1)) * (W - PAD.l - PAD.r));
  const py = $derived((v: number) => H - PAD.b - ((v - lo) / ((hi - lo) || 1)) * (H - PAD.t - PAD.b));
  const y100 = $derived(py(100));
  const peerPaths = $derived(peers.map((s) => ({ ...s, d: pathD(s.data.map((v, i) => [px(i), py(v)] as [number, number])) })));
  const ihsgD = $derived(pathD(ihsg.data.map((v, i) => [px(i), py(v)] as [number, number])));
  // the loss wedge: the IHSG line, then back along the baseline
  const ihsgArea = $derived(`${ihsgD} L ${px(N - 1).toFixed(1)} ${y100.toFixed(1)} L ${px(0).toFixed(1)} ${y100.toFixed(1)} Z`);
  const WM_X = (PAD.l + W - PAD.r) / 2;
  const WM_Y = (PAD.t + H - PAD.b) / 2;

  const BULAN = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
  const bln = (iso: string) => BULAN[Number(iso.slice(5, 7)) - 1] ?? '';
  const x0Lab = $derived(live ? bln(live.tanggal[0] ?? '') : 'JAN');
  const x1Lab = $derived(live ? bln(live.tanggal[live.tanggal.length - 1] ?? '') : 'JUN');
  const eyebrow = $derived(live
    ? `BURSA, DIINDEKS KE 100 · ${x0Lab} → ${x1Lab} ${(live.tanggal[live.tanggal.length - 1] ?? '').slice(0, 4)}`
    : 'BURSA, DIINDEKS KE 100 · JAN → JUN 2026');
  const dek = $derived(live
    ? 'Bursa Jakarta dan tetangganya diukur dari titik yang sama, ditarik dari penutupan harian enam bulan terakhir.'
    : 'Empat bursa Asia diukur dari titik yang sama. Tiga indeks pembanding mencatat kenaikan; IHSG mencatat penurunan terbesar di antara indeks utama dunia.');
  const ihsgPct = $derived(ihsg.akhir - 100);
  const ariaSvg = $derived(live
    ? 'IHSG dibanding bursa Asia lain enam bulan terakhir, diindeks ke 100, data langsung'
    : 'IHSG dibanding bursa Vietnam, Thailand, India sepanjang 2026, diindeks ke 100, data contoh');

  let svgEl: SVGSVGElement | undefined = $state();
  let tampak = $state(false);
  $effect(() => {
    if (!svgEl) return;
    if (reducedMotion()) { svgEl.classList.add('in'); tampak = true; return; }
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) { tampak = true; io.disconnect(); }
    }, { threshold: 0.35 });
    io.observe(svgEl);
    return () => io.disconnect();
  });
  $effect(() => {
    void series; // redraw whenever the series swap (contoh -> langsung)
    if (!tampak || !svgEl || reducedMotion()) return;
    // peers draw first, quiet and staggered
    svgEl.querySelectorAll<SVGPathElement>('.jp-peer').forEach((el, k) => {
      const len = el.getTotalLength();
      gsap.fromTo(el, { strokeDasharray: len, strokeDashoffset: len },
        { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut', delay: k * 0.12 });
    });
    // then IHSG, last and slow: the deliberate plunge
    const line = svgEl.querySelector<SVGPathElement>('.jp-ihsg');
    if (line) {
      const len = line.getTotalLength();
      gsap.fromTo(line, { strokeDasharray: len, strokeDashoffset: len },
        { strokeDashoffset: 0, duration: 2.0, ease: EASE_PRESS, delay: 0.55 });
    }
    gsap.to(svgEl.querySelector('.jp-area'), { opacity: 1, duration: 1.0, delay: 1.4 });
    gsap.fromTo(svgEl.querySelectorAll('.jp-end-ihsg, .jp-dot-ihsg'),
      { opacity: 0, scale: 0, transformOrigin: 'center' },
      { opacity: 1, scale: 1, duration: 0.5, ease: EASE_STAMP, delay: 2.2 });
  });
</script>

<section class="jp" data-no-stempel data-ref="jci-peers">
  <div class="jp-head">
    <div>
      <span class="eyebrow">{eyebrow}</span>
      <p class="jp-dek">{dek}</p>
      {#if !live}
        <p class="jp-jujur fig">Menunggu sumber langsung; kurva di bawah adalah contoh bentuk, bukan data.</p>
      {/if}
    </div>
    <p class="jp-big num">{fmtPct(ihsgPct)}<span class="jp-unit"> {live ? 'IHSG · 6 BLN' : 'IHSG · YTD'}</span></p>
  </div>

  <svg bind:this={svgEl} viewBox="0 0 {W} {H}" width="100%" role="img" aria-label={ariaSvg}>
    <defs>
      <linearGradient id="jp-loss" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.22" />
        <stop offset="100%" stop-color="var(--accent)" stop-opacity="0" />
      </linearGradient>
    </defs>
    <path class="jp-area" d={ihsgArea} />
    <line class="jp-base" x1={PAD.l} x2={W - PAD.r} y1={y100} y2={y100} />
    <text class="jp-base-lab" x={PAD.l + 3} y={y100 - 5}>AWAL PERIODE · 100</text>
    {#if !live}
      <text class="jp-wm" x={WM_X} y={WM_Y} text-anchor="middle" transform={`rotate(-12 ${WM_X} ${WM_Y})`}>DATA CONTOH</text>
    {/if}

    {#each peerPaths as s (s.nama)}
      <path class="jp-line jp-peer" d={s.d} style={`stroke:${s.warna};stroke-width:${s.tebal}`} />
      <circle cx={px(N - 1)} cy={py(s.akhir)} r="2.6" style={`fill:${s.warna}`} />
      <text class="jp-end" x={px(N - 1) + 7} y={py(s.akhir) + 3.5}>{s.nama} {Math.round(s.akhir)}</text>
    {/each}

    <path class="jp-line jp-ihsg" d={ihsgD} />
    <circle class="jp-dot-ihsg" cx={px(N - 1)} cy={py(ihsg.akhir)} r="4.2" />
    <text class="jp-end jp-end-ihsg" x={px(N - 1) + 7} y={py(ihsg.akhir) + 1}>IHSG {Math.round(ihsg.akhir)}</text>
    {#if !live}
      <text class="jp-end-sub jp-end-ihsg" x={px(N - 1) + 7} y={py(ihsg.akhir) + 13}>−31% SEJAK JAN</text>
    {/if}

    <text class="jp-x0" x={PAD.l} y={H - 6}>{x0Lab}</text>
    <text class="jp-x1" x={W - PAD.r} y={H - 6} text-anchor="end">{x1Lab}</text>
  </svg>

  {#if live}
    <button class="chip"><span class="tick">⊙</span>yahoo · penutupan harian · langsung</button>
  {:else}
    <button class="chip"><span class="tick">⊙</span>data contoh · menunggu sumber langsung</button>
  {/if}
</section>

<style>
  .jp { display: grid; gap: 14px; }
  .jp-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; flex-wrap: wrap; }
  .jp-dek { font-size: 14px; color: var(--muted); max-width: 52ch; line-height: 1.5; margin-top: 8px; }
  .jp-jujur { font-size: 12.5px; margin-top: 6px; max-width: 52ch; }
  .jp-big { font-family: 'Fraunces Variable', serif; font-weight: 340; font-size: clamp(34px, 5vw, 56px); line-height: 0.9; color: var(--accent); white-space: nowrap; }
  .jp-unit { font-size: 0.26em; color: var(--muted); letter-spacing: 0.08em; }
  svg { display: block; }
  .jp-line { fill: none; }
  .jp-area { fill: url(#jp-loss); opacity: 0; }
  .jp.in .jp-area, svg.in .jp-area { opacity: 1; }
  .jp-base { stroke: var(--line); stroke-width: 0.8; stroke-dasharray: 3 4; opacity: 0.7; }
  .jp-base-lab, svg text { font-family: var(--font-mono); font-size: 8.5px; letter-spacing: 0.1em; fill: var(--muted); }
  .jp-wm { font-family: var(--font-mono); font-size: 30px; letter-spacing: 0.3em; fill: var(--ink); opacity: 0.08; pointer-events: none; }
  .jp-end { font-size: 9.5px; letter-spacing: 0.08em; }
  /* the featured value wears Fraunces; peer annotations stay mono */
  .jp-end-ihsg { fill: var(--accent); font-family: 'Fraunces Variable', serif; font-weight: 340; font-size: 12.5px; letter-spacing: 0; opacity: 0; }
  .jp-dot-ihsg { fill: var(--accent); opacity: 0; }
  .jp-end-sub { font-size: 7.5px; letter-spacing: 0.12em; }
  /* reduced-motion resting state: everything visible without animation */
  svg.in .jp-end-ihsg, svg.in .jp-dot-ihsg { opacity: 1; }
  .chip { align-self: flex-start; }
</style>
