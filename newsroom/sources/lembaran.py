"""
The LEMBARAN NEGARA lane: what actually became law, dated and cited.

Source: peraturan.bpk.go.id (JDIH BPK — the one legal index that answers
datacenter IPs; probed + structure mapped 2026-07-05, cookbook:
docs/research/2026-07-05-pantau-legislatif-yudikatif.md). The Search
page is newest-first, 10 cards/page, plain HTML — we poll PAGE 1 ONLY
per jenis each run (6 requests), and fetch a detail page only for rows
the archive has never seen (the delta is ~0-3/day nationally), where the
canonical dates live (Tanggal Penetapan / Pengundangan).

This one lane feeds three branches: legislatif (UU/Perpu = what the
lawmaking machine finished), eksekutif (PP/Perpres/Keppres/Inpres = the
regulation stream; the SKOR "Perpres & PP diterbitkan" tile), and — via
the jenis=18 umbrella, a later wave — daerah (Perda). Regime-agnostic:
the gazette outlives every government.

Deterministic throughout; stdlib only (models imported lazily so the
pantau cron runs keyless). Every row cites its /Details/ URL.
"""

from __future__ import annotations

import json
import re
import time
from datetime import date
from pathlib import Path

from ..pantau import DATA, ambil, tanggal_id

_ARSIP = DATA / "uu_lembaran.json"
_HOST = "https://peraturan.bpk.go.id"
_SEARCH = _HOST + "/Search?keywords=&tentang=&nomor=&jenis={j}"

# jenis ids from the page's own <select> (cookbook §2)
JENIS: dict[str, str] = {
    "8": "UU", "9": "Perpu", "10": "PP",
    "11": "Perpres", "12": "Keppres", "13": "Inpres",
}
SIMPAN_MAKS = 800

# title anchors live inside the fs-2 fw-bold card div (status-relation
# links are also /Details/ hrefs — this selector excludes them)
_RE_KARTU = re.compile(
    r'fs-2 fw-bold[^"]*"\s*>\s*<a href="(/Details/(\d+)/([^"]+))"\s*>\s*(.*?)\s*</a>',
    re.S,
)
_RE_SLUG = re.compile(r"no-(\d+[a-z]*)-tahun-(\d{4})")


def _detail_tanggal(url: str) -> dict:
    """The canonical dates from a /Details/ page. None = fetch failed
    (retry a later run); '' = page fetched but the date is absent there
    (documented absence, never retried)."""
    keluar: dict = {"ditetapkan": None, "diundangkan": None}
    try:
        html = ambil(url)
    except Exception:
        return keluar
    for kunci, label in (("ditetapkan", "Tanggal Penetapan"), ("diundangkan", "Tanggal Pengundangan")):
        m = re.search(label + r".{0,200}?(\d{1,2}\s+[A-Za-z]+\s+\d{4})", html, re.S)
        keluar[kunci] = tanggal_id(m.group(1)) if m else ""
    return keluar


def muat_lembaran() -> list[dict]:
    from ..pantau import muat_arsip

    return muat_arsip(_ARSIP, "peraturan")


_BUDGET_DETAIL = 40  # polite cap on /Details fetches per run; the year
                     # backlog converges over a few cron runs, never in one


def _kartu(html: str) -> list[dict]:
    keluar = []
    for path, did, slug, judul in _RE_KARTU.findall(html):
        m = _RE_SLUG.search(slug)
        keluar.append({
            "id": did,
            "url": _HOST + path,
            "nomor": m.group(1) if m else None,
            "tahun": int(m.group(2)) if m else None,
            "judul": re.sub(r"\s+", " ", judul).strip(),
        })
    return keluar


