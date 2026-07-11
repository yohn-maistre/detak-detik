<script lang="ts">
  /**
   * Pasar Pagi: the macro & resource ticker — the prices every Indonesian
   * feels, each read against its own normal so a glance tells you good or
   * bad. Live quotes are best-effort (keyless, CORS-open); dark feeds keep
   * a labelled sample. No re-pricing lever here — the rupiah is the rupiah;
   * the nasi-bungkus lever lives with the money that was *lost* (Act II).
   */
  import { onMount } from 'svelte';

  type Sentimen = 'baikNaik' | 'burukNaik' | 'netral';
  type Inst = {
    id: string; label: string; val: number; unit: string; rupiah: boolean;
    spark: number[]; src: string; live: boolean; sentimen: Sentimen;
  };

  let instrumen = $state<Inst[]>([
    { id: 'usd', label: 'USD → IDR', val: 16_485, unit: '', rupiah: true, sentimen: 'burukNaik',
      spark: [161, 162, 162, 163, 164, 164, 165, 165, 164, 165, 165, 165], src: 'er-api · contoh', live: false },
    { id: 'emas', label: 'EMAS · /GRAM', val: 1_973_000, unit: '', rupiah: true, sentimen: 'netral',
      spark: [180, 182, 185, 184, 188, 190, 193, 192, 196, 197, 197, 197], src: 'antam · contoh', live: false },
    { id: 'ihsg', label: 'IHSG', val: 7_412, unit: 'poin', rupiah: false, sentimen: 'baikNaik',
      spark: [73, 72, 74, 75, 73, 75, 74, 76, 77, 74, 75, 74], src: '^jkse · contoh', live: false },
    { id: 'brent', label: 'MINYAK BRENT · /BAREL', val: 71, unit: 'US$', rupiah: false, sentimen: 'burukNaik',
      spark: [68, 69, 70, 72, 71, 73, 74, 72, 73, 71, 72, 71], src: 'eia · contoh', live: false },
    { id: 'nikel', label: 'NIKEL · /TON', val: 15_280, unit: 'US$', rupiah: false, sentimen: 'netral',
      spark: [167, 165, 162, 160, 158, 156, 155, 153, 152, 153, 152, 153], src: 'lme · contoh', live: false },
    { id: 'bbm', label: 'PERTAMAX · /LITER', val: 12_400, unit: '', rupiah: true, sentimen: 'burukNaik',
      spark: [121, 121, 121, 124, 124, 124, 124, 124, 124, 124, 124, 124], src: 'mypertamina · jun', live: false },
  ]);

  const AKSARA_URL = (import.meta.env.PUBLIC_AKSARA_URL as string | undefined)?.replace(/\/$/, '');
  onMount(() => {
    (async () => {
      // the worker aggregates USD/IDR (keyless) + IHSG/Brent (Yahoo, server-side)
      if (AKSARA_URL) {
        try {
          const res = await fetch(`${AKSARA_URL}/pasar`, { signal: AbortSignal.timeout(6000) });
          const { data } = (await res.json()) as { data?: Record<string, { val: number; spark?: number[] }> };
          if (data && Object.keys(data).length) {
            instrumen = instrumen.map((i) => {
              const d = data[i.id];
              if (!d) return i;
              return { ...i, val: Math.round(d.val), spark: d.spark?.length ? d.spark : i.spark, src: `${i.src.split(' · ')[0]} · langsung`, live: true };
            });
            return;
          }
        } catch { /* fall through to the keyless rupiah */ }
      }
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(5000) });
        const data = (await res.json()) as { rates?: { IDR?: number } };
        if (data.rates?.IDR) instrumen = instrumen.map((i) => i.id === 'usd' ? { ...i, val: Math.round(data.rates!.IDR!), src: 'er-api · langsung', live: true } : i);
      } catch { /* sample stands, chip says so */ }
    })();
  });

  const sparkPath = (s: number[]) => {
    const lo = Math.min(...s), hi = Math.max(...s);
    return s.map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i / (s.length - 1)) * 100} ${30 - ((v - lo) / (hi - lo || 1)) * 26}`).join(' ');
  };
  const baseY = (s: number[]) => {
    const lo = Math.min(...s), hi = Math.max(...s);
    return 30 - ((s[0]! - lo) / (hi - lo || 1)) * 26;
  };

  const fmt = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
  const tampil = (i: Inst) => {
    if (i.rupiah) return `Rp ${fmt.format(i.val)}`;
    if (i.unit === 'poin') return `${fmt.format(i.val)} poin`;
    if (i.unit === 'US$') return `US$ ${fmt.format(i.val)}`;
    return fmt.format(i.val);
  };

  function verdikt(i: Inst): { arah: string; pct: string; nada: 'baik' | 'buruk' | 'datar' } {
    const pct = ((i.spark.at(-1)! - i.spark[0]!) / i.spark[0]!) * 100;
    const arah = Math.abs(pct) < 1.2 ? '→' : pct > 0 ? '▲' : '▼';
    let nada: 'baik' | 'buruk' | 'datar' = 'datar';
    if (Math.abs(pct) >= 1.2 && i.sentimen !== 'netral') {
      const buruk = (pct > 0) === (i.sentimen === 'burukNaik');
      nada = buruk ? 'buruk' : 'baik';
    }
    return { arah, pct: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, nada };
  }
</script>

<section class="pp" aria-label="Pasar pagi: kurs, komoditas, sumber daya" data-no-stempel>
  <div class="pp-head">
    <span class="inkbar"><span class="dot">●</span>PASAR</span>
    <span class="eyebrow">KURS, KOMODITAS, ENERGI · PERUBAHAN 30 HARI</span>
  </div>

  <div class="pp-grid">
    {#each instrumen as i (i.id)}
      {@const v = verdikt(i)}
      <article class="pp-card">
        <header class="pp-card-head mono">
          <span>{i.label}</span>
          <span class="pp-live" class:on={i.live}>{i.live ? '● LANGSUNG' : '○ CONTOH'}</span>
        </header>
        <p class="pp-val num">{tampil(i)}</p>
        <div class="pp-spark">
          <svg viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true">
            <line class="pp-base" x1="0" x2="100" y1={baseY(i.spark)} y2={baseY(i.spark)} />
            <path class={`pp-line ${v.nada}`} d={sparkPath(i.spark)} />
          </svg>
          <span class={`pp-verdikt mono ${v.nada}`}>{v.arah} {v.pct}</span>
        </div>
        <span class="pp-src mono">⊙ {i.src} · 30 hari</span>
      </article>
    {/each}
  </div>
</section>

<style>
  .pp { border-top: 1px solid var(--line); padding-top: 26px; margin-top: 8px; }
  .pp-head { display: flex; justify-content: space-between; align-items: baseline; gap: 14px; flex-wrap: wrap; margin-bottom: 18px; }
  /* meter plates, the Act II bank's grammar: one instrument family, two registers */
  .pp-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 16px clamp(12px, 1.8vw, 22px);
  }
  @media (max-width: 1020px) { .pp-grid { grid-template-columns: repeat(3, 1fr); } }
  @media (max-width: 560px) { .pp-grid { grid-template-columns: repeat(2, 1fr); } }
  .pp-card {
    position: relative;
    padding: 12px 13px 11px;
    border: 1px solid var(--line);
    display: flex; flex-direction: column; gap: 8px;
    background: none;
  }
  /* crosshairs centered exactly on the plate corners — asymmetric offsets
     used to overhang the grid's right edge and read as a rightward skew */
  .pp-card::before, .pp-card::after { content: '+'; position: absolute; font-family: var(--font-mono); font-size: 11px; line-height: 1; color: var(--muted); }
  .pp-card::before { top: 0; left: 0; transform: translate(-50%, -50%); }
  .pp-card::after { bottom: 0; right: 0; transform: translate(50%, 50%); }
  @media (max-width: 560px) { .pp-card::before, .pp-card::after { content: none; } }
  .pp-card-head { display: flex; justify-content: space-between; gap: 6px; font-size: 8.5px; letter-spacing: 0.13em; color: var(--muted); }
  .pp-live { font-size: 8px; white-space: nowrap; }
  .pp-live.on { color: var(--accent); }
  .pp-val { font-family: 'Fraunces Variable', serif; font-weight: 380; font-size: clamp(20px, 2.1vw, 27px); line-height: 1; }
  .pp-spark { display: flex; align-items: center; gap: 10px; }
  .pp-spark svg { flex: 1; height: 30px; }
  .pp-base { stroke: var(--line-soft); stroke-width: 0.6; stroke-dasharray: 2 3; }
  .pp-line { fill: none; stroke-width: 1.8; }
  .pp-line.buruk { stroke: var(--accent); }
  .pp-line.baik { stroke: var(--ink); }
  .pp-line.datar { stroke: var(--muted); }
  .pp-verdikt { font-size: 10px; letter-spacing: 0.04em; white-space: nowrap; }
  .pp-verdikt.buruk { color: var(--accent); }
  .pp-verdikt.baik { color: var(--ink); }
  .pp-verdikt.datar { color: var(--muted); }
  .pp-src { font-size: 8px; letter-spacing: 0.1em; color: var(--muted); }
</style>
