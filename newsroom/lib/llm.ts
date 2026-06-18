/**
 * The model lane for the newsroom (loop 1's narrator). NIM is OpenAI-compatible;
 * we ask for a JSON object and Zod-validate it. No framework: a plain fetch with
 * retries. If no key is present (local/CI without secret), returns null and the
 * desk falls back to a deterministic, number-only finding — the gate is what
 * guarantees truth, the model only phrases it.
 */
const NIM_BASE = (process.env.NIM_BASE_URL ?? 'https://integrate.api.nvidia.com/v1').replace(/\/$/, '');
const NIM_KEY = process.env.NIM_API_KEY;
const MODEL = process.env.MODEL_PRIMARY ?? 'qwen/qwen3.5-397b-a17b';

export function modelAvailable(): boolean {
  return Boolean(NIM_KEY);
}

/** One JSON-returning chat call, validated by `parse`. Retries `tries` times,
 *  appending the caller's feedback to the user message between attempts. */
export async function chatJSON<T>(
  system: string,
  user: string,
  parse: (raw: unknown) => T | null,
  opts: { tries?: number; feedback?: () => string | null } = {},
): Promise<T | null> {
  if (!NIM_KEY) return null;
  const tries = opts.tries ?? 2;
  let extra = '';
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(`${NIM_BASE}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${NIM_KEY}` },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: extra ? `${user}\n\nPERBAIKI: ${extra}` : user },
          ],
          temperature: 0.2,
          max_tokens: 800,
          response_format: { type: 'json_object' },
        }),
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) continue;
      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const txt = data.choices?.[0]?.message?.content?.trim() ?? '';
      const obj = JSON.parse(txt.replace(/^```json\s*|\s*```$/g, ''));
      const val = parse(obj);
      if (val) return val;
      extra = opts.feedback?.() ?? 'Balas HANYA JSON valid sesuai skema.';
    } catch {
      extra = opts.feedback?.() ?? 'Balas HANYA JSON valid sesuai skema.';
    }
  }
  return null;
}
