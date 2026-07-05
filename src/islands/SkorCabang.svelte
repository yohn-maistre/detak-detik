<script lang="ts">
  /** Skor Cabang: the accountability scoreboard under a branch header — a few
      sourced tiles (a number, a waffle, a funnel, a dumbbell) read against
      reality, not framing. Reveals on scroll; reduced-motion = resolved state. */
  import { onMount } from 'svelte';
  import { reducedMotion } from '../lib/motion';
  import { SKOR, type SkorTile } from '../lib/data/akuntabilitas';

  let { cabang }: { cabang: string } = $props();
  const skor = SKOR[cabang];
  const tiles: SkorTile[] = skor?.tiles ?? [];

  let root: HTMLElement;
  onMount(() => {
    if (reducedMotion()) { root.classList.add('in'); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) { root.classList.add('in'); io.disconnect(); }
    }, { threshold: 0.2 });
    io.observe(root);
    return () => io.disconnect();
  });
</script>

{#if skor}
  <section class="sk" data-no-stempel bind:this={root}>
    <header class="sk-head">
      <span class="eyebrow">SKOR · PERTANGGUNGJAWABAN</span>
      <span class="sk-ringkas fig">{skor.ringkas}</span>
    </header>
    <div class="sk-grid">
      {#each tiles as t, i (i)}
        <article class="sk-tile">
          {#if t.tipe === 'stat'}
            <p class="sk-n num" class:buruk={t.nada === 'buruk'} class:baik={t.nada === 'baik'}>{t.besar}</p>
            <p class="sk-label">{t.label}</p>
            {#if t.sub}<p class="sk-sub mono">{t.sub}</p>{/if}
          {:else if t.tipe === 'waffle'}
            <p class="sk-n num" class:buruk={t.nada === 'buruk'}>{t.isi}<span class="sk-of">/{t.dari}</span></p>
            <div class="sk-waffle" aria-hidden="true">
              {#each Array(t.dari) as _, k (k)}<i class="sk-cell" class:isi={k < t.isi} style={`--d:${k}`}></i>{/each}
            </div>
            <p class="sk-label">{t.label}</p>
          {:else if t.tipe === 'funnel'}
            <div class="sk-funnel">
              {#each t.langkah as s, k (s.k)}
                <div class="sk-step">
                  <i class="sk-step-bar" class:last={k === t.langkah.length - 1} style={`--w:${s.w}%;--d:${k}`}></i>
                  <span class="sk-step-k mono">{s.k}</span>
                  <b class="sk-step-v num">{s.v}</b>
                </div>
              {/each}
            </div>
            <!-- axis honesty: the funnel's 100% is its own first step, said plainly -->
            <div class="sk-ruler mono" aria-hidden="true"><span>0</span><span>100% = {t.langkah[0]?.v}</span></div>
            <p class="sk-label">{t.label}</p>
          {:else if t.tipe === 'dumbbell'}
            <div class="sk-dumb" aria-hidden="true">
              <span class="sk-dot a" style={`left:${t.a.v}%`}></span>
              <span class="sk-bar" style={`left:${Math.min(t.a.v, t.b.v)}%;width:${Math.abs(t.b.v - t.a.v)}%`}></span>
              <span class="sk-dot b" style={`left:${t.b.v}%`}></span>
            </div>
            <div class="sk-ruler mono" aria-hidden="true"><span>0{t.satuan}</span><span>{t.maks ?? `100${t.satuan}`}</span></div>
            <p class="sk-dumb-key mono"><span class="a">{t.a.k} {t.a.teks ?? `${t.a.v}${t.satuan}`}</span> · <span class="b">{t.b.k} {t.b.teks ?? `${t.b.v}${t.satuan}`}</span></p>
            <p class="sk-label">{t.label}</p>
          {/if}
          <span class="sk-src mono">⊙ {t.sumber} · {t.live ?? '(data contoh)'}</span>
        </article>
      {/each}
    </div>
  </section>
{/if}

<style>
  .sk { display: grid; gap: 16px; border-top: 1px solid var(--line); padding-top: 16px; }
  .sk-head { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; }
  .sk-ringkas { font-size: clamp(15px, 1.8vw, 19px); color: var(--ink); }
  .sk-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: clamp(18px, 3vw, 40px); }
  @media (max-width: 760px) { .sk-grid { grid-template-columns: 1fr; gap: 22px; } }
  /* flex column so the ⊙ source line pins to the tile bottom, aligned across the row */
  .sk-tile { display: flex; flex-direction: column; gap: 8px; border-top: 1px solid var(--line-soft); padding-top: 12px; }
  .sk-ruler { display: flex; justify-content: space-between; border-top: 1px solid var(--line-soft); padding-top: 2px; font-size: 7.5px; letter-spacing: 0.08em; color: var(--muted); opacity: 0.85; }

  .sk-n { font-family: 'Fraunces Variable', serif; font-weight: 340; font-size: clamp(34px, 4.6vw, 56px); line-height: 0.9; color: var(--ink); }
  .sk-n.buruk { color: var(--accent); }
  .sk-n.baik { color: var(--accent2); }
  .sk-of { font-size: 0.42em; color: var(--muted); }
  .sk-label { font-size: 13px; color: var(--ink); line-height: 1.4; max-width: 34ch; }
  .sk-sub { font-size: 9px; letter-spacing: 0.08em; color: var(--muted); }
  .sk-src { font-size: 8.5px; letter-spacing: 0.08em; color: var(--muted); margin-top: auto; padding-top: 6px; }

  /* waffle */
  .sk-waffle { display: grid; grid-template-columns: repeat(10, 1fr); gap: 3px; max-width: 180px; }
  .sk-cell { aspect-ratio: 1; background: var(--line-soft); border-radius: 1px; transform: scale(0); transition: transform 0.4s var(--ease-out); transition-delay: calc(var(--d) * 7ms); }
  .sk-cell.isi { background: var(--accent); }
  .sk.in .sk-cell { transform: scale(1); }

  /* funnel */
  .sk-funnel { display: grid; gap: 7px; }
  .sk-step { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 8px; position: relative; }
  .sk-step-bar { grid-column: 1 / -1; height: 13px; width: var(--w); background: var(--accent); opacity: 0.85; transform: scaleX(0); transform-origin: left; transition: transform 0.7s var(--ease-out); transition-delay: calc(var(--d) * 90ms); }
  .sk-step-bar.last { background: var(--accent2); }
  .sk.in .sk-step-bar { transform: scaleX(1); }
  .sk-step-k { position: absolute; left: 0; top: 15px; font-size: 8.5px; letter-spacing: 0.08em; color: var(--muted); }
  .sk-step-v { position: absolute; right: 0; top: 0; font-family: var(--font-mono); font-size: 10px; color: var(--ink); }
  .sk-step:not(:last-child) { margin-bottom: 14px; }

  /* dumbbell */
  .sk-dumb { position: relative; height: 14px; margin: 8px 0 4px; }
  .sk-dumb::before { content: ''; position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: var(--line-soft); }
  .sk-bar { position: absolute; top: 50%; height: 2px; transform: translateY(-50%); background: var(--muted); }
  .sk-dot { position: absolute; top: 50%; width: 11px; height: 11px; border-radius: 50%; transform: translate(-50%, -50%); }
  .sk-dot.a { background: var(--accent2); }
  .sk-dot.b { background: var(--accent); }
  .sk-dumb-key { font-size: 9px; letter-spacing: 0.04em; color: var(--muted); }
  .sk-dumb-key .a { color: var(--accent2); }
  .sk-dumb-key .b { color: var(--accent); }

  @media (prefers-reduced-motion: reduce) { .sk-cell, .sk-step-bar { transition: none; } }
</style>
