<script lang="ts">
  /**
   * Gradien Keadilan: kerugian (log) × vonis. New rulings fall like sediment;
   * the day's additions glow, then settle. Sample data, marked contoh.
   */
  import { onMount } from 'svelte';
  import { PUTUSAN } from '../lib/data/edisi';
  import { gsap, EASE_SETTLE, reducedMotion } from '../lib/motion';

  const W = 620;
  const H = 360;
  const PAD = { l: 52, r: 16, t: 16, b: 40 };

  const xMin = Math.log10(1e5);
  const xMax = Math.log10(1e11);
  const x = (v: number) => PAD.l + ((Math.log10(v) - xMin) / (xMax - xMin)) * (W - PAD.l - PAD.r);
  const y = (v: number) => H - PAD.b - (v / 52) * (H - PAD.t - PAD.b);

  const dots = PUTUSAN.map((p) => ({ ...p, cx: x(p.kerugian), cy: y(p.vonis) }));

  // fitted curve: simple log-linear trend over the sample
  const trend = (() => {
    const pts = PUTUSAN.map((p) => [Math.log10(p.kerugian), p.vonis]);
    const n = pts.length;
    const mx = pts.reduce((s, p) => s + p[0]!, 0) / n;
    const my = pts.reduce((s, p) => s + p[1]!, 0) / n;
    const b = pts.reduce((s, p) => s + (p[0]! - mx) * (p[1]! - my), 0) / pts.reduce((s, p) => s + (p[0]! - mx) ** 2, 0);
    const a = my - b * mx;
    return { a, b };
  })();
  const trendPath = `M ${x(10 ** 5.2)} ${y(trend.a + trend.b * 5.2)} L ${x(10 ** 10.8)} ${y(trend.a + trend.b * 10.8)}`;

  let svgEl: SVGSVGElement;
  let hover: (typeof dots)[number] | null = $state(null);
  let tipX = $state(0);
  let tipY = $state(0);

  const fmtRp = (v: number) =>
    v >= 1e9 ? `Rp ${(v / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 1 })} M`
    : v >= 1e6 ? `Rp ${(v / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`
    : `Rp ${(v / 1e3).toLocaleString('id-ID', { maximumFractionDigits: 0 })} rb`;

  function drop() {
    if (reducedMotion()) return;
    const circles = svgEl.querySelectorAll('circle.dot');
    gsap.fromTo(circles,
      { attr: { cy: -16 }, opacity: 0 },
      {
        attr: { cy: (i: number) => dots[i]!.cy },
        opacity: 1,
        duration: 1.1,
        ease: 'bounce.out',
        stagger: { each: 0.05, from: 'random' },
      });
    const t = svgEl.querySelector('path.trend');
    if (t) gsap.fromTo(t, { opacity: 0 }, { opacity: 1, duration: 0.8, delay: 1.2, ease: EASE_SETTLE });
  }

  onMount(() => {
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) { drop(); io.disconnect(); }
    }, { threshold: 0.35 });
    io.observe(svgEl);
    return () => io.disconnect();
  });

  function enter(d: (typeof dots)[number], e: PointerEvent) {
    hover = d;
    tipX = e.clientX;
    tipY = e.clientY;
  }
</script>

<div class="gk card" data-no-stempel>
  <div class="gk-head">
    <h3 class="gk-title display">Gradien Keadilan</h3>
    <button class="chip" onclick={drop}>↻ Putar ulang</button>
  </div>
  <p class="gk-sub">Kerugian negara (log) × vonis penjara. Titik jatuh seperti sedimen. <span class="mono">(data contoh)</span></p>

  <svg bind:this={svgEl} viewBox="0 0 {W} {H}" width="100%" role="img" aria-label="Diagram pencar vonis terhadap kerugian negara, data contoh">
    {#each [0, 12, 24, 36, 48] as v}
      <line class="grid" x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} />
      <text x={PAD.l - 8} y={y(v) + 3} text-anchor="end">{v}</text>
    {/each}
    {#each [6, 7, 8, 9, 10] as e}
      <text x={x(10 ** e)} y={H - PAD.b + 16} text-anchor="middle">10^{e}</text>
    {/each}
    <text x={PAD.l - 36} y={PAD.t + 4} class="axis-label">bulan</text>
    <path class="trend" d={trendPath} />
    {#each dots as d (d.id)}
      <circle
        class="dot {d.jenis}"
        cx={d.cx}
        cy={d.cy}
        r={d.jenis === 'korupsi' ? 5.5 : 4}
        role="presentation"
        onpointerenter={(e) => enter(d, e)}
        onpointerleave={() => (hover = null)}
      />
    {/each}
  </svg>

  <div class="gk-legend mono">
    <span><i class="sw korupsi"></i>Korupsi</span>
    <span><i class="sw pencurian"></i>Pencurian ringan</span>
    <span><i class="sw garis"></i>Kurva tren</span>
  </div>
  <p class="figcap fig">Fig. 2. · Gradien vonis terhadap kerugian negara, putusan berkekuatan tetap.</p>
</div>

{#if hover}
  <div class="gk-tip mono" style="transform: translate({tipX}px, {tipY - 14}px)">
    <b>{hover.id}</b> · {fmtRp(hover.kerugian)} · vonis {hover.vonis} bulan
  </div>
{/if}

<style>
  .gk-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .gk-title { font-size: clamp(22px, 3vw, 30px); }
  .gk-sub { font-size: 13px; color: var(--muted); margin: 6px 0 12px; }
  svg text { font-family: var(--font-mono); font-size: 10px; fill: var(--muted); }
  .grid { stroke: var(--line); stroke-dasharray: 2 5; opacity: 0.7; }
  .trend { stroke: var(--accent2); stroke-width: 1.6; fill: none; stroke-dasharray: 5 5; }
  .dot { cursor: crosshair; transition: r 0.2s; }
  .dot.korupsi { fill: var(--accent); }
  .dot.pencurian { fill: var(--muted); }
  .dot:hover { r: 8; }
  .gk-legend { display: flex; gap: 18px; font-size: 11px; color: var(--muted); margin-top: 10px; flex-wrap: wrap; }
  .sw { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 6px; }
  .sw.korupsi { background: var(--accent); }
  .sw.pencurian { background: var(--muted); }
  .sw.garis { border-radius: 0; height: 0; width: 14px; border-top: 2px dashed var(--accent2); vertical-align: middle; }
  .figcap { font-size: 13.5px; margin-top: 12px; text-align: center; }
  .gk-tip {
    position: fixed; left: 0; top: 0; z-index: 130; pointer-events: none;
    background: var(--ink); color: var(--bg);
    font-size: 11px; padding: 6px 9px; white-space: nowrap;
    translate: -50% -100%;
  }
</style>
