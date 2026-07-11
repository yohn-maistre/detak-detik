<script lang="ts">
  /** Pasar yang tipis, dibaca pada SATU penggaris: sumbu 0–30% memuat
      float nyata emiten terbesar (±3% beredar di publik) DAN ambang free
      float minimum tiap bursa besar sebagai patok di skala yang sama.
      Satu pandangan: float itu gagal di semua buku aturan, termasuk
      ambang baru Jakarta sendiri (7,5 → 15). Angka contoh, dibentuk dari
      aturan dan kepemilikan terkini. */
  import { onMount } from 'svelte';
  import { reducedMotion } from '../lib/motion';

  const FLOAT = 3; // emiten terbesar: ±3 dari 100 saham benar-benar beredar
  type Aturan = { bursa: string; nilai: number; dari?: number; tandai?: boolean; lv: number };
  const ATURAN: Aturan[] = [
    { bursa: 'SINGAPURA', nilai: 10, lv: 1 },
    { bursa: 'IDX (JAKARTA)', nilai: 15, dari: 7.5, tandai: true, lv: 0 },
    { bursa: 'NASDAQ', nilai: 20, lv: 1 },
    { bursa: 'HONG KONG · INDIA (NSE)', nilai: 25, lv: 0 },
  ];

  const MAKS = 30;
  const W = 640, H = 176, AXIS = 118, PADL = 14, PADR = 20;
  const x = (v: number) => PADL + (v / MAKS) * (W - PADL - PADR);
  const labelY = (lv: number) => AXIS - 66 + lv * 24;

  let root: HTMLElement;
  let masuk = $state(false);
  onMount(() => {
    if (reducedMotion()) { masuk = true; return; }
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) { masuk = true; io.disconnect(); }
    }, { threshold: 0.3 });
    io.observe(root);
    return () => io.disconnect();
  });
</script>

