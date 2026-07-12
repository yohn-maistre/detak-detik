<script lang="ts">
  /**
   * Daftar Isi: the bottom-right page curl, repurposed from ornament into the
   * paper's navigation. The folded corner peels open into a table of contents
   * — three acts as groups, sections as rows, the row you are reading marked.
   * Every jump speaks the command bus (`scroll_to`), like every other click.
   * The old refresh countdown lives on in the panel's footer.
   */
  import { onMount } from 'svelte';
  import { dispatch } from '../lib/commands/dispatcher';

  type Row = { id: string; no: string; judul: string };
  type Grup = { label: string; rows: Row[] };
  const GRUP: Grup[] = [
    {
      label: 'PAGI · KABAR',
      rows: [
        { id: 'depan', no: '§1', judul: 'Halaman Muka' },
        { id: 'peta-blok', no: '§2', judul: 'Peta Kabar' },
        { id: 'pasar', no: '§3', judul: 'Pasar & Harga Pangan' },
      ],
    },
    {
      label: 'MALAM · GERAK I — LIMA CABANG',
      rows: [
        { id: 'mesin', no: '00', judul: 'Papan Angka' },
        { id: 'negara', no: '00', judul: 'Negara Hari Ini' },
        { id: 'kuasa', no: '01', judul: 'Eksekutif · Presiden & Kabinet' },
        { id: 'pabrik', no: '02', judul: 'Legislatif · Wakil & Undang-Undang' },
        { id: 'hukum', no: '03', judul: 'Yudikatif · Hukum & Vonis' },
        { id: 'aparat', no: '04', judul: 'Aparat · Alat Paksa Negara' },
        { id: 'daerah', no: '05', judul: 'Daerah · Pemerintahan & Anggaran' },
        { id: 'partai', no: '06', judul: 'Partai & Kepentingan' },
        { id: 'janji', no: '07', judul: 'Janji & Program' },
      ],
    },
    {
      label: 'MALAM · GERAK II — KEADAAN NEGERI',
      rows: [
        { id: 'oligarki', no: '08', judul: 'Republik Oligarki' },
        { id: 'ekonomi', no: '09', judul: 'Pasar yang Tipis' },
        { id: 'dunia', no: '10', judul: 'Dunia' },
        { id: 'lingkungan', no: '11', judul: 'Sumber Daya Alam' },
        { id: 'hening', no: '—', judul: 'Yang Tidak Dihitung' },
      ],
    },
    {
      label: 'NUSANTARA · LAMPIRAN',
      rows: [
        { id: 'manusia', no: 'I', judul: 'Manusia' },
        { id: 'hayati', no: 'II', judul: 'Hayati & Ekosistem' },
        { id: 'rupa', no: 'III', judul: 'Rupa' },
        { id: 'pustaka', no: 'IV', judul: 'Pustaka & Pikiran' },
        { id: 'almanak', no: 'V', judul: 'Almanak' },
        { id: 'ruang-main', no: '◻', judul: 'Ruang Main' },
      ],
    },
  ];
  const SEMUA = GRUP.flatMap((g) => g.rows);

  let buka = $state(false);
  let aktif = $state('');
  let hitung = $state('—');
  // the register under the corner: over the dark act the fold turns paper,
  // over the light acts it stays ink — always the page's opposite
  let gelap = $state(false);
  let panelEl: HTMLElement | undefined = $state();

  function pergi(id: string) {
    dispatch({ cmd: 'scroll_to', params: { anchor: id } });
    buka = false;
  }

  onMount(() => {
    // which section is under the reader: the last section whose top passed
    // the upper third of the viewport wins
    const els = SEMUA.map((r) => document.getElementById(r.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) aktif = e.target.id;
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    els.forEach((el) => io.observe(el));

    // which register owns the bottom-right corner: watch a thin band along
    // the viewport's bottom edge; whichever [data-register] section crosses
    // it decides the fold's face
    const regEls = Array.from(document.querySelectorAll<HTMLElement>('[data-register]'));
    const ioReg = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) gelap = e.target.getAttribute('data-register') === 'mesin';
        }
      },
      { rootMargin: '-92% 0px -2% 0px' },
    );
    regEls.forEach((el) => ioReg.observe(el));

    // countdown to the next print run (17.00 WIB = 10.00 UTC)
    const tick = () => {
      const now = new Date();
      const target = new Date(now);
      target.setUTCHours(10, 0, 0, 0);
      if (target.getTime() <= now.getTime()) target.setUTCDate(target.getUTCDate() + 1);
      const s = Math.floor((target.getTime() - now.getTime()) / 1000);
      const hh = String(Math.floor(s / 3600)).padStart(2, '0');
      const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
      const ss = String(s % 60).padStart(2, '0');
      hitung = `${hh}.${mm}.${ss}`;
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => { io.disconnect(); ioReg.disconnect(); clearInterval(t); };
  });

  $effect(() => {
    if (buka) panelEl?.querySelector<HTMLElement>('.di-row.kini, .di-row')?.focus();
  });
</script>

