<script lang="ts">
  /** Edisi Feed: the front page as one surface. Entry №01 is the paper's own
      lead finding (DARI MEJA REDAKSI — SSR'd from the contoh prop, swapped by
      the live edition), then the day's press as ranked kliping rows: one
      story, all its coverage, scored by ownership DIVERSITY, not volume.
      Headlines open the Lembar Kliping dossier — a torn sheet carrying the
      lede, the machine summary (SARI · LANE C, when the newsroom gates one
      through), key points with their receipts, how each ownership group
      titled the story (verbatim, Lane A), and the full coverage list. Only
      outlet rows link out. Deep links: #/kliping/{id}. */
  import { onMount } from 'svelte';
  import { onEdisi, type LiveKliping, type LiveKlipingItem, type LiveKlipingMeta } from '../lib/edition';
  import { lockScroll, unlockScroll } from '../lib/scroll-lock';

  type LeadContoh = { headline: string; dek: string; chips: string[]; stamp: string; serial: string };
  let { lead }: { lead: LeadContoh } = $props();

  let rak = $state<LiveKliping[]>([]);
  let meta = $state<LiveKlipingMeta | null>(null);
  let liveLead = $state<{ headline: string; dek?: string; id?: string; edisi?: number } | null>(null);

  onMount(() => onEdisi((e) => {
    if (!e) return;
    if (e.kliping?.length) rak = e.kliping;
    if (e.kliping_meta) meta = e.kliping_meta;
    const t = e.temuan?.[0];
    if (t?.headline) liveLead = { headline: t.headline, dek: e.dek ?? t.body, id: t.temuan_id, edisi: e.edisi };
    bukaDariHash(); // a shared #/kliping/{id} link opens once the data exists
  }));

  // №01 — the paper's voice: contoh until the edition lands, then live with
  // live receipts (contoh chips must never sit beside a live claim)
  const judul = $derived(liveLead?.headline ?? lead.headline);
  const dek = $derived(liveLead ? (liveLead.dek ?? '') : lead.dek);
  const chips = $derived(liveLead ? (liveLead.id ? [liveLead.id] : []) : lead.chips);
  const stampTeks = $derived(liveLead ? 'LOLOS PERIKSA FAKTA' : lead.stamp);
  const serial = $derived(liveLead?.edisi != null ? `EDISI #${liveLead.edisi}` : lead.serial);
  const sumberTag = $derived(liveLead ? 'LANGSUNG · RUANG REDAKSI' : 'DATA CONTOH');

  // the four desks live on as filter chips over one surface
  const MEJA = [
    { id: 'semua', label: 'SEMUA' },
    { id: 'nasional', label: 'NASIONAL' },
    { id: 'daerah', label: 'DAERAH' },
    { id: 'ekonomi', label: 'EKONOMI' },
    { id: 'tekno', label: 'TEKNO' },
    { id: 'alam', label: 'ALAM' },
    { id: 'dunia', label: 'DUNIA' },
  ] as const;
  let pilihMeja = $state<string>('semua');
  const tampil = $derived(pilihMeja === 'semua' ? rak : rak.filter((k) => (k.meja ?? 'nasional') === pilihMeja));

  const metaStrip = $derived(meta
    ? `${meta.judul ?? '?'} JUDUL · ${meta.klaster ?? rak.length} KLIPING · DISUSUN ${meta.disusun ?? '--.--'} WIB${meta.gelap ? ` · ${meta.gelap} SUMBER GELAP` : ''}`
    : null);

  function metaBaris(k: LiveKliping): string {
    const m = k.n_media ?? (k.liputan ? k.liputan.length : 1);
    const g = k.n_grup ?? 1;
    return `${m} MEDIA · ${g} GRUP`;
  }

  /* ---- Lembar Kliping: the dossier ---- */
  let buka = $state<LiveKliping | null>(null);
  let tutupEl: HTMLButtonElement | undefined = $state();
  const lembarIsi = $derived(buka ? (buka.liputan?.length ? buka.liputan : [buka.utama]) : []);

  /** SUARA (v2a): how each ownership group titled the story — a pure Lane A
      rearrangement: one verbatim headline per group, no synthesis. */
  const suara = $derived.by(() => {
    if (!buka) return [];
    const byGrup = new Map<string, LiveKlipingItem>();
    for (const l of buka.liputan ?? []) {
      const g = l.independen ? `INDEPENDEN · ${l.media.toUpperCase()}` : (l.grup ?? 'GRUP TIDAK TERCATAT').toUpperCase();
      if (!byGrup.has(g)) byGrup.set(g, l);
    }
    return [...byGrup.entries()].map(([grup, item]) => ({ grup, item }));
  });

  $effect(() => {
    if (!buka) return;
    lockScroll();
    tutupEl?.focus();
    return () => unlockScroll();
  });

  /* ---- hash routing: back button + share work ---- */
  const idFor = (k: LiveKliping) => k.id ?? `k${rak.indexOf(k)}`;
  function bukaLembar(k: LiveKliping) {
    buka = k;
    const h = `#/kliping/${idFor(k)}`;
    if (location.hash !== h) history.pushState(null, '', h);
  }
  function tutupLembar() {
    if (!buka) return;
    buka = null;
    if (location.hash.startsWith('#/kliping/')) history.replaceState(null, '', location.pathname + location.search);
  }
  function bukaDariHash() {
    const m = location.hash.match(/^#\/kliping\/(.+)$/);
    if (!m) { buka = null; return; }
    const k = rak.find((x) => idFor(x) === m[1]);
    if (k) buka = k;
  }
</script>

<section class="feed" aria-label="Halaman muka: temuan redaksi dan liputan terkumpul">
  <div class="feed-head">
    <span class="inkbar"><span class="dot">●</span>HALAMAN MUKA</span>
    <span class="eyebrow">SATU PERISTIWA, SEMUA LIPUTANNYA · JUDUL VERBATIM, DIKELOMPOKKAN OTOMATIS TIAP TERBIT</span>
  </div>

  <!-- №01 · the paper's own lead, first entry of the same feed -->
  <article class="feed-lead">
    <p class="feed-lead-tag mono"><span class="feed-lead-no num">№ 01</span> DARI MEJA REDAKSI</p>
    <h2 class="feed-judul display">{judul}</h2>
    {#if dek}<p class="feed-dek">{dek}</p>{/if}
    <div class="feed-resi">
      {#each chips as c (c)}
        <button class="chip"><span class="tick">⊙</span>{c}</button>
      {/each}
      <span class="stamp feed-stamp" data-stamp-in>{stampTeks}</span>
      <span class="feed-resi-meta mono">{serial} · {sumberTag}</span>
    </div>
  </article>

  <div class="feed-bar">
    <nav class="feed-meja" aria-label="Saring menurut meja">
      {#each MEJA as m (m.id)}
        <button class="feed-meja-btn mono" class:aktif={pilihMeja === m.id} onclick={() => (pilihMeja = m.id)}>{m.label}</button>
      {/each}
    </nav>
    {#if metaStrip}
      <span class="feed-strip mono">{metaStrip}</span>
    {/if}
  </div>

  {#if tampil.length}
    <ol class="feed-rows">
      {#each tampil as k, i (k.id ?? i)}
        <li class="feed-baris" data-rise>
          <span class="feed-no ghost-num num" aria-hidden="true">{String(i + 2).padStart(2, '0')}</span>
          <div class="feed-isi">
            <button class="feed-b-judul" onclick={() => bukaLembar(k)}>{k.utama.judul}</button>
            <p class="feed-meta mono">
              <span class="feed-sq" role="img" aria-label={metaBaris(k)}>
                {#each k.liputan ?? [k.utama] as l}<i class:penuh={l.independen} title={l.media}></i>{/each}
              </span>
              <span>{metaBaris(k)} · MEJA {(k.meja ?? 'nasional').toUpperCase()}</span>
              {#if k.resmi}<span class="feed-resmi">RESMI</span>{/if}
              {#if k.hukum?.length}<span class="feed-hukum">§ {k.hukum[0].toUpperCase()}</span>{/if}
              {#if k.titik_buta}<span class="feed-buta">TITIK BUTA · SATU GRUP</span>{/if}
            </p>
          </div>
        </li>
      {/each}
    </ol>
    <p class="feed-kaki mono">■ INDEPENDEN · □ GRUP KONGLOMERASI · JUDUL MEMBUKA LEMBAR KLIPING</p>
  {:else}
    <!-- skeleton rows: the rack's silhouette while the edition arrives, so the
         page never shifts under the reader -->
    <ol class="feed-rows feed-rangka" aria-hidden="true">
      {#each Array(5) as _, i (i)}
        <li class="feed-baris">
          <span class="feed-no ghost-num num">{String(i + 2).padStart(2, '0')}</span>
          <div class="feed-isi">
            <span class="rangka-j" style={`width:${78 - (i % 3) * 14}%`}></span>
            <span class="rangka-m"></span>
          </div>
        </li>
      {/each}
    </ol>
    <p class="feed-tunggu mono">MENYUSUN RAK · KLIPING TERBIT OTOMATIS 2× SEHARI</p>
  {/if}
</section>

<!-- Lembar Kliping: the tear-off dossier for one cluster -->
{#if buka}
  <button class="lk-latar" aria-label="Tutup lembar kliping" onclick={tutupLembar}></button>
  <aside class="lk" role="dialog" aria-modal="true" aria-label="Lembar kliping" data-lenis-prevent>
    <header class="lk-kepala">
      <span class="lk-tag mono">LEMBAR KLIPING · MEJA {(buka.meja ?? 'nasional').toUpperCase()}</span>
      <button class="lk-tutup mono" bind:this={tutupEl} onclick={tutupLembar}>TUTUP ✕</button>
    </header>
    <div class="lk-meta mono">
      <span>{metaBaris(buka)} KEPEMILIKAN</span>
      <span class="lk-sq" role="img" aria-label={metaBaris(buka)}>
        {#each lembarIsi as l}<i class:penuh={l.independen} title={l.media}></i>{/each}
      </span>
      {#if buka.titik_buta}<span class="stamp lk-buta">TITIK BUTA · SATU GRUP</span>{/if}
    </div>
    <h3 class="lk-judul display">{buka.utama.judul}</h3>
    <p class="lk-kredit mono">JUDUL VERBATIM · {buka.utama.media.toUpperCase()}</p>
    {#if buka.hukum?.length}
      <!-- laws the headlines themselves cite (Lane A regex, newsroom) — becomes
           a link into the legal registry when LAPIS HUKUM lands (§13.11) -->
      <p class="lk-hukum mono">MENYEBUT {#each buka.hukum as h, i (h)}{#if i}<span class="lk-hukum-pisah"> · </span>{/if}<span class="lk-hukum-uu">§ {h.toUpperCase()}</span>{/each}</p>
    {/if}

    {#if buka.utama.ringkas}
      <blockquote class="lk-lede">
        {buka.utama.ringkas}
        <cite class="mono">— {buka.utama.media.toUpperCase()}</cite>
      </blockquote>
    {/if}

    {#if buka.sari}
      <div class="lk-sec">
        <span class="lk-sec-k mono">RINGKASAN · DISUSUN MESIN</span>
        <p class="lk-sari">{buka.sari}</p>
        <button class="chip lane-c">LANE C · DIPERIKSA TERHADAP KLIPING</button>
      </div>
    {/if}

    {#if buka.butir?.length}
      <div class="lk-sec">
        <span class="lk-sec-k mono">POIN UTAMA · KUTIPAN VERBATIM</span>
        <ol class="lk-butir">
          {#each buka.butir as b, i (i)}
            <li>
              <span class="lk-butir-teks">{b.teks}</span>
              {#if b.media}<span class="lk-butir-cite mono">— {b.media.toUpperCase()}</span>{/if}
            </li>
          {/each}
        </ol>
      </div>
    {/if}

    {#if suara.length >= 2}
      <div class="lk-sec">
        <span class="lk-sec-k mono">JUDUL PER GRUP KEPEMILIKAN</span>
        <ol class="lk-suara">
          {#each suara as s (s.grup)}
            <li>
              <span class="lk-suara-grup mono" class:independen={s.item.independen}>{s.grup}</span>
              {#if s.item.url}
                <a class="lk-suara-judul" href={s.item.url} target="_blank" rel="noopener">“{s.item.judul}”</a>
              {:else}
                <span class="lk-suara-judul">“{s.item.judul}”</span>
              {/if}
              <span class="lk-suara-media mono">{s.item.media}</span>
            </li>
          {/each}
        </ol>
      </div>
    {/if}

    <div class="lk-sec">
      <span class="lk-sec-k mono">KUMPULAN SUMBER · TAUTAN MEMBUKA SITUS ASLINYA</span>
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
    </div>

    <p class="lk-kaki mono">■ INDEPENDEN · □ GRUP KONGLOMERASI · KEPEMILIKAN DICATAT DARI DOKUMEN PUBLIK · <a class="ink-link" href="/sumber#kliping">METODE →</a></p>
  </aside>
{/if}

<svelte:window onhashchange={bukaDariHash} onkeydown={(e) => { if (e.key === 'Escape') tutupLembar(); }} />

<style>
  .feed { margin-top: 26px; border-top: 2px solid var(--line); padding-top: 16px; }
  .feed-head { display: flex; justify-content: space-between; gap: 14px; flex-wrap: wrap; align-items: baseline; }

  /* №01 — the paper's own lead; type rides above the edition's plate */
  .feed-lead { position: relative; padding: 18px 0 22px; }
  .feed-lead-tag, .feed-judul, .feed-dek, .feed-resi { position: relative; z-index: 1; }
  .feed-lead-tag { font-size: 10px; letter-spacing: 0.18em; color: var(--accent); }
  .feed-lead-no { margin-right: 10px; color: var(--muted); }
  .feed-judul { font-family: var(--font-display); font-weight: var(--disp-weight); font-size: clamp(30px, 5vw, 64px); line-height: 0.98; letter-spacing: var(--disp-track); color: var(--ink); margin: 12px 0 0; max-width: 22ch; }
  .feed-dek { font-size: clamp(14px, 1.7vw, 17px); color: var(--muted); max-width: 62ch; line-height: 1.5; margin-top: 12px; }
  .feed-resi { display: flex; align-items: center; gap: 10px 12px; flex-wrap: wrap; margin-top: 16px; }
  .feed-stamp { font-size: 9px; }
  .feed-resi-meta { font-size: 9px; letter-spacing: 0.14em; color: var(--muted); }

  .feed-bar { display: flex; justify-content: space-between; align-items: baseline; gap: 14px; flex-wrap: wrap; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line-soft); padding: 10px 0 8px; }
  /* seven desks: the chip row scrolls sideways on a phone, with a fade edge */
  .feed-meja {
    display: flex; gap: 16px;
    overflow-x: auto; scrollbar-width: none; white-space: nowrap;
    max-width: 100%;
    -webkit-mask-image: linear-gradient(90deg, #000 calc(100% - 22px), transparent);
    mask-image: linear-gradient(90deg, #000 calc(100% - 22px), transparent);
  }
  .feed-meja::-webkit-scrollbar { display: none; }
  .feed-meja-btn {
    background: none; border: none; padding: 0 0 3px; cursor: pointer;
    font-size: 10px; letter-spacing: 0.16em; color: var(--muted);
    border-bottom: 1px solid transparent;
  }
  .feed-meja-btn:hover { color: var(--ink); border-bottom-color: var(--line-soft); }
  .feed-meja-btn.aktif { color: var(--ink); border-bottom: 2px solid var(--accent); }
  .feed-strip { font-size: 9px; letter-spacing: 0.13em; color: var(--muted); }

  /* №02… — the ranked press, Digg grammar: rank left, generous rows */
  .feed-rows { list-style: none; margin: 0; padding: 0; }
  .feed-baris {
    display: grid;
    grid-template-columns: 46px 1fr;
    gap: 4px 12px;
    align-items: start;
    padding: 15px 0 14px;
    border-bottom: 1px dashed var(--line-soft);
  }
  .feed-no { font-size: 24px; line-height: 1.15; opacity: 0.5; pointer-events: none; }
  .feed-isi { display: grid; gap: 6px; min-width: 0; }
  .feed-b-judul {
    background: none; border: none; padding: 0; margin: 0;
    font-size: clamp(15px, 1.8vw, 17px); line-height: 1.35; color: var(--ink);
    text-align: left; cursor: pointer; max-width: 68ch; font-family: inherit;
  }
  .feed-b-judul:hover { text-decoration: underline; text-underline-offset: 3px; }
  .feed-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 9.5px; letter-spacing: 0.12em; color: var(--muted); }
  .feed-sq, .lk-sq { display: inline-flex; gap: 3px; }
  .feed-sq i, .lk-sq i { width: 8px; height: 8px; border: 1px solid var(--ink); background: transparent; }
  .feed-sq i.penuh, .lk-sq i.penuh { background: var(--ink); }
  .feed-buta { color: var(--accent); border: 1px solid var(--accent); padding: 1px 6px; font-size: 8.5px; letter-spacing: 0.12em; }
  .feed-resmi { color: var(--accent2); border: 1px solid var(--accent2); padding: 1px 6px; font-size: 8.5px; letter-spacing: 0.12em; }
  /* a law named in the headlines: a factual stamp, ink not alarm */
  .feed-hukum { color: var(--ink); opacity: 0.7; font-size: 8.5px; letter-spacing: 0.12em; }

  /* skeleton */
  .rangka-j, .rangka-m { display: block; background: color-mix(in oklab, var(--ink) 8%, transparent); }
  .rangka-j { height: 14px; max-width: 62ch; }
  .rangka-m { height: 8px; width: 190px; margin-top: 2px; }
  .feed-rangka .feed-baris { animation: rangka 1.6s ease-in-out infinite; }
  .feed-rangka .feed-baris:nth-child(2n) { animation-delay: 0.5s; }
  @keyframes rangka { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
  @media (prefers-reduced-motion: reduce) { .feed-rangka .feed-baris { animation: none; } }
  .feed-kaki { margin-top: 12px; font-size: 9px; letter-spacing: 0.13em; color: var(--muted); }
  .feed-tunggu { padding: 18px 0 6px; font-size: 10px; letter-spacing: 0.14em; color: var(--muted); }

  /* ---- Lembar Kliping: the tear-off dossier ---- */
  .lk-latar { position: fixed; inset: 0; z-index: 158; background: rgba(12, 10, 8, 0.5); border: none; padding: 0; margin: 0; cursor: pointer; }
  .lk {
    position: fixed;
    left: 50%;
    bottom: 0;
    transform: translateX(-50%);
    z-index: 159;
    width: min(880px, 96vw);
    max-height: 92dvh;
    overflow-y: auto;
    background: var(--bg);
    color: var(--ink);
    padding: 32px clamp(16px, 4vw, 40px) 36px;
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
  .lk-buta { font-size: 9px; letter-spacing: 0.14em; color: var(--accent); border-color: var(--accent); }
  .lk-judul { font-size: clamp(22px, 3.4vw, 34px); line-height: 1.08; margin: 12px 0 4px; max-width: 30ch; }
  .lk-kredit { font-size: 8.5px; letter-spacing: 0.14em; color: var(--muted); }
  .lk-hukum { font-size: 9px; letter-spacing: 0.14em; color: var(--muted); margin-top: 2px; }
  .lk-hukum-uu { color: var(--ink); }
  .lk-hukum-pisah { color: var(--muted); }

  .lk-lede { margin: 14px 0 0; padding-left: 14px; border-left: 2px solid var(--line); font-size: 14.5px; line-height: 1.6; color: var(--ink); max-width: 62ch; }
  .lk-lede cite { display: block; margin-top: 6px; font-style: normal; font-size: 8.5px; letter-spacing: 0.14em; color: var(--muted); }

  .lk-sec { margin-top: 20px; border-top: 1px solid var(--line); padding-top: 12px; }
  .lk-sec-k { display: block; font-size: 9px; letter-spacing: 0.18em; color: var(--muted); margin-bottom: 10px; }
  .lk-sari { font-size: 14.5px; line-height: 1.6; max-width: 62ch; margin-bottom: 10px; }

  .lk-butir { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .lk-butir li { display: grid; gap: 2px; padding-left: 16px; position: relative; font-size: 14px; line-height: 1.5; max-width: 62ch; }
  .lk-butir li::before { content: '■'; position: absolute; left: 0; top: 2px; font-size: 8px; color: var(--accent); }
  .lk-butir-cite { font-size: 8.5px; letter-spacing: 0.12em; color: var(--muted); }

  .lk-suara { list-style: none; margin: 0; padding: 0; }
  .lk-suara li { display: grid; gap: 3px; padding: 9px 0; border-top: 1px dashed var(--line-soft); }
  .lk-suara li:first-child { border-top: none; }
  .lk-suara-grup { font-size: 9px; letter-spacing: 0.14em; color: var(--muted); }
  .lk-suara-grup.independen { color: var(--accent); }
  .lk-suara-judul { font-size: 14.5px; line-height: 1.45; color: var(--ink); text-decoration: none; max-width: 64ch; }
  a.lk-suara-judul:hover { text-decoration: underline; text-underline-offset: 3px; }
  .lk-suara-media { font-size: 8.5px; letter-spacing: 0.12em; color: var(--muted); }

  .lk-liputan { list-style: none; margin: 0; padding: 0; }
  .lk-liputan li { display: grid; grid-template-columns: 110px 130px 1fr; gap: 12px; align-items: baseline; padding: 9px 0; border-top: 1px dashed var(--line-soft); font-size: 13.5px; }
  .lk-liputan li:first-child { border-top: none; }
  @media (max-width: 640px) { .lk-liputan li { grid-template-columns: 92px 1fr; } .lk-grup { display: none; } }
  .lk-media { font-size: 10px; letter-spacing: 0.12em; }
  .lk-grup { font-size: 9.5px; letter-spacing: 0.1em; color: var(--muted); }
  .lk-l-judul { color: var(--ink); text-decoration: none; }
  a.lk-l-judul:hover { text-decoration: underline; text-underline-offset: 3px; }
  .lk-luar { color: var(--accent); font-size: 11px; }
  .lk-kaki { margin-top: 16px; font-size: 8.5px; letter-spacing: 0.12em; color: var(--muted); }
</style>
