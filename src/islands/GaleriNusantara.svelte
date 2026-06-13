<script lang="ts">
  /**
   * Galeri Nusantara: two framed plates a day. Rupa — a public-domain
   * painting from Wikimedia Commons. Hayati — an endemic species from GBIF.
   * Both fetched best-effort, license-clean; when the network is dark or an
   * image fails, the frame falls to an engraved text plate (the absence is
   * documented, never a broken page).
   */
  import { onMount } from 'svelte';

  const HARI = Math.floor(Date.now() / 86_400_000);

  // curated fallbacks — always good, used when live fetch is unavailable
  const RUPA_CADANGAN = {
    img: '', judul: 'Penangkapan Pangeran Diponegoro', seniman: 'Raden Saleh', tahun: '1857',
    blurb: 'Raden Saleh melukis ulang adegan penangkapan versi pelukis Belanda — tetapi menukar sudut pandangnya: Diponegoro berdiri tegak, para perwira digambar berkepala sedikit besar. Perspektif adalah pernyataan.',
    lisensi: 'domain publik',
  };
  const HAYATI_CADANGAN = {
    img: '', nama: 'Cendrawasih raja', ilmiah: 'Cicinnurus regius', status: 'Risiko Rendah',
    blurb: 'Burung sebesar genggaman dengan dua kawat ekor melingkar hijau; menari terbalik di dahan untuk meminang. Hanya ada di hutan dataran rendah Papua.',
    lisensi: 'gbif',
  };

  let rupa = $state(RUPA_CADANGAN);
  let hayati = $state(HAYATI_CADANGAN);
  let rupaLive = $state(false);
  let hayatiLive = $state(false);

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

      try {
        const taxa = ['Paradisaea', 'Varanus komodoensis', 'Rafflesia arnoldii', 'Bubalus depressicornis', 'Babyrousa babyrussa'];
        const name = taxa[HARI % taxa.length]!;
        const u = `https://api.gbif.org/v1/occurrence/search?country=ID&mediaType=StillImage&license=CC0_1_0&license=CC_BY_4_0&q=${encodeURIComponent(name)}&limit=20`;
        const res = await fetch(u, { signal: AbortSignal.timeout(6000) });
        const data = await res.json();
        const hit = (data?.results ?? []).find((r: any) => r?.media?.[0]?.identifier && r?.scientificName);
        if (hit) {
          hayati = {
            img: hit.media[0].identifier,
            nama: hit.vernacularName || HAYATI_CADANGAN.nama,
            ilmiah: hit.species || hit.scientificName,
            status: HAYATI_CADANGAN.status,
            blurb: HAYATI_CADANGAN.blurb,
            lisensi: 'gbif · ' + (hit.media[0].license ? 'cc' : 'cc'),
          };
          hayatiLive = true;
        }
      } catch { /* curated plate stands */ }
    })();
  });
</script>

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
      <span class="gn-kicker mono">RUPA · {rupaLive ? 'WIKIMEDIA COMMONS' : 'KURASI'}</span>
      <h4 class="gn-judul fig">{rupa.judul}</h4>
      <p class="gn-meta mono">{rupa.seniman}{rupa.tahun ? ` · ${rupa.tahun}` : ''}</p>
      <p class="gn-blurb">{rupa.blurb}</p>
      <span class="chip" data-no-link>⊙ {rupa.lisensi}</span>
    </figcaption>
  </figure>

  <figure class="gn-plat">
    <div class="gn-img">
      {#if hayati.img}
        <img src={hayati.img} alt={hayati.nama} loading="lazy" onerror={() => (hayati = { ...hayati, img: '' })} />
      {:else}
        <div class="gn-kosong"><span class="mono">PLAT · HAYATI</span></div>
      {/if}
    </div>
    <figcaption>
      <span class="gn-kicker mono">HAYATI · {hayatiLive ? 'GBIF' : 'KURASI'}</span>
      <h4 class="gn-judul fig">{hayati.nama}</h4>
      <p class="gn-meta mono">{hayati.ilmiah} · {hayati.status}</p>
      <p class="gn-blurb">{hayati.blurb}</p>
      <span class="chip" data-no-link>⊙ {hayati.lisensi}</span>
    </figcaption>
  </figure>
</div>

<style>
  .gn { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; }
  @media (max-width: 760px) { .gn { grid-template-columns: 1fr; } }
  .gn-plat {
    margin: 0; border: 1px solid var(--line); outline: 1px solid var(--line);
    outline-offset: 5px; background: var(--card); overflow: hidden;
  }
  .gn-img { aspect-ratio: 4 / 3; background: #ece1c9; overflow: hidden; }
  .gn-img img { width: 100%; height: 100%; object-fit: cover; display: block; filter: saturate(0.95); }
  .gn-kosong {
    width: 100%; height: 100%; display: grid; place-items: center;
    background: repeating-linear-gradient(45deg, color-mix(in oklab, var(--line) 30%, transparent) 0 1px, transparent 1px 7px);
  }
  .gn-kosong span { font-size: 9px; letter-spacing: 0.24em; color: var(--muted); }
  figcaption { padding: 16px 18px 18px; display: grid; gap: 7px; }
  .gn-kicker { font-size: 8.5px; letter-spacing: 0.18em; color: var(--muted); }
  .gn-judul { font-size: clamp(19px, 2.4vw, 26px); color: var(--ink); line-height: 1.1; }
  .gn-meta { font-size: 10px; letter-spacing: 0.06em; color: var(--muted); }
  .gn-blurb { font-size: 13.5px; color: var(--muted); line-height: 1.55; }
  figcaption .chip { justify-self: start; cursor: default; margin-top: 4px; }
</style>
