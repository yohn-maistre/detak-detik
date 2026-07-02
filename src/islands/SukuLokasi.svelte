<script lang="ts">
  /** Suku Lokasi: a small locator plate that seals where the day's people are
      from, drawn from the same accurate province raster as the main atlas
      plate (lib/atlas-dots), shrunk to a margin figure. The province under
      the mark is inked darker; a madder seal ring marks the point itself. */
  import { onMount } from 'svelte';
  import { loadAtlasGrid, lonLatToCellF, type AtlasGrid } from '../lib/atlas-dots';

  let { lat, lon, nama }: { lat: number; lon: number; nama: string } = $props();
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

    // the point, then its province: the home island is inked darker
    const [fx, fy] = lonLatToCellF(lon, lat, COLS, ROWS);
    const ci = Math.min(ROWS - 1, Math.max(0, Math.floor(fy))) * COLS + Math.min(COLS - 1, Math.max(0, Math.floor(fx)));
    const home = grid.cells[ci] ?? 0;

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
        ctx.globalAlpha = home > 0 && p === home ? 0.9 : 0.32;
        ctx.fillRect(ox + gx * scale + (scale - dot) / 2, oy + gy * scale + (scale - dot) / 2, dot, dot);
      }
    }
    ctx.globalAlpha = 1;

    // the seal: concentric rings on the exact point
    const px = ox + fx * scale;
    const py = oy + fy * scale;
    ctx.strokeStyle = accent2;
    ctx.fillStyle = accent2;
    ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 0.7; ctx.beginPath(); ctx.arc(px, py, 13, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();
  }

  onMount(() => {
    let dead = false;
    void loadAtlasGrid(COLS, ROWS).then((g) => {
      if (dead) return;
      grid = g;
      draw();
    }).catch(() => { /* the frame stays quiet; the caption still names the place */ });
    const ro = new ResizeObserver(draw);
    if (el) ro.observe(el);
    return () => { dead = true; ro.disconnect(); };
  });

  $effect(() => {
    void lat; void lon;
    draw();
  });
</script>

<figure class="sl" data-no-stempel>
  <canvas bind:this={el} aria-label={`Lokasi ${nama} di kepulauan`}></canvas>
  <figcaption class="mono">⌖ {nama} · tertanda di kepulauan</figcaption>
</figure>

<style>
  .sl { margin: 0; display: grid; gap: 8px; }
  .sl canvas { width: 100%; height: clamp(150px, 22vh, 210px); display: block; border-top: 1px solid var(--line-soft); border-bottom: 1px solid var(--line-soft); }
  figcaption { font-size: 8.5px; letter-spacing: 0.14em; color: var(--muted); }
</style>
