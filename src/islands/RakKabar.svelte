<script lang="ts">
  /** Rak Kabar: the clustered newsstand. The kliping desk gathers the day's
      coverage across the roster, clusters the same story across outlets, and
      scores each cluster by DIVERSITY of ownership, not volume. Everything
      printed here is Lane A verbatim: headlines are the outlets' own words,
      linked; the paper adds only documented ownership facts. The board
      renders nothing until a live edition carries kliping[]. */
  import { onMount } from 'svelte';
  import { onEdisi, type LiveKliping, type LiveKlipingMeta } from '../lib/edition';

  let rak = $state<LiveKliping[]>([]);
  let meta = $state<LiveKlipingMeta | null>(null);
  onMount(() => onEdisi((e) => {
    if (e?.kliping?.length) rak = e.kliping;
    if (e?.kliping_meta) meta = e.kliping_meta;
  }));

  // the four desks live on as filter chips over one surface
  const MEJA = [
    { id: 'semua', label: 'SEMUA' },
    { id: 'nasional', label: 'NASIONAL' },
    { id: 'daerah', label: 'DAERAH' },
    { id: 'alam', label: 'ALAM' },
    { id: 'dunia', label: 'DUNIA' },
  ] as const;
  let pilihMeja = $state<string>('semua');
  const tampil = $derived(pilihMeja === 'semua' ? rak : rak.filter((k) => (k.meja ?? 'nasional') === pilihMeja));

  const utamaDulu = $derived(tampil[0]);
  const sisa = $derived(tampil.slice(1, 7));

  const metaStrip = $derived(meta
    ? `${meta.judul ?? '?'} JUDUL · ${meta.klaster ?? rak.length} KLIPING · DISUSUN ${meta.disusun ?? '--.--'} WIB${meta.gelap ? ` · ${meta.gelap} SUMBER GELAP` : ''}`
    : null);

  function metaBaris(k: LiveKliping): string {
    const m = k.n_media ?? (k.liputan ? k.liputan.length : 1);
    const g = k.n_grup ?? 1;
    return `${m} MEDIA · ${g} GRUP KEPEMILIKAN`;
  }

  /** Lembar Kliping: headlines open the tear-off sheet — the full coverage
      list with ownership labels. Only the outlet rows inside link out. */
  let buka = $state<LiveKliping | null>(null);
  let tutupEl: HTMLButtonElement | undefined = $state();
  const lembarIsi = $derived(buka ? (buka.liputan?.length ? buka.liputan : [buka.utama]) : []);
  $effect(() => {
    if (!buka) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    tutupEl?.focus();
    return () => { document.body.style.overflow = prev; };
  });
</script>

