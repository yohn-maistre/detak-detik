<script lang="ts">
  /**
   * Almanak: the atlas's scientific margin — LAMPIRAN V, now a full spread.
   * Four shelves of the sciences (LANGIT · BUMI · HAYAT · ANGKA) all on one
   * page, each turning its own leaf by the calendar (deterministic, law 5):
   * one plate per shelf per edition, computed from published figures or
   * quoted with a source. A computed sky band rides the header (moon phase +
   * equatorial day length, always live). Plates that name an article pull its
   * lead image from id.wikipedia (Lane A: the photo is the article's own; a
   * dark fetch just leaves the plate text standing). The newsroom's almanak
   * desk (scaffold) will add recent-research plates once the LLM lane keys in.
   */
  import { onMount } from 'svelte';
  import ALMANAK from '../../newsroom/data/atlas/almanak.json';

  type Plat = (typeof ALMANAK)[number] & { wikipedia?: string };
  const HARI = Math.floor(Date.now() / 86_400_000);

  // ── live arithmetic for the ANGKA shelf ──
  const sapiCo2JtTon = Math.round((18_600_000 * 99 * 28) / 1e9);
  const isi = (s: string) => s.replace('{SAPI_CO2}', String(sapiCo2JtTon));

  // one plate per shelf, each rotating independently — the spread reads as
  // four almanac columns, not a single card that changes
  const SEKSI = ['LANGIT', 'BUMI', 'HAYAT', 'ANGKA'] as const;
  const rak = SEKSI.map((s) => {
    const list = (ALMANAK as Plat[]).filter((e) => e.seksi === s);
    const i = list.length ? HARI % list.length : 0;
    return { seksi: s, plat: list[i]!, no: i + 1, dari: list.length };
  });

  // ── the computed sky band (always live: solstice-free equator) ──
  const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14); // 2000-01-06 reference new moon
  const SYN = 29.530588853;
  const umurBulan = (((Date.now() - NEW_MOON) / 86_400_000) % SYN + SYN) % SYN;
  const FASE = [
    'bulan baru', 'sabit muda', 'paruh awal', 'cembung muda', 'purnama',
    'cembung tua', 'paruh akhir', 'sabit tua',
  ];
  const fase = FASE[Math.floor(((umurBulan / SYN) * 8 + 0.5) % 8)]!;
  const terangBulan = Math.round((1 - Math.cos((umurBulan / SYN) * 2 * Math.PI)) * 50);

  // ── each shelf's plate may carry an image (its article's lead) ──
  // Action API pageimages at a real width (the REST summary thumb is ~320px,
  // too soft for the plate); redirects=1 so titles like “Maleo” resolve.
  let imgs = $state<Record<string, string>>({});
  onMount(() => {
    for (const r of rak) {
      const judul = r.plat?.wikipedia;
      if (!judul) continue;
      void (async () => {
        try {
          const u = `https://id.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1&prop=pageimages&piprop=thumbnail&pithumbsize=900&titles=${encodeURIComponent(judul)}`;
          const res = await fetch(u, { signal: AbortSignal.timeout(6000) });
          const d = (await res.json()) as { query?: { pages?: Record<string, { thumbnail?: { source?: string } }> } };
          const src = Object.values(d?.query?.pages ?? {})[0]?.thumbnail?.source;
          if (src) imgs = { ...imgs, [r.seksi]: src };
        } catch { /* the plate text stands without the photo */ }
      })();
    }
  });

  const SEKSI_LABEL: Record<string, string> = {
    LANGIT: 'Langit khatulistiwa', BUMI: 'Bumi yang bergerak',
    HAYAT: 'Hayati kepulauan', ANGKA: 'Aritmetika alam',
  };
</script>

