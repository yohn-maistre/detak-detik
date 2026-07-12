<script lang="ts">
  /**
   * Pustaka & Pikiran (§13.17 B.7) — DARI RAK. Ten writers and public
   * thinkers on one shelf; the calendar pulls one book forward each day.
   * Left: the day's thinker, verbatim encyclopedia lead (the reviewed
   * registry is the floor; the live REST fetch may only lengthen it).
   * Right: the shelf itself — every spine standing, today's drawn out and
   * inked, its year at the foot; below, the work's curated note, labeled.
   * Roster curated (newsroom/data/atlas/pustaka.json), text-led by design:
   * a letters section is about the words.
   */
  import { onMount } from 'svelte';
  import { pustakaHari as p, pustakaIdx } from '../lib/atlas-hari';
  import PUSTAKA from '../../newsroom/data/atlas/pustaka.json';

  let extract = $state(p.ringkas);
  let live = $state(false);

  // hover = a cursor-follow preview (mouse/pen only); CLICK pins the book's
  // card under the shelf — the card holds the encyclopedia link, so a phone
  // tap never navigates blind (Yose 2026-07-13)
  type Buku = (typeof PUSTAKA)[number];
  let tip = $state<{ b: Buku; x: number; y: number } | null>(null);
  let pin = $state<Buku | null>(null);
  function tipMove(e: PointerEvent, b: Buku) {
    if (e.pointerType === 'touch') return;
    tip = { b, x: e.clientX, y: e.clientY };
  }
  function pilihBuku(b: Buku) {
    tip = null;
    pin = pin?.id === b.id ? null : b;
  }

  // the pull-quote: the second sentence, verbatim, at quote length only
  const kal = p.ringkas.split(/(?<=\.)\s+/);
  const kutip = kal.length > 2 && kal[1]!.length > 50 && kal[1]!.length < 230 ? kal[1]! : null;

  onMount(() => {
    (async () => {
      try {
        const u = `https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(p.wikipedia.judul)}`;
        const res = await fetch(u, { signal: AbortSignal.timeout(6000) });
        const d = await res.json();
        if (d?.extract && d.extract.length > extract.length) {
          extract = d.extract.length > 850 ? d.extract.slice(0, 850).replace(/\s+\S*$/, '') + '…' : d.extract;
          live = true;
        }
      } catch { /* the reviewed registry text stands */ }
    })();
  });
</script>

