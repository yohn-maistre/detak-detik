<script lang="ts">
  /**
   * Kas Daerah: 546 pemerintah daerah pada satu sumbu — porsi belanja
   * pegawai dari APBD, dibaca terhadap plafon 30% yang ditetapkan UU 1/2022
   * (HKPD) Ps.146, wajib penuh 2027. Titik di kanan garis = melampaui
   * plafonnya sendiri. Mengikuti Lensa: pilih provinsi atau kabupaten di
   * peta / lensa dan titiknya dinamai. Provinsi Papua membuka pameran
   * tambahan: dua dekade dana otsus terhadap kemiskinan (data khusus
   * wilayah itu). Sumber: harvest DJPK sendiri (public/data/apbd.json),
   * jitter deterministik (edisi yang sama untuk semua pembaca).
   */
  import { onMount } from 'svelte';
  import { reducedMotion } from '../lib/motion';
  import { rngFrom } from '../lib/seed';
  import { getLensa, onLensa } from '../lib/lensa';
  import { getLensaKab, onLensaKab } from '../lib/lensa-kab';
  import { EKONOMI } from '../lib/data/edisi';
  import OtsusGrafik from './OtsusGrafik.svelte';

  type Row = {
    kode: string; nama: string; pegawaiPct: number;
    rank_pegawaiPct: number; perKapita: number;
  };
  type Apbd = { tahun: number; nasional: { pegawaiPct: number }; nProv: number; nKab: number; baris: Row[] };

  const PLAFON = 30; // UU 1/2022 (HKPD) Pasal 146 — wajib penuh 2027

  let apbd = $state<Apbd | null>(null);
  let dots = $state<Array<Row & { jit: number; prov: boolean }>>([]);
  fetch(`${import.meta.env.BASE_URL}data/apbd.json`)
    .then((r) => (r.ok ? r.json() : null))
    .then((a: Apbd | null) => {
      if (!a) return;
      const rng = rngFrom('kas-daerah'); // stable row order → same scatter for everyone
      dots = a.baris.map((r) => ({ ...r, jit: rng(), prov: r.kode.length === 2 }));
      apbd = a;
    })
    .catch(() => {});

  // follow the lens: a drilled kabupaten wins over its province
  let kode = $state(getLensa());
  let kabKode = $state(getLensaKab()?.kode ?? null);
  onMount(() => {
    const offA = onLensa((k) => { kode = k; });
    const offB = onLensaKab((k) => { kabKode = k?.kode ?? null; });
    return () => { offA(); offB(); };
  });

  const pilihKode = $derived(kabKode ?? (kode !== 'nasional' ? kode : null));
  const pilih = $derived(pilihKode ? (dots.find((d) => d.kode === pilihKode) ?? null) : null);
  const papua = $derived(kode !== 'nasional' && Number(kode) >= 91 && Number(kode) <= 96);

  const lampaui = $derived(dots.filter((d) => d.pegawaiPct > PLAFON).length);

  const W = 640, H = 168, AXIS = 128, PADL = 14, PADR = 18, BAND = 92;
  const MAKS = $derived(Math.max(60, Math.ceil(Math.max(0, ...dots.map((d) => d.pegawaiPct)) / 5) * 5));
  const x = (v: number) => PADL + (v / MAKS) * (W - PADL - PADR);
  const y = (jit: number) => AXIS - 12 - jit * BAND;
  const pct = (v: number) => v.toLocaleString('id-ID', { maximumFractionDigits: 1 });

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

