<script lang="ts">
  /** Harga Pangan: one wave, seven staples. Pick the commodity; the line
      redraws itself. Series are deterministic samples (marked contoh) in
      the exact shape the Panel Harga Bapanas pipeline will pour into. */
  import { gsap, reducedMotion } from '../lib/motion';
  import { rngFrom } from '../lib/seed';

  type Komoditas = { id: string; nama: string; satuan: string; dasar: number; goyang: number; tren: number };
  const ROSTER: Komoditas[] = [
    { id: 'cabai', nama: 'Cabai rawit', satuan: 'kg', dasar: 52_000, goyang: 0.10, tren: 0.022 },
    { id: 'beras', nama: 'Beras medium', satuan: 'kg', dasar: 14_800, goyang: 0.006, tren: 0.0012 },
    { id: 'migor', nama: 'Minyak goreng', satuan: 'l', dasar: 18_300, goyang: 0.008, tren: 0.0006 },
    { id: 'telur', nama: 'Telur ayam', satuan: 'kg', dasar: 28_400, goyang: 0.02, tren: 0.003 },
    { id: 'bawang', nama: 'Bawang merah', satuan: 'kg', dasar: 38_500, goyang: 0.05, tren: -0.004 },
    { id: 'gula', nama: 'Gula pasir', satuan: 'kg', dasar: 17_900, goyang: 0.007, tren: 0.001 },
    { id: 'ayam', nama: 'Daging ayam', satuan: 'kg', dasar: 37_200, goyang: 0.025, tren: 0.0018 },
  ];

  function seri(k: Komoditas): number[] {
    const rng = rngFrom(`harga-${k.id}-edisi-41`);
    const out: number[] = [];
    let v = k.dasar;
    for (let i = 0; i < 30; i++) {
      v *= 1 + k.tren + (rng() - 0.5) * 2 * k.goyang;
      out.push(Math.round(v / 50) * 50);
    }
    return out;
  }

  const W = 560;
  const H = 250;
  const PAD = { l: 16, r: 64, t: 24, b: 26 };

  let pilihan = $state(ROSTER[0]!);
  const data = $derived(seri(pilihan));
  // "kisaran wajar": the first-week average ± 8% — anything outside reads as
  // above or below normal at a glance, without a verdict in words
  const normal = $derived(data.slice(0, 7).reduce((a, b) => a + b, 0) / 7);
  const bandHi = $derived(normal * 1.08);
  const bandLo = $derived(normal * 0.92);
  const min = $derived(Math.min(...data, bandLo));
  const max = $derived(Math.max(...data, bandHi));
  const px = (i: number) => PAD.l + (i / 29) * (W - PAD.l - PAD.r);
  const py = $derived((v: number) => H - PAD.b - ((v - min) / (max - min || 1)) * (H - PAD.t - PAD.b));
  const path = $derived(data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(' '));
  const area = $derived(`${path} L ${px(29).toFixed(1)} ${H - PAD.b} L ${PAD.l} ${H - PAD.b} Z`);
  const ubah = $derived(Math.round(((data[29]! - data[0]!) / data[0]!) * 100));
  const status = $derived(data[29]! > bandHi ? 'DI ATAS WAJAR' : data[29]! < bandLo ? 'DI BAWAH WAJAR' : 'DALAM KISARAN WAJAR');
  const statusNada = $derived(data[29]! > bandHi ? 'buruk' : 'datar');

  let svgEl: SVGSVGElement;
  let pathEl: SVGPathElement | undefined = $state();
  let scrub = $state<number | null>(null);

  const fmt = new Intl.NumberFormat('id-ID');

  function draw() {
    if (reducedMotion() || !pathEl) return;
    const len = pathEl.getTotalLength();
    gsap.fromTo(pathEl,
      { strokeDasharray: len, strokeDashoffset: len },
      { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut' });
  }

  function pilih(k: Komoditas) {
    if (k.id === pilihan.id) return;
    pilihan = k;
    scrub = null;
    requestAnimationFrame(draw);
  }

  $effect(() => {
    if (!pathEl) return;
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) { draw(); io.disconnect(); }
    }, { threshold: 0.4 });
    io.observe(pathEl);
    return () => io.disconnect();
  });

  function onScrub(e: PointerEvent) {
    const r = svgEl.getBoundingClientRect();
    const gx = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((gx - PAD.l) / (W - PAD.l - PAD.r)) * 29);
    scrub = i >= 0 && i < 30 ? i : null;
  }
</script>

