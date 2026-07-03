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
      <div class="pp-rak" role="img" aria-label={`Rak ${PUSTAKA.length} buku; hari ini terambil ${p.karya.judul} (${p.karya.tahun}) oleh ${p.nama}`}>
        {#each PUSTAKA as b, i (b.id)}
          <div class="pp-spine" class:hariIni={i === pustakaIdx} title={`${b.karya.judul} — ${b.nama}`}>
            <span class="pp-spine-judul">{b.karya.judul}</span>
            {#if i === pustakaIdx}<span class="pp-spine-thn mono">{b.karya.tahun}</span>{/if}
          </div>
        {/each}
      </div>
      <div class="pp-papan" aria-hidden="true"></div>

      <div class="pp-karya">
        <span class="pp-karya-k mono">TERAMBIL HARI INI</span>
        <p class="pp-karya-judul fig">{p.karya.judul} <span class="pp-karya-thn mono">· {p.karya.tahun}</span></p>
        <p class="pp-karya-catatan">{p.karya.catatan}</p>
        <span class="pp-karya-lbl mono">CATATAN KURASI REDAKSI · RIWAYAT TERBIT TERDOKUMENTASI</span>
      </div>
    </div>
  </div>
</article>

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
    padding-bottom: 8px;
    transition: height 0.35s var(--ease-out, ease);
  }
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
  .pp-karya-lbl { font-size: 7.5px; letter-spacing: 0.14em; color: var(--muted); border-top: 1px solid var(--line-soft); padding-top: 6px; margin-top: 4px; }
</style>
