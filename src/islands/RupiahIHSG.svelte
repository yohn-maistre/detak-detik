<script lang="ts">
  /** Rupiah terhadap dolar: the currency story alone. The IHSG story lives
      in JciVsPeers, directly above. When the Aksara worker answers, the
      curve is six months of real daily closes (Frankfurter, via /pasar
      `seri`); until then a deterministic contoh stands in, watermarked
      so nobody mistakes the shape for data. */
  import { onMount } from 'svelte';
  import { gsap, reducedMotion } from '../lib/motion';
  import { rngFrom } from '../lib/seed';

  function seri(seed: string, dari: number, ke: number, n: number, goyang: number): number[] {
    const rng = rngFrom(seed);
    const out: number[] = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const base = dari + (ke - dari) * (t * t * 0.6 + t * 0.4);
      out.push(base * (1 + (rng() - 0.5) * 2 * goyang));
    }
    out[n - 1] = ke;
    return out;
  }
  const CONTOH = seri('rupiah-2026', 16210, 18047, 140, 0.012);

  type Live = { tanggal: string[]; usdidr: number[] };
  let live = $state<Live | null>(null);

  const AKSARA_URL = (import.meta.env.PUBLIC_AKSARA_URL as string | undefined)?.replace(/\/$/, '');
  onMount(() => {
    if (!AKSARA_URL) return;
    (async () => {
      try {
        const res = await fetch(`${AKSARA_URL}/pasar`, { signal: AbortSignal.timeout(8000) });
        const d = (await res.json()) as { seri?: { tanggal?: unknown; usdidr?: unknown } };
        const s = d.seri;
        if (
          s && Array.isArray(s.tanggal) && Array.isArray(s.usdidr)
          && s.tanggal.length >= 20
          && s.usdidr.length === s.tanggal.length
          && typeof s.usdidr[0] === 'number'
        ) {
          live = { tanggal: s.tanggal as string[], usdidr: s.usdidr as number[] };
        }
      } catch { /* contoh stands; the watermark says so */ }
    })();
  });

  const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  function tglID(iso: string): string {
    const m = Number(iso.slice(5, 7));
    return `${Number(iso.slice(8, 10))} ${BULAN[m - 1] ?? ''} ${iso.slice(0, 4)}`;
  }

  const data = $derived(live ? live.usdidr : CONTOH);
  const akhir = $derived(data[data.length - 1] ?? 0);
  const awal = $derived(data[0] ?? akhir);
  const rpPct = $derived(awal ? ((akhir - awal) / awal) * 100 : 0);
  const rpPctLabel = $derived(`${rpPct >= 0 ? '+' : '−'}${Math.abs(rpPct).toFixed(1).replace('.', ',')}%`);

  const W = 540, H = 230, PAD = { l: 16, r: 70, t: 20, b: 24 };
  const loRaw = $derived(Math.min(...data));
  const hiRaw = $derived(Math.max(...data));
  const min = $derived(live ? (loRaw - (hiRaw - loRaw) * 0.06) : Math.min(loRaw, 17900));
  const max = $derived(live ? (hiRaw + (hiRaw - loRaw) * 0.06) : Math.max(hiRaw, 18120));
  const px = $derived((i: number) => PAD.l + (i / (data.length - 1)) * (W - PAD.l - PAD.r));
  const py = $derived((v: number) => H - PAD.b - ((v - min) / ((max - min) || 1)) * (H - PAD.t - PAD.b));
  const path = $derived(data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(' '));
  const area = $derived(`${path} L ${px(data.length - 1).toFixed(1)} ${H - PAD.b} L ${PAD.l} ${H - PAD.b} Z`);
  const yRekor = $derived(py(18000));
  const rekorTampak = $derived(18000 >= min && 18000 <= max);
  const WM_X = (PAD.l + W - PAD.r) / 2;
  const WM_Y = (PAD.t + H - PAD.b) / 2;
  const fmt = new Intl.NumberFormat('id-ID');

  const cap = $derived(live
    ? `kurs penutupan harian enam bulan terakhir · titik terakhir ${tglID(live.tanggal[live.tanggal.length - 1] ?? '')}`
    : 'pertama kali melewati 18.000, 4 Juni 2026 · nilai terlemah yang pernah tercatat');
  const x0Lab = $derived.by(() => {
    if (!live) return 'JAN 2026';
    const t = live.tanggal[0] ?? '';
    return `${(BULAN[Number(t.slice(5, 7)) - 1] ?? '').toUpperCase()} ${t.slice(0, 4)}`;
  });
  const x1Lab = $derived.by(() => {
    if (!live) return 'JUN';
    const t = live.tanggal[live.tanggal.length - 1] ?? '';
    return (BULAN[Number(t.slice(5, 7)) - 1] ?? '').toUpperCase();
  });
  const ariaSvg = $derived(live
    ? 'Kurs rupiah terhadap dolar AS, penutupan harian enam bulan terakhir, data langsung'
    : 'Kurs rupiah terhadap dolar AS sepanjang 2026, data contoh');

  let pathEl: SVGPathElement | undefined = $state();
  let tampak = $state(false);
  $effect(() => {
    if (!pathEl) return;
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) { tampak = true; io.disconnect(); }
    }, { threshold: 0.4 });
    io.observe(pathEl);
    return () => io.disconnect();
  });
  $effect(() => {
    void path; // redraw whenever the series swaps (contoh -> langsung)
    if (!tampak || !pathEl || reducedMotion()) return;
    const len = pathEl.getTotalLength();
    gsap.fromTo(pathEl, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut' });
  });
</script>

<section class="ri" data-no-stempel data-ref="rupiah">
  <div class="ri-body">
    <div class="ri-chart">
      <p class="ri-big num">Rp {fmt.format(Math.round(akhir))}<span class="ri-unit"> / US$</span></p>
      <p class="ri-cap">{cap}</p>
      {#if !live}
        <p class="ri-jujur fig">Menunggu sumber langsung; kurva di bawah adalah contoh bentuk, bukan data.</p>
      {/if}
      <svg viewBox="0 0 {W} {H}" width="100%" role="img" aria-label={ariaSvg}>
        <defs>
          <linearGradient id="ri-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--accent2)" stop-opacity="0.18" />
            <stop offset="100%" stop-color="var(--accent2)" stop-opacity="0" />
          </linearGradient>
        </defs>
        {#if rekorTampak}
          <line class="ri-rekor" x1={PAD.l} x2={W - PAD.r} y1={yRekor} y2={yRekor} />
          <text class="ri-rekor-lab" x={PAD.l + 4} y={yRekor - 5}>REKOR · 18.000</text>
        {/if}
        <path class="ri-area" d={area} />
        <path bind:this={pathEl} class="ri-line" d={path} />
        {#if !live}
          <text class="ri-wm" x={WM_X} y={WM_Y} text-anchor="middle" transform={`rotate(-12 ${WM_X} ${WM_Y})`}>DATA CONTOH</text>
        {/if}
        <circle class="ri-dot" cx={px(data.length - 1)} cy={py(akhir)} r="4" />
        <text class="ri-end num" x={px(data.length - 1) + 8} y={py(akhir) + 4}>{fmt.format(Math.round(akhir))}</text>
        <text class="ri-x0" x={PAD.l} y={H - 6}>{x0Lab}</text>
        <text class="ri-x1" x={W - PAD.r} y={H - 6} text-anchor="end">{x1Lab}</text>
      </svg>
    </div>

    <aside class="ri-side">
      <span class="eyebrow">RUPIAH · 6 BULAN</span>
      <p class="ri-side-big num">{rpPctLabel}<span class="ri-unit"> vs US$</span></p>
      <p class="ri-side-teks">perubahan nilai tukar terhadap dolar AS dalam enam bulan terakhir, dihitung dari kurs penutupan harian.</p>
      {#if live}
        <button class="chip"><span class="tick">⊙</span>frankfurter + yahoo · langsung</button>
      {:else}
        <button class="chip"><span class="tick">⊙</span>data contoh · menunggu sumber langsung</button>
      {/if}
    </aside>
  </div>
</section>

<style>
  .ri-body { display: grid; grid-template-columns: 1.6fr 1fr; gap: clamp(20px, 4vw, 48px); align-items: start; }
  @media (max-width: 820px) { .ri-body { grid-template-columns: 1fr; } }
  .ri-big { font-family: 'Fraunces Variable', serif; font-weight: 340; font-size: clamp(40px, 6.5vw, 76px); line-height: 0.92; color: var(--accent2); }
  .ri-unit { font-size: 0.32em; color: var(--muted); letter-spacing: 0.02em; }
  .ri-cap { font-size: 13px; color: var(--muted); margin: 8px 0 12px; max-width: 50ch; }
  .ri-jujur { font-size: 12.5px; margin: -6px 0 12px; max-width: 50ch; }
  svg { display: block; }
  .ri-line { fill: none; stroke: var(--accent2); stroke-width: 2.2; }
  .ri-area { fill: url(#ri-fill); }
  .ri-rekor { stroke: var(--accent); stroke-width: 0.8; stroke-dasharray: 3 4; opacity: 0.8; }
  .ri-rekor-lab { font-family: var(--font-mono); font-size: 8px; letter-spacing: 0.14em; fill: var(--accent); }
  .ri-dot { fill: var(--accent2); }
  /* the featured value wears Fraunces (site law since the pasar plates) */
  .ri-end { font-family: 'Fraunces Variable', serif; font-weight: 340; font-size: 13.5px; fill: var(--accent2); }
  .ri-wm { font-family: var(--font-mono); font-size: 30px; letter-spacing: 0.3em; fill: var(--ink); opacity: 0.08; pointer-events: none; }
  svg text { font-family: var(--font-mono); font-size: 8.5px; letter-spacing: 0.1em; fill: var(--muted); }

  .ri-side { border-left: 1px solid var(--line); padding-left: clamp(16px, 3vw, 30px); }
  @media (max-width: 820px) { .ri-side { border-left: none; padding-left: 0; border-top: 1px solid var(--line); padding-top: 20px; } }
  .ri-side-big { font-family: 'Fraunces Variable', serif; font-weight: 300; font-size: clamp(48px, 8vw, 92px); line-height: 0.9; color: var(--accent); margin: 6px 0 10px; }
  .ri-side-teks { font-size: 14px; color: var(--ink); line-height: 1.55; max-width: 36ch; margin-bottom: 14px; }
  .ri-side .chip { align-self: flex-start; }
</style>
