<script lang="ts">
  /** Harga Pangan: the wave on the left, the day's basket on the right. Pick a
      commodity from the ranked list; the line redraws itself. Series are
      deterministic samples (marked contoh) in the exact shape the Panel Harga
      Bapanas pipeline will pour into. */
  import { gsap, reducedMotion } from '../lib/motion';
  import { rngFrom } from '../lib/seed';

  type Komoditas = { id: string; nama: string; satuan: string; dasar: number; goyang: number; tren: number };
  const ROSTER: Komoditas[] = [
    { id: 'cabai', nama: 'Cabai rawit', satuan: 'kg', dasar: 52_000, goyang: 0.10, tren: 0.022 },
    { id: 'beras', nama: 'Beras medium', satuan: 'kg', dasar: 14_800, goyang: 0.006, tren: 0.0012 },
    { id: 'migor', nama: 'Minyak goreng', satuan: 'l', dasar: 18_300, goyang: 0.008, tren: 0.0006 },
    { id: 'telur', nama: 'Telur ayam', satuan: 'kg', dasar: 28_400, goyang: 0.02, tren: 0.003 },
    { id: 'bawang', nama: 'Bawang merah', satuan: 'kg', dasar: 38_500, goyang: 0.05, tren: -0.004 },
    { id: 'gula', nama: 'Gula pasir', satuan: 'kg', dasar: 17_900, goyang: 0.007, tren: 0.001 },
    { id: 'ayam', nama: 'Daging ayam', satuan: 'kg', dasar: 37_200, goyang: 0.025, tren: 0.0018 },
  ];

  function seri(k: Komoditas): number[] {
    const rng = rngFrom(`harga-${k.id}-edisi-41`);
    const out: number[] = [];
    let v = k.dasar;
    for (let i = 0; i < 30; i++) {
      v *= 1 + k.tren + (rng() - 0.5) * 2 * k.goyang;
      out.push(Math.round(v / 50) * 50);
    }
    return out;
  }

  // pre-compute every commodity once: last price + 30-day change, for the
  // ranked list and the basket
  const SEMUA = ROSTER.map((k) => {
    const s = seri(k);
    const last = s[29]!;
    const ubah = Math.round(((last - s[0]!) / s[0]!) * 100);
    return { k, s, last, ubah };
  });
  const basket = SEMUA.reduce((a, d) => a + d.last, 0);
  const UPAH_HARIAN = 3_100_000 / 30; // UMP rerata nasional per hari
  const basketPct = Math.round((basket / UPAH_HARIAN) * 100);

  const W = 520;
  const H = 250;
  const PAD = { l: 16, r: 66, t: 24, b: 26 };
  // the honest-state watermark sits in the middle of the plot area
  const WM_X = (PAD.l + W - PAD.r) / 2;
  const WM_Y = (PAD.t + H - PAD.b) / 2;

  let pilihan = $state(ROSTER[0]!);
  const data = $derived(SEMUA.find((d) => d.k.id === pilihan.id)!.s);
  const normal = $derived(data.slice(0, 7).reduce((a, b) => a + b, 0) / 7);
  const bandHi = $derived(normal * 1.08);
  const bandLo = $derived(normal * 0.92);
  const min = $derived(Math.min(...data, bandLo));
  const max = $derived(Math.max(...data, bandHi));
  const px = (i: number) => PAD.l + (i / 29) * (W - PAD.l - PAD.r);
  const py = $derived((v: number) => H - PAD.b - ((v - min) / (max - min || 1)) * (H - PAD.t - PAD.b));
  const path = $derived(data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(' '));
  const area = $derived(`${path} L ${px(29).toFixed(1)} ${H - PAD.b} L ${PAD.l} ${H - PAD.b} Z`);
  const ubah = $derived(Math.round(((data[29]! - data[0]!) / data[0]!) * 100));
  const status = $derived(data[29]! > bandHi ? 'DI ATAS WAJAR' : data[29]! < bandLo ? 'DI BAWAH WAJAR' : 'DALAM KISARAN WAJAR');
  const statusNada = $derived(data[29]! > bandHi ? 'buruk' : 'datar');

  let svgEl: SVGSVGElement;
  let pathEl: SVGPathElement | undefined = $state();
  let scrub = $state<number | null>(null);

  const fmt = new Intl.NumberFormat('id-ID');

  function draw() {
    if (reducedMotion() || !pathEl) return;
    const len = pathEl.getTotalLength();
    gsap.fromTo(pathEl, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut' });
  }

  function pilih(k: Komoditas) {
    if (k.id === pilihan.id) return;
    pilihan = k;
    scrub = null;
    requestAnimationFrame(draw);
  }

  $effect(() => {
    if (!pathEl) return;
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) { draw(); io.disconnect(); }
    }, { threshold: 0.4 });
    io.observe(pathEl);
    return () => io.disconnect();
  });

  function onScrub(e: PointerEvent) {
    const r = svgEl.getBoundingClientRect();
    const gx = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((gx - PAD.l) / (W - PAD.l - PAD.r)) * 29);
    scrub = i >= 0 && i < 30 ? i : null;
  }
