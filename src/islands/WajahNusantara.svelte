<script lang="ts">
  /** Wajah Nusantara v2 — the magazine FEATURE (§13.14 MANUSIA pipeline).
      One of the archipelago's peoples per half-day, drawn from the reviewed
      registry (newsroom/data/atlas/manusia.json: verbatim Wikipedia lead,
      VERIFIED image + license, heritage items tied to the group). The live
      REST fetch may EXTEND the prose; the registry is the floor — the frame
      is never empty, the text never less than the reviewed extract. Rotation
      is calendar-deterministic (law 5), anchored so the inaugural plate is
      Suku Mee. */
  import { onMount } from 'svelte';
  import { drawEngraving, ENGRAVE_ATLAS } from '../lib/engrave';
  import SukuLokasi from './SukuLokasi.svelte';
  import { manusiaHari as p } from '../lib/atlas-hari';

  let extract = $state(p.ringkas);
  let live = $state(false);
  let img = $state(p.gambar?.url ?? '');

  /** the full feature body: whole sections of the id.wikipedia article,
      verbatim (Lane A by construction) — the reviewed extract stays the
      floor and the opening paragraph; sections render beneath it. When the
      newsroom's manusia desk ships a gated `tulisan`, it takes this slot. */
  type Bagian = { judul: string | null; paras: string[] };
  let bagian = $state<Bagian[]>([]);
  const BATAS_TOTAL = 4200; // chars across all fetched sections
  const BAGIAN_MAKS = 3;
  const LEWATI = /^(daftar pustaka|referensi|pranala luar|catatan|lihat pula|bacaan lanjutan|galeri)$/i;

  function bagiTeks(plain: string): Bagian[] {
    // Action-API `explaintext` marks sections as "== Judul ==" lines, but
    // the blank-line spacing around the markers is inconsistent (a marker
    // can share a block with its body, printing raw "=== Judul ===" text)
    // — so split on the markers GLOBALLY, then paragraph-split each span
    const out: Bagian[] = [];
    let cur: Bagian = { judul: null, paras: [] };
    let total = 0;
    const isi = (teks: string) => {
      for (const blok of teks.split(/\n{2,}/)) {
        const t = blok.trim();
        if (!t || total >= BATAS_TOTAL) continue;
        const potong = total + t.length > BATAS_TOTAL ? t.slice(0, BATAS_TOTAL - total).replace(/\s+\S*$/, '') + '…' : t;
        cur.paras.push(potong);
        total += t.length;
      }
    };
    const token = /==+\s*([^=\n]+?)\s*==+/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = token.exec(plain))) {
      isi(plain.slice(last, m.index));
      last = token.lastIndex;
      if (cur.judul !== null || cur.paras.length) out.push(cur);
      cur = { judul: m[1]!, paras: [] };
    }
    isi(plain.slice(last));
    if (cur.judul !== null || cur.paras.length) out.push(cur);

    const bersih = out.filter((b) => b.judul === null || (!LEWATI.test(b.judul) && b.paras.length));
    return [
      ...bersih.filter((b) => b.judul === null),
      ...bersih.filter((b) => b.judul !== null).slice(0, BAGIAN_MAKS),
    ];
  }

  /* the pull-quote: the second sentence of the reviewed extract, verbatim,
     only when it reads at quote length — otherwise the feature runs unquoted */
  const kalimat = p.ringkas.split(/(?<=\.)\s+/);
  const kutip = kalimat.length > 2 && kalimat[1]!.length > 50 && kalimat[1]!.length < 230 ? kalimat[1]! : null;

  const derajat = (v: number, pos: string, neg: string) => {
    const d = Math.abs(v); const deg = Math.floor(d); const men = Math.round((d - deg) * 60);
    return `${deg}°${String(men).padStart(2, '0')}'${v < 0 ? neg : pos}`;
  };
  const koordStr = `${derajat(p.koordinat[0]!, 'LU', 'LS')} ${derajat(p.koordinat[1]!, 'BT', 'BB')}`;

  let plat: HTMLCanvasElement | undefined = $state();
  $effect(() => {
    const el = plat;
    if (!el) return;
    const gambar = () => drawEngraving(el, { ...ENGRAVE_ATLAS, caption: `PLAT · ${p.nama.toUpperCase()}` });
    gambar();
    const ro = new ResizeObserver(gambar);
    ro.observe(el);
    return () => ro.disconnect();
  });

  onMount(() => {
    (async () => {
      try {
        // full plaintext of the article (Action API, CORS via origin=*):
        // the lead may lengthen the reviewed extract; whole sections follow
        const u = `https://id.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1&prop=extracts&explaintext=1&titles=${encodeURIComponent(p.wikipedia.judul)}`;
        const res = await fetch(u, { signal: AbortSignal.timeout(8000) });
        const d = (await res.json()) as { query?: { pages?: Record<string, { extract?: string }> } };
        const plain = Object.values(d?.query?.pages ?? {})[0]?.extract;
        if (!plain) return;
        const semua = bagiTeks(plain);
        const lead = semua.find((b) => b.judul === null);
        // the live lead may only LENGTHEN the reviewed one, never shrink it
        const leadTeks = lead?.paras.join('\n\n') ?? '';
        if (leadTeks.length > extract.length) {
          extract = leadTeks.length > 1400 ? leadTeks.slice(0, 1400).replace(/\s+\S*$/, '') + '…' : leadTeks;
        }
        bagian = semua.filter((b) => b.judul !== null);
        live = true;
      } catch { /* the reviewed registry text stands */ }
    })();
  });
