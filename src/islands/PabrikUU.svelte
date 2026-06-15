<script lang="ts">
  /**
   * Pabrik Undang-Undang: how many days from draft to gazette, on a log
   * scale, because the spread won't fit on a linear one — which is the
   * finding. Bars draw themselves on reveal; the ones that expand power
   * pass in days (ember), the ones that would curb it stall for years
   * (hatched) and run off the right edge with an arrow.
   */
  import { reducedMotion } from '../lib/motion';

  const UU = [
    { nama: 'Revisi UU KPK (2019)', hari: 13, sah: true },
    { nama: 'Revisi UU Polri (2026)', hari: 20, sah: true },
    { nama: 'UU IKN (2022)', hari: 42, sah: true },
    { nama: 'Revisi UU TNI (2025)', hari: 35, sah: true },
    { nama: 'Revisi UU Minerba (2020)', hari: 90, sah: true },
    { nama: 'UU Cipta Kerja (2020)', hari: 244, sah: true },
    { nama: 'UU PDP (2022)', hari: 2190, sah: true },
    { nama: 'RUU Perampasan Aset', hari: 4900, sah: false },
    { nama: 'RUU Masyarakat Adat', hari: 6200, sah: false },
  ].sort((a, b) => a.hari - b.hari);

  const MAXLOG = Math.log10(8000);
  const lebar = (hari: number) => `${(Math.log10(Math.max(hari, 1)) / MAXLOG) * 100}%`;
  const fmtHari = (h: number) =>
    h < 365 ? `${h} hari` : `${(h / 365).toFixed(h / 365 >= 10 ? 0 : 1).replace('.', ',')} tahun`;
  // the thesis, colored: power-expanding laws clear in <= ~90 days
  const kelas = (u: { hari: number; sah: boolean }) =>
    !u.sah ? 'macet' : u.hari <= 90 ? 'cepat' : 'lambat';

  let root: HTMLDivElement | undefined = $state();
  $effect(() => {
    if (!root) return;
    if (reducedMotion()) { root.classList.add('in'); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) { root!.classList.add('in'); io.disconnect(); }
    }, { threshold: 0.25 });
    io.observe(root);
    return () => io.disconnect();
  });
</script>

<div class="pu" data-no-stempel bind:this={root}>
  <div class="pu-skala mono">
    <span>1 HARI</span><span>1 BULAN</span><span>1 TAHUN</span><span>10 TAHUN →</span>
  </div>
  <div class="pu-rows">
    {#each UU as u, i (u.nama)}
      <div class="pu-row">
        <span class="pu-nama">{u.nama}</span>
        <div class="pu-track">
          <i class="pu-bar {kelas(u)}" style={`--w:${lebar(u.hari)};--d:${(i * 0.07).toFixed(2)}s`}></i>
          <span class="pu-hari mono {kelas(u)}" style={`--w:${lebar(u.hari)};--d:${(i * 0.07 + 0.5).toFixed(2)}s`}>
            {fmtHari(u.hari)}{u.sah ? '' : ' · BELUM SAH'}{#if !u.sah}<span class="pu-arrow"> ⇢</span>{/if}
          </span>
        </div>
      </div>
    {/each}
  </div>
  <p class="pu-kaki fig">Yang memperluas kewenangan melaju dalam hitungan hari; yang merampas hasil korupsi menunggu belasan tahun. Skala logaritmik — pada skala biasa, sembilan baris ini tidak muat satu halaman.</p>
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
    transform: scaleX(0); transform-origin: left center;
    transition: transform 0.85s var(--ease-out) var(--d);
  }
  .pu.in .pu-bar { transform: scaleX(1); }
  .pu-bar.cepat { background: var(--accent); }
  .pu-bar.macet {
    background: repeating-linear-gradient(135deg, var(--accent2) 0 6px, transparent 6px 10px);
    opacity: 0.85;
  }
  .pu-hari {
    position: absolute; left: var(--w); top: 50%; transform: translateY(-50%);
    margin-left: 8px; font-size: 9.5px; letter-spacing: 0.08em; color: var(--muted); white-space: nowrap;
    opacity: 0; transition: opacity 0.4s ease var(--d);
  }
  .pu.in .pu-hari { opacity: 1; }
  .pu-hari.cepat { color: var(--accent); }
  .pu-hari.macet { color: var(--accent); font-weight: 600; }
  .pu-arrow { display: inline-block; animation: pu-nudge 1.5s var(--ease-out) infinite; }
  @keyframes pu-nudge { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(4px); } }
  .pu-kaki { font-size: 15px; margin-top: 24px; max-width: 56ch; }
  .pu-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
  @media (prefers-reduced-motion: reduce) {
    .pu-bar, .pu-hari { transition: none; }
    .pu-arrow { animation: none; }
  }
</style>
