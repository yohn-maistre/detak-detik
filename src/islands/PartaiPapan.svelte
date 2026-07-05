<script lang="ts">
  /** PARTAI & KEPENTINGAN v1 (§4.4): one ruled row per party — documents
      only. Seats (KPU 2024, curated registry), governors where Wikidata
      records them (coverage printed honestly), media-ownership ties
      (documented person-holds-both-roles facts), and DISEBUT DALAM LIPUTAN
      chips fed live by the kliping desk's deterministic alias tagger.
      No inference, no interest scores — the dek says so in print. */
  import { onMount } from 'svelte';
  import { reducedMotion } from '../lib/motion';
  import { onEdisi, type LiveEdisi } from '../lib/edition';
  import REG from '../../newsroom/data/partai_registry.json';
  import GUB from '../../newsroom/data/partai_gubernur.json';

  type Partai = {
    id: string; nama: string; singkat: string; alias: string[]; kursi: number;
    luar_parlemen?: boolean; media: { grup: string; catatan: string; sumber: string } | null;
    sumber: string;
  };
  const PARTAI = (REG.partai as Partai[]).filter((p) => !p.luar_parlemen).sort((a, b) => b.kursi - a.kursi);
  const LUAR = (REG.partai as Partai[]).filter((p) => p.luar_parlemen);
  const TOTAL = REG.kursi_total as number;
  const GUB_PER = (GUB.per_partai ?? {}) as Record<string, number>;

  // the seat waffle: 1 cell = 5 kursi (116 cells total keeps rows readable)
  const SEL = 5;
  const sel = (k: number) => Math.round(k / SEL);

  // DISEBUT DALAM LIPUTAN: live counts from the current edition's kliping
  // clusters (the desk's deterministic alias tagger). SSR prints the slot
  // empty-but-labeled; the newsroom fills it when the print run is on.
  let liputan: Record<string, number> = $state({});
  let adaEdisi = $state(false);
  onMount(() => {
    const off = onEdisi((e: LiveEdisi | null) => {
      const kl = e?.kliping ?? [];
      const m: Record<string, number> = {};
      for (const k of kl) for (const pid of k.partai ?? []) m[pid] = (m[pid] ?? 0) + 1;
      liputan = m;
      adaEdisi = kl.length > 0;
    });
    const io = new IntersectionObserver(([en]) => {
      if (en?.isIntersecting) { root?.classList.add('in'); io.disconnect(); }
    }, { threshold: 0.15 });
    if (root) io.observe(root);
    if (reducedMotion()) root?.classList.add('in');
    return () => { off?.(); io.disconnect(); };
  });
  let root: HTMLElement | undefined = $state();
</script>

<section class="pp" data-no-stempel bind:this={root}>
  <div class="pp-rows">
    {#each PARTAI as p, i (p.id)}
      <article class="pp-row">
        <span class="pp-no ghost-num num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
        <div class="pp-nama">
          <h4 class="pp-singkat display">{p.singkat}</h4>
          <p class="pp-panjang mono">{p.nama.toUpperCase()}</p>
        </div>
        <div class="pp-kursi">
          <div class="pp-waffle" role="img" aria-label={`${p.kursi} dari ${TOTAL} kursi DPR`}>
            {#each Array(sel(p.kursi)) as _, k (k)}<i class="pp-sel" style={`--d:${k * 12}ms`}></i>{/each}
          </div>
          <p class="pp-kursi-n mono"><b class="num">{p.kursi}</b> KURSI · {((p.kursi / TOTAL) * 100).toFixed(0)}%</p>
        </div>
        <div class="pp-fakta mono">
          {#if GUB_PER[p.id]}<span class="pp-f">⌂ {GUB_PER[p.id]} GUBERNUR TERDATA</span>{/if}
          {#if p.media}<span class="pp-f pp-media" title={`${p.media.catatan} — ${p.media.sumber}`}>▤ {p.media.grup}</span>{/if}
          {#if liputan[p.id]}<span class="pp-f pp-lip">✳ DISEBUT DALAM {liputan[p.id]} KLASTER LIPUTAN</span>{/if}
        </div>
      </article>
    {/each}
  </div>

  <div class="pp-luar">
    <span class="eyebrow">DI LUAR PARLEMEN · TERCATAT KARENA JEJAK KEPEMILIKAN &amp; LIPUTANNYA</span>
    <p class="pp-luar-baris mono">
      {#each LUAR as p, i (p.id)}
        <span>{p.singkat}{p.media ? ` (▤ ${p.media.grup})` : ''}{liputan[p.id] ? ` · ✳ ${liputan[p.id]} klaster` : ''}{i < LUAR.length - 1 ? '  ·  ' : ''}</span>
      {/each}
    </p>
  </div>

  <p class="pp-kaki mono">
    ⊙ KURSI: {REG.sumber_kursi} · GUBERNUR: WIKIDATA CC0, TERDATA {GUB.terdata} DARI {GUB.dari}
    {GUB.afiliasi_ganda ? `(+${GUB.afiliasi_ganda} AFILIASI GANDA TERCATAT, TIDAK DITEBAK)` : ''} ·
    LIPUTAN: PENANDA TOKEN DETERMINISTIK MEJA KLIPING{adaEdisi ? '' : ' — MENUNGGU EDISI BERIKUTNYA'} ·
    JABATAN KABINET PER PARTAI: MENUNGGU KURASI
  </p>
</section>

<style>
  .pp { display: grid; gap: 18px; border-top: 1px solid var(--line); padding-top: 16px; }
  .pp-rows { display: grid; }
  .pp-row {
    display: grid; grid-template-columns: auto minmax(120px, 0.8fr) 1.4fr 1fr;
    gap: clamp(10px, 2.5vw, 26px); align-items: center;
    padding: 13px 0; border-bottom: 1px solid var(--line-soft);
  }
  @media (max-width: 720px) { .pp-row { grid-template-columns: auto 1fr 1.3fr; } .pp-fakta { grid-column: 2 / -1; } }
  .pp-no { font-size: 22px; opacity: 0.2; }
  .pp-singkat { font-size: clamp(17px, 2.4vw, 22px); font-weight: 420; margin: 0; }
  .pp-panjang { font-size: 7.5px; letter-spacing: 0.14em; color: var(--muted); margin-top: 2px; }
  .pp-waffle { display: flex; flex-wrap: wrap; gap: 2.5px; max-width: 240px; }
  .pp-sel { width: 7px; height: 7px; background: var(--ink); opacity: 0; border-radius: 1px; transition: opacity 0.3s ease var(--d); }
  :global(.pp.in) .pp-sel { opacity: 0.85; }
  @media (prefers-reduced-motion: reduce) { .pp-sel { transition: none; opacity: 0.85; } }
  .pp-kursi { display: grid; gap: 5px; }
  .pp-kursi-n { font-size: 9px; letter-spacing: 0.1em; color: var(--muted); }
  .pp-kursi-n b { color: var(--ink); }
  .pp-fakta { display: grid; gap: 4px; font-size: 8.5px; letter-spacing: 0.1em; color: var(--muted); }
  .pp-media { cursor: help; }
  .pp-lip { color: var(--accent2); }
  .pp-luar { display: grid; gap: 7px; }
  .pp-luar-baris { font-size: 9px; letter-spacing: 0.08em; color: var(--muted); line-height: 2; }
  .pp-kaki { font-size: 8.5px; letter-spacing: 0.1em; color: var(--muted); line-height: 1.9; border-top: 1px solid var(--line-soft); padding-top: 10px; }
</style>
