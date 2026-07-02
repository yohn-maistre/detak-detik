<script lang="ts">
  /** Veil Muka: the front plate — a dither field pooled into the whitespace
      right of the №01 lead. Every edition prints a different plate: the
      shader's parameters are seeded deterministically from the lead headline
      (hash → shape/scale/px/speed within tasteful bounds), so the art is
      always tied to the day's top finding without a single generated claim.
      Same discipline as Veil Mesin: lazy import, IO speed-gate, masked so no
      canvas edge ever prints, reduced-motion = first frame, absence = the
      plain paper. (v2, planned: the newsroom emits a bounded "seni" spec.) */
  let { seed = 'detak-detik' }: { seed?: string } = $props();

  let host: HTMLDivElement | undefined = $state();

  function hash(s: string): number {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return h;
  }

  $effect(() => {
    const el = host;
    const h = hash(seed);
    if (!el) return;

    let mount: { dispose: () => void; setSpeed: (n?: number) => void } | null = null;
    let io: IntersectionObserver | null = null;
    let hidup = true;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // the seeded plate: bounded picks, never outside the house palette
    const SHAPES = [1, 2, 5] as const; // simplex, warp, ripple
    const shape = SHAPES[h % SHAPES.length]!;
    const px = 2 + (h >>> 3) % 3; // 2–4
    const scale = 0.7 + ((h >>> 6) % 5) * 0.15; // 0.7–1.3
    const speed = reduced ? 0 : 0.06 + ((h >>> 9) % 4) * 0.03; // 0.06–0.15
    const ink: [number, number, number, number] = (h >>> 12) % 4 === 0
      ? [228 / 255, 74 / 255, 6 / 255, 0.2] // the madder plate, one edition in four
      : [21 / 255, 19 / 255, 14 / 255, 0.26];
    const none: [number, number, number, number] = [0, 0, 0, 0];

    void import('@paper-design/shaders')
      .then(({ ShaderMount, ditheringFragmentShader }) => {
        if (!hidup || !host) return;
        mount = new ShaderMount(
          host,
          ditheringFragmentShader,
          {
            u_fit: 0, u_scale: scale, u_rotation: 0, u_offsetX: 0, u_offsetY: 0,
            u_originX: 0.5, u_originY: 0.5, u_worldWidth: 0, u_worldHeight: 0,
            u_colorBack: none, u_colorFront: ink,
            u_shape: shape, u_type: 3, u_pxSize: px,
          },
          undefined,
          speed,
          0,
          1,
          1_000_000,
        );
        if (!reduced) {
          io = new IntersectionObserver(
            ([e]) => { mount?.setSpeed(e?.isIntersecting ? speed : 0); },
            { threshold: 0.05 }
          );
          io.observe(host);
        }
      })
      .catch(() => { /* decorative only: the plain paper is acceptable */ });

    return () => { hidup = false; io?.disconnect(); mount?.dispose(); };
  });
</script>

<div class="vm" bind:this={host} aria-hidden="true"></div>

<style>
  .vm {
    position: absolute;
    inset: -8% 0;
    z-index: 0;
    pointer-events: none;
    /* pooled into the whitespace right of the headline; dies well before
       every canvas edge so no rectangle ever prints on the paper */
    -webkit-mask-image: radial-gradient(46% 68% at 76% 44%, #000 0%, rgba(0, 0, 0, 0.85) 36%, transparent 72%);
    mask-image: radial-gradient(46% 68% at 76% 44%, #000 0%, rgba(0, 0, 0, 0.85) 36%, transparent 72%);
  }
  .vm :global(canvas) { width: 100%; height: 100%; display: block; }
</style>
