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
  import { getLensaKab, onLensaKab, setLensaKab, type LensaKab } from '../lib/lensa-kab';
  import { dispatch } from '../lib/commands/dispatcher';
  import { reducedMotion } from '../lib/motion';
  import { countUp } from '../lib/motion-kit';
  import { ramp } from '../lib/chart-kit';

  let kode = $state(getLensa());
  let kab = $state<LensaKab | null>(getLensaKab());
  const d = $derived(getDaerah(kode));
  const isNas = $derived(d.kode === 'nasional');
  onMount(() => {
    // a province (re)selection clears any drilled-in regency; the map sets it back
    const offLensa = onLensa((k) => { kode = k; kab = null; });
    const offKab = onLensaKab((k) => { kab = k; });
    return () => { offLensa(); offKab(); };
  });

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

  /* ── the regency filing (P0.4): a clicked kabupaten, read inside its province.
     Figures + province aggregates arrive via set_lensa_kab; shares + density are
     derived from real data — nothing here is mocked. ── */
  const fmtN = (n: number, dec = 0) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: dec }).format(n);
  // BPS kode: 4 digits → prov.kab (e.g. "3501" → "35.01")
  const fmtKode = (k?: string) => (k && k.length >= 3 ? `${k.slice(0, 2)}.${k.slice(2)}` : (k ?? '—'));
  const koord = (lat?: number, lon?: number) =>
    lat != null && lon != null ? `${Math.abs(lat).toFixed(2)}°${lat < 0 ? 'LS' : 'LU'} · ${Math.abs(lon).toFixed(2)}°BT` : '';
  const kabView = $derived.by(() => {
    const k = kab;
    if (!k || isNas) return null;
    return {
      k,
      popShare: k.pop && k.provPop ? (k.pop / k.provPop) * 100 : null,
      luasShare: k.luas && k.provLuas ? (k.luas / k.provLuas) * 100 : null,
      kepadatan: k.pop && k.luas ? k.pop / k.luas : null,
      stamp: koord(k.lat, k.lon),
    };
  });
  /* ── KARTOTEK APBD (P13.12): real DJPK realization figures, vendored by
     scripts/fetch-apbd.mjs. Metrics + ranks are precomputed in the script;
     this panel only files them. Absent/failed file = the card stays silent. ── */
  type ApbdRow = {
    kode: string; nama: string; b: number; p: number; m: number; d: number; pop: number | null;
    pegawaiPct: number | null; modalPct: number | null; perKapita: number | null;
    rank_pegawaiPct?: number; rank_modalPct?: number; rank_perKapita?: number;
  };
  type Apbd = { sumber: string; tahun: number; nasional: { pegawaiPct: number; modalPct: number; perKapita: number }; nProv: number; nKab: number; baris: ApbdRow[] };
  let apbd = $state<Apbd | null>(null);
  let apbdIdx = $state<Record<string, ApbdRow>>({});
  fetch(`${import.meta.env.BASE_URL}data/apbd.json`)
    .then((r) => r.json())
    .then((a: Apbd) => {
      const m: Record<string, ApbdRow> = {};
      for (const r of a.baris) m[r.kode] = r;
      apbdIdx = m;
      apbd = a;
    })
    .catch(() => null);
  const apbdProv = $derived(!isNas ? (apbdIdx[d.kode] ?? null) : null);
  const apbdKab = $derived(kab?.kode ? (apbdIdx[kab.kode] ?? null) : null);
  const fmtRp = (n: number) => (n >= 1e6 ? `Rp ${fmtN(n / 1e6, 1)} jt` : `Rp ${fmtN(n / 1e3)} rb`);
  const pctStr = (n: number) => `${fmtN(n, 1)}%`;
  /* one filed metric: value, national print, rank, and a drawn position on the
     TERBURUK→TERBAIK ruler derived from the rank itself (rank 1 = highest value).
     Per-kapita carries no verdict — spending size is capacity, not virtue. */
  function kartotekBaris(r: ApbdRow, n: number) {
    const pos = (rank: number | undefined, tinggiBaik: boolean | null) => {
      if (!rank || n < 2) return null;
      const t = (rank - 1) / (n - 1); // 0 = highest value
      return tinggiBaik === null ? 1 - t : tinggiBaik ? 1 - t : t;
    };
    const rows = [
      { k: 'Belanja pegawai', v: r.pegawaiPct, nas: apbd!.nasional.pegawaiPct, rank: r.rank_pegawaiPct, tinggiBaik: false as boolean | null, fmt: pctStr, ujung: ['TERBURUK', 'TERBAIK'] },
      { k: 'Belanja modal', v: r.modalPct, nas: apbd!.nasional.modalPct, rank: r.rank_modalPct, tinggiBaik: true as boolean | null, fmt: pctStr, ujung: ['TERBURUK', 'TERBAIK'] },
      { k: 'Belanja per kapita', v: r.perKapita, nas: apbd!.nasional.perKapita, rank: r.rank_perKapita, tinggiBaik: null, fmt: fmtRp, ujung: ['TERKECIL', 'TERBESAR'] },
    ];
    return rows.filter((x) => x.v != null).map((x) => {
      const p = pos(x.rank, x.tinggiBaik);
      return {
        k: x.k, val: x.fmt(x.v!), nas: x.fmt(x.nas), rank: x.rank ?? null, n,
        p, ujung: x.ujung,
        buruk: x.tinggiBaik !== null && p != null && p < 0.34,
        baik: x.tinggiBaik !== null && p != null && p > 0.66,
      };
    });
  }
  const kartotekProv = $derived(apbd && apbdProv ? kartotekBaris(apbdProv, apbd.nProv) : null);
  const kartotekKab = $derived(apbd && apbdKab ? kartotekBaris(apbdKab, apbd.nKab) : null);

  /* the share meters self-draw when the band appears; instant under reduced motion */
  function reveal(node: HTMLElement) {
    if (reducedMotion()) { node.classList.add('in'); return; }
    const id = requestAnimationFrame(() => requestAnimationFrame(() => node.classList.add('in')));
    return { destroy() { cancelAnimationFrame(id); } };
  }

  const hasil = $derived.by(() => {
    const q = query.trim().toLowerCase();
    return q ? PROV.filter((r) => r.nama.toLowerCase().includes(q) || r.pulau.toLowerCase().includes(q)) : PROV;
  });

  /* province face: the dossier stats, each against the national print. The
     static belanja-pegawai estimate yields to the KARTOTEK card once the real
     DJPK figures have loaded (one number, one source). */
  const STAT = $derived([
    { k: 'Penduduk', v: d.penduduk, n: nas.penduduk },
    { k: 'Kemiskinan', v: d.miskin, n: nas.miskin },
    { k: 'Dokter / 1.000', v: d.dokter, n: nas.dokter },
    { k: 'IPM', v: d.ipm, n: nas.ipm },
    ...(apbdProv ? [] : [{ k: 'Belanja pegawai APBD', v: d.pegawai, n: nas.pegawai }]),
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
    <span class="eyebrow lw-head-sub">{isNas ? 'ANGKA DASAR NASIONAL · CARI PROVINSI UNTUK MELIHAT POSISINYA' : 'SATU PROVINSI, DIBACA TERHADAP ACUAN NASIONAL'}</span>
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
      <div class="ld-results" role="listbox" aria-label="Hasil pencarian provinsi" data-lenis-prevent>
        <button class="ld-opt nas mono" class:aktif={isNas} onclick={() => pilih('nasional')}>
          <span class="ld-opt-nama">Indonesia</span><span class="ld-opt-pulau">acuan nasional</span>
        </button>
        {#each hasil as r (r.kode)}
          <button class="ld-opt mono" class:aktif={kode === r.kode} onclick={() => pilih(r.kode)} role="option" aria-selected={kode === r.kode}>
            <span class="ld-opt-nama">{r.nama}</span><span class="ld-opt-pulau">{r.pulau}</span>
          </button>
        {:else}
          <p class="ld-kosong mono">tidak ada provinsi yang cocok dengan “{query}”.</p>
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

        {#if kartotekProv && apbd}
          <!-- KARTOTEK APBD: how the province spends, from DJPK's own ledger.
               Rows speak the spread's ld-* grammar; position is drawn from rank. -->
          <div class="lw-apbd">
            <div class="lw-apbd-head">
              <span class="lw-apbd-t mono">KARTOTEK APBD · REALISASI {apbd.tahun}</span>
              <span class="lw-apbd-s mono">PEMERINTAH PROVINSI · DJPK KEMENKEU</span>
            </div>
            {#each kartotekProv as r (r.k)}
              <div class="ld-row">
                <div class="ld-row-l">
                  <span class="ld-label">{r.k}</span>
                  {#if r.rank}<span class="ld-rank-chip mono" class:buruk={r.buruk} class:baik={r.baik}>ke-{r.rank}/{r.n}</span>{/if}
                </div>
                <div class="ld-row-r">
                  <span class="ld-val num" class:buruk={r.buruk} class:baik={r.baik}>{r.val}</span>
                  <span class="ld-delta mono">nasional {r.nas}</span>
                </div>
                {#if r.p != null}
                  <div class="ld-track">
                    <span class="ld-end mono kiri">{r.ujung[0]}</span>
                    <span class="ld-end mono kanan">{r.ujung[1]}</span>
                    <span class="ld-mark" class:buruk={r.buruk} class:baik={r.baik} style={`left:${(r.p * 100).toFixed(1)}%`}></span>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      {:else}
        <p class="lw-prompt fig">Klik sebuah provinsi di peta, atau cari namanya di atas, untuk membacanya terhadap acuan nasional. Sebaran di bawah menunjukkan posisi tiap provinsi.</p>
      {/if}
    </div>
  {/key}

  <!-- the regency filing: a clicked kabupaten, nested inside its province's view -->
  {#if kabView}
    {#key kabView.k.kode}
      <aside class="lw-kab" use:reveal>
        <div class="lw-kab-head">
          <span class="lw-kab-crumb mono">INDONESIA › {d.nama.toUpperCase()} › KABUPATEN</span>
          <button class="lw-kab-x mono" onclick={() => setLensaKab(null)} aria-label="Tutup kabupaten">TUTUP ✕</button>
        </div>
        <div class="lw-kab-id">
          <h4 class="lw-kab-nama display">{kabView.k.nama}</h4>
          <span class="lw-kab-stamp mono">KODE {fmtKode(kabView.k.kode)}{#if kabView.stamp} · {kabView.stamp}{/if}</span>
        </div>
        {#if kabView.k.ibukota}<p class="lw-kab-ibukota mono">ibukota · <b>{kabView.k.ibukota}</b></p>{/if}

        <div class="lw-kab-meters">
          {#if kabView.popShare != null}
            <div class="lw-kab-meter">
              <span class="lw-kab-m-k mono">PENDUDUK</span>
              <span class="lw-kab-m-v num">{fmtN(kabView.k.pop!)} jiwa</span>
              <div class="lw-kab-track"><span class="lw-kab-fill" style={`--p:${kabView.popShare.toFixed(1)}%`}></span></div>
              <span class="lw-kab-m-share mono">{fmtN(kabView.popShare, 1)}% penduduk provinsi{#if kabView.k.rankPop} · terbanyak ke-{kabView.k.rankPop} dari {kabView.k.nKab}{/if}</span>
            </div>
          {/if}
          {#if kabView.luasShare != null}
            <div class="lw-kab-meter">
              <span class="lw-kab-m-k mono">LUAS</span>
              <span class="lw-kab-m-v num">{fmtN(kabView.k.luas!)} km²</span>
              <div class="lw-kab-track"><span class="lw-kab-fill luas" style={`--p:${kabView.luasShare.toFixed(1)}%`}></span></div>
              <span class="lw-kab-m-share mono">{fmtN(kabView.luasShare, 1)}% wilayah provinsi</span>
            </div>
          {/if}
        </div>

        {#if kabView.kepadatan != null}
          <p class="lw-kab-foot mono">kepadatan <b>{fmtN(kabView.kepadatan)}</b> jiwa/km²{#if kabView.k.rankPad} · terpadat ke-{kabView.k.rankPad} dari {kabView.k.nKab} kabupaten{/if}</p>
        {/if}

        {#if kartotekKab && apbd}
          <div class="lw-apbd kab">
            <div class="lw-apbd-head">
              <span class="lw-apbd-t mono">KARTOTEK APBD · REALISASI {apbd.tahun}</span>
              <span class="lw-apbd-s mono">PEMERINTAH KAB/KOTA · DJPK KEMENKEU · PERINGKAT DARI {apbd.nKab} PEMDA</span>
            </div>
            {#each kartotekKab as r (r.k)}
              <div class="ld-row">
                <div class="ld-row-l">
                  <span class="ld-label">{r.k}</span>
                  {#if r.rank}<span class="ld-rank-chip mono" class:buruk={r.buruk} class:baik={r.baik}>ke-{r.rank}/{r.n}</span>{/if}
                </div>
                <div class="ld-row-r">
                  <span class="ld-val num" class:buruk={r.buruk} class:baik={r.baik}>{r.val}</span>
                  <span class="ld-delta mono">nasional {r.nas}</span>
                </div>
                {#if r.p != null}
                  <div class="ld-track">
                    <span class="ld-end mono kiri">{r.ujung[0]}</span>
                    <span class="ld-end mono kanan">{r.ujung[1]}</span>
                    <span class="ld-mark" class:buruk={r.buruk} class:baik={r.baik} style={`left:${(r.p * 100).toFixed(1)}%`}></span>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
        <p class="lw-kab-note mono">Angka BPS lanjutan (IPM, kemiskinan, PDRB) menyusul saat kunci terpasang.</p>
      </aside>
    {/key}
  {/if}

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
    <button class="chip"><span class="tick">⊙</span>{apbd ? `bps (contoh) · djpk ${apbd.tahun} realisasi` : 'bps · djpk · (data contoh)'}</button>
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

  /* ── the regency filing (P0.4): the clicked kabupaten, nested in its province ──
     subordinate to the province hero by type scale; the share meters are the signature */
  .lw-kab { margin: 0 0 30px; padding: 14px 0 16px 16px; border-left: 2px solid var(--accent); border-top: 1px solid var(--line-soft); position: relative; }
  @media (prefers-reduced-motion: no-preference) { .lw-kab { animation: lwIn 0.45s var(--ease-out); } }
  .lw-kab-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
  .lw-kab-crumb { font-size: 8.5px; letter-spacing: 0.18em; color: var(--accent); }
  .lw-kab-x { background: none; border: none; color: var(--muted); cursor: pointer; font-size: 8.5px; letter-spacing: 0.14em; padding: 0; white-space: nowrap; }
  .lw-kab-x:hover { color: var(--accent); }
  .lw-kab-id { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin: 6px 0 1px; }
  .lw-kab-nama { font-family: 'Fraunces Variable', serif; font-weight: 380; font-size: clamp(24px, 3.4vw, 40px); line-height: 1; letter-spacing: -0.01em; }
  .lw-kab-stamp { font-size: 9px; letter-spacing: 0.1em; color: var(--muted); white-space: nowrap; }
  .lw-kab-ibukota { font-size: 10px; letter-spacing: 0.04em; color: var(--muted); margin: 2px 0 16px; }
  .lw-kab-ibukota b { color: var(--ink); }
  .lw-kab-meters { display: grid; grid-template-columns: 1fr 1fr; gap: 18px 28px; max-width: 620px; }
  @media (max-width: 560px) { .lw-kab-meters { grid-template-columns: 1fr; } }
  .lw-kab-meter { display: grid; gap: 4px; align-content: start; }
  .lw-kab-m-k { font-size: 8px; letter-spacing: 0.16em; color: var(--muted); }
  .lw-kab-m-v { font-family: 'Fraunces Variable', serif; font-weight: 400; font-size: clamp(19px, 2.4vw, 26px); line-height: 1; }
  .lw-kab-track { position: relative; height: 5px; background: var(--line-soft); margin-top: 4px; overflow: hidden; box-shadow: inset 0 1px 0 color-mix(in oklab, var(--ink) 14%, transparent); }
  .lw-kab-fill { position: absolute; left: 0; top: 0; bottom: 0; width: var(--p); background: var(--accent); transform: scaleX(0); transform-origin: left; }
  .lw-kab-fill.luas { background: color-mix(in oklab, var(--accent) 52%, var(--ink)); }
  .lw-kab.in .lw-kab-fill { transform: scaleX(1); transition: transform 0.7s var(--ease-out); }
  .lw-kab-m-share { font-size: 8.5px; letter-spacing: 0.06em; color: var(--muted); }
  .lw-kab-foot { font-size: 9.5px; letter-spacing: 0.06em; color: var(--muted); margin-top: 14px; border-top: 1px solid var(--line-soft); padding-top: 9px; }
  .lw-kab-foot b { color: var(--ink); font-weight: 600; }
  .lw-kab-note { font-size: 8.5px; letter-spacing: 0.04em; color: var(--muted); opacity: 0.7; font-style: italic; margin-top: 5px; }

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
  /* KARTOTEK APBD: a filed plate (the instrument-room corner marks) whose rows
     speak the spread's ld-* grammar — one drawing language for both */
  .lw-apbd { position: relative; margin-top: 22px; border: 1px solid var(--line); padding: 14px 16px 22px; display: grid; gap: 18px; }
  .lw-apbd::before, .lw-apbd::after { content: '+'; position: absolute; font-family: var(--font-mono); font-size: 11px; line-height: 1; color: var(--muted); }
  .lw-apbd::before { top: 0; left: 0; transform: translate(-50%, -50%); }
  .lw-apbd::after { bottom: 0; right: 0; transform: translate(50%, 50%); }
  .lw-apbd-head { display: flex; justify-content: space-between; align-items: baseline; gap: 8px 14px; flex-wrap: wrap; }
  .lw-apbd-t { font-size: 9px; letter-spacing: 0.16em; color: var(--ink); }
  .lw-apbd-s { font-size: 8px; letter-spacing: 0.12em; color: var(--muted); }
  .lw-apbd.kab { background: color-mix(in oklab, var(--bg) 94%, transparent); }

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
