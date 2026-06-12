<script lang="ts">
  /**
   * Peta Kabar: the front photograph of the paper, except it is a living
   * map. MapLibre in the Dinas skin, three plates (atlas vector, satellite,
   * weather radar), and data layers driven by the command bus — set_layer
   * and set_basemap work the same for a tap, a tour, or Aksara. The first
   * live layer is BMKG earthquakes (keyless public JSON); dark feeds
   * degrade to a Data Hilang note, never a broken page.
   */
  import { onMount } from 'svelte';
  import { REGIONS } from '../lib/data/edisi';
  import { on, dispatch } from '../lib/commands/dispatcher';
  import { drawEngraving, ENGRAVE_DINAS } from '../lib/engrave';
  import { reducedMotion } from '../lib/motion';

  let mapEl: HTMLDivElement;
  let engraveEl: HTMLCanvasElement;
  let koordinat = $state('2.60°LS · 118.00°BT');
  let petaSiap = $state(false);
  let plat = $state<'atlas' | 'satelit' | 'cuaca'>('atlas');
  let cuacaSiap = $state<boolean | null>(null);
  let legendaBuka = $state(false);
  let gempaOn = $state(true);
  let gempaLive = $state(false);
  let infoGempa = $state('');
  let aktif = $state('');

  /* sample fallback, marked contoh, so the layer always demonstrates */
  const GEMPA_CONTOH = [
    { mag: 4.8, lon: 127.6, lat: 1.2, wilayah: '38 km tenggara Halmahera Barat', jam: '03.12 WIT' },
    { mag: 5.3, lon: 130.2, lat: -3.4, wilayah: 'Laut Banda', jam: '22.41 WIT' },
    { mag: 4.1, lon: 99.9, lat: 1.6, wilayah: 'Padang Sidempuan', jam: '19.05 WIB' },
    { mag: 3.9, lon: 119.8, lat: -8.5, wilayah: 'Sumbawa', jam: '14.27 WITA' },
    { mag: 4.5, lon: 140.1, lat: -2.9, wilayah: 'Jayapura', jam: '06.51 WIT' },
  ];

  const DINAS_STYLE = {
    version: 8 as const,
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: { ofm: { type: 'vector' as const, url: 'https://tiles.openfreemap.org/planet' } },
    layers: [
      { id: 'bg', type: 'background' as const, paint: { 'background-color': '#d6cbac' } },
      { id: 'water', type: 'fill' as const, source: 'ofm', 'source-layer': 'water', paint: { 'fill-color': '#c5b893' } },
      { id: 'coast', type: 'line' as const, source: 'ofm', 'source-layer': 'water', paint: { 'line-color': '#15130e', 'line-width': 0.9, 'line-opacity': 0.55 } },
      {
        id: 'batas-prov', type: 'line' as const, source: 'ofm', 'source-layer': 'boundary',
        filter: ['==', ['get', 'admin_level'], 4],
        paint: { 'line-color': '#15130e', 'line-width': 0.6, 'line-dasharray': [2, 3], 'line-opacity': 0.4 },
      },
      {
        id: 'kota', type: 'symbol' as const, source: 'ofm', 'source-layer': 'place',
        filter: ['in', ['get', 'class'], ['literal', ['city', 'town']]],
        layout: {
          'text-field': ['get', 'name'], 'text-font': ['Noto Sans Regular'], 'text-size': 10.5,
          'text-letter-spacing': 0.12, 'text-transform': 'uppercase' as const, 'text-max-width': 8,
        },
        paint: { 'text-color': '#15130e', 'text-halo-color': '#d6cbac', 'text-halo-width': 1.2 },
      },
    ],
  };

  const SATELIT_STYLE = {
    version: 8 as const,
    sources: {
      esri: {
        type: 'raster' as const,
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        attribution: 'Citra: Esri, Maxar, Earthstar Geographics',
      },
    },
    layers: [{ id: 'sat', type: 'raster' as const, source: 'esri' }],
  };

  let map: import('maplibre-gl').Map | undefined;
  let marker: import('maplibre-gl').Marker | undefined;
  let radarTs: number | null = null;

  function gempaGeojson(rows: typeof GEMPA_CONTOH) {
    return {
      type: 'FeatureCollection' as const,
      features: rows.map((g) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [g.lon, g.lat] },
        properties: { mag: g.mag, wilayah: g.wilayah, jam: g.jam },
      })),
    };
  }

  let gempaData = gempaGeojson(GEMPA_CONTOH);

  function addDataLayers() {
    if (!map) return;
    if (!map.getSource('gempa')) {
      map.addSource('gempa', { type: 'geojson', data: gempaData });
    }
    if (!map.getLayer('gempa-dot')) {
      map.addLayer({
        id: 'gempa-dot',
        type: 'circle',
        source: 'gempa',
        layout: { visibility: gempaOn ? 'visible' : 'none' },
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['get', 'mag'], 3, 4, 7, 16],
          'circle-color': '#e44a06',
          'circle-opacity': 0.55,
          'circle-stroke-color': plat === 'satelit' ? '#f2efe6' : '#15130e',
          'circle-stroke-width': 1.2,
        },
      });
    }
    if (plat === 'cuaca' && radarTs && !map.getLayer('radar')) {
      map.addSource('radar', {
        type: 'raster',
        tiles: [`https://tilecache.rainviewer.com/v2/radar/${radarTs}/256/{z}/{x}/{y}/2/1_1.png`],
        tileSize: 256,
        attribution: 'Radar: RainViewer',
      });
      map.addLayer({ id: 'radar', type: 'raster', source: 'radar', paint: { 'raster-opacity': 0.6 } });
    }
  }

  function applyBasemap(p: typeof plat) {
    plat = p;
    if (!map) return;
    map.setStyle((p === 'satelit' ? SATELIT_STYLE : DINAS_STYLE) as never);
    map.once('styledata', () => addDataLayers());
  }

  function toggleGempa(onState: boolean) {
    gempaOn = onState;
    if (map?.getLayer('gempa-dot')) {
      map.setLayoutProperty('gempa-dot', 'visibility', onState ? 'visible' : 'none');
    }
  }

  onMount(() => {
    let unsubs: (() => void)[] = [];
    let cancelled = false;

    drawEngraving(engraveEl, { ...ENGRAVE_DINAS, caption: 'PLAT KABAR · MENUNGGU UBIN PETA' });
    const ro = new ResizeObserver(() => { if (!petaSiap) drawEngraving(engraveEl, ENGRAVE_DINAS); });
    ro.observe(engraveEl);

    // live feeds: BMKG quakes + RainViewer timestamps, both best-effort
    (async () => {
      try {
        const res = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json', { signal: AbortSignal.timeout(6000) });
        const data = (await res.json()) as { Infogempa?: { gempa?: { Coordinates: string; Magnitude: string; Wilayah: string; Jam: string }[] } };
        const rows = (data.Infogempa?.gempa ?? []).slice(0, 12).map((g) => {
          const [lat, lon] = g.Coordinates.split(',').map(Number);
          return { mag: Number(g.Magnitude), lon: lon!, lat: lat!, wilayah: g.Wilayah, jam: g.Jam };
        }).filter((g) => Number.isFinite(g.lon) && Number.isFinite(g.lat));
        if (rows.length) {
          gempaData = gempaGeojson(rows);
          gempaLive = true;
          infoGempa = `M${rows[0]!.mag} · ${rows[0]!.wilayah} · ${rows[0]!.jam}`;
          (map?.getSource('gempa') as { setData?: (d: unknown) => void } | undefined)?.setData?.(gempaData);
        }
      } catch { /* contoh layer stands in; the chip says so */ }
      try {
        const res = await fetch('https://api.rainviewer.com/public/weather-maps.json', { signal: AbortSignal.timeout(6000) });
        const data = (await res.json()) as { radar?: { past?: { time: number }[] } };
        radarTs = data.radar?.past?.at(-1)?.time ?? null;
        cuacaSiap = radarTs != null;
      } catch { cuacaSiap = false; }
    })();

    (async () => {
      const maplibregl = (await import('maplibre-gl')).default;
      await import('maplibre-gl/dist/maplibre-gl.css');
      if (cancelled) return;

      map = new maplibregl.Map({
        container: mapEl,
        style: DINAS_STYLE as never,
        center: [118, -2.6],
        zoom: 4.0,
        attributionControl: { compact: true },
        cooperativeGestures: true,
        fadeDuration: 150,
      });

      map.on('sourcedata', (e) => {
        if (e.isSourceLoaded && map!.areTilesLoaded()) petaSiap = true;
      });
      map.on('load', () => addDataLayers());
      map.on('move', () => {
        const c = map!.getCenter();
        koordinat = `${Math.abs(c.lat).toFixed(2)}°${c.lat < 0 ? 'LS' : 'LU'} · ${c.lng.toFixed(2)}°BT`;
      });
      map.on('click', 'gempa-dot', (e) => {
        const p = e.features?.[0]?.properties as { mag?: number; wilayah?: string; jam?: string } | undefined;
        if (p) infoGempa = `M${p.mag} · ${p.wilayah} · ${p.jam}`;
      });

      if (!reducedMotion()) {
        let drift: number;
        const breathe = () => {
          if (!map || map.isMoving()) { drift = window.setTimeout(breathe, 4000); return; }
          map.easeTo({ center: [map.getCenter().lng + 0.15, map.getCenter().lat], duration: 8000, easing: (t) => t });
          drift = window.setTimeout(breathe, 9000);
        };
        drift = window.setTimeout(breathe, 6000);
        map.on('remove', () => clearTimeout(drift));
      }

      const seal = document.createElement('div');
      seal.className = 'kabar-seal';
      marker = new maplibregl.Marker({ element: seal }).setLngLat([136.565, -4.543]);

      unsubs.push(on('fly_to', (p) => {
        if (!map) return;
        const target = p.kode ? REGIONS.find((r) => r.kode === p.kode) : undefined;
        const lon = target?.lon ?? p.lon;
        const lat = target?.lat ?? p.lat;
        if (lon == null || lat == null) return;
        aktif = target?.kode ?? '';
        marker!.setLngLat([lon, lat]).addTo(map);
        map.flyTo({ center: [lon, lat], zoom: target?.zoom ?? p.zoom ?? 8, speed: 0.9, curve: 1.6 });
      }));
      unsubs.push(on('set_basemap', ({ plat: p }) => {
        if (p === 'cuaca' && !radarTs) return;
        applyBasemap(p);
      }));
      unsubs.push(on('set_layer', ({ layer, on: onState }) => {
        if (layer === 'gempa') toggleGempa(onState);
      }));
    })();

    return () => {
      cancelled = true;
      unsubs.forEach((u) => u());
      ro.disconnect();
      map?.remove();
    };
  });

  const pilihPlat = (p: typeof plat) => dispatch({ cmd: 'set_basemap', params: { plat: p } });
  const terbang = (kode: string) => dispatch({ cmd: 'fly_to', params: { kode } });
