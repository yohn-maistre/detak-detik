<script lang="ts">
  /**
   * Sisa di Alam Liar: how many of each are left, on a log scale because a
   * linear one would hide the smallest. The bars draw in; the count is the
   * headline. Figures are the latest published estimates (sample / contoh).
   */
  import { onMount } from 'svelte';
  import { reducedMotion } from '../lib/motion';

  const SPESIES = [
    { nama: 'Badak Sumatra', n: 40, catatan: 'badak paling terancam di dunia' },
    { nama: 'Badak Jawa', n: 50, catatan: 'turun dari 76; perburuan jantan' },
    { nama: 'Harimau Sumatra', n: 400, catatan: 'subspesies harimau terkecil yang tersisa' },
    { nama: 'Orangutan Tapanuli', n: 760, catatan: 'kera besar paling langka di Bumi' },
  ].sort((a, b) => a.n - b.n);

  const MAXLOG = Math.log10(1000);
  const lebar = (n: number) => `${Math.min(100, (Math.log10(Math.max(n, 1)) / MAXLOG) * 100)}%`;
  const fmt = new Intl.NumberFormat('id-ID');

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
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(root);
    return () => io.disconnect();
  });
</script>

<div class="sa" data-no-stempel bind:this={root}>
  <div class="sa-skala mono"><span>1</span><span>10</span><span>100</span><span>1.000 →</span></div>
  <div class="sa-rows">
    {#each SPESIES as s, i (s.nama)}
      <div class="sa-row">
        <div class="sa-id">
          <span class="sa-nama">{s.nama}</span>
          <span class="sa-cat mono">{s.catatan}</span>
        </div>
        <div class="sa-track">
          <i class="sa-bar" style={`--w:${lebar(s.n)};--d:${i * 90}ms`}></i>
          <b class="sa-n num">{fmt.format(s.n)}</b>
        </div>
      </div>
    {/each}
  </div>
  <p class="sa-kaki fig">
    Badak Jawa dan badak Sumatra yang masih hidup di alam liar, digabung, kurang dari seratus ekor;
    pada skala logaritmik, karena pada skala biasa keduanya hampir tak tampak.
  </p>
  <button class="chip"><span class="tick">⊙</span>iucn 2025 · irf · (data contoh)</button>
</div>

<style>
  .sa-skala {
    display: flex; justify-content: space-between;
    font-size: 8.5px; letter-spacing: 0.16em; color: var(--muted);
    border-bottom: 1px solid var(--line); padding-bottom: 6px; margin-bottom: 16px;
  }
  .sa-rows { display: grid; gap: 18px; }
  .sa-row { display: grid; grid-template-columns: minmax(160px, 240px) 1fr; gap: 16px; align-items: center; }
  @media (max-width: 600px) { .sa-row { grid-template-columns: 1fr; gap: 6px; } }
  .sa-id { display: grid; gap: 2px; }
  .sa-nama { font-family: 'Fraunces Variable', serif; font-weight: 400; font-size: clamp(17px, 2.2vw, 22px); }
  .sa-cat { font-size: 9px; letter-spacing: 0.08em; color: var(--muted); }
  .sa-track { position: relative; height: 26px; border-left: 1px solid var(--line); display: flex; align-items: center; }
  .sa-bar {
    position: absolute; left: 0; top: 4px; bottom: 4px; width: var(--w);
    background: var(--accent2);
    transform: scaleX(0); transform-origin: left;
  }
  .in .sa-bar { transition: transform 0.9s var(--ease-out); transition-delay: var(--d); transform: scaleX(1); }
  .sa-n { position: relative; margin-left: calc(var(--w) + 10px); font-family: var(--font-mono); font-size: 13px; color: var(--ink); }
  .sa-kaki { font-size: 15px; margin-top: 22px; max-width: 56ch; }
  .sa { display: grid; }
  .sa > :global(.chip) { justify-self: start; margin-top: 12px; }
</style>
