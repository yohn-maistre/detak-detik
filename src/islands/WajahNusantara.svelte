<script lang="ts">
  /** Wajah Nusantara: the Act III lead headline — a rotating portrait of one
      of the archipelago's peoples, history and place and culture. Pulled
      best-effort from Indonesian Wikipedia (keyless, CORS-open), rotated twice
      a day by the calendar (law 5); a curated plate stands when the network is
      dark, so the absence is documented, never a broken page. */
  import { onMount } from 'svelte';
  import { drawEngraving, ENGRAVE_ATLAS } from '../lib/engrave';
  import SukuLokasi from './SukuLokasi.svelte';

  type Suku = { title: string; nama: string; wilayah: string; rumpun: string; lat: number; lon: number; blurb: string };
  const SUKU: Suku[] = [
    { title: 'Suku Asmat', nama: 'Asmat', wilayah: 'Papua Selatan', rumpun: 'Papua', lat: -5.5, lon: 138.5, blurb: 'Pemahat kayu di rawa pesisir selatan Papua; ukiran bis dan perisainya menghubungkan yang hidup dengan leluhur. Hidup mengikuti pasang dan hutan sagu.' },
    { title: 'Suku Toraja', nama: 'Toraja', wilayah: 'Sulawesi Selatan', rumpun: 'Austronesia', lat: -3.0, lon: 119.8, blurb: 'Dikenal lewat rumah tongkonan beratap perahu dan upacara kematian Rambu Solo yang berlangsung berhari-hari. Kematian, bagi Toraja, adalah perjalanan yang dirayakan.' },
    { title: 'Suku Minangkabau', nama: 'Minangkabau', wilayah: 'Sumatra Barat', rumpun: 'Austronesia', lat: -0.5, lon: 100.4, blurb: 'Masyarakat matrilineal terbesar di dunia: harta pusaka turun lewat garis ibu, sementara laki-laki merantau. Adat basandi syarak, syarak basandi Kitabullah.' },
    { title: 'Suku Mentawai', nama: 'Mentawai', wilayah: 'Kepulauan Mentawai', rumpun: 'Austronesia', lat: -1.5, lon: 99.2, blurb: 'Di pulau-pulau barat Sumatra, hidup dengan tato tubuh tertua di Nusantara dan kepercayaan arat sabulungan yang melihat jiwa pada segala benda.' },
    { title: 'Suku Dayak', nama: 'Dayak', wilayah: 'Kalimantan', rumpun: 'Austronesia', lat: 0.0, lon: 113.5, blurb: 'Ratusan subsuku di sepanjang sungai Kalimantan, dahulu tinggal di rumah betang sepanjang ratusan meter. Penjaga hutan yang kini berbatasan dengan konsesi.' },
    { title: 'Suku Bugis', nama: 'Bugis', wilayah: 'Sulawesi Selatan', rumpun: 'Austronesia', lat: -4.5, lon: 119.8, blurb: 'Pelaut dan pembuat perahu pinisi yang berlayar sampai Australia utara. Naskah epik La Galigo mereka termasuk karya sastra terpanjang di dunia.' },
    { title: 'Suku Badui', nama: 'Baduy', wilayah: 'Banten', rumpun: 'Sunda', lat: -6.5, lon: 106.3, blurb: 'Di pedalaman Banten, menolak listrik, kendaraan, dan uang demi menjaga amanah leluhur. Baduy Dalam berjalan kaki ratusan kilometer tanpa alas.' },
    { title: 'Suku Dani', nama: 'Dani', wilayah: 'Papua Pegunungan', rumpun: 'Papua', lat: -4.0, lon: 138.9, blurb: 'Petani ubi di Lembah Baliem yang dingin, dikenal lewat honai beratap jerami dan perang adat yang kini menjadi festival. Ditemukan dunia luar baru pada 1938.' },
    { title: 'Suku Nias', nama: 'Nias', wilayah: 'Sumatra Utara', rumpun: 'Austronesia', lat: 1.1, lon: 97.7, blurb: 'Di pulau barat Sumatra, membangun rumah batu megalitik dan tradisi lompat batu fahombo setinggi dua meter sebagai tanda kedewasaan.' },
    { title: 'Orang Rimba', nama: 'Orang Rimba', wilayah: 'Jambi', rumpun: 'Melayu', lat: -1.8, lon: 102.6, blurb: 'Peramu-pengembara di hutan Sumatra yang berpindah mengikuti pantangan melangun. Wilayah jelajahnya menyusut seiring kebun sawit meluas.' },
    { title: 'Suku Tengger', nama: 'Tengger', wilayah: 'Jawa Timur', rumpun: 'Jawa', lat: -7.94, lon: 112.95, blurb: 'Pewaris Majapahit di lereng Bromo yang tetap memeluk Hindu; tiap tahun melempar hasil bumi ke kawah dalam upacara Yadnya Kasada.' },
    { title: 'Suku Sasak', nama: 'Sasak', wilayah: 'Lombok', rumpun: 'Austronesia', lat: -8.6, lon: 116.3, blurb: 'Mayoritas penghuni Lombok, dengan tenun songket, rumah lumbung beratap tinggi, dan tradisi peresean — duel rotan dan perisai.' },
  ];
  const SLOT = Math.floor(Date.now() / (12 * 3600_000));
  const base = SUKU[SLOT % SUKU.length]!;

  let nama = $state(base.nama);
  let wilayah = $state(base.wilayah);
  let rumpun = $state(base.rumpun);
  let extract = $state(base.blurb);
  let img = $state('');
  let live = $state(false);
  let href = $state(`https://id.wikipedia.org/wiki/${encodeURIComponent(base.title)}`);

  /* plat pengganti: kanvas gravir rumah untuk bingkai yang fotonya belum ada.
     Efek berjalan tiap kanvas cabang fallback terpasang; bingkai tak pernah kosong. */
  let plat: HTMLCanvasElement | undefined = $state();
  $effect(() => {
    const el = plat;
    if (!el) return;
    const gambar = () => drawEngraving(el, { ...ENGRAVE_ATLAS, caption: `PLAT · ${nama.toUpperCase()}` });
    gambar();
    const ro = new ResizeObserver(gambar);
    ro.observe(el);
    return () => ro.disconnect();
  });

  onMount(() => {
    (async () => {
      try {
        const u = `https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(base.title)}`;
        const res = await fetch(u, { signal: AbortSignal.timeout(6000) });
        const d = await res.json();
        if (d?.extract) {
          extract = d.extract.length > 480 ? d.extract.slice(0, 480).replace(/\s+\S*$/, '') + '…' : d.extract;
          img = d.originalimage?.source || d.thumbnail?.source || '';
          href = d.content_urls?.desktop?.page || href;
          live = true;
        }
      } catch { /* curated plate stands */ }
    })();
  });
