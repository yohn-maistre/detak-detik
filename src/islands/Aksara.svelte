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

  const AKSARA_URL = (import.meta.env.PUBLIC_AKSARA_URL as string | undefined)?.replace(/\/$/, '');

  // the edition is the model's whole world: facts in, citations out
  const SISTEM = [
    'Kamu adalah Aksara, suara harian koran sipil DETAK DETIK.',
    'Jawab dalam bahasa Indonesia formal, maksimal tiga kalimat, tanpa opini.',
    'Hanya gunakan fakta dari konteks edisi berikut; jika tidak ada di konteks, katakan datanya belum ada di edisi ini.',
    `Edisi #${EDISI.nomor} (${EDISI.tanggal}). Angka edisi: ${ANGKA_EDISI.prefix} ${ANGKA_EDISI.nilai.toLocaleString('id-ID')} — ${ANGKA_EDISI.label}`,
    ...TEMUAN.map((t) => `Temuan ${t.lens}: ${t.headline}. ${t.body}`),
    `Yang tidak dihitung (${KEHENINGAN.wilayah}): baris "${KEHENINGAN.absen.k}" kosong di statistik resmi; pihak ketiga mencatat ${KEHENINGAN.laneC.teks} (${KEHENINGAN.laneC.chip}).`,
    'Semua angka edisi ini berstatus data contoh.',
  ].join('\n');

  let sibuk = $state(false);

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
            { role: 'system', content: SISTEM },
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
      { cmd: 'scroll_to', params: { anchor: 'depan' }, narasi: 'Edisi pagi #41. Satu koran, dua cetakan sehari.', tahan_ms: 3600 },
      { cmd: 'scroll_to', params: { anchor: 'hukum' }, narasi: 'Gradien Keadilan: vonis dibanding kerugian, dari putusan pengadilan sendiri.', tahan_ms: 5200 },
      { cmd: 'scroll_to', params: { anchor: 'mesin' }, narasi: 'Yang tidak dihitung: baris kosong di statistik resmi juga sebuah dokumen.', tahan_ms: 5600 },
      { cmd: 'scroll_to', params: { anchor: 'atlas' }, narasi: 'Dan peta yang harus awet lima puluh tahun.', tahan_ms: 2800 },
      { cmd: 'fly_to', params: { kode: '9412' }, narasi: 'Mimika. Koordinat hari ini: LS 4°05′ BT 136°53′.', tahan_ms: 5200 },
      { cmd: 'fly_to', params: { kode: '9301' }, narasi: 'Merauke, zona PSN terluas. Dokumen bicara; tidak ada yang menuduh.', tahan_ms: 5200 },
      { cmd: 'scroll_to', params: { anchor: 'depan' }, narasi: 'Selamat membaca. Semua angka membawa kuitansinya.', tahan_ms: 3000 },
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
      tulis('verba: tanya <pertanyaan> · fly_to <kode> · scroll_to <depan|peta|hukum|mesin|atlas> · say <teks> · tur · stop · bersih');
      tulis(`contoh: tanya berapa kerugian bulan ini · fly_to 9412${AKSARA_URL ? '' : ' · (tanya: lajur belum terpasang)'}`);
      return;
    }
    if (baris === 'bersih') { riwayat = []; return; }
    if (baris === 'tur') { tulis('memutar tur pembuka …'); buka = false; void playTour(TUR_PEMBUKA); return; }
    if (baris === 'stop') { stopTour(); tulis('tur dihentikan.'); return; }

    const [cmd, ...rest] = baris.split(/\s+/);
    const arg = rest.join(' ');
    if (cmd === 'tanya') {
      if (!arg) { tulis('tanya apa? contoh: tanya berapa kerugian negara bulan ini', 'err'); return; }
      if (!sibuk) void tanya(arg);
      return;
    }
    let ok = false;
    if (cmd === 'fly_to') ok = dispatch({ cmd, params: { kode: arg } });
    else if (cmd === 'scroll_to') ok = dispatch({ cmd, params: { anchor: arg } });
    else if (cmd === 'say') ok = dispatch({ cmd, params: { teks: arg, cited_ids: [], tahan_ms: 3500 } });
    else { tulis(`verba tidak dikenal: ${cmd}. perintah tak valid tidak pernah dieksekusi.`, 'err'); return; }
    tulis(ok ? 'ok · perintah lolos katalog' : 'ditolak · parameter tidak valid', ok ? 'out' : 'err');
  }

  onMount(() => {
    const t = setTimeout(() => {
      dispatch({ cmd: 'say', params: { teks: 'Mau saya tunjukkan edisi ini? Buka terminal lalu ketik "tur".', cited_ids: [], tahan_ms: 6000 } });
    }, 6500);
    return () => clearTimeout(t);
  });
</script>

<div class="aksara" data-no-stempel>
  <div id="aksara-bubble" class="bubble mono" aria-live="polite"></div>

  {#if buka}
    <div class="term card">
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
        <button class="chip" onclick={() => dispatch({ cmd: 'fly_to', params: { kode: '9532' } })}>✈ Puncak</button>
        <button class="chip" onclick={() => dispatch({ cmd: 'scroll_to', params: { anchor: 'mesin' } })}>↓ Yang tidak dihitung</button>
      </div>
    </div>
  {/if}

  <button class="pill mono" onclick={() => (buka = !buka)} aria-expanded={buka}>
    <span class="pill-cursor">▮</span> AKSARA
  </button>
</div>

<style>
  .aksara { position: fixed; left: 16px; bottom: 16px; z-index: 140; }
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

  .term {
    position: absolute;
    left: 0;
    bottom: calc(100% + 10px);
    width: min(420px, calc(100vw - 40px));
    padding: 0;
    overflow: hidden;
  }
  .term {
    background-image: repeating-linear-gradient(0deg, color-mix(in oklab, var(--ink) 3%, transparent) 0 1px, transparent 1px 4px);
  }
  .term-head {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 10px;
    letter-spacing: 0.18em;
    padding: 10px 14px;
    border-bottom: 1px solid var(--line);
    color: var(--muted);
  }
  .term-head > span:nth-child(2) { flex: 1; }
  .term-dots { display: inline-flex; gap: 4px; }
  .term-dots i { width: 7px; height: 7px; border-radius: 50%; border: 1px solid var(--muted); }
  .term-dots i:first-child { background: var(--accent); border-color: var(--accent); }
  .term-x { background: none; border: none; cursor: pointer; color: var(--muted); }
  .term-log { max-height: 200px; overflow-y: auto; padding: 12px 14px; font-size: 11.5px; line-height: 1.7; }
  .term-log .r-in { color: var(--accent); }
  .term-log .r-err { color: var(--accent2); font-style: italic; }
  .term-in { display: flex; gap: 8px; padding: 10px 14px; border-top: 1px solid var(--line); }
  .term-prompt { color: var(--accent); }
  .term-in input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    color: var(--ink);
    font-size: 12px;
  }
  .term-quick { display: flex; flex-wrap: wrap; gap: 7px; padding: 0 14px 14px; }
</style>
