<script lang="ts">
  /**
   * Garis Start Sama, Lomba Berbeda: four small panels where Indonesia and
   * Vietnam stood close in 2000 and diverged. Simplified series, every
   * panel chipped; the wage panel is the gut-punch.
   */
  type Seri = { t: number; v: number }[];
  type Panel = {
    judul: string; satuan: string; chip: string;
    idn: Seri; vnm: Seri; catatan: string;
  };

  const PANELS: Panel[] = [
    {
      judul: 'Manufaktur · % PDB',
      satuan: '%',
      chip: 'world bank · nv.ind.manf.zs (seri disederhanakan)',
      idn: [{ t: 2000, v: 27.7 }, { t: 2005, v: 27.4 }, { t: 2010, v: 22.0 }, { t: 2015, v: 20.9 }, { t: 2020, v: 19.9 }, { t: 2025, v: 17.4 }],
      vnm: [{ t: 2000, v: 17.0 }, { t: 2005, v: 18.8 }, { t: 2010, v: 17.0 }, { t: 2015, v: 18.5 }, { t: 2020, v: 23.0 }, { t: 2025, v: 25.0 }],
      catatan: 'Pangsa manufaktur Indonesia turun dari 27,7% menjadi 17,4% PDB; pangsa Vietnam naik menjadi 25,0%.',
    },
    {
      judul: 'FDI masuk · % PDB',
      satuan: '%',
      chip: 'world bank · bx.klt.dinv (seri disederhanakan)',
      idn: [{ t: 2000, v: -2.8 }, { t: 2005, v: 2.9 }, { t: 2010, v: 1.8 }, { t: 2015, v: 2.3 }, { t: 2020, v: 1.8 }, { t: 2024, v: 1.6 }],
      vnm: [{ t: 2000, v: 4.2 }, { t: 2005, v: 3.4 }, { t: 2010, v: 6.9 }, { t: 2015, v: 6.1 }, { t: 2020, v: 4.6 }, { t: 2024, v: 4.2 }],
      catatan: 'Rasio FDI terhadap PDB Vietnam tercatat 4,2% pada 2024; Indonesia 1,6%.',
    },
    {
      judul: 'PISA Matematika',
      satuan: 'skor',
      chip: 'oecd pisa · 2003–2022',
      idn: [{ t: 2003, v: 360 }, { t: 2009, v: 371 }, { t: 2012, v: 375 }, { t: 2015, v: 386 }, { t: 2018, v: 379 }, { t: 2022, v: 366 }],
      vnm: [{ t: 2012, v: 511 }, { t: 2015, v: 495 }, { t: 2022, v: 469 }],
      catatan: 'Selisih 103 poin ≈ lima tahun sekolah, pada PDB per kapita yang serupa.',
    },
    {
      judul: 'Upah rata-rata · US$/bulan',
      satuan: 'US$',
      chip: 'bps sakernas · gso vietnam · 2025',
      idn: [{ t: 2015, v: 142 }, { t: 2020, v: 176 }, { t: 2025, v: 198 }],
      vnm: [{ t: 2015, v: 195 }, { t: 2020, v: 255 }, { t: 2025, v: 331 }],
      catatan: 'Buruh Vietnam kini dibayar ±70% lebih tinggi.',
    },
  ];

  const W = 300;
  const H = 170;
  const PAD = { l: 34, r: 12, t: 14, b: 22 };

  function jalur(seri: Seri, semua: Seri[]): string {
    const ts = semua.flat().map((d) => d.t);
    const vs = semua.flat().map((d) => d.v);
    const t0 = Math.min(...ts), t1 = Math.max(...ts);
    const v0 = Math.min(...vs), v1 = Math.max(...vs);
    const x = (t: number) => PAD.l + ((t - t0) / (t1 - t0)) * (W - PAD.l - PAD.r);
    const y = (v: number) => H - PAD.b - ((v - v0) / (v1 - v0 || 1)) * (H - PAD.t - PAD.b);
    return seri.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(d.t).toFixed(1)} ${y(d.v).toFixed(1)}`).join(' ');
  }

  function akhir(seri: Seri, semua: Seri[]): { x: number; y: number; v: number } {
    const ts = semua.flat().map((d) => d.t);
    const vs = semua.flat().map((d) => d.v);
    const t0 = Math.min(...ts), t1 = Math.max(...ts);
    const v0 = Math.min(...vs), v1 = Math.max(...vs);
    const last = seri[seri.length - 1]!;
    return {
      x: PAD.l + ((last.t - t0) / (t1 - t0)) * (W - PAD.l - PAD.r),
      y: H - PAD.b - ((last.v - v0) / (v1 - v0 || 1)) * (H - PAD.t - PAD.b),
      v: last.v,
    };
  }
</script>

<div class="gs" data-no-stempel>
  <div class="gs-legend mono">
    <span><i class="sw idn"></i>INDONESIA</span>
    <span><i class="sw vnm"></i>VIETNAM</span>
  </div>
  <div class="gs-grid">
    {#each PANELS as p (p.judul)}
      <figure class="gs-panel">
        <figcaption class="mono">{p.judul.toUpperCase()}</figcaption>
        <svg viewBox="0 0 {W} {H}" role="img" aria-label={`${p.judul}: Indonesia vs Vietnam`}>
          <path class="garis idn" d={jalur(p.idn, [p.idn, p.vnm])} />
          <path class="garis vnm" d={jalur(p.vnm, [p.idn, p.vnm])} />
          {#each [{ s: p.idn, k: 'idn' }, { s: p.vnm, k: 'vnm' }] as e}
            {@const a = akhir(e.s, [p.idn, p.vnm])}
            <circle class={e.k} cx={a.x} cy={a.y} r="3.5" />
            <text class={`val ${e.k}`} x={a.x + 6} y={a.y + 4}>{a.v}</text>
          {/each}
          <text class="t0" x={PAD.l} y={H - 6}>{Math.min(...[...p.idn, ...p.vnm].map((d) => d.t))}</text>
          <text class="t1" x={W - PAD.r} y={H - 6} text-anchor="end">{Math.max(...[...p.idn, ...p.vnm].map((d) => d.t))}</text>
        </svg>
        <p class="gs-catatan">{p.catatan}</p>
        <span class="gs-chip mono">⊙ {p.chip}</span>
      </figure>
    {/each}
  </div>
</div>

<style>
  .gs-legend { display: flex; gap: 20px; font-size: 10px; letter-spacing: 0.16em; color: var(--muted); margin-bottom: 16px; }
  .sw { display: inline-block; width: 14px; height: 3px; margin-right: 7px; vertical-align: middle; }
  .sw.idn { background: var(--accent); }
  .sw.vnm { background: var(--accent2); }
  .gs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  @media (max-width: 760px) { .gs-grid { grid-template-columns: 1fr; } }
  .gs-panel { border: 1px solid var(--line); padding: 14px 14px 12px; background: var(--card); }
  figcaption { font-size: 9.5px; letter-spacing: 0.18em; color: var(--muted); margin-bottom: 6px; }
  svg { width: 100%; height: auto; }
  .garis { fill: none; stroke-width: 2; }
  .garis.idn, circle.idn { stroke: var(--accent); }
  circle.idn { fill: var(--accent); }
  .garis.vnm, circle.vnm { stroke: var(--accent2); }
  circle.vnm { fill: var(--accent2); }
  svg text { font-family: var(--font-mono); font-size: 10px; fill: var(--muted); }
  svg text.val { font-size: 11px; font-weight: 700; }
  svg text.val.idn { fill: var(--accent); }
  svg text.val.vnm { fill: var(--accent2); }
  .gs-catatan { font-size: 12.5px; color: var(--muted); margin-top: 8px; }
  .gs-chip { display: block; font-size: 8.5px; letter-spacing: 0.1em; color: var(--muted); margin-top: 8px; }
</style>
