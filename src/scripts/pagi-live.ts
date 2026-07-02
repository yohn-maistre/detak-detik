/**
 * pagi-live: progressive enhancement for the live edition. The page is built
 * static with the (data contoh) constants; after load this fetches the live
 * RSS headlines (worker /ticker) and the published edition (worker /edisi)
 * and updates the SSR DOM in place. Nothing fetched / unreachable → the
 * baked-in markup stays, so first paint and offline are intact.
 * Surfaces fed here: the KILAS ticker, the Temuan Utama lead, the Act II
 * Temuan Redaksi board, and the Angka Edisi odometer (via choreo's hook).
 * The Rak Kabar island feeds itself through lib/edition (onEdisi).
 */
const AKSARA_URL = (import.meta.env.PUBLIC_AKSARA_URL as string | undefined)?.replace(/\/$/, '');

const esc = (s: unknown) =>
  String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] ?? c));

type Item = { src?: string; teks?: string; url?: string };
type Temuan = { temuan_id?: string; lens?: string; headline?: string; body?: string };
type Edisi = {
  edisi?: number;
  sesi?: string;
  lead?: string;
  dek?: string;
  angka_edisi?: { nilai?: number; prefix?: string; label?: string };
  temuan?: Temuan[];
};

const link = (url: string | undefined, inner: string, cls: string) =>
  url ? `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener">${inner}</a>` : inner;

function renderTicker(items: Item[]) {
  const tr = document.getElementById('ticker-track');
  if (!tr) return;
  const one = items
    .map((t) => `${link(t.url, `<span class="src">${esc(t.src ?? '')}</span> ${esc(t.teks)}`, 'ticker-link')} <span class="sep">●</span>`)
    .join(' ');
  tr.innerHTML = one + ' ' + one; // duplicate track for the seamless marquee
}

/** The Act II findings board: every gated finding, ranked by the editor. */
function renderTemuanBoard(temuan: Temuan[]) {
  const grid = document.getElementById('temuan-grid');
  if (!grid || !temuan.length) return;
  grid.innerHTML = temuan
    .slice(0, 6)
    .map((t, i) => `
      <article class="temuan">
        <span class="ghost-num num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
        <div class="temuan-head"><span class="temuan-lens mono">${esc(t.lens ?? '')}</span><span class="mono">${esc(t.temuan_id ?? '')}</span></div>
        <h3 class="temuan-headline display">${esc(t.headline ?? '')}</h3>
        <p class="temuan-body">${esc(t.body ?? '')}</p>
      </article>`)
    .join('');
  const src = document.getElementById('temuan-src');
  if (src) src.textContent = 'LANGSUNG · RUANG REDAKSI';
}

function applyEdisi(ed: Edisi | null) {
  if (!ed) return;
  const lead = ed.temuan?.[0]; // editor ranks the lead first
  const setText = (id: string, v?: string) => { const el = document.getElementById(id); if (el && v) el.textContent = v; };
  if (lead?.headline) setText('ku-judul', lead.headline);
  if (ed.dek) setText('ku-dek', ed.dek);
  // the Angka Edisi lives once, as the Act II odometer; choreo exposes a hook so
  // the live number re-rolls in place (and re-prices through the denom buttons).
  if (ed.angka_edisi?.nilai != null) {
    const setAngka = (window as Window & { setAngkaEdisi?: (n: number, label?: string) => void }).setAngkaEdisi;
    if (setAngka) setAngka(ed.angka_edisi.nilai, ed.angka_edisi.label);
    setText('angka-label-src', '(langsung · ruang redaksi)');
  }
  if (ed.temuan?.length) renderTemuanBoard(ed.temuan);
}

if (AKSARA_URL) {
  void (async () => {
    try {
      const res = await fetch(`${AKSARA_URL}/ticker`, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const d: unknown = await res.json();
        const items = (Array.isArray(d) ? d : (d as { items?: Item[] }).items ?? []).filter((x: Item) => x?.teks);
        if (items.length) renderTicker(items);
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
