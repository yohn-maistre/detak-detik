<script lang="ts">
  /** AGENDA ISTANA: the executive's own published record, three plates.
      1 BUKU AGENDA  — the ledger: newest rows, each citing its Setkab URL.
      2 JEJAK KEHADIRAN — the locator plate: 90 days of located events on
        the dot archipelago (markers at province level, computed from the
        plate's own raster so drawing and data cannot disagree).
      3 IRAMA & PERIHAL — composition: thin bars per event type + top topics.
      Data: newsroom/data/agenda_istana.json, grown twice daily by the
      keyless setkab harvest (sources/agenda.py). Regime-agnostic: the rows
      describe the OFFICE. Staleness prints as an absence, never as fresh. */
  import { onMount } from 'svelte';
  import { reducedMotion } from '../lib/motion';
  import { loadAtlasGrid, type AtlasGrid } from '../lib/atlas-dots';
  import ARSIP from '../../newsroom/data/agenda_istana.json';

  type Acara = {
    id: string; url: string; judul: string; aktor: string; jenis: string;
    tanggal_acara: string; tanggal_terbit: string; audiens?: string | null;
    topik: string[]; venue?: string | null; kota?: string | null;
    prov?: string | null; prov_nama?: string | null;
  };

  const SEMUA = (ARSIP.acara ?? []) as Acara[];
  const PRES = SEMUA.filter((a) => a.aktor === 'PRESIDEN');
  const DIAMBIL = ARSIP.diambil ?? '';

  // honesty gate: a harvest older than 14 days prints as an absence
  const basi = !PRES.length || (Date.now() - Date.parse(DIAMBIL || '0')) / 864e5 > 14;

  // window honesty: never claim more history than the archive holds — a
  // young archive labels itself by its true span, growing into 90 days
  const tglTertua = PRES.length ? [...PRES].map((a) => a.tanggal_acara).sort()[0]! : '';
  const H90 = Math.max(Date.now() - 90 * 864e5, Date.parse(tglTertua || '0'));
  const hariJendela = Math.min(90, Math.max(1, Math.round((Date.now() - H90) / 864e5)));
  const labelJendela = hariJendela >= 89 ? '90 HARI' : `ARSIP ${hariJendela} HARI`;
  const jendela = PRES.filter((a) => Date.parse(a.tanggal_acara) >= H90);
  const terletak = jendela.filter((a) => a.prov);
  const diJakarta = terletak.filter((a) => a.prov === '31');
  const provKe = new Map<string, number>();
  for (const a of terletak) provKe.set(a.prov!, (provKe.get(a.prov!) ?? 0) + 1);
  const tanpaLokasi = jendela.length - terletak.length;

  const buku = PRES.slice(0, 10);

  const tally = (ambil: (a: Acara) => string[]) => {
    const m = new Map<string, number>();
    for (const a of jendela) for (const k of ambil(a)) m.set(k, (m.get(k) ?? 0) + 1);
    return [...m.entries()].sort((x, y) => y[1] - x[1]);
  };
  const perJenis = tally((a) => [a.jenis]);
  const jenisMaks = perJenis[0]?.[1] ?? 1;
  const perTopik = tally((a) => a.topik).slice(0, 6);

  const fmtTgl = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' });
  const tgl = (iso: string) => fmtTgl.format(new Date(iso)).toUpperCase().replace('.', '');
  const panen = DIAMBIL ? fmtTgl.format(new Date(DIAMBIL)).toUpperCase().replace('.', '') : '—';

  // ── the locator plate (multi-marker generalization of SukuLokasi) ──
  let el: HTMLCanvasElement | undefined = $state();
  const COLS = 94, ROWS = 36;
  let grid: AtlasGrid | null = null;

  function draw() {
    if (!el || !grid) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    const css = getComputedStyle(el);
    const ink = css.getPropertyValue('--ink').trim();
    const accent2 = css.getPropertyValue('--accent2').trim();
    const soft = css.getPropertyValue('--line-soft').trim();

    const w = el.clientWidth, h = el.clientHeight;
    const dpr = Math.min(window.devicePixelRatio ?? 1, 1.75);
    el.width = Math.round(w * dpr);
    el.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const scale = Math.min((w * 0.94) / COLS, (h * 0.94) / ROWS);
    const ox = (w - COLS * scale) / 2;
    const oy = (h - ROWS * scale) / 2;

    // province centroids from the raster itself: the markers sit on the
    // plate's own geometry, so data and drawing cannot disagree
    const idxByKode = new Map<string, number>();
    grid.provs.forEach((p, i) => idxByKode.set(p.kode, i + 1));
    const sum = new Map<number, [number, number, number]>();
    for (let gy = 0; gy < ROWS; gy++) {
      for (let gx = 0; gx < COLS; gx++) {
        const p = grid.cells[gy * COLS + gx]!;
        if (!p) continue;
        const s = sum.get(p) ?? [0, 0, 0];
        s[0] += gx; s[1] += gy; s[2] += 1;
        sum.set(p, s);
      }
    }
    const visited = new Set(
      [...provKe.keys()].map((k) => idxByKode.get(k) ?? 0).filter(Boolean),
    );

    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = soft;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(ox, oy, COLS * scale, ROWS * scale);

    const dot = Math.max(1, scale * 0.42);
    for (let gy = 0; gy < ROWS; gy++) {
      for (let gx = 0; gx < COLS; gx++) {
        const p = grid.cells[gy * COLS + gx]!;
        if (!p) continue;
        ctx.fillStyle = ink;
        ctx.globalAlpha = visited.has(p) ? 0.85 : 0.28;
        ctx.fillRect(ox + gx * scale + (scale - dot) / 2, oy + gy * scale + (scale - dot) / 2, dot, dot);
      }
    }
    ctx.globalAlpha = 1;

    // one seal per visited province; ring size carries the count
    ctx.strokeStyle = accent2;
    ctx.fillStyle = accent2;
    for (const [kode, n] of provKe) {
      const pi = idxByKode.get(kode);
      const s = pi ? sum.get(pi) : undefined;
      if (!s || !s[2]) continue;
      const px = ox + (s[0] / s[2]) * scale;
      const py = oy + (s[1] / s[2]) * scale;
      const r = 4 + Math.min(9, Math.sqrt(n) * 2.6);
      ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(px, py, r + 5, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(px, py, 1.6, 0, Math.PI * 2); ctx.fill();
    }
  }

  let root: HTMLElement | undefined = $state();
  onMount(() => {
    if (!basi) {
      void loadAtlasGrid(COLS, ROWS).then((g) => { grid = g; draw(); })
        .catch(() => { /* plate stays quiet; the caption still counts */ });
      const ro = new ResizeObserver(draw);
      if (el) ro.observe(el);
      const io = new IntersectionObserver(([e]) => {
        if (e?.isIntersecting) { root?.classList.add('in'); io.disconnect(); }
      }, { threshold: 0.25 });
      if (root) io.observe(root);
      if (reducedMotion()) root?.classList.add('in');
      return () => { ro.disconnect(); io.disconnect(); };
    }
  });
</script>

<section class="ai" data-no-stempel bind:this={root}>
  {#if basi}
    <!-- absence over staleness: an archive that stopped says so -->
    <div class="ai-absen">
      <span class="eyebrow">AGENDA ISTANA · ARSIP TERHENTI</span>
      <p class="ai-absen-teks fig">Panen terakhir {panen === '—' ? 'tidak tercatat' : panen}; setkab.go.id tak terjangkau sejak itu. Halaman ini tidak mencetak arsip basi sebagai kabar segar.</p>
    </div>
  {:else}
    <div class="ai-grid">
      <figure class="ai-buku">
        <figcaption class="eyebrow">BUKU AGENDA · {buku.length} TERBARU DARI {PRES.length} TERCATAT</figcaption>
        <div class="ai-rows">
          {#each buku as a, i (a.id)}
            <a class="ai-row" href={a.url} target="_blank" rel="noopener">
              <span class="ai-no ghost-num num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <span class="ai-tgl mono num">{tgl(a.tanggal_acara)}</span>
              <span class="ai-isi">
                <span class="ai-jenis mono">{a.jenis}</span>
                <span class="ai-judul">{a.judul}</span>
                {#if a.kota || a.prov_nama}
                  <span class="ai-tempat mono">⌖ {[a.kota, a.prov_nama].filter(Boolean).join(' · ')}</span>
                {/if}
              </span>
              <span class="ai-tick mono" aria-hidden="true">⊙</span>
            </a>
          {/each}
        </div>
      </figure>

      <div class="ai-samping">
        <figure class="ai-peta">
          <figcaption class="eyebrow">JEJAK KEHADIRAN · {labelJendela}</figcaption>
          <canvas bind:this={el} aria-label={`Peta kehadiran presiden: ${terletak.length} acara berlokasi, ${labelJendela.toLowerCase()}`}></canvas>
          <p class="ai-caption mono">
            {diJakarta.length} DARI {terletak.length} ACARA BERLOKASI DI JAKARTA ·
            {provKe.size} PROVINSI DISINGGAHI{tanpaLokasi ? ` · ${tanpaLokasi} TANPA LOKASI TERURAI` : ''}
          </p>
        </figure>

        <figure class="ai-irama">
          <figcaption class="eyebrow">IRAMA &amp; PERIHAL · {labelJendela}</figcaption>
          <div class="ai-bars">
            {#each perJenis as [jenis, n] (jenis)}
              <div class="ai-bar-row">
                <span class="ai-bar-k mono">{jenis}</span>
                <span class="ai-bar-track"><i class="ai-bar" style={`--w:${(n / jenisMaks) * 100}%`}></i></span>
                <span class="ai-bar-n mono num">{n}</span>
              </div>
            {/each}
          </div>
          {#if perTopik.length}
            <p class="ai-topik mono">PERIHAL TERSERING: {perTopik.map(([t, n]) => `${t.toUpperCase()} ${n}`).join(' · ')}</p>
          {/if}
        </figure>
      </div>
    </div>
    <p class="ai-src mono">⊙ setkab.go.id · arsip {SEMUA.length} acara · panen {panen} · deterministik, tanpa model — setiap baris tertaut terbitan resminya</p>
  {/if}
</section>

<style>
  .ai { display: grid; gap: 14px; border-top: 1px solid var(--line); padding-top: 16px; }
  .ai-grid { display: grid; grid-template-columns: 1.35fr 1fr; gap: clamp(18px, 3.5vw, 40px); align-items: start; }
  @media (max-width: 820px) { .ai-grid { grid-template-columns: 1fr; } }
  figure { margin: 0; display: grid; gap: 10px; }

  /* the ledger: ruled rows, no boxes */
  .ai-rows { display: grid; }
  .ai-row {
    display: grid; grid-template-columns: auto auto 1fr auto; gap: 12px;
    align-items: baseline; padding: 9px 0; text-decoration: none; color: inherit;
    border-bottom: 1px solid var(--line-soft);
  }
  .ai-row:hover .ai-judul { text-decoration: underline; text-underline-offset: 3px; }
  .ai-no { font-size: 20px; opacity: 0.22; }
  .ai-tgl { font-size: 9.5px; letter-spacing: 0.1em; color: var(--muted); white-space: nowrap; }
  .ai-isi { display: grid; gap: 3px; }
  .ai-jenis { font-size: 8.5px; letter-spacing: 0.16em; color: var(--accent2); }
  .ai-judul { font-size: 13.5px; line-height: 1.45; }
  .ai-tempat { font-size: 9px; letter-spacing: 0.08em; color: var(--muted); }
  .ai-tick { color: var(--muted); font-size: 11px; }

  .ai-samping { display: grid; gap: 22px; }
  .ai-peta canvas { width: 100%; height: clamp(140px, 20vh, 190px); display: block; border-top: 1px solid var(--line-soft); border-bottom: 1px solid var(--line-soft); }
  .ai-caption, .ai-topik { font-size: 8.5px; letter-spacing: 0.12em; color: var(--muted); line-height: 1.8; }

  /* one motion: the bars draw (IO adds .in on the section) */
  .ai-bars { display: grid; gap: 7px; }
  .ai-bar-row { display: grid; grid-template-columns: minmax(84px, auto) 1fr auto; gap: 10px; align-items: center; }
  .ai-bar-k { font-size: 8.5px; letter-spacing: 0.12em; color: var(--muted); }
  .ai-bar-track { position: relative; height: 8px; border-left: 1px solid var(--line); }
  .ai-bar { position: absolute; inset: 1px auto 1px 0; width: 0; background: var(--ink); opacity: 0.75; transition: width 0.7s cubic-bezier(0.22, 1, 0.36, 1); }
  :global(.ai.in) .ai-bar { width: var(--w); }
  .ai-bar-n { font-size: 9.5px; color: var(--muted); }
  @media (prefers-reduced-motion: reduce) { .ai-bar { transition: none; width: var(--w); } }

  .ai-src { font-size: 8.5px; letter-spacing: 0.1em; color: var(--muted); }

  .ai-absen { display: grid; gap: 8px; border-top: 1px solid var(--line); padding-top: 14px; }
  .ai-absen-teks { font-size: 13px; color: var(--muted); }
</style>
