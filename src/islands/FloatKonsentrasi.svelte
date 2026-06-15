<script lang="ts">
  /** Mengapa bursa setipis ini rapuh: pada sejumlah emiten terbesar, hampir
      seluruh saham dipegang segelintir pengendali — hanya sesisa kecil yang
      benar-benar beredar di publik (free float). Di sebelahnya, ambang free
      float minimum: IDX termasuk paling rendah di antara bursa besar. Angka
      contoh, dibentuk dari aturan dan kepemilikan terkini. */
  import { gsap, reducedMotion, EASE_PRESS, EASE_STAMP } from '../lib/motion';
  import { rngFrom } from '../lib/seed';
  import { ramp } from '../lib/chart-kit';

  // 97 of 100 shares held by the controlling core; ~3 truly float
  const INTI = 97, PUBLIK = 3;
  const CW = 250, CH = 240;
  const cx0 = CW / 2, cy0 = CH / 2;
  const rng = rngFrom('float-konsentrasi');
  const bell = () => (rng() + rng() + rng() - 1.5) / 1.5; // ~[-1,1], centre-weighted
  const maxd = Math.hypot(50, 46);
  // a dense ember clot: darkest at the gravitational centre, warmer at the rim
  const inti = Array.from({ length: INTI }, () => {
    const x = cx0 + bell() * 50, y = cy0 + bell() * 46;
    const t = 1 - Math.min(1, Math.hypot(x - cx0, y - cy0) / maxd);
    return { x, y, col: ramp(0.45 + 0.5 * t) };
  });
  // the thin public float, isolated at the rim, each tagged
  const publik = [
    { x: 30, y: 36 }, { x: CW - 26, y: 58 }, { x: 38, y: CH - 32 },
  ].slice(0, PUBLIK);

  // minimum free-float thresholds, by exchange (%). IDX is a raise: 7,5 → 15
  type Aturan = { bursa: string; nilai: number; dari?: number; tandai?: boolean };
  const ATURAN: Aturan[] = [
    { bursa: 'Hong Kong', nilai: 25 },
    { bursa: 'India (NSE)', nilai: 25 },
    { bursa: 'Nasdaq', nilai: 20 },
    { bursa: 'Singapura', nilai: 10 },
    { bursa: 'IDX (Jakarta)', nilai: 15, dari: 7.5, tandai: true },
  ];
  const SKALA = 28; // % axis max
  const BW = 300, rowH = 30, bx = (v: number) => (v / SKALA) * (BW - 96) + 84;

  let root: HTMLElement | undefined = $state();
  $effect(() => {
    if (!root) return;
    if (reducedMotion()) { root.classList.add('in'); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) {
        root!.classList.add('in');
        gsap.fromTo(root!.querySelectorAll('.fk-dot-inti'),
          { scale: 0, transformOrigin: 'center' },
          { scale: 1, duration: 0.5, ease: EASE_STAMP, stagger: { each: 0.004, from: 'random' } });
        // second beat: the core consolidates inward
        gsap.fromTo(root!.querySelector('.fk-inti-g'),
          { scale: 1.14, transformOrigin: 'center' },
          { scale: 1, duration: 0.7, ease: EASE_PRESS, delay: 0.55 });
        gsap.fromTo(root!.querySelectorAll('.fk-publik, .fk-publik-tag'),
          { opacity: 0 }, { opacity: 1, duration: 0.5, delay: 0.9, stagger: 0.1 });
        gsap.fromTo(root!.querySelectorAll('.fk-bar'),
          { scaleX: 0, transformOrigin: 'left center' },
          { scaleX: 1, duration: 0.8, ease: 'power3.out', stagger: 0.08, delay: 0.3 });
        io.disconnect();
      }
    }, { threshold: 0.3 });
    io.observe(root);
    return () => io.disconnect();
  });
</script>

