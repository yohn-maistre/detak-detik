<script lang="ts">
  /** Wajah Nusantara v2 — the magazine FEATURE (§13.14 MANUSIA pipeline).
      One of the archipelago's peoples per half-day, drawn from the reviewed
      registry (newsroom/data/atlas/manusia.json: verbatim Wikipedia lead,
      VERIFIED image + license, heritage items tied to the group). The live
      REST fetch may EXTEND the prose; the registry is the floor — the frame
      is never empty, the text never less than the reviewed extract. Rotation
      is calendar-deterministic (law 5), anchored so the inaugural plate is
      Suku Mee. */
  import { onMount } from 'svelte';
  import { drawEngraving, ENGRAVE_ATLAS } from '../lib/engrave';
  import SukuLokasi from './SukuLokasi.svelte';
  import MANUSIA from '../../newsroom/data/atlas/manusia.json';

  // slot 41275 = 2026-07-03 pagi — the edition Suku Mee (index 0) opened the magazine
  const ANKER = 41275;
  const SLOT = Math.floor(Date.now() / (12 * 3600_000));
  const p = MANUSIA[((SLOT - ANKER) % MANUSIA.length + MANUSIA.length) % MANUSIA.length]!;

  let extract = $state(p.ringkas);
  let live = $state(false);
  let img = $state(p.gambar?.url ?? '');

  /* the pull-quote: the second sentence of the reviewed extract, verbatim,
     only when it reads at quote length — otherwise the feature runs unquoted */
  const kalimat = p.ringkas.split(/(?<=\.)\s+/);
  const kutip = kalimat.length > 2 && kalimat[1]!.length > 50 && kalimat[1]!.length < 230 ? kalimat[1]! : null;

  const derajat = (v: number, pos: string, neg: string) => {
    const d = Math.abs(v); const deg = Math.floor(d); const men = Math.round((d - deg) * 60);
    return `${deg}°${String(men).padStart(2, '0')}'${v < 0 ? neg : pos}`;
  };
  const koordStr = `${derajat(p.koordinat[0]!, 'LU', 'LS')} ${derajat(p.koordinat[1]!, 'BT', 'BB')}`;

  let plat: HTMLCanvasElement | undefined = $state();
  $effect(() => {
    const el = plat;
    if (!el) return;
    const gambar = () => drawEngraving(el, { ...ENGRAVE_ATLAS, caption: `PLAT · ${p.nama.toUpperCase()}` });
    gambar();
    const ro = new ResizeObserver(gambar);
    ro.observe(el);
    return () => ro.disconnect();
  });

  onMount(() => {
    (async () => {
      try {
        const u = `https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(p.wikipedia.judul)}`;
        const res = await fetch(u, { signal: AbortSignal.timeout(6000) });
        const d = await res.json();
        // the live extract may only LENGTHEN the reviewed one, never shrink it
        if (d?.extract && d.extract.length > extract.length) {
          extract = d.extract.length > 900 ? d.extract.slice(0, 900).replace(/\s+\S*$/, '') + '…' : d.extract;
          live = true;
        }
      } catch { /* the reviewed registry text stands */ }
    })();
  });
</script>

