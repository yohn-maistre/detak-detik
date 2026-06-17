<script lang="ts">
  /**
   * Lensa Wilayah: the one panel beneath the map, and the playground's spine.
   * It opens on the nation — two live counters and the macro prints read each
   * against its target — and morphs to a province when the map, the search, or
   * Aksara sets the lens: the counters fold into a hero with its IPM rank, and
   * the comparative spread (the constant below) drops a marker onto every
   * measure, worst to best, with the national average as the reference tick.
   * Consolidates the old Indeks Pagi, Lensa Daerah, and Dasar Wilayah.
   * Nothing is geolocated; the reader (or Aksara) chooses.
   */
  import { onMount } from 'svelte';
  import { DAERAH } from '../lib/data/edisi';
  import { getLensa, getDaerah, onLensa } from '../lib/lensa';
  import { dispatch } from '../lib/commands/dispatcher';
  import { reducedMotion } from '../lib/motion';
  import { countUp } from '../lib/motion-kit';
  import { ramp } from '../lib/chart-kit';

  let kode = $state(getLensa());
  const d = $derived(getDaerah(kode));
  const isNas = $derived(d.kode === 'nasional');
  onMount(() => onLensa((k) => (kode = k)));

  let query = $state('');
  let buka = $state(false);
  function pilih(k: string) {
    dispatch({ cmd: 'set_lensa', params: { kode: k } });
    query = '';
    buka = false;
  }

  /* ── the comparative spread (the constant spine) ── */
  const num = (s: string) =>
    parseFloat(String(s).replace('~', '').replace('Rp', '').replace('jt', '').replace('%', '').replace(',', '.').trim());

  type Row = (typeof DAERAH)[number];
  type M = { k: string; label: string; baikTinggi: boolean; desimal: number; get: (x: Row) => number; fmt: (x: Row) => string };
  const METRIK: M[] = [
    { k: 'miskin', label: 'Kemiskinan', baikTinggi: false, desimal: 1, get: (x) => num(x.miskin), fmt: (x) => x.miskin },
    { k: 'ipm', label: 'Indeks pembangunan manusia', baikTinggi: true, desimal: 1, get: (x) => num(x.ipm), fmt: (x) => x.ipm },
    { k: 'dokter', label: 'Dokter per 1.000 jiwa', baikTinggi: true, desimal: 2, get: (x) => num(x.dokter), fmt: (x) => x.dokter },
    { k: 'ump', label: 'Upah minimum provinsi', baikTinggi: true, desimal: 2, get: (x) => num(x.ump), fmt: (x) => x.ump },
    { k: 'tpt', label: 'Pengangguran terbuka', baikTinggi: false, desimal: 1, get: (x) => num(x.tpt), fmt: (x) => x.tpt },
    { k: 'pegawai', label: 'Belanja pegawai dari APBD', baikTinggi: false, desimal: 0, get: (x) => num(x.pegawai), fmt: (x) => x.pegawai },
  ];

  const PROV = DAERAH.filter((r) => r.kode !== 'nasional');
  const nas = DAERAH.find((r) => r.kode === 'nasional')!;
  const N = PROV.length;

  function rentang(m: M) {
    const v = PROV.map(m.get);
    return { lo: Math.min(...v), hi: Math.max(...v) };
  }
  function posisi(m: M, v: number) {
    const { lo, hi } = rentang(m);
    const t = hi === lo ? 0.5 : (v - lo) / (hi - lo);
    return m.baikTinggi ? t : 1 - t;
  }
  function peringkat(m: M, r: Row) {
    const sorted = [...PROV].sort((a, b) => (m.baikTinggi ? m.get(b) - m.get(a) : m.get(a) - m.get(b)));
    return sorted.findIndex((x) => x.kode === r.kode) + 1;
  }

  const sorot = $derived(
    METRIK.map((m) => {
      const v = m.get(d);
      const p = posisi(m, v);
      const dn = v - m.get(nas);
      return {
        m, p,
        pn: posisi(m, m.get(nas)),
        val: m.fmt(d),
        rank: isNas ? null : peringkat(m, d),
        buruk: !isNas && p < 0.34,
        baik: !isNas && p > 0.66,
        deltaStr: `${dn > 0 ? '+' : '−'}${Math.abs(dn).toFixed(m.desimal).replace('.', ',')}`,
      };
    })
  );
  const ipmRank = $derived(isNas ? 0 : peringkat(METRIK[1]!, d));

  const hasil = $derived.by(() => {
    const q = query.trim().toLowerCase();
    return q ? PROV.filter((r) => r.nama.toLowerCase().includes(q) || r.pulau.toLowerCase().includes(q)) : PROV;
  });

  /* province face: the dossier stats, each against the national print */
  const STAT = $derived([
    { k: 'Penduduk', v: d.penduduk, n: nas.penduduk },
    { k: 'Kemiskinan', v: d.miskin, n: nas.miskin },
    { k: 'Dokter / 1.000', v: d.dokter, n: nas.dokter },
    { k: 'IPM', v: d.ipm, n: nas.ipm },
    { k: 'Belanja pegawai APBD', v: d.pegawai, n: nas.pegawai },
  ]);

  /* the rank tallies up when a province is chosen; instant under reduced motion */
  function tally(node: HTMLElement, value: number) {
    const run = (v: number) => countUp(node, v, (n) => String(Math.round(n)), 0.8);
    run(value);
    return { update: run };
  }

  /* spread fills reveal once on scroll */
  let root: HTMLElement;
  onMount(() => {
    if (reducedMotion()) { root.querySelector('.ld-spread')?.classList.add('in'); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) { e.target.classList.add('in'); io.disconnect(); }
    }, { threshold: 0.2 });
    const el = root.querySelector('.ld-spread');
    if (el) io.observe(el);
    return () => io.disconnect();
  });
