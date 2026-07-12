<script lang="ts">
  /**
   * Ingatan: HARI INI DALAM SEJARAH — the archive's dated feature, the
   * mirror of the painting above it (text left, image right; the gallery
   * runs image left). Reads the curated registry (newsroom/data/atlas/
   * ingatan.json, every event sourced to its article), surfaces the NEAREST
   * anniversary by circular day distance — deterministic, the same plate
   * for every reader (law 5) — then lets the event's own encyclopedia
   * article deepen it live: the lead extract may only LENGTHEN the reviewed
   * line, and the article's lead image fills the plate (Lane A: verbatim,
   * linked; a dark fetch leaves the reviewed line + engraved plate standing).
   * Below the feature, the next leaves of the calendar: the nearest other
   * anniversaries as a ruled ledger, so the plate reads as an almanac page,
   * not a lone number.
   */
  import { onMount } from 'svelte';
  import INGATAN from '../../newsroom/data/atlas/ingatan.json';

  const kini = new Date();
  const doy = (m: number, d: number) => Math.floor((Date.UTC(2001, m - 1, d) - Date.UTC(2001, 0, 1)) / 86400000);
  const hariIni = doy(kini.getMonth() + 1, kini.getDate());

  const dinilai = INGATAN.map((e) => {
    const [m, d] = e.tanggal.split('-').map(Number);
    const beda = doy(m!, d!) - hariIni;
    // circular distance across the year boundary, signed (+ = upcoming)
    const s = beda > 182 ? beda - 365 : beda < -182 ? beda + 365 : beda;
    return { ...e, s, jarak: Math.abs(s) };
  }).sort((a, b) => a.jarak - b.jarak || b.tahun - a.tahun);
  const p = dinilai[0]!;
  // the next leaves: nearest other anniversaries, calendar-ordered
  const berikut = dinilai.slice(1, 4);

  const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const tglStr = (t: string, thn: number) => {
    const [m, d] = t.split('-').map(Number);
    return `${d} ${BULAN[m! - 1]} ${thn}`;
  };
  const kicker = p.jarak === 0 ? 'HARI INI DALAM SEJARAH'
    : p.s > 0 ? `INGATAN TERDEKAT · ${p.jarak} HARI LAGI`
    : `INGATAN TERDEKAT · ${p.jarak} HARI LALU`;
  const selisihTahun = kini.getFullYear() - p.tahun;

  // the article behind the event: title straight from the source URL
  const judulArtikel = decodeURIComponent(p.sumber.split('/wiki/')[1] ?? '').replace(/_/g, ' ');

  let extract = $state('');
  let img = $state('');
  let live = $state(false);

  onMount(() => {
    (async () => {
      try {
        const u = `https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(judulArtikel)}`;
        const res = await fetch(u, { signal: AbortSignal.timeout(7000) });
        const d = await res.json();
        // the live lead may only ADD to the reviewed line, never replace it
        if (d?.extract && d.extract.length > p.teks.length) {
          extract = d.extract.length > 1100 ? d.extract.slice(0, 1100).replace(/\s+\S*$/, '') + '…' : d.extract;
        }
        const src = d?.originalimage?.source ?? d?.thumbnail?.source;
        if (src) img = src;
        live = !!(extract || img);
      } catch { /* the reviewed line + engraved plate stand */ }
    })();
  });
</script>

