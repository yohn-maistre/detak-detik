<script lang="ts">
  /**
   * Dua Garis Kemiskinan: one thousand dots, the population of a republic.
   * Two buttons, two published thresholds. The chart never argues — it
   * recounts the same dots under each definition and lets the gap speak.
   */
  import { gsap, reducedMotion } from '../lib/motion';

  const GARIS = [
    { id: 'bps', label: 'GARIS BPS', pct: 8.25, basis: 'Rp 595 rb/kapita/bulan · sep 2025', chip: 'bps · feb 2026' },
    { id: 'wb', label: 'GARIS BANK DUNIA', pct: 68.3, basis: '$8,30/hari (PPP 2021) · kelas menengah-bawah', chip: 'world bank · jun 2025' },
  ] as const;

  const COLS = 40;
  const ROWS = 25;
  const N = COLS * ROWS;

  let aktif = $state<(typeof GARIS)[number]>(GARIS[0]);
  let tampilPct = $state(GARIS[0].pct);

  function pilih(g: (typeof GARIS)[number]) {
    if (g.id === aktif.id) return;
    aktif = g;
    if (reducedMotion()) { tampilPct = g.pct; return; }
    const proxy = { p: tampilPct };
    gsap.to(proxy, {
      p: g.pct,
      duration: 1.4,
      ease: 'power3.inOut',
      onUpdate: () => (tampilPct = proxy.p),
    });
  }

  const fmtJiwa = (pct: number) => new Intl.NumberFormat('id-ID').format(Math.round(284_000_000 * (pct / 100) / 1e5) / 10);
</script>

<div class="dg" data-no-stempel>
  <div class="dg-tombol">
    {#each GARIS as g (g.id)}
      <button class="dg-btn mono" class:aktif={aktif.id === g.id} onclick={() => pilih(g)}>
        {g.label}
        <small>{g.basis}</small>
      </button>
    {/each}
  </div>

  <div class="dg-plat" role="img" aria-label={`Seribu titik penduduk; ${aktif.pct}% di bawah ${aktif.label}`}>
    {#each Array.from({ length: N }) as _, i}
      <i class="dg-dot" class:miskin={i < (tampilPct / 100) * N}></i>
    {/each}
  </div>

  <div class="dg-baca">
    <p class="dg-angka display num">{tampilPct.toFixed(2).replace('.', ',')}%</p>
    <p class="dg-label">≈ {fmtJiwa(tampilPct)} juta jiwa di bawah garis ini · setiap titik ≈ 284 ribu orang</p>
    <button class="chip"><span class="tick">⊙</span>{aktif.chip}</button>
  </div>

  <p class="dg-kaki fig">Dua ambang yang berbeda menghitung penduduk yang sama: 8,25% berada di bawah garis BPS, 68,3% di bawah garis Bank Dunia.</p>
</div>

<style>
  .dg-tombol { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 22px; }
  .dg-btn {
    display: grid; gap: 4px; justify-items: start; text-align: left;
    background: transparent; color: var(--ink);
    border: 1px solid var(--line); padding: 12px 14px;
    font-size: 12px; letter-spacing: 0.14em; cursor: pointer;
    transition: background 0.25s, color 0.25s;
  }
  .dg-btn small { font-size: 9px; letter-spacing: 0.08em; color: var(--muted); }
  .dg-btn.aktif { background: var(--accent2); color: #100f0d; border-color: var(--accent2); }
  .dg-btn.aktif small { color: #100f0d; }

  .dg-plat {
    display: grid;
    grid-template-columns: repeat(40, 1fr);
    gap: 3px;
    border: 1px solid var(--line);
    padding: 14px;
  }
  .dg-dot {
    aspect-ratio: 1;
    border-radius: 50%;
    background: var(--line);
    transition: background 0.4s, transform 0.4s;
  }
  .dg-dot.miskin { background: var(--accent2); transform: scale(1.25); }

  .dg-baca { display: flex; align-items: baseline; gap: 18px; flex-wrap: wrap; margin-top: 18px; }
  .dg-angka { font-family: 'Fraunces Variable', serif; font-weight: 340; font-size: clamp(40px, 6vw, 72px); line-height: 1; }
  .dg-label { color: var(--muted); font-size: 13.5px; max-width: 30ch; }
  .dg-kaki { font-size: 15px; margin-top: 20px; max-width: 52ch; }
</style>
