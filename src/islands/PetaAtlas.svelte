<script lang="ts">
  /**
   * Peta Atlas: the Act III opening plate. The archipelago rendered as an
   * engraved dot-grid from the real BIG Rupabumi province polygons
   * (public/data/idn-prov.geojson), so the coastline is accurate, not
   * decorative. Each dot knows its province: hover names it, a tap files it
   * into the Lensa Wilayah through the same command bus every click speaks.
   * Rasterization lives in lib/atlas-dots.ts (shared with ZonaHayati and
   * SukuLokasi): per-feature coverage passes, so a cell always names the
   * province that actually covers it. No point-in-polygon math at runtime.
   */
  import { onMount } from 'svelte';
  import { dispatch } from '../lib/commands/dispatcher';
  import { onLensa, getDaerah } from '../lib/lensa';
  import { drawEngraving, ENGRAVE_ATLAS } from '../lib/engrave';
  import { loadAtlasGrid, LON0, LON1, LAT0, LAT1 } from '../lib/atlas-dots';

  const COLS = 188, ROWS = 72;

  let cv: HTMLCanvasElement | undefined = $state();
  let wrapEl: HTMLElement | undefined = $state();
  let kaki = $state('ketuk sebuah provinsi untuk membukanya di Lensa Wilayah');
  let diLaut = $state(true);

  type Prov = { kode: string; nama: string };

  onMount(() => {
    if (!cv || !wrapEl) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    let provs: Prov[] = [];
    let grid: Uint8Array | null = null; // cell -> province index + 1, 0 = sea
    let hover = 0;
    let aktif = 0;
    let sweep = reduced ? 1 : 0;
    let raf = 0;
    let dead = false;

    const css = getComputedStyle(wrapEl);
    const ink = css.getPropertyValue('--ink').trim();
    const accent = css.getPropertyValue('--accent').trim();
    const accent2 = css.getPropertyValue('--accent2').trim();
    const soft = css.getPropertyValue('--line-soft').trim();

    function ukur() {
      const w = wrapEl!.clientWidth;
      const h = Math.round((w * (ROWS + 6)) / COLS);
      const dpr = Math.min(window.devicePixelRatio ?? 1, 1.75);
      cv!.width = Math.round(w * dpr);
      cv!.height = Math.round(h * dpr);
      cv!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w, h };
    }

    function gambar() {
      if (dead || !grid) return;
      const dpr = Math.min(window.devicePixelRatio ?? 1, 1.75);
      const w = cv!.width / dpr;
      const h = cv!.height / dpr;
      const pit = w / COLS;
      const padY = 3 * pit;
      ctx!.clearRect(0, 0, w, h);

      // graticule: a hairline every 5 degrees, the atlas furniture
      ctx!.strokeStyle = soft;
      ctx!.lineWidth = 0.5;
      for (let lon = 95; lon <= 140; lon += 5) {
        const x = ((lon - LON0) / (LON1 - LON0)) * w;
        ctx!.beginPath(); ctx!.moveTo(x, padY * 0.4); ctx!.lineTo(x, h - padY * 0.4); ctx!.stroke();
      }
      for (let lat = 5; lat >= -10; lat -= 5) {
        const y = padY + ((LAT0 - lat) / (LAT0 - LAT1)) * (h - 2 * padY);
        ctx!.beginPath(); ctx!.moveTo(0, y); ctx!.lineTo(w, y); ctx!.stroke();
      }

      // the land, one engraved dot per cell that touches a province
      const dot = Math.max(1.1, pit * 0.34);
      const maxCol = Math.ceil(COLS * sweep);
      for (let gy = 0; gy < ROWS; gy++) {
        for (let gx = 0; gx < maxCol; gx++) {
          const p = grid[gy * COLS + gx]!;
          if (!p) continue;
          const x = gx * pit + pit / 2;
          const y = padY + (gy / ROWS) * (h - 2 * padY);
          if (p === hover) { ctx!.fillStyle = accent; ctx!.globalAlpha = 0.95; }
          else if (p === aktif) { ctx!.fillStyle = accent2; ctx!.globalAlpha = 0.95; }
          else { ctx!.fillStyle = ink; ctx!.globalAlpha = 0.5; }
          ctx!.fillRect(x - dot / 2, y - dot / 2, dot, dot);
        }
      }
      ctx!.globalAlpha = 1;
    }

    function sapu() {
      if (dead) return;
      sweep = Math.min(1, sweep + 0.045);
      gambar();
      if (sweep < 1) raf = requestAnimationFrame(sapu);
    }

    function selCell(e: PointerEvent | MouseEvent): number {
      const r = cv!.getBoundingClientRect();
      const pit = r.width / COLS;
      const padY = 3 * pit;
      const gx = Math.floor(((e.clientX - r.left) / r.width) * COLS);
      const gy = Math.floor(((e.clientY - r.top - padY) / (r.height - 2 * padY)) * ROWS);
      if (!grid || gx < 0 || gy < 0 || gx >= COLS || gy >= ROWS) return 0;
      return grid[gy * COLS + gx] ?? 0;
    }

    cv.addEventListener('pointermove', (e) => {
      const p = selCell(e);
      if (p !== hover) {
        hover = p;
        diLaut = p === 0;
        kaki = p
          ? `${provs[p - 1]!.nama} · kode ${provs[p - 1]!.kode} · ketuk untuk membuka lensa`
          : 'ketuk sebuah provinsi untuk membukanya di Lensa Wilayah';
        gambar();
      }
    });
    cv.addEventListener('pointerleave', () => {
      hover = 0; diLaut = true;
      kaki = 'ketuk sebuah provinsi untuk membukanya di Lensa Wilayah';
      gambar();
    });
    cv.addEventListener('click', (e) => {
      const p = selCell(e);
      if (!p) return;
      const d = provs[p - 1]!;
      dispatch({ cmd: 'set_lensa', params: { kode: d.kode } });
      kaki = `${d.nama} terpasang di Lensa Wilayah (bagian Pagi)`;
    });

    const lepasLensa = onLensa((kode) => {
      const i = provs.findIndex((d) => d.kode === kode);
      aktif = i >= 0 ? i + 1 : 0;
      gambar();
    });

    const ro = new ResizeObserver(() => { ukur(); gambar(); });
    ro.observe(wrapEl);

    void (async () => {
      try {
        const atlas = await loadAtlasGrid(COLS, ROWS);
        provs = atlas.provs;
        grid = atlas.cells;

        const d = getDaerah();
        if (d && d.kode !== 'nasional') {
          const i = provs.findIndex((p) => p.kode === d.kode);
          aktif = i >= 0 ? i + 1 : 0;
        }
        ukur();
        if (reduced) { sweep = 1; gambar(); } else { raf = requestAnimationFrame(sapu); }
      } catch {
        // the honest fallback: the engraved plate, labelled
        ukur();
        drawEngraving(cv!, ENGRAVE_ATLAS);
        kaki = 'plat cadangan tergambar · data peta belum termuat di jaringan ini';
      }
    })();

    return () => { dead = true; cancelAnimationFrame(raf); ro.disconnect(); lepasLensa(); };
  });
</script>

<figure class="pa" bind:this={wrapEl} data-no-stempel>
  <div class="pa-head">
    <span class="eyebrow">ATLAS NUSANTARA · KETUK SEBUAH PROVINSI UNTUK MEMBUKANYA DI LENSA WILAYAH</span>
    <span class="eyebrow pa-sumber">⊙ BIG RUPABUMI · PROYEKSI LURUS</span>
  </div>
  <canvas bind:this={cv} class:tunjuk={!diLaut} role="img" aria-label="Peta kepulauan Indonesia sebagai plat titik ukir; setiap provinsi dapat diketuk untuk membuka Lensa Wilayah"></canvas>
  <figcaption class="pa-kaki mono">{kaki}</figcaption>
</figure>

<style>
  .pa { margin: 26px 0 34px; }
  .pa-head { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 10px; }
  .pa-sumber { color: var(--muted); }
  canvas { display: block; width: 100%; touch-action: pan-y; }
  canvas.tunjuk { cursor: pointer; }
  .pa-kaki {
    margin-top: 8px;
    font-size: 10.5px;
    letter-spacing: 0.14em;
    color: var(--muted);
    border-top: 1px solid var(--line-soft);
    padding-top: 7px;
  }
</style>
