<script lang="ts">
  /**
   * Otsus: dua dekade belanja, satu hasil yang nyaris diam. Garis naik =
   * dana otonomi khusus Papua yang terkumpul (Rp triliun). Garis datar =
   * persentase kemiskinan provinsi-provinsi Papua. Belanja meroket; angka
   * kemiskinan tetap tertinggi di Indonesia. (data contoh, bentuk sesuai
   * pipa DJPK + BPS.)
   */
  import { onMount } from 'svelte';
  import { gsap, reducedMotion } from '../lib/motion';

  // cumulative Otsus disbursement, Rp triliun (anchored to Rp 138,65 T by 2021)
  const KUMULATIF: [number, number][] = [
    [2002, 1.4], [2005, 12], [2008, 28], [2011, 48], [2014, 72],
    [2017, 99], [2020, 127], [2021, 138.65], [2024, 168], [2026, 192],
  ];
  // Papua-region poverty headline %, slow decline, still the nation's highest
  const MISKIN: [number, number][] = [
    [2002, 41.8], [2005, 40.1], [2008, 37.5], [2011, 36.0], [2014, 33.0],
    [2017, 31.5], [2020, 30.5], [2021, 30.2], [2024, 30.0], [2026, 29.8],
  ];

  const W = 620, H = 320, PAD = { l: 44, r: 46, t: 22, b: 30 };
  const t0 = 2002, t1 = 2026;
  const x = (t: number) => PAD.l + ((t - t0) / (t1 - t0)) * (W - PAD.l - PAD.r);
  const yL = (v: number) => H - PAD.b - (v / 200) * (H - PAD.t - PAD.b);
  const yR = (v: number) => H - PAD.b - (v / 50) * (H - PAD.t - PAD.b);
  const pathK = KUMULATIF.map(([t, v], i) => `${i ? 'L' : 'M'} ${x(t).toFixed(1)} ${yL(v).toFixed(1)}`).join(' ');
  const pathM = MISKIN.map(([t, v], i) => `${i ? 'L' : 'M'} ${x(t).toFixed(1)} ${yR(v).toFixed(1)}`).join(' ');

  let svgEl: SVGSVGElement;
  let kEl: SVGPathElement, mEl: SVGPathElement;

  onMount(() => {
    if (reducedMotion()) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e?.isIntersecting) return;
      [kEl, mEl].forEach((p, i) => {
        const len = p.getTotalLength();
        gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len },
          { strokeDashoffset: 0, duration: 1.8, delay: i * 0.3, ease: 'power2.inOut' });
      });
      gsap.fromTo(svgEl.querySelectorAll('.dot'), { opacity: 0 }, { opacity: 1, duration: 0.4, delay: 1.6, stagger: 0.03 });
      io.disconnect();
    }, { threshold: 0.35 });
    io.observe(svgEl);
    return () => io.disconnect();
  });
</script>

<div class="og">
  <svg bind:this={svgEl} viewBox="0 0 {W} {H}" width="100%" role="img" aria-label="Belanja Otsus Papua dibanding angka kemiskinan, 2002 sampai 2026">
    {#each [0, 50, 100, 150, 200] as v}
      <line class="grid" x1={PAD.l} x2={W - PAD.r} y1={yL(v)} y2={yL(v)} />
      <text class="ax l" x={PAD.l - 6} y={yL(v) + 3} text-anchor="end">{v}</text>
    {/each}
    {#each [0, 25, 50] as v}
      <text class="ax r" x={W - PAD.r + 6} y={yR(v) + 3}>{v}%</text>
    {/each}
    <text class="axlbl" x={PAD.l - 6} y={PAD.t - 8} text-anchor="end">Rp T</text>
    <text class="axlbl" x={W - PAD.r + 6} y={PAD.t - 8}>MISKIN</text>

    <path bind:this={mEl} class="line miskin" d={pathM} />
    <path bind:this={kEl} class="line kumulatif" d={pathK} />
    {#each KUMULATIF as [t, v]}<circle class="dot k" cx={x(t)} cy={yL(v)} r="3" />{/each}
    {#each MISKIN as [t, v]}<circle class="dot m" cx={x(t)} cy={yR(v)} r="2.5" />{/each}

    <text class="note" x={x(2021)} y={yL(138.65) - 10} text-anchor="middle">Rp 138,65 T (2021)</text>
    {#each [2002, 2008, 2014, 2020, 2026] as t}
      <text class="ax t" x={x(t)} y={H - PAD.b + 16} text-anchor="middle">{t}</text>
    {/each}
  </svg>
  <div class="og-legend mono">
    <span><i class="sw k"></i>Dana Otsus terkumpul</span>
    <span><i class="sw m"></i>Kemiskinan Papua</span>
  </div>
</div>

<style>
  .og { display: grid; gap: 10px; }
  svg text { font-family: var(--font-mono); font-size: 10px; fill: var(--muted); }
  svg text.axlbl { font-size: 8px; letter-spacing: 0.12em; }
  .grid { stroke: var(--line); stroke-dasharray: 2 5; opacity: 0.5; }
  .line { fill: none; stroke-width: 2.2; }
  .line.kumulatif { stroke: var(--accent); }
  .line.miskin { stroke: var(--accent2); stroke-dasharray: 5 4; }
  .dot.k { fill: var(--accent); }
  .dot.m { fill: var(--accent2); }
  .note { fill: var(--accent); font-size: 9.5px; }
  .og-legend { display: flex; gap: 18px; font-size: 11px; color: var(--muted); }
  .sw { display: inline-block; width: 14px; height: 3px; margin-right: 7px; vertical-align: middle; }
  .sw.k { background: var(--accent); }
  .sw.m { background: var(--accent2); }
</style>
