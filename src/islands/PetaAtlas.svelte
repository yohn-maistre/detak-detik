<script lang="ts">
  /**
   * Peta Atlas: MapLibre over OpenFreeMap vector tiles (keyless, free),
   * skinned as a 19th-century atlas plate: paper land, sage coastlines,
   * madder dashed boundaries, sparse engraved labels. The map is one more
   * listener on the command bus: fly_to works the same for a click, a tour,
   * or the agent. Compass rose is the fidget: drag to spin, it springs north.
   *
   * The plate never goes blank: an engraved Nusantara (hatched land, stippled
   * sea) renders instantly and stays up until tiles actually arrive — and
   * comes back if the network drops them.
   */
  import { onMount } from 'svelte';
  import { REGIONS } from '../lib/data/edisi';
  import { GRID_COLS, GRID_ROWS, field } from '../lib/nusantara';
  import { on, dispatch } from '../lib/commands/dispatcher';
  import { gsap, reducedMotion } from '../lib/motion';

  let mapEl: HTMLDivElement;
  let engraveEl: HTMLCanvasElement;
  let roseEl: SVGSVGElement;
  let koordinat = $state('2.00°LS · 118.00°BT');
  let aktif = $state('');
  let petaSiap = $state(false);
  let petaGagal = $state(false);

  const ATLAS_STYLE = {
    version: 8 as const,
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: {
      ofm: { type: 'vector' as const, url: 'https://tiles.openfreemap.org/planet' },
    },
    layers: [
      { id: 'bg', type: 'background' as const, paint: { 'background-color': '#ece1c9' } },
      {
        id: 'water', type: 'fill' as const, source: 'ofm', 'source-layer': 'water',
        paint: { 'fill-color': '#ddd2b6' },
      },
      {
        id: 'coast', type: 'line' as const, source: 'ofm', 'source-layer': 'water',
        paint: { 'line-color': '#4c7a5e', 'line-width': 1.1, 'line-opacity': 0.85 },
      },
      {
        id: 'rivers', type: 'line' as const, source: 'ofm', 'source-layer': 'waterway',
        minzoom: 7,
        paint: { 'line-color': '#4c7a5e', 'line-width': 0.6, 'line-opacity': 0.5 },
      },
      {
        id: 'batas-prov', type: 'line' as const, source: 'ofm', 'source-layer': 'boundary',
        filter: ['==', ['get', 'admin_level'], 4],
        paint: { 'line-color': '#b4543c', 'line-width': 0.8, 'line-dasharray': [3, 3], 'line-opacity': 0.7 },
      },
      {
        id: 'batas-negara', type: 'line' as const, source: 'ofm', 'source-layer': 'boundary',
        filter: ['==', ['get', 'admin_level'], 2],
        paint: { 'line-color': '#2a241c', 'line-width': 1, 'line-dasharray': [6, 2, 1, 2], 'line-opacity': 0.8 },
      },
      {
        id: 'kota', type: 'symbol' as const, source: 'ofm', 'source-layer': 'place',
        filter: ['in', ['get', 'class'], ['literal', ['city', 'town']]],
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans Regular'],
          'text-size': 11,
          'text-letter-spacing': 0.12,
          'text-transform': 'uppercase' as const,
          'text-max-width': 8,
        },
        paint: { 'text-color': '#2a241c', 'text-halo-color': '#ece1c9', 'text-halo-width': 1.2 },
      },
    ],
  };

  /** The engraved fallback plate: hatched land, faint coast, stippled sea. */
  function drawEngraving() {
    const w = engraveEl.clientWidth;
    const h = engraveEl.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    engraveEl.width = Math.round(w * dpr);
    engraveEl.height = Math.round(h * dpr);
    const ctx = engraveEl.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = '#ece1c9';
    ctx.fillRect(0, 0, w, h);

    // fit grid into the plate, centered, with a little margin
    const scale = Math.min((w * 0.92) / GRID_COLS, (h * 0.92) / GRID_ROWS);
    const ox = (w - GRID_COLS * scale) / 2;
    const oy = (h - GRID_ROWS * scale) / 2;
    const g = (px: number, py: number) => field((px - ox) / scale, (py - oy) / scale);

    // stippled sea
    ctx.fillStyle = 'rgba(76, 122, 94, 0.30)';
    for (let py = 4; py < h; py += 11) {
      for (let px = ((py / 11) % 2) * 5 + 3; px < w; px += 11) {
        if (g(px, py) < 0.3) ctx.fillRect(px, py, 1.1, 1.1);
      }
    }

    // hatched land: 45° strokes clipped to the field
    ctx.strokeStyle = 'rgba(42, 36, 28, 0.5)';
    ctx.lineWidth = 0.7;
    const step = 4.5;
    for (let d = -h; d < w + h; d += step) {
      let pen = false;
      ctx.beginPath();
      for (let t = 0; t <= h; t += 2) {
        const px = d + t;
        const py = t;
        if (px < 0 || px > w) continue;
        const land = g(px, py) > 0.45;
        if (land && !pen) { ctx.moveTo(px, py); pen = true; }
        else if (land && pen) { ctx.lineTo(px, py); }
        else if (!land && pen) { pen = false; }
      }
      ctx.stroke();
    }

    // coastline: dense sampling of the field's shoreline band
    ctx.fillStyle = '#4c7a5e';
    for (let py = 0; py < h; py += 1.6) {
      for (let px = 0; px < w; px += 1.6) {
        const v = g(px, py);
        if (v > 0.42 && v < 0.49) ctx.fillRect(px, py, 1.2, 1.2);
      }
    }

    // graticule
    ctx.strokeStyle = 'rgba(42, 36, 28, 0.14)';
    ctx.lineWidth = 0.6;
    for (let i = 1; i < 6; i++) {
      const px = (w / 6) * i;
      ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, h); ctx.stroke();
    }
    for (let i = 1; i < 4; i++) {
      const py = (h / 4) * i;
      ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(w, py); ctx.stroke();
    }

    ctx.font = '10px Geist Mono, monospace';
    ctx.fillStyle = 'rgba(42, 36, 28, 0.55)';
    ctx.fillText('PLAT SEMENTARA · MENUNGGU UBIN PETA', 14, h - 14);
  }

  onMount(() => {
    let map: import('maplibre-gl').Map | undefined;
    let marker: import('maplibre-gl').Marker | undefined;
    let unsub = () => {};
    let cancelled = false;

    drawEngraving();
    const ro = new ResizeObserver(() => { if (!petaSiap) drawEngraving(); });
    ro.observe(engraveEl);

    (async () => {
      const maplibregl = (await import('maplibre-gl')).default;
      await import('maplibre-gl/dist/maplibre-gl.css');
      if (cancelled) return;

      map = new maplibregl.Map({
        container: mapEl,
        style: ATLAS_STYLE as never,
        center: [118, -2.6],
        zoom: 4.2,
        attributionControl: { compact: true },
        cooperativeGestures: true,
        fadeDuration: 150,
      });

      // a dark source is a note in the margin, never a broken page
      map.on('error', (e) => {
        if (String(e?.error?.message ?? '').match(/Failed to fetch|403|NetworkError|AJAXError/i)) {
          petaGagal = true;
          petaSiap = false;
        }
      });
      map.on('sourcedata', (e) => {
        if (e.isSourceLoaded && map!.areTilesLoaded()) {
          petaSiap = true;
          petaGagal = false;
        }
      });

      map.on('move', () => {
        const c = map!.getCenter();
        koordinat = `${Math.abs(c.lat).toFixed(2)}°${c.lat < 0 ? 'LS' : 'LU'} · ${c.lng.toFixed(2)}°BT`;
        if (roseEl && !roseDragging) {
          roseEl.style.setProperty('--bearing', `${-map!.getBearing()}deg`);
        }
      });

      // ambient drift: the idle breath of the front-page photograph
      if (!reducedMotion()) {
        let drift: number;
        const breathe = () => {
          if (!map || map.isMoving()) { drift = window.setTimeout(breathe, 4000); return; }
          map.easeTo({ center: [map.getCenter().lng + 0.18, map.getCenter().lat], duration: 8000, easing: (t) => t });
          drift = window.setTimeout(breathe, 9000);
        };
        drift = window.setTimeout(breathe, 5000);
        map.on('remove', () => clearTimeout(drift));
      }

      const seal = document.createElement('div');
      seal.className = 'peta-seal';
      marker = new maplibregl.Marker({ element: seal }).setLngLat([136.565, -4.543]);

      unsub = on('fly_to', (p) => {
        if (!map) return;
        let target = p.kode ? REGIONS.find((r) => r.kode === p.kode) : undefined;
        const lon = target?.lon ?? p.lon;
        const lat = target?.lat ?? p.lat;
        if (lon == null || lat == null) return;
        aktif = target?.kode ?? '';
        marker!.setLngLat([lon, lat]).addTo(map);
        map.flyTo({ center: [lon, lat], zoom: target?.zoom ?? p.zoom ?? 8, speed: 0.9, curve: 1.6 });
      });
    })();

    return () => {
      cancelled = true;
      unsub();
      ro.disconnect();
      map?.remove();
    };
  });

  /* compass rose fidget */
  let roseDragging = false;
  let roseAngle = 0;
  function roseDown(e: PointerEvent) {
    roseDragging = true;
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
      roseDragging = false;
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

  function terbang(kode: string) {
    dispatch({ cmd: 'fly_to', params: { kode } });
  }
</script>

<div class="peta-wrap" data-no-stempel>
  <div class="plate" class:siap={petaSiap}>
    <span class="plate-deg mono nw">6°LU</span>
    <span class="plate-deg mono ne">141°BT</span>
    <span class="plate-deg mono sw">95°BT</span>
    <span class="plate-deg mono se">11°LS</span>
    <div class="peta" bind:this={mapEl}></div>
    <canvas class="engrave" bind:this={engraveEl} aria-hidden="true"></canvas>

    <svg
      bind:this={roseEl}
      class="rose"
      viewBox="0 0 100 100"
      onpointerdown={roseDown}
      role="img"
      aria-label="Mawar kompas, bisa diputar"
    >
      <g class="rose-spin">
        <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" stroke-width="0.8" />
        <circle cx="50" cy="50" r="34" fill="none" stroke="currentColor" stroke-width="0.4" />
        {#each Array.from({ length: 16 }) as _, i}
          <line
            x1="50" y1={i % 4 === 0 ? 10 : 13.5} x2="50" y2="17.5"
            stroke="currentColor" stroke-width={i % 4 === 0 ? 1.2 : 0.5}
            transform="rotate({i * 22.5} 50 50)"
          />
        {/each}
        <path d="M50 12 L53.5 50 L50 88 L46.5 50 Z" fill="currentColor" opacity="0.85" />
        <path d="M12 50 L50 46.5 L88 50 L50 53.5 Z" fill="currentColor" opacity="0.5" />
        <path d="M50 12 L52.5 47 L50 50 L47.5 47 Z" fill="#b4543c" />
        <text x="50" y="8" text-anchor="middle" font-size="9">U</text>
      </g>
    </svg>

    <div class="peta-koordinat mono">{koordinat}</div>

    {#if petaGagal}
      <div class="peta-gagal mono">UBIN PETA TIDAK TERJANGKAU · PLAT UKIRAN MENGGANTIKAN · SUMBER: TILES.OPENFREEMAP.ORG</div>
    {/if}
  </div>

  <div class="peta-chips">
    {#each REGIONS.slice(0, 4) as r (r.kode)}
      <button class="chip" class:aktif={aktif === r.kode} onclick={() => terbang(r.kode)}>
        ✈ {r.nama}
      </button>
    {/each}
  </div>
</div>

<style>
  .peta-wrap { position: relative; }
  .plate {
    position: relative;
    outline: 1px solid var(--line);
    outline-offset: 6px;
    border: 1px solid var(--line);
    /* the degree-tick ruler band around the plate */
    padding: 10px;
    background:
      repeating-linear-gradient(90deg, var(--line) 0 1px, transparent 1px 24px) 10px 0 / calc(100% - 20px) 10px no-repeat,
      repeating-linear-gradient(90deg, var(--line) 0 1px, transparent 1px 24px) 10px 100% / calc(100% - 20px) 10px no-repeat,
      repeating-linear-gradient(0deg, var(--line) 0 1px, transparent 1px 24px) 0 10px / 10px calc(100% - 20px) no-repeat,
      repeating-linear-gradient(0deg, var(--line) 0 1px, transparent 1px 24px) 100% 10px / 10px calc(100% - 20px) no-repeat;
  }
  .plate-deg {
    position: absolute;
    font-size: 8.5px;
    letter-spacing: 0.12em;
    color: var(--muted);
    background: var(--bg);
    padding: 1px 5px;
    z-index: 3;
  }
  .plate-deg.nw { top: -7px; left: 18px; }
  .plate-deg.ne { top: -7px; right: 18px; }
  .plate-deg.sw { bottom: -7px; left: 18px; }
  .plate-deg.se { bottom: -7px; right: 18px; }
  .peta {
    width: 100%;
    height: clamp(420px, 64vh, 640px);
    filter: saturate(0.92);
  }
  .engrave {
    position: absolute;
    inset: 10px;
    width: calc(100% - 20px);
    height: calc(100% - 20px);
    pointer-events: none;
    opacity: 1;
    transition: opacity 0.9s var(--ease-out);
    z-index: 2;
  }
  .plate.siap .engrave { opacity: 0; }
  .rose {
    position: absolute;
    top: 24px;
    right: 24px;
    width: clamp(64px, 9vw, 96px);
    color: var(--ink);
    cursor: grab;
    touch-action: none;
    opacity: 0.88;
    z-index: 4;
  }
  .rose:active { cursor: grabbing; }
  .rose-spin { transform: rotate(var(--bearing, 0deg)); transform-origin: 50% 50%; }
  .rose text { font-family: var(--font-fig); font-style: italic; fill: currentColor; }
  .peta-koordinat {
    position: absolute;
    left: 24px;
    bottom: 24px;
    font-size: 10.5px;
    letter-spacing: 0.14em;
    color: var(--ink);
    background: color-mix(in oklab, var(--bg) 82%, transparent);
    padding: 5px 9px;
    border: 1px solid var(--line);
    z-index: 4;
  }
  .peta-gagal {
    position: absolute;
    left: 50%;
    bottom: 24px;
    transform: translateX(-50%);
    font-size: 9.5px;
    letter-spacing: 0.16em;
    color: var(--muted);
    border: 1px dashed var(--line);
    padding: 8px 14px;
    text-align: center;
    max-width: 86%;
    background: color-mix(in oklab, var(--bg) 80%, transparent);
    z-index: 4;
  }
  .peta-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
  .chip.aktif { border-color: var(--accent2); color: var(--accent2); }
  :global(.peta-seal) {
    width: 22px;
    height: 22px;
    border: 2px solid #b4543c;
    border-radius: 50%;
    box-shadow: inset 0 0 0 3px #ece1c9, inset 0 0 0 5px #b4543c;
    opacity: 0.9;
  }
  :global(.maplibregl-ctrl-attrib) { font-family: var(--font-mono); font-size: 9px; background: transparent !important; }
</style>
