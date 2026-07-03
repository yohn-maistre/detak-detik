<script lang="ts">
  /**
   * Yang Berubah: the reader's face of INGATAN REDAKSI (§13.16). The
   * edition's memory block — computed mechanically from committed arsip
   * records, deterministic, auditable — printed as a quiet ledger under the
   * front feed: BERKEMBANG carries its first-seen date and edition count,
   * BARU is stamped, BERLALU is coverage decay made visible (a story that
   * stopped is a finding, not a deletion). Meter deltas and promise status
   * changes close the strip. Renders NOTHING until the newsroom publishes
   * an edition that carries memory — no empty frames.
   */
  import { onMount } from 'svelte';
  import { getEdisi, onEdisi, type LiveIngatan } from '../lib/edition';

  let ing = $state<LiveIngatan | null>(getEdisi()?.ingatan ?? null);
  onMount(() => onEdisi((e) => { ing = e?.ingatan ?? null; }));

  const grup = (s: 'BARU' | 'BERKEMBANG' | 'BERLALU') =>
    ing?.cerita.filter((c) => c.status === s) ?? [];
</script>

{#if ing && (ing.cerita.length || ing.angka?.length || ing.janji_berubah?.length)}
  <section class="yb" data-no-stempel data-ref="yang-berubah" aria-label="Yang berubah dibanding edisi-edisi terakhir">
    <span class="yb-k mono">YANG BERUBAH · DIBANDING {ing.jendela} EDISI TERAKHIR · DIHITUNG MEKANIS DARI ARSIP</span>

    <div class="yb-rows">
      {#each grup('BERKEMBANG') as c (c.judul)}
        <div class="yb-row">
          <span class="yb-stamp kembang mono">BERKEMBANG</span>
          <span class="yb-judul">{c.judul}</span>
          <span class="yb-meta mono">{c.sejak ? `sejak ${c.sejak}` : ''}{c.n_edisi ? ` · ${c.n_edisi} edisi` : ''}</span>
        </div>
      {/each}
      {#each grup('BARU') as c (c.judul)}
        <div class="yb-row">
          <span class="yb-stamp baru mono">BARU</span>
          <span class="yb-judul">{c.judul}</span>
          <span class="yb-meta mono">pertama tampil di jendela arsip</span>
        </div>
      {/each}
      {#each grup('BERLALU') as c (c.judul)}
        <div class="yb-row lalu">
          <span class="yb-stamp lalu mono">BERLALU</span>
          <span class="yb-judul">{c.judul}</span>
          <span class="yb-meta mono">{c.terakhir ? `terakhir diliput ${c.terakhir}` : 'tak lagi diliput'}</span>
        </div>
      {/each}
    </div>

    {#if ing.angka?.length || ing.janji_berubah?.length}
      <div class="yb-angka mono">
        {#each ing.angka ?? [] as a (a)}<span class="yb-a">Δ {a}</span>{/each}
        {#each ing.janji_berubah ?? [] as j (j)}<span class="yb-a janji">§ {j}</span>{/each}
      </div>
    {/if}
  </section>
{/if}

<style>
  .yb { display: grid; gap: 10px; border-top: 1px solid var(--line); padding: 14px 0 6px; margin-top: 6px; }
  .yb-k { font-size: 8.5px; letter-spacing: 0.16em; color: var(--muted); }
  .yb-rows { display: grid; }
  .yb-row {
    display: grid; grid-template-columns: 96px 1fr auto; gap: 12px; align-items: baseline;
    padding: 7px 0; border-bottom: 1px solid var(--line-soft);
  }
  @media (max-width: 700px) { .yb-row { grid-template-columns: 84px 1fr; } .yb-meta { grid-column: 2; } }
  .yb-stamp { font-size: 8px; letter-spacing: 0.14em; }
  .yb-stamp.kembang { color: var(--accent2); }
  .yb-stamp.baru { color: var(--accent); }
  .yb-stamp.lalu { color: var(--muted); }
  .yb-judul { font-size: 13px; line-height: 1.45; color: var(--ink); }
  .yb-row.lalu .yb-judul { color: var(--muted); }
  .yb-meta { font-size: 8.5px; letter-spacing: 0.06em; color: var(--muted); white-space: nowrap; }
  .yb-angka { display: grid; gap: 5px; font-size: 10px; letter-spacing: 0.04em; color: var(--ink); padding-top: 2px; }
  .yb-a.janji { color: var(--accent); }
</style>
