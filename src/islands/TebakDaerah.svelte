<script lang="ts">
  /**
   * Tebak Daerah: the civic Wordle. Three data clues, six candidates,
   * shareable green-grey verdict. Identical for every reader (law 5);
   * the streak would live client-side only.
   */
  import { TEBAK } from '../lib/data/edisi';
  import { gsap, EASE_STAMP, reducedMotion } from '../lib/motion';

  let terbuka = $state(1);
  let tebakan = $state<string[]>([]);
  let selesai = $state(false);
  let menang = $state(false);
  let tersalin = $state(false);
  let gridEl: HTMLElement;

  function pilih(nama: string) {
    if (selesai || tebakan.includes(nama)) return;
    tebakan = [...tebakan, nama];
    if (nama === TEBAK.jawaban) {
      selesai = true;
      menang = true;
      if (!reducedMotion()) {
        requestAnimationFrame(() => {
          const stamp = gridEl.querySelector('.td-verdict');
          if (stamp) gsap.fromTo(stamp, { scale: 2.2, opacity: 0, rotate: 8 }, { scale: 1, opacity: 1, rotate: -3, duration: 0.45, ease: EASE_STAMP });
        });
      }
    } else if (tebakan.length >= 3) {
      selesai = true;
    } else {
      terbuka = Math.min(TEBAK.clues.length, terbuka + 1);
    }
  }

  function ulang() {
    terbuka = 1;
    tebakan = [];
    selesai = false;
    menang = false;
    tersalin = false;
  }

  const kotak = (nama: string) =>
    nama === TEBAK.jawaban ? '🟩' : tebakan.includes(nama) ? '⬜' : '·';

  async function bagikan() {
    const teks = `DETAK DETIK №41 · Tebak Daerah ${menang ? tebakan.length : 'X'}/3 · ${tebakan.map(kotak).join(' ')} · detak-detik.pages.dev`;
    try {
      await navigator.clipboard.writeText(teks);
      tersalin = true;
      setTimeout(() => (tersalin = false), 2400);
    } catch { /* clipboard blocked: the share line stays visible to copy by hand */ }
  }
</script>

<div class="td card" bind:this={gridEl} data-no-stempel>
  <div class="td-head">
    <span class="eyebrow">PERMAINAN · TEBAK DAERAH №41</span>
    <button class="chip" onclick={ulang}>↻ Ulangi</button>
  </div>
  <h3 class="display td-title">Kabupaten apa ini?</h3>

  <ol class="td-clues">
    {#each TEBAK.clues.slice(0, terbuka) as clue, i}
      <li><span class="mono td-num">PETUNJUK {i + 1}</span> {clue}</li>
    {/each}
    {#if terbuka < TEBAK.clues.length && !selesai}
      <li class="td-locked mono">PETUNJUK {terbuka + 1} TERBUKA SETELAH TEBAKAN BERIKUTNYA</li>
    {/if}
  </ol>

  <div class="td-pilihan">
    {#each TEBAK.pilihan as nama (nama)}
      <button
        class="chip td-opt"
        class:salah={tebakan.includes(nama) && nama !== TEBAK.jawaban}
        class:benar={selesai && nama === TEBAK.jawaban && menang}
        disabled={selesai || tebakan.includes(nama)}
        onclick={() => pilih(nama)}
      >{nama}</button>
    {/each}
  </div>

  {#if selesai}
    <div class="td-hasil">
      {#if menang}
        <span class="stamp td-verdict">BENAR · {tebakan.length}/3</span>
      {:else}
        <span class="stamp td-verdict gagal">JAWABAN: {TEBAK.jawaban}</span>
      {/if}
      <span class="mono td-share">DETAK DETIK №41 · {tebakan.map(kotak).join(' ')}</span>
      <button class="chip" onclick={bagikan}>{tersalin ? '✓ Tersalin' : '⧉ Bagikan'}</button>
    </div>
  {/if}
  <p class="td-foot mono">SETIAP PEMBACA MENDAPAT TEKA-TEKI YANG SAMA. (DATA CONTOH)</p>
</div>

<style>
  .td-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .td-title { font-size: clamp(22px, 3vw, 32px); margin: 10px 0 14px; }
  .td-clues { list-style: none; display: grid; gap: 9px; margin-bottom: 18px; }
  .td-clues li { font-size: 14.5px; border-left: 3px solid var(--accent); padding-left: 12px; }
  .td-num { display: block; font-size: 9.5px; letter-spacing: 0.18em; color: var(--muted); }
  .td-locked { color: var(--muted); font-size: 10px; letter-spacing: 0.14em; border-left-style: dashed; }
  .td-pilihan { display: flex; flex-wrap: wrap; gap: 8px; }
  .td-opt:disabled { cursor: default; }
  .td-opt.salah { opacity: 0.35; text-decoration: line-through; }
  .td-opt.benar { background: var(--accent); color: var(--bg); border-color: var(--accent); }
  .td-hasil { display: flex; align-items: center; gap: 16px; margin-top: 18px; flex-wrap: wrap; }
  .td-verdict.gagal { color: var(--muted); border-color: var(--muted); }
  .td-share { font-size: 11px; color: var(--muted); }
  .td-foot { margin-top: 14px; font-size: 9px; letter-spacing: 0.18em; color: var(--muted); }
</style>
