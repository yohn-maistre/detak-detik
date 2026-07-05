<script lang="ts">
  /** SUARA RESMI: the institution's own publications, verbatim (Lane A) —
      what the branch SAYS, printed beside what it does and how it performs
      (the three-voices frame, §13.19). Rows come from the pantau suara
      archive; a stale archive prints its age, never freshness. */
  import SUARA from '../../newsroom/data/suara_negara.json';

  type Baris = {
    id: string; url: string; judul: string; ringkas?: string | null;
    tanggal: string; kanal: string; lembaga: string; cabang: string;
  };
  let { cabang, n = 5 }: { cabang: string; n?: number } = $props();

  const rows = ((SUARA.baris ?? []) as Baris[])
    .filter((r) => r.cabang === cabang)
    .slice(0, n);
  const basi = (Date.now() - Date.parse(SUARA.diambil ?? '0')) / 864e5 > 14;

  const fmt = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' });
  const tgl = (iso: string) => fmt.format(new Date(iso)).toUpperCase().replace('.', '');
</script>

{#if rows.length && !basi}
  <figure class="sl2" data-no-stempel>
    <figcaption class="eyebrow">SUARA RESMI · JUDUL VERBATIM DARI KANAL LEMBAGA</figcaption>
    <div class="sl2-rows">
      {#each rows as r (r.id)}
        <a class="sl2-row" href={r.url} target="_blank" rel="noopener">
          <span class="sl2-tgl mono num">{tgl(r.tanggal)}</span>
          <span class="sl2-isi">
            <span class="sl2-lembaga mono">{r.lembaga.toUpperCase()}</span>
            <span class="sl2-judul">{r.judul}</span>
          </span>
          <span class="sl2-tick mono" aria-hidden="true">⊙</span>
        </a>
      {/each}
    </div>
    <p class="sl2-kaki mono">LANE A — TANPA TULIS-ULANG, TANPA PENILAIAN · TAUTAN = TERBITAN ASLINYA</p>
  </figure>
{:else}
  <div class="sl2-absen">
    <span class="eyebrow">SUARA RESMI · ARSIP {basi ? 'TERHENTI' : 'KOSONG'}</span>
  </div>
{/if}

<style>
  .sl2 { margin: 0; display: grid; gap: 10px; border-top: 1px solid var(--line); padding-top: 14px; }
  .sl2-rows { display: grid; }
  .sl2-row {
    display: grid; grid-template-columns: auto 1fr auto; gap: 12px;
    align-items: baseline; padding: 8px 0; text-decoration: none; color: inherit;
    border-bottom: 1px solid var(--line-soft);
  }
  .sl2-row:hover .sl2-judul { text-decoration: underline; text-underline-offset: 3px; }
  .sl2-tgl { font-size: 9px; letter-spacing: 0.1em; color: var(--muted); white-space: nowrap; }
  .sl2-isi { display: grid; gap: 2px; }
  .sl2-lembaga { font-size: 8px; letter-spacing: 0.16em; color: var(--accent2); }
  .sl2-judul { font-size: 13px; line-height: 1.45; }
  .sl2-tick { color: var(--muted); font-size: 11px; }
  .sl2-kaki { font-size: 8px; letter-spacing: 0.11em; color: var(--muted); }
  .sl2-absen { border-top: 1px solid var(--line); padding-top: 12px; }
</style>
