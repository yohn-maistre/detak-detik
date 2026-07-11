<script lang="ts">
  /** 718 cara mengucapkan air: 718 living regional languages — second only to
      Papua New Guinea. One tally mark each; the faded marks are the ones a
      decade quietly takes. Each day surfaces the word for "air" in one of them,
      chosen by the calendar (deterministic, law 5). Figures + glosses from the
      language mapping / Wiktionary (sample/contoh). */
  import { onMount } from 'svelte';
  import { gsap, reducedMotion, EASE_STAMP } from '../lib/motion';
  import { countUp } from '../lib/motion-kit';
  import { bahasaHari, manusiaHari, HARI } from '../lib/atlas-hari';

  const TOTAL = 718, SENYAP = 24; // illustrative: those falling out of use

  // the word for "water" across the archipelago, rotated by the day
  const KATA_AIR = [
    { lang: 'Jawa', kata: 'banyu', wil: 'Jawa Tengah & Timur' },
    { lang: 'Sunda', kata: 'cai', wil: 'Jawa Barat' },
    { lang: 'Bali', kata: 'yéh', wil: 'Bali' },
    { lang: 'Minangkabau', kata: 'aia', wil: 'Sumatra Barat' },
    { lang: 'Aceh', kata: 'ie', wil: 'Aceh' },
    { lang: 'Batak Toba', kata: 'aek', wil: 'Sumatra Utara' },
    { lang: 'Bugis', kata: 'uwai', wil: 'Sulawesi Selatan' },
    { lang: 'Makassar', kata: "je'ne'", wil: 'Sulawesi Selatan' },
    { lang: 'Madura', kata: 'aéng', wil: 'Jawa Timur' },
    { lang: 'Sasak', kata: 'aiq', wil: 'Lombok' },
    { lang: 'Banjar', kata: 'banyu', wil: 'Kalimantan Selatan' },
    { lang: 'Dayak Ngaju', kata: 'danum', wil: 'Kalimantan Tengah' },
    { lang: 'Toraja', kata: 'uai', wil: 'Sulawesi Selatan' },
    { lang: 'Bima', kata: 'oi', wil: 'Nusa Tenggara Barat' },
    { lang: 'Manggarai', kata: 'waé', wil: 'Flores' },
    { lang: 'Ambon', kata: 'aer', wil: 'Maluku' },
    { lang: 'Biak', kata: 'war', wil: 'Papua' },
    { lang: 'Nias', kata: 'idanö', wil: 'Sumatra Utara' },
    { lang: 'Lampung', kata: 'way', wil: 'Lampung' },
    { lang: 'Rejang', kata: 'bioa', wil: 'Bengkulu' },
  ];
  // §13.17 B.3: the featured tongue follows the day's PROFILE. Preference
  // order: (1) the reviewed registry entry's own curated kata_air (each row
  // cites its source — filled during editorial review, never guessed here);
  // (2) a name-match into the sample list; (3) honest calendar rotation.
  const punya = (manusiaHari as { kata_air?: { kata: string; wilayah?: string; sumber?: string } }).kata_air;
  const cocok = bahasaHari
    ? KATA_AIR.findIndex((k) => {
        const a = k.lang.toLowerCase(), b = bahasaHari.toLowerCase();
        return a.includes(b) || b.includes(a);
      })
    : -1;
  const kata = punya
    ? { lang: bahasaHari || manusiaHari.bahasa, kata: punya.kata, wil: punya.wilayah ?? manusiaHari.wilayah }
    : KATA_AIR[cocok >= 0 ? cocok : HARI % KATA_AIR.length]!;
  const terikat = !!punya || cocok >= 0;

  let root: HTMLElement | undefined = $state();
  let heroEl: HTMLElement | undefined = $state();
  onMount(() => {
    /* angka besar sudah terisi TOTAL sejak render pertama; animasi 0 ke N hanya
       berjalan saat elemen benar-benar terlihat dan reduced-motion tidak aktif. */
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) {
        if (!reducedMotion() && root) {
          if (heroEl) countUp(heroEl, TOTAL, (n) => String(Math.round(n)));
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
      <span class="bh-n display num" bind:this={heroEl}>{TOTAL}</span>
      <span class="bh-lab">cara mengucapkan <span class="bh-air">air</span>; sebagian dituturkan kurang dari seratus orang</span>
    </div>
  </header>

  <!-- the day's word: one of the 718, surfaced; tied to the profile when known -->
  <div class="bh-kata">
    <span class="bh-kata-lab mono">HARI INI · "AIR" DALAM BAHASA {kata.lang.toUpperCase()}</span>
    <p class="bh-kata-word display">{kata.kata}</p>
    <span class="bh-kata-wil mono">{kata.wil} · {terikat ? 'bahasa yang dituturkan wajah hari ini' : 'berganti tiap terbit'}</span>
  </div>

  <div class="bh-field" role="img" aria-label={`${TOTAL} bahasa daerah, ${SENYAP} di antaranya kian jarang dituturkan`}>
    {#each Array(TOTAL) as _, i (i)}
      <i class="bh-tally" class:senyap={i >= TOTAL - SENYAP}></i>
    {/each}
  </div>

  <div class="bh-foot">
    <p class="bh-note fig">Setiap dasawarsa, beberapa di antaranya berhenti dituturkan sama sekali; garis yang pucat pada bidang di atas menandainya.</p>
    <button class="chip"><span class="tick">⊙</span>badan bahasa · wiktionary · (data contoh)</button>
  </div>
</section>

<style>
  .bh { display: grid; gap: 16px; }
  .bh-head { display: grid; gap: 8px; }
  .bh-hero { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
  .bh-n { font-family: 'Fraunces Variable', serif; font-weight: 340; font-size: clamp(40px, 6.4vw, 72px); line-height: 0.85; color: var(--ink); }
  .bh-lab { font-size: 13px; color: var(--muted); max-width: 34ch; }
  .bh-air { font-family: var(--font-fig); font-style: italic; color: var(--accent2); }

  .bh-kata { border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); padding: 14px 0; display: grid; gap: 2px; justify-items: start; }
  .bh-kata-lab { font-size: 9px; letter-spacing: 0.18em; color: var(--accent); }
  .bh-kata-word { font-family: 'Fraunces Variable', serif; font-weight: 400; font-size: clamp(40px, 8vw, 88px); line-height: 0.9; color: var(--ink); font-style: italic; }
  .bh-kata-wil { font-size: 9px; letter-spacing: 0.1em; color: var(--muted); }

  .bh-field { display: flex; flex-wrap: wrap; gap: 5px 3px; align-content: start; }
  .bh-tally { width: 2px; height: 13px; background: var(--ink); flex: 0 0 auto; }
  .bh-tally.senyap { background: var(--line-soft); height: 9px; align-self: flex-end; }
  .bh-foot { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; border-top: 1px solid var(--line); padding-top: 12px; margin-top: 4px; }
  .bh-note { font-size: 13.5px; line-height: 1.5; color: var(--ink); max-width: 52ch; }
</style>
