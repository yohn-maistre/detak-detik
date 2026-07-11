<script lang="ts">
  /** Negara Hari Ini: the machine room's instrument panel. Two live counters
      tick like meters (population, state spending since midnight WIB); four
      macro vitals print as tick-ruler gauges — needle at the measured value,
      the stated target drawn as a shaded band (BI's inflation corridor) or a
      dashed promise line (the 8% growth pledge). The gap between needle and
      target is the finding; no adjective is printed. Scales are keyed by
      label: an unrecognized live vital degrades to a plain plate rather than
      risk a wrong needle. Figures are sample (contoh) until the edition. */
  import { onMount } from 'svelte';
  import { onEdisi, type LiveMakro } from '../lib/edition';

  const PENDUDUK_DASAR = 284_400_000;
  const PENDUDUK_EPOCH = Date.UTC(2026, 5, 30);
  const PENDUDUK_PER_DETIK = 2_100_000 / (365 * 24 * 3600);
  const APBN_PER_DETIK = 3_786e12 / (365 * 24 * 3600);

  // the daily meters (absorbed from the old Papan Angka — every ticking state
  // meter lives on this one panel). Documented average rates, labeled as such.
  const BPJS_PER_DETIK = 24e12 / (365 * 24 * 3600); // ~Rp 24 T projected 2026 deficit
  const HUTAN_HA_PER_JAM = 433_751 / (365 * 24); // Auriga: total loss 2025
  const DANANTARA_EPOCH = Date.UTC(2025, 1, 24); // launched, no financial report since
  const PHK_BULANAN = [
    { b: 'JAN', v: 5730 }, { b: 'FEB', v: 7443 }, { b: 'MAR', v: 5729 }, { b: 'APR', v: 3739 }, { b: 'MEI', v: 829 },
  ];
  const phkMax = Math.max(...PHK_BULANAN.map((p) => p.v));
  const phkTotal = PHK_BULANAN.reduce((a, p) => a + p.v, 0);

  let now = $state(Date.now());
  let detikHariIni = $state(0);
  onMount(() => {
    const tick = () => {
      now = Date.now();
      const wib = new Date(now + 7 * 3600_000);
      detikHariIni = wib.getUTCHours() * 3600 + wib.getUTCMinutes() * 60 + wib.getUTCSeconds();
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  });

  const fmt = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
  const fmt1 = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const rp = (n: number) => `Rp ${fmt.format(Math.round(n))}`;
  const penduduk = $derived(Math.round(PENDUDUK_DASAR + ((now - PENDUDUK_EPOCH) / 1000) * PENDUDUK_PER_DETIK));
  const danantaraHari = $derived(Math.floor((now - DANANTARA_EPOCH) / 86_400_000));

  const CETAKAN: LiveMakro[] = [
    { label: 'INFLASI · TAHUNAN', nilai: '3,48%', pre: 'sasaran BI', acuan: '2,5±1%', chip: 'bps · ihk', nada: 'datar' },
    { label: 'PERTUMBUHAN PDB', nilai: '5,61%', pre: 'janji kampanye', acuan: '8%', chip: 'bps · pdb', nada: 'buruk' },
    { label: 'PENGANGGURAN TERBUKA', nilai: '4,68%', pre: '', acuan: 'feb 2026', chip: 'bps · sakernas', nada: 'datar' },
    { label: 'UPAH RATA-RATA', nilai: 'Rp 3,29 jt', pre: 'per bulan', acuan: 'feb 2026', chip: 'bps · sakernas', nada: 'datar' },
  ];
  // the published edition's macro prints override the contoh when present
  let liveMakro = $state<LiveMakro[] | null>(null);
  onMount(() => onEdisi((e) => (liveMakro = e?.makro?.length ? e.makro : null)));
  const vitals = $derived(liveMakro ?? CETAKAN);

  /** ruler scales, keyed by label prefix — the drawn target states its source */
  type Skala = { kunci: string; min: number; max: number; satuan: string; pita?: [number, number]; pitaLabel?: string; sasar?: number; sasarLabel?: string };
  const SKALA: Skala[] = [
    { kunci: 'INFLASI', min: 0, max: 6, satuan: '%', pita: [1.5, 3.5], pitaLabel: 'PITA SASARAN BI · 2,5±1' },
    { kunci: 'PERTUMBUHAN PDB', min: 0, max: 9, satuan: '%', sasar: 8, sasarLabel: 'JANJI 8%' },
    { kunci: 'PENGANGGURAN', min: 0, max: 8, satuan: '%' },
    { kunci: 'UPAH', min: 0, max: 5, satuan: ' jt' },
  ];

  function angkaDari(nilai: string): number | null {
    const m = nilai.replace(/\.(?=\d{3})/g, '').match(/(\d+(?:,\d+)?)/);
    return m?.[1] ? Number(m[1].replace(',', '.')) : null;
  }

  // ruler geometry: 300-wide viewBox, baseline at y=28
  const X0 = 4, X1 = 296, BASE = 28;
  const clampN = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
  const sx = (s: Skala, v: number) => X0 + ((clampN(v, s.min, s.max) - s.min) / (s.max - s.min)) * (X1 - X0);

  const gauges = $derived(vitals.map((c) => {
    const s = SKALA.find((k) => c.label.toUpperCase().startsWith(k.kunci)) ?? null;
    const v = angkaDari(c.nilai);
    if (!s || v == null) {
      return { c, s: null, v: null, sub: `${c.pre ? `${c.pre} ` : ''}${c.acuan}`.toUpperCase() };
    }
    const ticks = Array.from({ length: s.max - s.min + 1 }, (_, k) => s.min + k);
    const xv = sx(s, v);
    if (s.pita) {
      const dalam = v >= s.pita[0] && v <= s.pita[1];
      return {
        c, s, v, xv, ticks,
        pitaX: [sx(s, s.pita[0]), sx(s, s.pita[1])] as [number, number],
        sub: dalam ? 'DI DALAM PITA SASARAN' : 'DI LUAR PITA SASARAN',
        aria: `${c.label} ${c.nilai}, pita sasaran ${s.pita[0]}–${s.pita[1]}${s.satuan}`,
      };
    }
    if (s.sasar != null) {
      const d = v - s.sasar;
      return {
        c, s, v, xv, ticks, sasarX: sx(s, s.sasar),
        sub: `JARAK KE JANJI · ${d < 0 ? '−' : '+'}${fmt1.format(Math.abs(d))} PP`,
        aria: `${c.label} ${c.nilai}, janji ${s.sasar}${s.satuan}`,
      };
    }
    return { c, s, v, xv, ticks, sub: `${c.pre ? `${c.pre} ` : ''}${c.acuan}`.toUpperCase(), aria: `${c.label} ${c.nilai}` };
  }));

  // the needles sweep in from zero once the panel scrolls into view
  let root: HTMLElement | undefined = $state();
  let sweep = $state(false);
  $effect(() => {
    if (!root) return;
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) { sweep = true; io.disconnect(); }
    }, { threshold: 0.3 });
    io.observe(root);
    return () => io.disconnect();
  });