<div class="kd" class:masuk bind:this={root} data-no-stempel data-ref="kas-daerah">
  {#if apbd}
    <svg viewBox="0 0 {W} {H}" width="100%" role="img"
      aria-label={`Belanja pegawai ${dots.length} pemda: ${lampaui} melampaui plafon UU 30%. ${pilih ? `${pilih.nama}: ${pct(pilih.pegawaiPct)}%.` : ''}`}>
      <!-- ruler -->
      <line class="kd-axis" x1={PADL} x2={x(MAKS)} y1={AXIS} y2={AXIS} />
      {#each [0, 10, 20, 30, 40, 50, 60] as v (v)}
        {#if v <= MAKS}
          <line class="kd-grad" x1={x(v)} x2={x(v)} y1={AXIS} y2={AXIS + 5} />
          <text class="kd-grad-t" x={x(v)} y={AXIS + 16} text-anchor="middle">{v}%</text>
        {/if}
      {/each}

      <!-- one dot per pemda; right of the line = over its own legal ceiling -->
      <g class="kd-dots">
        {#each dots as d (d.kode)}
          <circle
            class="kd-dot" class:prov={d.prov} class:luar={d.pegawaiPct > PLAFON} class:pilih={pilih?.kode === d.kode}
            cx={x(d.pegawaiPct)} cy={y(d.jit)} r={pilih?.kode === d.kode ? 5 : d.prov ? 3 : 2} />
        {/each}
      </g>

      <!-- the statutory ceiling -->
      <line class="kd-plafon" x1={x(PLAFON)} x2={x(PLAFON)} y1={AXIS - 12 - BAND - 8} y2={AXIS} />
      <text class="kd-plafon-t" x={x(PLAFON) - 5} y={AXIS - 12 - BAND - 12} text-anchor="end">PLAFON UU · 30%</text>
      <text class="kd-lampaui" x={x(PLAFON) + 6} y={AXIS - 12 - BAND - 12}>{lampaui} DARI {dots.length} DI ATASNYA</text>

      <!-- national weighted line -->
      <line class="kd-nas" x1={x(apbd.nasional.pegawaiPct)} x2={x(apbd.nasional.pegawaiPct)} y1={AXIS - 6} y2={AXIS + 6} />
      <text class="kd-nas-t" x={x(apbd.nasional.pegawaiPct)} y={AXIS + 27} text-anchor="middle">NASIONAL {pct(apbd.nasional.pegawaiPct)}%</text>

      {#if pilih}
        <text class="kd-pilih-t" x={Math.min(Math.max(x(pilih.pegawaiPct), 120), W - 120)} y={y(pilih.jit) - 12} text-anchor="middle">
          {pilih.nama.toUpperCase()} · {pct(pilih.pegawaiPct)}% · №{pilih.rank_pegawaiPct}/{pilih.prov ? apbd.nProv : apbd.nKab}
        </text>
      {/if}
    </svg>
    <p class="kd-baca">
      {#if pilih}
        {pilih.nama} membelanjakan <b class:luar={pilih.pegawaiPct > PLAFON}>{pct(pilih.pegawaiPct)}%</b> APBD-nya untuk pegawai{pilih.pegawaiPct > PLAFON ? ', di atas plafon undang-undang' : ', di bawah plafon undang-undang'}.
      {:else}
        <b class="luar">{lampaui} dari {dots.length}</b> pemda membelanjakan lebih dari 30% APBD untuk pegawai, plafon yang UU 1/2022 wajibkan penuh pada 2027. Pilih daerah di peta atau lensa untuk membaca posisinya.
      {/if}
    </p>
    <p class="kd-key mono">TITIK KECIL = KABUPATEN/KOTA · TITIK BESAR = PROVINSI · KANAN GARIS = MELAMPAUI PLAFON</p>
    <button class="chip"><span class="tick">⊙</span>djpk kemenkeu · realisasi {apbd.tahun} · plafon: uu 1/2022 ps.146</button>

    {#if papua}
      <!-- the province asked for is Papua: its own two-decade exhibit -->
      <div class="kd-otsus">
        <span class="eyebrow">OTONOMI KHUSUS PAPUA · BELANJA DAN HASIL</span>
        <OtsusGrafik />
        <p class="kd-otsus-teks">{EKONOMI.otsus.teks}</p>
        <button class="chip"><span class="tick">⊙</span>{EKONOMI.otsus.chip}</button>
      </div>
    {/if}
  {:else}
    <p class="kd-tunggu mono">MEMUAT KARTOTEK APBD …</p>
  {/if}
</div>

<style>
  .kd { display: grid; gap: 10px; }
  svg { display: block; overflow: visible; }

  .kd-axis { stroke: var(--ink); stroke-width: 1.2; }
  .kd-grad { stroke: var(--line); stroke-width: 1; }
  .kd-grad-t { font-family: var(--font-mono); font-size: 8px; fill: var(--muted); }

  .kd-dots { opacity: 0; transition: opacity 0.9s ease 0.15s; }
  .kd.masuk .kd-dots { opacity: 1; }
  .kd-dot { fill: var(--muted); opacity: 0.5; }
  .kd-dot.prov { fill: var(--ink); opacity: 0.75; }
  .kd-dot.luar { fill: var(--accent); }
  .kd-dot.pilih { fill: var(--accent); opacity: 1; stroke: var(--ink); stroke-width: 1.2; }

  .kd-plafon { stroke: var(--accent); stroke-width: 1.4; stroke-dasharray: 5 3; }
  .kd-plafon-t { font-family: var(--font-mono); font-size: 7.5px; letter-spacing: 0.12em; fill: var(--accent); }
  .kd-lampaui { font-family: var(--font-mono); font-size: 7.5px; letter-spacing: 0.1em; fill: var(--muted); }
  .kd-nas { stroke: var(--ink); stroke-width: 2; }
  .kd-nas-t { font-family: var(--font-mono); font-size: 7px; letter-spacing: 0.1em; fill: var(--muted); }
  .kd-pilih-t { font-family: var(--font-mono); font-size: 8.5px; letter-spacing: 0.06em; fill: var(--ink); font-weight: 700; paint-order: stroke; stroke: var(--bg); stroke-width: 3; }

  .kd-baca { font-size: 13.5px; line-height: 1.55; color: var(--ink); max-width: 60ch; }
  .kd-baca b { font-weight: 700; }
  .kd-baca b.luar, .kd-baca .luar { color: var(--accent); }
  .kd-key { font-size: 7.5px; letter-spacing: 0.1em; color: var(--muted); }
  .kd-tunggu { font-size: 9px; letter-spacing: 0.12em; color: var(--muted); padding: 20px 0; }

  .kd-otsus { display: grid; gap: 10px; border-top: 1px solid var(--line); padding-top: 16px; margin-top: 8px; }
  .kd-otsus-teks { font-size: 13px; line-height: 1.55; color: var(--muted); max-width: 58ch; }
  .kd .chip { justify-self: start; }
</style>
