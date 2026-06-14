<script lang="ts">
  /**
   * Indeks Pagi: the republic's pulse in plain figures, no lens, no verdicts.
   * Two live counters lead (population, state spending), then four published
   * prints read as a vital-signs band, each with the target or normal it is
   * measured against. Typography, not boxes.
   */
  import { onMount } from 'svelte';

  // BPS projection: ~284.4M mid-2026, natural growth ≈ +2.1M/yr
  const PENDUDUK_DASAR = 284_400_000;
  const PENDUDUK_EPOCH = Date.UTC(2026, 5, 30);
  const PENDUDUK_PER_DETIK = 2_100_000 / (365 * 24 * 3600);
  const APBN_PER_DETIK = 3_786e12 / (365 * 24 * 3600);

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
  const rp = (n: number) => `Rp ${fmt.format(Math.round(n))}`;
  const penduduk = $derived(Math.round(PENDUDUK_DASAR + ((now - PENDUDUK_EPOCH) / 1000) * PENDUDUK_PER_DETIK));

  // each print carries the target/normal it is read against; `acuan` is the
  // marked phrase (a kept-or-broken benchmark)
  const CETAKAN = [
    { label: 'INFLASI · TAHUNAN', nilai: '3,48%', pre: 'sasaran BI', acuan: '2,5±1%', post: '', chip: 'bps · ihk', nada: 'datar' },
    { label: 'PERTUMBUHAN PDB', nilai: '5,61%', pre: 'janji kampanye', acuan: '8%', post: '', chip: 'bps · pdb', nada: 'buruk' },
    { label: 'PENGANGGURAN TERBUKA', nilai: '4,68%', pre: '', acuan: 'feb 2026', post: '', chip: 'bps · sakernas', nada: 'datar' },
    { label: 'UPAH RATA-RATA', nilai: 'Rp 3,29 jt', pre: 'per bulan', acuan: 'feb 2026', post: '', chip: 'bps · sakernas', nada: 'datar' },
  ];
</script>

<section class="ip" aria-label="Indeks pagi: angka makro nasional" data-no-stempel>
  <span class="inkbar"><span class="dot">●</span>§5 · INDEKS PAGI · ANGKA DASAR NASIONAL</span>

  <div class="ip-live">
    <div class="ip-live-card">
      <span class="eyebrow">PENDUDUK REPUBLIK SAAT INI</span>
      <p class="ip-live-n num">{fmt.format(penduduk)}</p>
      <span class="ip-chip mono">⊙ proyeksi bps · pertumbuhan alami ±2,1 jt/tahun · interpolasi</span>
    </div>
    <div class="ip-live-sela" aria-hidden="true"></div>
    <div class="ip-live-card">
      <span class="eyebrow">BELANJA NEGARA HARI INI</span>
      <p class="ip-live-n num">{rp(APBN_PER_DETIK * detikHariIni)}</p>
      <span class="ip-chip mono">⊙ pagu apbn 2026 ≈ rp 3.842 t · laju rata-rata · sejak 00.00 wib</span>
    </div>
  </div>

  <div class="ip-vitals">
    {#each CETAKAN as c (c.label)}
      <article class="ip-vital">
        <span class="ip-vital-k mono">{c.label}</span>
        <p class={`ip-vital-n num ${c.nada}`}>{c.nilai}</p>
        <p class="ip-vital-sub mono">
          {#if c.pre}{c.pre} <span class="ip-acuan">{c.acuan}</span>{:else}<span class="ip-acuan flat">{c.acuan}</span>{/if}
        </p>
        <span class="ip-chip mono">⊙ {c.chip}</span>
      </article>
    {/each}
  </div>
</section>

<style>
  .ip { border-top: 1px solid var(--line); padding-top: 22px; }

  /* two live counters, a hairline between them, no boxes */
  .ip-live { display: grid; grid-template-columns: 1fr 1px 1fr; gap: clamp(18px, 4vw, 48px); align-items: end; margin: 18px 0 28px; }
  @media (max-width: 720px) { .ip-live { grid-template-columns: 1fr; } .ip-live-sela { display: none; } }
  .ip-live-sela { background: var(--line); align-self: stretch; }
  .ip-live-card { display: grid; gap: 8px; }
  .ip-live-n { font-family: 'Fraunces Variable', serif; font-weight: 360; font-size: clamp(34px, 5.6vw, 62px); line-height: 0.96; letter-spacing: -0.01em; font-variant-numeric: tabular-nums lining-nums; }

  /* four prints as a vital-signs band */
  .ip-vitals { display: grid; grid-template-columns: repeat(4, 1fr); gap: clamp(14px, 2.6vw, 30px); border-top: 1px solid var(--line); padding-top: 20px; }
  @media (max-width: 720px) { .ip-vitals { grid-template-columns: 1fr 1fr; gap: 22px; } }
  .ip-vital { display: grid; gap: 6px; align-content: start; position: relative; padding-left: 16px; }
  .ip-vital::before { content: ''; position: absolute; left: 0; top: 2px; bottom: 2px; width: 1px; background: var(--line-soft); }
  .ip-vital-k { font-size: 8.5px; letter-spacing: 0.14em; color: var(--muted); }
  .ip-vital-n { font-family: 'Fraunces Variable', serif; font-weight: 360; font-size: clamp(28px, 3.6vw, 44px); line-height: 1; }
  .ip-vital-n.buruk { color: var(--accent); }
  .ip-vital-sub { font-size: 9.5px; letter-spacing: 0.04em; color: var(--muted); }
  /* the benchmark, marked as if struck by hand */
  .ip-acuan { color: var(--ink); border-bottom: 1.5px solid var(--accent); padding-bottom: 1px; }
  .ip-acuan.flat { color: var(--muted); border-bottom-color: var(--line-soft); }
  .ip-chip { font-size: 8.5px; letter-spacing: 0.1em; color: var(--muted); margin-top: 2px; }
</style>
