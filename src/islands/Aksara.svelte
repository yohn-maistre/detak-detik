<script lang="ts">
  /**
   * Aksara: the paper's voice. A terminal pill that whispers context,
   * expands into a command terminal, and replays the opening tour.
   * It speaks the same vocabulary as every click (law 4); the live
   * NIM loop plugs in behind the same verbs via the Worker later.
   */
  import { onMount } from 'svelte';
  import { dispatch, playTour, stopTour } from '../lib/commands/dispatcher';
  import { ANGKA_EDISI, TEMUAN, KEHENINGAN, EDISI } from '../lib/data/edisi';
  import { onEdisi, type LiveEdisi } from '../lib/edition';

  const AKSARA_URL = (import.meta.env.PUBLIC_AKSARA_URL as string | undefined)?.replace(/\/$/, '');

  // the live edition (newsroom-published) overrides the baked-in contoh when present
  let liveEd = $state<LiveEdisi | null>(null);
  onMount(() => onEdisi((e) => (liveEd = e)));

  // the edition is the model's whole world: facts in, citations out
  function sistem(): string {
    const ed = liveEd;
    const nomor = ed?.edisi ?? EDISI.nomor;
    const angka = ed?.angka_edisi
      ? `${ed.angka_edisi.nilai.toLocaleString('id-ID')} — ${ed.angka_edisi.label}`
      : `${ANGKA_EDISI.prefix} ${ANGKA_EDISI.nilai.toLocaleString('id-ID')} — ${ANGKA_EDISI.label}`;
    const temuan = ((ed?.temuan?.length ? ed.temuan : TEMUAN) as { lens?: string; headline?: string; body?: string }[])
      .map((t) => `Temuan ${t.lens}: ${t.headline}. ${t.body}`);
    return [
      'Kamu adalah Aksara, suara harian koran sipil DETAK DETIK.',
      'Jawab dalam bahasa Indonesia formal, maksimal tiga kalimat, tanpa opini.',
      'Hanya gunakan fakta dari konteks edisi berikut; jika tidak ada di konteks, katakan datanya belum ada di edisi ini.',
      `Edisi #${nomor}. Angka edisi: ${angka}`,
      ...temuan,
      `Yang tidak dihitung (${KEHENINGAN.wilayah}): baris "${KEHENINGAN.absen[0]?.k ?? ''}" kosong di statistik resmi; pihak ketiga mencatat ${KEHENINGAN.laneC.teks} (${KEHENINGAN.laneC.chip}).`,
      ed ? 'Edisi langsung dari ruang redaksi.' : 'Semua angka edisi ini berstatus data contoh.',
    ].join('\n');
  }

  let sibuk = $state(false);
  // the pill/terminal carry the register of whichever act sits behind them, so
  // they invert against the page and always stand out (dark on Pagi, light on Malam)
  let reg = $state('dinas');

  async function tanya(q: string) {
    if (!AKSARA_URL) {
      tulis('lajur model belum terpasang. setel Variable AKSARA_URL di repo lalu deploy ulang.', 'err');
      return;
    }
    sibuk = true;
    tulis('… menyusun jawaban', 'out');
    try {
      const res = await fetch(`${AKSARA_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: sistem() },
            { role: 'user', content: q },
          ],
        }),
        signal: AbortSignal.timeout(30_000),
      });
      const lane = res.headers.get('X-Detak-Lane') ?? '';
      const data = (await res.json()) as { choices?: { message?: { content?: string } }[]; galat?: string };
      riwayat = riwayat.filter((r) => r.teks !== '… menyusun jawaban');
      if (!res.ok || data.galat) {
        tulis(data.galat ?? `lajur model gelap (HTTP ${res.status}).`, 'err');
      } else {
        const teks = data.choices?.[0]?.message?.content?.trim() ?? '(jawaban kosong)';
        tulis(teks + (lane ? `  [lajur: ${lane}]` : ''));
        dispatch({ cmd: 'say', params: { teks: teks.slice(0, 270), cited_ids: [], tahan_ms: 7000 } });
      }
    } catch {
      riwayat = riwayat.filter((r) => r.teks !== '… menyusun jawaban');
      tulis('lajur model tidak terjangkau dari jaringan ini.', 'err');
    } finally {
      sibuk = false;
    }
  }

  let buka = $state(false);
  let input = $state('');
  let riwayat = $state<{ teks: string; jenis: 'in' | 'out' | 'err' }[]>([
    { teks: 'AKSARA v0.1 · terminal perintah. Ketik "bantu" untuk daftar verba.', jenis: 'out' },
  ]);
  let logEl: HTMLElement | undefined = $state();
  let histori: string[] = [];
  let historiIdx = -1;

  function naikTurun(e: KeyboardEvent) {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!histori.length) return;
      historiIdx = historiIdx < 0 ? histori.length - 1 : Math.max(0, historiIdx - 1);
      input = histori[historiIdx]!;
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historiIdx < 0) return;
      historiIdx++;
      input = historiIdx >= histori.length ? '' : histori[historiIdx]!;
      if (historiIdx >= histori.length) historiIdx = -1;
    }
  }

  const TUR_PEMBUKA = {
    tour_id: 'pembuka-041',
    judul: 'Edisi #41 dalam 30 detik',
    asal: 'newsroom' as const,
    langkah: [
      { cmd: 'scroll_to', params: { anchor: 'depan' }, narasi: 'Edisi pagi #41. Pagi: keadaan hari ini. Malam: yang tak ingin dilihat. Nusantara: yang tetap tinggal.', tahan_ms: 4200 },
      { cmd: 'highlight', params: { ids: ['peta'] }, narasi: 'Peta Kabar: lapisan data langsung. Minta saya tunjukkan gempa, kebakaran, atau udara di satu pulau.', tahan_ms: 4400 },
      { cmd: 'highlight', params: { ids: ['lensa'] }, narasi: 'Lensa Wilayah: cari provinsimu, lihat di mana ia berdiri di antara 38 provinsi.', tahan_ms: 4400 },
      { cmd: 'highlight', params: { ids: ['kuasa'] }, narasi: 'Eksekutif: presiden dan kabinet terbesar sejak 1966, dan seberapa terbuka pertanggungjawabannya.', tahan_ms: 4800 },
      { cmd: 'highlight', params: { ids: ['hukum'] }, narasi: 'Yudikatif: vonis dibanding kerugian, dari putusan pengadilan sendiri.', tahan_ms: 4400 },
      { cmd: 'highlight', params: { ids: ['aparat'] }, narasi: 'Aparat: anggaran terbesar negara, pertanggungjawaban yang paling jarang sampai ke pengadilan.', tahan_ms: 4800 },
      { cmd: 'highlight', params: { ids: ['hening'] }, narasi: 'Yang tidak dihitung: baris yang kosong di statistik resmi juga sebuah dokumen.', tahan_ms: 4400 },
      { cmd: 'scroll_to', params: { anchor: 'nusantara' }, narasi: 'Dan penutup: tanah, hayati, dan rupa. Semua angka membawa kuitansinya.', tahan_ms: 3600 },
    ],
  };

  function tulis(teks: string, jenis: 'in' | 'out' | 'err' = 'out') {
    riwayat = [...riwayat, { teks, jenis }];
    requestAnimationFrame(() => logEl?.scrollTo({ top: logEl.scrollHeight }));
  }

  function jalankan() {
    const baris = input.trim();
    if (!baris) return;
    tulis(`> ${baris}`, 'in');
    histori.push(baris);
    historiIdx = -1;
    input = '';

    if (baris === 'bantu') {
      tulis('verba: tanya <pertanyaan> · lensa <jakarta|papua|bali|jabar|sulsel|aceh|…> · sorot <bagian> · fly_to <kode> · scroll_to <depan|peta|lensa|sensus|kuasa|pabrik|hukum|aparat|daerah|janji|hening|ekonomi|lingkungan|rumah-tangga|dunia|nusantara> · say <teks> · tur · stop · bersih');
      tulis(`contoh: tanya berapa kerugian bulan ini · fly_to 9412${AKSARA_URL ? '' : ' · (tanya: lajur belum terpasang)'}`);
      return;
    }
    if (baris === 'bersih') { riwayat = []; return; }
    if (baris === 'tur') { tulis('memutar tur pembuka …'); buka = false; void playTour(TUR_PEMBUKA); return; }
    if (baris === 'stop') { stopTour(); tulis('tur dihentikan.'); return; }

    const [cmd, ...rest] = baris.split(/\s+/);
    const arg = rest.join(' ');
    if (cmd === 'lensa') {
      const peta: Record<string, string> = { nasional: 'nasional', jakarta: '31', dki: '31', papua: '94', bali: '51', jabar: '32', sulsel: '73', aceh: '11' };
      const kode = peta[arg.toLowerCase()] ?? arg;
      const ok2 = dispatch({ cmd: 'set_lensa', params: { kode } });
      tulis(ok2 ? `lensa wilayah: ${arg || 'nasional'}` : `daerah tak dikenal: ${arg}. coba: jakarta, papua, bali, jabar, sulsel, aceh`, ok2 ? 'out' : 'err');
      return;
    }
    if (cmd === 'tanya') {
      if (!arg) { tulis('tanya apa? contoh: tanya berapa kerugian negara bulan ini', 'err'); return; }
      if (!sibuk) void tanya(arg);
      return;
    }
    if (cmd === 'lapor') {
      const [la, lo] = arg.split(/[\s,]+/).map(Number);
      const ok2 = Number.isFinite(la) && Number.isFinite(lo) && dispatch({ cmd: 'lapor_lokasi', params: { lat: la!, lon: lo! } });
      tulis(ok2 ? `laporan titik: ${la}, ${lo}` : 'lapor butuh koordinat: lapor <lintang> <bujur>, mis. lapor -6.2 106.8', ok2 ? 'out' : 'err');
      return;
    }
    let ok = false;
    if (cmd === 'fly_to') ok = dispatch({ cmd, params: { kode: arg } });
    else if (cmd === 'scroll_to') ok = dispatch({ cmd, params: { anchor: arg } });
    else if (cmd === 'sorot') ok = dispatch({ cmd: 'sorot', params: { ref: arg.split(/[\s,]+/).filter(Boolean)[0] ?? '', type: 'underline', off: false } });
    else if (cmd === 'highlight') ok = dispatch({ cmd: 'highlight', params: { ids: arg.split(/[\s,]+/).filter(Boolean) } });
    else if (cmd === 'say') ok = dispatch({ cmd, params: { teks: arg, cited_ids: [], tahan_ms: 3500 } });
    else { tulis(`verba tidak dikenal: ${cmd}. perintah tak valid tidak pernah dieksekusi.`, 'err'); return; }
    tulis(ok ? 'ok · perintah lolos katalog' : 'ditolak · parameter tidak valid', ok ? 'out' : 'err');
  }

  onMount(() => {
    const t = setTimeout(() => {
      dispatch({ cmd: 'say', params: { teks: 'Mau saya tunjukkan edisi ini? Buka terminal lalu ketik "tur".', cited_ids: [], tahan_ms: 6000 } });
    }, 6500);

    // follow the act in view so the pill inverts against the current paper
    const acts = Array.from(document.querySelectorAll<HTMLElement>('[data-act]'));
    const ratios = new Map<Element, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) ratios.set(e.target, e.isIntersecting ? e.intersectionRatio : 0);
        let best: HTMLElement | null = null;
        let bestR = -1;
        for (const a of acts) {
          const r = ratios.get(a) ?? 0;
          if (r >= bestR) { bestR = r; best = a; }
        }
        if (best && bestR > 0) reg = best.getAttribute('data-register') ?? 'dinas';
      },
      { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1] }
    );
    acts.forEach((a) => io.observe(a));

    return () => { clearTimeout(t); io.disconnect(); };
  });
</script>

<div class="aksara" data-no-stempel data-register={reg}>
  <div id="aksara-bubble" class="bubble mono" aria-live="polite"></div>

  {#if buka}
    <div class="term card" class:light={reg === 'mesin'}>
      <div class="term-head mono">
        <span class="term-dots" aria-hidden="true"><i></i><i></i><i></i></span>
        <span>AKSARA · TERMINAL PERINTAH</span>
        <button class="term-x mono" onclick={() => (buka = false)}>✕</button>
      </div>
      <div class="term-log mono" bind:this={logEl}>
        {#each riwayat as r}
          <p class="r-{r.jenis}">{r.teks}</p>
        {/each}
      </div>
      <form class="term-in" onsubmit={(e) => { e.preventDefault(); jalankan(); }}>
        <span class="mono term-prompt">&gt;</span>
        <input class="mono" bind:value={input} onkeydown={naikTurun} placeholder="tanya … · tur · fly_to 9412 · bantu" aria-label="Perintah Aksara" />
      </form>
      <div class="term-quick">
        <button class="chip hop" onclick={() => { tulis('> tur', 'in'); buka = false; void playTour(TUR_PEMBUKA); }}>▶ Tur 30 detik</button>
        <button class="chip" onclick={() => dispatch({ cmd: 'highlight', params: { ids: ['lensa'] } })}>↓ Lensa Wilayah</button>
        <button class="chip" onclick={() => dispatch({ cmd: 'highlight', params: { ids: ['kuasa'] } })}>↓ Eksekutif</button>
        <button class="chip" onclick={() => dispatch({ cmd: 'highlight', params: { ids: ['hening'] } })}>↓ Yang tidak dihitung</button>
      </div>
    </div>
  {/if}

  <button class="pill mono" onclick={() => (buka = !buka)} aria-expanded={buka}>
    <span class="pill-cursor">▮</span> AKSARA
  </button>
</div>

<style>
  .aksara { position: fixed; left: 16px; bottom: 16px; z-index: 140; }
  /* inverted chip: ink field, paper text — dark on Pagi, light on Malam */
  .pill {
    font-size: 11px;
    letter-spacing: 0.18em;
    background: var(--ink);
    color: var(--bg);
    border: 1px solid var(--ink);
    padding: 9px 14px;
    cursor: pointer;
    transition: transform 0.25s var(--ease-out);
  }
  .pill:hover { transform: translateY(-2px); }
  .pill-cursor { color: #e8500a; animation: blink 1s steps(1) infinite; }
  @keyframes blink { 50% { opacity: 0; } }

  .bubble {
    position: absolute;
    left: 0;
    bottom: calc(100% + 10px);
    max-width: min(340px, 76vw);
    width: max-content;
    background: var(--ink);
    color: var(--bg);
    font-size: 11.5px;
    line-height: 1.5;
    padding: 9px 12px;
    opacity: 0;
    transform: translateY(6px);
    transition: opacity 0.35s, transform 0.35s var(--ease-out);
    pointer-events: none;
  }
  .bubble::after {
    content: '';
    position: absolute;
    left: 18px;
    top: 100%;
    border: 6px solid transparent;
    border-top-color: var(--ink);
  }
  .bubble:global(.is-talking) { opacity: 1; transform: none; }

  /* the terminal inverts against the page, like the pill: a dark panel over the
     light acts, a cream panel over the dark act. Self-contained theme vars so
     the monochrome dark-register accent never washes out. */
  .term {
    position: absolute;
    left: 0;
    bottom: calc(100% + 10px);
    width: min(420px, calc(100vw - 40px));
    padding: 0;
    overflow: hidden;
    --t-bg: #15130e; --t-ink: #ece2cb; --t-muted: #9a917f; --t-accent: #e8500a; --t-accent2: #cdb47a; --t-line: rgba(236, 226, 203, 0.16);
    color: var(--t-ink);
    background-color: var(--t-bg);
    background-image: repeating-linear-gradient(0deg, color-mix(in oklab, var(--t-ink) 5%, transparent) 0 1px, transparent 1px 4px);
    box-shadow: 0 22px 50px -28px rgba(0, 0, 0, 0.7);
  }
  .term.light {
    --t-bg: #ece2cb; --t-ink: #211b13; --t-muted: #756956; --t-accent: #ad5038; --t-accent2: #8a6a2e; --t-line: rgba(33, 27, 19, 0.16);
  }
  .term-log p { color: var(--t-ink); }
  .term-head {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 10px;
    letter-spacing: 0.18em;
    padding: 10px 14px;
    border-bottom: 1px solid var(--t-line);
    color: var(--t-muted);
  }
  .term-head > span:nth-child(2) { flex: 1; }
  .term-dots { display: inline-flex; gap: 4px; }
  .term-dots i { width: 7px; height: 7px; border-radius: 50%; border: 1px solid var(--t-muted); }
  .term-dots i:first-child { background: var(--t-accent); border-color: var(--t-accent); }
  .term-x { background: none; border: none; cursor: pointer; color: var(--t-muted); }
  .term-log { max-height: 200px; overflow-y: auto; padding: 12px 14px; font-size: 11.5px; line-height: 1.7; }
  .term-log .r-in { color: var(--t-accent); }
  .term-log .r-err { color: var(--t-accent2); font-style: italic; }
  .term-in { display: flex; gap: 8px; padding: 10px 14px; border-top: 1px solid var(--t-line); }
  .term-prompt { color: var(--t-accent); }
  .term-in input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    color: var(--t-ink);
    font-size: 12px;
  }
  .term-in input::placeholder { color: var(--t-muted); }
  .term-quick { display: flex; flex-wrap: wrap; gap: 7px; padding: 0 14px 14px; }
  .term-quick :global(.chip) { color: var(--t-ink); border-color: var(--t-line); background: transparent; }
  .term-quick :global(.chip:hover) { border-color: var(--t-accent); color: var(--t-accent); }
  .term-quick :global(.chip .tick) { color: var(--t-accent); }
</style>
