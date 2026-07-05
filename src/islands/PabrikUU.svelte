<script lang="ts">
  /**
   * Pabrik Undang-Undang: how many days from draft to gazette, on a log
   * scale, because the spread won't fit on a linear one — which is the
   * finding. Stalled bills run off the right edge with an arrow.
   */
  // the stalled bill's age counts from the SAME date constant the chapter
  // band uses (satu fakta satu pemilik) — the two can never disagree again
  import { hariPerampasanAset } from '../lib/data/cabang';

  const UU = [
    { nama: 'Revisi UU KPK (2019)', hari: 13, sah: true },
    { nama: 'Revisi UU Polri (2026)', hari: 20, sah: true },
    { nama: 'UU IKN (2022)', hari: 42, sah: true },
    { nama: 'Revisi UU TNI (2025)', hari: 35, sah: true },
    { nama: 'Revisi UU Minerba (2020)', hari: 90, sah: true },
    { nama: 'UU Cipta Kerja (2020)', hari: 244, sah: true },
    { nama: 'UU PDP (2022)', hari: 2190, sah: true },
    { nama: 'RUU Perampasan Aset', hari: hariPerampasanAset(), sah: false },
    { nama: 'RUU Masyarakat Adat', hari: 6200, sah: false },
  ].sort((a, b) => a.hari - b.hari);

  const MAXLOG = Math.log10(8000);
  const lebar = (hari: number) => `${(Math.log10(Math.max(hari, 1)) / MAXLOG) * 100}%`;
  const fmtHari = (h: number) =>
    h < 365 ? `${h} hari` : `${(h / 365).toFixed(h / 365 >= 10 ? 0 : 1).replace('.', ',')} tahun`;
</script>

<div class="pu" data-no-stempel>
  <div class="pu-skala mono">
    <span>1 HARI</span><span>1 BULAN</span><span>1 TAHUN</span><span>10 TAHUN →</span>
  </div>
  <div class="pu-rows">
    {#each UU as u (u.nama)}
      <div class="pu-row">
        <span class="pu-nama">{u.nama}</span>
        <div class="pu-track">
          <i class="pu-bar" class:macet={!u.sah} style={`--w:${lebar(u.hari)}`}>
            <span class="pu-hari mono">{fmtHari(u.hari)}{u.sah ? '' : ' · BELUM SAH ⇢'}</span>
          </i>
        </div>
      </div>
    {/each}
  </div>
  <p class="pu-kaki fig">Rentang waktunya terbentang dari belasan hari hingga belasan tahun bagi rancangan yang belum disahkan — dan baris yang macet terus bertambah umur setiap hari halaman ini dicetak. Skala logaritmik: pada skala linear, sembilan baris ini tidak muat dalam satu halaman.</p>
  <div class="pu-chips">
    <button class="chip"><span class="tick">⊙</span>dpr.go.id · prolegnas</button>
    <button class="chip hop">kompilasi redaksi · (data contoh) · verifikasi berlanjut</button>
  </div>
</div>

<style>
  .pu-skala {
    display: flex; justify-content: space-between;
    font-size: 8.5px; letter-spacing: 0.16em; color: var(--muted);
    border-bottom: 1px solid var(--line); padding-bottom: 6px; margin-bottom: 14px;
  }
  .pu-rows { display: grid; gap: 13px; }
  .pu-row { display: grid; grid-template-columns: minmax(150px, 220px) 1fr; gap: 12px; align-items: center; }
  @media (max-width: 560px) { .pu-row { grid-template-columns: 1fr; gap: 4px; } }
  .pu-nama { font-size: 13px; }
  .pu-track { position: relative; height: 20px; border-left: 1px solid var(--line); }
  .pu-bar {
    position: absolute; inset: 3px auto 3px 0; width: var(--w);
    background: var(--accent2);
    display: flex; align-items: center;
  }
  .pu-bar.macet {
    background: repeating-linear-gradient(135deg, var(--accent2) 0 6px, transparent 6px 10px);
    opacity: 0.85;
  }
  .pu-hari { margin-left: calc(100% + 8px); font-size: 9.5px; letter-spacing: 0.08em; color: var(--muted); white-space: nowrap; }
  .pu-kaki { font-size: 15px; margin-top: 24px; max-width: 56ch; }
  .pu-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
</style>
