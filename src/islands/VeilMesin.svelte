<script lang="ts">
  /** Veil Mesin: a whisper of gold Bayer-dither drifting behind the Angka
      Edisi, the night press's living darkness. Paper Shaders ShaderMount,
      lazy-imported so the WebGL code never enters the main bundle; speed
      drops to 0 offscreen (rAF stops entirely) and under reduced motion the
      first frame stands as a static texture. Pure decoration: if WebGL or
      the import fails, the flat register background simply remains. */
  import { onMount } from 'svelte';

  let host: HTMLDivElement | undefined = $state();

  onMount(() => {
    let mount: { dispose: () => void; setSpeed: (n?: number) => void } | null = null;
    let io: IntersectionObserver | null = null;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    void import('@paper-design/shaders')
      .then(({ ShaderMount, ditheringFragmentShader }) => {
        if (!host) return;
        const gold: [number, number, number, number] = [205 / 255, 180 / 255, 122 / 255, 0.34];
        const none: [number, number, number, number] = [0, 0, 0, 0];
        mount = new ShaderMount(
          host,
          ditheringFragmentShader,
          {
            u_fit: 0, u_scale: 1, u_rotation: 0, u_offsetX: 0, u_offsetY: 0,
            u_originX: 0.5, u_originY: 0.5, u_worldWidth: 0, u_worldHeight: 0,
            u_colorBack: none, u_colorFront: gold,
            u_shape: 1, u_type: 3, u_pxSize: 2,
          },
          undefined,
          reduced ? 0 : 0.1,
          0,
          1,
          1_300_000,
        );
        if (!reduced) {
          io = new IntersectionObserver(
            ([e]) => { mount?.setSpeed(e?.isIntersecting ? 0.1 : 0); },
            { threshold: 0.05 }
          );
          io.observe(host);
        }
      })
      .catch(() => { /* decorative only: absence is acceptable */ });

    return () => { io?.disconnect(); mount?.dispose(); };
  });
</script>

<div class="veil" bind:this={host} aria-hidden="true"></div>

<style>
  .veil {
    /* full-bleed past the wrap, masked to an ellipse that dies well inside the
       canvas — the dither reads as an aura pooling around the figures, never a
       rectangle against the black paper. transparent at 72% of a 52vw radius
       keeps every canvas edge at zero alpha on any viewport. */
    position: absolute;
    top: -14%;
    bottom: -14%;
    left: 50%;
    width: 100vw;
    transform: translateX(-50%);
    z-index: 0;
    pointer-events: none;
    opacity: 0.55;
    -webkit-mask-image: radial-gradient(52% 66% at 50% 52%, #000 0%, rgba(0, 0, 0, 0.85) 32%, transparent 72%);
    mask-image: radial-gradient(52% 66% at 50% 52%, #000 0%, rgba(0, 0, 0, 0.85) 32%, transparent 72%);
  }
  .veil :global(canvas) { width: 100%; height: 100%; display: block; }
</style>
