<script lang="ts">
  /**
   * Daftar Merah Nusantara (§13.14 HAYATI): the endemic-species ledger. Thirty
   * reviewed rows from the registry (IUCN codes via GBIF, images license-clean;
   * refreshed by scripts/atlas/refresh-hayati.py against the same public APIs).
   * Sorted by extinction risk — the most endangered read first. One species is
   * the day's showcase, chosen by the calendar (law 5). NE is printed honestly:
   * IUCN has simply never assessed those four.
   */
  import HAYATI from '../../newsroom/data/atlas/hayati.json';

  const URUT: Record<string, number> = { CR: 0, EN: 1, VU: 2, NT: 3, NE: 4 };
  const rows = [...HAYATI].sort((a, b) => (URUT[a.status.kode] ?? 9) - (URUT[b.status.kode] ?? 9) || a.nama.localeCompare(b.nama));

  const HARI = Math.floor(Date.now() / 86_400_000);
  const sorot = HAYATI[HARI % HAYATI.length]!;
  let img = $state(sorot.gambar?.url ?? '');

  const hitung = Object.entries(
    HAYATI.reduce<Record<string, number>>((m, r) => ((m[r.status.kode] = (m[r.status.kode] ?? 0) + 1), m), {})
  ).sort((a, b) => (URUT[a[0]] ?? 9) - (URUT[b[0]] ?? 9));
</script>

<section class="dm" data-no-stempel data-ref="daftar-merah">
  <header class="dm-head">
    <span class="eyebrow">DAFTAR MERAH NUSANTARA · {HAYATI.length} SPESIES ENDEMIK & IKON, DIURUTKAN DARI YANG PALING TERANCAM</span>
    <span class="dm-tally mono">
      {#each hitung as [k, n] (k)}<span class="dm-t" class:genting={k === 'CR' || k === 'EN'}>{n} {k}</span>{/each}
    </span>
  </header>

  <div class="dm-grid">
    <figure class="dm-sorot">
      {#if img}
        <img src={img} alt={sorot.nama} loading="lazy" onerror={() => (img = '')} />
      {:else}
        <div class="dm-sorot-plat mono">GAMBAR TAK TERSEDIA · {sorot.nama.toUpperCase()}</div>
      {/if}
      <figcaption class="dm-cap mono">
        <b class="dm-cap-status" class:genting={sorot.status.kode === 'CR' || sorot.status.kode === 'EN'}>{sorot.status.kode} · {sorot.status.label.toUpperCase()}</b>
        <span class="dm-cap-nama">{sorot.nama} — <i>{sorot.ilmiah}</i></span>
        <span class="dm-cap-teks">{sorot.ringkas.split(/(?<=\.)\s+/)[0]}</span>
        <a class="chip" href={sorot.wikipedia.url} target="_blank" rel="noopener"><span class="tick">⊙</span>id.wikipedia · gbif/iucn</a>
      </figcaption>
    </figure>

    <ol class="dm-list">
      {#each rows as r (r.id)}
        <li class="dm-row" class:aktif={r.id === sorot.id}>
          <b class="dm-kode mono" class:genting={r.status.kode === 'CR' || r.status.kode === 'EN'} class:rentan={r.status.kode === 'VU'}>{r.status.kode}</b>
          <span class="dm-nama">{r.nama}</span>
          <i class="dm-ilmiah">{r.ilmiah}</i>
          <span class="dm-pulau mono">{r.pulau.replace('_', '/').toUpperCase()}</span>
        </li>
      {/each}
    </ol>
  </div>
  <p class="dm-kaki mono">STATUS IUCN VIA GBIF · NE = BELUM PERNAH DINILAI IUCN · SOROTAN BERGANTI TIAP HARI, SAMA UNTUK SEMUA PEMBACA</p>
</section>

<style>
  .dm { margin-top: 30px; border-top: 1px solid var(--line); padding-top: 16px; display: grid; gap: 14px; }
  .dm-head { display: flex; justify-content: space-between; align-items: baseline; gap: 10px 20px; flex-wrap: wrap; }
  .dm-tally { display: flex; gap: 12px; font-size: 9px; letter-spacing: 0.1em; color: var(--muted); }
  .dm-t.genting { color: var(--accent); }

  .dm-grid { display: grid; grid-template-columns: 0.9fr 1.1fr; gap: clamp(18px, 3vw, 40px); align-items: start; }
  @media (max-width: 820px) { .dm-grid { grid-template-columns: 1fr; } }

  .dm-sorot { margin: 0; display: grid; gap: 10px; }
  .dm-sorot img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; display: block; border: 1px solid var(--line); filter: saturate(0.95); }
  .dm-sorot-plat { aspect-ratio: 4 / 3; display: grid; place-items: center; border: 1px solid var(--line); background: #ece1c9; font-size: 9px; letter-spacing: 0.16em; color: var(--muted); text-align: center; padding: 12px; }
  .dm-cap { display: grid; gap: 5px; justify-items: start; }
  .dm-cap-status { font-size: 9px; letter-spacing: 0.14em; color: var(--muted); }
  .dm-cap-status.genting { color: var(--accent); }
  .dm-cap-nama { font-size: 14px; color: var(--ink); letter-spacing: 0.02em; }
  .dm-cap-nama i { color: var(--muted); }
  .dm-cap-teks { font-size: 12px; line-height: 1.5; color: var(--muted); letter-spacing: 0.02em; max-width: 46ch; }
  .dm-cap .chip { text-decoration: none; margin-top: 2px; }

  .dm-list { list-style: none; margin: 0; padding: 0; display: grid; }
  .dm-row {
    display: grid; grid-template-columns: 34px minmax(0, 1fr) minmax(0, 1fr) auto;
    gap: 10px; align-items: baseline; padding: 5px 0;
    border-bottom: 1px dotted var(--line-soft); font-size: 12px;
  }
  @media (max-width: 560px) { .dm-row { grid-template-columns: 34px 1fr auto; } .dm-ilmiah { display: none; } }
  .dm-row.aktif { background: color-mix(in oklab, var(--accent) 6%, transparent); }
  .dm-kode { font-size: 9.5px; letter-spacing: 0.06em; color: var(--muted); }
  .dm-kode.genting { color: var(--accent); font-weight: 700; }
  .dm-kode.rentan { color: var(--ink); }
  .dm-nama { color: var(--ink); }
  .dm-ilmiah { color: var(--muted); font-size: 11.5px; }
  .dm-pulau { font-size: 8px; letter-spacing: 0.1em; color: var(--muted); }
  .dm-kaki { font-size: 8.5px; letter-spacing: 0.12em; color: var(--muted); }
</style>