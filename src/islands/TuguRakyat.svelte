<script lang="ts">
  /**
   * Tugu Rakyat: a shared low-res canvas, seeded with the archipelago. Pick
   * a colour from the paper palette, place a cell. This build persists your
   * marks locally (the communal, cross-reader version runs on a Cloudflare
   * Durable Object: same grid, one cell per visitor per cooldown). No free
   * text, fixed palette: a civic mural that cannot spell a slur.
   */
  import { onMount } from 'svelte';
  import { field, GRID_COLS } from '../lib/nusantara';

  const COLS = 72, ROWS = 40;
  const PALET = ['#d6cbac', '#15130e', '#e44a06', '#cdb47a', '#47745a', '#ad5038', '#3a5a78'];
  const KEY = 'dd-tugu-v1';

  let canvas: HTMLCanvasElement;
  let warna = $state(2);
  let sel = $state(0);
  let grid = new Uint8Array(COLS * ROWS);

  function seed() {
    // faint archipelago in ink, sea as paper: the communal starting plate
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const gx = (c / COLS) * GRID_COLS;
        const gy = (r / ROWS) * 60;
        grid[r * COLS + c] = field(gx, gy) > 0.45 ? 1 : 0;
      }
    }
  }

  let cell = 8;
  function draw() {
    const w = canvas.clientWidth;
    cell = w / COLS;
    const h = cell * ROWS;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        ctx.fillStyle = PALET[grid[r * COLS + c]!]!;
        ctx.fillRect(c * cell, r * cell, cell + 0.5, cell + 0.5);
      }
    }
    ctx.strokeStyle = 'rgba(21,19,14,0.06)';
    ctx.lineWidth = 0.5;
    for (let c = 0; c <= COLS; c++) { ctx.beginPath(); ctx.moveTo(c * cell, 0); ctx.lineTo(c * cell, h); ctx.stroke(); }
    for (let r = 0; r <= ROWS; r++) { ctx.beginPath(); ctx.moveTo(0, r * cell); ctx.lineTo(w, r * cell); ctx.stroke(); }
  }

  let painting = false;
  function place(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    const c = Math.floor(((e.clientX - rect.left) / rect.width) * COLS);
    const r = Math.floor(((e.clientY - rect.top) / rect.height) * ROWS);
    if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return;
    if (grid[r * COLS + c] === warna) return;
    grid[r * COLS + c] = warna;
    sel++;
    draw();
    try { localStorage.setItem(KEY, JSON.stringify([...grid])); } catch { /* full */ }
  }

  function reset() {
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    seed(); draw(); sel = 0;
  }

  onMount(() => {
    let loaded = false;
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) { const a = JSON.parse(saved); if (Array.isArray(a) && a.length === COLS * ROWS) { grid = Uint8Array.from(a); loaded = true; } }
    } catch { /* ignore */ }
    if (!loaded) seed();
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  });
</script>

<section class="tr" data-no-stempel>
  <div class="tr-head">
    <span class="eyebrow">TUGU RAKYAT · KANVAS BERSAMA</span>
    <span class="tr-status mono">{sel} PETAK DITEMPATKAN · VERSI LOKAL</span>
  </div>
  <p class="tr-intro">Pilih warna dan letakkan satu petak. Palet tetap, tanpa teks bebas: mural sipil yang tersimpan di perangkat ini. Kanvas bersama lintas pembaca menyusul.</p>

  <div class="tr-palet" role="group" aria-label="Palet warna">
    {#each PALET as p, i}
      <button
        class="tr-swatch"
        class:aktif={warna === i}
        style={`background:${p}`}
        onclick={() => (warna = i)}
        aria-label={`Warna ${i + 1}`}
        title={i === 0 ? 'Hapus (kertas)' : `Warna ${i + 1}`}
      ></button>
    {/each}
  </div>

  <canvas
    bind:this={canvas}
    onpointerdown={(e) => { painting = true; canvas.setPointerCapture(e.pointerId); place(e); }}
    onpointermove={(e) => painting && place(e)}
    onpointerup={() => (painting = false)}
    onpointercancel={() => (painting = false)}
    aria-label="Kanvas Tugu Rakyat"
  ></canvas>

  <div class="tr-foot mono">
    <span>BENIH: GARIS PANTAI NUSANTARA</span>
    <button class="tr-act mono" onclick={reset}>↻ Setel ulang</button>
  </div>
</section>

<style>
  /* de-boxed: hairline top rule, kicker, the plate set on the paper */
  .tr { display: grid; gap: 0.75rem; border-top: var(--hairline); padding-top: 0.75rem; }
  .tr-head { display: flex; justify-content: space-between; align-items: baseline; gap: 0.75rem; flex-wrap: wrap; }
  .tr-status { font-size: 9px; letter-spacing: 0.14em; color: var(--muted); }
  .tr-intro { font-size: 13px; color: var(--muted); max-width: 60ch; line-height: 1.55; }

  /* palette: bare colour cells, inset hairline so paper reads on paper */
  .tr-palet { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .tr-swatch {
    width: 26px;
    height: 26px;
    padding: 0;
    border: 0;
    border-radius: var(--radius);
    box-shadow: inset 0 0 0 1px var(--line-soft);
    cursor: pointer;
    transition: transform 0.15s var(--ease-out);
  }
  .tr-swatch:hover { transform: translateY(-2px); }
  .tr-swatch.aktif { outline: 1px solid var(--ink); outline-offset: 3px; }

  /* the plate itself: hairline frame, no heavy border */
  canvas {
    width: 100%;
    display: block;
    border: 1px solid var(--line-soft);
    cursor: crosshair;
    touch-action: none;
    image-rendering: pixelated;
  }

  /* caption row under the plate, ruled like a figure legend */
  .tr-foot {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.75rem;
    border-top: 1px solid var(--line-soft);
    padding-top: 0.5rem;
    font-size: 8.5px;
    letter-spacing: 0.14em;
    color: var(--muted);
  }

  /* secondary action: mono text on a hairline that thickens */
  .tr-act {
    font-size: 9px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    background: none;
    border: 0;
    border-bottom: 1px solid var(--line);
    border-radius: 0;
    padding: 0 1px 3px;
    color: var(--muted);
    cursor: pointer;
    transition: color 0.25s var(--ease-out), border-color 0.25s var(--ease-out);
  }
  .tr-act:hover { color: var(--ink); border-color: var(--ink); border-bottom-width: 2px; padding-bottom: 2px; }
</style>
