/**
 * The viz kit contract (§13.13 pillar 3): one Zod schema per drawn form an
 * agent may request. The newsroom emits specs (mirrored loosely in
 * newsroom/models.VizSpec); VizPapan.svelte renders them — and a spec that
 * fails this parse renders NOTHING. Citation law is structural: `sumber` is
 * required on every form, so an uncited figure cannot be drawn at all.
 *
 * Forms map 1:1 onto the site's proven grammar (SkorCabang tiles, the pasar
 * sparklines): stat, bars, dumbbell, waffle, garis. New forms are added HERE
 * first — schema, then renderer — never ad hoc in a component.
 */
import { z } from 'zod';

const dasar = {
  judul: z.string().min(1).max(80),
  sumber: z.string().min(1).max(120),
  catatan: z.string().max(200).optional(),
};

export const vizSpecSchema = z.discriminatedUnion('bentuk', [
  z.object({
    ...dasar,
    bentuk: z.literal('stat'),
    nilai: z.string().min(1).max(24),
    label: z.string().min(1).max(120),
    nada: z.enum(['buruk', 'baik', 'datar']).default('datar'),
  }),
  z.object({
    ...dasar,
    bentuk: z.literal('bars'),
    baris: z.array(z.object({ k: z.string().max(40), v: z.number().finite(), label: z.string().max(24).optional() })).min(2).max(12),
    /** axis ceiling; omitted = max of the series (the axis prints either way) */
    maks: z.number().positive().optional(),
  }),
  z.object({
    ...dasar,
    bentuk: z.literal('dumbbell'),
    a: z.object({ k: z.string().max(30), v: z.number().min(0).max(100) }),
    b: z.object({ k: z.string().max(30), v: z.number().min(0).max(100) }),
    satuan: z.string().max(12),
  }),
  z.object({
    ...dasar,
    bentuk: z.literal('waffle'),
    isi: z.number().int().min(0),
    dari: z.number().int().min(1).max(200),
    label: z.string().min(1).max(120),
  }),
  z.object({
    ...dasar,
    bentuk: z.literal('garis'),
    seri: z.array(z.number().finite()).min(6).max(120),
    label0: z.string().max(20),
    label1: z.string().max(20),
  }),
]);

export type VizSpec = z.infer<typeof vizSpecSchema>;

/** Validate one raw spec. Invalid specs are dropped, never drawn. */
export function parseVizSpec(raw: unknown): VizSpec | null {
  const r = vizSpecSchema.safeParse(raw);
  return r.success ? r.data : null;
}
