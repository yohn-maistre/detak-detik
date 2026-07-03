<script lang="ts">
  /**
   * CabangBand: one branch's signature figure, the opener of its chapter. The
   * micro-viz draws itself on view. Documents speak; the reader draws the
   * conclusion. Carries a data-ref so Aksara can point at it.
   */
  import { onMount } from 'svelte';
  import { reducedMotion } from '../lib/motion';
  import { getCabang } from '../lib/data/cabang';

  let { cabang }: { cabang: string } = $props();
  const c = getCabang(cabang);

  /* log position on the gantt ruler: 0..1 between the first and last tick */
  const posLog = (v: number, ticks: { v: number }[]) => {
    const a = Math.log10(ticks[0]!.v), b = Math.log10(ticks[ticks.length - 1]!.v);
    return Math.min(1, Math.max(0, (Math.log10(v) - a) / (b - a)));
  };
  /* linear position of the national needle inside the range span */
  const posJarum = (j: { min: number; max: number; nilai: number }) =>
    Math.min(1, Math.max(0, (j.nilai - j.min) / (j.max - j.min)));

  let root: HTMLElement;
  onMount(() => {
    if (reducedMotion()) {
      root.classList.add('in');
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          root.classList.add('in');
          io.unobserve(root);
        }
      },
      { threshold: 0.3 }
    );
    io.observe(root);
    return () => io.disconnect();
  });
</script>

