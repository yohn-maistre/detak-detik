<script lang="ts">
  /**
   * Pasar Pagi: six small instruments and one big lever. Live quotes are
   * fetched best-effort (keyless, CORS-open feeds); dark feeds keep their
   * sample values and say so on the chip. The lever is denominasi — one
   * tap re-prices every rupiah figure on the page through the command bus,
   * so Aksara can pull it too.
   */
  import { onMount } from 'svelte';
  import { dispatch } from '../lib/commands/dispatcher';
  import { DENOMS, getDenom, onDenom, formatUang, type Denom } from '../lib/denominasi';

  type Inst = {
    id: string; label: string; val: number; rupiah: boolean; satuan?: string;
    spark: number[]; src: string; live: boolean;
  };

  let denom = $state<Denom>(getDenom());
  let instrumen = $state<Inst[]>([
    { id: 'usd', label: 'USD → IDR', val: 16_485, rupiah: true, spark: [62, 64, 63, 66, 68, 67, 70, 72, 71, 74, 73, 76], src: 'er-api · contoh', live: false },
    { id: 'btc', label: 'BITCOIN', val: 1_842_000_000, rupiah: true, spark: [40, 44, 38, 52, 49, 58, 54, 62, 70, 66, 74, 78], src: 'coingecko · contoh', live: false },
    { id: 'emas', label: 'EMAS / GR', val: 1_973_000, rupiah: true, spark: [50, 52, 55, 54, 58, 60, 63, 62, 66, 70, 72, 75], src: 'antam · contoh', live: false },
    { id: 'ihsg', label: 'IHSG', val: 7_412, rupiah: false, satuan: 'poin', spark: [60, 58, 62, 64, 61, 65, 63, 67, 70, 68, 71, 69], src: '^jkse · contoh', live: false },
    { id: 'bbm', label: 'PERTAMAX / L', val: 12_400, rupiah: true, spark: [70, 70, 70, 72, 72, 72, 72, 71, 71, 71, 71, 71], src: 'mypertamina · jun', live: false },
    { id: 'cabai', label: 'CABAI RAWIT', val: 114, rupiah: false, satuan: 'indeks', spark: [30, 32, 35, 40, 44, 50, 56, 62, 70, 78, 86, 95], src: 'panel harga · contoh', live: false },
  ]);

  onMount(() => {
    const off = onDenom((d) => (denom = d));
    (async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(5000) });
        const data = (await res.json()) as { rates?: { IDR?: number } };
        if (data.rates?.IDR) {
          instrumen = instrumen.map((i) => i.id === 'usd' ? { ...i, val: Math.round(data.rates!.IDR!), src: 'er-api · langsung', live: true } : i);
        }
      } catch { /* chip keeps saying contoh */ }
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=idr', { signal: AbortSignal.timeout(5000) });
        const data = (await res.json()) as { bitcoin?: { idr?: number } };
        if (data.bitcoin?.idr) {
          instrumen = instrumen.map((i) => i.id === 'btc' ? { ...i, val: data.bitcoin!.idr!, src: 'coingecko · langsung', live: true } : i);
        }
      } catch { /* idem */ }
    })();
    return off;
  });

  const sparkPath = (s: number[]) =>
    s.map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i / (s.length - 1)) * 100} ${34 - (v / 100) * 30}`).join(' ');

  const fmtNum = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
  const tampil = (i: Inst) => (i.rupiah ? formatUang(i.val, denom) : `${fmtNum.format(i.val)} ${i.satuan ?? ''}`);
</script>

<section class="pp" aria-label="Pasar pagi: kurs, komoditas, indeks" data-no-stempel>
  <div class="pp-head">
    <span class="inkbar"><span class="dot">●</span>PASAR PAGI</span>
    <div class="pp-denom mono" role="group" aria-label="Satuan tampilan harga">
      <span class="pp-denom-label">SATUAN</span>
      {#each Object.entries(DENOMS) as [key, d] (key)}
        <button
          class="pp-denom-btn"
          class:aktif={denom === key}
          title={d.basis}
          onclick={() => dispatch({ cmd: 'denominate', params: { unit: key as Denom } })}
        >{d.label}</button>
      {/each}
    </div>
  </div>
  {#if denom !== 'rp'}
    <p class="pp-basis mono">DASAR KONVERSI · {DENOMS[denom].basis.toUpperCase()}</p>
  {/if}

  <div class="pp-grid">
    {#each instrumen as i (i.id)}
      <article class="pp-card">
        <header class="pp-card-head mono">
          <span>{i.label}</span>
          <span class="pp-live" class:on={i.live}>{i.live ? '● LANGSUNG' : '○ CONTOH'}</span>
        </header>
        <p class="pp-val num">{tampil(i)}</p>
        <svg viewBox="0 0 100 36" preserveAspectRatio="none" aria-hidden="true">
          <path d={sparkPath(i.spark)} />
        </svg>
        <span class="pp-src mono">⊙ {i.src}</span>
      </article>
    {/each}
  </div>
</section>

<style>
  .pp { border-top: 1px solid var(--line); padding-top: 22px; }
  .pp-head { display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap; }
  .pp-denom { display: flex; align-items: stretch; border: 1px solid var(--line); font-size: 9.5px; letter-spacing: 0.12em; }
  .pp-denom-label { padding: 5px 8px; color: var(--muted); border-right: 1px solid var(--line); }
  .pp-denom-btn {
    background: none; border: none; border-right: 1px solid var(--line);
    padding: 5px 9px; font: inherit; letter-spacing: inherit; color: var(--ink); cursor: pointer;
    transition: background 0.2s, color 0.2s;
  }
  .pp-denom-btn:last-child { border-right: none; }
  .pp-denom-btn.aktif { background: var(--accent); color: var(--bg); }
  .pp-basis { font-size: 9px; letter-spacing: 0.16em; color: var(--accent); margin-top: 8px; }

  .pp-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 0;
    margin-top: 16px;
    border: 1px solid var(--line);
  }
  @media (max-width: 1020px) { .pp-grid { grid-template-columns: repeat(3, 1fr); } }
  @media (max-width: 560px) { .pp-grid { grid-template-columns: repeat(2, 1fr); } }
  .pp-card {
    padding: 12px 14px 10px;
    border-right: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
    display: flex; flex-direction: column; gap: 6px;
    background: var(--card);
  }
  .pp-card-head { display: flex; justify-content: space-between; gap: 6px; font-size: 9px; letter-spacing: 0.14em; color: var(--muted); }
  .pp-live { font-size: 8px; }
  .pp-live.on { color: var(--accent); }
  .pp-val { font-size: clamp(15px, 1.6vw, 19px); font-weight: 700; line-height: 1.1; min-height: 2.2em; display: flex; align-items: center; }
  svg { width: 100%; height: 26px; }
  svg path { fill: none; stroke: var(--accent); stroke-width: 1.6; }
  .pp-src { font-size: 8.5px; letter-spacing: 0.1em; color: var(--muted); }
</style>
