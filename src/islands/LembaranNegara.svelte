<script lang="ts">
  /** LEMBARAN NEGARA: what actually became law — the newest gazetted
      documents from the paper's own JDIH BPK harvest, dated by their
      canonical Tanggal Pengundangan. The counterweight to legislative
      talk: talk upstairs (SUARA DPR), ink here. */
  import LEMBARAN from '../../newsroom/data/uu_lembaran.json';

  type Per = { id: string; url: string; jenis: string; nomor?: string | null; tahun?: number | null; judul: string; diundangkan?: string | null };
  const rows = ((LEMBARAN.peraturan ?? []) as Per[]).filter((r) => r.diundangkan).slice(0, 6);
  const basi = (Date.now() - Date.parse(LEMBARAN.diambil ?? '0')) / 864e5 > 14;

  const fmt = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  const tgl = (iso: string) => fmt.format(new Date(iso)).toUpperCase().replace('.', '');
</script>

{#if rows.length && !basi}
  <figure class="ln" data-no-stempel>
    <figcaption class="eyebrow">LEMBARAN NEGARA · PERATURAN PUSAT TERBARU DIUNDANGKAN</figcaption>
    <div class="ln-rows">
      {#each rows as r (r.id)}
        <a class="ln-row" href={r.url} target="_blank" rel="noopener">
          <span class="ln-no mono num">{r.jenis} {r.nomor}/{r.tahun}</span>
          <span class="ln-judul">{r.judul}</span>
          <span class="ln-tgl mono num">{tgl(r.diundangkan!)} · ⊙</span>
        </a>
      {/each}
    </div>
    <p class="ln-kaki mono">TANGGAL = PENGUNDANGAN RESMI · SUMBER: PERATURAN.BPK.GO.ID (JDIH BPK) · ARSIP TUMBUH TIAP PANEN</p>
  </figure>
{:else}
  <div class="ln-absen"><span class="eyebrow">LEMBARAN NEGARA · {basi ? 'ARSIP TERHENTI' : 'ARSIP KOSONG'}</span></div>
{/if}

<style>
  .ln { margin: 0; display: grid; gap: 10px; border-top: 1px solid var(--line); padding-top: 14px; }
  .ln-rows { display: grid; }
  .ln-row {
    display: grid; grid-template-columns: minmax(112px, auto) 1fr auto; gap: 4px 14px;
    align-items: baseline; padding: 8px 0; text-decoration: none; color: inherit;
    border-bottom: 1px solid var(--line-soft);
  }
  @media (max-width: 560px) { .ln-row { grid-template-columns: 1fr auto; } .ln-judul { grid-column: 1 / -1; } }
  .ln-row:hover .ln-judul { text-decoration: underline; text-underline-offset: 3px; }
  .ln-no { font-size: 9.5px; letter-spacing: 0.1em; color: var(--accent2); white-space: nowrap; }
  .ln-judul { font-size: 13px; line-height: 1.45; }
  .ln-tgl { font-size: 8.5px; letter-spacing: 0.08em; color: var(--muted); white-space: nowrap; }
  .ln-kaki { font-size: 8px; letter-spacing: 0.11em; color: var(--muted); }
  .ln-absen { border-top: 1px solid var(--line); padding-top: 12px; }
</style>