{#if utamaDulu}
  <section class="rak" aria-label="Rak kabar: liputan terkumpul lintas media">
    <div class="rak-head">
      <span class="inkbar"><span class="dot">●</span>RAK KABAR · SATU PERISTIWA, SEMUA LIPUTANNYA</span>
      <span class="eyebrow">JUDUL APA ADANYA DARI TIAP MEDIA · DIKELOMPOKKAN OTOMATIS TIAP TERBIT</span>
    </div>
    <div class="rak-bar">
      <nav class="rak-meja" aria-label="Saring menurut meja">
        {#each MEJA as m (m.id)}
          <button class="rak-meja-btn mono" class:aktif={pilihMeja === m.id} onclick={() => (pilihMeja = m.id)}>{m.label}</button>
        {/each}
      </nav>
      {#if metaStrip}
        <span class="rak-strip mono">{metaStrip}</span>
      {/if}
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
        <button class="rak-buka" onclick={() => (buka = utamaDulu)}>{utamaDulu.utama.judul}</button>
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
        {#each sisa as k, i (k.id ?? i)}
          <li class="rak-baris" data-rise>
            <span class="rak-no ghost-num num" aria-hidden="true">{String(i + 2).padStart(2, '0')}</span>
            <button class="rak-buka rak-b-judul" onclick={() => (buka = k)}>{k.utama.judul}</button>
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

  <!-- Lembar Kliping: the tear-off sheet for one cluster -->
  {#if buka}
    <button class="lk-latar" aria-label="Tutup lembar kliping" onclick={() => (buka = null)}></button>
    <aside class="lk" role="dialog" aria-modal="true" aria-label="Lembar kliping">
      <header class="lk-kepala">
        <span class="lk-tag mono">LEMBAR KLIPING · MEJA {(buka.meja ?? 'nasional').toUpperCase()}</span>
        <button class="lk-tutup mono" bind:this={tutupEl} onclick={() => (buka = null)}>TUTUP ✕</button>
      </header>
      <div class="lk-meta mono">
        <span>{metaBaris(buka)}</span>
        <span class="rak-sq" role="img" aria-label={metaBaris(buka)}>
          {#each lembarIsi as l}<i class:penuh={l.independen} title={l.media}></i>{/each}
        </span>
        {#if buka.titik_buta}<span class="stamp rak-buta">TITIK BUTA · SATU GRUP</span>{/if}
      </div>
      <h3 class="lk-judul display">{buka.utama.judul}</h3>
      <p class="lk-cat mono">JUDUL APA ADANYA DARI TIAP MEDIA · TAUTAN MEMBUKA SITUS MEDIA ASLINYA</p>
      <ol class="lk-liputan">
        {#each lembarIsi as l}
          <li>
            <span class="lk-media mono">{l.media}</span>
            <span class="lk-grup mono">{l.independen ? 'INDEPENDEN' : (l.grup ?? '')}</span>
            {#if l.url}
              <a class="lk-l-judul" href={l.url} target="_blank" rel="noopener">{l.judul} <span class="lk-luar" aria-hidden="true">↗</span></a>
            {:else}
              <span class="lk-l-judul">{l.judul}</span>
            {/if}
          </li>
        {/each}
      </ol>
      <p class="lk-kaki mono">■ MEDIA INDEPENDEN · □ MEDIA GRUP KONGLOMERASI · KEPEMILIKAN ADALAH FAKTA TERDOKUMENTASI, BUKAN PENILAIAN</p>
    </aside>
  {/if}
{/if}

<svelte:window onkeydown={(e) => { if (e.key === 'Escape') buka = null; }} />

<style>
  .rak { margin-top: 34px; border-top: 2px solid var(--line); padding-top: 16px; }
  .rak-head { display: flex; justify-content: space-between; gap: 14px; flex-wrap: wrap; align-items: baseline; }

  .rak-bar { display: flex; justify-content: space-between; align-items: baseline; gap: 14px; flex-wrap: wrap; margin-top: 12px; border-bottom: 1px solid var(--line-soft); padding-bottom: 8px; }
  .rak-meja { display: flex; gap: 16px; }
  .rak-meja-btn {
    background: none; border: none; padding: 0 0 3px; cursor: pointer;
    font-size: 10px; letter-spacing: 0.16em; color: var(--muted);
    border-bottom: 1px solid transparent;
  }
  .rak-meja-btn:hover { color: var(--ink); border-bottom-color: var(--line-soft); }
  .rak-meja-btn.aktif { color: var(--ink); border-bottom: 2px solid var(--accent); }
  .rak-strip { font-size: 9px; letter-spacing: 0.13em; color: var(--muted); }

  .rak-no { position: absolute; top: 8px; right: 0; font-size: 26px; opacity: 0.5; pointer-events: none; }

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
  /* headlines are buttons: they open the Lembar Kliping, not an external site */
  .rak-buka { background: none; border: none; padding: 0; margin: 0; font: inherit; color: inherit; letter-spacing: inherit; line-height: inherit; text-align: left; cursor: pointer; }
  .rak-buka:hover { text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 4px; }

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
    position: relative;
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: baseline;
    padding: 11px 44px 11px 0;
    border-bottom: 1px dashed var(--line-soft);
  }
  .rak-b-judul { font-size: 15px; line-height: 1.3; color: var(--ink); text-decoration: none; max-width: 62ch; }
  .rak-buka.rak-b-judul:hover { text-decoration-thickness: 1px; text-underline-offset: 3px; }
  .rak-b-meta { font-size: 9.5px; letter-spacing: 0.12em; color: var(--muted); white-space: nowrap; }
  .rak-buta-kecil { color: var(--accent); }

  .rak-kaki { margin-top: 12px; font-size: 9px; letter-spacing: 0.13em; color: var(--muted); }

  /* ---- Lembar Kliping: the tear-off sheet ---- */
  .lk-latar { position: fixed; inset: 0; z-index: 158; background: rgba(12, 10, 8, 0.46); border: none; padding: 0; margin: 0; cursor: pointer; }
  .lk {
    position: fixed;
    left: 50%;
    bottom: 0;
    transform: translateX(-50%);
    z-index: 159;
    width: min(760px, 96vw);
    max-height: 84dvh;
    overflow-y: auto;
    background: var(--bg);
    color: var(--ink);
    padding: 30px clamp(16px, 4vw, 36px) 34px;
    box-shadow: 0 -16px 60px rgba(0, 0, 0, 0.4);
    /* the torn top edge: the sheet is pulled off the newsstand */
    clip-path: polygon(0 12px, 4% 5px, 9% 11px, 14% 3px, 19% 10px, 25% 4px, 31% 12px, 37% 6px, 43% 11px, 50% 3px, 57% 10px, 63% 5px, 69% 12px, 75% 4px, 81% 10px, 87% 3px, 93% 9px, 100% 5px, 100% 100%, 0 100%);
    animation: lk-naik 0.4s var(--ease-out);
  }
  @keyframes lk-naik {
    from { transform: translate(-50%, 26px); opacity: 0; }
    to { transform: translate(-50%, 0); opacity: 1; }
  }
  @media (prefers-reduced-motion: reduce) { .lk { animation: none; } }
  .lk-kepala { display: flex; justify-content: space-between; align-items: baseline; gap: 14px; border-bottom: 2px solid var(--line); padding-bottom: 10px; margin-bottom: 12px; }
  .lk-tag { font-size: 9px; letter-spacing: 0.18em; color: var(--accent); }
  .lk-tutup { background: none; border: 1px solid var(--line); padding: 4px 9px 3px; font-size: 9px; letter-spacing: 0.14em; color: var(--ink); cursor: pointer; }
  .lk-tutup:hover { border-color: var(--accent); color: var(--accent); }
  .lk-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; font-size: 10px; letter-spacing: 0.16em; color: var(--muted); }
  .lk-judul { font-size: clamp(20px, 3.2vw, 30px); line-height: 1.1; margin: 10px 0 6px; max-width: 30ch; }
  .lk-cat { font-size: 8.5px; letter-spacing: 0.14em; color: var(--muted); margin-bottom: 4px; }
  .lk-liputan { list-style: none; margin: 8px 0 0; padding: 0; }
  .lk-liputan li { display: grid; grid-template-columns: 110px 130px 1fr; gap: 12px; align-items: baseline; padding: 9px 0; border-top: 1px dashed var(--line-soft); font-size: 13.5px; }
  @media (max-width: 640px) { .lk-liputan li { grid-template-columns: 92px 1fr; } .lk-grup { display: none; } }
  .lk-media { font-size: 10px; letter-spacing: 0.12em; }
  .lk-grup { font-size: 9.5px; letter-spacing: 0.1em; color: var(--muted); }
  .lk-l-judul { color: var(--ink); text-decoration: none; }
  a.lk-l-judul:hover { text-decoration: underline; text-underline-offset: 3px; }
  .lk-luar { color: var(--accent); font-size: 11px; }
  .lk-kaki { margin-top: 14px; font-size: 8.5px; letter-spacing: 0.12em; color: var(--muted); }
</style>
