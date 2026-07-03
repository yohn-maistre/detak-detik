<script lang="ts">
  /**
   * Tulisan Papan: the essay surface the newsroom WRITES INTO (§13.13
   * autonomy contract, closing the loop VizPapan opened). Each edition may
   * carry tulisan[] — Lane C long-form written by the desks, every draft
   * through the fact gate, every figure a viz SPEC (never numbers in
   * prose-charts): parseVizSpec validates, VizPapan draws, an unparsable
   * figure never appears. The section prints NOTHING when the edition
   * carries no writing — no empty frames, no placeholder essay. Labeled
   * machine-written, because it is.
   */
  import { onMount } from 'svelte';
  import { getEdisi, onEdisi, type LiveTulisan } from '../lib/edition';
  import VizPapan from './VizPapan.svelte';

  let tulisan = $state<LiveTulisan[]>(getEdisi()?.tulisan ?? []);
  onMount(() => onEdisi((e) => { tulisan = e?.tulisan ?? []; }));

  const paras = (t: string) => t.split(/\n{2,}|\n/).map((s) => s.trim()).filter(Boolean);
</script>

{#if tulisan.length}
  <section class="tp" data-no-stempel data-ref="tulisan" aria-label="Tulisan redaksi mesin">
    <header class="bab-kepala tp-kepala">
      <div class="bab-kepala-teks">
        <span class="inkbar"><span class="dot">●</span>TULISAN · RINGKASAN MESIN, DIPERIKSA GERBANG FAKTA</span>
        <p class="bab-dek">Ditulis meja redaksi mesin dari korpus edisi ini; setiap angka terikat baris sumbernya, setiap grafik lolos validasi sebelum digambar.</p>
      </div>
    </header>
    {#each tulisan as t (t.id)}
      <article class="tp-esai">
        <h3 class="tp-judul display">{t.judul}</h3>
        <div class="tp-tubuh">
          {#each paras(t.teks) as para, i (i)}
            <p class="tp-para" class:pembuka={i === 0}>{para}</p>
          {/each}
        </div>
        {#if t.viz?.length}
          <div class="tp-viz">
            {#each t.viz as spec, i (i)}
              <VizPapan {spec} />
            {/each}
          </div>
        {/if}
        <footer class="tp-kaki">
          <span class="tp-lane mono">LANE C · TULISAN MESIN · SETIAP KLAIM TERIKAT BARIS KORPUS</span>
          {#if t.cited_ids?.length}
            <span class="tp-cites mono">⊙ {t.cited_ids.join(' · ')}</span>
          {/if}
        </footer>
      </article>
    {/each}
  </section>
{/if}

<style>
  .tp { display: grid; gap: 8px; }
  .tp-esai { display: grid; gap: 14px; max-width: 74ch; padding-bottom: clamp(22px, 3.5vw, 40px); }
  .tp-esai + .tp-esai { border-top: 1px solid var(--line); padding-top: clamp(18px, 3vw, 30px); }
  .tp-judul { font-family: 'Fraunces Variable', serif; font-weight: 340; font-size: clamp(24px, 3.4vw, 40px); line-height: 1.05; letter-spacing: -0.012em; color: var(--ink); }
  .tp-tubuh { display: grid; gap: 12px; }
  .tp-para { font-size: clamp(14.5px, 1.7vw, 16.5px); line-height: 1.66; color: var(--ink); }
  .tp-para.pembuka::first-letter {
    font-family: 'Fraunces Variable', serif; font-weight: 340;
    font-size: 3em; line-height: 0.8; float: left;
    padding: 3px 8px 0 0; color: var(--accent);
  }
  .tp-viz { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: clamp(16px, 3vw, 32px); border-top: 1px solid var(--line-soft); padding-top: 14px; }
  .tp-kaki { display: flex; justify-content: space-between; gap: 14px; flex-wrap: wrap; border-top: 1px solid var(--line-soft); padding-top: 8px; }
  .tp-lane { font-size: 8px; letter-spacing: 0.14em; color: var(--muted); }
  .tp-cites { font-size: 8px; letter-spacing: 0.08em; color: var(--muted); }
</style>
