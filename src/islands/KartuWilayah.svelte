<script lang="ts">
  /**
   * Lensa Daerah: not a box of numbers but a position. For each measure, a
   * track runs worst to best across the regions; the marker for the chosen
   * region slides into place. A region whose markers all sit left is a region
   * the state is failing. National is the reference tick. The reader (or
   * Aksara) chooses; nothing is geolocated.
   */
  import { onMount } from 'svelte';
  import { DAERAH } from '../lib/data/edisi';
  import { getLensa, getDaerah, setLensa, onLensa } from '../lib/lensa';
  import { dispatch } from '../lib/commands/dispatcher';

  let kode = $state(getLensa());
  const d = $derived(getDaerah(kode));
  onMount(() => onLensa((k) => (kode = k)));
  const pilih = (k: string) => dispatch({ cmd: 'set_lensa', params: { kode: k } });

  const num = (s: string) => parseFloat(String(s).replace('~', '').replace('Rp', '').replace('jt', '').replace('%', '').replace(',', '.').trim());
  type M = { k: string; label: string; satuan: string; baikTinggi: boolean; get: (x: typeof d) => number; fmt: (x: typeof d) => string };
  const METRIK: M[] = [
    { k: 'miskin', label: 'Kemiskinan', satuan: '%', baikTinggi: false, get: (x) => num(x.miskin), fmt: (x) => x.miskin },
    { k: 'dokter', label: 'Dokter per 1.000', satuan: '', baikTinggi: true, get: (x) => num(x.dokter), fmt: (x) => x.dokter },
    { k: 'ipm', label: 'Indeks pembangunan manusia', satuan: '', baikTinggi: true, get: (x) => num(x.ipm), fmt: (x) => x.ipm },
    { k: 'ump', label: 'Upah minimum', satuan: 'jt', baikTinggi: true, get: (x) => num(x.ump), fmt: (x) => x.ump },
    { k: 'pegawai', label: 'Belanja pegawai dari APBD', satuan: '%', baikTinggi: false, get: (x) => num(x.pegawai), fmt: (x) => x.pegawai },
  ];
  const REG = DAERAH.filter((r) => r.kode !== 'nasional');
  const nas = DAERAH[0];

  function rentang(m: M) {
    const vals = REG.map((r) => m.get(r));
    return { lo: Math.min(...vals), hi: Math.max(...vals) };
  }
  // 0 = worst (left), 1 = best (right)
  function posisi(m: M, v: number) {
    const { lo, hi } = rentang(m);
    const t = hi === lo ? 0.5 : (v - lo) / (hi - lo);
    return m.baikTinggi ? t : 1 - t;
  }
  const sorot = $derived(METRIK.map((m) => ({ m, p: posisi(m, m.get(d)), pn: posisi(m, m.get(nas)), val: m.fmt(d), buruk: posisi(m, m.get(d)) < 0.34 })));
</script>

<section class="ld" data-no-stempel id="lensa">
  <div class="ld-head">
    <span class="inkbar"><span class="dot">●</span>LENSA DAERAH</span>
    <span class="eyebrow">DI MANA DAERAHMU BERDIRI · GESER PENANDA, ATAU MINTA AKSARA</span>
  </div>

  <div class="ld-top">
    <h3 class="ld-nama display">{d.nama}</h3>
    <div class="ld-pilih mono">
      {#each DAERAH as r (r.kode)}
        <button class="ld-chip" class:aktif={kode === r.kode} onclick={() => pilih(r.kode)}>{r.nama}</button>
      {/each}
    </div>
  </div>

  <div class="ld-rows">
    {#each sorot as s (s.m.k)}
      <div class="ld-row">
        <div class="ld-row-head">
          <span class="ld-label">{s.m.label}</span>
          <span class="ld-val num" class:buruk={s.buruk}>{s.val}{s.m.satuan === '%' ? '' : ''}</span>
        </div>
        <div class="ld-track">
          <span class="ld-end mono kiri">terburuk</span>
          <span class="ld-end mono kanan">terbaik</span>
          <span class="ld-nas" style={`left:${s.pn * 100}%`} title="rerata nasional"></span>
          <span class="ld-mark" class:buruk={s.buruk} style={`left:${s.p * 100}%`}></span>
        </div>
      </div>
    {/each}
  </div>

  <div class="ld-foot">
    <p class="ld-fakta fig">{d.fakta}</p>
    <button class="chip"><span class="tick">⊙</span>bps · djpk · (data contoh)</button>
  </div>
</section>

<style>
  .ld { border-top: 1px solid var(--line); padding-top: 22px; }
  .ld-head { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 18px; }
  .ld-top { display: flex; justify-content: space-between; align-items: flex-end; gap: 18px; flex-wrap: wrap; margin-bottom: 20px; }
  .ld-nama { font-size: clamp(30px, 5vw, 56px); line-height: 0.95; }
  .ld-pilih { display: flex; flex-wrap: wrap; gap: 6px; max-width: 60%; justify-content: flex-end; }
  @media (max-width: 700px) { .ld-pilih { max-width: 100%; justify-content: flex-start; } }
  .ld-chip { background: transparent; border: 1px solid var(--line); color: var(--ink); padding: 4px 9px; font: inherit; font-size: 10px; letter-spacing: 0.04em; cursor: pointer; transition: background 0.2s, color 0.2s; }
  .ld-chip.aktif { background: var(--ink); color: var(--bg); border-color: var(--ink); }

  .ld-rows { display: grid; gap: 22px; }
  .ld-row-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-bottom: 9px; }
  .ld-label { font-size: 13.5px; color: var(--muted); }
  .ld-val { font-family: var(--font-display); font-weight: 800; font-size: clamp(16px, 2vw, 22px); }
  .ld-val.buruk { color: var(--accent); }
  .ld-track {
    position: relative; height: 3px; background: var(--line-soft);
  }
  .ld-end { position: absolute; top: 8px; font-size: 7.5px; letter-spacing: 0.14em; color: var(--muted); opacity: 0.7; }
  .ld-end.kiri { left: 0; }
  .ld-end.kanan { right: 0; }
  .ld-nas {
    position: absolute; top: -4px; width: 1px; height: 11px; background: var(--muted);
    transition: left 0.7s var(--ease-out);
  }
  .ld-nas::after { content: 'N'; position: absolute; top: -11px; left: -2px; font: 7px var(--font-mono); color: var(--muted); }
  .ld-mark {
    position: absolute; top: 50%; width: 13px; height: 13px; border-radius: 50%;
    background: var(--ink); border: 2px solid var(--bg);
    transform: translate(-50%, -50%);
    transition: left 0.7s var(--ease-out), background 0.4s;
    box-shadow: 0 0 0 1px var(--ink);
  }
  .ld-mark.buruk { background: var(--accent); box-shadow: 0 0 0 1px var(--accent); }

  .ld-foot { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; margin-top: 26px; border-top: 1px solid var(--line); padding-top: 16px; }
  .ld-fakta { font-size: 15px; color: var(--ink); max-width: 52ch; }
</style>
