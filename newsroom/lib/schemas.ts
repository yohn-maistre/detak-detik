/**
 * The newsroom's typed artifacts. Plain TS + Zod, a fixed nightly DAG:
 * desks (parallel) -> fact gate -> lawyer -> editor -> layout -> edisi.json.
 * Mastra is the upgrade path, not the starting point (docs/NEWSROOM.md).
 */
import { z } from 'zod';

export const temuanSchema = z.object({
  temuan_id: z.string(),
  edisi: z.number().int(),
  lens: z.enum(['hukum', 'anggaran', 'hutan', 'janji', 'papua', 'harga', 'data_hilang']),
  kode: z.string(),
  headline: z.string().max(160),
  body: z.string().max(900),
  cited_ids: z.array(z.string()).min(1),
  skor: z.number().min(0).max(1),
  signature_viz: z.enum(['scatter', 'struk', 'ember', 'sankey', 'ledger', 'wave', 'ganda']),
});
export type Temuan = z.infer<typeof temuanSchema>;

export const edisiSchema = z.object({
  edisi: z.number().int(),
  terbit: z.string(),
  sesi: z.enum(['pagi', 'petang']),
  angka_edisi: z.object({
    nilai: z.number(),
    label: z.string(),
    cited_ids: z.array(z.string()).min(1),
  }),
  lead: z.string(),
  temuan: z.array(z.string()),
  tajuk: z.object({ teks: z.string(), cited_ids: z.array(z.string()) }).optional(),
  kamera_pembuka: z.string().optional(),
  log: z.string().optional(),
});
export type Edisi = z.infer<typeof edisiSchema>;

/** A corpus row as the gate sees it: id -> the numbers that row contains. */
export type CorpusRow = { id: string; nilai: Record<string, number | string> };
