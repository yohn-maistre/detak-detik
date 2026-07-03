<script lang="ts">
  /**
   * Zona Hayati (§13.17 B.5): the Wallace (1859) and Weber (1904) lines
   * stop being decoration and become the CONTROL. The archipelago is drawn
   * from the shared province raster, its dots inked by which of the three
   * biogeographic realms each province sits in — Paparan Sunda (corak
   * Asia), Wallacea (peralihan), Paparan Sahul (corak Australasia). Click a
   * realm (on the map or its tab) and the species column swaps to that
   * side's endemic ledger, sorted by extinction risk, with the day's
   * showcase. Absorbs the old Daftar Merah: same registry
   * (newsroom/data/atlas/hayati.json, refreshed by refresh-hayati.py),
   * same risk sort, same honest NE footnote. Opens on the realm the day's
   * WAJAH profile lives in, so the atlas reads as one place.
   */
  import { onMount } from 'svelte';
  import { loadAtlasGrid, LON0, LON1, type AtlasGrid } from '../lib/atlas-dots';
  import { hayatiHari, zonaHari } from '../lib/atlas-hari';
  import HAYATI from '../../newsroom/data/atlas/hayati.json';

  type Zona = 'sunda' | 'wallacea' | 'sahul';
  const ZONA: { id: Zona; nama: string; corak: string }[] = [
    { id: 'sunda', nama: 'Paparan Sunda', corak: 'corak Asia' },
    { id: 'wallacea', nama: 'Wallacea', corak: 'zona peralihan' },
    { id: 'sahul', nama: 'Paparan Sahul', corak: 'corak Australasia' },
  ];
  // province kode → realm (Wallace line: Bali|Lombok & Kalimantan|Sulawesi;
  // Weber line: Maluku|Papua). Curated, not longitude-guessed.
  const ZONA_PROV: Record<string, Zona> = {};
  '11 12 13 14 15 16 17 18 19 21 31 32 33 34 35 36 51 61 62 63 64 65'.split(' ').forEach((k) => (ZONA_PROV[k] = 'sunda'));
  '52 53 71 72 73 74 75 76 81 82'.split(' ').forEach((k) => (ZONA_PROV[k] = 'wallacea'));
  '91 92 93 94 95 96'.split(' ').forEach((k) => (ZONA_PROV[k] = 'sahul'));

  const URUT: Record<string, number> = { CR: 0, EN: 1, VU: 2, NT: 3, NE: 4 };
  const byZona = (z: Zona) =>
    HAYATI.filter((r) => (r as { zona?: Zona }).zona === z).sort(
      (a, b) => (URUT[a.status.kode] ?? 9) - (URUT[b.status.kode] ?? 9) || a.nama.localeCompare(b.nama),
    );

  let aktif = $state<Zona>(zonaHari);
  const daftar = $derived(byZona(aktif));
  // the showcase: the day's species if it belongs to this realm, else the
  // most-threatened one here
  const sorot = $derived(
    (hayatiHari as { zona?: Zona }).zona === aktif ? hayatiHari : (daftar[0] ?? hayatiHari),
  );
  let img = $state('');
  $effect(() => { img = sorot?.gambar?.url ?? ''; });

  const tally = $derived(
    Object.entries(
      daftar.reduce<Record<string, number>>((m, r) => ((m[r.status.kode] = (m[r.status.kode] ?? 0) + 1), m), {}),
    ).sort((a, b) => (URUT[a[0]] ?? 9) - (URUT[b[0]] ?? 9)),
  );
  const jumlah = (z: Zona) => HAYATI.filter((r) => (r as { zona?: Zona }).zona === z).length;

  // ── the map ──────────────────────────────────────────────
  let cv: HTMLCanvasElement | undefined = $state();
  let wrap: HTMLElement | undefined = $state();
  let grid: AtlasGrid | null = null;
  const COLS = 150, ROWS = 58;
  // Wallace ~117.5°, Weber ~129.5°: normalized x on the plate
  const lineX = (lon: number) => ((lon - LON0) / (LON1 - LON0)) * 100;

  function zonaCss(z: Zona, css: CSSStyleDeclaration) {
    if (z === 'sunda') return css.getPropertyValue('--ink').trim();
    if (z === 'wallacea') return css.getPropertyValue('--accent').trim();
    return css.getPropertyValue('--accent2').trim();
  }

  function draw() {
    if (!cv || !grid || !wrap) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const css = getComputedStyle(wrap);
    const soft = css.getPropertyValue('--line-soft').trim();
    const w = cv.clientWidth, h = cv.clientHeight;
    const dpr = Math.min(window.devicePixelRatio ?? 1, 1.75);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const scale = Math.min((w * 0.98) / COLS, (h * 0.98) / ROWS);
    const ox = (w - COLS * scale) / 2, oy = (h - ROWS * scale) / 2;
    const dot = Math.max(1.1, scale * 0.4);
    const col: Record<Zona, string> = {
      sunda: zonaCss('sunda', css), wallacea: zonaCss('wallacea', css), sahul: zonaCss('sahul', css),
    };
    for (let gy = 0; gy < ROWS; gy++) {
      for (let gx = 0; gx < COLS; gx++) {
        const p = grid.cells[gy * COLS + gx]!;
        if (!p) continue;
        const kode = grid.provs[p - 1]?.kode ?? '';
        const z = ZONA_PROV[kode] ?? 'sunda';
        ctx.fillStyle = col[z];
        ctx.globalAlpha = z === aktif ? 0.95 : 0.28;
        ctx.fillRect(ox + gx * scale + (scale - dot) / 2, oy + gy * scale + (scale - dot) / 2, dot, dot);
      }
    }
    ctx.globalAlpha = 1;
    // the two lines, dashed, over the field
    ctx.strokeStyle = soft; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
    for (const lon of [117.5, 129.5]) {
      const x = ox + (lineX(lon) / 100) * COLS * scale;
      ctx.beginPath(); ctx.moveTo(x, oy); ctx.lineTo(x, oy + ROWS * scale); ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  function cellZona(e: MouseEvent): Zona | null {
    if (!cv || !grid) return null;
    const r = cv.getBoundingClientRect();
    const scale = Math.min((r.width * 0.98) / COLS, (r.height * 0.98) / ROWS);
    const ox = (r.width - COLS * scale) / 2, oy = (r.height - ROWS * scale) / 2;
    const gx = Math.floor((e.clientX - r.left - ox) / scale);
    const gy = Math.floor((e.clientY - r.top - oy) / scale);
    if (gx < 0 || gy < 0 || gx >= COLS || gy >= ROWS) return null;
    const p = grid.cells[gy * COLS + gx] ?? 0;
    if (!p) return null;
    return ZONA_PROV[grid.provs[p - 1]?.kode ?? ''] ?? null;
  }

  onMount(() => {
    let dead = false;
    void loadAtlasGrid(COLS, ROWS).then((g) => { if (!dead) { grid = g; draw(); } }).catch(() => {});
    const ro = new ResizeObserver(draw);
    if (wrap) ro.observe(wrap);
    return () => { dead = true; ro.disconnect(); };
  });
  $effect(() => { void aktif; draw(); });

  const pilih = (z: Zona) => { aktif = z; };
</script>

<section class="zh" bind:this={wrap} data-no-stempel data-ref="zona-hayati">
  <div class="zh-map-wrap">
    <canvas
      bind:this={cv}
      class="zh-map"
      role="img"
      aria-label="Kepulauan dibagi tiga zona biogeografi oleh garis Wallace dan Weber; ketuk sebuah zona untuk membuka satwanya"
      onclick={(e) => { const z = cellZona(e); if (z) pilih(z); }}
    ></canvas>
    <p class="zh-map-cap mono">⊙ GARIS WALLACE (1859) &amp; WEBER (1904) · KETUK SEBUAH ZONA</p>
  </div>

  <nav class="zh-tabs" aria-label="Zona biogeografi">
    {#each ZONA as z (z.id)}
      <button class="zh-tab" class:on={aktif === z.id} data-z={z.id} onclick={() => pilih(z.id)}>
        <span class="zh-tab-n display">{z.nama}</span>
        <span class="zh-tab-c mono">{z.corak} · {jumlah(z.id)} spesies</span>
      </button>
    {/each}
  </nav>

  <div class="zh-body">
    <!-- the showcase for this realm -->
    <figure class="zh-sorot">
      <div class="zh-sorot-img">
        {#if img}
          <img src={img} alt={sorot.nama} loading="lazy" onerror={() => (img = '')} />
        {:else}
          <div class="zh-sorot-plat mono">PLAT · {sorot?.nama?.toUpperCase()}</div>
        {/if}
      </div>
      <figcaption class="zh-sorot-cap">
        <span class="zh-badge mono" data-k={sorot?.status.kode}>{sorot?.status.kode}</span>
        <b class="zh-sorot-nama">{sorot?.nama}</b>
        <i class="zh-sorot-ilmiah">{sorot?.ilmiah}</i>
        <span class="zh-sorot-wil mono">{sorot?.wilayah}</span>
      </figcaption>
    </figure>

    <!-- the realm's ledger, risk-sorted -->
    <div class="zh-list">
      <div class="zh-list-head">
        <span class="eyebrow">{ZONA.find((z) => z.id === aktif)?.nama.toUpperCase()} · {daftar.length} SPESIES ENDEMIK &amp; IKON</span>
        <span class="zh-tally mono">
          {#each tally as [k, n] (k)}<span class="zh-t" data-k={k}>{n} {k}</span>{/each}
        </span>
      </div>
      {#if daftar.length}
        <ol class="zh-rows">
          {#each daftar as r (r.id)}
            <li class="zh-row" class:sorot={r.id === sorot?.id}>
              <span class="zh-badge sm mono" data-k={r.status.kode}>{r.status.kode}</span>
              <span class="zh-row-nama">{r.nama}</span>
              <i class="zh-row-ilmiah">{r.ilmiah}</i>
            </li>
          {/each}
        </ol>
      {:else}
        <p class="zh-kosong mono">Belum ada spesies tercatat di sisi ini pada edisi ini.</p>
      {/if}
      <p class="zh-foot mono">URUTAN RISIKO IUCN: CR KRITIS · EN GENTING · VU RENTAN · NT HAMPIR TERANCAM · NE BELUM DINILAI (IUCN memang belum menilainya, dicetak apa adanya). ⊙ gbif + iucn red list · id.wikipedia</p>
    </div>
  </div>
</section>

<style>
  .zh { display: grid; gap: 16px; }
  .zh-map-wrap { display: grid; gap: 7px; }
  .zh-map { width: 100%; height: clamp(140px, 26vw, 240px); display: block; cursor: pointer; border-top: 1px solid var(--line-soft); border-bottom: 1px solid var(--line-soft); }
  .zh-map-cap { font-size: 8px; letter-spacing: 0.14em; color: var(--muted); }

  .zh-tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; border: 1px solid var(--line); }
  @media (max-width: 620px) { .zh-tabs { grid-template-columns: 1fr; } }
  .zh-tab { text-align: left; background: none; border: none; border-right: 1px solid var(--line); padding: 12px 14px; cursor: pointer; display: grid; gap: 3px; transition: background 0.2s; }
  .zh-tab:last-child { border-right: none; }
  @media (max-width: 620px) { .zh-tab { border-right: none; border-bottom: 1px solid var(--line); } .zh-tab:last-child { border-bottom: none; } }
  .zh-tab:hover { background: color-mix(in oklab, var(--accent) 5%, transparent); }
  .zh-tab.on { background: color-mix(in oklab, var(--accent) 11%, transparent); }
  .zh-tab.on[data-z="sunda"] { box-shadow: inset 0 -3px 0 var(--ink); }
  .zh-tab.on[data-z="wallacea"] { box-shadow: inset 0 -3px 0 var(--accent); }
  .zh-tab.on[data-z="sahul"] { box-shadow: inset 0 -3px 0 var(--accent2); }
  .zh-tab-n { font-family: 'Fraunces Variable', serif; font-weight: 340; font-size: clamp(16px, 2vw, 22px); color: var(--ink); }
  .zh-tab-c { font-size: 8.5px; letter-spacing: 0.1em; color: var(--muted); }

  .zh-body { display: grid; grid-template-columns: 0.9fr 1.1fr; gap: clamp(18px, 3.5vw, 40px); align-items: start; }
  @media (max-width: 760px) { .zh-body { grid-template-columns: 1fr; } }
  .zh-sorot { margin: 0; display: grid; gap: 8px; }
  .zh-sorot-img { aspect-ratio: 4 / 3; overflow: hidden; border: 1px solid var(--line); background: #ece1c9; }
  .zh-sorot-img img { width: 100%; height: 100%; object-fit: cover; display: block; filter: saturate(0.95); }
  .zh-sorot-plat { width: 100%; height: 100%; display: grid; place-items: center; font-size: 9px; letter-spacing: 0.16em; color: var(--muted); }
  .zh-sorot-cap { display: grid; gap: 3px; }
  .zh-sorot-nama { font-size: 15px; color: var(--ink); }
  .zh-sorot-ilmiah { font-family: var(--font-fig); font-style: italic; font-size: 12.5px; color: var(--muted); }
  .zh-sorot-wil { font-size: 8.5px; letter-spacing: 0.08em; color: var(--muted); }

  .zh-badge { display: inline-block; font-size: 9px; font-weight: 700; letter-spacing: 0.08em; padding: 2px 6px; color: var(--bg); background: var(--muted); width: fit-content; }
  .zh-badge[data-k="CR"] { background: var(--accent); }
  .zh-badge[data-k="EN"] { background: color-mix(in oklab, var(--accent) 78%, var(--ink)); }
  .zh-badge[data-k="VU"] { background: color-mix(in oklab, var(--accent) 52%, var(--muted)); }
  .zh-badge[data-k="NT"] { background: var(--muted); }
  .zh-badge[data-k="NE"] { background: none; color: var(--muted); border: 1px dashed var(--line); }
  .zh-badge.sm { font-size: 8px; padding: 1px 4px; }

  .zh-list { display: grid; gap: 10px; }
  .zh-list-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; flex-wrap: wrap; }
  .zh-tally { display: flex; gap: 8px; font-size: 9px; }
  .zh-t { color: var(--muted); }
  .zh-t[data-k="CR"], .zh-t[data-k="EN"] { color: var(--accent); }
  .zh-rows { list-style: none; margin: 0; padding: 0; display: grid; }
  .zh-row { display: grid; grid-template-columns: 30px 1fr auto; gap: 10px; align-items: baseline; padding: 6px 0; border-bottom: 1px solid var(--line-soft); }
  .zh-row.sorot { background: color-mix(in oklab, var(--accent) 6%, transparent); }
  .zh-row-nama { font-size: 13.5px; color: var(--ink); }
  .zh-row-ilmiah { font-family: var(--font-fig); font-style: italic; font-size: 11px; color: var(--muted); text-align: right; }
  @media (max-width: 480px) { .zh-row-ilmiah { display: none; } }
  .zh-kosong { font-size: 10px; letter-spacing: 0.08em; color: var(--muted); padding: 10px 0; }
  .zh-foot { font-size: 8px; letter-spacing: 0.06em; line-height: 1.7; color: var(--muted); border-top: 1px solid var(--line-soft); padding-top: 8px; }
</style>