</script>

<div class="kb-wrap" data-no-stempel id="peta">
  <div class="kb-tabs mono" role="tablist" aria-label="Pilihan plat dasar">
    <span class="kb-tabs-label">PLAT</span>
    <button class="kb-tab" class:aktif={plat === 'atlas'} onclick={() => pilihPlat('atlas')}>ATLAS</button>
    <button class="kb-tab" class:aktif={plat === 'satelit'} onclick={() => pilihPlat('satelit')}>SATELIT</button>
    <button class="kb-tab" class:aktif={plat === 'cuaca'} disabled={cuacaSiap === false} onclick={() => pilihPlat('cuaca')}>
      CUACA{cuacaSiap === false ? ' ✕' : ''}
    </button>
  </div>

  <div class="kb-plate">
    <div class="kb-peta" bind:this={mapEl}></div>
    <canvas class="kb-engrave" class:siap={petaSiap} bind:this={engraveEl} aria-hidden="true"></canvas>

    <div class="kb-legenda mono" class:buka={legendaBuka}>
      <button class="kb-leg-head" onclick={() => (legendaBuka = !legendaBuka)} aria-expanded={legendaBuka}>
        LEGENDA {legendaBuka ? '▾' : '▸'}
      </button>
      {#if legendaBuka}
        <div class="kb-leg-rows">
          <label class="kb-leg-row">
            <input type="checkbox" checked={gempaOn} onchange={(e) => dispatch({ cmd: 'set_layer', params: { layer: 'gempa', on: e.currentTarget.checked } })} />
            <span class="sym gempa">◉</span> GEMPA · 24 JAM
            <span class="src">{gempaLive ? 'BMKG · LANGSUNG' : 'CONTOH'}</span>
          </label>
          {#each [['▒', 'HUTAN · GFW'], ['◍', 'UDARA · AQI'], ['▲', 'GUNUNG API'], ['✚', 'BENCANA · BNPB']] as [sym, nama]}
            <div class="kb-leg-row mati">
              <span class="sym">{sym}</span> {nama} <span class="src">SEGERA</span>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <div class="kb-koordinat mono">{koordinat}</div>
  </div>

  {#if plat === 'cuaca'}
    <div class="kb-info mono">▦ RADAR HUJAN 10 MENIT TERAKHIR · RAINVIEWER — BILA TIDAK ADA HUJAN, PLAT TAMPAK BERSIH</div>
  {/if}
  {#if infoGempa}
    <div class="kb-info mono"><span class="dot">◉</span> {infoGempa} <span class="src">{gempaLive ? 'BMKG · LANGSUNG' : 'DATA CONTOH'}</span></div>
  {/if}

  <div class="kb-chips">
    {#each REGIONS.slice(0, 4) as r (r.kode)}
      <button class="chip" class:aktif={aktif === r.kode} onclick={() => terbang(r.kode)}>✈ {r.nama}</button>
    {/each}
  </div>
</div>

<style>
  .kb-wrap { position: relative; }
  .kb-plate {
    position: relative;
    border: 1px solid var(--line);
    box-shadow: 0 0 0 1px var(--line), inset 0 0 0 1px color-mix(in oklab, var(--line) 30%, transparent);
  }
  .kb-peta { width: 100%; height: clamp(360px, 56vh, 560px); filter: saturate(0.94); }
  .kb-engrave {
    position: absolute; inset: 0; width: 100%; height: 100%;
    pointer-events: none; opacity: 1; transition: opacity 0.9s var(--ease-out); z-index: 2;
  }
  .kb-engrave.siap { opacity: 0; }

  .kb-tabs {
    display: inline-flex; align-items: stretch;
    border: 1px solid var(--line);
    background: var(--card);
    font-size: 9.5px; letter-spacing: 0.14em;
    margin-bottom: 10px;
  }
  .kb-tabs-label { padding: 6px 8px; color: var(--muted); border-right: 1px solid var(--line); }
  .kb-tab {
    background: none; border: none; border-right: 1px solid var(--line);
    padding: 6px 10px; font: inherit; letter-spacing: inherit; color: var(--ink); cursor: pointer;
  }
  .kb-tab:last-child { border-right: none; }
  .kb-tab.aktif { background: var(--ink); color: var(--bg); }
  .kb-tab:disabled { color: var(--muted); cursor: not-allowed; }

  .kb-legenda {
    position: absolute; top: 12px; right: 12px; z-index: 4;
    border: 1px solid var(--line);
    background: color-mix(in oklab, var(--bg) 90%, transparent);
    font-size: 9.5px; letter-spacing: 0.12em;
    max-width: 230px;
  }
  .kb-leg-head {
    display: block; width: 100%; text-align: left;
    background: none; border: none; cursor: pointer;
    padding: 6px 10px; font: inherit; letter-spacing: inherit; color: var(--ink);
  }
  .kb-leg-rows { border-top: 1px solid var(--line); padding: 6px 10px 8px; display: grid; gap: 6px; }
  .kb-leg-row { display: flex; align-items: center; gap: 7px; color: var(--ink); cursor: pointer; }
  .kb-leg-row.mati { color: var(--muted); cursor: default; }
  .kb-leg-row input { accent-color: var(--accent); width: 11px; height: 11px; }
  .sym { width: 12px; text-align: center; }
  .sym.gempa { color: var(--accent); }
  .src { margin-left: auto; font-size: 8px; color: var(--muted); letter-spacing: 0.16em; }

  .kb-koordinat {
    position: absolute; left: 12px; bottom: 12px; z-index: 4;
    font-size: 10px; letter-spacing: 0.14em; color: var(--ink);
    background: color-mix(in oklab, var(--bg) 85%, transparent);
    border: 1px solid var(--line); padding: 4px 8px;
  }
  .kb-info {
    font-size: 10px; letter-spacing: 0.1em; color: var(--ink);
    border: 1px solid var(--line); border-top: none;
    background: var(--card);
    padding: 6px 10px;
  }
  .kb-info .dot { color: var(--accent); }
  .kb-info .src { margin-left: 6px; }

  .kb-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
  .chip.aktif { border-color: var(--accent); color: var(--accent); }
  :global(.kabar-seal) {
    width: 20px; height: 20px; border: 2px solid #e44a06; border-radius: 50%;
    box-shadow: inset 0 0 0 3px rgba(214, 203, 172, 0.9), inset 0 0 0 5px #e44a06;
  }
  :global(.maplibregl-ctrl-attrib) { font-family: var(--font-mono); font-size: 9px; background: transparent !important; }
</style>
