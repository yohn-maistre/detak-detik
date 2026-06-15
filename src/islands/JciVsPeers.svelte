<script lang="ts">
  /** Diukur dari luar: bursa Jakarta (IHSG) diindeks ke 100 pada awal 2026,
      bersama beberapa bursa Asia lain. Sementara yang lain menanjak, IHSG
      meluncur — penurunan terdalam di antara indeks utama dunia tahun ini.
      Deret deterministik (contoh), dibentuk untuk feed indeks harian. */
  import { gsap, reducedMotion } from '../lib/motion';
  import { rngFrom } from '../lib/seed';
  import { pathD, fmtPct } from '../lib/chart-kit';

  type Garis = { nama: string; akhir: number; warna: string; tebal: number; seed: string };
  // rebased to 100 at Jan 2026; endpoints are cited approximations, marked contoh
  const GARIS: Garis[] = [
    { nama: 'Vietnam', akhir: 128, warna: 'var(--muted)', tebal: 1.4, seed: 'vn-2026' },
    { nama: 'Thailand', akhir: 118, warna: 'var(--muted)', tebal: 1.4, seed: 'th-2026' },
    { nama: 'India', akhir: 101, warna: 'var(--muted)', tebal: 1.4, seed: 'in-2026' },
    { nama: 'IHSG', akhir: 69, warna: 'var(--accent)', tebal: 2.6, seed: 'id-2026' },
  ];

  const N = 130;
  function seri(seed: string, akhir: number, goyang: number): number[] {
    const rng = rngFrom(seed);
    const out: number[] = [];
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const base = 100 + (akhir - 100) * (t * 0.45 + t * t * 0.55);
      out.push(base * (1 + (rng() - 0.5) * 2 * goyang));
    }
    out[0] = 100; out[N - 1] = akhir;
    return out;
  }
  const series = GARIS.map((g) => ({ ...g, data: seri(g.seed, g.akhir, 0.01) }));

  const W = 560, H = 250, PAD = { l: 18, r: 92, t: 18, b: 26 };
  const lo = 60, hi = 134;
  const px = (i: number) => PAD.l + (i / (N - 1)) * (W - PAD.l - PAD.r);
  const py = (v: number) => H - PAD.b - ((v - lo) / (hi - lo)) * (H - PAD.t - PAD.b);
  const y100 = py(100);
  const paths = series.map((s) => ({ ...s, d: pathD(s.data.map((v, i) => [px(i), py(v)])) }));

  let svgEl: SVGSVGElement | undefined = $state();
  $effect(() => {
    if (!svgEl) return;
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) {
        if (!reducedMotion()) {
          const els = [...svgEl!.querySelectorAll<SVGPathElement>('.jp-line')];
          els.forEach((el, k) => {
            const len = el.getTotalLength();
            gsap.fromTo(el, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.7, ease: 'power2.inOut', delay: k * 0.12 });
          });
        }
        io.disconnect();
      }
    }, { threshold: 0.35 });
    io.observe(svgEl);
    return () => io.disconnect();
  });
</script>

<section class="jp" data-no-stempel data-ref="jci-peers">
  <div class="jp-head">
    <div>
      <span class="eyebrow">BURSA, DIINDEKS KE 100 · JAN → JUN 2026</span>
      <p class="jp-dek">Empat bursa Asia diukur dari titik yang sama. Yang lain menanjak; IHSG meluncur paling dalam di antara indeks utama dunia.</p>
    </div>
    <p class="jp-big num">{fmtPct(-31)}<span class="jp-unit"> IHSG · YTD</span></p>
  </div>

  <svg bind:this={svgEl} viewBox="0 0 {W} {H}" width="100%" role="img" aria-label="IHSG dibanding bursa Vietnam, Thailand, India sepanjang 2026, diindeks ke 100, data contoh">
    <line class="jp-base" x1={PAD.l} x2={W - PAD.r} y1={y100} y2={y100} />
    <text class="jp-base-lab" x={PAD.l + 3} y={y100 - 5}>AWAL TAHUN · 100</text>
    {#each paths as s (s.nama)}
      <path class="jp-line" d={s.d} style={`stroke:${s.warna};stroke-width:${s.tebal}`} />
      <circle cx={px(N - 1)} cy={py(s.akhir)} r={s.nama === 'IHSG' ? 4 : 2.6} style={`fill:${s.warna}`} />
      <text class="jp-end" class:ihsg={s.nama === 'IHSG'} x={px(N - 1) + 7} y={py(s.akhir) + 3.5}>{s.nama} {Math.round(s.akhir)}</text>
    {/each}
    <text class="jp-x0" x={PAD.l} y={H - 6}>JAN</text>
    <text class="jp-x1" x={W - PAD.r} y={H - 6} text-anchor="end">JUN</text>
  </svg>

  <button class="chip"><span class="tick">⊙</span>idx · bloomberg · jun 2026 · (data contoh)</button>
</section>

<style>
  .jp { display: grid; gap: 14px; }
  .jp-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; flex-wrap: wrap; }
  .jp-dek { font-size: 14px; color: var(--muted); max-width: 52ch; line-height: 1.5; margin-top: 8px; }
  .jp-big { font-family: 'Fraunces Variable', serif; font-weight: 340; font-size: clamp(34px, 5vw, 56px); line-height: 0.9; color: var(--accent); white-space: nowrap; }
  .jp-unit { font-size: 0.26em; color: var(--muted); letter-spacing: 0.08em; }
  svg { display: block; }
  .jp-line { fill: none; }
  .jp-base { stroke: var(--line); stroke-width: 0.8; stroke-dasharray: 3 4; opacity: 0.7; }
  .jp-base-lab, svg text { font-family: var(--font-mono); font-size: 8.5px; letter-spacing: 0.1em; fill: var(--muted); }
  .jp-end { font-size: 9.5px; letter-spacing: 0.08em; }
  .jp-end.ihsg { fill: var(--accent); font-weight: 700; }
  .chip { align-self: flex-start; }
</style>
