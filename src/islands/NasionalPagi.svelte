<script lang="ts">
  /** Negara Hari Ini: the live national snapshot for the morning front — two
      counters that tick (population now, state spending so far today) and the
      macro prints, each read against its own target. Detached from Lensa
      Wilayah (which now travels with the map). Figures are sample (contoh). */
  import { onMount } from 'svelte';
  import { onEdisi, type LiveMakro } from '../lib/edition';

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
</script>

<section class="np" data-no-stempel aria-label="Negara hari ini">
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

  <div class="np-vitals">
    {#each vitals as c (c.label)}
      <article class="np-vital">
        <span class="np-vital-k mono">{c.label}</span>
        <p class={`np-vital-n num ${c.nada}`}>{c.nilai}</p>
        <p class="np-vital-sub mono">
          {#if c.pre}{c.pre} <span class="np-acuan">{c.acuan}</span>{:else}<span class="np-acuan flat">{c.acuan}</span>{/if}
        </p>
        <span class="np-chip mono">⊙ {c.chip}</span>
      </article>
    {/each}
  </div>
</section>

<style>
  .np { display: grid; gap: 0; }
  .np-live { display: grid; grid-template-columns: 1fr 1px 1fr; gap: clamp(18px, 4vw, 48px); align-items: end; margin-bottom: 26px; }
  @media (max-width: 720px) { .np-live { grid-template-columns: 1fr; } .np-live-sela { display: none; } }
  .np-live-sela { background: var(--line); align-self: stretch; }
  .np-live-card { display: grid; gap: 8px; }
  .np-live-n { font-family: 'Fraunces Variable', serif; font-weight: 360; font-size: clamp(34px, 5.6vw, 62px); line-height: 0.96; letter-spacing: -0.01em; font-variant-numeric: tabular-nums lining-nums; }
  .np-vitals { display: grid; grid-template-columns: repeat(4, 1fr); gap: clamp(14px, 2.6vw, 30px); border-top: 1px solid var(--line); padding-top: 20px; }
  @media (max-width: 720px) { .np-vitals { grid-template-columns: 1fr 1fr; gap: 22px; } }
  .np-vital { display: grid; gap: 6px; align-content: start; position: relative; padding-left: 16px; }
  .np-vital::before { content: ''; position: absolute; left: 0; top: 2px; bottom: 2px; width: 1px; background: var(--line-soft); }
  .np-vital-k { font-size: 8.5px; letter-spacing: 0.14em; color: var(--muted); }
  .np-vital-n { font-family: 'Fraunces Variable', serif; font-weight: 360; font-size: clamp(28px, 3.6vw, 44px); line-height: 1; }
  .np-vital-n.buruk { color: var(--accent); }
  .np-vital-sub { font-size: 9.5px; letter-spacing: 0.04em; color: var(--muted); }
  .np-acuan { color: var(--ink); border-bottom: 1.5px solid var(--accent); padding-bottom: 1px; }
  .np-acuan.flat { color: var(--muted); border-bottom-color: var(--line-soft); }
  .np-chip { font-size: 8.5px; letter-spacing: 0.1em; color: var(--muted); margin-top: 2px; }
</style>
