/**
 * The nightly pipeline, run by .github/workflows/newsroom.yml at 04.30 and
 * 16.30 WIB. v0: wiring + gates exist; the desks land lens by lens
 * (Hukum first, per build order).
 *
 *   fresh artifacts -> desks (parallel) -> fact gate -> Redaktur Hukum
 *   -> editor -> layout (opening camera) -> edisi.json + published log
 */
import { factGate } from './gate/factGate';
import { temuanSchema, type Temuan, type CorpusRow } from './lib/schemas';

async function main() {
  const corpus = new Map<string, CorpusRow>(); // v1: loaded from Parquet artifacts
  const drafts: Temuan[] = []; // v1: desks emit drafts via NIM structured output

  const valid = drafts.filter((d) => temuanSchema.safeParse(d).success);
  const gate = factGate(valid, corpus);

  // Redaktur Hukum (lawyer pass), editor, layout: next build phase.
  const log = {
    dijalankan: new Date().toISOString(),
    draft: drafts.length,
    lolos_gerbang: gate.lolos.length,
    gugur: gate.gugur.map((g) => ({ id: g.temuan.temuan_id, alasan: g.alasan })),
  };
  console.log(JSON.stringify(log));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
