<script lang="ts">
  /** Pasar, terburuk sedunia: the rupiah crossing 18.000/US$ for the first time,
      and the IHSG's place among the world's indices in 2026. Series are
      deterministic samples (contoh) shaped for the BI mid-rate + IDX feed. */
  import { gsap, reducedMotion } from '../lib/motion';
  import { rngFrom } from '../lib/seed';

  function seri(seed: string, dari: number, ke: number, n: number, goyang: number): number[] {
    const rng = rngFrom(seed);
    const out: number[] = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const base = dari + (ke - dari) * (t * t * 0.6 + t * 0.4);
      out.push(base * (1 + (rng() - 0.5) * 2 * goyang));
    }
    out[n - 1] = ke;
    return out;
  }
  const data = seri('rupiah-2026', 16210, 18047, 140, 0.012);

  const W = 540, H = 230, PAD = { l: 16, r: 70, t: 20, b: 24 };
  const min = Math.min(...data, 17900), max = Math.max(...data, 18120);
  const px = (i: number) => PAD.l + (i / (data.length - 1)) * (W - PAD.l - PAD.r);
  const py = (v: number) => H - PAD.b - ((v - min) / (max - min || 1)) * (H - PAD.t - PAD.b);
  const path = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(' ');
  const area = `${path} L ${px(data.length - 1).toFixed(1)} ${H - PAD.b} L ${PAD.l} ${H - PAD.b} Z`;
  const yRekor = py(18000);
  const fmt = new Intl.NumberFormat('id-ID');

  let pathEl: SVGPathElement | undefined = $state();
  $effect(() => {
    if (!pathEl) return;
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) {
        if (!reducedMotion()) {
          const len = pathEl!.getTotalLength();
          gsap.fromTo(pathEl!, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut' });
        }
        io.disconnect();
      }
    }, { threshold: 0.4 });
    io.observe(pathEl);
    return () => io.disconnect();
  });
</script>

<section class="ri" data-no-stempel data-ref="rupiah">
  <div class="ri-body">
    <div class="ri-chart">
      <p class="ri-big num">Rp 18.047<span class="ri-unit"> / US$</span></p>
      <p class="ri-cap">pertama kali menembus 18.000, 4 Juni 2026 · terlemah sepanjang sejarah</p>
      <svg viewBox="0 0 {W} {H}" width="100%" role="img" aria-label="Kurs rupiah terhadap dolar AS sepanjang 2026, data contoh">
        <defs>
          <linearGradient id="ri-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--accent2)" stop-opacity="0.18" />
            <stop offset="100%" stop-color="var(--accent2)" stop-opacity="0" />
          </linearGradient>
        </defs>
        <line class="ri-rekor" x1={PAD.l} x2={W - PAD.r} y1={yRekor} y2={yRekor} />
        <text class="ri-rekor-lab" x={PAD.l + 4} y={yRekor - 5}>REKOR · 18.000</text>
        <path class="ri-area" d={area} />
        <path bind:this={pathEl} class="ri-line" d={path} />
        <circle class="ri-dot" cx={px(data.length - 1)} cy={py(data[data.length - 1]!)} r="4" />
        <text class="ri-end num" x={px(data.length - 1) + 8} y={py(data[data.length - 1]!) + 4}>{fmt.format(Math.round(data[data.length - 1]!))}</text>
        <text class="ri-x0" x={PAD.l} y={H - 6}>JAN 2026</text>
        <text class="ri-x1" x={W - PAD.r} y={H - 6} text-anchor="end">JUN</text>
      </svg>
    </div>

    <aside class="ri-side">
      <span class="eyebrow">BURSA SAHAM · IHSG</span>
      <p class="ri-side-big num">−31<span class="ri-unit">% YTD</span></p>
      <p class="ri-side-teks">indeks saham Jakarta turun paling dalam dari 90+ indeks dunia tahun ini, mendekati titik terendah 5,5 tahun. Bank Indonesia menaikkan suku bunga ke 5,5%.</p>
      <button class="chip"><span class="tick">⊙</span>bi · idx · jun 2026 · (data contoh)</button>
    </aside>
  </div>
</section>

<style>
  .ri-body { display: grid; grid-template-columns: 1.6fr 1fr; gap: clamp(20px, 4vw, 48px); align-items: start; }
  @media (max-width: 820px) { .ri-body { grid-template-columns: 1fr; } }
  .ri-big { font-family: 'Fraunces Variable', serif; font-weight: 340; font-size: clamp(40px, 6.5vw, 76px); line-height: 0.92; color: var(--accent2); }
  .ri-unit { font-size: 0.32em; color: var(--muted); letter-spacing: 0.02em; }
  .ri-cap { font-size: 13px; color: var(--muted); margin: 8px 0 12px; max-width: 50ch; }
  svg { display: block; }
  .ri-line { fill: none; stroke: var(--accent2); stroke-width: 2.2; }
  .ri-area { fill: url(#ri-fill); }
  .ri-rekor { stroke: var(--accent); stroke-width: 0.8; stroke-dasharray: 3 4; opacity: 0.8; }
  .ri-rekor-lab { font-family: var(--font-mono); font-size: 8px; letter-spacing: 0.14em; fill: var(--accent); }
  .ri-dot { fill: var(--accent2); }
  .ri-end { font-family: var(--font-mono); font-size: 12px; font-weight: 700; fill: var(--accent2); }
  svg text { font-family: var(--font-mono); font-size: 8.5px; letter-spacing: 0.1em; fill: var(--muted); }

  .ri-side { border-left: 1px solid var(--line); padding-left: clamp(16px, 3vw, 30px); }
  @media (max-width: 820px) { .ri-side { border-left: none; padding-left: 0; border-top: 1px solid var(--line); padding-top: 20px; } }
  .ri-side-big { font-family: 'Fraunces Variable', serif; font-weight: 300; font-size: clamp(48px, 8vw, 92px); line-height: 0.9; color: var(--accent); margin: 6px 0 10px; }
  .ri-side-teks { font-size: 14px; color: var(--ink); line-height: 1.55; max-width: 36ch; margin-bottom: 14px; }
  .ri-side .chip { align-self: flex-start; }
</style>
