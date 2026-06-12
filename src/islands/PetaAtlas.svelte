<script lang="ts">
  /**
   * Plat Arsip: the permanent engraved plate of the archive act. No live
   * tiles here anymore — the living map works upstairs in Act I; this one
   * is the version that stays true in fifty years. Pure canvas engraving
   * with the edition's noted regions sealed in madder; the compass rose
   * fidget keeps its spring. Region chips hand the reader to the living
   * map through the same command bus as everyone else.
   */
  import { onMount } from 'svelte';
  import { REGIONS } from '../lib/data/edisi';
  import { dispatch } from '../lib/commands/dispatcher';
  import { drawEngraving, ENGRAVE_ATLAS, lonLatToGrid } from '../lib/engrave';
  import { GRID_COLS, GRID_ROWS } from '../lib/nusantara';
  import { gsap, reducedMotion } from '../lib/motion';

  let plateEl: HTMLCanvasElement;
  let roseEl: SVGSVGElement;

  function draw() {
    drawEngraving(plateEl, { ...ENGRAVE_ATLAS, caption: 'PLAT 094 · NUSANTARA · CATATAN EDISI DISEGEL MADDER' });
    // seal the edition's regions in madder rings
    const ctx = plateEl.getContext('2d')!;
    const w = plateEl.clientWidth;
    const h = plateEl.clientHeight;
    const scale = Math.min((w * 0.92) / GRID_COLS, (h * 0.92) / GRID_ROWS);
    const ox = (w - GRID_COLS * scale) / 2;
    const oy = (h - GRID_ROWS * scale) / 2;
    ctx.strokeStyle = '#b4543c';
    ctx.fillStyle = '#b4543c';
    ctx.font = '9px Geist Mono, monospace';
    for (const r of REGIONS) {
      const [gx, gy] = lonLatToGrid(r.lon, r.lat);
      const px = ox + gx * scale;
      const py = oy + gy * scale;
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.arc(px, py, 11, 0, Math.PI * 2); ctx.stroke();
      ctx.fillText(r.nama.replace('Kab. ', '').replace('Kota ', '').toUpperCase(), px + 15, py + 3);
    }
  }

  onMount(() => {
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(plateEl);
    return () => ro.disconnect();
  });

  /* compass rose fidget */
  let roseAngle = 0;
  function roseDown(e: PointerEvent) {
    const rect = roseEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const start = Math.atan2(e.clientY - cy, e.clientX - cx);
    const base = roseAngle;
    const move = (ev: PointerEvent) => {
      const a = Math.atan2(ev.clientY - cy, ev.clientX - cx);
      roseAngle = base + ((a - start) * 180) / Math.PI;
      roseEl.style.setProperty('--bearing', `${roseAngle}deg`);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      const proxy = { a: roseAngle };
      gsap.to(proxy, {
        a: 0,
        duration: reducedMotion() ? 0 : 1.4,
        ease: 'elastic.out(1, 0.32)',
        onUpdate() {
          roseAngle = proxy.a;
          roseEl.style.setProperty('--bearing', `${roseAngle}deg`);
        },
      });
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up, { once: true });
  }

  function lihat(kode: string) {
    dispatch({ cmd: 'fly_to', params: { kode } });
    dispatch({ cmd: 'scroll_to', params: { anchor: 'peta' } });
  }
</script>

<div class="pa-wrap" data-no-stempel>
  <div class="plate">
    <span class="plate-deg mono nw">6°LU</span>
    <span class="plate-deg mono ne">141°BT</span>
    <span class="plate-deg mono sw">95°BT</span>
    <span class="plate-deg mono se">11°LS</span>
    <canvas class="pa-plate" bind:this={plateEl} aria-label="Plat ukiran Nusantara dengan segel wilayah edisi"></canvas>

    <svg bind:this={roseEl} class="rose" viewBox="0 0 100 100" onpointerdown={roseDown} role="img" aria-label="Mawar kompas, bisa diputar">
      <g class="rose-spin">
        <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" stroke-width="0.8" />
        <circle cx="50" cy="50" r="34" fill="none" stroke="currentColor" stroke-width="0.4" />
        {#each Array.from({ length: 16 }) as _, i}
          <line x1="50" y1={i % 4 === 0 ? 10 : 13.5} x2="50" y2="17.5" stroke="currentColor" stroke-width={i % 4 === 0 ? 1.2 : 0.5} transform="rotate({i * 22.5} 50 50)" />
        {/each}
        <path d="M50 12 L53.5 50 L50 88 L46.5 50 Z" fill="currentColor" opacity="0.85" />
        <path d="M12 50 L50 46.5 L88 50 L50 53.5 Z" fill="currentColor" opacity="0.5" />
        <path d="M50 12 L52.5 47 L50 50 L47.5 47 Z" fill="#b4543c" />
        <text x="50" y="8" text-anchor="middle" font-size="9">U</text>
      </g>
    </svg>
  </div>

  <div class="pa-chips">
    {#each REGIONS.slice(0, 4) as r (r.kode)}
      <button class="chip" onclick={() => lihat(r.kode)}>⌖ {r.nama} → peta</button>
    {/each}
  </div>
</div>

<style>
  .pa-wrap { position: relative; }
  .plate {
    position: relative;
    outline: 1px solid var(--line);
    outline-offset: 6px;
    border: 1px solid var(--line);
    padding: 10px;
    background:
      repeating-linear-gradient(90deg, var(--line) 0 1px, transparent 1px 24px) 10px 0 / calc(100% - 20px) 10px no-repeat,
      repeating-linear-gradient(90deg, var(--line) 0 1px, transparent 1px 24px) 10px 100% / calc(100% - 20px) 10px no-repeat,
      repeating-linear-gradient(0deg, var(--line) 0 1px, transparent 1px 24px) 0 10px / 10px calc(100% - 20px) no-repeat,
      repeating-linear-gradient(0deg, var(--line) 0 1px, transparent 1px 24px) 100% 10px / 10px calc(100% - 20px) no-repeat;
  }
  .plate-deg {
    position: absolute; font-size: 8.5px; letter-spacing: 0.12em;
    color: var(--muted); background: var(--bg); padding: 1px 5px; z-index: 3;
  }
  .plate-deg.nw { top: -7px; left: 18px; }
  .plate-deg.ne { top: -7px; right: 18px; }
  .plate-deg.sw { bottom: -7px; left: 18px; }
  .plate-deg.se { bottom: -7px; right: 18px; }
  .pa-plate { width: 100%; height: clamp(320px, 46vh, 480px); display: block; }
  .rose {
    position: absolute; top: 24px; right: 24px;
    width: clamp(64px, 9vw, 96px);
    color: var(--ink); cursor: grab; touch-action: none; opacity: 0.88; z-index: 4;
  }
  .rose:active { cursor: grabbing; }
  .rose-spin { transform: rotate(var(--bearing, 0deg)); transform-origin: 50% 50%; }
  .rose text { font-family: var(--font-fig); font-style: italic; fill: currentColor; }
  .pa-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
</style>