</script>

<section class="wn" data-rise data-no-stempel data-ref="wajah">
  <div class="wn-grid">
    <div class="wn-teks">
      <span class="wn-kicker mono">WAJAH NUSANTARA · {wilayah.toUpperCase()}</span>
      <h2 class="wn-nama display">{nama}</h2>
      <p class="wn-extract">{extract}</p>
      <p class="wn-fakta mono">RUMPUN {rumpun.toUpperCase()} · {wilayah.toUpperCase()} · BERGANTI DUA KALI SEHARI</p>
      <a class="chip" href={href} target="_blank" rel="noopener">⊙ {live ? 'wikipedia' : 'kurasi'} · {base.title.toLowerCase()}</a>
    </div>
    <div class="wn-side">
      <figure class="wn-img">
        {#if img}
          <img src={img} alt={nama} loading="lazy" onerror={() => (img = '')} />
        {:else}
          <div class="wn-plat">
            <canvas bind:this={plat} aria-label={`Plat gravir pengganti foto ${nama}`}></canvas>
            <span class="wn-plat-cap mono">PLAT PENGGANTI · FOTO BELUM TERSEDIA DI ARSIP TERBUKA</span>
          </div>
        {/if}
      </figure>
      <SukuLokasi lat={base.lat} lon={base.lon} nama={base.nama} />
    </div>
  </div>
</section>

<style>
  .wn { margin-bottom: clamp(28px, 5vw, 56px); }
  .wn-grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: clamp(20px, 4vw, 52px); align-items: start; }
  @media (max-width: 760px) { .wn-grid { grid-template-columns: 1fr; gap: 18px; } }
  .wn-teks { display: grid; gap: 12px; align-content: start; }
  .wn-side { display: grid; gap: 14px; align-content: start; }
  .wn-kicker { font-size: 10px; letter-spacing: 0.2em; color: var(--accent); }
  .wn-nama { font-family: 'Fraunces Variable', serif; font-weight: 300; font-size: clamp(54px, 11vw, 128px); line-height: 0.86; letter-spacing: -0.02em; color: var(--ink); }
  .wn-extract { font-size: clamp(15px, 1.8vw, 19px); line-height: 1.55; color: var(--ink); max-width: 50ch; }
  .wn-fakta { font-size: 9px; letter-spacing: 0.14em; color: var(--muted); }
  .wn-teks .chip { justify-self: start; margin-top: 2px; }
  .wn-img { margin: 0; aspect-ratio: 4 / 5; overflow: hidden; border: 1px solid var(--line); background: #ece1c9; }
  @media (max-width: 760px) { .wn-img { aspect-ratio: 16 / 10; } }
  .wn-img img { width: 100%; height: 100%; object-fit: cover; display: block; filter: saturate(0.95); }
  .wn-plat { width: 100%; height: 100%; display: grid; grid-template-rows: minmax(0, 1fr) auto; }
  .wn-plat canvas { width: 100%; height: 100%; min-height: 0; display: block; }
  .wn-plat-cap { font-size: 8.5px; letter-spacing: 0.18em; color: var(--muted);
    padding: 6px 10px; border-top: 1px solid var(--line); }
</style>
