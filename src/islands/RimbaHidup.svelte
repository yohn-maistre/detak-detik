<script lang="ts">
  /**
   * Rimba Hidup v2: the living understory that closes Act III. A seeded
   * flock of ink-stroke birds drifts and flocks (Reynolds boids); an
   * alignment pulse makes them synchronise into murmuration waves, the way
   * Apis dorsata bees shimmer, then scatter back to noise. Order out of
   * chaos — drawn straight on the act's paper, not on its own panel.
   *
   * v2 fixes (2026-07-12): physics is TIME-normalized (the old build moved
   * per-frame, so 144 Hz laptops raced and throttled phones crawled); the
   * flock size scales with viewport area and self-culls if frames run slow;
   * the canvas is transparent over the register's paper + hatch (the flat
   * #ece2cb slab is gone); trails out, calligraphic strokes in.
   */
  import { onMount } from 'svelte';
  import { reducedMotion } from '../lib/motion';
  import { rngFrom } from '../lib/seed';

  let canvas: HTMLCanvasElement;
  let wrap: HTMLElement;

  onMount(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    const rng = rngFrom('rimba-hidup-edisi-41');
    let raf = 0;
    let running = false;
    let t = 0;
    let W = 0;
    let H = 0;
    let ink = '#15130e';
    let accent = '#e44a06';

    type B = { x: number; y: number; vx: number; vy: number; m: boolean };
    let flock: B[] = [];

    function resize() {
      const r = wrap.getBoundingClientRect();
      W = r.width;
      H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const css = getComputedStyle(wrap);
      ink = css.getPropertyValue('--ink').trim() || ink;
      accent = css.getPropertyValue('--accent').trim() || accent;
      if (!flock.length && W > 0) {
        // flock size follows the paper's area, not a flat count: a phone
        // seats ~45 birds, a wide desktop ~110
        const N = Math.round(Math.min(110, Math.max(42, (W * H) / 3400)));
        flock = Array.from({ length: N }, () => ({
          x: rng() * W,
          y: rng() * H,
          vx: (rng() - 0.5) * 1.6,
          vy: (rng() - 0.5) * 1.6,
          m: rng() < 0.1,
        }));
      }
    }

    const R2 = 40 * 40;
    const SEP2 = 16 * 16;
    const MAXV = 1.5; // px per 60fps-frame — dtn converts to real time
    const MINV = 0.5;

    function draw(b: B) {
      // a calligraphic stroke along the flight line, not a pixel block
      const sp = Math.hypot(b.vx, b.vy) || 1;
      const ux = b.vx / sp, uy = b.vy / sp;
      const len = 2.6 + sp * 2.2;
      ctx!.strokeStyle = b.m ? accent : ink;
      ctx!.globalAlpha = b.m ? 0.72 : 0.5;
      ctx!.lineWidth = 1.1;
      ctx!.beginPath();
      ctx!.moveTo(b.x - ux * len, b.y - uy * len);
      ctx!.lineTo(b.x + ux * len * 0.6, b.y + uy * len * 0.6);
      ctx!.stroke();
      ctx!.globalAlpha = 1;
    }

    let last = 0;
    let emaDt = 16.7;
    let frames = 0;

    function step(now: number) {
      const dt = last ? Math.min(64, now - last) : 16.7;
      last = now;
      // time-normalized step: 1.0 at 60 Hz, ~0.42 at 144 Hz, ~2 on a
      // struggling phone — the flock covers the same ground everywhere
      const dtn = Math.max(0.25, Math.min(3, dt / 16.667));
      emaDt = emaDt * 0.95 + dt * 0.05;
      // self-culling: if the device can't hold ~30fps, thin the flock
      if (++frames % 90 === 0 && emaDt > 32 && flock.length > 40) {
        flock = flock.slice(0, Math.round(flock.length * 0.86));
      }

      t += dt / 1000;
      const align = 0.04 + 0.06 * (0.5 + 0.5 * Math.sin(t * 0.5)); // the shimmer
      ctx!.clearRect(0, 0, W, H);
      for (const b of flock) {
        let cx = 0, cy = 0, ax = 0, ay = 0, sx = 0, sy = 0, n = 0;
        for (const o of flock) {
          if (o === b) continue;
          const dx = o.x - b.x, dy = o.y - b.y, d2 = dx * dx + dy * dy;
          if (d2 < R2) {
            cx += o.x; cy += o.y; ax += o.vx; ay += o.vy; n++;
            if (d2 < SEP2 && d2 > 0) { sx -= dx / d2; sy -= dy / d2; }
          }
        }
        if (n) {
          b.vx += ((cx / n - b.x) * 0.0009 + (ax / n - b.vx) * align + sx * 0.9) * dtn;
          b.vy += ((cy / n - b.y) * 0.0009 + (ay / n - b.vy) * align + sy * 0.9) * dtn;
        }
        b.vx += (rng() - 0.5) * 0.06 * dtn;
        b.vy += (rng() - 0.5) * 0.06 * dtn;
        const sp = Math.hypot(b.vx, b.vy) || 1;
        const cl = Math.max(MINV, Math.min(MAXV, sp));
        b.vx = (b.vx / sp) * cl;
        b.vy = (b.vy / sp) * cl;
        b.x += b.vx * dtn;
        b.y += b.vy * dtn;
        if (b.x < -6) b.x = W + 6; else if (b.x > W + 6) b.x = -6;
        if (b.y < -6) b.y = H + 6; else if (b.y > H + 6) b.y = -6;
        draw(b);
      }
      raf = requestAnimationFrame(step);
    }

    function start() { if (!running) { running = true; last = 0; raf = requestAnimationFrame(step); } }
    function stop() { running = false; cancelAnimationFrame(raf); }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let io: IntersectionObserver | undefined;
    if (reducedMotion()) {
      ctx.clearRect(0, 0, W, H);
      for (const b of flock) draw(b); // one still frame of the flock
    } else {
      io = new IntersectionObserver(([e]) => (e!.isIntersecting ? start() : stop()), { threshold: 0 });
      io.observe(wrap);
    }

    // once in a while, a random impulse scatters the flock before it re-coheres
    const burstIv = window.setInterval(() => {
      if (!running) return;
      const kick = 2.2 + rng() * 1.4;
      for (const b of flock) { b.vx += (rng() - 0.5) * kick; b.vy += (rng() - 0.5) * kick; }
    }, 11_000);

    return () => { stop(); ro.disconnect(); io?.disconnect(); clearInterval(burstIv); };
  });
