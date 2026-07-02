<script lang="ts">
  /**
   * Benar atau Salah: the fact-checker's reflex game. One claim at a time;
   * call it BENAR (it matches the record) or SALAH (it does not). Every
   * verdict comes back with the receipt, win or lose; the game *is* the
   * editorial line. Same deck for every reader (law 5).
   */
  import { BENAR_SALAH } from '../lib/data/edisi';
  import { gsap, EASE_STAMP, EASE_SETTLE, reducedMotion } from '../lib/motion';

  let idx = $state(0);
  let jawab = $state<boolean | null>(null);
  let benarCount = $state(0);
  let rentetan = $state(0);
  let rentetanMax = $state(0);
  let tamat = $state(false);
  let kartuEl: HTMLElement | undefined = $state();

  const soal = $derived(BENAR_SALAH[idx]!);
  const tepat = $derived(jawab !== null && jawab === soal.benar);

  function pilih(v: boolean) {
    if (jawab !== null) return;
    jawab = v;
    if (v === soal.benar) {
      benarCount++;
      rentetan++;
      rentetanMax = Math.max(rentetanMax, rentetan);
    } else {
      rentetan = 0;
    }
    if (!reducedMotion() && kartuEl) {
      requestAnimationFrame(() => {
        const stamp = kartuEl!.querySelector('.bs-verdict');
        if (stamp) gsap.fromTo(stamp, { scale: 2.4, opacity: 0, rotate: 9 }, { scale: 1, opacity: 1, rotate: -3, duration: 0.45, ease: EASE_STAMP });
        const note = kartuEl!.querySelector('.bs-catatan');
        if (note) gsap.fromTo(note, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, delay: 0.18, ease: EASE_SETTLE });
      });
    }
  }

  function lanjut() {
    if (idx + 1 >= BENAR_SALAH.length) {
      tamat = true;
      return;
    }
    idx++;
    jawab = null;
    if (!reducedMotion() && kartuEl) {
      const k = kartuEl.querySelector('.bs-soal');
      if (k) gsap.fromTo(k, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: EASE_SETTLE });
    }
  }

  function ulang() {
    idx = 0;
    jawab = null;
    benarCount = 0;
    rentetan = 0;
    rentetanMax = 0;
    tamat = false;
  }

  const gelar = (n: number) =>
    n >= 6 ? 'MATA ELANG' : n >= 4 ? 'REDAKTUR JAGA' : n >= 2 ? 'MAGANG TELITI' : 'PEMBACA JUDUL';
</script>

