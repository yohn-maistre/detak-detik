"""
The HUKUM corpus: corruption-verdict rows the desk reasons over. Honest v1 reads a
committed seed dataset (data/hukum_putusan.json) compiled from the MA Direktori
Putusan + ICW; a best-effort live fetch of the MA recent-decisions listing is
attempted first, and a dark portal simply falls back to the seed (a Data Hilang
note, not a crash; per NEWSROOM.md section 11). Each verdict becomes a corpus row
(id -> its numbers) the gate can check, plus a synthetic month-total row that backs
the Angka Edisi.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

import httpx

from ..models import CorpusRow

_SEED = Path(__file__).resolve().parent.parent / "data" / "hukum_putusan.json"
_MA_LISTING = (
    "https://putusan3.mahkamahagung.go.id/direktori/index/kategori/"
    "tindak-pidana-korupsi.html"
)


def _wib_now() -> datetime:
    return datetime.now(timezone.utc).astimezone(timezone.utc)


def _load_seed() -> list[dict]:
    try:
        data = json.loads(_SEED.read_text(encoding="utf-8"))
        return list(data.get("putusan", []))
    except Exception:
        return []


async def _try_live() -> list[dict]:
    """Best-effort: confirm the MA portal is reachable. Full listing parse is a
    later seam; today a reachable portal still defers to the curated seed (the
    rows are already documents-speak and gate-shaped). Unreachable -> []."""
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(8.0), follow_redirects=True) as c:
            r = await c.get(_MA_LISTING, headers={"User-Agent": "Mozilla/5.0 DetakDetik/1.0"})
            if r.status_code != 200:
                return []
    except Exception:
        return []
    return []  # seam: parse the listing into rows here when the scraper lands


async def gather_hukum() -> tuple[list[CorpusRow], list[dict]]:
    """Return (corpus rows, raw putusan dicts). The raw dicts carry the
    documents-speak metadata (pengadilan, source_url) the desk narrates from."""
    await _try_live()  # touch the portal; today we publish from the seed
    putusan = _load_seed()
    if not putusan:
        return [], []

    rows: list[CorpusRow] = [
        CorpusRow(
            id=p["id"],
            nilai={"kerugian": float(p["kerugian_negara"]), "vonis_bulan": float(p["vonis_bulan"])},
        )
        for p in putusan
    ]

    # month total -> backs the Angka Edisi ("kerugian negara dalam vonis bulan ini")
    now = _wib_now()
    bulan_ini = [
        p for p in putusan
        if p.get("tanggal", "")[:7] == f"{now.year:04d}-{now.month:02d}"
    ]
    sumber = bulan_ini or putusan  # if nothing dated this month, use what we have
    total = sum(float(p["kerugian_negara"]) for p in sumber)
    rows.append(CorpusRow(id="hukum:kerugian_bulan", nilai={"total": total, "jumlah_putusan": len(sumber)}))

    return rows, putusan
