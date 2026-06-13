<script lang="ts">
  /**
   * Peta Piksel: every day a single pixel. Years run down the side, the day
   * of the year runs across, colour is the value. One canvas, any daily
   * series — deforestation, air, the rupiah. The sample series is
   * deterministic (seeded), shaped like the real feed will pour in.
   */
  import { onMount } from 'svelte';
  import { rngFrom } from '../lib/seed';
  import { reducedMotion } from '../lib/motion';

  interface Props {
    judul: string;
    dek: string;
    satuan: string;
    sumber: string;
    tahunMulai?: number;
    seed?: string;
    /** seasonal peak day-of-year (0..364) and trend per year */
    puncak?: number;
    tren?: number;
    dasar?: number;
    goyang?: number;
  }
  let {
    judul, dek, satuan, sumber,
    tahunMulai = 2015, seed = 'piksel', puncak = 250, tren = 0.06, dasar = 30, goyang = 0.5,
  }: Props = $props();

  const TAHUN_INI = 2026;
  const tahunList = Array.from({ length: TAHUN_INI - tahunMulai + 1 }, (_, i) => tahunMulai + i);
  const HARI_INI = 163; // day-of-year for mid-June, the edition date

  let canvas: HTMLCanvasElement;
  let hover = $state<{ tahun: number; hari: number; nilai: number; x: number; y: number } | null>(null);
  let maxNilai = 1;

  function seri(): number[][] {
    const rng = rngFrom(seed);
    const out: number[][] = [];
    for (let yi = 0; yi < tahunList.length; yi++) {
      const row: number[] = [];
      for (let d = 0; d < 365; d++) {
        // gaussian seasonal bump around the dry-season peak + rising trend + noise
        const musim = Math.exp(-((d - puncak) ** 2) / (2 * 70 ** 2));
        const v = dasar * (1 + tren * yi) * (0.4 + musim * 3) * (1 + (rng() - 0.5) * 2 * goyang);
        row.push(Math.max(0, v));
      }
      out.push(row);
    }
    return out;
  }
  const data = seri();
  maxNilai = Math.max(...data.flat());

  // warm dither ramp: paper -> gold -> service orange -> deep ember
  function warna(v: number): string {
    const t = Math.min(1, v / maxNilai);
    if (t < 0.04) return '#1a1815';
    const stops = [
      [40, 38, 33], [120, 96, 60], [205, 120, 40], [228, 74, 6], [150, 28, 10],
    ];
    const p = t * (stops.length - 1);
    const i = Math.min(stops.length - 2, Math.floor(p));
    const f = p - i;
    const a = stops[i]!, b = stops[i + 1]!;
    return `rgb(${Math.round(a[0]! + (b[0]! - a[0]!) * f)},${Math.round(a[1]! + (b[1]! - a[1]!) * f)},${Math.round(a[2]! + (b[2]! - a[2]!) * f)})`;
  }

  let cellW = 0, cellH = 0, padL = 44, padT = 6;
  function draw(reveal = 1) {
    const w = canvas.clientWidth;
    const rows = tahunList.length;
    cellH = Math.max(6, Math.min(16, (w - padL) / 365 * 4));
    const h = padT + rows * (cellH + 2);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    cellW = (w - padL) / 365;
    const shownRows = Math.ceil(rows * reveal);
    for (let yi = 0; yi < shownRows; yi++) {
      const y = padT + yi * (cellH + 2);
      ctx.font = '9px Geist Mono, monospace';
      ctx.fillStyle = '#8f897c';
      ctx.fillText(String(tahunList[yi]), 4, y + cellH - 1);
      for (let d = 0; d < 365; d++) {
        ctx.fillStyle = warna(data[yi]![d]!);
        ctx.fillRect(padL + d * cellW, y, Math.max(1, cellW - 0.3), cellH);
      }
    }
    // today's column marker
    const tx = padL + HARI_INI * cellW;
    ctx.strokeStyle = '#cdb47a';
    ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.moveTo(tx, padT); ctx.lineTo(tx, padT + shownRows * (cellH + 2)); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function onMove(e: PointerEvent) {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const d = Math.floor((x - padL) / cellW);
    const yi = Math.floor((y - padT) / (cellH + 2));
    if (d < 0 || d >= 365 || yi < 0 || yi >= tahunList.length) { hover = null; return; }
    hover = { tahun: tahunList[yi]!, hari: d + 1, nilai: data[yi]![d]!, x: e.clientX, y: e.clientY };
  }

  const fmt = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
  const totalTahunIni = Math.round(data.at(-1)!.slice(0, HARI_INI).reduce((a, b) => a + b, 0));

  onMount(() => {
    if (reducedMotion()) { draw(1); }
    else {
      let p = 0;
      const tick = () => { p += 0.04; draw(Math.min(1, p)); if (p < 1) requestAnimationFrame(tick); };
      const io = new IntersectionObserver(([en]) => { if (en?.isIntersecting) { requestAnimationFrame(tick); io.disconnect(); } }, { threshold: 0.3 });
      io.observe(canvas);
    }
    const ro = new ResizeObserver(() => draw(1));
    ro.observe(canvas);
    return () => ro.disconnect();
  });
</script>

<section class="pp-blok" data-no-stempel>
  <div class="pp-head">
    <h3 class="pp-judul display">{judul}</h3>
    <span class="pp-total mono">{fmt.format(totalTahunIni)} {satuan} tahun ini</span>
  </div>
  <p class="pp-dek">{dek}</p>
  <canvas bind:this={canvas} onpointermove={onMove} onpointerleave={() => (hover = null)} aria-label={judul}></canvas>
  <div class="pp-foot mono">
    <div class="pp-ramp" aria-hidden="true"></div>
    <span>RENDAH → TINGGI · GARIS EMAS: HARI INI</span>
    <button class="chip"><span class="tick">⊙</span>{sumber}</button>
  </div>
</section>

{#if hover}
  <div class="pp-tip mono" style={`transform: translate(${hover.x}px, ${hover.y - 16}px)`}>
    {hover.tahun} · hari ke-{hover.hari} · <b>{fmt.format(Math.round(hover.nilai))} {satuan}</b>
  </div>
{/if}

<style>
  .pp-blok { display: grid; gap: 12px; }
  .pp-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; flex-wrap: wrap; }
  .pp-judul { font-family: 'Fraunces Variable', serif; font-weight: 360; font-size: clamp(22px, 3vw, 34px); }
  .pp-total { font-size: 11px; letter-spacing: 0.1em; color: var(--accent); }
  .pp-dek { font-size: 14.5px; color: var(--muted); max-width: 60ch; line-height: 1.55; }
  canvas { width: 100%; display: block; cursor: crosshair; }
  .pp-foot { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; font-size: 8.5px; letter-spacing: 0.14em; color: var(--muted); }
  .pp-ramp { width: 120px; height: 8px; background: linear-gradient(90deg, #1a1815, #78603c, #cd7828, #e44a06, #961c0a); }
  .pp-tip {
    position: fixed; left: 0; top: 0; z-index: 130; pointer-events: none;
    background: var(--ink); color: var(--bg); font-size: 11px; padding: 5px 9px;
    white-space: nowrap; translate: -50% -100%;
  }
  .pp-tip b { color: #cdb47a; }
</style>
