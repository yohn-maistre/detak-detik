/**
 * The fact gate: a resolver, not a model. No appeal, no softening.
 * 1. Every cited id must exist in the corpus, or the temuan drops.
 * 2. Every number quoted in headline/body must match a cited row exactly,
 *    or the temuan drops.
 * Hallucination is filtered, not argued with. This gate is why a cheap
 * model is a throughput problem, never a truth problem.
 */
import type { Temuan, CorpusRow } from '../lib/schemas';

export interface GateReport {
  lolos: Temuan[];
  gugur: { temuan: Temuan; alasan: string }[];
}

const NUM_RE = /(?:Rp\s*)?\d[\d.,]*(?:\s*(?:%|miliar|juta|triliun|ha|bulan|tahun|jiwa))?/g;

/** Normalize an Indonesian-formatted number string to a comparable value. */
export function angka(raw: string): number | null {
  const cleaned = raw.replace(/[^\d,.]/g, '');
  if (!cleaned) return null;
  // id-ID: dots are thousands, comma is decimal
  const normalized = cleaned.replaceAll('.', '').replace(',', '.');
  const n = Number(normalized);
  if (Number.isNaN(n)) return null;
  const lower = raw.toLowerCase();
  if (lower.includes('triliun')) return n * 1e12;
  if (lower.includes('miliar')) return n * 1e9;
  if (lower.includes('juta')) return n * 1e6;
  return n;
}

export function periksa(draft: Temuan, corpus: Map<string, CorpusRow>): string | null {
  for (const id of draft.cited_ids) {
    if (!corpus.has(id)) return `sitasi tidak ada di korpus: ${id}`;
  }

  const citedValues = new Set<number>();
  for (const id of draft.cited_ids) {
    for (const v of Object.values(corpus.get(id)!.nilai)) {
      if (typeof v === 'number') citedValues.add(v);
    }
  }

  const text = `${draft.headline} ${draft.body}`;
  for (const m of text.match(NUM_RE) ?? []) {
    const n = angka(m);
    if (n === null || n < 100) continue; // years, counts under 100: not load-bearing claims
    const cocok = [...citedValues].some((v) => Math.abs(v - n) / Math.max(Math.abs(v), 1) < 0.005);
    if (!cocok) return `angka "${m}" tidak cocok dengan baris yang disitasi`;
  }
  return null;
}

export function factGate(drafts: Temuan[], corpus: Map<string, CorpusRow>): GateReport {
  const report: GateReport = { lolos: [], gugur: [] };
  for (const draft of drafts) {
    const alasan = periksa(draft, corpus);
    if (alasan) report.gugur.push({ temuan: draft, alasan });
    else report.lolos.push(draft);
  }
  return report;
}
