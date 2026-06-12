/**
 * The dispatcher: one reducer, validated commands in, choreography out.
 * Handlers register per verb; islands subscribe on mount. Every meaningful
 * state change serializes into the URL (law 4: every state is a URL).
 */
import { parseCommand, tourSchema, type Command, type CommandName, type Tour } from './catalog';

type Handler = (params: Command['params']) => void | Promise<void>;

const handlers = new Map<CommandName, Set<Handler>>();
const log: Command[] = [];

export function on<K extends CommandName>(
  cmd: K,
  fn: (params: Extract<Command, { cmd: K }>['params']) => void | Promise<void>,
): () => void {
  if (!handlers.has(cmd)) handlers.set(cmd, new Set());
  handlers.get(cmd)!.add(fn as Handler);
  return () => handlers.get(cmd)?.delete(fn as Handler);
}

export function dispatch(raw: unknown): boolean {
  const command = parseCommand(raw);
  if (!command) {
    console.warn('[detak] perintah ditolak:', raw);
    return false;
  }
  log.push(command);
  syncUrl(command);
  for (const fn of handlers.get(command.cmd) ?? []) {
    void fn(command.params);
  }
  return true;
}

export function commandLog(): readonly Command[] {
  return log;
}

/* Tour replay: same verbs, timed. A tour script and a session log are the
   same species (record, replay, branch). */
let tourAbort: AbortController | null = null;

export async function playTour(raw: unknown): Promise<void> {
  const parsed = tourSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn('[detak] skrip tur tidak valid, dibatalkan');
    return;
  }
  stopTour();
  tourAbort = new AbortController();
  const { signal } = tourAbort;
  for (const step of (parsed.data as Tour).langkah) {
    if (signal.aborted) return;
    if (step.narasi) {
      dispatch({ cmd: 'say', params: { teks: step.narasi, cited_ids: [], tahan_ms: step.tahan_ms } });
    }
    dispatch({ cmd: step.cmd, params: step.params });
    await new Promise((r) => setTimeout(r, step.tahan_ms));
  }
}

export function stopTour(): void {
  tourAbort?.abort();
  tourAbort = null;
}

function syncUrl(command: Command): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (command.cmd === 'set_lens') url.searchParams.set('lens', command.params.lens);
  if (command.cmd === 'fly_to' && command.params.kode) url.searchParams.set('kode', command.params.kode);
  if (command.cmd === 'scroll_to') url.hash = command.params.anchor;
  window.history.replaceState({}, '', url);
}