</script>

<section class="lw" class:prov={!isNas} data-no-stempel data-ref="dossier" id="lensa" bind:this={root}>
  <div class="lw-head">
    <span class="inkbar"><span class="dot">●</span>LENSA WILAYAH</span>
    <span class="eyebrow lw-head-sub">{isNas ? 'ANGKA DASAR NASIONAL · CARI PROVINSIMU UNTUK MELIHAT DI MANA IA BERDIRI' : 'SATU PROVINSI, DIBACA TERHADAP ACUAN NASIONAL'}</span>
    <span class="coordstamp lw-tele mono">{isNas ? 'LENS · NASIONAL' : `LENS · ${d.kode} · IPM ${ipmRank}/${N}`}</span>
  </div>

  <!-- search: the lens selector -->
  <div class="lw-find" class:buka>
    <div class="ld-field">
      <span class="ld-ic mono" aria-hidden="true">⌕</span>
      <input
        class="mono"
        type="text"
        bind:value={query}
        onfocus={() => (buka = true)}
        placeholder="ketik nama provinsi: jakarta, papua, aceh, sulawesi …"
        aria-label="Cari provinsi"
      />
      {#if !isNas}
        <button class="ld-reset mono" onclick={() => pilih('nasional')}>← NASIONAL</button>
      {/if}
    </div>
    {#if buka}
      <div class="ld-results" role="listbox" aria-label="Hasil pencarian provinsi">
        <button class="ld-opt nas mono" class:aktif={isNas} onclick={() => pilih('nasional')}>
          <span class="ld-opt-nama">Indonesia</span><span class="ld-opt-pulau">acuan nasional</span>
        </button>
        {#each hasil as r (r.kode)}
          <button class="ld-opt mono" class:aktif={kode === r.kode} onclick={() => pilih(r.kode)} role="option" aria-selected={kode === r.kode}>
            <span class="ld-opt-nama">{r.nama}</span><span class="ld-opt-pulau">{r.pulau}</span>
          </button>
        {:else}
          <p class="ld-kosong mono">tak ada provinsi cocok dengan “{query}”.</p>
        {/each}
      </div>
    {/if}
  </div>

  <!-- the morphing face: nation ⇄ province -->
  {#key d.kode}
    <div class="lw-face">
      {#if !isNas}
        <div class="ld-hero">
          <div class="ld-hero-id">
            <span class="ld-pulau mono">{d.pulau.toUpperCase()}</span>
            <h3 class="ld-nama display">{d.nama}</h3>
            <p class="ld-verdict fig">{d.fakta}</p>
          </div>
          <div class="ld-hero-rank">
            <span class="ld-rank-k mono">PERINGKAT IPM</span>
            <p class="ld-rank-n display num"><span use:tally={ipmRank}>{ipmRank}</span><span class="ld-rank-of">/{N}</span></p>
            <span class="ld-rank-sub mono">DARI {N} PROVINSI</span>
          </div>
        </div>

        <div class="dossier-stats">
          {#each STAT as s (s.k)}
            <div class="dossier-stat">
              <span class="ds-k mono">{s.k}</span>
              <span class="ds-v num">{s.v}</span>
              <span class="ds-n mono">nasional {s.n}</span>
            </div>
          {/each}
        </div>
      {:else}
        <p class="lw-prompt fig">Klik sebuah provinsi di peta, atau cari namanya di atas, untuk membacanya terhadap acuan nasional. Sebaran di bawah menunjukkan posisi tiap provinsi.</p>
      {/if}
    </div>
  {/key}

  <!-- comparative spread: the constant below both faces -->
  <div class="ld-spread">
    {#each sorot as s, i (s.m.k)}
      <div class="ld-row">
        <div class="ld-row-l">
          <span class="ld-label">{s.m.label}</span>
          {#if !isNas}
            <span class="ld-rank-chip mono" class:buruk={s.buruk} class:baik={s.baik}>ke-{s.rank}/{N}</span>
          {/if}
        </div>
        <div class="ld-row-r">
          <span class="ld-val num" class:buruk={s.buruk} class:baik={s.baik}>{s.val}</span>
          {#if !isNas}
            <span class="ld-delta mono">{s.deltaStr} vs nasional</span>
          {/if}
        </div>
        <div class="ld-track">
          <span class="ld-end mono kiri">TERBURUK</span>
          <span class="ld-end mono kanan">TERBAIK</span>
          <span class="ld-fill" style={`--p:${s.p * 100}%;--d:${(i * 0.08).toFixed(2)}s;background:${ramp(0.85 - s.p * 0.55)}`}></span>
          <span class="ld-nas" style={`left:${s.pn * 100}%`} title="rerata nasional"><i class="ld-nas-lab mono">NASIONAL</i></span>
          {#if !isNas}
            <span class="ld-mark" class:buruk={s.buruk} class:baik={s.baik} style={`left:${s.p * 100}%`}></span>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  <div class="lw-foot">
    {#if !isNas}
      <span class="eyebrow">PENGADAAN WILAYAH · POTENSI SELISIH HARGA: DIHITUNG NETRAL DARI MEDIAN KATEGORI NASIONAL · SIRUP/INAPROC · SEGERA</span>
    {:else}
      <span class="eyebrow">SEMUA UKURAN: NASIONAL DEFAULT · DAERAH HANYA LEWAT LENSA INI</span>
    {/if}
    <button class="chip"><span class="tick">⊙</span>bps · djpk · (data contoh)</button>
  </div>
</section>

<style>
  /* deboxed: an open dossier under the map, separated by a single top rule */
  .lw { border-top: 1px solid var(--line); padding: clamp(18px, 2.6vw, 30px) 0 0; background: none; margin-top: clamp(16px, 2.6vw, 28px); }
  .lw-head { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--line-soft); transition: border-color 0.4s; }
  .lw.prov .lw-head { border-bottom-color: var(--accent); }
  .lw-head-sub { flex: 1 1 auto; }
  .lw-tele { margin-left: auto; white-space: nowrap; }
  .lw.prov .lw-tele { color: var(--accent); }

  /* the face crossfades on morph; instant under reduced motion */
  .lw-face { margin-bottom: 28px; }
  @media (prefers-reduced-motion: no-preference) {
    .lw-face { animation: lwIn 0.5s var(--ease-out); }
  }
  @keyframes lwIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

  /* search */
  .lw-find { position: relative; margin-bottom: 26px; max-width: 620px; }
  .ld-field { display: flex; align-items: center; gap: 10px; border: 1px solid var(--line); background: var(--bg); padding: 0 12px; }
  .ld-ic { color: var(--muted); font-size: 16px; }
  .ld-field input { flex: 1; background: none; border: none; outline: none; color: var(--ink); font-size: 13px; letter-spacing: 0.02em; padding: 13px 0; }
  .ld-field input::placeholder { color: var(--muted); }
  .ld-reset { background: none; border: none; border-left: 1px solid var(--line); color: var(--accent); font-size: 9px; letter-spacing: 0.14em; padding: 8px 10px; cursor: pointer; white-space: nowrap; }
  .ld-results {
    position: absolute; z-index: 20; top: calc(100% - 1px); left: 0; right: 0;
    max-height: 264px; overflow-y: auto;
    border: 1px solid var(--line); background: var(--bg);
    display: grid; grid-template-columns: 1fr 1fr;
    box-shadow: 0 18px 40px -24px rgba(0, 0, 0, 0.5);
  }
  @media (max-width: 560px) { .ld-results { grid-template-columns: 1fr; } }
  .ld-opt {
    display: flex; justify-content: space-between; align-items: baseline; gap: 10px;
    background: none; border: none; border-bottom: 1px solid var(--line-soft); border-right: 1px solid var(--line-soft);
    padding: 9px 12px; cursor: pointer; text-align: left; color: var(--ink);
    transition: background 0.15s, padding-left 0.15s var(--ease-out);
  }
  .ld-opt:hover { background: color-mix(in oklab, var(--accent) 9%, transparent); padding-left: 16px; }
  .ld-opt.aktif { background: var(--ink); color: var(--bg); }
  .ld-opt.nas { grid-column: 1 / -1; border-bottom: 1px solid var(--line); }
  .ld-opt-nama { font-size: 12.5px; letter-spacing: 0.02em; }
  .ld-opt-pulau { font-size: 8.5px; letter-spacing: 0.12em; color: var(--muted); white-space: nowrap; }
  .ld-opt.aktif .ld-opt-pulau { color: var(--bg); opacity: 0.7; }
  .ld-kosong { grid-column: 1 / -1; padding: 16px 12px; font-size: 11px; color: var(--muted); }

  .lw-prompt { font-size: clamp(15px, 1.9vw, 19px); color: var(--muted); max-width: 56ch; line-height: 1.5; }

  /* province face: hero + dossier stats */
  .ld-hero { display: grid; grid-template-columns: 1fr auto; gap: clamp(18px, 4vw, 48px); align-items: end; padding-bottom: 22px; border-bottom: 1px solid var(--line); }
  @media (max-width: 620px) { .ld-hero { grid-template-columns: 1fr; align-items: start; } }
  .ld-pulau { font-size: 10px; letter-spacing: 0.2em; color: var(--accent); }
  .ld-nama { font-family: 'Fraunces Variable', serif; font-weight: 360; font-size: clamp(36px, 6.4vw, 76px); line-height: 0.94; margin: 8px 0 12px; letter-spacing: -0.01em; }
  .ld-verdict { font-size: clamp(15px, 1.9vw, 19px); color: var(--ink); max-width: 46ch; line-height: 1.45; }
  .ld-hero-rank { text-align: right; }
  @media (max-width: 620px) { .ld-hero-rank { text-align: left; } }
  .ld-rank-k { font-size: 9px; letter-spacing: 0.18em; color: var(--muted); display: block; }
  .ld-rank-n { font-family: 'Fraunces Variable', serif; font-weight: 300; font-size: clamp(52px, 10vw, 104px); line-height: 0.86; color: var(--accent); }
  @media (prefers-reduced-motion: no-preference) {
    .ld-rank-n { animation: ld-stamp 0.55s cubic-bezier(0.2, 1.5, 0.4, 1) both; transform-origin: left bottom; }
  }
  @keyframes ld-stamp { from { transform: scale(0.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .ld-rank-of { font-size: 0.36em; color: var(--muted); letter-spacing: 0; }
  .ld-rank-sub { font-size: 9px; letter-spacing: 0.14em; color: var(--muted); display: block; margin-top: 2px; }
  .dossier-stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: clamp(10px, 2vw, 22px); margin: 22px 0 0; }
  @media (max-width: 760px) { .dossier-stats { grid-template-columns: repeat(2, 1fr); gap: 18px; } }
  .dossier-stat { display: grid; gap: 3px; align-content: start; position: relative; padding-left: 14px; }
  .dossier-stat::before { content: ''; position: absolute; left: 0; top: 2px; bottom: 2px; width: 1px; background: var(--line-soft); }
  .ds-k { font-size: 8.5px; letter-spacing: 0.1em; color: var(--muted); }
  .ds-v { font-family: 'Fraunces Variable', serif; font-weight: 400; font-size: clamp(20px, 2.6vw, 30px); line-height: 1; }
  .ds-n { font-size: 8.5px; letter-spacing: 0.04em; color: var(--muted); }

  /* the comparative spread */
  .ld-spread { display: grid; gap: 26px; border-top: 1px solid var(--line); padding-top: 24px; }
  .ld-row { display: grid; grid-template-columns: 1fr auto; column-gap: 16px; row-gap: 10px; align-items: baseline; }
  .ld-row-l { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
  .ld-label { font-family: var(--font-fig); font-style: italic; font-size: clamp(15px, 1.8vw, 19px); color: var(--ink); }
  .ld-rank-chip { font-size: 8.5px; letter-spacing: 0.1em; color: var(--muted); border: 1px solid var(--line); padding: 2px 6px; }
  .ld-rank-chip.buruk { color: var(--accent); border-color: var(--accent); }
  .ld-rank-chip.baik { color: var(--accent2); border-color: var(--accent2); }
  .ld-row-r { text-align: right; white-space: nowrap; }
  .ld-val { font-family: 'Fraunces Variable', serif; font-weight: 400; font-size: clamp(22px, 3vw, 34px); line-height: 1; }
  .ld-val.buruk { color: var(--accent); }
  .ld-val.baik { color: var(--accent2); }
  .ld-delta { font-size: 9px; letter-spacing: 0.08em; color: var(--muted); display: block; margin-top: 4px; }
  .ld-track { grid-column: 1 / -1; position: relative; height: 6px; background: var(--line-soft); margin-top: 4px; box-shadow: inset 0 1px 0 color-mix(in oklab, var(--ink) 18%, transparent); }
  .ld-end { position: absolute; top: 9px; font-size: 7.5px; letter-spacing: 0.16em; color: var(--muted); opacity: 0.7; }
  .ld-end.kiri { left: 0; }
  .ld-end.kanan { right: 0; }
  .ld-fill {
    position: absolute; left: 0; top: 0; bottom: 0; width: var(--p);
    background: color-mix(in oklab, var(--ink) 26%, transparent);
    transform: scaleX(0); transform-origin: left;
  }
  .ld-spread.in .ld-fill { transform: scaleX(1); transition: transform 0.85s var(--ease-out) var(--d); }
  .ld-nas { position: absolute; top: -5px; width: 1px; height: 14px; background: var(--muted); }
  .ld-nas-lab { position: absolute; top: -13px; left: 50%; transform: translateX(-50%); font-size: 6.5px; letter-spacing: 0.1em; color: var(--muted); white-space: nowrap; font-style: normal; }
  .ld-mark {
    position: absolute; top: 50%; width: 14px; height: 14px; border-radius: 50%;
    background: var(--ink); border: 2px solid var(--card);
    transform: translate(-50%, -50%); box-shadow: 0 0 0 1px var(--ink);
    transition: left 0.7s var(--ease-out), background 0.4s;
  }
  .ld-mark.buruk { background: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
  .ld-mark.baik { background: var(--accent2); box-shadow: 0 0 0 1px var(--accent2); }

  .lw-foot { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; margin-top: 30px; border-top: 1px solid var(--line); padding-top: 16px; }
</style>