</script>

<section class="rimba" data-no-stempel data-ref="rimba" bind:this={wrap}>
  <canvas bind:this={canvas} aria-hidden="true"></canvas>
  <div class="rimba-kepala mono" aria-hidden="true">
    <span class="rimba-eyebrow">RIMBA HIDUP · YANG TETAP BERGERAK</span>
  </div>
  <p class="rimba-cap mono">PLAT PENUTUP · SIMULASI KAWANAN (REYNOLDS, 1987) · BENIH TETAP SATU EDISI — TANPA DATA, HANYA GERAK</p>
</section>

<style>
  /* no panel, no slab: the flock flies over the act's own paper, held
     between two hairlines like every other plate */
  .rimba {
    position: relative;
    height: clamp(260px, 38vh, 400px);
    overflow: hidden;
    margin-top: clamp(56px, 9vw, 110px);
    border-top: 1px solid var(--line-soft);
    border-bottom: 1px solid var(--line-soft);
    background: none;
  }
  .rimba canvas {
    position: absolute; inset: 0; display: block;
    /* feather left/right so wrap-around birds dissolve at the edges */
    -webkit-mask: linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent);
    mask: linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent);
  }
  .rimba-kepala { position: absolute; left: clamp(16px, 4vw, 48px); top: 14px; }
  .rimba-eyebrow { font-size: 9px; letter-spacing: 0.22em; color: var(--accent2); }
  .rimba-cap {
    position: absolute; left: 0; right: 0; bottom: 10px;
    text-align: center; font-size: 7.5px; letter-spacing: 0.2em; color: var(--muted);
    padding: 0 16px;
  }
</style>
