<script lang="ts">
  /**
   * Almanak: the atlas's scientific margin note. One plate a day, chosen by
   * the calendar (deterministic — the same plate for every reader, law 5),
   * computed from published figures rather than asked of any model. The
   * satire is in the arithmetic; the voice stays formal.
   */
  const HARI = Math.floor(Date.now() / 86_400_000);

  // cattle methane: ~18.6M head (BPS) × 99 kg CH4/yr × GWP100 ≈ 28
  const sapiCo2JtTon = Math.round((18_600_000 * 99 * 28) / 1e9);

  const KOTA_METEOR = ['Jakarta', 'Surabaya', 'Medan', 'Makassar', 'Jayapura', 'Pontianak'];
  const kota = KOTA_METEOR[HARI % KOTA_METEOR.length]!;

  const ENTRI = [
    {
      judul: 'Tentang ternak dan atmosfer',
      teks: `Indonesia memelihara sekitar 18,6 juta ekor sapi. Pencernaan mereka melepas metana setara ±${sapiCo2JtTon} juta ton CO₂ per tahun, kira-kira setara emisi tahunan 11 juta mobil.`,
      rumus: '18,6 jt ekor × 99 kg CH₄/th × GWP 28',
      chips: ['bps · populasi ternak', 'fao · faktor emisi'],
    },
    {
      judul: 'Tentang batu dari langit',
      teks: `Seandainya asteroid berdiameter 500 meter jatuh di ${kota} hari ini, radius kehancuran beratnya mencapai ±30 km, lebih luas dari kota itu sendiri. Probabilitas tahun ini: hampir nol. Almanak mencatatnya supaya angka besar punya pembanding.`,
      rumus: 'impact-scaling purdue/imperial · d=500 m, v=17 km/s',
      chips: ['earth impact effects program'],
    },
    {
      judul: 'Tentang garis yang tak terlihat',
      teks: 'Di selat selebar 35 km antara Bali dan Lombok berdiri perbatasan fauna paling tajam di bumi: Garis Wallace. Di sisi baratnya harimau dan badak; di timurnya kanguru pohon dan kakatua. Ditarik tahun 1859, belum bergeser sampai sekarang.',
      rumus: 'wallace, 1859 · the malay archipelago',
      chips: ['wikipedia · garis wallace'],
    },
    {
      judul: 'Tentang gunung yang bernapas',
      teks: 'Republik ini berdiri di atas 127 gunung api aktif, terbanyak di dunia. Tujuh puluh enam di antaranya pernah meletus sejak tahun 1600. Sekitar 175 juta jiwa tinggal dalam radius 100 km dari salah satunya.',
      rumus: 'katalog gunung api holosen',
      chips: ['smithsonian gvp', 'magma esdm'],
    },
    {
      judul: 'Tentang 718 cara mengucapkan air',
      teks: 'Tercatat 718 bahasa daerah hidup di kepulauan ini, kedua terbanyak di dunia setelah Papua Nugini. Sebagian dituturkan kurang dari seratus orang; setiap dasawarsa, beberapa di antaranya berhenti dituturkan sama sekali.',
      rumus: 'pemetaan bahasa kemdikbudristek',
      chips: ['badan bahasa · 718 bahasa'],
    },
  ];

  const entri = ENTRI[HARI % ENTRI.length]!;
</script>

<aside class="alm" data-rise data-no-stempel aria-label="Almanak sains harian">
  <header class="alm-head mono">ALMANAK · PLAT HARI KE-{HARI % 365} · BERGANTI TIAP TERBIT</header>
  <h3 class="alm-judul fig">{entri.judul}</h3>
  <p class="alm-teks">{entri.teks}</p>
  <p class="alm-rumus mono">HITUNGAN · {entri.rumus.toUpperCase()}</p>
  <div class="alm-chips">
    {#each entri.chips as c (c)}
      <button class="chip"><span class="tick">⊙</span>{c}</button>
    {/each}
  </div>
</aside>

<style>
  /* open margin-note, not a boxed card: a single top rule, generous space */
  .alm {
    border-top: 2px solid var(--line);
    padding: 16px 0 0;
    background: none;
    align-self: start;
  }
  .alm-head { font-size: 9px; letter-spacing: 0.22em; color: var(--accent); padding-bottom: 9px; }
  .alm-judul { font-size: clamp(22px, 2.8vw, 32px); margin: 6px 0 12px; color: var(--ink); line-height: 1.05; }
  .alm-teks { font-size: 15px; line-height: 1.6; }
  .alm-rumus { font-size: 9px; letter-spacing: 0.14em; color: var(--accent2); margin-top: 12px; }
  .alm-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
</style>
