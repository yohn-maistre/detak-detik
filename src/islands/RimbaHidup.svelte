<script lang="ts">
  /**
   * Rimba Hidup: the living understory that closes Act III. A deterministic
   * flock of dithered creatures drifts and flocks (Reynolds boids); an
   * alignment pulse makes them synchronise into murmuration waves, the way
   * Apis dorsata bees shimmer, then scatter back to noise. Order out of chaos.
   * Canvas 2D, seeded (shared edition), paused off-screen, a single static
   * frame under reduced motion.
   */
  import { onMount } from 'svelte';
  import { reducedMotion } from '../lib/motion';
  import { rngFrom } from '../lib/seed';

  const FAKTA = [
    'Lebah raksasa Apis dorsata menggetarkan sayap serentak, gelombang demi gelombang, untuk mengusir pemangsa.',
    'Cendrawasih jantan menari sebelum fajar; sang betina memilih yang paling sabar.',
    'Hutan Kalimantan menyimpan lebih banyak jenis pohon daripada seluruh benua Afrika.',
    'Komodo betina bisa bertelur tanpa pejantan, lewat partenogenesis.',
    'Ikan di Raja Ampat dilaporkan mengenali penyelam yang sama dari hari ke hari.',
    'Rafflesia arnoldii mekar sekali, sebesar roda, lalu layu dalam sepekan.',
  ];
  let faktaIdx = $state(0);

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
      if (!flock.length && W > 0) {
        const N = Math.round(Math.min(150, Math.max(60, W / 9)));
        flock = Array.from({ length: N }, () => ({
          x: rng() * W,
          y: rng() * H,
          vx: (rng() - 0.5) * 1.6,
          vy: (rng() - 0.5) * 1.6,
          m: rng() < 0.12,
        }));
      }
      ctx!.fillStyle = '#ece2cb';
      ctx!.fillRect(0, 0, W, H);
    }

    const R2 = 40 * 40;
    const SEP2 = 16 * 16;
    const MAXV = 1.5;
    const MINV = 0.5;

    function draw(b: B) {
      ctx!.fillStyle = b.m ? '#ad5038' : '#47745a';
      ctx!.globalAlpha = 0.85;
      ctx!.fillRect(Math.round(b.x), Math.round(b.y), 2, 2);
      ctx!.globalAlpha = 0.4;
      ctx!.fillRect(Math.round(b.x - b.vx * 2), Math.round(b.y - b.vy * 2), 1, 1);
      ctx!.globalAlpha = 1;
    }

    function step() {
      t += 0.016;
      const align = 0.04 + 0.06 * (0.5 + 0.5 * Math.sin(t * 0.5)); // the shimmer
      ctx!.fillStyle = 'rgba(236,226,203,0.16)'; // trails
      ctx!.fillRect(0, 0, W, H);
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
          b.vx += (cx / n - b.x) * 0.0009 + (ax / n - b.vx) * align + sx * 0.9;
          b.vy += (cy / n - b.y) * 0.0009 + (ay / n - b.vy) * align + sy * 0.9;
        }
        b.vx += (rng() - 0.5) * 0.06;
        b.vy += (rng() - 0.5) * 0.06;
        const sp = Math.hypot(b.vx, b.vy) || 1;
        const cl = Math.max(MINV, Math.min(MAXV, sp));
        b.vx = (b.vx / sp) * cl;
        b.vy = (b.vy / sp) * cl;
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < -4) b.x = W + 4; else if (b.x > W + 4) b.x = -4;
        if (b.y < -4) b.y = H + 4; else if (b.y > H + 4) b.y = -4;
        draw(b);
      }
      raf = requestAnimationFrame(step);
    }

    function start() { if (!running) { running = true; raf = requestAnimationFrame(step); } }
    function stop() { running = false; cancelAnimationFrame(raf); }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let io: IntersectionObserver | undefined;
    if (reducedMotion()) {
      ctx.fillStyle = '#ece2cb';
      ctx.fillRect(0, 0, W, H);
      for (const b of flock) draw(b);
    } else {
      io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0 });
      io.observe(wrap);
    }

    const factIv = window.setInterval(() => (faktaIdx = (faktaIdx + 1) % FAKTA.length), 6500);

    return () => { stop(); ro.disconnect(); io?.disconnect(); clearInterval(factIv); };
  });
</script>

<section class="rimba" data-no-stempel data-ref="rimba" bind:this={wrap}>
  <canvas bind:this={canvas} aria-hidden="true"></canvas>
  <div class="rimba-overlay">
    <span class="eyebrow">RIMBA HIDUP · YANG TETAP BERGERAK</span>
    {#each [FAKTA[faktaIdx]] as f (faktaIdx)}
      <p class="rimba-fakta fig">{f}</p>
    {/each}
  </div>
</section>

<style>
  .rimba { position: relative; height: clamp(300px, 46vh, 440px); overflow: hidden; background: #ece2cb; margin-top: 44px; }
  /* feather every edge so the flock dissolves into the paper on all sides */
  .rimba canvas {
    position: absolute; inset: 0; display: block;
    -webkit-mask: radial-gradient(118% 118% at 50% 48%, #000 60%, transparent 100%);
    mask: radial-gradient(118% 118% at 50% 48%, #000 60%, transparent 100%);
  }
  .rimba-overlay { position: absolute; left: 0; right: 0; bottom: 0; padding: clamp(18px, 3vw, 36px); background: linear-gradient(transparent, color-mix(in oklab, #ece2cb 82%, transparent)); }
  .rimba .eyebrow { color: var(--accent2); margin-bottom: 8px; display: block; }
  .rimba-fakta { font-size: clamp(18px, 2.6vw, 30px); max-width: 32ch; line-height: 1.22; color: var(--ink); animation: rimbaFade 0.8s var(--ease-out); }
  @keyframes rimbaFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { .rimba-fakta { animation: none; } }
</style>
