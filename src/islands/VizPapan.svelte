<script lang="ts">
  /**
   * VizPapan: the agent-drivable canvas. Takes ONE raw spec (from the edition
   * payload or a component), validates it against the viz kit contract
   * (lib/viz/spec.ts), and draws it in the site's tile grammar — SkorCabang's
   * vocabulary, so machine-requested figures are indistinguishable in chrome
   * from hand-built ones. A spec that fails parse renders nothing at all.
   */
  import { parseVizSpec } from '../lib/viz/spec';

  let { spec }: { spec: unknown } = $props();
  const v = $derived(parseVizSpec(spec));

  const posLin = (x: number, maks: number) => Math.min(100, Math.max(0, (x / maks) * 100));
  function garisPath(seri: number[], w: number, h: number): string {
    const lo = Math.min(...seri), hi = Math.max(...seri);
    const y = (n: number) => h - 3 - ((n - lo) / (hi - lo || 1)) * (h - 6);
    return seri.map((n, i) => `${i ? 'L' : 'M'} ${((i / (seri.length - 1)) * w).toFixed(1)} ${y(n).toFixed(1)}`).join(' ');
  }
</script>

{#if v}
  <figure class="vp" data-no-stempel>
    <figcaption class="vp-judul mono">{v.judul.toUpperCase()}</figcaption>

    {#if v.bentuk === 'stat'}
      <p class="vp-n num" class:buruk={v.nada === 'buruk'} class:baik={v.nada === 'baik'}>{v.nilai}</p>
      <p class="vp-label">{v.label}</p>
    {:else if v.bentuk === 'bars'}
      {@const maks = v.maks ?? Math.max(...v.baris.map((b) => b.v))}
      <div class="vp-bars">
        {#each v.baris as b (b.k)}
          <div class="vp-bar">
            <span class="vp-bar-k mono">{b.k}</span>
            <div class="vp-bar-track"><i style={`width:${posLin(b.v, maks).toFixed(1)}%`}></i></div>
            <b class="vp-bar-v num">{b.label ?? b.v}</b>
          </div>
        {/each}
      </div>
      <div class="vp-ruler mono" aria-hidden="true"><span>0</span><span>{maks}</span></div>
    {:else if v.bentuk === 'dumbbell'}
      <div class="vp-dumb" aria-hidden="true">
        <span class="vp-dot a" style={`left:${v.a.v}%`}></span>
        <span class="vp-bar-line" style={`left:${Math.min(v.a.v, v.b.v)}%;width:${Math.abs(v.b.v - v.a.v)}%`}></span>
        <span class="vp-dot b" style={`left:${v.b.v}%`}></span>
      </div>
      <div class="vp-ruler mono" aria-hidden="true"><span>0{v.satuan}</span><span>100{v.satuan}</span></div>
      <p class="vp-key mono"><span class="ka">{v.a.k} {v.a.v}{v.satuan}</span> · <span class="kb">{v.b.k} {v.b.v}{v.satuan}</span></p>
    {:else if v.bentuk === 'waffle'}
      <p class="vp-n num">{v.isi}<span class="vp-of">/{v.dari}</span></p>
      <div class="vp-waffle" aria-hidden="true">
        {#each Array(v.dari) as _, k (k)}<i class:isi={k < v.isi}></i>{/each}
      </div>
      <p class="vp-label">{v.label}</p>
    {:else if v.bentuk === 'garis'}
      <svg class="vp-garis" viewBox="0 0 160 44" preserveAspectRatio="none" role="img" aria-label={v.judul}>
        <path d={garisPath(v.seri, 160, 44)} />
      </svg>
      <div class="vp-ruler mono" aria-hidden="true"><span>{v.label0}</span><span>{v.label1}</span></div>
    {/if}

    {#if v.catatan}<p class="vp-catatan">{v.catatan}</p>{/if}
    <span class="vp-src mono">⊙ {v.sumber}</span>
  </figure>
{/if}

<style>
  .vp { margin: 0; display: flex; flex-direction: column; gap: 8px; border-top: 1px solid var(--line-soft); padding-top: 12px; }
  .vp-judul { font-size: 9px; letter-spacing: 0.16em; color: var(--muted); }
  .vp-n { font-family: 'Fraunces Variable', serif; font-weight: 340; font-size: clamp(30px, 4vw, 48px); line-height: 0.9; color: var(--ink); }
  .vp-n.buruk { color: var(--accent); }
  .vp-n.baik { color: var(--accent2); }
  .vp-of { font-size: 0.42em; color: var(--muted); }
  .vp-label { font-size: 13px; color: var(--ink); line-height: 1.4; max-width: 34ch; }
  .vp-catatan { font-size: 11.5px; color: var(--muted); line-height: 1.45; max-width: 40ch; }
  .vp-src { font-size: 8.5px; letter-spacing: 0.08em; color: var(--muted); margin-top: auto; padding-top: 6px; }
  .vp-ruler { display: flex; justify-content: space-between; border-top: 1px solid var(--line-soft); padding-top: 2px; font-size: 7.5px; letter-spacing: 0.08em; color: var(--muted); opacity: 0.85; }

  .vp-bars { display: grid; gap: 8px; }
  .vp-bar { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 8px; }
  .vp-bar-k { grid-column: 1 / -1; font-size: 8.5px; letter-spacing: 0.08em; color: var(--muted); }
  .vp-bar-track { height: 10px; background: color-mix(in oklab, var(--line) 45%, transparent); position: relative; }
  .vp-bar-track i { position: absolute; inset: 0 auto 0 0; background: var(--accent); opacity: 0.85; }
  .vp-bar-v { font-family: var(--font-mono); font-size: 10px; color: var(--ink); }

  .vp-dumb { position: relative; height: 14px; margin-top: 6px; }
  .vp-dumb::before { content: ''; position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: var(--line-soft); }
  .vp-bar-line { position: absolute; top: 50%; height: 2px; transform: translateY(-50%); background: var(--muted); }
  .vp-dot { position: absolute; top: 50%; width: 11px; height: 11px; border-radius: 50%; transform: translate(-50%, -50%); }
  .vp-dot.a { background: var(--accent2); }
  .vp-dot.b { background: var(--accent); }
  .vp-key { font-size: 9px; letter-spacing: 0.04em; color: var(--muted); }
  .vp-key .ka { color: var(--accent2); }
  .vp-key .kb { color: var(--accent); }

  .vp-waffle { display: grid; grid-template-columns: repeat(10, 1fr); gap: 3px; max-width: 180px; }
  .vp-waffle i { aspect-ratio: 1; background: var(--line-soft); border-radius: 1px; }
  .vp-waffle i.isi { background: var(--accent); }

  .vp-garis { width: 100%; height: 44px; display: block; }
  .vp-garis path { fill: none; stroke: var(--accent2); stroke-width: 1.8; }
</style>
