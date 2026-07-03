<script lang="ts">
  /**
   * Hutan yang Hilang: 24 tahun kehilangan tutupan pohon (Hansen/UMD via
   * Global Forest Watch, kerapatan tajuk ≥30%), satu kolom per tahun;
   * bagian yang lebih gelap = di dalam konsesi sawit / serat kayu /
   * tebangan (bendera GFW). Mengikuti Lensa: pilih provinsi dan serinya
   * bertukar (pecahan konsesi hanya tersedia nasional). Provinsi
   * pemekaran Papua 2022 terbaca di dalam induknya — batas GADM, dan itu
   * dicetak, bukan disembunyikan. Data: public/data/hutan.json, panen
   * scripts/fetch-hutan.mjs (kembali dipanen tiap edisi — berkelanjutan,
   * bukan sekali riset).
   */
  import { onMount } from 'svelte';
  import { reducedMotion } from '../lib/motion';
  import { getLensa, getDaerah, onLensa } from '../lib/lensa';

  type Thn = { thn: number; ha: number; konsesiHa?: number };
  type Hutan = {
    sumber: string; atribusi: string; metode: string; batas: string; diambil: string;
    gabung: Record<string, string>;
    nasional: Thn[];
    prov: Record<string, { nama: string; seri: Thn[] }>;
  };

  let hutan = $state<Hutan | null>(null);
  fetch(`${import.meta.env.BASE_URL}data/hutan.json`)
    .then((r) => (r.ok ? r.json() : null))
    .then((h: Hutan | null) => { if (h) hutan = h; })
    .catch(() => {});

  let kode = $state(getLensa());
  onMount(() => onLensa((k) => { kode = k; }));

  // resolve the lens: direct series, or the GADM parent it reads inside
  const resolusi = $derived.by(() => {
    if (!hutan || kode === 'nasional') return null;
    const langsung = hutan.prov[kode];
    if (langsung) return { ...langsung, catatan: null as string | null };
    const induk = hutan.gabung[kode] ? hutan.prov[hutan.gabung[kode]!] : null;
    if (induk) return { ...induk, catatan: `${getDaerah(kode).nama} terbaca di dalam ${induk.nama} (batas GADM pra-pemekaran)` };
    return null;
  });

  const seri = $derived(resolusi ? resolusi.seri : (hutan?.nasional ?? []));
  const judulSeri = $derived(resolusi ? resolusi.nama : 'Indonesia');
  const akhir = $derived(seri.at(-1) ?? null);
  const puncak = $derived(seri.length ? seri.reduce((a, b) => (b.ha > a.ha ? b : a)) : null);
  const maxHa = $derived(puncak?.ha ?? 1);

  const W = 640, H = 210, PADL = 10, PADR = 10, AXIS = 178, TOP = 26;
  const bw = $derived((W - PADL - PADR) / Math.max(1, seri.length));
  const bx = (i: number) => PADL + i * bw;
  const bh = (ha: number) => ((ha / maxHa) * (AXIS - TOP));

  const fmtHa = (n: number) =>
    n >= 1e6 ? `${(n / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 2 })} jt ha`
    : n >= 1e3 ? `${Math.round(n / 1e3).toLocaleString('id-ID')} rb ha`
    : `${n.toLocaleString('id-ID')} ha`;
  const pct = (a: number, b: number) => Math.round((a / b) * 100);

  let root: HTMLElement;
  let masuk = $state(false);
  onMount(() => {
    if (reducedMotion()) { masuk = true; return; }
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) { masuk = true; io.disconnect(); }
    }, { threshold: 0.25 });
    io.observe(root);
    return () => io.disconnect();
  });
</script>

