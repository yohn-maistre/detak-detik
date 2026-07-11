<script lang="ts">
  /** Makan Bergizi Gratis: the program's scale against the running tally of
      poisoning cases. Documents speak: these are the official BGN and monitor
      (FSGI/JPPI) counts, not an accusation. Figures are sample (contoh). */
  import { onMount } from 'svelte';
  import { reducedMotion } from '../lib/motion';
  import { countUp } from '../lib/motion-kit';

  const TOTAL = 16109; // korban kumulatif hingga akhir 2025 (JPPI)
  const BULAN = [
    { b: 'SEP', v: 480 },
    { b: 'OKT', v: 5200 },
    { b: 'NOV', v: 1100 },
    { b: 'DES', v: 760 },
    { b: 'JAN', v: 2835 },
    { b: 'FEB', v: 1920 },
  ];
  const maxV = Math.max(...BULAN.map((m) => m.v));
  const fmt = new Intl.NumberFormat('id-ID');

  let bigEl: HTMLElement;
  let root: HTMLElement;
  onMount(() => {
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) {
        countUp(bigEl, TOTAL, (n) => fmt.format(Math.round(n)));
        root.classList.add('in');
        io.disconnect();
      }
    }, { threshold: 0.4 });
    io.observe(root);
    return () => io.disconnect();
  });
</script>

<section class="mbg" data-no-stempel data-ref="mbg" bind:this={root}>
  <div class="mbg-grid">
    <div class="mbg-tally">
      <span class="eyebrow">KORBAN KERACUNAN · CATATAN BERJALAN</span>
      <p class="mbg-big num" bind:this={bigEl}>{reducedMotion() ? fmt.format(TOTAL) : '0'}</p>
      <p class="mbg-cap">jiwa, sebagian besar anak sekolah, hingga akhir 2025; pemantauan masih berlangsung.</p>
      <div class="mbg-bars" aria-hidden="true">
        {#each BULAN as m (m.b)}
          <div class="mbg-col">
            <i class="mbg-bar" style={`--h:${Math.round((m.v / maxV) * 100)}%`}></i>
            <span class="mbg-v num">{fmt.format(m.v)}</span>
            <span class="mbg-b mono">{m.b}</span>
          </div>
        {/each}
      </div>
      <span class="mbg-bars-cap mono">KORBAN PER BULAN · SEP 2025 – FEB 2026</span>
    </div>

    <aside class="mbg-scale">
      <span class="eyebrow">SKALA PROGRAM · MAKAN BERGIZI GRATIS</span>
      <div class="mbg-row mono"><span>Anggaran 2025</span><b class="num">Rp 171 T</b></div>
      <div class="mbg-row mono"><span>Anggaran 2026 (≈2×)</span><b class="num">Rp 335 T</b></div>
      <div class="mbg-row mono"><span>Sasaran penerima</span><b class="num">± 83 jt</b></div>
      <div class="mbg-row mono"><span>Dapur beroperasi</span><b class="num">21.102</b></div>
      <p class="mbg-scale-teks">Catatan pemantau (FSGI/JPPI), bukan rekap resmi; baris ini menunggu tabulasi Kemenkes/BGN untuk naik status.</p>
      <button class="chip"><span class="tick">⊙</span>bgn · fsgi · jppi · (data contoh)</button>
    </aside>
  </div>
</section>

<style>
  .mbg-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: clamp(20px, 4vw, 48px); align-items: start; }
  @media (max-width: 820px) { .mbg-grid { grid-template-columns: 1fr; } }
  .mbg-big { font-family: 'Fraunces Variable', serif; font-weight: 320; font-size: clamp(56px, 10vw, 116px); line-height: 0.86; color: var(--accent); font-variant-numeric: tabular-nums; }
  .mbg-cap { font-size: 14px; color: var(--ink); max-width: 42ch; line-height: 1.5; margin: 8px 0 18px; }

  .mbg-bars { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; align-items: end; height: 96px; }
  .mbg-col { display: grid; justify-items: center; gap: 4px; align-content: end; height: 100%; }
  .mbg-bar { width: 70%; height: var(--h); background: var(--accent2); align-self: end; transform: scaleY(0); transform-origin: bottom; transition: transform 0.7s var(--ease-out); }
  .in .mbg-bar { transform: scaleY(1); }
  .mbg-v { font-family: var(--font-mono); font-size: 8.5px; color: var(--muted); }
  .mbg-b { font-size: 8px; letter-spacing: 0.1em; color: var(--muted); }
  .mbg-bars-cap { display: block; font-size: 8px; letter-spacing: 0.16em; color: var(--muted); margin-top: 10px; }

  .mbg-scale { border-left: 1px solid var(--line); padding-left: clamp(16px, 3vw, 30px); }
  @media (max-width: 820px) { .mbg-scale { border-left: none; padding-left: 0; border-top: 1px solid var(--line); padding-top: 20px; } }
  .mbg-row { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--line); font-size: 12.5px; color: var(--muted); }
  .mbg-row b { color: var(--ink); }
  .mbg-scale-teks { font-size: 14px; color: var(--ink); line-height: 1.55; margin: 14px 0; max-width: 34ch; }
  .mbg-scale .chip { align-self: flex-start; }
</style>
