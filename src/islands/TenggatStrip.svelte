<script lang="ts">
  /**
   * Tenggat: the deadlines the ledger itself is counting. Reads the SAME
   * janji registry the buku besar prints (single source of truth) and shows
   * the nearest promised deadlines still running — days left, big, each with
   * its target. Replaces the retired 90-minute clock: same slot, real stakes,
   * no invented drama. Deterministic; recomputes on every view.
   */
  import JANJI from '../../newsroom/data/janji_registry.json';

  const kini = Date.now();
  const rows = JANJI
    .filter((j) => j.tenggat && j.status === 'BERJALAN')
    .map((j) => ({ ...j, sisa: Math.ceil((Date.parse(j.tenggat!) - kini) / 86_400_000) }))
    .filter((j) => j.sisa > 0)
    .sort((a, b) => a.sisa - b.sisa)
    .slice(0, 3);

  const fmtHari = new Intl.NumberFormat('id-ID');
</script>

{#if rows.length}
  <section class="tg" data-no-stempel aria-label="Tenggat janji terdekat">
    <span class="tg-k mono">TENGGAT · JANJI YANG SEDANG DIHITUNG BUKU BESAR</span>
    <div class="tg-row">
      {#each rows as r (r.id)}
        <a class="tg-item" href="#janji">
          <p class="tg-hari num"><b>{fmtHari.format(r.sisa)}</b><span> hari lagi</span></p>
          <p class="tg-teks">{r.teks}</p>
          <span class="tg-target mono">TARGET · {r.target.toUpperCase()}</span>
        </a>
      {/each}
    </div>
  </section>
{/if}

<style>
  .tg { display: grid; gap: 12px; border-top: 1px solid var(--line); padding: 16px 0 6px; margin-top: 8px; }
  .tg-k { font-size: 9px; letter-spacing: 0.18em; color: var(--muted); }
  .tg-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: clamp(16px, 3vw, 36px); }
  @media (max-width: 800px) { .tg-row { grid-template-columns: 1fr; gap: 14px; } }
  .tg-item { text-decoration: none; display: grid; gap: 5px; align-content: start; border-left: 2px solid var(--line); padding-left: 12px; }
  .tg-item:hover { border-left-color: var(--accent); }
  .tg-hari b { font-family: 'Fraunces Variable', serif; font-weight: 340; font-size: clamp(30px, 4vw, 44px); line-height: 0.9; color: var(--accent); }
  .tg-hari span { font-size: 11px; color: var(--muted); margin-left: 6px; }
  .tg-teks { font-size: 12.5px; line-height: 1.45; color: var(--ink); max-width: 40ch; }
  .tg-target { font-size: 8.5px; letter-spacing: 0.12em; color: var(--muted); }
</style>