<div class="gw" data-no-stempel>
  <div class="gw-head">
    <div>
      <span class="inkbar gw-bar"><span class="dot">●</span>§4 · HARGA PANGAN</span>
      <h3 class="display">Harga Pangan</h3>
      <span class="eyebrow">30 HARI · PANEL HARGA BAPANAS · (DATA CONTOH)</span>
    </div>
    <span class={`gw-status mono ${statusNada}`}>{status}</span>
  </div>
  <div class="gw-roster">
    {#each ROSTER as k (k.id)}
      <button class="chip" class:aktif={pilihan.id === k.id} onclick={() => pilih(k)}>{k.nama}</button>
    {/each}
  </div>
  <svg
    bind:this={svgEl}
    viewBox="0 0 {W} {H}"
    width="100%"
    role="img"
    aria-label={`Grafik harga ${pilihan.nama} 30 hari, data contoh`}
    onpointermove={onScrub}
    onpointerleave={() => (scrub = null)}
  >
    <defs>
      <linearGradient id="gw-fill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.16" />
        <stop offset="100%" stop-color="var(--accent)" stop-opacity="0" />
      </linearGradient>
    </defs>
    <rect class="band" x={PAD.l} y={py(bandHi)} width={W - PAD.l - PAD.r} height={Math.max(0, py(bandLo) - py(bandHi))} />
    <line class="band-line" x1={PAD.l} x2={W - PAD.r} y1={py(normal)} y2={py(normal)} />
    <text class="band-label" x={PAD.l + 4} y={py(bandHi) - 4}>KISARAN WAJAR</text>
    <path class="area" d={area} />
    <path bind:this={pathEl} class="wave" d={path} />
    <circle class="pulse" cx={px(29)} cy={py(data[29]!)} r="4" />
    <text class="end-val num" x={px(29) + 8} y={py(data[29]!) + 4}>Rp {fmt.format(data[29]!)}</text>
    <text class="end-sub" x={px(29) + 8} y={py(data[29]!) + 16}>{ubah >= 0 ? '▲+' : '▼'}{ubah}%/{pilihan.satuan}</text>
    {#if scrub !== null}
      <line class="scrub-line" x1={px(scrub)} x2={px(scrub)} y1={PAD.t - 6} y2={H - PAD.b} />
      <circle class="scrub-dot" cx={px(scrub)} cy={py(data[scrub]!)} r="5" />
      <text class="scrub-read num" x={px(scrub)} y={PAD.t - 12} text-anchor="middle">
        H−{29 - scrub} · Rp {fmt.format(data[scrub]!)}
      </text>
    {/if}
  </svg>
  <div class="gw-foot mono">
    <span>−30 HARI</span>
    <span class="up">{pilihan.nama.toUpperCase()} · {ubah >= 0 ? `▲ +${ubah}%` : `▼ ${ubah}%`} · HARI INI</span>
  </div>
</div>

<style>
  .gw-bar { display: inline-flex; margin-bottom: 8px; }
  .gw-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; flex-wrap: wrap; }
  .gw-head h3 { font-size: clamp(20px, 2.6vw, 28px); }
  .gw-roster { display: flex; flex-wrap: wrap; gap: 7px; margin: 12px 0 6px; }
  .chip.aktif { background: var(--ink); color: var(--bg); border-color: var(--ink); }
  .chip.aktif :global(.tick) { color: var(--bg); }
  svg { touch-action: pan-y; cursor: crosshair; }
  .wave { fill: none; stroke: var(--accent); stroke-width: 2.2; }
  .area { fill: url(#gw-fill); }
  .band { fill: var(--muted); opacity: 0.10; }
  .band-line { stroke: var(--muted); stroke-width: 0.6; stroke-dasharray: 2 4; opacity: 0.6; }
  .band-label { font-family: var(--font-mono); font-size: 7.5px; letter-spacing: 0.14em; fill: var(--muted); }
  .gw-status { font-size: 9px; letter-spacing: 0.16em; padding: 4px 8px; border: 1px solid currentColor; }
  .gw-status.buruk { color: var(--accent); }
  .gw-status.datar { color: var(--muted); }
  .pulse { fill: var(--accent); animation: pulse 2.4s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
  @keyframes pulse { 50% { opacity: 0.45; } }
  .end-val { font-family: var(--font-mono); font-size: 12px; font-weight: 700; fill: var(--accent); }
  .end-sub { font-family: var(--font-mono); font-size: 8.5px; letter-spacing: 0.04em; fill: var(--muted); }
  .scrub-line { stroke: var(--ink); stroke-width: 0.7; opacity: 0.6; }
  .scrub-dot { fill: var(--ink); }
  .scrub-read { font-family: var(--font-mono); font-size: 10.5px; fill: var(--ink); }
  .gw-foot { display: flex; justify-content: space-between; font-size: 10.5px; letter-spacing: 0.12em; color: var(--muted); margin-top: 8px; }
  .gw-foot .up { color: var(--accent); }
  @media (prefers-reduced-motion: reduce) { .pulse { animation: none; } }
</style>
