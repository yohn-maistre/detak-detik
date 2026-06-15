<script lang="ts">
  /** 127 gunung api aktif — terbanyak di dunia; satu segitiga tiap gunung,
      76 di antaranya pernah meletus sejak 1600 (madder). The same countable
      grammar as the kabinet and the species fields. Figures from the Holocene
      catalogue (sample / contoh). */
  import { onMount } from 'svelte';
  import { gsap, reducedMotion, EASE_STAMP } from '../lib/motion';
  import { countUp } from '../lib/motion-kit';
  import { rngFrom } from '../lib/seed';

  const TOTAL = 127, ERUPSI = 76;
  // deterministic placement of which marks are "erupted since 1600"
  const rng = rngFrom('gunung-api-127');
  const flags = Array.from({ length: TOTAL }, (_, i) => i < ERUPSI).sort(() => rng() - 0.5);

  let root: HTMLElement | undefined = $state();
  let heroEl: HTMLElement | undefined = $state();
  onMount(() => {
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) {
        if (heroEl) countUp(heroEl, TOTAL, (n) => String(Math.round(n)));
        if (!reducedMotion() && root) {
          gsap.fromTo(root.querySelectorAll('.ga-tri'),
            { scale: 0, transformOrigin: 'center bottom' },
            { scale: 1, duration: 0.45, ease: EASE_STAMP, stagger: { each: 0.005, from: 'random' } });
        } else { root?.classList.add('in'); }
        io.disconnect();
      }
    }, { threshold: 0.3 });
    if (root) io.observe(root);
    return () => io.disconnect();
  });
</script>

<section class="ga" data-no-stempel bind:this={root}>
  <header class="ga-head">
    <span class="eyebrow">GUNUNG API AKTIF · TERBANYAK DI DUNIA</span>
    <div class="ga-hero">
      <span class="ga-n display num" bind:this={heroEl}>0</span>
      <span class="ga-hero-lab">gunung api aktif; <b>{ERUPSI}</b> pernah meletus sejak 1600</span>
    </div>
  </header>

  <div class="ga-field" role="img" aria-label={`${TOTAL} gunung api aktif, ${ERUPSI} pernah meletus sejak 1600`}>
    {#each flags as erupsi, i (i)}
      <i class="ga-tri" class:erupsi></i>
    {/each}
  </div>

  <div class="ga-foot">
    <p class="ga-note fig">Sekitar 175 juta jiwa tinggal dalam radius 100 km dari salah satunya. Tiap segitiga madder adalah gunung yang pernah meletus dalam empat abad terakhir.</p>
    <button class="chip"><span class="tick">⊙</span>smithsonian gvp · magma esdm · (data contoh)</button>
  </div>
</section>

<style>
  .ga { display: grid; gap: 14px; }
  .ga-head { display: grid; gap: 8px; }
  .ga-hero { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
  .ga-n { font-family: 'Fraunces Variable', serif; font-weight: 340; font-size: clamp(44px, 7vw, 80px); line-height: 0.85; color: var(--accent2); }
  .ga-hero-lab { font-size: 13px; color: var(--muted); max-width: 32ch; }
  .ga-hero-lab b { color: var(--accent2); }
  .ga-field { display: flex; flex-wrap: wrap; gap: 6px 5px; align-content: start; }
  .ga-tri { width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-bottom: 9px solid var(--line-soft); flex: 0 0 auto; }
  .ga-tri.erupsi { border-bottom-color: var(--accent2); }
  .ga-foot { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; border-top: 1px solid var(--line); padding-top: 12px; margin-top: 4px; }
  .ga-note { font-size: 13.5px; line-height: 1.5; color: var(--ink); max-width: 52ch; }
</style>