<div class="hh" class:masuk bind:this={root} data-no-stempel data-ref="hutan-hilang">
  {#if hutan && akhir}
    <div class="hh-kepala">
      <p class="hh-angka num">{fmtHa(akhir.ha)}</p>
      <div class="hh-baca">
        <p class="hh-label">tutupan pohon hilang di {judulSeri} sepanjang {akhir.thn}</p>
        {#if akhir.konsesiHa != null && akhir.konsesiHa > 0}
          <p class="hh-sub"><b>{pct(akhir.konsesiHa, akhir.ha)}%</b> di antaranya di dalam konsesi sawit, serat kayu, atau tebangan.</p>
        {/if}
        {#if resolusi?.catatan}
          <p class="hh-catatan mono">{resolusi.catatan.toUpperCase()}</p>
        {/if}
      </div>
    </div>

    <svg viewBox="0 0 {W} {H}" width="100%" role="img"
      aria-label={`Kehilangan tutupan pohon ${judulSeri} per tahun, 2001 sampai ${akhir.thn}; puncak ${puncak ? `${puncak.thn}: ${fmtHa(puncak.ha)}` : ''}; ${akhir.thn}: ${fmtHa(akhir.ha)}.`}>
      <line class="hh-axis" x1={PADL} x2={W - PADR} y1={AXIS} y2={AXIS} />
      {#each seri as t, i (t.thn)}
        <g class="hh-col" style={`transition-delay:${i * 28}ms`}>
          <rect class="hh-bar" x={bx(i) + bw * 0.14} y={AXIS - bh(t.ha)} width={bw * 0.72} height={bh(t.ha)} />
          {#if t.konsesiHa}
            <rect class="hh-bar-konsesi" x={bx(i) + bw * 0.14} y={AXIS - bh(t.konsesiHa)} width={bw * 0.72} height={bh(t.konsesiHa)} />
          {/if}
        </g>
        {#if t.thn % 4 === 1 || t.thn === akhir.thn}
          <text class="hh-thn" x={bx(i) + bw / 2} y={AXIS + 14} text-anchor="middle">{String(t.thn).slice(2)}</text>
        {/if}
      {/each}
      {#if puncak}
        {@const pi = seri.findIndex((s) => s.thn === puncak.thn)}
        <text class="hh-puncak" x={Math.min(Math.max(bx(pi) + bw / 2, 70), W - 70)} y={AXIS - bh(puncak.ha) - 8} text-anchor="middle">PUNCAK {puncak.thn} · {fmtHa(puncak.ha).toUpperCase()}</text>
      {/if}
    </svg>

    <p class="hh-key mono">
      KOLOM = SATU TAHUN · <i class="sw"></i>SELURUH KEHILANGAN
      {#if !resolusi}· <i class="sw konsesi"></i>DI DALAM KONSESI (BENDERA GFW){/if}
      · TAHUN DITULIS DUA DIGIT
    </p>
    <button class="chip"><span class="tick">⊙</span>{hutan.atribusi.toLowerCase()} · {hutan.metode.split(';')[0]} · panen {hutan.diambil}</button>
  {:else}
    <p class="hh-tunggu mono">MEMUAT SERI HUTAN …</p>
  {/if}
</div>

<style>
  .hh { display: grid; gap: 12px; }
  .hh-kepala { display: flex; align-items: baseline; gap: 18px; flex-wrap: wrap; }
  .hh-angka { font-family: 'Fraunces Variable', serif; font-weight: 340; font-size: clamp(40px, 5.4vw, 64px); line-height: 0.9; color: var(--accent); }
  .hh-baca { display: grid; gap: 4px; max-width: 46ch; }
  .hh-label { font-size: 13.5px; line-height: 1.5; color: var(--ink); }
  .hh-sub { font-size: 12.5px; line-height: 1.5; color: var(--muted); }
  .hh-sub b { color: var(--accent); }
  .hh-catatan { font-size: 8px; letter-spacing: 0.1em; color: var(--muted); }

  svg { display: block; overflow: visible; }
  .hh-axis { stroke: var(--ink); stroke-width: 1.2; }
  .hh-col { transform: scaleY(0); transform-origin: center bottom; transition: transform 0.7s cubic-bezier(0.22, 0.9, 0.24, 1.03); }
  .hh.masuk .hh-col { transform: scaleY(1); }
  .hh-bar { fill: color-mix(in oklab, var(--accent) 42%, transparent); }
  .hh-bar-konsesi { fill: var(--accent); }
  .hh-thn { font-family: var(--font-mono); font-size: 8px; fill: var(--muted); }
  .hh-puncak { font-family: var(--font-mono); font-size: 7.5px; letter-spacing: 0.1em; fill: var(--muted); }

  .hh-key { font-size: 7.5px; letter-spacing: 0.1em; color: var(--muted); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .sw { display: inline-block; width: 9px; height: 9px; background: color-mix(in oklab, var(--accent) 42%, transparent); }
  .sw.konsesi { background: var(--accent); }
  .hh-tunggu { font-size: 9px; letter-spacing: 0.12em; color: var(--muted); padding: 20px 0; }
  .hh .chip { justify-self: start; }
  @media (prefers-reduced-motion: reduce) { .hh-col { transition: none; } }
</style>
