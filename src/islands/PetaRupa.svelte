<script lang="ts">
  /** Garis Wallace: the sharpest faunal boundary on Earth runs through a 35 km
      strait. West of it, the Asian fauna; east, the Australasian. The line
      draws itself on reveal; the two worlds sit on either side. Drawn 1859,
      unmoved since. */
  import { gsap, reducedMotion } from '../lib/motion';

  const BARAT = ['Harimau', 'Badak', 'Gajah', 'Orangutan'];
  const TIMUR = ['Kanguru pohon', 'Kakatua', 'Kuskus', 'Cendrawasih'];

  let lineEl: SVGPathElement | undefined = $state();
  $effect(() => {
    if (!lineEl) return;
    if (reducedMotion()) return;
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) {
        const len = lineEl!.getTotalLength();
        gsap.fromTo(lineEl!, { strokeDasharray: `${len}`, strokeDashoffset: len },
          { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut' });
        io.disconnect();
      }
    }, { threshold: 0.4 });
    io.observe(lineEl);
    return () => io.disconnect();
  });
</script>

<section class="pr" data-no-stempel>
  <header class="pr-head">
    <span class="eyebrow">GARIS WALLACE · BATAS FAUNA · 1859</span>
    <h3 class="pr-judul display">Dua Dunia, Satu Selat</h3>
  </header>

  <div class="pr-band">
    <div class="pr-sisi barat">
      <span class="pr-arah mono">◀ BARAT · CORAK ASIA</span>
      <ul class="pr-fauna">{#each BARAT as f (f)}<li>{f}</li>{/each}</ul>
    </div>

    <svg class="pr-garis" viewBox="0 0 40 200" preserveAspectRatio="none" aria-hidden="true">
      <path bind:this={lineEl} d="M 20 4 C 8 50, 32 100, 14 150 S 24 196, 20 196" />
    </svg>

    <div class="pr-sisi timur">
      <span class="pr-arah mono">CORAK AUSTRALASIA · TIMUR ▶</span>
      <ul class="pr-fauna">{#each TIMUR as f (f)}<li>{f}</li>{/each}</ul>
    </div>
  </div>

  <div class="pr-foot">
    <p class="pr-note fig">Di selat selebar 35 km antara Bali dan Lombok berdiri perbatasan fauna paling tajam di bumi. Ditarik tahun 1859; belum bergeser sampai sekarang.</p>
    <button class="chip"><span class="tick">⊙</span>wallace, 1859 · the malay archipelago</button>
  </div>
</section>

<style>
  .pr { display: grid; gap: 16px; }
  .pr-judul { font-family: 'Fraunces Variable', serif; font-weight: 400; font-size: clamp(24px, 3.2vw, 38px); line-height: 1.02; color: var(--ink); margin-top: 6px; }
  .pr-band { display: grid; grid-template-columns: 1fr auto 1fr; gap: clamp(14px, 3vw, 36px); align-items: stretch; min-height: 160px; }
  .pr-sisi { display: grid; gap: 8px; align-content: start; }
  .pr-sisi.timur { text-align: right; }
  .pr-arah { font-size: 9px; letter-spacing: 0.16em; color: var(--accent); }
  .pr-fauna { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
  .pr-fauna li { font-family: 'Fraunces Variable', serif; font-weight: 360; font-size: clamp(18px, 2.4vw, 28px); line-height: 1.15; color: var(--ink); }
  .pr-garis { width: 40px; height: auto; }
  .pr-garis path { fill: none; stroke: var(--accent2); stroke-width: 1.6; stroke-dasharray: 4 4; }
  .pr-foot { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; border-top: 1px solid var(--line); padding-top: 12px; }
  .pr-note { font-size: 13.5px; line-height: 1.5; color: var(--ink); max-width: 52ch; }
  @media (max-width: 600px) {
    .pr-band { grid-template-columns: 1fr; }
    .pr-garis { width: 100%; height: 30px; transform: rotate(90deg); justify-self: center; }
    .pr-sisi.timur { text-align: left; }
  }
</style>
