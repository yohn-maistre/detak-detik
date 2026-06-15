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
  import { REGIONS, PROV_GEO, DAERAH } from '../lib/data/edisi';
  import { getLensa, onLensa } from '../lib/lensa';
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
  let bearing = $state(0);

  /* sample fallback, marked contoh, so the layer always demonstrates */
  const GEMPA_CONTOH = [
    { mag: 4.8, lon: 127.6, lat: 1.2, wilayah: '38 km tenggara Halmahera Barat', jam: '03.12 WIT' },
    { mag: 5.3, lon: 130.2, lat: -3.4, wilayah: 'Laut Banda', jam: '22.41 WIT' },
    { mag: 4.1, lon: 99.9, lat: 1.6, wilayah: 'Padang Sidempuan', jam: '19.05 WIB' },
    { mag: 3.9, lon: 119.8, lat: -8.5, wilayah: 'Sumbawa', jam: '14.27 WITA' },
    { mag: 4.5, lon: 140.1, lat: -2.9, wilayah: 'Jayapura', jam: '06.51 WIT' },
  ];

  const AKSARA_URL = (import.meta.env.PUBLIC_AKSARA_URL as string | undefined)?.replace(/\/$/, '');

  /* the archipelago's bounding box, so the map frames the whole republic on
     any screen instead of a fixed center/zoom that crops on narrow phones */
  const IDN_BOUNDS: [[number, number], [number, number]] = [[94.5, -11.3], [141.2, 6.3]];
  const fitPad = () => (window.innerWidth < 640 ? 8 : 24);

  /* the four planned legend layers, each with a contoh fallback so it always
     renders, and a live path (direct or via the Worker /geo proxy) for deploy */
  type GeoPt = Record<string, number | string>;
  const LAYER_CONTOH: Record<string, GeoPt[]> = {
    gunungapi: [
      { lon: 110.446, lat: -7.54, level: 3, nama: 'Merapi' },
      { lon: 112.922, lat: -8.108, level: 3, nama: 'Semeru' },
      { lon: 127.63, lat: 1.488, level: 4, nama: 'Ibu' },
      { lon: 122.77, lat: -8.53, level: 4, nama: 'Lewotobi' },
      { lon: 100.473, lat: -0.381, level: 2, nama: 'Marapi' },
      { lon: 105.423, lat: -6.102, level: 3, nama: 'Anak Krakatau' },
    ],
    udara: [
      { lon: 106.85, lat: -6.21, aqi: 165, nama: 'Jakarta' },
      { lon: 107.61, lat: -6.92, aqi: 120, nama: 'Bandung' },
      { lon: 112.75, lat: -7.26, aqi: 98, nama: 'Surabaya' },
      { lon: 101.45, lat: 0.51, aqi: 180, nama: 'Pekanbaru' },
      { lon: 113.92, lat: -2.21, aqi: 210, nama: 'Palangkaraya' },
      { lon: 98.67, lat: 3.59, aqi: 110, nama: 'Medan' },
    ],
    banjir: [
      { lon: 106.83, lat: -6.17, state: 3, nama: 'Jakarta Pusat' },
      { lon: 107.0, lat: -6.24, state: 2, nama: 'Bekasi' },
      { lon: 110.42, lat: -6.97, state: 2, nama: 'Semarang' },
      { lon: 107.6, lat: -6.95, state: 1, nama: 'Bandung' },
    ],
    kebakaran: [
      { lon: 101.7, lat: 0.5, frp: 45, nama: 'Riau' },
      { lon: 104.0, lat: -2.9, frp: 60, nama: 'Sumsel' },
      { lon: 110.0, lat: -0.5, frp: 38, nama: 'Kalbar' },
      { lon: 113.5, lat: -2.2, frp: 75, nama: 'Kalteng' },
      { lon: 103.0, lat: -1.6, frp: 30, nama: 'Jambi' },
    ],
  };

  const LAYERS: { id: string; nama: string; sym: string; sumber: string; paint: Record<string, unknown> }[] = [
    {
      id: 'gunungapi', nama: 'GUNUNG API', sym: '▲', sumber: 'magma/pvmbg',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['get', 'level'], 1, 4, 4, 12],
        'circle-color': ['step', ['get', 'level'], '#5a8f6a', 2, '#cdb47a', 3, '#e08a1e', 4, '#e44a06'],
      },
    },
    {
      id: 'udara', nama: 'UDARA · PM2.5', sym: '◍', sumber: 'waqi',
      paint: {
        'circle-radius': 6,
        'circle-color': ['step', ['get', 'aqi'], '#5a8f6a', 51, '#cdb47a', 101, '#e08a1e', 151, '#e44a06', 201, '#8a1b6a'],
      },
    },
    {
      id: 'banjir', nama: 'BANJIR · LAPORAN', sym: '✚', sumber: 'petabencana',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['get', 'state'], 1, 4, 3, 11],
        'circle-color': ['step', ['get', 'state'], '#7fa8c9', 2, '#3f6fa0', 3, '#1d3f66'],
      },
    },
    {
      id: 'kebakaran', nama: 'TITIK API', sym: '▒', sumber: 'firms/viirs',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['get', 'frp'], 20, 3, 80, 10],
        'circle-color': ['interpolate', ['linear'], ['get', 'frp'], 20, '#e08a1e', 80, '#e44a06'],
        'circle-opacity': 0.72,
      },
    },
  ];

  let layerOn = $state<Record<string, boolean>>({ gunungapi: false, udara: false, banjir: false, kebakaran: false });
  let layerLive = $state<Record<string, boolean>>({ gunungapi: false, udara: false, banjir: false, kebakaran: false });

  function ptsGeo(pts: GeoPt[]) {
    return {
      type: 'FeatureCollection' as const,
      features: pts.map((p) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [Number(p.lon), Number(p.lat)] },
        properties: p,
      })),
    };
  }

  /* the clickable province layer: 38 centroids; click sets the lensa, which
     drives the dossier below and recentres the map */
  /* ADM1 province polygons, fetched as a static asset; codes patched to join
     DAERAH (see scripts/patch-prov-geojson.mjs). MapLibre fetches the URL. */
  const PROV_URL = `${import.meta.env.BASE_URL}data/idn-prov.geojson`;
  type ProvGeom = { type: 'Polygon' | 'MultiPolygon'; coordinates: number[][][] | number[][][][] };
  type ProvFeature = { properties: { kode: string; nama: string }; geometry: ProvGeom };
  let provData: { features: ProvFeature[] } | null = null;
  const provDataReady = fetch(PROV_URL).then((r) => r.json()).then((d: { features: ProvFeature[] }) => (provData = d)).catch(() => null);

  let provinsiOn = $state(true);
  let lensaKode = $state(getLensa());
  let hoverKode: string | null = null;
  /** choropleth fill expression, set by the map_choropleth verb; null = plain */
  let choroExpr: unknown = null;
  let choroLegend = $state<{ judul: string; satuan: string; lo: number; hi: number } | null>(null);

  /** bounding box of a province polygon, for framing the selection */
  function bboxProv(kode: string): [[number, number], [number, number]] | null {
    const f = provData?.features.find((x) => x.properties.kode === kode);
    if (!f) return null;
    let minX = 180, minY = 90, maxX = -180, maxY = -90;
    const scan = (ring: number[][]) => {
      for (const pt of ring) {
        const x = pt[0]!, y = pt[1]!;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    };
    const g = f.geometry;
    if (g.type === 'Polygon') (g.coordinates as number[][][]).forEach(scan);
    else (g.coordinates as number[][][][]).forEach((poly) => poly.forEach(scan));
    return [[minX, minY], [maxX, maxY]];
  }

  function addProvinsi() {
    if (!map) return;
    void provDataReady.then(() => {
      if (!map || !provData) return;
      const sat = plat === 'satelit';
      const vis = provinsiOn ? 'visible' : 'none';
      const ink = sat ? '#f2efe6' : '#15130e';
      // keep the polygons beneath the hazard dots so dots stay legible and clickable
      const below = map.getLayer('gempa-dot') ? 'gempa-dot' : undefined;
      if (!map.getSource('provinsi')) map.addSource('provinsi', { type: 'geojson', data: provData as never, promoteId: 'kode' });
      if (!map.getLayer('provinsi-fill')) {
        map.addLayer({
          id: 'provinsi-fill', type: 'fill', source: 'provinsi', layout: { visibility: vis },
          paint: {
            'fill-color': (choroExpr as string) ?? ink,
            'fill-opacity': choroExpr ? 0.72 : ['case', ['boolean', ['feature-state', 'hover'], false], 0.16, 0.04],
          },
        }, below);
      }
      if (!map.getLayer('provinsi-line')) {
        map.addLayer({
          id: 'provinsi-line', type: 'line', source: 'provinsi', layout: { visibility: vis },
          paint: { 'line-color': ink, 'line-width': 0.7, 'line-opacity': 0.4 },
        }, below);
      }
      if (!map.getLayer('provinsi-sel-fill')) {
        map.addLayer({
          id: 'provinsi-sel-fill', type: 'fill', source: 'provinsi', filter: ['==', ['get', 'kode'], lensaKode], layout: { visibility: vis },
          paint: { 'fill-color': '#e44a06', 'fill-opacity': 0.12 },
        }, below);
      }
      if (!map.getLayer('provinsi-sel')) {
        map.addLayer({
          id: 'provinsi-sel', type: 'line', source: 'provinsi', filter: ['==', ['get', 'kode'], lensaKode], layout: { visibility: vis },
          paint: { 'line-color': '#e44a06', 'line-width': 2.2 },
        }, below);
      }
      if (!map.getLayer('provinsi-lab')) {
        map.addLayer({
          id: 'provinsi-lab', type: 'symbol', source: 'provinsi', filter: ['==', ['get', 'kode'], lensaKode],
          layout: { visibility: vis, 'text-field': ['get', 'nama'], 'text-font': ['Noto Sans Regular'], 'text-size': 11.5, 'text-transform': 'uppercase', 'text-letter-spacing': 0.1 },
          paint: { 'text-color': ink, 'text-halo-color': sat ? '#15130e' : '#d6cbac', 'text-halo-width': 1.4 },
        });
      }
    });
  }

  function toggleProvinsi(onState: boolean) {
    provinsiOn = onState;
    for (const id of ['provinsi-fill', 'provinsi-line', 'provinsi-sel-fill', 'provinsi-sel', 'provinsi-lab']) {
      if (map?.getLayer(id)) map.setLayoutProperty(id, 'visibility', onState ? 'visible' : 'none');
    }
  }

  /* choropleth + pins: the map_choropleth and map_label verbs, for one-shot
     answers from Aksara or a tour. Values come from DAERAH (cited rows). */
  const METRIK_PETA: Record<string, { judul: string; satuan: string }> = {
    miskin: { judul: 'Kemiskinan', satuan: '%' },
    ipm: { judul: 'IPM', satuan: '' },
    dokter: { judul: 'Dokter / 1.000', satuan: '' },
    ump: { judul: 'UMP', satuan: 'jt' },
    pegawai: { judul: 'Belanja pegawai', satuan: '%' },
    tpt: { judul: 'Pengangguran', satuan: '%' },
  };
  const angkaDaerah = (s: string | undefined): number => {
    if (!s) return NaN;
    const m = s.replace(/\./g, '').replace(',', '.').match(/-?\d+(\.\d+)?/);
    return m ? parseFloat(m[0]!) : NaN;
  };
  const RAMP = [[232, 220, 187], [205, 154, 78], [205, 120, 40], [228, 74, 6], [150, 28, 10]];
  function rampWarna(t: number): string {
    const p = Math.max(0, Math.min(1, t)) * (RAMP.length - 1);
    const i = Math.min(RAMP.length - 2, Math.floor(p));
    const f = p - i, a = RAMP[i]!, b = RAMP[i + 1]!;
    return `rgb(${Math.round(a[0]! + (b[0]! - a[0]!) * f)},${Math.round(a[1]! + (b[1]! - a[1]!) * f)},${Math.round(a[2]! + (b[2]! - a[2]!) * f)})`;
  }
  function buildChoro(metric: string): { expr: unknown[]; lo: number; hi: number } {
    const rows = (DAERAH as unknown as Record<string, string>[])
      .filter((d) => d.kode !== 'nasional')
      .map((d) => ({ kode: d.kode!, v: angkaDaerah(d[metric]) }))
      .filter((r) => Number.isFinite(r.v));
    const lo = Math.min(...rows.map((r) => r.v)), hi = Math.max(...rows.map((r) => r.v));
    const expr: unknown[] = ['match', ['get', 'kode']];
    for (const r of rows) expr.push(r.kode, rampWarna((r.v - lo) / (hi - lo || 1)));
    expr.push('#bcb094');
    return { expr, lo, hi };
  }
  const fmtLeg = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(n);

  type PinFeat = { type: 'Feature'; geometry: { type: 'Point'; coordinates: [number, number] }; properties: { teks: string } };
  let pins: PinFeat[] = [];
  function ensurePins() {
    if (!map) return;
    const sat = plat === 'satelit';
    if (!map.getSource('pins')) map.addSource('pins', { type: 'geojson', data: { type: 'FeatureCollection', features: pins } as never });
    if (!map.getLayer('pins-dot')) map.addLayer({ id: 'pins-dot', type: 'circle', source: 'pins', paint: { 'circle-radius': 4, 'circle-color': '#e44a06', 'circle-stroke-color': sat ? '#15130e' : '#f2efe6', 'circle-stroke-width': 1.5 } });
    if (!map.getLayer('pins-lab')) map.addLayer({ id: 'pins-lab', type: 'symbol', source: 'pins', layout: { 'text-field': ['get', 'teks'], 'text-font': ['Noto Sans Regular'], 'text-size': 11, 'text-offset': [0, 1.1], 'text-anchor': 'top', 'text-letter-spacing': 0.04 }, paint: { 'text-color': sat ? '#f2efe6' : '#15130e', 'text-halo-color': sat ? '#15130e' : '#d6cbac', 'text-halo-width': 1.4 } });
  }

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
    for (const L of LAYERS) {
      if (!map.getSource(L.id)) map.addSource(L.id, { type: 'geojson', data: ptsGeo(LAYER_CONTOH[L.id] ?? []) });
      if (!map.getLayer(`${L.id}-dot`)) {
        map.addLayer({
          id: `${L.id}-dot`,
          type: 'circle',
          source: L.id,
          layout: { visibility: layerOn[L.id] ? 'visible' : 'none' },
          paint: {
            'circle-opacity': 0.8,
            'circle-stroke-color': plat === 'satelit' ? '#f2efe6' : '#15130e',
            'circle-stroke-width': 0.8,
            ...(L.paint as Record<string, never>),
          },
        });
      }
    }
    addProvinsi();
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

  function toggleLayer(id: string, onState: boolean) {
    layerOn[id] = onState;
    if (map?.getLayer(`${id}-dot`)) map.setLayoutProperty(`${id}-dot`, 'visibility', onState ? 'visible' : 'none');
  }

  /* best-effort live data: PetaBencana is keyless/CORS; the rest go through the
     Worker /geo proxy when PUBLIC_AKSARA_URL is set. Any failure keeps contoh. */
  async function muatLapisan() {
    const set = (id: string, pts: GeoPt[]) => {
      if (!pts.length) return;
      (map?.getSource(id) as { setData?: (d: unknown) => void } | undefined)?.setData?.(ptsGeo(pts));
      layerLive[id] = true;
    };
    try {
      const res = await fetch('https://data.petabencana.id/reports?timeperiod=43200', { signal: AbortSignal.timeout(6000) });
      const data = (await res.json()) as { result?: { features?: { geometry?: { coordinates?: number[] }; properties?: Record<string, unknown> }[] } };
      const pts = (data.result?.features ?? [])
        .map((f) => ({ lon: f.geometry?.coordinates?.[0] ?? NaN, lat: f.geometry?.coordinates?.[1] ?? NaN, state: Number(f.properties?.state ?? 1), nama: String(f.properties?.title ?? 'laporan') }))
        .filter((p) => Number.isFinite(p.lon) && Number.isFinite(p.lat));
      set('banjir', pts as GeoPt[]);
    } catch { /* contoh stays */ }
    if (!AKSARA_URL) return;
    for (const id of ['gunungapi', 'udara', 'kebakaran']) {
      try {
        const res = await fetch(`${AKSARA_URL}/geo/${id}`, { signal: AbortSignal.timeout(6000) });
        const data = (await res.json()) as { features?: { geometry?: { coordinates?: number[] }; properties?: GeoPt }[] };
        const pts = (data.features ?? [])
          .map((f) => ({ ...(f.properties ?? {}), lon: f.geometry?.coordinates?.[0] ?? NaN, lat: f.geometry?.coordinates?.[1] ?? NaN }))
          .filter((p) => Number.isFinite(p.lon) && Number.isFinite(p.lat));
        set(id, pts as GeoPt[]);
      } catch { /* contoh stays */ }
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
        bounds: IDN_BOUNDS,
        fitBoundsOptions: { padding: fitPad() },
        attributionControl: { compact: true },
        cooperativeGestures: true,
        fadeDuration: 150,
      });
      mapRef = map;

      map.on('sourcedata', (e) => {
        if (e.isSourceLoaded && map!.areTilesLoaded()) petaSiap = true;
      });
      map.on('load', () => addDataLayers());
      map.on('move', () => {
        const c = map!.getCenter();
        koordinat = `${Math.abs(c.lat).toFixed(2)}°${c.lat < 0 ? 'LS' : 'LU'} · ${c.lng.toFixed(2)}°BT`;
        bearing = map!.getBearing();
      });
      map.on('click', 'gempa-dot', (e) => {
        const p = e.features?.[0]?.properties as { mag?: number; wilayah?: string; jam?: string } | undefined;
        if (p) infoGempa = `M${p.mag} · ${p.wilayah} · ${p.jam}`;
      });
      map.on('click', 'provinsi-fill', (e) => {
        const k = e.features?.[0]?.properties?.kode as string | undefined;
        if (k) dispatch({ cmd: 'set_lensa', params: { kode: k } });
      });
      map.on('mousemove', 'provinsi-fill', (e) => {
        const k = e.features?.[0]?.properties?.kode as string | undefined;
        if (!map || !k || k === hoverKode) return;
        if (hoverKode) map.setFeatureState({ source: 'provinsi', id: hoverKode }, { hover: false });
        hoverKode = k;
        map.setFeatureState({ source: 'provinsi', id: k }, { hover: true });
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'provinsi-fill', () => {
        if (!map) return;
        if (hoverKode) map.setFeatureState({ source: 'provinsi', id: hoverKode }, { hover: false });
        hoverKode = null;
        map.getCanvas().style.cursor = '';
      });

      const seal = document.createElement('div');
      seal.className = 'kabar-seal';
      marker = new maplibregl.Marker({ element: seal }).setLngLat([136.565, -4.543]);

      unsubs.push(on('fly_to', (p) => {
        if (!map) return;
        const target = p.kode ? REGIONS.find((r) => r.kode === p.kode) : undefined;
        const lon = target?.lon ?? p.lon;
        const lat = target?.lat ?? p.lat;
        if (lon == null || lat == null) return;
        marker!.setLngLat([lon, lat]).addTo(map);
        map.flyTo({ center: [lon, lat], zoom: target?.zoom ?? p.zoom ?? 8, speed: 0.9, curve: 1.6 });
      }));
      unsubs.push(on('set_basemap', ({ plat: p }) => {
        if (p === 'cuaca' && !radarTs) return;
        applyBasemap(p);
      }));
      unsubs.push(on('set_layer', ({ layer, on: onState }) => {
        if (layer === 'gempa') toggleGempa(onState);
        else if (layer === 'provinsi') toggleProvinsi(onState);
        else if (LAYERS.some((l) => l.id === layer)) toggleLayer(layer, onState);
      }));
      unsubs.push(onLensa((k) => {
        lensaKode = k;
        for (const id of ['provinsi-sel-fill', 'provinsi-sel', 'provinsi-lab']) {
          if (map?.getLayer(id)) map.setFilter(id, ['==', ['get', 'kode'], k]);
        }
        if (!map) return;
        if (k === 'nasional') { map.fitBounds(IDN_BOUNDS, { padding: fitPad(), duration: 900 }); return; }
        void provDataReady.then(() => {
          const bb = bboxProv(k);
          if (bb) map?.fitBounds(bb, { padding: fitPad() + 24, maxZoom: 7.5, duration: 900 });
          else {
            const g = PROV_GEO[k];
            if (g) map?.flyTo({ center: g, zoom: 6.4, speed: 0.85, curve: 1.5 });
          }
        });
      }));

      unsubs.push(on('map_choropleth', ({ metric, judul }) => {
        if (!map?.getLayer('provinsi-fill')) return;
        if (metric === 'mati') {
          choroExpr = null; choroLegend = null;
          map.setPaintProperty('provinsi-fill', 'fill-color', plat === 'satelit' ? '#f2efe6' : '#15130e');
          map.setPaintProperty('provinsi-fill', 'fill-opacity', ['case', ['boolean', ['feature-state', 'hover'], false], 0.16, 0.04] as never);
          return;
        }
        const meta = METRIK_PETA[metric];
        if (!meta) return;
        const { expr, lo, hi } = buildChoro(metric);
        choroExpr = expr;
        choroLegend = { judul: judul || meta.judul, satuan: meta.satuan, lo, hi };
        map.setPaintProperty('provinsi-fill', 'fill-color', expr as never);
        map.setPaintProperty('provinsi-fill', 'fill-opacity', 0.72);
      }));
      unsubs.push(on('map_label', ({ kode, lat, lon, teks, sub }) => {
        if (!map) return;
        const src = () => map!.getSource('pins') as { setData?: (d: unknown) => void } | undefined;
        if (!teks) { pins = []; src()?.setData?.({ type: 'FeatureCollection', features: [] }); return; }
        let coord: [number, number] | undefined;
        if (kode && PROV_GEO[kode]) coord = PROV_GEO[kode];
        else if (lon != null && lat != null) coord = [lon, lat];
        if (!coord) return;
        pins = [...pins.slice(-11), { type: 'Feature', geometry: { type: 'Point', coordinates: coord }, properties: { teks: sub ? `${teks} · ${sub}` : teks } }];
        ensurePins();
        src()?.setData?.({ type: 'FeatureCollection', features: pins });
      }));

      void muatLapisan();
    })();

    return () => {
      cancelled = true;
      unsubs.forEach((u) => u());
      ro.disconnect();
      map?.remove();
    };
  });

  let mapRef: import('maplibre-gl').Map | undefined;
  const resetNorth = () => mapRef?.easeTo({ bearing: 0, pitch: 0, duration: 600 });
  const pilihPlat = (p: typeof plat) => dispatch({ cmd: 'set_basemap', params: { plat: p } });
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
            <input type="checkbox" checked={provinsiOn} onchange={(e) => dispatch({ cmd: 'set_layer', params: { layer: 'provinsi', on: e.currentTarget.checked } })} />
            <span class="sym sym-prov">◆</span> PROVINSI · KLIK
            <span class="src">38 + NASIONAL</span>
          </label>
          <label class="kb-leg-row">
            <input type="checkbox" checked={gempaOn} onchange={(e) => dispatch({ cmd: 'set_layer', params: { layer: 'gempa', on: e.currentTarget.checked } })} />
            <span class="sym gempa">◉</span> GEMPA · 24 JAM
            <span class="src">{gempaLive ? 'BMKG · LANGSUNG' : 'CONTOH'}</span>
          </label>
          {#each LAYERS as L (L.id)}
            <label class="kb-leg-row">
              <input type="checkbox" checked={layerOn[L.id]} onchange={(e) => dispatch({ cmd: 'set_layer', params: { layer: L.id, on: e.currentTarget.checked } })} />
              <span class={`sym sym-${L.id}`}>{L.sym}</span> {L.nama}
              <span class="src">{layerLive[L.id] ? `${L.sumber.split('/')[0].toUpperCase()} · LANGSUNG` : 'CONTOH'}</span>
            </label>
          {/each}
        </div>
      {/if}
    </div>

    <div class="kb-koordinat mono">{koordinat}</div>

    {#if choroLegend}
      <div class="kb-choro mono">
        <span class="kb-choro-judul">{choroLegend.judul}</span>
        <div class="kb-choro-ramp" aria-hidden="true"></div>
        <span class="kb-choro-skala">{fmtLeg(choroLegend.lo)} → {fmtLeg(choroLegend.hi)} {choroLegend.satuan}</span>
      </div>
    {/if}

    <button class="kb-rose" onclick={resetNorth} title="Kembali ke utara" aria-label="Orientasi utara">
      <svg viewBox="0 0 100 100" style={`transform: rotate(${-bearing}deg)`}>
        <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5" />
        {#each Array.from({ length: 8 }) as _, i}
          <line x1="50" y1={i % 2 === 0 ? 6 : 11} x2="50" y2="16" stroke="currentColor" stroke-width={i % 2 === 0 ? 1.4 : 0.6} transform="rotate({i * 45} 50 50)" />
        {/each}
        <path d="M50 14 L55 50 L50 86 L45 50 Z" fill="currentColor" opacity="0.5" />
        <path d="M50 14 L54 50 L50 50 L46 50 Z" fill="#e44a06" />
        <text x="50" y="11" text-anchor="middle" font-size="11" fill="currentColor" font-family="var(--font-mono)">U</text>
      </svg>
    </button>
  </div>

  {#if plat === 'cuaca'}
    <div class="kb-info mono">▦ RADAR HUJAN 10 MENIT TERAKHIR · RAINVIEWER — BILA TIDAK ADA HUJAN, PLAT TAMPAK BERSIH</div>
  {/if}
  {#if infoGempa}
    <div class="kb-info mono"><span class="dot">◉</span> {infoGempa} <span class="src">{gempaLive ? 'BMKG · LANGSUNG' : 'DATA CONTOH'}</span></div>
  {/if}

  <p class="kb-tip mono">Klik provinsi untuk membuka dasar wilayah di bawah, atau minta Aksara: <span class="kb-tip-cmd">“tunjukkan gempa di Sulawesi”</span></p>
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
  .kb-tabs-label { padding: 6px 9px; background: var(--ink); color: var(--bg); border-right: 1px solid var(--line); display: flex; align-items: center; letter-spacing: 0.16em; }
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
  .sym-prov { color: var(--accent); }
  .sym-gunungapi { color: #e08a1e; }
  .sym-udara { color: #8a1b6a; }
  .sym-banjir { color: #3f6fa0; }
  .sym-kebakaran { color: var(--accent); }
  .src { margin-left: auto; font-size: 8px; color: var(--muted); letter-spacing: 0.16em; }

  .kb-koordinat {
    position: absolute; left: 12px; bottom: 12px; z-index: 4;
    font-size: 10px; letter-spacing: 0.14em; color: var(--ink);
    background: color-mix(in oklab, var(--bg) 85%, transparent);
    border: 1px solid var(--line); padding: 4px 8px;
  }
  .kb-choro {
    position: absolute; right: 12px; bottom: 12px; z-index: 5;
    display: flex; flex-direction: column; gap: 5px;
    background: color-mix(in oklab, var(--bg) 88%, transparent);
    border: 1px solid var(--line); padding: 7px 9px; max-width: 180px;
  }
  .kb-choro-judul { font-size: 9.5px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink); }
  .kb-choro-ramp { height: 7px; background: linear-gradient(90deg, rgb(232,220,187), rgb(205,154,78), rgb(205,120,40), rgb(228,74,6), rgb(150,28,10)); }
  .kb-choro-skala { font-size: 9px; letter-spacing: 0.08em; color: var(--muted); }
  .kb-info {
    font-size: 10px; letter-spacing: 0.1em; color: var(--ink);
    border: 1px solid var(--line); border-top: none;
    background: var(--card);
    padding: 6px 10px;
  }
  .kb-info .dot { color: var(--accent); }
  .kb-info .src { margin-left: 6px; }

  .kb-rose {
    position: absolute; left: 12px; top: 12px; z-index: 5;
    width: 50px; height: 50px; padding: 5px;
    background: color-mix(in oklab, var(--bg) 88%, transparent);
    border: 1px solid var(--line); color: var(--ink); cursor: pointer;
    transition: border-color 0.25s, box-shadow 0.25s;
  }
  .kb-rose svg { width: 100%; height: 100%; display: block; transition: transform 0.2s linear; }
  .kb-rose:hover { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
  .kb-tip { margin-top: 12px; font-size: 10px; letter-spacing: 0.08em; color: var(--muted); }
  .kb-tip-cmd { color: var(--accent); }
  .chip.aktif { border-color: var(--accent); color: var(--accent); }
  :global(.kabar-seal) {
    width: 20px; height: 20px; border: 2px solid #e44a06; border-radius: 50%;
    box-shadow: inset 0 0 0 3px rgba(214, 203, 172, 0.9), inset 0 0 0 5px #e44a06;
  }
  :global(.maplibregl-ctrl-attrib) { font-family: var(--font-mono); font-size: 9px; background: transparent !important; }
</style>
