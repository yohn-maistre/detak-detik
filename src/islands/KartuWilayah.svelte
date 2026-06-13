<script lang="ts">
  /**
   * Kartu Wilayah: the regional lens. National by default; pick a region (or
   * let Aksara) and the dossier re-renders for that kabupaten/provinsi. The
   * same mechanic the struk and the silence ledger will borrow. No reader is
   * located; this is a choice, stored only in memory.
   */
  import { onMount } from 'svelte';
  import { DAERAH } from '../lib/data/edisi';
  import { getLensa, getDaerah, setLensa, onLensa } from '../lib/lensa';
  import { dispatch } from '../lib/commands/dispatcher';

  let kode = $state(getLensa());
  const d = $derived(getDaerah(kode));

  onMount(() => onLensa((k) => (kode = k)));

  const pilih = (k: string) => dispatch({ cmd: 'set_lensa', params: { kode: k } });

  const baris = $derived([
    { k: 'Penduduk', v: d.penduduk },
    { k: 'Upah minimum', v: d.ump },
    { k: 'Kemiskinan', v: d.miskin, sorot: parseFloat(d.miskin) > 12 },
    { k: 'Dokter / 1.000', v: d.dokter, sorot: parseFloat(d.dokter) < 0.5 },
    { k: 'IPM', v: d.ipm },
    { k: 'Belanja pegawai', v: d.pegawai, sorot: parseFloat(d.pegawai) > 40 },
  ]);
</script>

<section class="kw" data-no-stempel id="lensa">
  <div class="kw-head">
    <span class="inkbar"><span class="dot">●</span>LENSA DAERAH</span>
    <span class="eyebrow">NASIONAL ATAU PILIH DAERAHMU · AKSARA JUGA BISA</span>
  </div>

  <div class="kw-pilih mono" role="group" aria-label="Pilih daerah">
    {#each DAERAH as r (r.kode)}
      <button class="kw-chip" class:aktif={kode === r.kode} onclick={() => pilih(r.kode)}>{r.nama}</button>
    {/each}
  </div>

  <div class="kw-kartu">
    <div class="kw-judul-row">
      <h3 class="kw-nama display">{d.nama}</h3>
      {#if kode !== 'nasional'}
        <button class="chip" onclick={() => pilih('nasional')}>↺ nasional</button>
      {/if}
    </div>
    <div class="kw-grid">
      {#each baris as b (b.k)}
        <div class="kw-stat" class:sorot={b.sorot}>
          <span class="kw-stat-k mono">{b.k.toUpperCase()}</span>
          <span class="kw-stat-v num">{b.v}</span>
        </div>
      {/each}
    </div>
    <p class="kw-fakta fig">{d.fakta}</p>
    <button class="chip"><span class="tick">⊙</span>bps · djpk · (data contoh)</button>
  </div>
</section>

<style>
  .kw { border-top: 1px solid var(--line); padding-top: 22px; }
  .kw-head { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 14px; }
  .kw-pilih { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 16px; }
  .kw-chip {
    background: transparent; border: 1px solid var(--line); color: var(--ink);
    padding: 5px 11px; font: inherit; font-size: 11px; letter-spacing: 0.04em; cursor: pointer;
    transition: background 0.2s, color 0.2s;
  }
  .kw-chip.aktif { background: var(--ink); color: var(--bg); border-color: var(--ink); }
  .kw-kartu { border: 1px solid var(--line); padding: clamp(16px, 3vw, 26px); background: var(--card); }
  .kw-judul-row { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .kw-nama { font-size: clamp(26px, 4vw, 44px); }
  .kw-grid { display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid var(--line); margin: 18px 0 14px; }
  @media (max-width: 560px) { .kw-grid { grid-template-columns: repeat(2, 1fr); } }
  .kw-stat { padding: 12px 14px; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); display: grid; gap: 5px; }
  .kw-stat-k { font-size: 8.5px; letter-spacing: 0.14em; color: var(--muted); }
  .kw-stat-v { font-family: var(--font-display); font-weight: 800; font-size: clamp(18px, 2.2vw, 26px); line-height: 1; }
  .kw-stat.sorot .kw-stat-v { color: var(--accent); }
  .kw-fakta { font-size: 15px; color: var(--ink); max-width: 56ch; margin-bottom: 12px; }
</style>
