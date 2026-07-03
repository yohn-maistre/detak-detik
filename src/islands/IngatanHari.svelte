<script lang="ts">
  /**
   * Ingatan: HARI INI DALAM SEJARAH — the atlas's dated plate. Reads the
   * curated registry (newsroom/data/atlas/ingatan.json, every event sourced
   * to its article) and surfaces the NEAREST anniversary by circular day
   * distance — deterministic, the same plate for every reader (law 5). The
   * kicker says honestly whether it is today, n days past, or n days ahead.
   */
  import INGATAN from '../../newsroom/data/atlas/ingatan.json';

  const kini = new Date();
  const doy = (m: number, d: number) => Math.floor((Date.UTC(2001, m - 1, d) - Date.UTC(2001, 0, 1)) / 86400000);
  const hariIni = doy(kini.getMonth() + 1, kini.getDate());

  const dinilai = INGATAN.map((e) => {
    const [m, d] = e.tanggal.split('-').map(Number);
    const beda = doy(m!, d!) - hariIni;
    // circular distance across the year boundary, signed (+ = upcoming)
    const s = beda > 182 ? beda - 365 : beda < -182 ? beda + 365 : beda;
    return { ...e, s, jarak: Math.abs(s) };
  }).sort((a, b) => a.jarak - b.jarak || b.tahun - a.tahun);
  const p = dinilai[0]!;

  const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const [bm, bd] = p.tanggal.split('-').map(Number);
  const tanggalStr = `${bd} ${BULAN[bm! - 1]} ${p.tahun}`;
  const kicker = p.jarak === 0 ? 'HARI INI DALAM SEJARAH'
    : p.s > 0 ? `INGATAN TERDEKAT · ${p.jarak} HARI LAGI`
    : `INGATAN TERDEKAT · ${p.jarak} HARI LALU`;
  const selisihTahun = kini.getFullYear() - p.tahun;
</script>

<figure class="ih" data-no-stempel>
  <span class="ih-kicker mono">{kicker}</span>
  <div class="ih-body">
    <p class="ih-tahun display num">{p.tahun}</p>
    <div class="ih-teks-wrap">
      <p class="ih-tanggal mono">{tanggalStr} · {selisihTahun} TAHUN SILAM</p>
      <p class="ih-teks fig">{p.teks}</p>
      <a class="chip" href={p.sumber} target="_blank" rel="noopener"><span class="tick">⊙</span>id.wikipedia · baca kisahnya</a>
    </div>
  </div>
  <figcaption class="ih-cap mono">PLAT · INGATAN, DIPILIH KALENDER — SAMA UNTUK SEMUA PEMBACA</figcaption>
</figure>

<style>
  .ih { margin: 26px 0 0; display: grid; gap: 12px; border-top: 1px solid var(--line); padding-top: 18px; }
  .ih-kicker { font-size: 9px; letter-spacing: 0.2em; color: var(--accent); }
  .ih-body { display: grid; grid-template-columns: auto 1fr; gap: clamp(16px, 3vw, 36px); align-items: start; }
  @media (max-width: 640px) { .ih-body { grid-template-columns: 1fr; } }
  .ih-tahun { font-family: 'Fraunces Variable', serif; font-weight: 300; font-size: clamp(56px, 9vw, 104px); line-height: 0.85; color: var(--ink); letter-spacing: -0.02em; }
  .ih-teks-wrap { display: grid; gap: 8px; justify-items: start; }
  .ih-tanggal { font-size: 9px; letter-spacing: 0.16em; color: var(--muted); }
  .ih-teks { font-size: clamp(15px, 1.9vw, 19px); line-height: 1.55; max-width: 56ch; }
  .ih-cap { font-size: 8.5px; letter-spacing: 0.22em; color: var(--muted); text-align: center; margin-top: 4px; }
  .chip { text-decoration: none; }
</style>