<section class="alm" data-rise data-no-stempel aria-label="Almanak sains harian">
  <header class="alm-head">
    <span class="alm-kicker mono">ALMANAK · EMPAT RAK PENGETAHUAN · BERGANTI TIAP TERBIT</span>
    <div class="alm-langit mono" aria-label="Keadaan langit hari ini">
      <span class="alm-moon" aria-hidden="true" style={`--t:${terangBulan}%`}></span>
      <span>☾ {fase.toUpperCase()} · TERANG {terangBulan}% · UMUR {umurBulan.toFixed(1)} HARI</span>
      <span class="alm-sep">·</span>
      <span>SIANG KHATULISTIWA ±12 JAM SEPANJANG TAHUN</span>
    </div>
  </header>

  <div class="alm-rak">
    {#each rak as r (r.seksi)}
      <article class="alm-plat" data-seksi={r.seksi}>
        <div class="alm-plat-head mono">
          <span class="alm-plat-seksi">{r.seksi}</span>
          <span class="alm-plat-nama">{SEKSI_LABEL[r.seksi]}</span>
          <span class="alm-plat-no">PLAT {r.no}/{r.dari}</span>
        </div>
        {#if imgs[r.seksi]}
          <figure class="alm-plat-img">
            <img src={imgs[r.seksi]} alt={r.plat.wikipedia} loading="lazy" />
          </figure>
        {/if}
        <h4 class="alm-plat-judul fig">{r.plat.judul}</h4>
        <p class="alm-plat-teks">{isi(r.plat.teks)}</p>
        <p class="alm-plat-rumus mono">⊙ {r.plat.rumus}</p>
        <div class="alm-plat-chips">
          {#each r.plat.chips as c (c)}<span class="chip" data-no-link>{c}</span>{/each}
        </div>
      </article>
    {/each}
  </div>

  <p class="alm-foot mono">ANGKA DIHITUNG DARI DATA TERBIT · FAKTA DIKUTIP DENGAN SUMBER · GAMBAR DARI ARTIKELNYA DI ID.WIKIPEDIA · REDAKSI TIDAK MENGARANG BILANGAN</p>
</section>

<style>
  .alm { border-top: 2px solid var(--line); padding-top: 18px; background: none; }

  .alm-head { display: grid; gap: 10px; padding-bottom: 20px; border-bottom: 1px solid var(--line-soft); }
  .alm-kicker { font-size: 9px; letter-spacing: 0.22em; color: var(--accent); }
  .alm-langit {
    display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
    font-size: 9.5px; letter-spacing: 0.12em; color: var(--accent2);
  }
  .alm-sep { color: var(--muted); }
  /* a tiny inked moon that fills to the computed illumination */
  .alm-moon {
    width: 13px; height: 13px; border-radius: 50%; flex: none;
    border: 1px solid var(--accent2);
    background: linear-gradient(90deg, var(--accent2) var(--t), transparent var(--t));
  }

  /* the spread: four columns of the sciences, generous gutters */
  .alm-rak {
    display: grid; grid-template-columns: repeat(2, 1fr);
    gap: clamp(24px, 4vw, 48px) clamp(28px, 5vw, 64px);
    margin-top: clamp(24px, 4vw, 40px);
  }
  @media (max-width: 720px) { .alm-rak { grid-template-columns: 1fr; gap: 34px; } }

  .alm-plat { display: grid; gap: 9px; align-content: start; }
  .alm-plat-head {
    display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap;
    border-bottom: 2px solid var(--line); padding-bottom: 7px;
  }
  .alm-plat-seksi { font-size: 9px; letter-spacing: 0.2em; font-weight: 700; }
  .alm-plat[data-seksi="LANGIT"] .alm-plat-seksi { color: var(--accent2); }
  .alm-plat[data-seksi="BUMI"] .alm-plat-seksi { color: var(--accent); }
  .alm-plat[data-seksi="HAYAT"] .alm-plat-seksi { color: var(--accent2); }
  .alm-plat[data-seksi="ANGKA"] .alm-plat-seksi { color: var(--accent); }
  .alm-plat-nama { font-size: 8.5px; letter-spacing: 0.12em; color: var(--muted); font-style: italic; margin-right: auto; }
  .alm-plat-no { font-size: 8px; letter-spacing: 0.14em; color: var(--muted); }

  .alm-plat-img { margin: 4px 0 2px; aspect-ratio: 16 / 9; overflow: hidden; border: 1px solid var(--line); background: #ece1c9; }
  .alm-plat-img img { width: 100%; height: 100%; object-fit: cover; display: block; filter: saturate(0.94); }

  .alm-plat-judul { font-size: clamp(20px, 2.4vw, 27px); color: var(--ink); line-height: 1.08; margin-top: 2px; }
  .alm-plat-teks { font-size: 14px; line-height: 1.64; color: var(--ink); }
  .alm-plat-rumus { font-size: 8.5px; letter-spacing: 0.1em; color: var(--accent2); line-height: 1.6; margin-top: 2px; }
  .alm-plat-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
  .alm-plat-chips .chip { cursor: default; font-size: 8px; padding: 3px 7px; }

  .alm-foot { font-size: 7.5px; letter-spacing: 0.1em; line-height: 1.7; color: var(--muted); border-top: 1px solid var(--line-soft); padding-top: 12px; margin-top: clamp(20px, 3vw, 32px); }
</style>
