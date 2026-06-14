<script lang="ts">
  /**
   * Anatomi Kekuasaan: the five branches, each a band with one signature
   * figure and a micro-viz that draws itself on view. Not a scoreboard of
   * boxes: a sequence of dossiers. Each links down to its chapter. Documents
   * speak; the reader draws the conclusion.
   */
  import { onMount } from 'svelte';
  import { reducedMotion } from '../lib/motion';

  let root: HTMLElement;
  onMount(() => {
    if (reducedMotion()) { root.querySelectorAll('.ak-band').forEach((b) => b.classList.add('in')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.3 });
    root.querySelectorAll('.ak-band').forEach((b) => io.observe(b));
    return () => io.disconnect();
  });
</script>

<section class="ak" bind:this={root} aria-label="Anatomi kekuasaan">
  <div class="bab-head">
    <span class="inkbar"><span class="dot">●</span>ANATOMI KEKUASAAN</span>
    <p class="bab-dek">Lima cabang, masing-masing satu angka yang menandainya hari ini. Tiap baris menautkan ke babnya.</p>
  </div>

  <article class="ak-band" data-no-stempel>
    <div class="ak-left">
      <span class="ak-no mono">01</span>
      <h3 class="ak-nama display">Eksekutif</h3>
      <p class="ak-apa">Presiden, 48 menteri, 56 wakil menteri, dan badan seperti Danantara dan Badan Pengarah Papua.</p>
      <a class="ak-baca mono" href="#kuasa">→ Bab Kuasa &amp; Harta</a>
    </div>
    <div class="ak-right">
      <p class="ak-big display num">109</p>
      <p class="ak-cap">pejabat kabinet, terbanyak sejak 1966</p>
      <div class="ak-dots" aria-hidden="true">{#each Array(109) as _, i}<i style={`--d:${i}`}></i>{/each}</div>
      <p class="ak-side mono">DANANTARA: 0 LAPORAN KEUANGAN TERBIT</p>
    </div>
  </article>

  <article class="ak-band" data-no-stempel>
    <div class="ak-left">
      <span class="ak-no mono">02</span>
      <h3 class="ak-nama display">Legislatif</h3>
      <p class="ak-apa">DPR 580 kursi dan DPD: menyusun undang-undang dan anggaran negara.</p>
      <a class="ak-baca mono" href="#janji">→ Janji &amp; undang-undang</a>
    </div>
    <div class="ak-right">
      <div class="ak-gantt">
        <div class="ak-grow">
          <span class="ak-grow-k mono">Revisi UU Polri</span>
          <div class="ak-grow-track"><i style="--w:4%"></i></div>
          <b class="num">20 hari</b>
        </div>
        <div class="ak-grow">
          <span class="ak-grow-k mono">RUU Perampasan Aset</span>
          <div class="ak-grow-track"><i class="macet" style="--w:100%"></i></div>
          <b class="num">13+ tahun</b>
        </div>
      </div>
      <p class="ak-cap">Yang memperkuat kuasa lolos dalam hitungan hari; yang merampas hasil korupsi menunggu belasan tahun, belum disahkan.</p>
    </div>
  </article>

  <article class="ak-band" data-no-stempel>
    <div class="ak-left">
      <span class="ak-no mono">03</span>
      <h3 class="ak-nama display">Yudikatif</h3>
      <p class="ak-apa">Mahkamah Agung, Mahkamah Konstitusi, dan KPK: menafsir hukum dan mengadili.</p>
      <a class="ak-baca mono" href="#hukum">→ Bab Hukum &amp; Vonis</a>
    </div>
    <div class="ak-right">
      <p class="ak-big display num">13%</p>
      <p class="ak-cap">dari kerugian korupsi yang akhirnya kembali ke kas negara</p>
      <div class="ak-prop"><i class="ak-prop-fill kembali" style="--w:13%"></i></div>
      <p class="ak-side mono">87% TIDAK PERNAH KEMBALI</p>
    </div>
  </article>

  <article class="ak-band" data-no-stempel>
    <div class="ak-left">
      <span class="ak-no mono">04</span>
      <h3 class="ak-nama display">Aparat</h3>
      <p class="ak-apa">Polri dan TNI: alat paksa negara, dengan anggaran terbesar di APBN.</p>
      <a class="ak-baca mono" href="#aparat">→ Bab Aparat</a>
    </div>
    <div class="ak-right">
      <p class="ak-big display num accent">602</p>
      <p class="ak-cap">insiden kekerasan polisi setahun, 10 di antaranya berujung kematian</p>
      <div class="ak-prop"><i class="ak-prop-fill etik" style="--w:88%"></i></div>
      <p class="ak-side mono">SEBAGIAN BESAR BERAKHIR DI SIDANG ETIK, BUKAN PIDANA</p>
    </div>
  </article>

  <article class="ak-band" data-no-stempel>
    <div class="ak-left">
      <span class="ak-no mono">05</span>
      <h3 class="ak-nama display">Daerah</h3>
      <p class="ak-apa">38 provinsi, ratusan pemda, plus otonomi khusus Aceh dan Papua.</p>
      <a class="ak-baca mono" href="#ekonomi">→ Bab Ekonomi &amp; Daerah</a>
    </div>
    <div class="ak-right">
      <p class="ak-big display num">8×</p>
      <p class="ak-cap">selisih peluang lahir miskin antara provinsi terendah dan tertinggi</p>
      <div class="ak-range">
        <span class="ak-range-end mono">BALI 3,7%</span>
        <div class="ak-range-track"><i class="ak-range-fill"></i></div>
        <span class="ak-range-end mono accent">PAPUA PEG. 30,0%</span>
      </div>
    </div>
  </article>
</section>

<style>
  .ak { padding-top: 8px; }
  .ak-band {
    display: grid; grid-template-columns: 1fr 1.5fr; gap: clamp(20px, 5vw, 64px);
    padding: clamp(26px, 4vw, 44px) 0;
    border-top: 1px solid var(--line);
    align-items: start;
  }
  @media (max-width: 760px) { .ak-band { grid-template-columns: 1fr; gap: 18px; } }
  .ak-no { font-size: 11px; color: var(--accent); letter-spacing: 0.16em; }
  .ak-nama { font-family: 'Fraunces Variable', serif; font-weight: 360; font-size: clamp(30px, 5vw, 58px); line-height: 0.98; margin: 6px 0 12px; }
  .ak-apa { font-size: 14px; color: var(--muted); line-height: 1.55; max-width: 36ch; }
  .ak-baca { display: inline-block; margin-top: 16px; font-size: 10px; letter-spacing: 0.16em; color: var(--accent2); position: relative; text-decoration: none; }
  .ak-baca::after { content: ''; position: absolute; left: 0; bottom: -3px; width: 100%; height: 1px; background: var(--accent2); transform: scaleX(0); transform-origin: left; transition: transform 0.35s var(--ease-out); }
  .ak-baca:hover::after { transform: scaleX(1); }

  .ak-right { display: grid; gap: 12px; }
  .ak-big {
    font-family: 'Fraunces Variable', serif; font-weight: 300;
    font-size: clamp(56px, 11vw, 130px); line-height: 0.86; letter-spacing: -0.02em;
    opacity: 0; transform: translateY(16px);
    transition: opacity 0.7s var(--ease-out), transform 0.7s var(--ease-out);
  }
  .ak-big.accent { color: var(--accent); }
  .in .ak-big { opacity: 1; transform: none; }
  .ak-cap { font-size: 14.5px; color: var(--ink); max-width: 44ch; line-height: 1.5; }
  .ak-side { font-size: 9px; letter-spacing: 0.16em; color: var(--muted); }

  /* isotype dots */
  .ak-dots { display: flex; flex-wrap: wrap; gap: 4px; max-width: 420px; margin: 4px 0; }
  .ak-dots i {
    width: 9px; height: 9px; border-radius: 50%; background: var(--accent2);
    opacity: 0; transform: scale(0.4);
    transition: opacity 0.4s, transform 0.4s var(--ease-out);
    transition-delay: calc(var(--d) * 8ms);
  }
  .in .ak-dots i { opacity: 0.85; transform: none; }

  /* gantt bars */
  .ak-gantt { display: grid; gap: 14px; }
  .ak-grow { display: grid; grid-template-columns: 1fr; gap: 5px; }
  .ak-grow-k { font-size: 10px; letter-spacing: 0.1em; color: var(--muted); }
  .ak-grow-track { height: 18px; border-left: 1px solid var(--line); position: relative; }
  .ak-grow-track i { position: absolute; inset: 2px auto 2px 0; width: var(--w); background: var(--accent2); transform: scaleX(0); transform-origin: left; transition: transform 1s var(--ease-out); }
  .ak-grow-track i.macet { background: repeating-linear-gradient(135deg, var(--accent2) 0 6px, transparent 6px 11px); }
  .in .ak-grow-track i { transform: scaleX(1); }
  .ak-grow b { position: absolute; }
  .ak-grow > b.num { position: static; font-family: var(--font-mono); font-size: 11px; color: var(--muted); margin-top: 2px; }

  /* proportion bar */
  .ak-prop { height: 14px; background: color-mix(in oklab, var(--line) 45%, transparent); position: relative; }
  .ak-prop-fill { position: absolute; inset: 0 auto 0 0; width: var(--w); transform: scaleX(0); transform-origin: left; transition: transform 1.1s var(--ease-out); }
  .ak-prop-fill.kembali { background: #cdb47a; }
  .ak-prop-fill.etik { background: var(--accent); opacity: 0.8; }
  .in .ak-prop-fill { transform: scaleX(1); }

  /* range */
  .ak-range { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 10px; margin-top: 4px; }
  .ak-range-end { font-size: 9px; letter-spacing: 0.1em; color: var(--muted); white-space: nowrap; }
  .ak-range-track { height: 3px; background: linear-gradient(90deg, var(--accent2), var(--accent)); position: relative; }
  .ak-range-fill { position: absolute; inset: 0; background: var(--bg); transform: scaleX(1); transform-origin: right; transition: transform 1.2s var(--ease-out); }
  .in .ak-range-fill { transform: scaleX(0); }
</style>
