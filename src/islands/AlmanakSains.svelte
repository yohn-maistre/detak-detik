<script lang="ts">
  /**
   * Almanak: the atlas's scientific margin — LAMPIRAN V. A sectioned register
   * of the sciences (LANGIT · BUMI · HAYAT · ANGKA): one plate a day, chosen
   * by the calendar (deterministic, law 5), computed from published figures
   * or quoted with a source. The ANGKA plates carry live arithmetic; the rest
   * are sourced facts. A slim computed sky line always rides the header. The
   * newsroom's almanak desk (scaffold) will add recent-research plates once
   * the LLM lane has keys.
   */
  import ALMANAK from '../../newsroom/data/atlas/almanak.json';

  const HARI = Math.floor(Date.now() / 86_400_000);

  // ── live arithmetic for the ANGKA plates ──
  const sapiCo2JtTon = Math.round((18_600_000 * 99 * 28) / 1e9);
  const KOTA_METEOR = ['Jakarta', 'Surabaya', 'Medan', 'Makassar', 'Jayapura', 'Pontianak'];
  const kota = KOTA_METEOR[HARI % KOTA_METEOR.length]!;
  const isi = (s: string) =>
    s.replace('{SAPI_CO2}', String(sapiCo2JtTon)).replace('{KOTA}', kota);

  // the day's plate + the section it belongs to; a per-section index so the
  // register reads as four rotating shelves, not one flat list
  const SEKSI = ['LANGIT', 'BUMI', 'HAYAT', 'ANGKA'] as const;
  const plate = ALMANAK[HARI % ALMANAK.length]!;
  const seksiKini = plate.seksi;
  const dalamSeksi = ALMANAK.filter((e) => e.seksi === seksiKini);
  const noSeksi = dalamSeksi.findIndex((e) => e.judul === plate.judul) + 1;

  // ── the computed sky line (always live: solstice-free equator) ──
  // day length at the equator barely moves; moon age from a known new moon
  const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14); // 2000-01-06 reference new moon
  const SYN = 29.530588853;
  const umurBulan = (((Date.now() - NEW_MOON) / 86_400_000) % SYN + SYN) % SYN;
  const FASE = [
    'bulan baru', 'sabit muda', 'paruh awal', 'cembung muda', 'purnama',
    'cembung tua', 'paruh akhir', 'sabit tua',
  ];
  const fase = FASE[Math.floor(((umurBulan / SYN) * 8 + 0.5) % 8)]!;
</script>

<aside class="alm" data-rise data-no-stempel aria-label="Almanak sains harian">
  <header class="alm-head mono">
    <span>ALMANAK · {seksiKini} · PLAT {noSeksi}/{dalamSeksi.length} · BERGANTI TIAP TERBIT</span>
    <span class="alm-langit">☾ {fase.toUpperCase()} · UMUR {umurBulan.toFixed(1)} HARI · SIANG KHATULISTIWA ±12 JAM</span>
  </header>
  <h3 class="alm-judul fig">{plate.judul}</h3>
  <p class="alm-teks">{isi(plate.teks)}</p>
  <p class="alm-rumus mono">HITUNGAN · {plate.rumus.toUpperCase()}</p>
  <div class="alm-chips">
    {#each plate.chips as c (c)}
      <button class="chip"><span class="tick">⊙</span>{c}</button>
    {/each}
  </div>
  <nav class="alm-seksi mono" aria-label="Bagian almanak">
    {#each SEKSI as s (s)}
      <span class="alm-seksi-tab" class:on={s === seksiKini}>{s}</span>
    {/each}
  </nav>
</aside>

<style>
  /* open margin-note, not a boxed card: a single top rule, generous space */
  .alm {
    border-top: 2px solid var(--line);
    padding: 16px 0 0;
    background: none;
    align-self: start;
  }
  .alm-head { display: flex; justify-content: space-between; gap: 12px 20px; flex-wrap: wrap; font-size: 9px; letter-spacing: 0.22em; color: var(--accent); padding-bottom: 9px; }
  .alm-langit { color: var(--accent2); letter-spacing: 0.14em; }
  .alm-judul { font-size: clamp(22px, 2.8vw, 32px); margin: 6px 0 12px; color: var(--ink); line-height: 1.05; }
  .alm-teks { font-size: 15px; line-height: 1.6; max-width: 62ch; }
  .alm-rumus { font-size: 9px; letter-spacing: 0.14em; color: var(--accent2); margin-top: 12px; }
  .alm-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
  .alm-seksi { display: flex; gap: 14px; margin-top: 16px; border-top: 1px solid var(--line-soft); padding-top: 10px; }
  .alm-seksi-tab { font-size: 8px; letter-spacing: 0.2em; color: var(--muted); }
  .alm-seksi-tab.on { color: var(--ink); border-bottom: 2px solid var(--accent); padding-bottom: 2px; }
</style>
