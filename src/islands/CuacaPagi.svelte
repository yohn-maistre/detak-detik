<script lang="ts">
  /** Cuaca Pagi: the morning weather strip every bulletin opens with — a few
      major cities, current temperature and sky. Live best-effort from
      Open-Meteo (keyless, CORS-open); a labelled sample stands when dark. */
  import { onMount } from 'svelte';

  type Kota = { nama: string; lat: number; lon: number; t: number; code: number };
  let kota = $state<Kota[]>([
    { nama: 'Jakarta', lat: -6.21, lon: 106.85, t: 31, code: 2 },
    { nama: 'Bandung', lat: -6.92, lon: 107.61, t: 26, code: 61 },
    { nama: 'Surabaya', lat: -7.26, lon: 112.75, t: 33, code: 1 },
    { nama: 'Medan', lat: 3.59, lon: 98.67, t: 30, code: 80 },
    { nama: 'Makassar', lat: -5.14, lon: 119.42, t: 32, code: 3 },
    { nama: 'Jayapura', lat: -2.53, lon: 140.72, t: 29, code: 95 },
  ]);
  let live = $state(false);

  // WMO weather codes -> a glyph + an Indonesian label
  function sky(code: number): { g: string; l: string; keras: boolean } {
    if (code === 0) return { g: '○', l: 'cerah', keras: false };
    if (code <= 2) return { g: '◔', l: 'cerah berawan', keras: false };
    if (code === 3) return { g: '●', l: 'berawan', keras: false };
    if (code <= 48) return { g: '≈', l: 'berkabut', keras: false };
    if (code <= 67) return { g: '▒', l: 'hujan', keras: true };
    if (code <= 82) return { g: '▒', l: 'hujan lokal', keras: true };
    if (code >= 95) return { g: '⚡', l: 'badai petir', keras: true };
    return { g: '●', l: 'berawan', keras: false };
  }

  onMount(() => {
    (async () => {
      try {
        const lats = kota.map((k) => k.lat).join(',');
        const lons = kota.map((k) => k.lon).join(',');
        const u = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,weather_code&timezone=Asia%2FJakarta`;
        const res = await fetch(u, { signal: AbortSignal.timeout(6000) });
        const data = await res.json();
        const arr = Array.isArray(data) ? data : [data];
        if (arr.length === kota.length && arr[0]?.current) {
          kota = kota.map((k, i) => ({
            ...k,
            t: Math.round(arr[i].current.temperature_2m ?? k.t),
            code: arr[i].current.weather_code ?? k.code,
          }));
          live = true;
        }
      } catch { /* sample stands, chip says so */ }
    })();
  });
</script>

<section class="cp" data-no-stempel aria-label="Cuaca pagi kota besar">
  <div class="cp-head">
    <span class="cp-label mono">CUACA PAGI</span>
    <span class="cp-src mono">{live ? '● open-meteo · langsung' : '○ data contoh'}</span>
  </div>
  <div class="cp-row">
    {#each kota as k (k.nama)}
      {@const s = sky(k.code)}
      <div class="cp-kota">
        <span class="cp-nama mono">{k.nama}</span>
        <span class="cp-t num">{k.t}°</span>
        <span class="cp-sky" class:keras={s.keras}><span class="cp-g">{s.g}</span> {s.l}</span>
      </div>
    {/each}
  </div>
</section>

<style>
  .cp { border-top: 1px solid var(--line); padding-top: 14px; }
  .cp-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-bottom: 12px; }
  .cp-label { font-size: 10px; letter-spacing: 0.2em; color: var(--ink); }
  .cp-src { font-size: 8.5px; letter-spacing: 0.1em; color: var(--muted); }
  .cp-row { display: grid; grid-template-columns: repeat(6, 1fr); gap: clamp(10px, 2vw, 24px); }
  @media (max-width: 760px) { .cp-row { grid-template-columns: repeat(3, 1fr); row-gap: 16px; } }
  @media (max-width: 420px) { .cp-row { grid-template-columns: repeat(2, 1fr); } }
  .cp-kota { display: grid; gap: 2px; }
  .cp-nama { font-size: 9px; letter-spacing: 0.12em; color: var(--muted); }
  .cp-t { font-family: 'Fraunces Variable', serif; font-weight: 360; font-size: clamp(26px, 3.4vw, 38px); line-height: 1; color: var(--ink); }
  .cp-sky { font-size: 10px; letter-spacing: 0.04em; color: var(--muted); }
  .cp-sky.keras { color: var(--accent); }
  .cp-g { font-family: var(--font-mono); }
</style>