<article class="cb" bind:this={root} data-no-stempel data-ref={`cabang-${c.slug}`}>
  <div class="cb-left">
    <span class="cb-no mono">CABANG {c.no}</span>
    <p class="cb-apa">{c.apa}</p>
  </div>
  <div class="cb-right">
    {#if c.big}
      <p class="cb-big display num" class:accent={c.bigAccent}>{c.big}</p>
    {/if}
    {#if c.cap}<p class="cb-cap">{c.cap}</p>{/if}

    {#if c.viz.type === 'dots'}
      <div class="cb-dots" aria-hidden="true">{#each Array(c.viz.n) as _, i}<i style={`--d:${i}`}></i>{/each}</div>
    {:else if c.viz.type === 'gantt'}
      <div class="cb-gantt">
        {#each c.viz.rows as r (r.k)}
          <div class="cb-grow">
            <span class="cb-grow-k mono">{r.k}</span>
            <div class="cb-grow-track"><i class:macet={r.macet} style={`--w:${(posLog(r.hari, c.viz.skala.ticks) * 100).toFixed(1)}%`}></i></div>
            <b class="num">{r.label}</b>
          </div>
        {/each}
        <!-- the shared ruler beneath both tracks: ticks labeled, scale declared -->
        <div class="cb-ruler" aria-hidden="true">
          {#each c.viz.skala.ticks as t (t.v)}
            <span class="cb-ruler-tick" style={`left:${(posLog(t.v, c.viz.skala.ticks) * 100).toFixed(1)}%`}><i></i><em class="mono">{t.label}</em></span>
          {/each}
        </div>
        <span class="cb-skala mono">{c.viz.skala.catatan}</span>
      </div>
    {:else if c.viz.type === 'prop'}
      <div class="cb-propwrap">
        <div class="cb-prop"><i class={`cb-prop-fill ${c.viz.cls}`} style={`--w:${c.viz.w}`}></i></div>
        <div class="cb-ruler pendek" aria-hidden="true">
          {#each [0, 25, 50, 75, 100] as t (t)}
            <span class="cb-ruler-tick" style={`left:${t}%`}><i></i>{#if t === 0 || t === 100}<em class="mono">{t}%</em>{/if}</span>
          {/each}
        </div>
      </div>
    {:else if c.viz.type === 'range'}
      <div class="cb-range">
        <span class="cb-range-end mono">{c.viz.lo}</span>
        <div class="cb-range-track">
          <i class="cb-range-fill"></i>
          {#if c.viz.jarum}
            <span class="cb-jarum" style={`left:${(posJarum(c.viz.jarum) * 100).toFixed(1)}%`}>
              <em class="mono">{c.viz.jarum.label}</em>
            </span>
          {/if}
        </div>
        <span class="cb-range-end mono accent">{c.viz.hi}</span>
      </div>
    {/if}

    {#if c.side}<p class="cb-side mono">{c.side}</p>{/if}
  </div>
</article>

<style>
  .cb {
    display: grid; grid-template-columns: 1fr 1.5fr; gap: clamp(20px, 5vw, 64px);
    align-items: start; margin: 4px 0 30px; padding-bottom: 30px;
    border-bottom: 1px solid var(--line);
  }
  @media (max-width: 760px) { .cb { grid-template-columns: 1fr; gap: 18px; } }
  .cb-no { font-size: 10px; letter-spacing: 0.18em; color: var(--accent); }
  .cb-apa { font-size: 14.5px; color: var(--muted); line-height: 1.55; max-width: 38ch; margin-top: 8px; }

  .cb-right { display: grid; gap: 12px; }
  .cb-big {
    font-family: 'Fraunces Variable', serif; font-weight: 300;
    font-size: clamp(56px, 11vw, 124px); line-height: 0.86; letter-spacing: -0.02em;
  }
  .cb-big.accent { color: var(--accent); }
  /* the caption is the big number's label — pull it tight, never floating alone */
  .cb-cap { font-size: 13px; color: var(--muted); max-width: 44ch; line-height: 1.5; margin-top: -6px; }
  .cb-side { font-size: 9px; letter-spacing: 0.16em; color: var(--muted); }

  /* isotype dots */
  .cb-dots { display: flex; flex-wrap: wrap; gap: 4px; max-width: 420px; margin: 4px 0; }
  .cb-dots i {
    width: 9px; height: 9px; border-radius: 50%; background: var(--accent2);
    opacity: 0; transform: scale(0.4);
    transition: opacity 0.4s, transform 0.4s var(--ease-out);
    transition-delay: calc(var(--d) * 8ms);
  }
  .in .cb-dots i { opacity: 0.85; transform: none; }

  /* gantt on a labeled log ruler (the gauge vocabulary: line ticks, 7px mono) */
  .cb-gantt { display: grid; gap: 14px; }
  .cb-grow { display: grid; gap: 5px; }
  .cb-grow-k { font-size: 10px; letter-spacing: 0.1em; color: var(--muted); }
  .cb-grow-track { height: 18px; border-left: 1px solid var(--line); position: relative; }
  .cb-grow-track i { position: absolute; inset: 2px auto 2px 0; width: var(--w); background: var(--accent2); transform: scaleX(0); transform-origin: left; transition: transform 1s var(--ease-out); }
  .cb-grow-track i.macet { background: repeating-linear-gradient(135deg, var(--accent2) 0 6px, transparent 6px 11px); }
  .in .cb-grow-track i { transform: scaleX(1); }
  .cb-grow b.num { font-family: var(--font-mono); font-size: 11px; color: var(--muted); }
  .cb-ruler { position: relative; height: 16px; border-top: 1px solid var(--line); margin-top: -4px; }
  .cb-ruler-tick { position: absolute; top: 0; }
  .cb-ruler-tick i { display: block; width: 1px; height: 4px; background: var(--line); }
  .cb-ruler-tick em { position: absolute; top: 5px; left: 0; transform: translateX(-50%); font-style: normal; font-size: 7px; letter-spacing: 0.05em; color: var(--muted); white-space: nowrap; }
  .cb-ruler-tick:first-child em { transform: none; }
  .cb-ruler-tick:last-child em { transform: translateX(-100%); }
  .cb-skala { font-size: 8px; letter-spacing: 0.14em; color: var(--muted); opacity: 0.8; margin-top: -6px; }

  /* proportion bar with its 0–100 ruler (axis honesty) */
  .cb-propwrap { display: grid; gap: 0; }
  .cb-prop { height: 14px; background: color-mix(in oklab, var(--line) 45%, transparent); position: relative; }
  .cb-prop-fill { position: absolute; inset: 0 auto 0 0; width: var(--w); transform: scaleX(0); transform-origin: left; transition: transform 1.1s var(--ease-out); }
  .cb-prop-fill.kembali { background: #cdb47a; }
  .cb-prop-fill.etik { background: var(--accent); opacity: 0.8; }
  .in .cb-prop-fill { transform: scaleX(1); }
  .cb-ruler.pendek { height: 14px; border-top: none; margin-top: 0; }

  /* range with the national needle (np-jarum vocabulary, swept on view) */
  .cb-range { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 10px; margin-top: 16px; }
  .cb-range-end { font-size: 9px; letter-spacing: 0.1em; color: var(--muted); white-space: nowrap; }
  .cb-range-end.accent { color: var(--accent); }
  .cb-range-track { height: 3px; background: linear-gradient(90deg, var(--accent2), var(--accent)); position: relative; }
  .cb-range-fill { position: absolute; inset: 0; background: var(--bg); transform: scaleX(1); transform-origin: right; transition: transform 1.2s var(--ease-out); }
  .in .cb-range-fill { transform: scaleX(0); }
  .cb-jarum { position: absolute; bottom: -4px; width: 2px; height: 11px; background: var(--accent); opacity: 0; transition: opacity 0.5s 1s; }
  .cb-jarum em { position: absolute; bottom: 13px; left: 50%; transform: translateX(-50%); font-style: normal; font-size: 7px; letter-spacing: 0.08em; color: var(--accent); white-space: nowrap; }
  .in .cb-jarum { opacity: 1; }
</style>
