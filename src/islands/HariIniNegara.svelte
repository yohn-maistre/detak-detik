<script lang="ts">
  /** HARI INI DI NEGARA — the aggregator's front desk (§13.19): the newest
      documented act per pantau lane, one ruled row each, timestamped. A
      stale lane prints its age in ink — the board doubles as the system's
      own health monitor. Every row links its official publication. */
  import AGENDA from '../../newsroom/data/agenda_istana.json';
  import LEMBARAN from '../../newsroom/data/uu_lembaran.json';
  import SUARA from '../../newsroom/data/suara_negara.json';

  type Row = { label: string; tanggal: string; teks: string; url: string; sumber: string };

  const hariIni = new Date().toISOString().slice(0, 10);
  const umur = (iso: string) => Math.max(0, Math.floor((Date.parse(hariIni) - Date.parse(iso)) / 864e5));

  const acara = (AGENDA.acara ?? []) as { aktor: string; tanggal_acara: string; judul: string; url: string }[];
  const pres = acara.find((a) => a.aktor === 'PRESIDEN');

  const uu = ((LEMBARAN.peraturan ?? []) as { jenis: string; nomor?: string | null; tahun?: number | null; judul: string; url: string; diundangkan?: string | null }[])
    .find((r) => r.diundangkan);

  const suara = (SUARA.baris ?? []) as { kanal: string; cabang: string; lembaga: string; judul: string; url: string; tanggal: string }[];
  const per = (cabang: string) => suara.find((r) => r.cabang === cabang);
  const dewan = per('legislatif');
  const aparat = per('aparat');
  const partai = per('partai');
  const pengawas = per('pengawas');

  const rows: Row[] = [];
  if (pres) rows.push({ label: 'ISTANA', tanggal: pres.tanggal_acara, teks: pres.judul, url: pres.url, sumber: 'setkab' });
  if (uu) rows.push({ label: 'LEMBARAN', tanggal: uu.diundangkan!, teks: `${uu.jenis} ${uu.nomor}/${uu.tahun} — ${uu.judul}`, url: uu.url, sumber: 'jdih bpk' });
  if (dewan) rows.push({ label: 'DEWAN', tanggal: dewan.tanggal, teks: dewan.judul, url: dewan.url, sumber: 'emedia dpr' });
  if (aparat) rows.push({ label: 'APARAT', tanggal: aparat.tanggal, teks: aparat.judul, url: aparat.url, sumber: aparat.lembaga.toLowerCase() });
  if (partai) rows.push({ label: 'PARTAI', tanggal: partai.tanggal, teks: partai.judul, url: partai.url, sumber: partai.lembaga.toLowerCase() });
  if (pengawas) rows.push({ label: 'PENGAWAS', tanggal: pengawas.tanggal, teks: pengawas.judul, url: pengawas.url, sumber: pengawas.lembaga.toLowerCase() });

  const fmt = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' });
  const tgl = (iso: string) => {
    const u = umur(iso);
    if (u === 0) return 'HARI INI';
    if (u === 1) return 'KEMARIN';
    return fmt.format(new Date(iso)).toUpperCase().replace('.', '');
  };
</script>

{#if rows.length}
  <section class="hn" data-no-stempel aria-label="Hari ini di negara: catatan terbaru tiap lajur pantau">
    <div class="hn-rows">
      {#each rows as r (r.label)}
        <a class="hn-row" class:tua={umur(r.tanggal) > 7} href={r.url} target="_blank" rel="noopener">
          <span class="hn-label mono">{r.label}</span>
          <span class="hn-teks">{r.teks}</span>
          <span class="hn-meta mono num">{tgl(r.tanggal)}{umur(r.tanggal) > 7 ? ` · ${umur(r.tanggal)} HARI LALU` : ''} · ⊙ {r.sumber}</span>
        </a>
      {/each}
    </div>
    <p class="hn-kaki mono">SATU BARIS TERBARU PER LAJUR PANTAU · SEMUA TERBITAN RESMI, VERBATIM, TERTAUT · LAJUR BASI MENCETAK UMURNYA</p>
  </section>
{/if}

<style>
  .hn { display: grid; gap: 10px; }
  .hn-rows { display: grid; border-top: 1px solid var(--line); }
  .hn-row {
    display: grid; grid-template-columns: minmax(74px, auto) 1fr; gap: 4px 16px;
    padding: 10px 0; text-decoration: none; color: inherit;
    border-bottom: 1px solid var(--line-soft);
  }
  .hn-row:hover .hn-teks { text-decoration: underline; text-underline-offset: 3px; }
  .hn-label { font-size: 9px; letter-spacing: 0.18em; color: var(--accent2); align-self: baseline; padding-top: 2px; }
  .hn-teks { font-size: 13.5px; line-height: 1.45; grid-column: 2; grid-row: 1; }
  .hn-meta { font-size: 8.5px; letter-spacing: 0.1em; color: var(--muted); grid-column: 2; }
  .hn-row.tua .hn-teks { color: var(--muted); }
  .hn-kaki { font-size: 8px; letter-spacing: 0.11em; color: var(--muted); }
</style>
