<script lang="ts">
  /**
   * Vital Cabang: the branches read like a DOCTOR'S CHART (§13.15) — five
   * vitals, each drawn against its published healthy range. The band is
   * never an opinion: daerah's is a statutory ceiling (UU 1/2022 Ps.146),
   * legislatif's is the DPR's own target, the others are documented
   * historical ranges. The needle sits where the branch is now (madder when
   * outside its range); a ghost tick marks where it stood before. Registry:
   * newsroom/data/vital_cabang.json, every row sourced.
   *
   * With an `id` prop the component renders ONE row (no section head) — the
   * chapter-embedded mode: each branch chapter opens with its own vital,
   * so the numbers live where their story is told, never twice.
   */
  import { onMount } from 'svelte';
  import { reducedMotion } from '../lib/motion';
  import VITAL from '../../newsroom/data/vital_cabang.json';

  let { id }: { id?: string } = $props();

  const fmt = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: n < 10 ? 2 : 0 }).format(n);

  const rows = (id ? VITAL.filter((v) => v.id === id) : VITAL).map((v) => {
    const pts = [v.band.lo, v.band.hi, v.dulu.nilai, v.nilai];
    const lo = Math.min(...pts), hi = Math.max(...pts);
    const pad = (hi - lo || 1) * 0.14;
    const d0 = Math.max(0, lo - pad), d1 = hi + pad;
    const pos = (x: number) => ((x - d0) / (d1 - d0)) * 100;
    const target = v.band.lo === v.band.hi; // a line target, not a range
    const diLuar = v.nilai > v.band.hi || v.nilai < v.band.lo;
    return { ...v, pos, d0, d1, target, diLuar };
  });

  let root: HTMLElement;
  let masuk = $state(false);
  onMount(() => {
    if (reducedMotion()) { masuk = true; return; }
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) { masuk = true; io.disconnect(); }
    }, { threshold: 0.2 });
    io.observe(root);
    return () => io.disconnect();
  });
</script>

