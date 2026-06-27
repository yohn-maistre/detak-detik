<script lang="ts">
  /**
   * Laporan Lokasi: click any point on the map and the republic answers for
   * that spot. The settlement vision — a calm, cited readout of the place:
   * the weather now, the air now, a year's worth of warmth as a month×hour
   * thermal matrix (the PetaPiksel grammar applied to one coordinate), a wind
   * rose, and whatever hazards sit nearby. Everything keyless and browser-direct
   * (Open-Meteo, CC-BY); any dark feed degrades to a labelled contoh, never a
   * broken panel. Aksara narrates the place once the figures land.
   */
  import { dispatch } from '../lib/commands/dispatcher';

  let { lon, lat, provinsi, bahaya, tutup }: {
    lon: number;
    lat: number;
    provinsi: string;
    bahaya: string;
    tutup: () => void;
  } = $props();

  /* ── WMO weather codes → formal Indonesian ── */
  const WMO: Record<number, string> = {
    0: 'cerah', 1: 'cerah berawan', 2: 'berawan sebagian', 3: 'berawan',
    45: 'berkabut', 48: 'kabut beku', 51: 'gerimis ringan', 53: 'gerimis', 55: 'gerimis lebat',
    61: 'hujan ringan', 63: 'hujan', 65: 'hujan lebat', 66: 'hujan beku', 67: 'hujan beku lebat',
    71: 'salju ringan', 73: 'salju', 75: 'salju lebat', 80: 'hujan lokal', 81: 'hujan lokal sedang',
    82: 'hujan lokal deras', 95: 'badai petir', 96: 'badai petir + es', 99: 'badai petir + es besar',
  };
  const wmoTeks = (c: number | undefined) => (c == null ? '—' : (WMO[c] ?? 'tidak diketahui'));
  const ARAH = ['U', 'TL', 'T', 'TG', 'S', 'BD', 'B', 'BL'];
  const arahMata = (deg: number) => ARAH[Math.round((((deg % 360) + 360) % 360) / 45) % 8];

  /* AQI banding (European AQI scale): label + paper-palette colour */
  function aqiBand(v: number): { teks: string; warna: string } {
    if (v <= 20) return { teks: 'baik', warna: '#3f8f6f' };
    if (v <= 40) return { teks: 'sedang', warna: '#9a8f3a' };
    if (v <= 60) return { teks: 'tidak sehat (sensitif)', warna: '#e08a1e' };
    if (v <= 80) return { teks: 'tidak sehat', warna: '#e44a06' };
    if (v <= 100) return { teks: 'sangat tidak sehat', warna: '#b0331e' };
    return { teks: 'berbahaya', warna: '#7a1410' };
  }

  type Sekarang = {
    suhu: number; lembap: number; kode: number; angin: number; arah: number; hujan: number;
  } | null;
  type Udara = { pm25: number; aqi: number } | null;
  type Banjir = { debit: number; rerata: number; tren: number[] } | null;
  type Laut = { tinggi: number; periode: number; arah: number } | null;

  let memuat = $state(true);
  let langsung = $state(false);
  let sekarang = $state<Sekarang>(null);
  let udara = $state<Udara>(null);
  let banjir = $state<Banjir>(null);
  let laut = $state<Laut>(null);
  /** 8 wind-rose sectors, summed hourly speed per compass octant */
  let mawar = $state<number[]>([]);
  /** month (0..11) × hour (0..23) mean temperature, the thermal matrix */
  let matriks = $state<number[][] | null>(null);
  let matMin = $state(20);
  let matMax = $state(34);

  let roseEl = $state<HTMLCanvasElement>();
  let matEl = $state<HTMLCanvasElement>();

  const fmt1 = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(n);
  const BULAN = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

  /* a labelled contoh so the panel always demonstrates its shape when the
     sandbox (or a dark feed) blocks the live call — tropical, ~26-32°C */
  function matriksContoh(): number[][] {
    const m: number[][] = [];
    for (let mo = 0; mo < 12; mo++) {
      const row: number[] = [];
      for (let h = 0; h < 24; h++) {
        const harian = 26 + 5 * Math.sin(((h - 15) / 24) * Math.PI * 2); // peak ~15.00
        const musim = 1.2 * Math.sin(((mo - 9) / 12) * Math.PI * 2);
        row.push(harian + musim);
      }
      m.push(row);
    }
    return m;
  }

  function mawarContoh(): number[] {
    return [3, 5, 8, 11, 7, 4, 3, 2]; // a prevailing easterly, like the monsoon
  }

  /* cool→warm ramp for the thermal matrix (paper palette, not a rainbow) */
  const TRAMP = [[64, 104, 138], [120, 150, 150], [210, 190, 120], [224, 138, 30], [180, 60, 20]];
  function tWarna(t: number): string {
    const p = Math.max(0, Math.min(1, t)) * (TRAMP.length - 1);
    const i = Math.min(TRAMP.length - 2, Math.floor(p));
    const f = p - i, a = TRAMP[i]!, b = TRAMP[i + 1]!;
    return `rgb(${Math.round(a[0]! + (b[0]! - a[0]!) * f)},${Math.round(a[1]! + (b[1]! - a[1]!) * f)},${Math.round(a[2]! + (b[2]! - a[2]!) * f)})`;
  }

  function drawMatriks() {
    if (!matEl || !matriks) return;
    const cols = 24, rows = 12;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = matEl.clientWidth || 280;
    const cell = cw / cols;
    const ch = cell * rows;
    matEl.width = Math.round(cw * dpr); matEl.height = Math.round(ch * dpr);
    matEl.style.height = `${ch}px`;
    const x = matEl.getContext('2d')!;
    x.scale(dpr, dpr);
    const span = matMax - matMin || 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        x.fillStyle = tWarna((matriks[r]![c]! - matMin) / span);
        x.fillRect(c * cell, r * cell, Math.ceil(cell) + 0.5, Math.ceil(cell) + 0.5);
      }
    }
  }

  function drawMawar() {
    if (!roseEl) return;
    const data = mawar.length ? mawar : mawarContoh();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const s = roseEl.clientWidth || 96;
    roseEl.width = Math.round(s * dpr); roseEl.height = Math.round(s * dpr);
    roseEl.style.height = `${s}px`;
    const x = roseEl.getContext('2d')!;
    x.scale(dpr, dpr);
    const m = s / 2, R = s * 0.42;
    const maxv = Math.max(...data, 1);
    // rings
    x.strokeStyle = 'rgba(21,19,14,0.18)'; x.lineWidth = 0.7;
    for (const f of [0.5, 1]) { x.beginPath(); x.arc(m, m, R * f, 0, Math.PI * 2); x.stroke(); }
    // petals: octant i centred on its compass bearing (0 = North, up)
    for (let i = 0; i < 8; i++) {
      const len = (data[i]! / maxv) * R;
      const a0 = (i / 8) * Math.PI * 2 - Math.PI / 2 - Math.PI / 8;
      const a1 = (i / 8) * Math.PI * 2 - Math.PI / 2 + Math.PI / 8;
      x.beginPath(); x.moveTo(m, m);
      x.arc(m, m, len, a0, a1); x.closePath();
      x.fillStyle = 'rgba(47,111,159,0.55)'; x.fill();
      x.strokeStyle = 'rgba(47,111,159,0.9)'; x.lineWidth = 0.6; x.stroke();
    }
    x.fillStyle = 'rgba(21,19,14,0.7)'; x.font = '700 8px monospace';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('U', m, m - R - 5);
  }

  async function muat() {
    memuat = true; langsung = false;
    sekarang = null; udara = null; banjir = null; laut = null; matriks = null; mawar = [];
    const q = `latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}`;

    // current weather + a week of hourly wind for the rose
    try {
      const r = await fetch(
        `https://api.open-meteo.com/v1/forecast?${q}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,precipitation&hourly=wind_direction_10m,wind_speed_10m&forecast_days=7&timezone=auto`,
        { signal: AbortSignal.timeout(7000) },
      );
      const d = (await r.json()) as {
        current?: Record<string, number>;
        hourly?: { wind_direction_10m?: number[]; wind_speed_10m?: number[] };
      };
      if (d.current) {
        sekarang = {
          suhu: d.current.temperature_2m!, lembap: d.current.relative_humidity_2m!,
          kode: d.current.weather_code!, angin: d.current.wind_speed_10m!,
          arah: d.current.wind_direction_10m!, hujan: d.current.precipitation ?? 0,
        };
        langsung = true;
      }
      const dirs = d.hourly?.wind_direction_10m ?? [], spds = d.hourly?.wind_speed_10m ?? [];
      if (dirs.length) {
        const bins = new Array(8).fill(0);
        for (let i = 0; i < dirs.length; i++) {
          const oct = Math.round((((dirs[i]! % 360) + 360) % 360) / 45) % 8;
          bins[oct] += spds[i] ?? 1;
        }
        mawar = bins;
      }
    } catch { /* contoh stays */ }

    // air quality now
    try {
      const r = await fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?${q}&current=pm2_5,european_aqi&timezone=auto`,
        { signal: AbortSignal.timeout(7000) },
      );
      const d = (await r.json()) as { current?: { pm2_5?: number; european_aqi?: number } };
      if (d.current && d.current.european_aqi != null) {
        udara = { pm25: d.current.pm2_5 ?? NaN, aqi: d.current.european_aqi };
        langsung = true;
      }
    } catch { /* contoh stays */ }

    // river discharge (Open-Meteo Flood / GloFAS) — a "rivers in flood" signal,
    // only meaningful where the cell sits on a modelled river (null/0 inland)
    try {
      const r = await fetch(
        `https://flood-api.open-meteo.com/v1/flood?${q}&daily=river_discharge,river_discharge_mean&forecast_days=3`,
        { signal: AbortSignal.timeout(7000) },
      );
      const d = (await r.json()) as { daily?: { river_discharge?: (number | null)[]; river_discharge_mean?: (number | null)[] } };
      const rd = (d.daily?.river_discharge ?? []).filter((x): x is number => x != null);
      if (rd.length && rd[0]! > 0) {
        banjir = { debit: rd[0]!, rerata: d.daily?.river_discharge_mean?.[0] ?? rd[0]!, tren: rd };
        langsung = true;
      }
    } catch { /* contoh stays */ }

    // wave / sea state (Open-Meteo Marine) — meaningful on or near the coast
    try {
      const r = await fetch(
        `https://marine-api.open-meteo.com/v1/marine?${q}&current=wave_height,wave_period,wave_direction&timezone=auto`,
        { signal: AbortSignal.timeout(7000) },
      );
      const d = (await r.json()) as { current?: { wave_height?: number; wave_period?: number; wave_direction?: number } };
      if (d.current && d.current.wave_height != null) {
        laut = { tinggi: d.current.wave_height, periode: d.current.wave_period ?? NaN, arah: d.current.wave_direction ?? NaN };
        langsung = true;
      }
    } catch { /* contoh stays */ }

    // the thermal matrix: a year of hourly temperature, folded to month×hour means
    try {
      const end = new Date(Date.now() - 6 * 86_400_000); // archive lags ~5 days
      const start = new Date(end.getTime() - 364 * 86_400_000);
      const iso = (d: Date) => d.toISOString().slice(0, 10);
      const r = await fetch(
        `https://archive-api.open-meteo.com/v1/archive?${q}&start_date=${iso(start)}&end_date=${iso(end)}&hourly=temperature_2m&timezone=auto`,
        { signal: AbortSignal.timeout(10000) },
      );
      const d = (await r.json()) as { hourly?: { time?: string[]; temperature_2m?: (number | null)[] } };
      const times = d.hourly?.time ?? [], temps = d.hourly?.temperature_2m ?? [];
      if (times.length) {
        const sum = Array.from({ length: 12 }, () => new Array(24).fill(0));
        const cnt = Array.from({ length: 12 }, () => new Array(24).fill(0));
        for (let i = 0; i < times.length; i++) {
          const v = temps[i]; if (v == null) continue;
          const mo = Number(times[i]!.slice(5, 7)) - 1, h = Number(times[i]!.slice(11, 13));
          sum[mo]![h] += v; cnt[mo]![h] += 1;
        }
        const grid = sum.map((row, mo) => row.map((s, h) => (cnt[mo]![h] ? s / cnt[mo]![h] : NaN)));
        const flat = grid.flat().filter((v) => Number.isFinite(v)) as number[];
        if (flat.length) {
          matMin = Math.min(...flat); matMax = Math.max(...flat);
          matriks = grid.map((row) => row.map((v) => (Number.isFinite(v) ? v : matMin)));
          langsung = true;
        }
      }
    } catch { /* contoh stays */ }

    if (!matriks) { matriks = matriksContoh(); const f = matriks.flat(); matMin = Math.min(...f); matMax = Math.max(...f); }
    memuat = false;
    narasi();
  }

  function narasi() {
    const parts: string[] = [`Laporan untuk ${provinsi}, ${koord}.`];
    if (sekarang) parts.push(`Saat ini ${fmt1(sekarang.suhu)}°C, ${wmoTeks(sekarang.kode)}, angin dari ${arahMata(sekarang.arah)}.`);
    if (udara) parts.push(`Indeks udara ${Math.round(udara.aqi)} (${aqiBand(udara.aqi).teks}).`);
    if (banjir) parts.push(`Debit sungai ${fmt1(banjir.debit)} m³/s.`);
    if (laut) parts.push(`Gelombang laut ${fmt1(laut.tinggi)} m.`);
    if (bahaya) parts.push(bahaya);
    dispatch({ cmd: 'say', params: { teks: parts.join(' ').slice(0, 270), cited_ids: [], tahan_ms: 8000 } });
  }

  const koord = $derived(`${Math.abs(lat).toFixed(2)}°${lat < 0 ? 'LS' : 'LU'} · ${Math.abs(lon).toFixed(2)}°${lon < 0 ? 'BB' : 'BT'}`);

  // refetch whenever the clicked coordinate changes
  let kunci = $state('');
  $effect(() => {
    const k = `${lat.toFixed(3)},${lon.toFixed(3)}`;
    if (k !== kunci) { kunci = k; void muat(); }
  });

  // draw once the canvases exist and the figures land (and on every refetch);
  // the reads of matriks / mawar make these effects re-run when data changes
  $effect(() => { if (matEl && matriks) drawMatriks(); });
  $effect(() => { if (roseEl && (mawar.length || !memuat)) drawMawar(); });
  // responsive redraw
  $effect(() => {
    const el = matEl, rel = roseEl; if (!el) return;
    const ro = new ResizeObserver(() => { drawMatriks(); if (rel) drawMawar(); });
    ro.observe(el);
    return () => ro.disconnect();
  });
