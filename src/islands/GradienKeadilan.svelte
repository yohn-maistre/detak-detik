<script lang="ts">
  /**
   * Gradien Keadilan: kerugian (log) × vonis. New rulings fall like sediment;
   * the trend wears a ±1σ band, and the day's outlier carries its own caption
   * with a leader line. Crosshair hover reads both axes in plain rupiah.
   * Sample data, marked contoh.
   */
  import { onMount } from 'svelte';
  import { gsap, EASE_SETTLE, reducedMotion } from '../lib/motion';
  // korupsi dots: one owner — the hukum desk's own registry (still contoh
  // until the curated-real putusan pass; the chip below says so)
  import HUKUM from '../../newsroom/data/hukum_putusan.json';

  // the petty-theft comparison rows: contoh until sourced (documented cases
  // exist; curation task on the needs-from-Yose ledger). The CONTRAST —
  // small theft, long months; vast corruption, few months — is the chart.
  const PENCURIAN_CONTOH = [
    { kerugian: 1.2e6, vonis: 14, jenis: 'pencurian' as const, id: 'p-001' },
    { kerugian: 4.5e5, vonis: 8, jenis: 'pencurian' as const, id: 'p-002' },
    { kerugian: 2.4e6, vonis: 18, jenis: 'pencurian' as const, id: 'p-003' },
    { kerugian: 8.0e5, vonis: 10, jenis: 'pencurian' as const, id: 'p-004' },
    { kerugian: 3.1e6, vonis: 20, jenis: 'pencurian' as const, id: 'p-005' },
    { kerugian: 6.2e5, vonis: 7, jenis: 'pencurian' as const, id: 'p-006' },
    { kerugian: 1.8e6, vonis: 16, jenis: 'pencurian' as const, id: 'p-007' },
    { kerugian: 9.4e5, vonis: 12, jenis: 'pencurian' as const, id: 'p-008' },
  ];
  const PUTUSAN = [
    ...PENCURIAN_CONTOH,
    ...(HUKUM.putusan ?? []).map((p: { id: string; kerugian_negara: number; vonis_bulan: number }) => ({
      kerugian: p.kerugian_negara,
      vonis: p.vonis_bulan,
      jenis: 'korupsi' as const,
      id: p.id.replace('putusan:', ''),
    })),
  ];

  const W = 620;
  const H = 380;
  const PAD = { l: 46, r: 18, t: 30, b: 44 };

  const xMin = Math.log10(1e5);
  const xMax = Math.log10(1e11);
  const x = (v: number) => PAD.l + ((Math.log10(v) - xMin) / (xMax - xMin)) * (W - PAD.l - PAD.r);
  const y = (v: number) => H - PAD.b - (v / 52) * (H - PAD.t - PAD.b);
  const invX = (px: number) => 10 ** (xMin + ((px - PAD.l) / (W - PAD.l - PAD.r)) * (xMax - xMin));
  const invY = (py: number) => ((H - PAD.b - py) / (H - PAD.t - PAD.b)) * 52;

  const dots = PUTUSAN.map((p) => ({ ...p, cx: x(p.kerugian), cy: y(p.vonis) }));

  // fitted curve + residual σ: the band is the chart's honesty about spread
  const fit = (() => {
    const pts = PUTUSAN.map((p) => [Math.log10(p.kerugian), p.vonis] as const);
    const n = pts.length;
    const mx = pts.reduce((s, p) => s + p[0], 0) / n;
    const my = pts.reduce((s, p) => s + p[1], 0) / n;
    const b = pts.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0) / pts.reduce((s, p) => s + (p[0] - mx) ** 2, 0);
    const a = my - b * mx;
    const sigma = Math.sqrt(pts.reduce((s, p) => s + (p[1] - (a + b * p[0])) ** 2, 0) / (n - 2));
    return { a, b, sigma };
  })();
  const lx0 = 5.2;
  const lx1 = 10.8;
  const ty = (lx: number) => fit.a + fit.b * lx;
  const trendPath = `M ${x(10 ** lx0)} ${y(ty(lx0))} L ${x(10 ** lx1)} ${y(ty(lx1))}`;
  const yClamp = (v: number) => Math.min(H - PAD.b, Math.max(PAD.t, y(v)));
  const bandPath = [
    `M ${x(10 ** lx0)} ${yClamp(ty(lx0) + fit.sigma)}`,
    `L ${x(10 ** lx1)} ${yClamp(ty(lx1) + fit.sigma)}`,
    `L ${x(10 ** lx1)} ${yClamp(ty(lx1) - fit.sigma)}`,
    `L ${x(10 ** lx0)} ${yClamp(ty(lx0) - fit.sigma)} Z`,
  ].join(' ');

  // the outlier caption: the korupsi ruling farthest BELOW the fitted trend
  // (max negative residual — the most months "missing" for its scale),
  // computed from the data, never hand-picked
  const sorot = dots
    .filter((d) => d.jenis === 'korupsi')
    .reduce((a, d) => (d.vonis - ty(Math.log10(d.kerugian)) < a.vonis - ty(Math.log10(a.kerugian)) ? d : a));

  /* the hand-drawn outlier ring (the site's scribble idiom, in SVG): a wobbled
     circle that overshoots past 360° like a real pen stroke. Deterministic
     wobble — no RNG, so server and client draw the same ink. */
  function scribbleRing(cx: number, cy: number, r: number): string {
    const pts: string[] = [];
    const N = 22;
    for (let i = 0; i <= N + 3; i++) {
      const a = (i / N) * Math.PI * 2 - Math.PI / 3;
      const wob = 1 + 0.09 * Math.sin(i * 2.7) + 0.06 * Math.cos(i * 4.3);
      const rr = r * wob + (i > N ? (i - N) * 0.9 : 0);
      pts.push(`${(cx + Math.cos(a) * rr * 1.15).toFixed(1)} ${(cy + Math.sin(a) * rr * 0.88).toFixed(1)}`);
    }
    return 'M ' + pts.join(' L ');
  }

  const TICKS_X = [
    { v: 1e6, label: 'Rp 1 jt' },
    { v: 1e7, label: '10 jt' },
    { v: 1e8, label: '100 jt' },
    { v: 1e9, label: '1 M' },
    { v: 1e10, label: '10 M' },
    { v: 1e11, label: '100 M' },
  ];

  let svgEl: SVGSVGElement;
  let hover: (typeof dots)[number] | null = $state(null);
  let cross = $state<{ x: number; y: number } | null>(null);
  let tipX = $state(0);
  let tipY = $state(0);

  const fmtRp = (v: number) =>
    v >= 1e12 ? `Rp ${(v / 1e12).toLocaleString('id-ID', { maximumFractionDigits: 1 })} T`
    : v >= 1e9 ? `Rp ${(v / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 1 })} M`
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
    const band = svgEl.querySelector('path.band');
    if (band) gsap.fromTo(band, { opacity: 0 }, { opacity: 0.07, duration: 0.9, delay: 1.1 });
    const t = svgEl.querySelector('path.trend');
    if (t) {
      const len = (t as SVGPathElement).getTotalLength();
      gsap.fromTo(t,
        { strokeDasharray: `${len}`, strokeDashoffset: len, opacity: 1 },
        { strokeDashoffset: 0, duration: 1.0, delay: 1.2, ease: 'power2.inOut',
          onComplete: () => gsap.set(t, { strokeDasharray: '5 5' }) });
    }
    const note = svgEl.querySelector('g.sorot');
    if (note) gsap.fromTo(note, { opacity: 0 }, { opacity: 1, duration: 0.7, delay: 2.0, ease: EASE_SETTLE });
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

  function moveCross(e: PointerEvent) {
    const r = svgEl.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const py = ((e.clientY - r.top) / r.height) * H;
    if (px < PAD.l || px > W - PAD.r || py < PAD.t || py > H - PAD.b) { cross = null; return; }
    cross = { x: px, y: py };
  }