</script>

<section class="np" data-no-stempel aria-label="Negara hari ini" bind:this={root}>
  <div class="np-live">
    <div class="np-live-card">
      <span class="eyebrow">PENDUDUK REPUBLIK SAAT INI</span>
      <p class="np-live-n num">{fmt.format(penduduk)}</p>
      <span class="np-chip mono">⊙ proyeksi bps · pertumbuhan alami ±2,1 jt/tahun · interpolasi</span>
    </div>
    <div class="np-live-sela" aria-hidden="true"></div>
    <div class="np-live-card">
      <span class="eyebrow">BELANJA NEGARA HARI INI</span>
      <p class="np-live-n num">{rp(APBN_PER_DETIK * detikHariIni)}</p>
      <span class="np-chip mono">⊙ pagu apbn 2026 ≈ rp 3.842 t · laju rata-rata · sejak 00.00 wib</span>
    </div>
  </div>

  <!-- the daily meters: state costs ticking at documented average rates,
       and one absence counted in days -->
  <div class="np-meters">
    <div class="np-live-card">
      <span class="eyebrow">DEFISIT BPJS HARI INI</span>
      <p class="np-live-n num kecil">{rp(BPJS_PER_DETIK * detikHariIni)}</p>
      <span class="np-chip mono">⊙ proyeksi rp 24 t/2026 · menkes, mei 2026 · laju rata-rata</span>
    </div>
    <div class="np-live-card">
      <span class="eyebrow">HUTAN PRIMER HILANG HARI INI</span>
      <p class="np-live-n num kecil">{fmt1.format((HUTAN_HA_PER_JAM * detikHariIni) / 3600)} ha</p>
      <span class="np-chip mono">⊙ auriga · 433.751 ha (2025) · laju rata-rata · sejak 00.00 wib</span>
    </div>
    <div class="np-live-card">
      <span class="eyebrow">PHK TERCATAT 2026</span>
      <p class="np-live-n num kecil">{fmt.format(phkTotal)}</p>
      <div class="np-phk" role="img" aria-label={`PHK per bulan Januari sampai Mei 2026, total ${fmt.format(phkTotal)}`}>
        {#each PHK_BULANAN as p (p.b)}
          <div class="np-phk-col">
            <i style={`--h:${Math.round((p.v / phkMax) * 100)}%`}></i>
            <span class="mono">{p.b}</span>
          </div>
        {/each}
      </div>
      <span class="np-chip mono">⊙ kemnaker satudata · jan–mei · hanya pekerja ter-jkp</span>
    </div>
    <div class="np-live-card absen">
      <div class="np-absen-teks">
        <span class="eyebrow">HARI TANPA LAPORAN KEUANGAN DANANTARA</span>
        <p class="np-absen-note">dana kelolaan ± US$900 miliar · belum ada laporan terbit sejak berdiri 24 feb 2025</p>
        <span class="np-chip mono">⊙ jakarta post · 19 mei 2026 · baris ini menunggu · jam berjalan di bab 01</span>
      </div>
      <p class="np-live-n num np-absen-n">{fmt.format(danantaraHari)}</p>
    </div>
  </div>

  <div class="np-gauges">
    {#each gauges as g, i (g.c.label)}
      <article class="np-g">
        <span class="np-g-k mono">{g.c.label}</span>
        <p class={`np-g-n num ${g.c.nada}`}>{g.c.nilai}</p>
        {#if g.s && g.v != null}
          <svg viewBox="0 0 300 42" role="img" aria-label={g.aria}>
            <line class="np-dasar" x1={X0} x2={X1} y1={BASE} y2={BASE} />
            {#each g.ticks ?? [] as t}
              <line class="np-tick" x1={sx(g.s, t)} x2={sx(g.s, t)} y1={BASE} y2={BASE + 4} />
              <text class="np-tick-lab" x={sx(g.s, t)} y="40" text-anchor="middle">{t === g.s.max ? `${t}${g.s.satuan}` : t}</text>
            {/each}
            {#if g.pitaX}
              <rect class="np-pita" x={g.pitaX[0]} y="16" width={g.pitaX[1] - g.pitaX[0]} height={BASE - 16} />
              <line class="np-pita-tepi" x1={g.pitaX[0]} x2={g.pitaX[0]} y1="14" y2={BASE} />
              <line class="np-pita-tepi" x1={g.pitaX[1]} x2={g.pitaX[1]} y1="14" y2={BASE} />
              <text class="np-pita-lab" x={(g.pitaX[0] + g.pitaX[1]) / 2} y="11" text-anchor="middle">{g.s.pitaLabel}</text>
            {/if}
            {#if g.sasarX != null}
              <line class="np-sasar" x1={g.sasarX} x2={g.sasarX} y1="12" y2={BASE} />
              <text class="np-sasar-lab" x={g.sasarX - 5} y="10" text-anchor="end">{g.s.sasarLabel}</text>
              <line class="np-jarak" class:tampak={sweep} x1={g.xv} x2={g.sasarX} y1="8" y2="8" />
              <line class="np-jarak" class:tampak={sweep} x1={g.sasarX} x2={g.sasarX} y1="6" y2="10" />
            {/if}
            <g class="np-jarum" style={`transform: translateX(${sweep ? g.xv : X0}px); transition-delay: ${i * 130}ms`}>
              <polygon points="-4,4 4,4 0,12" />
              <line x1="0" x2="0" y1="12" y2={BASE} />
            </g>
          </svg>
        {/if}
        <p class="np-g-sub mono">{g.sub}</p>
        <span class="np-chip mono">⊙ {g.c.chip}</span>
      </article>
    {/each}
  </div>
</section>

<style>
  .np { display: grid; gap: 24px; position: relative; z-index: 1; }

  /* two live meters, plated like bench instruments */
  .np-live { display: grid; grid-template-columns: 1fr 1px 1fr; gap: clamp(16px, 3vw, 36px); align-items: stretch; }
  @media (max-width: 720px) { .np-live { grid-template-columns: 1fr; } .np-live-sela { display: none; } }
  .np-live-sela { background: var(--line); }
  .np-live-card { position: relative; border: 1px solid var(--line); padding: 15px 17px 13px; display: grid; gap: 9px; align-content: start; }
  .np-live-card::before, .np-live-card::after { content: '+'; position: absolute; font-family: var(--font-mono); font-size: 11px; line-height: 1; color: var(--muted); }
  .np-live-card::before { top: 0; left: 0; transform: translate(-50%, -50%); }
  .np-live-card::after { bottom: 0; right: 0; transform: translate(50%, 50%); }
  .np-live-n { font-family: var(--font-mono); font-weight: 500; font-size: clamp(22px, 4vw, 42px); line-height: 1; letter-spacing: 0.01em; color: var(--ink); font-variant-numeric: tabular-nums lining-nums; }
  .np-live-n.kecil { font-size: clamp(18px, 2.6vw, 28px); }

  /* the daily meter bank (absorbed Papan Angka): three meters + one absence */
  .np-meters { display: grid; grid-template-columns: repeat(3, 1fr); gap: clamp(14px, 2.4vw, 28px); }
  @media (max-width: 900px) { .np-meters { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 560px) { .np-meters { grid-template-columns: 1fr; } }
  .np-phk { display: flex; gap: 7px; align-items: flex-end; height: 44px; margin-top: 2px; }
  .np-phk-col { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; gap: 3px; height: 100%; }
  .np-phk-col i { display: block; height: var(--h); background: var(--ink); }
  .np-phk-col span { font-size: 7px; letter-spacing: 0.1em; color: var(--muted); text-align: center; }
  /* the absence meter: the missing report counted in days, full width, madder */
  .np-live-card.absen {
    grid-column: 1 / -1;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 8px 26px;
    border-color: color-mix(in oklab, var(--accent) 45%, var(--line));
  }
  .np-live-card.absen::before, .np-live-card.absen::after { color: var(--accent); }
  .np-absen-teks { display: grid; gap: 7px; }
  .np-absen-n { color: var(--accent); font-size: clamp(34px, 6vw, 58px); }
  .np-absen-note { font-size: 12.5px; color: var(--muted); line-height: 1.5; max-width: 52ch; }
  @media (max-width: 560px) { .np-live-card.absen { grid-template-columns: 1fr; } .np-absen-n { order: -1; } }

  /* four gauges on one rail */
  .np-gauges { display: grid; grid-template-columns: repeat(4, 1fr); gap: clamp(16px, 2.6vw, 34px); border-top: 1px solid var(--line); padding-top: 20px; }
  @media (max-width: 900px) { .np-gauges { grid-template-columns: 1fr 1fr; row-gap: 28px; } }
  @media (max-width: 560px) { .np-gauges { grid-template-columns: 1fr; } }
  .np-g { display: grid; gap: 7px; align-content: start; }
  .np-g-k { font-size: 8.5px; letter-spacing: 0.14em; color: var(--muted); }
  .np-g-n { font-family: 'Fraunces Variable', serif; font-weight: 360; font-size: clamp(28px, 3.6vw, 42px); line-height: 1; color: var(--ink); }
  .np-g-n.buruk { color: var(--accent); }
  .np-g-n.baik { color: var(--accent2); }

  svg { display: block; width: 100%; margin-top: 2px; }
  .np-dasar, .np-tick { stroke: var(--line); stroke-width: 1; }
  .np-tick-lab { font-family: var(--font-mono); font-size: 7px; letter-spacing: 0.05em; fill: var(--muted); }
  .np-pita { fill: var(--accent2); opacity: 0.16; }
  .np-pita-tepi { stroke: var(--accent2); stroke-width: 0.8; opacity: 0.6; }
  .np-pita-lab, .np-sasar-lab { font-family: var(--font-mono); font-size: 7px; letter-spacing: 0.1em; fill: var(--accent2); }
  .np-sasar { stroke: var(--accent2); stroke-width: 1; stroke-dasharray: 3 3; }
  .np-jarak { stroke: var(--accent2); stroke-width: 1; opacity: 0; transition: opacity 0.6s ease 1.5s; }
  .np-jarak.tampak { opacity: 0.75; }
  .np-jarum { transition: transform 1.5s cubic-bezier(0.22, 0.9, 0.24, 1.03); will-change: transform; }
  @media (prefers-reduced-motion: reduce) { .np-jarum { transition: none; } .np-jarak { transition: none; } }
  .np-jarum line { stroke: var(--accent); stroke-width: 2; }
  .np-jarum polygon { fill: var(--accent); }

  .np-g-sub { font-size: 9px; letter-spacing: 0.09em; color: var(--ink); }
  .np-chip { font-size: 8.5px; letter-spacing: 0.1em; color: var(--muted); }
</style>