<div class="di" class:gelap>
  {#if buka}
    <nav class="di-panel" bind:this={panelEl} aria-label="Daftar isi edisi">
      <header class="di-kepala mono">
        <span>DAFTAR ISI</span>
        <button class="di-tutup mono" onclick={() => (buka = false)}>TUTUP ✕</button>
      </header>
      <div class="di-scroll" data-lenis-prevent>
        {#each GRUP as g (g.label)}
          <p class="di-grup mono">{g.label}</p>
          {#each g.rows as r (r.id)}
            <button class="di-row" class:kini={aktif === r.id} onclick={() => pergi(r.id)}>
              <span class="di-no mono">{r.no}</span>
              <span class="di-judul">{r.judul}</span>
              {#if aktif === r.id}<span class="di-kini mono">← DI SINI</span>{/if}
            </button>
          {/each}
        {/each}
      </div>
      <footer class="di-kaki mono">PEMBARUAN BERIKUTNYA <b class="num">{hitung}</b> · DICETAK 2× SEHARI</footer>
    </nav>
  {/if}

  <button
    class="di-curl"
    class:buka
    aria-label={buka ? 'Tutup daftar isi' : 'Buka daftar isi'}
    aria-expanded={buka}
    onclick={() => (buka = !buka)}
  >
    <i class="di-fold" aria-hidden="true"></i>
    <span class="di-curl-k mono" aria-hidden="true">DAFTAR ISI</span>
  </button>
</div>

<svelte:window onkeydown={(e) => { if (e.key === 'Escape' && buka) buka = false; }} />

<style>
  /* the fold's two faces: over light acts an ink corner, over the dark act
     a paper corner — always the page's opposite, so it reads as the page
     BEHIND showing through the lifted corner */
  .di {
    position: fixed; right: 0; bottom: 0; z-index: 141;
    --fold: #15130e; --fold-teks: #ece2cb;
  }
  .di.gelap { --fold: #ece2cb; --fold-teks: #15130e; }

  /* the folded corner: a lifted page wedge, flush in the true corner */
  .di-curl {
    position: relative;
    width: 88px; height: 88px;
    background: none; border: none; padding: 0; cursor: pointer;
    overflow: visible;
    filter: drop-shadow(-4px -4px 10px rgba(0, 0, 0, 0.28));
  }
  .di-fold {
    position: absolute; right: 0; bottom: 0;
    display: block;
    width: 74px; height: 74px;
    clip-path: polygon(100% 0, 0 100%, 100% 100%);
    background: linear-gradient(315deg, var(--fold) 55%, color-mix(in oklab, var(--fold) 78%, var(--fold-teks)) 100%);
    transition: width 0.25s var(--ease-out), height 0.25s var(--ease-out), background 0.4s;
  }
  .di-curl:hover .di-fold, .di-curl.buka .di-fold { width: 88px; height: 88px; }
  .di-curl-k {
    position: absolute; right: -6px; bottom: 24px;
    width: 74px; text-align: center;
    font-size: 6.5px; letter-spacing: 0.18em; color: var(--fold-teks);
    transform: rotate(-45deg);
    transition: color 0.4s;
    pointer-events: none;
  }

  /* the unfolded sheet: a dark plated panel, self-themed like the terminal */
  .di-panel {
    position: absolute;
    right: 10px;
    bottom: 74px;
    width: min(340px, calc(100vw - 24px));
    display: flex; flex-direction: column;
    --t-bg: #15130e; --t-ink: #ece2cb; --t-muted: #9a917f; --t-accent: #e8500a; --t-line: rgba(236, 226, 203, 0.16);
    color: var(--t-ink);
    background: var(--t-bg);
    border: 1px solid var(--t-line);
    box-shadow: 0 24px 60px -24px rgba(0, 0, 0, 0.75);
    transform-origin: bottom right;
    animation: di-buka 0.28s var(--ease-out);
  }
  .di-panel::before, .di-panel::after {
    content: '+'; position: absolute; z-index: 1;
    font-family: var(--font-mono); font-size: 11px; line-height: 1; color: var(--t-muted);
  }
  .di-panel::before { top: 0; left: 0; transform: translate(-50%, -50%); }
  .di-panel::after { bottom: 0; right: 0; transform: translate(50%, 50%); }
  @keyframes di-buka {
    from { opacity: 0; transform: translateY(12px) scale(0.97); }
    to { opacity: 1; transform: none; }
  }
  @media (prefers-reduced-motion: reduce) { .di-panel { animation: none; } .di-fold { transition: none; } }

  .di-kepala {
    display: flex; justify-content: space-between; align-items: baseline; gap: 12px;
    padding: 11px 16px; border-bottom: 1px solid var(--t-line);
    font-size: 9.5px; letter-spacing: 0.2em; color: var(--t-muted);
  }
  .di-tutup { background: none; border: none; cursor: pointer; color: var(--t-muted); font-size: 8.5px; letter-spacing: 0.14em; padding: 2px 0; }
  .di-tutup:hover { color: var(--t-accent); }

  .di-scroll { overflow-y: auto; max-height: min(56dvh, 480px); overscroll-behavior: contain; padding: 6px 0 10px; }
  .di-grup { font-size: 7.5px; letter-spacing: 0.2em; color: var(--t-muted); padding: 12px 16px 5px; }
  .di-row {
    display: flex; align-items: baseline; gap: 10px; width: 100%;
    background: none; border: none; cursor: pointer; text-align: left;
    padding: 6px 16px; color: var(--t-ink);
    font-family: var(--font-body, inherit); font-size: 13px; line-height: 1.35;
  }
  .di-row:hover { background: color-mix(in oklab, var(--t-ink) 7%, transparent); }
  .di-row.kini { color: var(--t-accent); }
  .di-no { flex: 0 0 22px; font-size: 9px; letter-spacing: 0.08em; color: var(--t-muted); }
  .di-row.kini .di-no { color: var(--t-accent); }
  .di-judul { flex: 1; }
  .di-kini { font-size: 7.5px; letter-spacing: 0.14em; color: var(--t-accent); white-space: nowrap; }

  .di-kaki {
    padding: 10px 16px 12px; border-top: 1px solid var(--t-line);
    font-size: 8px; letter-spacing: 0.16em; color: var(--t-muted);
  }
  .di-kaki b { color: var(--t-ink); font-weight: 500; }
</style>
