<script lang="ts">
  /** Rak Kabar: the clustered newsstand. The kliping desk gathers the day's
      coverage across the roster, clusters the same story across outlets, and
      scores each cluster by DIVERSITY of ownership, not volume. Everything
      printed here is Lane A verbatim: headlines are the outlets' own words,
      linked; the paper adds only documented ownership facts. The board
      renders nothing until a live edition carries kliping[]. */
  import { onMount } from 'svelte';
  import { onEdisi, type LiveKliping } from '../lib/edition';

  let rak = $state<LiveKliping[]>([]);
  onMount(() => onEdisi((e) => { if (e?.kliping?.length) rak = e.kliping; }));

  const utamaDulu = $derived(rak[0]);
  const sisa = $derived(rak.slice(1, 7));

  function metaBaris(k: LiveKliping): string {
    const m = k.n_media ?? (k.liputan ? k.liputan.length : 1);
    const g = k.n_grup ?? 1;
    return `${m} MEDIA · ${g} GRUP KEPEMILIKAN`;
  }
</script>

{#if utamaDulu}
  <section class="rak" aria-label="Rak kabar: liputan terkumpul lintas media">
    <div class="rak-head">
      <span class="inkbar"><span class="dot">●</span>RAK KABAR · SATU PERISTIWA, SEMUA LIPUTANNYA</span>
      <span class="eyebrow">JUDUL APA ADANYA DARI TIAP MEDIA · DIKELOMPOKKAN OTOMATIS TIAP TERBIT</span>
    </div>

    <!-- the lead cluster: the day's most independently corroborated story -->
    <article class="rak-utama" data-rise>
      <div class="rak-meta mono">
        <span class="rak-count">{metaBaris(utamaDulu)}</span>
        <span class="rak-sq" role="img" aria-label={metaBaris(utamaDulu)}>
          {#each utamaDulu.liputan ?? [utamaDulu.utama] as l}
            <i class:penuh={l.independen} title={l.media}></i>
          {/each}
        </span>
        {#if utamaDulu.titik_buta}
          <span class="stamp rak-buta" data-stamp-in>TITIK BUTA · SATU GRUP</span>
        {/if}
      </div>
      <h3 class="rak-judul display">
        {#if utamaDulu.utama.url}
          <a class="rak-link" href={utamaDulu.utama.url} target="_blank" rel="noopener">{utamaDulu.utama.judul}</a>
        {:else}
          {utamaDulu.utama.judul}
        {/if}
      </h3>
      {#if utamaDulu.liputan?.length}
        <ol class="rak-liputan">
          {#each utamaDulu.liputan.slice(0, 6) as l}
            <li>
              <span class="rak-media mono">{l.media}</span>
              <span class="rak-grup mono">{l.independen ? 'INDEPENDEN' : (l.grup ?? '')}</span>
              {#if l.url}
                <a class="rak-l-judul" href={l.url} target="_blank" rel="noopener">{l.judul}</a>
              {:else}
                <span class="rak-l-judul">{l.judul}</span>
              {/if}
            </li>
          {/each}
        </ol>
      {/if}
    </article>

    {#if sisa.length}
      <ol class="rak-sisa">
        {#each sisa as k}
          <li class="rak-baris" data-rise>
            {#if k.utama.url}
              <a class="rak-b-judul" href={k.utama.url} target="_blank" rel="noopener">{k.utama.judul}</a>
            {:else}
              <span class="rak-b-judul">{k.utama.judul}</span>
            {/if}
            <span class="rak-b-meta mono">
              {metaBaris(k)}
              {#if k.titik_buta}<span class="rak-buta-kecil">· TITIK BUTA</span>{/if}
            </span>
          </li>
        {/each}
      </ol>
    {/if}

    <p class="rak-kaki mono">■ MEDIA INDEPENDEN · □ MEDIA GRUP KONGLOMERASI · KEPEMILIKAN ADALAH FAKTA TERDOKUMENTASI, BUKAN PENILAIAN</p>
  </section>
{/if}

<style>
  .rak { margin-top: 34px; border-top: 2px solid var(--line); padding-top: 16px; }
  .rak-head { display: flex; justify-content: space-between; gap: 14px; flex-wrap: wrap; align-items: baseline; }

  .rak-utama { padding: 18px 0 20px; border-bottom: 1px solid var(--line); }
  .rak-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; font-size: 10px; letter-spacing: 0.16em; color: var(--muted); }
  .rak-sq { display: inline-flex; gap: 3px; }
  .rak-sq i { width: 9px; height: 9px; border: 1px solid var(--ink); background: transparent; }
  .rak-sq i.penuh { background: var(--ink); }
  .rak-buta {
    font-size: 9px;
    letter-spacing: 0.14em;
    color: var(--accent);
    border: 1px solid var(--accent);
    padding: 2px 7px 1px;
  }
  .rak-judul { font-size: var(--fs-4); line-height: 1.05; margin: 10px 0 14px; max-width: 26ch; }
  .rak-link { text-decoration: none; }
  .rak-link:hover { text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 4px; }

  .rak-liputan { list-style: none; margin: 0; padding: 0; display: grid; gap: 0; }
  .rak-liputan li {
    display: grid;
    grid-template-columns: 110px 130px 1fr;
    gap: 12px;
    align-items: baseline;
    padding: 7px 0;
    border-top: 1px dashed var(--line-soft);
    font-size: 13px;
  }
  @media (max-width: 720px) { .rak-liputan li { grid-template-columns: 90px 1fr; } .rak-grup { display: none; } }
  .rak-media { font-size: 10px; letter-spacing: 0.12em; }
  .rak-grup { font-size: 9.5px; letter-spacing: 0.1em; color: var(--muted); }
  .rak-l-judul { color: var(--ink); text-decoration: none; }
  a.rak-l-judul:hover { text-decoration: underline; text-underline-offset: 3px; }

  .rak-sisa { list-style: none; margin: 0; padding: 0; }
  .rak-baris {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: baseline;
    padding: 11px 0;
    border-bottom: 1px dashed var(--line-soft);
  }
  .rak-b-judul { font-size: 15px; line-height: 1.3; color: var(--ink); text-decoration: none; max-width: 62ch; }
  a.rak-b-judul:hover { text-decoration: underline; text-underline-offset: 3px; }
  .rak-b-meta { font-size: 9.5px; letter-spacing: 0.12em; color: var(--muted); white-space: nowrap; }
  .rak-buta-kecil { color: var(--accent); }

  .rak-kaki { margin-top: 12px; font-size: 9px; letter-spacing: 0.13em; color: var(--muted); }
</style>