<div class="bs" bind:this={kartuEl} data-no-stempel>
  <div class="bs-head">
    <span class="eyebrow">PERMAINAN · BENAR ATAU SALAH</span>
    <span class="bs-streak mono" class:hot={rentetan >= 3}>RENTETAN {rentetan}</span>
  </div>

  {#if !tamat}
    <p class="bs-counter mono">PERNYATAAN {idx + 1}/{BENAR_SALAH.length}</p>
    <div class="bs-soal">
      <p class="bs-teks">“{soal.teks}”</p>
    </div>

    {#if jawab === null}
      <div class="bs-tombol">
        <button class="bs-btn benar mono" onclick={() => pilih(true)}>⊙ BENAR<small>sesuai arsip</small></button>
        <button class="bs-btn salah mono" onclick={() => pilih(false)}>✕ SALAH<small>tidak sesuai arsip</small></button>
      </div>
    {:else}
      <div class="bs-hasil">
        <span class="stamp bs-verdict" class:gagal={!tepat}>{tepat ? 'TEPAT' : 'MELESET'} · {soal.benar ? 'BENAR' : 'SALAH'}</span>
        <p class="bs-catatan">{soal.catatan}</p>
        <div class="bs-foot-row">
          <button class="chip bs-sumber"><span class="tick">⊙</span>{soal.sumber}</button>
          <button class="bs-utama mono" onclick={lanjut}>{idx + 1 >= BENAR_SALAH.length ? 'Hasil →' : 'Pernyataan berikutnya →'}</button>
        </div>
      </div>
    {/if}
  {:else}
    <div class="bs-tamat">
      <p class="bs-skor display num">{benarCount}/{BENAR_SALAH.length}</p>
      <span class="stamp bs-verdict">{gelar(benarCount)}</span>
      <p class="bs-catatan">Rentetan terpanjang: {rentetanMax}. Setiap verdik menyertakan sumbernya.</p>
      <button class="bs-act mono" onclick={ulang}>↻ Ulangi</button>
    </div>
  {/if}
  <p class="bs-foot mono">SETIAP VERDIK MENYERTAKAN SUMBER. (DATA CONTOH)</p>
</div>

<style>
  /* de-boxed: hairline top rule, kicker, claim set straight on the paper */
  .bs { display: flex; flex-direction: column; border-top: var(--hairline); padding-top: 0.75rem; }
  .bs-head { display: flex; justify-content: space-between; align-items: baseline; gap: 0.75rem; }
  .bs-streak { font-size: 10px; letter-spacing: 0.18em; color: var(--muted); transition: color 0.3s; }
  .bs-streak.hot { color: var(--accent2); }
  .bs-counter { font-size: 9.5px; letter-spacing: 0.2em; color: var(--muted); margin-top: 1rem; }
  .bs-teks {
    font-family: 'Fraunces Variable', serif;
    font-weight: 380;
    font-size: clamp(19px, 2.2vw, 25px);
    line-height: 1.3;
    margin: 0.5rem 0 1.25rem;
    min-height: 4.2em;
    text-wrap: pretty;
  }

  /* the verdict pair: two typographic columns split by a soft hairline,
     each on a drawn underline that thickens on hover */
  .bs-tombol { display: grid; grid-template-columns: 1fr 1fr; }
  .bs-btn {
    display: grid;
    gap: 0.25rem;
    justify-items: start;
    text-align: left;
    padding: 0.25rem 0 0.75rem;
    background: none;
    border: 0;
    border-bottom: 1px solid var(--line);
    border-radius: 0;
    color: var(--ink);
    font-size: 13px;
    letter-spacing: 0.14em;
    cursor: pointer;
    transition: color 0.25s var(--ease-out), border-color 0.25s var(--ease-out);
  }
  .bs-btn.benar { padding-right: 1.25rem; }
  .bs-btn.salah { border-left: 1px solid var(--line-soft); padding-left: 1.25rem; }
  .bs-btn small { font-size: 9px; letter-spacing: 0.12em; color: var(--muted); transition: color 0.25s; }
  .bs-btn:hover { border-bottom-width: 3px; padding-bottom: calc(0.75rem - 2px); }
  .bs-btn.benar:hover { color: var(--accent); border-bottom-color: var(--accent); }
  .bs-btn.salah:hover { color: var(--accent2); border-bottom-color: var(--accent2); }
  .bs-btn:hover small { color: inherit; }

  .bs-hasil { display: grid; gap: 0.75rem; justify-items: start; }
  .bs-verdict { font-size: 10px; }
  .bs-verdict.gagal { color: var(--muted); border-color: var(--muted); }
  .bs-catatan { font-size: 13.5px; color: var(--muted); max-width: 40ch; }
  .bs-foot-row { display: flex; gap: 1.25rem; flex-wrap: wrap; align-items: baseline; }

  /* the receipt keeps .chip + .tick (site-wide delegated link to the source)
     but sheds the box: bottom hairline only */
  .bs-sumber {
    border: 0;
    border-bottom: 1px solid var(--line);
    border-radius: 0;
    overflow: visible;
    padding: 0 1px 3px;
    font-size: 10.5px;
    letter-spacing: 0.08em;
  }
  .bs-sumber::before { content: none; }
  .bs-sumber:hover { color: var(--ink); border-color: var(--ink); border-bottom-width: 2px; padding-bottom: 2px; }
  .bs-sumber:hover .tick { color: var(--accent); }

  /* primary action: ink-filled, paper text, square corners */
  .bs-utama {
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    line-height: 1;
    background: var(--ink);
    color: var(--bg);
    border: 0;
    border-radius: 0;
    padding: 0.5rem 0.875rem;
    cursor: pointer;
    transition: opacity 0.25s var(--ease-out);
  }
  .bs-utama:hover { opacity: 0.82; }
  .bs-utama:active { transform: translateY(1px); }

  /* secondary action: mono text on a hairline that thickens */
  .bs-act {
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    background: none;
    border: 0;
    border-bottom: 1px solid var(--line);
    border-radius: 0;
    padding: 0 1px 3px;
    color: var(--muted);
    cursor: pointer;
    transition: color 0.25s var(--ease-out), border-color 0.25s var(--ease-out);
  }
  .bs-act:hover { color: var(--ink); border-color: var(--ink); border-bottom-width: 2px; padding-bottom: 2px; }

  .bs-tamat { display: grid; gap: 0.75rem; justify-items: start; padding-top: 0.5rem; }
  .bs-skor {
    font-family: 'Fraunces Variable', serif;
    font-weight: 340;
    font-size: clamp(44px, 5vw, 72px);
    line-height: 1;
  }
  .bs-foot { margin-top: 1rem; font-size: 9px; letter-spacing: 0.18em; color: var(--muted); }
</style>
