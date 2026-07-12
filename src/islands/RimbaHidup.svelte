<script lang="ts">
  /**
   * Rimba Hidup v3: the living understory that closes Act III. A seeded
   * flock of ink birds drifts and flocks (Reynolds boids); an alignment
   * pulse makes them synchronise into murmuration waves, then scatter back
   * to noise. Order out of chaos, drawn straight on the act's paper.
   *
   * v3 (2026-07-12): the marks become BIRDS — two swept wing strokes that
   * flap on their own phase (rate follows speed) and glide between beats;
   * the periodic random kick becomes a HAWK crossing the field that flushes
   * the flock; the shared coastline field (lib/nusantara, the same seed the
   * Tugu canvas uses) prints a distant archipelago on the horizon; and the
   * computed moon (lib/langit — the SAME arithmetic the Almanak prints)
   * hangs above it. Physics stays time-normalized; the flock scales with
   * area and self-culls under ~30fps. No data claims, only motion.
   */
  import { onMount } from 'svelte';
  import { reducedMotion } from '../lib/motion';
  import { rngFrom } from '../lib/seed';
  import { field, GRID_COLS } from '../lib/nusantara';
  import { faseP, jalurTerang } from '../lib/langit';

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

    // the moon: same phase arithmetic the Almanak prints (one owner)
    const MOON_R = 15;
    const moonLit = new Path2D(jalurTerang(faseP(), MOON_R, MOON_R));

    type B = {
      x: number; y: number; vx: number; vy: number;
      m: boolean;   // the accented few
      s: number;    // depth: size + ink weight
      ph: number;   // wing phase
      gl: number;   // glide seconds remaining
    };
    let flock: B[] = [];
    // two raptors on independent clocks, and the reader's own cursor —
    // every predator uses the same avoidance field
    type Hawk = { on: boolean; x: number; y: number; vx: number; vy: number; ph: number; timer: number };
    const hawks: Hawk[] = [
      { on: false, x: 0, y: 0, vx: 0, vy: 0, ph: 0, timer: 7 },
      { on: false, x: 0, y: 0, vx: 0, vy: 0, ph: 0, timer: 19 },
    ];
    const mouse = { on: false, x: 0, y: 0 };

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
        // flock size follows the paper's area: a phone seats ~55, a wide desktop ~150
        const N = Math.round(Math.min(150, Math.max(52, (W * H) / 2600)));
        flock = Array.from({ length: N }, () => ({
          x: rng() * W,
          y: rng() * H,
          vx: (rng() - 0.5) * 1.6,
          vy: (rng() - 0.5) * 1.6,
          m: rng() < 0.1,
          s: 0.65 + rng() * 0.75,
          ph: rng() * Math.PI * 2,
          gl: 0,
        }));
      }
    }

    const R2 = 40 * 40;
    const SEP2 = 16 * 16;
    const HAWK2 = 110 * 110;
    const MOUSE2 = 85 * 85;
    const MAXV = 1.5; // px per 60fps-frame — dtn converts to real time
    const MINV = 0.5;

    /** one bird, the gull mark ⌒⌒: wings arc OUT and slightly FORWARD from
        the shoulders, bowing back at the arc (tips-behind read as bats —
        Yose 2026-07-12). The flap narrows the span; a glide holds it open. */
    function drawBird(x: number, y: number, vx: number, vy: number, s: number, fw: number, warna: string, alpha: number) {
      const sp = Math.hypot(vx, vy) || 1;
      const ux = vx / sp, uy = vy / sp;
      const px = -uy, py = ux;
      const span = 3.2 * s * (0.5 + 0.5 * fw);
      const maju = 0.55 * s; // wing tips sit AHEAD of the body line
      const tlx = x + ux * maju + px * span, tly = y + uy * maju + py * span;
      const trx = x + ux * maju - px * span, trY = y + uy * maju - py * span;
      // control points pulled BACK: each wing bows rearward like a gull's
      const clx = x - ux * 1.1 * s + px * span * 0.45, cly = y - uy * 1.1 * s + py * span * 0.45;
      const crx = x - ux * 1.1 * s - px * span * 0.45, crY = y - uy * 1.1 * s - py * span * 0.45;
      ctx!.strokeStyle = warna;
      ctx!.globalAlpha = alpha;
      ctx!.lineWidth = Math.max(0.8, 1.05 * s);
      ctx!.lineCap = 'round';
      ctx!.beginPath();
      ctx!.moveTo(x, y);
      ctx!.quadraticCurveTo(clx, cly, tlx, tly);
      ctx!.moveTo(x, y);
      ctx!.quadraticCurveTo(crx, crY, trx, trY);
      ctx!.stroke();
      ctx!.globalAlpha = 1;
    }

    /** the stage: a distant archipelago on the horizon (the shared coastline
        field — the same seed the Tugu canvas grows from) + the computed moon */
    function drawStage() {
      const hy = H * 0.82;
      ctx!.fillStyle = ink;
      ctx!.globalAlpha = 0.13;
      for (let i = 0; i < W; i += 3) {
        const gx = ((i / W) * GRID_COLS);
        if (field(gx, 30) > 0.45) ctx!.fillRect(i, hy, 2, 1.2);
        if (field(gx, 34) > 0.5) ctx!.fillRect(i, hy + 4, 2, 1);
      }
      ctx!.globalAlpha = 1;
      // the moon, top-right, lit exactly as tonight's phase
      ctx!.save();
      ctx!.translate(W - 84, 30);
      ctx!.fillStyle = ink;
      ctx!.globalAlpha = 0.1;
      ctx!.beginPath();
      ctx!.arc(MOON_R, MOON_R, MOON_R, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.globalAlpha = 0.42;
      ctx!.fill(moonLit);
      ctx!.globalAlpha = 0.3;
      ctx!.strokeStyle = ink;
      ctx!.lineWidth = 0.7;
      ctx!.beginPath();
      ctx!.arc(MOON_R, MOON_R, MOON_R, 0, Math.PI * 2);
      ctx!.stroke();
      ctx!.restore();
      ctx!.globalAlpha = 1;
    }

    let last = 0;
    let emaDt = 16.7;
    let frames = 0;

    function step(now: number) {
      const dt = last ? Math.min(64, now - last) : 16.7;
      last = now;
      // time-normalized: 1.0 at 60 Hz — the flock covers the same ground everywhere
      const dtn = Math.max(0.25, Math.min(3, dt / 16.667));
      const dts = dt / 1000;
      emaDt = emaDt * 0.95 + dt * 0.05;
      if (++frames % 90 === 0 && emaDt > 32 && flock.length > 40) {
        flock = flock.slice(0, Math.round(flock.length * 0.86));
      }

      t += dts;
      const align = 0.04 + 0.06 * (0.5 + 0.5 * Math.sin(t * 0.5)); // the shimmer
      ctx!.clearRect(0, 0, W, H);
      drawStage();

      // the hawks: each on its own clock — enter, cross, flush, leave
      for (const hawk of hawks) {
        hawk.timer -= dts;
        if (!hawk.on && hawk.timer <= 0) {
          const dari = rng() < 0.5 ? -1 : 1;
          hawk.on = true;
          hawk.x = dari < 0 ? -20 : W + 20;
          hawk.y = H * (0.15 + rng() * 0.55);
          hawk.vx = -dari * (2.6 + rng() * 1.2);
          hawk.vy = (rng() - 0.5) * 0.5;
          hawk.ph = 0;
        }
        if (hawk.on) {
          hawk.x += hawk.vx * dtn;
          hawk.y += hawk.vy * dtn;
          hawk.ph += 2.2 * Math.PI * dts; // slow, heavy beats
          const fw = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(hawk.ph));
          drawBird(hawk.x, hawk.y, hawk.vx, hawk.vy, 2.3, fw, accent, 0.8);
          if (hawk.x < -30 || hawk.x > W + 30) {
            hawk.on = false;
            hawk.timer = 12 + rng() * 12;
          }
        }
      }

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
        // every predator empties the sky around itself — hawks and the
        // reader's cursor alike
        for (const hawk of hawks) {
          if (!hawk.on) continue;
          const dx = b.x - hawk.x, dy = b.y - hawk.y, d2 = dx * dx + dy * dy;
          if (d2 < HAWK2 && d2 > 1) {
            const f = 5.4 / Math.sqrt(d2);
            b.vx += dx * f * 0.06 * dtn;
            b.vy += dy * f * 0.06 * dtn;
          }
        }
        if (mouse.on) {
          const dx = b.x - mouse.x, dy = b.y - mouse.y, d2 = dx * dx + dy * dy;
          if (d2 < MOUSE2 && d2 > 1) {
            const f = 4.6 / Math.sqrt(d2);
            b.vx += dx * f * 0.055 * dtn;
            b.vy += dy * f * 0.055 * dtn;
          }
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

        // wings: flap rate follows speed; now and then a bird locks a glide
        if (b.gl > 0) b.gl -= dts;
        else if (rng() < 0.0025 * dtn) b.gl = 0.5 + rng() * 1.1;
        b.ph += (4 + cl * 2.5) * Math.PI * 2 * 0.75 * dts;
        const fw = b.gl > 0 ? 0.92 : 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(b.ph));
        drawBird(b.x, b.y, b.vx, b.vy, b.s, fw, b.m ? accent : ink, 0.3 + 0.3 * b.s);
      }
      raf = requestAnimationFrame(step);
    }

    function start() { if (!running) { running = true; last = 0; raf = requestAnimationFrame(step); } }
    function stop() { running = false; cancelAnimationFrame(raf); }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // the reader's cursor is a predator too: the flock parts around it
    const gerakMouse = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.on = true;
    };
    const pergiMouse = () => { mouse.on = false; };
    wrap.addEventListener('pointermove', gerakMouse, { passive: true });
    wrap.addEventListener('pointerleave', pergiMouse, { passive: true });
    wrap.addEventListener('pointerdown', gerakMouse, { passive: true });
    wrap.addEventListener('pointerup', pergiMouse, { passive: true });

    let io: IntersectionObserver | undefined;
    if (reducedMotion()) {
      // one still frame: the stage and the flock mid-glide
      ctx.clearRect(0, 0, W, H);
      drawStage();
      for (const b of flock) drawBird(b.x, b.y, b.vx, b.vy, b.s, 0.85, b.m ? accent : ink, 0.3 + 0.3 * b.s);
    } else {
      io = new IntersectionObserver(([e]) => (e!.isIntersecting ? start() : stop()), { threshold: 0 });
      io.observe(wrap);
    }

    return () => {
      stop();
      ro.disconnect();
      io?.disconnect();
      wrap.removeEventListener('pointermove', gerakMouse);
      wrap.removeEventListener('pointerleave', pergiMouse);
      wrap.removeEventListener('pointerdown', gerakMouse);
      wrap.removeEventListener('pointerup', pergiMouse);
    };
  });
</script>

<section class="rimba" data-no-stempel data-ref="rimba" bind:this={wrap}>
  <canvas bind:this={canvas} aria-hidden="true"></canvas>
  <!-- show, don't overexplain: the flock speaks for itself -->
  <p class="rimba-cap mono">BOIDS · REYNOLDS 1987</p>
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
  .rimba-cap {
    position: absolute; left: 0; right: 0; bottom: 10px;
    text-align: center; font-size: 7.5px; letter-spacing: 0.2em; color: var(--muted);
    padding: 0 16px;
  }
</style>