<section class="fk" class:masuk data-no-stempel data-ref="float" bind:this={root}>
  <figure class="fk-fig">
    <figcaption class="eyebrow">SATU PENGGARIS · FLOAT NYATA EMITEN TERBESAR VS AMBANG MINIMUM TIAP BURSA</figcaption>
    <p class="fk-baca fig">Cara membaca: balok oranye = porsi saham emiten terbesar yang benar-benar beredar di publik (±3%). Setiap patok bergaris = ambang minimum satu bursa, digambar pada penggaris yang sama.</p>
    <span class="viz-cap" aria-hidden="true">DATA CONTOH</span>
    <svg viewBox="0 0 {W} {H}" width="100%" role="img"
      aria-label={`Pada emiten terbesar hanya ±${FLOAT}% saham beredar di publik; ambang free float minimum: Singapura 10%, IDX 15% (naik dari 7,5%), Nasdaq 20%, Hong Kong dan India 25%. Data contoh.`}>
      <!-- the ruler -->
      <line class="fk-axis" x1={PADL} x2={x(MAKS)} y1={AXIS} y2={AXIS} />
      {#each [0, 5, 10, 15, 20, 25, 30] as v (v)}
        <line class="fk-grad" x1={x(v)} x2={x(v)} y1={AXIS} y2={AXIS + 5} />
        <text class="fk-grad-t" x={x(v)} y={AXIS + 16} text-anchor="middle">{v}</text>
      {/each}
      <text class="fk-cut mono" x={x(MAKS) + 4} y={AXIS + 4}>⫽</text>
      <text class="fk-grad-t satuan" x={x(MAKS)} y={AXIS + 30} text-anchor="end">% SAHAM BEREDAR · SKALA DIPOTONG DI 30</text>

      <!-- the actual float: the only filled thing on the ruler -->
      <rect class="fk-float" x={x(0)} y={AXIS - 16} width={Math.max(2, x(FLOAT) - x(0))} height="16" />
      <text class="fk-float-n num" x={x(FLOAT) + 8} y={AXIS - 4}>±{FLOAT}</text>
      <text class="fk-float-t" x={x(0)} y={AXIS + 30}>BEREDAR DI PUBLIK,</text>
      <text class="fk-float-t" x={x(0)} y={AXIS + 41}>EMITEN TERBESAR</text>

      <!-- every rulebook, on the same scale -->
      {#each ATURAN as a, i (a.bursa)}
        {@const tx = x(a.nilai)}
        {@const ty = labelY(a.lv)}
        <line class="fk-tick" class:tandai={a.tandai} x1={tx} x2={tx} y1={ty + 6} y2={AXIS} style={`transition-delay:${200 + i * 110}ms`} />
        <text class="fk-bursa" class:tandai={a.tandai} x={tx} y={ty} text-anchor="middle" style={`transition-delay:${200 + i * 110}ms`}>{a.bursa} · MIN {a.nilai}%</text>
        {#if a.dari}
          <line class="fk-dari" x1={x(a.dari)} x2={x(a.dari)} y1={AXIS - 22} y2={AXIS} />
          <line class="fk-dari-arah" x1={x(a.dari) + 2} x2={tx - 3} y1={AXIS - 24} y2={AXIS - 24} marker-end="url(#fk-panah)" />
          <text class="fk-dari-t" x={x(a.dari)} y={AXIS - 28} text-anchor="middle">7,5 → 15</text>
        {/if}
      {/each}
      <defs>
        <marker id="fk-panah" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
          <path d="M0,0 L5,2.5 L0,5" fill="none" stroke="var(--accent)" stroke-width="1" />
        </marker>
      </defs>
    </svg>
    <p class="fk-key mono">SETIAP PATOK = AMBANG MINIMUM BURSA ITU · BALOK = YANG BENAR-BENAR BEREDAR · SISANYA, ±97, DIPEGANG SEGELINTIR PENGENDALI</p>
  </figure>

  <div class="fk-foot">
    <p class="fk-note">Float setipis ini membuat harga mudah berayun dan indeks rentan, alasan yang dikutip saat MSCI membekukan sebagian bobot pada awal 2026. <span class="mono">Dokumen ditampilkan berdampingan; kesimpulan diserahkan kepada pembaca.</span></p>
    <button class="chip"><span class="tick">⊙</span>idx · msci · ojk · jun 2026 · (data contoh)</button>
  </div>
</section>

<style>
  .fk { display: grid; gap: 16px; }
  .fk-fig { margin: 0; display: grid; gap: 12px; position: relative; }
  .fk-baca { font-size: 13.5px; color: var(--muted); max-width: 66ch; line-height: 1.55; }
  svg { display: block; overflow: visible; }

  .fk-axis { stroke: var(--ink); stroke-width: 1.5; }
  .fk-grad { stroke: var(--line); stroke-width: 1; }
  .fk-grad-t { font-family: var(--font-mono); font-size: 8.5px; fill: var(--muted); }
  .fk-grad-t.satuan { font-size: 7px; letter-spacing: 0.14em; }
  .fk-cut { font-size: 11px; fill: var(--muted); }

  .fk-float { fill: var(--accent); transform: scaleX(0); transform-origin: left center; transition: transform 0.9s cubic-bezier(0.22, 0.9, 0.24, 1.03) 0.1s; }
  .fk.masuk .fk-float { transform: scaleX(1); }
  .fk-float-n { font-family: 'Fraunces Variable', serif; font-weight: 340; font-size: 26px; fill: var(--accent); }
  .fk-float-t { font-family: var(--font-mono); font-size: 7px; letter-spacing: 0.12em; fill: var(--accent); }

  .fk-tick { stroke: var(--muted); stroke-width: 1; stroke-dasharray: 3 3; opacity: 0; transition: opacity 0.5s ease; }
  .fk-tick.tandai { stroke: var(--ink); stroke-dasharray: none; stroke-width: 1.4; }
  .fk.masuk .fk-tick { opacity: 0.9; }
  .fk-bursa { font-family: var(--font-mono); font-size: 8px; letter-spacing: 0.08em; fill: var(--muted); opacity: 0; transition: opacity 0.5s ease; }
  .fk-bursa.tandai { fill: var(--ink); font-weight: 700; }
  .fk.masuk .fk-bursa { opacity: 1; }

  .fk-dari { stroke: var(--accent); stroke-width: 1; stroke-dasharray: 2 2; opacity: 0.8; }
  .fk-dari-arah { stroke: var(--accent); stroke-width: 1; }
  .fk-dari-t { font-family: var(--font-mono); font-size: 7.5px; fill: var(--accent); letter-spacing: 0.06em; }

  .fk-key { font-size: 8px; letter-spacing: 0.1em; color: var(--muted); line-height: 1.7; }
  .fk-foot { display: flex; justify-content: space-between; align-items: flex-start; gap: 18px; flex-wrap: wrap; border-top: 1px solid var(--line); padding-top: 14px; }
  .fk-note { font-size: 13.5px; color: var(--ink); line-height: 1.55; max-width: 64ch; }
  @media (prefers-reduced-motion: reduce) { .fk-float, .fk-tick, .fk-bursa { transition: none; } }
</style>
