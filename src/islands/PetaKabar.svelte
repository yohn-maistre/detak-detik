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
  import { getLensaKab, onLensaKab, setLensaKab, type LensaKab } from '../lib/lensa-kab';
  import { on, dispatch } from '../lib/commands/dispatcher';
  import { drawEngraving, ENGRAVE_DINAS } from '../lib/engrave';
  import { reducedMotion } from '../lib/motion';
  import { pulseRef } from '../lib/motion-kit';
  import LaporanLokasi from './LaporanLokasi.svelte';

  let mapEl: HTMLDivElement;
  let engraveEl: HTMLCanvasElement;
  let koordinat = $state('2.60°LS · 118.00°BT');
  let petaSiap = $state(false);
  let plat = $state<'atlas' | 'satelit' | 'cuaca' | 'malam'>('atlas');
  let jalanOn = $state(false);
  let hujanOn = $state(false);
  let tambangOn = $state(false);
  let satwaOn = $state(false);
  let satwaLive = $state(false);
  let sppgOn = $state(false);
  let sppgLive = $state(false);
  let konsesiOn = $state(false);
  let konsesiLive = $state(false);
  let legendaBuka = $state(false);
  let gempaOn = $state(true);
  let gempaLive = $state(false);
  let infoGempa = $state('');
  let bearing = $state(0);
  /* the click-anywhere location report: armed by a toolbar toggle (or driven by
     Aksara's lapor_lokasi verb); the next map click drops the panel on a point */
  let titikMode = $state(false);
  let titik = $state<{ lon: number; lat: number } | null>(null);
  let titikProv = $state('Wilayah Indonesia');
  let titikBahaya = $state('');

  /* one small info card at a time: click any marker (quake, volcano, air, flood,
     fire, plane, ship) and a compact readout anchors at that point. Re-projected on
     every map move; a click on bare map (or ✕) closes it. */
  let fitur = $state<{ kind: string; lon: number; lat: number; props: GeoPt; x: number; y: number } | null>(null);
  const ruteCache = new Map<string, string>();
  function projFitur() {
    if (!fitur || !map) return;
    const p = map.project([fitur.lon, fitur.lat]);
    fitur.x = p.x; fitur.y = p.y;
  }
  function bukaFitur(kind: string, lon: number, lat: number, props: GeoPt) {
    if (!map) return;
    const p = map.project([lon, lat]);
    fitur = { kind, lon, lat, props, x: p.x, y: p.y };
    if (kind === 'pesawat') void enrichRute(String(props.flight ?? '').trim());
  }
  /* planes: adsbdb.com is keyless and maps a callsign to its route (origin → dest
     airports). Best-effort; the popup shows the raw callsign until/unless it lands. */
  async function enrichRute(flight: string) {
    if (!flight) return;
    if (ruteCache.has(flight)) { if (fitur) fitur.props = { ...fitur.props, rute: ruteCache.get(flight)! }; return; }
    try {
      const res = await fetch(`https://api.adsbdb.com/v1/callsign/${encodeURIComponent(flight)}`, { signal: AbortSignal.timeout(6000) });
      const d = (await res.json()) as { response?: { flightroute?: { origin?: { iata_code?: string; municipality?: string }; destination?: { iata_code?: string; municipality?: string } } } };
      const fr = d.response?.flightroute;
      if (fr?.origin && fr?.destination) {
        const rute = `${fr.origin.iata_code ?? '?'} ${fr.origin.municipality ?? ''} → ${fr.destination.iata_code ?? '?'} ${fr.destination.municipality ?? ''}`.replace(/\s+/g, ' ').trim();
        ruteCache.set(flight, rute);
        if (fitur && String(fitur.props.flight ?? '').trim() === flight) fitur.props = { ...fitur.props, rute };
      }
    } catch { /* callsign route is a bonus, never required */ }
  }

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
    pesawat: [
      { lon: 106.9, lat: -6.3, track: 90, flight: 'GIA 312' },
      { lon: 112.7, lat: -7.4, track: 250, flight: 'JT 631' },
      { lon: 115.2, lat: -8.7, track: 70, flight: 'QZ 102' },
      { lon: 98.7, lat: 3.6, track: 180, flight: 'SJ 014' },
    ],
    kapal: [
      { lon: 104.0, lat: -5.9, nama: 'kapal contoh', kecepatan: 12, track: 40 },
      { lon: 117.0, lat: -4.0, nama: 'kapal contoh', kecepatan: 9, track: 200 },
      { lon: 112.7, lat: -6.1, nama: 'kapal contoh', kecepatan: 14, track: 310 },
    ],
    karbon: [
      { lon: 101.33, lat: 0.659, co2: 15.78, nama: 'Central Sumatra · Conventional onshore', jenis: 'migas', sektor: 'fossil-fuel-operations' },
      { lon: 122.159, lat: -2.832, co2: 11.75, nama: 'Dexin Steel Morowali plant', jenis: 'BF/BOF', sektor: 'manufacturing' },
      { lon: 103.962, lat: -2.521, co2: 11.38, nama: 'South Sumatra · Conventional onshore', jenis: 'migas', sektor: 'fossil-fuel-operations' },
      { lon: 133.16, lat: -2.333, co2: 8.7, nama: 'Bintuni · LNG', jenis: 'migas', sektor: 'fossil-fuel-operations' },
    ],
    batubara: [
      { lon: 106.05, lat: -5.89, plant: 'PLTU Suralaya', mw: 6025, status: 'beroperasi', units: 8, owner: 'PLN' },
      { lon: 111.49, lat: -6.46, plant: 'PLTU Tanjung Jati B', mw: 3320, status: 'beroperasi', units: 4, owner: 'PLN' },
    ],
  };

  type LayerDef = { id: string; nama: string; sym: string; sumber: string; shape: string; color: string; size: number | unknown[]; rotate?: boolean; trail?: boolean };
  const LAYERS: LayerDef[] = [
    { id: 'gunungapi', nama: 'GUNUNG API', sym: '▲', sumber: 'gvp/magma', shape: 'triangle', color: '#e08a1e',
      size: ['interpolate', ['linear'], ['get', 'level'], 1, 0.6, 4, 1.3] },
    { id: 'udara', nama: 'UDARA · PM2.5', sym: '◆', sumber: 'waqi', shape: 'square', color: '#8a5cc0',
      size: ['interpolate', ['linear'], ['get', 'aqi'], 50, 0.6, 200, 1.25] },
    { id: 'banjir', nama: 'BANJIR · LAPORAN', sym: '✚', sumber: 'petabencana', shape: 'plus', color: '#3f6fa0',
      size: ['interpolate', ['linear'], ['get', 'state'], 1, 0.6, 3, 1.2] },
    { id: 'kebakaran', nama: 'TITIK API', sym: '✦', sumber: 'firms/viirs', shape: 'spark', color: '#e44a06',
      size: ['interpolate', ['linear'], ['get', 'frp'], 20, 0.55, 80, 1.25] },
    { id: 'pesawat', nama: 'PESAWAT', sym: '✈', sumber: 'opensky', shape: 'plane', color: '#2f6f9f', size: 0.85, rotate: true, trail: true },
    { id: 'kapal', nama: 'KAPAL', sym: '➤', sumber: 'aisstream', shape: 'ship', color: '#2f8f78', size: 0.8, rotate: true, trail: true },
    { id: 'karbon', nama: 'EMISI CO₂ · INDUSTRI', sym: '◉', sumber: 'climate-trace', shape: 'disc', color: '#7a1410',
      size: ['interpolate', ['linear'], ['get', 'co2'], 0.5, 0.5, 20, 1.6] },
    { id: 'batubara', nama: 'PLTU BATU BARA', sym: '◼', sumber: 'gem', shape: 'square', color: '#2b2b2b',
      size: ['interpolate', ['linear'], ['get', 'mw'], 100, 0.5, 6000, 1.7] },
  ];

  /* the standing source credits printed under the map — every layer carries its
     provider + licence, linked for verifiability (an iron law of the paper). */
  /* keyed to a layer toggle so the printed credits track only what's ON the map
     right now ('base' = always shown: the plate + the wilayah boundaries). */
  const KREDIT: { nama: string; src: string; url: string; lisensi: string; key: string }[] = [
    { nama: 'Peta dasar', src: 'OpenFreeMap · OSM', url: 'https://openfreemap.org', lisensi: 'ODbL', key: 'base' },
    { nama: 'Wilayah', src: 'BIG Rupabumi', url: 'https://www.big.go.id', lisensi: 'One-Map', key: 'base' },
    { nama: 'Gunung api', src: 'Smithsonian GVP + PVMBG', url: 'https://volcano.si.edu', lisensi: 'GVP', key: 'gunungapi' },
    { nama: 'Gempa', src: 'BMKG + USGS', url: 'https://www.bmkg.go.id', lisensi: 'publik', key: 'gempa' },
    { nama: 'Udara', src: 'WAQI', url: 'https://waqi.info', lisensi: 'atribusi', key: 'udara' },
    { nama: 'Banjir', src: 'PetaBencana', url: 'https://petabencana.id', lisensi: 'CC-BY', key: 'banjir' },
    { nama: 'Titik api', src: 'NASA FIRMS · VIIRS', url: 'https://firms.modaps.eosdis.nasa.gov', lisensi: 'publik', key: 'kebakaran' },
    { nama: 'Pesawat', src: 'OpenSky Network', url: 'https://opensky-network.org', lisensi: 'CC-BY-NC', key: 'pesawat' },
    { nama: 'Kapal', src: 'AISStream', url: 'https://aisstream.io', lisensi: 'atribusi', key: 'kapal' },
    { nama: 'Emisi CO₂', src: 'Climate TRACE', url: 'https://climatetrace.org', lisensi: 'CC-BY', key: 'karbon' },
    { nama: 'PLTU batu bara', src: 'Global Energy Monitor', url: 'https://globalenergymonitor.org', lisensi: 'CC-BY', key: 'batubara' },
    { nama: 'Tambang · IUP', src: 'ESDM Geoportal · Minerba', url: 'https://geoportal.esdm.go.id', lisensi: 'Satu Peta', key: 'tambang' },
    { nama: 'Konsesi hutan/sawit', src: 'KLHK · BIG SatuPeta', url: 'https://kspservices.big.go.id', lisensi: 'Satu Peta', key: 'konsesi' },
    { nama: 'Satwa terancam', src: 'Mandum Rimba · GBIF + IUCN', url: 'https://mandumrimba.org', lisensi: 'derivatif CC-BY', key: 'satwa' },
    { nama: 'SPPG · MBG', src: 'sismonbgn (terdaftar)', url: 'https://sismonbgn.com', lisensi: 'publik', key: 'sppg' },
    { nama: 'Hujan', src: 'NASA GIBS · IMERG', url: 'https://gibs.earthdata.nasa.gov', lisensi: 'publik', key: 'hujan' },
  ];

  let layerOn = $state<Record<string, boolean>>({ gunungapi: false, udara: false, banjir: false, kebakaran: false, pesawat: false, kapal: false, karbon: false, batubara: false });
  let layerLive = $state<Record<string, boolean>>({ gunungapi: false, udara: false, banjir: false, kebakaran: false, pesawat: false, kapal: false, karbon: false, batubara: false });
  /* a layer fetched live but came back empty (no active fires/floods today) — shown
     honestly as NIHIL, never silently backfilled with contoh */
  let layerKosong = $state<Record<string, boolean>>({});

  /* the credits printed under the map track only the layers currently ON — the white
     info box stays a true caption of what the reader is looking at, not a wall of all
     sources at once. 'base' (plate + wilayah) is always present. */
  const sumberAktif = $derived.by(() => {
    const aktif: Record<string, boolean> = { base: true, gempa: gempaOn, tambang: tambangOn, konsesi: konsesiOn, satwa: satwaOn, sppg: sppgOn, hujan: hujanOn, ...layerOn };
    return KREDIT.filter((k) => aktif[k.key]);
  });

  /* the volcano board is a real registry (PVMBG-monitored volcanoes, true summits),
     bundled so all ~120 always render; MAGMA only supplies today's alert LEVELS,
     merged by name when the proxy has them. gunungLive = the levels are live. */
  let gunungLive = $state(false);
  let gunungBase: GeoPt[] = [];
  const gunungReady = fetch(`${import.meta.env.BASE_URL}data/gunungapi-id.json`)
    .then((r) => r.json())
    .then((d: GeoPt[]) => { if (Array.isArray(d) && d.length) gunungBase = d; })
    .catch(() => null);

  /* per-kabupaten reference data (capital, population, area) for the drill-in
     dossier — keyless, from cahyadsn/Kemendagri 2025, joined to our 514 kab by
     name. Keyed `${prov}|${stripped nama}`. BPS indicators (IPM, poverty, PDRB)
     layer on later when the key lands. */
  type WilRow = { kode?: string; ibukota?: string; pop?: number; luas?: number; lat?: number; lon?: number; dagri?: string; pos?: string };
  const normKab = (s: unknown) => String(s ?? '').toLowerCase().replace(/[^a-z]/g, '');
  let wilayahIdx = $state<Record<string, WilRow>>({});
  fetch(`${import.meta.env.BASE_URL}data/idn-wilayah.json`)
    .then((r) => r.json())
    .then((d: (WilRow & { nama: string; prov: string })[]) => {
      const m: Record<string, WilRow> = {};
      for (const r of d) m[`${r.prov}|${normKab(r.nama)}`] = r;
      wilayahIdx = m;
    })
    .catch(() => null);

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
  // ?v= busts browser caches when the vendored geometry is repaired in place
  const PROV_URL = `${import.meta.env.BASE_URL}data/idn-prov.geojson?v=4`;
  const KAB_URL = `${import.meta.env.BASE_URL}data/idn-kab.geojson?v=3`;
  type ProvGeom = { type: 'Polygon' | 'MultiPolygon'; coordinates: number[][][] | number[][][][] };
  type ProvFeature = { properties: { kode: string; nama: string }; geometry: ProvGeom };
  let provData: { features: ProvFeature[] } | null = null;
  const provDataReady = fetch(PROV_URL).then((r) => r.json()).then((d: { features: ProvFeature[] }) => (provData = d)).catch(() => null);

  let provinsiOn = $state(true);
  let lensaKode = $state(getLensa());
  let lensaKab = $state<LensaKab | null>(getLensaKab()); // the drilled regency (tier 2) — mirrors the shared store
  let provTerbuka = $state(false); // tier 2: province context expanded in place under the regency filing
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

  /** one representative point per province — the centroid of its LARGEST ring, so
   *  archipelagic provinces (Papua's 6-part MultiPolygon) get a single label on the
   *  main landmass instead of one repeated over every island part. */
  function provLabelPoints(features: ProvFeature[]) {
    const ringCentroid = (ring: number[][]) => {
      let x = 0, y = 0; for (const p of ring) { x += p[0]!; y += p[1]!; }
      return { c: [x / ring.length, y / ring.length] as [number, number], n: ring.length };
    };
    return {
      type: 'FeatureCollection' as const,
      features: features.map((f) => {
        const g = f.geometry;
        const rings = g.type === 'Polygon'
          ? [(g.coordinates as number[][][])[0]!]
          : (g.coordinates as number[][][][]).map((poly) => poly[0]!);
        // largest ring by vertex count ≈ biggest landmass — good enough for a label anchor
        let best = ringCentroid(rings[0]!);
        for (const r of rings.slice(1)) { const cc = ringCentroid(r); if (cc.n > best.n) best = cc; }
        return { type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: best.c }, properties: f.properties };
      }),
    };
  }

  function addProvinsi() {
    if (!map) return;
    void provDataReady.then(() => {
      if (!map || !provData) return;
      const sat = plat === 'satelit' || plat === 'cuaca' || plat === 'malam';
      const vis = provinsiOn ? 'visible' : 'none';
      const ink = sat ? '#f2efe6' : '#15130e';
      // keep the polygons beneath the hazard dots so dots stay legible and clickable
      const below = map.getLayer('gempa-dot') ? 'gempa-dot' : undefined;
      // the 'provinsi' geojson stays for LABEL POINTS and ZOOM BBOXES only —
      // its polygons are a fragmented tessellation and must never render.
      // Every province-level surface (base wash, hover, selection tint,
      // choropleth) draws from the CLEAN kab polygons, keyed by their `prov`
      // code, so fills match the real borders and align with the kab lines.
      if (!map.getSource('kab')) map.addSource('kab', { type: 'geojson', data: KAB_URL });
      if (!map.getLayer('provinsi-fill')) {
        map.addLayer({
          id: 'provinsi-fill', type: 'fill', source: 'kab', layout: { visibility: vis },
          paint: {
            'fill-color': (choroExpr as string) ?? ink,
            'fill-opacity': choroExpr ? 0.72 : 0.045,
          },
        }, below);
      }
      if (!map.getLayer('provinsi-hover')) {
        map.addLayer({
          id: 'provinsi-hover', type: 'fill', source: 'kab',
          filter: ['==', ['get', 'prov'], '__none__'], layout: { visibility: vis },
          paint: { 'fill-color': ink, 'fill-opacity': 0.1 },
        }, below);
      }
      if (!map.getLayer('kab-fill')) {
        map.addLayer({ id: 'kab-fill', type: 'fill', source: 'kab', layout: { visibility: vis }, paint: { 'fill-color': '#000', 'fill-opacity': 0 } }, below);
      }
      if (!map.getLayer('kab-line')) {
        map.addLayer({
          id: 'kab-line', type: 'line', source: 'kab', layout: { visibility: vis },
          // the INNER regency edges: faint, DASHED, cadastral — never a mesh that
          // competes with the data layers. Nearly invisible at the national view,
          // a quiet stitch once you drill in. Province lines come from the
          // basemap's native boundary tiles (see the note above provinsi-sel-fill).
          paint: {
            'line-color': ink,
            'line-dasharray': [1, 2.2],
            'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.3, 9, 0.6],
            // busy imagery swallows the paper-thin dashes: the dark plates get a stronger stitch
            'line-opacity': sat
              ? ['interpolate', ['linear'], ['zoom'], 5, 0.12, 7, 0.32, 11, 0.5]
              : ['interpolate', ['linear'], ['zoom'], 5, 0.06, 7, 0.18, 11, 0.3],
          },
        }, below);
      }
      // the clicked kabupaten alone carries a solid madder outline (tier 2 of
      // the selection: province = tint, kabupaten = line). Safe to draw now:
      // the kab polygons are untangled (see scripts/clean-kab-geojson.mjs).
      if (!map.getLayer('kab-sel')) {
        map.addLayer({
          id: 'kab-sel', type: 'line', source: 'kab',
          filter: ['==', ['get', 'nama'], '__none__'], layout: { visibility: vis },
          paint: { 'line-color': '#e44a06', 'line-width': 1.8 },
        }, below);
      }
      // kabupaten names: fade in as you zoom past a province, decluttered, in the
      // map's own font — replaces the default-box popup (one real kab name per
      // label, never the province repeated). Subtler than the bold province label.
      if (!map.getLayer('kab-lab')) {
        map.addLayer({
          id: 'kab-lab', type: 'symbol', source: 'kab', minzoom: 5.8,
          layout: {
            visibility: vis, 'text-field': ['get', 'nama'], 'text-font': ['Noto Sans Regular'],
            'text-size': ['interpolate', ['linear'], ['zoom'], 6, 9.5, 10, 13],
            'text-letter-spacing': 0.02, 'text-padding': 3, 'text-max-width': 7,
          },
          paint: {
            'text-color': sat ? '#e9e2cf' : '#3a3326',
            'text-halo-color': sat ? '#15130e' : '#e8dec0', 'text-halo-width': 1.3,
            'text-opacity': ['interpolate', ['linear'], ['zoom'], 6, 0, 6.9, 0.95],
          },
        }, below);
      }
      // NO perimeter is drawn from the province polygons: the vendored ADM1
      // set is a fragmented tessellation (Kalimantan Timur alone carries ~77
      // sliver parts), so any line/outline layer over it prints the interior
      // mesh as spike triangles. The polygons serve fills, hit-testing, and
      // choropleths only (their union renders correctly); the VISIBLE
      // province lines come from the basemap's native `batas-prov` boundary
      // tiles (OpenFreeMap admin_level 4). Selection reads as a fill tint +
      // the province label, never an outline.
      if (!map.getLayer('provinsi-sel-fill')) {
        map.addLayer({
          id: 'provinsi-sel-fill', type: 'fill', source: 'kab', filter: ['==', ['get', 'prov'], lensaKode], layout: { visibility: vis },
          paint: { 'fill-color': '#e44a06', 'fill-opacity': 0.12 },
        }, below);
      }
      // province name: a single bold label at the province's representative point
      // (not the polygon — that repeats once per MultiPolygon part). Fades OUT as you
      // zoom past the province into kabupaten detail, where kab-lab takes over.
      if (!map.getSource('provlabels')) map.addSource('provlabels', { type: 'geojson', data: provLabelPoints(provData.features) as never });
      if (!map.getLayer('provinsi-lab')) {
        map.addLayer({
          id: 'provinsi-lab', type: 'symbol', source: 'provlabels', filter: ['==', ['get', 'kode'], lensaKode],
          layout: {
            visibility: vis, 'text-field': ['get', 'nama'], 'text-font': ['Noto Sans Regular'],
            'text-size': ['interpolate', ['linear'], ['zoom'], 4, 11, 7, 14], 'text-transform': 'uppercase',
            'text-letter-spacing': 0.1, 'text-allow-overlap': true,
          },
          paint: {
            'text-color': ink, 'text-halo-color': sat ? '#15130e' : '#d6cbac', 'text-halo-width': 1.6,
            'text-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, 8.2, 0],
          },
        });
      }
    });
  }

  function toggleProvinsi(onState: boolean) {
    provinsiOn = onState;
    for (const id of ['provinsi-fill', 'provinsi-hover', 'kab-fill', 'kab-line', 'kab-lab', 'kab-sel', 'provinsi-sel-fill', 'provinsi-lab']) {
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
    // keyed by the kab layer's `prov` code: fills draw from the CLEAN kab
    // polygons (the vendored province set is fragmented; see below)
    const expr: unknown[] = ['match', ['get', 'prov']];
    for (const r of rows) expr.push(r.kode, rampWarna((r.v - lo) / (hi - lo || 1)));
    expr.push('#bcb094');
    return { expr, lo, hi };
  }
  const fmtLeg = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(n);

  type PinFeat = { type: 'Feature'; geometry: { type: 'Point'; coordinates: [number, number] }; properties: { teks: string } };
  let pins: PinFeat[] = [];
  function ensurePins() {
    if (!map) return;
    const sat = plat === 'satelit' || plat === 'cuaca' || plat === 'malam';
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

  /* the same OFM admin_level-4 boundary tiles that carry the province lines on
     the DINAS plate, re-inked in paper white for the dark/imagery basemaps —
     our own province polygons must never draw lines (fragmented tessellation) */
  const BATAS_PROV_TERANG = (opacity: number) => ({
    id: 'batas-prov', type: 'line' as const, source: 'ofm', 'source-layer': 'boundary',
    filter: ['==', ['get', 'admin_level'], 4],
    paint: { 'line-color': '#f2efe6', 'line-width': 0.7, 'line-dasharray': [2, 3], 'line-opacity': opacity },
  });
  const OFM_SRC = { type: 'vector' as const, url: 'https://tiles.openfreemap.org/planet' };

  const SATELIT_STYLE = {
    version: 8 as const,
    sources: {
      esri: {
        type: 'raster' as const,
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        attribution: 'Citra: Esri, Maxar, Earthstar Geographics',
      },
      ofm: OFM_SRC,
    },
    layers: [{ id: 'sat', type: 'raster' as const, source: 'esri' }, BATAS_PROV_TERANG(0.55)],
  };

  /* CUACA: NASA GIBS true-color, the previous day's global mosaic (today's may not
     be processed yet) — vivid daily clouds, haze, and fire smoke over the
     archipelago. The RainViewer radar (where it has coverage) overlays on top. */
  const GIBS_DATE = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  /* IMERG precipitation lags ~2-3 days in GIBS; request a safely-past date */
  const IMERG_DATE = new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10);
  const GIBS_STYLE = {
    version: 8 as const,
    sources: {
      gibs: {
        type: 'raster' as const,
        tiles: [`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${GIBS_DATE}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`],
        tileSize: 256,
        maxzoom: 8,
        attribution: 'Citra: NASA EOSDIS GIBS / Worldview',
      },
      ofm: OFM_SRC,
    },
    layers: [
      { id: 'bg', type: 'background' as const, paint: { 'background-color': '#0a1622' } },
      { id: 'gibs', type: 'raster' as const, source: 'gibs' },
      BATAS_PROV_TERANG(0.5),
    ],
  };

  /* MALAM: VIIRS night lights (NASA GIBS Black Marble) — the republic's settlements
     drawn by their own lamps. Lit blooms are the cities; the dark is the forest, the
     sea, and the unelectrified. A still composite, so no date needed; capped z8. */
  const MALAM_STYLE = {
    version: 8 as const,
    sources: {
      lights: {
        type: 'raster' as const,
        tiles: ['https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png'],
        tileSize: 256,
        maxzoom: 8,
        attribution: 'Citra: NASA Earth Observatory · VIIRS Black Marble',
      },
      ofm: OFM_SRC,
    },
    layers: [
      { id: 'bg', type: 'background' as const, paint: { 'background-color': '#05060a' } },
      { id: 'lights', type: 'raster' as const, source: 'lights' },
      // on near-black the lines glow: keep them quieter so the city lamps star
      BATAS_PROV_TERANG(0.35),
    ],
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
  let updatedAt = $state('');

  /* ── province dossier: what a click (or Aksara's set_lensa) surfaces on the
     map — a small narrated readout, with a live tally drawn from this view ── */
  const DOSSIER_PROV = (DAERAH as unknown as Record<string, string>[]).filter((d) => d.kode !== 'nasional');
  const ipmUrut = [...DOSSIER_PROV].sort((a, b) => angkaDaerah(b.ipm) - angkaDaerah(a.ipm));
  const ipmRankOf = (kode: string) => ipmUrut.findIndex((d) => d.kode === kode) + 1;
  function gempaDalam(kode: string): number {
    const bb = bboxProv(kode);
    if (!bb) return 0;
    const [[x0, y0], [x1, y1]] = bb;
    return (gempaData.features as { geometry: { coordinates: [number, number] } }[])
      .filter((f) => { const [x, y] = f.geometry.coordinates; return x >= x0 && x <= x1 && y >= y0 && y <= y1; }).length;
  }
  const dossier = $derived.by(() => {
    if (lensaKode === 'nasional') return null;
    const d = DOSSIER_PROV.find((x) => x.kode === lensaKode);
    if (!d) return null;
    return {
      nama: d.nama, pulau: d.pulau, fakta: d.fakta,
      ipm: d.ipm, ipmRank: ipmRankOf(d.kode), n: DOSSIER_PROV.length,
      miskin: d.miskin, dokter: d.dokter, gempa: gempaDalam(d.kode),
    };
  });

  /* tier 2 of the same card: the drilled regency's own filing. Shares and
     density derive from the Kemendagri figures; a name that failed to join the
     wilayah table still renders (name + breadcrumb, rows absent). */
  const fmtN = (n: number, dec = 0) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: dec }).format(n);
  const dossierKab = $derived.by(() => {
    const k = lensaKab;
    if (!k || k.prov !== lensaKode) return null;
    const dens = k.pop && k.luas ? k.pop / k.luas : null;
    // the filing codes (Kemendagri + postal) read straight off the enriched
    // wilayah registry — no bus round-trip (see scripts/enrich-wilayah.mjs)
    const w = wilayahIdx[`${k.prov}|${normKab(k.nama)}`];
    return {
      ...k,
      dens,
      densStr: dens != null ? fmtN(dens, dens < 10 ? 1 : 0) : null,
      shPop: k.pop && k.provPop ? (k.pop / k.provPop) * 100 : null,
      dagri: w?.dagri ?? null,
      pos: w?.pos ?? null,
    };
  });

  /* a clicked regency builds a payload (its figures + province aggregates) and
     hands it to Lensa Wilayah via set_lensa_kab — the dense in-map sub-card is gone,
     the panel below renders the proper filing. Returns null if the wilayah table
     has not loaded or the name does not join. */
  function buildKabPayload(provKode: string, nama: string) {
    const row = wilayahIdx[`${provKode}|${normKab(nama)}`];
    if (!row) return null;
    const prefix = `${provKode}|`;
    const kabs = Object.entries(wilayahIdx).filter(([k]) => k.startsWith(prefix)).map(([, r]) => r);
    const provPop = kabs.reduce((s, r) => s + (r.pop ?? 0), 0);
    const provLuas = kabs.reduce((s, r) => s + (r.luas ?? 0), 0);
    const dens = (r: WilRow) => (r.luas ? (r.pop ?? 0) / r.luas : 0);
    const rankPop = kabs.filter((r) => (r.pop ?? 0) > (row.pop ?? 0)).length + 1;
    const rankPad = kabs.filter((r) => dens(r) > dens(row)).length + 1;
    return {
      kode: String(row.kode ?? ''), nama, prov: provKode,
      ibukota: row.ibukota, pop: row.pop, luas: row.luas, lat: row.lat, lon: row.lon,
      provPop, provLuas, nKab: kabs.length, rankPop, rankPad,
    };
  }

  /* × and Esc step back one tier: regency → province → national */
  function mundurTier() {
    if (lensaKab) setLensaKab(null);
    else dispatch({ cmd: 'set_lensa', params: { kode: 'nasional' } });
  }

  /* the single info card's contents, derived from the clicked feature's props */
  const VOL_LEVEL = ['', 'Normal · Level I', 'Waspada · Level II', 'Siaga · Level III', 'Awas · Level IV'];
  /* GVP primary-type → Indonesian label for the dossier */
  const VOL_TIPE: Record<string, string> = {
    Stratovolcano: 'Stratovolcano (kerucut)', 'Stratovolcano(es)': 'Stratovolcano (kerucut)',
    Complex: 'Kompleks', 'Complex(es)': 'Kompleks', Caldera: 'Kaldera', 'Caldera(s)': 'Kaldera',
    Shield: 'Perisai', 'Shield(s)': 'Perisai', 'Pyroclastic cone': 'Kerucut piroklastik',
    'Pyroclastic cone(s)': 'Kerucut piroklastik', 'Volcanic field': 'Medan vulkanik',
    'Lava dome': 'Kubah lava', 'Lava dome(s)': 'Kubah lava', 'Submarine': 'Bawah laut',
    Maar: 'Maar', 'Maar(s)': 'Maar', Fissure: 'Rekahan', 'Compound': 'Majemuk',
  };
  function aqiBand(a: number): string {
    if (a <= 50) return 'Baik';
    if (a <= 100) return 'Sedang';
    if (a <= 150) return 'Tidak sehat (kelompok sensitif)';
    if (a <= 200) return 'Tidak sehat';
    if (a <= 300) return 'Sangat tidak sehat';
    return 'Berbahaya';
  }
  const N = (v: unknown) => Number(v);
  const fiturView = $derived.by((): { judul: string; src: string; baris: [string, string][]; catatan: string } | null => {
    const f = fitur; if (!f) return null;
    const p = f.props;
    if (f.kind === 'gempa') return { judul: `Gempa · M${p.mag}`, src: gempaLive ? 'BMKG / USGS · langsung' : 'data contoh', baris: [['Wilayah', String(p.wilayah ?? '-')], ['Waktu', String(p.jam ?? '-')]], catatan: '' };
    if (f.kind === 'gunungapi') {
      const lv = N(p.level) || 1;
      const baris: [string, string][] = [['Status', VOL_LEVEL[lv] ?? `Level ${lv}`]];
      if (p.elev != null) baris.push(['Ketinggian', `${N(p.elev).toLocaleString('id-ID')} mdpl`]);
      if (p.jenis) baris.push(['Tipe', VOL_TIPE[String(p.jenis)] ?? String(p.jenis)]);
      if (N(p.letus) > 0) baris.push(['Letusan terakhir', String(p.letus)]);
      return { judul: String(p.nama ?? 'Gunung api'), src: gunungLive ? 'PVMBG / MAGMA · langsung' : 'registri GVP · status PVMBG menyusul', baris, catatan: lv >= 3 ? 'Status tinggi; ikuti arahan dan radius bahaya PVMBG.' : '' };
    }
    if (f.kind === 'udara') { const a = N(p.aqi); return { judul: `Udara · AQI ${a}`, src: 'WAQI · langsung', baris: [['Stasiun', String(p.nama ?? '-')], ['Kategori', aqiBand(a)]], catatan: a > 150 ? 'Kurangi aktivitas luar ruangan.' : '' }; }
    if (f.kind === 'banjir') { const s = N(p.state); return { judul: 'Laporan banjir', src: 'PetaBencana · langsung', baris: [['Lokasi', String(p.nama ?? '-')], ['Siaga', s >= 3 ? 'tinggi' : s >= 2 ? 'sedang' : 'rendah']], catatan: '' }; }
    if (f.kind === 'kebakaran') return { judul: 'Titik panas', src: 'NASA FIRMS / VIIRS · langsung', baris: [['Daya pancar', `${Math.round(N(p.frp))} MW`]], catatan: 'Anomali termal satelit; belum tentu kebakaran.' };
    if (f.kind === 'pesawat') return { judul: String(p.flight || 'Pesawat'), src: 'OpenSky Network · langsung', baris: [['Rute', String(p.rute ?? 'menelusuri…')], ['Ketinggian', p.alt != null ? `${N(p.alt).toLocaleString('id-ID')} kaki` : '-'], ['Arah', `${N(p.track) || 0}°`]], catatan: '' };
    if (f.kind === 'kapal') return { judul: String(p.nama || 'Kapal'), src: 'AISStream · langsung', baris: [['Tujuan', String(p.tujuan ?? '-')], ['Jenis', String(p.jenis ?? '-')], ['Kecepatan', `${N(p.kecepatan) || 0} knot`], ['Arah', `${N(p.track) || 0}°`]], catatan: '' };
    if (f.kind === 'karbon') {
      const SEKTOR: Record<string, string> = { power: 'Pembangkit listrik', manufacturing: 'Manufaktur', 'mineral-extraction': 'Tambang mineral', 'fossil-fuel-operations': 'Operasi migas/batu bara' };
      const baris: [string, string][] = [
        ['Emisi CO₂e', `${N(p.co2).toFixed(1)} juta ton/th`],
        ['Sektor', SEKTOR[String(p.sektor)] ?? String(p.sektor || '-')],
        ['Jenis', String(p.jenis || '-')],
      ];
      if (N(p.kapasitas) > 0) baris.push(['Kapasitas', `${N(p.kapasitas).toLocaleString('id-ID')} MW`]);
      if (p.pemilik) baris.push(['Pemilik', String(p.pemilik)]);
      return { judul: String(p.nama ?? 'Aset emisi'), src: 'Climate TRACE v6 · CC-BY', baris, catatan: 'Estimasi independen berbasis satelit.' };
    }
    if (f.kind === 'batubara') { const st = String(p.status); const label = st === 'beroperasi' ? 'Beroperasi' : st === 'konstruksi' ? 'Dalam konstruksi' : 'Direncanakan'; return { judul: String(p.plant ?? 'PLTU'), src: 'Global Energy Monitor · GCPT Jan 2026 · CC-BY', baris: [['Status', label], ['Kapasitas', `${N(p.mw).toLocaleString('id-ID')} MW`], ['Unit', String(p.units ?? '-')], ['Pemilik', String(p.owner ?? '-')]], catatan: st !== 'beroperasi' ? 'Bagian dari pipeline batu bara yang masih berlanjut.' : '' }; }
    if (f.kind === 'tambang') {
      const keg = String(p.kegiatan || '');
      const status = keg ? keg.charAt(0).toUpperCase() + keg.slice(1).toLowerCase() : '-';
      return {
        judul: String(p.usaha || 'Konsesi tambang'),
        src: 'ESDM · Ditjen Minerba · Satu Peta',
        baris: [
          ['Komoditas', String(p.komoditas || '-')],
          ['Status izin', status],
          ['Luas', p.luas ? `${N(p.luas).toLocaleString('id-ID')} ha` : '-'],
          ['Wilayah', [p.kab, p.prov].filter(Boolean).join(', ') || '-'],
        ],
        catatan: p.cnc ? `Clean & Clear: ${String(p.cnc)}; izin pertambangan (IUP).` : 'Izin Usaha Pertambangan (IUP).',
      };
    }
    if (f.kind === 'konsesi') {
      const JENIS: Record<string, string> = { sawit: 'Perkebunan sawit', hti: 'Hutan tanaman industri', logging: 'Hutan alam · IUPHHK-HA' };
      const jenis = String(p.jenis ?? '');
      const baris: [string, string][] = [['Jenis', (JENIS[jenis] ?? jenis) || '-']];
      if (p.izin) baris.push(['Izin', p.izin === 'usaha' ? 'Izin usaha' : 'Izin lokasi']);
      if (N(p.luas) > 0) baris.push(['Luas', `${N(p.luas).toLocaleString('id-ID')} ha`]);
      if (p.status) baris.push(['Status', String(p.status)]);
      if (p.grup) baris.push(['Grup', String(p.grup)]);
      if (p.sk) baris.push(['Nomor SK', String(p.sk)]);
      if (N(p.tahun) > 0) baris.push(['Terbit', String(p.tahun)]);
      const nama = String(p.nama || p.grup || '');
      return {
        judul: nama || `Konsesi ${JENIS[jenis] ?? jenis}`,
        src: 'KLHK · BIG Satu Peta',
        baris,
        catatan: p.izin === 'lokasi'
          ? 'Izin lokasi: tahap awal penyediaan lahan, belum tentu beroperasi.'
          : (jenis === 'sawit' ? 'Cakupan sawit sebagian (per kabupaten).' : 'Izin konsesi kehutanan.'),
      };
    }
    if (f.kind === 'satwa') {
      const KELAS: Record<string, string> = { mammalia: 'Mamalia', aves: 'Burung', reptilia: 'Reptil', amphibia: 'Amfibi' };
      // MapLibre stringifies array/object props on read — parse back defensively
      let sp: [string, string][] = [];
      try { sp = (typeof p.species === 'string' ? JSON.parse(p.species) : (p.species as unknown)) as [string, string][] ?? []; } catch { sp = []; }
      const cr = sp.filter((s) => s[1] === 'CR').length, en = sp.filter((s) => s[1] === 'EN').length;
      const top = sp.slice(0, 3).map((s) => `${s[0]} (${s[1]})`).join(', ');
      const baris: [string, string][] = [
        ['Kelas', KELAS[String(p.class)] ?? String(p.class || '-')],
        ['Spesies terancam', String(sp.length)],
      ];
      if (cr) baris.push(['Kritis · CR', String(cr)]);
      if (en) baris.push(['Genting · EN', String(en)]);
      return { judul: 'Satwa terancam', src: `Mandum Rimba · GBIF + IUCN${p.date ? ` · ${String(p.date)}` : ''}`, baris, catatan: top ? `Antara lain: ${top}.` : 'Sebaran perkiraan dari okurensi GBIF + status IUCN.' };
    }
    if (f.kind === 'sppg') {
      const ST: Record<string, string> = { 'Beroperasi': 'Beroperasi', 'Belum Beroperasi': 'Belum beroperasi', 'Penentuan KA SPPG': 'Penentuan lokasi (KA)' };
      const st = String(p.status ?? '');
      return {
        judul: `SPPG · ${String(p.id ?? '')}`.trim(),
        src: 'sismonbgn · status terdaftar, bukan sensus operasi',
        baris: [['Status', (ST[st] ?? st) || '-'], ['Program', 'Makan Bergizi Gratis']],
        catatan: String(p.alamat ?? '') || 'Titik terdaftar/diajukan.',
      };
    }
    return null;
  });

  /* the legend's honest status word per layer */
  function srcLabel(id: string, sumber: string): string {
    const src = sumber.split('/')[0].toUpperCase();
    if (id === 'gunungapi') return gunungLive ? `${src} · LANGSUNG` : `${src} · DAFTAR`;
    if (layerLive[id]) return layerKosong[id] ? `${src} · NIHIL` : `${src} · LANGSUNG`;
    return 'CONTOH';
  }

  /* ── the location report: which province a point falls in (ray-casting over
     the bundled ADM1 polygons), and what hazards sit near it (live quakes +
     the nearest monitored volcano) — the panel's "bahaya" line ── */
  function inRing(lon: number, lat: number, ring: number[][]): boolean {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i]![0]!, yi = ring[i]![1]!, xj = ring[j]![0]!, yj = ring[j]![1]!;
      if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function provAt(lon: number, lat: number): string {
    if (!provData) return 'Wilayah Indonesia';
    for (const f of provData.features) {
      const g = f.geometry;
      const polys = g.type === 'Polygon' ? [g.coordinates as number[][][]] : (g.coordinates as number[][][][]);
      for (const poly of polys) if (poly[0] && inRing(lon, lat, poly[0])) return f.properties.nama;
    }
    return 'Perairan / lepas pantai';
  }
  function distKm(aLon: number, aLat: number, bLon: number, bLat: number): number {
    const R = 6371, toR = Math.PI / 180;
    const dLat = (bLat - aLat) * toR, dLon = (bLon - aLon) * toR;
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * toR) * Math.cos(bLat * toR) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }
  /* the latest volcano set (live via the proxy if it landed, else contoh) */
  let volPts: GeoPt[] = LAYER_CONTOH.gunungapi ?? [];
  function ringkasBahaya(lon: number, lat: number): string {
    const out: string[] = [];
    const near = (gempaData.features as { geometry: { coordinates: [number, number] }; properties: { mag?: number } }[])
      .map((f) => ({ d: distKm(lon, lat, f.geometry.coordinates[0], f.geometry.coordinates[1]), mag: f.properties.mag ?? 0 }))
      .filter((q) => q.d <= 300)
      .sort((a, b) => a.d - b.d);
    if (near.length) out.push(`${near.length} gempa (24 jam) dalam 300 km; terdekat M${near[0]!.mag}, ${Math.round(near[0]!.d)} km.`);
    let bestV: GeoPt | null = null, bd = Infinity;
    for (const v of volPts) { const d = distKm(lon, lat, Number(v.lon), Number(v.lat)); if (d < bd) { bd = d; bestV = v; } }
    if (bestV && bd < 400) out.push(`Gunung api terdekat: ${bestV.nama} (${Math.round(bd)} km).`);
    return out.join(' ');
  }
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  function bukaTitik(lon: number, lat: number) {
    const x = clamp(lon, 95, 141), y = clamp(lat, -11, 6);
    titikProv = provAt(x, y);
    titikBahaya = ringkasBahaya(x, y);
    titik = { lon: x, lat: y };
    if (lensaKode !== 'nasional') dispatch({ cmd: 'set_lensa', params: { kode: 'nasional' } });
  }
  function tutupTitik() { titik = null; titikMode = false; if (map) map.getCanvas().style.cursor = ''; }
  function setTitikMode(onState: boolean) {
    titikMode = onState;
    if (map) map.getCanvas().style.cursor = onState ? 'crosshair' : '';
  }

  /* Each layer gets its own canvas-drawn marker (so shapes are robust regardless
     of map fonts): a seismic ring, a volcano triangle, an air square, a flood
     plus, a fire spark, a plane, a ship — planes/ships rotate by heading. */
  function iconData(shape: string, color: string): ImageData {
    const s = 44, m = s / 2;
    const cv = document.createElement('canvas'); cv.width = s; cv.height = s;
    const x = cv.getContext('2d')!;
    x.lineJoin = 'round'; x.lineCap = 'round'; x.fillStyle = color; x.strokeStyle = color;
    const edge = () => { x.lineWidth = 2.4; x.strokeStyle = 'rgba(255,255,255,0.92)'; x.stroke(); };
    if (shape === 'ring') {
      x.beginPath(); x.arc(m, m, s * 0.30, 0, Math.PI * 2);
      x.globalAlpha = 0.22; x.fill(); x.globalAlpha = 1; x.lineWidth = s * 0.10; x.stroke();
    } else if (shape === 'triangle') {
      const r = s * 0.34; x.beginPath(); x.moveTo(m, m - r); x.lineTo(m + r * 0.92, m + r * 0.72); x.lineTo(m - r * 0.92, m + r * 0.72); x.closePath(); x.fill(); edge();
    } else if (shape === 'square') {
      const r = s * 0.25; x.beginPath(); x.rect(m - r, m - r, r * 2, r * 2); x.fill(); edge();
    } else if (shape === 'plus') {
      const a = s * 0.10, b = s * 0.30; x.beginPath(); x.rect(m - a, m - b, a * 2, b * 2); x.rect(m - b, m - a, b * 2, a * 2); x.fill(); edge();
    } else if (shape === 'spark') {
      const R = s * 0.33, r = s * 0.14; x.beginPath();
      for (let i = 0; i < 8; i++) { const ang = (Math.PI / 4) * i - Math.PI / 2, rad = i % 2 ? r : R; const px = m + Math.cos(ang) * rad, py = m + Math.sin(ang) * rad; i ? x.lineTo(px, py) : x.moveTo(px, py); }
      x.closePath(); x.fill(); edge();
    } else if (shape === 'plane') {
      x.beginPath();
      x.moveTo(m, m - s * 0.34); x.lineTo(m + s * 0.07, m - s * 0.02); x.lineTo(m + s * 0.30, m + s * 0.10);
      x.lineTo(m + s * 0.07, m + s * 0.12); x.lineTo(m + s * 0.09, m + s * 0.30); x.lineTo(m, m + s * 0.22);
      x.lineTo(m - s * 0.09, m + s * 0.30); x.lineTo(m - s * 0.07, m + s * 0.12); x.lineTo(m - s * 0.30, m + s * 0.10);
      x.lineTo(m - s * 0.07, m - s * 0.02); x.closePath(); x.fill(); edge();
    } else if (shape === 'ship') {
      x.beginPath(); x.moveTo(m, m - s * 0.32); x.lineTo(m + s * 0.18, m + s * 0.26); x.lineTo(m, m + s * 0.14); x.lineTo(m - s * 0.18, m + s * 0.26); x.closePath(); x.fill(); edge();
    } else if (shape === 'disc') {
      x.beginPath(); x.arc(m, m, s * 0.26, 0, Math.PI * 2); x.fill(); edge();
    }
    return x.getImageData(0, 0, s, s);
  }
  function ensureIcons() {
    if (!map) return;
    const specs = [{ id: 'gempa', shape: 'ring', color: '#e44a06' }, ...LAYERS.map((l) => ({ id: l.id, shape: l.shape, color: l.color }))];
    for (const sp of specs) if (!map.hasImage(`ic-${sp.id}`)) map.addImage(`ic-${sp.id}`, iconData(sp.shape, sp.color), { pixelRatio: 2 });
  }

  /* ghost trails: the last few positions of each moving object, as fading lines */
  const histPesawat = new Map<string, [number, number][]>();
  const histKapal = new Map<string, [number, number][]>();
  function pushHist(hist: Map<string, [number, number][]>, id: string, lon: number, lat: number, cap = 6) {
    if (!id) return;
    const arr = hist.get(id) ?? []; arr.push([lon, lat]); if (arr.length > cap) arr.shift(); hist.set(id, arr);
    if (hist.size > 1200) { const k = hist.keys().next().value; if (k) hist.delete(k); }
  }
  function trailFC(hist: Map<string, [number, number][]>) {
    const features: unknown[] = [];
    for (const path of hist.values()) if (path.length >= 2) features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: path }, properties: {} });
    return { type: 'FeatureCollection', features };
  }
  const setSrc = (id: string, data: unknown) => (map?.getSource(id) as { setData?: (d: unknown) => void } | undefined)?.setData?.(data);

  function addDataLayers() {
    if (!map) return;
    ensureIcons();
    if (!map.getSource('gempa')) map.addSource('gempa', { type: 'geojson', data: gempaData });
    if (!map.getLayer('gempa-dot')) {
      map.addLayer({
        id: 'gempa-dot', type: 'symbol', source: 'gempa',
        layout: {
          visibility: gempaOn ? 'visible' : 'none',
          'icon-image': 'ic-gempa', 'icon-allow-overlap': true, 'icon-ignore-placement': true,
          'icon-size': ['interpolate', ['linear'], ['get', 'mag'], 3, 0.5, 7, 1.7],
        },
        paint: { 'icon-opacity': 0.9 },
      });
    }
    for (const L of LAYERS) {
      // seed the volcano board from the loaded registry (volPts) so all ~101 summits
      // survive a basemap switch — which re-runs addDataLayers and would otherwise reset
      // the source to the 6-item contoh. Other layers seed from contoh until live.
      const seed = L.id === 'gunungapi' ? volPts : (LAYER_CONTOH[L.id] ?? []);
      if (!map.getSource(L.id)) map.addSource(L.id, { type: 'geojson', data: ptsGeo(seed) });
      if (L.trail && !map.getSource(`${L.id}-trail`)) {
        map.addSource(`${L.id}-trail`, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } as never });
        map.addLayer({
          id: `${L.id}-trail-line`, type: 'line', source: `${L.id}-trail`,
          layout: { visibility: layerOn[L.id] ? 'visible' : 'none', 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': L.color, 'line-width': 1.1, 'line-opacity': 0.32 },
        });
      }
      if (!map.getLayer(`${L.id}-dot`)) {
        map.addLayer({
          id: `${L.id}-dot`, type: 'symbol', source: L.id,
          layout: {
            visibility: layerOn[L.id] ? 'visible' : 'none',
            'icon-image': `ic-${L.id}`, 'icon-allow-overlap': true, 'icon-ignore-placement': true,
            'icon-size': L.size as never,
            ...(L.rotate ? { 'icon-rotate': ['get', 'track'], 'icon-rotation-alignment': 'map' } : {}),
          } as never,
          paint: { 'icon-opacity': 0.95 },
        });
      }
    }
    addProvinsi();
    addTambang();
    addKonsesi();
    addSatwa();
    addSppg();
    addJalan();
    addHujan();
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
    const style = p === 'satelit' ? SATELIT_STYLE : p === 'cuaca' ? GIBS_STYLE : p === 'malam' ? MALAM_STYLE : DINAS_STYLE;
    map.setStyle(style as never);
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
    const v = onState ? 'visible' : 'none';
    if (map?.getLayer(`${id}-dot`)) map.setLayoutProperty(`${id}-dot`, 'visibility', v);
    if (map?.getLayer(`${id}-trail-line`)) map.setLayoutProperty(`${id}-trail-line`, 'visibility', v);
  }

  /* streets on demand: OpenFreeMap's road vectors (OpenMapTiles schema), overlaid on
     ANY plate — so you can zoom into a satellite or night-lights tile and still read
     the street names. Off by default; only paints from z9 (labels z12) to stay clean. */
  function addJalan() {
    if (!map) return;
    const dark = plat === 'satelit' || plat === 'cuaca' || plat === 'malam';
    const ink = dark ? '#f2efe6' : '#15130e';
    const vis = jalanOn ? 'visible' : 'none';
    if (!map.getSource('ofm')) map.addSource('ofm', { type: 'vector', url: 'https://tiles.openfreemap.org/planet' });
    if (!map.getLayer('jalan')) {
      map.addLayer({
        id: 'jalan', type: 'line', source: 'ofm', 'source-layer': 'transportation', minzoom: 9,
        layout: { visibility: vis, 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': ink, 'line-opacity': dark ? 0.55 : 0.45, 'line-width': ['interpolate', ['linear'], ['zoom'], 9, 0.3, 16, 2.4] },
      } as never);
    }
    if (!map.getLayer('jalan-label')) {
      map.addLayer({
        id: 'jalan-label', type: 'symbol', source: 'ofm', 'source-layer': 'transportation_name', minzoom: 12,
        layout: { visibility: vis, 'symbol-placement': 'line', 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Regular'], 'text-size': 10, 'text-letter-spacing': 0.04 },
        paint: { 'text-color': ink, 'text-halo-color': dark ? '#05060a' : '#d6cbac', 'text-halo-width': 1.2 },
      } as never);
    }
  }
  function toggleJalan(onState: boolean) {
    jalanOn = onState;
    const v = onState ? 'visible' : 'none';
    for (const id of ['jalan', 'jalan-label']) if (map?.getLayer(id)) map.setLayoutProperty(id, 'visibility', v);
  }

  /* IMERG rainfall: NASA GIBS satellite precipitation (better over Indonesia than
     the radar) as a translucent raster overlay beneath the markers. Off by default;
     paints on any plate. */
  function addHujan() {
    if (!map) return;
    if (!map.getSource('hujan')) {
      map.addSource('hujan', {
        type: 'raster',
        tiles: [`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/IMERG_Precipitation_Rate/default/${IMERG_DATE}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`],
        tileSize: 256, maxzoom: 6,
        attribution: 'Hujan: NASA EOSDIS GIBS / GPM IMERG',
      });
    }
    if (!map.getLayer('hujan')) {
      const below = map.getLayer('gempa-dot') ? 'gempa-dot' : undefined;
      map.addLayer({ id: 'hujan', type: 'raster', source: 'hujan', layout: { visibility: hujanOn ? 'visible' : 'none' }, paint: { 'raster-opacity': 0.55 } }, below);
    }
  }
  function toggleHujan(onState: boolean) {
    hujanOn = onState;
    if (map?.getLayer('hujan')) map.setLayoutProperty('hujan', 'visibility', onState ? 'visible' : 'none');
  }

  /* TAMBANG: Indonesia's mining concessions (IUP/WIUP) — vendored from the open
     ESDM Geoportal to a generalised static asset (public/data/idn-tambang.geojson,
     4,797 permits). Translucent polygons coloured by commodity group; click for the
     company, permit activity, area, and Clean-&-Clear status. Off by default. */
  const TAMBANG_FILL = ['match', ['get', 'grup'],
    'batubara', '#2b2b2b', 'nikel', '#2f8f78', 'emas', '#c79a3a',
    'tembaga', '#b5651d', 'logam', '#6a7b8a', /* lain */ '#9a8f6f'] as unknown;
  function addTambang() {
    if (!map) return;
    const vis = tambangOn ? 'visible' : 'none';
    const below = map.getLayer('gempa-dot') ? 'gempa-dot' : undefined;
    if (!map.getSource('tambang')) map.addSource('tambang', { type: 'geojson', data: `${import.meta.env.BASE_URL}data/idn-tambang.geojson` });
    if (!map.getLayer('tambang-fill')) {
      map.addLayer({
        id: 'tambang-fill', type: 'fill', source: 'tambang', minzoom: 4.2,
        layout: { visibility: vis },
        paint: { 'fill-color': TAMBANG_FILL as never, 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 5, 0.3, 9, 0.5] },
      } as never, below);
    }
    if (!map.getLayer('tambang-line')) {
      map.addLayer({
        id: 'tambang-line', type: 'line', source: 'tambang', minzoom: 6,
        layout: { visibility: vis },
        paint: { 'line-color': TAMBANG_FILL as never, 'line-width': 0.5, 'line-opacity': 0.55 },
      } as never, below);
    }
  }
  function toggleTambang(onState: boolean) {
    tambangOn = onState;
    if (!map?.getSource('tambang')) addTambang();
    const v = onState ? 'visible' : 'none';
    for (const id of ['tambang-fill', 'tambang-line']) if (map?.getLayer(id)) map.setLayoutProperty(id, 'visibility', v);
  }

  /* SATWA TERANCAM: threatened-species range polygons (151), compiled by the open
     observatory Mandum Rimba from GBIF occurrences + IUCN Red List + ESA WorldCover.
     Browser-direct (CORS *, keyless), coloured by taxonomic class; click for the
     species in that range and their IUCN status. Off by default; loads only on first
     toggle, and degrades to a small illustrative contoh set if the source is dark. */
  const SATWA_FILL = ['match', ['get', 'class'],
    'mammalia', '#9c6b3f', 'aves', '#3f7d9a', 'reptilia', '#5f8a3f', 'amphibia', '#7a5ca8',
    /* lain */ '#6a7b8a'] as unknown;
  const SATWA_CONTOH = {
    type: 'FeatureCollection' as const,
    features: [
      { type: 'Feature' as const, properties: { class: 'mammalia', level: 1, species: [['Pongo abelii', 'CR'], ['Panthera tigris sumatrae', 'CR']], date: '1990–2026' }, geometry: { type: 'Polygon' as const, coordinates: [[[98.5, 1.5], [100.6, 1.5], [100.6, 3.6], [98.5, 3.6], [98.5, 1.5]]] } },
      { type: 'Feature' as const, properties: { class: 'aves', level: 1, species: [['Cacatua sulphurea', 'CR']], date: '1990–2026' }, geometry: { type: 'Polygon' as const, coordinates: [[[113, -3.5], [116, -3.5], [116, -0.6], [113, -0.6], [113, -3.5]]] } },
      { type: 'Feature' as const, properties: { class: 'mammalia', level: 1, species: [['Zaglossus bruijnii', 'CR']], date: '1990–2026' }, geometry: { type: 'Polygon' as const, coordinates: [[[136, -4.6], [139, -4.6], [139, -2.4], [136, -2.4], [136, -4.6]]] } },
    ],
  };
  function addSatwa() {
    if (!map) return;
    const vis = satwaOn ? 'visible' : 'none';
    const below = map.getLayer('gempa-dot') ? 'gempa-dot' : undefined;
    if (!map.getSource('satwa')) map.addSource('satwa', { type: 'geojson', data: SATWA_CONTOH as never });
    if (!map.getLayer('satwa-fill')) {
      map.addLayer({
        id: 'satwa-fill', type: 'fill', source: 'satwa', minzoom: 3.5,
        layout: { visibility: vis },
        paint: { 'fill-color': SATWA_FILL as never, 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 4, 0.18, 8, 0.32] },
      } as never, below);
    }
    if (!map.getLayer('satwa-line')) {
      map.addLayer({
        id: 'satwa-line', type: 'line', source: 'satwa', minzoom: 3.5,
        layout: { visibility: vis },
        paint: { 'line-color': SATWA_FILL as never, 'line-width': 0.6, 'line-opacity': 0.5 },
      } as never, below);
    }
  }
  /* fetch the real range set once, browser-direct; keep contoh on any failure */
  async function muatSatwa() {
    if (satwaLive || !map?.getSource('satwa')) return;
    try {
      const res = await fetch('https://www.mandumrimba.org/data/species-distribution.geojson', { signal: AbortSignal.timeout(8000) });
      const data = (await res.json()) as { features?: unknown[] };
      if (data?.features?.length) { setSrc('satwa', data); satwaLive = true; }
    } catch { /* contoh stays */ }
  }
  function toggleSatwa(onState: boolean) {
    satwaOn = onState;
    if (!map?.getSource('satwa')) addSatwa();
    const v = onState ? 'visible' : 'none';
    for (const id of ['satwa-fill', 'satwa-line']) if (map?.getLayer(id)) map.setLayoutProperty(id, 'visibility', v);
    if (onState) void muatSatwa();
  }

  /* SPPG · MBG: the kitchen units of the Makan Bergizi Gratis free-meal program,
     vendored from the open monitor sismonbgn.com (scripts/build-sppg.mjs). Coloured by
     status so the honest gap shows on the map — at capture only ~28 of ~5,600 are
     "Beroperasi"; the rest are proposed/not-yet. Labelled terdaftar, never an operating
     census (Iron Law #1). Off by default; lazy-loads the 1.5 MB set on first toggle. */
  const SPPG_COLOR = ['match', ['get', 'status'],
    'Beroperasi', '#2f8f4e',        // operating — the few, in green
    'Belum Beroperasi', '#c98a3a',  // not yet operating — amber
    'Penentuan KA SPPG', '#9a8f6f', // earliest stage — faint
    /* lain */ '#9a8f6f'] as unknown;
  const SPPG_CONTOH = {
    type: 'FeatureCollection' as const,
    features: [
      { type: 'Feature' as const, properties: { id: 'contoh-1', status: 'Beroperasi', alamat: 'contoh · Kota Bandung, Jawa Barat' }, geometry: { type: 'Point' as const, coordinates: [107.6, -6.92] } },
      { type: 'Feature' as const, properties: { id: 'contoh-2', status: 'Belum Beroperasi', alamat: 'contoh · Kab. Sukoharjo, Jawa Tengah' }, geometry: { type: 'Point' as const, coordinates: [110.78, -7.57] } },
      { type: 'Feature' as const, properties: { id: 'contoh-3', status: 'Penentuan KA SPPG', alamat: 'contoh · Kab. Bantul, DIY' }, geometry: { type: 'Point' as const, coordinates: [110.33, -7.9] } },
    ],
  };
  function addSppg() {
    if (!map) return;
    const vis = sppgOn ? 'visible' : 'none';
    const below = map.getLayer('gempa-dot') ? 'gempa-dot' : undefined;
    if (!map.getSource('sppg')) map.addSource('sppg', { type: 'geojson', data: SPPG_CONTOH as never });
    if (!map.getLayer('sppg-dot')) {
      map.addLayer({
        id: 'sppg-dot', type: 'circle', source: 'sppg',
        layout: { visibility: vis },
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 1.4, 9, 4],
          'circle-color': SPPG_COLOR as never,
          'circle-opacity': 0.82,
          'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 6, 0, 8, 0.6],
          'circle-stroke-color': 'rgba(255,255,255,0.85)',
        },
      } as never, below);
    }
  }
  async function muatSppg() {
    if (sppgLive || !map?.getSource('sppg')) return;
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}data/idn-sppg.geojson`, { signal: AbortSignal.timeout(10000) });
      const data = (await res.json()) as { features?: unknown[] };
      if (data?.features?.length) { setSrc('sppg', data); sppgLive = true; }
    } catch { /* contoh stays */ }
  }
  function toggleSppg(onState: boolean) {
    sppgOn = onState;
    if (!map?.getSource('sppg')) addSppg();
    if (map?.getLayer('sppg-dot')) map.setLayoutProperty('sppg-dot', 'visibility', onState ? 'visible' : 'none');
    if (onState) void muatSppg();
  }

  /* KONSESI: forest & plantation concessions from the government original (KLHK) via
     BIG SatuPeta — logging (IUPHHK-HA) + industrial timber (IUPHHK-HT) nationwide, and
     oil-palm permits (izin usaha/lokasi) where the open data has them. Vendored +
     server-side generalised (scripts/build-konsesi.mjs), CC-clean Satu Peta. Polygons
     coloured by jenis; pairs with the mining (TAMBANG) layer. Off by default. */
  const KONSESI_FILL = ['match', ['get', 'jenis'],
    'sawit', '#d19a3a', 'hti', '#9c6b4f', 'logging', '#6f8a4a',
    /* lain */ '#9a8f6f'] as unknown;
  function addKonsesi() {
    if (!map) return;
    const vis = konsesiOn ? 'visible' : 'none';
    const below = map.getLayer('gempa-dot') ? 'gempa-dot' : undefined;
    if (!map.getSource('konsesi')) map.addSource('konsesi', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } as never });
    if (!map.getLayer('konsesi-fill')) {
      map.addLayer({
        id: 'konsesi-fill', type: 'fill', source: 'konsesi', minzoom: 4.2,
        layout: { visibility: vis },
        paint: { 'fill-color': KONSESI_FILL as never, 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 5, 0.28, 9, 0.45] },
      } as never, below);
    }
    if (!map.getLayer('konsesi-line')) {
      map.addLayer({
        id: 'konsesi-line', type: 'line', source: 'konsesi', minzoom: 6,
        layout: { visibility: vis },
        paint: { 'line-color': KONSESI_FILL as never, 'line-width': 0.5, 'line-opacity': 0.5 },
      } as never, below);
    }
  }
  async function muatKonsesi() {
    if (konsesiLive || !map?.getSource('konsesi')) return;
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}data/idn-konsesi.geojson`, { signal: AbortSignal.timeout(12000) });
      const data = (await res.json()) as { features?: unknown[] };
      if (data?.features?.length) { setSrc('konsesi', data); konsesiLive = true; }
    } catch { /* stays empty */ }
  }
  function toggleKonsesi(onState: boolean) {
    konsesiOn = onState;
    if (!map?.getSource('konsesi')) addKonsesi();
    const v = onState ? 'visible' : 'none';
    for (const id of ['konsesi-fill', 'konsesi-line']) if (map?.getLayer(id)) map.setLayoutProperty(id, 'visibility', v);
    if (onState) void muatKonsesi();
  }

  /* best-effort live data: PetaBencana is keyless/CORS; the rest go through the
     Worker /geo proxy when PUBLIC_AKSARA_URL is set. Any failure keeps contoh. */
  async function muatLapisan() {
    // a feed that answers (even with zero points) is LIVE; only a thrown fetch keeps contoh
    const setLayer = (id: string, pts: GeoPt[]) => {
      setSrc(id, ptsGeo(pts));
      layerLive[id] = true;
      layerKosong[id] = pts.length === 0;
    };
    // volcanoes: start from the bundled registry so the full board always shows, and
    // COMMIT IT IMMEDIATELY — independent of the slower hazard feeds below. Previously
    // this commit sat at the end of the function, behind petabencana + emisi + four
    // sequential AKSARA fetches, so a slow/hung feed left only the ~6 contoh summits.
    await gunungReady;
    let vol = (gunungBase.length ? gunungBase : (LAYER_CONTOH.gunungapi ?? [])).map((v) => ({ ...v }));
    volPts = vol;
    setSrc('gunungapi', ptsGeo(vol));
    layerLive.gunungapi = true;

    try {
      const res = await fetch('https://data.petabencana.id/reports?timeperiod=43200', { signal: AbortSignal.timeout(6000) });
      const data = (await res.json()) as { result?: { features?: { geometry?: { coordinates?: number[] }; properties?: Record<string, unknown> }[] } };
      const pts = (data.result?.features ?? [])
        .map((f) => ({ lon: f.geometry?.coordinates?.[0] ?? NaN, lat: f.geometry?.coordinates?.[1] ?? NaN, state: Number(f.properties?.state ?? 1), nama: String(f.properties?.title ?? 'laporan') }))
        .filter((p) => Number.isFinite(p.lon) && Number.isFinite(p.lat));
      setLayer('banjir', pts as GeoPt[]);
    } catch { /* contoh stays */ }

    // Emisi CO₂ — Indonesia's largest NON-power heavy industry: steel/cement
    // (manufacturing), mineral extraction, and oil & gas operations. POWER is
    // deliberately excluded — those are the coal plants already in the batubara layer,
    // so including them made CO₂ dots overlap the coal dots (same story twice). Vendored
    // from Climate TRACE v6 to a static asset (scripts/build-emisi.mjs). Keyless, CC-BY.
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}data/idn-emisi.geojson`, { signal: AbortSignal.timeout(8000) });
      const data = (await res.json()) as { features?: { geometry?: { coordinates?: number[] }; properties?: GeoPt }[] };
      const pts = (data.features ?? [])
        .map((f) => ({ ...(f.properties ?? {}), lon: f.geometry?.coordinates?.[0] ?? NaN, lat: f.geometry?.coordinates?.[1] ?? NaN }))
        .filter((p) => Number.isFinite(p.lon) && Number.isFinite(p.lat));
      if (pts.length) setLayer('karbon', pts as GeoPt[]);
    } catch { /* contoh stays */ }

    // Coal fleet + pipeline: GEM Global Coal Plant Tracker (Jan 2026, CC-BY),
    // vendored to a 28KB static asset — 111 plants by status (beroperasi/konstruksi/rencana).
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}data/idn-batubara.geojson`, { signal: AbortSignal.timeout(8000) });
      const data = (await res.json()) as { features?: { geometry?: { coordinates?: number[] }; properties?: GeoPt }[] };
      const pts = (data.features ?? [])
        .map((f) => ({ ...(f.properties ?? {}), lon: f.geometry?.coordinates?.[0] ?? NaN, lat: f.geometry?.coordinates?.[1] ?? NaN }))
        .filter((p) => Number.isFinite(p.lon) && Number.isFinite(p.lat));
      if (pts.length) setLayer('batubara', pts as GeoPt[]);
    } catch { /* contoh stays */ }

    if (AKSARA_URL) {
      for (const id of ['gunungapi', 'udara', 'kebakaran', 'pesawat']) {
        try {
          const res = await fetch(`${AKSARA_URL}/geo/${id}`, { signal: AbortSignal.timeout(6000) });
          const data = (await res.json()) as { features?: { geometry?: { coordinates?: number[] }; properties?: GeoPt }[] };
          const pts = (data.features ?? [])
            .map((f) => ({ ...(f.properties ?? {}), lon: f.geometry?.coordinates?.[0] ?? NaN, lat: f.geometry?.coordinates?.[1] ?? NaN }))
            .filter((p) => Number.isFinite(p.lon) && Number.isFinite(p.lat));
          if (id === 'gunungapi') {
            // merge today's PVMBG alert levels onto the bundled registry, by name.
            // Names differ between sources (MAGMA "Anak Krakatau" vs GVP "Krakatau",
            // "Gunung X" prefixes), so match on a stripped key. The registry owns the
            // coordinates — unmatched MAGMA rows are NEVER pushed (their coords may be
            // absent/0,0), they'd otherwise drop a dot in the ocean.
            const key = (s: unknown) => String(s ?? '').toLowerCase()
              .replace(/\b(gunung|anak|komplek|kompleks|kaldera|g\.)\b/g, '').replace(/[^a-z]/g, '');
            if (pts.length) {
              const byName = new Map(pts.map((p) => [key(p.nama), p]));
              let merged = 0;
              vol = vol.map((v) => { const m = byName.get(key(v.nama)); if (m) merged++; return m ? { ...v, level: m.level ?? v.level } : v; });
              if (merged) gunungLive = true;
            }
          } else {
            setLayer(id, pts as GeoPt[]);
          }
        } catch { /* contoh stays */ }
      }
    }

    // re-commit the board to apply any live PVMBG alert levels merged above (the full
    // set of summits is already on the map from the early commit at the top)
    setSrc('gunungapi', ptsGeo(vol));
    volPts = vol;
    layerLive.gunungapi = true;
  }

  const jamWIB = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(11, 16);
  /* Quakes, keyless + browser-direct, refreshed on a timer: BMKG for Indonesian
     detail, merged with USGS (M2.5+, 24h, clipped to the archipelago) for the
     regional picture, deduped by proximity. Each event keeps its true lat/lon. */
  type Gempa = { mag: number; lon: number; lat: number; wilayah: string; jam: string };
  async function refreshGempa() {
    const merged: Gempa[] = [];
    try {
      const res = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json', { signal: AbortSignal.timeout(6000) });
      const data = (await res.json()) as { Infogempa?: { gempa?: { Coordinates: string; Magnitude: string; Wilayah: string; Jam: string }[] } };
      for (const g of data.Infogempa?.gempa ?? []) {
        const [lat, lon] = g.Coordinates.split(',').map(Number);
        if (Number.isFinite(lon) && Number.isFinite(lat)) merged.push({ mag: Number(g.Magnitude), lon: lon!, lat: lat!, wilayah: g.Wilayah, jam: g.Jam });
      }
    } catch { /* USGS may still fill in */ }
    const bmkgN = merged.length;
    if (bmkgN) { gempaLive = true; infoGempa = `M${merged[0]!.mag} · ${merged[0]!.wilayah} · ${merged[0]!.jam}`; }
    try {
      const [[x0, y0], [x1, y1]] = IDN_BOUNDS;
      const res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson', { signal: AbortSignal.timeout(6000) });
      const data = (await res.json()) as { features?: { properties?: { mag?: number; place?: string; time?: number }; geometry?: { coordinates?: number[] } }[] };
      for (const f of data.features ?? []) {
        const c = f.geometry?.coordinates; if (!c) continue;
        const lon = c[0]!, lat = c[1]!;
        if (lon < x0 || lon > x1 || lat < y0 || lat > y1) continue;
        if (merged.some((m) => Math.abs(m.lon - lon) < 0.3 && Math.abs(m.lat - lat) < 0.3)) continue;
        const t = f.properties?.time ? new Date(f.properties.time + 7 * 3600_000).toISOString().slice(11, 16).replace(':', '.') + ' WIB' : '';
        merged.push({ mag: Math.round((f.properties?.mag ?? 0) * 10) / 10, lon, lat, wilayah: f.properties?.place ?? 'USGS', jam: t });
      }
      if (merged.length) gempaLive = true;
      if (!bmkgN && merged.length) infoGempa = `M${merged[0]!.mag} · ${merged[0]!.wilayah}`;
    } catch { /* BMKG result, if any, stands */ }
    if (merged.length) {
      gempaData = gempaGeojson(merged.slice(0, 50));
      (map?.getSource('gempa') as { setData?: (d: unknown) => void } | undefined)?.setData?.(gempaData);
    }
    updatedAt = jamWIB();
  }

  /* Planes: adsb.lol through the worker proxy, refreshed on a short timer so they
     move. Keeps the last positions if a refresh fails. */
  async function refreshPesawat() {
    if (!AKSARA_URL || !map?.getSource('pesawat')) return;
    try {
      const res = await fetch(`${AKSARA_URL}/geo/pesawat`, { signal: AbortSignal.timeout(15000) });
      const data = (await res.json()) as { features?: { geometry?: { coordinates?: number[] }; properties?: GeoPt }[] };
      const pts = (data.features ?? [])
        .map((f) => ({ ...(f.properties ?? {}), lon: f.geometry?.coordinates?.[0] ?? NaN, lat: f.geometry?.coordinates?.[1] ?? NaN }))
        .filter((p) => Number.isFinite(p.lon) && Number.isFinite(p.lat));
      if (pts.length) {
        setSrc('pesawat', ptsGeo(pts as GeoPt[])); layerLive.pesawat = true;
        for (const p of pts) pushHist(histPesawat, String((p as Record<string, unknown>).hex ?? ''), Number(p.lon), Number(p.lat));
        setSrc('pesawat-trail', trailFC(histPesawat));
      }
    } catch { /* keep last positions */ }
  }

  /* Ships: AISStream over a browser WebSocket (key is PUBLIC_, best-effort),
     accumulating positions into the kapal layer; connected only while toggled on. */
  const AIS_KEY = import.meta.env.PUBLIC_AISSTREAM_KEY as string | undefined;
  let aisWS: WebSocket | undefined;
  let aisFlush: ReturnType<typeof setInterval> | undefined;
  let aisWant = false;
  let aisRetry: ReturnType<typeof setTimeout> | undefined;
  const kapal = new Map<string, GeoPt>();
  /* a vessel's destination + type arrive in slower ShipStaticData messages, keyed by
     MMSI; we cache and merge them onto the live position so the popup can read them */
  const kapalStatic = new Map<string, { tujuan?: string; jenis?: string }>();
  function jenisKapal(t: number): string {
    if (t >= 80 && t <= 89) return 'tanker';
    if (t >= 70 && t <= 79) return 'kargo';
    if (t >= 60 && t <= 69) return 'penumpang';
    if (t >= 50 && t <= 59) return 'tunda/khusus';
    if (t >= 40 && t <= 49) return 'kapal cepat';
    if (t >= 30 && t <= 39) return 'nelayan/khusus';
    return '';
  }
  function connectAIS() {
    if (!AIS_KEY) return;
    aisWant = true;
    if (aisWS) return;
    try {
      const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');
      aisWS = ws;
      ws.onopen = () => ws.send(JSON.stringify({ APIKey: AIS_KEY, BoundingBoxes: [[[-11, 95], [6, 141]]], FilterMessageTypes: ['PositionReport', 'ShipStaticData'] }));
      ws.onmessage = (ev) => {
        try {
          const m = JSON.parse(String(ev.data)) as { MetaData?: Record<string, unknown>; Message?: { PositionReport?: Record<string, unknown>; ShipStaticData?: Record<string, unknown> } };
          const meta = m.MetaData;
          if (!meta) return;
          const id = String(meta.MMSI ?? '');
          if (!id) return;
          const ssd = m.Message?.ShipStaticData;
          if (ssd) {
            const tujuan = String(ssd.Destination ?? '').trim();
            const jenis = jenisKapal(Number(ssd.Type ?? ssd.ShipType ?? 0) || 0);
            const prev = kapalStatic.get(id) ?? {};
            kapalStatic.set(id, { tujuan: tujuan || prev.tujuan, jenis: jenis || prev.jenis });
            const cur = kapal.get(id);
            if (cur) kapal.set(id, { ...cur, ...(tujuan ? { tujuan } : {}), ...(jenis ? { jenis } : {}) });
            return;
          }
          const pr = m.Message?.PositionReport;
          if (!pr) return;
          const lat = Number(meta.latitude ?? pr.Latitude);
          const lon = Number(meta.longitude ?? pr.Longitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
          if (kapal.size > 1200 && !kapal.has(id)) { const k = kapal.keys().next().value; if (k) kapal.delete(k); }
          const st = kapalStatic.get(id) ?? {};
          kapal.set(id, { lon, lat, nama: String(meta.ShipName ?? '').trim(), kecepatan: Number(pr.Sog ?? 0) || 0, track: Number(pr.Cog ?? pr.TrueHeading ?? 0) || 0, ...(st.tujuan ? { tujuan: st.tujuan } : {}), ...(st.jenis ? { jenis: st.jenis } : {}) });
          pushHist(histKapal, id, lon, lat);
        } catch { /* ignore one message */ }
      };
      ws.onclose = () => {
        if (aisWS === ws) aisWS = undefined;
        // AISStream free keys drop often (shared public key + connection caps);
        // reconnect with a short backoff while the layer is still wanted.
        if (aisWant && !aisRetry) aisRetry = setTimeout(() => { aisRetry = undefined; connectAIS(); }, 4000);
      };
      ws.onerror = () => { try { ws.close(); } catch { /* noop */ } };
      aisFlush = setInterval(() => {
        if (!map?.getSource('kapal') || !kapal.size) return;
        setSrc('kapal', ptsGeo([...kapal.values()]));
        setSrc('kapal-trail', trailFC(histKapal));
        layerLive.kapal = true;
      }, 3000);
    } catch { /* no ships layer */ }
  }
  function disconnectAIS() {
    aisWant = false;
    if (aisRetry) { clearTimeout(aisRetry); aisRetry = undefined; }
    if (aisFlush) { clearInterval(aisFlush); aisFlush = undefined; }
    try { aisWS?.close(); } catch { /* noop */ }
    aisWS = undefined;
  }

  onMount(() => {
    let unsubs: (() => void)[] = [];
    let cancelled = false;

    drawEngraving(engraveEl, { ...ENGRAVE_DINAS, caption: 'PLAT KABAR · MENUNGGU UBIN PETA' });
    const ro = new ResizeObserver(() => { if (!petaSiap) drawEngraving(engraveEl, ENGRAVE_DINAS); });
    ro.observe(engraveEl);

    // Esc steps back one tier: info card → regency → province → national.
    // A scroll-locked lightbox (the kliping lembar) owns the key while open.
    const onEsc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || document.body.style.overflow === 'hidden') return;
      if (fitur) { fitur = null; return; }
      if (lensaKab) { setLensaKab(null); return; }
      if (lensaKode !== 'nasional') dispatch({ cmd: 'set_lensa', params: { kode: 'nasional' } });
    };
    window.addEventListener('keydown', onEsc);
    unsubs.push(() => window.removeEventListener('keydown', onEsc));

    // live feeds: BMKG quakes (refreshed on a timer) + RainViewer, best-effort
    void refreshGempa();
    const gempaIv = setInterval(() => void refreshGempa(), 120_000);
    const pesawatIv = setInterval(() => void refreshPesawat(), 20_000);
    (async () => {
      try {
        const res = await fetch('https://api.rainviewer.com/public/weather-maps.json', { signal: AbortSignal.timeout(6000) });
        const data = (await res.json()) as { radar?: { past?: { time: number }[] } };
        radarTs = data.radar?.past?.at(-1)?.time ?? null;
      } catch { /* radar is an optional overlay; GIBS is the CUACA base */ }
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
        projFitur();
      });
      map.on('click', 'gempa-dot', (e) => {
        const f = e.features?.[0];
        const p = f?.properties as { mag?: number; wilayah?: string; jam?: string } | undefined;
        if (p) { infoGempa = `M${p.mag} · ${p.wilayah} · ${p.jam}`; bukaFitur('gempa', e.lngLat.lng, e.lngLat.lat, p as GeoPt); }
      });
      // every hazard marker opens the same single info card
      for (const L of LAYERS) {
        map.on('click', `${L.id}-dot`, (e) => {
          const f = e.features?.[0];
          if (f) bukaFitur(L.id, e.lngLat.lng, e.lngLat.lat, f.properties as GeoPt);
        });
        map.on('mouseenter', `${L.id}-dot`, () => { if (map && !titikMode) map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', `${L.id}-dot`, () => { if (map && !titikMode) map.getCanvas().style.cursor = ''; });
      }
      // click a mining concession: open its dossier card (company, commodity, area,
      // permit status). Registered before kab-fill so it reads on top when shown.
      map.on('click', 'tambang-fill', (e) => {
        if (titikMode || !tambangOn) return;
        const p = e.features?.[0]?.properties as GeoPt | undefined;
        if (p) bukaFitur('tambang', e.lngLat.lng, e.lngLat.lat, p);
      });
      // click a concession polygon: company / area / permit dossier
      map.on('click', 'konsesi-fill', (e) => {
        if (titikMode || !konsesiOn) return;
        const p = e.features?.[0]?.properties as GeoPt | undefined;
        if (p) bukaFitur('konsesi', e.lngLat.lng, e.lngLat.lat, p);
      });
      // click a species range: open its dossier (class, count, IUCN status)
      map.on('click', 'satwa-fill', (e) => {
        if (titikMode || !satwaOn) return;
        const p = e.features?.[0]?.properties as GeoPt | undefined;
        if (p) bukaFitur('satwa', e.lngLat.lng, e.lngLat.lat, p);
      });
      // click an SPPG kitchen point: status + address dossier
      map.on('click', 'sppg-dot', (e) => {
        if (titikMode || !sppgOn) return;
        const p = e.features?.[0]?.properties as GeoPt | undefined;
        if (p) bukaFitur('sppg', e.lngLat.lng, e.lngLat.lat, p);
      });
      // click a kabupaten — tiered: the first click from afar selects the PROVINCE
      // (tier 1); a click inside the already-selected province, or any click from
      // close range, drills to the REGENCY itself (tier 2, set_lensa_kab). Its name
      // reads off the zoomed-in map labels (kab-lab), never a popup.
      map.on('click', 'kab-fill', (e) => {
        if (titikMode) return; // armed for a point report: let the map click handle it
        const p = e.features?.[0]?.properties as { prov?: string; nama?: string } | undefined;
        if (!p?.prov || !p.nama) return;
        titik = null;
        const drill = lensaKode === p.prov || (map?.getZoom() ?? 0) >= 6.5;
        dispatch({ cmd: 'set_lensa', params: { kode: p.prov } });
        if (drill) {
          // a name that fails the wilayah join still files (breadcrumb-only card)
          const payload = buildKabPayload(p.prov, String(p.nama)) ?? { kode: '', nama: String(p.nama), prov: p.prov };
          dispatch({ cmd: 'set_lensa_kab', params: payload });
        }
      });
      // a bare-map click: drop the location panel if armed, else close the info card
      const DOT_LAYERS = ['gempa-dot', 'tambang-fill', 'konsesi-fill', 'satwa-fill', 'sppg-dot', ...LAYERS.map((l) => `${l.id}-dot`)];
      map.on('click', (e) => {
        if (titikMode) { bukaTitik(e.lngLat.lng, e.lngLat.lat); setTitikMode(false); return; }
        const live = DOT_LAYERS.filter((id) => map!.getLayer(id));
        const hit = live.length ? map!.queryRenderedFeatures(e.point, { layers: live }) : [];
        if (!hit.length) fitur = null;
      });
      map.on('mousemove', 'provinsi-fill', (e) => {
        const k = e.features?.[0]?.properties?.prov as string | undefined;
        if (!map || !k || k === hoverKode) return;
        hoverKode = k;
        if (map.getLayer('provinsi-hover')) map.setFilter('provinsi-hover', ['==', ['get', 'prov'], k]);
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'provinsi-fill', () => {
        if (!map) return;
        hoverKode = null;
        if (map.getLayer('provinsi-hover')) map.setFilter('provinsi-hover', ['==', ['get', 'prov'], '__none__']);
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
      unsubs.push(on('set_basemap', ({ plat: p }) => applyBasemap(p)));
      unsubs.push(on('set_layer', ({ layer, on: onState }) => {
        if (layer === 'gempa') toggleGempa(onState);
        else if (layer === 'provinsi') toggleProvinsi(onState);
        else if (layer === 'jalan') toggleJalan(onState);
        else if (layer === 'hujan') toggleHujan(onState);
        else if (layer === 'tambang') toggleTambang(onState);
        else if (layer === 'konsesi') toggleKonsesi(onState);
        else if (layer === 'satwa') toggleSatwa(onState);
        else if (layer === 'sppg') toggleSppg(onState);
        else if (LAYERS.some((l) => l.id === layer)) {
          toggleLayer(layer, onState);
          if (layer === 'kapal') (onState ? connectAIS() : disconnectAIS());
          if (layer === 'pesawat' && onState) void refreshPesawat();
        }
      }));
      unsubs.push(onLensa((k) => {
        lensaKode = k;
        // any drilled regency clears itself in lensa-kab.ts when the lens moves
        if (map?.getLayer('provinsi-sel-fill')) map.setFilter('provinsi-sel-fill', ['==', ['get', 'prov'], k]);
        if (map?.getLayer('provinsi-lab')) map.setFilter('provinsi-lab', ['==', ['get', 'kode'], k]);
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
      // the shared store is the single authority for tier 2: every speaker (map
      // click, Lensa Wilayah's TUTUP, a tour, Aksara) lands here. The regency
      // outline follows it, and the province tint drops to a hairline halo so
      // the drilled regency alone reads selected.
      unsubs.push(onLensaKab((k) => {
        lensaKab = k;
        provTerbuka = false; // the province context re-collapses for each new filing
        if (map?.getLayer('kab-sel')) {
          map.setFilter('kab-sel', k
            ? ['all', ['==', ['get', 'prov'], k.prov], ['==', ['get', 'nama'], k.nama]]
            : ['==', ['get', 'nama'], '__none__']);
        }
        if (map?.getLayer('provinsi-sel-fill')) map.setPaintProperty('provinsi-sel-fill', 'fill-opacity', k ? 0.05 : 0.12);
      }));

      unsubs.push(on('map_choropleth', ({ metric, judul }) => {
        if (!map?.getLayer('provinsi-fill')) return;
        if (metric === 'mati') {
          choroExpr = null; choroLegend = null;
          map.setPaintProperty('provinsi-fill', 'fill-color', (plat === 'satelit' || plat === 'cuaca' || plat === 'malam') ? '#f2efe6' : '#15130e');
          map.setPaintProperty('provinsi-fill', 'fill-opacity', 0.045);
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
      unsubs.push(on('lapor_lokasi', ({ lat, lon }) => {
        if (!map) return;
        setTitikMode(false);
        bukaTitik(lon, lat);
        map.flyTo({ center: [lon, lat], zoom: Math.max(map.getZoom(), 6), speed: 0.9, curve: 1.6 });
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
      clearInterval(gempaIv);
      clearInterval(pesawatIv);
      disconnectAIS();
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
    <button class="kb-tab" class:aktif={plat === 'cuaca'} onclick={() => pilihPlat('cuaca')}>CUACA</button>
    <button class="kb-tab" class:aktif={plat === 'malam'} onclick={() => pilihPlat('malam')}>MALAM</button>
  </div>

  <div class="kb-plate">
    <i class="kb-reg tl" aria-hidden="true"></i><i class="kb-reg tr" aria-hidden="true"></i>
    <i class="kb-reg bl" aria-hidden="true"></i><i class="kb-reg br" aria-hidden="true"></i>
    <div class="kb-peta" bind:this={mapEl}></div>
    <canvas class="kb-engrave" class:siap={petaSiap} bind:this={engraveEl} aria-hidden="true"></canvas>

    <div class="kb-legenda mono" class:buka={legendaBuka}>
      <button class="kb-leg-head" onclick={() => (legendaBuka = !legendaBuka)} aria-expanded={legendaBuka}>
        LEGENDA {legendaBuka ? '▾' : '▸'}
      </button>
      {#if legendaBuka}
        <div class="kb-leg-rows">
          <span class="kb-leg-group">PETA DASAR</span>
          <label class="kb-leg-row">
            <input type="checkbox" checked={provinsiOn} onchange={(e) => dispatch({ cmd: 'set_layer', params: { layer: 'provinsi', on: e.currentTarget.checked } })} />
            <span class="sym sym-prov">◆</span> PROVINSI · KLIK
            <span class="src">38 + NASIONAL</span>
          </label>
          <label class="kb-leg-row">
            <input type="checkbox" checked={jalanOn} onchange={(e) => dispatch({ cmd: 'set_layer', params: { layer: 'jalan', on: e.currentTarget.checked } })} />
            <span class="sym sym-jalan">╫</span> JALAN · NAMA
            <span class="src">OSM · ZOOM</span>
          </label>
          <label class="kb-leg-row">
            <input type="checkbox" checked={hujanOn} onchange={(e) => dispatch({ cmd: 'set_layer', params: { layer: 'hujan', on: e.currentTarget.checked } })} />
            <span class="sym sym-hujan">☂</span> HUJAN · IMERG
            <span class="src">GIBS · {IMERG_DATE.slice(5)}</span>
          </label>
          <span class="kb-leg-group kb-leg-group-2">DATA LANGSUNG</span>
          <label class="kb-leg-row">
            <input type="checkbox" checked={gempaOn} onchange={(e) => dispatch({ cmd: 'set_layer', params: { layer: 'gempa', on: e.currentTarget.checked } })} />
            <span class="sym gempa">◉</span> GEMPA · 24 JAM
            <span class="src">{gempaLive ? 'BMKG · LANGSUNG' : 'CONTOH'}</span>
          </label>
          {#each LAYERS as L (L.id)}
            <label class="kb-leg-row">
              <input type="checkbox" checked={layerOn[L.id]} onchange={(e) => dispatch({ cmd: 'set_layer', params: { layer: L.id, on: e.currentTarget.checked } })} />
              <span class={`sym sym-${L.id}`}>{L.sym}</span> {L.nama}
              <span class="src">{srcLabel(L.id, L.sumber)}</span>
            </label>
          {/each}
          <label class="kb-leg-row">
            <input type="checkbox" checked={tambangOn} onchange={(e) => dispatch({ cmd: 'set_layer', params: { layer: 'tambang', on: e.currentTarget.checked } })} />
            <span class="sym sym-tambang">▰</span> TAMBANG · IUP
            <span class="src">ESDM · 4.797</span>
          </label>
          <label class="kb-leg-row">
            <input type="checkbox" checked={konsesiOn} onchange={(e) => dispatch({ cmd: 'set_layer', params: { layer: 'konsesi', on: e.currentTarget.checked } })} />
            <span class="sym sym-konsesi">▰</span> KONSESI · HTI/HA/SAWIT
            <span class="src">{konsesiLive ? 'SATUPETA · 1.040' : 'KLHK'}</span>
          </label>
          <label class="kb-leg-row">
            <input type="checkbox" checked={satwaOn} onchange={(e) => dispatch({ cmd: 'set_layer', params: { layer: 'satwa', on: e.currentTarget.checked } })} />
            <span class="sym sym-satwa">▱</span> SATWA TERANCAM
            <span class="src">{satwaLive ? 'MANDUM · LANGSUNG' : 'CONTOH'}</span>
          </label>
          <label class="kb-leg-row">
            <input type="checkbox" checked={sppgOn} onchange={(e) => dispatch({ cmd: 'set_layer', params: { layer: 'sppg', on: e.currentTarget.checked } })} />
            <span class="sym sym-sppg">◍</span> SPPG · MBG
            <span class="src">{sppgLive ? '28 OPERASI / 5.598' : 'TERDAFTAR'}</span>
          </label>
        </div>
      {/if}
    </div>

    <div class="kb-koordinat mono">{koordinat}{#if updatedAt} · <span class="kb-live">⟳ {updatedAt} WIB</span>{/if}</div>

    <button class="kb-titik mono" class:aktif={titikMode} onclick={() => setTitikMode(!titikMode)}
            aria-pressed={titikMode} title="Laporan titik: klik satu tempat di peta">
      ◎ {titikMode ? 'PILIH TITIK…' : 'LAPOR TITIK'}
    </button>

    {#if titik}
      <LaporanLokasi lon={titik.lon} lat={titik.lat} provinsi={titikProv} bahaya={titikBahaya} tutup={tutupTitik} />
    {/if}

    {#if fitur && fiturView}
      <div class="kb-fitur mono" style={`left:${fitur.x}px; top:${fitur.y}px`}>
        <button class="kb-fitur-x" onclick={() => (fitur = null)} aria-label="Tutup">✕</button>
        <span class="kb-fitur-judul">{fiturView.judul}</span>
        <div class="kb-fitur-baris">
          {#each fiturView.baris as b}
            <div class="kb-fitur-row"><span>{b[0]}</span><b>{b[1]}</b></div>
          {/each}
        </div>
        {#if fiturView.catatan}<p class="kb-fitur-note">{fiturView.catatan}</p>{/if}
        <span class="kb-fitur-src">{fiturView.src}</span>
      </div>
    {/if}

    {#if dossier}
      <aside class="kb-dossier mono">
        {#snippet provBody(d: NonNullable<typeof dossier>)}
          <div class="kb-dossier-rank">
            <span class="kb-dossier-rank-n num">{d.ipmRank}</span><span class="kb-dossier-of">/{d.n} · IPM {d.ipm}</span>
          </div>
          <p class="kb-dossier-fakta">{d.fakta}</p>
          <div class="kb-dossier-tally">
            <span><b>{d.miskin}</b> miskin</span>
            <span><b>{d.dokter}</b> dr/1k</span>
            <span><b class="ember">{d.gempa}</b> gempa 24j</span>
          </div>
        {/snippet}
        <button class="kb-dossier-x" onclick={mundurTier} aria-label={dossierKab ? 'Kembali ke tingkat provinsi' : 'Tutup dasar wilayah'}>✕</button>
        {#if dossierKab}
          <!-- tier 2: the regency filing. PROV ▸ crumb steps back; province context expands in place below -->
          <nav class="kb-dossier-jejak" aria-label="Jejak wilayah">
            <button onclick={() => setLensaKab(null)}>{dossier.nama.toUpperCase()}</button>
            <span aria-hidden="true">▸</span>
            <b>KAB/KOTA</b>
          </nav>
          <h3 class="kb-dossier-nama">{dossierKab.nama}</h3>
          <div class="kb-dossier-baris">
            {#if dossierKab.ibukota}<div class="kb-dossier-row"><span>Ibu kota</span><b>{dossierKab.ibukota}</b></div>{/if}
            {#if dossierKab.pop}<div class="kb-dossier-row"><span>Penduduk</span><b>{fmtN(dossierKab.pop)} <i>№{dossierKab.rankPop}/{dossierKab.nKab}</i></b></div>{/if}
            {#if dossierKab.luas}<div class="kb-dossier-row"><span>Luas</span><b>{fmtN(dossierKab.luas)} km²</b></div>{/if}
            {#if dossierKab.densStr}<div class="kb-dossier-row"><span>Kepadatan</span><b>{dossierKab.densStr}/km² <i>№{dossierKab.rankPad}/{dossierKab.nKab}</i></b></div>{/if}
            {#if dossierKab.dagri}<div class="kb-dossier-row"><span>Kode</span><b>{dossierKab.dagri}{#if dossierKab.pos} <i>POS {dossierKab.pos}</i>{/if}</b></div>{/if}
          </div>
          {#if dossierKab.shPop != null}
            <div class="kb-dossier-sh">
              <div class="kb-dossier-shbar"><i style={`width:${Math.min(100, Math.max(1, dossierKab.shPop)).toFixed(1)}%`}></i></div>
              <span>{fmtN(dossierKab.shPop, 1)}% penduduk provinsi · 1 dari {dossierKab.nKab} kab/kota</span>
            </div>
          {/if}
          <button class="kb-dossier-prow" onclick={() => (provTerbuka = !provTerbuka)} aria-expanded={provTerbuka}>
            {provTerbuka ? '▾' : '▸'} PROVINSI · {dossier.nama.toUpperCase()}
          </button>
          {#if provTerbuka}
            <div class="kb-dossier-pbody">{@render provBody(dossier)}</div>
          {/if}
          <div class="kb-dossier-kaki">
            <span class="kb-dossier-src">Kemendagri 2025 · kode BPS SIG</span>
            <button class="kb-dossier-tautan" onclick={() => pulseRef('dossier')}>buka di Lensa Wilayah ↓</button>
          </div>
        {:else}
          <span class="kb-dossier-pulau">{dossier.pulau.toUpperCase()}</span>
          <h3 class="kb-dossier-nama">{dossier.nama}</h3>
          {@render provBody(dossier)}
          <button class="kb-dossier-ask" onclick={() => pulseRef('dossier')}>baca dasar wilayah ↓</button>
        {/if}
      </aside>
    {/if}

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
    <div class="kb-info mono">▦ CITRA SATELIT HARIAN · NASA GIBS ({GIBS_DATE}) + RADAR HUJAN RAINVIEWER BILA TERSEDIA</div>
  {/if}
  {#if infoGempa}
    <div class="kb-info mono"><span class="dot">◉</span> {infoGempa} <span class="src">{gempaLive ? 'BMKG · LANGSUNG' : 'DATA CONTOH'}</span></div>
  {/if}

  <div class="kb-info kb-sumber mono">
    <span class="kb-sumber-lab">SUMBER AKTIF</span>
    {#each sumberAktif as k, i (k.nama)}<a class="kb-sumber-item" href={k.url} target="_blank" rel="noopener noreferrer" title={`${k.nama} · ${k.lisensi}`}>{k.src}<span class="kb-sumber-lic">{k.lisensi}</span></a>{#if i < sumberAktif.length - 1}<span class="kb-sumber-sep">·</span>{/if}{/each}
  </div>

  <p class="kb-tip mono">Klik provinsi untuk dasar wilayah, atau ◎ LAPOR TITIK lalu klik satu tempat untuk cuaca, udara, dan iklim setahun. Atau minta Aksara: <span class="kb-tip-cmd">“tunjukkan gempa di Sulawesi”</span></p>
</div>

<style>
  .kb-wrap { position: relative; }
  /* the front photograph: full-bleed, thin hairline top/bottom, crop marks */
  .kb-plate {
    position: relative;
    width: 100vw; margin-left: calc(50% - 50vw); margin-right: calc(50% - 50vw);
    border-top: 1px solid var(--line); border-bottom: 1px solid var(--line);
  }
  .kb-peta { width: 100%; height: clamp(420px, 64vh, 660px); filter: saturate(0.94); }
  /* print registration / crop marks at the four corners */
  .kb-reg { position: absolute; width: 13px; height: 13px; z-index: 4; pointer-events: none; color: var(--ink); opacity: 0.8; }
  .kb-reg::before, .kb-reg::after { content: ''; position: absolute; background: currentColor; }
  .kb-reg::before { width: 13px; height: 1.5px; top: 0; }
  .kb-reg::after { width: 1.5px; height: 13px; left: 0; }
  .kb-reg.tl { top: 10px; left: 10px; }
  .kb-reg.tr { top: 10px; right: 10px; transform: scaleX(-1); }
  .kb-reg.bl { bottom: 10px; left: 10px; transform: scaleY(-1); }
  .kb-reg.br { bottom: 10px; right: 10px; transform: scale(-1); }
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
  /* a caption, not a toggle: muted + un-filled so it never reads as the active tab */
  .kb-tabs-label { padding: 6px 9px; background: transparent; color: var(--muted); border-right: 1px solid var(--line); display: flex; align-items: center; letter-spacing: 0.16em; font-style: italic; }
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
    /* never taller than the map on a phone: rows scroll inside the panel */
    max-height: min(52dvh, 340px);
    display: flex;
    flex-direction: column;
  }
  .kb-leg-head {
    display: block; width: 100%; text-align: left;
    background: none; border: none; cursor: pointer;
    padding: 6px 10px; font: inherit; letter-spacing: inherit; color: var(--ink);
  }
  .kb-leg-rows {
    border-top: 1px solid var(--line); padding: 6px 10px 8px; display: grid; gap: 6px;
    overflow-y: auto; overscroll-behavior: contain; min-height: 0;
    -webkit-mask-image: linear-gradient(180deg, #000 calc(100% - 14px), transparent);
    mask-image: linear-gradient(180deg, #000 calc(100% - 14px), transparent);
  }
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
  .kb-live { color: var(--accent); }
  .kb-live::before { content: ''; }

  /* arm the location report: a quiet toggle bottom-left, above the coordinate */
  .kb-titik {
    position: absolute; left: 12px; bottom: 42px; z-index: 5;
    font-size: 9.5px; letter-spacing: 0.14em; color: var(--ink); cursor: pointer;
    background: color-mix(in oklab, var(--bg) 85%, transparent);
    border: 1px solid var(--line); padding: 5px 9px;
    transition: border-color 0.2s, background 0.2s;
  }
  .kb-titik:hover { border-color: var(--accent); }
  .kb-titik.aktif { background: var(--accent); color: var(--bg); border-color: var(--accent); }

  /* province dossier: the readout a click surfaces on the map (drill) */
  .kb-dossier {
    position: absolute; left: 12px; top: 12px; z-index: 5; width: min(260px, calc(100% - 24px));
    background: color-mix(in oklab, var(--bg) 94%, transparent);
    border: 1px solid var(--line); border-left: 3px solid var(--accent);
    box-shadow: 0 18px 40px -24px rgba(0, 0, 0, 0.5);
    padding: 12px 14px 14px; display: grid; gap: 4px;
  }
  @media (prefers-reduced-motion: no-preference) { .kb-dossier { animation: kb-doss 0.4s var(--ease-out); } }
  @keyframes kb-doss { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: none; } }
  .kb-dossier-x { position: absolute; top: 6px; right: 8px; background: none; border: none; color: var(--muted); cursor: pointer; font-size: 12px; line-height: 1; }
  .kb-dossier-x:hover { color: var(--accent); }
  .kb-dossier-pulau { font-size: 8.5px; letter-spacing: 0.2em; color: var(--accent); }
  .kb-dossier-nama { font-family: 'Fraunces Variable', serif; font-weight: 400; font-size: clamp(22px, 3vw, 30px); line-height: 0.95; color: var(--ink); margin: 1px 0 2px; }
  .kb-dossier-rank { display: flex; align-items: baseline; gap: 6px; }
  .kb-dossier-rank-n { font-family: 'Fraunces Variable', serif; font-weight: 340; font-size: 28px; line-height: 1; color: var(--accent); }
  .kb-dossier-of { font-size: 9px; letter-spacing: 0.1em; color: var(--muted); }
  .kb-dossier-fakta { font-family: var(--font-fig); font-style: italic; font-size: 12.5px; line-height: 1.4; color: var(--ink); margin: 4px 0; }
  .kb-dossier-tally { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 9px; letter-spacing: 0.08em; color: var(--muted); border-top: 1px solid var(--line-soft); padding-top: 7px; }
  .kb-dossier-tally b { color: var(--ink); font-weight: 600; }
  .kb-dossier-tally b.ember { color: var(--accent); }
  .kb-dossier-ask { margin-top: 8px; background: none; border: 1px solid var(--line); color: var(--ink); font: inherit; font-size: 9px; letter-spacing: 0.12em; padding: 6px 8px; cursor: pointer; text-align: left; transition: background 0.2s, padding-left 0.2s; }
  .kb-dossier-ask:hover { background: color-mix(in oklab, var(--accent) 12%, transparent); padding-left: 12px; }
  /* tier 2 — the regency filing: PROV ▸ crumb, ledger rows, a share-of-province
     bar, the province row collapsed underneath (expands in place) */
  .kb-dossier-jejak { display: flex; align-items: baseline; gap: 5px; font-size: 8.5px; letter-spacing: 0.18em; color: var(--muted); }
  .kb-dossier-jejak button { background: none; border: none; padding: 0; font: inherit; letter-spacing: inherit; color: var(--muted); cursor: pointer; text-decoration: underline dotted; text-underline-offset: 3px; }
  .kb-dossier-jejak button:hover { color: var(--accent); }
  .kb-dossier-jejak span { color: var(--accent); }
  .kb-dossier-jejak b { font-weight: 400; }
  .kb-dossier-baris { display: grid; margin-top: 2px; }
  .kb-dossier-row { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; font-size: 9.5px; letter-spacing: 0.04em; color: var(--muted); padding: 3px 0; border-top: 1px dotted var(--line-soft); }
  .kb-dossier-row:first-child { border-top: none; }
  .kb-dossier-row b { color: var(--ink); font-weight: 600; text-align: right; }
  .kb-dossier-row b i { font-style: normal; font-weight: 400; font-size: 8.5px; color: var(--muted); }
  .kb-dossier-sh { display: grid; gap: 3px; margin-top: 2px; }
  .kb-dossier-shbar { height: 3px; background: var(--line-soft); }
  .kb-dossier-shbar i { display: block; height: 100%; background: var(--accent); }
  .kb-dossier-sh > span { font-size: 8.5px; letter-spacing: 0.08em; color: var(--muted); }
  .kb-dossier-prow { margin-top: 6px; background: none; border: none; border-top: 1px solid var(--line-soft); padding: 7px 0 0; font: inherit; font-size: 8.5px; letter-spacing: 0.16em; color: var(--muted); cursor: pointer; text-align: left; }
  .kb-dossier-prow:hover { color: var(--accent); }
  .kb-dossier-pbody { border-left: 2px solid var(--line-soft); padding-left: 9px; display: grid; gap: 4px; }
  .kb-dossier-kaki { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; margin-top: 4px; }
  .kb-dossier-src { font-size: 8px; letter-spacing: 0.08em; color: var(--muted); opacity: 0.85; }
  .kb-dossier-tautan { background: none; border: none; padding: 0; font: inherit; font-size: 8.5px; letter-spacing: 0.1em; color: var(--muted); cursor: pointer; text-decoration: underline dotted; text-underline-offset: 3px; }
  .kb-dossier-tautan:hover { color: var(--accent); }
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
    position: absolute; right: 12px; bottom: 44px; z-index: 5;
    width: 50px; height: 50px; padding: 5px;
    background: color-mix(in oklab, var(--bg) 88%, transparent);
    border: 1px solid var(--line); color: var(--ink); cursor: pointer;
    transition: border-color 0.25s, box-shadow 0.25s;
  }
  .kb-rose svg { width: 100%; height: 100%; display: block; transition: transform 0.2s linear; }
  .kb-rose:hover { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
  .kb-tip { margin-top: 12px; font-size: 10px; letter-spacing: 0.08em; color: var(--muted); }
  .kb-tip-cmd { color: var(--accent); }
  /* active-source caption, inside the white info box under the map: only the layers
     currently shown, each linked to its provider + licence */
  .kb-sumber {
    font-size: 9px; line-height: 1.7; letter-spacing: 0.06em; color: var(--muted);
    display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 6px;
  }
  .kb-sumber-lab { color: var(--ink); font-style: italic; letter-spacing: 0.16em; opacity: 0.75; margin-right: 2px; }
  .kb-sumber-item { color: var(--muted); text-decoration: none; border-bottom: 1px dotted transparent; transition: color 0.2s, border-color 0.2s; }
  .kb-sumber-item:hover { color: var(--accent); border-bottom-color: var(--accent); }
  .kb-sumber-lic { margin-left: 3px; font-size: 7.5px; letter-spacing: 0.04em; color: var(--ink); opacity: 0.4; vertical-align: super; }
  .kb-sumber-sep { color: var(--line); }
  .chip.aktif { border-color: var(--accent); color: var(--accent); }
  .sym-pesawat { color: #2f6f9f; }
  .sym-kapal { color: #2f8f78; }
  .sym-jalan { color: var(--muted); }
  .sym-tambang { color: #6a7b8a; }
  .sym-konsesi { color: #9c6b4f; }
  .sym-satwa { color: #5f8a3f; }
  .sym-sppg { color: #2f8f4e; }
  /* legend group captions: PETA DASAR (base plate) up top, DATA LANGSUNG below */
  .kb-leg-group { font-size: 8px; letter-spacing: 0.2em; color: var(--muted); opacity: 0.7; font-style: italic; }
  .kb-leg-group-2 { border-top: 1px solid var(--line-soft); padding-top: 8px; margin-top: 3px; }

  /* the single hazard info card, anchored above the clicked marker */
  .kb-fitur {
    position: absolute; z-index: 6; width: max-content; max-width: 232px;
    transform: translate(-50%, calc(-100% - 14px));
    background: color-mix(in oklab, var(--bg) 95%, transparent);
    border: 1px solid var(--line); border-bottom: 3px solid var(--accent);
    box-shadow: 0 18px 40px -24px rgba(0, 0, 0, 0.55);
    padding: 9px 11px 8px; display: grid; gap: 5px; pointer-events: auto;
  }
  .kb-fitur::after { content: ''; position: absolute; left: 50%; top: 100%; transform: translateX(-50%); border: 6px solid transparent; border-top-color: var(--accent); }
  .kb-fitur-x { position: absolute; top: 4px; right: 6px; background: none; border: none; color: var(--muted); cursor: pointer; font-size: 11px; line-height: 1; }
  .kb-fitur-x:hover { color: var(--accent); }
  .kb-fitur-judul { font-size: 11px; letter-spacing: 0.08em; color: var(--ink); font-weight: 600; padding-right: 14px; }
  .kb-fitur-baris { display: grid; gap: 2px; }
  .kb-fitur-row { display: flex; justify-content: space-between; gap: 14px; font-size: 9.5px; letter-spacing: 0.04em; }
  .kb-fitur-row span { color: var(--muted); }
  .kb-fitur-row b { color: var(--ink); font-weight: 600; text-align: right; }
  .kb-fitur-note { font-size: 9px; line-height: 1.35; color: var(--accent); letter-spacing: 0.02em; }
  .kb-fitur-src { font-size: 8px; letter-spacing: 0.14em; color: var(--muted); text-transform: uppercase; }

  :global(.kabar-seal) {
    width: 20px; height: 20px; border: 2px solid #e44a06; border-radius: 50%;
    box-shadow: inset 0 0 0 3px rgba(214, 203, 172, 0.9), inset 0 0 0 5px #e44a06;
  }
  :global(.maplibregl-ctrl-attrib) { font-family: var(--font-mono); font-size: 9px; background: transparent !important; }
</style>
