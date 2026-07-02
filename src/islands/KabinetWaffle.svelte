<script lang="ts">
  /** Kabinet yang membengkak: one stamped cell per official, by tier. The
      chapter band above (CabangBand) owns the 109 headline; here the
      composition speaks. Beside it the Danantara clock: time accrues,
      financial reports stay at zero. Figures are sample (contoh). */
  import { onMount } from 'svelte';
  import { gsap, reducedMotion, EASE_STAMP } from '../lib/motion';
  import { countUp } from '../lib/motion-kit';

  const TIER = [
    { label: 'Menteri', n: 48, cls: 'm' },
    { label: 'Wakil menteri', n: 56, cls: 'w' },
    { label: 'Kepala badan', n: 5, cls: 'b' },
  ];
  const cells = TIER.flatMap((t) => Array.from({ length: t.n }, () => t.cls));

  // Danantara diluncurkan 24 Feb 2025; laporan keuangan terbit: 0
  const LAUNCH = Date.UTC(2025, 1, 24);
  const hariSejak = Math.max(0, Math.floor((Date.now() - LAUNCH) / 86400000));
  const idn = new Intl.NumberFormat('id-ID');

  let root: HTMLElement | undefined = $state();
  let hariEl: HTMLElement | undefined = $state();
  onMount(() => {
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) {
        if (hariEl) countUp(hariEl, hariSejak, (n) => idn.format(Math.round(n)));
        if (!reducedMotion() && root) {
          gsap.fromTo(root.querySelectorAll('.kw-cell'),
            { scale: 0, transformOrigin: 'center' },
            { scale: 1, duration: 0.4, ease: EASE_STAMP, stagger: { each: 0.004, from: 'start' } });
        } else { root?.classList.add('in'); }
        io.disconnect();
      }
    }, { threshold: 0.25 });
    if (root) io.observe(root);
    return () => io.disconnect();
  });
</script>

<section class="kw" data-no-stempel data-ref="kabinet" bind:this={root}>
  <div class="kw-grid">
    <figure class="kw-waffle-wrap">
      <p class="kw-anno fig">Satu sel satu pejabat · <span data-annotate="underline" data-annotate-color="#e44a06">terbanyak sejak 1966</span></p>
      <div class="kw-waffle" role="img" aria-label="109 pejabat kabinet: 48 menteri, 56 wakil menteri, 5 kepala badan">
        {#each cells as c, i (i)}
          <i class="kw-cell kw-{c}"></i>
        {/each}
      </div>
      <div class="kw-key mono">
        {#each TIER as t (t.label)}
          <span><i class="kw-sw kw-{t.cls}"></i>{t.label} · {t.n}</span>
        {/each}
      </div>
    </figure>

    <figure class="kw-dana">
      <figcaption class="eyebrow">DANANTARA · BADAN PENGELOLA INVESTASI</figcaption>
      <div class="kw-dana-body">
        <svg class="kw-clock" viewBox="0 0 60 60" aria-hidden="true">
          <circle class="kw-face" cx="30" cy="30" r="27" />
          {#each Array(12) as _, k (k)}
            <line class="kw-tick" x1="30" y1="5" x2="30" y2="9" transform={`rotate(${k * 30} 30 30)`} />
          {/each}
          <line class="kw-hand" x1="30" y1="30" x2="30" y2="9" />
          <circle class="kw-pivot" cx="30" cy="30" r="2.2" />
        </svg>
        <div class="kw-dana-teks">
          <p class="kw-hari"><b class="num" bind:this={hariEl}>0</b> hari sejak peluncuran</p>
          <p class="kw-lap display num">0</p>
          <p class="kw-lap-lab">laporan keuangan terbit</p>
        </div>
      </div>
      <button class="chip"><span class="tick">⊙</span>danantara · (data contoh)</button>
    </figure>
  </div>
</section>

<style>
  .kw-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: clamp(20px, 4vw, 48px); align-items: start; }
  @media (max-width: 760px) { .kw-grid { grid-template-columns: 1fr; } }
  figure { margin: 0; display: grid; gap: 12px; }

  .kw-anno { font-size: 13.5px; margin: 0; }
  .kw-waffle { display: grid; grid-template-columns: repeat(14, 1fr); gap: 4px; }
  @media (max-width: 420px) { .kw-waffle { grid-template-columns: repeat(11, 1fr); } }
  .kw-cell { aspect-ratio: 1; border-radius: 1px; }
  .kw-m { background: var(--ink); }
  .kw-w { background: var(--muted); }
  .kw-b { background: var(--accent); }
  .kw-key { display: flex; gap: 16px; flex-wrap: wrap; font-size: 9px; letter-spacing: 0.1em; color: var(--muted); }
  .kw-key span { display: inline-flex; align-items: center; gap: 6px; }
  .kw-sw { width: 9px; height: 9px; border-radius: 1px; display: inline-block; }

  .kw-dana { border-left: 1px solid var(--line); padding-left: clamp(16px, 3vw, 28px); }
  @media (max-width: 760px) { .kw-dana { border-left: none; padding-left: 0; border-top: 1px solid var(--line); padding-top: 18px; } }
  .kw-dana-body { display: flex; align-items: center; gap: 18px; }
  .kw-clock { width: clamp(64px, 12vw, 88px); height: auto; flex: 0 0 auto; }
  .kw-face { fill: none; stroke: var(--line); stroke-width: 1; }
  .kw-tick { stroke: var(--muted); stroke-width: 1; }
  .kw-hand { stroke: var(--accent); stroke-width: 1.6; transform-origin: 30px 30px; animation: kw-sweep 6s linear infinite; }
  .kw-pivot { fill: var(--accent); }
  .kw-hari { font-size: 13px; color: var(--muted); }
  .kw-hari b { color: var(--ink); }
  .kw-lap { font-family: 'Fraunces Variable', serif; font-weight: 340; font-size: clamp(40px, 7vw, 72px); line-height: 0.85; color: var(--accent); margin-top: 6px; }
  .kw-lap-lab { font-size: 12px; color: var(--muted); letter-spacing: 0.04em; }
  .kw-dana .chip { justify-self: start; }
  @keyframes kw-sweep { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { .kw-hand { animation: none; } }
</style>