</script>

<div class="gw" data-no-stempel>
  <div class="gw-head">
    <div>
      <span class="inkbar gw-bar"><span class="dot">●</span>§3 · HARGA PANGAN</span>
      <h3 class="display">Harga Pangan</h3>
      <span class="eyebrow">30 HARI · PANEL HARGA BAPANAS</span>
      <p class="gw-jujur fig">Menunggu kunci API Badan Pangan; kurva di bawah adalah contoh bentuk, bukan data.</p>
      <button class="chip"><span class="tick">⊙</span>data contoh · menunggu sumber langsung</button>
    </div>
    <span class={`gw-status mono ${statusNada}`}>{pilihan.nama} · {status}</span>
  </div>

  <div class="gw-body">
    <div class="gw-chart">
      <svg
        bind:this={svgEl}
        viewBox="0 0 {W} {H}"
        width="100%"
        role="img"
        aria-label={`Grafik harga ${pilihan.nama} 30 hari, data contoh`}
        onpointermove={onScrub}
        onpointerleave={() => (scrub = null)}
      >
        <defs>
          <linearGradient id="gw-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.16" />
            <stop offset="100%" stop-color="var(--accent)" stop-opacity="0" />
          </linearGradient>
        </defs>
        <rect class="band" x={PAD.l} y={py(bandHi)} width={W - PAD.l - PAD.r} height={Math.max(0, py(bandLo) - py(bandHi))} />
        <line class="band-line" x1={PAD.l} x2={W - PAD.r} y1={py(normal)} y2={py(normal)} />
        <text class="band-label" x={PAD.l + 4} y={py(bandHi) - 4}>KISARAN WAJAR</text>
        <path class="area" d={area} />
        <path bind:this={pathEl} class="wave" d={path} />
        <text class="gw-wm" x={WM_X} y={WM_Y} text-anchor="middle" transform={`rotate(-12 ${WM_X} ${WM_Y})`}>DATA CONTOH</text>
        <circle class="pulse" cx={px(29)} cy={py(data[29]!)} r="4" />
        <text class="end-val num" x={px(29) + 8} y={py(data[29]!) + 4}>Rp {fmt.format(data[29]!)}</text>
        <text class="end-sub" x={px(29) + 8} y={py(data[29]!) + 16}>{ubah >= 0 ? '▲+' : '▼'}{ubah}%/{pilihan.satuan}</text>
        {#if scrub !== null}
          <line class="scrub-line" x1={px(scrub)} x2={px(scrub)} y1={PAD.t - 6} y2={H - PAD.b} />
          <circle class="scrub-dot" cx={px(scrub)} cy={py(data[scrub]!)} r="5" />
          <text class="scrub-read num" x={px(scrub)} y={PAD.t - 12} text-anchor="middle">H−{29 - scrub} · Rp {fmt.format(data[scrub]!)}</text>
        {/if}
      </svg>
      <div class="gw-foot mono">
        <span>−30 HARI</span>
        <span class="up">{pilihan.nama.toUpperCase()} · {ubah >= 0 ? `▲ +${ubah}%` : `▼ ${ubah}%`} · HARI INI</span>
      </div>
    </div>

    <aside class="gw-ctx">
      <div class="gw-basket">
        <span class="eyebrow">BELANJA POKOK HARI INI · TUJUH BAHAN</span>
        <p class="gw-basket-n num">Rp {fmt.format(basket)}</p>
        <span class="gw-basket-sub mono">≈ {basketPct}% UPAH MINIMUM SEHARI (RP {fmt.format(Math.round(UPAH_HARIAN))})</span>
        <div class="gw-basket-bar"><i style={`--p:${Math.min(100, basketPct)}%`}></i></div>
      </div>

      <div class="gw-list" role="listbox" aria-label="Daftar komoditas, urut dari kenaikan tertinggi">
        {#each [...SEMUA].sort((a, b) => b.ubah - a.ubah) as d (d.k.id)}
          <button
            class="gw-li mono"
            class:aktif={pilihan.id === d.k.id}
            class:naik={d.ubah > 0}
            onclick={() => pilih(d.k)}
            role="option"
            aria-selected={pilihan.id === d.k.id}
          >
            <span class="gw-li-nama">{d.k.nama}</span>
            <span class="gw-li-harga num">Rp {fmt.format(d.last)}</span>
            <span class="gw-li-ubah num">{d.ubah >= 0 ? `▲+${d.ubah}` : `▼${d.ubah}`}%</span>
          </button>
        {/each}
      </div>
      <p class="gw-ctx-foot mono">URUT DARI KENAIKAN 30 HARI TERTINGGI · KETUK UNTUK MELIHAT GELOMBANGNYA</p>
    </aside>
  </div>
</div>

<style>
  .gw-bar { display: inline-flex; margin-bottom: 8px; }
  .gw-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
  .gw-head h3 { font-size: clamp(20px, 2.6vw, 28px); }
  .gw-status { font-size: 9px; letter-spacing: 0.14em; padding: 4px 8px; border: 1px solid currentColor; white-space: nowrap; }
  .gw-status.buruk { color: var(--accent); }
  .gw-status.datar { color: var(--muted); }
  .gw-jujur { font-size: 12.5px; margin: 6px 0 10px; max-width: 52ch; }
  .gw-head .chip { align-self: flex-start; }
  .gw-wm { font-family: var(--font-mono); font-size: 30px; letter-spacing: 0.3em; fill: var(--ink); opacity: 0.08; pointer-events: none; }

  .gw-body { display: grid; grid-template-columns: 1.45fr 1fr; gap: clamp(20px, 4vw, 44px); align-items: start; }
  @media (max-width: 820px) { .gw-body { grid-template-columns: 1fr; } }

  svg { touch-action: pan-y; cursor: crosshair; }
  .wave { fill: none; stroke: var(--accent); stroke-width: 2.2; }
  .area { fill: url(#gw-fill); }
  .band { fill: var(--muted); opacity: 0.10; }
  .band-line { stroke: var(--muted); stroke-width: 0.6; stroke-dasharray: 2 4; opacity: 0.6; }
  .band-label { font-family: var(--font-mono); font-size: 7.5px; letter-spacing: 0.14em; fill: var(--muted); }
  .pulse { fill: var(--accent); animation: pulse 2.4s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
  @keyframes pulse { 50% { opacity: 0.45; } }
  .end-val { font-family: var(--font-mono); font-size: 12px; font-weight: 700; fill: var(--accent); }
  .end-sub { font-family: var(--font-mono); font-size: 8.5px; letter-spacing: 0.04em; fill: var(--muted); }
  .scrub-line { stroke: var(--ink); stroke-width: 0.7; opacity: 0.6; }
  .scrub-dot { fill: var(--ink); }
  .scrub-read { font-family: var(--font-mono); font-size: 10.5px; fill: var(--ink); }
  .gw-foot { display: flex; justify-content: space-between; font-size: 10.5px; letter-spacing: 0.12em; color: var(--muted); margin-top: 8px; }
  .gw-foot .up { color: var(--accent); }

  /* context column */
  .gw-basket { border: 1px solid var(--line); padding: 14px 16px 16px; margin-bottom: 16px; }
  .gw-basket-n { font-family: 'Fraunces Variable', serif; font-weight: 380; font-size: clamp(30px, 4.6vw, 46px); line-height: 1; margin: 8px 0 6px; }
  .gw-basket-sub { font-size: 9px; letter-spacing: 0.1em; color: var(--muted); display: block; }
  .gw-basket-bar { height: 4px; background: var(--line-soft); margin-top: 12px; position: relative; }
  .gw-basket-bar i { position: absolute; left: 0; top: 0; bottom: 0; width: var(--p); background: var(--accent); }

  .gw-list { display: grid; border-top: 1px solid var(--line); }
  .gw-li {
    display: grid; grid-template-columns: 1fr auto auto; gap: 10px; align-items: baseline;
    background: none; border: none; border-bottom: 1px solid var(--line-soft);
    padding: 9px 4px; cursor: pointer; text-align: left; color: var(--ink);
    transition: background 0.15s, padding-left 0.15s var(--ease-out);
  }
  .gw-li:hover { background: color-mix(in oklab, var(--accent) 8%, transparent); padding-left: 8px; }
  .gw-li.aktif { background: var(--ink); color: var(--bg); }
  .gw-li-nama { font-size: 11px; letter-spacing: 0.02em; }
  .gw-li-harga { font-size: 11px; color: var(--muted); }
  .gw-li.aktif .gw-li-harga { color: var(--bg); opacity: 0.8; }
  .gw-li-ubah { font-size: 10.5px; color: var(--muted); min-width: 44px; text-align: right; }
  .gw-li.naik .gw-li-ubah { color: var(--accent); }
  .gw-li.aktif .gw-li-ubah { color: var(--bg); }
  .gw-ctx-foot { font-size: 8px; letter-spacing: 0.12em; color: var(--muted); margin-top: 10px; }

  @media (prefers-reduced-motion: reduce) { .pulse { animation: none; } }
</style>
