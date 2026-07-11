<script lang="ts">
  /**
   * Republik Oligarki: three documents, one direction. The subsidy that
   * climbs with income, the land that belongs to companies, and a season
   * where the small were tightened and the large were loosened. Formal
   * voice; the arithmetic carries the charge. The daily gap ticks live
   * off a fixed annual delta (CELIOS 2026), labelled as a rate.
   */
  import { onMount } from 'svelte';

  // CELIOS 2026: 50 richest +~Rp13 bn/day; avg worker real wage +~Rp2.000/day
  const OLIGARK_PER_HARI = 13_000_000_000;
  const PEKERJA_PER_HARI = 2_000;
  const EPOCH = Date.UTC(2026, 0, 1);
  let hari = $state(1);
  onMount(() => {
    const tick = () => { hari = Math.max(1, Math.floor((Date.now() - EPOCH) / 86_400_000)); };
    tick();
    const iv = setInterval(tick, 30_000);
    return () => clearInterval(iv);
  });

  const fmt = new Intl.NumberFormat('id-ID');
  const rpSingkat = (n: number) =>
    n >= 1e12 ? `Rp ${(n / 1e12).toLocaleString('id-ID', { maximumFractionDigits: 1 })} T`
    : n >= 1e9 ? `Rp ${(n / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 1 })} M`
    : `Rp ${fmt.format(n)}`;

  // subsidy gap (World Bank IEP, 12 Jun 2026)
  const SUBSIDI = { miskin: 50_000, kaya: 2_500_000 };
  const lipat = Math.round(SUBSIDI.kaya / SUBSIDI.miskin);

  // land (FWI/Auriga 2025): corporate vs smallholder share of plantation land
  const TANAH_KORP = 92;
</script>