<article class="wn" data-rise data-no-stempel data-ref="wajah">
  <div class="wn-grid">
    <div class="wn-teks">
      <span class="wn-kicker mono">WAJAH NUSANTARA · {p.wilayah.toUpperCase()}</span>
      <h2 class="wn-nama display">{p.nama.replace(/^(Suku|Orang)\s+/, '')}</h2>
      <p class="wn-extract" class:dua-kolom={extract.length > 420}>{extract}</p>
      {#if kutip}
        <blockquote class="wn-kutip fig">{kutip}</blockquote>
      {/if}
      <p class="wn-fakta mono">BAHASA · {p.bahasa.toUpperCase()}</p>
      <p class="wn-fakta mono">{koordStr} · BERGANTI DUA KALI SEHARI · TEKS APA ADANYA DARI ENSIKLOPEDIA</p>
      <a class="chip" href={p.wikipedia.url} target="_blank" rel="noopener">⊙ id.wikipedia{live ? ' · langsung' : ' · arsip redaksi'}</a>
    </div>
    <div class="wn-side">
      <figure class="wn-img-wrap">
        <div class="wn-img">
          {#if img}
            <img src={img} alt={p.nama} loading="lazy" onerror={() => (img = '')} />
          {:else}
            <div class="wn-plat">
              <canvas bind:this={plat} aria-label={`Plat gravir pengganti foto ${p.nama}`}></canvas>
              <span class="wn-plat-cap mono">PLAT PENGGANTI · FOTO TAK TERSEDIA DI ARSIP TERBUKA</span>
            </div>
          {/if}
        </div>
        <figcaption class="wn-cap mono">PLAT II · {p.nama.toUpperCase()}{#if img && p.gambar} — {p.gambar.atribusi}{/if}</figcaption>
      </figure>
      <SukuLokasi lat={p.koordinat[0]!} lon={p.koordinat[1]!} nama={p.nama} />
      {#if p.warisan?.length}
        <aside class="wn-warisan">
          <span class="wn-war-k mono">WARISAN YANG MENYERTAINYA</span>
          {#each p.warisan as w (w.nama)}
            <div class="wn-war-row">
              <b>{w.nama}</b>
              <p>{w.deskripsi}</p>
            </div>
          {/each}
        </aside>
      {/if}
    </div>
  </div>
</article>

<style>
  .wn { margin-bottom: clamp(28px, 5vw, 56px); }
  .wn-grid { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: clamp(20px, 4vw, 52px); align-items: start; }
  @media (max-width: 760px) { .wn-grid { grid-template-columns: 1fr; gap: 18px; } }
  .wn-teks { display: grid; gap: 12px; align-content: start; }
  .wn-side { display: grid; gap: 14px; align-content: start; }
  .wn-kicker { font-size: 10px; letter-spacing: 0.2em; color: var(--accent); }
  .wn-nama { font-family: 'Fraunces Variable', serif; font-weight: 300; font-size: clamp(54px, 11vw, 128px); line-height: 0.86; letter-spacing: -0.02em; color: var(--ink); }
  .wn-extract { font-size: clamp(15px, 1.8vw, 18px); line-height: 1.62; color: var(--ink); max-width: 62ch; }
  /* the magazine voice: a drop cap opens the feature */
  .wn-extract::first-letter {
    font-family: 'Fraunces Variable', serif; font-weight: 340;
    font-size: 3.2em; line-height: 0.8; float: left;
    padding: 4px 8px 0 0; color: var(--accent);
  }
  /* long reviewed+live text runs in measured columns on wide paper */
  @media (min-width: 1000px) { .wn-extract.dua-kolom { columns: 2; column-gap: 34px; max-width: none; } }
  .wn-kutip {
    font-size: clamp(18px, 2.4vw, 26px); line-height: 1.4; max-width: 44ch;
    border-left: 3px solid var(--accent); padding-left: 16px; margin: 4px 0;
  }
  .wn-fakta { font-size: 9px; letter-spacing: 0.14em; color: var(--muted); }
  .wn-teks .chip { justify-self: start; margin-top: 2px; text-decoration: none; }
  .wn-img-wrap { margin: 0; display: grid; gap: 8px; }
  .wn-img { aspect-ratio: 4 / 5; overflow: hidden; border: 1px solid var(--line); background: #ece1c9; }
  @media (max-width: 760px) { .wn-img { aspect-ratio: 16 / 10; } }
  .wn-img img { width: 100%; height: 100%; object-fit: cover; display: block; filter: saturate(0.95); }
  .wn-cap { font-size: 8px; letter-spacing: 0.14em; color: var(--muted); line-height: 1.6; }
  .wn-plat { width: 100%; height: 100%; display: grid; grid-template-rows: minmax(0, 1fr) auto; }
  .wn-plat canvas { width: 100%; height: 100%; min-height: 0; display: block; }
  .wn-plat-cap { font-size: 8.5px; letter-spacing: 0.18em; color: var(--muted); padding: 6px 10px; border-top: 1px solid var(--line); }
  .wn-warisan { display: grid; gap: 10px; border-top: 1px solid var(--line); padding-top: 12px; }
  .wn-war-k { font-size: 8.5px; letter-spacing: 0.18em; color: var(--muted); }
  .wn-war-row b { font-size: 13px; color: var(--ink); }
  .wn-war-row p { font-size: 12px; line-height: 1.5; color: var(--muted); margin-top: 2px; max-width: 40ch; }
</style>
