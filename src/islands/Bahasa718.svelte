<script lang="ts">
  /** 718 cara mengucapkan air: 718 living regional languages — second only to
      Papua New Guinea. One tally mark each; the faded marks are the ones a
      decade quietly takes. Figures from the language mapping (sample/contoh). */
  import { onMount } from 'svelte';
  import { gsap, reducedMotion, EASE_STAMP } from '../lib/motion';
  import { countUp } from '../lib/motion-kit';

  const TOTAL = 718, SENYAP = 24; // illustrative: those falling out of use
  let root: HTMLElement | undefined = $state();
  let heroEl: HTMLElement | undefined = $state();
  onMount(() => {
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) {
        if (heroEl) countUp(heroEl, TOTAL, (n) => String(Math.round(n)));
        if (!reducedMotion() && root) {
          gsap.fromTo(root.querySelectorAll('.bh-tally'),
            { scaleY: 0, transformOrigin: 'bottom' },
            { scaleY: 1, duration: 0.4, ease: EASE_STAMP, stagger: { each: 0.002, from: 'start' } });
        } else { root?.classList.add('in'); }
        io.disconnect();
      }
    }, { threshold: 0.25 });
    if (root) io.observe(root);
    return () => io.disconnect();
  });
</script>

<section class="bh" data-no-stempel bind:this={root}>
  <header class="bh-head">
    <span class="eyebrow">BAHASA DAERAH HIDUP · KEDUA TERBANYAK DI DUNIA</span>
    <div class="bh-hero">
      <span class="bh-n display num" bind:this={heroEl}>0</span>
      <span class="bh-lab">cara mengucapkan <span class="bh-air">air</span>; sebagian dituturkan kurang dari seratus orang</span>
    </div>
  </header>

  <div class="bh-field" role="img" aria-label={`${TOTAL} bahasa daerah, ${SENYAP} di antaranya kian jarang dituturkan`}>
    {#each Array(TOTAL) as _, i (i)}
      <i class="bh-tally" class:senyap={i >= TOTAL - SENYAP}></i>
    {/each}
  </div>

  <div class="bh-foot">
    <p class="bh-note fig">Setiap dasawarsa, beberapa di antaranya berhenti dituturkan sama sekali — yang pucat di atas. Sebuah kata yang hilang membawa serta satu cara memandang dunia.</p>
    <button class="chip"><span class="tick">⊙</span>badan bahasa · 718 bahasa · (data contoh)</button>
  </div>
</section>

<style>
  .bh { display: grid; gap: 16px; }
  .bh-head { display: grid; gap: 8px; }
  .bh-hero { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
  .bh-n { font-family: 'Fraunces Variable', serif; font-weight: 340; font-size: clamp(44px, 7vw, 80px); line-height: 0.85; color: var(--ink); }
  .bh-lab { font-size: 13px; color: var(--muted); max-width: 34ch; }
  .bh-air { font-family: var(--font-fig); font-style: italic; color: var(--accent2); }
  .bh-field { display: flex; flex-wrap: wrap; gap: 5px 3px; align-content: start; }
  .bh-tally { width: 2px; height: 13px; background: var(--ink); flex: 0 0 auto; }
  .bh-tally.senyap { background: var(--line-soft); height: 9px; align-self: flex-end; }
  .bh-foot { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; border-top: 1px solid var(--line); padding-top: 12px; margin-top: 4px; }
  .bh-note { font-size: 13.5px; line-height: 1.5; color: var(--ink); max-width: 52ch; }
</style>
