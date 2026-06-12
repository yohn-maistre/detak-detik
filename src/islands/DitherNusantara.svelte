<script lang="ts">
  /**
   * Nusantara, dithered Bayer, drawn row by row like a plate coming off
   * the press. Once drawn, the grid ticks as a slow Game of Life: the seed
   * decays into abstraction until the next edition resets it. Touching the
   * plate stirs it back to life (the fidget). Pauses offscreen; static
   * frame under reduced motion.
   */
  import { onMount } from 'svelte';
  import { rngFrom, BAYER_4 } from '../lib/seed';
  import { GRID_COLS as COLS, GRID_ROWS as ROWS, field } from '../lib/nusantara';

  let canvas: HTMLCanvasElement;

  const SEED = 'edisi-41-pagi';

  onMount(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = canvas.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);

    let cell = 6;
    const resize = () => {
      const w = canvas.clientWidth;
      cell = w / COLS;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(cell * ROWS * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const rng = rngFrom(SEED);
    const seedGrid = new Uint8Array(COLS * ROWS);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const v = field(c, r) * 0.95 + rng() * 0.09;
        seedGrid[r * COLS + c] = v > BAYER_4[r % 4]![c % 4]! ? 1 : 0;
      }
    }
    let grid = seedGrid.slice();

    let revealedRows = 0;
    let frame = 0;
    let lastStep = 0;
    let generation = 0;
    let raf = 0;
    let running = false;

    const ink = () => getComputedStyle(canvas).getPropertyValue('color') || '#f2efe6';

    function draw() {
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      ctx.fillStyle = ink();
      const rMax = revealedRows;
      const dot = Math.max(1.4, cell * 0.34);
      for (let r = 0; r < rMax; r++) {
        for (let c = 0; c < COLS; c++) {
          if (grid[r * COLS + c]) {
            ctx.fillRect(c * cell + cell / 2 - dot / 2, r * cell + cell / 2 - dot / 2, dot, dot);
          }
        }
      }
      // gold scanline at the printing edge
      if (rMax < ROWS) {
        ctx.fillStyle = '#c9b27e';
        ctx.globalAlpha = 0.85;
        ctx.fillRect(0, rMax * cell, COLS * cell, 1.2);
        ctx.globalAlpha = 1;
      }
    }

    function lifeStep() {
      const next = new Uint8Array(COLS * ROWS);
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          let n = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (!dr && !dc) continue;
              const rr = (r + dr + ROWS) % ROWS;
              const cc = (c + dc + COLS) % COLS;
              n += grid[rr * COLS + cc]!;
            }
          }
          const alive = grid[r * COLS + c]!;
          next[r * COLS + c] = alive ? (n === 2 || n === 3 ? 1 : 0) : n === 3 ? 1 : 0;
        }
      }
      grid = next;
      generation++;
      if (generation > 28) {
        grid = seedGrid.slice();
        generation = 0;
      }
    }

    function loop(t: number) {
      if (!running) return;
      frame++;
      if (revealedRows < ROWS) {
        if (frame % 2 === 0) revealedRows++;
        draw();
      } else {
        // hold the finished plate a while before the slow decay begins
        if (lastStep === 0) lastStep = t + 9000;
        if (t - lastStep > 6000) {
          lifeStep();
          lastStep = t;
          draw();
        }
      }
      raf = requestAnimationFrame(loop);
    }

    if (reduced) {
      revealedRows = ROWS;
      draw();
    } else {
      const io = new IntersectionObserver(([e]) => {
        if (e?.isIntersecting && !running) {
          running = true;
          raf = requestAnimationFrame(loop);
        } else if (!e?.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(raf);
        }
      }, { threshold: 0.15 });
      io.observe(canvas);
    }

    // the fidget: stirring the plate seeds live cells under the pointer
    function stir(e: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      const c = Math.floor(((e.clientX - rect.left) / rect.width) * COLS);
      const r = Math.floor(((e.clientY - rect.top) / rect.height) * ROWS);
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const rr = r + dr;
          const cc = c + dc;
          if (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS && Math.random() > 0.4) {
            grid[rr * COLS + cc] = 1;
          }
        }
      }
      if (reduced) draw();
    }
    canvas.addEventListener('pointermove', stir);

    const ro = new ResizeObserver(() => { resize(); draw(); });
    ro.observe(canvas);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointermove', stir);
    };
  });
</script>

<figure class="dn" data-no-stempel>
  <canvas bind:this={canvas} aria-label="Peta Nusantara di-dither, digambar baris demi baris, hidup pelan seperti mesin cetak"></canvas>
  <figcaption class="mono">PLAT 01 · NUSANTARA · BENIH: GRID PERINGATAN KEMARIN · SENTUH UNTUK MENGADUK</figcaption>
</figure>

<style>
  .dn { margin: 0; }
  canvas {
    width: 100%;
    height: auto;
    display: block;
    color: var(--ink);
    touch-action: pan-y;
    cursor: crosshair;
  }
  figcaption {
    margin-top: 12px;
    font-size: 9.5px;
    letter-spacing: 0.2em;
    color: var(--muted);
    text-align: center;
  }
</style>
