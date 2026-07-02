<script lang="ts">
  /**
   * Janji vs Cair: the JETP pledge against what actually moved, with the
   * captive coal still being built beside it. One bar draws itself to the
   * disbursed fraction; the documents sit side by side, the reader concludes.
   * Figures are sample (contoh), shaped for the CREA/GEM + JETP pipe.
   */
  import { onMount } from 'svelte';
  import { reducedMotion } from '../lib/motion';

  const pledge = 21.6; // US$ miliar dijanjikan
  const cair = 3.3; // US$ miliar cair
  const pct = Math.round((cair / pledge) * 100);

  /* Statis dahulu: isi batang terlihat penuh tanpa JavaScript. Bila motion
     diizinkan, `siap` menyembunyikan isi lalu `masuk` menggambarnya saat
     terlihat. Kelas lewat class: agar selektor tidak dipangkas kompiler. */
  let root: HTMLElement;
  let siap = $state(false);
  let masuk = $state(false);
  onMount(() => {
    if (reducedMotion()) return;
    siap = true;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          masuk = true;
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(root);
    return () => io.disconnect();
  });
</script>

<div class="jc" class:siap class:masuk data-no-stempel bind:this={root}>
  <div class="jc-main">
    <span class="jc-k mono">JETP · KEMITRAAN TRANSISI ENERGI BERKEADILAN</span>
    <div class="jc-bar" style={`--p:${pct}%`}>
      <i class="jc-fill"></i>
      <span class="jc-pledge mono">DIJANJIKAN · US$ 21,6 MILIAR</span>
      <span class="jc-cair mono">CAIR ± US$ 3,3 M · {pct}%</span>
    </div>
    <p class="jc-kalimat fig">
      Dari US$ 21,6 miliar yang dijanjikan negara-negara kaya untuk transisi energi, sekitar
      US$ 3,3 miliar yang benar-benar cair sampai awal 2026. Amerika Serikat menarik diri dari
      kemitraan ini pada 2025.
    </p>
    <button class="chip"><span class="tick">⊙</span>ieefa · jetp · feb 2026 · (data contoh)</button>
  </div>

  <div class="jc-side">
    <span class="jc-k mono">SEMENTARA ITU</span>
    <p class="jc-big display num">31<span class="jc-unit"> GW</span></p>
    <p class="jc-side-teks">
      batu bara <i>captive</i> terus dibangun untuk smelter nikel, sekitar 80% dari seluruh
      tambahan PLTU baru sepanjang tahun terakhir.
    </p>
    <button class="chip"><span class="tick">⊙</span>crea/gem · feb 2026</button>
  </div>
</div>

<style>
  .jc { display: grid; grid-template-columns: 1.7fr 1fr; gap: clamp(20px, 4vw, 52px); align-items: start; }
  @media (max-width: 800px) { .jc { grid-template-columns: 1fr; } }
  .jc-k { font-size: 9px; letter-spacing: 0.18em; color: var(--muted); display: block; margin-bottom: 14px; }

  .jc-bar { position: relative; height: 64px; border: 1px solid var(--line);
    background: repeating-linear-gradient(45deg, color-mix(in oklab, var(--line) 30%, transparent) 0 1px, transparent 1px 8px); }
  .jc-fill {
    position: absolute; left: 0; top: 0; bottom: 0; width: var(--p, 15%);
    background: var(--accent2); transform-origin: left;
  }
  .jc.siap .jc-fill { transform: scaleX(0); }
  .jc.masuk .jc-fill { transform: scaleX(1); transition: transform 1.2s var(--ease-out); }
  .jc-pledge { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); font-size: 10px; letter-spacing: 0.12em; color: var(--muted); }
  .jc-cair { position: absolute; left: calc(var(--p, 15%) + 10px); top: 50%; transform: translateY(-50%); font-size: 10px; letter-spacing: 0.1em; color: var(--accent2); z-index: 2; }

  .jc-kalimat { font-size: clamp(15px, 1.9vw, 18px); margin: 18px 0 14px; max-width: 56ch; }
  .jc :global(.chip) { align-self: flex-start; }

  .jc-side { border-left: 1px solid var(--line); padding-left: clamp(16px, 3vw, 30px); }
  @media (max-width: 800px) { .jc-side { border-left: none; padding-left: 0; border-top: 1px solid var(--line); padding-top: 22px; } }
  .jc-big {
    font-family: 'Fraunces Variable', serif; font-weight: 300;
    font-size: clamp(60px, 11vw, 120px); line-height: 0.86; color: var(--accent2);
    margin: 6px 0 12px;
  }
  .jc-unit { font-size: 0.3em; color: var(--muted); letter-spacing: 0.04em; }
  .jc-side-teks { font-size: 14.5px; color: var(--ink); line-height: 1.55; max-width: 34ch; margin-bottom: 14px; }
  .jc-side-teks i { font-style: italic; }
</style>
