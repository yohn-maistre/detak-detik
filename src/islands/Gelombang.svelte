<script lang="ts">
  /** Gelombang Harga: the line draws itself in pale gold over its own
      shadow-area, the endpoint carries the price, and a finger on the
      chart scrubs day by day like rewinding a tape. Sample data. */
  import { onMount } from 'svelte';
  import { HARGA } from '../lib/data/edisi';
  import { gsap, reducedMotion } from '../lib/motion';

  const W = 560;
  const H = 250;
  const PAD = { l: 16, r: 64, t: 24, b: 26 };

  const min = Math.min(...HARGA);
  const max = Math.max(...HARGA);
  const px = (i: number) => PAD.l + (i / (HARGA.length - 1)) * (W - PAD.l - PAD.r);
  const py = (v: number) => H - PAD.b - ((v - min) / (max - min)) * (H - PAD.t - PAD.b);

  const path = HARGA.map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(' ');
  const area = `${path} L ${px(HARGA.length - 1).toFixed(1)} ${H - PAD.b} L ${PAD.l} ${H - PAD.b} Z`;
  const first = HARGA[0]!;
  const last = HARGA[HARGA.length - 1]!;
  const naik = Math.round(((last - first) / first) * 100);

  let svgEl: SVGSVGElement;
  let pathEl: SVGPathElement;
  let areaEl: SVGPathElement;
  let dotEl: SVGCircleElement;
  let scrub = $state<number | null>(null);

  function draw() {
    if (reducedMotion()) return;
    const len = pathEl.getTotalLength();
    gsap.fromTo(pathEl,
      { strokeDasharray: len, strokeDashoffset: len },
      { strokeDashoffset: 0, duration: 2.4, ease: 'power2.inOut' });
    gsap.fromTo(areaEl, { opacity: 0 }, { opacity: 1, duration: 1.2, delay: 1.4 });
    gsap.fromTo(dotEl, { opacity: 0 }, { opacity: 1, duration: 0.3, delay: 2.3 });
  }

  onMount(() => {
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) { draw(); io.disconnect(); }
    }, { threshold: 0.4 });
    io.observe(pathEl);
    return () => io.disconnect();
  });

  function onScrub(e: PointerEvent) {
    const r = svgEl.getBoundingClientRect();
    const gx = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((gx - PAD.l) / (W - PAD.l - PAD.r)) * (HARGA.length - 1));
    scrub = i >= 0 && i < HARGA.length ? i : null;
  }
</script>

<div class="gw" data-no-stempel>
  <div class="gw-head">
    <h3 class="display">Gelombang Harga</h3>
    <button class="chip" onclick={draw}>↻</button>
  </div>
  <p class="gw-sub">Cabai rawit, indeks 30 hari. Telusuri grafik untuk membaca hari demi hari. <span class="mono">(data contoh)</span></p>
  <svg
    bind:this={svgEl}
    viewBox="0 0 {W} {H}"
    width="100%"
    role="img"
    aria-label="Grafik garis harga cabai rawit 30 hari, data contoh"
    onpointermove={onScrub}
    onpointerleave={() => (scrub = null)}
  >
    <defs>
      <linearGradient id="gw-fill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--accent2)" stop-opacity="0.22" />
        <stop offset="100%" stop-color="var(--accent2)" stop-opacity="0" />
      </linearGradient>
    </defs>

    <line class="base" x1={PAD.l} x2={W - PAD.r} y1={py(first)} y2={py(first)} />
    <text class="base-label" x={PAD.l} y={py(first) - 6}>AWAL · {first}</text>

    <path bind:this={areaEl} class="area" d={area} />
    <path bind:this={pathEl} class="wave" d={path} />
    <circle bind:this={dotEl} class="pulse" cx={px(HARGA.length - 1)} cy={py(last)} r="4.5" />

    <g class="endcap">
      <text class="end-val num" x={px(HARGA.length - 1) + 12} y={py(last) + 4}>{last}</text>
      <text class="end-sub" x={px(HARGA.length - 1) + 12} y={py(last) + 17}>▲ +{naik}%</text>
    </g>

    {#if scrub !== null}
      <line class="scrub-line" x1={px(scrub)} x2={px(scrub)} y1={PAD.t - 6} y2={H - PAD.b} />
      <circle class="scrub-dot" cx={px(scrub)} cy={py(HARGA[scrub]!)} r="5" />
      <text class="scrub-read num" x={px(scrub)} y={PAD.t - 12} text-anchor="middle">
        H−{HARGA.length - 1 - scrub} · {HARGA[scrub]}
      </text>
    {/if}
  </svg>
  <div class="gw-foot mono">
    <span>−30 HARI</span>
    <span class="up">▲ +{naik}% · HARI INI</span>
  </div>
</div>

<style>
  .gw-head { display: flex; justify-content: space-between; align-items: baseline; }
  .gw-head h3 { font-size: clamp(20px, 2.6vw, 28px); }
  .gw-sub { font-size: 13px; color: var(--muted); margin: 6px 0 10px; }
  svg { touch-action: pan-y; cursor: crosshair; }
  .wave { fill: none; stroke: var(--accent2); stroke-width: 2.2; }
  .area { fill: url(#gw-fill); }
  .base { stroke: var(--muted); stroke-width: 0.7; stroke-dasharray: 3 5; opacity: 0.7; }
  .base-label { font-family: var(--font-mono); font-size: 8.5px; letter-spacing: 0.14em; fill: var(--muted); }
  .pulse { fill: var(--accent2); }
  .pulse:not(:root) { animation: pulse 2.4s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
  @keyframes pulse { 50% { opacity: 0.45; } }
  .end-val { font-family: var(--font-mono); font-size: 15px; font-weight: 700; fill: var(--accent2); }
  .end-sub { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.08em; fill: var(--muted); }
  .scrub-line { stroke: var(--ink); stroke-width: 0.7; opacity: 0.6; }
  .scrub-dot { fill: var(--ink); }
  .scrub-read { font-family: var(--font-mono); font-size: 10.5px; fill: var(--ink); }
  .gw-foot { display: flex; justify-content: space-between; font-size: 10.5px; letter-spacing: 0.12em; color: var(--muted); margin-top: 8px; }
  .gw-foot .up { color: var(--accent2); }
  @media (prefers-reduced-motion: reduce) { .pulse:not(:root) { animation: none; } }
</style>