<section class="fk" data-no-stempel data-ref="float" bind:this={root}>
  <div class="fk-grid">
    <!-- the constellation: who actually holds the shares -->
    <figure class="fk-con">
      <figcaption class="eyebrow">SATU EMITEN BESAR · 100 SAHAM, SIAPA YANG MEMEGANG</figcaption>
      <svg viewBox="0 0 {CW} {CH}" width="100%" role="img" aria-label="97 dari 100 saham dipegang segelintir pengendali, 3 beredar di publik, data contoh">
        <text class="fk-ghost" x={cx0} y={cy0 + 46} text-anchor="middle">97<tspan class="fk-ghost-sm">:3</tspan></text>
        <g class="fk-inti-g">
          {#each inti as d, i (i)}
            <circle class="fk-dot-inti" style={`fill:${d.col}`} cx={d.x} cy={d.y} r="4" />
          {/each}
        </g>
        {#each publik as d, i (i)}
          <circle class="fk-publik" cx={d.x} cy={d.y} r="4.2" />
          <text class="fk-publik-tag" x={d.x + (d.x > cx0 ? -8 : 8)} y={d.y - 7} text-anchor={d.x > cx0 ? 'end' : 'start'}>publik</text>
        {/each}
      </svg>
      <p class="fk-con-key mono">
        <span><i class="sw inti"></i>97 · DIKUASAI 4 PEMEGANG</span>
        <span><i class="sw publik"></i>3 · BEREDAR DI PUBLIK</span>
      </p>
    </figure>

    <!-- the rulebook: minimum free float, by exchange -->
    <figure class="fk-rule">
      <figcaption class="eyebrow">FREE FLOAT MINIMUM · AMBANG TIAP BURSA</figcaption>
      <svg viewBox="0 0 {BW} {ATURAN.length * rowH + 18}" width="100%" role="img" aria-label="Ambang free float minimum tiap bursa, IDX paling rendah, data contoh">
        {#each ATURAN as a, i (a.bursa)}
          {@const y = i * rowH + 16}
          <text class="fk-bursa" class:tandai={a.tandai} x="0" y={y + 4}>{a.bursa}</text>
          <line class="fk-track" x1="84" x2={BW - 12} y1={y} y2={y} />
          {#if a.dari}
            <line class="fk-ghost-tick" x1={bx(a.dari)} x2={bx(a.dari)} y1={y - 6} y2={y + 6} />
            <rect class="fk-bar fk-bar-tandai" x={bx(a.dari)} y={y - 3} width={Math.max(2, bx(a.nilai) - bx(a.dari))} height="6" />
            <circle class="fk-pt tandai" cx={bx(a.nilai)} cy={y} r="4" />
            <text class="fk-val tandai" x={bx(a.nilai) + 8} y={y + 3.5}>7,5 → {a.nilai}%</text>
          {:else}
            <line class="fk-bar" x1="84" x2={bx(a.nilai)} y1={y} y2={y} />
            <circle class="fk-pt" cx={bx(a.nilai)} cy={y} r="3.4" />
            <text class="fk-val" x={bx(a.nilai) + 8} y={y + 3.5}>{a.nilai}%</text>
          {/if}
        {/each}
      </svg>
    </figure>
  </div>

  <div class="fk-foot">
    <p class="fk-note">Float setipis ini membuat harga mudah berayun dan indeks rentan — alasan yang dikutip saat MSCI membekukan sebagian bobot pada awal 2026. <span class="mono">Dokumen berdampingan, pembaca menyimpulkan.</span></p>
    <button class="chip"><span class="tick">⊙</span>idx · msci · ojk · jun 2026 · (data contoh)</button>
  </div>
</section>

<style>
  .fk { display: grid; gap: 16px; }
  .fk-grid { display: grid; grid-template-columns: 0.85fr 1.15fr; gap: clamp(20px, 4vw, 44px); align-items: start; }
  @media (max-width: 820px) { .fk-grid { grid-template-columns: 1fr; } }
  figure { margin: 0; display: grid; gap: 10px; }
  svg { display: block; }
  .fk-ghost { font-family: 'Fraunces Variable', serif; font-weight: 340; font-size: 110px; fill: transparent; -webkit-text-stroke: 1.2px var(--line-soft); }
  .fk-ghost-sm { font-size: 0.42em; -webkit-text-stroke: 0.8px var(--line-soft); }
  .fk-dot-inti { fill: var(--accent); }
  .fk-publik { fill: none; stroke: var(--ink); stroke-width: 1.4; opacity: 0; }
  .fk.in .fk-publik { opacity: 1; }
  .fk-publik-tag { font-family: var(--font-mono); font-size: 8px; letter-spacing: 0.12em; fill: var(--muted); opacity: 0; }
  .fk.in .fk-publik-tag { opacity: 1; }
  .fk-con-key { display: flex; gap: 18px; flex-wrap: wrap; font-size: 9px; letter-spacing: 0.1em; color: var(--muted); }
  .fk-con-key span { display: inline-flex; align-items: center; gap: 6px; }
  .sw { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
  .sw.inti { background: var(--accent); }
  .sw.publik { border: 1.4px solid var(--ink); }

  .fk-track { stroke: var(--line-soft); stroke-width: 1; }
  .fk-ghost-tick { stroke: var(--muted); stroke-width: 1; stroke-dasharray: 2 2; opacity: 0.7; }
  .fk-bar { stroke: var(--muted); stroke-width: 2.4; }
  .fk-bar-tandai { fill: var(--accent); opacity: 0.9; }
  .fk-pt { fill: var(--muted); }
  .fk-pt.tandai { fill: var(--accent); }
  svg text { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.04em; fill: var(--muted); }
  .fk-bursa { font-size: 9.5px; }
  .fk-bursa.tandai { fill: var(--accent); font-weight: 700; }
  .fk-val.tandai { fill: var(--accent); font-weight: 700; }

  .fk-foot { display: flex; justify-content: space-between; align-items: flex-start; gap: 18px; flex-wrap: wrap; border-top: 1px solid var(--line); padding-top: 14px; }
  .fk-note { font-size: 13.5px; color: var(--ink); line-height: 1.55; max-width: 64ch; }
</style>
