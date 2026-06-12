<script lang="ts">
  /**
   * Ingatan: the archive act's hero — one framed plate a day, rotating
   * through registers of memory: this day in history (live from the
   * official Wikimedia feed when reachable), an indigenous people's
   * profile, an endemic species, a cultural artifact. Deterministic
   * rotation; the same plate for every reader. The fallback deck is
   * curated, so the frame never hangs empty.
   */
  import { onMount } from 'svelte';

  type Plat = { jenis: string; judul: string; teks: string; chip: string; tahun?: string };

  const HARI = Math.floor(Date.now() / 86_400_000);

  const DECK: Plat[] = [
    {
      jenis: 'PROFIL NUSANTARA',
      judul: 'Orang Mee (Ekagi)',
      teks: 'Penutur bahasa Mee di dataran tinggi Paniai, penjaga sistem hitung berbasis dua puluh dan ekonomi kulit kerang mege yang berabad-abad mengatur nilai jauh sebelum rupiah. Danau Tigi, Tage, dan Paniai adalah halaman rumah mereka.',
      chip: 'wikipedia · suku mee',
    },
    {
      jenis: 'ALAM · ENDEMIK',
      judul: 'Cendrawasih raja (Cicinnurus regius)',
      teks: 'Burung sebesar genggaman dengan dua kawat ekor melingkar hijau; menari terbalik di dahan untuk meminang. Hanya ada di hutan dataran rendah Papua — dan di dokumen izin konsesi, kolom fauna terdampak.',
      chip: 'gbif · cicinnurus regius',
    },
    {
      jenis: 'BUDAYA',
      judul: 'Noken, tas yang dirajut dari kepala',
      teks: 'Dianyam dari serat kulit kayu dan digantung di dahi, noken adalah satu-satunya tas yang masuk daftar warisan budaya UNESCO yang perlu perlindungan mendesak (2012). Diturunkan ibu ke anak; tidak ada dua noken yang sama.',
      chip: 'unesco · ich 00619',
    },
    {
      jenis: 'LUKISAN',
      judul: 'Penangkapan Pangeran Diponegoro (Raden Saleh, 1857)',
      teks: 'Raden Saleh melukis ulang adegan penangkapan versi pelukis Belanda Pieneman — tetapi menukar sudut pandangnya: Diponegoro berdiri tegak, Belanda digambar berkepala besar sedikit karikatural. Perspektif adalah pernyataan.',
      chip: 'galeri nasional · 1857',
    },
  ];

  let plat = $state<Plat>(DECK[HARI % DECK.length]!);
  let liveSejarah = $state(false);

  onMount(async () => {
    // alternate days lead with history; the feed is official and CORS-open
    if (HARI % 2 === 0) return;
    try {
      const d = new Date();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const res = await fetch(`https://api.wikimedia.org/feed/v1/wikipedia/id/onthisday/events/${mm}/${dd}`, { signal: AbortSignal.timeout(6000) });
      const data = (await res.json()) as { events?: { text: string; year?: number; pages?: { titles?: { normalized?: string } }[] }[] };
      const ev = data.events?.find((e) => /indonesia|nusantara|jakarta|batavia|hindia/i.test(e.text)) ?? data.events?.[0];
      if (ev) {
        plat = {
          jenis: 'HARI INI DALAM SEJARAH',
          judul: ev.pages?.[0]?.titles?.normalized ?? `Tahun ${ev.year ?? '—'}`,
          teks: ev.text,
          chip: `wikipedia id · ${dd}/${mm}`,
          tahun: ev.year ? String(ev.year) : undefined,
        };
        liveSejarah = true;
      }
    } catch { /* the curated deck stands in */ }
  });
</script>

<div class="ih" data-rise data-no-stempel>
  <header class="ih-head mono">
    <span>LAMPIRAN A · INGATAN · PLAT BERGANTI TIAP TERBIT</span>
    <span class="ih-live" class:on={liveSejarah}>{liveSejarah ? '● LANGSUNG' : '○ KURASI'}</span>
  </header>
  <div class="ih-body">
    {#if plat.tahun}
      <p class="ih-tahun display num">{plat.tahun}</p>
    {/if}
    <span class="eyebrow">{plat.jenis}</span>
    <h3 class="ih-judul fig">{plat.judul}</h3>
    <p class="ih-teks">{plat.teks}</p>
    <button class="chip"><span class="tick">⊙</span>{plat.chip}</button>
  </div>
</div>

<style>
  .ih {
    border: 1px solid var(--line);
    outline: 1px solid var(--line);
    outline-offset: 6px;
    background: var(--card);
  }
  .ih-head {
    display: flex; justify-content: space-between; gap: 10px;
    font-size: 9px; letter-spacing: 0.2em; color: var(--muted);
    border-bottom: 1px solid var(--line);
    padding: 10px 18px;
  }
  .ih-live { letter-spacing: 0.14em; }
  .ih-live.on { color: var(--accent2); }
  .ih-body { padding: clamp(20px, 3.5vw, 38px); position: relative; }
  .ih-tahun {
    position: absolute; top: 6px; right: 18px;
    font-family: 'Fraunces Variable', serif; font-weight: 340;
    font-size: clamp(40px, 6vw, 84px);
    color: transparent;
    -webkit-text-stroke: 1.2px var(--line);
    line-height: 1;
  }
  .ih-judul { font-size: clamp(26px, 4vw, 44px); color: var(--ink); margin: 8px 0 12px; max-width: 18ch; line-height: 1.1; }
  .ih-teks { font-size: 15.5px; line-height: 1.65; max-width: 58ch; }
  .ih-body .chip { margin-top: 16px; }
</style>