def panen() -> dict:
    """Poll page 1 per jenis + a bounded current-year backfill; detail-fetch
    (canonical dates) only for rows the archive has never dated, within a
    per-run budget — the archive CONVERGES to the full current year over a
    few runs instead of hammering the host once."""
    from ..pantau import simpan_arsip

    arsip = {r["url"]: r for r in muat_lembaran()}
    baru = 0
    gelap = True
    galat: str | None = None
    sisa_detail = _BUDGET_DETAIL
    tahun_ini = date.today().year

    def _serap(html: str, jenis: str) -> int:
        nonlocal baru, sisa_detail
        segar = 0
        for row in _kartu(html):
            if row["url"] in arsip:
                continue
            row["jenis"] = jenis
            row["ditetapkan"] = row["diundangkan"] = None
            if sisa_detail > 0:
                time.sleep(1)
                row.update(_detail_tanggal(row["url"]))
                sisa_detail -= 1
            arsip[row["url"]] = row
            baru += 1
            segar += 1
        return segar

    for jid, jenis in JENIS.items():
        try:
            html = ambil(_SEARCH.format(j=jid))
        except Exception as exc:
            galat = f"{type(exc).__name__}: {exc}"[:160]
            continue
        gelap = False
        _serap(html, jenis)
        # current-year backfill: a few more pages while they still yield.
        # p=1 of the year filter largely overlaps the unfiltered page 1, so
        # a zero there is expected — only a zero on p>1 means "caught up".
        for p in range(1, 5):
            try:
                html = ambil(_SEARCH.format(j=jid) + f"&tahun={tahun_ini}&p={p}")
            except Exception:
                break
            if _serap(html, jenis) == 0 and p > 1:
                break
            time.sleep(2)
        time.sleep(2)

    # rows archived beyond an earlier budget get their dates on later runs
    for row in arsip.values():
        if sisa_detail <= 0:
            break
        if row.get("diundangkan") is None and row.get("ditetapkan") is None:
            time.sleep(1)
            row.update(_detail_tanggal(row["url"]))
            sisa_detail -= 1

    rows = list(arsip.values())
    if not gelap:
        simpan_arsip(
            _ARSIP, rows,
            catatan=(
                "Arsip lembaran — peraturan pusat terbaru per jenis dari "
                "peraturan.bpk.go.id (JDIH BPK), dipanen halaman-1-per-jenis oleh "
                "newsroom/sources/lembaran.py (deterministik, tanpa model); tanggal "
                "penetapan/pengundangan dari halaman Details, hanya untuk baris baru. "
                "Setiap baris mengutip URL dokumennya."),
            sumber=[_HOST],
            kunci="peraturan",
            maks=SIMPAN_MAKS,
            urut=("diundangkan", "ditetapkan", "tahun"),
        )
    lapor = {"total_arsip": len(rows), "baru": baru, "gelap": gelap}
    if gelap and galat:
        lapor["galat"] = galat
    return lapor


async def gather_lembaran() -> tuple[list, dict]:
    """Corpus rows: year-to-date counts per jenis + the newest documents."""
    from ..models import CorpusRow

    ringkas = panen()
    rows_arsip = muat_lembaran()
    tahun_ini = date.today().year
    hitung = {j: 0 for j in JENIS.values()}
    for r in rows_arsip:
        if r.get("tahun") == tahun_ini and r.get("jenis") in hitung:
            hitung[r["jenis"]] += 1
    nilai: dict = {f"{j.lower()}_{tahun_ini}": float(n) for j, n in hitung.items()}
    nilai["sumber"] = "peraturan.bpk.go.id"
    nilai["catatan"] = "hitungan arsip halaman-1; angka minimum, bukan total resmi"
    rows = [CorpusRow(id="lembaran:tahun_berjalan", nilai=nilai)]
    for r in rows_arsip[:15]:
        rows.append(CorpusRow(id=f"lembaran:{r['id']}", nilai={
            "jenis": r.get("jenis") or "",
            "nomor": f"{r.get('nomor')}/{r.get('tahun')}",
            "judul": (r.get("judul") or "")[:160],
            "diundangkan": r.get("diundangkan") or "",
            "url": r["url"],
        }))
    ringkas["tahun_berjalan"] = hitung
    return rows, ringkas


if __name__ == "__main__":
    print(json.dumps(panen(), ensure_ascii=False))
