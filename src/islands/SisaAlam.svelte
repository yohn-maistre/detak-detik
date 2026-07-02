<script lang="ts">
  /**
   * Sisa di Alam Liar: one dot per surviving animal, so the smallness is
   * countable, not abstract. The two rhinos you can literally count; the
   * others overflow a cap. Figures are the latest published estimates
   * (sample / contoh).
   */
  import { onMount } from 'svelte';
  import { gsap, reducedMotion, EASE_STAMP } from '../lib/motion';

  const CAP = 120; // render at most this many dots; the rest as a "+N" tag
  const SPESIES = [
    { nama: 'Badak Sumatra', n: 40, catatan: 'badak paling terancam di dunia', kritis: true },
    { nama: 'Badak Jawa', n: 50, catatan: 'turun dari 76; perburuan jantan', kritis: true },
    { nama: 'Harimau Sumatra', n: 400, catatan: 'subspesies harimau terkecil yang tersisa', kritis: false },
    { nama: 'Orangutan Tapanuli', n: 760, catatan: 'kera besar paling langka di Bumi', kritis: false },
  ].sort((a, b) => a.n - b.n);
  const fmt = new Intl.NumberFormat('id-ID');

  let root: HTMLElement;
  onMount(() => {
    if (reducedMotion()) { root.classList.add('in'); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) {
        root.classList.add('in');
        gsap.fromTo(root.querySelectorAll('.sa-dot'),
          { scale: 0, transformOrigin: 'center' },
          { scale: 1, duration: 0.45, ease: EASE_STAMP, stagger: { each: 0.006, from: 'random' } });
        io.disconnect();
      }
    }, { threshold: 0.3 });
    io.observe(root);
    return () => io.disconnect();
  });
</script>

<div class="sa" data-no-stempel bind:this={root}>
  <div class="sa-rows">
    {#each SPESIES as s (s.nama)}
      <div class="sa-row" class:kritis={s.kritis}>
        <div class="sa-id">
          <b class="sa-n num">{fmt.format(s.n)}</b>
          <span class="sa-nama">{s.nama}</span>
          <span class="sa-cat mono">{s.catatan}</span>
        </div>
        <div class="sa-field" role="img" aria-label={`${s.nama}: sekitar ${fmt.format(s.n)} ekor tersisa`}>
          {#each Array(Math.min(s.n, CAP)) as _, k (k)}
            <i class="sa-dot"></i>
          {/each}
          {#if s.n > CAP}<span class="sa-lebih mono">+{fmt.format(s.n - CAP)} lagi</span>{/if}
        </div>
      </div>
    {/each}
  </div>
  <p class="sa-kaki fig">
    Jumlah badak Jawa dan badak Sumatra yang masih hidup di alam liar, digabungkan,
    <span data-annotate="circle" data-annotate-color="#c96a5a">kurang dari 90 ekor</span>
    di seluruh Bumi. Tiap titik di atas adalah satu ekor.
  </p>
  <button class="chip"><span class="tick">⊙</span>iucn 2025 · irf · (data contoh)</button>
</div>

<style>
  .sa { display: grid; }
  .sa-rows { display: grid; gap: clamp(18px, 2.6vw, 28px); }
  .sa-row { display: grid; grid-template-columns: minmax(140px, 200px) 1fr; gap: clamp(16px, 3vw, 32px); align-items: start; }
  @media (max-width: 600px) { .sa-row { grid-template-columns: 1fr; gap: 10px; } }
  .sa-id { display: grid; gap: 1px; align-content: start; }
  .sa-n { font-family: 'Fraunces Variable', serif; font-weight: 340; font-size: clamp(34px, 5vw, 58px); line-height: 0.9; color: var(--ink); }
  .sa-row.kritis .sa-n { color: var(--accent); }
  .sa-nama { font-family: 'Fraunces Variable', serif; font-weight: 400; font-size: clamp(15px, 1.9vw, 19px); margin-top: 4px; }
  .sa-cat { font-size: 9px; letter-spacing: 0.08em; color: var(--muted); }
  .sa-field { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; align-content: start; padding-top: 6px; }
  .sa-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent2); flex: 0 0 auto; }
  .sa-row.kritis .sa-dot { background: var(--accent); }
  .sa-lebih { font-size: 9.5px; letter-spacing: 0.08em; color: var(--muted); align-self: center; margin-left: 4px; }
  .sa-kaki { font-size: 15px; margin-top: 24px; max-width: 58ch; }
  .sa > :global(.chip) { justify-self: start; margin-top: 12px; }
</style>
