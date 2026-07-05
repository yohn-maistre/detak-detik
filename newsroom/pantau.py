"""
PANTAU NEGARA — the shared core every activity lane runs on (§13.19).

The machine AGENDA ISTANA proved, named and generalized: official
publication -> deterministic parse (regex + word tables, NO model) ->
slim accumulated archive (merge, prune, write-on-change; every row
cites its source URL) -> corpus rows the fact gate can hold temuan to.

Design laws carried by the core:
- stdlib only: every lane must run on a bare CI Python (no pip, no LLM
  keys) so the record grows even while the newsroom sleeps.
- TLS honesty: verified fetch first; on SSL failure only, retry that
  host unverified (go.id chains are routinely incomplete server-side) —
  acceptable because every row is re-checkable at its cited public URL.
- dark source -> the archive stays as-is; absence is logged, never
  crashed on, never papered over.
- window honesty is the CONSUMER's law (§13.18.2): archives carry
  `diambil` so surfaces can label their true span.

Run all lanes:  python -m newsroom.pantau
(the pantau.yml cron's entrypoint; lanes are imported lazily inside
__main__ so a broken lane never takes the others down)
"""

from __future__ import annotations

import json
import re
import ssl
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser
from pathlib import Path

DATA = Path(__file__).resolve().parent / "data"
UA = "detak-detik/1.0 (koran sipil; github.com/yohn-maistre/detak-detik)"
TIMEOUT = 20

BULAN = {
    "januari": 1, "februari": 2, "maret": 3, "april": 4, "mei": 5, "juni": 6,
    "juli": 7, "agustus": 8, "september": 9, "oktober": 10, "november": 11,
    "desember": 12,
}


def ambil(url: str) -> str:
    """Fetch with the house TLS policy (see module docstring)."""
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            return resp.read().decode("utf-8", errors="replace")
    except ssl.SSLError:
        pass
    except Exception as exc:
        if "SSL" not in str(exc) and "certificate" not in str(exc).lower():
            raise
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    with urllib.request.urlopen(req, timeout=TIMEOUT, context=ctx) as resp:
        return resp.read().decode("utf-8", errors="replace")


class _Polos(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.potongan: list[str] = []

    def handle_data(self, data: str) -> None:
        self.potongan.append(data)


def teks_polos(html: str) -> str:
    p = _Polos()
    try:
        p.feed(html)
    except Exception:
        return html
    return " ".join(" ".join(p.potongan).split())


def tanggal_id(teks: str) -> str | None:
    """'17 Juni 2026' -> '2026-06-17' (Indonesian month names)."""
    m = re.search(r"(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})", teks)
    if not m:
        return None
    bulan = BULAN.get(m.group(2).lower())
    if not bulan:
        return None
    try:
        from datetime import date
        return date(int(m.group(3)), bulan, int(m.group(1))).isoformat()
    except ValueError:
        return None


def parse_rss(xml_text: str) -> list[dict]:
    """RSS items -> [{judul, url, terbit, body, ringkas}] (body = full text
    when content:encoded exists, ringkas = description, both tag-stripped)."""
    ns = {"content": "http://purl.org/rss/1.0/modules/content/"}
    items: list[dict] = []
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        return items
    for it in root.iter("item"):
        judul = (it.findtext("title") or "").strip()
        url = (it.findtext("link") or "").strip()
        if not judul or not url:
            continue
        pub = (it.findtext("pubDate") or "").strip()
        try:
            terbit = parsedate_to_datetime(pub).date().isoformat()
        except Exception:
            terbit = datetime.now(timezone.utc).date().isoformat()
        body = it.findtext("content:encoded", default="", namespaces=ns) or ""
        ringkas = it.findtext("description") or ""
        items.append({
            "judul": judul, "url": url, "terbit": terbit,
            "body": teks_polos(body), "ringkas": teks_polos(ringkas)[:280],
        })
    return items


def cocok(aturan: tuple[tuple[str, tuple[str, ...]], ...], teks: str) -> str | None:
    """First-match keyword table (the _MEJA_ATURAN pattern)."""
    for label, kunci in aturan:
        for k in kunci:
            if k in teks:
                return label
    return None


def muat_arsip(path: Path, kunci: str = "baris") -> list[dict]:
    try:
        return list(json.loads(path.read_text(encoding="utf-8")).get(kunci, []))
    except Exception:
        return []


def simpan_arsip(
    path: Path,
    rows: list[dict],
    *,
    catatan: str,
    sumber: list[str],
    kunci: str = "baris",
    maks: int = 600,
    urut: tuple[str, ...] = ("tanggal",),
) -> bool:
    """Newest-first, pruned, written only when content changed (no
    timestamp-only churn in git history)."""
    rows = sorted(
        rows, key=lambda r: tuple(r.get(k) or "" for k in urut), reverse=True,
    )[:maks]
    if muat_arsip(path, kunci) == rows:
        return False
    payload = {
        "_catatan": catatan,
        "_sumber": sumber,
        "diambil": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        kunci: rows,
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")
    return True


if __name__ == "__main__":
    # the pantau.yml entrypoint: run every lane, isolate failures
    hasil: dict[str, object] = {}
    for nama, modul in (
        ("agenda", "newsroom.sources.agenda"),
        ("lembaran", "newsroom.sources.lembaran"),
        ("suara", "newsroom.sources.suara"),
    ):
        try:
            import importlib

            mod = importlib.import_module(modul)
            hasil[nama] = mod.panen()
        except Exception as exc:  # a dark lane never takes the run down
            hasil[nama] = {"gelap": True, "galat": f"{type(exc).__name__}: {exc}"[:200]}
    print(json.dumps(hasil, ensure_ascii=False))
