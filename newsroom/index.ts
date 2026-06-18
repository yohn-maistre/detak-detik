/**
 * The newsroom, run by .github/workflows/newsroom.yml at 04.30 and 16.30 WIB.
 *
 * A vanilla TypeScript orchestrator (no agent framework — the fact-gate is the
 * grader), mapped to the four loops:
 *   loop 3 (event)        : the cron triggers this; it POSTs the edition to KV.
 *   loop 1 (agent)        : each desk surfaces a signal, the model phrases it.
 *   loop 2 (verification) : every drafted finding must pass the fact-gate
 *                           (cited ids exist + numbers match the corpus);
 *                           on failure the model is re-prompted with the reason.
 *   loop 4 (hill-climbing): every run logs its findings + gate verdicts (below)
 *                           as the trace store to tune desk prompts later.
 *
 * v1 (B): one "pulsa" desk over keyless public signals (quakes, rupiah) + the
 * RSS ticker, producing a real, cited, daily-changing front. The deeper beats
 * (hukum/anggaran/hutan/janji) clone this desk shape over their corpora next.
 */
import { temuanSchema, type Temuan, type CorpusRow } from './lib/schemas';
import { periksa } from './gate/factGate';
import { chatJSON, modelAvailable } from './lib/llm';
import { gatherSignals } from './lib/sources';
import { publishEdisi } from './lib/publish';

const fmtId = (n: number) => new Intl.NumberFormat('id-ID').format(n);

// deterministic edition number: #41 = pagi, 11 Jun 2026; two sessions a day
const nowWib = new Date(Date.now() + 7 * 3600_000);
const sesi: 'pagi' | 'petang' = nowWib.getUTCHours() < 12 ? 'pagi' : 'petang';
const EPOCH = Date.UTC(2026, 5, 11);
const hari = Math.floor((Date.UTC(nowWib.getUTCFullYear(), nowWib.getUTCMonth(), nowWib.getUTCDate()) - EPOCH) / 86_400_000);
const EDISI_NO = 41 + Math.max(0, hari) * 2 + (sesi === 'petang' ? 1 : 0);

/** the pulse desk: the day's strongest open signal, narrated + gated */
async function deskPulsa(corpus: CorpusRow[]): Promise<Temuan | null> {
  const map = new Map(corpus.map((r) => [r.id, r]));
  const gempa = map.get('gempa:harian');
  const kurs = map.get('kurs:usdidr');

  let cand: Temuan | null = null;
  if (gempa) {
    const j = Number(gempa.nilai.jumlah);
    const m = String(gempa.nilai.magnitudo_tertinggi).replace('.', ',');
    cand = {
      temuan_id: `tmn-${EDISI_NO}-pulsa`, edisi: EDISI_NO, lens: 'data_hilang', kode: 'nasional',
      headline: `${j} gempa tercatat di wilayah Indonesia dalam 24 jam terakhir`,
      body: `Tercatat ${j} gempa di kepulauan dalam 24 jam terakhir; yang terkuat bermagnitudo ${m}. Angka dari katalog seismik terbuka, diperbarui tiap edisi.`,
      cited_ids: ['gempa:harian'], skor: 0.6, signature_viz: 'ledger',
    };
  } else if (kurs) {
    const k = Number(kurs.nilai.kurs);
    cand = {
      temuan_id: `tmn-${EDISI_NO}-pulsa`, edisi: EDISI_NO, lens: 'harga', kode: 'nasional',
      headline: `Rupiah pada Rp ${fmtId(k)} per dolar AS`,
      body: `Kurs acuan hari ini Rp ${fmtId(k)} per dolar AS, dari sumber nilai tukar terbuka.`,
      cited_ids: ['kurs:usdidr'], skor: 0.5, signature_viz: 'wave',
    };
  }
  if (!cand) return null;

  if (modelAvailable()) {
    let reason = '';
    const refined = await chatJSON<Temuan>(
      'Kamu redaktur DETAK DETIK. Tulis SATU temuan sebagai JSON, bahasa Indonesia formal, tanpa opini, hanya menyebut angka yang ADA pada DATA. Skema: {temuan_id,edisi,lens,kode,headline(<=160 char),body(<=900 char),cited_ids,skor(0..1),signature_viz}.',
      `DATA: ${JSON.stringify(corpus)}\nDRAF: ${JSON.stringify(cand)}\nPertajam headline & body; pertahankan cited_ids dan angka persis dari DATA.`,
      (obj) => {
        const p = temuanSchema.safeParse(obj);
        if (!p.success) { reason = 'JSON tidak sesuai skema Temuan.'; return null; }
        const r = periksa(p.data, map);
        if (r) { reason = r; return null; }
        return p.data;
      },
      { tries: 3, feedback: () => reason },
    );
    if (refined) return refined;
  }
  return periksa(cand, map) ? null : cand; // deterministic finding is already gate-safe
}

function pickAngka(corpus: CorpusRow[]) {
  const map = new Map(corpus.map((r) => [r.id, r]));
  const gempa = map.get('gempa:harian');
  const kurs = map.get('kurs:usdidr');
  if (gempa) return { nilai: Number(gempa.nilai.jumlah), label: 'gempa tercatat di wilayah Indonesia, 24 jam terakhir', cited_ids: ['gempa:harian'] };
  if (kurs) return { nilai: Number(kurs.nilai.kurs), prefix: 'Rp', label: 'kurs rupiah terhadap dolar AS hari ini', cited_ids: ['kurs:usdidr'] };
  return null;
}

async function main() {
  const aksaraUrl = process.env.AKSARA_URL ?? process.env.PUBLIC_AKSARA_URL;
  const { corpus, headlines } = await gatherSignals(aksaraUrl);

  const lead = corpus.length ? await deskPulsa(corpus) : null;
  const angka = pickAngka(corpus);

  console.log(JSON.stringify({
    dijalankan: new Date().toISOString(),
    edisi: EDISI_NO, sesi,
    sinyal: corpus.map((c) => c.id),
    headlines: headlines.length,
    model: modelAvailable(),
    lead: lead?.headline ?? null,
  }));

  if (!corpus.length || !angka) {
    console.log('[newsroom] tak ada sinyal terbuka — edisi lama dibiarkan, tidak ditimpa.');
    return;
  }

  const edisi = {
    edisi: EDISI_NO,
    terbit: new Date().toISOString(),
    sesi,
    angka_edisi: angka,
    lead: lead?.temuan_id ?? '',
    dek: lead ? 'Tanda paling menonjol dari data terbuka pagi ini, diperiksa terhadap sumbernya.' : undefined,
    temuan: lead ? [{ lens: lead.lens, headline: lead.headline, body: lead.body }] : [],
    ticker: headlines,
  };

  await publishEdisi(edisi);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
