<script lang="ts">
  /**
   * Indeks Pagi: the republic's pulse in plain figures — no lens, no
   * verdicts, the macro row every front page owes its readers. Two cards
   * tick (population, state spending) at documented average rates; the
   * rest are the latest published prints with their receipts.
   */
  import { onMount } from 'svelte';
  import { formatUang, getDenom, onDenom, type Denom } from '../lib/denominasi';

  let denom = $state<Denom>(getDenom());

  // BPS projection: ~284.4M mid-2026, natural growth ≈ +2.1M/yr ≈ +0.0666/s
  const PENDUDUK_DASAR = 284_400_000;
  const PENDUDUK_EPOCH = Date.UTC(2026, 5, 30); // mid-year anchor
  const PENDUDUK_PER_DETIK = 2_100_000 / (365 * 24 * 3600);
  // APBN 2026 spending ceiling ≈ Rp 3.786 T -> average burn per second
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
    const off = onDenom((d) => (denom = d));
    return () => { clearInterval(iv); off(); };
  });

  const fmt = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
  const penduduk = $derived(Math.round(PENDUDUK_DASAR + ((now - PENDUDUK_EPOCH) / 1000) * PENDUDUK_PER_DETIK));

  const CETAKAN = [
    { label: 'INFLASI · TAHUNAN', nilai: '3,48%', sub: 'maret 2026', chip: 'bps · ihk' },
    { label: 'PERTUMBUHAN PDB', nilai: '5,61%', sub: 'triwulan I 2026', chip: 'bps · pdb' },
    { label: 'PENGANGGURAN TERBUKA', nilai: '4,68%', sub: 'februari 2026', chip: 'bps · sakernas' },
    { label: 'UPAH RATA-RATA', nilai: 'rp', rupiah: 3_290_000, sub: 'per bulan · feb 2026', chip: 'bps · sakernas' },
  ];
</script>

<section class="ip" aria-label="Indeks pagi: angka makro nasional" data-no-stempel>
  <span class="inkbar"><span class="dot">●</span>§3 · INDEKS PAGI · ANGKA DASAR NASIONAL</span>
  <div class="ip-grid">
    <article class="ip-card lebar">
      <span class="eyebrow">PENDUDUK REPUBLIK SAAT INI</span>
      <p class="ip-val num">{fmt.format(penduduk)}</p>
      <span class="ip-chip mono">⊙ proyeksi bps · pertumbuhan alami ±2,1 jt/tahun · interpolasi</span>
    </article>
    <article class="ip-card lebar">
      <span class="eyebrow">BELANJA NEGARA HARI INI</span>
      <p class="ip-val num">{formatUang(APBN_PER_DETIK * detikHariIni, denom)}</p>
      <span class="ip-chip mono">⊙ pagu apbn 2026 ≈ rp 3.786 t · laju rata-rata · sejak 00.00 wib</span>
    </article>
    {#each CETAKAN as c (c.label)}
      <article class="ip-card">
        <span class="eyebrow">{c.label}</span>
        <p class="ip-val num">{c.nilai === 'rp' ? formatUang(c.rupiah!, denom) : c.nilai}</p>
        <p class="ip-sub mono">{c.sub.toUpperCase()}</p>
        <span class="ip-chip mono">⊙ {c.chip}</span>
      </article>
    {/each}
  </div>
</section>

<style>
  .ip { border-top: 1px solid var(--line); padding-top: 22px; }
  .ip-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    border: 1px solid var(--line);
    margin-top: 16px;
  }
  @media (max-width: 920px) { .ip-grid { grid-template-columns: repeat(2, 1fr); } }
  .ip-card {
    padding: 14px 16px 12px;
    border-right: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
    background: var(--card);
    display: flex; flex-direction: column; gap: 6px;
  }
  .ip-card.lebar { grid-column: span 2; }
  @media (max-width: 560px) { .ip-card.lebar { grid-column: span 2; } }
  .ip-val { font-family: var(--font-display); font-weight: 800; font-size: clamp(20px, 2.6vw, 32px); line-height: 1; }
  .ip-sub { font-size: 8.5px; letter-spacing: 0.14em; color: var(--muted); }
  .ip-chip { margin-top: auto; font-size: 8.5px; letter-spacing: 0.1em; color: var(--muted); }
</style>