<div class="ro" data-no-stempel>
  <!-- what this block is, in one plain sentence, before any number -->
  <p class="ro-baca fig">Empat dokumen tentang arah yang sama: kecepatan kekayaan bertumbuh, ke mana subsidi mengalir, siapa memegang tanah, dan bagaimana aturan diberlakukan. Angka dari sumber di tiap kartu; kesimpulan diserahkan kepada pembaca.</p>

  <!-- the live gap, set in type: the size contrast is the chart -->
  <div class="ro-tik" role="group" aria-label={`Sejak 1 Januari: 50 orang terkaya bertambah ${rpSingkat(OLIGARK_PER_HARI * hari)}, pekerja rata-rata ${rpSingkat(PEKERJA_PER_HARI * hari)}`}>
    <span class="ro-no mono ro-tik-no">DOKUMEN 1 · LAJU KEKAYAAN</span>
    <div class="ro-tik-sisi">
      <span class="ro-tik-lbl mono">50 ORANG TERKAYA · SEJAK 1 JAN</span>
      <span class="ro-tik-val besar num">+&thinsp;{rpSingkat(OLIGARK_PER_HARI * hari)}</span>
    </div>
    <div class="ro-tik-pivot" aria-hidden="true">
      <b class="num">{fmt.format(OLIGARK_PER_HARI / PEKERJA_PER_HARI)}×</b>
      <span class="mono">SELISIH LAJU HARIAN</span>
    </div>
    <div class="ro-tik-sisi kanan">
      <span class="ro-tik-lbl mono">PEKERJA RATA-RATA · PERIODE SAMA</span>
      <span class="ro-tik-val kecil num">+&thinsp;{rpSingkat(PEKERJA_PER_HARI * hari)}</span>
    </div>
    <p class="ro-tik-foot mono">⊙ celios 2026 · ± Rp 13 miliar/hari berbanding ± Rp 2.000/hari · laju rata-rata · hari ke-{hari}</p>
  </div>

  <!-- 1 · the upside-down subsidy -->
  <section class="ro-sec">
    <span class="ro-no mono">DOKUMEN 2 · SUBSIDI</span>
    <h3 class="ro-h fig">Subsidi yang naik bersama penghasilan</h3>
    <div class="ro-sub">
      <div class="ro-sub-row">
        <span class="ro-sub-lbl mono">20% TERMISKIN</span>
        <div class="ro-bar"><i style="width:2%"></i></div>
        <span class="ro-sub-num num">Rp 50.000</span>
      </div>
      <div class="ro-sub-row">
        <span class="ro-sub-lbl mono">20% TERKAYA</span>
        <div class="ro-bar"><i class="kaya" style="width:100%"></i></div>
        <span class="ro-sub-num num accent">Rp 2.500.000</span>
      </div>
    </div>
    <p class="ro-cap">Subsidi BBM per kapita per kelompok pendapatan. Rumah tangga terkaya menerima <b class="accent">{lipat}×</b> lipat dari yang termiskin, dari anggaran yang sama. Lebih dari separuh subsidi BBM mengalir ke 20% teratas.</p>
    <button class="chip"><span class="tick">⊙</span>bank dunia · iep · 12 jun 2026</button>
  </section>

  <!-- 2 · whose land -->
  <section class="ro-sec">
    <span class="ro-no mono">DOKUMEN 3 · TANAH</span>
    <h3 class="ro-h fig">Tanah perkebunan, seratus petak</h3>
    <div class="ro-waffle" role="img" aria-label={`${TANAH_KORP} dari 100 petak dikuasai korporasi`}>
      {#each Array.from({ length: 100 }) as _, i}
        <i class:korp={i < TANAH_KORP}></i>
      {/each}
    </div>
    <p class="ro-cap"><b class="accent">{TANAH_KORP} dari 100 hektare</b> lahan perkebunan dikuasai korporasi; sisanya (delapan petak) dibagi masyarakat dan petani kecil. Pada 2024, 58,7% deforestasi terjadi di dalam konsesi.</p>
    <button class="chip"><span class="tick">⊙</span>forest watch indonesia · auriga · 2025</button>
  </section>

  <!-- 3 · the asymmetric season -->
  <section class="ro-sec">
    <span class="ro-no mono">DOKUMEN 4 · ATURAN</span>
    <h3 class="ro-h fig">Satu musim, dua perlakuan</h3>
    <div class="ro-asim">
      <div class="ro-asim-col kecil">
        <span class="ro-asim-tag mono">USAHA KECIL</span>
        <p class="ro-asim-teks">Cakupan fasilitas PPh final diperketat (PP 20/2026); tidak ada keringanan biaya hidup.</p>
        <span class="ro-asim-arah mono turun">ATURAN DIPERKETAT ↓</span>
      </div>
      <div class="ro-asim-col besar">
        <span class="ro-asim-tag mono">TAMBANG BESAR</span>
        <p class="ro-asim-teks">Kenaikan royalti minerba dan bea keluar yang dijadwalkan Juni 2026 ditunda pada Mei 2026, setelah “masukan pelaku usaha”.</p>
        <span class="ro-asim-arah mono naik">ATURAN DILONGGARKAN ↑</span>
      </div>
    </div>
    <p class="ro-cap mono ro-cap-kecil">CATATAN: ini asimetri perlakuan, bukan kenaikan tarif pajak UMKM. Tarif PPh final 0,5% tetap; yang berubah adalah cakupan dan penegakan. Sumber royalti: PP 19/2025 dan penundaan Mei 2026.</p>
    <div class="ro-chips">
      <button class="chip"><span class="tick">⊙</span>pp 20/2026 · djp</button>
      <button class="chip"><span class="tick">⊙</span>esdm · penundaan royalti · mei 2026</button>
    </div>
  </section>

  <p class="ro-tutup fig">Lima puluh orang menguasai kekayaan setara lima puluh lima juta rakyat; hampir tiga perlima di antaranya berasal dari nikel, batu bara, dan sawit. <span class="mono">(angka terverifikasi; rincian di Sumber &amp; Metode)</span></p>
</div>

<style>
  .ro { display: grid; gap: clamp(34px, 5vw, 52px); }
  /* de-boxed: two deltas on one baseline, the pivot states the rate gap.
     The oligarch's figure is display-size, the worker's is caption-size:
     the typography carries the ratio no bar chart could. */
  .ro-tik { display: grid; grid-template-columns: auto auto 1fr; gap: 10px clamp(20px, 4vw, 56px); align-items: end; border-top: 2px solid var(--ink); padding-top: 16px; }
  @media (max-width: 640px) { .ro-tik { grid-template-columns: 1fr; align-items: start; } }
  .ro-tik-sisi { display: grid; gap: 8px; align-content: end; }
  .ro-tik-sisi.kanan { align-content: end; }
  .ro-tik-lbl { font-size: 9px; letter-spacing: 0.14em; color: var(--muted); }
  .ro-tik-val { font-family: 'Fraunces Variable', serif; font-weight: 340; line-height: 0.9; }
  .ro-tik-val.besar { font-size: clamp(44px, 7vw, 84px); color: var(--accent); }
  .ro-tik-val.kecil { font-size: clamp(17px, 2.2vw, 24px); color: var(--ink); }
  .ro-tik-pivot { display: grid; gap: 3px; align-content: end; padding: 0 0 6px; }
  .ro-tik-pivot b { font-family: 'Fraunces Variable', serif; font-weight: 340; font-size: clamp(15px, 1.8vw, 20px); color: var(--ink); }
  .ro-tik-pivot .mono { font-size: 7.5px; letter-spacing: 0.16em; color: var(--muted); }
  .ro-tik-foot { grid-column: 1 / -1; font-size: 8.5px; letter-spacing: 0.1em; color: var(--muted); border-top: 1px solid var(--line-soft); padding-top: 8px; margin-top: 4px; }

  .ro-baca { font-size: clamp(14px, 1.7vw, 17px); color: var(--muted); line-height: 1.6; max-width: 62ch; }
  .ro-no { display: block; font-size: 8.5px; letter-spacing: 0.2em; color: var(--accent2); margin-bottom: 8px; }
  .ro-tik-no { grid-column: 1 / -1; margin-bottom: 0; }
  .ro-sec { border-top: 1px solid var(--line); padding-top: 16px; }
  .ro-h { font-size: clamp(20px, 2.6vw, 28px); color: var(--ink); margin-bottom: 16px; }
  .ro-cap { font-size: 14.5px; line-height: 1.6; color: var(--muted); margin: 14px 0 12px; max-width: 60ch; }
  .ro-cap b.accent, .accent { color: var(--accent); }
  .ro-cap-kecil { font-size: 11px; letter-spacing: 0.04em; }

  .ro-sub { display: grid; gap: 12px; }
  .ro-sub-row { display: grid; grid-template-columns: 110px 1fr auto; gap: 14px; align-items: center; }
  .ro-sub-lbl { font-size: 9px; letter-spacing: 0.14em; color: var(--muted); }
  .ro-bar { height: 22px; background: color-mix(in oklab, var(--line) 40%, transparent); position: relative; }
  .ro-bar i { position: absolute; inset: 0 auto 0 0; height: 100%; background: var(--muted); }
  .ro-bar i.kaya { background: var(--accent); }
  .ro-sub-num { font-family: var(--font-mono); font-size: 13px; font-weight: 700; white-space: nowrap; }

  .ro-waffle { display: grid; grid-template-columns: repeat(20, 1fr); gap: 3px; max-width: 460px; }
  @media (max-width: 560px) { .ro-waffle { grid-template-columns: repeat(10, 1fr); } }
  .ro-waffle i { aspect-ratio: 1; background: color-mix(in oklab, var(--line) 35%, transparent); }
  .ro-waffle i.korp { background: var(--accent); }

  .ro-asim { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid var(--line); }
  @media (max-width: 640px) { .ro-asim { grid-template-columns: 1fr; } }
  .ro-asim-col { padding: 18px; display: grid; gap: 10px; align-content: start; }
  .ro-asim-col.kecil { border-right: 1px solid var(--line); }
  @media (max-width: 640px) { .ro-asim-col.kecil { border-right: none; border-bottom: 1px solid var(--line); } }
  .ro-asim-tag { font-size: 9px; letter-spacing: 0.18em; color: var(--muted); }
  .ro-asim-teks { font-size: 13.5px; line-height: 1.55; }
  .ro-asim-arah { font-size: 10px; letter-spacing: 0.1em; }
  .ro-asim-arah.turun { color: var(--muted); }
  .ro-asim-arah.naik { color: var(--accent); }

  .ro-chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .ro-tutup { font-size: clamp(16px, 2vw, 20px); color: var(--ink); max-width: 56ch; border-top: 1px solid var(--line); padding-top: 20px; }
  .ro-tutup .mono { font-size: 11px; color: var(--muted); }
</style>
