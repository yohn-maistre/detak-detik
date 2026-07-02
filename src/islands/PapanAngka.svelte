<script lang="ts">
  /**
   * Papan Angka: the counter wall. Six instruments, each a different
   * micro-form, all arithmetic over published figures — the tickers tick
   * at documented average rates, labeled as such. No feed required to be
   * honest; every card carries its receipt.
   */
  import { onMount } from 'svelte';

  // BPJS: ~Rp 24 T projected 2026 deficit -> Rp/second, ticking since 00.00 WIB
  const BPJS_PER_DETIK = 24e12 / (365 * 24 * 3600);
  // forest: 433,751 ha total loss in 2025 (Auriga) -> ha/hour average
  const HUTAN_HA_PER_JAM = 433_751 / (365 * 24);
  // Danantara: launched 24 Feb 2025, no financial report published since
  const DANANTARA_EPOCH = Date.UTC(2025, 1, 24);

  let detikHariIni = $state(0);
  let now = $state(Date.now());

  onMount(() => {
    const tick = () => {
      const d = new Date();
      // seconds since 00.00 WIB (UTC+7)
      const wib = new Date(d.getTime() + 7 * 3600_000);
      detikHariIni = wib.getUTCHours() * 3600 + wib.getUTCMinutes() * 60 + wib.getUTCSeconds();
      now = d.getTime();
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  });

  const fmt = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
  const fmt1 = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 });
  const rp = (n: number) => `Rp ${fmt.format(Math.round(n))}`;

  const PHK_BULANAN = [
    { b: 'JAN', v: 5730 }, { b: 'FEB', v: 7443 }, { b: 'MAR', v: 5729 }, { b: 'APR', v: 3739 }, { b: 'MEI', v: 829 },
  ];
  const phkMax = Math.max(...PHK_BULANAN.map((p) => p.v));
  const phkTotal = PHK_BULANAN.reduce((a, p) => a + p.v, 0);

  const danantaraHari = $derived(Math.floor((now - DANANTARA_EPOCH) / 86_400_000));
</script>

<section class="wall" aria-label="Papan angka harian" data-no-stempel>
  <span class="inkbar"><span class="dot">●</span>PAPAN ANGKA · BERDETAK SEPANJANG HARI</span>
  <div class="wall-grid">

    <article class="wall-card">
      <span class="eyebrow">DEFISIT BPJS HARI INI</span>
      <p class="wall-val num accent">{rp(BPJS_PER_DETIK * detikHariIni)}</p>
      <p class="wall-note">bertambah ± {rp(BPJS_PER_DETIK)} per detik · rasio klaim 111,9% (2026)</p>
      <span class="wall-chip mono">⊙ proyeksi Rp 24 T/2026 · menkes, mei 2026 · laju rata-rata</span>
    </article>

    <article class="wall-card">
      <span class="eyebrow">HUTAN PRIMER HILANG HARI INI</span>
      <p class="wall-val num">{fmt1.format((HUTAN_HA_PER_JAM * detikHariIni) / 3600)} ha</p>
      <p class="wall-note">± {fmt1.format(HUTAN_HA_PER_JAM)} ha per jam, sekitar satu lapangan bola tiap dua menit</p>
      <span class="wall-chip mono">⊙ gfw/umd · 296.000 ha (2025) · laju rata-rata</span>
    </article>

    <article class="wall-card">
      <span class="eyebrow">PHK TERCATAT 2026</span>
      <p class="wall-val num">{fmt.format(phkTotal)} <small>jiwa · jan–mei</small></p>
      <div class="wall-bars" role="img" aria-label="PHK per bulan Januari sampai Mei 2026">
        {#each PHK_BULANAN as p (p.b)}
          <div class="wall-bar-col">
            <i style={`--h:${Math.round((p.v / phkMax) * 100)}%`}></i>
            <span class="mono">{p.b}</span>
          </div>
        {/each}
      </div>
      <span class="wall-chip mono">⊙ kemnaker satudata · hanya pekerja ter-JKP</span>
    </article>

    <article class="wall-card lapor">
      <span class="eyebrow">HARI TANPA LAPORAN KEUANGAN DANANTARA</span>
      <p class="wall-val num">{fmt.format(danantaraHari)}</p>
      <p class="wall-note">dana kelolaan ± US$900 miliar · belum ada laporan terbit sejak berdiri</p>
      <span class="wall-chip mono">⊙ jakarta post · 19 mei 2026 · baris ini menunggu</span>
    </article>

  </div>
</section>

<style>
  .wall { border-top: 1px solid var(--line); padding-top: 22px; }
  .wall-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    border: 1px solid var(--line);
    margin-top: 16px;
  }
  @media (max-width: 920px) { .wall-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 560px) { .wall-grid { grid-template-columns: 1fr; } }
  /* the waiting row earns the widest cell: absence displayed at scale */
  @media (min-width: 921px) { .wall-card.lapor { grid-column: span 2; } }
  .wall-card {
    padding: 16px 18px 14px;
    border-right: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
    display: flex; flex-direction: column; gap: 8px;
    background: var(--card);
    min-height: 150px;
  }
  .wall-val { font-family: var(--font-display); font-weight: 800; font-size: clamp(20px, 2.4vw, 30px); line-height: 1; }
  .wall-val.accent { color: var(--accent); }
  .wall-val small { font-size: 0.45em; font-weight: 600; color: var(--muted); letter-spacing: 0.08em; }
  .wall-note { font-size: 12px; color: var(--muted); }
  .wall-chip { margin-top: auto; font-size: 8.5px; letter-spacing: 0.1em; color: var(--muted); }

  .wall-bars { display: flex; gap: 8px; align-items: flex-end; height: 52px; }
  .wall-bar-col { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; gap: 3px; height: 100%; }
  .wall-bar-col i { display: block; height: var(--h); background: var(--ink); }
  .wall-bar-col span { font-size: 7.5px; letter-spacing: 0.1em; color: var(--muted); text-align: center; }

  .lapor .wall-val { color: var(--accent); }
</style>
