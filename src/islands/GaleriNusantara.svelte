<script lang="ts">
  /**
   * Galeri Nusantara — RUPA only (§13.17: the species plate moved to Zona
   * Hayati; one owner). A public-domain painting from Wikimedia Commons
   * each day, image beside its reading: painter, year, license. Fetched
   * best-effort license-clean; when the network is dark or an image fails,
   * the frame falls to the curated plate (the absence is documented, never
   * a broken page).
   */
  import { onMount } from 'svelte';

  const HARI = Math.floor(Date.now() / 86_400_000);

  // curated fallbacks — always good, used when live fetch is unavailable
  const RUPA_CADANGAN = {
    img: '', judul: 'Penangkapan Pangeran Diponegoro', seniman: 'Raden Saleh', tahun: '1857',
    blurb: 'Raden Saleh melukis ulang adegan penangkapan versi pelukis Belanda dengan menukar sudut pandangnya: Diponegoro berdiri tegak, para perwira digambar berkepala sedikit besar.',
    lisensi: 'domain publik',
  };
  let rupa = $state(RUPA_CADANGAN);
  let rupaLive = $state(false);

  const bersih = (s: string) => (s || '').replace(/<[^>]*>/g, '').trim();

  onMount(() => {
    (async () => {
      try {
        const cat = ['Category:Paintings by Raden Saleh', 'Category:Mooi Indië'][HARI % 2]!;
        const u = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=categorymembers&gcmtitle=${encodeURIComponent(cat)}&gcmtype=file&gcmlimit=40&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=900&iiextmetadatafilter=LicenseShortName|Artist|ImageDescription|DateTimeOriginal|ObjectName`;
        const res = await fetch(u, { signal: AbortSignal.timeout(6000) });
        const data = await res.json();
        const pages = Object.values((data?.query?.pages ?? {}) as Record<string, any>)
          .filter((p) => /public domain|cc0|cc by/i.test(p?.imageinfo?.[0]?.extmetadata?.LicenseShortName?.value ?? ''));
        if (pages.length) {
          const p: any = pages[HARI % pages.length];
          const m = p.imageinfo[0];
          rupa = {
            img: m.thumburl || m.url,
            judul: bersih(m.extmetadata?.ObjectName?.value) || p.title.replace(/^File:|\.[a-z]+$/gi, ''),
            seniman: bersih(m.extmetadata?.Artist?.value) || 'tak diketahui',
            tahun: bersih(m.extmetadata?.DateTimeOriginal?.value).slice(0, 10),
            blurb: bersih(m.extmetadata?.ImageDescription?.value).slice(0, 220) || RUPA_CADANGAN.blurb,
            lisensi: bersih(m.extmetadata?.LicenseShortName?.value) || 'domain publik',
          };
          rupaLive = true;
        }
      } catch { /* curated plate stands */ }
    })();
  });
</script>

<!-- RUPA only: the species plate moved to Zona Hayati (one owner, §13.17).
     One painting a day, image beside the reading. -->
<div class="gn" data-rise data-no-stempel>
  <figure class="gn-plat">
    <div class="gn-img">
      {#if rupa.img}
        <img src={rupa.img} alt={rupa.judul} loading="lazy" onerror={() => (rupa = { ...rupa, img: '' })} />
      {:else}
        <div class="gn-kosong"><span class="mono">PLAT · RUPA</span></div>
      {/if}
    </div>
    <figcaption>
      <span class="gn-kicker mono">RUPA · {rupaLive ? 'WIKIMEDIA COMMONS' : 'KURASI'} · SATU LUKISAN TIAP HARI</span>
      <h4 class="gn-judul fig">{rupa.judul}</h4>
      <p class="gn-meta mono">{rupa.seniman}{rupa.tahun ? ` · ${rupa.tahun}` : ''}</p>
      <p class="gn-blurb">{rupa.blurb}</p>
      <span class="chip" data-no-link>⊙ {rupa.lisensi}</span>
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
  .gn-meta { font-size: 10px; letter-spacing: 0.06em; color: var(--muted); }
  .gn-blurb { font-size: 14px; color: var(--ink); line-height: 1.6; max-width: 46ch; }
  figcaption .chip { justify-self: start; cursor: default; margin-top: 4px; }
</style>