</script>

<aside class="ll mono" aria-label="Laporan lokasi">
  <button class="ll-x" onclick={tutup} aria-label="Tutup laporan lokasi">✕</button>
  <header class="ll-head">
    <span class="ll-kicker">LAPORAN TITIK</span>
    <h3 class="ll-prov">{provinsi}</h3>
    <span class="ll-koord">{koord}</span>
  </header>

  {#if memuat}
    <p class="ll-muat">menarik data Open-Meteo…</p>
  {:else}
    <div class="ll-now">
      <div class="ll-suhu">
        <span class="ll-suhu-n num">{sekarang ? fmt1(sekarang.suhu) : '—'}</span><span class="ll-deg">°C</span>
        <span class="ll-langit">{wmoTeks(sekarang?.kode)}</span>
      </div>
      <div class="ll-rose">
        <canvas bind:this={roseEl} aria-hidden="true"></canvas>
        {#if sekarang}<span class="ll-angin">{fmt1(sekarang.angin)} km/j · {arahMata(sekarang.arah)}</span>{/if}
      </div>
    </div>

    <div class="ll-stats">
      <span><b>{sekarang ? Math.round(sekarang.lembap) : '—'}%</b> lembap</span>
      <span><b>{sekarang ? fmt1(sekarang.hujan) : '—'}</b> mm hujan</span>
      {#if udara}
        <span class="ll-aqi"><b style={`color:${aqiBand(udara.aqi).warna}`}>{Math.round(udara.aqi)}</b> udara · {aqiBand(udara.aqi).teks}</span>
      {/if}
      {#if banjir}
        <span class="ll-sungai"><b>{fmt1(banjir.debit)}</b> m³/s debit sungai</span>
      {/if}
      {#if laut}
        <span class="ll-laut"><b>{fmt1(laut.tinggi)}</b> m gelombang{#if Number.isFinite(laut.periode)} · {fmt1(laut.periode)}s{/if}{#if Number.isFinite(laut.arah)} · {arahMata(laut.arah)}{/if}</span>
      {/if}
    </div>

    <div class="ll-mat">
      <div class="ll-mat-head"><span>SUHU · BULAN × JAM (setahun)</span><span class="ll-mat-skala">{fmt1(matMin)}–{fmt1(matMax)}°C</span></div>
      <div class="ll-mat-grid">
        <div class="ll-mat-y" aria-hidden="true">{#each BULAN as b}<span>{b}</span>{/each}</div>
        <canvas class="ll-mat-cv" bind:this={matEl} aria-hidden="true"></canvas>
      </div>
      <div class="ll-mat-x" aria-hidden="true"><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></div>
    </div>

    {#if bahaya}<p class="ll-bahaya">⚠ {bahaya}</p>{/if}

    <footer class="ll-foot">
      <span class="ll-tag" class:live={langsung}>{langsung ? 'OPEN-METEO · LANGSUNG' : 'DATA CONTOH'}</span>
      <span class="ll-src">cuaca, udara, sungai &amp; laut: Open-Meteo (CC-BY)</span>
    </footer>
  {/if}
</aside>

<style>
  .ll {
    position: absolute; left: 12px; top: 12px; z-index: 6;
    width: min(316px, calc(100% - 24px));
    background: color-mix(in oklab, var(--bg) 95%, transparent);
    border: 1px solid var(--line); border-top: 3px solid var(--accent);
    box-shadow: 0 22px 48px -26px rgba(0, 0, 0, 0.55);
    padding: 12px 14px 12px; display: grid; gap: 9px;
    font-size: 10px; letter-spacing: 0.04em;
  }
  @media (prefers-reduced-motion: no-preference) { .ll { animation: ll-in 0.4s var(--ease-out); } }
  @keyframes ll-in { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
  .ll-x { position: absolute; top: 6px; right: 8px; background: none; border: none; color: var(--muted); cursor: pointer; font-size: 12px; line-height: 1; }
  .ll-x:hover { color: var(--accent); }

  .ll-head { display: grid; gap: 1px; }
  .ll-kicker { font-size: 8px; letter-spacing: 0.22em; color: var(--accent); }
  .ll-prov { font-family: 'Fraunces Variable', serif; font-weight: 400; font-size: clamp(19px, 2.6vw, 25px); line-height: 0.98; color: var(--ink); margin: 1px 0 0; }
  .ll-koord { font-size: 9px; letter-spacing: 0.1em; color: var(--muted); }

  .ll-muat { color: var(--muted); font-style: italic; padding: 8px 0; }

  .ll-now { display: flex; align-items: center; justify-content: space-between; gap: 10px; border-top: 1px solid var(--line-soft); padding-top: 9px; }
  .ll-suhu { display: flex; align-items: baseline; flex-wrap: wrap; gap: 0 4px; }
  .ll-suhu-n { font-family: 'Fraunces Variable', serif; font-weight: 340; font-size: 40px; line-height: 0.9; color: var(--ink); }
  .ll-deg { font-size: 14px; color: var(--muted); }
  .ll-langit { flex-basis: 100%; font-size: 10px; letter-spacing: 0.08em; color: var(--ink); text-transform: capitalize; }
  .ll-rose { display: grid; gap: 2px; justify-items: center; }
  .ll-rose canvas { width: 78px; }
  .ll-angin { font-size: 8px; letter-spacing: 0.06em; color: var(--muted); }

  .ll-stats { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 9px; letter-spacing: 0.05em; color: var(--muted); border-top: 1px solid var(--line-soft); padding-top: 8px; }
  .ll-stats b { color: var(--ink); font-weight: 600; font-size: 11px; }
  .ll-aqi, .ll-sungai, .ll-laut { flex-basis: 100%; }

  .ll-mat { display: grid; gap: 4px; }
  .ll-mat-head { display: flex; justify-content: space-between; align-items: baseline; font-size: 8px; letter-spacing: 0.12em; color: var(--ink); }
  .ll-mat-skala { color: var(--muted); letter-spacing: 0.04em; }
  .ll-mat-grid { display: flex; gap: 4px; align-items: stretch; }
  .ll-mat-y { display: flex; flex-direction: column; justify-content: space-between; font-size: 7px; color: var(--muted); line-height: 1; padding: 1px 0; }
  .ll-mat-cv { flex: 1; width: 100%; display: block; image-rendering: pixelated; border: 1px solid var(--line-soft); }
  .ll-mat-x { display: flex; justify-content: space-between; font-size: 7px; color: var(--muted); padding-left: 12px; }

  .ll-bahaya { font-size: 9px; line-height: 1.4; color: var(--accent); border-top: 1px solid var(--line-soft); padding-top: 7px; letter-spacing: 0.03em; }

  .ll-foot { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 3px; border-top: 1px solid var(--line-soft); padding-top: 7px; font-size: 7.5px; letter-spacing: 0.1em; }
  .ll-tag { color: var(--muted); }
  .ll-tag.live { color: var(--accent); }
  .ll-src { color: var(--muted); letter-spacing: 0.04em; }
</style>
