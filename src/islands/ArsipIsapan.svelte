<script lang="ts">
  /**
   * Arsip atau Isapan: the fact-checker's reflex game. One claim at a time;
   * call it ARSIP (it's in the record) or ISAPAN (thumb-sucked). Every
   * verdict comes back with the receipt, win or lose — the game *is* the
   * editorial line. Same deck for every reader (law 5).
   */
  import { ARSIP_ISAPAN } from '../lib/data/edisi';
  import { gsap, EASE_STAMP, EASE_SETTLE, reducedMotion } from '../lib/motion';

  let idx = $state(0);
  let jawab = $state<boolean | null>(null);
  let benarCount = $state(0);
  let rentetan = $state(0);
  let rentetanMax = $state(0);
  let tamat = $state(false);
  let kartuEl: HTMLElement | undefined = $state();

  const soal = $derived(ARSIP_ISAPAN[idx]!);
  const benar = $derived(jawab !== null && jawab === soal.arsip);

  function pilih(v: boolean) {
    if (jawab !== null) return;
    jawab = v;
    if (v === soal.arsip) {
      benarCount++;
      rentetan++;
      rentetanMax = Math.max(rentetanMax, rentetan);
    } else {
      rentetan = 0;
    }
    if (!reducedMotion() && kartuEl) {
      requestAnimationFrame(() => {
        const stamp = kartuEl!.querySelector('.ai-verdict');
        if (stamp) gsap.fromTo(stamp, { scale: 2.4, opacity: 0, rotate: 9 }, { scale: 1, opacity: 1, rotate: -3, duration: 0.45, ease: EASE_STAMP });
        const note = kartuEl!.querySelector('.ai-catatan');
        if (note) gsap.fromTo(note, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, delay: 0.18, ease: EASE_SETTLE });
      });
    }
  }

  function lanjut() {
    if (idx + 1 >= ARSIP_ISAPAN.length) {
      tamat = true;
      return;
    }
    idx++;
    jawab = null;
    if (!reducedMotion() && kartuEl) {
      const k = kartuEl.querySelector('.ai-soal');
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

<div class="ai card" bind:this={kartuEl} data-no-stempel>
  <div class="ai-head">
    <span class="eyebrow">PERMAINAN · ARSIP ATAU ISAPAN?</span>
    <span class="ai-streak mono" class:hot={rentetan >= 3}>RENTETAN {rentetan}</span>
  </div>

  {#if !tamat}
    <p class="ai-counter mono">KLAIM {idx + 1}/{ARSIP_ISAPAN.length}</p>
    <div class="ai-soal">
      <p class="ai-teks">“{soal.teks}”</p>
    </div>

    {#if jawab === null}
      <div class="ai-tombol">
        <button class="ai-btn arsip mono" onclick={() => pilih(true)}>⊙ ARSIP<small>ada kuitansinya</small></button>
        <button class="ai-btn isapan mono" onclick={() => pilih(false)}>✕ ISAPAN<small>jempol belaka</small></button>
      </div>
    {:else}
      <div class="ai-hasil">
        <span class="stamp ai-verdict" class:gagal={!benar}>{benar ? 'TEPAT' : 'MELESET'} · {soal.arsip ? 'ARSIP' : 'ISAPAN'}</span>
        <p class="ai-catatan">{soal.catatan}</p>
        <div class="ai-foot-row">
          <button class="chip"><span class="tick">⊙</span>{soal.sumber}</button>
          <button class="chip hop" onclick={lanjut}>{idx + 1 >= ARSIP_ISAPAN.length ? 'Hasil →' : 'Klaim berikutnya →'}</button>
        </div>
      </div>
    {/if}
  {:else}
    <div class="ai-tamat">
      <p class="ai-skor display num">{benarCount}/{ARSIP_ISAPAN.length}</p>
      <span class="stamp ai-verdict">{gelar(benarCount)}</span>
      <p class="ai-catatan">Rentetan terpanjang: {rentetanMax}. Setiap verdik membawa kuitansinya — begitu juga koran ini.</p>
      <button class="chip" onclick={ulang}>↻ Main lagi</button>
    </div>
  {/if}
  <p class="ai-foot mono">VERDIK SELALU PULANG MEMBAWA SUMBER. (DATA CONTOH)</p>
</div>

<style>
  .ai { display: flex; flex-direction: column; }
  .ai-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .ai-streak { font-size: 10px; letter-spacing: 0.18em; color: var(--muted); transition: color 0.3s; }
  .ai-streak.hot { color: var(--accent2); }
  .ai-counter { font-size: 9.5px; letter-spacing: 0.2em; color: var(--muted); margin-top: 14px; }
  .ai-teks {
    font-family: 'Fraunces Variable', serif;
    font-weight: 380;
    font-size: clamp(19px, 2.2vw, 25px);
    line-height: 1.3;
    margin: 10px 0 20px;
    min-height: 4.2em;
    text-wrap: pretty;
  }
  .ai-tombol { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .ai-btn {
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
  .ai-btn small { font-size: 9px; letter-spacing: 0.12em; color: var(--muted); transition: color 0.25s; }
  .ai-btn:hover { transform: translateY(-2px); }
  .ai-btn.arsip:hover { background: var(--accent2); color: var(--bg); border-color: var(--accent2); }
  .ai-btn.isapan:hover { background: var(--ink); color: var(--bg); border-color: var(--ink); }
  .ai-btn:hover small { color: inherit; }
  .ai-hasil { display: grid; gap: 12px; justify-items: start; }
  .ai-verdict { font-size: 10px; }
  .ai-verdict.gagal { color: var(--muted); border-color: var(--muted); }
  .ai-catatan { font-size: 13.5px; color: var(--muted); max-width: 40ch; }
  .ai-foot-row { display: flex; gap: 8px; flex-wrap: wrap; }
  .ai-tamat { display: grid; gap: 12px; justify-items: start; padding-top: 6px; }
  .ai-skor {
    font-family: 'Fraunces Variable', serif;
    font-weight: 340;
    font-size: clamp(44px, 5vw, 72px);
    line-height: 1;
  }
  .ai-foot { margin-top: 16px; font-size: 9px; letter-spacing: 0.18em; color: var(--muted); }
</style>
