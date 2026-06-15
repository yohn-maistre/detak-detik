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
            <div class="cb-grow-track"><i class:macet={r.macet} style={`--w:${r.w}`}></i></div>
            <b class="num">{r.label}</b>
          </div>
        {/each}
      </div>
    {:else if c.viz.type === 'prop'}
      <div class="cb-prop"><i class={`cb-prop-fill ${c.viz.cls}`} style={`--w:${c.viz.w}`}></i></div>
    {:else if c.viz.type === 'range'}
      <div class="cb-range">
        <span class="cb-range-end mono">{c.viz.lo}</span>
        <div class="cb-range-track"><i class="cb-range-fill"></i></div>
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
    opacity: 0; transform: translateY(16px);
    transition: opacity 0.7s var(--ease-out), transform 0.7s var(--ease-out);
  }
  .cb-big.accent { color: var(--accent); }
  .in .cb-big { opacity: 1; transform: none; }
  .cb-cap { font-size: 14.5px; color: var(--ink); max-width: 44ch; line-height: 1.5; }
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

  /* gantt */
  .cb-gantt { display: grid; gap: 14px; }
  .cb-grow { display: grid; gap: 5px; }
  .cb-grow-k { font-size: 10px; letter-spacing: 0.1em; color: var(--muted); }
  .cb-grow-track { height: 18px; border-left: 1px solid var(--line); position: relative; }
  .cb-grow-track i { position: absolute; inset: 2px auto 2px 0; width: var(--w); background: var(--accent2); transform: scaleX(0); transform-origin: left; transition: transform 1s var(--ease-out); }
  .cb-grow-track i.macet { background: repeating-linear-gradient(135deg, var(--accent2) 0 6px, transparent 6px 11px); }
  .in .cb-grow-track i { transform: scaleX(1); }
  .cb-grow b.num { font-family: var(--font-mono); font-size: 11px; color: var(--muted); }

  /* proportion bar */
  .cb-prop { height: 14px; background: color-mix(in oklab, var(--line) 45%, transparent); position: relative; }
  .cb-prop-fill { position: absolute; inset: 0 auto 0 0; width: var(--w); transform: scaleX(0); transform-origin: left; transition: transform 1.1s var(--ease-out); }
  .cb-prop-fill.kembali { background: #cdb47a; }
  .cb-prop-fill.etik { background: var(--accent); opacity: 0.8; }
  .in .cb-prop-fill { transform: scaleX(1); }

  /* range */
  .cb-range { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 10px; margin-top: 4px; }
  .cb-range-end { font-size: 9px; letter-spacing: 0.1em; color: var(--muted); white-space: nowrap; }
  .cb-range-end.accent { color: var(--accent); }
  .cb-range-track { height: 3px; background: linear-gradient(90deg, var(--accent2), var(--accent)); position: relative; }
  .cb-range-fill { position: absolute; inset: 0; background: var(--bg); transform: scaleX(1); transform-origin: right; transition: transform 1.2s var(--ease-out); }
  .in .cb-range-fill { transform: scaleX(0); }
</style>
