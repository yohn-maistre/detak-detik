<script lang="ts">
  /**
   * Sensus Diri: type two numbers, learn where you stand. Every
   * computation happens in this tab — nothing typed here ever leaves the
   * device (law 6). Distribution table is a simplified national decile
   * ladder, marked contoh until the Susenas pipe replaces it.
   */
  // per-capita monthly expenditure decile upper bounds, Rp (simplified)
  const DESIL = [600_000, 800_000, 1_000_000, 1_200_000, 1_450_000, 1_750_000, 2_100_000, 2_600_000, 3_500_000];
  const GARIS_BPS = 595_000;
  const GARIS_WB = 1_390_000; // $8.30/day PPP-2021 ≈ Rp 45.700/day
  const UMUR_MEDIAN = 30.1;

  let pengeluaran = $state('');
  let umur = $state('');
  let hasil = $state<null | { pctl: number; bps: boolean; wb: boolean; mudaPct: number | null }>(null);

  function hitung() {
    const p = Number(pengeluaran.replace(/[^\d]/g, ''));
    if (!p) return;
    let pctl = 95;
    for (let i = 0; i < DESIL.length; i++) {
      if (p <= DESIL[i]!) {
        const lo = i === 0 ? 0 : DESIL[i - 1]!;
        pctl = (i + (p - lo) / (DESIL[i]! - lo)) * 10;
        break;
      }
    }
    const u = Number(umur);
    // crude age CDF around the median (good enough for a mirror, marked contoh)
    const mudaPct = u > 0 && u < 100 ? Math.max(1, Math.min(99, Math.round(100 - (u / (UMUR_MEDIAN * 2)) * 100))) : null;
    hasil = { pctl: Math.round(pctl), bps: p < GARIS_BPS, wb: p < GARIS_WB, mudaPct };
  }

  const fmt = new Intl.NumberFormat('id-ID');
</script>

<div class="sd card" data-no-stempel>
  <div class="sd-head">
    <span class="eyebrow">SENSUS DIRI · CERMIN STATISTIK</span>
  </div>
  <p class="sd-intro">Dua angka, satu cermin. Tidak ada yang dikirim ke mana pun — seluruh hitungan terjadi di perangkat ini.</p>

  <div class="sd-form">
    <label class="sd-field">
      <span class="mono">PENGELUARANMU / BULAN (RP)</span>
      <input class="mono" inputmode="numeric" bind:value={pengeluaran} placeholder="cth. 2.500.000" />
    </label>
    <label class="sd-field">
      <span class="mono">UMUR (OPSIONAL)</span>
      <input class="mono" inputmode="numeric" bind:value={umur} placeholder="cth. 27" />
    </label>
    <button class="chip hop" onclick={hitung}>Bercermin →</button>
  </div>

  {#if hasil}
    <div class="sd-hasil">
      <p class="sd-baris">Pengeluaranmu di atas <b class="num">{hasil.pctl}%</b> penduduk Indonesia.</p>
      <div class="sd-garis-grid mono">
        <span class:lewat={!hasil.bps}>{hasil.bps ? 'DI BAWAH' : 'DI ATAS'} GARIS BPS (Rp {fmt.format(GARIS_BPS)})</span>
        <span class:lewat={!hasil.wb}>{hasil.wb ? 'DI BAWAH' : 'DI ATAS'} GARIS BANK DUNIA (Rp {fmt.format(GARIS_WB)})</span>
      </div>
      {#if !hasil.bps && hasil.wb}
        <p class="sd-catatan">Menurut negara kamu tidak miskin; menurut Bank Dunia kamu belum aman. Dua garis itu punya lembarnya sendiri di <a class="ink-link" href="/perspektif/dua-garis-kemiskinan">arsip perspektif</a>.</p>
      {/if}
      {#if hasil.mudaPct !== null}
        <p class="sd-baris">Kamu lebih muda dari ± <b class="num">{hasil.mudaPct}%</b> penduduk (median umur {UMUR_MEDIAN.toString().replace('.', ',')} tahun).</p>
      {/if}
    </div>
  {/if}
  <p class="sd-foot mono">DESIL SUSENAS DISEDERHANAKAN · (DATA CONTOH) · TIDAK ADA DATA YANG MENINGGALKAN PERANGKAT</p>
</div>

<style>
  .sd-intro { font-size: 13.5px; color: var(--muted); margin-top: 10px; max-width: 44ch; }
  .sd-form { display: flex; flex-wrap: wrap; gap: 12px; align-items: end; margin-top: 16px; }
  .sd-field { display: grid; gap: 5px; }
  .sd-field span { font-size: 8.5px; letter-spacing: 0.16em; color: var(--muted); }
  .sd-field input {
    background: transparent; border: 1px solid var(--line); color: var(--ink);
    padding: 8px 10px; font-size: 13px; width: 170px;
  }
  .sd-field input:focus { outline: 2px solid var(--accent); outline-offset: 1px; }
  .sd-hasil { margin-top: 18px; display: grid; gap: 10px; border-top: 1px solid var(--line); padding-top: 14px; }
  .sd-baris { font-size: 15px; }
  .sd-baris b { color: var(--accent2); font-size: 1.2em; }
  .sd-garis-grid { display: grid; gap: 6px; font-size: 10px; letter-spacing: 0.12em; color: var(--muted); }
  .sd-garis-grid .lewat { color: var(--accent2); }
  .sd-catatan { font-size: 13px; color: var(--muted); max-width: 44ch; }
  .sd-foot { margin-top: 16px; font-size: 8.5px; letter-spacing: 0.16em; color: var(--muted); }
</style>
