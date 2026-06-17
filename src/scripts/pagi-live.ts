/**
 * pagi-live: progressive enhancement for Act I's morning front. The page is
 * built static with the (data contoh) constants; after load this fetches the
 * live RSS headlines (worker /ticker) and the published edition (worker /edisi)
 * and updates the SSR DOM in place. Nothing fetched / unreachable → the baked-in
 * markup stays, so first paint and offline are intact. Keeps Astro's scoped
 * styles untouched (we rewrite content, not structure/classes).
 */
const AKSARA_URL = (import.meta.env.PUBLIC_AKSARA_URL as string | undefined)?.replace(/\/$/, '');

const esc = (s: unknown) =>
  String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] ?? c));

type Item = { src?: string; teks?: string; url?: string };

function renderTicker(items: Item[]) {
  const tr = document.getElementById('ticker-track');
  if (!tr) return;
  const one = items.map((t) => `<span class="src">${esc(t.src ?? '')}</span> ${esc(t.teks)} <span class="sep">●</span>`).join(' ');
  tr.innerHTML = one + ' ' + one; // duplicate track for the seamless marquee
}

function renderRingkas(items: Item[]) {
  const ol = document.getElementById('rp-list');
  if (!ol) return;
  ol.innerHTML = items
    .slice(0, 5)
    .map((t) => `<li class="rp-item"><span class="rp-src mono">${esc(t.src ?? '')}</span><span class="rp-teks">${esc(t.teks)}</span></li>`)
    .join('');
}

type Edisi = {
  lead?: string;
  dek?: string;
  angka_edisi?: { nilai?: number; prefix?: string; label?: string };
  temuan?: { lens?: string; headline?: string }[];
  agenda?: { jam?: string; teks?: string; tag?: string }[];
};

function applyEdisi(ed: Edisi | null) {
  if (!ed) return;
  const lead = ed.temuan?.[0]; // editor ranks the lead first
  const setText = (id: string, v?: string) => { const el = document.getElementById(id); if (el && v) el.textContent = v; };
  if (lead?.headline) setText('ku-judul', lead.headline);
  if (ed.dek) setText('ku-dek', ed.dek);
  if (ed.angka_edisi?.nilai != null) {
    setText('ku-angka-n', `${ed.angka_edisi.prefix ?? 'Rp'} ${ed.angka_edisi.nilai.toLocaleString('id-ID')}`);
    if (ed.angka_edisi.label) setText('ku-angka-lab', ed.angka_edisi.label);
  }
  const ag = document.getElementById('ag-list');
  if (ag && ed.agenda?.length) {
    ag.innerHTML = ed.agenda
      .map((a) => `<li class="ag-item"><span class="ag-jam mono num">${esc(a.jam ?? '')}</span><span class="ag-teks">${esc(a.teks ?? '')}</span><span class="ag-tag mono">${esc(a.tag ?? '')}</span></li>`)
      .join('');
  }
}

if (AKSARA_URL) {
  void (async () => {
    try {
      const res = await fetch(`${AKSARA_URL}/ticker`, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const d: unknown = await res.json();
        const items = (Array.isArray(d) ? d : (d as { items?: Item[] }).items ?? []).filter((x: Item) => x?.teks);
        if (items.length) { renderTicker(items); renderRingkas(items); }
      }
    } catch { /* contoh stays */ }
  })();
  void (async () => {
    try {
      const res = await fetch(`${AKSARA_URL}/edisi`, { signal: AbortSignal.timeout(6000) });
      if (res.status === 200) applyEdisi((await res.json()) as Edisi);
    } catch { /* contoh stays */ }
  })();
}
