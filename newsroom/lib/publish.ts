/**
 * Publish the finished edition to the live site: POST it to the worker, which
 * writes KV (edisi:current). The site reads that at runtime — no rebuild. This
 * is loop 3's "update a real system" step. Needs AKSARA_URL + EDISI_TOKEN.
 */
export async function publishEdisi(edisi: unknown): Promise<boolean> {
  const url = (process.env.AKSARA_URL ?? process.env.PUBLIC_AKSARA_URL)?.replace(/\/$/, '');
  const token = process.env.EDISI_TOKEN;
  if (!url || !token) {
    console.log('[publish] AKSARA_URL / EDISI_TOKEN belum diset — edisi tidak dikirim (kering).');
    return false;
  }
  try {
    const r = await fetch(`${url}/edisi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(edisi),
      signal: AbortSignal.timeout(15_000),
    });
    console.log(`[publish] /edisi -> ${r.status}`);
    return r.ok;
  } catch (e) {
    console.error('[publish] gagal:', e);
    return false;
  }
}