<article class="pp" data-rise data-no-stempel data-ref="pustaka">
  <div class="pp-grid">
    <div class="pp-teks">
      <span class="pp-kicker mono">DARI RAK · {p.peran.toUpperCase()}</span>
      <h2 class="pp-nama display">{p.nama}</h2>
      <p class="pp-extract">{extract}</p>
      {#if kutip}
        <blockquote class="pp-kutip fig">{kutip}</blockquote>
      {/if}
      <p class="pp-fakta mono">SATU DARI {PUSTAKA.length} PENA DI RAK · BERGANTI TIAP HARI · TEKS APA ADANYA DARI ENSIKLOPEDIA</p>
      <a class="chip" href={p.wikipedia.url} target="_blank" rel="noopener">⊙ id.wikipedia{live ? ' · langsung' : ' · arsip redaksi'}</a>
    </div>

    <div class="pp-rak-sisi">
      <!-- the shelf: every spine standing; today's pulled forward -->
      <div class="pp-rak" role="list" aria-label={`Rak ${PUSTAKA.length} buku; hari ini terambil ${p.karya.judul} (${p.karya.tahun}) oleh ${p.nama}`}>
        {#each PUSTAKA as b, i (b.id)}
          <button
            class="pp-spine"
            class:hariIni={i === pustakaIdx}
            class:terpin={pin?.id === b.id}
            role="listitem"
            aria-expanded={pin?.id === b.id}
            aria-label={`${b.karya.judul} oleh ${b.nama} — buka kartunya`}
            onpointermove={(e) => tipMove(e, b)}
            onpointerleave={() => (tip = null)}
            onclick={() => pilihBuku(b)}
          >
            <span class="pp-spine-judul">{b.karya.judul}</span>
            {#if i === pustakaIdx}<span class="pp-spine-thn mono">{b.karya.tahun}</span>{/if}
          </button>
        {/each}
      </div>
      <div class="pp-papan" aria-hidden="true"></div>

      {#if pin}
        <!-- the pinned card: sits in the page, its link stays put -->
        <div class="pp-pin">
          <div class="pp-pin-head">
            <b class="pp-pin-karya fig">{pin.karya.judul}</b>
            <button class="pp-pin-x mono" onclick={() => (pin = null)} aria-label="Tutup kartu">✕</button>
          </div>
          <span class="pp-pin-meta mono">{pin.nama} · {pin.karya.tahun} · {pin.peran}</span>
          <span class="pp-pin-catatan">{pin.karya.catatan}</span>
          <a class="chip" href={pin.wikipedia.url} target="_blank" rel="noopener">⊙ buka di id.wikipedia →</a>
        </div>
      {/if}

      <div class="pp-karya">
        <span class="pp-karya-k mono">TERAMBIL HARI INI</span>
        <p class="pp-karya-judul fig">{p.karya.judul} <span class="pp-karya-thn mono">· {p.karya.tahun}</span></p>
        <p class="pp-karya-catatan">{p.karya.catatan}</p>
        <a class="chip pp-karya-baca" href={p.wikipedia.url} target="_blank" rel="noopener">⊙ baca tentangnya di id.wikipedia →</a>
        <span class="pp-karya-lbl mono">CATATAN KURASI REDAKSI · TIAP SAMPUL TERTAUT KE ENSIKLOPEDIANYA</span>
      </div>
    </div>
  </div>
</article>

{#if tip}
  <div class="pp-tip" style={`transform: translate(${tip.x}px, ${tip.y - 16}px)`} aria-hidden="true">
    <b class="pp-tip-karya fig">{tip.b.karya.judul}</b>
    <span class="pp-tip-meta mono">{tip.b.nama} · {tip.b.karya.tahun} · {tip.b.peran}</span>
    <span class="pp-tip-catatan">{tip.b.karya.catatan}</span>
    <span class="pp-tip-buka mono">↗ KLIK — KARTUNYA TERBUKA DI BAWAH RAK</span>
  </div>
{/if}

<style>
  .pp { margin-bottom: clamp(24px, 4vw, 44px); }
  .pp-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: clamp(22px, 4.5vw, 60px); align-items: start; }
  @media (max-width: 760px) { .pp-grid { grid-template-columns: 1fr; gap: 22px; } }

  .pp-teks { display: grid; gap: 12px; align-content: start; }
  .pp-kicker { font-size: 10px; letter-spacing: 0.2em; color: var(--accent); }
  .pp-nama { font-family: 'Fraunces Variable', serif; font-weight: 300; font-size: clamp(42px, 7.6vw, 92px); line-height: 0.88; letter-spacing: -0.018em; color: var(--ink); }
  .pp-extract { font-size: clamp(14.5px, 1.7vw, 17px); line-height: 1.62; color: var(--ink); max-width: 60ch; }
  .pp-extract::first-letter {
    font-family: 'Fraunces Variable', serif; font-weight: 340;
    font-size: 3.1em; line-height: 0.8; float: left;
    padding: 4px 8px 0 0; color: var(--accent);
  }
  .pp-kutip {
    font-size: clamp(17px, 2.2vw, 24px); line-height: 1.42; max-width: 44ch;
    border-left: 3px solid var(--accent); padding-left: 16px; margin: 4px 0;
  }
  .pp-fakta { font-size: 9px; letter-spacing: 0.14em; color: var(--muted); }
  .pp-teks .chip { justify-self: start; text-decoration: none; }

  /* ── the shelf ─────────────────────────────────────────── */
  .pp-rak-sisi { display: grid; gap: 0; align-content: start; }
  .pp-rak { display: flex; align-items: flex-end; gap: 4px; height: clamp(150px, 20vw, 210px); }
  .pp-spine {
    flex: 1 1 0; min-width: 0; height: 78%;
    border: 1px solid var(--line); border-bottom: none;
    background: color-mix(in oklab, var(--ink) 5%, transparent);
    position: relative; overflow: hidden;
    display: grid; align-content: end; justify-items: center;
    padding: 0 0 8px; margin: 0; font: inherit; cursor: pointer;
    text-decoration: none;
    transition: height 0.35s var(--ease-out, ease), background 0.2s, flex-grow 0.35s var(--ease-out, ease);
  }
  .pp-spine:hover:not(.hariIni), .pp-spine.terpin:not(.hariIni) { background: color-mix(in oklab, var(--accent) 14%, transparent); flex-grow: 1.5; }

  /* the pinned card under the shelf */
  .pp-pin { display: grid; gap: 5px; border: 1px solid var(--ink); padding: 12px 14px; margin-top: 12px; background: color-mix(in oklab, var(--ink) 3%, transparent); }
  .pp-pin-head { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
  .pp-pin-karya { font-size: 16px; color: var(--ink); line-height: 1.15; }
  .pp-pin-x { background: none; border: none; cursor: pointer; color: var(--muted); font-size: 10px; padding: 2px 0; }
  .pp-pin-x:hover { color: var(--accent); }
  .pp-pin-meta { font-size: 8px; letter-spacing: 0.1em; color: var(--muted); }
  .pp-pin-catatan { font-size: 12px; line-height: 1.55; color: var(--ink); }
  .pp-pin .chip { justify-self: start; text-decoration: none; margin-top: 4px; }
  .pp-spine-judul {
    writing-mode: vertical-rl; transform: rotate(180deg);
    font-family: var(--font-fig); font-style: italic;
    font-size: 9.5px; letter-spacing: 0.02em; color: var(--muted);
    max-height: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  /* today's book: pulled up off the shelf, inked, its year at the foot */
  .pp-spine.hariIni {
    height: 100%; flex-grow: 2.6;
    background: var(--ink); border-color: var(--ink);
  }
  .pp-spine.hariIni .pp-spine-judul { color: var(--bg); font-size: 12px; font-weight: 600; }
  .pp-spine-thn { font-size: 7px; letter-spacing: 0.12em; color: color-mix(in oklab, var(--bg) 72%, transparent); margin-top: 6px; }
  .pp-papan { height: 3px; background: var(--ink); margin-top: 0; }

  .pp-karya { display: grid; gap: 6px; padding-top: 14px; }
  .pp-karya-k { font-size: 8.5px; letter-spacing: 0.18em; color: var(--accent); }
  .pp-karya-judul { font-size: clamp(20px, 2.6vw, 28px); color: var(--ink); line-height: 1.1; }
  .pp-karya-thn { font-size: 10px; letter-spacing: 0.08em; color: var(--muted); }
  .pp-karya-catatan { font-size: 13px; line-height: 1.6; color: var(--muted); max-width: 44ch; }
  .pp-karya-baca { justify-self: start; text-decoration: none; margin-top: 2px; }
  .pp-karya-lbl { font-size: 7.5px; letter-spacing: 0.14em; color: var(--muted); border-top: 1px solid var(--line-soft); padding-top: 6px; margin-top: 4px; }

  /* the cursor-follow tooltip over the shelf */
  .pp-tip {
    position: fixed; left: 0; top: 0; z-index: 145; pointer-events: none;
    translate: -50% -100%; width: 244px;
    background: var(--bg); color: var(--ink); border: 1px solid var(--ink);
    box-shadow: 0 18px 40px -18px rgba(0, 0, 0, 0.5);
    padding: 11px 13px; display: grid; gap: 4px;
  }
  .pp-tip-karya { font-size: 15px; color: var(--ink); line-height: 1.15; }
  .pp-tip-meta { font-size: 8px; letter-spacing: 0.1em; color: var(--muted); }
  .pp-tip-catatan { font-size: 11.5px; line-height: 1.5; color: var(--ink); margin-top: 3px; }
  .pp-tip-buka { font-size: 7.5px; letter-spacing: 0.14em; color: var(--accent); margin-top: 4px; }
</style>
