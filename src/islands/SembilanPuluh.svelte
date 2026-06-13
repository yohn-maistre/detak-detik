<script lang="ts">
  /**
   * 90 Menit: the length of a football match, priced in corruption. In the
   * 90 minutes of a match, Indonesia loses about Rp 56,7 miliar to corruption
   * and recovers barely Rp 2,7 miliar of it (ICW 2024: Rp 330,9 T lost,
   * 4,84% recovered). The clock runs once on view; the pitch fills with what
   * is lost, a thin sliver with what comes back.
   */
  import { onMount } from 'svelte';
  import { gsap, reducedMotion } from '../lib/motion';

  const HILANG_90 = 56_700_000_000;
  const KEMBALI_90 = 2_700_000_000;

  let menit = $state(0);
  let el: HTMLElement;

  const fmtRp = (v: number) =>
    v >= 1e9 ? `Rp ${(v / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 1 })} miliar`
    : `Rp ${(v / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 0 })} juta`;

  const hilang = $derived(HILANG_90 * (menit / 90));
  const kembali = $derived(KEMBALI_90 * (menit / 90));
  const persen = $derived(Math.round((KEMBALI_90 / HILANG_90) * 100));

  onMount(() => {
    const run = () => {
      if (reducedMotion()) { menit = 90; return; }
      const p = { m: 0 };
      gsap.to(p, { m: 90, duration: 3.4, ease: 'none', onUpdate: () => (menit = p.m) });
    };
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { run(); io.disconnect(); } }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  });
</script>

<section class="sp" bind:this={el} data-no-stempel>
  <div class="sp-head">
    <span class="inkbar"><span class="dot">●</span>DALAM 90 MENIT</span>
    <span class="sp-jam mono num">{String(Math.floor(menit)).padStart(2, '0')}:00</span>
  </div>
  <p class="sp-dek">Selama satu pertandingan sepak bola, dari uang negara yang dikorupsi:</p>

  <div class="sp-pitch" role="img" aria-label={`Rp ${Math.round(hilang/1e9)} miliar hilang, Rp ${(kembali/1e9).toFixed(1)} miliar kembali`}>
    <div class="sp-hilang" style={`width:${(menit / 90) * 100}%`}></div>
    <div class="sp-kembali" style={`width:${(menit / 90) * (KEMBALI_90 / HILANG_90) * 100}%`}></div>
    <span class="sp-mid" aria-hidden="true"></span>
  </div>

  <div class="sp-baca">
    <div class="sp-col">
      <p class="sp-angka display num hilang">{fmtRp(hilang)}</p>
      <p class="sp-lbl mono">HILANG KE KORUPSI</p>
    </div>
    <div class="sp-col">
      <p class="sp-angka display num kembali">{fmtRp(kembali)}</p>
      <p class="sp-lbl mono">DIPULIHKAN NEGARA · {persen}%</p>
    </div>
  </div>
  <p class="sp-foot fig">Sembilan puluh menit habis. Sembilan puluh lima dari setiap seratus rupiah tidak pernah kembali. <button class="chip"><span class="tick">⊙</span>icw 2024</button></p>
</section>

<style>
  .sp { display: grid; gap: 16px; }
  .sp-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
  .sp-jam { font-size: clamp(20px, 3vw, 30px); color: var(--accent); font-weight: 700; }
  .sp-dek { font-size: 15px; color: var(--muted); }
  .sp-pitch {
    position: relative; height: 46px; border: 1px solid var(--line);
    background: repeating-linear-gradient(90deg, transparent 0 calc(100%/9 - 1px), color-mix(in oklab, var(--line) 50%, transparent) calc(100%/9 - 1px) calc(100%/9));
    overflow: hidden;
  }
  .sp-hilang { position: absolute; inset: 0 auto 0 0; background: var(--accent); opacity: 0.85; }
  .sp-kembali { position: absolute; inset: 0 auto 0 0; background: #cdb47a; }
  .sp-mid { position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; background: color-mix(in oklab, var(--bg) 60%, transparent); }
  .sp-baca { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .sp-angka { font-family: 'Fraunces Variable', serif; font-weight: 340; font-size: clamp(26px, 4.5vw, 52px); line-height: 1; }
  .sp-angka.hilang { color: var(--accent); }
  .sp-angka.kembali { color: #cdb47a; }
  .sp-lbl { font-size: 9px; letter-spacing: 0.16em; color: var(--muted); margin-top: 8px; }
  .sp-foot { font-size: 15px; color: var(--ink); max-width: 60ch; }
  .sp-foot .chip { margin-left: 6px; vertical-align: middle; }
</style>
