<script lang="ts">
  /**
   * Benar atau Salah: the fact-checker's reflex game. One claim at a time;
   * call it BENAR (it matches the record) or SALAH (it does not). Every
   * verdict comes back with the receipt, win or lose — the game *is* the
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

<div class="bs card" bind:this={kartuEl} data-no-stempel>
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
          <button class="chip"><span class="tick">⊙</span>{soal.sumber}</button>
          <button class="chip hop" onclick={lanjut}>{idx + 1 >= BENAR_SALAH.length ? 'Hasil →' : 'Pernyataan berikutnya →'}</button>
        </div>
      </div>
    {/if}
  {:else}
    <div class="bs-tamat">
      <p class="bs-skor display num">{benarCount}/{BENAR_SALAH.length}</p>
      <span class="stamp bs-verdict">{gelar(benarCount)}</span>
      <p class="bs-catatan">Rentetan terpanjang: {rentetanMax}. Setiap verdik menyertakan sumbernya — begitu pula koran ini.</p>
      <button class="chip" onclick={ulang}>↻ Ulangi</button>
    </div>
  {/if}
  <p class="bs-foot mono">SETIAP VERDIK MENYERTAKAN SUMBER. (DATA CONTOH)</p>
</div>

<style>
  .bs { display: flex; flex-direction: column; }
  .bs-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .bs-streak { font-size: 10px; letter-spacing: 0.18em; color: var(--muted); transition: color 0.3s; }
  .bs-streak.hot { color: var(--accent2); }
  .bs-counter { font-size: 9.5px; letter-spacing: 0.2em; color: var(--muted); margin-top: 14px; }
  .bs-teks {
    font-family: 'Fraunces Variable', serif;
    font-weight: 380;
    font-size: clamp(19px, 2.2vw, 25px);
    line-height: 1.3;
    margin: 10px 0 20px;
    min-height: 4.2em;
    text-wrap: pretty;
  }
  .bs-tombol { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .bs-btn {
    display: grid;
    gap: 3px;
    justify-items: center;
    padding: 14px 10px 12px;
    background: transparent;
    color: var(--ink);
    border: 1px solid var(--line);
    font-size: 13px;
    letter-spacing: 0.14em;
    cursor: pointer;
    transition: background 0.25s var(--ease-out), color 0.25s var(--ease-out), border-color 0.25s, transform 0.18s var(--ease-out);
  }
  .bs-btn small { font-size: 9px; letter-spacing: 0.12em; color: var(--muted); transition: color 0.25s; }
  .bs-btn:hover { transform: translateY(-2px); }
  .bs-btn.benar:hover { background: var(--accent2); color: var(--bg); border-color: var(--accent2); }
  .bs-btn.salah:hover { background: var(--ink); color: var(--bg); border-color: var(--ink); }
  .bs-btn:hover small { color: inherit; }
  .bs-hasil { display: grid; gap: 12px; justify-items: start; }
  .bs-verdict { font-size: 10px; }
  .bs-verdict.gagal { color: var(--muted); border-color: var(--muted); }
  .bs-catatan { font-size: 13.5px; color: var(--muted); max-width: 40ch; }
  .bs-foot-row { display: flex; gap: 8px; flex-wrap: wrap; }
  .bs-tamat { display: grid; gap: 12px; justify-items: start; padding-top: 6px; }
  .bs-skor {
    font-family: 'Fraunces Variable', serif;
    font-weight: 340;
    font-size: clamp(44px, 5vw, 72px);
    line-height: 1;
  }
  .bs-foot { margin-top: 16px; font-size: 9px; letter-spacing: 0.18em; color: var(--muted); }
</style>