<section class="vc" class:solo={!!id} bind:this={root} class:masuk data-no-stempel data-ref="vital-cabang">
  {#if !id}
    <header class="vc-head">
      <span class="eyebrow">KARTU VITAL · TIAP CABANG DIBACA TERHADAP KISARAN SEHATNYA YANG TERDOKUMENTASI</span>
    </header>
  {/if}
  <div class="vc-rows">
    {#each rows as r, i (r.id)}
      <article class="vc-row">
        <div class="vc-l">
          <span class="vc-cabang mono">{id ? 'KARTU VITAL · DIBACA TERHADAP KISARAN TERDOKUMENTASI' : r.cabang}</span>
          <p class="vc-metrik">{r.metrik}</p>
        </div>
        <div class="vc-baca">
          <p class="vc-nilai num" class:luar={r.diLuar}>{fmt(r.nilai)}<span class="vc-satuan"> {r.satuan}</span></p>
          <p class="vc-catatan">{r.catatan}</p>
        </div>
        <div class="vc-skala" role="img" aria-label={`${r.metrik}: ${r.nilai} ${r.satuan}; ${r.band.label} ${r.band.lo}–${r.band.hi}`}>
          {#if r.target}
            <span class="vc-band garis" style={`left:${r.pos(r.band.lo)}%`}><em class="mono">{r.band.label}</em></span>
          {:else}
            <span class="vc-band" style={`left:${r.pos(r.band.lo)}%;width:${r.pos(r.band.hi) - r.pos(r.band.lo)}%`}><em class="mono">{r.band.label}</em></span>
          {/if}
          <span class="vc-dulu" style={`left:${r.pos(r.dulu.nilai)}%`}><em class="mono">{r.dulu.tahun}</em></span>
          <span class="vc-jarum" class:luar={r.diLuar} style={`left:${r.pos(r.nilai)}%;transition-delay:${i * 120}ms`}></span>
          <span class="vc-ujung mono kiri">{fmt(r.d0)}</span>
          <span class="vc-ujung mono kanan">{fmt(r.d1)}</span>
        </div>
        <span class="vc-src mono">⊙ {r.sumber} · kisaran: {r.band.sumber}</span>
      </article>
    {/each}
  </div>
</section>

<style>
  .vc { display: grid; gap: 14px; border-top: 2px solid var(--ink); padding-top: 14px; margin: 26px 0 34px; }
  /* chapter-embedded: the chapter owns the chrome, the row is an instrument */
  .vc.solo { border-top: 1px solid var(--line); padding-top: 4px; margin: 14px 0 8px; }
  .vc.solo .vc-row { border-bottom: none; padding-bottom: 20px; }
  .vc.solo .vc-cabang { color: var(--muted); letter-spacing: 0.16em; font-size: 8.5px; }
  .vc-rows { display: grid; }
  .vc-row {
    display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
    gap: 8px 30px; padding: 18px 0 16px; border-bottom: 1px solid var(--line);
  }
  @media (max-width: 800px) { .vc-row { grid-template-columns: 1fr; } }
  .vc-l { display: grid; gap: 5px; align-content: start; }
  .vc-cabang { font-size: 9.5px; letter-spacing: 0.2em; color: var(--accent); }
  .vc-metrik { font-family: var(--font-fig); font-style: italic; font-size: clamp(14px, 1.7vw, 17px); color: var(--ink); line-height: 1.4; max-width: 40ch; }
  .vc-baca { display: grid; gap: 4px; align-content: start; }
  .vc-nilai { font-family: 'Fraunces Variable', serif; font-weight: 340; font-size: clamp(26px, 3.4vw, 40px); line-height: 0.95; color: var(--ink); }
  .vc-nilai.luar { color: var(--accent); }
  .vc-satuan { font-size: 0.4em; color: var(--muted); letter-spacing: 0.04em; }
  .vc-catatan { font-size: 11.5px; line-height: 1.5; color: var(--muted); max-width: 52ch; }
  .vc-skala { grid-column: 1 / -1; position: relative; height: 26px; margin-top: 10px; border-bottom: 1px solid var(--line-soft); }
  /* the healthy range: a shaded zone with its label — the page's honesty layer */
  .vc-band { position: absolute; top: 6px; bottom: 0; background: color-mix(in oklab, var(--accent2) 14%, transparent); border-left: 1px solid var(--line); border-right: 1px solid var(--line); }
  .vc-band.garis { width: 2px; background: var(--ink); border: none; }
  .vc-band em { position: absolute; top: -8px; left: 4px; font-style: normal; font-size: 7px; letter-spacing: 0.1em; color: var(--muted); white-space: nowrap; }
  .vc-dulu { position: absolute; top: 12px; bottom: 0; width: 1px; background: var(--muted); opacity: 0.7; }
  .vc-dulu em { position: absolute; bottom: -1px; left: 4px; font-style: normal; font-size: 7px; letter-spacing: 0.08em; color: var(--muted); white-space: nowrap; }
  .vc-jarum { position: absolute; top: 2px; bottom: -1px; width: 2.5px; background: var(--ink); transform: translateX(-50%) scaleY(0); transform-origin: bottom; transition: transform 0.9s cubic-bezier(0.22, 0.9, 0.24, 1.03); }
  .vc-jarum.luar { background: var(--accent); }
  .vc.masuk .vc-jarum { transform: translateX(-50%) scaleY(1); }
  @media (prefers-reduced-motion: reduce) { .vc-jarum { transition: none; } }
  .vc-ujung { position: absolute; bottom: -14px; font-size: 7px; letter-spacing: 0.08em; color: var(--muted); opacity: 0.7; }
  .vc-ujung.kiri { left: 0; }
  .vc-ujung.kanan { right: 0; }
  .vc-src { grid-column: 1 / -1; font-size: 8px; letter-spacing: 0.06em; color: var(--muted); margin-top: 16px; line-height: 1.6; }
</style>
