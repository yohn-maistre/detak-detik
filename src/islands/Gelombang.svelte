<script lang="ts">
  /** Gelombang Harga: the line draws itself in pale gold. Sample data. */
  import { onMount } from 'svelte';
  import { HARGA } from '../lib/data/edisi';
  import { gsap, reducedMotion } from '../lib/motion';

  const W = 560;
  const H = 240;
  const PAD = 18;

  const min = Math.min(...HARGA);
  const max = Math.max(...HARGA);
  const px = (i: number) => PAD + (i / (HARGA.length - 1)) * (W - PAD * 2);
  const py = (v: number) => H - PAD - ((v - min) / (max - min)) * (H - PAD * 2);

  const path = HARGA.map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(' ');
  const last = HARGA[HARGA.length - 1]!;

  let pathEl: SVGPathElement;
  let dotEl: SVGCircleElement;

  function draw() {
    if (reducedMotion()) return;
    const len = pathEl.getTotalLength();
    gsap.fromTo(pathEl,
      { strokeDasharray: len, strokeDashoffset: len },
      { strokeDashoffset: 0, duration: 2.4, ease: 'power2.inOut' });
    gsap.fromTo(dotEl, { opacity: 0 }, { opacity: 1, duration: 0.3, delay: 2.3 });
  }

  onMount(() => {
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) { draw(); io.disconnect(); }
    }, { threshold: 0.4 });
    io.observe(pathEl);
    return () => io.disconnect();
  });
</script>

<div class="gw" data-no-stempel>
  <div class="gw-head">
    <h3 class="display">Gelombang Harga</h3>
    <button class="chip" onclick={draw}>↻</button>
  </div>
  <p class="gw-sub">Cabai rawit, indeks 30 hari. Garis menggambar dirinya. <span class="mono">(data contoh)</span></p>
  <svg viewBox="0 0 {W} {H}" width="100%" role="img" aria-label="Grafik garis harga cabai rawit 30 hari, data contoh">
    <path bind:this={pathEl} class="wave" d={path} />
    <circle bind:this={dotEl} class="pulse" cx={px(HARGA.length - 1)} cy={py(last)} r="4.5" />
  </svg>
  <div class="gw-foot mono">
    <span>−30 HARI</span>
    <span class="up">▲ +{Math.round(((last - HARGA[0]!) / HARGA[0]!) * 100)}% · HARI INI</span>
  </div>
</div>

<style>
  .gw-head { display: flex; justify-content: space-between; align-items: baseline; }
  .gw-head h3 { font-size: clamp(20px, 2.6vw, 28px); }
  .gw-sub { font-size: 13px; color: var(--muted); margin: 6px 0 10px; }
  .wave { fill: none; stroke: var(--accent2); stroke-width: 2.2; }
  .pulse { fill: var(--accent2); }
  .pulse:not(:root) { animation: pulse 2.4s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
  @keyframes pulse { 50% { opacity: 0.45; } }
  .gw-foot { display: flex; justify-content: space-between; font-size: 10.5px; letter-spacing: 0.12em; color: var(--muted); margin-top: 8px; }
  .gw-foot .up { color: var(--accent2); }
  @media (prefers-reduced-motion: reduce) { .pulse:not(:root) { animation: none; } }
</style>
