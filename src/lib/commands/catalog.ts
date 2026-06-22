/**
 * The command catalog: the app's single vocabulary (law 4).
 * Five speakers (location toggle, clicks, lens tabs, tour scripts, Aksara)
 * all emit these verbs. Nothing changes the view except a validated command.
 * The agent has no special powers; it is one more speaker.
 */
import { z } from 'zod';

export const LENSES = ['hukum', 'anggaran', 'hutan', 'janji', 'papua'] as const;
export const REGISTERS = ['dinas', 'mesin', 'atlas'] as const;

export const commandSchemas = {
  fly_to: z.object({
    kode: z.string().optional(),
    lat: z.number().min(-11).max(6).optional(),
    lon: z.number().min(95).max(141).optional(),
    zoom: z.number().min(3).max(14).optional(),
  }),
  set_lens: z.object({
    lens: z.enum(LENSES),
  }),
  set_scope: z.object({
    scope: z.union([z.literal('nasional'), z.object({ kode: z.string() })]),
  }),
  set_layer: z.object({
    layer: z.string(),
    on: z.boolean(),
  }),
  set_basemap: z.object({
    plat: z.enum(['atlas', 'satelit', 'cuaca', 'malam']),
  }),
  denominate: z.object({
    unit: z.enum(['rp', 'nasi', 'mbg', 'umphari']),
  }),
  set_lensa: z.object({
    kode: z.string(),
  }),
  map_label: z.object({
    kode: z.string().optional(),
    lat: z.number().min(-11).max(6).optional(),
    lon: z.number().min(95).max(141).optional(),
    teks: z.string().max(60),
    sub: z.string().max(40).optional(),
  }),
  map_choropleth: z.object({
    metric: z.enum(['miskin', 'ipm', 'dokter', 'ump', 'pegawai', 'tpt', 'mati']),
    judul: z.string().max(40).optional(),
  }),
  lapor_lokasi: z.object({
    lat: z.number().min(-11).max(6),
    lon: z.number().min(95).max(141),
  }),
  highlight: z.object({
    ids: z.array(z.string()).max(40),
  }),
  sorot: z.object({
    ref: z.string(),
    type: z.enum(['underline', 'circle', 'box', 'strike-through', 'bracket']).default('underline'),
    color: z.string().max(24).optional(),
    off: z.boolean().default(false),
  }),
  scroll_to: z.object({
    anchor: z.string(),
  }),
  open_temuan: z.object({
    temuan_id: z.string(),
  }),
  say: z.object({
    teks: z.string().max(280),
    cited_ids: z.array(z.string()).default([]),
    tahan_ms: z.number().min(600).max(12000).default(3500),
  }),
} as const;

export type CommandName = keyof typeof commandSchemas;

export type Command = {
  [K in CommandName]: { cmd: K; params: z.infer<(typeof commandSchemas)[K]> };
}[CommandName];

export const tourStepSchema = z.object({
  cmd: z.string(),
  params: z.record(z.string(), z.unknown()),
  narasi: z.string().optional(),
  tahan_ms: z.number().min(300).max(15000).default(2500),
});

export const tourSchema = z.object({
  tour_id: z.string(),
  judul: z.string(),
  asal: z.enum(['opener', 'generated', 'newsroom']),
  langkah: z.array(tourStepSchema).min(1).max(30),
});

export type Tour = z.infer<typeof tourSchema>;

/** Validate one raw command object. Invalid commands are dropped, never executed. */
export function parseCommand(raw: unknown): Command | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const { cmd, params } = raw as { cmd?: string; params?: unknown };
  if (!cmd || !(cmd in commandSchemas)) return null;
  const result = commandSchemas[cmd as CommandName].safeParse(params ?? {});
  if (!result.success) return null;
  return { cmd, params: result.data } as Command;
}