<figure class="ih" data-rise data-no-stempel>
  <div class="ih-grid">
    <div class="ih-teks-wrap">
      <span class="ih-kicker mono">{kicker}</span>
      <p class="ih-tahun display num">{p.tahun}</p>
      <p class="ih-tanggal mono">{tglStr(p.tanggal, p.tahun)} · {selisihTahun} TAHUN SILAM</p>
      <p class="ih-teks fig">{p.teks}</p>
      {#if extract}
        <p class="ih-lanjut">{extract}</p>
      {/if}
      <a class="chip" href={p.sumber} target="_blank" rel="noopener"><span class="tick">⊙</span>id.wikipedia · baca kisahnya{live ? ' · langsung' : ''}</a>
    </div>

    <div class="ih-sisi">
      <div class="ih-img">
        {#if img}
          <img src={img} alt={judulArtikel} loading="lazy" onerror={() => (img = '')} />
        {:else}
          <div class="ih-kosong"><span class="mono">PLAT · {judulArtikel.toUpperCase()}</span></div>
        {/if}
      </div>
      <span class="ih-img-cap mono">GAMBAR DARI ARTIKEL SUMBERNYA · ID.WIKIPEDIA{img ? '' : ' — TAK TERSEDIA, PLAT KOSONG DICETAK APA ADANYA'}</span>
    </div>
  </div>

  {#if berikut.length}
    <div class="ih-berikut">
      <span class="ih-berikut-k mono">LEMBAR BERIKUT DI KALENDER INGATAN</span>
      <ol class="ih-rows">
        {#each berikut as b (b.id)}
          <li>
            <a class="ih-row" href={b.sumber} target="_blank" rel="noopener">
              <span class="ih-row-tgl mono">{tglStr(b.tanggal, b.tahun)}</span>
              <span class="ih-row-teks">{b.teks}</span>
              <span class="ih-row-panah" aria-hidden="true">↗</span>
            </a>
          </li>
        {/each}
      </ol>
    </div>
  {/if}
  <figcaption class="ih-cap mono">PLAT · INGATAN, DIPILIH KALENDER — SAMA UNTUK SEMUA PEMBACA · TIAP PERISTIWA TERTAUT KE ARTIKELNYA</figcaption>
</figure>

<style>
  .ih { margin: clamp(44px, 7vw, 84px) 0 0; display: grid; gap: 18px; border-top: 1px solid var(--line); padding-top: clamp(20px, 3vw, 32px); }
  /* the mirror of the gallery: writing left, plate right */
  .ih-grid { display: grid; grid-template-columns: 0.85fr 1.15fr; gap: clamp(24px, 5vw, 56px); align-items: start; }
  @media (max-width: 760px) { .ih-grid { grid-template-columns: 1fr; } }
  .ih-kicker { font-size: 9px; letter-spacing: 0.2em; color: var(--accent); }
  .ih-teks-wrap { display: grid; gap: 10px; justify-items: start; align-content: start; }
  .ih-tahun { font-family: 'Fraunces Variable', serif; font-weight: 300; font-size: clamp(64px, 10vw, 128px); line-height: 0.85; color: var(--ink); letter-spacing: -0.02em; }
  .ih-tanggal { font-size: 9px; letter-spacing: 0.16em; color: var(--muted); }
  .ih-teks { font-size: clamp(16px, 2vw, 20px); line-height: 1.5; max-width: 52ch; }
  .ih-lanjut { font-size: 14px; line-height: 1.62; color: var(--ink); max-width: 56ch; }
  .ih-lanjut::first-letter {
    font-family: 'Fraunces Variable', serif; font-weight: 340;
    font-size: 2.9em; line-height: 0.8; float: left;
    padding: 3px 7px 0 0; color: var(--accent);
  }
  .chip { text-decoration: none; }

  .ih-sisi { display: grid; gap: 8px; }
  .ih-img { aspect-ratio: 4 / 3; overflow: hidden; border: 1px solid var(--line); background: #ece1c9; }
  .ih-img img { width: 100%; height: 100%; object-fit: cover; display: block; filter: saturate(0.9) sepia(0.08); }
  .ih-kosong {
    width: 100%; height: 100%; display: grid; place-items: center; text-align: center; padding: 12px;
    background: repeating-linear-gradient(45deg, color-mix(in oklab, var(--line) 30%, transparent) 0 1px, transparent 1px 7px);
  }
  .ih-kosong span { font-size: 9px; letter-spacing: 0.2em; color: var(--muted); }
  .ih-img-cap { font-size: 8px; letter-spacing: 0.14em; color: var(--muted); line-height: 1.6; }

  /* the next leaves: a ruled calendar ledger */
  .ih-berikut { display: grid; gap: 8px; border-top: 1px solid var(--line-soft); padding-top: 14px; }
  .ih-berikut-k { font-size: 8.5px; letter-spacing: 0.18em; color: var(--muted); }
  .ih-rows { list-style: none; margin: 0; padding: 0; display: grid; }
  .ih-row {
    display: grid; grid-template-columns: 150px 1fr auto; gap: 14px; align-items: baseline;
    padding: 8px 0; border-bottom: 1px solid var(--line-soft);
    text-decoration: none; color: var(--ink);
    transition: background 0.15s, padding-left 0.15s;
  }
  .ih-row:hover { background: color-mix(in oklab, var(--accent) 6%, transparent); padding-left: 6px; }
  @media (max-width: 620px) { .ih-row { grid-template-columns: 1fr auto; } .ih-row-tgl { grid-column: 1 / -1; } }
  .ih-row-tgl { font-size: 9px; letter-spacing: 0.12em; color: var(--accent2); }
  .ih-row-teks { font-size: 13px; line-height: 1.5; color: var(--ink); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .ih-row-panah { color: var(--muted); font-size: 12px; }
  .ih-row:hover .ih-row-panah { color: var(--accent); }
  .ih-cap { font-size: 8.5px; letter-spacing: 0.22em; color: var(--muted); text-align: center; margin-top: 4px; }
</style>
