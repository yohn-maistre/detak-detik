<script lang="ts">
  /**
   * Dasar Wilayah: the panel beneath the map. Click a province on the map (or
   * ask Aksara), and this fills with that region's snapshot, story, and the
   * place where its procurement signal will land. Driven by the lensa store;
   * nothing geolocated.
   */
  import { onMount } from 'svelte';
  import { DAERAH } from '../lib/data/edisi';
  import { getLensa, getDaerah, onLensa } from '../lib/lensa';
  import { dispatch } from '../lib/commands/dispatcher';

  let kode = $state(getLensa());
  const d = $derived(getDaerah(kode));
  const nas = DAERAH.find((r) => r.kode === 'nasional')!;
  onMount(() => onLensa((k) => (kode = k)));
  const isNas = $derived(d.kode === 'nasional');
  const reset = () => dispatch({ cmd: 'set_lensa', params: { kode: 'nasional' } });

  const STAT = $derived([
    { k: 'Penduduk', v: d.penduduk, n: nas.penduduk },
    { k: 'Kemiskinan', v: d.miskin, n: nas.miskin },
    { k: 'Dokter / 1.000', v: d.dokter, n: nas.dokter },
    { k: 'IPM', v: d.ipm, n: nas.ipm },
    { k: 'Belanja pegawai APBD', v: d.pegawai, n: nas.pegawai },
  ]);
</script>

<section class="dossier" data-no-stempel data-ref="dossier">
  <div class="dossier-head">
    <span class="inkbar"><span class="dot">●</span>DASAR WILAYAH</span>
    <span class="eyebrow">KLIK PROVINSI DI PETA · ATAU MINTA AKSARA</span>
  </div>

  {#if isNas}
    <p class="dossier-kosong fig">Belum ada wilayah dipilih. Klik sebuah provinsi pada peta untuk membuka dasarnya, atau cari di Lensa Daerah di bawah.</p>
  {:else}
    <div class="dossier-top">
      <div class="dossier-id">
        <span class="dossier-pulau mono">{d.pulau.toUpperCase()}</span>
        <h3 class="dossier-nama display">{d.nama}</h3>
        <p class="dossier-fakta fig">{d.fakta}</p>
      </div>
      <button class="chip dossier-reset" onclick={reset}>← nasional</button>
    </div>

    <div class="dossier-stats">
      {#each STAT as s (s.k)}
        <div class="dossier-stat">
          <span class="ds-k mono">{s.k}</span>
          <span class="ds-v num">{s.v}</span>
          <span class="ds-n mono">nasional {s.n}</span>
        </div>
      {/each}
    </div>

    <div class="dossier-extra">
      <span class="eyebrow">PENGADAAN WILAYAH · POTENSI SELISIH HARGA</span>
      <p class="dossier-soon">Dihitung netral dari selisih harga paket terhadap median kategori nasional, bukan tuduhan. <span class="mono">Sumber SIRUP / INAPROC · segera.</span></p>
    </div>
  {/if}
</section>

<style>
  .dossier { border: 1px solid var(--line); border-top: none; padding: clamp(16px, 2.4vw, 26px); background: var(--card); }
  .dossier-head { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 14px; }
  .dossier-kosong { font-size: 15px; color: var(--muted); max-width: 56ch; }

  .dossier-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
  .dossier-pulau { font-size: 9px; letter-spacing: 0.2em; color: var(--accent); }
  .dossier-nama { font-family: 'Fraunces Variable', serif; font-weight: 360; font-size: clamp(28px, 4.4vw, 52px); line-height: 0.98; margin: 6px 0 8px; }
  .dossier-fakta { font-size: 15px; color: var(--ink); max-width: 52ch; line-height: 1.45; }
  .dossier-reset { align-self: flex-start; white-space: nowrap; }

  .dossier-stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: clamp(10px, 2vw, 22px); margin: 22px 0 4px; border-top: 1px solid var(--line); padding-top: 16px; }
  @media (max-width: 760px) { .dossier-stats { grid-template-columns: repeat(2, 1fr); gap: 18px; } }
  .dossier-stat { display: grid; gap: 3px; align-content: start; position: relative; padding-left: 14px; }
  .dossier-stat::before { content: ''; position: absolute; left: 0; top: 2px; bottom: 2px; width: 1px; background: var(--line-soft); }
  .ds-k { font-size: 8.5px; letter-spacing: 0.1em; color: var(--muted); }
  .ds-v { font-family: 'Fraunces Variable', serif; font-weight: 400; font-size: clamp(20px, 2.6vw, 30px); line-height: 1; }
  .ds-n { font-size: 8.5px; letter-spacing: 0.04em; color: var(--muted); }

  .dossier-extra { margin-top: 22px; border-top: 1px solid var(--line); padding-top: 14px; }
  .dossier-soon { font-size: 13px; color: var(--muted); max-width: 60ch; line-height: 1.5; margin-top: 6px; }
</style>