</script>

<article class="wn" data-rise data-no-stempel data-ref="wajah">
  <div class="wn-grid">
    <div class="wn-teks">
      <span class="wn-kicker mono">WAJAH NUSANTARA · {p.wilayah.toUpperCase()}</span>
      <h2 class="wn-nama display">{p.nama.replace(/^(Suku|Orang)\s+/, '')}</h2>
      <p class="wn-extract" class:dua-kolom={extract.length > 420}>{extract}</p>
      {#if kutip}
        <blockquote class="wn-kutip fig">{kutip}</blockquote>
      {/if}
      {#if bagian.length}
        <!-- the feature body: whole encyclopedia sections, verbatim + linked,
             run as newspaper columns on a wide page -->
        <div class="wn-bagian">
          {#each bagian as b (b.judul)}
            <section class="wn-sec">
              <h3 class="wn-sec-judul display">{b.judul}</h3>
              {#each b.paras as para, i (i)}
                <p class="wn-sec-p">{para}</p>
              {/each}
            </section>
          {/each}
        </div>
        <p class="wn-fakta mono">TEKS BAGIAN APA ADANYA DARI ENSIKLOPEDIA · SELENGKAPNYA DI TAUTAN SUMBER</p>
      {/if}
      <p class="wn-fakta mono">BAHASA · {p.bahasa.toUpperCase()}</p>
      <p class="wn-fakta mono">{koordStr} · BERGANTI DUA KALI SEHARI · TEKS APA ADANYA DARI ENSIKLOPEDIA</p>
      <a class="chip" href={p.wikipedia.url} target="_blank" rel="noopener">⊙ id.wikipedia{live ? ' · langsung' : ' · arsip redaksi'}</a>
    </div>
    <div class="wn-side">
      <figure class="wn-img-wrap">
        <div class="wn-img">
          {#if img}
            <img src={img} alt={p.nama} loading="lazy" onerror={() => (img = '')} />
          {:else}
            <div class="wn-plat">
              <canvas bind:this={plat} aria-label={`Plat gravir pengganti foto ${p.nama}`}></canvas>
              <span class="wn-plat-cap mono">PLAT PENGGANTI · FOTO TAK TERSEDIA DI ARSIP TERBUKA</span>
            </div>
          {/if}
        </div>
        <figcaption class="wn-cap mono">PLAT II · {p.nama.toUpperCase()}{#if img && p.gambar} — {p.gambar.atribusi}{/if}</figcaption>
      </figure>
      <SukuLokasi lat={p.koordinat[0]!} lon={p.koordinat[1]!} nama={p.nama} />
      {#if p.warisan?.length}
        <aside class="wn-warisan">
          <span class="wn-war-k mono">WARISAN YANG MENYERTAINYA</span>
          {#each p.warisan as w (w.nama)}
            <div class="wn-war-row">
              <b>{w.nama}</b>
              <p>{w.deskripsi}</p>
            </div>
          {/each}
        </aside>
      {/if}
    </div>
  </div>
</article>

<style>
  .wn { margin-bottom: clamp(28px, 5vw, 56px); }
  .wn-grid { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: clamp(20px, 4vw, 52px); align-items: start; }
  @media (max-width: 760px) { .wn-grid { grid-template-columns: 1fr; gap: 18px; } }
  .wn-teks { display: grid; gap: 12px; align-content: start; }
  .wn-side { display: grid; gap: 14px; align-content: start; }
  .wn-kicker { font-size: 10px; letter-spacing: 0.2em; color: var(--accent); }
  .wn-nama { font-family: 'Fraunces Variable', serif; font-weight: 300; font-size: clamp(54px, 11vw, 128px); line-height: 0.86; letter-spacing: -0.02em; color: var(--ink); }
  .wn-extract { font-size: clamp(15px, 1.8vw, 18px); line-height: 1.62; color: var(--ink); max-width: 62ch; }
  /* the magazine voice: a drop cap opens the feature */
  .wn-extract::first-letter {
    font-family: 'Fraunces Variable', serif; font-weight: 340;
    font-size: 3.2em; line-height: 0.8; float: left;
    padding: 4px 8px 0 0; color: var(--accent);
  }
  /* long reviewed+live text runs in measured columns on wide paper */
  @media (min-width: 1000px) { .wn-extract.dua-kolom { columns: 2; column-gap: 34px; max-width: none; } }
  .wn-kutip {
    font-size: clamp(18px, 2.4vw, 26px); line-height: 1.4; max-width: 44ch;
    border-left: 3px solid var(--accent); padding-left: 16px; margin: 4px 0;
  }
  .wn-bagian { border-top: 1px solid var(--line); padding-top: 14px; margin-top: 6px; }
  /* newspaper columns on a wide page; sections never break mid-heading */
  @media (min-width: 1000px) { .wn-bagian { columns: 2; column-gap: 38px; } }
  .wn-sec { display: grid; gap: 8px; break-inside: avoid; margin-bottom: 18px; }
  .wn-sec-judul { font-family: 'Fraunces Variable', serif; font-weight: 380; font-size: clamp(17px, 2vw, 21px); color: var(--ink); }
  .wn-sec-p { font-size: 14.5px; line-height: 1.62; color: var(--ink); max-width: 62ch; }
  .wn-fakta { font-size: 9px; letter-spacing: 0.14em; color: var(--muted); }
  .wn-teks .chip { justify-self: start; margin-top: 2px; text-decoration: none; }
  .wn-img-wrap { margin: 0; display: grid; gap: 8px; }
  .wn-img { aspect-ratio: 4 / 5; overflow: hidden; border: 1px solid var(--line); background: #ece1c9; }
  @media (max-width: 760px) { .wn-img { aspect-ratio: 16 / 10; } }
  .wn-img img { width: 100%; height: 100%; object-fit: cover; display: block; filter: saturate(0.95); }
  .wn-cap { font-size: 8px; letter-spacing: 0.14em; color: var(--muted); line-height: 1.6; }
  .wn-plat { width: 100%; height: 100%; display: grid; grid-template-rows: minmax(0, 1fr) auto; }
  .wn-plat canvas { width: 100%; height: 100%; min-height: 0; display: block; }
  .wn-plat-cap { font-size: 8.5px; letter-spacing: 0.18em; color: var(--muted); padding: 6px 10px; border-top: 1px solid var(--line); }
  .wn-warisan { display: grid; gap: 10px; border-top: 1px solid var(--line); padding-top: 12px; }
  .wn-war-k { font-size: 8.5px; letter-spacing: 0.18em; color: var(--muted); }
  .wn-war-row b { font-size: 13px; color: var(--ink); }
  .wn-war-row p { font-size: 12px; line-height: 1.5; color: var(--muted); margin-top: 2px; max-width: 40ch; }
</style>
