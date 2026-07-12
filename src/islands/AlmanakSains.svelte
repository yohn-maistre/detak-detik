<script lang="ts">
  /**
   * Almanak: the atlas's scientific broadsheet — LAMPIRAN V. Not a widget
   * shelf: a real almanac page. The day's shelf LEADS as the hero plate
   * (image, full measure, drop cap); beside it the sky column, computed
   * keylessly (a drawn moon with its true illuminated limb, age, and the
   * equator's unchanging day); beneath, the other three shelves run as a
   * ruled index, each turned to its own leaf of the day. Every plate is
   * computed from published figures or quoted with a source (law:
   * citation-or-silence); plates that name an article pull its lead image.
   * Rotation is calendar-deterministic (law 5) at two levels: which shelf
   * leads, and which plate each shelf shows.
   */
  import { onMount } from 'svelte';
  import ALMANAK from '../../newsroom/data/atlas/almanak.json';
  import JURNAL from '../../newsroom/data/atlas/jurnal.json';

  type Plat = (typeof ALMANAK)[number] & { wikipedia?: string };
  const HARI = Math.floor(Date.now() / 86_400_000);

  // ── live arithmetic for the ANGKA shelf ──
  const sapiCo2JtTon = Math.round((18_600_000 * 99 * 28) / 1e9);
  const isi = (s: string) => s.replace('{SAPI_CO2}', String(sapiCo2JtTon));

  const SEKSI = ['LANGIT', 'BUMI', 'HAYAT', 'ANGKA'] as const;
  const SEKSI_LABEL: Record<string, string> = {
    LANGIT: 'Langit khatulistiwa', BUMI: 'Bumi yang bergerak',
    HAYAT: 'Hayati kepulauan', ANGKA: 'Aritmetika alam',
  };
  const rak = SEKSI.map((s) => {
    const list = (ALMANAK as Plat[]).filter((e) => e.seksi === s);
    const i = list.length ? HARI % list.length : 0;
    return { seksi: s, plat: list[i]!, no: i + 1, dari: list.length };
  });
  // the day's leading shelf; the others follow as the ruled index
  const utamaIdx = HARI % SEKSI.length;
  const utama = rak[utamaIdx]!;
  const lainnya = rak.filter((_, i) => i !== utamaIdx);

  // ── the computed sky (one owner: src/lib/langit.ts; RimbaHidup hangs
  //    the SAME moon over its flock — the two can never disagree) ──
  import { SYN, umurBulan as hitungUmur, faseP, namaFase, terangBulan, jalurTerang } from '../lib/langit';
  const umurBulan = hitungUmur();
  const p = faseP(umurBulan);
  const fase = namaFase(p);
  const terang = terangBulan(p);
  const R = 26, C = 30;
  const jalur = jalurTerang(p, R, C);

  // ── DARI JURNAL, two tiers. Preferred: the newsroom's STASH — the model
  //    judged the month's Crossref batch for TRUE Indonesia relevance and
  //    left one plain line per pick saying why (Lane C, gated, committed to
  //    the repo and baked at deploy). Fallback when the stash is empty: the
  //    raw keyword shelf, live from Crossref (keyless, open CORS). Titles
  //    print VERBATIM in their source language (Lane A); every row links to
  //    its DOI. A dark fetch prints as absence, never as silence. ──
  type Pilihan = { judul: string; wadah: string; tanggal: string; doi: string; alasan: string; kategori?: string };
  const stash: Pilihan[] = ((JURNAL as { pilihan?: Pilihan[] }).pilihan ?? []).slice(0, 8);
  const stashSejak = (JURNAL as { diperbarui?: string | null }).diperbarui?.slice(0, 10) ?? '';
  // shelves inside the shelf: the model names the categories; we only group
  const stashRak: { kategori: string; rows: Pilihan[] }[] = (() => {
    const m = new Map<string, Pilihan[]>();
    for (const p of stash) {
      const k = p.kategori || 'LAIN-LAIN';
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(p);
    }
    return [...m.entries()].map(([kategori, rows]) => ({ kategori, rows }));
  })();
  type Karya = { judul: string; wadah: string; tanggal: string; doi: string };
  let jurnal = $state<Karya[]>([]);
  let jurnalGelap = $state(false);
  const RELEVAN = /indonesi|nusantara|jawa|java|sumatra|sumatera|borneo|kalimantan|sulawesi|papua|maluku|bali|jakarta/i;

  async function ambilJurnal() {
    try {
      const dari = new Date(Date.now() - 90 * 86_400_000).toISOString().slice(0, 10);
      const u = `https://api.crossref.org/works?query.bibliographic=indonesia&filter=type:journal-article,from-pub-date:${dari}&sort=published&order=desc&rows=20&select=title,container-title,DOI,issued&mailto=josejr2498@gmail.com`;
      const res = await fetch(u, { signal: AbortSignal.timeout(8000) });
      const d = await res.json();
      const items = (d?.message?.items ?? []) as {
        title?: string[]; 'container-title'?: string[]; DOI?: string;
        issued?: { 'date-parts'?: number[][] };
      }[];
      const thnMaks = new Date().getUTCFullYear() + 1;
      const semua = items
        .map((it) => {
          const dp = it.issued?.['date-parts']?.[0] ?? [];
          return {
            judul: it.title?.[0] ?? '',
            wadah: it['container-title']?.[0] ?? '',
            tanggal: dp.length ? dp.join('-') : '',
            thn: dp[0] ?? 0,
            doi: it.DOI ?? '',
          };
        })
        // publishers sometimes file garbage future dates (2150…) which a
        // published-desc sort floats to the top — those rows are metadata
        // noise, not scholarship; they don't print
        .filter((k) => k.judul && k.doi && k.thn <= thnMaks);
      const tersaring = semua.filter((k) => RELEVAN.test(`${k.judul} ${k.wadah}`));
      jurnal = (tersaring.length >= 2 ? tersaring : semua).slice(0, 5);
      jurnalGelap = jurnal.length === 0;
    } catch {
      jurnalGelap = true; // absence is content: the shelf says it went dark
    }
  }

  // ── plate images: the named article's lead, at a real width ──
  let imgs = $state<Record<string, string>>({});
  onMount(() => {
    if (!stash.length) void ambilJurnal(); // the judged stash outranks the raw query
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
</script>

<section class="alm" data-rise data-no-stempel aria-label="Almanak sains harian">
  <header class="alm-head mono">
    <span class="alm-kicker">ALMANAK · EMPAT RAK PENGETAHUAN · BERGANTI TIAP TERBIT</span>
    <span class="alm-edisi">RAK UTAMA HARI INI · {utama.seksi}</span>
  </header>

  <!-- ── the broadsheet: hero plate + the sky column ── -->
  <div class="alm-utama">
    <article class="alm-hero" data-seksi={utama.seksi}>
      <div class="alm-hero-head mono">
        <span class="alm-seksi-tag">{utama.seksi}</span>
        <span class="alm-seksi-nama">{SEKSI_LABEL[utama.seksi]}</span>
        <span class="alm-plat-no">PLAT {utama.no}/{utama.dari}</span>
      </div>
      {#if imgs[utama.seksi]}
        <figure class="alm-hero-img">
          <img src={imgs[utama.seksi]} alt={utama.plat.wikipedia} loading="lazy" />
          <figcaption class="mono">GAMBAR DARI ARTIKELNYA DI ID.WIKIPEDIA · {utama.plat.wikipedia?.toUpperCase()}</figcaption>
        </figure>
      {/if}
      <h3 class="alm-hero-judul display">{utama.plat.judul}</h3>
      <p class="alm-hero-teks" class:tanpa-img={!imgs[utama.seksi]}>{isi(utama.plat.teks)}</p>
      <p class="alm-rumus mono">⊙ {utama.plat.rumus}</p>
      <div class="alm-chips">
        {#each utama.plat.chips as c (c)}<span class="chip" data-no-link>{c}</span>{/each}
      </div>
    </article>

    <aside class="alm-langit" aria-label="Keadaan langit, dihitung">
      <span class="alm-langit-k mono">LANGIT MALAM INI · DIHITUNG, BUKAN DIKUTIP</span>
      <div class="alm-bulan">
        <svg viewBox="0 0 60 60" width="92" height="92" role="img" aria-label={`Fase bulan: ${fase}, terang ${terang} persen`}>
          <circle cx={C} cy={C} r={R} class="alm-bulan-gelap" />
          <path d={jalur} class="alm-bulan-terang" />
          <circle cx={C} cy={C} r={R} class="alm-bulan-rim" />
        </svg>
        <div class="alm-bulan-teks">
          <b class="alm-fase fig">{fase}</b>
          <span class="mono">TERANG {terang}% · UMUR {umurBulan.toFixed(1)} HARI</span>
          <span class="mono">SIKLUS SINODIS 29,53 HARI</span>
        </div>
      </div>
      <dl class="alm-langit-baris mono">
        <div><dt>SIANG KHATULISTIWA</dt><dd>±12 JAM, SEPANJANG TAHUN</dd></div>
        <div><dt>PURNAMA BERIKUT</dt><dd>±{Math.ceil((p < 0.5 ? 0.5 - p : 1.5 - p) * SYN)} HARI LAGI</dd></div>
        <div><dt>BULAN BARU BERIKUT</dt><dd>±{Math.ceil((1 - p) * SYN)} HARI LAGI</dd></div>
      </dl>
      <span class="alm-langit-cat mono">HITUNGAN FASE DARI BULAN BARU RUJUKAN 6 JAN 2000 · MEKANIKA FALAK</span>
    </aside>
  </div>

  <!-- ── the other shelves, fully unfolded: each a broadsheet band of its
       own, image and writing at full measure, sides alternating ── -->
  <div class="alm-rak">
    {#each lainnya as r, i (r.seksi)}
      <article class="alm-band" data-seksi={r.seksi} class:balik={i % 2 === 1}>
        <header class="alm-band-head mono">
          <span class="alm-seksi-tag">{r.seksi}</span>
          <span class="alm-seksi-nama">{SEKSI_LABEL[r.seksi]}</span>
          <span class="alm-plat-no">PLAT {r.no}/{r.dari}</span>
        </header>
        <div class="alm-band-body">
          <div class="alm-band-teks-w">
            <h4 class="alm-band-judul display">{r.plat.judul}</h4>
            <p class="alm-band-teks" class:tanpa-img={!imgs[r.seksi]}>{isi(r.plat.teks)}</p>
            <p class="alm-rumus mono">⊙ {r.plat.rumus}</p>
            <div class="alm-chips">
              {#each r.plat.chips as c (c)}<span class="chip" data-no-link>{c}</span>{/each}
            </div>
          </div>
          {#if imgs[r.seksi]}
            <figure class="alm-band-img">
              <img src={imgs[r.seksi]} alt={r.plat.wikipedia} loading="lazy" />
              <figcaption class="mono">GAMBAR DARI ARTIKELNYA DI ID.WIKIPEDIA · {r.plat.wikipedia?.toUpperCase()}</figcaption>
            </figure>
          {/if}
        </div>
      </article>
    {/each}
  </div>

  <!-- ── DARI JURNAL: what the presses of science printed — the newsroom's
       judged stash when it exists, the raw keyword shelf otherwise ── -->
  <div class="alm-jurnal">
    <div class="alm-jurnal-head mono">
      {#if stash.length}
        <span class="alm-jurnal-k">DARI JURNAL · DINILAI MESIN: BENAR-BENAR TENTANG INDONESIA</span>
        <span class="alm-jurnal-s">⊙ crossref · dipilih lane C tiap terbit{stashSejak ? ` · diperbarui ${stashSejak}` : ''}</span>
      {:else}
        <span class="alm-jurnal-k">DARI JURNAL · TERBIT TERBARU MENYEBUT INDONESIA</span>
        <span class="alm-jurnal-s">⊙ crossref · api langsung · 90 hari terakhir</span>
      {/if}
    </div>
    {#if stash.length}
      {#each stashRak as rakK (rakK.kategori)}
        <div class="alm-jurnal-rak">
          <span class="alm-jurnal-rak-k mono">{rakK.kategori} <i>· rak dinamai mesin</i></span>
          <ol class="alm-jurnal-rows">
            {#each rakK.rows as k (k.doi)}
              <li>
                <a class="alm-jurnal-row" href={`https://doi.org/${k.doi}`} target="_blank" rel="noopener">
                  <span class="alm-jurnal-tgl mono">{k.tanggal || '—'}</span>
                  <span class="alm-jurnal-isi">
                    <b class="alm-jurnal-judul fig">{k.judul}</b>
                    {#if k.wadah}<i class="alm-jurnal-wadah">{k.wadah}</i>{/if}
                    {#if k.alasan}<span class="alm-jurnal-alasan">{k.alasan} <i class="mono">— penilai mesin</i></span>{/if}
                  </span>
                  <span class="alm-jurnal-panah" aria-hidden="true">↗</span>
                </a>
              </li>
            {/each}
          </ol>
        </div>
      {/each}
      <p class="alm-jurnal-cat mono">JUDUL APA ADANYA DARI PENERBITNYA · CATATAN &amp; NAMA RAK OLEH MESIN, DIPERIKSA ATURAN · TIAP BARIS MEMBUKA DOI-NYA</p>
    {:else if jurnal.length}
      <ol class="alm-jurnal-rows">
        {#each jurnal as k (k.doi)}
          <li>
            <a class="alm-jurnal-row" href={`https://doi.org/${k.doi}`} target="_blank" rel="noopener">
              <span class="alm-jurnal-tgl mono">{k.tanggal || '—'}</span>
              <span class="alm-jurnal-isi">
                <b class="alm-jurnal-judul fig">{k.judul}</b>
                {#if k.wadah}<i class="alm-jurnal-wadah">{k.wadah}</i>{/if}
              </span>
              <span class="alm-jurnal-panah" aria-hidden="true">↗</span>
            </a>
          </li>
        {/each}
      </ol>
      <p class="alm-jurnal-cat mono">JUDUL APA ADANYA DARI PENERBITNYA, BAHASA SUMBER · TIAP BARIS MEMBUKA DOI-NYA · KUERI TETAP: INDONESIA</p>
    {:else if jurnalGelap}
      <p class="alm-jurnal-cat mono">LAJUR JURNAL GELAP DARI SISI INI SAAT INI — SUMBERNYA TETAP API.CROSSREF.ORG; KETIADAAN DICETAK, BUKAN DISEMBUNYIKAN.</p>
    {:else}
      <p class="alm-jurnal-cat mono">MEMANGGIL RAK JURNAL…</p>
    {/if}
  </div>

  <p class="alm-foot mono">ANGKA DIHITUNG DARI DATA TERBIT · FAKTA DIKUTIP DENGAN SUMBER · GAMBAR DARI ARTIKELNYA DI ID.WIKIPEDIA · JUDUL RISET LANGSUNG DARI CROSSREF · REDAKSI TIDAK MENGARANG BILANGAN</p>
</section>

<style>
  .alm { border-top: 2px solid var(--line); padding-top: 16px; }
  .alm-head { display: flex; justify-content: space-between; gap: 10px 20px; flex-wrap: wrap; padding-bottom: 18px; border-bottom: 1px solid var(--line-soft); }
  .alm-kicker { font-size: 9px; letter-spacing: 0.22em; color: var(--accent); }
  .alm-edisi { font-size: 9px; letter-spacing: 0.18em; color: var(--muted); }

  /* ── the broadsheet spread ── */
  .alm-utama {
    display: grid; grid-template-columns: 1.35fr 0.65fr;
    gap: clamp(26px, 5vw, 64px);
    padding: clamp(24px, 4vw, 40px) 0 clamp(24px, 4vw, 40px);
    align-items: start;
  }
  @media (max-width: 820px) { .alm-utama { grid-template-columns: 1fr; } }

  .alm-hero { display: grid; gap: 12px; }
  .alm-hero-head { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
  .alm-seksi-tag { font-size: 9.5px; letter-spacing: 0.22em; font-weight: 700; color: var(--accent); }
  [data-seksi="LANGIT"] .alm-seksi-tag, [data-seksi="HAYAT"] .alm-seksi-tag { color: var(--accent2); }
  .alm-seksi-nama { font-size: 9px; letter-spacing: 0.12em; color: var(--muted); font-style: italic; margin-right: auto; }
  .alm-plat-no { font-size: 8px; letter-spacing: 0.14em; color: var(--muted); }
  .alm-hero-img { margin: 2px 0 0; display: grid; gap: 6px; }
  .alm-hero-img img { width: 100%; aspect-ratio: 21 / 9; object-fit: cover; display: block; border: 1px solid var(--line); background: #ece1c9; filter: saturate(0.94); }
  .alm-hero-img figcaption { font-size: 7.5px; letter-spacing: 0.14em; color: var(--muted); }
  .alm-hero-judul { font-family: 'Fraunces Variable', serif; font-weight: 340; font-size: clamp(28px, 4.4vw, 46px); line-height: 1.02; color: var(--ink); }
  .alm-hero-teks { font-size: clamp(14.5px, 1.7vw, 16.5px); line-height: 1.66; color: var(--ink); max-width: 64ch; }
  /* when the plate runs unillustrated, the writing opens with a drop cap */
  .alm-hero-teks.tanpa-img::first-letter {
    font-family: 'Fraunces Variable', serif; font-weight: 340;
    font-size: 3em; line-height: 0.8; float: left;
    padding: 3px 8px 0 0; color: var(--accent);
  }
  .alm-rumus { font-size: 8.5px; letter-spacing: 0.1em; color: var(--accent2); line-height: 1.6; }
  .alm-chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .alm-chips .chip { cursor: default; font-size: 8px; padding: 3px 7px; }

  /* ── the sky column ── */
  .alm-langit { display: grid; gap: 14px; align-content: start; border-left: 1px solid var(--line-soft); padding-left: clamp(18px, 3vw, 32px); }
  @media (max-width: 820px) { .alm-langit { border-left: none; padding-left: 0; border-top: 1px solid var(--line-soft); padding-top: 18px; } }
  .alm-langit-k { font-size: 8.5px; letter-spacing: 0.2em; color: var(--accent2); }
  .alm-bulan { display: flex; gap: 16px; align-items: center; }
  .alm-bulan-gelap { fill: color-mix(in oklab, var(--ink) 14%, transparent); }
  .alm-bulan-terang { fill: var(--ink); }
  .alm-bulan-rim { fill: none; stroke: var(--ink); stroke-width: 0.8; opacity: 0.55; }
  .alm-bulan-teks { display: grid; gap: 4px; }
  .alm-fase { font-size: clamp(19px, 2.2vw, 24px); color: var(--ink); text-transform: capitalize; }
  .alm-bulan-teks .mono { font-size: 8px; letter-spacing: 0.14em; color: var(--muted); }
  .alm-langit-baris { display: grid; gap: 8px; border-top: 1px solid var(--line-soft); padding-top: 12px; margin: 0; }
  .alm-langit-baris div { display: flex; justify-content: space-between; gap: 10px; align-items: baseline; }
  .alm-langit-baris dt { font-size: 7.5px; letter-spacing: 0.14em; color: var(--muted); }
  .alm-langit-baris dd { font-size: 8.5px; letter-spacing: 0.08em; color: var(--ink); margin: 0; text-align: right; }
  .alm-langit-cat { font-size: 7px; letter-spacing: 0.1em; line-height: 1.7; color: var(--muted); opacity: 0.85; }

  /* ── the other shelves, unfolded into full broadsheet bands ── */
  .alm-rak { display: grid; border-top: 2px solid var(--line); }
  .alm-band {
    display: grid; gap: 14px;
    padding: clamp(26px, 4vw, 44px) 0;
    border-bottom: 1px solid var(--line-soft);
  }
  .alm-band:last-child { border-bottom: none; }
  .alm-band-head { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
  .alm-band-body { display: grid; grid-template-columns: 1.25fr 0.75fr; gap: clamp(20px, 4vw, 56px); align-items: start; }
  .alm-band.balik .alm-band-body { grid-template-columns: 0.75fr 1.25fr; }
  .alm-band.balik .alm-band-teks-w { order: 2; }
  @media (max-width: 760px) {
    .alm-band-body, .alm-band.balik .alm-band-body { grid-template-columns: 1fr; }
    .alm-band.balik .alm-band-teks-w { order: 0; }
  }
  .alm-band-teks-w { display: grid; gap: 10px; min-width: 0; align-content: start; }
  .alm-band-judul { font-family: 'Fraunces Variable', serif; font-weight: 340; font-size: clamp(24px, 3.4vw, 38px); line-height: 1.02; color: var(--ink); max-width: 24ch; }
  .alm-band-teks { font-size: clamp(14px, 1.6vw, 16px); line-height: 1.66; color: var(--ink); max-width: 62ch; }
  .alm-band-teks.tanpa-img::first-letter {
    font-family: 'Fraunces Variable', serif; font-weight: 340;
    font-size: 3em; line-height: 0.8; float: left;
    padding: 3px 8px 0 0; color: var(--accent);
  }
  .alm-band-img { margin: 0; display: grid; gap: 6px; }
  .alm-band-img img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; display: block; border: 1px solid var(--line); background: #ece1c9; filter: saturate(0.94); }
  .alm-band-img figcaption { font-size: 7.5px; letter-spacing: 0.14em; color: var(--muted); }

  /* ── DARI JURNAL: the live research shelf ── */
  .alm-jurnal { border-top: 2px solid var(--line); margin-top: clamp(20px, 3vw, 32px); padding-top: 14px; display: grid; gap: 10px; }
  .alm-jurnal-head { display: flex; justify-content: space-between; gap: 10px 18px; flex-wrap: wrap; align-items: baseline; }
  .alm-jurnal-k { font-size: 9px; letter-spacing: 0.2em; color: var(--accent); }
  .alm-jurnal-s { font-size: 8px; letter-spacing: 0.12em; color: var(--muted); }
  .alm-jurnal-rows { list-style: none; margin: 0; padding: 0; display: grid; }
  .alm-jurnal-row {
    display: grid; grid-template-columns: 84px 1fr auto; gap: 14px; align-items: baseline;
    padding: 9px 0; border-bottom: 1px solid var(--line-soft);
    text-decoration: none; color: var(--ink);
    transition: background 0.15s, padding-left 0.15s;
  }
  .alm-jurnal-row:hover { background: color-mix(in oklab, var(--accent) 6%, transparent); padding-left: 6px; }
  @media (max-width: 620px) { .alm-jurnal-row { grid-template-columns: 1fr auto; } .alm-jurnal-tgl { grid-column: 1 / -1; } }
  .alm-jurnal-tgl { font-size: 8.5px; letter-spacing: 0.1em; color: var(--accent2); }
  .alm-jurnal-isi { display: grid; gap: 2px; min-width: 0; }
  .alm-jurnal-judul { font-size: 14.5px; line-height: 1.35; color: var(--ink); font-weight: 500; }
  .alm-jurnal-wadah { font-size: 10.5px; color: var(--muted); font-style: italic; }
  /* the machine's writeup: quiet, clearly credited */
  .alm-jurnal-alasan { font-size: 12px; line-height: 1.55; color: var(--ink); opacity: 0.88; margin-top: 3px; max-width: 72ch; }
  .alm-jurnal-alasan .mono { font-size: 7.5px; letter-spacing: 0.1em; color: var(--muted); font-style: normal; }
  /* shelves inside the shelf: model-named category rows */
  .alm-jurnal-rak { display: grid; gap: 4px; margin-top: 6px; }
  .alm-jurnal-rak-k { font-size: 9.5px; letter-spacing: 0.18em; color: var(--accent2); border-bottom: 1px solid var(--line-soft); padding-bottom: 5px; }
  .alm-jurnal-rak-k i { font-size: 7.5px; letter-spacing: 0.1em; color: var(--muted); font-style: normal; }
  .alm-jurnal-panah { color: var(--muted); font-size: 12px; }
  .alm-jurnal-row:hover .alm-jurnal-panah { color: var(--accent); }
  .alm-jurnal-cat { font-size: 7.5px; letter-spacing: 0.1em; line-height: 1.7; color: var(--muted); }

  .alm-foot { font-size: 7.5px; letter-spacing: 0.1em; line-height: 1.7; color: var(--muted); border-top: 1px solid var(--line-soft); padding-top: 12px; margin-top: 4px; }
</style>
