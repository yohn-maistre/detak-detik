<script lang="ts">
  /** Suku Lokasi: a small engraved archipelago plate that seals where the day's
      people are from — the same canvas engraving + lon/lat projection as the
      archive plate, shrunk to a locator. Static; no live tiles. */
  import { onMount } from 'svelte';
  import { drawEngraving, ENGRAVE_ATLAS, lonLatToGrid } from '../lib/engrave';
  import { GRID_COLS, GRID_ROWS } from '../lib/nusantara';

  let { lat, lon, nama }: { lat: number; lon: number; nama: string } = $props();
  let el: HTMLCanvasElement;

  function draw() {
    if (!el) return;
    drawEngraving(el, { ...ENGRAVE_ATLAS, caption: `LOKASI · ${nama.toUpperCase()}` });
    const ctx = el.getContext('2d');
    if (!ctx) return;
    const w = el.clientWidth, h = el.clientHeight;
    const scale = Math.min((w * 0.92) / GRID_COLS, (h * 0.92) / GRID_ROWS);
    const ox = (w - GRID_COLS * scale) / 2, oy = (h - GRID_ROWS * scale) / 2;
    const [gx, gy] = lonLatToGrid(lon, lat);
    const px = ox + gx * scale, py = oy + gy * scale;
    ctx.strokeStyle = '#b4543c';
    ctx.fillStyle = '#b4543c';
    ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 0.7; ctx.beginPath(); ctx.arc(px, py, 13, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();
  }

  onMount(() => {
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(el);
    return () => ro.disconnect();
  });
</script>

<figure class="sl" data-no-stempel>
  <canvas bind:this={el} aria-label={`Lokasi ${nama} di kepulauan`}></canvas>
  <figcaption class="mono">⌖ {nama} · disegel di kepulauan</figcaption>
</figure>

<style>
  .sl { margin: 0; display: grid; gap: 8px; }
  .sl canvas { width: 100%; height: clamp(170px, 26vh, 240px); display: block; border: 1px solid var(--line); }
  figcaption { font-size: 8.5px; letter-spacing: 0.14em; color: var(--muted); }
</style>