</script>

<div class="gk card" data-no-stempel>
  <div class="gk-head">
    <h3 class="gk-title display">Gradien Keadilan</h3>
    <button class="chip" onclick={drop}>↻ Putar ulang</button>
  </div>
  <p class="gk-sub">Kerugian negara (log) × vonis penjara. Setiap titik adalah satu putusan. <span class="mono">(data contoh)</span></p>

  <span class="viz-cap" aria-hidden="true">DATA CONTOH</span>
  <svg
    bind:this={svgEl}
    viewBox="0 0 {W} {H}"
    width="100%"
    role="img"
    aria-label="Diagram pencar vonis terhadap kerugian negara, data contoh"
    onpointermove={moveCross}
    onpointerleave={() => (cross = null)}
  >
    {#each [0, 12, 24, 36, 48] as v}
      <line class="grid" x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} />
      <text x={PAD.l - 8} y={y(v) + 3} text-anchor="end">{v}</text>
    {/each}
    {#each TICKS_X as t}
      <line class="grid gx" x1={x(t.v)} x2={x(t.v)} y1={H - PAD.b} y2={H - PAD.b + 5} />
      <text x={x(t.v)} y={H - PAD.b + 18} text-anchor="middle">{t.label}</text>
    {/each}
    <line class="axis" x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} />
    <text x={PAD.l - 36} y={PAD.t - 12} class="axis-label">VONIS · BULAN</text>
    <text x={W - PAD.r} y={H - PAD.b + 34} text-anchor="end" class="axis-label">KERUGIAN NEGARA · LOG</text>

    <path class="band" d={bandPath} />
    <path class="trend" d={trendPath} />

    {#if cross}
      <line class="cross" x1={cross.x} x2={cross.x} y1={PAD.t} y2={H - PAD.b} />
      <line class="cross" x1={PAD.l} x2={W - PAD.r} y1={cross.y} y2={cross.y} />
      <text class="cross-read" x={cross.x} y={PAD.t - 2} text-anchor="middle">{fmtRp(invX(cross.x))}</text>
      <text class="cross-read" x={W - PAD.r} y={cross.y - 5} text-anchor="end">{invY(cross.y).toFixed(0)} bln</text>
    {/if}

    {#each dots as d (d.id)}
      <circle
        class="dot {d.jenis}"
        class:dim={hover && hover !== d}
        cx={d.cx}
        cy={d.cy}
        r={d.jenis === 'korupsi' ? 5.5 : 4}
        role="presentation"
        onpointerenter={(e) => enter(d, e)}
        onpointerleave={() => (hover = null)}
      />
    {/each}

    <g class="sorot" opacity={reducedMotion() ? 1 : 0}>
      <line x1={sorot.cx + 8} y1={sorot.cy - 8} x2={sorot.cx + 56} y2={sorot.cy - 52} />
      <path class="sorot-ring" d={scribbleRing(sorot.cx, sorot.cy, 11)} />
      <text x={sorot.cx + 60} y={sorot.cy - 58} class="sorot-teks">№ {sorot.id} · {fmtRp(sorot.kerugian)} → {sorot.vonis} bln</text>
      <text x={sorot.cx + 60} y={sorot.cy - 44} class="sorot-teks sub">3σ di bawah kurva tren</text>
    </g>
  </svg>

  <div class="gk-legend mono">
    <span><i class="sw korupsi"></i>Korupsi</span>
    <span><i class="sw pencurian"></i>Pencurian ringan</span>
    <span><i class="sw garis"></i>Kurva tren ± 1σ</span>
  </div>
  <p class="figcap fig">Fig. 2. · Gradien vonis terhadap kerugian negara, putusan berkekuatan tetap.</p>
</div>

{#if hover}
  <div class="gk-tip mono" style="transform: translate({tipX}px, {tipY - 14}px)">
    <b>{hover.id}</b> · {fmtRp(hover.kerugian)} · vonis {hover.vonis} bulan
  </div>
{/if}

<style>
  .gk { position: relative; }
  .gk-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .gk-title { font-size: clamp(22px, 3vw, 30px); }
  .gk-sub { font-size: 13px; color: var(--muted); margin: 6px 0 12px; }
  svg { touch-action: pan-y; }
  svg text { font-family: var(--font-mono); font-size: 10px; fill: var(--muted); }
  svg text.axis-label { font-size: 8.5px; letter-spacing: 0.16em; }
  .grid { stroke: var(--line); stroke-dasharray: 2 5; opacity: 0.55; }
  .grid.gx { stroke-dasharray: none; opacity: 0.8; }
  .axis { stroke: var(--line); stroke-width: 1.4; }
  .band { fill: var(--accent2); opacity: 0.07; }
  .trend { stroke: var(--accent2); stroke-width: 1.6; fill: none; stroke-dasharray: 5 5; }
  .cross { stroke: var(--accent); stroke-width: 0.7; opacity: 0.55; pointer-events: none; }
  .cross-read { fill: var(--accent); font-size: 9.5px; pointer-events: none; }
  .dot { cursor: crosshair; transition: r 0.2s, opacity 0.25s; }
  .dot.korupsi { fill: var(--accent); }
  .dot.pencurian { fill: var(--muted); }
  .dot.dim { opacity: 0.3; }
  .dot:hover { r: 8; }
  .sorot line { stroke: var(--ink); stroke-width: 0.8; }
  .sorot-ring { fill: none; stroke: var(--accent); stroke-width: 1.2; stroke-linecap: round; stroke-linejoin: round; opacity: 0.85; }
  .sorot-teks { fill: var(--ink); font-size: 10.5px; }
  .sorot-teks.sub { fill: var(--muted); font-style: italic; font-size: 9.5px; }
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
