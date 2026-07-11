<script lang="ts">
  /**
   * Galeri Nusantara — RUPA only (§13.17: the species plate moved to Zona
   * Hayati; one owner). A curated public-domain painting each day, image
   * beside its reading: painter, year, medium, where it hangs now, and a
   * short writeup with a provenance line. The image is pulled from the
   * painting's id.wikipedia article lead (the reliable path); if that is
   * dark, the engraved plate stands — the absence is documented, never a
   * broken page. Rotation is calendar-deterministic (law 5).
   */
  import { onMount } from 'svelte';
  import RUPA from '../../newsroom/data/atlas/rupa.json';

  const HARI = Math.floor(Date.now() / 86_400_000);
  const rupa = RUPA[HARI % RUPA.length]!;

  let img = $state('');
  let live = $state(false);

  onMount(() => {
    (async () => {
      try {
        // the painting's own id.wikipedia article lead image — same reliable
        // REST path the Wajah feature uses, no fragile Commons hash guessing
        const u = `https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(rupa.wikipedia)}`;
        const res = await fetch(u, { signal: AbortSignal.timeout(6000) });
        const d = await res.json();
        const src = d?.originalimage?.source ?? d?.thumbnail?.source;
        if (src) { img = src; live = true; }
      } catch { /* the engraved plate stands */ }
    })();
  });

  const wikiUrl = `https://id.wikipedia.org/wiki/${encodeURIComponent(rupa.wikipedia.replace(/ /g, '_'))}`;
</script>

<!-- RUPA only: the species plate moved to Zona Hayati (one owner, §13.17).
     One curated painting a day, image beside its reading. -->
<div class="gn" data-rise data-no-stempel>
  <figure class="gn-plat">
    <div class="gn-img">
      {#if img}
        <img src={img} alt={rupa.judul} loading="lazy" onerror={() => (img = '')} />
      {:else}
        <div class="gn-kosong"><span class="mono">PLAT · {rupa.judul.toUpperCase()}</span></div>
      {/if}
    </div>
    <figcaption>
      <span class="gn-kicker mono">RUPA · KURASI · SATU LUKISAN TIAP HARI</span>
      <h4 class="gn-judul fig">{rupa.judul}</h4>
      <!-- museum-label grammar: artist / year / medium / where it hangs -->
      <p class="gn-label mono">{rupa.seniman} · {rupa.tahun}<br />{rupa.medium} · {rupa.koleksi}</p>
      <p class="gn-blurb">{rupa.writeup}</p>
      <p class="gn-provenans fig">{rupa.provenans}</p>
      <div class="gn-chips">
        <a class="chip" href={wikiUrl} target="_blank" rel="noopener">⊙ id.wikipedia{live ? ' · gambar langsung' : ''}</a>
        <span class="chip" data-no-link>⊙ {rupa.lisensi}</span>
      </div>
    </figcaption>
  </figure>
</div>

<style>
  .gn { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: clamp(24px, 5vw, 56px); align-items: start; }
  @media (max-width: 760px) { .gn { grid-template-columns: 1fr; } }
  /* no double-frame box: the image carries a single hairline, the caption opens beside */
  .gn-plat { margin: 0; display: contents; }
  .gn-img { aspect-ratio: 4 / 3; background: #ece1c9; overflow: hidden; border: 1px solid var(--line); }
  .gn-img img { width: 100%; height: 100%; object-fit: cover; display: block; filter: saturate(0.95); }
  .gn-kosong {
    width: 100%; height: 100%; display: grid; place-items: center;
    background: repeating-linear-gradient(45deg, color-mix(in oklab, var(--line) 30%, transparent) 0 1px, transparent 1px 7px);
  }
  .gn-kosong span { font-size: 9px; letter-spacing: 0.24em; color: var(--muted); }
  figcaption { padding: 0; display: grid; gap: 7px; align-content: start; }
  @media (max-width: 760px) { figcaption { padding-top: 14px; } }
  .gn-kicker { font-size: 8.5px; letter-spacing: 0.18em; color: var(--accent); }
  .gn-judul { font-size: clamp(22px, 3vw, 34px); color: var(--ink); line-height: 1.05; }
  .gn-label { font-size: 9.5px; letter-spacing: 0.06em; color: var(--muted); line-height: 1.7; }
  .gn-blurb { font-size: 14px; color: var(--ink); line-height: 1.6; max-width: 48ch; }
  .gn-provenans { font-size: 12px; color: var(--muted); line-height: 1.55; max-width: 48ch; border-left: 2px solid var(--line); padding-left: 12px; }
  .gn-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
  .gn-chips .chip { text-decoration: none; }
  .gn-chips .chip[data-no-link] { cursor: default; }
</style>
